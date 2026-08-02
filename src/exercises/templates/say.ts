/**
 * M-SAY — NESNE SAYMA ŞABLONU (iki aşamalı: dokun-say → rakamı seç)
 *
 * ============================ MÜFREDAT BAĞI ============================
 * MAT.1.1.1 — "Rakamları ve 20'ye kadar olan sayıları (20 dâhil), niceliklerin
 *   büyüklüklerini temsil etmek için kullanabilme."
 *   Karşılanışı: çocuk gördüğü çokluğu bir RAKAMLA temsil ediyor (2. aşama).
 *   Süreç bileşeni (b): "niceliklerin büyüklüklerini farklı temsilleri
 *   bağlamında belirler" — aynı çokluk sıra, öbek, onluk çerçeve ve dağınık
 *   yerleşimlerde gösterilir; hepsinde aynı rakama çıkar.
 *
 * MAT.1.1.2 — "Ögeleri dağınık veya düzenli bir şekilde bulunan bir nesne
 *   grubunu sayarken parçalar arasında ilişkileri çözümleyebilme."
 *   Karşılanışı: `layout` ekseni bu kazanımın ta kendisi. 'sira'/'gruplu'/
 *   'onlukCerceve' = DÜZENLİ, 'dagınık' = DAĞINIK. Program aşamalandırması
 *   (SAYFA 22) zorluğa gömülü: önce 10'dan az çoklukta parça-bütün, sonra
 *   10-20 arasında onluk/birlik çözümlemesi.
 *   Program şunu da şart koşuyor: ilk aşamada "onluk/birlik" KAVRAM ADLARI
 *   KULLANILMAZ. Bu yüzden şablon hiçbir yerde bu sözcükleri seslendirmez;
 *   yapı yalnızca GÖRSEL olarak (onluk çerçeve) sunulur.
 *
 * MÜFREDAT SINIRI: nesne sayısı 1–20 (20 dâhil). Ritmik saymanın 100 tavanı
 * BURAYA GEÇMEZ — nesne sayma ve işlem 20 sınırındadır
 * (docs/mufredat-kisitlari.md §2). `ISLEM_ARALIGI.max` bu dosyada tek referans
 * noktasıdır; sabit 20 yazılmaz.
 *
 * ====================== ÖLÇTÜĞÜ MİKRO DÜĞÜMLER ======================
 *  · mat.sayma.birebir-esleme    (dokunma evresi: her nesneye BİR sayı sözcüğü)
 *  · mat.sayma.kardinalite       (rakam evresi: son sayı = TOPLAM)
 *  · mat.sayma.dagilmis-10       (10'a kadar dağınık yerleşim)
 *  · mat.sayma.yirmiye-kadar     (11–20)
 *  · mat.sayi.miktar-rakam-eslestirme (çokluk ↔ rakam)
 *  · mat.sayi.onluk-cerceve      (onluk çerçevede yapı görme)
 * Hangi düğümlerin bildirileceği maddenin parametrelerinden TÜRETİLİR
 * (`skillIdleri`); planlayıcı bir maddeyi görünce hangi düğümü güncelleyeceğini
 * tahmin etmek zorunda kalmaz.
 *
 * ========================= İKİ AŞAMALI TASARIM =========================
 * Bu şablonun asıl değeri, tek soruda İKİ AYRI mikro düğümü BİRBİRİNDEN AYIRARAK
 * ölçmesidir:
 *
 *   Aşama 1 (dokunma)  → çocuk nesnelere tek tek dokunur, dokunulan işaretlenir.
 *                        Birebir eşleme GÖRÜNÜR hâle gelir; atlanan ya da iki kez
 *                        dokunulan nesne kayda geçer.
 *   Aşama 2 (rakam)    → çocuk doğru rakamı seçer. Kardinalite ölçülür.
 *
 * Tanı kuralı (bkz. `sayTanisi`, bu dosyanın sonunda — kural KODDUR, yoruma
 * bırakılmamıştır):
 *   dokunma sayısı yanlış                → BIREBIR_ESLESME
 *   dokunma doğru + rakam yanlış         → KARDINALITE
 *   dokunma yanlış + rakam = kendi sayımı→ BIREBIR_ESLESME (kardinalite SAĞLAM)
 *
 * NEDEN `cevapSecimi: 'sayac'` DEĞİL 'secenek': ekranda bir sayaç dönseydi çocuk
 * kendi dokunuş sayısını okuyup yazardı ve iki aşama tek aşamaya çökerdi —
 * kardinaliteyi bağımsız ölçemezdik. Sayaç, ölçmek istediğimiz şeyi ele veriyor.
 *
 * `responseMode: 'pickOnly'` ise tek aşamalıdır (dokunma yok): daha hızlı, daha
 * az tanı gücü. Karışık oturumlarda ritmi değiştirmek ve ustalaşmış çocuğu
 * dokunma zahmetinden kurtarmak için var.
 *
 * ====================== 'dagınık' YERLEŞİM NEDEN VAR ======================
 * Genel kural olarak nesneleri rastgele dağıtmak sayma öğrenimini BOZAR: çocuk
 * nereden başlayacağını bilemez, kaydını kaybeder. Buradaki istisna kasıtlıdır:
 * MAT.1.1.2 tam olarak "dağınık grubu sayarken parçalar arası ilişki kurma"yı
 * istiyor. Dağınıklık burada HATA DEĞİL, ÖLÇÜM ARACIDIR — dokunarak işaretleme
 * (Aşama 1) çocuğa dağınık kümede kayıt tutmayı öğretir.
 * Konumlar tohumdan DETERMİNİSTİK üretilir, çakışmazlar (sarsıntılı ızgara,
 * bkz. `dagitilmisKonumlar`) ve görsel spesifikasyonda hazır verilir; render
 * katmanı konum uydurmaz.
 *
 * ========================= ÇELDİRİCİ KARARLARI =========================
 * Tümü `distractors.ts` üzerinden üretilir; bu dosyada elle sayı türetilmez.
 *
 *  · "n=1'de n−1 = 0 geçerli çeldirici mi?" → HAYIR, 0 ASLA ÇELDİRİCİ OLMAZ.
 *    Cevap aralığı `SAY_CEVAP_ARALIGI = {min:1, max:20}` olarak daraltıldı.
 *    Üç gerekçe: (a) TANI GÜCÜ YOK — ekranda duran bir elmaya bakıp "sıfır"
 *    diyen çocuk bir sayma hatası yapmıyor, görevi anlamamış oluyor; bunun için
 *    zaten ayrı bir ölçüm var. (b) BEDAVA ELEME — "hiç yok" şıkkı bakar bakmaz
 *    elenir, dört şıklı soruyu üç şıklı yapar. (c) ANLAM EVRENİ DIŞI — bu şablon
 *    hiçbir zaman BOŞ küme sormaz (adet ≥ 1), dolayısıyla 0 sorunun cevap
 *    evreninde yer almaz. Sıfırın hiçliği MAT.1.1.1'de kapsamdadır ama onun
 *    yeri rakam tanıma şablonudur, sayma şablonu değil.
 *    Kararın uygulanışı TEK NOKTADAN: aralık daraltıldığı için hem birincil
 *    çeldiriciler hem yakın-komşu yedeği 0 üretemez.
 *
 *  · "Uzak sayı" çeldiricisi YALNIZCA gerekçeliyse: onluk çerçevede 11–20
 *    arasında `ONLUK_BOZMA` (n−10) kullanılır — "dolu çerçeveyi düşürdüm"
 *    hatası gerçek ve sık. Bunun dışında rastgele uzak sayı (GOREV_ANLASILMADI)
 *    KULLANILMAZ: sayma sorusunda uzak bir sayı, sayan hiçbir çocuğun
 *    üretmeyeceği bir cevaptır; kolay elenir, doğruluk oranını şişirir ve
 *    tanılayıcı bir yakın-komşuyu ekrandan atar. Boş kalan yer, distractors.ts'in
 *    dürüst yön-etiketli `yakinKomsu` yedeğiyle dolar.
 */

import type { Rng } from '../rng';
import {
  celdiricileriSikaCevir,
  sayisalCeldiricilerKesin,
  type HataEtiketi,
  type SayiAraligi,
} from '../distractors';
import {
  ISLEM_ARALIGI,
  NESNE_SPRITELARI,
  alistirmaIhlalleri,
  makeItemId,
  varsayilanIpuclari,
} from '../types';
import type {
  AssetSpec,
  AudioToImageExercise,
  Difficulty,
  Exercise,
  ExerciseGenerator,
  GeneratorParams,
  KazanimKodu,
  NesneSprite,
  Nokta,
  Option,
  SkillId,
  TapCountExercise,
  VisualSpec,
} from '../types';
import { sayNumber, type SpeakSource } from '../../audio/speech';

// ------------------------------------------------------------------- sabitler

export const M_SAY_TEMPLATE_ID = 'M-SAY';

/**
 * Cevap (ve dolayısıyla çeldirici) aralığı: 1–20.
 * Üst uç müfredattan gelir (`ISLEM_ARALIGI.max`), alt uç yukarıdaki "0 çeldirici
 * olmaz" kararından. İkisi de tek yerde; bir daha türetilmez.
 */
export const SAY_CEVAP_ARALIGI: SayiAraligi = { min: 1, max: ISLEM_ARALIGI.max };

/** Sahnedeki nesne kümesi varlığının kimliği. */
export const SAY_SAHNE_ID = 'sahne';
/** K3'te gösterilen yeniden çerçeveleme görselinin kimliği. */
export const SAY_IPUCU_ID = 'ipucu-duzenli';

/**
 * i. nesnenin dokunma hedefi kimliği.
 * SÖZLEŞME: indeks, `nesneKumesi` görselindeki nesne sırasıdır; `dagınık`
 * yerleşimde `konumlar[i]` ile birebir aynı nesnedir. Render katmanı bu adları
 * üretmez, buradan okur — yoksa `hedefIds` ile ekrandaki nesneler eşleşmez.
 */
export function sayNesneId(indeks: number): string {
  return `${SAY_SAHNE_ID}-nesne-${indeks}`;
}

/**
 * 2. aşamanın sesli talimatı.
 * `Prompt` tipinde ikinci evre alanı YOK (types.ts'e dokunmuyoruz), bu yüzden
 * UI katmanı sayım evresi bitince BUNU çalmalıdır.
 * Öneri (paralel ajanlara not): `Prompt`a `evre2Ses?: SpeakSource` eklenirse
 * bu sabit oraya taşınır ve UI'nın şablonu tanıması gerekmez.
 */
export const SAY_EVRE2_SESI: SpeakSource = { kind: 'key', key: 'soru.sayiyi-sec' };

/** Sahne kutusunun en/boy oranı — ızgara hücrelerini kareye yaklaştırmak için. */
const SAHNE_ORANI = 1.6;
/** Nesnelerin sahne kenarına yapışmaması için normalize kenar boşluğu. */
const KENAR_BOSLUGU = 0.07;
/** Hücre içi sarsıntı (hücre boyutunun ± bu kadarı). Ayrımı garantiler. */
const HUCRE_SARSINTISI = 0.15;
/** Izgarada nesne sayısından ne kadar fazla hücre açılacağı (düzensizlik için). */
const HUCRE_BOLLUGU = 1.45;
/**
 * Otomatik yerleşim seçiminde dağınık düzenin üst sınırı — CEVAP MODUNA BAĞLI.
 * 'tapThenPick'te çocuk dokunduğunu İŞARETLİYOR; kayıt tutma yükü ekranda
 * taşındığı için 16 nesne hâlâ sayılabilir ve MAT.1.1.2'nin asıl çalışması
 * (dağınık kümede parça-bütün) tam da bu bantta oluyor.
 * 'pickOnly'de işaret yok: 12'nin üstünde dağınık küme, sayma becerisini değil
 * çalışma belleğini ölçmeye başlar — bu bizim ölçmek istediğimiz şey değil.
 */
const DAGINIK_UST_SINIR: Readonly<Record<SayCevapModu, number>> = {
  tapThenPick: 16,
  pickOnly: 12,
};

// --------------------------------------------------------------------- tipler

/** Nesnelerin sahnedeki dizilişi. `VisualSpec['nesneKumesi'].layout` ile aynı. */
export type SayYerlesim = 'sira' | 'gruplu' | 'onlukCerceve' | 'dagınık';

/**
 * Cevap verme biçimi.
 *  'tapThenPick' — iki aşamalı (dokun-say, sonra rakam seç). Tanı gücü yüksek.
 *  'pickOnly'    — tek aşamalı (yalnız rakam seç). Hızlı, tanı gücü düşük.
 */
export type SayCevapModu = 'tapThenPick' | 'pickOnly';

/** Şık sayısı. 4'ten fazlası 1. sınıf ekranına sığmaz ve dikkati dağıtır. */
export type SaySikSayisi = 2 | 3 | 4;

export interface SayParams extends GeneratorParams {
  /** Sayılacak nesne adedi (1–20). Verilmezse `difficulty`den türetilir. */
  readonly adet?: number;
  /** Yerleşim. Verilmezse adede uygun olanlar arasından tohumla seçilir. */
  readonly layout?: SayYerlesim;
  /** Nesne türü. `tercihEdilenSprite`ı ezer. */
  readonly sprite?: NesneSprite;
  /** Varsayılan 'tapThenPick' — bu şablonun asıl değeri iki aşamalı olmasıdır. */
  readonly responseMode?: SayCevapModu;
  /** Şık sayısı. Verilmezse zorluk ve cihaz modundan türetilir. */
  readonly optionCount?: SaySikSayisi;
}

// ------------------------------------------------------- parametre türetimi

/**
 * Zorluk → nesne adedi aralığı.
 * MAT.1.1.2 aşamalandırması (SAYFA 22): önce 10'DAN AZ, sonra 10 İLE 20 ARASI.
 * 1–2 küçük çokluk (sipsak sayılama sınırına yakın), 3 tek onluk altı,
 * 4–5 onluk üstü çözümleme.
 */
const ADET_ARALIKLARI: Readonly<Record<Difficulty, readonly [number, number]>> = {
  1: [1, 4],
  2: [3, 6],
  3: [6, 10],
  4: [10, 15],
  5: [14, 20],
};

/**
 * Verilen adette PEDAGOJİK OLARAK anlamlı yerleşimler.
 * `layout` parametresi elle verilirse bu süzgeç ATLANIR — çağıran taraf
 * (öğretmen ekranı, test) bilerek sınırın dışına çıkabilsin diye.
 */
function uygunYerlesimler(adet: number, mod: SayCevapModu): readonly SayYerlesim[] {
  const liste: SayYerlesim[] = [];
  // Uzun sıra (7+) satır sonuna sarkar ve sayma kaydı kopar.
  if (adet <= 6) liste.push('sira');
  // Öbekleme 5+n biçimindedir; 4'ün altında öbek yok, 10'un üstünde çerçeve daha iyi.
  if (adet >= 4 && adet <= 10) liste.push('gruplu');
  // Onluk çerçeve 10'dan önce yapı göstermez.
  if (adet >= 10) liste.push('onlukCerceve');
  if (adet <= DAGINIK_UST_SINIR[mod]) liste.push('dagınık');
  return liste;
}

/**
 * Şık sayısı.
 * 2 şık yalnızca AÇIK İSTEK üzerine: %50 tahmin gürültüsü ölçümü değersizleştirir.
 * Akıllı tahtada 3'te tavanlanır — sınıfın arkasından dört rakam kartı okunmuyor
 * ve hedefler küçülüyor (ürün kısıtı #6 ile aynı gerekçe).
 */
function sikSayisiSec(difficulty: Difficulty, mod: GeneratorParams['mod']): SaySikSayisi {
  const temel: SaySikSayisi = difficulty <= 2 ? 3 : 4;
  return mod === 'tahta' && temel > 3 ? 3 : temel;
}

/**
 * Çeldirici üretiminde denenecek hata etiketleri, ÖNCELİK SIRASIYLA.
 * Sıra ÖNEMLİDİR: distractors.ts her etiketin ilk uygun adayını verir, yani
 * listede önce gelen etiket n−1 gibi "değerli" değerleri kapar.
 *
 *  · tapThenPick'te n−1 KARDINALITE etiketini alır: dokunma evresi zaten sayma
 *    kanıtını topladığı için, rakam evresindeki yakın ıska en iyi "son söylenen
 *    sayıyı toplam olarak verememe" ile açıklanır.
 *  · pickOnly'de aynı değer EKSIK_SAYMA'ya gider: orada sayma ile kardinaliteyi
 *    ayıracak kanıt YOKTUR, dolayısıyla daha temel (ve daha sık) olan sayma
 *    hatası atanır. Aynı sayıya modun tanıyabildiğinden fazla anlam yüklemiyoruz.
 */
function hataOncelikleri(
  adet: number,
  yerlesim: SayYerlesim,
  mod: SayCevapModu,
): readonly HataEtiketi[] {
  // "Dolu onluğu düşürme" ancak ekranda GERÇEKTEN bir onluk yapısı varsa anlamlı.
  const onlukGorunur = yerlesim === 'onlukCerceve' && adet >= 11;
  const liste: HataEtiketi[] = [];

  if (mod === 'tapThenPick') {
    liste.push('KARDINALITE', 'FAZLA_SAYMA');
    if (onlukGorunur) liste.push('ONLUK_BOZMA');
    liste.push('EKSIK_SAYMA');
  } else {
    liste.push('EKSIK_SAYMA', 'FAZLA_SAYMA');
    if (onlukGorunur) liste.push('ONLUK_BOZMA');
    liste.push('KARDINALITE');
  }
  // Kalan boşluk distractors.ts'in yakinKomsu yedeğine bırakılır (yön etiketli,
  // birincil:false). Uydurma uzak sayı EKLENMEZ — gerekçe dosya başlığında.
  return liste;
}

/** Maddenin yokladığı beceri düğümleri — parametrelerden türetilir. */
function skillIdleri(adet: number, yerlesim: SayYerlesim, mod: SayCevapModu): SkillId[] {
  const idler: SkillId[] = [];
  // Dokunma evresi = birebir eşleme; onsuz madde doğrudan çokluk-rakam eşlemesidir.
  if (mod === 'tapThenPick') idler.push('mat.sayma.birebir-esleme');
  else idler.push('mat.sayi.miktar-rakam-eslestirme');
  // Rakam evresi her iki modda da kardinaliteyi yokluyor.
  idler.push('mat.sayma.kardinalite');
  if (yerlesim === 'dagınık' && adet <= 10) idler.push('mat.sayma.dagilmis-10');
  if (adet >= 11) idler.push('mat.sayma.yirmiye-kadar');
  if (yerlesim === 'onlukCerceve') idler.push('mat.sayi.onluk-cerceve');
  return idler;
}

/** Kaba süre tahmini (saniye). Oturum planlayıcısı 8 maddeyi buna göre dizer. */
function tahminiSure(adet: number, mod: SayCevapModu): number {
  const ham = mod === 'tapThenPick' ? 8 + 1.1 * adet : 6 + 0.6 * adet;
  return Math.min(45, Math.max(8, Math.round(ham)));
}

// ------------------------------------------------------- dağınık yerleşim

/**
 * DAĞINIK KONUMLAR — sarsıntılı ızgara (jittered grid).
 *
 * NEDEN reddetme örneklemesi (rejection sampling) değil: o yöntem sıkışık
 * durumlarda döngüye girer, deneme sayısına göre farklı sonuç verir ve en kötü
 * durumda BAŞARISIZ olur. Bir çocuk sorusunun üretimi "bazen olmayabilir"
 * olamaz. Sarsıntılı ızgara HER ZAMAN başarılıdır ve minimum ayrımı MATEMATİKSEL
 * OLARAK garanti eder: iki nokta en fazla hücre boyutunun %15'i kadar kayabildiği
 * için komşu hücrelerdeki iki nesnenin merkez arası uzaklığı asla
 * hücre × (1 − 2×0.15) = hücre × 0.70 altına inmez. Yani nesneler çakışmaz,
 * dağınık ama SAYILABİLİR kalır.
 *
 * Hücreler nesne sayısından bol açılır (×1.45) ve aralarından tohumla seçilir;
 * boş kalan hücreler düzeni ızgara görünümünden kurtarır.
 *
 * Dönen sıra satır-öncelikli (soldan sağa, yukarıdan aşağıya) sabittir: K3'ün
 * "sırayla sayalım" animasyonu ve `hedefIds` eşlemesi bu sıraya yaslanır.
 * Konumlar 3 basamağa yuvarlanır — kayan nokta gürültüsü olmadan aynı tohum her
 * cihazda BİREBİR aynı sahneyi versin.
 */
export function dagitilmisKonumlar(adet: number, rng: Rng): readonly Nokta[] {
  if (!Number.isInteger(adet) || adet < 0) {
    throw new Error(`dagitilmisKonumlar: adet negatif olmayan tam sayı olmalı (${adet}).`);
  }
  if (adet === 0) return [];

  const hedefHucre = Math.max(adet, Math.ceil(adet * HUCRE_BOLLUGU));
  const sutun = Math.max(1, Math.round(Math.sqrt(hedefHucre * SAHNE_ORANI)));
  const satir = Math.max(1, Math.ceil(hedefHucre / sutun));

  const tumHucreler = Array.from({ length: satir * sutun }, (_, i) => i);
  const secilen = rng.sample(tumHucreler, adet).sort((a, b) => a - b);

  const kullanilir = 1 - 2 * KENAR_BOSLUGU;
  const hucreGenislik = kullanilir / sutun;
  const hucreYukseklik = kullanilir / satir;

  return secilen.map((hucre) => {
    const r = Math.floor(hucre / sutun);
    const k = hucre % sutun;
    const merkezX = KENAR_BOSLUGU + (k + 0.5) * hucreGenislik;
    const merkezY = KENAR_BOSLUGU + (r + 0.5) * hucreYukseklik;
    const x = merkezX + (rng.next() * 2 - 1) * HUCRE_SARSINTISI * hucreGenislik;
    const y = merkezY + (rng.next() * 2 - 1) * HUCRE_SARSINTISI * hucreYukseklik;
    return { x: yuvarla(x), y: yuvarla(y) };
  });
}

function yuvarla(v: number): number {
  const k = Math.round(v * 1000) / 1000;
  return k < 0 ? 0 : k > 1 ? 1 : k;
}

// ------------------------------------------------------------------ görseller

/** Sorunun sahnesi. `konumlar` YALNIZ dağınık yerleşimde doldurulur. */
function sahneGorseli(
  sprite: NesneSprite,
  adet: number,
  yerlesim: SayYerlesim,
  rng: Rng,
): VisualSpec {
  if (yerlesim === 'dagınık') {
    return {
      type: 'nesneKumesi',
      sprite,
      adet,
      layout: 'dagınık',
      konumlar: dagitilmisKonumlar(adet, rng),
    };
  }
  // Diğer yerleşimlerde diziliş render katmanının işidir: 'sira' soldan sağa,
  // 'gruplu' 5+n öbekleri (sipsak sayılamayı destekler), 'onlukCerceve' 10'luk gözler.
  // NOT: nesnelere RENK ATANMAZ. Farklı renkler "renge göre grupla" gibi başka
  // bir görev sezdirir; ayrıca elmanın kendi rengi zaten anlam taşır.
  return { type: 'nesneKumesi', sprite, adet, layout: yerlesim };
}

/**
 * K3 ("birlikte yapalım") görseli — AYNI çokluğun DÜZENLİ temsili.
 * Bu yeniden çerçeveleme MAT.1.1.1(b)'nin "farklı temsiller" bileşenidir ve
 * dağınık maddede yardımın asıl gücüdür: zorluk çoklukta değil düzensizlikteydi.
 */
function k3Gorseli(sprite: NesneSprite, adet: number, yerlesim: SayYerlesim): VisualSpec {
  if (yerlesim === 'onlukCerceve') {
    // Sahne zaten çerçeveli: bu kez NESNELERİ değil YAPIYI gösteriyoruz
    // (dolu bir onluk + kalan birlikler). Kavram adı söylenmez, yalnız görülür.
    return {
      type: 'onlukCerceve',
      gruplar: adet <= 10 ? [adet] : [10, adet - 10],
    };
  }
  // Küçük çoklukta sıra yeter; büyüğünde çerçeve yapıyı görünür kılar.
  // Sprite KORUNUR — çocuk "aynı elmalar" olduğunu görmezse yeniden
  // çerçeveleme yeni bir soru gibi algılanır.
  return {
    type: 'nesneKumesi',
    sprite,
    adet,
    layout: adet <= 5 ? 'sira' : 'onlukCerceve',
  };
}

// --------------------------------------------------------------------- şıklar

/**
 * Rakam şıkkına kendi sesini ekler: çocuk şıkka dokunmadan ÖNCE dinleyebilir.
 * Okuma bilmeyen çocuk için rakam kartı sessizse yalnız görsel tanımaya kalır;
 * sesle birlikte "on üç" sözcüğü ile rakam eşleşir (MAT.1.1.1(c)'nin okuma yanı).
 */
function sesliSik(sik: Option): Option {
  if (sik.deger.tur !== 'sayi') return sik;
  const ses = sayNumber(sik.deger.sayi);
  if (sik.correct === true) {
    return { id: sik.id, deger: sik.deger, correct: true, ses };
  }
  const etiket = sik.diagnosticTag;
  if (etiket == null) {
    throw new Error(`M-SAY: yanlış şıkta tanı etiketi yok (${sik.id}).`);
  }
  return { id: sik.id, deger: sik.deger, diagnosticTag: etiket, ses };
}

/**
 * K2'de soluklaştırılacak şık: doğrudan EN UZAK yanlış şık.
 * NEDEN en uzak: yakın komşular (n±1) tanının kalbidir — onları elemek soruyu
 * bilgi veren bir ayrımdan mahrum bırakır. En uzak şık zaten en az bilgi taşıyan
 * şıktır; onu elemek yardımı gerçekten kolaylaştırır ama ölçümü öldürmez.
 * Eşitlikte büyük değer seçilir (deterministik olsun diye).
 */
function elenecekSikId(dogru: number, siklar: readonly Option[]): string[] {
  const yanlislar = siklar.filter(
    (o) => o.correct !== true && o.deger.tur === 'sayi',
  );
  if (yanlislar.length === 0) return [];
  let enUzak = yanlislar[0];
  for (const o of yanlislar) {
    const a = o.deger.tur === 'sayi' ? Math.abs(o.deger.sayi - dogru) : -1;
    const b = enUzak.deger.tur === 'sayi' ? Math.abs(enUzak.deger.sayi - dogru) : -1;
    const oDeger = o.deger.tur === 'sayi' ? o.deger.sayi : -1;
    const enDeger = enUzak.deger.tur === 'sayi' ? enUzak.deger.sayi : -1;
    if (a > b || (a === b && oDeger > enDeger)) enUzak = o;
  }
  return [enUzak.id];
}

// -------------------------------------------------------------------- üretim

/**
 * M-SAY maddesi üretir.
 *
 * SAFTIR: tüm rastgelelik `rng`den gelir (`Math.random` yasak). Çağıran taraf
 * `createRng(params.seed)` geçirmelidir; aynı (tohum, parametre) ikilisi her
 * cihazda BİREBİR aynı maddeyi verir.
 */
export function uretSay(params: SayParams, rng: Rng): Exercise {
  const { seed, difficulty } = params;

  // --- 1) Parametreleri belirle. Her alt karar KENDİ akışından çeker; birini
  //     değiştirmek diğerlerinin çıktısını kaydırmasın (bkz. Rng.fork gerekçesi).
  //
  //     FORK ETİKETLERİ ÇÖZÜLMÜŞ PARAMETRELERİ İÇERİR. Neden: `fork` alt tohumu
  //     yalnız (kök tohum + etiket)ten türüyor. Etiket sabit olsaydı, AYNI tohumla
  //     üretilen farklı maddeler (başka zorluk, başka mod) birebir aynı alt akışı
  //     kullanır; şıkların karışım sırası ve nesne konumları aralarında
  //     KORELE olurdu — 2000 maddelik taramada doğru şıkkın konumu bu yüzden
  //     yalnız 200 bağımsız çekilişe düşüyordu. Parametreyi etikete katmak
  //     determinizmi bozmaz (aynı girdi → aynı etiket → aynı akış), yalnız
  //     maddeler arasındaki bağı koparır.
  const [altSinir, ustSinir] = ADET_ARALIKLARI[difficulty];
  const adet = params.adet ?? rng.fork(`adet|d${difficulty}`).int(altSinir, ustSinir);

  if (!Number.isInteger(adet) || adet < 1 || adet > ISLEM_ARALIGI.max) {
    throw new Error(
      `M-SAY: adet 1–${ISLEM_ARALIGI.max} aralığında tam sayı olmalı (${adet}). ` +
        'Nesne sayma tavanı müfredat gereği 20; ritmik saymanın 100 tavanı buraya geçmez.',
    );
  }

  // Cevap modu yerleşimden ÖNCE belirlenir: dokunarak işaretleme, dağınık
  // düzenin sayılabilir kaldığı üst sınırı değiştiriyor (bkz. DAGINIK_UST_SINIR).
  const cevapModu: SayCevapModu = params.responseMode ?? 'tapThenPick';
  const yerlesim: SayYerlesim =
    params.layout ?? rng.fork(`yerlesim|n${adet}|${cevapModu}`).pick(uygunYerlesimler(adet, cevapModu));
  const sprite: NesneSprite =
    params.sprite ??
    params.tercihEdilenSprite ??
    rng.fork(`sprite|n${adet}|d${difficulty}`).pick(NESNE_SPRITELARI);
  const sikSayisi: SaySikSayisi =
    params.optionCount ?? sikSayisiSec(difficulty, params.mod);

  // --- 2) Doğru cevap ÜRETİM ANINDA hesaplanır ve maddeye gömülür.
  const dogruCevap = adet;

  // --- 3) Çeldiriciler: tanılayıcı, tümü distractors.ts'ten.
  const celdiriciler = sayisalCeldiricilerKesin(
    dogruCevap,
    hataOncelikleri(adet, yerlesim, cevapModu),
    SAY_CEVAP_ARALIGI,
    sikSayisi - 1,
    rng.fork(`celdirici|n${adet}|${cevapModu}|${sikSayisi}`),
  );
  const siklar = celdiricileriSikaCevir(
    dogruCevap,
    celdiriciler,
    rng.fork(`sik-sira|n${adet}|${cevapModu}|${sikSayisi}`),
  ).map(sesliSik);
  const dogruSikId = `sik-d-${dogruCevap}`;

  // --- 4) Görseller. `prompt.gorsel` ile `assets[0].gorsel` AYNI NESNEDİR
  //     (referans eşitliği): iki kez çizmemek için render katmanı `===` ile
  //     ayıklayabilir.
  const sahne = sahneGorseli(sprite, adet, yerlesim, rng.fork(`sahne|n${adet}|${yerlesim}`));
  const ipucuGorseli = k3Gorseli(sprite, adet, yerlesim);
  const assets: readonly AssetSpec[] = [
    {
      id: SAY_SAHNE_ID,
      rol: 'sahne',
      gorsel: sahne,
      // Dokunulacaksa erişim bölgesi zorunlu (ürün kısıtı #6): 1. sınıf çocuğu
      // akıllı tahtanın üst kısmına uzanamıyor.
      erisimBolgesi: cevapModu === 'tapThenPick' ? 'alt65' : 'serbest',
    },
    { id: SAY_IPUCU_ID, rol: 'ipucu', gorsel: ipucuGorseli },
  ];

  // --- 5) Talimat. Okuma yükü 0: metin YOK, her şey sesle.
  //     Dizideki iki klip de TAM CÜMLEDİR (sözcükten cümle kurulmuyor);
  //     aralarındaki uzun boşluk prozodiyi korur.
  const talimat: SpeakSource =
    cevapModu === 'tapThenPick'
      ? { kind: 'sequence', keys: ['soru.dokunarak-say', 'soru.kac-tane'], gapMs: 600 }
      : { kind: 'key', key: 'soru.kac-tane' };

  // --- 6) Yardım. K2 stratejisi "birlikte sayalım" — bu şablonda eleme değil
  //     SAYMA YÖNTEMİ öğretilir; eleme yalnız yanında gider.
  const hints = varsayilanIpuclari({
    talimatSesi: talimat,
    k2Ses: { kind: 'key', key: 'yardim.k2-birlikte-sayalim' },
    eleOptionIds: elenecekSikId(dogruCevap, siklar),
    vurgulaIds: [SAY_SAHNE_ID],
    k3Gorsel: ipucuGorseli,
  });

  const ortak = {
    // İMZA, MADDENİN TÜM DEĞİŞKEN ALANLARINI KAPSAR.
    // `difficulty` de imzadadır ve bu şart: zorluk bantları KASITLI OLARAK
    // örtüşüyor (d1 = 1–4, d2 = 3–6), dolayısıyla aynı tohum iki farklı zorlukta
    // aynı adedi tutturabilir. Görüntü aynı olsa da üretilen nesneler farklıdır
    // (`difficulty` alanı farklı). İmzada olmasaydı iki FARKLI maddenin aynı
    // kimliği olurdu; kimlikle kayıt getiren ilerleme katmanı hangisini
    // yüklediğini bilemezdi. Tohum + bu imza = maddenin tamamı.
    itemId: makeItemId(
      M_SAY_TEMPLATE_ID,
      seed,
      `n${adet}|y${yerlesim}|s${sprite}|m${cevapModu}|o${sikSayisi}|d${difficulty}`,
    ),
    templateId: M_SAY_TEMPLATE_ID,
    skillIds: skillIdleri(adet, yerlesim, cevapModu),
    kazanimKodlari: ['MAT.1.1.1', 'MAT.1.1.2'] as readonly KazanimKodu[],
    readingLoad: 0 as const,
    difficulty,
    estimatedSec: tahminiSure(adet, cevapModu),
    prompt: {
      ses: talimat,
      tekrarSes: talimat,
      gorsel: sahne,
    },
    hints,
    assets,
    seed,
  };

  const alistirma: Exercise =
    cevapModu === 'tapThenPick'
      ? ({
          ...ortak,
          kind: 'TAP_COUNT',
          options: siklar,
          validation: {
            mod: 'sayim',
            beklenenAdet: adet,
            hedefIds: Array.from({ length: adet }, (_, i) => sayNesneId(i)),
            // TEK DOKUNUŞ SAYILIR: aynı nesneye ikinci kez dokunmak sayacı
            // ilerletmez. BIREBIR_ESLESME hatası ancak böyle GÖRÜNÜR olur;
            // her dokunuş sayılsaydı çocuk farkında olmadan doğruyu bulurdu.
            herNesneBirKez: true,
            cevapSecimi: 'secenek',
            dogruOptionId: dogruSikId,
          },
        } satisfies TapCountExercise)
      : ({
          ...ortak,
          kind: 'AUDIO_TO_IMAGE',
          options: siklar,
          validation: { mod: 'tekSecim', dogruOptionId: dogruSikId },
        } satisfies AudioToImageExercise);

  // Geliştirme modunda her madde ürün kısıtlarından geçirilir. Üretimde
  // çalışmaz (types.ts'in sözleşmesi: jeneratörler üretim yolunda doğrulama
  // yapmaz) ama bir şablon hatası ilk saniyede görünsün istiyoruz.
  if (import.meta.env?.DEV) {
    const ihlaller = alistirmaIhlalleri(alistirma);
    if (ihlaller.length > 0) {
      throw new Error(`M-SAY ürün kısıtı ihlali: ${ihlaller.join(' | ')}`);
    }
  }

  return alistirma;
}

/** Şablonun müfredat beyanı — planlayıcı kapsamı buradan okur. */
export const saySablonu: ExerciseGenerator<SayParams> = {
  templateId: M_SAY_TEMPLATE_ID,
  // Şablon iki mod üretebiliyor; beyan edilen tür ASIL modudur (iki aşamalı).
  // 'pickOnly' AUDIO_TO_IMAGE döndürür; planlayıcı `kind`i tür filtresi değil
  // yetenek etiketi olarak kullanmalı.
  kind: 'TAP_COUNT',
  karsilananKazanimlar: ['MAT.1.1.1', 'MAT.1.1.2'],
  karsilananSkillIds: [
    'mat.sayma.birebir-esleme',
    'mat.sayma.kardinalite',
    'mat.sayma.dagilmis-10',
    'mat.sayma.yirmiye-kadar',
    'mat.sayi.miktar-rakam-eslestirme',
    'mat.sayi.onluk-cerceve',
  ],
  readingLoad: 0,
  zorlukAraligi: [1, 5],
  // BIREBIR_ESLESME bir ŞIKTAN gelmez; dokunma evresinden `sayTanisi` ile
  // çıkarılır. Yine de bu şablonun ayırt edebildiği bir yanılgıdır.
  uretebildigiHatalar: [
    'BIREBIR_ESLESME',
    'KARDINALITE',
    'FAZLA_SAYMA',
    'EKSIK_SAYMA',
    'ONLUK_BOZMA',
  ],
  uret: uretSay,
};

// ------------------------------------------------------------ iki aşamalı tanı

/**
 * Çocuğun bu maddeye verdiği ham tepki.
 * Dokunma alanları `null` ise sayım evresi YOKTUR ('pickOnly' modu).
 */
export interface SayCevabi {
  /** Kaç FARKLI nesneye dokunuldu. */
  readonly dokunulanBenzersizAdet: number | null;
  /** Toplam dokunuş (aynı nesneye tekrar dokunuşlar DÂHİL). */
  readonly toplamDokunma: number | null;
  /** Seçilen rakam; `null` = cevap verilmedi (süre doldu, ekran değişti). */
  readonly secilenSayi: number | null;
  /** Seçilen şıkkın taşıdığı tanı etiketi (varsa) — pickOnly'de tek kanıt budur. */
  readonly secilenSikEtiketi?: HataEtiketi | null;
}

export interface SayTaniSonucu {
  /** Madde doğru sayılır mı. YALNIZ seçilen rakama bakar (süreç notu ceza değildir). */
  readonly dogru: boolean;
  readonly birincilEtiket: HataEtiketi | null;
  readonly ikincilEtiket: HataEtiketi | null;
  /** Öğretmen raporuna yazılacak Türkçe gerekçe. */
  readonly aciklama: string;
}

/**
 * İKİ AŞAMALI TANI — bu şablonun varlık sebebi.
 *
 * Şıkların `diagnosticTag` alanı tek başına yetmez: aynı yanlış rakam, dokunma
 * evresi sağlamken KARDINALITE, bozukken BIREBIR_ESLESME anlamına gelir. Bu
 * fonksiyon iki evrenin kanıtını birleştirir ve şıkkın statik etiketini EZER.
 * Oturum katmanı yanlış cevabı kaydederken bunu çağırmalıdır.
 *
 * DİKKAT: `dogru` alanı yalnızca seçilen rakama bakar. Dokunma süreci bozukken
 * doğru rakamı seçen çocuğun cevabı DOĞRUDUR (ürün kısıtı #3: ceza yok); süreç
 * bulgusu ayrı bir bayrak olarak taşınır ve ustalık kararında kullanılır.
 */
export function sayTanisi(beklenenAdet: number, cevap: SayCevabi): SayTaniSonucu {
  if (!Number.isInteger(beklenenAdet) || beklenenAdet < 0) {
    throw new Error(`sayTanisi: beklenenAdet geçersiz (${beklenenAdet}).`);
  }

  const { secilenSayi, dokunulanBenzersizAdet, toplamDokunma } = cevap;

  if (secilenSayi == null) {
    return {
      dogru: false,
      birincilEtiket: null,
      ikincilEtiket: null,
      aciklama: 'Cevap seçilmedi; tanı çıkarılmadı.',
    };
  }

  const dogru = secilenSayi === beklenenAdet;
  const sayimEvresiVar = dokunulanBenzersizAdet != null && toplamDokunma != null;

  // --- Tek aşamalı (pickOnly): sayma ile kardinaliteyi ayıracak kanıt yok.
  if (!sayimEvresiVar) {
    if (dogru) {
      return {
        dogru: true,
        birincilEtiket: null,
        ikincilEtiket: null,
        aciklama: 'Çokluğu doğru rakamla eşledi.',
      };
    }
    const etiket =
      cevap.secilenSikEtiketi ??
      (secilenSayi > beklenenAdet ? 'FAZLA_SAYMA' : 'EKSIK_SAYMA');
    return {
      dogru: false,
      birincilEtiket: etiket,
      ikincilEtiket: null,
      aciklama:
        `${beklenenAdet} nesne için ${secilenSayi} seçti. Dokunma evresi olmadığı ` +
        'için sayma hatası ile kardinalite ayrıştırılamıyor; iki aşamalı bir madde önerilir.',
    };
  }

  const benzersiz = dokunulanBenzersizAdet as number;
  const toplam = toplamDokunma as number;
  // Sağlam sayım: her nesneye TAM BİR kez dokunulmuş.
  const sayimSaglam = benzersiz === beklenenAdet && toplam === beklenenAdet;

  if (sayimSaglam && dogru) {
    return {
      dogru: true,
      birincilEtiket: null,
      ikincilEtiket: null,
      aciklama: 'Her nesneye bir kez dokundu ve son sayıyı toplam olarak verdi.',
    };
  }

  // --- Sayım sağlam, rakam yanlış → KARDİNALİTE. Bu, şablonun en net tanısıdır:
  //     çocuk saymayı biliyor ama "kaç tane vardı" sorusunun cevabını üretemiyor.
  if (sayimSaglam) {
    return {
      dogru: false,
      birincilEtiket: 'KARDINALITE',
      ikincilEtiket: null,
      aciklama:
        `Nesnelere doğru dokundu (${benzersiz}) ama ${secilenSayi} rakamını seçti. ` +
        'Son söylenen sayının toplamı verdiği kavranmamış.',
    };
  }

  // --- Sayım bozuk → BİREBİR EŞLEME. İkincil etiket kanıta göre değişir.
  let ikincil: HataEtiketi | null = null;
  let nedenNotu: string;
  if (!dogru && secilenSayi !== benzersiz) {
    // Ne nesne sayısıyla ne kendi dokunuşuyla uyuşuyor: kardinalite de şüpheli.
    ikincil = 'KARDINALITE';
    nedenNotu = 'Seçtiği rakam kendi dokunuş sayısıyla da uyuşmuyor.';
  } else if (toplam > benzersiz) {
    ikincil = 'FAZLA_SAYMA';
    nedenNotu = `Aynı nesneye birden çok kez dokundu (${toplam} dokunuş, ${benzersiz} nesne).`;
  } else if (benzersiz < beklenenAdet) {
    ikincil = 'EKSIK_SAYMA';
    nedenNotu = `${beklenenAdet} nesneden ${benzersiz} tanesine dokundu; nesne atladı.`;
  } else {
    nedenNotu = 'Dokunma sayısı beklenenden fazla.';
  }

  const kardinaliteNotu =
    secilenSayi === benzersiz
      ? ' Kendi sayımının son sayısını doğru bildirdi — kardinalite sağlam, sorun eşlemede.'
      : '';

  return {
    dogru,
    birincilEtiket: 'BIREBIR_ESLESME',
    ikincilEtiket: ikincil,
    aciklama:
      (dogru
        ? 'Doğru rakamı seçti ama sayım süreci sağlam değil. '
        : 'Sayım süreci bozuk. ') +
      nedenNotu +
      kardinaliteNotu,
  };
}
