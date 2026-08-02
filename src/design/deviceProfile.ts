/**
 * Cihaz profili tespiti ve CSS değişken üretimi.
 *
 * Öncelik sırası (plan bağlamı): akıllı tahta > tablet > telefon.
 *
 * Otomatik tespit tek başına güvenilmez — bazı akıllı tahtalar 1920x1080 bildirir
 * ama fiziksel olarak 86"tir, bazı masaüstü ekranlar da aynı çözünürlüğü bildirir.
 * Bu yüzden üç kaynak var, sırayla:
 *   1. `?device=` URL parametresi  (geliştirme ve otomatik test)
 *   2. Kullanıcı ayarı            (öğretmen "Tahta modu"nu elle açar)
 *   3. Otomatik tespit            (son çare)
 */

import { SCALE, SIZE, TEXT, COLOR, REACH, type DeviceProfile } from './tokens';

export type { DeviceProfile };

const STORAGE_KEY = 'okulumsun.deviceOverride';
const VALID: readonly DeviceProfile[] = ['board', 'tablet', 'phone'];

function isValid(v: string | null): v is DeviceProfile {
  return v !== null && (VALID as readonly string[]).includes(v);
}

/** URL'deki `?device=board` — geliştirme ve Playwright testleri için. */
export function readUrlOverride(): DeviceProfile | null {
  if (typeof window === 'undefined') return null;
  const v = new URLSearchParams(window.location.search).get('device');
  return isValid(v) ? v : null;
}

/** Ayarlardan gelen kalıcı geçersiz kılma. */
export function readStoredOverride(): DeviceProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return isValid(v) ? v : null;
  } catch {
    // Gizli sekmede localStorage erişimi hata verebilir; tespit yine çalışsın.
    return null;
  }
}

export function storeOverride(profile: DeviceProfile | null): void {
  try {
    if (profile === null) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, profile);
  } catch {
    // Sessizce geç — geçersiz kılma kaydedilemezse otomatik tespit devreye girer.
  }
}

/**
 * Otomatik tespit.
 *
 * `board` için genişlik TEK BAŞINA yeterli değil: 1920px bir masaüstü monitör de
 * olabilir. Kaba işaretçi (parmak) şartı, fare kullanan masaüstünü eler.
 * Akıllı tahtalar dokunmatik olduğu için `pointer: coarse` bildirir.
 */
export function detectProfile(): DeviceProfile {
  if (typeof window === 'undefined') return 'tablet';

  const w = window.innerWidth;
  if (w < 768) return 'phone';

  if (w >= 1600) {
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const noHover = window.matchMedia('(hover: none)').matches;
    if (coarse || noHover) return 'board';
  }

  return 'tablet';
}

/** Nihai profil — geçersiz kılmalar tespitten önce gelir. */
export function resolveProfile(): DeviceProfile {
  return readUrlOverride() ?? readStoredOverride() ?? detectProfile();
}

/**
 * Profili CSS özel değişkenlerine yayar.
 *
 * Bileşenler ham piksel yazmaz; `var(--size-control)` gibi değişkenler kullanır.
 * Böylece 2. aydaki fiziksel tahta testinden sonra ölçek ayarı tek dosyadan yapılır.
 */
export function applyProfile(profile: DeviceProfile, root: HTMLElement): void {
  const k = SCALE[profile];
  const px = (n: number) => `${Math.round(n * k)}px`;

  root.dataset.device = profile;

  for (const [name, value] of Object.entries(SIZE)) {
    root.style.setProperty(`--size-${kebab(name)}`, px(value));
  }
  for (const [name, value] of Object.entries(TEXT)) {
    root.style.setProperty(`--text-${kebab(name)}`, px(value));
  }
  for (const [name, value] of Object.entries(COLOR)) {
    root.style.setProperty(`--color-${kebab(name)}`, value);
  }

  root.style.setProperty('--scale', String(k));
  root.style.setProperty('--reach-dead-top', `${REACH.deadTopRatio * 100}%`);
}

function kebab(s: string): string {
  return s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}
