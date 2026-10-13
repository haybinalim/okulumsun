/**
 * Plan v2 Adım 36 aşama 2b (KG-47): Sınıf Turu ekran akışı — store eylemleri ve takım/tur
 * yardımcıları. Saf durum makinesinin kendi testleri sinifTuru.spec.ts'te.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { REGISTRY } from '../../src/exercises/registry';
import { RENKLER } from '../../src/exercises/types';
import { setlenebilirDugumler, type GunlukSet } from '../../src/ogretmen/gunlukSet';
import type { MaddeSonuc } from '../../src/progress/itemLifecycle';
import { useAppStore } from '../../src/store/appStore';
import {
  BIRLIKTE_COZME_ESIGI,
  KAVANOZ_BOYUTLARI,
  renkAdi,
  takimKimligi,
  turSonucu,
  varsayilanRenkler,
} from '../../src/sinif/takim';
import { AUDIO_MANIFEST } from '../../src/audio/audioManifest.generated';

const dugum = [...setlenebilirDugumler((t) => REGISTRY.has(t))][0];
const kaynak: GunlukSet = { surum: 1, dugumler: [dugum], tohum: 7 };
const sonuc: MaddeSonuc = { dogru: true, kullanilanYardimKademesi: 0, latencyMs: 900, tani: null, zamanMs: 5 };

describe('takım kimliği', () => {
  it('her renk için renk + hayvan + ses (≥3 kanal); ses mevcut klip', () => {
    const hayvanlar = new Set<string>();
    for (const r of RENKLER) {
      const k = takimKimligi(r);
      expect(k.hex).toMatch(/^#[0-9A-F]{6}$/);
      expect(k.hayvan.length).toBeGreaterThan(0);
      expect(k.ses in AUDIO_MANIFEST).toBe(true);
      expect(k.etiket).not.toMatch(/\d/);
      hayvanlar.add(k.hayvan);
    }
    expect(hayvanlar.size).toBe(RENKLER.length);
  });
  it('renk adı Türkçe karakterli', () => {
    expect(renkAdi('yesil')).toBe('yeşil');
    expect(renkAdi('sari')).toBe('sarı');
  });
  it('varsayılan renkler 2–4 aralığına kırpılır', () => {
    expect(varsayilanRenkler(1)).toHaveLength(2);
    expect(varsayilanRenkler(3)).toEqual(['mor', 'turuncu', 'yesil']);
    expect(varsayilanRenkler(9)).toHaveLength(4);
  });
  it('kavanoz boyutları artan, adlarında sayı yok', () => {
    const turlar = KAVANOZ_BOYUTLARI.map((k) => k.turPerTakim);
    expect([...turlar].sort((a, b) => a - b)).toEqual(turlar);
    for (const k of KAVANOZ_BOYUTLARI) expect(k.ad).not.toMatch(/\d/);
  });
});

describe('tur sonucu', () => {
  it('ilk denemede doğru: sonuç aynen', () => {
    expect(turSonucu(sonuc, 0, false)).toEqual(sonuc);
  });
  it('yanlıştan sonra doğru: dogru=false, K1', () => {
    expect(turSonucu(sonuc, 1, false)).toMatchObject({ dogru: false, kullanilanYardimKademesi: 1 });
  });
  it('birlikte çözülen: dogru=false, K3; eşik ikinci yanlış', () => {
    expect(BIRLIKTE_COZME_ESIGI).toBe(2);
    expect(turSonucu(sonuc, 2, true)).toMatchObject({ dogru: false, kullanilanYardimKademesi: 3 });
  });
  it('sonuçta puan/skor alanı yok', () => {
    expect(Object.keys(turSonucu(sonuc, 0, false)).some((k) => /puan|skor/i.test(k))).toBe(false);
  });
});

describe('store: Sınıf Turu akışı', () => {
  beforeEach(() => useAppStore.getState().sifirla());

  it('kurulum → oyun → (2 takım × 2 tur) → sonu → ana ekranda durum null', () => {
    const s = useAppStore.getState;
    s().modSec('tahta');
    s().sinifTuruKur();
    expect(s().ekran).toBe('sinifTuruKurulum');
    s().sinifTuruBaslat(['mor', 'mavi'], kaynak, 2);
    expect(s().ekran).toBe('sinifTuru');
    for (let i = 0; i < 4; i++) {
      s().sinifTuruOlay({ tur: 'duyuruBitti' });
      s().sinifTuruOlay({ tur: 'maddeKapandi', sonuc: { ...sonuc, dogru: i % 2 === 0 }, skillId: dugum });
      s().sinifTuruOlay({ tur: 'kutlamaBitti' });
    }
    expect(s().ekran).toBe('sinifTuruSonu');
    expect(s().sinifTuru?.takimlar.map((t) => t.yildiz)).toEqual([2, 2]);
    expect(s().sinifTuru?.kavanoz).toBe(4);
    s().sinifTuruKapat();
    expect(s().ekran).toBe('anaEkran');
    expect(s().sinifTuru).toBeNull();
  });

  it('geçersiz olay (çift dokunuş) sessizce yok sayılır', () => {
    const s = useAppStore.getState;
    s().sinifTuruBaslat(['mor', 'mavi', 'yesil'], kaynak, 3);
    s().sinifTuruOlay({ tur: 'duyuruBitti' });
    const once = s().sinifTuru;
    s().sinifTuruOlay({ tur: 'duyuruBitti' });
    s().sinifTuruOlay({ tur: 'kutlamaBitti' });
    expect(s().sinifTuru).toBe(once);
  });

  it('öğretmen bitirince sonu ekranı; başka ekrana geçişte durum silinir', () => {
    const s = useAppStore.getState;
    s().sinifTuruBaslat(['mor', 'mavi'], kaynak, 3);
    s().sinifTuruOlay({ tur: 'ogretmenBitirdi' });
    expect(s().ekran).toBe('sinifTuruSonu');
    expect(s().sinifTuru).not.toBeNull();
    s().ekranGit('veliKapisi');
    expect(s().sinifTuru).toBeNull();
  });

  it('yeni tur kurulumu önceki durumu siler; durum yok iken olay etkisiz', () => {
    const s = useAppStore.getState;
    s().sinifTuruBaslat(['mor', 'mavi'], kaynak, 3);
    s().sinifTuruKur();
    expect(s().sinifTuru).toBeNull();
    s().sinifTuruOlay({ tur: 'duyuruBitti' });
    expect(s().sinifTuru).toBeNull();
    expect(s().ekran).toBe('sinifTuruKurulum');
  });
});
