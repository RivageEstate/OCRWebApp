# テスト実行手順 / Test Execution Guide

- Title: テスト実行手順 / Test Execution Guide
- Status: Draft
- Created: 2026-03-07
- Last Updated: 2026-03-07
- Owner: Repository Maintainers
- Language: JA/EN

## 目的 / Objective

このドキュメントは、OCRWebApp リポジトリで現在利用できる自動テストの実行方法をまとめる。
Phase 0 開発で最低限必要な確認を、手元で再現できる状態にする。

## 対象範囲 / Scope

- Vitest によるユニットテスト
- 単一テストファイル実行
- 監視モード実行
- ドキュメント変更時の最低限チェック

本ドキュメントは 2026-03-07 時点のリポジトリ状態を前提とする。

## 前提条件 / Prerequisites

- Node.js 22 系
- npm
- リポジトリルートで `npm install` が完了していること

初回セットアップ:

```bash
npm install
```

## 現在あるテストコード / Current Test Code

現時点では `tests/unit/` 配下に Vitest ベースの自動テストがある。

- `tests/unit/uuid.test.ts`
- `tests/unit/job-status.test.ts`
- `tests/unit/storage-adapter.test.ts`
- `tests/unit/auth-session.test.ts`
- `tests/unit/worker-retry.test.ts`

## 基本手順 / Basic Procedure

### 1. 全ユニットテストを実行する

```bash
npm run test
```

期待結果:

- `Test Files` と `Tests` がすべて `passed` になる
- exit code が `0` で終了する

### 2. 変更中のテストを監視モードで実行する

```bash
npm run test:watch
```

用途:

- テストを書きながら継続実行したい場合
- 小さな修正を繰り返し確認したい場合

### 3. 単一ファイルだけ実行する

例:

```bash
npx vitest run tests/unit/uuid.test.ts
```

別例:

```bash
npx vitest run tests/unit/worker-retry.test.ts
```

用途:

- 失敗したテストだけを再実行したい場合
- 影響範囲の小さい変更を素早く確認したい場合

## ドキュメント変更時の手順 / Docs Change Procedure

ドキュメントを変更した場合は、最低限次を実行する。

```bash
bash scripts/check.sh
```

確認内容:

- Markdown ファイルの存在
- docs ディレクトリ構成
- 必須ヘッダーと Summary / Conclusion
- PR テンプレートや各種運用ファイルの存在

## 推奨実行順 / Recommended Order

通常の小さな変更では次の順序を推奨する。

```bash
npm run test
bash scripts/check.sh
```

ドキュメントのみの変更では、最低限次でよい。

```bash
bash scripts/check.sh
```

## トラブルシュート / Troubleshooting

### `vitest: Permission denied`

- `npm install` が不完全な可能性がある
- `node_modules/.bin` の状態を確認し、必要なら `npm install` を再実行する

### モジュール解決エラーが出る

- リポジトリルートでコマンドを実行しているか確認する
- `package-lock.json` と `node_modules` が同期しているか確認する
- 必要なら `npm install` を再実行する

### docs チェックが失敗する

- Markdown の見出し不足
- Summary / Conclusion 欠落
- docs 配下の命名ルール違反

失敗ログを見て該当ファイルを修正する。

## 補足 / Notes

- 現時点のテストは主に Unit Test である
- 実DBを使う統合テストやブラウザ E2E は別途整備対象
- Phase 0 のテスト観点は `docs/requirements/20260225-phase0-test-strategy.md` を参照する

## 関連ドキュメント / Related Docs

- `docs/requirements/20260225-phase0-test-strategy.md`
- `docs/phases/phase0.md`
- `docs/operations/20260224-quality-check-runbook.md`

## 概要 / Summary (JA)

本ドキュメントは、OCRWebApp の現行テストコードを前提に、全件実行・単体実行・監視モード・docs チェックの手順を整理した実行ガイドである。

## Summary (EN)

This document provides a practical execution guide for the current OCRWebApp test suite, covering full runs, single-file runs, watch mode, and documentation checks.

## 結論 / Conclusion (JA)

通常の変更では `npm run test` と `bash scripts/check.sh` を最低限実行する。変更が限定的な場合は、対象テストファイルのみを先に実行してから全体確認へ進む。

## Conclusion (EN)

For regular changes, run `npm run test` and `bash scripts/check.sh` at minimum. For isolated changes, start with the relevant test file and then run the broader checks.
