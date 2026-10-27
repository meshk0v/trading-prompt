import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import I18nProvider from './i18n/I18nProvider'

// iPhone zooms the page in by itself (field focus, a zoom restored on reload) and keeps it zoomed:
// the header slides off-screen, the page pans sideways and the guide highlight misses its target.
// maximum-scale=1 stops that zoom and resets an existing one; iOS still allows pinch zoom with it.
// Elsewhere (Android) it would block pinch zoom, so it is set on iOS only.
const isIOS =
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
if (isIOS) {
  document
    .querySelector('meta[name="viewport"]')
    ?.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <I18nProvider>
    <App />
  </I18nProvider>,
)
