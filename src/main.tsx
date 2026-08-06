import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './ui/ErrorBoundary.tsx'

/*
 * Hata sınırı EN DIŞTA. Bir render hatası aksi hâlde #root'u tamamen boşaltır
 * ve kullanıcı bembeyaz bir sayfa görür — sınıfta çöken uygulama sessizce
 * çöker (plan §16 risk 7). Sınır, en azından "yeniden dene" sunar.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
