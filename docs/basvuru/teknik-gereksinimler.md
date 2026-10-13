# Teknik gereksinimler

| Konu | Gereksinim | Kaynak |
|---|---|---|
| Tarayıcı | Güncel Chromium tabanlı tarayıcı (akıllı tahtalardaki Chrome/Edge), Safari (iPad), Firefox. ES modülü ve Web Audio gerekir | `docs/yayin.md` |
| Kurulum | Yok: web adresi açılır. İsteğe bağlı PWA olarak ana ekrana eklenir; ilk yüklemeden sonra çevrimdışı çalışır | e2e `onizleme-cevrimdisi.spec.ts` |
| Ağ | Yalnız uygulamanın kendi kökeni (HTML, JS, ses, görsel). Üçüncü taraf istek, çerez, analitik yok. Filtre listesine tek alan adı eklenir | `docs/kurulum/okul-agi.md`, `docs/gizlilik/kanit-raporu.md` |
| Okul sunucusu | `dist-okul.zip` herhangi bir statik sunucuya veya alt klasöre kopyalanabilir; dosyaya çift tıklayarak (`file://`) açılış tarayıcı güvenliği nedeniyle desteklenmez | `docs/kurulum/okul-agi.md` |
| Ekran | Akıllı tahta (≥1600 px, dokunmatik), tablet, telefon; profil otomatik veya öğretmen ayarıyla | PLAN §3 |
| Ses | Önceden üretilmiş klipler (çalışma anında konuşma servisi yok); hoparlör gerekir | PLAN §4 |
| Gömme | `?gomulu=eba` / `?gomulu=okul-portali` (yalnız iframe içinde). iframe: `allow="fullscreen; screen-wake-lock"`. Yayın başlığı bugün `frame-ancestors 'self'` — başka köken EBA ile teyit edilince eklenir | `docs/yayin.md`, e2e `onizleme-gomulu.spec.ts` |
| Güvenlik başlıkları | Sıkı CSP (`default-src 'self'`, `connect-src 'self'`, `form-action 'none'`), `Referrer-Policy: no-referrer` | `vercel.json`, `/gizlilik` |
