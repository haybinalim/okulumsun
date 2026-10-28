/**
 * Google Cloud Text-to-Speech, Chirp 3 HD `tr-TR` — derleme anı istemcisi (Adım 18, KG-01..KG-05).
 *
 * YALNIZ geliştirici makinesinde `npm run audio` sırasında çağrılır; uygulama
 * çalışırken hiçbir ses servisine istek gitmez (KG-02, Sıfır Veri Sözleşmesi 3 ve 7).
 * Sağlayıcıya yalnız `src/content/tr.json` metinleri gider; öğrenci verisi yoktur.
 *
 * Anahtar: `GOOGLE_TTS_API_KEY` (ortam değişkeni veya gitignore'daki `.env.local`).
 * Anahtar yalnız Text-to-Speech API ile sınırlı olmalı; depoya, CI'ya, günlüğe girmez (KG-03).
 * Vekil modu (KG-107): anahtarı aradaki vekil ekliyorsa `GOOGLE_TTS_API_KEY=proxy` ve
 * `GOOGLE_TTS_UC_NOKTA=<vekilin bağlı olduğu Google uç noktası>`; Node'un vekili kullanması
 * için `NODE_USE_ENV_PROXY=1`. Yer tutucu modunda anahtar başlığı gönderilmez.
 *
 * Saf kısımlar (ad, model kimliği, istek gövdesi) testlenir; ağ çağrısı `googleSentezle`'dedir.
 * Kaynak: https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd (12 Eki 2026'da okundu).
 */

/** Chirp 3 HD ses adları (belge, 12 Eki 2026). Tam ad: `tr-TR-Chirp3-HD-<ad>`. */
export const CHIRP3_HD_SESLERI = [
  'Achernar', 'Achird', 'Algenib', 'Algieba', 'Alnilam', 'Aoede', 'Autonoe', 'Callirrhoe',
  'Charon', 'Despina', 'Enceladus', 'Erinome', 'Fenrir', 'Gacrux', 'Iapetus', 'Kore',
  'Laomedeia', 'Leda', 'Orus', 'Pulcherrima', 'Puck', 'Rasalgethi', 'Sadachbia', 'Sadaltager',
  'Schedar', 'Sulafat', 'Umbriel', 'Vindemiatrix', 'Zephyr', 'Zubenelgenubi',
] as const;

/** Örnek dinleme için varsayılan üç aday (iki kadın, bir erkek sesi; KG-25). */
export const VARSAYILAN_ORNEK_SESLER = ['Kore', 'Aoede', 'Puck'] as const;

/**
 * Konuşma hızı. 6 yaş için normalden ~%10 yavaş (PLAN §4: `say` için 158 kelime/dk ile aynı oran).
 * Chirp 3 HD hız denetimi belgeye göre "Preview" ve tüm dillerde var.
 */
export const VARSAYILAN_HIZ = 0.9;

const ONEK = 'tr-TR-Chirp3-HD-';
const MODEL_KIMLIGI = /^google:(tr-TR-Chirp3-HD-[A-Za-z]+)@(\d{4}-\d{2})$/;

/** Kısa addan (`Kore`) tam ses adını üretir; listede olmayan adı reddeder. */
export function googleSesAdi(kisaAd: string): string {
  const ad = kisaAd.startsWith(ONEK) ? kisaAd.slice(ONEK.length) : kisaAd;
  if (!(CHIRP3_HD_SESLERI as readonly string[]).includes(ad)) {
    throw new Error(`Bilinmeyen Chirp 3 HD sesi: ${kisaAd}`);
  }
  return `${ONEK}${ad}`;
}

/** `google:tr-TR-Chirp3-HD-Kore@2026-10` — ses ve üretim ayı özete girer. */
export function googleModelKimligi(kisaAd: string, yilAy: string): string {
  if (!/^\d{4}-\d{2}$/.test(yilAy)) throw new Error(`Üretim ayı YYYY-AA olmalı: ${yilAy}`);
  return `google:${googleSesAdi(kisaAd)}@${yilAy}`;
}

/** Model kimliğinden tam ses adını çıkarır (aktif kaynak `google` iken üretici kullanır). */
export function modelKimligindenSes(modelKimligi: string): string {
  const m = MODEL_KIMLIGI.exec(modelKimligi);
  if (!m) throw new Error(`Google model kimliği biçimi hatalı: ${modelKimligi}`);
  return googleSesAdi(m[1]);
}

export interface GoogleIstegi {
  readonly input: { readonly text: string };
  readonly voice: { readonly languageCode: 'tr-TR'; readonly name: string };
  readonly audioConfig: {
    readonly audioEncoding: 'LINEAR16';
    readonly sampleRateHertz: 24000;
    readonly speakingRate: number;
  };
}

/** `text:synthesize` istek gövdesi. Yalnız metin gider; SSML/markup kullanılmaz. */
export function googleIstegi(metin: string, sesAdi: string, hiz = VARSAYILAN_HIZ): GoogleIstegi {
  if (metin.trim() === '') throw new Error('Boş metin seslendirilemez.');
  // Belge: istek başına en çok 5.000 bayt.
  if (new TextEncoder().encode(metin).length > 5000) throw new Error('Metin 5.000 baytı aşıyor.');
  if (!(hiz >= 0.25 && hiz <= 2)) throw new Error(`Konuşma hızı 0.25–2 arasında olmalı: ${hiz}`);
  return {
    input: { text: metin },
    voice: { languageCode: 'tr-TR', name: googleSesAdi(sesAdi) },
    audioConfig: { audioEncoding: 'LINEAR16', sampleRateHertz: 24000, speakingRate: hiz },
  };
}

/** Varsayılan uç nokta (Google belgesi). */
export const VARSAYILAN_UC_NOKTA = 'https://texttospeech.googleapis.com/v1/text:synthesize';

/**
 * Anahtarı istemci yerine aradaki vekil sunucu ekliyorsa kullanılan yer tutucu (KG-107):
 * `GOOGLE_TTS_API_KEY=proxy` → `X-Goog-Api-Key` başlığı hiç gönderilmez.
 */
export const VEKIL_YER_TUTUCU = 'proxy';

/**
 * Uç nokta `GOOGLE_TTS_UC_NOKTA` ile değiştirilebilir (ör. anahtarı başlığa kendisi ekleyen bir
 * vekilin bağlı olduğu `https://texttospeech.clients6.google.com/v1/text:synthesize`). Yalnız https.
 */
export function ucNokta(ortam: Readonly<Record<string, string | undefined>> = process.env): string {
  const deger = ortam.GOOGLE_TTS_UC_NOKTA?.trim();
  if (!deger) return VARSAYILAN_UC_NOKTA;
  if (!/^https:\/\/[a-z0-9.-]+\.google(apis)?\.com\/v1(beta1)?\/text:synthesize$/.test(deger)) {
    throw new Error('GOOGLE_TTS_UC_NOKTA bir Google text:synthesize https adresi olmalı.');
  }
  return deger;
}

/** İstek başlıkları: yer tutucu modunda anahtar başlığı eklenmez (vekil ekler). */
export function istekBasliklari(anahtar: string): Record<string, string> {
  const basliklar: Record<string, string> = { 'Content-Type': 'application/json; charset=utf-8' };
  if (anahtar !== VEKIL_YER_TUTUCU) basliklar['X-Goog-Api-Key'] = anahtar;
  return basliklar;
}

/** 429 / 5xx için geri çekilme süresi (ms): 2, 4, 8, 16, 32 sn; `Retry-After` varsa o. */
export function geriCekilmeMs(deneme: number, retryAfter: string | null): number {
  const sn = retryAfter === null ? Number.NaN : Number.parseInt(retryAfter, 10);
  if (Number.isFinite(sn) && sn > 0) return Math.min(sn, 120) * 1000;
  return 2000 * 2 ** Math.min(deneme, 4);
}

/** Kalıcı sayılmadan önce en çok bu kadar geri çekilme (kota kalıcıysa betik durur). */
export const EN_COK_DENEME = 5;

const uyu = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Ücretsiz katman koruması (KG-109). Her denemeden ÖNCE `istekOncesi` çağrılır (bütçe yetmezse
 * fırlatır → istek gönderilmez); gönderilen her deneme, sonucu ne olursa olsun, `kaydet` ile
 * karakteriyle deftere yazılır (429/5xx yeniden denemeleri dahil, temkinli).
 */
export interface IstekKorumasi {
  istekOncesi(karakter: number, ne?: string): void;
  kaydet(karakter: number, istek?: number): unknown;
}

export interface SentezSecenekleri {
  /** Zorunlu: korumasız istek gönderilemez. */
  readonly koruma: IstekKorumasi;
  /** Testler için. */
  readonly fetchFn?: typeof fetch;
  readonly uyuFn?: (ms: number) => Promise<unknown>;
}

/**
 * Ağ çağrısı (derleme anı). WAV (LINEAR16, başlıklı) baytlarını döndürür.
 * Anahtar URL yerine `X-Goog-Api-Key` başlığında gider; hata iletisine anahtar yazılmaz.
 * 429 (Chirp3RequestsPerMinutePerProject) ve 5xx'te geri çekilip yeniden dener.
 */
export async function googleSentezle(
  istek: GoogleIstegi,
  anahtar: string,
  secenekler: SentezSecenekleri,
): Promise<Buffer> {
  const { koruma, fetchFn = fetch, uyuFn = uyu } = secenekler;
  if (!koruma) throw new Error('Ücretsiz katman koruması olmadan Google TTS isteği gönderilmez (KG-109).');
  if (!anahtar) throw new Error('GOOGLE_TTS_API_KEY tanımlı değil (.env.local veya ortam değişkeni).');
  const adres = ucNokta();
  // Google kuralı: girdi metnindeki tüm karakterler (boşluk dahil); UTF-16 sayımı temkinli.
  const karakter = istek.input.text.length;
  for (let deneme = 0; ; deneme++) {
    koruma.istekOncesi(karakter, deneme === 0 ? 'İstek' : `Yeniden deneme ${deneme}`);
    let yanit: Response;
    try {
      yanit = await fetchFn(adres, {
        method: 'POST',
        headers: istekBasliklari(anahtar),
        body: JSON.stringify(istek),
      });
    } finally {
      // Ağ hatasında da istek gitmiş olabilir: temkinli say.
      koruma.kaydet(karakter, 1);
    }
    if ((yanit.status === 429 || yanit.status >= 500) && deneme < EN_COK_DENEME) {
      await yanit.text();
      await uyuFn(geriCekilmeMs(deneme, yanit.headers.get('retry-after')));
      continue;
    }
    if (!yanit.ok) {
      const govde = (await yanit.text()).slice(0, 300);
      throw new Error(`Google TTS ${yanit.status}: ${govde}`);
    }
    const { audioContent } = (await yanit.json()) as { audioContent?: string };
    if (!audioContent) throw new Error('Google TTS yanıtında ses yok.');
    return Buffer.from(audioContent, 'base64');
  }
}
