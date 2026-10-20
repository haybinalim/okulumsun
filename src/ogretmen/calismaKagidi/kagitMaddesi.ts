/**
 * KÂĞIT MADDESİ — bir `Exercise`'ın A4 karşılığı (plan v2 Adım 35, KG-44). SAF.
 *
 * Aynı deterministik jeneratörden gelen soru, etkileşim türüne göre kâğıt yanıt biçimine çevrilir:
 * AUDIO_TO_IMAGE / HOTSPOT_FIND → daire içine al · TAP_COUNT → say ve yaz (ya da daire) ·
 * TAP_TO_PLACE → boşluğa yaz (numaralı işaretler) · MATCH_PAIRS → çizgiyle eşle · SEQUENCE_ORDER → sıra numarası yaz.
 * Cevap yalnız jeneratörün `validation` alanından okunur (ayrı bir doğru-cevap mantığı yazılmaz).
 */
import type { SpeakSource } from '../../audio/speech';
import type { HataEtiketi } from '../../exercises/distractors';
import type { Exercise, KazanimKodu, Option, OptionDeger, VisualSpec } from '../../exercises/types';
import { yazdirmaSinifi } from './yazdirmaUygunlugu';

export type YanitBicimi = 'daireIcineAl' | 'kutuyaYaz' | 'cizgiyleEsle' | 'siraNumarasiYaz';
export type YonergeIkonu = 'kulak' | 'kalem' | 'cizgi' | 'sira';

export interface KagitSecenegi {
  readonly id: string;
  /** A, B, C… (eşleştirmede sol 1, 2, 3…). Sayı seçeneklerinde cevap sayının kendisidir. */
  readonly etiket: string;
  readonly deger: OptionDeger;
  readonly taraf?: 'sol' | 'sag';
}

/** Sahne üzerine bindirilen numaralı işaret (hotspot bölgesi ya da boş yuva). Koordinatlar 0..1. */
export interface KagitIsareti {
  readonly etiket: string;
  readonly x: number;
  readonly y: number;
  readonly yaricap: number;
}

export interface KagitMaddesi {
  readonly no: number;
  readonly itemId: string;
  readonly templateId: string;
  readonly kazanimKodlari: readonly KazanimKodu[];
  readonly yonergeMetni: string;
  readonly yonergeIkonu: YonergeIkonu;
  readonly sahne?: VisualSpec;
  readonly isaretler: readonly KagitIsareti[];
  readonly secenekler: readonly KagitSecenegi[];
  readonly yanitBicimi: YanitBicimi;
  /** Seçeneklerin harf rozeti gösterilsin mi (sayı seçeneklerinde gösterilmez). */
  readonly harfRozeti: boolean;
  /** Yazma kutusu etiketleri ("1", "2"…; boş etiket = tek kutu). Sıra numarasında seçenek başına bir kutu. */
  readonly kutular: readonly string[];
  /** Cevap anahtarındaki doğru cevap (öğretmen için). */
  readonly cevap: string;
  /** Yanlış seçeneklerin tanı etiketleri (cevap anahtarı çeldirici notları için). */
  readonly celdiriciler: readonly { readonly secenek: string; readonly hata: HataEtiketi }[];
}

const HARFLER = 'ABCDEFGHIJKLMNOPRSTUVYZ';

const ikon: Readonly<Record<YanitBicimi, YonergeIkonu>> = {
  daireIcineAl: 'kalem',
  kutuyaYaz: 'kalem',
  cizgiyleEsle: 'cizgi',
  siraNumarasiYaz: 'sira',
};

/** Yanıt biçiminin çocuğa söylenecek kısa eylem cümlesi. */
export const EYLEM_METNI: Readonly<Record<YanitBicimi, string>> = {
  daireIcineAl: 'Doğru olanı daire içine al.',
  kutuyaYaz: 'Cevabı kutuya yaz.',
  cizgiyleEsle: 'Eşlerini çizgiyle birleştir.',
  siraNumarasiYaz: 'Sırayı kutulara yaz: 1, 2, 3...',
};

/** Seçeneklere harf, hepsi sayıysa sayının kendisi etiket olur. */
function secenekEtiketle(secenekler: readonly Option[]): { etiketler: string[]; harfRozeti: boolean } {
  const hepsiSayi = secenekler.length > 0 && secenekler.every((o) => o.deger.tur === 'sayi');
  if (hepsiSayi) {
    return {
      etiketler: secenekler.map((o) => String((o.deger as { sayi: number }).sayi)),
      harfRozeti: false,
    };
  }
  return { etiketler: secenekler.map((_, i) => HARFLER[i] ?? String(i + 1)), harfRozeti: true };
}

function sahneBul(ex: Exercise): VisualSpec | undefined {
  return ex.prompt.gorsel ?? ex.assets.find((a) => a.rol === 'sahne')?.gorsel;
}

/**
 * `ex`'i kâğıt maddesine çevirir; şablon kâğıda uygun değilse ya da bu etkileşim kâğıda çevrilemiyorsa `null`.
 * `metin`: yönerge sesini kâğıt metnine çeviren fonksiyon (`sesMetni`'nin tr sözlüğüne bağlanmışı).
 */
export function kagitMaddesiYap(
  ex: Exercise,
  no: number,
  metin: (s: SpeakSource) => string,
): KagitMaddesi | null {
  if (yazdirmaSinifi(ex.templateId) === 'uygunDegil') return null;

  const temel = {
    no,
    itemId: ex.itemId as string,
    templateId: ex.templateId,
    kazanimKodlari: ex.kazanimKodlari,
    yonergeMetni: metin(ex.prompt.ses),
    sahne: sahneBul(ex),
  };
  const yanlisEtiketleri = (
    secenekler: readonly Option[],
    etiketler: readonly string[],
  ): { secenek: string; hata: HataEtiketi }[] =>
    secenekler.flatMap((o, i) =>
      o.correct !== true && o.diagnosticTag != null ? [{ secenek: etiketler[i], hata: o.diagnosticTag }] : [],
    );
  const olustur = (
    yanitBicimi: YanitBicimi,
    ek: Pick<KagitMaddesi, 'secenekler' | 'harfRozeti' | 'kutular' | 'cevap' | 'celdiriciler'> &
      Partial<Pick<KagitMaddesi, 'isaretler'>>,
  ): KagitMaddesi => ({
    ...temel,
    yonergeIkonu: ikon[yanitBicimi],
    yanitBicimi,
    isaretler: ek.isaretler ?? [],
    secenekler: ek.secenekler,
    harfRozeti: ek.harfRozeti,
    kutular: ek.kutular,
    cevap: ek.cevap,
    celdiriciler: ek.celdiriciler,
  });

  switch (ex.kind) {
    case 'AUDIO_TO_IMAGE': {
      const { etiketler, harfRozeti } = secenekEtiketle(ex.options);
      const dogruNo = ex.options.findIndex((o) => o.id === ex.validation.dogruOptionId);
      if (dogruNo < 0) return null;
      return olustur('daireIcineAl', {
        secenekler: ex.options.map((o, i) => ({ id: o.id, etiket: etiketler[i], deger: o.deger })),
        harfRozeti,
        kutular: [],
        cevap: etiketler[dogruNo],
        celdiriciler: yanlisEtiketleri(ex.options, etiketler),
      });
    }

    case 'TAP_COUNT': {
      const v = ex.validation;
      if (v.cevapSecimi === 'secenek' && ex.options.length > 0) {
        const { etiketler, harfRozeti } = secenekEtiketle(ex.options);
        const dogruNo = ex.options.findIndex((o) => o.id === v.dogruOptionId);
        if (dogruNo < 0) return null;
        return olustur('daireIcineAl', {
          secenekler: ex.options.map((o, i) => ({ id: o.id, etiket: etiketler[i], deger: o.deger })),
          harfRozeti,
          kutular: [],
          cevap: etiketler[dogruNo],
          celdiriciler: yanlisEtiketleri(ex.options, etiketler),
        });
      }
      return olustur('kutuyaYaz', {
        secenekler: [],
        harfRozeti: false,
        kutular: [''],
        cevap: String(v.beklenenAdet),
        celdiriciler: [],
      });
    }

    case 'HOTSPOT_FIND': {
      const isaretler: KagitIsareti[] = ex.options.map((o, i) => {
        const b = o.bolge;
        return b.sekil === 'daire'
          ? { etiket: String(i + 1), x: b.cx, y: b.cy, yaricap: b.r }
          : { etiket: String(i + 1), x: b.x + b.w / 2, y: b.y + b.h / 2, yaricap: Math.max(b.w, b.h) / 2 };
      });
      const etiketler = isaretler.map((i) => i.etiket);
      const dogrular = ex.validation.dogruHotspotIds
        .map((id) => ex.options.findIndex((o) => o.id === id))
        .filter((i) => i >= 0)
        .map((i) => etiketler[i]);
      if (dogrular.length === 0) return null;
      return olustur('daireIcineAl', {
        isaretler,
        secenekler: [],
        harfRozeti: false,
        kutular: [],
        cevap: ex.validation.hepsiGerekli ? dogrular.join(', ') : dogrular.join(' ya da '),
        celdiriciler: yanlisEtiketleri(ex.options, etiketler),
      });
    }

    case 'TAP_TO_PLACE': {
      const { etiketler, harfRozeti } = secenekEtiketle(ex.options);
      const etiketKimden = (id: string): string => etiketler[ex.options.findIndex((o) => o.id === id)] ?? '?';
      const isaretler: KagitIsareti[] = ex.yuvalar.map((y, i) => ({
        etiket: String(i + 1),
        x: y.konum.x,
        y: y.konum.y,
        yaricap: 0.05,
      }));
      const parcalar = ex.yuvalar.map((y, i) => `${i + 1}: ${etiketKimden(ex.validation.dogruEslesme[y.id] ?? '')}`);
      return olustur('kutuyaYaz', {
        isaretler,
        secenekler: ex.options.map((o, i) => ({ id: o.id, etiket: etiketler[i], deger: o.deger })),
        harfRozeti,
        kutular: ex.yuvalar.map((_, i) => String(i + 1)),
        cevap: ex.yuvalar.length === 1 ? parcalar[0].replace(/^1: /, '') : parcalar.join(', '),
        celdiriciler: yanlisEtiketleri(ex.options, etiketler),
      });
    }

    case 'MATCH_PAIRS': {
      let sol = 0;
      let sag = 0;
      const secenekler: KagitSecenegi[] = ex.options.map((o) => ({
        id: o.id,
        etiket: o.taraf === 'sol' ? String(++sol) : (HARFLER[sag++] ?? '?'),
        deger: o.deger,
        taraf: o.taraf,
      }));
      const et = (id: string): string => secenekler.find((s) => s.id === id)?.etiket ?? '?';
      return olustur('cizgiyleEsle', {
        secenekler,
        harfRozeti: true,
        kutular: [],
        cevap: ex.validation.ciftler.map(([a, b]) => `${et(a)}-${et(b)}`).join(', '),
        celdiriciler: [],
      });
    }

    case 'SEQUENCE_ORDER': {
      const etiketler = ex.options.map((_, i) => HARFLER[i] ?? String(i + 1));
      const sira = ex.validation.dogruSira;
      return olustur('siraNumarasiYaz', {
        secenekler: ex.options.map((o, i) => ({ id: o.id, etiket: etiketler[i], deger: o.deger })),
        harfRozeti: true,
        kutular: ex.options.map((_, i) => etiketler[i]),
        cevap: ex.options.map((o, i) => `${etiketler[i]}=${sira.indexOf(o.id) + 1}`).join(', '),
        celdiriciler: [],
      });
    }

    case 'NUMBER_LINE':
      return olustur('kutuyaYaz', {
        secenekler: [],
        harfRozeti: false,
        kutular: [''],
        cevap: String(ex.validation.dogruDeger),
        celdiriciler: [],
      });
  }
}
