import { useEffect, useRef } from 'react'

const openDialogs = []
let previousOverflow = ''
const focusableSelector = 'a[href], button, input, select, textarea, summary, [tabindex], [contenteditable="true"]'

function focusableElements(dialog) {
  return [...dialog.querySelectorAll(focusableSelector)].filter(element =>
    element.tabIndex >= 0 && !element.matches(':disabled') &&
    element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden',
  )
}

// Native modal dialogs exclude the background from focus, pointer interaction
// and the accessibility tree. Keep the existing surface/backdrop styles here.
// Mount only while open; changing dialog content never closes/reopens it.
export default function Dialog({ children, onClose, initialFocus, returnFocus, className = '', ...props }) {
  const ref = useRef(null)
  const focusOptions = useRef(null)
  const backdropPressed = useRef(false)
  focusOptions.current = { initialFocus, returnFocus }

  useEffect(() => {
    const dialog = ref.current
    const opener = document.activeElement
    if (!openDialogs.length) previousOverflow = document.body.style.overflow
    openDialogs.push(dialog)
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    focusOptions.current.initialFocus?.()?.focus({ preventScroll: true })
    return () => {
      dialog.close()
      const index = openDialogs.indexOf(dialog)
      if (index !== -1) openDialogs.splice(index, 1)
      if (!openDialogs.length) document.body.style.overflow = previousOverflow
      const remaining = openDialogs.at(-1)
      const candidates = [focusOptions.current.returnFocus?.(), opener, ...(remaining ? focusableElements(remaining) : [])]
      const target = candidates.find(element => element?.isConnected && !element.matches(':disabled') && element.getClientRects().length && (!remaining || remaining.contains(element)))
      target?.focus({ preventScroll: true })
    }
  }, [])

  const handleKeyDown = event => {
    if (openDialogs.at(-1) !== ref.current) return
    // A populated native search input consumes Escape before dialog cancel.
    // Dismiss the top modal consistently while leaving IME composition alone.
    if (event.key === 'Escape' && !event.nativeEvent.isComposing) {
      event.preventDefault()
      event.stopPropagation()
      onClose()
      return
    }
    if (event.key !== 'Tab') return
    const elements = focusableElements(ref.current)
    const first = elements[0], last = elements.at(-1)
    if (!first) { event.preventDefault(); return }
    const active = document.activeElement
    if (!ref.current.contains(active) || (event.shiftKey ? active === first : active === last)) {
      event.preventDefault()
      const target = event.shiftKey ? last : first
      target.focus()
    }
  }

  return <dialog {...props} ref={ref} className={`ranhq-dialog ${className}`} aria-modal="true"
    onCancel={event => { event.preventDefault(); event.stopPropagation(); onClose() }}
    onKeyDown={handleKeyDown}
    onPointerDown={event => { backdropPressed.current = event.target === event.currentTarget }}
    onClick={event => { if (event.target === event.currentTarget && backdropPressed.current) onClose() }}>
    {children}
  </dialog>
}
