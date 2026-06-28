package oidcauth

import (
	"context"
	"fmt"

	"github.com/coreos/go-oidc/v3/oidc"
	"golang.org/x/oauth2"
)

// OIDCUserInfo holds the user information extracted from an OIDC ID token.
type OIDCUserInfo struct {
	Sub        string // Unique subject identifier from the provider
	Email      string
	GivenName  string
	FamilyName string
	Name       string
}

// OIDCService wraps the OIDC provider and OAuth2 config for a single installation.
type OIDCService struct {
	provider *oidc.Provider
	verifier *oidc.IDTokenVerifier
	oauth2   oauth2.Config
}

// NewOIDCService creates an OIDCService by discovering the provider via the issuer URL.
// This performs an HTTP request to <issuerURL>/.well-known/openid-configuration.
func NewOIDCService(ctx context.Context, issuerURL, clientID, clientSecret, redirectURL string) (*OIDCService, error) {
	provider, err := oidc.NewProvider(ctx, issuerURL)
	if err != nil {
		return nil, fmt.Errorf("discover OIDC provider at %q: %w", issuerURL, err)
	}

	verifier := provider.Verifier(&oidc.Config{ClientID: clientID})

	oauth2Config := oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  redirectURL,
		Endpoint:     provider.Endpoint(),
		Scopes:       []string{oidc.ScopeOpenID, "profile", "email"},
	}

	return &OIDCService{
		provider: provider,
		verifier: verifier,
		oauth2:   oauth2Config,
	}, nil
}

// AuthCodeURL builds the redirect URL for sending the user to Authentik.
// state and nonce should be cryptographically random strings.
func (s *OIDCService) AuthCodeURL(state, nonce string) string {
	return s.oauth2.AuthCodeURL(state, oauth2.SetAuthURLParam("nonce", nonce))
}

// Exchange exchanges the authorization code for tokens and returns verified user info.
func (s *OIDCService) Exchange(ctx context.Context, code, nonce string) (*OIDCUserInfo, error) {
	// Exchange code for tokens
	token, err := s.oauth2.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("exchange code: %w", err)
	}

	// Extract raw ID token
	rawIDToken, ok := token.Extra("id_token").(string)
	if !ok {
		return nil, fmt.Errorf("no id_token in token response")
	}

	// Verify ID token signature, expiry, audience
	idToken, err := s.verifier.Verify(ctx, rawIDToken)
	if err != nil {
		return nil, fmt.Errorf("verify id_token: %w", err)
	}

	// Verify nonce (anti-replay)
	var claims struct {
		Nonce      string `json:"nonce"`
		Email      string `json:"email"`
		GivenName  string `json:"given_name"`
		FamilyName string `json:"family_name"`
		Name       string `json:"name"`
	}
	if err := idToken.Claims(&claims); err != nil {
		return nil, fmt.Errorf("parse id_token claims: %w", err)
	}
	if claims.Nonce != nonce {
		return nil, fmt.Errorf("nonce mismatch: possible replay attack")
	}

	return &OIDCUserInfo{
		Sub:        idToken.Subject,
		Email:      claims.Email,
		GivenName:  claims.GivenName,
		FamilyName: claims.FamilyName,
		Name:       claims.Name,
	}, nil
}
