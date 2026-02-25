#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TOOLS_ROOT="${XDG_CACHE_HOME:-$HOME/.cache}/ocrwebapp-local-checks"
NODE_VERSION="${NODE_VERSION:-22.13.1}"
VENV_DIR="$TOOLS_ROOT/venv"
NODE_DIR="$TOOLS_ROOT/node"
NODE_TOOLS_DIR="$TOOLS_ROOT/node-tools"
ENV_FILE="$TOOLS_ROOT/env.sh"

detect_node_platform() {
  local os arch
  os="$(uname -s)"
  arch="$(uname -m)"

  case "$os" in
    Linux) os="linux" ;;
    Darwin) os="darwin" ;;
    *)
      echo "Unsupported OS: $os" >&2
      exit 1
      ;;
  esac

  case "$arch" in
    x86_64|amd64) arch="x64" ;;
    aarch64|arm64) arch="arm64" ;;
    *)
      echo "Unsupported CPU architecture: $arch" >&2
      exit 1
      ;;
  esac

  printf "%s-%s" "$os" "$arch"
}

install_node() {
  local platform tmpdir tarball_url
  platform="$(detect_node_platform)"

  if [[ -x "$NODE_DIR/bin/node" ]]; then
    return
  fi

  echo "[setup] install node v$NODE_VERSION ($platform)"
  tmpdir="$(mktemp -d)"
  tarball_url="https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-${platform}.tar.xz"
  curl -fsSL "$tarball_url" -o "$tmpdir/node.tar.xz"
  rm -rf "$NODE_DIR"
  mkdir -p "$NODE_DIR"
  tar -xJf "$tmpdir/node.tar.xz" --strip-components=1 -C "$NODE_DIR"
  rm -rf "$tmpdir"
}

install_python_tools() {
  echo "[setup] install virtualenv"
  if python3 -m pip install --help 2>/dev/null | grep -q -- '--break-system-packages'; then
    python3 -m pip install --user --break-system-packages virtualenv==20.29.3
  else
    python3 -m pip install --user virtualenv==20.29.3
  fi

  if [[ ! -x "$VENV_DIR/bin/python" ]]; then
    echo "[setup] create python virtualenv"
    python3 -m virtualenv "$VENV_DIR"
  fi

  echo "[setup] install yamllint and shellcheck"
  "$VENV_DIR/bin/pip" install --upgrade pip
  "$VENV_DIR/bin/pip" install yamllint==1.37.1 shellcheck-py==0.11.0.1
}

install_node_tools() {
  echo "[setup] install markdownlint-cli2"
  mkdir -p "$NODE_TOOLS_DIR"
  PATH="$NODE_DIR/bin:$PATH" "$NODE_DIR/bin/npm" --prefix "$NODE_TOOLS_DIR" install --no-fund --no-audit markdownlint-cli2@0.18.1
}

write_env_file() {
  cat > "$ENV_FILE" <<EOF
export OCRWEBAPP_CHECK_TOOLS_ROOT="$TOOLS_ROOT"
export PATH="$VENV_DIR/bin:$NODE_DIR/bin:$NODE_TOOLS_DIR/node_modules/.bin:\$PATH"
EOF
}

main() {
  mkdir -p "$TOOLS_ROOT"

  install_node
  install_python_tools
  install_node_tools
  write_env_file

  echo
  echo "Local check tools are ready."
  echo "Tools root: $TOOLS_ROOT"
  echo "Use: source \"$ENV_FILE\""
  echo "Then run: bash \"$REPO_ROOT/scripts/run-local-checks.sh\""
}

main "$@"
