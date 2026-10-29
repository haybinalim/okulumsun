import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  BANKNOT_OLCULERI_MM,
  EN_BUYUK_BANKNOT,
  TCMB_KAGIT_OLCEK_SINIRI,
  banknotGoreliOlcek,
  tcmbEnBuyukPiksel,
} from "../../src/content/paraGorseli";
import { BANKNOTLAR } from "../../src/exercises/types";
import {
  KART_BANKNOT_EN_BUYUK_YUZDE,
  kartBanknotYuzdesi,
} from "../../src/ui/primitives/kartBanknot";
import {
  CSS_PX_MM,
  KAGIT_BANKNOT_GENISLIK_PX,
  kagitBanknotGenislikPx,
} from "../../src/ui/print/kagitBanknot";
import { TcmbBanknot } from "../../src/ui/svg/TcmbBanknot";
import { Visual } from "../../src/ui/svg/Visual";

/**
 * KG-123 (kullanıcı kararı 2026-10-29 08:30): banknotlar ekranda ve kâğıtta gerçek birbirine göre boyutlarında —
 * 200 TL 5 TL'den ~%23 uzun. En büyük kupür eski ölçüde (kartta %88, kâğıtta ≈ 39,7 mm), diğerleri gerçek
 * uzunluk oranıyla küçülür.
 */
describe("banknotlar gerçek birbirine göre boyutlarında (KG-123)", () => {
  it("göreli ölçek gerçek uzunluk oranıdır; 200 TL = 1, 5 TL = 0,8125, kupürle artar", () => {
    expect(EN_BUYUK_BANKNOT).toBe(200);
    expect(banknotGoreliOlcek(200)).toBe(1);
    expect(banknotGoreliOlcek(5)).toBeCloseTo(130 / 160, 10);
    expect(banknotGoreliOlcek(200) / banknotGoreliOlcek(5)).toBeCloseTo(
      1.2308,
      3,
    );
    const olcekler = BANKNOTLAR.map(banknotGoreliOlcek);
    for (let i = 1; i < olcekler.length; i++)
      expect(olcekler[i]).toBeGreaterThan(olcekler[i - 1]);
    for (const d of BANKNOTLAR) {
      expect(banknotGoreliOlcek(d)).toBeCloseTo(
        BANKNOT_OLCULERI_MM[d].en / 160,
        10,
      );
    }
  });

  it("seçenek kartı: 200 TL %88, 5 TL %71,5; oran gerçek uzunluk oranı", () => {
    expect(KART_BANKNOT_EN_BUYUK_YUZDE).toBe(88);
    expect(kartBanknotYuzdesi(200)).toBeCloseTo(88, 10);
    expect(kartBanknotYuzdesi(5)).toBeCloseTo(71.5, 10);
    for (const a of BANKNOTLAR) {
      for (const b of BANKNOTLAR) {
        expect(kartBanknotYuzdesi(a) / kartBanknotYuzdesi(b)).toBeCloseTo(
          BANKNOT_OLCULERI_MM[a].en / BANKNOT_OLCULERI_MM[b].en,
          10,
        );
      }
    }
  });

  it("seçenek kartı: 1920×1080 tahtada (~320 px kart) hiçbir kupür 72 dpi gerçek boyut dosyasından büyük değil", () => {
    // Tahtada kart ~320 px; banknot ≤ %88 → ≤ 282 px. Dosyalar gerçek boyutta 72 dpi (368–453 px); CSS yalnız küçültür.
    for (const d of BANKNOTLAR) {
      expect((320 * kartBanknotYuzdesi(d)) / 100).toBeLessThan(
        tcmbEnBuyukPiksel(d).en,
      );
    }
  });

  it("kâğıt: 200 TL 150 px ≈ 39,7 mm, diğerleri orantılı; her kupür tek yüz ve gerçeğin %75’inden küçük", () => {
    expect(kagitBanknotGenislikPx(200)).toBe(KAGIT_BANKNOT_GENISLIK_PX);
    expect(kagitBanknotGenislikPx(200) * CSS_PX_MM).toBeCloseTo(39.6875, 3);
    expect(kagitBanknotGenislikPx(5) * CSS_PX_MM).toBeCloseTo(32.246, 2);
    for (const d of BANKNOTLAR) {
      const o = BANKNOT_OLCULERI_MM[d];
      const enMm = kagitBanknotGenislikPx(d) * CSS_PX_MM;
      const boyMm = (enMm * o.boy) / o.en;
      // Hepsi aynı mm/mm ölçeğinde: gerçek birbirine göre boyut.
      expect(enMm / o.en).toBeCloseTo(39.6875 / 160, 6);
      expect(enMm).toBeLessThan(o.en * TCMB_KAGIT_OLCEK_SINIRI);
      expect(boyMm).toBeLessThan(o.boy * TCMB_KAGIT_OLCEK_SINIRI);
      // Kâğıt seçenek kutusu 40 mm: hiçbir kupür kutudan taşmaz (sayfa yerleşimi değişmez).
      expect(enMm).toBeLessThanOrEqual(40);
    }
  });

  it("TcmbBanknot kâğıt genişliğini (kesirli) CSS’e, yuvarlanmış tamsayıyı width/height özniteliğine yazar", () => {
    const img = renderToStaticMarkup(
      createElement(TcmbBanknot, {
        deger: 5,
        genislik: kagitBanknotGenislikPx(5),
      }),
    );
    expect(img).toContain('width="122"');
    expect(img).toContain('height="60"');
    expect(img).toContain("width:121.875px");
  });

  it("Visual: aynı kutuda kupürler gerçek birbirine göre boyutlarında; 200 TL kutuya sığar", () => {
    const olc = (deger: (typeof BANKNOTLAR)[number], w: number, h: number) => {
      const svg = renderToStaticMarkup(
        createElement(Visual, {
          spec: { type: "banknot", deger },
          width: w,
          height: h,
        }),
      );
      const im = /<image[^>]*>/.exec(svg)?.[0] ?? "";
      return {
        gw: Number(/ width="([\d.]+)"/.exec(im)?.[1]),
        gh: Number(/ height="([\d.]+)"/.exec(im)?.[1]),
      };
    };
    for (const [w, h] of [
      [300, 200],
      [120, 120],
      [400, 100],
    ] as const) {
      const buyuk = olc(200, w, h);
      expect(buyuk.gw).toBeLessThanOrEqual(w);
      expect(buyuk.gh).toBeLessThanOrEqual(h);
      for (const d of BANKNOTLAR) {
        const k = olc(d, w, h);
        expect(k.gw / buyuk.gw).toBeCloseTo(BANKNOT_OLCULERI_MM[d].en / 160, 6);
        expect(k.gh / buyuk.gh).toBeCloseTo(BANKNOT_OLCULERI_MM[d].boy / 72, 6);
      }
    }
  });
});
