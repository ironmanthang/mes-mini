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
| `API_URL` | `https://mes-mini-backend-433210406598.us-central1.run.app` |

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

## Part 5: Verify Deployment

### Checklist

- [ ] Cloud Run backend responds: `https://your-backend.run.app/api-docs`
- [ ] Supabase database connected: Check Cloud Run logs
- [ ] Frontend loads: `https://mes-mini.pages.dev`
- [ ] API calls work: Try login/signup on frontend

### Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS errors | Update `server.js` with correct origins |
| Database connection timeout | Check `DATABASE_URL` uses port 6543 |
| Prisma errors | Run `npx prisma migrate deploy` locally first |
| Cold start slow (~5s) | Normal for scale-to-zero; set min instances to 1 if needed |

---

## Cost Monitoring

1. Go to [GCP Billing → Budgets & Alerts](https://console.cloud.google.com/billing/budgets)
2. Create budget: $1/month
3. Set alert at 50%, 90%, 100%

---

## Comparison: Current vs. Cloud Run Setup

| Aspect | Tailscale Funnel (Current) | Cloud Run + Supabase |
|--------|---------------------------|----------------------|
| **Cost** | $0 | $0 |
| **Uptime** | Laptop must run | 24/7 auto |
| **Cold start** | None | ~2-5s after idle |
| **Database** | Local Docker | Supabase cloud |
| **Scaling** | Manual | Auto (0→N instances) |
| **Setup effort** | Easy | Medium |

---

## When to Use This Setup

✅ **Use Cloud Run + Supabase when:**
- You need 24/7 availability
- You want automatic scaling
- You're okay with occasional cold starts

❌ **Stick with Tailscale Funnel when:**
- Just developing/testing
- Don't want data in cloud
- Need instant response (no cold starts)
