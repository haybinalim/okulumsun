/*
 * VELİ PANELİ EKRANI — bu sürüm öğrenci veya veli verisi saklamaz.
 * Ayarlar yalnız açık uygulama oturumunda bellekte kalır; yenilemede sıfırlanır.
 */

import { gomuluDurum } from '../../platform/gomuluAcilis';
import { useAppStore, TEMALAR } from '../../store/appStore';
import { BigButton } from '../primitives/BigButton';
import { OKUL_AYLARI, acilanTemalar } from '../../content/okulAyi';
import { COLOR } from '../../design/tokens';
import type { ReadingLevel } from '../../store/appStore';
import { VERI_SAKLAMA_BILDIRIMI } from '../../persistence/veriSaklamaPolitikasi';
import { SURUM_METNI } from '../../hata/surum';
import { useCihazProfili } from '../../design/CihazProfiliBaglami';
import type { DeviceProfile } from '../../design/tokens';
import { EKRAN_BOYUTU_SECENEKLERI } from '../../design/ekranBoyutu';
import { useState, useSyncExternalStore } from 'react';
import { hash32 } from '../../exercises/rng';
import { yerelGun } from '../../platform/dosyaIndir';
import { dersteTamEkranMi, dersteTamEkranAyarla, dersAyariniDinle } from '../../platform/dersAyari';
import { tamEkranIste, tamEkrandanCik } from '../../platform/tamEkran';
import { varsayilandanFarkliMi, type KapsayicilikAyarlari } from '../../design/kapsayicilik';
import { ayarHash } from '../../ogretmen/ayarKodu';


const PROFIL_ADI: Record<DeviceProfile, string> = { board: 'akıllı tahta', tablet: 'tablet', phone: 'telefon' };

export function VeliPaneli() {
  const {
    readingLevel,
    readingLevelAyarla,
    okulAyiIndex,
    okulAyiAyarla,
    sesHizi,
    sesHiziAyarla,
    ekranGit,
    mod,
  } = useAppStore();
  const tahta = mod === 'tahta';

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
            {tahta ? 'Öğretmen alanı' : 'Yetişkin alanı'}
          </h1>
          <p style={{ ...bilgiMetniStili, marginTop: 2 }}>Ayarlar bu açık uygulama oturumu içindir.</p>
        </div>
      </header>

      {tahta && (
        <Bolum baslik="Bugünün seti">
          <p style={{ ...bilgiMetniStili, marginTop: 0 }}>
            En çok 4 etkinlik seçin; tahta bunları sırayla karıştırarak sorar. Set bu açık oturumda kalır.
          </p>
          <BigButton label="Bugünün setini hazırla" size="control" variant="accent" onPress={() => ekranGit('setHazirla')} style={{ padding: '0 24px', fontSize: 'var(--text-adult)' }}>
            Bugünün setini hazırla
          </BigButton>
        </Bolum>
      )}

      {!tahta && (
        <Bolum baslik="Çalışma kâğıdı">
          <p style={{ ...bilgiMetniStili, marginTop: 0 }}>
            En çok 4 etkinlik seçin; bunlardan A4 çalışma kâğıdı ve cevap anahtarı hazırlanır. Hiçbir şey kaydedilmez.
          </p>
          <BigButton label="Çalışma kâğıdı hazırla" size="control" variant="accent" onPress={() => ekranGit('setHazirla')} style={{ padding: '0 24px', fontSize: 'var(--text-adult)' }}>
            Çalışma kâğıdı hazırla
          </BigButton>
        </Bolum>
      )}

      {!tahta && <EvdeOnDakikaBolumu />}

      {!tahta && <TemaTuruBolumu okulAyiIndex={okulAyiIndex} />}

      <Bolum baslik="Haftalık plan">
        <p style={{ ...bilgiMetniStili, marginTop: 0 }}>
          MEB çalışma takvimi ve ders saatlerinden: bu hafta hangi kazanım, hangi etkinlik. Okulunuzun yıllık planı
          farklıysa kendi planınızı esas alın.
        </p>
        <BigButton label="Haftalık planı aç" size="control" variant="accent" onPress={() => ekranGit('haftalikPlan')} style={{ padding: '0 24px', fontSize: 'var(--text-adult)' }}>
          Haftalık planı aç
        </BigButton>
      </Bolum>

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

      <EkranBoyutuAyari />

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

      {!tahta && <IsinmaBolumu />}

      <KapsayicilikBolumu tahta={tahta} />

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

      {/* Gömülü modda tam ekran yalnız iframe izin veriyorsa (Adım 56). */}
      {gomuluDurum().kisitlar.tamEkran && <TamEkranAyari />}

      <Bolum baslik="Sorun bildir">
        <p style={{ ...bilgiMetniStili, marginBottom: 12 }}>
          Uygulama bu oturumda takıldıysa hata özetini görüp kopyalayabilirsiniz. Bilgiler cihazdan çıkmaz.
        </p>
        <button type="button" onClick={() => ekranGit('sorunBildir')} style={aktifButtonStyle}>
          Sorun bildir →
        </button>
      </Bolum>

      <footer style={{ ...bilgiMetniStili, textAlign: 'center' }}>{SURUM_METNI}</footer>
    </main>
  );
}

/**
 * Evde 10 dakika (plan v2 Adım 43, KG-62): bu haftanın MEB konusundan kısa oturum, sonunda veliye
 * 3 cümlelik ipucu kartı. Plan verisi düğmeye basınca tembel yüklenir; hiçbir şey saklanmaz.
 */
function EvdeOnDakikaBolumu() {
  const baslat = useAppStore((s) => s.evdeOnDakikaBaslat);
  const [bildirim, setBildirim] = useState('');
  const [bekliyor, setBekliyor] = useState(false);
  const tikla = async () => {
    setBekliyor(true);
    try {
      const { buHaftaninEvdeOnDakikasi } = await import('../../ogretmen/evdeOnDakikaBaglama');
      // "Bugün" ve tohum UI katmanında (saf modül saat/rastgelelik okumaz; Math.random yasak).
      const bugun = yerelGun(new Date());
      const sonuc = buHaftaninEvdeOnDakikasi(bugun, hash32(String(performance.now()) + bugun));
      if (sonuc) baslat(sonuc.set, sonuc.tema);
      else setBildirim('Bu hafta okul takviminde ders haftası değil; okul açılınca yeniden deneyin.');
    } finally {
      setBekliyor(false);
    }
  };
  return (
    <Bolum baslik="Evde 10 dakika">
      <p style={{ ...bilgiMetniStili, marginTop: 0 }}>
        Bu haftanın okul konusundan 8 kısa soru; sonunda size çocuğunuzla konuşmak için 3 cümlelik bir ipucu. Hiçbir
        şey kaydedilmez.
      </p>
      <BigButton
        label="Evde 10 dakika başlat"
        size="control"
        variant="accent"
        onPress={() => void tikla()}
        disabled={bekliyor}
        style={{ padding: '0 24px', fontSize: 'var(--text-adult)' }}
      >
        Evde 10 dakika başlat
      </BigButton>
      {bildirim && (
        <p role="status" style={{ ...bilgiMetniStili, marginTop: 8 }}>
          {bildirim}
        </p>
      )}
    </Bolum>
  );
}

/**
 * Tema turu (plan v2 Adım 46, KG-67): açık bir temanın becerilerini dolaşan 8–10 soru; sonunda size
 * beceri başına nitel düzey. Plan bellekte, sonuçlar tur kapanınca silinir.
 */
function TemaTuruBolumu({ okulAyiIndex }: { okulAyiIndex: number }) {
  const baslat = useAppStore((s) => s.temaTuruBaslat);
  const acik = acilanTemalar(okulAyiIndex);
  const [tema, setTema] = useState<number>(acik.at(-1) ?? 1);
  const [bildirim, setBildirim] = useState('');
  const tikla = async () => {
    const { temaTuruHazirla } = await import('../../ogretmen/temaTuruBaglama');
    const plan = temaTuruHazirla(tema, hash32(`${performance.now()}:tur:${tema}`));
    if (plan) baslat(tema, plan);
    else setBildirim('Bu temada henüz hazır etkinlik yok.');
  };
  return (
    <Bolum baslik="Tema turu">
      <p style={{ ...bilgiMetniStili, marginTop: 0 }}>
        Bir temanın bütün becerilerinden 8–10 kısa soru; sonunda size beceri başına kısa bir gözlem. Not ya da
        puan yok, hiçbir şey kaydedilmez.
      </p>
      <AyarSatir etiket="Tema" htmlFor="tema-turu-tema">
        <select id="tema-turu-tema" value={tema} onChange={(e) => setTema(Number(e.target.value))} style={selectStyle}>
          {TEMALAR.filter((t) => acik.includes(t.no)).map((t) => (
            <option key={t.no} value={t.no}>
              {t.ad}
            </option>
          ))}
        </select>
      </AyarSatir>
      <BigButton
        label="Tema turu başlat"
        size="control"
        variant="accent"
        onPress={() => void tikla()}
        style={{ padding: '0 24px', fontSize: 'var(--text-adult)', marginTop: 8 }}
      >
        Tema turu başlat
      </BigButton>
      {bildirim && (
        <p role="status" style={{ ...bilgiMetniStili, marginTop: 8 }}>
          {bildirim}
        </p>
      )}
    </Bolum>
  );
}

/**
 * Cihaz profili elle geçersiz kılma (PLAN §3.1 "zorunlu"). Cihaz özelliğidir, öğrenci
 * verisi değil: iki modda aynı, yenilemede kalıcı (tek izinli localStorage anahtarı).
 */
function EkranBoyutuAyari() {
  const { profil, elleSecilen, sec } = useCihazProfili();
  return (
    <Bolum baslik="Ekran boyutu">
      <p id="cihaz-profili-aciklama" style={{ ...bilgiMetniStili, marginBottom: 12 }}>
        Tahtada düğmeler küçük görünüyorsa &apos;Akıllı tahta&apos;yı seçin. Bu tercih bu cihazda kalır; öğrenci bilgisi
        değildir.
      </p>
      <div
        id="cihaz-profili"
        role="group"
        aria-label="Ekran boyutu"
        aria-describedby="cihaz-profili-aciklama"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}
      >
        {EKRAN_BOYUTU_SECENEKLERI.map((s) => {
          const secili = elleSecilen === s.deger;
          return (
            <BigButton
              key={s.etiket}
              label={s.etiket}
              size="control"
              variant={secili ? 'accent' : 'ghost'}
              ariaPressed={secili}
              onPress={() => sec(s.deger)}
              style={{ minHeight: 'max(64px, var(--size-control))', padding: '0 16px', fontSize: 'var(--text-adult)' }}
            >
              {s.etiket}
            </BigButton>
          );
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div
          data-testid="cihaz-profili-onizleme"
          aria-hidden="true"
          style={{
            width: 'var(--size-choice)',
            height: 'var(--size-choice)',
            borderRadius: 16,
            border: `3px solid ${COLOR.border}`,
            background: COLOR.surface,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--text-choice-label)',
            fontWeight: 700,
            color: COLOR.ink,
          }}
        >
          7
        </div>
        <p role="status" style={bilgiMetniStili}>
          Şu an: {PROFIL_ADI[profil]}
          {elleSecilen === null ? ' (otomatik)' : ' (elle seçildi)'}. Örnek seçenek kartı gerçek boyuttadır.
        </p>
      </div>
    </Bolum>
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

/** "Derste tam ekran": tahtada varsayılan açık, diğerlerinde kapalı; yalnız bellekte. */
function TamEkranAyari() {
  const { profil } = useCihazProfili();
  const acik = useSyncExternalStore(dersAyariniDinle, () => dersteTamEkranMi(profil));
  return (
    <Bolum baslik="Derste tam ekran">
      <p style={{ ...bilgiMetniStili, marginBottom: 12 }}>
        Açıkken uygulama ilk dokunuşta tam ekrana geçer. Bu tercih yalnız bu açılışta geçerlidir.
      </p>
      <BigButton
        label={acik ? 'Derste tam ekran: açık' : 'Derste tam ekran: kapalı'}
        size="control"
        variant={acik ? 'accent' : 'ghost'}
        ariaPressed={acik}
        onPress={() => {
          dersteTamEkranAyarla(!acik);
          if (acik) void tamEkrandanCik();
          else void tamEkranIste();
        }}
        style={{ minHeight: 'max(64px, var(--size-control))', padding: '0 16px', fontSize: 'var(--text-adult)' }}
      >
        {acik ? 'Açık' : 'Kapalı'}
      </BigButton>
    </Bolum>
  );
}

/** Kapsayıcılık ayarı satırları (Adım 55): etiket + kısa açıklama + açık/kapalı. */
const KAPSAYICILIK_SATIRLARI: readonly {
  readonly ad: string;
  readonly aciklama: string;
  readonly acikMi: (a: KapsayicilikAyarlari) => boolean;
  readonly degistir: (acik: boolean) => Partial<KapsayicilikAyarlari>;
}[] = [
  {
    ad: 'Yavaş tempo',
    aciklama: 'Sesler biraz daha yavaş çalar.',
    acikMi: (a) => a.tempo === 'yavas',
    degistir: (acik) => ({ tempo: acik ? 'yavas' : 'normal' }),
  },
  {
    ad: 'Talimat tekrarı',
    aciklama: '8 saniye dokunulmazsa soru bir kez yeniden okunur.',
    acikMi: (a) => a.talimatTekrari,
    degistir: (acik) => ({ talimatTekrari: acik }),
  },
  {
    ad: 'Renk körlüğü dostu renkler',
    aciklama: 'Doğru mavi, tekrar dene koyu turuncu; renkler koyulaşır.',
    acikMi: (a) => a.palet === 'renkKorluguDostu',
    degistir: (acik) => ({ palet: acik ? 'renkKorluguDostu' : 'standart' }),
  },
  {
    ad: 'Sol el',
    aciklama: 'Alt sıradaki düğmeler yer değiştirir: Onayla solda.',
    acikMi: (a) => a.solEl,
    degistir: (acik) => ({ solEl: acik }),
  },
  {
    ad: 'Büyük hedef',
    aciklama: 'Küçük düğmeler büyür.',
    acikMi: (a) => a.buyukHedef,
    degistir: (acik) => ({ buyukHedef: acik }),
  },
  {
    ad: 'Hareketi azalt',
    aciklama: 'Kayma ve zıplama animasyonları kapanır.',
    acikMi: (a) => a.hareketAzalt,
    degistir: (acik) => ({ hareketAzalt: acik }),
  },
];

/**
 * "Kapsayıcılık" bölümü (plan v2 Adım 55): altı ayar, varsayılan hepsi kapalı, yalnız bellekte.
 * Tahtada ayarlar adres çubuğuna (`#ayar=…`) yazılır; öğretmen yer imine ekler.
 */
/**
 * Isınma Keşfi anahtarı (plan v2 Adım 47, ADR-0007 Kabul): yalnız kişisel modda, varsayılan kapalı,
 * yalnız bellekte. Sonuç yalnız o oturumun başlangıç noktasını belirler, hiçbir yere yazılmaz.
 */
function IsinmaBolumu() {
  const acik = useAppStore((s) => s.isinmaAcik);
  const ayarla = useAppStore((s) => s.isinmaAyarla);
  return (
    <Bolum baslik="Isınma">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <BigButton
          label={`Oturuma kısa ısınmayla başla: ${acik ? 'açık' : 'kapalı'}`}
          size="control"
          variant={acik ? 'accent' : 'ghost'}
          ariaPressed={acik}
          onPress={() => ayarla(!acik)}
          style={{ minHeight: 'max(64px, var(--size-control))', padding: '0 16px', fontSize: 'var(--text-adult)' }}
        >
          {acik ? 'Açık' : 'Kapalı'}
        </BigButton>
        <div>
          <div style={{ fontSize: 'var(--text-adult)', color: COLOR.ink }}>Oturuma kısa ısınmayla başla</div>
          <p style={bilgiMetniStili}>
            Bir sonraki oturumdan önce en çok 8 kısa soru: en kolaydan başlar, bildikçe zorlaşır, iki kez üst üste
            zorlanınca biter. Puan ya da sonuç gösterilmez; yalnız o oturumun nereden başlayacağını belirler ve
            hiçbir yere kaydedilmez. Uygulama kapanınca anahtar kapanır.
          </p>
        </div>
      </div>
    </Bolum>
  );
}

function KapsayicilikBolumu({ tahta }: { tahta: boolean }) {
  const kapsayicilik = useAppStore((s) => s.kapsayicilik);
  const ayarla = useAppStore((s) => s.kapsayicilikAyarla);
  const farkli = varsayilandanFarkliMi(kapsayicilik);
  return (
    <Bolum baslik="Kapsayıcılık">
      <p style={{ ...bilgiMetniStili, marginBottom: 12 }}>
        Bu ayarlar çocuğa özel kayıt değildir; yalnız bu açılışta geçerlidir.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {KAPSAYICILIK_SATIRLARI.map((satir) => {
          const acik = satir.acikMi(kapsayicilik);
          return (
            <div key={satir.ad} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <BigButton
                label={`${satir.ad}: ${acik ? 'açık' : 'kapalı'}`}
                size="control"
                variant={acik ? 'accent' : 'ghost'}
                ariaPressed={acik}
                onPress={() => ayarla(satir.degistir(!acik))}
                style={{ minHeight: 'max(64px, var(--size-control))', padding: '0 16px', fontSize: 'var(--text-adult)' }}
              >
                {acik ? 'Açık' : 'Kapalı'}
              </BigButton>
              <div>
                <div style={{ fontSize: 'var(--text-adult)', color: COLOR.ink }}>{satir.ad}</div>
                <p style={bilgiMetniStili}>{satir.aciklama}</p>
              </div>
            </div>
          );
        })}
      </div>
      {tahta && (
        <p data-testid="ayar-kodu" style={{ ...bilgiMetniStili, marginTop: 12 }}>
          {farkli
            ? `Ayarlar adres çubuğuna eklendi (${ayarHash(kapsayicilik)}). Bu adresi yer imine eklerseniz uygulama aynı ayarlarla açılır.`
            : 'Bir ayarı açtığınızda adres çubuğuna eklenir; adresi yer imine ekleyerek sonraki derste aynı ayarlarla açabilirsiniz.'}
        </p>
      )}
    </Bolum>
  );
}
