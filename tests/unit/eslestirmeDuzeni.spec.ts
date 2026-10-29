import { describe, expect, it } from 'vitest';
import { eslestirmeDuzeni, sikisikKartBoyu } from '../../src/ui/secenekKartBoyu';

/**
 * KG-128: MATCH_PAIRS düzeni ve SEQUENCE_ORDER kart boyu — ölçüler e2e'de ölçülen GameShell etkileşim bölümleri:
 * 1920×1080 tahta 1844 × 585, 1080×810 tahta 1004 × 409, 1080×810 tablet 1032 × 453.
 */
const tahta = { secim: 320, altCubuk: 141, aralik: 51, tapMin: 102 };
const tablet = { secim: 200, altCubuk: 88, aralik: 32, tapMin: 64 };

describe('eslestirmeDuzeni (MATCH_PAIRS)', () => {
  it('1920×1080 tahta, 3 + 5 (M-GEO-EŞLE): iki sütun sığmaz → satır, kart 196 px', () => {
    expect(eslestirmeDuzeni({ ...tahta, alanGenislik: 1844, alanYukseklik: 585, sol: 3, sag: 5 })).toEqual({ yon: 'satir', kart: 196, genislik: 196 });
  });
  it('1920×1080 tahta, 3 + 3 (M-TERS-İŞLEM): satır 196 px (sütunda yalnız 114 px)', () => {
    expect(eslestirmeDuzeni({ ...tahta, alanGenislik: 1844, alanYukseklik: 585, sol: 3, sag: 3 })).toEqual({ yon: 'satir', kart: 196, genislik: 196 });
  });
  it('1080×810 tahta, 3 + 5: satır, kart ≥ tap-min (108 px)', () => {
    const d = eslestirmeDuzeni({ ...tahta, alanGenislik: 1004, alanYukseklik: 409, sol: 3, sag: 5 });
    expect(d).toEqual({ yon: 'satir', kart: 108, genislik: 108 });
    // iki satır + aralık, alt çubuk dışında kalan alana en çok bir aralık taşmayla sığar
    expect(2 * d!.kart + tahta.aralik).toBeLessThanOrEqual(409 - 141 + tahta.aralik);
    // en geniş satır ekrana sığar
    expect(5 * d!.kart + 4 * tahta.aralik).toBeLessThanOrEqual(1004);
  });
  it('1080×810 tablet, 3 + 5 ve 3 + 3: satır (tablet de taşıyordu)', () => {
    expect(eslestirmeDuzeni({ ...tablet, alanGenislik: 1032, alanYukseklik: 453, sol: 3, sag: 5 })).toEqual({ yon: 'satir', kart: 166, genislik: 166 });
    expect(eslestirmeDuzeni({ ...tablet, alanGenislik: 1032, alanYukseklik: 453, sol: 3, sag: 3 })).toEqual({ yon: 'satir', kart: 166, genislik: 166 });
  });
  it('varsayılan iki sütun sığıyorsa dokunmaz (null)', () => {
    expect(eslestirmeDuzeni({ ...tablet, alanGenislik: 1032, alanYukseklik: 800, sol: 2, sag: 2 })).toBeNull();
  });
  it('dar ve uzun alanda sütun seçilir; kart --size-choice’u geçmez', () => {
    expect(eslestirmeDuzeni({ ...tahta, alanGenislik: 600, alanYukseklik: 1400, sol: 3, sag: 4 })).toEqual({ yon: 'sutun', kart: 274, genislik: 274 });
    expect(eslestirmeDuzeni({ ...tahta, alanGenislik: 4000, alanYukseklik: 1000, sol: 3, sag: 5 })!.kart).toBe(320);
  });
  it('işlem kartı (en/boy 2,8): yükseklik aynı, kart sığdığı kadar geniş — rakam kutusu (%19 × %70) ≥ 38 px', () => {
    const t1080 = eslestirmeDuzeni({ ...tahta, alanGenislik: 1004, alanYukseklik: 409, sol: 3, sag: 3, enBoy: 2.8 })!;
    expect(t1080).toEqual({ yon: 'satir', kart: 108, genislik: 300 });
    expect(t1080.genislik * 0.7 * 0.19).toBeGreaterThanOrEqual(38);
    expect(3 * t1080.genislik + 2 * tahta.aralik).toBeLessThanOrEqual(1004);
    expect(eslestirmeDuzeni({ ...tahta, alanGenislik: 1844, alanYukseklik: 585, sol: 3, sag: 3, enBoy: 2.8 })).toEqual({ yon: 'satir', kart: 196, genislik: 550 });
    expect(eslestirmeDuzeni({ ...tablet, alanGenislik: 1032, alanYukseklik: 453, sol: 3, sag: 3, enBoy: 2.8 })).toEqual({ yon: 'satir', kart: 166, genislik: 322 });
  });
  it('asla tap-min altı değil; geçersiz ölçüde varsayılan', () => {
    expect(eslestirmeDuzeni({ ...tahta, alanGenislik: 300, alanYukseklik: 250, sol: 3, sag: 5 })!.kart).toBe(102);
    expect(eslestirmeDuzeni({ ...tahta, alanGenislik: 0, alanYukseklik: 409, sol: 3, sag: 5 })).toBeNull();
    expect(eslestirmeDuzeni({ ...tahta, alanGenislik: 1004, alanYukseklik: 409, sol: 0, sag: 0 })).toBeNull();
  });
});

describe('SEQUENCE_ORDER kart boyu (sikisikKartBoyu, KG-128)', () => {
  const s = { secim: 320, birincil: 224, aralik: 51, tapMin: 102 };
  it('1920×1080 tahta, 5 kart: varsayılan sığar (değişmez)', () => {
    expect(sikisikKartBoyu({ ...s, alanGenislik: 1844, alanYukseklik: 585, adet: 5 })).toBeNull();
  });
  it('1080×810 tahta, 5 kart: tek satır 160 px; 4 kart 185 px', () => {
    expect(sikisikKartBoyu({ ...s, alanGenislik: 1004, alanYukseklik: 409, adet: 5 })).toBe(160);
    expect(sikisikKartBoyu({ ...s, alanGenislik: 1004, alanYukseklik: 409, adet: 4 })).toBe(185);
  });
  it('1080×810 tablet, 5 kart: tek satır 180 px (Onayla ekran dışına çıkıyordu); 4 kart değişmez', () => {
    expect(sikisikKartBoyu({ secim: 200, birincil: 140, aralik: 32, tapMin: 64, alanGenislik: 1032, alanYukseklik: 453, adet: 5 })).toBe(180);
    expect(sikisikKartBoyu({ secim: 200, birincil: 140, aralik: 32, tapMin: 64, alanGenislik: 1032, alanYukseklik: 453, adet: 4 })).toBeNull();
  });
});
