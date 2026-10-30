/**
 * Türkçe doğrulayıcı test verisi (Okuma Yazma planı Adım 62, G0 kapısı): geçerli bir temel dosya ve her
 * kural için onu bozan "tuzak" değişiklikleri. Sözcükler programın kendi örneklerinden (a, an, ana, anne,
 * nane, Ata, "Okan o ne?", "Kemal elma, erik, limon al.", "Ah, elim acıdı!") ve gündelik sözcüklerdendir;
 * içerik havuzu değildir (havuz Adım 66'da, öğretmen teyidiyle).
 */
import { PROGRAM_SURUMU } from '../../src/content/dersler/tur/alfabe';
import type { KuralKodu } from '../../src/content/dersler/tur/dogrulayici';

type Ham = Record<string, unknown> & {
  harfler: Record<string, unknown>[];
  heceler: Record<string, unknown>[];
  sozcukler: Record<string, unknown>[];
  cumleler: Record<string, unknown>[];
  etkinlikler: Record<string, unknown>[];
};

const teyit = { ogretmen: ['O1', 'O2'], tarih: '2026-11-01' };
const sz = (id: string, metin: string, girisHarfi: string, ek: Record<string, unknown> = {}) => ({
  id,
  metin,
  girisHarfi,
  anlamTeyidi: teyit,
  klip: { anahtar: `tur.sozcuk.${id}`, metin },
  ...ek,
});

export function gecerliHam(): Ham {
  return {
    programSurumu: PROGRAM_SURUMU,
    harfler: [
      { id: 'h-a', kucuk: 'a', buyuk: 'A', grup: 1, sira: 1, tur: 'unlu', klip: { anahtar: 'tur.unlu.a', metin: 'a' } },
      { id: 'h-n', kucuk: 'n', buyuk: 'N', grup: 1, sira: 2, tur: 'unsuz', karistirilan: ['u', 'm'] },
      { id: 'h-i', kucuk: 'i', buyuk: 'İ', grup: 1, sira: 5, tur: 'unlu' },
      { id: 'h-ii', kucuk: 'ı', buyuk: 'I', grup: 2, sira: 5, tur: 'unlu' },
    ],
    heceler: [
      { id: 'c-an', metin: 'an', girisHarfi: 'n', anlamli: true, sozcukler: ['s-anne'] },
      { id: 'c-en', metin: 'en', girisHarfi: 'e', anlamli: true, sozcukler: ['s-en'] },
      { id: 'c-ne', metin: 'ne', girisHarfi: 'e', anlamli: true, sozcukler: ['s-nene'] },
      { id: 'c-at', metin: 'at', girisHarfi: 't', anlamli: true, sozcukler: ['s-at'] },
      { id: 'c-et', metin: 'et', girisHarfi: 't', anlamli: true, sozcukler: ['s-et'] },
    ],
    sozcukler: [
      sz('s-ana', 'ana', 'n'),
      sz('s-anne', 'anne', 'e', { gorselId: 'g-anne' }),
      sz('s-nene', 'nene', 'e'),
      sz('s-nane', 'nane', 'e', { gorselId: 'g-nane' }),
      sz('s-en', 'en', 'e'),
      sz('s-at', 'at', 't', { gorselId: 'g-at' }),
      sz('s-et', 'et', 't'),
      sz('s-ata-ad', 'Ata', 't', { ozelAd: true }),
      sz('s-alet', 'alet', 'l'),
      sz('s-elma', 'elma', 'm', { gorselId: 'g-elma' }),
    ],
    cumleler: [
      { id: 'k-ata', metin: 'Ata kalem al.', girisHarfi: 'm', ozelAdlar: ['Ata'], gorselId: 'g-kalem' },
      { id: 'k-okan', metin: 'Okan o ne?', girisHarfi: 'k', ozelAdlar: ['Okan'] },
      {
        id: 'k-kemal',
        metin: 'Kemal elma, erik, limon al.',
        girisHarfi: 'm',
        ozelAdlar: ['Kemal'],
        siraliSozcukler: true,
      },
      { id: 'k-ah', metin: 'Ah, elim acıdı!', girisHarfi: 'h' },
      { id: 'k-nil', metin: "Nil'e kalem al.", girisHarfi: 'm', ozelAdlar: ['Nil'] },
    ],
    etkinlikler: [
      {
        id: 'e-t02',
        sablon: 'T-02',
        girisHarfi: 't',
        uyaran: { tur: 'ses' },
        yonerge: { anahtar: 'tur.yonerge.ortak-ses', metin: 'Sözcükleri dinle. Ortak sesin harfini seç.' },
        secenekler: [
          { tur: 'harf', metin: 't', sesli: false },
          { tur: 'harf', metin: 'n', sesli: false },
        ],
        dogru: 0,
      },
      {
        id: 'e-t08',
        sablon: 'T-08',
        girisHarfi: 't',
        uyaran: { tur: 'yazi', metin: 'nane' },
        yonerge: { anahtar: 'tur.yonerge.oku-resmini-bul', metin: 'Sözcüğü oku. Resmini bul.' },
        secenekler: [
          { tur: 'gorsel', gorselId: 'g-nane', sesli: false },
          { tur: 'gorsel', gorselId: 'g-anne', sesli: false },
          { tur: 'gorsel', gorselId: 'g-at', sesli: false },
        ],
        dogru: 0,
      },
    ],
  };
}

const bul = (l: Record<string, unknown>[], id: string) => l.find((x) => x.id === id)!;

/** Her tuzak: beklenen kural + geçerli dosyayı bozan değişiklik. */
export const TUZAKLAR: readonly { readonly kural: KuralKodu; readonly ad: string; readonly boz: (h: Ham) => void }[] = [
  { kural: 'D-01', ad: 'harf grubu yanlış', boz: (h) => void (bul(h.harfler, 'h-n').grup = 2) },
  { kural: 'D-01', ad: 'i büyüğü I (tr-TR değil)', boz: (h) => void (bul(h.harfler, 'h-i').buyuk = 'I') },
  { kural: 'D-01', ad: 'ünlü/ünsüz türü yanlış', boz: (h) => void (bul(h.harfler, 'h-n').tur = 'unlu') },
  { kural: 'D-02', ad: 'öğretilmemiş harfli sözcük', boz: (h) => void h.sozcukler.push(sz('s-kalem', 'kalem', 't')) },
  {
    kural: 'D-02',
    ad: 'özel adın büyük harfi öğretilmeden',
    boz: (h) => void (bul(h.sozcukler, 's-ata-ad').girisHarfi = 'n'),
  },
  {
    kural: 'D-02',
    ad: 'İ ile i ayrı harf değil sanılırsa',
    boz: (h) => void h.sozcukler.push(sz('s-inek', 'İnek', 'i', { ozelAd: true })),
  },
  { kural: 'D-03', ad: 'hece "n"den önce', boz: (h) => void (bul(h.heceler, 'c-an').girisHarfi = 'a') },
  {
    kural: 'D-03',
    ad: 'açık hece kapalıdan önce',
    boz: (h) => {
      h.heceler.splice(3, 0, { id: 'c-ta', metin: 'ta', girisHarfi: 't', anlamli: false, sozcukler: ['s-tane'] });
      h.sozcukler.push(sz('s-tane', 'tane', 't'));
    },
  },
  {
    kural: 'D-03',
    ad: 'üç harfli hece kapalı/açıktan önce',
    boz: (h) => {
      h.heceler.unshift({ id: 'c-nal', metin: 'nal', girisHarfi: 'l', anlamli: true, sozcukler: ['s-nal'] });
      h.sozcukler.push(sz('s-nal', 'nal', 'l'));
    },
  },
  { kural: 'D-04', ad: 'hecede büyük harf', boz: (h) => void (bul(h.heceler, 'c-an').metin = 'An') },
  { kural: 'D-04', ad: 'hece birden çok hece', boz: (h) => void (bul(h.heceler, 'c-an').metin = 'ana') },
  {
    kural: 'D-05',
    ad: 'hece bağlı sözcüğün hecesi değil',
    boz: (h) => void (bul(h.heceler, 'c-an').sozcukler = ['s-ana']),
  },
  { kural: 'D-05', ad: 'bağlı sözcük yok', boz: (h) => void (bul(h.heceler, 'c-en').sozcukler = ['s-yok']) },
  {
    kural: 'D-07',
    ad: 'cümlede görsel jetonu (rebus)',
    boz: (h) => void (bul(h.cumleler, 'k-ata').metin = 'Ata [kalem] al.'),
  },
  { kural: 'D-07', ad: 'sözcük alanında iki sözcük', boz: (h) => void (bul(h.sozcukler, 's-ana').metin = 'ana ne') },
  {
    kural: 'D-08',
    ad: '1. grupta cümle',
    boz: (h) => void h.cumleler.push({ id: 'k-nil1', metin: 'Nil ata nal al.', girisHarfi: 'l', ozelAdlar: ['Nil'] }),
  },
  {
    kural: 'D-09',
    ad: 'ünlem 5. gruptan önce ve ünlem sözcüksüz',
    boz: (h) => void (bul(h.cumleler, 'k-ata').metin = 'Ata kalem al!'),
  },
  { kural: 'D-09', ad: 'sıralı olmayan virgül', boz: (h) => void (bul(h.cumleler, 'k-ata').metin = 'Ata, kalem al.') },
  { kural: 'D-09', ad: 'kısa çizgi', boz: (h) => void (bul(h.cumleler, 'k-ata').metin = 'Ata kalem-al.') },
  { kural: 'D-09', ad: 'özel ad olmayan sözcükte kesme', boz: (h) => void (bul(h.cumleler, 'k-nil').ozelAdlar = []) },
  { kural: 'D-09', ad: 'bitiş işareti yok', boz: (h) => void (bul(h.cumleler, 'k-ata').metin = 'Ata kalem al') },
  { kural: 'D-09', ad: 'iki bitiş işareti', boz: (h) => void (bul(h.cumleler, 'k-okan').metin = 'Okan o ne?.') },
  {
    kural: 'D-10',
    ad: 'cümle ortasında büyük harf',
    boz: (h) => void (bul(h.cumleler, 'k-ata').metin = 'Ata Kalem al.'),
  },
  {
    kural: 'D-10',
    ad: 'özel ad olmayan sözcük büyük harfli',
    boz: (h) => void (bul(h.sozcukler, 's-nane').metin = 'Nane'),
  },
  {
    kural: 'D-11',
    ad: 'ünsüz harf klibi',
    boz: (h) => void (bul(h.harfler, 'h-n').klip = { anahtar: 'tur.unsuz.n', metin: 'n' }),
  },
  {
    kural: 'D-11',
    ad: 'harf kartı cevaptan önce sesli',
    boz: (h) => void ((bul(h.etkinlikler, 'e-t02').secenekler as Record<string, unknown>[])[1].sesli = true),
  },
  {
    kural: 'D-11',
    ad: 'sözcük klibi tek ünsüz',
    boz: (h) => void (bul(h.sozcukler, 's-at').klip = { anahtar: 'tur.sozcuk.t', metin: 't' }),
  },
  {
    kural: 'D-12',
    ad: 'okuma sorusunda yönerge hedef sözcüğü söylüyor',
    boz: (h) => void (bul(h.etkinlikler, 'e-t08').yonerge = { anahtar: 'tur.yonerge.x', metin: 'Nane sözcüğünü bul.' }),
  },
  {
    kural: 'D-15',
    ad: 'seçenek görseli öğretilmemiş harfli sözcüğün',
    boz: (h) => void ((bul(h.etkinlikler, 'e-t08').secenekler as Record<string, unknown>[])[2].gorselId = 'g-elma'),
  },
  {
    kural: 'D-15',
    ad: 'T-08 seçeneği görsel değil (resim yerine sözcük)',
    boz: (h) =>
      void ((bul(h.etkinlikler, 'e-t08').secenekler as Record<string, unknown>[])[2] = {
        tur: 'sozcuk',
        metin: 'at',
        sesli: false,
      }),
  },
  {
    kural: 'D-15',
    ad: 'görsel hiçbir sözcüğe bağlı değil',
    boz: (h) => void ((bul(h.etkinlikler, 'e-t08').secenekler as Record<string, unknown>[])[1].gorselId = 'g-yok'),
  },
  { kural: 'D-20', ad: 'kimlik tekil değil', boz: (h) => void (bul(h.sozcukler, 's-nene').id = 's-ana') },
  {
    kural: 'D-23',
    ad: 'çeldirici öğretilmemiş harf',
    boz: (h) => void ((bul(h.etkinlikler, 'e-t02').secenekler as Record<string, unknown>[])[1].metin = 'k'),
  },
  {
    kural: 'D-23',
    ad: 'bilinmeyen tanı etiketi',
    boz: (h) => void ((bul(h.etkinlikler, 'e-t02').secenekler as Record<string, unknown>[])[1].diagnosticTag = 'X'),
  },
  { kural: 'D-23', ad: 'doğru indeksi dışarıda', boz: (h) => void (bul(h.etkinlikler, 'e-t02').dogru = 5) },
];
