export function secondaryName(primary, japanese) {
  const jp = japanese == null ? '' : String(japanese)
  if (!jp) return null
  return String(primary == null ? '' : primary).trim() === jp.trim() ? null : jp
}
