/**
 * E2E eve link örneği (plan v2 Adım 42). Playwright test dosyaları JSON içe aktaran `src/` modüllerini
 * yükleyemediği için hash burada sabittir; `tests/unit/eveLinkAcilis.spec.ts` `eveLinkHash` ile eşitliğini denetler.
 */
export const EVE_LINK_ORNEGI = {
  dugumler: ['mat.uzam.konum-ifadeleri', 'mat.sayma.kardinalite'],
  tohum: 4242,
  setKodu: '1.a1b4.39u',
  hash: '#ev=1.1.a1b4.39u',
} as const;
