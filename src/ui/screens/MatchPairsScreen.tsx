/**
 * MATCH_PAIRS ekranı — soldan karta, sağdan eşine dokun.
 *
 * M-TERS-ISLEM ve M-GEO-ESLE için. Sol sütun ve sağ sütun kartları
 * ayrı ayrı listelenir. Çocuk önce sol kartı seçer, sonra sağ kartı.
 * Eşleşirse çift kaldırılır (yeşil). Tüm çiftler bulununca tamamlandı.
 *
 * validation.ciftler: [solOptionId, sagOptionId] çiftleri.
 */

import { useState } from 'react';
import { GameShell } from '../layout/GameShell';
import { ChoiceCard, type ChoiceState } from '../primitives/ChoiceCard';
import { SpeakButton } from '../primitives/SpeakButton';
import { Visual } from '../svg/Visual';
import { useScreenSpeech, speak } from '../../audio/useSpeak';
import { randomPraise, randomRetry } from '../../audio/speech';
import type { MatchPairsExercise, EslesmeKarti } from '../../exercises/types';
import type { Accent } from '../../design/tokens';

export function MatchPairsScreen({
  exercise,
  accent,
  onDone,
}: {
  exercise: MatchPairsExercise;
  accent: Accent;
  onDone: (dogruMu: boolean) => void;
}) {
  useScreenSpeech(exercise.prompt.ses, [exercise.itemId]);

  const [eslesenCiftler, setEslesenCiftler] = useState<Set<string>>(new Set());
  const [seciliSol, setSeciliSol] = useState<string | null>(null);
  const [seciliSag, setSeciliSag] = useState<string | null>(null);
  const [cozum, setCozum] = useState<'bos' | 'dogru' | 'tekrar'>('bos');
  const [hataCifti, setHataCifti] = useState<[string, string] | null>(null);

  const solKartlar = exercise.options.filter((o): o is EslesmeKarti => (o as EslesmeKarti).taraf === 'sol');
  const sagKartlar = exercise.options.filter((o): o is EslesmeKarti => (o as EslesmeKarti).taraf === 'sag');
  const ciftler = exercise.validation.ciftler;

  // Bir kart eşleşti mi?
  const kartEslesti = (id: string): boolean => {
    for (const [sol, sag] of ciftler) {
      const ciftKey = `${sol}|${sag}`;
      if ((id === sol || id === sag) && eslesenCiftler.has(ciftKey)) return true;
    }
    return false;
  };

  // İki kart eşleşir mi?
  const eslesirMi = (solId: string, sagId: string): boolean => {
    return ciftler.some(([s, g]) => s === solId && g === sagId);
  };

  const handleSol = (id: string) => {
    if (cozum !== 'bos' || kartEslesti(id)) return;
    setSeciliSol(id);
    setHataCifti(null);
  };

  const handleSag = (id: string) => {
    if (cozum !== 'bos' || kartEslesti(id)) return;
    if (!seciliSol) {
      setSeciliSag(id);
      return;
    }
    // Eşleşmeyi kontrol et
    if (eslesirMi(seciliSol, id)) {
      const ciftKey = `${seciliSol}|${id}`;
      setEslesenCiftler((onceki) => new Set([...onceki, ciftKey]));
      setSeciliSol(null);
      setSeciliSag(null);
      // Tüm çiftler bulundu mu?
      if (eslesenCiftler.size + 1 === ciftler.length) {
        setCozum('dogru');
        void speak(randomPraise());
        window.setTimeout(() => onDone(true), 900);
      }
    } else {
      // Yanlış eşleşme
      setHataCifti([seciliSol, id]);
      setCozum('tekrar');
      void speak(randomRetry());
      window.setTimeout(() => {
        setCozum('bos');
        setSeciliSol(null);
        setSeciliSag(null);
        setHataCifti(null);
      }, 1600);
    }
  };

  const kartStateOf = (id: string): ChoiceState => {
    if (cozum === 'dogru') return 'bos';
    if (kartEslesti(id)) return 'tekrar'; // soluk, kullanılmış
    if (cozum === 'tekrar' && hataCifti?.includes(id)) return 'tekrar';
    if (id === seciliSol || id === seciliSag) return 'secili';
    return 'bos';
  };

  const scene = exercise.prompt.gorsel;

  return (
    <GameShell
      accent={accent.hex}
      stimulus={
        scene ? (
          <div style={{ transform: 'scale(var(--scale,1))', transformOrigin: 'center' }}>
            <Visual spec={scene} width={400} height={120} />
          </div>
        ) : null
      }
      interaction={
        <>
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', alignItems: 'flex-start' }}>
            {/* Sol sütun */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-gap)' }}>
              {solKartlar.map((o) => (
                <ChoiceCard
                  key={o.id}
                  option={o}
                  size={100}
                  state={kartStateOf(o.id)}
                  onSelect={() => handleSol(o.id)}
                />
              ))}
            </div>
            {/* Sağ sütun */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-gap)' }}>
              {sagKartlar.map((o) => (
                <ChoiceCard
                  key={o.id}
                  option={o}
                  size={100}
                  state={kartStateOf(o.id)}
                  onSelect={() => handleSag(o.id)}
                />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--size-gap)', alignItems: 'center' }}>
            <SpeakButton />
          </div>
        </>
      }
    />
  );
}
