# SPEC.md

- Title: OCRWebApp 仕様（MVP + システム設計前提）
- Status: Draft
- Created: 2026-02-25
- Last Updated: 2026-02-25
- Owner: keikur1hara
- Language: JA

## 1. 背景

物件概要書（画像/PDF）をOCRとLLMで構造化し、編集可能な規定フォーマットとして保存・出力する。  
MVPでは「アップロード→非同期解析→編集→確定→出力」を最短で提供し、後続でDeal化や紹介フィー回収機能へ拡張する。

## 2. システムアーキテクチャ

### 2.1 全体構成

- Frontend / API: Next.js（App Router, Route Handlers）
- Hosting: Vercel
- Database: PostgreSQL（Supabase, ap-northeast-1）
- ORM: Prisma
- Auth: NextAuth（Google OAuth）
- Storage: S3互換（東京リージョン優先、実装はS3StorageAdapter。R2は将来選択肢）
- Async Worker: Cloud Run
- OCR: Google Vision API
- LLM Extraction: OpenAI API（Structured Outputs）

### 2.2 リージョン方針

- Vercel Functions: hnd1（Tokyo）
- Supabase: ap-northeast-1
- Cloud Run: asia-northeast1
- Storage: Tokyoリージョン

リージョンは必ず東京で統一する。

## 3. アプリケーション構成

### 3.1 ディレクトリ構成

```text
apps/
  web/
    app/
    lib/
  worker/
    src/
packages/
  domain/
  db/
  providers/
contracts/
  openapi/
  llm/
  jobs/
```

### 3.2 責務分離

- UI層: 表示・編集
- API層: 認証、バリデーション、ジョブ登録
- Service層: ビジネスロジック
- Provider層: OCR / LLM / Storage 抽象化

### 3.3 API契約（Phase 0 最小）

- API契約は OpenAPI で管理する。
- 対象:
  - `POST /api/documents`
  - `GET /api/jobs/{jobId}`
  - `GET /api/documents/{documentId}`
- 仕様ファイル:
  - `contracts/openapi/phase0.yaml`

## 4. 非同期処理設計

### 4.1 ジョブモデル

`jobs.status` は以下の4状態を持つ。

- `queued`
- `processing`
- `succeeded`
- `failed`

ジョブは必ずDBに保存し、Workerが取得して実行する。
ジョブ実行制御は `retry=3`、`timeout=300s` を採用する。

### 4.2 処理フロー

1. ユーザーが画像アップロード
2. `documents` レコード作成
3. `jobs` レコード作成（`queued`）
4. Workerがジョブ取得し `processing` に更新
5. OCR実行
6. LLM抽出実行
7. 正規化データ保存
8. `jobs.status` を `succeeded` または `failed` に更新

同期APIではOCRを実行しない。

## 5. データベース設計（MVP必須）

### 5.1 users

- `id`
- `email`
- `name`
- `created_at`

### 5.2 documents

- `id`
- `user_id`
- `file_path`
- `created_at`

### 5.3 extractions

- `id`
- `document_id`
- `raw_text`
- `ocr_provider`
- `confidence`
- `bounding_boxes` (JSONB)
- `created_at`

### 5.4 normalized_properties

- `id`
- `document_id`
- `property_name`
- `address`
- `price`
- `rent`
- `yield`
- `structure`
- `built_year`
- `station_info`
- `editable_fields` (JSONB)
- `created_at`
- `updated_at`

### 5.5 revisions

- `id`
- `property_id`
- `changed_by`
- `before` (JSONB)
- `after` (JSONB)
- `created_at`

### 5.6 jobs

- `id`
- `document_id`
- `status`
- `error_message`
- `created_at`
- `updated_at`

## 6. Prisma設計方針

- UUID主キーを採用する。
- 外部キー（`documents.user_id`, `extractions.document_id`, `normalized_properties.document_id`, `revisions.property_id`, `revisions.changed_by`, `jobs.document_id`）は必須とする。
- `revisions.changed_by` は `users.id` を参照する。
- タイムスタンプ列は `created_at` / `updated_at` を基本とする。
- 主要検索列には index を付与する（`documents.user_id`, `jobs.document_id`, `jobs.status`）。
- JSONBを活用する（`bounding_boxes`, `editable_fields`）。
- Supabase pooler利用時を考慮し prepared statements を無効化する。
- Prismaマイグレーションは必ずバージョン管理する。

## 7. 抽象化設計

### 7.1 StorageAdapter

```ts
interface StorageAdapter {
  upload(file: File | Buffer): Promise<string>;
  getSignedUrl(path: string): Promise<string>;
  delete(path: string): Promise<void>;
}
```

- 実装:
  - `R2StorageAdapter`
  - `S3StorageAdapter`
- アプリケーションコードからStorage SDKを直接呼ばない。

### 7.2 OCRProvider

```ts
interface OCRProvider {
  extractText(imageUrl: string): Promise<OCRResult>;
}
```

- 実装:
  - `GoogleVisionProvider`
  - （将来）`AzureVisionProvider`

### 7.3 Extractor

```ts
interface Extractor {
  extract(rawText: string): Promise<NormalizedFields>;
}
```

- OpenAI Structured Outputs で JSON スキーマを固定する。
- `extractor_version` 列を追加して抽出ロジックのバージョン管理を可能にする。

## 8. セキュリティ設計

- 認証必須（NextAuth）
- `documents` は所有者のみアクセス可
- Signed URLは期限付きで発行
- APIはすべてsession検証を必須化
- 認証識別子は `session.user.id = users.id` で統一する。

## 9. パフォーマンス設計

- OCR/LLMは必ず非同期で実行する。
- UIは2秒間隔ポーリングでジョブ状態を反映する。
- 将来はWebhook/SSE対応へ拡張可能な設計にする。
- アップロード制約は `jpg/png/pdf`, 1ファイル20MB, 1物件20枚を上限とする。
- 監視はジョブ失敗率・滞留時間・処理件数を収集し、閾値超過時に通知する。

## 10. 受け入れ基準（MVP）

1. アップロード時に `documents` と `jobs(queued)` が作成される。
2. WorkerでOCR/LLMが実行され、`extractions` と `normalized_properties` が保存される。
3. APIで同期OCRが実行されない。
4. 認証済みユーザーのみ自分のDocumentへアクセスできる。
5. 編集差分が `revisions` に記録される。
6. 東京リージョン統一方針に反しない構成でデプロイできる。

## 11. 関連ドキュメント

- `docs/design/20260225-system-architecture.md`
