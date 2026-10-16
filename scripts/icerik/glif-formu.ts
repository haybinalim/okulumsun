/**
 * Rakam glifleri öğretmen görüş formu üreticisi (plan v2 Adım 30).
 *
 *   npm run glif:formu -- --cikti cikti/rakam-glifleri-formu.pdf [--html x.html] [--ogretmen 2]
 *
 * Gerçek `RAKAM_GLIFLERI` path verisinden A4, Türkçe, yazdırılabilir bir form
 * üretir: her rakam ızgaralı/çizgili zemin üstünde MEB Kılavuz glifiyle (numaralı
 * yazım yönü okları dahil, TemelYazi-Kilavuz, KG-95) büyük çizilir; yanında Uygun / Küçük düzeltme /
 * Yanlış kutuları ve not satırları; sonda unvan, okul türü (isteğe bağlı),
 * tarih, ad izni ve imza. Her öğretmen için ayrı sayfa takımı.
 *
 * PDF için WeasyPrint gerekir (geliştirici makinesi; `pip install weasyprint`).
 * Yol `WEASYPRINT` ortam değişkeniyle verilebilir. Ağ kullanmaz; kişisel veri yok.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { COLOR } from '../../src/design/tokens';
import { RAKAM_GLIFLERI, type RakamGlifi } from '../../src/ui/svg/rakamGlifleri';
import { RAKAM_KILAVUZ_YOLLARI } from '../../src/ui/svg/rakamKilavuzYollari';
/** Sayfa başına rakamlar: 1. sayfada açıklama var, son sayfada imza bölümü. */
const SAYFA_DUZENI: readonly (readonly number[])[] = [[0, 1, 2], [3, 4, 5, 6], [7, 8, 9]];

function kacis(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function glifSvg(glif: RakamGlifi): string {
  const izgara = Array.from({ length: 11 }, (_, i) =>
    `<line x1="${i * 10}" y1="0" x2="${i * 10}" y2="100"/><line x1="0" y1="${i * 10}" x2="100" y2="${i * 10}"/>`,
  ).join('');
  // MEB Kılavuz glifi: gövde + numaralı yazım yönü okları (TemelYazi-Kilavuz, KG-95).
  const kilavuz = RAKAM_KILAVUZ_YOLLARI[glif.rakam] ?? glif.path;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -8 116 116" class="glif">
    <rect x="-8" y="-8" width="116" height="116" fill="#FFFFFF"/>
    <g stroke="#E5E7EB" stroke-width="0.35">${izgara}</g>
    <line x1="0" y1="15" x2="100" y2="15" stroke="#9CA3AF" stroke-width="0.6"/>
    <line x1="0" y1="50" x2="100" y2="50" stroke="#9CA3AF" stroke-width="0.6" stroke-dasharray="3 2"/>
    <line x1="0" y1="85" x2="100" y2="85" stroke="#9CA3AF" stroke-width="0.6"/>
    <path d="${kilavuz}" fill="${COLOR.ink}"/>
  </svg>`;
}

function rakamSatiri(glif: RakamGlifi): string {
  const sira = glif.yazimSirasi.map((t) => `<li>${kacis(t)}</li>`).join('');
  return `<section class="satir">
    <div class="sol">${glifSvg(glif)}</div>
    <div class="sag">
      <h3>Rakam ${glif.rakam}</h3>
      <p class="kucuk etiket">MEB yazım yönü (numaralı oklar):</p>
      <ol class="kucuk">${sira}</ol>
      <p class="kutular"><span>☐ Uygun</span><span>☐ Küçük düzeltme</span><span>☐ Yanlış</span></p>
      <p class="kucuk">Not / düzeltme önerisi:</p>
      <div class="cizgi"></div><div class="cizgi"></div>
    </div>
  </section>`;
}

function aciklama(): string {
  return `<div class="aciklama">
    <p><strong>Okulumsun</strong>, 1. sınıf matematik dersi için geliştirilen bir eğitim uygulamasıdır. Ekranda rakamlar
    MEB'in Türkiye Yüzyılı Maarif Modeli (2024) için yayımladığı <strong>TemelYazi</strong> fontundan alınmıştır. Bu formda
    uygulamadaki <strong>0–9 rakamlarının ve yazım yönlerinin sınıfta öğrettiğiniz biçimle aynı olup olmadığını</strong> soruyoruz.</p>
    <ul>
      <li>Her rakam için bir kutu işaretleyin. “Küçük düzeltme” veya “Yanlış” ise nota kısaca nedenini yazın;
      dilerseniz doğru biçimi rakamın üstüne kalemle çizin.</li>
      <li>Zemindeki çizgiler: üst çizgi, orta çizgi (kesikli), taban çizgisi. <strong>Kesikli ok ve numara</strong>
      MEB kılavuz fontundaki gibi yazım yönünü ve hamle sırasını gösterir.</li>
      <li>Sınıfta farklı bir kaynak (ders kitabı, kılavuz) kullanıyorsanız adını/yılını son sayfaya yazmanız bize çok yardımcı olur.</li>
    </ul>
    <p class="kucuk">Kişisel veri toplanmaz; form yalnız görüşünüzü içerir. Adınız yalnız izin verirseniz yazılır.</p>
  </div>`;
}

function imzaBolumu(): string {
  return `<section class="imza">
    <h3>Genel görüş</h3>
    <div class="cizgi"></div><div class="cizgi"></div>
    <table>
      <tr><td class="alan">Unvan</td><td class="bos"></td></tr>
      <tr><td class="alan">Okul türü (isteğe bağlı)</td><td>☐ Devlet &nbsp;&nbsp; ☐ Özel &nbsp;&nbsp; ☐ Belirtmek istemiyorum</td></tr>
      <tr><td class="alan">Gösterdiğiniz kaynak (isteğe bağlı)</td><td class="bos"></td></tr>
      <tr><td class="alan">Tarih</td><td class="bos"></td></tr>
      <tr><td class="alan">Ad soyad (yalnız izin verirseniz)</td><td class="bos"></td></tr>
      <tr><td class="alan" colspan="2">☐ Görüş formunda adımın yazılmasına izin veriyorum.</td></tr>
      <tr><td class="alan">İmza</td><td class="bos imzayeri"></td></tr>
    </table>
  </section>`;
}

export function formHtml(ogretmenSayisi: number, surum: string): string {
  const glif = (r: number) => RAKAM_GLIFLERI.find((g) => g.rakam === r)!;
  const sayfalar: string[] = [];
  for (let o = 1; o <= ogretmenSayisi; o++) {
    SAYFA_DUZENI.forEach((rakamlar, i) => {
      const ilk = i === 0;
      const son = i === SAYFA_DUZENI.length - 1;
      sayfalar.push(`<div class="sayfa">
        <header><span>Okulumsun · Rakam glifleri öğretmen görüş formu</span><span>Öğretmen ${o} kopyası · Sayfa ${i + 1}/${SAYFA_DUZENI.length}</span></header>
        ${ilk ? `<h1>Rakam glifleri: MEB TemelYazi formu ve yazım yönü</h1>${aciklama()}` : ''}
        ${rakamlar.map((r) => rakamSatiri(glif(r))).join('')}
        ${son ? imzaBolumu() : ''}
      </div>`);
    });
  }
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Okulumsun · Rakam glifleri öğretmen formu</title>
<style>
  @page { size: A4; margin: 11mm 14mm 14mm; @bottom-left { content: 'Glif verisi: MEB TYMM TemelYazi (KG-95) · ${kacis(surum)}'; font-family: 'DejaVu Sans', sans-serif; font-size: 7pt; color: #6B7280; } }
  * { box-sizing: border-box; }
  body { font-family: 'DejaVu Sans', sans-serif; color: #1F2937; font-size: 10pt; margin: 0; }
  .sayfa { page-break-after: always; }
  .sayfa:last-child { page-break-after: auto; }
  header { display: flex; justify-content: space-between; font-size: 8pt; color: #4B5563; border-bottom: 0.4pt solid #9CA3AF; padding-bottom: 2mm; margin-bottom: 4mm; }
  h1 { font-size: 15pt; margin: 0 0 3mm; }
  h3 { font-size: 13pt; margin: 0 0 1.5mm; }
  .aciklama { font-size: 9.5pt; line-height: 1.4; background: #F3F4F6; border-radius: 2mm; padding: 3mm 4mm; margin-bottom: 4mm; }
  .aciklama p, .aciklama ul { margin: 1mm 0; }
  .aciklama ul { padding-left: 5mm; }
  .satir { display: flex; gap: 6mm; border: 0.5pt solid #D1D5DB; border-radius: 2mm; padding: 2.5mm 3mm; margin-bottom: 3mm; page-break-inside: avoid; }
  .sol { flex: 0 0 46mm; }
  .glif { width: 46mm; height: 46mm; display: block; }
  .sag { flex: 1; }
  .kucuk { font-size: 8.5pt; margin: 0.5mm 0; }
  .etiket { color: #4B5563; }
  ol.kucuk { padding-left: 5mm; margin: 0.5mm 0 2mm; color: #374151; }
  .kutular { font-size: 11.5pt; margin: 2mm 0; }
  .kutular span { margin-right: 6mm; white-space: nowrap; }
  .cizgi { border-bottom: 0.5pt solid #6B7280; height: 6.5mm; }
  .imza { border: 0.8pt solid #374151; border-radius: 2mm; padding: 3mm 4mm; page-break-inside: avoid; }
  .imza table { width: 100%; border-collapse: collapse; margin-top: 3mm; font-size: 10pt; }
  .imza td { padding: 1.3mm 0; vertical-align: bottom; }
  .imza td.alan { width: 72mm; }
  .imza td.bos { border-bottom: 0.5pt solid #6B7280; }
  .imza td.imzayeri { height: 12mm; }
</style></head><body>${sayfalar.join('')}</body></html>`;
}

function arg(ad: string): string | undefined {
  const i = process.argv.indexOf(ad);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function surumKimligi(): string {
  try {
    return `commit ${execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim()}`;
  } catch {
    return 'commit bilinmiyor';
  }
}

if (process.argv[1] && resolve(process.argv[1]).endsWith(join('scripts', 'icerik', 'glif-formu.ts'))) {
  const cikti = resolve(arg('--cikti') ?? 'cikti/rakam-glifleri-formu.pdf');
  const ogretmen = Number(arg('--ogretmen') ?? 2);
  const html = formHtml(ogretmen, surumKimligi());
  const htmlYolu = arg('--html') ? resolve(arg('--html')!) : join(mkdtempSync(join(tmpdir(), 'glif-')), 'form.html');
  mkdirSync(dirname(htmlYolu), { recursive: true });
  writeFileSync(htmlYolu, html);
  mkdirSync(dirname(cikti), { recursive: true });
  const weasy = process.env.WEASYPRINT ?? 'weasyprint';
  try {
    execFileSync(weasy, [htmlYolu, cikti], { stdio: 'inherit' });
  } catch (e) {
    console.error(`WeasyPrint çalıştırılamadı (${weasy}). Kurulum: pip install weasyprint. HTML: ${htmlYolu}`);
    throw e;
  }
  console.log(`Form üretildi: ${cikti} (${ogretmen} öğretmen × ${SAYFA_DUZENI.length} sayfa)`);
}
