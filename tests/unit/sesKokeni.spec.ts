import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { klipleriTopla } from '../../scripts/ses/klipler';
import {
  ESKI_KAYNAK,
  eskiOzet,
  klipOzeti,
  kokenDenetle,
  ozetDosyasiniOku,
  type SesKaynagi,
} from '../../scripts/ses/sesKaynagi';
import { UCUNCU_TARAF_VARLIKLAR } from '../../src/content/ucuncuTarafVarliklar';
import tr from '../../src/content/tr.json';

const klipler = klipleriTopla(tr as Record<string, unknown>);
const { ozetler } = ozetDosyasiniOku(
  JSON.parse(readFileSync(new URL('../../public/audio/.hashes.json', import.meta.url), 'utf8')),
);

describe('ses kökeni denetimi', () => {
  it("gerçek .hashes.json'daki 287 özet eskiOzet('piper', metin) ile eşleşir", () => {
    const eslesen = klipler.filter((k) => ozetler[k.key] === eskiOzet('piper', k.text));
    expect(eslesen).toHaveLength(287);
    const sonuc = kokenDenetle(ESKI_KAYNAK, klipler, ozetler);
    expect(sonuc.eslesmeyen).toEqual([]);
    expect(sonuc.ozetsiz).toEqual([]);
    expect(sonuc.eskiEslesen).toBe(287);
  });

  it('tuzak: say önekli sahte özet denetimi kırar', () => {
    const ilk = klipler[0];
    const sahte = { ...ozetler, [ilk.key]: eskiOzet('say', ilk.text) };
    expect(kokenDenetle(ESKI_KAYNAK, klipler, sahte).eslesmeyen).toEqual([ilk.key]);
  });

  it('ticari izinsiz aktif kaynak lisans uyarısı üretir (geçiş modu kapalıyken kırmızı)', () => {
    expect(kokenDenetle(ESKI_KAYNAK, klipler, ozetler).lisansUyarisi).toMatch(/UYARI LİSANS/);
  });

  it('yeni kaynağa geçince eski piper özetleri artık kabul edilmez', () => {
    const google: SesKaynagi = {
      saglayici: 'google',
      modelKimligi: 'google:tr-TR-Chirp3-HD-ornek@2026-10',
      lisansUrl: 'https://cloud.google.com/terms/service-terms',
      ticariDagitimIzni: true,
      cocukUrunundeKullanim: 'kosullu',
      atifSarti: null,
    };
    expect(kokenDenetle(google, klipler, ozetler).eslesmeyen).toHaveLength(287);
    const yeni = Object.fromEntries(klipler.map((k) => [k.key, klipOzeti(google, k.text)]));
    const sonuc = kokenDenetle(google, klipler, yeni);
    expect(sonuc.eslesmeyen).toEqual([]);
    expect(sonuc.yeniEslesen).toBe(287);
    expect(sonuc.lisansUyarisi).toBeNull();
  });
});

describe('kullanıcıya gösterilen lisans beyanı', () => {
  const kaynaklar = readFileSync(new URL('../../src/ui/screens/Kaynaklar.tsx', import.meta.url), 'utf8');
  const lisanslar = readFileSync(new URL('../../LICENSES.md', import.meta.url), 'utf8');

  it('Kaynaklar ekranı kaldırılmış fahrettin sesini MIT diye beyan etmez', () => {
    // Adım 21: Kaynaklar listesi envanterden çizilir; ses satırı ADR-0004'e bağlıdır.
    expect(kaynaklar).not.toMatch(/fahrettin/i);
    expect(kaynaklar).toMatch(/UCUNCU_TARAF_VARLIKLAR/);
    const ses = UCUNCU_TARAF_VARLIKLAR.find((v) => v.tur === 'ses');
    expect(ses?.dagitimdaVar).toBe(true);
    expect(`${ses?.lisans} ${ses?.kosul ?? ''}`).toMatch(/ADR-0004/);
    expect(JSON.stringify(UCUNCU_TARAF_VARLIKLAR)).not.toMatch(/fahrettin/i);
  });

  it('LICENSES.md fahrettin\'i üretim sağlayıcısı diye listelemez', () => {
    expect(lisanslar).not.toMatch(/fahrettin-medium\)\s*\|\s*MIT/);
    expect(lisanslar).toMatch(/ADR-0004/);
  });
});
