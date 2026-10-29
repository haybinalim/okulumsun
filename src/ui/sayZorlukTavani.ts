/**
 * M-SAY KÜÇÜK EKRAN ZORLUK TAVANI (plan v2 KG-131; kullanıcı kararı 2026-10-30) — saf, JSX'siz.
 *
 * 1080×810 sınıfı elle seçilen tahtada etkileşim alanı ≈ 1004 × 409 px; tapMin (102 px) nesnelerden en çok
 * 8–9 tanesi çakışmadan sığar. Zorluk 4–5'in 10–20 nesnesi geometrik olarak sığmaz. Karar: ÖLÇÜLEN yerleşim
 * maddeyi taşıyamıyorsa o soru için M-SAY zorluğu 3'e iner.
 *
 *  · Yalnız ekranda (TapCountScreen ölçümünden sonra) uygulanır: 1920 tahta ve tablet maddeyi zaten taşır,
 *    kâğıt/PDF ve etki Formu A/B bu ekrandan geçmez — hepsi değişmez.
 *  · Deterministik: aynı (madde, ölçü) → aynı tavanlı madde. Önce aynı tohum zorluk 3'te üretilir; zorluk 3'ün
 *    10 nesnesi de sığmıyorsa tohumdan türetilen yedek tohumlar sırayla denenir (KG-77 yedek tohum yöntemi).
 *    Şık sayısı ve nesne türü (sprite) korunur.
 *  · Kayıt: ustalık/adaptif motor düğüm zorluğuna (`SkillNode.difficulty`) dayanır, madde zorluğuna değil;
 *    cevap seçilen düğüme yazılır (doğru/yanlış ekranda gösterilen maddeye göre). M-SAY düğümleri ≤ 3
 *    olduğundan adaptif oturumda tavan devreye girmez; saklanan ilerlemenin anlamı değişmez.
 */
import { hash32, createRng } from '../exercises/rng';
import { uretSay, type SaySikSayisi } from '../exercises/templates/say';
import type { Difficulty, TapCountExercise } from '../exercises/types';
import { ekranDuzeni, type EkranOlculeri } from './svg/sayYerlesimi';

export const SAY_KUCUK_EKRAN_TAVANI: Difficulty = 3;
const YEDEK_DENEME = 8;

/** Ölçülen ekranda maddenin nesneleri tapMin hücreye (çakışmadan) sığıyor mu. */
export function saySigarMi(ex: TapCountExercise, o: Omit<EkranOlculeri, 'kartSayisi'>): boolean {
  const sahne = ex.prompt.gorsel;
  if (!sahne || sahne.type !== 'nesneKumesi') return true;
  return ekranDuzeni({ ...o, kartSayisi: ex.options.length }, sahne).yerlesim.hucre >= o.tapMin - 0.5;
}

/** Sığmayan zorluk 4–5 M-SAY maddesini zorluk 3'e indirir; diğer her durumda maddeyi aynen döndürür. */
export function sayZorlukTavani(ex: TapCountExercise, o: Omit<EkranOlculeri, 'kartSayisi'>): TapCountExercise {
  if (ex.templateId !== 'M-SAY' || ex.difficulty <= SAY_KUCUK_EKRAN_TAVANI || saySigarMi(ex, o)) return ex;
  const sahne = ex.prompt.gorsel;
  let ilk: TapCountExercise | null = null;
  for (let k = 0; k < YEDEK_DENEME; k++) {
    const seed = k === 0 ? ex.seed : hash32(`${ex.seed}:say-tavani:${k}`);
    const y = uretSay(
      {
        seed,
        difficulty: SAY_KUCUK_EKRAN_TAVANI,
        responseMode: 'tapThenPick',
        optionCount: ex.options.length as SaySikSayisi,
        sprite: sahne?.type === 'nesneKumesi' ? sahne.sprite : undefined,
      },
      createRng(seed),
    );
    if (y.kind !== 'TAP_COUNT') continue;
    ilk ??= y;
    if (saySigarMi(y, o)) return y;
  }
  return ilk ?? ex;
}
