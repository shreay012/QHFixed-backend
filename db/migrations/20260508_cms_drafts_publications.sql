-- Phase 2 — CMS drafts + publications with approval workflow.
-- See src/db/schema.js for column comments.

CREATE TABLE IF NOT EXISTS public.cms_drafts (
  _id           CHAR(24) PRIMARY KEY,
  type          VARCHAR(32) NOT NULL,
  scope         VARCHAR(16) NOT NULL,
  key           VARCHAR(200) NOT NULL,
  payload       JSONB NOT NULL,
  status        VARCHAR(16) NOT NULL DEFAULT 'draft',
  author_id     CHAR(24) NOT NULL,
  author_role   VARCHAR(32) NOT NULL,
  reviewer_id   CHAR(24),
  review_note   TEXT,
  reviewed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cms_drafts_status_chk
    CHECK (status IN ('draft','pending','approved','rejected'))
);

CREATE INDEX IF NOT EXISTS cms_drafts_status_idx
  ON public.cms_drafts (status, created_at DESC);
CREATE INDEX IF NOT EXISTS cms_drafts_scope_key_idx
  ON public.cms_drafts (type, scope, key);
CREATE INDEX IF NOT EXISTS cms_drafts_author_idx
  ON public.cms_drafts (author_id);

CREATE TABLE IF NOT EXISTS public.cms_publications (
  _id           CHAR(24) PRIMARY KEY,
  type          VARCHAR(32) NOT NULL,
  scope         VARCHAR(16) NOT NULL,
  key           VARCHAR(200) NOT NULL,
  version       INTEGER NOT NULL,
  payload       JSONB NOT NULL,
  published_by  CHAR(24) NOT NULL,
  published_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  draft_id      CHAR(24)
);

-- Live lookup is "highest version per (type,scope,key)" — a B-tree on
-- (type, scope, key, version DESC) covers it. Avoid a unique index on
-- the triple because we keep history (multiple versions).
CREATE INDEX IF NOT EXISTS cms_pub_live_idx
  ON public.cms_publications (type, scope, key, version DESC);
CREATE INDEX IF NOT EXISTS cms_pub_published_at_idx
  ON public.cms_publications (published_at DESC);
