# VetCloud — Veterinary Practice Management System

Σύστημα διαχείρισης κτηνιατρικής κλινικής με υποστήριξη **multi-tenancy** (πολλές κλινικές στην ίδια εγκατάσταση).

---

## 📂 Δομή Project

```
vetcloud/
├── backend-go/          # Go REST API (Chi router, pgx, sqlc)
│   ├── cmd/
│   │   ├── server/      # Κύρια εφαρμογή
│   │   └── vetcloud-admin/  # CLI για διαχείριση tenants
│   ├── internal/
│   │   ├── auth/        # JWT authentication
│   │   ├── tenant/      # Multi-tenancy (manager, middleware, handlers)
│   │   ├── catalog/     # Catalog DB queries (sqlc-generated)
│   │   ├── client/      # Pet owners
│   │   ├── patient/     # Animals + alerts
│   │   ├── appointment/ # Scheduling
│   │   ├── medicalrecord/
│   │   ├── dashboard/
│   │   └── user/
│   └── db/
│       ├── migrations/       # golang-migrate SQL files (per-tenant)
│       └── catalog_queries/  # SQL queries για το catalog DB
├── frontend/            # React 19 + Vite + Tailwind CSS
│   └── src/
│       ├── context/
│       │   ├── AuthContext.jsx    # JWT + tenantSlug
│       │   └── TenantContext.jsx  # Dynamic branding (colors, logo, modules)
│       └── pages/
│           └── TenantSettingsPage.jsx  # Admin theming UI
├── docs/
│   └── deployment.md    # Πλήρης οδηγός εγκατάστασης
├── Caddyfile            # Dev reverse proxy
├── Caddyfile.production # Production wildcard SSL (Cloudflare)
├── Dockerfile.caddy     # Custom Caddy με cloudflare-dns plugin
├── docker-compose.yml             # Development
└── docker-compose.production.yml  # Production
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Go 1.22, Chi router, pgx v5, sqlc |
| **Frontend** | React 19, Vite, Tailwind CSS, Axios |
| **Database** | PostgreSQL 16 |
| **Migrations** | golang-migrate |
| **Reverse Proxy** | Caddy 2 |
| **Containerization** | Docker + Docker Compose |

---

## 🚀 Γρήγορη Εκκίνηση (Development)

### Απαιτήσεις
- [Docker](https://www.docker.com/) & Docker Compose
- [Go 1.22+](https://go.dev/) (για local development)
- [Node.js LTS](https://nodejs.org/) & npm

### 1. Clone & Setup

```bash
git clone https://github.com/iosifidis/vetcloud.git
cd vetcloud

# Αντίγραφο env vars
cp .env.example .env
# Επεξεργασία .env (αλλάζεις JWT_SECRET, κλπ)
nano .env
```

### 2. Εκκίνηση (Single-Tenant mode)

```bash
docker compose up -d
```

Η εφαρμογή είναι διαθέσιμη στο **http://localhost**.

### 3. Εκκίνηση (Multi-Tenant mode)

```bash
# Εκκινεί και το catalog DB
docker compose --profile multi-tenant up -d
```

---

## ⚙️ Multi-Tenancy

Το VetCloud υποστηρίζει δύο modes λειτουργίας:

| Mode | Χρήση | Env Var |
|------|-------|---------|
| **Single-Tenant** | Ένα ιατρείο, self-hosted | `SINGLE_TENANT=true` |
| **Multi-Tenant** | SaaS — πολλά ιατρεία | `SINGLE_TENANT=false` |

### Πώς λειτουργεί το routing

```
clinic-a.vetcloud.gr  →  Caddy  →  Go API
                                  (Host header: clinic-a.vetcloud.gr)
                                        ↓
                                  Tenant Middleware
                                  (slug: "clinic-a")
                                        ↓
                                  Catalog DB lookup
                                        ↓
                                  clinic_a_db (pgxpool)
```

### Δημιουργία νέου tenant (CLI)

```bash
docker compose exec backend ./vetcloud-admin tenant create \
  --name "Κλινική Παπαδόπουλος" \
  --slug clinic-a \
  --db-url "postgres://admin:pass@db:5432/clinic_a_db?sslmode=disable" \
  --email "admin@papvet.gr"

# Έλεγχος
docker compose exec backend ./vetcloud-admin tenant list
```

---

## 🏗️ Backend Development

```bash
cd backend-go

# Build
go build ./...

# Tests
go test ./...

# Τρέξιμο locally
export DATABASE_URL="postgres://admin:password123@localhost:5432/pims_db?sslmode=disable"
export JWT_SECRET="dev-secret-min-32-chars-long-here"
export SINGLE_TENANT=true
go run ./cmd/server
```

### sqlc (Database Query Generation)

```bash
cd backend-go
sqlc generate
```

---

## 🎨 Frontend Development

```bash
cd frontend

npm install
npm run dev     # http://localhost:5173
npm run build   # Production build
npm run lint
```

### Tenant Theming (TenantContext)

Το frontend φορτώνει δυναμικά το branding κάθε tenant:
- Χρώματα → CSS variables (`--color-primary`, `--color-secondary`)
- Λογότυπο & Όνομα κλινικής → Login page + Sidebar
- Enabled Modules → Conditional navigation links

---

## 🔐 Environment Variables

Δες το [`.env.example`](./.env.example) για πλήρη τεκμηρίωση.

Βασικές μεταβλητές:

| Variable | Περιγραφή | Default |
|----------|-----------|---------|
| `DATABASE_URL` | Tenant DB connection string | - |
| `CATALOG_DATABASE_URL` | Catalog DB (multi-tenant) | - |
| `SINGLE_TENANT` | Single ή multi-tenant mode | `true` |
| `JWT_SECRET` | JWT signing key (min 32 chars) | - |
| `SUPER_ADMIN_KEY` | API key για super-admin endpoints | - |
| `CLOUDFLARE_API_TOKEN` | Για wildcard SSL (production) | - |
| `ENCRYPTION_KEY` | Hex κλειδί 32-bytes για OIDC secrets | - |
| `OIDC_REDIRECT_URL` | URI επιστροφής από τον OIDC provider | - |

---

## 🌐 Production Deployment

Δες τον πλήρη οδηγό: **[docs/deployment.md](./docs/deployment.md)**

### Γρήγορη επισκόπηση (Multi-Tenant / Okeanos)

```bash
# 1. Δημιουργία Caddy network (μια φορά)
docker network create caddy_network

# 2. Build custom Caddy (με Cloudflare DNS plugin)
docker build -f Dockerfile.caddy -t vetcloud-caddy .

# 3. Production .env
cp .env.example .env.production
nano .env.production  # SINGLE_TENANT=false, CLOUDFLARE_API_TOKEN=...

# 4. Deploy
docker compose -f docker-compose.production.yml up -d
```

**DNS στο Cloudflare:**
| Type | Name | Content |
|------|------|---------|
| A | `@` | `<server IP>` |
| CNAME | `*` | `vetcloud.gr` |

---

## 🧪 Tests

```bash
# Backend
cd backend-go && go test ./...

# Frontend lint
cd frontend && npm run lint
```

---

## 📖 Docs

- [`docs/deployment.md`](./docs/deployment.md) — Πλήρης οδηγός εγκατάστασης
- [`.env.example`](./.env.example) — Όλα τα environment variables
