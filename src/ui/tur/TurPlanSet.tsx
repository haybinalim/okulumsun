/**
 * HAFTALIK SES PLANI ve SET HAZIRLA (Okuma Yazma Adım 71 aşama 2; §2.4.11 madde 4–5). YALNIZ `VITE_DERS_TUR=1` derlemesinde.
 *
 *  · Haftalık ses planı: Şekil 1 süreleri + okul takvimi; tatil, hazırlık, hatırlatma ve "dönemin son haftası yeni ses
 *    yok" kuralı. Yalnız öneri: "Bu haftayı uygula" bugünkü sesi tek dokunuşla planın o haftasına getirir, başka hiçbir şey
 *    değişmez.
 *  · Set hazırla: öğretilen kümeyle 6 adımlık set, destek / sınıf / zenginleştirme düzeyi; Başlat → etkinlikler sırayla.
 * Yetişkin yüzeyi (Andika); set akışındaki etkinlik ekranları çocuk yüzeyi (TemelYazi). Ses yok; hiçbir şey saklanmaz.
 */
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { resmiKume } from '../../content/dersler/tur/ogretilenKume';
import { haftaAraligi, haftaBul, haftalikSesPlani, sonOnerilenSes, type SesHaftasi } from '../../content/dersler/tur/sesPlani';
import { DUZEY_ACIKLAMASI, DUZEY_ADI, SET_DUZEYLERI, turSetiKur, type SetAdimi, type SetDuzeyi } from '../../content/dersler/tur/turSet';
import { TUR_SABLONLARI } from '../../content/dersler/tur/sablonlar';
import { BigButton } from '../primitives/BigButton';
import { turEkraniAc, type TurEkrani } from './turEkrani';
import { turKumeYaz, useTurKume } from './turKume';
import { useTurHavuzu } from './useTurHavuzu';
import { Baslik, ekranStili } from './turOrtak';
import { bugunkuSes, sikDugme } from './ogretmenOrtak';
import { TurEtkinlikEkrani } from './TurEtkinlikEkrani';

const TUR_ADI: Readonly<Record<SesHaftasi['tur'], string>> = {
  hazirlik: 'Hazırlık haftası',
  ses: '',
  pekistirme: 'Pekiştirme: yeni ses yok',
  hatirlatma: 'Hatırlatma haftası: yeni ses yok',
  tatil: 'Tatil',
  bagimsiz: 'Bağımsız okuma yazma',
};

/** Yerel takvim günü `YYYY-MM-DD` (saat ölçülmez; yalnız bu haftayı işaretlemek için). */
function bugun(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function SesPlani({ gun = bugun() }: { gun?: string }) {
  const plan = useMemo(haftalikSesPlani, []);
  const kume = useTurKume();
  const buHafta = haftaBul(plan, gun);
  const liste = useRef<HTMLOListElement>(null);
  // Harfler bitince ilk bağımsız okuma haftasından sonrası tek satırda özetlenir (son hafta pekiştirme ayrıca).
  const ilkBagimsiz = plan.findIndex((h) => h.tur === 'bagimsiz');
  const gorunen = plan.filter((h, i) => h.tur !== 'bagimsiz' || i === ilkBagimsiz);
  useLayoutEffect(() => {
    liste.current?.querySelector('[data-bu-hafta]')?.scrollIntoView({ block: 'center' });
  }, []);
  const oneri = buHafta ? sonOnerilenSes(plan, buHafta.pazartesi) : null;
  const ses = bugunkuSes(kume);
  return (
    <main data-yetiskin="" aria-label="Haftalık ses planı" style={{ ...ekranStili, justifyContent: 'flex-start', gap: 'var(--size-gap-tight)' }}>
      <Baslik
        baslik="Haftalık ses planı"
        alt="Öneri: program süreleri ve okul takvimi. Dönemin son haftası yeni ses verilmez. Sınıfınıza göre değiştirin."
      />
      <div style={{ display: 'flex', gap: '0.6em', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', fontSize: 'var(--text-adult)' }}>
        <span>
          Bugünkü ses: <strong data-glif={ses}>{ses}</strong>
          {oneri && oneri !== ses ? `, plana göre: ${oneri}` : ''}
        </span>
        {oneri && oneri !== ses && (
          <BigButton label={`Bu haftayı uygula: ${oneri}`} data-yetiskin="" variant="accent" style={sikDugme} onPress={() => turKumeYaz(resmiKume(oneri, false))}>
            <span>Bu haftayı uygula ({oneri})</span>
          </BigButton>
        )}
      </div>
      <ol
        ref={liste}
        aria-label="Haftalar"
        style={{
          margin: 0,
          padding: '0 0.5em',
          listStyle: 'none',
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          width: '100%',
          maxWidth: '48em',
          fontSize: 'var(--text-adult)',
        }}
      >
        {gorunen.map((h) => {
          const bu = buHafta?.pazartesi === h.pazartesi;
          const ozet = h.tur === 'bagimsiz' ? `${haftaAraligi(h.pazartesi).split(/ ?\u2013/)[0]} ve sonrası` : haftaAraligi(h.pazartesi);
          return (
            <li
              key={h.pazartesi}
              data-hafta={h.pazartesi}
              data-hafta-turu={h.tur}
              data-bu-hafta={bu ? '' : undefined}
              data-sesler={h.yeniSesler.join('')}
              aria-current={bu ? 'date' : undefined}
              style={{
                display: 'flex',
                gap: '0.6em',
                alignItems: 'baseline',
                padding: '0.2em 0.4em',
                borderRadius: 8,
                background: bu ? 'var(--color-accent-soft, #EFE7FF)' : undefined,
                outline: bu ? '2px solid var(--color-accent)' : undefined,
                color: h.tur === 'tatil' ? 'var(--color-ink-soft, #6B6B6B)' : undefined,
              }}
            >
              <span style={{ flex: '0 0 8.5em' }}>{ozet}</span>
              <span style={{ flex: '0 0 3.5em', fontWeight: 700, letterSpacing: '0.15em' }}>{h.yeniSesler.join(' ')}</span>
              <span style={{ flex: '1 1 auto', minWidth: 0 }}>
                {[h.grup ? `${h.grup}. grup` : TUR_ADI[h.tur], h.not].filter(Boolean).join(', ')}
                {bu ? ', bu hafta' : ''}
              </span>
            </li>
          );
        })}
      </ol>
    </main>
  );
}

let sonDuzey: SetDuzeyi = 'sinif';
let sonTohum = 1;

export function SetHazirla({ ekAraclar }: { ekAraclar?: (duzey: SetDuzeyi, tohum: number) => ReactNode }) {
  const kume = useTurKume();
  const h = useTurHavuzu();
  const [duzey, setDuzey] = useState(sonDuzey);
  const [tohum, setTohum] = useState(sonTohum);
  const set = useMemo(() => (h.durum === 'hazir' ? turSetiKur({ havuz: h.havuz, kume, duzey, tohum }) : null), [h, kume, duzey, tohum]);
  const sec = (d: SetDuzeyi) => {
    sonDuzey = d;
    setDuzey(d);
  };
  const ses = bugunkuSes(kume);
  return (
    <main data-yetiskin="" aria-label="Set hazırla" style={{ ...ekranStili, justifyContent: 'flex-start', gap: 'var(--size-gap-tight)' }}>
      <Baslik baslik={`Set hazırla: ${ses}`} alt="Öğretilen harflerle 6 etkinlik. Set saklanmaz." />
      <div role="group" aria-label="Düzey" style={{ display: 'flex', gap: '0.4em', flexWrap: 'wrap', justifyContent: 'center' }}>
        {SET_DUZEYLERI.map((d) => (
          <BigButton
            key={d}
            label={DUZEY_ADI[d]}
            data-yetiskin=""
            ariaPressed={duzey === d}
            variant={duzey === d ? 'accent' : 'solid'}
            style={sikDugme}
            onPress={() => sec(d)}
          >
            <span>{DUZEY_ADI[d]}</span>
          </BigButton>
        ))}
      </div>
      <p style={{ margin: 0, fontSize: 'var(--text-adult)', textAlign: 'center' }}>{DUZEY_ACIKLAMASI[duzey]}</p>
      {!set ? (
        <p data-yetiskin="" style={{ fontSize: 'var(--text-adult)' }}>
          {h.durum === 'hata' ? `Sözcük havuzu açılamadı: ${h.mesaj}` : 'Yükleniyor'}
        </p>
      ) : (
        <>
          <ol
            aria-label="Setteki etkinlikler"
            data-set-adimlari={set.adimlar.map((a) => `${a.sablon}/${a.zorluk}`).join(',')}
            style={{ margin: 0, paddingLeft: '1.6em', fontSize: 'var(--text-adult)', columns: 2, columnGap: '2em' }}
          >
            {set.adimlar.map((a, i) => (
              <li key={i}>
                {TUR_SABLONLARI[a.sablon].ad} <span style={{ color: 'var(--color-ink-soft, #6B6B6B)', fontSize: '0.8em', whiteSpace: 'nowrap' }}>(zorluk {a.zorluk})</span>
              </li>
            ))}
          </ol>
          {set.atlanan.length > 0 && (
            <p role="status" style={{ margin: 0, fontSize: 'var(--text-adult)', color: 'var(--color-ink-soft, #6B6B6B)', textAlign: 'center' }}>
              Bu harflerle kurulamadığı için atlandı: {[...new Set(set.atlanan.map((a) => TUR_SABLONLARI[a.sablon].ad))].join(', ')}.
            </p>
          )}
          <div style={{ display: 'flex', gap: '0.5em', flexWrap: 'wrap', justifyContent: 'center' }}>
            <BigButton
              label="Seti başlat"
              data-yetiskin=""
              variant="accent"
              disabled={set.adimlar.length === 0}
              onBlockedPress={() => undefined}
              style={sikDugme}
              onPress={() => turEkraniAc({ ekran: 'set', adimlar: set.adimlar, sira: 0, geri: { ekran: 'setHazirla' } })}
            >
              <span>Başlat</span>
            </BigButton>
            <BigButton
              label="Yeni set"
              data-yetiskin=""
              style={sikDugme}
              onPress={() => {
                sonTohum = (tohum % 999) + 1;
                setTohum(sonTohum);
              }}
            >
              <span>Yeni set</span>
            </BigButton>
            {ekAraclar?.(duzey, tohum)}
          </div>
        </>
      )}
    </main>
  );
}

/** Set akışı: adımlar sırayla; son adımdan sonra set sonu. Etkinliklerin Geri'si `geri` ekranına döner. */
export function SetAkisi({ adimlar, sira, geri }: { adimlar: readonly SetAdimi[]; sira: number; geri: TurEkrani }) {
  const a = adimlar[sira];
  if (!a) return <SetSonu adimlar={adimlar} geri={geri} />;
  return (
    <div data-set-sira={`${sira + 1}/${adimlar.length}`} style={{ height: '100%' }}>
      <TurEtkinlikEkrani
        key={sira}
        sablon={a.sablon}
        zorluk={a.zorluk}
        tohum={a.tohum}
        geri={geri}
        onSonraki={() => turEkraniAc({ ekran: 'set', adimlar, sira: sira + 1, geri })}
      />
    </div>
  );
}

function SetSonu({ adimlar, geri }: { adimlar: readonly SetAdimi[]; geri: TurEkrani }) {
  return (
    <main data-yetiskin="" aria-label="Set bitti" data-set-bitti="" style={{ ...ekranStili, justifyContent: 'center' }}>
      <Baslik baslik="Set bitti" alt={`${adimlar.length} etkinlik tamamlandı.`} />
      <div style={{ display: 'flex', gap: '0.5em', flexWrap: 'wrap', justifyContent: 'center' }}>
        <BigButton label="Baştan" data-yetiskin="" style={sikDugme} onPress={() => turEkraniAc({ ekran: 'set', adimlar, sira: 0, geri })}>
          <span>Baştan</span>
        </BigButton>
        <BigButton label="Bitir" data-yetiskin="" variant="accent" style={sikDugme} onPress={() => turEkraniAc(geri)}>
          <span>Bitir</span>
        </BigButton>
      </div>
    </main>
  );
}
