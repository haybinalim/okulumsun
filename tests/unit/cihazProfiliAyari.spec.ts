// @vitest-environment happy-dom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CIHAZ_PROFILI_ANAHTARI, izinliMi } from '../../src/persistence/depolamaIzinListesi';
import { profilSec, useDeviceProfile } from '../../src/design/useDeviceProfile';
import { CihazProfiliBaglami, useCihazProfili, type CihazProfiliDegeri } from '../../src/design/CihazProfiliBaglami';
import { EKRAN_BOYUTU_SECENEKLERI } from '../../src/design/ekranBoyutu';
import { depolamaCasusuKur } from './yardimci/depolamaCasusu';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** Kancanın son değerini dışarı taşıyan küçük bileşen. */
function kancayiCiz(): { deger: () => ReturnType<typeof useDeviceProfile>; sok: () => void } {
  let son: ReturnType<typeof useDeviceProfile> | null = null;
  function Yakala() {
    son = useDeviceProfile();
    return null;
  }
  const kap = document.createElement('div');
  const kok = createRoot(kap);
  act(() => kok.render(createElement(Yakala)));
  return { deger: () => son!, sok: () => act(() => kok.unmount()) };
}

describe('cihaz profili ayarı (plan v2 Adım 27)', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.device;
  });
  afterEach(() => localStorage.clear());

  it("sec('board') storeOverride çağırır ve dataset.device 'board' olur", () => {
    const k = kancayiCiz();
    expect(k.deger().elleSecilen).toBeNull();
    act(() => k.deger().setOverride('board'));
    expect(localStorage.getItem(CIHAZ_PROFILI_ANAHTARI)).toBe('board');
    expect(k.deger().profile).toBe('board');
    expect(k.deger().elleSecilen).toBe('board');
    expect(document.documentElement.dataset.device).toBe('board');
    expect(document.documentElement.style.getPropertyValue('--scale')).toBe('1.6');
    k.sok();
  });

  it('sec(null) anahtarı siler ve otomatik tespite döner', () => {
    localStorage.setItem(CIHAZ_PROFILI_ANAHTARI, 'phone');
    const k = kancayiCiz();
    expect(k.deger().elleSecilen).toBe('phone');
    expect(k.deger().profile).toBe('phone');
    act(() => k.deger().setOverride(null));
    expect(localStorage.getItem(CIHAZ_PROFILI_ANAHTARI)).toBeNull();
    expect(k.deger().elleSecilen).toBeNull();
    // happy-dom penceresi 1024 px, fare: otomatik tespit tablet.
    expect(k.deger().profile).toBe('tablet');
    k.sok();
  });

  it('seçim yeniden yüklemede kalıcı (yeni kanca örneği depodan okur)', () => {
    profilSec('board');
    const k = kancayiCiz();
    expect(k.deger().profile).toBe('board');
    expect(k.deger().elleSecilen).toBe('board');
    k.sok();
  });

  it('başka depolama yazımı yok; yazılan anahtar izin listesinde', () => {
    const casus = depolamaCasusuKur();
    try {
      for (const s of EKRAN_BOYUTU_SECENEKLERI) profilSec(s.deger);
      const cagrilar = casus.cagrilar();
      expect(cagrilar.length).toBeGreaterThan(0);
      for (const c of cagrilar) {
        expect(c).toEqual({ api: 'localStorage', anahtar: CIHAZ_PROFILI_ANAHTARI });
        expect(izinliMi(c.api, c.anahtar)).toBe(true);
      }
    } finally {
      casus.sok();
    }
  });

  it('dört seçenek: Otomatik + üç profil, her biri bir kez', () => {
    expect(EKRAN_BOYUTU_SECENEKLERI.map((s) => s.deger)).toEqual([null, 'board', 'tablet', 'phone']);
    expect(EKRAN_BOYUTU_SECENEKLERI[0]!.etiket).toBe('Otomatik (önerilen)');
  });

  it('useCihazProfili sağlayıcı yoksa fırlatır, varsa değeri verir', () => {
    let alinan: CihazProfiliDegeri | null = null;
    function Oku() {
      alinan = useCihazProfili();
      return null;
    }
    const kap = document.createElement('div');
    const kok = createRoot(kap);
    const deger: CihazProfiliDegeri = { profil: 'tablet', elleSecilen: null, sec: () => {} };
    act(() => kok.render(createElement(CihazProfiliBaglami.Provider, { value: deger }, createElement(Oku))));
    expect(alinan).toBe(deger);
    act(() => kok.unmount());
    expect(() => {
      function Yalniz() {
        useCihazProfili();
        return null;
      }
      const k2 = createRoot(document.createElement('div'));
      try {
        act(() => k2.render(createElement(Yalniz)));
      } finally {
        act(() => k2.unmount());
      }
    }).toThrow(/sağlayıcısı yok/);
  });
});
