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

	"github.com/iosifidis/vetcloud/internal/auth"
	"github.com/iosifidis/vetcloud/internal/config"
	"github.com/iosifidis/vetcloud/internal/middleware"
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
	log.Println("Connected to database")

	// Setup router
	r := chi.NewRouter()

	// Global middleware
	r.Use(middleware.Recoverer)
	r.Use(middleware.Logger)
	r.Use(middleware.CORS(cfg.AllowedOrigins))

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

	// Register domain handlers
	auth.RegisterRoutes(r, cfg, pool)

	// TODO: Register remaining domain handlers (Phase 2+)
	// client.RegisterRoutes(r, pool)
	// patient.RegisterRoutes(r, pool)
	// appointment.RegisterRoutes(r, pool)
	// medical_record.RegisterRoutes(r, pool)
	// dashboard.RegisterRoutes(r, pool)
	// user.RegisterRoutes(r, pool)

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
