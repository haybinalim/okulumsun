/**
 * KONU SEÇİMİ EKRANI — plan §11 [4b] (tahta modu).
 *
 * Temanın beceri düğümleri `childLabel` etiketiyle büyük kartlar hâlinde.
 * Öğretmen o günkü konuyu elle seçer — adaptif motor devre dışıdır.
 *
 * Sadece tahta modunda kullanılır. Kişisel modda adaptif motor seçer.
 */

import { useMemo } from 'react';
import { useAppStore } from '../../store/appStore';
import { BigButton } from '../primitives/BigButton';
import { useScreenSpeech } from '../../audio/useSpeak';
import { motion, useReducedMotion } from 'framer-motion';
import { COLOR } from '../../design/tokens';
import { skillsData } from '../../content/skillsData';
import type { SkillNode } from '../../content/schema/skill';

const DUGUMLER: readonly SkillNode[] = skillsData;

export function KonuSecimi() {
  const { secilenTemaNo, ekranGit } = useAppStore();
  const reducedMotion = useReducedMotion();

  useScreenSpeech(null, []);

  // Seçilen temanın düğümlerini filtrele
  const temaDugumleri = useMemo(
    () => DUGUMLER.filter((d) => d.tema === secilenTemaNo),
    [secilenTemaNo],
  );

  const dugumSec = useAppStore((s) => s.dugumSec);

  const handleKonuSec = (dugumId: string) => {
    dugumSec(dugumId);
  };

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
        gap: 'var(--size-gap)',
        overflow: 'hidden',
      }}
    >
      {/* Üst: geri butonu */}
      <header style={{ flex: '0 0 auto', display: 'flex' }}>
        <BigButton label="Geri" size="control" variant="ghost" onPress={handleGeri}>
          ←
        </BigButton>
      </header>

      {/* Orta: konu kartları */}
      <section
        style={{
          flex: 1,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignContent: 'center',
          gap: 'var(--size-gap)',
          minHeight: 0,
          overflow: 'auto',
        }}
      >
        {temaDugumleri.map((dugum, i) => (
          <motion.div
            key={dugum.id}
            initial={reducedMotion ? {} : { scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: reducedMotion ? 0 : 0.2,
              delay: reducedMotion ? 0 : i * 0.05,
            }}
          >
            <BigButton
              label={dugum.childLabel}
              size="choice"
              variant="solid"
              disabled={dugum.durum !== 'hazir'}
              onBlockedPress={() => { /* yakında */ }}
              onPress={() => handleKonuSec(dugum.id)}
              style={{
                width: 160,
                height: 120,
                flexDirection: 'column',
                gap: 8,
                opacity: dugum.durum === 'hazir' ? 1 : 0.4,
              }}
            >
              <span style={{ fontSize: 'var(--text-ui)', textAlign: 'center' }}>
                {dugum.childLabel}
              </span>
              {dugum.durum !== 'hazir' && (
                <span style={{ fontSize: 11, opacity: 0.6 }}>yakında</span>
              )}
            </BigButton>
          </motion.div>
        ))}
      </section>
    </main>
  );
}
