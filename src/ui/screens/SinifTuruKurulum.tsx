/**
 * SINIF TURU KURULUMU — öğretmen ekranı (plan v2 Adım 36 aşama 2b, ADR-0008).
 *
 * Takım sayısı (2–4), takım renkleri (`RENKLER`), soru kaynağı (bugünün seti veya bir tema) ve
 * kavanoz büyüklüğü seçilir. Takım ADI ve öğrenci adı girişi YOKTUR. Seçimler yalnız bu ekranın
 * belleğindedir. Tahtada açıldığı için dokunulabilir her öğe alt %65'te ve tahta hedef boyutunda.
 */
import { useMemo, useState, type CSSProperties } from 'react';
import { TEMALAR, useAppStore } from '../../store/appStore';
import { BigButton } from '../primitives/BigButton';
import { COLOR } from '../../design/tokens';
import { skillsData } from '../../content/skillsData';
import { REGISTRY } from '../../exercises/registry';
import { hash32 } from '../../exercises/rng';
import { RENKLER, type Renk } from '../../exercises/types';
import {
  SET_EN_FAZLA_DUGUM,
  SET_SURUMU,
  setKodla,
  setlenebilirDugumler,
  type GunlukSet,
} from '../../ogretmen/gunlukSet';
import { TAKIM_SAYISI_ARALIGI } from '../../sinif/sinifTuru';
import { KAVANOZ_BOYUTLARI, takimKimligi, varsayilanRenkler } from '../../sinif/takim';

const KAYITLI = (t: string): boolean => REGISTRY.has(t);
const TAKIM_SAYILARI = Array.from(
  { length: TAKIM_SAYISI_ARALIGI[1] - TAKIM_SAYISI_ARALIGI[0] + 1 },
  (_, i) => TAKIM_SAYISI_ARALIGI[0] + i,
);

type Kaynak = { tur: 'set' } | { tur: 'tema'; no: number };

const satir: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 'var(--size-gap-tight)', alignItems: 'center' };
const satirEtiketi: CSSProperties = { fontSize: 'var(--text-adult)', color: COLOR.inkSoft, minWidth: 140, margin: 0 };

export function SinifTuruKurulum() {
  const baslat = useAppStore((s) => s.sinifTuruBaslat);
  const hazirSet = useAppStore((s) => s.aktifSet ?? s.kagitSeti);

  const uygun = useMemo(() => setlenebilirDugumler(KAYITLI), []);
  const temalar = useMemo(
    () => TEMALAR.filter((t) => skillsData.some((d) => d.tema === t.no && uygun.has(d.id))),
    [uygun],
  );

  const [takimSayisi, setTakimSayisi] = useState<number>(3);
  const [renkler, setRenkler] = useState<readonly Renk[]>(varsayilanRenkler(3));
  const [kaynak, setKaynak] = useState<Kaynak>(hazirSet ? { tur: 'set' } : { tur: 'tema', no: temalar[0]?.no ?? 1 });
  const [boyut, setBoyut] = useState<number>(1);

  const sayiSec = (n: number) => {
    setTakimSayisi(n);
    setRenkler(varsayilanRenkler(n));
  };
  const renkDegistir = (r: Renk) => {
    if (renkler.includes(r)) setRenkler(renkler.filter((x) => x !== r));
    else if (renkler.length < takimSayisi) setRenkler([...renkler, r]);
  };
  const hazir = renkler.length === takimSayisi;

  const kaynakSeti = (): GunlukSet | null => {
    if (kaynak.tur === 'set') return hazirSet;
    const dugumler = skillsData
      .filter((d) => d.tema === kaynak.no && uygun.has(d.id))
      .slice(0, SET_EN_FAZLA_DUGUM)
      .map((d) => d.id);
    if (dugumler.length === 0) return null;
    const taslak = { surum: SET_SURUMU, dugumler, tohum: 0 };
    // Tohum UI katmanında: saf modüllerde saat/rastgelelik yok.
    return { ...taslak, tohum: hash32(String(performance.now()) + setKodla(taslak)) };
  };

  const basla = () => {
    const set = kaynakSeti();
    if (!hazir || !set) return;
    baslat(renkler, set, KAVANOZ_BOYUTLARI[boyut].turPerTakim);
  };

  return (
    <main
      aria-labelledby="sinif-turu-kurulum-baslik"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: COLOR.bg,
        padding: 'var(--size-edge)',
        paddingBottom: 'var(--size-edge-bottom)',
        gap: 'var(--size-gap-tight)',
        overflow: 'hidden',
      }}
    >
      {/* Üst bölge: yalnız bilgi. */}
      <header style={{ flex: '0 0 26%', display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
        <h1 id="sinif-turu-kurulum-baslik" style={{ fontSize: 'var(--text-adult)', color: COLOR.ink, margin: 0 }}>
          Sınıf Turu
        </h1>
        <p style={{ fontSize: 'var(--text-adult)', color: COLOR.inkSoft, margin: 0 }}>
          Takımlar sırayla soru çözer; her tamamlanan tur sınıf kavanozuna bir yaprak ekler. Kazanan, puan ve süre yok.
          Takımlar yalnız renkle anılır; hiçbir şey kaydedilmez.
        </p>
        <p role="status" aria-live="polite" style={{ fontSize: 'var(--text-adult)', color: COLOR.ink, margin: 0 }}>
          {hazir ? 'Hazır.' : `${takimSayisi} renk seç (${renkler.length} seçildi).`}
        </p>
      </header>

      <section
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--size-gap-tight)',
          // Küçük pencerede (ör. 1080×810'da zorlanmış tahta profili) kaydırılabilir; büyükte alta yaslanır.
          overflowY: 'auto',
        }}
      >
        <div role="group" aria-label="Takım sayısı" style={{ ...satir, marginTop: 'auto' }}>
          <p style={satirEtiketi}>Takım sayısı</p>
          {TAKIM_SAYILARI.map((n) => (
            <BigButton
              key={n}
              label={`${n} takım`}
              size="tapMin"
              ariaPressed={n === takimSayisi}
              onPress={() => sayiSec(n)}
              style={{
                padding: '0 18px',
                fontSize: 'var(--text-adult)',
                fontWeight: 700,
                border: `3px solid ${n === takimSayisi ? COLOR.ink : 'transparent'}`,
              }}
            >
              {n} takım
            </BigButton>
          ))}
          <p style={{ ...satirEtiketi, minWidth: 0, marginLeft: 16 }}>Kavanoz</p>
          {KAVANOZ_BOYUTLARI.map((k, i) => (
            <BigButton
              key={k.ad}
              label={k.ad}
              size="tapMin"
              ariaPressed={i === boyut}
              onPress={() => setBoyut(i)}
              style={{
                padding: '0 18px',
                fontSize: 'var(--text-adult)',
                fontWeight: 700,
                border: `3px solid ${i === boyut ? COLOR.ink : 'transparent'}`,
              }}
            >
              {k.ad}
            </BigButton>
          ))}
        </div>

        <div role="group" aria-label="Takım renkleri" style={satir}>
          <p style={satirEtiketi}>Renkler</p>
          {RENKLER.map((r) => {
            const k = takimKimligi(r);
            const secili = renkler.includes(r);
            return (
              <BigButton
                key={r}
                label={k.etiket}
                size="tapMin"
                ariaPressed={secili}
                onPress={() => renkDegistir(r)}
                style={{
                  padding: '0 14px',
                  gap: 8,
                  fontSize: 'var(--text-adult)',
                  fontWeight: 700,
                  background: secili ? k.hex : COLOR.surface,
                  color: secili ? '#fff' : COLOR.ink,
                  border: `3px solid ${k.hex}`,
                }}
              >
                <span aria-hidden="true" style={{ fontSize: 32 }}>
                  {k.hayvan}
                </span>
                {secili ? '✓' : ''}
              </BigButton>
            );
          })}
        </div>

        <div role="group" aria-label="Sorular" style={satir}>
          <p style={satirEtiketi}>Sorular</p>
          {hazirSet && (
            <BigButton
              label="Bugünün seti"
              size="tapMin"
              ariaPressed={kaynak.tur === 'set'}
              onPress={() => setKaynak({ tur: 'set' })}
              style={{
                padding: '0 14px',
                fontSize: 'var(--text-adult)',
                fontWeight: 700,
                border: `3px solid ${kaynak.tur === 'set' ? COLOR.ink : 'transparent'}`,
              }}
            >
              Bugünün seti
            </BigButton>
          )}
          {temalar.map((t) => {
            const secili = kaynak.tur === 'tema' && kaynak.no === t.no;
            return (
              <BigButton
                key={t.no}
                label={t.ad}
                size="tapMin"
                ariaPressed={secili}
                onPress={() => setKaynak({ tur: 'tema', no: t.no })}
                style={{
                  padding: '0 14px',
                  fontSize: 'var(--text-adult)',
                  fontWeight: 700,
                  background: secili ? t.renk : undefined,
                  color: secili ? '#fff' : undefined,
                }}
              >
                {t.ad}
              </BigButton>
            );
          })}
        </div>

        <footer style={{ display: 'flex', gap: 'var(--size-gap-tight)', alignItems: 'center' }}>
          {/* Geri / Ana menü: ortak gezinme rayı (KG-103). */}
          <BigButton
            label="Sınıf Turunu başlat"
            size="tapMin"
            variant="accent"
            disabled={!hazir}
            onBlockedPress={() => undefined}
            onPress={basla}
            style={{ padding: '0 32px', fontWeight: 700 }}
          >
            Sınıf Turunu başlat
          </BigButton>
        </footer>
      </section>
    </main>
  );
}
