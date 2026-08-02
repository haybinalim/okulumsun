/**
 * TANILAYICI ÇELDİRİCİLER.
 *
 * Ürün kısıtı #4: çeldiriciler RASTGELE DEĞİLDİR. Her yanlış şık belirli bir
 * yanlış zihinsel modeli temsil eder ve `diagnosticTag` ile etiketlenir.
 *
 * NEDEN: rastgele bir yanlış şık ("42") çocuğun neyi bilmediğini söylemez —
 * yalnızca bildiğini/bilmediğini söyler. "7+5" sorusunda 11 seçen çocukla 12
 * seçen çocuk aynı şeyi bilmiyor değildir: biri üstüne sayarken başlangıcı da
 * saymış (bir eksik), diğeri doğru saymış olabilir. Etiketli çeldirici, hangi
 * beceriyle tekrar çalışılacağını söyler; etiketsiz olan yalnızca "yanlış" der.
 *
 * Bu modül SAF ve DETERMİNİSTİKTİR: tüm rastgelelik `Rng`'den gelir.
 */

import type { Rng } from './rng';
import type { Option, OptionDeger } from './types';

// ------------------------------------------------------------- hata etiketleri

/**
 * Kavram yanılgısı etiketleri.
 *
 * `enum` değil `const` nesne: tsconfig `erasableSyntaxOnly` açık (enum yasak) ve
 * düz nesne + birleşim tipi hem JSON'a yazılabilir hem tip güvenli.
 */
export const HATA_ETIKETLERI = {
  /** Fazladan saydı — sonuç bir/iki fazla. */
  FAZLA_SAYMA: 'FAZLA_SAYMA',
  /** Eksik saydı — nesne atladı veya erken durdu. */
  EKSIK_SAYMA: 'EKSIK_SAYMA',
  /** İki kümeyi birleştirmek yerine yalnız birini saydı. */
  TEK_KUMEYI_ALMA: 'TEK_KUMEYI_ALMA',
  /** İşlemin yönünü karıştırdı — toplama yerine çıkarma ya da tersi. */
  ISLEM_YONU: 'ISLEM_YONU',
  /** Saydı ama "kaç tane" sorusuna son söylediği sayıyı toplam olarak veremedi. */
  KARDINALITE: 'KARDINALITE',
  /** Birebir eşleşme kurulamadı — nesne atlandı ya da iki kez sayıldı. */
  BIREBIR_ESLESME: 'BIREBIR_ESLESME',
  /** Onluk yapı çözülmedi — onluğu düşürdü veya basamakları yer değiştirdi. */
  ONLUK_BOZMA: 'ONLUK_BOZMA',
  /** Nesnelerin BÜYÜKLÜĞÜNÜ miktarla karıştırdı (büyük olan çok sanılıyor). */
  BUYUKLUK_MIKTAR: 'BUYUKLUK_MIKTAR',
  /** Sayı doğrusunda aralık yerine çizgi saydı (çit direği hatası). */
  SAYI_DOGRUSU_ARALIK: 'SAYI_DOGRUSU_ARALIK',
  /** "=" işaretini "cevap buraya gelir" komutu sandı (MAT.1.2.3). */
  ESIT_ISLEM_SONUCU: 'ESIT_ISLEM_SONUCU',
  /** Şekli yalnız prototip duruşunda tanıyor (döndürülünce tanımıyor). */
  SEKIL_PROTOTIP: 'SEKIL_PROTOTIP',
  /** Örüntünün fazını kaçırdı — bir adım ileri/geri kaydı. */
  ORUNTU_FAZ: 'ORUNTU_FAZ',
  /** Üstüne saymak yerine baştan hepsini saydı (ve sayımda kaydı). */
  HEPSINI_SAYMA: 'HEPSINI_SAYMA',
  /** Banknotun boyutunu değeriyle karıştırdı (MAT.1.1.9). */
  PARA_BOYUT_DEGER: 'PARA_BOYUT_DEGER',
  /** Görev anlaşılmadı — cevap soruyla ilgisiz. */
  GOREV_ANLASILMADI: 'GOREV_ANLASILMADI',
} as const;

export type HataEtiketi = (typeof HATA_ETIKETLERI)[keyof typeof HATA_ETIKETLERI];

/** Tüm etiketlerin listesi (kapsam denetimi ve rapor ekranları için). */
export const TUM_HATA_ETIKETLERI = Object.values(HATA_ETIKETLERI) as readonly HataEtiketi[];

export interface HataTanimi {
  readonly etiket: HataEtiketi;
  /** Öğretmen/veli raporunda görünecek Türkçe açıklama. */
  readonly aciklama: string;
  /** Sayısal bir cevaba çevrilebiliyor mu (aksi hâlde şablon kendi şıkkını kurar). */
  readonly sayisal: boolean;
  /** Sayısal üretim için işlenen bağlamı ŞART mı. */
  readonly baglamGerekir: boolean;
  /** Öğretmene önerilen telafi yönü. */
  readonly telafi: string;
}

/** Etiket → açıklama sözlüğü. Rapor metinleri koda gömülmez, buradan okunur. */
export const HATA_TANIMLARI: Readonly<Record<HataEtiketi, HataTanimi>> = {
  FAZLA_SAYMA: {
    etiket: 'FAZLA_SAYMA',
    aciklama: 'Nesneleri sayarken bir nesneyi iki kez sayıyor ya da fazladan sayıyor.',
    sayisal: true,
    baglamGerekir: false,
    telafi: 'Dokunarak sayma; her nesneye bir kez dokun, dokunulanı işaretle.',
  },
  EKSIK_SAYMA: {
    etiket: 'EKSIK_SAYMA',
    aciklama: 'Sayarken nesne atlıyor veya erken duruyor.',
    sayisal: true,
    baglamGerekir: false,
    telafi: 'Nesneleri sıraya dizip soldan sağa dokunarak sayma.',
  },
  TEK_KUMEYI_ALMA: {
    etiket: 'TEK_KUMEYI_ALMA',
    aciklama: 'İki kümeyi birleştirmek yerine yalnızca bir kümeyi sayıyor.',
    sayisal: true,
    baglamGerekir: true,
    telafi: 'İki kümeyi fiziksel olarak bir araya toplayıp sonra sayma.',
  },
  ISLEM_YONU: {
    etiket: 'ISLEM_YONU',
    aciklama: 'Toplama ile çıkarmayı karıştırıyor; işlemin yönünü ters uyguluyor.',
    sayisal: true,
    baglamGerekir: true,
    telafi: 'Hikâyeyle işlem eşleme: "geldi" mi "gitti" mi.',
  },
  KARDINALITE: {
    etiket: 'KARDINALITE',
    aciklama:
      'Sayma sırasını söyleyebiliyor ama son söylediği sayının TOPLAMI verdiğini kavramamış.',
    sayisal: true,
    baglamGerekir: false,
    telafi: 'Saydıktan sonra "kaç tane vardı?" sorusunu tekrarlama.',
  },
  BIREBIR_ESLESME: {
    etiket: 'BIREBIR_ESLESME',
    aciklama: 'Her nesneye bir sayı sözcüğü eşlemekte zorlanıyor.',
    sayisal: true,
    baglamGerekir: false,
    telafi: 'Yavaş tempoda, dokunarak ve sesli sayma.',
  },
  ONLUK_BOZMA: {
    etiket: 'ONLUK_BOZMA',
    aciklama: 'Onluk yapıyı çözemiyor; onluğu düşürüyor ya da basamakları karıştırıyor.',
    sayisal: true,
    baglamGerekir: false,
    telafi: 'Onluk çerçeveyle çalışma; 10 dolunca yeni çerçeveye geçme.',
  },
  BUYUKLUK_MIKTAR: {
    etiket: 'BUYUKLUK_MIKTAR',
    aciklama: 'Nesneler büyük olduğu için o kümeyi "daha çok" sanıyor.',
    sayisal: true,
    baglamGerekir: true,
    telafi: 'Aynı miktarı farklı boyutlarda gösterip birebir eşleme.',
  },
  SAYI_DOGRUSU_ARALIK: {
    etiket: 'SAYI_DOGRUSU_ARALIK',
    aciklama: 'Sayı doğrusunda atlamaları değil işaretleri sayıyor (bir fazla/eksik).',
    sayisal: true,
    baglamGerekir: false,
    telafi: 'Zıplama hareketiyle aralık sayma.',
  },
  ESIT_ISLEM_SONUCU: {
    etiket: 'ESIT_ISLEM_SONUCU',
    aciklama:
      '"=" işaretini "sonucu buraya yaz" komutu sanıyor; eşitliğin iki yanının denk olduğunu görmüyor.',
    sayisal: true,
    baglamGerekir: true,
    telafi: 'Terazi modeli; 7 = 3 + 4 gibi ters yazılmış eşitlikler.',
  },
  SEKIL_PROTOTIP: {
    etiket: 'SEKIL_PROTOTIP',
    aciklama: 'Şekli yalnızca alışıldık duruşunda tanıyor; döndürülünce tanımıyor.',
    sayisal: false,
    baglamGerekir: false,
    telafi: 'Aynı şekli döndürerek, farklı boyutlarda gösterme; kenar-köşe sayma.',
  },
  ORUNTU_FAZ: {
    etiket: 'ORUNTU_FAZ',
    aciklama: 'Örüntünün kuralını buluyor ama bir adım kaymış olarak uyguluyor.',
    sayisal: true,
    baglamGerekir: false,
    telafi: 'Örüntüyü baştan sesli okuyup eksik yere gelene kadar sayma.',
  },
  HEPSINI_SAYMA: {
    etiket: 'HEPSINI_SAYMA',
    aciklama:
      'Üstüne saymak yerine baştan hepsini sayıyor; bu sırada başlangıcı da sayıp kayıyor.',
    sayisal: true,
    baglamGerekir: false,
    telafi: 'Büyük sayıyı "avucunda tut", üstüne say (yardim.ustune-sayma).',
  },
  PARA_BOYUT_DEGER: {
    etiket: 'PARA_BOYUT_DEGER',
    aciklama: 'Banknotun boyutunu/rengini değeriyle karıştırıyor.',
    sayisal: false,
    baglamGerekir: false,
    telafi: 'Banknot üzerindeki rakamı okuma ve karşılaştırma.',
  },
  GOREV_ANLASILMADI: {
    etiket: 'GOREV_ANLASILMADI',
    aciklama: 'Cevap soruyla ilgisiz; talimat anlaşılmamış olabilir.',
    sayisal: true,
    baglamGerekir: false,
    telafi: 'Talimatı yavaş tekrarlama; daha kısa yönergeli bir soruya dönme.',
  },
};

// ------------------------------------------------------------------- aralık

/** Kapalı aralık — HER İKİ UÇ DA DAHİL (`Rng.int` ile aynı sözleşme). */
export interface SayiAraligi {
  readonly min: number;
  readonly max: number;
}

/** MAT.1.1.1 / MAT.1.2.* için varsayılan aralık: 0–20 (20 dâhil). */
export const VARSAYILAN_ARALIK: SayiAraligi = { min: 0, max: 20 };

function araliktaMi(deger: number, aralik: SayiAraligi): boolean {
  return Number.isInteger(deger) && deger >= aralik.min && deger <= aralik.max;
}

// ------------------------------------------------------------------- bağlam

/**
 * İşlem bağlamı. Bazı hata tipleri yalnızca işlenenler bilinirse anlamlı
 * sayısal bir çeldiriciye çevrilebilir (ör. TEK_KUMEYI_ALMA'nın "tek küme"si
 * hangi sayıdır?). Bağlam verilmezse bu etiketler KULLANILAMAZ olarak raporlanır
 * — uydurma bir değere yanlış etiket iliştirilmez.
 */
export interface CeldiriciBaglami {
  readonly a?: number;
  readonly b?: number;
  readonly islem?: '+' | '-';
  /** Eşitlik sorularında bilinen toplam (ör. `7 = 3 + □` içinde 7). */
  readonly toplam?: number;
  /** Örüntü/ritmik sayma adımı. */
  readonly adim?: number;
  /** Karşılaştırma sorularında kümelerin adetleri. */
  readonly kumeler?: readonly number[];
}

// --------------------------------------------------------------- aday üretimi

/**
 * Bir hata etiketinin ürettiği ADAY değerler, tercih sırasıyla.
 * İlk sıradaki aday en sadık temsildir; sonrakiler aynı yanılgının daha zayıf
 * ama hâlâ savunulabilir varyantlarıdır. Aralık/benzersizlik süzgeci çağıran
 * tarafta uygulanır.
 */
function adaylar(
  etiket: HataEtiketi,
  dogru: number,
  aralik: SayiAraligi,
  baglam: CeldiriciBaglami,
  rng: Rng,
): number[] {
  const { a, b, islem, toplam, adim } = baglam;

  switch (etiket) {
    case 'FAZLA_SAYMA':
      return [dogru + 1, dogru + 2, dogru + 3];

    case 'EKSIK_SAYMA':
      return [dogru - 1, dogru - 2, dogru - 3];

    case 'TEK_KUMEYI_ALMA':
      // Yalnız bir kümeyi saymak: büyük küme daha sık seçilir, o yüzden önce o.
      if (a == null || b == null) return [];
      return [Math.max(a, b), Math.min(a, b)];

    case 'ISLEM_YONU': {
      if (a == null || b == null || islem == null) return [];
      // Toplama sorusunda çıkarma yapmak (ya da tersi).
      return islem === '+' ? [a - b, b - a] : [a + b];
    }

    case 'KARDINALITE':
      // Son sayı sözcüğünü toplam olarak veremeyen çocuk tipik olarak bir
      // kayar; hangi yöne kaydığı çocuğa göre değişir.
      return [dogru - 1, dogru + 1, dogru + 2];

    case 'BIREBIR_ESLESME':
      // Nesne atlama (eksik) ya da iki kez sayma (fazla).
      return [dogru + 1, dogru - 1, dogru + 2, dogru - 2];

    case 'ONLUK_BOZMA': {
      const sonuc = [dogru - 10, dogru + 10];
      // Basamak yer değiştirme: 12 → 21. Yalnız iki basamaklı sayılarda anlamlı.
      if (dogru >= 10 && dogru <= 99) {
        const onlar = Math.floor(dogru / 10);
        const birler = dogru % 10;
        sonuc.push(birler * 10 + onlar);
      }
      return sonuc;
    }

    case 'BUYUKLUK_MIKTAR':
      // "Büyük olan çoktur" diyen çocuk ÖTEKİ kümenin sayısını verir.
      if (baglam.kumeler == null) return [];
      return baglam.kumeler.filter((k) => k !== dogru);

    case 'SAYI_DOGRUSU_ARALIK':
      // Çit direği hatası: aralık yerine işaret sayınca tam bir kayar.
      return [dogru + 1, dogru - 1];

    case 'ESIT_ISLEM_SONUCU': {
      // `7 = 3 + □` sorusunda "=" işaretini komut sanan çocuk 7'yi ya da
      // gördüğü iki sayının toplamını yazar.
      const sonuc: number[] = [];
      if (toplam != null) sonuc.push(toplam);
      if (a != null && b != null) sonuc.push(a + b);
      if (a != null) sonuc.push(a);
      return sonuc;
    }

    case 'ORUNTU_FAZ': {
      const s = adim ?? 1;
      return [dogru + s, dogru - s, dogru + 2 * s];
    }

    case 'HEPSINI_SAYMA':
      // Üstüne sayarken başlangıç sayısını da sayma → bir eksik.
      return [dogru - 1, dogru + 1];

    case 'GOREV_ANLASILMADI': {
      // Soruyla ilgisiz ama aralık içinde bir değer: doğrudan en az 3 uzak.
      const havuz: number[] = [];
      for (let v = aralik.min; v <= aralik.max; v++) {
        if (Math.abs(v - dogru) >= 3) havuz.push(v);
      }
      return rng.shuffle(havuz);
    }

    case 'SEKIL_PROTOTIP':
    case 'PARA_BOYUT_DEGER':
      // Sayısal karşılığı yok — şablon kendi görsel şıkkını kurar.
      return [];

    default:
      return [];
  }
}

// -------------------------------------------------------------------- sonuç

export interface SayisalCeldirici {
  readonly deger: number;
  readonly etiket: HataEtiketi;
  /**
   * `true`: etiket bu değeri gerçekten açıklıyor (istenen hata tipinden üretildi).
   * `false`: yedek stratejiyle üretildi; etiket yön bazlı ATANMIŞTIR
   * (doğrudan büyükse FAZLA_SAYMA, küçükse EKSIK_SAYMA). Tanı gücü daha zayıftır;
   * rapor ekranları isterse bunları ayrı sayabilir.
   */
  readonly birincil: boolean;
}

export interface CeldiriciSonucu {
  readonly celdiriciler: readonly SayisalCeldirici[];
  /** İstenen adet üretilebildi mi. */
  readonly tam: boolean;
  /** Üretilemeyen çeldirici sayısı (`adet - celdiriciler.length`). */
  readonly eksik: number;
  /** Aralık/bağlam yüzünden hiçbir aday veremeyen etiketler. */
  readonly kullanilamayanHatalar: readonly HataEtiketi[];
  /** İnsan okur açıklama — yalnız `tam === false` ya da yedek kullanıldıysa dolu. */
  readonly not?: string;
}

export type YedekStrateji =
  /** Doğrunun etrafından dışa doğru komşu değerler; yön bazlı etiketlenir. */
  | 'yakinKomsu'
  /** Yedek yok — eksik kalır ve `tam:false` döner. */
  | 'yok';

export interface CeldiriciSecenekleri {
  readonly baglam?: CeldiriciBaglami;
  readonly yedekStrateji?: YedekStrateji;
}

/**
 * SAYISAL ÇELDİRİCİ ÜRETİCİSİ.
 *
 * Garantiler:
 *  - Tüm çeldiriciler TAM SAYIDIR.
 *  - Hepsi `aralik` İÇİNDEDİR (her iki uç dâhil).
 *  - Hiçbiri `dogruCevap`a EŞİT DEĞİLDİR.
 *  - Kendi aralarında BENZERSİZDİR.
 *
 * KENAR DURUM DAVRANIŞI — sessiz hata YOK:
 *
 *  · `dogruCevap = 0`, etiket `EKSIK_SAYMA` → doğal aday −1, aralık dışı.
 *    Bu etiket ÜRETİLMEZ; `kullanilamayanHatalar` içinde raporlanır. Yerine
 *    yedek strateji devreye girer ve doğrudan BÜYÜK bir komşu üretir; o komşu
 *    dürüstçe `FAZLA_SAYMA` etiketiyle (birincil:false) döner. Uydurma bir
 *    "eksik sayma" etiketi iliştirilmez.
 *
 *  · `dogruCevap = 20`, etiket `FAZLA_SAYMA` → doğal aday 21, 0–20 aralığının
 *    dışında. Aynı şekilde raporlanır; yedek aşağı yönde komşu üretir ve
 *    `EKSIK_SAYMA` etiketiyle döner.
 *
 *  · Aralık istenen kadar farklı değer barındırmıyorsa (ör. 0–2 aralığında 3
 *    çeldirici) sonuç `tam:false`, `eksik:n` ile döner. ÇAĞIRAN TARAF şık
 *    sayısını düşürmek zorundadır. Sessizce daha az şık üretilmez, `not`
 *    alanında ne olduğu yazar. Hata fırlatan sürüm için
 *    `sayisalCeldiricilerKesin` kullanın.
 *
 * @param dogruCevap  Doğru cevap (tam sayı, tercihen aralık içinde).
 * @param hataTipleri Denenecek hata etiketleri, ÖNCELİK SIRASIYLA.
 * @param aralik      Geçerli değer aralığı (kapalı).
 * @param adet        İstenen çeldirici sayısı.
 * @param rng         Tohumlu üreteç — `Math.random` yasak.
 */
export function sayisalCeldiriciler(
  dogruCevap: number,
  hataTipleri: readonly HataEtiketi[],
  aralik: SayiAraligi,
  adet: number,
  rng: Rng,
  secenekler: CeldiriciSecenekleri = {},
): CeldiriciSonucu {
  if (!Number.isInteger(dogruCevap)) {
    throw new Error(`sayisalCeldiriciler: dogruCevap tam sayı olmalı (${dogruCevap}).`);
  }
  if (!Number.isInteger(adet) || adet < 0) {
    throw new Error(`sayisalCeldiriciler: adet negatif olmayan tam sayı olmalı (${adet}).`);
  }
  if (aralik.min > aralik.max) {
    throw new Error(`sayisalCeldiriciler: geçersiz aralık (${aralik.min}..${aralik.max}).`);
  }

  const baglam = secenekler.baglam ?? {};
  const yedek = secenekler.yedekStrateji ?? 'yakinKomsu';

  const sonuc: SayisalCeldirici[] = [];
  const kullanilan = new Set<number>([dogruCevap]);
  const kullanilamayan: HataEtiketi[] = [];
  const notlar: string[] = [];

  // 1) Önce istenen hata tiplerini sırayla dene. Her etiket EN FAZLA BİR
  //    çeldirici üretir; aynı yanılgıyı iki şıkla göstermek tanıyı bulanıklaştırır.
  for (const etiket of hataTipleri) {
    if (sonuc.length >= adet) break;

    const aday = adaylar(etiket, dogruCevap, aralik, baglam, rng).find(
      (v) => araliktaMi(v, aralik) && !kullanilan.has(v),
    );

    if (aday == null) {
      kullanilamayan.push(etiket);
      continue;
    }
    kullanilan.add(aday);
    sonuc.push({ deger: aday, etiket, birincil: true });
  }

  if (kullanilamayan.length > 0) {
    notlar.push(
      `Aralık (${aralik.min}..${aralik.max}) veya bağlam eksikliği yüzünden ` +
        `üretilemeyen etiketler: ${kullanilamayan.join(', ')}.`,
    );
  }

  // 2) Eksik kaldıysa yedek strateji: doğrunun etrafından dışa doğru genişle.
  //    Etiket YÖNE göre atanır; böylece "20 için 19" gerçekten eksik sayma,
  //    "0 için 1" gerçekten fazla sayma olarak işaretlenir — uydurma değil.
  if (yedek === 'yakinKomsu') {
    const enGenisMesafe = Math.max(aralik.max - dogruCevap, dogruCevap - aralik.min);
    for (let mesafe = 1; mesafe <= enGenisMesafe && sonuc.length < adet; mesafe++) {
      // Yön sırası tohuma bağlı: hep aynı taraftan başlanırsa çeldiriciler
      // her soruda doğrunun aynı yanında toplanır ve çocuk kalıbı ezberler.
      const yonler = rng.bool() ? [1, -1] : [-1, 1];
      for (const yon of yonler) {
        if (sonuc.length >= adet) break;
        const v = dogruCevap + yon * mesafe;
        if (!araliktaMi(v, aralik) || kullanilan.has(v)) continue;
        kullanilan.add(v);
        sonuc.push({
          deger: v,
          etiket: yon > 0 ? 'FAZLA_SAYMA' : 'EKSIK_SAYMA',
          birincil: false,
        });
      }
    }
    if (sonuc.some((c) => !c.birincil)) {
      notlar.push('Bazı çeldiriciler yedek strateji (yakinKomsu) ile üretildi.');
    }
  }

  const eksik = adet - sonuc.length;
  if (eksik > 0) {
    notlar.push(
      `İstenen ${adet} çeldiriciden ${eksik} tanesi üretilemedi: ` +
        `${aralik.min}..${aralik.max} aralığında doğru cevap dışında yeterli ` +
        `farklı değer yok. Çağıran taraf şık sayısını düşürmelidir.`,
    );
  }

  return {
    celdiriciler: sonuc,
    tam: eksik === 0,
    eksik: Math.max(eksik, 0),
    kullanilamayanHatalar: kullanilamayan,
    not: notlar.length > 0 ? notlar.join(' ') : undefined,
  };
}

/**
 * `sayisalCeldiriciler`in KATI sürümü: istenen adet üretilemezse fırlatır.
 *
 * Jeneratörlerde bunu kullanın. Bir soru eksik şıkla ekrana gelmemeli; şablonun
 * sayı aralığı zaten şık sayısını karşılayacak biçimde seçilmiş olmalı. Fırlayan
 * hata, testte anında görünür ve şablon parametreleri düzeltilir.
 */
export function sayisalCeldiricilerKesin(
  dogruCevap: number,
  hataTipleri: readonly HataEtiketi[],
  aralik: SayiAraligi,
  adet: number,
  rng: Rng,
  secenekler: CeldiriciSecenekleri = {},
): readonly SayisalCeldirici[] {
  const s = sayisalCeldiriciler(dogruCevap, hataTipleri, aralik, adet, rng, secenekler);
  if (!s.tam) {
    throw new Error(
      `sayisalCeldiricilerKesin: ${adet} çeldirici istendi, ${s.celdiriciler.length} üretildi. ` +
        (s.not ?? ''),
    );
  }
  return s.celdiriciler;
}

// ------------------------------------------------------------- şıkka çevirme

/**
 * Doğru cevabı ve çeldiricileri karıştırılmış bir şık dizisine çevirir.
 *
 * "Tanı etiketi YALNIZ yanlış şıkta" kuralı burada tek noktadan uygulanır:
 * doğru şık `correct:true` ile ve etiketsiz kurulur (tip düzeyinde de zorunlu),
 * çeldiriciler kendi etiketlerini taşır.
 */
export function celdiricileriSikaCevir(
  dogruCevap: number,
  celdiriciler: readonly SayisalCeldirici[],
  rng: Rng,
  degerYap: (n: number) => OptionDeger = (n) => ({ tur: 'sayi', sayi: n }),
): readonly Option[] {
  const dogruSik: Option = {
    id: `sik-d-${dogruCevap}`,
    deger: degerYap(dogruCevap),
    correct: true,
  };

  const yanlisSiklar: Option[] = celdiriciler.map((c) => ({
    id: `sik-y-${c.deger}`,
    deger: degerYap(c.deger),
    diagnosticTag: c.etiket,
  }));

  return rng.shuffle([dogruSik, ...yanlisSiklar]);
}
