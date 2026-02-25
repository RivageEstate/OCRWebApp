#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <branch-name>" >&2
  exit 2
fi

branch_name="$1"
pattern='^(feature|fix|chore|docs|refactor|test|ci)\/[a-z0-9]+(-[a-z0-9]+)*$'

if [[ "$branch_name" =~ $pattern ]]; then
  echo "Branch name is valid: $branch_name"
  exit 0
fi

echo "Invalid branch name: $branch_name" >&2
echo "Expected format: type/short-slug" >&2
echo "Allowed types: feature, fix, chore, docs, refactor, test, ci" >&2
echo "short-slug rule: lowercase letters, numbers, and single hyphens only" >&2
exit 1
