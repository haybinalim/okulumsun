/**
 * Türkçe etkinlik çeşitliliği (Adım 79, kullanıcı isteği 2026-11-06): şablona özgü kurallar. Ortak kurallar
 * (determinizm, D-11/D-12/D-23, klip manifesti, kart sayısı, doğrulayıcı) `turSablon.spec.ts`'te bütün
 * `TUR_SABLON_KODLARI` için koşar; burada yeni şablonların kendi tek-doğru ve zorluk kuralları sınanır.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { havuzuAyristir } from '../../src/content/dersler/tur/sablonlar/havuz';
import { TUR_ZORLUKLARI, TurUretimHatasi, turSoruUret, type TurSoru, type TurSablonKodu } from '../../src/content/dersler/tur/sablonlar';
import { karistirilanlar } from '../../src/content/dersler/tur/sablonlar/celdiriciler';
import { bilinenSozcukMu, enYeniHarf, kumeHarfleri, okunabilirSozcukler } from '../../src/content/dersler/tur/sablonlar/ortak';
import { sesYeri } from '../../src/content/dersler/tur/sablonlar/t18SesinYeri';
import { hecele } from '../../src/content/dersler/tur/heceleme';
import { parcaBenzerMi } from '../../src/content/dersler/tur/sablonlar/t09HarfParcalari';
import { sozcukKlibi } from '../../src/content/dersler/tur/sablonlar/klipler';
import { resmiKume } from '../../src/content/dersler/tur/ogretilenKume';
import { OGRETIM_SIRASI } from '../../src/content/dersler/tur/alfabe';
import type { TurHamleGlifi } from '../../src/content/schema/turHamle';

const havuz = havuzuAyristir(JSON.parse(readFileSync('ders-verisi/tur/icerik/sozcukler.json', 'utf8')) as unknown);
const hamleler = (JSON.parse(readFileSync('ders-verisi/tur/hamleler.json', 'utf8')) as { glifler: TurHamleGlifi[] }).glifler;
const KUMELER: Set<string>[] = [
  ...OGRETIM_SIRASI.slice(0, 12).flatMap((h) => [resmiKume(h, false), resmiKume(h, true)]),
  new Set(['a', 'e', 'l', 'k', 'o', 'm']),
];

function uret(sablon: TurSablonKodu): { soru: TurSoru; kume: Set<string> }[] {
  const out: { soru: TurSoru; kume: Set<string> }[] = [];
  for (const kume of KUMELER)
    for (const zorluk of TUR_ZORLUKLARI)
      for (let tohum = 1; tohum <= 8; tohum++)
        try {
          out.push({ soru: turSoruUret(sablon, { havuz, hamleler, kume, zorluk, tohum }), kume });
        } catch (e) {
          if (!(e instanceof TurUretimHatasi)) throw e;
        }
  return out;
}

describe('T-09 Harfi parçalardan kur', () => {
  const sorular = uret('T-09');
  const glif = new Map(hamleler.map((g) => [g.glif, g]));

  it('her zorlukta kurulur; hamle verisi yoksa açıklayıcı hata', () => {
    for (const z of TUR_ZORLUKLARI) expect(sorular.filter((u) => u.soru.zorluk === z).length, `z${z}`).toBeGreaterThan(100);
    expect(() => turSoruUret('T-09', { havuz, kume: resmiKume('t', false), zorluk: 1, tohum: 1 })).toThrow(TurUretimHatasi);
  });

  it('cevap hedef glifin bütün hamleleri, yazılış sırasıyla; kartlar sessiz parça, ses yok (D-12)', () => {
    for (const { soru, kume } of sorular) {
      if (soru.kind !== 'yerlestir' || soru.uyaran.tur !== 'parca') throw new Error('T-09 biçimi');
      const g = glif.get(soru.uyaran.glif)!;
      expect(kume.has(g.glif)).toBe(true);
      expect(g.bicim).not.toBe('rakam');
      expect(soru.dogruDizi).toEqual(g.hamleler.map((h) => `${g.glif}${h.sira}`));
      expect(soru.soruKlipleri).toEqual([]);
      expect(soru.geriBildirim).toEqual(['tur.geri.dogru']);
      expect(soru.sirasiz ?? false).toBe(soru.zorluk <= 2);
      for (const k of soru.kartlar) {
        expect(k.tur).toBe('parca');
        expect(kume.has(k.parca!.glif), `${k.metin} öğretilmiş glif`).toBe(true);
      }
      const enCok = { 1: 2, 2: 2, 3: 3, 4: 4, 5: 4 }[soru.zorluk];
      expect(g.hamleler.length).toBeGreaterThanOrEqual(2);
      expect(g.hamleler.length).toBeLessThanOrEqual(enCok);
    }
  });

  it('tek doğru: çeldirici parça hedefin hiçbir parçasına benzemez; z1 çeldiricisiz, z5 en çok 3 çeldirici', () => {
    for (const { soru } of sorular) {
      if (soru.kind !== 'yerlestir') continue;
      const cevap = new Set(soru.dogruDizi);
      const hedef = soru.kartlar.filter((k) => cevap.has(k.metin));
      const celd = soru.kartlar.filter((k) => !cevap.has(k.metin));
      expect(celd.length).toBeLessThanOrEqual({ 1: 0, 2: 1, 3: 1, 4: 2, 5: 3 }[soru.zorluk]);
      for (const c of celd) for (const h of hedef) expect(parcaBenzerMi(c.parca!, h.parca!), `${soru.itemId} ${c.metin}~${h.metin}`).toBe(false);
    }
  });

  it('benzerlik ölçüsü: aynı hamle ve ters yönü benzer; i noktası ile l çizgisi benzemez', () => {
    const i = glif.get('i')!;
    const l = glif.get('l')!;
    const p = (g: TurHamleGlifi, n: number) => ({ noktalar: g.hamleler[n].noktalar, genislik: g.genislik });
    expect(parcaBenzerMi(p(i, 0), p(i, 0))).toBe(true);
    expect(parcaBenzerMi(p(i, 0), { ...p(i, 0), noktalar: [...i.hamleler[0].noktalar].reverse() })).toBe(true);
    expect(parcaBenzerMi(p(i, 1), p(l, 0))).toBe(false);
  });
});

describe('T-16 Hatalı yazılmış sözcüğü bul', () => {
  const sorular = uret('T-16');

  it('her zorlukta kurulur', () => {
    for (const z of TUR_ZORLUKLARI) expect(sorular.filter((u) => u.soru.zorluk === z).length, `z${z}`).toBeGreaterThan(100);
  });

  it('tek hatalı kart: bilinen sözcük değil, hedeften tek harfi karıştırılan çiftiyle farklı; ötekiler okunabilir sözcük', () => {
    for (const { soru, kume } of sorular) {
      if (soru.kind !== 'secim') throw new Error('T-16 seçim');
      const okunur = new Set(okunabilirSozcukler(havuz, kume).map((s) => s.metin));
      const hatali = soru.kartlar[soru.dogru].metin;
      expect(bilinenSozcukMu(hatali, havuz), hatali).toBe(false);
      const a = [...soru.hedefMetin];
      const b = [...hatali];
      expect(b.length).toBe(a.length);
      const fark = a.map((c, i) => (c === b[i] ? -1 : i)).filter((i) => i >= 0);
      expect(fark, `${soru.hedefMetin} → ${hatali}`).toHaveLength(1);
      const [i] = fark;
      expect(karistirilanlar(a[i], kume).map((k) => k.harf)).toContain(b[i]);
      if (soru.zorluk === 5) expect(i).toBeGreaterThan(0);
      for (const k of soru.kartlar) {
        expect(k.tur).toBe('sozcuk');
        if (k.metin !== hatali) expect(okunur.has(k.metin), k.metin).toBe(true);
      }
      expect(soru.kartlar.length).toBe({ 1: 2, 2: 3, 3: 3, 4: 4, 5: 4 }[soru.zorluk]);
      expect(soru.soruKlipleri).toEqual([]);
      expect(soru.geriBildirim).toEqual(['tur.geri.dogru', sozcukKlibi(soru.hedefMetin)]);
    }
  });
});

describe('T-17 Hece say', () => {
  const sorular = uret('T-17');

  it('her zorlukta kurulur; cevap sözcüğün hece sayısı, kartlar 1…n sıralı', () => {
    for (const z of TUR_ZORLUKLARI) expect(sorular.filter((u) => u.soru.zorluk === z).length, `z${z}`).toBeGreaterThan(100);
    for (const { soru } of sorular) {
      if (soru.kind !== 'secim') throw new Error('T-17 seçim');
      const n = hecele(soru.hedefMetin).length;
      expect(soru.kartlar.map((k) => k.metin)).toEqual(Array.from({ length: soru.kartlar.length }, (_, i) => String(i + 1)));
      expect(soru.kartlar.length).toBe({ 1: 2, 2: 3, 3: 3, 4: 4, 5: 4 }[soru.zorluk]);
      expect(soru.kartlar[soru.dogru].metin).toBe(String(n));
      if (soru.zorluk === 5) expect(n).toBeGreaterThanOrEqual(2);
    }
  });

  it('z1–3 resimli (görseli olan sözcük, adı soru sesi); z4–5 yalnız yazı, soru sesi yok (D-12)', () => {
    for (const { soru } of sorular) {
      const w = havuz.find((s) => s.metin === soru.hedefMetin)!;
      if (soru.zorluk <= 3) {
        expect(soru.uyaran).toEqual({ tur: 'resim', gorselId: w.gorselId, ...(soru.zorluk <= 2 ? { metin: w.metin } : {}) });
        expect(soru.soruKlipleri).toEqual([sozcukKlibi(w.metin)]);
        expect(soru.dinlenen).toEqual([w.metin]);
      } else {
        expect(soru.uyaran).toEqual({ tur: 'yazi', metin: w.metin });
        expect(soru.soruKlipleri).toEqual([]);
      }
    }
  });

  it('cevaplar çeşitli: z4’te birden çok hece sayısı çıkar', () => {
    const z4 = new Set(sorular.filter((u) => u.soru.zorluk === 4).map((u) => hecele(u.soru.hedefMetin).length));
    expect(z4.size).toBeGreaterThanOrEqual(3);
  });
});

describe('T-18 Sesin yeri', () => {
  const sorular = uret('T-18');

  it('her zorlukta kurulur; hedef harf sözcükte tam bir kez, cevap onun yeri', () => {
    for (const z of TUR_ZORLUKLARI) expect(sorular.filter((u) => u.soru.zorluk === z).length, `z${z}`).toBeGreaterThan(100);
    for (const { soru, kume } of sorular) {
      if (soru.kind !== 'secim' || soru.uyaran.tur !== 'resim') throw new Error('T-18 biçimi');
      const h = soru.uyaran.harf!;
      expect(kume.has(h)).toBe(true);
      expect([...soru.hedefMetin].filter((c) => c === h)).toHaveLength(1);
      const yer = sesYeri(soru.hedefMetin, h);
      expect(soru.kartlar[soru.dogru].metin).toBe(yer);
      expect(soru.kartlar.map((k) => k.metin)).toEqual(soru.zorluk === 1 ? ['bas', 'son'] : ['bas', 'orta', 'son']);
      if (soru.zorluk <= 2) expect(yer).not.toBe('orta');
      if (soru.zorluk === 4) expect(yer).not.toBe('bas');
      expect(havuz.find((s) => s.metin === soru.hedefMetin)?.gorselId).toBe(soru.uyaran.gorselId);
      expect(soru.soruKlipleri).toEqual([sozcukKlibi(soru.hedefMetin)]);
    }
  });

  it('bugünkü ses öncelikli (z1–4); her yer cevap olarak çıkar (z3)', () => {
    const z3 = sorular.filter((u) => u.soru.zorluk === 3);
    expect(new Set(z3.map((u) => (u.soru.kind === 'secim' ? u.soru.kartlar[u.soru.dogru].metin : ''))).size).toBe(3);
    const bugun = sorular.filter(
      (u) => u.soru.zorluk <= 4 && u.soru.uyaran.tur === 'resim' && u.soru.uyaran.harf === enYeniHarf(kumeHarfleri(u.kume)),
    ).length;
    expect(bugun / sorular.filter((u) => u.soru.zorluk <= 4).length).toBeGreaterThan(0.4);
  });

  it('sesYeri: tekrar eden harf belirsizdir', () => {
    expect(sesYeri('kalem', 'k')).toBe('bas');
    expect(sesYeri('kalem', 'l')).toBe('orta');
    expect(sesYeri('kalem', 'm')).toBe('son');
    expect(sesYeri('anne', 'n')).toBeNull();
    expect(sesYeri('anne', 'k')).toBeNull();
  });
});

describe('T-19 Aynı sesle eşleştir', () => {
  const sorular = uret('T-19');

  it('her zorlukta kurulur; tek doğru eşleşme (çiftin sesi yalnız kendi eşininkiyle aynı)', () => {
    for (const z of TUR_ZORLUKLARI) expect(sorular.filter((u) => u.soru.zorluk === z).length, `z${z}`).toBeGreaterThan(60);
    for (const { soru } of sorular) {
      if (soru.kind !== 'eslestir') throw new Error('T-19 eşleştir');
      const son = soru.zorluk === 5;
      const ses = (i: number) => {
        const k = soru.kartlar[i];
        return k.tur === 'harf' ? k.metin : son ? k.metin[k.metin.length - 1] : k.metin[0];
      };
      expect(soru.ciftler.length).toBe({ 1: 2, 2: 3, 3: 3, 4: 4, 5: 4 }[soru.zorluk]);
      for (const [a, b] of soru.ciftler) expect(ses(a), soru.itemId).toBe(ses(b));
      expect(new Set(soru.ciftler.map(([a]) => ses(a))).size).toBe(soru.ciftler.length);
      const yari = soru.kartlar.length / 2;
      for (let i = 0; i < yari; i++) expect(soru.kartlar[i].tur).toBe('gorsel');
      for (let i = yari; i < soru.kartlar.length; i++) expect(soru.kartlar[i].tur).toBe(soru.zorluk <= 2 ? 'harf' : 'gorsel');
      expect(soru.soruKlipleri).toEqual([]);
      expect(soru.geriBildirim[0]).toBe('tur.geri.dogru');
    }
  });
});

describe('T-20 Harf avı', () => {
  const sorular = uret('T-20');

  it('her zorlukta kurulur; doğrular hedefi taşıyan kartların tamamı; z4–5 heceler okunabilir sözcüklerden', () => {
    for (const z of TUR_ZORLUKLARI) expect(sorular.filter((u) => u.soru.zorluk === z).length, `z${z}`).toBeGreaterThan(100);
    for (const { soru, kume } of sorular) {
      if (soru.kind !== 'coklu') throw new Error('T-20 çoklu');
      const h = soru.hedefMetin;
      expect(kume.has(h)).toBe(true);
      expect(soru.dogrular).toEqual(soru.kartlar.flatMap((k, i) => (k.metin.includes(h) ? [i] : [])));
      expect(soru.dogrular.length).toBeGreaterThanOrEqual(1);
      expect(soru.dogrular.length).toBeLessThan(soru.kartlar.length);
      expect(soru.kartlar.length).toBe({ 1: 4, 2: 6, 3: 8, 4: 6, 5: 8 }[soru.zorluk]);
      for (const k of soru.kartlar) expect(k.tur).toBe(soru.zorluk >= 4 ? 'hece' : 'harf');
      if (soru.zorluk >= 4) {
        const heceler = new Set(okunabilirSozcukler(havuz, kume).flatMap((s) => hecele(s.metin)));
        for (const k of soru.kartlar) expect(heceler.has(k.metin), k.metin).toBe(true);
        expect(new Set(soru.kartlar.map((k) => k.metin)).size).toBe(soru.kartlar.length);
      }
      expect(soru.soruKlipleri).toEqual([]);
      expect(soru.uyaran).toEqual({ tur: 'yazi', metin: h });
    }
  });
});
