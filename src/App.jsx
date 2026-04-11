import { useState } from 'react'
// Data imports
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
]

// ─── Simulation Logic ────────────────────────────────────────────────────────

function simulate(party) {
  // Section 1: Strategy + Administration (always active)
  const strategySkills = []
  for (const general of party) {
    const strats = (general.skills || []).filter(
      s => s.type === 'Strategy' || s.type === 'Administration'
    )
    if (strats.length > 0) strategySkills.push({ general, skills: strats })
  }

  // Section 2: Combat queues — last skill fires first
  const combatQueues = party.map(general => {
    const combatSkills = (general.skills || []).filter(s => s.type === 'Combat')
    return [...combatSkills].reverse()
  })

  const turns = []
  for (let turn = 1; turn <= 4; turn++) {
    const entries = []
    for (let i = 0; i < party.length; i++) {
      const skill = combatQueues[i].shift() || null  // null = Normal Attack
      entries.push({ general: party[i], skill })
    }
    turns.push({ turn, entries })
  }

  return { strategySkills, turns }
}

// ─── App Shell ───────────────────────────────────────────────────────────────

const PAGES = ['Skill Archive', 'Party Builder', 'Activation Order']

export default function App() {
  const [page, setPage]                   = useState('Skill Archive')
  const [filterCountry, setFilterCountry] = useState('all')
  const [filterType, setFilterType]       = useState('all')
  const [search, setSearch]               = useState('')
  const [party, setParty]                 = useState([])

  const filtered = ALL_CHARACTERS.filter(c => {
    if (filterCountry !== 'all' && c.country !== filterCountry) return false
    if (filterType !== 'all' && c.skills && !c.skills.some(s => s.type === filterType)) return false
    if (search && !c.name_en.toLowerCase().includes(search.toLowerCase()) &&
        !c.name_jp.includes(search)) return false
    return true
  })

  const toggleParty = (char) => {
    setParty(prev => {
      const exists = prev.find(p => p.id === char.id)
      if (exists) return prev.filter(p => p.id !== char.id)
      if (prev.length >= 4) return prev
      return [...prev, char]
    })
  }

  const countryOptions = Object.entries(countries).filter(([k]) => k !== '_comment')

  return (
    <div className="app">
      <header className="site-header">
        <div className="header-inner">
          <div className="site-title">
            <span className="title-kanji">キンラン</span>
            <h1>Kingdom Ran EN</h1>
            <span className="title-sub">Souha Skill Simulator</span>
          </div>
          <nav className="site-nav">
            {PAGES.map(p => (
              <button key={p} className={`nav-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>
                {p}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="main-content">
        {page === 'Skill Archive' && (
          <SkillArchivePage
            characters={filtered}
            filterCountry={filterCountry} setFilterCountry={setFilterCountry}
            filterType={filterType} setFilterType={setFilterType}
            search={search} setSearch={setSearch}
            party={party} toggleParty={toggleParty}
            countryOptions={countryOptions} index={index}
          />
        )}
        {page === 'Party Builder' && (
          <PartyBuilderPage
            party={party} setParty={setParty} toggleParty={toggleParty}
            goToOrder={() => setPage('Activation Order')}
          />
        )}
        {page === 'Activation Order' && (
          <ActivationOrderPage party={party} goToParty={() => setPage('Party Builder')} />
        )}
      </main>

      <footer className="site-footer">
        <p>Fan-made English resource for Kingdom Ran (キングダム乱). Not affiliated with Cygames or Shueisha.</p>
        <p>Data sourced from <a href="https://pirock55.work/souha-skill-archive/" target="_blank" rel="noreferrer">pirock55.work</a>. Characters: {index.characters.filter(c => c.status === 'done').length} / {index._meta.total_characters_in_game} translated.</p>
      </footer>
    </div>
  )
}

// ─── Skill Archive ────────────────────────────────────────────────────────────

function SkillArchivePage({ characters, filterCountry, setFilterCountry, filterType, setFilterType, search, setSearch, party, toggleParty, countryOptions }) {
  return (
    <section className="archive-page">
      <div className="filter-bar">
        <input className="search-input" placeholder="Search by name…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="filter-select" value={filterCountry} onChange={e => setFilterCountry(e.target.value)}>
          <option value="all">All Countries</option>
          {countryOptions.map(([key, val]) => <option key={key} value={val.id}>{val.en}</option>)}
        </select>
        <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">All Skill Types</option>
          <option value="Combat">Combat Skills</option>
          <option value="Strategy">Military Strategy</option>
          <option value="Administration">Administration</option>
        </select>
        <span className="result-count">{characters.length} general{characters.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="character-grid">
        {characters.map(char => (
          <CharacterCard
            key={char.id} char={char}
            inParty={party.some(p => p.id === char.id)}
            onToggleParty={() => toggleParty(char)}
            partyFull={party.length >= 4}
          />
        ))}
      </div>

      {characters.length === 0 && <div className="empty-state"><p>No generals match your filters.</p></div>}
    </section>
  )
}

function CharacterCard({ char, inParty, onToggleParty, partyFull }) {
  const [expanded, setExpanded] = useState(false)
  const countryLabels = {
    qin: 'Qin', zhao: 'Zhao', chu: 'Chu', wei: 'Wei',
    han: 'Han', yan: 'Yan', qi: 'Qi', ai: 'Ai', mountain_folk: 'Mountain Folk',
  }
  return (
    <div className={`char-card country-${char.country} ${inParty ? 'in-party' : ''}`}>
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
        <div className="char-meta">
          <span className={`country-tag country-tag--${char.country}`}>{countryLabels[char.country] || char.country}</span>
          {char.rarity && <span className={`rarity-tag rarity-${char.rarity}`}>{char.rarity}</span>}
        </div>
      </div>
      {char.unit && <p className="char-unit">Unit: {char.unit}</p>}
      <div className="char-card-actions">
        <button className="btn-expand" onClick={() => setExpanded(e => !e)}>
          {expanded ? '▲ Hide Skills' : '▼ Show Skills'}
        </button>
        <button
          className={`btn-party ${inParty ? 'btn-party--remove' : 'btn-party--add'}`}
          onClick={onToggleParty}
          disabled={!inParty && partyFull}
          title={!inParty && partyFull ? 'Party is full (4 generals max)' : ''}
        >
          {inParty ? '− Remove' : '+ Party'}
        </button>
      </div>
      {expanded && char.skills && (
        <div className="skill-list">
          {char.skills.map((skill, si) => <SkillBlock key={si} skill={skill} />)}
        </div>
      )}
      {expanded && !char.skills && <p className="pending-note">⏳ Skill translation pending</p>}
    </div>
  )
}

function SkillBlock({ skill }) {
  const typeColors = { Combat: '#c0392b', Strategy: '#2980b9', Administration: '#27ae60' }
  return (
    <div className="skill-block">
      <div className="skill-header">
        <span className="skill-name">{skill.name_en}</span>
        <span className="skill-type" style={{ background: typeColors[skill.type] || '#555' }}>{skill.type}</span>
      </div>
      <div className="skill-name-jp">{skill.name_jp}</div>
      <table className="effect-table">
        <thead><tr><th>Condition</th><th>Target</th><th>Effect</th><th>Duration</th></tr></thead>
        <tbody>
          {skill.effects.map((eff, ei) => (
            <tr key={ei}>
              <td className="eff-condition">{eff.condition || '—'}</td>
              <td className="eff-target">{eff.target}</td>
              <td className="eff-effect">{eff.effect}</td>
              <td className="eff-duration">{eff.duration || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Party Builder ────────────────────────────────────────────────────────────

function PartyBuilderPage({ party, toggleParty, goToOrder }) {
  return (
    <section className="party-page">
      <h2>Party Builder</h2>
      <p className="page-hint">Select up to <strong>4 generals</strong> from the Skill Archive. Formation order (left → right) determines skill firing order.</p>

      <div className="party-slots">
        {Array.from({ length: 4 }).map((_, i) => {
          const member = party[i]
          return (
            <div key={i} className={`party-slot ${member ? 'occupied' : 'empty'}`}>
              <span className="slot-num">{i + 1}</span>
              {member ? (
                <>
                  <div className="slot-names">
                    <span className="slot-name">{member.name_en}</span>
                    <span className="slot-name-jp">{member.name_jp}</span>
                  </div>
                  <button className="slot-remove" onClick={() => toggleParty(member)}>✕</button>
                </>
              ) : (
                <span className="slot-placeholder">Empty slot</span>
              )}
            </div>
          )
        })}
      </div>

      {party.length === 0 && (
        <p className="empty-state">Go to <strong>Skill Archive</strong> and click <em>+ Party</em> to add generals.</p>
      )}
      {party.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button className="nav-btn active" onClick={goToOrder}>▶ View Activation Order</button>
        </div>
      )}
    </section>
  )
}

// ─── Activation Order ─────────────────────────────────────────────────────────

function ActivationOrderPage({ party, goToParty }) {
  if (party.length === 0) {
    return (
      <section className="order-page">
        <h2>Activation Order</h2>
        <p className="empty-state">
          Build a party first.
          <br />
          <button className="nav-btn active" style={{ marginTop: '1rem' }} onClick={goToParty}>Go to Party Builder</button>
        </p>
      </section>
    )
  }

  const { strategySkills, turns } = simulate(party)

  return (
    <section className="order-page">
      <h2>Skill Activation Order</h2>

      {/* Formation bar */}
      <div className="formation-bar">
        {party.map((g, i) => (
          <div key={g.id} className={`formation-general country-${g.country}`}>
            <span className="formation-num">{i + 1}</span>
            {g.image && <img src={g.image} alt={g.name_en} className="formation-img" />}
            <span className="formation-name">{g.name_en}</span>
            <span className="formation-name-jp">{g.name_jp}</span>
          </div>
        ))}
      </div>

      {/* Section 1: Strategy / Admin */}
      <div className="sim-section">
        <h3 className="sim-section-title sim-title-strategy">⚑ Strategy Skills — Always Active</h3>
        {strategySkills.length === 0 ? (
          <p className="sim-empty">No strategy or administration skills in this party.</p>
        ) : (
          strategySkills.map(({ general, skills }) => (
            <div key={general.id} className="sim-general-block">
              <div className="sim-general-header">
                <span className="sim-general-name">{general.name_en}</span>
                <span className="sim-general-name-jp">{general.name_jp}</span>
              </div>
              {skills.map((skill, si) => (
                <SimSkillRow key={si} skill={skill} showType />
              ))}
            </div>
          ))
        )}
      </div>

      {/* Section 2: Turn by turn */}
      <div className="sim-section">
        <h3 className="sim-section-title sim-title-combat">⚔ Turn-by-Turn Combat</h3>
        {turns.map(({ turn, entries }) => (
          <div key={turn} className="sim-turn-block">
            <div className="sim-turn-header">Turn {turn}</div>
            <div className="sim-turn-generals">
              {entries.map(({ general, skill }) => (
                <div key={general.id} className={`sim-general-block sim-general-turn country-${general.country}`}>
                  <div className="sim-general-header">
                    <span className="sim-general-name">{general.name_en}</span>
                    <span className="sim-general-name-jp">{general.name_jp}</span>
                  </div>
                  {skill
                    ? <SimSkillRow skill={skill} />
                    : <p className="sim-normal-attack">— Normal Attack —</p>
                  }
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
        {showType && (
          <span className="skill-type" style={{ background: typeColors[skill.type] || '#555', fontSize: '0.7rem', padding: '2px 8px', marginLeft: '6px' }}>
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
