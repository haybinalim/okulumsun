/**
 * OKUL AYI → TEMA AÇMA TESTLERİ — plan §6.5, §14 Adım 8.
 *
 * Bitti tanımı: "§11 akışının tamamı gezilebilir"
 *
 * Testler:
 *  · Eylül'de yalnız tema 1 açık
 *  · Ekim'de tema 1-2 açık
 *  · Mayıs/Haziran'da tüm temalar açık
 *  · temaAcikMi fonksiyonu doğru
 *  · Sınır kontrolü (geçersiz indeks)
 */

import { describe, it, expect } from 'vitest';
import {
  acilanTemalar,
  temaAcikMi,
  OKUL_AYLARI,
} from '../../src/content/okulAyi';

describe('Okul ayı → tema açma', () => {
  it('Eylül (0) → yalnız tema 1 açık', () => {
    expect(acilanTemalar(0)).toEqual([1]);
  });

  it('Ekim (1) → tema 1-2 açık', () => {
    expect(acilanTemalar(1)).toEqual([1, 2]);
  });

  it('Kasım (2) → tema 1-2 açık (Ekim ile aynı)', () => {
    expect(acilanTemalar(2)).toEqual([1, 2]);
  });

  it('Aralık (3) → tema 1-3 açık', () => {
    expect(acilanTemalar(3)).toEqual([1, 2, 3]);
  });

  it('Ocak (4) → tema 1-4 açık', () => {
    expect(acilanTemalar(4)).toEqual([1, 2, 3, 4]);
  });

  it('Şubat (5) → tema 1-4 açık (Ocak ile aynı)', () => {
    expect(acilanTemalar(5)).toEqual([1, 2, 3, 4]);
  });

  it('Mart (6) → tema 1-5 açık', () => {
    expect(acilanTemalar(6)).toEqual([1, 2, 3, 4, 5]);
  });

  it('Nisan (7) → tema 1-6 açık', () => {
    expect(acilanTemalar(7)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('Mayıs (8) → tüm 7 tema açık', () => {
    expect(acilanTemalar(8)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('Haziran (9) → tüm 7 tema açık (Mayıs ile aynı)', () => {
    expect(acilanTemalar(9)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  // ----------------------------------------------------- temaAcikMi

  it('temaAcikMi: Eylül\'de tema 1 açık, tema 2 kilitli', () => {
    expect(temaAcikMi(0, 1)).toBe(true);
    expect(temaAcikMi(0, 2)).toBe(false);
  });

  it('temaAcikMi: Mayıs\'ta tüm temalar açık', () => {
    for (let t = 1; t <= 7; t++) {
      expect(temaAcikMi(8, t)).toBe(true);
    }
  });

  // ----------------------------------------------------- sınır kontrolü

  it('negatif indeks → Eylül (0) davranışı', () => {
    expect(acilanTemalar(-5)).toEqual([1]);
  });

  it('çok büyük indeks → Haziran (9) davranışı', () => {
    expect(acilanTemalar(100)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  // ----------------------------------------------------- 10 ay

  it('OKUL_AYLARI 10 ay içeriyo', () => {
    expect(OKUL_AYLARI).toHaveLength(10);
    expect(OKUL_AYLARI[0]).toBe('Eylül');
    expect(OKUL_AYLARI[9]).toBe('Haziran');
  });
});
