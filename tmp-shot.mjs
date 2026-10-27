// Geçici: önce/sonra ekran görüntüsü (commitlenmez).
import { chromium } from '@playwright/test';
const [, , cikti, etiket] = process.argv;
const b = await chromium.launch();
async function sayfa(w, h, device) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto(`http://localhost:5173/?device=${device}`);
  await p.getByRole('button', { name: 'Başla' }).click();
  return p;
}
async function bekle(p) { await p.waitForTimeout(900); }
// Tablet: kişisel → alıştırma
{
  const p = await sayfa(1080, 810, 'tablet');
  await p.getByRole('button', { name: 'Kendi başıma çalışacağım.' }).click();
  await p.getByRole('button', { name: 'Kedi' }).click();
  await p.getByRole('button', { name: 'Renk mor' }).click();
  await p.getByRole('button', { name: 'Başla', exact: true }).click();
  await p.waitForFunction(() => window.__okulumsunE2E?.alistirma != null, null, { timeout: 15000 });
  await bekle(p);
  await p.screenshot({ path: `${cikti}/${etiket}-tablet-alistirma.png` });
  await p.context().close();
}
// Tahta: tahta modu → tema → konu → alıştırma
{
  const p = await sayfa(1920, 1080, 'board');
  await p.getByRole('button', { name: 'Tahtada birlikte çalışalım.' }).click();
  await p.getByRole('button', { name: 'Yön ve Yerler', exact: true }).click();
  await bekle(p);
  await p.screenshot({ path: `${cikti}/${etiket}-tahta-konu.png` });
  const konu = p.locator('button:not([disabled])');
  const etiketler = await konu.evaluateAll((bs) => bs.map((x) => x.getAttribute('aria-label') ?? x.textContent ?? ''));
  const ilk = etiketler.find((e) => e && !/Geri|Yardım|Yönergeyi|tekrar dinle|Ana menü|Tema sonu/i.test(e));
  await p.getByRole('button', { name: ilk, exact: true }).first().click();
  await p.waitForFunction(() => window.__okulumsunE2E?.alistirma != null, null, { timeout: 15000 });
  await bekle(p);
  await p.screenshot({ path: `${cikti}/${etiket}-tahta-alistirma.png` });
  await p.context().close();
}
await b.close();
