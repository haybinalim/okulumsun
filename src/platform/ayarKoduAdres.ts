/**
 * AYAR KODU ↔ ADRES ÇUBUĞU (plan v2 Adım 55).
 *
 * Açılışta `#ayar=…` okunur: geçerliyse kapsayıcılık ayarları belleğe alınır ve hash adreste KALIR
 * (öğretmenin yer imi bu adrestir); geçersiz girişim adresten silinir. Ayar değişince hash
 * `history.replaceState` ile yeniden yazılır (geçmişe kayıt eklenmez); hepsi kapalıysa ayar hash'i
 * silinir. Başka bir hash'e (ör. eve link) dokunulmaz. Depolama ve ağ yok; hash sunucuya gitmez.
 */
import { ayarHash, ayarKoduCoz, ayarKoduGirisimiMi } from '../ogretmen/ayarKodu';
import type { KapsayicilikAyarlari } from '../design/kapsayicilik';
import type { AdresCubugu } from './eveLinkAcilis';

export function ayarKodunuAcilistaOku(adres: AdresCubugu): KapsayicilikAyarlari | null {
  if (!ayarKoduGirisimiMi(adres.hash)) return null;
  const ayarlar = ayarKoduCoz(adres.hash);
  if (!ayarlar) adres.replaceState(`${adres.pathname}${adres.search}`);
  return ayarlar;
}

/** Yazılacak yeni adres; değişiklik gerekmiyorsa veya hash başka bir şeye aitse `null`. */
export function ayarAdresi(adres: Pick<AdresCubugu, 'hash' | 'pathname' | 'search'>, a: KapsayicilikAyarlari): string | null {
  const bos = adres.hash === '' || adres.hash === '#';
  if (!bos && !ayarKoduGirisimiMi(adres.hash)) return null; // başka hash'e dokunma
  const mevcut = bos ? '' : adres.hash;
  const yeni = ayarHash(a);
  return mevcut === yeni ? null : `${adres.pathname}${adres.search}${yeni}`;
}

export function ayarKodunuAdreseYaz(adres: AdresCubugu, a: KapsayicilikAyarlari): void {
  const yeni = ayarAdresi(adres, a);
  if (yeni !== null) adres.replaceState(yeni);
}
