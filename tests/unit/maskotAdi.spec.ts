/**
 * Maskotun adı — TEK KAYNAK (plan v2 Adım 54, KG-115). Ad yalnız `src/content/maskot.json`'da yazılır;
 * ses metinleri `{maskotAdi}` yer tutucusuyla, ekranlar `MASKOT_ADI` ile kullanır. Ad değişirse yalnız adın
 * geçtiği klipler yeniden üretilir.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import maskotJson from '../../src/content/maskot.json';
import trJson from '../../src/content/tr.json';
import { MASKOT_ADI } from '../../src/content/maskot';
import { ICERIK_DEGISKENLERI, klipleriTopla, yerTutuculariDoldur } from '../../scripts/ses/klipler';
import { anahtarliKlipOzeti, sesKaynagiDosyasiniAyir } from '../../scripts/ses/sesKaynagi';
import sesKaynagiJson from '../../src/content/sesKaynagi.json';

const KOK = path.resolve(__dirname, '../..');

describe('maskot adı tek kaynak', () => {
  it('maskot.json, MASKOT_ADI ve ses değişkeni aynı ad', () => {
    expect(typeof maskotJson.ad).toBe('string');
    expect(maskotJson.ad.trim().length).toBeGreaterThan(1);
    expect(MASKOT_ADI).toBe(maskotJson.ad);
    expect(ICERIK_DEGISKENLERI.maskotAdi).toBe(maskotJson.ad);
  });

  it('ad başka hiçbir kaynak dosyada düz yazılmaz (src/, scripts/, public/ manifest)', () => {
    const ad = maskotJson.ad;
    const dosyalar: string[] = [];
    const gez = (d: string) => {
      for (const x of readdirSync(d)) {
        const p = path.join(d, x);
        if (statSync(p).isDirectory()) gez(p);
        else if (/\.(ts|tsx|json|html|css|md)$/.test(x)) dosyalar.push(p);
      }
    };
    gez(path.join(KOK, 'src'));
    gez(path.join(KOK, 'scripts'));
    const ihlal = dosyalar
      .map((p) => path.relative(KOK, p).split(path.sep).join('/'))
      .filter((p) => p !== 'src/content/maskot.json')
      .filter((p) => readFileSync(path.join(KOK, p), 'utf8').includes(ad));
    expect(ihlal).toEqual([]);
  });

  it('maskot.selam yer tutucuyla yazılır ve klipte adla doldurulur', () => {
    expect((trJson as { maskot: { selam: string } }).maskot.selam).toContain('{maskotAdi}');
    const selam = klipleriTopla(trJson as Record<string, unknown>).find((c) => c.key === 'maskot.selam');
    expect(selam?.text).toBe(`Merhaba! Ben ${maskotJson.ad}.`);
  });

  it('hiçbir klip metninde doldurulmamış yer tutucu kalmaz', () => {
    for (const c of klipleriTopla(trJson as Record<string, unknown>)) expect(c.text, c.key).not.toMatch(/[{}]/);
  });

  it('bilinmeyen ya da boş yer tutucu hata verir', () => {
    expect(() => yerTutuculariDoldur('Ben {bilinmeyen}.', { maskotAdi: 'X' }, 'a.b')).toThrow(/bilinmeyen/);
    expect(() => yerTutuculariDoldur('Ben {maskotAdi}.', { maskotAdi: ' ' }, 'a.b')).toThrow(/boş/);
  });

  it('ad değişirse yalnız adın geçtiği klibin özeti değişir', () => {
    const { aktif, anahtarSesleri } = sesKaynagiDosyasiniAyir(sesKaynagiJson as Record<string, unknown>);
    const ozet = (deg: Record<string, string>) =>
      new Map(
        klipleriTopla(trJson as Record<string, unknown>, deg).map((c) => [
          c.key,
          anahtarliKlipOzeti(aktif, anahtarSesleri, c.key, c.text),
        ]),
      );
    const once = ozet({ maskotAdi: maskotJson.ad });
    const sonra = ozet({ maskotAdi: 'Pamuk' });
    const degisen = [...once.keys()].filter((k) => once.get(k) !== sonra.get(k));
    expect(degisen).toEqual(['maskot.selam']);
  });
});
