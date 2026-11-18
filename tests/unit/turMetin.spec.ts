/**
 * Okuma metinleri ve anlama (Adım 80): `ders-verisi/tur/icerik/metinler.json` şema + D-27 (metin cümleleri cümle havuzuyla
 * AYNI kural yolundan geçer), görsel cevap bağı (D-25), çalışma anı ayrıştırıcısı ve süzgeci, T-13 "Metni oku, soruyu
 * cevapla" (ayrı tembel parça, 1. grupta kurulmaz), klip manifesti ve set/akış bağları. Testler yalnız okur; gerçek veri
 * klasörüne yazmaz.
 */
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { turIcerikDosyasiniAyristir, type TurIcerikDosyasi } from '../../src/content/schema/turIcerik';
import { gorselDiziniAyristir } from '../../src/content/schema/turGorsel';
import { turIceriginiDogrula, type KuralKodu } from '../../src/content/dersler/tur/dogrulayici';
import { metinGorselBaglariniDenetle } from '../../src/content/dersler/tur/gorselDenetimi';
import { metinHavuzunuAyristir, okunabilirMetinler } from '../../src/content/dersler/tur/sablonlar/metin/metinHavuzu';
import { metinParcasiniYukle, metinUreticileriniKaydet } from '../../src/content/dersler/tur/sablonlar/metinKayit';
import { cumleParcasiniYukle } from '../../src/content/dersler/tur/sablonlar/cumleKayit';
import { havuzuAyristir } from '../../src/content/dersler/tur/sablonlar/havuz';
import { cumleHavuzunuAyristir } from '../../src/content/dersler/tur/sablonlar/cumle/cumleHavuzu';
import {
  TUR_SABLONLARI,
  TUR_TUM_SABLON_KODLARI,
  TUR_ZORLUKLARI,
  TurUretimHatasi,
  turSoruUret,
  type TurSecimSorusu,
  type TurSoru,
} from '../../src/content/dersler/tur/sablonlar';
import { turKlipManifesti, turSoruEtkinligi, turSoruIhlalleri } from '../../src/content/dersler/tur/sablonlar/denetim';
import { metinCumleKlibi, TUR_YONERGELERI } from '../../src/content/dersler/tur/sablonlar/klipler';
import { cumleGovdeleri } from '../../src/content/dersler/tur/sablonlar/cumle/ortakCumle';
import { resmiKume } from '../../src/content/dersler/tur/ogretilenKume';
import { HARF_GRUPLARI, PROGRAM_SURUMU } from '../../src/content/dersler/tur/alfabe';
import { turSetiKur, SET_ADIM_SAYISI } from '../../src/content/dersler/tur/turSet';
import { AKIS_BASAMAKLARI } from '../../src/content/dersler/tur/gununAkisi';
import { turAcilisEkrani } from '../../src/ui/tur/turEkraniDurumu';
import type { TurHamleDosyasi } from '../../src/content/schema/turHamle';

const oku = (yol: string): unknown => JSON.parse(readFileSync(yol, 'utf8')) as unknown;
type Ham = { teyit: { durum: string }; metinler: Record<string, unknown>[] } & Record<string, unknown>;
const metinHam = oku('ders-verisi/tur/icerik/metinler.json') as Ham;
const havuzHam = oku('ders-verisi/tur/icerik/sozcukler.json');
const cumleHam = oku('ders-verisi/tur/icerik/cumleler.json');
const dosya = turIcerikDosyasiniAyristir(metinHam);
const dizinler = [1, 2].map((g) => gorselDiziniAyristir(oku(`ders-verisi/tur/gorseller/grup-${g}.json`)));
const havuz = havuzuAyristir(havuzHam);
const cumleler = cumleHavuzunuAyristir(cumleHam);
const metinler = metinHavuzunuAyristir(metinHam);
const manifest = new Map(turKlipManifesti(havuz, cumleler, metinler).map((k) => [k.anahtar, k.metin]));
const hamleler = (oku('ders-verisi/tur/hamleler.json') as TurHamleDosyasi).glifler;

const kopya = (): Ham => structuredClone(metinHam);
const ilk = (h: Ham, grup: number) => h.metinler.find((m) => m.grup === grup)!;
const sorular = (m: Record<string, unknown>) => m.sorular as Record<string, unknown>[];
/** Sözcük cevaplı sorusu olan ilk 2. grup metni ve o sorusu (resim cevaplı sorular için `sorular(ilk(h, 2))[0]`). */
const sozcukluMetin = (h: Ham) => h.metinler.find((m) => m.grup === 2 && sorular(m).some((q) => q.cevapTuru === 'sozcuk'))!;
const sozcukSorusu = (h: Ham) => sorular(sozcukluMetin(h)).find((q) => q.cevapTuru === 'sozcuk')!;
const kurallar = (ham: unknown, yayin = false): KuralKodu[] =>
  turIceriginiDogrula(turIcerikDosyasiniAyristir(ham), { yayin }).hatalar.map((h) => h.kural);
const gorselKurallari = (ham: Ham) => metinGorselBaglariniDenetle(turIcerikDosyasiniAyristir(ham).metinler, dizinler).map((i) => i.kural);

/** 2.–5. grup resmî kümeleri (büyük harfler dahil) + son harfin büyüğü öğretilmemiş küme. */
const KUMELER: Set<string>[] = [resmiKume('m', true), resmiKume('m', false), resmiKume('z', true), resmiKume('ş', true), resmiKume('j', true)];
const TOHUMLAR = Array.from({ length: 12 }, (_, i) => i + 1);

let URETILEN: { soru: TurSecimSorusu; kume: Set<string> }[] = [];
beforeAll(async () => {
  await metinParcasiniYukle();
  await cumleParcasiniYukle();
  URETILEN = [];
  for (const kume of KUMELER)
    for (const zorluk of TUR_ZORLUKLARI)
      for (const tohum of TOHUMLAR) {
        try {
          URETILEN.push({ soru: turSoruUret('T-13', { havuz, kume, zorluk, tohum, metinler }) as TurSecimSorusu, kume });
        } catch (e) {
          if (!(e instanceof TurUretimHatasi)) throw e;
        }
      }
});

describe('E1 metin havuzu (Adım 80)', () => {
  it('şema ve doğrulayıcı: 0 hata; görsel cevap bağları 0 ihlal; teyit bekliyor (geliştirmede uyarı, yayında hata)', () => {
    const r = turIceriginiDogrula(dosya);
    expect(r.hatalar).toEqual([]);
    expect(metinGorselBaglariniDenetle(dosya.metinler, dizinler)).toEqual([]);
    expect(metinHam.teyit.durum).toBe('bekliyor');
    expect(dosya.metinler.every((m) => m.teyit === 'bekliyor')).toBe(true);
    expect(r.uyarilar.some((u) => u.kural === 'D-14' && u.oge === 'metinler')).toBe(true);
    expect(turIceriginiDogrula(dosya, { yayin: true }).hatalar.some((h) => h.kural === 'D-14' && h.oge === 'metinler')).toBe(true);
    expect(dosya.programSurumu).toBe(PROGRAM_SURUMU);
  });

  it('2.–5. grupta en az 6 metin; 1. grupta metin yok (D-08); 2–5 cümle, 1–2 soru', () => {
    const sayi = [1, 2, 3, 4, 5].map((g) => dosya.metinler.filter((m) => m.grup === g).length);
    expect(sayi[0]).toBe(0);
    for (const n of sayi.slice(1)) expect(n).toBeGreaterThanOrEqual(6);
    for (const m of dosya.metinler) {
      expect(m.cumleler.length).toBeGreaterThanOrEqual(2);
      expect(m.cumleler.length).toBeLessThanOrEqual(5);
      expect(m.sorular.length).toBeGreaterThanOrEqual(1);
      expect(m.sorular.length).toBeLessThanOrEqual(2);
    }
  });

  it('her metin kendi grubuna kadar öğretilmiş harflerden oluşur ve soru işareti 2. gruptan, ünlem yalnız 5. grupta', () => {
    for (const m of dosya.metinler) {
      const ogretilen = HARF_GRUPLARI.slice(0, m.grup).flat() as readonly string[];
      expect([...m.harfler].every((h) => ogretilen.includes(h)), m.id).toBe(true);
      if (m.cumleler.some((c) => c.endsWith('!'))) expect(m.grup, m.id).toBe(5);
      for (const q of m.sorular) expect(q.soru.endsWith('?')).toBe(true);
    }
    expect(dosya.metinler.some((m) => m.cumleler.some((c) => c.endsWith('!')))).toBe(true);
  });

  it('her soruda cevap metindedir: görsel cevap (resim) ve sözcük cevabı (sözcük kartı) birlikte bulunur', () => {
    const q = dosya.metinler.flatMap((m) => m.sorular);
    expect(q.some((x) => x.cevapTuru === 'gorsel')).toBe(true);
    expect(q.some((x) => x.cevapTuru === 'sozcuk')).toBe(true);
    for (const m of dosya.metinler)
      for (const x of m.sorular) {
        const cumle = m.cumleler[x.cumleNo - 1];
        if (x.cevapTuru === 'sozcuk') expect(cumleGovdeleri(cumle).includes(x.cevap.toLocaleLowerCase('tr-TR')), x.id).toBe(true);
      }
  });
});

describe('D-27 tuzakları — her kural kırmızı olmalı (öğretilmemiş harf içeren metin dahil)', () => {
  const TUZAKLAR: { ad: string; kural: KuralKodu; boz: (h: Ham) => void; gorsel?: boolean }[] = [
    { ad: 'öğretilmemiş harf (2. grup metnine "ö", "z")', kural: 'D-02', boz: (h) => ((ilk(h, 2).cumleler as string[])[1] = 'Elma özel.') },
    {
      ad: '1. grupta metin',
      kural: 'D-08',
      boz: (h) => {
        const m = ilk(h, 2);
        m.cumleler = ['Ana ata alır.', 'Anne ata alır.'];
        m.girisHarfi = 'l';
        m.grup = 1;
        m.harfler = 'anetl';
        m.ozelAdlar = [];
        m.sorular = [{ id: 'm2.01.q1', soru: 'Ata ne alır?', cevapTuru: 'sozcuk', cevap: 'ata', cumleNo: 1, celdiriciler: ['ana', 'tel', 'et'] }];
      },
    },
    { ad: 'giriş harfi etiketi yanlış', kural: 'D-27', boz: (h) => (ilk(h, 2).girisHarfi = 'k') },
    { ad: 'grup etiketi yanlış', kural: 'D-27', boz: (h) => (ilk(h, 3).grup = 2) },
    { ad: 'harfler etiketi yanlış', kural: 'D-27', boz: (h) => (ilk(h, 2).harfler = 'an') },
    { ad: 'cümle ortasında büyük harf', kural: 'D-10', boz: (h) => ((ilk(h, 2).cumleler as string[])[1] = 'Elma Tatlı.') },
    { ad: 'ünlem 2. grupta', kural: 'D-09', boz: (h) => ((ilk(h, 2).cumleler as string[])[1] = 'Elma tatlı!') },
    { ad: 'sıralı olmayan virgül', kural: 'D-09', boz: (h) => ((ilk(h, 2).cumleler as string[])[1] = 'Elma, tatlı.') },
    { ad: 'bitiş işareti yok', kural: 'D-09', boz: (h) => ((ilk(h, 2).cumleler as string[])[1] = 'Elma tatlı') },
    { ad: 'kısa çizgi', kural: 'D-09', boz: (h) => ((ilk(h, 2).cumleler as string[])[1] = 'Elma tat-lı.') },
    { ad: 'cümle 6 sözcük', kural: 'D-27', boz: (h) => ((ilk(h, 2).cumleler as string[])[1] = 'Elma tatlı ama mor ve ılık.') },
    { ad: 'soru cümlesi soru işaretiyle bitmiyor', kural: 'D-27', boz: (h) => (sorular(ilk(h, 2))[0].soru = 'Annem ne alır.') },
    { ad: 'öğretilmemiş harfli soru', kural: 'D-02', boz: (h) => (sorular(ilk(h, 2))[0].soru = 'Annem ne alır göz?') },
    { ad: 'özel ad metinde yok', kural: 'D-27', boz: (h) => (ilk(h, 2).ozelAdlar = ['Ali', 'Nil']) },
    { ad: 'cevap belirtilen cümlede yok (sözcük)', kural: 'D-27', boz: (h) => (sozcukSorusu(h).cumleNo = 2) },
    { ad: 'cumleNo metin dışında', kural: 'D-27', boz: (h) => (sozcukSorusu(h).cumleNo = 5) },
    { ad: 'soru cevabı söylüyor (sözcük)', kural: 'D-27', boz: (h) => (sozcukSorusu(h).soru = `Kim ${sozcukSorusu(h).cevap} alır?`) },
    { ad: 'yanlış seçenek metinde geçiyor', kural: 'D-27', boz: (h) => (sozcukSorusu(h).celdiriciler = [sozcukSorusu(h).cevap, 'Nil', 'Okan']) },
    { ad: 'yanlış seçenek öğretilmemiş harf', kural: 'D-27', boz: (h) => ((sozcukSorusu(h).celdiriciler as string[])[0] = 'Özlem') },
    { ad: 'yanlış seçenek cevapla aynı büyük/küçük biçimde değil', kural: 'D-27', boz: (h) => ((sozcukSorusu(h).celdiriciler as string[])[0] = 'ali') },
    { ad: 'yanlış seçenek 3\'ten az', kural: 'D-27', boz: (h) => (sozcukSorusu(h).celdiriciler = ['Ali', 'Nil']) },
    { ad: 'görsel cevapta yazılı yanlış seçenek', kural: 'D-27', boz: (h) => (sorular(ilk(h, 2))[0].celdiriciler = ['ot', 'at', 'et']) },
    { ad: 'kimlik tekil değil', kural: 'D-20', boz: (h) => (ilk(h, 3).id = ilk(h, 2).id as string) },
    { ad: 'görsel yok', kural: 'D-25', gorsel: true, boz: (h) => (sorular(ilk(h, 2))[0].cevap = 'yok-boyle-gorsel') },
    { ad: 'görsel sözcüğü cümlede yok', kural: 'D-25', gorsel: true, boz: (h) => (sorular(ilk(h, 2))[0].cevap = 'tren') },
    { ad: 'soru görselin sözcüğünü söylüyor', kural: 'D-25', gorsel: true, boz: (h) => (sorular(ilk(h, 2))[0].soru = 'Elma ne?') },
  ];
  for (const t of TUZAKLAR)
    it(`${t.kural}: ${t.ad}`, () => {
      const h = kopya();
      t.boz(h);
      let bulunan: KuralKodu[];
      try {
        bulunan = t.gorsel ? (gorselKurallari(h) as KuralKodu[]) : kurallar(h, true);
      } catch {
        bulunan = [];
      }
      expect(bulunan, `${t.ad}: ${JSON.stringify(bulunan)}`).toContain(t.kural);
    });

  it('şema: 1 cümlelik metin ve 3 soru reddedilir; tanımsız alan (renk) reddedilir', () => {
    const bir = kopya();
    (ilk(bir, 2).cumleler as string[]).length = 1;
    expect(() => turIcerikDosyasiniAyristir(bir)).toThrow();
    const uc = kopya();
    ilk(uc, 2).sorular = [...sorular(ilk(uc, 2)), ...sorular(ilk(uc, 2))];
    expect(() => turIcerikDosyasiniAyristir(uc)).toThrow();
    const renk = kopya();
    ilk(renk, 2).renk = 'kirmizi';
    expect(() => turIcerikDosyasiniAyristir(renk)).toThrow();
  });

  it('kural paylaşımı: aynı bozuk cümle cümle havuzunda ve metinde AYNI kuralı kırar (kopya kural yok)', () => {
    const cumleOrnegi = { id: 'c9.01', metin: 'Elma Tatlı.', girisHarfi: 'm', grup: 2, harfler: 'aeltım', tur: 'bildirme', noktalama: '.', teyit: 'bekliyor' };
    const d: TurIcerikDosyasi = turIcerikDosyasiniAyristir({ programSurumu: PROGRAM_SURUMU, cumleler: [cumleOrnegi] });
    // D-26 yalnız cümle havuzunun kendi etiketleridir (metin düzeyi karşılığı D-27); biçim kuralları ortaktır.
    const cumleKurallari = turIceriginiDogrula(d).hatalar.filter((h) => h.oge === 'c9.01' && h.kural !== 'D-26').map((h) => h.kural);
    const h = kopya();
    (ilk(h, 2).cumleler as string[])[1] = 'Elma Tatlı.';
    const metinKurallari = turIceriginiDogrula(turIcerikDosyasiniAyristir(h)).hatalar.filter((x) => x.oge === 'm2.01.c2').map((x) => x.kural);
    expect(cumleKurallari).toContain('D-10');
    expect(metinKurallari).toEqual(cumleKurallari);
  });
});

describe('metin havuzu ayrıştırıcısı ve süzgeç (çalışma anı)', () => {
  it('bütün öğeleri alır; bozuk öğe atlanır; biçim bozuksa hata', () => {
    expect(metinler).toHaveLength(dosya.metinler.length);
    const bozuk = kopya();
    (ilk(bozuk, 2).cumleler as string[])[0] = 'Elma 🍎 al.';
    (ilk(bozuk, 3).sorular as Record<string, unknown>[])[0].cevapTuru = 'resim';
    expect(metinHavuzunuAyristir(bozuk)).toHaveLength(dosya.metinler.length - 2);
    expect(() => metinHavuzunuAyristir({})).toThrow();
    expect(() => metinHavuzunuAyristir(null)).toThrow();
  });

  it('küme süzgeci: 1. grupta metin yok; son harfin büyüğü öğretilmeden o harfle başlayan metin gelmez; tam kümede hepsi', () => {
    expect(okunabilirMetinler(metinler, resmiKume('l', true))).toEqual([]);
    const g2 = okunabilirMetinler(metinler, resmiKume('m', true));
    expect(g2.length).toBeGreaterThanOrEqual(6);
    expect(g2.every((m) => m.grup === 2)).toBe(true);
    const kucukM = okunabilirMetinler(metinler, resmiKume('m', false));
    expect(kucukM.some((m) => m.cumleler.some((c) => /\bM/.test(c)))).toBe(false);
    expect(kucukM.length).toBeLessThan(g2.length);
    expect(okunabilirMetinler(metinler, resmiKume('j', true))).toHaveLength(metinler.length);
  });
});

describe('E3 T-13 Metni oku, soruyu cevapla', () => {
  it('kayıt: beceri "metin"; adres T-13 açar; katalogda; parça yüklenmeden ve 1. grupta/havuzsuz kurulmaz (D-08)', async () => {
    expect(TUR_SABLONLARI['T-13'].beceri).toBe('metin');
    expect(TUR_TUM_SABLON_KODLARI).toContain('T-13');
    expect(turAcilisEkrani('?ders=tur&etkinlik=T-13&zorluk=3&tohum=2')).toEqual({ ekran: 'etkinlik', sablon: 'T-13', zorluk: 3, tohum: 2 });
    expect(turAcilisEkrani('?ders=tur&ekran=metin')).toEqual({ ekran: 'metin' });
    const m = await metinParcasiniYukle();
    metinUreticileriniKaydet({});
    expect(() => turSoruUret('T-13', { havuz, kume: resmiKume('m', true), zorluk: 1, tohum: 1, metinler })).toThrow(TurUretimHatasi);
    metinUreticileriniKaydet(m.TUR_METIN_URETICILERI);
    expect(turSoruUret('T-13', { havuz, kume: resmiKume('m', true), zorluk: 1, tohum: 1, metinler }).sablon).toBe('T-13');
    expect(() => turSoruUret('T-13', { havuz, kume: resmiKume('l', true), zorluk: 1, tohum: 1, metinler })).toThrow(/okunabilir metin yok/);
    expect(() => turSoruUret('T-13', { havuz, kume: resmiKume('j', true), zorluk: 1, tohum: 1 })).toThrow(TurUretimHatasi);
  });

  it('her zorlukta her kümede kurulur; kart sayısı 2/3/3/4/4; determinizm', () => {
    for (const z of TUR_ZORLUKLARI) {
      const n = URETILEN.filter((u) => u.soru.zorluk === z).length;
      expect(n, `z${z}`).toBeGreaterThanOrEqual(KUMELER.length * TOHUMLAR.length * 0.9);
    }
    const kart = { 1: 2, 2: 3, 3: 3, 4: 4, 5: 4 } as const;
    for (const u of URETILEN) expect(u.soru.kartlar.length).toBe(kart[u.soru.zorluk]);
    const k = resmiKume('z', true);
    const a = turSoruUret('T-13', { havuz, kume: k, zorluk: 3, tohum: 7, metinler });
    expect(turSoruUret('T-13', { havuz, kume: k, zorluk: 3, tohum: 7, metinler })).toEqual(a);
    const farkli = new Set(TOHUMLAR.map((t) => turSoruUret('T-13', { havuz, kume: k, zorluk: 3, tohum: t, metinler }).itemId));
    expect(farkli.size).toBeGreaterThan(5);
  });

  it('şablon denetimi ve CI doğrulayıcısı: 0 ihlal (küme, D-11, D-12, D-15, D-21, D-23)', () => {
    for (const u of URETILEN) expect(turSoruIhlalleri(u.soru, u.kume, manifest, havuz), u.soru.itemId).toEqual([]);
    const etkinlikler = URETILEN.map((u) => turSoruEtkinligi(u.soru, manifest)).filter((e, i, l) => l.findIndex((x) => x.id === e.id) === i);
    const d: TurIcerikDosyasi = turIcerikDosyasiniAyristir({
      programSurumu: PROGRAM_SURUMU,
      sozcukler: (havuzHam as { sozcukler: TurIcerikDosyasi['sozcukler'] }).sozcukler,
      etkinlikler,
    });
    expect(turIceriginiDogrula(d).hatalar).toEqual([]);
  });

  it('cevap metindedir; yanlış seçenekler metinde ve soruda geçmez; yönerge ve soru sesi cevabı söylemez (D-12)', () => {
    for (const u of URETILEN) {
      const s = u.soru;
      expect(s.uyaran.tur).toBe('metin');
      if (s.uyaran.tur !== 'metin') continue;
      const gecen = new Set([...s.uyaran.cumleler, s.uyaran.soru].flatMap(cumleGovdeleri));
      const dogru = s.kartlar[s.dogru];
      // Doğru kartın sözcüğü cevabın cümlesindedir (hedefMetin).
      expect(s.uyaran.cumleler).toContain(s.hedefMetin);
      expect(cumleGovdeleri(s.hedefMetin).some((w) => w.startsWith(dogru.metin.toLocaleLowerCase('tr-TR')))).toBe(true);
      for (const [i, k] of s.kartlar.entries()) {
        if (i === s.dogru) continue;
        const w = k.metin.toLocaleLowerCase('tr-TR');
        expect([...gecen].some((g) => g.startsWith(w) || w.startsWith(g)), `${s.itemId}: ${k.metin}`).toBe(false);
      }
      expect(s.soruKlipleri).toEqual([]);
      expect(s.kind).toBe('secim');
      const yonerge = TUR_YONERGELERI.t13.toLocaleLowerCase('tr-TR').split(/[ .,]+/);
      expect(yonerge.some((w) => gecen.has(w))).toBe(false);
      expect(s.yonerge).toBe('tur.yonerge.t13');
    }
  });

  it('doğru cevaptan sonra cevabın cümle klibi (manifestte, metni cümleyle aynı) ve "Aferin!" istenir', () => {
    for (const u of URETILEN) {
      const s = u.soru;
      const no = s.uyaran.tur === 'metin' ? s.uyaran.cumleler.indexOf(s.hedefMetin) + 1 : 0;
      expect(no).toBeGreaterThan(0);
      expect(s.geriBildirim[0]).toBe('tur.geri.dogru');
      const klip = s.geriBildirim[1];
      expect(klip).toMatch(/^tur\.cumle\.m\d{3}s\d$/);
      expect(manifest.get(klip)).toBe(s.hedefMetin);
    }
  });

  it('kartlar sessizdir (D-11): resim ya da sözcük; tek ünsüz klibi yok', () => {
    for (const u of URETILEN) {
      const tur = new Set(u.soru.kartlar.map((k) => k.tur));
      expect(tur.size).toBe(1);
      expect(['gorsel', 'sozcuk']).toContain([...tur][0]);
    }
    expect(new Set(URETILEN.map((u) => u.soru.kartlar[0].tur)).size).toBe(2);
  });
});

describe('klip manifesti ve set/akış bağları (karşı parça)', () => {
  it('her metin cümlesinin klibi manifestte; klipler.json commitli ve durumu "eksik" (ses üretilmedi)', () => {
    const json = oku('ders-verisi/tur/ses/klipler.json') as { klipler: { anahtar: string; metin: string; durum: string }[] };
    const harita = new Map(json.klipler.map((k) => [k.anahtar, k]));
    for (const m of metinler)
      m.cumleler.forEach((c, i) => {
        const k = harita.get(metinCumleKlibi(m.id, i + 1));
        expect(k, `${m.id} cümle ${i + 1}`).toBeDefined();
        expect(k!.metin).toBe(c);
        expect(k!.durum).toBe('eksik');
      });
    expect(metinCumleKlibi('m2.01', 1)).toBe('tur.cumle.m201s1');
    expect(harita.get('tur.yonerge.t13')?.metin).toBe(TUR_YONERGELERI.t13);
  });

  it('set hazırla: zenginleştirme tarifinde T-13; 1. grupta yedek T-08; metin verisi yoksa yedek; yine 8 adım', async () => {
    const m = await metinParcasiniYukle();
    metinUreticileriniKaydet(m.TUR_METIN_URETICILERI);
    await cumleParcasiniYukle();
    const kur = (kume: Set<string>, ek: { metinler?: typeof metinler } = {}) =>
      turSetiKur({ havuz, kume, duzey: 'zengin', tohum: 3, hamleler, cumleler, ...ek });
    const g3 = kur(resmiKume('z', true), { metinler });
    expect(g3.adimlar).toHaveLength(SET_ADIM_SAYISI);
    expect(g3.adimlar.some((a) => a.sablon === 'T-13')).toBe(true);
    const g1 = kur(resmiKume('l', true), { metinler });
    expect(g1.adimlar.some((a) => a.sablon === 'T-13')).toBe(false);
    expect(g1.adimlar.some((a) => a.sablon === 'T-08' && a.zorluk === 4)).toBe(true);
    const yok = kur(resmiKume('z', true));
    expect(yok.adimlar.some((a) => a.sablon === 'T-13')).toBe(false);
    // Aynı tohum aynı set (eve link: öğretmen ve ev cihazı aynı veriyle aynı seti kurar).
    expect(kur(resmiKume('z', true), { metinler })).toEqual(g3);
  });

  it('günün akışı: 6. basamaktan "Metni oku" ekranı, 7. basamaktan T-13 açılır', () => {
    const b6 = AKIS_BASAMAKLARI.find((b) => b.kod === '6')!;
    const b7 = AKIS_BASAMAKLARI.find((b) => b.kod === '7')!;
    expect(b6.hedef.tur === 'etkinlik' && b6.hedef.metin === true).toBe(true);
    expect(b7.hedef.tur === 'etkinlik' && b7.hedef.sablonlar.includes('T-13')).toBe(true);
  });

  it('soru üretimi tipli: uyaran satırları metnin cümleleri, soru yazılı', () => {
    const s: TurSoru = turSoruUret('T-13', { havuz, kume: resmiKume('m', true), zorluk: 2, tohum: 4, metinler });
    expect(s.uyaran.tur === 'metin' && s.uyaran.cumleler.length >= 2 && s.uyaran.soru.endsWith('?')).toBe(true);
  });
});
