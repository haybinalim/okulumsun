import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { VELI_KARTI_MADDELERI, veliKartiAyristir } from '../../src/content/dersler/tur/veliKarti';
import { PROGRAM_SURUMU } from '../../src/content/dersler/tur/alfabe';
import { kumeCoz, kumeKodla, resmiKume } from '../../src/content/dersler/tur/ogretilenKume';
import { setKoduCoz } from '../../src/content/dersler/tur/turSet';
import { turAcilisEkrani } from '../../src/ui/tur/turEkrani';
import { evKipiMi } from '../../src/ui/tur/sinifAyariDepo';
import { PROGRAM_ADRESI, turEveLink } from '../../src/ui/tur/turEveLink';

/** Okuma Yazma Adım 71 aşama 3 — eve link, veli kartı, Kaynaklar. */
const ham = JSON.parse(readFileSync('ders-verisi/tur/veli-karti.json', 'utf8')) as Record<string, unknown>;

describe('veli kartı', () => {
  it('depodaki kart geçerli: altı madde birer kez, program sürümü, öğretmen onayı bekliyor', () => {
    const k = veliKartiAyristir(ham);
    expect(k.programSurumu).toBe(PROGRAM_SURUMU);
    expect(k.maddeler.map((m) => m.kod).sort()).toEqual([...VELI_KARTI_MADDELERI].sort());
    expect(k.teyit.durum).toBe('bekliyor');
  });

  it('içerik: ses esaslı, harf adı yerine ses, ünsüz tek başına söyletilmez, kalem tutuşu, sol el zorlanmaz', () => {
    const k = veliKartiAyristir(ham);
    const m = (kod: string) => k.maddeler.find((x) => x.kod === kod)!.metin;
    expect(m('ses')).toMatch(/ses/);
    expect(m('harf-adi')).toMatch(/adlarıyla anmayın/);
    expect(m('unsuz')).toMatch(/tek başına söyletmek yerine/);
    expect(m('kalem')).toMatch(/Kalem/);
    expect(m('sol-el')).toMatch(/zorlamayın/);
    expect(k.gizlilik).toMatch(/ad, sınıf, okul ya da cevap yoktur/);
  });

  it('katı: bilinmeyen alan, eksik ya da yinelenen madde, yanlış program sürümü, bozuk teyit hatadır', () => {
    const maddeler = ham.maddeler as Record<string, unknown>[];
    expect(() => veliKartiAyristir({ ...ham, fazla: 1 })).toThrow(/bilinmeyen alan/);
    expect(() => veliKartiAyristir({ ...ham, maddeler: maddeler.slice(1) })).toThrow(/birer kez/);
    expect(() => veliKartiAyristir({ ...ham, maddeler: [...maddeler.slice(1), maddeler[1]] })).toThrow(/birer kez/);
    expect(() => veliKartiAyristir({ ...ham, programSurumu: 'eski' })).toThrow(/program sürümü/);
    expect(() => veliKartiAyristir({ ...ham, teyit: { durum: 'belki' } })).toThrow(/teyit/);
    expect(() => veliKartiAyristir({ ...ham, maddeler: [{ ...maddeler[0], ses: 'x' }, ...maddeler.slice(1)] })).toThrow(/bilinmeyen alan/);
  });
});

describe('eve link', () => {
  it('bağlantıda yalnız ders, set kodu ve küme kodu var; gidiş-dönüş', () => {
    const kume = resmiKume('o', false);
    const link = new URL(turEveLink('https://okulumsun-tc.vercel.app/', 'destek', 7, kume));
    expect([...link.searchParams.keys()].sort()).toEqual(['ders', 'ev', 'tur']);
    expect(link.searchParams.get('ders')).toBe('tur');
    expect(setKoduCoz(link.searchParams.get('ev'))).toEqual({ duzey: 'destek', tohum: 7 });
    expect(kumeCoz(link.searchParams.get('tur')!)).toEqual(kume);
    expect(link.searchParams.get('tur')).toBe(kumeKodla(kume));
  });

  it('açılış: `ev` her şeyden önce gelir ve ev açılışını açar; ev kipinde sınıf ayarı kullanılmaz', () => {
    expect(turAcilisEkrani('?ders=tur&ev=s3&tur=1z&ekran=akis')).toEqual({ ekran: 'ev', kod: 's3' });
    expect(turAcilisEkrani('?ders=tur&ev=bozuk')).toEqual({ ekran: 'ev', kod: 'bozuk' });
    expect(turAcilisEkrani('?ev=s3')).toBeNull();
    expect(turAcilisEkrani('?ders=tur&ekran=kaynaklar')).toEqual({ ekran: 'kaynaklar' });
    expect(evKipiMi('?ders=tur&ev=s3&tur=1z')).toBe(true);
    expect(evKipiMi('?ders=tur&tur=1z')).toBe(false);
  });

  it('Kaynaklar program adresi kısıt belgesindekiyle aynı', () => {
    expect(readFileSync('docs/mufredat-kisitlari-turkce.md', 'utf8')).toContain(PROGRAM_ADRESI);
  });
});
