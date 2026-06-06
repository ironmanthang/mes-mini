# Context for AI Assistant — READ THIS FIRST

## Who is the User?
A CS student at HCMUT doing a thesis capstone project (MES-Mini — Manufacturing Execution System).
They are responsible for **backend code only** (database + API). Frontend is handled by a teammate.

## The Problem
The user relied 100% on AI to write all backend code throughout the semester.
Their thesis reviewer noticed they cannot explain or customize their own code.
The reviewer's exact challenge: "Add some fields to Prisma, customize the APIs to interact with it."
The user could not do this independently.

## Defense Timeline
**URGENT — within 1-3 days from June 4, 2026.**
The reviewer will likely ask the user to do a LIVE customization (add a field, modify an API) during the defense.

## What the User DOES Know
- Basic CS concepts (functions, parameters, return values)
- The system is running (Docker, dev server, Prisma Studio all up)
- Has Postman installed
- Vaguely knows JWT tokens carry permission info

## What the User Does NOT Know
- What a Prisma schema is or how migrations work
- How an API request flows (Route → Controller → Service → Database)
- How to read/write Prisma queries (findMany, create, update, etc.)
- Swagger syntax (so we're using Postman instead)
- How to customize any existing API endpoint

## The Learning Plan (in this folder)
The guide files below are written using **actual code from this project** — not generic tutorials.

| File | Purpose |
|---|---|
| `01_BIG_PICTURE.md` | Architecture overview — how all pieces connect |
| `02_PRISMA_BASICS.md` | How the database works — schema, fields, migrations |
| `03_API_FLOW_DISSECTED.md` | Trace one feature (Component) from Route → DB, line by line |
| `04_POSTMAN_SETUP.md` | How to login and test APIs using Postman |
| `05_PRACTICE_EXERCISES.md` | Hands-on exercises the user should try themselves |

## How to Continue Teaching
If the user starts a new conversation, they will tell you to read this file.
Your job is to:
1. Read all files in this folder to understand the context
2. Ask where they left off
3. Continue teaching — DO NOT write code for them. Guide them to write it.
4. Focus on what the reviewer will ask: "add a field, make the API return it"

## Tech Stack Reference
- **Runtime**: Node.js + TypeScript (Express 5)
- **ORM**: Prisma 7 with PostgreSQL (via Docker)
- **Auth**: JWT (Bearer token)
- **Validation**: Joi
- **API Docs**: Swagger (but user prefers Postman)
- **Architecture**: Route → Controller → Service → Prisma → PostgreSQL

## Key File Paths
```
backend/prisma/schema.prisma          — Database models (THE source of truth)
backend/src/app.ts                    — Route mounting (where URLs are wired)
backend/src/master-data/components/   — Best example feature to study
  ├── componentRoutes.ts              — URL definitions + middleware
  ├── componentController.ts          — Request/Response handling
  ├── componentService.ts             — Business logic + DB queries
  └── componentValidator.ts           — Input validation rules (Joi)
backend/src/common/lib/prisma.ts      — Database connection singleton
```
