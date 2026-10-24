/**
 * ANA EKRAN — plan §11 [4].
 *
 * 7 tema kartı (ikon + renk + siluet) + maskot + dişli (32px, çocuk hedefi değil).
 *
 * Kişisel mod: "Başla" butonu → adaptif motor 8 soru seçer.
 * Tahta modu: tema kartına dokununca → [4b] Konu seçimi; 8. kart "Sınıf Turu" → [4d] (Adım 36).
 *
 * Dişli → Veli kapısı → Veli paneli.
 * Akıllı tahta erişim bölgesi: dişli 32px (çocuk hedefi değil), alt %65'te.
 */

import { useVurgu } from '../../design/useVurgu';
import { useLayoutEffect, useRef, useState } from 'react';
import { anaEkranOlc, anaEkranSigmiyor } from './anaEkranYerlesimi';
import { useAppStore, TEMALAR, avatarBul } from '../../store/appStore';
import { temaAcikMi } from '../../content/okulAyi';
import { BigButton } from '../primitives/BigButton';
import { Maskot } from '../feedback/Maskot';
import { YonlendirmeSeridi } from '../feedback/YonlendirmeSeridi';
import { useScreenSpeech, speak } from '../../audio/useSpeak';
import { m } from 'framer-motion';
import { useHareketAzalt } from '../../design/useHareketAzalt';
import { COLOR, FONT_YIGINI, MOTION, SIZE, TEXT } from '../../design/tokens';
import type { CSSProperties } from 'react';
import { SinifKavanozu } from '../svg/SinifKavanozu';

/**
 * Konu kartı / tahta girişi etiketi (KG-98): yazı boyutu kartın 1/6'sı (120 px kart → 20 px, tahtadaki 180 px
 * kart → 30 px; `TEXT.kartEtiketi`). Cihaz profiline değil karta bağlı: kart ölçeklenmediği için etiket de
 * ölçeklenmez, elle seçilen tahta profilinde bile kartın dışına taşmaz. Gerekirse iki satır ("Toplama ve /
 * Çıkarma"), dengeli kırılır; kart ölçüsü değişmez.
 */
function kartEtiketiStili(kartBoyutu: number): CSSProperties {
  return {
    fontSize: Math.round((kartBoyutu * TEXT.kartEtiketi) / 120),
    // TemelYazi %120 ölçüyle çizilir: 1,15'te 'p'/'ş' kuyrukları alt satırın Ç/Ö işaretine değiyordu.
    lineHeight: 1.3,
    letterSpacing: 0,
    textAlign: 'center',
    fontWeight: 700,
    padding: '0 6px',
    textWrap: 'balance',
  };
}

export function AnaEkran() {
  const { mod, okulAyiIndex, temaSec, ekranGit, sinifTuruKur } = useAppStore();
  const accent = useVurgu();
  const avatar = avatarBul(useAppStore((s) => s.avatarId));
  const reducedMotion = useHareketAzalt();
  const [kilitliTema, setKilitliTema] = useState<string | null>(null);
  // KG-101: kişisel modda alt şerit sığmıyorsa (elle seçilen tahta profili, kısa ekran) "Başla" maskot satırına çıkar.
  const mainRef = useRef<HTMLElement>(null);
  const [sikiDuzen, setSikiDuzen] = useState(false);
  useLayoutEffect(() => {
    const el = mainRef.current;
    if (mod !== 'kisisel' || !el) return;
    const olc = () => setSikiDuzen(anaEkranSigmiyor(anaEkranOlc(el, SIZE.edgeBottom)));
    olc();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(olc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mod, kilitliTema]);

  // Konu seçimi, çocuk için sesli yönlendirmeyle başlar; şerit ses çalmazsa
  // ekranda sıradaki hareketi göstermeye devam eder.
  useScreenSpeech({ kind: 'key', key: 'ui.tema-sec' }, [mod]);

  const handleTema = (temaNo: number) => {
    const tema = TEMALAR.find((t) => t.no === temaNo);
    if (!tema) return;

    if (!temaAcikMi(okulAyiIndex, tema.no)) {
      setKilitliTema(tema.ad);
      void speak({ kind: 'key', key: 'ui.kilitli-acik-konu' });
      return;
    }

    setKilitliTema(null);
    void speak({ kind: 'key', key: tema.speechKey as never });
    temaSec(temaNo);
  };

  const handleBasla = () => {
    // Kişisel modda "Başla" → ilk açık temadan başla
    const ilkAcik = TEMALAR.find((t) => temaAcikMi(okulAyiIndex, t.no));
    if (ilkAcik) handleTema(ilkAcik.no);
  };

  const handleDisli = () => {
    ekranGit('veliKapisi');
  };

  const altDugmeler = (
    <>
      <BigButton
        label="Başla"
        size="primary"
        variant="accent"
        onPress={handleBasla}
        // Sıkı düzende kart ızgarasında iki hücre (yükseklik kart boyu 120 px ≥ tahta dokunma alt sınırı 102 px).
        style={sikiDuzen ? { gridColumn: 'span 2', minWidth: 0, minHeight: 0, height: 120 } : undefined}
      >
        Başla
      </BigButton>
      <BigButton
        label="Keşif Masası"
        size="control"
        variant="solid"
        onPress={() => ekranGit('kesifMasasi')}
        style={{
          padding: '0 calc(16px * var(--scale))',
          gap: 8,
          border: `3px dashed ${COLOR.border}`,
          ...(sikiDuzen ? { minWidth: 0, minHeight: 0, width: 120, height: 120, justifySelf: 'center' } : null),
        }}
      >
        <KesifIkon boyut={40} />
      </BigButton>
    </>
  );

  return (
    <main
      ref={mainRef}
      data-ana-duzen={mod === 'kisisel' ? (sikiDuzen ? 'siki' : 'normal') : undefined}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: COLOR.bg,
        padding: 'var(--size-edge)',
        paddingBottom: 'var(--size-edge-bottom)',
        // Sıkı düzende alt şerit yok; başlık ile orta arası dar boşluk (KG-101).
        gap: sikiDuzen && mod === 'kisisel' ? 'var(--size-gap-tight)' : 'var(--size-gap)',
        // Kişisel modda son çare: sıkı düzen de sığmazsa (ör. 1024×768'de elle tahta profili) dikey kaydırma; çakışma yok.
        overflowX: 'hidden',
        overflowY: mod === 'kisisel' ? 'auto' : 'hidden',
        ['--color-accent' as string]: accent.hex,
      }}
    >
      {/* Üst: dişli (sağ üstte, 32px — çocuk hedefi değil) + profil (sol üstte) */}
      <header
        data-ana-ust=""
        style={{
          flex: '0 0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: SIZE.control,
        }}
      >
        {/* Profil: avatar + renk (kişisel modda) */}
        {mod === 'kisisel' && avatar && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: avatar.renk,
                display: 'grid',
                placeItems: 'center',
                fontSize: 20,
              }}
            >
              🐾
            </div>
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: accent.hex,
              }}
            />
          </div>
        )}

        {/* Tahtada öğretmen girişi (Adım 34): veli kapısına gider; yetişkin girişi, çocuk erişim bölgesi dışında. */}
        {mod === 'tahta' && (
          <button
            type="button"
            data-yetiskin=""
            aria-label="Öğretmen"
            onClick={handleDisli}
            style={{
              minHeight: 44,
              padding: '0 14px',
              border: 'none',
              borderRadius: 8,
              background: 'transparent',
              color: COLOR.inkSoft,
              cursor: 'pointer',
              fontSize: 'var(--text-adult)',
            }}
          >
            Öğretmen
          </button>
        )}

        {/* Dişli — veli kapısına gider */}
        <button
          type="button"
          aria-label="Ayarlar"
          // Yetişkin girişi: bilerek küçük, soluk ve tahtada çocuğun erişemeyeceği üst bölgede (veli kapısı).
          // E2E geometri denetimi bu işaretli öğeyi muaf tutar (tests/e2e/yardimci/geometri.ts).
          data-yetiskin=""
          onClick={handleDisli}
          style={{
            width: 32,
            height: 32,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: 0,
            opacity: 0.4,
          }}
        >
          <svg viewBox="0 0 24 24" width="32" height="32" fill={COLOR.inkSoft} aria-hidden="true">
            <path d="M12 8a4 4 0 100 8 4 4 0 000-8zm9.4 4l1.6-1.2-1.6-2.8-2 .8a7.8 7.8 0 00-1.4-.8L17.5 5h-3.2l-.5 2.2a7.8 7.8 0 00-1.4.8l-2-.8L8.8 9.2 10.4 10a8 8 0 000 2l-1.6 1.2 1.6 2.8 2-.8a7.8 7.8 0 001.4.8l.5 2.2h3.2l.5-2.2a7.8 7.8 0 001.4-.8l2 .8 1.6-2.8z" />
          </svg>
        </button>
      </header>

      {/* Tahta modunda etkileşimler, fiziksel erişim için alt %65'e yerleşir. */}
      <section
        data-ana-orta=""
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: mod === 'tahta' ? 'flex-end' : 'center',
          gap: 'var(--size-gap-tight)',
          minHeight: 0,
          paddingTop: mod === 'tahta' ? '8%' : 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--size-gap-tight)', width: '100%' }}>
          <div data-ana-maskot="" style={{ flex: '0 0 auto' }}>
            <Maskot durum={kilitliTema ? 'cesaretlendiriyor' : 'sakin'} size={SIZE.mascot} />
          </div>
          <div data-ana-serit="" style={{ minWidth: 0, display: 'flex' }}>
            <YonlendirmeSeridi metin={kilitliTema ? `${kilitliTema} daha sonra açılacak.` : 'Dinle, sonra renkli açık konu kartına dokun.'} />
          </div>
        </div>

        {kilitliTema && (
          <div
            role="status"
            aria-live="polite"
            data-ana-kilit=""
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 16px',
              borderRadius: 16,
              background: 'var(--color-retry-soft)',
              color: 'var(--color-ink)',
              fontSize: 'var(--text-adult)',
            }}
          >
            <span aria-hidden="true" style={{ fontSize: 24 }}>🔒</span>
            <span>Önce renkli açık karttan başlayalım.</span>
          </div>
        )}

        {/* Tahtada 4+3 kart, küçük ekranda satıra taşar. */}
        <m.div
          data-ana-izgara=""
          initial={reducedMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reducedMotion ? 0 : MOTION.screen / 1000 }}
          style={{
            display: 'grid',
            // Tahtada 5 sütun: 7 tema + Sınıf Turu + Keşif Masası iki sıraya sığar (üst %35'e taşmaz).
            // Kişisel sıkı düzen (KG-101): 5 sütun; ikinci satırın boş hücrelerine Başla (2 hücre) + Keşif Masası.
            gridTemplateColumns: `repeat(${mod === 'tahta' || sikiDuzen ? 5 : 4}, minmax(${mod === 'tahta' ? 150 : 120}px, 1fr))`,
            gap: 'var(--size-gap-tight)',
            width: mod === 'tahta' ? 'min(100%, 1120px)' : 'min(100%, 960px)',
            maxWidth: mod === 'tahta' ? 1120 : sikiDuzen ? 780 : 600,
          }}
        >
          {TEMALAR.map((tema, i) => {
            const acik = temaAcikMi(okulAyiIndex, tema.no);
            return (
              <TemaKart
                key={tema.no}
                tema={tema}
                acik={acik}
                index={i}
                reducedMotion={reducedMotion}
                boardMode={mod === 'tahta'}
                onSelect={() => handleTema(tema.no)}
                onBlockedPress={() => handleTema(tema.no)}
              />
            );
          })}
          {mod === 'kisisel' && sikiDuzen && (
            <div data-ana-ekran-alt="" style={{ display: 'contents' }}>
              {altDugmeler}
            </div>
          )}
          {/* Sınıf Turu (Adım 36): yalnız tahtada; öğretmen kurulumu açar. */}
          {mod === 'tahta' && (
            <BigButton
              label="Sınıf Turu"
              size="tapMin"
              variant="solid"
              onPress={() => sinifTuruKur()}
              style={{
                width: 180,
                height: 180,
                background: COLOR.surface,
                color: COLOR.ink,
                border: `4px dashed ${COLOR.border}`,
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <SinifKavanozu kavanoz={5} hedef={9} boyut={70} />
              <span style={kartEtiketiStili(180)}>Sınıf Turu</span>
            </BigButton>
          )}
          {/* Keşif Masası (Adım 44): tahtada öğretmenin anlatım aracı. */}
          {mod === 'tahta' && (
            <BigButton
              label="Keşif Masası"
              size="tapMin"
              variant="solid"
              onPress={() => ekranGit('kesifMasasi')}
              style={{
                width: 180,
                height: 180,
                background: COLOR.surface,
                color: COLOR.ink,
                border: `4px dashed ${COLOR.border}`,
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <KesifIkon boyut={70} />
              <span style={kartEtiketiStili(180)}>Keşif Masası</span>
            </BigButton>
          )}
          {mod === 'tahta' && (
            <BigButton
              label="Dersi bitir"
              size="tapMin"
              variant="ghost"
              data-yetiskin=""
              onPress={() => ekranGit('dersSonuOzeti')}
              style={{ position: 'fixed', left: 16, bottom: 16, zIndex: 5, minHeight: 'max(102px, var(--size-tap-min))', padding: '0 24px', fontSize: 'var(--text-adult)' }}
            >
              Dersi bitir
            </BigButton>
          )}
        </m.div>
      </section>

      {/* Alt (kişisel mod): Başla + Keşif Masası (tema kartlarından ayrı; Adım 44). Tahtada giriş kart ızgarasında. */}
      {mod === 'kisisel' && !sikiDuzen && (
        <footer
          data-ana-ekran-alt=""
          style={{
            flex: '0 0 auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 'var(--size-gap)',
            paddingBottom: SIZE.edgeBottom,
          }}
        >
          {altDugmeler}
        </footer>
      )}
    </main>
  );
}

/** Tema kartı — ikon + renk + siluet. Kilitli temalar soluk. */
function TemaKart({
  tema,
  acik,
  index,
  reducedMotion,
  onSelect,
  onBlockedPress,
  boardMode,
}: {
  tema: { no: number; ad: string; renk: string; speechKey: string };
  acik: boolean;
  index: number;
  reducedMotion: boolean | null;
  onSelect: () => void;
  onBlockedPress: () => void;
  boardMode: boolean;
}) {
  const kartSize = boardMode ? 180 : 120;
  return (
    <m.div
      data-tema-kart=""
      initial={reducedMotion ? {} : { scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        duration: reducedMotion ? 0 : 0.2,
        delay: reducedMotion ? 0 : index * 0.04,
      }}
    >
      <BigButton
        label={tema.ad}
        size="tapMin"
        variant="solid"
        disabled={!acik}
        onBlockedPress={onBlockedPress}
        onPress={onSelect}
        style={{
          width: kartSize,
          height: kartSize,
          background: acik ? tema.renk : '#f3ede3',
          color: acik ? '#fff' : COLOR.ink,
          flexDirection: 'column',
          gap: 4,
          opacity: 1,
          boxShadow: acik ? undefined : '0 3px 0 #d9cfbf',
        }}
      >
          <TemaIkon no={tema.no} size={kartSize * 0.3} color={acik ? '#fff' : COLOR.ink} />
          <span style={kartEtiketiStili(kartSize)}>
            {tema.ad}
          </span>
          {!acik && (
            <span aria-hidden="true" style={{ position: 'absolute', top: 10, right: 10, fontSize: 22 }}>🔒</span>
          )}
        </BigButton>
    </m.div>
  );
}

/** Keşif Masası ikonu: onluk çerçeve parçası (3 dolu göz). */
function KesifIkon({ boyut }: { boyut: number }) {
  return (
    <svg viewBox="0 0 60 28" width={boyut} height={(boyut * 28) / 60} aria-hidden="true">
      <rect x="1.5" y="1.5" width="57" height="25" rx="3" fill="none" stroke={COLOR.ink} strokeWidth="3" />
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={8 + i * 11} cy="14" r="4" fill={i < 3 ? 'var(--color-accent)' : COLOR.border} />
      ))}
    </svg>
  );
}

/** Tema ikonu — her tema için basit SVG. */
function TemaIkon({ no, size, color }: { no: number; size: number; color: string }) {
  switch (no) {
    case 1: // Yön ve Yerler
      return (
        <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" fill={color}>
          <path d="M20 4 L26 16 L20 12 L14 16 Z" />
          <path d="M20 36 L14 24 L20 28 L26 24 Z" />
        </svg>
      );
    case 2: // Sayılar
      return (
        <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" fill={color}>
          <text x="20" y="28" fontFamily={FONT_YIGINI} fontSize="22" textAnchor="middle" fill={color}>123</text>
        </svg>
      );
    case 3: // Ölçme
      return (
        <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" fill="none" stroke={color} strokeWidth="3">
          <rect x="6" y="18" width="28" height="8" rx="1" />
          <path d="M12 18 V22 M18 18 V21 M24 18 V22 M30 18 V21" />
        </svg>
      );
    case 4: // Toplama ve Çıkarma
      return (
        <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" fill="none" stroke={color} strokeWidth="3">
          <path d="M20 8 V32 M8 20 H32" />
        </svg>
      );
    case 5: // Paralarımız
      return (
        <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" fill={color}>
          <circle cx="20" cy="20" r="14" />
          <text x="20" y="25" fontFamily={FONT_YIGINI} fontSize="12" textAnchor="middle" fill={COLOR.mascot}>₺</text>
        </svg>
      );
    case 6: // Şekiller
      return (
        <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" fill="none" stroke={color} strokeWidth="3">
          <rect x="8" y="8" width="16" height="16" />
          <circle cx="28" cy="28" r="8" />
        </svg>
      );
    case 7: // Sayalım ve Gösterelim
      return (
        <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" fill={color}>
          <rect x="6" y="24" width="6" height="12" />
          <rect x="16" y="16" width="6" height="20" />
          <rect x="26" y="8" width="6" height="28" />
        </svg>
      );
    default:
      return null;
  }
}
