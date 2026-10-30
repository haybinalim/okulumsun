import { expect, test, type Page } from '@playwright/test';

/**
 * KG-132 GÖRSEL BOYUTU (kullanıcı kararı 2026-10-30) — tahta 1920×1080 ve 1080×810, tablet 1080×810.
 * Önce: M-VERİ-SIKLIK sahnesinde nesne kümesi kutusu sahnenin altına (y 0,7) ve kenarlarına taşıyordu → alt satır ve
 * kenar sütunlar kesik; M-VERİ-GRUPLA tek nesnesi kartta ve sahnede ≈ 10–20 px; M-ONLUK-ÇÖZÜMLE kartında onluk çerçeve
 * kartın ≈ %40'ı. Denetim: sahnedeki her nesne sahnenin içinde; tek nesne kartın ≥ %35'i ve sahnede ≥ 48 px; tek onluk
 * çerçeve kartın genişliğinin ≥ %60'ı.
 */

interface Olcum {
  sahne: { x: number; y: number; w: number; h: number };
  nesneler: { x: number; y: number; w: number; h: number }[];
  kartlar: { w: number; nesne: number; cerceve: number; cerceveSayisi: number }[];
}

async function olc(page: Page): Promise<Olcum> {
  return page.evaluate(() => {
    const kutu = (e: Element) => {
      const r = e.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    };
    // Nesne kutusu: `translate(x y)` + `data-nesne-boyutu` (sprite kenarı), svg'nin ekran matrisiyle (sprite içindeki
    // maske/filtre öğeleri getBoundingClientRect'i şişirir).
    const nesneKutulari = (kok: Element) =>
      [...kok.querySelectorAll('svg[data-nesne-boyutu]')].flatMap((svg) => {
        const b = Number(svg.getAttribute('data-nesne-boyutu'));
        const m = (svg as SVGSVGElement).getScreenCTM()!;
        return [...svg.querySelectorAll(':scope > g')].map((g) => {
          const t = /translate\(([-\d.e]+)[ ,]+([-\d.e]+)\)/.exec(g.getAttribute('transform') ?? '')!;
          const a = new DOMPoint(Number(t[1]), Number(t[2])).matrixTransform(m);
          const c = new DOMPoint(Number(t[1]) + b, Number(t[2]) + b).matrixTransform(m);
          return { x: a.x, y: a.y, w: c.x - a.x, h: c.y - a.y };
        });
      });
    const yuva = document.querySelector('button[aria-label^="boşluk"]')!;
    const sahneSvg = yuva.parentElement!.querySelector(':scope > svg')!;
    const nesneler = nesneKutulari(sahneSvg);
    const kartlar = [...document.querySelectorAll('button[aria-label^="Seçenek"]')].map((b) => {
      const w = b.getBoundingClientRect().width;
      const g = nesneKutulari(b).map((k) => k.w);
      // Onluk çerçeve: her çerçevenin dış ahşap yolu (fill #F4E3C3).
      const c = [...b.querySelectorAll('path[fill="#F4E3C3"]')].map((e) => e.getBoundingClientRect().width);
      return { w, nesne: Math.max(0, ...g), cerceve: Math.max(0, ...c), cerceveSayisi: c.length };
    });
    return { sahne: kutu(sahneSvg), nesneler, kartlar };
  });
}

async function ac(page: Page, sablon: string, zorluk: number, cihaz: string): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`/?gelistirme=soru&sablon=${sablon}&tohum=1&zorluk=${zorluk}&device=${cihaz}`);
  await page.getByRole('button', { name: 'Sesi aç' }).click();
  await expect(page.getByRole('button', { name: 'Tekrar dinle', exact: true })).toBeVisible();
}

/** 1920 (yalnız tahta projesi), ardından 1080×810 (her iki proje) için denetimi koşar. */
async function herGorunum(page: Page, cihaz: string, denetle: (ad: string) => Promise<void>): Promise<void> {
  await denetle(`${cihaz} ${page.viewportSize()!.width}×${page.viewportSize()!.height}`);
  if (cihaz !== 'board') return;
  await page.setViewportSize({ width: 1080, height: 810 });
  await expect.poll(() => page.evaluate(() => innerHeight)).toBe(810);
  await expect(async () => denetle('board 1080×810')).toPass({ timeout: 5_000 });
}

for (const zorluk of [1, 2, 3, 4]) {
  test(`KG-132 M-VERI-SIKLIK z${zorluk}: sahnedeki her nesne sahnenin içinde (kesik satır/sütun yok)`, async ({ page }, info) => {
    const cihaz = info.project.name === 'board' ? 'board' : 'tablet';
    await ac(page, 'M-VERI-SIKLIK', zorluk, cihaz);
    await herGorunum(page, cihaz, async (ad) => {
      const { sahne, nesneler } = await olc(page);
      expect(nesneler.length, `${ad}: nesne`).toBeGreaterThan(2);
      for (const n of nesneler) {
        const ic = n.x >= sahne.x - 1 && n.y >= sahne.y - 1 && n.x + n.w <= sahne.x + sahne.w + 1 && n.y + n.h <= sahne.y + sahne.h + 1;
        expect(ic, `${ad}: nesne ${JSON.stringify(n)} sahne ${JSON.stringify(sahne)} dışına taşıyor`).toBe(true);
      }
    });
  });
}

for (const zorluk of [1, 4]) {
  test(`KG-132 M-VERI-GRUPLA z${zorluk}: tek nesne kartta ve sahnede belirgin`, async ({ page }, info) => {
    const cihaz = info.project.name === 'board' ? 'board' : 'tablet';
    await ac(page, 'M-VERI-GRUPLA', zorluk, cihaz);
    await herGorunum(page, cihaz, async (ad) => {
      const { sahne, nesneler, kartlar } = await olc(page);
      expect(kartlar.length, `${ad}: kart`).toBeGreaterThan(1);
      for (const k of kartlar) expect(k.nesne / k.w, `${ad}: kart nesnesi ${k.nesne} / kart ${k.w}`).toBeGreaterThanOrEqual(0.35);
      expect(nesneler.length, `${ad}: sahne nesnesi`).toBeGreaterThan(1);
      for (const n of nesneler) {
        expect(Math.min(n.w, n.h), `${ad}: sahne nesnesi ${JSON.stringify(n)}`).toBeGreaterThanOrEqual(48);
        expect(n.y >= sahne.y - 1 && n.y + n.h <= sahne.y + sahne.h + 1, `${ad}: sahne nesnesi kesik`).toBe(true);
      }
    });
  });
}

test('KG-132 M-ONLUK-COZUMLE: onluk çerçeve kartı dolduruyor', async ({ page }, info) => {
  const cihaz = info.project.name === 'board' ? 'board' : 'tablet';
  await ac(page, 'M-ONLUK-COZUMLE', 3, cihaz);
  await herGorunum(page, cihaz, async (ad) => {
    const { kartlar } = await olc(page);
    const tekli = kartlar.filter((k) => k.cerceveSayisi === 1);
    expect(tekli.length, `${ad}: tek çerçeveli kart`).toBeGreaterThan(1);
    for (const k of tekli) expect(k.cerceve / k.w, `${ad}: çerçeve ${k.cerceve} / kart ${k.w}`).toBeGreaterThanOrEqual(0.6);
    for (const k of kartlar.filter((x) => x.cerceveSayisi === 2))
      expect((2 * k.cerceve) / k.w, `${ad}: iki çerçeve ${k.cerceve} / kart ${k.w}`).toBeGreaterThanOrEqual(0.6);
  });
});
