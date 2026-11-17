import type { Page } from '@playwright/test';

/**
 * Ses durumunu gerçek veriden BAĞIMSIZ kurar: `klipler.json` yanıtında bütün klipler `eksik` yapılır (gerçek klipler
 * gelse de "Ses yok" yolu deterministik; `var` klip çalma yolu `tur-ses-calma.spec.ts`te sınanır). Sayfa başına bir kez.
 */
const eksikKurulan = new WeakSet<Page>();
export async function sesiEksikKur(page: Page) {
  if (eksikKurulan.has(page)) return;
  eksikKurulan.add(page);
  await page.route('**/tur/ses/klipler.json', async (rota) => {
    const yanit = await rota.fetch();
    const j = (await yanit.json()) as { klipler: { durum: string; dosya?: string }[] };
    for (const k of j.klipler) {
      k.durum = 'eksik';
      delete k.dosya;
    }
    await rota.fulfill({ json: j });
  });
}
