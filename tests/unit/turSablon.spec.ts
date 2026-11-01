/**
 * Türkçe şablon dalgası 1 (Adım 69): deterministik itemId, D-11/D-12/D-23, öğretilen küme, klip manifesti,
 * çeldirici kataloğu ve kart düzeni. Şablon listesi `TUR_SABLON_KODLARI`'ndan okunur: yeni şablon eklenince
 * aynı denetimler otomatik kapsar.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { havuzuAyristir } from '../../src/content/dersler/tur/sablonlar/havuz';
import {
  TUR_SABLONLARI,
  TUR_SABLON_KODLARI,
  TUR_ZORLUKLARI,
  TurUretimHatasi,
  turSoruUret,
  type TurSoru,
} from '../../src/content/dersler/tur/sablonlar';
import { turKlipManifesti, turSoruEtkinligi, turSoruIhlalleri } from '../../src/content/dersler/tur/sablonlar/denetim';
import { karistirilanlar, KARISTIRILAN_CIFTLER } from '../../src/content/dersler/tur/sablonlar/celdiriciler';
import { heceKlibi, klipParcasi, sozcukKlibi, TUR_YONERGELERI } from '../../src/content/dersler/tur/sablonlar/klipler';
import { BELIRSIZLIK_SOZCUKLERI, bilinenSozcukMu, okunabilirSozcukler } from '../../src/content/dersler/tur/sablonlar/ortak';
import { hecele, heceTuru } from '../../src/content/dersler/tur/heceleme';
import { kumeKodla, kumeGecerliMi, resmiKume, dekodlanabilirMi } from '../../src/content/dersler/tur/ogretilenKume';
import { OGRETIM_SIRASI, yalnizUnsuzMu } from '../../src/content/dersler/tur/alfabe';
import { turIceriginiDogrula, TUR_TANI_ETIKETLERI } from '../../src/content/dersler/tur/dogrulayici';
import { PROGRAM_SURUMU } from '../../src/content/dersler/tur/alfabe';
import type { TurIcerikDosyasi } from '../../src/content/schema/turIcerik';
import { klipManifestiMetni } from '../../scripts/tur/klip-manifesti';
import { kartDuzeni } from '../../src/ui/tur/etkinlikDuzeni';
import { turAcilisEkrani } from '../../src/ui/tur/turEkrani';
import { createRng } from '../../src/exercises/rng';

const havuzHam = JSON.parse(readFileSync('ders-verisi/tur/icerik/sozcukler.json', 'utf8')) as unknown;
const havuz = havuzuAyristir(havuzHam);
const manifest = new Map(turKlipManifesti(havuz).map((k) => [k.anahtar, k.metin]));

/** 1.–2. grup resmî kümeleri (her harf, küçük) + birkaç öğretmen kümesi (farklı sıra, destek grubu, büyük harfli). */
const KUMELER: Set<string>[] = [
  ...OGRETIM_SIRASI.slice(0, 12).map((h) => resmiKume(h, false)),
  new Set(['a', 'e', 'l', 'k', 'o', 'm']),
  new Set(['a', 'n', 'e', 't', 'u', 'r', 'ı', 'i']),
  new Set([...resmiKume('t', true), 'k', 'o', 'u']),
  resmiKume('m', true),
];
const TOHUMLAR = Array.from({ length: 12 }, (_, i) => i + 1);

function hepsi(): { soru: TurSoru; kume: Set<string> }[] {
  const out: { soru: TurSoru; kume: Set<string> }[] = [];
  for (const kume of KUMELER)
    for (const s of TUR_SABLON_KODLARI)
      for (const zorluk of TUR_ZORLUKLARI)
        for (const tohum of TOHUMLAR) {
          try {
            out.push({ soru: turSoruUret(s, { havuz, kume, zorluk, tohum }), kume });
          } catch (e) {
            if (!(e instanceof TurUretimHatasi)) throw e;
          }
        }
  return out;
}
const URETILEN = hepsi();

describe('Türkçe şablonlar — üretim (Adım 69)', () => {
  it('havuz: 125 sözcük, hepsi küçük ve kendi giriş harfinde okunabilir', () => {
    expect(havuz).toHaveLength(125);
    for (const s of havuz) expect(dekodlanabilirMi(s.metin, resmiKume(s.girisHarfi, false)), s.metin).toBe(true);
  });

  it('her şablon her zorlukta 1.–2. grup resmî kümelerinin çoğunda kurulur', () => {
    for (const s of TUR_SABLON_KODLARI)
      for (const z of TUR_ZORLUKLARI) {
        const n = URETILEN.filter((u) => u.soru.sablon === s && u.soru.zorluk === z).length;
        expect(n, `${s} z${z}`).toBeGreaterThan(KUMELER.length * TOHUMLAR.length * 0.5);
      }
  });

  it('deterministik: aynı girdi aynı soru ve itemId; küme itemId’ye girer', () => {
    const kume = resmiKume('m', false);
    for (const s of TUR_SABLON_KODLARI)
      for (const zorluk of TUR_ZORLUKLARI) {
        const a = turSoruUret(s, { havuz, kume, zorluk, tohum: 7 });
        const b = turSoruUret(s, { havuz, kume: new Set(kume), zorluk, tohum: 7 });
        expect(b).toEqual(a);
        expect(a.itemId).toMatch(new RegExp(`^tur\\.${s}#[0-9a-z]+$`));
        const c = turSoruUret(s, { havuz, kume: resmiKume('r', false), zorluk, tohum: 7 });
        expect(c.itemId).not.toBe(a.itemId);
      }
    const ids = new Set(URETILEN.filter((u) => u.kume === KUMELER[11]).map((u) => u.soru.itemId));
    expect(ids.size).toBe(URETILEN.filter((u) => u.kume === KUMELER[11]).length);
  });

  it('bütün üretilen sorular şablon denetimini geçer (öğretmen kümesi, klip, tanı etiketi, kart sayısı)', () => {
    expect(URETILEN.length).toBeGreaterThan(500);
    const ihlaller = URETILEN.flatMap(({ soru, kume }) =>
      turSoruIhlalleri(soru, kume, manifest).map((m) => `${soru.itemId} [${kumeKodla(kume)}]: ${m}`),
    );
    expect(ihlaller).toEqual([]);
  });

  it('bütün üretilen sorular CI doğrulayıcısının etkinlik kurallarını geçer (D-11, D-12, D-23, D-15)', () => {
    const tekil = new Map(URETILEN.map(({ soru }) => [soru.itemId, turSoruEtkinligi(soru, manifest)]));
    const d: TurIcerikDosyasi = {
      programSurumu: PROGRAM_SURUMU,
      harfler: [],
      heceler: [],
      sozcukler: [],
      cumleler: [],
      etkinlikler: [...tekil.values()],
    };
    const r = turIceriginiDogrula(d);
    expect(r.hatalar).toEqual([]);
  });

  it('tek doğru: seçim sorusunda doğru kart tekil, çeldiricinin tanı etiketi var/yoksa geçerli', () => {
    for (const { soru } of URETILEN) {
      if (soru.kind !== 'secim') continue;
      const dogru = soru.kartlar[soru.dogru];
      expect(soru.kartlar.filter((k) => k.metin === dogru.metin)).toHaveLength(1);
      expect(dogru.diagnosticTag).toBeUndefined();
      for (const k of soru.kartlar) if (k.diagnosticTag) expect(TUR_TANI_ETIKETLERI.has(k.diagnosticTag)).toBe(true);
    }
  });

  it('T-02: çeldirici harf duyulan sözcüklerin hepsinde geçmez; hedef hepsinde geçer; ses yalnız sözcük', () => {
    for (const { soru } of URETILEN.filter((u) => u.soru.sablon === 'T-02')) {
      if (soru.kind !== 'secim') throw new Error('T-02 seçim');
      const hedef = soru.kartlar[soru.dogru].metin;
      expect(soru.sozcukler.every((w) => w.includes(hedef))).toBe(true);
      for (const k of soru.kartlar)
        if (k.metin !== hedef) expect(soru.sozcukler.every((w) => w.includes(k.metin)), soru.itemId).toBe(false);
      expect(soru.soruKlipleri).toEqual(soru.sozcukler.map(sozcukKlibi));
      if (soru.zorluk <= 2) expect(soru.sozcukler.every((w) => w[0] === hedef)).toBe(true);
    }
  });

  it('T-03: model harf seslendirilmez, yönerge hedefi söylemez (D-12), karıştırılan çift z3+’ta önce gelir', () => {
    let etiketli = 0;
    for (const { soru } of URETILEN.filter((u) => u.soru.sablon === 'T-03')) {
      expect(soru.soruKlipleri).toEqual([]);
      expect(soru.geriBildirim.every((k) => k.startsWith('tur.geri.'))).toBe(true);
      if (soru.zorluk >= 3 && soru.kartlar.some((k) => k.diagnosticTag)) etiketli++;
    }
    expect(etiketli).toBeGreaterThan(50);
  });

  it('T-04: hece okunabilir bir sözcükten (D-05), kapalı → açık sırası zorlukla, hece klibi yalnız cevaptan sonra', () => {
    const t04 = URETILEN.filter((u) => u.soru.sablon === 'T-04');
    expect(t04.length).toBeGreaterThan(100);
    for (const { soru, kume } of t04) {
      if (soru.kind !== 'yerlestir' || soru.uyaran.tur !== 'yazi') throw new Error('T-04 yerleştir + model');
      const hece = soru.uyaran.metin;
      expect(soru.dogruDizi.join('')).toBe(hece);
      const kaynak = okunabilirSozcukler(havuz, kume).find((w) => w.metin === soru.sozcukler[0]);
      expect(kaynak && hecele(kaynak.metin).includes(hece), soru.itemId).toBe(true);
      expect(soru.soruKlipleri).toEqual([]);
      expect(soru.geriBildirim.at(-1)).toBe(heceKlibi(hece));
      if (soru.zorluk === 3 && heceTuru(hece) !== 'acik') {
        // açık hece yoksa iki harfliye düşülür: kümede gerçekten açık hece olmamalı
        const acik = okunabilirSozcukler(havuz, kume).flatMap((w) => hecele(w.metin)).some((h) => h.length === 2 && heceTuru(h) === 'acik');
        expect(acik, soru.itemId).toBe(false);
      }
    }
    expect(t04.filter((u) => u.soru.zorluk <= 2).every((u) => u.soru.hedefMetin.length === 2)).toBe(true);
  });

  it('T-05: kartlar sözcüğün heceleri (+ okunabilir çeldirici hece), başka diziliş bilinen sözcük kurmaz', () => {
    const t05 = URETILEN.filter((u) => u.soru.sablon === 'T-05');
    expect(t05.length).toBeGreaterThan(100);
    for (const { soru, kume } of t05) {
      if (soru.kind !== 'yerlestir') throw new Error('T-05 yerleştir');
      expect(soru.dogruDizi).toEqual(hecele(soru.hedefMetin));
      expect(soru.kartlar.every((k) => k.tur === 'hece')).toBe(true);
      const heceler = new Set(okunabilirSozcukler(havuz, kume).flatMap((w) => hecele(w.metin)));
      for (const k of soru.kartlar) expect(heceler.has(k.metin), `${soru.itemId} ${k.metin}`).toBe(true);
      expect(soru.uyaran.tur === 'yazi').toBe(soru.zorluk === 1);
      // Tek doğru: n kartın her dizilişi
      const n = soru.dogruDizi.length;
      const metinler = soru.kartlar.map((k) => k.metin);
      const yuru = (yol: number[]): void => {
        if (yol.length === n) {
          const w = yol.map((i) => metinler[i]).join('');
          if (w !== soru.hedefMetin) expect(bilinenSozcukMu(w, havuz), `${soru.itemId}: ${w}`).toBe(false);
          return;
        }
        metinler.forEach((_, i) => !yol.includes(i) && yuru([...yol, i]));
      };
      yuru([]);
    }
  });

  it('T-06: boşluklu sözcük okunabilir; eksik harf tek doğru, hiçbir çeldirici bilinen sözcük kurmaz; ses yalnız cevaptan sonra', () => {
    const t06 = URETILEN.filter((u) => u.soru.sablon === 'T-06');
    expect(t06.length).toBeGreaterThan(100);
    for (const { soru, kume } of t06) {
      if (soru.kind !== 'yerlestir' || soru.uyaran.tur !== 'bosluklu') throw new Error('T-06 yerleştir + boşluklu');
      const { once, sonra } = soru.uyaran;
      expect(soru.dogruDizi).toHaveLength(1);
      expect(once + soru.dogruDizi[0] + sonra).toBe(soru.hedefMetin);
      expect(okunabilirSozcukler(havuz, kume).some((w) => w.metin === soru.hedefMetin), soru.itemId).toBe(true);
      expect(soru.soruKlipleri).toEqual([]);
      expect(soru.geriBildirim.at(-1)).toBe(sozcukKlibi(soru.hedefMetin));
      expect(soru.kartlar.every((k) => k.tur === 'harf' && kume.has(k.metin)), soru.itemId).toBe(true);
      for (const k of soru.kartlar)
        if (k.metin !== soru.dogruDizi[0]) expect(bilinenSozcukMu(once + k.metin + sonra, havuz), `${soru.itemId} ${k.metin}`).toBe(false);
    }
  });

  it('T-07: dikte — ses yalnız sözcük (tek ünsüz yok), kartlar sözcüğün harfleri + kümeden çeldirici, en çok 8 kart', () => {
    const t07 = URETILEN.filter((u) => u.soru.sablon === 'T-07');
    expect(t07.length).toBeGreaterThan(100);
    for (const { soru, kume } of t07) {
      if (soru.kind !== 'yerlestir' || soru.uyaran.tur !== 'ses') throw new Error('T-07 yerleştir + ses');
      expect(soru.dogruDizi.join('')).toBe(soru.hedefMetin);
      expect(soru.soruKlipleri).toEqual([sozcukKlibi(soru.hedefMetin)]);
      expect(soru.geriBildirim.at(-1)).toBe(sozcukKlibi(soru.hedefMetin));
      expect(soru.kartlar.length).toBeLessThanOrEqual(8);
      expect(soru.kartlar.every((k) => k.tur === 'harf' && kume.has(k.metin)), soru.itemId).toBe(true);
      expect(okunabilirSozcukler(havuz, kume).some((w) => w.metin === soru.hedefMetin), soru.itemId).toBe(true);
    }
  });

  it('kart sayısı en çok 8 (tahta 1080×810) ve kartların hiçbiri ses taşımaz (tipte ses alanı yok)', () => {
    for (const { soru } of URETILEN) {
      expect(soru.kartlar.length).toBeLessThanOrEqual(8);
      for (const k of soru.kartlar) expect(Object.keys(k).sort()).toEqual(expect.arrayContaining(['id', 'metin', 'tur']));
      for (const k of soru.kartlar) expect(k).not.toHaveProperty('ses');
    }
  });

  it('kurulamayan kümede açıklayıcı TurUretimHatasi (yalnız "a")', () => {
    expect(() => turSoruUret('T-02', { havuz, kume: new Set(['a']), zorluk: 1, tohum: 1 })).toThrow(TurUretimHatasi);
    expect(turSoruUret('T-03', { havuz, kume: new Set(['a']), zorluk: 1, tohum: 1 }).kartlar.map((k) => k.tur).sort()).toEqual([
      'harf',
      'simge',
    ]);
  });
});

describe('Türkçe şablonlar — kural tuzakları (doğrulayıcı kırmızı olmalı)', () => {
  const kume = resmiKume('m', false);
  const t03 = turSoruUret('T-03', { havuz, kume, zorluk: 3, tohum: 3 });
  const etk = turSoruEtkinligi(t03, manifest);
  const dosya = (e: typeof etk): TurIcerikDosyasi => ({
    programSurumu: PROGRAM_SURUMU,
    harfler: [],
    heceler: [],
    sozcukler: [],
    cumleler: [],
    etkinlikler: [e],
  });
  const kurallar = (e: typeof etk) => turIceriginiDogrula(dosya(e)).hatalar.map((h) => h.kural);

  it('D-11: sesli harf kartı', () => {
    expect(kurallar({ ...etk, secenekler: etk.secenekler.map((s) => ({ ...s, sesli: true })) })).toContain('D-11');
  });
  it('D-12: okuma sorusunda yönerge hedefi söylüyor', () => {
    const hedef = t03.hedefMetin;
    expect(kurallar({ ...etk, yonerge: { anahtar: 'tur.yonerge.x', metin: `Şunu bul: ${hedef}` } })).toContain('D-12');
  });
  it('D-23: öğretilmemiş harf çeldirici ve bilinmeyen tanı etiketi', () => {
    expect(kurallar({ ...etk, secenekler: [...etk.secenekler, { tur: 'harf', metin: 'ş', sesli: false }] })).toContain('D-23');
    expect(
      kurallar({ ...etk, secenekler: [...etk.secenekler, { tur: 'harf', metin: 'a', sesli: false, diagnosticTag: 'YOK' }] }),
    ).toContain('D-23');
  });
  it('şablon denetimi: öğretmen kümesi dışı harf, harf klibi, tanı etiketi doğru kartta', () => {
    const dar = new Set([...kume].filter((h) => h !== t03.kartlar.find((k) => k.tur === 'harf' && k.metin !== t03.hedefMetin)?.metin));
    expect(turSoruIhlalleri(t03, dar, manifest).some((m) => m.startsWith('D-23'))).toBe(true);
    const harfKlipli = { ...t03, geriBildirim: ['tur.harf.k' as const] } as unknown as TurSoru;
    expect(turSoruIhlalleri(harfKlipli, kume, manifest).join(' ')).toContain('D-11');
    if (t03.kind === 'secim') {
      const etiketli = { ...t03, kartlar: t03.kartlar.map((k, i) => (i === t03.dogru ? { ...k, diagnosticTag: 'TUR_AYNA_CIFT' as const } : k)) };
      expect(turSoruIhlalleri(etiketli, kume, manifest).join(' ')).toContain('tanı etiketi doğru kartta');
    }
    const okumaSesli = { ...t03, soruKlipleri: [sozcukKlibi('kale')] };
    expect(turSoruIhlalleri(okumaSesli, kume, manifest).join(' ')).toContain('D-12');
  });
});

describe('Türkçe klipler ve manifest (D-11, D-21)', () => {
  it('commitlenmiş manifest üreticiyle aynı (npm run tur:klip)', () => {
    expect(readFileSync('ders-verisi/tur/ses/klipler.json', 'utf8')).toBe(klipManifestiMetni(havuzHam));
  });
  it('hiçbir klip tek başına ünsüz değil, harf klibi yok, hepsi eksik (TTS yok)', () => {
    const m = JSON.parse(readFileSync('ders-verisi/tur/ses/klipler.json', 'utf8')) as {
      klipler: { anahtar: string; metin: string; durum: string }[];
    };
    expect(m.klipler.length).toBeGreaterThan(200);
    for (const k of m.klipler) {
      expect(yalnizUnsuzMu(k.metin), k.anahtar).toBe(false);
      expect(k.anahtar).not.toMatch(/^tur\.harf\./);
      expect(k.durum).toBe('eksik');
    }
  });
  it('kimlik: Türkçe harfler çakışmaz (kır ≠ kir), tek ünsüz hece klibi üretilemez', () => {
    expect(klipParcasi('kır')).not.toBe(klipParcasi('kir'));
    expect(sozcukKlibi('tırtıl')).toBe('tur.sozcuk.ti2rti2l');
    expect(() => heceKlibi('k')).toThrow();
    expect(() => klipParcasi('Kale')).toThrow();
  });
  it('yönergeler tek ünsüz değil ve hiçbir havuz sözcüğünü içermez (okuma sorusunda ele vermesin, D-12)', () => {
    const sozcukler = new Set(havuz.map((s) => s.metin));
    for (const [k, metin] of Object.entries(TUR_YONERGELERI)) {
      expect(yalnizUnsuzMu(metin)).toBe(false);
      const w = metin.toLocaleLowerCase('tr-TR').replace(/[.,!?]/g, '').split(' ');
      expect(w.filter((x) => sozcukler.has(x)), k).toEqual([]);
    }
  });
});

describe('Çeldirici kataloğu (D-23)', () => {
  it('yalnız kümedeki harfler döner; noktalı ve ayna çiftleri katalogda', () => {
    expect(karistirilanlar('ı', new Set(['i', 'l', 'a']))).toEqual([
      { harf: 'i', etiket: 'TUR_NOKTALI_CIFT' },
      { harf: 'l', etiket: 'TUR_BENZER_BICIM' },
    ]);
    expect(karistirilanlar('c', new Set(['a']))).toEqual([]);
    const ciftler = KARISTIRILAN_CIFTLER.map((c) => `${c.a}/${c.b}`);
    for (const c of ['c/ç', 's/ş', 'g/ğ', 'o/ö', 'u/ü', 'ı/i', 'b/d', 'n/u', 'm/n']) expect(ciftler).toContain(c);
    for (const c of KARISTIRILAN_CIFTLER) expect(TUR_TANI_ETIKETLERI.has(c.etiket)).toBe(true);
  });
  it('belirsizlik listesi küçük harf, tek sözcük', () => {
    for (const w of BELIRSIZLIK_SOZCUKLERI) expect(w).toMatch(/^[a-zçğıöşü]+$/);
  });
  it('rastgele öğretmen kümelerinde de denetim temiz (40 küme)', () => {
    const rng = createRng(2026);
    for (let i = 0; i < 40; i++) {
      const kume = new Set(rng.sample(OGRETIM_SIRASI.slice(0, 12), rng.int(3, 12)));
      expect(kumeGecerliMi(kume)).toBe(true);
      for (const s of TUR_SABLON_KODLARI)
        for (const zorluk of TUR_ZORLUKLARI)
          try {
            const soru = TUR_SABLONLARI[s].uret({ havuz, kume, zorluk, tohum: i });
            expect(turSoruIhlalleri(soru, kume, manifest)).toEqual([]);
          } catch (e) {
            if (!(e instanceof TurUretimHatasi)) throw e;
          }
    }
  });
});

describe('Kart düzeni ve açılış adresi', () => {
  const tahta = { enBoy: 1, enBuyuk: 240, tapMin: 102, aralik: 38, kontrol: 141 };
  it('1080×810 tahta alt alanında 8 harf kartı tap-min üstünde, alt çubuk sığdırılır', () => {
    const d = kartDuzeni({ ...tahta, alanGenislik: 780, alanYukseklik: 409, adet: 8 });
    expect(d.kart).toBeGreaterThanOrEqual(102);
    const yuk = d.satir * d.kart + (d.satir - 1) * 38 + 38 + d.cubuk;
    expect(yuk).toBeLessThanOrEqual(409);
    expect(d.sutun * d.kart + (d.sutun - 1) * 38).toBeLessThanOrEqual(780);
  });
  it('geniş alanda kart enBuyuk ile sınırlı, çubuk kontrol boyunda', () => {
    const d = kartDuzeni({ ...tahta, alanGenislik: 1600, alanYukseklik: 600, adet: 3 });
    expect(d).toEqual({ kart: 240, satir: 1, sutun: 3, cubuk: 141 });
  });
  it('açılış: ?ders=tur&etkinlik=T-03&zorluk=4&tohum=9', () => {
    expect(turAcilisEkrani('?ders=tur&etkinlik=T-03&zorluk=4&tohum=9')).toEqual({
      ekran: 'etkinlik',
      sablon: 'T-03',
      zorluk: 4,
      tohum: 9,
    });
    expect(turAcilisEkrani('?ders=tur&etkinlik=liste')).toEqual({ ekran: 'etkinlikler' });
    expect(turAcilisEkrani('?ders=tur&etkinlik=T-99')).toEqual({ ekran: 'giris' });
    expect(turAcilisEkrani('?ders=tur&etkinlik=T-02&zorluk=9')).toMatchObject({ zorluk: 1 });
  });
});
