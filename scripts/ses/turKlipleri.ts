/**
 * Türkçe (Okuma Yazma) ses klipleri — SAF + küçük disk yardımcıları (ADR-0016).
 *
 * Girdi `ders-verisi/tur/ses/klipler.json` (`npm run tur:klip` üretir, elle düzenlenmez). Çıktı matematik hattıyla
 * AYNI `Clip` biçimi: `generate-audio.ts --ders tur` aynı planlayıcıyı, sentezleyiciyi ve ücretsiz katman defterini
 * kullanır. Ses dosyası `ders-verisi/tur/ses/<tür>/<ad>.m4a` (anahtar `tur.<tür>.<ad>`); uygulama aynı göreli yolu
 * `./tur/ses/<tür>/<ad>.m4a` olarak okur (`scripts/yayin/dersVerisi.ts` `.m4a`yı `dist/tur/` altına yayar;
 * `.hashes.json` noktalı olduğu için yayılmaz).
 *
 * D-11 KAPISI: tek ünsüz (ya da ünlüsüz) metinli klip üretim planına GİRMEZ; hata fırlatılır, hiç istek gitmez.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { harfMi, unluMu, yalnizUnsuzMu } from '../../src/content/dersler/tur/alfabe';
import type { Clip } from './klipler.ts';

export const TUR_SES_DIZINI = 'ders-verisi/tur/ses';
export const TUR_KLIP_MANIFESTI = `${TUR_SES_DIZINI}/klipler.json`;

const ANAHTAR = /^tur\.(sozcuk|hece|cumle|yonerge|geri)\.([a-z0-9][a-z0-9-]*)$/;

/** `tur.sozcuk.kale` → `sozcuk/kale.m4a` (`TUR_SES_DIZINI` köküne göre). Geçersiz anahtar hata verir. */
export function turKlipDosyasi(anahtar: string): string {
  const m = ANAHTAR.exec(anahtar);
  if (!m) throw new Error(`Geçersiz Türkçe klip anahtarı: "${anahtar}"`);
  return `${m[1]}/${m[2]}.m4a`;
}

/** D-11: metin en az bir ünlü harf taşımalı; yalnız ünsüzden (ya da harf içermeyen) metin seslendirilmez. */
export function turKlipMetniUretilebilirMi(metin: string): boolean {
  if (metin.trim().length === 0 || yalnizUnsuzMu(metin)) return false;
  return [...metin].some((c) => harfMi(c) && unluMu(c));
}

/**
 * Manifest JSON'unu doğrular ve `Clip` listesine çevirir. Bozuk biçim, yinelenen anahtar ya da D-11 ihlali
 * hata verir (sessizce atlanmaz: eksik klip = sessiz ekran).
 */
export function turKlipleriniAyir(ham: unknown): readonly Clip[] {
  const klipler = (ham as { klipler?: unknown } | null)?.klipler;
  if (!Array.isArray(klipler) || klipler.length === 0) {
    throw new Error(`${TUR_KLIP_MANIFESTI}: "klipler" boş ya da yok — önce \`npm run tur:klip\`.`);
  }
  const gorulen = new Set<string>();
  const ihlal: string[] = [];
  const sonuc: Clip[] = [];
  for (const k of klipler as Record<string, unknown>[]) {
    if (typeof k?.anahtar !== 'string' || typeof k.metin !== 'string') {
      throw new Error(`${TUR_KLIP_MANIFESTI}: anahtar/metin eksik bir klip var.`);
    }
    if (gorulen.has(k.anahtar)) throw new Error(`${TUR_KLIP_MANIFESTI}: yinelenen anahtar ${k.anahtar}`);
    gorulen.add(k.anahtar);
    if (!turKlipMetniUretilebilirMi(k.metin)) {
      ihlal.push(`${k.anahtar} ("${k.metin}")`);
      continue;
    }
    sonuc.push({ key: k.anahtar, text: k.metin, file: turKlipDosyasi(k.anahtar), core: false });
  }
  if (ihlal.length > 0) {
    throw new Error(`D-11: tek ünsüz / ünlüsüz klip üretilmez (${ihlal.length}): ${ihlal.slice(0, 5).join(', ')}`);
  }
  return sonuc;
}

/** Klip dosyası diskte var mı (`tur:klip` durumu buradan türetir; elle düzenleme yok). */
export function turKlipDiskteVarMi(kok: string): (dosya: string) => boolean {
  return (dosya) => existsSync(path.join(kok, TUR_SES_DIZINI, dosya));
}
