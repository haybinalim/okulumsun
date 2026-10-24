/**
 * KÂĞIT YÖNERGELERİ — basılı kâğıdın ayrı metin kaynağı (KG-99). SAF.
 *
 * Kâğıt yönergesi ekrandaki ses klibinden türetilir (`sesMetni`), ama ekran yönergesi dokunmatik ekrana göre
 * yazılmıştır: "Nesnelere dokunarak say.", "Sesi dinle, rakamı seç." Kâğıtta çocuk kalemle çalışır, öğretmen
 * yönergeyi sesli okur; "dokun", "sürükle", "dinle", "kartına dokun" gibi ekran fiilleri olmamalı.
 *
 * Bu modül aynı ses anahtarları için KÂĞIDA ÖZGÜ metni verir; `tr.json` (ekran ve ses) değişmez, yeni ses anahtarı
 * yoktur. `kagitSozlugu(tr)` ekran sözlüğünün üstüne bu metinleri koyar ve kâğıt planı (çalışma kâğıdı, arşiv,
 * etki Form A/B) yönergeyi bu sözlükle kurar. Metinler MEB 1. sınıf kâğıt diline göre kısa, tek eylemli ve
 * kalemle yapılabilir. Yanıt biçiminin eylemi ("Cevabı kutuya yaz.") ayrıca `EYLEM_METNI`'nden gelir.
 */

import type { HataEtiketi } from '../../exercises/distractors';

/** Ses anahtarı → kâğıt metni. Yalnız ekran fiili taşıyan ya da ekrana göre kurulmuş anahtarlar. */
export const KAGIT_YONERGE_METINLERI: Readonly<Record<string, string>> = {
  'soru.dokunarak-say': 'Nesneleri parmağınla göstererek say.',
  'soru.sayiyi-sec': 'Doğru sayıyı bul.',
  'soru-rakam.dinle-sec': 'Söylenen rakamı bul.',
  'soru-islem.hikaye-dinle': 'Okunan hikâyeye göre cevapla.',
  'soru-yonerge.hedefe-git': 'Hedefe ulaşmak için adımları sırala.',
  'soru-yonerge.dinle-ve-uygula': 'Yönergeyi uygula.',
};

/**
 * Cevap anahtarındaki telafi önerilerinin kâğıt metni (öğretmen için; `HATA_TANIMLARI.telafi` ekrana göre yazılmıştı:
 * "her nesneye bir kez dokun"). Kâğıtta sınıf içi somut eylem: parmakla göstermek. Burada olmayan etiket aynen kalır.
 */
export const KAGIT_TELAFI_METINLERI: Readonly<Partial<Record<HataEtiketi, string>>> = {
  FAZLA_SAYMA: 'Parmakla göstererek sayma; her nesneyi bir kez göster, sayılanı işaretle.',
  EKSIK_SAYMA: 'Nesneleri sıraya dizip soldan sağa parmakla göstererek sayma.',
  BIREBIR_ESLESME: 'Yavaş tempoda, parmakla göstererek ve sesli sayma.',
  HEPSINI_SAYMA: 'Büyük sayıyı "avucunda tut", üstüne say.',
};

/**
 * Kâğıtta bulunmaması gereken ekran fiilleri (kara liste; birim test ve geliştirme denetimi). Sözcük başı ya da
 * içi; Türkçe ekler serbest ("dokunarak", "sürükle", "dinleyerek", "tıkla").
 */
export const EKRAN_FIILLERI: readonly RegExp[] = [
  /dokun/i,
  /sürükl/i,
  /dinle/i,
  /tıkla/i,
  /kaydır/i,
  /basılı tut/i,
  /\bbas(arak|ın)?\b/i,
  /ekran/i,
  /kartına/i,
  /düğme/i,
];

/** Metinde geçen ekran fiilleri (boş dizi = temiz). */
export function ekranFiilleri(metin: string): string[] {
  return EKRAN_FIILLERI.filter((r) => r.test(metin)).map((r) => r.source);
}

/** Kâğıt sözlüğü: ekran sözlüğü + kâğıda özgü yönergeler (ekran sözlüğü değiştirilmez). */
export function kagitSozlugu(tr: Readonly<Record<string, string>>): Readonly<Record<string, string>> {
  return { ...tr, ...KAGIT_YONERGE_METINLERI };
}
