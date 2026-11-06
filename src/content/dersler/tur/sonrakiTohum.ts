/** SAF (Okuma Yazma Adım 79): etkinlik ekranında "Sonraki" tohumu. */
import { turSoruUret } from './sablonlar';
import { TurUretimHatasi, type TurSablonKodu, type TurUretimGirdisi } from './sablonlar/turSoru';

/**
 * "Sonraki" için tohum (Adım 79): aynı hedef (sözcük/harf/hece) art arda gelmesin. Tohumdan deterministik: sırayla
 * tohum + 1 … tohum + 6 denenir, hedefi değişen ilk tohum; hiçbiri değiştirmezse (küme çok darsa) tohum + 1.
 */
export function sonrakiTohum(sablon: TurSablonKodu, g: TurUretimGirdisi, hedef: string): number {
  for (let t = g.tohum + 1; t <= g.tohum + 6; t++) {
    try {
      if (turSoruUret(sablon, { ...g, tohum: t }).hedefMetin !== hedef) return t;
    } catch (e) {
      if (!(e instanceof TurUretimHatasi)) throw e;
    }
  }
  return g.tohum + 1;
}
