# mes-mini

A lightweight manufacturing execution system (MES) mini project with backend and frontend services.

## Repository structure

- `backend/` — Node + TypeScript server, Prisma ORM, Dockerized development environment
- `frontend/` — Vite + React TypeScript app

## Prerequisites

- Docker Desktop / Docker Engine
- Node.js 18+ (for local frontend development)
- npm 10+ (frontend package manager)

## Backend development (Docker)

From the repository root:

```bash
cd backend
docker compose down -v
docker compose up --build
```

Then, in a second terminal, run:

```bash
docker compose exec backend npx prisma migrate reset --force
docker compose exec backend npx prisma generate
docker compose exec backend npx tsx prisma/scripts/seed.ts
docker compose exec backend npx tsc --noEmit
```

For prisma studio:
```bash
npm install
npm run prisma-studio
```
### Notes

- `migrate reset --force` drops and recreates the database, so use it only in development.
- `prisma generate` regenerates Prisma client code from the schema.
- `seed.ts` is optional unless you want seeded sample data.
- `tsc --noEmit` validates backend TypeScript compilation.

## Frontend development

From the repository root:

```bash
cd frontend
npm install
npm run dev
```

## Collaboration workflow

When the schema changes in `backend/prisma/schema.prisma`:

1. `git pull`
2. `cd backend`
3. `docker compose down -v`
4. `docker compose up --build`
5. `docker compose exec backend npx prisma migrate reset --force`
6. `docker compose exec backend npx prisma generate`
7. `docker compose exec backend npx tsx prisma/scripts/seed.ts`
8. `docker compose exec backend npx tsc --noEmit`

This ensures the database and generated Prisma client are updated consistently.
