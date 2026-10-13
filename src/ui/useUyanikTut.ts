import { useEffect } from 'react';
import { uyanikTut } from '../platform/uyanikTut';

const KILITLI_EKRANLAR = new Set(['alistirma', 'konuSecimi', 'temaGirisi', 'sinifTuru', 'sinifTuruSonu', 'temaTuru']);

/** Ders ekranlarında ekranı uyanık tutar; ana ekran ve yetişkin ekranlarında bırakır. */
export function useUyanikTut(ekran: string): void {
  const gerekli = KILITLI_EKRANLAR.has(ekran);
  useEffect(() => {
    if (!gerekli) return;
    let iptal = false;
    let tutucu: Awaited<ReturnType<typeof uyanikTut>> | null = null;
    void uyanikTut().then((t) => {
      if (iptal) void t.birak();
      else tutucu = t;
    });
    return () => {
      iptal = true;
      void tutucu?.birak();
    };
  }, [gerekli]);
}
