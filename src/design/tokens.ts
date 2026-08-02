/**
 * Tasarım tokenleri — tüm ölçek, renk ve zamanlama tek kaynaktan.
 *
 * Buradaki sayılar keyfi değil; plan §3.4 ve §9'daki gerekçelere dayanıyor:
 * - Dokunma hedefleri iOS'un 44pt standardından büyük, çünkü 6-7 yaş ince motor
 *   kontrolü gelişmemiş ve akıllı tahtalarda IR dokunma birkaç santim kayabiliyor.
 * - Renkler tek başına anlam taşımaz; her ayrım en az üç kanaldan gelir.
 *
 * Fiziksel akıllı tahta testi yapıldığında (2. ay) ayar gerekirse SADECE bu dosya
 * ve deviceProfile.ts değişmeli — bileşenler ham piksel yazmaz.
 */

/** Cihaz profiline göre tüm uzunlukların çarpanı. */
export const SCALE = {
  board: 1.6,
  tablet: 1.0,
  phone: 0.75,
} as const;

export type DeviceProfile = keyof typeof SCALE;

/**
 * Ölçeklenen uzunluklar — `tablet` profilindeki temel değerler (px).
 * Çalışma anında `--u-*` CSS değişkenleri olarak profile göre çarpılır.
 */
export const SIZE = {
  /** Herhangi bir dokunulabilir öğenin mutlak alt sınırı. */
  tapMin: 64,
  /** İkincil kontroller: geri, tekrar dinle, yardım. */
  control: 88,
  /** Cevap seçeneği kartı. */
  choiceMin: 150,
  choice: 200,
  /** Birincil eylem (Onayla). */
  primary: 140,
  /** Maskot / yardım hedefi. */
  mascot: 104,
  /** Ses kilidi ekranındaki tek büyük daire. */
  unlock: 240,

  /** Dokunma hedefleri arası minimum boşluk. */
  gap: 32,
  gapTight: 24,
  /** Ekran kenarı ölü bölgesi — avuç içi teması ve sistem jestleri için. */
  edge: 24,
  /** Alt kenar: iOS home indicator + Android jest çubuğu. */
  edgeBottom: 40,

  /**
   * IR akıllı tahtalarda kalibrasyon kayması için görünmez taşma.
   * Görsel sınır değişmez, dokunma alanı her yönde bu kadar büyür.
   */
  touchBleed: 16,
} as const;

/** Tipografi ölçeği (px, `tablet` temelinde). */
export const TEXT = {
  /** Uyaran: rakam, şekil etiketi. Ekran yüksekliğinin ~%25'i hedeflenir. */
  stimulus: 160,
  choiceLabel: 40,
  ui: 28,
  /** Mutlak minimum — bunun altına hiçbir metin inmez. */
  min: 24,
  /** Veli paneli gibi yetişkin ekranları. */
  adult: 18,
} as const;

/**
 * Renk paleti.
 *
 * Kırmızı bilerek yok: yanlış cevap hiçbir koşulda cezalandırıcı gösterilmez
 * (plan §7.1). Amber "tekrar dene" anlamına gelir, "hata" değil.
 */
export const COLOR = {
  /** Saf beyaz akıllı tahtada parlar. */
  bg: '#FFFDF8',
  surface: '#FFFFFF',
  /** Saf siyah değil — sert kontrast yorar. */
  ink: '#2B2B2B',
  inkSoft: '#6B6B6B',
  border: '#E2DED4',

  correct: '#16A34A',
  correctSoft: '#DCFCE7',
  /** "Tekrar dene" — kırmızı ASLA kullanılmaz. */
  retry: '#F59E0B',
  retrySoft: '#FEF3C7',

  /** Klavye / switch erişimi için odak halkası. */
  focus: '#1D4ED8',

  mascot: '#F97316',
} as const;

/** Öğrencinin seçebileceği vurgu renkleri (profil kişiselleştirme). */
export type Accent = (typeof ACCENTS)[number];

export const ACCENTS = [
  { id: 'mor', hex: '#7C3AED', speechKey: 'renk.mor' },
  { id: 'turuncu', hex: '#EA580C', speechKey: 'renk.turuncu' },
  { id: 'yesil', hex: '#059669', speechKey: 'renk.yesil' },
  { id: 'mavi', hex: '#2563EB', speechKey: 'renk.mavi' },
  { id: 'pembe', hex: '#DB2777', speechKey: 'renk.pembe' },
  { id: 'sari', hex: '#CA8A04', speechKey: 'renk.sari' },
] as const;

/** Animasyon süreleri (ms). `prefers-reduced-motion` hepsini 0'a indirir. */
export const MOTION = {
  /** Doğru cevap kutlaması — kısa, çünkü 8 soruda 8 kez tekrarlanıyor. */
  correct: 500,
  retry: 400,
  screen: 300,
  /** Oturum sonu konfetisi. */
  celebrate: 1500,
  /** Aynı bölgede yanlışlıkla çift dokunmayı engelleyen soğuma. */
  tapCooldown: 250,
} as const;

/**
 * Yardım kademeleri arası bekleme (ms).
 * Çocuk ekranda takılıp kalamaz — istemese de yardım gelir.
 */
export const HELP_DELAY = {
  level1: 15_000,
  level2: 30_000,
  level3: 30_000,
} as const;

/**
 * Akıllı tahta erişim bölgesi.
 *
 * 86" tahtada 1. sınıf öğrencisi ekranın üstüne fiziksel olarak ulaşamaz.
 * Üst bu oran yalnız uyaran alanıdır; hiçbir dokunulabilir öğe oraya konmaz.
 * Playwright testi bu kuralı otomatik doğrular (plan §13).
 */
export const REACH = {
  /** Ekranın üstten bu kadarı dokunulamaz bölge. */
  deadTopRatio: 0.35,
} as const;

/** Bir oturumdaki soru sayısı — 6-7 yaş dikkat süresi ~5-7 dakika. */
export const SESSION_LENGTH = 8;
