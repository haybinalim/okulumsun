/** KG-117, KG-122: Kaynaklar / veli paneli "Para görselleri" beyanı gerçeği söyler — her yerde TCMB örnek görselleri, izin iddiası yok. */
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { paraGorseliBeyani } from '../../src/content/paraGorseli';
import { Kaynaklar } from '../../src/ui/screens/Kaynaklar';

/** İzin/onay iddiası: "izniyle", "izin alınmıştır", "onaylı", "TCMB'nin izni ile" vb. */
const IZIN_IDDIASI = /izniyle|izni ile|izin alın(dı|mıştır)|onayıyla|onaylı|lisansla kullan/i;

function metin(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/\s+/g, ' ');
}

describe('Kaynaklar — Para Görselleri (KG-117)', () => {
  const html = metin(renderToStaticMarkup(createElement(Kaynaklar)));
  const bolum = html.slice(html.indexOf('Para Görselleri'));

  it('metin sabitlenmiş: ekran, kâğıt ve arşiv TCMB örnek görselleri, kaynak gösterilir (KG-122)', () => {
    const b = paraGorseliBeyani();
    expect(b.paragraflar).toHaveLength(3);
    expect(b.paragraflar[0]).toContain(
      'Ekranda, basılı çalışma kâğıtlarında ve kâğıt arşivinde 5, 10, 20, 50, 100 ve 200 TL',
    );
    expect(b.paragraflar[0]).toContain('E9 5. tertip ön yüz örnek görselleri');
    expect(b.paragraflar[0]).toContain('"ÖRNEKTİR GEÇMEZ"');
    expect(b.paragraflar[0]).toContain('Kaynak: TCMB, tcmb.gov.tr.');
    expect(b.paragraflar[1]).toMatch(/72 dpi/);
    expect(b.paragraflar[2]).toBe(
      "TCMB'ye izin başvurusu yapılmamıştır; bu kullanım TCMB'nin izni veya onayı anlamına gelmez.",
    );
    expect(b.kisa).toContain('ÖRNEKTİR GEÇMEZ');
  });

  it('ekranda beyan aynen görünür', () => {
    for (const p of paraGorseliBeyani().paragraflar) expect(bolum).toContain(p);
  });

  it('TCMB izni/onayı iddia edilmez; şematik/oyun parası iddiası kalktı', () => {
    const b = paraGorseliBeyani();
    const hepsi = [...b.paragraflar, b.kisa].join(' ');
    for (const p of [...b.paragraflar, b.kisa]) expect(p).not.toMatch(IZIN_IDDIASI);
    expect(hepsi).not.toMatch(/şematik|OYUN PARASI|oyun parası/i);
    expect(bolum).not.toMatch(/şematik|OYUN PARASI/i);
  });

  it('veli paneli kısa beyanı kullanır ve eski Piper TTS iddiası kalkmıştır', () => {
    const veli = readFileSync(new URL('../../src/ui/screens/VeliPaneli.tsx', import.meta.url), 'utf8');
    expect(veli).toContain('paraGorseliBeyani().kisa');
    expect(veli).not.toMatch(/Piper/);
    expect(veli).not.toMatch(/banknot görselleri TCMB örnek banknotlarıdır/);
  });
});
