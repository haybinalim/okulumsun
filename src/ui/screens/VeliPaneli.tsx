/**
 * VELİ PANELİ EKRANI — plan §11 [9].
 *
 * İlk sürüm, bu kadarı ZORUNLU, fazlası değil:
 *
 * 1. Tema bazında ilerleme: 7 tema satırı × düğüm durumu (tohum/filiz/çiçek/meyve
 *    sayıları). Yüzde ve puan YOK.
 * 2. "Zorlandığı konular": struggling durumundaki düğümlerin childLabel listesi.
 * 3. Ayarlar: readingLevel · okul ayı · cihaz profili geçersiz kılma · ses hızı.
 * 4. Yedekleme: dışa/içe aktar (Adım 9) + kalıcılık uyarı rozeti.
 * 5. "Kaynaklar" ekranı bağlantısı (§8 lisanslar).
 *
 * Yalnız metin — yetişkin ekranı. Sesli talimat yok.
 */

import { useAppStore } from '../../store/appStore';
import { BigButton } from '../primitives/BigButton';
import { OKUL_AYLARI, acilanTemalar } from '../../content/okulAyi';
import { COLOR } from '../../design/tokens';
import type { ReadingLevel } from '../../store/appStore';

export function VeliPaneli() {
  const {
    readingLevel,
    readingLevelAyarla,
    okulAyiIndex,
    okulAyiAyarla,
    sesHizi,
    sesHiziAyarla,
    ekranGit,
  } = useAppStore();

  const handleGeri = () => {
    ekranGit('anaEkran');
  };

  return (
    <main
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: COLOR.bg,
        padding: 'var(--size-edge)',
        paddingBottom: 'var(--size-edge-bottom)',
        gap: 16,
        overflow: 'auto',
      }}
    >
      {/* Geri */}
      <header style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <BigButton label="Geri" size="control" variant="ghost" onPress={handleGeri}>
          ←
        </BigButton>
        <h2 style={{ fontSize: 'var(--text-adult)', color: COLOR.ink, margin: 0 }}>
          Veli Paneli
        </h2>
      </header>

      {/* 1. Tema bazında ilerleme */}
      <Bolum baslik="1. İlerleme">
        <TemaIlerleme okulAyiIndex={okulAyiIndex} />
      </Bolum>

      {/* 2. Zorlandığı konular */}
      <Bolum baslik="2. Zorlandığı Konular">
        <p style={{ fontSize: 'var(--text-adult)', color: COLOR.inkSoft, margin: 0 }}>
          Henüz veri yok — çocuk alıştırma çözmeye başladığında burada
          zorlandığı konular listelenecek.
        </p>
      </Bolum>

      {/* 3. Ayarlar */}
      <Bolum baslik="3. Ayarlar">
        <AyarSatir etiket="Okuma seviyesi">
          <select
            value={readingLevel}
            onChange={(e) => readingLevelAyarla(Number(e.target.value) as ReadingLevel)}
            style={selectStyle}
          >
            <option value={0}>0 — Okumaya başlamadı</option>
            <option value={1}>1 — Harf tanıyor</option>
            <option value={2}>2 — Hece okuyor</option>
            <option value={3}>3 — Kelime okuyor</option>
          </select>
        </AyarSatir>

        <AyarSatir etiket="Okul ayı">
          <select
            value={okulAyiIndex}
            onChange={(e) => okulAyiAyarla(Number(e.target.value))}
            style={selectStyle}
          >
            {OKUL_AYLARI.map((ay, i) => (
              <option key={ay} value={i}>
                {ay} — {acilanTemalar(i).length} tema açık
              </option>
            ))}
          </select>
        </AyarSatir>

        <AyarSatir etiket="Ses hızı">
          <input
            type="range"
            min={0.5}
            max={1.5}
            step={0.1}
            value={sesHizi}
            onChange={(e) => sesHiziAyarla(Number(e.target.value))}
            style={{ width: 200 }}
          />
          <span style={{ fontSize: 'var(--text-adult)', color: COLOR.inkSoft }}>
            {sesHizi.toFixed(1)}×
          </span>
        </AyarSatir>
      </Bolum>

      {/* 4. Yedekleme */}
      <Bolum baslik="4. Yedekleme">
        <p style={{ fontSize: 'var(--text-adult)', color: COLOR.inkSoft, margin: 0 }}>
          Yedekleme özelliği yakında eklenecek (Adım 9).
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button style={buttonStyle} disabled>Dışa Aktar</button>
          <button style={buttonStyle} disabled>İçe Aktar</button>
        </div>
      </Bolum>

      {/* 5. Kaynaklar */}
      <Bolum baslik="5. Kaynaklar">
        <p style={{ fontSize: 'var(--text-adult)', color: COLOR.inkSoft, margin: 0 }}>
          Müfredat kaynağı: MEB 2024 Türkiye Yüzyılı Maarif Modeli, İlkokul
          Matematik Dersi Öğretim Programı.
        </p>
        <p style={{ fontSize: 'var(--text-adult)', color: COLOR.inkSoft, margin: '8px 0 0' }}>
          Ses klipleri: macOS `say` (geliştirme) / Piper TTS (üretim).
          Görseller: programatik SVG + Noto Color Emoji (SIL OFL).
          Bu uygulama hiçbir veriyi sunucuya göndermez; tüm veri cihazda kalır.
        </p>
      </Bolum>
    </main>
  );
}

// ----------------------------------------------------- yardımcı bileşenler

function Bolum({ baslik, children }: { baslik: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        flex: '0 0 auto',
        background: COLOR.surface,
        borderRadius: 12,
        padding: 16,
        border: `1px solid ${COLOR.border}`,
      }}
    >
      <h3 style={{ fontSize: 'var(--text-adult)', color: COLOR.ink, margin: '0 0 12px' }}>
        {baslik}
      </h3>
      {children}
    </section>
  );
}

function AyarSatir({ etiket, children }: { etiket: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
      <span style={{ fontSize: 'var(--text-adult)', color: COLOR.ink, minWidth: 120 }}>
        {etiket}
      </span>
      {children}
    </div>
  );
}

function TemaIlerleme({ okulAyiIndex }: { okulAyiIndex: number }) {
  const acikTemalar = acilanTemalar(okulAyiIndex);
  // 7 tema satırı
  const temalar = [
    'Yön ve Yerler',
    'Sayılar',
    'Ölçme',
    'Toplama ve Çıkarma',
    'Paralarımız',
    'Şekiller',
    'Sayalım ve Gösterelim',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {temalar.map((ad, i) => {
        const temaNo = i + 1;
        const acik = acikTemalar.includes(temaNo);
        return (
          <div
            key={temaNo}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '4px 0',
              fontSize: 'var(--text-adult)',
              color: acik ? COLOR.ink : COLOR.inkSoft,
            }}
          >
            <span>{ad}</span>
            <span style={{ opacity: acik ? 1 : 0.4 }}>
              {acik ? '🟢 açık' : '🔒 kilitli'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ----------------------------------------------------- stiller

const selectStyle: React.CSSProperties = {
  fontSize: 'var(--text-adult)',
  padding: '4px 8px',
  borderRadius: 6,
  border: `1px solid ${COLOR.border}`,
  background: COLOR.surface,
  color: COLOR.ink,
  fontFamily: 'inherit',
};

const buttonStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  border: `1px solid ${COLOR.border}`,
  background: COLOR.surface,
  color: COLOR.inkSoft,
  fontFamily: 'inherit',
  fontSize: 'var(--text-adult)',
  cursor: 'not-allowed',
  opacity: 0.5,
};
