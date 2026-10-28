/**
 * GİRİŞ VE DUYURU SESLERİ (plan v2 Adım 31 aşama 2, KG-110) — SAF.
 *
 * Bir akışın açılış cümlesi ("Haydi biraz ısınalım!", "Bugünün etkinlikleri başlıyor.") ayrı bir ekran
 * değil: ilk sorunun talimatının ÖNÜNE eklenir. Böylece iki ekran talimatı birbirini kesmez (ekran
 * değişince konuşma durur) ve çocuk tek akışta duyar: giriş → kısa nefes → soru.
 *
 * Kurallar:
 *  - Giriş tam cümledir (tek klip); sorunun kendi dizisi (sayı/işlem klipleri, `gapMs`) aynen korunur.
 *  - Giriş ile soru arasında `GIRIS_ARASI_MS` (yalnız ilk ara, `ilkAraMs`).
 *  - "Tekrar dinle" ve talimat tekrarı girişi YİNELEMEZ: `tekrarSes` özgün talimat kalır.
 * Saat, rastgelelik, depolama ve ağ yok.
 */
import type { SpeakSource, SpeechKey } from './speech';
import type { Exercise } from '../exercises/types';

/** Giriş cümlesi ile ilk soru talimatı arasındaki ara (ms). Cümle sonu duraklamasının ~2 katı. */
export const GIRIS_ARASI_MS = 450;

/** `kaynak`ın önüne `giris` klibini ekler; kaynağın kendi araları korunur. */
export function girisliKaynak(giris: SpeechKey, kaynak: SpeakSource): SpeakSource {
  if (kaynak.kind === 'key') {
    return { kind: 'sequence', keys: [giris, kaynak.key], ilkAraMs: GIRIS_ARASI_MS };
  }
  const { gapMs } = kaynak;
  return {
    kind: 'sequence',
    keys: [giris, ...kaynak.keys],
    ...(gapMs === undefined ? {} : { gapMs }),
    ilkAraMs: GIRIS_ARASI_MS,
  };
}

/**
 * Sorunun talimatına giriş cümlesi ekler. `giris` null ise soru AYNEN döner (aynı nesne).
 * `tekrarSes` önceki değeri, yoksa özgün `ses` olur: tekrar dinlemede giriş yinelenmez.
 */
export function girisliSoru(exercise: Exercise, giris: SpeechKey | null): Exercise {
  if (giris === null) return exercise;
  const { prompt } = exercise;
  return {
    ...exercise,
    prompt: { ...prompt, ses: girisliKaynak(giris, prompt.ses), tekrarSes: prompt.tekrarSes ?? prompt.ses },
  };
}

/** Bir duyurudan sonra ekranın kendi talimatı (ör. "Bugünkü etkinlikleri bitirdik." → "Bir konu seç."). */
export function duyuruluKaynak(duyuru: SpeechKey | null, kaynak: SpeakSource): SpeakSource {
  return duyuru === null ? kaynak : girisliKaynak(duyuru, kaynak);
}

/**
 * "Üç çiçek ekledin." (Adım 29, PLAN §4.3 birleştirme): sayı klibi + `bahce.bugun`. Sayı bugün tamamlanan
 * oturumdur (doğru sayısı değil); Bahçem'de sayı olarak yazılmaz, yalnız söylenir. 0 veya aralık dışı → sessiz.
 */
export function bahceSesi(toplam: number): SpeakSource | null {
  if (!Number.isInteger(toplam) || toplam < 1 || toplam > 100) return null;
  return { kind: 'sequence', keys: [`sayi.${toplam}` as SpeechKey, 'bahce.bugun'] };
}

/** Ev çalışması sonu: "Bugünkü ev çalışmasını bitirdin!"; veli başlattıysa ardından "Şimdi telefonu bir büyüğüne ver.". */
export function evSonuSesi(yetiskineVer: boolean): SpeakSource {
  return yetiskineVer
    ? girisliKaynak('ev.bitti', { kind: 'key', key: 'ev.yetiskine-ver' })
    : { kind: 'key', key: 'ev.bitti' };
}

/**
 * Isınma Keşfi (ADR-0007): ısınmanın ilk maddesi "Haydi biraz ısınalım!" ile, ısınmadan hemen sonra başlayan
 * oturumun ilk sorusu "Isındık, şimdi oynayalım!" ile açılır. Diğer maddelerde giriş yok.
 */
export function isinmaGirisi(
  isinma: { readonly maddeSayisi: number; readonly bitti: boolean } | null,
  oturumIlkSorusu: boolean,
  isinmadanYeniCikti: boolean,
): SpeechKey | null {
  if (isinma && !isinma.bitti) return isinma.maddeSayisi === 0 ? 'isinma.basliyor' : null;
  return oturumIlkSorusu && isinmadanYeniCikti ? 'isinma.bitti' : null;
}
