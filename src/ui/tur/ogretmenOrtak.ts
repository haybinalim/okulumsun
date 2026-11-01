import type { CSSProperties } from 'react';
import { OGRETIM_SIRASI } from '../../content/dersler/tur/alfabe';

/** Okuma Yazma öğretmen ekranlarının ortak biçim ve yardımcıları (Adım 71). YALNIZ bayraklı derlemede. */
export const kucukDugme: CSSProperties = {
  minWidth: 'calc(var(--size-tap-min) * 0.8)',
  minHeight: 'calc(var(--size-tap-min) * 0.8)',
  padding: '0 0.3em',
  fontSize: 'var(--text-adult)',
};

/** Yetişkin listelerinde sık düğme: tahtada ~61 px, tablette en az 44 px. */
export const sikDugme: CSSProperties = {
  minWidth: 'max(44px, calc(var(--size-tap-min) * 0.6))',
  minHeight: 'max(44px, calc(var(--size-tap-min) * 0.6))',
  padding: '0 0.35em',
  fontSize: 'var(--text-adult)',
  whiteSpace: 'nowrap',
  flexShrink: 0,
};

/** Kümedeki en yeni küçük harf (resmî sırada) = "bugünkü ses". */
export function bugunkuSes(kume: ReadonlySet<string>): string {
  return [...OGRETIM_SIRASI].reverse().find((x) => kume.has(x)) ?? 'a';
}

