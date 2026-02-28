# OCRWebApp

物件概要書（写真）を OCR/AI で解析し、編集可能な規定フォーマットへ変換して出力するための不動産業務 OS プロジェクトです。  
現在は **Phase 0（OCRから規定フォーマット化と出力）** を開発対象としています。

## 現在のスコープ（Phase 0）

- Google 認証でログイン
- 物件概要書画像をアップロード（1物件に複数枚対応）
- 非同期ジョブで OCR/LLM 解析
- 規定フォーマットへ正規化
- 主要項目（価格・賃料・面積など）を編集
- 抽出根拠と信頼度を保持
- 確定データを保存し、PDF/CSV で出力

将来は `property -> deal -> proposal -> simulation -> bank docs -> referral` の順で段階拡張します。

## 重要な設計方針

- OCR の生データ（`extractions`）と確定データ（`normalized_properties`）を分離する
- 編集履歴（`revisions`）を記録し、誰がいつ何を変えたか追跡可能にする
- OCR/LLM は API で同期実行せず、必ずジョブを作成して Worker で処理する
- OCR / LLM / Storage は抽象インターフェース経由で利用し、アプリ層から SDK を直接呼ばない
- リージョンは東京で統一する（Vercel `hnd1` / Supabase `ap-northeast-1` / Cloud Run `asia-northeast1`）

## 想定アーキテクチャ

- Frontend / API: Next.js（App Router）
- DB: Supabase PostgreSQL
- ORM: Prisma
- Auth: NextAuth（Google OAuth）
- Worker: Cloud Run
- OCR: Google Vision API
- LLM 抽出: OpenAI Structured Outputs

詳細は [SPEC.md](./SPEC.md) と `docs/` を参照してください。

## リポジトリ構成

- `SPEC.md`: 現時点の仕様ドラフト（MVP + システム設計前提）
- `docs/`: 要件・設計・運用・ADR
- `contracts/`: OpenAPI/JSON Schema などの機械可読な契約
- `packages/db/prisma/`: Phase 0 のDBスキーマとマイグレーション
- `apps/web/`: Next.js（UI + API）
- `apps/worker/`: Cloud Run Worker（非同期処理、Phase 0 は骨格のみ）
- `packages/`: 共通ドメイン/DB/Provider 実装（web/worker 共有）
- `tests/`: ユニットテスト
- `scripts/check.sh`: ドキュメントとテンプレートの軽量チェック
- `tmp/`: 検討メモ（実装判断の一次情報には使わない）

## 開発ルール（抜粋）

- 1 PR 1 目的で小さく安全に変更する
- 仕様/挙動に影響する変更は `SPEC.md` または `docs/` を同一 PR で更新する
- PR / Issue / レビューは日本語を基本とする

詳細は [AGENTS.md](./AGENTS.md) を参照してください。

## ローカルチェック

```bash
bash scripts/check.sh
```

## 実装土台のセットアップ（Phase 0）

```bash
npm install
cp apps/web/.env.example apps/web/.env
npm run prisma:generate
npm run prisma:migrate:dev
npm run dev
```

## テスト

```bash
npm run test
```

## API雛形（Phase 0 1本目PR対象）

- `POST /api/documents`
- `GET /api/jobs/{jobId}`
- `GET /api/documents/{documentId}`

注記:

- 現在のAPI雛形では暫定的に `x-user-id` ヘッダー（UUID）で認証を代替しています。
- 次のステップで NextAuth セッション検証へ差し替える前提です。

## ライセンス

Apache-2.0
