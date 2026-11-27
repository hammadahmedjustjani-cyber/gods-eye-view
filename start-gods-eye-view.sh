#!/usr/bin/env bash
# macOS / Linux launcher. Windows users: double-click START-GODS-EYE-VIEW.bat.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

if ! command -v node >/dev/null 2>&1; then
  cat <<'MSG'
  Node.js was not found.

  Install it, then run this file again:
    macOS (Homebrew):  brew install node
    Debian/Ubuntu:     sudo apt install nodejs npm
    Fedora:            sudo dnf install nodejs npm
  Current LTS builds: https://nodejs.org/
MSG
  exit 1
fi

exec node launcher/gev-launch.mjs
