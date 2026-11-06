/**
 * ŞABLON DENETİMİ (Adım 69) — üretilen soruları K-OY kurallarına bağlar. SAF; YALNIZ CI/testlerde (arayüz almaz).
 *
 * 1. `turSoruEtkinligi`: soruyu içerik şemasındaki `TurEtkinlik` biçimine çevirir; böylece CI doğrulayıcısının
 *    etkinlik kuralları (D-11 sessiz kart, D-12 yönerge hedefi söylemez, D-23 çeldirici öğretilmiş harften ve tanı
 *    etiketi katalogda) üretilen HER soruya aynen uygulanır.
 * 2. `turSoruIhlalleri`: doğrulayıcının resmî sıraya göre bakamadığı şeyler — öğretmenin seçtiği kümeye uyum,
 *    istenen her klibin manifestte olup tek ünsüz olmaması, tanı etiketinin yalnız yanlış kartta olması, kart sayısı,
 *    yerleştirme cevabının kartlarla kurulabilmesi.
 * 3. `turKlipManifesti`: şablonların isteyebileceği bütün klipler (kimlik + metin). Adım 67 bu listeden ses üretir.
 */
import { dekodlanabilirMi } from '../ogretilenKume';
import { hecele } from '../heceleme';
import type { TurEtkinlik } from '../../../schema/turIcerik';
import {
  cumleKlibi,
  geriBildirimKlibi,
  heceKlibi,
  klipMetniGecerliMi,
  sozcukKlibi,
  TUR_GERI_BILDIRIMLERI,
  TUR_YONERGELERI,
  yonergeKlibi,
  type TurYonergeAnahtari,
} from './klipler';
import { TUR_TANI_ETIKETI_LISTESI } from './celdiriciler';
import { METINSIZ_KARTLAR, TUR_EN_COK_KART, type TurHavuzCumlesi, type TurHavuzSozcugu, type TurSoru } from './turSoru';

export interface TurKlip {
  readonly anahtar: string;
  readonly metin: string;
}

/** Şablonların isteyebileceği bütün klipler, kimliğe göre sıralı (cümle havuzu verilirse cümle klipleri de, Adım 74). */
export function turKlipManifesti(havuz: readonly TurHavuzSozcugu[], cumleler: readonly TurHavuzCumlesi[] = []): TurKlip[] {
  const m = new Map<string, string>();
  for (const [k, metin] of Object.entries(TUR_YONERGELERI)) m.set(yonergeKlibi(k as TurYonergeAnahtari), metin);
  for (const [k, metin] of Object.entries(TUR_GERI_BILDIRIMLERI))
    m.set(geriBildirimKlibi(k as keyof typeof TUR_GERI_BILDIRIMLERI), metin);
  for (const s of havuz) {
    m.set(sozcukKlibi(s.metin), s.metin);
    for (const h of hecele(s.metin)) if ([...h].length >= 2) m.set(heceKlibi(h), h);
  }
  for (const c of cumleler) m.set(cumleKlibi(c.id), c.metin);
  return [...m.entries()].map(([anahtar, metin]) => ({ anahtar, metin })).sort((a, b) => (a.anahtar < b.anahtar ? -1 : 1));
}

function klipMetni(anahtar: string, manifest: ReadonlyMap<string, string>): string {
  return manifest.get(anahtar) ?? '';
}

const OKUMA_HEDEFLI = new Set(['T-03', 'T-04', 'T-05', 'T-06', 'T-08', 'T-09', 'T-10', 'T-11', 'T-12', 'T-16', 'T-20']);
/** Seçenekleri yalnız sözcük görselleri olan şablonlar. */
const GORSELLI = new Set(['T-01', 'T-08', 'T-10']);
/** Görsel kart ile başka kartı karışık taşıyan şablonlar (T-19 z1–2 resim–harf). */
const GORSEL_KARISIK = new Set(['T-19']);

export function turSoruEtkinligi(s: TurSoru, manifest: ReadonlyMap<string, string>): TurEtkinlik {
  const uyaran: TurEtkinlik['uyaran'] =
    s.uyaran.tur === 'ses'
      ? { tur: 'ses' }
      : s.uyaran.tur === 'resim'
        ? { tur: 'gorsel', ...((s.uyaran.harf ?? s.uyaran.metin) ? { metin: s.uyaran.harf ?? s.uyaran.metin } : {}) }
        : {
            tur: 'yazi',
            metin:
              s.uyaran.tur === 'yazi' || s.uyaran.tur === 'noktalama'
                ? s.uyaran.metin
                : s.uyaran.tur === 'parca'
                  ? s.uyaran.glif
                  : s.hedefMetin,
          };
  return {
    id: s.itemId.replace('#', '.').replace(/[^a-z0-9.-]/gi, '-').toLowerCase(),
    sablon: s.sablon,
    girisHarfi: s.girisHarfi,
    uyaran,
    yonerge: { anahtar: s.yonerge, metin: klipMetni(s.yonerge, manifest) },
    secenekler: s.kartlar.map((k) =>
      k.tur === 'gorsel'
        ? // Görsel seçenek sözcüğünü metin olarak taşımaz; doğrulayıcı görseli içerikteki sözcüğe bağlar (D-15).
          { tur: 'gorsel' as const, gorselId: k.gorselId, sesli: false }
        : METINSIZ_KARTLAR.has(k.tur)
          ? // Parça kartı: metni iç anahtardır; sessiz kart olarak denetlenir.
            { tur: 'harf' as const, sesli: false }
          : {
            tur:
              k.tur === 'hece'
                ? ('hece' as const)
                : k.tur === 'sozcuk' || k.tur === 'cumle'
                  ? ('sozcuk' as const)
                  : k.tur === 'noktalama'
                    ? ('noktalama' as const)
                    : ('harf' as const),
            metin: k.metin,
            sesli: false,
            ...(k.diagnosticTag ? { diagnosticTag: k.diagnosticTag } : {}),
          },
    ),
    dogru:
      s.kind === 'secim'
        ? s.dogru
        : s.kind === 'eslestir'
          ? s.ciftler[0][0]
          : s.kind === 'coklu'
            ? s.dogrular[0]
            : Math.max(0, s.kartlar.findIndex((k) => k.metin === s.dogruDizi[0])),
  };
}

/**
 * `havuz` verilirse görsel kartların resmi o sözcüğün görseli mi diye de bakılır (T-01, T-08: yalnız görseli olan
 * ve harfleri öğretilmiş sözcükler; görseli olmayan sözcük seçenek olamaz).
 */
export function turSoruIhlalleri(
  s: TurSoru,
  kume: ReadonlySet<string>,
  manifest: ReadonlyMap<string, string>,
  havuz?: readonly TurHavuzSozcugu[],
): string[] {
  const h: string[] = [];
  const metinler = [
    ...s.kartlar.map((k) => (METINSIZ_KARTLAR.has(k.tur) ? (k.parca?.glif ?? '') : k.metin)),
    ...s.sozcukler,
    s.hedefMetin,
    ...(s.uyaran.tur === 'yazi' || s.uyaran.tur === 'noktalama'
      ? [s.uyaran.metin]
      : s.uyaran.tur === 'bosluklu'
        ? [s.uyaran.once, s.uyaran.sonra]
        : s.uyaran.tur === 'parca'
          ? [s.uyaran.glif]
          : s.uyaran.tur === 'resim'
            ? [s.uyaran.metin ?? '', s.uyaran.harf ?? '']
            : []),
  ];
  for (const m of metinler) if (!dekodlanabilirMi(m, kume)) h.push(`D-23/küme: "${m}" öğretilen kümede olmayan harf içeriyor.`);
  const istenen = [s.yonerge, ...s.soruKlipleri, ...s.geriBildirim];
  for (const k of istenen) {
    if (!manifest.has(k)) h.push(`D-21: klip manifestte yok: ${k}.`);
    else if (!klipMetniGecerliMi(klipMetni(k, manifest))) h.push(`D-11: klip tek başına ünsüz: ${k}.`);
    if (k.startsWith('tur.harf.')) h.push(`D-11: harf klibi istenemez: ${k}.`);
  }
  if ((OKUMA_HEDEFLI.has(s.sablon) || s.uyaran.tur === 'yazi' || s.uyaran.tur === 'noktalama') && s.soruKlipleri.length > 0)
    h.push('D-12: okuma hedefli soruda soru sesi yok.');
  for (const k of s.kartlar)
    if ((k.tur === 'parca') !== Boolean(k.parca) || (k.tur === 'parca' && !k.parca?.noktalar.length))
      h.push(`parça kartı biçimi bozuk ("${k.metin}").`);
  // Resim uyaranı sorunun sözcüğünün görseli (D-15): yalnız görseli olan, öğretilmiş harfli sözcük.
  if (s.uyaran.tur === 'resim' && havuz && havuz.find((w) => w.metin === s.hedefMetin)?.gorselId !== s.uyaran.gorselId)
    h.push(`D-15: uyaran görseli "${s.hedefMetin}" sözcüğünün görseli değil.`);
  if (s.sablon === 'T-09' && (s.kartlar.some((k) => k.tur !== 'parca') || s.uyaran.tur !== 'parca'))
    h.push('T-09: kartlar hamle parçası, uyaran model harf olmalı.');
  const gorseller = s.kartlar.filter((k) => k.tur === 'gorsel');
  if (GORSELLI.has(s.sablon) || GORSEL_KARISIK.has(s.sablon)) {
    for (const k of s.kartlar) {
      if (k.tur !== 'gorsel' || !k.gorselId) {
        if (GORSELLI.has(s.sablon)) h.push(`D-15: ${s.sablon} seçeneği görsel olmalı ("${k.metin}").`);
      } else if (havuz && havuz.find((w) => w.metin === k.metin)?.gorselId !== k.gorselId)
        h.push(`D-15: "${k.metin}" görseli havuzdaki sözcüğün görseli değil.`);
    }
    if (new Set(gorseller.map((k) => k.gorselId)).size !== gorseller.length) h.push('D-15: aynı görsel iki kez.');
  } else if (gorseller.length) h.push(`${s.sablon}: görsel kart beklenmez.`);
  if (s.dinlenen && s.soruKlipleri.join() !== s.dinlenen.map(sozcukKlibi).join())
    h.push('dinlenen sözcükler soru klipleriyle aynı değil.');
  if (s.kartlar.length > TUR_EN_COK_KART) h.push(`kart sayısı ${s.kartlar.length} > ${TUR_EN_COK_KART}.`);
  if (new Set(s.kartlar.map((k) => k.id)).size !== s.kartlar.length) h.push('kart kimlikleri tekil değil.');
  for (const k of s.kartlar)
    if (k.diagnosticTag && !(TUR_TANI_ETIKETI_LISTESI as readonly string[]).includes(k.diagnosticTag))
      h.push(`D-23: bilinmeyen tanı etiketi ${k.diagnosticTag}.`);
  if (s.kind === 'secim') {
    const dogru = s.kartlar[s.dogru];
    if (!dogru) h.push('doğru kart yok.');
    else if (dogru.diagnosticTag) h.push('D-23: tanı etiketi doğru kartta.');
    if (s.kartlar.filter((k) => k.metin === dogru?.metin).length !== 1) h.push('doğru kart metni tekil değil.');
  } else if (s.kind === 'eslestir') {
    // Her kart tam bir çiftte; çift üst sıradan (ilk yarı) bir kartı alt sıradan bir kartla birleştirir.
    const yari = s.kartlar.length / 2;
    const gorulen = s.ciftler.flat();
    if (new Set(gorulen).size !== s.kartlar.length || gorulen.length !== s.kartlar.length)
      h.push('eşleştirme: her kart tam bir çiftte olmalı.');
    for (const [a, b] of s.ciftler) if (!(a < yari && b >= yari)) h.push('eşleştirme: çift iki sırayı birleştirmeli.');
    if (s.kartlar.some((k) => k.diagnosticTag)) h.push('D-23: eşleştirmede tanı etiketi yok.');
  } else if (s.kind === 'coklu') {
    // Tek doğru küme: hedef metni taşıyan her kart doğru, taşımayan hiçbiri.
    const beklenen = s.kartlar.flatMap((k, i) => (k.metin.includes(s.hedefMetin) ? [i] : []));
    if (s.dogrular.length === 0 || s.dogrular.join() !== beklenen.join()) h.push('çoklu seçim: doğrular hedefi taşıyan kartlar değil.');
    for (const i of s.dogrular) if (s.kartlar[i]?.diagnosticTag) h.push('D-23: tanı etiketi doğru kartta.');
  } else {
    const kalan = s.kartlar.map((k) => k.metin);
    for (const d of s.dogruDizi) {
      const i = kalan.indexOf(d);
      if (i < 0) h.push(`cevap "${d}" kartlarla kurulamıyor.`);
      else kalan.splice(i, 1);
    }
    const kullanilan = new Set(s.dogruDizi);
    for (const k of s.kartlar)
      if (k.diagnosticTag && kullanilan.has(k.metin)) h.push('D-23: tanı etiketi cevaptaki kartta.');
  }
  return h;
}
