// Validate the per-field JP composer against all character data.
// Usage: node scripts/validate_jp.mjs
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createSkillJP } from '../src/skill-jp.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const J = p => JSON.parse(readFileSync(join(root, p), 'utf-8'))

const conditions = J('data/glossary/conditions.json')
const effects    = J('data/glossary/effects.json')
const skillTypes = J('data/glossary/skill_types.json')
const countries  = J('data/glossary/countries.json')

// roster: norm(name_en) → name_jp
const roster = {}
const charDir = 'data/characters'
for (const f of readdirSync(join(root, charDir))){
  if (!f.endsWith('.json')) continue
  for (const c of J(`${charDir}/${f}`)){
    if (c.name_en && c.name_jp) roster[c.name_en.trim().toLowerCase()] = c.name_jp
  }
}

const jp = createSkillJP({ conditions, effects, skillTypes, countries, roster })

const stats = {}
const misses = {}
for (const k of ['condition','target','effect','duration','type']){ stats[k] = {hit:0, total:0}; misses[k] = {} }

function tally(kind, val){
  if (val == null) return
  stats[kind].total++
  const out = jp[kind](val)
  if (out) stats[kind].hit++
  else misses[kind][val] = (misses[kind][val] || 0) + 1
}

for (const f of readdirSync(join(root, charDir))){
  if (!f.endsWith('.json')) continue
  for (const c of J(`${charDir}/${f}`)){
    for (const sk of c.skills || []){
      tally('type', sk.type)
      for (const e of sk.effects || []){
        tally('condition', e.condition)
        tally('target', e.target)
        tally('effect', e.effect)
        tally('duration', e.duration)
      }
    }
  }
}

let report = '# JP composer coverage\n\n'
let gTotal = 0, gHit = 0
for (const k of ['type','condition','target','effect','duration']){
  const {hit, total} = stats[k]
  gTotal += total; gHit += hit
  const pct = total ? (100*hit/total).toFixed(1) : '—'
  report += `## ${k}: ${hit}/${total} occurrences (${pct}%)\n`
  const ms = Object.entries(misses[k]).sort((a,b)=>b[1]-a[1])
  report += `  distinct misses: ${ms.length}\n`
  for (const [v,n] of ms.slice(0, 60)) report += `  ${String(n).padStart(4)}  ${v}\n`
  report += '\n'
}
report = `**OVERALL: ${gHit}/${gTotal} = ${(100*gHit/gTotal).toFixed(1)}% of field occurrences compose to JP**\n\n` + report
writeFileSync(join(root, '_jp_coverage.md'), report)
console.log(report.split('\n').slice(0,2).join('\n'))
for (const k of ['type','condition','target','effect','duration'])
  console.log(`${k}: ${stats[k].hit}/${stats[k].total}`)
