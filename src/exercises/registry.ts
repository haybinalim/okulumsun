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
import { KONUM_TEMPLATE_ID, konumGenerator } from './templates/konum';
import { ESLIK_TEMPLATE_ID, eslikGenerator } from './templates/eslik';
import { YONERGE_TEMPLATE_ID, yonergeGenerator } from './templates/yonerge';
import { RAKAM_TANI_TEMPLATE_ID, rakamTaniGenerator } from './templates/rakamTani';
import { SIPSAK_TEMPLATE_ID, sipsakGenerator } from './templates/sipsak';
import { SIRA_SAYI_TEMPLATE_ID, siraSayiGenerator } from './templates/siraSayi';
import { TAHMIN_MIKTAR_TEMPLATE_ID, tahminMiktarGenerator } from './templates/tahminMiktar';
import { ONLUK_COZUMLE_TEMPLATE_ID, onlukCozumleGenerator } from './templates/onlukCozumle';
import { ORUNTU_SAYI_TEMPLATE_ID, oruntuSayiGenerator } from './templates/oruntuSayi';
import { ORUNTU_SEKIL_TEMPLATE_ID, oruntuSekilGenerator } from './templates/oruntuSekil';
import { TOPLA_SEMBOL_TEMPLATE_ID, toplaSembolGenerator } from './templates/toplaSembol';
import { CIKAR_GORSEL_TEMPLATE_ID, cikarGorselGenerator } from './templates/cikarGorsel';
import { CIKAR_SEMBOL_TEMPLATE_ID, cikarSembolGenerator } from './templates/cikarSembol';
import { TAHMIN_ISLEM_TEMPLATE_ID, tahminIslemGenerator } from './templates/tahminIslem';
import { ISLEM_HIKAYE_TEMPLATE_ID, islemHikayeGenerator } from './templates/islemHikaye';
import { TOPLA_ONA_TUMLE_TEMPLATE_ID, toplaOnaTumleGenerator } from './templates/toplaOnaTumle';
import { ESIT_DENGE_TEMPLATE_ID, esitDengeGenerator } from './templates/esitDenge';
import { EKSIK_TOPLANAN_TEMPLATE_ID, eksikToplananGenerator } from './templates/eksikToplanan';
import { TERS_ISLEM_TEMPLATE_ID, tersIslemGenerator } from './templates/tersIslem';

export const REGISTRY: ReadonlyMap<TemplateId, ExerciseGenerator> = new Map([
  [M_SAY_TEMPLATE_ID, saySablonu],
  [KARSILASTIR_TEMPLATE_ID, karsilastirGenerator],
  [RITMIK_TEMPLATE_ID, M_RITMIK],
  [TOPLA_GORSEL_TEMPLATE_ID, toplaGorselJeneratoru],
  [KONUM_TEMPLATE_ID, konumGenerator],
  [ESLIK_TEMPLATE_ID, eslikGenerator],
  [YONERGE_TEMPLATE_ID, yonergeGenerator],
  [RAKAM_TANI_TEMPLATE_ID, rakamTaniGenerator],
  [SIPSAK_TEMPLATE_ID, sipsakGenerator],
  [SIRA_SAYI_TEMPLATE_ID, siraSayiGenerator],
  [TAHMIN_MIKTAR_TEMPLATE_ID, tahminMiktarGenerator],
  [ONLUK_COZUMLE_TEMPLATE_ID, onlukCozumleGenerator],
  [ORUNTU_SAYI_TEMPLATE_ID, oruntuSayiGenerator],
  [ORUNTU_SEKIL_TEMPLATE_ID, oruntuSekilGenerator],
  [TOPLA_SEMBOL_TEMPLATE_ID, toplaSembolGenerator],
  [CIKAR_GORSEL_TEMPLATE_ID, cikarGorselGenerator],
  [CIKAR_SEMBOL_TEMPLATE_ID, cikarSembolGenerator],
  [TAHMIN_ISLEM_TEMPLATE_ID, tahminIslemGenerator],
  [ISLEM_HIKAYE_TEMPLATE_ID, islemHikayeGenerator],
  [TOPLA_ONA_TUMLE_TEMPLATE_ID, toplaOnaTumleGenerator],
  [ESIT_DENGE_TEMPLATE_ID, esitDengeGenerator],
  [EKSIK_TOPLANAN_TEMPLATE_ID, eksikToplananGenerator],
  [TERS_ISLEM_TEMPLATE_ID, tersIslemGenerator],
]);
