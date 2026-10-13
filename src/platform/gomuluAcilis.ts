/**
 * Gömülü bağlamın tarayıcıdan okunması (plan v2 Adım 56). Üst pencerenin içeriğine ERİŞİLMEZ;
 * yalnız `window.self !== window.top` kimlik karşılaştırması (başka kökenden de güvenle yapılabilir).
 * Sonuç açılışta bir kez hesaplanır ve değişmez.
 */
import { gomuluBaglam, gomuluKisitlari, type GomuluBaglam, type GomuluKisitlari } from '../gomulu';

function ustPencereFarkliMi(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    // Bazı tarayıcılar başka kökenli üst pencere karşılaştırmasında hata atar: o hâlde gömülüdür.
    return true;
  }
}

let onbellek: { baglam: GomuluBaglam; kisitlar: GomuluKisitlari } | null = null;

export function gomuluDurum(): { baglam: GomuluBaglam; kisitlar: GomuluKisitlari } {
  if (onbellek) return onbellek;
  if (typeof window === 'undefined') return { baglam: 'yok', kisitlar: gomuluKisitlari('yok', true) };
  const baglam = gomuluBaglam(window.location.search, ustPencereFarkliMi());
  const tamEkranIzinli = typeof document !== 'undefined' && document.fullscreenEnabled === true;
  onbellek = { baglam, kisitlar: gomuluKisitlari(baglam, tamEkranIzinli) };
  if (baglam !== 'yok') document.documentElement.dataset.gomulu = baglam;
  return onbellek;
}
