import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import tr from '../../src/content/tr.json';
import { skillsData } from '../../src/content/skillsData';
import { createRng } from '../../src/exercises/rng';
import { REGISTRY } from '../../src/exercises/registry';
import {
  ETKI_DESENI,
  ETKI_DUZENI,
  ETKI_FORM_TOHUMLARI,
  ETKI_KAZANIMLARI,
  ETKI_MADDE_SAYISI,
  etkiFormlariUret,
  etkiFormuDagilimi,
  etkiFormuKodu,
  etkiFormuKoduCoz,
  etkiFormuUret,
  gercekZorlugu,
  islemOku,
  maddeZorlugu,
} from '../../src/ogretmen/calismaKagidi/etkiFormu';
import { kagitMaddesiYap } from '../../src/ogretmen/calismaKagidi/kagitMaddesi';
import { maddeKaplama } from '../../src/ogretmen/calismaKagidi/kagitYerlesimi';
import { sesMetni, trDuzlestir } from '../../src/ogretmen/calismaKagidi/sesMetni';
import { kagitMetinOzeti } from '../../src/ogretmen/calismaKagidi/arsiv';
import { setSorusuUret } from '../../src/ogretmen/tahtaSorusu';
import { OLCME_ARACI_BELGESI, olcmeAraciBelgesi } from '../../scripts/etki-formu-uret';

const flat = trDuzlestir(tr as unknown as Record<string, unknown>);
const { A, B } = etkiFormlariUret(flat);
const ikisi = [A, B] as const;

describe('etki formu — zorluk düzeyi (KG-93)', () => {
  it('gerçek düzeyi: ≤10 → 1, onluk geçmeden → 2, onluk geçen → 3', () => {
    expect(gercekZorlugu({ x: 9, y: 1, z: 10 })).toBe(1);
    expect(gercekZorlugu({ x: 3, y: 10, z: 13 })).toBe(2); // 13 − 3
    expect(gercekZorlugu({ x: 11, y: 5, z: 16 })).toBe(2);
    expect(gercekZorlugu({ x: 9, y: 3, z: 12 })).toBe(3);
    expect(gercekZorlugu({ x: 9, y: 7, z: 16 })).toBe(3); // 16 − 7
  });

  it('desenin her şablonu için madde içeriği okunur ve gerçek tutarlıdır (200 tohum)', () => {
    const ciftler = [...new Map(ETKI_DESENI.map((y) => [`${y.skillId}|${y.templateId}`, y])).values()];
    for (const yuva of ciftler) {
      for (let i = 0; i < 200; i++) {
        const ex = setSorusuUret({ sira: 0, skillId: yuva.skillId, templateId: yuva.templateId, seed: i * 7919 + 13 });
        const o = islemOku(ex);
        expect(o, `${yuva.templateId} #${i}`).not.toBeNull();
        for (const g of o!.gercekler) expect(g.x + g.y).toBe(g.z);
        expect(maddeZorlugu(ex)).not.toBeNull();
      }
    }
  });

  it('tanınmayan şablonda okuma yok', () => {
    const ex = REGISTRY.get('M-SAY')!.uret({ seed: 1, difficulty: 1, mod: 'tahta' }, createRng(1));
    expect(islemOku(ex)).toBeNull();
    expect(maddeZorlugu(ex)).toBeNull();
  });
});

describe('etki formu — iki paralel form (KG-93)', () => {
  it('desen 20 yuva; her form 20 madde, eksik yok', () => {
    expect(ETKI_DESENI).toHaveLength(ETKI_MADDE_SAYISI);
    for (const f of ikisi) {
      expect(f.maddeler).toHaveLength(20);
      expect(f.eksik).toBe(0);
      expect(f.cevapAnahtari).toHaveLength(20);
      expect(f.sayfalar.flat()).toHaveLength(20);
      expect(f.maddeler.map((m) => m.madde.no)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    }
  });

  it('sıra numarası düzeyinde aynı düğüm, şablon ve zorluk; madde zorluğu yeniden hesapla doğrulanır', () => {
    for (let i = 0; i < 20; i++) {
      const [a, b] = [A.maddeler[i], B.maddeler[i]];
      expect(a.yuva).toEqual(ETKI_DESENI[i]);
      expect(b.yuva).toEqual(ETKI_DESENI[i]);
      expect(a.madde.templateId).toBe(b.madde.templateId);
      expect(a.zorluk).toBe(b.zorluk);
      for (const m of [a, b]) {
        const ex = setSorusuUret({ sira: i, skillId: m.yuva.skillId, templateId: m.yuva.templateId, seed: m.tohum });
        expect(maddeZorlugu(ex)).toBe(m.yuva.zorluk);
        expect(ex.itemId).toBe(m.madde.itemId);
      }
    }
  });

  it('şablon dağılımı ve zorluk dağılımı iki formda birebir aynı (protokol Ek A: 3·3·3·3 + 4·2·2)', () => {
    const [dA, dB] = [etkiFormuDagilimi(A), etkiFormuDagilimi(B)];
    expect(dA).toEqual(dB);
    expect(dA.sablon).toEqual({
      'M-TOPLA-GORSEL': 3,
      'M-TOPLA-ONA-TUMLE': 3,
      'M-TOPLA-SEMBOL': 3,
      'M-CIKAR-GORSEL': 3,
      'M-ESIT-DENGE': 4,
      'M-EKSIK-TOPLANAN': 2,
      'M-TERS-ISLEM': 2,
    });
    expect(dA.zorluk).toEqual({ 1: 9, 2: 5, 3: 6 });
    // Onluk geçen (MAT.1.2.2'nin asıl zorluğu) bölüm 1'de üç madde.
    for (const f of ikisi) expect(f.maddeler.filter((m) => m.yuva.bolum === 1 && m.zorluk === 3)).toHaveLength(3);
    // Düğümün şablon zorluğu (sık sayısı vb.) da aynı.
    const dugumZorlugu = (f: typeof A) =>
      f.maddeler.map((m) => skillsData.find((d) => d.id === m.yuva.skillId)!.difficulty);
    expect(dugumZorlugu(A)).toEqual(dugumZorlugu(B));
  });

  it('kazanım kapsamı: yalnız çalışma haftalarının çıktıları; üç çıktı da her formda', () => {
    for (const f of ikisi) {
      for (const m of f.maddeler) {
        const hedef = m.madde.kazanimKodlari.filter((k) => ETKI_KAZANIMLARI.includes(k));
        expect(hedef.length, `madde ${m.madde.no}`).toBeGreaterThan(0);
        // Tek ek beyan MAT.1.2.1 (toplama/çıkarma şablonlarının ortak beyanı).
        expect(m.madde.kazanimKodlari.filter((k) => !ETKI_KAZANIMLARI.includes(k) && k !== 'MAT.1.2.1')).toEqual([]);
      }
      for (const k of ETKI_KAZANIMLARI) {
        expect(
          f.maddeler.some((m) => m.madde.kazanimKodlari.includes(k)),
          k,
        ).toBe(true);
      }
      expect(f.maddeler.some((m) => m.madde.templateId === 'M-TAHMIN-ISLEM')).toBe(false);
    }
    const sayim = (f: typeof A) =>
      ETKI_KAZANIMLARI.map((k) => f.maddeler.filter((m) => m.madde.kazanimKodlari.includes(k)).length);
    expect(sayim(A)).toEqual(sayim(B));
  });

  it('iki form arasında ortak madde yok (itemId, işlem imzası, kâğıt metni); form içinde yineleme yok', () => {
    const imzaA = A.maddeler.flatMap((m) => m.imzalar);
    const imzaB = B.maddeler.flatMap((m) => m.imzalar);
    expect(new Set(imzaA).size).toBe(imzaA.length);
    expect(new Set(imzaB).size).toBe(imzaB.length);
    expect(imzaA.filter((s) => imzaB.includes(s))).toEqual([]);
    const idA = new Set(A.maddeler.map((m) => m.madde.itemId));
    expect(B.maddeler.filter((m) => idA.has(m.madde.itemId))).toEqual([]);
    const metin = (m: (typeof A.maddeler)[number]) =>
      JSON.stringify([m.madde.templateId, m.madde.yonergeMetni, m.madde.sahne ?? null, m.madde.secenekler]);
    const metinA = new Set(A.maddeler.map(metin));
    expect(B.maddeler.filter((m) => metinA.has(metin(m)))).toEqual([]);
    expect(A.maddeler.map((m) => m.tohum)).not.toEqual(B.maddeler.map((m) => m.tohum));
  });

  it('cevap anahtarı jeneratörle tutarlı; her madde 2×3 düzene sığar', () => {
    const metin = (s: Parameters<typeof sesMetni>[0]) => sesMetni(s, flat);
    for (const f of ikisi) {
      f.maddeler.forEach((m, i) => {
        const ex = setSorusuUret({ sira: i, skillId: m.yuva.skillId, templateId: m.yuva.templateId, seed: m.tohum });
        const yeniden = kagitMaddesiYap(ex, i + 1, metin)!;
        expect(f.cevapAnahtari[i].dogru).toBe(yeniden.cevap);
        expect(f.cevapAnahtari[i].no).toBe(i + 1);
        expect(maddeKaplama(m.madde, ETKI_DUZENI)).not.toBeNull();
      });
      // Bölüm 2 yeni sayfadan başlar.
      const ilkBolum2 = f.sayfalar.findIndex((s) => s.some((m) => m.no === 13));
      expect(f.sayfalar[ilkBolum2][0].no).toBe(13);
    }
  });

  it('determinizm: aynı girdi → aynı form; Form B Form A dışlamasıyla aynı', () => {
    const yeniden = etkiFormlariUret(flat);
    expect(kagitMetinOzeti(yeniden.A)).toBe(kagitMetinOzeti(A));
    expect(kagitMetinOzeti(yeniden.B)).toBe(kagitMetinOzeti(B));
    expect(yeniden.A.maddeler.map((m) => m.tohum)).toEqual(A.maddeler.map((m) => m.tohum));
    const yalnizA = etkiFormuUret('A', flat);
    expect(kagitMetinOzeti(yalnizA)).toBe(kagitMetinOzeti(A));
    expect(ETKI_FORM_TOHUMLARI).toEqual({ A: 53101, B: 53201 });
  });

  it('form kodu: ETKI-1-A / ETKI-1-B; başka kod çözülmez', () => {
    expect(A.kod).toBe(etkiFormuKodu('A'));
    expect(etkiFormuKoduCoz('ETKI-1-A')).toBe('A');
    expect(etkiFormuKoduCoz(' ETKI-1-B ')).toBe('B');
    for (const k of ['ETKI-1-C', 'ETKI-2-A', 'etki-1-a', 'OK-1.d3.1-6-2x3-d', ''])
      expect(etkiFormuKoduCoz(k)).toBeNull();
  });

  it('ölçme aracı belgesi koddan güncel (npx tsx scripts/etki-formu-uret.ts)', () => {
    expect(readFileSync(OLCME_ARACI_BELGESI, 'utf8')).toBe(olcmeAraciBelgesi(flat));
  });
});
