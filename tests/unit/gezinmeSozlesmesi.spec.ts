// @vitest-environment happy-dom
/**
 * KG-103 SÖZLEŞME: "her ekranda gezinme var". Yeni bir ekran Geri / Ana menü düğmesiz kalamaz:
 *  1. `EKRANLAR`daki her ekran, gezinmesiz üçlü dışında, çerçevede iki düğmeyle çizilir;
 *  2. `App.tsx`teki her ekran dalı ortak kabuktan (EkranCercevesi) geçer, başka sarmalayıcı yoktur;
 *  3. ekranlar kendi yerel "Geri" düğmesini yeniden yazmaz (tek bileşen kuralı).
 * Ayrıca bileşen davranışı: düğmeler, çıkış onayı (Evet/Hayır/Esc) ve tarayıcı geri tuşu.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { createElement, act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EKRANLAR, useAppStore, type Ekran } from '../../src/store/appStore';
import { GEZINMESIZ_EKRANLAR } from '../../src/ui/gezinme/gezinme';
import { EkranCercevesi } from '../../src/ui/gezinme/EkranCercevesi';
import { GezinmeCubugu } from '../../src/ui/gezinme/GezinmeCubugu';
import { useCikisOnayi } from '../../src/ui/gezinme/gezinmeIstegi';
import { useGeriTusu } from '../../src/ui/gezinme/useGeriTusu';
import type { GunlukSet } from '../../src/ogretmen/gunlukSet';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const SET: GunlukSet = { surum: 1, dugumler: ['mat.uzam.konum-ifadeleri'], tohum: 5 };
let kok: Root | null = null;
let kap: HTMLDivElement;

function ciz(el: ReactElement): void {
  act(() => {
    kok = createRoot(kap);
    kok.render(el);
  });
}
const dugme = (ad: string): HTMLButtonElement | null => kap.querySelector(`button[aria-label="${ad}"]`);
function bas(ad: string): void {
  const b = dugme(ad);
  if (!b) throw new Error(`düğme yok: ${ad}`);
  act(() => b.click());
}
/** BigButton 250 ms soğuma: ardışık basışlar arasında saat ilerletilir. */
function soguma(): void {
  vi.spyOn(performance, 'now').mockReturnValue(performance.now() + 1000);
}

beforeEach(() => {
  useAppStore.getState().sifirla();
  useCikisOnayi.setState({ bekleyen: null });
  kap = document.createElement('div');
  document.body.appendChild(kap);
});
afterEach(() => {
  act(() => kok?.unmount());
  kok = null;
  kap.remove();
  vi.restoreAllMocks();
});

describe('sözleşme: her ekranda Geri ve Ana menü', () => {
  for (const ekran of EKRANLAR) {
    const gezinmesiz = GEZINMESIZ_EKRANLAR.has(ekran);
    it(`${ekran}: ${gezinmesiz ? 'gezinmesiz (belgeli)' : 'Geri + Ana menü görünür'}`, () => {
      useAppStore.setState({ mod: 'tahta', ekran });
      ciz(createElement(EkranCercevesi, { profil: 'tablet' }, createElement('p', null, 'içerik')));
      expect(kap.textContent).toContain('içerik');
      if (gezinmesiz) {
        expect(kap.querySelector('[data-gezinme]')).toBeNull();
      } else {
        expect(kap.querySelectorAll('[data-gezinme] button')).toHaveLength(2);
        expect(dugme('Geri')).not.toBeNull();
        expect(dugme('Ana menü')).not.toBeNull();
      }
    });
  }

  it('App.tsx: her ekran dalı ortak kabuktan geçer (EkranCercevesi), başka sarmalayıcı yok', () => {
    const app = readFileSync('src/App.tsx', 'utf8');
    expect(app.match(/<BoardHarness /g)).toHaveLength(1);
    expect(app.match(/<EkranCercevesi /g)).toHaveLength(1);
    // `if (ekran === …)` dallarının ve son alıştırma dalının hepsi `return kabuk(` ile döner.
    const dallar = [...app.matchAll(/if \(ekran === [^\n]*\{\n\s*return (\w+)\(/g)].map((m) => m[1]);
    expect(dallar.length).toBeGreaterThanOrEqual(22);
    expect(new Set(dallar)).toEqual(new Set(['kabuk']));
    expect(app).toMatch(/\n {2}return kabuk\(\n/); // son dal: alıştırma
    expect(app).not.toMatch(/\n {2,4}return \(\s*\n\s*</); // kabuksuz JSX dönüşü yok
  });

  it('ekranlar yerel "Geri" düğmesi yazmaz (tek ortak bileşen)', () => {
    const ekranlar = readdirSync('src/ui/screens').filter((f) => f.endsWith('.tsx'));
    for (const f of ekranlar) {
      const k = readFileSync(`src/ui/screens/${f}`, 'utf8');
      expect(k, f).not.toMatch(/label="Geri"|aria-label="Geri"|label="Ana menü"/);
    }
  });
});

describe('GezinmeCubugu', () => {
  it('simge + kısa metin, erişilebilir adlar; verilmeyen düğme çizilmez', () => {
    const geri = vi.fn();
    ciz(createElement(GezinmeCubugu, { onGeri: geri, yon: 'dikey', hizala: 'son' }));
    expect(kap.querySelector('nav[aria-label="Gezinme"]')).not.toBeNull();
    expect(dugme('Geri')?.querySelector('svg')).not.toBeNull();
    expect(dugme('Geri')?.textContent).toBe('Geri');
    expect(dugme('Ana menü')).toBeNull();
    bas('Geri');
    expect(geri).toHaveBeenCalledOnce();
  });
});

describe('EkranCercevesi davranışı', () => {
  it('onaysız ekranda Geri ve Ana menü hemen gider', () => {
    useAppStore.getState().modSec('tahta');
    useAppStore.getState().ekranGit('veliPaneli');
    useAppStore.getState().ekranGit('kaynaklar');
    ciz(createElement(EkranCercevesi, { profil: 'tablet' }, null));
    bas('Geri');
    expect(useAppStore.getState().ekran).toBe('veliPaneli');
    soguma();
    bas('Ana menü');
    expect(useAppStore.getState().ekran).toBe('anaEkran');
    expect(kap.querySelector('[data-gezinme]')).toBeNull(); // ana ekranda gezinme yok
  });

  it('set ortasında: "Etkinlikten çıkmak istiyor musun?" — Hayır kalır, Evet çıkar', () => {
    useAppStore.getState().modSec('tahta');
    useAppStore.getState().ekranGit('setHazirla');
    useAppStore.getState().setBaslat(SET);
    ciz(createElement(EkranCercevesi, { profil: 'board' }, null));
    bas('Geri');
    const pencere = kap.querySelector('[role="alertdialog"]');
    expect(pencere?.textContent).toContain('Etkinlikten çıkmak istiyor musun?');
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Hayır, devam et');
    bas('Hayır, devam et');
    expect(kap.querySelector('[role="alertdialog"]')).toBeNull();
    expect(useAppStore.getState()).toMatchObject({ ekran: 'alistirma', aktifSet: SET });

    soguma();
    bas('Ana menü');
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(kap.querySelector('[role="alertdialog"]')).toBeNull();
    expect(useAppStore.getState().ekran).toBe('alistirma');

    vi.restoreAllMocks();
    soguma();
    bas('Geri');
    bas('Evet, çık');
    expect(useAppStore.getState()).toMatchObject({ ekran: 'setHazirla', aktifSet: null });
  });

  it('düğmeler yan rayda; tahtada rayın altında, tablette üstünde', () => {
    useAppStore.setState({ mod: 'tahta', ekran: 'kesifMasasi' as Ekran });
    ciz(createElement(EkranCercevesi, { profil: 'board' }, null));
    const nav = kap.querySelector<HTMLElement>('[data-gezinme]')!;
    expect(nav.style.flexDirection).toBe('column');
    expect(nav.style.justifyContent).toBe('flex-end');
    act(() => kok?.unmount());
    ciz(createElement(EkranCercevesi, { profil: 'tablet' }, null));
    expect(kap.querySelector<HTMLElement>('[data-gezinme]')!.style.justifyContent).toBe('flex-start');
  });
});

describe('tarayıcı / Android geri tuşu (useGeriTusu)', () => {
  function Kanca({ etkin }: { etkin: boolean }) {
    useGeriTusu(etkin);
    return null;
  }

  it('Geri\'si olan ekranda koruma kaydı konur; popstate ekrandaki Geri ile aynı', () => {
    const push = vi.spyOn(window.history, 'pushState');
    useAppStore.getState().modSec('tahta');
    useAppStore.getState().temaSec(1);
    ciz(createElement(Kanca, { etkin: true }));
    expect(useAppStore.getState().ekran).toBe('konuSecimi');
    expect(push).toHaveBeenCalledTimes(1);
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(useAppStore.getState().ekran).toBe('anaEkran');
    expect(push).toHaveBeenCalledTimes(1); // ana ekranda yeniden koruma yok: geri tuşu uygulamadan çıkabilir
  });

  it('onaylı ekranda popstate pencereyi açar; pencere açıkken popstate = Hayır', () => {
    useAppStore.getState().modSec('tahta');
    useAppStore.getState().setBaslat(SET);
    ciz(createElement(Kanca, { etkin: true }));
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(useCikisOnayi.getState().bekleyen).toEqual({ ekran: 'alistirma', yon: 'geri' });
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(useCikisOnayi.getState().bekleyen).toBeNull();
    expect(useAppStore.getState().ekran).toBe('alistirma');
  });

  it('gömülü modda (etkin=false) geçmişe kayıt konmaz, popstate dinlenmez', () => {
    const push = vi.spyOn(window.history, 'pushState');
    useAppStore.getState().modSec('tahta');
    useAppStore.getState().temaSec(1);
    ciz(createElement(Kanca, { etkin: false }));
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(push).not.toHaveBeenCalled();
    expect(useAppStore.getState().ekran).toBe('konuSecimi');
  });
});
