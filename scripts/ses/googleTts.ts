/**
 * Google Cloud Text-to-Speech, Chirp 3 HD `tr-TR` — derleme anı istemcisi (Adım 18, KG-01..KG-05).
 *
 * YALNIZ geliştirici makinesinde `npm run audio` sırasında çağrılır; uygulama
 * çalışırken hiçbir ses servisine istek gitmez (KG-02, Sıfır Veri Sözleşmesi 3 ve 7).
 * Sağlayıcıya yalnız `src/content/tr.json` metinleri gider; öğrenci verisi yoktur.
 *
 * Anahtar: `GOOGLE_TTS_API_KEY` (ortam değişkeni veya gitignore'daki `.env.local`).
 * Anahtar yalnız Text-to-Speech API ile sınırlı olmalı; depoya, CI'ya, günlüğe girmez (KG-03).
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

const UC_NOKTA = 'https://texttospeech.googleapis.com/v1/text:synthesize';

/**
 * Ağ çağrısı (derleme anı). WAV (LINEAR16, başlıklı) baytlarını döndürür.
 * Anahtar URL yerine `X-Goog-Api-Key` başlığında gider; hata iletisine anahtar yazılmaz.
 */
export async function googleSentezle(istek: GoogleIstegi, anahtar: string): Promise<Buffer> {
  if (!anahtar) throw new Error('GOOGLE_TTS_API_KEY tanımlı değil (.env.local veya ortam değişkeni).');
  const yanit = await fetch(UC_NOKTA, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'X-Goog-Api-Key': anahtar },
    body: JSON.stringify(istek),
  });
  if (!yanit.ok) {
    const govde = (await yanit.text()).slice(0, 300);
    throw new Error(`Google TTS ${yanit.status}: ${govde}`);
  }
  const { audioContent } = (await yanit.json()) as { audioContent?: string };
  if (!audioContent) throw new Error('Google TTS yanıtında ses yok.');
  return Buffer.from(audioContent, 'base64');
}
