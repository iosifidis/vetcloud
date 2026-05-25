package config

import (
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

	// JWT
	JWTSecret            string
	AccessTokenDuration  time.Duration
	RefreshTokenDuration time.Duration

	// CORS
	AllowedOrigins []string

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
		JWTSecret:            getEnv("JWT_SECRET", ""),
		AccessTokenDuration:  getEnvDuration("ACCESS_TOKEN_DURATION", 15*time.Minute),
		RefreshTokenDuration: getEnvDuration("REFRESH_TOKEN_DURATION", 7*24*time.Hour),
		AllowedOrigins:       []string{getEnv("CORS_ORIGIN", "http://localhost:5173")},
		Environment:          getEnv("ENVIRONMENT", "development"),
	}

	// Validate required fields
	if cfg.JWTSecret == "" {
		if cfg.Environment == "production" {
			return nil, fmt.Errorf("JWT_SECRET is required in production")
		}
		// Use a default for development only
		cfg.JWTSecret = "dev-secret-change-me-in-production-please"
	}

	if cfg.DatabaseURL == "" && cfg.SingleTenant {
		return nil, fmt.Errorf("DATABASE_URL is required in single-tenant mode")
	}

	if !cfg.SingleTenant && cfg.CatalogDatabaseURL == "" {
		return nil, fmt.Errorf("CATALOG_DATABASE_URL is required in multi-tenant mode")
	}

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
