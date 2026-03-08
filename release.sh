#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

VERSION=$(node -p "JSON.parse(require('fs').readFileSync('manifest.json','utf8')).version")
echo "=== SGS Bot v${VERSION} — Release Build ==="

echo ""
echo "[1/2] Building..."
npm run build

echo ""
echo "[2/2] Packaging..."
npm run package

echo ""
echo "=== Done! Packages are in packages/ ==="
ls -lh packages/*.zip 2>/dev/null || true
