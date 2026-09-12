// Regular unit-buff rows carry the roster's stable ID. English spellings are
// presentation/legacy data, never a way to select a different character.
export function resolveRegularBuffCharacter(entry, byId, roster) {
  if (typeof entry?.character_id !== 'string' || !Object.hasOwn(byId, entry.character_id)) return null
  const character = byId[entry.character_id]
  if (!entry.name_jp || character.name_jp !== entry.name_jp || character.rarity !== entry.type || character.country !== entry.faction) return null

  // An old display spelling may not occur in today's roster (e.g. Toumi).
  // If it *does* identify a roster candidate, the stable owner must be among
  // the candidates. A contradictory authored name fails closed.
  const nameCandidates = roster.filter(candidate => candidate.name_en?.toLowerCase() === entry.name?.toLowerCase())
  if (nameCandidates.length && !nameCandidates.some(candidate => candidate.id === character.id)) return null
  return character
}
