/**
 * Türkçe klip üretimi (`npm run audio -- --ders tur`): sahte sentezleyici, GERÇEK İSTEK YOK.
 * Plan, artımlılık, ücretsiz katman, D-11 kapısı ve matematik planının değişmemesi.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { klipleriTopla } from '../../scripts/ses/klipler';
import { anahtarliKlipOzeti, sesKaynagiDosyasiniAyir } from '../../scripts/ses/sesKaynagi';
import { Defter, karakterSay } from '../../scripts/ses/ucretsizKatman';
import { planiCalistir } from '../../scripts/ses/uretimDongusu';
import { uretimPlani } from '../../scripts/ses/uretimPlani';
import { turKlipDosyasi, turKlipleriniAyir, turKlipMetniUretilebilirMi } from '../../scripts/ses/turKlipleri';

const manifest = JSON.parse(readFileSync('ders-verisi/tur/ses/klipler.json', 'utf8')) as {
  klipler: { anahtar: string; metin: string }[];
};
const { aktif, anahtarSesleri } = sesKaynagiDosyasiniAyir(
  JSON.parse(readFileSync('src/content/sesKaynagi.json', 'utf8')) as Record<string, unknown>,
);
const ozetHesapla = (metin: string, clip: { key: string }) => anahtarliKlipOzeti(aktif, anahtarSesleri, clip.key, metin);

let dizin: string;
beforeEach(() => {
  dizin = mkdtempSync(path.join(os.tmpdir(), 'tur-ses-'));
});
afterEach(() => rmSync(dizin, { recursive: true, force: true }));

function defterKur(kullanilan: number, sinir = 900_000): Defter {
  const yol = path.join(dizin, 'defter.json');
  const saat = () => new Date('2026-11-16T12:00:00Z');
  writeFileSync(yol, JSON.stringify({ '2026-11': { karakter: kullanilan, istek: 0, guncelleme: '' } }));
  return new Defter(yol, sinir, saat);
}

/** Sahte sentezleyici: ağ yok; gerçek hattaki gibi defter denetimi + kayıt, "dosya" bellekte. */
function sahteKosu(klipler: ReturnType<typeof turKlipleriniAyir>, defter: Defter, diskte: Set<string>, ozetler: Record<string, string>) {
  const istekler: string[] = [];
  const plan = uretimPlani(klipler, ozetler, ozetHesapla, (d) => diskte.has(d), { zorla: false });
  const sonuc = planiCalistir({
    plan,
    butce: () => defter.durum(),
    sentezle: async (clip) => {
      defter.istekOncesi(karakterSay(clip.text));
      istekler.push(clip.key);
      defter.kaydet(karakterSay(clip.text));
      diskte.add(clip.file);
    },
    kaydet: async (clip, ozet) => {
      ozetler[clip.key] = ozet;
    },
    asimdaKaydet: async () => undefined,
  });
  return { plan, sonuc, istekler };
}

describe('Türkçe klip planı', () => {
  const klipler = turKlipleriniAyir(manifest);

  it('467 klip, ~5.626 karakter (UTF-16 sayımı), yollar tür/ad.m4a', () => {
    expect(klipler).toHaveLength(467);
    expect(klipler.reduce((t, c) => t + karakterSay(c.text), 0)).toBe(5626);
    expect(new Set(klipler.map((c) => c.file)).size).toBe(467);
    expect(turKlipDosyasi('tur.sozcuk.kale')).toBe('sozcuk/kale.m4a');
    expect(turKlipDosyasi('tur.yonerge.t05-model')).toBe('yonerge/t05-model.m4a');
    expect(() => turKlipDosyasi('mat.sayi.1')).toThrow();
    expect(() => turKlipDosyasi('tur.sozcuk.../x')).toThrow();
  });

  it('ilk koşu 467 klip sentezler, ikinci koşu 0 (artımlı); metni değişen tek klip yeniden üretilir', async () => {
    const defter = defterKur(0);
    const diskte = new Set<string>();
    const ozetler: Record<string, string> = {};
    const bir = sahteKosu(klipler, defter, diskte, ozetler);
    expect((await bir.sonuc).made).toBe(467);
    expect(defter.durum().kullanilan).toBe(5626);

    const iki = sahteKosu(klipler, defter, diskte, ozetler);
    expect(iki.plan.uretilecek).toHaveLength(0);
    expect(iki.plan.atlanan).toBe(467);
    expect((await iki.sonuc).made).toBe(0);
    expect(iki.istekler).toHaveLength(0);

    const degisen = klipler.map((c, i) => (i === 0 ? { ...c, text: `${c.text} bir` } : c));
    const uc = sahteKosu(degisen, defter, diskte, ozetler);
    expect(uc.plan.uretilecek.map((u) => u.clip.key)).toEqual([klipler[0].key]);
    await uc.sonuc;
    // dosyası silinen klip de yeniden üretilir
    diskte.delete(klipler[5].file);
    expect(sahteKosu(degisen, defter, diskte, ozetler).plan.uretilecek.map((u) => u.clip.key)).toEqual([klipler[5].key]);
  });

  it('--en-cok N: yalnız N klip, kalan sonraki çalışmaya', () => {
    const p = uretimPlani(klipler, {}, ozetHesapla, () => false, { zorla: false, enCok: 10 });
    expect(p.uretilecek).toHaveLength(10);
    expect(p.kalan).toBe(457);
  });

  it('sınır aşımında HİÇ istek gitmez (çalışma başı tahmin), defter değişmez', async () => {
    const defter = defterKur(899_000); // kalan 1.000 < 5.626
    const istek = vi.fn();
    const plan = uretimPlani(klipler, {}, ozetHesapla, () => false, { zorla: false });
    await expect(
      planiCalistir({ plan, butce: () => defter.durum(), sentezle: istek, kaydet: async () => undefined, asimdaKaydet: async () => undefined }),
    ).rejects.toThrow(/ÜCRETSİZ KATMAN KORUMASI/);
    expect(istek).not.toHaveBeenCalled();
    expect(defter.durum().kullanilan).toBe(899_000);
  });

  it('defter yoksa istek gitmez ve açık hata verir (sessiz başarı yok)', async () => {
    const yok = new Defter(path.join(dizin, 'yok.json'), 900_000);
    const { sonuc, istekler } = sahteKosu(klipler, yok, new Set(), {});
    await expect(sonuc).rejects.toThrow(/defteri yok/);
    expect(istekler).toHaveLength(0);
  });
});

describe('D-11 kapısı', () => {
  const geri = { anahtar: 'tur.geri.dogru', metin: 'Aferin.' };
  it.each(['k', 'Ş', 'ç', 'str', 'k.', ' ', '...', '123'])('"%s" metinli klip reddedilir', (metin) => {
    expect(turKlipMetniUretilebilirMi(metin)).toBe(false);
    expect(() => turKlipleriniAyir({ klipler: [geri, { anahtar: 'tur.hece.k', metin }] })).toThrow(/D-11/);
  });
  it('ünlü taşıyan hece/sözcük geçer', () => {
    for (const m of ['a', 'ta', 'kale', 'Ali geldi.']) expect(turKlipMetniUretilebilirMi(m)).toBe(true);
  });
  it('bozuk manifest hata verir', () => {
    expect(() => turKlipleriniAyir({ klipler: [] })).toThrow();
    expect(() => turKlipleriniAyir(null)).toThrow();
    expect(() => turKlipleriniAyir({ klipler: [geri, geri] })).toThrow(/yinelenen/);
  });
});

describe('matematik planı değişmez', () => {
  it('tr.json planı: Türkçe ekleri matematik anahtarlarına karışmaz, anahtar bazlı özet aynı', () => {
    const mat = klipleriTopla(JSON.parse(readFileSync('src/content/tr.json', 'utf8')) as Record<string, unknown>);
    expect(mat.some((c) => c.key.startsWith('tur.'))).toBe(false);
    expect(mat.every((c) => c.file.endsWith('.m4a') && !c.file.startsWith('ders-verisi'))).toBe(true);
    // Aynı klibin özeti, Türkçe hattıyla paylaşılan fonksiyondan bayt bayt aynı (kaynak/model kimliği özette).
    const ilk = mat[0];
    expect(ozetHesapla(ilk.text, ilk)).toBe(anahtarliKlipOzeti(aktif, anahtarSesleri, ilk.key, ilk.text));
    // Plan: boş özetle hepsi üretilecek, tam özetle + dosyalar varsa hiçbiri.
    const hepsi = uretimPlani(mat, {}, ozetHesapla, () => true, { zorla: false });
    expect(hepsi.uretilecek).toHaveLength(mat.length);
    const ozetler = Object.fromEntries(mat.map((c) => [c.key, ozetHesapla(c.text, c)]));
    expect(uretimPlani(mat, ozetler, ozetHesapla, () => true, { zorla: false }).uretilecek).toHaveLength(0);
  });
});
