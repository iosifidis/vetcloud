-- 000002_seed_data.down.sql
-- Remove seed data

DELETE FROM appointments;
DELETE FROM patients;
DELETE FROM clients;
DELETE FROM users WHERE username IN ('vet1', 'vet2', 'admin');
