/**
 * Türkçe klip TELAFFUZ AYARI (sentez girdisi): sahte sentez/ölçüm, geçici dizin; GERÇEK İSTEK YOK, depodaki
 * `ders-verisi/` ve `public/audio` altına YAZILMAZ (yalnız os.tmpdir()).
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { girdiBicimi, sentezGirdisi } from '../../scripts/ses/klipler';
import { googleIstegi, googleSentezle } from '../../scripts/ses/googleTts';
import { anahtarliKlipOzeti, kokenDenetle, ozetDosyasiniOku, sesKaynagiDosyasiniAyir, telaffuzluOzet } from '../../scripts/ses/sesKaynagi';
import { Defter, karakterSay } from '../../scripts/ses/ucretsizKatman';
import { turKlibiSentezle, type Olcum } from '../../scripts/ses/turDogrulama';
import { planiCalistir } from '../../scripts/ses/uretimDongusu';
import { uretimPlani } from '../../scripts/ses/uretimPlani';
import {
  ssmlGorunenMetin,
  telaffuzListesiniAyir,
  telaffuzListesiniOku,
  telaffuzUygula,
  turKlipleriniAyir,
} from '../../scripts/ses/turKlipleri';

const IYI: Olcum = { sure: 0.8, maxSesDb: -3 };
const BOZUK: Olcum = { sure: 0.22, maxSesDb: -48 };
const { aktif, anahtarSesleri } = sesKaynagiDosyasiniAyir(
  JSON.parse(readFileSync('src/content/sesKaynagi.json', 'utf8')) as Record<string, unknown>,
);
const temelOzet = (metin: string, clip: { key: string }) => anahtarliKlipOzeti(aktif, anahtarSesleri, clip.key, metin);
const ozetHesapla = (metin: string, clip: { key: string; telaffuz?: Parameters<typeof telaffuzluOzet>[1] }) =>
  telaffuzluOzet(temelOzet(metin, clip), clip.telaffuz);

let dizin: string;
beforeEach(() => {
  dizin = mkdtempSync(path.join(os.tmpdir(), 'tur-telaffuz-'));
});
afterEach(() => rmSync(dizin, { recursive: true, force: true }));

const klipler = (...m: [string, string][]) => turKlipleriniAyir({ klipler: m.map(([anahtar, metin]) => ({ anahtar, metin })) });
const kayit = (o: Record<string, unknown>) => ({ neden: 'kulakla', tarih: '2026-11-17', ...o });

function kos(tum: ReturnType<typeof klipler>, ozetler: Record<string, string>, olcum: (girdi: string) => Olcum, bicimler?: string[]) {
  const istekler: string[] = [];
  const plan = uretimPlani(tum, ozetler, ozetHesapla, (d) => existsSync(path.join(dizin, d)), { zorla: false });
  const defterYol = path.join(dizin, 'defter.json');
  writeFileSync(defterYol, JSON.stringify({ '2026-11': { karakter: 0, istek: 0, guncelleme: '' } }));
  const defter = new Defter(defterYol, 900_000, () => new Date('2026-11-16T12:00:00Z'));
  const sonuc = planiCalistir({
    plan,
    butce: () => defter.durum(),
    sentezle: async (clip) => {
      const hedef = path.join(dizin, clip.file);
      mkdirSync(path.dirname(hedef), { recursive: true });
      await turKlibiSentezle({
        clip,
        hedef,
        synth: async (girdi, gecici) => {
          istekler.push(girdi);
          bicimler?.push(girdiBicimi(clip));
          writeFileSync(gecici, JSON.stringify(olcum(girdi)));
        },
        olc: async (g) => JSON.parse(readFileSync(g, 'utf8')) as Olcum,
        eskiBozuk: false,
        ozetler,
      });
    },
    kaydet: async (clip, ozet) => {
      ozetler[clip.key] = ozet;
    },
    asimdaKaydet: async () => undefined,
  });
  return { plan, sonuc, istekler };
}

describe('telaffuz.json şeması', () => {
  it('metin ya da ssml; ikisi birden ya da hiçbiri hata', () => {
    expect(telaffuzListesiniAyir({ 'tur.hece.en': kayit({ metin: 'En.' }) })['tur.hece.en'].metin).toBe('En.');
    expect(() => telaffuzListesiniAyir({ 'tur.hece.en': kayit({ metin: 'En.', ssml: '<speak>en</speak>' }) })).toThrow(/ikisinden tam biri/);
    expect(() => telaffuzListesiniAyir({ 'tur.hece.en': kayit({}) })).toThrow(/ikisinden tam biri/);
    expect(() => telaffuzListesiniAyir({ 'tur.hece.en': { metin: 'En.', tarih: '2026-11-17' } })).toThrow(); // neden zorunlu
    expect(() => telaffuzListesiniAyir({ 'tur.harf.a': kayit({ metin: 'A.' }) })).toThrow(/Invalid key|anahtar/);
  });

  it('D-11: ayar metni/SSML görünen metni tek ünsüz olamaz', () => {
    expect(() => telaffuzListesiniAyir({ 'tur.hece.en': kayit({ metin: 'N.' }) })).toThrow(/D-11/);
    expect(() => telaffuzListesiniAyir({ 'tur.hece.en': kayit({ ssml: '<speak><phoneme alphabet="ipa" ph="n">n</phoneme></speak>' }) })).toThrow(/D-11/);
    expect(telaffuzListesiniAyir({ 'tur.hece.te': kayit({ ssml: '<speak><phoneme alphabet="ipa" ph="te">te</phoneme></speak>' }) })).toBeTruthy();
  });

  it('SSML: yalnız speak/phoneme/prosody/break; başka etiket hata', () => {
    expect(ssmlGorunenMetin('<speak>a<break time="1s"/><prosody rate="slow">te</prosody></speak>')).toBe('a te');
    expect(() => ssmlGorunenMetin('<speak><say-as interpret-as="characters">te</say-as></speak>')).toThrow(/izinli değil/);
    expect(() => ssmlGorunenMetin('<speak><audio src="x"/>te</speak>')).toThrow(/izinli değil/);
    expect(() => ssmlGorunenMetin('<speak>te <!-- x --></speak>')).toThrow(/izinli değil/);
    expect(() => ssmlGorunenMetin('te')).toThrow(/<speak>/);
    expect(() => telaffuzListesiniAyir({ 'tur.hece.te': kayit({ ssml: '<speak><sub alias="ti">te</sub></speak>' }) })).toThrow(/izinli değil/);
  });

  it('manifestte olmayan anahtar uygulamada hata; dosya yoksa boş', () => {
    const k = klipler(['tur.hece.en', 'en']);
    expect(() => telaffuzUygula(k, telaffuzListesiniAyir({ 'tur.hece.yok': kayit({ metin: 'Yok.' }) }))).toThrow(/klipler.json'da yok/);
    expect(telaffuzListesiniOku(dizin)).toEqual({});
  });

  it('depodaki gerçek telaffuz.json geçerli; ilk üç kayıt', () => {
    const l = telaffuzListesiniOku(process.cwd());
    expect(l['tur.hece.en']).toMatchObject({ metin: 'En.' });
    expect(l['tur.sozcuk.ton']).toMatchObject({ metin: 'Ton.' });
    expect(l['tur.hece.mon']).toMatchObject({ metin: 'Mon.' });
    expect(l['tur.hece.te']).toBeUndefined();
  });

  it('tırtıl: telaffuz "Tırtıl"; depodaki özet bu girdiyle üretilecek özetle aynı (üretim klibi ezmez); kırlent düz', () => {
    const l = telaffuzListesiniOku(process.cwd());
    expect(l['tur.sozcuk.ti2rti2l']).toMatchObject({ metin: 'Tırtıl' });
    expect(l['tur.sozcuk.ki2rlent']).toBeUndefined();
    const { ozetler } = ozetDosyasiniOku(JSON.parse(readFileSync('ders-verisi/tur/ses/.hashes.json', 'utf8')));
    const manifest = turKlipleriniAyir(JSON.parse(readFileSync('ders-verisi/tur/ses/klipler.json', 'utf8')));
    const uygulanmis = telaffuzUygula(manifest, l);
    for (const k of ['tur.sozcuk.ti2rti2l', 'tur.sozcuk.ki2rlent']) {
      const c = uygulanmis.find((x) => x.key === k)!;
      expect(ozetHesapla(c.text, c)).toBe(ozetler[k]);
    }
  });

  it('aile/anne/nine: kulakla seçilen girdiler birebir; depodaki özet bu girdiyle üretilecek özetle aynı', () => {
    const l = telaffuzListesiniOku(process.cwd());
    expect(l['tur.sozcuk.aile']).toMatchObject({ metin: 'Aile' });
    expect(l['tur.sozcuk.anne']).toMatchObject({
      ssml: '<speak><prosody rate="slow"><phoneme alphabet="ipa" ph="anˈne">anne</phoneme></prosody></speak>',
    });
    expect(l['tur.sozcuk.nine']).toMatchObject({
      ssml: '<speak><prosody rate="slow"><phoneme alphabet="ipa" ph="ˈni.ne">nine</phoneme></prosody></speak>',
    });
    const { ozetler } = ozetDosyasiniOku(JSON.parse(readFileSync('ders-verisi/tur/ses/.hashes.json', 'utf8')));
    const manifest = turKlipleriniAyir(JSON.parse(readFileSync('ders-verisi/tur/ses/klipler.json', 'utf8')));
    const uygulanmis = telaffuzUygula(manifest, l);
    for (const k of ['tur.sozcuk.aile', 'tur.sozcuk.anne', 'tur.sozcuk.nine']) {
      const c = uygulanmis.find((x) => x.key === k)!;
      expect(ozetHesapla(c.text, c)).toBe(ozetler[k]);
    }
  });
});

describe('özet (hash) kararı', () => {
  it('ayarsız klibin özeti DEĞİŞMEZ: mevcut .hashes.json özetleriyle birebir', () => {
    const yol = 'ders-verisi/tur/ses/.hashes.json';
    const { ozetler } = ozetDosyasiniOku(JSON.parse(readFileSync(yol, 'utf8')));
    const manifest = turKlipleriniAyir(JSON.parse(readFileSync('ders-verisi/tur/ses/klipler.json', 'utf8')));
    const ayarli = new Set(Object.keys(telaffuzListesiniOku(process.cwd())));
    const ayarsizlar = manifest.filter((c) => !ayarli.has(c.key) && ozetler[c.key] !== undefined);
    expect(ayarsizlar.length).toBeGreaterThan(300);
    // Her ayarsız klip: yeni özet fonksiyonu eskisiyle ve depodaki kayıtla aynı.
    const farkli = ayarsizlar.filter((c) => ozetHesapla(c.text, c) !== ozetler[c.key]);
    expect(farkli.map((c) => c.key)).toEqual([]);
    for (const a of ['tur.hece.ka', 'tur.sozcuk.kale'].filter((k) => ozetler[k])) {
      const c = manifest.find((x) => x.key === a)!;
      expect(ozetHesapla(c.text, c)).toBe(ozetler[a]);
    }
    expect(telaffuzluOzet('abc', undefined)).toBe('abc');
  });

  it('ayar eklenince/değişince özet değişir; tür ayrımı var', () => {
    const t = temelOzet('en', { key: 'tur.hece.en' });
    const a = telaffuzluOzet(t, { metin: 'En.' });
    expect(a).not.toBe(t);
    expect(telaffuzluOzet(t, { metin: 'En!' })).not.toBe(a);
    expect(telaffuzluOzet(t, { ssml: 'En.' })).not.toBe(a);
  });

  it('köken denetimi ayarlı klibin özetini ayarla birlikte bekler', () => {
    const c = { key: 'tur.hece.en', text: 'en', telaffuz: { metin: 'En.' } };
    const ozetler = { 'tur.hece.en': ozetHesapla('en', c) };
    expect(kokenDenetle(aktif, [c], ozetler, anahtarSesleri).eslesmeyen).toEqual([]);
    expect(kokenDenetle(aktif, [{ key: c.key, text: c.text }], ozetler, anahtarSesleri).eslesmeyen).toEqual(['tur.hece.en']);
  });
});

describe('üretim: ayarlı girdi', () => {
  it('ayarlı klip ayarlı girdiyle istenir, ayarsız klip kendi metniyle; klibin text\'i değişmez', async () => {
    const tum = telaffuzUygula(klipler(['tur.hece.en', 'en'], ['tur.hece.ka', 'ka']), telaffuzListesiniAyir({ 'tur.hece.en': kayit({ metin: 'En.' }) }));
    const r = kos(tum, {}, () => IYI);
    await r.sonuc;
    expect(r.istekler).toEqual(['En.', 'ka']);
    expect(tum[0].text).toBe('en');
  });

  it('SSML ayarı: girdi SSML dizesi ve biçim ssml; istek input.ssml ile gider', async () => {
    const ssml = '<speak><phoneme alphabet="ipa" ph="te">te</phoneme></speak>';
    const tum = telaffuzUygula(klipler(['tur.hece.te', 'te']), telaffuzListesiniAyir({ 'tur.hece.te': kayit({ ssml }) }));
    const bicimler: string[] = [];
    const r = kos(tum, {}, () => IYI, bicimler);
    await r.sonuc;
    expect(r.istekler).toEqual([ssml]);
    expect(bicimler).toEqual(['ssml']);
    expect(sentezGirdisi(tum[0])).toBe(ssml);
    const istek = googleIstegi(sentezGirdisi(tum[0]), 'Puck', 0.9, girdiBicimi(tum[0]));
    expect(istek.input).toEqual({ ssml });
    expect('text' in istek.input).toBe(false);
    expect(googleIstegi('ka', 'Puck').input).toEqual({ text: 'ka' });
  });

  it('yeniden denemede ayarlı girdi korunur, "Ka." dönüşümü uygulanmaz; ayarsızda uygulanır', async () => {
    const tum = telaffuzUygula(klipler(['tur.hece.en', 'en'], ['tur.hece.ka', 'ka']), telaffuzListesiniAyir({ 'tur.hece.en': kayit({ metin: 'EN!' }) }));
    const r = kos(tum, {}, (girdi) => (girdi === 'EN!' || girdi === 'ka' ? BOZUK : IYI));
    await r.sonuc;
    // en: 4 deneme, hepsi "EN!" (hepsi bozuk → doğrulanamadı); ka: 1. deneme bozuk, 2. "Ka." geçer.
    expect(r.istekler.filter((g) => g === 'EN!')).toHaveLength(4);
    expect(r.istekler.filter((g) => g !== 'EN!')).toEqual(['ka', 'Ka.']);
  });

  it('ayar eklenince ya da değişince klip yeniden üretilir; değişmeyince atlanır', async () => {
    const ozetler: Record<string, string> = {};
    const k0 = klipler(['tur.hece.en', 'en']);
    await kos(k0, ozetler, () => IYI).sonuc; // ayarsız üretildi
    expect(kos(k0, ozetler, () => IYI).plan.uretilecek).toHaveLength(0);
    const k1 = telaffuzUygula(k0, telaffuzListesiniAyir({ 'tur.hece.en': kayit({ metin: 'En.' }) }));
    const r1 = kos(k1, ozetler, () => IYI);
    expect(r1.plan.uretilecek.map((u) => u.clip.key)).toEqual(['tur.hece.en']);
    await r1.sonuc;
    expect(kos(k1, ozetler, () => IYI).plan.uretilecek).toHaveLength(0);
    const k2 = telaffuzUygula(k0, telaffuzListesiniAyir({ 'tur.hece.en': kayit({ metin: 'En!' }) }));
    expect(kos(k2, ozetler, () => IYI).plan.uretilecek).toHaveLength(1);
  });
});

describe('kota SSML uzunluğunu sayar', () => {
  it('googleSentezle: koruma tüm SSML dizesinin karakterini görür (etiketler dahil)', async () => {
    const ssml = '<speak><phoneme alphabet="ipa" ph="te">te</phoneme></speak>';
    const sayilan: number[] = [];
    const koruma = { istekOncesi: (n: number) => void sayilan.push(n), kaydet: (n: number) => void sayilan.push(-n) };
    const fetchFn = async (_u: unknown, init: { body: string }) => {
      expect(JSON.parse(init.body).input).toEqual({ ssml });
      return new Response(JSON.stringify({ audioContent: Buffer.from('x').toString('base64') }), { status: 200 });
    };
    await googleSentezle(googleIstegi(ssml, 'Puck', 0.9, 'ssml'), 'anahtar', { koruma, fetchFn: fetchFn as never });
    expect(ssml.length).toBeGreaterThan('te'.length * 5);
    expect(sayilan).toEqual([karakterSay(ssml), -karakterSay(ssml)]);
  });

  it('planlama: ayarlı klibin tahmini karakteri girdi uzunluğudur (SSML dahil)', () => {
    const ssml = '<speak><phoneme alphabet="ipa" ph="te">te</phoneme></speak>';
    const tum = telaffuzUygula(klipler(['tur.hece.te', 'te']), telaffuzListesiniAyir({ 'tur.hece.te': kayit({ ssml }) }));
    expect(karakterSay(sentezGirdisi(tum[0]))).toBe(ssml.length);
  });
});
