# Docs Overview

このディレクトリは、開発コードと同じリポジトリでドキュメントを管理するための場所です。
This directory stores project documentation alongside code.

## 構成 / Structure

- `requirements/`: 要件・受け入れ条件 / Requirements and acceptance criteria
- `design/`: 設計情報 / Design documents
- `operations/`: 運用手順 / Operational runbooks
- `adr/`: 重要判断記録 / Architectural Decision Records
- `templates/`: 文書テンプレート / Document templates

## 命名規則 / Naming

- 要件・設計・運用: `YYYYMMDD-<slug>.md`
- ADR: `NNNN-<slug>.md`

## 文書ヘッダ必須項目 / Required Header Fields

- `Title`
- `Status`
- `Created`
- `Last Updated`
- `Owner`
- `Language: JA/EN`

## 更新ルール / Update Rules

- 仕様や挙動に影響する PR では関連 docs を更新する。
- 重要な設計/運用判断がある場合は ADR を追加する。
- 見出しは `日本語 / English` 形式を基本にし、概要と結論は JA/EN の両方を記載する。
