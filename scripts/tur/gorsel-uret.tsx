/**
 * TÜRKÇE SÖZCÜK GÖRSELLERİ ÜRETİCİSİ (Okuma Yazma planı §2.4.8, Adım 68). `npm run tur:gorsel`.
 *
 * Her görsel bu depoda kodla çizilmiş özgün SVG'dir (KG-104 kaynak kuralı: üçüncü taraf set, emoji, YZ görseli, metin
 * ve `<mask>` yok). Çizimler `scripts/tur/gorsel/grup<n>.tsx`; stil ve palet matematik nesneleriyle aynı
 * (`Govde`, `nesneTonlari`, `gorselPaleti.ts`). Çıktı statik veridir (ADR-0016), JS'e girmez:
 *
 * - `ders-verisi/tur/gorseller/<id>.svg` — 100×100 viewBox, renkler sabit, kimlikler `<id>-<n>` önekli;
 * - `ders-verisi/tur/gorseller/grup-<n>.json` — dizin (sözcük, taslak no, risk, bayt, `teyit: bekliyor`);
 * - `ders-verisi/tur/manifest.json` → `gruplar` (grup açılınca önbelleğe alınacak dosyalar).
 *
 * **Elle düzenlenmez:** test (`turGorsel.spec.ts`) diskteki dosyaların bu üreticinin çıktısıyla bayt bayt aynı olduğunu
 * denetler. Sözcük listesi iki öğretmen teyidini bekler; teyit gelince yalnız `TEYIT` değişir.
 */
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { PROGRAM_SURUMU } from '../../src/content/dersler/tur/alfabe';
import type { TurGorselDizini } from '../../src/content/schema/turGorsel';
import type { GorselTanimi, ResimsizTanimi } from './gorsel/ortak';
import { GRUP1, GRUP1_RESIMSIZ } from './gorsel/grup1';
import { GRUP2, GRUP2_RESIMSIZ } from './gorsel/grup2';

export const GORSEL_GRUPLARI: readonly {
  readonly grup: number;
  readonly gorseller: readonly GorselTanimi[];
  readonly resimsiz: readonly ResimsizTanimi[];
}[] = [
  { grup: 1, gorseller: GRUP1, resimsiz: GRUP1_RESIMSIZ },
  { grup: 2, gorseller: GRUP2, resimsiz: GRUP2_RESIMSIZ },
].filter((g) => g.gorseller.length > 0 || g.resimsiz.length > 0);

const KAYNAK =
  'Özgün çizim: scripts/tur/gorsel-uret.tsx (kodla yazılmış SVG; üçüncü taraf/YZ/emoji yok, KG-104). ' +
  'Sözcükler: Okuma Yazma sözcük listesi taslağı (iki öğretmen teyidi bekliyor).';

/** Tek görselin SVG metni (kimlikler `<id>-<n>`, boşluksuz). */
export function gorselSvg(t: GorselTanimi): string {
  let n = 0;
  const k = () => `${t.id}-${++n}`;
  const ham = renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      {t.ciz(k)}
    </svg>,
  );
  // Ödünç alınan matematik sprite'larının `useId` kimlikleri dahil bütün kimlikler sırayla yeniden adlandırılır.
  const eski = [...new Set([...ham.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))];
  let svg = ham;
  eski.forEach((e, i) => {
    const yeni = `${t.id}-${i + 1}`;
    svg = svg.split(`id="${e}"`).join(`id="${yeni}"`).split(`url(#${e})`).join(`url(#${yeni})`);
  });
  return kucult(svg) + '\n';
}

/**
 * Deterministik küçültme (görsel aynı): özniteliksiz `<g>` sarmalayıcıları kalkar, boş öğeler kendini kapatır,
 * sayılar 1 ondalığa yuvarlanır, gölge hilalinin "her yer" dikdörtgeni 100'lük kutuya göre kısalır.
 */
export function kucult(svg: string): string {
  const yigin: boolean[] = [];
  let s = svg.replace(/<g>|<g\s[^>]*>|<\/g>/g, (t) => {
    if (t === '<g>') {
      yigin.push(false);
      return '';
    }
    if (t === '</g>') return yigin.pop() ? t : '';
    yigin.push(true);
    return t;
  });
  s = s.replace(/<(\w+)([^<>]*)><\/\1>/g, '<$1$2/>');
  s = s.replace(/-?\d+\.\d{2,}/g, (n) => String(Math.round(Number(n) * 10) / 10));
  s = s.split('M-4000 -4000H4000V4000H-4000Z').join('M-99 -99H199V199H-99Z');
  return s.replace(/>\s+</g, '><');
}

export function gorselleriUret(): { dosyalar: Map<string, string>; dizinler: TurGorselDizini[] } {
  const dosyalar = new Map<string, string>();
  const dizinler: TurGorselDizini[] = GORSEL_GRUPLARI.map(({ grup, gorseller, resimsiz }) => ({
    surum: 1,
    programSurumu: PROGRAM_SURUMU,
    grup,
    kaynak: KAYNAK,
    resimliSozcukler: gorseller.map((g) => g.sozcuk),
    gorseller: gorseller.map((g) => {
      const svg = gorselSvg(g);
      const dosya = `gorseller/${g.id}.svg`;
      dosyalar.set(dosya, svg);
      return {
        id: g.id,
        dosya,
        sozcuk: g.sozcuk,
        taslakNo: g.taslakNo,
        aciklama: g.aciklama,
        risk: g.risk,
        bayt: Buffer.byteLength(svg),
        teyit: { durum: 'bekliyor' as const },
      };
    }),
    resimsiz: resimsiz.map((r) => ({ ...r })),
  }));
  return { dosyalar, dizinler };
}

export const dizinJson = (d: TurGorselDizini): string => JSON.stringify(d, null, 2) + '\n';

/** Manifestin `gruplar` alanına görsel dosyalarını yazar (diğer alanlar korunur). */
export function manifestiGuncelle(ham: string, dizinler: readonly TurGorselDizini[]): string {
  const m = JSON.parse(ham) as { gruplar: Record<string, string[]> };
  for (const d of dizinler) {
    const digerleri = (m.gruplar[String(d.grup)] ?? []).filter((y) => !y.startsWith('gorseller/'));
    m.gruplar[String(d.grup)] = [...digerleri, `gorseller/grup-${d.grup}.json`, ...d.gorseller.map((g) => g.dosya)];
  }
  return JSON.stringify(m, null, 2) + '\n';
}

function main(): void {
  const kok = path.join(process.cwd(), 'ders-verisi/tur');
  const hedef = path.join(kok, 'gorseller');
  rmSync(hedef, { recursive: true, force: true });
  mkdirSync(hedef, { recursive: true });
  const { dosyalar, dizinler } = gorselleriUret();
  for (const [yol, svg] of dosyalar) writeFileSync(path.join(kok, yol), svg);
  for (const d of dizinler) writeFileSync(path.join(hedef, `grup-${d.grup}.json`), dizinJson(d));
  const mYol = path.join(kok, 'manifest.json');
  writeFileSync(mYol, manifestiGuncelle(readFileSync(mYol, 'utf8'), dizinler));
  const toplam = [...dosyalar.values()].reduce((t, s) => t + Buffer.byteLength(s), 0);
  console.log(
    `${dosyalar.size} görsel (${readdirSync(hedef).length} dosya) · ${(toplam / 1024).toFixed(1)} KB · ` +
      dizinler.map((d) => `grup ${d.grup}: ${d.gorseller.length}`).join(', '),
  );
}

if (process.argv[1]?.endsWith('gorsel-uret.tsx')) main();
