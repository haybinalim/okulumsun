// @vitest-environment happy-dom
/**
 * Plan v2 Adım 47 aşama 2: Isınma Keşfi'nin kişisel oturuma bağlanması (ADR-0007 Kabul).
 * Kalıcılık katmanı casusla değiştirilir: ısınma boyunca hiçbir yazım yapılmadığı, tahminin
 * yalnız oturum planına girdiği ve anahtar kapalıyken davranışın aynı kaldığı kanıtlanır.
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { skillsData } from '../../src/content/skillsData';
import { oturumDuzenuSec } from '../../src/progress/oturumRuntime';
import { isinmaIsaretleri, ISINMA_EN_FAZLA_MADDE } from '../../src/progress/seviyeTespiti';
import { useAppStore, type Mod } from '../../src/store/appStore';
import { useKisiselOturum, type KisiselOturumDurumu } from '../../src/ui/useKisiselOturum';
import { depolamaCasusuKur } from './yardimci/depolamaCasusu';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const depo = vi.hoisted(() => ({
  kaliciOgrenciVerileriniSil: vi.fn(async () => undefined),
  profilOku: vi.fn(async () => ({
    id: 'aktif',
    readingLevel: 0,
    okulAyiIndex: 8,
    sesHizi: 1,
    deviceOverride: null,
    avatarId: null,
    accentId: null,
    persistRequested: false,
    persistGranted: null,
  })),
  masteryOku: vi.fn(async () => []),
  aktifOturumOku: vi.fn(async () => null),
  aktifOturumSil: vi.fn(async () => undefined),
  aktifOturumYaz: vi.fn(async () => undefined),
  masteryTopluYaz: vi.fn(async () => undefined),
  olayYaz: vi.fn(async () => undefined),
  oturumKapanisindaBuda: vi.fn(async () => undefined),
  oturumOzetiYaz: vi.fn(async () => undefined),
  profilYaz: vi.fn(async () => undefined),
}));
vi.mock('../../src/persistence/repository', () => depo);

const oturum = vi.hoisted(() => ({ tahminler: [] as unknown[] }));
vi.mock('../../src/progress/session', async (asil) => {
  const m = await asil<typeof import('../../src/progress/session')>();
  return {
    ...m,
    oturumBaslat: (...a: Parameters<typeof m.oturumBaslat>) => {
      oturum.tahminler.push(a[9] ?? null);
      return m.oturumBaslat(...a);
    },
  };
});

const DUZEN = oturumDuzenuSec(skillsData, null);
const YAZIMLAR = ['aktifOturumYaz', 'masteryTopluYaz', 'olayYaz', 'oturumOzetiYaz', 'aktifOturumSil'] as const;
const yazimSayisi = () => YAZIMLAR.reduce((t, ad) => t + depo[ad].mock.calls.length, 0);

let kok: Root;
let kap: HTMLDivElement;
let son: KisiselOturumDurumu;

function Kapsul({ ekran, mod }: { ekran: string; mod: Mod }) {
  son = useKisiselOturum(ekran, mod);
  return null;
}

async function bagla(mod: Mod = 'kisisel'): Promise<void> {
  kap = document.createElement('div');
  kok = createRoot(kap);
  await act(async () => kok.render(createElement(Kapsul, { ekran: 'alistirma', mod })));
  await act(async () => undefined);
}

async function cevapla(dogru: boolean, yanlisOnce = false): Promise<void> {
  await act(async () => {
    if (yanlisOnce) son.yanlisBildir();
    await son.cevapla(dogru);
  });
  await act(async () => undefined);
}

beforeEach(() => {
  useAppStore.getState().sifirla();
  for (const f of Object.values(depo)) f.mockClear();
  oturum.tahminler.length = 0;
});
afterEach(() => {
  act(() => kok?.unmount());
});

describe('anahtar kapalı (varsayılan)', () => {
  it('varsayılan kapalı; ısınma yok, plan tahminsiz başlar (davranış aynı)', async () => {
    expect(useAppStore.getState().isinmaAcik).toBe(false);
    await bagla();
    expect(son.isinmada).toBe(false);
    expect(son.exercise).not.toBeNull();
    expect(oturum.tahminler).toEqual([null]);
    expect(depo.aktifOturumYaz).toHaveBeenCalledTimes(1);
  });
});

describe('anahtar açık (kişisel mod)', () => {
  beforeEach(() => {
    useAppStore.getState().okulAyiAyarla(8);
    useAppStore.getState().isinmaAyarla(true);
  });

  it('önce ısınma: ilk madde en kolay işaret; ısınma boyunca hiçbir yazım ve depo erişimi yok', async () => {
    const casus = depolamaCasusuKur();
    try {
      await bagla();
      const isaretler = isinmaIsaretleri(DUZEN, 8);
      expect(son.isinmada).toBe(true);
      expect(son.exercise!.skillIds).toContain(isaretler[0]);
      expect(oturum.tahminler).toEqual([]);
      await cevapla(true);
      expect(son.isinmada).toBe(true);
      expect(son.exercise!.skillIds).toContain(isaretler[2]);
      await cevapla(false);
      expect(son.exercise!.skillIds).toContain(isaretler[1]);
      expect(yazimSayisi()).toBe(0);
      expect(casus.cagrilar()).toEqual([]);
      await cevapla(false);
      // Ardışık 2 yanlış → ısınma biter, oturum tahminle başlar.
      expect(son.isinmada).toBe(false);
      expect(oturum.tahminler).toHaveLength(1);
      expect(oturum.tahminler[0]).toMatchObject({ hedefZorlukBaslangici: expect.any(Number) });
      expect(depo.masteryTopluYaz).not.toHaveBeenCalled();
      expect(depo.olayYaz).not.toHaveBeenCalled();
      // Yazılan aktif oturumda ısınmadan iz yok.
      expect(depo.aktifOturumYaz).toHaveBeenCalledTimes(1);
      const yazilan = (depo.aktifOturumYaz.mock.calls[0] as unknown[])[0];
      expect(JSON.stringify(yazilan)).not.toMatch(/isinma|oturumIciAcik|hedefZorluk/);
      expect(Object.keys(yazilan as object).sort()).toEqual(
        [
          'baslangicMs',
          'cevaplar',
          'durum',
          'guncelSoruIndeksi',
          'oturumTohumu',
          'profilTohumu',
          'secilenSorular',
        ].sort(),
      );
    } finally {
      casus.sok();
    }
  });

  it('yanlış denemeden sonra gelen doğru, ısınmada yanlış sayılır (ilk deneme)', async () => {
    await bagla();
    await cevapla(true, true);
    await cevapla(true, true);
    expect(son.isinmada).toBe(false);
    expect(oturum.tahminler).toHaveLength(1);
    expect((oturum.tahminler[0] as { oturumIciAcikDugumler: Set<string> }).oturumIciAcikDugumler.size).toBe(0);
  });

  it('en çok 8 madde; hep doğruda tahmin düğüm açar; bu açılışta ikinci oturumda ısınma yinelenmez', async () => {
    await bagla();
    let madde = 0;
    while (son.isinmada) {
      madde++;
      await cevapla(true);
    }
    expect(madde).toBe(ISINMA_EN_FAZLA_MADDE);
    const tahmin = oturum.tahminler[0] as { oturumIciAcikDugumler: Set<string> };
    expect(tahmin.oturumIciAcikDugumler.size).toBeGreaterThan(0);
    expect(yazimSayisi()).toBe(1); // yalnız asıl oturumun aktifOturumYaz'ı
    // Asıl oturumu bitir; sonraki oturum ısınmasız başlar.
    for (let i = 0; i < 8 && !son.isinmada && son.exercise; i++) await cevapla(true);
    expect(depo.oturumOzetiYaz).toHaveBeenCalledTimes(1);
    expect(son.isinmada).toBe(false);
  });

  it('ısınma sürerken anahtar kapatılırsa ısınma biter ve oturum tahminsiz başlar', async () => {
    await bagla();
    expect(son.isinmada).toBe(true);
    await act(async () => useAppStore.getState().isinmaAyarla(false));
    await act(async () => undefined);
    expect(son.isinmada).toBe(false);
    expect(oturum.tahminler).toEqual([null]);
  });
});

describe('tahta/sınıf modunda ısınma yok', () => {
  it('mod seçimi anahtarı kapatır; tahtada hook hiç oturum/ısınma kurmaz', async () => {
    useAppStore.getState().isinmaAyarla(true);
    useAppStore.getState().modSec('tahta');
    expect(useAppStore.getState().isinmaAcik).toBe(false);
    useAppStore.getState().isinmaAyarla(true);
    await bagla('tahta');
    expect(son.isinmada).toBe(false);
    expect(son.exercise).toBeNull();
    expect(oturum.tahminler).toEqual([]);
  });
});
