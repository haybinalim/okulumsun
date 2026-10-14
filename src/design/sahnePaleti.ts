/**
 * Tema sahneleri paleti (plan v2 Adım 54, KG-91; `src/ui/svg/temaSahneleri.tsx`).
 *
 * Yalnız açık pasteller: her renk `COLOR.ink`'e ≥ 7:1, kırmızı ton yok; renk anlam taşımaz (renk körlüğü dostu paletle de
 * aynı). Yeni renk eklenirse `tests/unit/maskotHikayesi.spec.ts` denetler.
 */
export const SAHNE_PALETI = {
  gok: '#E8F2F9',
  bulut: '#FFFFFF',
  gunes: '#FFF2C6',
  cimen: '#E2F0D8',
  cimenKoyu: '#CFE6C1',
  agac: '#C9E3BC',
  govde: '#E6D5C3',
  yol: '#F3EBDD',
  su: '#D9ECF5',
  suKoyu: '#C7E2EF',
  duvar: '#FBF4E8',
  zemin: '#EFE4D3',
  tahta: '#EAD9C4',
  tente: '#DCE9F5',
  tente2: '#F6E7CF',
  lila: '#ECE4F4',
  seftali: '#F9E8DA',
  krem: '#FFFAF0',
  cizgi: '#D8CCBB',
} as const;
