/**
 * VELİ İPUCU KARTI — Evde 10 dakika sonu (plan v2 Adım 43 aşama 2, KG-62).
 *
 * Çocuk kısa oturumu bitirip telefonu bir büyüğüne verince açılır: haftanın teması için 3 cümle
 * (gözlem, soru, ev nesnesiyle etkinlik). Yetişkin ekranıdır (okuma gerekir). Puan/skor ve
 * çocuğun yanıtları GÖSTERİLMEZ; hiçbir şey saklanmaz. Bu ekran tembel yüklenir.
 */
import { useAppStore, TEMALAR } from '../../store/appStore';
import { temaIpucu } from '../../content/evIpuclari';
import { BigButton } from '../primitives/BigButton';
import { COLOR } from '../../design/tokens';

const metin = { fontSize: 'var(--text-adult)', color: COLOR.ink, margin: 0, lineHeight: 1.45 } as const;

export default function VeliIpucuKarti() {
  const tema = useAppStore((s) => s.evdeOnDakikaTema);
  const bitir = useAppStore((s) => s.evdeOnDakikaBitir);
  const ipucu = tema == null ? null : temaIpucu(tema);
  const temaAdi = TEMALAR.find((t) => t.no === tema)?.ad ?? (tema == null ? '' : `Tema ${tema}`);

  return (
    <main
      aria-labelledby="ipucu-baslik"
      data-yetiskin=""
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
      <header>
        <h1 id="ipucu-baslik" style={{ ...metin, fontWeight: 700 }}>
          Evde 10 dakika — sizin için ipucu
        </h1>
        {temaAdi && <p style={{ ...metin, opacity: 0.8, marginTop: 4 }}>Bu haftanın konusu: {temaAdi}</p>}
      </header>

      {ipucu ? (
        <section aria-label="İpucu" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Kart baslik="Gözlemleyin" metinIcerik={ipucu.gozlem} />
          <Kart baslik="Sorun" metinIcerik={ipucu.soru} />
          <Kart baslik="Birlikte yapın" metinIcerik={ipucu.etkinlik} />
        </section>
      ) : (
        <p style={metin}>Bu hafta için ipucu bulunamadı.</p>
      )}

      <p style={{ ...metin, opacity: 0.75 }}>
        Çocuğunuzun yanıtları gösterilmez ve hiçbir yere kaydedilmez. Amaç doğru sayısı değil, birlikte konuşmak.
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'auto' }}>
        <BigButton
          label="Tamam, çocuk ekranına dön"
          size="control"
          variant="accent"
          onPress={bitir}
          style={{ padding: '0 24px', fontSize: 'var(--text-adult)' }}
        >
          Tamam
        </BigButton>
      </div>
    </main>
  );
}

function Kart({ baslik, metinIcerik }: { baslik: string; metinIcerik: string }) {
  return (
    <article
      style={{
        background: COLOR.surface,
        border: `1px solid ${COLOR.border}`,
        borderRadius: 16,
        padding: 16,
      }}
    >
      <h2 style={{ ...metin, fontWeight: 700, marginBottom: 6 }}>{baslik}</h2>
      <p style={metin}>{metinIcerik}</p>
    </article>
  );
}
