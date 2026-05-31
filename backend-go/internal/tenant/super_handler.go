package tenant

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/iosifidis/vetcloud/internal/catalog"
	"github.com/iosifidis/vetcloud/internal/config"
	"github.com/iosifidis/vetcloud/internal/middleware"
)

type SuperHandler struct {
	catalog *catalog.Queries
	cfg     *config.Config
}

// RequireSuperAdmin checks for a specific API key header to protect super-admin endpoints.
func RequireSuperAdmin(cfg *config.Config) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			key := r.Header.Get("X-Super-Admin-Key")
			if key == "" || key != cfg.SuperAdminKey {
				middleware.RespondJSON(w, http.StatusUnauthorized, middleware.ErrorResponse{
					Error: "Unauthorized", Message: "invalid super admin key",
				})
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func RegisterSuperRoutes(r chi.Router, catalogQueries *catalog.Queries, cfg *config.Config) {
	h := &SuperHandler{
		catalog: catalogQueries,
		cfg:     cfg,
	}

	r.Route("/api/super/tenants", func(r chi.Router) {
		r.Use(RequireSuperAdmin(cfg))
		r.Get("/", h.ListTenants)
		r.Post("/", h.CreateTenant)
		r.Delete("/{slug}", h.DeactivateTenant)
	})
}

func (h *SuperHandler) ListTenants(w http.ResponseWriter, r *http.Request) {
	tenants, err := h.catalog.ListAllTenants(r.Context())
	if err != nil {
		middleware.RespondJSON(w, http.StatusInternalServerError, middleware.ErrorResponse{
			Error: "Internal Server Error", Message: "failed to fetch tenants",
		})
		return
	}

	middleware.RespondJSON(w, http.StatusOK, tenants)
}

func (h *SuperHandler) CreateTenant(w http.ResponseWriter, r *http.Request) {
	var req catalog.CreateTenantParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid JSON",
		})
		return
	}

	if req.Name == "" || req.Slug == "" || req.DbUrl == "" {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "name, slug, and db_url are required",
		})
		return
	}

	if req.Plan == "" {
		req.Plan = "basic"
	}

	tenant, err := h.catalog.CreateTenant(r.Context(), req)
	if err != nil {
		middleware.RespondJSON(w, http.StatusInternalServerError, middleware.ErrorResponse{
			Error: "Internal Server Error", Message: "failed to create tenant",
		})
		return
	}

	middleware.RespondJSON(w, http.StatusCreated, tenant)
}

func (h *SuperHandler) DeactivateTenant(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	if slug == "" {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "slug is required",
		})
		return
	}

	if err := h.catalog.DeactivateTenant(r.Context(), slug); err != nil {
		middleware.RespondJSON(w, http.StatusInternalServerError, middleware.ErrorResponse{
			Error: "Internal Server Error", Message: "failed to deactivate tenant",
		})
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
