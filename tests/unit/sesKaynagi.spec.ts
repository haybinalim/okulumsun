import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ESKI_KAYNAK,
  bekleyenKaynagiDogrula,
  eskiOzet,
  sesKaynagiDosyasiniAyir,
  klipOzeti,
  ozetDosyasiniOku,
  sesKaynaginiDogrula,
  type SesKaynagi,
} from '../../scripts/ses/sesKaynagi';
import aktifKaynakJson from '../../src/content/sesKaynagi.json';

const GOOGLE: SesKaynagi = {
  saglayici: 'google',
  modelKimligi: 'google:tr-TR-Chirp3-HD-ornek@2026-10',
  lisansUrl: 'https://cloud.google.com/terms/service-terms',
  ticariDagitimIzni: true,
  cocukUrunundeKullanim: 'kosullu',
  atifSarti: null,
};

describe('ses kaynağı sözleşmesi', () => {
  it('klipOzeti model kimliğini özete katar', () => {
    const ikinci: SesKaynagi = { ...GOOGLE, modelKimligi: 'google:tr-TR-Chirp3-HD-baska@2026-10' };
    expect(klipOzeti(GOOGLE, 'Merhaba')).not.toBe(klipOzeti(ikinci, 'Merhaba'));
    expect(klipOzeti(GOOGLE, 'Merhaba')).toMatch(/^[0-9a-f]{16}$/);
  });

  it('yeni özet eski önekli özetten farklıdır', () => {
    expect(klipOzeti(ESKI_KAYNAK, 'bir')).not.toBe(eskiOzet('piper', 'bir'));
  });

  it('model kimliği boş olamaz', () => {
    expect(() => klipOzeti({ ...GOOGLE, modelKimligi: '  ' }, 'x')).toThrow(/model kimliği/);
    expect(() => sesKaynaginiDogrula({ ...GOOGLE, modelKimligi: '' })).toThrow(/model kimliği/);
  });

  it('bilinmeyen sağlayıcı reddedilir', () => {
    expect(() => sesKaynaginiDogrula({ ...GOOGLE, saglayici: 'edge-tts' })).toThrow(/Bilinmeyen/);
  });

  it('ESKI_KAYNAK ticari izinsizdir', () => {
    expect(ESKI_KAYNAK.ticariDagitimIzni).toBe(false);
    expect(ESKI_KAYNAK.cocukUrunundeKullanim).toBe('bilinmiyor');
  });

  it('depodaki aktif kaynak Google Chirp 3 HD Puck, ticari izinli; bekleyen yok (Adım 31, KG-107)', () => {
    const { aktif, bekleyen } = sesKaynagiDosyasiniAyir(aktifKaynakJson as Record<string, unknown>);
    expect(aktif.saglayici).toBe('google');
    expect(aktif.modelKimligi).toBe('google:tr-TR-Chirp3-HD-Puck@2026-10');
    expect(aktif.ticariDagitimIzni).toBe(true);
    expect(['izinli', 'kosullu']).toContain(aktif.cocukUrunundeKullanim);
    expect(aktif.atifSarti).toBe('Sesler Google Cloud Text-to-Speech ile üretilmiştir.');
    expect(aktif).not.toEqual(ESKI_KAYNAK);
    expect(bekleyen).toBeNull();
  });

  it('.hashes.json eski düz biçimi ve yeni $kaynak biçimi okunur', () => {
    expect(ozetDosyasiniOku({ 'ui.a': 'abc' })).toEqual({ kaynak: null, ozetler: { 'ui.a': 'abc' } });
    const yeni = ozetDosyasiniOku({ $kaynak: GOOGLE, 'ui.a': 'abc' });
    expect(yeni.kaynak).toEqual(GOOGLE);
    expect(yeni.ozetler).toEqual({ 'ui.a': 'abc' });
  });

  // Adım 18'in `bekleyen` biçimi Adım 31'de aktif kaynağa taşındı; ileride ses değişikliği aynı yolla yapılır.
  const BEKLEYEN_ORNEK = {
    saglayici: 'google',
    model: 'chirp3-hd',
    ses: 'tr-TR-Chirp3-HD-Puck',
    ticariDagitimIzni: true,
    cocukUrunundeKullanim: 'kosullu',
    sartlarUrl: ['https://cloud.google.com/terms/service-terms'],
    sartlarOkunduTarih: '2026-10-28',
    atifSarti: 'Sesler Google Cloud Text-to-Speech ile üretilmiştir.',
  };

  it("bekleyen kaynak biçimi okunur (ses değişikliği yolu)", () => {
    const { bekleyen } = sesKaynagiDosyasiniAyir({ ...(aktifKaynakJson as Record<string, unknown>), bekleyen: BEKLEYEN_ORNEK });
    expect(bekleyen!.ses).toBe('tr-TR-Chirp3-HD-Puck');
    expect(bekleyen!.ticariDagitimIzni).toBe(true);
  });

  it('bekleyen kaynak doğrulaması hatalı değerleri reddeder', () => {
    const bekleyen = BEKLEYEN_ORNEK;
    expect(() => bekleyenKaynagiDogrula({ ...bekleyen, sartlarUrl: [] })).toThrow(/https/);
    expect(() => bekleyenKaynagiDogrula({ ...bekleyen, sartlarUrl: ['http://x'] })).toThrow(/https/);
    expect(() => bekleyenKaynagiDogrula({ ...bekleyen, sartlarOkunduTarih: '12.10.2026' })).toThrow(/YYYY/);
    expect(() => bekleyenKaynagiDogrula({ ...bekleyen, ses: '' })).toThrow(/ses/);
  });

  it('aktif kaynağın atıf şartı varsa Kaynaklar metninde geçer', () => {
    const { aktif } = sesKaynagiDosyasiniAyir(aktifKaynakJson as Record<string, unknown>);
    // Adım 31: aktif kaynak google → gönüllü ifşa cümlesi Kaynaklar ekranında aynen geçer.
    expect(aktif.atifSarti).not.toBeNull();
    if (aktif.atifSarti === null) return;
    const kaynaklar = readFileSync(resolve(__dirname, '../../src/ui/screens/Kaynaklar.tsx'), 'utf8');
    expect(kaynaklar).toContain(aktif.atifSarti);
  });
});
