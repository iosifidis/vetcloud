-- name: GetUserByUsername :one
SELECT u.*, r.name AS role_name, r.permissions AS role_permissions
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.username = $1 AND u.is_active = true;

-- name: GetUserByID :one
SELECT u.*, r.name AS role_name, r.permissions AS role_permissions
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.id = $1;

-- name: CreateUser :one
INSERT INTO users (username, password_hash, email, first_name, last_name, role_id)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: ListUsers :many
SELECT u.*, r.name AS role_name
FROM users u
JOIN roles r ON u.role_id = r.id
ORDER BY u.created_at DESC;

-- name: ListVets :many
SELECT u.*, r.name AS role_name
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE r.name = 'VET' AND u.is_active = true
ORDER BY u.first_name;

-- name: UpdateUser :one
UPDATE users SET
    email = COALESCE(sqlc.narg('email'), email),
    first_name = COALESCE(sqlc.narg('first_name'), first_name),
    last_name = COALESCE(sqlc.narg('last_name'), last_name),
    is_active = COALESCE(sqlc.narg('is_active'), is_active),
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeactivateUser :exec
UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1;

-- name: DeleteUser :exec
DELETE FROM users WHERE id = $1;

-- name: GetRoleByName :one
SELECT * FROM roles WHERE name = $1;

-- name: CreateRefreshToken :one
INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetRefreshToken :one
SELECT * FROM refresh_tokens
WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW();

-- name: RevokeRefreshToken :exec
UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1;

-- name: RevokeAllUserRefreshTokens :exec
UPDATE refresh_tokens SET revoked_at = NOW()
WHERE user_id = $1 AND revoked_at IS NULL;

-- name: CleanExpiredRefreshTokens :exec
DELETE FROM refresh_tokens WHERE expires_at < NOW();
