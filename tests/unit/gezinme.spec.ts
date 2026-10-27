/**
 * KG-103: Geri / Ana menü kuralları (saf) ve `appStore.gezin` eylemi.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { EKRANLAR, gezinmeDurumu, useAppStore, type Ekran, type Mod } from '../../src/store/appStore';
import {
  GERI_KURALLARI,
  GEZINMESIZ_EKRANLAR,
  anaMenuHedefi,
  cikisOnayiGerekir,
  geriHedefi,
  type GezinmeDurumu,
} from '../../src/ui/gezinme/gezinme';
import type { GunlukSet } from '../../src/ogretmen/gunlukSet';

const durum = (ekran: Ekran, ek: Partial<GezinmeDurumu> = {}): GezinmeDurumu => ({
  ekran,
  mod: 'tahta',
  aktifSetVar: false,
  evdeOnDakika: false,
  girisler: {},
  ...ek,
});

const MODLAR: readonly (Mod | null)[] = ['tahta', 'kisisel', null];
const IKILI = [false, true] as const;
function* tumDurumlar(ekran: Ekran): Generator<GezinmeDurumu> {
  for (const mod of MODLAR) for (const aktifSetVar of IKILI) for (const evdeOnDakika of IKILI) yield durum(ekran, { mod, aktifSetVar, evdeOnDakika });
}

const SET: GunlukSet = { surum: 1, dugumler: ['mat.uzam.konum-ifadeleri'], tohum: 5 };

describe('gezinme kuralları (KG-103)', () => {
  it('her ekranın bir kuralı var; gezinmesiz yalnız ses kilidi, mod seçimi, ana ekran', () => {
    expect(Object.keys(GERI_KURALLARI).sort()).toEqual([...EKRANLAR].sort());
    expect([...GEZINMESIZ_EKRANLAR].sort()).toEqual(['anaEkran', 'audioUnlock', 'modSecimi']);
  });

  it('gezinmesiz olmayan her ekranda, her durumda Geri ve Ana menü hedefi var', () => {
    for (const e of EKRANLAR) {
      for (const d of tumDurumlar(e)) {
        if (GEZINMESIZ_EKRANLAR.has(e)) {
          expect(geriHedefi(d), e).toBeNull();
          expect(anaMenuHedefi(d), e).toBeNull();
        } else {
          expect(geriHedefi(d), `${e} ${JSON.stringify(d)}`).not.toBeNull();
          expect(geriHedefi(d)).not.toBe(e);
          expect(anaMenuHedefi(d)).toBe(d.mod === null ? 'modSecimi' : 'anaEkran');
        }
      }
    }
  });

  it('Geri döngüsüz: arka arkaya Geri her ekrandan en çok 5 adımda gezinmesiz ekrana varır', () => {
    for (const e of EKRANLAR) {
      for (const d0 of tumDurumlar(e)) {
        let d = d0;
        let adim = 0;
        for (let h = geriHedefi(d); h !== null; h = geriHedefi(d)) {
          d = { ...d, ekran: h };
          adim += 1;
          expect(adim, `${e} zinciri`).toBeLessThanOrEqual(5);
        }
        expect(GEZINMESIZ_EKRANLAR.has(d.ekran)).toBe(true);
      }
    }
  });

  it('birden çok yerden açılan ekran: izinli giriş "bir önceki ekran", izinsiz giriş varsayılana düşer', () => {
    expect(geriHedefi(durum('calismaKagidi'))).toBe('setHazirla');
    expect(geriHedefi(durum('calismaKagidi', { girisler: { calismaKagidi: 'haftalikPlan' } }))).toBe('haftalikPlan');
    expect(geriHedefi(durum('calismaKagidi', { girisler: { calismaKagidi: 'dersSonuOzeti' } }))).toBe('setHazirla');
    expect(geriHedefi(durum('eveGonder', { girisler: { eveGonder: 'dersSonuOzeti' } }))).toBe('dersSonuOzeti');
    expect(geriHedefi(durum('eveGonder'))).toBe('anaEkran');
    // Kendiliğinden geçen tema girişi ve kapılı veli kapısı Geri hedefi olmaz.
    expect(geriHedefi(durum('alistirma', { mod: 'kisisel', girisler: { alistirma: 'temaGirisi' } }))).toBe('anaEkran');
    expect(geriHedefi(durum('veliPaneli', { girisler: { veliPaneli: 'veliKapisi' } }))).toBe('anaEkran');
  });

  it('alıştırmanın üstü moda ve sete göre', () => {
    expect(geriHedefi(durum('alistirma'))).toBe('konuSecimi');
    expect(geriHedefi(durum('alistirma', { aktifSetVar: true }))).toBe('anaEkran');
    expect(geriHedefi(durum('alistirma', { aktifSetVar: true, girisler: { alistirma: 'setHazirla' } }))).toBe('setHazirla');
    expect(geriHedefi(durum('alistirma', { aktifSetVar: true, girisler: { alistirma: 'dersSonuOzeti' } }))).toBe('anaEkran');
    expect(geriHedefi(durum('alistirma', { mod: 'kisisel' }))).toBe('anaEkran');
    expect(geriHedefi(durum('evdeCalis', { mod: null }))).toBe('modSecimi');
    expect(geriHedefi(durum('evdeCalis', { mod: 'kisisel', evdeOnDakika: true }))).toBe('veliPaneli');
    expect(geriHedefi(durum('temaTuru'))).toBe('konuSecimi');
    expect(geriHedefi(durum('temaTuru', { mod: 'kisisel' }))).toBe('veliPaneli');
  });

  it('çıkış onayı yalnız ilerleme kaybolacaksa', () => {
    const onayli = EKRANLAR.filter((e) => [...tumDurumlar(e)].some(cikisOnayiGerekir)).sort();
    expect(onayli).toEqual(['alistirma', 'evdeCalis', 'sinifTuru', 'temaTuru']);
    expect(cikisOnayiGerekir(durum('alistirma'))).toBe(false); // tahtada serbest tek soru
    expect(cikisOnayiGerekir(durum('alistirma', { mod: 'kisisel' }))).toBe(false); // oturum kaldığı yerden sürer
    expect(cikisOnayiGerekir(durum('alistirma', { aktifSetVar: true }))).toBe(true); // set
    expect(cikisOnayiGerekir(durum('kesifMasasi'))).toBe(false);
  });
});

describe('appStore.gezin (KG-103)', () => {
  beforeEach(() => useAppStore.getState().sifirla());

  it('ileri geçişler girişleri yazar; Geri ve Ana menü yazmaz', () => {
    const s = useAppStore.getState();
    s.modSec('tahta');
    s.ekranGit('veliPaneli');
    s.ekranGit('haftalikPlan');
    s.kagitIcinSet(SET);
    expect(useAppStore.getState().girisler.calismaKagidi).toBe('haftalikPlan');
    s.gezin('geri');
    expect(useAppStore.getState().ekran).toBe('haftalikPlan');
    expect(useAppStore.getState().girisler.haftalikPlan).toBe('veliPaneli'); // Geri üzerine yazmadı
    s.gezin('geri');
    expect(useAppStore.getState().ekran).toBe('veliPaneli');
    s.gezin('anaMenu');
    expect(useAppStore.getState().ekran).toBe('anaEkran');
    s.gezin('geri'); // ana ekranda Geri yok
    expect(useAppStore.getState().ekran).toBe('anaEkran');
  });

  it('ayrılınan ekranın bellek durumu silinir (set, tema turu, ev çalışması, Sınıf Turu)', () => {
    const s = useAppStore.getState();
    s.modSec('tahta');
    s.ekranGit('setHazirla');
    s.setBaslat(SET);
    expect(useAppStore.getState().aktifSet).not.toBeNull();
    s.gezin('geri');
    expect(useAppStore.getState()).toMatchObject({ ekran: 'setHazirla', aktifSet: null });

    s.evdeOnDakikaBaslat(SET, 2);
    s.gezin('anaMenu');
    expect(useAppStore.getState()).toMatchObject({ ekran: 'anaEkran', evSeti: null, evdeOnDakikaTema: null });

    s.sinifTuruKur();
    s.sinifTuruBaslat(['mavi', 'sari'], SET, 1);
    expect(useAppStore.getState().sinifTuru).not.toBeNull();
    s.gezin('geri');
    expect(useAppStore.getState()).toMatchObject({ ekran: 'sinifTuruKurulum', sinifTuru: null });
  });

  it('eve link ile (mod yok) ev çalışmasından Ana menü mod seçimine gider', () => {
    const s = useAppStore.getState();
    s.evSetiAyarla(SET);
    s.ekranGit('evdeCalis');
    expect(gezinmeDurumu(useAppStore.getState()).mod).toBeNull();
    s.gezin('anaMenu');
    expect(useAppStore.getState()).toMatchObject({ ekran: 'modSecimi', evSeti: null });
  });

  it('sifirla girişleri temizler', () => {
    useAppStore.getState().ekranGit('kaynaklar');
    useAppStore.getState().sifirla();
    expect(useAppStore.getState().girisler).toEqual({});
  });
});
