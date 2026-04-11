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

function simulate(party) {
  const strategySkills = []
  for (const general of party) {
    const strats = (general.skills || []).filter(
      s => s.type === 'Strategy' || s.type === 'Administration'
    )
    if (strats.length > 0) strategySkills.push({ general, skills: strats })
  }
  const combatQueues = party.map(general => {
    const combatSkills = (general.skills || []).filter(s => s.type === 'Combat')
    return [...combatSkills].reverse()
  })
  const turns = []
  for (let turn = 1; turn <= 4; turn++) {
    const entries = []
    for (let i = 0; i < party.length; i++) {
      const skill = combatQueues[i].shift() || null
      entries.push({ general: party[i], skill })
    }
    turns.push({ turn, entries })
  }
  return { strategySkills, turns }
}

// ─── App Shell ───────────────────────────────────────────────────────────────

const PAGES = ['Skill Archive', 'Party Builder', 'Activation Order']

export default function App() {
  const [page, setPage]     = useState('Skill Archive')
  const [party, setParty]   = useState([])
  const [search, setSearch] = useState('')

  const toggleParty = (char) => {
    setParty(prev => {
      const exists = prev.find(p => p.id === char.id)
      if (exists) return prev.filter(p => p.id !== char.id)
      if (prev.length >= 4) return prev
      return [...prev, char]
    })
  }

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
                {p === 'Party Builder' && party.length > 0 && (
                  <span className="nav-badge">{party.length}</span>
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
            party={party}
            toggleParty={toggleParty}
            search={search}
            setSearch={setSearch}
          />
        )}
        {page === 'Party Builder' && (
          <PartyBuilderPage
            party={party}
            toggleParty={toggleParty}
            goToOrder={() => setPage('Activation Order')}
          />
        )}
        {page === 'Activation Order' && (
          <ActivationOrderPage party={party} goToParty={() => setPage('Party Builder')} />
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

function SkillArchivePage({ allCharacters, party, toggleParty, search, setSearch }) {
  const [openFactions, setOpenFactions] = useState({})

  const toggleFaction = (id) => {
    setOpenFactions(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const searchLower = search.toLowerCase()
  const filtered = search
    ? allCharacters.filter(c =>
        c.name_en.toLowerCase().includes(searchLower) ||
        c.name_jp.includes(search)
      )
    : null

  return (
    <section className="archive-page">
      <div className="archive-search-bar">
        <input
          className="search-input"
          placeholder="Search generals by name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className="search-clear" onClick={() => setSearch('')}>✕</button>
        )}
      </div>

      {/* Search results mode */}
      {filtered && (
        <div>
          <p className="result-count">{filtered.length} general{filtered.length !== 1 ? 's' : ''} found</p>
          <div className="character-grid">
            {filtered.map(char => (
              <CharacterCard
                key={char.id} char={char}
                inParty={party.some(p => p.id === char.id)}
                onToggleParty={() => toggleParty(char)}
                partyFull={party.length >= 4}
              />
            ))}
          </div>
          {filtered.length === 0 && <p className="empty-state">No generals match your search.</p>}
        </div>
      )}

      {/* Faction browse mode */}
      {!filtered && (
        <div className="faction-list">
          {FACTIONS.map(faction => {
            const chars = allCharacters.filter(c => c.country === faction.id)
            if (chars.length === 0) return null
            const isOpen = openFactions[faction.id]
            return (
              <div key={faction.id} className="faction-section">
                <button
                  className="faction-header"
                  style={{ borderLeftColor: faction.color }}
                  onClick={() => toggleFaction(faction.id)}
                >
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
                        inParty={party.some(p => p.id === char.id)}
                        onToggleParty={() => toggleParty(char)}
                        partyFull={party.length >= 4}
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

function CharacterCard({ char, inParty, onToggleParty, partyFull }) {
  const [expanded, setExpanded] = useState(false)

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
      </div>
      {char.unit && <p className="char-unit">{char.unit}</p>}
      <div className="char-card-actions">
        <button className="btn-expand" onClick={() => setExpanded(e => !e)}>
          {expanded ? '▲ Hide' : '▼ Skills'}
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

function PartyBuilderPage({ party, toggleParty, goToOrder }) {
  return (
    <section className="party-page">
      <h2>Party Builder</h2>
      <p className="page-hint">Select up to <strong>4 generals</strong> from the Skill Archive. Formation order (left → right) determines skill firing order.</p>
      <div className="party-slots">
        {Array.from({ length: 4 }).map((_, i) => {
          const member = party[i]
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
                  <button className="slot-remove" onClick={() => toggleParty(member)}>✕</button>
                </>
              ) : (
                <span className="slot-placeholder">Empty</span>
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
          Build a party first.<br />
          <button className="nav-btn active" style={{ marginTop: '1rem' }} onClick={goToParty}>Go to Party Builder</button>
        </p>
      </section>
    )
  }

  const { strategySkills, turns } = simulate(party)

  return (
    <section className="order-page">
      <h2>Skill Activation Order</h2>

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
              {skills.map((skill, si) => <SimSkillRow key={si} skill={skill} showType />)}
            </div>
          ))
        )}
      </div>

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
                  {skill ? <SimSkillRow skill={skill} /> : <p className="sim-normal-attack">— Normal Attack —</p>}
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
