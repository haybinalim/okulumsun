/**
 * Ses içerik denetimi (STT) — SAHTE STT; gerçek whisper çağrısı YOK (CI'da whisper yok).
 * Normalleştirme, sayı eşleme, benzerlik/eşik kararı, kısa-klip ayrımı, önbellek, süzgeç, çıkış kodu, sessiz-hata.
 */
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  anahtarSuz,
  cikisKodu,
  denetle,
  dosyaOzeti,
  onbellekOku,
  onbellekten,
  ozetle,
  sttHazirMi,
  type GirisKlip,
  type Onbellek,
} from '../../scripts/ses/icerikDenetimi';
import {
  benzerlik,
  cokKisaMi,
  harfDizisi,
  karar,
  KISA_HARF_ESIGI,
  levenshtein,
  VARSAYILAN_ESIK,
  normallestir,
  sayiyiSiraYaziyaCevir,
  siraMi,
  sayiyiYaziyaCevir,
} from '../../scripts/ses/sttKarsilastirma';

describe('normallestir', () => {
  it('tr-TR küçük harf: İ→i, I→ı (ASCII lower değil)', () => {
    expect(normallestir('İZMİR ILIK')).toBe('izmir ılık');
  });
  it('noktalama ve fazla boşluk atılır; kesme işareti sessiz silinir', () => {
    expect(normallestir('  Merhaba,   dünya!  ')).toBe('merhaba dünya');
    expect(normallestir("Ali'nin topu")).toBe('alinin topu');
  });
  it('ç ğ ı ö ş ü ayrı harf kalır, â î û düzleşir', () => {
    expect(normallestir('çğıöşü')).toBe('çğıöşü');
    expect(normallestir('kâğıt')).toBe('kağıt');
  });
});

describe('sayı eşleme', () => {
  it('rakam yazıya çevrilir (0-100, 200 turkishNumber; ötesi yerel)', () => {
    expect(normallestir('7')).toBe('yedi');
    expect(normallestir('200')).toBe('iki yüz');
    expect(sayiyiYaziyaCevir(1234)).toBe('bin iki yüz otuz dört');
    expect(sayiyiYaziyaCevir(100000)).toBe('yüz bin');
  });
  it("whisper sıra sayısını '4.' ya da rakamı '1 6' diye yazarsa eşleşir (adaylar)", () => {
    expect(sayiyiSiraYaziyaCevir(4)).toBe('dördüncü');
    expect(sayiyiSiraYaziyaCevir(13)).toBe('on üçüncü');
    expect(benzerlik('dördüncü', '4.')).toBe(1);
    expect(benzerlik('on yedinci', '17.')).toBe(1);
    expect(benzerlik('on altı', '1 6')).toBe(1);
    expect(benzerlik('dört', '5.')).toBeLessThan(0.5);
  });
  it("'4.' beklenene göre TEK anlam alır: kardinal 'dört' beklenirken 'dördüncü' sesi geçmez (sıra/kardinal karışması)", () => {
    expect(siraMi('dördüncü')).toBe(true);
    expect(siraMi('on üçüncü')).toBe(true);
    expect(siraMi('dört')).toBe(false);
    expect(benzerlik('dört', '4.')).toBe(1); // kardinal beklenen, "4." = dört
    expect(benzerlik('dördüncü', '4')).toBeLessThan(0.7); // sıra beklenen, çıplak rakam = kardinal
    // ses "dördüncü" söylüyor ama beklenen "dört": STT "dördüncü" yazarsa şüpheli
    expect(benzerlik('dört', 'dördüncü')).toBeLessThan(0.7);
    expect(karar('dört kalem', '4. kalem', 0.95).durum).toBe('gecti');
    expect(karar('dördüncü kalem', '4 kalem', 0.95).durum).toBe('supheli');
  });
  it("'10'a' ile 'ona' aynı harf dizisine iner (iki yönlü eşleme)", () => {
    expect(harfDizisi("10'a tamamlamak")).toBe(harfDizisi('ona tamamlamak'));
    expect(benzerlik('yedi', '7')).toBe(1);
    expect(benzerlik('7', 'yedi')).toBe(1);
  });
});

describe('benzerlik / karar', () => {
  it('iki taraf da boşsa benzerlik 1 değil 0 (boş = aynı sayılmaz)', () => {
    expect(benzerlik('', '')).toBe(0);
    expect(benzerlik('...', ' ')).toBe(0);
  });
  it('levenshtein klasik değerler', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein('', 'abc')).toBe(3);
  });
  it('noktalama/büyük harf/boşluk farkı benzerliği düşürmez', () => {
    expect(benzerlik('Mine süt alır.', 'mine  süt alır')).toBe(1);
    expect(benzerlik('birlikte sayalım', 'bir likte sayalım')).toBe(1);
  });
  it('geçti: eşik üstü; şüpheli: eşik altı', () => {
    expect(karar('Annem elma alır.', 'Annem elma alır.').durum).toBe('gecti');
    const k = karar('Annem elma alır.', 'Babam kitap okur.');
    expect(k.durum).toBe('supheli');
    expect(k.neden).toMatch(/eşik/);
  });
  it('eşik yapılandırılabilir: aynı çift düşük eşikte geçer, yüksek eşikte kalır', () => {
    const bek = 'Mine süt alır.';
    const duy = 'Mina süt alır.';
    expect(karar(bek, duy, 0.8).durum).toBe('gecti');
    expect(karar(bek, duy, 0.95).durum).toBe('supheli');
  });
  it('varsayılan eşik 0,95: tek harflik "Mine/Mina" hatası varsayılanda şüpheli', () => {
    expect(VARSAYILAN_ESIK).toBe(0.95);
    expect(karar('Mine süt alır.', 'Mina süt alır.').durum).toBe('supheli');
  });
  it('boş transkript hiçbir eşikte geçmez', () => {
    const k = karar('Annem elma alır.', '', 0);
    expect(k.durum).toBe('supheli');
    expect(k.neden).toBe('boş transkript');
    expect(karar('Annem elma alır.', ' .. ', 0).durum).toBe('supheli');
  });
});

describe('kısa klip ayrımı (kulak gerekli)', () => {
  it(`beklenen metinde en çok ${KISA_HARF_ESIGI} harf → kulak; başarısız sayılmaz`, () => {
    expect(cokKisaMi('üç')).toBe(true);
    expect(cokKisaMi('Kale')).toBe(true); // 4 harf = sınır
    expect(cokKisaMi('Kalem.')).toBe(false);
    const k = karar('üç', 'bu');
    expect(k.durum).toBe('kulak');
    expect(k.neden).toMatch(/güvenilmez/);
  });
  it('kulak, STT yanlış duysa da şüpheli olmaz; uzun metin yanlışsa şüpheli olur', () => {
    expect(karar('ka', 'xyz').durum).toBe('kulak');
    expect(karar('kalem', 'xyz').durum).toBe('supheli');
  });
  it('kısa klipte tam eşleşme geçer (güçlü kanıt), tam olmayan kulak kalır; kapatılınca hepsi kulak', () => {
    expect(karar('al', 'Al.').durum).toBe('gecti');
    expect(karar('al', 'Ol.').durum).toBe('kulak');
    expect(karar('al', 'Al.', 0.85, KISA_HARF_ESIGI, false).durum).toBe('kulak');
  });
  it('eşik harf sayısı parametre', () => {
    expect(cokKisaMi('kalem', 5)).toBe(true);
    expect(cokKisaMi('kalem')).toBe(false);
  });
});

describe('denetle (sahte STT)', () => {
  let dizin: string;
  beforeEach(() => {
    dizin = mkdtempSync(path.join(os.tmpdir(), 'ses-icerik-'));
  });
  afterEach(() => rmSync(dizin, { recursive: true, force: true }));

  const klip = (key: string, text: string, icerik = key): GirisKlip => {
    const dosya = path.join(dizin, `${key}.m4a`);
    mkdirSync(path.dirname(dosya), { recursive: true });
    writeFileSync(dosya, icerik);
    return { key, text, dosya };
  };
  /** Sahte STT: klibin dosya adına göre sabit metin döner; çağrı sayısı sayılır. */
  const sahte = (cevaplar: Record<string, string>) =>
    vi.fn(async (yol: string) => cevaplar[path.basename(yol, '.m4a')] ?? '');

  it('geçti / şüpheli / kulak / eksik ayrı sınıflanır; sıra girdi sırası', async () => {
    const klipler = [
      klip('a', 'Annem elma alır.'),
      klip('b', 'Mine süt alır.'),
      klip('c', 'üç'),
      { key: 'd', text: 'Kar erir.', dosya: path.join(dizin, 'yok.m4a') },
    ];
    const stt = sahte({ a: 'Annem elma alır.', b: 'Kedi uyur burada.', c: 'bu' });
    const satirlar = await denetle(klipler, { stt, model: 'm' });
    expect(satirlar.map((s) => [s.anahtar, s.durum])).toEqual([
      ['a', 'gecti'],
      ['b', 'supheli'],
      ['c', 'kulak'],
      ['d', 'eksik'],
    ]);
    expect(satirlar[1]).toMatchObject({ beklenen: 'Mine süt alır.', duyulan: 'Kedi uyur burada.' });
    expect(satirlar[3].neden).toBe('ses dosyası yok');
    expect(stt).toHaveBeenCalledTimes(3); // eksik dosya için STT çağrılmaz
  });

  it('boş transkript şüpheli (geçti DEĞİL) ve önbelleğe girmez', async () => {
    const onbellek: Onbellek = {};
    const klipler = [klip('a', 'Annem elma alır.')];
    const [s] = await denetle(klipler, { stt: sahte({}), model: 'm', onbellek });
    expect(s.durum).toBe('supheli');
    expect(onbellek).toEqual({});
  });

  it('tüm transkriptler boşsa araç bozuk sayılıp HATA verir (şüpheli yığını olarak gizlenmez)', async () => {
    const klipler = Array.from({ length: 12 }, (_, i) => klip(`k${i}`, 'Annem elma alır.'));
    await expect(denetle(klipler, { stt: sahte({}), model: 'm' })).rejects.toThrow(/boş metin/);
  });

  it('STT hatası yutulmaz: fırlatır', async () => {
    const stt = vi.fn(async () => {
      throw new Error('whisper çöktü');
    });
    await expect(denetle([klip('a', 'Annem elma alır.')], { stt, model: 'm' })).rejects.toThrow('whisper çöktü');
  });

  it('önbellek: ikinci koşuda STT çağrılmaz; ses değişince ya da model değişince yeniden çözülür', async () => {
    const onbellek: Onbellek = {};
    const k1 = klip('a', 'Annem elma alır.', 'ses-1');
    const stt = sahte({ a: 'Annem elma alır.' });

    await denetle([k1], { stt, model: 'small', onbellek });
    expect(stt).toHaveBeenCalledTimes(1);

    const ikinci = await denetle([k1], { stt, model: 'small', onbellek });
    expect(stt).toHaveBeenCalledTimes(1);
    expect(ikinci[0]).toMatchObject({ durum: 'gecti', onbellek: true });

    // Karşı parça: üretim hattı klibi yeniden ürettiğinde (bayt değişir) önbellek geçersiz.
    const k2 = klip('a', 'Annem elma alır.', 'ses-2-yeniden-uretildi');
    await denetle([k2], { stt, model: 'small', onbellek });
    expect(stt).toHaveBeenCalledTimes(2);

    // Model değişince de geçersiz.
    await denetle([k2], { stt, model: 'base', onbellek });
    expect(stt).toHaveBeenCalledTimes(3);
  });

  it('önbellek yalnız duyulan metni saklar: eşik/beklenen değişince karar yeniden verilir', async () => {
    const onbellek: Onbellek = {};
    const k = klip('a', 'Mine süt alır.');
    const stt = sahte({ a: 'Mina süt alır.' });
    expect((await denetle([k], { stt, model: 'm', onbellek, esik: 0.8 }))[0].durum).toBe('gecti');
    const yine = await denetle([k], { stt, model: 'm', onbellek, esik: 0.95 });
    expect(yine[0]).toMatchObject({ durum: 'supheli', onbellek: true });
    expect(stt).toHaveBeenCalledTimes(1);
  });

  it('önbellek yardımcıları: sha + model eşleşmesi, bozuk dosya boş döner', () => {
    const sha = dosyaOzeti(Buffer.from('x'));
    const onb: Onbellek = { a: { sha, model: 'small', duyulan: 'merhaba' } };
    expect(onbellekten(onb, 'a', sha, 'small')).toBe('merhaba');
    expect(onbellekten(onb, 'a', sha, 'base')).toBeUndefined();
    expect(onbellekten(onb, 'a', 'baska', 'small')).toBeUndefined();
    const yol = path.join(dizin, 'onb.json');
    writeFileSync(yol, '{bozuk');
    expect(onbellekOku(yol)).toEqual({});
    expect(onbellekOku(path.join(dizin, 'yok.json'))).toEqual({});
  });
});

describe('süzgeç, özet, çıkış kodu', () => {
  const k = ['ui.a', 'ui.b', 'tur.hece.al', 'tur.sozcuk.kale'].map((key) => ({ key }));
  it('--yalniz: alt dize, joker, çoklu desen, boş = hepsi', () => {
    expect(anahtarSuz(k, []).length).toBe(4);
    expect(anahtarSuz(k, ['hece']).map((x) => x.key)).toEqual(['tur.hece.al']);
    expect(anahtarSuz(k, ['ui.*']).map((x) => x.key)).toEqual(['ui.a', 'ui.b']);
    expect(anahtarSuz(k, ['tur.*.kale', 'ui.a']).map((x) => x.key)).toEqual(['ui.a', 'tur.sozcuk.kale']);
    // nokta joker değil, düz karakter
    expect(anahtarSuz(k, ['ui.*']).length).toBe(2);
    expect(anahtarSuz([{ key: 'uiXa' }], ['ui.a'])).toEqual([]);
  });
  it('çıkış kodu: şüpheli ya da eksik → 1; kulak başarısızlık değil; boş koşu → 1', () => {
    const s = (durum: 'gecti' | 'supheli' | 'kulak' | 'eksik') => ({
      anahtar: 'x', beklenen: '', duyulan: '', benzerlik: 0, durum, onbellek: false,
    });
    expect(cikisKodu(ozetle([s('gecti'), s('kulak')]))).toBe(0);
    expect(cikisKodu(ozetle([s('gecti'), s('supheli')]))).toBe(1);
    expect(cikisKodu(ozetle([s('gecti'), s('eksik')]))).toBe(1);
    expect(cikisKodu(ozetle([]))).toBe(1);
  });
});

describe('araç/model yoksa açık hata (sessiz başarı yok)', () => {
  const eski = { ...process.env };
  afterEach(() => {
    process.env = { ...eski };
  });
  it('whisper-cli yoksa', async () => {
    process.env.WHISPER_CLI = '/yok/whisper-cli';
    await expect(sttHazirMi('small')).rejects.toThrow(/bulunamadı/);
  });
  it('model dosyası yoksa indirme komutunu söyler', async () => {
    process.env.WHISPER_CLI = process.execPath; // var olan bir ikili
    process.env.FFMPEG = process.execPath;
    process.env.OKULUMSUN_STT_MODEL = '/yok/ggml-small.bin';
    await expect(sttHazirMi('small')).rejects.toThrow(/STT modeli yok/);
  });
});
