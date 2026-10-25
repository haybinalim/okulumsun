/**
 * Etki çalışması ölçme aracı (plan v2 Adım 53b, KG-93). `npx tsx scripts/etki-formu-uret.ts [--pdf]`
 *
 * `src/ogretmen/calismaKagidi/etkiFormu.ts` ile Form A (ön test) ve Form B (son test) üretilir ve
 * `docs/research/olcme-araci/README.md` yazılır: eşdeğerlik tablosu, madde listesi, cevap anahtarı, puanlama yönergesi.
 * Belge koddan türetilir; `tests/unit/etkiFormu.spec.ts` bayatlığını denetler.
 *
 * `--pdf` (önce `npm run build`): `vite preview` üstünde `?arsiv=ETKI-1-A|B` açılır ve A4 PDF basılır →
 * `docs/research/olcme-araci/etki-form-a.pdf`, `etki-form-b.pdf` (cevap anahtarı forma basılmaz; tarih alanları sabit).
 *
 * Öğrenci verisi yoktur; hiçbir yere gönderilmez.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { BASKI_BEYANI_IFADESI, sayfaUyusmazligi, type BaskiBeyani } from './denetim/pdfSayfa.ts';
import { skillsData } from '../src/content/skillsData.ts';
import {
  ETKI_DESENI,
  ETKI_FORM_TOHUMLARI,
  ETKI_KAZANIMLARI,
  ZORLUK_ADI,
  etkiFormlariUret,
  etkiFormuDagilimi,
  type EtkiFormuAdi,
  type EtkiFormuPlani,
  type ZorlukDuzeyi,
} from '../src/ogretmen/calismaKagidi/etkiFormu.ts';
import { kagitMetinOzeti } from '../src/ogretmen/calismaKagidi/arsiv.ts';
import { trDuzlestir } from '../src/ogretmen/calismaKagidi/sesMetni.ts';
import { pdfTarihleriniSabitle } from './calisma-kagidi-arsivi.ts';

export const OLCME_ARACI_DIZINI = 'docs/research/olcme-araci';
export const OLCME_ARACI_BELGESI = `${OLCME_ARACI_DIZINI}/README.md`;
export const FORM_PDF: Readonly<Record<EtkiFormuAdi, string>> = {
  A: `${OLCME_ARACI_DIZINI}/etki-form-a.pdf`,
  B: `${OLCME_ARACI_DIZINI}/etki-form-b.pdf`,
};

const YANIT_ADI = {
  daireIcineAl: 'daire içine al',
  kutuyaYaz: 'kutuya yaz',
  cizgiyleEsle: 'çizgiyle eşle',
  siraNumarasiYaz: 'sıra numarası yaz',
} as const;

const etiket = (skillId: string): string => skillsData.find((d) => d.id === skillId)?.childLabel ?? skillId;
const hucre = (s: string): string => s.replace(/\|/g, '\\|');

function maddeTablosu(plan: EtkiFormuPlani): string {
  const satirlar = plan.maddeler.map((m) => {
    const ifade = m.imzalar.map((s) => s.replace(/^kart:/, '')).join(' · ');
    return `| ${m.madde.no} | ${m.yuva.bolum} | ${hucre(etiket(m.yuva.skillId))} | ${m.madde.templateId} | ${m.zorluk} | ${hucre(m.madde.yonergeMetni)} | ${hucre(ifade)} | ${YANIT_ADI[m.madde.yanitBicimi]} | ${hucre(m.madde.cevap)} |`;
  });
  return [
    '| No | Bölüm | Etkinlik | Şablon | Zorluk | Öğretmenin okuyacağı yönerge | İşlem imzası | Yanıt | Cevap |',
    '|---|---|---|---|---|---|---|---|---|',
    ...satirlar,
  ].join('\n');
}

function ortalama(xs: readonly number[]): string {
  return (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1).replace('.', ',');
}

/** Ölçme aracı belgesinin tam metni (aynı kod → aynı metin). */
export function olcmeAraciBelgesi(tr: Readonly<Record<string, string>>): string {
  const formlar = etkiFormlariUret(tr);
  const { A, B } = formlar;
  const dA = etkiFormuDagilimi(A);
  const dB = etkiFormuDagilimi(B);
  const sablonlar = [...new Set(ETKI_DESENI.map((y) => y.templateId))];
  const sablonSatirlari = sablonlar.map((t) => {
    const duzeyler = ([1, 2, 3] as ZorlukDuzeyi[])
      .map((z) => `${z}: ${dA.sablonZorluk[`${t}|${z}`] ?? 0}/${dB.sablonZorluk[`${t}|${z}`] ?? 0}`)
      .join(' · ');
    return `| ${t} | ${dA.sablon[t] ?? 0} | ${dB.sablon[t] ?? 0} | ${duzeyler} |`;
  });
  const sonuclar = (p: EtkiFormuPlani) =>
    p.maddeler.map((m) => Math.max(...m.imzalar.flatMap((s) => (s.match(/\d+/g) ?? []).map(Number))));
  const kazanimSayisi = (p: EtkiFormuPlani, k: string) =>
    p.maddeler.filter((m) => m.madde.kazanimKodlari.includes(k as never)).length;

  return `# Etki çalışması — ölçme aracı (Form A / Form B)

> **TASLAK — içerik geçerliği onayı (2 sınıf öğretmeni + 1 alan uzmanı) ve çalışma dışı 3–5 çocukla ön deneme bekliyor.**
> Bu belge \`npx tsx scripts/etki-formu-uret.ts\` ile koddan üretilir; elle düzenlenmez (\`tests/unit/etkiFormu.spec.ts\`
> bayatlığı denetler). Plan v2 Adım 53b, KG-93. Hiçbir okula, MEM'e ya da veliye gönderilmedi.

## Formlar

| Form | Ne zaman | Kâğıt kodu | Tohum | Sayfa | Metin özeti |
|---|---|---|---|---|---|
| A | Ön test, 15–19 Mart 2027 | \`${A.kod}\` | ${ETKI_FORM_TOHUMLARI.A} | ${A.sayfalar.length} | \`${kagitMetinOzeti(A)}\` |
| B | Son test, 12–16 Nisan 2027 | \`${B.kod}\` | ${ETKI_FORM_TOHUMLARI.B} | ${B.sayfalar.length} | \`${kagitMetinOzeti(B)}\` |

- **Yazdırma:** uygulamada \`?arsiv=${A.kod}\` / \`?arsiv=${B.kod}\` adresi formu çizer (tarayıcıdan yazdır, A4, 2×3 düzen) veya
  \`npx tsx scripts/etki-formu-uret.ts --pdf\` iki PDF'yi bu dizine basar. Kâğıtta ad satırı yerine **Ç-kodu** satırı vardır;
  cevap anahtarı forma basılmaz (aşağıda).
- **Bölümler:** 1. bölüm (1–12, MAT.1.2.2) ve 2. bölüm (13–20, MAT.1.2.3–1.2.4) ayrı sayfadan başlar; ön test iki oturuma
  bölünecekse bölüm sınırından bölünür (protokol §5).
- Öğrenci verisi yoktur: form koddan yeniden üretilir, uygulama puan tutmaz; puanlama kâğıt üzerinde yapılır.

## Eşdeğerlik (Form A / Form B)

Zorluk düzeyi maddedeki toplama gerçeğinden (x + y = z; çıkarma z − y = x) hesaplanır: **1** = ${ZORLUK_ADI[1]} (z ≤ 10),
**2** = ${ZORLUK_ADI[2]} (z > 10, bir terim ≥ 10), **3** = ${ZORLUK_ADI[3]} (iki terim < 10, z > 10). İşlem kartlı
eşleme maddesinde kartların en zoru. Şablonun kendi zorluk alanı düğüme bağlı sabit olduğundan madde zorluğunu ayırmaz.

Her iki form aynı 20 yuvalık deseni sırayla doldurur: **her sıra numarasında düğüm, şablon ve zorluk düzeyi iki formda aynıdır.**

| Ölçüt | Form A | Form B |
|---|---|---|
| Madde | ${A.maddeler.length} | ${B.maddeler.length} |
| Zorluk 1 · 2 · 3 | ${dA.zorluk[1]} · ${dA.zorluk[2]} · ${dA.zorluk[3]} | ${dB.zorluk[1]} · ${dB.zorluk[2]} · ${dB.zorluk[3]} |
| ${ETKI_KAZANIMLARI.map((k) => k).join(' · ')} (madde) | ${ETKI_KAZANIMLARI.map((k) => kazanimSayisi(A, k)).join(' · ')} | ${ETKI_KAZANIMLARI.map((k) => kazanimSayisi(B, k)).join(' · ')} |
| Ortak madde (işlem imzası) | — | 0 |
| Maddede görünen en büyük sayı, ortalama (betimsel) | ${ortalama(sonuclar(A))} | ${ortalama(sonuclar(B))} |

| Şablon | Form A | Form B | Zorluk düzeyine göre (A/B) |
|---|---|---|---|
${sablonSatirlari.join('\n')}

Maddelerin bir kısmı ek olarak MAT.1.2.1'i de taşır (şablon beyanı); hiçbir madde müdahale haftalarının çıktıları dışında
kalmaz. "Zihinden bul" (MAT.1.2.2, M-TAHMIN-ISLEM) kâğıtta tahmin ile hesaplamayı ayıramadığı için forma girmez.
**Sınır:** eşdeğerlik yapısaldır (şablon + zorluk + sıra); ampirik eşdeğerlik (madde güçlüğü, KR-20) ön deneme ve
saha verisiyle raporlanır (ön kayıt §6).

## Form A — madde listesi (ön test)

${maddeTablosu(A)}

## Form B — madde listesi (son test)

${maddeTablosu(B)}

Harfli cevaplar kâğıttaki seçenek harfidir; eşlemede "1–B" = soldaki 1. kart sağdaki B kartıyla.

## Puanlama yönergesi

1. Puan = doğru madde sayısı (0–20). Her madde 1 puan; kısmi puan yok.
2. **Eşleme maddesi** (tersini yap) yalnız üç eşin üçü de doğruysa 1 puan.
3. Boş, birden çok seçenek işaretlenmiş veya okunamayan yanıt 0.
4. Kutuya yazılan sayı ters yazılmışsa (ör. "Ɛ") ama hangi rakam olduğu açıksa doğru sayılır; açık değilse iki puanlayıcı
   ayrı karar verir ve ayrılık üçüncü bakışla çözülür.
5. Test 10 maddeden azı yanıtlanmış hâlde bırakıldıysa o test **eksik** sayılır (ön kayıt §7 kural 3).
6. Puanlama iki kişiyle bağımsız; madde düzeyinde uyuşma oranı raporlanır. Puanlar yalnız Ç-kodlu tabloya yazılır (protokol §8).
7. Uygulama sırasında yardım edilmez; öğretmen her yönergeyi bir kez okur, en çok bir kez yineler; süre sınırı yoktur.

## İçerik geçerliği ve ön deneme (kullanıcıda)

| Kim | Ne | Tarih | Sonuç |
|---|---|---|---|
| Sınıf öğretmeni 1 | Madde–çıktı uyumu, dil, görsel | — | — |
| Sınıf öğretmeni 2 | Aynı | — | — |
| Alan uzmanı | Aynı + zorluk düzeyi tanımı | — | — |
| Ön deneme (çalışma dışı 3–5 çocuk, Ç-kodsuz, yalnız toplu not) | Anlaşılırlık, süre, taban/tavan etkisi | — | — |

Değişiklik gerekirse \`ETKI_DESENI\` veya tohumlar değişir, belge yeniden üretilir ve ön kayıt damgasından **önce** kesinleşir.
`;
}

export function belgeYaz(kok: string): string {
  const tr = trDuzlestir(
    JSON.parse(readFileSync(path.join(kok, 'src/content/tr.json'), 'utf8')) as Record<string, unknown>,
  );
  const hedef = path.join(kok, OLCME_ARACI_BELGESI);
  mkdirSync(path.dirname(hedef), { recursive: true });
  writeFileSync(hedef, olcmeAraciBelgesi(tr));
  return hedef;
}

async function pdfBas(kok: string): Promise<void> {
  if (!existsSync(path.join(kok, 'dist/index.html'))) throw new Error('dist/ yok: önce `npm run build`.');
  const port = 4181;
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
    for (const form of ['A', 'B'] as const) {
      await sayfa.goto(`${adres}/?arsiv=ETKI-1-${form}`);
      await sayfa.waitForSelector('[data-arsiv-hazir]', { timeout: 30_000 });
      await sayfa.evaluate(() => document.fonts.ready);
      const pdf = await sayfa.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
      // KG-102: PDF sayfa sayısı = altbilgideki "Sayfa n / N" toplamı (taşan sayfa basılmaz).
      const uyusmazlik = sayfaUyusmazligi(pdf, await sayfa.evaluate<BaskiBeyani>(BASKI_BEYANI_IFADESI));
      if (uyusmazlik) throw new Error(`ETKI-1-${form}: ${uyusmazlik}`);
      writeFileSync(path.join(kok, FORM_PDF[form]), pdfTarihleriniSabitle(pdf));
    }
    await tarayici.close();
  } finally {
    sunucu.kill();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const kok = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  console.log(`Yazıldı: ${path.relative(kok, belgeYaz(kok))}`);
  if (process.argv.includes('--pdf')) {
    await pdfBas(kok);
    console.log(`PDF: ${FORM_PDF.A}, ${FORM_PDF.B}`);
  }
}
