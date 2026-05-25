-- 000002_seed_data.up.sql
-- Seed data for development/testing
-- Passwords are bcrypt hash of "password"

-- Seed users (password = "password")
INSERT INTO users (username, password_hash, email, first_name, last_name, is_active, role_id)
VALUES
    ('vet1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'vet1@pims.com', 'John', 'Doe', true, 1),
    ('vet2', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'vet2@pims.com', 'Jane', 'Smith', true, 1),
    ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin@pims.com', 'Admin', 'User', true, 2)
ON CONFLICT (username) DO NOTHING;

-- Seed clients
INSERT INTO clients (first_name, last_name, email, phone, address, afm, gdpr_consent, balance)
VALUES
    ('Alice', 'Johnson', 'alice@example.com', '555-0101', '123 Maple St', '111222333', true, 0),
    ('Bob', 'Williams', 'bob@example.com', '555-0102', '456 Oak Ave', '444555666', true, 0)
ON CONFLICT (email) DO NOTHING;

-- Seed patients
INSERT INTO patients (client_id, name, species, breed, sex, birth_date, weight, microchip_number)
VALUES
    (1, 'Buddy', 'DOG', 'Golden Retriever', 'MALE', '2020-05-10', 25.5, '900111222333444'),
    (2, 'Whiskers', 'CAT', 'Siamese', 'FEMALE', '2019-08-15', 4.2, '900555666777888')
ON CONFLICT (microchip_number) DO NOTHING;

-- Seed appointments
INSERT INTO appointments (client_id, patient_id, vet_id, start_time, end_time, status, type, reason)
VALUES
    (1, 1, 1, NOW() + INTERVAL '1 day' + TIME '10:00', NOW() + INTERVAL '1 day' + TIME '10:30', 'SCHEDULED', 'EXAM', 'Annual Checkup'),
    (2, 2, 2, NOW() + INTERVAL '2 days' + TIME '14:00', NOW() + INTERVAL '2 days' + TIME '14:30', 'SCHEDULED', 'VACCINATION', 'Rabies Vaccination')
ON CONFLICT DO NOTHING;
