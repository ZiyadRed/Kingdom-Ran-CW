import React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import App from './App.jsx'
import {
  initI18n,
  localeBasename,
  localeFromPathname,
  LocaleProvider,
} from './i18n/index.js'
import './styles/globals.css'
import './styles/castle-controls.css'
import './styles/reference-hubs.css'
import './styles/redesign.css'
import './styles/localization.css'

// ── Locale is resolved from the URL BEFORE React mounts ─────────────────────
// Document language/direction and the Router basename must be correct on the
// first paint (no useEffect, no post-render flash). English URLs resolve to
// the en locale with an empty basename, so existing behavior is unchanged.
const locale = localeFromPathname(window.location.pathname)

document.documentElement.lang = locale.bcp47
document.documentElement.dir = locale.direction

initI18n(locale)

const basename = localeBasename(locale)

const root = document.getElementById('root')
const app = (
  <React.StrictMode>
    <LocaleProvider locale={locale}>
      <BrowserRouter basename={basename}>
        <App />
        <Analytics />
      </BrowserRouter>
    </LocaleProvider>
  </React.StrictMode>
)

// The CDN serves the one English 404 artifact at arbitrary paths/locales. It is
// useful static error content, but cannot be the requested router snapshot.
// Mount that error document in its requested locale; valid route HTML hydrates.
const genericNotFound = document.documentElement.dataset.ranhqDocument === 'not-found'
if (root.hasChildNodes() && !genericNotFound) hydrateRoot(root, app)
else createRoot(root).render(app)
