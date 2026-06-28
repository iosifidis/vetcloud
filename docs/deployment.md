# VetCloud — Deployment Guide

Οδηγός εγκατάστασης για **single-tenant** (ένα ιατρείο) και **multi-tenant** (SaaS — πολλά ιατρεία) mode.

---

## Περιεχόμενα

1. [Single-Tenant (Self-Hosted)](#1-single-tenant-self-hosted)
2. [Multi-Tenant (SaaS) στον Okeanos/VPS](#2-multi-tenant-saas)
3. [Δημιουργία νέου Tenant](#3-δημιουργία-νέου-tenant)
4. [Ενημέρωση (Updates)](#4-ενημέρωση-updates)
5. [Backup & Restore](#5-backup--restore)

---

## 1. Single-Tenant (Self-Hosted)

Ένα ιατρείο, ένας server. Η πιο απλή εγκατάσταση.

### Απαιτήσεις
- Linux server (Ubuntu 22.04+ / Debian 12+)
- Docker + Docker Compose
- Domain (π.χ. `myvet.example.com`) με DNS A record → IP server

### Βήματα

```bash
# 1. Clone το repository
git clone https://github.com/yourorg/vetcloud.git
cd vetcloud

# 2. Δημιουργία .env
cp .env.example .env
nano .env   # Συμπλήρωσε: POSTGRES_PASSWORD, JWT_SECRET, CORS_ORIGIN

# 3. Εκκίνηση
docker compose up -d

# 4. Εκτέλεση migrations (πρώτη φορά)
docker compose exec backend ./vetcloud migrate

# 5. Δημιουργία πρώτου admin user
docker compose exec backend ./vetcloud admin create \
  --username admin --email admin@myvet.gr
```

### Caddyfile για single-tenant με domain

Αντικατάστησε το `Caddyfile` με:
```caddyfile
myvet.example.com {
    handle /api/* {
        reverse_proxy backend:8080 {
            header_up Host {host}
        }
    }
    handle {
        reverse_proxy frontend:5173
    }
    encode gzip
}
```

Το Caddy αναλαμβάνει **αυτόματα** το Let's Encrypt SSL certificate.

---

## 2. Multi-Tenant (SaaS)

Πολλά ιατρεία στον ίδιο server μέσω wildcard subdomains.

### Απαιτήσεις
- Server (Okeanos, Hetzner, κλπ) με public IP
- Domain με **Cloudflare DNS** (για wildcard SSL)
- Docker + Docker Compose

### Αρχιτεκτονική

```
Internet
   │
   ▼
Caddy (*.vetcloud.gr)  ← wildcard TLS via Cloudflare DNS
   │
   ├── clinic-a.vetcloud.gr → backend:8080 (Host: clinic-a.vetcloud.gr)
   ├── clinic-b.vetcloud.gr → backend:8080 (Host: clinic-b.vetcloud.gr)
   └── vetcloud.gr          → frontend:80
          │
       Backend (Go)
          │
    ┌─────┴─────┐
    │ Catalog DB │ → ποιο slug αντιστοιχεί σε ποια DB
    └─────┬─────┘
    clinic_a_db  clinic_b_db  ...
```

### Βήμα 1: DNS στο Cloudflare

Στο Cloudflare dashboard για το `vetcloud.gr`:

| Type  | Name | Content       | Proxy |
|-------|------|---------------|-------|
| A     | `@`  | `<server IP>` | ✅ ON  |
| CNAME | `*`  | `vetcloud.gr` | ✅ ON  |

### Βήμα 2: Cloudflare API Token

1. Πήγαινε: https://dash.cloudflare.com/profile/api-tokens
2. **Create Token** → Custom Token
3. Permissions: `Zone → DNS → Edit`
4. Zone Resources: `Specific zone → vetcloud.gr`
5. Αντέγραψε το token

### Βήμα 3: Server Setup

```bash
# Σε νέο server (Okeanos/Hetzner)
sudo apt update && sudo apt install -y docker.io docker-compose-plugin git

# Clone
git clone https://github.com/yourorg/vetcloud.git
cd vetcloud

# Δημιουργία Caddy external network (ΜΙΑ φορά)
docker network create caddy_network

# Δημιουργία .env.production
cp .env.example .env.production
nano .env.production
```

Σημαντικές τιμές στο `.env.production`:
```env
SINGLE_TENANT=false
POSTGRES_PASSWORD=strong-random-password
JWT_SECRET=openssl-rand-hex-32-output
SUPER_ADMIN_KEY=another-strong-random-key
CLOUDFLARE_API_TOKEN=your-token-from-step-2
CORS_ORIGIN=https://vetcloud.gr
```

### Βήμα 4: Build & Deploy

```bash
# Build custom Caddy image (με Cloudflare plugin)
docker build -f Dockerfile.caddy -t vetcloud-caddy .

# Εκκίνηση production stack
docker compose -f docker-compose.production.yml up -d

# Migrations για main DB
docker compose -f docker-compose.production.yml exec backend ./vetcloud migrate

# Migrations για catalog DB
docker compose -f docker-compose.production.yml exec backend ./vetcloud migrate --catalog
```

### Βήμα 5: Έλεγχος SSL

Μετά από 1-2 λεπτά (Caddy αποκτά certificate):
```bash
curl https://vetcloud.gr/api/health
# → {"status":"ok","time":"..."}

curl https://clinic-a.vetcloud.gr/api/tenant/settings
# → 404 (το tenant δεν υπάρχει ακόμα — σωστό!)
```

---

## 3. Δημιουργία νέου Tenant

### Μέθοδος A: CLI (`vetcloud-admin`)

```bash
# Στον server
docker compose exec backend ./vetcloud-admin tenant create \
  --name "Κλινική Παπαδόπουλος" \
  --slug clinic-a \
  --db-url "postgres://admin:pass@catalog-db:5432/clinic_a_db?sslmode=disable" \
  --email "admin@papvet.gr" \
  --plan basic

# Δημιουργία της νέας DB (ξεχωριστό βήμα)
docker compose exec catalog-db psql -U admin -c "CREATE DATABASE clinic_a_db;"

# Migrations για τη νέα tenant DB
docker compose exec backend ./vetcloud-admin tenant migrate --slug clinic-a
```

### Μέθοδος B: API (Super Admin)

```bash
curl -X POST https://vetcloud.gr/api/super/tenants \
  -H "X-Super-Admin-Key: your-super-admin-key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Κλινική Παπαδόπουλος",
    "slug": "clinic-a",
    "db_url": "postgres://admin:pass@catalog-db:5432/clinic_a_db",
    "owner_email": "admin@papvet.gr",
    "plan": "basic"
  }'
```

### Αποτέλεσμα
Μετά τη δημιουργία, το `clinic-a.vetcloud.gr` είναι αυτόματα έτοιμο — **δεν χρειάζεται αλλαγή στο Caddy**.

---

## 4. Ενημέρωση (Updates)

```bash
cd vetcloud

# Pull νέο κώδικα
git pull origin main

# Rebuild και restart (zero-downtime για DB)
docker compose -f docker-compose.production.yml build backend
docker compose -f docker-compose.production.yml up -d --no-deps backend

# Αν υπάρχουν νέα migrations
docker compose -f docker-compose.production.yml exec backend ./vetcloud migrate
```

---

## 5. Backup & Restore

### Backup

```bash
# Κάνε backup όλα τα tenants (στο catalog)
docker compose exec catalog-db pg_dump -U admin vetcloud_catalog > backup_catalog_$(date +%Y%m%d).sql

# Backup ενός tenant
docker compose exec db pg_dump -U admin clinic_a_db > backup_clinic_a_$(date +%Y%m%d).sql
```

### Restore

```bash
# Restore catalog
docker compose exec -T catalog-db psql -U admin vetcloud_catalog < backup_catalog_20240101.sql

# Restore tenant
docker compose exec -T db psql -U admin clinic_a_db < backup_clinic_a_20240101.sql
```

### Αυτόματα Backups (cron)

```bash
# /etc/cron.d/vetcloud-backup
0 2 * * * root /opt/vetcloud/scripts/backup.sh >> /var/log/vetcloud-backup.log 2>&1
```

---

## Troubleshooting

### Το wildcard SSL δεν εκδίδεται
```bash
# Έλεγχος Caddy logs
docker compose logs caddy -f

# Συνηθισμένα προβλήματα:
# - Λάθος CLOUDFLARE_API_TOKEN
# - Το DNS record δεν έχει Proxy (πρέπει να είναι ON για Cloudflare)
# - Rate limit από Let's Encrypt (περίμενε 1 ώρα)
```

### Tenant δεν βρίσκεται (404)
```bash
# Έλεγχος αν το slug υπάρχει στο catalog
docker compose exec catalog-db psql -U admin vetcloud_catalog \
  -c "SELECT slug, is_active, db_url FROM tenants;"
```

### Backend δεν συνδέεται στο Catalog DB
```bash
# Έλεγχος healthcheck
docker compose ps
# Αν catalog-db δεν είναι healthy, ελέγξε τα logs:
docker compose logs catalog-db
```

---

## 🔐 6. Σύνδεση OIDC / SSO (Authentik, Keycloak)

Η εφαρμογή υποστηρίζει OpenID Connect (OIDC) για ταυτοποίηση μέσω κεντρικού παρόχου (π.χ. Authentik, Keycloak).

### Βήμα 1: Ρύθμιση Key/Secrets στο `.env`

Για την ασφαλή κρυπτογράφηση (AES-256-GCM) των client secrets στη βάση δεδομένων, πρέπει να οριστεί ένα κλειδί κρυπτογράφησης 32-bytes (64 hex χαρακτήρες):

```env
# Δημιουργία κλειδιού: openssl rand -hex 32
ENCRYPTION_KEY=d7c6fdf16d57ba8d3cbfa2f643e264627bca4df8db8f7e2d9ca081d4a0a184ef

# URL ανακατεύθυνσης (πρέπει να συμπίπτει με αυτό που δηλώνεται στον OIDC Provider)
OIDC_REDIRECT_URL=https://clinic-a.vetcloud.gr/api/auth/oidc/callback
```

### Βήμα 2: Ρύθμιση στον OIDC Provider (Authentik / Keycloak)

1. Δημιουργήστε ένα νέο OAuth2/OIDC Application.
2. Ορίστε το Redirect/Callback URI σε: `https://<your-subdomain>.vetcloud.gr/api/auth/oidc/callback`
3. Επιτρέψτε τα Scopes: `openid`, `profile`, `email`.
4. Αντιγράψτε το **Client ID** και το **Client Secret**.

### Βήμα 3: Ενεργοποίηση & Διαμόρφωση στην Εφαρμογή

1. Συνδεθείτε στο VetCloud ως **ADMIN**.
2. Μεταβείτε στις **Ρυθμίσεις Ιατρείου** (`/settings/tenant`).
3. Ενεργοποιήστε την επιλογή **Ενεργοποίηση OIDC**.
4. Συμπληρώστε τα πεδία:
   - **Issuer URL**: Η διεύθυνση του OIDC provider (π.χ. `https://authentik.company.com/application/o/vetcloud/`).
   - **Client ID**: Το Client ID από το βήμα 2.
   - **Client Secret**: Το Client Secret από το βήμα 2.
5. Πατήστε **Αποθήκευση Αλλαγών**.

Η επιλογή "Σύνδεση μέσω SSO (OIDC)" θα εμφανιστεί αυτόματα στη σελίδα σύνδεσης (`/login`).

### Λογική Provisioning Νέων Χρηστών

Όταν ένας χρήστης συνδέεται για πρώτη φορά μέσω SSO:
1. Αν υπάρχει ήδη χρήστης με το ίδιο email, ο λογαριασμός συνδέεται αυτόματα.
2. Αν δεν υπάρχει, δημιουργείται νέος χρήστης με ρόλο **CLIENT** (Pet Owner) και συνδεδεμένο προφίλ πελάτη.
3. Ένας διαχειριστής (Admin) μπορεί στη συνέχεια να μετατρέψει τον χρήστη σε **VET** (Κτηνίατρο) ή **ADMIN** μέσα από τη σελίδα **Χρήστες & Προσωπικό** (`/users`).
