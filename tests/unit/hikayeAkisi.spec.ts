/** Plan v2 Adım 54 aşama 2 (KG-116): hikâye akışı (giriş açılışı, oturum sonu sahnesi, bellekteki sayaç). */
import { beforeEach, describe, expect, it } from 'vitest';
import { siradakiSahne } from '../../src/content/maskotHikayeleri';
import { useAppStore } from '../../src/store/appStore';
import {
  girisHikayesiSesi,
  hikayeAnahtari,
  HIKAYE_ARA_MS,
  oturumSonuHikayesiVar,
  oturumSonuSahneNo,
  oturumSonuSesi,
  temaOturumuEkle,
} from '../../src/ui/hikayeAkisi';

describe('hikayeAnahtari', () => {
  it('7 tema × 3 sahne manifestte; dışı null', () => {
    for (let t = 1; t <= 7; t++) for (let n = 1; n <= 3; n++) expect(hikayeAnahtari(t, n)).toBe(`hikaye.t${t}-${n}`);
    expect(hikayeAnahtari(8, 1)).toBeNull();
    expect(hikayeAnahtari(1, 0)).toBeNull();
    expect(hikayeAnahtari(1, 4)).toBeNull();
    expect(hikayeAnahtari(1.5, 1)).toBeNull();
  });
});

describe('derin giriş açılışı', () => {
  it('selam + 1. sahne, aralarında nefes payı', () => {
    expect(girisHikayesiSesi(3)).toEqual({ kind: 'sequence', keys: ['maskot.selam', 'hikaye.t3-1'], ilkAraMs: HIKAYE_ARA_MS });
  });
  it('hikâyesi olmayan tema → null (açılış atlanır)', () => {
    expect(girisHikayesiSesi(0)).toBeNull();
  });
});

describe('oturum sonu sahnesi', () => {
  it('1. oturum → 2. sahne, 2. ve sonrası → 3. sahne; siradakiSahne ile aynı sıra', () => {
    expect(oturumSonuSahneNo(0)).toBeNull();
    expect(oturumSonuSahneNo(1)).toBe(2);
    expect(oturumSonuSahneNo(2)).toBe(3);
    expect(oturumSonuSahneNo(9)).toBe(3);
    for (const n of [1, 2, 5]) expect(siradakiSahne(4, n)?.no).toBe(oturumSonuSahneNo(n));
  });

  it('ses: "oturum bitti" + sıradaki sahne; hikâye yoksa yalnız "oturum bitti"', () => {
    expect(oturumSonuSesi(2, 1)).toEqual({
      kind: 'sequence',
      keys: ['ui.oturum-bitti', 'hikaye.t2-2'],
      ilkAraMs: HIKAYE_ARA_MS,
    });
    expect(oturumSonuSesi(2, 4)).toMatchObject({ keys: ['ui.oturum-bitti', 'hikaye.t2-3'] });
    expect(oturumSonuSesi(null, 1)).toEqual({ kind: 'key', key: 'ui.oturum-bitti' });
    expect(oturumSonuSesi(2, 0)).toEqual({ kind: 'key', key: 'ui.oturum-bitti' });
  });

  it('yalnız kişisel modda ve tema seçiliyken', () => {
    expect(oturumSonuHikayesiVar('kisisel', 1, 1)).toBe(true);
    expect(oturumSonuHikayesiVar('tahta', 1, 1)).toBe(false);
    expect(oturumSonuHikayesiVar(null, 1, 1)).toBe(false);
    expect(oturumSonuHikayesiVar('kisisel', null, 1)).toBe(false);
    expect(oturumSonuHikayesiVar('kisisel', 1, 0)).toBe(false);
  });
});

describe('bellekteki tema oturumu sayacı (Seçenek A)', () => {
  beforeEach(() => useAppStore.getState().sifirla());

  it('temaOturumuEkle saf: yeni nesne, yalnız o tema artar', () => {
    const a = { 1: 2 };
    const b = temaOturumuEkle(a, 3);
    expect(b).toEqual({ 1: 2, 3: 1 });
    expect(a).toEqual({ 1: 2 });
  });

  it('kişisel tema oturumu sayacı artırır; tahta ve set oturumu artırmaz; sıfırla temizler', () => {
    const s = useAppStore.getState;
    useAppStore.setState({ mod: 'kisisel', secilenTemaNo: 5, aktifSet: null });
    s().oturumuTamamla();
    s().oturumuTamamla();
    expect(s().temaOturumlari).toEqual({ 5: 2 });
    useAppStore.setState({ mod: 'tahta', secilenTemaNo: 5 });
    s().oturumuTamamla();
    expect(s().temaOturumlari).toEqual({ 5: 2 });
    useAppStore.setState({ mod: 'kisisel', secilenTemaNo: 5, aktifSet: { dugumler: [] } as never });
    s().oturumuTamamla();
    expect(s().temaOturumlari).toEqual({ 5: 2 });
    s().sifirla();
    expect(s().temaOturumlari).toEqual({});
  });

  it('sayaç kalıcı depolamaya yazılmaz (yalnız bellek): localStorage/IndexedDB anahtarı yok', () => {
    useAppStore.setState({ mod: 'kisisel', secilenTemaNo: 1, aktifSet: null });
    useAppStore.getState().oturumuTamamla();
    const ls = typeof localStorage === 'undefined' ? [] : Object.keys(localStorage);
    expect(ls.filter((k) => /tema|hikaye|oturum/i.test(k))).toEqual([]);
  });
});
