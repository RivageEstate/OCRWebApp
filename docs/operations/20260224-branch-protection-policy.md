# ブランチ保護ポリシー / Branch Protection Policy

- Title: ブランチ保護ポリシー / Branch Protection Policy
- Status: Approved
- Created: 2026-02-24
- Last Updated: 2026-02-24
- Owner: Repository Maintainers
- Language: JA/EN

## 前提 / Preconditions

- GitHub リポジトリ管理者権限を持つこと。
- デフォルトブランチが `main` であること。

## 手順 / Procedure

1. `Settings > Branches > Add branch protection rule` を開く。
2. `Branch name pattern` に `main` を設定する。
3. 次の項目を有効化する。
   - Require a pull request before merging
   - Require approvals（1以上）
   - Dismiss stale pull request approvals when new commits are pushed
   - Require status checks to pass before merging
   - Require conversation resolution before merging
4. Required status checks に次を設定する。
   - `CI`
   - `Branch Name Check`
5. 必要に応じて次を有効化する。
   - Require branches to be up to date before merging
   - Restrict who can push to matching branches
   - Do not allow bypassing the above settings

## ロールバック / Rollback

- 運用に支障がある場合は、一時的に必須チェックを見直し、変更理由を PR または Issue に記録する。

## 監視項目 / Monitoring

- 保護ルールが `main` に適用されていること。
- 必須チェックが継続的に成功していること。

## 障害時対応 / Incident Response

- 必須チェックの恒常的失敗が発生した場合は、失敗ジョブを修正する PR を優先作成する。
- 緊急対応が必要な場合は、期間限定の運用例外を記録する。

## 概要 / Summary (JA)

`main` への直接変更を防ぎ、PR と必須チェックを通した変更のみを許可する。

## Summary (EN)

Protect `main` by enforcing PR-based changes and required checks.

## 結論 / Conclusion (JA)

標準運用として `main` のブランチ保護を常時有効にする。

## Conclusion (EN)

Keep branch protection on `main` enabled as a default operating policy.
