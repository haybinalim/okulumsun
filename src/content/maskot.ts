/**
 * Maskotun adı (plan v2 Adım 54, KG-115) — TEK KAYNAK `maskot.json`.
 *
 * Kullanıcı kararı (28 Eki 2026): "Lokum"; sonradan değiştirilebilir. Ad yalnız `maskot.json`'da yazılır:
 * ses metinleri `{maskotAdi}` yer tutucusuyla (scripts/ses/klipler.ts doldurur), ekranlar bu sabitle kullanır.
 * Adın başka bir kaynak dosyada düz yazılması testle engellenir (tests/unit/maskotAdi.spec.ts).
 */
import maskotHam from './maskot.json';

export const MASKOT_ADI: string = (maskotHam as { ad: string }).ad;
