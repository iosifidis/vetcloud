-- name: ListAppointments :many
SELECT
    a.*,
    c.first_name AS client_first_name, c.last_name AS client_last_name, c.phone AS client_phone,
    p.name AS patient_name, p.species AS patient_species,
    u.username AS vet_username, u.first_name AS vet_first_name, u.last_name AS vet_last_name
FROM appointments a
JOIN clients c ON a.client_id = c.id
JOIN patients p ON a.patient_id = p.id
LEFT JOIN users u ON a.vet_id = u.id
ORDER BY a.start_time DESC;

-- name: GetAppointmentByID :one
SELECT
    a.*,
    c.first_name AS client_first_name, c.last_name AS client_last_name, c.phone AS client_phone,
    p.name AS patient_name, p.species AS patient_species, p.id AS patient_db_id,
    u.username AS vet_username, u.first_name AS vet_first_name, u.last_name AS vet_last_name
FROM appointments a
JOIN clients c ON a.client_id = c.id
JOIN patients p ON a.patient_id = p.id
LEFT JOIN users u ON a.vet_id = u.id
WHERE a.id = $1;

-- name: GetNextAppointmentForVet :one
SELECT
    a.*,
    c.first_name AS client_first_name, c.last_name AS client_last_name,
    p.name AS patient_name
FROM appointments a
JOIN clients c ON a.client_id = c.id
JOIN patients p ON a.patient_id = p.id
WHERE a.vet_id = $1
  AND a.start_time > NOW()
  AND a.status NOT IN ('CANCELLED', 'COMPLETED')
ORDER BY a.start_time ASC
LIMIT 1;

-- name: SearchAppointments :many
SELECT
    a.*,
    c.first_name AS client_first_name, c.last_name AS client_last_name,
    p.name AS patient_name,
    u.first_name AS vet_first_name, u.last_name AS vet_last_name
FROM appointments a
JOIN clients c ON a.client_id = c.id
JOIN patients p ON a.patient_id = p.id
LEFT JOIN users u ON a.vet_id = u.id
WHERE
    c.first_name ILIKE '%' || $1 || '%'
    OR c.last_name ILIKE '%' || $1 || '%'
    OR p.name ILIKE '%' || $1 || '%'
    OR a.reason ILIKE '%' || $1 || '%'
ORDER BY a.start_time DESC;

-- name: CreateAppointment :one
INSERT INTO appointments (client_id, patient_id, vet_id, resource_id, start_time, end_time, reason, notes, status, type)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING *;

-- name: UpdateAppointment :one
UPDATE appointments SET
    client_id = $2,
    patient_id = $3,
    vet_id = $4,
    resource_id = $5,
    start_time = $6,
    end_time = $7,
    reason = $8,
    notes = $9,
    status = $10,
    type = $11,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteAppointment :exec
DELETE FROM appointments WHERE id = $1;

-- name: ReassignAppointments :exec
UPDATE appointments SET vet_id = $2, updated_at = NOW()
WHERE vet_id = $1;
