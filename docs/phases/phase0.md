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
- `docs/operations/20260307-test-execution-guide.md` — テスト実行手順
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

## 現状の到達点

- Upload UI から画像/PDFをアップロードし、`documents` と `jobs(queued)` を作成できる。
- Job Status UI で `queued / processing / succeeded / failed` をポーリング表示できる。
- Worker で OCR → 構造化抽出 → `extractions` / `normalized_properties` 保存まで実行できる。
- `GET /api/properties/{propertyId}/export?format=csv|pdf` で CSV/PDF 出力ができる。

## Phase 0 未対応の実装タスク

| Task | Goal | Main Areas | Planned Issue |
| --- | --- | --- | --- |
| 物件編集APIと履歴記録 | `normalized_properties` を編集可能にし、`revisions` を必ず保存する | `apps/web/app/api/`, `packages/db/`, `SPEC.md` | `#51` |
| ジョブ完了後の編集導線 | Job完了後に対象物件へ遷移し、編集画面から確定データを扱えるようにする | `apps/web/app/`, `contracts/openapi/phase0.yaml`, `docs/design/` | `#52` |
| 出力仕様の固定 | CSV/PDF の規定フォーマット、API契約、所有者制御を固める | `apps/web/app/api/properties/`, `contracts/openapi/phase0.yaml`, `SPEC.md` | `#53` |
| Phase 0 テスト拡充 | API/Worker/出力/権限制御の回帰を自動検証できるようにする | `tests/`, `apps/worker/`, `apps/web/` | `#54` |

## タスク分解メモ

### 1. 物件編集APIと履歴記録

- `normalized_properties` 更新APIを追加する。
- 更新前後差分を `revisions` に保存する。
- 所有者のみ更新可能にする。
- 主要項目（価格・賃料・面積など）の入力検証を追加する。

### 2. ジョブ完了後の編集導線

- `GET /api/documents/{documentId}` から編集導線に必要な情報を返せるようにする。
- Job完了画面から対象物件の編集ページへ遷移させる。
- 編集画面で raw extraction と確定データの役割を分けて表示する。

### 3. 出力仕様の固定

- CSV/PDF の列順、表示名、ファイル名規則を固定する。
- OpenAPI に export API を反映する。
- 出力対象が所有者本人に限定されることを明文化する。

### 4. Phase 0 テスト拡充

- upload → job → worker → property 保存の正常系テストを追加する。
- property 更新時の `revisions` 保存テストを追加する。
- 権限制御（401/403/404）と export API のテストを追加する。
- Worker の失敗/タイムアウト時の整合性テストを追加する。
