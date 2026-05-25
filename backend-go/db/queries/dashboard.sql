-- name: GetDashboardStats :one
SELECT
    (SELECT COUNT(*) FROM clients)::INTEGER AS total_clients,
    (SELECT COUNT(*) FROM patients WHERE is_deceased = false)::INTEGER AS total_patients,
    (SELECT COUNT(*) FROM appointments WHERE DATE(start_time) = CURRENT_DATE)::INTEGER AS today_appointments,
    (SELECT COUNT(*) FROM appointments
     WHERE start_time >= DATE_TRUNC('week', CURRENT_DATE)
       AND start_time < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'
    )::INTEGER AS week_appointments;
