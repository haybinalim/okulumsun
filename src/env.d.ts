/// <reference types="vite/client" />

/** `vite.config.ts` → `define` (Adım 23). */
declare const __UYGULAMA_SURUMU__: string;
declare const __DERLEME_KIMLIGI__: string;

interface ImportMetaEnv {
  /** Adım 26: '1' ise test derlemesinde e2e kancası açılır (üretimde tanımsız). */
  readonly VITE_E2E_KANCASI?: string;
  /** Okuma Yazma planı Adım 61 (ADR-0016): '1' ise Türkçe ders paketi derlenir (varsayılan kapalı; üretimde tanımsız). */
  readonly VITE_DERS_TUR?: string;
}
