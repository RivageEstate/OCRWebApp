# Phase 0 索引（設計・契約・実装のリンク集）

Phase 0 の目的は「物件概要書（画像/PDF）→ OCR/AI解析 → 規定フォーマット化（編集可）→ 出力」の最短導線を整備することです。

このファイルは、**マイルストーン（Issue/PR）単位**で「設計書（docs）」「機械可読な契約（contracts）」「実装コード（apps/packages）」を相互に追跡しやすくするための索引です。

## 仕様（一次情報）

- `SPEC.md`

## 要件 / Requirements

- `docs/requirements/20260225-phase0-kickoff-decisions.md`
- `docs/requirements/20260225-phase0-test-strategy.md`
- `docs/requirements/20260224-initial-quality-baseline.md`
- `docs/requirements/20260306-glossary.md` — ドメイン用語集

## 設計 / Design

- `docs/design/20260225-system-architecture.md`
- `docs/design/20260224-quality-check-architecture.md`
- `docs/design/20260228-repo-layout-and-contracts.md`
- `docs/design/20260306-sequence-diagrams.md` — アップロード/Worker/ポーリングのシーケンス図
- `docs/design/20260306-er-diagram.md` — ER図
- `docs/design/20260306-job-state-machine.md` — Job状態遷移図

## 運用 / Operations

- `docs/operations/20260225-local-check-environment.md`
- `docs/operations/20260225-phase0-kickoff-issue-pr-drafts.md`
- `docs/operations/20260224-quality-check-runbook.md`
- `docs/operations/20260224-release-management-runbook.md`
- `docs/operations/20260224-branch-protection-policy.md`

## ADR / Decisions

- `docs/adr/0001-language-agnostic-quality-foundation.md`

## 契約（機械可読）/ Contracts

- OpenAPI: `contracts/openapi/phase0.yaml`
- LLM Schema: `contracts/llm/normalized-fields.schema.json`
- Job Payload: `contracts/jobs/job-payload.schema.json`

## 実装 / Code

- Web (Next.js): `apps/web/`
- Worker (Cloud Run): `apps/worker/`
- Shared packages: `packages/`

## マイルストーン一覧（追記用）

| Milestone | Docs | Contracts | Code |
| --- | --- | --- | --- |
| Phase 0 初手（upload→job→status） | `docs/requirements/20260225-phase0-kickoff-decisions.md` | `contracts/openapi/phase0.yaml` | `apps/web/app/api/` |
