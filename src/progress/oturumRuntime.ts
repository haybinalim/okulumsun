/**
 * OTURUM ÇALIŞMA ZAMANI KÖPRÜSÜ — plan §6.4 + §7.
 *
 * Planlayıcı yalnızca seçilmiş soru bilgisini üretir; bu modül o seçimi
 * kayıt defterindeki jeneratöre bağlar. UI katmanı doğrudan registry veya
 * içerik grafiğiyle uğraşmaz.
 */

import type { SkillNode } from '../content/schema/skill';
import { REGISTRY } from '../exercises/registry';
import { createRng } from '../exercises/rng';
import type { Exercise, SkillId } from '../exercises/types';
import type { AktifOturum } from './session';
import type { SecilenSoru } from './scheduler';

/** Seçili temada çalışılabilir giriş yoksa tüm hazır grafiğe düşer. */
export function oturumDuzenuSec(
  tumDugumler: readonly SkillNode[],
  secilenTemaNo: number | null,
): readonly SkillNode[] {
  const hazir = tumDugumler.filter((d) => d.durum === 'hazir');
  const temadakiler = secilenTemaNo == null
    ? []
    : hazir.filter((d) => d.tema === secilenTemaNo);

  // Yalnız temayı filtrelemek başlangıçta kilitli bir oturum yaratabilir.
  // Tema içinde çalışılabilir giriş noktası varsa tercih edilir; yoksa adaptif
  // motor kendi giriş düğümlerinden başlayarak çocuğu boş ekranda bırakmaz.
  return temadakiler.some((d) => d.isEntryPoint) ? temadakiler : hazir;
}

/** Aktif oturumun gösterilecek seçimini döndürür. */
export function guncelSecilenSoru(oturum: AktifOturum): SecilenSoru | null {
  return oturum.secilenSorular[oturum.guncelSoruIndeksi] ?? null;
}

/**
 * Planlayıcının `(skillId, templateId, seed)` seçimini somut bir Exercise'e
 * dönüştürür. Registry veya içerik grafiğindeki bir tutarsızlık sessizce
 * yanlış soru üretmek yerine açıkça hata verir.
 */
export function secilenSoruyuUret(
  secilen: SecilenSoru,
  duzen: readonly SkillNode[],
  mod: 'tahta' | 'kisisel',
): Exercise {
  const dugum = duzen.find((d) => d.id === secilen.skillId);
  if (!dugum) {
    throw new Error(`Oturum düğümü bulunamadı: ${secilen.skillId}`);
  }

  const generator = REGISTRY.get(secilen.templateId);
  if (!generator) {
    throw new Error(`Oturum şablonu kayıt defterinde yok: ${secilen.templateId}`);
  }

  const hedefParametreleri = secilen.templateId === 'M-ORUNTU-SAYI'
    ? {
        yon: secilen.skillId === 'mat.oruntu.artan-sayi'
          ? 'artan' as const
          : secilen.skillId === 'mat.oruntu.azalan-sayi'
            ? 'azalan' as const
            : undefined,
      }
    : secilen.templateId === 'M-CIKAR-GORSEL' && (
      secilen.skillId === 'mat.cikarma.ayirma' ||
      secilen.skillId === 'mat.cikarma.geriye-sayarak'
    )
      ? { hedefSkillId: secilen.skillId }
      : secilen.templateId === 'M-CIKAR-SEMBOL' && (
        secilen.skillId === 'mat.cikarma.fark-bulma' ||
        secilen.skillId === 'mat.cikarma.onluk-bozmadan-20'
      )
        ? { hedefSkillId: secilen.skillId }
        : {};

  const exercise = generator.uret(
    { seed: secilen.seed, difficulty: dugum.difficulty, mod, ...hedefParametreleri },
    createRng(secilen.seed),
  );

  if (!exercise.skillIds.includes(secilen.skillId as SkillId)) {
    throw new Error(
      `Şablon ${secilen.templateId}, seçilen ${secilen.skillId} düğümünü ölçmüyor.`,
    );
  }

  return exercise;
}
