/**
 * Türkçe sözcük görselleri denetimi (Okuma Yazma planı §2.4.8, Adım 68; kural D-25). SAF.
 *
 * `npm run validate` ve testler koşar. Dizin (`gorseller/grup-<n>.json`) ve SVG metni denetlenir:
 *
 * - **Dizin:** her resimli sözcüğün tam bir görseli var; görselin sözcüğü resimli listede; kimlik tüm gruplarda tek;
 *   dosya adı kimlikle aynı; `resimsiz` sözcük resimli listede değil.
 * - **MEB kuralı (K-OY-02, K-OY-08):** görsel yalnız sözcüğün bütün harfleri öğretildiğinde kullanılır — sözcüğün resmî
 *   sıradaki giriş grubu dizinin grubuyla aynı olmalı (öğretilmemiş harfli sözcüğe görsel yok).
 * - **SVG (KG-104 kaynak kuralı):** `viewBox="0 0 100 100"`; ≤ 6 KB; `<mask>`, metin, raster/dış kaynak, betik, stil,
 *   gradyan ve filtre yok; renkler yalnız paletten (`gorselPaleti.ts`); her `url(#…)` aynı dosyada tanımlı; kimlikler
 *   görsel kimliğiyle önekli (aynı sayfada birden çok görsel çakışmaz); gri baskı için koyu kontur var (parlaklık ≤ 0,06).
 */
import { goreliParlaklik } from '../../../ui/svg/renkTonlari';
import { girisNoktasi } from './ogretilenKume';
import { izinliRenkler } from './gorselPaleti';
import type { TurGorselDizini } from '../../schema/turGorsel';

export const GORSEL_BAYT_TAVANI = 6 * 1024;

export interface GorselIhlali {
  readonly kural: 'D-25';
  readonly oge: string;
  readonly mesaj: string;
}

const YASAK_OGELER: readonly [RegExp, string][] = [
  [/<mask\b/i, '<mask> yasak (Chromium printToPDF, KG-104)'],
  [/<(text|tspan|textPath)\b/i, 'görselde metin yok'],
  [/<(image|foreignObject|use)\b/i, 'raster/dış kaynak/başvuru öğesi yok'],
  [/<script\b|\son[a-z]+\s*=/i, 'betik yok'],
  [/<style\b|\sstyle\s*=/i, 'stil yok (renkler öznitelikte, paletten)'],
  [/Gradient\b/, 'gradyan yok (düz tonlar)'],
  [/<filter\b|\sfilter\s*=/i, 'filtre yok'],
  [/href\s*=/i, 'href yok'],
  [/font-|font=/i, 'yazı tipi yok'],
];

const RENK_OZNITELIGI = /\s(fill|stroke)="([^"]*)"/g;

/** Tek SVG metnini denetler. `id` görsel kimliğidir (kimlik öneki için). */
export function svgDenetle(id: string, svg: string, renkler: ReadonlySet<string> = izinliRenkler()): GorselIhlali[] {
  const ihlal = (mesaj: string): GorselIhlali => ({ kural: 'D-25', oge: id, mesaj });
  const sonuc: GorselIhlali[] = [];
  const bayt = new TextEncoder().encode(svg).length;
  if (bayt > GORSEL_BAYT_TAVANI) sonuc.push(ihlal(`${bayt} B > ${GORSEL_BAYT_TAVANI} B`));
  if (!/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 100 100"[ >]/.test(svg))
    sonuc.push(ihlal('kök <svg xmlns=… viewBox="0 0 100 100"> ile başlamalı'));
  const disAdresler = svg.replace('xmlns="http://www.w3.org/2000/svg"', '').match(/https?:|data:/gi);
  if (disAdresler) sonuc.push(ihlal('dış adres ya da data: URI yok'));
  for (const [desen, mesaj] of YASAK_OGELER) if (desen.test(svg)) sonuc.push(ihlal(mesaj));

  let koyuKontur = false;
  for (const [, ad, deger] of svg.matchAll(RENK_OZNITELIGI)) {
    if (deger === 'none' || /^url\(#[^)]+\)$/.test(deger)) continue;
    if (!renkler.has(deger.toUpperCase())) sonuc.push(ihlal(`palet dışı renk ${ad}="${deger}"`));
    else if (ad === 'stroke' && goreliParlaklik(deger) <= 0.06) koyuKontur = true;
  }
  if (!koyuKontur) sonuc.push(ihlal('koyu kontur yok (gri baskıda okunurluk)'));

  const tanimli = [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const tek = new Set(tanimli);
  if (tek.size !== tanimli.length) sonuc.push(ihlal('dosya içinde yinelenen id'));
  for (const k of tanimli) if (!k.startsWith(`${id}-`)) sonuc.push(ihlal(`id "${k}" görsel kimliğiyle önekli değil`));
  for (const [, ref] of svg.matchAll(/url\(#([^)]+)\)/g))
    if (!tek.has(ref)) sonuc.push(ihlal(`url(#${ref}) tanımsız`));
  return sonuc;
}

/** Dizin(ler)i ve dosyaları birlikte denetler. `dosyalar`: göreli yol (`gorseller/x.svg`) → SVG metni. */
export function gorselDizinleriniDenetle(
  dizinler: readonly TurGorselDizini[],
  dosyalar: ReadonlyMap<string, string>,
): GorselIhlali[] {
  const sonuc: GorselIhlali[] = [];
  const ihlal = (oge: string, mesaj: string) => sonuc.push({ kural: 'D-25', oge, mesaj });
  const kimlikler = new Map<string, number>();
  const sozcukler = new Map<string, number>();
  const renkler = izinliRenkler();

  for (const d of dizinler) {
    const resimli = new Set(d.resimliSozcukler);
    if (resimli.size !== d.resimliSozcukler.length) ihlal(`grup-${d.grup}`, 'resimli listede yinelenen sözcük');
    const gorselli = new Map<string, number>();
    for (const g of d.gorseller) {
      if (kimlikler.has(g.id)) ihlal(g.id, `kimlik yineleniyor (grup ${kimlikler.get(g.id)} ve ${d.grup})`);
      kimlikler.set(g.id, d.grup);
      if (sozcukler.has(g.sozcuk)) ihlal(g.id, `"${g.sozcuk}" sözcüğünün ikinci görseli`);
      sozcukler.set(g.sozcuk, d.grup);
      gorselli.set(g.sozcuk, (gorselli.get(g.sozcuk) ?? 0) + 1);
      if (g.dosya !== `gorseller/${g.id}.svg`) ihlal(g.id, `dosya adı kimlikle aynı değil (${g.dosya})`);
      if (!resimli.has(g.sozcuk)) ihlal(g.id, `"${g.sozcuk}" resimli sözcük listesinde yok`);
      const giris = girisNoktasi(g.sozcuk);
      if (!giris) ihlal(g.id, 'sözcükte harf yok');
      else if (giris.bicim !== 'kucuk' || giris.grup !== d.grup)
        ihlal(
          g.id,
          `"${g.sozcuk}" ${giris.grup}. grupta okunabilir; ${d.grup}. grup görseli olamaz (öğretilmemiş harf, K-OY-02)`,
        );
      const svg = dosyalar.get(g.dosya);
      if (svg === undefined) ihlal(g.id, `dosya yok: ${g.dosya}`);
      else {
        const bayt = new TextEncoder().encode(svg).length;
        if (bayt !== g.bayt) ihlal(g.id, `dizindeki bayt ${g.bayt} ≠ dosya ${bayt}`);
        sonuc.push(...svgDenetle(g.id, svg, renkler));
      }
    }
    for (const s of resimli) if (!gorselli.has(s)) ihlal(`grup-${d.grup}`, `resimli "${s}" sözcüğünün görseli yok`);
    for (const r of d.resimsiz)
      if (resimli.has(r.sozcuk)) ihlal(`grup-${d.grup}`, `"${r.sozcuk}" hem resimli hem resimsiz`);
  }
  const dizinde = new Set(dizinler.flatMap((d) => d.gorseller.map((g) => g.dosya)));
  for (const yol of dosyalar.keys()) if (!dizinde.has(yol)) ihlal(yol, 'dizinde olmayan görsel dosyası');
  return sonuc;
}

/** Öğretmen teyidi bekleyen görsel kimlikleri (yayın kapısı). */
export function gorselTeyitBekleyenler(dizinler: readonly TurGorselDizini[]): string[] {
  return dizinler.flatMap((d) => d.gorseller.filter((g) => g.teyit.durum !== 'teyitli').map((g) => g.id));
}

/** İçerikteki `gorselId` bağları (D-15/D-25): görsel var ve aynı sözcüğün görseli. */
export function icerikGorselBaglariniDenetle(
  sozcukler: readonly { readonly id: string; readonly metin: string; readonly gorselId?: string }[],
  dizinler: readonly TurGorselDizini[],
): GorselIhlali[] {
  const gorseller = new Map(dizinler.flatMap((d) => d.gorseller.map((g) => [g.id, g] as const)));
  const sonuc: GorselIhlali[] = [];
  for (const s of sozcukler) {
    if (!s.gorselId) continue;
    const g = gorseller.get(s.gorselId);
    if (!g) sonuc.push({ kural: 'D-25', oge: s.id, mesaj: `görsel yok: ${s.gorselId}` });
    else if (g.sozcuk !== s.metin)
      sonuc.push({ kural: 'D-25', oge: s.id, mesaj: `${s.gorselId} "${g.sozcuk}" görseli, sözcük "${s.metin}"` });
  }
  return sonuc;
}
