import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { googleIstegi, googleSentezle } from '../../scripts/ses/googleTts';
import {
  Defter,
  UCRETSIZ_AYLIK_KARAKTER,
  VARSAYILAN_GUVENLI_SINIR,
  ayAnahtari,
  butceDurumu,
  defterAyir,
  defterYolu,
  guvenliSinir,
  karakterSay,
  onTahmin,
  sigarMi,
} from '../../scripts/ses/ucretsizKatman';
import { uretimPlani } from '../../scripts/ses/uretimPlani';
import type { Clip } from '../../scripts/ses/klipler';

let dizin: string;
beforeEach(() => {
  dizin = mkdtempSync(path.join(os.tmpdir(), 'tts-defter-'));
});
afterEach(() => rmSync(dizin, { recursive: true, force: true }));

const EKIM = new Date('2026-10-28T10:00:00Z');

function defterYaz(veri: unknown): string {
  const yol = path.join(dizin, 'tts-kullanim.json');
  writeFileSync(yol, JSON.stringify(veri));
  return yol;
}

describe('Ücretsiz katman koruması (KG-109)', () => {
  it('karakter sayımı Google kuralıyla: boşluk ve noktalama dahil tüm karakterler', () => {
    expect(karakterSay('on yedi elma.')).toBe(13);
    expect(karakterSay('Şekerli çay, ığdır!')).toBe(19);
    expect(karakterSay('  ')).toBe(2);
  });

  it('güvenli sınır varsayılan 900.000; ortamla yalnız aşağı çekilir, 1M üstüne çıkamaz', () => {
    expect(VARSAYILAN_GUVENLI_SINIR).toBe(900_000);
    expect(UCRETSIZ_AYLIK_KARAKTER).toBe(1_000_000);
    expect(guvenliSinir({})).toBe(900_000);
    expect(guvenliSinir({ TTS_GUVENLI_SINIR: '50000' })).toBe(50_000);
    expect(guvenliSinir({ TTS_GUVENLI_SINIR: '900000' })).toBe(900_000);
    expect(() => guvenliSinir({ TTS_GUVENLI_SINIR: '900001' })).toThrow(/yalnız aşağı/);
    expect(() => guvenliSinir({ TTS_GUVENLI_SINIR: '1000000' })).toThrow(/yalnız aşağı/);
    expect(() => guvenliSinir({ TTS_GUVENLI_SINIR: '2000000' })).toThrow(/yalnız aşağı/);
    expect(() => guvenliSinir({ TTS_GUVENLI_SINIR: '0' })).toThrow();
    expect(() => guvenliSinir({ TTS_GUVENLI_SINIR: '-5' })).toThrow();
    expect(() => guvenliSinir({ TTS_GUVENLI_SINIR: 'sınırsız' })).toThrow();
  });

  it('ay anahtarı Pacific saatine göre: ay geçişi UTC ile değil fatura ayıyla', () => {
    expect(ayAnahtari(EKIM)).toBe('2026-10');
    // 1 Kasım 05:00 UTC = 31 Ekim 22:00 PDT → hâlâ Ekim.
    expect(ayAnahtari(new Date('2026-11-01T05:00:00Z'))).toBe('2026-10');
    // 1 Kasım 08:00 UTC = 1 Kasım 01:00 PDT → Kasım.
    expect(ayAnahtari(new Date('2026-11-01T08:00:00Z'))).toBe('2026-11');
    expect(ayAnahtari(new Date('2027-01-01T07:59:00Z'))).toBe('2026-12');
  });

  it('ay geçişinde yeni ay sıfırdan başlar, eski ay korunur', () => {
    const yol = defterYaz({ '2026-10': { karakter: 899_000, istek: 10, guncelleme: '' } });
    let simdi = new Date('2026-10-31T12:00:00Z');
    const d = new Defter(yol, 900_000, () => simdi);
    expect(d.durum().kalan).toBe(1_000);
    expect(() => d.istekOncesi(2_000)).toThrow(/ÜCRETSİZ KATMAN KORUMASI/);
    simdi = new Date('2026-11-01T09:00:00Z');
    expect(d.durum()).toMatchObject({ ay: '2026-11', kullanilan: 0, kalan: 900_000 });
    d.istekOncesi(2_000);
    d.kaydet(2_000);
    const veri = JSON.parse(readFileSync(yol, 'utf8'));
    expect(veri['2026-10'].karakter).toBe(899_000);
    expect(veri['2026-11']).toMatchObject({ karakter: 2_000, istek: 1 });
  });

  it('kayıt atomik yazılır, ek alanlar korunur, geçici dosya kalmaz', () => {
    const yol = defterYaz({ '2026-10': { karakter: 5_000, istek: 0, guncelleme: '', not: 'başlangıç' } });
    const d = new Defter(yol, 900_000, () => EKIM);
    d.kaydet(120);
    d.kaydet(30, 1);
    const veri = JSON.parse(readFileSync(yol, 'utf8'));
    expect(veri['2026-10']).toMatchObject({ karakter: 5_150, istek: 2, not: 'başlangıç' });
    expect(veri['2026-10'].guncelleme).toBe(EKIM.toISOString());
    expect(readdirSync(dizin).filter((f) => f.endsWith('.tmp'))).toEqual([]);
  });

  it('bozuk defter sessizce sıfırlanmaz', () => {
    expect(() => defterAyir([])).toThrow();
    expect(() => defterAyir({ ekim: { karakter: 1, istek: 1 } })).toThrow(/ay anahtarı/);
    expect(() => defterAyir({ '2026-10': { karakter: -1, istek: 0 } })).toThrow(/geçersiz kayıt/);
  });

  it('defter yoksa gerçek istek atılmaz', () => {
    const d = new Defter(path.join(dizin, 'yok.json'), 900_000, () => EKIM);
    expect(() => d.istekOncesi(10)).toThrow(/defteri yok/);
  });

  it('defter yolu ortamdan; yoksa depo dışındaki work/ klasörü', () => {
    expect(defterYolu('/x/repo', { TTS_KULLANIM_DOSYASI: '/tmp/a.json' })).toBe('/tmp/a.json');
    const depo = path.join(dizin, 'repo');
    // work/ yok → ev dizini altı (depo dışında)
    expect(defterYolu(depo, {})).toBe(path.join(os.homedir(), '.okulumsun', 'tts-kullanim.json'));
    execFileSync('mkdir', ['-p', path.join(dizin, 'work')]);
    expect(defterYolu(depo, {})).toBe(path.join(dizin, 'work', 'tts-kullanim.json'));
  });

  it('çalışma başı tahmin: toplam kalan bütçeyi aşarsa hiç başlamaz', () => {
    const durum = butceDurumu({ '2026-10': { karakter: 899_990, istek: 0, guncelleme: '' } }, 900_000, EKIM);
    expect(sigarMi(durum, 10)).toBe(true);
    expect(sigarMi(durum, 11)).toBe(false);
    expect(onTahmin(['abcde', 'fghij'], durum)).toBe(10);
    expect(() => onTahmin(['abcde', 'fghijk'], durum)).toThrow(/2 klip gönderilmedi/);
  });

  it('sınır aşımında Google isteği hiç gönderilmez', async () => {
    const yol = defterYaz({ '2026-10': { karakter: 899_995, istek: 0, guncelleme: '' } });
    const koruma = new Defter(yol, 900_000, () => EKIM);
    const fetchFn = vi.fn();
    await expect(
      googleSentezle(googleIstegi('on yedi elma', 'Puck'), 'anahtar', { koruma, fetchFn: fetchFn as never }),
    ).rejects.toThrow(/ÜCRETSİZ KATMAN KORUMASI/);
    expect(fetchFn).not.toHaveBeenCalled();
    expect(JSON.parse(readFileSync(yol, 'utf8'))['2026-10'].karakter).toBe(899_995);
  });

  it('korumasız istek reddedilir', async () => {
    const fetchFn = vi.fn();
    await expect(
      googleSentezle(googleIstegi('elma', 'Puck'), 'anahtar', { fetchFn } as never),
    ).rejects.toThrow(/koruması olmadan/);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('429 yeniden denemeleri de karakteriyle sayılır; bütçe bitince yeniden deneme de gönderilmez', async () => {
    const metin = 'on yedi elma'; // 12 karakter
    const yol = defterYaz({ '2026-10': { karakter: 899_970, istek: 0, guncelleme: '' } });
    const koruma = new Defter(yol, 900_000, () => EKIM);
    const fetchFn = vi.fn(async () => new Response('kota', { status: 429 }));
    await expect(
      googleSentezle(googleIstegi(metin, 'Puck'), 'anahtar', { koruma, fetchFn: fetchFn as never, uyuFn: async () => {} }),
    ).rejects.toThrow(/ÜCRETSİZ KATMAN KORUMASI/);
    // 899 970 + 12 + 12 = 899 994; üçüncü deneme 900 006 olurdu → gönderilmez.
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(JSON.parse(readFileSync(yol, 'utf8'))['2026-10']).toMatchObject({ karakter: 899_994, istek: 2 });
  });

  it('başarılı istek bir kez sayılır', async () => {
    const yol = defterYaz({ '2026-10': { karakter: 5_000, istek: 0, guncelleme: '' } });
    const koruma = new Defter(yol, 900_000, () => EKIM);
    const ses = Buffer.from('RIFF').toString('base64');
    const fetchFn = vi.fn(async () => Response.json({ audioContent: ses }));
    const wav = await googleSentezle(googleIstegi('elma', 'Puck'), 'anahtar', { koruma, fetchFn: fetchFn as never });
    expect(wav.toString()).toBe('RIFF');
    expect(JSON.parse(readFileSync(yol, 'utf8'))['2026-10']).toMatchObject({ karakter: 5_004, istek: 1 });
  });
});

describe('Artımlı üretim planı (KG-109)', () => {
  const klipler: Clip[] = [
    { key: 'a', text: 'bir', file: 'a.m4a', core: true },
    { key: 'b', text: 'iki', file: 'b.m4a', core: true },
    { key: 'c', text: 'üç', file: 'c.m4a', core: false },
  ];
  const ozet = (m: string) => `oz:${m}`;
  const ozetler = { a: 'oz:bir', b: 'oz:eski', c: 'oz:üç' };
  const var_ = (f: string) => f !== 'c.m4a';

  it('yalnız özeti değişen veya dosyası eksik klipler üretilir', () => {
    const p = uretimPlani(klipler, ozetler, ozet, var_, { zorla: false });
    expect(p.uretilecek.map((u) => u.clip.key)).toEqual(['b', 'c']);
    expect(p.atlanan).toBe(1);
    expect(p.kalan).toBe(0);
  });

  it('tam yeniden üretim yalnız --zorla ile', () => {
    const p = uretimPlani(klipler, ozetler, ozet, () => true, { zorla: true });
    expect(p.uretilecek).toHaveLength(3);
  });

  it('--en-cok sınırı kalanı sonraki çalışmaya bırakır', () => {
    const p = uretimPlani(klipler, {}, ozet, () => true, { zorla: false, enCok: 1 });
    expect(p.uretilecek).toHaveLength(1);
    expect(p.kalan).toBe(2);
  });

  it('kuru çalışma: commitli özetlerle hiç istek atmadan 0 klip planlanır', () => {
    const repo = path.resolve(__dirname, '../..');
    const cikti = execFileSync('npx', ['tsx', 'scripts/generate-audio.ts', '--kuru'], {
      cwd: repo,
      env: { ...process.env, TTS_KULLANIM_DOSYASI: path.join(dizin, 'yok.json'), GOOGLE_TTS_API_KEY: '' },
      encoding: 'utf8',
    });
    expect(cikti).toMatch(/plan: üretilecek 0 klip · 0 karakter/);
    expect(cikti).toMatch(/--kuru: hiç istek atılmadı/);
    expect(existsSync(path.join(dizin, 'yok.json'))).toBe(false);
  }, 60_000);
});
