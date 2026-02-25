# 言語非依存の品質基盤を採用する / Adopt a Language-Agnostic Quality Foundation

- Title: 言語非依存の品質基盤を採用する / Adopt a Language-Agnostic Quality Foundation
- Status: Accepted
- Created: 2026-02-24
- Last Updated: 2026-02-24
- Owner: Repository Maintainers
- Language: JA/EN

## Context

このテンプレートは複数の言語・フレームワークで使う前提である。
品質基準が言語依存だと、導入時の判断コストと運用負荷が増える。

## Decision

リポジトリ共通で最低限の品質基盤を定義する。
具体的には、ドキュメント規約、ブランチ命名規約、軽量チェック、CI lint を共通適用する。

## Consequences

- 新規プロジェクト立ち上げ時の初期判断を削減できる。
- 言語固有のルールは追加で定義する必要がある。

## Alternatives

- 言語別テンプレートを分離して運用する。
- 各プロジェクトで個別に品質基準を作る。

## 概要 / Summary (JA)

言語に依存しない最小の品質基盤を採用し、共通運用を優先する。

## Summary (EN)

Adopt a minimal language-agnostic quality baseline to standardize operations.

## 結論 / Conclusion (JA)

本テンプレートでは、共通の品質基盤をデフォルト方針として継続する。

## Conclusion (EN)

This template will keep a shared quality foundation as the default policy.
