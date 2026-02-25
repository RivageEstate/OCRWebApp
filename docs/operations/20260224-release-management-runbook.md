# リリース運用手順 / Release Management Runbook

- Title: リリース運用手順 / Release Management Runbook
- Status: Approved
- Created: 2026-02-24
- Last Updated: 2026-02-24
- Owner: Repository Maintainers
- Language: JA/EN

## 前提 / Preconditions

- `main` へのマージ済み変更があること。
- リリース対象の変更が `CHANGELOG.md` に反映されていること。
- `CI` と `Branch Name Check` が成功していること。

## 手順 / Procedure

1. `CHANGELOG.md` の `Unreleased` を更新する。
2. `docs/templates/release-notes-template.md` を使ってリリースノート案を作成する。
3. バージョンタグを作成して push する（例: `v1.2.3`）。
4. `Release` workflow が GitHub Release を作成したことを確認する。
5. 公開後に `CHANGELOG.md` の `Unreleased` を空にし、次サイクルを開始する。

## ロールバック / Rollback

- 誤ったタグを作成した場合はタグを削除し、修正版タグを再作成する。
- 誤ったリリースノートは GitHub Release 画面で修正する。

## 監視項目 / Monitoring

- `Release` workflow の成功
- GitHub Release の本文とタグの整合性

## 障害時対応 / Incident Response

- workflow 失敗時は Actions ログを確認し、失敗原因を修正してタグを再pushする。
- 権限不足やトークン問題はリポジトリ設定と権限を点検する。

## 概要 / Summary (JA)

タグベースでリリースを作成し、変更履歴とリリースノートを一貫運用する。

## Summary (EN)

Use tag-based releases with consistent changelog and release notes management.

## 結論 / Conclusion (JA)

本リポジトリでは、タグ作成を起点とするリリースフローを標準運用とする。

## Conclusion (EN)

Adopt a tag-driven release workflow as the standard release process.
