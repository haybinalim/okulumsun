/**
 * İÇERİK DOĞRULAMA — DERLEME ZAMANI (plan v2 KG-87, K5 boyut bütçesi).
 *
 * Uygulama içerik JSON'larını (beceri grafı, kazanımlar, plan düzeltmeleri, ev ipuçları, maskot hikâyeleri) eskiden açılışta zod
 * ile ayrıştırıyordu; zod (~69 KB) bu yüzden üretim paketindeydi. Bu Vite eklentisi aynı ayrıştırıcıları
 * Node'da, dosya modül olarak yüklenirken çalıştırır ve modüle AYRIŞTIRILMIŞ veriyi (varsayılanlar
 * doldurulmuş, tanımsız alanlar atılmış) verir. Bozuk veri derlemeyi ve geliştirme sunucusunu kırar;
 * uygulama aynı veriyi zod'suz alır (davranış aynı). Vitest de bu eklentiyle koşar.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Plugin } from 'vite';
import { tsImport } from 'tsx/esm/api';

type Ayristirici = (veri: unknown) => unknown;

/** Dosya adı (src/content/ altında) → şema modülü ve ayrıştırıcı. */
const KAYNAKLAR: Readonly<Record<string, { modul: string; sec: (m: Record<string, unknown>) => Ayristirici }>> = {
  'skills.json': { modul: 'skill.ts', sec: (m) => m.skillGrafiniAyristir as Ayristirici },
  'kazanimlar.json': { modul: 'kazanim.ts', sec: (m) => m.kazanimlariDogrula as Ayristirici },
  'planDuzeltmeleri.json': {
    modul: 'haftalikPlan.ts',
    sec: (m) => (v) => (m.PlanDuzeltmeleriSchema as { parse: Ayristirici }).parse(v),
  },
  'evIpuclari.json': {
    modul: 'evIpucu.ts',
    sec: (m) => (v) => (m.EvIpuclariSchema as { parse: Ayristirici }).parse(v),
  },
  'maskotHikayeleri.json': {
    modul: 'maskotHikayesi.ts',
    sec: (m) => (v) => (m.MaskotHikayeleriSchema as { parse: Ayristirici }).parse(v),
  },
};

const ICERIK_DOSYASI = /[\\/]src[\\/]content[\\/]([^\\/]+\.json)$/;

/** Ayrıştırılacak içerik dosyasıysa adı, değilse `null`. */
export function icerikDosyasi(id: string): string | null {
  const ad = ICERIK_DOSYASI.exec(id.split('?')[0])?.[1];
  return ad && ad in KAYNAKLAR ? ad : null;
}

/**
 * Şema modülleri `tsx` ile yüklenir (statik içe aktarım vite.config tür denetimini uygulama koduna
 * taşırdı). Ayrıştırıcılar ilk kullanımda bir kez yüklenir.
 */
export function icerikDogrulama(): Plugin {
  let kok = process.cwd();
  const onbellek = new Map<string, Promise<Ayristirici>>();
  const ayristirici = (ad: string): Promise<Ayristirici> => {
    let p = onbellek.get(ad);
    if (!p) {
      const k = KAYNAKLAR[ad];
      const yol = pathToFileURL(path.join(kok, 'src/content/schema', k.modul)).href;
      p = tsImport(yol, pathToFileURL(path.join(kok, 'vite.config.ts')).href).then((m) =>
        k.sec(m as Record<string, unknown>),
      );
      onbellek.set(ad, p);
    }
    return p;
  };
  return {
    name: 'okulumsun:icerik-dogrulama',
    enforce: 'pre',
    configResolved(c) {
      kok = c.root;
    },
    async load(id) {
      const ad = icerikDosyasi(id);
      if (!ad) return null;
      const yol = id.split('?')[0];
      this.addWatchFile(yol);
      const ayristir = await ayristirici(ad);
      // JSON metni döner; Vite'ın JSON eklentisi onu modüle çevirir.
      return JSON.stringify(ayristir(JSON.parse(readFileSync(yol, 'utf8'))));
    },
  };
}
