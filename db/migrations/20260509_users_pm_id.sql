-- Add pm_id to users so resources can be grouped under their PM in
-- the /admin/hierarchy endpoint. Idempotent; safe to re-run.
--
-- Backfill strategy: when a resource has no pm_id, the hierarchy
-- endpoint will list it as an orphan. Manual assignment happens via
-- POST /admin/resources (creator passes pmId).
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS pm_id TEXT;

CREATE INDEX IF NOT EXISTS users_pm_id_idx ON users(pm_id) WHERE pm_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS users_parent_country_admin_id_idx
  ON users(parent_country_admin_id) WHERE parent_country_admin_id IS NOT NULL;
