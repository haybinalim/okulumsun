import type { ReactNode } from 'react';
import { BigButton } from '../primitives/BigButton';
import { KART_ETIKETI_YAZI } from '../../design/tokens';

/**
 * GEZİNME ÇUBUĞU (KG-103) — "Geri" ve "Ana menü", her ekranda aynı yerde, aynı görünümde.
 *
 * Simge + kısa metin (çocuk okumaz; simge birinci kanal, metin ikinci); erişilebilir ad `aria-label`.
 * Boyut `--size-control` (tokens: "ikincil kontroller: geri, tekrar dinle, yardım") → tablet 88 px,
 * tahta 141 px (≥ 102 px kuralı), büyük hedef ayarında da alt sınırın üstünde. Yazı tipi ekrandan
 * miras: çocuk ekranında TemelYazi, yetişkin ekranında Andika (`data-yazi`, KG-96).
 *
 * Yerleşim kararı `EkranCercevesi`nde: yatay ekranda solda dikey ray (tahtada düğmeler rayın ALTINDA →
 * üst %35 erişilemez bölgeye girmez; tablet/telefonda üstünde), dikey (portre) ekranda üstte yatay şerit
 * (tahtada altta). Ray yer kaplar, ekranın üstüne binmez.
 *
 * Bu bileşen saf görünümdür: ne yapılacağını `onGeri`/`onAnaMenu` söyler (verilmeyen düğme çizilmez).
 */
export function GezinmeCubugu({
  onGeri,
  onAnaMenu,
  yon,
  hizala,
}: {
  onGeri?: () => void;
  onAnaMenu?: () => void;
  /** `dikey`: düğmeler alt alta (yan ray); `yatay`: yan yana (şerit). */
  yon: 'dikey' | 'yatay';
  /** `bas`: rayın/şeridin başı (üst/sol); `son`: sonu (alt/sağ). */
  hizala: 'bas' | 'son';
}) {
  if (!onGeri && !onAnaMenu) return null;
  const dikey = yon === 'dikey';
  return (
    <nav
      aria-label="Gezinme"
      data-gezinme=""
      style={{
        flex: '0 0 auto',
        display: 'flex',
        flexDirection: dikey ? 'column' : 'row',
        justifyContent: hizala === 'son' ? 'flex-end' : 'flex-start',
        alignItems: 'stretch',
        gap: 'var(--size-gap-tight)',
        // Ekranlar kendi kenar boşluğunu (`--size-edge`) taşır; ray yalnız dış kenarı ekler.
        paddingTop: dikey || hizala === 'bas' ? 'var(--size-edge)' : 0,
        paddingBottom: dikey || hizala === 'son' ? 'var(--size-edge-bottom)' : 0,
        paddingLeft: 'var(--size-edge)',
        paddingRight: dikey ? 0 : 'var(--size-edge)',
        position: 'relative',
        zIndex: 4,
      }}
    >
      {onGeri && (
        <GezinmeDugmesi etiket="Geri" onPress={onGeri}>
          <GeriSimgesi />
        </GezinmeDugmesi>
      )}
      {onAnaMenu && (
        <GezinmeDugmesi etiket="Ana menü" onPress={onAnaMenu}>
          <EvSimgesi />
        </GezinmeDugmesi>
      )}
    </nav>
  );
}

function GezinmeDugmesi({ etiket, onPress, children }: { etiket: string; onPress: () => void; children: ReactNode }) {
  return (
    <BigButton
      label={etiket}
      size="control"
      variant="solid"
      onPress={onPress}
      style={{
        // Genişlik sabit `--size-control` (ray dar kalsın: tahtada 141 px); "Ana menü" gerekirse iki satır.
        width: 'var(--size-control)',
        flexDirection: 'column',
        gap: 'calc(4px * var(--scale))',
        padding: 'calc(8px * var(--scale)) calc(6px * var(--scale))',
        fontSize: KART_ETIKETI_YAZI,
        lineHeight: 1.1,
        textAlign: 'center',
        overflowWrap: 'normal',
      }}
    >
      {children}
      <span aria-hidden="true">{etiket}</span>
    </BigButton>
  );
}

const SIMGE = { width: 'calc(34px * var(--scale))', height: 'calc(34px * var(--scale))', flex: '0 0 auto' } as const;

function GeriSimgesi() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" style={SIMGE}>
      <path d="M27 16H6M14 7l-9 9 9 9" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EvSimgesi() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" style={SIMGE}>
      <path d="M4 15 16 5l12 10M8 12v15h6v-8h4v8h6V12" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
