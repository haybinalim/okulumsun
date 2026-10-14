/** Plan v2 Adım 54 aşama 1: maskot tema hikâyeleri (şema, 7×3, pozlar) ve tema sahneleri (KG-91). */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AUDIO_MANIFEST } from '../../src/audio/audioManifest.generated';
import { siradakiSahne, temaHikayesi } from '../../src/content/maskotHikayeleri';
import { HIKAYEDE_YASAK_POZLAR, MASKOT_POZLARI, MaskotHikayeleriSchema } from '../../src/content/schema/maskotHikayesi';
import { SAHNE_ADLARI, TEMA_SAHNESI, type TemaNo } from '../../src/content/temaDunyalari';
import { COLOR } from '../../src/design/tokens';
import { TEMALAR } from '../../src/store/appStore';
import {
  gecerliMaskotDurumu,
  maskotGuncelle,
  type MaskotDurumu,
  type MaskotOlayi,
} from '../../src/ui/feedback/maskotState';
import { SAHNE_PALETI } from '../../src/design/sahnePaleti';
import { TemaSahnesi } from '../../src/ui/svg/temaSahneleri';

const KOK = path.resolve(__dirname, '../..');
const ham = JSON.parse(readFileSync(path.join(KOK, 'src/content/maskotHikayeleri.json'), 'utf8'));
const tr = JSON.parse(readFileSync(path.join(KOK, 'src/content/tr.json'), 'utf8'));

describe('maskotHikayeleri.json — şema ve 7 × 3', () => {
  const d = MaskotHikayeleriSchema.parse(ham);

  it('7 temanın her biri bir kez, her temada 3 sahne', () => {
    expect(d.hikayeler.map((h) => h.tema).sort()).toEqual([1, 2, 3, 4, 5, 6, 7]);
    for (const h of d.hikayeler) expect(h.sahneler.map((s) => s.no)).toEqual([1, 2, 3]);
  });

  it('21 ses anahtarı hikaye.t1-1 … hikaye.t7-3', () => {
    const beklenen = [1, 2, 3, 4, 5, 6, 7].flatMap((t) => [1, 2, 3].map((n) => `hikaye.t${t}-${n}`));
    expect(d.hikayeler.flatMap((h) => h.sahneler.map((s) => s.sesAnahtari)).sort()).toEqual(beklenen.sort());
  });

  it('ses anahtarları henüz tr.json ve ses manifestinde YOK (KG-01; Adım 31 eklenince bu test manifest denetimine döner)', () => {
    expect(tr.hikaye).toBeUndefined();
    expect(Object.keys(AUDIO_MANIFEST).filter((k) => k.startsWith('hikaye.'))).toEqual([]);
  });

  it('her tema kendi dünyasında; dünya adları tam ve tekil', () => {
    for (const h of d.hikayeler) expect(h.sahne).toBe(TEMA_SAHNESI[h.tema as TemaNo]);
    expect(new Set(Object.values(TEMA_SAHNESI)).size).toBe(SAHNE_ADLARI.length);
    expect(TEMALAR.map((t) => t.no).sort()).toEqual(Object.keys(TEMA_SAHNESI).map(Number).sort());
  });

  it('nesne adetleri 1. sınıf sınırında (≤ 20)', () => {
    const adetler = JSON.stringify(ham).match(/"(adet|ilkAdet|degisimAdedi)":(\d+)/g) ?? [];
    expect(adetler.length).toBeGreaterThan(0);
    for (const a of adetler) expect(Number(a.split(':')[1])).toBeLessThanOrEqual(20);
  });
});

describe('pozlar maskotState ile uyumlu', () => {
  it('şemadaki poz listesi PLAN §7.5 altı durumunun tamamı', () => {
    expect(MASKOT_POZLARI).toHaveLength(6);
    for (const p of MASKOT_POZLARI) expect(gecerliMaskotDurumu(p)).toBe(true);
    // Makinenin her olaydan sonra ulaştığı durumlar listede.
    const olaylar: MaskotOlayi[] = [
      { tur: 'talimatBasladi' },
      { tur: 'talimatBitti' },
      { tur: 'secimBasladi' },
      { tur: 'dogruCevap' },
      { tur: 'yanlisCevap' },
      { tur: 'yardimIstendi' },
      { tur: 'hareketsizlik60sn' },
      { tur: 'dokunma' },
      { tur: 'sifirla' },
    ];
    for (const d of MASKOT_POZLARI)
      for (const o of olaylar) expect(MASKOT_POZLARI).toContain(maskotGuncelle(d as MaskotDurumu, o));
  });

  it('her sahnenin pozu geçerli bir maskot durumu ve olay pozu değil', () => {
    for (const h of MaskotHikayeleriSchema.parse(ham).hikayeler)
      for (const s of h.sahneler) {
        expect(gecerliMaskotDurumu(s.poz)).toBe(true);
        expect(HIKAYEDE_YASAK_POZLAR).not.toContain(s.poz);
      }
  });

  it('son sahne sevinçli (karakter kitabı: hikâye iyi biter)', () => {
    for (const h of MaskotHikayeleriSchema.parse(ham).hikayeler) expect(h.sahneler[2].poz).toBe('sevinmis');
  });
});

describe('şema reddeder', () => {
  const bozuk = (f: (k: typeof ham) => void) => {
    const k = structuredClone(ham);
    f(k);
    return MaskotHikayeleriSchema.safeParse(k).success;
  };
  it('eksik ve yinelenen tema', () => {
    expect(bozuk((k) => k.hikayeler.splice(0, 1))).toBe(false);
    expect(bozuk((k) => k.hikayeler.push(k.hikayeler[0]))).toBe(false);
  });
  it('2 veya 4 sahne, karışık sıra, uyumsuz ses anahtarı', () => {
    expect(bozuk((k) => k.hikayeler[0].sahneler.pop())).toBe(false);
    expect(bozuk((k) => k.hikayeler[0].sahneler.push(k.hikayeler[0].sahneler[0]))).toBe(false);
    expect(bozuk((k) => k.hikayeler[0].sahneler.reverse())).toBe(false);
    expect(bozuk((k) => (k.hikayeler[0].sahneler[0].sesAnahtari = 'hikaye.t2-1'))).toBe(false);
  });
  it('olay pozları (cesaretlendiriyor, uykulu) ve bilinmeyen poz', () => {
    expect(bozuk((k) => (k.hikayeler[0].sahneler[0].poz = 'uykulu'))).toBe(false);
    expect(bozuk((k) => (k.hikayeler[0].sahneler[0].poz = 'cesaretlendiriyor'))).toBe(false);
    expect(bozuk((k) => (k.hikayeler[0].sahneler[0].poz = 'uzgun'))).toBe(false);
  });
  it('ceza/yarış/üzüntü dili ve ikiden çok cümle', () => {
    expect(bozuk((k) => (k.hikayeler[0].sahneler[0].metin = 'Bu cevap yanlış oldu, tekrar bak.'))).toBe(false);
    expect(bozuk((k) => (k.hikayeler[0].sahneler[0].metin = 'Hadi yarışalım, en çok kim sayacak?'))).toBe(false);
    expect(bozuk((k) => (k.hikayeler[0].sahneler[0].metin = 'Maskot çok üzgün bugün.'))).toBe(false);
    expect(bozuk((k) => (k.hikayeler[0].sahneler[0].metin = 'Bir. İki. Üç cümle oldu.'))).toBe(false);
  });
  it('yanlış dünya ve geçersiz görsel', () => {
    expect(bozuk((k) => (k.hikayeler[0].sahne = 'pazar'))).toBe(false);
    expect(
      bozuk(
        (k) =>
          (k.hikayeler[0].sahneler[0].gorsel = { type: 'nesneKumesi', sprite: 'dinozor', adet: 2, layout: 'sira' }),
      ),
    ).toBe(false);
  });
});

describe('yükleyici (derleme zamanı doğrulamalı veri)', () => {
  it('temaHikayesi ve siradakiSahne: giriş 1. sahne, her oturum bir sonraki, 3. sahnede kalır', () => {
    expect(temaHikayesi(2)?.sahne).toBe('bahce');
    expect(temaHikayesi(8)).toBeNull();
    expect([0, 1, 2, 3, 9].map((n) => siradakiSahne(4, n)?.no)).toEqual([1, 2, 3, 3, 3]);
    expect(siradakiSahne(99, 0)).toBeNull();
  });
});

// ---------------------------------------------------------------- tema sahneleri

function parlaklik(hex: string): number {
  const k = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = k.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function kontrast(a: string, b: string): number {
  const [x, y] = [parlaklik(a), parlaklik(b)].sort((p, q) => q - p) as [number, number];
  return (x + 0.05) / (y + 0.05);
}
/** Ton (derece) ve renklilik (max − min, 0–1; açık pastellerde HSL doygunluğundan anlamlı). */
function tonVeRenklilik(hex: string): { ton: number; renklilik: number } {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const dlt = mx - mn;
  if (dlt === 0) return { ton: 0, renklilik: 0 };
  let ton = mx === r ? ((g - b) / dlt) % 6 : mx === g ? (b - r) / dlt + 2 : (r - g) / dlt + 4;
  ton = (ton * 60 + 360) % 360;
  return { ton, renklilik: dlt };
}

describe('tema sahneleri (PLAN §8, dokunulmaz arka plan)', () => {
  const palet = Object.values(SAHNE_PALETI);

  it('palet açık pastel: her renk metin rengine ≥ 7:1, kırmızı ton yok', () => {
    for (const r of palet) {
      expect(kontrast(r, COLOR.ink), r).toBeGreaterThanOrEqual(7);
      const { ton, renklilik } = tonVeRenklilik(r);
      if (renklilik > 0.04) expect(ton > 20 && ton < 330, `${r} kırmızı tonda`).toBe(true);
    }
  });

  for (const sahne of SAHNE_ADLARI) {
    it(`${sahne}: aria-hidden, olay almaz, metin/düğme/bağlantı yok, yalnız palet renkleri`, () => {
      const svg = renderToStaticMarkup(createElement(TemaSahnesi, { sahne }));
      expect(svg).toContain('aria-hidden="true"');
      expect(svg).toContain('focusable="false"');
      expect(svg).toMatch(/pointer-events:\s*none/);
      expect(svg).toContain(`data-tema-sahnesi="${sahne}"`);
      expect(svg).not.toMatch(/<(text|a|button|foreignObject|image|use)\b/);
      expect(svg).not.toMatch(/on[A-Z][a-z]+=|tabindex/i);
      const renkler = svg.match(/#[0-9A-Fa-f]{6}\b/g) ?? [];
      expect(renkler.length).toBeGreaterThan(3);
      for (const r of renkler) expect(palet, `${sahne}: ${r} palette yok`).toContain(r.toUpperCase());
    });
  }
});

describe('uygulamaya bağlı değil (KG-91)', () => {
  it('hiçbir ekran/uygulama dosyası maskotHikayeleri veya temaSahneleri modülünü içe aktarmaz', () => {
    const dosyalar: string[] = [];
    const gez = (d: string) => {
      for (const ad of readdirSync(d)) {
        const p = path.join(d, ad);
        if (statSync(p).isDirectory()) gez(p);
        else if (/\.(ts|tsx)$/.test(ad)) dosyalar.push(p);
      }
    };
    gez(path.join(KOK, 'src'));
    const izinli = new Set([
      'src/content/maskotHikayeleri.ts',
      'src/ui/svg/temaSahneleri.tsx',
      'src/content/schema/maskotHikayesi.ts',
    ]);
    const ihlal = dosyalar
      .map((p) => path.relative(KOK, p).split(path.sep).join('/'))
      .filter((p) => !izinli.has(p) && !p.startsWith('src/dev/'))
      .filter((p) =>
        /from '[^']*(maskotHikayeleri|temaSahneleri)(\.tsx?)?'/.test(readFileSync(path.join(KOK, p), 'utf8')),
      );
    expect(ihlal).toEqual([]);
  });
});
