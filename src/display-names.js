function comparableName(value) {
  return String(value == null ? '' : value)
    // NFKC makes full-width punctuation and compatibility forms compare like
    // their ordinary display equivalents without changing the rendered text.
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[“”„‟]/g, '"')
    .replace(/[‘’‚‛]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s*([.,!?;:()[\]{}])\s*/g, '$1')
    // A ☆6/★6 suffix on one side only (skill names) is not new information.
    .replace(/[☆★]\d+$/, '')
}

export function secondaryName(primary, japanese) {
  const jp = japanese == null ? '' : String(japanese)
  if (!jp) return null
  return comparableName(primary) === comparableName(jp) ? null : jp
}
