/**
 * DERİN TEMA GİRİŞİ (plan v2 Adım 45 aşama 2, KG-112) — tembel yüklenir.
 *
 * Temanın 4 adımlı kısa sesli girişi (`temaGirisleri.json`): anlatım + görsel; `dokun` adımında görsel alt
 * bölgede büyük bir karttır (tahtada alt %65, ≥ `--size-choice`), dokununca kısa övgü. Dokunulmazsa anlatım bir
 * kez tekrarlanır, sonra kendiliğinden ilerler (`temaGirisiAkisi.ts`). Uyaran (maskot, tema adı) üstte.
 * Yetişkin için küçük "Girişi geç" (üst köşe, `data-yetiskin`; "Seti bitir" gibi). Hiçbir şey saklanmaz.
 *
 * HİKÂYE AÇILIŞI (Adım 54 aşama 2, KG-116): adımlardan önce maskot kendini tanıtır ve temanın hikâyesinin 1. sahnesini
 * anlatır (`maskot.selam` + `hikaye.t<tema>-1`, maskot sesi). Sahne dokunulmaz (`HikayeSahnesi`); anlatım bitince
 * `HIKAYE_SONRASI_MS` sonra 1. adıma geçilir. "Girişi geç" burada da tüm girişi atlar.
 */
import { useCallback, useEffect, useReducer, useRef, useState, type RefObject } from 'react';
import { speech, randomPraise, type SpeakSource } from '../../audio/speech';
import type { TemaGirisiIcerigi } from '../../content/schema/temaGirisi';
import { temaGirisiIcerigi } from '../../content/temaGirisleri';
import { COLOR } from '../../design/tokens';
import { Maskot } from '../feedback/Maskot';
import { BigButton } from '../primitives/BigButton';
import { Visual } from '../svg/Visual';
import { GIRIS_BASLANGIC, girisIlerlet, OVGU_SONRASI_MS, type GirisDurumu, type GirisOlayi } from '../temaGirisiAkisi';
import { girisHikayesiSesi, HIKAYE_SONRASI_MS } from '../hikayeAkisi';
import HikayeSahnesi from './HikayeSahnesi';

/** Kapsayıcının iç ölçüsü (görsel SVG'si sabit piksel ister). */
function useOlcu(ref: RefObject<HTMLElement | null>): { w: number; h: number } {
  const [olcu, setOlcu] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const olc = () => setOlcu({ w: el.clientWidth, h: el.clientHeight });
    olc();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(olc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return olcu;
}

/** Tembel modül girişi: içerik JSON'u da bu parçayla yüklenir (ana pakete girmez). İçerik yoksa kısa geçiş. */
export default function DerinTemaGirisi({
  tema,
  temaAdi,
  renk,
  onBitti,
}: {
  tema: number;
  temaAdi: string;
  renk: string;
  onBitti: () => void;
}) {
  const icerik = temaGirisiIcerigi(tema);
  const hikayeSesi = girisHikayesiSesi(tema);
  const [hikayeBitti, setHikayeBitti] = useState(hikayeSesi === null);
  // "Girişi geç" ve doğal bitiş tek kez çıkar (hikâye açılışı ile adımlar arasında paylaşılır).
  const cikildi = useRef(false);
  const bitir = useCallback(() => {
    if (cikildi.current) return;
    cikildi.current = true;
    onBitti();
  }, [onBitti]);
  useEffect(() => {
    if (!icerik) bitir();
  }, [icerik, bitir]);
  if (!icerik) return null;
  if (!hikayeBitti && hikayeSesi) {
    return (
      <HikayeAcilisi
        tema={tema}
        temaAdi={temaAdi}
        renk={renk}
        ses={hikayeSesi}
        onDevam={() => setHikayeBitti(true)}
        onGec={bitir}
      />
    );
  }
  return <DerinGiris icerik={icerik} temaAdi={temaAdi} renk={renk} onBitti={bitir} />;
}

/** Hikâye açılışı: selam + 1. sahne, dokunulmaz sahne; anlatım bitince kısa bekleme, sonra adımlar. */
function HikayeAcilisi({
  tema,
  temaAdi,
  renk,
  ses,
  onDevam,
  onGec,
}: {
  tema: number;
  temaAdi: string;
  renk: string;
  ses: SpeakSource;
  onDevam: () => void;
  onGec: () => void;
}) {
  useEffect(() => {
    const ctrl = new AbortController();
    let zaman: number | undefined;
    void speech.speak(ses, { priority: 'high', signal: ctrl.signal, talimat: true }).then(() => {
      if (ctrl.signal.aborted) return;
      zaman = window.setTimeout(onDevam, HIKAYE_SONRASI_MS);
    });
    return () => {
      ctrl.abort();
      window.clearTimeout(zaman);
      speech.stop();
      speech.talimatiUnut();
    };
    // Yalnız açılışta bir kez (ses temadan türetilir).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tema]);

  return (
    <main
      data-ekran="tema-girisi-derin"
      data-giris-tema={tema}
      data-giris-asama="hikaye"
      aria-label={`Temaya giriş: ${temaAdi}`}
      style={{ height: '100%', position: 'relative', overflow: 'hidden', background: renk }}
    >
      <HikayeSahnesi tema={tema} sahneNo={1} />
      {/* Açık pastel sahne üstünde beyaz yazı okunmaz: yetişkin düğmesi koyu. */}
      <GirisiGec onGec={onGec} koyu />
    </main>
  );
}

/** Yetişkin: girişi geç (bilerek küçük ve soluk, üst köşede). */
function GirisiGec({ onGec, koyu = false }: { onGec: () => void; koyu?: boolean }) {
  return (
    <button
      type="button"
      data-yetiskin=""
      aria-label="Girişi geç"
      onClick={onGec}
      style={{
        position: 'absolute',
        top: 8,
        right: 8,
        minWidth: 44,
        minHeight: 44,
        padding: '0 12px',
        border: 'none',
        borderRadius: 8,
        background: 'transparent',
        color: koyu ? COLOR.ink : '#fff',
        opacity: 0.7,
        cursor: 'pointer',
        fontSize: 'var(--text-adult)',
        // Çocuk yüzeyinde Andika indirilmez (KG-96/98): yetişkin düğmesi de TemelYazi ile yazılır;
        // `data-yetiskin` yalnız erişim bölgesi/hedef boyutu muafiyeti için.
        fontFamily: 'var(--font-sans)',
        zIndex: 5,
      }}
    >
      Girişi geç
    </button>
  );
}

function DerinGiris({
  icerik,
  temaAdi,
  renk,
  onBitti,
}: {
  icerik: TemaGirisiIcerigi;
  temaAdi: string;
  renk: string;
  onBitti: () => void;
}) {
  const [d, gonder] = useReducer(
    (s: GirisDurumu, o: GirisOlayi) => girisIlerlet(s, o, icerik.adimlar),
    GIRIS_BASLANGIC,
  );
  const adim = icerik.adimlar[Math.min(d.adim, icerik.adimlar.length - 1)];
  const kutu = useRef<HTMLDivElement>(null);
  const { w, h } = useOlcu(kutu);

  // Bitince bir kez çıkılır.
  const bitirildi = useRef(false);
  useEffect(() => {
    if (d.bitti && !bitirildi.current) {
      bitirildi.current = true;
      onBitti();
    }
  }, [d.bitti, onBitti]);

  // Anlatım → bekleme (dokunulmadıysa). Adım ya da tekrar değişince yeniden; ekran değişince susar.
  useEffect(() => {
    if (d.bitti || d.dokunuldu) return;
    const ctrl = new AbortController();
    let zaman: number | undefined;
    void speech
      .speak({ kind: 'key', key: adim.ses }, { priority: 'high', signal: ctrl.signal, talimat: true })
      .then(() => {
        if (ctrl.signal.aborted) return;
        zaman = window.setTimeout(() => gonder({ tur: 'beklemeDoldu' }), adim.enUzunBeklemeMs);
      });
    return () => {
      ctrl.abort();
      window.clearTimeout(zaman);
      speech.stop();
      speech.talimatiUnut();
    };
  }, [d.adim, d.tekrar, d.dokunuldu, d.bitti, adim]);

  // Dokunuş → kısa övgü (adım kimliğinden deterministik) → sonraki adım.
  useEffect(() => {
    if (!d.dokunuldu) return;
    const ctrl = new AbortController();
    let zaman: number | undefined;
    void speech
      .speak(randomPraise(`giris:${icerik.tema}:${d.adim}`), { priority: 'high', signal: ctrl.signal })
      .then(() => {
        if (ctrl.signal.aborted) return;
        zaman = window.setTimeout(() => gonder({ tur: 'ovguBitti' }), OVGU_SONRASI_MS);
      });
    return () => {
      ctrl.abort();
      window.clearTimeout(zaman);
    };
  }, [d.dokunuldu, d.adim, icerik.tema]);

  const ic = Math.max(0, Math.min(w, h) - 24);
  const gorselW = Math.max(0, Math.min(w - 24, ic * 1.4));
  const gorsel = gorselW > 0 && ic > 0 ? <Visual spec={adim.gorsel} width={Math.round(gorselW)} height={Math.round(ic)} /> : null;

  return (
    <main
      data-ekran="tema-girisi-derin"
      data-giris-tema={icerik.tema}
      data-giris-adim={d.adim}
      data-giris-eylem={adim.eylem}
      aria-label={`Temaya giriş: ${temaAdi}`}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: renk,
        padding: 'var(--size-edge)',
        paddingBottom: 'var(--size-edge-bottom)',
        gap: 'var(--size-gap-tight)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Uyaran üstte: maskot ve tema adı (dokunulmaz). */}
      {/* Üst %35 (tahtada çocuğun erişemediği bölge) yalnız uyaran: dokunma hedefi alt %65'te başlar (plan v2 Adım 45 #6). */}
      <header
        style={{
          flex: '0 0 auto',
          height: 'calc(35% - var(--size-edge))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--size-gap)',
        }}
      >
        <Maskot durum={d.dokunuldu ? 'sevinmis' : 'konusuyor'} size={96} dokunulmaz />
        <div
          style={{
            fontSize: 'var(--text-ui)',
            color: '#fff',
            padding: '6px 20px',
            borderRadius: 16,
            background: 'rgba(0,0,0,0.2)',
          }}
        >
          {temaAdi}
        </div>
      </header>

      {/* Görsel / dokunma hedefi: alt bölge. */}
      <section
        style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      >
        <div
          ref={kutu}
          style={{
            width: 'min(100%, calc(820px * var(--scale)))',
            height: 'min(100%, calc(520px * var(--scale)))',
            minHeight: 'var(--size-choice)',
            display: 'flex',
          }}
        >
          {adim.eylem === 'dokun' ? (
            <div data-giris-hedef={adim.hedefAssetId} style={{ display: 'contents' }}>
              <BigButton
                label={`${temaAdi}: resme dokun`}
                size="choice"
                variant="solid"
                onPress={() => gonder({ tur: 'dokun' })}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 'calc(28px * var(--scale))',
                  background: COLOR.surface,
                  boxShadow: d.dokunuldu ? `0 0 0 calc(8px * var(--scale)) ${COLOR.mascot}` : undefined,
                }}
              >
                {gorsel}
              </BigButton>
            </div>
          ) : (
            <div
              aria-hidden="true"
              style={{
                width: '100%',
                height: '100%',
                display: 'grid',
                placeItems: 'center',
                borderRadius: 'calc(28px * var(--scale))',
                background: 'rgba(255,255,255,0.9)',
              }}
            >
              {gorsel}
            </div>
          )}
        </div>
      </section>

      {/* İlerleme noktaları (görsel, dokunulmaz; sınav algısı yok: sayı yok). */}
      <div aria-hidden="true" style={{ display: 'flex', gap: 10 }}>
        {icerik.adimlar.map((_, i) => (
          <span
            key={i}
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: i <= d.adim ? '#fff' : 'rgba(255,255,255,0.4)',
            }}
          />
        ))}
      </div>

      {/* Yetişkin: girişi geç (bilerek küçük ve soluk, üst köşede). */}
      <GirisiGec
        onGec={() => {
          if (bitirildi.current) return;
          bitirildi.current = true;
          onBitti();
        }}
      />
    </main>
  );
}
