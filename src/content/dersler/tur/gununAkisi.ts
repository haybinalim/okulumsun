/**
 * GÜNÜN AKIŞI — öğretmenin bir ses için ders basamakları (Okuma Yazma planı §2.4.11 madde 3, Adım 71). SAF.
 *
 * Basamaklar programın ses öğretimi sırasıdır (TYMM Türkçe 2026, ilk okuma yazma basamakları). Sıra öğretmence
 * değiştirilebilir (K-OY-20: öğretmen sırayı ve hızı yönetir). Sıra, sınıf düzeyi ayarın içinde 8 haneli bir dizgedir
 * ("12345678"); geçersiz dizge programdaki sıraya döner. Her basamak uygulamada var olan bir ekrana bağlanır ya da
 * yalnız öğretmen etkinliğidir; ses hissettirme (M-2) Dalga C'ye kalmıştır.
 */

export type AkisBasamakKodu = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';

/** Günün akışından açılan etkinlikler (Adım 79'da sesin yeri, eşleştirme, hece sayma, hatalı sözcük, harf avı eklendi). */
export type AkisSablonu = 'T-01' | 'T-04' | 'T-05' | 'T-07' | 'T-09' | 'T-16' | 'T-17' | 'T-18' | 'T-19' | 'T-20';

/** Basamağın açtığı ekran türü (ekran durumu kullanıcı arayüzünde kurulur; burada yalnız tür). */
export type AkisHedefi =
  | { readonly tur: 'dalgaC' }
  | { readonly tur: 'ogretmen' }
  | { readonly tur: 'etkinlik'; readonly sablonlar: readonly AkisSablonu[] }
  /** Yazılış gösterimi; `ekSablonlar` aynı basamakta açılabilen etkinlikler (Adım 79: harfi parçalardan kur, harf avı). */
  | { readonly tur: 'yazilis'; readonly ekSablonlar?: readonly AkisSablonu[] }
  | { readonly tur: 'kagit'; readonly kagitlar: readonly ('harf' | 'dikte' | 'gozlem')[] };

export interface AkisBasamagi {
  readonly kod: AkisBasamakKodu;
  readonly ad: string;
  readonly aciklama: string;
  readonly hedef: AkisHedefi;
}

export const AKIS_BASAMAKLARI: readonly AkisBasamagi[] = [
  { kod: '1', ad: 'Ses hissettirme', aciklama: 'Tekerleme ve koro (M-2)', hedef: { tur: 'dalgaC' } },
  {
    kod: '2',
    ad: 'Sesin geçtiği görseli seçme',
    aciklama: 'T-01; sesin yeri T-18, aynı sesle eşleştir T-19',
    hedef: { tur: 'etkinlik', sablonlar: ['T-01', 'T-18', 'T-19'] },
  },
  { kod: '3', ad: 'Örnekleme', aciklama: 'Öğretmen ve sınıf birlikte; uygulama gerekmez', hedef: { tur: 'ogretmen' } },
  {
    kod: '4',
    ad: 'Yazılış gösterimi',
    aciklama: 'Bugünkü sesin harfi, hamle hamle (M-1); harfi parçalardan kur T-09, harf avı T-20',
    hedef: { tur: 'yazilis', ekSablonlar: ['T-09', 'T-20'] },
  },
  { kod: '5', ad: 'Kesikli harf kâğıdı', aciklama: 'İzle, birleştir, bağımsız yaz', hedef: { tur: 'kagit', kagitlar: ['harf'] } },
  {
    kod: '6',
    ad: 'Hece ve sözcük',
    aciklama: 'T-04 hece kur, T-05 heceleri birleştir, T-17 hece say',
    hedef: { tur: 'etkinlik', sablonlar: ['T-04', 'T-05', 'T-17'] },
  },
  { kod: '7', ad: 'Dikte', aciklama: 'T-07; hatalı sözcüğü bul T-16', hedef: { tur: 'etkinlik', sablonlar: ['T-07', 'T-16'] } },
  {
    kod: '8',
    ad: 'Kâğıt ve gözlem formu',
    aciklama: 'Dikte sayfası ve puansız gözlem listesi',
    hedef: { tur: 'kagit', kagitlar: ['dikte', 'gozlem'] },
  },
];

export const PROGRAM_SIRASI = AKIS_BASAMAKLARI.map((b) => b.kod).join('');

const BASAMAK = new Map(AKIS_BASAMAKLARI.map((b) => [b.kod, b]));

/** Katı çözücü: her basamak tam bir kez geçmeli; değilse `null`. */
export function akisSirasiCoz(ham: unknown): readonly AkisBasamagi[] | null {
  if (typeof ham !== 'string' || ham.length !== AKIS_BASAMAKLARI.length) return null;
  const kodlar = [...ham];
  if (new Set(kodlar).size !== kodlar.length || !kodlar.every((k) => BASAMAK.has(k as AkisBasamakKodu))) return null;
  return kodlar.map((k) => BASAMAK.get(k as AkisBasamakKodu)!);
}

export function akisSirasiKodla(basamaklar: readonly AkisBasamagi[]): string {
  return basamaklar.map((b) => b.kod).join('');
}

/** `i`. basamağı `yon` kadar kaydırır (−1 yukarı, +1 aşağı); sınırda değişmez. */
export function basamakTasi(basamaklar: readonly AkisBasamagi[], i: number, yon: -1 | 1): readonly AkisBasamagi[] {
  const j = i + yon;
  if (i < 0 || i >= basamaklar.length || j < 0 || j >= basamaklar.length) return basamaklar;
  const yeni = [...basamaklar];
  [yeni[i], yeni[j]] = [yeni[j], yeni[i]];
  return yeni;
}
