/**
 * Merkezi konuşma servisi.
 *
 * Çocuk okuyamıyor — bu servis sustuğu an uygulama kullanılamaz hâle gelir.
 * O yüzden burada üç şey pazarlık konusu değil:
 *
 *  1. ÇALMA GARANTİSİ. Sesler derleme zamanında üretilmiş dosyalar; Web Speech
 *     API'sine hiç bağımlı değiliz (cihazda tr-TR sesi olmayabilir, iOS'ta
 *     susabilir, Chrome'da çevrimdışı çalışmaz).
 *  2. KİLİT AÇMA. iOS ve tüm modern tarayıcılar sesi bir kullanıcı jesti olmadan
 *     çalmaz. `prime()` ilk dokunuşta çağrılmalı; öncesinde her `speak()` sessiz kalır.
 *  3. DOĞRU KESME. Ekran değişince önceki ekranın talimatı yenisinde çalmamalı.
 *
 * Web Audio API kullanılıyor (HTMLAudioElement değil), çünkü sayı dizilerini
 * ("yedi" + "artı" + "beş") boşluksuz ve tam zamanlamayla arka arkaya çalmak
 * gerekiyor — `<audio>` elemanlarıyla bu, duyulur biçimde tutarsız oluyor.
 */

import { AUDIO_MANIFEST, type SpeechKey } from './audioManifest.generated';

export type { SpeechKey };

export type SpeakSource =
  | { kind: 'key'; key: SpeechKey }
  /**
   * Klip dizisi — ~140 sayı/işlem klibiyle sonsuz matematik sorusu seslendirilir.
   * SADECE sayı ve işlem sözcükleri için. Cümleleri parçadan birleştirmeyin:
   * prozodi bozulur ve okuma öğrenen çocuğa yanlış dil modeli verir.
   */
  | { kind: 'sequence'; keys: SpeechKey[]; gapMs?: number };

export interface SpeakOptions {
  /** 'high' kuyruğu temizler ve mevcut konuşmayı keser (yeni ekran talimatı). */
  priority?: 'high' | 'normal';
  /** 1'den küçük = daha yavaş. "Tekrar dinle" ikinci kez daha yavaş çalar. */
  rate?: number;
  signal?: AbortSignal;
}

export type SpeechEngineState = 'kilitli' | 'hazir' | 'calisiyor';

/**
 * Vite'ın çözdüğü temel yol. Düz 'audio/' yazmak, uygulama bir alt dizinden
 * (ör. okul sunucusunda /okulumsun) sonu eğik çizgisiz bir URL ile açıldığında
 * yanlış klasöre çıkar ve TÜM sesler sessizce kaybolur.
 *
 * `import.meta.env` yalnızca Vite'ta tanımlıdır; tsx/Node altında (CI betikleri,
 * testler) modül yüklenirken tanımsız erişimle patlamamak için güvenli varsayılana
 * düşer. Üretimde (Vite) gerçek BASE_URL kullanılmaya devam eder.
 */
const BASE_URL = import.meta.env?.BASE_URL ?? '/';
const AUDIO_BASE = `${BASE_URL.replace(/\/?$/, '/')}audio/`;
const DEFAULT_GAP_MS = 90;
/** Kuyruk sınırı: çocuk hızlı hızlı dokununca talimatlar birikmesin. */
const MAX_QUEUE = 3;

interface QueueItem {
  source: SpeakSource;
  options: SpeakOptions;
  resolve: () => void;
}

class SpeechService {
  #ctx: AudioContext | null = null;
  #buffers = new Map<SpeechKey, AudioBuffer>();
  #inflight = new Map<SpeechKey, Promise<AudioBuffer | null>>();
  #queue: QueueItem[] = [];
  #playing: AudioBufferSourceNode | null = null;
  #draining = false;
  #last: { source: SpeakSource; options: SpeakOptions } | null = null;
  #primed = false;
  #listeners = new Set<(s: SpeechEngineState) => void>();

  get primed(): boolean {
    return this._primed();
  }

  private _primed(): boolean {
    return this.#primed && this.#ctx?.state === 'running';
  }

  get state(): SpeechEngineState {
    if (!this._primed()) return 'kilitli';
    return this.#playing ? 'calisiyor' : 'hazir';
  }

  subscribe(fn: (s: SpeechEngineState) => void): () => void {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  #emit(): void {
    for (const fn of this.#listeners) fn(this.state);
  }

  /**
   * Ses kilidini açar. MUTLAKA bir kullanıcı jestinin (pointerup/click) içinden
   * senkron olarak çağrılmalı — `await` sonrasında çağrılırsa tarayıcı jesti
   * artık "kullanıcı etkileşimi" saymaz ve kilit açılmaz.
   */
  async prime(): Promise<void> {
    if (!this.#ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.#ctx = new Ctor();
    }
    if (this.#ctx.state === 'suspended') await this.#ctx.resume();

    // Sessiz bir buffer çalmak, bazı iOS sürümlerinde bağlamı gerçekten uyandırır.
    // resume() tek başına yeterli olmayabiliyor.
    const silent = this.#ctx.createBuffer(1, 1, 22050);
    const node = this.#ctx.createBufferSource();
    node.buffer = silent;
    node.connect(this.#ctx.destination);
    node.start(0);

    this.#primed = true;
    this.#emit();
  }

  /** Klipleri önden indirip çözer. Ekran geçişinde takılma olmasın diye. */
  async prefetch(keys: readonly SpeechKey[]): Promise<void> {
    await Promise.all(keys.map((k) => this.#load(k)));
  }

  async speak(source: SpeakSource, options: SpeakOptions = {}): Promise<void> {
    this.#last = { source, options };

    if (options.priority === 'high') this.stop();

    // Kuyruk dolduysa en eskisini düşür — biriken talimat çocuğu şaşırtır.
    if (this.#queue.length >= MAX_QUEUE) {
      this.#queue.shift()?.resolve();
    }

    const done = new Promise<void>((resolve) => {
      this.#queue.push({ source, options, resolve });
    });

    void this.#drain();
    return done;
  }

  /**
   * Son söyleneni tekrarlar — "tekrar dinle" butonu.
   * `rate` ile yavaşlatılabilir; yardım kademesi 1'de bunu kullanıyoruz.
   */
  async repeatLast(rate?: number): Promise<void> {
    if (!this.#last) return;
    return this.speak(this.#last.source, {
      ...this.#last.options,
      rate: rate ?? this.#last.options.rate,
      priority: 'high',
    });
  }

  /**
   * Kuyruğu ve mevcut konuşmayı durdurur.
   * Ekran değişiminde ZORUNLU — yoksa önceki ekranın talimatı yenisinde çalar.
   */
  stop(): void {
    for (const item of this.#queue) item.resolve();
    this.#queue = [];
    if (this.#playing) {
      try {
        this.#playing.stop();
      } catch {
        // Zaten bitmişse stop() hata atar; önemsiz.
      }
      this.#playing = null;
    }
    this.#emit();
  }

  // ------------------------------------------------------------------ dahili

  async #drain(): Promise<void> {
    if (this.#draining) return;
    this.#draining = true;

    try {
      while (this.#queue.length > 0) {
        const item = this.#queue.shift()!;
        if (item.options.signal?.aborted) {
          item.resolve();
          continue;
        }
        try {
          await this.#play(item.source, item.options);
        } catch {
          // Tek bir klip çalmazsa oturum durmaz; sıradakine geçilir.
        }
        item.resolve();
      }
    } finally {
      this.#draining = false;
      this.#emit();
    }
  }

  async #play(source: SpeakSource, options: SpeakOptions): Promise<void> {
    if (!this._primed()) return;

    const keys = source.kind === 'key' ? [source.key] : source.keys;
    const gap = source.kind === 'sequence' ? (source.gapMs ?? DEFAULT_GAP_MS) : 0;

    for (let i = 0; i < keys.length; i++) {
      if (options.signal?.aborted) return;
      const buffer = await this.#load(keys[i]);
      if (!buffer) continue;
      await this.#playBuffer(buffer, options.rate ?? 1);
      if (gap > 0 && i < keys.length - 1) await sleep(gap);
    }
  }

  #playBuffer(buffer: AudioBuffer, rate: number): Promise<void> {
    const ctx = this.#ctx!;
    return new Promise<void>((resolve) => {
      const node = ctx.createBufferSource();
      node.buffer = buffer;
      node.playbackRate.value = rate;
      node.connect(ctx.destination);

      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        if (this.#playing === node) this.#playing = null;
        resolve();
      };
      node.onended = finish;

      this.#playing = node;
      this.#emit();
      node.start(0);

      // Güvenlik ağı: bazı tarayıcılarda kesilen bir kaynak `onended`
      // tetiklemeyebiliyor. Kuyruk kilitlenmesin.
      setTimeout(finish, (buffer.duration / rate) * 1000 + 400);
    });
  }

  async #load(key: SpeechKey): Promise<AudioBuffer | null> {
    const cached = this.#buffers.get(key);
    if (cached) return cached;

    const pending = this.#inflight.get(key);
    if (pending) return pending;

    const task = (async () => {
      const entry = AUDIO_MANIFEST[key];
      if (!entry) return null;
      try {
        const res = await fetch(`${AUDIO_BASE}${entry.file}`);
        if (!res.ok) return null;
        const bytes = await res.arrayBuffer();
        const buffer = await this.#ctx!.decodeAudioData(bytes);
        this.#buffers.set(key, buffer);
        return buffer;
      } catch {
        // Ses indirilemezse ekran görsel yönergesiyle çalışmaya devam eder.
        return null;
      } finally {
        this.#inflight.delete(key);
      }
    })();

    this.#inflight.set(key, task);
    return task;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Uygulama boyunca tek örnek. */
export const speech = new SpeechService();

// --------------------------------------------------------------- yardımcılar

/** Bir sayıyı sesli okur. */
export function sayNumber(n: number): SpeakSource {
  return { kind: 'key', key: `sayi.${n}` as SpeechKey };
}

/**
 * Aritmetik ifadeyi klip dizisine çevirir: 7 + 5 = ?
 * Bu, matematik sorularının seslendirilmesini tamamen çevrimdışı ve bedava kılar.
 */
export function sayExpression(a: number, op: '+' | '-', b: number): SpeakSource {
  return {
    kind: 'sequence',
    keys: [
      `sayi.${a}` as SpeechKey,
      op === '+' ? 'op.arti' : 'op.eksi',
      `sayi.${b}` as SpeechKey,
      'soru.kac-eder',
    ],
  };
}

/** Doğru cevap onayı — 6 varyant arasından rastgele, monotonluk kırıcı. */
export function randomPraise(): SpeakSource {
  const n = 1 + Math.floor(Math.random() * 6);
  return { kind: 'key', key: `geri.dogru-${n}` as SpeechKey };
}

/** "Tekrar dene" — 'yanlış' kelimesi hiçbir varyantta geçmez. */
export function randomRetry(): SpeakSource {
  const n = 1 + Math.floor(Math.random() * 3);
  return { kind: 'key', key: `geri.tekrar-${n}` as SpeechKey };
}
