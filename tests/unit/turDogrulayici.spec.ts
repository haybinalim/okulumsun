/**
 * K-OY doğrulayıcısı (Okuma Yazma planı Adım 62, G0 kapısı): geçerli dosya temiz; her kuralın tuzağı
 * yakalanır (`docs/mufredat-kisitlari-turkce.md` §5). Şema katmanı ayrıca denetlenir.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  harfEnvanteriniDenetle,
  renkAlaniBul,
  turIceriginiDogrula,
  turKodunuTara,
  type KuralKodu,
} from '../../src/content/dersler/tur/dogrulayici';
import { turIcerikDosyasiniAyristir, type TurIcerikDosyasi } from '../../src/content/schema/turIcerik';
import { gecerliHam, TUZAKLAR } from './turTuzak';

const OTOMATIK: readonly KuralKodu[] = [
  'D-01', 'D-02', 'D-03', 'D-04', 'D-05', 'D-06', 'D-07', 'D-08', 'D-09', 'D-10',
  'D-11', 'D-12', 'D-13', 'D-14', 'D-15', 'D-20', 'D-23',
]; // prettier-ignore

const dogrula = (ham: unknown, yayin = false) => turIceriginiDogrula(ham as TurIcerikDosyasi, { yayin });

describe('geçerli dosya', () => {
  it('şemadan geçer, hata ve uyarı yok', () => {
    const d = turIcerikDosyasiniAyristir(gecerliHam());
    const s = turIceriginiDogrula(d, { yayin: true });
    expect(s.hatalar).toEqual([]);
    expect(s.uyarilar).toEqual([]);
  });

  it('harf envanteri Şekil 1 ile aynı (D-01)', () => {
    expect(harfEnvanteriniDenetle()).toEqual([]);
  });
});

describe('tuzaklar — her kural kırmızı', () => {
  for (const t of TUZAKLAR) {
    it(`${t.kural}: ${t.ad}`, () => {
      const ham = gecerliHam();
      t.boz(ham);
      const kurallar = dogrula(ham, true).hatalar.map((h) => h.kural);
      expect(kurallar, JSON.stringify(dogrula(ham, true).hatalar)).toContain(t.kural);
    });
  }

  it('D-06: parçaya renk veren alan şemaya giremez ve taramada bulunur', () => {
    const ham = gecerliHam();
    (ham.heceler[0] as Record<string, unknown>).parcaRengi = '#f00';
    expect(() => turIcerikDosyasiniAyristir(ham)).toThrow();
    expect(renkAlaniBul(ham)).toEqual(['.heceler[0].parcaRengi']);
    expect(renkAlaniBul(gecerliHam())).toEqual([]);
  });

  it('D-04 / D-20: hecede büyük harf ve yanlış program sürümü şemada reddedilir', () => {
    const a = gecerliHam();
    (a.heceler[0] as Record<string, unknown>).metin = 'An';
    expect(() => turIcerikDosyasiniAyristir(a)).toThrow();
    const b = gecerliHam();
    b.programSurumu = 'tymm-turkce-2025';
    expect(() => turIcerikDosyasiniAyristir(b)).toThrow();
    expect(dogrula(b).hatalar.map((h) => h.kural)).toContain('D-20');
  });

  it('D-05: anlamsız hece oranı %30 üstünde uyarı', () => {
    const ham = gecerliHam();
    ham.heceler.push(
      { id: 'c-ta', metin: 'ta', girisHarfi: 't', anlamli: false, sozcukler: ['s-tane'] },
      { id: 'c-te', metin: 'te', girisHarfi: 't', anlamli: false, sozcukler: ['s-tane'] },
    );
    (ham.sozcukler as Record<string, unknown>[]).push({ id: 's-tane', metin: 'tane', girisHarfi: 't' });
    const s = dogrula(ham);
    expect(s.uyarilar.map((u) => `${u.kural} ${u.oge}`)).toContain('D-05 harf:t');
    expect(s.hatalar.map((h) => h.kural)).toContain('D-05'); // "te" tane'nin hecesi değil
  });

  it('D-14: öğretmen teyidi geliştirmede uyarı, yayında hata', () => {
    const ham = gecerliHam();
    delete (ham.sozcukler[0] as Record<string, unknown>).anlamTeyidi;
    expect(dogrula(ham, false).uyarilar.map((u) => u.kural)).toEqual(['D-14']);
    expect(dogrula(ham, false).hatalar).toEqual([]);
    expect(dogrula(ham, true).hatalar.map((h) => h.kural)).toEqual(['D-14']);
  });

  it('D-13: süre ölçen kod yakalanır; Türkçe paket kodu temiz', () => {
    expect(
      turKodunuTara([{ yol: 'src/content/dersler/tur/x.ts', icerik: 'const t0 = performance.now();' }]),
    ).toHaveLength(1);
    expect(turKodunuTara([{ yol: 'src/content/dersler/tur/y.ts', icerik: 'const okumaHizi = 0;' }])).toHaveLength(1);
    const kok = path.resolve(__dirname, '../../src/content/dersler/tur');
    // Alt klasörler dahil (şablonlar, Adım 69).
    const dosyalar = (readdirSync(kok, { recursive: true }) as string[])
      .filter((d) => d.endsWith('.ts'))
      .map((d) => ({
        yol: `src/content/dersler/tur/${d}`,
        icerik: readFileSync(path.join(kok, d), 'utf8'),
      }));
    expect(dosyalar.some((d) => d.yol.includes('sablonlar/'))).toBe(true);
    expect(turKodunuTara(dosyalar)).toEqual([]);
  });

  it('her otomatik kuralın en az bir tuzağı var', () => {
    const kapsanan = new Set<KuralKodu>([...TUZAKLAR.map((t) => t.kural), 'D-06', 'D-13', 'D-14']);
    expect(OTOMATIK.filter((k) => !kapsanan.has(k))).toEqual([]);
  });
});

describe('program örnekleri', () => {
  it('"Ah, elim acıdı!" 5. grupta geçerli, ünlem sözcüğü ve virgül kalıbı', () => {
    const ham = gecerliHam();
    expect(dogrula(ham).hatalar).toEqual([]);
    (ham.cumleler.find((c) => c.id === 'k-ah') as Record<string, unknown>).girisHarfi = 'ç';
    expect(dogrula(ham).hatalar.map((h) => h.kural)).toContain('D-02');
  });

  it('"Rana kayısı al." rebus yerine görsel kullanımı reddedilir', () => {
    const ham = gecerliHam();
    ham.cumleler.push({ id: 'k-rana', metin: 'Rana 🍑 al.', girisHarfi: 'm', ozelAdlar: ['Rana'] });
    expect(dogrula(ham).hatalar.map((h) => h.kural)).toContain('D-07');
  });
});
