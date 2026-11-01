/**
 * TÜRKÇE ETKİNLİK KART DÜZENİ (Adım 69) — alt etkileşim alanında kart boyu ve satır sayısı. SAF (piksel girer).
 *
 * Matematikteki KG-127/KG-129 dersinin Türkçe karşılığı: 1080×810 tahtada alt alan küçüktür (≈ 409 px yükseklik);
 * 8 harf kartı varsayılan boyda tek satıra sığmaz, iki satıra kırılınca üst %35'e taşar. Kural: her satır sayısı
 * (1…adet) için kartın sığabileceği en büyük kare boyu hesaplanır, en büyüğü seçilir; kart `enBuyuk`u geçmez,
 * `tapMin` altına inmez. Alt çubuk önce `kontrol` boyunda denenir; kartlar o zaman `tapMin`e sığmıyorsa çubuk
 * `tapMin` boyuna iner (düğmeler yine dokunma alt sınırında).
 */
export interface KartDuzeniGirdisi {
  /** Alt bölümün (kartlar + alt çubuk) genişliği ve yüksekliği, px. */
  readonly alanGenislik: number;
  readonly alanYukseklik: number;
  readonly adet: number;
  /** Kartın en/boy oranı (hece kartı 1,6; harf 1). */
  readonly enBoy: number;
  readonly enBuyuk: number;
  readonly tapMin: number;
  readonly aralik: number;
  /** `--size-control` (alt çubuk düğmesi). */
  readonly kontrol: number;
}

export interface KartDuzeni {
  /** Kart yüksekliği, px (genişlik = kart × enBoy). */
  readonly kart: number;
  readonly satir: number;
  readonly sutun: number;
  /** Alt çubuk düğme boyu, px. */
  readonly cubuk: number;
}

function enIyi(g: KartDuzeniGirdisi, cubuk: number): Omit<KartDuzeni, 'cubuk'> {
  const { alanGenislik: W, alanYukseklik: H, adet, enBoy, enBuyuk, aralik: a } = g;
  let best = { kart: 0, satir: 1, sutun: adet };
  for (let satir = 1; satir <= adet; satir++) {
    const sutun = Math.ceil(adet / satir);
    const w = (W - (sutun - 1) * a) / sutun / enBoy;
    const h = (H - cubuk - a - (satir - 1) * a) / satir;
    const kart = Math.floor(Math.min(enBuyuk, w, h));
    if (kart > best.kart) best = { kart, satir, sutun };
  }
  return best;
}

export function kartDuzeni(g: KartDuzeniGirdisi): KartDuzeni {
  if (!(g.alanGenislik > 0) || !(g.alanYukseklik > 0) || g.adet < 1)
    return { kart: g.tapMin, satir: 1, sutun: Math.max(1, g.adet), cubuk: g.kontrol };
  const normal = enIyi(g, g.kontrol);
  if (normal.kart >= g.tapMin) return { ...normal, cubuk: g.kontrol };
  const sikisik = enIyi(g, g.tapMin);
  return { ...sikisik, kart: Math.max(g.tapMin, sikisik.kart), cubuk: g.tapMin };
}
