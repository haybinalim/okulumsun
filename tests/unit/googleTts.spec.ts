import { describe, expect, it } from 'vitest';
import {
  CHIRP3_HD_SESLERI,
  VARSAYILAN_HIZ,
  VARSAYILAN_ORNEK_SESLER,
  googleIstegi,
  googleModelKimligi,
  googleSesAdi,
  modelKimligindenSes,
} from '../../scripts/ses/googleTts';
import { klipOzeti, sesKaynaginiDogrula } from '../../scripts/ses/sesKaynagi';

describe('Google Cloud TTS istemcisi (Adım 18, KG-01)', () => {
  it('kısa ad tam Chirp 3 HD tr-TR adına çevrilir, bilinmeyen ad reddedilir', () => {
    expect(googleSesAdi('Kore')).toBe('tr-TR-Chirp3-HD-Kore');
    expect(googleSesAdi('tr-TR-Chirp3-HD-Puck')).toBe('tr-TR-Chirp3-HD-Puck');
    expect(() => googleSesAdi('Yelda')).toThrow(/Bilinmeyen/);
  });

  it('varsayılan örnek sesleri listede', () => {
    for (const s of VARSAYILAN_ORNEK_SESLER) expect(CHIRP3_HD_SESLERI).toContain(s);
  });

  it('model kimliği ses ve üretim ayını taşır ve geri çözülür', () => {
    const kimlik = googleModelKimligi('Kore', '2026-10');
    expect(kimlik).toBe('google:tr-TR-Chirp3-HD-Kore@2026-10');
    expect(modelKimligindenSes(kimlik)).toBe('tr-TR-Chirp3-HD-Kore');
    expect(() => googleModelKimligi('Kore', '2026-1')).toThrow(/YYYY-AA/);
    expect(() => modelKimligindenSes('piper:bilinmiyor')).toThrow(/biçimi/);
  });

  it('ses değişince klip özeti değişir (tüm klipler yeniden üretilir)', () => {
    const kaynak = (ses: string) =>
      sesKaynaginiDogrula({
        saglayici: 'google',
        modelKimligi: googleModelKimligi(ses, '2026-10'),
        lisansUrl: 'https://docs.cloud.google.com/text-to-speech/quotas',
        ticariDagitimIzni: true,
        cocukUrunundeKullanim: 'kosullu',
        atifSarti: null,
      });
    expect(klipOzeti(kaynak('Kore'), 'bir')).not.toBe(klipOzeti(kaynak('Aoede'), 'bir'));
  });

  it('istek gövdesi yalnız metni, tr-TR sesini ve yavaşlatılmış hızı taşır', () => {
    const istek = googleIstegi('Hangisi daha ağır?', 'Kore');
    expect(istek).toEqual({
      input: { text: 'Hangisi daha ağır?' },
      voice: { languageCode: 'tr-TR', name: 'tr-TR-Chirp3-HD-Kore' },
      audioConfig: { audioEncoding: 'LINEAR16', sampleRateHertz: 24000, speakingRate: VARSAYILAN_HIZ },
    });
    expect(VARSAYILAN_HIZ).toBeLessThan(1);
  });

  it('boş metin, 5.000 bayt üstü ve aralık dışı hız reddedilir', () => {
    expect(() => googleIstegi('  ', 'Kore')).toThrow(/Boş/);
    expect(() => googleIstegi('ş'.repeat(2600), 'Kore')).toThrow(/5.000/);
    expect(() => googleIstegi('bir', 'Kore', 3)).toThrow(/hız/);
  });
});
