/**
 * M-KARSILASTIR — İKİ NİCELİĞİ TERİMLERLE KARŞILAŞTIRMA
 * ============================================================================
 *
 * KAZANIM: MAT.1.1.4 — "İki niceliğin büyüklüğünü 'çok', 'daha çok', 'az',
 * 'daha az' veya 'eşit' terimleriyle karşılaştırabilme."
 *
 * Süreç bileşeni (a): terimlerle İFADE ETME. Bu şablon (a)'yı ölçer: çocuk
 * cevabı bir TERİMLE (hangi küme daha çok / daha az / eşit mi) verir.
 *
 * SEMBOL YOK. `<`, `>`, `=` 1. sınıfta öğretilmiyor (docs/mufredat-kisitlari.md
 * §2 Karşılaştırma; kazanimlar.json uygulama notu). Cevap "daha çok olan
 * hangisi" biçimindedir, sembol seçme değildir. "Eşit" şıkkı da SEMBOL DEĞİL,
 * TERİM kartıdır (`OptionDeger.tur === 'terim'`): render katmanı bunu dengede
 * bir terazi / eş uzunlukta iki sıra olarak çizmeli, ASLA "=" işaretiyle değil.
 *
 * ÖLÇTÜĞÜ MİKRO DÜĞÜMLER (src/content/skills.json):
 *   · mat.karsilastirma.sezgisel        — her maddede (sezgiye dayalı karşılaştırma)
 *   · mat.karsilastirma.birebir-esleme  — fark ≤ 2 ya da eşit olduğunda (sezgi
 *                                          yetmez, birebir eşleme gerekir)
 *   · mat.karsilastirma.on-referansi    — bir taraf tam 10 ve onluk çerçevedeyken
 * Program notu: "10 SAYISI REFERANS ALINIR: 10'dan az, 10'dan çok ve 10'a eşit
 * cevabını gerektiren etkinlikler yapılır" (SAYFA 22) → `onReferansi` koşulu.
 * Program notu: "önce SEZGİYE, sonra BİRE BİR EŞLEMEYE dayalı karşılaştırma"
 * (SAYFA 22) → zorluk 1-2 büyük farklı/sezgisel, 3-5 küçük farklı/eşlemeli.
 *
 * MÜFREDAT SINIRI: adetler 1..20 (MAT.1.1.1 tavanı). Ritmik sayma tavanı (100)
 * BURADA GEÇERSİZ; nesne sayma 20'yi aşamaz. 0 kullanılmaz (boş küme
 * karşılaştırması bu kazanımda geçmiyor ve görsel olarak da anlamsız).
 * Karşılaştırılan nicelik sayısı DAİMA İKİ'dir (kazanimlar.json uygulama notu),
 * bu yüzden `secenekSayisi` 4 olamaz — 4 istenirse 3'e kelepçelenir.
 *
 * ----------------------------------------------------------------------------
 * BOYUT ÇELİŞTİRME — bu şablonun VAR OLMA NEDENİ
 * ----------------------------------------------------------------------------
 * BUYUKLUK_MIKTAR ("büyük nesneler = daha çok") bu yaşın en yaygın
 * yanılgısıdır. Eğer her maddede büyük küme aynı zamanda ÇOK küme olsaydı,
 * uygulama bu yanılgıyı ne ölçer ne düzeltir — PEKİŞTİRİRDİ. Bu yüzden üç
 * sunum koşulu tanımlıdır ve tohumla karışık dağıtılır:
 *
 *   'celisen' (varsayılan ~%40) : AZ olan küme İRİ nesnelerden (araba/balon/top),
 *                                 ÇOK olan küme UFAK nesnelerden (yıldız/çiçek/
 *                                 kelebek) oluşur. Tanılayıcı madde budur.
 *   'uyumlu'  (~%20)            : İRİ nesneler ÇOK olan tarafta. KONTROL koşulu.
 *                                 Olmazsa çocuk sayı saymadan "küçük olanı seç"
 *                                 kestirmesini öğrenir ve ölçüm çöker.
 *   'notr'    (kalan ~%40)      : İki taraf aynı boyut sınıfından. Yarısında
 *                                 AYNI sprite, yarısında aynı sınıftan FARKLI
 *                                 sprite — böylece "spritelar farklıysa çelişki
 *                                 vardır" kestirmesi de kapanır.
 *
 * İKİNCİ ÇELİŞTİRME BOYUTU — KAPLANAN ALAN. Dağınık duran 3 nesne, sıkışık
 * duran 5 nesneden geniş yer kaplar (Piaget'nin korunum düzeneği). `alanKosulu`
 * aynı üç değeri alır ve BAĞIMSIZ bir rastgele akıştan çekilir; 'celisen'
 * durumda AZ küme geniş yayılımlı `dagınık`, ÇOK küme sıkışık `sira` olur.
 * 'notr' durumda İKİ TARAF da aynı düzendedir (ikisi de dağınık ya da ikisi de
 * sıralı) — yoksa "dağınık olan azdır" kestirmesi doğar.
 *
 * BİLİNEN EKSİK: `VisualSpec` içindeki `nesneKumesi` dalında `olcek` alanı YOK
 * (yalnız `sekil` dalında var). Nesne ölçeğini bu yüzden SPRITE BOYUT SINIFIYLA
 * ifade ediyoruz (3 araba ↔ 5 kelebek). types.ts'e `olcek?: number` eklenirse
 * aynı sprite'ın büyük/küçük hâliyle çalışılabilir; bu, kimlik değişkenini de
 * sabitlediği için daha temiz bir kontrol olur. types.ts BU GÖREVİN KAPSAMINDA
 * DEĞİL, dokunulmadı — öneri olarak bildirildi.
 *
 * ----------------------------------------------------------------------------
 * 'esitMi' DENGESİ — "hep evet" örüntüsü nasıl kırılıyor
 * ----------------------------------------------------------------------------
 * Yes/no soruda tek risk uzun vadeli oran değil, ÖĞRENİLEBİLİR ÖRÜNTÜdür.
 * İki katmanlı çözüm:
 *  1) Bağımsız akış: eşitlik kararı `rng.fork('esitlik')` akışından çekilir.
 *     Aynı akıştan sprite/düzen de çekilseydi eşitlik kararı görsel seçimlerle
 *     KORELE olurdu ("araba varsa eşittir" gibi öğrenilebilir bir ipucu).
 *  2) Blok dengelemesi: planlayıcı `oturumIndeksi` (+`oturumTohumu`) verirse
 *     4'lük bloklarda TAM 2 eşit / 2 eşit değil üretilir, blok içi SIRA
 *     tohumdan türeyen bir karıştırmayla belirlenir. Katı almaşık (evet-hayır-
 *     evet-hayır) KULLANILMAZ; o da ezberlenebilir bir örüntüdür.
 * Oturum bilgisi verilmezse p=0.5 Bernoulli'ye düşülür (200 tohumluk doğrulama
 * bunun ~%50 çıktığını gösteriyor).
 * 'hangisiCok'/'hangisiAz' maddelerinde de eşit çıkabilir (kazanım "eşit"
 * terimini içeriyor) ama olasılık ~%25'tir; orada "hep eşit" riski yoktur.
 * KRİTİK: "eşit" şıkkı YA HER ZAMAN vardır (secenekSayisi 3) YA HİÇ yoktur
 * (secenekSayisi 2). Yalnız cevap eşit olduğunda eklenseydi varlığı cevabı
 * ele verirdi.
 *
 * ----------------------------------------------------------------------------
 * ÇELDİRİCİ ETİKETLERİ (ürün kısıtı #4: her yanlış şık tanılayıcıdır)
 * ----------------------------------------------------------------------------
 *  Yanlış KÜME kartı:
 *    çelişki (boyut ya da alan) varsa      → BUYUKLUK_MIKTAR
 *    kazanan küme 'gruplu' sunulduysa      → TEK_KUMEYI_ALMA (tek grubu saydı)
 *    çelişkisiz, fark ≤ 2                  → BIREBIR_ESLESME (eşlemede kaydı)
 *    çelişkisiz, fark ≥ 3                  → KARDINALITE (saydı ama sayıyı
 *                                             karşılaştırmaya çeviremedi)
 *  NOT: GOREV_ANLASILMADI bilerek KULLANILMADI. O etiket misconceptions.json'da
 *  `skorlamaYokSay:true` taşıyor; çelişkisiz (kontrol) maddelerin hatalarını
 *  skorlama dışı bırakmak, çelişen ↔ çelişkisiz karşıtlığını — yani bu şablonun
 *  ölçtüğü ASIL şeyi — ölçülemez hâle getirirdi.
 *  Yanlış "eşit" kartı:  fark 1 → BIREBIR_ESLESME (eşlemede kaydı, eşit sandı)
 *                        fark ≥2 → KARDINALITE
 *  Eşit maddede yanlış küme kartı: çelişkinin kayırdığı taraf BUYUKLUK_MIKTAR,
 *                        diğeri BIREBIR_ESLESME.
 * Yanlış küme kartının DEĞERİ distractors.ts'ten türetilir: BUYUKLUK_MIKTAR
 * (`kumeler` bağlamı) ve TEK_KUMEYI_ALMA (`a`/`b` bağlamı) tam olarak "öteki
 * küme"yi üretir; dönen değer sahnedeki kümeyle eşleşmezse jeneratör FIRLATIR.
 * KARDINALITE / BIREBIR_ESLESME dallarında değer kütüphaneden alınamaz (aday
 * havuzu dogru±1, ±2'dir; sahnedeki kümeyle ilgisi yoktur) — o dallarda değer
 * doğrudan sahneden gelir.
 *
 * OKUMA YÜKÜ 0: talimat yalnız sesle (`soru.hangisi-cok` / `soru.hangisi-az` /
 * `soru.esit-mi`). `prompt.metin` HİÇ doldurulmaz.
 * GEREKEN YENİ SESLER (yok, eklenmedi, tr.json'a dokunulmadı): şık başına ses
 * için `terim.esit` ("eşit") ve `terim.esit-degil` ("eşit değil") gerekir.
 * Bunlar olmadığı için HİÇBİR şıkka `ses` verilmedi: yalnız bir kısmına ses
 * vermek, sesi olan şıkka dikkat kayması yaratır ve ölçümü bozar.
 */

import type { SpeakSource } from '../../audio/speech';
import {
  HATA_ETIKETLERI,
  sayisalCeldiricilerKesin,
  type HataEtiketi,
  type SayiAraligi,
} from '../distractors';
import { createRng, hash32, type Rng } from '../rng';
import {
  makeItemId,
  varsayilanIpuclari,
  NESNE_SPRITELARI,
  type AssetSpec,
  type AudioToImageExercise,
  type Difficulty,
  type ExerciseGenerator,
  type GeneratorParams,
  type KazanimKodu,
  type NesneSprite,
  type Nokta,
  type Option,
  type SkillId,
  type VisualSpec,
} from '../types';

// ---------------------------------------------------------------- sabitler

/** skills.json'daki `exerciseTemplates` girdisiyle BİREBİR aynı olmalı. */
export const KARSILASTIR_TEMPLATE_ID = 'M-KARSILASTIR';

/** Nesne sayma tavanı: MAT.1.1.1 → 20. Ritmik saymanın 100'ü BURADA GEÇERSİZ. */
const KARSILASTIRMA_ARALIGI: SayiAraligi = { min: 1, max: 20 };

export const KARSILASTIR_SORU_TIPLERI = ['hangisiCok', 'hangisiAz', 'esitMi'] as const;
export type SoruTipi = (typeof KARSILASTIR_SORU_TIPLERI)[number];

/** Sunum koşulu — çeliştirmenin üç hâli. Bkz. başlık yorumu. */
export const CELISTIRME_KOSULLARI = ['notr', 'celisen', 'uyumlu'] as const;
export type CelistirmeKosulu = (typeof CELISTIRME_KOSULLARI)[number];

/**
 * `nesneKumesi` düzen birleşimi types.ts'ten TÜRETİLİR.
 * NEDEN: 'dagınık' dizgesi Türkçe noktasız/noktalı i içeriyor ve elle yazılınca
 * sessizce kayabilir. Buradan türetince yazım hatası DERLEME hatası olur.
 */
type KumeDuzeni = Extract<VisualSpec, { type: 'nesneKumesi' }>['layout'];
const DUZEN_SIRA: KumeDuzeni = 'sira';
const DUZEN_DAGINIK: KumeDuzeni = 'dagınık';
const DUZEN_GRUPLU: KumeDuzeni = 'gruplu';
const DUZEN_ONLUK: KumeDuzeni = 'onlukCerceve';

/**
 * Sprite'ların GÖRSEL BÜYÜKLÜK sınıfı. `Record<NesneSprite, ...>` olduğu için
 * yeni bir sprite eklenirse burada sınıflandırılmadan derlenmez.
 * (Ölçek alanı `nesneKumesi`de olmadığı için nesne büyüklüğünü sprite kimliği
 * taşıyor — bkz. başlık yorumundaki "BİLİNEN EKSİK".)
 */
export type SpriteBoyutSinifi = 'iri' | 'orta' | 'ufak';
export const SPRITE_BOYUT_SINIFI: Readonly<Record<NesneSprite, SpriteBoyutSinifi>> = {
  araba: 'iri',
  balon: 'iri',
  top: 'iri',
  elma: 'orta',
  kus: 'orta',
  kalem: 'orta',
  balik: 'orta',
  yildiz: 'ufak',
  cicek: 'ufak',
  kelebek: 'ufak',
};

const IRI_SPRITELAR = NESNE_SPRITELARI.filter((s) => SPRITE_BOYUT_SINIFI[s] === 'iri');
const UFAK_SPRITELAR = NESNE_SPRITELARI.filter((s) => SPRITE_BOYUT_SINIFI[s] === 'ufak');
const SPRITE_SINIF_HAVUZLARI: Readonly<Record<SpriteBoyutSinifi, readonly NesneSprite[]>> = {
  iri: IRI_SPRITELAR,
  orta: NESNE_SPRITELARI.filter((s) => SPRITE_BOYUT_SINIFI[s] === 'orta'),
  ufak: UFAK_SPRITELAR,
};

/** Şık/varlık kimlikleri — sabit ve anlamı sızdırmayan. */
const ID_KUME_1 = 'kume-1';
const ID_KUME_2 = 'kume-2';
const ID_TERIM_ESIT = 'terim-esit';
const ID_TERIM_ESIT_DEGIL = 'terim-esit-degil';

const KAZANIMLAR: readonly KazanimKodu[] = ['MAT.1.1.4'];
const SKILL_SEZGISEL: SkillId = 'mat.karsilastirma.sezgisel';
const SKILL_BIREBIR: SkillId = 'mat.karsilastirma.birebir-esleme';
const SKILL_ON_REFERANSI: SkillId = 'mat.karsilastirma.on-referansi';

// ------------------------------------------------------------ zorluk profilleri

interface ZorlukProfili {
  /** Adet alt sınırı (dâhil). */
  readonly altSinir: number;
  /** Adet üst sınırı (dâhil) — hiçbir profilde 20'yi aşmaz. */
  readonly ustSinir: number;
  readonly minFark: number;
  readonly maxFark: number;
  /** 3 şıklı maddede iki kümenin eşit olma olasılığı. */
  readonly esitOlasilik: number;
  /** Bir tarafın tam 10 olup onluk çerçevede gösterilme olasılığı (SAYFA 22). */
  readonly onReferansiOlasilik: number;
  /** Alan koşulu 'notr' iken İKİ TARAFIN da dağınık dizilme olasılığı. */
  readonly dagitikOlasilik: number;
  /** Kazanan kümenin iki gruba bölünerek sunulma olasılığı (TEK_KUMEYI_ALMA). */
  readonly bolunmusOlasilik: number;
}

/**
 * Zorluk, SAYININ BÜYÜKLÜĞÜNDEN çok FARKIN KÜÇÜKLÜĞÜYLE artar: 3'e karşı 12
 * sezgiyle çözülür, 12'ye karşı 13 birebir eşleme ister. Program da bu sırayı
 * söylüyor: önce sezgisel, sonra birebir eşlemeli karşılaştırma (SAYFA 22).
 * Çeliştirme oranı zorluğa BAĞLI DEĞİLDİR — sezgisel düğüm (difficulty 1) zaten
 * BUYUKLUK_MIKTAR yanılgısını hedefliyor, en erken maddede ölçülmeli.
 */
const ZORLUK_PROFILLERI: Readonly<Record<Difficulty, ZorlukProfili>> = {
  1: {
    altSinir: 1,
    ustSinir: 6,
    minFark: 3,
    maxFark: 5,
    esitOlasilik: 0.2,
    onReferansiOlasilik: 0,
    dagitikOlasilik: 0,
    bolunmusOlasilik: 0,
  },
  2: {
    altSinir: 1,
    ustSinir: 10,
    minFark: 2,
    maxFark: 4,
    esitOlasilik: 0.22,
    onReferansiOlasilik: 0.15,
    dagitikOlasilik: 0.2,
    bolunmusOlasilik: 0,
  },
  3: {
    altSinir: 2,
    ustSinir: 15,
    minFark: 1,
    maxFark: 3,
    esitOlasilik: 0.25,
    onReferansiOlasilik: 0.35,
    dagitikOlasilik: 0.35,
    bolunmusOlasilik: 0.45,
  },
  4: {
    altSinir: 3,
    ustSinir: 20,
    minFark: 1,
    maxFark: 2,
    esitOlasilik: 0.28,
    onReferansiOlasilik: 0.3,
    dagitikOlasilik: 0.5,
    bolunmusOlasilik: 0.5,
  },
  5: {
    altSinir: 5,
    ustSinir: 20,
    minFark: 1,
    maxFark: 1,
    esitOlasilik: 0.3,
    onReferansiOlasilik: 0.25,
    dagitikOlasilik: 0.6,
    bolunmusOlasilik: 0.5,
  },
};

/** Soru tipi dağılımı. 'hangisiAz' daha zordur (çocuk "çok"a yönelir), bu yüzden
 *  yok sayılamaz ama azınlıkta kalır; 'esitMi' en seyrek, çünkü ikili karar
 *  tahmini ödüllendirir. */
const SORU_TIPI_AGIRLIKLARI: readonly (readonly [SoruTipi, number])[] = [
  ['hangisiCok', 0.45],
  ['hangisiAz', 0.35],
  ['esitMi', 0.2],
];

const SORU_SESLERI: Readonly<Record<SoruTipi, SpeakSource>> = {
  hangisiCok: { kind: 'key', key: 'soru.hangisi-cok' }, // "Hangisinde daha çok var?"
  hangisiAz: { kind: 'key', key: 'soru.hangisi-az' }, // "Hangisinde daha az var?"
  esitMi: { kind: 'key', key: 'soru.esit-mi' }, // "Eşit mi?"
};

// ------------------------------------------------------------------ parametreler

export interface KarsilastirParams extends GeneratorParams {
  readonly soruTipi?: SoruTipi;
  /** 1. kümenin adedi (1..20). `b` ile birlikte verilmelidir. */
  readonly a?: number;
  /** 2. kümenin adedi (1..20). */
  readonly b?: number;
  /** Eşitliği zorla/engelle. `a` ve `b` verilmişse yok sayılır. */
  readonly esit?: boolean;
  /** true → 'celisen', false → 'notr'. Verilmezse orana göre çekilir. */
  readonly boyutCelistirme?: boolean;
  /** Alan (kaplanan yer) çeliştirmesi için aynı sözleşme. */
  readonly alanCelistirme?: boolean;
  /** AZ kümenin İRİ nesnelerden oluşma olasılığı. Varsayılan 0.4. */
  readonly celistirmeOrani?: number;
  /** ÇOK kümenin İRİ nesnelerden oluşma olasılığı (kontrol koşulu). Varsayılan 0.2. */
  readonly uyumluOrani?: number;
  /** AZ kümenin geniş yayılımla dizilme olasılığı. Varsayılan 0.35. */
  readonly alanCelistirmeOrani?: number;
  /** ÇOK kümenin geniş yayılımla dizilme olasılığı. Varsayılan 0.15. */
  readonly alanUyumluOrani?: number;
  /** 4 verilirse 3'e kelepçelenir (karşılaştırılan nicelik daima iki). */
  readonly secenekSayisi?: 2 | 3 | 4;
  /** 'esitMi' blok dengelemesi için oturum içi madde sırası (0 tabanlı). */
  readonly oturumIndeksi?: number;
  /** Blok dengelemesinin sabit çıpası. Verilmezse `seed - oturumIndeksi`. */
  readonly oturumTohumu?: number;
}

/**
 * Maddenin tüm TASARIM KARARLARI. `uret` bunu kurar, sonra Exercise'e çevirir.
 * Dışa açık, çünkü doğrulama betikleri ve testler koşul oranlarını (çeliştirme
 * %40 mı?) Exercise'ten geri çıkarmak zorunda kalmasın.
 */
export interface KarsilastirTasarimi {
  readonly soruTipi: SoruTipi;
  readonly a: number;
  readonly b: number;
  readonly esit: boolean;
  /** Doğru cevap: hangi küme, ya da 'esit'. */
  readonly dogru: 'a' | 'b' | 'esit';
  readonly boyutKosulu: CelistirmeKosulu;
  readonly alanKosulu: CelistirmeKosulu;
  readonly aSprite: NesneSprite;
  readonly bSprite: NesneSprite;
  readonly aDuzen: KumeDuzeni;
  readonly bDuzen: KumeDuzeni;
  readonly aKonumlar?: readonly Nokta[];
  readonly bKonumlar?: readonly Nokta[];
  readonly onReferansi: boolean;
  readonly bolunmusSunum: boolean;
  readonly secenekSayisi: 2 | 3;
  /** Yanlış küme kartının tanı etiketi. */
  readonly kumeCeldiriciEtiketi: HataEtiketi;
}

// ------------------------------------------------------------------ yardımcılar

function kelepcele(deger: number, alt: number, ust: number): number {
  return deger < alt ? alt : deger > ust ? ust : deger;
}

function agirlikliSec<T>(agirliklar: readonly (readonly [T, number])[], rng: Rng): T {
  const toplam = agirliklar.reduce((t, [, a]) => t + a, 0);
  let esik = rng.next() * toplam;
  for (const [deger, agirlik] of agirliklar) {
    esik -= agirlik;
    if (esik < 0) return deger;
  }
  return agirliklar[agirliklar.length - 1][0];
}

/** Üç hâlli koşul çekimi: önce 'celisen', sonra 'uyumlu', kalan 'notr'. */
function kosulCek(
  zorla: boolean | undefined,
  celisenOrani: number,
  uyumluOrani: number,
  rng: Rng,
): CelistirmeKosulu {
  if (zorla === true) return 'celisen';
  if (zorla === false) return 'notr';
  const r = rng.next();
  if (r < celisenOrani) return 'celisen';
  if (r < celisenOrani + uyumluOrani) return 'uyumlu';
  return 'notr';
}

/**
 * Dağınık yerleşim için ÖNCEDEN hesaplanmış konumlar (0..1, kümenin kendi
 * kutusuna göre). Izgara + sarsıntı: çakışma olmadan doğal görünür ve
 * deterministiktir. `genis` yayılım kutunun tamamını, `dar` yayılım ortadaki
 * küçük bir alanı kullanır — kaplanan ALAN çeliştirmesi buradan doğar.
 */
function dagitikKonumlar(adet: number, rng: Rng, yayilim: 'genis' | 'dar'): readonly Nokta[] {
  const kenar = yayilim === 'genis' ? 0.06 : 0.3;
  const alan = 1 - 2 * kenar;
  const sutun = Math.max(1, Math.ceil(Math.sqrt(adet)));
  const satir = Math.max(1, Math.ceil(adet / sutun));
  const hucreG = alan / sutun;
  const hucreY = alan / satir;

  const noktalar: Nokta[] = [];
  for (let i = 0; i < adet; i++) {
    const s = i % sutun;
    const r = Math.floor(i / sutun);
    // Sarsıntı hücrenin %30'unu aşmaz → komşu nesneyle çakışma olmaz.
    const jx = (rng.int(-30, 30) / 100) * hucreG;
    const jy = (rng.int(-30, 30) / 100) * hucreY;
    noktalar.push({
      x: Number(kelepcele(kenar + hucreG * (s + 0.5) + jx, 0.02, 0.98).toFixed(4)),
      y: Number(kelepcele(kenar + hucreY * (r + 0.5) + jy, 0.02, 0.98).toFixed(4)),
    });
  }
  return noktalar;
}

/** 13 → [10, 3]; 8 → [8]. K3 ipucundaki onluk çerçeve yeniden çerçevelemesi. */
function onlukGruplari(n: number): readonly number[] {
  return n <= 10 ? [n] : [10, n - 10];
}

function kumeGorseli(
  adet: number,
  sprite: NesneSprite,
  duzen: KumeDuzeni,
  konumlar?: readonly Nokta[],
): VisualSpec {
  // `renk` KASITLI olarak boş: renk üçüncü bir algısal değişken olurdu ve
  // ölçmek istediğimiz şey (boyut ↔ miktar) bulanıklaşırdı.
  return konumlar
    ? { type: 'nesneKumesi', sprite, adet, layout: duzen, konumlar }
    : { type: 'nesneKumesi', sprite, adet, layout: duzen };
}

function kumeSecenegi(
  id: string,
  gorsel: VisualSpec,
  dogruMu: boolean,
  etiket: HataEtiketi,
): Option {
  // Doğru şıkka `diagnosticTag` yazmak DERLEME hatasıdır (types.ts); iki dal ayrı.
  return dogruMu
    ? { id, deger: { tur: 'gorsel', gorsel }, correct: true }
    : { id, deger: { tur: 'gorsel', gorsel }, correct: false, diagnosticTag: etiket };
}

function terimSecenegi(
  id: string,
  terim: 'esit' | 'daha-cok',
  dogruMu: boolean,
  etiket: HataEtiketi,
): Option {
  // `ses` YOK: `terim.esit` / `terim.esit-degil` klipleri manifestte olmadığı
  // için şıkların yalnız birine ses vermek dikkat kayması yaratırdı.
  return dogruMu
    ? { id, deger: { tur: 'terim', terim }, correct: true }
    : { id, deger: { tur: 'terim', terim }, correct: false, diagnosticTag: etiket };
}

/**
 * 'esitMi' maddelerinde eşitlik kararı.
 * Oturum bilgisi varsa 4'lük blokta tam 2 eşit üretir (sıra karışık);
 * yoksa bağımsız akıştan p olasılıklı Bernoulli. Bkz. başlık yorumu.
 */
function esitlikKarari(params: KarsilastirParams, esitRng: Rng, olasilik: number): boolean {
  const i = params.oturumIndeksi;
  if (i != null && Number.isInteger(i) && i >= 0) {
    const capa = params.oturumTohumu ?? params.seed - i;
    const blok = Math.floor(i / 4);
    const blokRng = createRng(hash32(`${KARSILASTIR_TEMPLATE_ID}|esitlik|${capa}|${blok}`));
    return blokRng.shuffle([true, true, false, false])[i % 4];
  }
  return esitRng.bool(olasilik);
}

// ------------------------------------------------------------------- tasarım

/**
 * Maddenin tüm kararlarını verir. SAF ve deterministik: aynı (params, tohum)
 * → aynı tasarım. Her karar KENDİ alt akışından çekilir (`fork`), böylece bir
 * boyutu değiştirmek diğerlerini kaydırmaz ve koşullar birbiriyle KORELE olmaz.
 */
export function karsilastirTasarimi(params: KarsilastirParams, rng: Rng): KarsilastirTasarimi {
  const profil = ZORLUK_PROFILLERI[params.difficulty];

  const tipRng = rng.fork('soruTipi');
  const sayiRng = rng.fork('sayilar');
  const esitRng = rng.fork('esitlik');
  const boyutRng = rng.fork('boyut');
  const alanRng = rng.fork('alan');
  const spriteRng = rng.fork('sprite');
  const duzenRng = rng.fork('duzen');

  const soruTipi: SoruTipi = params.soruTipi ?? agirlikliSec(SORU_TIPI_AGIRLIKLARI, tipRng);

  // 'esitMi' cevabı iki TERİM kartıdır (eşit / eşit değil) → daima 2 şık.
  // Diğerlerinde 4 anlamsız: karşılaştırılan nicelik daima İKİ (kazanimlar.json).
  const istenenSecenek = params.secenekSayisi ?? (params.difficulty === 1 ? 2 : 3);
  const secenekSayisi: 2 | 3 = soruTipi === 'esitMi' ? 2 : istenenSecenek >= 3 ? 3 : 2;

  // --- adetler
  let a: number;
  let b: number;
  let esit: boolean;
  let onReferansi = false;

  if (params.a != null || params.b != null) {
    if (params.a == null || params.b == null) {
      throw new Error('karsilastir: a ve b birlikte verilmelidir.');
    }
    a = params.a;
    b = params.b;
    for (const v of [a, b]) {
      if (!Number.isInteger(v) || v < KARSILASTIRMA_ARALIGI.min || v > KARSILASTIRMA_ARALIGI.max) {
        throw new Error(
          `karsilastir: adetler ${KARSILASTIRMA_ARALIGI.min}..${KARSILASTIRMA_ARALIGI.max} ` +
            `aralığında tam sayı olmalı (a=${params.a}, b=${params.b}).`,
        );
      }
    }
    esit = a === b;
    onReferansi = a === 10 || b === 10;
  } else {
    esit =
      params.esit ??
      (soruTipi === 'esitMi'
        ? esitlikKarari(params, esitRng, 0.5)
        : secenekSayisi === 3 && esitRng.bool(profil.esitOlasilik));

    onReferansi = profil.onReferansiOlasilik > 0 && sayiRng.bool(profil.onReferansiOlasilik);

    if (esit) {
      const v = onReferansi ? 10 : sayiRng.int(profil.altSinir, profil.ustSinir);
      a = v;
      b = v;
    } else {
      const fark = sayiRng.int(profil.minFark, profil.maxFark);
      let kucuk: number;
      let buyuk: number;
      if (onReferansi) {
        // Bir taraf TAM 10 (program: "10'dan az / 10'dan çok / 10'a eşit").
        if (sayiRng.bool()) {
          kucuk = 10;
          buyuk = kelepcele(10 + fark, 1, KARSILASTIRMA_ARALIGI.max);
        } else {
          buyuk = 10;
          kucuk = kelepcele(10 - fark, KARSILASTIRMA_ARALIGI.min, 20);
        }
      } else {
        kucuk = sayiRng.int(profil.altSinir, profil.ustSinir - fark);
        buyuk = kucuk + fark;
      }
      // Hangi kümenin büyük olduğu da tohuma bağlı (şık sırası ayrıca karışır).
      if (sayiRng.bool()) {
        a = buyuk;
        b = kucuk;
      } else {
        a = kucuk;
        b = buyuk;
      }
    }
  }

  if (esit && secenekSayisi === 2 && soruTipi !== 'esitMi') {
    // Sessizce düzeltmiyoruz: iki kümeyi eşit gösterip "hangisi çok" diye sormak
    // ve "eşit" şıkkını vermemek, cevabı OLMAYAN bir madde üretmek olurdu.
    throw new Error(
      `karsilastir: a === b (${a}) ancak '${soruTipi}' maddesinde 'eşit' şıkkı yok. ` +
        'secenekSayisi 3 olmalı ya da eşitlik kapatılmalı.',
    );
  }

  // --- çeliştirme koşulları (bağımsız akışlardan)
  const boyutKosuluHam = kosulCek(
    params.boyutCelistirme,
    params.celistirmeOrani ?? 0.4,
    params.uyumluOrani ?? 0.2,
    boyutRng,
  );
  // Eşit maddede "uyumlu" tanımsızdır (az/çok yok) → nötre düşer.
  const boyutKosulu: CelistirmeKosulu =
    esit && boyutKosuluHam === 'uyumlu' ? 'notr' : boyutKosuluHam;

  const alanKosuluHam = kosulCek(
    params.alanCelistirme,
    params.alanCelistirmeOrani ?? 0.35,
    params.alanUyumluOrani ?? 0.15,
    alanRng,
  );
  // Onluk çerçeve sabit ızgaradır; yayılım oyunu oynanamaz.
  const alanKosulu: CelistirmeKosulu = onReferansi
    ? 'notr'
    : esit && alanKosuluHam === 'uyumlu'
      ? 'notr'
      : alanKosuluHam;

  // --- TANI SAFLIĞI: çelişen maddede fark 1 OLAMAZ
  // misconceptions.json / BUYUKLUK_MIKTAR → kacinilacak: "Farkı 1 olan kümelerle
  // çalışmak: sayma hatası tanıyı bulandırır." Haklı: 9'a karşı 10'da yanlış
  // cevap hem "büyük olan çoktur" hem "bir kaydırdım" ile açıklanabilir; o şıkka
  // BUYUKLUK_MIKTAR etiketi basmak raporu yanıltır. Farkı 2'ye açıyoruz.
  // Küçüğü bir aşağı çekmek yeğdir (üst sınırı zorlamaz); 10 referansı varsa
  // 10 olan taraf KORUNUR, öteki taraf oynatılır.
  if (
    !esit &&
    params.a == null &&
    Math.abs(a - b) === 1 &&
    (boyutKosulu === 'celisen' || alanKosulu === 'celisen')
  ) {
    const kucukTaraf: 'a' | 'b' = a < b ? 'a' : 'b';
    const kucukDeger = Math.min(a, b);
    const buyukDeger = Math.max(a, b);
    if (kucukDeger - 1 >= KARSILASTIRMA_ARALIGI.min && kucukDeger !== 10) {
      if (kucukTaraf === 'a') a = kucukDeger - 1;
      else b = kucukDeger - 1;
    } else if (buyukDeger + 1 <= KARSILASTIRMA_ARALIGI.max && buyukDeger !== 10) {
      if (kucukTaraf === 'a') b = buyukDeger + 1;
      else a = buyukDeger + 1;
    }
  }

  // --- doğru cevap
  // KASITLI olarak adet ayarlamasının ARDINDAN hesaplanır: a/b'yi değiştiren her
  // düzeltme, doğru cevabı da yeniden belirlemek zorundadır.
  const dogru: 'a' | 'b' | 'esit' = esit
    ? 'esit'
    : soruTipi === 'hangisiAz'
      ? a < b
        ? 'a'
        : 'b'
      : soruTipi === 'hangisiCok'
        ? a > b
          ? 'a'
          : 'b'
        : 'esit'; // 'esitMi' + eşit değil → aşağıda terim kartına çevrilir

  // --- spritelar
  // Eşit maddede "az taraf" yok; çelişkiyi hangi tarafın taşıyacağı tohumdan.
  const iriTaraf: 'a' | 'b' =
    boyutKosulu === 'celisen'
      ? esit
        ? spriteRng.bool()
          ? 'a'
          : 'b'
        : a < b
          ? 'a'
          : 'b' // AZ olan taraf İRİ
      : esit
        ? spriteRng.bool()
          ? 'a'
          : 'b'
        : a > b
          ? 'a'
          : 'b'; // 'uyumlu': ÇOK olan taraf İRİ

  let aSprite: NesneSprite;
  let bSprite: NesneSprite;
  if (boyutKosulu === 'notr') {
    const sinif = spriteRng.pick(['iri', 'orta', 'ufak'] as const);
    const havuz = SPRITE_SINIF_HAVUZLARI[sinif];
    // Yarısında AYNI sprite, yarısında AYNI SINIFTAN farklı sprite:
    // "spritelar farklıysa çelişki vardır" kestirmesini kapatır.
    if (spriteRng.bool(0.5) || havuz.length < 2) {
      const s = params.tercihEdilenSprite ?? spriteRng.pick(havuz);
      aSprite = s;
      bSprite = s;
    } else {
      const ikili = spriteRng.sample(havuz, 2);
      aSprite = ikili[0];
      bSprite = ikili[1];
    }
  } else {
    const iri = spriteRng.pick(IRI_SPRITELAR);
    const ufak = spriteRng.pick(UFAK_SPRITELAR);
    aSprite = iriTaraf === 'a' ? iri : ufak;
    bSprite = iriTaraf === 'a' ? ufak : iri;
  }

  // --- düzenler ve konumlar
  const genisTaraf: 'a' | 'b' | null =
    alanKosulu === 'celisen'
      ? esit
        ? duzenRng.bool()
          ? 'a'
          : 'b'
        : a < b
          ? 'a'
          : 'b' // AZ olan taraf geniş yayılır
      : alanKosulu === 'uyumlu'
        ? a > b
          ? 'a'
          : 'b'
        : null;

  // Kazanan kümeyi iki gruba bölerek sunmak: tek grubu sayan çocuk öteki kümeyi
  // seçer (TEK_KUMEYI_ALMA). Yalnız tek grup öteki kümeden KÜÇÜK görünüyorsa
  // tanılayıcıdır → ceil(buyuk/2) < kucuk.
  // BOYUT çelişkisinde kapalı: orada yanlış cevabın açıklaması zaten algısaldır,
  // iki tanıyı tek şıkta üst üste bindirmek ölçümü bulanıklaştırır. Boyut
  // 'uyumlu' iken AÇIK — orada çeliştirme doğru cevabı kayırıyor, bölünmüş sunum
  // bağımsız bir tanı kanalı ekler.
  // ALAN koşulu ise 'notr' OLMAK ZORUNDA: bölünmüş sunum düzenleri yeniden
  // yazar; 'celisen'/'uyumlu' bir yayılımın üstüne yazılsaydı ekranda tasarım
  // kaydında OLMAYAN bir alan asimetrisi doğar, çeldirici de yanlış etiketlenirdi.
  const buyukAdet = Math.max(a, b);
  const kucukAdet = Math.min(a, b);
  const bolunmusSunum =
    !esit &&
    !onReferansi &&
    boyutKosulu !== 'celisen' &&
    alanKosulu === 'notr' &&
    Math.ceil(buyukAdet / 2) < kucukAdet &&
    duzenRng.bool(profil.bolunmusOlasilik);

  let aDuzen: KumeDuzeni = DUZEN_SIRA;
  let bDuzen: KumeDuzeni = DUZEN_SIRA;
  let aKonumlar: readonly Nokta[] | undefined;
  let bKonumlar: readonly Nokta[] | undefined;

  if (onReferansi) {
    // 10 olan taraf onluk çerçevede; öteki taraf sıralı (10'a göre okuma).
    aDuzen = a === 10 ? DUZEN_ONLUK : DUZEN_SIRA;
    bDuzen = b === 10 ? DUZEN_ONLUK : DUZEN_SIRA;
  } else if (genisTaraf != null) {
    aDuzen = genisTaraf === 'a' ? DUZEN_DAGINIK : DUZEN_SIRA;
    bDuzen = genisTaraf === 'b' ? DUZEN_DAGINIK : DUZEN_SIRA;
    if (genisTaraf === 'a') aKonumlar = dagitikKonumlar(a, duzenRng, 'genis');
    else bKonumlar = dagitikKonumlar(b, duzenRng, 'genis');
  } else if (duzenRng.bool(profil.dagitikOlasilik)) {
    // Nötr alan koşulu: İKİ TARAF da aynı yayılımda dağınık.
    aDuzen = DUZEN_DAGINIK;
    bDuzen = DUZEN_DAGINIK;
    aKonumlar = dagitikKonumlar(a, duzenRng, 'dar');
    bKonumlar = dagitikKonumlar(b, duzenRng, 'dar');
  }

  if (bolunmusSunum) {
    // Kazanan iki gruba bölünür, KAYBEDEN sıraya çekilir ve İKİ TARAFIN da
    // dağınık konumları silinir: geriye yalnız "gruplu ↔ sıralı" farkı kalsın,
    // yanlışlıkla bir yayılım (alan) çeliştirmesi doğmasın.
    aKonumlar = undefined;
    bKonumlar = undefined;
    aDuzen = a === buyukAdet ? DUZEN_GRUPLU : DUZEN_SIRA;
    bDuzen = b === buyukAdet ? DUZEN_GRUPLU : DUZEN_SIRA;
  }

  // --- yanlış küme kartının tanı etiketi
  // Çelişkisiz maddede tek bir "artık" etiket kullanmak (hep KARDINALITE) rapor
  // ekranını yanıltır: farkı 1 olan maddede yanılmak SAYMA/EŞLEME kaymasıdır,
  // farkı 4 olan maddede yanılmak sayı-miktar bağının kurulmadığını gösterir.
  const secilenFark = Math.abs(a - b);
  const kumeCeldiriciEtiketi: HataEtiketi =
    boyutKosulu === 'celisen' || alanKosulu === 'celisen'
      ? HATA_ETIKETLERI.BUYUKLUK_MIKTAR
      : bolunmusSunum
        ? HATA_ETIKETLERI.TEK_KUMEYI_ALMA
        : secilenFark <= 2
          ? HATA_ETIKETLERI.BIREBIR_ESLESME
          : HATA_ETIKETLERI.KARDINALITE;

  return {
    soruTipi,
    a,
    b,
    esit,
    dogru,
    boyutKosulu,
    alanKosulu,
    aSprite,
    bSprite,
    aDuzen,
    bDuzen,
    aKonumlar,
    bKonumlar,
    onReferansi,
    bolunmusSunum,
    secenekSayisi,
    kumeCeldiriciEtiketi,
  };
}

// ------------------------------------------------------------- çeldirici değeri

/**
 * Yanlış küme kartının DEĞERİNİ distractors.ts'ten türetir.
 *
 * BUYUKLUK_MIKTAR (`kumeler` bağlamı) ve TEK_KUMEYI_ALMA (`a`/`b` bağlamı) tam
 * olarak "öteki küme"yi üretir; `yedekStrateji:'yok'` ile yakın komşu uydurması
 * kapatılmıştır. Dönen değer sahnedeki kümeyle uyuşmazsa FIRLATIR — kütüphane
 * davranışı değişirse yanlış etiketli bir şık sessizce ekrana gelmez.
 *
 * KARDINALITE / BIREBIR_ESLESME dallarında kütüphane kullanılamaz: aday havuzu
 * `dogru±1` (±2)'dir, `find` ilk uyanı seçer ve o sahnedeki küme olmayabilir.
 * Bu dallarda değer doğrudan sahneden alınır (bu şablonun
 * cevap uzayı SAYISAL DEĞİL GÖRSELDİR: ekranda yalnız iki küme vardır).
 */
function celdiriciKumeDegeri(
  dogruAdet: number,
  otekiAdet: number,
  etiket: HataEtiketi,
  rng: Rng,
): number {
  if (
    etiket === HATA_ETIKETLERI.BUYUKLUK_MIKTAR ||
    etiket === HATA_ETIKETLERI.TEK_KUMEYI_ALMA
  ) {
    const [celdirici] = sayisalCeldiricilerKesin(
      dogruAdet,
      [etiket],
      KARSILASTIRMA_ARALIGI,
      1,
      rng,
      {
        baglam: { a: dogruAdet, b: otekiAdet, kumeler: [dogruAdet, otekiAdet] },
        yedekStrateji: 'yok',
      },
    );
    if (celdirici.deger !== otekiAdet) {
      throw new Error(
        `karsilastir: ${etiket} çeldiricisi sahnedeki kümeyle uyuşmadı ` +
          `(beklenen ${otekiAdet}, gelen ${celdirici.deger}).`,
      );
    }
    return celdirici.deger;
  }
  return otekiAdet;
}

// -------------------------------------------------------------------- üretim

function tahminiSure(t: KarsilastirTasarimi, mod: GeneratorParams['mod']): number {
  let sn = 12;
  if (Math.max(t.a, t.b) > 10) sn += 3; // sayılacak nesne çok
  if (!t.esit && Math.abs(t.a - t.b) <= 1) sn += 3; // birebir eşleme şart
  if (t.boyutKosulu === 'celisen' || t.alanKosulu === 'celisen') sn += 3; // algısal direnç
  if (t.onReferansi) sn -= 2; // onluk çerçeve okumayı hızlandırır
  if (mod === 'tahta') sn += 2; // sırayla söz alma
  return kelepcele(Math.round(sn), 8, 25);
}

function skillIdleri(t: KarsilastirTasarimi): readonly SkillId[] {
  const idler: SkillId[] = [SKILL_SEZGISEL];
  if (t.esit || Math.abs(t.a - t.b) <= 2) idler.push(SKILL_BIREBIR);
  if (t.onReferansi) idler.push(SKILL_ON_REFERANSI);
  return idler;
}

export function karsilastirUret(params: KarsilastirParams, rng: Rng): AudioToImageExercise {
  const t = karsilastirTasarimi(params, rng);
  const siraRng = rng.fork('sira');
  const celdiriciRng = rng.fork('celdirici');

  const gorselA = kumeGorseli(t.a, t.aSprite, t.aDuzen, t.aKonumlar);
  const gorselB = kumeGorseli(t.b, t.bSprite, t.bDuzen, t.bKonumlar);

  const fark = Math.abs(t.a - t.b);
  /** "Eşit" kartı yanlışken tanı: fark 1 ise eşleme kayması, değilse kardinalite. */
  const esitKartiEtiketi: HataEtiketi =
    fark === 1 ? HATA_ETIKETLERI.BIREBIR_ESLESME : HATA_ETIKETLERI.KARDINALITE;

  let secenekler: Option[];
  let dogruOptionId: string;
  let assets: AssetSpec[];
  let promptGorseli: VisualSpec | undefined;
  let vurgulaIds: string[];
  let eleOptionIds: string[] | undefined;

  if (t.soruTipi === 'esitMi') {
    // --- EŞİT Mİ? İki TERİM kartı: dengede terazi / eğik terazi.
    const esitDogru = t.esit;
    const yanlisEtiket: HataEtiketi = esitDogru
      ? t.boyutKosulu === 'celisen' || t.alanKosulu === 'celisen'
        ? HATA_ETIKETLERI.BUYUKLUK_MIKTAR // eşit ama biri iri/geniş → "eşit değil" dedi
        : HATA_ETIKETLERI.BIREBIR_ESLESME
      : esitKartiEtiketi; // eşit değil ama "eşit" dedi

    secenekler = [
      terimSecenegi(ID_TERIM_ESIT, 'esit', esitDogru, yanlisEtiket),
      terimSecenegi(ID_TERIM_ESIT_DEGIL, 'daha-cok', !esitDogru, yanlisEtiket),
    ];
    dogruOptionId = esitDogru ? ID_TERIM_ESIT : ID_TERIM_ESIT_DEGIL;

    // Kümeler burada DOKUNULABİLİR DEĞİL; sahnedir. Talimat görseli sahnenin
    // kendisi, varlıklar ise ipucunun vurgulayabilmesi için ayrı ayrı listeli.
    promptGorseli = {
      type: 'sahne',
      parcalar: [
        { gorsel: gorselA, konum: { x: 0.27, y: 0.4 } },
        { gorsel: gorselB, konum: { x: 0.73, y: 0.4 } },
      ],
    };
    assets = [
      { id: ID_KUME_1, rol: 'sahne', gorsel: gorselA, erisimBolgesi: 'serbest' },
      { id: ID_KUME_2, rol: 'sahne', gorsel: gorselB, erisimBolgesi: 'serbest' },
    ];
    vurgulaIds = [ID_KUME_1, ID_KUME_2];
    // İki şıklı maddede eleme = cevabı vermek. K2 eleme YAPMAZ, eşlemeyi vurgular.
    eleOptionIds = undefined;
  } else {
    // --- HANGİSİ ÇOK / HANGİSİ AZ? Kümelerin kendisi şıktır.
    const aDogru = t.dogru === 'a';
    const bDogru = t.dogru === 'b';

    let aEtiket: HataEtiketi;
    let bEtiket: HataEtiketi;
    if (t.esit) {
      // Eşit maddede iki küme de yanlış: çelişkinin kayırdığı taraf algısal
      // hataya (BUYUKLUK_MIKTAR), öteki taraf eşleme hatasına işaret eder.
      const celiskiVar = t.boyutKosulu === 'celisen' || t.alanKosulu === 'celisen';
      const kayirilan: 'a' | 'b' =
        t.aDuzen === DUZEN_DAGINIK && t.bDuzen !== DUZEN_DAGINIK
          ? 'a'
          : t.bDuzen === DUZEN_DAGINIK && t.aDuzen !== DUZEN_DAGINIK
            ? 'b'
            : SPRITE_BOYUT_SINIFI[t.aSprite] === 'iri' &&
                SPRITE_BOYUT_SINIFI[t.bSprite] !== 'iri'
              ? 'a'
              : 'b';
      aEtiket =
        celiskiVar && kayirilan === 'a'
          ? HATA_ETIKETLERI.BUYUKLUK_MIKTAR
          : HATA_ETIKETLERI.BIREBIR_ESLESME;
      bEtiket =
        celiskiVar && kayirilan === 'b'
          ? HATA_ETIKETLERI.BUYUKLUK_MIKTAR
          : HATA_ETIKETLERI.BIREBIR_ESLESME;
    } else {
      // Tek yanlış küme var; değeri kütüphaneden türetilip sahneyle doğrulanır.
      const dogruAdet = aDogru ? t.a : t.b;
      const otekiAdet = aDogru ? t.b : t.a;
      const celdiriciDeger = celdiriciKumeDegeri(
        dogruAdet,
        otekiAdet,
        t.kumeCeldiriciEtiketi,
        celdiriciRng,
      );
      if (celdiriciDeger !== otekiAdet) {
        throw new Error('karsilastir: çeldirici değeri sahnedeki kümeyle eşleşmedi.');
      }
      aEtiket = t.kumeCeldiriciEtiketi;
      bEtiket = t.kumeCeldiriciEtiketi;
    }

    const kumeSecenekleri = siraRng.shuffle([
      kumeSecenegi(ID_KUME_1, gorselA, aDogru, aEtiket),
      kumeSecenegi(ID_KUME_2, gorselB, bDogru, bEtiket),
    ]);

    secenekler = [...kumeSecenekleri];
    if (t.secenekSayisi === 3) {
      // "Eşit" kartı DAİMA sonda ve DAİMA var (3 şıklı maddede): konumu sabit
      // olmalı ki çocuk onu "üçüncü kart" diye değil "terazi kartı" diye tanısın;
      // varlığı da cevabı ele vermesin.
      secenekler.push(terimSecenegi(ID_TERIM_ESIT, 'esit', t.esit, esitKartiEtiketi));
    }

    dogruOptionId = t.esit ? ID_TERIM_ESIT : aDogru ? ID_KUME_1 : ID_KUME_2;

    assets = [
      { id: ID_KUME_1, rol: 'secenek', gorsel: gorselA, erisimBolgesi: 'alt65' },
      { id: ID_KUME_2, rol: 'secenek', gorsel: gorselB, erisimBolgesi: 'alt65' },
    ];
    // "Eşit" kartı GÖRSEL VARLIK değil TERİM kartıdır; AssetSpec.gorsel zorunlu
    // olduğu için varlık listesine konmaz, render katmanı terim kartı çizer.
    promptGorseli = undefined;
    vurgulaIds = [ID_KUME_1, ID_KUME_2];

    // K2 elemesi yalnız 3 şıklı maddede anlamlı (2 şıkta eleme = cevabı vermek).
    if (t.secenekSayisi === 3) {
      eleOptionIds = t.esit
        ? [siraRng.bool() ? ID_KUME_1 : ID_KUME_2] // cevap "eşit" → bir kümeyi ele
        : [ID_TERIM_ESIT]; // cevap bir küme → "eşit" kartını ele
    } else {
      eleOptionIds = undefined;
    }
  }

  const talimatSesi = SORU_SESLERI[t.soruTipi];

  const hints = varsayilanIpuclari({
    talimatSesi,
    // Karşılaştırmanın stratejisi BİREBİR EŞLEME/SAYMA: "Haydi birlikte sayalım."
    k2Ses: { kind: 'key', key: 'yardim.k2-birlikte-sayalim' },
    eleOptionIds,
    vurgulaIds,
    // K3: iki niceliği ONLUK ÇERÇEVEYE taşıyıp yan yana koymak. Algısal
    // çeliştirme (iri nesne / geniş yayılım) burada tamamen ortadan kalkar,
    // çünkü çerçevede her nesne aynı gözü doldurur — "eşit uzunlukta iki sıra"
    // karşılaştırmanın kanıtıdır.
    k3Gorsel: {
      type: 'sahne',
      parcalar: [
        { gorsel: { type: 'onlukCerceve', gruplar: onlukGruplari(t.a) }, konum: { x: 0.27, y: 0.5 } },
        { gorsel: { type: 'onlukCerceve', gruplar: onlukGruplari(t.b) }, konum: { x: 0.73, y: 0.5 } },
      ],
    },
  });

  const imza = `${t.soruTipi}|${t.a}v${t.b}|${t.boyutKosulu}|${t.alanKosulu}|${t.secenekSayisi}`;

  return {
    itemId: makeItemId(KARSILASTIR_TEMPLATE_ID, params.seed, imza),
    templateId: KARSILASTIR_TEMPLATE_ID,
    skillIds: skillIdleri(t),
    kazanimKodlari: KAZANIMLAR,
    readingLoad: 0, // prompt.metin HİÇ doldurulmaz
    difficulty: params.difficulty,
    estimatedSec: tahminiSure(t, params.mod),
    prompt: promptGorseli
      ? { ses: talimatSesi, tekrarSes: talimatSesi, gorsel: promptGorseli }
      : { ses: talimatSesi, tekrarSes: talimatSesi },
    hints,
    assets,
    seed: params.seed,
    kind: 'AUDIO_TO_IMAGE',
    options: secenekler,
    validation: { mod: 'tekSecim', dogruOptionId },
  };
}

export const karsilastirGenerator: ExerciseGenerator<KarsilastirParams> = {
  templateId: KARSILASTIR_TEMPLATE_ID,
  kind: 'AUDIO_TO_IMAGE',
  karsilananKazanimlar: KAZANIMLAR,
  karsilananSkillIds: [SKILL_SEZGISEL, SKILL_BIREBIR, SKILL_ON_REFERANSI],
  readingLoad: 0,
  zorlukAraligi: [1, 5],
  uretebildigiHatalar: [
    HATA_ETIKETLERI.BUYUKLUK_MIKTAR,
    HATA_ETIKETLERI.TEK_KUMEYI_ALMA,
    HATA_ETIKETLERI.BIREBIR_ESLESME,
    HATA_ETIKETLERI.KARDINALITE,
  ],
  uret: karsilastirUret,
};
