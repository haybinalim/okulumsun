/**
 * SINIF TURU EKRANI — tahtada sıra tabanlı iş birlikçi oyun (plan v2 Adım 36 aşama 2b, ADR-0008).
 *
 * Üst %12: sınıf kavanozu + takım şeritleri (dokunulmaz; yıldızlar simge, sayı yazılmaz).
 * Altı: aşamaya göre sıra duyurusu, gömülü `ExerciseScreen` veya tur kutlaması.
 * Kurallar (sinifTuru.ts + takim.ts): yanlışta aynı takım tekrar dener; ikinci yanlışta maskot
 * "hep birlikte" der ve tur birlikte çözülmüş sayılır. Öğretmen her an "Bitir" (ikinci dokunuşta onay).
 * Durum yalnız `appStore.sinifTuru` belleğinde; puan, skor, süre ve kazanan yoktur.
 */
import { useVurgu } from '../../design/useVurgu';
import type { Vurgu } from '../../design/tokens';
import { useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { BigButton } from '../primitives/BigButton';
import { Maskot } from '../feedback/Maskot';
import { YonlendirmeSeridi } from '../feedback/YonlendirmeSeridi';
import { ExerciseScreen } from './ExerciseScreen';
import { SinifKavanozu } from '../svg/SinifKavanozu';
import { COLOR, SIZE } from '../../design/tokens';
import { useScreenSpeech, speak } from '../../audio/useSpeak';
import { REGISTRY } from '../../exercises/registry';
import { setSorusuUret } from '../../ogretmen/tahtaSorusu';
import { sinifTuruSorusu, type SinifTuruDurumu } from '../../sinif/sinifTuru';
import { BIRLIKTE_COZME_ESIGI, HEP_BIRLIKTE_METNI, renkAdi, siraDuyurusuSesi, takimKimligi, turSonucu } from '../../sinif/takim';
import { basitMaddeSonucu, yanlisBilgisiBirlestir, type YanlisBilgisi } from '../../progress/basitMaddeSonucu';
import type { MaddeSonuc } from '../../progress/itemLifecycle';
import { useDersOturumu } from '../useDersOturumu';
import { dersOlayiUret } from '../../ogretmen/dersOzeti';

const KAYITLI = (t: string): boolean => REGISTRY.has(t);

export function SinifTuruEkrani() {
  const d = useAppStore((s) => s.sinifTuru);
  if (!d) return null;
  return <SinifTuruIcerik d={d} />;
}

function SinifTuruIcerik({ d }: { d: SinifTuruDurumu }) {
  const olay = useAppStore((s) => s.sinifTuruOlay);
  const accent = useVurgu();
  const [bitirOnayi, setBitirOnayi] = useState(false);
  const takim = takimKimligi(d.takimlar[d.siradaki].renk);

  return (
    <main
      aria-label="Sınıf Turu"
      data-asama={d.asama}
      style={{ height: '100%', display: 'flex', flexDirection: 'column', background: COLOR.bg, overflow: 'hidden' }}
    >
      {/* Üst %12: kavanoz + takım şeritleri (dokunulmaz) + öğretmen çıkışı (yetişkin, çocuk erişimi dışında). */}
      <header
        style={{
          flex: '0 0 12%',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--size-gap-tight)',
          padding: '0 var(--size-edge)',
          borderBottom: `2px solid ${COLOR.border}`,
          minHeight: 0,
        }}
      >
        <SinifKavanozu kavanoz={d.kavanoz} hedef={d.kavanozHedefi} boyut={88} />
        <ul
          aria-label="Takımlar"
          style={{ display: 'flex', gap: 12, listStyle: 'none', margin: 0, padding: 0, flex: 1, minWidth: 0 }}
        >
          {d.takimlar.map((t, i) => {
            const k = takimKimligi(t.renk);
            const sirada = i === d.siradaki && d.asama !== 'bitti';
            return (
              <li
                key={t.renk}
                aria-label={sirada ? `${k.etiket}, sırada` : k.etiket}
                aria-current={sirada ? 'true' : undefined}
                data-takim={t.renk}
                data-yildiz={t.yildiz}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 999,
                  background: k.hex,
                  color: '#fff',
                  outline: sirada ? `5px solid ${COLOR.ink}` : 'none',
                  outlineOffset: 2,
                  minHeight: 56,
                  overflow: 'hidden',
                }}
              >
                <span aria-hidden="true" style={{ fontSize: 34 }}>
                  {k.hayvan}
                </span>
                <span aria-hidden="true" style={{ fontSize: 26, letterSpacing: 1 }}>
                  {'★'.repeat(t.yildiz)}
                </span>
              </li>
            );
          })}
        </ul>
        <div data-yetiskin="" style={{ flex: '0 0 auto' }}>
          <BigButton
            label={bitirOnayi ? 'Emin misiniz? Turu bitir' : 'Bitir'}
            size="tapMin"
            variant="ghost"
            onPress={() => (bitirOnayi ? olay({ tur: 'ogretmenBitirdi' }) : setBitirOnayi(true))}
            style={{ padding: '0 18px', fontSize: 'var(--text-adult)', color: COLOR.inkSoft }}
          >
            {bitirOnayi ? 'Emin misiniz? Turu bitir' : 'Bitir'}
          </BigButton>
        </div>
      </header>

      <section style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {d.asama === 'siraDuyurusu' && (
          <SiraDuyurusu key={`duyuru-${d.turNo}`} d={d} onHazir={() => olay({ tur: 'duyuruBitti' })} />
        )}
        {d.asama === 'soru' && (
          <TurSorusu
            key={`soru-${d.turNo}`}
            d={d}
            accentHex={accent}
            onKapandi={(sonuc, skillId) => {
              // Adım 40 aşama 3: Sınıf Turu maddeleri de ders sonu özetine girer (yalnız bellekte).
              useDersOturumu.getState().kaydet(dersOlayiUret(skillId, sonuc, false));
              olay({ tur: 'maddeKapandi', sonuc, skillId });
            }}
          />
        )}
        {d.asama === 'kutlama' && (
          <TurKutlamasi
            key={`kutlama-${d.turNo}`}
            renkAdi={renkAdi(takim.renk)}
            hex={takim.hex}
            hayvan={takim.hayvan}
            onDevam={() => olay({ tur: 'kutlamaBitti' })}
          />
        )}
      </section>
    </main>
  );
}

function SiraDuyurusu({ d, onHazir }: { d: SinifTuruDurumu; onHazir: () => void }) {
  const renk = d.takimlar[d.siradaki].renk;
  const k = takimKimligi(renk);
  // Ses kanalı: tam cümle "Sıra mor takımda." (ilk turda "Sınıf turu başlıyor!", son turda "Bu son tur." önce).
  useScreenSpeech(siraDuyurusuSesi(d), [d.turNo], { kind: 'key', key: k.ses });
  const metin = `Sıra ${renkAdi(renk)} takımda.`;
  return (
    <div
      data-sira={renk}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 'var(--size-gap)',
        padding: 'var(--size-edge)',
        paddingBottom: 'var(--size-edge-bottom)',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 'min(28vh, 260px)',
          height: 'min(28vh, 260px)',
          borderRadius: '50%',
          background: k.hex,
          display: 'grid',
          placeItems: 'center',
          fontSize: 'min(16vh, 150px)',
          boxShadow: `0 0 0 10px ${COLOR.surface}, 0 0 0 16px ${k.hex}`,
        }}
      >
        {k.hayvan}
      </div>
      <h2 style={{ margin: 0, fontSize: 'var(--text-prompt, 40px)', color: COLOR.ink }}>{metin}</h2>
      <BigButton
        label="Hazırız"
        size="primary"
        variant="accent"
        onPress={onHazir}
        style={{ padding: '0 40px', background: k.hex, color: '#fff', fontWeight: 800, fontSize: 32 }}
      >
        Hazırız
      </BigButton>
    </div>
  );
}

function TurSorusu({
  d,
  accentHex,
  onKapandi,
}: {
  d: SinifTuruDurumu;
  accentHex: Vurgu;
  onKapandi: (sonuc: MaddeSonuc, skillId: SinifTuruDurumu['kaynak']['dugumler'][number]) => void;
}) {
  const soru = useMemo(() => sinifTuruSorusu(d, KAYITLI), [d]);
  const exercise = useMemo(() => setSorusuUret(soru), [soru]);
  const [yanlis, setYanlis] = useState(0);
  const yanlisRef = useRef(0);
  const baslangic = useRef(Date.now());
  const kapandi = useRef(false);
  const birlikte = yanlis >= BIRLIKTE_COZME_ESIGI;

  const kapat = (sonuc: MaddeSonuc, birlikteMi: boolean) => {
    if (kapandi.current) return;
    kapandi.current = true;
    onKapandi(
      turSonucu(sonuc, yanlisRef.current, birlikteMi || yanlisRef.current >= BIRLIKTE_COZME_ESIGI),
      soru.skillId,
    );
  };

  // "Birlikte çözdük" ekranın biriktirdiği tanı/kademeyi kaybetmesin (Adım 40 aşama 3).
  const yanlisBilgisi = useRef<YanlisBilgisi | null>(null);
  const yanlisOldu = (bilgi: YanlisBilgisi) => {
    yanlisBilgisi.current = yanlisBilgisiBirlestir(yanlisBilgisi.current, bilgi);
    yanlisRef.current += 1;
    // İkinci yanlış: maskot "Hep birlikte çözelim." der (şeritteki cümleyle aynı, KG-110).
    if (yanlisRef.current === BIRLIKTE_COZME_ESIGI) void speak({ kind: 'key', key: 'sinifturu.hep-birlikte' });
    setYanlis(yanlisRef.current);
  };

  return (
    <div data-yanlis={yanlis} style={{ height: '100%', position: 'relative' }}>
      <ExerciseScreen
        exercise={exercise}
        accent={accentHex}
        onYanlis={yanlisOldu}
        onDone={(sonuc) => kapat(sonuc, false)}
      />
      {birlikte && (
        <>
          {/* Dokunulmaz bilgi şeridi: sınıf soruyu birlikte çözer; çözülünce tur birlikte tamamlanmış sayılır. */}
          <div
            role="status"
            aria-live="polite"
            style={{
              position: 'absolute',
              top: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              pointerEvents: 'none',
              background: COLOR.surface,
              border: `3px solid ${COLOR.mascot}`,
              borderRadius: 20,
              padding: '6px 18px',
              zIndex: 4,
            }}
          >
            <span aria-hidden="true" style={{ fontSize: 44 }}>
              🤝
            </span>
            <span style={{ fontSize: 28, fontWeight: 800, color: COLOR.ink }}>{HEP_BIRLIKTE_METNI}</span>
          </div>
          <div data-yetiskin="" style={{ position: 'absolute', top: 8, right: 8, zIndex: 5 }}>
            <BigButton
              label="Birlikte çözdük"
              size="tapMin"
              variant="ghost"
              onPress={() => kapat(basitMaddeSonucu(false, baslangic.current, Date.now(), yanlisBilgisi.current), true)}
              style={{ padding: '0 18px', fontSize: 'var(--text-adult)', color: COLOR.inkSoft }}
            >
              Birlikte çözdük
            </BigButton>
          </div>
        </>
      )}
    </div>
  );
}

function TurKutlamasi({
  renkAdi: ad,
  hex,
  hayvan,
  onDevam,
}: {
  renkAdi: string;
  hex: string;
  hayvan: string;
  onDevam: () => void;
}) {
  useScreenSpeech({ kind: 'key', key: 'geri.dogru-1' }, []);
  return (
    <div
      data-kutlama=""
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 'var(--size-gap)',
        padding: 'var(--size-edge)',
        paddingBottom: 'var(--size-edge-bottom)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--size-gap)' }}>
        <Maskot durum="sevinmis" size={SIZE.mascot} />
        <span aria-hidden="true" style={{ fontSize: 120, lineHeight: 1 }}>
          {hayvan}
        </span>
        <span aria-hidden="true" style={{ fontSize: 120, lineHeight: 1, color: hex }}>
          ★
        </span>
      </div>
      <YonlendirmeSeridi
        metin={`Kavanoza bir yaprak! ${ad.charAt(0).toLocaleUpperCase('tr')}${ad.slice(1)} takım bir yıldız aldı.`}
      />
      <BigButton
        label="Devam"
        size="primary"
        variant="accent"
        onPress={onDevam}
        style={{ padding: '0 40px', fontWeight: 800, fontSize: 32 }}
      >
        Devam
      </BigButton>
    </div>
  );
}
