# Cloud Run + Supabase + Cloudflare Pages Hosting Guide

> [!TIP]
> **Cost: $0/month** — This is a truly free, production-ready hosting stack.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Internet Users                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
┌─────────────────────┐       ┌─────────────────────────────┐
│  Cloudflare Pages   │       │     Google Cloud Run        │
│  (React Frontend)   │──────▶│     (Node.js Backend)       │
│  mes-mini.pages.dev │       │  mes-mini-backend-433210406598.us-central1.run.app │
└─────────────────────┘       └──────────────┬──────────────┘
                                             │
                                             ▼
                              ┌─────────────────────────────┐
                              │       Supabase              │
                              │    (PostgreSQL Database)    │
                              │  aws-xxx.pooler.supabase.com│
                              └─────────────────────────────┘
```

## Free Tier Limits

| Service | Free Tier | Sufficient for MES-Mini? |
|---------|-----------|--------------------------|
| **Cloudflare Pages** | Unlimited bandwidth, 500 builds/month | ✅ Yes |
| **Cloud Run** | 2M requests, 180K vCPU-sec, 360K GiB-sec/month | ✅ Yes |
| **Supabase** | 500 MB storage, 2 projects | ✅ Yes |

---

## Prerequisites

- [x] Google Cloud account (with billing enabled but $0 charge)
- [x] Supabase account (already have this from `.env`)
- [x] Cloudflare account
- [x] GitHub repository with your code

---

## Current Deployment Info

- **Project ID**: `gen-lang-client-0845792795`
- **Region**: `us-central1`
- **Service Name**: `mes-mini-backend`
- **Backend URL**: `https://mes-mini-backend-433210406598.us-central1.run.app`

---

## Part 0: Delete Existing GCP VM (lite-mes)

> [!CAUTION]
> This will permanently delete your VM and all data on it. Make sure you have backups.

### Option A: Via Console (Recommended)

1. Go to [GCP Console → Compute Engine → VM Instances](https://console.cloud.google.com/compute/instances)
2. Select `lite-mes` checkbox
3. Click **DELETE** button at top
4. Confirm deletion

### Option B: Via gcloud CLI

```bash
# Delete the VM
gcloud compute instances delete lite-mes --zone=us-central1-c --quiet

# Verify deletion
gcloud compute instances list
```

### Release Static IP (if any)

```bash
# List all static IPs
gcloud compute addresses list

# Release if found
gcloud compute addresses delete <IP_NAME> --region=us-central1
```

### Disable Hidden GCP Services (to avoid surprise charges)

```bash
# VM Manager (auto-enabled, charges for monitoring)
gcloud services disable osconfig.googleapis.com --force

# Network Intelligence Center
gcloud services disable networkmanagement.googleapis.com --force
```

---

## Part 1: Set Up Supabase Database

### Step 1.1: Create Project (if not exists)

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Choose:
   - **Name**: `mes-mini`
   - **Region**: `Southeast Asia (Singapore)` or closest to you
   - **Password**: Generate strong password

### Step 1.2: Get Connection Strings

Go to **Project Settings → Database → Connection String**

You need TWO URLs:

| Type | Port | Use For |
|------|------|---------|
| **Transaction Pooler** | 6543 | `DATABASE_URL` (normal queries) |
| **Session Pooler** | 5432 | `DIRECT_URL` (migrations) |

Copy both and save them.

### Step 1.3: Update schema.prisma

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // Required for Supabase!
}
```

---

## Part 2: Deploy Backend to Cloud Run

### Step 2.1: Prepare Dockerfile

Your existing `backend/Dockerfile` should work. Make sure it:
- Exposes port 3000 (or matches `CONTAINER_PORT`)
- Has `npm start` as the CMD (not `npm run dev`)

### Step 2.2: Create Production Dockerfile (if needed)

```dockerfile
FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate

EXPOSE 3000
CMD ["npm", "start"]
```

### Step 2.3: Deploy to Cloud Run

**Option A: Via Console**

1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Click **CREATE SERVICE**
3. Choose **Continuously deploy from a repository**
4. Connect your GitHub repo
5. Configure:
   - **Region**: `us-central1` (FREE TIER!)
   - **CPU**: Only allocated during requests
   - **Minimum instances**: 0 (scales to zero)
   - **Maximum instances**: 1-2
   - **Memory**: 512 MiB
   - **CPU**: 1

**Option B: Via gcloud CLI**

```bash
# Build and deploy from source
gcloud run deploy mes-mini-backend \
  --source ./backend \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "DATABASE_URL=postgresql://...,DIRECT_URL=postgresql://...,JWT_SECRET=your-secret"
```

### Step 2.4: Set Environment Variables

In Cloud Run Console → Your Service → **Edit & Deploy New Revision** → **Variables & Secrets**:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://postgres.xxx:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | `postgresql://postgres.xxx:password@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres` |
| `JWT_SECRET` | Your secret key |
| `PORT` | `3000` |
| `API_URL` | `https://mes-mini-backend-...run.app` |
| **`R2_ENDPOINT`** | `https://<id>.r2.cloudflarestorage.com` |
| **`R2_ACCESS_KEY_ID`** | (Real Cloudflare Access Key) |
| **`R2_SECRET_ACCESS_KEY`** | (Real Cloudflare Secret Key) |
| **`R2_BUCKET_NAME`** | `lite-mes` |

### Step 2.5: Run Migrations

```bash
# Locally, with DIRECT_URL pointing to Supabase
cd backend
npx prisma migrate deploy
npx prisma db seed  # if you have seed data
```

---

## Part 3: Deploy Frontend to Cloudflare Pages

### Step 3.1: Update Frontend API URL

In `frontend/.env.production`:

```env
VITE_API_URL=https://mes-mini-backend-433210406598.us-central1.run.app
```

### Step 3.2: Deploy to Cloudflare Pages

1. Go to [Cloudflare Dashboard → Pages](https://dash.cloudflare.com/?to=/:account/pages)
2. Click **Create a project** → **Connect to Git**
3. Select your repository
4. Configure build:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `frontend`
5. Add environment variable:
   - `VITE_API_URL` = `https://mes-mini-backend-433210406598.us-central1.run.app`
6. Click **Save and Deploy**

Your frontend will be at: `https://mes-mini.pages.dev`

---

## Part 4: Configure CORS on Backend

Update `backend/src/server.ts`:

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',           // Vite dev
    'https://mes-mini.pages.dev',      // Cloudflare Pages
    /\.pages\.dev$/,                   // CF preview deploys
  ],
  credentials: true
}));
```

---

## Part 6: Automated CI/CD (GitHub Actions)

We have automated the deployment process. Whenever you push changes to the `main` branch inside the `backend/` folder, GitHub Actions will automatically rebuild the image and deploy it.

### Step 6.1: Configure GitHub Secrets

Go to your GitHub Repository → **Settings → Secrets and variables → Actions** and add the following:

| Secret Name | Value |
| :--- | :--- |
| `GCP_PROJECT_ID` | `gen-lang-client-0845792795` |
| `GCP_SA_KEY` | Your Service Account JSON Key |
| `DATABASE_URL` | Transaction Pooler URL (Port 6543) |
| `DIRECT_URL` | Session Pooler URL (Port 5432) |
| `JWT_SECRET` | Your private signing key |
| `CONTAINER_PORT` | `3000` |

### Step 6.2: How it works

1. **Trigger**: Push to `main` branch (path: `backend/**`).
2. **Build**: GitHub builds a new Docker image from your `backend/Dockerfile`.
3. **Artifact Registry**: The image is pushed to `us-central1-docker.pkg.dev` (the modern, non-deprecated registry).
4. **Cloud Run**: The service is updated to the new image revision with zero downtime.

---

## Part 7: Verify Deployment

### Checklist

- [ ] Cloud Run backend responds: `https://mes-mini-backend-433210406598.us-central1.run.app/api-docs/`
- [ ] Supabase database connected: Check Cloud Run logs
- [ ] Frontend loads: `https://mes-mini.pages.dev`
- [ ] API calls work: Try login/signup on frontend

### Troubleshooting

| Cold start slow (~5s) | Normal for scale-to-zero; set min instances to 1 if needed |

---

## Part 8: Database Maintenance (Reset vs Safe Update)

Managing a remote database requires a different approach than local dev. **Never** run `npx prisma migrate dev` directly against Supabase; always generate migrations locally first.

### Workflow A: Full Reset & Seed (DESTROYS DATA)
Use this only during setup or if you want to wipe everything and start from scratch.

1.  **Open PowerShell** on your computer, in the `backend/` folder.
2.  **Set temporary environment variables** (Replace `[YOUR-PASSWORD]`):
    ```powershell
    $env:DATABASE_URL="postgresql://postgres.yrcobwomqngtkkbwfgjm:[YOUR-PASSWORD]@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
    $env:DIRECT_URL="postgresql://postgres.yrcobwomqngtkkbwfgjm:[YOUR-PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres"
    ```
3.  **Run the reset**:
    ```powershell
    npx prisma migrate reset --force
    npx prisma db seed
    ```
4.  **Clear variables** (safety):
    ```powershell
    $env:DATABASE_URL=$null; $env:DIRECT_URL=$null
    ```

### Workflow B: Safe Update (KEEPS REAL USER DATA)
Use this when adding new tables/columns to a database that already has real users.

1.  **Local Step**: Modify `schema.prisma` and generate the migration locally:
    ```powershell
    # This creates a SQL file in prisma/migrations/
    npx prisma migrate dev --name <describe_your_change>
    ```
2.  **Production Step**: Apply the new migration to Supabase:
    ```powershell
    # 1. Set environment to Supabase
    $env:DATABASE_URL="postgresql://postgres.yrcobwomqngtkkbwfgjm:[YOUR-PASSWORD]@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
    $env:DIRECT_URL="postgresql://postgres.yrcobwomqngtkkbwfgjm:[YOUR-PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres"

    # 2. Apply ONLY the new migrations (SAFE)
    npx prisma migrate deploy

    # 3. Cleanup
    $env:DATABASE_URL=$null; $env:DIRECT_URL=$null
    ```

> [!TIP]
> **Summary**: Use `migrate reset` to wipe everything. Use `migrate deploy` to keep your existing users and just add new features.

---

### Workflow C: Zero-Downtime Updates (Expand and Contract Pattern)
*This is an advanced pattern we plan to use in the future when the system demands 100% uptime during deployments.*

When making breaking changes (like renaming a column or making a previously optional field required), a simple `migrate deploy` could temporarily crash the backend during the deployment window. The **Expand and Contract pattern** solves this safely in three distinct deployment phases:

1. **Phase 1: Expand (Additive Database Change)**
   - Add the new column (e.g., `new_status`), but keep it `Optional`.
   - Deploy the database migration. Both the old and new code can still run safely.
2. **Phase 2: Code & Data Migration**
   - Update the backend code to write to **both** the old and new columns.
   - Run a migration script to copy existing data from the old column to the new one.
   - Deploy the backend code. 
3. **Phase 3: Contract (Cleanup)**
   - Change the backend code to only read/write from the `new_status` column.
   - Deploy the new backend code.
   - Run a final database migration to drop the old column (or add `NOT NULL` constraints).

> [!TIP]
> This pattern ensures the system never crashes due to a schema mismatch between the running backend instances and the database during the CI/CD pipeline.
