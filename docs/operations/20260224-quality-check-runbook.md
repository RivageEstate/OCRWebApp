# 品質チェック運用手順 / Quality Check Runbook

- Title: 品質チェック運用手順 / Quality Check Runbook
- Status: Approved
- Created: 2026-02-24
- Last Updated: 2026-02-24
- Owner: Repository Maintainers
- Language: JA/EN

## 前提 / Preconditions

- リポジトリルートでコマンドを実行する。
- Bash または PowerShell が利用可能である。

## 手順 / Procedure

1. `bash scripts/check.sh` を実行する。
2. Windows環境では `pwsh ./scripts/check.ps1` を実行する。
3. 必要に応じて `shellcheck scripts/*.sh` `yamllint .` `markdownlint-cli2 "**/*.md"` を実行する。

## ロールバック / Rollback

- ルール追加で運用に支障がある場合は、変更したチェック項目を元に戻すPRを作成する。

## 監視項目 / Monitoring

- GitHub Actions の `CI` と `Branch Name Check` が成功していること。

## 障害時対応 / Incident Response

- CI失敗時はログから失敗ジョブを特定し、同じコマンドをローカルで再現する。
- 再現不能な場合は実行環境差分を Issue に記録する。

## 概要 / Summary (JA)

品質チェックの実行手順と失敗時の対応フローを標準化する。

## Summary (EN)

Standardize execution and failure-response flow for quality checks.

## 結論 / Conclusion (JA)

運用ではローカル事前確認とCI結果確認の両方を必須とする。

## Conclusion (EN)

Require both local pre-checks and CI verification in regular operations.
