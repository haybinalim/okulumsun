/**
 * KG-102: cevap anahtarı sayfa planı ve basılı sayfa sayısı. MAT.1.3.4 (f5) kâğıtlarında anahtar A4'e sığmıyor,
 * PDF 3 sayfa çıkarken altbilgi "Sayfa 2 / 2" yazıyordu. Sıkı düzen + kodda sayfa planı; commitlenmiş arşiv ve etki
 * PDF'lerinin sayfa sayısı plandaki toplamla aynı olmalı (`scripts/denetim/pdfSayfa.ts`).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import tr from '../../src/content/tr.json';
import { skillsData } from '../../src/content/skillsData';
import {
  ANAHTAR_KAPASITESI,
  ANAHTAR_OLCU,
  anahtarSatiriYuksekligi,
  anahtarSayfalari,
  celdiriciGruplari,
  grupCumlesi,
  kagitToplamSayfa,
  satirSayisi,
  telafiNotlari,
  telafiYuksekligi,
} from '../../src/ogretmen/calismaKagidi/anahtarSayfalari';
import { arsivIstegi, arsivKayitlari } from '../../src/ogretmen/calismaKagidi/arsiv';
import type { CevapSatiri } from '../../src/ogretmen/calismaKagidi/cevapAnahtari';
import { etkiFormlariUret } from '../../src/ogretmen/calismaKagidi/etkiFormu';
import { kagitPlaniUret } from '../../src/ogretmen/calismaKagidi/kagitPlani';
import { trDuzlestir } from '../../src/ogretmen/calismaKagidi/sesMetni';
import { FORM_PDF } from '../../scripts/etki-formu-uret';
import { pdfSayfaSayisi, sayfaUyusmazligi } from '../../scripts/denetim/pdfSayfa';

const kok = resolve(__dirname, '../..');
const TR = trDuzlestir(tr as unknown as Record<string, unknown>);
const kayitlar = arsivKayitlari(skillsData);

const satir = (no: number, notlar: [string, string, string][]): CevapSatiri => ({
  no,
  dogru: String(no),
  celdiriciNotlari: notlar.map(([secenek, tani, ipucu]) => ({ secenek, tani, ipucu })),
});

describe('sıkı düzen', () => {
  it('aynı tanılı çeldiriciler tek cümle; dil kuralı "seçtiyse", "yanlış" yok', () => {
    const s = satir(1, [
      ['3', 'Şekil', 'a'],
      ['4', 'Şekil', 'a'],
      ['5', 'Fazla sayma', 'b'],
      ['6', 'Şekil', 'a'],
    ]);
    const g = celdiriciGruplari(s);
    expect(g.map(grupCumlesi)).toEqual(['3, 4 ya da 6 seçtiyse: Şekil.', '5 seçtiyse: Fazla sayma.']);
    expect(grupCumlesi({ secenekler: ['B'], tani: 'Fazla sayma' })).toBe('B seçtiyse: Fazla sayma.');
    expect(g.map(grupCumlesi).join(' ').toLowerCase()).not.toContain('yanlış');
  });
  it('telafi önerisi tanı başına bir kez, ilk görülme sırasıyla; boş öneri yazılmaz', () => {
    const t = telafiNotlari([
      satir(1, [
        ['A', 'X', 'x önerisi'],
        ['B', 'Y', ''],
      ]),
      satir(2, [
        ['A', 'X', 'x önerisi'],
        ['C', 'Z', 'z önerisi'],
      ]),
    ]);
    expect(t).toEqual([
      { tani: 'X', ipucu: 'x önerisi' },
      { tani: 'Z', ipucu: 'z önerisi' },
    ]);
  });
  it('satır kırma kestirimi sözcük bazlı ve cömert', () => {
    expect(satirSayisi('kısa', 100, 3.4)).toBe(1);
    const sigan = Math.floor(100 / (3.4 * ANAHTAR_OLCU.karakterEm));
    expect(satirSayisi('a'.repeat(sigan), 100, 3.4)).toBe(1);
    expect(satirSayisi(`${'a'.repeat(sigan)} b`, 100, 3.4)).toBe(2);
    expect(satirSayisi('a'.repeat(sigan * 2 + 1), 100, 3.4)).toBe(3);
  });
});

describe('sayfa planı', () => {
  it('boş anahtar → tek sayfa; anahtarsız kâğıtta yalnız soru sayfaları', () => {
    expect(anahtarSayfalari([])).toHaveLength(1);
    expect(kagitToplamSayfa({ sayfalar: [[], []], cevapAnahtari: [] }, false)).toBe(2);
    expect(kagitToplamSayfa({ sayfalar: [[], []], cevapAnahtari: [] }, true)).toBe(3);
  });
  it('kalabalık anahtar sayfalara bölünür: sıra korunur, her sayfa kapasite içinde, satır bölünmez', () => {
    const uzun = 'Nesneleri sıraya dizip soldan sağa parmakla göstererek sayma; her nesneyi bir kez göster.';
    const satirlar = Array.from({ length: 40 }, (_, i) =>
      satir(
        i + 1,
        ['A', 'B', 'C'].map((s, j) => [s, `Tanı ${(i * 3 + j) % 17} ${uzun}`, `Öneri ${(i * 3 + j) % 17} ${uzun}`]),
      ),
    );
    const sayfalar = anahtarSayfalari(satirlar);
    expect(sayfalar.length).toBeGreaterThan(2);
    expect(sayfalar.flatMap((s) => s.satirlar.map((x) => x.no))).toEqual(satirlar.map((s) => s.no));
    expect(sayfalar.flatMap((s) => s.telafi)).toEqual(telafiNotlari(satirlar));
    expect(sayfalar.filter((s) => s.telafiBasligi)).toHaveLength(1);
    for (const s of sayfalar) {
      const h =
        (s.satirlar.length ? ANAHTAR_OLCU.tabloBasi : 0) +
        s.satirlar.reduce((a, x) => a + anahtarSatiriYuksekligi(x), 0) +
        (s.telafiBasligi ? ANAHTAR_OLCU.telafiBaslik : 0) +
        s.telafi.reduce((a, t) => a + telafiYuksekligi(t), 0);
      expect(h).toBeLessThanOrEqual(ANAHTAR_KAPASITESI);
      expect(s.satirlar.length + s.telafi.length).toBeGreaterThan(0);
    }
  });
  it('165 arşiv kâğıdının anahtarı tek A4; MAT.1.3.4 (f5) dahil → kâğıt 2 sayfa', () => {
    expect(kayitlar).toHaveLength(165);
    for (const k of kayitlar) {
      const plan = kagitPlaniUret(arsivIstegi(k), TR);
      expect(anahtarSayfalari(plan.cevapAnahtari), k.kagitKodu).toHaveLength(1);
    }
    const f5 = kayitlar.filter((k) => k.dugumKodu === 'f5');
    expect(f5.map((k) => kagitToplamSayfa(kagitPlaniUret(arsivIstegi(k), TR), true))).toEqual([2, 2, 2]);
  });
});

describe('commitlenmiş PDF: sayfa sayısı = altbilgi toplamı', () => {
  it('165 arşiv PDF', () => {
    const uyumsuz = kayitlar
      .map((k) => {
        const plan = kagitPlaniUret(arsivIstegi(k), TR);
        const n = kagitToplamSayfa(plan, true);
        const pdf = readFileSync(resolve(kok, 'public', k.yol));
        const altbilgiler = Array.from({ length: n }, (_, i) => `${i + 1}/${n}`);
        const u = sayfaUyusmazligi(pdf, { toplam: n, altbilgiler });
        return u ? `${k.yol}: ${u}` : null;
      })
      .filter(Boolean);
    expect(uyumsuz).toEqual([]);
  });
  it('etki formu A/B (anahtar basılmaz)', () => {
    const formlar = etkiFormlariUret(TR);
    for (const form of ['A', 'B'] as const) {
      const pdf = readFileSync(resolve(kok, FORM_PDF[form]));
      expect(pdfSayfaSayisi(pdf), form).toBe(kagitToplamSayfa(formlar[form], false));
    }
  });
  it('sayaç: nesne akışlı ya da PDF olmayan girdi reddedilir', () => {
    expect(() => pdfSayfaSayisi(Buffer.from('merhaba'))).toThrow();
    expect(() => pdfSayfaSayisi(Buffer.from('%PDF-1.5 /Type /ObjStm'))).toThrow();
    expect(pdfSayfaSayisi(Buffer.from('%PDF-1.4 /Type /Pages /Count 2 /Type /Page /Type /Page'))).toBe(2);
  });
});
