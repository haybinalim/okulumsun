// @vitest-environment happy-dom
/**
 * KG-127 SORU HOPARLÖRÜ: soru yalnız sesten ibaretse (uyaran alanı boş) üst alanda büyük bir hoparlör durur;
 * dokununca ekranın SORUSU yeniden çalar (yeni klip/TTS yok). ↻ "Tekrar dinle" alt çubukta kalır (tahtada
 * çocuğun erişebildiği eş). Görsel dil: kendi SVG, 32'lik kutu, yuvarlak uç, `<mask>` yok.
 */
import { readFileSync } from 'node:fs';
import { createElement, act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { speech } from '../../src/audio/speech';
import { REGISTRY } from '../../src/exercises/registry';
import { createRng } from '../../src/exercises/rng';
import type { Exercise } from '../../src/exercises/types';
import { ACCENTS } from '../../src/design/tokens';
import { GameShell } from '../../src/ui/layout/GameShell';
import { ExerciseScreen } from '../../src/ui/screens/ExerciseScreen';
import { HoparlorSimgesi, SORU_HOPARLORU_ETIKETI } from '../../src/ui/primitives/SoruHoparloru';
import { useAppStore } from '../../src/store/appStore';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** Uyaran alanı boş kalan (soru yalnız ses) şablonlar — KG-127 taraması (tüm zorluklar × iki mod). */
const HEP_SESLI = [
  'M-PARA-TANI',
  'M-RAKAM-TANI',
  'M-GEO-ADLANDIR',
  'M-KONUM',
  'M-TAHMIN-ISLEM',
  'M-PARA-SIRALA',
  'M-TERS-ISLEM',
  'M-GEO-ESLE',
] as const;
/** Kısmen sesli: "Hangisi çok/az?" görselsiz, "eşit mi?" sahneli. */
const KISMEN_SESLI = ['M-KARSILASTIR'] as const;

function uret(sablon: string, seed: number, d?: number, mod: 'tahta' | 'kisisel' = 'kisisel'): Exercise {
  const g = REGISTRY.get(sablon)!;
  const [lo, hi] = g.zorlukAraligi;
  const zorluk = Math.min(hi, Math.max(lo, d ?? lo));
  return g.uret({ seed, difficulty: zorluk, mod } as never, createRng(seed)) as Exercise;
}

class SahteKaynak {
  buffer: unknown = null;
  onended: (() => void) | null = null;
  playbackRate = { value: 1 };
  connect() {}
  start() {
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

let kok: Root | null = null;
let kap: HTMLDivElement;
function ciz(el: ReactElement): void {
  act(() => {
    kok = createRoot(kap);
    kok.render(el);
  });
}
const dugme = (ad: string): HTMLButtonElement | null => kap.querySelector(`button[aria-label="${ad}"]`);

beforeAll(async () => {
  (window as unknown as { AudioContext: unknown }).AudioContext = SahteBaglam;
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, arrayBuffer: async () => new ArrayBuffer(8) })));
  await speech.prime();
});
beforeEach(() => {
  useAppStore.getState().sifirla();
  kap = document.createElement('div');
  document.body.appendChild(kap);
});
afterEach(() => {
  act(() => kok?.unmount());
  kok = null;
  kap.remove();
  speech.stop();
  vi.restoreAllMocks();
});

describe('hangi sorular hoparlör alır (uyaran alanı boş = soru yalnız ses)', () => {
  for (const sablon of HEP_SESLI) {
    it(`${sablon}: her zorluk ve modda prompt görseli yok`, () => {
      const g = REGISTRY.get(sablon)!;
      for (let d = g.zorlukAraligi[0]; d <= g.zorlukAraligi[1]; d++)
        for (const mod of ['tahta', 'kisisel'] as const)
          for (let s = 1; s <= 8; s++) expect(uret(sablon, s, d, mod).prompt.gorsel).toBeUndefined();
    });
  }
  it('M-KARSILASTIR: görselsiz soru da sahneli soru da üretilir', () => {
    const turler = new Set<boolean>();
    for (let s = 1; s <= 30; s++) turler.add(uret(KISMEN_SESLI[0], s, 3).prompt.gorsel == null);
    expect([...turler].sort()).toEqual([false, true]);
  });
  it('sahneli şablonlar (ör. M-TOPLA-GORSEL, M-SAY) prompt görseli taşır', () => {
    for (let s = 1; s <= 8; s++) {
      expect(uret('M-TOPLA-GORSEL', s, 2).prompt.gorsel).toBeDefined();
      expect(uret('M-SAY', s, 2).prompt.gorsel).toBeDefined();
    }
  });
});

describe('GameShell + ExerciseScreen', () => {
  const vurgu = { id: ACCENTS[0].id, hex: ACCENTS[0].hex, speechKey: ACCENTS[0].speechKey };

  it('uyaran boşsa üstte hoparlör (yedek hedef), doluysa yok', () => {
    ciz(createElement(GameShell, { accent: '#000', stimulus: null, interaction: null }));
    const h = dugme(SORU_HOPARLORU_ETIKETI)!;
    expect(h).not.toBeNull();
    expect(h.getAttribute('data-yedek-hedef')).toBe('tekrar-dinle');
    // İlk bölüm (üst %35 uyaran alanı) içinde.
    expect(kap.querySelector('main > section:first-child')!.contains(h)).toBe(true);
    act(() => kok!.render(createElement(GameShell, { accent: '#000', stimulus: createElement('span', null, 'sahne'), interaction: null })));
    expect(dugme(SORU_HOPARLORU_ETIKETI)).toBeNull();
  });

  for (const sablon of HEP_SESLI) {
    it(`${sablon}: hoparlör üstte, ↻ "Tekrar dinle" alt çubukta kalır`, () => {
      ciz(createElement(ExerciseScreen, { exercise: uret(sablon, 1, 3), accent: vurgu, onDone: () => undefined }));
      const h = dugme(SORU_HOPARLORU_ETIKETI);
      const geri = dugme('Tekrar dinle');
      expect(h, 'hoparlör').not.toBeNull();
      expect(geri, '↻').not.toBeNull();
      expect(kap.querySelector('main > section:first-child')!.contains(h)).toBe(true);
      expect(kap.querySelector('main > section:last-child')!.contains(geri)).toBe(true);
    });
  }

  it('sahneli soruda (M-TOPLA-GORSEL) hoparlör yok, ↻ var', () => {
    ciz(createElement(ExerciseScreen, { exercise: uret('M-TOPLA-GORSEL', 1, 2), accent: vurgu, onDone: () => undefined }));
    expect(dugme(SORU_HOPARLORU_ETIKETI)).toBeNull();
    expect(dugme('Tekrar dinle')).not.toBeNull();
  });

  it('hoparlöre dokunmak soruyu yeniden çalar (soruyuTekrarla), ↻ son söyleneni (repeatLast)', () => {
    const soru = vi.spyOn(speech, 'soruyuTekrarla');
    const son = vi.spyOn(speech, 'repeatLast');
    ciz(createElement(ExerciseScreen, { exercise: uret('M-PARA-TANI', 1, 3), accent: vurgu, onDone: () => undefined }));
    act(() => dugme(SORU_HOPARLORU_ETIKETI)!.click());
    expect(soru).toHaveBeenCalledTimes(1);
    vi.spyOn(performance, 'now').mockReturnValue(performance.now() + 1000);
    act(() => dugme('Tekrar dinle')!.click());
    expect(son).toHaveBeenCalled();
  });
});

describe('speech.soruyuTekrarla', () => {
  it('şık adı söylendikten sonra da SORUYU (talimat) yüksek öncelikle çalar; çalanı keser', async () => {
    const talimat = { kind: 'sequence', keys: ['sayi.5', 'para.lira'] } as const;
    void speech.speak(talimat, { priority: 'high', talimat: true });
    void speech.speak({ kind: 'sequence', keys: ['sayi.10', 'para.lira'] }); // çocuk bir şıkka dokundu
    const dur = vi.spyOn(speech, 'stop');
    const soyle = vi.spyOn(speech, 'speak');
    await speech.soruyuTekrarla(0.85);
    expect(soyle).toHaveBeenCalledWith(talimat, expect.objectContaining({ priority: 'high', talimat: true, rate: 0.85 }));
    expect(dur).toHaveBeenCalled();
  });
  it('talimat yoksa repeatLast\'a düşer', async () => {
    speech.talimatiUnut();
    const son = vi.spyOn(speech, 'repeatLast');
    await speech.soruyuTekrarla();
    expect(son).toHaveBeenCalledTimes(1);
  });
});

describe('görsel dil (KG-104: kendi SVG)', () => {
  it('32\'lik görünüm kutusu, yuvarlak uç, currentColor, <mask> yok, erişilebilirlikten gizli', () => {
    const svg = renderToStaticMarkup(createElement(HoparlorSimgesi));
    expect(svg).toContain('viewBox="0 0 32 32"');
    expect(svg).toContain('stroke-linecap="round"');
    expect(svg).toContain('currentColor');
    expect(svg).toContain('aria-hidden="true"');
    expect(svg).not.toMatch(/<mask|<image|href=/);
  });
  it('nabız sınıfı yalnız istenince (çalarken ve hareket azaltma kapalıyken)', () => {
    expect(renderToStaticMarkup(createElement(HoparlorSimgesi))).not.toContain('hoparlor-dalga');
    expect(renderToStaticMarkup(createElement(HoparlorSimgesi, { nabiz: true }))).toContain('hoparlor-dalga');
  });
  it('hareket azaltma açıkken çalarken bile nabız yok', () => {
    useAppStore.setState((s) => ({ kapsayicilik: { ...s.kapsayicilik, hareketAzalt: true } }));
    vi.spyOn(speech, 'state', 'get').mockReturnValue('calisiyor');
    ciz(createElement(GameShell, { accent: '#000', stimulus: null, interaction: null }));
    expect(kap.querySelector('[data-soru-hoparloru]')!.hasAttribute('data-caliyor')).toBe(true);
    expect(kap.querySelector('.hoparlor-dalga')).toBeNull();
  });
  it('paraTani.ts başlık yorumu artık "Kaç lira?" demiyor', () => {
    const bas = readFileSync('src/exercises/templates/paraTani.ts', 'utf8').slice(0, 800);
    expect(bas).not.toContain('Kaç lira');
    expect(bas).toContain('KG-127');
  });
});
