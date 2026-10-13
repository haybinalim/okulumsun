/**
 * TEMA SONU TURU (plan v2 Adım 46 aşama 2, KG-67): temanın becerilerini dolaşan 8–10 soru →
 * çocuğa kutlama → yetişkine düğüm başına nitel düzey (ders özeti eşikleri). Tahta ve kişisel modda aynı.
 *
 * Olaylar YALNIZ bu bileşenin durumunda yaşar; tur kapanınca silinir (saklama yok, puan/skor yok,
 * sayı/yüzde gösterilmez). `tematuru.basliyor` / `tematuru.bitti` klipleri Adım 31'de üretilecek;
 * o zamana kadar mevcut `ui.oturum-bitti` klibi kullanılır.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { useAppStore, accentBul, TEMALAR } from '../../store/appStore';
import { setSorusu } from '../../ogretmen/gunlukSet';
import { setSorusuUret } from '../../ogretmen/tahtaSorusu';
import { dersOlayiUret, type DersOlayi, type RahatlikDuzeyi } from '../../ogretmen/dersOzeti';
import { temaTuruOzeti, type TemaTuruPlani } from '../../ogretmen/temaTuru';
import { skillsData } from '../../content/skillsData';
import { REGISTRY } from '../../exercises/registry';
import { ExerciseScreen } from './ExerciseScreen';
import { Maskot } from '../feedback/Maskot';
import { OturumSonuKutlama } from '../feedback/Celebration';
import { BigButton } from '../primitives/BigButton';
import { useScreenSpeech } from '../../audio/useSpeak';
import { COLOR, SIZE } from '../../design/tokens';

const KAYITLI = (t: string): boolean => REGISTRY.has(t);

const DUZEY_METNI: Record<RahatlikDuzeyi, { simge: string; metin: string }> = {
  rahat: { simge: '●', metin: 'Rahat' },
  destekle: { simge: '◐', metin: 'Biraz destek gerekti' },
  zorlandi: { simge: '▲', metin: 'Tekrar çalışılabilir' },
};

function TemaTuru({ tema, plan }: { tema: number; plan: TemaTuruPlani }) {
  const accent = accentBul(useAppStore((s) => s.accentId));
  const kapat = useAppStore((s) => s.temaTuruKapat);
  const [sira, setSira] = useState(0);
  const [olaylar, setOlaylar] = useState<readonly DersOlayi[]>([]);
  const yanlisVar = useRef(false);
  const exercise = useMemo(
    () => (sira < plan.maddeSayisi ? setSorusuUret(setSorusu(plan, sira, KAYITLI)) : null),
    [plan, sira],
  );

  if (exercise === null) return <TemaTuruSonu tema={tema} plan={plan} olaylar={olaylar} onKapat={kapat} />;
  return (
    <div data-tur-sira={sira} style={{ height: '100%' }}>
      <ExerciseScreen
        key={`tur-${sira}-${exercise.itemId}`}
        exercise={exercise}
        accent={accent}
        onYanlis={() => {
          yanlisVar.current = true;
        }}
        onDone={(sonuc) => {
          const olay = dersOlayiUret(exercise.skillIds[0], sonuc, yanlisVar.current);
          yanlisVar.current = false;
          setOlaylar((o) => [...o, olay]);
          setSira((s) => s + 1);
        }}
      />
      {/* Yetişkin çıkışı: bilerek küçük ve soluk, üst köşede ("Seti bitir" gibi). */}
      <button
        type="button"
        data-yetiskin=""
        aria-label="Turu bitir"
        onClick={kapat}
        style={{
          position: 'fixed',
          top: 8,
          right: 8,
          minWidth: 44,
          minHeight: 44,
          padding: '0 12px',
          border: 'none',
          borderRadius: 8,
          background: 'transparent',
          color: 'var(--color-ink)',
          opacity: 0.5,
          cursor: 'pointer',
          fontSize: 'var(--text-adult)',
          zIndex: 5,
        }}
      >
        Turu bitir
      </button>
    </div>
  );
}

export function TemaTuruSonu({
  tema,
  plan,
  olaylar,
  onKapat,
}: {
  tema: number;
  plan: TemaTuruPlani;
  olaylar: readonly DersOlayi[];
  onKapat: () => void;
}) {
  const [kutlama, setKutlama] = useState(true);
  const [yetiskin, setYetiskin] = useState(false);
  const atla = useCallback(() => setKutlama(false), []);
  useScreenSpeech({ kind: 'key', key: 'ui.oturum-bitti' }, []);
  const ozet = useMemo(() => temaTuruOzeti(plan, olaylar, skillsData), [plan, olaylar]);
  const temaAdi = TEMALAR.find((t) => t.no === tema)?.ad ?? `Tema ${tema}`;

  if (yetiskin) {
    return (
      <main
        aria-labelledby="tema-turu-ozet-baslik"
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: COLOR.bg,
          padding: 'var(--size-edge)',
          paddingBottom: SIZE.edgeBottom,
          gap: 12,
          overflow: 'auto',
        }}
      >
        <h1 id="tema-turu-ozet-baslik" style={{ margin: 0, fontSize: 'var(--text-ui)', color: COLOR.ink }}>
          Tema turu: {temaAdi}
        </h1>
        <p style={{ margin: 0, fontSize: 'var(--text-adult)', color: COLOR.inkSoft }}>
          Her beceri bu turda çoğunlukla tek soruyla görüldü; düzey bir gözlemdir, not değildir. Hiçbir şey kaydedilmez.
        </p>
        <ul
          aria-label="Beceri düzeyleri"
          style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}
        >
          {ozet.map((d) => (
            <li
              key={d.skillId}
              data-testid="tur-duzey"
              data-duzey={d.duzey}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                padding: '8px 12px',
                borderRadius: 8,
                background: COLOR.surface,
                border: `1px solid ${COLOR.border}`,
                color: COLOR.ink,
                fontSize: 'var(--text-adult)',
              }}
            >
              <span>{d.baslik}</span>
              <span>
                <span aria-hidden="true">{DUZEY_METNI[d.duzey].simge} </span>
                {DUZEY_METNI[d.duzey].metin}
              </span>
            </li>
          ))}
        </ul>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'auto' }}>
          <BigButton label="Bitti" size="control" variant="accent" onPress={onKapat} style={{ padding: '0 32px' }}>
            Bitti
          </BigButton>
        </div>
      </main>
    );
  }

  return (
    <main
      aria-label="Tema turu bitti"
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
      {/* Kutlama bittikten (≤2 sn veya dokununca) sonra yetişkin düğmesi görünür. */}
      <section style={{ display: 'flex', justifyContent: 'center', minHeight: 'var(--size-control, 102px)' }}>
        {!kutlama && (
          <BigButton
            label="Yetişkin: tur özetini aç"
            size="control"
            variant="accent"
            onPress={() => setYetiskin(true)}
            style={{ padding: '0 24px', fontSize: 'var(--text-adult)' }}
          >
            🧑‍🏫 Tur özeti
          </BigButton>
        )}
      </section>
      <OturumSonuKutlama aktif={kutlama} onAtla={atla} />
    </main>
  );
}

export default TemaTuru;
