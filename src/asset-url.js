import versions from './asset-versions.json'

export function versionPublicAsset(url) {
  if (typeof url !== 'string') return url
  const [path, fragment] = url.split('#', 2)
  const [pathname, search] = path.split('?', 2)
  const version = versions[pathname]
  if (!version) return url
  const query = new URLSearchParams(search || '')
  query.set('v', version)
  return `${pathname}?${query}${fragment === undefined ? '' : `#${fragment}`}`
}

export function versionedPersosThumb(url) {
  if (!url?.startsWith('/persos/')) return url
  const pathname = url.split(/[?#]/, 1)[0]
  return versionPublicAsset(pathname.replace('/persos/', '/persos/thumbs/'))
}
