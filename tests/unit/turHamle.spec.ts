/**
 * Adım 63 — Türkçe yazılış hamle verisi (Okuma Yazma planı §2.4.9). `ders-verisi/tur/hamleler.json`:
 * şema, üreticiyle aynılık, teyit tablosu sayıları (47/62/13), yön kuralları, işaret sırası, i/İ–ı/I ayrımı,
 * kuyruklar ve teyit kapısı. Her denetim kuralı ayrıca bozulmuş bir kopyada kırmızıya döner (tuzak).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { hamleVerisiJson, hamleVerisiUret } from '../../scripts/tur/hamle-verisi';
import { hamleDosyasiniAyristir, type TurHamleDosyasi, type TurHamleGlifi } from '../../src/content/schema/turHamle';
import {
  baslangicAcisi,
  HAMLE_SAYISI_TABLOSU,
  HAMLE_TOPLAMLARI,
  hamleVerisiniDenetle,
  KUYRUKLU_HARFLER,
  teyitBekleyenler,
  toplamDonus,
} from '../../src/content/dersler/tur/hamleTablosu';
import { ALFABE, trBuyuk } from '../../src/content/dersler/tur/alfabe';

const HAM = readFileSync('ders-verisi/tur/hamleler.json', 'utf8');
const VERI = hamleDosyasiniAyristir(JSON.parse(HAM));
const kopya = (): TurHamleDosyasi => structuredClone(VERI);
const glif = (d: TurHamleDosyasi, bicim: string, g: string): TurHamleGlifi =>
  d.glifler.find((x) => x.bicim === bicim && x.glif === g)!;

describe('hamleler.json', () => {
  it('şemaya uyar ve üreticinin çıktısıyla bayt bayt aynı (elle düzenlenmez)', () => {
    expect(HAM).toBe(hamleVerisiJson(hamleVerisiUret()));
  });

  it('68 glif: 29 küçük, 29 büyük (tr-TR eşi), 10 rakam', () => {
    const say = (b: string) => VERI.glifler.filter((g) => g.bicim === b).length;
    expect([say('kucuk'), say('buyuk'), say('rakam')]).toEqual([29, 29, 10]);
    expect(
      VERI.glifler
        .filter((g) => g.bicim === 'kucuk')
        .map((g) => g.glif)
        .sort(),
    ).toEqual([...ALFABE].sort());
    expect(
      VERI.glifler
        .filter((g) => g.bicim === 'buyuk')
        .map((g) => g.glif)
        .sort(),
    ).toEqual(ALFABE.map(trBuyuk).sort());
  });

  it('hamle toplamları teyit tablosuyla aynı: 47 / 62 / 13', () => {
    for (const b of ['kucuk', 'buyuk', 'rakam'] as const) {
      const toplam = VERI.glifler.filter((g) => g.bicim === b).reduce((t, g) => t + g.hamleler.length, 0);
      expect(toplam, b).toBe(HAMLE_TOPLAMLARI[b]);
      expect(
        Object.values(HAMLE_SAYISI_TABLOSU[b]).reduce((t, n) => t + n, 0),
        `${b} tablosu`,
      ).toBe(HAMLE_TOPLAMLARI[b]);
    }
    expect(HAMLE_TOPLAMLARI).toEqual({ kucuk: 47, buyuk: 62, rakam: 13 });
  });

  it('her glifin hamle sayısı tabloyla aynı, hamleler 1..n sıralı', () => {
    for (const g of VERI.glifler) {
      expect(g.hamleler.length, `${g.bicim}:${g.glif}`).toBe(HAMLE_SAYISI_TABLOSU[g.bicim][g.glif]);
      expect(g.hamleSayisi).toBe(g.hamleler.length);
      expect(g.hamleler.map((h) => h.sira)).toEqual(g.hamleler.map((_, i) => i + 1));
    }
  });

  it('denetim temiz: yön, işaret sırası, kuyruk, sınırlar', () => {
    expect(hamleVerisiniDenetle(VERI)).toEqual([]);
  });

  it('dikey hamleler yukarıdan aşağı, yatay hamleler soldan sağa', () => {
    for (const g of VERI.glifler)
      for (const h of g.hamleler) {
        const [a, b] = [h.noktalar[0], h.noktalar[h.noktalar.length - 1]];
        if (h.tip === 'dik') expect(b[1], `${g.glif}#${h.sira}`).toBeGreaterThan(a[1]);
        if (h.tip === 'yatay') expect(b[0], `${g.glif}#${h.sira}`).toBeGreaterThan(a[0]);
      }
  });

  it('daireler saat 2 hizasından saatin tersine tam döner (a, o, ö, d, g, ğ, O, Ö, 0)', () => {
    const daireler = VERI.glifler.flatMap((g) => g.hamleler.filter((h) => h.tip === 'daire').map((h) => ({ g, h })));
    expect(daireler.map(({ g }) => g.glif).sort()).toEqual(['0', 'O', 'a', 'd', 'g', 'o', 'Ö', 'ö', 'ğ'].sort());
    for (const { g, h } of daireler) {
      expect(toplamDonus(h.noktalar), g.glif).toBeGreaterThan(300);
      const aci = baslangicAcisi(h.noktalar);
      expect(aci, g.glif).toBeGreaterThanOrEqual(10);
      expect(aci, g.glif).toBeLessThanOrEqual(70);
    }
  });

  it('noktalar, çengeller ve ğ yayı gövdeden sonra (son hamleler)', () => {
    const isaretli = { i: 1, j: 1, ü: 2, ö: 2, ç: 1, ş: 1, ğ: 1, İ: 1, Ü: 2, Ö: 2, Ç: 1, Ş: 1, Ğ: 1 } as Record<
      string,
      number
    >;
    for (const g of VERI.glifler) {
      const tipler = g.hamleler.map((h) => h.tip);
      const isaret = tipler.filter((t) => t === 'nokta' || t === 'cengel' || t === 'kisaYay').length;
      expect(isaret, `${g.bicim}:${g.glif}`).toBe(g.bicim === 'rakam' ? 0 : (isaretli[g.glif] ?? 0));
      expect(
        tipler.slice(tipler.length - isaret).every((t) => t === 'nokta' || t === 'cengel' || t === 'kisaYay'),
      ).toBe(true);
    }
  });

  it('i/İ noktalı, ı/I noktasız; dört ayrı glif', () => {
    expect(glif(VERI, 'kucuk', 'i').hamleler.map((h) => h.tip)).toEqual(['dik', 'nokta']);
    expect(glif(VERI, 'buyuk', 'İ').hamleler.map((h) => h.tip)).toEqual(['dik', 'nokta']);
    expect(glif(VERI, 'kucuk', 'ı').hamleler.map((h) => h.tip)).toEqual(['dik']);
    expect(glif(VERI, 'buyuk', 'I').hamleler.map((h) => h.tip)).toEqual(['dik']);
    expect(trBuyuk('i')).toBe('İ');
    expect(trBuyuk('ı')).toBe('I');
    // İ'nin noktası üst çizginin üstünde, i'ninki üst bölgede.
    expect(glif(VERI, 'buyuk', 'İ').hamleler[1].noktalar[0][1]).toBeLessThan(20);
    expect(glif(VERI, 'kucuk', 'i').hamleler[1].noktalar[0][1]).toBeGreaterThan(20);
  });

  it('kuyruklu harfler (g, ğ, j, p, y) tabanın altına dengeli taşar; diğerleri tabanda biter', () => {
    for (const g of VERI.glifler.filter((x) => x.bicim === 'kucuk')) {
      const enAlt = Math.max(
        ...g.hamleler.filter((h) => h.tip !== 'cengel').flatMap((h) => h.noktalar.map((p) => p[1])),
      );
      if (KUYRUKLU_HARFLER.has(g.glif)) {
        expect(enAlt, g.glif).toBeGreaterThanOrEqual(88);
        expect(enAlt, g.glif).toBeLessThanOrEqual(100);
      } else expect(enAlt, g.glif).toBeLessThanOrEqual(80.5);
    }
  });

  it('geri dönüşlü harfler (n, m, r, h, u, y, U) tek hamle ve işaretli', () => {
    for (const [b, g] of [
      ['kucuk', 'n'],
      ['kucuk', 'm'],
      ['kucuk', 'r'],
      ['kucuk', 'h'],
      ['kucuk', 'u'],
      ['kucuk', 'y'],
      ['buyuk', 'U'],
    ]) {
      const x = glif(VERI, b, g);
      expect(x.hamleler.length, g).toBe(1);
      expect(x.hamleler[0].geriDonus, g).toBe(true);
    }
  });

  it('teyit bekliyor: 68 glifin hepsi; yayın kapısı bunları listeler', () => {
    expect(VERI.glifler.every((g) => g.teyit.durum === 'bekliyor')).toBe(true);
    expect(teyitBekleyenler(VERI)).toHaveLength(68);
    const d = kopya();
    for (const g of d.glifler) g.teyit = { durum: 'teyitli', ogretmen: ['O1', 'O2'], tarih: '2026-11-15' };
    expect(teyitBekleyenler(d)).toEqual([]);
    expect(() =>
      hamleDosyasiniAyristir({
        ...d,
        glifler: d.glifler.map((g) => ({ ...g, teyit: { durum: 'teyitli', ogretmen: ['O1'], tarih: '2026-11-15' } })),
      }),
    ).toThrow(/ogretmen/);
  });

  it('font dosyası yok: Kilavuz ve KesikCizgi depoda ve pakette değil', () => {
    const yasak = /kilavuz|kesikcizgi/i;
    const tara = (kok: string): string[] =>
      readdirSync(kok).flatMap((ad) => {
        const yol = path.join(kok, ad);
        if (statSync(yol).isDirectory()) return tara(yol);
        return /\.(otf|ttf|woff2?)$/i.test(ad) && yasak.test(ad) ? [yol] : [];
      });
    expect([...tara('public'), ...tara('ders-verisi')]).toEqual([]);
  });
});

describe('denetim tuzakları (bozulmuş kopya kırmızı)', () => {
  const ihlalVar = (d: TurHamleDosyasi, desen: RegExp) =>
    expect(
      hamleVerisiniDenetle(d)
        .map((i) => `${i.oge} ${i.mesaj}`)
        .join('\n'),
    ).toMatch(desen);

  it('hamle sayısı tablodan farklı', () => {
    const d = kopya();
    glif(d, 'kucuk', 'a').hamleler.pop();
    ihlalVar(d, /kucuk:a hamle sayısı 1/);
  });
  it('dikey hamle aşağıdan yukarı', () => {
    const d = kopya();
    glif(d, 'buyuk', 'T').hamleler[1].noktalar.reverse();
    ihlalVar(d, /buyuk:T#2 .*yukari/);
  });
  it('yatay hamle sağdan sola', () => {
    const d = kopya();
    glif(d, 'buyuk', 'E').hamleler[2].noktalar.reverse();
    ihlalVar(d, /buyuk:E#3 .*sola/);
  });
  it('daire saat yönünde', () => {
    const d = kopya();
    glif(d, 'kucuk', 'o').hamleler[0].noktalar.reverse();
    ihlalVar(d, /kucuk:o#1 bildirilen yön saat-tersi, geometri saat-yonu/);
  });
  it('nokta gövdeden önce', () => {
    const d = kopya();
    const i = glif(d, 'kucuk', 'i');
    i.hamleler.reverse();
    i.hamleler.forEach((h, k) => (h.sira = k + 1));
    ihlalVar(d, /kucuk:i nokta\/çengel\/kısa yay gövde hamlelerinden sonra/);
  });
  it('ı noktalı yapılırsa', () => {
    const d = kopya();
    const ı = glif(d, 'kucuk', 'ı');
    ı.hamleler.push({ ...glif(d, 'kucuk', 'i').hamleler[1], sira: 2 });
    ı.hamleSayisi = 2;
    ihlalVar(d, /kucuk:ı ı noktasız olmalı/);
  });
  it('kuyruk taşmazsa', () => {
    const d = kopya();
    for (const h of glif(d, 'kucuk', 'p').hamleler) h.noktalar = h.noktalar.map(([x, y]) => [x, Math.min(y, 80)]);
    ihlalVar(d, /kucuk:p kuyruk/);
  });
  it('sıra numarası atlanırsa', () => {
    const d = kopya();
    glif(d, 'buyuk', 'A').hamleler[2].sira = 4;
    ihlalVar(d, /buyuk:A#4 sıra 4 ≠ 3/);
  });
});
