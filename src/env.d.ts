/// <reference types="vite/client" />

/** `vite.config.ts` → `define` (Adım 23). */
declare const __UYGULAMA_SURUMU__: string;
declare const __DERLEME_KIMLIGI__: string;

interface ImportMetaEnv {
  /** Adım 26: '1' ise test derlemesinde e2e kancası açılır (üretimde tanımsız). */
  readonly VITE_E2E_KANCASI?: string;
}
