/**
 * İÇERİK BÜTÜNLÜĞÜ DOĞRULAYICISI — plan §15'in "projedeki en çok hata yakalayan
 * araç" dediği şey.
 *
 * Bu betik Zod ŞEMALARINI çalışma anında elle yazılmış JSON'lara uygular ve dosyalar
 * ARASI çapraz referansları yoklar. Şemaların `.superRefine` gövdeleri tek dosyanın
 * iç tutarlılığını denetler (ders saati toplamı, ön koşul döngüleri, vb.); buradaki
 * çapraz denetimler dosyalar birbirine bağlanmadan sessizce kopabilecek referansları
 * yakalar:
 *
 *   · kazanım ←→ beceri: her becerinin mebOutcomes alanı geçerli bir kazanım kodu mu?
 *     Müfredat kapsamı: 19 kazanımın HER BİRİ en az bir beceriye bağlı mı?
 *   · beceri ←→ şablon: 'hazir' düğümler yalnız UYGULANMIŞ şablonlara mı bağlı?
 *     (Uygulanmamış şablona 'hazir' demek planlayıcının o düğüm için soru üretememesi.)
 *   · beceri ←→ hata etiketi: her misconception geçerli bir HataEtiketi mi?
 *   · jeneratör ←→ içerik: her jeneratörün iddia ettiği kazanım/beceri kodları var mı?
 *   · misconceptions.json: hata listesi distractors.ts'teki 15 etiketle birebir aynı mı?
 *   · PLAN ←→ içerik: benzersiz şablon sayısı docs/PLAN.md'nin yazdığı sayıyla aynı mı?
 *     (Belgenin sessizce bayatlamasını yakalar — PLAN §18 iddia-1.)
 *
 * Kullanım: npm run validate
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { kazanimlariDogrula, kazanimHaritasi } from '../src/content/schema/kazanim';
import { skillGrafiniAyristir } from '../src/content/schema/skill';
import { TUM_HATA_ETIKETLERI } from '../src/exercises/distractors';
import { REGISTRY } from '../src/exercises/registry';
import type { ExerciseGenerator } from '../src/exercises/types';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel: string): unknown => JSON.parse(readFileSync(path.join(ROOT, rel), 'utf8'));

/** Uygulanmış jeneratörler — kayıt defterinden (§5.4) tek kaynaktan okunur. */
const JENERATORLER: readonly ExerciseGenerator[] = [...REGISTRY.values()];
const UYGULANMIS_SABLONLAR = new Set(JENERATORLER.map((g) => g.templateId));

/**
 * PLAN §5.2 / §18 iddia-1: skills.json'daki BENZERSİZ şablon sayısı.
 *
 * NEDEN burada bir sayı duruyor: plan bu sayıya dayanarak iş planı (§14 adım 10),
 * süre tahmini ve ses envanteri (§4.5) yazıyor. skills.json'a şablon eklenip plan
 * güncellenmezse belge sessizce yalan söyler — geçmişte tam olarak bu oldu
 * (plan 17 derken içerik 39'du). Bu denetim o sapmayı ilk commit'te yakalar.
 *
 * Sayı değiştiğinde AYNI commit'te güncellenmesi gerekenler:
 *   docs/PLAN.md §5.2 (şablon tablosu + toplam), §4.5, §14 adım 10, §18 tablosu
 *   docs/PROGRESS.md yol haritası satırı.
 */
const PLAN_SABLON_SAYISI = 39;

interface Sonuc {
  hatalar: string[];
  uyarilar: string[];
  istatistik: string[];
}
const sonuc: Sonuc = { hatalar: [], uyarilar: [], istatistik: [] };

function hata(m: string): void {
  sonuc.hatalar.push(m);
}

// ----------------------------------------------------------- kazanimlar.json
const kazanimHam = read('src/content/kazanimlar.json');
let kazanimKodlari = new Set<string>();
try {
  const dosya = kazanimlariDogrula(kazanimHam);
  const harita = kazanimHaritasi(dosya);
  kazanimKodlari = new Set(harita.keys());
  sonuc.istatistik.push(
    `kazanimlar.json: ${dosya.kazanimlar.length} kazanım · ${dosya.temalar.length} tema · ${dosya.toplamDersSaati} ders saati`,
  );
} catch (e) {
  hata(`kazanimlar.json: ${(e as Error).message}`);
}

// --------------------------------------------------------------- skills.json
const skillsHam = read('src/content/skills.json');
let beceriIdleri = new Set<string>();
try {
  const graf = skillGrafiniAyristir(skillsHam);
  beceriIdleri = new Set(graf.map((d) => d.id));
  const hazir = graf.filter((d) => d.durum === 'hazir').length;
  sonuc.istatistik.push(
    `skills.json: ${graf.length} beceri · ${hazir} hazır · ${graf.length - hazir} planlandı · ${graf.filter((d) => d.isEntryPoint).length} giriş noktası`,
  );

  // (a) her mebOutcomes geçerli kazanım kodu
  for (const d of graf) {
    for (const kod of d.mebOutcomes) {
      if (kazanimKodlari.size > 0 && !kazanimKodlari.has(kod)) {
        hata(`${d.id}: mebOutcomes '${kod}' kazanimlar.json'da yok.`);
      }
    }
  }

  // (b) müfredat kapsamı — 19 kazanımın her biri en az bir beceriye bağlı mı?
  const kapsanan = new Set<string>();
  for (const d of graf) for (const kod of d.mebOutcomes) kapsanan.add(kod);
  for (const kod of kazanimKodlari) {
    if (!kapsanan.has(kod)) hata(`Müfredat kapsamı: '${kod}' hiçbir beceriye bağlı değil.`);
  }

  // (c) her misconception geçerli hata etiketi
  const gecerliEtiketler = new Set<string>(TUM_HATA_ETIKETLERI);
  for (const d of graf) {
    for (const e of d.misconceptions) {
      if (!gecerliEtiketler.has(e)) {
        hata(`${d.id}: misconception '${e}' distractors.ts'te tanımlı bir etiket değil.`);
      }
    }
  }

  // (d) 'hazir' düğümler yalnız UYGULANMIŞ şablonlara bağlı olmalı
  for (const d of graf) {
    if (d.durum !== 'hazir') continue;
    for (const t of d.exerciseTemplates) {
      if (!UYGULANMIS_SABLONLAR.has(t)) {
        hata(`${d.id}: durum 'hazir' ama '${t}' henüz uygulanmamış — planlayıcı soru üretemez.`);
      }
    }
  }

  // (e) PLAN ↔ içerik: benzersiz şablon sayısı plandaki sayıyla aynı mı?
  //     Belgenin bayatlamasını yakalayan denetim (PLAN §18 iddia-1).
  const tumSablonlar = new Set<string>();
  for (const d of graf) for (const t of d.exerciseTemplates) tumSablonlar.add(t);
  if (tumSablonlar.size !== PLAN_SABLON_SAYISI) {
    hata(
      `Şablon sayısı sapması: skills.json ${tumSablonlar.size} benzersiz şablon içeriyor, ` +
        `plan ${PLAN_SABLON_SAYISI} diyor. docs/PLAN.md §5.2/§4.5/§14 ve docs/PROGRESS.md'yi ` +
        `AYNI commit'te güncelleyin, sonra bu betikteki PLAN_SABLON_SAYISI değerini düzeltin.`,
    );
  }
  sonuc.istatistik.push(
    `şablonlar: ${tumSablonlar.size} benzersiz · ${UYGULANMIS_SABLONLAR.size} uygulandı · ` +
      `${tumSablonlar.size - UYGULANMIS_SABLONLAR.size} bekliyor`,
  );
} catch (e) {
  hata(`skills.json: ${(e as Error).message}`);
}

// ------------------------------------------------------- misconceptions.json
try {
  const mc = read('src/content/misconceptions.json') as {
    hatalar?: { id?: string }[];
    ozdenetim?: { hataEtiketleri?: string[] };
  };
  const dosyaEtiketleri = new Set((mc.hatalar ?? []).map((h) => h.id));
  const kodEtiketleri = new Set<string>(TUM_HATA_ETIKETLERI);

  // Her hata.id geçerli bir HataEtiketi mi?
  for (const id of dosyaEtiketleri) {
    if (!kodEtiketleri.has(id as string)) {
      hata(`misconceptions.json: '${id}' distractors.ts'te tanımlı bir etiket değil.`);
    }
  }
  // Birebir aynı — ne eksik ne fazla (kimlik sözleşmesi).
  for (const id of kodEtiketleri) {
    if (!dosyaEtiketleri.has(id)) {
      hata(`misconceptions.json: '${id}' etiketi dosyada yok (eksik).`);
    }
  }
  // ozdenetim.hataEtiketleri varsa o da birebir aynı olmalı.
  const ozd = mc.ozdenetim?.hataEtiketleri;
  if (ozd) {
    const ozdK = new Set(ozd);
    for (const id of kodEtiketleri) {
      if (!ozdK.has(id)) hata(`misconceptions.json: ozdenetim.hataEtiketleri '${id}' eksik.`);
    }
    if (ozd.length !== kodEtiketleri.size) {
      hata(`misconceptions.json: ozdenetim.hataEtiketleri ${ozd.length} etiket, beklenen ${kodEtiketleri.size}.`);
    }
  }
  sonuc.istatistik.push(
    `misconceptions.json: ${dosyaEtiketleri.size}/${kodEtiketleri.size} etiket (birebir eşleşme).`,
  );
} catch (e) {
  hata(`misconceptions.json: ${(e as Error).message}`);
}

// --------------------------------------------------- jeneratör ←→ içerik
for (const g of JENERATORLER) {
  for (const kod of g.karsilananKazanimlar) {
    if (kazanimKodlari.size > 0 && !kazanimKodlari.has(kod)) {
      hata(`${g.templateId}: karsilananKazanimlar '${kod}' kazanimlar.json'da yok.`);
    }
  }
  for (const sid of g.karsilananSkillIds) {
    if (beceriIdleri.size > 0 && !beceriIdleri.has(sid)) {
      hata(`${g.templateId}: karsilananSkillIds '${sid}' skills.json'da yok.`);
    }
  }
}
sonuc.istatistik.push(
  `jeneratörler: ${JENERATORLER.length} uygulandı (${[...UYGULANMIS_SABLONLAR].join(', ')}).`,
);

// -------------------------------------------------------------------- rapor
for (const s of sonuc.istatistik) console.log(`  ${s}`);
if (sonuc.uyarilar.length > 0) {
  console.log(`\n⚠ ${sonuc.uyarilar.length} uyarı:`);
  for (const u of sonuc.uyarilar) console.log(`  ${u}`);
}
if (sonuc.hatalar.length === 0) {
  console.log('\n✓ İçerik bütünlüğü — sorun yok.');
  process.exit(0);
}
console.error(`\n✕ ${sonuc.hatalar.length} hata:`);
for (const h of sonuc.hatalar) console.error(`  · ${h}`);
process.exit(1);
