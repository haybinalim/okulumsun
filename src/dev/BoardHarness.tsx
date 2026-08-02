import { useEffect, useState, type ReactNode } from 'react';
import { REACH, SCALE, SIZE } from '../design/tokens';
import type { DeviceProfile } from '../design/deviceProfile';

/**
 * Akıllı tahta simülasyon aracı — YALNIZ geliştirmede.
 *
 * Fiziksel akıllı tahtaya ~1 ay erişim yok. Bu araç, erişim bölgesi kuralının
 * o süre boyunca sessizce ihlal edilmesini engelliyor:
 *
 *  - Üst %35 (çocuğun ulaşamayacağı bölge) kırmızı bantla çizilir.
 *  - O bölgedeki her interaktif öğe kırmızıyla çerçevelenir ve sayılır.
 *  - Ölçek küçültme, sınıfın arkasından (≈6 m) okunabilirliği taklit eder.
 *
 * `?harness=1` ile açılır, `H` tuşuyla açılıp kapanır.
 * Üretim derlemesinde `import.meta.env.DEV` sayesinde tamamen elenir.
 */

interface Violation {
  label: string;
  reason: string;
  rect: DOMRect;
}

/**
 * `board` profilinde bir dokunma hedefinin minimum boyutu.
 *
 * `applyProfile` CSS değişkenlerini tam piksele yuvarladığı için eşik de
 * yuvarlanmalı — yoksa tam sınırdaki her buton (102 vs 102.4) yanlış pozitif
 * verir ve gerçek ihlaller gürültüde kaybolur.
 *
 * Ayrıca alt piksel yerleşim farkları için 1px tolerans var: bir öğe
 * `getBoundingClientRect` ile 101.99px ölçülebilir ama ihlal değildir.
 */
const MIN_TARGET_BOARD = Math.round(SIZE.tapMin * SCALE.board);
const SUBPIXEL_TOLERANCE = 1;

export function BoardHarness({
  children,
  profile,
}: {
  children: ReactNode;
  profile: DeviceProfile;
}) {
  const [on, setOn] = useState(
    () => new URLSearchParams(window.location.search).get('harness') === '1',
  );
  const [zoom, setZoom] = useState(1);
  const [violations, setViolations] = useState<Violation[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') setOn((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!on) {
      setViolations([]);
      return;
    }
    const scan = () => setViolations(findViolations(profile));
    scan();
    // Ekran değiştikçe yeniden tara. Playwright testi aynı mantığı bağımsız
    // uygular; bu araç geliştirici için görsel karşılığı.
    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true });
    const t = setInterval(scan, 1000);
    return () => {
      observer.disconnect();
      clearInterval(t);
    };
  }, [on, profile]);

  if (!on) return <>{children}</>;

  const deadTopPx = window.innerHeight * REACH.deadTopRatio;

  return (
    <>
      <div
        style={{
          height: '100%',
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
          width: `${100 / zoom}%`,
        }}
      >
        {children}
      </div>

      {/* Erişilemez üst bölge */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: deadTopPx,
          background: 'rgba(220, 38, 38, 0.13)',
          borderBottom: '3px dashed rgba(220, 38, 38, 0.75)',
          pointerEvents: 'none',
          zIndex: 9998,
        }}
      >
        <span
          style={{
            position: 'absolute',
            bottom: 6,
            left: 12,
            font: '600 13px system-ui',
            color: '#991b1b',
            letterSpacing: 0,
          }}
        >
          Çocuğun ulaşamadığı bölge — üst %{Math.round(REACH.deadTopRatio * 100)} · burada
          dokunulabilir öğe olamaz
        </span>
      </div>

      {/* İhlal çerçeveleri */}
      {violations.map((v, i) => (
        <div
          key={i}
          aria-hidden
          style={{
            position: 'fixed',
            top: v.rect.top,
            left: v.rect.left,
            width: v.rect.width,
            height: v.rect.height,
            border: '3px solid #dc2626',
            background: 'rgba(220, 38, 38, 0.2)',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        />
      ))}

      <ControlPanel
        profile={profile}
        zoom={zoom}
        setZoom={setZoom}
        violations={violations}
        onClose={() => setOn(false)}
      />
    </>
  );
}

function ControlPanel({
  profile,
  zoom,
  setZoom,
  violations,
  onClose,
}: {
  profile: DeviceProfile;
  zoom: number;
  setZoom: (z: number) => void;
  violations: Violation[];
  onClose: () => void;
}) {
  const ok = violations.length === 0;
  return (
    <div
      data-harness
      style={{
        position: 'fixed',
        right: 12,
        bottom: 12,
        zIndex: 10000,
        background: '#111',
        color: '#eee',
        font: '13px/1.45 system-ui',
        letterSpacing: 0,
        padding: '12px 14px',
        borderRadius: 10,
        width: 290,
        boxShadow: '0 8px 24px rgba(0,0,0,.4)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <strong>Tahta Denetimi</strong>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}
        >
          kapat (H)
        </button>
      </div>

      <div style={{ color: '#aaa' }}>
        profil: <b style={{ color: '#eee' }}>{profile}</b> · {window.innerWidth}×
        {window.innerHeight}
      </div>
      {profile !== 'board' && (
        <div style={{ color: '#fbbf24', marginTop: 6 }}>
          Tahta profilinde değilsin — <code>?device=board</code> ekle.
        </div>
      )}

      <div
        style={{
          margin: '10px 0',
          padding: '8px 10px',
          borderRadius: 6,
          background: ok ? '#064e3b' : '#7f1d1d',
        }}
      >
        {ok ? '✓ İhlal yok' : `✕ ${violations.length} ihlal`}
        {!ok && (
          <ul style={{ margin: '6px 0 0', paddingLeft: 16 }}>
            {violations.slice(0, 6).map((v, i) => (
              <li key={i}>
                <b>{v.label || '(etiketsiz)'}</b> — {v.reason}
              </li>
            ))}
          </ul>
        )}
      </div>

      <label style={{ display: 'block', color: '#aaa' }}>
        Uzaklık simülasyonu: %{Math.round(zoom * 100)}
        <input
          type="range"
          min={20}
          max={100}
          value={zoom * 100}
          onChange={(e) => setZoom(Number(e.target.value) / 100)}
          style={{ width: '100%' }}
        />
      </label>
      <div style={{ color: '#777', fontSize: 12 }}>
        %25'e indir: sınıfın arkasından (≈6 m) hâlâ okunuyor mu?
      </div>
    </div>
  );
}

/**
 * İhlal taraması. Playwright testi (tests/e2e/board-geometry.spec.ts) aynı iki
 * kuralı bağımsız olarak uygular — bu fonksiyon geliştirici geri bildirimi için.
 */
function findViolations(profile: DeviceProfile): Violation[] {
  if (profile !== 'board') return [];

  const deadTop = window.innerHeight * REACH.deadTopRatio;
  const out: Violation[] = [];

  const nodes = document.querySelectorAll<HTMLElement>(
    'button, a, input, select, [role="button"], [tabindex]:not([tabindex="-1"])',
  );

  for (const el of nodes) {
    // Denetim aracının kendi arayüzünü sayma.
    if (el.closest('[data-harness]')) continue;

    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;

    const label = el.getAttribute('aria-label') ?? el.textContent?.trim().slice(0, 24) ?? '';

    // Ölçüt merkez, üst kenar değil: çocuk büyük bir butonun kenarına değil
    // ortasına nişan alır. (Aynı kural tests/e2e/board-geometry.spec.ts'te.)
    if (r.top + r.height / 2 < deadTop) {
      out.push({ label, reason: 'erişilemez bölgede', rect: r });
      continue;
    }
    const min = MIN_TARGET_BOARD - SUBPIXEL_TOLERANCE;
    if (r.width < min || r.height < min) {
      out.push({
        label,
        reason: `çok küçük (${Math.round(r.width)}×${Math.round(r.height)}, min ${MIN_TARGET_BOARD})`,
        rect: r,
      });
    }
  }

  return out;
}
