# ローカルチェック環境セットアップ / Local Check Environment Setup

- Title: ローカルチェック環境セットアップ / Local Check Environment Setup
- Status: Draft
- Created: 2026-02-25
- Last Updated: 2026-02-25
- Owner: TBD
- Language: JA/EN

## 目的 / Objective

GitHub Actions の `markdownlint` / `yamllint` / `shellcheck` /
`scripts/check.sh` をローカルで再現し、PR前に失敗原因を検出できる
状態を作る。

## 前提条件 / Prerequisites

- `bash`
- `python3` と `pip`
- `curl`
- `tar` と `xz`

## セットアップ手順 / Setup Steps

```bash
bash scripts/setup-local-check-env.sh
```

初回実行時に以下をインストールする。

- Node.js（`~/.cache/ocrwebapp-local-checks/node`）
- Python venv（`~/.cache/ocrwebapp-local-checks/venv`）
- `markdownlint-cli2`
- `yamllint`
- `shellcheck`

## チェック実行 / Run Checks

```bash
bash scripts/run-local-checks.sh
```

`run-local-checks.sh` は実行時に自動でリポジトリルートへ移動してから検証するため、どのカレントディレクトリから呼び出しても同じ結果になる。

実行内容:

- `bash scripts/check.sh`
- `markdownlint-cli2 "**/*.md"`
- `yamllint .`
- `shellcheck scripts/*.sh`
- `bash scripts/validate-branch-name.sh <current-branch>`

## 更新方針 / Maintenance

- ツールバージョンは `scripts/setup-local-check-env.sh` で管理する。
- CI 側のツール更新時は、同一 PR でこの手順も更新する。

## 概要 / Summary (JA)

`scripts/setup-local-check-env.sh` と `scripts/run-local-checks.sh` により、CI 相当の静的チェックをローカルで実行できる。

## Summary (EN)

The local scripts provide a reproducible environment to run
CI-equivalent lint and lightweight checks before opening a PR.

## 結論 / Conclusion (JA)

PR 送信前に `scripts/run-local-checks.sh` を実行し、失敗を先に解消する運用を基本とする。

## Conclusion (EN)

Run `scripts/run-local-checks.sh` before creating a PR and fix failures locally first.
