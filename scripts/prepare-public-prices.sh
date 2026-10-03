#!/usr/bin/env bash
# Arma la carpeta que se publica en precios-avovite (mismos archivos que work/deploy-public-prices.ps1).
set -euo pipefail
OUT=${1:-dist-precios}
rm -rf "$OUT"; mkdir -p "$OUT"
cp public-prices-host/vercel.json "$OUT/vercel.json"
files=(precios.html support.js assets/logo.png assets/vendor/react-18.3.1.min.js assets/vendor/react-dom-18.3.1.min.js
  assets/loading-manifest.json assets/vendor/html2canvas.min.js assets/vendor/jspdf.umd.min.js api/config.js
  api/prices.js lib/public-prices.cjs lib/public-prices-ux.cjs)
files+=($(node -e "console.log(require('./assets/loading-manifest.json').files.join(' '))"))
for f in "${files[@]}"; do mkdir -p "$OUT/$(dirname "$f")"; cp "$f" "$OUT/$f"; done
echo "Archivos listos: ${#files[@]}"
