import { PassThrough } from 'node:stream'
import { renderToPipeableStream } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import App from './App.jsx'
import { ALL, FACTIONS } from './core.jsx'
import {
  initI18n,
  localeBasename,
  localeFromPathname,
  LocaleProvider,
} from './i18n/index.js'
import { localizedCharacter, localizedText } from './i18n/data.js'
import { canonicalPath, characterSeo, routeSeo } from './seo.js'

function factionDisplay(faction, locale) {
  if (!faction) return ''
  if (locale.code === 'ja') return faction.jp || faction.label
  if (locale.code === 'ar') return localizedText(faction.label, 'ar')
  return faction.label
}

export function seoForUrl(url) {
  const locale = localeFromPathname(url)
  const appPath = canonicalPath(url)
  const match = /^\/archive\/characters\/([^/]+)$/.exec(appPath)
  if (match) {
    const character = ALL.find((item) => item.id === match[1])
    if (!character) return { ...routeSeo(url, locale), robots: 'noindex,follow' }
    const localized = localizedCharacter(character, locale)
    return characterSeo(character, {
      locale,
      displayName: localized.displayName,
      reading: localized.sourceReading,
      factionName: factionDisplay(FACTIONS.find((item) => item.id === character.country), locale),
    })
  }
  return routeSeo(url, locale)
}

export function render(url) {
  const locale = localeFromPathname(url)
  initI18n(locale)

  return new Promise((resolve, reject) => {
    let renderError = null
    let settled = false
    const timeout = setTimeout(() => {
      if (settled) return
      settled = true
      abort()
      reject(new Error(`SSR timed out for ${url}`))
    }, 20_000)

    const { pipe, abort } = renderToPipeableStream(
      <LocaleProvider locale={locale}>
        <StaticRouter location={url} basename={localeBasename(locale)}>
          <App />
        </StaticRouter>
      </LocaleProvider>,
      {
        onAllReady() {
          if (renderError) {
            settled = true
            clearTimeout(timeout)
            reject(renderError)
            return
          }
          const stream = new PassThrough()
          const chunks = []
          stream.on('data', (chunk) => chunks.push(chunk))
          stream.on('error', (error) => {
            if (settled) return
            settled = true
            clearTimeout(timeout)
            reject(error)
          })
          stream.on('end', () => {
            if (settled) return
            settled = true
            clearTimeout(timeout)
            resolve(chunks.join(''))
          })
          pipe(stream)
        },
        onShellError(error) {
          if (settled) return
          settled = true
          clearTimeout(timeout)
          reject(error)
        },
        onError(error) {
          renderError ||= error
        },
      },
    )
  })
}
