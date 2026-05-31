-- Catalog database: tracks all tenants and their configurations.
-- This runs on the `vetcloud_catalog` database, NOT on individual tenant DBs.

CREATE TABLE IF NOT EXISTS tenants (
    id           BIGSERIAL    PRIMARY KEY,
    name         TEXT         NOT NULL,
    slug         TEXT         NOT NULL UNIQUE, -- used as subdomain prefix (e.g. "clinic-a")
    db_url       TEXT         NOT NULL,        -- postgres connection string for this tenant's DB
    plan         TEXT         NOT NULL DEFAULT 'basic', -- basic | pro | enterprise
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    owner_email  TEXT         NOT NULL,        -- contact email of the clinic owner
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_settings (
    tenant_id        BIGINT       PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    clinic_name      TEXT         NOT NULL DEFAULT '',
    primary_color    TEXT         NOT NULL DEFAULT '#3b82f6',
    secondary_color  TEXT         NOT NULL DEFAULT '#1e40af',
    logo_url         TEXT,
    -- Comma-separated list of enabled modules
    enabled_modules  TEXT[]       NOT NULL DEFAULT ARRAY['appointments','clients','patients','records','users'],
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Index for fast slug lookup (happens on every request)
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_is_active ON tenants(is_active);
