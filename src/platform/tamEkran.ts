/** Tam ekran (plan v2 Adım 28). Yerel API; ağ ve depolama yok. Kullanıcı jestinin İÇİNDEN çağrılmalı. */
export type TamEkranSonucu = 'acildi' | 'desteklenmiyor' | 'reddedildi';

export function tamEkranDestekleniyorMu(): boolean {
  return typeof document !== 'undefined' && typeof document.documentElement?.requestFullscreen === 'function';
}

export async function tamEkranIste(): Promise<TamEkranSonucu> {
  if (!tamEkranDestekleniyorMu()) return 'desteklenmiyor';
  try {
    await document.documentElement.requestFullscreen();
    return 'acildi';
  } catch {
    return 'reddedildi';
  }
}

export async function tamEkrandanCik(): Promise<void> {
  try {
    if (typeof document !== 'undefined' && document.fullscreenElement) await document.exitFullscreen();
  } catch {
    /* sessizce geç */
  }
}
