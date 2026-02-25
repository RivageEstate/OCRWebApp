#!/usr/bin/env bash
set -euo pipefail

fail() {
  echo "$1" >&2
  exit 1
}

check_doc_filename() {
  local filepath="$1"
  local pattern="$2"
  local basename
  basename="$(basename "$filepath")"
  if [[ ! "$basename" =~ $pattern ]]; then
    fail "Invalid docs filename: $filepath"
  fi
}

check_doc_headers() {
  local filepath="$1"
  grep -Eq '^- Title:[[:space:]]*.*$' "$filepath" || fail "Missing header in $filepath: Title"
  grep -Eq '^- Status:[[:space:]]*' "$filepath" || fail "Missing header in $filepath: Status"
  grep -Eq '^- Created:[[:space:]]*' "$filepath" || fail "Missing header in $filepath: Created"
  grep -Eq '^- Last Updated:[[:space:]]*' "$filepath" || fail "Missing header in $filepath: Last Updated"
  grep -Eq '^- Owner:[[:space:]]*' "$filepath" || fail "Missing header in $filepath: Owner"
  grep -Eq '^- Language:[[:space:]]*JA/EN[[:space:]]*$' "$filepath" || fail "Missing header in $filepath: Language: JA/EN"
  grep -Fq '## 概要 / Summary (JA)' "$filepath" || fail "Missing section in $filepath: 概要 / Summary (JA)"
  grep -Fq '## Summary (EN)' "$filepath" || fail "Missing section in $filepath: Summary (EN)"
  grep -Fq '## 結論 / Conclusion (JA)' "$filepath" || fail "Missing section in $filepath: 結論 / Conclusion (JA)"
  grep -Fq '## Conclusion (EN)' "$filepath" || fail "Missing section in $filepath: Conclusion (EN)"
}

echo "[check] markdown files exist"
test -f README.md

echo "[check] agent instructions exist"
test -f AGENTS.md

echo "[check] workflow exists"
test -f .github/workflows/ci.yml
test -f .github/workflows/branch-name-check.yml
test -f .github/workflows/release.yml

echo "[check] release config exists"
test -f .github/release.yml

echo "[check] japanese PR template exists"
test -f .github/pull_request_template.md

echo "[check] japanese issue templates exist"
test -f .github/ISSUE_TEMPLATE/bug_report.md
test -f .github/ISSUE_TEMPLATE/feature_request.md
test -f .github/ISSUE_TEMPLATE/config.yml

echo "[check] issue templates configured (blank issue disabled)"
tr -d '\r' < .github/ISSUE_TEMPLATE/config.yml | grep -Eq '^blank_issues_enabled:[[:space:]]*false$'

echo "[check] docs directories exist"
test -d docs
test -d docs/requirements
test -d docs/design
test -d docs/operations
test -d docs/adr
test -d docs/templates

echo "[check] docs guidance files exist"
test -f docs/README.md
test -f docs/requirements/README.md
test -f docs/design/README.md
test -f docs/operations/README.md
test -f docs/adr/README.md

echo "[check] docs templates exist"
test -f docs/templates/requirements-template.md
test -f docs/templates/design-template.md
test -f docs/templates/operations-template.md
test -f docs/templates/adr-template.md
test -f docs/templates/release-notes-template.md

echo "[check] docs filenames follow naming rules"
while IFS= read -r filepath; do
  check_doc_filename "$filepath" '^[0-9]{8}-[a-z0-9]+(-[a-z0-9]+)*\.md$'
done < <(find docs/requirements docs/design docs/operations -maxdepth 1 -type f -name '*.md' ! -name 'README.md' | sort)
while IFS= read -r filepath; do
  check_doc_filename "$filepath" '^[0-9]{4}-[a-z0-9]+(-[a-z0-9]+)*\.md$'
done < <(find docs/adr -maxdepth 1 -type f -name '*.md' ! -name 'README.md' | sort)

echo "[check] docs required headers and bilingual summary/conclusion"
while IFS= read -r filepath; do
  check_doc_headers "$filepath"
done < <(find docs/templates docs/requirements docs/design docs/operations docs/adr -maxdepth 1 -type f -name '*.md' ! -name 'README.md' | sort)

echo "[check] PR template includes docs review checklist"
grep -Fq '仕様/挙動変更がある場合、関連docsを更新した' .github/pull_request_template.md
grep -Fq 'ADRが必要な変更ではADRを追加した' .github/pull_request_template.md
grep -Fq '更新対象docsのパス' .github/pull_request_template.md
# shellcheck disable=SC2016
grep -Fq 'ブランチ名が `type/short-slug` ルールに準拠している' .github/pull_request_template.md

echo "[check] branch name validator exists"
test -f scripts/validate-branch-name.sh

echo "[check] shell scripts use LF line endings"
if grep -n $'\r' scripts/*.sh; then
  echo "Detected CRLF in shell scripts. Please convert to LF." >&2
  exit 1
fi

echo "All lightweight checks passed."
