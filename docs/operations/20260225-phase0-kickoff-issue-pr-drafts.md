# Phase 0 着手用 Issue/PR ドラフト

- Title: Phase 0 着手用 Issue/PR ドラフト
- Status: Draft
- Created: 2026-02-25
- Last Updated: 2026-02-25
- Owner: TBD
- Language: JA/EN

## 前提 / Preconditions

- `docs/requirements/20260225-phase0-kickoff-decisions.md` の内容を採用する。
- ブランチ名は `type/short-slug` 形式（例: `feature/phase0-upload-job-api`）。
- ローカルで `bash scripts/check.sh` が実行可能である。

## 手順 / Procedure

1. 以下の Issue ドラフトを作成する。
2. 実装ブランチを作成し、1PR 1目的で変更する。
3. 以下の PR 本文ドラフトを使って PR を作成する。

### Issue ドラフト（貼り付け用）

Title:

```text
[要望] Phase 0初手: documents/jobs 作成APIとジョブ状態参照APIの実装
```

Body:

```md
## 背景
- Phase 0 着手時の未確定事項を `docs/requirements/20260225-phase0-kickoff-decisions.md` で整理した。
- 最初の実装は「アップロード→ジョブ登録→状態参照」の最小導線に絞る。

## 解決したい課題
- OCR/LLM 実装前でも、非同期ジョブ前提の基盤APIがないため UI/Worker の接続が開始できない。
- データ命名の揺れ（`properties` 系 vs `documents` 系）で実装判断がぶれる。

## 提案内容
- `SPEC.md` 準拠のテーブル命名（`documents`, `jobs`, `extractions`, `normalized_properties`, `revisions`）を採用する。
- 以下 API を実装する。
  - `POST /api/documents`（ファイル保存 + `documents` + `jobs(queued)` 作成）
  - `GET /api/jobs/{jobId}`（ステータス返却）
  - `GET /api/documents/{documentId}`（所有者のみ参照）
- API 層で OCR/LLM の同期実行を禁止する。

## 受け入れ条件（任意）
- [ ] `POST /api/documents` で `documents` と `jobs(queued)` が作成される
- [ ] `GET /api/jobs/{jobId}` で `queued|processing|succeeded|failed` を取得できる
- [ ] `GET /api/documents/{documentId}` は所有者のみ成功する
- [ ] Prisma マイグレーションが追加される
- [ ] `bash scripts/check.sh` が成功する

## 代替案（任意）
- `properties` 起点の命名に統一する案
  - 今回は `SPEC.md` とズレるため採用しない。

## 補足
- OCRProvider / Extractor / Worker 本処理は次PRに分離する。
```

### PR 本文ドラフト（貼り付け用）

Title:

```text
feat: Phase 0初手のdocuments/jobs APIとDB基盤を追加
```

Body:

```md
# Pull Request

## 概要
- Phase 0 の初手として、`documents` と `jobs` を中心にした最小API導線を実装。
- API 層で OCR/LLM を同期実行しない設計を固定。

## 背景・目的
- 実装開始時の判断ブレを防ぐため、`SPEC.md` 準拠命名と最小APIスコープを先に確立する。
- Worker実装前でも UI から非同期処理起点を作れる状態にする。

## 変更内容
- Prisma スキーマ/マイグレーション追加（`documents`, `jobs` ほか Phase 0 必須テーブル）
- `POST /api/documents` 追加（ファイル保存、`documents` 作成、`jobs(queued)` 作成）
- `GET /api/jobs/{jobId}` 追加（ジョブ状態返却）
- `GET /api/documents/{documentId}` 追加（所有者アクセス制御）
- 関連 docs 更新

## 確認項目
- [ ] ローカルチェックを実行した
- [ ] 主要な差分をセルフレビューした
- [ ] 仕様/挙動変更がある場合、関連docsを更新した
- [ ] ADRが必要な変更ではADRを追加した
- [ ] ブランチ名が `type/short-slug` ルールに準拠している

### 更新対象docsのパス
- docs/requirements/20260225-phase0-kickoff-decisions.md
- SPEC.md（必要差分が出た場合）
- docs/design/20260225-system-architecture.md（必要差分が出た場合）

### 実行コマンド
```bash
bash scripts/check.sh
# 必要に応じて:
# bash scripts/run-local-checks.sh
```

## 影響範囲・リスク

- DB 初期スキーマのため、後続PRに影響が広い。
- 命名変更が発生すると下流のAPI/Worker/UIに連鎖するため、今PRで固定する。

## 補足

- OCRProvider / Extractor / Worker の本処理は別PRで追加する。

## ロールバック / Rollback

- 受け入れ条件を満たせない場合は、API実装を一旦分離し、DBスキーマ確定だけを先行PRとして切り出す。

## 監視項目 / Monitoring

- `bash scripts/check.sh` が成功すること。
- CI の `CI` / `Branch Name Check` が成功すること。

## 障害時対応 / Incident Response

- CI失敗時は失敗したチェックをローカル再現し、修正PRを追加する。
- スキーマ差分の齟齬が出た場合は、`SPEC.md` と本ドキュメントを同一PRで更新して整合を回復する。

## 概要 / Summary (JA)

Phase 0 の初手実装をすぐ開始できるよう、`documents/jobs` 中心の最小スコープに対する Issue と PR の貼り付け用ドラフトを定義した。

## Summary (EN)

This runbook provides copy-ready Issue and PR drafts for the first Phase 0 implementation, focused on the minimum `documents/jobs` API scope.

## 結論 / Conclusion (JA)

本ドキュメントを起点に、1PR 1目的で初手実装を進め、差分が生じた場合は同一PRで仕様文書を更新する。

## Conclusion (EN)

Use these drafts to start implementation with one-PR-one-purpose discipline, and update specs/docs in the same PR whenever behavior changes.
