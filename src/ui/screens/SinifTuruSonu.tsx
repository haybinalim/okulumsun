/**
 * SINIF TURU SONU — kavanoz kutlaması (plan v2 Adım 36 aşama 2b, ADR-0008).
 *
 * Sonuç yalnız dolu kavanoz ve takım yıldızlarıdır (simge; sayı, puan, sıralama, kazanan yok).
 * "Ders sonu özeti" Adım 40'ta bu ekrana bağlanır. Ekrandan çıkınca tur durumu silinir.
 */
import { useAppStore } from '../../store/appStore';
import { BigButton } from '../primitives/BigButton';
import { Maskot } from '../feedback/Maskot';
import { YonlendirmeSeridi } from '../feedback/YonlendirmeSeridi';
import { SinifKavanozu } from '../svg/SinifKavanozu';
import { COLOR, SIZE } from '../../design/tokens';
import { useScreenSpeech } from '../../audio/useSpeak';
import { takimKimligi, turSonuSesi } from '../../sinif/takim';

export function SinifTuruSonu() {
  const d = useAppStore((s) => s.sinifTuru);
  const kapat = useAppStore((s) => s.sinifTuruKapat);
  const yeniden = useAppStore((s) => s.sinifTuruKur);
  // Başlıktaki cümlenin aynısı (KG-110): "Kavanozu birlikte doldurduk!" / "Bugün birlikte çalıştık!".
  useScreenSpeech(d ? { kind: 'key', key: turSonuSesi(d) } : null, []);
  if (!d) return null;
  const dolu = d.kavanoz >= d.kavanozHedefi;

  return (
    <main
      aria-labelledby="sinif-turu-sonu-baslik"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        background: COLOR.bg,
        padding: 'var(--size-edge)',
        paddingBottom: 'var(--size-edge-bottom)',
        gap: 'var(--size-gap)',
        overflow: 'hidden',
      }}
    >
      <h1 id="sinif-turu-sonu-baslik" style={{ margin: 0, fontSize: 40, color: COLOR.ink, textAlign: 'center' }}>
        {dolu ? 'Kavanozu birlikte doldurduk!' : 'Bugün birlikte çalıştık!'}
      </h1>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--size-gap)' }}>
        <SinifKavanozu kavanoz={d.kavanoz} hedef={d.kavanozHedefi} boyut={260} />
        <ul
          aria-label="Takımlar"
          style={{ display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'none', margin: 0, padding: 0 }}
        >
          {d.takimlar.map((t) => {
            const k = takimKimligi(t.renk);
            return (
              <li
                key={t.renk}
                aria-label={k.etiket}
                data-takim={t.renk}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 16px',
                  borderRadius: 999,
                  background: k.hex,
                  color: '#fff',
                }}
              >
                <span aria-hidden="true" style={{ fontSize: 34 }}>
                  {k.hayvan}
                </span>
                <span aria-hidden="true" style={{ fontSize: 28 }}>
                  {'★'.repeat(t.yildiz)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--size-gap-tight)' }}>
        <Maskot durum="sevinmis" size={SIZE.mascot} />
        <YonlendirmeSeridi metin="Her takım katkı verdi. Kazanan yok; hep birlikte başardık." />
      </div>
      <footer style={{ display: 'flex', gap: 'var(--size-gap-tight)' }}>
        <BigButton
          label="Yeni Sınıf Turu"
          size="tapMin"
          variant="ghost"
          onPress={yeniden}
          style={{ padding: '0 24px', fontSize: 'var(--text-adult)' }}
        >
          Yeni Sınıf Turu
        </BigButton>
        <BigButton
          label="Dersi bitir"
          size="tapMin"
          variant="ghost"
          onPress={() => useAppStore.getState().ekranGit('dersSonuOzeti')}
          style={{ padding: '0 24px', fontSize: 'var(--text-adult)' }}
        >
          Dersi bitir
        </BigButton>
        <BigButton
          label="Ana ekran"
          size="tapMin"
          variant="accent"
          onPress={kapat}
          style={{ padding: '0 32px', fontWeight: 700 }}
        >
          Ana ekran
        </BigButton>
      </footer>
    </main>
  );
}
