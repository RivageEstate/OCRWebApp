# 品質チェック構成 / Quality Check Architecture

- Title: 品質チェック構成 / Quality Check Architecture
- Status: Approved
- Created: 2026-02-24
- Last Updated: 2026-02-24
- Owner: Repository Maintainers
- Language: JA/EN

## 目的 / Objective

ローカルとCIの品質チェック責務を分離して設計する。

## アーキテクチャ / Architecture

- `scripts/check.sh` / `scripts/check.ps1`: 構成とドキュメント規約の軽量検証
- `.github/workflows/ci.yml`: lint と軽量検証の実行

## インターフェース / Interfaces

- ローカル: `bash scripts/check.sh`, `pwsh ./scripts/check.ps1`
- CI: pull_request / push to main で自動実行

## データ / Data Model

この設計に永続データモデルはない。入力はリポジトリ内ファイル群。

## 代替案 / Alternatives

- すべてCIのみで検証し、ローカル検証を提供しない。
- pre-commit フックに全検証を寄せる。

## リスク / Risks

- チェック項目が増えると実行時間が伸びる。
- 規約変更時にスクリプト更新漏れが起きる。

## 概要 / Summary (JA)

軽量検証をローカルとCIの両方で実行可能にし、早期検知を重視する。

## Summary (EN)

Enable lightweight checks both locally and in CI for earlier feedback.

## 結論 / Conclusion (JA)

運用開始時点では、軽量スクリプト + CI lint の二層構成を採用する。

## Conclusion (EN)

Adopt a two-layer approach: lightweight scripts plus CI lint jobs.
