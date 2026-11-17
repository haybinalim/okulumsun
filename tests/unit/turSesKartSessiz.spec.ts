// @vitest-environment happy-dom
/**
 * D-11 (ek) / K-OY-03: harf ve hece SEÇENEK KARTI cevaptan önce sessizdir. Çalıcı bağlandıktan sonra da: gerçek
 * Türkçe etkinlik ekranı (T-02/T-03/T-04…), gerçek havuz verisi ve (sahte) `var` klip manifesti ile kartlara
 * dokunmak hiçbir ses dosyası istemez ve çalmaz; yalnız geri bildirim (yanlış: "tekrar", doğru: övgü) çalar.
 * Kural kodda `TurEtkinlikEkrani.kartaDokun` içindedir: kart dokunuşu klip istemez, yalnız `iste(geriBildirim)`.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const KOK = path.resolve(__dirname, '../../ders-verisi/tur');
const baslatilan: string[] = [];
class SahteKaynak {
  buffer: unknown = null;
  onended: (() => void) | null = null;
  playbackRate = { value: 1 };
  connect() {}
  start() {
    baslatilan.push('basladi');
    setTimeout(() => this.onended?.(), 1);
  }
  stop() {}
}
class SahteBaglam {
  state = 'running';
  destination = {};
  async resume() {}
  createBuffer() {
    return {};
  }
  createBufferSource() {
    return new SahteKaynak();
  }
  async decodeAudioData() {
    return { duration: 0.001 };
  }
}

const sesIstekleri: string[] = [];
/** Gerçek veri dosyaları diskten; klip manifesti ise HER klibi `var` yapılmış hâliyle (yalnız bellekte; diske yazılmaz). */
function sahteFetch(url: string): Promise<unknown> {
  const goreli = url.replace(/^\.\/tur\//, '');
  if (goreli.endsWith('.m4a')) {
    sesIstekleri.push(goreli.replace(/^ses\//, '').replace(/\.m4a$/, ''));
    return Promise.resolve({ ok: true, status: 200, arrayBuffer: async () => new ArrayBuffer(8) });
  }
  const ham = JSON.parse(readFileSync(path.join(KOK, goreli), 'utf8')) as { klipler?: { anahtar: string; durum: string; dosya?: string }[] };
  if (goreli === 'ses/klipler.json') {
    for (const k of ham.klipler ?? []) {
      const [, tur, ad] = k.anahtar.split('.');
      k.durum = 'var';
      k.dosya = `${tur}/${ad}.m4a`;
    }
  }
  return Promise.resolve({ ok: true, status: 200, json: async () => ham });
}

let kok: Root | null = null;
let kap: HTMLDivElement;
const bekle = (ms: number) => act(async () => void (await new Promise((r) => setTimeout(r, ms))));

async function ac(sablon: 'T-02' | 'T-03' | 'T-04' | 'T-05' | 'T-06', tohum: number, zorluk: 1 | 3 = 1) {
  delete (window as { __okulumsunE2E?: unknown }).__okulumsunE2E;
  vi.resetModules();
  vi.stubEnv('VITE_DERS_TUR', '1');
  (window as unknown as { AudioContext: unknown }).AudioContext = SahteBaglam;
  vi.stubGlobal('fetch', vi.fn(sahteFetch));
  const { speech } = await import('../../src/audio/speech');
  await speech.prime();
  baslatilan.length = 0;
  const { TurEtkinlikEkrani } = await import('../../src/ui/tur/TurEtkinlikEkrani');
  const { createElement } = await import('react');
  act(() => {
    kok = createRoot(kap);
    kok.render(createElement(TurEtkinlikEkrani, { sablon, zorluk, tohum, onSonraki: () => {} }));
  });
  for (let i = 0; i < 40 && !kap.querySelector('[data-kart]'); i++) await bekle(25);
  await bekle(60);
}

beforeEach(() => {
  sesIstekleri.length = 0;
  kap = document.createElement('div');
  document.body.appendChild(kap);
});
afterEach(() => {
  act(() => kok?.unmount());
  kok = null;
  kap.remove();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('seçenek kartı cevaptan önce sessiz (D-11), çalıcı bağlıyken', () => {
  for (const sablon of ['T-02', 'T-03', 'T-04', 'T-05', 'T-06'] as const) {
    it(`${sablon}: yönerge açılışta çalar; karta dokunmak kartın kendi sesini istemez`, async () => {
      await ac(sablon, 7);
      const ana = kap.querySelector('main[data-tur-etkinlik]')!;
      expect(ana, 'etkinlik ekranı kuruldu').toBeTruthy();
      const cevap = ana.getAttribute('data-cevap')!;
      const kartlar = [...kap.querySelectorAll<HTMLButtonElement>('button[data-kart]')];
      expect(kartlar.length).toBeGreaterThan(1);
      const istenen = () => [...(window.__okulumsunE2E?.istenenKlipler ?? [])];
      const acilis = [...sesIstekleri];
      const acilisIstenen = istenen();
      expect(acilis.length, 'açılışta yönerge çalındı').toBeGreaterThan(0);
      expect(acilis[0]).toMatch(/^yonerge\//);
      expect(acilis.some((k) => k.startsWith('geri/'))).toBe(false);

      const yanlis = kartlar.find((k) => k.getAttribute('data-kart') !== cevap)!;
      act(() => yanlis.click());
      await bekle(60);
      // Yanlış karta dokunmak yalnız "tekrar" geri bildirimi ister; kartın kendi sesi (harf/hece klibi) YOK.
      const yeni = sesIstekleri.slice(acilis.length);
      // Seçimde yanlış kart "tekrar" ister; yerleştirme/çoklu seçimde dokunuş tümüyle sessizdir (Onayla'ya dek).
      const beklenen = ana.getAttribute('data-tur-kind') === 'secim' ? ['geri/tekrar'] : [];
      expect(yeni).toEqual(beklenen);
      // Servise giden İSTEKLER de aynı: kart için hiçbir klip anahtarı istenmez (manifestte olmasa bile).
      expect(istenen().slice(acilisIstenen.length)).toEqual(beklenen.map((k) => `tur.${k.replace('/', '.')}`));
      expect(sesIstekleri.some((k) => k.startsWith('harf/'))).toBe(false);
    });
  }
});

describe('T-02 doğru cevap: neden doğru (kapanış klibi) ve ünsüz hedefte kart vurgusu', () => {
  const UNLULER = new Set(['a', 'e', 'ı', 'i', 'o', 'ö', 'u', 'ü']);
  for (const [zorluk, konum] of [[1, 'bas'], [3, 'her']] as const) {
    it(`z${zorluk}: ünlüde ünlü kapanışı, ünsüzde "harf" kapanışı + vurgu; kapanış yalnız doğru cevaptan sonra`, async () => {
      const gorulen = { unlu: false, unsuz: false };
      for (let tohum = 1; tohum <= 40 && !(gorulen.unlu && gorulen.unsuz); tohum++) {
        if (kok) {
          act(() => kok?.unmount());
          kok = null;
        }
        await ac('T-02', tohum, zorluk);
        const ana = kap.querySelector('main[data-tur-etkinlik]')!;
        const kart = kap.querySelector<HTMLButtonElement>(`button[data-kart="${ana.getAttribute('data-cevap')}"]`)!;
        const hedef = kart.getAttribute('data-kart-metin')!;
        const unlu = UNLULER.has(hedef);
        if (unlu ? gorulen.unlu : gorulen.unsuz) continue;
        gorulen[unlu ? 'unlu' : 'unsuz'] = true;
        const istenen = () => [...(window.__okulumsunE2E?.istenenKlipler ?? [])];
        expect(istenen().some((k) => k.startsWith('tur.geri.')), 'kapanış cevaptan önce yok').toBe(false);
        expect(kart.hasAttribute('data-vurgu')).toBe(false);
        act(() => kart.click());
        for (let i = 0; i < 80 && !istenen().some((k) => /^tur\.geri\.(bas|her)-/.test(k)); i++) await bekle(50);
        const ek = unlu ? hedef.replace('ı', 'i2').replace('ö', 'o2').replace('ü', 'u2') : 'harf';
        expect(istenen().slice(-1)[0]).toBe(`tur.geri.${konum}-${ek}`);
        expect(istenen().filter((k) => /^tur\.geri\.(bas|her)-/.test(k))).toHaveLength(1);
        // Ünsüz harf adı hiçbir klipte yok; ünsüzde kart vurgulanır, ünlüde vurgu gerekmez.
        expect(istenen().some((k) => k.startsWith('tur.harf.'))).toBe(false);
        expect(kap.querySelector(`button[data-kart="${ana.getAttribute('data-cevap')}"]`)!.hasAttribute('data-vurgu')).toBe(!unlu);
        expect(kap.querySelectorAll('[data-vurgu]').length).toBe(unlu ? 0 : 1);
      }
      expect(gorulen, 'her iki hedef türü de görüldü').toEqual({ unlu: true, unsuz: true });
    });
  }
});
