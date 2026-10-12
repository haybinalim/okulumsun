/**
 * PWA ikonlarını üretir (plan v2 Adım 25, KG-36, KG-37). `npm run ikon:uret`
 *
 * Motif: Bahçem çiçeği — beş renkli yaprak (öğrenci vurgu renkleri), beş
 * noktalı göbek (beşi sayma), yeşil gövde ve yaprak. Renkler
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

const vurgu = (id: (typeof ACCENTS)[number]['id']) => ACCENTS.find((a) => a.id === id)!.hex;

export type Sekil =
  | { t: 'rect'; x: number; y: number; w: number; h: number; rx: number; fill: string }
  | { t: 'line'; x1: number; y1: number; x2: number; y2: number; stroke: string; sw: number }
  | { t: 'circle'; cx: number; cy: number; r: number; fill: string }
  | { t: 'ellipse'; cx: number; cy: number; rx: number; ry: number; fill: string };

/**
 * 512 birimlik tuvalde şekiller.
 * @param olcek motifin (zemin hariç) merkez etrafında ölçeği; maskable için küçültülür.
 */
export function ikonSekilleri(opts: { yuvarlak: boolean; olcek: number }): Sekil[] {
  const K = 512;
  const m = K / 2;
  const o = opts.olcek;
  const X = (v: number) => m + (v - m) * o;
  const L = (v: number) => v * o;
  const s: Sekil[] = [{ t: 'rect', x: 0, y: 0, w: K, h: K, rx: opts.yuvarlak ? K * 0.22 : 0, fill: COLOR.bg }];
  // Gövde ve yaprak
  s.push({ t: 'line', x1: X(256), y1: X(280), x2: X(256), y2: X(440), stroke: COLOR.correct, sw: L(18) });
  s.push({ t: 'ellipse', cx: X(302), cy: X(384), rx: L(46), ry: L(22), fill: COLOR.correct });
  // Beş yaprak
  const renkler = [vurgu('mor'), vurgu('turuncu'), vurgu('pembe'), vurgu('mavi'), vurgu('sari')];
  const gx = 256;
  const gy = 205;
  renkler.forEach((fill, i) => {
    const a = ((-90 + i * 72) * Math.PI) / 180;
    s.push({ t: 'circle', cx: X(gx + 80 * Math.cos(a)), cy: X(gy + 80 * Math.sin(a)), r: L(54), fill });
  });
  // Göbek: beş nokta
  s.push({ t: 'circle', cx: X(gx), cy: X(gy), r: L(48), fill: COLOR.surface });
  for (let i = 0; i < 5; i++) {
    const a = ((-90 + i * 72) * Math.PI) / 180;
    s.push({ t: 'circle', cx: X(gx + 24 * Math.cos(a)), cy: X(gy + 24 * Math.sin(a)), r: L(9), fill: COLOR.ink });
  }
  return s;
}

const n = (v: number) => Number(v.toFixed(2));

export function svgYaz(sekiller: readonly Sekil[]): string {
  const govde = sekiller
    .map((k) => {
      if (k.t === 'rect')
        return `<rect x="${n(k.x)}" y="${n(k.y)}" width="${n(k.w)}" height="${n(k.h)}" rx="${n(k.rx)}" fill="${k.fill}"/>`;
      if (k.t === 'line')
        return `<line x1="${n(k.x1)}" y1="${n(k.y1)}" x2="${n(k.x2)}" y2="${n(k.y2)}" stroke="${k.stroke}" stroke-width="${n(k.sw)}"/>`;
      if (k.t === 'ellipse')
        return `<ellipse cx="${n(k.cx)}" cy="${n(k.cy)}" rx="${n(k.rx)}" ry="${n(k.ry)}" fill="${k.fill}"/>`;
      return `<circle cx="${n(k.cx)}" cy="${n(k.cy)}" r="${n(k.r)}" fill="${k.fill}"/>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">${govde}</svg>\n`;
}

function magickArgumanlari(sekiller: readonly Sekil[]): string[] {
  const a: string[] = [];
  for (const k of sekiller) {
    if (k.t === 'rect') {
      a.push('-fill', k.fill, '-stroke', 'none');
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
    } else if (k.t === 'ellipse') {
      a.push('-fill', k.fill, '-stroke', 'none', '-draw', `ellipse ${n(k.cx)},${n(k.cy)} ${n(k.rx)},${n(k.ry)} 0,360`);
    } else {
      a.push('-fill', k.fill, '-stroke', 'none', '-draw', `circle ${n(k.cx)},${n(k.cy)} ${n(k.cx + k.r)},${n(k.cy)}`);
    }
  }
  return a;
}

function main(): void {
  const pub = join(process.cwd(), 'public');
  const normal = ikonSekilleri({ yuvarlak: true, olcek: 1 });
  const kare = ikonSekilleri({ yuvarlak: false, olcek: 1 });
  const maskable = ikonSekilleri({ yuvarlak: false, olcek: 0.8 });
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
