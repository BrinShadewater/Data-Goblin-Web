#!/usr/bin/env bash
# Data Goblin — content update script.
# Re-runs the manuscript→JSON pipeline and publishes the result into the app.
# Usage:  ./update-content.sh        (from site/, or invoke from anywhere)
set -euo pipefail

SITE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTENT_DIR="$SITE_DIR/content"
APP_CONTENT_DIR="$SITE_DIR/app/public/content"

echo "── Data Goblin content update ──────────────────────────"

# Snapshot current content hashes so we can report what changed.
SNAPSHOT="$(mktemp)"
if [ -d "$CONTENT_DIR" ]; then
  (cd "$CONTENT_DIR" && find . -name '*.json' -type f -print0 | xargs -0 md5sum | sort) > "$SNAPSHOT" || true
fi

echo "[1/4] Running pipeline: site/pipeline/build_content.py"
python3 "$SITE_DIR/pipeline/build_content.py"

echo "[2/4] Copying site/content → site/app/public/content"
mkdir -p "$APP_CONTENT_DIR"
cp -r "$CONTENT_DIR/." "$APP_CONTENT_DIR/"

echo "[3/4] Verifying generated content sync"
python3 "$SITE_DIR/pipeline/check_content_sync.py" "$CONTENT_DIR" "$APP_CONTENT_DIR"

echo "[4/4] Changed files:"
NEW_SNAPSHOT="$(mktemp)"
(cd "$CONTENT_DIR" && find . -name '*.json' -type f -print0 | xargs -0 md5sum | sort) > "$NEW_SNAPSHOT"
CHANGES=$(diff "$SNAPSHOT" "$NEW_SNAPSHOT" | grep '^[<>]' | awk '{print $1, $3}' | sed 's/^</  removed\/old:/; s/^>/  updated:/' | sort -u | grep 'updated:' || true)
if [ -z "$CHANGES" ]; then
  echo "  (no content changes detected)"
else
  echo "$CHANGES"
fi
rm -f "$SNAPSHOT" "$NEW_SNAPSHOT"

echo "Done. Reload the dev server page (npm run dev) or rebuild (npm run build) in site/app."
