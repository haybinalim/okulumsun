/** KG-117, KG-121: Kaynaklar / veli paneli "Para görselleri" beyanı gerçeği söyler — banknotlar her yerde şematik (KG-19). */
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

  it('metin sabitlenmiş: ekran, kâğıt ve arşiv şematik; izin başvurusu yok (KG-121)', () => {
    expect(paraGorseliBeyani().paragraflar).toEqual([
      'Ekranda, basılı çalışma kâğıtlarında ve kâğıt arşivinde banknotlar şematik çizimdir: değer, renk ve desen ' +
        'taşır, üzerinde "OYUN PARASI" yazar; TCMB görseli, adı veya portresi yoktur.',
      "TCMB'ye izin başvurusu yapılmamıştır; bu kullanım TCMB'nin izni veya onayı anlamına gelmez.",
    ]);
    expect(paraGorseliBeyani().kisa).toBe('Banknotlar her yerde şematik "oyun parası" çizimleridir; TCMB görseli kullanılmaz.');
  });

  it('ekranda beyan aynen görünür; eski "yalnız resmî örnek görselleri kullanır" iddiası yok', () => {
    for (const p of paraGorseliBeyani().paragraflar) expect(bolum).toContain(p);
    expect(bolum).not.toMatch(/yalnız 5, 10, 20, 50, 100 ve 200 TL kupürleri için bu resmî/);
  });

  it('TCMB izni/onayı iddia edilmez; TCMB görseli kullanıldığı söylenmez', () => {
    const b = paraGorseliBeyani();
    const hepsi = [...b.paragraflar, b.kisa].join(' ');
    for (const p of [...b.paragraflar, b.kisa]) expect(p).not.toMatch(IZIN_IDDIASI);
    expect(hepsi).not.toMatch(/ÖRNEKTİR GEÇMEZ|örnek görsel|E9 5\. tertip/);
    expect(bolum).not.toMatch(/ÖRNEKTİR GEÇMEZ|örnek görsel/);
    expect(hepsi).toMatch(/şematik/);
  });

  it('veli paneli kısa beyanı kullanır ve eski Piper TTS iddiası kalkmıştır', () => {
    const veli = readFileSync(new URL('../../src/ui/screens/VeliPaneli.tsx', import.meta.url), 'utf8');
    expect(veli).toContain('paraGorseliBeyani().kisa');
    expect(veli).not.toMatch(/Piper/);
    expect(veli).not.toMatch(/banknot görselleri TCMB örnek banknotlarıdır/);
  });
});
