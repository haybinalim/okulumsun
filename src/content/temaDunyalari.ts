/**
 * TEMA DÜNYALARI (plan v2 Adım 54; `docs/maskot/karakter-kitabi.md` "Tema dünyaları").
 *
 * Her temanın hikâyesi bir yerde geçer; arka planı `src/ui/svg/temaSahneleri.tsx` çizer, hikâye verisi
 * `maskotHikayeleri.json`. SAF veri: React yok (şema da buradan okur).
 */
export const SAHNE_ADLARI = ['park', 'bahce', 'mutfak', 'gol', 'pazar', 'atolye', 'ciftlik'] as const;
export type SahneAdi = (typeof SAHNE_ADLARI)[number];

export type TemaNo = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Tema numarası (appStore `TEMALAR`) → dünya. */
export const TEMA_SAHNESI: Readonly<Record<TemaNo, SahneAdi>> = {
  1: 'park', // Yön ve Yerler — altında/üstünde, sağ/sol
  2: 'bahce', // Sayılar — çiçek, elma, kelebek sayma
  3: 'mutfak', // Ölçme — uzun/kısa, ağır/hafif, kap
  4: 'gol', // Toplama ve Çıkarma — gelen/giden ördekler
  5: 'pazar', // Paralarımız — tezgâh, kese
  6: 'atolye', // Şekiller — bloklar, şekil panosu
  7: 'ciftlik', // Sayalım ve Gösterelim — hayvanları sayıp çeteleye işleme
};
