/**
 * EVDE ÇALIŞ (plan v2 Adım 42 aşama 2, ADR-0010): öğretmenin gönderdiği bağlantıyla açılan çocuk akışı.
 *
 * Ses kilidi → set tabanlı 8 soru (adaptif DEĞİL; `setSorusu` sırası) → kutlama → [Ev] mod seçimine döner.
 * Hiçbir şey saklanmaz: set yalnız bellekte, sonuçlar tutulmaz (puan/skor yok). Sesler (KG-110): ilk soru
 * "Okulda çalıştığımız konuyu evde de oynayalım." ile açılır; sonda "Bugünkü ev çalışmasını bitirdin!",
 * veli başlattıysa ardından "Şimdi telefonu bir büyüğüne ver.".
 */
import { useVurgu } from '../../design/useVurgu';
import { useCallback, useMemo, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { setSorusu, type GunlukSet } from '../../ogretmen/gunlukSet';
import { setSorusuUret } from '../../ogretmen/tahtaSorusu';
import { REGISTRY } from '../../exercises/registry';
import { ExerciseScreen } from './ExerciseScreen';
import { Maskot } from '../feedback/Maskot';
import { OturumSonuKutlama } from '../feedback/Celebration';
import { BigButton } from '../primitives/BigButton';
import { useScreenSpeech } from '../../audio/useSpeak';
import { evSonuSesi, girisliSoru } from '../../audio/girisSesi';
import { COLOR, SIZE } from '../../design/tokens';

/** Ev çalışmasının soru sayısı (plan v2 Adım 42: 8 soruluk oturum). */
export const EV_SORU_SAYISI = 8;

export function EvdeCalis({ set }: { set: GunlukSet }) {
  const accent = useVurgu();
  const evCalismasiniBitir = useAppStore((s) => s.evCalismasiniBitir);
  const evIpucunaGec = useAppStore((s) => s.evIpucunaGec);
  // Adım 43: veli "Evde 10 dakika" başlattıysa sonda ipucu kartına geçilir.
  const veliBaslatti = useAppStore((s) => s.evdeOnDakikaTema !== null);
  const [sira, setSira] = useState(0);
  const exercise = useMemo(
    () =>
      sira < EV_SORU_SAYISI
        ? girisliSoru(setSorusuUret(setSorusu(set, sira, (t) => REGISTRY.has(t))), sira === 0 ? 'ev.okuldaki-konu' : null)
        : null,
    [set, sira],
  );

  if (exercise === null)
    return veliBaslatti ? <EvdeCalisSonu onYetiskin={evIpucunaGec} /> : <EvdeCalisSonu onEv={evCalismasiniBitir} />;
  return (
    <div data-ev-sira={sira} style={{ height: '100%' }}>
      <ExerciseScreen
        key={`ev-${sira}-${exercise.itemId}`}
        exercise={exercise}
        accent={accent}
        onDone={() => setSira((s) => s + 1)}
      />
    </div>
  );
}

function EvdeCalisSonu({ onEv, onYetiskin }: { onEv?: () => void; onYetiskin?: () => void }) {
  const [kutlama, setKutlama] = useState(true);
  const atla = useCallback(() => setKutlama(false), []);
  useScreenSpeech(evSonuSesi(onYetiskin !== undefined), []);
  return (
    <main
      aria-label="Ev çalışması bitti"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: COLOR.bg,
        padding: 'var(--size-edge)',
        paddingBottom: SIZE.edgeBottom,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        <Maskot durum="sevinmis" size={140} />
      </div>
      {/* [Ev] kutlama bittikten (≤2 sn veya dokununca) sonra görünür — OturumSonu ile aynı. */}
      <section style={{ display: 'flex', justifyContent: 'center', minHeight: 'var(--size-control, 102px)' }}>
        {!kutlama && onEv && (
          <BigButton label="Ev" size="control" variant="accent" onPress={onEv}>
            🏠
          </BigButton>
        )}
        {/* Adım 43: telefon bir büyüğe verilir; düğme yetişkin içindir (sesli yönlendirme `ev.yetiskine-ver`). */}
        {!kutlama && onYetiskin && (
          <BigButton
            label="Yetişkin: ipucu kartını aç"
            size="control"
            variant="accent"
            onPress={onYetiskin}
            style={{ padding: '0 24px', fontSize: 'var(--text-adult)' }}
          >
            🧑‍🤝‍🧑 İpucu kartı
          </BigButton>
        )}
      </section>
      <OturumSonuKutlama aktif={kutlama} onAtla={atla} />
    </main>
  );
}
