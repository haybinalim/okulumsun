/**
 * CEVAP ANAHTARI (plan v2 Adım 35). Doğru cevap jeneratörün doğrulama alanından gelir (`kagitMaddesi.cevap`);
 * her çeldirici için `misconceptions.json` tanı etiketi + müdahale önerisi eklenir.
 * Dil kuralı: "yanlış" yok — "… seçtiyse" (çocuk cezalandırılmaz, tanı konur).
 */
import { HATA_TANIMLARI, type HataEtiketi } from '../../exercises/distractors';
import type { KagitMaddesi } from './kagitMaddesi';

export interface CeldiriciNotu {
  readonly secenek: string;
  readonly tani: string;
  readonly ipucu: string;
}

export interface CevapSatiri {
  readonly no: number;
  readonly dogru: string;
  readonly celdiriciNotlari: readonly CeldiriciNotu[];
}

/**
 * Çeldirici tanı başlıkları = `misconceptions.json` `hatalar[].etiket` değerleri. JSON 120 KB olduğu için pakete
 * girmez; `tests/unit/calismaKagidi.spec.ts` bu tabloyu JSON ile birebir eşleştirir (yan yana kayma testte yakalanır).
 */
export const HATA_BASLIKLARI: Readonly<Record<HataEtiketi, string>> = {
  GOREV_ANLASILMADI: 'Görev anlaşılmamış (ölçüm geçersiz)',
  BIREBIR_ESLESME: 'Birebir eşleşme kurulamıyor',
  KARDINALITE: 'Son sayı bütünü temsil etmiyor',
  FAZLA_SAYMA: 'Fazla sayma',
  EKSIK_SAYMA: 'Eksik sayma',
  BUYUKLUK_MIKTAR: 'Büyük nesne = çok sanma',
  HEPSINI_SAYMA: 'Baştan hepsini sayma (üstüne sayamıyor)',
  TEK_KUMEYI_ALMA: 'Yalnız bir kümeyi sayma',
  ISLEM_YONU: 'İşlem yönünü karıştırma',
  ESIT_ISLEM_SONUCU: "Eşittir işaretini 'cevap gelir' sanma",
  ONLUK_BOZMA: 'Onluk yapıyı çözememe',
  SAYI_DOGRUSU_ARALIK: 'Sayı doğrusunda işaret sayma (çit direği hatası)',
  ORUNTU_FAZ: 'Örüntüde faz kayması',
  SEKIL_PROTOTIP: 'Şekli yalnız alışıldık duruşunda tanıma',
  PARA_BOYUT_DEGER: 'Banknot boyutunu değerle karıştırma',
};

/** Etiketin öğretmene görünen tanısı ve kısa telafi yönü; tanınmayan etiket için `undefined`. */
export function hataNotu(etiket: HataEtiketi): { tani: string; ipucu: string } | undefined {
  const tani = HATA_BASLIKLARI[etiket];
  if (!tani) return undefined;
  return { tani, ipucu: HATA_TANIMLARI[etiket]?.telafi ?? '' };
}

export function cevapSatiriYap(m: KagitMaddesi): CevapSatiri {
  const notlar: CeldiriciNotu[] = [];
  for (const c of m.celdiriciler) {
    const not = hataNotu(c.hata);
    if (not) notlar.push({ secenek: c.secenek, tani: not.tani, ipucu: not.ipucu });
  }
  return { no: m.no, dogru: m.cevap, celdiriciNotlari: notlar };
}

/** Anahtarda gösterilecek tek cümle: "B seçtiyse: Fazla sayma." */
export function celdiriciCumlesi(n: CeldiriciNotu): string {
  return `${n.secenek} seçtiyse: ${n.tani}.`;
}
