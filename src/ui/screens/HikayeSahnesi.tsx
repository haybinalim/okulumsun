/**
 * MASKOT HİKÂYE SAHNESİ GÖRÜNÜMÜ (plan v2 Adım 54 aşama 2, KG-116) — yalnız tembel parçalardan içe aktarılır
 * (derin tema girişi, oturum sonu hikâyesi); hikâye JSON'u ana pakete girmez.
 *
 * Tema dünyasının programatik arka planı + sahnenin pozundaki maskot + sahne görseli. HİÇBİRİ dokunulmaz
 * (`aria-hidden`, olay almaz; maskot `dokunulmaz` — KG-112 erişim kuralı): hikâye anı izlenir, etkileşim yok,
 * alt %65 kuralı değişmez. Metin ekranda YAZILMAZ (çocuk okumaz; maskot sesiyle söylenir).
 */
import { temaHikayesi } from '../../content/maskotHikayeleri';
import { COLOR } from '../../design/tokens';
import { Maskot } from '../feedback/Maskot';
import { TemaSahnesi } from '../svg/temaSahneleri';
import { Visual } from '../svg/Visual';

export interface HikayeSahnesiProps {
  readonly tema: number;
  /** 1–3. */
  readonly sahneNo: number;
  /** Sahne görselinin kenarı (px). */
  readonly gorselBoyutu?: number;
  readonly maskotBoyutu?: number;
}

/** Kapsayıcısını doldurur (`position: absolute; inset: 0`). Bilinmeyen tema/sahnede hiçbir şey çizmez. */
export default function HikayeSahnesi({ tema, sahneNo, gorselBoyutu = 260, maskotBoyutu = 150 }: HikayeSahnesiProps) {
  const hikaye = temaHikayesi(tema);
  const sahne = hikaye?.sahneler.find((s) => s.no === sahneNo);
  if (!hikaye || !sahne) return null;
  return (
    <div
      aria-hidden="true"
      data-hikaye-sahnesi={sahne.sesAnahtari}
      data-hikaye-poz={sahne.poz}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <TemaSahnesi sahne={hikaye.sahne} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'calc(40px * var(--scale, 1))',
          flexWrap: 'wrap',
        }}
      >
        <Maskot durum={sahne.poz} size={maskotBoyutu} dokunulmaz />
        <div
          style={{
            background: COLOR.surface,
            borderRadius: 24,
            padding: 12,
            border: `3px solid ${COLOR.border}`,
            lineHeight: 0,
          }}
        >
          <Visual spec={sahne.gorsel} width={gorselBoyutu} height={gorselBoyutu} />
        </div>
      </div>
    </div>
  );
}
