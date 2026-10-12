import { kayitEkle } from './hataKaydi';

/** Yakalanmamış hata ve promise reddi dinleyicileri (Adım 23). */
export function hataDinleyicileriniKur(hedef: Window = window): void {
  hedef.addEventListener('error', (e: ErrorEvent) => {
    kayitEkle({
      tur: 'promise',
      mesaj: e.message || String(e.error),
      yigin: e.error instanceof Error ? e.error.stack : undefined,
    });
  });
  hedef.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
    const neden: unknown = e.reason;
    kayitEkle({
      tur: 'promise',
      mesaj: neden instanceof Error ? neden.message : String(neden),
      yigin: neden instanceof Error ? neden.stack : undefined,
    });
  });
}

/**
 * Yalnız geliştirmede: `?hataTetikle=1` kasıtlı bir promise reddi üretir (e2e "sorun bildir").
 * Üretim derlemesinde `import.meta.env.DEV` false olduğu için kod ağaçtan atılır.
 */
export function gelistirmeHatasiTetikle(): void {
  if (!import.meta.env.DEV) return;
  if (new URLSearchParams(window.location.search).get('hataTetikle') !== '1') return;
  setTimeout(() => {
    void Promise.reject(new Error('deneme hatası (hataTetikle)'));
  }, 0);
}
