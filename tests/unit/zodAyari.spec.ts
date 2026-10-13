/**
 * CSP koruması (plan v2 Adım 22, KG-64): zod kullanan her kaynak dosya `zodAyari`'nı ilk içe aktarım olarak alır.
 * Aksi hâlde derleyici şemaları paylaşılan bir parçaya taşıdığında `jitless` ayarı geç kalır ve zod'un
 * `Function("")` yoklaması üretimde `script-src` CSP ihlali üretir.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const KOK = path.resolve(__dirname, '../../src');

function dosyalar(dizin: string): string[] {
  return readdirSync(dizin).flatMap((ad) => {
    const p = path.join(dizin, ad);
    return statSync(p).isDirectory() ? dosyalar(p) : /\.(ts|tsx)$/.test(ad) ? [p] : [];
  });
}

describe('zod jitless ayarı', () => {
  it("zod içe aktaran her dosya önce './zodAyari' (veya kendisi) içe aktarır", () => {
    const eksik: string[] = [];
    for (const f of dosyalar(KOK)) {
      const s = readFileSync(f, 'utf8');
      if (!/from 'zod'/.test(s) || f.endsWith('zodAyari.ts')) continue;
      const ilk = /^import\s[^;]*;/m.exec(s)?.[0] ?? '';
      if (!/zodAyari/.test(ilk)) eksik.push(path.relative(KOK, f));
    }
    expect(eksik).toEqual([]);
  });
});
