-- name: ListPatientsByOwner :many
SELECT * FROM patients
WHERE client_id = $1
ORDER BY name;

-- name: GetPatientByID :one
SELECT * FROM patients WHERE id = $1;

-- name: CreatePatient :one
INSERT INTO patients (
    client_id, name, species, breed, sex,
    birth_date, is_dob_approximate,
    microchip_number, microchip_date,
    is_sterilized, sterilization_date, weight
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
RETURNING *;

-- name: UpdatePatient :one
UPDATE patients SET
    name = $2,
    species = $3,
    breed = $4,
    sex = $5,
    birth_date = $6,
    is_dob_approximate = $7,
    microchip_number = $8,
    microchip_date = $9,
    is_sterilized = $10,
    sterilization_date = $11,
    weight = $12,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeletePatient :exec
DELETE FROM patients WHERE id = $1;

-- name: TransferPatient :one
UPDATE patients SET client_id = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: MarkPatientDeceased :one
UPDATE patients SET is_deceased = true, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: ListAllPatients :many
SELECT p.*, c.first_name AS owner_first_name, c.last_name AS owner_last_name
FROM patients p
JOIN clients c ON p.client_id = c.id
ORDER BY p.name;
