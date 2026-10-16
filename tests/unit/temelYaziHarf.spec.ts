/**
 * KG-96: çocuğa dönük metnin harfleri MEB TYMM 2024 TemelYazi (dik temel); öğretmen/veli yüzeyleri Andika.
 * Font dosyası `scripts/rakam-glif-uret.py` ile üretilir; burada kapsam ve yüzey kararı denetlenir.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FONT_YIGINI } from '../../src/design/tokens';
import { YETISKIN_EKRANLARI, yaziYuzeyi } from '../../src/design/yaziYuzeyi';

const css = readFileSync('src/index.css', 'utf8');

/** `@font-face { font-family: 'TemelYazi'; … }` bloğunun unicode-range'i → kod noktası kümesi. */
function temelYaziKapsami(): Set<number> {
  const blok = /@font-face\s*\{[^}]*font-family: 'TemelYazi';[^}]*\}/.exec(css)?.[0] ?? '';
  const aralik = /unicode-range:([^;]+);/.exec(blok)?.[1] ?? '';
  const kume = new Set<number>();
  for (const p of aralik.split(',').map((x) => x.trim().replace('U+', ''))) {
    const [a, b] = p.split('-').map((h) => parseInt(h, 16));
    for (let c = a; c <= (b ?? a); c++) kume.add(c);
  }
  return kume;
}

describe('TemelYazi harfleri (KG-96)', () => {
  it('harf dosyası var, tek dosya (Regular dağıtılmaz), boyutu sınırlı', () => {
    expect(existsSync('public/fonts/TemelYazi-Harf.woff2')).toBe(true);
    expect(statSync('public/fonts/TemelYazi-Harf.woff2').size).toBeLessThan(25_000);
    const temelYazi = readdirSync('public/fonts').filter((d) => d.startsWith('TemelYazi'));
    expect(temelYazi.sort()).toEqual(['TemelYazi-Harf.woff2', 'TemelYazi-Rakam.woff2']);
  });

  it('unicode-range Türkçe alfabenin tamamını, rakamları, temel noktalamayı, ₺ ve % işaretini kapsar', () => {
    const kapsam = temelYaziKapsami();
    const gerekli = 'abcçdefgğhıijklmnoöprsştuüvyzABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZâîûÂÎÛqwxQWX0123456789.,;:!?\'"()-+=<>%₺ ';
    for (const ch of gerekli) expect(kapsam.has(ch.codePointAt(0)!), `kapsamda yok: ${ch}`).toBe(true);
    expect(kapsam.has(0x2212)).toBe(true); // eksi
    // Fontta olmayanlar Andika'ya düşmeli (range dışı): [ ] { } # $ – — … ·
    for (const ch of '[]{}#$–—…·') expect(kapsam.has(ch.codePointAt(0)!), `kapsamda olmamalı: ${ch}`).toBe(false);
  });

  it('çocuk yığını TemelYazi ile başlar; yetişkin yığını Andika harfleri', () => {
    expect(FONT_YIGINI.startsWith("'TemelYazi', 'TemelYaziRakam', 'Andika'")).toBe(true);
    expect(css).toMatch(/\[data-yazi='yetiskin'\],\s*\[data-yetiskin\]\s*\{\s*font-family: var\(--font-yetiskin\);/);
    expect(css).toContain('size-adjust: 120%');
  });

  it('yazı yüzeyi: öğretmen/veli ekranları yetişkin, çocuk ekranları TemelYazi', () => {
    for (const e of ['veliKapisi', 'veliPaneli', 'kaynaklar', 'sorunBildir', 'setHazirla', 'haftalikPlan', 'calismaKagidi', 'eveGonder', 'sinifTuruKurulum', 'dersSonuOzeti', 'veliIpucuKarti'] as const) {
      expect(yaziYuzeyi(e)).toBe('yetiskin');
    }
    for (const e of ['audioUnlock', 'modSecimi', 'avatarSecimi', 'renkSecimi', 'anaEkran', 'temaGirisi', 'alistirma', 'oturumSonu', 'bahcem', 'konuSecimi', 'sinifTuru', 'sinifTuruSonu', 'evdeCalis', 'kesifMasasi', 'temaTuru'] as const) {
      expect(yaziYuzeyi(e)).toBe('cocuk');
    }
    expect(YETISKIN_EKRANLARI.size).toBe(11);
  });

  it('App her ekran sarmalayıcısına data-yazi koyar', () => {
    const app = readFileSync('src/App.tsx', 'utf8');
    expect(app.match(/data-yazi=\{yazi\}/g)?.length).toBe(24);
  });
});
