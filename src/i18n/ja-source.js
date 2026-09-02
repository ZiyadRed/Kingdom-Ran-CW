/**
 * Presentation layer for original Japanese game text.
 *
 * The committed raw artifacts under `data/source/ja/` stay byte-identical to
 * the game's STBL tables — placeholders and all — because they are the
 * provenance record. Resolution happens here, at display time.
 *
 * PLACEHOLDER GRAMMAR
 * -------------------
 * Skill descriptions reference another general as:
 *
 *     味方「{-1:261}」の残り体力が70%未満の場合、…
 *
 * The first field is a 1-based occurrence ordinal within that description
 * (verified: sequential in 105/105 descriptions that use it, so it carries no
 * type information). The second field is a `characterId`.
 *
 * The name is NOT `MsgUnitGeneralName.stbl[characterId]`. That table is indexed
 * by `mstUnitGenerals.id`. The two coincide for many older rows, which makes a
 * direct lookup look correct while silently returning a different general —
 * characterId 261 is 蒼仁, but `name[261]` is 傅抵 — and newer characters expose
 * it outright, since `name[258]` is empty where 蒼淡 belongs.
 *
 * The extractor resolves the indirection and emits
 * `data/generated/ja/entity_names.json`; this module only substitutes.
 *
 * Cross-validated against the project's own English effect text: resolving
 * through the row id agrees with the ally named in English 127 times against 13
 * disagreements (all kanji variants of one person, or English naming an army
 * rather than the ally), where direct indexing agrees once against 110.
 *
 * SAFETY
 * ------
 * A token whose id has no source name is LEFT IN PLACE, unchanged. It is never
 * guessed at and never silently deleted, so an unresolvable reference stays
 * visible instead of turning into a plausible-looking wrong name. The build
 * already fails when a canonical skill uses an id with no name, so this branch
 * should be unreachable in shipped data.
 */
import entityNamesDocument from '../../data/generated/ja/entity_names.json'

const ENTITY_NAMES = entityNamesDocument.names || {}

/** `{-1:261}` — ordinal, then characterId. */
const PLACEHOLDER = /\{-(\d+):(\d+)\}/g

/**
 * Replace general references in original Japanese text with their names.
 *
 * @param {string} text Verbatim source text.
 * @returns {string} The same text with resolvable references substituted.
 */
export function resolveJapaneseEntities(text) {
  if (typeof text !== 'string' || !text) return text
  if (!text.includes('{')) return text
  return text.replace(PLACEHOLDER, (token, _ordinal, characterId) => (
    ENTITY_NAMES[characterId] || token
  ))
}

/** Whether any unresolved placeholder token remains in a string. */
export function hasUnresolvedPlaceholder(text) {
  return /\{-\d+:\d+\}/.test(String(text || ''))
}

export { ENTITY_NAMES }
