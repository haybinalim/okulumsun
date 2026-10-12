/**
 * YEREL HATA GÜNLÜĞÜ (plan v2 Adım 23, ADR-0005).
 *
 * Sınıfta çöken uygulamanın nedenini veri toplamadan görmek için: kayıtlar
 * YALNIZ BELLEKTE, en fazla 20 tane (halka tampon). Sayfa yenilenince silinir.
 * Hiçbir depolama API'sine (localStorage, sessionStorage, IndexedDB) yazılmaz,
 * ağa gönderilmez. Yetişkin isterse "Sorun bildir" ekranından metni kopyalayıp
 * kendisi iletir.
 *
 * Kişisel veri ALINMAZ: öğrenci adı, cevap, oturum içeriği kayda girmez.
 * Mesajdaki e-posta adresleri, URL sorgu/hash parçaları `temizle()` ile atılır.
 */

export type HataTuru = 'render' | 'promise' | 'ses' | 'pwa';

export interface HataKaydi {
  /** Date.now() — yalnız bellekte. */
  readonly ts: number;
  readonly tur: HataTuru;
  /** İlk 200 karakter, temizlenmiş. */
  readonly mesaj: string;
  /** appStore.ekran (ekran adı, kişisel değil). */
  readonly ekran: string;
  /** İlk 5 satır, yalnız `dosya:satır`. */
  readonly yigin?: string;
}

export const AZAMI_KAYIT = 20;
export const AZAMI_MESAJ = 200;
const AZAMI_YIGIN_SATIRI = 5;

let kayitlar: HataKaydi[] = [];

/** Etkin ekran adını veren işlev; `main.tsx` appStore'u bağlar (modül döngüsü olmasın diye). */
let ekranSaglayici: () => string = () => 'bilinmiyor';
export function ekranSaglayicisiAyarla(f: () => string): void {
  ekranSaglayici = f;
}

/** Olası kişisel veriyi ve URL ayrıntısını metinden atar. */
export function temizle(metin: string): string {
  return metin
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '[e-posta]')
    .replace(/(https?:\/\/[^\s?#'"]*)[?#][^\s'"]*/g, '$1')
    .replace(/(\b[\w./-]+\.(?:html?|js|mjs|ts|tsx))[?#][^\s'"):]*/g, '$1');
}

/** Yığın izinden yalnız `dosya:satır` parçalarını alır (en fazla 5). */
export function yiginiSadelestir(yigin: string | undefined): string | undefined {
  if (!yigin) return undefined;
  const satirlar: string[] = [];
  for (const satir of yigin.split('\n')) {
    const m = /([\w.-]+\.(?:m?js|tsx?|jsx))(?:[?#][^:\s)]*)?:(\d+)/.exec(satir);
    if (m) satirlar.push(`${m[1]}:${m[2]}`);
    if (satirlar.length >= AZAMI_YIGIN_SATIRI) break;
  }
  return satirlar.length > 0 ? satirlar.join('\n') : undefined;
}

export type YeniKayit = Omit<HataKaydi, 'ts' | 'ekran'> & { readonly ekran?: string };

export function kayitEkle(k: YeniKayit, simdi: number = Date.now()): void {
  const kayit: HataKaydi = {
    ts: simdi,
    tur: k.tur,
    mesaj: temizle(k.mesaj).slice(0, AZAMI_MESAJ),
    ekran: k.ekran ?? ekranSaglayici(),
    ...(k.yigin ? { yigin: yiginiSadelestir(temizle(k.yigin)) } : {}),
  };
  kayitlar = [...kayitlar, kayit].slice(-AZAMI_KAYIT);
  for (const dinleyici of dinleyiciler) dinleyici();
}

export function kayitlariAl(): readonly HataKaydi[] {
  return kayitlar;
}

export function kayitlariTemizle(): void {
  kayitlar = [];
  for (const dinleyici of dinleyiciler) dinleyici();
}

// React `useSyncExternalStore` için abonelik.
const dinleyiciler = new Set<() => void>();
export function abone(dinleyici: () => void): () => void {
  dinleyiciler.add(dinleyici);
  return () => dinleyiciler.delete(dinleyici);
}

export interface RaporOrtami {
  readonly cihaz: string;
  readonly kurulu: boolean;
  readonly cevrimici: boolean;
  readonly kullaniciAjani: string;
}

/** Yetişkinin kopyalayacağı düz metin rapor. */
export function raporMetni(surum: string, ortam: RaporOrtami, liste: readonly HataKaydi[] = kayitlar): string {
  const satirlar = [
    'okulumsun sorun raporu',
    `Sürüm: ${surum}`,
    `Cihaz profili: ${ortam.cihaz}`,
    `Kurulu uygulama: ${ortam.kurulu ? 'evet' : 'hayır'}`,
    `Çevrim içi: ${ortam.cevrimici ? 'evet' : 'hayır'}`,
    `Tarayıcı: ${temizle(ortam.kullaniciAjani).slice(0, AZAMI_MESAJ)}`,
    `Kayıt sayısı: ${liste.length}`,
  ];
  liste.forEach((k, i) => {
    satirlar.push('', `#${i + 1} ${new Date(k.ts).toISOString()} · ${k.tur} · ekran: ${k.ekran}`, k.mesaj);
    if (k.yigin) satirlar.push(k.yigin);
  });
  return satirlar.join('\n');
}
