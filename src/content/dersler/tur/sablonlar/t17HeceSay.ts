/**
 * T-17 — HECE SAY / ALKIŞLA (T.D.1.2.d hece farkındalığı; T.O.1.1.a; Adım 79). SAF, deterministik. Dokun-seç.
 *
 * Sözcüğün hecelerini el çırparak sayma. Üstte resim (z1–3; z1–2 altında yazılı sözcük) ya da yalnız yazılı sözcük
 * (z4–5, okuma: soru sesi yok, D-12). Resimli soruda resmin adı soru sesidir (ses dosyası yokken öğretmen okur).
 * Kartlar rakam + o kadar nokta (renk tek ipucu değil); sıralı durur (sayı doğrusu gibi), karıştırılmaz.
 * Hece sayısı `hecele` ile; yalnız öğretilmiş harfli sözcükler (resimli adımda görseli olanlar).
 *
 * Zorluk: z1 resim + yazı, 1–2 hece, 2 kart · z2 resim + yazı, 1–3 hece, 3 kart · z3 yalnız resim, 1–3 hece, 3 kart ·
 * z4 yalnız yazı, 1–4 hece, 4 kart · z5 yalnız yazı, 2–4 hece, 4 kart. Cevap önce hece sayısına göre seçilir
 * (hep aynı sayı gelmesin), sonra sözcük.
 */
import { createRng } from '../../../../exercises/rng';
import { hecele } from '../heceleme';
import { kumeKodla } from '../ogretilenKume';
import { geriBildirimKlibi, sozcukKlibi, yonergeKlibi } from './klipler';
import { okunabilirSozcukler, soruGirisHarfi } from './ortak';
import { turItemId, TurUretimHatasi, type TurSecimSorusu, type TurUretimGirdisi } from './turSoru';

const AYAR = {
  1: { kart: 2, min: 1, resim: true, yazi: true },
  2: { kart: 3, min: 1, resim: true, yazi: true },
  3: { kart: 3, min: 1, resim: true, yazi: false },
  4: { kart: 4, min: 1, resim: false, yazi: true },
  5: { kart: 4, min: 2, resim: false, yazi: true },
} as const;

export function uretT17(g: TurUretimGirdisi): TurSecimSorusu {
  const ayar = AYAR[g.zorluk];
  const rng = createRng(g.tohum).fork(`T-17|${g.zorluk}`);
  const adaylar = okunabilirSozcukler(g.havuz, g.kume)
    .filter((s) => !ayar.resim || s.gorselId)
    .map((s) => ({ s, n: hecele(s.metin).length }))
    .filter((x) => x.n >= ayar.min && x.n <= ayar.kart);
  const sayilar = [...new Set(adaylar.map((x) => x.n))];
  if (sayilar.length === 0)
    throw new TurUretimHatasi('Bu harf kümesiyle "Hece say" kurulamıyor: uygun okunabilir sözcük yok.');
  const n = rng.pick(sayilar);
  const { s } = rng.pick(adaylar.filter((x) => x.n === n));
  const kartlar = Array.from({ length: ayar.kart }, (_, i) => ({ id: `k${i}`, metin: String(i + 1), tur: 'sayi' as const }));
  return {
    kind: 'secim',
    itemId: turItemId('T-17', g.zorluk, g.tohum, kumeKodla(g.kume)),
    sablon: 'T-17',
    zorluk: g.zorluk,
    tohum: g.tohum,
    girisHarfi: soruGirisHarfi([s.metin]),
    yonerge: yonergeKlibi(ayar.resim ? 't17' : 't17-oku'),
    soruKlipleri: ayar.resim ? [sozcukKlibi(s.metin)] : [],
    uyaran: ayar.resim
      ? { tur: 'resim', gorselId: s.gorselId!, ...(ayar.yazi ? { metin: s.metin } : {}) }
      : { tur: 'yazi', metin: s.metin },
    geriBildirim: [geriBildirimKlibi('dogru'), sozcukKlibi(s.metin)],
    hedefMetin: s.metin,
    sozcukler: [s.metin],
    ...(ayar.resim ? { dinlenen: [s.metin] } : {}),
    kartlar,
    dogru: n - 1,
  };
}
