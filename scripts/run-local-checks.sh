#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TOOLS_ROOT="${XDG_CACHE_HOME:-$HOME/.cache}/ocrwebapp-local-checks"
ENV_FILE="$TOOLS_ROOT/env.sh"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Local check env is not initialized: $ENV_FILE" >&2
  echo "Run: bash \"$REPO_ROOT/scripts/setup-local-check-env.sh\"" >&2
  exit 1
fi

# shellcheck disable=SC1090
source "$ENV_FILE"

require_cmd() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || {
    echo "Missing command in local check env: $cmd" >&2
    echo "Run: bash \"$REPO_ROOT/scripts/setup-local-check-env.sh\"" >&2
    exit 1
  }
}

require_cmd markdownlint-cli2
require_cmd yamllint
require_cmd shellcheck

echo "[local-check] bash scripts/check.sh"
bash "$REPO_ROOT/scripts/check.sh"

echo "[local-check] markdownlint-cli2"
markdownlint-cli2 "**/*.md"

echo "[local-check] yamllint"
yamllint .

echo "[local-check] shellcheck"
shellcheck "$REPO_ROOT"/scripts/*.sh

echo "[local-check] branch name"
branch_name="$(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD)"
bash "$REPO_ROOT/scripts/validate-branch-name.sh" "$branch_name"

echo "All local checks passed."
