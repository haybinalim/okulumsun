import { z } from 'zod';

/**
 * CSP `script-src 'self'` (eval yok, plan v2 Adım 22): zod v4 ilk ayrıştırmada
 * `new Function("")` ile eval yoklaması yapar; hata yutulsa da tarayıcı bunu CSP
 * ihlali olarak raporlar. `jitless` yoklamayı kapatır; doğrulama aynı kalır.
 * Uygulama girişinde her şeyden önce içe aktarılır; ayrıca zod kullanan HER şema dosyası bunu ilk içe
 * aktarımı olarak alır — derleyici ortak modülleri ayrı bir parçaya ayırınca o parça girişten önce çalışır
 * (Adım 44 aşama 2'de görüldü). `zodAyari.spec.ts` bunu denetler.
 */
z.config({ jitless: true });
