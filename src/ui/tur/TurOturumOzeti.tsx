/**
 * "Bu derste ne yaptık" (Okuma Yazma Adım 81, E5) — set sonunda öğretmen yüzeyi. YALNIZ `VITE_DERS_TUR=1` derlemesinde.
 * Nitel özet (`oturumOzeti.ts`): sayı/yüzde/puan/öğrenci adı yok; yalnız bellekte. "Özeti yazdır" tarayıcının yazdırma
 * penceresidir (baskı kopyası `#root` dışında, `ozet.css`); ağ ve depolama yok.
 */
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import './ozet.css';
import { TUR_SABLONLARI } from '../../content/dersler/tur/sablonlar';
import { BigButton } from '../primitives/BigButton';
import { sikDugme } from './ogretmenOrtak';
import { DUZEY_METNI, ozetHarfleri, ozetKaydi, ozetOlustur, type OturumOzeti as Ozet } from './oturumOzeti';
import { useTurKume } from './turKume';

const ad = (kod: keyof typeof TUR_SABLONLARI): string => TUR_SABLONLARI[kod].ad;
const liste = (l: readonly (keyof typeof TUR_SABLONLARI)[]): string => l.map(ad).join(', ');

function OzetGovdesi({ ozet }: { ozet: Ozet }) {
  return (
    <article aria-label="Bu derste ne yaptık" data-oturum-ozeti="" style={{ fontSize: 'var(--text-adult)', lineHeight: 1.35 }}>
      <h2 style={{ margin: '0 0 0.3em', fontSize: '1.15em' }}>Bu derste ne yaptık</h2>
      <p style={{ margin: '0 0 0.2em' }} data-ozet="harfler">
        <strong>Harfler:</strong> {ozet.harfler.join(', ')}
      </p>
      <p style={{ margin: '0 0 0.2em' }} data-ozet="turler">
        <strong>Etkinlik türleri:</strong> {liste(ozet.turler)}
      </p>
      <p style={{ margin: '0 0 0.2em' }} data-ozet="acilan">
        <strong>Açılan etkinlik:</strong> {ozet.acilan}
      </p>
      <p style={{ margin: '0 0 0.2em' }} data-ozet="birlikte">
        <strong>Yanlış denemeden sonra düzeltilen:</strong> {ozet.birlikteCozulen.length ? liste(ozet.birlikteCozulen) : 'yok'}
      </p>
      <p style={{ margin: '0 0 0.3em' }} data-ozet="yardim">
        <strong>Soru yeniden dinlenen:</strong> {ozet.yardimIstenen.length ? liste(ozet.yardimIstenen) : 'yok'}
      </p>
      <ol aria-label="Etkinlikler" style={{ margin: 0, paddingLeft: '1.4em', columns: 2, columnGap: '2em' }}>
        {ozet.satirlar.map((s) => (
          <li key={s.sira} data-duzey={s.duzey} style={{ breakInside: 'avoid' }}>
            {ad(s.sablon)}: {DUZEY_METNI[s.duzey]}
          </li>
        ))}
      </ol>
      <p style={{ margin: '0.4em 0 0', color: 'var(--color-ink-soft, #6B6B6B)' }}>
        Bu özet yalnız bu ekranda durur; ekrandan çıkınca silinir. Uygulama hiçbir yere kaydetmez.
      </p>
    </article>
  );
}

/** Baskı kopyası `#root` dışında: yazdırmada yalnız özet çıkar. */
function OzetBaskisi({ ozet }: { ozet: Ozet }) {
  const [kap, setKap] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const el = document.createElement('div');
    el.id = 'tur-ozet-baski';
    el.className = 'oz-baski';
    document.body.appendChild(el);
    setKap(el);
    return () => el.remove();
  }, []);
  return kap ? createPortal(<OzetGovdesi ozet={ozet} />, kap) : null;
}

/** Set sonu özeti; oturum kaydı yoksa (eve link cihazı) hiçbir şey çizmez. */
export function OturumOzetiBolumu() {
  const kume = useTurKume();
  const kayit = ozetKaydi();
  const ozet = useMemo(() => (kayit ? ozetOlustur(kayit, ozetHarfleri(kume)) : null), [kayit, kume]);
  if (!ozet || ozet.acilan === 0) return null;
  return (
    <>
      <div data-oz-ekran="" style={{ width: '100%', maxWidth: '44em', minHeight: 0, overflowY: 'auto' }}>
        <OzetGovdesi ozet={ozet} />
      </div>
      <BigButton label="Özeti yazdır" data-yetiskin="" style={sikDugme} onPress={() => window.print()}>
        <span>Özeti yazdır</span>
      </BigButton>
      <OzetBaskisi ozet={ozet} />
    </>
  );
}
