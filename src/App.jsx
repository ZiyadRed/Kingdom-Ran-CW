import { useState, useEffect, useRef } from 'react'
import mountainFolk  from '../data/characters/mountain_folk.json'
import qin           from '../data/characters/qin.json'
import qinBatch2     from '../data/characters/qin_batch2.json'
import qinMajor      from '../data/characters/qin_major.json'
import zhao          from '../data/characters/zhao.json'
import zhaoBatch2    from '../data/characters/zhao_batch2.json'
import zhaoMajor     from '../data/characters/zhao_major.json'
import otherStates   from '../data/characters/other_states.json'
import chu           from '../data/characters/chu.json'
import chuMajor      from '../data/characters/chu_major.json'
import wei           from '../data/characters/wei.json'
import yan           from '../data/characters/yan.json'
import qi            from '../data/characters/qi.json'
import misc          from '../data/characters/misc.json'
import misc2         from '../data/characters/misc2.json'
import aiYanMajor    from '../data/characters/ai_yan_major.json'
import countries     from '../data/glossary/countries.json'
import index         from '../data/index.json'

const ALL_CHARACTERS = [
  ...mountainFolk,
  ...qin, ...qinBatch2, ...qinMajor,
  ...zhao, ...zhaoBatch2, ...zhaoMajor,
  ...otherStates,
  ...chu, ...chuMajor,
  ...wei, ...yan, ...qi,
  ...aiYanMajor,
  ...misc, ...misc2,
].filter(c => c.country !== 'unknown')

const FACTIONS = [
  { id: 'qin',           label: 'Qin',           jp: '秦',    color: '#c0392b' },
  { id: 'zhao',          label: 'Zhao',          jp: '趙',    color: '#2980b9' },
  { id: 'chu',           label: 'Chu',           jp: '楚',    color: '#8e44ad' },
  { id: 'wei',           label: 'Wei',           jp: '魏',    color: '#16a085' },
  { id: 'yan',           label: 'Yan',           jp: '燕',    color: '#1abc9c' },
  { id: 'ai',            label: 'Ai',            jp: '毐',    color: '#884ea0' },
  { id: 'han',           label: 'Han',           jp: '韓',    color: '#d4ac0d' },
  { id: 'qi',            label: 'Qi',            jp: '斉',    color: '#e67e22' },
  { id: 'mountain_folk', label: 'Mountain Folk', jp: '山の民', color: '#7d6608' },
]

const COUNTRY_COLORS = Object.fromEntries(FACTIONS.map(f => [f.id, f.color]))

// ─── Simulation Logic ────────────────────────────────────────────────────────
function simulate(attackParty, defenseParty) {
  const strategySkills = { attack: [], defense: [] }
  for (const general of attackParty) {
    const strats = (general.skills || []).filter(s => s.type === 'Strategy')
    if (strats.length) strategySkills.attack.push({ general, skills: strats })
  }
  for (const general of defenseParty) {
    const strats = (general.skills || []).filter(s => s.type === 'Strategy')
    if (strats.length) strategySkills.defense.push({ general, skills: strats })
  }
  const atkQueues = attackParty.map(g => [...(g.skills||[]).filter(s=>s.type==='Combat')].reverse())
  const defQueues = defenseParty.map(g => [...(g.skills||[]).filter(s=>s.type==='Combat')].reverse())
  const turns = []
  for (let turn = 1; turn <= 4; turn++) {
    const entries = []
    const maxLen = Math.max(attackParty.length, defenseParty.length)
    for (let i = 0; i < maxLen; i++) {
      if (i < attackParty.length) entries.push({ general: attackParty[i], skill: atkQueues[i].shift()||null, side:'attack' })
      if (i < defenseParty.length) entries.push({ general: defenseParty[i], skill: defQueues[i].shift()||null, side:'defense' })
    }
    turns.push({ turn, entries })
  }
  return { strategySkills, turns }
}

// ─── General Picker Modal ─────────────────────────────────────────────────────
function GeneralPicker({ onSelect, onClose, excludeIds = [] }) {
  const [search, setSearch] = useState('')
  const [faction, setFaction] = useState('all')
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const filtered = ALL_CHARACTERS.filter(c => {
    if (excludeIds.includes(c.id)) return false
    if (faction !== 'all' && c.country !== faction) return false
    if (search) {
      const s = search.toLowerCase()
      return c.name_en.toLowerCase().includes(s) || c.name_jp.includes(search)
    }
    return true
  })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Select General</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-search-row">
          <input
            ref={inputRef}
            className="modal-search"
            placeholder="Search by name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="modal-faction" value={faction} onChange={e => setFaction(e.target.value)}>
            <option value="all">All</option>
            {FACTIONS.map(f => <option key={f.id} value={f.id}>{f.label} {f.jp}</option>)}
          </select>
        </div>
        <div className="modal-grid">
          {filtered.map(char => (
            <button
              key={char.id}
              className="modal-char-btn"
              style={{ borderTopColor: COUNTRY_COLORS[char.country] || '#444' }}
              onClick={() => { onSelect(char); onClose() }}
            >
              {char.image
                ? <img src={char.image} alt={char.name_en} className="modal-char-img" />
                : <div className="modal-char-placeholder">{char.name_en[0]}</div>
              }
              <span className="modal-char-name">{char.name_en}</span>
              <span className="modal-char-jp">{char.name_jp}</span>
            </button>
          ))}
          {filtered.length === 0 && <p className="modal-empty">No generals found.</p>}
        </div>
      </div>
    </div>
  )
}

// ─── App Shell ───────────────────────────────────────────────────────────────
const PAGES = ['Skill Archive', 'Party Builder', 'Activation Order']

export default function App() {
  const [page, setPage]               = useState('Skill Archive')
  const [attackParty, setAttackParty] = useState([])
  const [defenseParty, setDefenseParty] = useState([])
  const [search, setSearch]           = useState('')
  const [addingTo, setAddingTo]       = useState('attack')

  const toggleParty = (char, side) => {
    const setter = side === 'attack' ? setAttackParty : setDefenseParty
    setter(prev => {
      if (prev.find(p => p.id === char.id)) return prev.filter(p => p.id !== char.id)
      if (prev.length >= 4) return prev
      return [...prev, char]
    })
  }

  const removeFromParty = (char, side) => {
    const setter = side === 'attack' ? setAttackParty : setDefenseParty
    setter(prev => prev.filter(p => p.id !== char.id))
  }

  const setSlot = (char, side, idx) => {
    const setter = side === 'attack' ? setAttackParty : setDefenseParty
    setter(prev => {
      const next = [...prev]
      // Remove char if already in party
      const existing = next.findIndex(p => p.id === char.id)
      if (existing !== -1) next.splice(existing, 1)
      next[idx] = char
      return next.filter(Boolean)
    })
  }

  return (
    <div className="app">
      <header className="site-header">
        <div className="header-inner">
          <div className="site-title">
            <div className="title-emblem">⚔</div>
            <div className="title-text-group">
              <span className="title-kanji">キングダム乱</span>
              <h1>Kingdom Ran EN</h1>
              <span className="title-sub">CW Skill Simulator</span>
            </div>
          </div>
          <nav className="site-nav">
            {PAGES.map(p => (
              <button key={p} className={`nav-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>
                {p}
                {p === 'Party Builder' && (attackParty.length + defenseParty.length > 0) && (
                  <span className="nav-badge">{attackParty.length + defenseParty.length}</span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="main-content">
        {page === 'Skill Archive' && (
          <SkillArchivePage
            attackParty={attackParty} defenseParty={defenseParty}
            toggleParty={toggleParty} addingTo={addingTo} setAddingTo={setAddingTo}
            search={search} setSearch={setSearch}
          />
        )}
        {page === 'Party Builder' && (
          <PartyBuilderPage
            attackParty={attackParty} defenseParty={defenseParty}
            setAttackParty={setAttackParty} setDefenseParty={setDefenseParty}
            setSlot={setSlot} removeFromParty={removeFromParty}
            goToOrder={() => setPage('Activation Order')}
          />
        )}
        {page === 'Activation Order' && (
          <ActivationOrderPage
            attackParty={attackParty} defenseParty={defenseParty}
            goToParty={() => setPage('Party Builder')}
          />
        )}
      </main>

      <footer className="site-footer">
        <p>Fan-made English resource for Kingdom Ran (キングダム乱) · Not affiliated with Cygames or Shueisha</p>
        <p>Data: <a href="https://pirock55.work/souha-skill-archive/" target="_blank" rel="noreferrer">pirock55.work</a> · {index.characters.filter(c=>c.status==='done').length}/{index._meta.total_characters_in_game} translated · Images: <a href="https://touranko.vercel.app" target="_blank" rel="noreferrer">touranko.vercel.app</a></p>
      </footer>
    </div>
  )
}

// ─── Skill Archive ────────────────────────────────────────────────────────────
function SkillArchivePage({ attackParty, defenseParty, toggleParty, addingTo, setAddingTo, search, setSearch }) {
  const [openFactions, setOpenFactions] = useState({})
  const toggleFaction = id => setOpenFactions(prev => ({ ...prev, [id]: !prev[id] }))
  const searchLower = search.toLowerCase()
  const filtered = search ? ALL_CHARACTERS.filter(c =>
    c.name_en.toLowerCase().includes(searchLower) || c.name_jp.includes(search)
  ) : null

  return (
    <section className="archive-page">
      <div className="archive-toolbar">
        <div className="search-wrap">
          <span className="search-icon">⌕</span>
          <input className="search-input" placeholder="Search generals…" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="search-clear" onClick={() => setSearch('')}>✕</button>}
        </div>
        <div className="side-selector">
          <button className={`side-btn side-btn--attack ${addingTo==='attack'?'active':''}`} onClick={() => setAddingTo('attack')}>⚔ Attack</button>
          <button className={`side-btn side-btn--defense ${addingTo==='defense'?'active':''}`} onClick={() => setAddingTo('defense')}>🛡 Defense</button>
        </div>
      </div>

      <div className="party-status-bar">
        <div className="party-status attack-status">
          <span className="pstatus-label">⚔ Attacking</span>
          <span className="pstatus-names">{attackParty.length ? attackParty.map(c=>c.name_en).join(' · ') : 'Empty'}</span>
          <span className="pstatus-count">{attackParty.length}/4</span>
        </div>
        <div className="party-status defense-status">
          <span className="pstatus-label">🛡 Defending</span>
          <span className="pstatus-names">{defenseParty.length ? defenseParty.map(c=>c.name_en).join(' · ') : 'Empty'}</span>
          <span className="pstatus-count">{defenseParty.length}/4</span>
        </div>
      </div>

      {filtered ? (
        <div>
          <p className="result-count">{filtered.length} general{filtered.length!==1?'s':''}</p>
          <div className="character-grid">
            {filtered.map(char => (
              <CharacterCard key={char.id} char={char}
                inAttack={attackParty.some(p=>p.id===char.id)}
                inDefense={defenseParty.some(p=>p.id===char.id)}
                addingTo={addingTo} onToggle={() => toggleParty(char, addingTo)}
                attackFull={attackParty.length>=4} defenseFull={defenseParty.length>=4}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="faction-list">
          {FACTIONS.map(faction => {
            const chars = ALL_CHARACTERS.filter(c => c.country === faction.id)
            if (!chars.length) return null
            const isOpen = openFactions[faction.id]
            return (
              <div key={faction.id} className="faction-section">
                <button className="faction-header" style={{ '--faction-color': faction.color }} onClick={() => toggleFaction(faction.id)}>
                  <span className="faction-color-dot" style={{ background: faction.color }} />
                  <span className="faction-name-en">{faction.label}</span>
                  <span className="faction-name-jp">{faction.jp}</span>
                  <span className="faction-count">{chars.length}</span>
                  <span className="faction-chevron">{isOpen ? '▲' : '▼'}</span>
                </button>
                {isOpen && (
                  <div className="character-grid faction-grid">
                    {chars.map(char => (
                      <CharacterCard key={char.id} char={char}
                        inAttack={attackParty.some(p=>p.id===char.id)}
                        inDefense={defenseParty.some(p=>p.id===char.id)}
                        addingTo={addingTo} onToggle={() => toggleParty(char, addingTo)}
                        attackFull={attackParty.length>=4} defenseFull={defenseParty.length>=4}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function CharacterCard({ char, inAttack, inDefense, addingTo, onToggle, attackFull, defenseFull }) {
  const [expanded, setExpanded] = useState(false)
  const inCurrent = addingTo === 'attack' ? inAttack : inDefense
  const full = addingTo === 'attack' ? attackFull : defenseFull
  const borderColor = COUNTRY_COLORS[char.country] || '#444'

  let indicator = null
  if (inAttack && inDefense) indicator = <span className="card-badge both-badge">Both</span>
  else if (inAttack) indicator = <span className="card-badge atk-badge">⚔ ATK</span>
  else if (inDefense) indicator = <span className="card-badge def-badge">🛡 DEF</span>

  return (
    <div className="char-card" style={{ '--card-color': borderColor }}>
      <div className="char-card-top" style={{ borderTopColor: borderColor }}>
        {char.image
          ? <img src={char.image} alt={char.name_en} className="char-image" loading="lazy" />
          : <div className="char-image-placeholder" style={{ background: borderColor + '22' }}>
              <span style={{ color: borderColor, fontSize: '1.5rem' }}>?</span>
            </div>
        }
        {indicator && <div className="card-badge-wrap">{indicator}</div>}
      </div>
      <div className="char-card-body">
        <div className="char-names">
          <span className="char-name-en">{char.name_en}</span>
          <span className="char-name-jp">{char.name_jp}</span>
        </div>
        <div className="char-card-actions">
          <button className="btn-expand" onClick={() => setExpanded(e => !e)}>
            {expanded ? '▲' : '▼ Skills'}
          </button>
          <button
            className={`btn-party ${inCurrent ? 'btn-party--remove' : 'btn-party--add'}`}
            style={inCurrent ? {} : { background: addingTo === 'attack' ? '#c0392b' : '#2980b9' }}
            onClick={onToggle}
            disabled={!inCurrent && full}
          >
            {inCurrent ? '✕ Remove' : addingTo === 'attack' ? '+ ATK' : '+ DEF'}
          </button>
        </div>
        {expanded && (
          <div className="skill-list">
            {(char.skills||[]).length > 0
              ? char.skills.map((skill, si) => <SkillBlock key={si} skill={skill} />)
              : <p className="pending-note">⏳ Skills pending</p>
            }
          </div>
        )}
      </div>
    </div>
  )
}

function SkillBlock({ skill }) {
  const typeColors = { Combat: '#c0392b', Strategy: '#2980b9', Administration: '#27ae60' }
  return (
    <div className="skill-block">
      <div className="skill-header">
        <span className="skill-name">{skill.name_en}</span>
        <div className="skill-tags">
          {skill.star6 && <span className="skill-star6-tag">☆6</span>}
          <span className="skill-type-tag" style={{ background: typeColors[skill.type]||'#555' }}>{skill.type}</span>
          {skill.type === 'Administration' && <span className="skill-map-tag">Map only</span>}
        </div>
      </div>
      <div className="skill-name-jp">{skill.name_jp}</div>
      <table className="effect-table">
        <thead><tr><th>Condition</th><th>Target</th><th>Effect</th><th>Duration</th></tr></thead>
        <tbody>
          {skill.effects.map((eff, ei) => (
            <tr key={ei}>
              <td>{eff.condition||'—'}</td><td>{eff.target}</td><td>{eff.effect}</td><td>{eff.duration||'—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Party Builder ────────────────────────────────────────────────────────────
function PartyBuilderPage({ attackParty, defenseParty, setAttackParty, setDefenseParty, setSlot, removeFromParty, goToOrder }) {
  const [picker, setPicker] = useState(null) // { side, idx }

  const openPicker = (side, idx) => setPicker({ side, idx })
  const closePicker = () => setPicker(null)
  const handleSelect = (char) => {
    if (!picker) return
    setSlot(char, picker.side, picker.idx)
  }

  const excludeIds = [
    ...attackParty.map(c => c.id),
    ...defenseParty.map(c => c.id),
  ]

  return (
    <section className="party-page">
      {picker && (
        <GeneralPicker
          onSelect={handleSelect}
          onClose={closePicker}
          excludeIds={excludeIds}
        />
      )}

      <h2 className="page-title">Party Builder</h2>
      <p className="page-hint">Click any slot to search and add a general. Build both formations — up to 4 generals each.</p>

      <div className="dual-party">
        <FormationSlots
          side="attack" label="⚔ Attacking Formation" party={attackParty}
          onClickSlot={(idx) => openPicker('attack', idx)}
          onRemove={(char) => removeFromParty(char, 'attack')}
        />
        <div className="party-vs">VS</div>
        <FormationSlots
          side="defense" label="🛡 Defending Formation" party={defenseParty}
          onClickSlot={(idx) => openPicker('defense', idx)}
          onRemove={(char) => removeFromParty(char, 'defense')}
        />
      </div>

      {(attackParty.length > 0 || defenseParty.length > 0) && (
        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <button className="btn-simulate" onClick={goToOrder}>▶ Simulate Activation Order</button>
        </div>
      )}
    </section>
  )
}

function FormationSlots({ side, label, party, onClickSlot, onRemove }) {
  const color = side === 'attack' ? '#c0392b' : '#2980b9'
  return (
    <div className="party-side">
      <div className="party-side-header" style={{ borderBottomColor: color }}>
        <span className="party-side-title" style={{ color }}>{label}</span>
      </div>
      <div className="party-slots-vertical">
        {Array.from({ length: 4 }).map((_, i) => {
          const member = party[i]
          const cardColor = member ? (COUNTRY_COLORS[member.country] || '#444') : color
          return member ? (
            <div key={i} className="party-slot-card occupied" style={{ borderLeftColor: cardColor }}>
              <span className="slot-num" style={{ color }}>{i + 1}</span>
              {member.image && <img src={member.image} alt={member.name_en} className="slot-img" />}
              <div className="slot-names">
                <span className="slot-name">{member.name_en}</span>
                <span className="slot-name-jp">{member.name_jp}</span>
              </div>
              <div className="slot-skill-preview">
                {(member.skills||[]).filter(s=>s.type==='Combat').map((s,si) => (
                  <span key={si} className="slot-skill-dot" title={s.name_en}>C{si+1}</span>
                ))}
                {(member.skills||[]).filter(s=>s.type==='Strategy').map((s,si) => (
                  <span key={si} className="slot-skill-dot slot-skill-dot--strat" title={s.name_en}>S</span>
                ))}
              </div>
              <button className="slot-remove" onClick={() => onRemove(member)}>✕</button>
            </div>
          ) : (
            <button key={i} className="party-slot-card empty" style={{ borderLeftColor: color+'44', '--hover-color': color }} onClick={() => onClickSlot(i)}>
              <span className="slot-num" style={{ color: color+'88' }}>{i + 1}</span>
              <span className="slot-add-icon" style={{ color: color+'88' }}>＋</span>
              <span className="slot-add-label">Click to add</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Activation Order ─────────────────────────────────────────────────────────
function ActivationOrderPage({ attackParty, defenseParty, goToParty }) {
  if (!attackParty.length && !defenseParty.length) {
    return (
      <section className="order-page">
        <h2 className="page-title">Activation Order</h2>
        <div className="empty-cta">
          <p>Build your formations first.</p>
          <button className="btn-simulate" onClick={goToParty}>Go to Party Builder</button>
        </div>
      </section>
    )
  }
  const { strategySkills, turns } = simulate(attackParty, defenseParty)
  return (
    <section className="order-page">
      <h2 className="page-title">Skill Activation Order</h2>

      {/* Formation header */}
      <div className="dual-formation">
        <div className="formation-side attack-side">
          <div className="formation-side-title">⚔ Attacking</div>
          <div className="formation-bar">
            {attackParty.map((g,i) => (
              <div key={g.id} className="formation-general" style={{ borderTopColor: COUNTRY_COLORS[g.country]||'#444' }}>
                <span className="formation-num">#{i+1}</span>
                {g.image && <img src={g.image} alt={g.name_en} className="formation-img" />}
                <span className="formation-name">{g.name_en}</span>
              </div>
            ))}
            {!attackParty.length && <span className="formation-empty">None</span>}
          </div>
        </div>
        <div className="formation-vs">VS</div>
        <div className="formation-side defense-side">
          <div className="formation-side-title">🛡 Defending</div>
          <div className="formation-bar">
            {defenseParty.map((g,i) => (
              <div key={g.id} className="formation-general" style={{ borderTopColor: COUNTRY_COLORS[g.country]||'#444' }}>
                <span className="formation-num">#{i+1}</span>
                {g.image && <img src={g.image} alt={g.name_en} className="formation-img" />}
                <span className="formation-name">{g.name_en}</span>
              </div>
            ))}
            {!defenseParty.length && <span className="formation-empty">None</span>}
          </div>
        </div>
      </div>

      {/* Strategy */}
      <div className="sim-section">
        <div className="sim-section-header strategy-header">⚑ Strategy Skills — Always Active</div>
        <div className="dual-strategy">
          <StrategySide skills={strategySkills.attack} side="attack" label="⚔ Attacker" />
          <StrategySide skills={strategySkills.defense} side="defense" label="🛡 Defender" />
        </div>
      </div>

      {/* Turns */}
      <div className="sim-section">
        <div className="sim-section-header combat-header">⚔ Turn-by-Turn Combat</div>
        {turns.map(({ turn, entries }) => (
          <div key={turn} className="sim-turn-block">
            <div className="sim-turn-label">Turn {turn}</div>
            <div className="sim-turn-entries">
              {entries.map(({ general, skill, side }, idx) => (
                <div key={idx} className={`sim-entry sim-entry--${side}`}>
                  <div className="sim-entry-side-bar" style={{ background: side==='attack'?'#c0392b':'#2980b9' }} />
                  <div className="sim-entry-body">
                    <div className="sim-entry-general">
                      {general.image && <img src={general.image} alt={general.name_en} className="sim-entry-img" />}
                      <div>
                        <span className="sim-general-name">{general.name_en}</span>
                        <span className="sim-general-jp">{general.name_jp}</span>
                      </div>
                      <span className="sim-side-tag" style={{ background: side==='attack'?'rgba(192,57,43,0.2)':'rgba(41,128,185,0.2)', color: side==='attack'?'#e07060':'#7fb3d3' }}>
                        {side==='attack'?'⚔ ATK':'🛡 DEF'}
                      </span>
                    </div>
                    {skill
                      ? <SimSkillDisplay skill={skill} />
                      : <div className="sim-normal-attack">— Normal Attack —</div>
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function StrategySide({ skills, side, label }) {
  const color = side === 'attack' ? '#c0392b' : '#2980b9'
  return (
    <div className={`strategy-side strategy-side--${side}`}>
      <div className="strategy-side-label" style={{ color, borderBottomColor: color+'44' }}>{label}</div>
      {!skills.length
        ? <p className="sim-empty">None</p>
        : skills.map(({ general, skills: gSkills }) => (
          <div key={general.id} className="strat-general-block">
            <div className="strat-general-name" style={{ color }}>
              {general.name_en} <span className="sim-general-jp">{general.name_jp}</span>
            </div>
            {gSkills.map((skill, si) => (
              <div key={si} className="strat-skill-row">
                <div className="strat-skill-name">
                  {skill.name_en}
                  {skill.star6 && <span className="skill-star6-tag">☆6</span>}
                </div>
                <div className="strat-effects">
                  {skill.effects.map((eff, ei) => (
                    <div key={ei} className="strat-effect-row">
                      {eff.condition && <span className="strat-cond">{eff.condition} →</span>}
                      <span className="strat-target">{eff.target}:</span>
                      <span className="strat-effect">{eff.effect}</span>
                      {eff.duration && <span className="strat-dur">({eff.duration})</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))
      }
    </div>
  )
}

function SimSkillDisplay({ skill }) {
  const typeColors = { Combat:'#c0392b', Strategy:'#2980b9', Administration:'#27ae60' }
  return (
    <div className="sim-skill-display">
      <div className="sim-skill-header">
        <span className="sim-skill-name">{skill.name_en}</span>
        {skill.star6 && <span className="skill-star6-tag">☆6</span>}
      </div>
      <div className="sim-skill-jp">{skill.name_jp}</div>
      <table className="effect-table sim-effect-table">
        <thead><tr><th>Condition</th><th>Target</th><th>Effect</th><th>Duration</th></tr></thead>
        <tbody>
          {skill.effects.map((eff, ei) => (
            <tr key={ei}>
              <td>{eff.condition||'—'}</td><td>{eff.target}</td><td>{eff.effect}</td><td>{eff.duration||'—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
