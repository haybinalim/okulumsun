/**
 * DERS PAKETİ KAYIT DEFTERİ (ADR-0011 Seçenek 1, ADR-0016; Okuma Yazma planı Adım 61).
 *
 * Tek uygulama, ders başına paket. Matematik paketi mevcut yollarında kalır (taşıma davranış kazancı
 * getirmediği için ayrı bir işe bırakıldı); Türkçe paketi geliştirmededir ve yalnız `VITE_DERS_TUR=1`
 * derlemesinde yüklenir. Bu modül SAF veridir; uygulama girişi onu içe aktarmaz (üretim paketi değişmez),
 * doğrulayıcı (`npm run validate`), veri bütçesi (`npm run boyut:ders`) ve testler kullanır.
 */

export type DersKodu = 'mat' | 'tur';

export interface DersPaketi {
  readonly kod: DersKodu;
  readonly ad: string;
  /** Müfredat sınırları belgesi — ihlal edilemez (PLAN §0 kural 1). */
  readonly kisitBelgesi: string;
  /** `yayinda`: üretim derlemesinde; `gelistirme`: yalnız derleme bayrağıyla. */
  readonly durum: 'yayinda' | 'gelistirme';
  /** Derleme bayrağı (yalnız `gelistirme` paketleri). */
  readonly bayrak?: 'VITE_DERS_TUR';
  /** JS dışı ders verisinin depo içindeki kökü (ADR-0016); matematikte veri modüle gömülüdür (KG-87). */
  readonly veriKoku?: string;
  /** Veri `dist/` içinde bu yolun altına kopyalanır ve çalışma anında aynı kökenden okunur. */
  readonly yayinYolu?: string;
}

export const DERSLER: Readonly<Record<DersKodu, DersPaketi>> = {
  mat: { kod: 'mat', ad: 'Matematik', kisitBelgesi: 'docs/mufredat-kisitlari.md', durum: 'yayinda' },
  tur: {
    kod: 'tur',
    ad: 'Okuma Yazma',
    kisitBelgesi: 'docs/mufredat-kisitlari-turkce.md',
    durum: 'gelistirme',
    bayrak: 'VITE_DERS_TUR',
    veriKoku: 'ders-verisi/tur',
    yayinYolu: 'tur',
  },
};

export const DERS_KODLARI: readonly DersKodu[] = ['mat', 'tur'];

/** Bayrak değerine göre derlemede açık dersler (saf; çağıran `import.meta.env`/`process.env` değerini verir). */
export function acikDersler(bayraklar: Readonly<Partial<Record<'VITE_DERS_TUR', string | undefined>>>): DersKodu[] {
  return DERS_KODLARI.filter((k) => {
    const p = DERSLER[k];
    return p.durum === 'yayinda' || (p.bayrak !== undefined && bayraklar[p.bayrak] === '1');
  });
}
