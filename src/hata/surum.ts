/** Sürüm kimliği (Adım 23): `package.json` sürümü + derleme commit'i (Vite `define`). */
export const UYGULAMA_SURUMU: string = __UYGULAMA_SURUMU__;
export const DERLEME_KIMLIGI: string = __DERLEME_KIMLIGI__;
/** Yetişkin ekranı altbilgisi: `v0.1.0 · abc1234`. */
export const SURUM_METNI = `v${UYGULAMA_SURUMU} · ${DERLEME_KIMLIGI}`;
