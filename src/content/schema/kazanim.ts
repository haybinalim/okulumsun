/**
 * `src/content/kazanimlar.json` için SINIR DOĞRULAYICISI.
 *
 * TEK GERÇEK KAYNAĞI: bu dosyada içerik ŞEMASI, `src/exercises/types.ts` içinde
 * çalışma zamanı SÖZLEŞMESİ tanımlıdır. İkisi çakışmaz çünkü farklı şeyleri
 * tanımlarlar:
 *   · kazanimlar.json  → MEB'den TÜRETİLMİŞ, elle yazılmış, DEĞİŞMEZ içerik.
 *     Doğruluğu ancak çalışma anında (dosya okunurken) denetlenebilir → Zod.
 *   · Exercise         → kod tarafından ÜRETİLEN veri. Doğruluğu derleme
 *     zamanında denetlenir → TypeScript.
 * Bu dosyanın türettiği tipler (`z.infer`) JSON'un tipini tanımlar; kimse
 * elle paralel bir `interface Kazanim` yazmasın.
 *
 * kazanimlar.json ZATEN doğrulanmış ve kilitlenmiştir; bu şema onu değiştirmez,
 * yalnızca bozulmadığını garanti eder. Şema ile dosya çelişirse ŞEMA yanlıştır
 * — önce docs/meb-matematik-2024-metin.txt içindeki kaynak sayfaya bakın.
 */

import { z } from 'zod';
import type { KazanimKodu } from '../../exercises/types';

/** MAT.1.<öğrenme alanı 1-4>.<sıra>. */
const KAZANIM_KODU_DESENI = /^MAT\.1\.[1-4]\.\d+$/;

/**
 * Kazanım kodu şeması.
 * `z.custom` kullanılıyor (düz `z.string()` değil), çünkü çıktı tipi tam olarak
 * `KazanimKodu` şablon-literal tipi olmalı; aksi hâlde JSON'dan okunan kod
 * `Exercise.kazanimKodlari` alanına atanamazdı.
 */
export const KazanimKoduSchema = z.custom<KazanimKodu>(
  (v) => typeof v === 'string' && KAZANIM_KODU_DESENI.test(v),
  { message: "Geçersiz kazanım kodu — 'MAT.1.<1-4>.<sayı>' bekleniyor." },
);

/** Öğrenme alanı kodu: MAT.1.1 … MAT.1.4. */
export const OgrenmeAlaniSchema = z.string().regex(/^MAT\.1\.[1-4]$/);

/** Kazanımın süreç bileşeni (a, b, c … maddeleri). */
export const SurecBileseniSchema = z.object({
  harf: z.string().min(1).max(2),
  metin: z.string().min(1),
});

/**
 * İçerik çerçevesi — programdan BİREBİR alınmış alanlar.
 * `sembolVeGosterimler` 1. sınıfta çoğu kazanımda BOŞTUR; karşılaştırma
 * sembolleri (`<`, `>`, `=`) bu sınıfta öğretilmiyor.
 */
export const IcerikCercevesiSchema = z.object({
  konuAlani: z.string().min(1),
  genellemeler: z.array(z.string()).default([]),
  anahtarKavramlar: z.array(z.string()).default([]),
  sembolVeGosterimler: z.array(z.string()).default([]),
});

/** Kazanımın bağlı olduğu temanın özeti (temalar dizisiyle tutarlı olmalı). */
export const KazanimTemaSchema = z.object({
  no: z.number().int().min(1).max(7),
  ad: z.string().min(1),
  dersSaati: z.number().int().positive(),
  ogrenmeCiktisiSayisi: z.number().int().positive(),
});

/** Tek bir resmî öğrenme çıktısı (kazanım). */
export const KazanimSchema = z.object({
  kod: KazanimKoduSchema,
  /** Programdaki işleniş sırası (1..19). */
  ogretimSirasi: z.number().int().min(1).max(19),
  /** Programdaki İFADENİN BİREBİR kopyası. Sadeleştirilmez. */
  resmiMetin: z.string().min(1),
  tema: KazanimTemaSchema,
  /**
   * Dört kazanımın süreç bileşeni YOKTUR (MAT.1.1.3, MAT.1.1.5, MAT.1.1.9,
   * MAT.1.3.3) — bu bir veri eksiği değil, programın kendisi böyle.
   */
  surecBilesenleri: z.array(SurecBileseniSchema).default([]),
  icerikCercevesi: IcerikCercevesiSchema,
  /** Uygulamaya dönük sınırlar; jeneratörler bunlara uymak zorunda. */
  uygulamaNotlari: z.array(z.string()).default([]),
  /** docs/meb-matematik-2024-metin.txt içindeki "===== SAYFA n =====" numarası. */
  kaynakSayfa: z.number().int().positive(),
});

/** Tema tablosu satırı (SAYFA 10). */
export const TemaSchema = z.object({
  no: z.number().int().min(1).max(7),
  ad: z.string().min(1),
  ogrenmeAlani: z.string().min(1),
  dersSaati: z.number().int().positive(),
  yuzde: z.number().int().min(0).max(100),
  ogrenmeCiktisiSayisi: z.number().int().positive(),
  /** Programın SUNUM sırasındaki numarası — işleniş sırasından FARKLI olabilir. */
  sunumSirasiNo: z.number().int().min(1).max(7),
  kaynakSayfa: z.number().int().positive(),
  temaAciklamasi: z.string().min(1),
});

export const OkulTemelliPlanlamaSchema = z.object({
  dersSaati: z.number().int().nonnegative(),
  yuzde: z.number().int().min(0).max(100),
  aciklama: z.string().min(1),
  kaynakSayfa: z.number().int().positive(),
});

/** Dosyanın kendi sağlama değerleri — kaynağa uygunluğun kanıtı. */
export const OzdenetimSchema = z.object({
  aciklama: z.string(),
  kazanimSayisi: z.number().int().positive(),
  temaSayisi: z.number().int().positive(),
  temaBasinaKazanimSayisi: z.array(z.number().int().nonnegative()),
  temaDersSaatleri: z.array(z.number().int().nonnegative()),
  temaDersSaatiToplami: z.number().int().positive(),
  okulTemelliPlanlamaSaati: z.number().int().nonnegative(),
  genelToplamDersSaati: z.number().int().positive(),
  ogretimSirasiAraligi: z.tuple([z.number().int(), z.number().int()]),
  ogrenmeAlaniDagilimi: z.record(z.string(), z.number().int().nonnegative()),
  surecBileseniOlmayanKazanimlar: z.array(KazanimKoduSchema),
  kapsamDisi: z.array(z.string()),
});

/**
 * Dosyanın tamamı.
 *
 * `$aciklama` alanı serbest biçimli belge metnidir (nedir, kaynak, güncelleme
 * yöntemi…). Yapısı kasten gevşek bırakıldı: insanlar için yazılmış, kod onu
 * okumuyor. Katı bir şema, belgeyi zenginleştirmeyi gereksizce zorlaştırırdı.
 */
export const KazanimlarDosyasiSchema = z
  .object({
    $aciklama: z.record(z.string(), z.unknown()),
    sinif: z.literal(1),
    toplamKazanimSayisi: z.number().int().positive(),
    haftalikDersSaati: z.number().int().positive(),
    toplamDersSaati: z.number().int().positive(),
    temalar: z.array(TemaSchema),
    okulTemelliPlanlama: OkulTemelliPlanlamaSchema,
    kazanimlar: z.array(KazanimSchema),
    ozdenetim: OzdenetimSchema,
  })
  .superRefine((d, ctx) => {
    const ekle = (mesaj: string) => ctx.addIssue({ code: 'custom', message: mesaj });

    // ---- Sayım tutarlılığı: dosya kendi iddiasını tutuyor mu?
    if (d.kazanimlar.length !== d.toplamKazanimSayisi) {
      ekle(
        `toplamKazanimSayisi=${d.toplamKazanimSayisi} ama dizide ${d.kazanimlar.length} kazanım var.`,
      );
    }
    if (d.kazanimlar.length !== d.ozdenetim.kazanimSayisi) {
      ekle('ozdenetim.kazanimSayisi kazanım dizisiyle uyuşmuyor.');
    }
    if (d.temalar.length !== d.ozdenetim.temaSayisi) {
      ekle('ozdenetim.temaSayisi tema dizisiyle uyuşmuyor.');
    }

    // ---- Kodlar benzersiz ve öğretim sırası kesintisiz olmalı.
    const kodlar = new Set<string>();
    for (const k of d.kazanimlar) {
      if (kodlar.has(k.kod)) ekle(`Yinelenen kazanım kodu: ${k.kod}`);
      kodlar.add(k.kod);
    }
    const siralar = d.kazanimlar.map((k) => k.ogretimSirasi).sort((x, y) => x - y);
    for (let i = 0; i < siralar.length; i++) {
      if (siralar[i] !== i + 1) {
        ekle(`ogretimSirasi kesintili: ${i + 1} bekleniyordu, ${siralar[i]} bulundu.`);
        break;
      }
    }

    // ---- Ders saati toplamı: temalar + okul temelli planlama = genel toplam.
    const temaToplam = d.temalar.reduce((t, x) => t + x.dersSaati, 0);
    if (temaToplam !== d.ozdenetim.temaDersSaatiToplami) {
      ekle(`Tema ders saati toplamı ${temaToplam}, özdenetimde ${d.ozdenetim.temaDersSaatiToplami}.`);
    }
    if (temaToplam + d.okulTemelliPlanlama.dersSaati !== d.toplamDersSaati) {
      ekle(
        `Ders saati toplamı tutmuyor: ${temaToplam} + ${d.okulTemelliPlanlama.dersSaati} ≠ ${d.toplamDersSaati}.`,
      );
    }

    // ---- Kazanımın taşıdığı tema özeti, tema tablosuyla çelişmemeli.
    const temaHaritasi = new Map(d.temalar.map((t) => [t.no, t]));
    for (const k of d.kazanimlar) {
      const t = temaHaritasi.get(k.tema.no);
      if (!t) {
        ekle(`${k.kod}: tema no ${k.tema.no} tema tablosunda yok.`);
        continue;
      }
      if (t.ad !== k.tema.ad || t.dersSaati !== k.tema.dersSaati) {
        ekle(`${k.kod}: tema özeti tema tablosuyla çelişiyor.`);
      }
    }

    // ---- Süreç bileşeni olmayan kazanımlar özdenetimdeki listeyle aynı olmalı.
    const bilesensiz = d.kazanimlar
      .filter((k) => k.surecBilesenleri.length === 0)
      .map((k) => k.kod)
      .sort();
    const beklenen = [...d.ozdenetim.surecBileseniOlmayanKazanimlar].sort();
    if (bilesensiz.join(',') !== beklenen.join(',')) {
      ekle(
        `Süreç bileşeni olmayan kazanımlar listesi uyuşmuyor: [${bilesensiz.join(', ')}] ≠ [${beklenen.join(', ')}].`,
      );
    }
  });

export type SurecBileseni = z.infer<typeof SurecBileseniSchema>;
export type IcerikCercevesi = z.infer<typeof IcerikCercevesiSchema>;
export type Kazanim = z.infer<typeof KazanimSchema>;
export type Tema = z.infer<typeof TemaSchema>;
export type Ozdenetim = z.infer<typeof OzdenetimSchema>;
export type KazanimlarDosyasi = z.infer<typeof KazanimlarDosyasiSchema>;

/**
 * JSON'u doğrular ve tiplenmiş hâlde döndürür.
 * Hata durumunda TÜRKÇE ve okunabilir bir mesajla fırlatır — müfredat verisi
 * bozuksa uygulama açılmamalıdır; yanlış müfredatla ders vermek, hiç ders
 * vermemekten kötüdür.
 */
export function kazanimlariDogrula(veri: unknown): KazanimlarDosyasi {
  const sonuc = KazanimlarDosyasiSchema.safeParse(veri);
  if (sonuc.success) return sonuc.data;

  const satirlar = sonuc.error.issues.map(
    (i) => `  · ${i.path.join('.') || '(kök)'}: ${i.message}`,
  );
  throw new Error(`kazanimlar.json doğrulanamadı:\n${satirlar.join('\n')}`);
}

/** Koddan kazanıma hızlı erişim haritası. */
export function kazanimHaritasi(dosya: KazanimlarDosyasi): Map<KazanimKodu, Kazanim> {
  return new Map(dosya.kazanimlar.map((k) => [k.kod, k]));
}
