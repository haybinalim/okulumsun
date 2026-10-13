/**
 * MEB UYUM MATRİSİ — SAF (plan v2 Adım 56 aşama 2, G43).
 *
 * `kazanimlar.json` (19 resmî öğrenme çıktısı + süreç bileşenleri) × `skills.json` (beceri grafiği) × `REGISTRY`
 * (şablon jeneratörleri) → kazanım başına satır: süreç bileşenleri, beceriler, şablonlar, öğretmen düğüm kodları.
 * Başvuru dosyasında (MEM Ar-Ge / EBA) "her kazanım uygulamada nerede" sorusunun makine üretimli cevabı.
 * Dosya okumaz, yazmaz; betik (`scripts/meb-uyum-matrisi.ts`) Markdown + CSV'yi diske koyar.
 */
export interface UyumKazanimi {
  readonly kod: string;
  readonly ogretimSirasi: number;
  readonly resmiMetin: string;
  readonly tema: { readonly no: number; readonly ad: string };
  readonly surecBilesenleri: readonly { readonly harf: string; readonly metin: string }[];
}

export interface UyumBecerisi {
  readonly id: string;
  readonly baslik: string;
  readonly mebOutcomes: readonly string[];
  readonly exerciseTemplates: readonly string[];
  readonly durum: string;
}

export interface UyumSatiri {
  readonly kod: string;
  readonly sira: number;
  readonly tema: string;
  readonly resmiMetin: string;
  readonly surecBilesenleri: readonly string[];
  readonly beceriler: readonly { readonly id: string; readonly baslik: string; readonly dugumKodu: string | null }[];
  readonly sablonlar: readonly string[];
  /** Hazır beceri sayısı ≥1 ve her şablonun jeneratörü kayıtlı. */
  readonly kapsandi: boolean;
}

export function uyumMatrisi(
  kazanimlar: readonly UyumKazanimi[],
  beceriler: readonly UyumBecerisi[],
  sablonVarMi: (t: string) => boolean,
  dugumKodu: (id: string) => string | null,
): UyumSatiri[] {
  return [...kazanimlar]
    .sort((a, b) => a.ogretimSirasi - b.ogretimSirasi)
    .map((k) => {
      const ilgili = beceriler.filter((b) => b.mebOutcomes.includes(k.kod) && b.durum === 'hazir');
      const sablonlar = [...new Set(ilgili.flatMap((b) => b.exerciseTemplates))].sort();
      return {
        kod: k.kod,
        sira: k.ogretimSirasi,
        tema: `${k.tema.no}. ${k.tema.ad}`,
        resmiMetin: k.resmiMetin,
        surecBilesenleri: k.surecBilesenleri.map((s) => `${s.harf}) ${s.metin}`),
        beceriler: ilgili.map((b) => ({ id: b.id, baslik: b.baslik, dugumKodu: dugumKodu(b.id) })),
        sablonlar,
        kapsandi: ilgili.length > 0 && sablonlar.length > 0 && sablonlar.every(sablonVarMi),
      };
    });
}

export function uyumOzeti(satirlar: readonly UyumSatiri[]): {
  kazanim: number;
  kapsanan: number;
  beceri: number;
  sablon: number;
} {
  return {
    kazanim: satirlar.length,
    kapsanan: satirlar.filter((s) => s.kapsandi).length,
    beceri: new Set(satirlar.flatMap((s) => s.beceriler.map((b) => b.id))).size,
    sablon: new Set(satirlar.flatMap((s) => s.sablonlar)).size,
  };
}

const kacis = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');

export function uyumMarkdown(satirlar: readonly UyumSatiri[]): string {
  const o = uyumOzeti(satirlar);
  const baslik = [
    '# MEB uyum matrisi — 1. sınıf matematik',
    '',
    '> Üretilmiş belge: `npm run uyum-matrisi` (plan v2 Adım 56). Elle düzenlemeyin; `tests/unit/uyumMatrisi.spec.ts` bayatlığı yakalar.',
    '> Kaynak: MEB 2024 Türkiye Yüzyılı Maarif Modeli İlkokul Matematik Dersi Öğretim Programı (`src/content/kazanimlar.json`),',
    '> beceri grafiği (`src/content/skills.json`), şablon kayıt defteri (`src/exercises/registry.ts`).',
    '',
    `<!-- durum:uyum_kazanim=${o.kazanim} durum:uyum_kapsanan=${o.kapsanan} durum:uyum_beceri=${o.beceri} durum:uyum_sablon=${o.sablon} -->`,
    '',
    `**Kapsam:** ${o.kapsanan}/${o.kazanim} öğrenme çıktısı en az bir hazır beceri ve kayıtlı şablonla uygulamada; ${o.beceri} beceri, ${o.sablon} şablon.`,
    'Düğüm kodu, öğretmenin set kodunda ve çalışma kâğıdı arşivinde kullandığı kısa koddur.',
    '',
    '| Sıra | Kod | Tema | Resmî metin | Süreç bileşenleri | Beceriler (düğüm kodu) | Şablonlar | Kapsam |',
    '|---|---|---|---|---|---|---|---|',
  ];
  const govde = satirlar.map(
    (s) =>
      `| ${s.sira} | ${s.kod} | ${kacis(s.tema)} | ${kacis(s.resmiMetin)} | ${s.surecBilesenleri.map(kacis).join('<br>')} | ${s.beceriler
        .map((b) => `${kacis(b.baslik)} (\`${b.dugumKodu ?? '—'}\`)`)
        .join('<br>')} | ${s.sablonlar.join(', ')} | ${s.kapsandi ? '✅' : '—'} |`,
  );
  return [...baslik, ...govde, ''].join('\n');
}

export function uyumCsv(satirlar: readonly UyumSatiri[]): string {
  const alan = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const satir = ['sira;kod;tema;resmi_metin;surec_bilesenleri;beceri_idleri;dugum_kodlari;sablonlar;kapsandi'];
  for (const s of satirlar) {
    satir.push(
      [
        String(s.sira),
        s.kod,
        alan(s.tema),
        alan(s.resmiMetin),
        alan(s.surecBilesenleri.join(' | ')),
        alan(s.beceriler.map((b) => b.id).join(' ')),
        alan(s.beceriler.map((b) => b.dugumKodu ?? '').join(' ')),
        alan(s.sablonlar.join(' ')),
        s.kapsandi ? 'evet' : 'hayir',
      ].join(';'),
    );
  }
  // Excel Türkçe yerel ayarı için UTF-8 BOM + `;` (planDisaAktar ile aynı kural).
  return '\uFEFF' + satir.join('\r\n') + '\r\n';
}
