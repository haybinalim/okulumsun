import { useState } from 'react';
import { BigButton } from '../ui/primitives/BigButton';
import { speech, sayExpression, randomPraise, randomRetry } from '../audio/speech';
import { useReplay, useSpeechState } from '../audio/useSpeak';
import { AUDIO_MANIFEST } from '../audio/audioManifest.generated';

/**
 * GEÇİCİ — Adım 1 doğrulama ekranı.
 *
 * Ses altyapısının en riskli parça olduğu varsayımını sınar:
 *   - Kilit açıldı mı, motor gerçekten çalışıyor mu
 *   - Sayı dizisi ("yedi artı beş kaç eder") boşluksuz akıyor mu
 *   - Ekran değişiminde kuyruk temizleniyor mu
 *   - "Tekrar dinle" arka arkaya basınca yavaşlıyor mu
 *
 * Adım 4'te gerçek alıştırma ekranıyla değiştirilecek.
 */
export function AudioProbe() {
  const state = useSpeechState();
  const replay = useReplay();
  const [log, setLog] = useState<string[]>([]);

  const note = (s: string) => setLog((l) => [s, ...l].slice(0, 6));

  const clipCount = Object.keys(AUDIO_MANIFEST).length;

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--size-gap-tight)',
      }}
    >
      <div style={{ fontSize: 'var(--text-adult)', color: 'var(--color-ink-soft)' }}>
        motor: <b>{state}</b> · {clipCount} klip
      </div>

      <div style={{ display: 'flex', gap: 'var(--size-gap-tight)', flexWrap: 'wrap' }}>
        <Probe
          label="7 + 5 kaç eder?"
          onPress={() => {
            note('dizi: 7 artı 5 kaç eder');
            void speech.speak(sayExpression(7, '+', 5));
          }}
        />
        <Probe
          label="Kaç tane var?"
          onPress={() => {
            note('tek klip: soru.kac-tane');
            void speech.speak({ kind: 'key', key: 'soru.kac-tane' });
          }}
        />
        <Probe
          label="Aferin"
          onPress={() => {
            note('rastgele övgü');
            void speech.speak(randomPraise());
          }}
        />
        <Probe
          label="Tekrar dene"
          onPress={() => {
            note('rastgele tekrar daveti');
            void speech.speak(randomRetry());
          }}
        />
        <Probe
          label="100'e kadar say"
          onPress={() => {
            note('uzun dizi — kesme testi için');
            void speech.speak({
              kind: 'sequence',
              keys: Array.from({ length: 12 }, (_, i) => `sayi.${i + 1}` as never),
              gapMs: 40,
            });
          }}
        />
        <Probe
          label="Tekrar dinle"
          onPress={() => {
            note('repeatLast — arka arkaya bas, yavaşlamalı');
            replay();
          }}
        />
        <Probe
          label="KES"
          onPress={() => {
            note('stop() — kuyruk temizlendi');
            speech.stop();
          }}
        />
      </div>

      <ul
        style={{
          margin: 0,
          paddingLeft: 'var(--size-gap-tight)',
          fontSize: 'var(--text-adult)',
          color: 'var(--color-ink-soft)',
        }}
      >
        {log.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
    </section>
  );
}

function Probe({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <BigButton
      label={label}
      size="tapMin"
      onPress={onPress}
      style={{ paddingInline: 'var(--size-gap-tight)', fontSize: 'var(--text-adult)' }}
    >
      {label}
    </BigButton>
  );
}
