import { useRef } from 'react';
import { randomPraise, randomRetry, type SpeakSource } from '../audio/speech';

/**
 * Bir maddenin geri bildirim sesleri (Adım 24). Ekranlar `key={itemId}` ile
 * yeniden kurulduğu için deneme sayacı her maddede 1'den başlar.
 */
export function useGeriBildirim(itemId: string): { ovgu: () => SpeakSource; tekrar: () => SpeakSource } {
  const deneme = useRef(0);
  return {
    ovgu: () => randomPraise(itemId),
    tekrar: () => {
      deneme.current += 1;
      return randomRetry(itemId, deneme.current);
    },
  };
}
