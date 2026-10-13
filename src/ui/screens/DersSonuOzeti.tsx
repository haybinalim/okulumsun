/**
 * DERS SONU ÖZETİ (plan v2 Adım 40 aşama 2): sınıf en çok nerede zorlandı? Yalnız düzey, sayı/yüzde yok.
 * Yetişkin ekranı; ses yok. Olaylar yalnız bellekte.
 */
import { useMemo } from 'react';
import { useAppStore } from '../../store/appStore';
import { useDersOturumu } from '../useDersOturumu';
import { dersOzetiHesapla } from '../../ogretmen/dersOzeti';
import { skillsData } from '../../content/skillsData';
import { BigButton } from '../primitives/BigButton';
import { COLOR } from '../../design/tokens';

const DUZEY: Record<'destekle' | 'zorlandi', { simge: string; metin: string }> = {
  destekle: { simge: '◐', metin: 'Biraz destek gerekti' },
  zorlandi: { simge: '▲', metin: 'Sınıf zorlandı' },
};

export function DersSonuOzeti() {
  const olaylar = useDersOturumu((s) => s.olaylar);
  const dersiKapat = useDersOturumu((s) => s.dersiKapat);
  const { ekranGit, setBaslat, kagitIcinSet } = useAppStore();
  const ozet = useMemo(
    () => dersOzetiHesapla(olaylar, skillsData, Math.imul(olaylar.length + 1, 2654435761) >>> 0),
    [olaylar],
  );
  const kapat = (): void => {
    dersiKapat();
    ekranGit('anaEkran');
  };

  return (
    <main
      aria-labelledby="ders-ozeti-baslik"
      style={{ height: '100%', display: 'flex', flexDirection: 'column', background: COLOR.bg, padding: 'var(--size-edge)', gap: 16 }}
    >
      <h1 id="ders-ozeti-baslik" style={{ margin: 0, fontSize: 36, color: COLOR.ink }}>Ders sonu özeti</h1>
      <section aria-label="Zorlanılan beceriler" style={{ flex: '1 1 35%', display: 'flex', gap: 16, overflow: 'hidden' }}>
        {ozet.zorlanilanlar.length === 0 && (
          <p data-testid="ozet-bos" style={{ fontSize: 28, color: COLOR.ink }}>
            Bugün sınıf rahat ilerledi; öne çıkan bir zorluk yok.
          </p>
        )}
        {ozet.zorlanilanlar.map((z) => (
          <article key={z.skillId} data-testid="ozet-kart" data-duzey={z.duzey} style={{ flex: 1, border: '4px solid #B45309', borderRadius: 16, padding: 16, background: COLOR.surface, color: COLOR.ink }}>
            <h2 style={{ margin: 0, fontSize: 26 }}>{z.baslik}</h2>
            <p style={{ margin: '8px 0', fontSize: 22 }}>
              <span aria-hidden="true">{DUZEY[z.duzey].simge} </span>
              {DUZEY[z.duzey].metin}
            </p>
            {z.baskinTani && <p data-testid="ozet-tani" style={{ margin: '4px 0', fontSize: 20 }}>{z.baskinTani.aciklama}</p>}
            <p style={{ margin: '4px 0', fontSize: 20 }}>Sınıfta: {z.sinifEtkinligi}</p>
          </article>
        ))}
      </section>
      <footer style={{ flex: '0 0 65%', display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {ozet.yarinIcinSet && (
          <>
            <BigButton label="Yarın için set" size="tapMin" variant="accent" onPress={() => { const s = ozet.yarinIcinSet; if (s) { dersiKapat(); setBaslat(s); } }} style={{ padding: '0 32px', minHeight: 102 }}>
              Yarın için set
            </BigButton>
            <BigButton label="Kâğıt yazdır" size="tapMin" variant="ghost" onPress={() => { const s = ozet.yarinIcinSet; if (s) { dersiKapat(); kagitIcinSet(s); } }} style={{ padding: '0 32px', minHeight: 102 }}>
              Kâğıt yazdır
            </BigButton>
          </>
        )}
        <BigButton label="Kapat" size="tapMin" variant="ghost" onPress={kapat} style={{ padding: '0 32px', minHeight: 102 }}>
          Kapat
        </BigButton>
      </footer>
    </main>
  );
}
