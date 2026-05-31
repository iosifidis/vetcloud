package appointment

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/iosifidis/vetcloud/internal/auth"
	"github.com/iosifidis/vetcloud/internal/config"
	"github.com/iosifidis/vetcloud/internal/db"
	"github.com/iosifidis/vetcloud/internal/helpers"
	"github.com/iosifidis/vetcloud/internal/middleware"
)

// Handler handles appointment HTTP requests.
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

// RegisterRoutes mounts appointment routes.
func RegisterRoutes(r chi.Router, cfg *config.Config, pool *pgxpool.Pool, authSvc *auth.Service) {
	h := &Handler{defaultQueries: db.New(pool)}

	r.Route("/api/appointments", func(r chi.Router) {
		r.Use(auth.Middleware(authSvc))

		r.Get("/", h.List)
		r.Post("/", h.Create)
		r.Get("/search", h.Search)
		r.Get("/next", h.GetNext)
		r.Get("/{id}", h.GetByID)
		r.Put("/{id}", h.Update)
		r.Delete("/{id}", h.Delete)
	})
}

// --- Request/Response types ---

type appointmentRequest struct {
	ClientID   int64  `json:"clientId"`
	PatientID  int64  `json:"patientId"`
	VetID      *int64 `json:"vetId"`
	ResourceID *int64 `json:"resourceId"`
	StartTime  string `json:"startTime"`
	EndTime    string `json:"endTime"`
	Reason     string `json:"reason"`
	Notes      string `json:"notes"`
	Status     string `json:"status"`
	Type       string `json:"type"`
}

type appointmentResponse struct {
	ID              int64  `json:"id"`
	ClientID        int64  `json:"clientId"`
	PatientID       int64  `json:"patientId"`
	VetID           *int64 `json:"vetId,omitempty"`
	ResourceID      *int64 `json:"resourceId,omitempty"`
	StartTime       string `json:"startTime"`
	EndTime         string `json:"endTime"`
	Reason          string `json:"reason"`
	Notes           string `json:"notes"`
	Status          string `json:"status"`
	Type            string `json:"type"`
	ClientFirstName string `json:"clientFirstName,omitempty"`
	ClientLastName  string `json:"clientLastName,omitempty"`
	ClientPhone     string `json:"clientPhone,omitempty"`
	PatientName     string `json:"patientName,omitempty"`
	PatientSpecies  string `json:"patientSpecies,omitempty"`
	VetUsername     string `json:"vetUsername,omitempty"`
	VetFirstName    string `json:"vetFirstName,omitempty"`
	VetLastName     string `json:"vetLastName,omitempty"`
	CreatedAt       string `json:"createdAt"`
	UpdatedAt       string `json:"updatedAt"`
}

// --- Handlers ---

// List returns all appointments with related data.
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	appointments, err := h.getQueries(r).ListAppointments(r.Context())
	if err != nil {
		log.Printf("ERROR: list appointments: %v", err)
		middleware.RespondError(w, err)
		return
	}
	result := make([]appointmentResponse, len(appointments))
	for i, a := range appointments {
		result[i] = mapListRow(a)
	}
	middleware.RespondJSON(w, http.StatusOK, result)
}

// Search searches appointments by client name, patient name, or reason.
func (h *Handler) Search(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	if q == "" {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "search query 'q' is required",
		})
		return
	}

	appointments, err := h.getQueries(r).SearchAppointments(r.Context(), helpers.PgText(q))
	if err != nil {
		log.Printf("ERROR: search appointments: %v", err)
		middleware.RespondError(w, err)
		return
	}
	result := make([]appointmentResponse, len(appointments))
	for i, a := range appointments {
		result[i] = mapSearchRow(a)
	}
	middleware.RespondJSON(w, http.StatusOK, result)
}

// GetByID returns a single appointment with related data.
func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(r, "id")
	if err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid appointment ID",
		})
		return
	}

	a, err := h.getQueries(r).GetAppointmentByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			middleware.RespondJSON(w, http.StatusNotFound, middleware.ErrorResponse{
				Error: "Not Found", Message: "appointment not found",
			})
			return
		}
		middleware.RespondError(w, err)
		return
	}
	middleware.RespondJSON(w, http.StatusOK, mapDetailRow(a))
}

// GetNext returns the next upcoming appointment for the authenticated vet.
func (h *Handler) GetNext(w http.ResponseWriter, r *http.Request) {
	user := auth.UserFromContext(r.Context())
	if user == nil {
		middleware.RespondJSON(w, http.StatusUnauthorized, middleware.ErrorResponse{
			Error: "Unauthorized",
		})
		return
	}

	a, err := h.getQueries(r).GetNextAppointmentForVet(r.Context(), pgtype.Int8{Int64: user.UserID, Valid: true})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			middleware.RespondJSON(w, http.StatusOK, nil)
			return
		}
		middleware.RespondError(w, err)
		return
	}
	middleware.RespondJSON(w, http.StatusOK, mapNextRow(a))
}

// Create creates a new appointment.
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req appointmentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid request body",
		})
		return
	}

	if req.ClientID == 0 || req.PatientID == 0 || req.StartTime == "" {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "clientId, patientId, and startTime are required",
		})
		return
	}

	if req.Status == "" {
		req.Status = "SCHEDULED"
	}
	if req.Type == "" {
		req.Type = "EXAM"
	}

	a, err := h.getQueries(r).CreateAppointment(r.Context(), db.CreateAppointmentParams{
		ClientID:   req.ClientID,
		PatientID:  req.PatientID,
		VetID:      pgInt8Ptr(req.VetID),
		ResourceID: pgInt8Ptr(req.ResourceID),
		StartTime:  parseTimestamp(req.StartTime),
		EndTime:    parseTimestamp(req.EndTime),
		Reason:     helpers.PgText(req.Reason),
		Notes:      helpers.PgText(req.Notes),
		Status:     req.Status,
		Type:       req.Type,
	})
	if err != nil {
		log.Printf("ERROR: create appointment: %v", err)
		middleware.RespondError(w, err)
		return
	}
	middleware.RespondJSON(w, http.StatusCreated, mapAppointment(a))
}

// Update updates an existing appointment.
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(r, "id")
	if err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid appointment ID",
		})
		return
	}

	var req appointmentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid request body",
		})
		return
	}

	a, err := h.getQueries(r).UpdateAppointment(r.Context(), db.UpdateAppointmentParams{
		ID:         id,
		ClientID:   req.ClientID,
		PatientID:  req.PatientID,
		VetID:      pgInt8Ptr(req.VetID),
		ResourceID: pgInt8Ptr(req.ResourceID),
		StartTime:  parseTimestamp(req.StartTime),
		EndTime:    parseTimestamp(req.EndTime),
		Reason:     helpers.PgText(req.Reason),
		Notes:      helpers.PgText(req.Notes),
		Status:     req.Status,
		Type:       req.Type,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			middleware.RespondJSON(w, http.StatusNotFound, middleware.ErrorResponse{
				Error: "Not Found", Message: "appointment not found",
			})
			return
		}
		log.Printf("ERROR: update appointment: %v", err)
		middleware.RespondError(w, err)
		return
	}
	middleware.RespondJSON(w, http.StatusOK, mapAppointment(a))
}

// Delete deletes an appointment.
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(r, "id")
	if err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid appointment ID",
		})
		return
	}
	if err := h.getQueries(r).DeleteAppointment(r.Context(), id); err != nil {
		log.Printf("ERROR: delete appointment: %v", err)
		middleware.RespondError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// --- Mappers ---

func mapAppointment(a *db.Appointment) appointmentResponse {
	return appointmentResponse{
		ID:        a.ID,
		ClientID:  a.ClientID,
		PatientID: a.PatientID,
		VetID:     int8Ptr(a.VetID),
		StartTime: helpers.TimeVal(a.StartTime),
		EndTime:   helpers.TimeVal(a.EndTime),
		Reason:    helpers.TextVal(a.Reason),
		Notes:     helpers.TextVal(a.Notes),
		Status:    a.Status,
		Type:      a.Type,
		CreatedAt: helpers.TimeVal(a.CreatedAt),
		UpdatedAt: helpers.TimeVal(a.UpdatedAt),
	}
}

func mapListRow(a *db.ListAppointmentsRow) appointmentResponse {
	return appointmentResponse{
		ID:              a.ID,
		ClientID:        a.ClientID,
		PatientID:       a.PatientID,
		VetID:           int8Ptr(a.VetID),
		StartTime:       helpers.TimeVal(a.StartTime),
		EndTime:         helpers.TimeVal(a.EndTime),
		Reason:          helpers.TextVal(a.Reason),
		Notes:           helpers.TextVal(a.Notes),
		Status:          a.Status,
		Type:            a.Type,
		ClientFirstName: a.ClientFirstName,
		ClientLastName:  a.ClientLastName,
		ClientPhone:     helpers.TextVal(a.ClientPhone),
		PatientName:     a.PatientName,
		PatientSpecies:  a.PatientSpecies,
		VetUsername:     helpers.TextVal(a.VetUsername),
		VetFirstName:    helpers.TextVal(a.VetFirstName),
		VetLastName:     helpers.TextVal(a.VetLastName),
		CreatedAt:       helpers.TimeVal(a.CreatedAt),
		UpdatedAt:       helpers.TimeVal(a.UpdatedAt),
	}
}

func mapSearchRow(a *db.SearchAppointmentsRow) appointmentResponse {
	return appointmentResponse{
		ID:              a.ID,
		ClientID:        a.ClientID,
		PatientID:       a.PatientID,
		VetID:           int8Ptr(a.VetID),
		StartTime:       helpers.TimeVal(a.StartTime),
		EndTime:         helpers.TimeVal(a.EndTime),
		Reason:          helpers.TextVal(a.Reason),
		Notes:           helpers.TextVal(a.Notes),
		Status:          a.Status,
		Type:            a.Type,
		ClientFirstName: a.ClientFirstName,
		ClientLastName:  a.ClientLastName,
		PatientName:     a.PatientName,
		VetFirstName:    helpers.TextVal(a.VetFirstName),
		VetLastName:     helpers.TextVal(a.VetLastName),
		CreatedAt:       helpers.TimeVal(a.CreatedAt),
		UpdatedAt:       helpers.TimeVal(a.UpdatedAt),
	}
}

func mapDetailRow(a *db.GetAppointmentByIDRow) appointmentResponse {
	return appointmentResponse{
		ID:              a.ID,
		ClientID:        a.ClientID,
		PatientID:       a.PatientID,
		VetID:           int8Ptr(a.VetID),
		StartTime:       helpers.TimeVal(a.StartTime),
		EndTime:         helpers.TimeVal(a.EndTime),
		Reason:          helpers.TextVal(a.Reason),
		Notes:           helpers.TextVal(a.Notes),
		Status:          a.Status,
		Type:            a.Type,
		ClientFirstName: a.ClientFirstName,
		ClientLastName:  a.ClientLastName,
		ClientPhone:     helpers.TextVal(a.ClientPhone),
		PatientName:     a.PatientName,
		PatientSpecies:  a.PatientSpecies,
		VetUsername:     helpers.TextVal(a.VetUsername),
		VetFirstName:    helpers.TextVal(a.VetFirstName),
		VetLastName:     helpers.TextVal(a.VetLastName),
		CreatedAt:       helpers.TimeVal(a.CreatedAt),
		UpdatedAt:       helpers.TimeVal(a.UpdatedAt),
	}
}

func mapNextRow(a *db.GetNextAppointmentForVetRow) appointmentResponse {
	return appointmentResponse{
		ID:              a.ID,
		ClientID:        a.ClientID,
		PatientID:       a.PatientID,
		VetID:           int8Ptr(a.VetID),
		StartTime:       helpers.TimeVal(a.StartTime),
		EndTime:         helpers.TimeVal(a.EndTime),
		Reason:          helpers.TextVal(a.Reason),
		Notes:           helpers.TextVal(a.Notes),
		Status:          a.Status,
		Type:            a.Type,
		ClientFirstName: a.ClientFirstName,
		ClientLastName:  a.ClientLastName,
		PatientName:     a.PatientName,
		CreatedAt:       helpers.TimeVal(a.CreatedAt),
		UpdatedAt:       helpers.TimeVal(a.UpdatedAt),
	}
}

// --- Helpers ---

func parseID(r *http.Request, param string) (int64, error) {
	return strconv.ParseInt(chi.URLParam(r, param), 10, 64)
}

// pgInt8Ptr converts an *int64 to pgtype.Int8.
func pgInt8Ptr(n *int64) pgtype.Int8 {
	if n == nil {
		return pgtype.Int8{Valid: false}
	}
	return pgtype.Int8{Int64: *n, Valid: true}
}

// int8Ptr converts pgtype.Int8 to *int64, nil if NULL.
func int8Ptr(n pgtype.Int8) *int64 {
	if !n.Valid {
		return nil
	}
	return &n.Int64
}

// parseTimestamp parses multiple datetime formats from frontend.
func parseTimestamp(s string) pgtype.Timestamptz {
	if s == "" {
		return pgtype.Timestamptz{Valid: false}
	}

	formats := []string{
		time.RFC3339,
		"2006-01-02T15:04:05",
		"2006-01-02T15:04",
		"2006-01-02 15:04:05",
		"2006-01-02 15:04",
	}

	for _, format := range formats {
		if t, err := time.Parse(format, s); err == nil {
			return pgtype.Timestamptz{Time: t, Valid: true}
		}
	}

	// Try with local timezone
	for _, format := range formats {
		if t, err := time.ParseInLocation(format, s, time.Local); err == nil {
			return pgtype.Timestamptz{Time: t, Valid: true}
		}
	}

	return pgtype.Timestamptz{Valid: false}
}
