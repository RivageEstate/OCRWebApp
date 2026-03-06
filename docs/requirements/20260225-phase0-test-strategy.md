# Phase 0 テスト戦略（最小版）

- Title: Phase 0 テスト戦略（最小版）
- Status: Draft
- Created: 2026-02-25
- Last Updated: 2026-02-25
- Owner: TBD
- Language: JA/EN

## 背景 / Background

Phase 0 の実装対象は、非同期ジョブ実行、外部依存（OCR/LLM/Storage）、編集可能データと履歴管理、CSV/PDF出力を含む。  
実装開始後にテスト方針を決めると、責務分離と抽象インターフェース設計に手戻りが出やすい。

## 目的 / Objective

実装前に、Phase 0 で必要な最小テスト戦略を固定し、PRごとの品質判定基準を揃える。

## スコープ / Scope

本ドキュメントで確定する項目:

- テストレイヤーの責務分離（Unit / Integration / E2E）
- 外部依存（OCR/LLM/Storage）のテスト時の扱い
- 非同期ジョブ（`jobs`）の状態遷移テスト観点
- Phase 0 で必須とする最小テストケース

採用方針:

1. テストレイヤー

- Unit: ドメインロジックとバリデーションを対象とし、DB/外部APIに依存しない。
- Integration: API Route / Worker / 認可を対象とし、DBと外部依存はテストダブルで整合性を検証する。
- E2E: 主要ユーザーフロー（アップロードから状態確認まで）の疎通確認に限定する。

1. 外部依存の扱い

- アプリ層は Provider 抽象（`OCRProvider`, `Extractor`, `StorageAdapter`）のみを参照する。
- Unit/Integration では Provider 実装をテストダブルに差し替える。
- OCR/LLM の実SDK呼び出しを前提とした不安定テストは、Phase 0 の必須対象に含めない。

1. 非同期ジョブの検証

- `POST /api/documents` 実行時に `jobs.status=queued` が作成されること。
- Worker 実行時に `queued -> processing -> succeeded|failed` が遷移すること。
- 失敗時に `error_message` が記録され、APIから参照できること。
- export API が所有者のみ成功すること。

1. Phase 0 必須テストケース（最小）

- Upload API: `documents` と `jobs(queued)` が作成される。
- Job Status API: 指定 `jobId` の状態とエラー情報を取得できる。
- Document API: 所有者のみ参照可能で、他ユーザーは拒否される。
- API層制約: APIリクエスト中に OCR/LLM 同期実行を行わない。
- Revision記録: 主要項目の編集で `revisions` に before/after と変更者が記録される。
- Export API: 所有者のみ CSV/PDF を出力できる。

## 非スコープ / Out of Scope

- 負荷試験・性能ベンチマークの本格運用
- OCR精度そのものの統計評価
- Phase 1 以降（Deal/Simulation/Referral）のテスト設計
- SaaS外部環境を使う長時間の本番同等試験

## 受け入れ基準 / Acceptance Criteria

- 新規実装PRで、対象機能に応じて Unit または Integration の自動テストが追加される。
- 非同期ジョブの状態遷移（`queued|processing|succeeded|failed`）がテストで検証される。
- 認可テストで「所有者のみ参照可能」が検証される。
- 外部依存は抽象インターフェース経由で差し替え可能であり、テストから直接SDKを呼ばない。
- ドキュメント変更時に `bash scripts/check.sh` が成功する。

## 制約 / Constraints

- 1PR 1目的を維持し、無関係なテスト基盤拡張を避ける。
- テスト戦略は `SPEC.md` と `docs/design/20260225-system-architecture.md` の制約に従う。
- API層で OCR/LLM を同期実行しない前提を崩さない。
- Phase 0 では「生データ（OCR結果）と確定データ（編集後）」の分離前提を維持する。

## 概要 / Summary (JA)

Phase 0 の実装前に必要な最小テスト戦略を定義し、テストレイヤー責務、外部依存のモック方針、非同期ジョブの状態遷移検証、必須ケースを固定する。これにより、PRごとの品質判定を一貫化する。

## Summary (EN)

This document defines a minimum pre-implementation test strategy for Phase 0: layer responsibilities, external dependency mocking via provider abstractions, async job state-transition checks, and mandatory test cases for core APIs and revision tracking.

## 結論 / Conclusion (JA)

Phase 0 の実装は本戦略を基準に進める。例外や追加要件が必要な場合は、同一PRで `SPEC.md` と関連 docs を更新して差分理由を明示する。

## Conclusion (EN)

Phase 0 implementation should follow this minimum strategy. Any exceptions or additions must be documented with rationale in the same PR by updating `SPEC.md` and related docs.
