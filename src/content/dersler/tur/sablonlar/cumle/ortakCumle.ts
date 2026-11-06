/**
 * Cümle şablonlarının ortak yardımcıları (Adım 74; T-10, T-11, T-12). SAF. Cümle şablonlarıyla birlikte ayrı tembel
 * parçadadır (`turCumle.ts`).
 */
import { trKucuk } from '../../alfabe';
import { harfSirasi } from '../../ogretilenKume';
import { soruGirisHarfi } from '../ortak';
import type { TurHavuzCumlesi } from '../turSoru';

/** Cümlenin sözcükleri (noktalama atılır; özel ad + ek, kesmeden önceki gövde ayrı tutulmaz). */
export function cumleSozcukleri(metin: string): string[] {
  return metin
    .split(' ')
    .map((s) => s.replace(/[.,?!]+$/u, ''))
    .filter((s) => s.length > 0);
}

/** Küçük harfli sözcük gövdeleri (kesmeden önce): resim sözcüğü cümlede geçiyor mu diye bakmak için. */
export function cumleGovdeleri(metin: string): string[] {
  return cumleSozcukleri(trKucuk(metin)).map((s) => s.split("'")[0]);
}

/** Sorunun giriş harfi: metinlerin hesaplanan giriş noktası ile cümlenin bildirilen giriş harfinin geç olanı (ünlem). */
export function cumleGirisHarfi(c: TurHavuzCumlesi, metinler: readonly string[]): string {
  const h = soruGirisHarfi([c.metin, ...metinler]);
  return harfSirasi(c.girisHarfi) > harfSirasi(h) ? c.girisHarfi : h;
}

/** Soru eki ayrı sözcük olarak geçiyor mu (mı, mi, mu, mü) — en kolay soru cümlesi ipucu. */
export function soruEkiVarMi(metin: string): boolean {
  return cumleSozcukleri(trKucuk(metin)).some((s) => ['mı', 'mi', 'mu', 'mü'].includes(s));
}
