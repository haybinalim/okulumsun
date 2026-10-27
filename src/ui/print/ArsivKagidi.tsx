/**
 * ARŞİV KÂĞIDI GÖRÜNÜMÜ (plan v2 Adım 48 aşama 2, KG-70): `?arsiv=<kâğıt kodu>` yalnız kâğıdı çizer.
 *
 * `scripts/calisma-kagidi-arsivi.ts` bu görünümü önizleme sunucusunda açıp A4 PDF basar. Uygulama kabuğu, ses ve
 * depolama yoktur; kod geçersizse kısa bir bilgi metni. Kâğıt uygulamadaki çalışma kâğıdıyla aynı üretimdir
 * (`kagitPlaniUret`), cevap anahtarı dâhil, renkli; para her zaman şematik (KG-19: kâğıt ve arşiv aynı strateji, TCMB izni yok).
 *
 * Adım 53b (KG-93): `?arsiv=ETKI-1-A` / `ETKI-1-B` etki çalışmasının ön/son test formunu çizer (`etkiFormlariUret`).
 * Ad yerine Ç-kodu satırı; cevap anahtarı forma basılmaz (çocuğa dağıtılan kâğıtta durmasın; anahtar
 * `docs/research/olcme-araci/` belgesinde).
 *
 * KG-103: ekranda (yalnız ekranda — baskıda `#root` gizli, PDF değişmez) ortak gezinme çubuğu: Geri =
 * tarayıcı geçmişinde bir önceki sayfa (yoksa uygulama), Ana menü = uygulamanın kökü.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { applyProfile, resolveProfile } from '../../design/deviceProfile';
import { GezinmeCubugu } from '../gezinme/GezinmeCubugu';
import { createPortal } from 'react-dom';
import { skillsData } from '../../content/skillsData';
import { kagitKoduCoz, kagitPlaniUret } from '../../ogretmen/calismaKagidi/kagitPlani';
import { ETKI_DUZENI, etkiFormlariUret, etkiFormuKoduCoz } from '../../ogretmen/calismaKagidi/etkiFormu';
import { kagitMetinOzeti } from '../../ogretmen/calismaKagidi/arsiv';
import { trDuzlestir } from '../../ogretmen/calismaKagidi/sesMetni';
import { KisaCizgili, KagitSayfalari } from './KagitSayfalari';

const GECERLI = new Set(skillsData.filter((d) => d.durum === 'hazir').map((d) => d.id));

export function ArsivKagidi({ kod }: { kod: string }) {
  const etkiFormu = useMemo(() => etkiFormuKoduCoz(kod), [kod]);
  const istek = useMemo(() => (etkiFormu ? null : kagitKoduCoz(kod, GECERLI)), [kod, etkiFormu]);
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
  const plan = useMemo(
    () => (!tr ? null : etkiFormu ? etkiFormlariUret(tr)[etkiFormu] : istek ? kagitPlaniUret(istek, tr) : null),
    [istek, etkiFormu, tr],
  );
  const duzen = etkiFormu ? ETKI_DUZENI : istek?.duzen;
  const sayfaAyari = { cevapAnahtariDahil: !etkiFormu, adEtiketi: etkiFormu ? 'Ç-kodu:' : undefined } as const;

  const [kap, setKap] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const el = document.createElement('div');
    el.id = 'kagit-baski';
    el.className = 'kg-arsiv';
    document.body.appendChild(el);
    setKap(el);
    return () => el.remove();
  }, []);

  if (!duzen) {
    return (
      <main style={{ padding: 24, fontFamily: 'inherit' }}>
        <ArsivGezinme />
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
      <ArsivGezinme />
      <p role="status">
        {plan ? (
          <>
            Kâğıt kodu: <KisaCizgili metin={plan.kod} />
          </>
        ) : (
          'Kâğıt hazırlanıyor...'
        )}
      </p>
      {plan && <KagitSayfalari plan={plan} duzen={duzen} {...sayfaAyari} siyahBeyaz={false} kopya="onizleme" />}
      {kap &&
        plan &&
        createPortal(
          <KagitSayfalari plan={plan} duzen={duzen} {...sayfaAyari} siyahBeyaz={false} kopya="baski" />,
          kap,
        )}
    </main>
  );
}

/** Arşiv görünümünde uygulama kabuğu yok: profil değişkenleri yalnız bu kutuya uygulanır (KG-103). */
function ArsivGezinme() {
  const kutu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (kutu.current) applyProfile(resolveProfile(), kutu.current);
  }, []);
  const kok = (): void => window.location.assign(import.meta.env.BASE_URL ?? '/');
  return (
    <div ref={kutu} data-yazi="yetiskin" style={{ marginBottom: 16, marginLeft: 'calc(-1 * var(--size-edge, 24px))' }}>
      <GezinmeCubugu
        yon="yatay"
        hizala="bas"
        onGeri={() => (window.history.length > 1 ? window.history.back() : kok())}
        onAnaMenu={kok}
      />
    </div>
  );
}

export default ArsivKagidi;
