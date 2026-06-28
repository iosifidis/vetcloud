// Package settings manages application-level key-value configuration
// stored in the app_settings table (e.g. OIDC configuration).
package settings

import (
	"context"
	"fmt"
	"strings"

	"github.com/iosifidis/vetcloud/internal/crypto"
	"github.com/iosifidis/vetcloud/internal/db"
)

const (
	KeyOIDCEnabled         = "oidc_enabled"
	KeyOIDCIssuerURL       = "oidc_issuer_url"
	KeyOIDCClientID        = "oidc_client_id"
	KeyOIDCClientSecretEnc = "oidc_client_secret_enc"

	KeyClinicName     = "clinic_name"
	KeyPrimaryColor   = "primary_color"
	KeySecondaryColor = "secondary_color"
	KeyLogoURL        = "logo_url"
	KeyEnabledModules = "enabled_modules"
)

// ClinicSettings holds public clinic details + theme info + OIDC enablement status.
type ClinicSettings struct {
	ClinicName     string   `json:"clinicName"`
	PrimaryColor   string   `json:"primaryColor"`
	SecondaryColor string   `json:"secondaryColor"`
	LogoURL        string   `json:"logoUrl"`
	EnabledModules []string `json:"enabledModules"`
	OIDCEnabled    bool     `json:"oidcEnabled"`
}

// OIDCConfig holds the OIDC provider settings for this installation.
type OIDCConfig struct {
	Enabled      bool   `json:"enabled"`
	IssuerURL    string `json:"issuerUrl"`
	ClientID     string `json:"clientId"`
	// ClientSecret is never returned to the client — only used internally
	ClientSecret string `json:"-"`
}

// OIDCConfigResponse is the safe version returned via API (secret masked).
type OIDCConfigResponse struct {
	Enabled      bool   `json:"enabled"`
	IssuerURL    string `json:"issuerUrl"`
	ClientID     string `json:"clientId"`
	SecretSet    bool   `json:"secretSet"` // true if a secret has been saved
}

// Service provides access to app-level settings.
type Service struct {
	q      *db.Queries
	encKey []byte
}

// NewService creates a new settings service.
func NewService(q *db.Queries, encKey []byte) *Service {
	return &Service{q: q, encKey: encKey}
}

// GetOIDCConfig loads and decrypts the OIDC configuration from the database.
func (s *Service) GetOIDCConfig(ctx context.Context) (*OIDCConfig, error) {
	cfg := &OIDCConfig{}

	enabled, err := s.q.GetSetting(ctx, KeyOIDCEnabled)
	if err == nil {
		cfg.Enabled = enabled == "true"
	}

	issuerURL, err := s.q.GetSetting(ctx, KeyOIDCIssuerURL)
	if err == nil {
		cfg.IssuerURL = issuerURL
	}

	clientID, err := s.q.GetSetting(ctx, KeyOIDCClientID)
	if err == nil {
		cfg.ClientID = clientID
	}

	secretEnc, err := s.q.GetSetting(ctx, KeyOIDCClientSecretEnc)
	if err == nil && secretEnc != "" {
		plaintext, err := crypto.Decrypt(s.encKey, secretEnc)
		if err != nil {
			return nil, fmt.Errorf("decrypt OIDC secret: %w", err)
		}
		cfg.ClientSecret = plaintext
	}

	return cfg, nil
}

// GetOIDCConfigResponse returns the safe (masked) version for API responses.
func (s *Service) GetOIDCConfigResponse(ctx context.Context) (*OIDCConfigResponse, error) {
	cfg, err := s.GetOIDCConfig(ctx)
	if err != nil {
		return nil, err
	}
	return &OIDCConfigResponse{
		Enabled:   cfg.Enabled,
		IssuerURL: cfg.IssuerURL,
		ClientID:  cfg.ClientID,
		SecretSet: cfg.ClientSecret != "",
	}, nil
}

// SaveOIDCConfig encrypts the client secret and persists all OIDC settings.
func (s *Service) SaveOIDCConfig(ctx context.Context, enabled bool, issuerURL, clientID, clientSecret string) error {
	enabledStr := "false"
	if enabled {
		enabledStr = "true"
	}

	if err := s.q.UpsertSetting(ctx, db.UpsertSettingParams{Key: KeyOIDCEnabled, Value: enabledStr}); err != nil {
		return fmt.Errorf("save oidc_enabled: %w", err)
	}
	if err := s.q.UpsertSetting(ctx, db.UpsertSettingParams{Key: KeyOIDCIssuerURL, Value: issuerURL}); err != nil {
		return fmt.Errorf("save oidc_issuer_url: %w", err)
	}
	if err := s.q.UpsertSetting(ctx, db.UpsertSettingParams{Key: KeyOIDCClientID, Value: clientID}); err != nil {
		return fmt.Errorf("save oidc_client_id: %w", err)
	}

	// Only update secret if a new one is provided (empty = keep existing)
	if clientSecret != "" {
		enc, err := crypto.Encrypt(s.encKey, clientSecret)
		if err != nil {
			return fmt.Errorf("encrypt OIDC secret: %w", err)
		}
		if err := s.q.UpsertSetting(ctx, db.UpsertSettingParams{Key: KeyOIDCClientSecretEnc, Value: enc}); err != nil {
			return fmt.Errorf("save oidc_client_secret_enc: %w", err)
		}
	}

	return nil
}

// GetClinicSettings retrieves the clinic public settings and OIDC status.
func (s *Service) GetClinicSettings(ctx context.Context) (*ClinicSettings, error) {
	settings := &ClinicSettings{
		ClinicName:     "VetCloud",
		PrimaryColor:   "#3b82f6",
		SecondaryColor: "#1e40af",
		LogoURL:        "",
		EnabledModules: []string{"appointments", "clients", "patients", "records", "users"},
		OIDCEnabled:    false,
	}

	if name, err := s.q.GetSetting(ctx, KeyClinicName); err == nil && name != "" {
		settings.ClinicName = name
	}
	if pColor, err := s.q.GetSetting(ctx, KeyPrimaryColor); err == nil && pColor != "" {
		settings.PrimaryColor = pColor
	}
	if sColor, err := s.q.GetSetting(ctx, KeySecondaryColor); err == nil && sColor != "" {
		settings.SecondaryColor = sColor
	}
	if logo, err := s.q.GetSetting(ctx, KeyLogoURL); err == nil {
		settings.LogoURL = logo
	}
	if modulesStr, err := s.q.GetSetting(ctx, KeyEnabledModules); err == nil && modulesStr != "" {
		parts := strings.Split(modulesStr, ",")
		var cleaned []string
		for _, part := range parts {
			part = strings.TrimSpace(part)
			if part != "" {
				cleaned = append(cleaned, part)
			}
		}
		if len(cleaned) > 0 {
			settings.EnabledModules = cleaned
		}
	}
	if oidcEnabled, err := s.q.GetSetting(ctx, KeyOIDCEnabled); err == nil {
		settings.OIDCEnabled = oidcEnabled == "true"
	}

	return settings, nil
}

// SaveClinicSettings persists the clinic public settings.
func (s *Service) SaveClinicSettings(ctx context.Context, cs *ClinicSettings) error {
	if err := s.q.UpsertSetting(ctx, db.UpsertSettingParams{Key: KeyClinicName, Value: cs.ClinicName}); err != nil {
		return fmt.Errorf("save clinic_name: %w", err)
	}
	if err := s.q.UpsertSetting(ctx, db.UpsertSettingParams{Key: KeyPrimaryColor, Value: cs.PrimaryColor}); err != nil {
		return fmt.Errorf("save primary_color: %w", err)
	}
	if err := s.q.UpsertSetting(ctx, db.UpsertSettingParams{Key: KeySecondaryColor, Value: cs.SecondaryColor}); err != nil {
		return fmt.Errorf("save secondary_color: %w", err)
	}
	if err := s.q.UpsertSetting(ctx, db.UpsertSettingParams{Key: KeyLogoURL, Value: cs.LogoURL}); err != nil {
		return fmt.Errorf("save logo_url: %w", err)
	}

	modulesStr := strings.Join(cs.EnabledModules, ",")
	if err := s.q.UpsertSetting(ctx, db.UpsertSettingParams{Key: KeyEnabledModules, Value: modulesStr}); err != nil {
		return fmt.Errorf("save enabled_modules: %w", err)
	}

	return nil
}
