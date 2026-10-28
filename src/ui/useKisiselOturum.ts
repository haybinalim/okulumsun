import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Accent } from '../design/tokens';
import { skillsData } from '../content/skillsData';
import type { Exercise } from '../exercises/types';
import { hash32 } from '../exercises/rng';
import type { MasteryRecord } from '../progress/mastery';
import { oturumDuzenuSec, guncelSecilenSoru, secilenSoruyuUret } from '../progress/oturumRuntime';
import { oturumBaslat, oturumOzeti, soruCevapla, tazeMi, type AktifOturum } from '../progress/session';
import {
  isinmaBaslat,
  isinmaIlerlet,
  isinmaMaddesi,
  seviyeTahmini,
  type IsinmaDurumu,
  type SeviyeTahmini,
} from '../progress/seviyeTespiti';
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
import { girisliSoru, isinmaGirisi } from '../audio/girisSesi';

export interface KisiselOturumDurumu {
  readonly exercise: Exercise | null;
  readonly yukleniyor: boolean;
  readonly hata: string | null;
  /** Isınma Keşfi maddesi gösteriliyor (PLAN §6.5; boncuk yolu/puan yok). */
  readonly isinmada: boolean;
  cevapla(dogru: boolean): Promise<void>;
  /** Ekrandaki maddede yanlış deneme oldu (ısınmada ilk deneme doğruluğu için). */
  yanlisBildir(): void;
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
  // Isınma Keşfi (ADR-0007): durum ve tahmin YALNIZ bu bileşenin belleğinde; hiçbir depoya yazılmaz.
  const [isinma, setIsinma] = useState<IsinmaDurumu | null>(null);
  const isinmaTohumu = useRef(0);
  const isinmaYapildi = useRef(false);
  const isinmaTahmini = useRef<SeviyeTahmini | null>(null);
  // Isınma az önce bitti: oturumun ilk sorusu "Isındık, şimdi oynayalım!" ile açılır (KG-110).
  const [isinmadanYeniCikti, setIsinmadanYeniCikti] = useState(false);
  const maddedeYanlisVar = useRef(false);

  const readingLevel = useAppStore((s) => s.readingLevel);
  const okulAyiIndex = useAppStore((s) => s.okulAyiIndex);
  const sesHizi = useAppStore((s) => s.sesHizi);
  const avatarId = useAppStore((s) => s.avatarId);
  const accentId = useAppStore((s) => s.accentId);
  const secilenTemaNo = useAppStore((s) => s.secilenTemaNo);
  const isinmaAcik = useAppStore((s) => s.isinmaAcik);
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

  // Veli anahtarı her açılışında ısınma bir kez yeniden hak kazanır; kapatınca süren ısınma biter.
  useEffect(() => {
    isinmaYapildi.current = false;
    isinmaTahmini.current = null;
    if (!isinmaAcik) setIsinma(null);
  }, [isinmaAcik]);

  // Alıştırma ekranına ilk geçişte (ısınma varsa bittikten sonra) yeni sekiz soruluk plan oluşturulur.
  useEffect(() => {
    if (yukleniyor || mod !== 'kisisel' || ekran !== 'alistirma' || oturum || isinma) return;

    // Anahtar açıksa ve bu açılışta henüz yapılmadıysa önce ısınma (PLAN §6.5, ADR-0007).
    if (isinmaAcik && !isinmaYapildi.current) {
      isinmaYapildi.current = true;
      const baslangic = isinmaBaslat(duzen, okulAyiIndex);
      if (!baslangic.bitti) {
        isinmaTohumu.current = hash32(`isinma|${Date.now()}`);
        setIsinma(baslangic);
        return;
      }
    }

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
      isinmaTahmini.current,
    );
    // Tahmin yalnız bu planı başlatır; sonra bellekten de atılır.
    isinmaTahmini.current = null;

    if (yeniOturum.secilenSorular.length === 0) {
      setHata('Bu tema için üretilebilir alıştırma bulunamadı.');
      return;
    }

    setOturum(yeniOturum);
    soruBaslangicMs.current = simdiMs;
    void aktifOturumYaz(yeniOturum, mod).catch((err: unknown) => {
      setHata(`Yeni oturum kaydedilemedi: ${(err as Error).message}`);
    });
  }, [accentId, avatarId, duzen, ekran, isinma, isinmaAcik, kayitlar, mod, okulAyiIndex, oturum, readingLevel, yukleniyor]);

  const exercise = useMemo(() => {
    if (mod !== 'kisisel') return null;
    if (isinma && !isinma.bitti)
      return girisliSoru(
        secilenSoruyuUret(isinmaMaddesi(isinma, duzen, isinmaTohumu.current), duzen, mod),
        isinmaGirisi(isinma, false, false),
      );
    if (!oturum) return null;
    const secilen = guncelSecilenSoru(oturum);
    return secilen
      ? girisliSoru(secilenSoruyuUret(secilen, duzen, mod), isinmaGirisi(null, oturum.guncelSoruIndeksi === 0, isinmadanYeniCikti))
      : null;
  }, [duzen, isinma, isinmadanYeniCikti, mod, oturum]);

  const exerciseItemId = exercise?.itemId;
  useEffect(() => {
    if (exerciseItemId) soruBaslangicMs.current = Date.now();
    maddedeYanlisVar.current = false;
  }, [exerciseItemId]);

  const yanlisBildir = useCallback((): void => {
    maddedeYanlisVar.current = true;
  }, []);

  const cevapla = useCallback(async (dogru: boolean): Promise<void> => {
    if (mod !== 'kisisel' || cevapDevamEdiyor.current) return;

    // Isınma maddesi: yalnız bellekteki ısınma durumu ilerler. Ustalık kaydı, olay, oturum
    // özeti ve aktif oturum YAZILMAZ (ADR-0007). Doğruluk ilk denemedir.
    if (isinma && !isinma.bitti) {
      const simdiMs = Date.now();
      const sonraki = isinmaIlerlet(isinma, {
        dogru: dogru && !maddedeYanlisVar.current,
        kullanilanYardimKademesi: 0,
        latencyMs: Math.max(0, simdiMs - soruBaslangicMs.current),
        tani: null,
        zamanMs: simdiMs,
      });
      maddedeYanlisVar.current = false;
      if (sonraki.bitti) {
        isinmaTahmini.current = seviyeTahmini(sonraki, duzen);
        setIsinmadanYeniCikti(true);
        setIsinma(null);
      } else {
        setIsinma(sonraki);
      }
      return;
    }

    if (!oturum) return;
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
        // Isınma girişi yalnız ısınmadan hemen sonraki oturumun ilk sorusunda (KG-110).
        setIsinmadanYeniCikti(false);
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
  }, [duzen, isinma, kayitlar, mod, oturum, oturumuTamamla]);

  return { exercise, yukleniyor, hata, isinmada: isinma !== null && !isinma.bitti, cevapla, yanlisBildir };
}
