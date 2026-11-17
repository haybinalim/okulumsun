/**
 * Matematik klip ÇIKTI DOĞRULAMASI (sahte sentez + sahte ölçüm; GERÇEK İSTEK YOK). Türkçe ile AYNI kod
 * (`turDogrulama.ts`); burada matematik anahtarlarıyla: bozuk klip → "Bir." yeniden denemesi → kabul, iyi klip
 * korunur, `--yeniden-dogrula --kuru` sıfır istek, matematikte üst süre sınırı yok.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Clip } from '../../scripts/ses/klipler';
import { klipSentezleyici, sentezAyari } from '../../scripts/ses/klipSentezleyici';
import { mevcutlariDogrula, olcumSorunu, type Olcum } from '../../scripts/ses/turDogrulama';
import { planiCalistir } from '../../scripts/ses/uretimDongusu';
import { uretimPlani } from '../../scripts/ses/uretimPlani';

const IYI: Olcum = { sure: 0.6, maxSesDb: -3 };
const BOZUK: Olcum = { sure: 0.19, maxSesDb: -51 };
const clip = (key: string, text: string): Clip => ({ key, text, file: `${key.replace('.', '/')}.m4a`, core: true });

let dizin: string;
beforeEach(() => {
  dizin = mkdtempSync(path.join(os.tmpdir(), 'mat-dogrulama-'));
});
afterEach(() => rmSync(dizin, { recursive: true, force: true }));
const yol = (d: string) => path.join(dizin, d);
const diskeKoy = (d: string, o: Olcum | string) => {
  mkdirSync(path.dirname(yol(d)), { recursive: true });
  writeFileSync(yol(d), typeof o === 'string' ? o : JSON.stringify(o));
};
const tumDosyalar = (): string[] =>
  readdirSync(dizin, { recursive: true, withFileTypes: true }).filter((e) => e.isFile()).map((e) => e.name).sort();

/** generate-audio.ts'in GERÇEK kapanışı (`klipSentezleyici`, matematik: tur=false) + plan + planiCalistir. Yalnız sentez/ölçüm sahte. */
async function kos(klipler: Clip[], ozetler: Record<string, string>, olcum: (girdi: string) => Olcum, zorla = false, prototip = false) {
  const istekler: string[] = [];
  const plan = uretimPlani(klipler, ozetler, (m) => `h:${m}`, (d) => existsSync(yol(d)), { zorla });
  const sonuc = await planiCalistir({
    plan,
    sentezle: klipSentezleyici({
      ayar: sentezAyari(prototip ? ['--prototip'] : []),
      cikisDizini: dizin,
      synth: async (_c, girdi, gecici) => {
        istekler.push(girdi);
        writeFileSync(gecici, JSON.stringify(olcum(girdi)));
      },
      olc: async (g) => JSON.parse(readFileSync(g, 'utf8')) as Olcum,
      eskiBozuklar: new Set(klipler.map((c) => c.key)), // matematikte (tur=false) yok sayılmalı
      ozetler,
    }),
    kaydet: async (c, o) => {
      ozetler[c.key] = o;
    },
    asimdaKaydet: async () => undefined,
  });
  return { sonuc, istekler };
}

describe('matematik klibi: doğrula + yeniden dene', () => {
  it('bozuk "bir" → "Bir." ile yeniden denenir → kabul; özet gerçek metinden; geçici dosya kalmaz', async () => {
    const ozetler: Record<string, string> = {};
    const { sonuc, istekler } = await kos([clip('sayi.1', 'bir')], ozetler, (g) => (g === 'bir' ? BOZUK : IYI));
    expect(istekler).toEqual(['bir', 'Bir.']);
    expect(sonuc.made).toBe(1);
    expect(sonuc.dogrulanamayan).toEqual([]);
    expect(ozetler['sayi.1']).toBe('h:bir'); // "Bir." değil
    expect(tumDosyalar()).toEqual(['1.m4a']);
    expect(JSON.parse(readFileSync(yol('sayi/1.m4a'), 'utf8'))).toEqual(IYI);
  });

  it('iyi klip ilk denemede kabul: tek istek, girdi klibin kendi metni', async () => {
    const { istekler } = await kos([clip('sayi.2', 'iki')], {}, () => IYI);
    expect(istekler).toEqual(['iki']);
  });

  it('"top" → "Top."; 1 + 3 denemede de bozuksa eski (iyi) dosya ve özeti KORUNUR, döngü doğrulanamayan der', async () => {
    diskeKoy('nesne/top.m4a', IYI);
    const ozetler = { 'nesne.top': 'eski' };
    const { sonuc, istekler } = await kos([clip('nesne.top', 'top')], ozetler, () => BOZUK, true);
    expect(istekler).toEqual(['top', 'Top.', 'Top.', 'Top.']);
    expect(sonuc.made).toBe(0);
    expect(sonuc.dogrulanamayan).toHaveLength(1);
    expect(sonuc.failures).toEqual([]);
    expect(JSON.parse(readFileSync(yol('nesne/top.m4a'), 'utf8'))).toEqual(IYI);
    expect(ozetler['nesne.top']).toBe('eski');
    expect(tumDosyalar()).toEqual(['top.m4a']);
  });

  it('--prototip ölçülmez: bozuk çıktı olduğu gibi yazılır, yeniden deneme yok', async () => {
    const { istekler, sonuc } = await kos([clip('sayi.1', 'bir')], {}, () => BOZUK, false, true);
    expect(istekler).toEqual(['bir']);
    expect(sonuc.made).toBe(1);
  });

  it('eski BOZUK dosya matematikte tüm denemeler düşse de silinmez (manifest o dosyayı bekler)', async () => {
    diskeKoy('sayi/5.m4a', BOZUK);
    const { istekler } = await kos([clip('sayi.5', 'beş')], {}, () => BOZUK);
    expect(existsSync(yol('sayi/5.m4a'))).toBe(true);
    expect(istekler).toEqual(['beş', 'Beş.', 'Beş.', 'Beş.']);
  });
});

describe('CLI: npm run audio -- --yeniden-dogrula --kuru (matematik, gerçek dosyalar, istek yok)', () => {
  const ffmpegVar = spawnSync('ffprobe', ['-version']).status === 0;
  it.skipIf(!ffmpegVar)('matematikte de çalışır: bayrak reddedilmez, mevcut klipleri ölçer, istek atmaz, dosya yazmaz', () => {
    const defter = path.join(dizin, 'yok-defter.json'); // var olmayan yol: gerçek deftere dokunulmaz
    const r = spawnSync('npx', ['tsx', 'scripts/generate-audio.ts', '--yeniden-dogrula', '--kuru'], {
      encoding: 'utf8',
      env: { ...process.env, TTS_KULLANIM_DOSYASI: defter, GOOGLE_TTS_API_KEY: '' },
    });
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toMatch(/doğrulama eşikleri: süre ≥ 0.35/);
    expect(r.stdout).toMatch(/yeniden doğrulama: \d+ mevcut klip ölçüldü \(istek yok\)/);
    expect(r.stdout).toContain('--kuru: hiç istek atılmadı, dosya yazılmadı.');
    expect(r.stdout).not.toContain('--ders tur');
    expect(existsSync(defter)).toBe(false);
  }, 120_000);
});

describe('matematik eşikleri ve --yeniden-dogrula', () => {
  it('üst süre sınırı yok: uzun soru klibi (20 sn) geçer; Türkçe hece aynı süreyle geçmez', () => {
    const uzun: Olcum = { sure: 20, maxSesDb: -4 };
    expect(olcumSorunu('soru.hangisi-gelir', uzun)).toBeNull();
    expect(olcumSorunu('sayi.17', uzun)).toBeNull();
    expect(olcumSorunu('tur.hece.ka', uzun)).not.toBeNull();
  });

  it('gerçek bozuk ölçümler (0,19 sn/-51 dB, 0,24 sn/-38 dB, -37 dB) geçmez', () => {
    expect(olcumSorunu('sayi.1', BOZUK)).toMatch(/süre/);
    expect(olcumSorunu('nesne.top', { sure: 0.24, maxSesDb: -38 })).toMatch(/süre/);
    expect(olcumSorunu('sayi.5', { sure: 0.6, maxSesDb: -37 })).toMatch(/max_volume/);
  });

  it('mevcutlariDogrula: istek atmadan ölçer, yalnız bozukları listeler', async () => {
    const klipler = [clip('sayi.1', 'bir'), clip('sayi.2', 'iki'), clip('nesne.top', 'top'), clip('sayi.3', 'üç')];
    diskeKoy('sayi/1.m4a', BOZUK);
    diskeKoy('sayi/2.m4a', IYI);
    diskeKoy('nesne/top.m4a', { sure: 0.24, maxSesDb: -38 });
    // sayi/3 diskte yok → ölçülmez
    const r = await mevcutlariDogrula(klipler, (d) => existsSync(yol(d)), yol, async (g) => JSON.parse(readFileSync(g, 'utf8')) as Olcum);
    expect(r.olculen).toBe(3);
    expect(r.gecmeyen.map((g) => g.anahtar)).toEqual(['sayi.1', 'nesne.top']);
  });
});

describe('geçici .yeni.m4a yayına sızmaz', () => {
  it('vite precache globIgnores, .gitignore ve audit aynı sabiti/deseni kullanır', () => {
    expect(readFileSync('vite.config.ts', 'utf8')).toMatch(/globIgnores:[^\]]*GECICI_KLIP_SONEKI/);
    expect(readFileSync('.gitignore', 'utf8')).toMatch(/^\*\.yeni\.m4a$/m);
  });

  it.skipIf(spawnSync('ffprobe', ['-version']).status !== 0)('audit: public/audio altında .yeni.m4a kalmışsa HATA (çıkış 1, GEÇİCİ)', () => {
    const geciciDosya = 'public/audio/sayi/zz-test.yeni.m4a';
    copyFileSync('public/audio/sayi/2.m4a', geciciDosya);
    try {
      const r = spawnSync('npx', ['tsx', 'scripts/audit-audio.ts'], { encoding: 'utf8' });
      expect(r.status).toBe(1);
      expect(r.stderr).toContain('GEÇİCİ     sayi/zz-test.yeni.m4a');
    } finally {
      rmSync(geciciDosya, { force: true });
    }
  }, 120_000);
});

describe('sentez ayarı tek yerden (generate-audio.ts bağlantısı)', () => {
  it('matematik argv: ölçüm AÇIK, tur değil; --prototip: kapalı; --ders tur: tur + açık', () => {
    expect(sentezAyari([])).toEqual({ prototip: false, tur: false, dogrula: true });
    expect(sentezAyari(['--kuru', '--yeniden-dogrula'])).toMatchObject({ tur: false, dogrula: true });
    expect(sentezAyari(['--prototip'])).toEqual({ prototip: true, tur: false, dogrula: false });
    expect(sentezAyari(['--ders', 'tur'])).toEqual({ prototip: false, tur: true, dogrula: true });
  });

  it('generate-audio.ts ayarı tek satırda türetir; kapanış ve günlük aynı nesneyi alır, kopya hesap yok', () => {
    const k = readFileSync('scripts/generate-audio.ts', 'utf8');
    expect(k.match(/const ayar = sentezAyari\(process\.argv\);/g)).toHaveLength(1);
    expect(k).toMatch(/klipSentezleyici\(\{\s*ayar,/);
    expect(k).toMatch(/if \(ayar\.dogrula\) \{/);
    expect(k).not.toMatch(/dogrulamaAcik/);
    expect(k).not.toMatch(/^\s*(prototip|tur):/m); // kapanışa elle prototip/tur verilmez
  });
});
