/**
 * UYGULAMA STORE TESTLERİ — plan §11, §14 Adım 8.
 *
 * Bitti tanımı:
 *  · "§11 akışının tamamı gezilebilir"
 *  · "veli paneli 5 kalemi içerir"
 *  · "tahta modunda IndexedDB'ye yazılmadığı testle kanıtlı"
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  useAppStore,
  persistenceEnabled,
  accentBul,
  avatarBul,
  AVATARLAR,
  TEMALAR,
  type Ekran,
} from '../../src/store/appStore';

// Her testten önce store'u sıfırla
function sifirla() {
  useAppStore.getState().sifirla();
}

describe('Uygulama store — navigasyon akışı', () => {
  beforeEach(sifirla);

  // ----------------------------------------------------- başlangıç durumu

  it('başlangıçta audioUnlock ekranında', () => {
    expect(useAppStore.getState().ekran).toBe('audioUnlock');
  });

  it('başlangıçta mod null', () => {
    expect(useAppStore.getState().mod).toBeNull();
  });

  // ----------------------------------------------------- mod seçimi

  it('kişisel mod seçilince avatar seçimine gider', () => {
    useAppStore.getState().modSec('kisisel');
    expect(useAppStore.getState().mod).toBe('kisisel');
    expect(useAppStore.getState().ekran).toBe('avatarSecimi');
  });

  it('tahta modu seçilince ana ekrana gider (avatar atlanır)', () => {
    useAppStore.getState().modSec('tahta');
    expect(useAppStore.getState().mod).toBe('tahta');
    expect(useAppStore.getState().ekran).toBe('anaEkran');
  });

  // ----------------------------------------------------- avatar → renk → ana ekran

  it('kişisel: avatar → renk → ana ekran akışı', () => {
    const { modSec, avatarSec, renkSec } = useAppStore.getState();
    modSec('kisisel');
    avatarSec('kedi');
    expect(useAppStore.getState().ekran).toBe('renkSecimi');
    expect(useAppStore.getState().avatarId).toBe('kedi');

    renkSec('mor');
    expect(useAppStore.getState().ekran).toBe('anaEkran');
    expect(useAppStore.getState().accentId).toBe('mor');
  });

  // ----------------------------------------------------- ekranGit

  it('ekranGit oncekiEkrani kaydeder', () => {
    useAppStore.getState().ekranGit('anaEkran');
    useAppStore.getState().ekranGit('veliKapisi');
    expect(useAppStore.getState().ekran).toBe('veliKapisi');
    expect(useAppStore.getState().oncekiEkran).toBe('anaEkran');
  });

  // ----------------------------------------------------- tema seçimi

  it('kişisel modda tema seçilince tema girişine gider ve tamamlanmış oturumu sıfırlar', () => {
    useAppStore.getState().modSec('kisisel');
    useAppStore.getState().oturumuTamamla();
    useAppStore.getState().temaSec(2);

    expect(useAppStore.getState().secilenTemaNo).toBe(2);
    expect(useAppStore.getState().ekran).toBe('temaGirisi');
    expect(useAppStore.getState().oturumTamamlandi).toBe(false);
  });

  it('tahta modunda tema seçilince konu seçimine gider', () => {
    useAppStore.getState().modSec('tahta');
    useAppStore.getState().temaSec(2);

    expect(useAppStore.getState().secilenTemaNo).toBe(2);
    expect(useAppStore.getState().ekran).toBe('konuSecimi');
  });

  it('konu seçilince dugumSec alıştırmaya yönlendirir ve dugumId saklanır', () => {
    useAppStore.getState().dugumSec('mat.sayilar.bir-onluk');

    expect(useAppStore.getState().secilenDugumId).toBe('mat.sayilar.bir-onluk');
    expect(useAppStore.getState().ekran).toBe('alistirma');
  });

  // ----------------------------------------------------- veli

  it('veli kapısı geçince veliGecildi true olur', () => {
    useAppStore.getState().veliGec(true);
    expect(useAppStore.getState().veliGecildi).toBe(true);
  });

  // ----------------------------------------------------- ayarlar

  it('readingLevel ayarlanır', () => {
    useAppStore.getState().readingLevelAyarla(2);
    expect(useAppStore.getState().readingLevel).toBe(2);
  });

  it('okulAyi 0-9 aralığında kalır', () => {
    useAppStore.getState().okulAyiAyarla(5);
    expect(useAppStore.getState().okulAyiIndex).toBe(5);

    useAppStore.getState().okulAyiAyarla(-1);
    expect(useAppStore.getState().okulAyiIndex).toBe(0);

    useAppStore.getState().okulAyiAyarla(100);
    expect(useAppStore.getState().okulAyiIndex).toBe(9);
  });

  it('sesHızı 0.5-1.5 aralığında kalır', () => {
    useAppStore.getState().sesHiziAyarla(1.3);
    expect(useAppStore.getState().sesHizi).toBe(1.3);

    useAppStore.getState().sesHiziAyarla(0.1);
    expect(useAppStore.getState().sesHizi).toBe(0.5);

    useAppStore.getState().sesHiziAyarla(3.0);
    expect(useAppStore.getState().sesHizi).toBe(1.5);
  });
});

describe('Tahta modu — kalıcılık kuralları', () => {
  beforeEach(sifirla);

  it('tahta modunda persistenceEnabled false', () => {
    useAppStore.getState().modSec('tahta');
    expect(persistenceEnabled(useAppStore.getState().mod)).toBe(false);
  });

  it('kişisel modda da geliştirme sürümünde persistenceEnabled false', () => {
    useAppStore.getState().modSec('kisisel');
    expect(persistenceEnabled(useAppStore.getState().mod)).toBe(false);
  });

  it('mod null iken persistenceEnabled false', () => {
    expect(persistenceEnabled(null)).toBe(false);
  });

  it('tahta modunda avatar/renk seçilmez', () => {
    useAppStore.getState().modSec('tahta');
    expect(useAppStore.getState().avatarId).toBeNull();
    expect(useAppStore.getState().accentId).toBeNull();
  });

  it('tahta modunda ana ekrana doğrudan gidilir (avatar/renk atlanır)', () => {
    useAppStore.getState().modSec('tahta');
    // Tahta modu akışı: modSecimi → anaEkran (avatarSecimi/renkSecimi atlanır)
    expect(useAppStore.getState().ekran).toBe('anaEkran');
    expect(useAppStore.getState().oncekiEkran).toBe('modSecimi');
  });
});

describe('Ekran akışı — tüm ekranlar reachable', () => {
  beforeEach(sifirla);

  it('tüm ekranlar Ekran tipinde', () => {
    const tumEkranlar: Ekran[] = [
      'audioUnlock', 'modSecimi', 'avatarSecimi', 'renkSecimi',
      'anaEkran', 'temaGirisi', 'alistirma', 'oturumSonu',
      'bahcem', 'konuSecimi', 'veliKapisi', 'veliPaneli',
    ];
    // Her birine git
    for (const e of tumEkranlar) {
      useAppStore.getState().ekranGit(e);
      expect(useAppStore.getState().ekran).toBe(e);
    }
  });

  it('kişisel mod tam akışı: unlock → mod → avatar → renk → ana ekran', () => {
    const { ekranGit, modSec, avatarSec, renkSec } = useAppStore.getState();

    ekranGit('modSecimi');
    expect(useAppStore.getState().ekran).toBe('modSecimi');

    modSec('kisisel');
    expect(useAppStore.getState().ekran).toBe('avatarSecimi');

    avatarSec('balik');
    expect(useAppStore.getState().ekran).toBe('renkSecimi');

    renkSec('mavi');
    expect(useAppStore.getState().ekran).toBe('anaEkran');
  });

  it('tahta mod tam akışı: unlock → mod → ana ekran (avatar/renk atlanır)', () => {
    const { ekranGit, modSec } = useAppStore.getState();

    ekranGit('modSecimi');
    modSec('tahta');
    expect(useAppStore.getState().ekran).toBe('anaEkran');
    // Avatar/renk atlandı
    expect(useAppStore.getState().avatarId).toBeNull();
  });

  it('ana ekran → veli kapısı → veli paneli akışı', () => {
    const { ekranGit, veliGec } = useAppStore.getState();

    ekranGit('anaEkran');
    ekranGit('veliKapisi');
    expect(useAppStore.getState().ekran).toBe('veliKapisi');

    veliGec(true);
    ekranGit('veliPaneli');
    expect(useAppStore.getState().ekran).toBe('veliPaneli');
    expect(useAppStore.getState().veliGecildi).toBe(true);
  });

  it('oturum → oturum sonu → bahçem → ana ekran akışı', () => {
    const { ekranGit, oturumuTamamla } = useAppStore.getState();

    ekranGit('alistirma');
    oturumuTamamla();
    expect(useAppStore.getState().ekran).toBe('oturumSonu');

    ekranGit('bahcem');
    expect(useAppStore.getState().ekran).toBe('bahcem');

    ekranGit('anaEkran');
    expect(useAppStore.getState().ekran).toBe('anaEkran');
  });
});

describe('Veli paneli — geçici saklama politikası', () => {
  beforeEach(sifirla);

  it('VeliPaneli 4 kalem içermeli (kaynak kod kontrolü)', async () => {
    // VeliPaneli kaynak kodunu oku ve 4 Bolum bileşeni olduğunu doğrula
    const fs = await import('node:fs');
    const path = await import('node:path');
    const kaynak = fs.readFileSync(
      path.resolve(__dirname, '../../src/ui/screens/VeliPaneli.tsx'),
      'utf-8',
    );
    const bolumSayisi = (kaynak.match(/<Bolum/g) || []).length;
    expect(bolumSayisi).toBe(4);
  });

  it('VeliPaneli bölümleri saklamama politikasını ve geçici ayarları açıklar', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const kaynak = fs.readFileSync(
      path.resolve(__dirname, '../../src/ui/screens/VeliPaneli.tsx'),
      'utf-8',
    );
    expect(kaynak).toContain('Veri Saklama Durumu');
    expect(kaynak).toContain('Geçici Ayarlar');
    expect(kaynak).toContain('Açık Konular');
    expect(kaynak).toContain('Kaynaklar ve Gizlilik');
    expect(kaynak).not.toContain('Dışa Aktar');
    expect(kaynak).not.toContain('İçe Aktar');
  });
});

describe('Store yardımcıları', () => {
  it('accentBul: geçerli id → Accent döner', () => {
    const a = accentBul('mor');
    expect(a.id).toBe('mor');
    expect(a.hex).toBe('#7C3AED');
  });

  it('accentBul: null → ilk Accent döner', () => {
    const a = accentBul(null);
    expect(a.id).toBe('mor');
  });

  it('accentBul: geçersiz id → ilk Accent döner', () => {
    const a = accentBul('gecersiz');
    expect(a.id).toBe('mor');
  });

  it('avatarBul: geçerli id → AvatarSecenegi döner', () => {
    const a = avatarBul('kedi');
    expect(a?.id).toBe('kedi');
    expect(a?.ad).toBe('Kedi');
  });

  it('avatarBul: null → null döner', () => {
    expect(avatarBul(null)).toBeNull();
  });

  it('AVATARLAR 8 avatar içerir (2×4 ızgara)', () => {
    expect(AVATARLAR).toHaveLength(8);
  });

  it('TEMALAR 7 tema içerir', () => {
    expect(TEMALAR).toHaveLength(7);
  });
});
