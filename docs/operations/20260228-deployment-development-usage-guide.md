# デプロイ・開発実行・利用ガイド / Deployment, Development, and Usage Guide

- Title: デプロイ・開発実行・利用ガイド / Deployment, Development, and Usage Guide
- Status: Draft
- Created: 2026-02-28
- Last Updated: 2026-02-28
- Owner: Repository Maintainers
- Language: JA/EN

## 目的 / Objective

Phase 0 の現状実装を前提に、ローカル実行手順、想定デプロイ手順、利用確認手順を一箇所にまとめる。

## 対象範囲 / Scope

- `apps/web`: Next.js アプリケーション（UI + API）
- `apps/worker`: Cloud Run 配備を想定した Worker
- `packages/db`: Prisma schema / migration

このガイドは 2026-02-28 時点の実装に基づく。現時点では以下を前提とする。

- UI はトップページの最小表示のみ
- API は `POST /api/documents` `GET /api/jobs/{jobId}` `GET /api/documents/{documentId}` の雛形のみ
- 認証は暫定的に `x-user-id` ヘッダー（UUID）で代替
- Storage はローカルスタブ実装
- Worker はジョブ受信ログを出すスタブ実装

## ローカル実行 / Local Development

### 前提条件 / Prerequisites

- Node.js 22 系
- npm
- PostgreSQL

### 初期セットアップ / Initial Setup

```bash
npm install
cp apps/web/.env.example apps/web/.env
```

`apps/web/.env` の最低設定:

- `DATABASE_URL`: 接続先 PostgreSQL
- `NEXTAUTH_URL`: 例 `http://localhost:3000`
- `NEXTAUTH_SECRET`: 任意の十分長い文字列

`GOOGLE_CLIENT_ID` などの外部連携値は、現時点の API 雛形確認だけであれば必須ではない。

### DB セットアップ / Database Setup

```bash
npm run prisma:generate
npm run prisma:migrate:dev
```

必要に応じて、テスト用ユーザーを `users` テーブルへ事前投入する。API は `x-user-id` に指定した UUID が `users.id` に存在する前提で動作する。

例:

```sql
insert into users (id, email, name)
values (
  '11111111-1111-1111-1111-111111111111',
  'local@example.com',
  'Local User'
);
```

### Web 起動 / Start Web App

```bash
npm run dev
```

起動後:

- UI: `http://localhost:3000`
- API: `http://localhost:3000/api/*`

### Worker 確認 / Worker Smoke Test

Worker は常駐キュー処理ではなく、現状は `JOB_PAYLOAD_JSON` を与えて単発実行する。

```bash
npm --workspace apps/worker run build
JOB_PAYLOAD_JSON='{"job_id":"11111111-1111-1111-1111-111111111111"}' \
node apps/worker/dist/main.js
```

期待結果:

- 標準出力に `phase0 job received (stub)` が出る

## 利用方法 / How to Use

### 1. 疎通確認 / Basic UI Check

ブラウザで `http://localhost:3000` を開き、`OCRWebApp Phase 0` が表示されることを確認する。

### 2. 文書アップロード API / Create Document via API

```bash
curl -X POST http://localhost:3000/api/documents \
  -H 'x-user-id: 11111111-1111-1111-1111-111111111111' \
  -F 'file=@/path/to/sample.jpg'
```

期待結果:

- `document_id`
- `job_id`
- `status: "queued"`

注意:

- 許可形式は `image/jpeg` `image/png` `image/webp` `application/pdf`
- 上限は 20MB

### 3. ジョブ状態確認 / Check Job Status

```bash
curl http://localhost:3000/api/jobs/<job_id> \
  -H 'x-user-id: 11111111-1111-1111-1111-111111111111'
```

現時点では Worker が DB の `jobs.status` を更新しないため、通常は `queued` のままとなる。

### 4. 文書参照 / Fetch Document Metadata

```bash
curl http://localhost:3000/api/documents/<document_id> \
  -H 'x-user-id: 11111111-1111-1111-1111-111111111111'
```

文書作成者本人の `x-user-id` を指定した場合のみ取得できる。

## デプロイ方法 / Deployment

### 構成方針 / Deployment Topology

- Web: Vercel
- DB: Supabase PostgreSQL
- Worker: Cloud Run
- リージョン: Tokyo 統一

### Web デプロイ / Deploy Web to Vercel

1. Vercel にリポジトリを接続する。
2. Project Root はリポジトリルートのまま利用する。
3. Build Command は既定値、または `npm run build` を指定する。
4. Output は Next.js 標準設定を使う。
5. Environment Variables に `apps/web/.env.example` 相当の値を登録する。

主要な環境変数:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CLOUD_PROJECT`
- `GOOGLE_APPLICATION_CREDENTIALS`
- `OPENAI_API_KEY`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_ENDPOINT`

補足:

- 現実装の Storage はスタブのため、Storage 系の値は将来の本実装用の予約枠に近い
- 本番では `DATABASE_URL` に Supabase の接続情報を設定する

### DB デプロイ / Deploy Database

1. Supabase で `ap-northeast-1` のプロジェクトを作成する。
2. `DATABASE_URL` をアプリ環境変数に設定する。
3. Prisma migration を適用する。

適用例:

```bash
npm run prisma:generate
npm run prisma:migrate:dev
```

本番適用コマンドは今後 `prisma migrate deploy` ベースへ整理する想定だが、2026-02-28 時点の `package.json` には専用 script は未定義である。

### Worker デプロイ / Deploy Worker to Cloud Run

1. `apps/worker/Dockerfile` を使ってコンテナイメージをビルドする。
2. Artifact Registry へ push する。
3. Cloud Run にデプロイする。
4. `JOB_PAYLOAD_JSON` など必要な環境変数を設定する。

ローカルビルド例:

```bash
docker build -f apps/worker/Dockerfile -t ocrwebapp-worker:local .
```

現時点の注意:

- Worker はスタブで、DB 更新や OCR/LLM 実行は未実装
- Cloud Run Job / Service のどちらで運用するかは今後のジョブ起動方式に合わせて確定する

## 検証 / Validation

ドキュメント更新時の最低限チェック:

```bash
bash scripts/check.sh
```

必要に応じて追加で実行する:

```bash
npm run test
```

## 未実装事項 / Known Gaps

- NextAuth による本認証
- Storage 実実装（S3/R2）
- Worker による `jobs` 更新、OCR 実行、LLM 抽出
- UI からのアップロード、編集、出力
- 本番 migration 用 script 整備

## 概要 / Summary (JA)

Phase 0 現状では、Next.js API 雛形と Worker スタブを対象に、ローカルで `npm run dev` と Prisma migration を使って確認できる。配備先は Vercel / Supabase / Cloud Run を前提とするが、本番運用で必要な認証・Storage・非同期実処理は今後実装される。

## Summary (EN)

As of 2026-02-28, local verification is centered on the Next.js API scaffold and the stub worker. The intended deployment topology is Vercel, Supabase, and Cloud Run, while production-grade auth, storage, and async processing are still pending implementation.

## 結論 / Conclusion (JA)

このガイドは「現時点で実際に試せる手順」と「将来の標準配備先」を分けて整理した。Phase 0 の次工程では、本ガイドを NextAuth・Storage・Worker 実装に合わせて更新する。

## Conclusion (EN)

This guide separates what is runnable today from the intended production deployment model. It should be updated together with upcoming NextAuth, storage, and worker implementations in Phase 0.
