/** "Derste tam ekran" tercihi: yalnız bellekte (yeni depolama anahtarı yok); açılışta varsayılana döner. */
let deger: boolean | null = null;
const dinleyiciler = new Set<() => void>();

export function dersteTamEkranMi(profil: string): boolean {
  return deger ?? profil === 'board';
}
export function dersteTamEkranAyarla(v: boolean | null): void {
  deger = v;
  dinleyiciler.forEach((f) => f());
}
export function dersAyariniDinle(f: () => void): () => void {
  dinleyiciler.add(f);
  return () => dinleyiciler.delete(f);
}
