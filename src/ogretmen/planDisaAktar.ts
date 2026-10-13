/**
 * HAFTALIK PLAN DIŞA AKTARIMI — SAF metin üretimi (plan v2 Adım 37).
 *
 * CSV: UTF-8 BOM + `;` ayırıcı (Türkçe yerel ayarlı Excel virgülü ondalık sayar) + CRLF.
 * HTML: yazdırılabilir, tek dosya, dış kaynak yok. İndirme (Blob + `<a download>`) UI katmanında;
 * bu modül ağ, depolama ve DOM kullanmaz.
 */
import type { PlanHaftasi } from './haftalikPlan';

export const CSV_BOM = '\uFEFF';
export const CSV_BASLIKLARI = ['Hafta', 'Pazartesi', 'Tema', 'Kazanımlar', 'Etkinlikler', 'Not'] as const;

export interface DisaAktarEtiketleri {
  /** Tema no → tema adı. */
  readonly tema: (no: number) => string;
  /** Beceri id → çocuk etiketi. */
  readonly dugum: (id: string) => string;
}

function csvAlani(v: string): string {
  return /[;"\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function trTarih(iso: string): string {
  const [y, a, g] = iso.split('-');
  return `${g}.${a}.${y}`;
}

function satirMetinleri(p: PlanHaftasi, e: DisaAktarEtiketleri): string[] {
  return [
    String(p.hafta.no),
    trTarih(p.hafta.pazartesi),
    p.temaNo == null ? 'Okul temelli planlama / tekrar' : e.tema(p.temaNo),
    p.kazanimKodlari.join(', '),
    p.dugumler.map(e.dugum).join(', '),
    [p.hafta.not, p.duzeltme ? `Düzeltme: ${p.duzeltme}` : undefined].filter(Boolean).join(' · '),
  ];
}

export function planCsv(plan: readonly PlanHaftasi[], e: DisaAktarEtiketleri): string {
  const satirlar = [CSV_BASLIKLARI.join(';'), ...plan.map((p) => satirMetinleri(p, e).map(csvAlani).join(';'))];
  return CSV_BOM + satirlar.join('\r\n') + '\r\n';
}

function kacis(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function planHtml(plan: readonly PlanHaftasi[], e: DisaAktarEtiketleri, baslik: string): string {
  const govde = plan
    .map(
      (p) =>
        `<tr>${satirMetinleri(p, e)
          .map((v) => `<td>${kacis(v)}</td>`)
          .join('')}</tr>`,
    )
    .join('\n');
  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><title>${kacis(baslik)}</title>
<style>body{font-family:system-ui,sans-serif;margin:12mm}table{border-collapse:collapse;width:100%;font-size:10pt}th,td{border:1px solid #444;padding:4px;vertical-align:top;text-align:left}th{background:#eee}@page{size:A4 landscape;margin:10mm}</style>
</head><body><h1>${kacis(baslik)}</h1>
<table><thead><tr>${CSV_BASLIKLARI.map((b) => `<th>${b}</th>`).join('')}</tr></thead>
<tbody>
${govde}
</tbody></table></body></html>
`;
}
