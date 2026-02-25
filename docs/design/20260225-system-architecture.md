- Title: OCRWebApp システムアーキテクチャ（MVP）
- Status: Draft
- Created: 2026-02-25
- Last Updated: 2026-02-25
- Owner: TBD
- Language: JA/EN

## 目的 / Objective

MVPで必要なシステム構成・責務分離・非同期処理・データモデル・抽象化インターフェースを固定し、実装時の判断ブレを減らす。

## アーキテクチャ / Architecture

### 全体構成 / System Components

- Next.js（UI + API）
- Vercel（hnd1）
- Supabase PostgreSQL（ap-northeast-1）
- Prisma
- NextAuth（Google OAuth）
- S3互換Storage（R2想定）
- Cloud Run Worker（asia-northeast1）
- Google Vision API（OCR）
- OpenAI Structured Outputs（抽出）

### リージョン方針 / Region Policy

全コンポーネントを東京リージョンで統一する。  
例外的なマルチリージョン構成を採る場合はADRを追加する。

## インターフェース / Interfaces

### StorageAdapter

```ts
interface StorageAdapter {
  upload(file: File | Buffer): Promise<string>;
  getSignedUrl(path: string): Promise<string>;
  delete(path: string): Promise<void>;
}
```

実装は `R2StorageAdapter` と `S3StorageAdapter` を想定する。  
アプリ層からSDKを直接呼び出さない。

### OCRProvider

```ts
interface OCRProvider {
  extractText(imageUrl: string): Promise<OCRResult>;
}
```

実装は `GoogleVisionProvider`、将来 `AzureVisionProvider` を許容する。

### Extractor

```ts
interface Extractor {
  extract(rawText: string): Promise<NormalizedFields>;
}
```

OpenAI Structured Outputs を使い、JSONスキーマを固定する。  
抽出仕様の変更追跡用に `extractor_version` を管理する。

## データ / Data Model

MVPテーブル:
- `users`
- `documents`
- `extractions`
- `normalized_properties`
- `revisions`
- `jobs`

設計方針:
- UUID主キー
- JSONB（`bounding_boxes`, `editable_fields`）
- Prismaマイグレーションを必ず管理
- Supabase pooler前提で prepared statements 無効化

## 非同期処理 / Async Processing

1. Upload APIが `documents` と `jobs(queued)` を作成
2. Workerがジョブを取得し `processing` へ更新
3. OCR → LLM抽出 → 正規化保存
4. `jobs` を `succeeded` または `failed` に更新

API同期処理でOCR/LLMを実行しない。

## セキュリティ / Security

- API全体でsession検証
- Documentは所有者のみアクセス許可
- Signed URLは短期有効期限

## 代替案 / Alternatives

- API同期実行案:
  レスポンス遅延とタイムアウトリスクが高いため不採用。
- OCR/LLMを同一プロセス実行:
  スケーリングと障害分離が困難なため不採用。

## リスク / Risks

- 外部API遅延・失敗によりジョブ滞留が発生しうる。
- 抽出スキーマ変更時に後方互換が崩れる可能性がある。
- R2/S3の切替時に署名URL仕様差分が出る可能性がある。

## 概要 / Summary (JA)

MVPはNext.js + Supabase + Cloud Run Workerの非同期構成とし、OCR/LLMはProvider抽象化を通じて実行する。東京リージョン統一を前提に、データモデルとセキュリティ境界を固定する。

## Summary (EN)

The MVP uses an asynchronous architecture with Next.js, Supabase, and a Cloud Run worker. OCR/LLM integrations are accessed via provider abstractions. Data model boundaries, security checks, and Tokyo-only regional deployment are fixed as baseline constraints.

## 結論 / Conclusion (JA)

実装は本設計を基準に進め、例外が必要な場合は `SPEC.md` とADRで差分を明示する。

## Conclusion (EN)

Implementation should follow this design baseline. Any exceptions must be documented explicitly in `SPEC.md` and ADRs.
