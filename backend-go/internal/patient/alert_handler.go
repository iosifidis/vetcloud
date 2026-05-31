package patient

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"github.com/jackc/pgx/v5"

	"github.com/iosifidis/vetcloud/internal/db"
	"github.com/iosifidis/vetcloud/internal/helpers"
	"github.com/iosifidis/vetcloud/internal/middleware"
)

// --- Request / Response types ---

type alertRequest struct {
	AlertType   string `json:"alertType"`
	Description string `json:"description"`
	Severity    string `json:"severity"` // LOW, MEDIUM, HIGH, CRITICAL
	IsActive    *bool  `json:"isActive"`
}

type alertResponse struct {
	ID          int64  `json:"id"`
	PatientID   int64  `json:"patientId"`
	AlertType   string `json:"alertType"`
	Description string `json:"description"`
	Severity    string `json:"severity"`
	IsActive    bool   `json:"isActive"`
	CreatedAt   string `json:"createdAt"`
}

// --- Alert handlers ---

// ListAlerts returns all alerts for a patient.
func (h *Handler) ListAlerts(w http.ResponseWriter, r *http.Request) {
	patientID, err := parseID(r, "id")
	if err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid patient ID",
		})
		return
	}

	alerts, err := h.getQueries(r).ListAlertsByPatient(r.Context(), patientID)
	if err != nil {
		log.Printf("ERROR: list alerts for patient %d: %v", patientID, err)
		middleware.RespondError(w, err)
		return
	}

	result := make([]alertResponse, len(alerts))
	for i, a := range alerts {
		result[i] = mapAlert(a)
	}
	middleware.RespondJSON(w, http.StatusOK, result)
}

// CreateAlert adds a new alert for a patient.
func (h *Handler) CreateAlert(w http.ResponseWriter, r *http.Request) {
	patientID, err := parseID(r, "id")
	if err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid patient ID",
		})
		return
	}

	var req alertRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid request body",
		})
		return
	}

	if req.Description == "" || req.AlertType == "" {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "alertType and description are required",
		})
		return
	}

	severity := req.Severity
	if severity == "" {
		severity = "MEDIUM"
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	alert, err := h.getQueries(r).CreateAlert(r.Context(), db.CreateAlertParams{
		PatientID:   patientID,
		AlertType:   req.AlertType,
		Description: req.Description,
		Severity:    severity,
		IsActive:    helpers.PgBoolVal(isActive),
	})
	if err != nil {
		log.Printf("ERROR: create alert for patient %d: %v", patientID, err)
		middleware.RespondError(w, err)
		return
	}

	middleware.RespondJSON(w, http.StatusCreated, mapAlert(alert))
}

// UpdateAlert updates an existing patient alert.
func (h *Handler) UpdateAlert(w http.ResponseWriter, r *http.Request) {
	alertID, err := parseID(r, "alertId")
	if err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid alert ID",
		})
		return
	}

	var req alertRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid request body",
		})
		return
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	alert, err := h.getQueries(r).UpdateAlert(r.Context(), db.UpdateAlertParams{
		ID:          alertID,
		AlertType:   req.AlertType,
		Description: req.Description,
		Severity:    req.Severity,
		IsActive:    helpers.PgBoolVal(isActive),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			middleware.RespondJSON(w, http.StatusNotFound, middleware.ErrorResponse{
				Error: "Not Found", Message: "alert not found",
			})
			return
		}
		log.Printf("ERROR: update alert %d: %v", alertID, err)
		middleware.RespondError(w, err)
		return
	}

	middleware.RespondJSON(w, http.StatusOK, mapAlert(alert))
}

// DeleteAlert removes a patient alert.
func (h *Handler) DeleteAlert(w http.ResponseWriter, r *http.Request) {
	alertID, err := parseID(r, "alertId")
	if err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid alert ID",
		})
		return
	}

	if err := h.getQueries(r).DeleteAlert(r.Context(), alertID); err != nil {
		log.Printf("ERROR: delete alert %d: %v", alertID, err)
		middleware.RespondError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// --- Mapper ---

func mapAlert(a *db.PatientAlert) alertResponse {
	return alertResponse{
		ID:          a.ID,
		PatientID:   a.PatientID,
		AlertType:   a.AlertType,
		Description: a.Description,
		Severity:    a.Severity,
		IsActive:    helpers.BoolVal(a.IsActive),
		CreatedAt:   helpers.TimeVal(a.CreatedAt),
	}
}
