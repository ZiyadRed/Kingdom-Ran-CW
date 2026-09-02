import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocale, formatNumber as formatLocaleNumber, pluralSuffix } from './i18n/index.js'

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

function formatNumber(value, locale){
  return formatLocaleNumber(clampNumber(value), locale)
}

/**
 * A counted label whose number is grouped by the locale formatter.
 *
 * The formatted value is a string, which would defeat i18next's own plural
 * selection, so the plural category is derived from the real number and the
 * key is chosen here. Arabic needs up to six categories; English resolves to
 * `_one`/`_other` and falls back to the base key.
 */
function countLabel(value, key, t, locale){
  const count = clampNumber(value)
  const formatted = formatNumber(count, locale)
  const base = `castlePoints.${key}`
  return t(`${base}${pluralSuffix(count, locale)}`, {
    count: formatted,
    defaultValue: t(base, { count: formatted }),
  })
}

/** As countLabel, for keys used directly rather than through a castle type. */
function pointsLabel(value, key, t, locale){
  const count = clampNumber(value)
  const formatted = formatNumber(count, locale)
  const base = `castlePoints.${key}`
  return t(`${base}${pluralSuffix(count, locale)}`, {
    count: formatted,
    defaultValue: t(base, { count: formatted }),
  })
}

/**
 * "1,234 projected" in English, but Arabic puts the label before the value:
 * "المتوقع 1,234". Lower-casing is an English-only convention.
 */
function projectedSummary(value, t, locale){
  const label = t('castlePoints.projected')
  const number = formatNumber(value, locale)
  // Arabic and Japanese both name the quantity before the value — 「予測 1,234」,
  // not 「1,234 予測」, which reads as a stray noun after the number.
  if(locale.direction === 'rtl' || locale.code === 'ja') return `${label} ${number}`
  return `${number} ${locale.code === 'en' ? label.toLowerCase() : label}`
}

function castleTypeLabel(typeId, t, language){
  const typeLabel = t(`castlePoints.${typeId}`, { defaultValue: typeId })
  const noun = t('castlePoints.castle')
  // Only English names the size and the noun separately ("Large" + "castle").
  // 大城 and قلعة كبيرة are already whole nouns, so appending gives 「大城 城」.
  if(language === 'ar' || (noun && typeLabel.includes(noun))) return typeLabel
  return `${typeLabel} ${noun}`
}

function castleEquivalent(points, t, locale){
  if(points <= 0) return t('castlePoints.zeroPoints')
  if(points >= CASTLE_POINT_VALUES.large) return countLabel(Math.ceil(points / CASTLE_POINT_VALUES.large), 'largeCastleCount', t, locale)
  if(points >= CASTLE_POINT_VALUES.medium) return countLabel(Math.ceil(points / CASTLE_POINT_VALUES.medium), 'mediumCastleCount', t, locale)
  return countLabel(Math.ceil(points / CASTLE_POINT_VALUES.small), 'smallCastleCount', t, locale)
}

function CastleStepper({ alliance, type, onChange }){
  const { t } = useTranslation('common')
  const locale = useLocale()
  const value = clampNumber(alliance[type.id])
  const typeLabel = castleTypeLabel(type.id, t, locale.code)
  const allianceLabel = alliance?.isMine && alliance.name === 'My Alliance'
    ? t('castlePoints.mine')
    : String(alliance?.name || '').replace(/^Alliance (\d+)$/, `${t('castlePoints.alliance')} $1`)
  return (
    <div className="cp-stepper" aria-label={`${typeLabel} · ${allianceLabel}`}>
      <button type="button" aria-label={`${t('castlePoints.remove')} ${typeLabel}`} onClick={() => onChange(type.id, -1)} disabled={value === 0}>-</button>
      <input
        type="number"
        min="0"
        inputMode="numeric"
        aria-label={`${t('count')}: ${typeLabel}`}
        value={value}
        onChange={event => onChange(type.id, event.target.value, true)}
      />
      <button type="button" aria-label={`${t('castlePoints.add', { defaultValue: 'Add' })} ${typeLabel}`} onClick={() => onChange(type.id, 1)}>+</button>
    </div>
  )
}

export default function CastlePointsPage(){
  const { t, i18n } = useTranslation('common')
  const locale = useLocale()
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
  const localizedAllianceName = alliance => {
    if (alliance?.isMine && (!alliance.name || alliance.name === 'My Alliance')) return t('castlePoints.mine')
    const match = String(alliance?.name || '').match(/^Alliance (\d+)$/)
    return match ? `${t('castlePoints.alliance')} ${match[1]}` : alliance?.displayName || alliance?.name
  }

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
          <p>{t('castlePoints.tool')}</p>
          <h1>{t('castlePoints.title')}</h1>
        </div>
        <div className="cp-mode-tabs" role="tablist" aria-label={t('castlePoints.mode')}>
          {MODES.map(item => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={mode === item.id}
              className={mode === item.id ? 'is-active' : ''}
              onClick={() => setMode(item.id)}
              title={item.id === 'normal' ? t('castlePoints.versionOne') : t('castlePoints.versionTwo')}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="cp-score-strip" aria-label={t('castlePoints.pointSummary')}>
        {CASTLE_TYPES.map(type => (
          <div key={type.id} className={`cp-score-card cp-score-${type.id}`}>
            <img src={type.icon} alt="" aria-hidden="true" />
            <div>
              <b>{formatNumber(CASTLE_POINT_VALUES[type.id], locale)}</b>
              <span>{castleTypeLabel(type.id, t, i18n.language)}</span>
            </div>
          </div>
        ))}
        <div className="cp-score-card cp-score-mine">
          <b>{me ? `#${formatNumber(me.rank, locale)}` : '-'}</b>
          <span>{me ? projectedSummary(me.projected, t, locale) : t('noBoard', { defaultValue: 'No board' })}</span>
        </div>
      </section>

      <div className="cp-layout">
        <section className="cp-panel cp-board-panel">
          <div className="cp-panel-head">
            <div>
              <h2>{t('castlePoints.board')}</h2>
              <span>{countLabel(board.length, 'allianceCount', t, locale)} / {countLabel(totalCastles, 'castleCount', t, locale)}</span>
            </div>
            <button type="button" className="cp-soft-btn" onClick={resetBoard}>{t('castlePoints.reset')}</button>
          </div>

          <div className="cp-table-shell">
            <table className="cp-table">
              <thead>
                <tr>
                  <th>{t('castlePoints.alliance')}</th>
                  {CASTLE_TYPES.map(type => (
                    <th key={type.id}>
                      <span className="cp-castle-head">
                        <img src={type.icon} alt="" aria-hidden="true" />
                        <span>{t(`castlePoints.${type.id}Short`, { defaultValue: type.short })}</span>
                      </span>
                    </th>
                  ))}
                  <th>{t('castlePoints.today')}</th>
                  <th>{t('castlePoints.currentTotal')}</th>
                  <th>{t('castlePoints.projected')}</th>
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
                            value={localizedAllianceName(alliance)}
                            aria-label={t('castlePoints.allianceName')}
                            onChange={event => updateAlliance(alliance.id, () => ({ name: event.target.value }))}
                          />
                          {alliance.isMine ? <span>{t('castlePoints.mine')}</span> : (
                            <button type="button" onClick={() => removeAlliance(alliance.id)}>{t('castlePoints.remove')}</button>
                          )}
                        </div>
                      </td>
                      {CASTLE_TYPES.map(type => (
                        <td key={type.id} className="cp-castle-cell" data-label={castleTypeLabel(type.id, t, i18n.language)}>
                          <span className="cp-mobile-cell-label">
                            <img src={type.icon} alt="" aria-hidden="true" />
                            {castleTypeLabel(type.id, t, i18n.language)}
                          </span>
                          <CastleStepper
                            alliance={alliance}
                            type={type}
                            onChange={(field, value, absolute) => changeCastle(alliance.id, field, value, absolute)}
                          />
                        </td>
                      ))}
                      <td className="cp-num" data-label={t('castlePoints.today')}>{formatNumber(today, locale)}</td>
                      <td data-label={t('castlePoints.currentTotal')}>
                        <input
                          className="cp-total-input"
                          type="number"
                          min="0"
                          inputMode="numeric"
                          aria-label={t('castlePoints.currentPoints')}
                          value={alliance.carried || ''}
                          placeholder="0"
                          onChange={event => updateAlliance(alliance.id, () => ({ carried: clampNumber(event.target.value) }))}
                        />
                      </td>
                      <td className="cp-num cp-projected" data-label={t('castlePoints.projected')}>{formatNumber(projected, locale)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <button type="button" className="cp-add-btn" onClick={addAlliance} disabled={board.length >= 7}>
            {t('castlePoints.addAlliance')}
          </button>
        </section>

        <aside className="cp-panel cp-rank-panel">
          <div className="cp-panel-head">
            <div>
              <h2>{t('castlePoints.ranking')}</h2>
            <span>{pointsLabel(totalToday, 'pointsToday', t, locale)}</span>
            </div>
          </div>

          <div className="cp-rank-list">
            {ranked.map((alliance, index) => (
              <div key={alliance.id} className={`cp-rank-row${alliance.isMine ? ' is-mine' : ''}`}>
                {board.length === 7 && index === 5 && (
                  <div className="cp-drop-line"><span>{t('castlePoints.bottomTwo')}</span></div>
                )}
                <div className="cp-rank-main">
                  <span className="cp-rank-badge">{formatNumber(alliance.rank, locale)}</span>
                  <div className="cp-rank-name">
                    <b>{localizedAllianceName(alliance)}</b>
                    {alliance.isMine && <span>{t('castlePoints.mine')}</span>}
                  </div>
                  <div className="cp-rank-points">
                    <b>{formatNumber(alliance.projected, locale)}</b>
                    <span>{`+${formatNumber(alliance.today || 0, locale)}`}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={`cp-gap-box${gapToFirst === 0 ? ' is-leading' : ''}`}>
            <b>{gapToFirst === 0 ? t('castlePoints.projectedFirst') : pointsLabel(gapToFirst, 'behindFirst', t, locale)}</b>
            <span>{gapToFirst === 0 ? t('castlePoints.leading') : t('castlePoints.roughly', { count: castleEquivalent(gapToFirst, t, locale) })}</span>
          </div>
        </aside>
      </div>
    </main>
  )
}
