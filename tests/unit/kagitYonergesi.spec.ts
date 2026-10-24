// @vitest-environment happy-dom
/**
 * KG-99: basılı kâğıtta ekran fiili yok ("dokun", "sürükle", "dinle", "kartına dokun"…). Kâğıt yönergesi
 * `kagitYonergesi.ts` kâğıt sözlüğünden gelir; ekran sözlüğü (`tr.json`) ve ses anahtarları değişmez.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import tr from '../../src/content/tr.json';
import { skillsData } from '../../src/content/skillsData';
import { HATA_TANIMLARI, type HataEtiketi } from '../../src/exercises/distractors';
import { REGISTRY } from '../../src/exercises/registry';
import { arsivIstegi, arsivKayitlari } from '../../src/ogretmen/calismaKagidi/arsiv';
import { etkiFormlariUret } from '../../src/ogretmen/calismaKagidi/etkiFormu';
import { hataNotu } from '../../src/ogretmen/calismaKagidi/cevapAnahtari';
import { EYLEM_METNI } from '../../src/ogretmen/calismaKagidi/kagitMaddesi';
import { kagitPlaniUret, type KagitPlani } from '../../src/ogretmen/calismaKagidi/kagitPlani';
import {
  EKRAN_FIILLERI,
  KAGIT_TELAFI_METINLERI,
  KAGIT_YONERGE_METINLERI,
  ekranFiilleri,
  kagitSozlugu,
} from '../../src/ogretmen/calismaKagidi/kagitYonergesi';
import { trDuzlestir } from '../../src/ogretmen/calismaKagidi/sesMetni';
import { SET_SURUMU, setlenebilirDugumler } from '../../src/ogretmen/gunlukSet';
import { KagitSayfalari } from '../../src/ui/print/KagitSayfalari';

const TR = trDuzlestir(tr as unknown as Record<string, unknown>);
const kayitli = (t: string): boolean => REGISTRY.has(t);

/** Çocuğa yönerge olarak söylenmeyen gruplar (geri bildirim, yardım, arayüz, tema adı). */
const YONERGE_DISI = new Set(['geri', 'yardim', 'ui', 'tema']);

function sayfaMetni(plan: KagitPlani): string {
  const html = renderToStaticMarkup(
    createElement(KagitSayfalari, { plan, duzen: '2x3', cevapAnahtariDahil: true, siyahBeyaz: false, kopya: 'onizleme' }),
  );
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

function yonergeler(plan: Pick<KagitPlani, 'sayfalar'>): string[] {
  return plan.sayfalar.flatMap((s) => s.map((m) => m.yonergeMetni));
}

describe('kâğıt yönergeleri (KG-99)', () => {
  it('kara liste ekran fiillerini yakalar, kâğıt fiillerini geçirir', () => {
    for (const m of ['Nesnelere dokunarak say.', 'Kartına dokun.', 'Sesi dinle, rakamı seç.', 'Sürükle ve bırak.', 'Düğmeye bas.']) {
      expect(ekranFiilleri(m), m).not.toEqual([]);
    }
    for (const m of ['Nesneleri parmağınla göstererek say.', 'Cevabı kutuya yaz.', 'Basamak değerini yaz.', 'Eşlerini çizgiyle birleştir.']) {
      expect(ekranFiilleri(m), m).toEqual([]);
    }
    expect(EKRAN_FIILLERI.length).toBeGreaterThan(5);
  });

  it('kâğıt metinleri var olan ses anahtarlarına bağlı; ekran sözlüğü ve ses değişmedi', () => {
    for (const [k, v] of Object.entries(KAGIT_YONERGE_METINLERI)) {
      expect(TR[k], k).toBeDefined();
      expect(v).not.toBe(TR[k]);
      expect(ekranFiilleri(v), k).toEqual([]);
      expect(v.length).toBeLessThanOrEqual(48);
    }
    // Ekran yönergesi aynen: kâğıt sözlüğü tr.json'u değiştirmez.
    expect(TR['soru.dokunarak-say']).toBe('Nesnelere dokunarak say.');
    const once = JSON.stringify(TR);
    kagitSozlugu(TR);
    expect(JSON.stringify(TR)).toBe(once);
  });

  it('yönerge olabilecek her ses anahtarının kâğıt metni ekran fiili taşımaz', () => {
    const kagit = kagitSozlugu(TR);
    const kirli = Object.keys(TR)
      .filter((k) => !YONERGE_DISI.has(k.split('.')[0]))
      .flatMap((k) => (ekranFiilleri(kagit[k]).length > 0 ? [`${k}: ${kagit[k]}`] : []));
    expect(kirli).toEqual([]);
    for (const e of Object.values(EYLEM_METNI)) expect(ekranFiilleri(e), e).toEqual([]);
  });

  it('cevap anahtarı telafi önerileri ekran fiili ve ham ses anahtarı taşımaz', () => {
    for (const e of Object.keys(HATA_TANIMLARI) as HataEtiketi[]) {
      const ipucu = hataNotu(e)?.ipucu ?? '';
      expect(ekranFiilleri(ipucu), e).toEqual([]);
      expect(ipucu, e).not.toMatch(/\b[a-z]+\.[a-z0-9-]+\b/);
    }
    for (const k of Object.keys(KAGIT_TELAFI_METINLERI)) expect(HATA_TANIMLARI[k as HataEtiketi]).toBeDefined();
  });

  it('165 arşiv kâğıdının basılan metninde ekran fiili yok', () => {
    const kayitlar = arsivKayitlari(skillsData);
    expect(kayitlar.length).toBe(165);
    const kirli: string[] = [];
    for (const k of kayitlar) {
      const plan = kagitPlaniUret(arsivIstegi(k), TR, kayitli);
      for (const y of yonergeler(plan)) if (ekranFiilleri(y).length > 0) kirli.push(`${k.yol}: ${y}`);
      const metin = sayfaMetni(plan);
      if (ekranFiilleri(metin).length > 0) kirli.push(`${k.yol}: ${ekranFiilleri(metin).join(',')}`);
    }
    expect(kirli).toEqual([]);
  }, 60_000);

  it('M-SAY kâğıt yönergesi kâğıda özgü ("parmağınla göstererek say")', () => {
    const k = arsivKayitlari(skillsData).find((r) => {
      const p = kagitPlaniUret(arsivIstegi(r), TR, kayitli);
      return p.sayfalar.some((s) => s.some((m) => m.templateId === 'M-SAY'));
    });
    expect(k).toBeDefined();
    const plan = kagitPlaniUret(arsivIstegi(k!), TR, kayitli);
    const say = plan.sayfalar.flat().find((m) => m.templateId === 'M-SAY')!;
    expect(say.yonergeMetni).toBe('Nesneleri parmağınla göstererek say. Kaç tane var?');
  });

  it('etki Form A/B basılan metninde ekran fiili yok', () => {
    const { A, B } = etkiFormlariUret(TR, kayitli);
    for (const f of [A, B]) {
      for (const y of yonergeler(f)) expect(ekranFiilleri(y), `${f.kod}: ${y}`).toEqual([]);
      expect(ekranFiilleri(sayfaMetni(f))).toEqual([]);
    }
  });

  it('çalışma kâğıdı ekranının her düğüm × yanıt tercihi × tohum planında ekran fiili yok', () => {
    const kirli: string[] = [];
    for (const d of setlenebilirDugumler(kayitli)) {
      for (const yanitTercihi of ['daireIcineAl', 'yazmaliOlabilir'] as const) {
        for (const tohum of [1, 77, 4242]) {
          const plan = kagitPlaniUret(
            { set: { surum: SET_SURUMU, dugumler: [d], tohum }, maddeSayisi: 12, duzen: '2x3', yanitTercihi },
            TR,
            kayitli,
          );
          for (const y of yonergeler(plan)) if (ekranFiilleri(y).length > 0) kirli.push(`${d}/${yanitTercihi}/${tohum}: ${y}`);
        }
      }
    }
    expect(kirli).toEqual([]);
  }, 60_000);
});
