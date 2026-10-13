import { describe, expect, it } from 'vitest';
import {
  BUYUK_HEDEF_CARPANI,
  BUYUYEN_HEDEFLER,
  EN_DUSUK_CALMA_HIZI,
  TALIMAT_TEKRARI_MS,
  VARSAYILAN_KAPSAYICILIK,
  cssDegiskenleri,
  etkinCalmaHizi,
  hedefOlcegi,
  paletliVurgu,
  paletliVurgular,
  talimatTekrariGecikmesi,
  varsayilandanFarkliMi,
  veriOznitelikleri,
  type KapsayicilikAyarlari,
} from '../../src/design/kapsayicilik';
import { ACCENTS, ACCENTS_RENK_KORLUGU, COLOR, COLOR_RENK_KORLUGU, SIZE } from '../../src/design/tokens';
import {
  AYAR_KODU_EN_UZUN_HASH,
  ayarHash,
  ayarKodu,
  ayarKoduCoz,
  ayarKoduGirisimiMi,
} from '../../src/ogretmen/ayarKodu';
import { useAppStore } from '../../src/store/appStore';

/** Plan v2 Adım 55: kapsayıcılık ayarları (saf çekirdek, palet, ayar kodu, bellek). */

const HEPSI_ACIK: KapsayicilikAyarlari = {
  tempo: 'yavas',
  talimatTekrari: true,
  palet: 'renkKorluguDostu',
  solEl: true,
  buyukHedef: true,
  hareketAzalt: true,
};

/** 2^6 = 64 kombinasyonun tamamı. */
function butunKombinasyonlar(): KapsayicilikAyarlari[] {
  const liste: KapsayicilikAyarlari[] = [];
  for (let m = 0; m < 64; m++) {
    liste.push({
      tempo: m & 1 ? 'yavas' : 'normal',
      talimatTekrari: Boolean(m & 2),
      palet: m & 4 ? 'renkKorluguDostu' : 'standart',
      solEl: Boolean(m & 8),
      buyukHedef: Boolean(m & 16),
      hareketAzalt: Boolean(m & 32),
    });
  }
  return liste;
}

// ------------------------------------------------------------------ renk hesabı (WCAG + CVD benzetimi)

function rgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}
function dogrusal(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}
function parlaklik(hex: string): number {
  const [r, g, b] = rgb(hex).map(dogrusal) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function kontrast(a: string, b: string): number {
  const [x, y] = [parlaklik(a), parlaklik(b)].sort((p, q) => q - p) as [number, number];
  return (x + 0.05) / (y + 0.05);
}
/** Machado vd. (2009), şiddet 1,0 — doğrusal RGB üzerinde. */
const CVD: Record<string, number[][]> = {
  doteranopi: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  protanopi: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  tritanopi: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};
function benzet(hex: string, m: number[][] | null): number[] {
  const v = rgb(hex).map(dogrusal);
  if (!m) return v;
  return m.map((satir) =>
    Math.min(
      1,
      Math.max(
        0,
        satir.reduce((t, k, j) => t + k * v[j]!, 0),
      ),
    ),
  );
}
function lab([r, g, b]: number[]): [number, number, number] {
  const X = (0.4124 * r! + 0.3576 * g! + 0.1805 * b!) / 0.95047;
  const Y = 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  const Z = (0.0193 * r! + 0.1192 * g! + 0.9505 * b!) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
function deltaE(a: string, b: string, m: number[][] | null): number {
  const [p, q] = [lab(benzet(a, m)), lab(benzet(b, m))];
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
}
function enKucukFark(renkler: readonly string[]): { tur: string; fark: number } {
  let sonuc = { tur: '', fark: Infinity };
  for (const [tur, m] of [['normal', null], ...Object.entries(CVD)] as [string, number[][] | null][]) {
    for (let i = 0; i < renkler.length; i++) {
      for (let j = i + 1; j < renkler.length; j++) {
        const d = deltaE(renkler[i]!, renkler[j]!, m);
        if (d < sonuc.fark) sonuc = { tur, fark: d };
      }
    }
  }
  return sonuc;
}

describe('renk körlüğü dostu palet', () => {
  const vurgular = Object.values(ACCENTS_RENK_KORLUGU);

  it('her vurgu ve doğru/tekrar dene rengi zemine ve beyaza ≥4,5:1 (PLAN §9 grafik eşiği)', () => {
    for (const renk of [...vurgular, COLOR_RENK_KORLUGU.correct, COLOR_RENK_KORLUGU.retry]) {
      expect(kontrast(renk, COLOR.bg), renk).toBeGreaterThanOrEqual(4.5);
      expect(kontrast(renk, '#FFFFFF'), renk).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('vurgular üç renk körlüğü benzetiminde de ayrışır (çiftler arası ΔE ≥10)', () => {
    const { tur, fark } = enKucukFark(vurgular);
    expect(fark, tur).toBeGreaterThanOrEqual(10);
  });

  it('doğru ↔ tekrar dene her benzetimde belirgin ayrışır (ΔE ≥40)', () => {
    const { tur, fark } = enKucukFark([COLOR_RENK_KORLUGU.correct, COLOR_RENK_KORLUGU.retry]);
    expect(fark, tur).toBeGreaterThanOrEqual(40);
  });

  it('standart vurgulardan daha ayırt edici (standart mor/mavi döteranopide karışır)', () => {
    expect(enKucukFark(ACCENTS.map((a) => a.hex)).fark).toBeLessThan(enKucukFark(vurgular).fark);
  });

  it('kırmızı tonu yok (tekrar dene kırmızı olmaz: ton 15°–345° dışı değil)', () => {
    for (const renk of [...vurgular, ...Object.values(COLOR_RENK_KORLUGU)]) {
      const [r, g, b] = rgb(renk);
      expect(r > 150 && g < 60 && b < 60, renk).toBe(false);
    }
  });

  it('vurgu kimlikleri ve ses adları korunur', () => {
    expect(Object.keys(ACCENTS_RENK_KORLUGU).sort()).toEqual(ACCENTS.map((a) => a.id).sort());
    for (const a of ACCENTS) {
      expect(paletliVurgu(a, 'standart')).toBe(a.hex);
      expect(paletliVurgu(a, 'renkKorluguDostu')).toBe(ACCENTS_RENK_KORLUGU[a.id]);
    }
    expect(paletliVurgular('renkKorluguDostu').map((v) => v.id)).toEqual(ACCENTS.map((a) => a.id));
  });
});

describe('kapsayicilik — saf çekirdek', () => {
  it('varsayılan: hepsi kapalı, CSS değişkeni yok, öznitelik yok', () => {
    expect(varsayilandanFarkliMi(VARSAYILAN_KAPSAYICILIK)).toBe(false);
    expect(Object.isFrozen(VARSAYILAN_KAPSAYICILIK)).toBe(true);
    for (const p of ['board', 'tablet', 'phone'] as const)
      expect(cssDegiskenleri(VARSAYILAN_KAPSAYICILIK, p)).toEqual({});
    expect(Object.values(veriOznitelikleri(VARSAYILAN_KAPSAYICILIK)).every((v) => v === null)).toBe(true);
    expect(talimatTekrariGecikmesi(VARSAYILAN_KAPSAYICILIK)).toBeNull();
  });

  it('çalma hızı: yavaş = 0,85 × ses hızı, alt sınır 0,5; geçersiz ses hızı 1 sayılır', () => {
    expect(etkinCalmaHizi(1, 'normal')).toBe(1);
    expect(etkinCalmaHizi(1, 'yavas')).toBe(0.85);
    expect(etkinCalmaHizi(1.5, 'yavas')).toBe(1.275);
    expect(etkinCalmaHizi(0.5, 'yavas')).toBe(EN_DUSUK_CALMA_HIZI);
    expect(etkinCalmaHizi(0.5, 'normal')).toBe(0.5);
    expect(etkinCalmaHizi(Number.NaN, 'normal')).toBe(1);
  });

  it("talimat tekrarı 8 sn, K1 15 sn'den önce", () => {
    expect(talimatTekrariGecikmesi({ ...VARSAYILAN_KAPSAYICILIK, talimatTekrari: true })).toBe(TALIMAT_TEKRARI_MS);
    expect(TALIMAT_TEKRARI_MS).toBe(8000);
  });

  it('büyük hedef: tahtada dokunma alt sınırı 102 → 118 px; boşluk/kenar değişmez', () => {
    const a = { ...VARSAYILAN_KAPSAYICILIK, buyukHedef: true };
    expect(hedefOlcegi(a, 'board')).toBeCloseTo(1.6 * BUYUK_HEDEF_CARPANI);
    const css = cssDegiskenleri(a, 'board');
    expect(css['--size-tap-min']).toBe(`${Math.round(64 * 1.6 * 1.15)}px`);
    expect(css['--size-tap-min']).toBe('118px');
    expect(css['--size-gap']).toBeUndefined();
    expect(css['--size-edge']).toBeUndefined();
    expect(Object.keys(css).filter((k) => k.startsWith('--size-'))).toHaveLength(BUYUYEN_HEDEFLER.length);
    expect([...BUYUYEN_HEDEFLER].sort()).toEqual(['control', 'mascot', 'tapMin']);
    // Zaten alt sınırın iki katından büyük hedefler büyümez (tahtada alt %65 taşmasın).
    for (const ad of ['choice', 'choiceMin', 'primary', 'unlock'] as const) {
      expect(SIZE[ad]).toBeGreaterThanOrEqual(2 * SIZE.tapMin);
      expect(css[`--size-${ad === 'choiceMin' ? 'choice-min' : ad}`]).toBeUndefined();
    }
  });

  it('palet değişkenleri yalnız renk körlüğü paletinde', () => {
    const css = cssDegiskenleri({ ...VARSAYILAN_KAPSAYICILIK, palet: 'renkKorluguDostu' }, 'tablet');
    expect(css).toEqual({
      '--color-correct': COLOR_RENK_KORLUGU.correct,
      '--color-correct-soft': COLOR_RENK_KORLUGU.correctSoft,
      '--color-retry': COLOR_RENK_KORLUGU.retry,
      '--color-retry-soft': COLOR_RENK_KORLUGU.retrySoft,
    });
  });

  it('öznitelikler ayarlara bire bir', () => {
    expect(veriOznitelikleri(HEPSI_ACIK)).toEqual({
      solEl: '1',
      hareketAzalt: '1',
      palet: 'renk-korlugu',
      buyukHedef: '1',
    });
  });
});

describe('ayar kodu (#ayar=)', () => {
  it('64 kombinasyonun hepsi üret → çöz tersi; uzunluk sınırı', () => {
    const kodlar = new Set<string>();
    for (const a of butunKombinasyonlar()) {
      const hash = ayarHash(a);
      kodlar.add(hash);
      if (!varsayilandanFarkliMi(a)) {
        expect(hash).toBe('');
        continue;
      }
      expect(hash.length).toBeLessThanOrEqual(AYAR_KODU_EN_UZUN_HASH);
      expect(ayarKoduGirisimiMi(hash)).toBe(true);
      expect(ayarKoduCoz(hash)).toEqual(a);
      expect(ayarKoduCoz(hash.slice(1))).toEqual(a);
    }
    expect(kodlar.size).toBe(64);
  });

  it('kanonik biçim: harfler sabit sırada', () => {
    expect(ayarKodu(HEPSI_ACIK)).toBe('trpsbh');
    expect(ayarHash({ ...VARSAYILAN_KAPSAYICILIK, solEl: true, buyukHedef: true })).toBe('#ayar=1.sb');
    expect(ayarKoduCoz('#ayar=1.')).toEqual(VARSAYILAN_KAPSAYICILIK);
  });

  it('katı çözücü: bilinmeyen harf, tekrar, sıra dışı, başka sürüm, fazla uzunluk, ek alan → null', () => {
    for (const kotu of [
      '#ayar=1.x',
      '#ayar=1.tt',
      '#ayar=1.bs',
      '#ayar=2.t',
      '#ayar=1.trpsbhh',
      '#ayar=1.t&ad=ali',
      '#ayar=1.T',
      '#ayar=t',
      '#ayar=',
      '#ev=1.t',
      '',
    ]) {
      expect(ayarKoduCoz(kotu), kotu).toBeNull();
    }
    expect(ayarKoduGirisimiMi('#ev=1.1.a1b7.k3f9q')).toBe(false);
  });
});

describe('appStore.kapsayicilik — yalnız bellekte', () => {
  it('varsayılan kapalı; kısmi değişiklik diğerlerini korur; sıfırla geri döndürür', () => {
    useAppStore.getState().sifirla();
    expect(useAppStore.getState().kapsayicilik).toEqual(VARSAYILAN_KAPSAYICILIK);
    useAppStore.getState().kapsayicilikAyarla({ solEl: true });
    useAppStore.getState().kapsayicilikAyarla({ tempo: 'yavas' });
    expect(useAppStore.getState().kapsayicilik).toEqual({ ...VARSAYILAN_KAPSAYICILIK, solEl: true, tempo: 'yavas' });
    useAppStore.getState().sifirla();
    expect(useAppStore.getState().kapsayicilik).toEqual(VARSAYILAN_KAPSAYICILIK);
  });
});
