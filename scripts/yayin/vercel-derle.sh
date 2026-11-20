#!/bin/sh
# Vercel derlemesi (Adım 83). Önizleme (VERCEL_ENV=preview) Okuma Yazma bayrağını açar;
# üretim ve diğer ortamlar düz `npm run build` — üretim dist değişmez.
# Vite `VITE_DERS_TUR=1` iken ders verisini dist/tur/ altına koyar (scripts/yayin/dersVerisi.ts).
set -eu
cd "$(dirname "$0")/../.."
if [ "${VERCEL_ENV:-}" = "preview" ]; then
  export VITE_DERS_TUR=1
else
  unset VITE_DERS_TUR
fi
npm run build
