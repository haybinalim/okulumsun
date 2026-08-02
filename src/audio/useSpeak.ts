import { useEffect, useRef, useSyncExternalStore } from 'react';
import { speech, type SpeakOptions, type SpeakSource, type SpeechKey } from './speech';

/** Konuşma motorunun anlık durumu — ses kilidi ekranı ve teşhis için. */
export function useSpeechState() {
  return useSyncExternalStore(
    (cb) => speech.subscribe(cb),
    () => speech.state,
  );
}

/**
 * Ekran talimatını söyler ve EKRAN DEĞİŞİNCE KESER.
 *
 * Bu temizlik ihmal edilirse önceki ekranın talimatı yeni ekranda çalmaya devam
 * eder — çocuk için en kafa karıştırıcı hatalardan biri, çünkü duyduğu şeyle
 * gördüğü şey uyuşmaz ve okuyup kontrol edemez.
 *
 * `deps` değişince talimat yeniden söylenir (ör. yeni soru geldi).
 */
export function useScreenSpeech(source: SpeakSource | null, deps: unknown[] = []): void {
  useEffect(() => {
    if (!source) return;
    const controller = new AbortController();
    void speech.speak(source, { priority: 'high', signal: controller.signal });

    return () => {
      controller.abort();
      speech.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Klipleri önden yükler; ekran geçişinde takılma olmaz. */
export function usePrefetch(keys: readonly SpeechKey[]): void {
  useEffect(() => {
    void speech.prefetch(keys);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys.join('|')]);
}

/**
 * "Tekrar dinle" davranışı.
 *
 * Arka arkaya basıldığında yavaşlar (1.0 → 0.85 → 0.75). Çocuk anlamadığı için
 * tekrar basıyordur; aynı hızda tekrarlamak aynı sonucu verir.
 */
export function useReplay(): () => void {
  const count = useRef(0);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );

  return () => {
    count.current = Math.min(count.current + 1, 2);
    const rate = [1, 0.85, 0.75][count.current];
    void speech.repeatLast(rate);

    // Bir süre basılmazsa hız normale döner.
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      count.current = 0;
    }, 8000);
  };
}

export function speak(source: SpeakSource, options?: SpeakOptions): Promise<void> {
  return speech.speak(source, options);
}
