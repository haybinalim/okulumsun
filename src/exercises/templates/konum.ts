/**
 * M-KONUM — KONUM BİLDİREN İFADELERİ ANLAMA
 * ====================================================================
 *
 * KAZANIM: MAT.1.3.1 — "Hedefe ulaşmak için mesafeleri ve yönleri içeren
 * yönergeleri çözümleyebilme"
 *
 * Süreç bileşeni (a): "Yönergede yer alan mesafe ve yönleri içeren kavramları
 * belirler."
 *
 * Bu şablon (a)'yı ölçer: çocuk bir konum ifadesini dinler (ör. "altında"),
 *然后 doğru sahneyi seçer. Her sahne bir nesne ve bir referans nesnesi içerir;
 * doğru sahne'de hedef nesne söylenen konumda durur.
 *
 * ÖLÇTÜĞÜ MİKRO DÜĞÜMLER (src/content/skills.json):
 *   · mat.uzam.konum-ifadeleri — altında/üstünde/içinde/önünde/arkasında/
 *     arasında/yanında/dışında
 *
 * MÜFREDAT SINIRI: Yön kavramı 1. sınıfta 'ileri' ve 'geri' ile sınırlıdır
 * (SAYFA 40) — bu şablon YÖN DEĞİL KONUM ölçer. Konum ifadeleri: altında,
 * üstünde, etrafında, önünde, arkasında, arasında, yüksekte, alçakta, uzakta,
 * yakında, içinde, dışında, sağında, solunda, çukurda, tümsekte. Bu şablon
 * en yaygın 8'ini kullanır (§4.5 ses envanteriyle uyumlu).
 *
 * ÇELDİRİCİ ETİKETLERİ:
 *   · GOREV_ANLASILMADI — çocuk konum ifadesini karıştırdı (altında↔üstünde)
 *
 * ETKİLEŞİM: AUDIO_TO_IMAGE — sesli talimat dinle, doğru sahneyi seç.
 *   2 veya 3 sahne seçeneği; her biri bir nesne + referans kombinasyonu.
 *
 * SAF VE SENKRON: Date.now(), Math.random(), IndexedDB ÇAĞRILMAZ.
 */

import {
  KONUM_ILISKILERI,
  makeItemId,
  varsayilanIpuclari,
  type Difficulty,
  type KazanimKodu,
  type KonumIliskisi,
  type KonumReferansi,
  type SkillId,
} from '../types';
import type { AudioToImageExercise, ExerciseGenerator, Option, VisualSpec, AssetSpec, Prompt } from '../types';
import type { Rng } from '../rng';
import { HATA_ETIKETLERI, type HataEtiketi } from '../distractors';
import type { NesneSprite } from '../types';
import type { SpeechKey } from '../../audio/audioManifest.generated';

// ---------------------------------------------------------------- sabitler

export const KONUM_TEMPLATE_ID = 'M-KONUM' as const;

/** Konum ifadeleri — §4.5 ses envanteriyle uyumlu. */
export const KONUM_IFADELERI = KONUM_ILISKILERI;

export type KonumIfadesi = KonumIliskisi;

/** Konum → speechKey eşlemesi. */
const KONUM_SPEECH_KEY: Record<KonumIfadesi, SpeechKey> = {
  altinda: 'konum.altinda',
  ustunde: 'konum.ustunde',
  icinde: 'konum.icinde',
  onunde: 'konum.onunde',
  arkasinda: 'konum.arkasinda',
  arasinda: 'konum.arasinda',
  yaninda: 'konum.yaninda',
  disinda: 'konum.disinda',
};

/** Referans nesneleri — çizimde kutu/sepet olarak açıkça temsil edilir. */
const REFERANS_NESNELER: readonly KonumReferansi[] = ['kutu', 'sepet'];

/**
 * Yanlış cevap için konumu çevir — tanısal etiket GOREV_ANLASILMADI.
 * Altında↔üstünde, önünde↔arkasında, içinde↔dışında karıştırmaları en yaygın.
 */
function konumuCevir(konum: KonumIfadesi): KonumIfadesi {
  const cevirim: Record<KonumIfadesi, KonumIfadesi> = {
    altinda: 'ustunde',
    ustunde: 'altinda',
    icinde: 'disinda',
    disinda: 'icinde',
    onunde: 'arkasinda',
    arkasinda: 'onunde',
    arasinda: 'yaninda',
    yaninda: 'arasinda',
  };
  return cevirim[konum];
}

// ---------------------------------------------------------------- params

export interface KonumParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly tercihEdilenSprite?: NesneSprite;
  readonly mod?: 'tahta' | 'kisisel';
}

// ---------------------------------------------------------------- üretim

export function konumUret(params: KonumParams, rng: Rng): AudioToImageExercise {
  const { seed, difficulty } = params;

  // Konum ifadesi seç
  const konumRng = rng.fork('konum');
  const konum = konumRng.pick(KONUM_IFADELERI);

  // Nesne ve referans seç
  const nesneRng = rng.fork('nesne');
  const hedefSprite = nesneRng.pick(['elma', 'top', 'balon', 'kus', 'cicek', 'yildiz'] as readonly NesneSprite[]);
  const referansSprite = nesneRng.pick(REFERANS_NESNELER);

  // Şık sayısı: difficulty 1-2 → 2 şık, 3-4 → 3 şık
  const secenekSayisi = difficulty <= 2 ? 2 : 3;

  // Yanlış sahneleri oluştur
  const celdiriciRng = rng.fork('celdirici');
  const yanlisKonumlar: KonumIfadesi[] = [];
  const kullanilanKonumlar = new Set<KonumIfadesi>([konum]);

  // İlk yanlış: konumun tersi (en tanılayıcı)
  const tersKonum = konumuCevir(konum);
  yanlisKonumlar.push(tersKonum);
  kullanilanKonumlar.add(tersKonum);

  // İkinci yanlış: rastgele farklı konum
  if (secenekSayisi >= 3) {
    const kalanKonumlar = KONUM_IFADELERI.filter((k) => !kullanilanKonumlar.has(k));
    const ekYanlis = celdiriciRng.pick(kalanKonumlar);
    yanlisKonumlar.push(ekYanlis);
    kullanilanKonumlar.add(ekYanlis);
  }

  // Şıkları karıştır
  const siraRng = rng.fork('sira');
  const tumSecenekler = [
    { dogru: true, konum },
    ...yanlisKonumlar.map((k) => ({ dogru: false, konum: k })),
  ];
  const karistirilmis = siraRng.shuffle(tumSecenekler);

  // Option'ları oluştur
  const options: Option[] = karistirilmis.map((sec, i) => {
    const id = `secenek-${i}`;
    // Şık, sesle sorulan ilişkiyi doğrudan taşıyan tek bir görsel sahnedir.
    // Böylece örneğin "dışında" şıkkında nesne mutlaka kutu/sepetin DIŞINDA görünür.
    const gorsel: VisualSpec = {
      type: 'konumSahnesi',
      iliski: sec.konum,
      hedef: hedefSprite,
      referans: referansSprite,
    };
    return sec.dogru
      ? { id, deger: { tur: 'gorsel', gorsel }, correct: true }
      : { id, deger: { tur: 'gorsel', gorsel }, correct: false, diagnosticTag: HATA_ETIKETLERI.GOREV_ANLASILMADI as HataEtiketi };
  });

  const dogruOptionId = options.find((o) => 'correct' in o && o.correct)?.id ?? options[0].id;

  // Asset'ler
  const assets: readonly AssetSpec[] = options.map((o, i) => ({
    id: `sahne-${i}`,
    rol: 'secenek' as const,
    gorsel: (o.deger as { tur: 'gorsel'; gorsel: VisualSpec }).gorsel,
    erisimBolgesi: 'alt65' as const,
  }));

  // Prompt
  const prompt: Prompt = {
    ses: { kind: 'key', key: KONUM_SPEECH_KEY[konum] },
    gorsel: undefined, // Sahne şıklardan oluşur
  };

  // Hints
  const hints = varsayilanIpuclari({
    talimatSesi: { kind: 'key', key: KONUM_SPEECH_KEY[konum] },
    k2Ses: { kind: 'key', key: 'yardim.k2-eleme' },
    eleOptionIds: options.filter((o) => !('correct' in o && o.correct)).map((o) => o.id).slice(0, 1),
    vurgulaIds: [dogruOptionId],
  });

  return {
    kind: 'AUDIO_TO_IMAGE',
    itemId: makeItemId(KONUM_TEMPLATE_ID, seed, konum),
    templateId: KONUM_TEMPLATE_ID,
    skillIds: ['mat.uzam.konum-ifadeleri'] as readonly SkillId[],
    kazanimKodlari: ['MAT.1.3.1'] as readonly KazanimKodu[],
    readingLoad: 0,
    difficulty,
    estimatedSec: 15,
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

export const konumGenerator: ExerciseGenerator<KonumParams> = {
  templateId: KONUM_TEMPLATE_ID,
  kind: 'AUDIO_TO_IMAGE',
  karsilananKazanimlar: ['MAT.1.3.1'],
  karsilananSkillIds: ['mat.uzam.konum-ifadeleri'],
  readingLoad: 0,
  zorlukAraligi: [1, 4],
  uretebildigiHatalar: [HATA_ETIKETLERI.GOREV_ANLASILMADI],
  uret: konumUret,
};
