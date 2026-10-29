/**
 * KEŞİF MASASI — serbest manipülatif alanı (plan v2 Adım 44 aşama 2, KG-64).
 *
 * Soru, puan, süre YOK. Çocuk (ya da tahtada öğretmen) dokunarak sayı kurar; her değişiklik mevcut sayı
 * klipleriyle seslendirilir (`kesifSeslendirme`). Üst bölge yalnız gösterim (büyük rakam); tüm dokunma
 * hedefleri alt bölgede ve ≥ `--size-tap-min`. Sürükle-bırak yok. Durum yalnız bu bileşende (bellek),
 * ekrandan çıkınca silinir. Bu ekran tembel yüklenir.
 */
import { useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { m } from 'framer-motion';
import { useHareketAzalt } from '../../design/useHareketAzalt';
import { BigButton } from '../primitives/BigButton';
import { speak, useScreenSpeech } from '../../audio/useSpeak';
import { COLOR } from '../../design/tokens';
import { KESIF_HOSGELDIN, kesifBaslangic, kesifIndirge, kesifSeslendirme } from '../../kesif/kesifMasasi';
import {
  EKRAN_ARACLARI,
  genelArtiEksiVarMi,
  gosterilenMetin,
  gosterilenSayi,
  nesneTekOnlukMu,
  onlukTekMi,
  type KesifOlcu,
} from '../kesif/kesifEkrani';
import { OnlukCerceveAraci } from '../kesif/OnlukCerceveAraci';
import { NesneKumesiAraci } from '../kesif/NesneKumesiAraci';
import { SayiDogrusuAraci } from '../kesif/SayiDogrusuAraci';
import { TeraziAraci } from '../kesif/TeraziAraci';
import { AyirBirlestirAraci } from '../kesif/AyirBirlestirAraci';

export default function KesifMasasi() {
  const [durum, gonder] = useReducer(kesifIndirge, kesifBaslangic('onlukCerceve'));
  const az = useHareketAzalt();
  const ilk = useRef(true);
  useScreenSpeech(KESIF_HOSGELDIN, []);

  // Her değişiklikte mevcut sayı/işlem klipleriyle seslendir (açılışta değil).
  useEffect(() => {
    if (ilk.current) {
      ilk.current = false;
      return;
    }
    const kaynak = kesifSeslendirme(durum);
    if (kaynak) void speak(kaynak);
  }, [durum]);

  // KG-120: araç alanının ve üst gösterim bölgesinin ölçüsü (küçük tahtada tek onluk; rakam bölgeye sığar).
  const aracAlani = useRef<HTMLElement>(null);
  const ustBolge = useRef<HTMLElement>(null);
  const [olcu, setOlcu] = useState<KesifOlcu | null>(null);
  const [ustYukseklik, setUstYukseklik] = useState<number | null>(null);
  useLayoutEffect(() => {
    const alan = aracAlani.current;
    const ust = ustBolge.current;
    if (!alan || !ust) return;
    const olc = () => {
      const kok = getComputedStyle(document.documentElement);
      const px = (ad: string) => parseFloat(kok.getPropertyValue(ad)) || 0;
      const yeni: KesifOlcu = {
        genislik: alan.clientWidth,
        tapMin: px('--size-tap-min'),
        olcek: px('--scale') || 1,
        aralik: px('--size-gap'),
      };
      setOlcu((o) =>
        o &&
        o.genislik === yeni.genislik &&
        o.tapMin === yeni.tapMin &&
        o.olcek === yeni.olcek &&
        o.aralik === yeni.aralik
          ? o
          : yeni,
      );
      setUstYukseklik(ust.clientHeight);
    };
    olc();
    if (typeof ResizeObserver === 'undefined') return;
    const g = new ResizeObserver(olc);
    g.observe(alan);
    g.observe(ust);
    return () => g.disconnect();
  }, []);
  const onlukTek = olcu !== null && onlukTekMi(olcu);
  const nesneTek = olcu !== null && nesneTekOnlukMu(olcu);
  const sikisik = (durum.arac === 'onlukCerceve' && onlukTek) || (durum.arac === 'nesneKumesi' && nesneTek);
  // KG-126: sıkı düzene geçişte üst bölgenin yeni yüksekliği boyamadan ÖNCE okunur (ResizeObserver bir kare
  // sonra bildirir; arada rakam eski boyutta üstten taşan bir kare çiziliyordu). Bölge `flex: 1` olduğundan
  // yüksekliği rakamın boyutuna bağlı değil — döngü yok.
  useLayoutEffect(() => {
    const ust = ustBolge.current;
    if (ust) setUstYukseklik(ust.clientHeight);
  }, [sikisik, durum.arac]);

  const sayi = gosterilenSayi(durum);
  const metin = gosterilenMetin(durum);

  return (
    <main
      aria-label="Keşif Masası"
      data-kesif-arac={durum.arac}
      data-kesif-sayi={sayi}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: COLOR.bg,
        padding: 'var(--size-edge)',
        paddingBottom: 'var(--size-edge-bottom)',
        // Tek onluk görünümünde (küçük ekran) bölümler arası boşluk ızgara boşluğuna iner: ilk göz satırı üst %35'in altında kalır.
        gap: sikisik ? 'calc(12px * var(--scale))' : 'var(--size-gap-tight)',
        overflow: 'hidden',
      }}
    >
      {/* Üst: yalnız gösterim — büyük rakam. */}
      <section
        ref={ustBolge}
        aria-live="polite"
        style={{
          flex: 1,
          minHeight: 0,
          ...(sikisik ? { alignSelf: 'stretch' } : null),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <m.output
          key={`${durum.arac}-${metin}`}
          initial={az ? false : { scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: az ? 0 : 0.25 }}
          aria-label={metin}
          style={{
            // Rakam üst bölgeye sığar (KG-120): bölge rakamdan kısaysa boyut bölge yüksekliğine iner.
            fontSize: ustSinirli(
              metin.length > 3 ? 'calc(var(--text-stimulus) * 0.7)' : 'var(--text-stimulus)',
              sikisik ? ustYukseklik : null,
            ),
            fontWeight: 700,
            color: COLOR.ink,
            lineHeight: 1,
            whiteSpace: 'pre',
          }}
        >
          {metin}
        </m.output>
      </section>

      {/* Orta-alt: araç. */}
      <section ref={aracAlani} style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center', width: '100%' }}>
        {durum.arac === 'onlukCerceve' && <OnlukCerceveAraci dolu={durum.dolu} gonder={gonder} tek={onlukTek} />}
        {durum.arac === 'nesneKumesi' && <NesneKumesiAraci sayi={durum.sayi} gonder={gonder} tekOnluk={nesneTek} />}
        {durum.arac === 'sayiDogrusu' && <SayiDogrusuAraci konum={durum.konum} gonder={gonder} />}
        {durum.arac === 'terazi' && <TeraziAraci sol={durum.sol} sag={durum.sag} gonder={gonder} />}
        {durum.arac === 'ayirBirlestir' && (
          <AyirBirlestirAraci toplam={durum.toplam} ayirma={durum.ayirma} gonder={gonder} />
        )}
      </section>

      {/* Alt: Ev · araç seçimi · −1 · +1 · baştan. */}
      <nav
        aria-label="Keşif Masası düğmeleri"
        style={{
          flex: '0 0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 'var(--size-gap-tight)',
        }}
      >
        {/* Ana ekrana dönüş: ortak gezinme rayındaki Geri / Ana menü (KG-103; eski "Ev" düğmesinin yerine). */}
        {EKRAN_ARACLARI.map((a) => (
          <BigButton
            key={a.arac}
            label={a.ad}
            size="tapMin"
            ariaPressed={durum.arac === a.arac}
            variant={durum.arac === a.arac ? 'accent' : 'solid'}
            onPress={() => gonder({ tur: 'aracSec', arac: a.arac })}
            style={{ padding: '0 calc(12px * var(--scale))', fontWeight: 700 }}
          >
            {a.ikon}
          </BigButton>
        ))}
        {genelArtiEksiVarMi(durum.arac) && (
          <>
            <BigButton label="Bir çıkar" size="tapMin" onPress={() => gonder({ tur: 'dokun', hedef: 'eksi' })}>
              −1
            </BigButton>
            <BigButton label="Bir ekle" size="tapMin" onPress={() => gonder({ tur: 'dokun', hedef: 'arti' })}>
              +1
            </BigButton>
          </>
        )}
        <BigButton label="Baştan" size="tapMin" variant="ghost" onPress={() => gonder({ tur: 'sifirla' })}>
          ↺
        </BigButton>
      </nav>
    </main>
  );
}

/**
 * Yazı boyutunu ölçülen bölge yüksekliğiyle sınırlar. Satır yüksekliği 1 olsa da rakam glifleri satır kutusundan
 * taşar (TemelYazi size-adjust); %75 pay bölgede kesilmeden görünmesini sağlar. Ölçü yoksa olduğu gibi.
 */
function ustSinirli(boyut: string, yukseklik: number | null): string {
  return yukseklik === null || yukseklik <= 0 ? boyut : `min(${boyut}, ${Math.floor(yukseklik * 0.75)}px)`;
}
