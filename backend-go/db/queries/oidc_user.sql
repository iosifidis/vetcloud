-- name: GetUserByOIDCSub :one
SELECT id, username, email, first_name, last_name, is_active, role_id, client_id, oidc_sub
FROM users
WHERE oidc_sub = $1
LIMIT 1;

-- name: GetUserByEmail :one
SELECT id, username, email, first_name, last_name, is_active, role_id, client_id, oidc_sub
FROM users
WHERE email = $1
LIMIT 1;

-- name: SetUserOIDCSub :exec
UPDATE users
SET oidc_sub = $2, updated_at = NOW()
WHERE id = $1;

-- name: CreateOIDCUser :one
-- Creates a new user for OIDC login (no password, CLIENT role)
INSERT INTO users (username, password_hash, email, first_name, last_name, is_active, role_id, client_id, oidc_sub)
VALUES ($1, '', $2, $3, $4, true, (SELECT id FROM roles WHERE name = 'CLIENT'), $5, $6)
RETURNING id, username, email, first_name, last_name, is_active, role_id, client_id, oidc_sub;
