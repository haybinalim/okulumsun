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
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
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

export const TUR_RET_LISTESI = `${TUR_SES_DIZINI}/reddedilen.json`;

/**
 * Kulakla reddedilen klipler (ölçümün yakalayamayacağı hatalar: ör. "ok" → "oke", fazladan ünlü).
 * Biçim: `{ "tur.sozcuk.ok": { "neden": "...", "tarih": "2026-11-16" } }`. Bu listedeki klip ÜRETİLMEZ ve dosyası
 * diskte olsa bile `durum` `eksik` türetilir (çalıcı yalnız `var` çalar → çalmaz).
 */
export const RetListesiSemasi = z.record(
  z.string().regex(ANAHTAR, 'geçersiz Türkçe klip anahtarı'),
  z.object({ neden: z.string().trim().min(1), tarih: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).strict(),
);
export type RetListesi = z.infer<typeof RetListesiSemasi>;

/** Ham JSON'u doğrular; bozuk biçim hata verir (sessizce yok sayılırsa reddedilen klip yeniden üretilirdi). */
export function retListesiniAyir(ham: unknown): RetListesi {
  const s = RetListesiSemasi.safeParse(ham);
  if (!s.success) throw new Error(`${TUR_RET_LISTESI}: ${s.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
  return s.data;
}

/** Depo köküne göre ret listesi; dosya yoksa boş (liste isteğe bağlı), bozuksa hata. */
export function retListesiniOku(kok: string): RetListesi {
  const yol = path.join(kok, TUR_RET_LISTESI);
  return existsSync(yol) ? retListesiniAyir(JSON.parse(readFileSync(yol, 'utf8')) as unknown) : {};
}

/** Reddedilen klipleri üretim listesinden ayırır (reddedilene istek atılmaz). */
export function retListesiniUygula(klipler: readonly Clip[], ret: RetListesi): { readonly uretilebilir: readonly Clip[]; readonly reddedilen: readonly Clip[] } {
  return { uretilebilir: klipler.filter((c) => !(c.key in ret)), reddedilen: klipler.filter((c) => c.key in ret) };
}

/**
 * Klip dosyası diskte var mı (`tur:klip` durumu buradan türetir; elle düzenleme yok). Reddedilen klibin dosyası
 * diskte olsa bile YOK sayılır → `durum: "eksik"`; `validate`, `tur:klip` ve çalıcı aynı kararı görür.
 */
export function turKlipDiskteVarMi(kok: string): (dosya: string) => boolean {
  const reddedilenDosyalar = new Set(Object.keys(retListesiniOku(kok)).map(turKlipDosyasi));
  return (dosya) => !reddedilenDosyalar.has(dosya) && existsSync(path.join(kok, TUR_SES_DIZINI, dosya));
}
