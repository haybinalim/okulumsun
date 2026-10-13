/**
 * Öğretmen tanıtım sayfası üreticisi (plan v2 Adım 38 aşama 2, KG-52). `npm run ogretmen:sayfa [-- --kart]`
 *
 * `public/ogretmen/index.html` statik, uygulamadan bağımsız, betiksiz bir sayfadır. Renkler `src/design/tokens.ts`'ten,
 * sayılar `scripts/durum.ts` (`sayilariTopla`) ve `docs/tekil-soru-sayisi.json`'dan gelir — sayfada elle sayı yazılmaz.
 * Sayfa yalnız aynı kökenden kaynak yükler (font); analitik/izleyici/form yoktur. Karşılaştırmalı dil
 * `docs/konumlandirma.md`'ye dayanır; rakip markası anılmaz, "kanıtlandı" yazılmaz (`tanitimMetni.spec.ts`).
 * `--kart`: paylaşım kartı `public/ogretmen/kart.png` (1200×630) Playwright Chromium ile çizilir.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { COLOR } from '../src/design/tokens.ts';
import { sayilariTopla } from './durum.ts';

export interface SayfaVerisi {
  readonly kazanim: number;
  readonly beceri: number;
  readonly sablon: number;
  /** Ölçülmüş alt sınır (docs/tekil-soru-sayisi.json). */
  readonly tekilSoru: number;
  readonly surum: string;
}

/** Sayfada yazılan alt sınır: aşağı yuvarlanmış bin (66.381 → "66.000"). */
export function tekilSoruMetni(n: number): string {
  return (Math.floor(n / 1000) * 1000).toLocaleString('tr-TR');
}

export const OLGUNLUK = 'pilot';

const k = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function ogretmenSayfasiUret(v: SayfaVerisi): string {
  const durumBlogu = `<!-- durum:kazanim=${v.kazanim} durum:beceri=${v.beceri} durum:sablon=${v.sablon} durum:tekil_soru=${v.tekilSoru} -->`;
  const kartlar: readonly [string, string][] = [
    [
      'Bugünün seti',
      'En çok 4 etkinlik seçin, tahtada başlatın; sorular sırayla karışık gelir. Haftalık MEB planı bu haftanın etkinliklerini önerir.',
    ],
    [
      'Çalışma kâğıdı',
      'Aynı seçimden A4 çalışma kâğıdı ve cevap anahtarı; tarayıcıdan yazdırın ya da PDF olarak kaydedin.',
    ],
    [
      'Sınıf Turu',
      'Renkli takımlar sırayla soru çözer; yanlışta aynı takım yeniden dener, sonra sınıf birlikte çözer. Puan ve kazanan yok.',
    ],
    [
      'Keşif Masası',
      'Soru ve puan olmadan anlatım aracı: onluk çerçeve, nesneler, sayı doğrusu, terazi, ayır-birleştir. Dokundukça sayı sesli söylenir.',
    ],
  ];
  const sss: readonly [string, string][] = [
    [
      'Neden kazanan yok?',
      "Birinci sınıfta sıralama, yavaş çözen çocuğu oyundan koparır. Sınıf Turu'nda her tur ortak bir kavanoza yaprak ekler; takımlar birbirine karşı değil, birlikte ilerler.",
    ],
    [
      'Neden öğrenci hesabı ya da ödev takibi yok?',
      'Çünkü çocuktan veri almıyoruz. Öğretmenin işine yarayan kısmı hesapsız sunuyoruz: bugünün seti, çalışma kâğıdı ve haftalık plan.',
    ],
    [
      'İnternet gerekir mi?',
      'İlk açılışta uygulama tahtanın tarayıcısına iner; sonra internet olmadan da çalışır. Çalışırken hiçbir yere veri gönderilmez.',
    ],
    [
      'Hangi tahtalarda denendi?',
      'Henüz fiziksel bir akıllı tahtada sınıf denemesi yapılmadı. Ekran yerleşimi her değişiklikte 1920×1080 tahta ve tablet taklidinde otomatik denetleniyor; ilk sınıf denemeleri planlanıyor.',
    ],
    [
      'Yapay zekâ kullanıyor mu?',
      'Çalışırken hayır. Sorular, sesler ve görseller önceden hazırlanır; geliştirme sırasında yapay zekâ ile taslak hazırlansa bile her içerik insan tarafından incelenmeden uygulamaya girmez.',
    ],
    [
      'Kim yapıyor, nasıl iletişim kurarım?',
      'Okulumsun bağımsız bir geliştirici projesidir. İletişim adresi bu sayfa yayımlanmadan önce buraya eklenecek. Sayfada form yok.',
    ],
  ];
  const adimlar = [
    'Tahtanın tarayıcısında okulumsun adresini açın.',
    '"Tahtada birlikte çalışalım" seçin; öğretmen alanına "Öğretmen" düğmesinden girin.',
    'Bugünün setini hazırlayın ya da haftalık planda bu haftaya dokunun.',
  ];
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Okulumsun — öğretmenler için</title>
<meta name="description" content="1. sınıf matematik — akıllı tahta için, hesapsız ve ücretsiz.">
<meta name="referrer" content="no-referrer">
<meta property="og:title" content="Okulumsun — 1. sınıf matematik, akıllı tahta için">
<meta property="og:description" content="Hesapsız ve ücretsiz. Çocuktan veri almaz.">
<meta property="og:image" content="kart.png">
<link rel="icon" href="../favicon.svg" type="image/svg+xml">
${durumBlogu}
<style>
@font-face{font-family:'Andika';src:url('../fonts/Andika-Regular-latin.woff2') format('woff2');font-weight:400;font-display:swap;unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+2000-206F,U+20BA}
@font-face{font-family:'Andika';src:url('../fonts/Andika-Regular-latin-ext.woff2') format('woff2');font-weight:400;font-display:swap;unicode-range:U+0100-02BA,U+1E00-1E9F,U+20A0-20AB,U+20AD-20C0}
@font-face{font-family:'Andika';src:url('../fonts/Andika-Bold-latin.woff2') format('woff2');font-weight:700;font-display:swap;unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+2000-206F,U+20BA}
@font-face{font-family:'Andika';src:url('../fonts/Andika-Bold-latin-ext.woff2') format('woff2');font-weight:700;font-display:swap;unicode-range:U+0100-02BA,U+1E00-1E9F,U+20A0-20AB,U+20AD-20C0}
:root{--bg:${COLOR.bg};--yuzey:${COLOR.surface};--murekkep:${COLOR.ink};--murekkep-acik:${COLOR.inkSoft};--kenar:${COLOR.border};--dogru:${COLOR.correct};--dogru-acik:${COLOR.correctSoft};--odak:${COLOR.focus};--maskot:${COLOR.mascot}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--murekkep);font-family:'Andika',system-ui,sans-serif;font-size:19px;line-height:1.55}
main{max-width:960px;margin:0 auto;padding:32px 20px 64px}
h1{font-size:2rem;line-height:1.2;margin:.2em 0 .3em}
h2{font-size:1.4rem;margin:2em 0 .6em}
.etiket{display:inline-block;border:2px solid var(--maskot);color:var(--murekkep);border-radius:999px;padding:2px 12px;font-size:.85rem;font-weight:700}
.alt{color:var(--murekkep-acik);margin:0}
.kartlar{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}
.kart{background:var(--yuzey);border:2px solid var(--kenar);border-radius:16px;padding:18px}
.kart h3{margin:0 0 .4em;font-size:1.15rem}
.kart p{margin:0}
.veri{background:var(--dogru-acik);border:2px solid var(--dogru);border-radius:16px;padding:18px}
.sayilar{display:flex;flex-wrap:wrap;gap:12px;padding:0;list-style:none}
.sayilar li{background:var(--yuzey);border:2px solid var(--kenar);border-radius:12px;padding:10px 16px}
.sayilar b{font-size:1.3rem}
.ac{display:inline-block;margin-top:12px;background:var(--murekkep);color:var(--yuzey);text-decoration:none;font-weight:700;border-radius:14px;padding:14px 26px}
a:focus-visible{outline:4px solid var(--odak);outline-offset:3px}
dt{font-weight:700;margin-top:1em}
dd{margin:.2em 0 0}
footer{margin-top:3em;color:var(--murekkep-acik);font-size:.9rem}
</style>
</head>
<body>
<main>
<header>
<span class="etiket">${k(OLGUNLUK)} · v${k(v.surum)}</span>
<h1>1. sınıf matematik — akıllı tahta için, hesapsız ve ücretsiz</h1>
<p class="alt">Tek tahta yeter; öğrencinin cihazı gerekmez. Çalışma kâğıtları dâhil her şey koşulsuz ücretsiz.</p>
<a class="ac" href="../">Uygulamayı aç</a>
</header>

<section aria-labelledby="araclar">
<h2 id="araclar">Derste üç araç</h2>
<div class="kartlar">
${kartlar.map(([b, m]) => `<article class="kart"><h3>${k(b)}</h3><p>${k(m)}</p></article>`).join('\n')}
</div>
<p><a href="../kagitlar/">Hazır çalışma kâğıtları: her kazanım için cevap anahtarlı A4 PDF</a></p>
</section>

<section aria-labelledby="nasil">
<h2 id="nasil">Nasıl açılır?</h2>
<ol>
${adimlar.map((a) => `<li>${k(a)}</li>`).join('\n')}
</ol>
<p class="alt">Tahta tanınmazsa: öğretmen alanında "Ekran boyutu" → "Akıllı tahta" seçin; seçim o tahtada hatırlanır.</p>
</section>

<section aria-labelledby="veri">
<h2 id="veri">Veri almıyoruz</h2>
<div class="veri">
<p><b>Çocuğun adı, sesi, fotoğrafı, cevapları ve ilerlemesi hiçbir yere gönderilmez ve saklanmaz.</b> Hesap, çerez, reklam ve izleyici yok. Tahtada yalnız bir ayar kalır: ekran boyutu tercihi.</p>
<p>Çalışma anında yapay zekâ ve veri yok. EBA'nın yerine değil, yanında açılan bir ders aracıdır.</p>
<p><a href="../gizlilik/">Gizlilik ayrıntıları ve kendiniz nasıl doğrularsınız</a></p>
</div>
</section>

<section aria-labelledby="icerik">
<h2 id="icerik">İçerik</h2>
<ul class="sayilar">
<li><b>${v.kazanim}</b> MEB kazanımı (2024 programı, 1. sınıf matematik)</li>
<li><b>${v.beceri}</b> beceri</li>
<li><b>${v.sablon}</b> soru türü</li>
<li><b>${tekilSoruMetni(v.tekilSoru)}+</b> farklı soru (ölçülmüş alt sınır)</li>
</ul>
<p class="alt">Sorular her açılışta yeniden üretilir; "farklı soru" sayısı, tohum, yerleşim, renk ve şık sırası farkını saymayan temkinli bir ölçümdür.</p>
</section>

<section aria-labelledby="sss">
<h2 id="sss">Sık sorulanlar</h2>
<dl>
${sss.map(([s, c]) => `<dt>${k(s)}</dt><dd>${k(c)}</dd>`).join('\n')}
</dl>
</section>

<footer>
<p>Okulumsun v${k(v.surum)} · olgunluk: ${k(OLGUNLUK)}. Bu sayfa bir dosyadır; dış kaynak yüklemez.</p>
</footer>
</main>
</body>
</html>
`;
}

/** `fontUrl(dosya)`: kart sayfası about:blank'ta çizilir; fontlar data: URL olarak gömülür (file:// engellenir). */
export function kartHtml(v: SayfaVerisi, fontUrl: (dosya: string) => string): string {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><style>
@font-face{font-family:'Andika';src:url('${fontUrl('Andika-Bold-latin.woff2')}') format('woff2');font-weight:700}
@font-face{font-family:'Andika';src:url('${fontUrl('Andika-Bold-latin-ext.woff2')}') format('woff2');font-weight:700;unicode-range:U+0100-02BA}
@font-face{font-family:'Andika';src:url('${fontUrl('Andika-Regular-latin.woff2')}') format('woff2');font-weight:400}
@font-face{font-family:'Andika';src:url('${fontUrl('Andika-Regular-latin-ext.woff2')}') format('woff2');font-weight:400;unicode-range:U+0100-02BA}
html,body{margin:0;width:1200px;height:630px;background:${COLOR.bg};color:${COLOR.ink};font-family:'Andika',sans-serif}
.k{box-sizing:border-box;width:1200px;height:630px;padding:72px 80px;display:flex;flex-direction:column;justify-content:center;gap:28px;border-bottom:24px solid ${COLOR.mascot}}
h1{font-size:76px;line-height:1.1;margin:0}
p{font-size:40px;margin:0;color:${COLOR.inkSoft}}
.e{font-size:30px;font-weight:700;border:3px solid ${COLOR.mascot};border-radius:999px;padding:4px 20px;align-self:flex-start}
</style></head><body><div class="k"><span class="e">okulumsun · ${k(OLGUNLUK)}</span>
<h1>1. sınıf matematik<br>akıllı tahta için</h1>
<p>Hesapsız ve ücretsiz · ${v.kazanim} kazanım · ${tekilSoruMetni(v.tekilSoru)}+ farklı soru</p></div></body></html>`;
}

export async function sayfaVerisi(kok: string): Promise<SayfaVerisi> {
  const s = await sayilariTopla(kok);
  const t = JSON.parse(readFileSync(path.join(kok, 'docs/tekil-soru-sayisi.json'), 'utf8')) as { toplam: number };
  return { kazanim: s.kazanim, beceri: s.beceri, sablon: s.sablonDefter, tekilSoru: t.toplam, surum: s.surum };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const kok = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const v = await sayfaVerisi(kok);
  mkdirSync(path.join(kok, 'public/ogretmen'), { recursive: true });
  writeFileSync(path.join(kok, 'public/ogretmen/index.html'), ogretmenSayfasiUret(v));
  console.log('public/ogretmen/index.html yazıldı.');
  if (process.argv.includes('--kart')) {
    const { chromium } = await import('@playwright/test');
    const tarayici = await chromium.launch();
    const sayfa = await tarayici.newPage({ viewport: { width: 1200, height: 630 } });
    const fontUrl = (d: string) =>
      `data:font/woff2;base64,${readFileSync(path.join(kok, 'public/fonts', d)).toString('base64')}`;
    await sayfa.setContent(kartHtml(v, fontUrl), { waitUntil: 'load' });
    await sayfa.evaluate(() => document.fonts.ready);
    await sayfa.screenshot({ path: path.join(kok, 'public/ogretmen/kart.png') });
    await tarayici.close();
    console.log('public/ogretmen/kart.png yazıldı.');
  }
}
