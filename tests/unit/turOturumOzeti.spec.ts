// @vitest-environment happy-dom
/**
 * Adım 81, E5 — oturum özeti (öğretmen): nitel ("Bu derste ne yaptık"), yalnız bellekte, ekrandan çıkınca silinir,
 * hiçbir depoya yazılmaz (matematikteki ısınma "hiçbir yazım yok" testi deseni: `depolamaCasusuKur`).
 */
import { readFileSync } from 'node:fs';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SetAdimi } from '../../src/content/dersler/tur/turSet';
import {
  DUZEY_METNI,
  etkinlikDuzeyi,
  ozetAcikMi,
  ozetBaslat,
  ozetCozuldu,
  ozetEtkinlikAcildi,
  ozetHarfleri,
  ozetKaydi,
  ozetOlustur,
  ozetSil,
  ozetTekrarDinlendi,
  ozetYanlisDenendi,
} from '../../src/ui/tur/oturumOzeti';
import { OGRETIM_SIRASI, trBuyuk } from '../../src/content/dersler/tur/alfabe';
import { resmiKume } from '../../src/content/dersler/tur/ogretilenKume';
import { SetAkisi } from '../../src/ui/tur/TurPlanSet';
import { depolamaCasusuKur } from './yardimci/depolamaCasusu';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let kok: Root | undefined;
let kap: HTMLDivElement | undefined;

beforeEach(() => ozetSil());
afterEach(() => {
  if (kok) act(() => kok!.unmount());
  kok = undefined;
  kap?.remove();
  kap = undefined;
  document.getElementById('tur-ozet-baski')?.remove();
  vi.restoreAllMocks();
});

function oturumKos(): void {
  ozetBaslat();
  ozetEtkinlikAcildi(0, 'T-02');
  ozetCozuldu(); // hemen çözüldü
  ozetEtkinlikAcildi(1, 'T-04');
  ozetYanlisDenendi();
  ozetCozuldu(); // birlikte çözüldü
  ozetEtkinlikAcildi(2, 'T-07');
  ozetTekrarDinlendi();
  ozetCozuldu(); // yardım istendi
  ozetEtkinlikAcildi(2, 'T-07'); // aynı adım yeniden bildirilirse tek kayıt
}

const ADIMLAR: readonly SetAdimi[] = [
  { sablon: 'T-02', zorluk: 1, tohum: 1 },
  { sablon: 'T-04', zorluk: 1, tohum: 2 },
  { sablon: 'T-07', zorluk: 1, tohum: 3 },
];

async function sonEkranCiz(): Promise<void> {
  kap = document.createElement('div');
  document.body.appendChild(kap);
  kok = createRoot(kap);
  await act(async () =>
    kok!.render(createElement(SetAkisi, { adimlar: ADIMLAR, sira: ADIMLAR.length, geri: { ekran: 'setHazirla' } })),
  );
}

describe('nitel özet (saf)', () => {
  it('harfler, etkinlik türleri, açılan etkinlik ve etkinlik başına nitel düzey', () => {
    oturumKos();
    const o = ozetOlustur(ozetKaydi()!, ozetHarfleri(resmiKume('e', false)));
    const kume = resmiKume('e', false);
    expect(o.harfler).toEqual(OGRETIM_SIRASI.filter((h) => kume.has(h)).map((h) => (kume.has(trBuyuk(h)) ? `${h} ${trBuyuk(h)}` : h)));
    expect(o.harfler.at(-1)).toBe('e'); // yeni öğretilen harfin büyüğü henüz açık değil
    expect(o.turler).toEqual(['T-02', 'T-04', 'T-07']);
    expect(o.acilan).toBe(3);
    expect(o.satirlar.map((s) => s.duzey)).toEqual(['hemen', 'birlikte', 'yardim']);
    expect(o.birlikteCozulen).toEqual(['T-04']);
    expect(o.yardimIstenen).toEqual(['T-07']);
  });

  it('düzey sınıflaması', () => {
    const k = { sablon: 'T-02' as const, birlikte: false, yardim: false, cozuldu: true };
    expect(etkinlikDuzeyi(k)).toBe('hemen');
    expect(etkinlikDuzeyi({ ...k, birlikte: true })).toBe('birlikte');
    expect(etkinlikDuzeyi({ ...k, yardim: true })).toBe('yardim');
    expect(etkinlikDuzeyi({ ...k, birlikte: true, yardim: true })).toBe('birlikteVeYardim');
    expect(etkinlikDuzeyi({ ...k, cozuldu: false })).toBe('cozulmedi');
  });

  it('metinlerde sayı, yüzde, puan, süre ya da öğrenci adı yok', () => {
    for (const m of Object.values(DUZEY_METNI)) expect(m).not.toMatch(/\d|%|puan|süre|saniye|dakika/i);
  });

  it('oturum açık değilken olaylar hiçbir şey yapmaz (tek etkinlik, eve link cihazı)', () => {
    expect(ozetAcikMi()).toBe(false);
    ozetEtkinlikAcildi(0, 'T-02');
    ozetYanlisDenendi();
    ozetTekrarDinlendi();
    ozetCozuldu();
    expect(ozetKaydi()).toBeNull();
  });
});

describe('set sonu ekranı', () => {
  it('"Bu derste ne yaptık": nitel metin, sayı/yüzde/puan yok; yazdır düğmesi var', async () => {
    // Set akışı adımları sırayla açılırken kayıt doluyor; son ekran açıldığında oturum içeriği gösterilir.
    await sonEkranCiz();
    oturumKos();
    await act(async () => undefined);
    // Oturum, ekran açıkken doldurulduğundan yeniden çizdirmek için aynı ekranı tazele.
    await act(async () =>
      kok!.render(createElement(SetAkisi, { adimlar: ADIMLAR, sira: ADIMLAR.length, geri: { ekran: 'setHazirla' } })),
    );
    const ozet = document.querySelector('[data-oturum-ozeti]');
    expect(ozet).not.toBeNull();
    const metin = ozet!.textContent!;
    expect(metin).toContain('Harfler:');
    expect(metin).toContain('Etkinlik türleri:');
    expect(metin).toContain('Yanlış denemeden sonra düzeltilerek çözüldü');
    expect(metin).toContain('Soru yeniden dinlendi');
    expect(metin).not.toMatch(/%|puan|yüzde|saniye|dakika|doğru sayısı/i);
    expect(document.querySelectorAll('[data-oz-ekran] li').length).toBe(3);
    const yaz = vi.fn();
    window.print = yaz;
    const dugme = [...document.querySelectorAll('button')].find((b) => b.getAttribute('aria-label') === 'Özeti yazdır');
    expect(dugme).toBeDefined();
    await act(async () => dugme!.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    // Baskı kopyası #root dışında (body altında) bulunur; ağ yok.
    expect(document.querySelector('#tur-ozet-baski [data-oturum-ozeti]')).not.toBeNull();
    expect(yaz).toHaveBeenCalledTimes(1);
  });

  it('hiçbir depoya yazılmaz: localStorage, sessionStorage, IndexedDB, çerez, önbellek, ağ', async () => {
    const casus = depolamaCasusuKur();
    const ag = vi.fn();
    const eskiFetch = globalThis.fetch;
    globalThis.fetch = ag as unknown as typeof fetch;
    const sinyal = vi.spyOn(navigator, 'sendBeacon' as never).mockImplementation((() => false) as never);
    try {
      await sonEkranCiz();
      oturumKos();
      await act(async () =>
        kok!.render(createElement(SetAkisi, { adimlar: ADIMLAR, sira: ADIMLAR.length, geri: { ekran: 'setHazirla' } })),
      );
      expect(document.querySelector('[data-oturum-ozeti]')).not.toBeNull();
      expect(casus.cagrilar()).toEqual([]);
      expect(ag).not.toHaveBeenCalled();
      expect(sinyal).not.toHaveBeenCalled();
      expect(localStorage.length).toBe(0);
      expect(sessionStorage.length).toBe(0);
    } finally {
      casus.sok();
      globalThis.fetch = eskiFetch;
    }
  });

  it('ekrandan çıkınca (set ekranı kalkınca) kayıt silinir', async () => {
    await sonEkranCiz();
    oturumKos();
    expect(ozetKaydi()!.length).toBe(3);
    await act(async () => kok!.unmount());
    kok = undefined;
    expect(ozetKaydi()).toBeNull();
    expect(ozetAcikMi()).toBe(false);
  });

  it('eve link cihazında (veli) özet tutulmaz ve gösterilmez', async () => {
    window.history.replaceState(null, '', '/?ders=tur&ev=s1&tur=1z');
    try {
      await sonEkranCiz();
      expect(ozetAcikMi()).toBe(false);
      ozetEtkinlikAcildi(0, 'T-02');
      ozetCozuldu();
      expect(ozetKaydi()).toBeNull();
      expect(document.querySelector('[data-set-bitti]')).not.toBeNull();
      expect(document.querySelector('[data-oturum-ozeti]')).toBeNull();
      expect(document.getElementById('tur-ozet-baski')).toBeNull();
    } finally {
      window.history.replaceState(null, '', '/');
    }
  });
});

describe('kaynak: depolama, ağ, zaman, puan yok', () => {
  const yollar = ['src/ui/tur/oturumOzeti.ts', 'src/ui/tur/TurOturumOzeti.tsx'];
  it.each(yollar)('%s', (yol) => {
    const kod = readFileSync(yol, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(kod).not.toMatch(/localStorage|sessionStorage|indexedDB|document\.cookie|caches\b|fetch\(|sendBeacon|XMLHttpRequest|Date\.now|performance\.now|new Date/);
    expect(kod).not.toMatch(/puan|skor|yüzde|rozet|yıldız/i);
  });
});
