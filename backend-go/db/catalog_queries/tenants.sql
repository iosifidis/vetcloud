-- name: GetTenantByID :one
SELECT * FROM tenants
WHERE id = $1 LIMIT 1;

-- name: GetTenantBySlug :one
SELECT * FROM tenants
WHERE slug = $1 LIMIT 1;

-- name: ListActiveTenants :many
SELECT * FROM tenants
WHERE is_active = true
ORDER BY name;

-- name: ListAllTenants :many
SELECT * FROM tenants
ORDER BY name;

-- name: CreateTenant :one
INSERT INTO tenants (
  name, slug, db_url, plan, owner_email
) VALUES (
  $1, $2, $3, $4, $5
)
RETURNING *;

-- name: DeactivateTenant :exec
UPDATE tenants
SET is_active = false
WHERE slug = $1;

-- name: ActivateTenant :exec
UPDATE tenants
SET is_active = true
WHERE slug = $1;

-- name: DeleteTenant :exec
DELETE FROM tenants
WHERE slug = $1;

-- name: GetTenantSettings :one
SELECT * FROM tenant_settings
WHERE tenant_id = $1 LIMIT 1;

-- name: UpsertTenantSettings :one
INSERT INTO tenant_settings (
    tenant_id, clinic_name, primary_color, secondary_color, logo_url, enabled_modules, updated_at
) VALUES (
    $1, $2, $3, $4, $5, $6, NOW()
)
ON CONFLICT (tenant_id) DO UPDATE SET
    clinic_name = EXCLUDED.clinic_name,
    primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color,
    logo_url = EXCLUDED.logo_url,
    enabled_modules = EXCLUDED.enabled_modules,
    updated_at = NOW()
RETURNING *;
