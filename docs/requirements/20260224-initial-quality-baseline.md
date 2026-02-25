# 初期品質ベースライン / Initial Quality Baseline

- Title: 初期品質ベースライン / Initial Quality Baseline
- Status: Approved
- Created: 2026-02-24
- Last Updated: 2026-02-24
- Owner: Repository Maintainers
- Language: JA/EN

## 背景 / Background

テンプレート利用時に、最低限満たすべき品質要件を明確化したい。

## 目的 / Objective

ドキュメントとCIの運用ルールを初期状態で担保する。

## スコープ / Scope

- docs 命名規則
- 必須ヘッダ項目
- CIでの lint 実行

## 非スコープ / Out of Scope

- 言語固有の静的解析ルール
- プロダクト固有の性能要件

## 受け入れ基準 / Acceptance Criteria

- `scripts/check.sh` と `scripts/check.ps1` が規約違反を検知できる。
- GitHub Actions で `markdownlint-cli2` / `yamllint` / `shellcheck` が実行される。
- docs に要件・設計・運用・ADR の実体文書が最低1件ずつ存在する。

## 制約 / Constraints

- 軽量チェックは高速に完了すること。
- テンプレートとして過剰な依存を追加しないこと。

## 概要 / Summary (JA)

本テンプレートの初期品質基準を定義し、運用のばらつきを抑える。

## Summary (EN)

Define a baseline quality standard to reduce operational inconsistency.

## 結論 / Conclusion (JA)

初期品質ベースラインを採用し、以後は変更理由をdocsで追跡する。

## Conclusion (EN)

Adopt the baseline and track future changes through repository docs.
