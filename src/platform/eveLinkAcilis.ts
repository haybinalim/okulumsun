/**
 * EVE LİNK AÇILIŞI (plan v2 Adım 42 aşama 2, ADR-0010).
 *
 * Açılışta `location.hash` bir eve link GİRİŞİMİ ise (geçerli olsun olmasın) hash hemen
 * `history.replaceState` ile adresten silinir — geçmişte, yer iminde veya paylaşılan adreste kalmaz.
 * Geçerliyse set döner (yalnız bellekte tutulur); değilse `null` ve uygulama olağan akışla açılır.
 * Depolama ve ağ yok.
 */
import { eveLinkCoz, eveLinkGirisimiMi } from '../ogretmen/eveLink';
import { setlenebilirDugumler, type GunlukSet } from '../ogretmen/gunlukSet';
import { REGISTRY } from '../exercises/registry';

export interface AdresCubugu {
  readonly hash: string;
  readonly pathname: string;
  readonly search: string;
  replaceState: (url: string) => void;
}

export function eveLinkiAcilistaOku(adres: AdresCubugu): GunlukSet | null {
  if (!eveLinkGirisimiMi(adres.hash)) return null;
  const set = eveLinkCoz(
    adres.hash,
    setlenebilirDugumler((t) => REGISTRY.has(t)),
  );
  adres.replaceState(`${adres.pathname}${adres.search}`);
  return set;
}

/** Tarayıcı adres çubuğu. */
export function tarayiciAdresi(): AdresCubugu {
  return {
    hash: window.location.hash,
    pathname: window.location.pathname,
    search: window.location.search,
    replaceState: (url) => window.history.replaceState(window.history.state, '', url),
  };
}
