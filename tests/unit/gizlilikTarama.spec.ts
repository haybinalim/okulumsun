import { describe, expect, it } from 'vitest';
import { tara, yorumlariAt } from '../../scripts/gizlilik/kurallar';

const kurallar = (dosya: string, kaynak: string) => tara(dosya, kaynak).map((b) => b.kural);

describe('K9 gizlilik taraması (Adım 24)', () => {
  it('tuzak metinlerinde kurallar yakalanır', () => {
    const tuzak = [
      'const n = Math.random();',
      'navigator.sendBeacon("/x", veri);',
      'const s = new WebSocket("wss://x");',
      'const x = new XMLHttpRequest();',
      'const e = new EventSource("/akis");',
      'document.cookie = "a=1";',
      'sessionStorage.setItem("a", "1");',
      'window.parent.postMessage(veri, "*");',
      'localStorage.setItem("okulumsun.ogrenci", ad);',
      'const db = new Dexie("x");',
      'await fetch("https://dis.example.com");',
    ].join('\n');
    const b = tara('src/ui/tuzak.ts', tuzak);
    expect(b.map((x) => x.satir)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 8, 9, 10, 11]);
  });

  it('üst pencere erişimi (Adım 56): parent/opener yasak; window.top yalnız gömülü açılışta kimlik karşılaştırması', () => {
    expect(kurallar('src/ui/a.ts', 'const p = window.parent;')).toEqual(['window.parent/opener erişimi yasak']);
    expect(kurallar('src/ui/a.ts', 'window.opener.location = x;')).toEqual(['window.parent/opener erişimi yasak']);
    expect(kurallar('src/ui/a.ts', 'const t = window.self !== window.top;')).toHaveLength(1);
    expect(kurallar('src/platform/gomuluAcilis.ts', 'return window.self !== window.top;')).toEqual([]);
    expect(kurallar('src/platform/gomuluAcilis.ts', 'window.top.location.href = x;')).toHaveLength(1);
  });

  it('yorum satırı ve blok yorum yakalanmaz, satır numarası korunur', () => {
    const kaynak = '// Math.random() yasak\n/* new WebSocket(\n sendBeacon( */\nconst a = 1;\nMath.random();';
    expect(yorumlariAt(kaynak).split('\n')).toHaveLength(5);
    expect(tara('src/a.ts', kaynak)).toEqual([{ dosya: 'src/a.ts', satir: 5, kural: 'Math.random yasak' }]);
  });

  it('dize içindeki // yorum sayılmaz', () => {
    expect(kurallar('src/a.ts', 'const u = "https://x"; Math.random();')).toEqual(['Math.random yasak']);
  });

  it('izinler: speech.ts AUDIO_BASE fetch, izinli localStorage anahtarı, persistence Dexie', () => {
    expect(tara('src/audio/speech.ts', 'const r = await fetch(`${AUDIO_BASE}${f}`);')).toEqual([]);
    // ADR-0016: Türkçe veri yükleyicisi yalnız doğrulanmış göreli yolla (aynı köken).
    expect(tara('src/content/dersler/tur/veriYukleyici.ts', 'const y = await fetch(turVeriYolu(dosya), {});')).toEqual([]);
    expect(tara('src/content/dersler/tur/veriYukleyici.ts', 'await fetch("https://dis.example.com");')).toHaveLength(1);
    expect(tara('src/content/dersler/tur/baska.ts', 'await fetch(turVeriYolu(dosya));')).toHaveLength(1);
    expect(tara('src/audio/speech.ts', 'await fetch("https://dis");')).toHaveLength(1);
    expect(tara('src/design/x.ts', 'localStorage.setItem(CIHAZ_PROFILI_ANAHTARI, p);')).toEqual([]);
    expect(tara('src/design/x.ts', "localStorage.setItem('okulumsun.deviceOverride', p);")).toEqual([]);
    expect(tara('src/persistence/db.ts', 'class D extends Dexie {}')).toEqual([]);
    expect(tara('src/ui/x.ts', 'class D extends Dexie {}')).toHaveLength(1);
  });

  it('scripts/ yalnız Math.random için taranır (ağ betikleri geliştirici makinesinde çalışır)', () => {
    expect(tara('scripts/ses/googleTts.ts', 'await fetch(UC_NOKTA, {});')).toEqual([]);
    expect(kurallar('scripts/x.ts', 'Math.random()')).toEqual(['Math.random yasak']);
  });
});
