/**
 * DERS VERİSİ — JS DIŞI VARLIKLAR (ADR-0016; Okuma Yazma planı Adım 61).
 *
 * Türkçe ders verisi (içerik JSON'u; ileride statik SVG, ses manifesti) depoda `ders-verisi/tur/` altında durur,
 * `public/` altında DEĞİL — `public/` her derlemeye ve precache'e kopyalanırdı. Bu eklenti veriyi YALNIZ
 * `VITE_DERS_TUR=1` derlemesinde `dist/tur/` altına yayar; geliştirme sunucusunda aynı `/tur/` yolundan sunar.
 * Bayrak kapalıyken hiçbir şey yapmaz: üretim `dist/` bayt bayt aynı kalır. `README.md` yayılmaz.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

export const DERS_VERISI_KOKU = 'ders-verisi/tur';
export const DERS_VERISI_YAYIN_YOLU = 'tur';

/** Yayılacak dosyalar (köke göre, `/` ayırıcılı, sıralı). README ve gizli dosyalar hariç. */
export function dersVerisiDosyalari(kok: string): string[] {
  const dizin = path.join(kok, DERS_VERISI_KOKU);
  if (!existsSync(dizin)) return [];
  const sonuc: string[] = [];
  const gez = (alt: string): void => {
    for (const ad of readdirSync(path.join(dizin, alt)).sort()) {
      if (ad.startsWith('.') || ad === 'README.md') continue;
      const goreli = alt ? `${alt}/${ad}` : ad;
      if (statSync(path.join(dizin, goreli)).isDirectory()) gez(goreli);
      else sonuc.push(goreli);
    }
  };
  gez('');
  return sonuc;
}

const ICERIK_TURLERI: Readonly<Record<string, string>> = {
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.m4a': 'audio/mp4',
};

export function dersVerisi(): Plugin {
  let kok = process.cwd();
  let acik = false;
  return {
    name: 'okulumsun:ders-verisi',
    configResolved(c) {
      kok = c.root;
      acik = c.env.VITE_DERS_TUR === '1';
    },
    configureServer(server) {
      if (!acik) return;
      server.middlewares.use(`/${DERS_VERISI_YAYIN_YOLU}/`, (istek, yanit, sonraki) => {
        const goreli = decodeURIComponent((istek.url ?? '').split('?')[0]).replace(/^\/+/, '');
        if (!dersVerisiDosyalari(kok).includes(goreli)) return sonraki();
        yanit.setHeader('Content-Type', ICERIK_TURLERI[path.extname(goreli)] ?? 'application/octet-stream');
        yanit.end(readFileSync(path.join(kok, DERS_VERISI_KOKU, goreli)));
      });
    },
    generateBundle() {
      if (!acik) return;
      for (const goreli of dersVerisiDosyalari(kok)) {
        this.emitFile({
          type: 'asset',
          fileName: `${DERS_VERISI_YAYIN_YOLU}/${goreli}`,
          source: readFileSync(path.join(kok, DERS_VERISI_KOKU, goreli)),
        });
      }
    },
  };
}
