/**
 * Adım 81, E4 — kâğıttan dijitale: set hazırla kâğıtlarının alt bilgisinde ve basılı veli kartında aynı setin eve
 * bağlantısı karekod + kısa bağlantı olarak durur. Karekod ve bağlantı Adım 71'in tek kaynağından (`turEveLink`,
 * `qrMatrisi`); kalibrasyon karesi ve sayfa düzeni bozulmaz; üretilemezse görünür uyarı.
 */
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { hamleDosyasiniAyristir } from '../../src/content/schema/turHamle';
import { kumeCoz, kumeKodla, resmiKume } from '../../src/content/dersler/tur/ogretilenKume';
import { setKoduCoz } from '../../src/content/dersler/tur/turSet';
import { qrMatrisi, qrSvgYolu } from '../../src/ogretmen/qrMatrisi';
import { eveKarekodu, kisaBaglanti } from '../../src/ui/tur/kagit/eveKarekodu';
import { TurKagitSayfasi } from '../../src/ui/tur/kagit/TurKagitSayfasi';
import {
  A4,
  EVE_KAREKOD_MM,
  ICERIK,
  KISA_GENISLIK_MM,
  KISA_X,
  kisaMetinSigdirma,
  KALIBRASYON_MM,
  sayfaTasmasi,
  turKagitKodu,
  turKagitSayfalari,
  type TurKagitIstegi,
} from '../../src/ui/tur/kagit/turKagidi';
import { turAcilisEkrani } from '../../src/ui/tur/turEkraniDurumu';
import { turEveLink } from '../../src/ui/tur/turEveLink';

const VERI = hamleDosyasiniAyristir(JSON.parse(readFileSync('ders-verisi/tur/hamleler.json', 'utf8')));
const KUME = resmiKume('o', false);
const LINK = turEveLink('https://okulumsun-tc.vercel.app/', 'sinif', 5, KUME);

function isaretle(istek: TurKagitIstegi, eve?: ReturnType<typeof eveKarekodu>): string {
  const [{ sayfa, glif, glifler }] = turKagitSayfalari(istek, VERI.glifler);
  return renderToStaticMarkup(createElement(TurKagitSayfasi, { sayfa, glif, glifler, eve }));
}

describe('eve karekodu üreticisi', () => {
  it('Adım 71 ile tek kaynak: aynı bağlantı için `qrSvgYolu(qrMatrisi(link))` ile birebir aynı yol', () => {
    const k = eveKarekodu(LINK);
    expect(k.durum).toBe('hazir');
    if (k.durum !== 'hazir') return;
    expect(k.baglanti).toBe(LINK);
    expect({ yol: k.yol, boyut: k.boyut }).toEqual(qrSvgYolu(qrMatrisi(LINK)));
    expect(k.kisa).toBe(kisaBaglanti(LINK));
    expect(k.kisa).not.toMatch(/^https?:/);
  });

  it('karşı parça: karekodun taşıdığı bağlantı evde aynı seti ve aynı kümeyi açar; ad/sınıf/cevap yok', () => {
    const k = eveKarekodu(LINK);
    if (k.durum !== 'hazir') throw new Error('karekod üretilemedi');
    const u = new URL(k.baglanti);
    expect([...u.searchParams.keys()].sort()).toEqual(['ders', 'ev', 'tur']);
    // Evde açılış (veli/çocuk cihazı): `?ders=tur&ev=…` ev açılışıdır; kodlar aynı set ve kümeye çözülür.
    const acilis = turAcilisEkrani(u.search);
    expect(acilis).toEqual({ ekran: 'ev', kod: u.searchParams.get('ev') });
    expect(setKoduCoz(u.searchParams.get('ev'))).toEqual({ duzey: 'sinif', tohum: 5 });
    expect(kumeCoz(u.searchParams.get('tur')!)).toEqual(KUME);
    expect(u.searchParams.get('tur')).toBe(kumeKodla(KUME));
  });

  it('sessiz hata yok: çok uzun bağlantıda karekod üretilemez ve sonuç `hata` olur', () => {
    const k = eveKarekodu(`https://okulumsun-tc.vercel.app/?x=${'a'.repeat(4000)}`);
    expect(k.durum).toBe('hata');
    if (k.durum === 'hata') expect(k.neden.length).toBeGreaterThan(0);
  });
});

describe('kâğıt alt bilgisi', () => {
  const KAGITLAR: readonly (readonly [string, TurKagitIstegi])[] = [
    ['dikte', { tur: 'dikte' }],
    ['harf', { tur: 'harf', bicim: 'kucuk', glif: 'o' }],
  ];

  it.each(KAGITLAR)('%s kâğıdı: karekod aynı bağlantıdan, kısa bağlantı yazılı, kâğıt kodu değişmedi', (_ad, i) => {
    const k = eveKarekodu(LINK);
    if (k.durum !== 'hazir') throw new Error('karekod üretilemedi');
    const html = isaretle(i, k);
    expect(html).toContain('data-eve-karekod="hazir"');
    expect(html).toContain(`data-eve-baglanti="${LINK.replaceAll('&', '&amp;')}"`);
    expect(html).toContain(k.yol);
    expect(html).toContain(k.kisa.replaceAll('&', '&amp;'));
    expect(html).toContain(`data-tur-kagit="${turKagitKodu(i)}"`);
    // Siyah beyaz: karekod yalnız #000 / #fff; renk yok.
    expect(html).not.toMatch(/(fill|stroke)="#(?!000|fff|555)[0-9a-fA-F]{3,6}"/);
  });

  it('karekod yokken alt bilgi eskisiyle birebir aynı (yalnız bayraklı parametre eklendi)', () => {
    const i: TurKagitIstegi = { tur: 'dikte' };
    expect(isaretle(i)).toMatch(/<text x="198" [^>]*data-kagit-kodu/); // kâğıt kodu eski yerinde (sağ kenar)
    expect(isaretle(i)).not.toContain('data-eve-karekod');
  });

  it('kalibrasyon karesi 10 × 10 mm ve yerinde; karekod içerik alanının dışında, sayfa içinde, çakışmasız', () => {
    const k = eveKarekodu(LINK);
    if (k.durum !== 'hazir') throw new Error('karekod üretilemedi');
    for (const [, i] of KAGITLAR) {
      const aynen = isaretle(i);
      const eveli = isaretle(i, k);
      const kare = /<rect[^>]*data-kalibrasyon=""[^>]*>/u;
      expect(eveli.match(kare)![0]).toBe(aynen.match(kare)![0]);
      expect(eveli.match(kare)![0]).toContain(`width="${KALIBRASYON_MM}"`);
      // Sayfanın içerik düzeni (satırlar, örnek) bayt bayt aynı: yalnız alt bilgi grubu değişir.
      const govde = (h: string) => h.slice(0, h.indexOf('<g data-alt-bilgi'));
      expect(govde(eveli)).toBe(govde(aynen));
      const [{ sayfa }] = turKagitSayfalari(i, VERI.glifler);
      expect(sayfaTasmasi(sayfa)).toEqual([]);
    }
    const kx = A4.en - A4.kenar - EVE_KAREKOD_MM;
    const html = isaretle({ tur: 'dikte' }, k);
    const m = /<svg x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/u.exec(html)!;
    const [x, y, w, h] = m.slice(1).map(Number);
    expect(x).toBe(kx);
    expect(x + w).toBeLessThanOrEqual(A4.en - A4.kenar);
    expect(y).toBeGreaterThanOrEqual(ICERIK.y + ICERIK.boy); // içerik alanına girmez
    expect(y + h).toBeLessThanOrEqual(A4.boy - 5); // yazıcı payı
    // Kalibrasyon karesi (x 12–22) ve karekod (x ≥ 178) yatayda ayrık.
    expect(ICERIK.x + KALIBRASYON_MM).toBeLessThan(x);
    // Modül ≥ 0,4 mm: sürüm ≤ 5 (41 modül) için.
    expect(w / k.boyut).toBeGreaterThanOrEqual(0.4);
  });

  it('karekod üretilemediyse görünür uyarı yazılır; boş kutu çizilmez', () => {
    const hata = eveKarekodu(`https://okulumsun-tc.vercel.app/?x=${'a'.repeat(4000)}`);
    const html = isaretle({ tur: 'dikte' }, hata);
    expect(html).toContain('data-eve-karekod="hata"');
    expect(html).toContain('Karekod üretilemedi');
    expect(html).not.toContain('data-eve-karekod="hazir"');
    expect(html).not.toContain('<path d="M');
  });

  it('sayfa yalnız siyah/gri çizer; kalibrasyon notu hâlâ var', () => {
    const k = eveKarekodu(LINK);
    if (k.durum !== 'hazir') throw new Error('karekod üretilemedi');
    expect(isaretle({ tur: 'dikte' }, k)).toContain('Gerçek boyut (%100) yazdırın; kare 1 cm olmalı.');
  });
});

describe('kısa bağlantı karekodla çakışmaz', () => {
  const EN_UZUN = turEveLink('https://okulumsun-tc.vercel.app/', 'zengin', 999, resmiKume('z', true));

  it('alan karekodun solunda biter (kısa bağlantı + sağdaki karekod arası pay var)', () => {
    expect(KISA_X + KISA_GENISLIK_MM).toBeLessThanOrEqual(A4.en - A4.kenar - EVE_KAREKOD_MM - 2);
    expect(KISA_GENISLIK_MM).toBeGreaterThan(80);
  });

  it('en uzun küme koduyla bile yazı alana sığar: ya doğal sığar ya textLength alanla sınırlanır', () => {
    const k = eveKarekodu(EN_UZUN);
    if (k.durum !== 'hazir') throw new Error('karekod üretilemedi');
    const g = kisaMetinSigdirma(k.kisa);
    if (g.textLength !== undefined) expect(g.textLength).toBeLessThanOrEqual(KISA_GENISLIK_MM);
    else expect([...k.kisa].length * 2.6 * 0.62).toBeLessThanOrEqual(KISA_GENISLIK_MM);
    // Çok uzun bir alan adı (okul sunucusu) için de sıkıştırma devreye girer ve sınırı aşmaz.
    const uzun = kisaMetinSigdirma(`${'a'.repeat(200)}/?ders=tur`);
    expect(uzun.textLength).toBe(KISA_GENISLIK_MM);
    // Kısa bağlantıda doğal görünüm (sıkıştırma yok).
    expect(kisaMetinSigdirma('okulumsun-tc.vercel.app/?ders=tur&ev=s1&tur=1z')).toEqual({});
  });

  it('sayfada kısa bağlantı satırı bu sınırla çizilir', () => {
    const k = eveKarekodu(`https://${'a'.repeat(200)}.test/?ders=tur&ev=s1&tur=1z`);
    if (k.durum !== 'hazir') throw new Error('karekod üretilemedi');
    expect(isaretle({ tur: 'dikte' }, k)).toContain(`textLength="${KISA_GENISLIK_MM}"`);
  });
});
