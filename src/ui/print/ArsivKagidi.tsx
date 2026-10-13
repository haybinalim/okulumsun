/**
 * ARŞİV KÂĞIDI GÖRÜNÜMÜ (plan v2 Adım 48 aşama 2, KG-70): `?arsiv=<kâğıt kodu>` yalnız kâğıdı çizer.
 *
 * `scripts/calisma-kagidi-arsivi.ts` bu görünümü önizleme sunucusunda açıp A4 PDF basar. Uygulama kabuğu, ses ve
 * depolama yoktur; kod geçersizse kısa bir bilgi metni. Kâğıt uygulamadaki çalışma kâğıdıyla aynı üretimdir
 * (`kagitPlaniUret`), cevap anahtarı dâhil, renkli; para her zaman şematik (KG-19: kâğıt ve arşiv aynı strateji, TCMB izni yok).
 */
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { skillsData } from '../../content/skillsData';
import { kagitKoduCoz, kagitPlaniUret } from '../../ogretmen/calismaKagidi/kagitPlani';
import { kagitMetinOzeti } from '../../ogretmen/calismaKagidi/arsiv';
import { trDuzlestir } from '../../ogretmen/calismaKagidi/sesMetni';
import { KagitSayfalari } from './KagitSayfalari';

const GECERLI = new Set(skillsData.filter((d) => d.durum === 'hazir').map((d) => d.id));

export function ArsivKagidi({ kod }: { kod: string }) {
  const istek = useMemo(() => kagitKoduCoz(kod, GECERLI), [kod]);
  const [tr, setTr] = useState<Record<string, string> | null>(null);
  useEffect(() => {
    let iptal = false;
    void import('../../content/tr.json').then((m) => {
      if (!iptal) setTr(trDuzlestir(m.default as unknown as Record<string, unknown>));
    });
    return () => {
      iptal = true;
    };
  }, []);
  const plan = useMemo(() => (istek && tr ? kagitPlaniUret(istek, tr) : null), [istek, tr]);

  const [kap, setKap] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const el = document.createElement('div');
    el.id = 'kagit-baski';
    el.className = 'kg-arsiv';
    document.body.appendChild(el);
    setKap(el);
    return () => el.remove();
  }, []);

  if (!istek) {
    return (
      <main style={{ padding: 24, fontFamily: 'inherit' }}>
        <p role="status">Bu kâğıt kodu geçersiz.</p>
      </main>
    );
  }
  return (
    <main
      data-arsiv-hazir={plan ? '' : undefined}
      data-arsiv-ozet={plan ? kagitMetinOzeti(plan) : undefined}
      className="kg-arsiv"
      style={{ padding: 24, fontFamily: 'inherit' }}
    >
      <p role="status">{plan ? `Kâğıt kodu: ${plan.kod}` : 'Kâğıt hazırlanıyor…'}</p>
      {plan && <KagitSayfalari plan={plan} duzen={istek.duzen} cevapAnahtariDahil siyahBeyaz={false} kopya="onizleme" />}
      {kap &&
        plan &&
        createPortal(
          <KagitSayfalari plan={plan} duzen={istek.duzen} cevapAnahtariDahil siyahBeyaz={false} kopya="baski" />,
          kap,
        )}
    </main>
  );
}

export default ArsivKagidi;
