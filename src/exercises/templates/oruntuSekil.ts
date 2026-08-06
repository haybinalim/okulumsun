/**
 * M-ORUNTU-SEKIL — TEKRAR EDEN ŞEKİL ÖRÜNTÜSÜ
 * ====================================================================
 *
 * KAZANIM: MAT.1.1.6 — "Artan veya azanan sayı ve şekil örüntülerini
 * çözümleyebilme"
 *
 * Çocuk tekrar eden şekil örüntüsünü sürdürür — eksik pozisyona doğru
 * şekli yerleştirir.
 *
 * ÖLÇTÜĞÜ MİKRO DÜĞÜMLER:
 *   · mat.oruntu.tekrar-eden-sekil — tekrar eden şekil örüntüsü
 *
 * MÜFREDAT SINIRI: 3-4 farklı şekil, 6-8 pozisyon, 1 eksik.
 *
 * ÇELDİRİCİ ETİKETLERİ:
 *   · ORUNTU_FAZ — örüntünün fazını kaçırdı
 *   · SEKIL_PROTOTIP — şekil karıştırdı
 *
 * ETKİLEŞİM: TAP_TO_PLACE — eksik şekli doğru yuvaya yerleştir.
 *
 * SAF VE SENKRON.
 */

import { makeItemId, varsayilanIpuclari, type Difficulty, type KazanimKodu, type SkillId, type Yuva, type Option, type VisualSpec, type AssetSpec, type Prompt, type SekilAdi, type Renk } from '../types';
import type { TapToPlaceExercise, ExerciseGenerator } from '../types';
import type { Rng } from '../rng';
import { HATA_ETIKETLERI, type HataEtiketi } from '../distractors';

export const ORUNTU_SEKIL_TEMPLATE_ID = 'M-ORUNTU-SEKIL' as const;

const SEKILLER: readonly SekilAdi[] = ['ucgen', 'kare', 'dikdortgen', 'cember'];
const RENKLER: readonly Renk[] = ['mor', 'turuncu', 'yesil', 'mavi', 'pembe', 'sari'];

export interface OruntuSekilParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly mod?: 'tahta' | 'kisisel';
}

export function oruntuSekilUret(params: OruntuSekilParams, rng: Rng): TapToPlaceExercise {
  const { seed, difficulty } = params;

  // Örüntü birimi: 2-3 şekil
  const birimRng = rng.fork('birim');
  const birimUzunlugu = birimRng.pick([2, 3].slice(0, Math.min(difficulty, 2)) as readonly number[]);

  // Şekil seç
  const sekilRng = rng.fork('sekil');
  const secilenSekiller = sekilRng.shuffle([...SEKILLER]).slice(0, birimUzunlugu);

  // Renk seç (her şekle sabit renk)
  const renkRng = rng.fork('renk');
  const secilenRenkler = renkRng.shuffle([...RENKLER]).slice(0, birimUzunlugu);

  // Toplam pozisyon: 6-8
  const toplamPozisyon = Math.min(6 + Math.floor(difficulty / 2), 8);

  // Örüntüyü üret
  const terimler: { sekil: SekilAdi; renk: Renk }[] = [];
  for (let i = 0; i < toplamPozisyon; i++) {
    const idx = i % birimUzunlugu;
    terimler.push({ sekil: secilenSekiller[idx], renk: secilenRenkler[idx] });
  }

  // Eksik pozisyon: ortada
  const eksikRng = rng.fork('eksik');
  const eksikIndeks = eksikRng.int(birimUzunlugu, toplamPozisyon - birimUzunlugu - 1);
  const dogruSekil = terimler[eksikIndeks].sekil;
  const dogruRenk = terimler[eksikIndeks].renk;

  // Doğru kart
  const dogruKartId = 'kart-dogru';

  // Yanlış kartlar
  const yanlislar: { id: string; sekil: SekilAdi; renk: Renk; etiket: HataEtiketi }[] = [];
  const kullanilan = new Set<string>([`${dogruSekil}|${dogruRenk}`]);

  // Faz kayması: örüntüde bir sonraki şekil
  const fazIdx = (eksikIndeks + 1) % birimUzunlugu;
  const fazSekil = secilenSekiller[fazIdx];
  const fazRenk = secilenRenkler[fazIdx];
  if (!kullanilan.has(`${fazSekil}|${fazRenk}`)) {
    yanlislar.push({ id: 'kart-faz', sekil: fazSekil, renk: fazRenk, etiket: HATA_ETIKETLERI.ORUNTU_FAZ });
    kullanilan.add(`${fazSekil}|${fazRenk}`);
  }

  // Önceki şekil
  const oncekiIdx = (eksikIndeks - 1 + birimUzunlugu) % birimUzunlugu;
  const oncekiSekil = secilenSekiller[oncekiIdx];
  const oncekiRenk = secilenRenkler[oncekiIdx];
  if (!kullanilan.has(`${oncekiSekil}|${oncekiRenk}`)) {
    yanlislar.push({ id: 'kart-onceki', sekil: oncekiSekil, renk: oncekiRenk, etiket: HATA_ETIKETLERI.ORUNTU_FAZ });
    kullanilan.add(`${oncekiSekil}|${oncekiRenk}`);
  }

  // Farklı renk, aynı şekil
  const farkliRenk = RENKLER.find((r) => r !== dogruRenk && !kullanilan.has(`${dogruSekil}|${r}`));
  if (farkliRenk) {
    yanlislar.push({ id: 'kart-renk', sekil: dogruSekil, renk: farkliRenk, etiket: HATA_ETIKETLERI.SEKIL_PROTOTIP });
    kullanilan.add(`${dogruSekil}|${farkliRenk}`);
  }

  // Şık sayısı
  const secenekSayisi = Math.min(2 + Math.floor((difficulty - 1) / 2), 4);
  const secilenYanlislar = yanlislar.slice(0, secenekSayisi - 1);

  const options: Option[] = [
    {
      id: dogruKartId,
      deger: { tur: 'gorsel', gorsel: { type: 'sekil', sekil: dogruSekil, renk: dogruRenk } },
      correct: true,
    },
    ...secilenYanlislar.map((y) => ({
      id: y.id,
      deger: { tur: 'gorsel' as const, gorsel: { type: 'sekil' as const, sekil: y.sekil, renk: y.renk } },
      correct: false as const,
      diagnosticTag: y.etiket,
    })),
  ];

  // Karıştır
  const siraRng = rng.fork('sira');
  const karistirilmis = siraRng.shuffle([...options]);
  options.splice(0, options.length, ...karistirilmis);

  const yuvalar: readonly Yuva[] = [
    { id: 'yuva-eksik', konum: { x: 0.5, y: 0.5 }, bekleyen: 'gorsel' },
  ];

  // Örüntü görseli
  const oruntuOgeler: VisualSpec[] = terimler.map((t, i) => ({
    type: i === eksikIndeks ? 'sekil' : 'sekil',
    sekil: t.sekil,
    renk: t.renk,
  }));

  const oruntuGorsel: VisualSpec = {
    type: 'oruntu',
    ogeler: oruntuOgeler,
    eksikIndeksler: [eksikIndeks],
  };

  const prompt: Prompt = {
    ses: { kind: 'key', key: 'oruntu.devam-ettir' },
    gorsel: oruntuGorsel,
  };

  const assets: readonly AssetSpec[] = options.map((o) => ({
    id: o.id,
    rol: 'secenek' as const,
    gorsel: (o.deger as { tur: 'gorsel'; gorsel: VisualSpec }).gorsel,
    erisimBolgesi: 'alt65' as const,
  }));

  const hints = varsayilanIpuclari({
    talimatSesi: { kind: 'key', key: 'oruntu.devam-ettir' },
    k2Ses: { kind: 'key', key: 'yardim.k2-eleme' },
    eleOptionIds: options.filter((o) => !('correct' in o && o.correct)).map((o) => o.id),
    vurgulaIds: [dogruKartId],
  });

  return {
    kind: 'TAP_TO_PLACE',
    itemId: makeItemId(ORUNTU_SEKIL_TEMPLATE_ID, seed, `${birimUzunlugu}|${eksikIndeks}`),
    templateId: ORUNTU_SEKIL_TEMPLATE_ID,
    skillIds: ['mat.oruntu.tekrar-eden-sekil'] as readonly SkillId[],
    kazanimKodlari: ['MAT.1.1.6'] as readonly KazanimKodu[],
    readingLoad: 0,
    difficulty,
    estimatedSec: 15,
    prompt,
    hints,
    assets,
    options,
    yuvalar,
    validation: {
      mod: 'yerlesim',
      dogruEslesme: { 'yuva-eksik': dogruKartId },
      siraOnemli: false,
    },
    seed,
  };
}

export const oruntuSekilGenerator: ExerciseGenerator<OruntuSekilParams> = {
  templateId: ORUNTU_SEKIL_TEMPLATE_ID,
  kind: 'TAP_TO_PLACE',
  karsilananKazanimlar: ['MAT.1.1.6'],
  karsilananSkillIds: ['mat.oruntu.tekrar-eden-sekil'],
  readingLoad: 0,
  zorlukAraligi: [1, 5],
  uretebildigiHatalar: [HATA_ETIKETLERI.ORUNTU_FAZ, HATA_ETIKETLERI.SEKIL_PROTOTIP],
  uret: oruntuSekilUret,
};
