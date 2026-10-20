/**
 * KG-96: çocuğa dönük metnin harfleri MEB TYMM 2024 TemelYazi (dik temel); öğretmen/veli yüzeyleri Andika.
 * Font dosyası `scripts/rakam-glif-uret.py` ile üretilir; burada kapsam ve yüzey kararı denetlenir.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import tr from '../../src/content/tr.json';
import { skillsData } from '../../src/content/skillsData';
import { FONT_YIGINI, KART_ETIKETI_YAZI, TEXT } from '../../src/design/tokens';
import { YETISKIN_EKRANLARI, yaziYuzeyi } from '../../src/design/yaziYuzeyi';
import { REGISTRY } from '../../src/exercises/registry';
import { arsivIstegi, arsivKayitlari } from '../../src/ogretmen/calismaKagidi/arsiv';
import { ETKI_DUZENI, etkiFormlariUret } from '../../src/ogretmen/calismaKagidi/etkiFormu';
import { kagitPlaniUret, type KagitPlani } from '../../src/ogretmen/calismaKagidi/kagitPlani';
import { trDuzlestir } from '../../src/ogretmen/calismaKagidi/sesMetni';
import { KAGIT_ALT_YAZI, KagitSayfalari, KisaCizgili } from '../../src/ui/print/KagitSayfalari';

const css = readFileSync('src/index.css', 'utf8');

/** `@font-face { font-family: 'TemelYazi'; … }` bloğunun unicode-range'i → kod noktası kümesi. */
function temelYaziKapsami(): Set<number> {
  const blok = /@font-face\s*\{[^}]*font-family: 'TemelYazi';[^}]*\}/.exec(css)?.[0] ?? '';
  const aralik = /unicode-range:([^;]+);/.exec(blok)?.[1] ?? '';
  const kume = new Set<number>();
  for (const p of aralik.split(',').map((x) => x.trim().replace('U+', ''))) {
    const [a, b] = p.split('-').map((h) => parseInt(h, 16));
    for (let c = a; c <= (b ?? a); c++) kume.add(c);
  }
  return kume;
}

describe('TemelYazi harfleri (KG-96)', () => {
  it('harf dosyası var, tek dosya (Regular dağıtılmaz), boyutu sınırlı', () => {
    expect(existsSync('public/fonts/TemelYazi-Harf.woff2')).toBe(true);
    expect(statSync('public/fonts/TemelYazi-Harf.woff2').size).toBeLessThan(25_000);
    const temelYazi = readdirSync('public/fonts').filter((d) => d.startsWith('TemelYazi'));
    expect(temelYazi.sort()).toEqual(['TemelYazi-Harf.woff2', 'TemelYazi-Rakam.woff2']);
  });

  it('unicode-range Türkçe alfabenin tamamını, rakamları, temel noktalamayı, ₺ ve % işaretini kapsar', () => {
    const kapsam = temelYaziKapsami();
    const gerekli = 'abcçdefgğhıijklmnoöprsştuüvyzABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZâîûÂÎÛqwxQWX0123456789.,;:!?\'"()-+=<>%₺ ';
    for (const ch of gerekli) expect(kapsam.has(ch.codePointAt(0)!), `kapsamda yok: ${ch}`).toBe(true);
    expect(kapsam.has(0x2212)).toBe(true); // eksi
    // Fontta olmayanlar Andika'ya düşmeli (range dışı): [ ] { } # $ – — … ·
    for (const ch of '[]{}#$–—…·') expect(kapsam.has(ch.codePointAt(0)!), `kapsamda olmamalı: ${ch}`).toBe(false);
  });

  it('çocuk yığını TemelYazi ile başlar; yetişkin yığını Andika harfleri', () => {
    // SVG <text>: aynı harf dosyası, size-adjust'sız yüz (sabit kutular Andika ölçüsünde).
    expect(FONT_YIGINI.startsWith("'TemelYaziSvg', 'TemelYaziRakam', 'Andika'")).toBe(true);
    expect(css).toMatch(/font-family: 'TemelYaziSvg';\s*src: url\('\/fonts\/TemelYazi-Harf\.woff2'\)/);
    expect(css).toMatch(/\[data-yazi='yetiskin'\],\s*\[data-yetiskin\]\s*\{\s*font-family: var\(--font-yetiskin\);/);
    expect(css).toContain('size-adjust: 120%');
  });

  it('yazı yüzeyi: öğretmen/veli ekranları yetişkin, çocuk ekranları TemelYazi', () => {
    for (const e of ['veliKapisi', 'veliPaneli', 'kaynaklar', 'sorunBildir', 'setHazirla', 'haftalikPlan', 'calismaKagidi', 'eveGonder', 'sinifTuruKurulum', 'dersSonuOzeti', 'veliIpucuKarti'] as const) {
      expect(yaziYuzeyi(e)).toBe('yetiskin');
    }
    for (const e of ['audioUnlock', 'modSecimi', 'avatarSecimi', 'renkSecimi', 'anaEkran', 'temaGirisi', 'alistirma', 'oturumSonu', 'bahcem', 'konuSecimi', 'sinifTuru', 'sinifTuruSonu', 'evdeCalis', 'kesifMasasi', 'temaTuru'] as const) {
      expect(yaziYuzeyi(e)).toBe('cocuk');
    }
    expect(YETISKIN_EKRANLARI.size).toBe(11);
  });

  it('App her ekran sarmalayıcısına data-yazi koyar', () => {
    const app = readFileSync('src/App.tsx', 'utf8');
    expect(app.match(/data-yazi=\{yazi\}/g)?.length).toBe(24);
  });
});

/** HTML'den görünen metin (etiketler ve öznitelikler atılır, varlıklar çözülür). */
function gorunenMetin(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function kapsamDisi(metin: string, kapsam: Set<number>): string[] {
  return [...new Set([...metin].filter((c) => !/\s/.test(c) && !kapsam.has(c.codePointAt(0)!)))];
}

describe('TemelYazi dışı karakter yok (KG-98)', () => {
  const kapsam = temelYaziKapsami();
  const TR = trDuzlestir(tr as unknown as Record<string, unknown>);

  it('arşiv kâğıtları (165) ve etki Form A/B: basılan metnin her karakteri TemelYazi kapsamında (Andika indirilmez)', () => {
    const planlar: [string, KagitPlani, '2x3' | '1x4'][] = arsivKayitlari(skillsData).map((k) => {
      const istek = arsivIstegi(k);
      return [k.kagitKodu, kagitPlaniUret(istek, TR, (t) => REGISTRY.has(t)), istek.duzen];
    });
    expect(planlar.length).toBe(165);
    const { A, B } = etkiFormlariUret(TR);
    planlar.push(['ETKI-1-A', A, ETKI_DUZENI], ['ETKI-1-B', B, ETKI_DUZENI]);
    const ihlal: string[] = [];
    for (const [kod, plan, duzen] of planlar) {
      const html = renderToStaticMarkup(
        KagitSayfalari({ plan, duzen, cevapAnahtariDahil: true, siyahBeyaz: false, kopya: 'baski' }),
      );
      const disari = kapsamDisi(gorunenMetin(html), kapsam);
      if (disari.length) ihlal.push(`${kod}: ${disari.join(' ')}`);
    }
    expect(ihlal).toEqual([]);
    expect(KAGIT_ALT_YAZI).not.toMatch(/[·–—…]/);
  });

  it('kâğıt kodu ve Ç-kodu etiketi: metin aynen kalır, yalnız kısa çizgi görüntüde daraltılır', () => {
    const html = renderToStaticMarkup(KisaCizgili({ metin: 'ETKI-1-A' }));
    expect(gorunenMetin(html).replace(/\s/g, '')).toBe('ETKI-1-A');
    expect(html.match(/kg-kod-ayrac/g)).toHaveLength(2);
    expect(readFileSync('src/ui/print/kagit.css', 'utf8')).toMatch(/\.kg-kod-ayrac\s*\{[^}]*scaleX\(0\.5\)/);
  });

  it('çocuk ekranı kaynaklarında · – — … yok (yorumlar ve hata iletileri hariç)', () => {
    const yetiskinDosyalari = new Set(
      [...YETISKIN_EKRANLARI].map((e) => e.charAt(0).toUpperCase() + e.slice(1)),
    );
    const dosyalar = [
      ...readdirSync('src/ui', { recursive: true, encoding: 'utf8' }).map((d) => `src/ui/${d}`),
      ...readdirSync('src/kesif').map((d) => `src/kesif/${d}`),
      'src/App.tsx',
    ].filter((d) => /\.tsx?$/.test(d) && !d.includes('.spec.') && !yetiskinDosyalari.has(basename(d).replace(/\.tsx?$/, '')));
    const ihlal: string[] = [];
    for (const d of dosyalar) {
      const kod = readFileSync(d, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:'"`])\/\/.*$/gm, '$1')
        .split('\n')
        .filter((l) => !/throw new Error/.test(l));
      for (const l of kod) if (/[·–—…]/.test(l)) ihlal.push(`${d}: ${l.trim()}`);
    }
    expect(dosyalar.length).toBeGreaterThan(40);
    expect(ihlal).toEqual([]);
  });
});

describe('küçük metin ölçütü (KG-98)', () => {
  it('kart etiketi 20 px (tahtada ölçekle 32), telefonda da 20 px altına inmez', () => {
    expect(TEXT.kartEtiketi).toBe(20);
    expect(KART_ETIKETI_YAZI).toBe('max(20px, var(--text-kart-etiketi))');
    expect(css).toContain('--text-kart-etiketi: 20px;');
  });
  it('ana ekran kart etiketleri ve yönerge şeridi alt metni bu ölçüyü kullanır; sabit 11/16 px kalmadı', () => {
    const ana = readFileSync('src/ui/screens/AnaEkran.tsx', 'utf8');
    expect(ana).not.toMatch(/fontSize: (boardMode \? 16 : 11|16, textAlign)/);
    expect(ana.match(/style=\{KART_ETIKETI_STILI\}/g)).toHaveLength(3);
    expect(readFileSync('src/ui/feedback/YonlendirmeSeridi.tsx', 'utf8')).toContain('fontSize: KART_ETIKETI_YAZI');
  });
});
