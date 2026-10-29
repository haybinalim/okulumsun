/**
 * TCMB örnek banknot görseli (KG-122): ekran, basılı kâğıt ve arşivde aynı dosya.
 *
 * HTML `<img>`: görsel JS paketine gömülmez (K5), tarayıcı ayrı varlık olarak yükler. Oran gerçek kupürden
 * gelir (büyük kupür daha uzun). Erişilebilir ad seçenek düğmesinde olduğu için burada `alt=""`.
 * `genislik` verilmezse kapsayıcının genişliğini doldurur (seçenek kartı, KG-122 madde 4).
 */
import type { CSSProperties } from 'react';
import type { BanknotDegeri } from '../../exercises/types';
import { banknotOrani } from '../../content/paraGorseli';
import { RESMI_BANKNOT_GORSELLERI } from './banknotAssets';

export interface TcmbBanknotProps {
  readonly deger: BanknotDegeri;
  /** CSS piksel genişlik (kesirli olabilir); yoksa `%100` (kapsayıcıyı doldurur). */
  readonly genislik?: number;
  readonly style?: CSSProperties;
}

export function TcmbBanknot({ deger, genislik, style }: TcmbBanknotProps) {
  const oran = banknotOrani(deger);
  return (
    <img
      src={RESMI_BANKNOT_GORSELLERI[deger]}
      alt=""
      aria-hidden="true"
      draggable={false}
      decoding="sync"
      loading="eager"
      data-banknot={deger}
      width={genislik === undefined ? undefined : Math.round(genislik)}
      height={genislik === undefined ? undefined : Math.round(genislik / oran)}
      style={{
        display: 'block',
        width: genislik ?? '100%',
        height: 'auto',
        aspectRatio: String(oran),
        borderRadius: 4,
        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.22)',
        outline: '1px solid rgba(51, 65, 85, 0.55)',
        ...style,
      }}
    />
  );
}
