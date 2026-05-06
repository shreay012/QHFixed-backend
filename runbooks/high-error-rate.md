# Runbook: High API Error Rate

**Alert:** `APIHighErrorRate`
**Severity:** Critical
**Threshold:** 5xx error rate > 2% for 2 minutes

## Immediate triage (< 5 min)

1. Check Grafana dashboard → API Overview → Error Rate panel.
2. Identify which routes are failing:
   ```
   GET /metrics | grep qh_http_requests_total | grep '" 5'
   ```
3. Check Sentry for the exception type and stack trace.
4. Check application logs:
   ```
   kubectl logs -n quickhire deploy/api --tail=200 -f
   # or on bare-metal:
   journalctl -u quickhire-api -n 200 -f
   ```

## Common causes and fixes

### MongoDB connection refused / timeout
- **Symptom:** `MongoNetworkError` or `MongoServerError` in logs.
- **Fix:** `kubectl exec -n quickhire deploy/api -- node -e "require('./src/config/db.js').connectDb().then(() => process.exit(0))"`
- If unreachable: check MongoDB pod status, restart pod, trigger replica set re-election if needed.
- **Escalate to:** infra team if MongoDB cluster health check fails.

### Redis connection refused
- **Symptom:** `Error: connect ECONNREFUSED` from ioredis.
- **Impact:** Rate limiting disabled, tracking unavailable, BullMQ workers blocked.
- **Fix:** `kubectl rollout restart deploy/redis -n quickhire`
- App degrades gracefully (Redis calls `.catch(() => {})` — core functionality continues).

### Memory / CPU exhaustion (OOM kill)
- **Symptom:** Pod restarts increasing; `OOMKilled` in events.
- **Fix:** `kubectl scale deploy/api -n quickhire --replicas=<current+2>`
- Long-term: profile with `clinic.js flame` or `0x`.

### Dependency gateway down (Razorpay / Stripe)
- **Symptom:** Payment-related 5xx errors only; other routes fine.
- **Fix:** Check gateway status page. Payment errors are isolated — no action needed unless > 30 min.
- Notify finance team via Slack `#alerts-finance`.

### Bad deployment
- **Symptom:** Errors started immediately after a deploy.
- **Fix:**
  ```
  kubectl rollout undo deploy/api -n quickhire
  kubectl rollout status deploy/api -n quickhire
  ```

## Escalation path
- 0–15 min: On-call engineer handles.
- 15–30 min: Escalate to backend lead.
- > 30 min: War room, notify product and ops leads.
