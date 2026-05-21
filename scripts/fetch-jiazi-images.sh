#!/usr/bin/env bash
# Re-download 六十甲子籤圖 from https://github.com/tutorial0/chouqian
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/public/jiazi-lots"
TMP="${TMPDIR:-/tmp}/chouqian-images-$$"
rm -rf "$TMP"
git clone --depth 1 https://github.com/tutorial0/chouqian.git "$TMP"
mkdir -p "$DEST"
cp "$TMP/images/"*.jpg "$DEST/"
rm -rf "$TMP"
echo "Copied $(ls -1 "$DEST"/*.jpg 2>/dev/null | wc -l | tr -d ' ') images to $DEST"
