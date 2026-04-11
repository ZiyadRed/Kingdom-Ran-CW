import { useState } from 'react'
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

// ─── Simulation Logic ────────────────────────────────────────────────────────

function simulate(attackParty, defenseParty) {
  // Strategy skills (always active) — both teams
  const strategySkills = { attack: [], defense: [] }
  for (const general of attackParty) {
    const strats = (general.skills || []).filter(s => s.type === 'Strategy')
    if (strats.length > 0) strategySkills.attack.push({ general, skills: strats })
  }
  for (const general of defenseParty) {
    const strats = (general.skills || []).filter(s => s.type === 'Strategy')
    if (strats.length > 0) strategySkills.defense.push({ general, skills: strats })
  }

  // Combat queues — reversed (last slot fires first)
  const atkQueues = attackParty.map(g =>
    [...(g.skills || []).filter(s => s.type === 'Combat')].reverse()
  )
  const defQueues = defenseParty.map(g =>
    [...(g.skills || []).filter(s => s.type === 'Combat')].reverse()
  )

  // Turn-by-turn: attacker[0], defender[0], attacker[1], defender[1], ...
  const turns = []
  for (let turn = 1; turn <= 4; turn++) {
    const entries = []
    const maxLen = Math.max(attackParty.length, defenseParty.length)
    for (let i = 0; i < maxLen; i++) {
      if (i < attackParty.length) {
        entries.push({ general: attackParty[i], skill: atkQueues[i].shift() || null, side: 'attack' })
      }
      if (i < defenseParty.length) {
        entries.push({ general: defenseParty[i], skill: defQueues[i].shift() || null, side: 'defense' })
      }
    }
    turns.push({ turn, entries })
  }

  return { strategySkills, turns }
}

// ─── App Shell ───────────────────────────────────────────────────────────────

const PAGES = ['Skill Archive', 'Party Builder', 'Activation Order']

export default function App() {
  const [page, setPage]           = useState('Skill Archive')
  const [attackParty, setAttackParty] = useState([])
  const [defenseParty, setDefenseParty] = useState([])
  const [search, setSearch]       = useState('')
  const [addingTo, setAddingTo]   = useState('attack') // which side + button adds to

  const toggleParty = (char, side) => {
    const setter = side === 'attack' ? setAttackParty : setDefenseParty
    const party  = side === 'attack' ? attackParty    : defenseParty
    setter(prev => {
      const exists = prev.find(p => p.id === char.id)
      if (exists) return prev.filter(p => p.id !== char.id)
      if (prev.length >= 4) return prev
      return [...prev, char]
    })
  }

  const inAttack  = (char) => attackParty.some(p => p.id === char.id)
  const inDefense = (char) => defenseParty.some(p => p.id === char.id)

  return (
    <div className="app">
      <header className="site-header">
        <div className="header-inner">
          <div className="site-title">
            <span className="title-kanji">キンラン</span>
            <h1>Kingdom Ran EN</h1>
            <span className="title-sub">CW Skill Simulator</span>
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
            allCharacters={ALL_CHARACTERS}
            attackParty={attackParty}
            defenseParty={defenseParty}
            toggleParty={toggleParty}
            addingTo={addingTo}
            setAddingTo={setAddingTo}
            search={search}
            setSearch={setSearch}
          />
        )}
        {page === 'Party Builder' && (
          <PartyBuilderPage
            attackParty={attackParty}
            defenseParty={defenseParty}
            setAttackParty={setAttackParty}
            setDefenseParty={setDefenseParty}
            toggleParty={toggleParty}
            goToOrder={() => setPage('Activation Order')}
          />
        )}
        {page === 'Activation Order' && (
          <ActivationOrderPage
            attackParty={attackParty}
            defenseParty={defenseParty}
            goToParty={() => setPage('Party Builder')}
          />
        )}
      </main>

      <footer className="site-footer">
        <p>Fan-made English resource for Kingdom Ran (キングダム乱). Not affiliated with Cygames or Shueisha.</p>
        <p>Data from <a href="https://pirock55.work/souha-skill-archive/" target="_blank" rel="noreferrer">pirock55.work</a> · {index.characters.filter(c => c.status === 'done').length} / {index._meta.total_characters_in_game} characters translated</p>
      </footer>
    </div>
  )
}

// ─── Skill Archive ────────────────────────────────────────────────────────────

function SkillArchivePage({ allCharacters, attackParty, defenseParty, toggleParty, addingTo, setAddingTo, search, setSearch }) {
  const [openFactions, setOpenFactions] = useState({})

  const toggleFaction = (id) => setOpenFactions(prev => ({ ...prev, [id]: !prev[id] }))

  const searchLower = search.toLowerCase()
  const filtered = search
    ? allCharacters.filter(c => c.name_en.toLowerCase().includes(searchLower) || c.name_jp.includes(search))
    : null

  return (
    <section className="archive-page">
      <div className="archive-search-bar">
        <input className="search-input" placeholder="Search generals…" value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button className="search-clear" onClick={() => setSearch('')}>✕</button>}

        {/* Side selector */}
        <div className="side-selector">
          <span className="side-label">Adding to:</span>
          <button
            className={`side-btn side-btn--attack ${addingTo === 'attack' ? 'active' : ''}`}
            onClick={() => setAddingTo('attack')}
          >⚔ Attack</button>
          <button
            className={`side-btn side-btn--defense ${addingTo === 'defense' ? 'active' : ''}`}
            onClick={() => setAddingTo('defense')}
          >🛡 Defense</button>
        </div>
      </div>

      {/* Party status bar */}
      <div className="party-status-bar">
        <span className="party-status attack-status">⚔ Attack: {attackParty.length}/4 — {attackParty.map(c => c.name_en).join(', ') || 'Empty'}</span>
        <span className="party-status defense-status">🛡 Defense: {defenseParty.length}/4 — {defenseParty.map(c => c.name_en).join(', ') || 'Empty'}</span>
      </div>

      {/* Search results */}
      {filtered && (
        <div>
          <p className="result-count">{filtered.length} general{filtered.length !== 1 ? 's' : ''}</p>
          <div className="character-grid">
            {filtered.map(char => (
              <CharacterCard
                key={char.id} char={char}
                inAttack={attackParty.some(p => p.id === char.id)}
                inDefense={defenseParty.some(p => p.id === char.id)}
                addingTo={addingTo}
                onToggle={() => toggleParty(char, addingTo)}
                attackFull={attackParty.length >= 4}
                defenseFull={defenseParty.length >= 4}
              />
            ))}
          </div>
        </div>
      )}

      {/* Faction browse */}
      {!filtered && (
        <div className="faction-list">
          {FACTIONS.map(faction => {
            const chars = allCharacters.filter(c => c.country === faction.id)
            if (!chars.length) return null
            const isOpen = openFactions[faction.id]
            return (
              <div key={faction.id} className="faction-section">
                <button className="faction-header" style={{ borderLeftColor: faction.color }} onClick={() => toggleFaction(faction.id)}>
                  <span className="faction-label">
                    <span className="faction-name-en">{faction.label}</span>
                    <span className="faction-name-jp">{faction.jp}</span>
                  </span>
                  <span className="faction-count">{chars.length} generals</span>
                  <span className="faction-chevron">{isOpen ? '▲' : '▼'}</span>
                </button>
                {isOpen && (
                  <div className="character-grid faction-grid">
                    {chars.map(char => (
                      <CharacterCard
                        key={char.id} char={char}
                        inAttack={attackParty.some(p => p.id === char.id)}
                        inDefense={defenseParty.some(p => p.id === char.id)}
                        addingTo={addingTo}
                        onToggle={() => toggleParty(char, addingTo)}
                        attackFull={attackParty.length >= 4}
                        defenseFull={defenseParty.length >= 4}
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

  let btnLabel, btnClass
  if (inAttack && inDefense) {
    btnLabel = '✓ Both'; btnClass = 'btn-party btn-party--both'
  } else if (inAttack) {
    btnLabel = '⚔ Attack'; btnClass = 'btn-party btn-party--attack'
  } else if (inDefense) {
    btnLabel = '🛡 Defense'; btnClass = 'btn-party btn-party--defense'
  } else {
    btnLabel = addingTo === 'attack' ? '+ Attack' : '+ Defense'
    btnClass = `btn-party btn-party--add-${addingTo}`
  }

  return (
    <div className={`char-card country-${char.country} ${inAttack ? 'in-attack' : ''} ${inDefense ? 'in-defense' : ''}`}>
      {char.image && (
        <div className="char-image-wrap">
          <img src={char.image} alt={char.name_en} className="char-image" loading="lazy" />
        </div>
      )}
      <div className="char-card-header">
        <div className="char-names">
          <span className="char-name-en">{char.name_en}</span>
          <span className="char-name-jp">{char.name_jp}</span>
        </div>
      </div>
      {char.unit && <p className="char-unit">{char.unit}</p>}
      <div className="char-card-actions">
        <button className="btn-expand" onClick={() => setExpanded(e => !e)}>
          {expanded ? '▲ Hide' : '▼ Skills'}
        </button>
        <button
          className={btnClass}
          onClick={onToggle}
          disabled={!inCurrent && full}
          title={!inCurrent && full ? 'Formation is full (4 max)' : ''}
        >{btnLabel}</button>
      </div>
      {expanded && char.skills && char.skills.length > 0 && (
        <div className="skill-list">
          {char.skills.map((skill, si) => <SkillBlock key={si} skill={skill} />)}
        </div>
      )}
      {expanded && (!char.skills || char.skills.length === 0) && (
        <p className="pending-note">⏳ Skills pending translation</p>
      )}
    </div>
  )
}

function SkillBlock({ skill }) {
  const typeColors = { Combat: '#c0392b', Strategy: '#2980b9', Administration: '#27ae60' }
  const isAdmin = skill.type === 'Administration'
  return (
    <div className="skill-block">
      <div className="skill-header">
        <span className="skill-name">{skill.name_en}</span>
        <span className="skill-type" style={{ background: typeColors[skill.type] || '#555' }}>{skill.type}</span>
        {isAdmin && <span className="skill-map-tag">Map only</span>}
        {skill.star6 && <span className="skill-star6-tag">☆6</span>}
      </div>
      <div className="skill-name-jp">{skill.name_jp}</div>
      <table className="effect-table">
        <thead><tr><th>Condition</th><th>Target</th><th>Effect</th><th>Duration</th></tr></thead>
        <tbody>
          {skill.effects.map((eff, ei) => (
            <tr key={ei}>
              <td>{eff.condition || '—'}</td>
              <td>{eff.target}</td>
              <td>{eff.effect}</td>
              <td>{eff.duration || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Party Builder ────────────────────────────────────────────────────────────

function PartyBuilderPage({ attackParty, defenseParty, setAttackParty, setDefenseParty, toggleParty, goToOrder }) {
  const ready = attackParty.length > 0 || defenseParty.length > 0

  return (
    <section className="party-page">
      <h2>Party Builder</h2>
      <p className="page-hint">Build both formations. Each side holds up to <strong>4 generals</strong>. Formation order (left → right, slot 1–4) determines skill firing order.</p>

      <div className="dual-party">
        {/* Attack side */}
        <div className="party-side party-side--attack">
          <div className="party-side-header">
            <span className="party-side-icon">⚔</span>
            <span className="party-side-title">Attacking Formation</span>
          </div>
          <div className="party-slots">
            {Array.from({ length: 4 }).map((_, i) => {
              const member = attackParty[i]
              return (
                <div key={i} className={`party-slot ${member ? `occupied country-${member.country}` : 'empty'}`}>
                  <span className="slot-num">{i + 1}</span>
                  {member ? (
                    <>
                      {member.image && <img src={member.image} alt={member.name_en} className="slot-img" />}
                      <div className="slot-names">
                        <span className="slot-name">{member.name_en}</span>
                        <span className="slot-name-jp">{member.name_jp}</span>
                      </div>
                      <button className="slot-remove" onClick={() => toggleParty(member, 'attack')}>✕</button>
                    </>
                  ) : <span className="slot-placeholder">Empty</span>}
                </div>
              )
            })}
          </div>
          {attackParty.length === 0 && <p className="empty-state-small">Add generals from Skill Archive</p>}
        </div>

        <div className="party-vs">VS</div>

        {/* Defense side */}
        <div className="party-side party-side--defense">
          <div className="party-side-header">
            <span className="party-side-icon">🛡</span>
            <span className="party-side-title">Defending Formation</span>
          </div>
          <div className="party-slots">
            {Array.from({ length: 4 }).map((_, i) => {
              const member = defenseParty[i]
              return (
                <div key={i} className={`party-slot ${member ? `occupied country-${member.country}` : 'empty'}`}>
                  <span className="slot-num">{i + 1}</span>
                  {member ? (
                    <>
                      {member.image && <img src={member.image} alt={member.name_en} className="slot-img" />}
                      <div className="slot-names">
                        <span className="slot-name">{member.name_en}</span>
                        <span className="slot-name-jp">{member.name_jp}</span>
                      </div>
                      <button className="slot-remove" onClick={() => toggleParty(member, 'defense')}>✕</button>
                    </>
                  ) : <span className="slot-placeholder">Empty</span>}
                </div>
              )
            })}
          </div>
          {defenseParty.length === 0 && <p className="empty-state-small">Add generals from Skill Archive</p>}
        </div>
      </div>

      {ready && (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button className="nav-btn active" onClick={goToOrder}>▶ View Activation Order</button>
        </div>
      )}
    </section>
  )
}

// ─── Activation Order ─────────────────────────────────────────────────────────

function ActivationOrderPage({ attackParty, defenseParty, goToParty }) {
  if (attackParty.length === 0 && defenseParty.length === 0) {
    return (
      <section className="order-page">
        <h2>Activation Order</h2>
        <p className="empty-state">
          Build your formations first.<br />
          <button className="nav-btn active" style={{ marginTop: '1rem' }} onClick={goToParty}>Go to Party Builder</button>
        </p>
      </section>
    )
  }

  const { strategySkills, turns } = simulate(attackParty, defenseParty)

  return (
    <section className="order-page">
      <h2>Skill Activation Order</h2>

      {/* Formation bars */}
      <div className="dual-formation">
        <div className="formation-side formation-side--attack">
          <div className="formation-side-label">⚔ Attacking</div>
          <div className="formation-bar">
            {attackParty.map((g, i) => (
              <div key={g.id} className={`formation-general country-${g.country}`}>
                <span className="formation-num">{i + 1}</span>
                {g.image && <img src={g.image} alt={g.name_en} className="formation-img" />}
                <span className="formation-name">{g.name_en}</span>
                <span className="formation-name-jp">{g.name_jp}</span>
              </div>
            ))}
            {attackParty.length === 0 && <span className="formation-empty">No attackers</span>}
          </div>
        </div>
        <div className="formation-vs">VS</div>
        <div className="formation-side formation-side--defense">
          <div className="formation-side-label">🛡 Defending</div>
          <div className="formation-bar">
            {defenseParty.map((g, i) => (
              <div key={g.id} className={`formation-general country-${g.country}`}>
                <span className="formation-num">{i + 1}</span>
                {g.image && <img src={g.image} alt={g.name_en} className="formation-img" />}
                <span className="formation-name">{g.name_en}</span>
                <span className="formation-name-jp">{g.name_jp}</span>
              </div>
            ))}
            {defenseParty.length === 0 && <span className="formation-empty">No defenders</span>}
          </div>
        </div>
      </div>

      {/* Strategy skills */}
      <div className="sim-section">
        <h3 className="sim-section-title sim-title-strategy">⚑ Strategy Skills — Always Active</h3>
        <div className="dual-strategy">
          {/* Attack strategy */}
          <div className="strategy-side strategy-side--attack">
            <div className="strategy-side-label">⚔ Attacker Strategy</div>
            {strategySkills.attack.length === 0
              ? <p className="sim-empty">None</p>
              : strategySkills.attack.map(({ general, skills }) => (
                <div key={general.id} className="sim-general-block">
                  <div className="sim-general-header sim-general-header--attack">
                    <span className="sim-general-name">{general.name_en}</span>
                    <span className="sim-general-name-jp">{general.name_jp}</span>
                  </div>
                  {skills.map((skill, si) => <SimSkillRow key={si} skill={skill} showType />)}
                </div>
              ))
            }
          </div>
          {/* Defense strategy */}
          <div className="strategy-side strategy-side--defense">
            <div className="strategy-side-label">🛡 Defender Strategy</div>
            {strategySkills.defense.length === 0
              ? <p className="sim-empty">None</p>
              : strategySkills.defense.map(({ general, skills }) => (
                <div key={general.id} className="sim-general-block">
                  <div className="sim-general-header sim-general-header--defense">
                    <span className="sim-general-name">{general.name_en}</span>
                    <span className="sim-general-name-jp">{general.name_jp}</span>
                  </div>
                  {skills.map((skill, si) => <SimSkillRow key={si} skill={skill} showType />)}
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* Turn by turn */}
      <div className="sim-section">
        <h3 className="sim-section-title sim-title-combat">⚔ Turn-by-Turn Combat</h3>
        {turns.map(({ turn, entries }) => (
          <div key={turn} className="sim-turn-block">
            <div className="sim-turn-header">Turn {turn}</div>
            <div className="sim-turn-entries">
              {entries.map(({ general, skill, side }, idx) => (
                <div key={idx} className={`sim-entry sim-entry--${side} country-${general.country}`}>
                  <div className={`sim-entry-label ${side === 'attack' ? 'sim-entry-label--attack' : 'sim-entry-label--defense'}`}>
                    {side === 'attack' ? '⚔' : '🛡'}
                  </div>
                  <div className="sim-entry-content">
                    <div className="sim-general-header">
                      <span className="sim-general-name">{general.name_en}</span>
                      <span className="sim-general-name-jp">{general.name_jp}</span>
                    </div>
                    {skill
                      ? <SimSkillRow skill={skill} />
                      : <p className="sim-normal-attack">— Normal Attack —</p>
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

function SimSkillRow({ skill, showType = false }) {
  const typeColors = { Combat: '#c0392b', Strategy: '#2980b9', Administration: '#27ae60' }
  return (
    <div className="sim-skill-row">
      <div className="sim-skill-name-row">
        <span className="sim-skill-name">{skill.name_en}</span>
        <span className="sim-skill-name-jp">{skill.name_jp}</span>
        {skill.star6 && <span className="skill-star6-tag">☆6</span>}
        {showType && (
          <span className="skill-type" style={{ background: typeColors[skill.type] || '#555', fontSize: '0.7rem', padding: '2px 8px', marginLeft: '4px' }}>
            {skill.type}
          </span>
        )}
      </div>
      <table className="effect-table sim-effect-table">
        <thead><tr><th>Condition</th><th>Target</th><th>Effect</th><th>Duration</th></tr></thead>
        <tbody>
          {skill.effects.map((eff, ei) => (
            <tr key={ei}>
              <td>{eff.condition || '—'}</td>
              <td>{eff.target}</td>
              <td>{eff.effect}</td>
              <td>{eff.duration || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
