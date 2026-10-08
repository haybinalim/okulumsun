/**
 * Claude destekli İÇERİK TASLAK hattı (derleme zamanı / geliştirici aracı).
 *
 * Ne yapar?
 *   1. src/content/misconceptions.json'daki 15 kavram-yanılgısı etiketi için,
 *      çocuğa gösterilecek K2 destek cümlelerinin TASLAKLARINI üretir
 *      (model: Sonnet — pedagojik akıl yürütme gerektirir).
 *   2. src/content/tr.json'daki övgü / "tekrar dene" varyantlarına yenilerini
 *      taslaklar (model: Haiku — hızlı, ucuz ifade üretimi).
 *   3. Çıktıyı scripts/claude-cikti/ altına TASLAK olarak yazar; src/'a ASLA
 *      dokunmaz. Onaylanan metinler geliştirici tarafından elle tr.json'a
 *      taşınır, ardından mevcut "Öğretimsel Soru Sözleşmesi" denetiminden geçer.
 *
 * DOKTRİN UYUMU (mufredat-kisitlari.md):
 *   - SORU ÜRETMEZ. Yalnızca destek/övgü CÜMLELERİ taslağı üretir; soruların
 *     kendisi elle yazılmaya ve sözleşmeyle denetlenmeye devam eder.
 *   - ÇALIŞMA ANINDA ÇALIŞMAZ. Uygulama çevrimdışı-first kalır; çalışma
 *     anında API çağrısı yoktur, gizlilik politikası (OGRENCI_VERISI_SAKLANIR_MI
 *     = false) etkilenmez. API'ye giden tek veri: taksonomi etiketleri ve
 *     mevcut ifade örnekleri. Öğrenci verisi zaten yoktur.
 *   - TASLAK, KARAR DEĞİL. Çıktı insan onayı olmadan ürüne giremez.
 *
 * Model ayrımı (bilinçli): Sonnet = pedagojik destek metni, Haiku = varyant
 * üretimi. Bu ayrım, Claude for Startups başvurusundaki "modeli bilinçli
 * kullanma" anlatısının ta kendisidir.
 *
 * Kullanım:
 *   ANTHROPIC_API_KEY=sk-ant-... npm run claude:taslak
 *   npm run claude:taslak -- --dry-run        (API çağrısı yapmaz; prompt'ları
 *                                             ve tahmini token'ı gösterir)
 *   npm run claude:taslak -- --etiket TOPLAMA_SIRALI  (tek etiket, ucuz deneme)
 *
 * Ortam değişkenleri:
 *   ANTHROPIC_API_KEY      zorunlu (dry-run hariç)
 *   ANTHROPIC_MODEL_SONNET varsayılan: claude-sonnet-5-5
 *   ANTHROPIC_MODEL_HAIKU  varsayılan: claude-haiku-5-5
 *   (Güncel model ID'leri için: https://platform.claude.com/docs/en/about-claude/models/overview)
 *
 * Maliyet notu: 15 etiket (5 çağrı, çağrı başına 3 etiket) + 1 övgü çağrısı =
 * 6 API çağrısı; toplam birkaç sent mertebesi. Yeni hesaplara verilen ~$5
 * başlangıç kredisiyle kart vermeden çalışır.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TR_JSON = path.join(ROOT, 'src/content/tr.json');
const YANILGI_JSON = path.join(ROOT, 'src/content/misconceptions.json');
const OUT_DIR = path.join(ROOT, 'scripts/claude-cikti');

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

const API_KEY = process.env.ANTHROPIC_API_KEY ?? '';
const MODEL_SONNET = process.env.ANTHROPIC_MODEL_SONNET ?? 'claude-sonnet-5-5';
const MODEL_HAIKU = process.env.ANTHROPIC_MODEL_HAIKU ?? 'claude-haiku-5-5';

const DRY_RUN = process.argv.includes('--dry-run');
const ETIKET_FILTRE = (() => {
  const i = process.argv.indexOf('--etiket');
  return i >= 0 ? process.argv[i + 1] : null;
})();

/** Ücretsiz katman ~5 istek/dk → çağrılar arası bekleme (ms). */
const CALL_GAP_MS = 13_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** tr.json'daki dil felsefesi — prompt'a birebir taşınır. */
const DIL_KURALLARI = [
  "Talimatlar 6-8 kelime, tek yönerge. Çocuk okuyamıyor, dinleyerek anlıyor.",
  "'Yanlış' kelimesi HİÇBİR YERDE geçmez. Ceza yok, davet var.",
  'K2 kuralı: YÖNTEMİ söyler, CEVABI söylemez.',
  'Cümleler tam cümledir; parçadan birleştirme yok (prozodi bozulur).',
  'Tahmin kutlanır; çocuk yardım istediği için bedel ödemez.',
  'Ton: sıcak, cesaretlendirici, çocuğa doğrudan 2. şahıs.',
].join('\n- ');

interface YanilgiKaydi {
  id: string;
  etiket: string;
  aciklama: string;
  mudahale: string;
}

interface Taslak {
  hedef: string;
  tur: 'k2-destek' | 'ovgu' | 'tekrar-dene';
  metinler: string[];
}

interface Kullanim {
  model: string;
  girdiToken: number;
  ciktiToken: number;
}

async function claudeCagir(
  model: string,
  sistem: string,
  kullanici: string,
  maxToken: number,
): Promise<{ metin: string; kullanim: Kullanim }> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'anthropic-version': API_VERSION,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxToken,
      system: sistem,
      messages: [{ role: 'user', content: kullanici }],
    }),
  });
  if (!res.ok) {
    const govde = await res.text();
    throw new Error(`Claude API hatası (${res.status}): ${govde.slice(0, 300)}`);
  }
  const veri = (await res.json()) as {
    content: Array<{ type: string; text?: string }>;
    usage: { input_tokens: number; output_tokens: number };
  };
  const metin = veri.content.find((c) => c.type === 'text')?.text ?? '';
  return {
    metin,
    kullanim: {
      model,
      girdiToken: veri.usage.input_tokens,
      ciktiToken: veri.usage.output_tokens,
    },
  };
}

/** ```json ... ``` sarmalını temizler, taslak dizisini doğrular. */
function taslaklariDogrula(ham: string, beklenenTur: Taslak['tur']): Taslak[] {
  const temiz = ham.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  let veri: unknown;
  try {
    veri = JSON.parse(temiz);
  } catch {
    throw new Error('Model çıktısı JSON değil. Ham çıktı:\n' + ham.slice(0, 500));
  }
  const dizi = (veri as { taslaklar?: unknown }).taslaklar;
  if (!Array.isArray(dizi)) throw new Error('Beklenen şema: { "taslaklar": [...] }');
  return dizi.map((o, i) => {
    const kayit = o as { hedef?: unknown; metinler?: unknown };
    if (typeof kayit.hedef !== 'string' || !Array.isArray(kayit.metinler)) {
      throw new Error(`taslaklar[${i}] şemaya uymuyor (hedef: string, metinler: string[] olmalı)`);
    }
    const metinler = kayit.metinler.filter((m): m is string => typeof m === 'string');
    if (metinler.length !== kayit.metinler.length) {
      console.warn(`  uyarı: taslaklar[${i}] içinde string olmayan öğe atlandı`);
    }
    return { hedef: kayit.hedef, tur: beklenenTur, metinler };
  });
}

function k2SistemPromptu(): string {
  return `Sen, 6-7 yaş çocuklara yönelik bir matematik uygulamasının içerik yazarısın.
Kavram yanılgısı yaşayan çocuğa gösterilecek K2 destek cümleleri taslağı üretiyorsun.

Dil kuralları (kesin):
- ${DIL_KURALLARI}

Yalnızca şu şemada JSON döndür, başka hiçbir şey yazma:
{ "taslaklar": [ { "hedef": "<etiket-id>", "metinler": ["...", "...", "..."] } ] }`;
}

function k2KullaniciPromptu(kayitlar: YanilgiKaydi[], ornekler: string[]): string {
  const blok = kayitlar
    .map(
      (k) =>
        `- id: ${k.id}\n  Yetişkin adı: ${k.etiket}\n  Açıklama: ${k.aciklama}\n  Müdahale: ${k.mudahale}`,
    )
    .join('\n');
  return `Aşağıdaki kavram yanılgıları için, her birine 3'er K2 destek cümlesi taslağı yaz.
K2, yöntemi söyler ama cevabı SÖYLEMEZ.

Kavram yanılgıları:
${blok}

Mevcut "tekrar dene" üslubundan örnekler (bunları kopyalama, üslubu yakala):
${ornekler.map((o) => `- "${o}"`).join('\n')}`;
}

function ovguSistemPromptu(): string {
  return `Sen, 6-7 yaş çocuklara yönelik bir matematik uygulamasının içerik yazarısın.
Kısa övgü ve "tekrar dene" cümle varyantları üretiyorsun.

Dil kuralları (kesin):
- ${DIL_KURALLARI}
- Övgüler 1-3 kelime; "tekrar dene" cümleleri 3-6 kelime.

Yalnızca şu şemada JSON döndür, başka hiçbir şey yazma:
{ "taslaklar": [
  { "hedef": "geri:dogru", "metinler": ["...", "...", "...", "...", "...", "..."] },
  { "hedef": "geri:tekrar", "metinler": ["...", "...", "..."] }
] }`;
}

async function main(): Promise<void> {
  if (!DRY_RUN && !API_KEY) {
    console.error('HATA: ANTHROPIC_API_KEY ortam değişkeni tanımlı değil.');
    console.error('Önce https://platform.claude.com adresinden API anahtarı alın.');
    process.exit(1);
  }

  const tr = JSON.parse(await readFile(TR_JSON, 'utf-8')) as {
    geri: Record<string, string>;
    yardim: Record<string, string>;
  };
  const yanilgilar = JSON.parse(await readFile(YANILGI_JSON, 'utf-8')) as {
    hatalar: YanilgiKaydi[];
  };

  let kayitlar = yanilgilar.hatalar;
  if (ETIKET_FILTRE) {
    kayitlar = kayitlar.filter((k) => k.id === ETIKET_FILTRE);
    if (kayitlar.length === 0) throw new Error(`Etiket bulunamadı: ${ETIKET_FILTRE}`);
  }
  console.log(`${kayitlar.length} kavram yanılgısı işlenecek.`);

  const ornekTekrar = Object.entries(tr.geri)
    .filter(([k]) => k.startsWith('tekrar-'))
    .map(([, v]) => v);
  const ornekYardim = Object.values(tr.yardim).filter((v) => !v.startsWith('$'));
  const ornekler = [...ornekTekrar, ...ornekYardim].slice(0, 6);

  const tumTaslaklar: Taslak[] = [];
  const kullanimlar: Kullanim[] = [];
  const istemOrnekleri: Array<{ model: string; istem: string }> = [];

  // Faz 1 — Sonnet: pedagojik destek metinleri (çağrı başına 3 etiket).
  const sistemK2 = k2SistemPromptu();
  for (let i = 0; i < kayitlar.length; i += 3) {
    const grup = kayitlar.slice(i, i + 3);
    const istem = k2KullaniciPromptu(grup, ornekler);
    console.log(
      `[${i + 1}-${Math.min(i + 3, kayitlar.length)}/${kayitlar.length}] Sonnet çağrısı: ${grup.map((g) => g.id).join(', ')}`,
    );
    if (DRY_RUN) {
      istemOrnekleri.push({ model: MODEL_SONNET, istem });
      continue;
    }
    const { metin, kullanim } = await claudeCagir(MODEL_SONNET, sistemK2, istem, 600);
    kullanimlar.push(kullanim);
    tumTaslaklar.push(...taslaklariDogrula(metin, 'k2-destek'));
    if (i + 3 < kayitlar.length) await sleep(CALL_GAP_MS);
  }

  // Faz 2 — Haiku: övgü / tekrar-dene varyantları.
  const sistemOvgu = ovguSistemPromptu();
  const ovguIstem =
    'Mevcut övgü örnekleri: ' +
    Object.entries(tr.geri)
      .filter(([k]) => k.startsWith('dogru-'))
      .map(([, v]) => `"${v}"`)
      .join(', ') +
    '. Bunları kopyalamadan, aynı üslupta 6 yeni övgü + 3 yeni "tekrar dene" cümlesi yaz.';
  console.log('Haiku çağrısı: övgü / tekrar-dene varyantları');
  if (DRY_RUN) {
    istemOrnekleri.push({ model: MODEL_HAIKU, istem: ovguIstem });
  } else {
    if (tumTaslaklar.length > 0) await sleep(CALL_GAP_MS);
    const { metin, kullanim } = await claudeCagir(MODEL_HAIKU, sistemOvgu, ovguIstem, 300);
    kullanimlar.push(kullanim);
    const ovguTaslaklar = taslaklariDogrula(metin, 'ovgu');
    for (const t of ovguTaslaklar) {
      t.tur = t.hedef === 'geri:tekrar' ? 'tekrar-dene' : 'ovgu';
      tumTaslaklar.push(t);
    }
  }

  const damga = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  await mkdir(OUT_DIR, { recursive: true });

  if (DRY_RUN) {
    const ornek = istemOrnekleri[0];
    console.log('\n--- DRY RUN: API çağrısı yapılmadı ---');
    console.log(`Model: ${ornek?.model}`);
    console.log(`Sistem promptu (${sistemK2.length} karakter) + kullanıcı istemi (${ornek?.istem.length} karakter)`);
    console.log(`Tahmini girdi: ~${Math.round(((sistemK2.length + (ornek?.istem.length ?? 0)) / 4) / 100) * 100} token/çağrı`);
    console.log(`Toplam çağrı sayısı: ${Math.ceil(kayitlar.length / 3) + 1}`);
    return;
  }

  const cikti = {
    meta: {
      uretici: 'scripts/claude-destek-taslak.ts',
      tarih: new Date().toISOString(),
      modelSonnet: MODEL_SONNET,
      modelHaiku: MODEL_HAIKU,
      durum: 'TASLAK — insan onayı olmadan src/content içine taşınamaz.',
      doktrin:
        'Soru üretmez; yalnızca destek/övgü cümlesi taslağı. Çalışma anında API çağrısı yoktur.',
    },
    kullanim: kullanimlar,
    taslaklar: tumTaslaklar,
  };
  const ciktiYolu = path.join(OUT_DIR, `taslak-${damga}.json`);
  await writeFile(ciktiYolu, JSON.stringify(cikti, null, 2), 'utf-8');

  const inceleme = `# İnceleme kontrol listesi (${damga})

Bu dosya TASLAKTIR. Her maddeyi tek tek okuyup onaylayın.

- [ ] 'Yanlış' kelimesi hiçbir taslakta geçmiyor.
- [ ] K2 cümleleri YÖNTEMİ söylüyor, CEVABI vermiyor.
- [ ] Cümleler 6-8 kelime, tam cümle (parçadan birleştirme yok).
- [ ] Ton sıcak ve davetkâr; ceza/ayıplama yok.
- [ ] Onaylananlar \`src/content/tr.json\` içine ELLE taşındı.
- [ ] Ardından \`npm run audio\` ile ses klipleri üretildi.
- [ ] \`npm run validate && npm test\` geçti.

Çıktı: \`${path.basename(ciktiYolu)}\`
`;
  await writeFile(path.join(OUT_DIR, 'INCELEME.md'), inceleme, 'utf-8');

  const toplamGirdi = kullanimlar.reduce((t, k) => t + k.girdiToken, 0);
  const toplamCikti = kullanimlar.reduce((t, k) => t + k.ciktiToken, 0);
  console.log('\nTAMAMLANDI');
  console.log(`Taslak: ${ciktiYolu}`);
  console.log(`Kontrol listesi: ${path.join(OUT_DIR, 'INCELEME.md')}`);
  console.log(`Token: ${toplamGirdi} girdi / ${toplamCikti} çıktı (${kullanimlar.length} çağrı)`);
  console.log('SONRAKİ ADIM: taslakları inceleyip onaylananları tr.json\'a elle taşıyın.');
}

main().catch((e: unknown) => {
  console.error('HATA:', e instanceof Error ? e.message : e);
  process.exit(1);
});
