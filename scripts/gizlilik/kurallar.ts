/**
 * K9 gizlilik statik taraması — SAF kurallar (plan v2 Adım 24, §5.5).
 * Betik (`scripts/gizlilik-tarama.ts`) dosyaları okur; burada yalnız metin → bulgu.
 */
import { BAYRAKLI_IZINLI_ANAHTARLAR, IZINLI_LOCALSTORAGE_ANAHTARLARI } from '../../src/persistence/depolamaIzinListesi.ts';

export interface Bulgu {
  readonly dosya: string;
  readonly satir: number;
  readonly kural: string;
}

interface Kural {
  readonly ad: string;
  readonly desen: RegExp;
  /** true dönerse bu dosyada/satırda serbest. */
  readonly izin?: (dosya: string, satir: string) => boolean;
  /** Yalnız uygulama kodunda (`src/`) uygulanır; `scripts/` geliştirici makinesinde çalışır. */
  readonly yalnizSrc?: boolean;
}

const izinliAnahtarDeseni = new RegExp(
  `localStorage\\.setItem\\(\\s*(CIHAZ_PROFILI_ANAHTARI|${IZINLI_LOCALSTORAGE_ANAHTARLARI.map((a) => `['"\`]${a.replace(/\./g, '\\.')}['"\`]`).join('|')})\\s*,`,
);

/** K-7 (ADR-0002 Ek 1): bayraklı Okuma Yazma sınıf ayarı YALNIZ kendi depolama modülünde yazılır. */
export const TUR_SINIF_AYARI_DOSYASI = 'src/ui/tur/sinifAyariDepo.ts';
const bayrakliAnahtarDeseni = new RegExp(
  `localStorage\\.setItem\\(\\s*(DERS_TUR_SINIF_ANAHTARI|${BAYRAKLI_IZINLI_ANAHTARLAR.map((a) => `['"\`]${a.anahtar.replace(/\./g, '\\.')}['"\`]`).join('|')})\\s*,`,
);

export const KURALLAR: readonly Kural[] = [
  { ad: 'Math.random yasak', desen: /\bMath\.random\s*\(/ },
  {
    ad: 'fetch yalnız src/audio/speech.ts (AUDIO_BASE) ve Türkçe veri yükleyicisi (turVeriYolu, ADR-0016)',
    desen: /(^|[^\w.])fetch\s*\(/,
    izin: (d, s) =>
      (d === 'src/audio/speech.ts' && s.includes('AUDIO_BASE')) ||
      (d === 'src/content/dersler/tur/veriYukleyici.ts' && /\bfetch\(turVeriYolu\(/.test(s)),
    yalnizSrc: true,
  },
  { ad: 'navigator.sendBeacon yasak', desen: /\bsendBeacon\s*\(/, yalnizSrc: true },
  { ad: 'WebSocket yasak', desen: /\bnew\s+WebSocket\b/, yalnizSrc: true },
  { ad: 'XMLHttpRequest yasak', desen: /\bXMLHttpRequest\b/, yalnizSrc: true },
  { ad: 'EventSource yasak', desen: /\bnew\s+EventSource\b/, yalnizSrc: true },
  { ad: 'document.cookie yazımı yasak', desen: /\bdocument\.cookie\s*=(?!=)/, yalnizSrc: true },
  { ad: 'sessionStorage.setItem yasak', desen: /\bsessionStorage\.setItem\s*\(/, yalnizSrc: true },
  { ad: 'postMessage yasak', desen: /\bpostMessage\s*\(/, yalnizSrc: true },
  { ad: 'window.parent/opener erişimi yasak', desen: /\bwindow\.(parent|opener)\b/, yalnizSrc: true },
  {
    ad: 'window.top yalnız src/platform/gomuluAcilis.ts (kimlik karşılaştırması)',
    desen: /\bwindow\.top\b/,
    izin: (d, s) => d === 'src/platform/gomuluAcilis.ts' && /window\.self\s*!==\s*window\.top/.test(s),
    yalnizSrc: true,
  },
  {
    ad: 'localStorage.setItem yalnız izin listesindeki anahtarla',
    desen: /\blocalStorage\.setItem\s*\(/,
    izin: (d, s) => izinliAnahtarDeseni.test(s) || (d === TUR_SINIF_AYARI_DOSYASI && bayrakliAnahtarDeseni.test(s)),
    yalnizSrc: true,
  },
  {
    ad: 'IndexedDB/Dexie yalnız src/persistence/',
    desen: /\bindexedDB\.open\s*\(|\bnew\s+Dexie\b|\bextends\s+Dexie\b/,
    izin: (d) => d.startsWith('src/persistence/'),
    yalnizSrc: true,
  },
];

/**
 * Yorumları satır numaralarını koruyarak boşaltır (// ve /* *\/). Dize içindeki
 * `//` (ör. URL) yorum sayılmaz.
 */
export function yorumlariAt(kaynak: string): string {
  let cikti = '';
  let i = 0;
  let dize: string | null = null;
  while (i < kaynak.length) {
    const c = kaynak[i];
    const s = kaynak[i + 1];
    if (dize) {
      cikti += c;
      if (c === '\\') {
        cikti += s ?? '';
        i += 2;
        continue;
      }
      if (c === dize) dize = null;
      i++;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      dize = c;
      cikti += c;
      i++;
      continue;
    }
    if (c === '/' && s === '/') {
      while (i < kaynak.length && kaynak[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && s === '*') {
      i += 2;
      while (i < kaynak.length && !(kaynak[i] === '*' && kaynak[i + 1] === '/')) {
        if (kaynak[i] === '\n') cikti += '\n';
        i++;
      }
      i += 2;
      continue;
    }
    cikti += c;
    i++;
  }
  return cikti;
}

export function tara(dosya: string, kaynak: string): Bulgu[] {
  const bulgular: Bulgu[] = [];
  const srcMi = dosya.startsWith('src/');
  yorumlariAt(kaynak)
    .split('\n')
    .forEach((satir, i) => {
      for (const k of KURALLAR) {
        if (k.yalnizSrc && !srcMi) continue;
        if (!k.desen.test(satir)) continue;
        if (k.izin?.(dosya, satir)) continue;
        bulgular.push({ dosya, satir: i + 1, kural: k.ad });
      }
    });
  return bulgular;
}
