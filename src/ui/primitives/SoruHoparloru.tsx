import { useReplay, useSpeechState } from '../../audio/useSpeak';
import { useHareketAzalt } from '../../design/useHareketAzalt';
import { BigButton } from './BigButton';

/** Erişilebilir ad — alt çubuktaki "Tekrar dinle" (↻) ile karışmasın diye ayrı (KG-127). */
export const SORU_HOPARLORU_ETIKETI = 'Soruyu tekrar dinle';

/**
 * Yedek dokunma hedefi işareti (KG-127). Üst %35 tahtada çocuğun erişim bölgesi dışıdır (§13); bu
 * işaretli öğenin AYNI eylemi erişilebilir bölgede de vardır (alt çubuktaki ↻ "Tekrar dinle"). E2E geometri
 * denetimi ve BoardHarness yalnız ölü bölge kuralından muaf tutar; hedef boyutu kuralı yine geçerlidir.
 */
export const YEDEK_HEDEF_OZNITELIGI = 'data-yedek-hedef';

/**
 * SORU HOPARLÖRÜ (KG-127) — yalnız sesli sorularda (uyaran alanında görsel yoksa) üst bölgede durur.
 *
 * Soru sesten ibaretken (ör. para tanıma "beş lira", rakam tanıma, şekil adı, konum) üst alan boş kalıyor ve
 * çocuk/öğretmen sorunun nerede olduğunu göremiyordu. Hoparlör "soru burada, dinle" der; dokununca ↻ ile aynı
 * tekrar mekanizması çalışır (`useReplay('soru')`: öncelik yüksek, çalan konuşma kesilir, arka arkaya basınca
 * yavaşlar) — tek fark, son söylenen şık adı/geri bildirim değil ekranın SORUSU çalar
 * (`speech.soruyuTekrarla`). Yeni ses YOK, TTS isteği YOK.
 *
 * Görsel dil: GezinmeCubugu simgeleriyle aynı aile (32'lik görünüm kutusu, kalın yuvarlak uçlu çizgi,
 * `currentColor` = mürekkep) ve ↻ ile aynı düğme (BigButton daire, `solid`, alt gölge). Kendi SVG'miz (KG-104);
 * `<mask>` yok. Çalarken dalgalar hafifçe nabız atar — yalnız hareket azaltma kapalıyken.
 */
export function SoruHoparloru() {
  const replay = useReplay('soru');
  const caliyor = useSpeechState() === 'calisiyor';
  const hareketAzalt = useHareketAzalt();
  const nabiz = caliyor && !hareketAzalt;
  return (
    <div data-soru-hoparloru="" data-caliyor={caliyor ? '' : undefined} style={{ display: 'grid', placeItems: 'center' }}>
      <BigButton
        label={SORU_HOPARLORU_ETIKETI}
        size="primary"
        shape="circle"
        variant="solid"
        onPress={replay}
        data-yedek-hedef="tekrar-dinle"
        style={{
          // Büyük ama üst alana sığar: tahta 1920×1080'de 224 px, 1080×810'da ≈ 210 px; asla `--size-tap-min` altı değil.
          width: HOPARLOR_BOYU,
          height: HOPARLOR_BOYU,
          minWidth: HOPARLOR_BOYU,
          minHeight: HOPARLOR_BOYU,
        }}
      >
        <HoparlorSimgesi nabiz={nabiz} />
      </BigButton>
    </div>
  );
}

export const HOPARLOR_BOYU = 'max(var(--size-tap-min), min(var(--size-primary), 26vh))';

export function HoparlorSimgesi({ nabiz = false }: { nabiz?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" width="58%" height="58%" style={{ display: 'block' }}>
      {/* Hoparlör gövdesi: dolu mürekkep (↻'nin dolu ok ucu gibi) + aynı kalınlıkta yuvarlak kenar. */}
      <path
        d="M4.5 12.5h5l7-6v19l-7-6h-5z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        className={nabiz ? 'hoparlor-dalga hoparlor-dalga-1' : undefined}
        d="M21 12a5.5 5.5 0 0 1 0 8"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <path
        className={nabiz ? 'hoparlor-dalga hoparlor-dalga-2' : undefined}
        d="M24.5 8a11 11 0 0 1 0 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
      />
    </svg>
  );
}
