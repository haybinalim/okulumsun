// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import tr from '../../src/content/tr.json';
import { paraGorselStratejisi, TCMB_YAZILI_IZIN } from '../../src/content/paraGorseli';
import { skillsData } from '../../src/content/skillsData';
import { HATA_ETIKETLERI } from '../../src/exercises/distractors';
import { REGISTRY } from '../../src/exercises/registry';
import { createRng } from '../../src/exercises/rng';
import type { Exercise } from '../../src/exercises/types';
import misconceptions from '../../src/content/misconceptions.json';
import { HATA_BASLIKLARI, hataNotu, celdiriciCumlesi } from '../../src/ogretmen/calismaKagidi/cevapAnahtari';
import { kagitMaddesiYap, type KagitMaddesi } from '../../src/ogretmen/calismaKagidi/kagitMaddesi';
import {
  KAGIT_DUZENLERI,
  MADDE_SAYILARI,
  kagitKoduCoz,
  kagitKodu,
  kagitPlaniUret,
  kagitaGirmeyenDugumler,
  type KagitIstegi,
} from '../../src/ogretmen/calismaKagidi/kagitPlani';
import { SECENEK_KUTUSU_MM, maddeKaplama, sayfalaraDagit } from '../../src/ogretmen/calismaKagidi/kagitYerlesimi';
import { sayiYazisi, sesMetni, trDuzlestir } from '../../src/ogretmen/calismaKagidi/sesMetni';
import { YAZDIRMA_SINIFI, yazdirmaSinifi } from '../../src/ogretmen/calismaKagidi/yazdirmaUygunlugu';
import { setlenebilirDugumler, type GunlukSet } from '../../src/ogretmen/gunlukSet';
import { KagitSayfalari } from '../../src/ui/print/KagitSayfalari';
import { depolamaCasusuKur } from './yardimci/depolamaCasusu';

const flat = trDuzlestir(tr as unknown as Record<string, unknown>);
const metin = (s: Parameters<typeof sesMetni>[0]): string => sesMetni(s, flat);
const kayitli = (t: string): boolean => REGISTRY.has(t);
const gecerli = setlenebilirDugumler(kayitli);
const hazirlar = [...gecerli];

function uret(templateId: string, tohum: number, zorluk: 1 | 2 | 3 | 4 | 5 = 2): Exercise {
  const g = REGISTRY.get(templateId)!;
  const d = Math.min(Math.max(zorluk, g.zorlukAraligi[0]), g.zorlukAraligi[1]) as 1 | 2 | 3 | 4 | 5;
  return g.uret({ seed: tohum, difficulty: d, mod: 'tahta' }, createRng(tohum));
}

function rastgeleIstek(rng: ReturnType<typeof createRng>): KagitIstegi {
  return {
    set: { surum: 1, dugumler: rng.sample(hazirlar, 1 + rng.int(0, 3)), tohum: rng.int(0, 0xffffffff) >>> 0 },
    maddeSayisi: rng.pick(MADDE_SAYILARI),
    duzen: rng.pick(KAGIT_DUZENLERI),
    yanitTercihi: rng.pick(['daireIcineAl', 'yazmaliOlabilir'] as const),
  };
}

describe('yazdırma uygunluğu', () => {
  it('39 şablonun hepsi tam bir sınıfta: 23 uygun · 14 uyarlanır · 2 uygun değil', () => {
    const sablonlar = new Set(skillsData.flatMap((d) => d.exerciseTemplates));
    expect(sablonlar.size).toBe(39);
    expect(new Set(Object.keys(YAZDIRMA_SINIFI))).toEqual(sablonlar);
    expect(new Set([...REGISTRY.keys()])).toEqual(sablonlar);
    const sayi = { uygun: 0, uyarlanir: 0, uygunDegil: 0 };
    for (const t of sablonlar) sayi[yazdirmaSinifi(t)]++;
    expect(sayi).toEqual({ uygun: 23, uyarlanir: 14, uygunDegil: 2 });
    expect(yazdirmaSinifi('M-SIPSAK')).toBe('uygunDegil');
    expect(yazdirmaSinifi('M-TAHMIN-MIKTAR')).toBe('uygunDegil');
    expect(yazdirmaSinifi('M-YOK')).toBe('uygunDegil');
  });
});

describe('kagitMaddesiYap', () => {
  it('uygun olmayan şablonlar kâğıda girmez', () => {
    for (const t of ['M-SIPSAK', 'M-TAHMIN-MIKTAR']) {
      for (let s = 1; s <= 50; s++) expect(kagitMaddesiYap(uret(t, s), 1, metin)).toBeNull();
    }
  });

  it('cevap, jeneratörün doğrulama alanından gelir (37 şablon × 1000 tohum)', () => {
    for (const [templateId] of REGISTRY) {
      if (yazdirmaSinifi(templateId) === 'uygunDegil') continue;
      for (let s = 1; s <= 1000; s++) {
        const ex = uret(templateId, s, ((s % 5) + 1) as 1 | 2 | 3 | 4 | 5);
        const m = kagitMaddesiYap(ex, 1, metin);
        expect(m, `${templateId}#${s}`).not.toBeNull();
        const etiketKimden = (id: string): string => m!.secenekler.find((x) => x.id === id)?.etiket ?? '?';
        switch (ex.kind) {
          case 'AUDIO_TO_IMAGE':
            expect(m!.cevap, `${templateId}#${s}`).toBe(etiketKimden(ex.validation.dogruOptionId));
            expect(m!.yanitBicimi).toBe('daireIcineAl');
            break;
          case 'TAP_COUNT':
            if (ex.validation.cevapSecimi === 'secenek') {
              expect(m!.cevap).toBe(etiketKimden(ex.validation.dogruOptionId!));
            } else {
              expect(m!.cevap).toBe(String(ex.validation.beklenenAdet));
              expect(m!.yanitBicimi).toBe('kutuyaYaz');
            }
            break;
          case 'HOTSPOT_FIND': {
            const dogrular = ex.validation.dogruHotspotIds.map((id) => String(ex.options.findIndex((o) => o.id === id) + 1));
            for (const d of dogrular) expect(m!.cevap).toContain(d);
            expect(m!.isaretler).toHaveLength(ex.options.length);
            break;
          }
          case 'TAP_TO_PLACE':
            expect(m!.kutular).toHaveLength(ex.yuvalar.length);
            for (const y of ex.yuvalar) expect(m!.cevap).toContain(etiketKimden(ex.validation.dogruEslesme[y.id]));
            break;
          case 'MATCH_PAIRS':
            expect(m!.yanitBicimi).toBe('cizgiyleEsle');
            for (const [a, b] of ex.validation.ciftler) expect(m!.cevap).toContain(`${etiketKimden(a)}-${etiketKimden(b)}`);
            break;
          case 'SEQUENCE_ORDER':
            expect(m!.yanitBicimi).toBe('siraNumarasiYaz');
            for (const o of ex.options) {
              expect(m!.cevap).toContain(`${etiketKimden(o.id)}=${ex.validation.dogruSira.indexOf(o.id) + 1}`);
            }
            break;
          default:
            break;
        }
        // Çeldirici etiketleri misconceptions.json'da; yönerge ham anahtar içermez.
        for (const c of m!.celdiriciler) expect(hataNotu(c.hata), `${templateId} ${c.hata}`).toBeDefined();
        expect(m!.yonergeMetni).not.toMatch(/\b(sayi|soru|op|konum|sekil|tahmin|adim|yon|para)\.[a-z0-9-]+/);
        expect(m!.yonergeMetni.toLowerCase()).not.toContain('yanlış');
      }
    }
  });

  it('HATA_BASLIKLARI misconceptions.json etiketleriyle birebir (JSON pakete girmez)', () => {
    const json = Object.fromEntries((misconceptions.hatalar as { id: string; etiket: string }[]).map((h) => [h.id, h.etiket]));
    expect(HATA_BASLIKLARI).toEqual(json);
  });

  it('tüm hata etiketleri misconceptions.json tanısına sahip; cümlede "yanlış" geçmez', () => {
    for (const etiket of Object.values(HATA_ETIKETLERI)) {
      const not = hataNotu(etiket);
      expect(not, etiket).toBeDefined();
      const cumle = celdiriciCumlesi({ secenek: 'B', tani: not!.tani, ipucu: not!.ipucu });
      expect(cumle).toMatch(/^B seçtiyse: /);
      expect(`${cumle} ${not!.ipucu}`.toLowerCase()).not.toContain('yanlış');
    }
  });
});

describe('sesMetni', () => {
  it('örnekler', () => {
    expect(metin({ kind: 'sequence', keys: ['sayi.7', 'op.arti', 'sayi.5', 'soru.kac-eder'] })).toBe('7 + 5 kaç eder?');
    expect(metin({ kind: 'sequence', keys: ['sayi.9', 'op.eksi', 'sayi.4', 'soru.kac-eder'] })).toBe('9 − 4 kaç eder?');
    expect(metin({ kind: 'key', key: 'sayi.8' })).toBe('sekiz');
    expect(metin({ kind: 'sequence', keys: ['sayi.15', 'sayi.16', 'sayi.17', 'soru.hangisi-gelir'] })).toBe(
      '15, 16, 17. Sırada hangisi gelir?',
    );
    expect(metin({ kind: 'sequence', keys: ['adim.bir-adim', 'yon.sola', 'adim.iki-adim', 'yon.ileri'] })).toBe(
      'bir adım sola, iki adım ileri',
    );
    expect(metin({ kind: 'key', key: 'konum.icinde' })).toBe('Hangisi “içinde”?');
    expect(metin({ kind: 'key', key: 'soru.hangisi-cok' })).toBe('Hangisinde daha çok var?');
  });

  it('para tutarı tek cümle: "beş lira" ("beş. Lira" değil)', () => {
    expect(metin({ kind: 'sequence', keys: ['sayi.5', 'para.lira'] })).toBe('beş lira');
    expect(metin({ kind: 'sequence', keys: ['sayi.100', 'para.lira'] })).toBe('yüz lira');
    expect(metin({ kind: 'sequence', keys: ['sayi.20', 'para.lira'] })).toBe('yirmi lira');
    // Soru kalıbı yine yeni cümle başlatır.
    expect(metin({ kind: 'sequence', keys: ['sayi.15', 'sayi.16', 'soru.hangisi-gelir'] })).toBe(
      '15, 16. Sırada hangisi gelir?',
    );
  });

  it('hiçbir kâğıt yönergesinde "sayı. Lira" kalıbı yok (tüm şablonlar × 200 tohum)', () => {
    for (const [t] of REGISTRY) {
      if (yazdirmaSinifi(t) === 'uygunDegil') continue;
      for (let s = 1; s <= 200; s++) {
        const m = kagitMaddesiYap(uret(t, s, ((s % 5) + 1) as 1 | 2 | 3 | 4 | 5), 1, metin);
        if (!m) continue;
        expect(m.yonergeMetni, `${t}#${s}`).not.toMatch(/\. Lira/);
      }
    }
  });

  it('sayiYazisi 0–100', () => {
    expect([0, 7, 10, 19, 20, 45, 99, 100].map(sayiYazisi)).toEqual([
      'sıfır', 'yedi', 'on', 'on dokuz', 'yirmi', 'kırk beş', 'doksan dokuz', 'yüz',
    ]);
  });

  it('tr.json düzleştirme: $ alanları atlanır', () => {
    expect(flat['soru.kac-eder']).toBe('Kaç eder?');
    expect(Object.keys(flat).some((k) => k.includes('$'))).toBe(false);
  });
});

describe('kagitPlaniUret', () => {
  it('aynı istek → aynı plan (100 × 2)', () => {
    const rng = createRng(35);
    for (let i = 0; i < 100; i++) {
      const istek = rastgeleIstek(rng);
      const a = kagitPlaniUret(istek, flat);
      const b = kagitPlaniUret(istek, flat);
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
      expect(a.kod).toBe(kagitKodu(istek));
    }
  });

  it('madde sayısı, düzen ve sayfa dağılımı', () => {
    const set: GunlukSet = { surum: 1, dugumler: hazirlar.slice(0, 4), tohum: 99 };
    for (const duzen of KAGIT_DUZENLERI) {
      for (const maddeSayisi of MADDE_SAYILARI) {
        const plan = kagitPlaniUret({ set, maddeSayisi, duzen, yanitTercihi: 'yazmaliOlabilir' }, flat);
        const adet = plan.sayfalar.flat().length;
        expect(adet + plan.eksik).toBe(maddeSayisi);
        expect(plan.cevapAnahtari).toHaveLength(adet);
        expect(plan.sayfalar.every((s) => s.length > 0)).toBe(true);
        // madde numaraları 1..n ardışık, itemId'ler benzersiz
        expect(plan.sayfalar.flat().map((m) => m.no)).toEqual(Array.from({ length: adet }, (_, i) => i + 1));
        expect(new Set(plan.sayfalar.flat().map((m) => m.itemId)).size).toBe(adet);
      }
    }
  });

  it('uygun olmayan şablonlar kâğıda girmez; yalnız uygun olmayan düğümde plan boş kalır', () => {
    const sipsak = skillsData.find((d) => d.exerciseTemplates.every((t) => t === 'M-SIPSAK') && gecerli.has(d.id));
    expect(sipsak, 'yalnız M-SIPSAK olan bir hazır düğüm').toBeDefined();
    const set: GunlukSet = { surum: 1, dugumler: [sipsak!.id], tohum: 5 };
    const plan = kagitPlaniUret({ set, maddeSayisi: 6, duzen: '2x3', yanitTercihi: 'yazmaliOlabilir' }, flat);
    expect(plan.sayfalar).toHaveLength(0);
    expect(plan.eksik).toBe(6);
    expect(kagitaGirmeyenDugumler(set, 'yazmaliOlabilir')).toEqual([sipsak!.id]);

    const rng = createRng(77);
    for (let i = 0; i < 60; i++) {
      const p = kagitPlaniUret(rastgeleIstek(rng), flat);
      for (const m of p.sayfalar.flat()) {
        expect(yazdirmaSinifi(m.templateId)).not.toBe('uygunDegil');
      }
    }
  });

  it('"yalnız daire içine al" tercihinde uyarlanır şablonlar girmez', () => {
    const rng = createRng(8);
    for (let i = 0; i < 80; i++) {
      const istek = { ...rastgeleIstek(rng), yanitTercihi: 'daireIcineAl' as const };
      for (const m of kagitPlaniUret(istek, flat).sayfalar.flat()) {
        expect(yazdirmaSinifi(m.templateId)).toBe('uygun');
      }
    }
  });

  it('cevap anahtarı: her madde bir satır, "seçtiyse" biçimi, "yanlış" yok', () => {
    const set: GunlukSet = { surum: 1, dugumler: hazirlar.slice(0, 4), tohum: 3 };
    const plan = kagitPlaniUret({ set, maddeSayisi: 12, duzen: '2x3', yanitTercihi: 'yazmaliOlabilir' }, flat);
    let notSayisi = 0;
    for (const s of plan.cevapAnahtari) {
      expect(s.dogru.length).toBeGreaterThan(0);
      for (const n of s.celdiriciNotlari) {
        notSayisi++;
        expect(celdiriciCumlesi(n)).toContain('seçtiyse');
        expect(`${n.tani} ${n.ipucu}`.toLowerCase()).not.toContain('yanlış');
      }
    }
    expect(notSayisi).toBeGreaterThan(0);
    expect(plan.kazanimOzeti.length).toBeGreaterThan(0);
    expect(plan.kazanimOzeti.every((k) => /^MAT\.1\.[1-4]\.\d+$/.test(k))).toBe(true);
  });

  it('kâğıt kodu çözülür ve aynı planı verir', () => {
    const rng = createRng(12);
    for (let i = 0; i < 100; i++) {
      const istek = rastgeleIstek(rng);
      const coz = kagitKoduCoz(kagitKodu(istek), gecerli);
      expect(coz).toEqual(istek);
    }
    expect(kagitKoduCoz('OK-1.a1.zz-5-2x3-d', gecerli)).toBeNull();
    expect(kagitKoduCoz('rastgele', gecerli)).toBeNull();
  });

  it('depolama ve ağ yok', () => {
    const casus = depolamaCasusuKur();
    const fetchGercek = globalThis.fetch;
    let agCagrisi = 0;
    globalThis.fetch = (() => {
      agCagrisi++;
      return Promise.reject(new Error('ağ yasak'));
    }) as typeof fetch;
    try {
      const rng = createRng(4);
      for (let i = 0; i < 20; i++) kagitPlaniUret(rastgeleIstek(rng), flat);
      expect(casus.cagrilar()).toEqual([]);
      expect(agCagrisi).toBe(0);
    } finally {
      globalThis.fetch = fetchGercek;
      casus.sok();
    }
  });
});

describe('yerleşim', () => {
  it('seçenek kutusu en az 25 mm', () => {
    expect(SECENEK_KUTUSU_MM).toBeGreaterThanOrEqual(25);
  });

  it('her uygun şablon her düzende en az bir tohumla sayfaya sığar (iki hücreli madde dâhil)', () => {
    const sigmayan: string[] = [];
    for (const [t] of REGISTRY) {
      if (yazdirmaSinifi(t) !== 'uygun') continue;
      for (const duzen of KAGIT_DUZENLERI) {
        let sigdi = false;
        for (let s = 1; s <= 60 && !sigdi; s++) {
          const m = kagitMaddesiYap(uret(t, s, ((s % 5) + 1) as 1 | 2 | 3 | 4 | 5), 1, metin);
          if (m && maddeKaplama(m, duzen) !== null) sigdi = true;
        }
        if (!sigdi) sigmayan.push(`${t}/${duzen}`);
      }
    }
    expect(sigmayan).toEqual([]);
  });

  it('iki hücreli madde 2x3\'te satır başına geçer ve sayfa kapasitesi aşılmaz', () => {
    const rng = createRng(2);
    const hepsi: KagitMaddesi[] = [];
    for (const [t] of REGISTRY) {
      if (yazdirmaSinifi(t) === 'uygunDegil') continue;
      for (let s = 1; s <= 8; s++) {
        const m = kagitMaddesiYap(uret(t, rng.int(1, 1e6)), hepsi.length + 1, metin);
        if (m) hepsi.push(m);
      }
    }
    for (const duzen of KAGIT_DUZENLERI) {
      const kap = duzen === '2x3' ? 6 : 4;
      const uygun = hepsi.filter((m) => maddeKaplama(m, duzen) !== null);
      for (const sayfa of sayfalaraDagit(uygun, duzen)) {
        let dolu = 0;
        for (const m of sayfa) {
          const k = maddeKaplama(m, duzen)!;
          if (duzen === '2x3' && k === 2 && dolu % 2 === 1) dolu++;
          dolu += k;
        }
        expect(dolu).toBeLessThanOrEqual(kap);
      }
    }
  });
});

describe('para görselleri ve baskı kuralları', () => {
  it('TCMB yazılı izni yokken kâğıtta şematik banknot', () => {
    expect(paraGorselStratejisi({ ortam: 'kagit', tcmbYaziliIzin: TCMB_YAZILI_IZIN })).toBe('sematik');
    const para = skillsData.find((d) => d.exerciseTemplates.includes('M-PARA-TANI') && gecerli.has(d.id));
    expect(para).toBeDefined();
    const set: GunlukSet = { surum: 1, dugumler: [para!.id], tohum: 11 };
    const istek: KagitIstegi = { set, maddeSayisi: 4, duzen: '2x3', yanitTercihi: 'daireIcineAl' };
    const plan = kagitPlaniUret(istek, flat);
    expect(plan.sayfalar.flat().length).toBeGreaterThan(0);
    const html = renderToStaticMarkup(
      KagitSayfalari({ plan, duzen: '2x3', cevapAnahtariDahil: true, siyahBeyaz: false, kopya: 'onizleme' }),
    );
    expect(html).toContain('data-sematik-banknot');
    expect(html).not.toMatch(/tcmb|<image/i);
    expect(html).toContain('OYUN PARASI');
  });

  it('kağıt kabuğu: Adım satırı, altbilgi, sayfa numarası', () => {
    const set: GunlukSet = { surum: 1, dugumler: hazirlar.slice(0, 2), tohum: 1 };
    const plan = kagitPlaniUret({ set, maddeSayisi: 8, duzen: '2x3', yanitTercihi: 'yazmaliOlabilir' }, flat);
    const html = renderToStaticMarkup(
      KagitSayfalari({ plan, duzen: '2x3', cevapAnahtariDahil: true, siyahBeyaz: true, kopya: 'baski' }),
    );
    expect(html).toContain('Adım:');
    expect(html).toContain(plan.kod);
    expect(html).toContain('okulumsun, MEB 2024 1. sınıf matematik');
    expect(html).toContain(`Sayfa 1 / ${plan.sayfalar.length + 1}`);
    expect(html).toContain('kg-kok--gri');
    expect(html.toLowerCase()).not.toContain('yanlış');
  });

  it('kagit.css: A4, 12 mm kenar, 26 mm seçenek kutusu, 1,2 mm kontur, yazdırmada kabuk gizli', () => {
    const css = readFileSync(resolve(__dirname, '../../src/ui/print/kagit.css'), 'utf-8');
    expect(css).toMatch(/@page\s*{[^}]*size:\s*A4;[^}]*margin:\s*12mm/s);
    expect(css).toMatch(/\.kg-secenek\s*{[^}]*min-width:\s*26mm[^}]*height:\s*26mm[^}]*border:\s*1\.2mm solid #000/s);
    expect(css).toMatch(/@media print[\s\S]*#root\s*{\s*display:\s*none/);
  });
});
