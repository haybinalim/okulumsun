// @vitest-environment happy-dom
/**
 * Adım 81, E5 entegrasyon: set-sonu özeti GERÇEK etkinlik akışıyla dolar (oturum kaydı elle doldurulmaz).
 * SetAkisi → TurEtkinlikEkrani (gerçek havuz verisi, diskten) → "Tekrar dinle", yanlış kart, doğru kart, "Sonraki" →
 * "Set bitti" özeti. Bağlantılar (`soruSesi → ozetTekrarDinlendi`, `kartaDokun → ozetYanlisDenendi`,
 * `dogruOldu → ozetCozuldu`) koparsa bu test düşer.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const KOK = path.resolve(__dirname, '../../ders-verisi/tur');
function sahteFetch(url: string): Promise<unknown> {
  const goreli = url.replace(/^\.\/tur\//, '');
  if (goreli.endsWith('.m4a')) return Promise.resolve({ ok: true, status: 200, arrayBuffer: async () => new ArrayBuffer(8) });
  return Promise.resolve({ ok: true, status: 200, json: async () => JSON.parse(readFileSync(path.join(KOK, goreli), 'utf8')) });
}

let kok: Root | null = null;
let kap: HTMLDivElement;
const bekle = (ms: number) => act(async () => void (await new Promise((r) => setTimeout(r, ms))));
const dugme = (ad: string) =>
  [...kap.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.getAttribute('aria-label') === ad || b.textContent === ad);

async function karti(): Promise<{ ana: Element; cevap: string }> {
  for (let i = 0; i < 80 && !kap.querySelector('[data-kart]'); i++) await bekle(25);
  await bekle(60);
  const ana = kap.querySelector('main[data-tur-etkinlik]')!;
  expect(ana, 'etkinlik ekranı kuruldu').toBeTruthy();
  return { ana, cevap: ana.getAttribute('data-cevap')! };
}
const tikla = async (e: Element | undefined | null) => {
  expect(e).toBeTruthy();
  act(() => (e as HTMLElement).click());
  await bekle(60);
};

beforeEach(() => {
  kap = document.createElement('div');
  document.body.appendChild(kap);
});
afterEach(() => {
  act(() => kok?.unmount());
  kok = null;
  kap.remove();
  document.getElementById('tur-ozet-baski')?.remove();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('set-sonu özeti gerçek etkinlik akışıyla dolar', () => {
  it('T-02: "Tekrar dinle" + yanlış kart + doğru kart; T-03: doğrudan; özet iki etkinliği nitel gösterir', async () => {
    delete (window as { __okulumsunE2E?: unknown }).__okulumsunE2E;
    vi.resetModules();
    vi.stubEnv('VITE_DERS_TUR', '1');
    vi.stubGlobal('fetch', vi.fn(sahteFetch));
    const { SetAkisi } = await import('../../src/ui/tur/TurPlanSet');
    const { ozetKaydi } = await import('../../src/ui/tur/oturumOzeti');
    const adimlar = [
      { sablon: 'T-02', zorluk: 1, tohum: 7 },
      { sablon: 'T-03', zorluk: 1, tohum: 7 },
    ] as const;
    const { turEkraniAc, useTurEkrani } = await import('../../src/ui/tur/turEkraniDurumu');
    // Sonraki, ekran durumunu değiştirir (uygulamadaki TurEkrani gibi durumu izleyen kök).
    const Kok = () => {
      const e = useTurEkrani();
      return e?.ekran === 'set' ? createElement(SetAkisi, { adimlar: e.adimlar, sira: e.sira, geri: e.geri }) : null;
    };
    act(() => turEkraniAc({ ekran: 'set', adimlar, sira: 0, geri: { ekran: 'setHazirla' } }));
    act(() => {
      kok = createRoot(kap);
      kok.render(createElement(Kok));
    });

    // 1. etkinlik: soru yeniden dinlendi + yanlış deneme + doğru.
    let { ana, cevap } = await karti();
    expect(ana.getAttribute('data-tur-etkinlik')).toBe('T-02');
    expect(ozetKaydi()).toEqual([{ sablon: 'T-02', birlikte: false, yardim: false, cozuldu: false }]);
    await tikla(dugme('Tekrar dinle'));
    expect(ozetKaydi()![0]).toMatchObject({ yardim: true, birlikte: false, cozuldu: false });
    const kartlar = [...kap.querySelectorAll<HTMLButtonElement>('button[data-kart]')];
    await tikla(kartlar.find((k) => k.getAttribute('data-kart') !== cevap));
    expect(ozetKaydi()![0]).toMatchObject({ yardim: true, birlikte: true, cozuldu: false });
    await tikla(kap.querySelector(`button[data-kart="${cevap}"]`));
    expect(ozetKaydi()![0]).toMatchObject({ yardim: true, birlikte: true, cozuldu: true });
    await bekle(600); // düğme soğuması
    await tikla(dugme('Sonraki'));

    // 2. etkinlik: doğrudan çözülür.
    for (let i = 0; i < 80 && kap.querySelector('main[data-tur-etkinlik]')?.getAttribute('data-tur-etkinlik') !== 'T-03'; i++) await bekle(25);
    ({ ana, cevap } = await karti());
    expect(ana.getAttribute('data-tur-etkinlik')).toBe('T-03');
    await tikla(kap.querySelector(`button[data-kart="${cevap}"]`));
    await bekle(600);
    await tikla(dugme('Sonraki'));

    // Set sonu: özet kayıttan, nitel metinle.
    const ozet = kap.querySelector('[data-oz-ekran] [data-oturum-ozeti]');
    expect(ozet, 'set sonu özeti göründü').not.toBeNull();
    const satirlar = [...ozet!.querySelectorAll('li')].map((l) => l.getAttribute('data-duzey'));
    expect(satirlar).toEqual(['birlikteVeYardim', 'hemen']);
    const metin = ozet!.textContent!;
    expect(metin).toContain('Yanlış denemeden sonra düzeltilerek çözüldü');
    expect(metin).toContain('soru yeniden dinlendi');
    expect(metin).not.toMatch(/%|puan|yüzde|saniye|dakika/i);
  });
});
