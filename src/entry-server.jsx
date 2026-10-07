import { renderToReadableStream } from 'react-dom/server.browser'
import { StaticRouter } from 'react-router-dom'
import App from './App.jsx'
import { findCharById, FACTIONS } from './core.jsx'
import {
  initI18n,
  localeBasename,
  localeFromPathname,
  LocaleProvider,
} from './i18n/index.js'
import { localizedCharacter, localizedText } from './i18n/data.js'
import { characterRouteId, characterSeo, routeSeo } from './seo.js'

function factionDisplay(faction, locale) {
  if (!faction) return ''
  if (locale.code === 'ja') return faction.jp || faction.label
  // Arabic and French both name the factions through their own lexicon; every
  // other locale keeps the English label.
  return localizedText(faction.label, locale)
}

export function seoForUrl(url) {
  const locale = localeFromPathname(url)
  const id = characterRouteId(url)
  if (id) {
    const character = findCharById(id)
    if (!character) return routeSeo(url, locale)
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

export async function render(url) {
  const locale = localeFromPathname(url)
  initI18n(locale)

  let renderError = null
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(new Error(`SSR timed out for ${url}`)), 20_000)
  try {
    // React 18's Node string writer emits unused NUL bytes when a multibyte
    // character cannot fit at the end of a 2048-byte view. The Web writer
    // encodes each string first, then splits bytes without padding the text.
    const stream = await renderToReadableStream(
      <LocaleProvider locale={locale}>
        <StaticRouter location={url} basename={localeBasename(locale)}>
          <App />
        </StaticRouter>
      </LocaleProvider>,
      {
        signal: controller.signal,
        onError(error) {
          renderError ||= error
        },
      },
    )
    await stream.allReady
    if (renderError) throw renderError
    return await new Response(stream).text()
  } finally {
    clearTimeout(timeout)
  }
}
