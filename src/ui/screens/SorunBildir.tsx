/*
 * SORUN BİLDİR (plan v2 Adım 23, ADR-0005) — yetişkin alanı.
 * Bellekteki son 20 hata kaydını ve sürüm kimliğini gösterir. Gönderim düğmesi YOK:
 * yetişkin metni panoya kopyalayıp isterse kendisi iletir. Hiçbir şey kaydedilmez.
 */
import { useRef, useState, useSyncExternalStore } from 'react';
import { useAppStore } from '../../store/appStore';
import { BigButton } from '../primitives/BigButton';
import { COLOR } from '../../design/tokens';
import { abone, kayitlariAl, kayitlariTemizle, raporMetni } from '../../hata/hataKaydi';
import { SURUM_METNI } from '../../hata/surum';

export const SORUN_BILDIR_ACIKLAMA =
  'Bu bilgiler cihazdan çıkmaz; isterseniz kopyalayıp bize iletebilirsiniz.';

function kuruluMu(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches;
}

export function SorunBildir({ cihaz }: { cihaz: string }) {
  const ekranGit = useAppStore((s) => s.ekranGit);
  const kayitlar = useSyncExternalStore(abone, kayitlariAl);
  const [durum, setDurum] = useState<string>('');
  const metinAlani = useRef<HTMLTextAreaElement>(null);

  const metin = raporMetni(SURUM_METNI, {
    cihaz,
    kurulu: kuruluMu(),
    cevrimici: navigator.onLine,
    kullaniciAjani: navigator.userAgent,
  }, kayitlar);

  const kopyala = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(metin);
      setDurum('Panoya kopyalandı.');
    } catch {
      // Eski WebView'larda pano API'si yok: metni seçili bırak, yetişkin elle kopyalar.
      metinAlani.current?.focus();
      metinAlani.current?.select();
      setDurum('Otomatik kopyalanamadı; metin seçildi, elle kopyalayabilirsiniz.');
    }
  };

  return (
    <main
      aria-labelledby="sorun-bildir-baslik"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: COLOR.bg,
        padding: 'var(--size-edge)',
        paddingBottom: 'var(--size-edge-bottom)',
        gap: 16,
        overflow: 'auto',
      }}
    >
      <header style={{ flex: '0 0 auto', display: 'flex', gap: 12, alignItems: 'center' }}>
        <BigButton label="Yetişkin alanına dön" size="control" variant="ghost" onPress={() => ekranGit('veliPaneli')}>
          ←
        </BigButton>
        <div>
          <h1 id="sorun-bildir-baslik" style={{ fontSize: 'var(--text-adult)', color: COLOR.ink, margin: 0 }}>
            Sorun bildir
          </h1>
          <p style={{ ...bilgi, marginTop: 2 }}>{SORUN_BILDIR_ACIKLAMA}</p>
        </div>
      </header>

      <p style={bilgi}>
        Sürüm: <strong style={{ color: COLOR.ink }}>{SURUM_METNI}</strong> · Kayıt: {kayitlar.length}
      </p>

      <label htmlFor="sorun-raporu" style={{ ...bilgi, color: COLOR.ink }}>
        Rapor metni (yalnız bu açık oturumdaki hatalar; sayfa yenilenince silinir)
      </label>
      <textarea
        id="sorun-raporu"
        ref={metinAlani}
        readOnly
        value={metin}
        rows={14}
        style={{
          flex: '1 1 auto',
          minHeight: 200,
          fontFamily: 'ui-monospace, monospace',
          fontSize: 'var(--text-adult)',
          padding: 12,
          borderRadius: 8,
          border: `1px solid ${COLOR.border}`,
          background: COLOR.surface,
          color: COLOR.ink,
          userSelect: 'text',
        }}
      />

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <BigButton label="Panoya kopyala" size="control" variant="accent" onPress={() => void kopyala()}>
          Panoya kopyala
        </BigButton>
        <BigButton
          label="Kayıtları temizle"
          size="control"
          variant="ghost"
          onPress={() => {
            kayitlariTemizle();
            setDurum('Kayıtlar temizlendi.');
          }}
        >
          Temizle
        </BigButton>
        <span role="status" aria-live="polite" style={bilgi}>
          {durum}
        </span>
      </div>
    </main>
  );
}

const bilgi: React.CSSProperties = {
  fontSize: 'var(--text-adult)',
  color: COLOR.inkSoft,
  margin: 0,
};
