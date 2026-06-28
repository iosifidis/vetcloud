package oidcauth

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/iosifidis/vetcloud/internal/auth"
	"github.com/iosifidis/vetcloud/internal/db"
	"github.com/iosifidis/vetcloud/internal/middleware"
	"github.com/iosifidis/vetcloud/internal/settings"
)

const (
	oidcStateCookie = "oidc_state"
	oidcNonceCookie = "oidc_nonce"
	oidcCookieTTL   = 5 * time.Minute
)

// OIDCHandler handles the OIDC login flow.
type OIDCHandler struct {
	authSvc     *auth.Service
	settingsSvc *settings.Service
	queries     *db.Queries
	redirectURL string
	frontendURL string
}

// RegisterRoutes registers the OIDC auth routes.
func RegisterRoutes(r chi.Router, authSvc *auth.Service, settingsSvc *settings.Service, queries *db.Queries, redirectURL, frontendURL string) {
	h := &OIDCHandler{
		authSvc:     authSvc,
		settingsSvc: settingsSvc,
		queries:     queries,
		redirectURL: redirectURL,
		frontendURL: frontendURL,
	}

	r.Get("/api/auth/oidc/login", h.Login)
	r.Get("/api/auth/oidc/callback", h.Callback)
}

func (h *OIDCHandler) getQueries(r *http.Request) *db.Queries {
	pool := middleware.TenantPoolFromContext(r.Context())
	if pool != nil {
		return db.New(pool)
	}
	return h.queries
}

// Login redirects the user to the Authentik authorization endpoint.
func (h *OIDCHandler) Login(w http.ResponseWriter, r *http.Request) {
	cfg, err := h.settingsSvc.GetOIDCConfig(r.Context())
	if err != nil || !cfg.Enabled {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "SSO is not enabled for this installation",
		})
		return
	}

	oidcSvc, err := NewOIDCService(r.Context(), cfg.IssuerURL, cfg.ClientID, cfg.ClientSecret, h.redirectURL)
	if err != nil {
		log.Printf("ERROR: build OIDC service: %v", err)
		middleware.RespondJSON(w, http.StatusInternalServerError, middleware.ErrorResponse{
			Error: "Internal Server Error", Message: "failed to connect to OIDC provider",
		})
		return
	}

	state, err := randomHex(16)
	if err != nil {
		middleware.RespondJSON(w, http.StatusInternalServerError, middleware.ErrorResponse{Error: "Internal Server Error"})
		return
	}
	nonce, err := randomHex(16)
	if err != nil {
		middleware.RespondJSON(w, http.StatusInternalServerError, middleware.ErrorResponse{Error: "Internal Server Error"})
		return
	}

	// Store state + nonce in HttpOnly cookies (anti-CSRF, anti-replay)
	setOIDCCookie(w, oidcStateCookie, state)
	setOIDCCookie(w, oidcNonceCookie, nonce)

	http.Redirect(w, r, oidcSvc.AuthCodeURL(state, nonce), http.StatusFound)
}

// Callback handles the redirect from Authentik after successful login.
func (h *OIDCHandler) Callback(w http.ResponseWriter, r *http.Request) {
	// Validate state (anti-CSRF)
	stateCookie, err := r.Cookie(oidcStateCookie)
	if err != nil || stateCookie.Value != r.URL.Query().Get("state") {
		http.Redirect(w, r, h.frontendURL+"/login?error=invalid_state", http.StatusFound)
		return
	}

	nonceCookie, err := r.Cookie(oidcNonceCookie)
	if err != nil {
		http.Redirect(w, r, h.frontendURL+"/login?error=missing_nonce", http.StatusFound)
		return
	}

	// Clear state/nonce cookies
	clearOIDCCookie(w, oidcStateCookie)
	clearOIDCCookie(w, oidcNonceCookie)

	// Load OIDC config
	cfg, err := h.settingsSvc.GetOIDCConfig(r.Context())
	if err != nil || !cfg.Enabled {
		http.Redirect(w, r, h.frontendURL+"/login?error=oidc_disabled", http.StatusFound)
		return
	}

	oidcSvc, err := NewOIDCService(r.Context(), cfg.IssuerURL, cfg.ClientID, cfg.ClientSecret, h.redirectURL)
	if err != nil {
		log.Printf("ERROR: build OIDC service for callback: %v", err)
		http.Redirect(w, r, h.frontendURL+"/login?error=provider_error", http.StatusFound)
		return
	}

	// Exchange code for user info
	code := r.URL.Query().Get("code")
	userInfo, err := oidcSvc.Exchange(r.Context(), code, nonceCookie.Value)
	if err != nil {
		log.Printf("ERROR: OIDC exchange: %v", err)
		http.Redirect(w, r, h.frontendURL+"/login?error=exchange_failed", http.StatusFound)
		return
	}

	// Find or provision the user
	user, err := h.findOrCreateUser(r, userInfo)
	if err != nil {
		log.Printf("ERROR: OIDC user provisioning: %v", err)
		http.Redirect(w, r, h.frontendURL+"/login?error=user_error", http.StatusFound)
		return
	}

	// Fetch role name
	roleName := "CLIENT"
	if user.RoleID.Valid {
		role, err := h.getQueries(r).GetRoleByName(r.Context(), roleName)
		if err == nil {
			_ = role // role.Name already equals roleName for CLIENT
		}
	}

	// Generate VetCloud JWT
	token, err := h.authSvc.GenerateAccessToken(user.ID, user.Username, roleName, "")
	if err != nil {
		log.Printf("ERROR: generate token for OIDC user: %v", err)
		http.Redirect(w, r, h.frontendURL+"/login?error=token_error", http.StatusFound)
		return
	}

	// Redirect to frontend with token as query param
	// Frontend reads it, stores in memory/localStorage, then removes from URL
	redirectTarget := fmt.Sprintf("%s/auth/callback?oidc_token=%s", h.frontendURL, token)
	http.Redirect(w, r, redirectTarget, http.StatusFound)
}

// findOrCreateUser implements the user provisioning logic:
//  1. Lookup by OIDC sub → found → return
//  2. Lookup by email → found → link oidc_sub → return
//  3. Not found → create clients record + users record (role=CLIENT)
func (h *OIDCHandler) findOrCreateUser(r *http.Request, info *OIDCUserInfo) (*db.CreateOIDCUserRow, error) {
	ctx := r.Context()
	queries := h.getQueries(r)

	// 1. Find by OIDC subject
	user, err := queries.GetUserByOIDCSub(ctx, pgtype.Text{String: info.Sub, Valid: true})
	if err == nil {
		// Convert to CreateOIDCUserRow-like struct for return
		return &db.CreateOIDCUserRow{
			ID:       user.ID,
			Username: user.Username,
			Email:    user.Email,
			IsActive: user.IsActive,
			RoleID:   user.RoleID,
			ClientID: user.ClientID,
			OidcSub:  user.OidcSub,
		}, nil
	}

	// 2. Find by email and link
	if info.Email != "" {
		byEmail, err := queries.GetUserByEmail(ctx, pgtype.Text{String: info.Email, Valid: true})
		if err == nil {
			// Link existing account to OIDC sub
			if err := queries.SetUserOIDCSub(ctx, db.SetUserOIDCSubParams{
				ID:      byEmail.ID,
				OidcSub: pgtype.Text{String: info.Sub, Valid: true},
			}); err != nil {
				log.Printf("WARN: failed to set oidc_sub for user %d: %v", byEmail.ID, err)
			}
			return &db.CreateOIDCUserRow{
				ID:       byEmail.ID,
				Username: byEmail.Username,
				Email:    byEmail.Email,
				IsActive: byEmail.IsActive,
				RoleID:   byEmail.RoleID,
				ClientID: byEmail.ClientID,
				OidcSub:  byEmail.OidcSub,
			}, nil
		}
	}

	// 3. Auto-provision new user as CLIENT
	// First create a clients record (pet owner)
	firstName := info.GivenName
	lastName := info.FamilyName
	if firstName == "" && info.Name != "" {
		parts := strings.SplitN(info.Name, " ", 2)
		firstName = parts[0]
		if len(parts) > 1 {
			lastName = parts[1]
		}
	}

	client, err := queries.CreateClient(ctx, db.CreateClientParams{
		FirstName: firstName,
		LastName:  lastName,
		Email:     info.Email,
	})
	if err != nil {
		return nil, fmt.Errorf("create client record: %w", err)
	}

	// Generate a unique username from email or sub
	username := info.Email
	if username == "" {
		username = "oidc_" + info.Sub[:8]
	}
	username = strings.ReplaceAll(username, "@", "_at_")
	username = strings.ReplaceAll(username, ".", "_")

	// Create user linked to the client record
	newUser, err := queries.CreateOIDCUser(ctx, db.CreateOIDCUserParams{
		Username:  username,
		Email:     pgtype.Text{String: info.Email, Valid: info.Email != ""},
		FirstName: pgtype.Text{String: firstName, Valid: firstName != ""},
		LastName:  pgtype.Text{String: lastName, Valid: lastName != ""},
		ClientID:  pgtype.Int8{Int64: client.ID, Valid: true},
		OidcSub:   pgtype.Text{String: info.Sub, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("create oidc user: %w", err)
	}

	return newUser, nil
}

// --- Cookie helpers ---

func setOIDCCookie(w http.ResponseWriter, name, value string) {
	http.SetCookie(w, &http.Cookie{
		Name:     name,
		Value:    value,
		Path:     "/",
		MaxAge:   int(oidcCookieTTL.Seconds()),
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   false, // set to true in production (HTTPS only)
	})
}

func clearOIDCCookie(w http.ResponseWriter, name string) {
	http.SetCookie(w, &http.Cookie{
		Name:     name,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
	})
}

func randomHex(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
