/**
 * Yazılış hamle tablosu ve hamle verisi denetimi (Okuma Yazma planı §2.4.9, Adım 63). SAF.
 *
 * `HAMLE_SAYISI_TABLOSU` öğretmen teyit tablosu taslağındaki hamle sayılarıdır (MEB TemelYazi Kılavuz kesiminin numaralı
 * okları yalnız referans olarak okundu; kontur kopyalanmadı). İki öğretmenin teyidi gelene dek veri
 * `teyit: bekliyor` taşır; öğretmen bir sayıyı düzeltirse önce bu tablo, sonra `scripts/tur/hamle-verisi.ts` değişir.
 * Öğretmene sorulan açık noktalar (geri dönüşlü harfler tek mi iki mi hamle, G, M'nin 3. hamlesi, k'nin 2. hamlesi,
 * ğ/ç/ş işaretlerinin sırası, t ve l kıvrığı) teyit formundadır.
 *
 * `hamleVerisiniDenetle` CI'da (`npm run validate`) ve testlerde koşar: sayı ve sıra tabloyla aynı, dikey hamle aşağı,
 * yatay hamle sağa, daire saat 2 hizasından saatin tersine, bildirilen yön geometriyle aynı, işaretler (nokta, çengel,
 * kısa yay) gövdeden sonra, kuyruklu harfler tabanın altına dengeli taşar, i/İ ve ı/I ayrımı, noktalar sınır içinde.
 */
import { ALFABE, trBuyuk } from './alfabe';
import type { HamleTipi, TurHamle, TurHamleDosyasi, TurHamleGlifi } from '../../schema/turHamle';

/** Harfin gövdesine sonradan eklenen işaretler: nokta (i, j, ü, ö, İ, Ü, Ö), çengel (ç, ş), kısa yay (ğ). */
export const ISARET_TIPLERI: ReadonlySet<HamleTipi> = new Set<HamleTipi>(['nokta', 'cengel', 'kisaYay']);

/** Satır dizgesi (plan §2.4.9): 1 cm = 60 birim; üst ve alt bölge 0,5 cm. */
export const HAMLE_KOORDINATI = { ust: 20, kilavuz: 50, taban: 80, kuyruk: 100, cmBirim: 60 } as const;

/** Öğretmen teyit tablosu taslağı: glif → hamle sayısı (öğretim sırasıyla). */
export const HAMLE_SAYISI_TABLOSU: Readonly<Record<'kucuk' | 'buyuk' | 'rakam', Readonly<Record<string, number>>>> = {
  kucuk: {
    a: 2, n: 1, e: 1, t: 2, i: 2, l: 1, o: 1, k: 2, u: 1, r: 1, ı: 1, m: 1, ü: 3, s: 1, ö: 3,
    y: 1, d: 2, z: 1, ç: 2, b: 2, g: 2, c: 1, ş: 2, p: 2, h: 1, v: 1, ğ: 3, f: 2, j: 2,
  },
  buyuk: {
    A: 3, N: 3, E: 4, T: 2, İ: 2, L: 2, O: 1, K: 3, U: 1, R: 3, I: 1, M: 4, Ü: 3, S: 1, Ö: 3,
    Y: 3, D: 2, Z: 1, Ç: 2, B: 2, G: 1, C: 1, Ş: 2, P: 2, H: 3, V: 1, Ğ: 2, F: 3, J: 1,
  },
  rakam: { 0: 1, 1: 1, 2: 1, 3: 1, 4: 2, 5: 2, 6: 1, 7: 2, 8: 1, 9: 1 },
}; // prettier-ignore

/** Tablo toplamları (teyit tablosu "Özet sayımlar"). */
export const HAMLE_TOPLAMLARI = { kucuk: 47, buyuk: 62, rakam: 13 } as const;

/** Kuyruğu tabanın altına taşan küçük harfler. */
export const KUYRUKLU_HARFLER: ReadonlySet<string> = new Set(['g', 'ğ', 'j', 'p', 'y']);

export interface HamleIhlali {
  readonly oge: string;
  readonly mesaj: string;
}

type N = readonly [number, number];

/** Toplam dönüş (derece; y yukarı, artı = saatin tersine). */
export function toplamDonus(noktalar: readonly N[]): number {
  let t = 0;
  for (let i = 2; i < noktalar.length; i++) {
    const [ax, ay] = [noktalar[i - 1][0] - noktalar[i - 2][0], -(noktalar[i - 1][1] - noktalar[i - 2][1])];
    const [bx, by] = [noktalar[i][0] - noktalar[i - 1][0], -(noktalar[i][1] - noktalar[i - 1][1])];
    t += (Math.atan2(ax * by - ay * bx, ax * bx + ay * by) * 180) / Math.PI;
  }
  return t;
}

/** Düz hamlenin (dik, yatay, çapraz) baştan sona yön sınıfı. */
export function duzYon(a: N, b: N): TurHamle['yon'] {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  if (Math.abs(dx) <= 0.2 * Math.abs(dy)) return dy > 0 ? 'asagi' : 'yukari';
  if (Math.abs(dy) <= 0.2 * Math.abs(dx)) return dx > 0 ? 'saga' : 'sola';
  if (dy > 0) return dx > 0 ? 'sag-asagi' : 'sol-asagi';
  return dx > 0 ? 'sag-yukari' : 'sol-yukari';
}

/** Hamle düz bir parçayla başlıyorsa ilk parçanın yönü (ilk iki parça aynı doğrultudaysa), yoksa null. */
export function duzBaslangicYonu(n: readonly N[]): TurHamle['yon'] | null {
  if (n.length < 3) return duzYon(n[0], n[n.length - 1]);
  const a = [n[1][0] - n[0][0], n[1][1] - n[0][1]];
  const b = [n[2][0] - n[1][0], n[2][1] - n[1][1]];
  const capraz = Math.abs(a[0] * b[1] - a[1] * b[0]);
  return capraz <= 0.01 * Math.hypot(a[0], a[1]) * Math.hypot(b[0], b[1]) ? duzYon(n[0], n[1]) : null;
}

/** Dairenin başlangıç açısı (derece; 0 = saat 3, 90 = saat 12), nokta kutusunun merkezine göre. */
export function baslangicAcisi(n: readonly N[]): number {
  const xs = n.map((p) => p[0]);
  const ys = n.map((p) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const rx = (Math.max(...xs) - Math.min(...xs)) / 2;
  const ry = (Math.max(...ys) - Math.min(...ys)) / 2;
  return (Math.atan2(-(n[0][1] - cy) / ry, (n[0][0] - cx) / rx) * 180) / Math.PI;
}

export function glifAnahtari(g: Pick<TurHamleGlifi, 'glif' | 'bicim'>): string {
  return `${g.bicim}:${g.glif}`;
}

export function hamleVerisiniDenetle(d: TurHamleDosyasi): HamleIhlali[] {
  const ihlal: HamleIhlali[] = [];
  const ekle = (oge: string, mesaj: string) => ihlal.push({ oge, mesaj });
  const anahtarlar = new Set<string>();

  for (const g of d.glifler) {
    const k = glifAnahtari(g);
    if (anahtarlar.has(k)) ekle(k, 'glif iki kez tanımlı.');
    anahtarlar.add(k);
    const beklenen = HAMLE_SAYISI_TABLOSU[g.bicim][g.glif];
    if (beklenen === undefined) ekle(k, 'teyit tablosunda yok.');
    else if (g.hamleSayisi !== beklenen || g.hamleler.length !== beklenen)
      ekle(k, `hamle sayısı ${g.hamleler.length} (alan ${g.hamleSayisi}) ≠ tablo ${beklenen}.`);
    g.hamleler.forEach((h, i) => {
      if (h.sira !== i + 1) ekle(`${k}#${h.sira}`, `sıra ${h.sira} ≠ ${i + 1} (hamleler ardışık numaralı).`);
    });

    // İşaretler (nokta, çengel, kısa yay) gövdeden sonra.
    const ilkIsaret = g.hamleler.findIndex((h) => ISARET_TIPLERI.has(h.tip));
    if (ilkIsaret >= 0 && g.hamleler.slice(ilkIsaret).some((h) => !ISARET_TIPLERI.has(h.tip)))
      ekle(k, 'nokta/çengel/kısa yay gövde hamlelerinden sonra gelmeli.');

    let enAlt = 0;
    for (const h of g.hamleler) {
      const o = `${k}#${h.sira}`;
      const n = h.noktalar;
      for (const [x, y] of n) {
        if (x < 0 || x > g.genislik || y < 0 || y > 100)
          ekle(o, `nokta (${x}, ${y}) sınır dışında (0–${g.genislik} × 0–100).`);
      }
      for (let i = 1; i < n.length; i++) {
        const u = Math.hypot(n[i][0] - n[i - 1][0], n[i][1] - n[i - 1][1]);
        if (u === 0 || u > 6) ekle(o, `ardışık noktalar arası ${u.toFixed(2)} birim (0 < u ≤ 6).`);
      }
      if (!ISARET_TIPLERI.has(h.tip)) enAlt = Math.max(enAlt, ...n.map((p) => p[1]));
      const bas = n[0];
      const son = n[n.length - 1];
      const donus = toplamDonus(n);

      if (h.tip === 'dik' || h.tip === 'yatay' || h.tip === 'capraz') {
        const y = duzYon(bas, son);
        if (y !== h.yon) ekle(o, `bildirilen yön ${h.yon}, geometri ${y}.`);
        if (Math.abs(donus) > 3) ekle(o, 'düz hamle bükülmemeli.');
        if (h.tip === 'dik' && y !== 'asagi' && !h.istisna) ekle(o, 'dikey hamle yukarıdan aşağı olmalı.');
        if (h.tip === 'yatay' && y !== 'saga' && !h.istisna) ekle(o, 'yatay hamle soldan sağa olmalı.');
      }
      if (h.tip === 'nokta' || h.tip === 'cengel') {
        if (duzYon(bas, son) !== 'asagi') ekle(o, 'nokta/çengel yukarıdan aşağı.');
        if (Math.hypot(son[0] - bas[0], son[1] - bas[1]) > 6) ekle(o, 'nokta/çengel kısa olmalı (≤ 6 birim).');
      }
      if (h.tip === 'daire' || h.tip === 'yay' || h.tip === 'kisaYay') {
        const beklenenYon = donus > 0 ? 'saat-tersi' : 'saat-yonu';
        if (h.yon !== beklenenYon) ekle(o, `bildirilen yön ${h.yon}, geometri ${beklenenYon} (${donus.toFixed(0)}°).`);
      }
      if (h.tip === 'daire') {
        const aci = baslangicAcisi(n);
        if (!h.istisna && (donus < 300 || aci < 10 || aci > 70))
          ekle(
            o,
            `daire saat 2 hizasından (10°–70°) saatin tersine tam dönmeli: başlangıç ${aci.toFixed(0)}°, dönüş ${donus.toFixed(0)}°.`,
          );
        if (Math.hypot(son[0] - bas[0], son[1] - bas[1]) > 1) ekle(o, 'daire başlangıçta kapanmalı.');
      }
      if (h.tip === 'karma' && !h.istisna) {
        const y = duzBaslangicYonu(n);
        // Düz parçayla başlayan hamle: dikey başlangıç aşağı, yatay başlangıç sağa; çapraz ve eğri başlangıç serbest.
        if (y === 'yukari' || y === 'sola')
          ekle(o, `hamle düz parçayla başlıyorsa dikey aşağı / yatay sağa olmalı (${y}).`);
      }
      if (h.geriDonus) {
        // Geri dönüşlü hamle: bir noktada yön tersine döner (aynı çizgiden geri çıkar).
        let ters = false;
        for (let i = 2; i < n.length && !ters; i++) {
          const a = [n[i - 1][0] - n[i - 2][0], n[i - 1][1] - n[i - 2][1]];
          const b = [n[i][0] - n[i - 1][0], n[i][1] - n[i - 1][1]];
          ters = a[0] * b[0] + a[1] * b[1] < -0.9 * Math.hypot(a[0], a[1]) * Math.hypot(b[0], b[1]);
        }
        if (!ters) ekle(o, 'geriDonus işaretli ama aynı çizgiden geri çıkış yok.');
      }
    }
    if (g.bicim === 'kucuk') {
      if (KUYRUKLU_HARFLER.has(g.glif)) {
        if (enAlt < 88 || enAlt > 100) ekle(k, `kuyruk tabanın altına dengeli taşmalı (88–100), en alt ${enAlt}.`);
      } else if (enAlt > 80.5) ekle(k, `kuyruksuz harf tabanı aşmamalı (en alt ${enAlt}).`);
    } else if (enAlt > 80.5) ekle(k, `büyük harf/rakam tabanı aşmamalı (en alt ${enAlt}).`);
  }

  // Kapsam: 29 küçük, 29 büyük (tr-TR eşi), 10 rakam; toplamlar tabloyla aynı.
  for (const harf of ALFABE) {
    if (!anahtarlar.has(`kucuk:${harf}`)) ekle(`kucuk:${harf}`, 'eksik.');
    if (!anahtarlar.has(`buyuk:${trBuyuk(harf)}`)) ekle(`buyuk:${trBuyuk(harf)}`, 'eksik (tr-TR büyük eşi).');
  }
  for (let r = 0; r <= 9; r++) if (!anahtarlar.has(`rakam:${r}`)) ekle(`rakam:${r}`, 'eksik.');
  for (const bicim of ['kucuk', 'buyuk', 'rakam'] as const) {
    const toplam = d.glifler.filter((g) => g.bicim === bicim).reduce((t, g) => t + g.hamleler.length, 0);
    if (toplam !== HAMLE_TOPLAMLARI[bicim]) ekle(bicim, `hamle toplamı ${toplam} ≠ ${HAMLE_TOPLAMLARI[bicim]}.`);
  }

  // i/İ ve ı/I: noktalı biçimler bir nokta hamlesi taşır, noktasızlar taşımaz.
  const bul = (bicim: string, glif: string) => d.glifler.find((g) => g.bicim === bicim && g.glif === glif);
  const noktaSayisi = (g: TurHamleGlifi | undefined) => g?.hamleler.filter((h) => h.tip === 'nokta').length ?? -1;
  if (noktaSayisi(bul('kucuk', 'i')) !== 1) ekle('kucuk:i', 'i tek noktalı olmalı.');
  if (noktaSayisi(bul('buyuk', 'İ')) !== 1) ekle('buyuk:İ', 'İ tek noktalı olmalı.');
  if (noktaSayisi(bul('kucuk', 'ı')) !== 0) ekle('kucuk:ı', 'ı noktasız olmalı.');
  if (noktaSayisi(bul('buyuk', 'I')) !== 0) ekle('buyuk:I', 'I noktasız olmalı.');
  return ihlal;
}

/** Teyit durumu: yayın kipinde her glif iki öğretmen teyitli olmalı. */
export function teyitBekleyenler(d: TurHamleDosyasi): string[] {
  return d.glifler.filter((g) => g.teyit.durum !== 'teyitli').map(glifAnahtari);
}
