package medicalrecord

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"

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

// Handler handles medical record HTTP requests.
type Handler struct {
	queries *db.Queries
}

// RegisterRoutes mounts medical record routes.
func RegisterRoutes(r chi.Router, cfg *config.Config, pool *pgxpool.Pool, authSvc *auth.Service) {
	h := &Handler{queries: db.New(pool)}

	r.Route("/api/medical-records", func(r chi.Router) {
		r.Use(auth.Middleware(authSvc))

		r.Post("/", h.Create)
		r.Get("/appointment/{appointmentId}", h.GetByAppointment)
		r.Get("/patient/{patientId}", h.ListByPatient)
		r.Get("/client/{clientId}", h.ListByClient)
		r.Put("/{id}", h.Update)
	})
}

// --- Request/Response types ---

type recordRequest struct {
	AppointmentID *int64   `json:"appointmentId"`
	PatientID     int64    `json:"patientId"`
	Diagnosis     string   `json:"diagnosis"`
	Treatment     string   `json:"treatment"`
	Notes         string   `json:"notes"`
	Symptoms      string   `json:"symptoms"`
	Weight        *float64 `json:"weight"`
	Temperature   *float64 `json:"temperature"`
}

type recordResponse struct {
	ID              int64    `json:"id"`
	AppointmentID   *int64   `json:"appointmentId,omitempty"`
	PatientID       int64    `json:"patientId"`
	Diagnosis       string   `json:"diagnosis"`
	Treatment       string   `json:"treatment"`
	Notes           string   `json:"notes"`
	Symptoms        string   `json:"symptoms"`
	Weight          float64  `json:"weight"`
	Temperature     float64  `json:"temperature"`
	AppointmentType string   `json:"appointmentType,omitempty"`
	VisitDate       string   `json:"visitDate,omitempty"`
	PatientName     string   `json:"patientName,omitempty"`
	CreatedAt       string   `json:"createdAt"`
	UpdatedAt       string   `json:"updatedAt"`
}

// --- Handlers ---

// Create creates a new medical record.
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req recordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid request body",
		})
		return
	}

	if req.PatientID == 0 {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "patientId is required",
		})
		return
	}

	rec, err := h.queries.CreateMedicalRecord(r.Context(), db.CreateMedicalRecordParams{
		AppointmentID: pgInt8Ptr(req.AppointmentID),
		PatientID:     req.PatientID,
		Diagnosis:     helpers.PgText(req.Diagnosis),
		Treatment:     helpers.PgText(req.Treatment),
		Notes:         helpers.PgText(req.Notes),
		Symptoms:      helpers.PgText(req.Symptoms),
		Weight:        helpers.PgFloat8(req.Weight),
		Temperature:   helpers.PgFloat8(req.Temperature),
	})
	if err != nil {
		log.Printf("ERROR: create medical record: %v", err)
		middleware.RespondError(w, err)
		return
	}
	middleware.RespondJSON(w, http.StatusCreated, mapRecord(rec))
}

// GetByAppointment returns a single medical record for an appointment.
func (h *Handler) GetByAppointment(w http.ResponseWriter, r *http.Request) {
	appointmentID, err := parseID(r, "appointmentId")
	if err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid appointment ID",
		})
		return
	}

	rec, err := h.queries.GetMedicalRecordByAppointment(r.Context(), pgtype.Int8{Int64: appointmentID, Valid: true})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			middleware.RespondJSON(w, http.StatusNotFound, middleware.ErrorResponse{
				Error: "Not Found", Message: "medical record not found",
			})
			return
		}
		middleware.RespondError(w, err)
		return
	}
	middleware.RespondJSON(w, http.StatusOK, mapRecord(rec))
}

// ListByPatient returns all medical records for a patient.
func (h *Handler) ListByPatient(w http.ResponseWriter, r *http.Request) {
	patientID, err := parseID(r, "patientId")
	if err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid patient ID",
		})
		return
	}

	records, err := h.queries.ListMedicalRecordsByPatient(r.Context(), patientID)
	if err != nil {
		log.Printf("ERROR: list medical records by patient: %v", err)
		middleware.RespondError(w, err)
		return
	}
	result := make([]recordResponse, len(records))
	for i, rec := range records {
		result[i] = mapPatientRecord(rec)
	}
	middleware.RespondJSON(w, http.StatusOK, result)
}

// ListByClient returns all medical records for a client's patients.
func (h *Handler) ListByClient(w http.ResponseWriter, r *http.Request) {
	clientID, err := parseID(r, "clientId")
	if err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid client ID",
		})
		return
	}

	records, err := h.queries.ListMedicalRecordsByClient(r.Context(), clientID)
	if err != nil {
		log.Printf("ERROR: list medical records by client: %v", err)
		middleware.RespondError(w, err)
		return
	}
	result := make([]recordResponse, len(records))
	for i, rec := range records {
		result[i] = mapClientRecord(rec)
	}
	middleware.RespondJSON(w, http.StatusOK, result)
}

// Update updates an existing medical record.
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(r, "id")
	if err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid record ID",
		})
		return
	}

	var req recordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid request body",
		})
		return
	}

	rec, err := h.queries.UpdateMedicalRecord(r.Context(), db.UpdateMedicalRecordParams{
		ID:          id,
		Diagnosis:   helpers.PgText(req.Diagnosis),
		Treatment:   helpers.PgText(req.Treatment),
		Notes:       helpers.PgText(req.Notes),
		Symptoms:    helpers.PgText(req.Symptoms),
		Weight:      helpers.PgFloat8(req.Weight),
		Temperature: helpers.PgFloat8(req.Temperature),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			middleware.RespondJSON(w, http.StatusNotFound, middleware.ErrorResponse{
				Error: "Not Found", Message: "medical record not found",
			})
			return
		}
		log.Printf("ERROR: update medical record: %v", err)
		middleware.RespondError(w, err)
		return
	}
	middleware.RespondJSON(w, http.StatusOK, mapRecord(rec))
}

// --- Mappers ---

func mapRecord(rec *db.MedicalRecord) recordResponse {
	return recordResponse{
		ID:            rec.ID,
		AppointmentID: helpers.Int8Ptr(rec.AppointmentID),
		PatientID:     rec.PatientID,
		Diagnosis:     helpers.TextVal(rec.Diagnosis),
		Treatment:     helpers.TextVal(rec.Treatment),
		Notes:         helpers.TextVal(rec.Notes),
		Symptoms:      helpers.TextVal(rec.Symptoms),
		Weight:        helpers.Float8Val(rec.Weight),
		Temperature:   helpers.Float8Val(rec.Temperature),
		CreatedAt:     helpers.TimeVal(rec.CreatedAt),
		UpdatedAt:     helpers.TimeVal(rec.UpdatedAt),
	}
}

func mapPatientRecord(rec *db.ListMedicalRecordsByPatientRow) recordResponse {
	return recordResponse{
		ID:              rec.ID,
		AppointmentID:   helpers.Int8Ptr(rec.AppointmentID),
		PatientID:       rec.PatientID,
		Diagnosis:       helpers.TextVal(rec.Diagnosis),
		Treatment:       helpers.TextVal(rec.Treatment),
		Notes:           helpers.TextVal(rec.Notes),
		Symptoms:        helpers.TextVal(rec.Symptoms),
		Weight:          helpers.Float8Val(rec.Weight),
		Temperature:     helpers.Float8Val(rec.Temperature),
		AppointmentType: helpers.TextVal(rec.AppointmentType),
		VisitDate:       helpers.TimeVal(rec.VisitDate),
		CreatedAt:       helpers.TimeVal(rec.CreatedAt),
		UpdatedAt:       helpers.TimeVal(rec.UpdatedAt),
	}
}

func mapClientRecord(rec *db.ListMedicalRecordsByClientRow) recordResponse {
	return recordResponse{
		ID:              rec.ID,
		AppointmentID:   helpers.Int8Ptr(rec.AppointmentID),
		PatientID:       rec.PatientID,
		Diagnosis:       helpers.TextVal(rec.Diagnosis),
		Treatment:       helpers.TextVal(rec.Treatment),
		Notes:           helpers.TextVal(rec.Notes),
		Symptoms:        helpers.TextVal(rec.Symptoms),
		Weight:          helpers.Float8Val(rec.Weight),
		Temperature:     helpers.Float8Val(rec.Temperature),
		AppointmentType: helpers.TextVal(rec.AppointmentType),
		VisitDate:       helpers.TimeVal(rec.VisitDate),
		PatientName:     rec.PatientName,
		CreatedAt:       helpers.TimeVal(rec.CreatedAt),
		UpdatedAt:       helpers.TimeVal(rec.UpdatedAt),
	}
}

// --- Helpers ---

func parseID(r *http.Request, param string) (int64, error) {
	return strconv.ParseInt(chi.URLParam(r, param), 10, 64)
}

func pgInt8Ptr(n *int64) pgtype.Int8 {
	if n == nil {
		return pgtype.Int8{Valid: false}
	}
	return pgtype.Int8{Int64: *n, Valid: true}
}
