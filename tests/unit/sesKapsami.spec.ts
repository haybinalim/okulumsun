import { describe, expect, it } from 'vitest';
import { AUDIO_MANIFEST, type SpeechKey } from '../../src/audio/audioManifest.generated';
import type { SpeakSource } from '../../src/audio/speech';
import { skillsData } from '../../src/content/skillsData';
import { REGISTRY } from '../../src/exercises/registry';
import { secilenSoruyuUret } from '../../src/progress/oturumRuntime';

function anahtarlar(source: SpeakSource): readonly SpeechKey[] {
  return source.kind === 'key' ? [source.key] : source.keys;
}

function manifestteVarMi(source: SpeakSource | undefined): boolean {
  return source == null || anahtarlar(source).every((key) => AUDIO_MANIFEST[key] != null);
}

describe('soru ses kapsamı', () => {
  it('her kayıtlı şablonda üretilen soru kökü ve seçenek sesleri manifestte bulunur', () => {
    const eksikler: string[] = [];

    for (const [templateId] of REGISTRY) {
      const dugum = skillsData.find((aday) =>
        aday.durum === 'hazir' && aday.exerciseTemplates.includes(templateId),
      );
      if (!dugum) {
        eksikler.push(`${templateId}: hazır beceri eşleşmesi yok`);
        continue;
      }

      for (let seed = 0; seed < 64; seed++) {
        const exercise = secilenSoruyuUret(
          { skillId: dugum.id, templateId, seed, kova: 'frontier' },
          skillsData,
          'kisisel',
        );

        if (!manifestteVarMi(exercise.prompt.ses)) {
          eksikler.push(`${templateId}, seed=${seed}: soru sesi manifestte yok`);
        }

        for (const option of exercise.options) {
          if (!manifestteVarMi(option.ses)) {
            eksikler.push(`${templateId}, seed=${seed}, seçenek=${option.id}: seçenek sesi manifestte yok`);
          }
        }
      }
    }

    expect(eksikler).toEqual([]);
  });
});


describe('P0 karar ekranı yönlendirme sesleri', () => {
  it('mod, tema, etkinlik ve kilitli içerik yönergeleri çevrimdışı manifestte bulunur', () => {
    const gerekliAnahtarlar: SpeechKey[] = [
      'ui.mod-sec',
      'ui.tema-sec',
      'ui.konu-sec',
      'ui.kilitli-acik-konu',
    ];

    expect(gerekliAnahtarlar.filter((key) => AUDIO_MANIFEST[key] == null)).toEqual([]);
  });
});
