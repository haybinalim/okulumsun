/**
 * Okul paketi (plan v2 Adım 49, KG-71). `npm run build && npm run okul-paketi` → `dist-okul.zip`
 *
 * İçerik: `okulumsun/` (derleme çıktısı; okul sunucusuna ya da alt klasöre olduğu gibi kopyalanır), `OKUBENI.txt`
 * (kurulum, `file://` sınırı), `LICENSE` + `LICENSES.md`, `SURUM.txt`, `SHA256SUMS.txt` (her dosyanın özeti).
 * ADR-0013: yazılım tüm hakları saklı; kurum/okul ağı dağıtımı ayrı yazılı izin ister. İzin metni kullanıcı
 * tarafından hazırlanana kadar paket yalnız CI artefaktıdır (GitHub Release eki yok — plan ⛔ O5).
 * Zip girdileri sıralı ve tarihleri sabit (`zip -X`, sabit mtime) → aynı derleme, aynı zip.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const PAKET_KOK = 'okulumsun';
export const PAKET_ADI = 'dist-okul.zip';

export interface PaketDosyasi {
  /** `okulumsun/` altına göreli yol (posix). */
  readonly yol: string;
  readonly sha256: string;
}

export function okubeniMetni(surum: string): string {
  return `OKULUMSUN ${surum} — OKUL PAKETİ
================================

Bu paket, okulumsun uygulamasının internete bağlı olmadan okul ağında çalıştırılabilen kopyasıdır.

NASIL AÇILIR?
1) Okul sunucusu (önerilen): "okulumsun" klasörünü okulun web sunucusuna kopyalayın
   (ör. http://okul-sunucusu/okulumsun/). Alt klasörden açılır; ek ayar gerekmez.
   Sunucu .js dosyalarını "text/javascript", .webmanifest dosyasını "application/manifest+json" türüyle sunmalıdır.
2) Tek bilgisayar: klasörde bir yerel web sunucusu başlatın ve tarayıcıda açın, örneğin
   Python yüklüyse "okulumsun" klasöründe:  python -m http.server 8080  → http://localhost:8080/
3) İnternet varsa: https://okulumsun-tc.vercel.app — bir kez açıldıktan sonra internet olmadan da çalışır.

BİLİNEN SINIR
index.html dosyasına çift tıklayarak (file://) açılmaz: tarayıcılar güvenlik gereği modül betiklerini
dosyadan yüklemez. Bu durumda ekranda ne yapılacağını anlatan bir uyarı görünür.

GİZLİLİK
Uygulama hiçbir sunucuya veri göndermez; çocuk verisi saklamaz. Ayrıntılar: gizlilik/index.html

LİSANS
Tüm hakları saklıdır (LICENSE). Bu paketin okul ya da kurum ağında dağıtımı telif hakkı sahibinin yazılı
iznine bağlıdır. Üçüncü taraf bileşenler: LICENSES.md.

Dosya bütünlüğü: SHA256SUMS.txt ("sha256sum -c SHA256SUMS.txt" ile denetlenebilir).
`;
}

/** Klasördeki dosyalar (posix, sıralı). */
export function dosyalariListele(kok: string, alt = ''): string[] {
  const sonuc: string[] = [];
  for (const ad of readdirSync(path.join(kok, alt)).sort()) {
    const g = alt ? `${alt}/${ad}` : ad;
    if (statSync(path.join(kok, g)).isDirectory()) sonuc.push(...dosyalariListele(kok, g));
    else sonuc.push(g);
  }
  return sonuc;
}

/** `sha256sum` biçimi; yollar paket kökünden göreli (`okulumsun/...`). */
export function sha256Listesi(dosyalar: readonly PaketDosyasi[]): string {
  return dosyalar.map((d) => `${d.sha256}  ${PAKET_KOK}/${d.yol}\n`).join('');
}

/** Paketin kök düzeyindeki dosyaları (zip girdi listesi, sıralı). */
export function paketGirdileri(uygulamaDosyalari: readonly string[]): string[] {
  return [
    'LICENSE',
    'LICENSES.md',
    'OKUBENI.txt',
    'SHA256SUMS.txt',
    'SURUM.txt',
    ...uygulamaDosyalari.map((y) => `${PAKET_KOK}/${y}`),
  ];
}

export function okulPaketiUret(kok: string, hedef = path.join(kok, PAKET_ADI)): string[] {
  const dist = path.join(kok, 'dist');
  if (!existsSync(path.join(dist, 'index.html'))) throw new Error('dist/ yok: önce `npm run build`.');
  const surum = (JSON.parse(readFileSync(path.join(kok, 'package.json'), 'utf8')) as { version: string }).version;
  const sahne = mkdtempSync(path.join(tmpdir(), 'okul-paketi-'));
  try {
    cpSync(dist, path.join(sahne, PAKET_KOK), { recursive: true });
    const uygulama = dosyalariListele(path.join(sahne, PAKET_KOK));
    const ozetler = uygulama.map((yol) => ({
      yol,
      sha256: createHash('sha256').update(readFileSync(path.join(sahne, PAKET_KOK, yol))).digest('hex'),
    }));
    writeFileSync(path.join(sahne, 'SHA256SUMS.txt'), sha256Listesi(ozetler));
    writeFileSync(path.join(sahne, 'OKUBENI.txt'), okubeniMetni(surum));
    writeFileSync(path.join(sahne, 'SURUM.txt'), `${surum}\n`);
    cpSync(path.join(kok, 'LICENSE'), path.join(sahne, 'LICENSE'));
    cpSync(path.join(kok, 'LICENSES.md'), path.join(sahne, 'LICENSES.md'));
    const girdiler = paketGirdileri(uygulama);
    const sabit = new Date('2026-01-01T00:00:00Z');
    for (const g of girdiler) utimesSync(path.join(sahne, g), sabit, sabit);
    rmSync(hedef, { force: true });
    const z = spawnSync('zip', ['-X', '-q', '-9', hedef, '-@'], { cwd: sahne, input: girdiler.join('\n') });
    if (z.status !== 0) throw new Error(`zip başarısız: ${z.stderr?.toString()}`);
    return girdiler;
  } finally {
    rmSync(sahne, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const kok = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const girdiler = okulPaketiUret(kok);
  console.log(`${PAKET_ADI} yazıldı (${girdiler.length} dosya).`);
}
