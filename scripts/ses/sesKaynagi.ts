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
  /** false → audio:audit kırmızı (Adım 31'e kadar SES_GECIS_MODU=1 istisnası). */
  readonly ticariDagitimIzni: boolean;
  readonly cocukUrunundeKullanim: 'izinli' | 'kosullu' | 'bilinmiyor';
  /** Kaynaklar ekranına aynen yazılır. */
  readonly atifSarti: string | null;
}

/**
 * Kararı verilmiş ama henüz aktif olmayan kaynak (Adım 18). `aktif` Adım 31'de bu
 * değerlerle değişir; o zamana kadar üretim ve denetim eski kaynağı kullanır.
 * `ses` kullanıcı sesi seçene kadar null (KG-04).
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

/** `sesKaynagi.json`'u aktif ve bekleyen kaynağa ayırır (`$not` insan içindir). */
export function sesKaynagiDosyasiniAyir(ham: Readonly<Record<string, unknown>>): {
  readonly aktif: SesKaynagi;
  readonly bekleyen: BekleyenKaynak | null;
} {
  const { $not: _not, bekleyen, ...aktif } = ham;
  return {
    aktif: sesKaynaginiDogrula(aktif),
    bekleyen: bekleyen === undefined || bekleyen === null ? null : bekleyenKaynagiDogrula(bekleyen),
  };
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
    } else if (ozet === klipOzeti(aktif, text)) {
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
