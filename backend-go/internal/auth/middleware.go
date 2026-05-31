package auth

import (
	"context"
	"net/http"
	"strings"

	"github.com/iosifidis/vetcloud/internal/domain"
)

// contextKey is a private type for context keys to avoid collisions.
type contextKey string

const userContextKey contextKey = "authUser"

// UserInfo holds the authenticated user data stored in the request context.
type UserInfo struct {
	UserID     int64
	Username   string
	Role       string
	TenantSlug string
}

// Middleware creates an HTTP middleware that validates JWT access tokens.
// It extracts the token from the Authorization header, validates it,
// and stores the user info in the request context.
func Middleware(authService *Service) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Extract token from Authorization header
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, `{"error":"missing authorization header"}`, http.StatusUnauthorized)
				return
			}

			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || !strings.EqualFold(parts[0], "bearer") {
				http.Error(w, `{"error":"invalid authorization header format"}`, http.StatusUnauthorized)
				return
			}

			tokenStr := parts[1]

			// Validate token
			claims, err := authService.ValidateAccessToken(tokenStr)
			if err != nil {
				if err == domain.ErrTokenExpired {
					http.Error(w, `{"error":"token expired"}`, http.StatusUnauthorized)
				} else {
					http.Error(w, `{"error":"invalid token"}`, http.StatusUnauthorized)
				}
				return
			}

			// Store user info in context
			userInfo := &UserInfo{
				UserID:     claims.UserID,
				Username:   claims.Username,
				Role:       claims.Role,
				TenantSlug: claims.TenantSlug,
			}
			ctx := context.WithValue(r.Context(), userContextKey, userInfo)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireRole creates a middleware that checks if the user has the required role.
func RequireRole(roles ...string) func(http.Handler) http.Handler {
	roleSet := make(map[string]bool)
	for _, r := range roles {
		roleSet[r] = true
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			user := UserFromContext(r.Context())
			if user == nil {
				http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
				return
			}

			if !roleSet[user.Role] {
				http.Error(w, `{"error":"forbidden","message":"insufficient permissions"}`, http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// UserFromContext extracts the UserInfo from the request context.
// Returns nil if no user is authenticated.
func UserFromContext(ctx context.Context) *UserInfo {
	user, _ := ctx.Value(userContextKey).(*UserInfo)
	return user
}
