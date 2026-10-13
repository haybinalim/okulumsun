/**
 * AYAR KODU — SAF (plan v2 Adım 55).
 *
 * Tahtada kapsayıcılık ayarları URL hash'ine yazılır; öğretmen adresi yer imine ekler ve ertesi
 * gün aynı ayarlarla açar. YENİ DEPOLAMA ANAHTARI YOK; hash sunucuya gitmez.
 *
 *   #ayar=1.trpsbh      (sürüm "1", ardından açık ayarların harfleri, sabit sırada)
 *   #ayar=1.            (hepsi kapalı — ayar kodu yazılmaz, hash temizlenir)
 *
 *   t = yavaş tempo · r = talimat tekrarı · p = renk körlüğü dostu palet
 *   s = sol el · b = büyük hedef · h = hareket azalt
 *
 * Çözücü katıdır: bilinmeyen harf, tekrar, sıra dışı harf, başka sürüm, fazla uzunluk → `null`.
 * Kod yalnız altı ayarı taşır; ad, sınıf, okul, tarih, cevap taşıyamaz.
 */
import { VARSAYILAN_KAPSAYICILIK, type KapsayicilikAyarlari } from '../design/kapsayicilik';

export const AYAR_KODU_SURUMU = '1' as const;
export const AYAR_KODU_ANAHTARI = 'ayar' as const;
/** `#ayar=1.` + 6 harf. */
export const AYAR_KODU_EN_UZUN_HASH = 14;

const HARFLER = [
  ['t', (a: KapsayicilikAyarlari) => a.tempo === 'yavas'],
  ['r', (a: KapsayicilikAyarlari) => a.talimatTekrari],
  ['p', (a: KapsayicilikAyarlari) => a.palet === 'renkKorluguDostu'],
  ['s', (a: KapsayicilikAyarlari) => a.solEl],
  ['b', (a: KapsayicilikAyarlari) => a.buyukHedef],
  ['h', (a: KapsayicilikAyarlari) => a.hareketAzalt],
] as const;

/** Açık ayarların harfleri, sabit sırada (`trpsbh` alt dizisi). */
export function ayarKodu(a: KapsayicilikAyarlari): string {
  return HARFLER.filter(([, acik]) => acik(a))
    .map(([h]) => h)
    .join('');
}

/** Hash parçası; hepsi kapalıysa boş dize (adres temiz kalır). */
export function ayarHash(a: KapsayicilikAyarlari): string {
  const kod = ayarKodu(a);
  return kod === '' ? '' : `#${AYAR_KODU_ANAHTARI}=${AYAR_KODU_SURUMU}.${kod}`;
}

/** Hash bir ayar kodu GİRİŞİMİ mi (geçerli olsun olmasın)? */
export function ayarKoduGirisimiMi(hash: string): boolean {
  return /^#?ayar=/.test(hash);
}

/** `location.hash`'i çözer (`#` olsa da olmasa da). Biçim dışı → `null`. */
export function ayarKoduCoz(hash: string): KapsayicilikAyarlari | null {
  const metin = hash.startsWith('#') ? hash : `#${hash}`;
  if (metin.length > AYAR_KODU_EN_UZUN_HASH) return null;
  const eslesme = /^#ayar=([0-9]+)\.([a-z]*)$/.exec(metin);
  if (!eslesme) return null;
  const [, surum, kod] = eslesme;
  if (surum !== AYAR_KODU_SURUMU) return null;
  // Sıra korunmalı ve her harf en çok bir kez: kanonik alt dizi değilse geçersiz.
  const sira = HARFLER.map(([h]) => h).join('');
  let i = 0;
  for (const h of kod!) {
    const yer = sira.indexOf(h, i);
    if (yer < 0) return null;
    i = yer + 1;
  }
  const var_ = (h: string) => kod!.includes(h);
  return {
    ...VARSAYILAN_KAPSAYICILIK,
    tempo: var_('t') ? 'yavas' : 'normal',
    talimatTekrari: var_('r'),
    palet: var_('p') ? 'renkKorluguDostu' : 'standart',
    solEl: var_('s'),
    buyukHedef: var_('b'),
    hareketAzalt: var_('h'),
  };
}
