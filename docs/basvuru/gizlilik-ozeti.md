# Gizlilik özeti

- **Sıfır veri:** uygulama öğrenci veya veli verisi toplamaz, saklamaz, göndermez. Ayarlar yalnız açık oturumun
  belleğindedir; cihazda kalan tek anahtar ekran boyutu tercihi (öğrenci verisi değil). ADR-0002 (saklama modeli) `Önerildi`; bugünkü sürüm Seçenek A (hiçbir şey saklanmaz).
- **Ağ kanıtı:** e2e testleri her akışta istekleri kaydeder; rapor istekleri türe göre özetler ve başka köken, gövdeli
  istek, soket, çerez veya IndexedDB yazımında kırmızıya döner (`docs/gizlilik/kanit-raporu.md`, CI artefaktı).
- **Statik denetim (K9):** `fetch` yalnız ses yükleyicide, `postMessage`/`sendBeacon`/WebSocket/`window.parent` yasak.
- **Eve link:** öğretmenin eve gönderdiği bağlantı yalnız düğüm kodu + tohum taşır, adres çubuğundan hemen silinir.
- **Herkesin doğrulayabileceği sayfa:** `/gizlilik` (3 adımlı kendin doğrula). KVKK aydınlatma metni **taslak** —
  hukuki görüş kullanıcıda (`/gizlilik/kvkk.html`).
- **Bağımsız inceleme:** adaylar ve önerilen sıra `docs/gizlilik/rozet-yol-haritasi.md`; programların şartları birincil
  kaynaktan doğrulanmadı, başvuru kullanıcıda.
