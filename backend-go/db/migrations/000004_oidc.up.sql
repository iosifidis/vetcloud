-- 000004_oidc.up.sql
-- OIDC / SSO support for single-clinic deployments
-- Adds: CLIENT role, user↔client link, OIDC subject tracking, app_settings table

-- New role for pet owners who access via SSO portal
INSERT INTO roles (name, permissions) VALUES
  ('CLIENT', '{VIEW_OWN_PATIENTS,VIEW_OWN_APPOINTMENTS}')
ON CONFLICT (name) DO NOTHING;

-- Link users to their client (pet owner) record
-- Used when a CLIENT role user logs in: we know which pets they own
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL;

-- OIDC subject identifier (unique per provider+user)
-- Allows fast re-login without email lookup
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS oidc_sub TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_oidc_sub ON users(oidc_sub)
  WHERE oidc_sub IS NOT NULL;

-- Application-level key-value settings store
-- Used for OIDC config, and other future app settings
CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT        PRIMARY KEY,
  value      TEXT        NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- OIDC settings keys (values inserted by admin via UI):
-- oidc_enabled           TEXT  "true" | "false"
-- oidc_issuer_url        TEXT  e.g. "https://auth.vetcloud.gr/application/o/vetcloud/"
-- oidc_client_id         TEXT  e.g. "abc123def456"
-- oidc_client_secret_enc TEXT  AES-256-GCM encrypted, base64-encoded
