/**
 * Canonical Arabic lexicon for Kingdom Ran game data.
 *
 * This is the SINGLE source of Arabic terminology for dynamically rendered
 * game text (skill effects, targets, conditions, durations). It deliberately
 * mirrors the terminology already established by the hand-written Arabic guide
 * copy in `src/guide.jsx` and by `data/glossary/localization_terms.json` — do
 * not introduce a competing wording here. When the guide and this file would
 * disagree, the guide/glossary wins and this file is corrected.
 *
 * Grammar contract for stat entries:
 *   def — the DEFINITE noun phrase, used after a verbal noun.
 *         `زيادة` + `الهجوم` -> "زيادة الهجوم 20%"
 *   ind — the INDEFINITE noun phrase, used after a superlative (أعلى/أقل),
 *         where Arabic requires an indefinite complement.
 *         `ذو أعلى` + `هجوم` -> "عدو ذو أعلى هجوم"
 *
 * Using the wrong one is a grammar bug, which is why both are stored rather
 * than derived by stripping "ال".
 */

/** Verbal nouns for a stat moving up or down. Matches the guide's wording. */
export const DIRECTION = {
  up: 'زيادة',
  down: 'خفض',
}

/**
 * Stat and metric names.
 *
 * Keys are the exact English phrases that appear in the project effect corpus
 * (`data/characters/*.json`), matched case-insensitively by the renderer.
 */
export const STATS = {
  // ── Core combat stats ────────────────────────────────────────────────────
  'ATK': { def: 'الهجوم', ind: 'هجوم' },
  'Attack': { def: 'الهجوم', ind: 'هجوم' },
  'Attack Power': { def: 'قوة الهجوم', ind: 'قوة هجوم' },
  'DEF': { def: 'الدفاع', ind: 'دفاع' },
  'Defense': { def: 'الدفاع', ind: 'دفاع' },
  'HP': { def: 'الصحة', ind: 'صحة' },
  'Morale': { def: 'المعنويات', ind: 'معنويات' },
  'MOV': { def: 'الحركة', ind: 'حركة' },
  'Speed': { def: 'السرعة', ind: 'سرعة' },

  // ── Derived / screen stats (wording from the guide's CW stats screen) ────
  'Hit Rate': { def: 'معدل الإصابة', ind: 'معدل إصابة' },
  'Critical Rate': { def: 'معدل الضربة الحرجة', ind: 'معدل ضربة حرجة' },
  'Critical Damage': { def: 'الضرر الحرج', ind: 'ضرر حرج' },
  'DEF Penetration': { def: 'اختراق الدفاع', ind: 'اختراق دفاع' },
  'Evasion': { def: 'التفادي', ind: 'تفادي' },
  'Dodge Chance': { def: 'نسبة التفادي', ind: 'نسبة تفادي' },
  'Evasion (Dodge Chance)': { def: 'التفادي', ind: 'تفادي' },
  'Repair Speed': { def: 'سرعة الإصلاح', ind: 'سرعة إصلاح' },

  // ── Remaining / current values ───────────────────────────────────────────
  'remaining HP': { def: 'الصحة المتبقية', ind: 'صحة متبقية' },
  'Remaining HP': { def: 'الصحة المتبقية', ind: 'صحة متبقية' },
  'remaining Morale': { def: 'المعنويات المتبقية', ind: 'معنويات متبقية' },
  'Remaining Morale': { def: 'المعنويات المتبقية', ind: 'معنويات متبقية' },
  'remaining strength': { def: 'القوة المتبقية', ind: 'قوة متبقية' },
  'Starting HP': { def: 'الصحة عند البدء', ind: 'صحة عند البدء' },

  // ── Damage families ──────────────────────────────────────────────────────
  'Damage': { def: 'الضرر', ind: 'ضرر' },
  'Damage Dealt': { def: 'الضرر المُلحق', ind: 'ضرر مُلحق' },
  'Damage Taken': { def: 'الضرر المتلقى', ind: 'ضرر متلقى' },
  'Damage Received': { def: 'الضرر المتلقى', ind: 'ضرر متلقى' },
  'Squad Damage': { def: 'ضرر الوحدة', ind: 'ضرر وحدة' },
  'Damage Taken Increase': { def: 'ارتفاع الضرر المتلقى', ind: 'ارتفاع ضرر متلقى' },
  'Damage Dealt Reduction': { def: 'تقليل الضرر المُلحق', ind: 'تقليل ضرر مُلحق' },
  'Squad Damage Reduction': { def: 'تقليل ضرر الوحدة', ind: 'تقليل ضرر وحدة' },
  'Damage Reduction Effect': { def: 'تأثير تقليل الضرر', ind: 'تأثير تقليل ضرر' },
  'Poison Damage': { def: 'ضرر السم', ind: 'ضرر سم' },
  // Lets "Effect Resistance 5.4%" resolve through the generic Resistance rule.
  'Effect': { def: 'التأثير', ind: 'تأثير' },

  // Resistance compounds that also appear as standalone UI labels (the
  // scene-card buff panel). Wording is the guide's own: مقاومة خفض الهجوم.
  'Attack Down Resistance': { def: 'مقاومة خفض الهجوم', ind: 'مقاومة خفض هجوم' },
  'Defense Down Resistance': { def: 'مقاومة خفض الدفاع', ind: 'مقاومة خفض دفاع' },
  'DEF Penetration Resistance': { def: 'مقاومة اختراق الدفاع', ind: 'مقاومة اختراق دفاع' },
  'Current HP': { def: 'الصحة الحالية', ind: 'صحة حالية' },
  'attack power': { def: 'قوة الهجوم', ind: 'قوة هجوم' },
  'defense': { def: 'الدفاع', ind: 'دفاع' },

  // ── Recovery / drain ─────────────────────────────────────────────────────
  'HP Recovery': { def: 'استعادة الصحة', ind: 'استعادة صحة' },
  'Morale Recovery': { def: 'استعادة المعنويات', ind: 'استعادة معنويات' },
  'HP Recovery Rate': { def: 'معدل استعادة الصحة', ind: 'معدل استعادة صحة' },
  'Continuous HP Recovery': { def: 'الاستعادة المستمرة للصحة', ind: 'استعادة مستمرة للصحة' },
  'Continuous Morale Recovery': { def: 'الاستعادة المستمرة للمعنويات', ind: 'استعادة مستمرة للمعنويات' },
  // Source: 「体力に吸収する」— the caster absorbs the damage it deals, i.e.
  // lifesteal, not a drain applied to the enemy.
  'HP Drain': { def: 'امتصاص الصحة', ind: 'امتصاص صحة' },

  // ── Costs and consumption ────────────────────────────────────────────────
  'Material Cost': { def: 'تكلفة المواد', ind: 'تكلفة مواد' },
  'Coin Cost': { def: 'تكلفة العملات', ind: 'تكلفة عملات' },
  'Ore Cost': { def: 'تكلفة الخام', ind: 'تكلفة خام' },
  'Currency Cost': { def: 'تكلفة العملة', ind: 'تكلفة عملة' },
  'Morale Cost': { def: 'استهلاك المعنويات', ind: 'استهلاك معنويات' },
  'Material Consumption': { def: 'استهلاك المواد', ind: 'استهلاك مواد' },
  'Coin Consumption': { def: 'استهلاك العملات', ind: 'استهلاك عملات' },
  'Ore Consumption': { def: 'استهلاك الخام', ind: 'استهلاك خام' },
  'Morale Consumption': { def: 'استهلاك المعنويات', ind: 'استهلاك معنويات' },

  // ── Attack shaping ───────────────────────────────────────────────────────
  'Normal Attack': { def: 'الهجوم العادي', ind: 'هجوم عادي' },
  'Skill Attack': { def: 'هجوم المهارة', ind: 'هجوم مهارة' },
  'Attack Count': { def: 'عدد الهجمات', ind: 'عدد هجمات' },
}

/**
 * Status effects.
 *
 * Wording is taken verbatim from the approved Arabic guide glossary
 * (`GUIDE_COPY.ar.effects.items` in `src/guide.jsx`) so a status reads
 * identically on a skill card and in the guide.
 */
export const STATUSES = {
  'Provoke': 'الاستفزاز',
  'Poison': 'السم',
  'Severe Poison': 'السم الشديد',
  'Burn': 'الحرق',
  'Illusion': 'الوهم',
  'Paralysis': 'الشلل',
  'Confusion': 'الارتباك',
  'Betrayal': 'الخيانة',
  'Rampage': 'الهياج',
  'Fear': 'الخوف',
  'Reckless': 'متهور',
  'Guard': 'الصد',
  'Sure Hit': 'إصابة مؤكدة',
  'Attack Nullification': 'إبطال الهجوم',
  'Less Likely to be Targeted': 'أقل عرضة للاستهداف',
  'Status Effect Immunity': 'مناعة ضد الحالات',
  'Attack Seal': 'ختم الهجوم',
  'Normal Attack Seal': 'ختم الهجوم العادي',
  'Skill Attack Seal': 'ختم هجوم المهارة',
  // Source: 「体力回復無効」— healing is nullified. This is NOT a "seal"
  // placed on HP, so a literal ختم rendering would misstate the mechanic.
  'HP Seal': 'ختم استعادة الصحة',
  'Immunity': 'حصانة',
  'Attack Immunity': 'حصانة من الهجوم',
  'Nullification': 'إبطال',
}

/** Adjectival forms of statuses, used for "poisoned enemy" style selectors. */
export const STATUS_ADJECTIVES = {
  poisoned: { m: 'مسموم', p: 'المسمومين' },
  burned: { m: 'محترق', p: 'المحترقين' },
  feared: { m: 'خائف', p: 'الخائفين' },
  confused: { m: 'مرتبك', p: 'المرتبكين' },
  paralysed: { m: 'مشلول', p: 'المشلولين' },
  paralyzed: { m: 'مشلول', p: 'المشلولين' },
}

/**
 * Bracketed tags: unit types, states (countries), terrain and army markers.
 * Rendered inside the brackets the source uses, e.g. `[جنرال]`.
 *
 * Unit-type wording matches the guide's matchup chart (`دروع`, `سلاح حصار`).
 */
export const TAGS = {
  // Unit types. `coll` is the definite collective used after من
  // ("حليف من المشاة"); `sing` is the bare singular used as a noun head
  // ("جنرال حليف"); one/two/few are the counted forms.
  'General': { coll: 'الجنرالات', sing: 'جنرال', one: 'جنرال واحد', two: 'جنرالان', few: 'جنرالات', label: 'جنرال', kind: 'unit' },
  'Infantry': { coll: 'المشاة', sing: 'جندي مشاة', one: 'جندي مشاة واحد', two: 'جنديا مشاة', few: 'جنود مشاة', label: 'مشاة', kind: 'unit' },
  'Cavalry': { coll: 'الفرسان', sing: 'فارس', one: 'فارس واحد', two: 'فارسان', few: 'فرسان', label: 'فرسان', kind: 'unit' },
  'Archer': { coll: 'السهامين', sing: 'سهام', one: 'سهام واحد', two: 'سهامين', few: 'سهامين', label: 'سهامين', kind: 'unit' },
  'Archers': { coll: 'السهامين', sing: 'سهام', one: 'سهام واحد', two: 'سهامين', few: 'سهامين', label: 'سهامين', kind: 'unit' },
  'Shield': { coll: 'جنود الدروع', sing: 'جندي دروع', one: 'جندي دروع واحد', two: 'جنديا دروع', few: 'جنود دروع', label: 'دروع', kind: 'unit' },
  'Shield Soldiers': { coll: 'جنود الدروع', sing: 'جندي دروع', one: 'جندي دروع واحد', two: 'جنديا دروع', few: 'جنود دروع', label: 'جنود الدروع', kind: 'unit' },
  'Siege Weapon': { coll: 'أسلحة الحصار', sing: 'سلاح حصار', one: 'سلاح حصار واحد', two: 'سلاحا حصار', few: 'أسلحة حصار', label: 'سلاح حصار', kind: 'unit' },
  'Siege Weapons': { coll: 'أسلحة الحصار', sing: 'سلاح حصار', one: 'سلاح حصار واحد', two: 'سلاحا حصار', few: 'أسلحة حصار', label: 'أسلحة حصار', kind: 'unit' },
  'Gate': { coll: 'البوابات', sing: 'بوابة', one: 'بوابة واحدة', two: 'بوابتان', few: 'بوابات', label: 'بوابة', kind: 'unit' },

  // States — the Warring States countries. NOT "الحالات" (statuses).
  // They take no article after من: "حليف من تشين".
  'Qin': { coll: 'تشين', sing: 'تشين', kind: 'state' },
  'Zhao': { coll: 'تشاو', sing: 'تشاو', kind: 'state' },
  'Wei': { coll: 'وي', sing: 'وي', kind: 'state' },
  'Chu': { coll: 'تشو', sing: 'تشو', kind: 'state' },
  'Yan': { coll: 'يان', sing: 'يان', kind: 'state' },
  'Han': { coll: 'هان', sing: 'هان', kind: 'state' },
  'Qi': { coll: 'تشي', sing: 'تشي', kind: 'state' },
  'Ai': { coll: 'آي', sing: 'آي', kind: 'state' },
  'Mountain Folk': { coll: 'جيش الجبال', sing: 'جيش الجبال', kind: 'state' },

  // Terrain — wording matches the guide's terrain section.
  'Slope': { coll: 'المنحدر', sing: 'منحدر', kind: 'terrain' },
  'Forest': { coll: 'الغابة', sing: 'غابة', kind: 'terrain' },
  'River': { coll: 'النهر', sing: 'نهر', kind: 'terrain' },
  'Water': { coll: 'الماء', sing: 'ماء', kind: 'terrain' },
  'Swamp': { coll: 'المستنقع', sing: 'مستنقع', kind: 'terrain' },
  'Marsh': { coll: 'المستنقع', sing: 'مستنقع', kind: 'terrain' },
  'Checkpoint': { coll: 'نقطة التفتيش', sing: 'نقطة تفتيش', kind: 'terrain' },
  'Ambush': { coll: 'الكمين', sing: 'كمين', kind: 'terrain' },

  // Verified group markers the source encloses in brackets. Their proper names
  // stay canonical Latin by policy.
  'Hishin': { coll: 'الهاي شين', sing: 'الهاي شين', kind: 'group' },
  'Gyokuhou': { coll: 'الغيوكوهو', sing: 'الغيوكوهو', kind: 'group' },
}


/**
 * Named armies, squads and groups.
 *
 * Policy: the STRUCTURAL noun is Arabic and the PROPER NAME stays in canonical
 * Latin, e.g. `جيش Kanki`. This reads as ordinary Arabic (noun + name), keeps
 * the identifier searchable and recognisable, and avoids inventing an Arabic
 * spelling for a name we cannot verify. Groups whose name is a common noun or
 * an established phrase are translated in full.
 */
export const GROUPS = {
  'Kanki Army': 'جيش كانكي',
  'Ousen Army': 'جيش أوسن',
  'Karin Army': 'جيش كارين',
  'Renpa Army': 'جيش رينبا',
  'Kanmei Army': 'جيش كانمي',
  'Kisui Army': 'جيش كيسوي',
  'Makou Army': 'جيش ماكو',
  'Ouki Army': 'جيش أوكي',
  'Gakuka Unit': 'وحدة الغاكوكا',
  'Gyokuhou Unit': 'وحدة الغيوكوهو',
  // Same in-fiction unit as 'Gyokuhou Unit' (玉鳳隊); the English source just
  // words it two ways. One Arabic rendering, so the site never names it twice.
  'Gyokuhou Squad': 'وحدة الغيوكوهو',
  'Hi Shin Unit': 'وحدة الهاي شين',
  // Same unit as 'Hi Shin Unit' (飛信隊); the site must not spell it two ways.
  'Hishin Unit': 'وحدة الهاي شين',
  // Common nouns / established phrases — translated in full.
  'Coalition Army': 'جيش التحالف',
  'Six Great Generals': 'الجنرالات الستة العظام',
  // CW siege-weapon buff categories (攻撃兵器 / 防衛兵器). Built on the
  // canonical 'Siege Weapon' = أسلحة الحصار, so the site names them once.
  'Attack Siege Weapons': 'أسلحة الحصار الهجومية',
  'Defense Siege Weapons': 'أسلحة الحصار الدفاعية',
  'Four Pillars': 'الأعمدة الأربعة',
  'Ryofui Four Pillars': 'أعمدة ريوفوي الأربعة',
  "Renpa's Four Heavenly Kings": 'الملوك الأربعة لرينبا',
  'Fire Dragon': 'تنين النار',
  // 'X of Wei' reads as an idafa in Arabic: تنين نار وي.
  'Wei Fire Dragon': 'تنين نار وي',
  'Moubo Army': 'جيش موبو',
  // The source sometimes writes the group with its [General] tag split
  // off, leaving a truncated 'Six Great'.
  'Six Great': 'الجنرالات الستة العظام',
  'Way of The Great General': 'طريق الجنرال العظيم',
  'Way of the Great General': 'طريق الجنرال العظيم',
}

/**
 * Skill-type badges. The source data stores the SHORT English forms
 * (`Combat`, `Strategy`, `Internal Affairs`), which are themselves truncations
 * of "Combat Skill" / "Military Strategy" in `data/glossary/skill_types.json`.
 * The Arabic mirrors that: the badge context supplies the noun "skill", so the
 * qualifier alone is used and the tag stays short.
 */
export const SKILL_TYPES = {
  'Combat': 'قتالية',
  'Strategy': 'استراتيجية',
  'Internal Affairs': 'شؤون داخلية',
  'Leader': 'قائد',
  'Strategist': 'استراتيجي',
}

/** Standalone phrases with a fixed, whole-string Arabic rendering. */
export const PHRASES = {
  ...SKILL_TYPES,
  // A badge marking an Internal Affairs skill as affecting the Castle War map.
  'Map': 'الخريطة',
  'Self': 'صاحب المهارة',
  'Own': 'صاحب المهارة',
  'Ally': 'حليف',
  'Enemy': 'عدو',
  'Enemies': 'الأعداء',
  'All enemies': 'جميع الأعداء',
  'Enemy General': 'جنرال من العدو',
  'Enemy generals': 'جنرالات العدو',
  'Gate': 'البوابة',
  'Passing unit': 'الوحدة العابرة',
  'Passing squad': 'الوحدة العابرة',
  'Other ally': 'حليف آخر',
  'Other allies': 'حلفاء آخرون',
  'Random': 'عشوائي',
  'Alive': 'البقاء على قيد الحياة',
  'Surviving': 'البقاء على قيد الحياة',
  'surviving': 'على قيد الحياة',
  'Garrisoning': 'الدفاع',
  'Attacking': 'الهجوم',
  'When Garrisoning': 'عند الدفاع',
  'When Attacking': 'عند الهجوم',
  'Per turn elapsed': 'لكل جولة تنقضي',
  'Betrayal-afflicted': 'مصاب بالخيانة',
  'Status Effect Immunity (excl. Provoke)': 'حصانة الحالات (عدا الاستفزاز)',
  '% of Remaining HP Damage': 'ضرر بنسبة من الصحة المتبقية',
  '% of remaining HP Damage': 'ضرر بنسبة من الصحة المتبقية',
  'Higher own remaining HP (scales)': 'كلما زادت صحتك المتبقية',
  'Lower own remaining HP (scales)': 'كلما قلّت صحتك المتبقية',
  'gate HP remaining': 'الصحة المتبقية للبوابة',
  // Kept in the same ذو + indefinite frame the pattern renderer produces, so a
  // hand-listed phrase never reads differently from a generated one.
  'The enemy with the lowest remaining strength': 'العدو ذو أقل قوة متبقية',
  'The enemy with the lowest defense.': 'العدو ذو أقل دفاع',
  'CW battle': 'حرب القلاع',
  'Effect Resistance': 'مقاومة التأثير',
  // Deterministic compound rows that cannot be safely decomposed by the
  // generic grammar without changing which selector a qualifier belongs to.
  'Self vs infantry / vs cavalry': 'صاحب المهارة ضد المشاة / ضد الفرسان',
  'When Garrisoning, upon % Damage activation': 'عند الدفاع، عند تفعيل ضرر النسبة المئوية',
  'Per ally [Infantry] / per other ally [Archer] [General]': 'لكل حليف من المشاة / لكل حليف آخر من السهامين',
  'Enemy "Riboku", "Ei Sei", "Queen Biki" "Attack Seal" 70%': 'ختم الهجوم بنسبة 70% على ريبوكو وإي سي والملكة بيكي من العدو',
  'Other ally [Qin] or [Mountain Folk] alive, first enemy in formation': 'حليف آخر من تشين أو جيش الجبال على قيد الحياة، وأول عدو في التشكيلة',
  'Per ally Ousen Army [General] besides self': 'لكل جنرال حليف من جيش أوسن عدا صاحب المهارة',
  '1 each of [Zhao]/[Wei]/[Chu]/[Qi] enemy': 'عدو واحد من كل من تشاو ووي وتشو وتشي',
  'When ally Soutan is alive and own HP is 70% or higher': 'عندما يكون سوتان الحليف على قيد الحياة وتكون صحة صاحب المهارة 70% أو أكثر',
  'Ally [Siege Weapon] vs enemy [Siege Weapon]': 'أسلحة الحصار الحليفة ضد أسلحة حصار العدو',
  'When Garrisoning, While gate has HP remaining': 'عند الدفاع، ما دامت للبوابة صحة متبقية',
  'Per ally Sho / per other ally Six Great [General]': 'لكل شو حليف / لكل جنرال حليف آخر من الجنرالات الستة العظام',
  'Per other ally [Qin] / [Mountain Folk] [General]': 'لكل جنرال حليف آخر من تشين أو جيش الجبال',
  'When Garrisoning, enemy [Infantry] / enemy [Siege Weapon] with highest ATK': 'عند الدفاع، جندي المشاة أو سلاح الحصار من العدو صاحب أعلى هجوم',
  'Damage dealt by Shihaku': 'الضرر الذي يلحقه شيهاكو',
  'Surviving ally "Ranbihaku", "GHM", and Wei Fire Dragon [General]': 'الحلفاء على قيد الحياة: رانبيهاكو، غوهومي، وجنرالات تنين نار وي',
  'Surviving ally [Zhao] when enemies are alive': 'حليف من تشاو على قيد الحياة عندما يكون الأعداء على قيد الحياة',
  '1 [Infantry] / 1 [Cavalry] enemy [General]': 'جندي مشاة واحد / فارس واحد من العدو',
  'Hi Shin Unit enemy with highest ATK': 'عضو وحدة الهاي شين لدى العدو صاحب أعلى هجوم',
  '1 enemy Hi Shin Unit member': 'عضو واحد من وحدة الهاي شين لدى العدو',
  'Enemy [Qin] or [Mountain Folk] alive': 'عدو من تشين أو جيش الجبال على قيد الحياة',
}

/**
 * Parenthetical qualifiers that appear appended to conditions.
 * All three English spellings mean the same thing in the source data.
 */
export const QUALIFIERS = {
  'active even when not deployed': 'فعال حتى بدون المشاركة بالمعركة',
  'effective even when not deployed': 'فعال حتى بدون المشاركة بالمعركة',
  'effective even if not deployed': 'فعال حتى بدون المشاركة بالمعركة',
  'excl. Provoke': 'عدا الاستفزاز',
  'other than self': 'عدا نفسه',
  'scales': 'يتدرج',
  'additional': 'إضافي',
}

/** Superlative frames. The complement must be INDEFINITE after these. */
export const SUPERLATIVE = {
  highest: 'أعلى',
  lowest: 'أقل',
  higher: 'أعلى',
  lower: 'أقل',
}

/**
 * Four legacy ally references in the effect corpus spelled a roster general a
 * second way. The RanHQ-authored rows are now corrected at source, while these
 * aliases remain for older imported text. Each mapping was resolved from the
 * Japanese source, not guessed — the skill's own
 * 「{-N:characterId}」 token identifies the general:
 *
 *   Juutekkō -> 戎翟公 (id 190) -> Wategi
 *   Seikyo    -> 成蟜   (id 40)  -> Seikyou
 *   Reihō     -> 霊凰   (id 181) -> Reiou
 *   Gaimo     -> 凱孟   (id 180) -> Gaimou
 *
 * Retained at the presentation layer for backwards-compatible parsing.
 */
export const CHARACTER_ALIASES = {
  'juutekkō': 'Wategi',
  'juutekko': 'Wategi',
  'seikyo': 'Seikyou',
  'reihō': 'Reiou',
  'reiho': 'Reiou',
  'gaimo': 'Gaimou',
  // Common source abbreviation for Gohoumei.
  'ghm': 'Gohoumei',
}
