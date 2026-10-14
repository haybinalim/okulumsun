/**
 * ETKİ ÇALIŞMASI FORMLARI — SAF (plan v2 Adım 53b, KG-93).
 *
 * Ön test (Form A) ve son test (Form B) için iki paralel 20 maddelik kâğıt. Maddeler çalışma kâğıdı altyapısıyla
 * (Adım 35: `setSorusuUret` → `kagitMaddesiYap` → `sayfalaraDagit`) üretilir; tek fark seçimdir:
 *
 * - **Desen (`ETKI_DESENI`)** 20 yuvanın sırasıdır: her yuva bir düğüm + şablon + **zorluk düzeyi** taşır. İki form aynı
 *   deseni yuva yuva doldurur → şablon dağılımı ve zorluk dağılımı yalnız toplamda değil, sıra numarasında da aynıdır.
 * - **Zorluk düzeyi** maddenin içindeki toplama gerçeğinden (x + y = z; çıkarma z − y = x aynı gerçek) hesaplanır:
 *   1 = sonuç ≤ 10; 2 = 20 içinde, onluk geçmeden (bir terim ≥ 10); 3 = onluk geçen (iki terim < 10, sonuç > 10).
 *   Şablonun `difficulty` alanı düğüme bağlı sabit olduğundan madde zorluğunu ayırmaz (KG-90 bulgusu).
 * - **Ortak madde yok:** Form B, Form A'nın işlem imzalarını (sorulan ifade; işlem kartlarında kartın kendisi) dışlayarak
 *   üretilir; bir form içinde de imza yinelenmez.
 * - **Determinizm:** aday tohumları `hash32('etki:<sürüm>:<form tohumu>:<yuva>:<deneme>')`; saat, rastgelelik ve depolama yok.
 *
 * Öğrenci verisi yoktur: form koddan yeniden üretilir; puan/skor tutulmaz (puanlama kâğıt üzerinde, öğretmende).
 */
import type { SpeakSource } from '../../audio/speech';
import { REGISTRY } from '../../exercises/registry';
import { hash32 } from '../../exercises/rng';
import type { Exercise, KazanimKodu, SkillId, VisualSpec } from '../../exercises/types';
import { setSorusuUret } from '../tahtaSorusu';
import { cevapSatiriYap, type CevapSatiri } from './cevapAnahtari';
import { kagitMaddesiYap, type KagitMaddesi } from './kagitMaddesi';
import type { KagitDuzeni } from './kagitPlani';
import { maddeKaplama, sayfalaraDagit } from './kagitYerlesimi';
import { sesMetni } from './sesMetni';

export const ETKI_FORM_SURUMU = 1 as const;
export type EtkiFormuAdi = 'A' | 'B';
export type ZorlukDuzeyi = 1 | 2 | 3;

/** Form tohumları (protokol Ek A). Form B, Form A'nın imzalarını dışlar. */
export const ETKI_FORM_TOHUMLARI: Readonly<Record<EtkiFormuAdi, number>> = { A: 53101, B: 53201 };
/** Müdahale haftalarının öğrenme çıktıları (ön kayıt §3). */
export const ETKI_KAZANIMLARI: readonly KazanimKodu[] = ['MAT.1.2.2', 'MAT.1.2.3', 'MAT.1.2.4'] as KazanimKodu[];
export const ETKI_DUZENI: KagitDuzeni = '2x3';
export const ETKI_MADDE_SAYISI = 20;

export const ZORLUK_ADI: Readonly<Record<ZorlukDuzeyi, string>> = {
  1: '10 içinde',
  2: '20 içinde, onluk geçmeden',
  3: 'onluk geçen',
};

export interface EtkiYuvasi {
  /** 1 = MAT.1.2.2 bölümü, 2 = MAT.1.2.3–1.2.4 bölümü (ayrı sayfadan başlar; iki oturuma bölünebilir). */
  readonly bolum: 1 | 2;
  readonly skillId: SkillId;
  readonly templateId: string;
  readonly zorluk: ZorlukDuzeyi;
}

const y = (bolum: 1 | 2, skillId: string, templateId: string, zorluk: ZorlukDuzeyi): EtkiYuvasi => ({
  bolum,
  skillId: skillId as SkillId,
  templateId,
  zorluk,
});

const D3 = 'mat.toplama.ustune-sayma';
const D4 = 'mat.toplama.ona-tumleme';
const D5 = 'mat.toplama.onu-gecen-20';
const D8 = 'mat.cikarma.geriye-sayarak';
const DB = 'mat.cebir.esit-isareti';
const DC = 'mat.cebir.esitligi-donusturme';
const DD = 'mat.cebir.eksik-toplanan';
const DE = 'mat.cebir.ters-islem';

/**
 * 20 yuva, sırasıyla. Bölüm 1 (12): üstüne say 3 · ona tamamla 3 · onu geçen toplama 3 · geriye sayarak çıkar 3;
 * Bölüm 2 (8): iki taraf eşit 2 · eşitliği değiştir 2 · kaç tane eksik 2 · tersini yap 2 (protokol Ek A şablon dağılımı).
 * Şablonlar dönüşümlü, her şablon kendi içinde kolaydan zora. Üstüne say ve ona tamamla şablonları yalnız 10 içinde üretir
 * (düzey 1); onluk geçen maddeler (MAT.1.2.2'nin asıl zorluğu) bölüm 1'de 3, bölüm 2'de 3. Düzey toplamı 9 · 5 · 6.
 * "Zihinden bul" (d6) kâğıtta tahmin ile hesaplamayı ayıramadığı için dışarıda.
 */
export const ETKI_DESENI: readonly EtkiYuvasi[] = [
  y(1, D3, 'M-TOPLA-GORSEL', 1),
  y(1, D4, 'M-TOPLA-ONA-TUMLE', 1),
  y(1, D8, 'M-CIKAR-GORSEL', 1),
  y(1, D5, 'M-TOPLA-SEMBOL', 2),
  y(1, D3, 'M-TOPLA-GORSEL', 1),
  y(1, D4, 'M-TOPLA-ONA-TUMLE', 1),
  y(1, D8, 'M-CIKAR-GORSEL', 2),
  y(1, D5, 'M-TOPLA-SEMBOL', 3),
  y(1, D3, 'M-TOPLA-GORSEL', 1),
  y(1, D4, 'M-TOPLA-ONA-TUMLE', 1),
  y(1, D8, 'M-CIKAR-GORSEL', 3),
  y(1, D5, 'M-TOPLA-SEMBOL', 3),
  y(2, DB, 'M-ESIT-DENGE', 1),
  y(2, DD, 'M-EKSIK-TOPLANAN', 2),
  y(2, DC, 'M-ESIT-DENGE', 1),
  y(2, DE, 'M-TERS-ISLEM', 2),
  y(2, DB, 'M-ESIT-DENGE', 2),
  y(2, DD, 'M-EKSIK-TOPLANAN', 3),
  y(2, DC, 'M-ESIT-DENGE', 3),
  y(2, DE, 'M-TERS-ISLEM', 3),
];

// ------------------------------------------------------------ madde içeriği → toplama gerçekleri

/** x + y = z (çıkarma z − y = x aynı gerçektir). */
export interface ToplamaGercegi {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

interface IslemOkuma {
  readonly gercekler: readonly ToplamaGercegi[];
  /** Ortak madde denetimi için imzalar (sorulan ifade; işlem kartlarında her kart). */
  readonly imzalar: readonly string[];
}

const sayiAnahtari = (k: string): number | null => {
  const e = /^sayi\.(\d+)$/.exec(k);
  return e ? Number(e[1]) : null;
};

function rakamlar(g: VisualSpec | undefined): number[] {
  if (!g || g.type !== 'sahne') return [];
  return g.parcalar.flatMap((p) => (p.gorsel.type === 'rakam' ? [p.gorsel.sayi] : []));
}

function yerlesimCevabi(ex: Exercise): number | null {
  if (ex.kind !== 'TAP_TO_PLACE') return null;
  const id = Object.values(ex.validation.dogruEslesme)[0];
  const o = ex.options.find((s) => s.id === id);
  return o && o.deger.tur === 'gorsel' && o.deger.gorsel.type === 'rakam' ? o.deger.gorsel.sayi : null;
}

const toplamaImzasi = (a: number, b: number): string => `${Math.min(a, b)}+${Math.max(a, b)}`;

/** Maddedeki toplama gerçeklerini ve imzalarını okur; şablon tanınmıyorsa `null`. */
export function islemOku(ex: Exercise): IslemOkuma | null {
  switch (ex.templateId) {
    case 'M-TOPLA-GORSEL':
    case 'M-TOPLA-SEMBOL':
    case 'M-CIKAR-GORSEL': {
      if (ex.prompt.ses.kind !== 'sequence') return null;
      const [k1, op, k2] = ex.prompt.ses.keys;
      const a = sayiAnahtari(k1);
      const b = sayiAnahtari(k2);
      if (a === null || b === null) return null;
      if (op === 'op.arti') return { gercekler: [{ x: a, y: b, z: a + b }], imzalar: [toplamaImzasi(a, b)] };
      if (op === 'op.eksi') return { gercekler: [{ x: a - b, y: b, z: a }], imzalar: [`${a}-${b}`] };
      return null;
    }
    case 'M-TOPLA-ONA-TUMLE': {
      const g = ex.prompt.gorsel;
      const d = yerlesimCevabi(ex);
      if (!g || g.type !== 'onlukCerceve' || g.gruplar.length !== 1 || d === null) return null;
      const a = g.gruplar[0];
      return { gercekler: [{ x: a, y: d, z: a + d }], imzalar: [`${a}+?=${a + d}`] };
    }
    case 'M-ESIT-DENGE':
    case 'M-EKSIK-TOPLANAN': {
      // Eşit denge: sol p, sağda q + ? (p = q + ?); eksik toplanan: q + ? = p. İkisinde de q + cevap = p.
      const r = rakamlar(ex.prompt.gorsel);
      const d = yerlesimCevabi(ex);
      if (r.length !== 2 || d === null) return null;
      const [p, q] = ex.templateId === 'M-ESIT-DENGE' ? r : [r[1], r[0]];
      if (q + d !== p) return null;
      return { gercekler: [{ x: q, y: d, z: p }], imzalar: [`${q}+?=${p}`] };
    }
    case 'M-TERS-ISLEM': {
      if (ex.kind !== 'MATCH_PAIRS') return null;
      const gercekler: ToplamaGercegi[] = [];
      const imzalar: string[] = [];
      for (const o of ex.options) {
        if (o.deger.tur !== 'gorsel' || o.deger.gorsel.type !== 'islemKarti') return null;
        const { ilkSayi, ikinciSayi, sonuc, islem } = o.deger.gorsel;
        gercekler.push(
          islem === '+' ? { x: ilkSayi, y: ikinciSayi, z: sonuc } : { x: sonuc, y: ikinciSayi, z: ilkSayi },
        );
        imzalar.push(`kart:${ilkSayi}${islem}${ikinciSayi}=${sonuc}`);
      }
      return { gercekler, imzalar };
    }
    default:
      return null;
  }
}

/** Tek gerçeğin zorluk düzeyi (dosya başı tanım). */
export function gercekZorlugu(g: ToplamaGercegi): ZorlukDuzeyi {
  if (g.z <= 10) return 1;
  return g.x >= 10 || g.y >= 10 ? 2 : 3;
}

/** Maddenin zorluk düzeyi = gerçeklerinin en zoru (işlem kartlı maddede 3 aile vardır); okunamazsa `null`. */
export function maddeZorlugu(ex: Exercise): ZorlukDuzeyi | null {
  const o = islemOku(ex);
  if (!o || o.gercekler.length === 0) return null;
  return Math.max(...o.gercekler.map(gercekZorlugu)) as ZorlukDuzeyi;
}

// ------------------------------------------------------------ form üretimi

export interface EtkiMaddesi {
  readonly yuva: EtkiYuvasi;
  readonly madde: KagitMaddesi;
  readonly zorluk: ZorlukDuzeyi;
  readonly imzalar: readonly string[];
  readonly tohum: number;
}

export interface EtkiFormuPlani {
  readonly form: EtkiFormuAdi;
  /** `ETKI-<sürüm>-<form>`; `?arsiv=` görünümü bu kodla açar. */
  readonly kod: string;
  readonly maddeler: readonly EtkiMaddesi[];
  /** Bölüm 2 yeni sayfadan başlar. `KagitSayfalari` ile uyumlu. */
  readonly sayfalar: readonly (readonly KagitMaddesi[])[];
  readonly cevapAnahtari: readonly CevapSatiri[];
  readonly kazanimOzeti: readonly string[];
  readonly eksik: number;
}

/** Bir yuva için en çok bu kadar aday denenir; dolmazsa üretim hata fırlatır (desen değişikliği gerekir). */
const DENEME_SINIRI = 4000;

export function etkiFormuKodu(form: EtkiFormuAdi): string {
  return `ETKI-${ETKI_FORM_SURUMU}-${form}`;
}

/** `etkiFormuKodu` çıktısını çözer; değilse `null`. */
export function etkiFormuKoduCoz(kod: string): EtkiFormuAdi | null {
  const e = new RegExp(`^ETKI-${ETKI_FORM_SURUMU}-(A|B)$`).exec(kod.trim());
  return e ? (e[1] as EtkiFormuAdi) : null;
}

/**
 * Tek formu üretir. `dislanan`: başka formun imzaları (Form B için Form A'nınkiler).
 * Aynı girdi → aynı form; yuva dolmazsa hata fırlatır.
 */
export function etkiFormuUret(
  form: EtkiFormuAdi,
  tr: Readonly<Record<string, string>>,
  dislanan: ReadonlySet<string> = new Set(),
  kayitli: (t: string) => boolean = (t) => REGISTRY.has(t),
): EtkiFormuPlani {
  const metin = (s: SpeakSource): string => sesMetni(s, tr);
  const formTohumu = ETKI_FORM_TOHUMLARI[form];
  const kullanilan = new Set<string>(dislanan);
  const maddeler: EtkiMaddesi[] = [];

  ETKI_DESENI.forEach((yuva, i) => {
    if (!kayitli(yuva.templateId)) throw new Error(`etkiFormuUret: '${yuva.templateId}' kayıtlı değil.`);
    for (let deneme = 0; deneme < DENEME_SINIRI; deneme++) {
      const tohum = hash32(`etki:${ETKI_FORM_SURUMU}:${formTohumu}:${i}:${deneme}`);
      const ex = setSorusuUret({ sira: i, skillId: yuva.skillId, templateId: yuva.templateId, seed: tohum });
      if (ex.templateId !== yuva.templateId) continue;
      const okuma = islemOku(ex);
      if (!okuma || maddeZorlugu(ex) !== yuva.zorluk) continue;
      if (okuma.imzalar.some((s) => kullanilan.has(s))) continue;
      const madde = kagitMaddesiYap(ex, i + 1, metin);
      if (!madde || maddeKaplama(madde, ETKI_DUZENI) === null) continue;
      okuma.imzalar.forEach((s) => kullanilan.add(s));
      maddeler.push({ yuva, madde, zorluk: yuva.zorluk, imzalar: okuma.imzalar, tohum });
      return;
    }
    throw new Error(`etkiFormuUret: Form ${form} yuva ${i + 1} (${yuva.templateId}, zorluk ${yuva.zorluk}) dolmadı.`);
  });

  const bolum = (b: 1 | 2) => maddeler.filter((m) => m.yuva.bolum === b).map((m) => m.madde);
  const sayfalar = [...sayfalaraDagit(bolum(1), ETKI_DUZENI), ...sayfalaraDagit(bolum(2), ETKI_DUZENI)];
  const kagitMaddeleri = maddeler.map((m) => m.madde);

  return {
    form,
    kod: etkiFormuKodu(form),
    maddeler,
    sayfalar,
    cevapAnahtari: kagitMaddeleri.map(cevapSatiriYap),
    kazanimOzeti: [...new Set(kagitMaddeleri.flatMap((m) => m.kazanimKodlari))].sort(),
    eksik: ETKI_MADDE_SAYISI - maddeler.length,
  };
}

/** İki form birlikte: Form A, ardından Form A'nın imzalarını dışlayan Form B. */
export function etkiFormlariUret(
  tr: Readonly<Record<string, string>>,
  kayitli: (t: string) => boolean = (t) => REGISTRY.has(t),
): Readonly<Record<EtkiFormuAdi, EtkiFormuPlani>> {
  const A = etkiFormuUret('A', tr, new Set(), kayitli);
  const B = etkiFormuUret('B', tr, new Set(A.maddeler.flatMap((m) => m.imzalar)), kayitli);
  return { A, B };
}

/** Form özeti: şablon ve zorluk sayıları (eşdeğerlik tablosu ve test için). */
export function etkiFormuDagilimi(plan: EtkiFormuPlani): {
  readonly sablon: Readonly<Record<string, number>>;
  readonly zorluk: Readonly<Record<ZorlukDuzeyi, number>>;
  readonly sablonZorluk: Readonly<Record<string, number>>;
} {
  const sablon: Record<string, number> = {};
  const zorluk: Record<ZorlukDuzeyi, number> = { 1: 0, 2: 0, 3: 0 };
  const sablonZorluk: Record<string, number> = {};
  for (const m of plan.maddeler) {
    sablon[m.madde.templateId] = (sablon[m.madde.templateId] ?? 0) + 1;
    zorluk[m.zorluk] += 1;
    const k = `${m.madde.templateId}|${m.zorluk}`;
    sablonZorluk[k] = (sablonZorluk[k] ?? 0) + 1;
  }
  return { sablon, zorluk, sablonZorluk };
}
