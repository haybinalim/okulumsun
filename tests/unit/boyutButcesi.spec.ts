import { describe, expect, it } from 'vitest';
import { degerlendir, surumBuyukEsit, type BoyutTabani } from '../../scripts/boyut-butcesi';

const taban: BoyutTabani = {
  toplamBayt: 1000,
  enBuyukParca: { dosya: 'index.js', bayt: 800 },
  olcumTarihi: '2026-10-13',
  zorunluSurum: '0.3.0',
  toleransYuzde: 10,
};

describe('K5 boyut bütçesi (Adım 26)', () => {
  it('sürüm karşılaştırması', () => {
    expect(surumBuyukEsit('0.3.0', '0.3.0')).toBe(true);
    expect(surumBuyukEsit('0.10.0', '0.3.0')).toBe(true);
    expect(surumBuyukEsit('0.2.9', '0.3.0')).toBe(false);
  });

  it('%10 tolerans içinde tamam', () => {
    expect(degerlendir({ toplamBayt: 1100, enBuyukParca: { dosya: 'a', bayt: 880 } }, taban, '0.1.0').durum).toBe('tamam');
  });

  it('aşım v0.3.0 öncesi uyarı, sonrası hata', () => {
    const asim = { toplamBayt: 1101, enBuyukParca: { dosya: 'a', bayt: 881 } };
    expect(degerlendir(asim, taban, '0.1.0')).toMatchObject({ durum: 'uyari' });
    expect(degerlendir(asim, taban, '0.3.0').durum).toBe('hata');
    expect(degerlendir(asim, taban, '0.3.0').mesajlar).toHaveLength(2);
  });
});
