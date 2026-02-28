# リポジトリ構成（docs / contracts / apps / packages 分離）

- Title: リポジトリ構成（docs / contracts / apps / packages 分離）
- Status: Draft
- Created: 2026-02-28
- Last Updated: 2026-02-28
- Owner: keikur1hara
- Language: JA/EN

## 目的 / Objective

設計書（人間向け）と実装（コード）を分離し、マイルストーン（Issue/PR）単位で **設計成果物 ⇄ 契約 ⇄ 実装** のトレーサビリティを維持しやすくする。

## アーキテクチャ / Architecture

### ディレクトリ責務 / Directory Responsibilities

```text
docs/                 # 人間向けドキュメント（要件/設計/運用/ADR）
contracts/            # 機械可読な契約（OpenAPI/JSON Schema 等）
apps/
  web/                # Next.js（UI + API）
  worker/             # Cloud Run Worker（重い非同期処理）
packages/             # web/worker 共有のドメイン/DB/Provider 実装
```

基本方針:

- `docs/` は設計判断の説明・背景・制約など **人間が読む文章** を置く
- `contracts/` は OpenAPI や JSON Schema など **機械が読む仕様** を置く
- `apps/` は **デプロイ単位**（web/worker）で分離し、責務境界（APIで重処理禁止など）をフォルダで強制する
- `packages/` は **共有実装**（型/状態機械/Provider実装/DB）を集約し、モジュール単位で短いサイクルを回す

## インターフェース / Interfaces

- API契約（Phase 0）: `contracts/openapi/phase0.yaml`
- LLM抽出契約（Phase 0）: `contracts/llm/normalized-fields.schema.json`
- Worker入力/出力契約（Phase 0）: `contracts/jobs/job-payload.schema.json`

## データ / Data Model

- Prisma schema / migrations: `packages/db/prisma/`

## 代替案 / Alternatives

- 設計書と契約を `docs/` に同居させる案:
  - Markdown内にYAML/JSONを埋め込みやすいが、一次ソースが曖昧になり、差分レビューが難しくなるため不採用。
- web/worker を別リポジトリに分割する案:
  - リポジトリは単純になるが、契約/型の同期が重くなるため Phase 0 では不採用。

## リスク / Risks

- モノレポ化により、依存関係・ビルド/テストの実行場所が増える。
- 契約ファイルの変更が実装に波及するため、PRでは `docs/` と `contracts/` と `apps/` の更新範囲を明示する必要がある。

## 概要 / Summary (JA)

設計（docs）・契約（contracts）・実装（apps/packages）を分離し、マイルストーン単位で追跡しやすいリポジトリ構成を定義した。

## Summary (EN)

This document defines a repository layout that separates human-readable docs, machine-readable contracts, and deployable implementations (web/worker) to improve milestone-level traceability.

## 結論 / Conclusion (JA)

本構成を前提に、Phase 0 は「アップロード→ジョブ作成→状態参照」の最小導線から実装を進める。

## Conclusion (EN)

With this layout, Phase 0 implementation proceeds from the minimum flow: upload → job creation → status retrieval.
