/**
 * ALIŞTIRMA (Exercise) SINIR ŞEMASI.
 *
 * TEK GERÇEK KAYNAĞI: **`src/exercises/types.ts`**. Exercise nesneleri kod
 * tarafından üretilir; doğruluğu derleme zamanında denetlenmelidir. Bu dosya
 * o tiplerin AYNASIDIR, rakibi değil.
 *
 * Aynanın gerçekten tuttuğu DERLEME ZAMANINDA kanıtlanır:
 *   1. `ExerciseSchema`in `.superRefine` gövdesi, çözümlenmiş değeri
 *      `alistirmaIhlalleri(ex: Exercise)` fonksiyonuna geçirir. Şema tipten
 *      saparsa bu çağrı derlenmez.
 *   2. Dosyanın sonundaki `_SemaExerciseIleUyumlu` tip iddiası aynı şeyi açıkça
 *      söyler ve hata mesajında görünür.
 * Yani `types.ts` içinde bir alan değiştirdiğinizde burası KIRILIR — sessizce
 * ayrışmaz.
 *
 * NEREDE KULLANILIR: üretim yolunda DEĞİL. Jeneratörler her soruda Zod
 * çalıştırmaz (gereksiz maliyet, üstelik derleyici zaten güvence veriyor).
 * Bu şema şurada çalışır:
 *   · elle yazılmış / kaydedilmiş soru fixture'larını okurken,
 *   · IndexedDB'den eski sürüm bir kaydı geri yüklerken,
 *   · testlerde jeneratör çıktısını bağımsız bir kanaldan denetlerken.
 */

import { z } from 'zod';
import { AUDIO_MANIFEST } from '../../audio/audioManifest.generated';
import type { SpeechKey } from '../../audio/audioManifest.generated';
import type { SpeakSource } from '../../audio/speech';
import { TUM_HATA_ETIKETLERI, type HataEtiketi } from '../../exercises/distractors';
import {
  COCUK_MATEMATIK_EYLEMLERI,
  INTERACTION_KINDS,
  KONUM_ILISKILERI,
  KONUM_REFERANSLARI,
  NESNE_SPRITELARI,
  OGRETIMSEL_TEMSIL_KANITLARI,
  RENKLER,
  SEKILLER,
  YON_KART_YONLER,
  alistirmaIhlalleri,
} from '../../exercises/types';
import type { Exercise, ItemId, VisualSpec } from '../../exercises/types';
import { KazanimKoduSchema } from './kazanim';
import { SkillIdSchema } from './skill';

// ------------------------------------------------------------ atomik şemalar

/**
 * Ses anahtarı. Sabit bir liste yerine ÜRETİLMİŞ MANİFESTOYA bakar: klip
 * dosyası gerçekten var mı diye. Manifestoya bir klip eklendiğinde bu şema
 * kendiliğinden günceldir.
 */
export const SpeechKeySchema = z.custom<SpeechKey>(
  (v) => typeof v === 'string' && Object.prototype.hasOwnProperty.call(AUDIO_MANIFEST, v),
  { message: 'Bilinmeyen ses anahtarı — audioManifest.generated.ts içinde yok.' },
);

export const SpeakSourceSchema: z.ZodType<SpeakSource> = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('key'), key: SpeechKeySchema }),
  z.object({
    kind: z.literal('sequence'),
    keys: z.array(SpeechKeySchema).min(1),
    gapMs: z.number().nonnegative().optional(),
  }),
]);

/** itemId markalı tiptir; tek üreticisi `makeItemId`. Burada markayı geri veriyoruz. */
const ItemIdSchema = z
  .string()
  .min(1)
  .transform((v) => v as ItemId);

const ReadingLoadSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

const DifficultySchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

const HataEtiketiSchema = z.enum(
  TUM_HATA_ETIKETLERI as unknown as [HataEtiketi, ...HataEtiketi[]],
);

const NesneSpriteSchema = z.enum(NESNE_SPRITELARI);
const RenkSchema = z.enum(RENKLER);
const SekilAdiSchema = z.enum(SEKILLER);
const SekilKategorisiSchema = z.union([z.literal('yuvarlak'), z.literal('koseli')]);

/** MAT.1.1.9 — yalnız banknot. Literaller tek tek yazılıyor ki tip daralsın. */
const BanknotDegeriSchema = z.union([
  z.literal(1),
  z.literal(5),
  z.literal(10),
  z.literal(20),
  z.literal(50),
  z.literal(100),
  z.literal(200),
]);

const NoktaSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

const BolgeSchema = z.discriminatedUnion('sekil', [
  z.object({
    sekil: z.literal('daire'),
    cx: z.number(),
    cy: z.number(),
    r: z.number().positive(),
  }),
  z.object({
    sekil: z.literal('dikdortgen'),
    x: z.number(),
    y: z.number(),
    w: z.number().positive(),
    h: z.number().positive(),
  }),
]);

// ------------------------------------------------------- görsel spesifikasyon

/**
 * `VisualSpec` özyinelemelidir (`sahne` ve `oruntu` dalları kendi içinde görsel
 * taşır), o yüzden `z.lazy` + açık tip açıklaması gerekiyor. Diziler
 * `.readonly()` ile işaretli: `VisualSpec` alanları da `readonly` ve tipin
 * birebir tutması bu açıklamanın geçerli olmasının şartı.
 */
export const VisualSpecSchema: z.ZodType<VisualSpec> = z.lazy(() =>
  z.discriminatedUnion('type', [
    z.object({
      type: z.literal('nesneKumesi'),
      sprite: NesneSpriteSchema,
      adet: z.number().int().nonnegative(),
      layout: z.union([
        z.literal('sira'),
        z.literal('gruplu'),
        z.literal('onlukCerceve'),
        z.literal('dagınık'),
      ]),
      konumlar: z.array(NoktaSchema).readonly().optional(),
      renk: RenkSchema.optional(),
    }),
    z.object({
      type: z.literal('onlukCerceve'),
      // Her grup 0..10 arası dolu göz. [10, 3] = 13.
      gruplar: z.array(z.number().int().min(0).max(10)).readonly(),
    }),
    z.object({
      type: z.literal('sayiDogrusu'),
      bas: z.number().int(),
      son: z.number().int(),
      adim: z.number().int().positive(),
      isaretli: z.array(z.number().int()).readonly(),
      eksik: z.array(z.number().int()).readonly(),
    }),
    z.object({
      type: z.literal('sekil'),
      sekil: SekilAdiSchema,
      renk: RenkSchema.optional(),
      donusDerece: z.number().optional(),
      olcek: z.number().positive().optional(),
    }),
    z.object({ type: z.literal('rakam'), sayi: z.number().int() }),
    z.object({ type: z.literal('banknot'), deger: BanknotDegeriSchema }),
    z.object({
      type: z.literal('islemSahnesi'),
      nesne: NesneSpriteSchema,
      ilkAdet: z.number().int().positive(),
      degisimAdedi: z.number().int().positive(),
      islem: z.union([z.literal('+'), z.literal('-')]),
      renk: RenkSchema.optional(),
    }),
    z.object({
      type: z.literal('islemKarti'),
      ilkSayi: z.number().int().min(0).max(20),
      ikinciSayi: z.number().int().min(0).max(20),
      sonuc: z.number().int().min(0).max(20),
      islem: z.union([z.literal('+'), z.literal('-')]),
    }),
    z.object({
      type: z.literal('olcumSahnesi'),
      nesne: NesneSpriteSchema,
      birim: NesneSpriteSchema,
      birimAdedi: z.number().int().positive(),
      boyut: z.literal('uzunluk'),
      gorunum: z.union([z.literal('birimlerleOlcum'), z.literal('tahmin')]),
      renk: RenkSchema.optional(),
    }),
    z.object({
      type: z.literal('olcumKarsilastirma'),
      boyut: z.union([z.literal('uzunluk'), z.literal('kutle')]),
      sol: z.object({
        nesne: NesneSpriteSchema,
        renk: RenkSchema,
        deger: z.number().int().positive(),
      }),
      sag: z.object({
        nesne: NesneSpriteSchema,
        renk: RenkSchema,
        deger: z.number().int().positive(),
      }),
    }),
    z.object({
      type: z.literal('oruntu'),
      ogeler: z.array(VisualSpecSchema).readonly(),
      eksikIndeksler: z.array(z.number().int().nonnegative()).readonly(),
    }),
    z.object({
      type: z.literal('yonKarti'),
      yon: z.enum(YON_KART_YONLER),
      adim: z.number().int().min(1).max(5),
    }),
    z.object({
      type: z.literal('konumSahnesi'),
      iliski: z.enum(KONUM_ILISKILERI),
      hedef: NesneSpriteSchema,
      referans: z.enum(KONUM_REFERANSLARI),
    }),
    z.object({
      type: z.literal('sahne'),
      parcalar: z
        .array(z.object({ gorsel: VisualSpecSchema, konum: NoktaSchema }))
        .readonly(),
    }),
  ]),
);

export const AssetSpecSchema = z.object({
  id: z.string().min(1),
  rol: z.union([
    z.literal('sahne'),
    z.literal('secenek'),
    z.literal('ipucu'),
    z.literal('gerecKutusu'),
  ]),
  gorsel: VisualSpecSchema,
  erisimBolgesi: z.union([z.literal('alt65'), z.literal('serbest')]).optional(),
});

// ---------------------------------------------------------------- şık şeması

export const OptionDegerSchema = z.discriminatedUnion('tur', [
  z.object({ tur: z.literal('sayi'), sayi: z.number().int() }),
  z.object({ tur: z.literal('gorsel'), gorsel: VisualSpecSchema }),
  z.object({ tur: z.literal('sekil'), sekil: SekilAdiSchema }),
  z.object({ tur: z.literal('sekilKategorisi'), kategori: SekilKategorisiSchema }),
  z.object({ tur: z.literal('banknot'), deger: BanknotDegeriSchema }),
  z.object({
    tur: z.literal('terim'),
    // Karşılaştırma TERİMLE yapılır; `<` `>` `=` sembolleri 1. sınıfta yok.
    terim: z.union([
      z.literal('cok'),
      z.literal('daha-cok'),
      z.literal('az'),
      z.literal('daha-az'),
      z.literal('esit'),
    ]),
  }),
  z.object({ tur: z.literal('metin'), metin: z.string().min(1) }),
]);

const SikOrtakAlanlar = {
  id: z.string().min(1),
  deger: OptionDegerSchema,
  ses: SpeakSourceSchema.optional(),
};

/**
 * DOĞRU şık: `diagnosticTag` alanı YOKTUR (yazılırsa şema reddeder).
 * Kural `types.ts` içinde tip düzeyinde de zorlanıyor; burası JSON'dan gelen
 * veriye karşı ikinci hat.
 */
const DogruSikSchema = z.strictObject({
  ...SikOrtakAlanlar,
  correct: z.literal(true),
});

/** YANLIŞ şık: tanı etiketi taşır — hangi zihinsel modeli temsil ettiğini söyler. */
const YanlisSikSchema = z.strictObject({
  ...SikOrtakAlanlar,
  correct: z.literal(false).optional(),
  diagnosticTag: HataEtiketiSchema.optional(),
});

export const OptionSchema = z.union([DogruSikSchema, YanlisSikSchema]);

export const HotspotOptionSchema = z.union([
  DogruSikSchema.extend({ bolge: BolgeSchema }),
  YanlisSikSchema.extend({ bolge: BolgeSchema }),
]);

const TarafSchema = z.union([z.literal('sol'), z.literal('sag')]);

export const EslesmeKartiSchema = z.union([
  DogruSikSchema.extend({ taraf: TarafSchema }),
  YanlisSikSchema.extend({ taraf: TarafSchema }),
]);

/** `OptionDeger` ayrımcısının kendisi — yuvanın hangi türü kabul ettiğini söyler. */
const OptionDegerTuruSchema = z.union([
  z.literal('sayi'),
  z.literal('gorsel'),
  z.literal('sekil'),
  z.literal('sekilKategorisi'),
  z.literal('banknot'),
  z.literal('terim'),
  z.literal('metin'),
]);

export const YuvaSchema = z.object({
  id: z.string().min(1),
  konum: NoktaSchema,
  bekleyen: OptionDegerTuruSchema.optional(),
});

// ------------------------------------------------------------ doğrulama şemaları

export const TekSecimValidationSchema = z.object({
  mod: z.literal('tekSecim'),
  dogruOptionId: z.string().min(1),
});

export const SayimValidationSchema = z.object({
  mod: z.literal('sayim'),
  beklenenAdet: z.number().int().nonnegative(),
  hedefIds: z.array(z.string().min(1)),
  herNesneBirKez: z.boolean(),
  cevapSecimi: z.union([z.literal('sayac'), z.literal('secenek')]),
  dogruOptionId: z.string().min(1).optional(),
});

export const YerlesimValidationSchema = z.object({
  mod: z.literal('yerlesim'),
  dogruEslesme: z.record(z.string(), z.string()),
  siraOnemli: z.boolean(),
});

export const EslestirmeValidationSchema = z.object({
  mod: z.literal('eslestirme'),
  ciftler: z.array(z.tuple([z.string().min(1), z.string().min(1)])),
});

export const SiralamaValidationSchema = z.object({
  mod: z.literal('siralama'),
  dogruSira: z.array(z.string().min(1)).min(2),
});

export const HotspotValidationSchema = z.object({
  mod: z.literal('hotspot'),
  dogruHotspotIds: z.array(z.string().min(1)).min(1),
  hepsiGerekli: z.boolean(),
});

export const SayiDogrusuValidationSchema = z.object({
  mod: z.literal('sayiDogrusu'),
  dogruDeger: z.number(),
  tolerans: z.number().nonnegative(),
});

// -------------------------------------------------------------- yardım şeması

export const HintSchema = z.object({
  kademe: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  ses: SpeakSourceSchema,
  eleOptionIds: z.array(z.string()).optional(),
  vurgulaIds: z.array(z.string()).optional(),
  gorsel: VisualSpecSchema.optional(),
  hareket: z
    .union([
      z.literal('isaretParmagi'),
      z.literal('nabiz'),
      z.literal('sirayaSay'),
      z.literal('yok'),
    ])
    .optional(),
  cevabiGoster: z.boolean().optional(),
});

/** Tam olarak ÜÇ kademe — eksiği de fazlası da reddedilir. */
export const HintSetSchema = z.tuple([HintSchema, HintSchema, HintSchema]);

export const PromptSchema = z.object({
  ses: SpeakSourceSchema,
  tekrarSes: SpeakSourceSchema.optional(),
  gorsel: VisualSpecSchema.optional(),
  metin: z.string().optional(),
});

/** Pilot şablonlarda görsel kanıt, çocuk eylemi ve hata desteği bildirimi. */
export const OgretimselSozlesmeSchema = z.object({
  hedefBeceri: SkillIdSchema,
  temsilKaniti: z.enum(OGRETIMSEL_TEMSIL_KANITLARI),
  cocukEylemi: z.enum(COCUK_MATEMATIK_EYLEMLERI),
  hataDestekEtiketleri: z.array(HataEtiketiSchema).min(1).readonly(),
});

// ------------------------------------------------------------ alıştırma şeması

const ExerciseBaseSchema = z.object({
  itemId: ItemIdSchema,
  templateId: z.string().min(1),
  skillIds: z.array(SkillIdSchema).min(1),
  kazanimKodlari: z.array(KazanimKoduSchema).min(1),
  readingLoad: ReadingLoadSchema,
  difficulty: DifficultySchema,
  estimatedSec: z.number().positive(),
  prompt: PromptSchema,
  hints: HintSetSchema,
  ogretimselSozlesme: OgretimselSozlesmeSchema.optional(),
  assets: z.array(AssetSpecSchema),
  seed: z.number().int(),
});

const ExerciseUnionSchema = z.discriminatedUnion('kind', [
  ExerciseBaseSchema.extend({
    kind: z.literal('AUDIO_TO_IMAGE'),
    options: z.array(OptionSchema).min(2),
    validation: TekSecimValidationSchema,
  }),
  ExerciseBaseSchema.extend({
    kind: z.literal('TAP_COUNT'),
    options: z.array(OptionSchema),
    validation: SayimValidationSchema,
  }),
  ExerciseBaseSchema.extend({
    kind: z.literal('TAP_TO_PLACE'),
    options: z.array(OptionSchema).min(1),
    yuvalar: z.array(YuvaSchema).min(1),
    validation: YerlesimValidationSchema,
  }),
  ExerciseBaseSchema.extend({
    kind: z.literal('MATCH_PAIRS'),
    options: z.array(EslesmeKartiSchema).min(2),
    validation: EslestirmeValidationSchema,
  }),
  ExerciseBaseSchema.extend({
    kind: z.literal('SEQUENCE_ORDER'),
    options: z.array(OptionSchema).min(2),
    validation: SiralamaValidationSchema,
  }),
  ExerciseBaseSchema.extend({
    kind: z.literal('HOTSPOT_FIND'),
    options: z.array(HotspotOptionSchema).min(1),
    validation: HotspotValidationSchema,
  }),
  ExerciseBaseSchema.extend({
    kind: z.literal('NUMBER_LINE'),
    options: z.array(OptionSchema),
    validation: SayiDogrusuValidationSchema,
  }),
]);

/**
 * Tam alıştırma şeması + çapraz alan denetimleri.
 *
 * `alistirmaIhlalleri` çağrısı BİLEREK buradadır: `types.ts` içindeki ürün
 * kısıtı denetimlerini tekrar yazmak yerine yeniden kullanıyoruz. Aynı zamanda
 * şemanın `Exercise` tipiyle uyumunu derleme zamanında kanıtlıyor — çözümlenmiş
 * değer `Exercise` olarak kabul edilemezse bu satır derlenmez.
 */
export const ExerciseSchema = ExerciseUnionSchema.superRefine((ex, ctx) => {
  for (const ihlal of alistirmaIhlalleri(ex)) {
    ctx.addIssue({ code: 'custom', message: ihlal });
  }

  const idler = new Set(ex.options.map((o) => o.id));

  // Doğrulamanın gösterdiği şık/hedef kimlikleri gerçekten var olmalı.
  switch (ex.validation.mod) {
    case 'tekSecim': {
      if (!idler.has(ex.validation.dogruOptionId)) {
        ctx.addIssue({
          code: 'custom',
          message: `dogruOptionId '${ex.validation.dogruOptionId}' şıklar arasında yok.`,
        });
      }
      const dogruSayisi = ex.options.filter((o) => o.correct === true).length;
      if (dogruSayisi !== 1) {
        ctx.addIssue({
          code: 'custom',
          message: `Tek seçimli soruda ${dogruSayisi} doğru şık var; tam olarak 1 olmalı.`,
        });
      }
      break;
    }
    case 'sayim': {
      if (ex.validation.cevapSecimi === 'secenek' && ex.validation.dogruOptionId == null) {
        ctx.addIssue({
          code: 'custom',
          message: "cevapSecimi 'secenek' ama dogruOptionId verilmemiş.",
        });
      }
      if (ex.validation.hedefIds.length !== ex.validation.beklenenAdet) {
        ctx.addIssue({
          code: 'custom',
          message: `Dokunulacak hedef sayısı (${ex.validation.hedefIds.length}) beklenen adetle (${ex.validation.beklenenAdet}) uyuşmuyor.`,
        });
      }
      break;
    }
    case 'siralama': {
      for (const id of ex.validation.dogruSira) {
        if (!idler.has(id)) {
          ctx.addIssue({ code: 'custom', message: `dogruSira '${id}' şıklar arasında yok.` });
        }
      }
      if (ex.validation.dogruSira.length !== ex.options.length) {
        ctx.addIssue({
          code: 'custom',
          message: 'dogruSira tüm şıkları kapsamalı.',
        });
      }
      break;
    }
    case 'eslestirme': {
      for (const [sol, sag] of ex.validation.ciftler) {
        if (!idler.has(sol) || !idler.has(sag)) {
          ctx.addIssue({
            code: 'custom',
            message: `Eşleştirme çifti (${sol}, ${sag}) şıklarda bulunamadı.`,
          });
        }
      }
      break;
    }
    case 'hotspot': {
      for (const id of ex.validation.dogruHotspotIds) {
        if (!idler.has(id)) {
          ctx.addIssue({ code: 'custom', message: `Hotspot '${id}' şıklar arasında yok.` });
        }
      }
      break;
    }
    case 'yerlesim': {
      // İç içe ayrımcıya (validation.mod) göre daralma DIŞ birleşimi daraltmaz;
      // `yuvalar` alanını görebilmek için `kind` üzerinden daraltıyoruz.
      if (ex.kind !== 'TAP_TO_PLACE') break;
      const yuvaIdler = new Set(ex.yuvalar.map((y) => y.id));
      for (const [yuvaId, optionId] of Object.entries(ex.validation.dogruEslesme)) {
        if (!yuvaIdler.has(yuvaId)) {
          ctx.addIssue({ code: 'custom', message: `Yuva '${yuvaId}' tanımlı değil.` });
        }
        if (!idler.has(optionId)) {
          ctx.addIssue({ code: 'custom', message: `Yerleştirilecek şık '${optionId}' yok.` });
        }
      }
      break;
    }
    case 'sayiDogrusu':
      // Sayı doğrusunun geçerli aralığı sahne görselinden gelir; ayrıca
      // denetlemiyoruz çünkü prompt.gorsel opsiyonel.
      break;
  }
});

export type ExerciseGirdisi = z.input<typeof ExerciseSchema>;
export type ExerciseCiktisi = z.output<typeof ExerciseSchema>;

/**
 * ŞEMA ↔ TİP UYUM İDDİASI.
 *
 * Şemanın çözümlediği değer `Exercise` olarak kullanılabilmelidir. `types.ts`
 * içinde bir alan eklenip burada unutulursa (ya da tersi) bu satır derleme
 * hatası verir — iki katman sessizce ayrışamaz.
 * Köşeli parantezler dağıtımı (distributive conditional) engelliyor: birleşimin
 * TAMAMI tek seferde denetlensin, hata "boolean" olarak bulanıklaşmasın.
 */
type Bekle<T extends true> = T;
export type _SemaExerciseIleUyumlu = Bekle<
  [ExerciseCiktisi] extends [Exercise] ? true : false
>;

/** Etkileşim primitifi adı — `types.ts` listesinden türetilir, elle yazılmaz. */
export const InteractionKindSchema = z.enum(INTERACTION_KINDS);

/**
 * Ham veriyi doğrular ve `Exercise` olarak döndürür.
 * Fixture yükleme ve kayıt geri yükleme yolunda kullanın; jeneratör çıktısını
 * üretimde bundan geçirmeyin (gereksiz maliyet — tip zaten garanti ediyor).
 */
export function alistirmaAyristir(veri: unknown): Exercise {
  const sonuc = ExerciseSchema.safeParse(veri);
  if (!sonuc.success) {
    const satirlar = sonuc.error.issues.map(
      (i) => `  · ${i.path.join('.') || '(kök)'}: ${i.message}`,
    );
    throw new Error(`Alıştırma doğrulanamadı:\n${satirlar.join('\n')}`);
  }
  return sonuc.data;
}

/** Fırlatmayan sürüm — testlerde ve toplu denetimde kullanışlı. */
export function alistirmaGecerliMi(
  veri: unknown,
): { gecerli: true; alistirma: Exercise } | { gecerli: false; hatalar: string[] } {
  const sonuc = ExerciseSchema.safeParse(veri);
  if (sonuc.success) return { gecerli: true, alistirma: sonuc.data };
  return {
    gecerli: false,
    hatalar: sonuc.error.issues.map((i) => `${i.path.join('.') || '(kök)'}: ${i.message}`),
  };
}
