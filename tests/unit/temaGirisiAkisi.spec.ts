/**
 * Plan v2 Adım 45 aşama 2 (KG-112): derin tema girişi akışı (saf durum makinesi) ve biçim kararı
 * (kişiselde oturum başına bir derin giriş, tahtada yalnız öğretmen "Temaya giriş" kartıyla).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { temaGirisiIcerigi } from '../../src/content/temaGirisleri';
import { useAppStore } from '../../src/store/appStore';
import {
  DOKUN_TEKRAR_SINIRI,
  GIRIS_BASLANGIC,
  girisIlerlet,
  kisiselGirisBicimi,
  type GirisDurumu,
  type GirisOlayi,
} from '../../src/ui/temaGirisiAkisi';

const KOK = path.resolve(__dirname, '../..');
const ADIMLAR = [{ eylem: 'izle' }, { eylem: 'dokun' }, { eylem: 'dokun' }, { eylem: 'izle' }] as const;

function oynat(olaylar: readonly GirisOlayi['tur'][], adimlar: readonly { eylem: 'izle' | 'dokun' }[] = ADIMLAR): GirisDurumu {
  return olaylar.reduce<GirisDurumu>((d, tur) => girisIlerlet(d, { tur } as GirisOlayi, adimlar), GIRIS_BASLANGIC);
}

describe('girisIlerlet — derin tema girişi akışı', () => {
  it('izle adımı bekleme dolunca kendiliğinden ilerler', () => {
    expect(oynat(['beklemeDoldu'])).toEqual({ adim: 1, tekrar: 0, dokunuldu: false, bitti: false });
  });

  it('izle adımında dokunuş ve övgü olayı durumu değiştirmez (aynı nesne)', () => {
    const d = GIRIS_BASLANGIC;
    expect(girisIlerlet(d, { tur: 'dokun' }, ADIMLAR)).toBe(d);
    expect(girisIlerlet(d, { tur: 'ovguBitti' }, ADIMLAR)).toBe(d);
  });

  it('dokun adımı: dokunuş → övgü → sonraki adım; çift dokunuş yok sayılır', () => {
    const d1 = oynat(['beklemeDoldu', 'dokun']);
    expect(d1).toMatchObject({ adim: 1, dokunuldu: true, bitti: false });
    expect(girisIlerlet(d1, { tur: 'dokun' }, ADIMLAR)).toBe(d1);
    // Dokunulduktan sonra bekleme zamanlayıcısı gelse de ilerlemez (övgü bekleniyor).
    expect(girisIlerlet(d1, { tur: 'beklemeDoldu' }, ADIMLAR)).toBe(d1);
    expect(girisIlerlet(d1, { tur: 'ovguBitti' }, ADIMLAR)).toEqual({ adim: 2, tekrar: 0, dokunuldu: false, bitti: false });
  });

  it(`dokunulmazsa anlatım ${DOKUN_TEKRAR_SINIRI} kez tekrarlanır, sonra kendiliğinden ilerler (takılma yok)`, () => {
    expect(DOKUN_TEKRAR_SINIRI).toBe(1);
    expect(oynat(['beklemeDoldu', 'beklemeDoldu'])).toEqual({ adim: 1, tekrar: 1, dokunuldu: false, bitti: false });
    expect(oynat(['beklemeDoldu', 'beklemeDoldu', 'beklemeDoldu'])).toEqual({ adim: 2, tekrar: 0, dokunuldu: false, bitti: false });
  });

  it('tekrardan sonra da dokunulabilir', () => {
    expect(oynat(['beklemeDoldu', 'beklemeDoldu', 'dokun', 'ovguBitti'])).toMatchObject({ adim: 2, tekrar: 0 });
  });

  it('hiç dokunmayan çocuk: 4 adım en çok 6 bekleme olayında biter', () => {
    const d = oynat(Array(6).fill('beklemeDoldu'));
    expect(d.bitti).toBe(true);
    expect(oynat(Array(5).fill('beklemeDoldu')).bitti).toBe(false);
  });

  it('dokunan çocuk: izle, dokun+övgü, dokun+övgü, izle → biter; bittikten sonra her olay yok sayılır', () => {
    const d = oynat(['beklemeDoldu', 'dokun', 'ovguBitti', 'dokun', 'ovguBitti', 'beklemeDoldu']);
    expect(d.bitti).toBe(true);
    for (const tur of ['beklemeDoldu', 'dokun', 'ovguBitti'] as const) expect(girisIlerlet(d, { tur }, ADIMLAR)).toBe(d);
  });

  it('adım dizisi boşsa ya da sınır dışındaysa biter (ekran asılı kalmaz)', () => {
    expect(girisIlerlet(GIRIS_BASLANGIC, { tur: 'beklemeDoldu' }, []).bitti).toBe(true);
  });

  it('gerçek içerikle: 7 temanın her biri dokunuşsuz da dokunuşlu da biter', () => {
    for (let t = 1; t <= 7; t++) {
      const ic = temaGirisiIcerigi(t)!;
      let d = GIRIS_BASLANGIC;
      for (let i = 0; i < 20 && !d.bitti; i++) d = girisIlerlet(d, { tur: 'beklemeDoldu' }, ic.adimlar);
      expect(d.bitti, `tema ${t} dokunuşsuz`).toBe(true);
      d = GIRIS_BASLANGIC;
      for (let i = 0; i < 20 && !d.bitti; i++) {
        const eylem = ic.adimlar[d.adim]!.eylem;
        d = girisIlerlet(d, { tur: eylem === 'dokun' ? (d.dokunuldu ? 'ovguBitti' : 'dokun') : 'beklemeDoldu' }, ic.adimlar);
      }
      expect(d.bitti, `tema ${t} dokunuşlu`).toBe(true);
    }
  });
});

describe('tema girişi biçimi — appStore (yalnız bellek)', () => {
  beforeEach(() => useAppStore.getState().sifirla());

  it('kisiselGirisBicimi: ilk kez derin, sonra kısa', () => {
    expect(kisiselGirisBicimi(false)).toBe('derin');
    expect(kisiselGirisBicimi(true)).toBe('kisa');
  });

  it('kişisel: oturumdaki ilk tema seçimi derin, sonrakiler kısa', () => {
    const s = useAppStore.getState();
    s.modSec('kisisel');
    s.temaSec(1);
    expect(useAppStore.getState()).toMatchObject({ ekran: 'temaGirisi', temaGirisiBicimi: 'derin', derinGirisGosterildi: true });
    s.ekranGit('anaEkran');
    s.temaSec(2);
    expect(useAppStore.getState()).toMatchObject({ ekran: 'temaGirisi', temaGirisiBicimi: 'kisa' });
  });

  it('uygulama sıfırlanınca (yeni oturum) yine bir derin giriş', () => {
    useAppStore.getState().modSec('kisisel');
    useAppStore.getState().temaSec(1);
    useAppStore.getState().sifirla();
    useAppStore.getState().modSec('kisisel');
    useAppStore.getState().temaSec(3);
    expect(useAppStore.getState().temaGirisiBicimi).toBe('derin');
  });

  it('tahta: tema seçimi girişsiz konu seçimine gider; "Temaya giriş" derin girişi açar', () => {
    const s = useAppStore.getState();
    s.modSec('tahta');
    s.temaSec(4);
    expect(useAppStore.getState()).toMatchObject({ ekran: 'konuSecimi', derinGirisGosterildi: false });
    s.temaGirisiBaslat();
    expect(useAppStore.getState()).toMatchObject({ ekran: 'temaGirisi', temaGirisiBicimi: 'derin', oncekiEkran: 'konuSecimi' });
  });

  it('tema seçilmeden temaGirisiBaslat hiçbir şey yapmaz', () => {
    useAppStore.getState().modSec('tahta');
    const once = useAppStore.getState().ekran;
    useAppStore.getState().temaGirisiBaslat();
    expect(useAppStore.getState().ekran).toBe(once);
  });
});

describe('derin giriş — paket ve gizlilik', () => {
  const kaynak = (p: string) => readFileSync(path.join(KOK, p), 'utf8');

  it('DerinTemaGirisi tembel yüklenir; içerik JSON yalnız tembel ekran üzerinden içe aktarılır', () => {
    expect(kaynak('src/ui/screens/TemaGirisi.tsx')).toMatch(/lazy\(\(\) => import\('\.\/DerinTemaGirisi'\)\)/);
    expect(kaynak('src/ui/screens/TemaGirisi.tsx')).not.toMatch(/from '\.\/DerinTemaGirisi'/);
    expect(kaynak('src/ui/screens/TemaGirisi.tsx')).not.toMatch(/temaGirisleri/);
  });

  it('akış ve ekran depolamaya, ağa, saate ve rastgeleliğe dokunmaz', () => {
    for (const p of ['src/ui/temaGirisiAkisi.ts', 'src/ui/screens/DerinTemaGirisi.tsx']) {
      const k = kaynak(p);
      expect(k, p).not.toMatch(/localStorage|sessionStorage|indexedDB|fetch\(|Math\.random|Date\.now/);
    }
    expect(kaynak('src/ui/temaGirisiAkisi.ts')).not.toMatch(/setTimeout|speech|performance/);
  });
});
