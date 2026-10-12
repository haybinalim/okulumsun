import { describe, expect, it } from 'vitest';
import {
  ESKI_KAYNAK,
  eskiOzet,
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

  it('depodaki aktif kaynak geçerli ve şimdilik eski kaynaktır (KG-15)', () => {
    const { $not: _not, ...ham } = aktifKaynakJson as Record<string, unknown>;
    expect(sesKaynaginiDogrula(ham)).toEqual(ESKI_KAYNAK);
  });

  it('.hashes.json eski düz biçimi ve yeni $kaynak biçimi okunur', () => {
    expect(ozetDosyasiniOku({ 'ui.a': 'abc' })).toEqual({ kaynak: null, ozetler: { 'ui.a': 'abc' } });
    const yeni = ozetDosyasiniOku({ $kaynak: GOOGLE, 'ui.a': 'abc' });
    expect(yeni.kaynak).toEqual(GOOGLE);
    expect(yeni.ozetler).toEqual({ 'ui.a': 'abc' });
  });
});
