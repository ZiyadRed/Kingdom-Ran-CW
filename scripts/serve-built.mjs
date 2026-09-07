// Local acceptance server for the prerendered output. Never use an SPA fallback:
// unknown routes must exercise the same 404 artifact/status as static hosting.
import { readFileSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const root = resolve(repo, process.env.RANHQ_TEST_DIST || 'dist')
const port = Number(process.env.RANHQ_TEST_PORT || 4188)
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid RANHQ_TEST_PORT')
for (const name of ['index.html', '404.html', '.vite/manifest.json']) readFileSync(resolve(root, name))
const rules = JSON.parse(readFileSync(resolve(repo, 'vercel.json'), 'utf8')).headers || []
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon',
}
createServer((request, response) => {
  let pathname
  try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname) }
  catch { response.writeHead(400); response.end(); return }
  if (pathname.includes('\0')) { response.writeHead(400); response.end(); return }
  const relative = pathname.replace(/^\/+|\/+$/g, '')
  const candidates = relative ? [relative, relative + '.html', relative + '/index.html'] : ['index.html']
  const file = candidates.map(name => resolve(root, name)).find(name => {
    if (!name.startsWith(root + sep)) return false
    try { return statSync(name).isFile() } catch { return false }
  })
  const target = file || resolve(root, '404.html')
  const headers = { 'Cache-Control': 'no-store', 'Content-Type': types[extname(target)] || 'application/octet-stream' }
  for (const rule of rules) if (new RegExp('^' + rule.source + '$').test(pathname)) {
    for (const header of rule.headers) headers[header.key] = header.value
  }
  try {
    const bytes = readFileSync(target)
    response.writeHead(file ? 200 : 404, { ...headers, 'Content-Length': bytes.length })
    response.end(request.method === 'HEAD' ? undefined : bytes)
  } catch {
    response.writeHead(503, { 'Content-Type': 'text/plain' })
    response.end('Built output changed; finish the build before running acceptance tests.')
  }
}).listen(port, '127.0.0.1', () => console.log(`Built RanHQ: http://127.0.0.1:${port}`))
