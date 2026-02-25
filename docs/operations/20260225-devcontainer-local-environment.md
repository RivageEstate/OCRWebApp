# Dev Container ローカル開発環境手順 / Dev Container Local Environment Runbook

- Title: Dev Container ローカル開発環境手順 / Dev Container Local Environment Runbook
- Status: Draft
- Created: 2026-02-25
- Last Updated: 2026-02-25
- Owner: TBD
- Language: JA/EN

## 前提 / Preconditions

- Docker Desktop が起動している。
- VS Code に Dev Containers 拡張がインストールされている。
- リポジトリルートに `.devcontainer/devcontainer.json` と `docker-compose.yml` が存在する。

## 手順 / Procedure

1. VS Code でリポジトリを開く。
2. `Dev Containers: Reopen in Container` を実行する。
3. コンテナ初回起動時に `npm install` と `npx prisma generate` の post-create が実行される。
4. コンテナターミナルで `cp .env.example .env` を実行する。
5. `npx prisma migrate dev` でローカルDBへマイグレーションを適用する。
6. `npm run dev` でアプリを起動する。
7. 必要に応じて `npm run test` と `bash scripts/check.sh` を実行する。

## ロールバック / Rollback

- 環境破損時は `Dev Containers: Rebuild Container` を実行する。
- DBを初期化する場合は `docker compose down -v` 後に再起動する。

## 監視項目 / Monitoring

- `docker compose ps` で `app` と `db` が `running` であること。
- `npm run dev` 実行時に `http://localhost:3000` で応答があること。
- `npx prisma migrate dev` が失敗していないこと。

## 障害時対応 / Incident Response

- `npm install` 失敗時はコンテナ内で Node バージョンを確認し、再ビルドする。
- DB接続失敗時は `DATABASE_URL` が `db:5432` を向いているか確認する。
- `postCreateCommand` が途中失敗した場合はコンテナ内で手動再実行する。

## 概要 / Summary (JA)

Dev Container と Docker Compose を使って Node.js と PostgreSQL の実行環境を固定し、実装開始時の環境差分を最小化する。

## Summary (EN)

Use Dev Container and Docker Compose to standardize Node.js and PostgreSQL local runtime and minimize environment drift at implementation kickoff.

## 結論 / Conclusion (JA)

Phase 0 のローカル実装は本手順を標準とし、例外運用を行う場合は理由を運用docsに追記する。

## Conclusion (EN)

Use this runbook as the default local setup for Phase 0. Document any exceptions with rationale in operations docs.
