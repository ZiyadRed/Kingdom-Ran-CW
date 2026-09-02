/**
 * Arabic character names.
 *
 * Owner policy (2026-08-30): each locale shows names in its own script —
 * Romaji for English, Japanese for Japanese, Arabic for Arabic. This replaces
 * the earlier canonical-Romaji rule, and it is deliberately COMPLETE for the
 * currently shipped roster, because a partial transliteration system was the
 * failure mode the Romaji policy originally existed to prevent.
 *
 * Transliteration follows the Japanese reading, not the English spelling,
 * calibrated to the owner's examples: Karin = كارين، Kanmei = كانمي،
 * Kyoukai = كيوكاي. Doubled vowel letters are collapsed (روكومي, not روكوومي).
 * English titles are translated, names transliterated: Duke Hyou = الدوق هيو.
 *
 * Two pairs share an Arabic form by owner decision — Douken/Doukin both دوكين
 * and Suugen/Sougen both سوغين. Search matches every script, so both cards
 * surface for either query.
 */
export const LEGACY_CHARACTER_NAME_ALIASES = Object.freeze({
  Bikou: 'Bitou',
  Gii: 'Gikou',
  Hakukisei: 'Hakukisai',
  Hanroki: 'Hanruki',
  Hoki: 'Fuuki',
  Jiou: 'Koushou',
  Kesshi: 'Ketsushi',
  Koujyun: 'Koujun',
  Kuzen: 'Kozen',
  Kyoubou: 'Kyobou',
  Kyougai: 'Kyogai',
  Miyamoto: 'Kyuugen',
  Saizatsu: 'Saitaku',
  Toumi: 'Toubi',
})

const LEGACY_ALIAS_BY_LOWER = Object.fromEntries(
  Object.entries(LEGACY_CHARACTER_NAME_ALIASES).map(([legacy, canonical]) => [legacy.toLowerCase(), canonical]),
)
const LEGACY_NAMES_BY_CANONICAL = Object.entries(LEGACY_CHARACTER_NAME_ALIASES).reduce(
  (result, [legacy, canonical]) => ({ ...result, [canonical]: [...(result[canonical] || []), legacy] }),
  {},
)
const CORRECTED_NAME_TARGET_BY_LOWER = Object.fromEntries(
  Object.entries(LEGACY_CHARACTER_NAME_ALIASES).flatMap(([legacy, canonical]) => [
    [legacy.toLowerCase(), canonical],
    [canonical.toLowerCase(), canonical],
  ]),
)

export function canonicalCharacterName(name) {
  if (!name) return name
  const raw = String(name).trim()
  return LEGACY_CHARACTER_NAME_ALIASES[raw] || LEGACY_ALIAS_BY_LOWER[raw.toLowerCase()] || raw
}

export function legacyCharacterNames(name) {
  return LEGACY_NAMES_BY_CANONICAL[canonicalCharacterName(name)] || []
}

export const AR_CHARACTER_NAMES = {
  'Rouai': 'رواي',
  'Wategi': 'واتيغي',
  'Hanoki': 'هانوكي',
  'Hanruki': 'هانروكي',
  'Ordo': 'أوردو',
  'Futei': 'فوتي',
  'Kouyoku': 'كويوكو',
  'Jinou': 'جينو',
  'Goumasho': 'غوماشو',
  'Beiman': 'بيمان',
  'Kaen': 'كاين',
  'Kouretsu': 'كوريتسو',
  'Hakusui': 'هاكوسوي',
  'Shunshinkun': 'شونشينكون',
  'Bananji': 'بانانجي',
  'Karin': 'كارين',
  'Kanmei': 'كانمي',
  'Rinbukun': 'رينبوكون',
  'Renpa': 'رينبا',
  'Rinko': 'رينكو',
  'Hakurei': 'هاكوري',
  'Kaishibou': 'كايشيبو',
  'Gohoumei': 'غوهومي',
  'Gokei': 'غوكي',
  'Yuri': 'يوري',
  'Toubi': 'توبي',
  'Yugi': 'يوغي',
  'Entei': 'إينتي',
  'Bamyu': 'باميو',
  'Kakubi': 'كاكوبي',
  'Ketsushi': 'كيتسوشي',
  'Genpo': 'غينبو',
  'Amon': 'آمون',
  'Koushou': 'كوشو',
  'Duke Hyou': 'الدوق هيو',
  'Mougou': 'موغو',
  'Mouki': 'موكي',
  'Kozen': 'كوزين',
  'Rishi': 'ريشي',
  'Douken': 'دوكين',
  'Shishi': 'شيشي',
  'Gikou': 'غيكو',
  'Maron': 'مارون',
  'Shunmen': 'شونمين',
  'Rankai': 'رانكاي',
  'Kyomei': 'كيومي',
  'Suugen': 'سوغين',
  'Bihei': 'بيهي',
  'Hyou': 'هيو',
  'Ogiko': 'أوغيكو',
  'Muta': 'موتا',
  'Kyogai': 'كيوغاي',
  'Doukin': 'دوكين',
  'Ryofui': 'ريوفوي',
  'Heki': 'هيكي',
  'Queen Biki': 'الملكة بيكي',
  'KyouEn': 'كيوين',
  'Bitou': 'بيتو',
  'Kanou': 'كانو',
  'Kei': 'كي',
  'Shousa': 'شوسا',
  'Sosui': 'سوسوي',
  'Hairou': 'هايرو',
  'Karyoten': 'كاريوتين',
  'En': 'إين',
  'Takukei': 'تاكوكي',
  'Denyuu': 'دينيو',
  'Denei': 'ديني',
  'Banyou': 'بانيو',
  'Hakukisai': 'هاكوكيساي',
  'Seki': 'سيكي',
  'Ryuusen': 'ريوسين',
  'Bakukoshin': 'باكوكوشين',
  'Kyoushou': 'كيوشو',
  'Rokuomi': 'روكومي',
  'Ryuukoku': 'ريوكوكو',
  'Roen': 'روين',
  'Rinbou': 'رينبو',
  'Yotanwa': 'يوتانوا',
  'Kitari': 'كيتاري',
  'Danto': 'دانتو',
  'Katari': 'كاتاري',
  'Toji': 'توجي',
  'Fuji': 'فوجي',
  'Ramauji': 'راماوجي',
  'Pam': 'بام',
  'Taijifu': 'تايجيفو',
  'Bajio': 'باجيو',
  'Gotan': 'غوتان',
  'Shuki': 'شوكي',
  'Maki': 'ماكي',
  'Kyobou': 'كيوبو',
  'Goutoku': 'غوتوكو',
  'Rien': 'رين',
  'Rokin': 'روكين',
  'Chouin': 'تشوين',
  'Nakon': 'ناكون',
  'Bakan': 'باكان',
  'Budai': 'بوداي',
  'Hamui': 'هاموي',
  'Ouken': 'أوكين',
  'Makou': 'ماكو',
  'Akou': 'آكو',
  'Eiki': 'إيكي',
  'Denrimi': 'دينريمي',
  'Youka': 'يوكا',
  'Kyourei': 'كيوري',
  'Robin': 'روبين',
  'Kakuun': 'كاكون',
  'Bain': 'باين',
  'Shoutaku': 'شوتاكو',
  'Kyuukou': 'كيوكو',
  'Naki': 'ناكي',
  'Ringyoku': 'رينغيوكو',
  'Zenou': 'زينو',
  'Hokaku': 'هوكاكو',
  'Shin': 'شين',
  'Kyoukai': 'كيوكاي',
  'Soutan': 'سوتان',
  'Soujin': 'سوجين',
  'Sougen': 'سوغين',
  'Gakurai': 'غاكوراي',
  'Choutou': 'تشوتو',
  'Shibasaku': 'شيباساكو',
  'Hyoushiga': 'هيوشيغا',
  'Hakuki': 'هاكوكي',
  'Oukotsu': 'أوكوتسو',
  'Kaioku': 'كايوكو',
  'Koshou': 'كوشو',
  'Garo': 'غارو',
  'Rikusen': 'ريكوسين',
  'Kanjou': 'كانجو',
  'Seikyou': 'سيكيو',
  'Rui': 'روي',
  'You': 'يو',
  'Ryuyu': 'ريويو',
  'Chutetsu': 'تشوتيتسو',
  'Choushi': 'تشوشي',
  'Raiki': 'رايكي',
  'Koujun': 'كوجون',
  'Chouyou': 'تشويو',
  'Tonkaku': 'تونكاكو',
  'Tonkoku': 'تونكوكو',
  'Kanto': 'كانتو',
  'Heirai': 'هيراي',
  'Ouhon': 'أوهون',
  'Ousen': 'أوسن',
  'Kanki': 'كانكي',
  'Mouten': 'موتين',
  'Moubu': 'موبو',
  'Shouheikun': 'شوهيكون',
  'Shoubunkun': 'شوبونكون',
  'Sho': 'شو',
  'Ei Sei': 'إي سي',
  'Kyou': 'كيو',
  'Raido': 'رايدو',
  'Kou': 'كو',
  'Saitaku': 'سايتاكو',
  'Ouki': 'أوكي',
  'Tou': 'تو',
  'Shoukaku': 'شوكاكو',
  'Tairoji': 'تايروجي',
  'Ranbihaku': 'رانبيهاكو',
  'Shikika': 'شيكيكا',
  'Keibin': 'كيبين',
  'Gaimou': 'غايمو',
  'Junso': 'جونسو',
  'Reiou': 'ري او',
  'Yuuren': 'يورين',
  'Kourigen': 'كوريغين',
  'Shihaku': 'شيهاكو',
  'Hyouki': 'هيوكي',
  'Otaji': 'أوتاجي',
  'Yukii': 'يوكي',
  'Gakuki': 'غاكوكي',
  'Gekishin': 'غيكيشين',
  'Ka': 'كا',
  'Shunsuiju': 'شونسويجو',
  'Shunpeikun': 'شونبيكون',
  'Duke Sei': 'الدوق سي',
  'Kinmou': 'كينمو',
  'Gakuei': 'غاكوي',
  'Ryuuto': 'ريوتو',
  'Kishou': 'كيشو',
  'Kisui': 'كيسوي',
  'Batei': 'باتي',
  'Gika': 'غيكا',
  'Fuuki': 'فوكي',
  'Kakukai': 'كاكوكاي',
  'Keisha': 'كيشا',
  'Gakujou': 'غاكوجو',
  'Shinseijou': 'شينسيجو',
  'Kousonryu': 'كوسونريو',
  'Domon': 'دومون',
  'Kyuugen': 'كيوغين',
  'Saji': 'ساجي',
  'Jokan': 'جوكان',
  'Rihaku': 'ريهاكو',
  'Shoumou': 'شومو',
  'Shika': 'شيكا',
  'Kokuou': 'كوكو',
  'Riboku': 'ريبوكو',
  'Houken': 'هوكين',
  'Kaine': 'كايني',
  'Mangoku': 'مانغوكو',
  'Chousou': 'تشوسو',
  'Chouko': 'تشوكو',
  'Seikai': 'سيكاي',
}

/**
 * A character name in the active locale. Japanese and English already carry
 * their own form in the data, so only Arabic needs the lookup; an unmapped
 * name falls through unchanged rather than disappearing.
 */
export function localizedCharacterName(name, locale) {
  const code = typeof locale === 'string' ? locale : locale?.code
  const canonical = canonicalCharacterName(name)
  if (code !== 'ar' || !canonical) return canonical
  return AR_CHARACTER_NAMES[canonical] || canonical
}

/**
 * Normalize the common ways players type Japanese long vowels in Romaji.
 * RanHQ data uses forms such as Kyoukai/Ousen, while players also type
 * Kyokai/Kyōkai and Osen/Ōsen. Search treats those as the same name without
 * changing the canonical spelling that is displayed.
 */
export function normalizeCharacterSearchText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/ou|oo/g, 'o')
    .replace(/uu/g, 'u')
    .replace(/ei|ee/g, 'e')
    .replace(/aa/g, 'a')
    .replace(/ii/g, 'i')
    .replace(/[^a-z0-9]/g, '')
}

/** Match one general by Romaji, Arabic, or Japanese on every search surface. */
export function matchesCharacterName(character, query) {
  if (!query || !String(query).trim()) return true
  const rawQuery = String(query).trim()
  const lowerQuery = rawQuery.toLowerCase()
  // Exact corrected/legacy spellings should resolve to their one intended
  // general before fuzzy long-vowel matching. Otherwise Jiou also matched
  // Bajio and Koushou also matched the distinct Koshou.
  const correctedTarget = CORRECTED_NAME_TARGET_BY_LOWER[lowerQuery]
  if (correctedTarget) {
    return canonicalCharacterName(character?.name_en)?.toLowerCase() === correctedTarget.toLowerCase()
  }
  const normalizedQuery = normalizeCharacterSearchText(rawQuery)
  const candidates = [
    character?.name_en,
    character?.name_jp,
    AR_CHARACTER_NAMES[canonicalCharacterName(character?.name_en)],
    ...legacyCharacterNames(character?.name_en),
  ].filter(Boolean)

  return candidates.some((candidate) => {
    const text = String(candidate)
    if (text.toLowerCase().includes(lowerQuery)) return true
    const normalized = normalizeCharacterSearchText(text)
    return Boolean(normalizedQuery && normalized.includes(normalizedQuery))
  })
}

/** The completeness guard used by validation tests and future data audits. */
export function missingArabicCharacterNames(characters) {
  return [...new Set(
    (characters || [])
      .map((character) => canonicalCharacterName(character?.name_en))
      .filter((name) => name && !AR_CHARACTER_NAMES[name]),
  )]
}
