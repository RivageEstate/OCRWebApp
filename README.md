# Codex Repository Template

Codex（CLI/Agent）での開発を前提にした、**最小で実用的なリポジトリテンプレート**です。

## 目的

- 生成AIエージェントが迷いにくいディレクトリ構成を提供する
- 人間レビューしやすい PR 情報と変更履歴を残しやすくする
- まずはドキュメント中心で始めて、必要に応じて言語/フレームワークを追加できる形にする

## 含まれるテンプレート

- `AGENTS.md`: エージェント向け作業ルール（スコープ: リポジトリ全体）
- `.github/pull_request_template.md`: 日本語 PR 記述テンプレート
- `.github/ISSUE_TEMPLATE/*`: 日本語 Issue テンプレート（不具合/機能要望）
- `.github/workflows/ci.yml`: 最低限の整合性チェック CI
- `.github/workflows/release.yml`: タグ作成時の GitHub Release 作成
- `.github/release.yml`: GitHub Release ノートのカテゴリ定義
- `scripts/check.sh`: ローカルで実行する軽量チェック
- `.editorconfig`: エディタ共通設定
- `.gitignore`: 汎用除外設定

## docs 運用ルール

- ドキュメントは `docs/` 配下で管理し、設計・運用・意思決定を同一リポジトリで追跡する
- 主要構成:
  - `docs/requirements`: 要件と受け入れ条件
  - `docs/design`: 設計情報
  - `docs/operations`: 運用手順
  - `docs/adr`: 重要な設計/運用判断（1 ADR = 1 決定）
- 命名規則:
  - 要件/設計/運用: `YYYYMMDD-<slug>.md`
  - ADR: `NNNN-<slug>.md`
- 主要文書ヘッダ必須項目: `Title` `Status` `Created` `Last Updated` `Owner` `Language`
- 日英併記方針: 見出しは `日本語 / English` 形式を基本にし、最低限「概要」と「結論」は JA/EN の両方を記載
- 仕様や挙動に影響する変更では、関連 docs 更新と必要に応じた ADR 追加を PR で必須とする

## 使い方

1. このテンプレートをベースに新規リポジトリを作成
2. `README.md` の「プロジェクト固有情報」を追記
3. `AGENTS.md` をプロジェクトに合わせて更新
4. `docs/templates/` を使って必要な文書を作成
5. 必要に応じて `scripts/check.sh` にテスト/リンターを追加
6. Issue は `.github/ISSUE_TEMPLATE/` のテンプレートから日本語で起票

## 日本語運用ガイド

- PR は `.github/pull_request_template.md` の項目に沿って日本語で記述
- Issue は「不具合報告 / 機能要望」テンプレートを選んで日本語で記述
- 空 Issue は無効化（`blank_issues_enabled: false`）して、テンプレート利用を促進

## PRブランチ運用ルール

- ブランチ名は `type/short-slug` 形式を使用する
- `type` は `feature|fix|chore|docs|refactor|test|ci` のいずれかを使用する
- `short-slug` は英小文字・数字・ハイフンのみ（先頭末尾ハイフン禁止）
- ブランチ名は `Branch Name Check` workflow で PR 時に検証する
- マージ後のブランチ自動削除は GitHub のリポジトリ設定（`Automatically delete head branches`）で有効化する
- `main` にはブランチ保護を設定し、`CI` と `Branch Name Check` を必須チェックにする（詳細は `docs/operations/20260224-branch-protection-policy.md`）

## リリース運用

- 運用手順: `docs/operations/20260224-release-management-runbook.md`
- リリースノートひな形: `docs/templates/release-notes-template.md`
- 変更履歴: `CHANGELOG.md`
- タグ `v*` を push すると `Release` workflow が GitHub Release を作成する

## ローカルチェック

```bash
bash scripts/check.sh
```

## プロジェクト固有情報（記入例）

- 概要:
- 想定ユーザー:
- 実行方法:
- テスト方法:
- アーキテクチャメモ:
- 非機能要件（性能/セキュリティ/運用）:

## ライセンス

Apache-2.0
