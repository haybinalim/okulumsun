/**
 * T-09 — HARFİ PARÇALARDAN KUR (T.Y.1.3.b; plan §2.4.6 "composition", §2.4.13 motor seçeneği; Adım 79). SAF.
 *
 * İzlemeye (M-4) motor seçenek: üst alanda model harf ve boş harf çerçevesi durur; altta sessiz parça kartları
 * (hamle verisinin orta çizgisi, `ders-verisi/tur/hamleler.json`). Çocuk parçaları seçer, parçalar çerçevede kendi
 * yerine oturur. Ses yok (harf tek başına seslendirilmez, K-OY-03); yönerge hedefi söylemez (D-12).
 *
 * Kartlar hamleyi KENDİ glif çerçevesinde gösterir (nokta küçük kalır, yeri görünür). Çeldirici parça kümedeki
 * başka bir glifin hamlesidir ve hedefin hiçbir hamlesine benzemez (yeniden örneklenmiş ortalama uzaklık > 5 birim,
 * iki yönde de): tek doğru.
 *
 * Zorluk: z1 2 parçalı harf, çeldiricisiz, sıra serbest · z2 2 parça + 1 çeldirici, sıra serbest · z3 2–3 parça +
 * 1 çeldirici, yazılış sırası · z4 2–4 parça + 2 çeldirici, sıra · z5 2–4 parça + 3 çeldirici, sıra.
 */
import { createRng } from '../../../../exercises/rng';
import { kumeKodla } from '../ogretilenKume';
import { trKucuk } from '../alfabe';
import type { TurHamleGlifi } from '../../../schema/turHamle';
import { geriBildirimKlibi, yonergeKlibi } from './klipler';
import { enYeniHarf, kartlariKaristir, kumeHarfleri, soruGirisHarfi } from './ortak';
import { turItemId, TurUretimHatasi, type TurUretimGirdisi, type TurYerlestirSorusu } from './turSoru';

const AYAR = {
  1: { en: 2, celd: 0, sira: false },
  2: { en: 2, celd: 1, sira: false },
  3: { en: 3, celd: 1, sira: true },
  4: { en: 4, celd: 2, sira: true },
  5: { en: 4, celd: 3, sira: true },
} as const;

type Nokta = readonly [number, number];

/** Polilinin `n` eşit aralıklı noktası; x glif ortasına göre (farklı genişlikteki gliflerde karşılaştırma için). */
function ornekle(noktalar: readonly Nokta[], genislik: number, n = 12): Nokta[] {
  const p = noktalar.map(([x, y]) => [x - genislik / 2, y] as const);
  const u = [0];
  for (let i = 1; i < p.length; i++) u.push(u[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
  const top = u[u.length - 1] || 1;
  const out: Nokta[] = [];
  for (let k = 0; k < n; k++) {
    const t = (top * k) / (n - 1);
    let i = 1;
    while (i < p.length - 1 && u[i] < t) i++;
    const a = p[i - 1];
    const b = p[i] ?? a;
    const r = u[i] - u[i - 1] > 0 ? (t - u[i - 1]) / (u[i] - u[i - 1]) : 0;
    out.push([a[0] + (b[0] - a[0]) * r, a[1] + (b[1] - a[1]) * r]);
  }
  return out;
}

/** İki hamle görünüşte aynı mı (yer + biçim; yönden bağımsız). */
export function parcaBenzerMi(a: { noktalar: readonly Nokta[]; genislik: number }, b: { noktalar: readonly Nokta[]; genislik: number }): boolean {
  const pa = ornekle(a.noktalar, a.genislik);
  const pb = ornekle(b.noktalar, b.genislik);
  const ort = (q: readonly Nokta[]) => pa.reduce((t, p, i) => t + Math.hypot(p[0] - q[i][0], p[1] - q[i][1]), 0) / pa.length;
  return Math.min(ort(pb), ort([...pb].reverse())) <= 5;
}

export function uretT09(g: TurUretimGirdisi): TurYerlestirSorusu {
  const ayar = AYAR[g.zorluk];
  const rng = createRng(g.tohum).fork(`T-09|${g.zorluk}`);
  const glifler: readonly TurHamleGlifi[] = (g.hamleler ?? []).filter((x) => x.bicim !== 'rakam' && g.kume.has(x.glif));
  const adaylar = glifler.filter((x) => x.hamleler.length >= 2 && x.hamleler.length <= ayar.en);
  if (adaylar.length === 0)
    throw new TurUretimHatasi('Bu harf kümesiyle "Harfi parçalardan kur" kurulamıyor: iki parçalı öğretilmiş harf yok.');
  const harfler = kumeHarfleri(g.kume);
  const yeni = harfler.length ? enYeniHarf(harfler) : '';
  const bugunku = adaylar.filter((x) => trKucuk(x.glif) === yeni);
  const hedef = bugunku.length && rng.bool(0.5) ? rng.pick(bugunku) : rng.pick(adaylar);
  const anahtar = (glif: string, sira: number) => `${glif}${sira}`;
  const parca = (x: TurHamleGlifi, i: number) => ({ glif: x.glif, genislik: x.genislik, noktalar: x.hamleler[i].noktalar });
  const hedefParcalari = hedef.hamleler.map((_, i) => parca(hedef, i));
  // Çeldirici adayları: kümedeki başka gliflerin hamleleri; önce aynı biçim (küçük/büyük).
  const havuz = rng
    .shuffle(glifler.filter((x) => x.glif !== hedef.glif).flatMap((x) => x.hamleler.map((h, i) => ({ x, i, sira: h.sira }))))
    .sort((a, b) => Number(a.x.bicim !== hedef.bicim) - Number(b.x.bicim !== hedef.bicim));
  const celd: { x: TurHamleGlifi; i: number; sira: number }[] = [];
  for (const c of havuz) {
    if (celd.length >= ayar.celd) break;
    const p = parca(c.x, c.i);
    if (hedefParcalari.some((h) => parcaBenzerMi(h, p))) continue;
    if (celd.some((d) => parcaBenzerMi(parca(d.x, d.i), p))) continue;
    celd.push(c);
  }
  const kartlar = kartlariKaristir(rng, [
    ...hedef.hamleler.map((h, i) => ({ metin: anahtar(hedef.glif, h.sira), tur: 'parca' as const, parca: hedefParcalari[i] })),
    ...celd.map((c) => ({ metin: anahtar(c.x.glif, c.sira), tur: 'parca' as const, parca: parca(c.x, c.i) })),
  ]);
  return {
    kind: 'yerlestir',
    itemId: turItemId('T-09', g.zorluk, g.tohum, kumeKodla(g.kume)),
    sablon: 'T-09',
    zorluk: g.zorluk,
    tohum: g.tohum,
    girisHarfi: soruGirisHarfi([hedef.glif, ...celd.map((c) => c.x.glif)]),
    yonerge: yonergeKlibi(ayar.sira ? 't09-sira' : 't09'),
    soruKlipleri: [],
    uyaran: { tur: 'parca', glif: hedef.glif, genislik: hedef.genislik },
    geriBildirim: [geriBildirimKlibi('dogru')],
    hedefMetin: hedef.glif,
    sozcukler: [],
    kartlar,
    dogruDizi: hedef.hamleler.map((h) => anahtar(hedef.glif, h.sira)),
    ...(ayar.sira ? {} : { sirasiz: true }),
  };
}
