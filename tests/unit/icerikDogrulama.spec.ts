/**
 * Plan v2 KG-87 (K5): içerik JSON'ları derleme zamanında zod ile doğrulanır (scripts/yayin/icerikDogrulama.ts);
 * uygulama zod'suz, ayrıştırılmış veriyi alır. Bu test (1) modüle gelen verinin ayrıştırıcı çıktısıyla aynı
 * olduğunu, (2) bozuk verinin yüklemeyi kırdığını, (3) uygulama kodunun zod'u/şema değerlerini içe aktarmadığını
 * ve tam `motion` paketinin kullanılmadığını denetler.
 */
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { icerikDogrulama, icerikDosyasi } from '../../scripts/yayin/icerikDogrulama';
import { skillGrafiniAyristir } from '../../src/content/schema/skill';
import { kazanimlariDogrula } from '../../src/content/schema/kazanim';
import { skillsData } from '../../src/content/skillsData';
import kazanimlar from '../../src/content/kazanimlar.json';

const KOK = path.resolve(__dirname, '../..');
const ham = (ad: string): unknown => JSON.parse(readFileSync(path.join(KOK, 'src/content', ad), 'utf8'));

function dosyalar(dizin: string): string[] {
  return readdirSync(dizin).flatMap((ad) => {
    const p = path.join(dizin, ad);
    return statSync(p).isDirectory() ? dosyalar(p) : /\.(ts|tsx)$/.test(ad) ? [p] : [];
  });
}

type Yukle = (this: { addWatchFile: (f: string) => void }, id: string) => Promise<string | null>;
const yukle = (id: string) => (icerikDogrulama().load as unknown as Yukle).call({ addWatchFile: () => undefined }, id);

describe('içerik doğrulama (derleme zamanı)', () => {
  it('modüle gelen veri ayrıştırıcı çıktısıyla aynı (varsayılanlar dolu)', () => {
    expect(skillsData).toEqual(skillGrafiniAyristir(ham('skills.json')));
    expect(kazanimlar).toEqual(kazanimlariDogrula(ham('kazanimlar.json')));
  });

  it('yalnız tanımlı dosyalar ayrıştırılır', () => {
    expect(icerikDosyasi('/x/src/content/skills.json')).toBe('skills.json');
    expect(icerikDosyasi('/x/src/content/skills.json?import')).toBe('skills.json');
    expect(icerikDosyasi('/x/src/content/tr.json')).toBeNull();
    expect(icerikDosyasi('/x/src/content/misconceptions.json')).toBeNull();
  });

  it('bozuk veri yüklemeyi (dolayısıyla derlemeyi) kırar', async () => {
    const dizin = path.join(tmpdir(), `icerik-${process.pid}`, 'src', 'content');
    mkdirSync(dizin, { recursive: true });
    const dosya = path.join(dizin, 'evIpuclari.json');
    writeFileSync(dosya, JSON.stringify({ ipuclari: [{ tema: 'bir' }] }));
    await expect(yukle(dosya)).rejects.toThrow();
    writeFileSync(dosya, readFileSync(path.join(KOK, 'src/content/evIpuclari.json')));
    expect(JSON.parse((await yukle(dosya))!)).toEqual(ham('evIpuclari.json'));
  });

  it('uygulama kodu zod ya da şema değeri içe aktarmaz; tam motion paketi kullanılmaz', () => {
    const ihlal: string[] = [];
    for (const f of dosyalar(path.join(KOK, 'src'))) {
      const goreli = path.relative(KOK, f);
      if (goreli.startsWith(path.join('src', 'content', 'schema'))) continue;
      const s = readFileSync(f, 'utf8');
      if (/from 'zod'/.test(s)) ihlal.push(`${goreli}: zod`);
      for (const m of s.matchAll(/^import (?!type )[^;]*from '[^']*schema\/(?!zodAyari)[^']*';/gm))
        ihlal.push(`${goreli}: ${m[0]}`);
      if (/\bmotion\.[a-z]+\b/.test(s) || /import \{[^}]*\bmotion\b[^}]*\} from 'framer-motion'/.test(s))
        ihlal.push(`${goreli}: motion (m + LazyMotion kullan)`);
    }
    expect(ihlal).toEqual([]);
  });
});
