/**
 * Ders paketi altyapısı (ADR-0011, ADR-0016; Okuma Yazma planı Adım 61).
 * Türkçe paket yalnız `VITE_DERS_TUR=1` derlemesinde; üretim paketi ve precache değişmez.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { acikDersler, DERS_KODLARI, DERSLER } from '../../src/content/dersler';
import { TUR_IMLECI, turDersiniKaydet } from '../../src/content/dersler/tur';
import { turVeriYolu, turVerisiniOku, TUR_VERI_KOKU } from '../../src/content/dersler/tur/veriYukleyici';
import { dersVerisiDosyalari } from '../../scripts/yayin/dersVerisi';
import { butceyiDegerlendir, veriyiOlc, type DersVeriManifesti } from '../../scripts/ders-veri-butcesi';

const KOK = path.resolve(__dirname, '../..');
const oku = (rel: string) => readFileSync(path.join(KOK, rel), 'utf8');

function kaynaklar(dizin: string): string[] {
  return readdirSync(dizin).flatMap((ad) => {
    const p = path.join(dizin, ad);
    return statSync(p).isDirectory() ? kaynaklar(p) : /\.(ts|tsx)$/.test(ad) ? [p] : [];
  });
}

describe('ders kayıt defteri', () => {
  it('mat yayında, tur geliştirmede ve bayraklı; kısıt belgeleri var', () => {
    expect(DERS_KODLARI).toEqual(['mat', 'tur']);
    expect(DERSLER.mat.durum).toBe('yayinda');
    expect(DERSLER.tur).toMatchObject({ durum: 'gelistirme', bayrak: 'VITE_DERS_TUR', veriKoku: 'ders-verisi/tur' });
    for (const k of DERS_KODLARI) expect(existsSync(path.join(KOK, DERSLER[k].kisitBelgesi)), k).toBe(true);
  });

  it('bayrak yoksa yalnız matematik açık; "1" ise Türkçe de', () => {
    expect(acikDersler({})).toEqual(['mat']);
    expect(acikDersler({ VITE_DERS_TUR: '0' })).toEqual(['mat']);
    expect(acikDersler({ VITE_DERS_TUR: '1' })).toEqual(['mat', 'tur']);
  });

  it('varsayılan ortamda bayrak tanımsız', () => {
    expect(import.meta.env.VITE_DERS_TUR).toBeUndefined();
  });
});

describe('üretim paketi korunur', () => {
  it("Türkçe modülü src/ içinde yalnız main.tsx'teki bayrak korumalı dinamik içe aktarım yükler", () => {
    const bulunan = kaynaklar(path.join(KOK, 'src'))
      .filter((f) => !f.includes(`${path.sep}dersler${path.sep}tur${path.sep}`))
      // Şema dosyaları yalnız doğrulamada kullanılır; uygulama onları içe aktarmaz (icerikDogrulama.spec).
      .filter((f) => !f.includes(`${path.sep}content${path.sep}schema${path.sep}`))
      // Türkçe arayüz paketi (Adım 64) kendisi bayrak arkasındadır; ona giden yollar aşağıdaki testte.
      .filter((f) => !f.includes(`${path.sep}ui${path.sep}tur${path.sep}`))
      .flatMap((f) =>
        oku(path.relative(KOK, f))
          .split('\n')
          .filter((s) => /dersler\/tur/.test(s))
          .map((s) => [path.relative(KOK, f), s.trim()] as const),
      );
    expect(bulunan).toHaveLength(1);
    const [dosya, satir] = bulunan[0];
    expect(dosya).toBe('src/main.tsx');
    expect(satir).toMatch(/^if \(import\.meta\.env\.VITE_DERS_TUR === '1'\) void import\('\.\/content\/dersler\/tur\//);
  });

  it('Türkçe arayüz paketine (src/ui/tur) yalnız App.tsx ve main.tsx bayrak sabitiyle ulaşır (Adım 64, 65)', () => {
    const bulunan = kaynaklar(path.join(KOK, 'src'))
      .filter((f) => !f.includes(`${path.sep}ui${path.sep}tur${path.sep}`))
      .flatMap((f) =>
        oku(path.relative(KOK, f))
          .split('\n')
          .filter((s) => /ui\/tur\//.test(s) && !/^\s*(\/\/|\*)/.test(s))
          .map((s) => [path.relative(KOK, f), s.trim()] as const),
      );
    expect(bulunan.map(([d]) => d)).toEqual(['src/App.tsx', 'src/App.tsx', 'src/App.tsx', 'src/main.tsx']);
    const satirlar = bulunan.map(([, s]) => s);
    // Adım 65: Türkçe kâğıt görünümü (`?arsiv=tur-…`) main.tsx'te bayrak sabitine bağlı dalda, tembel.
    const main = oku('src/main.tsx');
    expect(main).toMatch(
      /if \(import\.meta\.env\.VITE_DERS_TUR === '1' && arsivKodu\?\.startsWith\('tur-'\)\) \{\n(?:\s*\/\/[^\n]*\n)?\s*void import\('\.\/ui\/tur\/kagit\/TurArsivKagidi\.tsx'\)/,
    );
    // Durum modülü yan etkisiz (tek içe aktarım); ekran tembel ve bayrak sabitine bağlı; kanca seçimi modül düzeyinde.
    expect(satirlar[0]).toBe("import { useTurEkrani } from './ui/tur/turEkrani';");
    expect(satirlar[1]).toBe(
      "const TurEkrani = import.meta.env.VITE_DERS_TUR === '1' ? lazy(() => import('./ui/tur/TurEkrani')) : null;",
    );
    // Adım 71: tahta ana ekranındaki ders seçimi de tembel ve bayrak sabitine bağlı; dalı bütünüyle bayrak koşullu.
    expect(satirlar[2]).toBe(
      "import.meta.env.VITE_DERS_TUR === '1' ? lazy(() => import('./ui/tur/TurOgretmen').then((m) => ({ default: m.AnaEkranDersSecimi }))) : null;",
    );
    const app = oku('src/App.tsx');
    expect(app).toMatch(/if \(import\.meta\.env\.VITE_DERS_TUR === '1' && TurDersSecimi && ekran === 'anaEkran' && mod === 'tahta'\) \{/);
    expect(app).toContain(
      "const useTurEkraniBayrakli = import.meta.env.VITE_DERS_TUR === '1' ? useTurEkrani : () => null;",
    );
    expect(app).toMatch(
      /if \(import\.meta\.env\.VITE_DERS_TUR === '1' && TurEkrani && turEkrani\) \{\n\s*return kabuk\(/,
    );
    // Durum modülünün üst düzeyinde çağrı yok (ağaç sallamada atılabilir olmalı).
    const durum = oku('src/ui/tur/turEkrani.ts');
    expect(durum).not.toMatch(/^(?:export )?(?:const|let) \w+[^=\n]*= *(?:new |create|[a-zA-Z_]+\()/m);
  });

  it("kayıt defteri uygulama girişinden içe aktarılmaz (üretim JS'i değişmez)", () => {
    const iceAktaran = kaynaklar(path.join(KOK, 'src')).filter((f) =>
      /from '[./]*(content\/)?dersler(\/index)?(\.ts)?'/.test(readFileSync(f, 'utf8')),
    );
    expect(iceAktaran.map((f) => path.relative(KOK, f))).toEqual([]);
  });

  it('ders verisi public/ altında değil; precache Türkçe veriyi dışlar', () => {
    expect(existsSync(path.join(KOK, 'public/tur'))).toBe(false);
    expect(existsSync(path.join(KOK, 'ders-verisi/tur/manifest.json'))).toBe(true);
    expect(oku('vite.config.ts')).toMatch(/globIgnores: \[[^\]]*'tur\/\*\*'/);
  });

  it('CI üretimde Türkçe imleci arar ve bayraklı derlemeyi ölçer', () => {
    const ci = oku('.github/workflows/ci.yml');
    expect(ci).toContain(`grep -rq ${TUR_IMLECI} dist/`);
    expect(ci).toContain('VITE_DERS_TUR=1 npx vite build --outDir dist-tur');
    expect(ci).toContain('npm run boyut:ders -- --js dist-tur');
    expect(oku('src/content/dersler/tur/index.ts')).toContain(TUR_IMLECI);
  });
});

describe('Türkçe veri yükleyicisi (aynı köken)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('yalnız göreli, küçük harfli JSON yollarını kabul eder', () => {
    expect(turVeriYolu('manifest.json')).toBe(`${TUR_VERI_KOKU}manifest.json`);
    expect(turVeriYolu('icerik/grup-1.json')).toBe('./tur/icerik/grup-1.json');
    for (const kotu of [
      '../x.json',
      '/x.json',
      'https://dis.example.com/x.json',
      'x.js',
      'Icerik.json',
      'a//b.json',
      '',
    ])
      expect(() => turVeriYolu(kotu), kotu).toThrow();
  });

  it('fetch aynı kökenden okur, hata durumunu bildirir', async () => {
    const f = vi.fn(async () => new Response('{"ders":"tur"}', { status: 200 }));
    vi.stubGlobal('fetch', f);
    await expect(turVerisiniOku('manifest.json')).resolves.toEqual({ ders: 'tur' });
    expect(f).toHaveBeenCalledWith('./tur/manifest.json', { credentials: 'same-origin' });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 404 })),
    );
    await expect(turVerisiniOku('yok.json')).rejects.toThrow(/404/);
  });

  it('paket yüklenince kökte görünmez işaret', () => {
    const kok = { dataset: {} as Record<string, string> } as unknown as HTMLElement;
    turDersiniKaydet(kok);
    expect(kok.dataset.dersTur).toBe(TUR_IMLECI);
  });
});

describe('ders verisi yayını ve bütçe', () => {
  it("yayılacak dosyalar README'yi içermez", () => {
    const d = dersVerisiDosyalari(KOK);
    expect(d).toContain('manifest.json');
    expect(d).not.toContain('README.md');
  });

  const manifest: DersVeriManifesti = {
    ders: 'tur',
    programSurumu: 'x',
    cekirdek: ['manifest.json'],
    gruplar: { '1': ['icerik/grup-1.json'], '2': ['eksik.json'] },
  };
  const butce = { cekirdekBayt: 100, grupBayt: 1000, kodBayt: 500 };

  it('çekirdek, grup, listesiz ve eksik dosyaları ölçer', () => {
    const o = veriyiOlc(
      new Map([
        ['manifest.json', 40],
        ['icerik/grup-1.json', 900],
        ['serbest.json', 7],
      ]),
      manifest,
    );
    expect(o).toEqual({
      cekirdekBayt: 40,
      gruplar: { '1': 900, '2': 0 },
      listesiz: ['serbest.json'],
      eksik: ['eksik.json'],
    });
    const d = butceyiDegerlendir(o, 400, butce);
    expect(d.asimlar).toEqual(['manifestte var, diskte yok: eksik.json']);
    expect(d.notlar).toEqual(['manifestte yok (önbellek planı dışında): serbest.json']);
  });

  it('tavan aşımları ve ölçülmemiş JS', () => {
    const o = veriyiOlc(
      new Map([
        ['manifest.json', 101],
        ['icerik/grup-1.json', 1001],
        ['eksik.json', 1],
      ]),
      manifest,
    );
    const d = butceyiDegerlendir(o, 501, butce);
    expect(d.asimlar).toEqual(['çekirdek 101 B > 100 B', 'grup 1: 1001 B > 1000 B', 'Türkçe JS 501 B > 500 B']);
    expect(butceyiDegerlendir(o, null, butce).notlar.at(-1)).toMatch(/ölçülmedi/);
  });

  it('bütçe dosyası K-2 tavanlarını taşır ve yayına kadar zorunlu değil', () => {
    const b = JSON.parse(oku('docs/ders-veri-butcesi.json'));
    expect(b.zorunlu).toBe(false);
    expect(b.dersler.tur).toEqual({ cekirdekBayt: 1024 * 1024, grupBayt: 6 * 1024 * 1024, kodBayt: 120 * 1024 });
  });
});
