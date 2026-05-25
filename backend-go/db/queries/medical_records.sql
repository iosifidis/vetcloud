-- name: GetMedicalRecordByAppointment :one
SELECT * FROM medical_records WHERE appointment_id = $1;

-- name: ListMedicalRecordsByPatient :many
SELECT mr.*, a.type AS appointment_type, a.start_time AS visit_date
FROM medical_records mr
LEFT JOIN appointments a ON mr.appointment_id = a.id
WHERE mr.patient_id = $1
ORDER BY mr.created_at DESC;

-- name: ListMedicalRecordsByClient :many
SELECT mr.*, a.type AS appointment_type, a.start_time AS visit_date,
    p.name AS patient_name
FROM medical_records mr
LEFT JOIN appointments a ON mr.appointment_id = a.id
JOIN patients p ON mr.patient_id = p.id
WHERE p.client_id = $1
ORDER BY mr.created_at DESC;

-- name: CreateMedicalRecord :one
INSERT INTO medical_records (appointment_id, patient_id, diagnosis, treatment, notes, symptoms, weight, temperature)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: UpdateMedicalRecord :one
UPDATE medical_records SET
    diagnosis = $2,
    treatment = $3,
    notes = $4,
    symptoms = $5,
    weight = $6,
    temperature = $7,
    updated_at = NOW()
WHERE id = $1
RETURNING *;
