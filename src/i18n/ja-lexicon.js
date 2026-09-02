/**
 * Canonical Japanese lexicon for Kingdom Ran game data.
 *
 * Every term here is taken from the game's OWN Japanese, mined from the
 * authoritative skill descriptions in `data/generated/ja/skills.json` (which
 * are byte-identical to `MsgUnionConquestSkillDesc.stbl`). Frequencies from
 * that corpus, for the record:
 *
 *   攻撃力 381 · 体力 337 · 防御力 320 · 上昇 586 · のダメージ 370
 *   敵武将N名 342 · 味方…武将 514 · 最も高い 262 · 最も低い 113
 *   駐屯時 67 · 侵攻時 42 · ガード効果 46 · 防御力貫通 35 · 耐性 30
 *
 * This matters: RanHQ's structured effect rows are its own decomposition, so
 * there is no source string to copy for them — but the vocabulary they use
 * must still be the game's, not a fresh translation of the English labels.
 *
 * Scope note: skill NAMES and DESCRIPTIONS are never translated. Those come
 * from the source tables verbatim (see `ja-source.js`). Only the structured
 * target/effect/condition/duration triples are rendered here.
 */

/** Directional verbs, as the game phrases them. */
export const DIRECTION = {
  up: '上昇',
  down: '低下',
}

/**
 * Stat and metric names.
 * Keys are the exact English phrases used by the project effect corpus.
 */
export const STATS = {
  'ATK': '攻撃力',
  'Attack': '攻撃力',
  'Attack Power': '攻撃力',
  'DEF': '防御力',
  'Defense': '防御力',
  'HP': '体力',
  'Morale': '士気',
  'MOV': '移動力',
  'Speed': '速度',

  'Hit Rate': '命中率',
  'Critical Rate': 'クリティカル率',
  'Critical Damage': 'クリティカルダメージ',
  'DEF Penetration': '防御力貫通',
  'Evasion': '回避率',
  'Dodge Chance': '回避率',
  'Evasion (Dodge Chance)': '回避率',
  'Repair Speed': '修理速度',

  'remaining HP': '残り体力',
  'Remaining HP': '残り体力',
  'remaining Morale': '残り士気',
  'Remaining Morale': '残り士気',
  'remaining strength': '残り兵力',
  'Starting HP': '開始時体力',
  'Current HP': '現在の体力',

  'Damage': 'ダメージ',
  'Damage Dealt': '与ダメージ',
  'Damage Taken': '被ダメージ',
  'Damage Received': '被ダメージ',
  'Squad Damage': '部隊ダメージ',
  'Damage Taken Increase': '被ダメージ上昇',
  'Damage Dealt Reduction': '与ダメージ軽減',
  'Squad Damage Reduction': '部隊ダメージ軽減',
  'Damage Reduction Effect': 'ダメージ軽減効果',
  'Poison Damage': '毒ダメージ',

  'HP Recovery': '体力回復',
  'Morale Recovery': '士気回復',
  'HP Recovery Rate': '体力回復量',
  'Continuous HP Recovery': '体力継続回復',
  'Continuous Morale Recovery': '士気継続回復',
  // 「その100%を自身の体力に吸収する」— the caster absorbs what it deals.
  'HP Drain': '体力吸収',

  'Material Cost': '資材コスト',
  'Coin Cost': '貨幣コスト',
  'Ore Cost': '鉱石コスト',
  'Currency Cost': '通貨コスト',
  'Morale Cost': '士気消費',
  'Material Consumption': '資材消費',
  'Coin Consumption': '貨幣消費',
  'Ore Consumption': '鉱石消費',
  'Morale Consumption': '士気消費',

  'Normal Attack': '通常攻撃',
  'Skill Attack': '技能攻撃',
  'Attack Count': '攻撃回数',
  'Effect': '効果',

  'Attack Down Resistance': '攻撃力低下耐性',
  'Defense Down Resistance': '防御力低下耐性',
  'DEF Penetration Resistance': '防御力貫通耐性',
}

/** Stats whose Japanese takes the 上限 (cap) form rather than 最大. */
export const MAX_FORMS = {
  'HP': '体力上限',
  'Morale': '最大士気',
  'ATK': '最大攻撃力',
  'Attack': '最大攻撃力',
  'DEF': '最大防御力',
  'Defense': '最大防御力',
}

/** Status effects, using the game's own names. */
export const STATUSES = {
  'Provoke': '挑発',
  'Poison': '毒',
  'Severe Poison': '猛毒',
  'Burn': '火傷',
  'Illusion': '幻影',
  'Paralysis': '麻痺',
  'Confusion': '錯乱',
  'Betrayal': '裏切り',
  'Rampage': '暴走',
  'Fear': '恐怖',
  'Reckless': '捨て身',
  'Guard': 'ガード効果',
  'Sure Hit': '必中',
  'Attack Nullification': '攻撃無効',
  'Less Likely to be Targeted': '狙われにくい',
  'Status Effect Immunity': '状態異常無効',
  'Attack Seal': '攻撃封印',
  'Normal Attack Seal': '通常攻撃封印',
  'Skill Attack Seal': '技能攻撃封印',
  // 「体力回復無効」— healing is nullified, not a seal placed on HP.
  'HP Seal': '体力回復無効',
  'Immunity': '無効',
  'Attack Immunity': '攻撃無効',
  'Nullification': '無効',
}

/** Status adjectives for "poisoned enemy" style selectors. */
export const STATUS_ADJECTIVES = {
  poisoned: '毒状態の',
  burned: '火傷状態の',
  feared: '恐怖状態の',
  confused: '錯乱状態の',
  paralysed: '麻痺状態の',
  paralyzed: '麻痺状態の',
}

/** Bracketed tags: unit types, states, terrain. */
export const TAGS = {
  'General': '武将',
  'Infantry': '歩兵',
  'Cavalry': '騎兵',
  'Archer': '弓兵',
  'Archers': '弓兵',
  'Shield': '盾兵',
  'Shield Soldiers': '盾兵',
  'Siege Weapon': '兵器',
  'Siege Weapons': '兵器',
  'Gate': '城門',

  'Qin': '秦国',
  'Zhao': '趙国',
  'Wei': '魏国',
  'Chu': '楚国',
  'Yan': '燕国',
  'Han': '韓国',
  'Qi': '斉国',
  'Ai': '毐国',
  'Mountain Folk': '山の民',

  'Slope': '坂',
  'Forest': '森',
  'River': '川',
  'Water': '水路',
  'Swamp': '湿地',
  'Marsh': '湿地',
  'Checkpoint': '関所',
  'Ambush': '伏兵',
}

/**
 * Named armies and units, in the game's Japanese.
 *
 * Unlike Arabic — where an unverified transliteration would risk misidentifying
 * a general — these all have canonical Japanese names in the source, so they
 * are translated in full.
 */
export const GROUPS = {
  'Kanki Army': '桓騎軍',
  'Ousen Army': '王翦軍',
  'Karin Army': '媧燐軍',
  'Renpa Army': '廉頗軍',
  'Kanmei Army': '汗明軍',
  'Kisui Army': '紀彗軍',
  'Makou Army': '麻礦軍',
  'Ouki Army': '王騎軍',
  'Moubo Army': '蒙武軍',
  'Gakuka Unit': '楽華隊',
  'Gyokuhou Unit': '玉鳳隊',
  'Gyokuhou Squad': '玉鳳隊',
  'Hi Shin Unit': '飛信隊',
  'Hishin Unit': '飛信隊',
  'Coalition Army': '合従軍',
  'Six Great Generals': '六大将軍',
  'Attack Siege Weapons': '攻撃兵器',
  'Defense Siege Weapons': '防衛兵器',
  'Six Great': '六大将軍',
  'Four Pillars': '四柱',
  'Ryofui Four Pillars': '呂氏四柱',
  "Renpa's Four Heavenly Kings": '廉頗四天王',
  'Fire Dragon': '火竜',
  'Wei Fire Dragon': '魏火竜',
  'Way of The Great General': '大将軍への道',
  'Way of the Great General': '大将軍への道',
}

/** Skill-type badges, using the game's own category names. */
export const SKILL_TYPES = {
  'Combat': '戦技',
  'Strategy': '軍略',
  'Internal Affairs': '内政',
  'Leader': '総大将',
  'Strategist': '軍師',
}

/** Whole-string phrases with a fixed Japanese rendering. */
export const PHRASES = {
  ...SKILL_TYPES,
  'Self': '自身',
  'Own': '自身',
  'Ally': '味方',
  'Enemy': '敵',
  'Gate': '城門',
  'Map': 'マップ',
  'Passing unit': '通過部隊',
  'Passing squad': '通過部隊',
  'Other ally': '自身以外の味方',
  'Other allies': '自身以外の味方',
  'Random': 'ランダム',
  'Alive': '生存時',
  'Surviving': '生存時',
  'surviving': '生存時',
  'Garrisoning': '駐屯時',
  'Attacking': '侵攻時',
  'When Garrisoning': '駐屯時',
  'When Attacking': '侵攻時',
  'Per turn elapsed': '経過ターンごと',
  'Betrayal-afflicted': '裏切り状態',
  'Status Effect Immunity (excl. Provoke)': '状態異常無効（挑発を除く）',
  '% of Remaining HP Damage': '残り体力割合ダメージ',
  '% of remaining HP Damage': '残り体力割合ダメージ',
  'Higher own remaining HP (scales)': '自身の残り体力が高いほど',
  'Lower own remaining HP (scales)': '自身の残り体力が低いほど',
  'gate HP remaining': '城門の残り体力',
  'The enemy with the lowest remaining strength': '残り兵力が最も低い敵',
  'The enemy with the lowest defense.': '防御力が最も低い敵',
  'CW battle': '同盟争覇戦',
  'Effect Resistance': '効果耐性',
}

/** Parenthetical qualifiers. */
export const QUALIFIERS = {
  'active even when not deployed': '出撃していなくても有効',
  'effective even when not deployed': '出撃していなくても有効',
  'effective even if not deployed': '出撃していなくても有効',
  'excl. Provoke': '挑発を除く',
  'other than self': '自身を除く',
  'scales': '累積',
  'additional': '追加',
}

/** Superlative frames. */
export const SUPERLATIVE = {
  highest: '最も高い',
  lowest: '最も低い',
  higher: '最も高い',
  lower: '最も低い',
}
