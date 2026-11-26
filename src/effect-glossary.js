// Status effects and the keywords that name them inside skill effects.
//
// One source of truth for two surfaces:
//   - the Guide's Status Effects page (icon, name, description), and
//   - the skill-card toggletips that explain an effect where a skill names it.
// English names, icons and descriptions live in data/glossary/status_effects.json.
// The Japanese, Arabic and French copy below is the Guide's reviewed copy, moved
// here unchanged so both surfaces always say the same thing. The Japanese
// follows the official Conquest FAQ: https://www.kingdomran.jp/help/doumeisouhasen
import statusEffects from '../data/glossary/status_effects.json'
import { versionPublicAsset } from './asset-url.js'

export const STATUS_EFFECT_COPY = {
  ja: {
    'Less Likely to be Targeted': { name: '敵武将から狙われにくい状態', description: '敵の通常攻撃・スキル攻撃の対象から除外されます。ただし、この状態の武将しか生存していない場合や、敵の攻撃対象数が味方全員の人数と同じ場合は対象になります。' },
    Reckless: { name: '捨て身', description: '攻撃力が大きく上がりますが、受けるダメージも増加します。' },
    'Evasion (Dodge Chance)': { name: '見切り', description: '攻撃を受けたとき、一定確率でその攻撃を回避します。' },
    Guard: { name: 'ガード効果', description: '指定された攻撃の被ダメージを軽減します。指定回数発動すると解除されます。' },
    'Attack Nullification': { name: '無効効果', description: '指定された攻撃の被ダメージを0にします。指定回数発動すると解除されます。' },
    Reflect: { name: '反射効果', description: '指定された対象からの被ダメージを0にしたのち、攻撃した武将にダメージを与えます。このダメージに対してガード効果などは発動しません。指定回数発動すると解除されます。' },
    'Sure Hit': { name: '必中', description: '自身の命中率、相手の回避率、見切りの有無にかかわらず攻撃が命中します。' },
    'Status Effect Immunity': { name: '状態異常無効', description: '挑発を除く状態異常の付与を防ぎます。指定回数発動すると解除され、回数指定がない場合は回数制限なく防ぎます。' },
    Provoke: { name: '挑発', description: '敵武将からの通常攻撃・スキル攻撃を自身に集中させます。対象条件を満たさない攻撃や、兵器を対象とする攻撃には影響しません。' },
    Poison: { name: '毒', description: '各ターンの開始時、最大体力の割合分のダメージを受けます。' },
    'Severe Poison': { name: '猛毒', description: '各ターンの開始時、最大体力の割合分のダメージを受けます。毒より強力で、毒とは重複せず猛毒が優先されます。' },
    Burn: { name: '火傷', description: '各ターンの開始時、最大体力の割合分のダメージを受けます。' },
    Illusion: { name: '幻影', description: '命中率を下げます。' },
    Paralysis: { name: '麻痺', description: '毎ターン、一定確率で行動（通常攻撃・スキル攻撃）できなくなります。' },
    Confusion: { name: '錯乱', description: '味方と敵を区別せず攻撃します。' },
    Betrayal: { name: '裏切り', description: '効果中は味方武将を攻撃します。' },
    Rampage: { name: '暴走', description: '攻撃力が上がりますが、味方武将を攻撃する可能性があります。' },
    Fear: { name: '恐怖', description: '士気が回復しなくなります。' },
    'Attack Seal': { name: '封印', description: '通常攻撃封印は通常攻撃の行動順をスキップし、戦技は発動できます。スキル攻撃封印は戦技の代わりに通常攻撃を行います。攻撃封印は通常攻撃と戦技の両方を行えなくなります。' },
    'HP Seal': { name: '体力回復無効', description: '体力が回復しなくなります。' },
  },
  ar: {
    'Less Likely to be Targeted': { name: 'أقل عرضة للاستهداف', description: 'تُستبعد الوحدة من استهداف الهجمات العادية وهجمات المهارات للعدو.' },
    Reckless: { name: 'متهور', description: 'يزيد قوة الهجوم كثيرًا، لكن الضرر المتلقى يزداد أيضًا.' },
    'Evasion (Dodge Chance)': { name: 'التفادي', description: 'احتمال تفادي الهجمات الواردة.' },
    Guard: { name: 'الصد', description: 'تقلل الضرر من هجوم محدد، وتُستهلك بعد عدد محدد من التفعيلات.' },
    'Attack Nullification': { name: 'إبطال الهجوم', description: 'تخفض ضرر هجوم محدد إلى 0، وتُستهلك بعد عدد محدد من التفعيلات.' },
    Reflect: { name: 'عكس الهجوم', description: 'تخفض الضرر الوارد من المهاجمين المحددين إلى 0، ثم تُلحق ضررًا بالجنرال الذي هاجم. لا تُفعَّل تأثيرات مثل الصد ضد هذا الضرر، وتُستهلك بعد عدد محدد من التفعيلات.' },
    'Sure Hit': { name: 'إصابة مؤكدة', description: 'تصيب الهجمات دائمًا بغض النظر عن معدل الإصابة أو التفادي.' },
    'Status Effect Immunity': { name: 'مناعة ضد الحالات', description: 'تمنع تطبيق الإضعافات (باستثناء الاستفزاز)، وتُستهلك بعد عدد محدد من التفعيلات.' },
    Provoke: { name: 'الاستفزاز', description: 'يركز هجمات ضرر العدو على نفسه.' },
    Poison: { name: 'السم', description: 'تتلقى الوحدة ضررًا يساوي نسبة من أقصى صحتها في بداية كل جولة.' },
    'Severe Poison': { name: 'السم الشديد', description: 'تتلقى الوحدة ضررًا يساوي نسبة من أقصى صحتها في بداية كل جولة، وهو أكبر من السم.' },
    Burn: { name: 'الحرق', description: 'تتلقى الوحدة ضررًا يساوي نسبة من أقصى صحتها في بداية كل جولة.' },
    Illusion: { name: 'الوهم', description: 'يخفض معدل الإصابة.' },
    Paralysis: { name: 'الشلل', description: 'احتمال منع الفعل (الهجوم العادي وهجوم المهارة) في كل جولة.' },
    Confusion: { name: 'الارتباك', description: 'تهاجم الحلفاء والأعداء بلا تمييز.' },
    Betrayal: { name: 'الخيانة', description: 'تهاجم الجنرالات الحلفاء أثناء فعالية التأثير.' },
    Rampage: { name: 'الهياج', description: 'تزداد قوة الهجوم، لكن توجد فرصة لمهاجمة الجنرالات الحلفاء.' },
    Fear: { name: 'الخوف', description: 'يتعطل استرداد المعنويات.' },
    'Attack Seal': { name: 'ختم الهجوم', description: 'يعطل الفعل المحدد. وتشمل الأنواع ختم الهجوم العادي وختم هجوم المهارة وختم الهجوم (كلاهما).' },
    'HP Seal': { name: 'ختم استعادة الصحة', description: 'يتعطل استرداد الصحة.' },
  },
  fr: {
    'Less Likely to be Targeted': { name: 'Ciblage réduit', description: 'L’unité est exclue du ciblage des attaques normales et des attaques de compétence ennemies.' },
    Reckless: { name: 'Témérité', description: 'Augmente fortement la puissance d’attaque, mais les dégâts subis augmentent aussi.' },
    'Evasion (Dodge Chance)': { name: 'Esquive', description: 'Chance d’esquiver les attaques reçues.' },
    Guard: { name: 'Garde', description: 'Réduit les dégâts d’une attaque. L’effet disparaît après un nombre défini de déclenchements.' },
    'Attack Nullification': { name: 'Annulation d’attaque', description: 'Réduit à 0 les dégâts d’une attaque. L’effet disparaît après un nombre défini de déclenchements.' },
    Reflect: { name: 'Renvoi d’attaque', description: 'Réduit à 0 les dégâts reçus des attaquants visés, puis inflige des dégâts au général qui a attaqué. La Garde et les effets similaires ne s’appliquent pas à ces dégâts. L’effet disparaît après un nombre défini de déclenchements.' },
    'Sure Hit': { name: 'Coup assuré', description: 'Les attaques touchent toujours, quelles que soient la précision et l’esquive.' },
    'Status Effect Immunity': { name: 'Immunité aux altérations d’état', description: 'Bloque l’application des débuffs, à l’exception de la Provocation. L’effet disparaît après un nombre défini de déclenchements.' },
    Provoke: { name: 'Provocation', description: 'Concentre sur soi les attaques de dégâts ennemies.' },
    Poison: { name: 'Poison', description: 'Inflige un pourcentage des PV max en dégâts au début de chaque tour.' },
    'Severe Poison': { name: 'Poison violent', description: 'Inflige un pourcentage des PV max en dégâts au début de chaque tour, plus élevé que le Poison.' },
    Burn: { name: 'Brûlure', description: 'Inflige un pourcentage des PV max en dégâts au début de chaque tour.' },
    Illusion: { name: 'Illusion', description: 'Réduit la précision.' },
    Paralysis: { name: 'Paralysie', description: 'Risque, à chaque tour, d’empêcher d’agir (attaque normale et attaque de compétence).' },
    Confusion: { name: 'Confusion', description: 'Attaque alliés et ennemis sans distinction.' },
    Betrayal: { name: 'Trahison', description: 'Attaque les généraux alliés tant que l’effet est actif.' },
    Rampage: { name: 'Furie', description: 'La puissance d’attaque augmente, mais l’unité risque d’attaquer des généraux alliés.' },
    Fear: { name: 'Peur', description: 'Le regain de moral est désactivé.' },
    'Attack Seal': { name: 'Sceau d’attaque', description: 'Désactive l’action visée. Variantes : sceau d’attaque normale, sceau d’attaque de compétence, sceau d’attaque (les deux).' },
    'HP Seal': { name: 'Sceau de soin', description: 'Le soin des PV est désactivé.' },
  },
}

const localeCode = locale => (typeof locale === 'string' ? locale : locale?.code) || 'en'

/** The Guide's localized name and description for one status, keyed by its English name. */
export function statusEffectCopy(nameEn, locale) {
  return STATUS_EFFECT_COPY[localeCode(locale)]?.[nameEn] || null
}

const STATUS_ENTRIES = new Map([
  ...statusEffects.buffs.map(entry => [entry.name_en, { ...entry, kind: 'buff' }]),
  ...statusEffects.debuffs.map(entry => [entry.name_en, { ...entry, kind: 'debuff' }]),
])

// DEF Penetration is not a status, but skills grant it constantly and it is easy
// to misread as an attack bonus. The Japanese is the Guide's FAQ-based CW stats
// description; the other languages say the same thing.
const EXTRA_COPY = {
  'DEF Penetration': {
    en: { name: 'DEF Penetration', description: 'When attacking, temporarily lowers the target’s DEF by the given percentage. DEF returns to normal after the attack.' },
    ja: { name: '防御力貫通', description: '攻撃時に相手の防御力を指定割合だけ一時的に低下させます。攻撃後は元の防御力に戻ります。' },
    ar: { name: 'اختراق الدفاع', description: 'عند الهجوم، يخفض دفاع الهدف مؤقتًا بالنسبة المحددة، ثم يعود دفاعه إلى قيمته الأصلية بعد الهجوم.' },
    fr: { name: 'Pénétration de défense', description: 'Lors d’une attaque, réduit temporairement la défense de la cible du pourcentage indiqué. Sa défense revient à la normale après l’attaque.' },
  },
}

// Arabic and French keywords must be whole words. Japanese has no spaces, so its
// patterns use explicit look-arounds instead: 猛毒 is not 毒, and 防御力貫通耐性
// is a resistance, not DEF Penetration.
const word = (alternatives, flags = 'gu') => new RegExp(`(?<!\\p{L})(?:${alternatives})(?!\\p{L})`, flags)
const APOSTROPHE = '[’\']'

/**
 * Every keyword the effect toggletips know.
 *
 * `source` decides from the canonical English effect row whether the effect is
 * really there; the per-locale `surface` pattern then finds the words the
 * renderer printed for it. Two mechanics can share a word in a translation
 * (Arabic and French say "evasion" for both 見切り and 回避率), so the English
 * row, never the translated text, decides which one is meant.
 */
export const EFFECT_TERMS = [
  ['Severe Poison', /\bSevere Poison\b/, { en: /\bSevere Poison\b/g, ja: /猛毒/g, ar: word('السم الشديد'), fr: word('poison violent', 'giu') }],
  ['Poison', /(?<!Severe )\bPoison\b/, { en: /(?<!Severe )\bPoison\b/g, ja: /(?<!猛)毒/g, ar: word('السم(?! الشديد)'), fr: word('poison(?! violent)', 'giu') }],
  ['Burn', /\bBurn\b/, { en: /\bBurn\b/g, ja: /火傷/g, ar: word('الحرق'), fr: word('brûlures?', 'giu') }],
  ['Illusion', /\bIllusion\b/, { en: /\bIllusion\b/g, ja: /幻影/g, ar: word('الوهم'), fr: word('illusion', 'giu') }],
  ['Paralysis', /\bParalysis\b/, { en: /\bParalysis\b/g, ja: /麻痺/g, ar: word('الشلل'), fr: word('paralysie', 'giu') }],
  ['Confusion', /\bConfusion\b/, { en: /\bConfusion\b/g, ja: /錯乱/g, ar: word('الارتباك'), fr: word('confusion', 'giu') }],
  ['Betrayal', /\bBetrayal\b/, { en: /\bBetrayal\b/g, ja: /裏切り/g, ar: word('الخيانة'), fr: word('trahison', 'giu') }],
  ['Rampage', /\bRampage\b/, { en: /\bRampage\b/g, ja: /暴走/g, ar: word('الهياج'), fr: word('furie', 'giu') }],
  ['Fear', /\bFear\b/, { en: /\bFear\b/g, ja: /恐怖/g, ar: word('الخوف'), fr: word('peur', 'giu') }],
  ['Provoke', /\bProvoke\b/, { en: /\bProvoke\b/g, ja: /挑発/g, ar: word('الاستفزاز'), fr: word('provocation', 'giu') }],
  ['Reckless', /\bReckless\b/, { en: /\bReckless\b/g, ja: /捨て身/g, ar: word('متهور'), fr: word('témérité', 'giu') }],
  ['Guard', /\bGuard\b/, { en: /\bGuard\b/g, ja: /ガード効果/g, ar: word('الصد'), fr: word('garde', 'giu') }],
  ['Sure Hit', /\bSure Hit\b/, { en: /\bSure Hit\b/g, ja: /必中/g, ar: word('(?:ال)?إصابة (?:ال)?مؤكدة'), fr: word('coup assuré', 'giu') }],
  ['Attack Nullification', /\bAttack (?:Nullification|Immunity)\b/, { en: /\bAttack (?:Nullification|Immunity)\b/g, ja: /攻撃無効/g, ar: word('إبطال الهجوم|حصانة من الهجوم'), fr: word(`annulation d${APOSTROPHE}attaque|immunité aux attaques`, 'giu') }],
  // 反射 (effectType 177): skill rows read "Reflect Cavalry Attacks" / 騎兵武将の攻撃を反射.
  ['Reflect', /\bReflect\b/, { en: /\bReflect\b/g, ja: /反射/g, ar: word('عكس(?: الهجوم)?'), fr: word(`renvoie|renvoi d${APOSTROPHE}attaque`, 'giu') }],
  ['Less Likely to be Targeted', /\bLess Likely to be Targeted\b/, { en: /\bLess Likely to be Targeted\b/g, ja: /狙われにくい/g, ar: word('أقل عرضة للاستهداف'), fr: word('ciblage réduit', 'giu') }],
  ['Status Effect Immunity', /\bStatus Effect Immunity\b/, { en: /\bStatus Effect Immunity\b/g, ja: /状態異常無効/g, ar: word('مناعة ضد الحالات'), fr: word(`immunité aux altérations d${APOSTROPHE}état`, 'giu') }],
  // 見切り is the dodge status ("Evasion (Dodge Chance) 20%"). The same English
  // words followed by Up/Down are the 回避率 stat, which is not a status.
  ['Evasion (Dodge Chance)', /(?:\bEvasion \(Dodge Chance\)|\bDodge Chance) \d/, { en: /\bEvasion \(Dodge Chance\)(?= \d)|\bDodge Chance(?= \d)/g, ja: /見切り/g, ar: word('التفادي'), fr: word('esquive', 'giu') }],
  ['Attack Seal', /\b(?:Normal |Skill )?Attack Seal\b/, { en: /\b(?:Normal |Skill )?Attack Seal\b/g, ja: /(?:通常|スキル)?攻撃封印/g, ar: word('ختم الهجوم العادي|ختم هجوم المهارة|ختم الهجوم'), fr: word(`sceau d${APOSTROPHE}attaque normale|sceau d${APOSTROPHE}attaque de compétence|sceau d${APOSTROPHE}attaque`, 'giu') }],
  ['HP Seal', /\bHP Seal\b/, { en: /\bHP Seal\b/g, ja: /体力回復無効/g, ar: word('ختم استعادة الصحة'), fr: word('sceau de soin', 'giu') }],
  ['DEF Penetration', /\bDEF Penetration\b(?! Resistance)/, { en: /\bDEF Penetration\b(?! Resistance)/g, ja: /防御力貫通(?!耐性)/g, ar: word('(?<!مقاومة )اختراق الدفاع'), fr: word('(?<!résistance à la )pénétration de défense', 'giu') }],
].map(([key, source, surface]) => {
  const status = STATUS_ENTRIES.get(key)
  return Object.freeze({ key, source, surface, icon: status?.icon ? versionPublicAsset(status.icon) : null, kind: status?.kind || 'stat' })
})

/** Name, description, icon and kind of one effect keyword in the given locale. */
export function effectTermInfo(term, locale) {
  const code = localeCode(locale)
  const extra = EXTRA_COPY[term.key]
  if (extra) return { ...(extra[code] || extra.en), icon: term.icon, kind: term.kind }
  const status = STATUS_ENTRIES.get(term.key)
  const localized = code === 'en' ? null : statusEffectCopy(term.key, code)
  return {
    name: localized?.name || (code === 'ja' ? status.name_jp : status.name_en),
    description: localized?.description || status.description,
    icon: term.icon,
    kind: term.kind,
  }
}

/**
 * Split a displayed effect into plain text and effect keywords.
 *
 * `sourceText` is the canonical English effect of the same row. A keyword is
 * marked only when that row really carries the effect, and only where the
 * displayed text names it; everything else stays plain text.
 */
export function effectTermSegments(text, sourceText, locale) {
  const value = String(text ?? '')
  if (!value) return []
  const code = localeCode(locale)
  const source = String(sourceText ?? value)
  const spans = []
  for (const term of EFFECT_TERMS) {
    if (!term.source.test(source)) continue
    for (const match of value.matchAll(term.surface[code] || term.surface.en)) {
      if (match[0]) spans.push({ start: match.index, end: match.index + match[0].length, term })
    }
  }
  if (!spans.length) return [value]
  spans.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start))
  const segments = []
  let cursor = 0
  for (const span of spans) {
    if (span.start < cursor) continue
    if (span.start > cursor) segments.push(value.slice(cursor, span.start))
    segments.push({ text: value.slice(span.start, span.end), term: span.term })
    cursor = span.end
  }
  if (cursor < value.length) segments.push(value.slice(cursor))
  return segments
}
