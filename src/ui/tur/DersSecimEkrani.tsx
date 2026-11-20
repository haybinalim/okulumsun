/**
 * TAM EKRAN "DERS SEÇ" (Adım 83) — YALNIZ `VITE_DERS_TUR=1` derlemesinde, tembel parça.
 *
 * Okuma Yazma öğretmen girişini açar. Matematik kapıyı kapatır; uygulama mod seçiminden
 * sonra geldiği ana ekrana devam eder. Seçim yalnız bellekte (`dersKapisi.ts`).
 */
import { BigButton } from '../primitives/BigButton';
import { matematikSec } from './dersKapisi';
import { turEkraniAc } from './turEkraniDurumu';
import { Baslik, ekranStili } from './turOrtak';

const kart = {
  width: 'var(--size-choice)',
  height: 'var(--size-choice)',
  flexDirection: 'column',
  fontSize: 'var(--text-choice-label)',
} as const;

export default function DersSecimEkrani() {
  return (
    <main
      data-yetiskin=""
      data-ders-kapisi=""
      aria-label="Ders seç"
      style={{ ...ekranStili, justifyContent: 'space-between', background: 'var(--color-bg)' }}
    >
      <Baslik baslik="Ders seç" alt="Bugün hangi ders?" />
      <div
        role="group"
        aria-label="Ders"
        data-ders-secimi=""
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'calc(var(--size-gap) * 2)',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 'auto',
        }}
      >
        <BigButton
          label="Okuma Yazma"
          data-yetiskin=""
          size="choice"
          variant="accent"
          style={kart}
          onPress={() => turEkraniAc({ ekran: 'giris' })}
        >
          <span>Okuma Yazma</span>
        </BigButton>
        <BigButton
          label="Matematik"
          data-yetiskin=""
          size="choice"
          variant="solid"
          style={kart}
          onPress={matematikSec}
        >
          <span>Matematik</span>
        </BigButton>
      </div>
    </main>
  );
}
