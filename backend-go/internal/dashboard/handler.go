package dashboard

import (
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/iosifidis/vetcloud/internal/auth"
	"github.com/iosifidis/vetcloud/internal/config"
	"github.com/iosifidis/vetcloud/internal/db"
	"github.com/iosifidis/vetcloud/internal/middleware"
)

// Handler handles dashboard HTTP requests.
type Handler struct {
	defaultQueries *db.Queries
}

// getQueries returns the database queries for the current tenant.
func (h *Handler) getQueries(r *http.Request) *db.Queries {
	pool := middleware.TenantPoolFromContext(r.Context())
	if pool != nil {
		return db.New(pool)
	}
	return h.defaultQueries
}

// RegisterRoutes mounts dashboard routes.
func RegisterRoutes(r chi.Router, cfg *config.Config, pool *pgxpool.Pool, authSvc *auth.Service) {
	h := &Handler{defaultQueries: db.New(pool)}

	r.Route("/api/dashboard", func(r chi.Router) {
		r.Use(auth.Middleware(authSvc))

		r.Get("/stats", h.GetStats)
	})
}

// --- Response type ---

type statsResponse struct {
	TotalClients      int32 `json:"totalClients"`
	TotalPatients     int32 `json:"totalPatients"`
	TodayAppointments int32 `json:"todayAppointments"`
	WeekAppointments  int32 `json:"weekAppointments"`
}

// GetStats returns aggregated dashboard statistics.
func (h *Handler) GetStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.getQueries(r).GetDashboardStats(r.Context())
	if err != nil {
		log.Printf("ERROR: get dashboard stats: %v", err)
		middleware.RespondError(w, err)
		return
	}

	middleware.RespondJSON(w, http.StatusOK, statsResponse{
		TotalClients:      stats.TotalClients,
		TotalPatients:     stats.TotalPatients,
		TodayAppointments: stats.TodayAppointments,
		WeekAppointments:  stats.WeekAppointments,
	})
}
