/**
 * Gizlilik kanıt raporu — SAF (plan v2 Adım 39 aşama 2, KG-54).
 * e2e `onizleme-gizlilik-ag.spec.ts` her akışın sonunda bir `KanitKaydi` yazar; bu modül kayıtları insan okur
 * Markdown'a çevirir. İstekler adres yerine TÜRE göre özetlenir (uygulama kodu, ses, font, görsel, belge, diğer).
 */
export interface KanitKaydi {
  readonly akis: string;
  readonly koken: string;
  readonly istekler: readonly { readonly url: string; readonly method: string; readonly govdeli: boolean }[];
  readonly soketler: readonly string[];
  readonly localStorage: readonly string[];
  readonly sessionStorage: readonly string[];
  readonly cerezVar: boolean;
  readonly indexedDB: Readonly<Record<string, Readonly<Record<string, number>>>>;
}

export type IstekTuru = 'uygulama kodu' | 'ses' | 'font' | 'görsel' | 'belge/manifest' | 'diğer';

export function istekTuru(url: string): IstekTuru {
  const yol = /^(data|blob):/.test(url) ? url : new URL(url).pathname;
  if (/^(data|blob):/.test(yol)) return 'diğer';
  if (/\.(js|css)$/.test(yol)) return 'uygulama kodu';
  if (/\.(m4a|mp3|ogg)$/.test(yol) || yol.startsWith('/audio/')) return 'ses';
  if (/\.(woff2?|ttf)$/.test(yol)) return 'font';
  if (/\.(png|svg|webp|jpg|ico)$/.test(yol)) return 'görsel';
  if (yol === '/' || /\.(html|webmanifest|json)$/.test(yol)) return 'belge/manifest';
  return 'diğer';
}

export interface AkisOzeti {
  readonly akis: string;
  readonly toplamIstek: number;
  readonly turler: Readonly<Partial<Record<IstekTuru, number>>>;
  readonly yontemler: readonly string[];
  readonly baskaKoken: number;
  readonly govdeli: number;
  readonly soket: number;
  readonly localStorage: readonly string[];
  readonly sessionStorage: number;
  readonly cerez: boolean;
  readonly indexedDBKayit: number;
}

export function ozetle(k: KanitKaydi): AkisOzeti {
  const http = k.istekler.filter((i) => !/^(data|blob):/.test(i.url));
  const turler: Partial<Record<IstekTuru, number>> = {};
  for (const i of http) {
    const t = istekTuru(i.url);
    turler[t] = (turler[t] ?? 0) + 1;
  }
  return {
    akis: k.akis,
    toplamIstek: http.length,
    turler,
    yontemler: [...new Set(http.map((i) => i.method))].sort(),
    baskaKoken: http.filter((i) => new URL(i.url).origin !== k.koken).length,
    govdeli: http.filter((i) => i.govdeli).length,
    soket: k.soketler.length,
    localStorage: [...k.localStorage].sort(),
    sessionStorage: k.sessionStorage.length,
    cerez: k.cerezVar,
    indexedDBKayit: Object.values(k.indexedDB).reduce(
      (t, depolar) => t + Object.values(depolar).reduce((a, b) => a + b, 0),
      0,
    ),
  };
}

const TUR_SIRASI: readonly IstekTuru[] = ['uygulama kodu', 'ses', 'font', 'görsel', 'belge/manifest', 'diğer'];

export function raporUret(kayitlar: readonly KanitKaydi[], kimlik: { surum: string; derleme: string }): string {
  const ozetler = [...kayitlar].map(ozetle).sort((a, b) => a.akis.localeCompare(b.akis, 'tr'));
  const temiz = ozetler.every(
    (o) =>
      o.baskaKoken === 0 &&
      o.govdeli === 0 &&
      o.soket === 0 &&
      o.sessionStorage === 0 &&
      !o.cerez &&
      o.indexedDBKayit === 0 &&
      o.yontemler.every((y) => y === 'GET'),
  );
  const satir = (o: AkisOzeti) =>
    `| ${o.akis} | ${o.toplamIstek} | ${TUR_SIRASI.filter((t) => o.turler[t])
      .map((t) => `${t} ${o.turler[t]}`)
      .join(', ')} | ${o.yontemler.join(', ') || '—'} | ${o.baskaKoken} | ${o.govdeli} | ${o.soket} | ${
      o.localStorage.map((x) => `\`${x}\``).join(', ') || '—'
    } | ${o.sessionStorage} | ${o.cerez ? 'var' : 'yok'} | ${o.indexedDBKayit} |`;
  return `# Gizlilik kanıt raporu

> Üretildi: \`npm run gizlilik:rapor\` (plan v2 Adım 39, KG-54). Kaynak: e2e \`onizleme-gizlilik-ag.spec.ts\`, üretim
> derlemesi + \`vercel.json\` güvenlik başlıkları. Sürüm **v${kimlik.surum}**, derleme \`${kimlik.derleme}\`.
> CI her PR'da bu raporu \`gizlilik-kanit-raporu\` artefaktı olarak yükler; depodaki kopya son yerel üretimdir.

**Sonuç: ${temiz ? 'TEMİZ' : 'İHLAL VAR'}** — ${ozetler.length} akış; başka kökene istek, gövdeli istek, WebSocket,
sessionStorage, çerez ve IndexedDB kaydı ${temiz ? 'yok' : 'tabloya bakın'}.

| Akış | İstek | Türe göre | Yöntem | Başka köken | Gövdeli | Soket | localStorage | sessionStorage | Çerez | IndexedDB kaydı |
|---|---|---|---|---|---|---|---|---|---|---|
${ozetler.map(satir).join('\n')}

İzinli tek localStorage anahtarı ekran boyutu tercihidir (\`src/persistence/depolamaIzinListesi.ts\`). İstek sayısı
akıştaki ses ve görsel sayısına göre değişir; tümü uygulamanın kendi dosyalarıdır.
`;
}
