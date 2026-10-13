/**
 * TEMA SONU TURU — veri bağlama (plan v2 Adım 46 aşama 2, KG-67).
 *
 * Saf `temaTuruPlani`'na yalnız sete konabilecek (hazır ve kayıtlı şablonlu) düğümleri, öğretim
 * sırasıyla (skills.json sırası) verir. Tohum çağıran UI'dan gelir; hiçbir şey saklanmaz.
 */
import { skillsData } from '../content/skillsData';
import { REGISTRY } from '../exercises/registry';
import { setlenebilirDugumler } from './gunlukSet';
import { temaTuruPlani, type TemaNo, type TemaTuruPlani } from './temaTuru';

export function temaTuruHazirla(tema: number, tohum: number): TemaTuruPlani | null {
  if (!Number.isInteger(tema) || tema < 1 || tema > 7) return null;
  const uygun = setlenebilirDugumler((t) => REGISTRY.has(t));
  return temaTuruPlani(
    tema as TemaNo,
    skillsData.filter((d) => uygun.has(d.id)),
    tohum,
  );
}
