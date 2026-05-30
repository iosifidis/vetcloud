-- name: ListAlertsByPatient :many
SELECT * FROM patient_alerts
WHERE patient_id = $1
ORDER BY created_at DESC;

-- name: GetAlertByID :one
SELECT * FROM patient_alerts WHERE id = $1;

-- name: CreateAlert :one
INSERT INTO patient_alerts (patient_id, alert_type, description, severity, is_active)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: UpdateAlert :one
UPDATE patient_alerts SET
    alert_type  = $2,
    description = $3,
    severity    = $4,
    is_active   = $5
WHERE id = $1
RETURNING *;

-- name: DeleteAlert :exec
DELETE FROM patient_alerts WHERE id = $1;
