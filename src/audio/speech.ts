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

import { e2eKlipAlindi } from '../dev/e2eKanca';
import { AUDIO_MANIFEST, type SpeechKey } from './audioManifest.generated';
import { kayitEkle } from '../hata/hataKaydi';
import { hash32 } from '../exercises/rng';
import { EN_DUSUK_CALMA_HIZI } from '../design/kapsayicilik';

export type { SpeechKey };

export type SpeakSource =
  | { kind: 'key'; key: SpeechKey }
  /**
   * Klip dizisi — ~140 sayı/işlem klibiyle sonsuz matematik sorusu seslendirilir.
   * SADECE sayı ve işlem sözcükleri için. Cümleleri parçadan birleştirmeyin:
   * prozodi bozulur ve okuma öğrenen çocuğa yanlış dil modeli verir.
   */
  | {
      kind: 'sequence';
      keys: SpeechKey[];
      gapMs?: number;
      /**
       * Yalnız ilk klipten sonraki ara (KG-110): bir giriş/duyuru cümlesi (ör. `isinma.basliyor`) ilk
       * sorunun talimatının önüne eklenince iki cümle arasında doğal bir nefes payı. Verilmezse `gapMs`.
       */
      ilkAraMs?: number;
    };

export interface SpeakOptions {
  /** 'high' kuyruğu temizler ve mevcut konuşmayı keser (yeni ekran talimatı). */
  priority?: 'high' | 'normal';
  /** 1'den küçük = daha yavaş. "Tekrar dinle" ikinci kez daha yavaş çalar. */
  rate?: number;
  signal?: AbortSignal;
  /** Ekran talimatı mı? (Adım 55: talimat tekrarı yalnız bunu yeniden söyler, övgü/tekrar-dene klibini değil.) */
  talimat?: boolean;
  /**
   * "Tekrar dinle" ve talimat tekrarının çalacağı kaynak (KG-110). Verilirse `repeatLast` ve
   * `talimatiTekrarla` bunu çalar (ör. ilk sorunun önündeki giriş cümlesi tekrarda yinelenmez;
   * `Prompt.tekrarSes`). Verilmezse söylenen kaynağın kendisi.
   */
  tekrar?: SpeakSource;
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
  /** Son ekran talimatı (Adım 55). */
  #sonTalimat: SpeakSource | null = null;
  /** Temel çalma hızı: veli "Ses hızı" × kapsayıcılık temposu (Adım 55). Her klibin hızıyla çarpılır. */
  #temelHiz = 1;

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

  /** Temel çalma hızını ayarlar (Adım 55); geçersiz değer 1 sayılır. Çalan klibi değiştirmez. */
  temelHizAyarla(hiz: number): void {
    this.#temelHiz = Number.isFinite(hiz) && hiz > 0 ? hiz : 1;
  }

  get temelHiz(): number {
    return this.#temelHiz;
  }

  /**
   * Son ekran talimatını bir kez yeniden söyler (Adım 55, talimat tekrarı). Konuşma sürüyorsa
   * veya talimat yoksa hiçbir şey yapmaz ve `false` döner.
   */
  talimatiTekrarla(): boolean {
    if (!this.#sonTalimat || !this._primed() || this.#playing || this.#queue.length > 0) return false;
    void this.speak(this.#sonTalimat, { priority: 'high', talimat: true });
    return true;
  }

  /** Ekran kapanınca talimat unutulur: önceki ekranın talimatı yenisinde tekrarlanmaz. */
  talimatiUnut(): void {
    this.#sonTalimat = null;
  }

  async speak(source: SpeakSource, options: SpeakOptions = {}): Promise<void> {
    const tekrarKaynagi = options.tekrar ?? source;
    this.#last = { source: tekrarKaynagi, options };
    if (options.talimat) this.#sonTalimat = tekrarKaynagi;

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
    for (let i = 0; i < keys.length; i++) {
      if (options.signal?.aborted) return;
      // İptal edilen konuşma, yavaş bir klip indirmesini BEKLEMEZ (Adım 54, KG-116): ekran değişince kuyruk
      // hemen yeni ekranın talimatına geçer. İndirme arka planda sürer ve önbelleğe girer.
      const buffer = await this.#yukleVeyaIptal(keys[i], options.signal);
      if (options.signal?.aborted) return;
      if (!buffer) continue;
      await this.#playBuffer(buffer, Math.max(EN_DUSUK_CALMA_HIZI, (options.rate ?? 1) * this.#temelHiz));
      const gap = klipArasi(source, i);
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

  /** `#load`, ama sinyal iptal edilirse hemen `null` döner (indirme sürer, sonuç önbelleğe girer). */
  #yukleVeyaIptal(key: SpeechKey, signal: AbortSignal | undefined): Promise<AudioBuffer | null> {
    const yukleme = this.#load(key);
    if (!signal) return yukleme;
    if (signal.aborted) return Promise.resolve(null);
    return new Promise<AudioBuffer | null>((resolve) => {
      const iptal = () => resolve(null);
      signal.addEventListener('abort', iptal, { once: true });
      void yukleme.then((b) => {
        signal.removeEventListener('abort', iptal);
        resolve(b);
      });
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
        if (!res.ok) {
          kayitEkle({ tur: 'ses', mesaj: `klip yüklenemedi: ${key} (HTTP ${res.status})` });
          return null;
        }
        const bytes = await res.arrayBuffer();
        e2eKlipAlindi(key);
        const buffer = await this.#ctx!.decodeAudioData(bytes);
        this.#buffers.set(key, buffer);
        return buffer;
      } catch {
        // Ses indirilemezse ekran görsel yönergesiyle çalışmaya devam eder.
        // Anahtar içerik kimliğidir, kişisel değil (Adım 23).
        kayitEkle({ tur: 'ses', mesaj: `klip yüklenemedi: ${key}` });
        return null;
      } finally {
        this.#inflight.delete(key);
      }
    })();

    this.#inflight.set(key, task);
    return task;
  }
}

/** `i`. klipten sonraki ara (ms): tek klipte 0; dizide ilk aradan sonra `gapMs` (KG-110 `ilkAraMs`). SAF. */
export function klipArasi(source: SpeakSource, i: number): number {
  if (source.kind !== 'sequence') return 0;
  if (i === 0 && source.ilkAraMs !== undefined) return source.ilkAraMs;
  return source.gapMs ?? DEFAULT_GAP_MS;
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

export const OVGU_SAYISI = 6;
export const TEKRAR_SAYISI = 3;

/**
 * Doğru cevap sonrası övgü — tohumdan (madde kimliği) DETERMİNİSTİK seçilir
 * (PLAN §0: `Math.random` YASAK; Adım 24). Yeni madde = yeni tohum, monotonluk yok.
 */
export function randomPraise(tohum: string): SpeakSource {
  const n = 1 + (hash32(`ovgu:${tohum}`) % OVGU_SAYISI);
  return { kind: 'key', key: `geri.dogru-${n}` as SpeechKey };
}

/**
 * "Tekrar dene" — 'yanlış' kelimesi hiçbir varyantta geçmez. Deterministik:
 * başlangıç klibi madde kimliğinden, sonraki her deneme bir sonraki klip
 * (aynı maddede ardışık iki yanlışta aynı klip ÇALMAZ).
 */
export function randomRetry(tohum: string, denemeNo = 1): SpeakSource {
  const baslangic = hash32(`tekrar:${tohum}`) % TEKRAR_SAYISI;
  const n = 1 + ((baslangic + Math.max(0, denemeNo - 1)) % TEKRAR_SAYISI);
  return { kind: 'key', key: `geri.tekrar-${n}` as SpeechKey };
}
