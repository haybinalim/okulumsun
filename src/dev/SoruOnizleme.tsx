/**
 * SORU ÖNİZLEMESİ — YALNIZ GELİŞTİRME (KG-127).
 *
 * `vite dev` altında `?gelistirme=soru&sablon=M-PARA-TANI&tohum=1&zorluk=3&device=board` ile kayıt defterindeki
 * herhangi bir şablonun bir sorusunu ExerciseScreen'de açar. Önce "Sesi aç" (ses kilidi, kullanıcı jesti) gerekir;
 * e2e (tests/e2e/soru-hoparloru.spec.ts) soru hoparlörünü, klip alımını (`alinanKlipler`) ve geometriyi bununla
 * denetler. Üretim derlemesinde `import.meta.env.DEV` `false` olduğundan bu modül paketlenmez. Hiçbir şey saklanmaz.
 */
import { useMemo, useState } from 'react';
import { useDeviceProfile } from '../design/useDeviceProfile';
import { ACCENTS } from '../design/tokens';
import { createRng } from '../exercises/rng';
import { REGISTRY } from '../exercises/registry';
import type { TemplateId } from '../exercises/types';
import { ExerciseScreen } from '../ui/screens/ExerciseScreen';
import { speech } from '../audio/speech';

export function SoruOnizleme() {
  const { profile } = useDeviceProfile();
  const p = new URLSearchParams(location.search);
  const sablon = (p.get('sablon') ?? 'M-PARA-TANI') as TemplateId;
  const tohum = Number(p.get('tohum') ?? '1');
  const zorluk = Number(p.get('zorluk') ?? '3');
  const [acik, setAcik] = useState(false);
  const exercise = useMemo(() => {
    const g = REGISTRY.get(sablon);
    if (!g) return null;
    const [lo, hi] = g.zorlukAraligi;
    const d = Math.min(hi, Math.max(lo, zorluk));
    return g.uret({ seed: tohum, difficulty: d, mod: profile === 'board' ? 'tahta' : 'kisisel' } as never, createRng(tohum));
  }, [sablon, tohum, zorluk, profile]);
  if (!exercise) return <p>Şablon yok: {sablon}</p>;
  const a = ACCENTS[0];
  if (!acik) {
    return (
      <button
        type="button"
        data-harness=""
        style={{ margin: 40, fontSize: 32, padding: 24 }}
        onClick={() => {
          void speech.prime();
          setAcik(true);
        }}
      >
        Sesi aç
      </button>
    );
  }
  return (
    <div style={{ height: '100dvh' }} data-soru-onizleme={exercise.templateId}>
      <ExerciseScreen exercise={exercise} accent={{ id: a.id, hex: a.hex, speechKey: a.speechKey }} onDone={() => undefined} />
    </div>
  );
}
