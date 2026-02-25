# AGENTS.md

このファイルの指示は、リポジトリ配下全体に適用されます。

## Goal

- 小さく安全な変更を優先し、理由が追跡できるコミットを作成する。

## Project Context
- 本リポジトリは「物件概要書（写真）→ OCR/AI解析 → 規定フォーマット化（編集可）」を起点にした不動産業務OSの開発を目的とする。
- 直近の開発対象は Phase 0（OCRから規定フォーマット化と出力）であり、Phase 1以降（Deal化、シミュレーション、銀行提出書類、紹介フィー回収）は段階拡張する。
- `tmp/` 配下は検討メモ置き場。実装判断の参照元は `SPEC.md` と `docs/` を優先する。
- システム基盤は Next.js（App Router）+ Supabase(PostgreSQL) + Prisma + NextAuth + Cloud Run Worker + Google Vision + OpenAI Structured Outputs を前提とする。
- リージョンは東京で統一する（Vercel: `hnd1` / Supabase: `ap-northeast-1` / Cloud Run: `asia-northeast1` / Storage: Tokyo）。

## Working Rules

- 変更前に関連ファイルを読み、影響範囲を把握する。
- 1 PR 1 目的を意識し、無関係なリファクタは避ける。
- 仕様が不明な場合は README / docs に仮説と前提を明記する。
- 実装や挙動変更を伴う場合は `SPEC.md` または `docs/` の関連文書を同一PRで更新する。
- Phase 0では OCRの生データ（抽出結果）と確定データ（編集後）を分離して扱う前提を崩さない。
- 主要項目（価格・賃料・面積など）は編集可能とし、編集履歴（誰がいつ何を変更したか）を追跡可能にする。
- API層でOCR/LLMを同期実行しない。重い処理は必ずJobを作成してWorkerで実行する。
- OCR / LLM / Storageは抽象インターフェース経由で利用し、アプリ層からSDKを直接呼ばない。

## Code & Docs Style

- コメント・ドキュメントは簡潔で、将来の保守者が判断できる情報を残す。
- import を try/catch で包まない。
- 生成物よりもソース（設定・スクリプト）を優先して管理する。
- PR / Issue のタイトル・本文は日本語を基本とする。
- 仕様文書では、確定事項と将来拡張事項を明確に分離して記載する。
- DB設計では UUID主キーとJSONB活用を基本方針とし、Prismaマイグレーションを必ずバージョン管理する。
- Codex が PR をレビューする際のレビューコメント・レビュー要約は日本語で記載する。

## Validation

- 変更に応じた最小限のチェックを実行し、結果を PR に記載する。
- 実行できないチェックがある場合は、理由と代替確認方法を残す。
- ドキュメント変更時は、最低限 `scripts/check.sh` を実行し、Markdownのリンク切れや体裁崩れがないか確認する。

## Commit

- Conventional Commits を推奨（例: `docs: ...`, `chore: ...`, `feat: ...`, `fix: ...`）。
- コミットメッセージは「何を/なぜ」を短く含める。
