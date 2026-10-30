import { chromium } from '@playwright/test';
const [w, h, cihaz, glif, cikti, azalt, adim] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--disable-gpu'] });
const p = await b.newPage({ viewport: { width: +w, height: +h }, hasTouch: true });
await p.emulateMedia({ reducedMotion: azalt === '0' ? 'no-preference' : 'reduce' });
await p.goto(`http://localhost:5174/?ders=tur${cihaz && cihaz !== '-' ? '&device=' + cihaz : ''}`);
await p.getByRole('button', { name: 'Başla' }).click();
await p.getByRole('button', { name: 'Harf ve rakam yazılışı' }).click();
await p.waitForTimeout(500);
if (glif && glif !== '-') {
  const [sekme, ad] = glif.split('|');
  if (sekme) { await p.getByRole('group', { name: 'Gruplar' }).getByRole('button').nth(+sekme).click(); await p.waitForTimeout(400); }
  await p.getByRole('button', { name: ad, exact: true }).click(); await p.waitForTimeout(azalt === '0' ? 9000 : 600);
  for (let i = 1; i < +(adim ?? 1); i++) { await p.getByRole('button', { name: 'Sonraki hamle' }).click(); await p.waitForTimeout(350); }
}
await p.screenshot({ path: cikti });
await b.close();
