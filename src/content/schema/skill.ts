/**
 * BECERİ DÜĞÜMÜ (SkillNode) ŞEMASI — öğrenme haritasının birimi.
 *
 * TEK GERÇEK KAYNAĞI: SkillNode için Zod ŞEMASI normatiftir ve TypeScript tipi
 * ondan türetilir (`z.infer`). Bunun gerekçesi Exercise'ın tersidir:
 *   · Exercise KOD tarafından üretilir → TypeScript normatif.
 *   · SkillNode ELLE yazılır (öğrenme haritası bir içerik ürünüdür) → Zod normatif.
 * Elle yazılan veriye tek savunma çalışma zamanı doğrulamasıdır; iki paralel
 * tanım tutmak yerine tipi şemadan türetiyoruz. `src/exercises/types.ts` yalnız
 * `SkillId` ve `KazanimKodu` gibi ATOMİK tipleri verir, ikisi de buraya
 * import edilir — çelişki imkânsız.
 *
 * NEDEN MEB kodundan bağımsız kimlik: tek bir kazanım (ör. MAT.1.1.1) birbirinden
 * bağımsız öğrenilen birkaç beceri içerir — rakam tanıma, nesne sayma, sayı ile
 * miktarı eşleme. Çocuk birinde takılıp diğerinde akıcı olabilir. Harita bunları
 * ayrı düğüm tutar; `mebOutcomes` ile resmî kazanıma geri bağlar. Böylece MEB
 * program sürümü değişse bile öğrenme haritası ve ilerleme kayıtları ayakta kalır.
 */

import { z } from 'zod';
import { TUM_HATA_ETIKETLERI, type HataEtiketi } from '../../exercises/distractors';
import type { SkillId } from '../../exercises/types';
import { KazanimKoduSchema } from './kazanim';

/** `mat.<alan>.<beceri>` — küçük harf, nokta ayraçlı, MEB kodundan bağımsız. */
const SKILL_ID_DESENI = /^mat\.[a-z0-9-]+\.[a-z0-9-]+$/;

/**
 * Beceri kimliği. `z.custom` ile şablon-literal tipi korunur; düz `z.string()`
 * olsaydı JSON'dan okunan id `Exercise.skillIds` alanına atanamazdı.
 */
export const SkillIdSchema = z.custom<SkillId>(
  (v) => typeof v === 'string' && SKILL_ID_DESENI.test(v),
  { message: "Geçersiz beceri kimliği — 'mat.<alan>.<beceri>' bekleniyor." },
);

/** Tema numarası (1..7), resmî işleniş sırasıyla. */
export const TemaNoSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
]);
export type TemaNo = z.infer<typeof TemaNoSchema>;

/**
 * Ön koşul kenarı.
 *  · hard    — bu beceri açılmadan sonraki denenmemeli (gerçek bağımlılık).
 *  · soft    — olmadan da denenebilir ama zorlanır (sıralama ipucu).
 *  · related — bağımlılık değil, birlikte çalışılınca pekişen komşu beceri.
 *
 * Ayrım önemli: yalnızca `hard` kenarlar planlayıcıda kilit uygular ve döngü
 * denetimine girer. Her şeyi `hard` yapmak haritayı tek şeritli bir yola çevirir
 * ve çocuğu takıldığı yerde hapseder.
 */
export const OnKosulTuruSchema = z.union([
  z.literal('hard'),
  z.literal('soft'),
  z.literal('related'),
]);

export const PrerequisiteSchema = z.object({
  id: SkillIdSchema,
  type: OnKosulTuruSchema,
});

const HataEtiketiSchema = z.enum(
  TUM_HATA_ETIKETLERI as unknown as [HataEtiketi, ...HataEtiketi[]],
);

export const SkillNodeSchema = z.object({
  /** `mat.<alan>.<beceri>` — MEB kodundan BAĞIMSIZ, kalıcı kimlik. */
  id: SkillIdSchema,

  /** Bu becerinin hizmet ettiği resmî kazanım(lar). Boş olamaz. */
  mebOutcomes: z.array(KazanimKoduSchema).min(1),

  /** Becerinin yaşadığı tema (resmî işleniş sırası numarası). */
  tema: TemaNoSchema,

  /** Yetişkine görünen başlık — öğretmen/veli ekranı, ilerleme raporu. */
  baslik: z.string().min(1),

  /**
   * Çocuğa görünen etiket. Kısa, somut ve SESLENDİRİLEBİLİR olmalı
   * ("Kaç tane?" gibi) — çocuk okuyamadığı için bu metin ekranda tek başına
   * değil, ikonla ve sesle birlikte kullanılır.
   */
  childLabel: z.string().min(1).max(24),

  prerequisites: z.array(PrerequisiteSchema).default([]),

  /** Haritadaki mutlak zorluk (1 en kolay). Şablon içi zorluktan farklıdır. */
  difficulty: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),

  /**
   * Bu beceride ÜRETİLEBİLECEK EN YÜKSEK okuma yükü.
   * Matematik düğümlerinde 0 olmalı: çocuk okuma yazma bilmiyor (ürün kısıtı #1).
   */
  readingLoadCeiling: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),

  /** Bu beceriyi yoklayan şablon kimlikleri (`ExerciseGenerator.templateId`). */
  exerciseTemplates: z.array(z.string().min(1)).default([]),

  /** Bu becerinin ayırt etmeyi hedeflediği kavram yanılgıları. */
  misconceptions: z.array(HataEtiketiSchema).default([]),

  /**
   * Ustalık için gereken kabaca soru sayısı. Planlayıcı oturumu buna göre
   * bölüştürür (SESSION_LENGTH = 8 soru).
   */
  estimatedItemsToMastery: z.number().int().min(1).max(100),

  /** Ön koşulsuz giriş noktası mı — harita buradan açılır. */
  isEntryPoint: z.boolean().optional(),

  /**
   * `hazir`     — şablonları yazılmış, çocuğa gösterilebilir.
   * `planlandi` — haritada yeri var ama henüz soru üretmiyor.
   * Planlayıcı yalnız `hazir` düğümleri sunar; `planlandi` düğümler haritanın
   * bütünlüğü (ön koşul zinciri) için durur.
   */
  durum: z.union([z.literal('hazir'), z.literal('planlandi')]),
});

export type Prerequisite = z.infer<typeof PrerequisiteSchema>;
export type SkillNode = z.infer<typeof SkillNodeSchema>;

/** Öğrenme haritasının tamamı. */
export const SkillGrafiSchema = z.array(SkillNodeSchema);
export type SkillGrafi = z.infer<typeof SkillGrafiSchema>;

/**
 * Grafın BÜTÜNLÜĞÜNÜ denetler. Tek tek düğüm şeması yakalayamayacağı,
 * yalnız bütüne bakınca görülen hataları arar.
 *
 * Dönen dizi boşsa graf sağlam; dolu ise her eleman Türkçe bir ihlal açıklaması.
 * `throw` etmiyor: hem test hem geliştirici aracı aynı işlevi kullanabilsin.
 */
export function skillGrafiniDogrula(dugumler: SkillGrafi): string[] {
  const ihlaller: string[] = [];
  const harita = new Map<string, SkillNode>();

  for (const d of dugumler) {
    if (harita.has(d.id)) ihlaller.push(`Yinelenen beceri kimliği: ${d.id}`);
    harita.set(d.id, d);
  }

  for (const d of dugumler) {
    // Ön koşullar var olan düğümleri göstermeli.
    for (const ok of d.prerequisites) {
      if (!harita.has(ok.id)) {
        ihlaller.push(`${d.id}: ön koşul '${ok.id}' haritada yok.`);
      }
      if (ok.id === d.id) {
        ihlaller.push(`${d.id}: kendisini ön koşul göstermiş.`);
      }
    }

    // Giriş noktasının SERT ön koşulu olamaz — tanım gereği kilitsizdir.
    if (d.isEntryPoint && d.prerequisites.some((p) => p.type === 'hard')) {
      ihlaller.push(`${d.id}: giriş noktası ama sert (hard) ön koşulu var.`);
    }

    // 'hazir' düğüm soru üretebilmeli; üretemiyorsa çocuk boş ekrana bakar.
    if (d.durum === 'hazir' && d.exerciseTemplates.length === 0) {
      ihlaller.push(`${d.id}: durum 'hazir' ama exerciseTemplates boş.`);
    }

    // Matematik düğümünde okuma yükü tavanı 0 olmalı (ürün kısıtı #1).
    if (d.readingLoadCeiling > 0) {
      ihlaller.push(
        `${d.id}: readingLoadCeiling=${d.readingLoadCeiling}. Çocuk okuma yazma bilmiyor; matematikte hedef 0.`,
      );
    }

    // 'hazir' bir düğüm 'planlandi' bir düğüme SERT bağımlı olamaz: zincir kopar.
    for (const ok of d.prerequisites) {
      const hedef = harita.get(ok.id);
      if (ok.type === 'hard' && hedef?.durum === 'planlandi' && d.durum === 'hazir') {
        ihlaller.push(`${d.id}: hazır ama sert ön koşulu '${ok.id}' henüz planlandı durumunda.`);
      }
    }
  }

  // En az bir giriş noktası olmalı, yoksa harita hiç açılmaz.
  if (dugumler.length > 0 && !dugumler.some((d) => d.isEntryPoint)) {
    ihlaller.push('Hiç giriş noktası (isEntryPoint) yok — harita açılamaz.');
  }

  // Sert ön koşullarda döngü olamaz: kilitli düğümler birbirini bekler.
  ihlaller.push(...sertDonguleriBul(harita));

  return ihlaller;
}

/** Yalnız `hard` kenarlar üzerinde derinlik öncelikli döngü araması. */
function sertDonguleriBul(harita: Map<string, SkillNode>): string[] {
  const bulunan: string[] = [];
  const durum = new Map<string, 'islemde' | 'bitti'>();
  const yol: string[] = [];

  const gez = (id: string): void => {
    const mevcut = durum.get(id);
    if (mevcut === 'bitti') return;
    if (mevcut === 'islemde') {
      const baslangic = yol.indexOf(id);
      bulunan.push(`Sert ön koşul döngüsü: ${[...yol.slice(baslangic), id].join(' → ')}`);
      return;
    }
    durum.set(id, 'islemde');
    yol.push(id);
    for (const ok of harita.get(id)?.prerequisites ?? []) {
      if (ok.type === 'hard' && harita.has(ok.id)) gez(ok.id);
    }
    yol.pop();
    durum.set(id, 'bitti');
  };

  for (const id of harita.keys()) gez(id);
  return bulunan;
}

/**
 * Ham veriyi doğrular ve graf bütünlüğünü de denetler.
 * Bozuk bir öğrenme haritası yanlış sırayla ders verir; sessizce geçilemez.
 */
export function skillGrafiniAyristir(veri: unknown): SkillGrafi {
  const sonuc = SkillGrafiSchema.safeParse(veri);
  if (!sonuc.success) {
    const satirlar = sonuc.error.issues.map(
      (i) => `  · ${i.path.join('.') || '(kök)'}: ${i.message}`,
    );
    throw new Error(`Beceri haritası doğrulanamadı:\n${satirlar.join('\n')}`);
  }

  const ihlaller = skillGrafiniDogrula(sonuc.data);
  if (ihlaller.length > 0) {
    throw new Error(`Beceri haritası tutarsız:\n${ihlaller.map((i) => `  · ${i}`).join('\n')}`);
  }
  return sonuc.data;
}

/**
 * Bir düğümün sert ön koşullarının tamamı ustalaşılmışsa açıktır.
 * Planlayıcı sıradaki soruyu seçerken bunu kullanır.
 */
export function dugumAcikMi(
  dugum: SkillNode,
  ustalasilanIdler: ReadonlySet<string>,
): boolean {
  if (dugum.durum !== 'hazir') return false;
  return dugum.prerequisites
    .filter((p) => p.type === 'hard')
    .every((p) => ustalasilanIdler.has(p.id));
}
