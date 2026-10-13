import './content/schema/zodAyari.ts'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './ui/ErrorBoundary.tsx'
import { ekranSaglayicisiAyarla } from './hata/hataKaydi.ts'
import { useAppStore } from './store/appStore.ts'
import { acilistaTemizle } from './persistence/acilistaTemizle.ts'
import { eveLinkiAcilistaOku, tarayiciAdresi } from './platform/eveLinkAcilis.ts'
import { ayarKodunuAcilistaOku } from './platform/ayarKoduAdres.ts'
import { gelistirmeHatasiTetikle, hataDinleyicileriniKur } from './hata/dinleyiciler.ts'

// Adım 23: yakalanmamış hatalar yalnız bellekteki yerel günlüğe (ADR-0005).
ekranSaglayicisiAyarla(() => useAppStore.getState().ekran)
hataDinleyicileriniKur()
gelistirmeHatasiTetikle()
void acilistaTemizle()
// Adım 48: `?arsiv=<kâğıt kodu>` yalnız kâğıdı çizer (arşiv PDF üreticisi için); uygulama açılmaz.
const arsivKodu = new URLSearchParams(location.search).get('arsiv')
// Adım 42: eve link hash'i okunur ve adresten hemen silinir (ADR-0010); set yalnız bellekte.
useAppStore.getState().evSetiAyarla(eveLinkiAcilistaOku(tarayiciAdresi()))
// Adım 55: `#ayar=` (tahtada öğretmenin yer imi) kapsayıcılık ayarlarını belleğe alır; hash adreste kalır.
const acilisAyarlari = ayarKodunuAcilistaOku(tarayiciAdresi())
if (acilisAyarlari) useAppStore.getState().kapsayicilikAyarla(acilisAyarlari)

/*
 * Hata sınırı EN DIŞTA. Bir render hatası aksi hâlde #root'u tamamen boşaltır
 * ve kullanıcı bembeyaz bir sayfa görür — sınıfta çöken uygulama sessizce
 * çöker (plan §16 risk 7). Sınır, en azından "yeniden dene" sunar.
 */
const kok = createRoot(document.getElementById('root')!)

// Adım 30: rakam glif kartı YALNIZ geliştirmede (`?gelistirme=glif`); üretim
// derlemesinde DEV `false` olduğundan dal ve dinamik içe aktarma atılır.
if (arsivKodu) {
  void import('./ui/print/ArsivKagidi.tsx').then(({ ArsivKagidi }) => kok.render(<ArsivKagidi kod={arsivKodu} />))
} else if (import.meta.env.DEV && new URLSearchParams(location.search).get('gelistirme') === 'glif') {
  void import('./dev/GlifKarti.tsx').then(({ GlifKarti }) => kok.render(<GlifKarti />))
} else {
  kok.render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  )
}
