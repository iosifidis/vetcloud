-- 000001_init_schema.down.sql
-- Reverse the initial schema migration

DROP TABLE IF EXISTS patient_alerts;
DROP TABLE IF EXISTS medical_records;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS resources;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;
