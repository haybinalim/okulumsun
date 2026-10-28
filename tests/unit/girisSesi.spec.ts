/**
 * Adım 31 aşama 2 (KG-110): ertelenen klipler ve giriş/duyuru sesleri.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { AUDIO_MANIFEST, type SpeechKey } from '../../src/audio/audioManifest.generated';
import { klipArasi, type SpeakSource } from '../../src/audio/speech';
import {
  bahceSesi,
  duyuruluKaynak,
  evSonuSesi,
  GIRIS_ARASI_MS,
  girisliKaynak,
  girisliSoru,
  isinmaGirisi,
} from '../../src/audio/girisSesi';
import { skillsData } from '../../src/content/skillsData';
import { secilenSoruyuUret } from '../../src/progress/oturumRuntime';
import { sinifTuruBaslat, sinifTuruIlerlet, type SinifTuruDurumu } from '../../src/sinif/sinifTuru';
import { HEP_BIRLIKTE_METNI, siraDuyurusuSesi, takimKimligi, turSonuSesi } from '../../src/sinif/takim';
import { RENKLER } from '../../src/exercises/types';
import { setlenebilirDugumler, type GunlukSet } from '../../src/ogretmen/gunlukSet';
import { REGISTRY } from '../../src/exercises/registry';
import { useAppStore } from '../../src/store/appStore';
import { CIKIS_ONAYI_METNI, CIKIS_ONAYI_SESI } from '../../src/ui/gezinme/gezinme';
import type { MaddeSonuc } from '../../src/progress/itemLifecycle';
import trJson from '../../src/content/tr.json';

const ERTELENEN: readonly SpeechKey[] = [
  'ui.bir-sorun-oldu',
  'ui.hazirlaniyor',
  'ui.set-basliyor',
  'ui.set-bitti',
  'ui.cikis-onayi',
  'bahce.bugun',
  'sinifturu.basliyor',
  'sinifturu.sira-mor',
  'sinifturu.sira-turuncu',
  'sinifturu.sira-yesil',
  'sinifturu.sira-mavi',
  'sinifturu.sira-pembe',
  'sinifturu.sira-sari',
  'sinifturu.hep-birlikte',
  'sinifturu.son-tur',
  'sinifturu.kavanoz-doldu',
  'sinifturu.birlikte-calistik',
  'ev.okuldaki-konu',
  'ev.bitti',
  'ev.yetiskine-ver',
  'kesif.hosgeldin',
  'kesif.dengede',
  'kesif.ayir',
  'tematuru.basliyor',
  'tematuru.bitti',
  'isinma.basliyor',
  'isinma.bitti',
];

const anahtarlar = (s: SpeakSource): readonly SpeechKey[] => (s.kind === 'key' ? [s.key] : s.keys);
const metin = (k: SpeechKey): string => {
  const [ns, ad] = k.split('.') as [string, string];
  return (trJson as unknown as Record<string, Record<string, string>>)[ns][ad];
};

function kaynakDosyalari(kok: string): string[] {
  const out: string[] = [];
  for (const ad of readdirSync(kok)) {
    const yol = path.join(kok, ad);
    if (statSync(yol).isDirectory()) out.push(...kaynakDosyalari(yol));
    else if (/\.tsx?$/.test(ad) && !ad.endsWith('.generated.ts')) out.push(yol);
  }
  return out;
}

describe('ertelenen klipler (KG-110)', () => {
  it('27 anahtarın hepsi manifestte ve tr.json\'da; ses ve ton kuralları ("yanlış" yok, kısa)', () => {
    expect(ERTELENEN).toHaveLength(27);
    for (const k of ERTELENEN) {
      expect(AUDIO_MANIFEST[k], k).toBeDefined();
      const m = metin(k);
      expect(m.toLocaleLowerCase('tr')).not.toMatch(/yanlış|hata|kaybett/);
      expect(m.split(/\s+/).length, k).toBeLessThanOrEqual(8);
    }
  });

  it('her ertelenen klip uygulama kodunda kullanılır (yalnız tr.json\'da kalan yok)', () => {
    const kod = kaynakDosyalari(path.resolve(__dirname, '../../src'))
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n');
    for (const k of ERTELENEN) {
      const [ns, ad] = k.split('.') as [string, string];
      const dogrudan = kod.includes(`'${k}'`);
      // Renk duyurusu şablonla kurulur: `sinifturu.sira-${renk}`.
      const sablonla = ns === 'sinifturu' && ad.startsWith('sira-') && kod.includes('`sinifturu.sira-${renk}`');
      const sayiyla = k === 'bahce.bugun' && kod.includes("'bahce.bugun'");
      expect(dogrudan || sablonla || sayiyla, k).toBe(true);
    }
  });

  it('yedek klip kalmadı: ui.oturum-bitti yalnız kişisel oturum sonunda', () => {
    const kullananlar = kaynakDosyalari(path.resolve(__dirname, '../../src'))
      .filter((f) => readFileSync(f, 'utf8').includes("'ui.oturum-bitti'"))
      .map((f) => path.basename(f));
    expect(kullananlar).toEqual(['OturumSonu.tsx']);
  });

  it('çıkış onayının sesi ekrandaki cümleyle aynı', () => {
    expect(metin(CIKIS_ONAYI_SESI)).toBe(CIKIS_ONAYI_METNI);
  });
});

describe('girisliKaynak / girisliSoru', () => {
  it('tek klibin önüne giriş: ilk ara GIRIS_ARASI_MS', () => {
    expect(girisliKaynak('isinma.basliyor', { kind: 'key', key: 'soru.kac-tane' })).toEqual({
      kind: 'sequence',
      keys: ['isinma.basliyor', 'soru.kac-tane'],
      ilkAraMs: GIRIS_ARASI_MS,
    });
  });

  it('dizinin önüne giriş: kendi gapMs korunur', () => {
    const k = girisliKaynak('ui.set-basliyor', { kind: 'sequence', keys: ['sayi.3', 'op.arti', 'sayi.4'], gapMs: 320 });
    expect(k).toEqual({ kind: 'sequence', keys: ['ui.set-basliyor', 'sayi.3', 'op.arti', 'sayi.4'], gapMs: 320, ilkAraMs: GIRIS_ARASI_MS });
    expect([0, 1, 2].map((i) => klipArasi(k, i))).toEqual([GIRIS_ARASI_MS, 320, 320]);
  });

  it('klipArasi: tek klip 0, ilkAraMs yoksa varsayılan 90', () => {
    expect(klipArasi({ kind: 'key', key: 'soru.kac-tane' }, 0)).toBe(0);
    expect(klipArasi({ kind: 'sequence', keys: ['sayi.1', 'sayi.2'] }, 0)).toBe(90);
  });

  it('girisliSoru: giriş talimatın önünde, tekrarSes özgün talimat; null → aynı nesne', () => {
    const dugum = skillsData.find((d) => d.durum === 'hazir' && d.exerciseTemplates.some((t) => REGISTRY.has(t)))!;
    const templateId = dugum.exerciseTemplates.find((t) => REGISTRY.has(t))!;
    const ex = secilenSoruyuUret({ skillId: dugum.id, templateId, seed: 5, kova: 'frontier' }, skillsData, 'kisisel');
    expect(girisliSoru(ex, null)).toBe(ex);
    const g = girisliSoru(ex, 'tematuru.basliyor');
    expect(anahtarlar(g.prompt.ses)).toEqual(['tematuru.basliyor', ...anahtarlar(ex.prompt.ses)]);
    expect(g.prompt.tekrarSes).toEqual(ex.prompt.tekrarSes ?? ex.prompt.ses);
    expect(anahtarlar(g.prompt.tekrarSes!)).not.toContain('tematuru.basliyor');
    expect(g.itemId).toBe(ex.itemId);
    expect(g.options).toBe(ex.options);
  });

  it('duyuruluKaynak: duyuru yoksa kaynak aynen', () => {
    const k: SpeakSource = { kind: 'key', key: 'ui.tema-sec' };
    expect(duyuruluKaynak(null, k)).toBe(k);
    expect(anahtarlar(duyuruluKaynak('ui.set-bitti', k))).toEqual(['ui.set-bitti', 'ui.tema-sec']);
  });
});

describe('akış sesleri', () => {
  it('Bahçem: sayı + "çiçek ekledin."; 0 ve aralık dışı sessiz', () => {
    expect(bahceSesi(3)).toEqual({ kind: 'sequence', keys: ['sayi.3', 'bahce.bugun'] });
    expect(bahceSesi(0)).toBeNull();
    expect(bahceSesi(101)).toBeNull();
    expect(bahceSesi(1.5)).toBeNull();
  });

  it('ev çalışması sonu: veli başlattıysa telefonu büyüğe ver', () => {
    expect(evSonuSesi(false)).toEqual({ kind: 'key', key: 'ev.bitti' });
    expect(anahtarlar(evSonuSesi(true))).toEqual(['ev.bitti', 'ev.yetiskine-ver']);
  });

  it('ısınma: ilk maddede "ısınalım", ısınmadan sonraki ilk soruda "ısındık", başka yerde yok', () => {
    expect(isinmaGirisi({ maddeSayisi: 0, bitti: false }, false, false)).toBe('isinma.basliyor');
    expect(isinmaGirisi({ maddeSayisi: 2, bitti: false }, false, false)).toBeNull();
    expect(isinmaGirisi(null, true, true)).toBe('isinma.bitti');
    expect(isinmaGirisi(null, false, true)).toBeNull();
    expect(isinmaGirisi(null, true, false)).toBeNull();
  });
});

describe('Sınıf Turu sesleri', () => {
  const kaynak: GunlukSet = { surum: 1, dugumler: [...setlenebilirDugumler((t) => REGISTRY.has(t))].slice(0, 3), tohum: 11 };
  const sonuc: MaddeSonuc = { dogru: true, kullanilanYardimKademesi: 0, latencyMs: 900, tani: null, zamanMs: 5 };
  const ilerlet = (d: SinifTuruDurumu): SinifTuruDurumu => {
    let x = sinifTuruIlerlet(d, { tur: 'duyuruBitti' });
    x = sinifTuruIlerlet(x, { tur: 'maddeKapandi', sonuc, skillId: kaynak.dugumler[0] });
    return sinifTuruIlerlet(x, { tur: 'kutlamaBitti' });
  };

  it('sıra duyurusu tam cümle; ilk turda "başlıyor", son tura girerken "son tur"', () => {
    for (const r of RENKLER) expect(AUDIO_MANIFEST[takimKimligi(r).ses]).toBeDefined();
    let d = sinifTuruBaslat(['mor', 'mavi'], kaynak, 2);
    expect(anahtarlar(siraDuyurusuSesi(d))).toEqual(['sinifturu.basliyor', 'sinifturu.sira-mor']);
    d = ilerlet(d);
    expect(siraDuyurusuSesi(d)).toEqual({ kind: 'key', key: 'sinifturu.sira-mavi' });
    d = ilerlet(d);
    expect(anahtarlar(siraDuyurusuSesi(d))).toEqual(['sinifturu.son-tur', 'sinifturu.sira-mor']);
    d = ilerlet(d);
    expect(siraDuyurusuSesi(d)).toEqual({ kind: 'key', key: 'sinifturu.sira-mavi' });
  });

  it('takım başına tek tur: yalnız "başlıyor" (iki giriş üst üste binmez)', () => {
    const d = sinifTuruBaslat(['mor', 'mavi'], kaynak, 1);
    expect(anahtarlar(siraDuyurusuSesi(d))).toEqual(['sinifturu.basliyor', 'sinifturu.sira-mor']);
  });

  it('tur sonu: kavanoz doldu / birlikte çalıştık; şerit cümlesi klip metniyle aynı', () => {
    expect(turSonuSesi({ kavanoz: 4, kavanozHedefi: 4 })).toBe('sinifturu.kavanoz-doldu');
    expect(turSonuSesi({ kavanoz: 2, kavanozHedefi: 4 })).toBe('sinifturu.birlikte-calistik');
    expect(metin('sinifturu.hep-birlikte')).toBe(HEP_BIRLIKTE_METNI);
  });
});

describe('tek seferlik duyuru (ui.set-bitti)', () => {
  beforeEach(() => useAppStore.setState({ duyuru: null, aktifSet: null }));

  it('"Seti bitir" duyuruyu kurar; ekran okuyunca temizlenir; yalnız bellekte', () => {
    useAppStore.getState().setBaslat({ surum: 1, dugumler: [...setlenebilirDugumler((t) => REGISTRY.has(t))].slice(0, 2), tohum: 3 });
    useAppStore.getState().setBitir();
    expect(useAppStore.getState().duyuru).toBe('ui.set-bitti');
    expect(useAppStore.getState().ekran).toBe('anaEkran');
    useAppStore.getState().duyuruTemizle();
    expect(useAppStore.getState().duyuru).toBeNull();
  });
});
