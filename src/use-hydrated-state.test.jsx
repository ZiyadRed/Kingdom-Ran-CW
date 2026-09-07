import { describe, expect, it, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import { useHydratedState } from './use-hydrated-state.js'

describe('deterministic hydration snapshot', () => {
  it('renders the public default without reading saved browser data during render', () => {
    const readSaved = vi.fn(() => ({ count: 8 }))
    function Fixture() {
      const [state, , changed] = useHydratedState(() => ({ count: 0 }), readSaved)
      return <output data-changed={changed}>{state.count}</output>
    }
    expect(renderToString(<Fixture />)).toBe('<output data-changed="false">0</output>')
    expect(readSaved).not.toHaveBeenCalled()
  })
})
