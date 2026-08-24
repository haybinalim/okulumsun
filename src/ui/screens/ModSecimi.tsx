/**
 * MOD SEÇİMİ EKRANI — plan §11 [1].
 *
 * İlk açılışta (ses kilidinden sonra) sorulur: Tahta / Kişisel.
 * İki büyük ikonlu kart. Ayarlardan değiştirilebilir.
 *
 * Tahta modu (§3.3): ilerleme kaydedilmez, içerik elle seçilir.
 * Kişisel mod: avatar + renk yalnız bellek durumunda kalır; adaptif motor seçer.
 * Geliştirme sürümünde öğrenci/veli verisi hiçbir modda kalıcı olarak yazılmaz.
 */

import { useAppStore } from '../../store/appStore';
import { BigButton } from '../primitives/BigButton';
import { useScreenSpeech, speak } from '../../audio/useSpeak';
import { motion, useReducedMotion } from 'framer-motion';
import { COLOR, MOTION, SIZE } from '../../design/tokens';

export function ModSecimi() {
  const modSec = useAppStore((s) => s.modSec);
  const reducedMotion = useReducedMotion();

  useScreenSpeech(null, []);

  const handleTahta = () => {
    void speak({ kind: 'key', key: 'ui.mod-tahta' });
    modSec('tahta');
  };

  const handleKisisel = () => {
    void speak({ kind: 'key', key: 'ui.mod-kisisel' });
    modSec('kisisel');
  };

  return (
    <main
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: COLOR.bg,
        gap: 'var(--size-gap)',
        padding: 'var(--size-edge)',
        paddingBottom: 'var(--size-edge-bottom)',
      }}
    >
      <motion.div
        initial={reducedMotion ? {} : { scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: reducedMotion ? 0 : MOTION.screen / 1000 }}
        style={{
          display: 'flex',
          gap: 'calc(var(--size-gap) * 2)',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Tahta modu kartı */}
        <ModKart
          renk="#7C3AED"
          ikon="tahta"
          etiket="Tahtada birlikte çalışalım."
          onSelect={handleTahta}
        />

        {/* Kişisel mod kartı */}
        <ModKart
          renk="#059669"
          ikon="kisisel"
          etiket="Kendi başıma çalışacağım."
          onSelect={handleKisisel}
        />
      </motion.div>
    </main>
  );
}

function ModKart({
  renk,
  ikon,
  etiket,
  onSelect,
}: {
  renk: string;
  ikon: 'tahta' | 'kisisel';
  etiket: string;
  onSelect: () => void;
}) {
  const kartSize = SIZE.choice;
  return (
    <BigButton
      label={etiket}
      size="choice"
      variant="solid"
      onPress={onSelect}
      style={{
        width: kartSize,
        height: kartSize,
        background: renk,
        color: '#fff',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <ModIkon ikon={ikon} size={kartSize * 0.4} />
      <span style={{ fontSize: 'var(--text-choice-label)', textAlign: 'center' }}>
        {ikon === 'tahta' ? 'Tahta' : 'Kişisel'}
      </span>
    </BigButton>
  );
}

function ModIkon({ ikon, size }: { ikon: 'tahta' | 'kisisel'; size: number }) {
  if (ikon === 'tahta') {
    return (
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        {/* Akıllı tahta silüeti */}
        <rect x="10" y="14" width="80" height="56" rx="4" fill="#fff" opacity={0.9} />
        <rect x="14" y="18" width="72" height="48" rx="2" fill="#E2DED4" />
        {/* Tahta altlığı */}
        <rect x="38" y="70" width="24" height="6" fill="#fff" opacity={0.7} />
        <rect x="30" y="76" width="40" height="4" rx="2" fill="#fff" opacity={0.7} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {/* Kişili figür — tek başına çalışma */}
      <circle cx="50" cy="30" r="14" fill="#fff" opacity={0.9} />
      <path d="M36 44 Q50 38 64 44 L64 76 Q50 80 36 76 Z" fill="#fff" opacity={0.9} />
    </svg>
  );
}
