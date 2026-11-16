/**
 * Türkçe klip ÇIKTI DOĞRULAMASI (sahte sentezleyici + sahte ölçüm; GERÇEK İSTEK YOK):
 * kabul, "Ka." biçimiyle yeniden deneme, 3 başarısızlıkta dosya yok + uyarı listesi, ret listesi, artımlılık
 * (hash klibin gerçek metninden), kota sınırı yeniden denemelerde de, matematik hattının değişmemesi.
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { klipManifestiBeklenen } from '../../scripts/tur/klip-manifesti';
import { anahtarliKlipOzeti, sesKaynagiDosyasiniAyir } from '../../scripts/ses/sesKaynagi';
import { Defter, karakterSay } from '../../scripts/ses/ucretsizKatman';
import { planiCalistir } from '../../scripts/ses/uretimDongusu';
import { uretimPlani } from '../../scripts/ses/uretimPlani';
import {
  ESIKLER,
  ffmpegOlcum,
  maxSesAyikla,
  turKlibiSentezle,
  mevcutlariDogrula,
  olcumSorunu,
  yenidenDenemeMetni,
  YENIDEN_DENEME_SAYISI,
  type Olcum,
} from '../../scripts/ses/turDogrulama';
import { retListesiniAyir, retListesiniOku, retListesiniUygula, turKlipDiskteVarMi, turKlipleriniAyir } from '../../scripts/ses/turKlipleri';

const IYI: Olcum = { sure: 0.8, maxSesDb: -3 };
const BOZUK: Olcum = { sure: 0.22, maxSesDb: -48 };

const { aktif, anahtarSesleri } = sesKaynagiDosyasiniAyir(
  JSON.parse(readFileSync('src/content/sesKaynagi.json', 'utf8')) as Record<string, unknown>,
);
const ozetHesapla = (metin: string, clip: { key: string }) => anahtarliKlipOzeti(aktif, anahtarSesleri, clip.key, metin);

let dizin: string;
beforeEach(() => {
  dizin = mkdtempSync(path.join(os.tmpdir(), 'tur-dogrulama-'));
});
afterEach(() => rmSync(dizin, { recursive: true, force: true }));

function defterKur(kullanilan: number, sinir = 900_000): Defter {
  const yol = path.join(dizin, 'defter.json');
  writeFileSync(yol, JSON.stringify({ '2026-11': { karakter: kullanilan, istek: 0, guncelleme: '' } }));
  return new Defter(yol, sinir, () => new Date('2026-11-16T12:00:00Z'));
}

const klipler = (...metinler: [string, string][]) =>
  turKlipleriniAyir({ klipler: metinler.map(([anahtar, metin]) => ({ anahtar, metin })) });

/**
 * generate-audio.ts'in Türkçe koşusunun aynısı: ret → (yeniden-doğrula) → plan → planiCalistir → `turKlibiSentezle`
 * (gerçek kapanış, GERÇEK dosya sistemi: geçici yol + rename). Yalnız sentez (defter denetimi; "ses" = ölçümü
 * taşıyan küçük JSON) ve ölçüm (dosyayı okur) sahte.
 */
const DOSYALAR = () => path.join(dizin, 'ses');
const yol = (dosya: string) => path.join(DOSYALAR(), dosya);
function diskeKoy(dosya: string, olcum: Olcum | string): void {
  mkdirSync(path.dirname(yol(dosya)), { recursive: true });
  writeFileSync(yol(dosya), typeof olcum === 'string' ? olcum : JSON.stringify(olcum));
}
const diskte = (dosya: string) => existsSync(yol(dosya));
const dizinDokumu = (): string[] => {
  const t: string[] = [];
  const gez = (d: string, on = '') => {
    if (!existsSync(d)) return;
    for (const e of readdirSync(d, { withFileTypes: true })) (e.isDirectory() ? gez(path.join(d, e.name), `${on}${e.name}/`) : t.push(`${on}${e.name}`));
  };
  gez(DOSYALAR());
  return t.sort();
};

function kos(
  tum: ReturnType<typeof klipler>,
  o: {
    defter: Defter;
    ozetler: Record<string, string>;
    olcum: (anahtar: string, girdi: string) => Olcum;
    ret?: Parameters<typeof retListesiniUygula>[1];
    /** `--yeniden-dogrula` ile bozuk saptanan eski dosyalar. */
    eskiBozuk?: Set<string>;
    sentezHatasi?: Error;
    olcHatasi?: Error;
    zorla?: boolean;
  },
) {
  const istekler: { anahtar: string; girdi: string }[] = [];
  const { uretilebilir } = retListesiniUygula(tum, o.ret ?? {});
  const plan = uretimPlani(uretilebilir, o.ozetler, ozetHesapla, diskte, { zorla: o.zorla ?? false });
  const sonuc = planiCalistir({
    plan,
    butce: () => o.defter.durum(),
    sentezle: async (clip) => {
      const hedef = yol(clip.file);
      mkdirSync(path.dirname(hedef), { recursive: true });
      await turKlibiSentezle({
        clip,
        hedef,
        synth: async (girdi, gecici) => {
          o.defter.istekOncesi(karakterSay(girdi));
          if (o.sentezHatasi) throw o.sentezHatasi;
          istekler.push({ anahtar: clip.key, girdi });
          o.defter.kaydet(karakterSay(girdi));
          writeFileSync(gecici, JSON.stringify(o.olcum(clip.key, girdi)));
        },
        olc: async (g) => {
          if (o.olcHatasi) throw o.olcHatasi;
          return JSON.parse(readFileSync(g, 'utf8')) as Olcum;
        },
        eskiBozuk: o.eskiBozuk?.has(clip.key) ?? false,
        ozetler: o.ozetler,
      });
    },
    kaydet: async (clip, ozet) => {
      o.ozetler[clip.key] = ozet;
    },
    asimdaKaydet: async () => undefined,
  });
  return { plan, sonuc, istekler };
}

describe('doğrulama + yeniden deneme (sahte sentez/ölçüm, gerçek dosya kapanışı)', () => {
  it('iyi klip ilk denemede kabul: tek istek, girdi klibin kendi metni, geçici dosya kalmaz', async () => {
    const k = klipler(['tur.hece.ka', 'ka']);
    const r = kos(k, { defter: defterKur(0), ozetler: {}, olcum: () => IYI });
    const s = await r.sonuc;
    expect(s.made).toBe(1);
    expect(s.dogrulanamayan).toEqual([]);
    expect(r.istekler).toEqual([{ anahtar: 'tur.hece.ka', girdi: 'ka' }]);
    expect(dizinDokumu()).toEqual(['hece/ka.m4a']);
  });

  it('bozuk klip → "Ka." biçimiyle yeniden denenir → kabul; ikinci koşuda yeniden üretilmez (hash gerçek metinden)', async () => {
    const k = klipler(['tur.hece.ka', 'ka'], ['tur.sozcuk.ilk', 'ilk']);
    const ozetler: Record<string, string> = {};
    const defter = defterKur(0);
    const olcum = (_a: string, girdi: string) => (girdi === 'ka' || girdi === 'ilk' ? BOZUK : IYI);
    const bir = kos(k, { defter, ozetler, olcum });
    expect((await bir.sonuc).made).toBe(2);
    expect(bir.istekler.map((i) => i.girdi)).toEqual(['ka', 'Ka.', 'ilk', 'İlk.']);
    expect(dizinDokumu()).toEqual(['hece/ka.m4a', 'sozcuk/ilk.m4a']);
    expect(ozetler['tur.hece.ka']).toBe(ozetHesapla('ka', { key: 'tur.hece.ka' }));
    const iki = kos(k, { defter, ozetler, olcum });
    expect(iki.plan.uretilecek).toHaveLength(0);
    expect((await iki.sonuc).made).toBe(0);
    expect(iki.istekler).toHaveLength(0);
  });

  it('1 + 3 denemede de geçmeyen YENİ klip: dosya YOK, hash yok, eksik, uyarı listesi; art arda 3 olsa da döngü durmaz', async () => {
    const k = klipler(['tur.hece.a1', 'ka'], ['tur.hece.a2', 'ke'], ['tur.hece.a3', 'ki'], ['tur.hece.a4', 'ko'], ['tur.hece.iyi', 'ku']);
    const ozetler: Record<string, string> = {};
    const r = kos(k, { defter: defterKur(0), ozetler, olcum: (a) => (a.endsWith('iyi') ? IYI : BOZUK) });
    const s = await r.sonuc;
    expect(YENIDEN_DENEME_SAYISI).toBe(3);
    expect(r.istekler.filter((i) => i.anahtar === 'tur.hece.a1')).toHaveLength(4);
    expect(s.dogrulanamayan).toHaveLength(4);
    expect(s.dogrulanamayan[0]).toMatch(/tur\.hece\.a1: doğrulamadan geçmedi/);
    expect(s.failures).toEqual([]);
    expect(s.durduruldu).toBe(false);
    expect(s.made).toBe(1);
    expect(dizinDokumu()).toEqual(['hece/iyi.m4a']);
    expect(Object.keys(ozetler)).toEqual(['tur.hece.iyi']);
  });

  it('ret listesindeki klip istek almaz; diğerleri üretilir', async () => {
    const k = klipler(['tur.sozcuk.ok', 'ok'], ['tur.sozcuk.kale', 'kale']);
    const r = kos(k, { defter: defterKur(0), ozetler: {}, olcum: () => IYI, ret: { 'tur.sozcuk.ok': { neden: 'oke', tarih: '2026-11-16' } } });
    await r.sonuc;
    expect(r.istekler.map((i) => i.anahtar)).toEqual(['tur.sozcuk.kale']);
  });

  it('kota sınırı yeniden denemelerde de durdurur; YENİ klipte dosya kalmaz, istek sınırı aşılmaz', async () => {
    const defter = defterKur(899_990, 900_000); // kalan 10: "ka"(2) + "Ka."(3) + "Ka."(3) = 8, dördüncü (3) sığmaz
    const r = kos(klipler(['tur.hece.ka', 'ka']), { defter, ozetler: {}, olcum: () => BOZUK });
    await expect(r.sonuc).rejects.toThrow(/ÜCRETSİZ KATMAN KORUMASI/);
    expect(r.istekler).toHaveLength(3);
    expect(defter.durum().kullanilan).toBe(899_998);
    expect(dizinDokumu()).toEqual([]);
  });

  it('ölçüm hatası (ffmpeg yok) "geçti" sayılmaz: hata fırlar, yeni dosya yerleşmez', async () => {
    const r = kos(klipler(['tur.hece.ka', 'ka']), { defter: defterKur(0), ozetler: {}, olcum: () => IYI, olcHatasi: new Error('spawn ffmpeg ENOENT') });
    const s = await r.sonuc;
    expect(s.made).toBe(0);
    expect(s.failures[0]).toMatch(/ENOENT/);
    expect(dizinDokumu()).toEqual([]);
  });
});

describe('ESKİ İYİ dosya hata anında korunur (özet de)', () => {
  const eskiOzet = 'ESKI-OZET';
  const kur = () => {
    diskeKoy('hece/ka.m4a', 'ESKI-IYI-SES');
    return { k: klipler(['tur.hece.ka', 'ka']), ozetler: { 'tur.hece.ka': eskiOzet } as Record<string, string> };
  };
  const eskiDurur = (ozetler: Record<string, string>) => {
    expect(readFileSync(yol('hece/ka.m4a'), 'utf8')).toBe('ESKI-IYI-SES');
    expect(ozetler['tur.hece.ka']).toBe(eskiOzet);
    expect(dizinDokumu()).toEqual(['hece/ka.m4a']); // geçici dosya yok
  };

  it('(a) --zorla + kota koruması atıyor → dosya ve özet duruyor', async () => {
    const { k, ozetler } = kur();
    const r = kos(k, { defter: defterKur(899_999, 900_000), ozetler, olcum: () => IYI, zorla: true });
    // çalışma başı tahmin (2 karakter > kalan 1) zaten durdurur; istek öncesi koruma da aynı yolda
    await expect(r.sonuc).rejects.toThrow(/ÜCRETSİZ KATMAN KORUMASI/);
    eskiDurur(ozetler);
    // tahmin geçer, istek anında aşım: ilk deneme bozuk → yeniden denemede kota aşılır
    const d2 = defterKur(899_992, 900_000); // kalan 8: ilk "ka"(2) sığar, sonra "Ka."(3)+"Ka."(3) = 8, dördüncü sığmaz
    const r2 = kos(k, { defter: d2, ozetler, olcum: () => BOZUK, zorla: true });
    await expect(r2.sonuc).rejects.toThrow(/ÜCRETSİZ KATMAN KORUMASI/);
    eskiDurur(ozetler);
  });

  it('(b) --zorla + sentez/ağ hatası → dosya ve özet duruyor (3 art arda hata durdursa bile)', async () => {
    const { k, ozetler } = kur();
    const r = kos(k, { defter: defterKur(0), ozetler, olcum: () => IYI, sentezHatasi: new Error('fetch failed'), zorla: true });
    const s = await r.sonuc;
    expect(s.failures[0]).toMatch(/fetch failed/);
    expect(s.dogrulanamayan).toEqual([]);
    eskiDurur(ozetler);
  });

  it('(c) yeni çıktı ölçümden geçmiyor (1 + 3 deneme) → eski dosya ve özet duruyor, klip uyarı listesinde', async () => {
    const { k, ozetler } = kur();
    const r = kos(k, { defter: defterKur(0), ozetler, olcum: () => BOZUK, zorla: true });
    const s = await r.sonuc;
    expect(r.istekler).toHaveLength(4);
    expect(s.dogrulanamayan).toHaveLength(1);
    eskiDurur(ozetler);
  });

  it('ölçüm aracı yok (ffmpeg hatası) → eski dosya ve özet duruyor', async () => {
    const { k, ozetler } = kur();
    const r = kos(k, { defter: defterKur(0), ozetler, olcum: () => IYI, olcHatasi: new Error('ENOENT'), zorla: true });
    expect((await r.sonuc).failures).toHaveLength(1);
    eskiDurur(ozetler);
  });

  it('başarılı yeni çıktı eski dosyanın yerini alır (atomik), geçici kalmaz', async () => {
    const { k, ozetler } = kur();
    const r = kos(k, { defter: defterKur(0), ozetler, olcum: () => IYI, zorla: true });
    expect((await r.sonuc).made).toBe(1);
    expect(readFileSync(yol('hece/ka.m4a'), 'utf8')).toBe(JSON.stringify(IYI));
    expect(ozetler['tur.hece.ka']).toBe(ozetHesapla('ka', { key: 'tur.hece.ka' }));
    expect(dizinDokumu()).toEqual(['hece/ka.m4a']);
  });
});

describe('--yeniden-dogrula ile bozuk saptanan ESKİ dosya', () => {
  const kur = () => {
    diskeKoy('hece/ka.m4a', BOZUK);
    return { k: klipler(['tur.hece.ka', 'ka']), ozetler: { 'tur.hece.ka': 'ESKI' } as Record<string, string>, eskiBozuk: new Set(['tur.hece.ka']) };
  };

  it('(d) 4 deneme de doğrulamada düşerse eski bozuk dosya ve özeti silinir → eksik', async () => {
    const { k, ozetler, eskiBozuk } = kur();
    const r = kos(k, { defter: defterKur(0), ozetler, olcum: () => BOZUK, eskiBozuk, zorla: true });
    const s = await r.sonuc;
    expect(r.istekler).toHaveLength(4);
    expect(s.dogrulanamayan).toHaveLength(1);
    expect(dizinDokumu()).toEqual([]);
    expect('tur.hece.ka' in ozetler).toBe(false);
  });

  it('kota/ağ hatasında bozuk eski dosya BİLE silinmez (klip karara bağlanmadı; sonraki koşu yeniden dener)', async () => {
    const { k, ozetler, eskiBozuk } = kur();
    const r = kos(k, { defter: defterKur(0), ozetler, olcum: () => IYI, eskiBozuk, sentezHatasi: new Error('fetch failed'), zorla: true });
    await r.sonuc;
    expect(dizinDokumu()).toEqual(['hece/ka.m4a']);
    expect(ozetler['tur.hece.ka']).toBe('ESKI');
  });

  it('yeniden denemede düzelirse yeni dosya eskinin yerine geçer', async () => {
    const { k, ozetler, eskiBozuk } = kur();
    const r = kos(k, { defter: defterKur(0), ozetler, olcum: (_a, g) => (g === 'ka' ? BOZUK : IYI), eskiBozuk, zorla: true });
    expect((await r.sonuc).made).toBe(1);
    expect(JSON.parse(readFileSync(yol('hece/ka.m4a'), 'utf8'))).toEqual(IYI);
    expect(dizinDokumu()).toEqual(['hece/ka.m4a']);
  });
});

describe('eşikler ve girdi dönüşümü', () => {
  it('eşik sınırları', () => {
    expect(olcumSorunu('tur.hece.ka', { sure: ESIKLER.ENAZ_SURE_SN, maxSesDb: ESIKLER.ENAZ_MAX_SES_DB })).toBeNull();
    expect(olcumSorunu('tur.hece.ka', { sure: 0.34, maxSesDb: -3 })).toMatch(/süre/);
    expect(olcumSorunu('tur.hece.ka', { sure: 0.8, maxSesDb: -15.1 })).toMatch(/max_volume/);
    expect(olcumSorunu('tur.hece.ka', { sure: 0.8, maxSesDb: -Infinity })).toMatch(/max_volume/);
    expect(olcumSorunu('tur.sozcuk.ok', { sure: 1.61, maxSesDb: -3 })).toMatch(/fazladan/);
    expect(olcumSorunu('tur.hece.ka', { sure: 1.6, maxSesDb: -3 })).toBeNull();
    // üst sınır yalnız hece/sözcük; cümle ve yönerge uzun olabilir
    expect(olcumSorunu('tur.cumle.c201', { sure: 3, maxSesDb: -3 })).toBeNull();
    expect(olcumSorunu('tur.yonerge.t05-model', { sure: 6, maxSesDb: -3 })).toBeNull();
    expect(olcumSorunu('tur.hece.ka', { sure: Number.NaN, maxSesDb: -3 })).not.toBeNull();
  });

  it('yeniden deneme metni: yalnız ilk harf büyük (tr-TR) + yoksa nokta', () => {
    expect(yenidenDenemeMetni('ka')).toBe('Ka.');
    expect(yenidenDenemeMetni('ilk')).toBe('İlk.');
    expect(yenidenDenemeMetni('ıs')).toBe('Is.');
    expect(yenidenDenemeMetni('kale')).toBe('Kale.');
    expect(yenidenDenemeMetni('Ali geldi.')).toBe('Ali geldi.');
    expect(yenidenDenemeMetni('elma var mı?')).toBe('Elma var mı?');
    expect(yenidenDenemeMetni('çiçek')).toBe('Çiçek.');
    expect(yenidenDenemeMetni('ev, ')).toBe('Ev,'); // virgül/parantez gibi bitişe nokta eklenmez
    expect(yenidenDenemeMetni('(ev)')).toBe('(ev)');
    expect(yenidenDenemeMetni('a3')).toBe('A3.');
  });

  it('volumedetect ayrıştırma; max_volume yoksa hata', () => {
    expect(maxSesAyikla('[Parsed_volumedetect_0 @ 0x1] max_volume: -12.3 dB\n')).toBe(-12.3);
    expect(maxSesAyikla('max_volume: -inf dB')).toBe(-Infinity);
    expect(maxSesAyikla('max_volume: 0.0 dB')).toBe(0);
    expect(() => maxSesAyikla('Invalid data found')).toThrow();
  });

  it('mevcutlariDogrula: istek atmadan ölçer, yalnız diskte olanlara bakar, geçmeyenleri listeler; ölçüm hatası fırlar', async () => {
    const k = klipler(['tur.hece.ka', 'ka'], ['tur.hece.ke', 'ke'], ['tur.hece.ki', 'ki']);
    const r = await mevcutlariDogrula(k, (d) => d !== 'hece/ki.m4a', (d) => `/x/${d}`, async (y) => (y.endsWith('ka.m4a') ? BOZUK : IYI));
    expect(r.olculen).toBe(2);
    expect(r.gecmeyen.map((g) => g.anahtar)).toEqual(['tur.hece.ka']);
    await expect(
      mevcutlariDogrula(k, () => true, (d) => d, async () => {
        throw new Error('ffprobe yok');
      }),
    ).rejects.toThrow(/ffprobe yok/);
  });

  it('ffmpegOlcum: araç yoksa HATA (sessizce geçmez)', async () => {
    await expect(ffmpegOlcum('/yok/ffprobe', '/yok/ffmpeg')('/yok/a.m4a')).rejects.toThrow();
  });

  const ffmpegVar = (() => {
    try {
      execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
      execFileSync('ffprobe', ['-version'], { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  })();
  it.skipIf(!ffmpegVar)('gerçek ffmpeg ölçümü: sinüs geçer, sessizlik geçmez', async () => {
    const ses = path.join(dizin, 'sinus.m4a');
    const sessiz = path.join(dizin, 'sessiz.m4a');
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=1,volume=4', '-c:a', 'aac', ses]);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=24000:cl=mono', '-t', '1', '-c:a', 'aac', sessiz]);
    const olc = ffmpegOlcum();
    const a = await olc(ses);
    expect(a.sure).toBeGreaterThan(0.9);
    expect(olcumSorunu('tur.hece.ka', a)).toBeNull();
    expect(olcumSorunu('tur.hece.ka', await olc(sessiz))).toMatch(/max_volume/);
  });
});

describe('ret listesi (kulakla reddedilen)', () => {
  it('şema: geçerli kabul; bozuk anahtar / boş neden / kötü tarih / fazladan alan hata', () => {
    expect(retListesiniAyir({ 'tur.sozcuk.ok': { neden: 'oke', tarih: '2026-11-16' } })).toHaveProperty('tur.sozcuk.ok');
    expect(retListesiniAyir({})).toEqual({});
    expect(() => retListesiniAyir({ 'mat.sayi.1': { neden: 'x', tarih: '2026-11-16' } })).toThrow(/reddedilen\.json/);
    expect(() => retListesiniAyir({ 'tur.sozcuk.ok': { neden: ' ', tarih: '2026-11-16' } })).toThrow();
    expect(() => retListesiniAyir({ 'tur.sozcuk.ok': { neden: 'x', tarih: '16.11.2026' } })).toThrow();
    expect(() => retListesiniAyir({ 'tur.sozcuk.ok': { neden: 'x', tarih: '2026-11-16', fazla: 1 } })).toThrow();
    expect(() => retListesiniAyir([])).toThrow();
  });

  it('depodaki reddedilen.json geçerli ve her anahtarı klipler.json içinde', () => {
    const ret = retListesiniOku(process.cwd());
    expect(Object.keys(ret)).toContain('tur.sozcuk.ok');
    const anahtarlar = new Set((JSON.parse(readFileSync('ders-verisi/tur/ses/klipler.json', 'utf8')) as { klipler: { anahtar: string }[] }).klipler.map((c) => c.anahtar));
    for (const k of Object.keys(ret)) expect(anahtarlar.has(k)).toBe(true);
  });

  it('reddedilen klibin dosyası diskte olsa da durum "eksik" (tur:klip/validate/çalıcı aynı kararı görür); diğeri "var"', () => {
    const kok = path.join(dizin, 'depo');
    const ses = path.join(kok, 'ders-verisi/tur/ses');
    mkdirSync(path.join(kok, 'ders-verisi/tur/icerik'), { recursive: true });
    for (const f of ['sozcukler.json', 'cumleler.json']) copyFileSync(`ders-verisi/tur/icerik/${f}`, path.join(kok, 'ders-verisi/tur/icerik', f));
    mkdirSync(path.join(ses, 'sozcuk'), { recursive: true });
    writeFileSync(path.join(ses, 'sozcuk/ok.m4a'), 'x');
    writeFileSync(path.join(ses, 'sozcuk/kale.m4a'), 'x');
    const durumlar = () =>
      new Map((JSON.parse(klipManifestiBeklenen(kok)) as { klipler: { anahtar: string; durum: string }[] }).klipler.map((c) => [c.anahtar, c.durum]));
    // ret listesi yokken ikisi de var
    expect(durumlar().get('tur.sozcuk.ok')).toBe('var');
    writeFileSync(path.join(ses, 'reddedilen.json'), JSON.stringify({ 'tur.sozcuk.ok': { neden: 'oke', tarih: '2026-11-16' } }));
    expect(durumlar().get('tur.sozcuk.ok')).toBe('eksik');
    expect(durumlar().get('tur.sozcuk.kale')).toBe('var');
    expect(turKlipDiskteVarMi(kok)('sozcuk/ok.m4a')).toBe(false);
    expect(existsSync(path.join(ses, 'sozcuk/ok.m4a'))).toBe(true); // dosya silinmez, yalnız yok sayılır
  });
});

describe('matematik hattı değişmez', () => {
  it('planiCalistir: doğrulama alanı boş, 3 art arda hata yine durdurur, başarısızlık failures\'a girer', async () => {
    const c = (n: number) => ({ key: `ui.k${n}`, text: `m${n}`, file: `ui/k${n}.m4a`, core: false });
    const plan = { uretilecek: [1, 2, 3, 4, 5].map((n) => ({ clip: c(n), ozet: 'o' })), atlanan: 0, kalan: 0 };
    const s = await planiCalistir({
      plan,
      sentezle: async () => {
        throw new Error('503');
      },
      kaydet: async () => undefined,
      asimdaKaydet: async () => undefined,
    });
    expect(s.dogrulanamayan).toEqual([]);
    expect(s.failures).toHaveLength(3);
    expect(s.durduruldu).toBe(true);
  });
});
