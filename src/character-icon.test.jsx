import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CharIcon, findCharById } from './core.jsx'

describe('character icon server snapshot', () => {
  it('keeps the authentic first source, dimensions, class and priority before hydration', () => {
    const character = findCharById('moubu')
    const html = renderToStaticMarkup(<CharIcon c={character} size={64} eager className="detail-portrait" />)
    expect(html).toContain(`src="${character.icon}"`)
    expect(html).not.toContain('/persos/thumbs/')
    expect(html).toContain('width:64px;height:64px;border-radius:8px')
    expect(html).toContain('class="detail-portrait"')
    expect(html).toContain('loading="eager"')
    expect(html).toContain('fetchpriority="high"')
  })

  it('uses the existing thumbnail immediately when the icon path is absent', () => {
    const character = { ...findCharById('moubu'), icon: null }
    const html = renderToStaticMarkup(<CharIcon c={character} round />)
    expect(html).toContain('src="/persos/thumbs/moubu.webp"')
    expect(html).toContain('border-radius:50%')
    expect(html).toContain('loading="lazy"')
  })

  it('makes a source-less initial an accessible image without requesting an empty URL', () => {
    const character = { ...findCharById('moubu'), icon: null, image: null, displayName: 'Moubu' }
    const html = renderToStaticMarkup(<CharIcon c={character} />)
    expect(html).toContain('role="img" aria-label="Moubu"')
    expect(html).toContain('>M</div>')
    expect(html).not.toContain('<img')
    expect(html).not.toContain('src=')
  })
})
