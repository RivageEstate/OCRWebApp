# 本番環境セットアップガイド / Production Environment Setup Guide

- Title: 本番環境セットアップガイド / Production Environment Setup Guide
- Status: Draft
- Created: 2026-03-09
- Last Updated: 2026-03-09
- Owner: keikur1hara
- Language: JA/EN

## 目的

本番環境（Vercel + Supabase + Cloud Run + Cloudflare R2）を初回セットアップするための手順書。
コードはすべて揃っているため、外部サービスの用意と環境変数の設定が主な作業となる。

## 前提条件

以下のアカウントが必要。

| サービス | 用途 | 無料枠 |
|---|---|---|
| [Vercel](https://vercel.com) | Next.js ホスティング | あり |
| [Supabase](https://supabase.com) | PostgreSQL | あり |
| [Google Cloud Platform](https://console.cloud.google.com) | Vision API / Cloud Run / Cloud Tasks / OAuth | 従量課金 |
| [Cloudflare](https://cloudflare.com) | R2 Storage | あり（10GB/月） |
| [OpenAI](https://platform.openai.com) | GPT-4o による物件情報抽出 | 従量課金 |

## セットアップ手順

### 1. Supabase（PostgreSQL）

1. [Supabase ダッシュボード](https://supabase.com/dashboard) でプロジェクトを新規作成する
   - リージョン: **ap-northeast-1（Tokyo）**
   - DB パスワードを控えておく

2. `Settings > Database > Connection string` から接続 URL を取得する
   - Transaction Pooler（ポート 6543）の URL を使用する（Vercel Functions との相性が良い）
   - URL の末尾に `?pgbouncer=true&connection_limit=1` を追加する

3. 取得した URL を `DATABASE_URL` として後の手順で使用する

4. Prisma マイグレーションを本番 DB に適用する

   ```bash
    npx prisma migrate deploy --schema packages/db/prisma/schema.prisma
   ```

### 2. Google Cloud Platform

#### 2-1. プロジェクト作成・API 有効化

1. GCP Console でプロジェクトを作成（または既存プロジェクトを使用）する
2. 以下の API を有効化する
   - Cloud Vision API
   - Cloud Run API
   - Cloud Tasks API
   - Artifact Registry API

#### 2-2. Google OAuth クライアント（NextAuth 認証用）

1. `APIs & Services > Credentials > Create Credentials > OAuth client ID` を選択する
2. アプリケーションの種類: **Web application**
3. 承認済みリダイレクト URI に以下を追加する
   - `https://<your-vercel-domain>/api/auth/callback/google`
4. `CLIENT_ID` と `CLIENT_SECRET` を控えておく

#### 2-3. サービスアカウント作成（Cloud Tasks ディスパッチ用）

1. `IAM & Admin > Service Accounts` で新規サービスアカウントを作成する
   - 名前例: `ocrwebapp-web`
2. 以下のロールを付与する
   - `Cloud Tasks Enqueuer`
3. `Keys > Add Key > Create new key > JSON` でキーファイルをダウンロードする
4. キーファイルの内容を 1 行の文字列に変換する

   ```bash
   cat key.json | tr -d '\n'
   ```

5. この文字列を `GCP_SERVICE_ACCOUNT_KEY` として後の手順で使用する

#### 2-4. Cloud Tasks キュー作成

1. `Cloud Tasks > Queues > Create Queue` を選択する
   - リージョン: **asia-northeast1**
   - キュー名例: `ocrwebapp-jobs`
2. キュー名とリージョンを控えておく（`CLOUD_TASKS_QUEUE` / `CLOUD_TASKS_LOCATION`）

#### 2-5. Cloud Run Worker デプロイ

1. Artifact Registry でリポジトリを作成する
   - リージョン: **asia-northeast1**
   - 形式: Docker

2. Worker コンテナをビルドして push する

   ```bash
   # イメージをビルド
   docker build -f apps/worker/Dockerfile -t asia-northeast1-docker.pkg.dev/ocrwebapp/ocrwebapp/ocrwebapp-worker:latest .

   # Artifact Registry へ push
   gcloud auth configure-docker asia-northeast1-docker.pkg.dev
   docker push asia-northeast1-docker.pkg.dev/ocrwebapp/ocrwebapp/ocrwebapp-worker:latest
   ```

3. Cloud Run にデプロイする

   ```bash
   gcloud run deploy ocrwebapp-worker \
     --image asia-northeast1-docker.pkg.dev/<PROJECT_ID>/<REPO>/ocrwebapp-worker:latest \
     --region asia-northeast1 \
     --no-allow-unauthenticated \
     --set-env-vars DATABASE_URL=<supabase-pooler-url> \
     --set-env-vars GOOGLE_CLOUD_PROJECT=<PROJECT_ID> \
     --set-env-vars OPENAI_API_KEY=<openai-key> \
     --set-env-vars R2_ACCOUNT_ID=<r2-account-id> \
     --set-env-vars R2_ACCESS_KEY_ID=<r2-access-key-id> \
     --set-env-vars R2_SECRET_ACCESS_KEY=<r2-secret-key> \
     --set-env-vars R2_BUCKET=<r2-bucket> \
     --set-env-vars R2_ENDPOINT=<r2-endpoint>
   ```

4. デプロイされた Cloud Run サービスの URL を控えておく（`WORKER_URL`）

5. Cloud Run サービスを呼び出せるサービスアカウントを用意する
   - `iam.serviceAccounts.actAs` と `run.routes.invoke` 権限を持つ SA のメールアドレスを `WORKER_SERVICE_ACCOUNT` に設定する

#### 2-6. Google Vision API 認証設定（Worker 用）

Worker は環境変数 `GOOGLE_APPLICATION_CREDENTIALS` または Application Default Credentials（ADC）で Vision API を認証する。
Cloud Run 上では、Cloud Run サービスに割り当てたサービスアカウントに `roles/cloudvision.serviceAgent` を付与することで ADC が自動的に機能する。

### 3. Cloudflare R2（Storage）

1. [Cloudflare ダッシュボード](https://dash.cloudflare.com) で R2 を有効化する
2. バケットを作成する
   - バケット名例: `ocrwebapp-uploads`
   - ロケーション: **APAC**（東京に近いリージョンが自動選択される）
3. `R2 > Manage R2 API Tokens > Create API Token` でトークンを作成する
   - 権限: **Object Read & Write**（対象バケットのみ）
4. 以下の値を控えておく
   - `R2_ACCOUNT_ID`: アカウント ID（ダッシュボード右上）
   - `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`: 作成したトークン
   - `R2_BUCKET`: バケット名
   - `R2_ENDPOINT`: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

### 4. OpenAI

1. [OpenAI Platform](https://platform.openai.com/api-keys) で API キーを作成する
2. 作成したキーを `OPENAI_API_KEY` として後の手順で使用する

### 5. Vercel（Next.js ホスティング）

1. [Vercel ダッシュボード](https://vercel.com/new) でプロジェクトを作成し、GitHub リポジトリと接続する
   - Framework Preset: **Next.js**
   - Root Directory: リポジトリルートのまま（変更不要）
   - Build Command: `npm run build`（デフォルト）

2. `Settings > Environment Variables` に以下をすべて登録する

   | 変数名 | 値の出所 |
   |---|---|
   | `DATABASE_URL` | Supabase Pooler URL（手順 1） |
   | `AUTH_URL` | `https://<your-vercel-domain>` |
   | `AUTH_SECRET` | `openssl rand -base64 32` で生成した文字列 |
   | `AUTH_GOOGLE_ID` | GCP OAuth クライアント ID（手順 2-2） |
   | `AUTH_GOOGLE_SECRET` | GCP OAuth クライアントシークレット（手順 2-2） |
   | `GOOGLE_CLOUD_PROJECT` | GCP プロジェクト ID |
   | `GCP_SERVICE_ACCOUNT_KEY` | SA キー JSON の 1 行文字列（手順 2-3） |
   | `CLOUD_TASKS_PROJECT` | GCP プロジェクト ID |
   | `CLOUD_TASKS_QUEUE` | Cloud Tasks キュー名（手順 2-4） |
   | `CLOUD_TASKS_LOCATION` | `asia-northeast1` |
   | `WORKER_URL` | Cloud Run Worker URL（手順 2-5） |
   | `WORKER_SERVICE_ACCOUNT` | Worker 呼び出し用 SA メールアドレス（手順 2-5） |
   | `OPENAI_API_KEY` | OpenAI API キー（手順 4） |
   | `R2_ACCOUNT_ID` | Cloudflare アカウント ID（手順 3） |
   | `R2_ACCESS_KEY_ID` | R2 API トークン（手順 3） |
   | `R2_SECRET_ACCESS_KEY` | R2 API シークレット（手順 3） |
   | `R2_BUCKET` | R2 バケット名（手順 3） |
   | `R2_ENDPOINT` | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |

3. 初回デプロイを実行し、Vercel が発行したドメインを確認する

   - `AUTH_SECRET` は Preview / Production の両 Environment に登録する
   - 既存設定で `NEXTAUTH_SECRET` を使っている場合も互換的に利用できるが、新規設定は `AUTH_SECRET` に統一する

4. GCP OAuth クライアントの承認済みリダイレクト URI を本番ドメインで更新する（手順 2-2 参照）

## デプロイ後の動作確認

以下の順で疎通を確認する。

1. `https://<your-domain>/` にアクセスし、ホームページが表示されることを確認する
2. Google ログインが完了することを確認する
3. `/upload` から画像をアップロードし、`document_id` と `job_id` が返ることを確認する
4. `/jobs/<job_id>` でジョブが `queued → processing → succeeded` に遷移することを確認する
5. `/documents/<document_id>/edit` で OCR 結果が表示されることを確認する

## Worker の更新デプロイ手順

コードを変更した場合は以下で Worker を再デプロイする。

```bash
docker build -f apps/worker/Dockerfile -t asia-northeast1-docker.pkg.dev/<PROJECT_ID>/<REPO>/ocrwebapp-worker:latest .
docker push asia-northeast1-docker.pkg.dev/<PROJECT_ID>/<REPO>/ocrwebapp-worker:latest
gcloud run deploy ocrwebapp-worker --image asia-northeast1-docker.pkg.dev/<PROJECT_ID>/<REPO>/ocrwebapp-worker:latest --region asia-northeast1
```

## DB スキーマ変更時の手順

Prisma マイグレーションを本番 DB に適用する場合は以下を実行する。

```bash
DATABASE_URL="<supabase-pooler-url>" npx prisma migrate deploy --schema packages/db/prisma/schema.prisma
```

`migrate deploy` は `migrate dev` と異なり、インタラクティブな操作なしに適用される。
本番では必ず `migrate deploy` を使用する。

## 概要 / Summary (JA)

このガイドは、Vercel / Supabase / Cloud Run / Cloudflare R2 を使って本番環境を初回セットアップするための手順を整理している。PR #75 時点では、NextAuth のシークレットは `AUTH_SECRET` を基準とし、Preview / Production の両 Environment へ設定する。

## Summary (EN)

This guide explains the initial production setup for Vercel, Supabase, Cloud Run, and Cloudflare R2. As of PR #75, the NextAuth secret should be configured via `AUTH_SECRET` and populated in both Preview and Production environments.

## 結論 / Conclusion (JA)

本番デプロイの成立条件は、外部サービスの作成だけでなく、認証・DB・Storage・Worker 連携に必要な環境変数を漏れなく登録することにある。特に Auth.js は `AUTH_SECRET` 未設定だと起動時に失敗するため、Vercel プロジェクト作成直後に登録しておく。

## Conclusion (EN)

Successful production deployment depends not only on creating the external services but also on configuring all required environment variables for auth, database, storage, and worker integration. In particular, Auth.js will fail at startup if `AUTH_SECRET` is missing, so it should be added to Vercel immediately after project creation.
