#!/usr/bin/env bash
# Run Rocket Invo dev mode from a HOST (non-Flatpak) terminal.
set -e
cd "$(dirname "$0")"
npm run build:electron
./node_modules/.bin/concurrently -n server,electron \
  "./node_modules/.bin/vite" \
  "./node_modules/.bin/wait-on http://localhost:5173 && ./node_modules/.bin/electron . --dev"
