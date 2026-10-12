import { z } from 'zod';

/**
 * CSP `script-src 'self'` (eval yok, plan v2 Adım 22): zod v4 ilk ayrıştırmada
 * `new Function("")` ile eval yoklaması yapar; hata yutulsa da tarayıcı bunu CSP
 * ihlali olarak raporlar. `jitless` yoklamayı kapatır; doğrulama aynı kalır.
 * Uygulama girişinde her şeyden önce içe aktarılır.
 */
z.config({ jitless: true });
