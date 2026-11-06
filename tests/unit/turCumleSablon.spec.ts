/**
 * Cümle şablonları (Adım 74): T-10 Cümleyi oku resmini bul, T-11 Noktalama işaretini seç (+ 74c: T-12). Ayrı tembel
 * parça (KG-156): parça yüklenmeden `TurUretimHatasi`; yüklenince her zorlukta 2.–5. grup kümelerinde kurulur; CI
 * doğrulayıcısı (D-07…D-12, D-15, D-23) ve şablon denetimi 0 ihlal; determinizm; şablona özgü kurallar.
 */
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { havuzuAyristir } from '../../src/content/dersler/tur/sablonlar/havuz';
import { cumleHavuzunuAyristir } from '../../src/content/dersler/tur/sablonlar/cumle/cumleHavuzu';
import {
  TUR_CUMLE_SABLON_KODLARI,
  TUR_SABLONLARI,
  TUR_ZORLUKLARI,
  TurUretimHatasi,
  turSoruUret,
  type TurSecimSorusu,
  type TurSoru,
} from '../../src/content/dersler/tur/sablonlar';
import { cumleParcasiniYukle, cumleUreticileriniKaydet } from '../../src/content/dersler/tur/sablonlar/cumleKayit';
import { turKlipManifesti, turSoruEtkinligi, turSoruIhlalleri } from '../../src/content/dersler/tur/sablonlar/denetim';
import { dekodlanabilirMi, kumeKodla, resmiKume } from '../../src/content/dersler/tur/ogretilenKume';
import { turIceriginiDogrula, UNLEM_SOZCUKLERI } from '../../src/content/dersler/tur/dogrulayici';
import { PROGRAM_SURUMU, trKucuk } from '../../src/content/dersler/tur/alfabe';
import type { TurIcerikDosyasi } from '../../src/content/schema/turIcerik';
import { cumleKlibi } from '../../src/content/dersler/tur/sablonlar/klipler';
import { turAcilisEkrani } from '../../src/ui/tur/turEkrani';

const havuzHam = JSON.parse(readFileSync('ders-verisi/tur/icerik/sozcukler.json', 'utf8')) as unknown;
const cumleHam = JSON.parse(readFileSync('ders-verisi/tur/icerik/cumleler.json', 'utf8')) as unknown;
const havuz = havuzuAyristir(havuzHam);
const cumleler = cumleHavuzunuAyristir(cumleHam);
const manifest = new Map(turKlipManifesti(havuz, cumleler).map((k) => [k.anahtar, k.metin]));
const sozcukDosyasi = { sozcukler: (havuzHam as { sozcukler: TurIcerikDosyasi['sozcukler'] }).sozcukler };

/** 2.–5. grup resmî kümeleri (büyük harfler dahil) + son harfin büyüğü öğretilmemiş kümeler. */
const KUMELER: Set<string>[] = [
  resmiKume('m', true),
  resmiKume('m', false),
  resmiKume('z', true),
  resmiKume('ş', true),
  resmiKume('j', true),
  resmiKume('f', false),
];
const TOHUMLAR = Array.from({ length: 10 }, (_, i) => i + 1);

let URETILEN: { soru: TurSoru; kume: Set<string> }[] = [];

beforeAll(async () => {
  await cumleParcasiniYukle();
  URETILEN = [];
  for (const kume of KUMELER)
    for (const s of TUR_CUMLE_SABLON_KODLARI)
      for (const zorluk of TUR_ZORLUKLARI)
        for (const tohum of TOHUMLAR) {
          try {
            URETILEN.push({ soru: turSoruUret(s, { havuz, kume, zorluk, tohum, cumleler }), kume });
          } catch (e) {
            if (!(e instanceof TurUretimHatasi)) throw e;
          }
        }
});

describe('Cümle şablonları — parça ve kayıt (KG-156)', () => {
  it('parça yüklenmeden TurUretimHatasi; yüklenince kurulur', async () => {
    const m = await cumleParcasiniYukle();
    cumleUreticileriniKaydet({});
    expect(() => turSoruUret('T-10', { havuz, kume: resmiKume('m', true), zorluk: 1, tohum: 1, cumleler })).toThrow(TurUretimHatasi);
    cumleUreticileriniKaydet(m.TUR_CUMLE_URETICILERI);
    expect(turSoruUret('T-10', { havuz, kume: resmiKume('m', true), zorluk: 1, tohum: 1, cumleler }).sablon).toBe('T-10');
  });

  it('1. grupta ve cümle havuzu verilmeden kurulmaz (D-08)', () => {
    for (const s of TUR_CUMLE_SABLON_KODLARI) {
      expect(() => turSoruUret(s, { havuz, kume: resmiKume('l', true), zorluk: 1, tohum: 1, cumleler })).toThrow(TurUretimHatasi);
      expect(() => turSoruUret(s, { havuz, kume: resmiKume('j', true), zorluk: 1, tohum: 1 })).toThrow(TurUretimHatasi);
    }
  });

  it('kayıtta beceri "cumle"; adres T-10/T-11 açar', () => {
    for (const s of TUR_CUMLE_SABLON_KODLARI) {
      expect(TUR_SABLONLARI[s].beceri).toBe('cumle');
      expect(turAcilisEkrani(`?ders=tur&etkinlik=${s}&zorluk=2&tohum=3`)).toEqual({ ekran: 'etkinlik', sablon: s, zorluk: 2, tohum: 3 });
    }
  });
});

describe('Cümle şablonları — üretim (Adım 74)', () => {
  it('her şablon her zorlukta kümelerin çoğunda kurulur', () => {
    for (const s of TUR_CUMLE_SABLON_KODLARI)
      for (const z of TUR_ZORLUKLARI) {
        const n = URETILEN.filter((u) => u.soru.sablon === s && u.soru.zorluk === z).length;
        expect(n, `${s} z${z}`).toBeGreaterThanOrEqual(KUMELER.length * TOHUMLAR.length * 0.8);
      }
  });

  it('şablon denetimi ve CI doğrulayıcısı: 0 ihlal (öğretilen küme, D-11, D-12, D-15, D-21, D-23)', () => {
    const etkinlikler = URETILEN.map((u) => turSoruEtkinligi(u.soru, manifest));
    for (const u of URETILEN) expect(turSoruIhlalleri(u.soru, u.kume, manifest, havuz), u.soru.itemId).toEqual([]);
    const dosya: TurIcerikDosyasi = {
      programSurumu: PROGRAM_SURUMU,
      harfler: [],
      heceler: [],
      sozcukler: sozcukDosyasi.sozcukler,
      cumleler: [],
      etkinlikler: etkinlikler.filter((e, i, l) => l.findIndex((x) => x.id === e.id) === i),
    };
    const r = turIceriginiDogrula(dosya);
    expect(r.hatalar).toEqual([]);
  });

  it('deterministik: aynı girdi aynı soru; küme itemId’ye girer', () => {
    const k = resmiKume('ş', true);
    for (const s of TUR_CUMLE_SABLON_KODLARI) {
      const a = turSoruUret(s, { havuz, kume: k, zorluk: 3, tohum: 7, cumleler });
      expect(turSoruUret(s, { havuz, kume: k, zorluk: 3, tohum: 7, cumleler })).toEqual(a);
      expect(a.itemId).toContain(`tur.${s}#`);
      const b = turSoruUret(s, { havuz, kume: resmiKume('j', true), zorluk: 3, tohum: 7, cumleler });
      expect(b.itemId).not.toBe(a.itemId);
    }
  });

  it('okuma hedefli: soru sesi yok; geri bildirimde övgü + cümle klibi (yalnız cevaptan sonra)', () => {
    for (const { soru } of URETILEN) {
      expect(soru.soruKlipleri).toEqual([]);
      const c = cumleler.find((x) => x.metin === soru.hedefMetin)!;
      expect(c, soru.hedefMetin).toBeDefined();
      expect(soru.geriBildirim).toEqual(['tur.geri.dogru', cumleKlibi(c.id)]);
      expect(manifest.get(cumleKlibi(c.id))).toBe(c.metin);
    }
  });
});

describe('T-10 Cümleyi oku, resmini bul', () => {
  const t10 = () => URETILEN.filter((u) => u.soru.sablon === 'T-10');
  it('üstte yazılı cümle; kartlar görsel; doğru resim cümlede adı geçen nesne, çeldiricilerin adı cümlede yok', () => {
    for (const { soru, kume } of t10()) {
      const s = soru as TurSecimSorusu;
      expect(s.uyaran).toEqual({ tur: 'yazi', metin: s.hedefMetin });
      const c = cumleler.find((x) => x.metin === s.hedefMetin)!;
      expect(s.kartlar[s.dogru].gorselId).toBe(c.gorselId);
      const govde = trKucuk(s.hedefMetin).split(/[ ,.?!']+/).filter((w) => w.length > 0);
      s.kartlar.forEach((k, i) => {
        expect(k.tur).toBe('gorsel');
        expect(dekodlanabilirMi(k.metin, kume)).toBe(true);
        if (i !== s.dogru) expect(govde.some((w) => w.startsWith(k.metin) || k.metin.startsWith(w)), `${s.hedefMetin} / ${k.metin}`).toBe(false);
      });
    }
  });
  it('zorluk: resim sayısı 2/3/3/4/4, z1 iki sözcüklü cümle', () => {
    const beklenen = { 1: 2, 2: 3, 3: 3, 4: 4, 5: 4 } as const;
    for (const { soru } of t10()) expect(soru.kartlar.length, soru.itemId).toBe(beklenen[soru.zorluk]);
    for (const { soru } of t10().filter((u) => u.soru.zorluk === 1)) expect(soru.hedefMetin.split(' ')).toHaveLength(2);
  });
});

describe('T-11 Noktalama işaretini seç', () => {
  const t11 = () => URETILEN.filter((u) => u.soru.sablon === 'T-11');
  it('uyaran bitiş işaretsiz cümle; kartlar sabit sırada . ? (!), doğru kart cümlenin işareti', () => {
    for (const { soru } of t11()) {
      const s = soru as TurSecimSorusu;
      expect(s.uyaran).toEqual({ tur: 'noktalama', metin: s.hedefMetin.slice(0, -1) });
      const isaretler = s.kartlar.map((k) => k.metin);
      expect(['.?', '.?!']).toContain(isaretler.join(''));
      expect(s.kartlar.every((k) => k.tur === 'noktalama')).toBe(true);
      expect(isaretler[s.dogru]).toBe(s.hedefMetin.at(-1));
    }
  });
  it('ünlem kartı yalnız 5. grup açıkken ve z4–5’te; ünlem cümlesi ünlem sözcüğüyle (D-09)', () => {
    for (const { soru, kume } of t11()) {
      const unlem = soru.kartlar.some((k) => k.metin === '!');
      if (unlem) {
        expect(kume.has('p'), soru.itemId).toBe(true);
        expect(soru.zorluk).toBeGreaterThanOrEqual(4);
      }
      if (soru.hedefMetin.endsWith('!')) expect(UNLEM_SOZCUKLERI.has(trKucuk(soru.hedefMetin.split(',')[0]))).toBe(true);
    }
    const g5z5 = t11().filter((u) => u.kume.has('p') && u.kume.has('j') && u.soru.zorluk === 5);
    expect(g5z5.some((u) => u.soru.hedefMetin.endsWith('!'))).toBe(true);
    expect(g5z5.every((u) => u.soru.kartlar.length === 3)).toBe(true);
  });
  it('z1: en çok 3 sözcük; soru cümlesi soru ekli', () => {
    for (const { soru } of t11().filter((u) => u.soru.zorluk === 1)) {
      expect(soru.hedefMetin.split(' ').length).toBeLessThanOrEqual(3);
      if (soru.hedefMetin.endsWith('?')) expect(/ m[ıiuü]\?$| m[ıiuü] /.test(soru.hedefMetin), soru.hedefMetin).toBe(true);
    }
  });
  it('türler karışık: kümede hem nokta hem soru cevabı gelir', () => {
    const cevaplar = new Set(t11().map((u) => u.soru.hedefMetin.at(-1)));
    expect([...cevaplar].sort()).toEqual(['!', '.', '?']);
    expect(kumeKodla(resmiKume('j', true))).toMatch(/^[0-9a-z]+$/);
  });
});
