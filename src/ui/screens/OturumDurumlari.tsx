/**
 * Oturum hata ve yükleme ekranları (plan v2 Adım 29, E35).
 * Kırmızı yok; ham hata metni çocuğa gösterilmez (yalnız yerel günlüğe gider).
 */
import { useEffect } from 'react';
import { speech } from '../../audio/speech';
import { useScreenSpeech } from '../../audio/useSpeak';
import { BigButton } from '../primitives/BigButton';
import { COLOR } from '../../design/tokens';
import { kayitEkle } from '../../hata/hataKaydi';

const KAP: React.CSSProperties = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 24,
  padding: 24,
  textAlign: 'center',
  color: COLOR.ink,
};

/**
 * "Hazırlanıyor." yalnız yükleme gerçekten sürerse söylenir: tembel ekranlar çoğu zaman bir kare içinde
 * açılır; her geçişte duyulan bir söz çocuğu yorar ve sıradaki talimatın başını keser (KG-110).
 */
export const HAZIRLANIYOR_GECIKMESI_MS = 800;

export function OturumYukleniyor() {
  useEffect(() => {
    const zaman = window.setTimeout(() => void speech.speak({ kind: 'key', key: 'ui.hazirlaniyor' }), HAZIRLANIYOR_GECIKMESI_MS);
    return () => window.clearTimeout(zaman);
  }, []);
  return (
    <div data-ekran="oturum-yukleniyor" role="status" style={KAP}>
      <div style={{ fontSize: 28, fontWeight: 'bold' }}>Hazırlanıyor...</div>
    </div>
  );
}

export function OturumHatasi({ mesaj, onAnaEkran }: { readonly mesaj: string; readonly onAnaEkran: () => void }) {
  useEffect(() => {
    kayitEkle({ tur: 'render', mesaj });
  }, [mesaj]);
  useScreenSpeech({ kind: 'key', key: 'ui.bir-sorun-oldu' }, []);
  return (
    <div data-ekran="oturum-hatasi" role="alert" style={KAP}>
      <div style={{ fontSize: 32, fontWeight: 'bold' }}>Küçük bir sorun oldu.</div>
      <BigButton size="primary" onPress={onAnaEkran} label="Ana ekrana dön">
        Ana ekrana dön
      </BigButton>
    </div>
  );
}
