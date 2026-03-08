# リリース運用手順 / Release Management Runbook

- Title: リリース運用手順 / Release Management Runbook
- Status: Approved
- Created: 2026-02-24
- Last Updated: 2026-03-09
- Owner: Repository Maintainers
- Language: JA/EN

---

## 概要 / Summary (JA)

タグベースでリリースを作成し、変更履歴・リリースノート・デプロイを一貫運用する。
本手順書は Phase 0 MVP リリースを対象とし、リリース前の準備チェックリストを含む。

## Summary (EN)

Tag-driven release workflow with consistent changelog, release notes, and deployment management.
This runbook targets the Phase 0 MVP release and includes a pre-release preparation checklist.

---

## 1. リリース前の準備チェックリスト / Pre-release Checklist

以下の項目をすべて完了してから `v*` タグを作成すること。

### 1-1. 未実装・未統合の項目 / Unimplemented Items

現時点で以下は本番リリース前に対応が必要。

| # | 項目 | 状態 | 担当 |
|---|------|------|------|
| 1 | **認証**: `x-user-id` 仮ヘッダーから NextAuth（Google OAuth）へ切り替え | 未着手 | - |
| 2 | **Storage**: ローカルスタブから S3/R2 実装への切り替え | 未着手 | - |
| 3 | **Worker OCR**: Google Vision API アダプター実装 | 未着手 | - |
| 4 | **Worker LLM**: OpenAI Structured Outputs アダプター実装 | 未着手 | - |
| 5 | **本番 DB マイグレーション**: Supabase 本番環境へのマイグレーション適用 | 未着手 | - |

> Phase 0 スコープの場合は 1〜4 が完了してから `v0.1.0` タグを作成する。

### 1-2. 環境変数の設定確認 / Environment Variables

#### Vercel（`apps/web`）

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/ocrwebapp?schema=public
AUTH_URL=https://your-domain.vercel.app
AUTH_SECRET=<32文字以上のランダム文字列>
AUTH_GOOGLE_ID=<client-id>.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=<client-secret>
GOOGLE_CLOUD_PROJECT=<gcp-project-id>
GCP_SERVICE_ACCOUNT_KEY=<JSONキーを1行に変換した文字列>
CLOUD_TASKS_PROJECT=<gcp-project-id>
CLOUD_TASKS_QUEUE=ocrwebapp-phase0
CLOUD_TASKS_LOCATION=asia-northeast1
WORKER_URL=https://<cloud-run-service-url>
WORKER_SERVICE_ACCOUNT=worker@<project>.iam.gserviceaccount.com
R2_ACCOUNT_ID=<cloudflare-account-id>
R2_ACCESS_KEY_ID=<r2-access-key>
R2_SECRET_ACCESS_KEY=<r2-secret>
R2_BUCKET=<bucket-name>
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
```

#### Google Secret Manager（Cloud Run Worker）

Cloud Run は `--set-secrets` フラグで Secret Manager から取得する。
`deploy-worker.yml` で設定済み。以下の Secret が存在すること。

| Secret 名 | 内容 |
|-----------|------|
| `DATABASE_URL` | Supabase PostgreSQL 接続文字列 |
| `OPENAI_API_KEY` | OpenAI API キー |
| `GCS_BUCKET` | Storage バケット名 |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | GCP サービスアカウント JSON |

#### GitHub Actions Secrets

| Secret 名 | 用途 |
|-----------|------|
| `WIF_PROVIDER` | Workload Identity Federation プロバイダー |
| `WIF_SERVICE_ACCOUNT` | Cloud Run デプロイ用 SA |
| `WORKER_SERVICE_ACCOUNT` | Worker 実行用 SA |
| `GCP_PROJECT_ID` | GCP プロジェクト ID |

### 1-3. CHANGELOG の更新

```bash
# [Unreleased] セクションをバージョンに移行する
# 例:
## [0.1.0] - 2026-03-09
### Added
- ...（[Unreleased] の内容をここに移動）
```

### 1-4. 品質チェック

```bash
bash scripts/check.sh   # ドキュメント構造・ヘッダー確認
npm run test            # Vitest 全テスト
npm run lint            # ESLint
npm run build           # 本番ビルド確認
```

---

## 2. リリース手順 / Release Procedure

### ステップ 1: CHANGELOG を更新してコミット

```bash
git checkout main && git pull
# CHANGELOG.md を編集: [Unreleased] → [0.1.0] - YYYY-MM-DD
git add CHANGELOG.md
git commit -m "chore: CHANGELOG を v0.1.0 向けに更新"
git push
```

### ステップ 2: 本番 DB マイグレーション

```bash
# DATABASE_URL に本番 Supabase の接続文字列をセット
export DATABASE_URL="postgresql://..."
npx prisma migrate deploy --schema packages/db/prisma/schema.prisma
```

マイグレーション成功を確認してから次のステップに進む。

### ステップ 3: バージョンタグを作成・push

```bash
git tag -a v0.1.0 -m "Phase 0 MVP release"
git push origin v0.1.0
```

### ステップ 4: GitHub Actions の確認

| Workflow | 期待結果 |
|----------|---------|
| `Release` | GitHub Release が自動作成される |
| `CI` | 全ジョブ（quick-check / unit-test / markdownlint / yamllint / shellcheck）が成功 |

GitHub Actions → Actions タブで `Release` workflow の成功を確認する。

### ステップ 5: リリースノートを確認・編集

- GitHub → Releases ページを開く
- 自動生成されたリリースノートを確認し、必要に応じて手動で補足する
- `docs/templates/release-notes-template.md` を参考にすること

### ステップ 6: デプロイ確認

| 環境 | 確認方法 |
|------|---------|
| Vercel（Web） | Vercel Dashboard → Deployments でビルド成功を確認 |
| Cloud Run（Worker） | GCP Console → Cloud Run でリビジョンが正常に起動しているか確認 |
| Supabase（DB） | 接続確認クエリ `SELECT 1` またはマイグレーション履歴確認 |

### ステップ 7: CHANGELOG のリセット

```bash
# [Unreleased] セクションを空にして次のサイクルを開始
git add CHANGELOG.md
git commit -m "chore: [Unreleased] セクションをリセット"
git push
```

---

## 3. ロールバック / Rollback

### タグが誤っていた場合

```bash
git tag -d v0.1.0                       # ローカルタグ削除
git push origin :refs/tags/v0.1.0       # リモートタグ削除
# 修正後に再作成
git tag -a v0.1.0 -m "Phase 0 MVP release"
git push origin v0.1.0
```

### アプリコードのロールバック

```bash
# main で revert コミットを作成（force push は不可）
git revert <commit-sha>
git push origin main
# Vercel は main への push で自動再デプロイされる
```

### DB マイグレーションのロールバック

Prisma は `migrate revert` を持たない。
ロールバックが必要な場合は新規マイグレーションで補正する。

```bash
npx prisma migrate dev --name revert_xxx --schema packages/db/prisma/schema.prisma
```

---

## 4. 監視項目 / Monitoring

- `Release` workflow の成功（GitHub Actions）
- GitHub Release の本文とタグの整合性
- Vercel デプロイのビルドログ
- Cloud Run Worker のリビジョン起動状態

---

## 5. 障害時対応 / Incident Response

| 障害 | 対応 |
|------|------|
| `Release` workflow 失敗 | Actions ログを確認し原因修正後にタグを再 push |
| 権限エラー | リポジトリ Settings → Secrets & Variables を点検 |
| Vercel ビルドエラー | 環境変数の設定漏れを確認 |
| Cloud Run 起動失敗 | Secret Manager のシークレット存在と SA 権限を点検 |
| DB マイグレーション失敗 | `prisma migrate status` で適用済みマイグレーションを確認し補正 |

---

## 結論 / Conclusion (JA)

本リポジトリでは、タグ作成を起点とするリリースフローを標準運用とする。
初回リリース（`v0.1.0`）前に「1. リリース前の準備チェックリスト」をすべて完了すること。

## Conclusion (EN)

Adopt a tag-driven release workflow as the standard release process.
All items in "Pre-release Checklist" must be completed before the first release (`v0.1.0`).
