import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { dersVerisiDosyalari, DERS_VERISI_KOKU } from '../../scripts/yayin/dersVerisi';
import { GECICI_KLIP_SONEKI, geciciKlipYolu } from '../../scripts/ses/geciciAd';

let gecici: string | null = null;
afterEach(() => {
  if (gecici) rmSync(gecici, { recursive: true, force: true });
  gecici = null;
});

describe('yayın: üretimin geçici klip dosyası', () => {
  it('`x.yeni.m4a` yayına girmez, gerçek klip girer; üretim betiği aynı sabiti üretir', () => {
    gecici = mkdtempSync(path.join(tmpdir(), 'ders-verisi-'));
    const ses = path.join(gecici, DERS_VERISI_KOKU, 'ses', 'sozcuk');
    mkdirSync(ses, { recursive: true });
    writeFileSync(path.join(ses, 'x.m4a'), 'a');
    writeFileSync(path.join(ses, geciciKlipYolu('x.m4a')), 'b');
    expect(geciciKlipYolu('sozcuk/x.m4a')).toBe(`sozcuk/x${GECICI_KLIP_SONEKI}`);
    const d = dersVerisiDosyalari(gecici);
    expect(d).toContain('ses/sozcuk/x.m4a');
    expect(d.some((f) => f.endsWith('.yeni.m4a'))).toBe(false);
  });
});
