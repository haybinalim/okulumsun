/** Plan v2 Adım 44 aşama 2: Keşif Masası ekranının saf yardımcıları. */
import { describe, expect, it } from 'vitest';
import { EKRAN_ARACLARI, gosterilenSayi, pencereBaslangici } from '../../src/ui/kesif/kesifEkrani';
import { kesifBaslangic, kesifIndirge, type KesifDurumu } from '../../src/kesif/kesifMasasi';

const dokun = (d: KesifDurumu, ...h: string[]) => h.reduce((s, x) => kesifIndirge(s, { tur: 'dokun', hedef: x }), d);

describe('Keşif Masası ekranı', () => {
  it('aşama 2 araçları: onluk çerçeve, nesneler, sayı doğrusu (yinelenmez)', () => {
    expect(EKRAN_ARACLARI.map((a) => a.arac)).toEqual(['onlukCerceve', 'nesneKumesi', 'sayiDogrusu']);
  });
  it('gösterilen sayı aracın sayısıdır', () => {
    expect(gosterilenSayi(dokun(kesifBaslangic('onlukCerceve'), 'goz:4', 'goz:15', 'arti'))).toBe(3);
    expect(gosterilenSayi(dokun(kesifBaslangic('nesneKumesi'), 'arti', 'arti'))).toBe(2);
    expect(gosterilenSayi(dokun(kesifBaslangic('sayiDogrusu'), 'nokta:17'))).toBe(17);
  });
  it('sayı doğrusu penceresi 11 nokta: 0–10, 10u geçince 10–20', () => {
    expect([0, 5, 10].map(pencereBaslangici)).toEqual([0, 0, 0]);
    expect([11, 20].map(pencereBaslangici)).toEqual([10, 10]);
  });
});
