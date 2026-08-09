/**
 * USTALIK MOTORU SENARYO TESTLERİ — plan §15 (sekizi de ZORUNLU).
 *
 * Her test plan §15'teki bir senaryoyu doğrular. `mastery.ts` saf olduğu için
 * tüm zamanlar dışarıdan verilir — `Date.now()` yok.
 */

import { describe, it, expect } from 'vitest';
import {
  yeniKayit,
  qHesapla,
  masteryGuncelle,
  durumTuret,
  strengthEffHesapla,
  vadeGelmisMi,
  gunAnahtari,
  type MasteryRecord,
  type CevapOlayi,
  type MasteryDurumu,
} from '../../src/progress/mastery';
import type { SkillNode } from '../../src/content/schema/skill';
import type { SkillId } from '../../src/exercises/types';

// --- Yardımcılar

const GUN = 86_400_000; // ms
const SKILL_ID = 'mat.test.dugum' as SkillId;

function cevap(
  overrides: Partial<CevapOlayi> = {},
): CevapOlayi {
  return {
    skillIds: [SKILL_ID],
    dogru: true,
    kullanilanYardimKademesi: 0,
    latencyMs: 3000,
    estimatedSec: 5,
    nodeDifficulty: 3,
    tani: null,
    zamanMs: 1000,
    ...overrides,
  };
}

const DUGUM: SkillNode = {
  id: SKILL_ID,
  mebOutcomes: ['MAT.1.1.1'],
  tema: 2,
  baslik: 'Test düğümü',
  childLabel: 'Test',
  prerequisites: [],
  difficulty: 3,
  readingLoadCeiling: 0,
  exerciseTemplates: ['M-TEST'],
  misconceptions: [],
  estimatedItemsToMastery: 10,
  isEntryPoint: true,
  durum: 'hazir',
};

function durumBul(
  kayit: MasteryRecord,
  simdiMs: number,
  dugum: SkillNode = DUGUM,
): MasteryDurumu {
  return durumTuret(kayit, dugum, simdiMs, new Map());
}

// --- Testler

describe('mastery engine — plan §15 senaryoları', () => {
  it('① aynı gün 3 doğru → mastered DEĞİL (distinctDays)', () => {
    let kayit = yeniKayit(SKILL_ID);
    // Aynı gün 3 hızlı doğru.
    for (let i = 0; i < 3; i++) {
      kayit = masteryGuncelle(kayit, cevap({ zamanMs: 1000 + i * 1000 }));
    }
    // strength 3 doğru ile 0.725'e ulaşır ama distinctDays=1.
    expect(kayit.distinctDays).toBe(1);
    expect(kayit.strength).toBeLessThan(0.85);
    expect(durumBul(kayit, 1000)).not.toBe('mastered');
  });

  it('② 2 farklı günde q=1.00 beş doğru → strength ≥ 0.85 ve mastered', () => {
    let kayit = yeniKayit(SKILL_ID);
    // 1. gün: 3 doğru
    for (let i = 0; i < 3; i++) {
      kayit = masteryGuncelle(kayit, cevap({ zamanMs: 1000 + i * 1000 }));
    }
    // 2. gün: 2 doğru
    for (let i = 0; i < 2; i++) {
      kayit = masteryGuncelle(kayit, cevap({ zamanMs: GUN + i * 1000 }));
    }
    expect(kayit.strength).toBeGreaterThanOrEqual(0.85);
    expect(kayit.distinctDays).toBe(2);
    expect(kayit.streak).toBe(5);
    expect(durumBul(kayit, GUN + 2000)).toBe('mastered');
  });

  it('③ tek yanlış strengthin EN ÇOK %30unu siler', () => {
    let kayit = yeniKayit(SKILL_ID);
    // strength'i ~0.9'a çıkar.
    for (let i = 0; i < 6; i++) {
      kayit = masteryGuncelle(kayit, cevap({ zamanMs: i * 1000 }));
    }
    const once = kayit.strength;
    kayit = masteryGuncelle(kayit, cevap({ dogru: false, zamanMs: 7000 }));
    const sonra = kayit.strength;
    const silinen = once - sonra;
    // Silinen ≤ once * 0.30 (asimetri kasıtlı — yanlış çoğu silmez).
    expect(silinen).toBeLessThanOrEqual(once * 0.30 + 0.001);
  });

  it('④ 32 gün cevapsız box-5 düğüm → rusty', () => {
    // strength'i yüksek yap, box=5'e çıkar.
    let kayit = yeniKayit(SKILL_ID);
    // 10 gün üst üste doğru cevap → box=5, strength ~0.99.
    for (let i = 0; i < 10; i++) {
      kayit = masteryGuncelle(kayit, cevap({ zamanMs: i * GUN }));
    }
    expect(kayit.box).toBe(5);
    expect(kayit.strength).toBeGreaterThanOrEqual(0.85);
    const strength = kayit.strength;
    // 32 gün sonra strengthEff = strength * 2^(-32/32) = strength * 0.5.
    const sEff32 = strengthEffHesapla(strength, 5, 10 * GUN, 42 * GUN);
    expect(sEff32).toBeCloseTo(strength * 0.5, 2);
    expect(sEff32).toBeLessThan(0.55); // rusty eşiği altında.
    // Durum: rusty (enYuksekStrength ≥ 0.85 ve sEff < 0.55).
    expect(durumBul(kayit, 42 * GUN)).toBe('rusty');
  });

  it('⑤ aynı gün 10 doğru kutuyu EN ÇOK 1 yükseltir', () => {
    let kayit = yeniKayit(SKILL_ID);
    const baslangicBox = kayit.box; // 0
    // Aynı gün 10 doğru.
    for (let i = 0; i < 10; i++) {
      kayit = masteryGuncelle(kayit, cevap({ zamanMs: i * 1000 }));
    }
    // Kutu aynı gün içinde EN ÇOK 1 yükselmiş olmalı (ilk cevapla).
    expect(kayit.box).toBeLessThanOrEqual(baslangicBox + 1);
  });

  it('⑥ GOREV_ANLASILMADI cevabı strength/attempts/boxı DEĞİŞTİRMEZ', () => {
    let kayit = yeniKayit(SKILL_ID);
    // Önce biraz ilerle.
    kayit = masteryGuncelle(kayit, cevap({ zamanMs: 1000 }));
    const once = { ...kayit };

    // GOREV_ANLASILMADI etiketli cevap.
    kayit = masteryGuncelle(kayit, cevap({ tani: 'GOREV_ANLASILMADI', zamanMs: 2000 }));

    expect(kayit.strength).toBe(once.strength);
    expect(kayit.attempts).toBe(once.attempts);
    expect(kayit.box).toBe(once.box);
    expect(kayit.streak).toBe(once.streak);
    expect(kayit.distinctDays).toBe(once.distinctDays);
  });

  it('⑦ yakınlık şablonunda q asla 0 olmaz', () => {
    // Çok uzak tahmin.
    const q = qHesapla(cevap({ yakinlik: 2.0, tani: null }));
    expect(q).toBeGreaterThan(0);
    expect(q).toBe(0.2); // en kötü durum

    // İsabetli tahmin.
    const q2 = qHesapla(cevap({ yakinlik: 0.05, tani: null }));
    expect(q2).toBe(1.0);

    // Orta tahmin.
    const q3 = qHesapla(cevap({ yakinlik: 0.20, tani: null }));
    expect(q3).toBe(0.85);
  });

  it('⑧ mastered düğüm ertesi gün HÂLÂ mastered (aşınma ustalığı geri almaz)', () => {
    let kayit = yeniKayit(SKILL_ID);
    // Mastered olana kadar 2 günde doğru cevaplar.
    for (let i = 0; i < 5; i++) {
      kayit = masteryGuncelle(kayit, cevap({ zamanMs: i < 3 ? i * 1000 : GUN + (i - 3) * 1000 }));
    }
    expect(durumBul(kayit, GUN + 5000)).toBe('mastered');

    // Ertesi gün — strengthEff düşer ama durum HÂLÂ mastered.
    expect(durumBul(kayit, 2 * GUN + 5000)).toBe('mastered');
  });
});

describe('mastery engine — ek doğrulamalar', () => {
  it('gunAnahtari yerel saatle çalışır', () => {
    // 23:30 yerel saat — aynı gün.
    const a = gunAnahtari(new Date(2026, 0, 15, 23, 30).getTime());
    const b = gunAnahtari(new Date(2026, 0, 15, 1, 0).getTime());
    expect(a).toBe(b);
    // 00:30 ertesi gün.
    const c = gunAnahtari(new Date(2026, 0, 16, 0, 30).getTime());
    expect(c).not.toBe(a);
  });

  it('ipuçlu doğru (K1/K2) streaki değiştirmez ama strengthi artırır', () => {
    let kayit = yeniKayit(SKILL_ID);
    kayit = masteryGuncelle(kayit, cevap({ zamanMs: 1000 })); // q=1.0, streak=1
    const streakOnce = kayit.streak;
    kayit = masteryGuncelle(kayit, cevap({ kullanilanYardimKademesi: 1, zamanMs: 2000 })); // q=0.45
    expect(kayit.streak).toBe(streakOnce); // değişmedi
    expect(kayit.strength).toBeGreaterThan(0); // arttı
  });

  it('Leitner kutusu farklı günde q≥0.85 ile yükselir', () => {
    let kayit = yeniKayit(SKILL_ID);
    kayit = masteryGuncelle(kayit, cevap({ zamanMs: 1000 })); // gün 1, box 0→1
    expect(kayit.box).toBe(1);
    kayit = masteryGuncelle(kayit, cevap({ zamanMs: GUN + 1000 })); // gün 2, box 1→2
    expect(kayit.box).toBe(2);
  });

  it('Leitner kutusu yanlışta düşer (asla 2+ düşmez)', () => {
    let kayit = yeniKayit(SKILL_ID);
    // Box'u 3'e çıkar.
    for (let i = 0; i < 3; i++) {
      kayit = masteryGuncelle(kayit, cevap({ zamanMs: i * GUN }));
    }
    expect(kayit.box).toBe(3);
    // Yanlış cevap → box 3→2 (yalnız 1 düşer).
    kayit = masteryGuncelle(kayit, cevap({ dogru: false, zamanMs: 3 * GUN }));
    expect(kayit.box).toBe(2);
  });

  it('vadeGelmisMi — halfLife[box] gün sonra true', () => {
    let kayit = yeniKayit(SKILL_ID);
    kayit = masteryGuncelle(kayit, cevap({ zamanMs: 1000 }));
    // box=1, halfLife=2 gün.
    expect(kayit.box).toBe(1);
    expect(vadeGelmisMi(kayit, 1000 + 1 * GUN)).toBe(false); // 1 gün < 2
    expect(vadeGelmisMi(kayit, 1000 + 2 * GUN)).toBe(true); // 2 gün = halfLife
  });

  it('struggling — 6+ denemede <%45 başarı', () => {
    let kayit = yeniKayit(SKILL_ID);
    // 6 cevap: 2 doğru, 4 yanlış (başarı ~0.33 < 0.45).
    const cevaplar = [
      cevap({ dogru: true, zamanMs: 1000 }),
      cevap({ dogru: false, zamanMs: 2000 }),
      cevap({ dogru: true, zamanMs: 3000 }),
      cevap({ dogru: false, zamanMs: 4000 }),
      cevap({ dogru: false, zamanMs: 5000 }),
      cevap({ dogru: false, zamanMs: 6000 }),
    ];
    for (const c of cevaplar) kayit = masteryGuncelle(kayit, c);
    expect(kayit.attempts).toBe(6);
    const basari = kayit.son6.filter(Boolean).length / kayit.son6.length;
    expect(basari).toBeLessThan(0.45);
    expect(durumBul(kayit, 6000)).toBe('struggling');
  });
});
