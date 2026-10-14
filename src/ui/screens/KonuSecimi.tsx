/**
 * KONU SEÇİMİ EKRANI — plan §11 [4b] (tahta modu).
 *
 * Temanın beceri düğümleri `childLabel` etiketiyle büyük kartlar hâlinde.
 * Öğretmen o günkü konuyu elle seçer — adaptif motor devre dışıdır.
 *
 * Sadece tahta modunda kullanılır. Kişisel modda adaptif motor seçer.
 */

import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { BigButton } from '../primitives/BigButton';
import { YonlendirmeSeridi } from '../feedback/YonlendirmeSeridi';
import { useScreenSpeech, speak } from '../../audio/useSpeak';
import { m } from 'framer-motion';
import { useHareketAzalt } from '../../design/useHareketAzalt';
import { COLOR } from '../../design/tokens';
import { skillsData } from '../../content/skillsData';
import type { SkillNode } from '../../content/schema/skill';
import { temaTuruHazirla } from '../../ogretmen/temaTuruBaglama';
import { hash32 } from '../../exercises/rng';

const DUGUMLER: readonly SkillNode[] = skillsData;

export function KonuSecimi() {
  const { secilenTemaNo, ekranGit } = useAppStore();
  const reducedMotion = useHareketAzalt();
  const [kilitliEtiket, setKilitliEtiket] = useState<string | null>(null);

  useScreenSpeech({ kind: 'key', key: 'ui.konu-sec' }, [secilenTemaNo]);

  // Seçilen temanın düğümlerini filtrele
  const temaDugumleri = useMemo(
    () => DUGUMLER.filter((d) => d.tema === secilenTemaNo),
    [secilenTemaNo],
  );

  const dugumSec = useAppStore((s) => s.dugumSec);
  const temaTuruBaslat = useAppStore((s) => s.temaTuruBaslat);
  // Adım 46: son kart "Tema turu"; temada oynatılabilir düğüm yoksa kart çıkmaz.
  const turVar = useMemo(() => secilenTemaNo != null && temaTuruHazirla(secilenTemaNo, 0) !== null, [secilenTemaNo]);
  const handleTemaTuru = () => {
    if (secilenTemaNo == null) return;
    // Tohum UI katmanında (saf modül rastgelelik okumaz; Math.random yasak).
    const plan = temaTuruHazirla(secilenTemaNo, hash32(`${performance.now()}:tur:${secilenTemaNo}`));
    if (plan) temaTuruBaslat(secilenTemaNo, plan);
  };

  const handleKonuSec = (dugum: SkillNode) => {
    if (dugum.durum !== 'hazir') {
      setKilitliEtiket(dugum.childLabel);
      void speak({ kind: 'key', key: 'ui.kilitli-acik-konu' });
      return;
    }
    setKilitliEtiket(null);
    dugumSec(dugum.id);
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

      {/* Etkileşimler tahta erişimi için alt %65'e yerleşir. */}
      <section
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 'var(--size-gap-tight)',
          minHeight: 0,
          paddingTop: '8%',
          overflow: 'auto',
        }}
      >
        <YonlendirmeSeridi metin={kilitliEtiket ? `${kilitliEtiket} daha sonra açılacak.` : 'Dinle, sonra renkli açık etkinlik kartına dokun.'} />

        {kilitliEtiket && (
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

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 'var(--size-gap)',
            width: 'min(100%, 960px)',
          }}
        >
          {temaDugumleri.map((dugum, i) => (
            <m.div
              key={dugum.id}
              initial={reducedMotion ? {} : { scale: 0.95, opacity: 0 }}
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
                onBlockedPress={() => handleKonuSec(dugum)}
                onPress={() => handleKonuSec(dugum)}
                style={{
                  width: '100%',
                  minHeight: 160,
                  flexDirection: 'column',
                  gap: 8,
                  opacity: dugum.durum === 'hazir' ? 1 : 0.45,
                  position: 'relative',
                }}
              >
                <span style={{ fontSize: 'var(--text-ui)', textAlign: 'center', fontWeight: 700 }}>
                  {dugum.childLabel}
                </span>
                {dugum.durum !== 'hazir' && (
                  <>
                    <span aria-hidden="true" style={{ position: 'absolute', top: 12, right: 12, fontSize: 24 }}>🔒</span>
                    <span style={{ fontSize: 'var(--text-adult)', opacity: 0.8 }}>daha sonra</span>
                  </>
                )}
              </BigButton>
            </m.div>
          ))}
          {turVar && (
            <BigButton
              label="Tema turu"
              size="choice"
              variant="accent"
              onPress={handleTemaTuru}
              style={{ width: '100%', minHeight: 160, flexDirection: 'column', gap: 8 }}
            >
              <span aria-hidden="true" style={{ fontSize: 32 }}>🧭</span>
              <span style={{ fontSize: 'var(--text-ui)', textAlign: 'center', fontWeight: 700 }}>Tema turu</span>
            </BigButton>
          )}
        </div>
      </section>
    </main>
  );
}
