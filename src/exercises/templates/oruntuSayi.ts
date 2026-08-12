/**
 * M-ORUNTU-SAYI — ARTAN/AZALAN SAYI ÖRÜNTÜSÜ
 * ====================================================================
 *
 * KAZANIM: MAT.1.1.6 — "Artan veya azanan sayı ve şekil örüntülerini
 * çözümleyebilme"
 *
 * Çocuk sayı örüntüsünde verilmeyen terimi bulur ve yerleştirir.
 * En çok 6 terim.
 *
 * ÖLÇTÜĞÜ MİKRO DÜĞÜMLER:
 *   · mat.oruntu.artan-sayi — artan sayı örüntüsü
 *   · mat.oruntu.azalan-sayi — azalan sayı örüntüsü
 *
 * MÜFREDAT SINIRI: 1-20 arası, adım 1-3 arası, en çok 6 terim.
 *
 * ÇELDİRİCİ ETİKETLERİ:
 *   · ORUNTU_FAZ — örüntünün fazını kaçırdı (bir adım ileri/geri kaydı)
 *   · FAZLA_SAYMA — yanlış adımla devam etti
 *   · ISLEM_YONU — artan/azalan karıştırdı
 *
 * ETKİLEŞİM: TAP_TO_PLACE — eksik terimi doğru yuvaya yerleştir.
 *   1 yuva: örüntünün eksik pozisyonu.
 *
 * SAF VE SENKRON.
 */

import { makeItemId, varsayilanIpuclari, type Difficulty, type KazanimKodu, type SkillId, type Yuva, type Option, type VisualSpec, type AssetSpec, type Prompt } from '../types';
import type { TapToPlaceExercise, ExerciseGenerator } from '../types';
import type { Rng } from '../rng';
import { HATA_ETIKETLERI, type HataEtiketi } from '../distractors';

export const ORUNTU_SAYI_TEMPLATE_ID = 'M-ORUNTU-SAYI' as const;


export interface OruntuSayiParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly mod?: 'tahta' | 'kisisel';
  /** Oturumun hedef becerisi belirliyse yön rastgele seçilmez. */
  readonly yon?: 'artan' | 'azalan';
}

export function oruntuSayiUret(params: OruntuSayiParams, rng: Rng): TapToPlaceExercise {
  const { seed, difficulty } = params;

  const yonRng = rng.fork('yon');
  const yon: 'artan' | 'azalan' = params.yon ?? yonRng.pick(['artan', 'azalan'] as const);

  // Adım: 1-3 arası, difficulty arttıkça büyük adım
  const adimRng = rng.fork('adim');
  const adim = adimRng.pick([1, 2, 3].slice(0, Math.min(difficulty, 3)) as readonly number[]);

  // Terim sayısı: 4-6 arası
  const terimSayisi = Math.min(4 + Math.floor(difficulty / 2), 6);

  // Başlangıç değeri
  const basRng = rng.fork('bas');
  const baslangic = yon === 'artan'
    ? basRng.int(1, 20 - (terimSayisi - 1) * adim)
    : basRng.int(1 + (terimSayisi - 1) * adim, 20);

  // Örüntüyü üret
  const terimler: number[] = [];
  for (let i = 0; i < terimSayisi; i++) {
    const deger = yon === 'artan'
      ? baslangic + i * adim
      : baslangic - i * adim;
    terimler.push(deger);
  }

  // Eksik pozisyon: ortada bir yer (ilk ve son değil)
  const eksikRng = rng.fork('eksik');
  const eksikIndeks = eksikRng.int(1, terimSayisi - 2);
  const dogruDeger = terimler[eksikIndeks];

  // Örüntü görseli — eksik pozisyon boş
  const oruntuOgeler: VisualSpec[] = terimler.map((t, i) => ({
    type: i === eksikIndeks ? 'rakam' : 'rakam',
    sayi: i === eksikIndeks ? -1 : t, // -1 = boş yuva işareti
  }));

  // Doğru kart
  const dogruKartId = 'kart-dogru';

  // Yanlış kartlar
  const celdiriciRng = rng.fork('celdirici');
  const yanlislar: { id: string; deger: number; etiket: HataEtiketi }[] = [];
  const kullanilan = new Set<number>([dogruDeger]);

  // Faz kayması: ±adım
  const fazYanlis = dogruDeger + adim;
  if (fazYanlis >= 1 && fazYanlis <= 20 && !kullanilan.has(fazYanlis)) {
    yanlislar.push({ id: 'kart-faz-1', deger: fazYanlis, etiket: HATA_ETIKETLERI.ORUNTU_FAZ });
    kullanilan.add(fazYanlis);
  }

  const fazYanlis2 = dogruDeger - adim;
  if (fazYanlis2 >= 1 && fazYanlis2 <= 20 && !kullanilan.has(fazYanlis2)) {
    yanlislar.push({ id: 'kart-faz-2', deger: fazYanlis2, etiket: HATA_ETIKETLERI.ORUNTU_FAZ });
    kullanilan.add(fazYanlis2);
  }

  // Yön karışıklığı: ters yön
  const tersYanlis = yon === 'artan' ? dogruDeger - adim * 2 : dogruDeger + adim * 2;
  if (tersYanlis >= 1 && tersYanlis <= 20 && !kullanilan.has(tersYanlis)) {
    yanlislar.push({ id: 'kart-yon', deger: tersYanlis, etiket: HATA_ETIKETLERI.ISLEM_YONU });
    kullanilan.add(tersYanlis);
  }

  // En az 2 yanlış kart olmalı
  while (yanlislar.length < 2) {
    let y: number;
    do {
      y = celdiriciRng.int(1, 20);
    } while (kullanilan.has(y));
    yanlislar.push({ id: `kart-rast-${y}`, deger: y, etiket: HATA_ETIKETLERI.FAZLA_SAYMA });
    kullanilan.add(y);
  }

  // Şık sayısı: difficulty'ye göre 2-4
  const secenekSayisi = Math.min(2 + Math.floor((difficulty - 1) / 2), 4);
  const secilenYanlislar = yanlislar.slice(0, secenekSayisi - 1);

  const options: Option[] = [
    {
      id: dogruKartId,
      deger: { tur: 'gorsel', gorsel: { type: 'rakam', sayi: dogruDeger } },
      correct: true,
    },
    ...secilenYanlislar.map((y) => ({
      id: y.id,
      deger: { tur: 'gorsel' as const, gorsel: { type: 'rakam' as const, sayi: y.deger } },
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
  const oruntuGorsel: VisualSpec = {
    type: 'oruntu',
    ogeler: oruntuOgeler,
    eksikIndeksler: [eksikIndeks],
  };

  const prompt: Prompt = {
    ses: { kind: 'key', key: 'oruntu.sirada-ne-var' },
    gorsel: oruntuGorsel,
  };

  const assets: readonly AssetSpec[] = options.map((o) => ({
    id: o.id,
    rol: 'secenek' as const,
    gorsel: (o.deger as { tur: 'gorsel'; gorsel: VisualSpec }).gorsel,
    erisimBolgesi: 'alt65' as const,
  }));

  const hints = varsayilanIpuclari({
    talimatSesi: { kind: 'key', key: 'oruntu.sirada-ne-var' },
    k2Ses: { kind: 'key', key: 'yardim.k2-eleme' },
    eleOptionIds: options.filter((o) => !('correct' in o && o.correct)).map((o) => o.id),
    vurgulaIds: [dogruKartId],
  });

  return {
    kind: 'TAP_TO_PLACE',
    itemId: makeItemId(ORUNTU_SAYI_TEMPLATE_ID, seed, `${yon}|${adim}|${baslangic}|${eksikIndeks}`),
    templateId: ORUNTU_SAYI_TEMPLATE_ID,
    skillIds: yon === 'artan'
      ? ['mat.oruntu.artan-sayi'] as readonly SkillId[]
      : ['mat.oruntu.azalan-sayi'] as readonly SkillId[],
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

export const oruntuSayiGenerator: ExerciseGenerator<OruntuSayiParams> = {
  templateId: ORUNTU_SAYI_TEMPLATE_ID,
  kind: 'TAP_TO_PLACE',
  karsilananKazanimlar: ['MAT.1.1.6'],
  karsilananSkillIds: ['mat.oruntu.artan-sayi', 'mat.oruntu.azalan-sayi'],
  readingLoad: 0,
  zorlukAraligi: [1, 5],
  uretebildigiHatalar: [HATA_ETIKETLERI.ORUNTU_FAZ, HATA_ETIKETLERI.FAZLA_SAYMA, HATA_ETIKETLERI.ISLEM_YONU],
  uret: oruntuSayiUret,
};
