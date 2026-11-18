/**
 * K-OY DOĞRULAYICISI — MEB TYMM 2026 Türkçe ilk okuma yazma kısıtlarının CI karşılığı (Okuma Yazma planı
 * Adım 62; `docs/mufredat-kisitlari-turkce.md` §5, D-01…D-24). SAF; zod içermez (girdi `src/content/schema/turIcerik.ts` ile
 * ayrıştırılmış dosyadır). `npm run validate` ders verisini bununla denetler; ihlal CI'ı kırmızı yapar.
 *
 * Kapsanan otomatik kurallar: D-01, D-02, D-03, D-04, D-05, D-06, D-07, D-08, D-09, D-10, D-11, D-12, D-13,
 * D-14, D-15, D-20, D-23, D-26 (cümle havuzu etiketleri, Adım 74), D-27 (okuma metinleri ve anlama soruları, Adım 80;
 * metin cümleleri cümle havuzuyla AYNI `cumleKurallariniDenetle` yolundan geçer). Kâğıt/yerleşim/ses dosyası kuralları (D-17, D-18, D-19, D-21, D-22, D-24) kendi
 * adımlarında; D-16 insan denetimidir.
 */
import {
  ALFABE,
  buyukMu,
  harfGrubu,
  harfMi,
  HARF_GRUPLARI,
  OGRETIM_SIRASI,
  PROGRAM_SURUMU,
  trBuyuk,
  trKucuk,
  UNLEM_GIRIS_HARFI,
  unluMu,
  yalnizUnsuzMu,
} from './alfabe';
import { hecele, heceTuru } from './heceleme';
import { TUR_TANI_ETIKETI_LISTESI } from './sablonlar/celdiriciler';
import { dekodlanabilirMi, girisNoktasi, harfSirasi, resmiKume } from './ogretilenKume';
import type { TurCumle, TurEtkinlik, TurHece, TurIcerikDosyasi, TurMetin, TurSozcuk } from '../../schema/turIcerik';

export type KuralKodu =
  | 'D-01' | 'D-02' | 'D-03' | 'D-04' | 'D-05' | 'D-06' | 'D-07' | 'D-08' | 'D-09' | 'D-10'
  | 'D-11' | 'D-12' | 'D-13' | 'D-14' | 'D-15' | 'D-20' | 'D-23' | 'D-26' | 'D-27'; // prettier-ignore

export interface Ihlal {
  readonly kural: KuralKodu;
  readonly oge: string;
  readonly mesaj: string;
}

export interface DogrulamaSonucu {
  readonly hatalar: Ihlal[];
  readonly uyarilar: Ihlal[];
}

export interface DogrulamaSecenekleri {
  /** Yayın kipi: öğretmen teyidi (D-14) eksikliği hata olur. Geliştirmede uyarı. */
  readonly yayin?: boolean;
}

/**
 * Ünlem sözcükleri (D-09; program örneği "Ah, elim acıdı!"). Ünlem cümlesi bunlardan biriyle başlar.
 * Liste insan onayına tabidir (öğretmen teyidi, Adım 66); genişletmek bu dosyada yapılır.
 */
export const UNLEM_SOZCUKLERI: ReadonlySet<string> = new Set(['ah', 'of', 'oh', 'ay', 'eyvah', 'aman', 'vay', 'hey']);

/** Karıştırılan çiftlerin tanı etiketleri (D-23; plan §1.3 Z22). Kaynak: çeldirici kataloğu (Adım 69). */
export const TUR_TANI_ETIKETLERI: ReadonlySet<string> = new Set(TUR_TANI_ETIKETI_LISTESI);

const ICERIK_NOKTALAMA = new Set(['.', ',', '?', '!', "'", ' ']);
const N_SIRASI = harfSirasi('n');

/** Sözcüğün yalnız harflerden (ve isteğe bağlı kesme + ek) oluştuğu varsayımıyla sözcüklere böler. */
function sozcukleri(metin: string): string[] {
  return metin
    .split(' ')
    .map((s) => s.replace(/[.,?!]+$/u, ''))
    .filter((s) => s.length > 0);
}

/** Bildirilen giriş harfi hesaplanandan önce olamaz (öğretilmemiş harf, D-02). */
function girisDenetle(id: string, metin: string, bildirilen: string, hatalar: Ihlal[]): void {
  const g = girisNoktasi(metin);
  if (!g) {
    hatalar.push({ kural: 'D-02', oge: id, mesaj: `"${metin}": harf yok.` });
    return;
  }
  if (harfSirasi(bildirilen) < harfSirasi(g.harf))
    hatalar.push({
      kural: 'D-02',
      oge: id,
      mesaj: `"${metin}" "${g.bicim === 'buyuk' ? trBuyuk(g.harf) : g.harf}" harfi öğretilmeden kullanılıyor (girisHarfi '${bildirilen}', en erken '${g.harf}').`,
    });
}

/** Büyük harf yalnız cümle başında ve özel adlarda (D-10). */
function buyukHarfDenetle(
  id: string,
  metin: string,
  ozelAdlar: ReadonlySet<string>,
  cumle: boolean,
  hatalar: Ihlal[],
): void {
  sozcukleri(metin).forEach((s, i) => {
    const govde = s.split("'")[0];
    const harfler = [...govde];
    harfler.forEach((c, j) => {
      if (!buyukMu(c)) return;
      const izinli = j === 0 && ((cumle && i === 0) || ozelAdlar.has(govde));
      if (!izinli)
        hatalar.push({ kural: 'D-10', oge: id, mesaj: `"${s}": büyük harf yalnız cümle başında ve özel adda.` });
    });
  });
}

function karakterDenetle(id: string, metin: string, hatalar: Ihlal[]): void {
  for (const c of metin) {
    if (harfMi(c) || ICERIK_NOKTALAMA.has(c)) continue;
    if (c === '-') hatalar.push({ kural: 'D-09', oge: id, mesaj: `"${metin}": kısa çizgi içerikte kullanılmaz.` });
    else
      hatalar.push({
        kural: 'D-07',
        oge: id,
        mesaj: `"${metin}": izin verilmeyen işaret "${c}" (görsel jetonu / rebus ya da tanımsız işaret).`,
      });
  }
}

/** Cümle kurallarının baktığı alanlar: cümle havuzu öğesi ve metin cümlesi/sorusu aynı biçime çevrilir (Adım 80). */
type CumleBicimi = Pick<TurCumle, 'id' | 'metin' | 'girisHarfi'> & Partial<Pick<TurCumle, 'ozelAdlar' | 'siraliSozcukler'>>;

/** Noktalama izin tablosu (D-09; K-OY-12, K-OY-13). */
function noktalamaDenetle(c: CumleBicimi, grup: number, hatalar: Ihlal[]): void {
  const h = (mesaj: string) => hatalar.push({ kural: 'D-09', oge: c.id, mesaj: `"${c.metin}": ${mesaj}` });
  const son = c.metin.at(-1) ?? '';
  if (!['.', '?', '!'].includes(son)) h('cümle nokta, soru veya ünlem işaretiyle biter.');
  const bitisler = [...c.metin].filter((x) => ['.', '?', '!'].includes(x)).length;
  if (bitisler !== 1) h('cümlede tek bitiş işareti olur.');
  if (son === '?' && grup < 2) h('soru işareti 2. harf grubundan itibaren.');
  const ilk = trKucuk(sozcukleri(c.metin)[0] ?? '');
  const unlemli = son === '!';
  if (unlemli) {
    if (grup < 5) h('ünlem işareti son harf grubunda (5. grup) gösterilir.');
    if (!UNLEM_SOZCUKLERI.has(ilk)) h('ünlem cümlesi bir ünlem sözcüğüyle başlar ("Ah, elim acıdı!" kullanımı).');
  }
  const virguller = [...c.metin].filter((x) => x === ',').length;
  if (virguller > 0) {
    const unlemVirgulu =
      unlemli && UNLEM_SOZCUKLERI.has(ilk) && c.metin.indexOf(',') === (sozcukleri(c.metin)[0] ?? '').length;
    if (!c.siraliSozcukler && !(unlemVirgulu && virguller === 1))
      h('virgül yalnız sıralı sözcükleri ayırır (siraliSozcukler) ya da ünlem sözcüğünden sonra.');
  }
  const ozel = new Set(c.ozelAdlar ?? []);
  for (const s of sozcukleri(c.metin))
    if (s.includes("'") && !ozel.has(s.split("'")[0])) h(`kesme işareti yalnız özel ad + ek ("${s}").`);
}

/**
 * Bir cümlenin biçim kuralları: karakterler (D-07, D-09), giriş harfi (D-02), 2. gruptan itibaren (D-08), büyük harf
 * (D-10) ve noktalama (D-09). Cümle havuzu da metin cümleleri/soruları da BURADAN geçer (kural kopyası yok, Adım 80).
 */
function cumleKurallariniDenetle(c: CumleBicimi, hatalar: Ihlal[]): void {
  karakterDenetle(c.id, c.metin, hatalar);
  girisDenetle(c.id, c.metin, c.girisHarfi, hatalar);
  const grup = Math.max(harfGrubu(c.girisHarfi), girisNoktasi(c.metin)?.grup ?? 1);
  if (harfGrubu(c.girisHarfi) < 2)
    hatalar.push({ kural: 'D-08', oge: c.id, mesaj: 'cümle ve metin 2. harf grubundan itibaren.' });
  buyukHarfDenetle(c.id, c.metin, new Set(c.ozelAdlar ?? []), true, hatalar);
  noktalamaDenetle(c, grup, hatalar);
}

const TUR_NOKTALAMA = { '.': 'bildirme', '?': 'soru', '!': 'unlem' } as const;

/**
 * Cümle havuzu etiketleri (D-26, Adım 74): `grup`, `harfler`, `tur`, `noktalama` hesaplananla aynı; 2–5 sözcük; giriş
 * harfi cümlenin hesaplanan giriş noktasıdır (ünlem cümlesinde en erken 5. grup); özel adlar cümlede geçer.
 */
function cumleEtiketleriniDenetle(c: TurCumle, hatalar: Ihlal[]): void {
  const h = (mesaj: string) => hatalar.push({ kural: 'D-26', oge: c.id, mesaj: `"${c.metin}": ${mesaj}` });
  const g = girisNoktasi(c.metin);
  if (!g) return;
  const son = c.metin.at(-1) ?? '';
  const beklenenGiris = son === '!' && g.grup < 5 ? UNLEM_GIRIS_HARFI : g.harf;
  if (c.girisHarfi !== beklenenGiris) h(`girisHarfi '${c.girisHarfi}', hesaplanan '${beklenenGiris}'.`);
  if (c.grup !== harfGrubu(c.girisHarfi)) h(`grup ${c.grup}, giriş harfinin grubu ${harfGrubu(c.girisHarfi)}.`);
  const harfler = OGRETIM_SIRASI.filter((x) => trKucuk(c.metin).includes(x)).join('');
  if (c.harfler !== harfler) h(`harfler "${c.harfler}", hesaplanan "${harfler}".`);
  if (c.noktalama !== son) h(`noktalama "${c.noktalama}", bitiş işareti "${son}".`);
  if (c.tur !== TUR_NOKTALAMA[son as keyof typeof TUR_NOKTALAMA]) h(`tür "${c.tur}" bitiş işaretiyle uyuşmuyor.`);
  const n = sozcukleri(c.metin).length;
  if (n < 2 || n > 5) h(`${n} sözcük; havuz cümlesi 2–5 sözcük.`);
  const govdeler = new Set(sozcukleri(c.metin).map((x) => x.split("'")[0]));
  for (const o of c.ozelAdlar) if (!govdeler.has(o)) h(`özel ad "${o}" cümlede yok.`);
}

/** Cümlenin sözcük gövdeleri (kesmeden önce), büyük/küçük harfi korunarak. */
function govdeSozcukleri(metin: string): string[] {
  return sozcukleri(metin).map((x) => x.split("'")[0]);
}

/**
 * Okuma metinleri ve anlama soruları (D-27, Adım 80; K-OY-02, 08–12, 14): cümleler cümle havuzuyla aynı kurallardan
 * geçer; etiketler hesaplananla aynı; her soru yazılı bir soru cümlesidir ve cevabı söylemez; cevap belirtilen
 * cümlede geçer; sözcük cevabında yanlış seçenekler öğretilmiş harflerden, metinde geçmeyen ve cevapla aynı biçimde
 * (büyük/küçük) olur. Görsel cevabın görsele bağı `gorselDenetimi.ts`'tedir (D-25).
 */
function metinleriDenetle(metinler: readonly TurMetin[], kimlikler: Set<string>, yayin: boolean, s: DogrulamaSonucu): void {
  let teyitsiz = 0;
  for (const m of metinler) {
    const h = (mesaj: string) => s.hatalar.push({ kural: 'D-27', oge: m.id, mesaj });
    const n = m.cumleler.length;
    m.cumleler.forEach((metin, i) => {
      const id = `${m.id}.c${i + 1}`;
      cumleKurallariniDenetle({ id, metin, girisHarfi: m.girisHarfi, ozelAdlar: m.ozelAdlar }, s.hatalar);
      const say = sozcukleri(metin).length;
      if (say < 2 || say > 5) h(`"${metin}": ${say} sözcük; metin cümlesi 2–5 sözcük.`);
    });
    // Giriş harfi: bütün cümlelerin, soruların ve yanlış seçeneklerin (kartlarda görünür) giriş noktalarının en geçidir
    // (ünlem cümlesinde en erken `p`).
    let giris = 0;
    for (const metin of [...m.cumleler, ...m.sorular.flatMap((q) => [q.soru, ...q.celdiriciler])]) {
      const g = girisNoktasi(metin);
      if (!g) continue;
      const unlem = metin.at(-1) === '!' && g.grup < 5;
      giris = Math.max(giris, harfSirasi(unlem ? UNLEM_GIRIS_HARFI : g.harf));
    }
    const beklenenGiris = OGRETIM_SIRASI[giris];
    if (m.girisHarfi !== beklenenGiris) h(`girisHarfi '${m.girisHarfi}', hesaplanan '${beklenenGiris}'.`);
    if (m.grup !== harfGrubu(m.girisHarfi)) h(`grup ${m.grup}, giriş harfinin grubu ${harfGrubu(m.girisHarfi)}.`);
    const tum = trKucuk(m.cumleler.join(' '));
    const harfler = OGRETIM_SIRASI.filter((x) => tum.includes(x)).join('');
    if (m.harfler !== harfler) h(`harfler "${m.harfler}", hesaplanan "${harfler}".`);
    const govdeler = new Set(m.cumleler.flatMap(govdeSozcukleri));
    for (const o of m.ozelAdlar) if (!govdeler.has(o)) h(`özel ad "${o}" metinde yok.`);
    if (m.teyit !== 'tamam') teyitsiz++;

    const kume = resmiKume(m.girisHarfi);
    const metinSozcukleri = new Set(m.cumleler.flatMap((c) => sozcukleri(trKucuk(c)).map((x) => x.split("'")[0])));
    for (const q of m.sorular) {
      const hq = (mesaj: string) => s.hatalar.push({ kural: 'D-27', oge: q.id, mesaj: `"${q.soru}": ${mesaj}` });
      if (kimlikler.has(q.id)) hq('kimlik tekil değil.');
      kimlikler.add(q.id);
      if (!q.soru.endsWith('?')) hq('soru cümlesi soru işaretiyle biter.');
      cumleKurallariniDenetle({ id: q.id, metin: q.soru, girisHarfi: m.girisHarfi, ozelAdlar: m.ozelAdlar }, s.hatalar);
      if (q.cumleNo > n) {
        hq(`cumleNo ${q.cumleNo}, metinde ${n} cümle var.`);
        continue;
      }
      const hedefCumle = m.cumleler[q.cumleNo - 1];
      const soruSozcukleri = new Set(sozcukleri(trKucuk(q.soru)));
      if (q.cevapTuru === 'sozcuk') {
        if (!govdeSozcukleri(hedefCumle).includes(q.cevap)) hq(`cevap "${q.cevap}" ${q.cumleNo}. cümlede yok.`);
        if (soruSozcukleri.has(trKucuk(q.cevap))) hq(`soru cevabı söylüyor ("${q.cevap}").`);
        if (q.celdiriciler.length < 3) hq('en az 3 yanlış seçenek gerekir.');
        const gorulen = new Set<string>();
        for (const c of q.celdiriciler) {
          if (!dekodlanabilirMi(c, kume)) hq(`yanlış seçenek "${c}" öğretilmemiş harf içeriyor (D-23).`);
          if (metinSozcukleri.has(trKucuk(c)) || soruSozcukleri.has(trKucuk(c))) hq(`yanlış seçenek "${c}" metinde geçiyor.`);
          if (trKucuk(c) === trKucuk(q.cevap)) hq(`yanlış seçenek cevapla aynı ("${c}").`);
          if (buyukMu(c[0]) !== buyukMu(q.cevap[0])) hq(`yanlış seçenek "${c}" cevapla aynı büyük/küçük biçimde değil.`);
          if (/[ .,?!']/.test(c)) hq(`yanlış seçenek "${c}" tek sözcük olmalı.`);
          if (gorulen.has(c)) hq(`yanlış seçenek "${c}" iki kez.`);
          gorulen.add(c);
        }
      } else if (q.celdiriciler.length > 0) hq('görsel cevapta yazılı yanlış seçenek olmaz (seçenekler görsellerden gelir).');
    }
  }
  if (teyitsiz > 0) {
    const ihlal: Ihlal = {
      kural: 'D-14',
      oge: 'metinler',
      mesaj: `${teyitsiz} metinde öğretmen teyidi yok (cümle havuzundaki istisna; yayından önce iki öğretmen teyidi zorunlu).`,
    };
    (yayin ? s.hatalar : s.uyarilar).push(ihlal);
  }
}

function heceleriDenetle(
  heceler: readonly TurHece[],
  sozcukler: ReadonlyMap<string, TurSozcuk>,
  s: DogrulamaSonucu,
): void {
  const harfBasina = new Map<string, TurHece[]>();
  for (const h of heceler) {
    if (h.metin !== trKucuk(h.metin))
      s.hatalar.push({ kural: 'D-04', oge: h.id, mesaj: `"${h.metin}": hecede büyük harf yok.` });
    girisDenetle(h.id, h.metin, h.girisHarfi, s.hatalar);
    if (harfSirasi(h.girisHarfi) < N_SIRASI)
      s.hatalar.push({ kural: 'D-03', oge: h.id, mesaj: `"${h.metin}": hece öğretimi "n"den sonra başlar.` });
    let hece: string[];
    try {
      hece = hecele(h.metin);
    } catch {
      hece = [];
    }
    if (hece.length !== 1) s.hatalar.push({ kural: 'D-04', oge: h.id, mesaj: `"${h.metin}": tek hece değil.` });
    for (const sid of h.sozcukler) {
      const sz = sozcukler.get(sid);
      if (!sz) s.hatalar.push({ kural: 'D-05', oge: h.id, mesaj: `bağlı sözcük yok: ${sid}.` });
      else if (!hecele(trKucuk(sz.metin)).includes(h.metin))
        s.hatalar.push({ kural: 'D-05', oge: h.id, mesaj: `"${h.metin}" "${sz.metin}" sözcüğünün hecesi değil.` });
    }
    const l = harfBasina.get(h.girisHarfi) ?? [];
    l.push(h);
    harfBasina.set(h.girisHarfi, l);
  }
  for (const [harf, liste] of harfBasina) {
    // Yeni harfte önce kapalı, sonra açık hece; ardından üç ve dört harfli heceler (D-03, K-OY-04).
    let kapaliGoruldu = false;
    let acikGoruldu = false;
    for (const h of liste) {
      const t = heceTuru(h.metin);
      if (t === 'kapali') kapaliGoruldu = true;
      else if (t === 'acik') {
        if (!kapaliGoruldu && [...h.metin].length === 2)
          s.hatalar.push({ kural: 'D-03', oge: h.id, mesaj: `"${harf}" için açık hece kapalı heceden önce.` });
        acikGoruldu = true;
      } else if (!kapaliGoruldu || !acikGoruldu)
        s.hatalar.push({
          kural: 'D-03',
          oge: h.id,
          mesaj: `"${h.metin}": üç/dört harfli hece kapalı ve açık heceden sonra gelir.`,
        });
    }
    const anlamsiz = liste.filter((h) => !h.anlamli).length;
    if (anlamsiz / liste.length > 0.3)
      s.uyarilar.push({
        kural: 'D-05',
        oge: `harf:${harf}`,
        mesaj: `anlamsız hece oranı %${Math.round((100 * anlamsiz) / liste.length)} > %30 (hızla sözcüğe ulaşılmalı).`,
      });
  }
}

function etkinligiDenetle(e: TurEtkinlik, gorselSozcukleri: ReadonlyMap<string, TurSozcuk>, s: DogrulamaSonucu): void {
  const kume = resmiKume(e.girisHarfi);
  if (e.dogru >= e.secenekler.length)
    s.hatalar.push({ kural: 'D-23', oge: e.id, mesaj: `doğru seçenek indeksi ${e.dogru} seçenek sayısı dışında.` });
  if (e.uyaran.metin) {
    girisDenetle(e.id, e.uyaran.metin, e.girisHarfi, s.hatalar);
    karakterDenetle(e.id, e.uyaran.metin, s.hatalar);
  }
  for (const [i, sec] of e.secenekler.entries()) {
    // Harf ve hece kartı cevaptan önce sessiz (D-11): ünsüz tek başına seslendirilmez, cevap ele verilmez.
    if ((sec.tur === 'harf' || sec.tur === 'hece') && sec.sesli)
      s.hatalar.push({ kural: 'D-11', oge: e.id, mesaj: `seçenek ${i + 1} (${sec.tur}) cevaptan önce sessiz olmalı.` });
    if (sec.metin && !dekodlanabilirMi(sec.metin, kume))
      s.hatalar.push({ kural: 'D-23', oge: e.id, mesaj: `seçenek "${sec.metin}" öğretilmemiş harf içeriyor.` });
    if (sec.diagnosticTag && !TUR_TANI_ETIKETLERI.has(sec.diagnosticTag))
      s.hatalar.push({ kural: 'D-23', oge: e.id, mesaj: `bilinmeyen tanı etiketi ${sec.diagnosticTag}.` });
    if (sec.tur === 'gorsel') {
      const sz = sec.gorselId ? gorselSozcukleri.get(sec.gorselId) : undefined;
      if (!sz) s.hatalar.push({ kural: 'D-15', oge: e.id, mesaj: `seçenek ${i + 1}: görsel bir sözcüğe bağlı değil.` });
      else if (!dekodlanabilirMi(sz.metin, kume))
        s.hatalar.push({
          kural: 'D-15',
          oge: e.id,
          mesaj: `seçenek görseli "${sz.metin}" öğretilmemiş harfli bir sözcüğün görseli.`,
        });
    }
  }
  if ((e.sablon === 'T-01' || e.sablon === 'T-08') && e.secenekler.some((x) => x.tur !== 'gorsel'))
    s.hatalar.push({ kural: 'D-15', oge: e.id, mesaj: `${e.sablon} seçenekleri görselli sözcüklerdir.` });
  // Okuma hedefli soruda yönerge hedefi söylemez (D-12): ses okumayı dinlemeye çevirir.
  if (e.uyaran.tur === 'yazi' && e.uyaran.metin) {
    const yonerge = new Set(sozcukleri(trKucuk(e.yonerge.metin)));
    for (const w of sozcukleri(trKucuk(e.uyaran.metin)))
      if (yonerge.has(w))
        s.hatalar.push({ kural: 'D-12', oge: e.id, mesaj: `okuma sorusunda yönerge hedef sözcüğü söylüyor ("${w}").` });
  }
  if (yalnizUnsuzMu(e.yonerge.metin))
    s.hatalar.push({ kural: 'D-11', oge: e.id, mesaj: `yönerge klibi tek başına ünsüz ("${e.yonerge.metin}").` });
}

/** D-06: renk/parça rengi veren alan (ham veride, şemadan önce). */
export function renkAlaniBul(ham: unknown, yol = ''): string[] {
  if (Array.isArray(ham)) return ham.flatMap((v, i) => renkAlaniBul(v, `${yol}[${i}]`));
  if (ham && typeof ham === 'object')
    return Object.entries(ham).flatMap(([k, v]) => [
      ...(/ren[kg]|colou?r/i.test(k) ? [`${yol}.${k}`] : []),
      ...renkAlaniBul(v, `${yol}.${k}`),
    ]);
  return [];
}

/** D-01: harf envanteri ve gruplar program Şekil 1 ile aynı. */
export function harfEnvanteriniDenetle(): Ihlal[] {
  const h: Ihlal[] = [];
  const beklenen = 'a n e t i l|o k u r ı m|ü s ö y d z|ç b g c ş|p h v ğ f j';
  const gercek = HARF_GRUPLARI.map((g) => g.join(' ')).join('|');
  if (gercek !== beklenen)
    h.push({ kural: 'D-01', oge: 'HARF_GRUPLARI', mesaj: `beklenen ${beklenen}, bulunan ${gercek}` });
  if (new Set(OGRETIM_SIRASI).size !== 29 || ALFABE.length !== 29 || !ALFABE.every((a) => OGRETIM_SIRASI.includes(a)))
    h.push({ kural: 'D-01', oge: 'ALFABE', mesaj: '29 harf, her biri bir kez öğretilir.' });
  return h;
}

/** D-13: Türkçe kodda süre ölçen skor / okuma hızı yok (zamanlayıcı yalnız animasyon için). */
export function turKodunuTara(dosyalar: readonly { readonly yol: string; readonly icerik: string }[]): Ihlal[] {
  const desen = /\b(Date\.now|performance\.now)\s*\(|okumaHiz|dakikadaSozcuk|sureOlc/;
  // Bu dosya kuralın kendi desenini içerir; taranmaz.
  return dosyalar.flatMap((d) =>
    d.icerik
      .split('\n')
      .flatMap((satir, i) =>
        desen.test(satir) && !d.yol.endsWith('dogrulayici.ts')
          ? [{ kural: 'D-13' as const, oge: `${d.yol}:${i + 1}`, mesaj: 'süre/okuma hızı ölçümü yok (K-OY-15).' }]
          : [],
      ),
  );
}

export function turIceriginiDogrula(d: TurIcerikDosyasi, secenekler: DogrulamaSecenekleri = {}): DogrulamaSonucu {
  const s: DogrulamaSonucu = { hatalar: [], uyarilar: [] };
  if (d.programSurumu !== PROGRAM_SURUMU)
    s.hatalar.push({ kural: 'D-20', oge: 'dosya', mesaj: `programSurumu ${d.programSurumu} ≠ ${PROGRAM_SURUMU}.` });
  s.hatalar.push(...harfEnvanteriniDenetle());

  // Şemadan geçmemiş (ham) dosya `metinler` taşımayabilir (varsayılan şemada []): eski testler ve araçlar için.
  const metinler = d.metinler ?? [];
  const kimlikler = new Set<string>();
  for (const o of [...d.harfler, ...d.heceler, ...d.sozcukler, ...d.cumleler, ...metinler, ...d.etkinlikler]) {
    if (kimlikler.has(o.id)) s.hatalar.push({ kural: 'D-20', oge: o.id, mesaj: 'kimlik tekil değil.' });
    kimlikler.add(o.id);
  }

  for (const h of d.harfler) {
    if (h.buyuk !== trBuyuk(h.kucuk))
      s.hatalar.push({ kural: 'D-01', oge: h.id, mesaj: `büyük biçim ${h.buyuk} ≠ ${trBuyuk(h.kucuk)} (tr-TR).` });
    if (harfGrubu(h.kucuk) !== h.grup || HARF_GRUPLARI[h.grup - 1][h.sira - 1] !== h.kucuk)
      s.hatalar.push({ kural: 'D-01', oge: h.id, mesaj: `"${h.kucuk}" grup/sıra Şekil 1 ile uyuşmuyor.` });
    if ((h.tur === 'unlu') !== unluMu(h.kucuk))
      s.hatalar.push({ kural: 'D-01', oge: h.id, mesaj: `"${h.kucuk}" ünlü/ünsüz türü yanlış.` });
    if (h.tur === 'unsuz' && h.klip)
      s.hatalar.push({ kural: 'D-11', oge: h.id, mesaj: `ünsüz "${h.kucuk}" tek başına seslendirilmez.` });
  }

  const sozcukMap = new Map(d.sozcukler.map((x) => [x.id, x]));
  const gorselSozcukleri = new Map(d.sozcukler.filter((x) => x.gorselId).map((x) => [x.gorselId!, x]));
  heceleriDenetle(d.heceler, sozcukMap, s);

  let teyitsiz = 0;
  for (const w of d.sozcukler) {
    karakterDenetle(w.id, w.metin, s.hatalar);
    if (/[ .,?!]/.test(w.metin))
      s.hatalar.push({ kural: 'D-07', oge: w.id, mesaj: `"${w.metin}": tek sözcük olmalı.` });
    girisDenetle(w.id, w.metin, w.girisHarfi, s.hatalar);
    buyukHarfDenetle(w.id, w.metin, new Set(w.ozelAd ? [w.metin] : []), false, s.hatalar);
    const teyit = new Set(w.anlamTeyidi?.ogretmen ?? []);
    if (teyit.size < 2) teyitsiz++;
  }
  if (teyitsiz > 0) {
    const ihlal: Ihlal = {
      kural: 'D-14',
      oge: 'sozcukler',
      mesaj: `${teyitsiz} sözcükte iki öğretmen anlam teyidi yok (yayından önce zorunlu).`,
    };
    (secenekler.yayin ? s.hatalar : s.uyarilar).push(ihlal);
  }

  for (const c of d.cumleler) cumleKurallariniDenetle(c, s.hatalar);

  let cumleTeyitsiz = 0;
  for (const c of d.cumleler) {
    if (c.grup === undefined && c.harfler === undefined && c.tur === undefined && c.noktalama === undefined) continue;
    cumleEtiketleriniDenetle(c, s.hatalar);
    if (c.teyit !== 'tamam') cumleTeyitsiz++;
  }
  if (cumleTeyitsiz > 0) {
    const ihlal: Ihlal = {
      kural: 'D-14',
      oge: 'cumleler',
      mesaj: `${cumleTeyitsiz} cümlede öğretmen teyidi yok (KG-155; yayından önce iki öğretmen teyidi zorunlu).`,
    };
    (secenekler.yayin ? s.hatalar : s.uyarilar).push(ihlal);
  }

  metinleriDenetle(metinler, kimlikler, secenekler.yayin === true, s);

  for (const e of d.etkinlikler) etkinligiDenetle(e, gorselSozcukleri, s);

  // D-11: hiçbir klip tek başına ünsüz değildir.
  const klipler = [
    ...d.harfler.flatMap((x) => (x.klip ? [[x.id, x.klip] as const] : [])),
    ...d.heceler.flatMap((x) => (x.klip ? [[x.id, x.klip] as const] : [])),
    ...d.sozcukler.flatMap((x) => (x.klip ? [[x.id, x.klip] as const] : [])),
    ...d.cumleler.flatMap((x) => (x.klip ? [[x.id, x.klip] as const] : [])),
    ...metinler.flatMap((x) => (x.klip ? [[x.id, x.klip] as const] : [])),
  ];
  for (const [id, k] of klipler)
    if (yalnizUnsuzMu(k.metin))
      s.hatalar.push({ kural: 'D-11', oge: id, mesaj: `klip "${k.metin}" tek başına ünsüz seslendiriyor.` });

  return s;
}
