#!/usr/bin/env bash
# Andika fontunu Google Fonts'tan indirip public/fonts/ altına self-host eder.
#
# Neden self-host: uygulama tamamen çevrimdışı çalışmak zorunda (okul interneti
# güvenilmez), ayrıca CDN üzerinden öğrenci IP'si üçüncü tarafa gitmemeli.
#
# Neden Andika: SIL'in okuryazarlık öğretimi için tasarladığı font. Tek katlı
# 'a' ve 'g' kullanır — çocuğun okulda öğrendiği harf formu. Lisans: SIL OFL 1.1.
#
# Neden iki alt küme: Türkçe harfler ikiye bölünmüş durumda.
#   latin     → ı (U+0131), temel latin
#   latin-ext → İ ş Ş ğ Ğ (U+0100-017F)
# Yalnız birini almak 'ğ ş İ' harflerini tofu kutusuna çevirir.

set -euo pipefail

OUT="$(cd "$(dirname "$0")/.." && pwd)/public/fonts"
mkdir -p "$OUT"

UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0 Safari/537.36"
CSS=$(curl -sS "https://fonts.googleapis.com/css2?family=Andika:wght@400;700" -H "User-Agent: $UA")

fetch_subset() {
  local weight="$1" subset="$2" outfile="$3"
  local url
  # CSS'i blok blok gez; istenen ağırlık ve alt küme yorumuna denk gelen woff2'yi al.
  url=$(printf '%s\n' "$CSS" | awk -v w="font-weight: $weight;" -v s="/* $subset */" '
    $0 == s { insub = 1 }
    /^\/\* / && $0 != s { insub = 0 }
    insub && $0 ~ w { hit = 1 }
    insub && hit && /src: url\(/ {
      match($0, /https:[^)]+/); print substr($0, RSTART, RLENGTH); exit
    }
  ')
  if [ -z "$url" ]; then
    echo "HATA: $weight/$subset bulunamadı" >&2
    exit 1
  fi
  curl -sS -o "$OUT/$outfile" "$url"
  echo "  $outfile  ($(wc -c < "$OUT/$outfile" | tr -d ' ') bayt)"
}

echo "Andika indiriliyor -> $OUT"
fetch_subset 400 latin      Andika-Regular-latin.woff2
fetch_subset 400 latin-ext  Andika-Regular-latin-ext.woff2
fetch_subset 700 latin      Andika-Bold-latin.woff2
fetch_subset 700 latin-ext  Andika-Bold-latin-ext.woff2

cat > "$OUT/LICENSE.md" <<'EOF'
# Andika

Telif hakkı: SIL International.
Lisans: SIL Open Font License 1.1 — https://openfontlicense.org

Gömme, değiştirme ve ticari kullanım serbesttir; font dosyalarının kendisi
OFL koşullarıyla dağıtılır. Ayrıntı: https://fonts.google.com/specimen/Andika/license
EOF

echo "Bitti."
