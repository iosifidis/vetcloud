package settings

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/iosifidis/vetcloud/internal/auth"
	"github.com/iosifidis/vetcloud/internal/middleware"
)

// RegisterRoutes registers the settings API routes.
func RegisterRoutes(r chi.Router, svc *Service, authSvc *auth.Service) {
	// Public settings (used by login page and page shell for theme/SSO detection)
	r.Get("/api/settings/public", getPublicSettings(svc))

	r.Route("/api/settings", func(r chi.Router) {
		r.Use(auth.Middleware(authSvc))
		r.Use(auth.RequireRole("ADMIN"))

		r.Get("/oidc", getOIDCConfig(svc))
		r.Put("/oidc", saveOIDCConfig(svc))
		r.Put("/clinic", saveClinicSettings(svc))
	})
}

func getOIDCConfig(svc *Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		resp, err := svc.GetOIDCConfigResponse(r.Context())
		if err != nil {
			middleware.RespondJSON(w, http.StatusInternalServerError, middleware.ErrorResponse{
				Error: "Internal Server Error", Message: "failed to load OIDC config",
			})
			return
		}
		middleware.RespondJSON(w, http.StatusOK, resp)
	}
}

func saveOIDCConfig(svc *Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Enabled      bool   `json:"enabled"`
			IssuerURL    string `json:"issuerUrl"`
			ClientID     string `json:"clientId"`
			ClientSecret string `json:"clientSecret"` // empty = keep existing
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
				Error: "Bad Request", Message: "invalid JSON",
			})
			return
		}

		if req.Enabled && (req.IssuerURL == "" || req.ClientID == "") {
			middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
				Error: "Bad Request", Message: "issuerUrl and clientId are required when OIDC is enabled",
			})
			return
		}

		if err := svc.SaveOIDCConfig(r.Context(), req.Enabled, req.IssuerURL, req.ClientID, req.ClientSecret); err != nil {
			middleware.RespondJSON(w, http.StatusInternalServerError, middleware.ErrorResponse{
				Error: "Internal Server Error", Message: "failed to save OIDC config",
			})
			return
		}

		// Return masked response
		resp, err := svc.GetOIDCConfigResponse(r.Context())
		if err != nil {
			middleware.RespondJSON(w, http.StatusInternalServerError, middleware.ErrorResponse{
				Error: "Internal Server Error", Message: "failed to reload OIDC config",
			})
			return
		}
		middleware.RespondJSON(w, http.StatusOK, resp)
	}
}

func getPublicSettings(svc *Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		resp, err := svc.GetClinicSettings(r.Context())
		if err != nil {
			middleware.RespondJSON(w, http.StatusInternalServerError, middleware.ErrorResponse{
				Error: "Internal Server Error", Message: "failed to load clinic settings",
			})
			return
		}
		middleware.RespondJSON(w, http.StatusOK, resp)
	}
}

func saveClinicSettings(svc *Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req ClinicSettings
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
				Error: "Bad Request", Message: "invalid JSON",
			})
			return
		}

		if req.ClinicName == "" {
			middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
				Error: "Bad Request", Message: "clinicName is required",
			})
			return
		}

		if err := svc.SaveClinicSettings(r.Context(), &req); err != nil {
			middleware.RespondJSON(w, http.StatusInternalServerError, middleware.ErrorResponse{
				Error: "Internal Server Error", Message: "failed to save clinic settings",
			})
			return
		}

		// Return fresh settings
		resp, err := svc.GetClinicSettings(r.Context())
		if err != nil {
			middleware.RespondJSON(w, http.StatusInternalServerError, middleware.ErrorResponse{
				Error: "Internal Server Error", Message: "failed to reload clinic settings",
			})
			return
		}
		middleware.RespondJSON(w, http.StatusOK, resp)
	}
}
