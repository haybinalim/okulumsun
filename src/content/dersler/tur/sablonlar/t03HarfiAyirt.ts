/**
 * T-03 — HARFİ DİĞER SİMGELERDEN AYIRT ET (KB2.7, "Harfi diğer sembol/harflerden ayırt etme"; plan §2.4.6). SAF.
 *
 * Üst alanda model harf durur; çocuk aynısını sessiz kartlar arasından seçer. Harf seslendirilmez (ünsüz tek başına
 * okunmaz, K-OY-03); yönerge hedefi söylemez (okuma hedefli öğe, D-12). Geri bildirimde yalnız övgü.
 *
 * Zorluk: z1 harf + rakam (2 kart) · z2 harf + rakam + başka harf (3) · z3 karıştırılan çift öncelikli (3) ·
 * z4 karıştırılan çiftler + harf/rakam (4) · z5 yalnız harfler, karıştırılan çiftler önde (5). Çeldirici harfler
 * yalnız öğretilen kümeden (D-23); küme yetmezse rakamla tamamlanır (z5 hariç: z5'te rakam yok, kart azalır).
 */
import { createRng } from '../../../../exercises/rng';
import { kumeKodla } from '../ogretilenKume';
import { geriBildirimKlibi, yonergeKlibi } from './klipler';
import { enYeniHarf, harfCeldiricileri, kartlariKaristir, kumeHarfleri, soruGirisHarfi } from './ortak';
import { turItemId, TurUretimHatasi, type TurKart, type TurSecimSorusu, type TurUretimGirdisi } from './turSoru';

/** Harfe benzemeyen rakamlar (1 ~ l/ı, 0 ~ o, 6/9 ~ b/g/d karışmasın diye dışarıda). */
const RAKAMLAR = ['2', '3', '4', '5', '7', '8'] as const;

const AYAR = {
  1: { harf: 0, rakam: 1, oncelik: false },
  2: { harf: 1, rakam: 1, oncelik: false },
  3: { harf: 2, rakam: 0, oncelik: true },
  4: { harf: 2, rakam: 1, oncelik: true },
  5: { harf: 4, rakam: 0, oncelik: true },
} as const;

export function uretT03(g: TurUretimGirdisi): TurSecimSorusu {
  const ayar = AYAR[g.zorluk];
  const rng = createRng(g.tohum).fork(`T-03|${g.zorluk}`);
  const harfler = kumeHarfleri(g.kume);
  if (harfler.length === 0) throw new TurUretimHatasi('Öğretilen kümede harf yok.');
  const hedef = rng.bool(0.5) ? enYeniHarf(harfler) : rng.pick(harfler);
  const celd = harfCeldiricileri(rng, {
    hedef,
    kume: g.kume,
    adet: ayar.harf,
    yasak: new Set([hedef]),
    oncelikli: ayar.oncelik,
  });
  const rakamAdedi = ayar.rakam + (g.zorluk < 5 ? ayar.harf - celd.length : 0);
  const rakamlar = rng.sample(RAKAMLAR, rakamAdedi);
  if (celd.length + rakamlar.length === 0)
    throw new TurUretimHatasi('Bu harf kümesiyle "Harfi ayırt et" (z5) kurulamıyor: başka öğretilmiş harf yok.');
  const kartlar: TurKart[] = kartlariKaristir(rng, [
    { metin: hedef, tur: 'harf' },
    ...celd.map((c) => ({ metin: c.harf, tur: 'harf' as const, ...(c.etiket ? { diagnosticTag: c.etiket } : {}) })),
    ...rakamlar.map((r) => ({ metin: r, tur: 'simge' as const })),
  ]);
  return {
    kind: 'secim',
    itemId: turItemId('T-03', g.zorluk, g.tohum, kumeKodla(g.kume)),
    sablon: 'T-03',
    zorluk: g.zorluk,
    tohum: g.tohum,
    girisHarfi: soruGirisHarfi(kartlar.map((k) => k.metin)),
    yonerge: yonergeKlibi('t03'),
    soruKlipleri: [],
    uyaran: { tur: 'yazi', metin: hedef },
    geriBildirim: [geriBildirimKlibi('dogru')],
    hedefMetin: hedef,
    sozcukler: [],
    kartlar,
    dogru: kartlar.findIndex((k) => k.metin === hedef),
  };
}
