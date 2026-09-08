import metadata from './generated/archive-overview.js'
import { useReleaseStage } from './release-snapshot.js'

export const archiveReleaseTimes = metadata.cardReleases.map(([time]) => time)
export function archiveOverviewAt(time) {
  return {
    characterCount: metadata.characterCount,
    cardCount: metadata.cardReleases.reduce((total, [release, count]) => total + (release <= time ? count : 0), 0),
  }
}
export function useArchiveOverview() {
  return archiveOverviewAt(useReleaseStage(archiveReleaseTimes))
}
