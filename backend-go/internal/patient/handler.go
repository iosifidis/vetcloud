package patient

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/iosifidis/vetcloud/internal/auth"
	"github.com/iosifidis/vetcloud/internal/config"
	"github.com/iosifidis/vetcloud/internal/db"
	"github.com/iosifidis/vetcloud/internal/helpers"
	"github.com/iosifidis/vetcloud/internal/middleware"
)

// Handler handles patient HTTP requests.
type Handler struct {
	queries *db.Queries
}

// RegisterRoutes mounts patient routes.
func RegisterRoutes(r chi.Router, cfg *config.Config, pool *pgxpool.Pool, authSvc *auth.Service) {
	h := &Handler{queries: db.New(pool)}

	r.Route("/api/patients", func(r chi.Router) {
		r.Use(auth.Middleware(authSvc))

		r.Get("/", h.ListAll)
		r.Get("/{id}", h.GetByID)
		r.Put("/{id}", h.Update)
		r.Delete("/{id}", h.Delete)
		r.Get("/owner/{ownerId}", h.ListByOwner)
		r.Put("/{id}/status", h.MarkDeceased)
		r.Put("/{id}/owner/{ownerId}", h.Transfer)
	})
}

// --- Response type ---

type patientResponse struct {
	ID                int64   `json:"id"`
	ClientID          int64   `json:"clientId"`
	Name              string  `json:"name"`
	Species           string  `json:"species"`
	Breed             string  `json:"breed"`
	Sex               string  `json:"sex"`
	BirthDate         string  `json:"birthDate"`
	IsDobApproximate  bool    `json:"isDobApproximate"`
	MicrochipNumber   string  `json:"microchipNumber"`
	MicrochipDate     string  `json:"microchipDate"`
	IsSterilized      bool    `json:"isSterilized"`
	SterilizationDate string  `json:"sterilizationDate"`
	Weight            float32 `json:"weight"`
	IsDeceased        bool    `json:"isDeceased"`
	OwnerFirstName    string  `json:"ownerFirstName,omitempty"`
	OwnerLastName     string  `json:"ownerLastName,omitempty"`
	CreatedAt         string  `json:"createdAt"`
	UpdatedAt         string  `json:"updatedAt"`
}

type patientRequest struct {
	Name              string   `json:"name"`
	Species           string   `json:"species"`
	Breed             string   `json:"breed"`
	Sex               string   `json:"sex"`
	BirthDate         string   `json:"birthDate"`
	IsDobApproximate  *bool    `json:"isDobApproximate"`
	MicrochipNumber   string   `json:"microchipNumber"`
	MicrochipDate     string   `json:"microchipDate"`
	IsSterilized      *bool    `json:"isSterilized"`
	SterilizationDate string   `json:"sterilizationDate"`
	Weight            *float32 `json:"weight"`
}

// --- Handlers ---

// ListAll returns all patients with owner info.
func (h *Handler) ListAll(w http.ResponseWriter, r *http.Request) {
	patients, err := h.queries.ListAllPatients(r.Context())
	if err != nil {
		log.Printf("ERROR: list patients: %v", err)
		middleware.RespondError(w, err)
		return
	}
	result := make([]patientResponse, len(patients))
	for i, p := range patients {
		result[i] = mapListPatientRow(p)
	}
	middleware.RespondJSON(w, http.StatusOK, result)
}

// GetByID returns a single patient.
func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(r, "id")
	if err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid patient ID",
		})
		return
	}

	p, err := h.queries.GetPatientByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			middleware.RespondJSON(w, http.StatusNotFound, middleware.ErrorResponse{
				Error: "Not Found", Message: "patient not found",
			})
			return
		}
		middleware.RespondError(w, err)
		return
	}
	middleware.RespondJSON(w, http.StatusOK, mapPatient(p))
}

// ListByOwner returns all patients for a specific client.
func (h *Handler) ListByOwner(w http.ResponseWriter, r *http.Request) {
	ownerID, err := parseID(r, "ownerId")
	if err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid owner ID",
		})
		return
	}

	patients, err := h.queries.ListPatientsByOwner(r.Context(), ownerID)
	if err != nil {
		log.Printf("ERROR: list patients by owner: %v", err)
		middleware.RespondError(w, err)
		return
	}
	result := make([]patientResponse, len(patients))
	for i, p := range patients {
		result[i] = mapPatient(p)
	}
	middleware.RespondJSON(w, http.StatusOK, result)
}

// Update updates an existing patient.
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(r, "id")
	if err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid patient ID",
		})
		return
	}

	var req patientRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid request body",
		})
		return
	}

	p, err := h.queries.UpdatePatient(r.Context(), db.UpdatePatientParams{
		ID:                id,
		Name:              req.Name,
		Species:           req.Species,
		Breed:             helpers.PgText(req.Breed),
		Sex:               helpers.PgText(req.Sex),
		BirthDate:         helpers.PgDate(req.BirthDate),
		IsDobApproximate:  helpers.PgBool(req.IsDobApproximate),
		MicrochipNumber:   helpers.PgText(req.MicrochipNumber),
		MicrochipDate:     helpers.PgDate(req.MicrochipDate),
		IsSterilized:      helpers.PgBool(req.IsSterilized),
		SterilizationDate: helpers.PgDate(req.SterilizationDate),
		Weight:            helpers.PgFloat4(req.Weight),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			middleware.RespondJSON(w, http.StatusNotFound, middleware.ErrorResponse{
				Error: "Not Found", Message: "patient not found",
			})
			return
		}
		log.Printf("ERROR: update patient: %v", err)
		middleware.RespondError(w, err)
		return
	}
	middleware.RespondJSON(w, http.StatusOK, mapPatient(p))
}

// Delete removes a patient.
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(r, "id")
	if err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid patient ID",
		})
		return
	}
	if err := h.queries.DeletePatient(r.Context(), id); err != nil {
		log.Printf("ERROR: delete patient: %v", err)
		middleware.RespondError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// MarkDeceased marks a patient as deceased.
func (h *Handler) MarkDeceased(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(r, "id")
	if err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid patient ID",
		})
		return
	}
	p, err := h.queries.MarkPatientDeceased(r.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			middleware.RespondJSON(w, http.StatusNotFound, middleware.ErrorResponse{
				Error: "Not Found", Message: "patient not found",
			})
			return
		}
		middleware.RespondError(w, err)
		return
	}
	middleware.RespondJSON(w, http.StatusOK, mapPatient(p))
}

// Transfer transfers a patient to a new owner.
func (h *Handler) Transfer(w http.ResponseWriter, r *http.Request) {
	patientID, err := parseID(r, "id")
	if err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid patient ID",
		})
		return
	}
	ownerID, err := parseID(r, "ownerId")
	if err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid owner ID",
		})
		return
	}

	p, err := h.queries.TransferPatient(r.Context(), db.TransferPatientParams{
		ID:       patientID,
		ClientID: ownerID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			middleware.RespondJSON(w, http.StatusNotFound, middleware.ErrorResponse{
				Error: "Not Found", Message: "patient not found",
			})
			return
		}
		middleware.RespondError(w, err)
		return
	}
	middleware.RespondJSON(w, http.StatusOK, mapPatient(p))
}

// --- Mappers ---

func mapPatient(p *db.Patient) patientResponse {
	return patientResponse{
		ID:                p.ID,
		ClientID:          p.ClientID,
		Name:              p.Name,
		Species:           p.Species,
		Breed:             helpers.TextVal(p.Breed),
		Sex:               helpers.TextVal(p.Sex),
		BirthDate:         helpers.DateVal(p.BirthDate),
		IsDobApproximate:  helpers.BoolVal(p.IsDobApproximate),
		MicrochipNumber:   helpers.TextVal(p.MicrochipNumber),
		MicrochipDate:     helpers.DateVal(p.MicrochipDate),
		IsSterilized:      helpers.BoolVal(p.IsSterilized),
		SterilizationDate: helpers.DateVal(p.SterilizationDate),
		Weight:            helpers.Float4Val(p.Weight),
		IsDeceased:        helpers.BoolVal(p.IsDeceased),
		CreatedAt:         helpers.TimeVal(p.CreatedAt),
		UpdatedAt:         helpers.TimeVal(p.UpdatedAt),
	}
}

func mapListPatientRow(p *db.ListAllPatientsRow) patientResponse {
	return patientResponse{
		ID:                p.ID,
		ClientID:          p.ClientID,
		Name:              p.Name,
		Species:           p.Species,
		Breed:             helpers.TextVal(p.Breed),
		Sex:               helpers.TextVal(p.Sex),
		BirthDate:         helpers.DateVal(p.BirthDate),
		IsDobApproximate:  helpers.BoolVal(p.IsDobApproximate),
		MicrochipNumber:   helpers.TextVal(p.MicrochipNumber),
		MicrochipDate:     helpers.DateVal(p.MicrochipDate),
		IsSterilized:      helpers.BoolVal(p.IsSterilized),
		SterilizationDate: helpers.DateVal(p.SterilizationDate),
		Weight:            helpers.Float4Val(p.Weight),
		IsDeceased:        helpers.BoolVal(p.IsDeceased),
		OwnerFirstName:    p.OwnerFirstName,
		OwnerLastName:     p.OwnerLastName,
		CreatedAt:         helpers.TimeVal(p.CreatedAt),
		UpdatedAt:         helpers.TimeVal(p.UpdatedAt),
	}
}

func parseID(r *http.Request, param string) (int64, error) {
	return strconv.ParseInt(chi.URLParam(r, param), 10, 64)
}
