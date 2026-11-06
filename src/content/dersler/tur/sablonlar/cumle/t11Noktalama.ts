/**
 * T-11 — NOKTALAMA İŞARETİNİ SEÇ (T.Y.1.3.k, T.O.1.1.h; plan §2.4.6, Adım 74). SAF, deterministik. Dokun-seç.
 *
 * Üstte cümle bitiş işaretsiz ve sonunda boş bir yuvayla (dokunulmaz); altta işaret kartları SABİT sırada (. ? !),
 * karıştırılmaz. İşaretler programdaki tanıtım sırasıyla gelir (D-09, K-OY-12): nokta ilk cümleden, soru işareti 2.
 * gruptan, ünlem işareti yalnız 5. grup açılınca (öğretilen kümede `p`) ve ünlem sözcüğüyle başlayan duygu cümlesinde.
 * Okuma hedeflidir (D-12): soru sesi yok; cümle tonlamasıyla yalnız doğru cevaptan sonra okunur (geri bildirim).
 *
 * Zorluk: z1 2 kart (. ?), en çok 3 sözcük, soru cümlesi soru ekli (mı/mi/mu/mü) · z2 2 kart, en çok 4 sözcük ·
 * z3 2 kart, her uzunluk, soru sözcüklü sorular da · z4 bütün tanıtılmış işaretler (ünlem açıksa 3 kart), her tür ·
 * z5 bütün işaretler, ünlem açıksa çoğunlukla ünlem cümlesi, değilse eksiz soru.
 */
import { createRng } from '../../../../../exercises/rng';
import { UNLEM_GIRIS_HARFI } from '../../alfabe';
import { kumeKodla } from '../../ogretilenKume';
import { cumleKlibi, geriBildirimKlibi, yonergeKlibi } from '../klipler';
import { turItemId, TurUretimHatasi, type TurHavuzCumlesi, type TurSecimSorusu, type TurUretimGirdisi } from '../turSoru';
import { okunabilirCumleler } from './cumleHavuzu';
import { cumleGirisHarfi, cumleSozcukleri, soruEkiVarMi } from './ortakCumle';

/** Tanıtım sırası (kolaydan zora). */
export const NOKTALAMA_SIRASI = ['.', '?', '!'] as const;

const AYAR = {
  1: { max: 3, ek: true, unlemKarti: false },
  2: { max: 4, ek: false, unlemKarti: false },
  3: { max: 5, ek: false, unlemKarti: false },
  4: { max: 5, ek: false, unlemKarti: true },
  5: { max: 5, ek: false, unlemKarti: true },
} as const;

export function uretT11(g: TurUretimGirdisi): TurSecimSorusu {
  const ayar = AYAR[g.zorluk];
  const rng = createRng(g.tohum).fork(`T-11|${g.zorluk}`);
  const okunur = okunabilirCumleler(g.cumleler ?? [], g.kume);
  const unlemAcik = g.kume.has(UNLEM_GIRIS_HARFI) && okunur.some((c) => c.tur === 'unlem');
  const isaretler = NOKTALAMA_SIRASI.filter((x) => x !== '!' || (ayar.unlemKarti && unlemAcik));
  const uygun = (c: TurHavuzCumlesi) =>
    isaretler.includes(c.noktalama) &&
    cumleSozcukleri(c.metin).length <= ayar.max &&
    (!ayar.ek || c.tur !== 'soru' || soruEkiVarMi(c.metin));
  const adaylar = okunur.filter(uygun);
  const turler = [...new Set(adaylar.map((c) => c.tur))];
  if (turler.length === 0)
    throw new TurUretimHatasi('Bu harf kümesiyle "Noktalama işaretini seç" kurulamıyor: okunabilir cümle yok (cümleler 2. gruptan).');
  // Önce tür (hep nokta gelmesin), sonra cümle. z5: ünlem açıksa ünlem ağırlıklı, değilse eksiz soru öncelikli.
  let tur = rng.pick(turler);
  if (g.zorluk === 5) {
    if (turler.includes('unlem') && rng.int(0, 2) > 0) tur = 'unlem';
    else if (tur !== 'unlem' && adaylar.some((c) => c.tur === 'soru' && !soruEkiVarMi(c.metin)) && rng.int(0, 1) === 1) tur = 'soru';
  }
  let liste = adaylar.filter((c) => c.tur === tur);
  if (g.zorluk === 5 && tur === 'soru') {
    const eksiz = liste.filter((c) => !soruEkiVarMi(c.metin));
    if (eksiz.length > 0) liste = eksiz;
  }
  const c = rng.pick(liste);
  const kartlar = isaretler.map((m, i) => ({ id: `k${i}`, metin: m, tur: 'noktalama' as const }));
  return {
    kind: 'secim',
    itemId: turItemId('T-11', g.zorluk, g.tohum, kumeKodla(g.kume)),
    sablon: 'T-11',
    zorluk: g.zorluk,
    tohum: g.tohum,
    girisHarfi: cumleGirisHarfi(c, []),
    yonerge: yonergeKlibi('t11'),
    soruKlipleri: [],
    uyaran: { tur: 'noktalama', metin: c.metin.slice(0, -1) },
    geriBildirim: [geriBildirimKlibi('dogru'), cumleKlibi(c.id)],
    hedefMetin: c.metin,
    sozcukler: [c.metin],
    kartlar,
    dogru: isaretler.indexOf(c.noktalama),
  };
}
