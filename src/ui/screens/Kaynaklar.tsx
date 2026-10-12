/**
 * Kaynaklar ekranı — plan §8 lisanslar + §14 adım 11 gizlilik beyanı.
 *
 * İçerik:
 *   - Gizlilik beyanı (KVKK — tek paragraf)
 *   - Uygulama lisansı (ADR-0013)
 *   - Üçüncü taraf lisansları (src/content/ucuncuTarafVarliklar.ts'ten)
 *   - TTS sağlayıcı bilgisi
 *
 * Çocuk bu ekrana veli kapısından ulaşır — çocuk arayüzünde değil.
 */

import { UCUNCU_TARAF_VARLIKLAR } from '../../content/ucuncuTarafVarliklar';
import { useAppStore } from '../../store/appStore';

/** Kullanıcıya dağıtılan varlıklar; geliştirme araçları LICENSES.md'de listelenir. */
const DAGITILAN = UCUNCU_TARAF_VARLIKLAR.filter((v) => v.dagitimdaVar);

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
          Bu geliştirme sürümü ad-soyad, fotoğraf, konum, hesap bilgisi,
          öğrenci ilerlemesi veya veli bilgisi İSTEMEZ ve SAKLAMAZ. Önceki
          geliştirme sürümlerinden kalmış yerel öğrenci/veli kayıtları uygulama
          açıldığında silinir. İnternet bağlantısı gerekmez — ilk yüklemeden
          sonra çevrimdışı çalışır.
        </p>
      </section>

      {/* Uygulama lisansı (ADR-0013) */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Uygulama Lisansı</h2>
        <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
          © 2026 Okulumsun. Tüm hakları saklıdır. Okul veya kurum kullanımı için yazılı izin gerekir.
        </p>
      </section>

      {/* Üçüncü taraf lisansları — envanterden çizilir (Adım 21, K10). Dış bağlantı yok. */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Üçüncü Taraf Lisansları</h2>
        <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.9rem', lineHeight: 1.8 }}>
          {DAGITILAN.map((v) => (
            <li key={v.ad}>
              <strong>{v.ad}</strong> — {v.lisans} · {v.sahip}
              {v.kosul ? ` · ${v.kosul}` : ''}
            </li>
          ))}
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
          Türk Lirası banknot görselleri, TCMB'nin kamuya açık örnek banknot
          görsellerinden türetilmiştir. Uygulama yalnız 5, 10, 20, 50, 100 ve
          200 TL kupürleri için bu resmî örnek görselleri kullanır.
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
