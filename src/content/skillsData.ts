/**
 * BECERİ GRAFİ VERİSİ — plan §12 content/skills.json yükleyicisi.
 *
 * skills.json'ı import eder, Zod şemasıyla doğrular ve graf bütünlüğünü
 * denetler. Doğrulama derleme zamanında çalışır — bozuk veri build'i kırar.
 *
 * Bu modül tüm uygulamada skills.json'a erişen TEK kaynaktır.
 */

import { skillGrafiniAyristir, type SkillNode } from './schema/skill';
import skillsHam from './skills.json';

/** Doğrulanmış beceri grafiği — uygulama boyunca tek kaynak. */
export const skillsData: readonly SkillNode[] = skillGrafiniAyristir(skillsHam);
