import { useRef, type CSSProperties, type ReactNode } from 'react';
import { useTalimatTekrari } from '../useTalimatTekrari';
import { SoruHoparloru } from '../primitives/SoruHoparloru';

/**
 * Alıştırma ekranı iskeleti (plan §11).
 *
 * İki bölge, akıllı tahta erişim kuralına (§13) göre:
 *   · ÜST %35 — UYARAN alanı. Sahne/görsel burada DURUR; dokunulabilir ÖĞE YOK.
 *     (1. sınıf çocuğu 86" tahtanın üstüne fiziksel olarak ulaşamaz.)
 *   · ALT %65 — ETKİLEŞİM alanı. Tüm cevap kartları ve kontroller burada.
 * "Tekrar dinle" düğmesi alt çubukta SABİT yerde — yerini ezberlemek zorunda (çocuk okuyamıyor).
 * Sol el ayarı (Adım 55) alt çubuğu (`.alt-cubuk`) aynalar; yeri yine sabittir.
 *
 * KG-127: soru yalnız sesten ibaretse (`stimulus` boş — para/rakam tanıma, şekil adı, konum, sırala/eşleştir…)
 * üst alana büyük bir SORU HOPARLÖRÜ konur: "soru burada, dinle". ↻ ile aynı eylemi yapan YEDEK hedeftir;
 * tahtada çocuk üst %35'e uzanamadığı için ↻ alt çubukta kalır (öğretmen ve tablet üstteki hoparlörü kullanır).
 */
export function GameShell({
  stimulus,
  interaction,
  accent,
}: {
  stimulus: ReactNode;
  interaction: ReactNode;
  accent: string;
}) {
  const accentStyle: CSSProperties = { ['--color-accent' as string]: accent } as CSSProperties;
  const kok = useRef<HTMLElement>(null);
  // Adım 55: talimat tekrarı açıksa 8 sn hareketsizlikte talimat bir kez yeniden söylenir.
  useTalimatTekrari(kok);
  return (
    <main
      ref={kok}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: 'var(--size-edge)',
        paddingBottom: 'var(--size-edge-bottom)',
        gap: 'var(--size-gap)',
        overflow: 'hidden',
        ...accentStyle,
      }}
    >
      {/* Üst: uyaran alanı — dokunulabilir öğe YOK (tek istisna: yedek soru hoparlörü, KG-127). */}
      <section
        style={{
          flex: '0 0 35%',
          display: 'grid',
          placeItems: 'center',
          minHeight: 0,
        }}
      >
        {stimulus ?? <SoruHoparloru />}
      </section>

      {/* Alt: etkileşim alanı — tüm seçenekler ve kontroller. */}
      <section
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 'var(--size-gap)',
          minHeight: 0,
        }}
      >
        {interaction}
      </section>
    </main>
  );
}
