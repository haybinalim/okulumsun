import type {
  KonumIliskisi,
  NesneSprite,
  OptionDeger,
  Renk,
  SekilAdi,
  VisualSpec,
  YonKartiYonu,
} from '../../exercises/types';

/**
 * Çocuk ekranındaki seçenekler çoğunlukla görseldir; bu nedenle erişilebilir
 * ad, dosya adı ya da belirsiz "görsel seçenek" olmamalıdır. Bu yardımcı
 * aynı görsel sözleşmesini tüm kartlarda kısa ve somut Türkçe ile açıklar.
 */
export function secenekErisimEtiketi(deger: OptionDeger): string {
  switch (deger.tur) {
    case 'sayi':
      return `Seçenek: ${deger.sayi}`;
    case 'gorsel':
      return `Seçenek: ${gorselErisimEtiketi(deger.gorsel)}`;
    case 'sekil':
      return `Seçenek: ${sekilAdi(deger.sekil)}`;
    case 'sekilKategorisi':
      return `Seçenek: ${deger.kategori === 'yuvarlak' ? 'yuvarlak şekil' : 'köşeli şekil'}`;
    case 'banknot':
      return `Seçenek: ${deger.deger} Türk lirası banknotu`;
    case 'terim':
      return `Seçenek: ${terimAdi(deger.terim)}`;
    case 'metin':
      return `Seçenek: ${deger.metin}`;
  }
}

export function gorselErisimEtiketi(gorsel: VisualSpec): string {
  switch (gorsel.type) {
    case 'nesneKumesi': {
      const renk = gorsel.renk ? `${renkAdi(gorsel.renk)} ` : '';
      return `${gorsel.adet} ${renk}${nesneAdi(gorsel.sprite)}`;
    }
    case 'onlukCerceve':
      return `onluk çerçevede ${gorsel.gruplar.reduce((toplam, adet) => toplam + adet, 0)} dolu göz`;
    case 'sayiDogrusu':
      return `sayı doğrusunda ${gorsel.isaretli.join(', ') || 'işaretli sayı yok'}`;
    case 'sekil': {
      const renk = gorsel.renk ? `${renkAdi(gorsel.renk)} ` : '';
      return `${renk}${sekilAdi(gorsel.sekil)}`;
    }
    case 'rakam':
      return `${gorsel.sayi} rakamı`;
    case 'banknot':
      return `${gorsel.deger} Türk lirası banknotu`;
    case 'islemSahnesi':
      return gorsel.islem === '+'
        ? `${gorsel.ilkAdet} ${nesneAdi(gorsel.nesne)}, ${gorsel.degisimAdedi} ${nesneAdi(gorsel.nesne)} daha ekleniyor`
        : `${gorsel.ilkAdet} ${nesneAdi(gorsel.nesne)}, ${gorsel.degisimAdedi} ${nesneAdi(gorsel.nesne)} ayrılıyor`;
    case 'islemKarti':
      return `${gorsel.ilkSayi} ${gorsel.islem === '+' ? 'artı' : 'eksi'} ${gorsel.ikinciSayi}, sonuç ${gorsel.sonuc}`;
    case 'olcumSahnesi':
      return `${nesneAdi(gorsel.nesne)}, ${gorsel.birimAdedi} ${nesneAdi(gorsel.birim)} birimi uzunluğunda`;
    case 'olcumKarsilastirma':
      return `${renkAdi(gorsel.sol.renk)} ${nesneAdi(gorsel.sol.nesne)} ve ${renkAdi(gorsel.sag.renk)} ${nesneAdi(gorsel.sag.nesne)} karşılaştırması`;
    case 'oruntu':
      return `${gorsel.ogeler.length} öğelik örüntü`;
    case 'yonKarti':
      return `${gorsel.adim} adım ${yonAdi(gorsel.yon)}`;
    case 'konumSahnesi':
      return `${nesneAdi(gorsel.hedef)} ${referansAdi(gorsel.referans)} ${iliskiAdi(gorsel.iliski)}`;
    case 'sahne':
      return `${gorsel.parcalar.length} parçalı görsel sahne`;
  }
}

function nesneAdi(sprite: NesneSprite): string {
  const adlar: Record<NesneSprite, string> = {
    elma: 'elma',
    top: 'top',
    balon: 'balon',
    araba: 'araba',
    kalem: 'kalem',
    kus: 'kuş',
    cicek: 'çiçek',
    yildiz: 'yıldız',
    balik: 'balık',
    kelebek: 'kelebek',
  };
  return adlar[sprite];
}

function renkAdi(renk: Renk): string {
  const adlar: Record<Renk, string> = {
    mor: 'mor',
    turuncu: 'turuncu',
    yesil: 'yeşil',
    mavi: 'mavi',
    pembe: 'pembe',
    sari: 'sarı',
  };
  return adlar[renk];
}

function sekilAdi(sekil: SekilAdi): string {
  const adlar: Record<SekilAdi, string> = {
    ucgen: 'üçgen',
    kare: 'kare',
    dikdortgen: 'dikdörtgen',
    cember: 'çember',
  };
  return adlar[sekil];
}

function yonAdi(yon: YonKartiYonu): string {
  const adlar: Record<YonKartiYonu, string> = {
    ileri: 'ileri',
    geri: 'geri',
    saga: 'sağa',
    sola: 'sola',
  };
  return adlar[yon];
}

function iliskiAdi(iliski: KonumIliskisi): string {
  const adlar: Record<KonumIliskisi, string> = {
    altinda: 'altında',
    ustunde: 'üstünde',
    icinde: 'içinde',
    onunde: 'önünde',
    arkasinda: 'arkasında',
    arasinda: 'arasında',
    yaninda: 'yanında',
    disinda: 'dışında',
  };
  return adlar[iliski];
}

function referansAdi(referans: 'kutu' | 'sepet'): string {
  return referans === 'kutu' ? 'kutunun' : 'sepetin';
}

function terimAdi(terim: 'cok' | 'daha-cok' | 'az' | 'daha-az' | 'esit'): string {
  const adlar: Record<typeof terim, string> = {
    cok: 'çok',
    'daha-cok': 'daha çok',
    az: 'az',
    'daha-az': 'daha az',
    esit: 'eşit',
  };
  return adlar[terim];
}
