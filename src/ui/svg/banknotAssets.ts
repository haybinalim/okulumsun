import type { BanknotDegeri } from '../../exercises/types';

/**
 * TCMB'nin yayımladığı E9 5. tertip ön yüz örnekleri. Yollar BASE_URL üzerinden
 * kurulur; böylece okul sunucusu, alt dizin ve USB/PWA açılışlarında da göreli
 * kalır. Her dosyada `ORNEKTIR GECMEZ` ibaresi korunmuştur.
 */
export const RESMI_BANKNOT_GORSELLERI: Readonly<Partial<Record<BanknotDegeri, string>>> = {
  5: `${import.meta.env.BASE_URL}images/banknotlar/5-tl-on-yuz-resmi.webp`,
  10: `${import.meta.env.BASE_URL}images/banknotlar/10-tl-on-yuz-resmi.webp`,
  20: `${import.meta.env.BASE_URL}images/banknotlar/20-tl-on-yuz-resmi.webp`,
  50: `${import.meta.env.BASE_URL}images/banknotlar/50-tl-on-yuz-resmi.webp`,
  100: `${import.meta.env.BASE_URL}images/banknotlar/100-tl-on-yuz-resmi.webp`,
  200: `${import.meta.env.BASE_URL}images/banknotlar/200-tl-on-yuz-resmi.webp`,
};
