-- 000004_oidc.down.sql
-- Rollback: remove OIDC additions

DROP TABLE IF EXISTS app_settings;

DROP INDEX IF EXISTS idx_users_oidc_sub;

ALTER TABLE users
  DROP COLUMN IF EXISTS oidc_sub;

ALTER TABLE users
  DROP COLUMN IF EXISTS client_id;

DELETE FROM roles WHERE name = 'CLIENT';
