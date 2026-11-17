// @vitest-environment happy-dom
/**
 * Türkçe klibin matematikle AYNI `speech` servisinde çalınması (sahte AudioContext/fetch; gerçek ses, TTS, ağ yok).
 * Kurallar: yalnız `durum: "var"` çalar; `eksik` sessiz + "Ses yok" (false); manifest/dosya alınamazsa sessiz + hata
 * kaydı (tür 'ses'), çökme yok; tek ünsüz anahtar/metin çalınmaz (D-11, K-OY-03); kesme/iptal matematikle aynı;
 * bayrak kapalıyken (`VITE_DERS_TUR` yok) Türkçe anahtar hiç çözülmez.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const baslatilan: string[] = [];
let cozmeHatasi = false;
class SahteKaynak {
  buffer: unknown = null;
  onended: (() => void) | null = null;
  playbackRate = { value: 1 };
  connect() {}
  start() {
    baslatilan.push('basladi');
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
    if (cozmeHatasi) throw new Error('cozulemedi');
    return { duration: 0.001 };
  }
}

interface Satir {
  anahtar: string;
  metin: string;
  durum: 'var' | 'eksik';
  dosya?: string;
}
const SATIRLAR: Satir[] = [
  { anahtar: 'tur.sozcuk.kale', metin: 'kale', durum: 'var', dosya: 'sozcuk/kale.m4a' },
  { anahtar: 'tur.sozcuk.nar', metin: 'nar', durum: 'eksik' },
  { anahtar: 'tur.sozcuk.kar', metin: 'kar', durum: 'var', dosya: 'sozcuk/kar.m4a' },
  // Bozuk satırlar: dosya yolu anahtarla tutmuyor; metin tek ünsüz.
  { anahtar: 'tur.sozcuk.mum', metin: 'mum', durum: 'var', dosya: 'sozcuk/baska.m4a' },
  { anahtar: 'tur.hece.b', metin: 'b', durum: 'var', dosya: 'hece/b.m4a' },
];

const istekler: string[] = [];
let yavas: Record<string, () => void> = {};
let manifestYaniti: 'tamam' | '404' | 'bozuk' | 'ag' = 'tamam';
let sesYaniti: 'tamam' | '404' = 'tamam';

function sahteFetch(url: string): Promise<unknown> {
  istekler.push(url);
  if (url.endsWith('ses/klipler.json')) {
    if (manifestYaniti === 'ag') return Promise.reject(new TypeError('ag'));
    if (manifestYaniti === '404') return Promise.resolve({ ok: false, status: 404 });
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => (manifestYaniti === 'bozuk' ? { degil: 1 } : { surum: 1, klipler: SATIRLAR }),
    });
  }
  const yanit = sesYaniti === '404' ? { ok: false, status: 404 } : { ok: true, status: 200, arrayBuffer: async () => new ArrayBuffer(8) };
  if (url.includes('sozcuk/kar.m4a')) return new Promise((r) => (yavas.kar = () => r(yanit)));
  return Promise.resolve(yanit);
}

async function kur(bayrak: '1' | '') {
  vi.resetModules();
  vi.stubEnv('VITE_DERS_TUR', bayrak);
  (window as unknown as { AudioContext: unknown }).AudioContext = SahteBaglam;
  vi.stubGlobal('fetch', vi.fn(sahteFetch));
  const { speech } = await import('../../src/audio/speech');
  const { turKlipleriniIste } = await import('../../src/ui/tur/turSes');
  const { kayitlariAl, kayitlariTemizle } = await import('../../src/hata/hataKaydi');
  kayitlariTemizle();
  await speech.prime();
  baslatilan.length = 0; // prime() sessiz bir tampon başlatır
  return { speech, turKlipleriniIste, kayitlariAl };
}
const mp4ler = () => istekler.filter((u) => u.endsWith('.m4a'));
const sesHatalari = (kayitlariAl: () => readonly { tur: string; mesaj: string }[]) => kayitlariAl().filter((k) => k.tur === 'ses');

beforeEach(() => {
  baslatilan.length = 0;
  istekler.length = 0;
  yavas = {};
  manifestYaniti = 'tamam';
  sesYaniti = 'tamam';
  cozmeHatasi = false;
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('Türkçe klip: klip başına karar', () => {
  it('`var` klip çalınır (aynı kökenden göreli yol; klipler.json `dosya` alanıyla birebir)', async () => {
    const { turKlipleriniIste } = await kur('1');
    expect(await turKlipleriniIste(['tur.sozcuk.kale'])).toBe(true);
    await new Promise((r) => setTimeout(r, 20));
    expect(istekler).toContain('./tur/ses/klipler.json');
    expect(mp4ler()).toEqual(['./tur/ses/sozcuk/kale.m4a']);
    expect(baslatilan).toHaveLength(1);
  });

  it('`eksik` klip sessiz kalır, ses dosyası istenmez ve "Ses yok" (false) döner', async () => {
    const { turKlipleriniIste, kayitlariAl } = await kur('1');
    expect(await turKlipleriniIste(['tur.sozcuk.nar'])).toBe(false);
    await new Promise((r) => setTimeout(r, 20));
    expect(mp4ler()).toEqual([]);
    expect(baslatilan).toHaveLength(0);
    // Beklenen durum, hata değil: kayıt yok.
    expect(sesHatalari(kayitlariAl)).toEqual([]);
  });

  it('karışık istekte yalnız `var` olan çalar; yine de "Ses yok" (en az biri sessiz)', async () => {
    const { turKlipleriniIste } = await kur('1');
    expect(await turKlipleriniIste(['tur.sozcuk.kale', 'tur.sozcuk.nar'])).toBe(false);
    await new Promise((r) => setTimeout(r, 400));
    expect(mp4ler()).toEqual(['./tur/ses/sozcuk/kale.m4a']);
    expect(baslatilan).toHaveLength(1);
  });

  it('klipler.json yüklenemezse (404 / ağ / bozuk biçim) sessiz + hata kaydı (tür ses), çökme yok', async () => {
    for (const durum of ['404', 'ag', 'bozuk'] as const) {
      istekler.length = 0;
      baslatilan.length = 0;
      manifestYaniti = durum;
      const { turKlipleriniIste, kayitlariAl } = await kur('1');
      await expect(turKlipleriniIste(['tur.sozcuk.kale'])).resolves.toBe(false);
      await new Promise((r) => setTimeout(r, 20));
      expect(mp4ler(), durum).toEqual([]);
      expect(baslatilan, durum).toHaveLength(0);
      expect(sesHatalari(kayitlariAl).length, durum).toBe(1);
      // İkinci istek yeniden dener ama kaydı çoğaltmaz.
      await turKlipleriniIste(['tur.sozcuk.kale']);
      expect(sesHatalari(kayitlariAl).length, `${durum}: tek kayıt`).toBe(1);
    }
  });

  it('`var` denen klibin dosyası 404 ise sessizce "çaldı" sayılmaz: "Ses yok" kalır + hata kaydı', async () => {
    sesYaniti = '404';
    const { turKlipleriniIste, kayitlariAl } = await kur('1');
    expect(await turKlipleriniIste(['tur.sozcuk.kale'])).toBe(false);
    expect(baslatilan).toHaveLength(0);
    expect(sesHatalari(kayitlariAl).some((k) => k.mesaj.includes('tur.sozcuk.kale'))).toBe(true);
  });

  it('geçici 404 sonra başarı: "Ses yok" kalkar ve klip çalar (kalıcı başarısız işareti kalmaz)', async () => {
    sesYaniti = '404';
    const { turKlipleriniIste } = await kur('1');
    expect(await turKlipleriniIste(['tur.sozcuk.kale'])).toBe(false);
    sesYaniti = 'tamam';
    baslatilan.length = 0;
    expect(await turKlipleriniIste(['tur.sozcuk.kale'])).toBe(true);
    await vi.waitFor(() => expect(baslatilan.length).toBeGreaterThan(0));
  });

  it('aynı alınamayan klip tekrar istenirse yeniden denenir ama hata kaydı oturumda tek', async () => {
    sesYaniti = '404';
    const { turKlipleriniIste, kayitlariAl } = await kur('1');
    for (let i = 0; i < 3; i++) expect(await turKlipleriniIste(['tur.sozcuk.kale'])).toBe(false);
    expect(mp4ler().length).toBeGreaterThan(1);
    expect(sesHatalari(kayitlariAl).filter((k) => k.mesaj.includes('tur.sozcuk.kale'))).toHaveLength(1);
  });

  it('baytlar alındı ama çözülemedi (bozuk dosya): sessiz, "Ses yok" kalır + hata kaydı', async () => {
    cozmeHatasi = true;
    const { turKlipleriniIste, kayitlariAl } = await kur('1');
    expect(await turKlipleriniIste(['tur.sozcuk.kale'])).toBe(false);
    expect(baslatilan).toHaveLength(0);
    expect(sesHatalari(kayitlariAl).some((k) => k.mesaj.includes('tur.sozcuk.kale'))).toBe(true);
  });

  it('D-11 / K-OY-03: tek ünsüz anahtar, tek ünsüz metin ve dosya yolu tutmayan satır çalınmaz', async () => {
    const { turKlipleriniIste } = await kur('1');
    expect(await turKlipleriniIste(['tur.harf.b'])).toBe(false);
    expect(await turKlipleriniIste(['tur.hece.b'])).toBe(false);
    expect(await turKlipleriniIste(['tur.sozcuk.mum'])).toBe(false);
    await new Promise((r) => setTimeout(r, 20));
    expect(mp4ler()).toEqual([]);
    expect(baslatilan).toHaveLength(0);
  });

  it('bayrak kapalıyken (VITE_DERS_TUR yok) Türkçe anahtar hiç çözülmez: ağ isteği yok, sessiz', async () => {
    const { speech } = await kur('');
    await speech.speak({ kind: 'key', key: 'tur.sozcuk.kale' }, { priority: 'high' });
    expect(istekler).toEqual([]);
    expect(baslatilan).toHaveLength(0);
  });
});

describe('Türkçe klip: kesme/iptal matematikle aynı', () => {
  it('stop() yavaş indirmeyi beklemez; kesilen klip çalınmaz, yeni talimat hemen çalar', async () => {
    const { speech } = await kur('1');
    void speech.speak({ kind: 'key', key: 'tur.sozcuk.kar' }, { priority: 'high' });
    await new Promise((r) => setTimeout(r, 15));
    expect(mp4ler()).toContain('./tur/ses/sozcuk/kar.m4a');
    speech.stop();
    const yeni = speech.speak({ kind: 'key', key: 'tur.sozcuk.kale' }, { priority: 'high', talimat: true });
    const sonuc = await Promise.race([yeni.then(() => 'bitti'), new Promise((r) => setTimeout(() => r('kilitli'), 300))]);
    expect(sonuc).toBe('bitti');
    expect(baslatilan).toHaveLength(1);
    yavas.kar?.();
    await new Promise((r) => setTimeout(r, 20));
    expect(baslatilan).toHaveLength(1);
  });

  it('iptal edilmiş sinyal klibi hiç başlatmaz', async () => {
    const { turKlipleriniIste } = await kur('1');
    const kontrol = new AbortController();
    kontrol.abort();
    expect(await turKlipleriniIste(['tur.sozcuk.kale'], { signal: kontrol.signal })).toBe(false);
    await new Promise((r) => setTimeout(r, 20));
    expect(mp4ler()).toEqual([]);
    expect(baslatilan).toHaveLength(0);
  });

  it('dizinin ortasında sinyal iptali kesilen klibi de sıradakini de ÇALMAZ (indirme arka planda sürebilir)', async () => {
    const { turKlipleriniIste } = await kur('1');
    const kontrol = new AbortController();
    void turKlipleriniIste(['tur.sozcuk.kar', 'tur.sozcuk.kale'], { signal: kontrol.signal });
    await new Promise((r) => setTimeout(r, 15));
    kontrol.abort();
    yavas.kar?.();
    await new Promise((r) => setTimeout(r, 30));
    expect(baslatilan).toHaveLength(0);
  });
});
