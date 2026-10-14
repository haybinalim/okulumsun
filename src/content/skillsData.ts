/**
 * BECERİ GRAFİ VERİSİ — plan §12 content/skills.json yükleyicisi.
 *
 * skills.json'ı import eder. Zod şeması ve graf bütünlüğü DERLEME ZAMANINDA denetlenir
 * (`scripts/yayin/icerikDogrulama.ts`, KG-87): bozuk veri build'i ve dev sunucusunu kırar; buraya
 * ayrıştırılmış (varsayılanları doldurulmuş) veri gelir, zod üretim paketine girmez.
 *
 * Bu modül tüm uygulamada skills.json'a erişen TEK kaynaktır.
 */

import type { SkillNode } from './schema/skill';
import skillsHam from './skills.json';

/** Doğrulanmış beceri grafiği — uygulama boyunca tek kaynak. */
export const skillsData: readonly SkillNode[] = skillsHam as unknown as readonly SkillNode[];
