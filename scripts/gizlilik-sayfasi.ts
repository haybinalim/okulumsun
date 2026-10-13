/**
 * Gizlilik kanıt sayfası ve KVKK beyanı taslağı üreticisi (plan v2 Adım 39 aşama 1, KG-53). `npm run gizlilik:sayfa`
 *
 * `public/gizlilik/index.html` ve `public/gizlilik/kvkk.html` statik, betiksiz sayfalardır; elle düzenlenmez.
 * Politika cümlesi `VERI_SAKLAMA_BILDIRIMI`'nden, cihazda kalan anahtarlar `IZINLI_ANAHTARLAR`'dan, CSP metni
 * `vercel.json`'dan, renkler `tokens.ts`'ten gelir — `gizlilikSayfasi.spec.ts` bunların birebir aynı kaldığını denetler.
 * KVKK metni hukuki görüş alınana kadar **taslak** etiketiyle kalır (plan v2 Adım 39 alt görev 3).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { COLOR } from '../src/design/tokens.ts';
import { IZINLI_ANAHTARLAR } from '../src/persistence/depolamaIzinListesi.ts';
import { VERI_SAKLAMA_BILDIRIMI } from '../src/persistence/veriSaklamaPolitikasi.ts';

export interface GizlilikVerisi {
  readonly csp: string;
  readonly surum: string;
}

const k = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const KVKK_TASLAK_ETIKETI = 'TASLAK — hukuki görüş alınmadı';

function sayfa(baslik: string, govde: string): string {
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${k(baslik)}</title>
<meta name="referrer" content="no-referrer">
<link rel="icon" href="../favicon.svg" type="image/svg+xml">
<style>
@font-face{font-family:'Andika';src:url('../fonts/Andika-Regular-latin.woff2') format('woff2');font-weight:400;font-display:swap;unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+2000-206F,U+20BA}
@font-face{font-family:'Andika';src:url('../fonts/Andika-Regular-latin-ext.woff2') format('woff2');font-weight:400;font-display:swap;unicode-range:U+0100-02BA,U+1E00-1E9F,U+20A0-20AB,U+20AD-20C0}
@font-face{font-family:'Andika';src:url('../fonts/Andika-Bold-latin.woff2') format('woff2');font-weight:700;font-display:swap;unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+2000-206F,U+20BA}
@font-face{font-family:'Andika';src:url('../fonts/Andika-Bold-latin-ext.woff2') format('woff2');font-weight:700;font-display:swap;unicode-range:U+0100-02BA,U+1E00-1E9F,U+20A0-20AB,U+20AD-20C0}
:root{--bg:${COLOR.bg};--yuzey:${COLOR.surface};--murekkep:${COLOR.ink};--murekkep-acik:${COLOR.inkSoft};--kenar:${COLOR.border};--dogru:${COLOR.correct};--dogru-acik:${COLOR.correctSoft};--uyari:${COLOR.retry};--uyari-acik:${COLOR.retrySoft};--odak:${COLOR.focus}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--murekkep);font-family:'Andika',system-ui,sans-serif;font-size:19px;line-height:1.55}
main{max-width:960px;margin:0 auto;padding:32px 20px 64px}
h1{font-size:2rem;line-height:1.2;margin:.2em 0 .3em}
h2{font-size:1.4rem;margin:2em 0 .6em}
.kutu{background:var(--dogru-acik);border:2px solid var(--dogru);border-radius:16px;padding:18px}
.taslak{background:var(--uyari-acik);border:2px solid var(--uyari);border-radius:16px;padding:12px 18px;font-weight:700}
.alt{color:var(--murekkep-acik)}
table{border-collapse:collapse;width:100%;background:var(--yuzey)}
th,td{border:2px solid var(--kenar);padding:8px 10px;text-align:left;vertical-align:top}
code,pre{font-family:ui-monospace,monospace;font-size:.85rem}
pre{white-space:pre-wrap;word-break:break-word;background:var(--yuzey);border:2px solid var(--kenar);border-radius:12px;padding:12px}
a:focus-visible{outline:4px solid var(--odak);outline-offset:3px}
footer{margin-top:3em;color:var(--murekkep-acik);font-size:.9rem}
</style>
</head>
<body>
<main>
${govde}
</main>
</body>
</html>
`;
}

export function gizlilikSayfasiUret(v: GizlilikVerisi): string {
  const toplanmaz = [
    'ad, soyad',
    'fotoğraf',
    'ses kaydı',
    'konum',
    'cevaplar',
    'ilerleme ve oturum geçmişi',
    'hesap, e-posta',
  ];
  const anahtarlar = IZINLI_ANAHTARLAR.map(
    (a) => `<tr><td><code>${k(a.anahtar)}</code></td><td>${k(a.alan)}</td><td>${k(a.gerekce)}</td></tr>`,
  ).join('\n');
  return sayfa(
    'Okulumsun — gizlilik',
    `<header>
<h1>Gizlilik: ne toplamıyoruz, nasıl doğrularsınız</h1>
<div class="kutu"><p><b>${k(VERI_SAKLAMA_BILDIRIMI)}</b></p>
<p>Hesap, çerez, reklam, analitik ve izleyici yok. Çalışırken yapay zekâ kullanılmaz.</p></div>
</header>

<section aria-labelledby="toplanmaz">
<h2 id="toplanmaz">Ne toplanmaz</h2>
<ul>
${toplanmaz.map((t) => `<li>${k(t)}</li>`).join('\n')}
</ul>
<p>Bu liste iki mod için de geçerlidir. <b>Tahta modu</b>: her koşulda sıfır öğrenci verisi; tahtada kim oynadığı bilinmez. <b>Kişisel mod</b>: avatar ve renk seçimi yalnız açık oturumda bellekte kalır, sayfa yenilenince silinir.</p>
</section>

<section aria-labelledby="cihaz">
<h2 id="cihaz">Cihazda ne kalır</h2>
<table>
<thead><tr><th scope="col">Anahtar</th><th scope="col">Yer</th><th scope="col">Neden</th></tr></thead>
<tbody>
${anahtarlar}
</tbody>
</table>
<p class="alt">Ayrıca tarayıcı, uygulamanın kendi dosyalarını (kod, ses, font, görsel) internetsiz çalışabilmek için önbelleğe alır; bunlar kişisel veri değildir ve herkeste aynıdır. IndexedDB'de boş bir <code>okulumsun</code> veritabanı görünebilir: önceki geliştirme sürümlerinden kalmış kayıtları silmek için açılır, içinde kayıt yoktur.</p>
</section>

<section aria-labelledby="ag">
<h2 id="ag">Ağ</h2>
<p>Uygulama yalnız kendi adresinden dosya indirir (kod, ses, font, görsel). Başka bir adrese istek gitmez; hiçbir istek veri göndermez. Tarayıcı bunu aşağıdaki güvenlik politikasıyla da zorlar.</p>
<pre aria-label="Content-Security-Policy">${k(v.csp)}</pre>
</section>

<section aria-labelledby="dogrula">
<h2 id="dogrula">Kendiniz doğrulayın (3 adım)</h2>
<ol>
<li><b>Ağ:</b> Tarayıcıda uygulamayı açın, geliştirici araçlarını açın (F12 ya da sağ tık → İncele), <i>Ağ</i> sekmesinde bir oturum boyunca başka bir alan adına istek gitmediğini görün.</li>
<li><b>Depolama:</b> <i>Uygulama</i> (Application) → <i>Depolama</i> bölümünde yerel depoda yalnız yukarıdaki tabloda yazan anahtarın olduğunu, çerez olmadığını görün.</li>
<li><b>Güvenlik politikası:</b> <i>Ağ</i> sekmesinde ilk belgeye tıklayın; <i>Yanıt başlıkları</i> içinde <code>Content-Security-Policy</code> satırının yukarıdakiyle aynı olduğunu görün.</li>
</ol>
<p class="alt">Aynı denetimler her değişiklikte otomatik testlerle de yapılır (tam oturum boyunca ağ istekleri ve depolama).</p>
</section>

<section aria-labelledby="kvkk">
<h2 id="kvkk">KVKK</h2>
<p><a href="kvkk.html">KVKK beyanı</a> (${k(KVKK_TASLAK_ETIKETI.toLocaleLowerCase('tr-TR'))}).</p>
</section>

<footer>
<p>Okulumsun v${k(v.surum)}. Bu sayfa bir dosyadır; dış kaynak yüklemez. <a href="../ogretmen/">Öğretmenler için</a> · <a href="../">Uygulamayı aç</a></p>
</footer>`,
  );
}

export function kvkkSayfasiUret(v: GizlilikVerisi): string {
  return sayfa(
    'Okulumsun — KVKK beyanı (taslak)',
    `<p class="taslak">${k(KVKK_TASLAK_ETIKETI)}. Bu metin bilgilendirme amaçlı bir taslaktır; hukukçu incelemesinden sonra kesinleşecektir.</p>
<h1>Kişisel verilerin korunması beyanı</h1>
<p>Okulumsun, 1. sınıf matematik için bir eğitim uygulamasıdır. Bu sürümde uygulama çalışırken <b>kişisel veri toplamaz, kaydetmez ve hiçbir yere aktarmaz</b>: ad, fotoğraf, ses, konum, cevap, ilerleme veya hesap bilgisi istenmez ve oluşturulmaz.</p>
<p>${k(VERI_SAKLAMA_BILDIRIMI)}</p>
<p>Cihazda yalnız ekran boyutu tercihi saklanır; bu bir cihaz ayarıdır ve bir kişiyle ilişkilendirilmez. Uygulama dosyaları internetsiz çalışma için tarayıcı önbelleğine alınır.</p>
<p>Bu nedenle 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında Okulumsun'un bu sürümü için kişisel veri işleme faaliyeti bulunmadığı değerlendirilmektedir. Bu değerlendirme hukuki görüşle doğrulanacaktır.</p>
<p>Öğrenci verisi saklayan bir özellik ileride eklenirse, eklenmeden önce ayrı bir aydınlatma metni yayımlanır ve gerekli izinler alınır.</p>
<p>İletişim: adres bu metin kesinleşmeden önce eklenecek.</p>
<footer><p>Okulumsun v${k(v.surum)} · <a href="./">Gizlilik</a></p></footer>`,
  );
}

export function gizlilikVerisi(kok: string): GizlilikVerisi {
  const vercel = JSON.parse(readFileSync(path.join(kok, 'vercel.json'), 'utf8')) as {
    headers: { source: string; headers: { key: string; value: string }[] }[];
  };
  const csp = vercel.headers.flatMap((h) => h.headers).find((h) => h.key === 'Content-Security-Policy')?.value;
  if (!csp) throw new Error('vercel.json içinde Content-Security-Policy yok.');
  const surum = (JSON.parse(readFileSync(path.join(kok, 'package.json'), 'utf8')) as { version: string }).version;
  return { csp, surum };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const kok = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const v = gizlilikVerisi(kok);
  mkdirSync(path.join(kok, 'public/gizlilik'), { recursive: true });
  writeFileSync(path.join(kok, 'public/gizlilik/index.html'), gizlilikSayfasiUret(v));
  writeFileSync(path.join(kok, 'public/gizlilik/kvkk.html'), kvkkSayfasiUret(v));
  console.log('public/gizlilik/index.html ve kvkk.html yazıldı.');
}
