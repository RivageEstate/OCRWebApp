# Phase 0 着手時の確定ドラフト（データ命名 + 最小APIスコープ）

- Title: Phase 0 着手時の確定ドラフト（データ命名 + 最小APIスコープ）
- Status: Draft
- Created: 2026-02-25
- Last Updated: 2026-02-25
- Owner: TBD
- Language: JA/EN

## 背景 / Background

`SPEC.md` と `docs/design/20260225-system-architecture.md` で Phase 0 の方向性は定義済みだが、実装開始に必要な最小決定（テーブル命名と最初のAPI範囲）が未固定である。

## 目的 / Objective

実装を迷いなく開始できるよう、以下2点を同時に固定する。

- Phase 0 で採用するデータモデル命名
- 1本目PRで実装する API スコープ（最小）

## スコープ / Scope

本ドキュメントで確定する項目:

- テーブル命名は `SPEC.md` に合わせる
- 最初の実装PRは「アップロード + ジョブ登録 + 状態参照」に限定する

採用案:

1. データモデル命名（Phase 0）

- `users`
- `documents`
- `extractions`
- `normalized_properties`
- `revisions`
- `jobs`

1. API最小スコープ（1本目PR）

- `POST /api/documents`
  - 役割: ファイル保存、`documents` 作成、`jobs(queued)` 作成
  - 禁止: OCR/LLM の同期実行
- `GET /api/jobs/{jobId}`
  - 役割: `status` (`queued|processing|succeeded|failed`) と `error_message` 返却
- `GET /api/documents/{documentId}`
  - 役割: 所有者検証つきで文書メタデータ返却

## 非スコープ / Out of Scope

- OCRProvider / Extractor の本実装
- Worker のジョブ実行ロジック全体
- PDF/CSV 出力
- 編集UIと `revisions` 書き込みAPI
- Phase 1 以降（Deal/Proposal/Simulation/Referral）

## 受け入れ基準 / Acceptance Criteria

- `POST /api/documents` 実行で `documents` と `jobs(queued)` が作成される
- API レイヤーで OCR/LLM が同期実行されない
- `GET /api/jobs/{jobId}` でジョブ状態を取得できる
- `GET /api/documents/{documentId}` が所有者のみ参照可能である
- Prisma マイグレーションが作成・バージョン管理される

## 制約 / Constraints

- UUID 主キーを採用する
- JSONB を活用する（`bounding_boxes`, `editable_fields`）
- OCR/LLM/Storage は抽象インターフェース経由で利用する
- リージョンは東京に統一する
- 例外設計が必要な場合は ADR を追加する

## 概要 / Summary (JA)

Phase 0 着手時点の未確定事項を最小限に絞り、テーブル命名を `SPEC.md` に統一したうえで、最初の実装PRを「アップロード + ジョブ登録 + 状態参照」に限定する。

## Summary (EN)

This draft locks two kickoff decisions for Phase 0: align table naming with `SPEC.md`, and constrain the first implementation PR to upload, job creation, and job status retrieval.

## 結論 / Conclusion (JA)

実装開始の基準として本ドラフトを採用し、差分が出る場合は同一PRで `SPEC.md` と関連 docs を更新する。

## Conclusion (EN)

Use this draft as the kickoff baseline. If implementation deviates, update `SPEC.md` and related docs in the same PR.
