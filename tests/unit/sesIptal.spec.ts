// @vitest-environment happy-dom
/**
 * Konuşma kuyruğu: iptal edilen konuşma yavaş bir klip indirmesini beklemez (Adım 54, KG-116).
 * Hikâye açılışı (iki klip) "Girişi geç" ile kesilince yeni ekranın talimatı hemen istenmeli; eskiden kuyruk,
 * iptal edilmiş öğenin indirmesi bitene kadar kilitli kalıyordu (CI'da ısınma giriş klibi hiç istenmedi).
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { speech } from '../../src/audio/speech';

class SahteKaynak {
  buffer: unknown = null;
  onended: (() => void) | null = null;
  playbackRate = { value: 1 };
  connect() {}
  start() {
    setTimeout(() => this.onended?.(), 1);
  }
  stop() {}
}
class SahteBaglam {
  state = 'running';
  destination = {};
  async resume() {}
  createBuffer() {
    return {};
  }
  createBufferSource() {
    return new SahteKaynak();
  }
  async decodeAudioData() {
    return { duration: 0.001 };
  }
}

const istenen: string[] = [];
let yavasBitir: (() => void) | null = null;

beforeAll(async () => {
  (window as unknown as { AudioContext: unknown }).AudioContext = SahteBaglam;
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      istenen.push(url);
      const yanit = { ok: true, status: 200, arrayBuffer: async () => new ArrayBuffer(8) };
      // maskot/selam yavaş: elle bitirilene kadar bekler.
      if (url.includes('maskot/selam')) return new Promise((r) => (yavasBitir = () => r(yanit)));
      return Promise.resolve(yanit);
    }),
  );
  await speech.prime();
});
afterEach(() => speech.stop());

describe('iptal edilen konuşma kuyruğu kilitlemez', () => {
  it('yavaş indirme sürerken iptal edilen dizinin ardından yeni talimat hemen istenir ve çalınır', async () => {
    const eski = new AbortController();
    void speech.speak({ kind: 'sequence', keys: ['maskot.selam', 'hikaye.t1-1'] }, { priority: 'high', signal: eski.signal });
    await new Promise((r) => setTimeout(r, 5));
    expect(istenen.some((u) => u.includes('maskot/selam'))).toBe(true);

    // Ekran değişti: eski konuşma iptal, yeni ekranın talimatı.
    eski.abort();
    speech.stop();
    const yeni = speech.speak({ kind: 'key', key: 'isinma.basliyor' }, { priority: 'high', talimat: true });
    const sonuc = await Promise.race([yeni.then(() => 'bitti'), new Promise((r) => setTimeout(() => r('kilitli'), 300))]);
    expect(sonuc).toBe('bitti');
    expect(istenen.some((u) => u.includes('isinma/basliyor'))).toBe(true);
    // İptal edilen dizinin ikinci klibi hiç istenmez.
    expect(istenen.some((u) => u.includes('hikaye/t1-1'))).toBe(false);
    yavasBitir?.();
  });
});
