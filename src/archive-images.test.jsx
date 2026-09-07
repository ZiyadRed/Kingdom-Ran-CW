import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ArchiveImage } from './archive-images.jsx'

const image = { src: '/persos/thumbs/moubu.webp', srcSet: '/persos/thumbs/moubu.webp 320w, /persos/moubu.webp 626w', alt: 'Moubu' }

describe('prerendered gallery image requests', () => {
  it('does not emit sources for offscreen art', () => {
    const html = renderToStaticMarkup(<ArchiveImage {...image} enabled />)
    expect(html).not.toMatch(/\ssrc(?:Set)?=/i)
    expect(html).toContain('alt="Moubu"')
  })
  it('withholds even priority sources behind detail', () => {
    expect(renderToStaticMarkup(<ArchiveImage {...image} enabled={false} eager />)).not.toMatch(/\ssrc(?:Set)?=/i)
  })
  it('keeps first-row artwork discoverable in roster HTML', () => {
    const html = renderToStaticMarkup(<ArchiveImage {...image} enabled eager />)
    expect(html).toContain('src="/persos/thumbs/moubu.webp"')
    expect(html).toContain('loading="eager"')
    expect(html).toContain('fetchpriority="high"')
  })
})
