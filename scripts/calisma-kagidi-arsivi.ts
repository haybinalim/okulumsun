/**
 * Çalışma kâğıdı arşivi üreticisi (plan v2 Adım 48 aşama 2, KG-70). `npm run build && npm run arsiv`
 *
 * Her arşiv kaydı (`src/ogretmen/calismaKagidi/arsiv.ts`: kâğıda girebilen hazır düğüm × sabit tohum) için
 * `vite preview` üstünde `?arsiv=<kâğıt kodu>` görünümü açılır ve A4 PDF basılır → `public/kagitlar/<kazanım>/<kod>-<tohum>.pdf`.
 * Ayrıca statik, betiksiz dizin sayfaları (`public/kagitlar/index.html`, `public/kagitlar/<kazanım>/index.html`) ve
 * `public/sitemap.xml` yazılır. Kanonik barındırıcının (Vercel) derlemesinde Chromium yoktur; çıktılar commitlenir
 * (öğretmen sayfası `kart.png` düzeni) ve `arsivDizini.spec.ts` tazeliklerini denetler.
 *
 * `--yalniz-dizin`: PDF basmadan yalnız dizin sayfalarını ve sitemap'i yazar (hızlı; içerik değişmediyse).
 * PDF'lerde tarih alanları sabitlenir; aynı Chromium sürümüyle aynı bayt.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { COLOR } from '../src/design/tokens.ts';
import { skillsData } from '../src/content/skillsData.ts';
import { KANONIK_YAYIN_ADRESI } from '../src/platform/kanonikKok.ts';
import { ARSIV_KOK_DIZINI, arsivKayitlari, kazanimDizini, type ArsivKaydi } from '../src/ogretmen/calismaKagidi/arsiv.ts';

export interface DizinDugumu {
  readonly skillId: string;
  readonly baslik: string;
  readonly childLabel: string;
}

export interface KazanimBilgisi {
  readonly kod: string;
  readonly metin: string;
}

const k = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const YANIT_ADI = { daireIcineAl: 'daire içine al', yazmaliOlabilir: 'yazmalı' } as const;

function sayfa(baslik: string, aciklama: string, fontKoku: string, govde: string): string {
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${k(baslik)}</title>
<meta name="description" content="${k(aciklama)}">
<meta name="referrer" content="no-referrer">
<link rel="icon" href="${fontKoku}favicon.svg" type="image/svg+xml">
<style>
@font-face{font-family:'Andika';src:url('${fontKoku}fonts/Andika-Regular-latin.woff2') format('woff2');font-weight:400;font-display:swap;unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+2000-206F,U+20BA}
@font-face{font-family:'Andika';src:url('${fontKoku}fonts/Andika-Regular-latin-ext.woff2') format('woff2');font-weight:400;font-display:swap;unicode-range:U+0100-02BA,U+1E00-1E9F,U+20A0-20AB,U+20AD-20C0}
@font-face{font-family:'Andika';src:url('${fontKoku}fonts/Andika-Bold-latin.woff2') format('woff2');font-weight:700;font-display:swap;unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+2000-206F,U+20BA}
@font-face{font-family:'Andika';src:url('${fontKoku}fonts/Andika-Bold-latin-ext.woff2') format('woff2');font-weight:700;font-display:swap;unicode-range:U+0100-02BA,U+1E00-1E9F,U+20A0-20AB,U+20AD-20C0}
*{box-sizing:border-box}
body{margin:0;background:${COLOR.bg};color:${COLOR.ink};font-family:'Andika',system-ui,sans-serif;font-size:19px;line-height:1.55}
main{max-width:960px;margin:0 auto;padding:32px 20px 64px}
h1{font-size:1.8rem;line-height:1.2;margin:.2em 0 .4em}
h2{font-size:1.25rem;margin:1.6em 0 .4em}
.alt{color:${COLOR.inkSoft};margin:0}
ul{padding-left:1.2em}
li{margin:.3em 0}
.kart{background:${COLOR.surface};border:2px solid ${COLOR.border};border-radius:16px;padding:14px 18px;margin:12px 0}
a{color:${COLOR.ink}}
a:focus-visible{outline:4px solid ${COLOR.focus};outline-offset:3px}
footer{margin-top:3em;color:${COLOR.inkSoft};font-size:.9rem}
</style>
</head>
<body>
<main>
${govde}
<footer><p>Okulumsun · MEB 2024 1. sınıf matematik. Kâğıtlar ücretsizdir; yazdırıp çoğaltabilirsiniz. Bu sayfa dış kaynak yüklemez.</p></footer>
</main>
</body>
</html>
`;
}

/** Dizin sayfaları: kökten göreli yol → HTML. Kayıt sırası (öğretim sırası) korunur. */
export function arsivDiziniUret(
  kayitlar: readonly ArsivKaydi[],
  dugumler: readonly DizinDugumu[],
  kazanimlar: readonly KazanimBilgisi[],
): Map<string, string> {
  const metin = new Map(kazanimlar.map((x) => [x.kod, x.metin]));
  const dugumBul = new Map(dugumler.map((d) => [d.skillId, d]));
  const kazanimSirasi = [...new Set(kayitlar.map((x) => x.kazanim))];
  const cikti = new Map<string, string>();

  const kokGovde = `<header>
<h1>1. sınıf matematik çalışma kâğıtları</h1>
<p class="alt">MEB 2024 programındaki her öğrenme çıktısı için hazır, A4, cevap anahtarlı PDF kâğıtlar. Her etkinliğin üç farklı kâğıdı vardır.</p>
<p><a href="../ogretmen/">Öğretmenler için okulumsun</a> · <a href="../">Uygulamayı aç</a></p>
</header>
<ul>
${kazanimSirasi
  .map((kod) => `<li><a href="${kazanimDizini(kod)}/">${k(kod)}</a> — ${k(metin.get(kod) ?? '')}</li>`)
  .join('\n')}
</ul>`;
  cikti.set(
    `${ARSIV_KOK_DIZINI}/index.html`,
    sayfa(
      'Çalışma kâğıtları — 1. sınıf matematik — Okulumsun',
      'MEB 2024 1. sınıf matematik öğrenme çıktılarına göre ücretsiz, cevap anahtarlı A4 çalışma kâğıtları (PDF).',
      '../',
      kokGovde,
    ),
  );

  for (const kod of kazanimSirasi) {
    const buKazanim = kayitlar.filter((x) => x.kazanim === kod);
    const dugumSirasi = [...new Set(buKazanim.map((x) => x.skillId))];
    const kartlar = dugumSirasi
      .map((id) => {
        const d = dugumBul.get(id);
        const ks = buKazanim.filter((x) => x.skillId === id);
        const baglantilar = ks
          .map((x, i) => `<li><a href="${path.posix.basename(x.yol)}">Kâğıt ${i + 1} (PDF)</a> · ${k(x.kagitKodu)}</li>`)
          .join('\n');
        return `<section class="kart">
<h2>${k(d?.childLabel ?? id)}</h2>
<p class="alt">${k(d?.baslik ?? '')} · 6 madde · yanıt: ${YANIT_ADI[ks[0].yanitTercihi]}</p>
<ul>
${baglantilar}
</ul>
</section>`;
      })
      .join('\n');
    const m = metin.get(kod) ?? '';
    cikti.set(
      `${ARSIV_KOK_DIZINI}/${kazanimDizini(kod)}/index.html`,
      sayfa(
        `${kod} çalışma kâğıtları — 1. sınıf matematik — Okulumsun`,
        `${kod} ${m} — ücretsiz, cevap anahtarlı A4 çalışma kâğıtları (PDF).`,
        '../../',
        `<header>
<p><a href="../">← Tüm kâğıtlar</a></p>
<h1>${k(kod)} çalışma kâğıtları</h1>
<p class="alt">${k(m)}</p>
</header>
${kartlar}`,
      ),
    );
  }
  return cikti;
}

/** `sitemap.xml`: tanıtım, gizlilik, arşiv dizinleri ve PDF'ler (kanonik adresle). */
export function sitemapUret(kok: string, kayitlar: readonly ArsivKaydi[]): string {
  const kazanimlar = [...new Set(kayitlar.map((x) => x.kazanim))];
  const yollar = [
    '',
    'ogretmen/',
    'gizlilik/',
    `${ARSIV_KOK_DIZINI}/`,
    ...kazanimlar.map((x) => `${ARSIV_KOK_DIZINI}/${kazanimDizini(x)}/`),
    ...kayitlar.map((x) => x.yol),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${yollar.map((y) => `  <url><loc>${k(`${kok}/${y}`)}</loc></url>`).join('\n')}
</urlset>
`;
}

/** Chromium PDF'sindeki tarih alanlarını sabitler (aynı girdi → aynı bayt). */
export function pdfTarihleriniSabitle(pdf: Buffer): Buffer {
  return Buffer.from(
    pdf
      .toString('latin1')
      .replace(/\/(CreationDate|ModDate) \(D:[^)]*\)/g, (_, alan: string) => `/${alan} (D:20260101000000Z)`),
    'latin1',
  );
}

export function arsivGirdileri(kok: string): {
  kayitlar: ArsivKaydi[];
  dugumler: DizinDugumu[];
  kazanimlar: KazanimBilgisi[];
} {
  const kz = JSON.parse(readFileSync(path.join(kok, 'src/content/kazanimlar.json'), 'utf8')) as {
    kazanimlar: { kod: string; resmiMetin: string }[];
  };
  return {
    kayitlar: arsivKayitlari(skillsData),
    dugumler: skillsData.map((d) => ({ skillId: d.id, baslik: d.baslik, childLabel: d.childLabel })),
    kazanimlar: kz.kazanimlar.map((x) => ({ kod: x.kod, metin: x.resmiMetin })),
  };
}

export function dizinVeSitemapYaz(kok: string): number {
  const { kayitlar, dugumler, kazanimlar } = arsivGirdileri(kok);
  for (const [yol, html] of arsivDiziniUret(kayitlar, dugumler, kazanimlar)) {
    mkdirSync(path.dirname(path.join(kok, 'public', yol)), { recursive: true });
    writeFileSync(path.join(kok, 'public', yol), html);
  }
  writeFileSync(path.join(kok, 'public/sitemap.xml'), sitemapUret(KANONIK_YAYIN_ADRESI, kayitlar));
  return kayitlar.length;
}

async function pdfleriBas(kok: string, kayitlar: readonly ArsivKaydi[]): Promise<void> {
  if (!existsSync(path.join(kok, 'dist/index.html'))) throw new Error('dist/ yok: önce `npm run build`.');
  const port = 4179;
  const sunucu = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], {
    cwd: kok,
    stdio: 'ignore',
  });
  try {
    const adres = `http://127.0.0.1:${port}`;
    for (let i = 0; ; i++) {
      try {
        if ((await fetch(adres)).ok) break;
      } catch {
        /* sunucu henüz açılmadı */
      }
      if (i > 100) throw new Error('vite preview açılmadı.');
      await new Promise((r) => setTimeout(r, 200));
    }
    const { chromium } = await import('@playwright/test');
    const tarayici = await chromium.launch();
    const sayfa = await tarayici.newPage();
    for (const [i, x] of kayitlar.entries()) {
      await sayfa.goto(`${adres}/?arsiv=${encodeURIComponent(x.kagitKodu)}`);
      await sayfa.waitForSelector('[data-arsiv-hazir]', { timeout: 20_000 });
      await sayfa.evaluate(() => document.fonts.ready);
      const pdf = await sayfa.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
      const hedef = path.join(kok, 'public', x.yol);
      mkdirSync(path.dirname(hedef), { recursive: true });
      writeFileSync(hedef, pdfTarihleriniSabitle(pdf));
      if ((i + 1) % 15 === 0) console.log(`${i + 1}/${kayitlar.length} PDF`);
    }
    await tarayici.close();
  } finally {
    sunucu.kill();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const kok = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const adet = dizinVeSitemapYaz(kok);
  console.log(`Dizin sayfaları ve public/sitemap.xml yazıldı (${adet} kâğıt).`);
  if (!process.argv.includes('--yalniz-dizin')) {
    const { kayitlar } = arsivGirdileri(kok);
    const sec = process.argv.find((a) => a.startsWith('--sinir='));
    await pdfleriBas(kok, sec ? kayitlar.slice(0, Number(sec.slice(8))) : kayitlar);
    console.log('PDF arşivi yazıldı.');
  }
}
