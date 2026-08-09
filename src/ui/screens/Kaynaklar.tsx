/**
 * Kaynaklar ekranı — plan §8 lisanslar + §14 adım 11 gizlilik beyanı.
 *
 * İçerik:
 *   - Gizlilik beyanı (KVKK — tek paragraf)
 *   - Açık kaynak lisansları
 *   - TTS sağlayıcı bilgisi
 *
 * Çocuk bu ekrana veli kapısından ulaşır — çocuk arayüzünde değil.
 */

import { useAppStore } from '../../store/appStore';

export function Kaynaklar() {
  const ekranGit = useAppStore((s) => s.ekranGit);

  return (
    <div
      style={{
        padding: '2rem',
        maxWidth: '40rem',
        margin: '0 auto',
        overflowY: 'auto',
        height: '100%',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Kaynaklar</h1>

      {/* Gizlilik beyanı */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Gizlilik</h2>
        <p
          style={{
            fontSize: '0.95rem',
            lineHeight: 1.6,
            color: '#333',
          }}
        >
          Bu uygulama ad-soyad, fotoğraf, konum veya hesap bilgisi İSTEMEZ.
          Tüm veri yalnızca cihazda saklanır, hiçbir sunucuya gönderilmez.
          Uygulamayı kaldırdığınızda tüm veri silinir. İnternet bağlantısı
          gerekmez — ilk yüklemeden sonra çevrimdışı çalışır.
        </p>
      </section>

      {/* Açık kaynak lisansları */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Açık Kaynak Lisansları</h2>
        <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.9rem', lineHeight: 1.8 }}>
          <li>
            <strong>React</strong> — MIT Lisansı · Copyright (c) Meta Platforms, Inc.
          </li>
          <li>
            <strong>Vite</strong> — MIT Lisansı · Copyright (c) Evan You
          </li>
          <li>
            <strong>Dexie.js</strong> — Apache-2.0 Lisansı · Copyright (c) David Fahlander
          </li>
          <li>
            <strong>Zustand</strong> — MIT Lisansı · Copyright (c) Paul Henschel
          </li>
          <li>
            <strong>vite-plugin-pwa</strong> — MIT Lisansı
          </li>
          <li>
            <strong>Noto Color Emoji</strong> — SIL OFL 1.1
          </li>
          <li>
            <strong>Piper TTS</strong> (tr_TR-fahrettin-medium) — MIT Lisansı
          </li>
        </ul>
      </section>

      {/* Müfredat kaynağı */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Müfredat Kaynağı</h2>
        <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#333' }}>
          Matematik kazanım kodları MEB 2024 İlkokul Matematik Dersi
          Öğretim Programı'ndan referans alınmıştır. Ders kitabı görselleri
          kullanılmamıştır.
        </p>
      </section>

      {/* Para görselleri notu */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Para Görselleri</h2>
        <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#333' }}>
          Türk Lirası banknot görselleri TCMB koruması altındadır.
          Uygulamada gerçek banknot görselleri kullanılmaz — stilize temsil
          çizilir (doğru renk ve rakam, gerçekçi değil).
        </p>
      </section>

      {/* Geri butonu */}
      <button
        onClick={() => ekranGit('veliPaneli')}
        style={{
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          background: '#4a90d9',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer',
        }}
      >
        ← Geri
      </button>
    </div>
  );
}
