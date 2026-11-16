/**
 * Dosya adı büyük/küçük harf çakışması denetimi.
 *
 * Neden: macOS/Windows dosya sistemi harfe duyarsızdır, Linux CI'ınki duyarlı. `TurEkrani.tsx` ile
 * `turEkrani.ts` Linux'ta iki ayrı dosyadır; macOS'ta `tsc` TS1149 ile kırılır ve CI bunu fark etmez.
 *
 * Kural (iki ayrı çakışma türü, yollar `/` ile ayrılmış, depo köküne göreli):
 *  1. "yol": herhangi bir yol bileşeni (klasör ya da dosya adı), AYNI üst yol altında yalnız harf
 *     büyüklüğüyle ayrışan iki yazımda varsa. `src/UI/x.ts` + `src/ui/y.ts` (klasör) ve
 *     `a/Foo.png` + `a/foo.png` (tam yol) bu türdendir. `a/B.ts` + `b/B.ts` değildir: `a` ile `b`
 *     harf farkı değil, farklı addır.
 *  2. "modül": aynı klasörde, TypeScript'in uzantısız import ile çözdüğü modül dosyalarının
 *     (.ts .tsx .mts .cts .js .jsx .mjs .cjs) uzantısız gövdesi yalnız harf büyüklüğüyle
 *     ayrışıyorsa. `TurEkrani.tsx` + `turEkrani.ts` çakışır (import './turEkrani' hangisini
 *     çözer?). Gövdesi birebir aynı olanlar (`a.ts` + `a.tsx`) harf sorunu değildir, sayılmaz.
 *
 * Harf indirgemesi bilerek düz `toLowerCase()`: yerelden bağımsızdır (dil etiketi verilmez) ve
 * ECMAScript'in sabit Unicode eşlemesini kullanır; `toLocaleLowerCase('tr')` I'yı ı yapıp
 * `I`/`i` çiftini kaçırırdı. `toLocaleLowerCase('en-US')` de aynı sonucu verir; düz
 * `toLowerCase()` ek bir yerel bağımlılığı hiç taşımadığı için seçildi. Dosya sistemleri de büyük/küçük eşlemesini Türkçe kurala göre yapmaz.
 */
export interface HarfCakismasi {
  readonly tur: 'yol' | 'modul';
  /** Çakışan yollar (ya da klasör öneklerinin farklı yazımları), sıralı. */
  readonly yollar: readonly string[];
}

const MODUL_UZANTISI = /\.(?:d\.)?(?:[cm]?[tj]s|[tj]sx)$/;

export function harfCakismalari(yollar: readonly string[]): HarfCakismasi[] {
  const sonuc: HarfCakismasi[] = [];

  // 1. Yol bileşenleri: anahtar = küçültülmüş önek, değer = görülen gerçek önekler.
  const onekler = new Map<string, Set<string>>();
  for (const yol of yollar) {
    const parcalar = yol.split('/');
    for (let i = 1; i <= parcalar.length; i++) {
      const onek = parcalar.slice(0, i).join('/');
      const anahtar = onek.toLowerCase();
      const kume = onekler.get(anahtar) ?? new Set<string>();
      kume.add(onek);
      onekler.set(anahtar, kume);
    }
  }
  // Yalnız en kısa çakışan öneki bildir: altındaki tüm yollar zaten onun sonucudur.
  const bildirilen: string[] = [];
  for (const [anahtar, kume] of [...onekler].sort((a, b) => a[0].length - b[0].length)) {
    if (kume.size < 2) continue;
    if (bildirilen.some((k) => anahtar.startsWith(`${k}/`))) continue;
    bildirilen.push(anahtar);
    sonuc.push({ tur: 'yol', yollar: [...kume].sort() });
  }

  // 2. Modül gövdeleri: aynı (küçültülmüş) klasör + küçültülmüş gövde, birden çok gerçek gövde yazımı.
  const govdeler = new Map<string, Set<string>>();
  const govdeYollari = new Map<string, Set<string>>();
  for (const yol of yollar) {
    if (!MODUL_UZANTISI.test(yol)) continue;
    const govde = yol.replace(MODUL_UZANTISI, '');
    const anahtar = govde.toLowerCase();
    const yazimlar = govdeler.get(anahtar) ?? new Set<string>();
    yazimlar.add(govde);
    govdeler.set(anahtar, yazimlar);
    const liste = govdeYollari.get(anahtar) ?? new Set<string>();
    liste.add(yol);
    govdeYollari.set(anahtar, liste);
  }
  for (const [anahtar, yazimlar] of govdeler) {
    if (yazimlar.size < 2) continue;
    // Klasör düzeyinde zaten "yol" olarak bildirilmişse tekrar etme.
    if (bildirilen.some((k) => anahtar.startsWith(`${k}/`) || anahtar === k)) continue;
    const grup = [...govdeYollari.get(anahtar)!].sort();
    // Hepsi aynı tam yolun harf varyantıysa (a/Is.ts, a/is.ts) "yol" olarak zaten bildirildi.
    if (new Set(grup.map((y) => y.toLowerCase())).size === 1) continue;
    sonuc.push({ tur: 'modul', yollar: grup });
  }
  return sonuc;
}

export function cakismaOzeti(c: readonly HarfCakismasi[]): string {
  return c.map((x) => `[${x.tur}] ${x.yollar.join('  <->  ')}`).join('\n');
}
