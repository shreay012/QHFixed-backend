-- Phase 1 — structured audit log.
-- Replaces the JSONB-blob audit_logs collection for new write paths.
-- Old `audit_logs` table stays for legacy middleware envelopes.

CREATE TABLE IF NOT EXISTS public.audit_logs_v2 (
  _id            CHAR(24) PRIMARY KEY,
  actor_id       CHAR(24),
  actor_role     VARCHAR(32),
  action         VARCHAR(64) NOT NULL,
  resource_type  VARCHAR(32) NOT NULL,
  resource_id    CHAR(24),
  country        VARCHAR(2),
  before         JSONB,
  after          JSONB,
  ip             VARCHAR(64),
  ua             TEXT,
  request_id     VARCHAR(64),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_v2_actor_time_idx
  ON public.audit_logs_v2 (actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_v2_resource_idx
  ON public.audit_logs_v2 (resource_type, resource_id);

CREATE INDEX IF NOT EXISTS audit_v2_country_time_idx
  ON public.audit_logs_v2 (country, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_v2_action_time_idx
  ON public.audit_logs_v2 (action, created_at DESC);
