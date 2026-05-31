package auth

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"github.com/iosifidis/vetcloud/internal/config"
	"github.com/iosifidis/vetcloud/internal/domain"
)

// Claims represents the JWT claims for access tokens.
type Claims struct {
	UserID     int64  `json:"user_id"`
	Username   string `json:"username"`
	Role       string `json:"role"`
	TenantSlug string `json:"tenant_slug"`
	jwt.RegisteredClaims
}

// TokenPair holds an access token and a raw refresh token string.
type TokenPair struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
}

// Service handles JWT generation/validation and password hashing.
type Service struct {
	cfg *config.Config
}

// NewService creates a new auth service.
func NewService(cfg *config.Config) *Service {
	return &Service{cfg: cfg}
}

// --- Password Hashing ---

// HashPassword hashes a plaintext password using bcrypt.
func (s *Service) HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("hash password: %w", err)
	}
	return string(bytes), nil
}

// CheckPassword compares a plaintext password against a bcrypt hash.
func (s *Service) CheckPassword(hash, password string) error {
	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)); err != nil {
		return domain.ErrUnauthorized
	}
	return nil
}

// --- JWT Access Tokens ---

// GenerateAccessToken creates a signed JWT access token.
func (s *Service) GenerateAccessToken(userID int64, username, role, tenantSlug string) (string, error) {
	now := time.Now()
	claims := Claims{
		UserID:     userID,
		Username:   username,
		Role:       role,
		TenantSlug: tenantSlug,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(s.cfg.AccessTokenDuration)),
			Issuer:    "vetcloud",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(s.cfg.JWTSecret))
	if err != nil {
		return "", fmt.Errorf("sign access token: %w", err)
	}
	return signed, nil
}

// ValidateAccessToken parses and validates a JWT access token.
func (s *Service) ValidateAccessToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(s.cfg.JWTSecret), nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, domain.ErrTokenExpired
		}
		return nil, domain.ErrTokenInvalid
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, domain.ErrTokenInvalid
	}

	return claims, nil
}

// --- Refresh Tokens ---

// GenerateRefreshToken creates a cryptographically random refresh token string.
func (s *Service) GenerateRefreshToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("generate refresh token: %w", err)
	}
	return hex.EncodeToString(bytes), nil
}

// HashRefreshToken hashes a refresh token for storage (using bcrypt).
func (s *Service) HashRefreshToken(token string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(token), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("hash refresh token: %w", err)
	}
	return string(bytes), nil
}

// VerifyRefreshToken compares a raw refresh token against its bcrypt hash.
func (s *Service) VerifyRefreshToken(hash, token string) error {
	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(token)); err != nil {
		return domain.ErrTokenInvalid
	}
	return nil
}
