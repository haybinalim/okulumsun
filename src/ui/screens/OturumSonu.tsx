/**
 * OTURUM SONU EKRANI — plan §7.4, §11 [7].
 *
 * 8 soru tamamlandığında gösterilir. Ödül TAMAMLAMAYA bağlıdır,
 * doğru sayısına DEĞİL (plan §7.4) — yanlış yapan çocuk da çıkartma alır.
 *
 * Akış:
 *  [7] Oturum sonu — çıkartma kazanildi → uçarak bahçeye → [8] Bahçem
 *
 * Tahta modunda [7]/[8] atlanır — ödül kişiseldir, sınıf ekranında anlamsız (§11).
 *
 * MASKOT HİKÂYESİ (plan v2 Adım 54 aşama 2, KG-116): kişisel tema oturumunun sonunda arka planda temanın sıradaki
 * hikâye sahnesi (1. oturum → 2. sahne, sonra 3. sahne; sayaç yalnız bellekte) ve maskot onu "oturum bitti"
 * cümlesinin ardından söyler. Sahne tembel yüklenir ve dokunulmazdır; bahçeye geçiş anlatım bitene kadar bekler
 * ("Bahçem" düğmesi her an geçirir). Set/ev/tahta oturumunda hikâye yok.
 */

import { lazy, Suspense, useEffect, useState, useCallback } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { useHareketAzalt } from '../../design/useHareketAzalt';
import { COLOR, MOTION } from '../../design/tokens';
import { BigButton } from '../primitives/BigButton';
import { OturumSonuKutlama } from '../feedback/Celebration';
import { Maskot } from '../feedback/Maskot';
import { speak } from '../../audio/useSpeak';
import { speech } from '../../audio/speech';
import { useAppStore } from '../../store/appStore';
import { oturumSonuHikayesiVar, oturumSonuSahneNo, oturumSonuSesi } from '../hikayeAkisi';

const HikayeSahnesi = lazy(() => import('./HikayeSahnesi'));

export interface OturumSonuProps {
  /** Oturum tamamlandı mı? (doğru sayısı ÖNEMSİZ — tamamlamaya bağlı). */
  oturumTamamlandi: boolean;
  /** Bahçem'e git. */
  onBahcem: () => void;
}

/**
 * Oturum sonu ekranı.
 *
 * Çıkartma kazanildi mesajı + konfeti + maskot sevinmiş durumda.
 * Dokununca veya ≤2 sn sonra Bahçem'e geçer.
 */
export function OturumSonu({ oturumTamamlandi, onBahcem }: OturumSonuProps) {
  const reducedMotion = useHareketAzalt();
  const [kutlamaAktif, setKutlamaAktif] = useState(true);
  const [gecisHazir, setGecisHazir] = useState(false);

  const mod = useAppStore((s) => s.mod);
  const tema = useAppStore((s) => s.secilenTemaNo);
  const aktifSet = useAppStore((s) => s.aktifSet);
  const temaOturumu = useAppStore((s) => (s.secilenTemaNo === null ? 0 : (s.temaOturumlari[s.secilenTemaNo] ?? 0)));
  const hikayeli = aktifSet === null && oturumSonuHikayesiVar(mod, tema, temaOturumu);
  const sahneNo = hikayeli ? oturumSonuSahneNo(temaOturumu) : null;
  const [anlatimBitti, setAnlatimBitti] = useState(!hikayeli);

  // "Oturum bitti" (+ hikâyeliyse sıradaki sahne). Ekran değişince susar.
  useEffect(() => {
    const ctrl = new AbortController();
    const kaynak = hikayeli ? oturumSonuSesi(tema, temaOturumu) : ({ kind: 'key', key: 'ui.oturum-bitti' } as const);
    void speech.speak(kaynak, { priority: 'high', signal: ctrl.signal, talimat: true }).then(() => {
      if (!ctrl.signal.aborted) setAnlatimBitti(true);
    });
    return () => {
      ctrl.abort();
      speech.stop();
      speech.talimatiUnut();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oturumTamamlandi]);

  // Konfeti bittiğinde geçiş hazırla
  const handleAtla = useCallback(() => {
    setKutlamaAktif(false);
    setGecisHazir(true);
  }, []);

  useEffect(() => {
    // Hikâye anlatımı kesilmesin: bahçeye geçiş anlatımdan sonra (düğme her an geçirir).
    if (!gecisHazir || !anlatimBitti) return;
    // Konfeti bitti — çıkartma kazanıldı sesini çal, sonra bahçeye geç
    void speak({ kind: 'key', key: 'ui.cikartma-kazandin' });
    const timer = setTimeout(() => {
      onBahcem();
    }, 1500);
    return () => clearTimeout(timer);
  }, [gecisHazir, anlatimBitti, onBahcem]);

  return (
    <main
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: COLOR.bg,
        gap: 'var(--size-gap)',
        padding: 'var(--size-edge)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Hikâye sahnesi (arka plan, dokunulmaz; maskot sahnenin pozunda). */}
      {sahneNo !== null && tema !== null && (
        <Suspense fallback={null}>
          <HikayeSahnesi tema={tema} sahneNo={sahneNo} gorselBoyutu={200} maskotBoyutu={120} />
        </Suspense>
      )}

      {/* Maskot — sevinmiş durumda (hikâyede maskot sahnenin içinde) */}
      {sahneNo === null && (
        <m.div
          initial={reducedMotion ? {} : { scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: reducedMotion ? 0 : MOTION.screen / 1000 }}
        >
          <Maskot durum="sevinmis" size={120} />
        </m.div>
      )}

      {/* "Çıkartma kazandın!" mesajı */}
      <m.div
        initial={reducedMotion ? {} : { y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: reducedMotion ? 0 : MOTION.screen / 1000, delay: 0.2 }}
        style={{
          fontSize: 'var(--text-ui, 28px)',
          color: COLOR.ink,
          textAlign: 'center',
        }}
      >
        🎁
      </m.div>

      {/* "Devam" butonu — bahçeye git */}
      <AnimatePresence>
        {gecisHazir && (
          <m.div
            initial={reducedMotion ? {} : { y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : MOTION.screen / 1000 }}
          >
            <BigButton
              label="Bahçem"
              size="primary"
              variant="accent"
              onPress={onBahcem}
            >
              Bahçem
            </BigButton>
          </m.div>
        )}
      </AnimatePresence>

      {/* Konfeti overlay — atlanabilir (dokununca biter) */}
      <OturumSonuKutlama aktif={kutlamaAktif} onAtla={handleAtla} />
    </main>
  );
}
