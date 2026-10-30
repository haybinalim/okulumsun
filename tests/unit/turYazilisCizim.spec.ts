/**
 * Adım 64 — yazılış gösterimi çizim yardımcıları (`src/ui/tur/hamleCizim.ts`): SVG yolu, zamanlama (sırayla, hızla
 * kısalır), numaralı yön oku (ilk yöne paralel, çizginin yanında), çerçeve, sekmeler (5 grup + rakamlar = 68 glif) ve
 * el tercihinden bağımsızlık (sol el aynalamaz). Ayrıca Türkçe arayüz paketinde ses, süre ölçümü ve depolama yok.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { hamleDosyasiniAyristir } from '../../src/content/schema/turHamle';
import { HARF_GRUPLARI } from '../../src/content/dersler/tur/alfabe';
import {
  baslangicYonu,
  cerceve,
  glifAdi,
  hamleUzunlugu,
  sekmeGlifleri,
  SATIR,
  yolVerisi,
  yonOku,
  zamanlama,
} from '../../src/ui/tur/hamleCizim';
import { hamleVerisiBicimliMi } from '../../src/ui/tur/useHamleVerisi';
import { turAcilisEkrani, turEkraniAc, turEkraniKapat, turEkraniOku } from '../../src/ui/tur/turEkrani';

const VERI = hamleDosyasiniAyristir(JSON.parse(readFileSync('ders-verisi/tur/hamleler.json', 'utf8')));
const g = (bicim: string, glif: string) => VERI.glifler.find((x) => x.bicim === bicim && x.glif === glif)!;

describe('çizim yardımcıları', () => {
  it('satır dizgesi: üst/alt bölge eşit (0,5 + 0,5 cm), 1 cm = 60 birim', () => {
    expect(SATIR.kilavuz - SATIR.ust).toBe(SATIR.taban - SATIR.kilavuz);
    expect(SATIR.taban - SATIR.ust).toBe(SATIR.cmBirim);
  });

  it('yol verisi noktaları sırayla izler', () => {
    expect(
      yolVerisi([
        [1, 2],
        [3.456, 4],
      ]),
    ).toBe('M1 2 L3.46 4');
    expect(
      yolVerisi(
        [
          [0, 0],
          [1, 1],
        ],
        10,
        5,
      ),
    ).toBe('M10 5 L11 6');
  });

  it('zamanlama: hamleler sırayla, örtüşmeden; hızlıda daha kısa', () => {
    for (const glif of VERI.glifler) {
      const z = zamanlama(glif.hamleler, 'orta');
      for (let i = 1; i < z.length; i++) expect(z[i].gecikme).toBeGreaterThanOrEqual(z[i - 1].gecikme + z[i - 1].sure);
      const yavas = zamanlama(glif.hamleler, 'yavas');
      const hizli = zamanlama(glif.hamleler, 'hizli');
      yavas.forEach((y, i) => expect(y.sure).toBeGreaterThanOrEqual(hizli[i].sure));
    }
    // Nokta kısa ama görünür sürer.
    expect(zamanlama(g('kucuk', 'i').hamleler, 'hizli')[1].sure).toBeGreaterThanOrEqual(0.45);
  });

  it('yön oku ilk yöne paralel ve çizginin yanında (üstüne binmez)', () => {
    for (const glif of VERI.glifler)
      for (const h of glif.hamleler) {
        const [ux, uy] = baslangicYonu(h.noktalar);
        const o = yonOku(h.noktalar);
        const [b, e] = o.govde;
        const d = Math.hypot(e[0] - b[0], e[1] - b[1]);
        expect((e[0] - b[0]) / d).toBeCloseTo(ux, 5);
        expect((e[1] - b[1]) / d).toBeCloseTo(uy, 5);
        const [x0, y0] = h.noktalar[0];
        expect(Math.hypot(b[0] - x0, b[1] - y0)).toBeGreaterThan(5);
      }
    // T'nin 2. hamlesi aşağı: ok aşağı bakar.
    const t = yonOku(g('buyuk', 'T').hamleler[1].noktalar);
    expect(t.govde[1][1]).toBeGreaterThan(t.govde[0][1]);
  });

  it('çerçeve glifi ortalar ve İ noktasıyla kuyruğu kapsar', () => {
    for (const glif of VERI.glifler) {
      const c = cerceve(glif);
      expect(c.dx * 2 + glif.genislik).toBeCloseTo(c.genislik, 6);
      const ys = glif.hamleler.flatMap((h) => h.noktalar.map((p) => p[1]));
      expect(Math.min(...ys)).toBeGreaterThanOrEqual(-4);
      expect(Math.max(...ys)).toBeLessThanOrEqual(104);
    }
  });

  it('sekmeler: 5 harf grubu (küçük + büyük, öğretim sırasıyla) ve rakamlar = 68 glif', () => {
    const sekmeler = Array.from({ length: HARF_GRUPLARI.length + 1 }, (_, i) =>
      sekmeGlifleri(VERI.glifler, HARF_GRUPLARI, i),
    );
    expect(sekmeler.map((s) => s.length)).toEqual([12, 12, 12, 10, 12, 10]);
    expect(sekmeler.flat()).toHaveLength(68);
    expect(sekmeler[0].map((x) => x.glif).join('')).toBe('aAnNeEtTiİlL');
    expect(sekmeler[1].map((x) => x.glif).join('')).toBe('oOkKuUrRıImM');
    expect(glifAdi(g('buyuk', 'İ'))).toBe('Büyük İ');
    expect(glifAdi(g('rakam', '7'))).toBe('Rakam 7');
  });

  it('el tercihi parametresi yok: sol el ayarı hamle yönünü değiştiremez (K-OY-19)', () => {
    for (const f of [yolVerisi, zamanlama, yonOku, baslangicYonu, cerceve, hamleUzunlugu])
      expect(f.length).toBeLessThanOrEqual(3);
    const kaynak =
      readFileSync('src/ui/tur/hamleCizim.ts', 'utf8') + readFileSync('src/ui/tur/YazilisGlifi.tsx', 'utf8');
    expect(kaynak).not.toMatch(/solEl|sol-el|scale\(-1|scaleX\(-1/);
  });

  it('çalışma anı biçim denetimi: 68 glif, her hamlede ≥ 2 nokta', () => {
    expect(hamleVerisiBicimliMi(VERI)).toBe(true);
    expect(hamleVerisiBicimliMi({ glifler: VERI.glifler.slice(1) })).toBe(false);
    expect(hamleVerisiBicimliMi(null)).toBe(false);
  });
});

describe('Türkçe ekran durumu (yalnız bellekte)', () => {
  it('?ders=tur girişi açar; kapatınca uygulamaya döner', () => {
    expect(turAcilisEkrani('?ders=tur')).toEqual({ ekran: 'giris' });
    expect(turAcilisEkrani('?ders=mat')).toBeNull();
    expect(turAcilisEkrani('')).toBeNull();
    turEkraniAc({ ekran: 'yazilisSecimi', sekme: 2 });
    expect(turEkraniOku()).toEqual({ ekran: 'yazilisSecimi', sekme: 2 });
    turEkraniKapat();
    expect(turEkraniOku()).toBeNull();
  });
});

describe('Türkçe arayüz paketi kuralları (src/ui/tur)', () => {
  // Alt klasörler dahil (Adım 65: `kagit/`).
  const dosyalar = (readdirSync('src/ui/tur', { recursive: true }) as string[])
    .filter((f) => /\.(ts|tsx|css)$/.test(f))
    .map((f) => [f, readFileSync(`src/ui/tur/${f}`, 'utf8')] as const);
  it('ses yok: konuşma/klip çağrısı içe aktarılmaz (tek başına ünsüz sesi yok, K-OY-03)', () => {
    for (const [f, s] of dosyalar) expect(s, f).not.toMatch(/useSpeak|speech|speechSynthesis|\.m4a|\bAudio\(/);
  });
  it('depolama ve süre ölçümü yok (öğrenci verisi saklanmaz; D-13)', () => {
    for (const [f, s] of dosyalar) {
      expect(s, f).not.toMatch(/localStorage|sessionStorage|indexedDB|document\.cookie/);
      expect(s, f).not.toMatch(/\b(Date\.now|performance\.now)\s*\(/);
    }
  });
  it('SVG maskesi ve kırmızı yok', () => {
    for (const [f, s] of dosyalar) {
      expect(s, f).not.toMatch(/<mask|mask=/);
      expect(s, f).not.toMatch(/#(?:f00|ff0000|dc2626|ef4444|b91c1c)\b/i);
    }
  });
});
