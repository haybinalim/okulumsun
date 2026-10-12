// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import {
  CIHAZ_PROFILI_ANAHTARI,
  IZINLI_ANAHTARLAR,
  IZINLI_LOCALSTORAGE_ANAHTARLARI,
  izinliMi,
} from '../../src/persistence/depolamaIzinListesi';
import { depolamaCasusuKur } from './yardimci/depolamaCasusu';

describe('depolama izin listesi (Adım 26)', () => {
  it('izinliMi yalnız listedeki alan+anahtarı kabul eder', () => {
    expect(izinliMi('localStorage', CIHAZ_PROFILI_ANAHTARI)).toBe(true);
    expect(izinliMi('sessionStorage', CIHAZ_PROFILI_ANAHTARI)).toBe(false);
    expect(izinliMi('localStorage', 'okulumsun.ogrenciAdi')).toBe(false);
  });

  it('her izinli anahtarın gerekçesi ve ADR numarası var; K9 listesi aynı', () => {
    for (const a of IZINLI_ANAHTARLAR) {
      expect(a.gerekce.length).toBeGreaterThan(5);
      expect(a.adr).toMatch(/^\d{4}$/);
    }
    expect(IZINLI_LOCALSTORAGE_ANAHTARLARI).toEqual(IZINLI_ANAHTARLAR.map((a) => a.anahtar));
  });
});

describe('depolama casusu', () => {
  it('localStorage, sessionStorage ve cookie yazımlarını kaydeder, sökülünce bırakır', () => {
    const ozgun = Storage.prototype.setItem;
    const casus = depolamaCasusuKur();
    try {
      localStorage.setItem('a', '1');
      sessionStorage.setItem('b', '2');
      document.cookie = 'c=3';
      expect(casus.cagrilar()).toEqual([
        { api: 'localStorage', anahtar: 'a' },
        { api: 'sessionStorage', anahtar: 'b' },
        { api: 'cookie', anahtar: 'c' },
      ]);
    } finally {
      casus.sok();
      localStorage.clear();
      sessionStorage.clear();
    }
    expect(Storage.prototype.setItem).toBe(ozgun);
  });

  it('indexedDB.open ve caches.open çağrılarını kaydeder', async () => {
    const casus = depolamaCasusuKur();
    try {
      try {
        indexedDB?.open('deneme-db');
      } catch {
        // jsdom'da indexedDB yoksa casusun sahte uygulaması devrededir.
      }
      await globalThis.caches?.open('deneme-onbellek').catch(() => undefined);
      const apiler = casus.cagrilar().map((c) => c.api);
      expect(apiler).toContain('indexedDB');
      expect(apiler).toContain('cacheStorage');
    } finally {
      casus.sok();
    }
  });
});
