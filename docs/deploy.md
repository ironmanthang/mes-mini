# Deployment Guide

## Production Stack

### Backend — Google Cloud Run

- Hosted via GitHub Actions workflow at `.github/workflows/deploy.yml`
- Runtime environment variables:
  - `NODE_ENV=production`
  - `CONTAINER_PORT=3000`
  - `DATABASE_URL` — Supabase transaction pooler (port `6543`)
  - `DIRECT_URL` — Supabase session pooler (port `5432`)
  - R2 storage values (`R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`)

### Database — Supabase

- PostgreSQL database with connection poolers
- `DATABASE_URL` uses the transaction pooler on port `6543`
- `DIRECT_URL` uses the session pooler on port `5432`

### Object Storage — Cloudflare R2

- R2-compatible object storage for file uploads
- Configured via the R2-related environment variables above

### Frontend — Cloudflare Pages

- Public domain: `https://mes-mini.pages.dev`
- Build settings:
  - **Root directory**: `frontend`
  - **Build command**: `npm run build`
  - **Build output directory**: `dist`
  - **Production branch**: `main`
  - **Automatic deployments**: enabled
- Build environment variable:
  - `VITE_API_URL=https://mes-mini-backend-433210406598.us-central1.run.app`

### Backend CORS

The API allows origins for:
- `http://localhost:5173` (Vite dev)
- `https://mes-mini.pages.dev` (production)
- `*.pages.dev` (preview deployments)
- `null`
- Local LAN IPs matching `http://192.<...>`

---

## Local Development Stack

Local development uses Docker Compose with:
- Local PostgreSQL
- MinIO (Cloudflare R2-compatible storage substitute)
- Backend container mapped to `HOST_PORT:CONTAINER_PORT`

---

## GitHub Actions Secrets

The repository uses these secrets for CI/CD:

- `GCP_PROJECT_ID`
- `GCP_SA_KEY`
- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
- `CONTAINER_PORT`
- `R2_ENDPOINT`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
