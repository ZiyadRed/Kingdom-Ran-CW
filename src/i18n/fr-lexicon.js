/**
 * Canonical French lexicon for Kingdom Ran game data.
 *
 * This is the SINGLE source of French terminology for dynamically rendered
 * game text (skill effects, targets, conditions, durations). It mirrors the
 * hand-written French guide copy in `src/guide.jsx`; when the two would
 * disagree, the guide wins and this file is corrected.
 *
 * Terminology is aligned with the French Kingdom Ran community site TouranKo
 * (touranko.vercel.app), which is where French players already read this
 * game's vocabulary: fantassin / cavalier / archer / bouclier for the unit
 * types, PV and moral for the bars, "taux critique", "regain de moral",
 * "soin", "sceau", "brûlure", "peur", "confusion", and the states kept under
 * their canonical names (Qin, Zhao, …, peuple des montagnes).
 *
 * Grammar contract for stat entries:
 *   de — the PARTITIVE form, used after a percentage and after a superlative:
 *        `+20%` + `d’attaque`, `avec le plus` + `d’attaque`.
 *   le — the DEFINITE form, used when the stat is the subject of a clause:
 *        `l’attaque`, `les PV restants`.
 *   a  — the À-CONTRACTED form, used after `résistance`:
 *        `résistance` + `à la pénétration de défense`.
 * Storing all three rather than deriving them keeps elision (d’/de),
 * contraction (à la / au / aux / à l’) and gender out of the renderer.
 */

/** How a stat moving up or down is signed. The game itself uses +/-. */
export const DIRECTION = {
  up: '+',
  down: '-',
}

/**
 * Stat and metric names.
 *
 * Keys are the exact English phrases that appear in the project effect corpus
 * (`data/characters/*.json`), matched case-insensitively by the renderer.
 */
export const STATS = {
  // ── Core combat stats ────────────────────────────────────────────────────
  'ATK': { de: 'd’attaque', le: 'l’attaque', a: 'à l’attaque' },
  'Attack': { de: 'd’attaque', le: 'l’attaque', a: 'à l’attaque' },
  'Attack Power': { de: 'de puissance d’attaque', le: 'la puissance d’attaque', a: 'à la puissance d’attaque' },
  'attack power': { de: 'de puissance d’attaque', le: 'la puissance d’attaque', a: 'à la puissance d’attaque' },
  'DEF': { de: 'de défense', le: 'la défense', a: 'à la défense' },
  'Defense': { de: 'de défense', le: 'la défense', a: 'à la défense' },
  'defense': { de: 'de défense', le: 'la défense', a: 'à la défense' },
  'HP': { de: 'de PV', le: 'les PV', a: 'aux PV' },
  'Morale': { de: 'de moral', le: 'le moral', a: 'au moral' },
  'MOV': { de: 'de mouvement', le: 'le mouvement', a: 'au mouvement' },
  'Speed': { de: 'de vitesse', le: 'la vitesse', a: 'à la vitesse' },

  // ── Screen stats — wording from the guide's CW stats screen ──────────────
  'Hit Rate': { de: 'de précision', le: 'la précision', a: 'à la précision' },
  'Critical Rate': { de: 'de taux critique', le: 'le taux critique', a: 'au taux critique' },
  'Critical Damage': { de: 'de dégâts critiques', le: 'les dégâts critiques', a: 'aux dégâts critiques' },
  'DEF Penetration': { de: 'de pénétration de défense', le: 'la pénétration de défense', a: 'à la pénétration de défense' },
  'Defense Penetration': { de: 'de pénétration de défense', le: 'la pénétration de défense', a: 'à la pénétration de défense' },
  'Evasion': { de: 'd’esquive', le: 'l’esquive', a: 'à l’esquive' },
  'Dodge Chance': { de: 'd’esquive', le: 'l’esquive', a: 'à l’esquive' },
  'Evasion (Dodge Chance)': { de: 'd’esquive', le: 'l’esquive', a: 'à l’esquive' },
  'Repair Speed': { de: 'de vitesse de réparation', le: 'la vitesse de réparation', a: 'à la vitesse de réparation' },

  // ── Maximum / remaining / current values ─────────────────────────────────
  'Max HP': { de: 'de PV max', le: 'les PV max', a: 'aux PV max' },
  'Max Morale': { de: 'de moral max', le: 'le moral max', a: 'au moral max' },
  'max morale': { de: 'de moral max', le: 'le moral max', a: 'au moral max' },
  'max HP': { de: 'de PV max', le: 'les PV max', a: 'aux PV max' },
  'Max Attack': { de: 'd’attaque maximale', le: 'l’attaque maximale', a: 'à l’attaque maximale' },
  'Min Attack': { de: 'd’attaque minimale', le: 'l’attaque minimale', a: 'à l’attaque minimale' },
  'remaining HP': { de: 'de PV restants', le: 'les PV restants', a: 'aux PV restants' },
  'Remaining HP': { de: 'de PV restants', le: 'les PV restants', a: 'aux PV restants' },
  'remaining morale': { de: 'de moral restant', le: 'le moral restant', a: 'au moral restant' },
  'remaining Morale': { de: 'de moral restant', le: 'le moral restant', a: 'au moral restant' },
  'Remaining Morale': { de: 'de moral restant', le: 'le moral restant', a: 'au moral restant' },
  'remaining strength': { de: 'de puissance restante', le: 'la puissance restante', a: 'à la puissance restante' },
  'Starting HP': { de: 'de PV au départ', le: 'les PV au départ', a: 'aux PV au départ' },
  'Current HP': { de: 'de PV actuels', le: 'les PV actuels', a: 'aux PV actuels' },

  // ── Damage families ──────────────────────────────────────────────────────
  'Damage': { de: 'de dégâts', le: 'les dégâts', a: 'aux dégâts' },
  'Damage Dealt': { de: 'de dégâts infligés', le: 'les dégâts infligés', a: 'aux dégâts infligés' },
  'Damage Taken': { de: 'de dégâts subis', le: 'les dégâts subis', a: 'aux dégâts subis' },
  'Damage Received': { de: 'de dégâts subis', le: 'les dégâts subis', a: 'aux dégâts subis' },
  // 部隊被ダメージ軽減 — the whole squad takes less, so the noun carries it.
  'Squad Damage': { de: 'de dégâts subis par l’unité', le: 'les dégâts subis par l’unité', a: 'aux dégâts subis par l’unité' },
  'Squad Damage Reduction': { de: 'de réduction des dégâts de l’unité', le: 'la réduction des dégâts de l’unité', a: 'à la réduction des dégâts de l’unité' },
  'Damage Taken Increase': { de: 'd’augmentation des dégâts subis', le: 'l’augmentation des dégâts subis', a: 'à l’augmentation des dégâts subis' },
  'Damage Dealt Reduction': { de: 'de réduction des dégâts infligés', le: 'la réduction des dégâts infligés', a: 'à la réduction des dégâts infligés' },
  'Starting Troop HP Loss': { de: 'de perte de PV au départ', le: 'la perte de PV au départ', a: 'à la perte de PV au départ' },
  'Damage Reduction Effect': { de: 'd’effet de réduction de dégâts', le: 'l’effet de réduction de dégâts', a: 'aux effets de réduction de dégâts' },
  'Poison Damage': { de: 'de dégâts de poison', le: 'les dégâts de poison', a: 'aux dégâts de poison' },
  // Lets "Effect Resistance 5.4%" resolve through the generic Resistance rule.
  'Effect': { de: 'd’effet', le: 'l’effet', a: 'aux effets' },

  // Resistance compounds that also appear as standalone UI labels (the
  // scene-card buff panel).
  'Attack Down Resistance': { de: 'de résistance à la baisse d’attaque', le: 'la résistance à la baisse d’attaque', a: 'à la baisse d’attaque' },
  'Defense Down Resistance': { de: 'de résistance à la baisse de défense', le: 'la résistance à la baisse de défense', a: 'à la baisse de défense' },
  'DEF Penetration Resistance': { de: 'de résistance à la pénétration de défense', le: 'la résistance à la pénétration de défense', a: 'à la pénétration de défense' },

  // ── Recovery / drain ─────────────────────────────────────────────────────
  // TouranKo says "Soin de 35% de PV" and "regain de moral"; both are kept.
  'HP Recovery': { de: 'de soin', le: 'le soin', a: 'au soin', heal: 'PV' },
  'HP Recovery Nullification': { de: 'd’annulation des soins', le: 'l’annulation des soins', a: 'à l’annulation des soins' },
  'Morale Recovery': { de: 'de regain de moral', le: 'le regain de moral', a: 'au regain de moral' },
  'HP Recovery Rate': { de: 'de taux de soin', le: 'le taux de soin', a: 'au taux de soin' },
  'Continuous HP Recovery': { de: 'de soin continu', le: 'le soin continu', a: 'au soin continu' },
  'Continuous Morale Recovery': { de: 'de regain de moral continu', le: 'le regain de moral continu', a: 'au regain de moral continu' },
  // Source: 「体力に吸収する」— the caster absorbs the damage it deals, i.e.
  // lifesteal, which French players call "vol de vie".
  'HP Drain': { de: 'de vol de vie', le: 'le vol de vie', a: 'au vol de vie' },

  // ── Costs and consumption ────────────────────────────────────────────────
  'Material Cost': { de: 'de coût en matériaux', le: 'le coût en matériaux', a: 'au coût en matériaux' },
  'Coin Cost': { de: 'de coût en pièces', le: 'le coût en pièces', a: 'au coût en pièces' },
  'Ore Cost': { de: 'de coût en minerai', le: 'le coût en minerai', a: 'au coût en minerai' },
  'Currency Cost': { de: 'de coût en monnaie', le: 'le coût en monnaie', a: 'au coût en monnaie' },
  'Morale Cost': { de: 'de coût en moral', le: 'le coût en moral', a: 'au coût en moral' },
  'Material Consumption': { de: 'de consommation de matériaux', le: 'la consommation de matériaux', a: 'à la consommation de matériaux' },
  'Coin Consumption': { de: 'de consommation de pièces', le: 'la consommation de pièces', a: 'à la consommation de pièces' },
  'Ore Consumption': { de: 'de consommation de minerai', le: 'la consommation de minerai', a: 'à la consommation de minerai' },
  'Morale Consumption': { de: 'de consommation de moral', le: 'la consommation de moral', a: 'à la consommation de moral' },

  // ── Attack shaping ───────────────────────────────────────────────────────
  'Normal Attack': { de: 'd’attaque normale', le: 'l’attaque normale', a: 'à l’attaque normale' },
  'Skill Attack': { de: 'd’attaque de compétence', le: 'l’attaque de compétence', a: 'à l’attaque de compétence' },
  'Attack Count': { de: 'de nombre d’attaques', le: 'le nombre d’attaques', a: 'au nombre d’attaques' },
}

/**
 * Status effects.
 *
 * `label` heads a card or a bare mention; `def` follows a verb
 * ("infliger la confusion"); `a` follows "résistance"/"immunité"
 * ("résistance au poison"). The wording matches `GUIDE_COPY.fr.effects.items`
 * in `src/guide.jsx`, so a status reads identically on a skill card and in
 * the guide, and follows TouranKo for poison / brûlure / peur / confusion /
 * sceau — including "sceau de soin" for 体力回復無効.
 */
export const STATUSES = {
  'Provoke': { label: 'Provocation', def: 'la provocation', a: 'à la provocation' },
  'Provocation': { label: 'Provocation', def: 'la provocation', a: 'à la provocation' },
  'Poison': { label: 'Poison', def: 'le poison', a: 'au poison' },
  'Severe Poison': { label: 'Poison violent', def: 'le poison violent', a: 'au poison violent' },
  'Burn': { label: 'Brûlure', def: 'la brûlure', a: 'aux brûlures' },
  'Illusion': { label: 'Illusion', def: 'l’illusion', a: 'à l’illusion' },
  'Paralysis': { label: 'Paralysie', def: 'la paralysie', a: 'à la paralysie' },
  'Confusion': { label: 'Confusion', def: 'la confusion', a: 'à la confusion' },
  'Betrayal': { label: 'Trahison', def: 'la trahison', a: 'à la trahison' },
  'Rampage': { label: 'Furie', def: 'la furie', a: 'à la furie' },
  'Fear': { label: 'Peur', def: 'la peur', a: 'à la peur' },
  // 捨て身 — attack way up, damage taken up with it.
  'Reckless': { label: 'Témérité', def: 'la témérité', a: 'à la témérité' },
  'Guard': { label: 'Garde', def: 'la garde', a: 'à la garde' },
  'Sure Hit': { label: 'Coup assuré', def: 'le coup assuré', a: 'au coup assuré' },
  'Attack Nullification': { label: 'Annulation d’attaque', def: 'l’annulation d’attaque', a: 'à l’annulation d’attaque' },
  'Less Likely to be Targeted': { label: 'Ciblage réduit', def: 'le ciblage réduit', a: 'au ciblage réduit' },
  'Status Effect Immunity': { label: 'Immunité aux altérations d’état', def: 'l’immunité aux altérations d’état', a: 'à l’immunité aux altérations d’état' },
  'Attack Seal': { label: 'Sceau d’attaque', def: 'le sceau d’attaque', a: 'au sceau d’attaque' },
  'Normal Attack Seal': { label: 'Sceau d’attaque normale', def: 'le sceau d’attaque normale', a: 'au sceau d’attaque normale' },
  'Skill Attack Seal': { label: 'Sceau d’attaque de compétence', def: 'le sceau d’attaque de compétence', a: 'au sceau d’attaque de compétence' },
  // Source: 「体力回復無効」— healing is switched off. TouranKo calls the same
  // mechanic "sceau de soin", so RanHQ does too.
  'HP Seal': { label: 'Sceau de soin', def: 'le sceau de soin', a: 'au sceau de soin' },
  'Immunity': { label: 'Immunité', def: 'l’immunité', a: 'à l’immunité' },
  'Attack Immunity': { label: 'Immunité aux attaques', def: 'l’immunité aux attaques', a: 'à l’immunité aux attaques' },
  'Nullification': { label: 'Annulation', def: 'l’annulation', a: 'à l’annulation' },
}

/** Participle forms of statuses, for "poisoned enemy" style selectors. */
export const STATUS_ADJECTIVES = {
  poisoned: { m: 'empoisonné', p: 'empoisonnés' },
  burned: { m: 'brûlé', p: 'brûlés' },
  feared: { m: 'apeuré', p: 'apeurés' },
  confused: { m: 'sous Confusion', p: 'sous Confusion' },
  paralysed: { m: 'paralysé', p: 'paralysés' },
  paralyzed: { m: 'paralysé', p: 'paralysés' },
}

/**
 * Bracketed tags: unit types, states (countries), terrain and army markers.
 * The brackets are RanHQ's own parsing artifact — the Japanese source writes
 * 「味方歩兵」 with none — so French drops them and builds a real phrase.
 *
 * `s`/`p` are the singular and plural nouns; `after` is what follows
 * "alliés"/"ennemis" for a state ("alliés Qin", "alliés du Peuple des
 * Montagnes"); `de` is the complement form for a named group.
 */
export const TAGS = {
  // Unit types — TouranKo's wording.
  'General': { s: 'général', p: 'généraux', label: 'général', kind: 'unit', general: true },
  'Infantry': { s: 'fantassin', p: 'fantassins', label: 'fantassins', kind: 'unit', searchAliases: ['infanterie'] },
  'Cavalry': { s: 'cavalier', p: 'cavaliers', label: 'cavaliers', kind: 'unit' },
  'Archer': { s: 'archer', p: 'archers', label: 'archers', kind: 'unit' },
  'Archers': { s: 'archer', p: 'archers', label: 'archers', kind: 'unit' },
  'Shield': { s: 'bouclier', p: 'boucliers', label: 'boucliers', kind: 'unit' },
  'Shield Soldiers': { s: 'bouclier', p: 'boucliers', label: 'boucliers', kind: 'unit' },
  'Siege Weapon': { s: 'engin de siège', p: 'engins de siège', label: 'engin de siège', kind: 'unit' },
  'Siege Weapons': { s: 'engin de siège', p: 'engins de siège', label: 'engins de siège', kind: 'unit' },
  'Gate': { s: 'porte', p: 'portes', label: 'porte', kind: 'unit', f: true },

  // States — the Warring States countries keep their canonical names, exactly
  // as TouranKo's own state filter lists them.
  'Qin': { s: 'Qin', p: 'Qin', after: 'Qin', label: 'Qin', kind: 'state' },
  'Zhao': { s: 'Zhao', p: 'Zhao', after: 'Zhao', label: 'Zhao', kind: 'state' },
  'Wei': { s: 'Wei', p: 'Wei', after: 'Wei', label: 'Wei', kind: 'state' },
  'Chu': { s: 'Chu', p: 'Chu', after: 'Chu', label: 'Chu', kind: 'state' },
  'Yan': { s: 'Yan', p: 'Yan', after: 'Yan', label: 'Yan', kind: 'state' },
  'Han': { s: 'Han', p: 'Han', after: 'Han', label: 'Han', kind: 'state' },
  'Qi': { s: 'Qi', p: 'Qi', after: 'Qi', label: 'Qi', kind: 'state' },
  'Ai': { s: 'Ai', p: 'Ai', after: 'Ai', label: 'Ai', kind: 'state' },
  'Mountain Folk': { s: 'peuple des montagnes', p: 'peuple des montagnes', after: 'du peuple des montagnes', de: 'du peuple des montagnes', label: 'Peuple des montagnes', kind: 'state' },

  // Terrain — wording matches the guide's terrain section.
  'Slope': { s: 'pente', p: 'pentes', of: 'de pente', pass: 'une route en pente', label: 'Pente', kind: 'terrain' },
  'Forest': { s: 'forêt', p: 'forêts', of: 'de forêt', pass: 'une route en forêt', label: 'Forêt', kind: 'terrain' },
  'River': { s: 'rivière', p: 'rivières', of: 'de rivière', pass: 'une voie d’eau', label: 'Rivière', kind: 'terrain' },
  'Water': { s: 'eau', p: 'eaux', of: 'aquatique', pass: 'une voie d’eau', label: 'Eau', kind: 'terrain' },
  'Swamp': { s: 'marais', p: 'marais', of: 'de marais', pass: 'une route marécageuse', label: 'Marais', kind: 'terrain' },
  'Marsh': { s: 'marais', p: 'marais', of: 'de marais', pass: 'une route marécageuse', label: 'Marais', kind: 'terrain' },
  'Checkpoint': { s: 'poste de garde', p: 'postes de garde', of: 'de poste de garde', pass: 'une route avec un poste de garde', label: 'Poste de garde', kind: 'terrain' },
  'Ambush': { s: 'embuscade', p: 'embuscades', of: 'd’embuscade', pass: 'une route exposée aux embuscades', label: 'Embuscade', kind: 'terrain' },

  // Verified group markers the source encloses in brackets.
  'Hishin': { s: 'unité Hi Shin', p: 'unité Hi Shin', after: 'de l’unité Hi Shin', de: 'de l’unité Hi Shin', label: 'Hi Shin', kind: 'group' },
  'Gyokuhou': { s: 'unité Gyokuhou', p: 'unité Gyokuhou', after: 'de l’unité Gyokuhou', de: 'de l’unité Gyokuhou', label: 'Gyokuhou', kind: 'group' },
}

/**
 * Named armies, squads and groups.
 *
 * Policy: the STRUCTURAL noun is French and the PROPER NAME stays canonical
 * Latin — `armée de Kanki` — which is how TouranKo writes them too. Groups
 * whose name is a common noun or an established phrase are translated whole.
 * `de` is the complement form used after "alliés"/"ennemis".
 */
export const GROUPS = {
  'Mera Tribe': { name: 'tribu Mera', de: 'de la tribu Mera' },
  'Figo Tribe': { name: 'tribu Figo', de: 'de la tribu Figo' },
  'Akou Army': { name: 'armée d’Akou', de: 'de l’armée d’Akou' },
  'Gyokuhou': { name: 'unité Gyokuhou', de: 'de l’unité Gyokuhou' },
  'Qiang Tribe': { name: 'tribu Qiang', de: 'de la tribu Qiang' },
  'Chinese Ten Bows': { name: 'Dix Arcs de Chine', de: 'des Dix Arcs de Chine' },
  "Zhao's New Three Great Heavens": { name: 'Trois Nouveaux Grands Cieux de Zhao', de: 'des Trois Nouveaux Grands Cieux de Zhao' },
  "Zhao's Three Great Heavens": { name: 'Trois Grands Cieux de Zhao', de: 'des Trois Grands Cieux de Zhao' },
  'Seikai Army': { name: 'armée de Seikai', de: 'de l’armée de Seikai' },
  'Kanki Army': { name: 'armée de Kanki', de: 'de l’armée de Kanki' },
  'Ousen Army': { name: 'armée d’Ousen', de: 'de l’armée d’Ousen' },
  'Karin Army': { name: 'armée de Karin', de: 'de l’armée de Karin' },
  'Renpa Army': { name: 'armée de Renpa', de: 'de l’armée de Renpa' },
  'Kanmei Army': { name: 'armée de Kanmei', de: 'de l’armée de Kanmei' },
  'Kisui Army': { name: 'armée de Kisui', de: 'de l’armée de Kisui' },
  'Makou Army': { name: 'armée de Makou', de: 'de l’armée de Makou' },
  'Ouki Army': { name: 'armée d’Ouki', de: 'de l’armée d’Ouki' },
  'Moubo Army': { name: 'armée de Moubo', de: 'de l’armée de Moubo' },
  'Gakuka Unit': { name: 'unité Gakuka', de: 'de l’unité Gakuka' },
  'Gyokuhou Unit': { name: 'unité Gyokuhou', de: 'de l’unité Gyokuhou' },
  // Same in-fiction unit as 'Gyokuhou Unit' (玉鳳隊); the English source just
  // words it two ways. One French rendering, so the site never names it twice.
  'Gyokuhou Squad': { name: 'unité Gyokuhou', de: 'de l’unité Gyokuhou' },
  'Hi Shin Unit': { name: 'unité Hi Shin', de: 'de l’unité Hi Shin' },
  'Hishin Unit': { name: 'unité Hi Shin', de: 'de l’unité Hi Shin' },
  // Common nouns / established phrases — translated in full.
  'Coalition Army': { name: 'armée de la Coalition', de: 'de l’armée de la Coalition' },
  'Six Great Generals': { name: 'Six Grands Généraux', de: 'des Six Grands Généraux' },
  'Six Great Generals of Qin': { name: 'Six Grands Généraux de Qin', de: 'des Six Grands Généraux de Qin' },
  // The source sometimes writes the group with its [General] tag split off,
  // leaving a truncated 'Six Great'.
  'Six Great': { name: 'Six Grands Généraux', de: 'des Six Grands Généraux' },
  // CW siege-weapon buff categories (攻撃兵器 / 防衛兵器), built on the
  // canonical 'Siege Weapon' so the site names them once.
  'Attack Siege Weapons': { name: 'engins de siège d’attaque', de: 'des engins de siège d’attaque' },
  'Defense Siege Weapons': { name: 'engins de siège de défense', de: 'des engins de siège de défense' },
  'Four Pillars': { name: 'Quatre Piliers', de: 'des Quatre Piliers' },
  'Ryofui Four Pillars': { name: 'Quatre Piliers de Ryofui', de: 'des Quatre Piliers de Ryofui' },
  "Renpa's Four Heavenly Kings": { name: 'Quatre Rois Célestes de Renpa', de: 'des Quatre Rois Célestes de Renpa' },
  'Fire Dragon': { name: 'Dragon de Feu', de: 'du Dragon de Feu' },
  'Wei Fire Dragon': { name: 'Dragon de Feu de Wei', de: 'du Dragon de Feu de Wei' },
  'Way of The Great General': { name: 'Voie du Grand Général', de: 'de la Voie du Grand Général' },
  'Way of the Great General': { name: 'Voie du Grand Général', de: 'de la Voie du Grand Général' },
}

/**
 * Skill-type badges. The source stores the SHORT English forms (`Combat`,
 * `Strategy`, `Internal Affairs`), themselves truncations of "Combat Skill" /
 * "Military Strategy". French keeps them short the same way, and uses the
 * community's own Leader / Stratège pair for the two formation roles.
 */
export const SKILL_TYPES = {
  'Combat': 'Combat',
  'Strategy': 'Stratégie',
  'Internal Affairs': 'Affaires intérieures',
  'Leader': 'Leader',
  'Strategist': 'Stratège',
}

/** Standalone phrases with a fixed, whole-string French rendering. */
export const PHRASES = {
  ...SKILL_TYPES,
  // A badge marking an Internal Affairs skill as affecting the CW map.
  'Map': 'Carte',
  'Self': 'Soi-même',
  'Own': 'Soi-même',
  'Ally': 'Allié',
  'Enemy': 'Ennemi',
  'Enemies': 'Ennemis',
  'All enemies': 'Tous les ennemis',
  'Enemy General': 'Général ennemi',
  'Enemy generals': 'Généraux ennemis',
  'Gate': 'Porte',
  '[Siege Weapon] repair': 'Réparation des engins de siège',
  'Passing unit': 'Unité en transit',
  'Passing squad': 'Unité en transit',
  'Other': 'Autre',
  'Other ally': 'Autres alliés',
  'Other allies': 'Autres alliés',
  'Random': 'Aléatoire',
  'Alive': 'En vie',
  'Surviving': 'Survivant',
  // The bare forms head a "Quand" chip, so they stay nouns; the "When …"
  // forms are whole conditions and carry their own preposition.
  'Garrisoning': 'Garnison',
  'Attacking': 'Attaque',
  'repairing CW [Siege Weapon]': 'réparation d’un engin de siège de Conquête',
  'When Garrisoning': 'En garnison',
  'When Attacking': 'En attaque',
  'While alive': 'Tant que l’unité est en vie',
  'When ally is alive': 'Quand un allié est en vie',
  'Per turn elapsed': 'Par tour écoulé',
  'Per own attack count': 'Par attaque effectuée par l’unité',
  'Per allied attack count': 'Par attaque effectuée par un allié',
  'Betrayal-afflicted': 'Sous Trahison',
  'Status Effect Immunity (excl. Provoke)': 'Immunité aux altérations d’état (sauf Provocation)',
  '% of Remaining HP Damage': 'Dégâts en % des PV restants',
  '% of remaining HP Damage': 'Dégâts en % des PV restants',
  'From the % HP Damage': 'À partir des dégâts en % de PV',
  'From the % HP Damage above': 'À partir des dégâts en % de PV ci-dessus',
  'From % HP Damage above': 'À partir des dégâts en % de PV ci-dessus',
  'From damage': 'À partir des dégâts',
  'Higher own remaining HP (scales)': 'Plus les PV restants de l’unité sont élevés (progressif)',
  'Lower own remaining HP (scales)': 'Plus les PV restants de l’unité sont faibles (progressif)',
  'The higher own remaining HP': 'Plus les PV restants de l’unité sont élevés',
  'The lower own remaining HP': 'Plus les PV restants de l’unité sont faibles',
  'gate HP remaining': 'tant que la porte conserve des PV',
  'While gate has HP remaining': 'tant que la porte conserve des PV',
  'ally alive': 'qu’un allié est en vie',
  'Enemy alive': 'Ennemi en vie',
  'The enemy with the lowest remaining strength': 'L’ennemi avec le moins de puissance restante',
  'The enemy with the lowest defense.': 'L’ennemi avec le moins de défense.',
  'The enemy with the lowest attack power': 'L’ennemi avec le moins de puissance d’attaque',
  'CW battle': 'Bataille de Conquête',
  'Effect Resistance': 'Résistance aux effets',
  'Damage Received significantly Down': 'Dégâts subis fortement réduits',
  'Rampage': 'Furie',
  'Reckless': 'Témérité',
  'Sure Hit': 'Coup assuré',
  'first enemy in formation': 'premier ennemi de la formation',
  // Deterministic compound rows that cannot be safely decomposed by the
  // generic grammar without changing which selector a qualifier belongs to.
  'Self vs infantry / vs cavalry': 'Soi-même contre les fantassins / contre les cavaliers',
  'When Garrisoning, upon % Damage activation': 'En garnison, au déclenchement des dégâts en %',
  'When Garrisoning, % HP Damage triggered': 'En garnison, au déclenchement des dégâts en % de PV',
  'When Garrisoning, from % HP Damage': 'En garnison, à partir des dégâts en % de PV',
  'Per ally [Infantry] / per other ally [Archer] [General]': 'Par fantassin allié / par autre général archer allié',
  'Enemy "Riboku", "Ei Sei", "Queen Biki" "Attack Seal" 70%': '70% de chances d’infliger le sceau d’attaque aux généraux ennemis Riboku, Ei Sei et Queen Biki',
  'Other ally [Qin] or [Mountain Folk] alive, first enemy in formation': 'Un autre allié Qin ou du peuple des montagnes est en vie, premier ennemi de la formation',
  'Per ally Ousen Army [General] besides self': 'Par autre général allié de l’armée d’Ousen',
  '1 each of [Zhao]/[Wei]/[Chu]/[Qi] enemy': '1 ennemi de chacune des factions Zhao, Wei, Chu et Qi',
  'When ally Soutan is alive and own HP is 70% or higher': 'Quand l’allié Soutan est en vie et que les PV de l’unité atteignent au moins 70%',
  'Ally [Siege Weapon] vs enemy [Siege Weapon]': 'Engins de siège alliés contre les engins de siège ennemis',
  'When Garrisoning, While gate has HP remaining': 'En garnison, tant que la porte conserve des PV',
  'When Garrisoning, gate HP remaining': 'En garnison, tant que la porte conserve des PV',
  'When Garrisoning, gate HP remaining, ally alive': 'En garnison, tant que la porte conserve des PV et qu’un allié est en vie',
  'Per ally Sho / per other ally Six Great [General]': 'Par allié Sho / par autre général allié des Six Grands Généraux',
  'Per other ally [Qin] / [Mountain Folk] [General]': 'Par autre général allié Qin ou du peuple des montagnes',
  'When Garrisoning, enemy [Infantry] / enemy [Siege Weapon] with highest ATK': 'En garnison, fantassin ou engin de siège ennemi avec le plus d’attaque',
  'Damage dealt by Shihaku': 'Dégâts infligés par Shihaku',
  'Surviving ally "Ranbihaku", "GHM", and Wei Fire Dragon [General]': 'Ranbihaku et Gohoumei alliés survivants, ainsi que les généraux survivants du Dragon de Feu de Wei',
  'Surviving ally [Zhao] when enemies are alive': 'Allié Zhao survivant tant qu’au moins un ennemi est en vie',
  '1 [Infantry] / 1 [Cavalry] enemy [General]': '1 général fantassin ennemi / 1 général cavalier ennemi',
  'Hi Shin Unit enemy with highest ATK': 'Membre ennemi de l’unité Hi Shin avec le plus d’attaque',
  '1 enemy Hi Shin Unit member': '1 membre ennemi de l’unité Hi Shin',
  'Enemy [Qin] or [Mountain Folk] alive': 'Quand au moins un ennemi Qin ou un membre ennemi du peuple des montagnes est en vie',
  'Ally "Duke Hyou" and [Hishin] Unit': 'Duke Hyou et les membres alliés de l’unité Hi Shin',
  'Ally "Queen Biki" and ally [Ai]': 'Queen Biki et les alliés Ai',
  'Ally "Ei Sei" and ally "Rouai"': 'Ei Sei et Rouai alliés',
  'Ally "Sho" and Six Great Generals': 'Sho et les alliés des Six Grands Généraux',
  'Ally "Ouki" and Ouki Army': 'Ouki et les alliés de l’armée d’Ouki',
  'Self and ally Six Great Generals of Qin': 'Soi-même et les alliés des Six Grands Généraux de Qin',
  'Surviving ally "Ouki" and Ouki Army other than self': 'Ouki et les autres alliés survivants de l’armée d’Ouki',
  'Ally Gyokuhou Unit / Ousen Army': 'Alliés de l’unité Gyokuhou / de l’armée d’Ousen',
  'Ally Hi Shin Unit / Gyokuhou Unit / Gakuka Unit': 'Alliés de l’unité Hi Shin / de l’unité Gyokuhou / de l’unité Gakuka',
  'Ally Hi Shin Unit / Ally Gyokuhou Unit / Ally Gakuka Unit': 'Alliés de l’unité Hi Shin / de l’unité Gyokuhou / de l’unité Gakuka',
  'Ally Hi Shin Unit Shield [General]': 'Généraux boucliers alliés de l’unité Hi Shin',
  'Ally [Infantry] and [Cavalry]': 'Fantassins et cavaliers alliés',
  'Ally [Infantry] and [Shield]': 'Fantassins et boucliers alliés',
  'Ally [Infantry] and [Archer]': 'Fantassins et archers alliés',
  'Enemy [Infantry] and [Cavalry]': 'Fantassins et cavaliers ennemis',
  'Ally [Qin], [Zhao], [Wei], [Chu], [Han], and [Yan]': 'Alliés Qin, Zhao, Wei, Chu, Han et Yan',
  'Other ally [Zhao] / [Wei] / [Chu] / [Han] / [Yan]': 'Autres alliés Zhao / Wei / Chu / Han / Yan',
  'Ally [Zhao] / [Wei] / Other [Chu] / [Han] / [Yan]': 'Alliés Zhao / Wei / autres alliés Chu / Han / Yan',
  'Enemy [Zhao] / [Wei] / [Chu] / [Han] / [Yan]': 'Ennemis Zhao / Wei / Chu / Han / Yan',
  'Ally [Zhao] / [Wei] / [Han] / [Yan]': 'Alliés Zhao / Wei / Han / Yan',
  'Ally [Qin] / [Zhao] / [Wei] / [Chu] / [Han] / [Yan]': 'Alliés Qin / Zhao / Wei / Chu / Han / Yan',
  '[Zhao], [Wei], [Chu], [Qi] enemy with highest ATK': 'Ennemi Zhao, Wei, Chu ou Qi avec le plus d’attaque',
  'Self, Ally Soujin, Ally Soutan': 'Soi-même ainsi que les alliés Soujin et Soutan',
  'Surviving ally Ousen Army': 'Alliés survivants de l’armée d’Ousen',
  'Self, Ally [Cavalry]': 'Soi-même et les cavaliers alliés',
  'Ally "Renpa" alive in same formation': 'Allié Renpa en vie dans la même formation',
  'Ally Renpa Army (other than self) alive': 'Autres alliés de l’armée de Renpa en vie',
  'When ally Batei and Ryuuto are both alive': 'Quand les alliés Batei et Ryuuto sont tous les deux en vie',
  'When ally Batei and Ryuuto are alive': 'Quand les alliés Batei et Ryuuto sont en vie',
  'When ally Batei or Ryuuto is alive': 'Quand au moins un des deux alliés, Batei ou Ryuuto, est en vie',
  'When ally Hi Shin Unit member is alive': 'Quand un membre allié de l’unité Hi Shin est en vie',
  'Other ally Hi Shin Unit member alive': 'Un autre membre allié de l’unité Hi Shin est en vie',
  'Other ally Kanki Army member alive': 'Un autre membre allié de l’armée de Kanki est en vie',
  'When ally Soujin and Soutan are both alive': 'Quand les alliés Soujin et Soutan sont tous les deux en vie',
  'When enemy [General] have Illusion status': 'Quand un général ennemi est sous Illusion',
  'Per enemy [General] defeated while skill is active': 'Par général ennemi vaincu pendant que la compétence est active',
  'Per attack by other ally [General]': 'Par attaque d’un autre général allié',
  'Per ally [General] attack count': 'Par attaque d’un général allié',
  'When repairing CW [Siege Weapon]': 'Lors de la réparation d’un engin de siège de Conquête',
  'Ally [Shield] "Confusion" Resistance, "Burn" Resistance 50%': '+50% de résistance à la confusion et aux brûlures pour les boucliers alliés',
  'Enemy [General] earliest in formation order': 'Général ennemi placé en premier dans la formation',
  'Enemy [Shield] earliest in formation order': 'Bouclier ennemi placé en premier dans la formation',
  '1 enemy [General] earliest in formation order': '1 général ennemi placé en premier dans la formation',
  'When Garrisoning, enemy [Cavalry] [General] last in formation': 'En garnison, cavalier ennemi placé en dernier dans la formation',
  'When Garrisoning, enemy [Cavalry] [General] first in formation': 'En garnison, cavalier ennemi placé en premier dans la formation',
  'Other ally [Qin] [General]\' HP < 90% and surviving': 'Autre général allié Qin en vie avec moins de 90% de PV',
  'Other ally [Zhao] [General]\' HP < 90% and surviving': 'Autre général allié Zhao en vie avec moins de 90% de PV',
}

/**
 * Parenthetical qualifiers that appear appended to conditions.
 * All three English spellings mean the same thing in the source data.
 */
export const QUALIFIERS = {
  'active even when not deployed': 'effet actif même sans déploiement',
  'effective even when not deployed': 'effet actif même sans déploiement',
  'effective even if not deployed': 'effet actif même sans déploiement',
  'excl. Provoke': 'sauf Provocation',
  'other than self': 'autre que soi',
  'scales': 'progressif',
  'additional': 'supplémentaire',
}

/** Superlative frames: "avec le plus de X" / "avec le moins de X". */
export const SUPERLATIVE = {
  highest: 'le plus',
  lowest: 'le moins',
  higher: 'le plus',
  lower: 'le moins',
}

/**
 * Four legacy ally references in the effect corpus spelled a roster general a
 * second way. The RanHQ-authored rows are corrected at source; these aliases
 * remain for older imported text and were resolved from the Japanese source,
 * not guessed — the skill's own 「{-N:characterId}」 token identifies the
 * general (Juutekkō -> 戎翟公 -> Wategi, Seikyo -> 成蟜 -> Seikyou,
 * Reihō -> 霊凰 -> Reiou, Gaimo -> 凱孟 -> Gaimou).
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
