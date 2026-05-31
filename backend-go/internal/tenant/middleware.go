package tenant

import (
	"net/http"
	"strings"

	"github.com/iosifidis/vetcloud/internal/middleware"
)

// Middleware extracts the tenant slug from the request (Host or Header)
// and injects the corresponding database pool into the context.
func Middleware(manager *Manager) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Fast path for single tenant mode
			if manager.singleTenant {
				pool, _ := manager.GetPool(r.Context(), "")
				ctx := middleware.WithTenantPool(r.Context(), pool)
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}

			// Try to get tenant from X-Tenant-ID header first (useful for dev/testing)
			slug := r.Header.Get("X-Tenant-ID")

			// If not in header, try to extract from Host (e.g. clinic-a.vetcloud.gr)
			if slug == "" {
				host := r.Host // Includes port if present (e.g. clinic-a.vetcloud.gr:8080)
				hostName := strings.Split(host, ":")[0]
				parts := strings.Split(hostName, ".")

				// We assume a structure like subdomain.domain.tld or subdomain.localhost
				// If there are at least 3 parts (clinic-a.vetcloud.gr), the first is the slug
				if len(parts) >= 3 {
					slug = parts[0]
				} else if len(parts) == 2 && parts[1] == "localhost" {
					// Handle clinic-a.localhost for local development
					slug = parts[0]
				}
			}

			// Special case for global endpoints (e.g. super-admin API, signup)
			// These don't need a specific tenant DB pool.
			if slug == "" || slug == "www" || slug == "admin" || slug == "api" {
				// We don't inject a pool, handlers must check if pool exists if they need it
				next.ServeHTTP(w, r)
				return
			}

			// Get the connection pool for this tenant
			pool, err := manager.GetPool(r.Context(), slug)
			if err != nil {
				middleware.RespondJSON(w, http.StatusBadRequest, middleware.ErrorResponse{
					Error:   "Bad Request",
					Message: "Invalid or inactive tenant",
				})
				return
			}

			// Inject the pool and slug into the context
			ctx := middleware.WithTenantPool(r.Context(), pool)
			ctx = middleware.WithTenantSlug(ctx, slug)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
