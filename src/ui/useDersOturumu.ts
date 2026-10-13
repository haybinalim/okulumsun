/**
 * DERS OTURUMU — tahtada biriken olaylar yalnız bellekte (plan v2 Adım 40 aşama 2).
 * Depolama yok, çocuk kimliği yok; `dersiKapat` ve mod değişimi temizler.
 */
import { create } from 'zustand';
import type { DersOlayi } from '../ogretmen/dersOzeti';

interface DersOturumuDurumu {
  readonly olaylar: readonly DersOlayi[];
  kaydet: (olay: DersOlayi) => void;
  dersiKapat: () => void;
}

export const useDersOturumu = create<DersOturumuDurumu>((set) => ({
  olaylar: [],
  kaydet: (olay) => set((s) => ({ olaylar: [...s.olaylar, olay] })),
  dersiKapat: () => set({ olaylar: [] }),
}));
