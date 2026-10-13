import './content/schema/zodAyari.ts'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './ui/ErrorBoundary.tsx'
import { ekranSaglayicisiAyarla } from './hata/hataKaydi.ts'
import { useAppStore } from './store/appStore.ts'
import { acilistaTemizle } from './persistence/acilistaTemizle.ts'
import { gelistirmeHatasiTetikle, hataDinleyicileriniKur } from './hata/dinleyiciler.ts'

// Adım 23: yakalanmamış hatalar yalnız bellekteki yerel günlüğe (ADR-0005).
ekranSaglayicisiAyarla(() => useAppStore.getState().ekran)
hataDinleyicileriniKur()
gelistirmeHatasiTetikle()
void acilistaTemizle()

/*
 * Hata sınırı EN DIŞTA. Bir render hatası aksi hâlde #root'u tamamen boşaltır
 * ve kullanıcı bembeyaz bir sayfa görür — sınıfta çöken uygulama sessizce
 * çöker (plan §16 risk 7). Sınır, en azından "yeniden dene" sunar.
 */
const kok = createRoot(document.getElementById('root')!)

// Adım 30: rakam glif kartı YALNIZ geliştirmede (`?gelistirme=glif`); üretim
// derlemesinde DEV `false` olduğundan dal ve dinamik içe aktarma atılır.
if (import.meta.env.DEV && new URLSearchParams(location.search).get('gelistirme') === 'glif') {
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
