package config

import (
	"encoding/hex"
	"fmt"
	"os"
	"strconv"
	"time"
)

// Config holds all application configuration loaded from environment variables.
type Config struct {
	// Server
	ServerPort string
	ServerHost string

	// Database (tenant or single)
	DatabaseURL string

	// Catalog database (multi-tenant mode only)
	CatalogDatabaseURL string

	// Single tenant mode (no catalog DB)
	SingleTenant bool

	// API Key for super-admin actions (like creating tenants)
	SuperAdminKey string

	// JWT
	JWTSecret            string
	AccessTokenDuration  time.Duration
	RefreshTokenDuration time.Duration

	// CORS
	AllowedOrigins []string

	// Encryption (AES-256 for sensitive DB values like OIDC secrets)
	// Must be 32 bytes, provided as 64-char hex string via ENCRYPTION_KEY env var
	EncryptionKey []byte

	// OIDC
	OIDCRedirectURL string // e.g. https://vetcloud.gr/api/auth/oidc/callback

	// Environment
	Environment string // "development", "production"
}

// Load reads configuration from environment variables with sensible defaults.
func Load() (*Config, error) {
	cfg := &Config{
		ServerPort:           getEnv("SERVER_PORT", "8080"),
		ServerHost:           getEnv("SERVER_HOST", "0.0.0.0"),
		DatabaseURL:          getEnv("DATABASE_URL", "postgres://admin:password123@localhost:5432/pims_db?sslmode=disable"),
		CatalogDatabaseURL:   getEnv("CATALOG_DATABASE_URL", ""),
		SingleTenant:         getEnvBool("SINGLE_TENANT", true),
		SuperAdminKey:        getEnv("SUPER_ADMIN_KEY", "super-secret-dev-key"),
		JWTSecret:            getEnv("JWT_SECRET", ""),
		AccessTokenDuration:  getEnvDuration("ACCESS_TOKEN_DURATION", 15*time.Minute),
		RefreshTokenDuration: getEnvDuration("REFRESH_TOKEN_DURATION", 7*24*time.Hour),
		AllowedOrigins:       []string{getEnv("CORS_ORIGIN", "http://localhost:5173")},
		OIDCRedirectURL:      getEnv("OIDC_REDIRECT_URL", "http://localhost:8080/api/auth/oidc/callback"),
		Environment:          getEnv("ENVIRONMENT", "development"),
	}

	// Validate required fields
	if cfg.JWTSecret == "" {
		if cfg.Environment == "production" {
			return nil, fmt.Errorf("JWT_SECRET is required in production")
		}
		cfg.JWTSecret = "dev-secret-change-me-in-production-please"
	}

	if cfg.DatabaseURL == "" && cfg.SingleTenant {
		return nil, fmt.Errorf("DATABASE_URL is required in single-tenant mode")
	}

	if !cfg.SingleTenant && cfg.CatalogDatabaseURL == "" {
		return nil, fmt.Errorf("CATALOG_DATABASE_URL is required in multi-tenant mode")
	}

	// Parse ENCRYPTION_KEY (64-char hex → 32 bytes)
	encKeyHex := getEnv("ENCRYPTION_KEY", "")
	if encKeyHex == "" {
		if cfg.Environment == "production" {
			return nil, fmt.Errorf("ENCRYPTION_KEY is required in production (generate: openssl rand -hex 32)")
		}
		// Development fallback — NOT secure, but avoids crash during local dev
		encKeyHex = "0000000000000000000000000000000000000000000000000000000000000000"
	}
	key, err := hex.DecodeString(encKeyHex)
	if err != nil || len(key) != 32 {
		return nil, fmt.Errorf("ENCRYPTION_KEY must be a 64-char hex string (32 bytes)")
	}
	cfg.EncryptionKey = key

	return cfg, nil
}

// Addr returns the server listen address.
func (c *Config) Addr() string {
	return fmt.Sprintf("%s:%s", c.ServerHost, c.ServerPort)
}

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

func getEnvBool(key string, defaultValue bool) bool {
	if value, exists := os.LookupEnv(key); exists {
		b, err := strconv.ParseBool(value)
		if err != nil {
			return defaultValue
		}
		return b
	}
	return defaultValue
}

func getEnvDuration(key string, defaultValue time.Duration) time.Duration {
	if value, exists := os.LookupEnv(key); exists {
		d, err := time.ParseDuration(value)
		if err != nil {
			return defaultValue
		}
		return d
	}
	return defaultValue
}
