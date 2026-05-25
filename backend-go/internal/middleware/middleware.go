package middleware

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"runtime/debug"
	"time"

	"github.com/iosifidis/vetcloud/internal/domain"
)

// ErrorResponse is the standard JSON error body.
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
}

// RespondJSON writes a JSON response with the given status code.
func RespondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if data != nil {
		if err := json.NewEncoder(w).Encode(data); err != nil {
			log.Printf("ERROR: failed to encode response: %v", err)
		}
	}
}

// RespondError writes a JSON error response, mapping domain errors to HTTP status codes.
func RespondError(w http.ResponseWriter, err error) {
	var status int
	var message string

	switch {
	case errors.Is(err, domain.ErrNotFound):
		status = http.StatusNotFound
		message = err.Error()
	case errors.Is(err, domain.ErrConflict):
		status = http.StatusConflict
		message = err.Error()
	case errors.Is(err, domain.ErrInvalidInput):
		status = http.StatusBadRequest
		message = err.Error()
	case errors.Is(err, domain.ErrUnauthorized):
		status = http.StatusUnauthorized
		message = "unauthorized"
	case errors.Is(err, domain.ErrForbidden):
		status = http.StatusForbidden
		message = "forbidden"
	case errors.Is(err, domain.ErrTokenExpired):
		status = http.StatusUnauthorized
		message = "token expired"
	case errors.Is(err, domain.ErrAppointmentLocked):
		status = http.StatusForbidden
		message = err.Error()
	default:
		status = http.StatusInternalServerError
		message = "internal server error"
		log.Printf("ERROR: unhandled error: %v", err)
	}

	RespondJSON(w, status, ErrorResponse{
		Error:   http.StatusText(status),
		Message: message,
	})
}

// Logger is an HTTP middleware that logs request method, path, status code, and duration.
func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Wrap writer to capture status code
		wrapped := &statusResponseWriter{ResponseWriter: w, statusCode: http.StatusOK}

		next.ServeHTTP(wrapped, r)

		log.Printf("%s %s %d %s",
			r.Method,
			r.URL.Path,
			wrapped.statusCode,
			time.Since(start).Round(time.Millisecond),
		)
	})
}

// Recoverer recovers from panics and returns a 500 error.
func Recoverer(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				log.Printf("PANIC: %v\n%s", rec, debug.Stack())
				RespondJSON(w, http.StatusInternalServerError, ErrorResponse{
					Error:   "Internal Server Error",
					Message: "an unexpected error occurred",
				})
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// statusResponseWriter wraps http.ResponseWriter to capture the status code.
type statusResponseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (w *statusResponseWriter) WriteHeader(code int) {
	w.statusCode = code
	w.ResponseWriter.WriteHeader(code)
}
