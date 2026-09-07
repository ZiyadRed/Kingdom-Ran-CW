// These are the same entry modules used by React.lazy and by build-time route
// preloading. Keeping the loader with its manifest key prevents the build from
// preloading an unrelated feature when a route's ownership changes.
export const ROUTE_MODULES = {
  pages: { source: 'src/pages.jsx', load: () => import('./pages.jsx') },
  buffs: { source: 'src/features/buffs/BuffsPage.jsx', load: () => import('./features/buffs/BuffsPage.jsx') },
  stats: { source: 'src/cwstats.jsx', load: () => import('./cwstats.jsx') },
  guide: { source: 'src/guide.jsx', load: () => import('./guide.jsx') },
  castle: { source: 'src/castlepoints.jsx', load: () => import('./castlepoints.jsx') },
}

export function selectedRouteSource(canonicalPath) {
  if (canonicalPath === '/buffs') return ROUTE_MODULES.buffs.source
  if (canonicalPath === '/guide' || canonicalPath.startsWith('/guide/')) return ROUTE_MODULES.guide.source
  if (canonicalPath === '/cw-stats') return ROUTE_MODULES.stats.source
  if (canonicalPath === '/castle-points') return ROUTE_MODULES.castle.source
  if (canonicalPath === '/archive' || canonicalPath.startsWith('/archive/') || ['/builder', '/sim', '/tiers', '/cost'].includes(canonicalPath)) return ROUTE_MODULES.pages.source
  return null // Home and not-found content are already in the entry module.
}
