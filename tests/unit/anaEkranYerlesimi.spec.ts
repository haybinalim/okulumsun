import { describe, expect, it } from 'vitest';
import { anaEkranSigmiyor, type AnaEkranOlculeri } from '../../src/ui/screens/anaEkranYerlesimi';

/** KG-101: kişisel ana ekranın alt şeridi sığmıyorsa sıkı düzen. Ölçüler e2e'de 1080×810 elle tahta profilinden. */
const TAHTA_1080x810: AnaEkranOlculeri = {
  kullanilabilir: 810 - 38 - 64,
  dolgu: 0,
  bosluk: 51,
  ust: 88,
  satir: 171,
  ortaBosluk: 38,
  kilit: 0,
  izgara: 278,
  altDugme: 224,
  altDolgu: 40,
};

describe('anaEkranSigmiyor (KG-101)', () => {
  it('elle tahta profili 1080×810: normal düzen sığmaz', () => {
    expect(anaEkranSigmiyor(TAHTA_1080x810)).toBe(true);
  });
  it('1920×1080 tahta: sığar', () => {
    expect(anaEkranSigmiyor({ ...TAHTA_1080x810, kullanilabilir: 1080 - 38 - 64 })).toBe(false);
  });
  it('kilitli tema uyarısı yükseklik ekler', () => {
    const sinirda = { ...TAHTA_1080x810, kullanilabilir: 88 + 51 + 171 + 38 + 278 + 51 + 224 + 40 };
    expect(anaEkranSigmiyor(sinirda)).toBe(false);
    expect(anaEkranSigmiyor({ ...sinirda, kilit: 40 })).toBe(true);
  });
});
