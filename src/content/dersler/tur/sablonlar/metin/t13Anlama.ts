/**
 * T-13 — METNİ OKU, SORUYU CEVAPLA (okuduğunu anlama; Adım 80, E3). SAF, deterministik. Dokun-seç.
 *
 * Üstte kısa metin (cümle başına bir satır, TemelYazi, sözcük bölünmez D-22) ve altında yazılı soru; altta cevap kartları:
 * resim (metinde adı geçen nesne) ya da sözcük (metinde geçen kişi/sözcük). Cevap metindedir. Okuma hedeflidir (D-12):
 * yönerge sabittir ve cevabı söylemez, soru sesi yoktur, ↻ yalnız yönergeyi çalar; doğru cevaptan sonra cevabın cümlesi
 * vurgulanır ve cümle klibi çalınır. Resim ve sözcük kartı cevaptan önce sessizdir. Yanlış seçenekler metinde ve soruda
 * GEÇMEZ (tek doğru cevap): resimlerde ad yoklaması (T-10 ile aynı), sözcüklerde yazarın verdiği seçenekler (öğretilmiş
 * harflerden, cevapla aynı büyük/küçük biçimde; D-27). Puan, süre ve kayıt yok.
 *
 * Zorluk: z1 2 seçenek, ≤ 2 cümlelik metin · z2 3 seçenek, 2–3 cümle · z3 3 seçenek, 3 cümle · z4 4 seçenek, 3–4 cümle ·
 * z5 4 seçenek, 4–5 cümle (aralıkta metin yoksa elde olan).
 */
import { createRng } from '../../../../../exercises/rng';
import { harfSirasi, kumeKodla } from '../../ogretilenKume';
import { geriBildirimKlibi, metinCumleKlibi, yonergeKlibi } from '../klipler';
import { kartlariKaristir, okunabilirSozcukler, soruGirisHarfi } from '../ortak';
import {
  turItemId,
  TurUretimHatasi,
  type TurHavuzMetinSorusu,
  type TurHavuzMetni,
  type TurHavuzSozcugu,
  type TurSecimSorusu,
  type TurUretimGirdisi,
} from '../turSoru';
import { cumleGovdeleri } from '../cumle/ortakCumle';
import { okunabilirMetinler } from './metinHavuzu';

const AYAR = {
  1: { kart: 2, min: 1, max: 2 },
  2: { kart: 3, min: 2, max: 3 },
  3: { kart: 3, min: 3, max: 3 },
  4: { kart: 4, min: 3, max: 4 },
  5: { kart: 4, min: 4, max: 5 },
} as const;

const AD = '"Metni oku, soruyu cevapla"';

interface Aday {
  readonly metin: TurHavuzMetni;
  readonly soru: TurHavuzMetinSorusu;
}

interface Secenek {
  readonly metin: string;
  readonly tur: 'gorsel' | 'sozcuk';
  readonly gorselId?: string;
}

export function uretT13(g: TurUretimGirdisi): TurSecimSorusu {
  const ayar = AYAR[g.zorluk];
  const rng = createRng(g.tohum).fork(`T-13|${g.zorluk}`);
  const metinler = okunabilirMetinler(g.metinler ?? [], g.kume);
  if (metinler.length === 0)
    throw new TurUretimHatasi(`Bu harf kümesiyle ${AD} kurulamıyor: okunabilir metin yok (metinler 2. gruptan).`);
  const resimli = okunabilirSozcukler(g.havuz, g.kume).filter((s) => s.gorselId);
  const resmin = new Map(resimli.map((s) => [s.gorselId!, s]));
  // Resim cevabı yalnız havuzda okunabilir görselli sözcüğü olan sorular; sözcük cevabı yeterli seçeneği olanlar.
  const adaylar: Aday[] = metinler.flatMap((metin) =>
    metin.sorular
      .filter((soru) => (soru.cevapTuru === 'gorsel' ? resmin.has(soru.cevap) : soru.celdiriciler.length >= ayar.kart - 1))
      .map((soru) => ({ metin, soru })),
  );
  if (adaylar.length === 0) throw new TurUretimHatasi(`Bu harf kümesiyle ${AD} kurulamıyor: cevaplanabilir soru yok.`);
  const boyda = adaylar.filter((a) => a.metin.cumleler.length >= ayar.min && a.metin.cumleler.length <= ayar.max);
  const havuzAday = boyda.length > 0 ? boyda : adaylar;
  for (let deneme = 0; deneme < 40; deneme++) {
    const { metin, soru } = rng.pick(havuzAday);
    const metindeGecen = new Set([...metin.cumleler, soru.soru].flatMap(cumleGovdeleri));
    let dogru: Secenek;
    let digerleri: Secenek[];
    if (soru.cevapTuru === 'gorsel') {
      const hedef = resmin.get(soru.cevap) as TurHavuzSozcugu;
      dogru = { metin: hedef.metin, tur: 'gorsel', gorselId: hedef.gorselId };
      // Adı metinde (ya da bir sözcüğün başında) geçen resim çeldirici olamaz: tek doğru cevap.
      digerleri = resimli
        .filter((s) => s.metin !== hedef.metin && ![...metindeGecen].some((w) => w.startsWith(s.metin) || s.metin.startsWith(w)))
        .map((s) => ({ metin: s.metin, tur: 'gorsel' as const, gorselId: s.gorselId }));
    } else {
      dogru = { metin: soru.cevap, tur: 'sozcuk' };
      digerleri = soru.celdiriciler.map((c) => ({ metin: c, tur: 'sozcuk' as const }));
    }
    if (digerleri.length < ayar.kart - 1) continue;
    const kartlar = kartlariKaristir(rng, [dogru, ...rng.sample(digerleri, ayar.kart - 1)]);
    const giris = soruGirisHarfi([...metin.cumleler, soru.soru, ...kartlar.map((k) => k.metin)]);
    return {
      kind: 'secim',
      itemId: turItemId('T-13', g.zorluk, g.tohum, kumeKodla(g.kume)),
      sablon: 'T-13',
      zorluk: g.zorluk,
      tohum: g.tohum,
      girisHarfi: harfSirasi(metin.girisHarfi) > harfSirasi(giris) ? metin.girisHarfi : giris,
      yonerge: yonergeKlibi('t13'),
      soruKlipleri: [],
      uyaran: { tur: 'metin', cumleler: metin.cumleler, soru: soru.soru },
      geriBildirim: [geriBildirimKlibi('dogru'), metinCumleKlibi(metin.id, soru.cumleNo)],
      hedefMetin: metin.cumleler[soru.cumleNo - 1],
      sozcukler: kartlar.map((k) => k.metin),
      kartlar,
      dogru: kartlar.findIndex((k) => k.metin === dogru.metin),
    };
  }
  throw new TurUretimHatasi(`Bu harf kümesiyle ${AD} kurulamadı: yeterli yanlış seçenek yok.`);
}
