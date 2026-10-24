/**
 * Kişisel ana ekran yerleşimi (KG-101). Elle seçilen tahta profili (ölçek 1,6) ya da kısa bir tablet ekranında
 * maskot satırı + konu kartları + alt "Başla" şeridi ekrana sığmıyordu; `section` taşıyor, alt şerit kartların
 * üstüne biniyordu. Sığmıyorsa "Başla" ve Keşif Masası maskot satırına (talimat balonunun yanına) alınır, alt
 * şerit kalkar: kartlarla kesişmez ve görünüm içinde kalır.
 *
 * Karar ölçülen yüksekliklerden verilir ve iki düzende de aynı sonucu verir (alt şeridin yüksekliği "Başla"nın
 * kendi yüksekliğidir; düzen değişince değişmez): sıkı düzene geçmek normal düzeni bir daha sığar göstermez.
 */

export interface AnaEkranOlculeri {
  /** `main` iç yüksekliği (clientHeight). */
  readonly kullanilabilir: number;
  /** `main` dikey dolgusu (üst + alt). */
  readonly dolgu: number;
  /** `main` satır aralığı. */
  readonly bosluk: number;
  readonly ust: number;
  /** Maskot satırının normal düzendeki yüksekliği: max(maskot, talimat balonu). */
  readonly satir: number;
  /** Orta bölümün satır aralığı. */
  readonly ortaBosluk: number;
  /** Kilitli tema uyarısı (yoksa 0). */
  readonly kilit: number;
  readonly izgara: number;
  /** Alt şeridin yüksekliği: birincil düğme boyu (`--size-primary`). */
  readonly altDugme: number;
  /** Alt şeridin alt dolgusu. */
  readonly altDolgu: number;
}

/** Normal düzen (alt şeritte "Başla") ekrana sığmıyor mu? */
export function anaEkranSigmiyor(o: AnaEkranOlculeri): boolean {
  const orta = o.satir + o.ortaBosluk + (o.kilit > 0 ? o.kilit + o.ortaBosluk : 0) + o.izgara;
  const gerekli = o.dolgu + o.ust + o.bosluk + orta + o.bosluk + o.altDugme + o.altDolgu;
  return gerekli > o.kullanilabilir + 0.5;
}

/** DOM'dan ölçer (yalnız tarayıcıda). İşaretler: data-ana-ust/-maskot/-serit/-orta/-kilit/-izgara. */
export function anaEkranOlc(main: HTMLElement, altDolgu: number): AnaEkranOlculeri {
  const yukseklik = (s: string): number => main.querySelector(s)?.getBoundingClientRect().height ?? 0;
  const px = (v: string): number => parseFloat(v) || 0;
  const cs = getComputedStyle(main);
  const orta = main.querySelector('[data-ana-orta]');
  return {
    kullanilabilir: main.clientHeight,
    dolgu: px(cs.paddingTop) + px(cs.paddingBottom),
    bosluk: px(cs.rowGap),
    ust: yukseklik('[data-ana-ust]'),
    satir: Math.max(yukseklik('[data-ana-maskot]'), yukseklik('[data-ana-serit]')),
    ortaBosluk: orta ? px(getComputedStyle(orta).rowGap) : 0,
    kilit: yukseklik('[data-ana-kilit]'),
    izgara: yukseklik('[data-ana-izgara]'),
    // Düzenden bağımsız: alt şeritteki "Başla" birincil boydadır (sıkı düzende küçülse de karar değişmesin).
    altDugme: px(cs.getPropertyValue('--size-primary')),
    altDolgu,
  };
}
