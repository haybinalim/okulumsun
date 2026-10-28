/**
 * Ses kaynağı sözleşmesi — SAF modül (Adım 15, G01/E18/E27).
 *
 * Her klibin özeti artık yalnız metne değil, onu üreten modelin kimliğine de
 * bağlıdır: model değişirse tüm klipler yeniden üretilmek zorundadır ve CI,
 * lisanssız bir modelle üretilmiş klipleri ayırt edebilir.
 * Karar kaynakları: KG-01 (Google Cloud TTS Chirp 3 HD), KG-08 (yasak kaynaklar),
 * KG-15 (mevcut 287 klibin kökeni bilinmiyor). Ayrıntı: docs/ses/SES_KAYNAKLARI.md
 */

import { createHash } from 'node:crypto';

export type Saglayici =
  | 'piper'
  | 'say'
  | 'insan'
  | 'google'
  | 'chatterbox'
  | 'eleven'
  | 'diger-ticari'; // KG-01: üretimde 'google'

export const SAGLAYICILAR: readonly Saglayici[] = [
  'piper',
  'say',
  'insan',
  'google',
  'chatterbox',
  'eleven',
  'diger-ticari',
];

export interface SesKaynagi {
  readonly saglayici: Saglayici;
  /** 'piper:tr_TR-dfki-medium@<sha256-ilk16>' | 'google:tr-TR-Chirp3-HD-<ses>@2026-10' | 'insan:<sozlesme-no>' */
  readonly modelKimligi: string;
  /** Model kartı, hizmet şartları veya sözleşme referansı. */
  readonly lisansUrl: string;
  /** false → audio:audit kırmızı (K4; Adım 31'den beri istisnasız). */
  readonly ticariDagitimIzni: boolean;
  readonly cocukUrunundeKullanim: 'izinli' | 'kosullu' | 'bilinmiyor';
  /** Kaynaklar ekranına aynen yazılır. */
  readonly atifSarti: string | null;
}

/**
 * Kararı verilmiş ama henüz aktif olmayan kaynak (Adım 18). Adım 31'de (28 Eki 2026) aktif
 * kaynak Google Chirp 3 HD Puck oldu ve `bekleyen` alanı silindi; ileride ses/sağlayıcı
 * değişikliği aynı yolla (önce `bekleyen`, sonra yeniden üretim) yapılır.
 */
export interface BekleyenKaynak {
  readonly saglayici: Saglayici;
  readonly model: string;
  readonly ses: string | null;
  readonly ticariDagitimIzni: boolean;
  readonly cocukUrunundeKullanim: 'izinli' | 'kosullu' | 'bilinmiyor';
  readonly sartlarUrl: readonly string[];
  /** YYYY-AA-GG — şartların birincil kaynaktan okunduğu gün. */
  readonly sartlarOkunduTarih: string;
  readonly atifSarti: string | null;
}

export function bekleyenKaynagiDogrula(deger: unknown): BekleyenKaynak {
  if (typeof deger !== 'object' || deger === null) throw new Error('Bekleyen kaynak bir nesne olmalı.');
  const k = deger as Record<string, unknown>;
  if (!SAGLAYICILAR.includes(k.saglayici as Saglayici)) {
    throw new Error(`Bilinmeyen ses sağlayıcısı: ${String(k.saglayici)}`);
  }
  if (typeof k.model !== 'string' || k.model.trim() === '') throw new Error('Bekleyen kaynağın modeli boş olamaz.');
  if (k.ses !== null && (typeof k.ses !== 'string' || k.ses.trim() === '')) {
    throw new Error('ses metin veya null olmalı.');
  }
  if (typeof k.ticariDagitimIzni !== 'boolean') throw new Error('ticariDagitimIzni true/false olmalı.');
  if (!['izinli', 'kosullu', 'bilinmiyor'].includes(k.cocukUrunundeKullanim as string)) {
    throw new Error('cocukUrunundeKullanim izinli | kosullu | bilinmiyor olmalı.');
  }
  if (!Array.isArray(k.sartlarUrl) || k.sartlarUrl.length === 0 || !k.sartlarUrl.every((u) => typeof u === 'string' && u.startsWith('https://'))) {
    throw new Error('sartlarUrl en az bir https adresi içermeli.');
  }
  if (typeof k.sartlarOkunduTarih !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(k.sartlarOkunduTarih)) {
    throw new Error('sartlarOkunduTarih YYYY-AA-GG olmalı.');
  }
  if (k.atifSarti !== null && typeof k.atifSarti !== 'string') throw new Error('atifSarti metin veya null olmalı.');
  return k as unknown as BekleyenKaynak;
}

/** Yönerge sesinin (aktif kaynak) varsayılan konuşma hızı (KG-107). Özete yalnız bundan farklıysa girer. */
export const VARSAYILAN_KONUSMA_HIZI = 0.9;

/**
 * Anahtar bazlı ses (KG-114): belirli ad alanlarının klipleri aktif kaynakla AYNI sağlayıcının
 * başka bir sesiyle üretilir (ör. maskot sesi `maskot.*`, `hikaye.*` → Achernar). Eşleşmeyen
 * anahtarlar aktif kaynakla (yönerge sesi) üretilir ve özetleri değişmez.
 */
export interface AnahtarSesi {
  /** Anahtar önekleri, nokta ile biter: `maskot.`, `hikaye.`. */
  readonly onekler: readonly string[];
  /** Aktif kaynakla aynı biçim: `google:tr-TR-Chirp3-HD-<ses>@<YYYY-AA>`. */
  readonly modelKimligi: string;
  /** Konuşma hızı (0,25–2). */
  readonly hiz: number;
  /** Kararın kaydı (ör. `KG-114`). */
  readonly karar: string;
}

export function anahtarSesleriniDogrula(deger: unknown, aktif: SesKaynagi): readonly AnahtarSesi[] {
  if (deger === undefined || deger === null) return [];
  if (!Array.isArray(deger)) throw new Error('anahtarSesleri bir dizi olmalı.');
  const gorulen = new Set<string>();
  return deger.map((ham: unknown, i) => {
    if (typeof ham !== 'object' || ham === null) throw new Error(`anahtarSesleri[${i}] bir nesne olmalı.`);
    const a = ham as Record<string, unknown>;
    if (!Array.isArray(a.onekler) || a.onekler.length === 0) throw new Error(`anahtarSesleri[${i}].onekler boş olamaz.`);
    for (const o of a.onekler) {
      if (typeof o !== 'string' || !/^[a-z0-9-]+\.$/.test(o)) {
        throw new Error(`anahtarSesleri[${i}] öneki "ad-alani." biçiminde olmalı: ${String(o)}`);
      }
      for (const g of gorulen) {
        if (g.startsWith(o) || o.startsWith(g)) throw new Error(`anahtarSesleri önekleri çakışıyor: ${g} / ${o}`);
      }
      gorulen.add(o);
    }
    if (typeof a.modelKimligi !== 'string' || !a.modelKimligi.startsWith(`${aktif.saglayici}:`)) {
      throw new Error(`anahtarSesleri[${i}].modelKimligi aktif sağlayıcıyla (${aktif.saglayici}) başlamalı.`);
    }
    if (a.modelKimligi === aktif.modelKimligi) {
      throw new Error(`anahtarSesleri[${i}] aktif kaynakla aynı sesi tanımlıyor; gereksiz.`);
    }
    if (typeof a.hiz !== 'number' || !(a.hiz >= 0.25 && a.hiz <= 2)) {
      throw new Error(`anahtarSesleri[${i}].hiz 0.25–2 arasında olmalı.`);
    }
    if (typeof a.karar !== 'string' || a.karar.trim() === '') throw new Error(`anahtarSesleri[${i}].karar boş olamaz.`);
    return a as unknown as AnahtarSesi;
  });
}

/** `sesKaynagi.json`'u aktif kaynak, anahtar bazlı sesler ve bekleyen kaynağa ayırır (`$not` insan içindir). */
export function sesKaynagiDosyasiniAyir(ham: Readonly<Record<string, unknown>>): {
  readonly aktif: SesKaynagi;
  readonly anahtarSesleri: readonly AnahtarSesi[];
  readonly bekleyen: BekleyenKaynak | null;
} {
  const { $not: _not, bekleyen, anahtarSesleri, ...aktifHam } = ham;
  const aktif = sesKaynaginiDogrula(aktifHam);
  return {
    aktif,
    anahtarSesleri: anahtarSesleriniDogrula(anahtarSesleri, aktif),
    bekleyen: bekleyen === undefined || bekleyen === null ? null : bekleyenKaynagiDogrula(bekleyen),
  };
}

/** Bir anahtarın sesi: önekle eşleşen anahtar sesi varsa o, yoksa aktif kaynak (varsayılan hız). */
export function anahtarinSesi(
  aktif: SesKaynagi,
  anahtarSesleri: readonly AnahtarSesi[],
  anahtar: string,
): { readonly kaynak: SesKaynagi; readonly hiz: number; readonly anahtarSesi: AnahtarSesi | null } {
  const eslesen = anahtarSesleri.find((a) => a.onekler.some((o) => anahtar.startsWith(o))) ?? null;
  if (!eslesen) return { kaynak: aktif, hiz: VARSAYILAN_KONUSMA_HIZI, anahtarSesi: null };
  return { kaynak: { ...aktif, modelKimligi: eslesen.modelKimligi }, hiz: eslesen.hiz, anahtarSesi: eslesen };
}

/**
 * Anahtar bazlı özet (KG-114). Anahtar sesi yoksa `klipOzeti(aktif, metin)` ile BİREBİR aynı →
 * mevcut yönerge klipleri yeniden üretilmez. Anahtar sesi varsa özete o sesin model kimliği
 * (ses adı dahil) ve varsayılandan farklıysa hızı girer: ses ya da hız değişince klip yeniden üretilir.
 */
export function anahtarliKlipOzeti(
  aktif: SesKaynagi,
  anahtarSesleri: readonly AnahtarSesi[],
  anahtar: string,
  metin: string,
): string {
  const { kaynak, hiz, anahtarSesi } = anahtarinSesi(aktif, anahtarSesleri, anahtar);
  if (!anahtarSesi) return klipOzeti(aktif, metin);
  const hizEki = hiz === VARSAYILAN_KONUSMA_HIZI ? '' : `:hiz=${hiz}`;
  return sha16(`${kaynak.saglayici}:${kaynak.modelKimligi}${hizEki}:${metin}`);
}

/** Mevcut 287 klibin kaynağı: önek `piper:` olarak kanıtlı, model kimliği bilinmiyor (KG-15). */
export const ESKI_KAYNAK: SesKaynagi = {
  saglayici: 'piper',
  modelKimligi: 'piper:bilinmiyor',
  lisansUrl: 'docs/ses/SES_KAYNAKLARI.md',
  ticariDagitimIzni: false,
  cocukUrunundeKullanim: 'bilinmiyor',
  atifSarti: null,
};

function sha16(girdi: string): string {
  return createHash('sha256').update(girdi).digest('hex').slice(0, 16);
}

/** Bir değerin geçerli `SesKaynagi` olduğunu doğrular; değilse açıklayıcı hata fırlatır. */
export function sesKaynaginiDogrula(deger: unknown): SesKaynagi {
  if (typeof deger !== 'object' || deger === null) throw new Error('Ses kaynağı bir nesne olmalı.');
  const k = deger as Record<string, unknown>;
  if (!SAGLAYICILAR.includes(k.saglayici as Saglayici)) {
    throw new Error(`Bilinmeyen ses sağlayıcısı: ${String(k.saglayici)}`);
  }
  if (typeof k.modelKimligi !== 'string' || k.modelKimligi.trim() === '') {
    throw new Error('Ses kaynağının model kimliği boş olamaz.');
  }
  if (typeof k.lisansUrl !== 'string' || k.lisansUrl.trim() === '') {
    throw new Error('Ses kaynağının lisans referansı boş olamaz.');
  }
  if (typeof k.ticariDagitimIzni !== 'boolean') {
    throw new Error('ticariDagitimIzni true/false olmalı.');
  }
  if (!['izinli', 'kosullu', 'bilinmiyor'].includes(k.cocukUrunundeKullanim as string)) {
    throw new Error('cocukUrunundeKullanim izinli | kosullu | bilinmiyor olmalı.');
  }
  if (k.atifSarti !== null && typeof k.atifSarti !== 'string') {
    throw new Error('atifSarti metin veya null olmalı.');
  }
  return k as unknown as SesKaynagi;
}

/** Yeni özet: sağlayıcı + model kimliği + metin. Model değişirse özet değişir. */
export function klipOzeti(k: SesKaynagi, metin: string): string {
  if (k.modelKimligi.trim() === '') throw new Error('Ses kaynağının model kimliği boş olamaz.');
  return sha16(`${k.saglayici}:${k.modelKimligi}:${metin}`);
}

/** Eski özet (yalnız sağlayıcı öneki) — geçiş süresince mevcut klipleri tanımak için. */
export function eskiOzet(saglayici: string, metin: string): string {
  return sha16(`${saglayici}:${metin}`);
}

/** `.hashes.json` biçimi: yeni `{ $kaynak, ...özetler }` veya eski düz `{ anahtar: özet }`. */
export interface OzetDosyasi {
  readonly kaynak: SesKaynagi | null;
  readonly ozetler: Readonly<Record<string, string>>;
}

export function ozetDosyasiniOku(ham: unknown): OzetDosyasi {
  if (typeof ham !== 'object' || ham === null) return { kaynak: null, ozetler: {} };
  const { $kaynak, ...geri } = ham as Record<string, unknown>;
  const ozetler: Record<string, string> = {};
  for (const [anahtar, deger] of Object.entries(geri)) {
    if (typeof deger === 'string') ozetler[anahtar] = deger;
  }
  return { kaynak: $kaynak === undefined ? null : sesKaynaginiDogrula($kaynak), ozetler };
}

export interface KokenSonucu {
  /** Ne yeni ne eski özetle eşleşen klipler. */
  readonly eslesmeyen: readonly string[];
  /** Özeti hiç olmayan klipler. */
  readonly ozetsiz: readonly string[];
  /** Yalnız eski (`piper:` önekli) özetle eşleşen klip sayısı. */
  readonly eskiEslesen: number;
  readonly yeniEslesen: number;
  /** Aktif kaynak ticari dağıtıma izin vermiyorsa uyarı metni. */
  readonly lisansUyarisi: string | null;
}

/**
 * Köken denetimi (SAF). Her klibin özeti aktif kaynağın yeni özetiyle veya —
 * yalnız aktif kaynak eski kaynak olduğu sürece — `eskiOzet('piper', metin)` ile eşleşmeli.
 */
export function kokenDenetle(
  aktif: SesKaynagi,
  klipler: readonly { readonly key: string; readonly text: string }[],
  ozetler: Readonly<Record<string, string>>,
  anahtarSesleri: readonly AnahtarSesi[] = [],
): KokenSonucu {
  const eslesmeyen: string[] = [];
  const ozetsiz: string[] = [];
  let eskiEslesen = 0;
  let yeniEslesen = 0;
  const eskiyiKabulEt = aktif.saglayici === ESKI_KAYNAK.saglayici && aktif.modelKimligi === ESKI_KAYNAK.modelKimligi;

  for (const { key, text } of klipler) {
    const ozet = ozetler[key];
    if (ozet === undefined) {
      ozetsiz.push(key);
    } else if (ozet === anahtarliKlipOzeti(aktif, anahtarSesleri, key, text)) {
      yeniEslesen++;
    } else if (eskiyiKabulEt && ozet === eskiOzet('piper', text)) {
      eskiEslesen++;
    } else {
      eslesmeyen.push(key);
    }
  }

  return {
    eslesmeyen,
    ozetsiz,
    eskiEslesen,
    yeniEslesen,
    lisansUyarisi: aktif.ticariDagitimIzni
      ? null
      : `UYARI LİSANS: ticari dağıtım izni yok (ADR-0004) — aktif kaynak ${aktif.modelKimligi}`,
  };
}
