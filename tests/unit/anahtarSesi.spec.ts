/**
 * Anahtar bazlı ses (KG-114): maskot sesi `maskot.*` ve `hikaye.*` → Achernar 0,9; diğer
 * tüm anahtarlar yönerge sesi Puck. Mevcut Puck kliplerinin özeti değişmemeli.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  anahtarSesleriniDogrula,
  anahtarinSesi,
  anahtarliKlipOzeti,
  klipOzeti,
  kokenDenetle,
  ozetDosyasiniOku,
  sesKaynagiDosyasiniAyir,
  type AnahtarSesi,
  type SesKaynagi,
} from '../../scripts/ses/sesKaynagi';
import { klipleriTopla, type Clip } from '../../scripts/ses/klipler';
import { uretimPlani } from '../../scripts/ses/uretimPlani';
import { googleIstegi, modelKimligindenSes } from '../../scripts/ses/googleTts';
import sesKaynagiJson from '../../src/content/sesKaynagi.json';
import trJson from '../../src/content/tr.json';

const KOK = path.resolve(__dirname, '../..');
const { aktif, anahtarSesleri } = sesKaynagiDosyasiniAyir(sesKaynagiJson as Record<string, unknown>);
const ozetler = ozetDosyasiniOku(JSON.parse(readFileSync(path.join(KOK, 'public/audio/.hashes.json'), 'utf8'))).ozetler;
const klipler = klipleriTopla(trJson as Record<string, unknown>);

describe('maskot sesi kaydı (KG-114, K-12)', () => {
  it('sesKaynagi.json: maskot.* ve hikaye.* → Achernar, hız 0,9; aktif kaynak Puck kalır', () => {
    expect(aktif.modelKimligi).toBe('google:tr-TR-Chirp3-HD-Puck@2026-10');
    expect(anahtarSesleri).toHaveLength(1);
    expect(anahtarSesleri[0].onekler).toEqual(['maskot.', 'hikaye.']);
    expect(modelKimligindenSes(anahtarSesleri[0].modelKimligi)).toBe('tr-TR-Chirp3-HD-Achernar');
    expect(anahtarSesleri[0].hiz).toBe(0.9);
    expect(anahtarSesleri[0].karar).toBe('KG-114');
  });

  it('anahtarın sesi: maskot/hikâye Achernar, diğerleri Puck', () => {
    for (const k of ['maskot.selam', 'hikaye.t1-1', 'hikaye.t7-3']) {
      const s = anahtarinSesi(aktif, anahtarSesleri, k);
      expect(modelKimligindenSes(s.kaynak.modelKimligi)).toBe('tr-TR-Chirp3-HD-Achernar');
      expect(s.hiz).toBe(0.9);
    }
    for (const k of ['giris.t1-1', 'ui.hazirlaniyor', 'sayi.7', 'maskotlar.x', 'hikayeler.y']) {
      const s = anahtarinSesi(aktif, anahtarSesleri, k);
      expect(s.kaynak).toBe(aktif);
      expect(s.anahtarSesi).toBeNull();
    }
  });

  it('istek gövdesi Achernar adını ve 0,9 hızı taşır', () => {
    const s = anahtarinSesi(aktif, anahtarSesleri, 'maskot.selam');
    const g = googleIstegi('Merhaba!', modelKimligindenSes(s.kaynak.modelKimligi), s.hiz);
    expect(g.voice.name).toBe('tr-TR-Chirp3-HD-Achernar');
    expect(g.audioConfig.speakingRate).toBe(0.9);
  });
});

describe('anahtarliKlipOzeti', () => {
  it('anahtar sesi olmayan klibin özeti klipOzeti ile birebir aynı (Puck klipleri yeniden üretilmez)', () => {
    const puck = klipler.filter((c) => anahtarinSesi(aktif, anahtarSesleri, c.key).anahtarSesi === null);
    expect(puck).toHaveLength(342);
    for (const c of puck) {
      expect(anahtarliKlipOzeti(aktif, anahtarSesleri, c.key, c.text)).toBe(klipOzeti(aktif, c.text));
      // Commitli özet de aynı: Puck klipleri yeniden üretilmez.
      expect(ozetler[c.key], c.key).toBe(klipOzeti(aktif, c.text));
    }
  });

  it('ses adı özete girer: ses değişince özet değişir', () => {
    const baska: AnahtarSesi[] = [{ ...anahtarSesleri[0], modelKimligi: 'google:tr-TR-Chirp3-HD-Aoede@2026-10' }];
    const a = anahtarliKlipOzeti(aktif, anahtarSesleri, 'maskot.selam', 'Merhaba!');
    expect(a).not.toBe(anahtarliKlipOzeti(aktif, baska, 'maskot.selam', 'Merhaba!'));
    expect(a).not.toBe(klipOzeti(aktif, 'Merhaba!'));
    expect(a).toMatch(/^[0-9a-f]{16}$/);
  });

  it('hız varsayılandan farklıysa özet değişir', () => {
    const hizli: AnahtarSesi[] = [{ ...anahtarSesleri[0], hiz: 1 }];
    expect(anahtarliKlipOzeti(aktif, anahtarSesleri, 'hikaye.t1-1', 'x')).not.toBe(
      anahtarliKlipOzeti(aktif, hizli, 'hikaye.t1-1', 'x'),
    );
  });
});

describe('üretim planı ve köken (KG-114)', () => {
  const ozetHesapla = (metin: string, clip: Clip) => anahtarliKlipOzeti(aktif, anahtarSesleri, clip.key, metin);
  const dosyaVar = () => true;

  it('commitli özetlerle 0 klip planlanır (Puck 0, Achernar 0 — 22 maskot klibi Achernar özetiyle üretildi)', () => {
    const p = uretimPlani(klipler, ozetler, ozetHesapla, dosyaVar, { zorla: false });
    expect(p.uretilecek).toHaveLength(0);
    const maskot = klipler.filter((c) => anahtarinSesi(aktif, anahtarSesleri, c.key).anahtarSesi !== null);
    expect(maskot).toHaveLength(22);
    for (const c of maskot) expect(ozetler[c.key]).not.toBe(klipOzeti(aktif, c.text));
  });

  it('yeni maskot klipleri eklenince yalnız onlar planlanır', () => {
    const ek = klipleriTopla({ ...(trJson as Record<string, unknown>), maskotDeneme: {} });
    const yeni: Clip[] = [
      { key: 'maskot.deneme-a', text: 'Merhaba!', file: 'maskot/deneme-a.m4a', core: false },
      { key: 'hikaye.deneme-b', text: 'Bak, bir elma.', file: 'hikaye/deneme-b.m4a', core: false },
    ];
    const p = uretimPlani([...ek, ...yeni], ozetler, ozetHesapla, dosyaVar, { zorla: false });
    expect(p.uretilecek.map((u) => u.clip.key).sort()).toEqual(
      klipler
        .filter((c) => anahtarinSesi(aktif, anahtarSesleri, c.key).anahtarSesi !== null && ozetler[c.key] !== ozetHesapla(c.text, c))
        .map((c) => c.key)
        .concat(['hikaye.deneme-b', 'maskot.deneme-a'])
        .sort(),
    );
  });

  it('köken denetimi maskot klibini kendi sesinin özetiyle kabul eder, Puck özetini reddeder', () => {
    const c = [{ key: 'maskot.selam', text: 'Merhaba!' }];
    const dogru = kokenDenetle(aktif, c, { 'maskot.selam': anahtarliKlipOzeti(aktif, anahtarSesleri, 'maskot.selam', 'Merhaba!') }, anahtarSesleri);
    expect(dogru.eslesmeyen).toEqual([]);
    const yanlis = kokenDenetle(aktif, c, { 'maskot.selam': klipOzeti(aktif, 'Merhaba!') }, anahtarSesleri);
    expect(yanlis.eslesmeyen).toEqual(['maskot.selam']);
  });
});

describe('anahtarSesleri doğrulaması', () => {
  const A: SesKaynagi = aktif;
  const gecerli = { onekler: ['maskot.'], modelKimligi: 'google:tr-TR-Chirp3-HD-Achernar@2026-10', hiz: 0.9, karar: 'KG-114' };

  it('yoksa boş dizi', () => {
    expect(anahtarSesleriniDogrula(undefined, A)).toEqual([]);
  });
  it('başka sağlayıcı reddedilir', () => {
    expect(() => anahtarSesleriniDogrula([{ ...gecerli, modelKimligi: 'piper:x' }], A)).toThrow(/aktif sağlayıcı/);
  });
  it('aktif kaynakla aynı ses reddedilir', () => {
    expect(() => anahtarSesleriniDogrula([{ ...gecerli, modelKimligi: A.modelKimligi }], A)).toThrow(/gereksiz/);
  });
  it('noktasız veya çakışan önek reddedilir', () => {
    expect(() => anahtarSesleriniDogrula([{ ...gecerli, onekler: ['maskot'] }], A)).toThrow(/biçiminde/);
    expect(() => anahtarSesleriniDogrula([gecerli, { ...gecerli, modelKimligi: 'google:tr-TR-Chirp3-HD-Aoede@2026-10' }], A)).toThrow(/çakışıyor/);
  });
  it('hız aralığı ve karar zorunlu', () => {
    expect(() => anahtarSesleriniDogrula([{ ...gecerli, hiz: 3 }], A)).toThrow(/hiz/);
    expect(() => anahtarSesleriniDogrula([{ ...gecerli, karar: '' }], A)).toThrow(/karar/);
  });
});
