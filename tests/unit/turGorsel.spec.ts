/**
 * Adım 68 — Türkçe sözcük görselleri (Okuma Yazma planı §2.4.8, kural D-25). `ders-verisi/tur/gorseller/`:
 * üreticiyle bayt bayt aynılık (elle düzenlenmez), dizin şeması, her resimli sözcüğe tek görsel, öğretilmemiş harfli
 * sözcüğe görsel yok (K-OY-02), kimlik tekliği, SVG kaynak kuralı (maske/metin/dış kaynak/gradyan yok, palet, ≤ 6 KB,
 * koyu kontur), manifest grup listeleri ve teyit kapısı. Her kural bozulmuş bir kopyada kırmızıya döner (tuzak).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { dizinJson, gorselleriUret, kucult, manifestiGuncelle } from '../../scripts/tur/gorsel-uret';
import { gorselDiziniAyristir, type TurGorselDizini } from '../../src/content/schema/turGorsel';
import {
  GORSEL_BAYT_TAVANI,
  gorselDizinleriniDenetle,
  gorselTeyitBekleyenler,
  icerikGorselBaglariniDenetle,
  svgDenetle,
} from '../../src/content/dersler/tur/gorselDenetimi';
import { NESNE_TEMEL } from '../../src/content/dersler/tur/gorselPaleti';
import { girisNoktasi } from '../../src/content/dersler/tur/ogretilenKume';
import { veriyiOlc } from '../../scripts/ders-veri-butcesi';

const KOK = 'ders-verisi/tur/';
const dizinAdlari = readdirSync(`${KOK}gorseller`).filter((d) => /^grup-\d\.json$/.test(d)).sort();
const DIZINLER: TurGorselDizini[] = dizinAdlari.map((d) =>
  gorselDiziniAyristir(JSON.parse(readFileSync(`${KOK}gorseller/${d}`, 'utf8'))),
);
const DOSYALAR = new Map(
  readdirSync(`${KOK}gorseller`)
    .filter((d) => d.endsWith('.svg'))
    .map((d) => [`gorseller/${d}`, readFileSync(`${KOK}gorseller/${d}`, 'utf8')] as const),
);
const kopya = () => structuredClone(DIZINLER);
const ilk = () => DIZINLER[0].gorseller[0];
const svgIlk = () => DOSYALAR.get(ilk().dosya)!;

describe('görsel verisi', () => {
  it('üreticinin çıktısıyla bayt bayt aynı (elle düzenlenmez) ve manifest grup listeleri güncel', () => {
    const { dosyalar, dizinler } = gorselleriUret();
    expect([...DOSYALAR.keys()].sort()).toEqual([...dosyalar.keys()].sort());
    for (const [yol, svg] of dosyalar) expect(DOSYALAR.get(yol), yol).toBe(svg);
    expect(dizinAdlari).toEqual(dizinler.map((d) => `grup-${d.grup}.json`));
    for (const d of dizinler) expect(readFileSync(`${KOK}gorseller/grup-${d.grup}.json`, 'utf8')).toBe(dizinJson(d));
    const manifest = readFileSync(`${KOK}manifest.json`, 'utf8');
    expect(manifestiGuncelle(manifest, dizinler)).toBe(manifest);
  });

  it('bütün denetimler temiz; her görsel teyit bekliyor (yayın kapısı)', () => {
    expect(gorselDizinleriniDenetle(DIZINLER, DOSYALAR)).toEqual([]);
    const toplam = DIZINLER.reduce((t, d) => t + d.gorseller.length, 0);
    expect(toplam).toBeGreaterThanOrEqual(15);
    expect(gorselTeyitBekleyenler(DIZINLER)).toHaveLength(toplam);
  });

  it('her görselin sözcüğü kendi grubunda okunabilir; 6 KB tavanı; kimlik ASCII ve tek', () => {
    const kimlikler = new Set<string>();
    for (const d of DIZINLER)
      for (const g of d.gorseller) {
        expect(girisNoktasi(g.sozcuk)?.grup, g.sozcuk).toBe(d.grup);
        expect(g.bayt).toBeLessThanOrEqual(GORSEL_BAYT_TAVANI);
        expect(kimlikler.has(g.id)).toBe(false);
        kimlikler.add(g.id);
      }
  });

  it('palet matematik nesnelerinin renkleriyle aynı (Sprite.tsx DOGAL_RENK + PARCA)', () => {
    const sprite = readFileSync('src/ui/svg/Sprite.tsx', 'utf8');
    for (const [ad, hex] of Object.entries(NESNE_TEMEL)) expect(sprite, ad).toMatch(new RegExp(`\\b${ad}: '${hex}'`));
  });

  it('manifest her görsel dosyasını grubunda listeler (önbellek planı dışında dosya yok)', () => {
    const manifest = JSON.parse(readFileSync(`${KOK}manifest.json`, 'utf8'));
    const boyutlar = new Map([...DOSYALAR].map(([y, s]) => [y, s.length] as const));
    for (const d of DIZINLER) boyutlar.set(`gorseller/grup-${d.grup}.json`, 1);
    boyutlar.set('manifest.json', 1);
    boyutlar.set('hamleler.json', 1);
    // Adım 69: şablon sözcük havuzu ve klip manifesti çekirdekte.
    boyutlar.set('icerik/sozcukler.json', 1);
    boyutlar.set('ses/klipler.json', 1);
    const o = veriyiOlc(boyutlar, manifest);
    expect(o.listesiz).toEqual([]);
    expect(o.eksik).toEqual([]);
  });

  it('küçültme görünümü değiştirmez: özniteliksiz <g> kalkar, öznitelikli korunur', () => {
    expect(kucult('<svg><g><g fill="#FFF"><path d="M0 0"></path></g></g></svg>')).toBe(
      '<svg><g fill="#FFF"><path d="M0 0"/></g></svg>',
    );
    expect(kucult('<path d="M1.23456 2.01"></path>')).toBe('<path d="M1.2 2"/>');
  });
});

describe('D-25 tuzakları (her biri kırmızı)', () => {
  const svgTuzak = (degistir: (s: string) => string) => svgDenetle(ilk().id, degistir(svgIlk()));

  it.each([
    ['maske', (s: string) => s.replace('</svg>', '<mask id="x-1"/></svg>')],
    ['metin', (s: string) => s.replace('</svg>', '<text>at</text></svg>')],
    ['raster', (s: string) => s.replace('</svg>', '<image href="a.png"/></svg>')],
    ['dış adres', (s: string) => s.replace('</svg>', '<path d="M0 0" fill="url(https://x.y/a)"/></svg>')],
    ['gradyan', (s: string) => s.replace('</svg>', '<linearGradient/></svg>')],
    ['stil', (s: string) => s.replace('</svg>', '<path style="fill:#000"/></svg>')],
    ['betik', (s: string) => s.replace('</svg>', '<script>1</script></svg>')],
    ['palet dışı renk', (s: string) => s.replace(/fill="#[0-9A-F]{6}"/, 'fill="#DC2626"')],
    ['6 KB aşımı', (s: string) => s.replace('</svg>', `<path d="M0 0${'L1 1'.repeat(2000)}"/></svg>`)],
    ['koyu kontur yok', (s: string) => s.replace(/ stroke="#[0-9A-F]{6}"/g, ' stroke="#FFFFFF"')],
    ['öneksiz id', (s: string) => s.replace(/id="([a-z]+)-1"/, 'id="baska-1"')],
    ['tanımsız url', (s: string) => s.replace('</svg>', '<path d="M0 0" clip-path="url(#yok)"/></svg>')],
    ['viewBox', (s: string) => s.replace('viewBox="0 0 100 100"', 'viewBox="0 0 50 50"')],
  ])('%s', (_ad, f) => {
    expect(svgTuzak(f).length).toBeGreaterThan(0);
  });

  it('öğretilmemiş harfli sözcüğe 1. grupta görsel (kek → 2. grup) kırmızı', () => {
    const d = kopya();
    d[0].gorseller[0].sozcuk = 'kek';
    d[0].resimliSozcukler[0] = 'kek';
    expect(gorselDizinleriniDenetle(d, DOSYALAR).some((i) => /öğretilmemiş harf/.test(i.mesaj))).toBe(true);
  });

  it('resimli sözcüğün görseli yoksa kırmızı', () => {
    const d = kopya();
    d[0].resimliSozcukler.push('tane');
    expect(gorselDizinleriniDenetle(d, DOSYALAR).some((i) => /"tane" sözcüğünün görseli yok/.test(i.mesaj))).toBe(
      true,
    );
  });

  it('yinelenen kimlik, ikinci görsel, dosya adı, bayt ve dizin dışı dosya kırmızı', () => {
    const d = kopya();
    d[0].gorseller.push({ ...d[0].gorseller[0] });
    const ihlaller = gorselDizinleriniDenetle(d, DOSYALAR).map((i) => i.mesaj);
    expect(ihlaller.some((m) => /kimlik yineleniyor/.test(m))).toBe(true);
    expect(ihlaller.some((m) => /ikinci görseli/.test(m))).toBe(true);

    const d2 = kopya();
    d2[0].gorseller[0].dosya = 'gorseller/baska.svg';
    d2[0].gorseller[1].bayt += 1;
    const m2 = gorselDizinleriniDenetle(d2, DOSYALAR).map((i) => i.mesaj);
    expect(m2.some((m) => /dosya adı/.test(m))).toBe(true);
    expect(m2.some((m) => /dizindeki bayt/.test(m))).toBe(true);
    expect(m2.some((m) => /dizinde olmayan/.test(m))).toBe(true);
  });

  it('resimsiz sözcük resimli listede olamaz; şema tanımsız alanı reddeder', () => {
    const d = kopya();
    d[0].resimsiz.push({ sozcuk: d[0].resimliSozcukler[0], taslakNo: 1, neden: 'deneme deneme' });
    expect(gorselDizinleriniDenetle(d, DOSYALAR).some((i) => /hem resimli hem resimsiz/.test(i.mesaj))).toBe(true);
    const ham = JSON.parse(readFileSync(`${KOK}gorseller/${dizinAdlari[0]}`, 'utf8'));
    ham.gorseller[0].renk = '#FFF';
    expect(() => gorselDiziniAyristir(ham)).toThrow();
  });

  it('içerikteki gorselId bağları: yok ya da başka sözcüğün görseli kırmızı', () => {
    const g = ilk();
    expect(icerikGorselBaglariniDenetle([{ id: 's1', metin: g.sozcuk, gorselId: g.id }], DIZINLER)).toEqual([]);
    expect(icerikGorselBaglariniDenetle([{ id: 's1', metin: g.sozcuk, gorselId: 'yok' }], DIZINLER)).toHaveLength(1);
    expect(icerikGorselBaglariniDenetle([{ id: 's1', metin: 'ne', gorselId: g.id }], DIZINLER)).toHaveLength(1);
  });

  it('teyitli görsel yayın kapısından düşer', () => {
    const d = kopya();
    d[0].gorseller[0].teyit = { durum: 'teyitli', ogretmen: ['O1', 'O2'], tarih: '2026-11-15' };
    expect(gorselTeyitBekleyenler(d)).not.toContain(d[0].gorseller[0].id);
  });
});
