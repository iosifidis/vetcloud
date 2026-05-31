package tenant

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/iosifidis/vetcloud/internal/catalog"
)

// Manager manages database connection pools for multiple tenants.
type Manager struct {
	catalogQueries *catalog.Queries
	pools          sync.Map      // string (slug) -> *pgxpool.Pool
	defaultPool    *pgxpool.Pool // Used in single-tenant mode
	singleTenant   bool
}

// NewManager creates a new tenant manager.
// If singleTenant is true, it uses the provided defaultPool for everything
// and ignores the catalog.
func NewManager(catalogQueries *catalog.Queries, defaultPool *pgxpool.Pool, singleTenant bool) *Manager {
	return &Manager{
		catalogQueries: catalogQueries,
		defaultPool:    defaultPool,
		singleTenant:   singleTenant,
	}
}

// LoadAll preloads connection pools for all active tenants from the catalog.
// This is typically called during application startup.
func (m *Manager) LoadAll(ctx context.Context) error {
	if m.singleTenant {
		return nil
	}

	tenants, err := m.catalogQueries.ListActiveTenants(ctx)
	if err != nil {
		return fmt.Errorf("failed to list active tenants: %w", err)
	}

	for _, t := range tenants {
		_, err := m.GetPool(ctx, t.Slug)
		if err != nil {
			// Log the error but continue loading other tenants
			// In a real production system, you might want a structured logger here.
			fmt.Printf("Warning: failed to load pool for tenant %s: %v\n", t.Slug, err)
		}
	}

	return nil
}

// GetPool retrieves the connection pool for the given tenant slug.
// If it's not currently in the cache, it initializes a new one.
func (m *Manager) GetPool(ctx context.Context, slug string) (*pgxpool.Pool, error) {
	if m.singleTenant {
		return m.defaultPool, nil
	}

	// Fast path: check if pool already exists
	if pool, ok := m.pools.Load(slug); ok {
		return pool.(*pgxpool.Pool), nil
	}

	// Fetch tenant from catalog
	t, err := m.catalogQueries.GetTenantBySlug(ctx, slug)
	if err != nil {
		return nil, fmt.Errorf("tenant %s not found: %w", slug, err)
	}

	if !t.IsActive {
		return nil, fmt.Errorf("tenant %s is deactivated", slug)
	}

	// Initialize new pool
	config, err := pgxpool.ParseConfig(t.DbUrl)
	if err != nil {
		return nil, fmt.Errorf("failed to parse db url for tenant %s: %w", slug, err)
	}

	// Configure pool settings
	config.MaxConns = 20
	config.MinConns = 2
	config.MaxConnLifetime = time.Hour
	config.MaxConnIdleTime = 30 * time.Minute

	// Create pool (with a timeout to prevent hanging on bad connections)
	connCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	pool, err := pgxpool.NewWithConfig(connCtx, config)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to db for tenant %s: %w", slug, err)
	}

	// Verify connection
	if err := pool.Ping(connCtx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to ping db for tenant %s: %w", slug, err)
	}

	// Store in map (handle potential race condition where another goroutine created it)
	actualPool, loaded := m.pools.LoadOrStore(slug, pool)
	if loaded {
		// Another goroutine created it first, close ours and use theirs
		pool.Close()
		return actualPool.(*pgxpool.Pool), nil
	}

	return pool, nil
}

// Close gracefully closes all database connection pools.
func (m *Manager) Close() {
	if m.singleTenant && m.defaultPool != nil {
		m.defaultPool.Close()
		return
	}

	m.pools.Range(func(key, value interface{}) bool {
		pool := value.(*pgxpool.Pool)
		pool.Close()
		return true // continue iteration
	})
}
