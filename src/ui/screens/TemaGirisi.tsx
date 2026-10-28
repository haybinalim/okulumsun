/**
 * TEMA GİRİŞİ EKRANI — plan §11 [5], plan v2 Adım 45 (KG-112).
 *
 * İki biçim (`appStore.temaGirisiBicimi`):
 *  - `kisa`: 2 sn otomatik geçiş; maskot tema adını söyler. Dokunulabilir değil.
 *  - `derin`: temanın 4 adımlı sesli girişi (`DerinTemaGirisi`, tembel yüklenir). Kişiselde oturum başına bir
 *    kez (ilk tema seçiminde); tahtada öğretmen konu seçimindeki "Temaya giriş" kartıyla başlatır.
 * Bitince kişisel → alıştırma, tahta → konu seçimi.
 */

import { lazy, Suspense, useCallback, useEffect } from 'react';
import { useAppStore, TEMALAR } from '../../store/appStore';
import { Maskot } from '../feedback/Maskot';
import { useScreenSpeech } from '../../audio/useSpeak';
import { m } from 'framer-motion';
import { useHareketAzalt } from '../../design/useHareketAzalt';
import { COLOR, MOTION } from '../../design/tokens';

const DerinTemaGirisi = lazy(() => import('./DerinTemaGirisi'));

export function TemaGirisi() {
  const { secilenTemaNo, ekranGit, mod, temaGirisiBicimi } = useAppStore();
  const tema = TEMALAR.find((t) => t.no === secilenTemaNo);
  const bitir = useCallback(() => ekranGit(mod === 'tahta' ? 'konuSecimi' : 'alistirma'), [ekranGit, mod]);

  if (temaGirisiBicimi === 'derin' && tema) {
    return (
      <Suspense fallback={<KisaGiris tema={tema} otomatikGecis={false} onBitti={bitir} />}>
        <DerinTemaGirisi tema={tema.no} temaAdi={tema.ad} renk={tema.renk} onBitti={bitir} />
      </Suspense>
    );
  }
  return <KisaGiris tema={tema} otomatikGecis onBitti={bitir} />;
}

function KisaGiris({
  tema,
  otomatikGecis,
  onBitti,
}: {
  tema: (typeof TEMALAR)[number] | undefined;
  otomatikGecis: boolean;
  onBitti: () => void;
}) {
  const reducedMotion = useHareketAzalt();

  useScreenSpeech(tema ? { kind: 'key', key: tema.speechKey as never } : null, [tema?.no]);

  // 2 sn sonra otomatik geçiş (derin giriş yüklenirken bekleme görünümü olarak geçmez).
  useEffect(() => {
    if (!otomatikGecis) return;
    const timer = setTimeout(onBitti, 2000);
    return () => clearTimeout(timer);
  }, [onBitti, otomatikGecis]);

  return (
    <main
      data-ekran="tema-girisi-kisa"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: tema?.renk ?? COLOR.bg,
        gap: 'var(--size-gap)',
        padding: 'var(--size-edge)',
      }}
    >
      <m.div
        initial={reducedMotion ? {} : { scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: reducedMotion ? 0 : MOTION.screen / 1000 }}
      >
        <Maskot durum="konusuyor" size={120} />
      </m.div>

      {tema && (
        <m.div
          initial={reducedMotion ? {} : { y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: reducedMotion ? 0 : MOTION.screen / 1000, delay: 0.3 }}
          style={{
            fontSize: 'var(--text-ui)',
            color: '#fff',
            textAlign: 'center',
            padding: '8px 24px',
            borderRadius: 16,
            background: 'rgba(0,0,0,0.2)',
          }}
        >
          {tema.ad}
        </m.div>
      )}
    </main>
  );
}
