package tenant

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/iosifidis/vetcloud/internal/auth"
	"github.com/iosifidis/vetcloud/internal/catalog"
	"github.com/iosifidis/vetcloud/internal/middleware"
	"github.com/jackc/pgx/v5/pgtype"
)

type SettingsHandler struct {
	catalog *catalog.Queries
}

func RegisterSettingsRoutes(r chi.Router, catalogQueries *catalog.Queries, authSvc *auth.Service) {
	h := &SettingsHandler{
		catalog: catalogQueries,
	}

	r.Route("/api/tenant/settings", func(r chi.Router) {
		// GET is public (used by frontend before login to get theme)
		r.Get("/", h.GetSettings)

		// PUT requires authentication and ADMIN role
		r.With(auth.Middleware(authSvc), auth.RequireRole("ADMIN")).Put("/", h.UpdateSettings)
	})
}

func (h *SettingsHandler) GetSettings(w http.ResponseWriter, r *http.Request) {
	slug := middleware.TenantSlugFromContext(r.Context())
	if slug == "" {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "tenant slug missing",
		})
		return
	}

	tenantRecord, err := h.catalog.GetTenantBySlug(r.Context(), slug)
	if err != nil {
		middleware.RespondJSON(w, http.StatusNotFound, middleware.ErrorResponse{
			Error: "Not Found", Message: "tenant not found",
		})
		return
	}

	settings, err := h.catalog.GetTenantSettings(r.Context(), tenantRecord.ID)
	if err != nil {
		// If no settings exist yet, return defaults
		middleware.RespondJSON(w, http.StatusOK, map[string]interface{}{
			"clinicName":     "",
			"primaryColor":   "#3b82f6",
			"secondaryColor": "#1e40af",
			"logoUrl":        "",
			"enabledModules": []string{"appointments", "clients", "patients", "records", "users"},
		})
		return
	}

	middleware.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"clinicName":     settings.ClinicName,
		"primaryColor":   settings.PrimaryColor,
		"secondaryColor": settings.SecondaryColor,
		"logoUrl":        settings.LogoUrl.String,
		"enabledModules": settings.EnabledModules,
	})
}

func (h *SettingsHandler) UpdateSettings(w http.ResponseWriter, r *http.Request) {
	slug := middleware.TenantSlugFromContext(r.Context())
	if slug == "" {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "tenant slug missing",
		})
		return
	}

	// Verify the authenticated user belongs to this tenant
	user := auth.UserFromContext(r.Context())
	if user == nil || user.TenantSlug != slug {
		middleware.RespondJSON(w, http.StatusForbidden, middleware.ErrorResponse{
			Error: "Forbidden", Message: "tenant mismatch",
		})
		return
	}

	var req struct {
		ClinicName     string   `json:"clinicName"`
		PrimaryColor   string   `json:"primaryColor"`
		SecondaryColor string   `json:"secondaryColor"`
		LogoUrl        string   `json:"logoUrl"`
		EnabledModules []string `json:"enabledModules"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid JSON",
		})
		return
	}

	tenantRecord, err := h.catalog.GetTenantBySlug(r.Context(), slug)
	if err != nil {
		middleware.RespondJSON(w, http.StatusNotFound, middleware.ErrorResponse{
			Error: "Not Found", Message: "tenant not found",
		})
		return
	}

	// Upsert settings
	arg := catalog.UpsertTenantSettingsParams{
		TenantID:       tenantRecord.ID,
		ClinicName:     req.ClinicName,
		PrimaryColor:   req.PrimaryColor,
		SecondaryColor: req.SecondaryColor,
		LogoUrl:        pgtype.Text{String: req.LogoUrl, Valid: true},
		EnabledModules: req.EnabledModules,
	}

	settings, err := h.catalog.UpsertTenantSettings(r.Context(), arg)
	if err != nil {
		middleware.RespondJSON(w, http.StatusInternalServerError, middleware.ErrorResponse{
			Error: "Internal Error", Message: "failed to save settings",
		})
		return
	}

	middleware.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"clinicName":     settings.ClinicName,
		"primaryColor":   settings.PrimaryColor,
		"secondaryColor": settings.SecondaryColor,
		"logoUrl":        settings.LogoUrl.String,
		"enabledModules": settings.EnabledModules,
	})
}
