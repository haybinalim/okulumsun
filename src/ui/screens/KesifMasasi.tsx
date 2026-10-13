/**
 * KEŞİF MASASI — serbest manipülatif alanı (plan v2 Adım 44 aşama 2, KG-64).
 *
 * Soru, puan, süre YOK. Çocuk (ya da tahtada öğretmen) dokunarak sayı kurar; her değişiklik mevcut sayı
 * klipleriyle seslendirilir (`kesifSeslendirme`). Üst bölge yalnız gösterim (büyük rakam); tüm dokunma
 * hedefleri alt bölgede ve ≥ `--size-tap-min`. Sürükle-bırak yok. Durum yalnız bu bileşende (bellek),
 * ekrandan çıkınca silinir. Bu ekran tembel yüklenir.
 */
import { useEffect, useReducer, useRef } from 'react';
import { motion } from 'framer-motion';
import { useHareketAzalt } from '../../design/useHareketAzalt';
import { useAppStore } from '../../store/appStore';
import { BigButton } from '../primitives/BigButton';
import { speak } from '../../audio/useSpeak';
import { COLOR } from '../../design/tokens';
import { kesifBaslangic, kesifIndirge, kesifSeslendirme } from '../../kesif/kesifMasasi';
import { EKRAN_ARACLARI, genelArtiEksiVarMi, gosterilenMetin, gosterilenSayi } from '../kesif/kesifEkrani';
import { OnlukCerceveAraci } from '../kesif/OnlukCerceveAraci';
import { NesneKumesiAraci } from '../kesif/NesneKumesiAraci';
import { SayiDogrusuAraci } from '../kesif/SayiDogrusuAraci';
import { TeraziAraci } from '../kesif/TeraziAraci';
import { AyirBirlestirAraci } from '../kesif/AyirBirlestirAraci';

export default function KesifMasasi() {
  const ekranGit = useAppStore((s) => s.ekranGit);
  const [durum, gonder] = useReducer(kesifIndirge, kesifBaslangic('onlukCerceve'));
  const az = useHareketAzalt();
  const ilk = useRef(true);

  // Her değişiklikte mevcut sayı/işlem klipleriyle seslendir (açılışta değil).
  useEffect(() => {
    if (ilk.current) {
      ilk.current = false;
      return;
    }
    const kaynak = kesifSeslendirme(durum);
    if (kaynak) void speak(kaynak);
  }, [durum]);

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
        gap: 'var(--size-gap-tight)',
        overflow: 'hidden',
      }}
    >
      {/* Üst: yalnız gösterim — büyük rakam. */}
      <section
        aria-live="polite"
        style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <motion.output
          key={`${durum.arac}-${metin}`}
          initial={az ? false : { scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: az ? 0 : 0.25 }}
          aria-label={metin}
          style={{
            fontSize: metin.length > 3 ? 'calc(var(--text-stimulus) * 0.7)' : 'var(--text-stimulus)',
            fontWeight: 700,
            color: COLOR.ink,
            lineHeight: 1,
            whiteSpace: 'pre',
          }}
        >
          {metin}
        </motion.output>
      </section>

      {/* Orta-alt: araç. */}
      <section style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center', width: '100%' }}>
        {durum.arac === 'onlukCerceve' && <OnlukCerceveAraci dolu={durum.dolu} gonder={gonder} />}
        {durum.arac === 'nesneKumesi' && <NesneKumesiAraci sayi={durum.sayi} gonder={gonder} />}
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
        <BigButton label="Ev" size="tapMin" variant="ghost" onPress={() => ekranGit('anaEkran')}>
          🏠
        </BigButton>
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
