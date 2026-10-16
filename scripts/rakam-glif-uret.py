#!/usr/bin/env python3
"""
MEB TYMM 2024 "TemelYazi" fontundan rakam varlıklarını üretir (KG-95).

    pip install fonttools brotli
    python3 scripts/rakam-glif-uret.py --kaynak <TemelYazi .otf klasörü>

Kaynak: MEB Talim ve Terbiye Kurulu Başkanlığı, "İlkokul Türkçe Dersi Öğretim
Programı ve İlk Okuma Yazma Ders Kitabında Yer Alan Alfabe ve Rakamlar" duyurusu
(2024): https://ttkb.meb.gov.tr/www/ilkokulturkcedersiogretimprogramiveilkokumayazmaderskitabindayeralanalfabeverakamlaryayimlandi/icerik/610
Font ailesi TemelYazi (HBY Tasarım, sürüm 1.007). Kaynak .otf dosyaları REPOYA
KONMAZ (lisans metni yok, bkz. public/fonts/LICENSE.md); yalnız aşağıdaki türev
çıktılar commitlenir:

1. public/fonts/TemelYazi-Rakam.woff2
   TemelYazi-Bold'dan alt küme: 0-9, + < = > ve U+2212 (eksi; fontta yok,
   kısa çizgi glifine eşlenir). Uygulama metnindeki rakamlar bu yüzden MEB
   biçiminde çıkar (src/index.css 'TemelYaziRakam').
   Neden Bold: Andika 400'ün gövde kalınlığı ~93/1000 em; TemelYazi Light 24,
   Regular 47, Bold 71. Andika'nın yanında en yakın ağırlık Bold'dur ve MEB
   Kılavuz (yazım yönü oklu) fontu da Bold gövdesini kullanır.
2. src/ui/svg/rakamGlifYollari.ts
   0-9 Bold konturları, DOLGULU SVG path, 100x100 viewBox: taban y=85,
   rakam yüksekliği 70 birim (ölçek 0,1), glif yatayda x=50'ye ortalı.
3. src/ui/svg/rakamKilavuzYollari.ts
   Aynı rakamların TemelYazi-Kilavuz glifleri (MEB'in numaralı yazım yönü
   okları dahil), aynı dönüşümle; gövde Bold path'iyle üst üste gelir.
   Yalnız geliştirme glif kartı ve öğretmen formu kullanır (paket dışı).

Ağ kullanmaz. Çıktı deterministiktir.
"""
from __future__ import annotations

import argparse
import io
import os
import sys

from fontTools import subset
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.ttLib import TTFont

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAKAM_ADLARI = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
OLCEK = 0.1  # 700 birim rakam yüksekliği -> 70 viewBox birimi
TABAN = 85.0


def sayi(v: float) -> str:
    s = f'{round(v, 1):.1f}'.rstrip('0').rstrip('.')
    return '0' if s in ('-0', '') else s


def konturlar(glyphset, ad: str) -> list[list[tuple]]:
    """Glifi kontur listesine böler (her biri RecordingPen kayıtları)."""
    p = RecordingPen()
    glyphset[ad].draw(p)
    sonuc, simdiki = [], []
    for op, args in p.value:
        simdiki.append((op, args))
        if op in ('closePath', 'endPath'):
            sonuc.append(simdiki)
            simdiki = []
    if simdiki:
        sonuc.append(simdiki)
    return sonuc


def sinir(kontur: list[tuple], glyphset) -> tuple[float, float, float, float]:
    bp = BoundsPen(glyphset)
    for op, args in kontur:
        getattr(bp, op)(*args)
    return bp.bounds


def path(konturlar_: list[list[tuple]], dx: float) -> str:
    """Font birimindeki konturları viewBox path'ine çevirir (y ekseni çevrilir)."""
    sp = SVGPathPen(None, ntos=sayi)
    tp = TransformPen(sp, (OLCEK, 0, 0, -OLCEK, dx, TABAN))
    for k in konturlar_:
        for op, args in k:
            getattr(tp, op)(*args)
    return sp.getCommands()


def en_buyuk(konturlar_, glyphset):
    def alan(k):
        x0, y0, x1, y1 = sinir(k, glyphset)
        return (x1 - x0) * (y1 - y0)
    return max(konturlar_, key=alan)


def woff2_uret(bold: str, cikti: str) -> int:
    font = TTFont(bold)
    secenek = subset.Options()
    secenek.flavor = 'woff2'
    secenek.layout_features = []
    secenek.name_IDs = ['*']  # telif / tasarımcı kayıtları korunur
    secenek.name_languages = ['*']
    secenek.notdef_outline = True
    secenek.desubroutinize = True
    alt = subset.Subsetter(secenek)
    alt.populate(unicodes=[*range(0x30, 0x3A), 0x2B, 0x3C, 0x3D, 0x3E], glyphs=['hyphen'])
    alt.subset(font)
    # U+2212 EKSİ fontta yok: işlem kartlarındaki '−' MEB kısa çizgisiyle çıksın.
    for tablo in font['cmap'].tables:
        if tablo.isUnicode():
            tablo.cmap[0x2212] = 'hyphen'
    font['head'].modified = font['head'].created  # deterministik çıktı
    tampon = io.BytesIO()
    font.flavor = 'woff2'
    font.save(tampon, reorderTables=True)
    veri = tampon.getvalue()
    with open(cikti, 'wb') as f:
        f.write(veri)
    return len(veri)


BASLIK = """/**
 * ÜRETİLMİŞ DOSYA — ELLE DÜZENLEMEYİN.
 * `python3 scripts/rakam-glif-uret.py --kaynak <TemelYazi klasörü>` üretir (KG-95).
 * Kaynak: MEB TTKB TYMM 2024 "TemelYazi" (HBY Tasarım, sürüm 1.007), {kaynak}.
 * 100×100 viewBox, taban y=85, rakam yüksekliği 70, x=50'ye ortalı. {aciklama}
 */
"""


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--kaynak', required=True, help='TemelYazi-Bold.otf ve TemelYazi-Kilavuz.otf klasörü')
    a = ap.parse_args()
    bold = os.path.join(a.kaynak, 'TemelYazi-Bold.otf')
    kilavuz = os.path.join(a.kaynak, 'TemelYazi-Kilavuz.otf')

    bayt = woff2_uret(bold, os.path.join(KOK, 'public/fonts/TemelYazi-Rakam.woff2'))

    bf = TTFont(bold)
    kf = TTFont(kilavuz)
    bgs, kgs = bf.getGlyphSet(), kf.getGlyphSet()
    yollar, kilavuz_yollari = [], []
    for r, ad in enumerate(RAKAM_ADLARI):
        bk = konturlar(bgs, ad)
        x0, _, x1, _ = sinir([op for k in bk for op in k], bgs)
        dx = 50 - (x0 + x1) / 2 * OLCEK
        genislik = round((x1 - x0) * OLCEK, 1)
        yollar.append((r, path(bk, dx), genislik))
        # Kılavuz gövdesini Bold gövdesine hizala (en büyük konturun sol kenarı).
        kk = konturlar(kgs, ad)
        kayma = sinir(en_buyuk(bk, bgs), bgs)[0] - sinir(en_buyuk(kk, kgs), kgs)[0]
        kilavuz_yollari.append((r, path(kk, dx + kayma * OLCEK)))

    with open(os.path.join(KOK, 'src/ui/svg/rakamGlifYollari.ts'), 'w', encoding='utf-8') as f:
        f.write(BASLIK.format(kaynak='TemelYazi-Bold', aciklama='DOLGULU çizilir (stroke yok).'))
        f.write('\n/** [rakam, path, genişlik] — genişlik: glifin yatay kapsamı (viewBox birimi). */\n')
        f.write('export const RAKAM_GLIF_YOLLARI: readonly (readonly [number, string, number])[] = [\n')
        for r, p, g in yollar:
            f.write(f"  [{r}, '{p}', {sayi(g)}],\n")
        f.write('];\n')
    with open(os.path.join(KOK, 'src/ui/svg/rakamKilavuzYollari.ts'), 'w', encoding='utf-8') as f:
        f.write(BASLIK.format(
            kaynak='TemelYazi-Kilavuz (MEB yazım yönü okları dahil)',
            aciklama='DOLGULU. Yalnız geliştirme glif kartı ve öğretmen formu içe aktarır; uygulama paketine girmez.',
        ))
        f.write('\nexport const RAKAM_KILAVUZ_YOLLARI: readonly string[] = [\n')
        for _, p in kilavuz_yollari:
            f.write(f"  '{p}',\n")
        f.write('];\n')
    print(f'TemelYazi-Rakam.woff2 {bayt} B; 10 glif + 10 kılavuz yazıldı')
    return 0


if __name__ == '__main__':
    sys.exit(main())
