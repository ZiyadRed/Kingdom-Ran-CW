import { useMemo, useState } from 'react'

export const CASTLE_POINT_VALUES = {
  large: 2700,
  medium: 1600,
  small: 1000,
}

const MODES = [
  { id: 'normal', label: '1.0' },
  { id: 'selection', label: '2.0' },
]

const CASTLE_TYPES = [
  { id: 'large', label: 'Large', short: 'L', icon: '/icons/castle-points/castle-large.png' },
  { id: 'medium', label: 'Mid', short: 'M', icon: '/icons/castle-points/castle-medium.png' },
  { id: 'small', label: 'Small', short: 'S', icon: '/icons/castle-points/castle-small.png' },
]

function makeAlliance(index, isMine = false){
  return {
    id: isMine ? 'mine' : `alliance-${Date.now()}-${index}`,
    name: isMine ? 'My Alliance' : `Alliance ${index + 1}`,
    large: 0,
    medium: 0,
    small: 0,
    carried: 0,
    isMine,
  }
}

function defaultBoard(){
  return [makeAlliance(0, true)]
}

function clampNumber(value){
  const parsed = Number.parseInt(value, 10)
  if(!Number.isFinite(parsed) || parsed < 0) return 0
  return parsed
}

export function calculateTodayPoints(alliance, values = CASTLE_POINT_VALUES){
  return CASTLE_TYPES.reduce((sum, type) => sum + (clampNumber(alliance[type.id]) * values[type.id]), 0)
}

export function rankCastlePointBoard(board, values = CASTLE_POINT_VALUES){
  return board
    .map((alliance, index) => {
      const today = calculateTodayPoints(alliance, values)
      const carried = clampNumber(alliance.carried)
      return {
        ...alliance,
        index,
        displayName: String(alliance.name || '').trim() || `Alliance ${index + 1}`,
        today,
        carried,
        projected: carried + today,
      }
    })
    .sort((a, b) => {
      if(b.projected !== a.projected) return b.projected - a.projected
      if(b.today !== a.today) return b.today - a.today
      return a.index - b.index
    })
    .map((alliance, index) => ({ ...alliance, rank: index + 1 }))
}

function formatNumber(value){
  return clampNumber(value).toLocaleString()
}

function plural(value, word){
  return `${value} ${word}${value === 1 ? '' : 's'}`
}

function castleEquivalent(points){
  if(points <= 0) return '0 points'
  if(points >= CASTLE_POINT_VALUES.large) return plural(Math.ceil(points / CASTLE_POINT_VALUES.large), 'large castle')
  if(points >= CASTLE_POINT_VALUES.medium) return plural(Math.ceil(points / CASTLE_POINT_VALUES.medium), 'medium castle')
  return plural(Math.ceil(points / CASTLE_POINT_VALUES.small), 'small castle')
}

function CastleStepper({ alliance, type, onChange }){
  const value = clampNumber(alliance[type.id])
  return (
    <div className="cp-stepper" aria-label={`${type.label} castles for ${alliance.name}`}>
      <button type="button" aria-label={`Remove ${type.label} castle`} onClick={() => onChange(type.id, -1)} disabled={value === 0}>-</button>
      <input
        type="number"
        min="0"
        inputMode="numeric"
        aria-label={`${type.label} castle count`}
        value={value}
        onChange={event => onChange(type.id, event.target.value, true)}
      />
      <button type="button" aria-label={`Add ${type.label} castle`} onClick={() => onChange(type.id, 1)}>+</button>
    </div>
  )
}

export default function CastlePointsPage(){
  const [mode, setMode] = useState('normal')
  const [boards, setBoards] = useState(() => ({
    normal: defaultBoard(),
    selection: defaultBoard(),
  }))

  const board = boards[mode]
  const ranked = useMemo(() => rankCastlePointBoard(board), [board])
  const me = ranked.find(alliance => alliance.isMine) || ranked[0]
  const leader = ranked[0]
  const gapToFirst = leader && me ? Math.max(0, leader.projected - me.projected) : 0
  const totalToday = ranked.reduce((sum, alliance) => sum + alliance.today, 0)
  const totalCastles = board.reduce((sum, alliance) => (
    sum + clampNumber(alliance.large) + clampNumber(alliance.medium) + clampNumber(alliance.small)
  ), 0)

  const updateBoard = updater => {
    setBoards(prev => ({
      ...prev,
      [mode]: updater(prev[mode]),
    }))
  }

  const updateAlliance = (id, patcher) => {
    updateBoard(current => current.map(alliance => (
      alliance.id === id ? { ...alliance, ...patcher(alliance) } : alliance
    )))
  }

  const changeCastle = (id, type, value, absolute = false) => {
    updateAlliance(id, alliance => {
      const next = absolute ? clampNumber(value) : Math.max(0, clampNumber(alliance[type]) + value)
      return { [type]: next }
    })
  }

  const addAlliance = () => {
    updateBoard(current => current.length >= 7 ? current : [...current, makeAlliance(current.length)])
  }

  const removeAlliance = id => {
    updateBoard(current => current.filter(alliance => alliance.isMine || alliance.id !== id))
  }

  const resetBoard = () => {
    updateBoard(() => defaultBoard())
  }

  return (
    <main className="castle-points-page">
      <section className="cp-head">
        <div>
          <p>Castle War Tool</p>
          <h1>Castle Points</h1>
        </div>
        <div className="cp-mode-tabs" role="tablist" aria-label="Castle War mode">
          {MODES.map(item => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={mode === item.id}
              className={mode === item.id ? 'is-active' : ''}
              onClick={() => setMode(item.id)}
              title={item.id === 'normal' ? 'Version 1.0' : 'Version 2.0'}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="cp-score-strip" aria-label="Point values and current summary">
        {CASTLE_TYPES.map(type => (
          <div key={type.id} className={`cp-score-card cp-score-${type.id}`}>
            <img src={type.icon} alt="" aria-hidden="true" />
            <div>
              <b>{formatNumber(CASTLE_POINT_VALUES[type.id])}</b>
              <span>{type.label} castle</span>
            </div>
          </div>
        ))}
        <div className="cp-score-card cp-score-mine">
          <b>{me ? `#${me.rank}` : '-'}</b>
          <span>{me ? `${formatNumber(me.projected)} projected` : 'No board'}</span>
        </div>
      </section>

      <div className="cp-layout">
        <section className="cp-panel cp-board-panel">
          <div className="cp-panel-head">
            <div>
              <h2>Alliance Board</h2>
              <span>{plural(board.length, 'alliance')} / {plural(totalCastles, 'castle')}</span>
            </div>
            <button type="button" className="cp-soft-btn" onClick={resetBoard}>Reset</button>
          </div>

          <div className="cp-table-shell">
            <table className="cp-table">
              <thead>
                <tr>
                  <th>Alliance</th>
                  {CASTLE_TYPES.map(type => (
                    <th key={type.id}>
                      <span className="cp-castle-head">
                        <img src={type.icon} alt="" aria-hidden="true" />
                        <span>{type.short}</span>
                      </span>
                    </th>
                  ))}
                  <th>Today</th>
                  <th>Current Total</th>
                  <th>Projected</th>
                </tr>
              </thead>
              <tbody>
                {board.map(alliance => {
                  const today = calculateTodayPoints(alliance)
                  const projected = today + clampNumber(alliance.carried)
                  return (
                    <tr key={alliance.id}>
                      <td>
                        <div className="cp-name-cell">
                          <input
                            value={alliance.name}
                            aria-label="Alliance name"
                            onChange={event => updateAlliance(alliance.id, () => ({ name: event.target.value }))}
                          />
                          {alliance.isMine ? <span>Mine</span> : (
                            <button type="button" onClick={() => removeAlliance(alliance.id)}>Remove</button>
                          )}
                        </div>
                      </td>
                      {CASTLE_TYPES.map(type => (
                        <td key={type.id}>
                          <CastleStepper
                            alliance={alliance}
                            type={type}
                            onChange={(field, value, absolute) => changeCastle(alliance.id, field, value, absolute)}
                          />
                        </td>
                      ))}
                      <td className="cp-num">{formatNumber(today)}</td>
                      <td>
                        <input
                          className="cp-total-input"
                          type="number"
                          min="0"
                          inputMode="numeric"
                          aria-label="Current cumulative points"
                          value={alliance.carried || ''}
                          placeholder="0"
                          onChange={event => updateAlliance(alliance.id, () => ({ carried: clampNumber(event.target.value) }))}
                        />
                      </td>
                      <td className="cp-num cp-projected">{formatNumber(projected)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <button type="button" className="cp-add-btn" onClick={addAlliance} disabled={board.length >= 7}>
            Add Alliance
          </button>
        </section>

        <aside className="cp-panel cp-rank-panel">
          <div className="cp-panel-head">
            <div>
              <h2>Projected Ranking</h2>
              <span>{formatNumber(totalToday)} points today</span>
            </div>
          </div>

          <div className="cp-rank-list">
            {ranked.map((alliance, index) => (
              <div key={alliance.id} className={`cp-rank-row${alliance.isMine ? ' is-mine' : ''}`}>
                {board.length === 7 && index === 5 && (
                  <div className="cp-drop-line"><span>Bottom two</span></div>
                )}
                <div className="cp-rank-main">
                  <span className="cp-rank-badge">{alliance.rank}</span>
                  <div className="cp-rank-name">
                    <b>{alliance.displayName}</b>
                    {alliance.isMine && <span>Mine</span>}
                  </div>
                  <div className="cp-rank-points">
                    <b>{formatNumber(alliance.projected)}</b>
                    <span>{alliance.today ? `+${formatNumber(alliance.today)}` : '+0'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={`cp-gap-box${gapToFirst === 0 ? ' is-leading' : ''}`}>
            <b>{gapToFirst === 0 ? 'Projected 1st' : `${formatNumber(gapToFirst)} pts behind 1st`}</b>
            <span>{gapToFirst === 0 ? 'Your alliance is leading this board.' : `Roughly ${castleEquivalent(gapToFirst)}.`}</span>
          </div>
        </aside>
      </div>
    </main>
  )
}
