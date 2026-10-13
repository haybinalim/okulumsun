/**
 * KARARLI DÜĞÜM KODLARI (plan v2 Adım 34).
 *
 * Her beceri düğümünün kalıcı 2 karakterlik kodu vardır: ilk harf temadır (a = tema 1 … g = tema 7),
 * ikinci karakter temadaki sıradır (1–9, sonra a–z). Kod, bugünün seti (34), çalışma kâğıdı (35),
 * eve link (42) ve arşiv (48) tarafından aynı tabloyla kullanılır.
 *
 * KURAL: bir kod bir kez verilir, hiçbir zaman yeniden kullanılmaz. Düğüm silinirse kodu tabloda
 * KALIR (`SILINEN_KODLAR`); yeni düğüm yeni kod alır (tema harfi + sıradaki boş karakter).
 * `scripts/validate-content.ts` her düğümün kodunu, kodların benzersizliğini ve silinen kodların
 * çakışmadığını denetler.
 */
import type { SkillId } from '../exercises/types';

export const DUGUM_KODLARI: Readonly<Record<SkillId, string>> = {
  'mat.uzam.konum-ifadeleri': 'a1',
  'mat.uzam.yon-yonerge': 'a2',
  'mat.uzam.eslik': 'a3',
  'mat.ritmik.ileri-birer-20': 'b1',
  'mat.sayma.birebir-esleme': 'b2',
  'mat.sayma.sipsak-sayilama': 'b3',
  'mat.sayma.kardinalite': 'b4',
  'mat.sayma.dagilmis-10': 'b5',
  'mat.sayma.yirmiye-kadar': 'b6',
  'mat.sayma.tahmin': 'b7',
  'mat.sayi.rakam-tanima': 'b8',
  'mat.sayi.miktar-rakam-eslestirme': 'b9',
  'mat.sayi.onluk-cerceve': 'ba',
  'mat.sayi.onluk-birlik': 'bb',
  'mat.sayi.sira-sayisi': 'bc',
  'mat.karsilastirma.sezgisel': 'bd',
  'mat.karsilastirma.birebir-esleme': 'be',
  'mat.karsilastirma.on-referansi': 'bf',
  'mat.ritmik.ileri-birer-100': 'bg',
  'mat.ritmik.ileri-onar-100': 'bh',
  'mat.ritmik.ileri-beser-100': 'bi',
  'mat.ritmik.ileri-ikiser-20': 'bj',
  'mat.ritmik.geri-birer-20': 'bk',
  'mat.ritmik.geri-ikiser-20': 'bl',
  'mat.oruntu.tekrar-eden-sekil': 'bm',
  'mat.oruntu.artan-sayi': 'bn',
  'mat.oruntu.azalan-sayi': 'bo',
  'mat.olcme.uzunluk-kiyas': 'c1',
  'mat.olcme.kutle-kiyas': 'c2',
  'mat.olcme.birimle-olcme': 'c3',
  'mat.olcme.olcum-tahmini': 'c4',
  'mat.toplama.gorsel-birlestirme': 'd1',
  'mat.toplama.hepsini-sayma': 'd2',
  'mat.toplama.ustune-sayma': 'd3',
  'mat.toplama.ona-tumleme': 'd4',
  'mat.toplama.onu-gecen-20': 'd5',
  'mat.toplama.tahmin-zihinden': 'd6',
  'mat.cikarma.ayirma': 'd7',
  'mat.cikarma.geriye-sayarak': 'd8',
  'mat.cikarma.fark-bulma': 'd9',
  'mat.cikarma.onluk-bozmadan-20': 'da',
  'mat.cebir.esit-isareti': 'db',
  'mat.cebir.esitligi-donusturme': 'dc',
  'mat.cebir.eksik-toplanan': 'dd',
  'mat.cebir.ters-islem': 'de',
  'mat.cebir.islem-hikayesi': 'df',
  'mat.para.banknot-tanima': 'e1',
  'mat.para.deger-siralama': 'e2',
  'mat.geometri.yuvarlak-koseli': 'f1',
  'mat.geometri.kenar-kose': 'f2',
  'mat.geometri.sekil-adlandirma': 'f3',
  'mat.geometri.dondurulmus-sekil': 'f4',
  'mat.geometri.yapidaki-sekiller': 'f5',
  'mat.veri.gruplama': 'g1',
  'mat.veri.cetele': 'g2',
  'mat.veri.siklik-tablosu': 'g3',
  'mat.veri.nesne-grafigi': 'g4',
};

/** Silinmiş düğümlerin kodları — yeniden verilmez. Şimdilik boş. */
export const SILINEN_KODLAR: readonly string[] = [];

const KOD_DUGUM: ReadonlyMap<string, SkillId> = new Map(
  (Object.entries(DUGUM_KODLARI) as [SkillId, string][]).map(([id, kod]) => [kod, id]),
);

/** Koddan düğüm kimliği; bilinmeyen kod → `null`. */
export function kodaGoreDugum(kod: string): SkillId | null {
  return KOD_DUGUM.get(kod) ?? null;
}
