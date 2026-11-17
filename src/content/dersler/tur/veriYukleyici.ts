import { kayitEkle } from '../../../hata/hataKaydi';

/**
 * Türkçe ders verisi yükleyicisi (ADR-0016): içerik JSON'ları JS'e gömülmez; bayraklı derlemede
 * `dist/tur/` altına kopyalanır (`scripts/yayin/dersVerisi.ts`) ve buradan AYNI KÖKENDEN, göreli yolla
 * okunur (CSP `connect-src 'self'`; okul sunucusu/alt dizin uyumlu, `base: './'`). Dış adres, `..` ve
 * mutlak yol reddedilir. K9 taraması bu dosyadaki `fetch`'e yalnız `TUR_VERI_KOKU` ile izin verir.
 */

/** Uygulama köküne göre veri kökü (ADR-0016 `yayinYolu`). */
export const TUR_VERI_KOKU = './tur/';

const GECERLI_YOL = /^[a-z0-9][a-z0-9-]*(\/[a-z0-9][a-z0-9-]*)*\.json$/;
/** Ses klibi: `ses/<tür>/<ad>.m4a` (üretim `ders-verisi/tur/ses/` ile aynı yerleşim; `scripts/ses/turKlipleri.ts`). */
const GECERLI_SES_YOLU = /^ses\/(sozcuk|hece|cumle|yonerge|geri)\/[a-z0-9][a-z0-9-]*\.m4a$/;

/** Göreli veri yolunu doğrular; geçersizse hata (dış adres, `..`, mutlak yol, JSON ya da ses klibi olmayan dosya). */
export function turVeriYolu(dosya: string): string {
  if (!GECERLI_YOL.test(dosya) && !GECERLI_SES_YOLU.test(dosya)) throw new Error(`Geçersiz Türkçe veri yolu: ${dosya}`);
  return `${TUR_VERI_KOKU}${dosya}`;
}

export async function turVerisiniOku(dosya: string): Promise<unknown> {
  const yanit = await fetch(turVeriYolu(dosya), { credentials: 'same-origin' });
  if (!yanit.ok) throw new Error(`Türkçe veri okunamadı (${yanit.status}): ${dosya}`);
  return (await yanit.json()) as unknown;
}

/** Türkçe ses klibinin ham baytları (`dosya`: `sozcuk/kale.m4a`, `klipler.json` `dosya` alanı). Hata fırlatır. */
export async function turSesiniOku(dosya: string): Promise<ArrayBuffer> {
  const yanit = await fetch(turVeriYolu(`ses/${dosya}`), { credentials: 'same-origin' });
  if (!yanit.ok) throw new Error(`Türkçe ses okunamadı (${yanit.status}): ${dosya}`);
  return yanit.arrayBuffer();
}

// ------------------------------------------------------------------------------------------------
// TÜRKÇE SES KLİPLERİ: anahtar (`tur.sozcuk.kale`) → ses baytları. `speech.ts` (matematikle AYNI çalma hattı) bunu
// çağırır; YALNIZ `VITE_DERS_TUR=1` derlemesinde etkindir (speech.ts bayrak kapalıyken bu yolu hiç bağlamaz).
//
// Kaynak `ders-verisi/tur/ses/klipler.json` (çalışmada `./tur/ses/klipler.json`). Klip başına karar: yalnız
// `durum: "var"` çalınabilir; `eksik` (ya da D-11'e aykırı / dosya yolu anahtarla tutmayan) klip SESSİZ kalır ve
// arayüz o klip için "Ses yok" gösterir. Dosya yolu `klipler.json` `dosya` alanıdır; üretim betiğinin
// (`scripts/ses/turKlipleri.ts` `turKlipDosyasi`) kuralıyla anahtardan türeyen yolla BİREBİR aynı olmalıdır.
// (Bu kod ayrı bir modül değil bu dosyada: `speech.ts`ten yeni bir modüle kenar eklemek bayraksız paketi değiştirir.)
// ------------------------------------------------------------------------------------------------

const ANAHTAR = /^tur\.(sozcuk|hece|cumle|yonerge|geri)\.([a-z0-9][a-z0-9-]*)$/;

interface TurKlip {
  readonly metin: string;
  readonly dosya: string;
}

let manifest: Promise<ReadonlyMap<string, TurKlip> | null> | null = null;
let manifestHatasiYazildi = false;
/** Çözülemeyen ("var" denip alınamayan) klipler: arayüz bunlar için "Ses yok" gösterir. */
const basarisiz = new Set<string>();
/** Hata kaydı yazılmış klipler: aynı klip için oturumda tek kayıt (her yeniden denemede kayıt spamı olmasın). */
const hataYazilan = new Set<string>();

/**
 * D-11 / K-OY-03: metin en az bir ünlü taşımalı; tek ünsüz (ya da ünlüsüz) metin çalınmaz. `alfabe` içe aktarılmaz
 * (üst düzey yan etki taşır; `speech.ts`e bağlanınca bayraksız paketi değiştirirdi) — ünlü kümesi
 * `alfabe.UNLULER` + şapkalılar; `turKlipYolu.spec.ts` ikisinin tutarlılığını denetler.
 */
const UNLU = /[aeıioöuüâîûAEIİOÖUÜÂÎÛ]/;
export function turKlipMetniCalinabilirMi(metin: string): boolean {
  return metin.trim().length > 0 && UNLU.test(metin);
}

/** `tur.sozcuk.kale` → `sozcuk/kale.m4a`; geçersiz anahtar `null`. */
export function turKlipDosyasi(anahtar: string): string | null {
  const m = ANAHTAR.exec(anahtar);
  return m ? `${m[1]}/${m[2]}.m4a` : null;
}

/** Yalnız `durum: "var"` ve tutarlı klipleri alır; bozuk satırı atlar (o klip eksik sayılır). */
function manifestiAyir(ham: unknown): ReadonlyMap<string, TurKlip> {
  const sonuc = new Map<string, TurKlip>();
  const klipler = (ham as { klipler?: unknown } | null)?.klipler;
  if (!Array.isArray(klipler)) throw new Error('klipler.json: "klipler" yok');
  for (const k of klipler as Record<string, unknown>[]) {
    if (k?.durum !== 'var' || typeof k.anahtar !== 'string' || typeof k.metin !== 'string') continue;
    if (typeof k.dosya !== 'string' || turKlipDosyasi(k.anahtar) !== k.dosya) continue;
    if (!turKlipMetniCalinabilirMi(k.metin)) continue;
    sonuc.set(k.anahtar, { metin: k.metin, dosya: k.dosya });
  }
  return sonuc;
}

/** Çalınabilir (`var`) klipler; manifest okunamazsa `null` (bir kez hata kaydı, çökme yok). Başarılı sonuç önbelleklenir. */
function manifestiOku(): Promise<ReadonlyMap<string, TurKlip> | null> {
  manifest ??= turVerisiniOku('ses/klipler.json').then(
    (ham) => {
      try {
        return manifestiAyir(ham);
      } catch {
        return hata();
      }
    },
    () => hata(),
  );
  return manifest;
}

function hata(): null {
  manifest = null; // bir sonraki istek yeniden dener (geçici ağ hatası kalıcı sessizlik olmasın)
  if (!manifestHatasiYazildi) {
    manifestHatasiYazildi = true;
    kayitEkle({ tur: 'ses', mesaj: 'Türkçe klip manifesti yüklenemedi' });
  }
  return null;
}

/** Klip çalınabilir mi? (`var`, tutarlı, D-11'e uygun ve alınması denenip düşmemiş.) */
export async function turKlipVarMi(anahtar: string): Promise<boolean> {
  const m = await manifestiOku();
  // `basarisiz` BURADA bakılmaz: düşmüş klip yeniden denenebilmeli (geçici 404 düzelince çalsın); "Ses yok" kararı
  // yükleme sonrası `turKlipBasarisizMi` ile verilir.
  return m !== null && m.has(anahtar);
}

/** Bu klibin alınışı düşmüş mü (404/ağ)? `prefetch` sonrasında arayüzün "Ses yok" kararı için. */
export function turKlipBasarisizMi(anahtar: string): boolean {
  return basarisiz.has(anahtar);
}

/**
 * `speech` için: klibin ham baytları. `eksik`/bilinmeyen/D-11'e aykırı klip için `null` (sessiz, hata kaydı yok:
 * bu beklenen durum). Var denen klip alınamazsa hata kaydı (tür 'ses') + `null`; `basarisiz`e işlenir.
 */
export async function turKlipBaytlari(anahtar: string): Promise<ArrayBuffer | null> {
  const m = await manifestiOku();
  const klip = m?.get(anahtar);
  if (!klip) return null;
  try {
    const bayt = await turSesiniOku(klip.dosya);
    basarisiz.delete(anahtar); // geçici hata sonrası başarı: kalıcı "Ses yok" kalmasın
    return bayt;
  } catch {
    basarisiz.add(anahtar);
    if (!hataYazilan.has(anahtar)) {
      hataYazilan.add(anahtar);
      kayitEkle({ tur: 'ses', mesaj: `Türkçe klip yüklenemedi: ${anahtar}` });
    }
    return null;
  }
}

/** Klip baytları alındı ama çözülemedi (bozuk dosya): arayüz de o klip için "Ses yok" göstersin (hata kaydını servis yazar). */
export function turKlipCozulemedi(anahtar: string): void {
  basarisiz.add(anahtar);
}

/** Yalnız testler için: önbellek ve hata durumunu sıfırlar. */
export function turKlipSifirla(): void {
  manifest = null;
  manifestHatasiYazildi = false;
  basarisiz.clear();
  hataYazilan.clear();
}
