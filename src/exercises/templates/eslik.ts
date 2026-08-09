/**
 * M-ESLIK — NESNELERİN EŞLİĞİNİ DEĞERLENDİRME
 * ====================================================================
 *
 * KAZANIM: MAT.1.3.2 — "Nesnelerin eşliğini değerlendirebilme"
 *
 * Süreç bileşeni (a): "Nesnelerin eşliği için bir ölçüt belirler."
 * (ç): "Karşılaştırmalarına ilişkin olarak yargıda bulunur."
 *
 * Bu şablon (a) ve (ç)'yi ölçer: çocuk iki nesne görür ve eşit olup
 * olmadıklarını söyler. Eşlik ölçütü GÖRSEL: renk, boy, şekil.
 *
 * ÖLÇTÜĞÜ MİKRO DÜĞÜMLER (src/content/skills.json):
 *   · mat.uzam.eslik — "Aynısını bul"
 *
 * MÜFREDAT SINIRI: Eşlik ölçütü görsel özelliklerdir — renk, boy, şekil
 * (SAYFA 38). Öğrencinin bu görsel özellikleri bildiği kabul edilir (SAYFA 39).
 *
 * ÇELDİRİCİ ETİKETLERİ:
 *   · SEKIL_PROTOTIP — şekil karıştırıldı (kare↔dikdörtgen)
 *   · GOREV_ANLASILMADI — görev anlaşılmadı (rastgele seçim)
 *
 * ETKİLEŞİM: AUDIO_TO_IMAGE — "Hangisi aynı?" sesli talimatı, doğru
 * nesneyi seç. Şıklar görsel nesnelerdir; doğru olan referansla aynı
 * özelliklere (renk + şekil) sahiptir.
 *
 * SAF VE SENKRON: Date.now(), Math.random(), IndexedDB ÇAĞRILMAZ.
 */

import { makeItemId, type Difficulty, type KazanimKodu, type SkillId } from '../types';
import type { AudioToImageExercise, ExerciseGenerator, Option, VisualSpec, AssetSpec, Prompt, Renk, SekilAdi } from '../types';
import type { Rng } from '../rng';
import { HATA_ETIKETLERI, type HataEtiketi } from '../distractors';
import { varsayilanIpuclari } from '../types';
import type { NesneSprite } from '../types';

// ---------------------------------------------------------------- sabitler

export const ESLIK_TEMPLATE_ID = 'M-ESLIK' as const;

/** Eşlik özellikleri — çocuk bunları karşılaştırır. */
export interface EslikOzellik {
  readonly renk: Renk;
  readonly sekil: SekilAdi;
}

/** Şıklarda kullanılacak şekiller — 1. sınıfta dört temel şekil. */
const SEKILLER: readonly SekilAdi[] = ['ucgen', 'kare', 'dikdortgen', 'cember'];

/** Renkler — tokens.ts paletinden (RENKLER sabitine uyumlu). */
const RENKLER: readonly Renk[] = ['mor', 'turuncu', 'yesil', 'mavi', 'pembe', 'sari'];

// ---------------------------------------------------------------- params

export interface EslikParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly tercihEdilenSprite?: NesneSprite;
  readonly mod?: 'tahta' | 'kisisel';
}

// ---------------------------------------------------------------- üretim

export function eslikUret(params: EslikParams, rng: Rng): AudioToImageExercise {
  const { seed, difficulty } = params;

  // Referans nesne özellikleri seç
  const ozellikRng = rng.fork('ozellik');
  const referansRenk = ozellikRng.pick(RENKLER);
  const referansSekil = ozellikRng.pick(SEKILLER);
  const referansOzellik: EslikOzellik = { renk: referansRenk, sekil: referansSekil };

  // Şık sayısı: difficulty 1-2 → 2, 3-4 → 3, 5 → 4 (asla 4'ten fazla — plan §11)
  const secenekSayisi = Math.min(2 + Math.floor((difficulty - 1) / 2), 4);

  // Yanlış şık özellikleri üret — en az bir özellik farklı
  const celdiriciRng = rng.fork('celdirici');
  const yanlisOzellikler: EslikOzellik[] = [];
  const kullanilanOzellikler = new Set<string>([`${referansRenk}|${referansSekil}`]);

  // Tanılayıcı yanlış: yalnızca RENK farklı (şekil aynı — renk körlüğü test)
  const renkFarkli = RENKLER.filter((r) => r !== referansRenk);
  const yanlisRenk = celdiriciRng.pick(renkFarkli);
  const renkFarkliOzellik: EslikOzellik = { renk: yanlisRenk, sekil: referansSekil };
  yanlisOzellikler.push(renkFarkliOzellik);
  kullanilanOzellikler.add(`${yanlisRenk}|${referansSekil}`);

  // İkinci yanlış: yalnızca ŞEKİL farklı (şekil karışıklığı — SEKIL_PROTOTIP)
  if (secenekSayisi >= 3) {
    const sekilFarkli = SEKILLER.filter((s) => s !== referansSekil);
    const yanlisSekil = celdiriciRng.pick(sekilFarkli);
    const sekilFarkliOzellik: EslikOzellik = { renk: referansRenk, sekil: yanlisSekil };
    const anahtar = `${referansRenk}|${yanlisSekil}`;
    if (!kullanilanOzellikler.has(anahtar)) {
      yanlisOzellikler.push(sekilFarkliOzellik);
      kullanilanOzellikler.add(anahtar);
    } else {
      // Tamamen rastgele yanlış
      let rastgele: EslikOzellik;
      do {
        rastgele = { renk: celdiriciRng.pick(RENKLER), sekil: celdiriciRng.pick(SEKILLER) };
      } while (kullanilanOzellikler.has(`${rastgele.renk}|${rastgele.sekil}`));
      yanlisOzellikler.push(rastgele);
      kullanilanOzellikler.add(`${rastgele.renk}|${rastgele.sekil}`);
    }
  }

  // Üçüncü yanlış (difficulty 5): her ikisi farklı
  if (secenekSayisi >= 4) {
    let tamFarkli: EslikOzellik;
    do {
      tamFarkli = { renk: celdiriciRng.pick(RENKLER), sekil: celdiriciRng.pick(SEKILLER) };
    } while (kullanilanOzellikler.has(`${tamFarkli.renk}|${tamFarkli.sekil}`));
    yanlisOzellikler.push(tamFarkli);
    kullanilanOzellikler.add(`${tamFarkli.renk}|${tamFarkli.sekil}`);
  }

  // Tüm seçenekleri birleştir ve karıştır
  const siraRng = rng.fork('sira');
  const tumSecenekler = [
    { dogru: true, ozellik: referansOzellik },
    ...yanlisOzellikler.map((o) => ({ dogru: false, ozellik: o })),
  ];
  const karistirilmis = siraRng.shuffle(tumSecenekler);

  // Option'ları oluştur
  const options: Option[] = karistirilmis.map((sec, i) => {
    const id = `secenek-${i}`;
    const gorsel: VisualSpec = {
      type: 'sekil',
      sekil: sec.ozellik.sekil,
      renk: sec.ozellik.renk,
    };
    // Tanı etiketi: şekil farklıysa SEKIL_PROTOTIP, yoksa GOREV_ANLASILMADI
    const etiket: HataEtiketi = sec.ozellik.sekil !== referansOzellik.sekil
      ? HATA_ETIKETLERI.SEKIL_PROTOTIP
      : HATA_ETIKETLERI.GOREV_ANLASILMADI;

    return sec.dogru
      ? { id, deger: { tur: 'gorsel', gorsel }, correct: true }
      : { id, deger: { tur: 'gorsel', gorsel }, correct: false, diagnosticTag: etiket };
  });

  const dogruOptionId = options.find((o) => 'correct' in o && o.correct)?.id ?? options[0].id;

  // Referans görseli — prompt'ta gösterilir
  const referansGorsel: VisualSpec = {
    type: 'sekil',
    sekil: referansSekil,
    renk: referansRenk,
  };

  // Asset'ler
  const assets: readonly AssetSpec[] = [
    { id: 'referans', rol: 'sahne', gorsel: referansGorsel, erisimBolgesi: 'serbest' },
    ...options.map((o, i) => ({
      id: `secenek-${i}`,
      rol: 'secenek' as const,
      gorsel: (o.deger as { tur: 'gorsel'; gorsel: VisualSpec }).gorsel,
      erisimBolgesi: 'alt65' as const,
    })),
  ];

  // Prompt
  const prompt: Prompt = {
    ses: { kind: 'key', key: 'eslik.hangisi-ayni' },
    gorsel: referansGorsel,
  };

  // Hints
  const hints = varsayilanIpuclari({
    talimatSesi: { kind: 'key', key: 'eslik.hangisi-ayni' },
    k2Ses: { kind: 'key', key: 'yardim.k2-eleme' },
    eleOptionIds: options.filter((o) => !('correct' in o && o.correct)).map((o) => o.id).slice(0, 1),
    vurgulaIds: [dogruOptionId],
  });

  return {
    kind: 'AUDIO_TO_IMAGE',
    itemId: makeItemId(ESLIK_TEMPLATE_ID, seed, `${referansRenk}|${referansSekil}`),
    templateId: ESLIK_TEMPLATE_ID,
    skillIds: ['mat.uzam.eslik'] as readonly SkillId[],
    kazanimKodlari: ['MAT.1.3.2'] as readonly KazanimKodu[],
    readingLoad: 0,
    difficulty,
    estimatedSec: 12,
    prompt,
    hints,
    assets,
    options,
    validation: {
      mod: 'tekSecim',
      dogruOptionId,
    },
    seed,
  };
}

// ---------------------------------------------------------------- generator

export const eslikGenerator: ExerciseGenerator<EslikParams> = {
  templateId: ESLIK_TEMPLATE_ID,
  kind: 'AUDIO_TO_IMAGE',
  karsilananKazanimlar: ['MAT.1.3.2'],
  karsilananSkillIds: ['mat.uzam.eslik'],
  readingLoad: 0,
  zorlukAraligi: [1, 5],
  uretebildigiHatalar: [HATA_ETIKETLERI.SEKIL_PROTOTIP, HATA_ETIKETLERI.GOREV_ANLASILMADI],
  uret: eslikUret,
};
