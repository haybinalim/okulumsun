/*
 * VELİ KAPISI EKRANI — yetişkin alanını çocuk akışından ayıran kısa kontrol.
 * Bu ekran hiçbir öğrenci/veli verisi toplamaz veya saklamaz.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { BigButton } from '../primitives/BigButton';
import { COLOR } from '../../design/tokens';

/** Veli kapısı sayıları — her seferinde farklı, ama deterministik. */
function sayiUret(tohum: number): number[] {
  const sayilar: number[] = [];
  let s = tohum;
  for (let i = 0; i < 4; i++) {
    s = (s * 31 + 17) % 100;
    sayilar.push(s);
  }

  const benzersiz = [...new Set(sayilar)];
  while (benzersiz.length < 4) {
    s = (s * 31 + 17) % 100;
    if (!benzersiz.includes(s)) benzersiz.push(s);
  }
  return benzersiz.slice(0, 4);
}

export function VeliKapisi() {
  const { ekranGit, veliGec } = useAppStore();
  const [tohum] = useState(() => Math.floor(Date.now() % 1000) + 42);
  const sayilar = useMemo(() => sayiUret(tohum), [tohum]);
  const [sira, setSira] = useState<number[]>([]);
  const [hata, setHata] = useState(false);
  const [tekrarSayisi, setTekrarSayisi] = useState(0);
  const ilkSayiButonuRef = useRef<HTMLButtonElement | null>(null);

  const dogruSira = useMemo(() => [...sayilar].sort((a, b) => b - a), [sayilar]);
  const durumMetni = hata
    ? 'Sıralama tutmadı. Sayılar yeniden kullanılabilir; büyük sayıdan başlayarak tekrar deneyin.'
    : sira.length > 0
      ? `${sira.length} sayı seçildi. ${4 - sira.length} sayı kaldı.`
      : 'Henüz sayı seçilmedi.';

  useEffect(() => {
    if (tekrarSayisi > 0) ilkSayiButonuRef.current?.focus();
  }, [tekrarSayisi]);

  const handleSayi = useCallback((n: number) => {
    if (sira.includes(n) || hata) return;
    const yeniSira = [...sira, n];
    setSira(yeniSira);

    if (yeniSira.length === 4) {
      const dogru = yeniSira.every((v, i) => v === dogruSira[i]);
      if (dogru) {
        veliGec(true);
        ekranGit('veliPaneli');
      } else {
        setHata(true);
        window.setTimeout(() => {
          setSira([]);
          setHata(false);
          setTekrarSayisi((sayac) => sayac + 1);
        }, 1500);
      }
    }
  }, [sira, hata, dogruSira, veliGec, ekranGit]);

  return (
    <main
      aria-labelledby="veli-kapisi-baslik"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: COLOR.bg,
        padding: 'var(--size-edge)',
        paddingBottom: 'var(--size-edge-bottom)',
        gap: 'var(--size-gap)',
      }}
    >
      <header style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <BigButton label="Çocuk ekranına dön" size="control" variant="ghost" onPress={() => ekranGit('anaEkran')}>
          ←
        </BigButton>
        <div>
          <h1 id="veli-kapisi-baslik" style={{ fontSize: 'var(--text-adult)', color: COLOR.ink, margin: 0 }}>
            Yetişkin alanı
          </h1>
          <p style={{ fontSize: 'var(--text-adult)', color: COLOR.inkSoft, margin: '2px 0 0' }}>
            Bu kısa kontrol, ayarları çocuk ekranından ayırır.
          </p>
        </div>
      </header>

      <section
        aria-describedby="veli-kapisi-yardim"
        style={{
          flex: '0 0 auto',
          textAlign: 'center',
          padding: 'var(--size-gap)',
          background: COLOR.surface,
          border: `1px solid ${COLOR.border}`,
          borderRadius: 12,
        }}
      >
        <p style={{ fontSize: 'var(--text-adult)', color: COLOR.ink, margin: 0, fontWeight: 700 }}>
          Sayılara büyükten küçüğe dokunun
        </p>
        <p id="veli-kapisi-yardim" style={{ fontSize: 'var(--text-adult)', color: COLOR.inkSoft, margin: '8px 0 0' }}>
          Dört sayıyı sırayla seçin. Bu kontrol hiçbir veri kaydetmez.
        </p>
      </section>

      <div role="status" aria-live="polite" style={ekranOkuyucuMetniStili}>
        {durumMetni}
      </div>

      <section
        aria-label="Sayıları büyükten küçüğe seçin"
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 'var(--size-gap)',
          flexWrap: 'wrap',
        }}
      >
        {sayilar.map((n, index) => {
          const dokunuldu = sira.includes(n);
          const siraNo = sira.indexOf(n) + 1;
          return (
            <button
              key={n}
              ref={index === 0 ? ilkSayiButonuRef : undefined}
              type="button"
              onClick={() => handleSayi(n)}
              disabled={dokunuldu || hata}
              aria-pressed={dokunuldu}
              aria-label={dokunuldu ? `${n}, ${siraNo}. sırada seçildi` : `${n}, sıradaki sayı olarak seç`}
              style={{
                width: 96,
                height: 96,
                fontSize: 30,
                border: `3px solid ${hata ? COLOR.retry : dokunuldu ? COLOR.correct : COLOR.border}`,
                background: dokunuldu ? COLOR.correctSoft : COLOR.surface,
                borderRadius: 12,
                cursor: dokunuldu ? 'default' : 'pointer',
                opacity: dokunuldu ? 0.6 : 1,
                fontFamily: 'inherit',
                color: COLOR.ink,
                position: 'relative',
              }}
            >
              {n}
              {dokunuldu && (
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: COLOR.correct,
                    color: '#fff',
                    fontSize: 14,
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  {siraNo}
                </span>
              )}
            </button>
          );
        })}
      </section>

      {hata && (
        <p
          aria-hidden="true"
          style={{
            textAlign: 'center',
            color: COLOR.retry,
            fontSize: 'var(--text-adult)',
            margin: 0,
          }}
        >
          Sıralama tutmadı. Sayılar birazdan yeniden açılacak.
        </p>
      )}
    </main>
  );
}

const ekranOkuyucuMetniStili = {
  position: 'absolute' as const,
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden' as const,
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap' as const,
  border: 0,
};
