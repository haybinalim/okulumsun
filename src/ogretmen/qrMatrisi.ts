/**
 * QR MATRİSİ — SAF (plan v2 Adım 42 aşama 3). Eve link'i yerelde QR'a çevirir; ağ/servis yok.
 * Kodlayıcı `qrcode-generator` (MIT, K10 envanterinde); yalnız Eve gönder ekranıyla tembel yüklenir.
 * Hata düzeltme M (%15): tahtaya tutulan telefonun açı/yansıma kaybını karşılar, sürüm küçük kalır.
 */
import qrcode from 'qrcode-generator';

/** `true` = koyu modül. Satır-sütun, sessiz bölge (4 modül) DAHİL DEĞİL. */
export type QrMatrisi = readonly (readonly boolean[])[];

export const QR_SESSIZ_BOLGE = 4;

export function qrMatrisi(metin: string): QrMatrisi {
  if (metin.length === 0) throw new Error('qrMatrisi: boş metin.');
  const qr = qrcode(0, 'M');
  qr.addData(metin, 'Byte');
  qr.make();
  const n = qr.getModuleCount();
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => qr.isDark(r, c)));
}

/** Koyu modüllerin tek SVG yolu (sessiz bölge kaydırmasıyla); `viewBox` = 0 0 boyut boyut. */
export function qrSvgYolu(m: QrMatrisi): { readonly yol: string; readonly boyut: number } {
  const boyut = m.length + QR_SESSIZ_BOLGE * 2;
  const parcalar: string[] = [];
  m.forEach((satir, r) =>
    satir.forEach((koyu, c) => {
      if (koyu) parcalar.push(`M${c + QR_SESSIZ_BOLGE} ${r + QR_SESSIZ_BOLGE}h1v1h-1z`);
    }),
  );
  return { yol: parcalar.join(''), boyut };
}
