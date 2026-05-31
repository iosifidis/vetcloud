package helpers

import (
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

// PgText creates a pgtype.Text from a string pointer or string.
// Empty strings result in NULL.
func PgText(s string) pgtype.Text {
	if s == "" {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: s, Valid: true}
}

// PgBool creates a pgtype.Bool.
func PgBool(b *bool) pgtype.Bool {
	if b == nil {
		return pgtype.Bool{Valid: false}
	}
	return pgtype.Bool{Bool: *b, Valid: true}
}

// PgBoolVal creates a pgtype.Bool from a value directly.
func PgBoolVal(b bool) pgtype.Bool {
	return pgtype.Bool{Bool: b, Valid: true}
}

// PgInt8 creates a pgtype.Int8.
func PgInt8(n *int64) pgtype.Int8 {
	if n == nil {
		return pgtype.Int8{Valid: false}
	}
	return pgtype.Int8{Int64: *n, Valid: true}
}

// PgFloat4 creates a pgtype.Float4.
func PgFloat4(f *float32) pgtype.Float4 {
	if f == nil {
		return pgtype.Float4{Valid: false}
	}
	return pgtype.Float4{Float32: *f, Valid: true}
}

// PgDate creates a pgtype.Date from a string (YYYY-MM-DD format).
func PgDate(s string) pgtype.Date {
	if s == "" {
		return pgtype.Date{Valid: false}
	}
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return pgtype.Date{Valid: false}
	}
	return pgtype.Date{Time: t, Valid: true}
}

// TextVal extracts a string from pgtype.Text, returning empty string if NULL.
func TextVal(t pgtype.Text) string {
	if !t.Valid {
		return ""
	}
	return t.String
}

// BoolVal extracts a bool from pgtype.Bool, returning false if NULL.
func BoolVal(b pgtype.Bool) bool {
	if !b.Valid {
		return false
	}
	return b.Bool
}

// Float4Val extracts a float32 from pgtype.Float4, returning 0 if NULL.
func Float4Val(f pgtype.Float4) float32 {
	if !f.Valid {
		return 0
	}
	return f.Float32
}

// DateVal formats a pgtype.Date as a string (YYYY-MM-DD), empty if NULL.
func DateVal(d pgtype.Date) string {
	if !d.Valid {
		return ""
	}
	return d.Time.Format("2006-01-02")
}

// TimeVal formats a pgtype.Timestamptz as RFC3339 string, empty if NULL.
func TimeVal(t pgtype.Timestamptz) string {
	if !t.Valid {
		return ""
	}
	return t.Time.Format(time.RFC3339)
}

// PgFloat8 creates a pgtype.Float8.
func PgFloat8(f *float64) pgtype.Float8 {
	if f == nil {
		return pgtype.Float8{Valid: false}
	}
	return pgtype.Float8{Float64: *f, Valid: true}
}

// Float8Val extracts a float64 from pgtype.Float8, returning 0 if NULL.
func Float8Val(f pgtype.Float8) float64 {
	if !f.Valid {
		return 0
	}
	return f.Float64
}

// Int8Val extracts an int64 from pgtype.Int8, returning 0 if NULL.
func Int8Val(n pgtype.Int8) int64 {
	if !n.Valid {
		return 0
	}
	return n.Int64
}

// Int8Ptr converts pgtype.Int8 to *int64, nil if NULL.
func Int8Ptr(n pgtype.Int8) *int64 {
	if !n.Valid {
		return nil
	}
	return &n.Int64
}
