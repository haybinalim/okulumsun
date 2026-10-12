/**
 * PWA ikonlarını üretir (plan v2 Adım 25, KG-36). `npm run ikon:uret`
 *
 * Motif: onluk çerçeve (2×5), 7 dolu göz — 1. sınıf sayma modeli. Renkler
 * `src/design/tokens.ts`'ten (sabit kopyalama yok). Tek geometri iki çiziciye
 * gider: SVG (favicon) ve ImageMagick `-draw` (PNG; SVG çözücüsü gerekmez).
 * PNG'ler depoya işlenir — çalışma anında veya CI'da araç gerekmez.
 *
 * Çıktılar (public/): favicon.svg, icon-192.png, icon-512.png,
 * icon-maskable-512.png (motif %80 güvenli alanın içinde), apple-touch-icon.png (180).
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ACCENTS, COLOR } from '../src/design/tokens.ts';

const MOR = ACCENTS.find((a) => a.id === 'mor')!.hex;

export type Sekil =
  | {
      t: 'rect';
      x: number;
      y: number;
      w: number;
      h: number;
      rx: number;
      fill: string;
      stroke?: string;
      sw?: number;
    }
  | {
      t: 'line';
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      stroke: string;
      sw: number;
    }
  | { t: 'circle'; cx: number; cy: number; r: number; fill: string };

/** 512 birimlik tuvalde şekiller. @param icerikOrani çerçevenin kenara oranı. */
export function ikonSekilleri(opts: { yuvarlak: boolean; icerikOrani: number }): Sekil[] {
  const K = 512;
  const icerik = K * opts.icerikOrani;
  const x0 = (K - icerik) / 2;
  const h = icerik / 5;
  const y0 = K / 2 - h;
  const s: Sekil[] = [
    {
      t: 'rect',
      x: 0,
      y: 0,
      w: K,
      h: K,
      rx: opts.yuvarlak ? K * 0.22 : 0,
      fill: COLOR.bg,
    },
    {
      t: 'rect',
      x: x0,
      y: y0,
      w: icerik,
      h: 2 * h,
      rx: h * 0.18,
      fill: COLOR.surface,
      stroke: COLOR.ink,
      sw: h * 0.07,
    },
    {
      t: 'line',
      x1: x0,
      y1: y0 + h,
      x2: x0 + icerik,
      y2: y0 + h,
      stroke: COLOR.border,
      sw: h * 0.05,
    },
  ];
  for (let i = 1; i < 5; i++)
    s.push({
      t: 'line',
      x1: x0 + i * h,
      y1: y0,
      x2: x0 + i * h,
      y2: y0 + 2 * h,
      stroke: COLOR.border,
      sw: h * 0.05,
    });
  for (let i = 0; i < 7; i++) {
    const sat = Math.floor(i / 5);
    s.push({
      t: 'circle',
      cx: x0 + ((i % 5) + 0.5) * h,
      cy: y0 + (sat + 0.5) * h,
      r: h * 0.34,
      fill: sat === 0 ? MOR : COLOR.mascot,
    });
  }
  return s;
}

const n = (v: number) => Number(v.toFixed(2));

export function svgYaz(sekiller: readonly Sekil[]): string {
  const govde = sekiller
    .map((k) => {
      if (k.t === 'rect')
        return `<rect x="${n(k.x)}" y="${n(k.y)}" width="${n(k.w)}" height="${n(k.h)}" rx="${n(k.rx)}" fill="${k.fill}"${k.stroke ? ` stroke="${k.stroke}" stroke-width="${n(k.sw!)}"` : ''}/>`;
      if (k.t === 'line')
        return `<line x1="${n(k.x1)}" y1="${n(k.y1)}" x2="${n(k.x2)}" y2="${n(k.y2)}" stroke="${k.stroke}" stroke-width="${n(k.sw)}"/>`;
      return `<circle cx="${n(k.cx)}" cy="${n(k.cy)}" r="${n(k.r)}" fill="${k.fill}"/>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">${govde}</svg>\n`;
}

function magickArgumanlari(sekiller: readonly Sekil[]): string[] {
  const a: string[] = [];
  for (const k of sekiller) {
    if (k.t === 'rect') {
      a.push('-fill', k.fill, '-stroke', k.stroke ?? 'none', '-strokewidth', String(n(k.sw ?? 0)));
      a.push(
        '-draw',
        `roundrectangle ${n(k.x)},${n(k.y)} ${n(k.x + k.w - 1)},${n(k.y + k.h - 1)} ${n(k.rx)},${n(k.rx)}`,
      );
    } else if (k.t === 'line') {
      a.push(
        '-fill',
        'none',
        '-stroke',
        k.stroke,
        '-strokewidth',
        String(n(k.sw)),
        '-draw',
        `line ${n(k.x1)},${n(k.y1)} ${n(k.x2)},${n(k.y2)}`,
      );
    } else {
      a.push('-fill', k.fill, '-stroke', 'none', '-draw', `circle ${n(k.cx)},${n(k.cy)} ${n(k.cx + k.r)},${n(k.cy)}`);
    }
  }
  return a;
}

function main(): void {
  const pub = join(process.cwd(), 'public');
  const normal = ikonSekilleri({ yuvarlak: true, icerikOrani: 0.8 });
  const kare = ikonSekilleri({ yuvarlak: false, icerikOrani: 0.8 });
  const maskable = ikonSekilleri({ yuvarlak: false, icerikOrani: 0.64 });
  writeFileSync(join(pub, 'favicon.svg'), svgYaz(normal));
  const png = (sekiller: Sekil[], ad: string, boyut: number) =>
    execFileSync('magick', [
      '-size',
      '512x512',
      'xc:none',
      ...magickArgumanlari(sekiller),
      '-resize',
      `${boyut}x${boyut}`,
      '-strip',
      join(pub, ad),
    ]);
  png(normal, 'icon-192.png', 192);
  png(normal, 'icon-512.png', 512);
  png(maskable, 'icon-maskable-512.png', 512);
  png(kare, 'apple-touch-icon.png', 180);
  console.log('✓ İkonlar üretildi (public/).');
}

if (process.argv[1]?.endsWith('ikon-uret.ts')) main();
