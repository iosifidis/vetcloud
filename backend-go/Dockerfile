# Multi-stage build for Go backend
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git

# Copy dependency files first (for caching)
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build binary
RUN CGO_ENABLED=0 GOOS=linux go build -o /vetcloud ./cmd/server

# ---

# Production image
FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

# Copy binary
COPY --from=builder /vetcloud .

# Copy migrations
COPY db/migrations ./db/migrations

EXPOSE 8080

CMD ["./vetcloud"]
