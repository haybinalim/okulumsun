/**
 * HAFTALIK SES PLANI — öneri (Okuma Yazma planı §2.4.11 madde 4, Adım 71). SAF: saat yok, ağ yok.
 *
 * Kaynak: TYMM Türkçe 2026 Şekil 1 (hazırlık 1 hafta; harf grupları 6 · 4 · 2 · 2 · 2 hafta) ve okul takvimi
 * (`okulTakvimi.ts`: ara tatil ve yarıyıl haftaları öğretim haftası sayılmaz). Kurallar:
 *  - Ders yılının ilk haftası hazırlık haftasıdır (uyum haftasından sonraki bir hafta).
 *  - "Dönem bitmeden önceki son hafta yeni ses verilmemeli, … pekiştirme çalışmaları yapılmalıdır." → 1. dönemin son
 *    öğretim haftası ve ders yılının son haftası pekiştirme; yeni ses yok.
 *  - Her dönemin ilk haftası hazırlık ve hatırlatma haftasıdır (uyum hariç) → 2. dönemin ilk haftası hatırlatma.
 *  - Bir grubun harfleri grubun haftalarına sırayla dağılır (6 harf / 6 hafta → haftada bir; 6 / 4 → 2-1-2-1 …).
 *  - Harfler bitince bağımsız okuma yazma aşaması.
 * Program bu süreleri öneri sayar; öğretmen sınıfına göre düzenler (K-OY-20). Plan yalnız öneridir, hiçbir şey kilitlemez.
 */
import { DERS_YILI_BASLANGIC, DERS_YILI_BITIS, OGRETIM_HAFTALARI, TATIL_HAFTALARI } from '../../okulTakvimi';
import { HARF_GRUPLARI, type Harf } from './alfabe';

/** Şekil 1: grup başına önerilen hafta. */
export const GRUP_HAFTALARI: readonly number[] = [6, 4, 2, 2, 2];

export type SesHaftasiTuru = 'hazirlik' | 'ses' | 'pekistirme' | 'hatirlatma' | 'tatil' | 'bagimsiz';

export interface SesHaftasi {
  /** Haftanın pazartesisi `YYYY-MM-DD`. */
  readonly pazartesi: string;
  readonly tur: SesHaftasiTuru;
  /** O hafta önerilen yeni sesler (küçük harf, resmî sıra). */
  readonly yeniSesler: readonly Harf[];
  /** 1–5; yalnız `ses` haftalarında. */
  readonly grup?: number;
  /** Öğretim haftası numarası (`okulTakvimi`); tatilde yok. */
  readonly ogretimHaftasi?: number;
  /** Resmî tatil ya da tatil adı. */
  readonly not?: string;
}

const GUN_MS = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const ms = (g: string) => Date.parse(`${g}T00:00:00Z`);

/** Bir grubun harflerini haftalarına böler: harf i → hafta ⌊i·H/L⌋. */
export function grubuBol(harfler: readonly Harf[], hafta: number): Harf[][] {
  const out: Harf[][] = Array.from({ length: hafta }, () => []);
  harfler.forEach((h, i) => out[Math.floor((i * hafta) / harfler.length)].push(h));
  return out;
}

export function haftalikSesPlani(): readonly SesHaftasi[] {
  const ogretim = new Map(OGRETIM_HAFTALARI.map((h) => [h.pazartesi, h]));
  const yariyil = Object.entries(TATIL_HAFTALARI)
    .filter(([, ad]) => ad === 'Yarıyıl tatili')
    .map(([p]) => p)
    .sort();
  const ogretimSirasi = OGRETIM_HAFTALARI.map((h) => h.pazartesi);
  const donemSonu = new Set<string>([ogretimSirasi[ogretimSirasi.length - 1]]);
  const donemBasi = new Set<string>();
  if (yariyil.length) {
    donemSonu.add([...ogretimSirasi].reverse().find((p) => p < yariyil[0])!);
    const sonra = ogretimSirasi.find((p) => p > yariyil[yariyil.length - 1]);
    if (sonra) donemBasi.add(sonra);
  }
  const kuyruk: { grup: number; sesler: Harf[] }[] = HARF_GRUPLARI.flatMap((g, gi) =>
    grubuBol(g, GRUP_HAFTALARI[gi]).map((sesler) => ({ grup: gi + 1, sesler })),
  );
  const plan: SesHaftasi[] = [];
  for (let t = ms(DERS_YILI_BASLANGIC); t <= ms(DERS_YILI_BITIS); t += 7 * GUN_MS) {
    const p = iso(t);
    const tatil = TATIL_HAFTALARI[p];
    if (tatil) {
      plan.push({ pazartesi: p, tur: 'tatil', yeniSesler: [], not: tatil });
      continue;
    }
    const h = ogretim.get(p)!;
    const ortak = { pazartesi: p, ogretimHaftasi: h.no, ...(h.not ? { not: h.not } : {}) };
    if (p === DERS_YILI_BASLANGIC) plan.push({ ...ortak, tur: 'hazirlik', yeniSesler: [] });
    else if (donemSonu.has(p)) plan.push({ ...ortak, tur: 'pekistirme', yeniSesler: [] });
    else if (donemBasi.has(p)) plan.push({ ...ortak, tur: 'hatirlatma', yeniSesler: [] });
    else {
      const sira = kuyruk.shift();
      plan.push(sira ? { ...ortak, tur: 'ses', yeniSesler: sira.sesler, grup: sira.grup } : { ...ortak, tur: 'bagimsiz', yeniSesler: [] });
    }
  }
  return plan;
}

/** `gun` (YYYY-MM-DD) hangi plan haftasında; ders yılı dışında `null`. */
export function haftaBul(plan: readonly SesHaftasi[], gun: string): SesHaftasi | null {
  const t = ms(gun);
  return plan.find((h) => t >= ms(h.pazartesi) && t < ms(h.pazartesi) + 7 * GUN_MS) ?? null;
}

/** O haftaya kadar (dahil) önerilen en son ses; hiç ses yoksa `null` (hazırlık). */
export function sonOnerilenSes(plan: readonly SesHaftasi[], pazartesi: string): Harf | null {
  let son: Harf | null = null;
  for (const h of plan) {
    if (h.pazartesi > pazartesi) break;
    if (h.yeniSesler.length) son = h.yeniSesler[h.yeniSesler.length - 1];
  }
  return son;
}

const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

/** "2–6 Kasım", "28 Aralık – 1 Ocak". */
export function haftaAraligi(pazartesi: string): string {
  const b = new Date(ms(pazartesi));
  const s = new Date(ms(pazartesi) + 4 * GUN_MS);
  return b.getUTCMonth() === s.getUTCMonth()
    ? `${b.getUTCDate()}–${s.getUTCDate()} ${AYLAR[s.getUTCMonth()]}`
    : `${b.getUTCDate()} ${AYLAR[b.getUTCMonth()]} – ${s.getUTCDate()} ${AYLAR[s.getUTCMonth()]}`;
}
