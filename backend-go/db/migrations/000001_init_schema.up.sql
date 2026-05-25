-- 000001_init_schema.up.sql
-- VetCloud initial database schema

-- Roles
CREATE TABLE IF NOT EXISTS roles (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(50)  NOT NULL UNIQUE,
    permissions TEXT[]       NOT NULL DEFAULT '{}'
);

-- Users (vets, admins)
CREATE TABLE IF NOT EXISTS users (
    id            BIGSERIAL    PRIMARY KEY,
    username      VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email         VARCHAR(255),
    first_name    VARCHAR(100),
    last_name     VARCHAR(100),
    is_active     BOOLEAN      NOT NULL DEFAULT true,
    role_id       BIGINT       REFERENCES roles(id),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Refresh tokens (for JWT refresh flow)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         BIGSERIAL    PRIMARY KEY,
    user_id    BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ  NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

-- Clients (pet owners)
CREATE TABLE IF NOT EXISTS clients (
    id                BIGSERIAL    PRIMARY KEY,
    first_name        VARCHAR(100) NOT NULL,
    last_name         VARCHAR(100) NOT NULL,
    email             VARCHAR(255) NOT NULL UNIQUE,
    phone             VARCHAR(50),
    address           TEXT,
    afm               VARCHAR(20)  UNIQUE,
    adt               VARCHAR(20),
    gdpr_consent      BOOLEAN      DEFAULT false,
    balance           NUMERIC(10,2) NOT NULL DEFAULT 0,
    is_stray_caretaker BOOLEAN     DEFAULT false,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Patients (animals)
CREATE TABLE IF NOT EXISTS patients (
    id                    BIGSERIAL    PRIMARY KEY,
    client_id             BIGINT       NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name                  VARCHAR(100) NOT NULL,
    species               VARCHAR(20)  NOT NULL,
    breed                 VARCHAR(100),
    sex                   VARCHAR(10),
    birth_date            DATE,
    is_dob_approximate    BOOLEAN      DEFAULT false,
    microchip_number      VARCHAR(15)  UNIQUE,
    microchip_date        DATE,
    is_sterilized         BOOLEAN,
    sterilization_date    DATE,
    weight                REAL,
    is_deceased           BOOLEAN      DEFAULT false,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Resources (rooms, equipment)
CREATE TABLE IF NOT EXISTS resources (
    id         BIGSERIAL    PRIMARY KEY,
    name       VARCHAR(100) NOT NULL UNIQUE,
    type       VARCHAR(20)  NOT NULL,
    color_code VARCHAR(7)
);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
    id          BIGSERIAL   PRIMARY KEY,
    client_id   BIGINT      NOT NULL REFERENCES clients(id),
    patient_id  BIGINT      NOT NULL REFERENCES patients(id),
    vet_id      BIGINT      REFERENCES users(id),
    resource_id BIGINT      REFERENCES resources(id),
    start_time  TIMESTAMPTZ NOT NULL,
    end_time    TIMESTAMPTZ NOT NULL,
    reason      TEXT,
    notes       TEXT,
    status      VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    type        VARCHAR(20) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Medical records
CREATE TABLE IF NOT EXISTS medical_records (
    id             BIGSERIAL       PRIMARY KEY,
    appointment_id BIGINT          UNIQUE REFERENCES appointments(id),
    patient_id     BIGINT          NOT NULL REFERENCES patients(id),
    diagnosis      TEXT,
    treatment      TEXT,
    notes          TEXT,
    symptoms       TEXT,
    weight         DOUBLE PRECISION,
    temperature    DOUBLE PRECISION,
    created_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Patient alerts (NEW feature)
CREATE TABLE IF NOT EXISTS patient_alerts (
    id          BIGSERIAL   PRIMARY KEY,
    patient_id  BIGINT      NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    alert_type  VARCHAR(50) NOT NULL,
    description TEXT        NOT NULL,
    severity    VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    is_active   BOOLEAN     DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_appointments_vet_start   ON appointments(vet_id, start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_client      ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient     ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status      ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_patients_client          ON patients(client_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient  ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user      ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash      ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_patient_alerts_patient   ON patient_alerts(patient_id);

-- Seed default roles
INSERT INTO roles (name, permissions) VALUES
    ('VET',   '{"READ_PATIENT","WRITE_PATIENT","CREATE_APPOINTMENT"}'),
    ('ADMIN', '{"ADMIN_ACCESS","READ_PATIENT","WRITE_PATIENT","CREATE_APPOINTMENT"}')
ON CONFLICT (name) DO NOTHING;
