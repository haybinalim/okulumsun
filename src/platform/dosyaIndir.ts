/**
 * Yerel dosya indirme (plan v2 Adım 37): metin → `Blob` → `URL.createObjectURL` → `<a download>`.
 * Ağ isteği yok; dosya tarayıcının indirme klasörüne yazılır, uygulama hiçbir şey saklamaz.
 */
export function dosyaIndir(dosyaAdi: string, icerik: string, tur: string): void {
  const url = URL.createObjectURL(new Blob([icerik], { type: tur }));
  const a = document.createElement('a');
  a.href = url;
  a.download = dosyaAdi;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Bazı tarayıcılar tıklamadan hemen sonra iptal edilen URL'yi indiremez.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Yerel takvim günü `YYYY-MM-DD` (UTC değil: Türkiye'de gece yarısı kayması olmasın). */
export function yerelGun(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
