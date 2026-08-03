import { useEffect, useRef, useState } from 'react'
import { ALL, CharIcon } from './core.jsx'

export const CW_STATS_STORAGE_KEY = 'ranhq-cw-stats-v1'
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
  buffChanges: { hp: '', atk: '', def: '' },
})

const normalizeCwCharacter = (raw = {}) => {
  const buffs = raw.buffs || raw.pct || {}
  const buffChanges = raw.buffChanges || raw.changes || {}
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
    buffChanges: {
      hp: buffChanges.hp ?? '',
      atk: buffChanges.atk ?? '',
      def: buffChanges.def ?? '',
    },
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
  const current = normalizeCwCharacter(stats)
  const displayed = displayedCwStats(current)
  const projected = { ...displayed }

  Object.entries(CW_BUFF_FIELDS).forEach(([buffField, fields]) => {
    const currentBuff = numberOrZero(current.buffs[buffField])
    const change = numberOrZero(current.buffChanges[buffField])
    const currentFactor = percentFactor(currentBuff)
    const projectedFactor = percentFactor(currentBuff + change)

    fields.forEach((field) => {
      projected[field] = Math.round(displayed[field] / currentFactor * projectedFactor)
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

export const createDefaultCwStatsState = () => ({
  version: 1,
  characters: {},
  teams: [Array(CW_STATS_SLOTS).fill(null)],
})

export const normalizeCwStatsState = (raw = {}) => {
  const characters = {}
  if (raw.characters && typeof raw.characters === 'object') {
    Object.entries(raw.characters).forEach(([id, values]) => {
      characters[id] = normalizeCwCharacter(values)
    })
  }

  const savedTeams = Array.isArray(raw.teams) && raw.teams.length > 0
    ? raw.teams.slice(0, CW_STATS_MAX_TEAMS)
    : [Array(CW_STATS_SLOTS).fill(null)]
  const teams = savedTeams.map((team) => Array.from(
    { length: CW_STATS_SLOTS },
    (_, index) => typeof team?.[index] === 'string' ? team[index] : null,
  ))

  return { version: 1, characters, teams }
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

const formatNumber = (value) => Math.round(numberOrZero(value)).toLocaleString('en-US')
const formatPower = (value) => formatNumber(value)
const characterById = Object.fromEntries(ALL.map((character) => [character.id, character]))
const characterList = ALL
  .filter((character) => character?.id && character?.name_en)
  .sort((a, b) => a.name_en.localeCompare(b.name_en))

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  )
}

function StatInput({ label, value, onChange, buff = false, percentage = false }) {
  return (
    <label className={`cwstats-input${buff ? ' cwstats-input-buff' : ''}${percentage && !buff ? ' cwstats-input-percent' : ''}`}>
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
  return (
    <button type="button" className="cwstats-empty-slot" onClick={onSelect} aria-label={`Add character to slot ${slotIndex + 1}`}>
      <span className="cwstats-roster-index">{slotIndex + 1}</span>
      <span className="cwstats-empty-mark" aria-hidden="true">+</span>
      <strong>Add</strong>
    </button>
  )
}

function CharacterSlot({ character, slotIndex, values, onChange, onChangeBaseBuff, onChangeBuff, onChangeCharacter, onRemove }) {
  const currentStats = displayedCwStats(values)
  const projected = projectedCwStats(values)
  const currentPower = calculateCwPower(currentStats)
  const power = calculateCwPower(projected)
  const powerChange = power - currentPower
  const unit = character.unit_type || character.unit || 'General'
  const rarity = character.rarity || '—'
  return (
    <article className="cwstats-slot-card">
      <header className="cwstats-slot-head">
        <span className="cwstats-slot-index">{String(slotIndex + 1).padStart(2, '0')}</span>
        <CharIcon c={character} size={52} round className="cwstats-slot-avatar" />
        <div className="cwstats-slot-identity">
          <strong>{character.name_en}</strong>
          <span>{rarity} · {unit}</span>
        </div>
        <div className="cwstats-slot-power">
          <span>CW power after buffs</span>
          <strong>{formatPower(power)}</strong>
          <small className={powerChange > 0 ? 'is-positive' : powerChange < 0 ? 'is-negative' : ''}>
            {powerChange === 0 ? 'No change' : `${powerChange > 0 ? '+' : ''}${formatPower(powerChange)} vs current`}
          </small>
        </div>
      </header>

      <div className="cwstats-stat-section">
        <div className="cwstats-section-label">
          <span>CW screen values</span>
          <small>From the CW screen</small>
        </div>
        <div className="cwstats-stat-grid">
          <StatInput label="HP" value={values.hp} onChange={(value) => onChange('hp', value)} />
          <StatInput label="Minimum Attack" value={values.atkMin} onChange={(value) => onChange('atkMin', value)} />
          <StatInput label="Maximum Attack" value={values.atkMax} onChange={(value) => onChange('atkMax', value)} />
          <StatInput label="Defense" value={values.def} onChange={(value) => onChange('def', value)} />
        </div>
      </div>

      <div className="cwstats-buff-editor">
        <div className="cwstats-current-percent-row">
          <span className="cwstats-subsection-label">Already active buffs</span>
          <div className="cwstats-percent-grid">
            <StatInput label="HP%" percentage value={values.buffs.hp} onChange={(value) => onChangeBaseBuff('hp', value)} />
            <StatInput label="Attack%" percentage value={values.buffs.atk} onChange={(value) => onChangeBaseBuff('atk', value)} />
            <StatInput label="Defense%" percentage value={values.buffs.def} onChange={(value) => onChangeBaseBuff('def', value)} />
          </div>
        </div>
        <div className="cwstats-buff-section">
          <div className="cwstats-section-label cwstats-section-label-buff">
            <span>Buffs to add</span>
            <small>Enter 5 for 5%</small>
          </div>
          <div className="cwstats-buff-grid">
            <StatInput label="HP%" buff percentage value={values.buffChanges.hp} onChange={(value) => onChangeBuff('hp', value)} />
            <StatInput label="Attack%" buff percentage value={values.buffChanges.atk} onChange={(value) => onChangeBuff('atk', value)} />
            <StatInput label="Defense%" buff percentage value={values.buffChanges.def} onChange={(value) => onChangeBuff('def', value)} />
          </div>
        </div>
      </div>

      <footer className="cwstats-slot-foot">
        <div className="cwstats-slot-actions">
          <button type="button" className="cwstats-action-button" onClick={onChangeCharacter}>Change character</button>
          <button type="button" className="cwstats-action-button cwstats-action-danger" onClick={onRemove}>Remove</button>
        </div>
      </footer>
    </article>
  )
}

function CharacterSearch({ team, teamIndex, query, open, activeSlot, inputRef, onFocus, onChange, onSelect }) {
  const normalizedQuery = query.trim().toLowerCase()
  const results = normalizedQuery
    ? characterList
      .filter((character) => (
        character.name_en.toLowerCase().includes(normalizedQuery) ||
        (character.name_jp || '').toLowerCase().includes(normalizedQuery)
      ))
      .slice(0, 24)
    : []
  const emptySlots = team.filter(Boolean).length < CW_STATS_SLOTS
  const hasTargetSlot = activeSlot?.teamIndex === teamIndex
  const canSelect = emptySlots || hasTargetSlot

  return (
    <div className="cwstats-search-wrap">
      <label className="cwstats-search-label" htmlFor={`cwstats-search-${teamIndex}`}>Choose a character for Team {teamIndex + 1}</label>
      <div className="cwstats-search-input-wrap">
        <SearchIcon />
        <input
          id={`cwstats-search-${teamIndex}`}
          ref={inputRef}
          className="cwstats-search-input"
          type="search"
          value={query}
          placeholder="Search character to add…"
          autoComplete="off"
          onFocus={onFocus}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>

      {open && (
        <div className="cwstats-search-results" role="listbox" aria-label={`Character search for Team ${teamIndex + 1}`}>
          {!normalizedQuery && (
            <p className="cwstats-search-hint">Start typing to add a character to the next empty slot.</p>
          )}
          {normalizedQuery && results.length === 0 && (
            <p className="cwstats-search-hint">No characters match “{query}”.</p>
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
                  <strong>{character.name_en}</strong>
                  <small>{character.rarity || '—'} · {character.unit_type || character.unit || 'General'}</small>
                </span>
                {selectedInTeam ? <em>Added</em> : !emptySlots ? <em>Full</em> : <span className="cwstats-result-add">Add</span>}
              </button>
            )
          })}
          {normalizedQuery && !canSelect && results.length > 0 && (
            <p className="cwstats-search-hint">All four slots are filled. Use Change character on a card to replace someone.</p>
          )}
        </div>
      )}
    </div>
  )
}

function TeamSection({ team, teamIndex, characters, query, open, activeSlot, editingSlot, inputRef, onSearchFocus, onQueryChange, onSelectCharacter, onSelectSlot, onEditSlot, onChangeStat, onChangeBaseBuff, onChangeBuff, onRemoveCharacter, onRemoveTeam }) {
  const filled = team.filter(Boolean).length
  const total = team.reduce((sum, id) => sum + (id ? calculateCwPower(projectedCwStats(characters[id])) : 0), 0)
  const editingIndex = editingSlot?.teamIndex === teamIndex ? editingSlot.slotIndex : null
  const editingId = editingIndex === null ? null : team[editingIndex]

  return (
    <section className="cwstats-team" aria-labelledby={`cwstats-team-title-${teamIndex}`}>
      <header className="cwstats-team-head">
        <div className="cwstats-team-title">
          <div>
            <h2 id={`cwstats-team-title-${teamIndex}`}>Team {teamIndex + 1}</h2>
            <span>{filled} of {CW_STATS_SLOTS} characters</span>
          </div>
          {teamIndex > 0 && (
            <button type="button" className="cwstats-remove-team" onClick={onRemoveTeam}>Remove team</button>
          )}
        </div>
        <div className="cwstats-team-total">
          <span>Team power</span>
          <strong>{formatPower(total)}</strong>
        </div>
      </header>

      <div className="cwstats-roster" aria-label={`Team ${teamIndex + 1} roster`}>
        {team.map((characterId, slotIndex) => {
          if (!characterId) {
            return <EmptySlot key={slotIndex} slotIndex={slotIndex} onSelect={() => onSelectSlot(teamIndex, slotIndex)} />
          }
          const character = characterById[characterId] || { id: characterId, name_en: characterId, rarity: '—', unit_type: 'General' }
          const values = characters[characterId] || emptyCwCharacter()
          const unit = character.unit_type || character.unit || 'General'
          const power = calculateCwPower(projectedCwStats(values))
          return (
            <button
              type="button"
              key={`${characterId}-${slotIndex}`}
              className={`cwstats-roster-slot${editingIndex === slotIndex ? ' is-active' : ''}`}
              aria-pressed={editingIndex === slotIndex}
              onClick={() => onEditSlot(teamIndex, slotIndex)}
            >
              <span className="cwstats-roster-index">{slotIndex + 1}</span>
              <CharIcon c={character} size={42} round className="cwstats-roster-avatar" />
              <span className="cwstats-roster-copy">
                <strong>{character.name_en}</strong>
                <small>{unit}</small>
              </span>
              <span className="cwstats-roster-power">{formatPower(power)}</span>
            </button>
          )
        })}
      </div>

      {open && (
        <div className="cwstats-team-search">
          <CharacterSearch
            team={team}
            teamIndex={teamIndex}
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
            values={characters[editingId] || emptyCwCharacter()}
            onChange={(field, value) => onChangeStat(editingId, field, value)}
            onChangeBaseBuff={(field, value) => onChangeBaseBuff(editingId, field, value)}
            onChangeBuff={(field, value) => onChangeBuff(editingId, field, value)}
            onChangeCharacter={() => onSelectSlot(teamIndex, editingIndex)}
            onRemove={() => onRemoveCharacter(teamIndex, editingIndex)}
          />
        </div>
      )}

      {filled > 0 && !editingId && !open && (
        <p className="cwstats-editor-hint">Select a character above to edit their stats.</p>
      )}
    </section>
  )
}

export function CWStatsPage() {
  const [state, setState] = useState(readStoredCwStats)
  const [queries, setQueries] = useState({})
  const [openTeam, setOpenTeam] = useState(null)
  const [activeSlot, setActiveSlot] = useState(null)
  const [editingSlot, setEditingSlot] = useState(null)
  const searchRefs = useRef([])

  useEffect(() => {
    try {
      window.localStorage.setItem(CW_STATS_STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Local storage may be unavailable in private browsing; the calculator still works for the session.
    }
  }, [state])

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

  const openSlot = (teamIndex, slotIndex) => {
    setActiveSlot({ teamIndex, slotIndex })
    setOpenTeam(teamIndex)
  }

  const editSlot = (teamIndex, slotIndex) => {
    setEditingSlot({ teamIndex, slotIndex })
    setOpenTeam(null)
    setActiveSlot(null)
  }

  const focusTeamSearch = (teamIndex) => {
    setActiveSlot((previous) => {
      if (previous?.teamIndex === teamIndex) return previous
      const slotIndex = state.teams[teamIndex]?.findIndex((id) => !id) ?? -1
      return slotIndex >= 0 ? { teamIndex, slotIndex } : null
    })
    setOpenTeam(teamIndex)
  }

  const updateCharacter = (characterId, field, value) => {
    setState((previous) => {
      const current = previous.characters[characterId] || emptyCwCharacter()
      return {
        ...previous,
        characters: { ...previous.characters, [characterId]: { ...current, [field]: value } },
      }
    })
  }

  const updateBaseBuff = (characterId, buffField, value) => {
    setState((previous) => {
      const current = previous.characters[characterId] || emptyCwCharacter()
      return {
        ...previous,
        characters: {
          ...previous.characters,
          [characterId]: { ...current, buffs: { ...current.buffs, [buffField]: value } },
        },
      }
    })
  }

  const updateBuffChange = (characterId, buffField, value) => {
    setState((previous) => {
      const current = previous.characters[characterId] || emptyCwCharacter()
      return {
        ...previous,
        characters: {
          ...previous.characters,
          [characterId]: { ...current, buffChanges: { ...current.buffChanges, [buffField]: value } },
        },
      }
    })
  }

  const selectCharacter = (teamIndex, character) => {
    const team = state.teams[teamIndex] || Array(CW_STATS_SLOTS).fill(null)
    const requestedSlot = activeSlot?.teamIndex === teamIndex ? activeSlot.slotIndex : team.findIndex((id) => !id)
    if (requestedSlot < 0 || team.some((id, index) => id === character.id && index !== requestedSlot)) return

    setState((previous) => {
      const teams = previous.teams.map((existing, index) => (
        index === teamIndex
          ? existing.map((id, indexInTeam) => indexInTeam === requestedSlot ? character.id : id)
          : existing
      ))
      return {
        ...previous,
        characters: previous.characters[character.id]
          ? previous.characters
          : { ...previous.characters, [character.id]: emptyCwCharacter() },
        teams,
      }
    })
    setQueries((previous) => ({ ...previous, [teamIndex]: '' }))
    setOpenTeam(null)
    setActiveSlot(null)
    setEditingSlot({ teamIndex, slotIndex: requestedSlot })
  }

  const removeCharacter = (teamIndex, slotIndex) => {
    setState((previous) => ({
      ...previous,
      teams: previous.teams.map((team, index) => (
        index === teamIndex ? team.map((id, slot) => slot === slotIndex ? null : id) : team
      )),
    }))
    setActiveSlot(null)
    if (editingSlot?.teamIndex === teamIndex && editingSlot.slotIndex === slotIndex) setEditingSlot(null)
  }

  const addTeam = () => {
    if (state.teams.length >= CW_STATS_MAX_TEAMS) return
    setState((previous) => ({
      ...previous,
      teams: [...previous.teams, Array(CW_STATS_SLOTS).fill(null)],
    }))
  }

  const removeTeam = (teamIndex) => {
    setState((previous) => ({
      ...previous,
      teams: previous.teams.filter((_, index) => index !== teamIndex),
    }))
    setQueries((previous) => {
      const next = {}
      Object.entries(previous).forEach(([index, value]) => {
        const parsedIndex = Number(index)
        if (parsedIndex < teamIndex) next[parsedIndex] = value
        if (parsedIndex > teamIndex) next[parsedIndex - 1] = value
      })
      return next
    })
    setOpenTeam(null)
    setActiveSlot(null)
    setEditingSlot(null)
  }

  const clearSavedCalculator = () => {
    if (!window.confirm('Clear all saved calculator teams and character values on this device?')) return
    setState(createDefaultCwStatsState())
    setQueries({})
    setOpenTeam(null)
    setActiveSlot(null)
    setEditingSlot(null)
  }

  return (
    <main className="cwstats-page">
      <header className="cwstats-page-head">
        <div>
          <h1>Stats Calculator</h1>
          <p>Enter the values shown on the CW screen, including active buffs, then add new buffs to see the updated power.</p>
        </div>
        <div className="cwstats-page-actions">
          <span className="cwstats-save-note">Saved automatically</span>
          <button type="button" className="cwstats-clear-button" onClick={clearSavedCalculator}>Reset calculator</button>
        </div>
      </header>

      <div className="cwstats-team-list">
        {state.teams.map((team, teamIndex) => (
          <TeamSection
            key={`team-${teamIndex}`}
            team={team}
            teamIndex={teamIndex}
            characters={state.characters}
            query={queries[teamIndex] || ''}
            open={openTeam === teamIndex}
            activeSlot={activeSlot}
            editingSlot={editingSlot}
            inputRef={(element) => { searchRefs.current[teamIndex] = element }}
            onSearchFocus={() => focusTeamSearch(teamIndex)}
            onQueryChange={(value) => {
              setQueries((previous) => ({ ...previous, [teamIndex]: value }))
              setOpenTeam(teamIndex)
              setActiveSlot((previous) => previous?.teamIndex === teamIndex ? previous : null)
            }}
            onSelectCharacter={(character) => selectCharacter(teamIndex, character)}
            onSelectSlot={openSlot}
            onEditSlot={editSlot}
            onChangeStat={updateCharacter}
            onChangeBaseBuff={updateBaseBuff}
            onChangeBuff={updateBuffChange}
            onRemoveCharacter={removeCharacter}
            onRemoveTeam={() => removeTeam(teamIndex)}
          />
        ))}
      </div>

      <button type="button" className="cwstats-add-team" onClick={addTeam} disabled={state.teams.length >= CW_STATS_MAX_TEAMS}>
        <span aria-hidden="true">+</span>
        {state.teams.length >= CW_STATS_MAX_TEAMS ? 'Maximum of 5 teams reached' : 'Add another team'}
      </button>
    </main>
  )
}
