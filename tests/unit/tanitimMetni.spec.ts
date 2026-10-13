/**
 * Plan v2 Adım 38 aşama 2 (KG-52): öğretmen tanıtım sayfası (public/ogretmen/index.html).
 * Sayılar kodla aynı (K8 benzeri bayatlık), aşırı iddia ve rakip markası yok, dış kaynak/betik/form yok.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ogretmenSayfasiUret, sayfaVerisi, tekilSoruMetni } from '../../scripts/ogretmen-sayfasi';
import { blokOku } from '../../scripts/durum';

const kok = path.resolve(__dirname, '../..');
const sayfa = readFileSync(path.join(kok, 'public/ogretmen/index.html'), 'utf8');
const metin = sayfa
  .replace(/<style>[\s\S]*?<\/style>/, '')
  .replace(/<[^>]+>/g, ' ')
  .toLocaleLowerCase('tr-TR');

describe('öğretmen tanıtım sayfası', () => {
  it('bayatlık: sayfa üreticiyle aynı (npm run ogretmen:sayfa)', async () => {
    expect(sayfa).toBe(ogretmenSayfasiUret(await sayfaVerisi(kok)));
  }, 60_000);

  it('durum bloğundaki sayılar kodla aynı ve sayfada yazılı', async () => {
    const v = await sayfaVerisi(kok);
    expect(blokOku(sayfa)).toEqual({
      kazanim: String(v.kazanim),
      beceri: String(v.beceri),
      sablon: String(v.sablon),
      tekil_soru: String(v.tekilSoru),
    });
    expect(sayfa).toContain(`<b>${v.kazanim}</b> MEB kazanımı`);
    expect(sayfa).toContain(`<b>${tekilSoruMetni(v.tekilSoru)}+</b> farklı soru`);
    expect(tekilSoruMetni(66_381)).toBe('66.000');
  });

  it('aşırı iddia yok (Y8) ve rakip markası anılmaz', () => {
    for (const yasak of ['kanıtlandı', 'kanıtlanmış', 'bilimsel olarak', 'en iyi', 'garanti']) {
      expect(metin, yasak).not.toContain(yasak);
    }
    for (const marka of ['okulistik', 'matific', 'doping', 'morpa', 'khan']) expect(metin, marka).not.toContain(marka);
  });

  it('olgunluk etiketi ve veri kutusu var; pilot', () => {
    expect(metin).toContain('pilot');
    expect(metin).toContain('veri almıyoruz');
    expect(metin).toContain('hesapsız ve ücretsiz');
  });

  it('dış kaynak, betik, form ve izleyici yok', () => {
    expect(sayfa).not.toMatch(/<script|<form|<iframe/i);
    expect(sayfa).not.toMatch(/(src|href)=["']https?:/i);
    expect(sayfa).not.toMatch(/url\(['"]?https?:/i);
  });
});
