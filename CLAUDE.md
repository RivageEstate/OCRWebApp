# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev               # Start Next.js dev server
npm run build             # Build production bundle
npm run lint              # Run ESLint

# Testing (Vitest)
npm run test              # Run all unit tests once
npm run test:watch        # Watch mode
npx vitest run tests/unit/uuid.test.ts  # Run a single test file

# Database (Prisma)
npm run prisma:generate   # Regenerate Prisma client after schema change
npm run prisma:migrate:dev  # Apply new migrations in development

# Quality check (run before PR)
bash scripts/check.sh
```

## Architecture

**Stack:** Next.js 15 (App Router) + TypeScript + Prisma + PostgreSQL (Supabase) + Vitest

**Goal:** Real estate document processing — photo of property overview sheet → OCR/AI → normalized editable data → export. Phase 0 covers OCR ingestion, format standardization, and data export.

### Request Flow

```text
Client → API Route (apps/web/app/api/) → packages/ utilities → Prisma (PostgreSQL)
                                                ↓
                                         Job record created
                                                ↓
                                    Cloud Run Worker (apps/worker/, not yet implemented)
                                    → OCR/LLM adapters → extractions / normalized_properties
```

**Critical rule:** Never run OCR or LLM synchronously in the API layer. Heavy processing must always go through a `Job` record and be executed by the Worker.

### Key Patterns

- **Adapter pattern:** OCR / LLM / Storage are accessed only through abstract interfaces in `packages/domain/src/providers/` and implementations in `packages/providers/src/` — never call SDKs directly in app code.
- **Data separation:** Raw OCR extraction (`extractions` table) and confirmed editable data (`normalized_properties` table) must remain separate. Do not collapse them.
- **Auth:** Currently a temporary `x-user-id` header (UUID). Lives in `apps/web/lib/auth/session.ts`. NextAuth is planned but not yet integrated.
- **Job state machine:** `queued → processing → succeeded | failed`. Logic in `packages/domain/src/jobs/status.ts`.
- **UUID everywhere:** All primary keys are UUIDs. Validate path/query params with `packages/domain/src/validation/uuid.ts`.

### Directory Layout

```text
apps/web/app/api/     # Route handlers (auth → validate → Prisma transaction → return)
apps/web/lib/         # web-specific auth/session helpers
apps/worker/          # Cloud Run worker skeleton (async processing)
packages/             # shared domain/db/providers (web/worker common)
packages/db/prisma/   # schema.prisma + versioned migrations
tests/unit/           # Vitest unit tests
docs/             # requirements/, design/, adr/, operations/
```

### Database Tables

`users` → `documents` → `extractions` (raw OCR) / `normalized_properties` (editable) / `jobs` (async queue). `revisions` tracks edits to `normalized_properties`. JSONB is used for flexible fields (`bounding_boxes`, `editable_fields`).

## Working Rules (from AGENTS.md)

- **1 PR = 1 purpose.** No unrelated refactoring.
- When making implementation or behavior changes, update `SPEC.md` or the relevant `docs/` file in the same PR.
- PR/Issue titles and bodies are written in **Japanese**.
- Commits follow Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, etc. Include "what/why" in the message.
- DB schema changes always go through a Prisma migration — never edit the DB directly.
- All infrastructure targets the **Tokyo region** (Vercel `hnd1`, Supabase `ap-northeast-1`, Cloud Run `asia-northeast1`).
