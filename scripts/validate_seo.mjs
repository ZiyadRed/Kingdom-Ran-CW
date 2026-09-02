import fs from 'node:fs'
import path from 'node:path'
import {
  SEO_LOCALES,
  SITE_URL,
  htmlOutputPath,
  indexableRoutes,
  legacyCharacterRoutes,
  localizedVariants,
  renderRoutes,
} from './seo/routes.mjs'

const outputDir = path.resolve('dist')
const failures = []
const pass = (condition, message) => { if (!condition) failures.push(message) }
const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''

function attribute(tag, name) {
  return new RegExp(`\\b${name}=["']([^"']*)["']`, 'i').exec(tag)?.[1] || ''
}

function metaContent(html, key) {
  const tags = html.match(/<meta\b[^>]*>/gi) || []
  const tag = tags.find((item) => attribute(item, 'name') === key || attribute(item, 'property') === key)
  return tag ? attribute(tag, 'content') : ''
}

function linkHref(html, rel, hreflang = null) {
  const tags = html.match(/<link\b[^>]*>/gi) || []
  const tag = tags.find((item) => (
    attribute(item, 'rel') === rel
    && (hreflang === null || attribute(item, 'hreflang') === hreflang)
  ))
  return tag ? attribute(tag, 'href') : ''
}

function titleOf(html) {
  return /<title>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.trim() || ''
}

function schemaOf(html) {
  const raw = /<script\b[^>]*\bid=["']ranhq-schema["'][^>]*>([\s\S]*?)<\/script>/i.exec(html)?.[1]
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return false }
}

function basePath(route) {
  if (route.locale === 'en') return route.path
  return route.path === `/${route.locale}` ? '/' : route.path.slice(3)
}

function validateDocument(route, indexable = true) {
  const file = htmlOutputPath(outputDir, route.path)
  const html = read(file)
  pass(Boolean(html), `${route.path}: prerendered HTML is missing`)
  if (!html) return

  const expectedUrl = `${SITE_URL}${route.path}`
  const title = titleOf(html)
  const description = metaContent(html, 'description')
  const robots = metaContent(html, 'robots')
  const minimumDescriptionLength = route.locale === 'ja' ? 24 : route.locale === 'ar' ? 35 : 45
  pass(title.length >= 20, `${route.path}: title is missing or too generic`)
  pass(description.length >= minimumDescriptionLength, `${route.path}: description is missing or too thin`)
  pass(linkHref(html, 'canonical') === expectedUrl, `${route.path}: canonical does not match ${expectedUrl}`)
  pass(robots.includes(indexable ? 'index' : 'noindex'), `${route.path}: robots is not ${indexable ? 'indexable' : 'noindex'}`)
  pass(!/<meta\b[^>]*(?:name|property)=["']keywords["']/i.test(html), `${route.path}: obsolete keywords meta remains`)
  pass(new RegExp(`<html\\s+lang=["']${route.locale}["']\\s+dir=["']${route.locale === 'ar' ? 'rtl' : 'ltr'}["']`, 'i').test(html), `${route.path}: html language/direction is wrong`)
  pass((html.match(/<h1\b/gi) || []).length === 1, `${route.path}: expected exactly one visible H1`)
  pass(/<div id=["']root["']>\s*<(?!\/div>)/i.test(html), `${route.path}: first-response root is empty`)

  const variants = localizedVariants(basePath(route))
  for (const variant of variants) {
    pass(linkHref(html, 'alternate', variant.locale) === variant.url, `${route.path}: ${variant.locale} hreflang is missing or wrong`)
  }
  pass(linkHref(html, 'alternate', 'x-default') === variants[0].url, `${route.path}: x-default hreflang is missing or wrong`)

  const schema = schemaOf(html)
  pass(schema && schema !== false, `${route.path}: JSON-LD is missing or invalid`)
  if (schema && schema !== false) {
    pass(schema['@context'] === 'https://schema.org', `${route.path}: JSON-LD context is invalid`)
    pass(Array.isArray(schema['@graph']), `${route.path}: JSON-LD graph is missing`)
    const serialized = JSON.stringify(schema)
    pass(!/"@type":"(?:Product|Person|Review|AggregateRating)"/.test(serialized), `${route.path}: unsupported rich-result type is present`)
  }
}

const indexable = indexableRoutes()
for (const route of indexable) validateDocument(route, true)

const titleOwners = new Map()
for (const route of indexable) {
  const html = read(htmlOutputPath(outputDir, route.path))
  const key = `${route.locale}:${titleOf(html)}`
  const owners = titleOwners.get(key) || []
  owners.push(route.path)
  titleOwners.set(key, owners)
}
for (const [key, owners] of titleOwners) {
  pass(owners.length === 1, `duplicate localized title ${key}: ${owners.join(', ')}`)
}

const nonIndexable = renderRoutes().filter((route) => !indexable.some((item) => item.path === route.path))
for (const route of nonIndexable) validateDocument(route, false)

for (const route of legacyCharacterRoutes()) {
  const html = read(htmlOutputPath(outputDir, route.path))
  pass(Boolean(html), `${route.path}: legacy character document is missing`)
  if (!html) continue
  pass(linkHref(html, 'canonical') === `${SITE_URL}${route.canonicalPath}`, `${route.path}: legacy canonical is wrong`)
  pass((html.match(/<h1\b/gi) || []).length === 1, `${route.path}: legacy document should retain one H1`)
}

const notFound = read(path.join(outputDir, '404.html'))
pass(Boolean(notFound), '404.html is missing')
pass(metaContent(notFound, 'robots').includes('noindex'), '404.html must be noindex')
pass((notFound.match(/<h1\b/gi) || []).length === 1, '404.html must have one H1')

const sitemap = read(path.resolve('public/sitemap.xml'))
pass(sitemap.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"'), 'sitemap.xml is missing the xhtml namespace')
pass(!/<(?:lastmod|priority|changefreq)>/i.test(sitemap), 'sitemap.xml contains unsupported or unverifiable metadata')
pass((sitemap.match(/<url>/g) || []).length === indexable.length, `sitemap.xml URL count is not ${indexable.length}`)
for (const route of indexable) {
  const loc = `<loc>${SITE_URL}${route.path}</loc>`
  const start = sitemap.indexOf(loc)
  pass(start >= 0, `${route.path}: missing from sitemap.xml`)
  if (start < 0) continue
  const blockStart = sitemap.lastIndexOf('<url>', start)
  const blockEnd = sitemap.indexOf('</url>', start)
  const block = sitemap.slice(blockStart, blockEnd)
  for (const variant of localizedVariants(basePath(route))) {
    pass(block.includes(`hreflang="${variant.locale}" href="${variant.url}"`), `${route.path}: sitemap ${variant.locale} alternate is wrong`)
  }
  pass(block.includes(`hreflang="x-default" href="${localizedVariants(basePath(route))[0].url}"`), `${route.path}: sitemap x-default alternate is wrong`)
}
for (const route of nonIndexable) pass(!sitemap.includes(`<loc>${SITE_URL}${route.path}</loc>`), `${route.path}: noindex route leaked into sitemap.xml`)

const sitemapText = read(path.resolve('public/sitemap.txt')).trim().split(/\r?\n/).filter(Boolean)
pass(sitemapText.length === indexable.length, `sitemap.txt URL count is not ${indexable.length}`)
pass(new Set(sitemapText).size === sitemapText.length, 'sitemap.txt contains duplicate URLs')

const robots = read(path.resolve('public/robots.txt'))
pass(/User-agent:\s*\*/i.test(robots) && /Allow:\s*\//i.test(robots), 'robots.txt does not allow public crawling')
pass(robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`), 'robots.txt is missing the XML sitemap')
pass(!robots.includes('sitemap.txt'), 'robots.txt should advertise only the XML sitemap')

const vercel = JSON.parse(read(path.resolve('vercel.json')))
pass(vercel.cleanUrls === true, 'vercel.json cleanUrls must be true')
pass(vercel.trailingSlash === false, 'vercel.json trailingSlash must be false')
pass(!vercel.rewrites?.some((rule) => rule.source === '/(.*)'), 'vercel.json still has the soft-404 catch-all rewrite')

pass(SEO_LOCALES.length === 3, 'SEO locale registry unexpectedly changed')

if (failures.length) {
  console.error(`validate_seo: FAIL (${failures.length})`)
  failures.slice(0, 80).forEach((failure) => console.error(`- ${failure}`))
  if (failures.length > 80) console.error(`- ... ${failures.length - 80} more`)
  process.exit(1)
}

console.log(`validate_seo: PASS (${indexable.length} canonical URLs, ${legacyCharacterRoutes().length} legacy URLs, ${nonIndexable.length} noindex application URLs, real 404 artifact)`)
