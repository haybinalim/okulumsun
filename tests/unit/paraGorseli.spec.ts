import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BANKNOTLAR } from '../../src/exercises/types';
import {
  BANKNOT_OLCULERI_MM,
  TCMB_EKRAN_DPI_SINIRI,
  TCMB_KAGIT_OLCEK_SINIRI,
  banknotOrani,
  tcmbEnBuyukPiksel,
} from '../../src/content/paraGorseli';
import { CSS_PX_MM, KAGIT_BANKNOT_GENISLIK_PX } from '../../src/ui/print/kagitBanknot';

/** WebP (VP8 / VP8L / VP8X) piksel ölçüsü — bağımlılıksız başlık okuyucu. */
function webpOlcusu(b: Buffer): { en: number; boy: number } {
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') throw new Error('WebP değil');
  const parca = b.toString('ascii', 12, 16);
  if (parca === 'VP8 ')
    return {
      en: b.readUInt16LE(26) & 0x3fff,
      boy: b.readUInt16LE(28) & 0x3fff,
    };
  if (parca === 'VP8L') {
    const v = b.readUInt32LE(21);
    return { en: (v & 0x3fff) + 1, boy: ((v >> 14) & 0x3fff) + 1 };
  }
  if (parca === 'VP8X') return { en: b.readUIntLE(24, 3) + 1, boy: b.readUIntLE(27, 3) + 1 };
  throw new Error(`bilinmeyen WebP parçası ${parca}`);
}

/**
 * KG-122 — TCMB "Banknotların Resim ve Görüntülerinin Çoğaltılması ve Yayınlanması ile İlgili Duyuru"
 * (RG 24.02.2004/25383; değişik 13.10.2004/25612) koşulları.
 */
describe('TCMB çoğaltma koşulları (KG-122)', () => {
  it('ölçüler TCMB E9 tablosuyla aynı; oran kupürle artar', () => {
    expect(BANKNOT_OLCULERI_MM[5]).toEqual({ en: 130, boy: 64 });
    expect(BANKNOT_OLCULERI_MM[200]).toEqual({ en: 160, boy: 72 });
    const oranlar = BANKNOTLAR.map(banknotOrani);
    for (const o of oranlar) expect(o).toBeGreaterThan(2);
    expect(TCMB_EKRAN_DPI_SINIRI).toBe(72);
    expect(TCMB_KAGIT_OLCEK_SINIRI).toBe(0.75);
  });

  it.each(BANKNOTLAR)('%i TL dosyası gerçek boyutta ≤ 72 dpi (madde 4) ve gerçek oranı taşır', (deger) => {
    const dosya = readFileSync(resolve(process.cwd(), `public/images/banknotlar/${deger}-tl-on-yuz-resmi.webp`));
    const { en, boy } = webpOlcusu(dosya);
    const sinir = tcmbEnBuyukPiksel(deger);
    expect(en).toBeLessThanOrEqual(sinir.en);
    expect(boy).toBeLessThanOrEqual(sinir.boy);
    // Görüntüyü çocuğun tanıyabileceği kadar net tut: sınırın %95'inden küçük olmasın.
    expect(en).toBeGreaterThanOrEqual(Math.floor(sinir.en * 0.95));
    expect(Math.abs(en / boy - banknotOrani(deger))).toBeLessThan(0.02);
    // JS paketine gömülmez; ayrı ve küçük varlık.
    expect(dosya.length).toBeLessThan(60_000);
  });

  it.each(BANKNOTLAR)("%i TL kâğıtta tek yüz ve en/boyun %%75'inden küçük (madde 1)", (deger) => {
    const o = BANKNOT_OLCULERI_MM[deger];
    const enMm = KAGIT_BANKNOT_GENISLIK_PX * CSS_PX_MM;
    const boyMm = enMm / banknotOrani(deger);
    expect(enMm).toBeLessThan(o.en * TCMB_KAGIT_OLCEK_SINIRI);
    expect(boyMm).toBeLessThan(o.boy * TCMB_KAGIT_OLCEK_SINIRI);
  });

  it('şematik banknot ve "OYUN PARASI" kalktı (KG-121 yerine geçti → KG-122)', async () => {
    const modul: Record<string, unknown> = await import('../../src/content/paraGorseli');
    expect(modul.SEMATIK_BANKNOT_STILI).toBeUndefined();
    expect(modul.TCMB_YAZILI_IZIN).toBeUndefined();
  });
});
