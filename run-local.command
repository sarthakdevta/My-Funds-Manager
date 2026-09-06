#!/bin/zsh
set -e
cd "$(dirname "$0")"
if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js/npm is required. Install Node.js 20+ and run this file again."
  exit 1
fi
if [ ! -d node_modules ]; then
  echo "Installing dependencies…"
  npm install
fi
npm run dev
