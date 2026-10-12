import type { Page, Request } from '@playwright/test';
import { IZINLI_ANAHTARLAR } from '../../../src/persistence/depolamaIzinListesi';

/** Plan v2 Adım 26: ağ ve depolama gizlilik kanıtı için ortak denetçiler. */

export interface AgKaydi {
  readonly url: string;
  readonly method: string;
  readonly govde: string | null;
}

export function agKaydet(page: Page): { readonly istekler: AgKaydi[]; readonly soketler: string[] } {
  const istekler: AgKaydi[] = [];
  const soketler: string[] = [];
  page.on('request', (r: Request) => istekler.push({ url: r.url(), method: r.method(), govde: r.postData() }));
  page.on('websocket', (ws) => soketler.push(ws.url()));
  return { istekler, soketler };
}

/** Kökeni dışına giden, GET olmayan veya gövde taşıyan istekler (data:/blob: hariç). */
export function agIhlalleri(istekler: readonly AgKaydi[], koken: string): string[] {
  return istekler
    .filter((i) => !/^(data|blob):/.test(i.url))
    .flatMap((i) => {
      const sorunlar: string[] = [];
      if (new URL(i.url).origin !== koken) sorunlar.push(`başka köken: ${i.url}`);
      if (i.method !== 'GET') sorunlar.push(`${i.method}: ${i.url}`);
      if (i.govde) sorunlar.push(`gövdeli istek: ${i.url}`);
      return sorunlar;
    });
}

export interface DepolamaDurumu {
  readonly localStorage: string[];
  readonly sessionStorage: string[];
  readonly cerez: string;
  /** Veritabanı adı → nesne deposu → kayıt sayısı. */
  readonly indexedDB: Record<string, Record<string, number>>;
}

export async function depolamaDurumu(page: Page): Promise<DepolamaDurumu> {
  return page.evaluate(async () => {
    const indexedDBDurumu: Record<string, Record<string, number>> = {};
    for (const { name } of await indexedDB.databases()) {
      if (!name) continue;
      const db = await new Promise<IDBDatabase>((ok, hata) => {
        const r = indexedDB.open(name);
        r.onsuccess = () => ok(r.result);
        r.onerror = () => hata(r.error);
      });
      const depolar: Record<string, number> = {};
      for (const ad of Array.from(db.objectStoreNames)) {
        depolar[ad] = await new Promise<number>((ok, hata) => {
          const r = db.transaction(ad).objectStore(ad).count();
          r.onsuccess = () => ok(r.result);
          r.onerror = () => hata(r.error);
        });
      }
      db.close();
      indexedDBDurumu[name] = depolar;
    }
    return {
      localStorage: Object.keys(localStorage),
      sessionStorage: Object.keys(sessionStorage),
      cerez: document.cookie,
      indexedDB: indexedDBDurumu,
    };
  });
}

/** Öğrenciye ait hiçbir şey kalmamalı: izinli localStorage anahtarları, boş IndexedDB depoları. */
export function depolamaIhlalleri(d: DepolamaDurumu): string[] {
  const izinli = new Set(IZINLI_ANAHTARLAR.filter((a) => a.alan === 'localStorage').map((a) => a.anahtar));
  const sorunlar: string[] = [];
  for (const k of d.localStorage) if (!izinli.has(k)) sorunlar.push(`izinsiz localStorage anahtarı: ${k}`);
  for (const k of d.sessionStorage) sorunlar.push(`sessionStorage: ${k}`);
  if (d.cerez) sorunlar.push(`çerez: ${d.cerez}`);
  for (const [db, depolar] of Object.entries(d.indexedDB)) {
    if (db !== 'okulumsun') sorunlar.push(`beklenmeyen IndexedDB: ${db}`);
    for (const [depo, adet] of Object.entries(depolar)) if (adet > 0) sorunlar.push(`IndexedDB ${db}.${depo}: ${adet} kayıt`);
  }
  return sorunlar;
}
