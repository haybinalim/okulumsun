/** Plan v2 Adım 45 (KG-111): derin tema girişi içeriği — şema, 7 tema × 4 adım, sesler manifestte. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AUDIO_MANIFEST } from '../../src/audio/audioManifest.generated';
import { GIRIS_BEKLEME_ARALIGI, TEMA_GIRISI_ADIM_SAYISI, TemaGirisleriSchema } from '../../src/content/schema/temaGirisi';
import { temaGirisiIcerigi } from '../../src/content/temaGirisleri';
import { YASAK_SOZCUKLER } from '../../src/content/schema/maskotHikayesi';
import { TEMALAR } from '../../src/store/appStore';
import { Visual } from '../../src/ui/svg/Visual';

const KOK = path.resolve(__dirname, '../..');
const ham = JSON.parse(readFileSync(path.join(KOK, 'src/content/temaGirisleri.json'), 'utf8'));
const tr = JSON.parse(readFileSync(path.join(KOK, 'src/content/tr.json'), 'utf8')) as Record<string, Record<string, string>>;

describe('temaGirisleri.json — şema', () => {
  const d = TemaGirisleriSchema.parse(ham);

  it('7 temanın her biri bir kez, her temada 4 adım; tema numaraları uygulamanın temalarıyla aynı', () => {
    expect(d.girisler.map((g) => g.tema).sort()).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(TEMALAR.map((t) => t.no).sort()).toEqual([1, 2, 3, 4, 5, 6, 7]);
    for (const g of d.girisler) expect(g.adimlar).toHaveLength(TEMA_GIRISI_ADIM_SAYISI);
  });

  it('28 ses anahtarı giris.t1-1 … giris.t7-4; hepsi tr.json ve ses manifestinde', () => {
    const beklenen = [1, 2, 3, 4, 5, 6, 7].flatMap((t) => [1, 2, 3, 4].map((n) => `giris.t${t}-${n}`));
    const anahtarlar = d.girisler.flatMap((g) => g.adimlar.map((a) => a.ses));
    expect([...anahtarlar].sort()).toEqual([...beklenen].sort());
    for (const k of anahtarlar) {
      expect(AUDIO_MANIFEST[k], k).toBeDefined();
      expect(AUDIO_MANIFEST[k].file).toBe(`giris/${k.slice('giris.'.length)}.m4a`);
    }
    expect(Object.keys(tr.giris).filter((k) => !k.startsWith('$'))).toHaveLength(28);
  });

  it('metinler: en çok iki kısa cümle, ceza/yarış/acele dili ve "yanlış" yok; dokun adımı "dokun" der', () => {
    for (const g of d.girisler)
      for (const a of g.adimlar) {
        const metin = tr.giris[a.ses.slice('giris.'.length)];
        expect(metin.length, a.ses).toBeLessThanOrEqual(80);
        expect((metin.match(/[.!?]/g) ?? []).length, a.ses).toBeLessThanOrEqual(2);
        expect(YASAK_SOZCUKLER.test(metin), a.ses).toBe(false);
        if (a.eylem === 'dokun') expect(metin, a.ses).toMatch(/dokun\.$/);
      }
  });

  it('ilk ve son adım izle, en az bir dokun; dokun hedefi tekil; beklemeler sınırda', () => {
    for (const g of d.girisler) {
      expect(g.adimlar[0].eylem).toBe('izle');
      expect(g.adimlar[3].eylem).toBe('izle');
      expect(g.adimlar.some((a) => a.eylem === 'dokun')).toBe(true);
      for (const a of g.adimlar) {
        expect(a.enUzunBeklemeMs).toBeGreaterThanOrEqual(GIRIS_BEKLEME_ARALIGI.enAz);
        expect(a.enUzunBeklemeMs).toBeLessThanOrEqual(GIRIS_BEKLEME_ARALIGI.enCok);
        expect(Boolean(a.hedefAssetId)).toBe(a.eylem === 'dokun');
      }
    }
  });

  it('şema bozuk girdiyi reddeder (eksik hedef, yanlış anahtar sırası, eksik tema)', () => {
    const kopya = () => JSON.parse(JSON.stringify(ham));
    const a = kopya();
    delete a.girisler[0].adimlar[1].hedefAssetId;
    expect(TemaGirisleriSchema.safeParse(a).success).toBe(false);
    const b = kopya();
    [b.girisler[0].adimlar[0].ses, b.girisler[0].adimlar[1].ses] = [b.girisler[0].adimlar[1].ses, b.girisler[0].adimlar[0].ses];
    expect(TemaGirisleriSchema.safeParse(b).success).toBe(false);
    const c = kopya();
    c.girisler.pop();
    expect(TemaGirisleriSchema.safeParse(c).success).toBe(false);
    const e = kopya();
    e.girisler[2].adimlar[0].eylem = 'dokun';
    e.girisler[2].adimlar[0].hedefAssetId = 'yeni';
    expect(TemaGirisleriSchema.safeParse(e).success).toBe(false);
  });

  it('nesne adetleri 1. sınıf sınırında (≤ 20)', () => {
    const adetler = JSON.stringify(ham).match(/"(adet|ilkAdet|degisimAdedi|birimAdedi)":(\d+)/g) ?? [];
    expect(adetler.length).toBeGreaterThan(0);
    for (const x of adetler) expect(Number(x.split(':')[1])).toBeLessThanOrEqual(20);
  });
});

describe('temaGirisiIcerigi ve görseller', () => {
  it('yükleyici her temayı verir, bilinmeyen tema null', () => {
    for (let t = 1; t <= 7; t++) expect(temaGirisiIcerigi(t)?.tema).toBe(t);
    expect(temaGirisiIcerigi(8)).toBeNull();
  });

  it('her adımın görseli çizilir (SVG, boş değil)', () => {
    for (let t = 1; t <= 7; t++)
      for (const a of temaGirisiIcerigi(t)!.adimlar) {
        const html = renderToStaticMarkup(createElement(Visual, { spec: a.gorsel, width: 400, height: 280 }));
        expect(html, a.ses).toMatch(/<svg|<img/);
      }
  });
});
