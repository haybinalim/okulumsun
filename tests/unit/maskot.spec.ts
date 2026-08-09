/**
 * MASKOT DURUM MAKİNESİ TESTLERİ — plan §7.5, §14 Adım 7.
 *
 * Bitti tanımı: "Maskot 6 duruma geçer"
 *
 * Testler:
 *  · 6 durumun tamamı reachable
 *  · Geçişler §7.5 tablosuna uygun
 *  · sevinmis → sakin (≤2 sn)
 *  · uykulu → sakin (dokunma)
 *  · ASLA üzülmez/ağlamaz
 *  · Ara durum yok
 *  · prefers-reduced-motion'da poz değişir ama animasyon yok (bu UI testi,
 *    burada makine test edilir)
 */

import { describe, it, expect } from 'vitest';
import {
  maskotGuncelle,
  gecerliMaskotDurumu,
  type MaskotDurumu,
  type MaskotOlayi,
  SEVINMIS_SURE_MS,
} from '../../src/ui/feedback/maskotState';

describe('Maskot durum makinesi', () => {
  // ----------------------------------------------------- 6 durum reachable

  it('6 durumun tamamı reachable', () => {
    const durumlar: MaskotDurumu[] = [];
    let d: MaskotDurumu = 'sakin';

    d = maskotGuncelle(d, { tur: 'talimatBasladi' });
    durumlar.push(d); // konusuyor

    d = maskotGuncelle(d, { tur: 'talimatBitti' });
    d = maskotGuncelle(d, { tur: 'secimBasladi' });
    durumlar.push(d); // dinliyor

    d = maskotGuncelle(d, { tur: 'dogruCevap' });
    durumlar.push(d); // sevinmis

    d = maskotGuncelle(d, { tur: 'yanlisCevap' });
    durumlar.push(d); // cesaretlendiriyor

    d = maskotGuncelle(d, { tur: 'hareketsizlik60sn' });
    durumlar.push(d); // uykulu

    d = maskotGuncelle(d, { tur: 'sifirla' });
    durumlar.push(d); // sakin (zaten başlangıç)

    expect(durumlar).toContain('sakin');
    expect(durumlar).toContain('konusuyor');
    expect(durumlar).toContain('dinliyor');
    expect(durumlar).toContain('sevinmis');
    expect(durumlar).toContain('cesaretlendiriyor');
    expect(durumlar).toContain('uykulu');
  });

  // ----------------------------------------------------- geçişler

  it('sakin + talimatBasladi → konusuyor', () => {
    expect(maskotGuncelle('sakin', { tur: 'talimatBasladi' })).toBe('konusuyor');
  });

  it('konusuyor + talimatBitti → sakin', () => {
    expect(maskotGuncelle('konusuyor', { tur: 'talimatBitti' })).toBe('sakin');
  });

  it('sakin + secimBasladi → dinliyor', () => {
    expect(maskotGuncelle('sakin', { tur: 'secimBasladi' })).toBe('dinliyor');
  });

  it('dinliyor + dogruCevap → sevinmis', () => {
    expect(maskotGuncelle('dinliyor', { tur: 'dogruCevap' })).toBe('sevinmis');
  });

  it('dinliyor + yanlisCevap → cesaretlendiriyor', () => {
    expect(maskotGuncelle('dinliyor', { tur: 'yanlisCevap' })).toBe('cesaretlendiriyor');
  });

  it('sakin + yardimIstendi → cesaretlendiriyor', () => {
    expect(maskotGuncelle('sakin', { tur: 'yardimIstendi' })).toBe('cesaretlendiriyor');
  });

  it('sakin + hareketsizlik60sn → uykulu', () => {
    expect(maskotGuncelle('sakin', { tur: 'hareketsizlik60sn' })).toBe('uykulu');
  });

  // ----------------------------------------------------- uykulu → sakin

  it('uykulu + dokunma → sakin', () => {
    expect(maskotGuncelle('uykulu', { tur: 'dokunma' })).toBe('sakin');
  });

  it('uykulu + talimatBasladi → konusuyor (uykulu\'dan çıkış)', () => {
    expect(maskotGuncelle('uykulu', { tur: 'talimatBasladi' })).toBe('konusuyor');
  });

  // ----------------------------------------------------- ASLA üzülmez

  it('ASLA üzülmez — yanlisCevap cesaretlendiriyor verir, üzgün değil', () => {
    const sonuc = maskotGuncelle('sakin', { tur: 'yanlisCevap' });
    expect(sonuc).toBe('cesaretlendiriyor');
    expect(sonuc).not.toBe('uzgun');
    // 6 durumdan biri olmalı, 'uzgun' yok
    const tumDurumlar: MaskotDurumu[] = [
      'sakin', 'konusuyor', 'dinliyor', 'sevinmis', 'cesaretlendiriyor', 'uykulu',
    ];
    expect(tumDurumlar).not.toContain('uzgun' as unknown as MaskotDurumu);
  });

  // ----------------------------------------------------- ara durum yok

  it('her olay bilinen 6 durumdan birine geçer — ara durum yok', () => {
    const tumDurumlar: MaskotDurumu[] = [
      'sakin', 'konusuyor', 'dinliyor', 'sevinmis', 'cesaretlendiriyor', 'uykulu',
    ];
    const tumOlaylar: MaskotOlayi[] = [
      { tur: 'talimatBasladi' },
      { tur: 'talimatBitti' },
      { tur: 'secimBasladi' },
      { tur: 'dogruCevap' },
      { tur: 'yanlisCevap' },
      { tur: 'yardimIstendi' },
      { tur: 'hareketsizlik60sn' },
      { tur: 'dokunma' },
      { tur: 'sifirla' },
    ];

    for (const baslangic of tumDurumlar) {
      for (const olay of tumOlaylar) {
        const sonuc = maskotGuncelle(baslangic, olay);
        expect(tumDurumlar).toContain(sonuc);
      }
    }
  });

  // ----------------------------------------------------- sifirla

  it('sifirla her durumdan sakin\'e döner', () => {
    const tumDurumlar: MaskotDurumu[] = [
      'sakin', 'konusuyor', 'dinliyor', 'sevinmis', 'cesaretlendiriyor', 'uykulu',
    ];
    for (const d of tumDurumlar) {
      expect(maskotGuncelle(d, { tur: 'sifirla' })).toBe('sakin');
    }
  });

  // ----------------------------------------------------- dokunma diğer durumlar

  it('dokunma uykulu dışındaki durumları değiştirmez', () => {
    const digerDurumlar: MaskotDurumu[] = [
      'sakin', 'konusuyor', 'dinliyor', 'sevinmis', 'cesaretlendiriyor',
    ];
    for (const d of digerDurumlar) {
      expect(maskotGuncelle(d, { tur: 'dokunma' })).toBe(d);
    }
  });

  // ----------------------------------------------------- sevinmis süre sabiti

  it('sevinmis süresi ≤2000 ms (plan §7.5: ≤2 sn)', () => {
    expect(SEVINMIS_SURE_MS).toBeLessThanOrEqual(2000);
  });

  it('sevinmis süresi pozitif', () => {
    expect(SEVINMIS_SURE_MS).toBeGreaterThan(0);
  });

  // ----------------------------------------------------- geçerlilik

  it('gecerliMaskotDurumu 6 durumu doğrular', () => {
    expect(gecerliMaskotDurumu('sakin')).toBe(true);
    expect(gecerliMaskotDurumu('konusuyor')).toBe(true);
    expect(gecerliMaskotDurumu('dinliyor')).toBe(true);
    expect(gecerliMaskotDurumu('sevinmis')).toBe(true);
    expect(gecerliMaskotDurumu('cesaretlendiriyor')).toBe(true);
    expect(gecerliMaskotDurumu('uykulu')).toBe(true);
    expect(gecerliMaskotDurumu('uzgun')).toBe(false);
    expect(gecerliMaskotDurumu('')).toBe(false);
  });
});
