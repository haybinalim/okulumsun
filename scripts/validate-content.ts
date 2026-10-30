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
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { kazanimlariDogrula, kazanimHaritasi } from '../src/content/schema/kazanim';
import { skillGrafiniAyristir } from '../src/content/schema/skill';
import { TUM_HATA_ETIKETLERI } from '../src/exercises/distractors';
import { REGISTRY } from '../src/exercises/registry';
import { DUGUM_KODLARI, SILINEN_KODLAR } from '../src/ogretmen/dugumKodlari';
import { YAZDIRMA_SINIFI } from '../src/ogretmen/calismaKagidi/yazdirmaUygunlugu';
import type { ExerciseGenerator } from '../src/exercises/types';
import { OGRETIM_HAFTALARI } from '../src/content/okulTakvimi';
import { PlanDuzeltmeleriSchema } from '../src/content/schema/haftalikPlan';
import { haftalikPlanUret } from '../src/ogretmen/haftalikPlan';
import { EvIpuclariSchema } from '../src/content/schema/evIpucu';
import { MaskotHikayeleriSchema } from '../src/content/schema/maskotHikayesi';
import { TemaGirisleriSchema } from '../src/content/schema/temaGirisi';
import { DERS_KODLARI, DERSLER } from '../src/content/dersler';
import {
  harfEnvanteriniDenetle,
  renkAlaniBul,
  turIceriginiDogrula,
  turKodunuTara,
} from '../src/content/dersler/tur/dogrulayici';
import { turIcerikDosyasiniAyristir } from '../src/content/dersler/tur/sema';

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
  // (f) kararlı düğüm kodları (Adım 34): her düğümün 2 karakterlik benzersiz kodu var, silinen kod yeniden verilmemiş
  const kodlar = new Map<string, string>();
  for (const d of graf) {
    const kod = (DUGUM_KODLARI as Readonly<Record<string, string | undefined>>)[d.id];
    if (!kod) {
      hata(`${d.id}: src/ogretmen/dugumKodlari.ts içinde düğüm kodu yok.`);
      continue;
    }
    if (!/^[a-z0-9]{2}$/.test(kod)) hata(`${d.id}: düğüm kodu '${kod}' 2 karakterli [a-z0-9] değil.`);
    const onceki = kodlar.get(kod);
    if (onceki) hata(`Düğüm kodu '${kod}' hem ${onceki} hem ${d.id} için verilmiş.`);
    kodlar.set(kod, d.id);
    if (SILINEN_KODLAR.includes(kod))
      hata(`${d.id}: düğüm kodu '${kod}' silinmiş bir düğüme aitti, yeniden kullanılamaz.`);
  }
  for (const id of Object.keys(DUGUM_KODLARI)) {
    if (!beceriIdleri.has(id))
      hata(`dugumKodlari.ts: '${id}' skills.json'da yok (silinen düğümün kodu SILINEN_KODLAR'a taşınmalı).`);
  }
  // (g) yazdırma uygunluğu (Adım 35): 39 şablonun her biri tam bir sınıfta, sınıf tablosunda fazla şablon yok
  const sinifSayilari = { uygun: 0, uyarlanir: 0, uygunDegil: 0 };
  for (const t of tumSablonlar) {
    const sinif = YAZDIRMA_SINIFI[t];
    if (!sinif) hata(`${t}: src/ogretmen/calismaKagidi/yazdirmaUygunlugu.ts içinde yazdırma sınıfı yok.`);
    else sinifSayilari[sinif]++;
  }
  for (const t of Object.keys(YAZDIRMA_SINIFI)) {
    if (!tumSablonlar.has(t)) hata(`yazdirmaUygunlugu.ts: '${t}' skills.json'da yok.`);
  }
  sonuc.istatistik.push(
    `yazdırma sınıfı: ${sinifSayilari.uygun} uygun · ${sinifSayilari.uyarlanir} uyarlanır · ${sinifSayilari.uygunDegil} uygun değil`,
  );
  sonuc.istatistik.push(`düğüm kodları: ${kodlar.size} benzersiz`);
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
  sonuc.istatistik.push(`misconceptions.json: ${dosyaEtiketleri.size}/${kodEtiketleri.size} etiket (birebir eşleşme).`);
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
sonuc.istatistik.push(`jeneratörler: ${JENERATORLER.length} uygulandı (${[...UYGULANMIS_SABLONLAR].join(', ')}).`);

// ------------------------------------------------ ev ipuçları (Adım 43)
try {
  const ev = EvIpuclariSchema.parse(read('src/content/evIpuclari.json'));
  sonuc.istatistik.push(`ev ipuçları: ${ev.ipuclari.length} tema`);
} catch (e) {
  hata(`evIpuclari.json: ${e instanceof Error ? e.message : String(e)}`);
}

// ------------------------------------------------ maskot tema hikâyeleri (Adım 54)
try {
  const mh = MaskotHikayeleriSchema.parse(read('src/content/maskotHikayeleri.json'));
  sonuc.istatistik.push(
    `maskot hikâyeleri: ${mh.hikayeler.length} tema × ${mh.hikayeler[0]?.sahneler.length ?? 0} sahne`,
  );
} catch (e) {
  hata(`maskotHikayeleri.json: ${e instanceof Error ? e.message : String(e)}`);
}

// ------------------------------------------------ derin tema girişi (Adım 45)
// Şema: 7 tema × 4 adım; her `ses` manifestte (SpeechKeySchema), her `gorsel` geçerli VisualSpec.
try {
  const tg = TemaGirisleriSchema.parse(read('src/content/temaGirisleri.json'));
  const dokun = tg.girisler.flatMap((g) => g.adimlar).filter((a) => a.eylem === 'dokun').length;
  sonuc.istatistik.push(
    `tema girişleri: ${tg.girisler.length} tema × ${tg.girisler[0]?.adimlar.length ?? 0} adım (${dokun} dokunma)`,
  );
} catch (e) {
  hata(`temaGirisleri.json: ${e instanceof Error ? e.message : String(e)}`);
}

// ------------------------------------------------ haftalık MEB planı (Adım 37)
try {
  const plan = haftalikPlanUret(
    kazanimlariDogrula(kazanimHam),
    OGRETIM_HAFTALARI,
    skillGrafiniAyristir(skillsHam),
    PlanDuzeltmeleriSchema.parse(read('src/content/planDuzeltmeleri.json')),
  );
  if (plan.length !== OGRETIM_HAFTALARI.length) {
    hata(`haftalık plan: ${plan.length} hafta, takvimde ${OGRETIM_HAFTALARI.length}.`);
  }
  for (const d of PlanDuzeltmeleriSchema.parse(read('src/content/planDuzeltmeleri.json')).duzeltmeler) {
    if (!OGRETIM_HAFTALARI.some((h) => h.no === d.hafta)) hata(`planDuzeltmeleri.json: hafta ${d.hafta} takvimde yok.`);
    for (const k of d.kazanimKodlari)
      if (!kazanimKodlari.has(k)) hata(`planDuzeltmeleri.json: '${k}' kazanimlar.json'da yok.`);
  }
  const plandaki = new Set(plan.flatMap((p) => p.dugumler));
  for (const d of skillGrafiniAyristir(skillsHam).filter((x) => x.durum === 'hazir')) {
    if (!plandaki.has(d.id)) hata(`${d.id}: hazır düğüm haftalık planda hiçbir haftaya düşmüyor.`);
  }
  sonuc.istatistik.push(
    `haftalık plan: ${plan.length} öğretim haftası · ${plan.filter((p) => p.temaNo != null).length} program haftası`,
  );
} catch (e) {
  hata(`haftalık plan: ${(e as Error).message}`);
}

// ------------------------------------------------ ders paketleri (ADR-0011, ADR-0016; Okuma Yazma Adım 61)
// Her dersin müfredat kısıt belgesi zorunlu; JS dışı verisi olan dersin manifesti okunur ve program sürümü
// kısıt belgesindekiyle aynı olmalı.
for (const kod of DERS_KODLARI) {
  const paket = DERSLER[kod];
  if (!existsSync(path.join(ROOT, paket.kisitBelgesi))) {
    hata(`ders ${kod}: kısıt belgesi yok (${paket.kisitBelgesi}).`);
    continue;
  }
  if (!paket.veriKoku) continue;
  try {
    const m = read(`${paket.veriKoku}/manifest.json`) as { ders?: unknown; programSurumu?: unknown };
    if (m.ders !== kod) hata(`${paket.veriKoku}/manifest.json: ders '${String(m.ders)}' ≠ '${kod}'.`);
    const belge = readFileSync(path.join(ROOT, paket.kisitBelgesi), 'utf8');
    if (typeof m.programSurumu !== 'string' || !belge.includes(`\`${m.programSurumu}\``))
      hata(`${paket.veriKoku}/manifest.json: programSurumu '${String(m.programSurumu)}' kısıt belgesinde yok.`);
  } catch (e) {
    hata(`ders ${kod}: ${(e as Error).message}`);
  }
}
sonuc.istatistik.push(`ders paketleri: ${DERS_KODLARI.map((k) => `${k} (${DERSLER[k].durum})`).join(', ')}`);

// ------------------------------------------------ Türkçe içerik: K-OY doğrulayıcısı (Okuma Yazma Adım 62)
// `ders-verisi/tur/icerik/*.json` şema + D-01…D-23 kuralları; Türkçe kodda süre ölçümü yok (D-13).
// `--yayin` ile öğretmen teyidi (D-14) eksikliği hata olur (Adım 73 yayın kapısı).
{
  const yayin = process.argv.includes('--yayin');
  const turKok = path.join(ROOT, 'src/content/dersler/tur');
  const kod = readdirSync(turKok)
    .filter((d) => d.endsWith('.ts'))
    .map((d) => ({ yol: `src/content/dersler/tur/${d}`, icerik: readFileSync(path.join(turKok, d), 'utf8') }));
  const turIhlalleri = [...harfEnvanteriniDenetle(), ...turKodunuTara(kod)];
  const icerikKoku = path.join(ROOT, 'ders-verisi/tur/icerik');
  const dosyalar = existsSync(icerikKoku)
    ? readdirSync(icerikKoku)
        .filter((d) => d.endsWith('.json'))
        .sort()
    : [];
  let oge = 0;
  for (const ad of dosyalar) {
    const rel = `ders-verisi/tur/icerik/${ad}`;
    try {
      const ham = read(rel);
      for (const yol of renkAlaniBul(ham)) hata(`${rel}: D-06 parça rengi alanı yasak (${yol}).`);
      const d = turIcerikDosyasiniAyristir(ham);
      oge += d.harfler.length + d.heceler.length + d.sozcukler.length + d.cumleler.length + d.etkinlikler.length;
      const r = turIceriginiDogrula(d, { yayin });
      for (const h of r.hatalar) hata(`${rel}: ${h.kural} ${h.oge}: ${h.mesaj}`);
      for (const u of r.uyarilar) sonuc.uyarilar.push(`${rel}: ${u.kural} ${u.oge}: ${u.mesaj}`);
    } catch (e) {
      hata(`${rel}: ${(e as Error).message}`);
    }
  }
  for (const h of turIhlalleri) hata(`Türkçe: ${h.kural} ${h.oge}: ${h.mesaj}`);
  sonuc.istatistik.push(`Türkçe içerik (K-OY): ${dosyalar.length} dosya · ${oge} öğe${yayin ? ' (yayın kipi)' : ''}`);
}

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
