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
| Phase 0 編集・出力導線 | `docs/design/20260306-sequence-diagrams.md` | `contracts/openapi/phase0.yaml` | `apps/web/app/documents/`, `apps/web/app/api/properties/` |

## 現状の到達点

- Upload UI から画像/PDFをアップロードし、`documents` と `jobs(queued)` を作成できる。
- Job Status UI で `queued / processing / succeeded / failed` をポーリング表示できる。
- Worker で OCR → 構造化抽出 → `extractions` / `normalized_properties` 保存まで実行できる。
- Job完了後に編集画面へ遷移し、OCR生データを見ながら確定データを編集できる。
- Property 更新時に `revisions` へ before / after を保存できる。
- `GET /api/properties/{propertyId}/export?format=csv|pdf` で CSV/PDF 出力ができる。

## 実装済みの Issue 対応

| Issue | Scope | Main Areas |
| --- | --- | --- |
| `#51` | 物件編集APIと履歴記録 | `apps/web/app/api/properties/`, `packages/db/` |
| `#52` | ジョブ完了後の編集導線と画面実装 | `apps/web/app/jobs/`, `apps/web/app/documents/` |
| `#53` | API・Worker・出力の自動テスト拡充 | `tests/`, `apps/worker/`, `apps/web/app/api/` |
| `#54` | CSV/PDF出力仕様とAPI契約の固定 | `contracts/openapi/phase0.yaml`, `apps/web/app/api/properties/` |

## 運用系の未完了タスク

- `#43` Cloud Run デプロイパイプライン + ジョブディスパッチ連携
- `#44` E2E・統合テストの追加
- `#45` 監視・アラート基盤の構築
