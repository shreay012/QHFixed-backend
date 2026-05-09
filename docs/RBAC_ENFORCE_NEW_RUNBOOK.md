# RBAC Enforce-New Cutover Runbook

Scope: flip `COUNTRY_SCOPE_MODE` from `shadow` to `enforce-new` on prod
(`qhmulticountry.ciadmin.in`) so country_admin/pm/resource roles can no
longer accidentally see cross-country data via missing `applyScope`
calls.

## Pre-flight (do this in order)

1. **Confirm shadow logs are clean** (last 7 days):
   ```sh
   ssh prod 'grep "shadow scope" /var/log/quickhire/api.log | wc -l'
   ```
   Any non-zero count means a route is still bypassing scope. Inspect
   `wouldScope` and `path` fields, fix the route to use `applyScope()`
   (see `src/utils/scope.js`), and wait another 24h before re-checking.

2. **Backfill country on every business table**:
   ```sql
   -- jobs / bookings: infer from user.country
   UPDATE jobs j
   SET country = u.country
   FROM users u
   WHERE j.user_id = u._id AND j.country IS NULL;

   -- payments: same shape
   UPDATE payments p
   SET country = u.country
   FROM users u
   WHERE p.user_id = u._id AND p.country IS NULL;
   ```
   Repeat for `tickets`, `chat_messages`, `kyc_submissions`, `reviews`.
   After backfill, every row that participates in scope must have a
   non-NULL country.

3. **Verify all country_admin/pm/resource users have a country set**:
   ```sql
   SELECT _id, role FROM users
   WHERE role IN ('country_admin','pm','resource')
     AND (country IS NULL OR country = '');
   ```
   Expect zero rows. Any hits → fix in /admin/users before cutover or
   they will get a 403 on every request post-flip.

4. **Run the scope tests**:
   ```sh
   npm test
   ```
   All 7 must pass (`tests/scope.test.js`).

## Cutover

1. Set env on the API host:
   ```sh
   COUNTRY_SCOPE_MODE=enforce-new
   ```
2. Rolling restart of pm2 / systemd (zero-downtime):
   ```sh
   pm2 reload api
   ```
3. **Watch in two windows for 30 min**:
   ```sh
   # Logs — anything 403'd post-flip
   tail -f /var/log/quickhire/api.log | grep -E '403|AUTH_INCOMPLETE_PROFILE'

   # Audit — confirm cross-country attempts are visible
   psql -c "SELECT actor_role, country, COUNT(*) FROM audit_logs_v2
            WHERE created_at > now() - interval '30 minutes'
            GROUP BY 1, 2 ORDER BY 3 DESC;"
   ```

## Rollback

If 403s spike or country_admins lose access to legitimate data:
1. `COUNTRY_SCOPE_MODE=shadow`
2. `pm2 reload api`
3. Diff the 403'd paths against `applyScope` coverage — usually a
   missing wrap on a freshly-added route.

Mode `off` is a panic button only; it disables scope entirely. Never
run there for more than the time it takes to fix-forward.

## Post-cutover (1 week later)

- [ ] Switch `COUNTRY_SCOPE_MODE=enforce-all` (rejects legacy `admin`
      role without country — forces every staff user to be either
      super_admin or have a country).
- [ ] Remove the `legacy: true` branch in country-scope.middleware.js.
- [ ] Drop the `shadow` mode handling from `applyScopeMaybe`.
