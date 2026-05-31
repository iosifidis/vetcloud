package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/iosifidis/vetcloud/internal/appointment"
	"github.com/iosifidis/vetcloud/internal/auth"
	"github.com/iosifidis/vetcloud/internal/catalog"
	"github.com/iosifidis/vetcloud/internal/client"
	"github.com/iosifidis/vetcloud/internal/config"
	"github.com/iosifidis/vetcloud/internal/dashboard"
	"github.com/iosifidis/vetcloud/internal/medicalrecord"
	"github.com/iosifidis/vetcloud/internal/middleware"
	"github.com/iosifidis/vetcloud/internal/patient"
	"github.com/iosifidis/vetcloud/internal/tenant"
	"github.com/iosifidis/vetcloud/internal/user"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	log.Printf("Starting VetCloud API server (env=%s)", cfg.Environment)

	// Connect to database
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer pool.Close()

	// Verify connection
	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("failed to ping database: %v", err)
	}
	log.Println("Connected to default database")

	// Initialize Catalog DB (if multi-tenant)
	var catalogQueries *catalog.Queries
	if !cfg.SingleTenant {
		catalogPool, err := pgxpool.New(ctx, cfg.CatalogDatabaseURL)
		if err != nil {
			log.Fatalf("failed to connect to catalog database: %v", err)
		}
		defer catalogPool.Close()
		
		if err := catalogPool.Ping(ctx); err != nil {
			log.Fatalf("failed to ping catalog database: %v", err)
		}
		log.Println("Connected to catalog database")
		catalogQueries = catalog.New(catalogPool)
	}

	// Initialize Tenant Manager
	tenantManager := tenant.NewManager(catalogQueries, pool, cfg.SingleTenant)
	if err := tenantManager.LoadAll(ctx); err != nil {
		log.Printf("warning: failed to preload all tenants: %v", err)
	}
	defer tenantManager.Close()

	// Setup router
	r := chi.NewRouter()

	// Global middleware
	r.Use(middleware.Recoverer)
	r.Use(middleware.Logger)
	r.Use(middleware.CORS(cfg.AllowedOrigins))

	// Tenant middleware: injects tenant DB pool into request context
	r.Use(tenant.Middleware(tenantManager))

	// Health check
	r.Get("/api/health", func(w http.ResponseWriter, r *http.Request) {
		middleware.RespondJSON(w, http.StatusOK, map[string]string{
			"status": "ok",
			"time":   time.Now().Format(time.RFC3339),
		})
	})

	// Readiness check (DB connectivity)
	r.Get("/api/ready", func(w http.ResponseWriter, r *http.Request) {
		if err := pool.Ping(r.Context()); err != nil {
			middleware.RespondJSON(w, http.StatusServiceUnavailable, map[string]string{
				"status": "not ready",
				"error":  "database unavailable",
			})
			return
		}
		middleware.RespondJSON(w, http.StatusOK, map[string]string{
			"status": "ready",
		})
	})

	// Create shared auth service (used by handlers for middleware)
	authSvc := auth.NewService(cfg)

	// Register domain handlers
	auth.RegisterRoutes(r, cfg, pool)
	client.RegisterRoutes(r, cfg, pool, authSvc)
	patient.RegisterRoutes(r, cfg, pool, authSvc)
	appointment.RegisterRoutes(r, cfg, pool, authSvc)
	medicalrecord.RegisterRoutes(r, cfg, pool, authSvc)
	dashboard.RegisterRoutes(r, cfg, pool, authSvc)
	user.RegisterRoutes(r, cfg, pool, authSvc)

	// Register tenant management handlers
	if !cfg.SingleTenant {
		tenant.RegisterSuperRoutes(r, catalogQueries, cfg)
		tenant.RegisterSettingsRoutes(r, catalogQueries, authSvc)
	}

	// Create HTTP server
	srv := &http.Server{
		Addr:         cfg.Addr(),
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown
	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
		sig := <-sigChan
		log.Printf("Received signal %s, shutting down...", sig)

		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := srv.Shutdown(shutdownCtx); err != nil {
			log.Printf("HTTP server shutdown error: %v", err)
		}
	}()

	// Start server
	log.Printf("Listening on %s", cfg.Addr())
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("HTTP server error: %v", err)
	}

	fmt.Println("Server stopped gracefully")
}
