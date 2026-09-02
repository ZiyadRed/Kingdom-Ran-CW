import fs from 'node:fs'
import path from 'node:path'
import {
  SITE_URL,
  baseIndexablePaths,
  indexableRoutes,
  localizedVariants,
} from './seo/routes.mjs'

const escapeXml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;')

const entries = baseIndexablePaths().flatMap((basePath) => {
  const variants = localizedVariants(basePath)
  const alternates = [
    ...variants,
    { locale: 'x-default', url: variants.find((variant) => variant.locale === 'en').url },
  ]
  return variants.map((variant) => [
    '  <url>',
    `    <loc>${escapeXml(variant.url)}</loc>`,
    ...alternates.map((alternate) => (
      `    <xhtml:link rel="alternate" hreflang="${alternate.locale}" href="${escapeXml(alternate.url)}" />`
    )),
    '  </url>',
  ].join('\n'))
})

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ...entries,
  '</urlset>',
  '',
].join('\n')

const routes = indexableRoutes()
const text = `${routes.map(({ path: routePath }) => `${SITE_URL}${routePath}`).join('\n')}\n`

fs.writeFileSync(path.resolve('public/sitemap.xml'), xml)
fs.writeFileSync(path.resolve('public/sitemap.txt'), text)
console.log(`generate_sitemap: wrote ${routes.length} canonical localized URLs with reciprocal hreflang annotations`)
