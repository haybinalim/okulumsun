/**
 * HAFTALIK MEB PLANI — SAF (plan v2 Adım 37).
 *
 * MEB 2024 programının ders saatlerinden (`kazanimlar.json`: haftalık 5 saat, tema `dersSaati`
 * 15·57·18·50·7·15·10, okul temelli planlama 8) ve kazanımların `ogretimSirasi`ndan, 2026–2027
 * öğretim haftalarına ("Bu hafta hangi kazanım?") bir plan türetir. Bir temanın saati kazanımlarına
 * eşit bölünür; her hafta `haftalikDersSaati` saatlik bir pencere alır ve penceresine düşen kazanımları
 * taşır. Program saatleri bittikten sonraki haftalar "okul temelli planlama / tekrar" haftasıdır.
 *
 * Saat, rastgelelik, depolama ve ağ yok; "bugün" parametredir.
 */
import type { KazanimKodu, SkillId } from '../exercises/types';
import { haftaninPazartesisi, type OgretimHaftasi } from '../content/okulTakvimi';
import type { PlanDuzeltmeleri } from '../content/schema/haftalikPlan';

/** `kazanimlar.json`'dan planın okuduğu en küçük alt küme (KazanimlarDosyasi bunu sağlar). */
export interface PlanKaynagi {
  readonly haftalikDersSaati: number;
  readonly temalar: readonly { readonly no: number; readonly dersSaati: number }[];
  readonly okulTemelliPlanlama: { readonly dersSaati: number };
  readonly kazanimlar: readonly {
    readonly kod: KazanimKodu;
    readonly ogretimSirasi: number;
    readonly tema: { readonly no: number };
  }[];
}

/** Beceri düğümünün plana bağlanan alanları (`skillsData` bunu sağlar). */
export interface PlanBecerisi {
  readonly id: SkillId;
  readonly mebOutcomes: readonly string[];
  readonly durum: string;
}

export interface PlanHaftasi {
  readonly hafta: OgretimHaftasi;
  /** Haftanın ağırlıklı teması; program saatleri bittiyse `null` (okul temelli planlama / tekrar). */
  readonly temaNo: number | null;
  readonly kazanimKodlari: readonly KazanimKodu[];
  /** Haftanın kazanımlarına bağlı HAZIR beceri düğümleri (set ve kâğıt için). */
  readonly dugumler: readonly SkillId[];
  /** Elle düzeltildiyse gerekçe. */
  readonly duzeltme?: string;
}

interface Dilim {
  readonly bas: number;
  readonly son: number;
  readonly temaNo: number;
  readonly kod: KazanimKodu;
}

const EPS = 1e-9;

function dilimler(k: PlanKaynagi): readonly Dilim[] {
  const out: Dilim[] = [];
  let saat = 0;
  const temalar = [...k.temalar].sort(
    (a, b) =>
      Math.min(...k.kazanimlar.filter((x) => x.tema.no === a.no).map((x) => x.ogretimSirasi)) -
      Math.min(...k.kazanimlar.filter((x) => x.tema.no === b.no).map((x) => x.ogretimSirasi)),
  );
  for (const t of temalar) {
    const kazanimlar = k.kazanimlar.filter((x) => x.tema.no === t.no).sort((a, b) => a.ogretimSirasi - b.ogretimSirasi);
    if (kazanimlar.length === 0) continue;
    const pay = t.dersSaati / kazanimlar.length;
    for (const x of kazanimlar) {
      out.push({ bas: saat, son: saat + pay, temaNo: t.no, kod: x.kod });
      saat += pay;
    }
  }
  return out;
}

export function haftalikPlanUret(
  kaynak: PlanKaynagi,
  takvim: readonly OgretimHaftasi[],
  beceriler: readonly PlanBecerisi[],
  duzeltmeler?: PlanDuzeltmeleri,
): readonly PlanHaftasi[] {
  const h = kaynak.haftalikDersSaati;
  if (!(h > 0)) throw new Error('haftalikPlanUret: haftalık ders saati pozitif olmalı.');
  const parcalar = dilimler(kaynak);
  const temaNoOf = new Map(kaynak.kazanimlar.map((x) => [x.kod, x.tema.no]));
  const duzeltmeHaritasi = new Map((duzeltmeler?.duzeltmeler ?? []).map((d) => [d.hafta, d]));

  const dugumlerOf = (kodlar: readonly KazanimKodu[]): SkillId[] =>
    beceriler
      .filter((b) => b.durum === 'hazir' && b.mebOutcomes.some((m) => kodlar.includes(m as KazanimKodu)))
      .map((b) => b.id);

  return takvim.map((hafta, i) => {
    const d = duzeltmeHaritasi.get(hafta.no);
    if (d) {
      const kodlar = d.kazanimKodlari;
      const temaNo = kodlar.length > 0 ? (temaNoOf.get(kodlar[0]) ?? null) : null;
      return { hafta, temaNo, kazanimKodlari: kodlar, dugumler: dugumlerOf(kodlar), duzeltme: d.gerekce };
    }
    const bas = i * h;
    const son = bas + h;
    const temaPayi = new Map<number, number>();
    const kodlar: KazanimKodu[] = [];
    for (const p of parcalar) {
      const ortak = Math.min(son, p.son) - Math.max(bas, p.bas);
      if (ortak <= EPS) continue;
      kodlar.push(p.kod);
      temaPayi.set(p.temaNo, (temaPayi.get(p.temaNo) ?? 0) + ortak);
    }
    let temaNo: number | null = null;
    let enCok = 0;
    for (const [no, pay] of temaPayi) {
      if (pay > enCok + EPS) {
        enCok = pay;
        temaNo = no;
      }
    }
    return { hafta, temaNo, kazanimKodlari: kodlar, dugumler: dugumlerOf(kodlar) };
  });
}

/** `bugun` (YYYY-MM-DD) hangi öğretim haftasındaysa o satır; tatil veya ders yılı dışıysa `null`. */
export function buHafta(plan: readonly PlanHaftasi[], bugun: string): PlanHaftasi | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(bugun)) return null;
  const pazartesi = haftaninPazartesisi(bugun);
  return plan.find((p) => p.hafta.pazartesi === pazartesi) ?? null;
}

/** Okul ayı indeksi (0 = Eylül … 9 = Haziran); `okulAyi.ts` ile tutarlılık için. */
export function okulAyiIndeksi(iso: string): number {
  const ay = Number(iso.slice(5, 7));
  return ay >= 9 ? ay - 9 : ay + 3;
}

/**
 * Ekranın açılışta göstereceği hafta: `bugun` bir öğretim haftasındaysa o; tatil haftasındaysa veya ders yılı
 * başlamadıysa SIRADAKİ öğretim haftası; ders yılı bittiyse son hafta. `buHafta` ise yalnız gerçek "bu hafta"dır.
 */
export function varsayilanHaftaIndeksi(plan: readonly PlanHaftasi[], bugun: string): number {
  if (plan.length === 0) return -1;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(bugun)) return 0;
  const pazartesi = haftaninPazartesisi(bugun);
  const i = plan.findIndex((p) => p.hafta.pazartesi >= pazartesi);
  return i === -1 ? plan.length - 1 : i;
}

/**
 * Haftanın set/kâğıt düğümleri: plandaki sırayla, yalnız setlenebilir (şablonu kayıtlı) olanlar, en çok `enFazla`.
 * `kirpildi`: haftada daha çok düğüm vardı (öğretmene "ilk N" notu için).
 */
export function haftaSetDugumleri(
  p: PlanHaftasi,
  uygun: ReadonlySet<SkillId>,
  enFazla: number,
): { readonly dugumler: readonly SkillId[]; readonly kirpildi: boolean } {
  const hepsi = p.dugumler.filter((d) => uygun.has(d));
  return { dugumler: hepsi.slice(0, enFazla), kirpildi: hepsi.length > enFazla };
}
