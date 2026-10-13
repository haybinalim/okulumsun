/** Plan v2 Adım 49 (KG-71): okul paketi zip içeriği, özet listesi, OKUBENI metni. */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
  PAKET_KOK,
  okubeniMetni,
  okulPaketiUret,
  paketGirdileri,
  sha256Listesi,
} from '../../scripts/okul-paketi';

const gecici = mkdtempSync(path.join(tmpdir(), 'okul-paketi-test-'));
afterAll(() => rmSync(gecici, { recursive: true, force: true }));

describe('okul paketi', () => {
  it('kök dosyaları + okulumsun/ altı; sıralı', () => {
    expect(paketGirdileri(['assets/a.js', 'index.html'])).toEqual([
      'LICENSE',
      'LICENSES.md',
      'OKUBENI.txt',
      'SHA256SUMS.txt',
      'SURUM.txt',
      `${PAKET_KOK}/assets/a.js`,
      `${PAKET_KOK}/index.html`,
    ]);
  });
  it('SHA256SUMS sha256sum biçiminde', () => {
    expect(sha256Listesi([{ yol: 'index.html', sha256: 'ab'.repeat(32) }])).toBe(`${'ab'.repeat(32)}  okulumsun/index.html\n`);
  });
  it('OKUBENI: alt klasör, file:// sınırı, yazılı izin, gizlilik', () => {
    const m = okubeniMetni('9.9.9');
    expect(m).toContain('OKULUMSUN 9.9.9');
    expect(m).toContain('file://');
    expect(m).toMatch(/Alt klasörden açılır/);
    expect(m).toMatch(/yazılı\s+iznine bağlıdır/);
    expect(m).toMatch(/veri göndermez/);
  });
  it('sahte derlemeden zip üretir; içerik listesi ve özetler doğru; aynı girdi → aynı zip', () => {
    mkdirSync(path.join(gecici, 'dist/assets'), { recursive: true });
    writeFileSync(path.join(gecici, 'dist/index.html'), '<!doctype html>');
    writeFileSync(path.join(gecici, 'dist/assets/a.js'), 'console.log(1)');
    writeFileSync(path.join(gecici, 'package.json'), JSON.stringify({ version: '1.2.3' }));
    writeFileSync(path.join(gecici, 'LICENSE'), 'L');
    writeFileSync(path.join(gecici, 'LICENSES.md'), 'LM');
    const hedef = path.join(gecici, 'p.zip');
    const girdiler = okulPaketiUret(gecici, hedef);
    const liste = spawnSync('unzip', ['-Z1', hedef]).stdout.toString().trim().split('\n');
    expect(liste).toEqual(girdiler);
    const ozet = spawnSync('unzip', ['-p', hedef, 'SHA256SUMS.txt']).stdout.toString();
    const beklenen = createHash('sha256').update('<!doctype html>').digest('hex');
    expect(ozet).toContain(`${beklenen}  okulumsun/index.html`);
    expect(spawnSync('unzip', ['-p', hedef, 'SURUM.txt']).stdout.toString()).toBe('1.2.3\n');
    const ilk = readFileSync(hedef);
    okulPaketiUret(gecici, hedef);
    expect(readFileSync(hedef).equals(ilk)).toBe(true);
  });
});
