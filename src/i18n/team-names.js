/**
 * Display names for RanHQ's own team presets (`META_TEAMS` / `TIER_TEAMS`).
 *
 * These labels are RanHQ shorthand, not game strings, so there is nothing to
 * copy out of the source tables. They are still the most prominent text on
 * /tiers and in the Party Builder, and leaving them in English was audit
 * finding JA-007 — a Japanese reader saw "Gyokuhou" where the game itself
 * says 玉鳳隊.
 *
 * The English `name` stays the stable key: it is what `core.jsx` stores, what
 * the tests match on, and what the share URL carries. Only presentation is
 * localized, per the "resolve at the presentation layer" rule.
 *
 * Japanese uses the game's own names for every unit, army and state, verified
 * against `data/generated/ja/character_names.json`. Arabic follows the
 * project's standing policy: descriptive words translate, character names stay
 * canonical Latin.
 */

const TEAM_NAMES = {
  // ── Tier list ──
  'Gyokuhou':       { ja: '玉鳳隊',        ar: 'وحدة الغيوكوهو' },
  'YTW':            { ja: '楊端和軍',      ar: 'جيش يوتانوا' },
  'Archers':        { ja: '弓兵編成',      ar: 'تشكيلة السهامين' },
  'Zhao':           { ja: '趙国編成',      ar: 'تشكيلة تشاو' },
  'Wei':            { ja: '魏国編成',      ar: 'تشكيلة وي' },
  'Karin + Kanmei': { ja: '媧燐＋汗明',    ar: 'كارين وكانمي' },
  'Chu Shields':    { ja: '楚国盾兵',      ar: 'دروع تشو' },
  'Chu Cavalry':    { ja: '楚国騎兵',      ar: 'فرسان تشو' },
  'Hakuki + Ousen': { ja: '白起＋王翦',    ar: 'هاكوكي وأوسن' },
  'Hi Shin':        { ja: '飛信隊',        ar: 'وحدة الهاي شين' },
  'YTW + Triplets': { ja: '楊端和＋三つ子', ar: 'يوتانوا والتوائم الثلاثة' },
  '6GG':            { ja: '六大将軍',      ar: 'الجنرالات الستة العظام' },
  'Renpa v1':       { ja: '廉頗 v1',       ar: 'رينبا (نسخة 1)' },
  'Karin Army':     { ja: '媧燐軍',        ar: 'جيش كارين' },
  'Han':            { ja: '韓国編成',      ar: 'تشكيلة هان' },
  'Ai':             { ja: '毐国編成',      ar: 'تشكيلة آي' },
  'Archer Garrison':{ ja: '弓兵駐屯編成',  ar: 'حامية السهامين' },
  'Rigan':          { ja: '離眼編成',      ar: 'تشكيلة ريغان' },
  'Kanki':          { ja: '桓騎軍',        ar: 'جيش كانكي' },
  'Ousen Army':     { ja: '王翦軍',        ar: 'جيش أوسن' },
  'Yan':            { ja: '燕国編成',      ar: 'تشكيلة يان' },

  // ── Party-Builder-only extras ──
  'Ouhon':          { ja: '王賁編成',      ar: 'تشكيلة أوهون' },
  'Ousen v3':       { ja: '王翦 v3',       ar: 'أوسن (نسخة 3)' },
  'Karin':          { ja: '媧燐編成',      ar: 'تشكيلة كارين' },
  'Chu':            { ja: '楚国編成',      ar: 'تشكيلة تشو' },
  'Renpa v2':       { ja: '廉頗 v2',       ar: 'رينبا (نسخة 2)' },
  'Moubo':          { ja: '蒙武編成',      ar: 'تشكيلة موبو' },
  'Qin Shields':    { ja: '秦国盾兵',      ar: 'دروع تشين' },
  'Makou Army':     { ja: '麻礦軍',        ar: 'جيش ماكو' },
}

/**
 * Localized label for a team preset. Unknown names — a preset added later —
 * fall back to the English label rather than to a guess.
 *
 * Accepts either a locale code or the registry entry `useLocale()` returns,
 * because both are in circulation in the component tree and silently indexing
 * by an object here would just render English with no error.
 */
export function localizedTeamName(name, locale) {
  const entry = TEAM_NAMES[name]
  if (!entry) return name
  const code = typeof locale === 'string' ? locale : locale?.code
  return entry[code] || name
}

export { TEAM_NAMES }
