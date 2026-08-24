/*
 * VELİ PANELİ EKRANI — plan §11 [9].
 *
 * Geliştirme sürümünde öğrenci veya veli verisi saklanmaz. Yetişkin ayarları
 * yalnız açık sayfa süresince bellek durumunda kalır ve yenilemede sıfırlanır.
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
      <header style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <BigButton label="Geri" size="control" variant="ghost" onPress={() => ekranGit('anaEkran')}>
          ←
        </BigButton>
        <h2 style={{ fontSize: 'var(--text-adult)', color: COLOR.ink, margin: 0 }}>
          Veli Paneli
        </h2>
      </header>

      <Bolum baslik="1. Veri Saklama Durumu">
        <p style={bilgiMetniStili}>{VERI_SAKLAMA_BILDIRIMI}</p>
        <p style={{ ...bilgiMetniStili, marginTop: 10 }}>
          Önceki geliştirme sürümlerinden kalmış yerel profil, ilerleme, oturum ve yanıt kayıtları uygulama açıldığında silinir. Dışa ve içe aktarma bu sürümde kapalıdır.
        </p>
      </Bolum>

      <Bolum baslik="2. Geçici Ayarlar">
        <p style={{ ...bilgiMetniStili, marginBottom: 12 }}>
          Bu ayarlar yalnız bu sayfa açıkken kullanılır; tarayıcı yenilendiğinde varsayılan değerlere döner.
        </p>
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
          <span style={bilgiMetniStili}>{sesHizi.toFixed(1)}×</span>
        </AyarSatir>
      </Bolum>

      <Bolum baslik="3. Açık Konular">
        <TemaIlerleme okulAyiIndex={okulAyiIndex} />
      </Bolum>

      <Bolum baslik="4. Kaynaklar ve Gizlilik">
        <p style={bilgiMetniStili}>
          Müfredat kaynağı: MEB 2024 Türkiye Yüzyılı Maarif Modeli, İlkokul Matematik Dersi Öğretim Programı.
        </p>
        <p style={{ ...bilgiMetniStili, margin: '8px 0 12px' }}>
          Ses klipleri: Piper TTS. Banknot görselleri: TCMB örnek banknotları. Uygulama bu geliştirme sürümünde öğrenci veya veli verisi toplamaz ya da saklamaz.
        </p>
        <button
          type="button"
          onClick={() => useAppStore.getState().ekranGit('kaynaklar')}
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
              {acik ? 'Açık' : 'Kilitli'}
            </span>
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
