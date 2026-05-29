package user

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

// Handler handles user HTTP requests.
type Handler struct {
	queries *db.Queries
	authSvc *auth.Service
}

// RegisterRoutes mounts user routes.
func RegisterRoutes(r chi.Router, cfg *config.Config, pool *pgxpool.Pool, authSvc *auth.Service) {
	h := &Handler{
		queries: db.New(pool),
		authSvc: authSvc,
	}

	r.Route("/api/users", func(r chi.Router) {
		r.Use(auth.Middleware(authSvc))

		r.Get("/", h.List)
		r.Get("/vets", h.ListVets)
		r.Get("/{id}", h.GetByID)
		r.Post("/", h.Create)
		r.Put("/{id}", h.Update)
		r.Delete("/{id}", h.Delete)
	})
}

// --- Response types ---

type userResponse struct {
	ID        int64  `json:"id"`
	Username  string `json:"username"`
	Email     string `json:"email"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	IsActive  bool   `json:"isActive"`
	RoleName  string `json:"roleName"`
}

type userDetailResponse struct {
	userResponse
	RolePermissions []string `json:"rolePermissions"`
}

type userCreateRequest struct {
	Username  string `json:"username"`
	Password  string `json:"password"`
	Email     string `json:"email"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	RoleName  string `json:"roleName"`
}

type userUpdateRequest struct {
	Email     *string `json:"email"`
	FirstName *string `json:"firstName"`
	LastName  *string `json:"lastName"`
	IsActive  *bool   `json:"isActive"`
}

// --- Handlers ---

// List returns all users.
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	users, err := h.queries.ListUsers(r.Context())
	if err != nil {
		log.Printf("ERROR: list users: %v", err)
		middleware.RespondError(w, err)
		return
	}

	result := make([]userResponse, len(users))
	for i, u := range users {
		result[i] = userResponse{
			ID:        u.ID,
			Username:  u.Username,
			Email:     helpers.TextVal(u.Email),
			FirstName: helpers.TextVal(u.FirstName),
			LastName:  helpers.TextVal(u.LastName),
			IsActive:  u.IsActive,
			RoleName:  u.RoleName,
		}
	}
	middleware.RespondJSON(w, http.StatusOK, result)
}

// ListVets returns all active veterinarians.
func (h *Handler) ListVets(w http.ResponseWriter, r *http.Request) {
	vets, err := h.queries.ListVets(r.Context())
	if err != nil {
		log.Printf("ERROR: list vets: %v", err)
		middleware.RespondError(w, err)
		return
	}

	result := make([]userResponse, len(vets))
	for i, u := range vets {
		result[i] = userResponse{
			ID:        u.ID,
			Username:  u.Username,
			Email:     helpers.TextVal(u.Email),
			FirstName: helpers.TextVal(u.FirstName),
			LastName:  helpers.TextVal(u.LastName),
			IsActive:  u.IsActive,
			RoleName:  u.RoleName,
		}
	}
	middleware.RespondJSON(w, http.StatusOK, result)
}

// GetByID returns a user by ID.
func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(r, "id")
	if err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid user ID",
		})
		return
	}

	u, err := h.queries.GetUserByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			middleware.RespondJSON(w, http.StatusNotFound, middleware.ErrorResponse{
				Error: "Not Found", Message: "user not found",
			})
			return
		}
		middleware.RespondError(w, err)
		return
	}

	res := userDetailResponse{
		userResponse: userResponse{
			ID:        u.ID,
			Username:  u.Username,
			Email:     helpers.TextVal(u.Email),
			FirstName: helpers.TextVal(u.FirstName),
			LastName:  helpers.TextVal(u.LastName),
			IsActive:  u.IsActive,
			RoleName:  u.RoleName,
		},
		RolePermissions: u.RolePermissions,
	}
	middleware.RespondJSON(w, http.StatusOK, res)
}

// Create creates a new user.
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req userCreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid request body",
		})
		return
	}

	if req.Username == "" || req.Password == "" || req.RoleName == "" {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "username, password, and roleName are required",
		})
		return
	}

	// 1. Get role by name
	role, err := h.queries.GetRoleByName(r.Context(), req.RoleName)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
				Error: "Bad Request", Message: "invalid role name",
			})
			return
		}
		middleware.RespondError(w, err)
		return
	}

	// 2. Hash password
	hashed, err := h.authSvc.HashPassword(req.Password)
	if err != nil {
		middleware.RespondError(w, err)
		return
	}

	// 3. Insert user
	u, err := h.queries.CreateUser(r.Context(), db.CreateUserParams{
		Username:     req.Username,
		PasswordHash: hashed,
		Email:        helpers.PgText(req.Email),
		FirstName:    helpers.PgText(req.FirstName),
		LastName:     helpers.PgText(req.LastName),
		RoleID:       pgtype.Int8{Int64: role.ID, Valid: true},
	})
	if err != nil {
		log.Printf("ERROR: create user: %v", err)
		middleware.RespondError(w, err)
		return
	}

	res := userResponse{
		ID:        u.ID,
		Username:  u.Username,
		Email:     helpers.TextVal(u.Email),
		FirstName: helpers.TextVal(u.FirstName),
		LastName:  helpers.TextVal(u.LastName),
		IsActive:  u.IsActive,
		RoleName:  role.Name,
	}
	middleware.RespondJSON(w, http.StatusCreated, res)
}

// Update updates an existing user.
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(r, "id")
	if err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid user ID",
		})
		return
	}

	var req userUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid request body",
		})
		return
	}

	var emailVal pgtype.Text
	if req.Email != nil {
		emailVal = helpers.PgText(*req.Email)
	}
	var firstVal pgtype.Text
	if req.FirstName != nil {
		firstVal = helpers.PgText(*req.FirstName)
	}
	var lastVal pgtype.Text
	if req.LastName != nil {
		lastVal = helpers.PgText(*req.LastName)
	}
	var activeVal pgtype.Bool
	if req.IsActive != nil {
		activeVal = helpers.PgBoolVal(*req.IsActive)
	}

	u, err := h.queries.UpdateUser(r.Context(), db.UpdateUserParams{
		ID:        id,
		Email:     emailVal,
		FirstName: firstVal,
		LastName:  lastVal,
		IsActive:  activeVal,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			middleware.RespondJSON(w, http.StatusNotFound, middleware.ErrorResponse{
				Error: "Not Found", Message: "user not found",
			})
			return
		}
		log.Printf("ERROR: update user: %v", err)
		middleware.RespondError(w, err)
		return
	}

	middleware.RespondJSON(w, http.StatusOK, userResponse{
		ID:        u.ID,
		Username:  u.Username,
		Email:     helpers.TextVal(u.Email),
		FirstName: helpers.TextVal(u.FirstName),
		LastName:  helpers.TextVal(u.LastName),
		IsActive:  u.IsActive,
	})
}

// Delete deletes a user.
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(r, "id")
	if err != nil {
		middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: "Bad Request", Message: "invalid user ID",
		})
		return
	}

	err = h.queries.DeleteUser(r.Context(), id)
	if err != nil {
		middleware.RespondError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// --- Helpers ---

func parseID(r *http.Request, param string) (int64, error) {
	return strconv.ParseInt(chi.URLParam(r, param), 10, 64)
}
