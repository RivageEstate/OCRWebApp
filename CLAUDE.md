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
**Monorepo:** npm workspaces (`apps/*`, `packages/*`)

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
- **Auth:** NextAuth v5 (Google OAuth, JWT session). Config in `apps/web/auth.ts`, session helper in `apps/web/lib/auth/session.ts`. `AUTH_SECRET` (または `NEXTAUTH_SECRET`) が必須。
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

## Environment

`.env.example` に全変数の一覧あり。主要カテゴリ:
- **Auth:** `AUTH_SECRET`, Google OAuth (`AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`)
- **DB:** `DATABASE_URL` (Supabase PostgreSQL)
- **Storage:** Cloudflare R2 (`R2_*`)
- **AI/OCR:** `OPENAI_API_KEY`, Google Vision
- **Async:** Cloud Tasks (`GCLOUD_PROJECT`, `CLOUD_TASKS_*`)

## Gotchas

- `apps/web` の `prebuild` スクリプトが Prisma Client を自動生成する。schema 変更後は `npm run prisma:generate` を忘れずに。
- TypeScript パスエイリアス `@web/*` は `apps/web/` を指す（`tsconfig.json` で設定）。
- Docker 開発時は `compose.yaml` + `Dockerfile.dev` を使用。ファイル監視にポーリングを使用（`CHOKIDAR_USEPOLLING`）。

## Working Rules (from AGENTS.md)

- **1 PR = 1 purpose.** No unrelated refactoring.
- When making implementation or behavior changes, update `SPEC.md` or the relevant `docs/` file in the same PR.
- PR/Issue titles and bodies are written in **Japanese**.
- Commits follow Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, etc. Include "what/why" in the message.
- DB schema changes always go through a Prisma migration — never edit the DB directly.
- All infrastructure targets the **Tokyo region** (Vercel `hnd1`, Supabase `ap-northeast-1`, Cloud Run `asia-northeast1`).
