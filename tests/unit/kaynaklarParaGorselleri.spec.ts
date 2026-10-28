/** KG-117: Kaynaklar / veli paneli "Para görselleri" beyanı ekranın gerçekte gösterdiğini söyler (KG-19, KG-28). */
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EKRAN_TCMB_GECISI, paraGorselStratejisi, paraGorseliBeyani } from '../../src/content/paraGorseli';
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

  it('bugünkü strateji: ekran TCMB örneği, kâğıt/arşiv şematik', () => {
    expect(EKRAN_TCMB_GECISI).toBe(true);
    expect(paraGorselStratejisi({ ortam: 'ekran', tcmbYaziliIzin: false })).toBe('tcmb');
    expect(paraGorselStratejisi({ ortam: 'kagit', tcmbYaziliIzin: false })).toBe('sematik');
  });

  it('metin sabitlenmiş: ekran TCMB örnek görseli, kâğıt şematik, izin başvurusu yok', () => {
    expect(paraGorseliBeyani().paragraflar).toEqual([
      "Ekrandaki etkinliklerde 5, 10, 20, 50, 100 ve 200 TL banknotları için TCMB'nin internet sitesinde yayımladığı " +
        'E9 5. tertip ön yüz örnek görselleri, üzerlerindeki "ÖRNEKTİR GEÇMEZ" ibaresi korunarak, ' +
        'eğitim amacıyla ve kaynak gösterilerek kullanılır.',
      'Basılı çalışma kâğıtlarında ve kâğıt arşivinde banknotlar şematik çizimdir: değer, renk ve desen taşır, ' +
        'üzerinde "OYUN PARASI" yazar; TCMB görseli, adı veya portresi yoktur.',
      "TCMB'ye izin başvurusu yapılmamıştır; bu kullanım TCMB'nin izni veya onayı anlamına gelmez.",
    ]);
  });

  it('ekranda beyan aynen görünür; eski "yalnız resmî örnek görselleri kullanır" iddiası yok', () => {
    for (const p of paraGorseliBeyani().paragraflar) expect(bolum).toContain(p);
    expect(bolum).not.toMatch(/yalnız 5, 10, 20, 50, 100 ve 200 TL kupürleri için bu resmî/);
  });

  it('hiçbir sürümde TCMB izni/onayı iddia edilmez', () => {
    for (const gecis of [true, false]) {
      const b = paraGorseliBeyani(gecis);
      for (const p of [...b.paragraflar, b.kisa]) expect(p).not.toMatch(IZIN_IDDIASI);
    }
  });

  it('ekran şematiğe geçince metin TCMB görseli kullanıldığını söylemez', () => {
    const b = paraGorseliBeyani(false);
    const hepsi = [...b.paragraflar, b.kisa].join(' ');
    expect(hepsi).not.toMatch(/ÖRNEKTİR GEÇMEZ|örnek görsel/);
    expect(hepsi).toMatch(/şematik/);
  });

  it('veli paneli kısa beyanı kullanır ve eski Piper TTS iddiası kalkmıştır', () => {
    const veli = readFileSync(new URL('../../src/ui/screens/VeliPaneli.tsx', import.meta.url), 'utf8');
    expect(veli).toContain('paraGorseliBeyani().kisa');
    expect(veli).not.toMatch(/Piper/);
    expect(veli).not.toMatch(/banknot görselleri TCMB örnek banknotlarıdır/);
  });
});
