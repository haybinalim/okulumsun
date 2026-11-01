/**
 * VELİ KARTI (Okuma Yazma planı §2.4.11 madde 6, Adım 71) — `ders-verisi/tur/veli-karti.json` ayrıştırıcısı. SAF.
 *
 * Eve link ekranında ve eve giden bağlantının açılışında veliye gösterilen kısa metin: ses esaslı çalışma, harf adı
 * yerine ses, ünsüzü tek başına söyletmeme (K-OY-03), kalem tutuşu ve sol el (K-OY-19; program "Kalem tutma"),
 * kısa ve süresiz çalışma (K-OY-15). Metin taslaktır: dosya `teyit.durum: "bekliyor"` taşır, arayüz "Taslak — öğretmen
 * onayı bekliyor" yazar; `npm run validate -- --yayin` teyitsiz kartı hata sayar (Adım 71 kabulü: öğretmen onaylı).
 * Katı: bilinmeyen alan, eksik madde ya da yanlış program sürümü hatadır. Çalışma anında da aynı ayrıştırıcı kullanılır.
 */
import { PROGRAM_SURUMU } from './alfabe';

export const VELI_KARTI_DOSYASI = 'veli-karti.json';

/** Kartta bulunması gereken maddeler (plan §2.4.11 madde 6 + K-OY-15). */
export const VELI_KARTI_MADDELERI = ['ses', 'harf-adi', 'unsuz', 'kalem', 'sol-el', 'sure'] as const;

export interface VeliKartiMaddesi {
  readonly kod: (typeof VELI_KARTI_MADDELERI)[number];
  readonly baslik: string;
  readonly metin: string;
}

export interface VeliKarti {
  readonly programSurumu: string;
  readonly teyit: { readonly durum: 'bekliyor' | 'onaylandi'; readonly not?: string };
  readonly baslik: string;
  readonly maddeler: readonly VeliKartiMaddesi[];
  readonly gizlilik: string;
}

function anahtarlar(o: object, izinli: readonly string[], yer: string): void {
  for (const k of Object.keys(o)) if (!izinli.includes(k)) throw new Error(`veli kartı: ${yer} bilinmeyen alan "${k}"`);
}

function metin(v: unknown, yer: string, enAz = 2): string {
  if (typeof v !== 'string' || v.trim().length < enAz) throw new Error(`veli kartı: ${yer} metin değil`);
  return v;
}

export function veliKartiAyristir(ham: unknown): VeliKarti {
  if (typeof ham !== 'object' || ham === null || Array.isArray(ham)) throw new Error('veli kartı: nesne değil');
  const o = ham as Record<string, unknown>;
  anahtarlar(o, ['programSurumu', 'teyit', 'baslik', 'maddeler', 'gizlilik'], 'kök');
  if (o.programSurumu !== PROGRAM_SURUMU) throw new Error(`veli kartı: program sürümü ${String(o.programSurumu)}`);
  const t = o.teyit as Record<string, unknown> | null;
  if (typeof t !== 'object' || t === null) throw new Error('veli kartı: teyit yok');
  anahtarlar(t, ['durum', 'not'], 'teyit');
  if (t.durum !== 'bekliyor' && t.durum !== 'onaylandi') throw new Error('veli kartı: teyit.durum');
  if (!Array.isArray(o.maddeler)) throw new Error('veli kartı: maddeler dizi değil');
  const maddeler = o.maddeler.map((m: unknown, i) => {
    if (typeof m !== 'object' || m === null) throw new Error(`veli kartı: madde ${i + 1}`);
    const mm = m as Record<string, unknown>;
    anahtarlar(mm, ['kod', 'baslik', 'metin'], `madde ${i + 1}`);
    if (!(VELI_KARTI_MADDELERI as readonly unknown[]).includes(mm.kod)) throw new Error(`veli kartı: madde kodu ${String(mm.kod)}`);
    return {
      kod: mm.kod as VeliKartiMaddesi['kod'],
      baslik: metin(mm.baslik, `madde ${i + 1} başlık`),
      metin: metin(mm.metin, `madde ${i + 1} metin`, 10),
    };
  });
  const kodlar = maddeler.map((m) => m.kod);
  if (kodlar.length !== VELI_KARTI_MADDELERI.length || !VELI_KARTI_MADDELERI.every((k) => kodlar.includes(k)))
    throw new Error(`veli kartı: maddeler ${VELI_KARTI_MADDELERI.join(', ')} birer kez olmalı`);
  return {
    programSurumu: PROGRAM_SURUMU,
    teyit: { durum: t.durum, ...(typeof t.not === 'string' ? { not: t.not } : {}) },
    baslik: metin(o.baslik, 'başlık'),
    maddeler,
    gizlilik: metin(o.gizlilik, 'gizlilik', 10),
  };
}
