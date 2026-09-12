import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ALL, CharIcon, characterInitialRarity, searchCharacters, useReleaseData } from './core.jsx'
import { useLocale } from './i18n/LocaleContext.jsx'
import { localizedCharacter, localizedText } from './i18n/data.js'
import { formatNumber as formatLocaleNumber } from './i18n/format.js'
import { useHydratedState } from './use-hydrated-state.js'

export const CW_STATS_STORAGE_KEY = 'ranhq-cw-stats-v1'
export const CW_STATS_VERSION = 2
export const CW_POWER_WEIGHTS = { hp: 0.2, atk: 0.64102, def: 1 }
export const CW_STATS_MAX_TEAMS = 5
export const CW_STATS_SLOTS = 4

const numberOrZero = (value) => {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export const emptyCwCharacter = () => ({
  hp: '',
  atkMin: '',
  atkMax: '',
  def: '',
  buffs: { hp: '', atk: '', def: '' },
})

export const emptyCwScenario = () => ({
  buffChanges: { hp: '', atk: '', def: '' },
  baseBuffs: { hp: '', atk: '', def: '' },
})

const normalizeCwCharacter = (raw = {}) => {
  const buffs = raw.buffs || raw.pct || {}
  return {
    hp: raw.hp ?? '',
    atkMin: raw.atkMin ?? '',
    atkMax: raw.atkMax ?? '',
    def: raw.def ?? '',
    buffs: {
      hp: buffs.hp ?? '',
      atk: buffs.atk ?? '',
      def: buffs.def ?? '',
    },
  }
}

const normalizeCwScenario = (raw = {}) => {
  const buffChanges = raw.buffChanges || raw.changes || {}
  const baseBuffs = raw.baseBuffs || raw.rawBuffs || raw.sceneCardBaseBuffs || {}
  return {
    buffChanges: {
      hp: buffChanges.hp ?? '',
      atk: buffChanges.atk ?? '',
      def: buffChanges.def ?? '',
    },
    baseBuffs: {
      hp: baseBuffs.hp ?? '',
      atk: baseBuffs.atk ?? '',
      def: baseBuffs.def ?? '',
    },
  }
}

export const cwStatsValuesForTeam = (state, teamId, characterId) => {
  const team = state?.teams?.find(candidate => candidate.id === teamId)
  return {
    ...normalizeCwCharacter(state?.characters?.[characterId]),
    ...normalizeCwScenario(team?.scenarios?.[characterId]),
  }
}

export const displayedCwStats = (stats = {}) => {
  return {
    hp: Math.round(numberOrZero(stats.hp)),
    atkMin: Math.round(numberOrZero(stats.atkMin)),
    atkMax: Math.round(numberOrZero(stats.atkMax)),
    def: Math.round(numberOrZero(stats.def)),
  }
}

const CW_BUFF_FIELDS = {
  hp: ['hp'],
  atk: ['atkMin', 'atkMax'],
  def: ['def'],
}

const percentFactor = (value) => {
  const factor = 1 + numberOrZero(value) / 100
  return factor === 0 ? 1 : factor
}

export const projectedCwStats = (stats = {}) => {
  const current = { ...normalizeCwCharacter(stats), ...normalizeCwScenario(stats) }
  const displayed = displayedCwStats(current)
  const projected = { ...displayed }

  Object.entries(CW_BUFF_FIELDS).forEach(([buffField, fields]) => {
    const currentBuff = numberOrZero(current.buffs[buffField])
    const change = numberOrZero(current.buffChanges[buffField])
    const baseBuff = numberOrZero(current.baseBuffs[buffField])
    const currentFactor = percentFactor(currentBuff)
    const projectedFactor = percentFactor(currentBuff + change)

    fields.forEach((field) => {
      const baseValue = displayed[field] / currentFactor
      projected[field] = Math.round((baseValue + baseBuff) * projectedFactor)
    })
  })

  return projected
}

// The source calculator uses the current displayed stats directly and applies
// one final rounding step to the weighted total.
export const calculateCwPower = (stats = {}) => {
  const displayed = displayedCwStats(stats)
  const meanAttack = (displayed.atkMin + displayed.atkMax) / 2
  return Math.round(
    displayed.hp * CW_POWER_WEIGHTS.hp +
    meanAttack * CW_POWER_WEIGHTS.atk +
    displayed.def * CW_POWER_WEIGHTS.def,
  )
}

const createCwStatsTeam = (id) => ({
  id,
  slots: Array(CW_STATS_SLOTS).fill(null),
  scenarios: {},
})

export const createDefaultCwStatsState = () => ({
  version: CW_STATS_VERSION,
  characters: {},
  teams: [createCwStatsTeam('team-1')],
  nextTeamId: 2,
})

export const normalizeCwStatsState = (raw = {}) => {
  if (!raw || typeof raw !== 'object') return createDefaultCwStatsState()
  if (raw.version !== undefined && raw.version !== 1 && raw.version !== CW_STATS_VERSION) {
    return createDefaultCwStatsState()
  }
  const characters = {}
  if (raw.characters && typeof raw.characters === 'object') {
    Object.entries(raw.characters).forEach(([id, values]) => {
      characters[id] = normalizeCwCharacter(values)
    })
  }

  const savedTeams = Array.isArray(raw.teams) && raw.teams.length > 0
    ? raw.teams.slice(0, CW_STATS_MAX_TEAMS)
    : [Array(CW_STATS_SLOTS).fill(null)]
  const usedIds = new Set()
  let generatedId = 1
  const nextGeneratedId = () => {
    while (usedIds.has(`team-${generatedId}`)) generatedId += 1
    const id = `team-${generatedId}`
    generatedId += 1
    return id
  }
  const teams = savedTeams.map((savedTeam) => {
    const storedId = !Array.isArray(savedTeam) && /^team-[1-9]\d*$/.test(savedTeam?.id) ? savedTeam.id : null
    const id = storedId && !usedIds.has(storedId) ? storedId : nextGeneratedId()
    usedIds.add(id)
    const savedSlots = Array.isArray(savedTeam) ? savedTeam : savedTeam?.slots
    const slots = Array.from(
      { length: CW_STATS_SLOTS },
      (_, index) => typeof savedSlots?.[index] === 'string' ? savedSlots[index] : null,
    )
    const storedScenarios = !Array.isArray(savedTeam) && savedTeam?.scenarios && typeof savedTeam.scenarios === 'object'
      ? savedTeam.scenarios
      : null
    const scenarios = {}
    new Set(slots.filter(Boolean)).forEach((characterId) => {
      scenarios[characterId] = normalizeCwScenario(storedScenarios?.[characterId] || raw.characters?.[characterId])
    })
    return { id, slots, scenarios }
  })
  const highestTeamId = teams.reduce((highest, team) => Math.max(highest, Number(team.id.slice(5))), 0)
  const requestedNextId = Number.isSafeInteger(raw.nextTeamId) && raw.nextTeamId > 0 ? raw.nextTeamId : 1

  return {
    version: CW_STATS_VERSION,
    characters,
    teams,
    nextTeamId: Math.max(requestedNextId, highestTeamId + 1),
  }
}

export const updateCwStatsCharacter = (state, characterId, field, value) => {
  const current = state.characters[characterId] || emptyCwCharacter()
  return {
    ...state,
    characters: { ...state.characters, [characterId]: { ...current, [field]: value } },
  }
}

export const updateCwStatsActiveBuff = (state, characterId, buffField, value) => {
  const current = state.characters[characterId] || emptyCwCharacter()
  return {
    ...state,
    characters: {
      ...state.characters,
      [characterId]: { ...current, buffs: { ...current.buffs, [buffField]: value } },
    },
  }
}

export const updateCwStatsScenario = (state, teamId, characterId, scenarioField, buffField, value) => ({
  ...state,
  teams: state.teams.map((team) => {
    if (team.id !== teamId) return team
    const current = team.scenarios[characterId] || emptyCwScenario()
    return {
      ...team,
      scenarios: {
        ...team.scenarios,
        [characterId]: {
          ...current,
          [scenarioField]: { ...current[scenarioField], [buffField]: value },
        },
      },
    }
  }),
})

export const assignCwStatsCharacter = (state, teamId, characterId, requestedSlot = null, expectedCharacterId = null) => {
  const team = state.teams.find(candidate => candidate.id === teamId)
  if (!team) return state
  const slotIndex = requestedSlot === null ? team.slots.findIndex(id => !id) : requestedSlot
  if (slotIndex < 0 || slotIndex >= CW_STATS_SLOTS) return state
  if (requestedSlot !== null && team.slots[slotIndex] !== expectedCharacterId) return state
  if (team.slots.some((id, index) => id === characterId && index !== slotIndex)) return state
  return {
    ...state,
    characters: state.characters[characterId]
      ? state.characters
      : { ...state.characters, [characterId]: emptyCwCharacter() },
    teams: state.teams.map(candidate => candidate.id === teamId ? {
      ...candidate,
      slots: candidate.slots.map((id, index) => index === slotIndex ? characterId : id),
      scenarios: candidate.scenarios[characterId]
        ? candidate.scenarios
        : { ...candidate.scenarios, [characterId]: emptyCwScenario() },
    } : candidate),
  }
}

export const removeCwStatsCharacter = (state, teamId, slotIndex) => ({
  ...state,
  teams: state.teams.map((team) => {
    if (team.id !== teamId) return team
    const characterId = team.slots[slotIndex]
    if (!characterId) return team
    const { [characterId]: removedScenario, ...scenarios } = team.scenarios
    void removedScenario
    return {
      ...team,
      slots: team.slots.map((id, index) => index === slotIndex ? null : id),
      scenarios,
    }
  }),
})

export const addCwStatsTeam = (state) => state.teams.length >= CW_STATS_MAX_TEAMS ? state : {
  ...state,
  teams: [...state.teams, createCwStatsTeam(`team-${state.nextTeamId}`)],
  nextTeamId: state.nextTeamId + 1,
}

export const writeStoredCwStats = (state, storage) => {
  try {
    const target = storage === undefined ? (typeof window === 'undefined' ? null : window.localStorage) : storage
    if (!target) return false
    const serialized = JSON.stringify(normalizeCwStatsState(state))
    if (target.getItem(CW_STATS_STORAGE_KEY) !== serialized) target.setItem(CW_STATS_STORAGE_KEY, serialized)
    return true
  } catch {
    return false
  }
}

const readStoredCwStats = () => {
  if (typeof window === 'undefined') return createDefaultCwStatsState()
  try {
    const raw = JSON.parse(window.localStorage.getItem(CW_STATS_STORAGE_KEY) || 'null')
    return raw ? normalizeCwStatsState(raw) : createDefaultCwStatsState()
  } catch {
    return createDefaultCwStatsState()
  }
}

const formatNumber = (value, locale) => formatLocaleNumber(Math.round(numberOrZero(value)), locale)
const formatPower = (value, locale) => formatNumber(value, locale)
// Same verified initial rarity as Team Cost, joined by stable character ID.
export const cwStatsCharacterRarity = (character = {}) => (
  character.id ? characterInitialRarity(character) : character.rarity || '—'
)

const characterById = Object.fromEntries(ALL.map((character) => [
  character.id,
  { ...character, rarity: cwStatsCharacterRarity(character) },
]))

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  )
}

function StatInput({ label, value, onChange, buff = false, base = false, percentage = false }) {
  return (
    <label className={`cwstats-input${buff ? ' cwstats-input-buff' : ''}${base ? ' cwstats-input-base' : ''}${percentage && !buff && !base ? ' cwstats-input-percent' : ''}`}>
      <span>{label}</span>
      <input
        type="number"
        inputMode={buff || percentage ? 'decimal' : 'numeric'}
        min="0"
        step={buff || percentage ? '0.1' : '1'}
        value={value ?? ''}
        placeholder="0"
        aria-label={label}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function EmptySlot({ slotIndex, onSelect }) {
  const { t } = useTranslation('common')
  return (
    <button type="button" className="cwstats-empty-slot" onClick={onSelect} aria-label={`${t('stats.addCharacter')} ${slotIndex + 1}`}>
      <span className="cwstats-roster-index">{slotIndex + 1}</span>
      <span className="cwstats-empty-mark" aria-hidden="true">+</span>
      <strong>{t('stats.addCharacter')}</strong>
    </button>
  )
}

function CharacterSlot({ character, slotIndex, values, onChange, onChangeActiveBuff, onChangeBuff, onChangeSceneCardBuff, onChangeCharacter, onRemove }) {
  const { t } = useTranslation('common')
  const locale = useLocale()
  const displayCharacter = localizedCharacter(character, locale)
  const currentStats = displayedCwStats(values)
  const projected = projectedCwStats(values)
  const currentPower = calculateCwPower(currentStats)
  const power = calculateCwPower(projected)
  const powerChange = power - currentPower
  const unit = localizedText(character.unit_type || character.unit || 'General', locale)
  const rarity = character.rarity || '—'
  return (
    <article className="cwstats-slot-card">
      <header className="cwstats-slot-head">
        <span className="cwstats-slot-index">{String(slotIndex + 1).padStart(2, '0')}</span>
        <CharIcon c={character} size={52} round className="cwstats-slot-avatar" />
        <div className="cwstats-slot-identity">
          <strong>{displayCharacter.displayName}</strong>
          <span>{rarity} · {unit}</span>
        </div>
        <div className="cwstats-slot-power">
          <span>{t('stats.powerAfterBuffs')}</span>
          <strong>{formatPower(power, locale)}</strong>
          <small className={powerChange > 0 ? 'is-positive' : powerChange < 0 ? 'is-negative' : ''}>
            {powerChange === 0 ? t('noChange', { defaultValue: 'No change' }) : (
              <>
                <span className="cwstats-power-delta">{powerChange > 0 ? '+' : ''}{formatPower(powerChange, locale)}</span>
                <span className="cwstats-power-delta-context">{t('vsCurrent', { defaultValue: 'vs current' })}</span>
              </>
            )}
          </small>
        </div>
      </header>

      <div className="cwstats-stat-section">
        <div className="cwstats-section-label">
          <span>{t('stats.screenValues')}</span>
          <small>{t('stats.fromScreen')} · {t('stats.sharedAcrossTeams')}</small>
        </div>
        <div className="cwstats-stat-grid">
          <StatInput label={t('stats.hp')} value={values.hp} onChange={(value) => onChange('hp', value)} />
          <StatInput label={t('minimumAttack', { defaultValue: 'Minimum Attack' })} value={values.atkMin} onChange={(value) => onChange('atkMin', value)} />
          <StatInput label={t('maximumAttack', { defaultValue: 'Maximum Attack' })} value={values.atkMax} onChange={(value) => onChange('atkMax', value)} />
          <StatInput label={t('defense', { defaultValue: 'Defense' })} value={values.def} onChange={(value) => onChange('def', value)} />
        </div>
      </div>

      <div className="cwstats-buff-editor">
        <div className="cwstats-current-percent-row">
          <div className="cwstats-section-label">
            <span>{t('stats.activeBuffs')}</span>
            <small>{t('stats.sharedAcrossTeams')}</small>
          </div>
          <div className="cwstats-percent-grid">
            <StatInput label={`${t('stats.hp')}%`} percentage value={values.buffs.hp} onChange={(value) => onChangeActiveBuff('hp', value)} />
            <StatInput label={`${t('stats.attack')}%`} percentage value={values.buffs.atk} onChange={(value) => onChangeActiveBuff('atk', value)} />
            <StatInput label={`${t('stats.defense')}%`} percentage value={values.buffs.def} onChange={(value) => onChangeActiveBuff('def', value)} />
          </div>
        </div>
        <div className="cwstats-buff-section">
          <div className="cwstats-section-label cwstats-section-label-buff">
            <span>{t('stats.buffsToAdd')}</span>
            <small>{t('stats.currentTeamOnly')}</small>
          </div>
          <div className="cwstats-buff-grid">
            <StatInput label={`${t('stats.hp')}%`} buff percentage value={values.buffChanges.hp} onChange={(value) => onChangeBuff('hp', value)} />
            <StatInput label={`${t('stats.attack')}%`} buff percentage value={values.buffChanges.atk} onChange={(value) => onChangeBuff('atk', value)} />
            <StatInput label={`${t('stats.defense')}%`} buff percentage value={values.buffChanges.def} onChange={(value) => onChangeBuff('def', value)} />
          </div>
        </div>
        <details className="cwstats-scene-card-buffs">
          <summary>
            <span>{t('stats.sceneCardBuffs')}<small>{t('stats.currentTeamOnly')}</small></span>
          </summary>
          <div className="cwstats-base-buff-grid">
            <StatInput label={t('stats.hp')} base value={values.baseBuffs.hp} onChange={(value) => onChangeSceneCardBuff('hp', value)} />
            <StatInput label={t('stats.attack')} base value={values.baseBuffs.atk} onChange={(value) => onChangeSceneCardBuff('atk', value)} />
            <StatInput label={t('stats.defense')} base value={values.baseBuffs.def} onChange={(value) => onChangeSceneCardBuff('def', value)} />
          </div>
        </details>
      </div>

      <footer className="cwstats-slot-foot">
        <div className="cwstats-slot-actions">
          <button type="button" className="cwstats-action-button" onClick={onChangeCharacter}>{t('stats.changeCharacter')}</button>
          <button type="button" className="cwstats-action-button cwstats-action-danger" onClick={onRemove}>{t('remove')}</button>
        </div>
      </footer>
    </article>
  )
}

function CharacterSearch({ team, teamId, teamNumber, query, open, activeSlot, inputRef, onFocus, onChange, onSelect }) {
  const { ALL: roster } = useReleaseData()
  const characterList = useMemo(() => roster
    .map(character => ({ ...character, rarity: cwStatsCharacterRarity(character) }))
    .filter(character => character?.id && character?.name_en)
    .sort((a, b) => a.name_en.localeCompare(b.name_en)), [roster])
  const { t } = useTranslation('common')
  const locale = useLocale()
  const searchInput = useRef(null)
  const normalizedQuery = query.trim().toLowerCase()
  const results = normalizedQuery
    ? searchCharacters(characterList, query, locale).slice(0, 24)
    : []
  const emptySlots = team.filter(Boolean).length < CW_STATS_SLOTS
  const hasTargetSlot = activeSlot?.teamId === teamId
  const canSelect = emptySlots || hasTargetSlot

  return (
    <div className="cwstats-search-wrap">
      <label className="cwstats-search-label" htmlFor={`cwstats-search-${teamId}`}>{t('stats.chooseCharacter')} · {t('stats.team', { number: teamNumber })}</label>
      <div className="cwstats-search-input-wrap">
        <SearchIcon />
        <input
          id={`cwstats-search-${teamId}`}
          ref={element=>{searchInput.current=element;inputRef(element)}}
          className="cwstats-search-input"
          type="search"
          value={query}
          placeholder={`${t('search')} ${t('stats.addCharacter').toLowerCase()}…`}
          autoComplete="off"
          onFocus={onFocus}
          onChange={(event) => onChange(event.target.value)}
        />
        {query&&<button type="button" onClick={()=>{onChange('');searchInput.current?.focus()}}>{t('clear')}</button>}
      </div>

      {open && (
        <div className="cwstats-search-results" role="listbox" aria-label={`${t('search')} · ${t('stats.team', { number: teamNumber })}`}>
          {!normalizedQuery && (
            <p className="cwstats-search-hint">{t('stats.searchHint')}</p>
          )}
          {normalizedQuery && results.length === 0 && (
            <p className="cwstats-search-hint">{t('stats.noCharacterMatches', { query })}</p>
          )}
          {normalizedQuery && results.map((character) => {
            const selectedInTeam = team.includes(character.id)
            return (
              <button
                type="button"
                role="option"
                aria-selected={selectedInTeam}
                className="cwstats-search-result"
                key={character.id}
                disabled={selectedInTeam || !canSelect}
                onClick={() => onSelect(character)}
              >
                <CharIcon c={character} size={34} round className="cwstats-search-avatar" />
                <span>
                  <strong>{localizedCharacter(character, locale).displayName}</strong>
                  <small>{character.rarity || '—'} · {localizedText(character.unit_type || character.unit || 'General', locale)}</small>
                </span>
                {selectedInTeam ? <em>{t('added', { defaultValue: 'Added' })}</em> : !emptySlots ? <em>{t('full', { defaultValue: 'Full' })}</em> : <span className="cwstats-result-add">{t('stats.addCharacter')}</span>}
              </button>
            )
          })}
          {normalizedQuery && !canSelect && results.length > 0 && (
            <p className="cwstats-search-hint">{t('stats.fullHint')}</p>
          )}
        </div>
      )}
    </div>
  )
}

function TeamSection({ team, teamNumber, characters, query, open, activeSlot, editingSlot, inputRef, onSearchFocus, onQueryChange, onSelectCharacter, onSelectSlot, onEditSlot, onChangeStat, onChangeActiveBuff, onChangeBuff, onChangeSceneCardBuff, onRemoveCharacter, onRemoveTeam }) {
  const { t } = useTranslation('common')
  const locale = useLocale()
  const filled = team.slots.filter(Boolean).length
  const valuesFor = (characterId) => ({
    ...characters[characterId],
    ...(team.scenarios[characterId] || emptyCwScenario()),
  })
  const currentTotal = team.slots.reduce((sum, id) => sum + (id ? calculateCwPower(displayedCwStats(characters[id])) : 0), 0)
  const total = team.slots.reduce((sum, id) => sum + (id ? calculateCwPower(projectedCwStats(valuesFor(id))) : 0), 0)
  const powerChange = total - currentTotal
  const editingIndex = editingSlot?.teamId === team.id ? editingSlot.slotIndex : null
  const editingId = editingIndex === null ? null : team.slots[editingIndex]

  return (
    <section className="cwstats-team" data-team-id={team.id} aria-labelledby={`cwstats-team-title-${team.id}`}>
      <header className="cwstats-team-head">
        <div className="cwstats-team-title">
          <div>
            <h2 id={`cwstats-team-title-${team.id}`}>{t('stats.team', { number: teamNumber })}</h2>
            <span>{`${filled}/${CW_STATS_SLOTS}`} {t('generals')}</span>
          </div>
          {teamNumber > 1 && (
            <button type="button" className="cwstats-remove-team" onClick={onRemoveTeam}>{t('stats.removeTeam')}</button>
          )}
        </div>
        <div className="cwstats-team-total">
          <span>{t('stats.powerAfterBuffs')}</span>
          <strong>{formatPower(total, locale)}</strong>
          <small className={powerChange > 0 ? 'is-positive' : powerChange < 0 ? 'is-negative' : ''}>
            {powerChange === 0 ? t('noChange', { defaultValue: 'No change' }) : (
              <>
                <span className="cwstats-power-delta">{powerChange > 0 ? '+' : ''}{formatPower(powerChange, locale)}</span>
                <span className="cwstats-power-delta-context">{t('vsCurrent', { defaultValue: 'vs current' })}</span>
              </>
            )}
          </small>
        </div>
      </header>

      <div className="cwstats-roster" aria-label={t('stats.teamRoster', { team: t('stats.team', { number: teamNumber }) })}>
        {team.slots.map((characterId, slotIndex) => {
          if (!characterId) {
            return <EmptySlot key={slotIndex} slotIndex={slotIndex} onSelect={() => onSelectSlot(team.id, slotIndex, null)} />
          }
          const character = characterById[characterId] || { id: characterId, name_en: characterId, rarity: '—', unit_type: 'General' }
          const values = valuesFor(characterId)
          const unit = localizedText(character.unit_type || character.unit || 'General', locale)
          const power = calculateCwPower(projectedCwStats(values))
          return (
            <button
              type="button"
              key={`${characterId}-${slotIndex}`}
              className={`cwstats-roster-slot${editingIndex === slotIndex ? ' is-active' : ''}`}
              aria-pressed={editingIndex === slotIndex}
              onClick={() => onEditSlot(team.id, slotIndex)}
            >
              <span className="cwstats-roster-index">{slotIndex + 1}</span>
              <CharIcon c={character} size={42} round className="cwstats-roster-avatar" />
              <span className="cwstats-roster-copy">
                <strong>{localizedCharacter(character, locale).displayName}</strong>
                <small>{unit}</small>
              </span>
              <span className="cwstats-roster-power">{formatPower(power, locale)}</span>
            </button>
          )
        })}
      </div>

      {open && (
        <div className="cwstats-team-search">
          <CharacterSearch
            team={team.slots}
            teamId={team.id}
            teamNumber={teamNumber}
            query={query}
            open={open}
            activeSlot={activeSlot}
            inputRef={inputRef}
            onFocus={onSearchFocus}
            onChange={onQueryChange}
            onSelect={onSelectCharacter}
          />
        </div>
      )}

      {editingId && (
        <div className="cwstats-editor">
          <CharacterSlot
            key={`${editingId}-${editingIndex}`}
            character={characterById[editingId] || { id: editingId, name_en: editingId, rarity: '—', unit_type: 'General' }}
            slotIndex={editingIndex}
            values={valuesFor(editingId)}
            onChange={(field, value) => onChangeStat(editingId, field, value)}
            onChangeActiveBuff={(field, value) => onChangeActiveBuff(editingId, field, value)}
            onChangeBuff={(field, value) => onChangeBuff(team.id, editingId, field, value)}
            onChangeSceneCardBuff={(field, value) => onChangeSceneCardBuff(team.id, editingId, field, value)}
            onChangeCharacter={() => onSelectSlot(team.id, editingIndex, editingId)}
            onRemove={() => onRemoveCharacter(team.id, editingIndex)}
          />
        </div>
      )}

      {filled > 0 && !editingId && !open && (
        <p className="cwstats-editor-hint">{t('stats.editHint')}</p>
      )}
    </section>
  )
}

export function CWStatsPage() {
  const { t } = useTranslation('common')
  const [state, setState, changed] = useHydratedState(createDefaultCwStatsState, readStoredCwStats)
  const [queries, setQueries] = useState({})
  const [openTeam, setOpenTeam] = useState(null)
  const [activeSlot, setActiveSlot] = useState(null)
  const [editingSlot, setEditingSlot] = useState(null)
  const [saveStatus, setSaveStatus] = useState('idle')
  const searchRefs = useRef({})

  useEffect(() => {
    if (!changed) return
    setSaveStatus(writeStoredCwStats(state) ? 'saved' : 'failed')
  }, [state, changed])

  useEffect(() => {
    if (openTeam === null) return
    searchRefs.current[openTeam]?.focus()
  }, [openTeam])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpenTeam(null)
    }
    const onPointerDown = (event) => {
      if (!event.target.closest('.cwstats-team-search')) setOpenTeam(null)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [])

  const openSlot = (teamId, slotIndex, expectedCharacterId) => {
    setActiveSlot({ teamId, slotIndex, expectedCharacterId })
    setOpenTeam(teamId)
  }

  const editSlot = (teamId, slotIndex) => {
    setEditingSlot({ teamId, slotIndex })
    setOpenTeam(null)
    setActiveSlot(null)
  }

  const focusTeamSearch = (teamId) => {
    setActiveSlot((previous) => {
      if (previous?.teamId === teamId) return previous
      const slotIndex = state.teams.find(team => team.id === teamId)?.slots.findIndex((id) => !id) ?? -1
      return slotIndex >= 0 ? { teamId, slotIndex, expectedCharacterId: null } : null
    })
    setOpenTeam(teamId)
  }

  const updateCharacter = (characterId, field, value) => {
    setState((previous) => updateCwStatsCharacter(previous, characterId, field, value))
  }

  const updateActiveBuff = (characterId, buffField, value) => {
    setState((previous) => updateCwStatsActiveBuff(previous, characterId, buffField, value))
  }

  const updateBuffChange = (teamId, characterId, buffField, value) => {
    setState((previous) => updateCwStatsScenario(previous, teamId, characterId, 'buffChanges', buffField, value))
  }

  const updateSceneCardBaseBuff = (teamId, characterId, buffField, value) => {
    setState((previous) => updateCwStatsScenario(previous, teamId, characterId, 'baseBuffs', buffField, value))
  }

  const selectCharacter = (teamId, character) => {
    const target = activeSlot?.teamId === teamId ? activeSlot : null
    const requestedSlot = target?.slotIndex ?? state.teams.find(team => team.id === teamId)?.slots.findIndex(id => !id) ?? -1
    if (requestedSlot < 0) return
    setState((previous) => assignCwStatsCharacter(
      previous,
      teamId,
      character.id,
      requestedSlot,
      target?.expectedCharacterId ?? null,
    ))
    setQueries((previous) => ({ ...previous, [teamId]: '' }))
    setOpenTeam(null)
    setActiveSlot(null)
    setEditingSlot({ teamId, slotIndex: requestedSlot })
  }

  const removeCharacter = (teamId, slotIndex) => {
    setState((previous) => removeCwStatsCharacter(previous, teamId, slotIndex))
    setActiveSlot(null)
    if (editingSlot?.teamId === teamId && editingSlot.slotIndex === slotIndex) setEditingSlot(null)
  }

  const addTeam = () => {
    setState(addCwStatsTeam)
  }

  const removeTeam = (teamId) => {
    setState((previous) => ({
      ...previous,
      teams: previous.teams.filter(team => team.id !== teamId),
    }))
    setQueries((previous) => {
      const { [teamId]: removed, ...next } = previous
      void removed
      return next
    })
    setOpenTeam(null)
    setActiveSlot(null)
    setEditingSlot(null)
  }

  const clearSavedCalculator = () => {
    if (!window.confirm(t('stats.confirmClear'))) return
    setState(createDefaultCwStatsState())
    setQueries({})
    setOpenTeam(null)
    setActiveSlot(null)
    setEditingSlot(null)
  }

  return (
    <div className="cwstats-page">
      <header className="cwstats-page-head">
        <div>
          <h1>{t('stats.title')}</h1>
          <p>{t('stats.description')}</p>
        </div>
        <div className="cwstats-page-actions">
          <span className="cwstats-save-note" role="status" aria-live="polite" data-save-status={saveStatus}>{t(saveStatus === 'failed' ? 'stats.saveFailed' : saveStatus === 'saved' ? 'stats.saved' : 'stats.autoSave')}</span>
          <button type="button" className="cwstats-clear-button" onClick={clearSavedCalculator}>{t('stats.reset')}</button>
        </div>
      </header>

      <div className="cwstats-team-list">
        {state.teams.map((team, teamIndex) => (
          <TeamSection
            key={team.id}
            team={team}
            teamNumber={teamIndex + 1}
            characters={state.characters}
            query={queries[team.id] || ''}
            open={openTeam === team.id}
            activeSlot={activeSlot}
            editingSlot={editingSlot}
            inputRef={(element) => { searchRefs.current[team.id] = element }}
            onSearchFocus={() => focusTeamSearch(team.id)}
            onQueryChange={(value) => {
              setQueries((previous) => ({ ...previous, [team.id]: value }))
              setOpenTeam(team.id)
              setActiveSlot((previous) => previous?.teamId === team.id ? previous : null)
            }}
            onSelectCharacter={(character) => selectCharacter(team.id, character)}
            onSelectSlot={openSlot}
            onEditSlot={editSlot}
            onChangeStat={updateCharacter}
            onChangeActiveBuff={updateActiveBuff}
            onChangeBuff={updateBuffChange}
            onChangeSceneCardBuff={updateSceneCardBaseBuff}
            onRemoveCharacter={removeCharacter}
            onRemoveTeam={() => removeTeam(team.id)}
          />
        ))}
      </div>

      <button type="button" className="cwstats-add-team" onClick={addTeam} disabled={state.teams.length >= CW_STATS_MAX_TEAMS}>
        <span aria-hidden="true">+</span>
        {state.teams.length >= CW_STATS_MAX_TEAMS ? t('stats.maxTeams') : t('stats.addTeam')}
      </button>
    </div>
  )
}
