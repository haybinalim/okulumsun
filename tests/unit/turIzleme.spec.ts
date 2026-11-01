/**
 * Parmakla izleme (Okuma Yazma M-4, Adım 70; K-6: hoşgörülü, puansız, P2): değerlendirme eşikleri, yön, kapalı hamle,
 * nokta hamlesi, üç deneme kuralı; ekranın hiçbir şey saklamadığı ve puan/süre tutmadığı (kaynak taraması).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { TurHamleDosyasi } from '../../src/content/schema/turHamle';
import {
  cizgiyeUzaklik,
  hamleyiDegerlendir,
  IZLEME_BASI,
  IZLEME_DENEME,
  IZLEME_ESIKLERI,
  izlemeIlerle,
} from '../../src/ui/tur/izleme';
import type { Nokta } from '../../src/ui/tur/hamleCizim';
import { turAcilisEkrani } from '../../src/ui/tur/turEkrani';

const veri = JSON.parse(readFileSync('ders-verisi/tur/hamleler.json', 'utf8')) as TurHamleDosyasi;
const glif = (anahtar: string) => veri.glifler.find((g) => `${g.bicim}:${g.glif}` === anahtar)!;
const tablet = IZLEME_ESIKLERI.tablet;
const kaydir = (n: readonly Nokta[], dx: number, dy: number): Nokta[] => n.map(([x, y]) => [x + dx, y + dy]);

describe('izleme değerlendirmesi (M-4)', () => {
  it('eşikler: tablet 12/10 birim, tahta %50 geniş', () => {
    expect(tablet).toEqual({ baslangic: 12, sapma: 10 });
    expect(IZLEME_ESIKLERI.board).toEqual({ baslangic: 18, sapma: 15 });
    expect(IZLEME_DENEME).toBe(3);
  });

  it('bütün 68 glifin bütün hamleleri kendi orta çizgisiyle ve hoşgörü içinde kaydırılınca geçer', () => {
    for (const g of veri.glifler)
      for (const h of g.hamleler) {
        expect(hamleyiDegerlendir(h.noktalar, h.noktalar, tablet).gecti, `${g.bicim}:${g.glif} ${h.sira}`).toBe(true);
        expect(hamleyiDegerlendir(kaydir(h.noktalar, 5, -4), h.noktalar, tablet).gecti, `${g.glif} ${h.sira} kayık`).toBe(true);
      }
  });

  it('ters yön geçmez (açık hamle), başlangıç uzaksa geçmez, sapma büyükse geçmez', () => {
    const l = glif('kucuk:l').hamleler[0].noktalar;
    expect(hamleyiDegerlendir([...l].reverse(), l, tablet)).toMatchObject({ gecti: false, neden: 'baslangic' });
    // Başlangıç doğru ama yön ters: başlangıçtan geriye çizgi.
    const geri: Nokta[] = [l[0], [l[0][0], l[0][1] - 15]];
    expect(hamleyiDegerlendir(geri, l, tablet).gecti).toBe(false);
    expect(hamleyiDegerlendir(kaydir(l, 14, 0), l, tablet).neden).toBe('baslangic');
    expect(hamleyiDegerlendir(kaydir(l, 14, 0), l, IZLEME_ESIKLERI.board).gecti).toBe(true); // tahta %50 geniş
    const zikzak = l.map(([x, y], i): Nokta => [x + (i % 2 ? 14 : -14), y]);
    zikzak[0] = l[0];
    expect(hamleyiDegerlendir(zikzak, l, tablet).neden).toBe('sapma');
  });

  it('kısa fiske (yarı uzunluktan az) geçmez; nokta hamlesinde uzunluk ve yön aranmaz', () => {
    const l = glif('kucuk:l').hamleler[0].noktalar;
    expect(hamleyiDegerlendir(l.slice(0, 2), l, tablet).gecti).toBe(false);
    const nokta = glif('kucuk:i').hamleler.find((h) => h.tip === 'nokta')!.noktalar;
    expect(hamleyiDegerlendir([nokta[0]], nokta, tablet).gecti).toBe(true);
  });

  it('kapalı hamle (o): saat tersine geçer, saat yönüne (ters) geçmez', () => {
    const o = glif('kucuk:o').hamleler[0].noktalar;
    expect(hamleyiDegerlendir(o, o, tablet).gecti).toBe(true);
    const ters: Nokta[] = [o[0], ...[...o.slice(1)].reverse()];
    expect(hamleyiDegerlendir(ters, o, tablet)).toMatchObject({ gecti: false, neden: 'yon' });
  });

  it('cizgiyeUzaklik: parça üstü 0, dikey uzaklık', () => {
    expect(cizgiyeUzaklik([5, 5], [[0, 0], [10, 10]])).toBeCloseTo(0);
    expect(cizgiyeUzaklik([0, 10], [[0, 0], [10, 0]])).toBeCloseTo(10);
  });

  it('üç deneme: geçmeyen iki denemede aynı hamle, üçüncüde gösterilip geçilir; puan yok', () => {
    let d = IZLEME_BASI;
    d = izlemeIlerle(d, false, 2);
    d = izlemeIlerle(d, false, 2);
    expect(d).toEqual({ hamle: 0, deneme: 2, biten: [] });
    d = izlemeIlerle(d, false, 2);
    expect(d).toEqual({ hamle: 1, deneme: 0, biten: ['gosterildi'] });
    d = izlemeIlerle(d, true, 2);
    expect(d).toEqual({ hamle: 2, deneme: 0, biten: ['gosterildi', 'cizdi'] });
    expect(izlemeIlerle(d, true, 2)).toBe(d);
    expect(Object.keys(d).sort()).toEqual(['biten', 'deneme', 'hamle']);
  });

  it('açılış adresi ?ders=tur&izle=kucuk:a → izleme ekranı', () => {
    expect(turAcilisEkrani('?ders=tur&izle=kucuk:a')).toEqual({ ekran: 'izleme', anahtar: 'kucuk:a', sekme: 0 });
    expect(turAcilisEkrani('?ders=tur&izle=x')).toEqual({ ekran: 'giris' });
  });

  it('izleme kaynağı: depolama, ağ, zaman ölçümü, puan ve ses yok', () => {
    for (const dosya of ['src/ui/tur/izleme.ts', 'src/ui/tur/IzlemeEkrani.tsx']) {
      const k = readFileSync(dosya, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
      for (const yasak of [/localStorage|sessionStorage|indexedDB|Dexie|fetch\(|XMLHttpRequest/, /Date\.now|performance\.now|new Date/, /puan|yildiz|skor|score/i, /speak|Audio|klip/])
        expect(yasak.test(k), `${dosya}: ${yasak}`).toBe(false);
    }
  });
});
