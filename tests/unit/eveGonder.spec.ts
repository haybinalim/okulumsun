import { describe, expect, it } from 'vitest';
import { QR_SESSIZ_BOLGE, qrMatrisi, qrSvgYolu } from '../../src/ogretmen/qrMatrisi';
import { KANONIK_YAYIN_ADRESI, eveLinkKoku } from '../../src/platform/kanonikKok';
import { eveLinkUret } from '../../src/ogretmen/eveLink';
import { useAppStore } from '../../src/store/appStore';
import { UCUNCU_TARAF_VARLIKLAR } from '../../src/content/ucuncuTarafVarliklar';
import type { GunlukSet } from '../../src/ogretmen/gunlukSet';
import type { SkillId } from '../../src/exercises/types';

/** Plan v2 Adım 42 aşama 3: QR (yerel), eve link kökü, Eve gönder durumu. */
const SET: GunlukSet = {
  surum: 1,
  dugumler: ['mat.uzam.konum-ifadeleri', 'mat.sayma.kardinalite'] as SkillId[],
  tohum: 0xffffffff,
};

describe('qrMatrisi', () => {
  it('aynı metin → aynı matris; kare; en uzun eve link küçük sürümde kalır', () => {
    const link = eveLinkUret(KANONIK_YAYIN_ADRESI, {
      ...SET,
      dugumler: [...SET.dugumler, 'mat.sayi.rakam-tanima', 'mat.olcme.kutle-kiyas'] as SkillId[],
    });
    const a = qrMatrisi(link);
    expect(qrMatrisi(link)).toEqual(a);
    expect(a.every((s) => s.length === a.length)).toBe(true);
    // ≤ sürüm 5 (37×37): tahtadan telefonla okunacak kadar iri modül.
    expect(a.length).toBeLessThanOrEqual(37);
    // Bulucu deseni: sol üst 7×7 çerçevenin köşeleri koyu.
    expect([a[0]![0], a[0]![6], a[6]![0], a[6]![6]]).toEqual([true, true, true, true]);
  });
  it('farklı metin → farklı matris; boş metin hata', () => {
    expect(qrMatrisi('a')).not.toEqual(qrMatrisi('b'));
    expect(() => qrMatrisi('')).toThrow();
  });
  it('SVG yolu sessiz bölgeyi içerir ve koyu modül sayısı kadar kare çizer', () => {
    const m = qrMatrisi('https://ornek.test/#ev=1.1.a1b4.39u');
    const { yol, boyut } = qrSvgYolu(m);
    expect(boyut).toBe(m.length + 2 * QR_SESSIZ_BOLGE);
    const koyu = m.flat().filter(Boolean).length;
    expect(yol.match(/M/g)).toHaveLength(koyu);
    expect(yol.startsWith(`M`)).toBe(true);
  });
});

describe('eveLinkKoku', () => {
  it('http(s): açılan köken + taban yol', () => {
    expect(eveLinkKoku({ protocol: 'https:', origin: 'https://okul.test' }, '/')).toBe('https://okul.test/');
    expect(eveLinkKoku({ protocol: 'http:', origin: 'http://localhost:4173' }, '/alt/')).toBe(
      'http://localhost:4173/alt/',
    );
    expect(eveLinkKoku({ protocol: 'https:', origin: 'https://okul.test' }, 'alt/')).toBe('https://okul.test/alt/');
  });
  it('file:// veya başka şema: kanonik yayın adresi', () => {
    expect(eveLinkKoku({ protocol: 'file:', origin: 'null' }, './')).toBe(KANONIK_YAYIN_ADRESI);
  });
});

describe('Eve gönder durumu ve lisans', () => {
  it('eveGonder seti bellekte tutar ve ekranı açar', () => {
    useAppStore.getState().sifirla();
    useAppStore.getState().ekranGit('setHazirla');
    useAppStore.getState().eveGonder(SET);
    expect(useAppStore.getState().ekran).toBe('eveGonder');
    expect(useAppStore.getState().eveGonderSeti).toEqual(SET);
    expect(useAppStore.getState().oncekiEkran).toBe('setHazirla');
  });
  it('qrcode-generator envanterde MIT', () => {
    expect(UCUNCU_TARAF_VARLIKLAR.find((v) => v.ad === 'qrcode-generator')?.lisans).toBe('MIT');
  });
});
