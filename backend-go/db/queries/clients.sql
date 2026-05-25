-- name: ListClients :many
SELECT c.*,
    COUNT(p.id)::INTEGER AS pet_count
FROM clients c
LEFT JOIN patients p ON p.client_id = c.id
GROUP BY c.id
ORDER BY c.last_name, c.first_name;

-- name: GetClientByID :one
SELECT * FROM clients WHERE id = $1;

-- name: SearchClients :many
SELECT c.*,
    COUNT(p.id)::INTEGER AS pet_count
FROM clients c
LEFT JOIN patients p ON p.client_id = c.id
WHERE
    c.first_name ILIKE '%' || $1 || '%'
    OR c.last_name ILIKE '%' || $1 || '%'
    OR c.email ILIKE '%' || $1 || '%'
    OR c.phone ILIKE '%' || $1 || '%'
GROUP BY c.id
ORDER BY c.last_name, c.first_name;

-- name: CreateClient :one
INSERT INTO clients (first_name, last_name, email, phone, address, afm, adt, gdpr_consent, is_stray_caretaker)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING *;

-- name: UpdateClient :one
UPDATE clients SET
    first_name = $2,
    last_name = $3,
    email = $4,
    phone = $5,
    address = $6,
    afm = $7,
    adt = $8,
    gdpr_consent = $9,
    is_stray_caretaker = $10,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteClient :exec
DELETE FROM clients WHERE id = $1;
