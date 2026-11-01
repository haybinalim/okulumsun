/**
 * Türkçe şablonlarının ortak yardımcıları (Adım 69). SAF.
 *
 * - Öğretilen küme: yalnız kümedeki gliflerden oluşan sözcükler (dekodlanabilirlik, K-OY-02) ve çeldiriciler (D-23).
 * - Belirsizlik süzgeci: bir çeldirici başka GERÇEK bir sözcük kurduruyorsa (ka_e: l → kale, r → kare) kullanılmaz.
 *   Süzgeç havuzun yanında görünmeyen ek bir sözcük listesi kullanır (yalnız belirsizlik denetimi; gösterilmez).
 */
import { girisNoktasi, dekodlanabilirMi, harfSirasi } from '../ogretilenKume';
import { OGRETIM_SIRASI, trKucuk, unluMu } from '../alfabe';
import type { Rng } from '../../../../exercises/rng';
import { karistirilanlar } from './celdiriciler';
import type { TurHavuzSozcugu, TurKart } from './turSoru';
import type { TurTaniEtiketi } from './celdiriciler';

/**
 * Belirsizlik süzgeci için ek gerçek sözcükler (1.–2. grup harfleriyle yazılabilen; çocuğa gösterilmez). Havuz dışı
 * bırakılanlar (olumsuz, argo, soyut; sözcük listesi taslağı "Bilerek alınmayanlar") de buradadır: çeldirici onları
 * da kurdurmamalı.
 */
export const BELIRSIZLIK_SOZCUKLERI: ReadonlySet<string> = new Set([
  'kan', 'kel', 'kola', 'it', 'ait', 'ani', 'nana', 'anan', 'lanet', 'katil', 'alkol', 'karar', 'kontrol', 'ırk',
  'imam', 'millet', 'kim', 'kum', 'kul', 'kil', 'mil', 'mal', 'nem', 'kor', 'tok', 'tan', 'kin', 'lal',
  'rol', 'ram', 'rom', 'mut', 'kara', 'karın', 'kır', 'kur', 'kurt', 'mama', 'mantı', 'mana', 'moral', 'tarla',
  'tarak', 'tuna', 'arka', 'liman', 'nokta', 'okur', 'ortak', 'oran', 'rakam', 'kalk', 'terk', 'kirli', 'iri',
  'irmik', 'imla', 'kimi', 'lira', 'limit', 'mermi', 'teori', 'tam', 'tamir', 'ilan', 'inek', 'ima', 'ona', 'ama',
  'ile', 'ilk', 'kaim', 'akın', 'akıl', 'alın', 'anı', 'arı', 'atı', 'eti', 'eli', 'kat', 'kot', 'kok', 'kek',
  'mor', 'mum', 'nar', 'tel', 'til', 'ton', 'tür', 'tül', 'kale', 'kare', 'kart', 'karne', 'kral', 'trol', 'metre',
  'mekik', 'kemik', 'kilim', 'kimlik', 'keman', 'kemer', 'kek', 'koku', 'koltuk', 'kulak', 'kule', 'kutu', 'tuğla',
  'ölü', 'tarım', 'umut', 'unut', 'uç', 'ok', 'on', 'ol', 'ot', 'el', 'al', 'at', 'et', 'en', 'an', 'ek', 'in',
  'il', 'un', 'ne', 'ana', 'nane', 'nine', 'nene', 'anne', 'ata', 'tane', 'net', 'tat', 'ten', 'mi', 'tıka',
]); // prettier-ignore

/** Kümedeki küçük harfler, öğretim sırasıyla. */
export function kumeHarfleri(kume: ReadonlySet<string>): string[] {
  return OGRETIM_SIRASI.filter((h) => kume.has(h));
}

/** Kümeyle okunabilen havuz sözcükleri (havuz sırası korunur; havuz küçük harftir). */
export function okunabilirSozcukler(havuz: readonly TurHavuzSozcugu[], kume: ReadonlySet<string>): TurHavuzSozcugu[] {
  return havuz.filter((s) => dekodlanabilirMi(s.metin, kume));
}

/** Bilinen gerçek sözcük mü (havuz ∪ belirsizlik listesi). */
export function bilinenSozcukMu(metin: string, havuz: readonly TurHavuzSozcugu[]): boolean {
  const k = trKucuk(metin);
  return BELIRSIZLIK_SOZCUKLERI.has(k) || havuz.some((s) => s.metin === k);
}

/** Sorunun resmî giriş harfi: bütün metinlerin öğretilmiş olduğu ilk nokta (D-02, CI denetimi için). */
export function soruGirisHarfi(metinler: readonly string[]): string {
  const g = girisNoktasi(metinler.join(''));
  return g ? g.harf : OGRETIM_SIRASI[0];
}

/** Harfler arasından en son öğretileni (resmî sıra). */
export function enYeniHarf(harfler: readonly string[]): string {
  return [...harfler].sort((a, b) => harfSirasi(b) - harfSirasi(a))[0];
}

export interface Celdirici {
  readonly harf: string;
  readonly etiket?: TurTaniEtiketi;
}

/**
 * Harf çeldiricileri: önce `hedef` ile karıştırılan çift (`oncelikli` ise; etiketli), sonra kümenin geri kalanı
 * (rastgele). `yasak` harfler ve `uygun` süzgecini geçemeyenler alınmaz. Kümede yeterli harf yoksa daha az döner.
 */
export function harfCeldiricileri(
  rng: Rng,
  o: {
    readonly hedef: string;
    readonly kume: ReadonlySet<string>;
    readonly adet: number;
    readonly yasak: ReadonlySet<string>;
    readonly oncelikli: boolean;
    readonly uygun?: (harf: string) => boolean;
  },
): Celdirici[] {
  const uygun = (h: string) => !o.yasak.has(h) && (o.uygun?.(h) ?? true);
  const sonuc: Celdirici[] = [];
  if (o.oncelikli)
    for (const k of karistirilanlar(o.hedef, o.kume))
      if (sonuc.length < o.adet && uygun(k.harf)) sonuc.push({ harf: k.harf, etiket: k.etiket });
  const alinan = new Set(sonuc.map((c) => c.harf));
  const kalan = rng.shuffle(kumeHarfleri(o.kume).filter((h) => h !== o.hedef && !alinan.has(h) && uygun(h)));
  for (const h of kalan) if (sonuc.length < o.adet) sonuc.push({ harf: h });
  return sonuc;
}

/** Kart listesi: metinler karıştırılır, kimlikler sıralı (`k0`, `k1`…), doğru kartın yeni yeri döner. */
export function kartlariKaristir(rng: Rng, kartlar: readonly Omit<TurKart, 'id'>[]): TurKart[] {
  return rng.shuffle(kartlar).map((k, i) => ({ ...k, id: `k${i}` }));
}

export function unluSayisi(metin: string): number {
  return [...metin].filter(unluMu).length;
}
