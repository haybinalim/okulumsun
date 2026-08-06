/**
 * VELİ KAPISI EKRANI — plan §11.
 *
 * "Aşağıdaki sayılara büyükten küçüğe dokunun" — yalnız metin.
 * Okuyamayan çocuk geçemez. ⚠️ Matematik işlemi kullanma — bu bir matematik
 * uygulaması, çocuk çözer.
 *
 * 4 sayıyı büyükten küçüğe sıralama. Yetişkin için kolay, okuma bilmeyen
 * 1. sınıf çocuğu için imkânsız.
 */

import { useState, useMemo, useCallback } from 'react';
import { useAppStore } from '../../store/appStore';
import { BigButton } from '../primitives/BigButton';
import { COLOR } from '../../design/tokens';

/** Veli kapısı sayıları — her seferinde farklı, ama deterministik. */
function sayiUret(tohum: number): number[] {
  // 0-99 arası 4 farklı sayı
  const sayilar: number[] = [];
  let s = tohum;
  for (let i = 0; i < 4; i++) {
    s = (s * 31 + 17) % 100;
    sayilar.push(s);
  }
  // Tekrarları ele
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

  const dogruSira = useMemo(() => [...sayilar].sort((a, b) => b - a), [sayilar]);

  const handleSayi = useCallback((n: number) => {
    if (sira.includes(n)) return;
    const yeniSira = [...sira, n];
    setSira(yeniSira);

    if (yeniSira.length === 4) {
      // Kontrol et
      const dogru = yeniSira.every((v, i) => v === dogruSira[i]);
      if (dogru) {
        veliGec(true);
        ekranGit('veliPaneli');
      } else {
        setHata(true);
        setTimeout(() => {
          setSira([]);
          setHata(false);
        }, 1500);
      }
    }
  }, [sira, dogruSira, veliGec, ekranGit]);

  const handleGeri = () => {
    ekranGit('anaEkran');
  };

  return (
    <main
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
      {/* Geri butonu */}
      <header style={{ flex: '0 0 auto', display: 'flex' }}>
        <BigButton label="Geri" size="control" variant="ghost" onPress={handleGeri}>
          ←
        </BigButton>
      </header>

      {/* Talimat — yalnız metin (yetişkin için) */}
      <section
        style={{
          flex: '0 0 auto',
          textAlign: 'center',
          padding: 'var(--size-gap)',
        }}
      >
        <p style={{ fontSize: 'var(--text-adult)', color: COLOR.ink, margin: 0 }}>
          Aşağıdaki sayılara büyükten küçüğe dokunun
        </p>
      </section>

      {/* Sayılar */}
      <section
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 'var(--size-gap)',
          flexWrap: 'wrap',
        }}
      >
        {sayilar.map((n) => {
          const dokunuldu = sira.includes(n);
          const siraNo = sira.indexOf(n) + 1;
          return (
            <button
              key={n}
              type="button"
              onClick={() => handleSayi(n)}
              disabled={dokunuldu || hata}
              style={{
                width: 80,
                height: 80,
                fontSize: 28,
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

      {/* Hata mesajı (yetişkin için) */}
      {hata && (
        <div
          style={{
            textAlign: 'center',
            color: COLOR.retry,
            fontSize: 'var(--text-adult)',
          }}
        >
          Sıralama hatalı, tekrar deneyin.
        </div>
      )}
    </main>
  );
}
