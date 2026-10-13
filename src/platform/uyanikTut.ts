/** Ekran uyanık tutma (Wake Lock, plan v2 Adım 28). Yerel API; ağ ve depolama yok. */
export interface UyanikTutucu {
  readonly durum: () => 'aktif' | 'pasif' | 'desteklenmiyor';
  readonly birak: () => Promise<void>;
}

interface KilitBenzeri {
  release: () => Promise<void>;
  addEventListener?: (t: string, f: () => void) => void;
}

export async function uyanikTut(): Promise<UyanikTutucu> {
  const wl = typeof navigator !== 'undefined'
    ? (navigator as unknown as { wakeLock?: { request: (t: 'screen') => Promise<KilitBenzeri> } }).wakeLock
    : undefined;
  if (!wl) return { durum: () => 'desteklenmiyor', birak: async () => {} };

  let kilit: KilitBenzeri | null = null;
  let birakildi = false;
  const iste = async () => {
    try {
      kilit = await wl.request('screen');
    } catch {
      kilit = null;
    }
  };
  const gorunurOlunca = () => {
    if (!birakildi && document.visibilityState === 'visible') void iste();
  };
  document.addEventListener('visibilitychange', gorunurOlunca);
  await iste();

  return {
    durum: () => (!birakildi && kilit ? 'aktif' : 'pasif'),
    birak: async () => {
      birakildi = true;
      document.removeEventListener('visibilitychange', gorunurOlunca);
      const k = kilit;
      kilit = null;
      try {
        await k?.release();
      } catch {
        /* sessizce geç */
      }
    },
  };
}
