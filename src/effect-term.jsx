import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocale } from './i18n/index.js'
import { effectTermInfo } from './effect-glossary.js'

// Only one effect explanation is visible at a time across the page.
let closeActiveTip = null

const NAME_SEPARATOR = { ja: '：', fr: ' : ' }

/**
 * A skill effect with its status keywords marked, e.g. 「錯乱」付与確率20%.
 *
 * `segments` come from effectTermSegments(). Each keyword is a small
 * toggletip: hovering or keyboard focus shows what the effect does, and a tap
 * or click pins it open until the next tap elsewhere. Screen readers get the
 * same text as the keyword's description (`describedBy` names the element,
 * rendered once per card by EffectTermDescriptions).
 */
export function EffectText({ segments, describedBy }) {
  return segments.map((segment, index) => (
    <Fragment key={index}>
      {typeof segment === 'string' ? segment : <EffectTerm term={segment.term} text={segment.text} describedBy={describedBy?.(segment.term)}/>}
    </Fragment>
  ))
}

/** One hidden description per keyword on a card, referenced by aria-describedby. */
export function EffectTermDescriptions({ terms, describedBy }) {
  const locale = useLocale()
  if (!terms.length) return null
  const separator = NAME_SEPARATOR[locale.code] || ': '
  return (
    <div hidden>
      {terms.map(term => {
        const info = effectTermInfo(term, locale)
        return <span key={term.key} id={describedBy(term)}>{`${info.name}${separator}${info.description}`}</span>
      })}
    </div>
  )
}

function EffectTerm({ term, text, describedBy }) {
  const locale = useLocale()
  const info = effectTermInfo(term, locale)
  const buttonRef = useRef(null)
  const tipRef = useRef(null)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [position, setPosition] = useState(null)
  const open = !dismissed && (hovered || focused || pinned)

  const close = useCallback(() => {
    setHovered(false)
    setFocused(false)
    setPinned(false)
  }, [])

  // Keep a single explanation on screen.
  useEffect(() => {
    if (!open) return undefined
    if (closeActiveTip && closeActiveTip !== close) closeActiveTip()
    closeActiveTip = close
    return () => { if (closeActiveTip === close) closeActiveTip = null }
  }, [open, close])

  // The explanation is placed with fixed coordinates in a portal, so the
  // scrolling detail panel can never clip it. It sits below the keyword, or
  // above it when there is no room, and always inside the viewport.
  useEffect(() => {
    if (!open) { setPosition(null); return undefined }
    let frame = 0
    const place = () => {
      const button = buttonRef.current
      const tip = tipRef.current
      if (!button || !tip) return
      const rect = button.getBoundingClientRect()
      const margin = 8
      const gap = 6
      const viewportWidth = document.documentElement.clientWidth || window.innerWidth
      const viewportHeight = window.innerHeight
      const width = tip.offsetWidth
      const height = tip.offsetHeight
      const left = Math.max(margin, Math.min(rect.left + rect.width / 2 - width / 2, viewportWidth - width - margin))
      const below = rect.bottom + gap
      const above = rect.top - gap - height
      const placement = below + height > viewportHeight - margin && above >= margin ? 'above' : 'below'
      setPosition({ left, top: placement === 'above' ? above : below, placement })
    }
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(place)
    }
    schedule()
    window.addEventListener('scroll', schedule, true)
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule, true)
      window.removeEventListener('resize', schedule)
    }
  }, [open])

  // Escape hides it; a tap or click anywhere else releases a pinned one.
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = event => {
      if (event.key === 'Escape') {
        setPinned(false)
        setDismissed(true)
      }
    }
    const onPointerDown = event => {
      if (buttonRef.current?.contains(event.target) || tipRef.current?.contains(event.target)) return
      // A press elsewhere means the pointer is no longer on the keyword, even
      // when no pointerleave arrived (some touch browsers and emulators).
      setPinned(false)
      setHovered(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`eff-term eff-term-${info.kind}${open ? ' is-open' : ''}`}
        aria-describedby={describedBy}
        data-effect-term={term.key}
        onPointerEnter={event => { if (event.pointerType === 'mouse') setHovered(true) }}
        onPointerLeave={event => {
          if (event.pointerType !== 'mouse') return
          setHovered(false)
          setDismissed(false)
        }}
        onFocus={event => {
          // Keyboard focus explains the keyword; a tap is handled by onClick.
          // Browsers that predate :focus-visible throw on the selector.
          let keyboard = true
          try { keyboard = event.currentTarget.matches(':focus-visible') } catch { /* treat as keyboard focus */ }
          if (keyboard) setFocused(true)
        }}
        onBlur={() => {
          setFocused(false)
          setDismissed(false)
        }}
        onClick={() => {
          setDismissed(false)
          setPinned(value => !value)
        }}
      >
        {text}
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <span
          ref={tipRef}
          className={`eff-tip eff-tip-${info.kind}${position ? ` eff-tip-${position.placement}` : ''}`}
          aria-hidden="true"
          lang={locale.code}
          dir={locale.direction}
          style={position ? { left: position.left, top: position.top } : { left: 0, top: 0, visibility: 'hidden' }}
        >
          <span className="eff-tip-head">
            {info.icon && <img className="eff-tip-icon" src={info.icon} alt="" width="20" height="20" decoding="async"/>}
            <span className="eff-tip-name">{info.name}</span>
          </span>
          <span className="eff-tip-desc">{info.description}</span>
        </span>,
        document.body,
      )}
    </>
  )
}
