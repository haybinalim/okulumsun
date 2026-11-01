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
import { TUR_EN_COK_KART, type TurHavuzSozcugu, type TurSoru } from './turSoru';

export interface TurKlip {
  readonly anahtar: string;
  readonly metin: string;
}

/** Şablonların isteyebileceği bütün klipler, kimliğe göre sıralı. */
export function turKlipManifesti(havuz: readonly TurHavuzSozcugu[]): TurKlip[] {
  const m = new Map<string, string>();
  for (const [k, metin] of Object.entries(TUR_YONERGELERI)) m.set(yonergeKlibi(k as TurYonergeAnahtari), metin);
  for (const [k, metin] of Object.entries(TUR_GERI_BILDIRIMLERI))
    m.set(geriBildirimKlibi(k as keyof typeof TUR_GERI_BILDIRIMLERI), metin);
  for (const s of havuz) {
    m.set(sozcukKlibi(s.metin), s.metin);
    for (const h of hecele(s.metin)) if ([...h].length >= 2) m.set(heceKlibi(h), h);
  }
  return [...m.entries()].map(([anahtar, metin]) => ({ anahtar, metin })).sort((a, b) => (a.anahtar < b.anahtar ? -1 : 1));
}

function klipMetni(anahtar: string, manifest: ReadonlyMap<string, string>): string {
  return manifest.get(anahtar) ?? '';
}

const OKUMA_HEDEFLI = new Set(['T-03', 'T-04', 'T-05', 'T-06']);

export function turSoruEtkinligi(s: TurSoru, manifest: ReadonlyMap<string, string>): TurEtkinlik {
  const uyaran: TurEtkinlik['uyaran'] =
    s.uyaran.tur === 'ses' ? { tur: 'ses' } : { tur: 'yazi', metin: s.uyaran.tur === 'yazi' ? s.uyaran.metin : s.hedefMetin };
  return {
    id: s.itemId.replace('#', '.').replace(/[^a-z0-9.-]/gi, '-').toLowerCase(),
    sablon: s.sablon,
    girisHarfi: s.girisHarfi,
    uyaran,
    yonerge: { anahtar: s.yonerge, metin: klipMetni(s.yonerge, manifest) },
    secenekler: s.kartlar.map((k) => ({
      tur: k.tur === 'hece' ? 'hece' : 'harf',
      metin: k.metin,
      sesli: false,
      ...(k.diagnosticTag ? { diagnosticTag: k.diagnosticTag } : {}),
    })),
    dogru:
      s.kind === 'secim' ? s.dogru : Math.max(0, s.kartlar.findIndex((k) => k.metin === s.dogruDizi[0])),
  };
}

export function turSoruIhlalleri(s: TurSoru, kume: ReadonlySet<string>, manifest: ReadonlyMap<string, string>): string[] {
  const h: string[] = [];
  const metinler = [
    ...s.kartlar.map((k) => k.metin),
    ...s.sozcukler,
    s.hedefMetin,
    ...(s.uyaran.tur === 'yazi' ? [s.uyaran.metin] : s.uyaran.tur === 'bosluklu' ? [s.uyaran.once, s.uyaran.sonra] : []),
  ];
  for (const m of metinler) if (!dekodlanabilirMi(m, kume)) h.push(`D-23/küme: "${m}" öğretilen kümede olmayan harf içeriyor.`);
  const istenen = [s.yonerge, ...s.soruKlipleri, ...s.geriBildirim];
  for (const k of istenen) {
    if (!manifest.has(k)) h.push(`D-21: klip manifestte yok: ${k}.`);
    else if (!klipMetniGecerliMi(klipMetni(k, manifest))) h.push(`D-11: klip tek başına ünsüz: ${k}.`);
    if (k.startsWith('tur.harf.')) h.push(`D-11: harf klibi istenemez: ${k}.`);
  }
  if (OKUMA_HEDEFLI.has(s.sablon) && s.soruKlipleri.length > 0) h.push('D-12: okuma hedefli soruda soru sesi yok.');
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
