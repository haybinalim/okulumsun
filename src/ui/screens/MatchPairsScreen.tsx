/**
 * MATCH_PAIRS ekranı — soldan karta, sağdan eşine dokun.
 *
 * M-TERS-ISLEM ve M-GEO-ESLE için. Sol sütun ve sağ sütun kartları
 * ayrı ayrı listelenir. Çocuk önce sol kartı seçer, sonra sağ kartı.
 * Eşleşirse çift kaldırılır (yeşil). Tüm çiftler bulununca tamamlandı.
 *
 * validation.ciftler: [solOptionId, sagOptionId] çiftleri.
 *
 * KG-128: varsayılan iki sütun (her kart ≥ `--size-choice`) alt alana sığmıyorsa — tahtada da tablette de
 * 3 + 3 / 3 + 5 kart sığmıyor, kartlar üst %35'e, hoparlörün üstüne ve ekran dışına taşıyordu — düzen ölçülür:
 * sütun ya da SATIR (üstte sol grup, altta sağ grup), kart en büyük sığan boy (`eslestirmeDuzeni`).
 */

import { useRef, useState, type ReactNode } from 'react';
import { useEslestirmeDuzeni } from '../secenekKartBoyu';
import { GameShell } from '../layout/GameShell';
import { ChoiceCard, type ChoiceState } from '../primitives/ChoiceCard';
import { SpeakButton } from '../primitives/SpeakButton';
import { Visual } from '../svg/Visual';
import { useScreenSpeech, speak } from '../../audio/useSpeak';
import { useGeriBildirim } from '../useGeriBildirim';
import type { MatchPairsExercise, EslesmeKarti } from '../../exercises/types';
import type { Vurgu } from '../../design/tokens';
import { BILGISIZ_YANLIS, type YanlisBilgisi } from '../../progress/basitMaddeSonucu';

export function MatchPairsScreen({
  exercise,
  accent,
  onDone,
  onYanlis,
}: {
  exercise: MatchPairsExercise;
  accent: Vurgu;
  onDone: (dogruMu: boolean) => void;
  /** Adım 36: her yanlış denemede (Sınıf Turu ikinci yanlışı sayar). */
  onYanlis?: (bilgi: YanlisBilgisi) => void;
}) {
  useScreenSpeech(exercise.prompt.ses, [exercise.itemId], exercise.prompt.tekrarSes);
  const geriBildirim = useGeriBildirim(exercise.itemId);

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
        void speak(geriBildirim.ovgu());
        window.setTimeout(() => onDone(true), 900);
      }
    } else {
      // Yanlış eşleşme
      setHataCifti([seciliSol, id]);
      setCozum('tekrar');
      void speak(geriBildirim.tekrar());
      onYanlis?.(BILGISIZ_YANLIS);
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
  const kartAlani = useRef<HTMLDivElement>(null);
  const duzen = useEslestirmeDuzeni(kartAlani, solKartlar.length, sagKartlar.length);

  /** Bir taraf: varsayılan/sütun düzeninde dikey, satır düzeninde yatay. */
  const grup = (kartlar: EslesmeKarti[], sec: (id: string) => void, taraf: 'sol' | 'sag'): ReactNode => (
    <div
      data-taraf={taraf}
      style={{
        display: 'flex',
        flexDirection: duzen?.yon === 'satir' ? 'row' : 'column',
        gap: 'var(--size-gap)',
        justifyContent: 'center',
      }}
    >
      {kartlar.map((o) => (
        <ChoiceCard
          key={o.id}
          option={o}
          size={duzen?.kart ?? 100}
          sabitBoyut={duzen !== null}
          state={kartStateOf(o.id)}
          onSelect={() => sec(o.id)}
        />
      ))}
    </div>
  );

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
          <div
            ref={kartAlani}
            data-eslestirme={duzen?.yon ?? 'varsayilan'}
            data-kart={duzen?.kart}
            style={
              duzen
                ? { display: 'flex', flexDirection: duzen.yon === 'satir' ? 'column' : 'row', gap: 'var(--size-gap)', alignItems: 'center' }
                : { display: 'flex', gap: '2rem', justifyContent: 'center', alignItems: 'flex-start' }
            }
          >
            {grup(solKartlar, handleSol, 'sol')}
            {grup(sagKartlar, handleSag, 'sag')}
          </div>
          <div className="alt-cubuk" style={{ display: 'flex', gap: 'var(--size-gap)', alignItems: 'center' }}>
            <SpeakButton />
          </div>
        </>
      }
    />
  );
}
