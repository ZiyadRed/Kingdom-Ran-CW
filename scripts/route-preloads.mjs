import { selectedRouteSource } from '../src/route-modules.js'

// Only static imports belong to the selected feature's initial graph. Following
// dynamicImports here would make Home/Guide download unrelated tools and data.
export function routePreloads(manifest, canonicalPath, existing = []) {
  const source = selectedRouteSource(canonicalPath)
  const scripts = new Set(), styles = new Set(), visited = new Set()
  const present = new Set(existing.map(file => file.replace(/^\//, '')))
  const visit = key => {
    if (visited.has(key)) return
    visited.add(key)
    const chunk = manifest[key]
    if (!chunk?.file) throw new Error(`Missing route manifest entry: ${key}`)
    if (!present.has(chunk.file)) scripts.add(`/${chunk.file}`)
    for (const file of chunk.css || []) if (!present.has(file)) styles.add(`/${file}`)
    for (const imported of chunk.imports || []) visit(imported)
  }
  if (source) visit(source)
  return { scripts: [...scripts], styles: [...styles] }
}
