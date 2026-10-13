/**
 * GÖMÜLÜ MOD — SAF (plan v2 Adım 56, G43).
 *
 * Uygulama bir portalın (EBA, okul portalı) içinde iframe ile açıldığında `?gomulu=eba` veya
 * `?gomulu=okul-portali` ile sadeleşir: üst pencereyi dışarıya yönlendiren yetişkin girişleri
 * (Eve gönder: başka adrese bağlantı/QR üretir) gizlenir; "Sorun bildir", ayarlar ve lisanslar
 * (Kaynaklar — lisans atfı zorunlu) kalır. Tam ekran yalnız iframe izin veriyorsa gösterilir
 * (`allow="fullscreen; screen-wake-lock"`).
 *
 * Parametre tek başına yetmez: uygulama gerçekten başka bir pencerenin içinde DEĞİLSE gömülü mod
 * açılmaz (bağımsız sekmede bir adres parametresi öğretmen girişlerini gizleyemez).
 *
 * Üst pencereyle HİÇBİR iletişim yok: `postMessage` K9'da yasak, üst pencerenin içeriği okunmaz;
 * yalnız "üst pencere ben miyim" kimlik karşılaştırması yapılır (`src/platform/gomuluAcilis.ts`).
 * `frame-ancestors` yayın başlığı EBA alan adları EBA ile teyit edilene kadar `'self'` kalır.
 */
export type GomuluBaglam = 'yok' | 'eba' | 'okul-portali';

export const GOMULU_PARAMETRESI = 'gomulu' as const;
const GECERLI: readonly GomuluBaglam[] = ['eba', 'okul-portali'];

/** `location.search` + "üst pencere farklı mı" → bağlam. Bilinmeyen değer veya iframe dışı → `yok`. */
export function gomuluBaglam(arama: string, ustPencereFarkli: boolean): GomuluBaglam {
  if (!ustPencereFarkli) return 'yok';
  let deger: string | null;
  try {
    deger = new URLSearchParams(arama).get(GOMULU_PARAMETRESI);
  } catch {
    return 'yok';
  }
  return (GECERLI as readonly string[]).includes(deger ?? '') ? (deger as GomuluBaglam) : 'yok';
}

export interface GomuluKisitlari {
  /** "Eve gönder" (başka adrese bağlantı ve QR). */
  readonly eveGonder: boolean;
  /** "Derste tam ekran" ayarı ve ses kilidindeki tam ekran denemesi. */
  readonly tamEkran: boolean;
  /** Sorun bildir her bağlamda açıktır. */
  readonly sorunBildir: true;
  /** Lisanslar ve gizlilik (Kaynaklar) her bağlamda açıktır — atıf zorunluluğu. */
  readonly kaynaklar: true;
}

/** Bağlam + iframe'in tam ekran izni → hangi girişler görünür. */
export function gomuluKisitlari(baglam: GomuluBaglam, tamEkranIzinli: boolean): GomuluKisitlari {
  const gomulu = baglam !== 'yok';
  return {
    eveGonder: !gomulu,
    tamEkran: !gomulu || tamEkranIzinli,
    sorunBildir: true,
    kaynaklar: true,
  };
}
