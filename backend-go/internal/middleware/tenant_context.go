package middleware

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type contextKey string

const (
	tenantPoolKey contextKey = "tenantPool"
	tenantSlugKey contextKey = "tenantSlug"
)

// WithTenantPool stores the tenant's database connection pool in the context.
func WithTenantPool(ctx context.Context, pool *pgxpool.Pool) context.Context {
	return context.WithValue(ctx, tenantPoolKey, pool)
}

// TenantPoolFromContext retrieves the tenant's database connection pool from the context.
func TenantPoolFromContext(ctx context.Context) *pgxpool.Pool {
	pool, _ := ctx.Value(tenantPoolKey).(*pgxpool.Pool)
	return pool
}

// WithTenantSlug stores the tenant's slug in the context.
func WithTenantSlug(ctx context.Context, slug string) context.Context {
	return context.WithValue(ctx, tenantSlugKey, slug)
}

// TenantSlugFromContext retrieves the tenant's slug from the context.
func TenantSlugFromContext(ctx context.Context) string {
	slug, _ := ctx.Value(tenantSlugKey).(string)
	return slug
}
