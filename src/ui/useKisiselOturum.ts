import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Accent } from '../design/tokens';
import { skillsData } from '../content/skillsData';
import type { Exercise } from '../exercises/types';
import { hash32 } from '../exercises/rng';
import type { MasteryRecord } from '../progress/mastery';
import { oturumDuzenuSec, guncelSecilenSoru, secilenSoruyuUret } from '../progress/oturumRuntime';
import { oturumBaslat, oturumOzeti, soruCevapla, tazeMi, type AktifOturum } from '../progress/session';
import {
  aktifOturumOku,
  aktifOturumSil,
  aktifOturumYaz,
  masteryOku,
  masteryTopluYaz,
  olayYaz,
  oturumKapanisindaBuda,
  oturumOzetiYaz,
  profilOku,
  profilYaz,
  kaliciOgrenciVerileriniSil,
} from '../persistence/repository';
import { useAppStore, type Mod } from '../store/appStore';

export interface KisiselOturumDurumu {
  readonly exercise: Exercise | null;
  readonly yukleniyor: boolean;
  readonly hata: string | null;
  cevapla(dogru: boolean): Promise<void>;
}

function kayitHaritasi(kayitlar: readonly MasteryRecord[]): Map<MasteryRecord['skillId'], MasteryRecord> {
  return new Map(kayitlar.map((kayit) => [kayit.skillId, kayit]));
}

/**
 * Kişisel modun gerçek sekiz soruluk yaşam döngüsü.
 *
 * Saf planlayıcı/ustalık modüllerini yalnızca burada React, saat ve IndexedDB ile
 * birleştirir. Tahta moduna çağrılmaz; böylece "tahtada yazma yok" kuralı bu
 * katmanda da korunur.
 */
export function useKisiselOturum(ekran: string, mod: Mod | null): KisiselOturumDurumu {
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  const [oturum, setOturum] = useState<AktifOturum | null>(null);
  const [kayitlar, setKayitlar] = useState<Map<MasteryRecord['skillId'], MasteryRecord>>(new Map());
  const cevapDevamEdiyor = useRef(false);
  const soruBaslangicMs = useRef(Date.now());

  const readingLevel = useAppStore((s) => s.readingLevel);
  const okulAyiIndex = useAppStore((s) => s.okulAyiIndex);
  const sesHizi = useAppStore((s) => s.sesHizi);
  const avatarId = useAppStore((s) => s.avatarId);
  const accentId = useAppStore((s) => s.accentId);
  const secilenTemaNo = useAppStore((s) => s.secilenTemaNo);
  const oturumuTamamla = useAppStore((s) => s.oturumuTamamla);
  const profildenYukle = useAppStore((s) => s.profildenYukle);

  // İlk yüklemede önce eski öğrenci/veli kayıtları silinir; ardından yalnız bellek
  // için varsayılan profil ve boş oturum durumu hazırlanır.
  useEffect(() => {
    let iptal = false;

    async function yukle(): Promise<void> {
      try {
        await kaliciOgrenciVerileriniSil();
        const [profil, kaliciKayitlar, eskiOturum] = await Promise.all([
          profilOku(),
          masteryOku(),
          aktifOturumOku(),
        ]);
        if (iptal) return;

        profildenYukle({
          readingLevel: profil.readingLevel,
          okulAyiIndex: profil.okulAyiIndex,
          sesHizi: profil.sesHizi,
          avatarId: profil.avatarId,
          accentId: profil.accentId as Accent['id'] | null,
        });
        setKayitlar(kayitHaritasi(kaliciKayitlar));

        if (eskiOturum && tazeMi(eskiOturum, Date.now())) {
          setOturum(eskiOturum);
        } else if (eskiOturum) {
          await aktifOturumSil();
        }
      } catch (err) {
        if (!iptal) setHata(`Oturum verisi yüklenemedi: ${(err as Error).message}`);
      } finally {
        if (!iptal) setYukleniyor(false);
      }
    }

    void yukle();
    return () => { iptal = true; };
  }, [profildenYukle]);

  // Ayarlar yalnız bu sayfa açık kaldığı sürece bellek durumunda yaşar. Repository
  // katmanı geliştirme sürümünde tüm kalıcı yazmaları no-op olarak uygular.
  useEffect(() => {
    if (yukleniyor || mod !== 'kisisel') return;
    void profilYaz({
      id: 'aktif',
      readingLevel,
      okulAyiIndex,
      sesHizi,
      deviceOverride: null,
      avatarId,
      accentId,
      persistRequested: false,
      persistGranted: null,
    }, mod).catch((err: unknown) => setHata(`Profil kaydedilemedi: ${(err as Error).message}`));
  }, [accentId, avatarId, mod, okulAyiIndex, readingLevel, sesHizi, yukleniyor]);

  const duzen = useMemo(
    () => oturumDuzenuSec(skillsData, secilenTemaNo),
    [secilenTemaNo],
  );

  // Alıştırma ekranına ilk geçişte yeni sekiz soruluk plan oluşturulur.
  useEffect(() => {
    if (yukleniyor || mod !== 'kisisel' || ekran !== 'alistirma' || oturum) return;

    const simdiMs = Date.now();
    const profilTohumu = hash32(`${avatarId ?? 'varsayilan'}|${accentId ?? 'mavi'}`);
    const yeniOturum = oturumBaslat(
      duzen,
      kayitlar,
      readingLevel,
      simdiMs,
      hash32(`${profilTohumu}|${simdiMs}`),
      profilTohumu,
      [],
      [],
      null,
    );

    if (yeniOturum.secilenSorular.length === 0) {
      setHata('Bu tema için üretilebilir alıştırma bulunamadı.');
      return;
    }

    setOturum(yeniOturum);
    soruBaslangicMs.current = simdiMs;
    void aktifOturumYaz(yeniOturum, mod).catch((err: unknown) => {
      setHata(`Yeni oturum kaydedilemedi: ${(err as Error).message}`);
    });
  }, [accentId, avatarId, duzen, ekran, kayitlar, mod, oturum, readingLevel, yukleniyor]);

  const exercise = useMemo(() => {
    if (!oturum || mod !== 'kisisel') return null;
    const secilen = guncelSecilenSoru(oturum);
    return secilen ? secilenSoruyuUret(secilen, duzen, mod) : null;
  }, [duzen, mod, oturum]);

  const exerciseItemId = exercise?.itemId;
  useEffect(() => {
    if (exerciseItemId) soruBaslangicMs.current = Date.now();
  }, [exerciseItemId]);

  const cevapla = useCallback(async (dogru: boolean): Promise<void> => {
    if (!oturum || mod !== 'kisisel' || cevapDevamEdiyor.current) return;
    const secilen = guncelSecilenSoru(oturum);
    if (!secilen) return;

    cevapDevamEdiyor.current = true;
    const simdiMs = Date.now();
    try {
      const sonuc = soruCevapla(oturum, kayitlar, duzen, {
        dogru,
        kullanilanYardimKademesi: 0,
        latencyMs: Math.max(0, simdiMs - soruBaslangicMs.current),
        tani: null,
        zamanMs: simdiMs,
      }, simdiMs);

      const guncelKayitlar = [...sonuc.kayitlar.values()];
      await Promise.all([
        masteryTopluYaz(guncelKayitlar, mod),
        olayYaz({
          ts: simdiMs,
          skillId: secilen.skillId,
          dogru,
          tani: null,
          latencyMs: Math.max(0, simdiMs - soruBaslangicMs.current),
          yardimKademesi: 0,
        }, mod),
      ]);

      setKayitlar(sonuc.kayitlar);
      if (sonuc.oturum.durum === 'tamam') {
        const ozet = oturumOzeti(sonuc.oturum, sonuc.kayitlar, duzen, simdiMs);
        await Promise.all([
          oturumOzetiYaz(ozet, mod),
          aktifOturumSil(),
          oturumKapanisindaBuda(),
        ]);
        setOturum(null);
        oturumuTamamla();
      } else {
        await aktifOturumYaz(sonuc.oturum, mod);
        setOturum(sonuc.oturum);
      }
    } catch (err) {
      setHata(`Cevap kaydedilemedi: ${(err as Error).message}`);
    } finally {
      cevapDevamEdiyor.current = false;
    }
  }, [duzen, kayitlar, mod, oturum, oturumuTamamla]);

  return { exercise, yukleniyor, hata, cevapla };
}
