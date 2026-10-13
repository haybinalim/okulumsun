/**
 * Plan v2 Adım 39 aşama 1 (KG-53): /gizlilik ve KVKK taslağı kodla aynı kalır.
 * Politika cümlesi = VERI_SAKLAMA_BILDIRIMI; CSP = vercel.json; izinli anahtarların hepsi listeli; KVKK "taslak".
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  KVKK_TASLAK_ETIKETI,
  gizlilikSayfasiUret,
  gizlilikVerisi,
  kvkkSayfasiUret,
} from '../../scripts/gizlilik-sayfasi';
import { IZINLI_ANAHTARLAR } from '../../src/persistence/depolamaIzinListesi';
import { VERI_SAKLAMA_BILDIRIMI } from '../../src/persistence/veriSaklamaPolitikasi';

const kok = path.resolve(__dirname, '../..');
const oku = (rel: string) => readFileSync(path.join(kok, rel), 'utf8');
const gizlilik = oku('public/gizlilik/index.html');
const kvkk = oku('public/gizlilik/kvkk.html');
const kacisCoz = (s: string) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

describe('gizlilik sayfası ve KVKK taslağı', () => {
  it('bayatlık: sayfalar üreticiyle aynı (npm run gizlilik:sayfa)', () => {
    const v = gizlilikVerisi(kok);
    expect(gizlilik).toBe(gizlilikSayfasiUret(v));
    expect(kvkk).toBe(kvkkSayfasiUret(v));
  });

  it('politika cümlesi VERI_SAKLAMA_BILDIRIMI ile aynı (sayfa, KVKK, LICENSES)', () => {
    expect(kacisCoz(gizlilik)).toContain(VERI_SAKLAMA_BILDIRIMI);
    expect(kacisCoz(kvkk)).toContain(VERI_SAKLAMA_BILDIRIMI);
    expect(oku('LICENSES.md')).toContain(VERI_SAKLAMA_BILDIRIMI);
  });

  it("CSP metni vercel.json'daki ile birebir aynı", () => {
    const vercel = JSON.parse(oku('vercel.json')) as { headers: { headers: { key: string; value: string }[] }[] };
    const csp = vercel.headers.flatMap((h) => h.headers).find((h) => h.key === 'Content-Security-Policy')!.value;
    const pre = /<pre aria-label="Content-Security-Policy">([\s\S]*?)<\/pre>/.exec(gizlilik)![1];
    expect(kacisCoz(pre)).toBe(csp);
  });

  it('izin listesindeki her anahtar sayfada listeli', () => {
    for (const a of IZINLI_ANAHTARLAR) expect(gizlilik).toContain(`<code>${a.anahtar}</code>`);
  });

  it('KVKK metni taslak etiketli; sayfalarda betik/form/dış kaynak yok', () => {
    expect(kvkk).toContain(KVKK_TASLAK_ETIKETI);
    for (const s of [gizlilik, kvkk]) {
      expect(s).not.toMatch(/<script|<form|<iframe/i);
      expect(s).not.toMatch(/(src|href)=["']https?:/i);
    }
  });

  it('öğretmen sayfası gizlilik sayfasına bağlanır', () => {
    expect(oku('public/ogretmen/index.html')).toContain('href="../gizlilik/"');
  });
});
