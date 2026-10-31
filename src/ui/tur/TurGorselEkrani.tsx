/**
 * Okuma Yazma "Görseller" kataloğu (Adım 68) — YALNIZ `VITE_DERS_TUR=1` derlemesinde (`TurEkrani` üzerinden).
 *
 * Öğretmen ve geliştirici için: harf grubunun resimli sözcük görselleri, altında sözcüğü; "Siyah-beyaz" baskı
 * görünümünü (gri ton) gösterir. Görseller statik SVG veridir (ADR-0016, `ders-verisi/tur/gorseller/`); dizin grup
 * açılınca bir kez aynı kökenden okunur ve bellekte tutulur (grup bazlı). Ses yok, hiçbir şey saklanmaz. Sözcük listesi
 * ve görseller öğretmen teyidi bekler; çocuk etkinlikleri (T-01, T-08) Adım 70'te.
 */
import { useEffect, useState } from 'react';
import { HARF_GRUPLARI } from '../../content/dersler/tur/alfabe';
import { TUR_VERI_KOKU, turVerisiniOku } from '../../content/dersler/tur/veriYukleyici';
import { BigButton } from '../primitives/BigButton';
import { turEkraniAc } from './turEkrani';
import { Baslik, ekranStili } from './turOrtak';

export interface GorselOgesi {
  readonly id: string;
  readonly dosya: string;
  readonly sozcuk: string;
}

const DOSYA = /^gorseller\/[a-z][a-z0-9-]*\.svg$/;

/** Dizini kabaca sınar (şema CI'da zod ile; çalışma anında zod yüklenmez) ve yalnız güvenli dosya yollarını alır. */
export function gorselDiziniOgeleri(d: unknown): GorselOgesi[] {
  const g = (d as { gorseller?: unknown } | null)?.gorseller;
  if (!Array.isArray(g)) throw new Error('görsel dizini biçimi beklenen gibi değil.');
  return g.filter(
    (x: unknown): x is GorselOgesi =>
      typeof x === 'object' &&
      x !== null &&
      typeof (x as GorselOgesi).id === 'string' &&
      typeof (x as GorselOgesi).sozcuk === 'string' &&
      typeof (x as GorselOgesi).dosya === 'string' &&
      DOSYA.test((x as GorselOgesi).dosya),
  );
}

const bellek = new Map<number, Promise<GorselOgesi[]>>();

export function grupGorselleriniYukle(grup: number): Promise<GorselOgesi[]> {
  let p = bellek.get(grup);
  if (!p) {
    p = turVerisiniOku(`gorseller/grup-${grup}.json`).then(gorselDiziniOgeleri);
    p.catch(() => bellek.delete(grup));
    bellek.set(grup, p);
  }
  return p;
}

type Durum =
  | { readonly durum: 'yukleniyor' }
  | { readonly durum: 'hazir'; readonly ogeler: readonly GorselOgesi[] }
  | { readonly durum: 'yok' };

export function GorselKatalogu({ grup, gri }: { grup: number; gri: boolean }) {
  const [s, setS] = useState<Durum & { readonly grup?: number }>({ durum: 'yukleniyor' });
  useEffect(() => {
    let iptal = false;
    grupGorselleriniYukle(grup).then(
      (ogeler) => !iptal && setS({ durum: 'hazir', ogeler, grup }),
      () => !iptal && setS({ durum: 'yok', grup }),
    );
    return () => {
      iptal = true;
    };
  }, [grup]);
  const guncel = s.grup === grup ? s : ({ durum: 'yukleniyor' } as const);
  const secenekler = (g: number, giri: boolean) => turEkraniAc({ ekran: 'gorseller', grup: g, gri: giri });
  return (
    <main aria-label="Görseller" style={{ ...ekranStili, justifyContent: 'flex-start' }}>
      <Baslik baslik="Görseller" alt="Resimli sözcükler. Sözcükler ve görseller öğretmen teyidi bekliyor." />
      <div
        role="group"
        aria-label="Gruplar"
        style={{ display: 'flex', gap: 'var(--size-gap-tight)', flexWrap: 'wrap', justifyContent: 'center' }}
      >
        {HARF_GRUPLARI.map((harfler, i) => (
          <BigButton
            key={i}
            label={`${i + 1}. grup: ${harfler.join(' ')}`}
            ariaPressed={grup === i + 1}
            variant={grup === i + 1 ? 'accent' : 'solid'}
            onPress={() => secenekler(i + 1, gri)}
          >
            <span aria-hidden="true">{i + 1}</span>
          </BigButton>
        ))}
        <BigButton label="Siyah-beyaz" ariaPressed={gri} variant={gri ? 'accent' : 'solid'} onPress={() => secenekler(grup, !gri)}>
          <span style={{ padding: '0 0.4em' }}>Siyah-beyaz</span>
        </BigButton>
      </div>
      {guncel.durum === 'hazir' ? (
        <ul
          aria-label={`${grup}. grup görselleri`}
          data-tur-gorsel-katalogu={grup}
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(calc(110px * var(--scale)), 1fr))',
            gap: 'var(--size-gap-tight)',
            width: '100%',
            overflowY: 'auto',
            minHeight: 0,
            flex: '1 1 auto',
          }}
        >
          {guncel.ogeler.map((g) => (
            <li key={g.id} style={{ textAlign: 'center' }}>
              <img
                src={`${TUR_VERI_KOKU}${g.dosya}`}
                alt={g.sozcuk}
                data-tur-gorsel={g.id}
                width={96}
                height={96}
                style={{
                  width: 'calc(96px * var(--scale))',
                  height: 'calc(96px * var(--scale))',
                  filter: gri ? 'grayscale(1)' : undefined,
                }}
              />
              <div data-yetiskin="" style={{ fontSize: 'var(--text-adult)' }}>
                {g.sozcuk}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p data-yetiskin="" role="status">
          {guncel.durum === 'yukleniyor' ? 'Yükleniyor' : 'Bu grubun görselleri henüz yok.'}
        </p>
      )}
    </main>
  );
}
