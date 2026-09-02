// Validate semantic i18n catalog parity without starting the browser runtime.
// This is intentionally a small structural gate: it catches missing keys and
// accidental extra keys while allowing translated values to differ naturally.
import { CATALOGS } from '../../src/i18n/i18n.js'

function flatten(value, prefix = '', output = new Set()) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return output
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (child && typeof child === 'object' && !Array.isArray(child)) flatten(child, path, output)
    else output.add(path)
  }
  return output
}

// CLDR plural categories differ per language: English needs `one`/`other`,
// Arabic needs up to six. A locale may therefore carry plural variants the
// English baseline does not have, so a variant is checked against its stem
// instead of being reported as an unexpected key.
const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/

function pluralStem(key) {
  return key.replace(PLURAL_SUFFIX, '')
}

const baseline = flatten(CATALOGS.en)
const baselineStems = new Set([...baseline].map(pluralStem))
const errors = []
for (const code of ['ja', 'ar']) {
  const current = flatten(CATALOGS[code])
  const currentStems = new Set([...current].map(pluralStem))
  for (const key of baseline) {
    if (current.has(key)) continue
    // A base key satisfied only by plural variants is still covered.
    if (PLURAL_SUFFIX.test(key) && currentStems.has(pluralStem(key))) continue
    errors.push(`${code}: missing ${key}`)
  }
  for (const key of current) {
    if (baseline.has(key)) continue
    if (PLURAL_SUFFIX.test(key) && baselineStems.has(pluralStem(key))) continue
    errors.push(`${code}: unexpected ${key}`)
  }
}

if (errors.length) {
  console.error(`Locale catalog validation FAILED with ${errors.length} error(s):`)
  for (const error of errors) console.error(`  ERROR: ${error}`)
  process.exit(1)
}

console.log(`Locale catalog validation passed (${baseline.size} semantic keys across en/ja/ar).`)
