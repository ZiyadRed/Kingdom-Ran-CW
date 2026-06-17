// ─────────────────────────────────────────────────────────────────────────────
// skill-jp.js — Per-field Japanese composer for skill effect rows.
//
// The site stores each skill effect as English structured fields
// (condition / target / effect / duration / type). The ORIGINAL Japanese game
// vocabulary lives in data/glossary/*.json, keyed JP → EN. This module reverses
// those maps and recomposes the original Japanese for each field: every Japanese
// token comes straight from the game glossary — only numbers pass through and
// grammar is assembled. Nothing is guess-translated.
//
// Runtime-agnostic: `createSkillJP(glossaries)` is called by the app with the
// imported JSON, and by scripts/validate_jp.mjs with fs-loaded JSON, so there is
// a single source of truth for the logic.
// ─────────────────────────────────────────────────────────────────────────────

// Normalize an English string for lookup: trim, collapse whitespace, lowercase,
// fold full-width percent, strip [bracket] and 「」/" " quote notation.
function norm(s){
  return String(s)
    .replace(/[［\[]([^\]］]*)[\]］]/g, '$1') // [Cavalry] → Cavalry
    .replace(/[「」""„""'']/g, '')           // strip quotes
    .replace(/／/g, '/')
    .replace(/[％]/g, '%')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

const NUM = '([0-9][0-9.,]*)'

// ── Original-game atom dictionaries (EN token → JP) ──────────────────────────
const ENTITY = { enemy: '敵', ally: '味方' }
const DIR    = { highest: '最も高い', lowest: '最も低い' }
const UNIT = {
  'general': '武将', 'generals': '武将',
  'archer general': '弓兵武将', 'archer generals': '弓兵武将',
  'cavalry general': '騎兵武将', 'cavalry generals': '騎兵武将',
  'shield soldier general': '盾兵武将',
  'infantry general': '歩兵武将',
  'archer': '弓兵', 'archers': '弓兵',
  'cavalry': '騎兵',
  'infantry': '歩兵',
  'shield': '盾兵', 'shield soldier': '盾兵', 'shield soldiers': '盾兵',
  'siege weapon': '兵器', 'siege weapons': '兵器',
}
const METRIC = {
  'remaining hp': '残り体力', 'remaining health': '残り体力',
  'remaining strength': '残り体力',
  'hp': '体力', 'health': '体力',
  'max hp': '体力上限', 'max health': '体力上限', 'maximum hp': '体力上限',
  'remaining morale': '残り士気',
  'max morale': '最大士気', 'maximum morale': '最大士気', 'morale': '士気',
  'atk': '攻撃力', 'attack': '攻撃力', 'attack power': '攻撃力',
  'def': '防御力', 'defense': '防御力', 'defence': '防御力',
}
const COUNTRY = {
  qin: '秦国', zhao: '趙国', chu: '楚国', wei: '魏国', han: '韓国',
  yan: '燕国', qi: '斉国', ai: '毐国',
}
const TERRAIN = {
  water: '水地形', slope: '坂地形', forest: '森地形', marsh: '沼地形',
  checkpoint: '関所', ambush: '伏兵地形',
}
// Status ailments for "Poisoned/Feared/..." enemy targeting and infliction.
const AILMENT = {
  poison: '毒', poisoned: '毒',
  burn: '火傷', burned: '火傷',
  paralysis: '麻痺', paralyzed: '麻痺',
  confusion: '錯乱', confused: '錯乱',
  fear: '恐怖', feared: '恐怖', frightened: '恐怖',
  betrayal: '裏切り', 'betrayal-afflicted': '裏切り', betrayed: '裏切り',
}
const CONSUME = {
  'coin consumption down': '消費貨幣量↓', 'currency cost down': '消費貨幣量↓',
  'material consumption down': '消費資材量↓', 'material cost down': '消費資材量↓',
  'ore consumption down': '消費鉱石量↓', 'ore cost down': '消費鉱石量↓',
}

export function createSkillJP(g){
  const { conditions = {}, effects = {}, skillTypes = {}, roster = {} } = g

  function reverse(obj){
    const m = new Map()
    for (const [jp, v] of Object.entries(obj)){
      if (jp.startsWith('_')) continue
      if (typeof v !== 'object' || v === null) continue
      if (!v.en) continue
      const k = norm(v.en)
      if (!m.has(k)) m.set(k, jp)
    }
    return m
  }
  const condMap = reverse(conditions)   // also holds all target terms
  const effMap  = reverse(effects)

  // Supplemental original-game atoms not yet in the glossary files.
  const condExtra = new Map(Object.entries({
    'surviving': '生存している', 'alive': '生存している',
    'random': 'ランダム',
    'enemy generals': '敵武将',
    'gate hp remaining': '城門残り体力',
    'betrayal-afflicted': '「裏切り」状態',
    'when ally is alive': '味方が生存',
    'when repairing cw siege weapons': '争覇兵器の修理時',
    'siege weapon repair': '兵器修理時',
    'cw battle (active even when not deployed)': '争覇戦時（未編成でも適用）',
    'cw battle (effective even when not deployed)': '争覇戦時（未編成でも適用）',
    'cw battle (effective even if not deployed)': '争覇戦時（未編成でも適用）',
    'at the time of garrison': '駐屯時',
  }))
  const targetExtra = new Map(Object.entries({
    'enemy generals': '敵武将', 'ally generals': '味方武将',
    'other ally': '自身以外', 'passing unit': '通過部隊',
    'passing squad': '通過部隊', 'mountain folk': '山の民',
    'ally mountain folk': '味方山の民', 'siege weapon repair': '兵器修理',
    'ally defense siege weapons': '味方防衛兵器',
  }))
  const effExtra = new Map(Object.entries({
    'def penetration up': '防御力貫通↑',
    'def penetration': '防御力貫通',
    'reckless': '捨て身', 'dodge chance': '見切り', 'dodge': '見切り',
    'evasion up': '回避率↑', 'evasion down': '回避率↓',
    'hp seal': '体力回復無効', 'hp recovery nullification': '体力回復無効',
    'morale consumption down': '士気消費↓', 'morale consumption reduction': '士気消費軽減',
  }))

  // ── duration ────────────────────────────────────────────────────────────────
  function duration(s){
    if (s == null) return null
    const t = norm(s)
    let m
    if ((m = t.match(new RegExp(`^${NUM} turns?$`)))) return `${m[1]}ターン`
    if ((m = t.match(new RegExp(`^${NUM} times?$`)))) return `${m[1]}回`
    return null
  }

  // Map a unit phrase (possibly with a country prefix) to JP. Returns '' if the
  // phrase is empty (bare "enemy"/"ally" → defaults to 武将 at call sites).
  function unitJP(phrase){
    const p = norm(phrase)
    if (!p) return ''
    if (UNIT[p]) return UNIT[p]
    // "qin general" / "qin" → 秦国(+武将)
    const cm = p.match(/^(qin|zhao|chu|wei|han|yan|qi|ai)(?:\s+(.*))?$/)
    if (cm){
      const c = COUNTRY[cm[1]]
      const rest = cm[2] ? (UNIT[cm[2]] || '') : ''
      return c + rest
    }
    return null
  }

  // ── Targeting selector: "<Enemy|Ally> <unit?> with <highest|lowest> <metric>"
  // Also accepts "the enemy with the lowest X" and a trailing period.
  function selector(t0){
    const t = t0.replace(/^the /, '').replace(/with the /, 'with ').replace(/\.$/, '')
    const m = t.match(/^(enemy|ally) (.*?)\s*with (highest|lowest) (.+)$/)
    if (!m) return null
    const ent = ENTITY[m[1]]
    let unit = unitJP(m[2])
    if (unit === '') unit = '武将'
    if (unit == null) return null
    const dir = DIR[m[3]]
    // metric may carry an ailment prefix already handled elsewhere; try direct
    const met = METRIC[norm(m[4])]
    if (!met) return null
    return `${met}が${dir}${ent}${unit}`
  }

  // ── target ────────────────────────────────────────────────────────────────
  function targetOne(s){
    const t = norm(s)
    if (condMap.has(t)) return condMap.get(t)
    if (targetExtra.has(t)) return targetExtra.get(t)
    let m
    // bare selector ("Enemy general with highest ATK")
    const sel = selector(t)
    if (sel) return sel
    // counted selector ("1 enemy general with highest ATK" → ...敵武将1名)
    if ((m = t.match(new RegExp(`^${NUM} (enemy .+ with (?:highest|lowest) .+)$`)))){
      const inner = selector(m[2])
      if (inner) return `${inner}1名`
    }
    // "N <enemy|ally> <unit>" → 敵/味方<unit>N名/つ
    if ((m = t.match(new RegExp(`^${NUM} (enemy|ally) (.+)$`)))){
      const ent = ENTITY[m[2]]
      const u = unitJP(m[3])
      if (u != null){
        const counter = /兵器/.test(u || '') ? 'つ' : '名'
        return `${ent}${u || '武将'}${m[1]}${counter}`
      }
    }
    // poisoned/feared/... enemy
    if ((m = t.match(/^(?:all )?(\w+) (enemy|ally) generals?$/)) && AILMENT[m[1]]){
      const ent = ENTITY[m[2]]
      const all = /^all /.test(t) ? '全' : ''
      return `「${AILMENT[m[1]]}」状態の${ent}${all}武将`
    }
    if ((m = t.match(new RegExp(`^${NUM} (\\w+) (enemy|ally) generals?$`))) && AILMENT[m[2]]){
      const ent = ENTITY[m[3]]
      return `「${AILMENT[m[2]]}」状態の${ent}武将${m[1]}名`
    }
    // "Other ally X" → 自身以外の味方X
    if ((m = t.match(/^other (ally|allies) (.+)$/))){
      const u = unitJP(m[2])
      if (u != null) return `自身以外の味方${u || '武将'}`
    }
    if (t === 'other ally' || t === 'other allies') return '自身以外'
    // "Ally <Name>" / "Enemy <Name>" via roster
    if ((m = t.match(/^(ally|enemy) (.+)$/))){
      const jp = roster[norm(m[2])]
      if (jp) return `${ENTITY[m[1]]}「${jp}」`
      const u = unitJP(m[2])
      if (u) return `${ENTITY[m[1]]}${u}`
    }
    return null
  }
  function target(s){
    if (s == null) return null
    const whole = targetOne(s)
    if (whole) return whole
    // slash composites: "Self / ally cavalry" → 自身／味方騎兵
    const n = norm(s)
    if (n.includes('/')){
      const parts = String(s).split('/').map(p => p.trim())
      const jp = parts.map(targetOne)
      if (jp.every(Boolean)) return jp.join('／')
    }
    return null
  }

  // ── effect ──────────────────────────────────────────────────────────────────
  function effBase(phrase){
    const p = norm(phrase)
    if (effMap.has(p)) return effMap.get(p)
    if (effExtra.has(p)) return effExtra.get(p)
    // "Anti-<unit> ATK Up" → "ATK Up vs <unit>" glossary form
    let m = p.match(/^anti-(.+?) (atk|def) (up|down)$/)
    if (m){
      const dir = m[3] === 'up' ? '↑' : '↓'
      const stat = m[2] === 'atk' ? '攻撃力' : '防御力'
      const u = unitJP(m[1]) || COUNTRY[m[1]]
      if (u) return `対${u}${stat}${dir}`
    }
    return null
  }
  function effectOne(s){
    const raw = String(s).replace(/[％]/g, '%').replace(/[「」""'']/g, '').trim()
    const t = norm(s)
    if (effMap.has(t)) return effMap.get(t)
    if (effExtra.has(t)) return effExtra.get(t)
    let m
    if ((m = raw.match(new RegExp(`^${NUM}-hit ${NUM}% damage$`, 'i'))))
      return `${m[1]}回${m[2]}%ダメージ`
    if ((m = raw.match(new RegExp(`^${NUM}% damage$`, 'i'))))
      return `${m[1]}%ダメージ`
    // "<base> <n>% (max <n>%)" or "<base> (max <n>%)"
    let maxSuffix = ''
    let body = raw
    if ((m = body.match(new RegExp(`\\s*\\(max ${NUM}%\\)$`, 'i')))){
      maxSuffix = `（最大${m[1]}%）`
      body = body.slice(0, m.index).trim()
    }
    // "<base> <n>%" / "<base> <n>"
    if ((m = body.match(new RegExp(`^(.*?)\\s+${NUM}(%?)$`)))){
      const base = effBase(m[1])
      if (base) return `${base}${m[2]}${m[3]}${maxSuffix}`
    }
    if (maxSuffix){
      const base = effBase(body)
      if (base) return `${base}${maxSuffix}`
    }
    // "<ailment> Infliction <n>%" / "<ailment> Infliction Rate Up <n>%"
    if ((m = raw.match(new RegExp(`^(.*?) infliction rate (up|down)(?: ${NUM}%)?$`, 'i')))){
      const a = AILMENT[norm(m[1])]
      if (a) return `${a}付与率${m[2] === 'up' ? '↑' : '↓'}${m[3] ? m[3] + '%' : ''}`
    }
    if ((m = raw.match(new RegExp(`^(.*?) infliction(?: ${NUM}%)?$`, 'i')))){
      const base = effBase(m[1]) || (AILMENT[norm(m[1])] ? AILMENT[norm(m[1])] : null)
      if (base) return `${base}付与${m[2] ? m[2] + '%' : ''}`
    }
    // admin: "Siege weapon repair <X> Consumption Down <n>%" or "... Repair Speed Up <n>%"
    if ((m = raw.match(/^siege weapon repair (.+)$/i))){
      const rest = m[1]
      const cm = rest.match(new RegExp(`^(.+?)(?: ${NUM}%)?$`))
      const c = CONSUME[norm(cm[1])]
      if (c) return `兵器修理時${c}${cm[2] ? cm[2] + '%' : ''}`
      const inner = effectOne(rest)
      if (inner) return `兵器修理時${inner}`
    }
    return null
  }
  // A leading target embedded in an effect string, e.g. "Ally [Shield] DEF Up 10%"
  // or "[Cavalry] ATK Up 20%" → { tgt: 味方盾兵, rest: "DEF Up 10%" }.
  function effTargetPrefix(s){
    const m = String(s).match(/^((?:ally|enemy)\s+)?(\[?(?:infantry|cavalry|archer|shield|shield soldiers?)\]?)\s+(.+)$/i)
    if (!m) return null
    const tgt = targetOne(`${m[1] || 'ally '}${m[2]}`)
    if (!tgt) return null
    return { tgt, rest: m[3] }
  }
  function effect(s){
    if (s == null) return null
    const whole = effectOne(s)
    if (whole) return whole
    // target-prefixed effect → "<targetJP> <effectJP>"
    const tp = effTargetPrefix(s)
    if (tp){
      const inner = effect(tp.rest)
      if (inner) return `${tp.tgt}${inner}`
    }
    // composites joined by / , or 、 — the trailing % applies to the group.
    const raw = String(s).replace(/[％]/g, '%')
    if (/[\/,、]/.test(raw)){
      // pull a trailing number off the whole string
      const mm = raw.match(new RegExp(`\\s*${NUM}%$`))
      const tail = mm ? `${mm[1]}%` : ''
      const head = mm ? raw.slice(0, mm.index) : raw
      const parts = head.split(/[\/,、]/).map(p => p.trim()).filter(Boolean)
      const jp = parts.map(p => effectOne(p) || effBase(p))
      if (jp.every(Boolean)) return jp.join('／') + tail
    }
    return null
  }

  // ── condition ─────────────────────────────────────────────────────────────
  function conditionOne(s){
    const t = norm(s)
    if (condMap.has(t)) return condMap.get(t)
    if (condExtra.has(t)) return condExtra.get(t)
    const sel = selector(t)
    if (sel) return sel
    let m
    // Own HP thresholds
    if ((m = t.match(new RegExp(`^own (?:remaining )?hp (≥|>=|≤|<=|<|>) ${NUM}%$`)))){
      const op = { '≥':'以上','>=':'以上','≤':'以下','<=':'以下','<':'未満','>':'超' }[m[1]]
      return `自身の体力が${m[2]}％${op}`
    }
    // terrain "When passing <Terrain> terrain (...)"
    if ((m = t.match(/^when passing (\w+) terrain/))){
      const ter = TERRAIN[m[1]]
      if (ter) return `${ter}通過時`
    }
    if ((m = t.match(/^when passing terrain (\w+)/))){
      const ter = TERRAIN[m[1]]
      if (ter) return `${ter}通過時`
    }
    // "Poisoned enemy with highest remaining HP" — ailment + selector
    if ((m = t.match(/^(\w+) (enemy|ally) with (highest|lowest) (.+)$/)) && AILMENT[m[1]]){
      const inner = selector(`${m[2]} with ${m[3]} ${m[4]}`)
      if (inner) return inner.replace(/(敵|味方)/, `「${AILMENT[m[1]]}」状態の$1`)
    }
    // "When ally <Name> is alive" / "<Name> alive"
    if ((m = t.match(/^(?:when )?ally (.+?) (?:is )?alive$/))){
      const jp = roster[norm(m[1])]
      if (jp) return `味方「${jp}」が生存`
    }
    // "Enemy/Ally <country> present|alive" → 敵/味方<country>が生存
    if ((m = t.match(/^(?:when )?(enemy|ally) (qin|zhao|chu|wei|han|yan|qi|ai)(?: generals?)? (?:are |is )?(?:present|alive)$/))){
      return `${ENTITY[m[1]]}${COUNTRY[m[2]]}が生存`
    }
    // "When enemy <unit> is/are alive" → 敵<unit>が生存している場合
    if ((m = t.match(/^when enemy (.+?) (?:is|are) alive$/))){
      const u = unitJP(m[1])
      if (u != null) return `敵${u || '武将'}が生存している場合`
    }
    // Per-unit scaling: "Per (other )?ally <X> (general|member)?" — reuse the
    // target composer to resolve units / factions / armies / named allies.
    if ((m = t.match(/^per (other )?ally (.+?)(?: (?:general|generals|member|members))?$/))){
      const full = targetOne(`ally ${m[2]}`)
      if (full && full.startsWith('味方'))
        return `${m[1] ? '自身以外の' : ''}${full}1名につき`
    }
    return null
  }
  function condition(s){
    if (s == null) return null
    const whole = conditionOne(s)
    if (whole) return whole
    const t = norm(s)
    if (t.includes(',')){
      const parts = String(s).split(',').map(p => p.trim())
      const jp = parts.map(conditionOne)
      if (jp.every(Boolean)) return jp.join('、')
    }
    return null
  }

  // ── skill type ──────────────────────────────────────────────────────────────
  const typeMap = new Map()
  for (const [jp, v] of Object.entries(skillTypes)){
    if (jp.startsWith('_') || typeof v !== 'object') continue
    if (v.short) typeMap.set(norm(v.short), jp)
    if (v.en)    typeMap.set(norm(v.en), jp)
  }
  function type(s){
    if (s == null) return null
    return typeMap.get(norm(s)) || null
  }

  return { condition, target, effect, duration, type, norm }
}
