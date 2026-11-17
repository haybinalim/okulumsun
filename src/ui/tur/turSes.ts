import { speech, type TurKlipAnahtari } from '../../audio/speech';
import { turKlipBasarisizMi, turKlipVarMi } from '../../content/dersler/tur/veriYukleyici';

/**
 * Türkçe etkinlik sesi — YALNIZ bayraklı derlemede (`VITE_DERS_TUR=1`).
 *
 * Şablonlar klip KİMLİĞİ ister (`tur.sozcuk.kale`, `tur.yonerge.t07`…). Çalma, matematikle AYNI `speech`
 * servisindedir (kuyruk, kesme, hız, hata kaydı); anahtarı çözen `src/content/dersler/tur/veriYukleyici.ts` `ders-verisi/tur/ses/
 * klipler.json`'dan (çalışmada `./tur/ses/klipler.json`) yalnız `durum: "var"` klipleri çalınabilir sayar.
 * KLİP BAŞINA karar: `eksik` klip sessiz kalır ve arayüz o istek için "Ses yok" gösterir (genel bayrak yok).
 * Harf kartları bu modülü HİÇ çağırmaz ve kart dokunuşu cevaptan önce klip istemez (D-11).
 */

/** D-11 / K-OY-03: yalnız `sozcuk|hece|cumle|yonerge|geri` klipleri; `tur.harf.*` gibi tek ünsüz anahtarı reddedilir. */
const CALINABILIR_ANAHTAR = /^tur\.(sozcuk|hece|cumle|yonerge|geri)\.[a-z0-9][a-z0-9-]*$/;

/** Türkçe klipler arası nefes payı (ms): yönerge ile sözcükler karışmasın (matematiğin 90 ms'si sayılar içindir). */
const TUR_KLIP_ARASI_MS = 300;

export interface TurSesSecenekleri {
  /** Ekran kapanınca istek iptal edilir (matematikteki `useScreenSpeech` ile aynı). */
  readonly signal?: AbortSignal;
  /** Ekran sorusu mu? (talimat tekrarı yalnız bunu yeniden söyler.) */
  readonly talimat?: boolean;
}

/**
 * Klipleri sırayla ister ve çalınabilir olanları çalar. `true` = HEPSİ çalınabildi; `false` = en az biri
 * sessiz kaldı (eksik, D-11'e aykırı, alınamayan ya da ses kilidi açık değil) ve "Ses yok" gösterilmeli.
 * Hiçbir koşulda fırlatmaz.
 */
export async function turKlipleriniIste(klipler: readonly string[], secenekler: TurSesSecenekleri = {}): Promise<boolean> {
  if (klipler.length === 0) return false;
  try {
    const gecerli = klipler.filter((k): k is TurKlipAnahtari => CALINABILIR_ANAHTAR.test(k));
    if (gecerli.length === 0) return false;
    const varMi = await Promise.all(gecerli.map((k) => turKlipVarMi(k)));
    if (secenekler.signal?.aborted) return false;
    const calinacak = gecerli.filter((_, i) => varMi[i]);
    // `eksik` klipler de servise gider: istek e2e kancasına yazılır, servis onları sessizce atlar.
    void speech.speak(
      { kind: 'sequence', keys: gecerli, gapMs: TUR_KLIP_ARASI_MS },
      { priority: 'high', signal: secenekler.signal, talimat: secenekler.talimat },
    );
    if (!speech.primed) return false;
    // Yükleme (paylaşılan) bitince alınamayan `var` klip için de "Ses yok" kalır: 404 sessizce "çaldı" sayılmaz.
    await speech.prefetch(calinacak);
    return gecerli.length === klipler.length && calinacak.length === gecerli.length && !calinacak.some((k) => turKlipBasarisizMi(k));
  } catch {
    return false;
  }
}

/** Etkinlik ekranı kapanırken: çalan/bekleyen Türkçe konuşmayı keser (matematikteki `useScreenSpeech` temizliği). */
export function turSesiniDurdur(): void {
  speech.stop();
  speech.talimatiUnut();
}
