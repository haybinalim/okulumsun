import { kumeKodla } from '../../content/dersler/tur/ogretilenKume';
import { setKodu, type SetDuzeyi } from '../../content/dersler/tur/turSet';

/**
 * Türkçe eve link (Okuma Yazma Adım 71 aşama 3). SAF. YALNIZ `VITE_DERS_TUR=1` derlemesinde.
 * Bağlantıda yalnız ders, set kodu (düzey + tohum) ve öğretilen küme kodu var: ad, sınıf, okul, cevap yok.
 */
export function turEveLink(kok: string, duzey: SetDuzeyi, tohum: number, kume: ReadonlySet<string>): string {
  const u = new URL(kok);
  u.search = new URLSearchParams({ ders: 'tur', ev: setKodu(duzey, tohum), tur: kumeKodla(kume) }).toString();
  return u.toString();
}

/** Program kaynağı (docs/mufredat-kisitlari-turkce.md); Kaynaklar ekranında gösterilir. */
export const PROGRAM_ADRESI = 'https://tymm.meb.gov.tr/assets/pdf/ilkokul-turkce-dersi_20260902_111433_940.pdf';
