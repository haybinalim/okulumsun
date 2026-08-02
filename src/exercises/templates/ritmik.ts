/**
 * M-RITMIK — RİTMİK SAYMA ve ARTAN/AZALAN SAYI ÖRÜNTÜSÜ.
 *
 * ── HANGİ KAZANIMI NASIL KARŞILIYOR ──────────────────────────────────────────
 *  MAT.1.1.5  "100'e kadar ileriye ve 20'den geriye doğru ritmik sayabilme"
 *      Çocuk bir sayı dizisinin eksik terimini bulur. Diziyi ÜRETMEK için
 *      ritmik sayma zincirini kullanmak zorundadır; ezberden söylemek yetmez,
 *      çünkü boşluk dizinin ortasında da olabilir (o zaman zinciri iki yönden
 *      kontrol etmek gerekir).
 *  MAT.1.1.6  "Artan veya azalan sayı ve şekil örüntülerini çözümleyebilme"
 *      Programın uygulama notu açıkça diyor: "Örüntüde verilmeyen terimi bulma
 *      da kapsamdadır" (SAYFA 23). Bu şablon tam olarak odur; sabit adımlı
 *      (artış ya da azalış, ASLA ikisi bir arada değil) bir sayı örüntüsünde
 *      verilmeyen terim(ler)i buldurur.
 *
 *  NOT — beceri düğümü seçimi: `karsilananSkillIds` YALNIZCA 7 ritmik düğümü
 *  içerir. `mat.oruntu.artan-sayi` / `mat.oruntu.azalan-sayi` düğümleri beceri
 *  grafiğinde M-ORUNTU-SAYI şablonuna bağlı; onları buradan sahiplenmek,
 *  planlayıcının o düğümleri "kapsandı" sayıp asıl örüntü şablonunu (şekil
 *  örüntüleri dâhil) hiç açmamasına yol açardı. Kazanım kodu düzeyinde
 *  MAT.1.1.6'yı bildiriyoruz (madde gerçekten o kazanıma hizmet ediyor), beceri
 *  düğümü düzeyinde sahiplenmiyoruz.
 *
 * ── ÖLÇÜLEN MİKRO DÜĞÜMLER (src/content/skills.json) ─────────────────────────
 *  mat.ritmik.ileri-birer-20 · ileri-birer-100 · ileri-onar-100 ·
 *  ileri-beser-100 · ileri-ikiser-20 · geri-birer-20 · geri-ikiser-20
 *  Hangi düğümün yoklandığı ÜRETİLEN SAYILARDAN türetilir (`ritmikSkillIdleri`),
 *  elle bildirilmez: 14,15,16 dizisi "birer-100" düğümünü yoklamış sayılmaz.
 *
 * ── MÜFREDAT SINIRI (docs/mufredat-kisitlari.md §2, SAYFA 23) ────────────────
 *  Geçerli (yön, adım, sınır) üçlüleri TEK TEK sayılmıştır:
 *      ileri 1  → ≤100      ileri 2 → ≤20   (100'e kadar İKİŞER YOK)
 *      ileri 5  → ≤100      geri 1  → 20'den
 *      ileri 10 → ≤100      geri 2  → 20'den (geriye BEŞER/ONAR YOK)
 *  Üçer, dörder vb. kapsam dışı.
 *
 *  Bu dosya sınırı ÜÇ KATMANDA kapatır:
 *   1. TİP: `bicim` parametresinin tipi `RitmikSaymaBicimi` (types.ts). Birleşim
 *      `{yon:'geri'; adim:1|2}` ve `{yon:'ileri'; adim:2; ustSinir:20}` dallarını
 *      ayrı ayrı tanımladığı için `{yon:'geri', adim:10}` YAZILAMAZ — derlenmez.
 *   2. VERİ: kendi üçlümüzü kurmuyoruz; `RITMIK_SAYMA_BICIMLERI` sabitinden
 *      seçiyoruz. Liste tam ve tek kaynak.
 *   3. ÇALIŞMA ANI: `ritmikPlaniDogrula` her üretimde çağrılır ve `ritmikSaymaGecerliMi`
 *      ile üretilen SAYILARI denetler; ihlalde FIRLATIR. Sessizce müfredat dışı
 *      soru ekrana gelmez.
 *
 *  Ayrıca MAT.1.1.6'nın iki ek sınırı kodda sabittir:
 *   · Örüntü EN FAZLA ALTINCI ADIMA kadar sürdürülür → `EN_COK_TERIM = 6`.
 *   · Varsayılan biçim "ilk üç adım verilir, dördüncü istenir" → zorluk 1'de
 *     tam olarak bu üretilir (4 terim, son terim eksik).
 *
 * ── EKSİK TERİM NEREDE DURABİLİR (kritik tasarım kararı) ─────────────────────
 *  Eksik sayı dizinin BAŞINDA olamaz. Sebep pedagojik, keyfî değil: örüntüyü
 *  çözümlemek için ardışık ögeler arasındaki İLİŞKİYİ görmek gerekir
 *  (MAT.1.1.6 süreç bileşeni b). Boşluk baştaysa çocuğun elinde ilişkiyi
 *  çıkaracak kaynak yoktur; soru "kural bul" sorusu olmaktan çıkıp "aklından
 *  bir sayı tut" sorusuna döner ve cevabı tek başına belirlenemez hâle gelir
 *  (5, □, 15, 20 dizisinde boşluk 10'dur; □, 10, 15, 20 dizisinde boşluk 5'tir
 *  ama bunu ancak dizinin devamına bakan çocuk bilir — baştaki boşlukta ise
 *  hiçbir şey yoktur).
 *
 *  KURAL: 0 ve 1 numaralı indeksler HER ZAMAN görünür; boşluklar `[2 .. n-1]`
 *  aralığından seçilir. Bu tek kural üç şeyi birden garanti eder:
 *    (a) boşluk asla başta değildir,
 *    (b) en az iki ARDIŞIK görünür sayı vardır (adım oradan okunur),
 *    (c) ilk boşluğun bir önceki terimi her zaman görünürdür — çeldirici
 *        bağlamı (`ISLEM_YONU`) için gereken "önceki terim" hep mevcuttur.
 *
 * ── ETKİLEŞİM ────────────────────────────────────────────────────────────────
 *  TAP_TO_PLACE: kart seç → boşluğa dokun. Sürükle-bırak yok (ürün kısıtı #5).
 *  Tek bir `kind` seçilmesinin sebebi: beceri grafiği 7 düğümü de tek şablon
 *  kimliğine ("M-RITMIK") bağlamış; `ExerciseGenerator.kind` tek değer taşır.
 *  1–3 boşluk desteklemek zorunlu olduğu için tek seçimli AUDIO_TO_IMAGE yetmez;
 *  yerleştirme primitifi hem 1 hem 3 boşluğu aynı sözleşmeyle taşır.
 *
 *  `gosterim` yalnızca SUNUM katmanıdır (sayı doğrusu / kart dizisi), etkileşimi
 *  değiştirmez.
 *
 * ── OKUMA YÜKÜ ───────────────────────────────────────────────────────────────
 *  readingLoad = 0. Talimat sestir; ekranda yalnız RAKAM vardır (rakam okuma
 *  yazma değildir). `prompt.metin` bilerek boş — `alistirmaIhlalleri` dolu
 *  bırakılırsa hata verir.
 */

import {
  RITMIK_SAYMA_BICIMLERI,
  alistirmaIhlalleri,
  makeItemId,
  ritmikSaymaGecerliMi,
  varsayilanIpuclari,
  type AssetSpec,
  type Difficulty,
  type Exercise,
  type ExerciseGenerator,
  type GeneratorParams,
  type KazanimKodu,
  type Option,
  type Prompt,
  type RitmikSaymaBicimi,
  type SkillId,
  type VisualSpec,
  type Yuva,
} from '../types';
import {
  sayisalCeldiricilerKesin,
  type HataEtiketi,
  type SayiAraligi,
  type SayisalCeldirici,
} from '../distractors';
import type { Rng } from '../rng';
import { sayNumber, type SpeakSource } from '../../audio/speech';
import type { SpeechKey } from '../../audio/audioManifest.generated';

// ---------------------------------------------------------------------- sabitler

/** Beceri grafiğindeki (`skills.json`) şablon kimliğiyle BİREBİR aynı olmalı. */
export const RITMIK_TEMPLATE_ID = 'M-RITMIK';

/**
 * Dizi uzunluğu sınırları.
 * Üst sınır MAT.1.1.6'nın uygulama notundan: "Bir örüntü EN FAZLA ALTINCI ADIMA
 * kadar sürdürülür (SAYFA 23)." Alt sınır programın varsayılan soru biçiminden:
 * "İLK ÜÇ ADIM verilir, öğrenciden DÖRDÜNCÜ adımı bulması istenir."
 */
const EN_AZ_TERIM = 4;
const EN_COK_TERIM = 6;

/**
 * İlk boşluğun durabileceği en küçük indeks.
 * 0 ve 1 her zaman görünür — gerekçe dosya başındaki "eksik terim nerede
 * durabilir" bölümünde.
 */
const EN_KUCUK_EKSIK_INDEKS = 2;

/** Şık (kart) sayısı tavanı — genel jeneratör kuralı #7. */
const EN_COK_KART = 4;

/** Ritmik saymada "20'ye kadar" eşiği; zorluk 1-2 bu bandın içinde kalır. */
const KUCUK_SAYI_TAVANI = 20;

// ------------------------------------------------------------------------ tipler

/** Sunum biçimi. Etkileşimi DEĞİL, yalnız sahnenin görünümünü belirler. */
export type Gosterim = 'sayiDogrusu' | 'kartDizisi';

/**
 * Boşlukların dizideki yerleşimi — zorluk kademesi budur.
 *
 *  'son'  : boşluk(lar) dizinin SONUNDA. "Sırada hangi sayı gelir?" Tek yönlü
 *           ilerleme yeter; programın varsayılan soru biçimi.
 *  'orta' : boşluk(lar) dizinin İÇİNDE (asla son terim değil). Çocuk hem önceki
 *           hem sonraki terime bakıp iki yönden doğrulamak zorunda.
 *  'karisik' : ikisi de olabilir; rastgele.
 *
 * ⚠ 'bas' KASITLI OLARAK YOK. Tip düzeyinde yazılamıyor olması, "baştaki boşluk"
 * hatasının bu dosyada bir daha asla üretilememesinin garantisidir.
 */
export type EksikKonum = 'orta' | 'son' | 'karisik';

export interface RitmikParams extends GeneratorParams {
  /**
   * Ritmik sayma biçimi (yön + adım + sınır TEK PARÇA).
   * Ayrı `yon` ve `adim` alanları olsaydı `{yon:'geri', adim:10}` yazılabilirdi;
   * bu birleşim tipi onu derleme zamanında imkânsız kılar.
   * Verilmezse zorluğa uygun bir biçim seçilir.
   */
  readonly bicim?: RitmikSaymaBicimi;
  /**
   * Dizinin İLK terimi. Verilmezse müfredat sınırları ve zorluk içinde seçilir.
   * `son` bilerek PARAMETRE DEĞİL, türetilir (`plan.son`): hem `bas` hem `son`
   * hem `adim` dışarıdan alınsaydı üçü tutarsız olabilir ve adım sessizce
   * değişebilirdi.
   */
  readonly bas?: number;
  /** Dizideki terim sayısı (4-6). Sınır: MAT.1.1.6 "en fazla altıncı adım". */
  readonly terimSayisi?: number;
  /** Kaç terim gizlensin (1-3). */
  readonly eksikSayisi?: 1 | 2 | 3;
  /** Boşlukların yerleşimi; 'bas' yok. */
  readonly eksikKonum?: EksikKonum;
  /** Sunum biçimi. Geri saymada zorunlu olarak 'kartDizisi'ne düşer (aşağıda). */
  readonly gosterim?: Gosterim;
  /** Toplam kart sayısı (genel kural: optionCount) — 2, 3 veya 4. */
  readonly sikSayisi?: 2 | 3 | 4;
}

/**
 * Çözümlenmiş soru planı. Üretimden ÖNCE tamamlanır ve doğrulanır; böylece
 * müfredat denetimi tek bir yerde, sorunun tüm sayıları belliyken yapılır.
 */
export interface RitmikPlan {
  readonly bicim: RitmikSaymaBicimi;
  /** Dizinin ilk terimi. */
  readonly bas: number;
  /** Dizinin son terimi — TÜRETİLMİŞTİR (ileri: bas+(n-1)·adım, geri: bas-(n-1)·adım). */
  readonly son: number;
  /** Diziyi oluşturan tüm terimler, sunum sırasıyla. */
  readonly terimler: readonly number[];
  /** Gizlenen terimlerin indeksleri — hepsi ≥ 2, artan sırada. */
  readonly eksikIndeksler: readonly number[];
  readonly gosterim: Gosterim;
  /** Ekrandaki toplam kart sayısı (doğru + çeldirici). */
  readonly kartSayisi: number;
  /** Çeldiricilerin seçileceği KAPALI aralık (müfredat tavanına kelepçeli). */
  readonly celdiriciAraligi: SayiAraligi;
}

// -------------------------------------------------------------------- yardımcılar

function sinirla(deger: number, alt: number, ust: number): number {
  return deger < alt ? alt : deger > ust ? ust : deger;
}

/**
 * Biçimin sayısal tavanı. `ileri` dallarında `ustSinir`, `geri` dalında
 * `baslangic` — ikisi de "bu biçimde görülebilecek EN BÜYÜK sayı"dır.
 */
function bicimTavani(bicim: RitmikSaymaBicimi): number {
  return bicim.yon === 'ileri' ? bicim.ustSinir : bicim.baslangic;
}

/**
 * Sayının ses anahtarı. `sayNumber` üzerinden gidiyoruz ki ad alanı
 * ('sayi.N') tek yerde tanımlı kalsın; 0-100 dışına çıkarsa FIRLATIR
 * (manifestoda karşılığı yoktur, sessizce susan bir soru üretmeyiz).
 */
function sayiSesAnahtari(n: number): SpeechKey {
  if (!Number.isInteger(n) || n < 0 || n > 100) {
    throw new Error(`ritmik: ${n} için ses klibi yok (yalnız 0-100 arası tam sayı).`);
  }
  const kaynak = sayNumber(n);
  if (kaynak.kind !== 'key') {
    throw new Error('ritmik: sayNumber tek anahtar döndürmedi.');
  }
  return kaynak.key;
}

/** `havuz`dan `k` elemanlı tüm alt kümeler (artan sırada). Havuz küçük (≤4). */
function kombinasyonlar(havuz: readonly number[], k: number): number[][] {
  if (k === 0) return [[]];
  if (k > havuz.length) return [];
  const sonuc: number[][] = [];
  for (let i = 0; i <= havuz.length - k; i++) {
    for (const kuyruk of kombinasyonlar(havuz.slice(i + 1), k - 1)) {
      sonuc.push([havuz[i], ...kuyruk]);
    }
  }
  return sonuc;
}

// ------------------------------------------------------------------ biçim seçimi

/**
 * Zorluk kademesine uygun ritmik sayma biçimleri.
 *
 * Havuzlar `skills.json` içindeki düğüm zorluklarıyla hizalıdır:
 * ileri-birer-20 (1) · ileri-ikiser-20 / ileri-birer-100 / ileri-onar-100 /
 * geri-birer-20 (3) · ileri-beser-100 / geri-ikiser-20 (4).
 * Listenin kendisi `RITMIK_SAYMA_BICIMLERI`den SÜZÜLEREK kurulur — burada elle
 * yeni bir üçlü yazılmaz, dolayısıyla müfredat dışı bir biçim sızamaz.
 */
function bicimBul(yon: 'ileri' | 'geri', adim: number): RitmikSaymaBicimi {
  const bulunan = RITMIK_SAYMA_BICIMLERI.find((b) => b.yon === yon && b.adim === adim);
  if (!bulunan) {
    // Buraya düşmek, RITMIK_SAYMA_BICIMLERI listesinin değiştiği anlamına gelir.
    throw new Error(`ritmik: (${yon}, ${adim}) müfredatta tanımlı bir biçim değil.`);
  }
  return bulunan;
}

/** Zorluğa göre biçim havuzu. */
export function ritmikBicimHavuzu(difficulty: Difficulty): readonly RitmikSaymaBicimi[] {
  switch (difficulty) {
    case 1:
    case 2:
      // Giriş noktası: yalnız ileriye birer (20 bandında).
      return [bicimBul('ileri', 1)];
    case 3:
      return [
        bicimBul('ileri', 1),
        bicimBul('ileri', 2),
        bicimBul('ileri', 10),
        bicimBul('geri', 1),
      ];
    case 4:
      return [
        bicimBul('ileri', 5),
        bicimBul('ileri', 10),
        bicimBul('geri', 2),
        bicimBul('ileri', 1),
      ];
    case 5:
      return [bicimBul('ileri', 5), bicimBul('ileri', 2), bicimBul('geri', 2)];
  }
}

/**
 * Üretilen sayılara bakarak hangi beceri düğümünün yoklandığını söyler.
 * `enBuyukDeger` yalnız "ileri birer"de ayrım yapar: 20 bandındaki bir dizi
 * `ileri-birer-100` düğümünü ölçmüş sayılmaz (onluk geçişi hiç yaşanmamıştır).
 */
export function ritmikSkillIdleri(
  bicim: RitmikSaymaBicimi,
  enBuyukDeger: number,
): readonly SkillId[] {
  if (bicim.yon === 'geri') {
    return bicim.adim === 1 ? ['mat.ritmik.geri-birer-20'] : ['mat.ritmik.geri-ikiser-20'];
  }
  switch (bicim.adim) {
    case 1:
      return enBuyukDeger <= KUCUK_SAYI_TAVANI
        ? ['mat.ritmik.ileri-birer-20']
        : ['mat.ritmik.ileri-birer-100'];
    case 2:
      return ['mat.ritmik.ileri-ikiser-20'];
    case 5:
      return ['mat.ritmik.ileri-beser-100'];
    case 10:
      return ['mat.ritmik.ileri-onar-100'];
  }
}

// ------------------------------------------------------------------- plan kurma

/** Zorluğa göre varsayılan boşluk sayısı / yerleşimi / dizi uzunluğu. */
function zorlukAyari(
  difficulty: Difficulty,
  rng: Rng,
): { terimSayisi: number; eksikSayisi: 1 | 2 | 3; konum: EksikKonum } {
  switch (difficulty) {
    case 1:
      // Programın varsayılan biçimi: ilk üç adım verilir, dördüncü istenir.
      return { terimSayisi: 4, eksikSayisi: 1, konum: 'son' };
    case 2:
      return { terimSayisi: 5, eksikSayisi: 1, konum: 'son' };
    case 3:
      return { terimSayisi: 5, eksikSayisi: 1, konum: 'karisik' };
    case 4:
      return { terimSayisi: 6, eksikSayisi: 2, konum: 'karisik' };
    case 5:
      return { terimSayisi: 6, eksikSayisi: rng.bool(0.4) ? 3 : 2, konum: 'orta' };
  }
}

/**
 * Dizinin ilk terimini seçer.
 *
 * HİZALAMA KURALI: adım 1'den büyükse `bas` adımın katıdır. Gerekçe: MAT.1.1.5
 * "beşer/onar/ikişer ritmik sayma" STANDART diziyi kastediyor (5,10,15... ·
 * 2,4,6...). 3,8,13 dizisi "beşer sayma" değil, farkı 5 olan bir örüntüdür;
 * o da MAT.1.1.6'nın zenginleştirme maddesidir ve M-ORUNTU-SAYI şablonunun işi.
 * Bu şablon ritmik sayma iddiasında olduğu için hizalamayı ZORUNLU tutuyoruz.
 */
function basSec(
  bicim: RitmikSaymaBicimi,
  terimSayisi: number,
  difficulty: Difficulty,
  rng: Rng,
): number {
  const adim = bicim.adim;
  const yayilim = (terimSayisi - 1) * adim;

  if (bicim.yon === 'geri') {
    // "20'den geriye": başlangıç 20'yi AŞAMAZ, son terim 0'ın altına inemez.
    const enKucukBas = yayilim;
    const enBuyukBas = bicim.baslangic; // 20
    if (enKucukBas > enBuyukBas) {
      throw new Error(
        `ritmik: geriye ${adim}'er ${terimSayisi} terim 20'den başlayarak sığmıyor.`,
      );
    }
    // Düşük zorlukta kanonik biçim: tam 20'den başla.
    if (difficulty <= 2) return enBuyukBas;
    if (adim === 1) return rng.int(enKucukBas, enBuyukBas);
    const enKucukKat = Math.ceil(enKucukBas / adim);
    return adim * rng.int(enKucukKat, Math.floor(enBuyukBas / adim));
  }

  // İleri yön. Zorluk 1-2 bilerek 20 bandında kalır (giriş düğümü orası).
  // AMA bu bir TERCİH, kısıt değil: planlayıcı "zorluk 2'de beşer sayma" isterse
  // (6 terim × 5 = 30, 20 bandına sığmaz) soruyu üretememek yerine biçimin kendi
  // müfredat tavanına çıkıyoruz. Aksi hâlde geçerli bir istek hata fırlatırdı.
  const tavan = bicim.ustSinir;
  const kucukBant = Math.min(KUCUK_SAYI_TAVANI, tavan);
  const etkinTavan = difficulty <= 2 && kucukBant >= yayilim ? kucukBant : tavan;
  const enBuyukBas = etkinTavan - yayilim;
  if (enBuyukBas < 0) {
    throw new Error(
      `ritmik: ileriye ${adim}'er ${terimSayisi} terim ${etkinTavan} tavanına sığmıyor.`,
    );
  }

  if (adim > 1) {
    return adim * rng.int(0, Math.floor(enBuyukBas / adim));
  }

  // Birer sayma, geniş bant: ONLUK GEÇİŞİNİ hedefle (ileri-birer-100 düğümünün
  // asıl zorluğu 29→30, 59→60 geçişleridir; 41,42,43 dizisi onu ölçmez).
  if (etkinTavan > KUCUK_SAYI_TAVANI && terimSayisi >= 3 && rng.bool(0.7)) {
    const onlukAdaylari: number[] = [];
    for (let onluk = 10; onluk <= etkinTavan - 1; onluk += 10) {
      // Geçiş dizinin içinde kalsın: bas < onluk < son.
      for (let kaydir = 1; kaydir <= terimSayisi - 2; kaydir++) {
        const aday = onluk - kaydir;
        if (aday >= 0 && aday + yayilim <= etkinTavan) onlukAdaylari.push(aday);
      }
    }
    if (onlukAdaylari.length > 0) return rng.pick(onlukAdaylari);
  }
  return rng.int(0, enBuyukBas);
}

/**
 * Boşluk indekslerini seçer. TÜMÜ ≥ `EN_KUCUK_EKSIK_INDEKS` (=2).
 * Mümkünse boşluklar BİTİŞİK OLMAZ: aralarında görünür bir terim kalınca çocuk
 * her boşluğu kendi komşusundan doğrulayabilir. 'son' yerleşiminde bitişiklik
 * kaçınılmazdır (ve kasıtlıdır — orası "saymaya devam et" görevidir).
 */
function eksikIndeksleriSec(
  terimSayisi: number,
  eksikSayisi: number,
  konum: EksikKonum,
  rng: Rng,
): number[] {
  if (konum === 'son') {
    const ilk = terimSayisi - eksikSayisi;
    if (ilk < EN_KUCUK_EKSIK_INDEKS) {
      throw new Error('ritmik: sondaki boşluklar dizinin başına taşıyor.');
    }
    return Array.from({ length: eksikSayisi }, (_, k) => ilk + k);
  }

  // 'orta' son terime dokunmaz; 'karisik' son terimi de kullanabilir.
  const enBuyukIndeks = konum === 'orta' ? terimSayisi - 2 : terimSayisi - 1;
  const havuz: number[] = [];
  for (let i = EN_KUCUK_EKSIK_INDEKS; i <= enBuyukIndeks; i++) havuz.push(i);

  const tumu = kombinasyonlar(havuz, eksikSayisi);
  if (tumu.length === 0) {
    throw new Error(
      `ritmik: ${terimSayisi} terimli dizide '${konum}' yerleşimiyle ${eksikSayisi} boşluk açılamaz.`,
    );
  }
  const bitisiksiz = tumu.filter((k) => k.every((v, i) => i === 0 || v - k[i - 1] > 1));
  return rng.pick(bitisiksiz.length > 0 ? bitisiksiz : tumu);
}

/**
 * Parametreleri eksiksiz bir plana çevirir.
 * Rastgeleliğin tamamı `rng`den gelir; aynı tohum → birebir aynı plan.
 */
export function ritmikPlanKur(params: RitmikParams, rng: Rng): RitmikPlan {
  const difficulty = params.difficulty;
  const bicim = params.bicim ?? rng.pick(ritmikBicimHavuzu(difficulty));
  const varsayilan = zorlukAyari(difficulty, rng);

  const konum: EksikKonum = params.eksikKonum ?? varsayilan.konum;
  let eksikSayisi: number = params.eksikSayisi ?? varsayilan.eksikSayisi;

  // Dizi uzunluğu: hem müfredat tavanına (6) hem de boşlukların sığmasına uymalı.
  // 'orta' yerleşimi son terimi kullanamadığı için bir terim daha ister.
  const enAzGereken = eksikSayisi + (konum === 'orta' ? 3 : 2);
  const terimSayisi = sinirla(
    params.terimSayisi ?? varsayilan.terimSayisi,
    Math.max(EN_AZ_TERIM, enAzGereken),
    EN_COK_TERIM,
  );
  // 6 terim + 'orta' yerleşimi en fazla 3 boşluk taşır; fazlası istenirse kırpılır.
  const tasiyabilecegi = terimSayisi - (konum === 'orta' ? 3 : 2);
  eksikSayisi = sinirla(eksikSayisi, 1, Math.max(1, tasiyabilecegi));

  const bas = params.bas ?? basSec(bicim, terimSayisi, difficulty, rng);
  const yonIsareti = bicim.yon === 'ileri' ? 1 : -1;
  const terimler = Array.from(
    { length: terimSayisi },
    (_, i) => bas + yonIsareti * i * bicim.adim,
  );
  const son = terimler[terimler.length - 1];

  // ARTAN SIRA bir sözleşmedir, süs değil: "odak boşluk = ilk boşluk" kuralı ve
  // "hepsi sonda mı" denetimi buna dayanıyor. Seçici zaten sıralı üretiyor,
  // sıralama ileride biri seçiciyi değiştirirse diye sigortadır.
  const eksikIndeksler = [...eksikIndeksleriSec(terimSayisi, eksikSayisi, konum, rng)].sort(
    (a, b) => a - b,
  );

  // GERİ SAYMA → her zaman kart dizisi.
  // Gerekçe: `VisualSpec.sayiDogrusu` yön taşımıyor (bas<son varsayılır), yani
  // azalan bir diziyi sayı doğrusunda göstermenin yolu yok. Kart dizisi ise
  // kartları sayma sırasına dizer: 20, 19, 18, □, 16. VisualSpec'e bir 'yon'
  // alanı eklenirse bu kısıt kalkabilir.
  const gosterim: Gosterim =
    bicim.yon === 'geri' ? 'kartDizisi' : (params.gosterim ?? (rng.bool() ? 'sayiDogrusu' : 'kartDizisi'));

  // Kart sayısı: doğru kart(lar) + en az bir çeldirici, toplam en fazla 4.
  // Akıllı tahtada hedefler büyük olmalı (ürün kısıtı #6) → bir kart daha az.
  const istenenKart = params.sikSayisi ?? (params.mod === 'tahta' ? 3 : EN_COK_KART);
  const kartSayisi = sinirla(istenenKart, eksikIndeksler.length + 1, EN_COK_KART);

  // Çeldirici aralığı: 0'dan biçimin tavanına. Zorluk 1-2'de 20 bandını aşmıyoruz
  // (o aşamadaki çocuk 21'i henüz tanımıyor), ama dışarıdan gelen `bas` daha
  // yukarıdaysa dizinin kendisi tavanı yükseltir — çeldirici diziden küçük
  // bir dünyaya hapsolmasın.
  const tavan = bicimTavani(bicim);
  const zorlukTavani = difficulty <= 2 ? Math.min(KUCUK_SAYI_TAVANI, tavan) : tavan;
  const celdiriciAraligi: SayiAraligi = {
    min: 0,
    max: Math.min(tavan, Math.max(zorlukTavani, ...terimler)),
  };

  return {
    bicim,
    bas,
    son,
    terimler,
    eksikIndeksler,
    gosterim,
    kartSayisi,
    celdiriciAraligi,
  };
}

// --------------------------------------------------------------- plan doğrulama

/**
 * MÜFREDAT DENETİMİ — son savunma hattı.
 * Boş dizi = sorun yok. Üretim yolunda çağrılır ve dolu dönerse FIRLATILIR:
 * müfredat dışı bir soru ekrana gelmektense uygulama gürültülü biçimde durur.
 */
export function ritmikPlaniDogrula(plan: RitmikPlan): string[] {
  const hatalar: string[] = [];
  const { bicim, terimler, eksikIndeksler } = plan;
  const enBuyuk = Math.max(...terimler);
  const enKucuk = Math.min(...terimler);

  // 1) (yön, adım, sınır) üçlüsü — tek gerçek kaynak types.ts'teki denetleyici.
  if (!ritmikSaymaGecerliMi(bicim.yon, bicim.adim, enBuyuk)) {
    hatalar.push(
      `Müfredat dışı ritmik sayma: yön=${bicim.yon}, adım=${bicim.adim}, en büyük sayı=${enBuyuk}.`,
    );
  }
  // 2) İleri sayma 100'ü, geri sayma 20'yi (başlangıç değeri) aşamaz.
  const tavan = bicimTavani(bicim);
  if (enBuyuk > tavan) {
    hatalar.push(`Dizi tavanı aştı: ${enBuyuk} > ${tavan}.`);
  }
  if (enKucuk < 0) {
    hatalar.push(`Negatif sayı üretildi: ${enKucuk}. 1. sınıfta negatif sayı yok.`);
  }
  if (!terimler.every((t) => Number.isInteger(t))) {
    hatalar.push('Dizide tam sayı olmayan terim var.');
  }
  // 3) Adım hizalaması (adım > 1 ise standart ritmik dizi).
  if (bicim.adim > 1 && plan.bas % bicim.adim !== 0) {
    hatalar.push(
      `Hizalanmamış başlangıç: ${plan.bas}, ${bicim.adim} adımının katı değil ` +
        '(kaydırılmış dizi ritmik sayma değil, örüntüdür).',
    );
  }
  // 4) Dizi uzunluğu — MAT.1.1.6: en fazla altıncı adım.
  if (terimler.length < EN_AZ_TERIM || terimler.length > EN_COK_TERIM) {
    hatalar.push(`Dizi uzunluğu ${terimler.length}; ${EN_AZ_TERIM}-${EN_COK_TERIM} olmalı.`);
  }
  // 5) Boşluk yerleşimi — asla başta değil, en az iki ardışık görünür terim var.
  if (eksikIndeksler.length === 0) {
    hatalar.push('Hiç boşluk yok — sorulacak bir şey kalmıyor.');
  }
  for (const i of eksikIndeksler) {
    if (i < EN_KUCUK_EKSIK_INDEKS) {
      hatalar.push(`Boşluk dizinin başında (indeks ${i}); örüntü kaynağı kalmıyor.`);
    }
    if (i >= terimler.length) {
      hatalar.push(`Boşluk indeksi dizi dışında: ${i}.`);
    }
  }
  if (new Set(eksikIndeksler).size !== eksikIndeksler.length) {
    hatalar.push('Yinelenen boşluk indeksi.');
  }
  if (eksikIndeksler.some((v, i) => i > 0 && v <= eksikIndeksler[i - 1])) {
    hatalar.push('Boşluk indeksleri artan sırada değil (odak boşluk hesabı bozulur).');
  }
  if (eksikIndeksler.length >= terimler.length - 1) {
    hatalar.push('Görünür terim sayısı ikiden az — adım okunamaz.');
  }
  return hatalar;
}

// ------------------------------------------------------------------- görselleme

/**
 * Sahne görseli. Jeneratör ÇİZMEZ, TARİF EDER.
 *
 * `bosluklariGoster=false` (K3 ipucu) tamamlanmış diziyi verir: aynı sahne,
 * boşluklar dolu. "Birlikte yapalım" kademesinde çocuk doğru diziyi görür.
 *
 * NOT: spesifikasyon gizlenen terimlerin DEĞERLERİNİ de taşır (`eksik` /
 * `eksikIndeksler`). Bu, `VisualSpec.sayiDogrusu`nun kendi sözleşmesidir
 * ("eksik: boş bırakılıp çocuğa doldurtulacak değerler"); çizim katmanı bu
 * indeksleri boş göz olarak render etmekle yükümlüdür.
 */
function sahneGorseli(plan: RitmikPlan, bosluklariGoster: boolean): VisualSpec {
  const eksikSet = new Set(plan.eksikIndeksler);
  if (plan.gosterim === 'sayiDogrusu') {
    // Sayı doğrusu her zaman ARTAN çizilir; geri sayma buraya hiç düşmez.
    const eksikDegerler = plan.terimler.filter((_, i) => eksikSet.has(i));
    const gorunurDegerler = plan.terimler.filter((_, i) => !eksikSet.has(i));
    return {
      type: 'sayiDogrusu',
      bas: plan.terimler[0],
      son: plan.terimler[plan.terimler.length - 1],
      adim: plan.bicim.adim,
      isaretli: bosluklariGoster ? [...gorunurDegerler] : [...plan.terimler],
      eksik: bosluklariGoster ? eksikDegerler : [],
    };
  }
  return {
    type: 'oruntu',
    ogeler: plan.terimler.map((sayi) => ({ type: 'rakam', sayi }) as const),
    eksikIndeksler: bosluklariGoster ? [...plan.eksikIndeksler] : [],
  };
}

// ------------------------------------------------------------------ çeldiriciler

/**
 * Bu şablonun ürettiği tanı etiketleri, ÖNCELİK SIRASIYLA.
 *
 *  ORUNTU_FAZ          — kuralı buldu ama bir adım kaydı (doğru ± adım).
 *                        Ritmik saymanın bir numaralı hatası.
 *  ISLEM_YONU          — YÖN TERS ÇEVRİLDİ: önceki terime adımı ters yönde
 *                        uyguladı. Bağlam (a=önceki terim, b=adım, işlem=yön)
 *                        verildiğinde distractors.ts bunu tam olarak üretir:
 *                        ileri dizide `önceki − adım`, geri dizide `önceki + adım`.
 *                        Bu değer TANIM GEREĞİ dizide görünen bir terimdir
 *                        (doğru ∓ 2·adım) — hata da zaten "az önce söylediğim
 *                        sayıya geri döndüm" hatasıdır.
 *  SAYI_DOGRUSU_ARALIK — ±1: çentikleri değil aralıkları sayma (çit direği
 *                        hatası). YALNIZ sayı doğrusu sunumunda kullanılır;
 *                        kart dizisinde ortada sayı doğrusu yokken bu etiketi
 *                        iliştirmek yanlış tanı olurdu.
 *  FAZLA_SAYMA/EKSIK_SAYMA — komşu değer dolgusu; yön bazlı ve dürüst.
 */
function hataOnceligi(plan: RitmikPlan): readonly HataEtiketi[] {
  const ileri = plan.bicim.yon === 'ileri';
  const temel: HataEtiketi[] = ['ORUNTU_FAZ', 'ISLEM_YONU'];
  if (plan.gosterim === 'sayiDogrusu') temel.push('SAYI_DOGRUSU_ARALIK');
  temel.push(ileri ? 'FAZLA_SAYMA' : 'EKSIK_SAYMA');
  temel.push(ileri ? 'EKSIK_SAYMA' : 'FAZLA_SAYMA');
  return temel;
}

/**
 * Çeldirici değerleri seçer.
 *
 * İKİ SÜZGEÇ:
 *  1. YASAK — başka bir boşluğun doğru cevabı çeldirici olamaz. (Aksi hâlde
 *     "yanlış" şık aslında doğru olurdu; `sayisalCeldiriciler` yalnız TEK bir
 *     doğru cevabı dışlar, çok boşluklu maddede bu yetmez.)
 *  2. ELEME KISA YOLU — çeldiricilerin HEPSİ ekranda görünen terimlerden
 *     oluşursa çocuk saymadan çözebilir: "bunlar zaten dizide var, kalan kart
 *     doğrudur". O yüzden en az bir çeldirici dizide görünmeyen bir değer olmalı.
 *     En düşük öncelikli çeldiriciyi feda ederek bunu garantiliyoruz; tanı gücü
 *     yüksek ilk iki etiket (ORUNTU_FAZ, ISLEM_YONU) korunur.
 */
function celdiricileriSec(
  plan: RitmikPlan,
  odakIndeks: number,
  rng: Rng,
): readonly SayisalCeldirici[] {
  const dogru = plan.terimler[odakIndeks];
  const onceki = plan.terimler[odakIndeks - 1]; // ilk boşluğun öncülü HEP görünür
  const istenen = plan.kartSayisi - plan.eksikIndeksler.length;

  const yasakli = new Set(
    plan.eksikIndeksler.filter((i) => i !== odakIndeks).map((i) => plan.terimler[i]),
  );
  const gorunur = new Set(
    plan.terimler.filter((_, i) => !plan.eksikIndeksler.includes(i)),
  );

  // Tampon: yasaklıların tamamı elenirse bile istenen sayı kalsın; ayrıca
  // "görünmeyen değer" arayışı için dizinin BOYU kadar fazladan aday isteyelim.
  // Neden dizi boyu: yedek strateji doğrunun etrafından dışa doğru genişliyor;
  // dizide görünmeyen ilk değere ulaşmak için pencereyi (en fazla 6 terim)
  // aşmak gerekir. Aralıkta en az 21 farklı değer var, bu tampon her zaman
  // karşılanabilir.
  const adet = istenen + yasakli.size + plan.terimler.length + 2;
  const havuz = sayisalCeldiricilerKesin(
    dogru,
    hataOnceligi(plan),
    plan.celdiriciAraligi,
    adet,
    rng,
    {
      baglam: {
        adim: plan.bicim.adim,
        a: onceki,
        b: plan.bicim.adim,
        islem: plan.bicim.yon === 'ileri' ? '+' : '-',
      },
    },
  ).filter((c) => !yasakli.has(c.deger));

  if (havuz.length < istenen) {
    throw new Error(
      `ritmik: ${istenen} çeldirici gerekiyordu, ${havuz.length} kaldı (yasaklı değerler elendikten sonra).`,
    );
  }

  const secilen = havuz.slice(0, istenen);
  if (secilen.every((c) => gorunur.has(c.deger))) {
    const gorunmeyen = havuz.slice(istenen).find((c) => !gorunur.has(c.deger));
    if (gorunmeyen) secilen[secilen.length - 1] = gorunmeyen;
  }
  return secilen;
}

// ----------------------------------------------------------------------- talimat

/**
 * Talimat sesi. Öğretmen ne yapıyorsa o: diziyi sesli sayar, sonra sorar.
 *
 * ⚠ SESLENDİRİLEN SAYILAR ARDIŞIK OLMAK ZORUNDA. "Görünen ilk üç sayı"yı
 * okumak, ortasında boşluk olan bir dizide (20, 18, □, □, □, 10) kulağa
 * "yirmi, on sekiz, on" gibi gelir ve çocuğa YANLIŞ bir örüntü öğretir.
 * Bu yüzden ilk boşluğa kadar giden KESİNTİSİZ koşunun son üç terimi okunur:
 * "…on altı, on yedi, on sekiz — eksik sayı hangisi?". `odakIndeks ≥ 2`
 * olduğu için bu koşuda her zaman en az iki terim vardır.
 */
function talimatSesi(
  terimler: readonly number[],
  odakIndeks: number,
  soruAnahtari: SpeechKey,
  gapMs: number,
): SpeakSource {
  const kesintisizKosu = terimler.slice(Math.max(0, odakIndeks - 3), odakIndeks);
  const keys: SpeechKey[] = kesintisizKosu.map(sayiSesAnahtari);
  keys.push(soruAnahtari);
  return { kind: 'sequence', keys, gapMs };
}

// ------------------------------------------------------------------------ üretim

export function ritmikUret(params: RitmikParams, rng: Rng): Exercise {
  const plan = ritmikPlanKur(params, rng.fork('plan'));

  // MÜFREDAT KAPISI — buradan sonrası ancak plan temizse çalışır.
  const ihlaller = ritmikPlaniDogrula(plan);
  if (ihlaller.length > 0) {
    throw new Error(`M-RITMIK müfredat ihlali: ${ihlaller.join(' | ')}`);
  }

  const { terimler, eksikIndeksler } = plan;

  // Odak boşluk = İLK boşluk. Öncülü her zaman görünürdür (kural: indeks ≥ 2),
  // dolayısıyla "yön ters çevrilmiş" çeldiricinin bağlamı hep kurulabilir.
  const odakIndeks = eksikIndeksler[0];
  const celdiriciler = celdiricileriSec(plan, odakIndeks, rng.fork('celdirici'));

  // --- şıklar (kartlar) -----------------------------------------------------
  // `celdiricileriSikaCevir` TEK doğru cevap varsayar; burada 1-3 doğru kart
  // olabildiği için kartları elle kuruyoruz ama AYNI id kuralına uyuyoruz
  // (`sik-d-*` / `sik-y-*`), böylece kayıt ve rapor katmanı tek biçim görür.
  const dogruKartlar: Option[] = eksikIndeksler.map((i) => ({
    id: `sik-d-${terimler[i]}`,
    deger: { tur: 'sayi', sayi: terimler[i] },
    correct: true,
    ses: sayNumber(terimler[i]),
  }));
  const yanlisKartlar: Option[] = celdiriciler.map((c) => ({
    id: `sik-y-${c.deger}`,
    deger: { tur: 'sayi', sayi: c.deger },
    diagnosticTag: c.etiket,
    ses: sayNumber(c.deger),
  }));
  const options = rng.fork('kart-sira').shuffle([...dogruKartlar, ...yanlisKartlar]);

  // --- yuvalar --------------------------------------------------------------
  // Konumlar sahneye göre normalize (0..1). Dizi tek satır; çizim katmanı
  // sahneyi ekranın alt %65'ine yerleştirmekle yükümlü (ürün kısıtı #6).
  const yuvalar: readonly Yuva[] = eksikIndeksler.map((i) => ({
    id: `yuva-${i}`,
    konum: { x: (i + 0.5) / terimler.length, y: 0.5 },
    bekleyen: 'sayi',
  }));
  const dogruEslesme: Record<string, string> = {};
  for (const i of eksikIndeksler) {
    dogruEslesme[`yuva-${i}`] = `sik-d-${terimler[i]}`;
  }

  // --- talimat --------------------------------------------------------------
  // Boşlukların hepsi sondaysa görev "saymaya devam et"tir → "hangisi gelir?".
  // Aksi hâlde dizinin içinde bir delik vardır → "eksik sayı".
  const hepsiSonda = eksikIndeksler.every(
    (ix, k) => ix === terimler.length - eksikIndeksler.length + k,
  );
  const soruAnahtari: SpeechKey = hepsiSonda ? 'soru.hangisi-gelir' : 'soru.eksik-sayi';
  const sahne = sahneGorseli(plan, true);
  const tamSahne = sahneGorseli(plan, false);

  const prompt: Prompt = {
    ses: talimatSesi(terimler, odakIndeks, soruAnahtari, 320),
    // "Tekrar dinle": aynı cümle, aralıklar geniş — birlikte sayma temposu.
    tekrarSes: talimatSesi(terimler, odakIndeks, soruAnahtari, 620),
    gorsel: sahne,
    // metin YOK: readingLoad 0 (ürün kısıtı #1).
  };

  const assets: readonly AssetSpec[] = [
    { id: 'sahne-dizi', rol: 'sahne', gorsel: sahne, erisimBolgesi: 'alt65' },
    { id: 'ipucu-tam-dizi', rol: 'ipucu', gorsel: tamSahne, erisimBolgesi: 'serbest' },
  ];

  // --- yardım ---------------------------------------------------------------
  // K2'de tek bir çeldirici soluklaşır — en DÜŞÜK öncelikli olan. Tek çeldirici
  // varsa hiçbiri elenmez: elemek cevabı doğrudan vermek olurdu, o K3'ün işi.
  const eleAdaylari =
    yanlisKartlar.length >= 2 ? [yanlisKartlar[yanlisKartlar.length - 1].id] : undefined;
  const hints = varsayilanIpuclari({
    talimatSesi: prompt.tekrarSes ?? prompt.ses,
    // "Birlikte sayalım" — ritmik saymanın doğal stratejisi; genel eleme sesinden
    // daha öğretici.
    k2Ses: { kind: 'key', key: 'yardim.k2-birlikte-sayalim' },
    eleOptionIds: eleAdaylari,
    vurgulaIds: [`yuva-${odakIndeks}`, 'sahne-dizi'],
    k3Gorsel: tamSahne,
  });

  const enBuyuk = Math.max(...terimler);
  const parametreImzasi = [
    plan.bicim.yon,
    plan.bicim.adim,
    plan.bas,
    terimler.length,
    eksikIndeksler.join('-'),
    plan.gosterim,
  ].join('|');

  const alistirma: Exercise = {
    kind: 'TAP_TO_PLACE',
    itemId: makeItemId(RITMIK_TEMPLATE_ID, params.seed, parametreImzasi),
    templateId: RITMIK_TEMPLATE_ID,
    skillIds: ritmikSkillIdleri(plan.bicim, enBuyuk),
    // MAT.1.1.6: "örüntüde verilmeyen terimi bulma da kapsamdadır" (SAYFA 23).
    kazanimKodlari: ['MAT.1.1.5', 'MAT.1.1.6'] as readonly KazanimKodu[],
    readingLoad: 0,
    difficulty: params.difficulty,
    estimatedSec:
      16 +
      5 * (eksikIndeksler.length - 1) +
      (plan.bicim.adim > 1 ? 3 : 0) +
      (enBuyuk > KUCUK_SAYI_TAVANI ? 3 : 0),
    prompt,
    hints,
    assets,
    seed: params.seed,
    options,
    yuvalar,
    validation: {
      mod: 'yerlesim',
      dogruEslesme,
      // Boşluklar hangi sırayla doldurulursa doldurulsun kabul: soldan sağa
      // gitmeyen çocuk yanlış yapmış olmaz, sadece farklı bir yol izlemiştir.
      siraOnemli: false,
    },
  };

  // Ürün kısıtı denetimi (okuma yükü, tanı etiketi, ipucu kademeleri...).
  // Jeneratör hatası ekrana çıkmadan burada patlasın.
  const urunIhlalleri = alistirmaIhlalleri(alistirma);
  if (urunIhlalleri.length > 0) {
    throw new Error(`M-RITMIK ürün kısıtı ihlali: ${urunIhlalleri.join(' | ')}`);
  }
  return alistirma;
}

// ------------------------------------------------------------------- jeneratör

export const M_RITMIK: ExerciseGenerator<RitmikParams> = {
  templateId: RITMIK_TEMPLATE_ID,
  kind: 'TAP_TO_PLACE',
  karsilananKazanimlar: ['MAT.1.1.5', 'MAT.1.1.6'],
  karsilananSkillIds: [
    'mat.ritmik.ileri-birer-20',
    'mat.ritmik.ileri-birer-100',
    'mat.ritmik.ileri-onar-100',
    'mat.ritmik.ileri-beser-100',
    'mat.ritmik.ileri-ikiser-20',
    'mat.ritmik.geri-birer-20',
    'mat.ritmik.geri-ikiser-20',
  ],
  readingLoad: 0,
  zorlukAraligi: [1, 5],
  uretebildigiHatalar: [
    'ORUNTU_FAZ',
    'ISLEM_YONU',
    'SAYI_DOGRUSU_ARALIK',
    'FAZLA_SAYMA',
    'EKSIK_SAYMA',
  ],
  uret: ritmikUret,
};
