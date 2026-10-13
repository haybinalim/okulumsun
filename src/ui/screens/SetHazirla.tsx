/**
 * SET HAZIRLA — "Bugünün seti" (plan v2 Adım 34, tahta/öğretmen).
 *
 * Öğretmen 1–4 hazır beceri düğümünü (farklı temalardan da) seçer ve "Tahtada başlat"a dokunur.
 * Yetişkin ekranıdır ama tahtada açılacağı için TÜM dokunulabilir öğeler alt %65'te ve
 * tahta hedef boyutundadır; üst %35'te yalnız dokunulmaz bilgi (başlık, seçili düğüm çipleri) durur.
 * Set yalnız bellekte tutulur (appStore.aktifSet); hiçbir şey depolanmaz.
 */
import { useMemo, useState } from 'react';
import { TEMALAR, useAppStore } from '../../store/appStore';
import { BigButton } from '../primitives/BigButton';
import { COLOR } from '../../design/tokens';
import { skillsData } from '../../content/skillsData';
import { REGISTRY } from '../../exercises/registry';
import { hash32 } from '../../exercises/rng';
import { SET_EN_FAZLA_DUGUM, SET_SURUMU, setKodla, setlenebilirDugumler } from '../../ogretmen/gunlukSet';
import type { SkillId } from '../../exercises/types';

const KAYITLI = (t: string): boolean => REGISTRY.has(t);

export function SetHazirla() {
  const ekranGit = useAppStore((s) => s.ekranGit);
  const setBaslat = useAppStore((s) => s.setBaslat);
  const [temaNo, setTemaNo] = useState<number>(TEMALAR[0].no);
  const [secili, setSecili] = useState<readonly SkillId[]>([]);
  const [dolu, setDolu] = useState(false);

  const uygun = useMemo(() => setlenebilirDugumler(KAYITLI), []);
  const dugumler = useMemo(
    () => skillsData.filter((d) => d.tema === temaNo && uygun.has(d.id)),
    [temaNo, uygun],
  );
  const etiket = (id: SkillId): string => skillsData.find((d) => d.id === id)?.childLabel ?? id;

  const degistir = (id: SkillId) => {
    if (secili.includes(id)) {
      setDolu(false);
      setSecili(secili.filter((x) => x !== id));
    } else if (secili.length >= SET_EN_FAZLA_DUGUM) {
      setDolu(true);
    } else {
      setSecili([...secili, id]);
    }
  };

  const baslat = () => {
    if (secili.length === 0) return;
    const taslak = { surum: SET_SURUMU, dugumler: secili, tohum: 0 };
    // Tohum UI katmanında: saf modülde saat/rastgelelik yok (Math.random yasak).
    const tohum = hash32(String(performance.now()) + setKodla(taslak));
    setBaslat({ ...taslak, tohum });
  };

  return (
    <main
      aria-labelledby="set-hazirla-baslik"
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
      {/* Üst %35: yalnız bilgi, dokunulabilir öğe yok. */}
      <header style={{ flex: '0 0 30%', display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
        <h1 id="set-hazirla-baslik" style={{ fontSize: 'var(--text-adult)', color: COLOR.ink, margin: 0 }}>
          Bugünün setini hazırla
        </h1>
        <p style={{ fontSize: 'var(--text-adult)', color: COLOR.inkSoft, margin: 0 }}>
          En çok {SET_EN_FAZLA_DUGUM} etkinlik seç; farklı konulardan olabilir. Set yalnız bu açık oturumda kalır.
        </p>
        <ul
          aria-label="Seçilen etkinlikler"
          style={{ display: 'flex', flexWrap: 'wrap', gap: 8, listStyle: 'none', margin: 0, padding: 0 }}
        >
          {secili.length === 0 && <li style={{ fontSize: 'var(--text-adult)', color: COLOR.inkSoft }}>Henüz seçim yok.</li>}
          {secili.map((id) => (
            <li
              key={id}
              style={{
                fontSize: 'var(--text-adult)',
                color: COLOR.ink,
                background: COLOR.surface,
                border: `2px solid ${COLOR.border}`,
                borderRadius: 999,
                padding: '4px 14px',
              }}
            >
              {etiket(id)}
            </li>
          ))}
        </ul>
        <p role="status" aria-live="polite" style={{ fontSize: 'var(--text-adult)', color: COLOR.ink, margin: 0 }}>
          {secili.length}/{SET_EN_FAZLA_DUGUM} seçildi{dolu ? ' — önce birini kaldır.' : ''}
        </p>
      </header>

      {/* Alt %65: tüm dokunulabilir öğeler. */}
      <nav
        aria-label="Temalar"
        style={{ flex: '0 0 auto', display: 'flex', flexWrap: 'wrap', gap: 'var(--size-gap-tight)' }}
      >
        {TEMALAR.map((t) => (
          <BigButton
            key={t.no}
            label={t.ad}
            size="tapMin"
            ariaPressed={t.no === temaNo}
            onPress={() => setTemaNo(t.no)}
            style={{
              padding: '0 14px',
              fontSize: 'var(--text-adult)',
              background: t.no === temaNo ? t.renk : undefined,
              color: t.no === temaNo ? '#fff' : undefined,
            }}
          >
            {t.ad}
          </BigButton>
        ))}
      </nav>

      <section
        aria-label="Etkinlikler"
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gridAutoRows: 'minmax(var(--size-tap-min), auto)',
          gap: 'var(--size-gap-tight)',
          alignContent: 'start',
        }}
      >
        {dugumler.map((d) => {
          const secildi = secili.includes(d.id);
          return (
            <BigButton
              key={d.id}
              label={d.childLabel}
              size="tapMin"
              ariaPressed={secildi}
              onPress={() => degistir(d.id)}
              style={{
                width: '100%',
                padding: '8px 12px',
                flexDirection: 'column',
                gap: 2,
                textAlign: 'center',
                fontSize: 'var(--text-adult)',
                fontWeight: 700,
                border: `3px solid ${secildi ? COLOR.ink : 'transparent'}`,
                background: secildi ? COLOR.surface : undefined,
              }}
            >
              <span>{secildi ? '✓ ' : ''}{d.childLabel}</span>
            </BigButton>
          );
        })}
      </section>

      <footer style={{ flex: '0 0 auto', display: 'flex', gap: 'var(--size-gap-tight)', alignItems: 'center' }}>
        <BigButton label="Geri" size="tapMin" variant="ghost" onPress={() => ekranGit('veliPaneli')} style={{ padding: '0 20px' }}>
          ← Geri
        </BigButton>
        <BigButton
          label="Tahtada başlat"
          size="tapMin"
          variant="accent"
          disabled={secili.length === 0}
          onBlockedPress={() => undefined}
          onPress={baslat}
          style={{ padding: '0 32px', fontWeight: 700 }}
        >
          Tahtada başlat
        </BigButton>
      </footer>
    </main>
  );
}
