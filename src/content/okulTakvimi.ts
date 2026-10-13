/**
 * OKUL TAKVİMİ 2026–2027 — öğretim haftaları (plan v2 Adım 37).
 *
 * Kaynak: MEB "2026-2027 Eğitim ve Öğretim Yılı Çalışma Takvimi" genelgesi (13 Haziran 2026),
 * https://www.meb.gov.tr/2026-2027-egitim-ogretim-yili-takvimi-aciklandi/haber/41057/tr
 * Doğrulama tarihi: 13 Ekim 2026.
 *  · Ders yılı: 14 Eylül 2026 Pazartesi – 25 Haziran 2027 Cuma
 *  · 1. dönem ara tatili: 16–20 Kasım 2026
 *  · Yarıyıl tatili: 25 Ocak – 5 Şubat 2027 (2. dönem 8 Şubat 2027'de başlar)
 *  · 2. dönem ara tatili: 8–12 Mart 2027
 * Resmî tatil günleri haftayı silmez; `not` olarak yazılır (o hafta daha az ders saati olabilir). Dinî bayram
 * günleri il takvimlerinde ayrıca ilan edilir; burada doğrulanmadığı için yazılmadı (planDuzeltmeleri.json ile eklenebilir).
 *
 * SAF veri: saat yok, ağ yok. Tarihler ISO `YYYY-MM-DD` (yerel takvim günü).
 */

export interface OgretimHaftasi {
  /** 1'den başlayan öğretim haftası numarası (tatil haftaları sayılmaz). */
  readonly no: number;
  /** Haftanın pazartesisi, `YYYY-MM-DD`. */
  readonly pazartesi: string;
  readonly not?: string;
}

export const OKUL_YILI = '2026-2027' as const;
export const DERS_YILI_BASLANGIC = '2026-09-14';
export const DERS_YILI_BITIS = '2027-06-25';

/** Tatil haftaları (pazartesi) — öğretim haftası sayılmaz. */
export const TATIL_HAFTALARI: Readonly<Record<string, string>> = {
  '2026-11-16': '1. dönem ara tatili',
  '2027-01-25': 'Yarıyıl tatili',
  '2027-02-01': 'Yarıyıl tatili',
  '2027-03-08': '2. dönem ara tatili',
};

/** Öğretim haftasına düşen resmî tatil notları (pazartesi → not). */
const NOTLAR: Readonly<Record<string, string>> = {
  '2026-10-26': '29 Ekim Cumhuriyet Bayramı (28 Ekim yarım gün)',
  '2026-12-28': '1 Ocak Yılbaşı tatili',
  '2027-01-18': '22 Ocak 1. dönem sonu (karne)',
  '2027-04-19': '23 Nisan Ulusal Egemenlik ve Çocuk Bayramı',
  '2027-05-17': "19 Mayıs Atatürk'ü Anma, Gençlik ve Spor Bayramı",
};

const GUN_MS = 86_400_000;

function isoGun(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function gunMs(iso: string): number {
  return Date.parse(`${iso}T00:00:00Z`);
}

function haftalariUret(): readonly OgretimHaftasi[] {
  const out: OgretimHaftasi[] = [];
  const bitis = gunMs(DERS_YILI_BITIS);
  let no = 1;
  for (let t = gunMs(DERS_YILI_BASLANGIC); t <= bitis; t += 7 * GUN_MS) {
    const pazartesi = isoGun(t);
    if (TATIL_HAFTALARI[pazartesi]) continue;
    const not = NOTLAR[pazartesi];
    out.push(not ? { no, pazartesi, not } : { no, pazartesi });
    no += 1;
  }
  return out;
}

/** 2026–2027 öğretim haftaları (tatil haftaları hariç). */
export const OGRETIM_HAFTALARI: readonly OgretimHaftasi[] = haftalariUret();

/** `iso` gününün içinde olduğu haftanın pazartesisi (UTC takvim günü olarak). */
export function haftaninPazartesisi(iso: string): string {
  const t = gunMs(iso);
  const gun = new Date(t).getUTCDay(); // 0 = pazar
  const geri = (gun + 6) % 7;
  return isoGun(t - geri * GUN_MS);
}
