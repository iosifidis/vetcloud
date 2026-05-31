package client

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

// Handler handles client HTTP requests.
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

// RegisterRoutes mounts client routes.
func RegisterRoutes(r chi.Router, cfg *config.Config, pool *pgxpool.Pool, authSvc *auth.Service) {
	h := &Handler{defaultQueries: db.New(pool)}

	r.Route("/api/clients", func(r chi.Router) {
		r.Use(auth.Middleware(authSvc))

		r.Get("/", h.List)
		r.Post("/", h.Create)
		r.Get("/{id}", h.GetByID)
		r.Put("/{id}", h.Update)
		r.Delete("/{id}", h.Delete)
		r.Post("/{id}/patients", h.AddPatient)
	})
}

// --- Request/Response types ---

type clientRequest struct {
	FirstName        string `json:"firstName"`
	LastName         string `json:"lastName"`
	Email            string `json:"email"`
	Phone            string `json:"phone"`
	Address          string `json:"address"`
	Afm              string `json:"afm"`
	Adt              string `json:"adt"`
	GdprConsent      *bool  `json:"gdprConsent"`
	IsStrayCaretaker *bool  `json:"isStrayCaretaker"`
}

type clientResponse struct {
	ID               int64   `json:"id"`
	FirstName        string  `json:"firstName"`
	LastName         string  `json:"lastName"`
	Email            string  `json:"email"`
	Phone            string  `json:"phone"`
	Address          string  `json:"address"`
	Afm              string  `json:"afm"`
	Adt              string  `json:"adt"`
	GdprConsent      bool    `json:"gdprConsent"`
	Balance          float64 `json:"balance"`
	IsStrayCaretaker bool    `json:"isStrayCaretaker"`
	PetCount         int32   `json:"petCount,omitempty"`
	CreatedAt        string  `json:"createdAt"`
	UpdatedAt        string  `json:"updatedAt"`
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

// List returns all clients, optionally filtered by search query.
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	search := r.URL.Query().Get("search")

	if search != "" {
		clients, err := h.getQueries(r).SearchClients(r.Context(), helpers.PgText(search))
		if err != nil {
			log.Printf("ERROR: search clients: %v", err)
			middleware.RespondError(w, err)
			return
		}
		result := make([]clientResponse, len(clients))
		for i, c := range clients {
			result[i] = mapSearchClientRow(c)
		}
		middleware.RespondJSON(w, http.StatusOK, result)
		return
	}

	clients, err := h.getQueries(r).ListClients(r.Context())
	if err != nil {
		log.Printf("ERROR: list clients: %v", err)
		middleware.RespondError(w, err)
		return
	}
	result := make([]clientResponse, len(clients))
	for i, c := range clients {
		result[i] = mapListClientRow(c)
	}
	middleware.RespondJSON(w, http.StatusOK, result)
}

// GetByID returns a single client.
func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(r, "id")
	if err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid client ID",
		})
		return
	}

	client, err := h.getQueries(r).GetClientByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			middleware.RespondJSON(w, http.StatusNotFound, middleware.ErrorResponse{
				Error: "Not Found", Message: "client not found",
			})
			return
		}
		middleware.RespondError(w, err)
		return
	}

	middleware.RespondJSON(w, http.StatusOK, mapClient(client))
}

// Create creates a new client.
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req clientRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid request body",
		})
		return
	}

	if req.FirstName == "" || req.LastName == "" || req.Email == "" {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "firstName, lastName, and email are required",
		})
		return
	}

	client, err := h.getQueries(r).CreateClient(r.Context(), db.CreateClientParams{
		FirstName:        req.FirstName,
		LastName:         req.LastName,
		Email:            req.Email,
		Phone:            helpers.PgText(req.Phone),
		Address:          helpers.PgText(req.Address),
		Afm:              helpers.PgText(req.Afm),
		Adt:              helpers.PgText(req.Adt),
		GdprConsent:      helpers.PgBool(req.GdprConsent),
		IsStrayCaretaker: helpers.PgBool(req.IsStrayCaretaker),
	})
	if err != nil {
		log.Printf("ERROR: create client: %v", err)
		middleware.RespondError(w, err)
		return
	}

	middleware.RespondJSON(w, http.StatusCreated, mapClient(client))
}

// Update updates an existing client.
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(r, "id")
	if err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid client ID",
		})
		return
	}

	var req clientRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid request body",
		})
		return
	}

	client, err := h.getQueries(r).UpdateClient(r.Context(), db.UpdateClientParams{
		ID:               id,
		FirstName:        req.FirstName,
		LastName:         req.LastName,
		Email:            req.Email,
		Phone:            helpers.PgText(req.Phone),
		Address:          helpers.PgText(req.Address),
		Afm:              helpers.PgText(req.Afm),
		Adt:              helpers.PgText(req.Adt),
		GdprConsent:      helpers.PgBool(req.GdprConsent),
		IsStrayCaretaker: helpers.PgBool(req.IsStrayCaretaker),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			middleware.RespondJSON(w, http.StatusNotFound, middleware.ErrorResponse{
				Error: "Not Found", Message: "client not found",
			})
			return
		}
		log.Printf("ERROR: update client: %v", err)
		middleware.RespondError(w, err)
		return
	}

	middleware.RespondJSON(w, http.StatusOK, mapClient(client))
}

// Delete deletes a client.
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(r, "id")
	if err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid client ID",
		})
		return
	}

	if err := h.getQueries(r).DeleteClient(r.Context(), id); err != nil {
		log.Printf("ERROR: delete client: %v", err)
		middleware.RespondError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// AddPatient creates a new patient for a client.
func (h *Handler) AddPatient(w http.ResponseWriter, r *http.Request) {
	clientID, err := parseID(r, "id")
	if err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid client ID",
		})
		return
	}

	// Verify client exists
	if _, err := h.getQueries(r).GetClientByID(r.Context(), clientID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			middleware.RespondJSON(w, http.StatusNotFound, middleware.ErrorResponse{
				Error: "Not Found", Message: "client not found",
			})
			return
		}
		middleware.RespondError(w, err)
		return
	}

	var req patientRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid request body",
		})
		return
	}

	if req.Name == "" || req.Species == "" {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "name and species are required",
		})
		return
	}

	patient, err := h.getQueries(r).CreatePatient(r.Context(), db.CreatePatientParams{
		ClientID:          clientID,
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
		log.Printf("ERROR: create patient: %v", err)
		middleware.RespondError(w, err)
		return
	}

	middleware.RespondJSON(w, http.StatusCreated, mapPatient(patient))
}

// --- Mappers ---

func mapClient(c *db.Client) clientResponse {
	return clientResponse{
		ID:               c.ID,
		FirstName:        c.FirstName,
		LastName:         c.LastName,
		Email:            c.Email,
		Phone:            helpers.TextVal(c.Phone),
		Address:          helpers.TextVal(c.Address),
		Afm:              helpers.TextVal(c.Afm),
		Adt:              helpers.TextVal(c.Adt),
		GdprConsent:      helpers.BoolVal(c.GdprConsent),
		Balance:          c.Balance,
		IsStrayCaretaker: helpers.BoolVal(c.IsStrayCaretaker),
		CreatedAt:        helpers.TimeVal(c.CreatedAt),
		UpdatedAt:        helpers.TimeVal(c.UpdatedAt),
	}
}

func mapListClientRow(c *db.ListClientsRow) clientResponse {
	return clientResponse{
		ID:               c.ID,
		FirstName:        c.FirstName,
		LastName:         c.LastName,
		Email:            c.Email,
		Phone:            helpers.TextVal(c.Phone),
		Address:          helpers.TextVal(c.Address),
		Afm:              helpers.TextVal(c.Afm),
		Adt:              helpers.TextVal(c.Adt),
		GdprConsent:      helpers.BoolVal(c.GdprConsent),
		Balance:          c.Balance,
		IsStrayCaretaker: helpers.BoolVal(c.IsStrayCaretaker),
		PetCount:         c.PetCount,
		CreatedAt:        helpers.TimeVal(c.CreatedAt),
		UpdatedAt:        helpers.TimeVal(c.UpdatedAt),
	}
}

func mapSearchClientRow(c *db.SearchClientsRow) clientResponse {
	return clientResponse{
		ID:               c.ID,
		FirstName:        c.FirstName,
		LastName:         c.LastName,
		Email:            c.Email,
		Phone:            helpers.TextVal(c.Phone),
		Address:          helpers.TextVal(c.Address),
		Afm:              helpers.TextVal(c.Afm),
		Adt:              helpers.TextVal(c.Adt),
		GdprConsent:      helpers.BoolVal(c.GdprConsent),
		Balance:          c.Balance,
		IsStrayCaretaker: helpers.BoolVal(c.IsStrayCaretaker),
		PetCount:         c.PetCount,
		CreatedAt:        helpers.TimeVal(c.CreatedAt),
		UpdatedAt:        helpers.TimeVal(c.UpdatedAt),
	}
}

// parseID extracts a URL parameter as int64.
func parseID(r *http.Request, param string) (int64, error) {
	return strconv.ParseInt(chi.URLParam(r, param), 10, 64)
}

type patientResponse struct {
	ID               int64   `json:"id"`
	ClientID         int64   `json:"clientId"`
	Name             string  `json:"name"`
	Species          string  `json:"species"`
	Breed            string  `json:"breed"`
	Sex              string  `json:"sex"`
	BirthDate        string  `json:"birthDate"`
	IsDobApproximate bool    `json:"isDobApproximate"`
	MicrochipNumber  string  `json:"microchipNumber"`
	MicrochipDate    string  `json:"microchipDate"`
	IsSterilized     bool    `json:"isSterilized"`
	Weight           float32 `json:"weight"`
	IsDeceased       bool    `json:"isDeceased"`
	CreatedAt        string  `json:"createdAt"`
	UpdatedAt        string  `json:"updatedAt"`
}

func mapPatient(p *db.Patient) patientResponse {
	return patientResponse{
		ID:               p.ID,
		ClientID:         p.ClientID,
		Name:             p.Name,
		Species:          p.Species,
		Breed:            helpers.TextVal(p.Breed),
		Sex:              helpers.TextVal(p.Sex),
		BirthDate:        helpers.DateVal(p.BirthDate),
		IsDobApproximate: helpers.BoolVal(p.IsDobApproximate),
		MicrochipNumber:  helpers.TextVal(p.MicrochipNumber),
		MicrochipDate:    helpers.DateVal(p.MicrochipDate),
		IsSterilized:     helpers.BoolVal(p.IsSterilized),
		Weight:           helpers.Float4Val(p.Weight),
		IsDeceased:       helpers.BoolVal(p.IsDeceased),
		CreatedAt:        helpers.TimeVal(p.CreatedAt),
		UpdatedAt:        helpers.TimeVal(p.UpdatedAt),
	}
}
