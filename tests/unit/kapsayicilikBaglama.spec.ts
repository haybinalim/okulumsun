// @vitest-environment happy-dom
import { act, createElement, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyProfile } from '../../src/design/deviceProfile';
import { VARSAYILAN_KAPSAYICILIK, type KapsayicilikAyarlari } from '../../src/design/kapsayicilik';
import { COLOR, COLOR_RENK_KORLUGU } from '../../src/design/tokens';
import { ayarAdresi, ayarKodunuAcilistaOku, ayarKodunuAdreseYaz } from '../../src/platform/ayarKoduAdres';
import type { AdresCubugu } from '../../src/platform/eveLinkAcilis';
import { speech } from '../../src/audio/speech';
import { useTalimatTekrari } from '../../src/ui/useTalimatTekrari';
import { useAppStore } from '../../src/store/appStore';
import { depolamaCasusuKur } from './yardimci/depolamaCasusu';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** Plan v2 Adım 55 aşama 2: ayarların CSS/kök öznitelikleri, adres çubuğu ve talimat tekrarı. */

function adres(hash: string): AdresCubugu & { yazilan: string[] } {
  const yazilan: string[] = [];
  return { hash, pathname: '/okulumsun/', search: '?device=board', replaceState: (u) => yazilan.push(u), yazilan };
}

const SB: KapsayicilikAyarlari = { ...VARSAYILAN_KAPSAYICILIK, solEl: true, buyukHedef: true };

describe('applyProfile + kapsayıcılık', () => {
  const kok = () => document.documentElement;
  beforeEach(() => {
    kok().removeAttribute('style');
    for (const k of Object.keys(kok().dataset)) delete kok().dataset[k];
  });

  it('varsayılan: profil değerleri aynen, öznitelik yok', () => {
    applyProfile('board', kok());
    expect(kok().style.getPropertyValue('--size-tap-min')).toBe('102px');
    expect(kok().style.getPropertyValue('--size-choice')).toBe('320px');
    expect(kok().style.getPropertyValue('--color-correct')).toBe(COLOR.correct);
    expect(kok().dataset.solEl).toBeUndefined();
    expect(kok().dataset.hareketAzalt).toBeUndefined();
  });

  it('büyük hedef + sol el + palet + hareket azalt: değişkenler ve öznitelikler; kapatınca geri döner', () => {
    applyProfile('board', kok(), { ...SB, palet: 'renkKorluguDostu', hareketAzalt: true });
    expect(kok().style.getPropertyValue('--size-tap-min')).toBe('118px');
    expect(kok().style.getPropertyValue('--size-control')).toBe(`${Math.round(88 * 1.6 * 1.15)}px`);
    expect(kok().style.getPropertyValue('--size-choice')).toBe('320px');
    expect(kok().style.getPropertyValue('--scale')).toBe('1.6');
    expect(kok().style.getPropertyValue('--color-correct')).toBe(COLOR_RENK_KORLUGU.correct);
    expect(kok().dataset).toMatchObject({ solEl: '1', hareketAzalt: '1', palet: 'renk-korlugu', buyukHedef: '1' });

    applyProfile('board', kok(), VARSAYILAN_KAPSAYICILIK);
    expect(kok().style.getPropertyValue('--size-tap-min')).toBe('102px');
    expect(kok().style.getPropertyValue('--color-correct')).toBe(COLOR.correct);
    expect(kok().dataset.solEl).toBeUndefined();
    expect(kok().dataset.palet).toBeUndefined();
  });
});

describe('ayar kodu ↔ adres çubuğu', () => {
  it('açılış: geçerli kod belleğe, hash adreste kalır; geçersiz girişim silinir; başka hash yok sayılır', () => {
    const iyi = adres('#ayar=1.sb');
    expect(ayarKodunuAcilistaOku(iyi)).toEqual(SB);
    expect(iyi.yazilan).toEqual([]);

    const kotu = adres('#ayar=1.zz');
    expect(ayarKodunuAcilistaOku(kotu)).toBeNull();
    expect(kotu.yazilan).toEqual(['/okulumsun/?device=board']);

    const ev = adres('#ev=1.1.a1b7.k3f9q');
    expect(ayarKodunuAcilistaOku(ev)).toBeNull();
    expect(ev.yazilan).toEqual([]);
  });

  it('yazma: değişince replaceState, hepsi kapalıysa hash silinir, aynıysa yazılmaz, başka hash korunur', () => {
    expect(ayarAdresi(adres(''), SB)).toBe('/okulumsun/?device=board#ayar=1.sb');
    expect(ayarAdresi(adres('#ayar=1.sb'), SB)).toBeNull();
    expect(ayarAdresi(adres('#ayar=1.sb'), VARSAYILAN_KAPSAYICILIK)).toBe('/okulumsun/?device=board');
    expect(ayarAdresi(adres(''), VARSAYILAN_KAPSAYICILIK)).toBeNull();
    expect(ayarAdresi(adres('#'), VARSAYILAN_KAPSAYICILIK)).toBeNull();
    expect(ayarAdresi(adres('#ev=1.1.a1b7.k3f9q'), SB)).toBeNull();
    const a = adres('#ayar=1.s');
    ayarKodunuAdreseYaz(a, SB);
    expect(a.yazilan).toEqual(['/okulumsun/?device=board#ayar=1.sb']);
  });

  it('depolamaya hiçbir şey yazılmaz', () => {
    const casus = depolamaCasusuKur();
    try {
      ayarKodunuAdreseYaz(adres(''), SB);
      ayarKodunuAcilistaOku(adres('#ayar=1.trpsbh'));
      useAppStore.getState().kapsayicilikAyarla(SB);
      expect(casus.cagrilar()).toEqual([]);
    } finally {
      casus.sok();
      useAppStore.getState().sifirla();
    }
  });
});

describe('talimat tekrarı (8 sn, hareketsizlik dönemi başına bir kez)', () => {
  let tekrar: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    vi.useFakeTimers();
    tekrar = vi.spyOn(speech, 'talimatiTekrarla').mockReturnValue(true);
  });
  afterEach(() => {
    vi.useRealTimers();
    tekrar.mockRestore();
    useAppStore.getState().sifirla();
  });

  function ciz(): { el: () => HTMLElement; sok: () => void } {
    let el: HTMLElement | null = null;
    function Kabuk() {
      const ref = useRef<HTMLElement>(null);
      useTalimatTekrari(ref);
      return createElement('main', {
        ref: (n: HTMLElement | null) => {
          ref.current = n;
          el = n;
        },
      });
    }
    const kap = document.createElement('div');
    document.body.appendChild(kap);
    const kok = createRoot(kap);
    act(() => kok.render(createElement(Kabuk)));
    return { el: () => el!, sok: () => act(() => kok.unmount()) };
  }

  it('kapalıyken hiç tekrar yok', () => {
    const k = ciz();
    act(() => vi.advanceTimersByTime(60_000));
    expect(tekrar).not.toHaveBeenCalled();
    k.sok();
  });

  it("açıkken 8 sn sonra bir kez; dokunuş sayacı sıfırlar ve yeni hak açar; 15 sn'de ikinci kez söylemez", () => {
    useAppStore.getState().kapsayicilikAyarla({ talimatTekrari: true });
    const k = ciz();
    act(() => vi.advanceTimersByTime(7_999));
    expect(tekrar).toHaveBeenCalledTimes(0);
    act(() => vi.advanceTimersByTime(1));
    expect(tekrar).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(30_000));
    expect(tekrar).toHaveBeenCalledTimes(1);

    act(() => k.el().dispatchEvent(new Event('pointerdown', { bubbles: true })));
    act(() => vi.advanceTimersByTime(5_000));
    act(() => k.el().dispatchEvent(new Event('pointerdown', { bubbles: true })));
    act(() => vi.advanceTimersByTime(7_000));
    expect(tekrar).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(1_000));
    expect(tekrar).toHaveBeenCalledTimes(2);
    k.sok();
    act(() => vi.advanceTimersByTime(60_000));
    expect(tekrar).toHaveBeenCalledTimes(2);
  });
});

describe('speech temel hızı', () => {
  it('geçersiz değer 1 sayılır; ayarlanan değer okunur', () => {
    speech.temelHizAyarla(0.85);
    expect(speech.temelHiz).toBe(0.85);
    speech.temelHizAyarla(Number.NaN);
    expect(speech.temelHiz).toBe(1);
    speech.temelHizAyarla(-2);
    expect(speech.temelHiz).toBe(1);
  });

  it('kilitliyken talimat tekrarı çalmaz', () => {
    expect(speech.talimatiTekrarla()).toBe(false);
  });
});
