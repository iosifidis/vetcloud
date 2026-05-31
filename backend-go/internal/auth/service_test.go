package auth

import (
	"testing"
	"time"

	"github.com/iosifidis/vetcloud/internal/config"
	"github.com/iosifidis/vetcloud/internal/domain"
)

func testConfig() *config.Config {
	return &config.Config{
		JWTSecret:            "test-secret-key-minimum-32-chars-long",
		AccessTokenDuration:  15 * time.Minute,
		RefreshTokenDuration: 7 * 24 * time.Hour,
	}
}

func TestHashAndCheckPassword(t *testing.T) {
	svc := NewService(testConfig())

	password := "mySecretPassword123"

	hash, err := svc.HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword() error: %v", err)
	}

	if hash == password {
		t.Error("hash should not equal plaintext password")
	}

	// Correct password should pass
	if err := svc.CheckPassword(hash, password); err != nil {
		t.Errorf("CheckPassword() with correct password: %v", err)
	}

	// Wrong password should fail
	if err := svc.CheckPassword(hash, "wrongPassword"); err == nil {
		t.Error("CheckPassword() with wrong password should return error")
	}
}

func TestGenerateAndValidateAccessToken(t *testing.T) {
	svc := NewService(testConfig())

	token, err := svc.GenerateAccessToken(42, "testuser", "VET", "test-tenant")
	if err != nil {
		t.Fatalf("GenerateAccessToken() error: %v", err)
	}

	if token == "" {
		t.Fatal("token should not be empty")
	}

	// Validate token
	claims, err := svc.ValidateAccessToken(token)
	if err != nil {
		t.Fatalf("ValidateAccessToken() error: %v", err)
	}

	if claims.UserID != 42 {
		t.Errorf("UserID = %d, want 42", claims.UserID)
	}
	if claims.Username != "testuser" {
		t.Errorf("Username = %q, want %q", claims.Username, "testuser")
	}
	if claims.Role != "VET" {
		t.Errorf("Role = %q, want %q", claims.Role, "VET")
	}
}

func TestValidateExpiredToken(t *testing.T) {
	cfg := testConfig()
	cfg.AccessTokenDuration = -1 * time.Second // Already expired
	svc := NewService(cfg)

	token, err := svc.GenerateAccessToken(1, "expired", "VET", "test-tenant")
	if err != nil {
		t.Fatalf("GenerateAccessToken() error: %v", err)
	}

	_, err = svc.ValidateAccessToken(token)
	if err != domain.ErrTokenExpired {
		t.Errorf("ValidateAccessToken() should return ErrTokenExpired, got: %v", err)
	}
}

func TestValidateInvalidToken(t *testing.T) {
	svc := NewService(testConfig())

	_, err := svc.ValidateAccessToken("not-a-valid-token")
	if err != domain.ErrTokenInvalid {
		t.Errorf("ValidateAccessToken() with invalid token should return ErrTokenInvalid, got: %v", err)
	}
}

func TestValidateTokenWithWrongSecret(t *testing.T) {
	svc1 := NewService(testConfig())
	token, _ := svc1.GenerateAccessToken(1, "user", "VET", "test-tenant")

	cfg2 := testConfig()
	cfg2.JWTSecret = "different-secret-key-minimum-32-chars"
	svc2 := NewService(cfg2)

	_, err := svc2.ValidateAccessToken(token)
	if err != domain.ErrTokenInvalid {
		t.Errorf("ValidateAccessToken() with wrong secret should return ErrTokenInvalid, got: %v", err)
	}
}

func TestGenerateRefreshToken(t *testing.T) {
	svc := NewService(testConfig())

	token1, err := svc.GenerateRefreshToken()
	if err != nil {
		t.Fatalf("GenerateRefreshToken() error: %v", err)
	}

	token2, err := svc.GenerateRefreshToken()
	if err != nil {
		t.Fatalf("GenerateRefreshToken() error: %v", err)
	}

	if token1 == token2 {
		t.Error("two refresh tokens should be different")
	}

	if len(token1) != 64 { // 32 bytes = 64 hex chars
		t.Errorf("refresh token length = %d, want 64", len(token1))
	}
}
