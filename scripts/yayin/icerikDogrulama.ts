/**
 * İÇERİK DOĞRULAMA — DERLEME ZAMANI (plan v2 KG-87, K5 boyut bütçesi).
 *
 * Uygulama içerik JSON'larını (beceri grafı, kazanımlar, plan düzeltmeleri, ev ipuçları) eskiden açılışta zod
 * ile ayrıştırıyordu; zod (~69 KB) bu yüzden üretim paketindeydi. Bu Vite eklentisi aynı ayrıştırıcıları
 * Node'da, dosya modül olarak yüklenirken çalıştırır ve modüle AYRIŞTIRILMIŞ veriyi (varsayılanlar
 * doldurulmuş, tanımsız alanlar atılmış) verir. Bozuk veri derlemeyi ve geliştirme sunucusunu kırar;
 * uygulama aynı veriyi zod'suz alır (davranış aynı). Vitest de bu eklentiyle koşar.
 */
import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';
import { kazanimlariDogrula } from '../../src/content/schema/kazanim.ts';
import { skillGrafiniAyristir } from '../../src/content/schema/skill.ts';
import { PlanDuzeltmeleriSchema } from '../../src/content/schema/haftalikPlan.ts';
import { EvIpuclariSchema } from '../../src/content/schema/evIpucu.ts';

/** Dosya adı (src/content/ altında) → ayrıştırıcı. */
export const ICERIK_AYRISTIRICILARI: Readonly<Record<string, (veri: unknown) => unknown>> = {
  'skills.json': skillGrafiniAyristir,
  'kazanimlar.json': kazanimlariDogrula,
  'planDuzeltmeleri.json': (v) => PlanDuzeltmeleriSchema.parse(v),
  'evIpuclari.json': (v) => EvIpuclariSchema.parse(v),
};

const ICERIK_DOSYASI = /[\\/]src[\\/]content[\\/]([^\\/]+\.json)$/;

/** Ayrıştırılacak içerik dosyasıysa adı, değilse `null`. */
export function icerikDosyasi(id: string): string | null {
  const ad = ICERIK_DOSYASI.exec(id.split('?')[0])?.[1];
  return ad && ad in ICERIK_AYRISTIRICILARI ? ad : null;
}

export function icerikDogrulama(): Plugin {
  return {
    name: 'okulumsun:icerik-dogrulama',
    enforce: 'pre',
    load(id) {
      const ad = icerikDosyasi(id);
      if (!ad) return null;
      const yol = id.split('?')[0];
      this.addWatchFile(yol);
      // JSON metni döner; Vite'ın JSON eklentisi onu modüle çevirir.
      return JSON.stringify(ICERIK_AYRISTIRICILARI[ad](JSON.parse(readFileSync(yol, 'utf8'))));
    },
  };
}
