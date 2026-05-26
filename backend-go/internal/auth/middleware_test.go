package auth

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/iosifidis/vetcloud/internal/config"
)

func TestMiddleware_NoHeader(t *testing.T) {
	svc := NewService(testConfig())
	handler := Middleware(svc)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("handler should not be called without auth header")
	}))

	req := httptest.NewRequest("GET", "/test", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want %d", rr.Code, http.StatusUnauthorized)
	}
}

func TestMiddleware_InvalidFormat(t *testing.T) {
	svc := NewService(testConfig())
	handler := Middleware(svc)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("handler should not be called with invalid format")
	}))

	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "NotBearer token123")
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want %d", rr.Code, http.StatusUnauthorized)
	}
}

func TestMiddleware_ValidToken(t *testing.T) {
	svc := NewService(testConfig())

	token, _ := svc.GenerateAccessToken(42, "testuser", "VET")

	var capturedUser *UserInfo
	handler := Middleware(svc)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedUser = UserFromContext(r.Context())
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", rr.Code, http.StatusOK)
	}

	if capturedUser == nil {
		t.Fatal("user should be in context")
	}
	if capturedUser.UserID != 42 {
		t.Errorf("UserID = %d, want 42", capturedUser.UserID)
	}
	if capturedUser.Username != "testuser" {
		t.Errorf("Username = %q, want %q", capturedUser.Username, "testuser")
	}
	if capturedUser.Role != "VET" {
		t.Errorf("Role = %q, want %q", capturedUser.Role, "VET")
	}
}

func TestMiddleware_ExpiredToken(t *testing.T) {
	cfg := &config.Config{
		JWTSecret:           "test-secret-key-minimum-32-chars-long",
		AccessTokenDuration: -1 * time.Second,
	}
	svc := NewService(cfg)

	token, _ := svc.GenerateAccessToken(1, "expired", "VET")

	handler := Middleware(NewService(testConfig()))(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("handler should not be called with expired token")
	}))

	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want %d", rr.Code, http.StatusUnauthorized)
	}
}

func TestRequireRole_Allowed(t *testing.T) {
	svc := NewService(testConfig())
	token, _ := svc.GenerateAccessToken(1, "admin", "ADMIN")

	handler := Middleware(svc)(RequireRole("ADMIN")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})))

	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", rr.Code, http.StatusOK)
	}
}

func TestRequireRole_Denied(t *testing.T) {
	svc := NewService(testConfig())
	token, _ := svc.GenerateAccessToken(1, "vet", "VET")

	handler := Middleware(svc)(RequireRole("ADMIN")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("handler should not be called without required role")
	})))

	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Errorf("status = %d, want %d", rr.Code, http.StatusForbidden)
	}
}
