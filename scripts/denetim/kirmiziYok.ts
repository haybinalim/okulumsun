/**
 * Kırmızı yok denetimi (plan v2 Adım 29, K9'a bağlı). `src/ui/**` ve `src/design/**`
 * içinde kırmızı tonlar yasak (PLAN §0 kural 5). İstisna: `src/dev/**`. (TCMB raster banknot
 * istisnası KG-121 ile kalktı: dosyalar depodan kaldırıldı, banknotlar şematik.)
 */
export interface KirmiziBulgu {
  readonly dosya: string;
  readonly satir: number;
  readonly desen: string;
}

const DESENLER: readonly RegExp[] = [
  /#DC2626/i,
  /#EF4444/i,
  /#F87171/i,
  /\bred\b/i,
  /rgb\(\s*2[0-5][0-9]\s*,\s*[0-9]{1,2}\s*,\s*[0-9]{1,2}\s*\)/i,
];

export function kirmiziKapsamdaMi(dosya: string): boolean {
  if (dosya.startsWith('src/dev/')) return false;
  return dosya.startsWith('src/ui/') || dosya.startsWith('src/design/');
}

export function kirmiziTara(dosya: string, icerik: string): KirmiziBulgu[] {
  if (!kirmiziKapsamdaMi(dosya)) return [];
  const bulgular: KirmiziBulgu[] = [];
  icerik.split('\n').forEach((satir, i) => {
    for (const d of DESENLER) if (d.test(satir)) bulgular.push({ dosya, satir: i + 1, desen: String(d) });
  });
  return bulgular;
}
