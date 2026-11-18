import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useHamleVerisi } from '../useHamleVerisi';
import { eveKarekodu } from './eveKarekodu';
import { TurKagitSayfasi } from './TurKagitSayfasi';
import { turKagitKoduCoz, turKagitSayfalari, type TurKagitIstegi } from './turKagidi';

/**
 * Türkçe kâğıt görünümü (Adım 65): `?arsiv=tur-…` YALNIZ bayraklı derlemede (`main.tsx`). Önizleme (ekran) ve
 * yazdırma kopyası (portal, `#root` dışında) aynı SVG sayfalar. Uygulama kabuğu, ses ve depolama yok.
 */
export function TurKagitlari({
  istek,
  eveBaglantisi,
}: {
  readonly istek: TurKagitIstegi;
  /** Set bağlamında açılan kâğıt (Adım 81): aynı setin eve bağlantısı alt bilgiye karekod olur. */
  readonly eveBaglantisi?: string;
}) {
  const eve = useMemo(() => (eveBaglantisi ? eveKarekodu(eveBaglantisi) : undefined), [eveBaglantisi]);
  const veri = useHamleVerisi();
  const sayfalar = useMemo(
    () => (veri.durum === 'hazir' ? turKagitSayfalari(istek, veri.veri.glifler) : null),
    [veri, istek],
  );
  const [kap, setKap] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const el = document.createElement('div');
    el.id = 'tur-kagit-baski';
    document.body.appendChild(el);
    setKap(el);
    return () => el.remove();
  }, []);
  if (veri.durum === 'hata') return <p role="status">Yazılış verisi açılamadı.</p>;
  if (!sayfalar) return <p role="status">Kâğıt hazırlanıyor</p>;
  if (sayfalar.length === 0) return <p role="status">Bu kâğıt kodu geçersiz.</p>;
  const ciz = (kopya: 'onizleme' | 'baski') => (
    <div className={`tk-kok tk-kok--${kopya}`} data-tur-kagit-sayfa-sayisi={sayfalar.length}>
      {sayfalar.map(({ sayfa, glif, glifler }, k) => (
        <TurKagitSayfasi key={k} sayfa={sayfa} glif={glif} glifler={glifler} eve={eve} />
      ))}
    </div>
  );
  return (
    <>
      {eve?.durum === 'hata' && (
        <p role="alert" data-eve-karekod-hata="" data-yetiskin="">
          Karekod üretilemedi: {eve.neden}. Kâğıt karekodsuz basılır.
        </p>
      )}
      <div data-tur-kagit-hazir="">{ciz('onizleme')}</div>
      {kap && createPortal(ciz('baski'), kap)}
    </>
  );
}

export function TurArsivKagidi({ kod }: { readonly kod: string }) {
  const istek = useMemo(() => turKagitKoduCoz(kod), [kod]);
  return (
    <main className="tk-arsiv" style={{ padding: 24 }}>
      {istek ? <TurKagitlari istek={istek} /> : <p role="status">Bu kâğıt kodu geçersiz.</p>}
    </main>
  );
}

export default TurArsivKagidi;
