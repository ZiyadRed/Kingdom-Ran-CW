import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import { getLocale } from './locales.js'
import { LocaleProvider, useLocale } from './LocaleContext.jsx'

function Probe() {
  const locale = useLocale()
  return <span data-code={locale.code}>{locale.code}</span>
}

describe('LocaleContext', () => {
  it('exposes the provided locale registry entry to consumers', () => {
    const ja = getLocale('ja')
    const html = renderToString(
      <LocaleProvider locale={ja}>
        <Probe />
      </LocaleProvider>,
    )
    expect(html).toContain('data-code="ja"')
    expect(html).toContain('>ja<')
  })

  it('defaults to English outside a provider', () => {
    const html = renderToString(<Probe />)
    expect(html).toContain('data-code="en"')
  })
})

