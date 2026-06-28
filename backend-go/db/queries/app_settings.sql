-- name: GetSetting :one
SELECT value FROM app_settings
WHERE key = $1;

-- name: UpsertSetting :exec
INSERT INTO app_settings (key, value, updated_at)
VALUES ($1, $2, NOW())
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- name: GetAllSettings :many
SELECT key, value FROM app_settings
ORDER BY key;

-- name: DeleteSetting :exec
DELETE FROM app_settings WHERE key = $1;
