import { describe, expect, it } from 'vitest'
import { render } from './entry-server.jsx'

describe('Japanese prerendered text', () => {
  it('preserves multibyte labels across stream boundaries after lazy routes resolve', async () => {
    const html = await render('/ja/buffs')
    expect(html.includes(String.fromCharCode(0))).toBe(false)
    expect(html.includes('\ufffd')).toBe(false)
    expect(html).toContain('岳雷 — 防御力 — CW6★追想カード')
    expect(html).toContain('白翠 — 回避率 — CW6★追想カード')
    expect(html).not.toContain('読み込み中')
  })
})
