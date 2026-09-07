import { Component, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

function RouteFailure({ error }) {
  const { t } = useTranslation('common')
  const heading = useRef(null)
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false
  const network = offline || /fetch dynamically imported module|importing a module script|loading (?:css )?chunk|chunkloaderror|css_chunk_load_failed/i.test(error?.message || '')
  useEffect(() => { heading.current?.focus() }, [])
  return (
    <div className="not-found-page route-error" aria-labelledby="route-error-title">
      <h1 id="route-error-title" tabIndex={-1} ref={heading}>{t(offline ? 'routeErrorOffline' : 'routeErrorTitle')}</h1>
      <p role="alert">{t(network ? 'routeErrorNetwork' : 'routeErrorRender')}</p>
      <p>{t('routeErrorSaved')}</p>
      <div className="not-found-actions route-error-actions">
        {/* React.lazy caches a rejected import. An explicit reload also obtains
            the current deployment's asset URLs; never retry or reload in a loop. */}
        <button type="button" onClick={() => window.location.reload()}>{t('routeErrorReload')}</button>
        <Link to="/">{t('routeErrorHome')}</Link>
      </div>
    </div>
  )
}

export default class RouteErrorBoundary extends Component {
  state = { hasError: false, error: null, resetKey: this.props.resetKey }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  static getDerivedStateFromProps(props, state) {
    // Reset failures on navigation without key-remounting healthy route content
    // (Archive's faction, query and scroll state must survive detail navigation).
    return props.resetKey !== state.resetKey ? { hasError: false, error: null, resetKey: props.resetKey } : null
  }

  componentDidCatch(error, info) {
    console.error('RanHQ route failed:', error, info.componentStack)
  }

  render() {
    return this.state.hasError ? <RouteFailure error={this.state.error} /> : this.props.children
  }
}
