/**
 * ANA EKRAN — plan §11 [4].
 *
 * 7 tema kartı (ikon + renk + siluet) + maskot + dişli (32px, çocuk hedefi değil).
 *
 * Kişisel mod: "Başla" butonu → adaptif motor 8 soru seçer.
 * Tahta modu: tema kartına dokununca → [4b] Konu seçimi.
 *
 * Dişli → Veli kapısı → Veli paneli.
 * Akıllı tahta erişim bölgesi: dişli 32px (çocuk hedefi değil), alt %65'te.
 */

import { useState } from 'react';
import { useAppStore, TEMALAR, accentBul, avatarBul } from '../../store/appStore';
import { temaAcikMi } from '../../content/okulAyi';
import { BigButton } from '../primitives/BigButton';
import { Maskot } from '../feedback/Maskot';
import { YonlendirmeSeridi } from '../feedback/YonlendirmeSeridi';
import { useScreenSpeech, speak } from '../../audio/useSpeak';
import { motion, useReducedMotion } from 'framer-motion';
import { COLOR, MOTION, SIZE } from '../../design/tokens';

export function AnaEkran() {
  const { mod, okulAyiIndex, temaSec, ekranGit } = useAppStore();
  const accent = accentBul(useAppStore((s) => s.accentId));
  const avatar = avatarBul(useAppStore((s) => s.avatarId));
  const reducedMotion = useReducedMotion();
  const [kilitliTema, setKilitliTema] = useState<string | null>(null);

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

  return (
    <main
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: COLOR.bg,
        padding: 'var(--size-edge)',
        paddingBottom: 'var(--size-edge-bottom)',
        gap: 'var(--size-gap)',
        overflow: 'hidden',
        ['--color-accent' as string]: accent.hex,
      }}
    >
      {/* Üst: dişli (sağ üstte, 32px — çocuk hedefi değil) + profil (sol üstte) */}
      <header
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

        {/* Dişli — veli kapısına gider */}
        <button
          type="button"
          aria-label="Ayarlar"
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
          <div style={{ flex: '0 0 auto' }}>
            <Maskot durum={kilitliTema ? 'cesaretlendiriyor' : 'sakin'} size={SIZE.mascot} />
          </div>
          <YonlendirmeSeridi metin={kilitliTema ? `${kilitliTema} daha sonra açılacak.` : 'Dinle, sonra renkli açık konu kartına dokun.'} />
        </div>

        {kilitliTema && (
          <div
            role="status"
            aria-live="polite"
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
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reducedMotion ? 0 : MOTION.screen / 1000 }}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(4, minmax(${mod === 'tahta' ? 150 : 120}px, 1fr))`,
            gap: 'var(--size-gap-tight)',
            width: 'min(100%, 960px)',
            maxWidth: mod === 'tahta' ? 960 : 600,
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
        </motion.div>
      </section>

      {/* Alt: Başla butonu (kişisel modda) */}
      {mod === 'kisisel' && (
        <footer
          style={{
            flex: '0 0 auto',
            display: 'flex',
            justifyContent: 'center',
            paddingBottom: SIZE.edgeBottom,
          }}
        >
          <BigButton
            label="Başla"
            size="primary"
            variant="accent"
            onPress={handleBasla}
          >
            Başla
          </BigButton>
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
    <motion.div
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
          <span style={{ fontSize: boardMode ? 16 : 11, textAlign: 'center', fontWeight: 700 }}>
            {tema.ad}
          </span>
          {!acik && (
            <span aria-hidden="true" style={{ position: 'absolute', top: 10, right: 10, fontSize: 22 }}>🔒</span>
          )}
        </BigButton>
    </motion.div>
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
          <text x="20" y="28" fontSize="22" textAnchor="middle" fill={color}>123</text>
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
          <text x="20" y="25" fontSize="12" textAnchor="middle" fill={COLOR.mascot}>₺</text>
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
