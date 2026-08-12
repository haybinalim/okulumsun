/*
 * VELİ PANELİ EKRANI — plan §11 [9].
 *
 * İlk sürümde yetişkine yalnızca anlamlı, yerel veriye dayalı kontroller sunar.
 * Çocuğun ekranlarından ayrıdır; sesli talimat kullanılmaz.
 */

import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { BigButton } from '../primitives/BigButton';
import { OKUL_AYLARI, acilanTemalar } from '../../content/okulAyi';
import { COLOR } from '../../design/tokens';
import type { ReadingLevel } from '../../store/appStore';
import { yedekCozumle, yedekIndir, yedeIceAktar } from '../../persistence/backup';
import { depolamaTahmini, persistDurumu, persistIste, type DepolamaTahmini } from '../../persistence/persist';

type KalicilikDurumu = boolean | null | undefined;

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
  const dosyaGirdisi = useRef<HTMLInputElement>(null);
  const [kaliciMi, setKaliciMi] = useState<KalicilikDurumu>(undefined);
  const [depolama, setDepolama] = useState<DepolamaTahmini | null>(null);
  const [yedekDurumu, setYedekDurumu] = useState<string | null>(null);
  const [islemDevamEdiyor, setIslemDevamEdiyor] = useState(false);

  const depolamaBilgisiniYenile = async () => {
    const [kalici, tahmin] = await Promise.all([persistDurumu(), depolamaTahmini()]);
    setKaliciMi(kalici);
    setDepolama(tahmin);
  };

  useEffect(() => {
    void depolamaBilgisiniYenile();
  }, []);

  const handleGeri = () => {
    ekranGit('anaEkran');
  };

  const kalicilikIste = async () => {
    setIslemDevamEdiyor(true);
    const sonuc = await persistIste();
    setKaliciMi(sonuc);
    setYedekDurumu(
      sonuc === true
        ? 'Kalıcı depolama izni verildi.'
        : sonuc === false
          ? 'Tarayıcı kalıcı depolama iznini vermedi. Düzenli yedek almanız önerilir.'
          : 'Bu tarayıcı kalıcı depolama isteğini desteklemiyor.',
    );
    await depolamaBilgisiniYenile();
    setIslemDevamEdiyor(false);
  };

  const disaAktar = async () => {
    setIslemDevamEdiyor(true);
    try {
      await yedekIndir('0.1.0');
      setYedekDurumu('Yedek dosyası indirildi. Bu dosyayı güvenli bir yerde saklayın.');
    } catch (error) {
      setYedekDurumu(`Yedek oluşturulamadı: ${(error as Error).message}`);
    } finally {
      setIslemDevamEdiyor(false);
    }
  };

  const dosyaSecildi = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const dosya = event.target.files?.[0];
    // Aynı dosyanın art arda seçilebilmesi için kontrolü temizle.
    event.target.value = '';
    if (!dosya) return;

    setIslemDevamEdiyor(true);
    try {
      const yedek = yedekCozumle(await dosya.text());
      if (!yedek) {
        setYedekDurumu('Dosya okulumsun yedek biçiminde değil. Hiçbir veri değiştirilmedi.');
        return;
      }
      const onay = window.confirm(
        'İçe aktarma mevcut yerel verileri tamamen değiştirir. Devam etmek istiyor musunuz?',
      );
      if (!onay) {
        setYedekDurumu('İçe aktarma iptal edildi.');
        return;
      }

      const sonuc = await yedeIceAktar(yedek);
      setYedekDurumu(
        sonuc.ok
          ? `${sonuc.kayitSayisi} kayıt içe aktarıldı. Güncel verileri görmek için sayfa yenileniyor.`
          : `Yedek kabul edilmedi: ${iceAktarimHatasiMetni(sonuc.sebep)}`,
      );
      if (sonuc.ok) {
        window.setTimeout(() => window.location.reload(), 900);
      }
    } catch (error) {
      setYedekDurumu(`Yedek okunamadı: ${(error as Error).message}`);
    } finally {
      setIslemDevamEdiyor(false);
    }
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
      <header style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <BigButton label="Geri" size="control" variant="ghost" onPress={handleGeri}>
          ←
        </BigButton>
        <h2 style={{ fontSize: 'var(--text-adult)', color: COLOR.ink, margin: 0 }}>
          Veli Paneli
        </h2>
      </header>

      <Bolum baslik="1. İlerleme">
        <TemaIlerleme okulAyiIndex={okulAyiIndex} />
      </Bolum>

      <Bolum baslik="2. Zorlandığı Konular">
        <p style={{ fontSize: 'var(--text-adult)', color: COLOR.inkSoft, margin: 0 }}>
          Çocuk alıştırma çözdükçe zorlandığı konular burada yer alır.
        </p>
      </Bolum>

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

      <Bolum baslik="4. Yedekleme ve cihaz depolaması">
        <p style={{ fontSize: 'var(--text-adult)', color: COLOR.inkSoft, margin: 0 }}>
          {kalicilikMetni(kaliciMi)}
          {depolama ? ` Kullanım: ${baytBiçimle(depolama.kullanim)} / ${baytBiçimle(depolama.kota)}.` : ''}
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
          <button type="button" style={aktifButtonStyle} onClick={() => void disaAktar()} disabled={islemDevamEdiyor}>
            Dışa Aktar
          </button>
          <button type="button" style={aktifButtonStyle} onClick={() => dosyaGirdisi.current?.click()} disabled={islemDevamEdiyor}>
            İçe Aktar
          </button>
          {kaliciMi !== true && (
            <button type="button" style={aktifButtonStyle} onClick={() => void kalicilikIste()} disabled={islemDevamEdiyor}>
              Kalıcı Depolama İste
            </button>
          )}
          <input
            ref={dosyaGirdisi}
            type="file"
            accept="application/json,.json"
            onChange={(event) => void dosyaSecildi(event)}
            aria-label="Yedek dosyası seç"
            style={{ display: 'none' }}
          />
        </div>
        {yedekDurumu && (
          <p role="status" style={{ fontSize: 'var(--text-adult)', color: COLOR.ink, margin: '12px 0 0' }}>
            {yedekDurumu}
          </p>
        )}
      </Bolum>

      <Bolum baslik="5. Kaynaklar">
        <p style={{ fontSize: 'var(--text-adult)', color: COLOR.inkSoft, margin: 0 }}>
          Müfredat kaynağı: MEB 2024 Türkiye Yüzyılı Maarif Modeli, İlkokul Matematik Dersi Öğretim Programı.
        </p>
        <p style={{ fontSize: 'var(--text-adult)', color: COLOR.inkSoft, margin: '8px 0 12px' }}>
          Ses klipleri: Piper TTS. Görseller: programatik SVG + Noto Color Emoji (SIL OFL).
          Bu uygulama hiçbir veriyi sunucuya göndermez; tüm veri cihazda kalır.
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

function iceAktarimHatasiMetni(hata: string): string {
  const metinler: Record<string, string> = {
    'gecersiz-format': 'geçersiz dosya biçimi',
    'format-eslesmiyor': 'başka bir uygulamanın yedeği',
    'db-surumu-buyuk': 'bu uygulama sürümünden daha yeni bir veri şeması',
    'veri-eksik': 'zorunlu veri bölümleri eksik',
  };
  return metinler[hata] ?? hata;
}

function kalicilikMetni(durum: KalicilikDurumu): string {
  if (durum === undefined) return 'Cihaz depolaması denetleniyor…';
  if (durum === true) return 'Bu tarayıcı uygulama verisini kalıcı tutmaya çalışır.';
  if (durum === false) return 'Tarayıcı veriyi temizleyebilir; düzenli yedek almanız önerilir.';
  return 'Bu tarayıcı kalıcı depolama durumunu bildirmiyor; düzenli yedek almanız önerilir.';
}

function baytBiçimle(bayt: number): string {
  if (bayt < 1024) return `${bayt} B`;
  if (bayt < 1024 ** 2) return `${(bayt / 1024).toFixed(1)} KB`;
  return `${(bayt / 1024 ** 2).toFixed(1)} MB`;
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
