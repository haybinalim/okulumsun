/**
 * Üçüncü taraf varlık envanteri — TEK KAYNAK (plan v2 Adım 21, K10).
 *
 * LICENSES.md tabloları ve Kaynaklar ekranı bu listeden üretilir; metin elle kopyalanmaz.
 * `npm run lisans:denetle` her çalışma zamanı bağımlılığının, her fontun ve ses kaynağının
 * burada olduğunu, lisans adlarının node_modules ile aynı olduğunu denetler.
 *
 * SAF VERİ: yan etkisiz, yalnız JSON içe aktarımı.
 */
import sesKaynagiHam from './sesKaynagi.json';

export type VarlikTuru = 'bagimlilik' | 'font' | 'emoji' | 'ses' | 'gorsel' | 'arac';

export interface UcuncuTarafVarlik {
  /** npm paket adı (bağımlılık/araç) ya da varlığın adı. */
  readonly ad: string;
  readonly tur: VarlikTuru;
  /** SPDX kimliği (bağımlılık/araç için node_modules'taki `license` alanıyla aynı) ya da şart adı. */
  readonly lisans: string;
  readonly sahip: string;
  readonly kaynakUrl: string;
  /** Çalışma anı paketinde (kullanıcıya dağıtılan PWA) var mı. */
  readonly dagitimdaVar: boolean;
  readonly kosul?: string;
}

const ses = sesKaynagiHam as { modelKimligi: string; ticariDagitimIzni: boolean };

/** Ses satırı `sesKaynagi.json` aktif kaynağından türetilir (K10 aynılığı denetler). */
export function sesVarligi(k: { modelKimligi: string; ticariDagitimIzni: boolean }): UcuncuTarafVarlik {
  return {
    ad: `Ses klipleri (public/audio/, ${k.modelKimligi})`,
    tur: 'ses',
    lisans: k.ticariDagitimIzni ? 'ADR-0004 kaynağının şartları' : 'Köken doğrulanamadı (ADR-0004)',
    sahip: 'Okulumsun (üretim), ses modeli sağlayıcısı',
    kaynakUrl: 'docs/ses/SES_KAYNAKLARI.md',
    dagitimdaVar: true,
    kosul: k.ticariDagitimIzni
      ? undefined
      : 'Ticari dağıtım izni yok; Adım 31\'de Google Cloud TTS ile yeniden üretilecek',
  };
}

export const UCUNCU_TARAF_VARLIKLAR: readonly UcuncuTarafVarlik[] = [
  // --- Çalışma zamanı bağımlılıkları (package.json "dependencies")
  { ad: 'react', tur: 'bagimlilik', lisans: 'MIT', sahip: 'Meta Platforms, Inc.', kaynakUrl: 'https://github.com/facebook/react', dagitimdaVar: true },
  { ad: 'react-dom', tur: 'bagimlilik', lisans: 'MIT', sahip: 'Meta Platforms, Inc.', kaynakUrl: 'https://github.com/facebook/react', dagitimdaVar: true },
  { ad: 'zustand', tur: 'bagimlilik', lisans: 'MIT', sahip: 'Paul Henschel', kaynakUrl: 'https://github.com/pmndrs/zustand', dagitimdaVar: true },
  { ad: 'dexie', tur: 'bagimlilik', lisans: 'Apache-2.0', sahip: 'David Fahlander', kaynakUrl: 'https://github.com/dexie/Dexie.js', dagitimdaVar: true },
  { ad: 'zod', tur: 'bagimlilik', lisans: 'MIT', sahip: 'Colin McDonnell', kaynakUrl: 'https://github.com/colinhacks/zod', dagitimdaVar: true },
  { ad: 'framer-motion', tur: 'bagimlilik', lisans: 'MIT', sahip: 'Matt Perry', kaynakUrl: 'https://github.com/motiondivision/motion', dagitimdaVar: true },
  { ad: 'canvas-confetti', tur: 'bagimlilik', lisans: 'ISC', sahip: 'Kiril Vatev', kaynakUrl: 'https://github.com/catdad/canvas-confetti', dagitimdaVar: true },
  // --- Service worker'a derlenen Workbox (vite-plugin-pwa üretir)
  { ad: 'workbox-window', tur: 'bagimlilik', lisans: 'MIT', sahip: 'Google LLC', kaynakUrl: 'https://github.com/GoogleChrome/workbox', dagitimdaVar: true, kosul: 'vite-plugin-pwa ile service worker içine derlenir' },
  // --- Font
  { ad: 'Andika', tur: 'font', lisans: 'SIL OFL 1.1', sahip: 'SIL International', kaynakUrl: 'https://fonts.google.com/specimen/Andika/license', dagitimdaVar: true },
  // --- Görsel
  {
    ad: 'TCMB E9 5. tertip örnek banknot görselleri',
    tur: 'gorsel',
    lisans: 'TCMB kullanım şartları',
    sahip: 'Türkiye Cumhuriyet Merkez Bankası',
    kaynakUrl: 'docs/BANKNOT_GORSEL_KAYNAKLARI.md',
    dagitimdaVar: true,
    kosul: 'Kaynak gösterilerek eğitim amaçlı; ticari kullanımda yazılı izin. TCMB\'ye başvurulmaz (KG-19), Adım 29\'da şematik banknotla değiştirilir',
  },
  // --- Ses
  sesVarligi(ses),
  // --- Geliştirme araçları (dağıtılmaz; çıktıya lisans geçirmez)
  { ad: 'vite', tur: 'arac', lisans: 'MIT', sahip: 'Evan You ve Vite katkıcıları', kaynakUrl: 'https://github.com/vitejs/vite', dagitimdaVar: false },
  { ad: 'vite-plugin-pwa', tur: 'arac', lisans: 'MIT', sahip: 'Anthony Fu', kaynakUrl: 'https://github.com/vite-pwa/vite-plugin-pwa', dagitimdaVar: false },
  { ad: 'typescript', tur: 'arac', lisans: 'Apache-2.0', sahip: 'Microsoft Corp.', kaynakUrl: 'https://github.com/microsoft/TypeScript', dagitimdaVar: false },
  { ad: 'vitest', tur: 'arac', lisans: 'MIT', sahip: 'Anthony Fu ve Vitest katkıcıları', kaynakUrl: 'https://github.com/vitest-dev/vitest', dagitimdaVar: false },
  { ad: 'fake-indexeddb', tur: 'arac', lisans: 'Apache-2.0', sahip: 'Jeremy Scheff', kaynakUrl: 'https://github.com/dumbmatter/fakeIndexedDB', dagitimdaVar: false },
  { ad: 'Piper', tur: 'arac', lisans: 'GPL-3.0', sahip: 'Open Home Foundation', kaynakUrl: 'https://github.com/OHF-Voice/piper1-gpl', dagitimdaVar: false, kosul: 'Yalnız geliştirme makinesinde; ürettiği ses dosyalarına lisans geçirmez' },
];

const TUR_BASLIK: Readonly<Record<VarlikTuru, string>> = {
  bagimlilik: 'Çalışma zamanı bağımlılıkları',
  font: 'Yazı tipleri',
  emoji: 'Emoji',
  ses: 'Ses',
  gorsel: 'Görseller',
  arac: 'Geliştirme araçları (dağıtılmaz)',
};

const TUR_SIRASI: readonly VarlikTuru[] = ['bagimlilik', 'font', 'emoji', 'gorsel', 'ses', 'arac'];

/** LICENSES.md'deki üretilmiş tablo bölümü. Belirlenimci; `lisans:denetle` birebir karşılaştırır. */
export function lisansTablolariMetni(liste: readonly UcuncuTarafVarlik[] = UCUNCU_TARAF_VARLIKLAR): string {
  const parcalar: string[] = [];
  for (const tur of TUR_SIRASI) {
    const satirlar = liste.filter((v) => v.tur === tur);
    if (satirlar.length === 0) continue;
    parcalar.push(`### ${TUR_BASLIK[tur]}\n\n| Ad | Lisans | Sahip | Koşul |\n|---|---|---|---|`);
    parcalar[parcalar.length - 1] += satirlar
      .map((v) => `\n| ${v.ad} | ${v.lisans} | ${v.sahip} | ${v.kosul ?? '—'} |`)
      .join('');
  }
  return parcalar.join('\n\n');
}
