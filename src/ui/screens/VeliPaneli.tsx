/*
 * VELİ PANELİ EKRANI — bu sürüm öğrenci veya veli verisi saklamaz.
 * Ayarlar yalnız açık uygulama oturumunda bellekte kalır; yenilemede sıfırlanır.
 */

import { useAppStore } from '../../store/appStore';
import { BigButton } from '../primitives/BigButton';
import { OKUL_AYLARI, acilanTemalar } from '../../content/okulAyi';
import { COLOR } from '../../design/tokens';
import type { ReadingLevel } from '../../store/appStore';
import { VERI_SAKLAMA_BILDIRIMI } from '../../persistence/veriSaklamaPolitikasi';

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

  return (
    <main
      aria-labelledby="veli-paneli-baslik"
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
      <header style={{ flex: '0 0 auto', display: 'flex', gap: 12, alignItems: 'center' }}>
        <BigButton label="Çocuk ekranına dön" size="control" variant="ghost" onPress={() => ekranGit('anaEkran')}>
          ←
        </BigButton>
        <div>
          <h1 id="veli-paneli-baslik" style={{ fontSize: 'var(--text-adult)', color: COLOR.ink, margin: 0 }}>
            Yetişkin alanı
          </h1>
          <p style={{ ...bilgiMetniStili, marginTop: 2 }}>Ayarlar bu açık uygulama oturumu içindir.</p>
        </div>
      </header>

      <Bolum baslik="Bu sürümde kayıt tutulmaz">
        <div role="status" aria-live="polite" style={mahremiyetKutusuStili}>
          <strong style={{ color: COLOR.ink }}>Henüz öğrenci geçmişi gösterilmiyor.</strong>
          <p style={{ ...bilgiMetniStili, marginTop: 8 }}>{VERI_SAKLAMA_BILDIRIMI}</p>
          <p style={{ ...bilgiMetniStili, marginTop: 8 }}>
            Çocuk profili, yanıtlar, ilerleme özeti ve oturum geçmişi bu cihazda ya da çevrim içi ortamda tutulmaz.
            Uygulama açılırken önceki geliştirme kayıtları temizlenir.
          </p>
        </div>
      </Bolum>

      <Bolum baslik="Geçici ayarlar">
        <p style={{ ...bilgiMetniStili, marginBottom: 12 }}>
          Bu değişiklikler yalnız uygulama açıkken etkilidir; tarayıcı yenilendiğinde varsayılan değerlere döner.
        </p>
        <AyarSatir etiket="Okuma seviyesi" htmlFor="okuma-seviyesi">
          <select
            id="okuma-seviyesi"
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

        <AyarSatir etiket="Okul ayı" htmlFor="okul-ayi">
          <select
            id="okul-ayi"
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

        <AyarSatir etiket="Ses hızı" htmlFor="ses-hizi">
          <input
            id="ses-hizi"
            type="range"
            min={0.5}
            max={1.5}
            step={0.1}
            value={sesHizi}
            onChange={(e) => sesHiziAyarla(Number(e.target.value))}
            style={{ width: 200 }}
          />
          <span style={bilgiMetniStili}>{sesHizi.toFixed(1)}×</span>
        </AyarSatir>
      </Bolum>

      <Bolum baslik="Bu ay açık konular">
        <p style={{ ...bilgiMetniStili, marginBottom: 12 }}>
          Aşağıdaki liste kişiye özel ilerleme değildir; seçili okul ayına göre uygulamada kullanılabilen konuları gösterir.
        </p>
        <TemaDurumu okulAyiIndex={okulAyiIndex} />
      </Bolum>

      <Bolum baslik="Gizlilik ve kaynaklar">
        <p style={bilgiMetniStili}>
          Müfredat kaynağı: MEB 2024 Türkiye Yüzyılı Maarif Modeli, İlkokul Matematik Dersi Öğretim Programı.
        </p>
        <p style={{ ...bilgiMetniStili, margin: '8px 0 12px' }}>
          Ses klipleri Piper TTS ile önceden üretilir; banknot görselleri TCMB örnek banknotlarıdır. Uygulama öğrenci veya veli verisi toplamaz ya da saklamaz.
        </p>
        <button
          type="button"
          onClick={() => ekranGit('kaynaklar')}
          style={aktifButtonStyle}
        >
          Lisanslar ve gizlilik →
        </button>
      </Bolum>
    </main>
  );
}

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
      <h2 style={{ fontSize: 'var(--text-adult)', color: COLOR.ink, margin: '0 0 12px' }}>
        {baslik}
      </h2>
      {children}
    </section>
  );
}

function AyarSatir({
  etiket,
  htmlFor,
  children,
}: {
  etiket: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
      <label htmlFor={htmlFor} style={{ fontSize: 'var(--text-adult)', color: COLOR.ink, minWidth: 120 }}>
        {etiket}
      </label>
      {children}
    </div>
  );
}

function TemaDurumu({ okulAyiIndex }: { okulAyiIndex: number }) {
  const acikTemalar = acilanTemalar(okulAyiIndex);
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
            <span style={{ opacity: acik ? 1 : 0.7 }}>{acik ? 'Açık' : 'Henüz açık değil'}</span>
          </div>
        );
      })}
    </div>
  );
}

const bilgiMetniStili: React.CSSProperties = {
  fontSize: 'var(--text-adult)',
  color: COLOR.inkSoft,
  margin: 0,
};

const mahremiyetKutusuStili: React.CSSProperties = {
  padding: 12,
  borderRadius: 8,
  background: '#f3ede3',
  border: `1px solid ${COLOR.border}`,
};

const selectStyle: React.CSSProperties = {
  fontSize: 'var(--text-adult)',
  padding: '4px 8px',
  borderRadius: 6,
  border: `1px solid ${COLOR.border}`,
  background: COLOR.surface,
  color: COLOR.ink,
  fontFamily: 'inherit',
};

const aktifButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  border: `1px solid ${COLOR.border}`,
  background: COLOR.surface,
  color: COLOR.ink,
  fontFamily: 'inherit',
  fontSize: 'var(--text-adult)',
  cursor: 'pointer',
};
