/**
 * ŞABLON KAYIT DEFTERİ — plan §5.4.
 *
 * Planlayıcı bir `skillId` seçer; soruyu üreten şey budur. Şablon kimliğini
 * jeneratöre bağlayan TEK yerdir. Yeni şablon eklemenin son adımı buraya
 * satır eklemektir (plan §5.5 adım 6).
 *
 * KURALLAR (plan §5.4, hepsi ZORUNLU):
 *  1. Kayıtlı olmayan şablon `assetReady = 0` alır (§6.4) ve motor onu asla
 *     seçmez — yarım şablon uygulamayı kırmaz, yalnız görünmez olur.
 *  2. `validate-content.ts` buradan okur: `durum: "hazir"` düğümün şablonu
 *     defterde yoksa doğrulama KIRILIR.
 *  3. Bir düğümün birden çok şablonu varsa seçim `rng.pick` ile — ama önce
 *     defterde olmayanlar elenir.
 */

import type { ExerciseGenerator, TemplateId } from './types';
import { M_SAY_TEMPLATE_ID, saySablonu } from './templates/say';
import { KARSILASTIR_TEMPLATE_ID, karsilastirGenerator } from './templates/karsilastir';
import { RITMIK_TEMPLATE_ID, M_RITMIK } from './templates/ritmik';
import { TOPLA_GORSEL_TEMPLATE_ID, toplaGorselJeneratoru } from './templates/toplaGorsel';

export const REGISTRY: ReadonlyMap<TemplateId, ExerciseGenerator> = new Map([
  [M_SAY_TEMPLATE_ID, saySablonu],
  [KARSILASTIR_TEMPLATE_ID, karsilastirGenerator],
  [RITMIK_TEMPLATE_ID, M_RITMIK],
  [TOPLA_GORSEL_TEMPLATE_ID, toplaGorselJeneratoru],
]);
