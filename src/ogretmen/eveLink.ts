/**
 * EVE LİNK — SAF (plan v2 Adım 42 aşama 1, ADR-0010 Kabul).
 *
 * Öğretmenin tahtada çalıştığı seti eve gönderdiği bağlantı:
 *
 *   https://<kanonik kök>/#ev=<sürüm>.<set kodu>      örn.  …/#ev=1.1.a1b7.k3f9q
 *
 * Veri YALNIZ hash parçasındadır: tarayıcı hash'i sunucuya göndermez (`Referrer-Policy: no-referrer`
 * ile yönlendiren başlığa da düşmez). Taşınan tek şey düğüm kodları + tohum (`setKodla`); ad, sınıf,
 * okul, tarih, cevap YOK. Çözücü katıdır: tanımadığı her karakter, fazladan alan veya sürüm → `null`
 * (kişisel veri taşıma girişimi bağlantıyı geçersiz kılar). Saat, rastgelelik, depolama ve ağ yok.
 */
import type { SkillId } from '../exercises/types';
import { setCoz, setKodla, type GunlukSet } from './gunlukSet';

export const EVE_LINK_SURUMU = '1' as const;
/** Hash anahtarı. */
export const EVE_LINK_ANAHTARI = 'ev' as const;
/** `#ev=1.` + en uzun set kodu (`1.` + 4×2 kod + `.` + 7 haneli tohum) — üstü kesin geçersiz. */
export const EVE_LINK_EN_UZUN_HASH = 40;

/** Kanonik kök: yalnız http(s), sorgu/hash yok; sondaki `/` atılır. Geçersizse hata fırlatır. */
function kokuDuzelt(kanonikKok: string): string {
  let url: URL;
  try {
    url = new URL(kanonikKok);
  } catch {
    throw new Error(`eveLinkUret: geçersiz kök adres '${kanonikKok}'.`);
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('eveLinkUret: kök http(s) olmalı.');
  if (url.search !== '' || url.hash !== '' || url.username !== '' || url.password !== '') {
    throw new Error('eveLinkUret: kök adreste sorgu, hash veya kimlik bilgisi olamaz.');
  }
  return `${url.origin}${url.pathname}`.replace(/\/+$/, '');
}

/** Yalnız hash parçası (`#ev=1.<set kodu>`). Geçersiz set `setKodla` hatasını fırlatır. */
export function eveLinkHash(set: GunlukSet): string {
  return `#${EVE_LINK_ANAHTARI}=${EVE_LINK_SURUMU}.${setKodla(set)}`;
}

/** Tam bağlantı: `<kök>/#ev=1.<set kodu>`. */
export function eveLinkUret(kanonikKok: string, set: GunlukSet): string {
  return `${kokuDuzelt(kanonikKok)}/${eveLinkHash(set)}`;
}

/** Hash bir eve link GİRİŞİMİ mi (geçerli olsun olmasın)? Açılışta temizleme kararı için. */
export function eveLinkGirisimiMi(hash: string): boolean {
  return /^#?ev=/.test(hash);
}

/**
 * `location.hash`'i çözer (başında `#` olsa da olmasa da). Biçim dışı, fazla alanlı, sürümü
 * uyumsuz, `gecerli` dışı düğümlü veya fazla uzun hash → `null`.
 */
export function eveLinkCoz(hash: string, gecerli: ReadonlySet<SkillId>): GunlukSet | null {
  const metin = hash.startsWith('#') ? hash : `#${hash}`;
  if (metin.length > EVE_LINK_EN_UZUN_HASH) return null;
  const eslesme = /^#ev=([0-9]+)\.([a-z0-9]+\.[a-z0-9]+\.[a-z0-9]+)$/.exec(metin);
  if (!eslesme) return null;
  const [, surum, setKodu] = eslesme;
  if (surum !== EVE_LINK_SURUMU) return null;
  return setCoz(setKodu!, gecerli);
}
