import { kaliciOgrenciVerileriniSil } from './repository';

/**
 * Açılışta (mod bağımsız, tahta dahil) önceki sürümlerden kalmış öğrenci/veli
 * kayıtlarını bir kez siler (plan v2 Adım 29, E9). Idempotent; hata uygulamayı durdurmaz.
 */
export async function acilistaTemizle(): Promise<void> {
  try {
    await kaliciOgrenciVerileriniSil();
  } catch {
    // Depo yok/erişilemez: silinecek kayıt da yoktur.
  }
}
