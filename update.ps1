# Kingdom Ran EN - Update Script

Set-Content -Path 'src\App.jsx' -Value @'
import { useState } from ''react''
// Data imports
import mountainFolk  from ''../data/characters/mountain_folk.json''
import qin           from ''../data/characters/qin.json''
import qinBatch2     from ''../data/characters/qin_batch2.json''
import qinMajor      from ''../data/characters/qin_major.json''
import zhao          from ''../data/characters/zhao.json''
import zhaoBatch2    from ''../data/characters/zhao_batch2.json''
import zhaoMajor     from ''../data/characters/zhao_major.json''
import otherStates   from ''../data/characters/other_states.json''
import chu           from ''../data/characters/chu.json''
import chuMajor      from ''../data/characters/chu_major.json''
import wei           from ''../data/characters/wei.json''
import yan           from ''../data/characters/yan.json''
import qi            from ''../data/characters/qi.json''
import misc          from ''../data/characters/misc.json''
import misc2         from ''../data/characters/misc2.json''
import aiYanMajor    from ''../data/characters/ai_yan_major.json''
import countries     from ''../data/glossary/countries.json''
import index         from ''../data/index.json''

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
      s => s.type === ''Strategy'' || s.type === ''Administration''
    )
    if (strats.length > 0) strategySkills.push({ general, skills: strats })
  }

  // Section 2: Combat queues — last skill fires first
  const combatQueues = party.map(general => {
    const combatSkills = (general.skills || []).filter(s => s.type === ''Combat'')
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

const PAGES = [''Skill Archive'', ''Party Builder'', ''Activation Order'']

export default function App() {
  const [page, setPage]                   = useState(''Skill Archive'')
  const [filterCountry, setFilterCountry] = useState(''all'')
  const [filterType, setFilterType]       = useState(''all'')
  const [search, setSearch]               = useState('''')
  const [party, setParty]                 = useState([])

  const filtered = ALL_CHARACTERS.filter(c => {
    if (filterCountry !== ''all'' && c.country !== filterCountry) return false
    if (filterType !== ''all'' && c.skills && !c.skills.some(s => s.type === filterType)) return false
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

  const countryOptions = Object.entries(countries).filter(([k]) => k !== ''_comment'')

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
              <button key={p} className={`nav-btn ${page === p ? ''active'' : ''''}`} onClick={() => setPage(p)}>
                {p}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="main-content">
        {page === ''Skill Archive'' && (
          <SkillArchivePage
            characters={filtered}
            filterCountry={filterCountry} setFilterCountry={setFilterCountry}
            filterType={filterType} setFilterType={setFilterType}
            search={search} setSearch={setSearch}
            party={party} toggleParty={toggleParty}
            countryOptions={countryOptions} index={index}
          />
        )}
        {page === ''Party Builder'' && (
          <PartyBuilderPage
            party={party} setParty={setParty} toggleParty={toggleParty}
            goToOrder={() => setPage(''Activation Order'')}
          />
        )}
        {page === ''Activation Order'' && (
          <ActivationOrderPage party={party} goToParty={() => setPage(''Party Builder'')} />
        )}
      </main>

      <footer className="site-footer">
        <p>Fan-made English resource for Kingdom Ran (キングダム乱). Not affiliated with Cygames or Shueisha.</p>
        <p>Data sourced from <a href="https://pirock55.work/souha-skill-archive/" target="_blank" rel="noreferrer">pirock55.work</a>. Characters: {index.characters.filter(c => c.status === ''done'').length} / {index._meta.total_characters_in_game} translated.</p>
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
        <span className="result-count">{characters.length} general{characters.length !== 1 ? ''s'' : ''''}</span>
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
    qin: ''Qin'', zhao: ''Zhao'', chu: ''Chu'', wei: ''Wei'',
    han: ''Han'', yan: ''Yan'', qi: ''Qi'', ai: ''Ai'', mountain_folk: ''Mountain Folk'',
  }
  return (
    <div className={`char-card country-${char.country} ${inParty ? ''in-party'' : ''''}`}>
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
          {expanded ? ''▲ Hide Skills'' : ''▼ Show Skills''}
        </button>
        <button
          className={`btn-party ${inParty ? ''btn-party--remove'' : ''btn-party--add''}`}
          onClick={onToggleParty}
          disabled={!inParty && partyFull}
          title={!inParty && partyFull ? ''Party is full (4 generals max)'' : ''''}
        >
          {inParty ? ''− Remove'' : ''+ Party''}
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
  const typeColors = { Combat: ''#c0392b'', Strategy: ''#2980b9'', Administration: ''#27ae60'' }
  return (
    <div className="skill-block">
      <div className="skill-header">
        <span className="skill-name">{skill.name_en}</span>
        <span className="skill-type" style={{ background: typeColors[skill.type] || ''#555'' }}>{skill.type}</span>
      </div>
      <div className="skill-name-jp">{skill.name_jp}</div>
      <table className="effect-table">
        <thead><tr><th>Condition</th><th>Target</th><th>Effect</th><th>Duration</th></tr></thead>
        <tbody>
          {skill.effects.map((eff, ei) => (
            <tr key={ei}>
              <td className="eff-condition">{eff.condition || ''—''}</td>
              <td className="eff-target">{eff.target}</td>
              <td className="eff-effect">{eff.effect}</td>
              <td className="eff-duration">{eff.duration || ''—''}</td>
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
            <div key={i} className={`party-slot ${member ? ''occupied'' : ''empty''}`}>
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
        <div style={{ textAlign: ''center'', marginTop: ''2rem'' }}>
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
          <button className="nav-btn active" style={{ marginTop: ''1rem'' }} onClick={goToParty}>Go to Party Builder</button>
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
  const typeColors = { Combat: ''#c0392b'', Strategy: ''#2980b9'', Administration: ''#27ae60'' }
  return (
    <div className="sim-skill-row">
      <div className="sim-skill-name-row">
        <span className="sim-skill-name">{skill.name_en}</span>
        <span className="sim-skill-name-jp">{skill.name_jp}</span>
        {showType && (
          <span className="skill-type" style={{ background: typeColors[skill.type] || ''#555'', fontSize: ''0.7rem'', padding: ''2px 8px'', marginLeft: ''6px'' }}>
            {skill.type}
          </span>
        )}
      </div>
      <table className="effect-table sim-effect-table">
        <thead><tr><th>Condition</th><th>Target</th><th>Effect</th><th>Duration</th></tr></thead>
        <tbody>
          {skill.effects.map((eff, ei) => (
            <tr key={ei}>
              <td>{eff.condition || ''—''}</td>
              <td>{eff.target}</td>
              <td>{eff.effect}</td>
              <td>{eff.duration || ''—''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

'@ -Encoding UTF8

Set-Content -Path 'src\styles\globals.css' -Value @'
/* ─── Design Tokens ──────────────────────────────────────────────────────── */
:root {
  /* Palette – ink & parchment with blood-red accent */
  --bg:           #0d0c0a;
  --bg-card:      #141210;
  --bg-card-alt:  #1a1714;
  --border:       #2e2a24;
  --border-light: #3d3830;
  --text:         #e8dcc8;
  --text-muted:   #8a7d6a;
  --text-faint:   #4d4438;
  --accent:       #c0392b;
  --accent-soft:  #9b1e12;
  --accent-glow:  rgba(192, 57, 43, 0.25);
  --gold:         #c9a84c;
  --gold-soft:    #a07c2e;

  /* Country colors */
  --qin:          #c0392b;
  --zhao:         #2980b9;
  --chu:          #8e44ad;
  --wei:          #16a085;
  --han:          #d4ac0d;
  --yan:          #1abc9c;
  --qi:           #d4ac0d;
  --ai:           #884ea0;
  --mountain_folk:#7d6608;

  /* Skill type colors */
  --combat:       #c0392b;
  --strategy:     #2980b9;
  --admin:        #27ae60;

  /* Typography */
  --font-display: ''Cinzel Decorative'', serif;
  --font-heading: ''Cinzel'', serif;
  --font-body:    ''Crimson Pro'', Georgia, serif;

  /* Spacing */
  --gap-xs: 4px;
  --gap-sm: 8px;
  --gap-md: 16px;
  --gap-lg: 24px;
  --gap-xl: 40px;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}

/* ─── Reset ───────────────────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 16px; }
body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.6;
  min-height: 100vh;
}
a { color: var(--gold); text-decoration: none; }
a:hover { text-decoration: underline; }
button { cursor: pointer; font-family: inherit; }

/* ─── App Shell ───────────────────────────────────────────────────────────── */
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* ─── Header ──────────────────────────────────────────────────────────────── */
.site-header {
  background: linear-gradient(180deg, #1a0f0a 0%, #0d0c0a 100%);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
}
.header-inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--gap-md) var(--gap-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap-md);
}
.site-title {
  display: flex;
  align-items: baseline;
  gap: var(--gap-sm);
}
.title-kanji {
  font-family: var(--font-heading);
  font-size: 0.8rem;
  color: var(--text-muted);
  letter-spacing: 0.1em;
}
.site-title h1 {
  font-family: var(--font-display);
  font-size: 1.3rem;
  color: var(--gold);
  letter-spacing: 0.05em;
  white-space: nowrap;
}
.title-sub {
  font-family: var(--font-heading);
  font-size: 0.7rem;
  color: var(--text-faint);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.site-nav {
  display: flex;
  gap: var(--gap-sm);
}
.nav-btn {
  background: transparent;
  border: 1px solid var(--border-light);
  color: var(--text-muted);
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  font-family: var(--font-heading);
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  transition: all 0.15s ease;
}
.nav-btn:hover { border-color: var(--gold-soft); color: var(--gold); }
.nav-btn.active { background: var(--accent); border-color: var(--accent); color: #fff; }

/* ─── Main Content ────────────────────────────────────────────────────────── */
.main-content {
  flex: 1;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: var(--gap-lg);
}

/* ─── Filter Bar ──────────────────────────────────────────────────────────── */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-sm);
  align-items: center;
  margin-bottom: var(--gap-lg);
  padding: var(--gap-md);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}
.search-input, .filter-select {
  background: var(--bg);
  border: 1px solid var(--border-light);
  color: var(--text);
  padding: 7px 12px;
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.15s;
}
.search-input { min-width: 200px; }
.search-input:focus, .filter-select:focus { border-color: var(--gold-soft); }
.filter-select option { background: var(--bg-card); }
.result-count {
  margin-left: auto;
  font-family: var(--font-heading);
  font-size: 0.75rem;
  color: var(--text-muted);
  letter-spacing: 0.06em;
}

/* ─── Character Grid ──────────────────────────────────────────────────────── */
.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: var(--gap-md);
}

/* ─── Character Card ──────────────────────────────────────────────────────── */
.char-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--gap-md);
  transition: border-color 0.15s, box-shadow 0.15s;
  position: relative;
}
.char-card:hover { border-color: var(--border-light); }
.char-card.in-party {
  border-color: var(--gold-soft);
  box-shadow: 0 0 12px var(--accent-glow);
}
/* Left accent bar by country */
.char-card::before {
  content: '''';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  border-radius: var(--radius-md) 0 0 var(--radius-md);
}
.char-card.country-qin::before          { background: var(--qin); }
.char-card.country-zhao::before         { background: var(--zhao); }
.char-card.country-chu::before          { background: var(--chu); }
.char-card.country-wei::before          { background: var(--wei); }
.char-card.country-han::before          { background: var(--han); }
.char-card.country-yan::before          { background: var(--yan); }
.char-card.country-qi::before           { background: var(--qi); }
.char-card.country-ai::before           { background: var(--ai); }
.char-card.country-mountain_folk::before{ background: var(--mountain_folk); }

.char-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--gap-sm);
  margin-bottom: var(--gap-xs);
}
.char-names { display: flex; flex-direction: column; }
.char-name-en {
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
}
.char-name-jp {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: 1px;
}
.char-meta { display: flex; gap: var(--gap-xs); align-items: center; flex-wrap: wrap; justify-content: flex-end; }
.country-tag {
  font-family: var(--font-heading);
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 3px;
  white-space: nowrap;
}
.country-tag--qin          { background: rgba(192,57,43,0.2);  color: #e87a70; border: 1px solid rgba(192,57,43,0.3); }
.country-tag--zhao         { background: rgba(41,128,185,0.2); color: #70b0e0; border: 1px solid rgba(41,128,185,0.3); }
.country-tag--chu          { background: rgba(142,68,173,0.2); color: #c080e0; border: 1px solid rgba(142,68,173,0.3); }
.country-tag--wei          { background: rgba(22,160,133,0.2); color: #50c0a8; border: 1px solid rgba(22,160,133,0.3); }
.country-tag--han          { background: rgba(212,172,13,0.2); color: #d4b040; border: 1px solid rgba(212,172,13,0.3); }
.country-tag--yan          { background: rgba(26,188,156,0.2); color: #50d8b8; border: 1px solid rgba(26,188,156,0.3); }
.country-tag--ai           { background: rgba(136,78,160,0.2); color: #b080c8; border: 1px solid rgba(136,78,160,0.3); }
.country-tag--mountain_folk{ background: rgba(125,102,8,0.2);  color: #c8a840; border: 1px solid rgba(125,102,8,0.3); }

.rarity-tag {
  font-family: var(--font-heading);
  font-size: 0.65rem;
  letter-spacing: 0.06em;
  padding: 2px 6px;
  border-radius: 3px;
}
.rarity-UR { background: rgba(192,57,43,0.3); color: #ff9988; border: 1px solid rgba(192,57,43,0.5); }
.rarity-SR { background: rgba(201,168,76,0.2); color: var(--gold); border: 1px solid rgba(201,168,76,0.3); }
.rarity-NR { background: rgba(100,100,100,0.2); color: var(--text-muted); border: 1px solid var(--border); }

.char-unit {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-bottom: var(--gap-sm);
  font-style: italic;
}

.char-card-actions {
  display: flex;
  gap: var(--gap-sm);
  margin-top: var(--gap-sm);
}
.btn-expand, .btn-party {
  flex: 1;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  font-family: var(--font-heading);
  font-size: 0.72rem;
  letter-spacing: 0.05em;
  border: 1px solid;
  transition: all 0.15s;
}
.btn-expand {
  background: transparent;
  border-color: var(--border-light);
  color: var(--text-muted);
}
.btn-expand:hover { border-color: var(--gold-soft); color: var(--gold); }
.btn-party--add {
  background: transparent;
  border-color: var(--accent-soft);
  color: var(--accent);
}
.btn-party--add:hover { background: var(--accent); color: #fff; }
.btn-party--remove {
  background: rgba(192,57,43,0.15);
  border-color: var(--accent);
  color: var(--accent);
}
.btn-party--remove:hover { background: var(--accent); color: #fff; }

/* ─── Skill Block ─────────────────────────────────────────────────────────── */
.skill-list { margin-top: var(--gap-md); display: flex; flex-direction: column; gap: var(--gap-md); }
.skill-block {
  background: var(--bg-card-alt);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.skill-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap-sm);
  padding: var(--gap-sm) var(--gap-md);
  border-bottom: 1px solid var(--border);
}
.skill-name {
  font-family: var(--font-heading);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text);
}
.skill-type {
  font-family: var(--font-heading);
  font-size: 0.6rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 3px;
  color: #fff;
  white-space: nowrap;
}
.skill-name-jp {
  padding: 2px var(--gap-md) var(--gap-sm);
  font-size: 0.75rem;
  color: var(--text-faint);
}
.effect-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}
.effect-table th {
  font-family: var(--font-heading);
  font-size: 0.65rem;
  letter-spacing: 0.07em;
  color: var(--text-muted);
  text-transform: uppercase;
  padding: 5px var(--gap-md);
  text-align: left;
  border-bottom: 1px solid var(--border);
  background: rgba(255,255,255,0.02);
}
.effect-table td {
  padding: 5px var(--gap-md);
  border-bottom: 1px solid rgba(255,255,255,0.03);
  vertical-align: top;
  color: var(--text);
  line-height: 1.4;
}
.effect-table tr:last-child td { border-bottom: none; }
.effect-table tr:hover td { background: rgba(255,255,255,0.02); }
.eff-condition { color: var(--text-muted); font-style: italic; }
.eff-effect { color: #e8c888; }
.eff-duration { color: var(--text-faint); white-space: nowrap; }

.pending-note {
  margin-top: var(--gap-sm);
  font-size: 0.8rem;
  color: var(--text-faint);
  font-style: italic;
}

/* ─── Party Builder ───────────────────────────────────────────────────────── */
.party-page h2, .order-page h2 {
  font-family: var(--font-heading);
  font-size: 1.4rem;
  color: var(--gold);
  letter-spacing: 0.05em;
  margin-bottom: var(--gap-sm);
}
.page-hint {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-bottom: var(--gap-lg);
}
.party-slots {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--gap-md);
  margin-bottom: var(--gap-lg);
}
.party-slot {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: var(--gap-md);
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: var(--gap-xs);
  position: relative;
}
.party-slot.empty {
  border-style: dashed;
  border-color: var(--border);
}
.party-slot.occupied {
  border-color: var(--gold-soft);
  background: rgba(201,168,76,0.05);
}
.slot-name {
  font-family: var(--font-heading);
  font-size: 0.9rem;
  color: var(--text);
}
.slot-name-jp { font-size: 0.8rem; color: var(--text-muted); }
.slot-placeholder { color: var(--text-faint); font-size: 0.8rem; }
.slot-remove {
  position: absolute;
  top: 6px; right: 8px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 0.8rem;
  padding: 2px 4px;
}
.slot-remove:hover { color: var(--accent); }

/* ─── Activation Order ────────────────────────────────────────────────────── */
.order-list { display: flex; flex-direction: column; gap: var(--gap-sm); }
.order-item {
  display: flex;
  align-items: center;
  gap: var(--gap-md);
  padding: var(--gap-sm) var(--gap-md);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}
.order-num {
  font-family: var(--font-heading);
  font-size: 0.75rem;
  color: var(--text-faint);
  min-width: 28px;
}
.order-info { display: flex; flex-wrap: wrap; gap: var(--gap-sm); align-items: center; }
.order-owner { font-size: 0.85rem; color: var(--text-muted); }
.order-skill { font-family: var(--font-heading); font-size: 0.85rem; color: var(--text); }
.order-type-badge {
  font-family: var(--font-heading);
  font-size: 0.6rem;
  padding: 2px 7px;
  border-radius: 3px;
  background: var(--bg-card-alt);
  border: 1px solid var(--border-light);
  color: var(--text-muted);
}

/* ─── Empty State ─────────────────────────────────────────────────────────── */
.empty-state {
  text-align: center;
  padding: var(--gap-xl);
  color: var(--text-muted);
  font-style: italic;
}

/* ─── Footer ──────────────────────────────────────────────────────────────── */
.site-footer {
  border-top: 1px solid var(--border);
  padding: var(--gap-md) var(--gap-lg);
  text-align: center;
  font-size: 0.75rem;
  color: var(--text-faint);
  line-height: 1.8;
}

/* ─── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .header-inner { flex-direction: column; align-items: flex-start; }
  .character-grid { grid-template-columns: 1fr; }
  .party-slots { grid-template-columns: repeat(2, 1fr); }
  .main-content { padding: var(--gap-md); }
}
@media (max-width: 480px) {
  .party-slots { grid-template-columns: 1fr; }
  .filter-bar { flex-direction: column; align-items: stretch; }
}

/* ─── Simulation / Activation Order ──────────────────────────────────────── */

.formation-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.formation-general {
  flex: 1;
  min-width: 120px;
  background: #141210;
  border: 1px solid #2e2a24;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border-top: 3px solid var(--accent);
}
.formation-general.country-qin          { border-top-color: #c0392b; }
.formation-general.country-zhao         { border-top-color: #2980b9; }
.formation-general.country-chu          { border-top-color: #8e44ad; }
.formation-general.country-wei          { border-top-color: #16a085; }
.formation-general.country-han          { border-top-color: #d4ac0d; }
.formation-general.country-yan          { border-top-color: #1abc9c; }
.formation-general.country-ai           { border-top-color: #884ea0; }
.formation-general.country-mountain_folk{ border-top-color: #7d6608; }

.formation-num       { font-size: 0.7rem; color: var(--gold); font-family: ''Cinzel'', serif; margin-bottom: 0.25rem; }
.formation-name      { font-size: 0.95rem; font-family: ''Cinzel'', serif; color: var(--text); }
.formation-name-jp   { font-size: 0.75rem; color: #8a7d6a; margin-top: 2px; }

.sim-section {
  margin-bottom: 2.5rem;
}

.sim-section-title {
  font-family: ''Cinzel'', serif;
  font-size: 1rem;
  padding: 0.6rem 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  letter-spacing: 0.05em;
}
.sim-title-strategy {
  background: rgba(41, 128, 185, 0.15);
  border-left: 4px solid #2980b9;
  color: #7fb3d3;
}
.sim-title-combat {
  background: rgba(192, 57, 43, 0.15);
  border-left: 4px solid #c0392b;
  color: #e07060;
}

.sim-empty {
  color: #8a7d6a;
  font-style: italic;
  padding: 0.75rem 1rem;
}

.sim-general-block {
  background: #141210;
  border: 1px solid #2e2a24;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  overflow: hidden;
}

.sim-general-turn {
  border-left: 3px solid #2e2a24;
}
.sim-general-turn.country-qin          { border-left-color: #c0392b; }
.sim-general-turn.country-zhao         { border-left-color: #2980b9; }
.sim-general-turn.country-chu          { border-left-color: #8e44ad; }
.sim-general-turn.country-wei          { border-left-color: #16a085; }
.sim-general-turn.country-han          { border-left-color: #d4ac0d; }
.sim-general-turn.country-yan          { border-left-color: #1abc9c; }
.sim-general-turn.country-ai           { border-left-color: #884ea0; }
.sim-general-turn.country-mountain_folk{ border-left-color: #7d6608; }

.sim-general-header {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #1a1815;
  border-bottom: 1px solid #2e2a24;
}
.sim-general-name    { font-family: ''Cinzel'', serif; font-size: 0.9rem; color: var(--gold); }
.sim-general-name-jp { font-size: 0.75rem; color: #8a7d6a; }

.sim-skill-row {
  padding: 0.6rem 0.75rem;
}
.sim-skill-name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.4rem;
}
.sim-skill-name    { font-size: 0.85rem; color: var(--text); font-weight: 600; }
.sim-skill-name-jp { font-size: 0.75rem; color: #8a7d6a; }

.sim-effect-table {
  font-size: 0.8rem;
}

.sim-normal-attack {
  padding: 0.6rem 0.75rem;
  color: #8a7d6a;
  font-style: italic;
  font-size: 0.85rem;
}

/* Turn blocks */
.sim-turn-block {
  margin-bottom: 1.5rem;
}
.sim-turn-header {
  font-family: ''Cinzel'', serif;
  font-size: 0.85rem;
  color: var(--gold);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.4rem 0.75rem;
  background: #1a1815;
  border: 1px solid #2e2a24;
  border-radius: 6px 6px 0 0;
  border-bottom: none;
}
.sim-turn-generals {
  border: 1px solid #2e2a24;
  border-radius: 0 0 8px 8px;
  overflow: hidden;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1px;
  background: #2e2a24;
}
.sim-turn-generals > .sim-general-block {
  margin: 0;
  border: none;
  border-radius: 0;
}

/* Party slots */
.slot-num        { font-family: ''Cinzel'', serif; font-size: 0.7rem; color: var(--gold); margin-right: 0.5rem; flex-shrink: 0; }
.slot-names      { display: flex; flex-direction: column; flex: 1; }
.slot-name       { font-size: 0.9rem; color: var(--text); }
.slot-name-jp    { font-size: 0.75rem; color: #8a7d6a; }

.btn-party:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* ─── Character Images ────────────────────────────────────────────────────── */

.char-image-wrap {
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: 6px 6px 0 0;
  background: #0d0c0a;
}

.char-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
  display: block;
  transition: transform 0.2s ease;
}

.char-card:hover .char-image {
  transform: scale(1.04);
}

.formation-img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  object-position: top center;
  border: 2px solid #2e2a24;
  margin-bottom: 4px;
}

'@ -Encoding UTF8

Set-Content -Path 'data\characters\zhao_major.json' -Value @'
[
  {
    "id": "riboku",
    "name_en": "Riboku",
    "name_jp": "李牧",
    "country": "zhao",
    "rarity": "UR",
    "skills": [
      {
        "name_en": "Fierce General Flash [Green Turtle]",
        "name_jp": "猛将一閃【緑亀】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Per ally cavalry general",
            "target": "Self",
            "effect": "DEF Up 10%",
            "duration": "3 turns"
          },
          {
            "condition": "When Attacking",
            "target": "Self",
            "effect": "ATK Up 20%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Strategist''s Expertise",
        "name_jp": "参謀の手腕",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Other ally Zhao / Wei / Chu / Han / Yan",
            "effect": "DEF Up 20%",
            "duration": null
          },
          {
            "condition": "Surviving",
            "target": "Other ally Zhao / Wei / Chu / Han / Yan",
            "effect": "HP Recovery 10%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Master of Defensive Warfare",
        "name_jp": "守戦の名将",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Houken",
            "effect": "Attack Nullification",
            "duration": "1 time"
          },
          {
            "condition": null,
            "target": "Other ally Zhao / Wei / Chu / Han / Yan",
            "effect": "Morale Recovery 10%",
            "duration": null
          },
          {
            "condition": "When Garrisoning, enemy general with highest remaining HP",
            "target": "1 enemy general",
            "effect": "% of Remaining HP Damage 20%",
            "duration": null
          },
          {
            "condition": "When Garrisoning, from % HP Damage",
            "target": "Self",
            "effect": "HP Drain 100%",
            "duration": null
          },
          {
            "condition": "When Garrisoning, enemy war machine with lowest remaining HP",
            "target": "1 enemy war machine",
            "effect": "180% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/riboku.webp"
  },
  {
    "id": "houken",
    "name_en": "Houken",
    "name_jp": "龐煖",
    "country": "zhao",
    "rarity": "UR",
    "skills": [
      {
        "name_en": "Fierce General Flash [Blue Turtle]",
        "name_jp": "猛将一閃【青亀】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Own HP ≥ 70%",
            "target": "Self",
            "effect": "ATK Up / DEF Up 30%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Incarnation of Martial Arts",
        "name_jp": "武の化身",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Self vs Qin",
            "effect": "ATK Up 20%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Self vs archers",
            "effect": "DEF Up 40%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Self",
            "effect": "Evasion Rate Up 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Strike of Despair",
        "name_jp": "絶望の一撃",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Self vs Six Great Generals",
            "effect": "ATK Up 40%",
            "duration": "3 turns"
          },
          {
            "condition": null,
            "target": "All enemy generals",
            "effect": "90% Damage",
            "duration": null
          },
          {
            "condition": "Own HP < 100%",
            "target": "Self",
            "effect": "HP Recovery 40%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/houken.webp"
  },
  {
    "id": "kaine",
    "name_en": "Kaine",
    "name_jp": "カイネ",
    "country": "zhao",
    "unit": "Riboku Forces",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Fierce General Flash [Red Sheep]",
        "name_jp": "猛将一閃【赤羊】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Self / ally shield soldiers",
            "effect": "DEF Up 20%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Lieutenant''s Wisdom",
        "name_jp": "側近の心得",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Zhao",
            "effect": "Critical Rate Up / Hit Rate Up 20%",
            "duration": null
          },
          {
            "condition": "When ally Riboku is present",
            "target": "Ally Zhao",
            "effect": "Max Morale Up 50%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Escort''s Role",
        "name_jp": "護衛の役割",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "170% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Self / ally shield soldiers",
            "effect": "Guard 60%",
            "duration": "1 time"
          },
          {
            "condition": "When ally Riboku is alive",
            "target": "Ally Zhao",
            "effect": "Evasion Rate Up 20%",
            "duration": "3 turns"
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/kaine.webp"
  },
  {
    "id": "mangoku",
    "name_en": "Mangoku",
    "name_jp": "万極",
    "country": "zhao",
    "rarity": "UR",
    "skills": [
      {
        "name_en": "Heavy Pursuit [Orange Bull]",
        "name_jp": "重追撃【橙牛】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest remaining HP",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "The lower own remaining HP",
            "target": "Self",
            "effect": "ATK Up (max 50%)",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "HP Enhancement – Large [Attack War Machines]",
        "name_jp": "体力強化・大【攻撃兵器】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally attack war machines",
            "effect": "Max HP Up 12.3%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Marsh Terrain Aptitude – Large Improved",
        "name_jp": "泥濘適性・大改",
        "type": "Administration",
        "effects": [
          {
            "condition": "When passing terrain [Marsh] (active even when not deployed)",
            "target": "Passing squad",
            "effect": "Damage Taken Increase Resistance 16.6%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/mangoku.webp"
  },
  {
    "id": "choso",
    "name_en": "Chousou",
    "name_jp": "趙荘",
    "country": "zhao",
    "rarity": "NR",
    "skills": [
      {
        "name_en": "DEF Enhancement [Orange Sheep]",
        "name_jp": "防御強化【橙羊】",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Other ally cavalry / ally shield soldiers",
            "effect": "DEF Up 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Squad Protection – Large",
        "name_jp": "部隊保護・大",
        "type": "Administration",
        "effects": [
          {
            "condition": "When passing terrain [Ambush] (active even when not deployed)",
            "target": "Passing squad",
            "effect": "Squad Damage Reduction 2.7%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "HP Enhancement – Large Improved [Cavalry]",
        "name_jp": "体力強化・大改【騎兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally cavalry",
            "effect": "Max HP Up 18.2%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/chousou.webp"
  },
  {
    "id": "chouko",
    "name_en": "Chouko",
    "name_jp": "趙高",
    "country": "zhao",
    "rarity": "NR",
    "skills": [
      {
        "name_en": "ATK Enhancement [Red Bull]",
        "name_jp": "攻撃強化【赤牛】",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally archers",
            "effect": "ATK Up 20%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Other ally generals",
            "effect": "Poison Infliction Rate Up / Betrayal Infliction Rate Up 25%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Repair Ore Reduction – Small",
        "name_jp": "修理鉱石減少・小",
        "type": "Administration",
        "effects": [
          {
            "condition": "When repairing Souha war machines",
            "target": "War machine repair",
            "effect": "Ore Cost Down 2%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Repair Material Reduction – Small Improved",
        "name_jp": "修理資材減少・小改",
        "type": "Administration",
        "effects": [
          {
            "condition": "When repairing Souha war machines",
            "target": "War machine repair",
            "effect": "Material Cost Down 4.6%",
            "duration": null
          }
        ]
      }
    ]
  },
  {
    "id": "seika",
    "name_en": "Seikai",
    "name_jp": "成恢",
    "country": "han",
    "rarity": "UR",
    "skills": [
      {
        "name_en": "Iron Wall Flash [Orange Tiger]",
        "name_jp": "鉄壁一閃【橙虎】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest DEF",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Enemy general with highest DEF",
            "target": "3 enemy generals",
            "effect": "Poison Infliction 50%",
            "duration": "4 turns"
          },
          {
            "condition": "When Attacking",
            "target": "Ally archers",
            "effect": "DEF Up 20%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Efficient Tactics",
        "name_jp": "効率的戦術",
        "type": "Combat",
        "effects": [
          {
            "condition": "Own HP ≥ 90%, enemy general with highest DEF",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Own HP ≥ 90%, poisoned enemy general with highest remaining HP",
            "target": "1 poisoned enemy general",
            "effect": "100% Damage",
            "duration": null
          },
          {
            "condition": "Own HP < 90%, enemy general with highest DEF",
            "target": "2 enemy generals",
            "effect": "90% Damage",
            "duration": null
          },
          {
            "condition": "Own HP < 90%, from damage",
            "target": "Self",
            "effect": "HP Drain 60%",
            "duration": null
          },
          {
            "condition": "Own HP < 90%, poisoned enemies present",
            "target": "All poisoned enemy generals",
            "effect": "80% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Research Results",
        "name_jp": "研究の成果",
        "type": "Combat",
        "effects": [
          {
            "condition": "Own HP ≥ 90%, enemy general with highest DEF",
            "target": "1 enemy general",
            "effect": "160% Damage",
            "duration": null
          },
          {
            "condition": "Own HP ≥ 90%, enemy general with highest remaining HP",
            "target": "1 enemy general",
            "effect": "Poison Infliction",
            "duration": "2 turns"
          },
          {
            "condition": "Own HP < 90%",
            "target": "Enemy generals",
            "effect": "70% Damage",
            "duration": null
          },
          {
            "condition": "Own HP < 90%, from damage",
            "target": "Self",
            "effect": "HP Drain 60%",
            "duration": null
          },
          {
            "condition": "Own HP < 90%",
            "target": "Enemy generals",
            "effect": "Poison Infliction 40%",
            "duration": "2 turns"
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/seikai.webp"
  }
]
'@ -Encoding UTF8

Set-Content -Path 'data\characters\other_states.json' -Value @'
[
  {
    "id": "kyobou",
    "name_en": "Kyoubou",
    "name_jp": "巨暴",
    "country": "chu",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Enemy General Sweep [Red Elephant]",
        "name_jp": "敵将一掃【赤象】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Other ally Chu members alive",
            "target": "All enemy generals",
            "effect": "Morale Down 10%",
            "duration": null
          },
          {
            "condition": null,
            "target": "All enemy generals",
            "effect": "100% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Encroaching Violence",
        "name_jp": "迫る暴力",
        "type": "Combat",
        "effects": [
          {
            "condition": "Other ally Chu members alive",
            "target": "All enemy generals",
            "effect": "Morale Down 20%",
            "duration": null
          },
          {
            "condition": null,
            "target": "All enemy generals",
            "effect": "110% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Massive Army",
        "name_jp": "巨なる軍勢",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Self",
            "effect": "Hit Rate Up 50%",
            "duration": "3 turns"
          },
          {
            "condition": "Per other ally Chu member",
            "target": "Ally Chu",
            "effect": "ATK Up 10%",
            "duration": "3 turns"
          },
          {
            "condition": null,
            "target": "All enemy generals",
            "effect": "120% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/kyoubou.webp"
  },
  {
    "id": "gotoku",
    "name_en": "Goutoku",
    "name_jp": "豪徳",
    "country": "chu",
    "unit": "Karin Forces",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Fierce General Flash [Gray Turtle]",
        "name_jp": "猛将一閃【灰亀】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Karin",
            "effect": "Attack Nullification",
            "duration": "1 time"
          }
        ]
      },
      {
        "name_en": "Female Hero''s Escort",
        "name_jp": "女傑の護衛",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Karin",
            "effect": "Max HP Up 100%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Karin",
            "effect": "Illusion Infliction Rate Up 50%",
            "duration": null
          },
          {
            "condition": "When enemy generals have Illusion status",
            "target": "Ally Karin Forces",
            "effect": "ATK Up 30%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Immediate Response on Command",
        "name_jp": "思伝即応",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "170% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Karin Forces",
            "effect": "Attack Nullification",
            "duration": "1 time"
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/goutoku.webp"
  },
  {
    "id": "rien",
    "name_en": "Rien",
    "name_jp": "李園",
    "country": "chu",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Fierce General Flash [Black Sheep]",
        "name_jp": "猛将一閃【黒羊】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Enemy cavalry",
            "effect": "Normal Attack Seal 50%",
            "duration": "2 turns"
          }
        ]
      },
      {
        "name_en": "Rebuilding Great Chu",
        "name_jp": "大国楚の再建",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Chu",
            "effect": "ATK Up 20%",
            "duration": null
          },
          {
            "condition": "When Attacking",
            "target": "Surviving ally Chu",
            "effect": "HP Recovery 10%",
            "duration": null
          },
          {
            "condition": "When Attacking",
            "target": "Surviving ally Chu",
            "effect": "Morale Recovery 5%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Shadow Maneuver",
        "name_jp": "暗躍する影",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "170% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Enemy cavalry",
            "effect": "HP Recovery Nullification 100%",
            "duration": "4 turns"
          },
          {
            "condition": "Other ally Chu generals alive",
            "target": "Enemy cavalry",
            "effect": "Skill Attack Seal 50%",
            "duration": "2 turns"
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/rien.webp"
  },
  {
    "id": "rokin",
    "name_en": "Rokin",
    "name_jp": "魯近",
    "country": "chu",
    "unit": "Rinbujun Forces (Coalition)",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Weak Point Flash [Yellow Tiger]",
        "name_jp": "急所一閃【黄虎】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest DEF",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Coalition Forces",
            "effect": "HP Recovery 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "First General''s Loyal Retainer",
        "name_jp": "第一将の忠臣",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Rinbujun",
            "effect": "Status Effect Immunity (excl. Provoke)",
            "duration": "3 times"
          },
          {
            "condition": null,
            "target": "Ally Rinbujun",
            "effect": "Sure Hit",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Lieutenant''s Pride",
        "name_jp": "副官の矜持",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Rinbujun",
            "effect": "DEF Up 30%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Rinbujun",
            "effect": "Guard 100%",
            "duration": "2 times"
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/rokin.webp"
  },
  {
    "id": "chouin",
    "name_en": "Chouin",
    "name_jp": "張印",
    "country": "han",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Weak Point Flash [Yellow Turtle]",
        "name_jp": "急所一閃【黄亀】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest DEF",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "From the 150% Damage",
            "target": "Self",
            "effect": "HP Drain 100%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Han",
            "effect": "Guard 60%",
            "duration": "1 time"
          },
          {
            "condition": "Poisoned enemy with highest remaining HP",
            "target": "1 poisoned enemy general",
            "effect": "% of Remaining HP Damage 20%",
            "duration": null
          },
          {
            "condition": "From the % HP Damage",
            "target": "Self",
            "effect": "HP Drain 100%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Acting Commander-in-Chief of Han",
        "name_jp": "韓国軍総大将代理",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Han",
            "effect": "Sure Hit",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Successor''s Duty",
        "name_jp": "後任の責務",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Ally Han",
            "effect": "Attack Nullification",
            "duration": "1 time"
          },
          {
            "condition": "Poisoned enemies present",
            "target": "All poisoned enemy generals",
            "effect": "HP Recovery Nullification 70%",
            "duration": "3 turns"
          },
          {
            "condition": "Enemy general with lowest DEF",
            "target": "1 enemy general",
            "effect": "170% Damage",
            "duration": null
          },
          {
            "condition": "From the 170% Damage",
            "target": "Self",
            "effect": "HP Drain 100%",
            "duration": null
          },
          {
            "condition": "Poisoned enemy with highest remaining HP",
            "target": "1 poisoned enemy general",
            "effect": "% of Remaining HP Damage 20%",
            "duration": null
          },
          {
            "condition": "From the % HP Damage",
            "target": "Self",
            "effect": "HP Drain 100%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/chouin.webp"
  },
  {
    "id": "nako",
    "name_en": "Nakon",
    "name_jp": "奈棍",
    "country": "han",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Weak Point Flash [Yellow Bull]",
        "name_jp": "急所一閃【黄牛】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest DEF",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "From the 150% Damage",
            "target": "Self",
            "effect": "HP Drain 100%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Han Army Defense Commander",
        "name_jp": "韓国軍守備長",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Han",
            "effect": "HP Recovery Rate Up 20%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Han",
            "effect": "DEF Up 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Eroding Disease",
        "name_jp": "浸蝕する病",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "Skill Attack Seal 50%",
            "duration": "2 turns"
          },
          {
            "condition": "All poisoned enemy generals",
            "target": "All poisoned enemy generals",
            "effect": "Skill Attack Seal 70%",
            "duration": "2 turns"
          },
          {
            "condition": "Enemy general with lowest DEF",
            "target": "1 enemy general",
            "effect": "170% Damage",
            "duration": null
          },
          {
            "condition": "From the 170% Damage",
            "target": "Self",
            "effect": "HP Drain 100%",
            "duration": null
          },
          {
            "condition": "Poisoned enemy with highest remaining HP",
            "target": "1 poisoned enemy general",
            "effect": "% of Remaining HP Damage 20%",
            "duration": null
          },
          {
            "condition": "From the % HP Damage",
            "target": "Self",
            "effect": "HP Drain 100%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/nakon.webp"
  },
  {
    "id": "bakan",
    "name_en": "Bakan",
    "name_jp": "馬関",
    "country": "han",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Weak Point Flash [Yellow Bull]",
        "name_jp": "急所一閃【黄牛】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest DEF",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "From the 150% Damage",
            "target": "Self",
            "effect": "HP Drain 100%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Han Army Two-Thousand Commander",
        "name_jp": "韓国軍二千人将",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Han",
            "effect": "HP Recovery Rate Up 20%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Han",
            "effect": "Morale Cost Down 30%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Corroding Pursuit",
        "name_jp": "蝕む追撃",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "Normal Attack Seal 50%",
            "duration": "4 turns"
          },
          {
            "condition": null,
            "target": "All poisoned enemy generals",
            "effect": "Normal Attack Seal 70%",
            "duration": "4 turns"
          },
          {
            "condition": "Enemy general with lowest DEF",
            "target": "1 enemy general",
            "effect": "170% Damage",
            "duration": null
          },
          {
            "condition": "From the 170% Damage",
            "target": "Self",
            "effect": "HP Drain 100%",
            "duration": null
          },
          {
            "condition": "Poisoned enemy with highest remaining HP",
            "target": "1 poisoned enemy general",
            "effect": "% of Remaining HP Damage 20%",
            "duration": null
          },
          {
            "condition": "From the % HP Damage",
            "target": "Self",
            "effect": "HP Drain 100%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/bakan.webp"
  },
  {
    "id": "tairoji",
    "name_en": "Tairoji",
    "name_jp": "太呂慈",
    "country": "wei",
    "rarity": "UR",
    "skills": [
      {
        "name_en": "Fierce General Flash [Black Elephant]",
        "name_jp": "猛将一閃【黒象】",
        "type": "Combat",
        "effects": [
          {
            "condition": "When Attacking, enemy with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "When Garrisoning, enemy with highest remaining HP",
            "target": "1 enemy general",
            "effect": "% of Remaining HP Damage 20%",
            "duration": null
          },
          {
            "condition": "When Garrisoning, % HP Damage triggered",
            "target": "Self",
            "effect": "HP Drain 100%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Wei",
            "effect": "Morale Recovery 5%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Wei Grand General",
        "name_jp": "魏国大将軍",
        "type": "Strategy",
        "effects": [
          {
            "condition": "When Attacking",
            "target": "Ally Wei",
            "effect": "Status Effect Immunity (excl. Provoke)",
            "duration": "2 times"
          },
          {
            "condition": "When Attacking",
            "target": "Ally Wei",
            "effect": "Critical Rate Up 20%",
            "duration": null
          },
          {
            "condition": "When Garrisoning",
            "target": "Ally Wei",
            "effect": "Guard 60%",
            "duration": "1 time"
          },
          {
            "condition": "When Garrisoning",
            "target": "Enemy generals",
            "effect": "Critical Rate Down 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Judgment Strike",
        "name_jp": "断罪の一撃",
        "type": "Combat",
        "effects": [
          {
            "condition": "When Attacking",
            "target": "Ally Wei",
            "effect": "ATK Up 20%",
            "duration": "4 turns"
          },
          {
            "condition": "When Attacking, enemy with highest ATK",
            "target": "1 enemy general",
            "effect": "180% Damage",
            "duration": null
          },
          {
            "condition": "When Garrisoning",
            "target": "Self",
            "effect": "Provoke",
            "duration": "2 turns"
          },
          {
            "condition": "When Garrisoning",
            "target": "Self",
            "effect": "DEF Up 30%",
            "duration": "4 turns"
          },
          {
            "condition": "When Garrisoning",
            "target": "Enemy generals",
            "effect": "100% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Wei",
            "effect": "Continuous HP Recovery 8%",
            "duration": "4 turns"
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/tairoji.webp"
  },
  {
    "id": "otaji",
    "name_en": "Otaji",
    "name_jp": "オタジ",
    "country": "yan",
    "unit": "Ordo Forces",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Iron Wall Flash [Green Turtle]",
        "name_jp": "鉄壁一閃【緑亀】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Own HP < 100%, enemy with highest DEF",
            "target": "1 enemy general",
            "effect": "80% Damage",
            "duration": null
          },
          {
            "condition": "Own HP < 50%, enemy with highest DEF",
            "target": "1 enemy general",
            "effect": "100% Damage",
            "duration": null
          },
          {
            "condition": "Enemy with highest DEF",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Mountain Ambush",
        "name_jp": "山岳強襲",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Yan",
            "effect": "Max Morale Up 50%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Ordo",
            "effect": "DEF Penetration Up / Confusion Infliction Rate Up 30%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Elite Relentless Pursuers",
        "name_jp": "窮追する精兵",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Ally Yan",
            "effect": "Hit Rate Up 30%",
            "duration": "4 turns"
          },
          {
            "condition": "Per other ally Yan member",
            "target": "Ally Yan",
            "effect": "ATK Up 10%",
            "duration": "3 turns"
          },
          {
            "condition": "Enemy with highest DEF",
            "target": "1 enemy general",
            "effect": "170% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/otaji.webp"
  },
  {
    "id": "budai",
    "name_en": "Budai",
    "name_jp": "ブダイ",
    "country": "ai",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Iron Wall Flash [Green Tiger]",
        "name_jp": "鉄壁一閃【緑虎】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy with highest DEF",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "When Attacking",
            "target": "Ally Ai",
            "effect": "Guard 60%",
            "duration": "1 time"
          }
        ]
      },
      {
        "name_en": "Inherited Grudge",
        "name_jp": "継ぎし怨恨",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Ai",
            "effect": "Max HP Up 50%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Juutekkō",
            "effect": "Confusion Infliction Rate Up 20%",
            "duration": null
          },
          {
            "condition": "Enemy Qin alive, surviving ally Ai",
            "target": "Ally Ai",
            "effect": "HP Recovery 30%",
            "duration": null
          },
          {
            "condition": "When Attacking",
            "target": "Ally cavalry",
            "effect": "DEF Up 40%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Dying Flame",
        "name_jp": "残火",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy with highest DEF",
            "target": "1 enemy general",
            "effect": "170% Damage",
            "duration": null
          },
          {
            "condition": "Enemy Qin alive, surviving ally Ai",
            "target": "Ally Ai",
            "effect": "HP Recovery 30%",
            "duration": null
          },
          {
            "condition": "When Attacking",
            "target": "Ally Ai",
            "effect": "Guard 60%",
            "duration": "1 time"
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/budai.webp"
  },
  {
    "id": "hamui",
    "name_en": "Hamui",
    "name_jp": "ハムイ",
    "country": "ai",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Fierce General Flash [Gray Bull]",
        "name_jp": "猛将一閃【灰牛】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Qin enemy with highest ATK",
            "target": "1 Qin enemy",
            "effect": "100% Damage",
            "duration": null
          },
          {
            "condition": "Enemy with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Right Hand of the Wategi King",
        "name_jp": "戎翟王の右腕",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Ai",
            "effect": "Max HP Up 50%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally [?]",
            "effect": "Confusion Infliction Rate Up 20%",
            "duration": null
          },
          {
            "condition": "When enemy Qin generals are alive",
            "target": "Surviving ally Ai",
            "effect": "Morale Recovery 20%",
            "duration": null
          },
          {
            "condition": "When Attacking, when enemy Qin alive",
            "target": "Ally cavalry",
            "effect": "Evasion Rate Up 30%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Guerrilla Charge",
        "name_jp": "遊撃突貫",
        "type": "Combat",
        "effects": [
          {
            "condition": "When Attacking",
            "target": "Ally Ai",
            "effect": "ATK Up 20%",
            "duration": "4 turns"
          },
          {
            "condition": "Qin enemy with highest ATK",
            "target": "1 Qin enemy",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Enemy with highest ATK",
            "target": "1 enemy general",
            "effect": "170% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/hamui.webp"
  }
]
'@ -Encoding UTF8

Set-Content -Path 'data\characters\yan.json' -Value @'
[
  {
    "id": "otaji",
    "name_en": "Otaji",
    "name_jp": "オタジ",
    "country": "yan",
    "unit": "Ordo Forces",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Iron Wall Flash [Green Turtle]",
        "name_jp": "鉄壁一閃【緑亀】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Own HP < 100%, enemy general with highest DEF",
            "target": "1 enemy general",
            "effect": "80% Damage",
            "duration": null
          },
          {
            "condition": "Own HP < 50%, enemy general with highest DEF",
            "target": "1 enemy general",
            "effect": "100% Damage",
            "duration": null
          },
          {
            "condition": "Enemy general with highest DEF",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Mountain Ambush",
        "name_jp": "山岳強襲",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Yan",
            "effect": "Max Morale Up 50%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Ordo",
            "effect": "DEF Penetration Up / Confusion Infliction Rate Up 30%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Elite Relentless Pursuers",
        "name_jp": "窮追する精兵",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Ally Yan",
            "effect": "Hit Rate Up 30%",
            "duration": "4 turns"
          },
          {
            "condition": "Per other ally Yan member",
            "target": "Ally Yan",
            "effect": "ATK Up 10%",
            "duration": "3 turns"
          },
          {
            "condition": "Enemy general with highest DEF",
            "target": "1 enemy general",
            "effect": "170% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/otaji.webp"
  },
  {
    "id": "yukii",
    "name_en": "Yukii",
    "name_jp": "ユキイ",
    "country": "yan",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Iron Wall Flash [Green Bull]",
        "name_jp": "鉄壁一閃【緑牛】",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Enemy shield soldiers",
            "effect": "30% Damage",
            "duration": null
          },
          {
            "condition": "Enemy general with highest DEF",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Enemy shield soldiers",
            "effect": "Confusion Infliction 10%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Mountain King''s Right Arm",
        "name_jp": "山岳王の片腕",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Yan",
            "effect": "DEF Up 20%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally generals",
            "effect": "Confusion Infliction Rate Up 10%",
            "duration": null
          },
          {
            "condition": "When Attacking",
            "target": "Ally archers vs shield soldiers",
            "effect": "ATK Up 30%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Simultaneous Volley",
        "name_jp": "一斉射撃",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Ally archers",
            "effect": "DEF Penetration Up 20%",
            "duration": "2 turns"
          },
          {
            "condition": null,
            "target": "Enemy shield soldiers",
            "effect": "2-Hit 30% Damage",
            "duration": null
          },
          {
            "condition": "Enemy general with highest DEF",
            "target": "1 enemy general",
            "effect": "180% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/yukii.webp"
  },
  {
    "id": "rakki",
    "name_en": "Gakuki",
    "name_jp": "楽毅",
    "country": "yan",
    "rarity": "UR",
    "skills": [
      {
        "name_en": "Fierce General Flash [Green Sheep]",
        "name_jp": "猛将一閃【緑羊】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Other ally cavalry",
            "effect": "DEF Up 20%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Hero Who Saved the Nation",
        "name_jp": "救国の英傑",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Qin / Zhao / Wei / Chu / Han / Yan",
            "effect": "Critical Damage Up / Hit Rate Up 30%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Counter-Offensive",
        "name_jp": "反転攻勢",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Ally Yan",
            "effect": "ATK Up 20%",
            "duration": "3 turns"
          },
          {
            "condition": "Own HP < 100%",
            "target": "Ally Yan",
            "effect": "Critical Rate Up 10%",
            "duration": "3 turns"
          },
          {
            "condition": "Own HP < 50%",
            "target": "Enemy generals",
            "effect": "100% Damage",
            "duration": null
          },
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "170% Damage",
            "duration": null
          },
          {
            "condition": "From the 170% Damage",
            "target": "Self",
            "effect": "HP Drain 50%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/gakuki.webp"
  },
  {
    "id": "gekishin",
    "name_en": "Gekishin",
    "name_jp": "劇辛",
    "country": "yan",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Fierce General Flash [Blue Tiger]",
        "name_jp": "猛将一閃【青虎】",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Self",
            "effect": "ATK Up / Critical Rate Up 20%",
            "duration": "3 turns"
          },
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Situation Analysis",
        "name_jp": "状況分析",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Yan",
            "effect": "Evasion Rate Up 20%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally cavalry",
            "effect": "Max HP Up 30%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Overcoming Adversity",
        "name_jp": "逆境突破",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Self",
            "effect": "Guard 60%",
            "duration": "1 time"
          },
          {
            "condition": "Own HP < 100%",
            "target": "Ally Yan",
            "effect": "Critical Rate Up 10%",
            "duration": "3 turns"
          },
          {
            "condition": "Own HP < 50%",
            "target": "Ally Yan",
            "effect": "Attack Nullification",
            "duration": "1 time"
          },
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "170% Damage",
            "duration": null
          },
          {
            "condition": "From the 170% Damage",
            "target": "Self",
            "effect": "HP Drain 50%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/gekishin.webp"
  }
]
'@ -Encoding UTF8

Set-Content -Path 'data\characters\qin.json' -Value @'
[
  {
    "id": "akou",
    "name_en": "Akou",
    "name_jp": "亜光",
    "country": "qin",
    "unit": "Ousen Forces",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Heavy Pursuit [Blue Sheep]",
        "name_jp": "重追撃【青羊】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy archer with lowest remaining HP",
            "target": "1 enemy archer",
            "effect": "100% Damage",
            "duration": null
          },
          {
            "condition": "Enemy general with lowest remaining HP",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "First General of Ousen''s Forces",
        "name_jp": "王翦軍第一将",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Self",
            "effect": "Sure Hit",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Qin",
            "effect": "DEF Down Resistance 30%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Ousen Forces",
            "effect": "Status Effect Immunity (excl. Provoke)",
            "duration": "1 time"
          }
        ]
      },
      {
        "name_en": "Frontal Breakthrough",
        "name_jp": "正面突破",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Self",
            "effect": "ATK Up 40%",
            "duration": "2 turns"
          },
          {
            "condition": "Enemy archer with lowest remaining HP",
            "target": "1 enemy archer",
            "effect": "2-Hit 100% Damage",
            "duration": null
          },
          {
            "condition": "Enemy general with lowest remaining HP",
            "target": "1 enemy general",
            "effect": "180% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/akou.webp"
  },
  {
    "id": "denrimi",
    "name_en": "Denrimi",
    "name_jp": "田里弥",
    "country": "qin",
    "unit": "Ousen Forces",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Iron Wall Flash [Blue Sheep]",
        "name_jp": "鉄壁一閃【青羊】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest DEF",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Qin",
            "effect": "Guard 60%",
            "duration": "1 time"
          }
        ]
      },
      {
        "name_en": "Changshan Snake Formation",
        "name_jp": "常山蛇勢",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Qin",
            "effect": "DEF Up 20%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally cavalry",
            "effect": "DEF Up vs Archers 20%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally archers",
            "effect": "DEF Up vs Shield Soldiers 20%",
            "duration": null
          },
          {
            "condition": "Ally shield soldiers",
            "target": "Ally shield soldiers",
            "effect": "DEF Up vs Cavalry 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Firm Defense, Wise Action",
        "name_jp": "堅守賢明",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest DEF",
            "target": "1 enemy general",
            "effect": "180% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Qin",
            "effect": "Guard 60%",
            "duration": "1 time"
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/denrimi.webp"
  },
  {
    "id": "youka",
    "name_en": "Youka",
    "name_jp": "姚賈",
    "country": "qin",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Defense Reduction [Red Elephant]",
        "name_jp": "防御低下【赤象】",
        "type": "Strategy",
        "effects": [
          {
            "condition": "Enemy general with lowest DEF",
            "target": "1 enemy general",
            "effect": "DEF Down 50%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Self",
            "effect": "Less Likely to be Targeted",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Four-Way Sabotage",
        "name_jp": "四重工作",
        "type": "Combat",
        "effects": [
          {
            "condition": "Zhao, Wei, Chu, Qi enemy with highest ATK",
            "target": "1 each of Zhao/Wei/Chu/Qi enemy",
            "effect": "Betrayal Infliction 65%",
            "duration": "4 turns"
          },
          {
            "condition": "Enemy general with lowest remaining HP",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "ATK Enhancement – Special Large Improved [Infantry]",
        "name_jp": "攻撃力強化・特大改【歩兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally infantry",
            "effect": "ATK Up 12.4%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/youka.webp"
  },
  {
    "id": "keirei",
    "name_en": "Kyourei",
    "name_jp": "京令",
    "country": "qin",
    "rarity": "NR",
    "skills": [
      {
        "name_en": "HP Recovery [Red Sheep]",
        "name_jp": "体力回復【赤羊】",
        "type": "Strategy",
        "effects": [
          {
            "condition": "Surviving",
            "target": "Ally Qin",
            "effect": "HP Recovery 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Medical Framework",
        "name_jp": "医療の枠",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Qin",
            "effect": "Max HP Up 50%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Qin",
            "effect": "Poison Resistance / Burn Resistance / Paralysis Resistance 100%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "DEF Enhancement – Large Improved [Infantry]",
        "name_jp": "防御力強化・大改【歩兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally infantry",
            "effect": "DEF Up 9.9%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/kyourei.webp"
  },
  {
    "id": "romin",
    "name_en": "Robin",
    "name_jp": "呂敏",
    "country": "qin",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Weak General Flash",
        "name_jp": "弱将一閃",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Enemy cavalry",
            "effect": "ATK Down 20%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Versatile Movement",
        "name_jp": "縦横自在",
        "type": "Combat",
        "effects": [
          {
            "condition": "Other ally Hi Shin Unit member alive",
            "target": "All enemy generals",
            "effect": "Critical Rate Down 20%",
            "duration": "2 turns"
          },
          {
            "condition": "Other ally Kanki Forces member alive",
            "target": "All enemy generals",
            "effect": "Critical Damage Down 20%",
            "duration": "2 turns"
          },
          {
            "condition": "Enemy general with lowest remaining HP",
            "target": "1 enemy general",
            "effect": "170% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Closing Ambush",
        "name_jp": "詰めの奇襲",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Self",
            "effect": "Sure Hit",
            "duration": null
          },
          {
            "condition": "Per other ally Hi Shin Unit member",
            "target": "All ally generals",
            "effect": "ATK Up 10%",
            "duration": null
          },
          {
            "condition": "Per other ally Kanki Forces member",
            "target": "All enemy generals",
            "effect": "DEF Down 10%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/robin.webp"
  },
  {
    "id": "kakuun",
    "name_en": "Kakuun",
    "name_jp": "角雲",
    "country": "qin",
    "unit": "Kanki Forces",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Attack Reduction [Red Bull]",
        "name_jp": "攻撃低下【赤牛】",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "All enemy generals",
            "effect": "ATK Down 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Cornerstone of Defense",
        "name_jp": "守りの要",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy war machine with lowest DEF",
            "target": "1 enemy war machine",
            "effect": "100% Damage",
            "duration": null
          },
          {
            "condition": "Enemy general with lowest DEF",
            "target": "1 enemy general",
            "effect": "160% Damage",
            "duration": null
          },
          {
            "condition": "When Garrisoning",
            "target": "Ally Kanki Forces",
            "effect": "DEF Up 20%",
            "duration": "4 turns"
          }
        ]
      },
      {
        "name_en": "Immovable Guardian",
        "name_jp": "不動の守護",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Ally Kanki Forces",
            "effect": "Hit Rate Up 30%",
            "duration": "4 turns"
          },
          {
            "condition": "Enemy war machine with lowest DEF",
            "target": "1 enemy war machine",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Enemy general with lowest DEF",
            "target": "1 enemy general",
            "effect": "170% Damage",
            "duration": null
          },
          {
            "condition": "When Garrisoning",
            "target": "Enemy Zhao / Enemy Wei",
            "effect": "Critical Rate Down 40%",
            "duration": "3 turns"
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/kakuun.webp"
  },
  {
    "id": "bain",
    "name_en": "Bain",
    "name_jp": "馬印",
    "country": "qin",
    "unit": "Kanki Forces",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Weak Point Flash [Yellow Sheep]",
        "name_jp": "急所一閃【黄羊】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest DEF",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Feared enemy general present",
            "target": "All enemy generals",
            "effect": "Morale Down 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Declaration of Madness",
        "name_jp": "狂気宣告",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Kanki Forces",
            "effect": "Hit Rate Up 20%",
            "duration": null
          },
          {
            "condition": null,
            "target": "All ally generals",
            "effect": "Fear Infliction Rate Up 30%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Madness Execution",
        "name_jp": "狂気執行",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest remaining morale",
            "target": "1 enemy general",
            "effect": "Fear Infliction 50%",
            "duration": "4 turns"
          },
          {
            "condition": "Per ally Kanki Forces member",
            "target": "All feared enemy generals",
            "effect": "DEF Down 10%",
            "duration": "4 turns"
          },
          {
            "condition": "Feared enemy general with lowest remaining HP",
            "target": "1 feared enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Enemy general with lowest remaining HP",
            "target": "1 enemy general",
            "effect": "170% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/bain.webp"
  },
  {
    "id": "shotaku",
    "name_en": "Shoutaku",
    "name_jp": "松琢",
    "country": "qin",
    "unit": "Gyokuhou Squad",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Heavy Pursuit [Green Bull]",
        "name_jp": "重追撃【緑牛】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest remaining HP",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Enemy war machine with lowest remaining HP",
            "target": "1 enemy war machine",
            "effect": "100% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Gyokuhou Oath [Life]",
        "name_jp": "玉鳳の誓い【生】",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Ouhon",
            "effect": "Max HP Up 50%",
            "duration": null
          },
          {
            "condition": "Surviving",
            "target": "Ally Gyokuhou Squad",
            "effect": "HP Recovery 10%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Gyokuhou Squad",
            "effect": "Hit Rate Up 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Loyalty to the Royal House",
        "name_jp": "王家への信",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Ally Ouhon",
            "effect": "DEF Penetration Up 30%",
            "duration": "4 turns"
          },
          {
            "condition": "Per other ally Gyokuhou Squad member",
            "target": "Ally Ouhon",
            "effect": "ATK Up 15%",
            "duration": "4 turns"
          },
          {
            "condition": "Enemy general with lowest remaining HP",
            "target": "1 enemy general",
            "effect": "170% Damage",
            "duration": null
          },
          {
            "condition": "Enemy war machine with lowest remaining HP",
            "target": "1 enemy war machine",
            "effect": "100% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/shoutaku.webp"
  },
  {
    "id": "kyukou",
    "name_en": "Kyuukou",
    "name_jp": "宮康",
    "country": "qin",
    "unit": "Gyokuhou Squad",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Fierce General Flash [Gray Sheep]",
        "name_jp": "猛将一閃【灰羊】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "From the 150% Damage above",
            "target": "Self",
            "effect": "HP Drain 100%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Gyokuhou Oath [Loyalty]",
        "name_jp": "玉鳳の誓い【忠】",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Ouhon",
            "effect": "Max HP Up 50%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Gyokuhou Squad",
            "effect": "Betrayal Resistance 30%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Gyokuhou Squad",
            "effect": "Confusion Resistance 50%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Hold to the Last",
        "name_jp": "死守",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Self",
            "effect": "Provoke",
            "duration": "4 turns"
          },
          {
            "condition": "Per other ally Gyokuhou Squad member",
            "target": "Self",
            "effect": "DEF Up 15%",
            "duration": "4 turns"
          },
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "170% Damage",
            "duration": null
          },
          {
            "condition": "From the 170% Damage above",
            "target": "Self",
            "effect": "HP Drain 100%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/kyuukou.webp"
  },
  {
    "id": "naki",
    "name_en": "Naki",
    "name_jp": "那貴",
    "country": "qin",
    "unit": "Kanki Forces",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Master General Flash [Yellow Sheep]",
        "name_jp": "名将一閃【黄羊】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Qin",
            "effect": "DEF Up 20%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Strike First",
        "name_jp": "機先を制す",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Self",
            "effect": "Sure Hit",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Kanki Forces",
            "effect": "DEF Penetration Up 20%",
            "duration": null
          },
          {
            "condition": "When Attacking",
            "target": "Ally Kanki Forces",
            "effect": "Dodge Chance 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Silent Intimidation",
        "name_jp": "静かなる威圧",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Enemy Zhao / Enemy Wei",
            "effect": "HP Recovery Nullification 70%",
            "duration": "4 turns"
          },
          {
            "condition": "When Attacking",
            "target": "Ally Kanki Forces",
            "effect": "Critical Rate Up 20%",
            "duration": "3 turns"
          },
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "180% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/naki.webp"
  },
  {
    "id": "ringyoku",
    "name_en": "Ringyoku",
    "name_jp": "リン玉",
    "country": "qin",
    "unit": "Kanki Forces",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Heavy Pursuit [Green Tiger]",
        "name_jp": "重追撃【緑虎】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Per other ally cavalry member",
            "target": "Ally cavalry",
            "effect": "ATK Up 10%",
            "duration": "3 turns"
          },
          {
            "condition": "Enemy general with lowest remaining HP",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Clever Lieutenant",
        "name_jp": "慧敏な側近",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Qin",
            "effect": "Confusion Resistance 40%",
            "duration": null
          },
          {
            "condition": "When Attacking",
            "target": "Ally Kanki Forces",
            "effect": "Morale Cost Reduction 30%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Cruel Follow-Up",
        "name_jp": "残酷な追い打ち",
        "type": "Combat",
        "effects": [
          {
            "condition": "Poisoned enemy with lowest remaining HP",
            "target": "1 poisoned enemy general",
            "effect": "100% Damage",
            "duration": null
          },
          {
            "condition": "Burned enemy with lowest remaining HP",
            "target": "1 burned enemy general",
            "effect": "100% Damage",
            "duration": null
          },
          {
            "condition": "Feared enemy with lowest remaining HP",
            "target": "1 feared enemy general",
            "effect": "100% Damage",
            "duration": null
          },
          {
            "condition": "When Attacking",
            "target": "Ally Kanki Forces",
            "effect": "Evasion Rate Up 20%",
            "duration": "3 turns"
          },
          {
            "condition": "When Attacking, enemy general with lowest remaining HP",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/ringyoku.webp"
  },
  {
    "id": "zenou",
    "name_en": "Zenou",
    "name_jp": "ゼノウ",
    "country": "qin",
    "unit": "Kanki Forces",
    "rarity": "UR",
    "skills": [
      {
        "name_en": "Fierce General Eradication [Red Sheep]",
        "name_jp": "猛将撲滅【赤羊】",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Self",
            "effect": "Rampage",
            "duration": "3 turns"
          },
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "200% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Massacre",
        "name_jp": "鏖殺",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Self",
            "effect": "Rampage",
            "duration": "3 turns"
          },
          {
            "condition": null,
            "target": "Enemy Zhao / Enemy Wei",
            "effect": "Morale Down 40%",
            "duration": null
          },
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "240% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Bandit''s Ultimate Weapon",
        "name_jp": "野盗の最終兵器",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Self",
            "effect": "DEF Penetration Up 30%",
            "duration": null
          },
          {
            "condition": "When ally Kanki is present",
            "target": "Self",
            "effect": "Status Effect Immunity (excl. Provoke)",
            "duration": "6 times"
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/zenou.webp"
  },
  {
    "id": "hokaku",
    "name_en": "Hokaku",
    "name_jp": "蒲鶮",
    "country": "qin",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Weak General Flash [Orange Sheep]",
        "name_jp": "弱将一閃【橙羊】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "All ally generals",
            "effect": "DEF Up 20%",
            "duration": "3 turns"
          },
          {
            "condition": "Other allies",
            "target": "Ally generals",
            "effect": "Provoke",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Overthrowing the Strong",
        "name_jp": "下剋上",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "Betrayal Infliction 50%",
            "duration": "3 turns"
          },
          {
            "condition": "Betrayal-afflicted",
            "target": "All enemy generals",
            "effect": "Reckless Infliction 100%",
            "duration": "4 turns"
          },
          {
            "condition": "Betrayal-afflicted",
            "target": "All enemy generals",
            "effect": "Critical Rate Up 30%",
            "duration": "4 turns"
          },
          {
            "condition": "Enemy general with lowest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "ATK Enhancement – Large Improved [Infantry]",
        "name_jp": "攻撃力強化・大改【歩兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally infantry",
            "effect": "ATK Up 9.9%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/hokaku.webp"
  }
]
'@ -Encoding UTF8

Set-Content -Path 'data\characters\wei.json' -Value @'
[
  {
    "id": "tairoji",
    "name_en": "Tairoji",
    "name_jp": "太呂慈",
    "country": "wei",
    "rarity": "UR",
    "skills": [
      {
        "name_en": "Fierce General Flash [Black Elephant]",
        "name_jp": "猛将一閃【黒象】",
        "type": "Combat",
        "effects": [
          {
            "condition": "When Attacking, enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "When Garrisoning, enemy general with highest remaining HP",
            "target": "1 enemy general",
            "effect": "% of Remaining HP Damage 20%",
            "duration": null
          },
          {
            "condition": "When Garrisoning, % HP Damage triggered",
            "target": "Self",
            "effect": "HP Drain 100%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Wei",
            "effect": "Morale Recovery 5%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Wei Grand General",
        "name_jp": "魏国大将軍",
        "type": "Strategy",
        "effects": [
          {
            "condition": "When Attacking",
            "target": "Ally Wei",
            "effect": "Status Effect Immunity (excl. Provoke)",
            "duration": "2 times"
          },
          {
            "condition": "When Attacking",
            "target": "Ally Wei",
            "effect": "Critical Rate Up 20%",
            "duration": null
          },
          {
            "condition": "When Garrisoning",
            "target": "Ally Wei",
            "effect": "Guard 60%",
            "duration": "1 time"
          },
          {
            "condition": "When Garrisoning",
            "target": "Enemy generals",
            "effect": "Critical Rate Down 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Judgment Strike",
        "name_jp": "断罪の一撃",
        "type": "Combat",
        "effects": [
          {
            "condition": "When Attacking",
            "target": "Ally Wei",
            "effect": "ATK Up 20%",
            "duration": "4 turns"
          },
          {
            "condition": "When Attacking, enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "180% Damage",
            "duration": null
          },
          {
            "condition": "When Garrisoning",
            "target": "Self",
            "effect": "Provoke",
            "duration": "2 turns"
          },
          {
            "condition": "When Garrisoning",
            "target": "Self",
            "effect": "DEF Up 30%",
            "duration": "4 turns"
          },
          {
            "condition": "When Garrisoning",
            "target": "Enemy generals",
            "effect": "100% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Wei",
            "effect": "Continuous HP Recovery 8%",
            "duration": "4 turns"
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/tairoji.webp"
  },
  {
    "id": "ranbishaku",
    "name_en": "Ranbihaku",
    "name_jp": "乱美迫",
    "country": "wei",
    "unit": "Wei Fire Dragon",
    "rarity": "UR",
    "skills": [
      {
        "name_en": "Fierce General Flash [White Sheep]",
        "name_jp": "猛将一閃【白羊】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Own HP ≥ 50%, enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "160% Damage",
            "duration": null
          },
          {
            "condition": "Own HP < 50%, enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "100% Damage",
            "duration": null
          },
          {
            "condition": "Own HP < 50%",
            "target": "Self",
            "effect": "HP Recovery 30%",
            "duration": null
          },
          {
            "condition": "When Garrisoning, enemy war machine with lowest remaining HP",
            "target": "1 enemy war machine",
            "effect": "130% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Destructive Impulse",
        "name_jp": "破壊衝動",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Self vs Qin",
            "effect": "ATK Up 30%",
            "duration": null
          },
          {
            "condition": "When ally Reihō is alive",
            "target": "Self vs war machines",
            "effect": "ATK Up 30%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Solo Assault",
        "name_jp": "単騎特攻",
        "type": "Combat",
        "effects": [
          {
            "condition": "Own HP ≥ 90%, enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "170% Damage",
            "duration": null
          },
          {
            "condition": "Own HP < 90%, enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "100% Damage",
            "duration": null
          },
          {
            "condition": "Own HP < 90%",
            "target": "Self",
            "effect": "HP Recovery 50%",
            "duration": null
          },
          {
            "condition": "When Garrisoning",
            "target": "Self",
            "effect": "Provoke",
            "duration": "3 turns"
          },
          {
            "condition": "When Garrisoning, enemy infantry / enemy war machine with highest ATK",
            "target": "1 enemy infantry / 1 enemy war machine",
            "effect": "130% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/ranbihaku.webp"
  },
  {
    "id": "shikika",
    "name_en": "Shikika",
    "name_jp": "紫季歌",
    "country": "wei",
    "unit": "Wei Fire Dragon",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Weak Point Flash [Orange Bull]",
        "name_jp": "急所一閃【橙牛】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest DEF",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Self",
            "effect": "Less Likely to be Targeted",
            "duration": "3 turns"
          },
          {
            "condition": null,
            "target": "Ally Shihaku",
            "effect": "Evasion Rate Up (Dodge Chance) 40%",
            "duration": "4 turns"
          },
          {
            "condition": "Own HP < 50%",
            "target": "Ally Shihaku",
            "effect": "Rampage",
            "duration": "3 turns"
          },
          {
            "condition": "Own HP < 100%",
            "target": "Self",
            "effect": "HP Recovery 50%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Beauty of Daliang",
        "name_jp": "大梁の美姫",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Other ally Wei",
            "effect": "ATK Up 15%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally cavalry",
            "effect": "DEF Up 15%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Wei Fire Dragon",
            "effect": "Morale Cost Reduction 50%",
            "duration": null
          },
          {
            "condition": "Damage dealt by Shihaku",
            "target": "Shikika",
            "effect": "Damage Received significantly Down",
            "duration": null
          }
        ]
      },
      {
        "name_en": "HP Enhancement – Special Large Improved [Infantry]",
        "name_jp": "体力強化・特大改【歩兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally infantry",
            "effect": "Max HP Up 22.8%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/shikika.webp"
  },
  {
    "id": "keiminoo",
    "name_en": "Keibin",
    "name_jp": "景湣王",
    "country": "wei",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Fierce General Flash [Purple Sheep]",
        "name_jp": "猛将一閃【紫羊】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Self",
            "effect": "Less Likely to be Targeted",
            "duration": "3 turns"
          },
          {
            "condition": null,
            "target": "Other ally shield soldiers",
            "effect": "DEF Up 20%",
            "duration": "3 turns"
          },
          {
            "condition": "When Attacking",
            "target": "Ally archers",
            "effect": "ATK Up 20%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Vessel of the Wei King",
        "name_jp": "魏王の器",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Other ally Wei",
            "effect": "Hit Rate Up 30%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Enemy Qin",
            "effect": "Hit Rate Down 30%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Renpa / ally Renpa''s Four Heavenly Kings",
            "effect": "Evasion Rate Up 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "HP Enhancement – Special Large Improved [Shield Soldiers]",
        "name_jp": "体力強化・特大改【盾兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally shield soldiers",
            "effect": "Max HP Up 22.8%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/keibin.webp"
  },
  {
    "id": "gaimo",
    "name_en": "Gaimou",
    "name_jp": "凱孟",
    "country": "wei",
    "unit": "Wei Fire Dragon",
    "rarity": "UR",
    "skills": [
      {
        "name_en": "Iron Wall Flash [Yellow Turtle]",
        "name_jp": "鉄壁一閃【黄亀】",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Self",
            "effect": "DEF Penetration Up 10%",
            "duration": "3 turns"
          },
          {
            "condition": "Enemy general with highest DEF",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Thirst for Battle",
        "name_jp": "戦への渇望",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Ally Wei Fire Dragon",
            "effect": "DEF Penetration Up 15%",
            "duration": "3 turns"
          },
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "160% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Slaughter Strike",
        "name_jp": "殺戮の一撃",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Ally Wei",
            "effect": "DEF Penetration Up 20%",
            "duration": "3 turns"
          },
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "170% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Self",
            "effect": "Guard 60%",
            "duration": "3 times"
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/gaimou.webp"
  },
  {
    "id": "junso",
    "name_en": "Junso",
    "name_jp": "荀早",
    "country": "wei",
    "unit": "Wei Fire Dragon",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Fierce General Flash [White Elephant]",
        "name_jp": "猛将一閃【白象】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Surviving ally cavalry",
            "target": "Ally cavalry",
            "effect": "HP Recovery 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Calm and Steady",
        "name_jp": "泰然自若",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Self",
            "effect": "Evasion Rate Up 10%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Other ally Wei",
            "effect": "Evasion Rate Up 10%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Gaimo",
            "effect": "Evasion Rate Up 10%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Fierce Bull Support",
        "name_jp": "猛牛輔翼",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "170% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Enemy cavalry",
            "effect": "ATK Down 10%",
            "duration": "3 turns"
          },
          {
            "condition": "When Garrisoning, enemy war machine with lowest DEF",
            "target": "1 enemy war machine",
            "effect": "120% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/junsou.webp"
  }
]
'@ -Encoding UTF8

Set-Content -Path 'data\characters\chu.json' -Value @'
[
  {
    "id": "jino",
    "name_en": "Jinou",
    "name_jp": "仁凹",
    "country": "chu",
    "unit": "Kanmei Forces",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Iron Wall Flash [Green Sheep]",
        "name_jp": "鉄壁一閃【緑羊】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest DEF",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Chu vs Qin",
            "effect": "ATK Up 30%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Veteran Strategist''s Command",
        "name_jp": "老軍師の采配",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Self",
            "effect": "Less Likely to be Targeted",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Chu",
            "effect": "Sure Hit",
            "duration": null
          },
          {
            "condition": null,
            "target": "Enemy generals vs Chu",
            "effect": "DEF Down 30%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Giant''s Lieutenant [Jino]",
        "name_jp": "巨人の側近【仁凹】",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Other ally Chu",
            "effect": "Evasion Rate Up 10%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally cavalry",
            "effect": "Evasion Rate Up 10%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Kanmei",
            "effect": "Evasion Rate Up 10%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/jinou.webp"
  },
  {
    "id": "gomosho",
    "name_en": "Goumasho",
    "name_jp": "剛摩諸",
    "country": "chu",
    "unit": "Kanmei Forces",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Fierce General Flash [White Tiger]",
        "name_jp": "猛将一閃【白虎】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "When Garrisoning, enemy war machine with lowest remaining HP",
            "target": "1 enemy war machine",
            "effect": "150% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Giant''s Lieutenant [Gomosho]",
        "name_jp": "巨人の側近【剛摩諸】",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Self",
            "effect": "Critical Damage Up 10%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Chu",
            "effect": "Critical Damage Up 10%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally cavalry",
            "effect": "Critical Damage Up 10%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Kanmei",
            "effect": "Critical Damage Up 10%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Heavy Armor Defense",
        "name_jp": "重装堅守",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Chu",
            "effect": "Attack Nullification",
            "duration": "1 time"
          },
          {
            "condition": "When Garrisoning, enemy general with highest remaining HP",
            "target": "1 enemy general",
            "effect": "% of Remaining HP Damage 20%",
            "duration": null
          },
          {
            "condition": "When Garrisoning, % HP Damage triggered",
            "target": "Self",
            "effect": "HP Drain 100%",
            "duration": null
          },
          {
            "condition": "When Garrisoning, enemy war machine with lowest remaining HP",
            "target": "1 enemy war machine",
            "effect": "150% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/goumasho.webp"
  },
  {
    "id": "baiman",
    "name_en": "Beiman",
    "name_jp": "貝満",
    "country": "chu",
    "unit": "Kanmei Forces",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Master General Sweep [Red Sheep]",
        "name_jp": "名将一掃【赤羊】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Per other ally Chu general",
            "target": "Enemy generals",
            "effect": "DEF Down 10%",
            "duration": "3 turns"
          },
          {
            "condition": "Enemy general with highest max morale",
            "target": "3 enemy generals",
            "effect": "90% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Solid Advice",
        "name_jp": "堅実な進言",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Chu",
            "effect": "Hit Rate Up 20%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Enemy Qin",
            "effect": "Hit Rate Down 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Giant''s Lieutenant [Baiman]",
        "name_jp": "巨人の側近【貝満】",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Self",
            "effect": "Critical Rate Up 10%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Other ally Chu",
            "effect": "Critical Rate Up 10%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Other ally cavalry",
            "effect": "Critical Rate Up 10%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Kanmei",
            "effect": "Critical Rate Up 10%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/beiman.webp"
  },
  {
    "id": "kaen",
    "name_en": "Kaen",
    "name_jp": "媧偃",
    "country": "chu",
    "unit": "Karin Forces",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Fierce General Flash [Purple Tiger]",
        "name_jp": "猛将一閃【紫虎】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "ATK Down 20%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Loyal Younger Sibling",
        "name_jp": "忠実なる弟",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Self / ally shield soldiers",
            "effect": "DEF Up 20%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Other ally generals",
            "effect": "Illusion Infliction Rate Up 15%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Careful Ambush",
        "name_jp": "慎重な奇襲",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "170% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Chu",
            "effect": "Guard 60%",
            "duration": "1 time"
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/kaen.webp"
  },
  {
    "id": "koretsuo",
    "name_en": "Kouretsu",
    "name_jp": "考烈王",
    "country": "chu",
    "rarity": "UR",
    "skills": [
      {
        "name_en": "Weak Point Double Strike [Red Sheep]",
        "name_jp": "急所双撃【赤羊】",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Enemy cavalry",
            "effect": "DEF Down 20%",
            "duration": "3 turns"
          },
          {
            "condition": "Enemy general with lowest DEF",
            "target": "2 enemy generals",
            "effect": "80% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Vessel of the Chu King",
        "name_jp": "楚王の器",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Chu",
            "effect": "Max Morale Up 50%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Self / ally Renpa / ally Renpa''s Four Heavenly Kings",
            "effect": "Sure Hit",
            "duration": null
          },
          {
            "condition": "When Garrisoning, gate HP remaining",
            "target": "Gate",
            "effect": "HP Recovery 50,000",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Iron Governance",
        "name_jp": "剛の統治",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Enemy cavalry",
            "effect": "Morale Down 20%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Enemy cavalry",
            "effect": "Fear Infliction 100%",
            "duration": "4 turns"
          },
          {
            "condition": "Feared enemies present",
            "target": "Self / ally cavalry",
            "effect": "ATK Up 30%",
            "duration": "3 turns"
          },
          {
            "condition": null,
            "target": "Self / ally Renpa / ally Renpa''s Four Heavenly Kings",
            "effect": "HP Recovery 20%",
            "duration": null
          },
          {
            "condition": "Enemy general with lowest DEF",
            "target": "3 enemy generals",
            "effect": "100% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/kouretsu.webp"
  },
  {
    "id": "hakusui",
    "name_en": "Hakusui",
    "name_jp": "白翠",
    "country": "chu",
    "unit": "Rinbujun Forces",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Iron Wall Flash [Green Elephant]",
        "name_jp": "鉄壁一閃【緑象】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest DEF",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Chu",
            "effect": "HP Recovery / Morale Recovery 10%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Self / ally Rinbujun / ally Hakurei",
            "effect": "Continuous HP Recovery 10%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Prayer for the Battlefield",
        "name_jp": "戦場への祈り",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Self",
            "effect": "Less Likely to be Targeted",
            "duration": null
          },
          {
            "condition": null,
            "target": "Self / ally Rinbujun / ally Hakurei",
            "effect": "Status Effect Immunity (excl. Provoke)",
            "duration": "1 time"
          },
          {
            "condition": "When Garrisoning",
            "target": "Ally Chu",
            "effect": "Guard 60%",
            "duration": "1 time"
          }
        ]
      },
      {
        "name_en": "ATK Enhancement – Special Large Improved [Archers]",
        "name_jp": "攻撃力強化・特大改【弓兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally archers",
            "effect": "ATK Up 12.4%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/hakusui.webp"
  },
  {
    "id": "shunshinkun",
    "name_en": "Shunshinkun",
    "name_jp": "春申君",
    "country": "chu",
    "rarity": "UR",
    "skills": [
      {
        "name_en": "Iron Wall Flash [Orange Elephant]",
        "name_jp": "鉄壁一閃【橙象】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest DEF",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Self",
            "effect": "DEF Up 20%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Coalition Supreme Commander",
        "name_jp": "合従軍総大将",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Other ally Chu",
            "effect": "Max HP Up / Morale Cost Reduction 30%",
            "duration": null
          },
          {
            "condition": "When Attacking",
            "target": "Ally Zhao / Wei / Han / Yan",
            "effect": "Max HP Up / Morale Cost Reduction 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Peerless Leader",
        "name_jp": "稀代の指導者",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Zhao / Wei / other Chu / Han / Yan",
            "effect": "ATK Up vs Qin / DEF Up vs Qin 30%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/shunshinkun.webp"
  },
  {
    "id": "bananci",
    "name_en": "Bananci",
    "name_jp": "馬南慈",
    "country": "chu",
    "unit": "Coalition Forces",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Fierce General Annihilation [Red Elephant]",
        "name_jp": "猛将撃滅【赤象】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "180% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Fist Discourse",
        "name_jp": "拳の語らい",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Enemy generals",
            "effect": "Critical Rate Up 20%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Enemy generals",
            "effect": "Critical Damage Down 50%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Crushing Iron Hammer",
        "name_jp": "破砕鉄槌",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Enemy archers",
            "effect": "Provoke Infliction",
            "duration": "4 turns"
          },
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "180% Damage",
            "duration": null
          },
          {
            "condition": "When ally [?] is alive, enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "180% Damage",
            "duration": null
          }
        ]
      }
    ]
  }
]
'@ -Encoding UTF8

Set-Content -Path 'data\characters\chu_major.json' -Value @'
[
  {
    "id": "karin",
    "name_en": "Karin",
    "name_jp": "媧燐",
    "country": "chu",
    "unit": "Karin Forces",
    "rarity": "UR",
    "skills": [
      {
        "name_en": "Iron Wall Flash [Yellow Sheep]",
        "name_jp": "鉄壁一閃【黄羊】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest DEF",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Enemy general with highest ATK",
            "target": "3 enemy generals",
            "effect": "Illusion Infliction 35%",
            "duration": "3 turns"
          },
          {
            "condition": null,
            "target": "Self",
            "effect": "Provoke",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Cruel Female Hero",
        "name_jp": "加虐の女傑",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Chu",
            "effect": "DEF Penetration Up 30%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Other ally Chu",
            "effect": "DEF Down 10%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "War Elephant Advance",
        "name_jp": "戦象進軍",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Enemy Qin",
            "effect": "ATK Down 20%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Self",
            "effect": "Illusion Infliction Rate Up 20%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/karin.webp"
  },
  {
    "id": "kanmei",
    "name_en": "Kanmei",
    "name_jp": "汗明",
    "country": "chu",
    "unit": "Kanmei Forces",
    "rarity": "UR",
    "skills": [
      {
        "name_en": "ATK Enhancement [Red Tiger]",
        "name_jp": "攻撃強化【赤虎】",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Other ally cavalry",
            "effect": "ATK Up 20%",
            "duration": null
          },
          {
            "condition": "When Attacking, per ally cavalry general",
            "target": "Self",
            "effect": "ATK Up 10%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Peerless Bravery",
        "name_jp": "至強の武勇",
        "type": "Combat",
        "effects": [
          {
            "condition": "Per enemy general defeated while skill is active",
            "target": "Other ally Chu generals",
            "effect": "ATK Up 15%",
            "duration": "4 turns"
          },
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Mountain Crush",
        "name_jp": "山崩し",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Enemy Qin",
            "effect": "DEF Down 20%",
            "duration": "3 turns"
          },
          {
            "condition": "Enemy general with lowest remaining HP",
            "target": "1 enemy general",
            "effect": "170% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/kanmei.webp"
  },
  {
    "id": "rinbujun",
    "name_en": "Rinbukun",
    "name_jp": "臨武君",
    "country": "chu",
    "unit": "Coalition Forces",
    "rarity": "UR",
    "skills": [
      {
        "name_en": "ATK Enhancement [Orange Sheep]",
        "name_jp": "攻撃強化【橙羊】",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Self",
            "effect": "ATK Up 20%",
            "duration": null
          },
          {
            "condition": "When Attacking",
            "target": "Other ally cavalry",
            "effect": "ATK Up / Critical Rate Up 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Kanmei''s Number One General",
        "name_jp": "汗明第一の猛将",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Self",
            "effect": "DEF Up 20%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Other ally Chu",
            "effect": "DEF Up 10%",
            "duration": null
          },
          {
            "condition": "When Attacking",
            "target": "Enemy Qin",
            "effect": "ATK Down 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Opening Battle Crushing Strike",
        "name_jp": "開戦の剛撃",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Self vs Qin",
            "effect": "ATK Up 40%",
            "duration": "2 turns"
          },
          {
            "condition": null,
            "target": "All enemy generals",
            "effect": "80% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/rinbukun.webp"
  },
  {
    "id": "renpa",
    "name_en": "Renpa",
    "name_jp": "廉頗",
    "country": "chu",
    "unit": "Renpa Forces",
    "rarity": "UR",
    "skills": [
      {
        "name_en": "Master General Flash [Orange Elephant]",
        "name_jp": "名将一閃【橙象】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Other ally cavalry / ally archers",
            "effect": "ATK Up 20%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Great General''s Majesty",
        "name_jp": "大将軍の威光",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Self / ally Renpa''s Four Heavenly Kings",
            "effect": "Max HP Up 60%",
            "duration": null
          },
          {
            "condition": "When Garrisoning",
            "target": "Ally Wei",
            "effect": "Max Morale Up 60%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Golden Strike",
        "name_jp": "黄金の一撃",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Self",
            "effect": "DEF Penetration Up 20%",
            "duration": "1 time"
          },
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "180% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/renpa.webp"
  },
  {
    "id": "rinka",
    "name_en": "Rinko",
    "name_jp": "輪虎",
    "country": "chu",
    "unit": "Renpa Forces",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Iron Wall Flash [Red Tiger]",
        "name_jp": "鉄壁一閃【赤虎】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest DEF",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Self",
            "effect": "ATK Up 30%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Renpa''s Flying Spear",
        "name_jp": "廉頗の飛槍",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Wei",
            "effect": "ATK Up 10%",
            "duration": null
          },
          {
            "condition": "When ally Renpa is present",
            "target": "Ally Renpa / ally Renpa''s Four Heavenly Kings",
            "effect": "DEF Penetration Up 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Flying Spear Chain Kill",
        "name_jp": "飛槍連殺",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Self",
            "effect": "DEF Penetration Up 60%",
            "duration": "3 times"
          },
          {
            "condition": "Enemy general with lowest max HP",
            "target": "1 enemy general",
            "effect": "170% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/rinko.webp"
  },
  {
    "id": "hakurei",
    "name_en": "Hakurei",
    "name_jp": "白麗",
    "country": "chu",
    "unit": "Rinbujun Forces",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Heavy Pursuit [Green Elephant]",
        "name_jp": "重追撃【緑象】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest remaining HP",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "Confusion Infliction 70%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Sure Shot",
        "name_jp": "正射必中",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally archers",
            "effect": "Sure Hit",
            "duration": null
          },
          {
            "condition": null,
            "target": "Enemy generals vs archers",
            "effect": "DEF Down 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Piercing Heavy Bow",
        "name_jp": "貫く剛弓",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest remaining HP",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Enemy general with highest DEF",
            "target": "1 enemy general",
            "effect": "200% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Enemy cavalry",
            "effect": "ATK Down 20%",
            "duration": "3 turns"
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/hakurei.webp"
  },
  {
    "id": "kaishi_renmei",
    "name_en": "Kaishibou",
    "name_jp": "介子坊",
    "country": "chu",
    "unit": "Renpa Forces",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Fierce General Flash [Orange Elephant]",
        "name_jp": "猛将一閃【橙象】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally cavalry",
            "effect": "ATK Up 20%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "HP Enhancement – Large [Cavalry]",
        "name_jp": "体力強化・大【騎兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally cavalry",
            "effect": "Max HP Up 7.9%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Squad Protection – Large Improved",
        "name_jp": "部隊保護・大改",
        "type": "Administration",
        "effects": [
          {
            "condition": "When passing terrain [Ambush] (active even when not deployed)",
            "target": "Passing squad",
            "effect": "Squad Damage Reduction 6.2%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/kaishibou.webp"
  },
  {
    "id": "gofuumei",
    "name_en": "Gohoumei",
    "name_jp": "呉鳳明",
    "country": "wei",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Iron Wall Flash [Yellow Elephant]",
        "name_jp": "鉄壁一閃【黄象】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest DEF",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Enemy general with highest DEF",
            "target": "1 enemy general",
            "effect": "ATK Down 20%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "War Machine Development Talent",
        "name_jp": "兵器開発の才",
        "type": "Strategy",
        "effects": [
          {
            "condition": "Per ally infantry / per other ally archer general",
            "target": "Self / ally attack war machines",
            "effect": "ATK Up 10%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Next Generation Strategy",
        "name_jp": "次代の軍略",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest DEF",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "ATK Down 20%",
            "duration": "3 turns"
          },
          {
            "condition": "When Attacking",
            "target": "Ally shield soldiers",
            "effect": "DEF Up 15%",
            "duration": "3 turns"
          },
          {
            "condition": "When Attacking",
            "target": "Other ally archers",
            "effect": "ATK Up 20%",
            "duration": "3 turns"
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/gohoumei.webp"
  },
  {
    "id": "gokei",
    "name_en": "Gokei",
    "name_jp": "呉慶",
    "country": "wei",
    "rarity": "UR",
    "skills": [
      {
        "name_en": "Fierce General Flash [Orange Bull]",
        "name_jp": "猛将一閃【橙牛】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Self",
            "effect": "DEF Up 20%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Calculated Command",
        "name_jp": "理詰めの采配",
        "type": "Strategy",
        "effects": [
          {
            "condition": "Per ally infantry general",
            "target": "Ally war machines",
            "effect": "ATK Up 10%",
            "duration": null
          },
          {
            "condition": "When Garrisoning",
            "target": "Ally war machines vs infantry",
            "effect": "DEF Up 30%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Unwavering Resolution",
        "name_jp": "不退の覚悟",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Enemy cavalry / enemy war machines",
            "effect": "ATK Down 20%",
            "duration": "3 turns"
          },
          {
            "condition": "Own HP ≤ 50%",
            "target": "Other ally Wei",
            "effect": "ATK Up 30%",
            "duration": "3 turns"
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/gokei.webp"
  }
]
'@ -Encoding UTF8

Set-Content -Path 'data\characters\misc2.json' -Value @'
[
  {
    "id": "hyoukou",
    "name_en": "Duke Hyou",
    "name_jp": "麃公",
    "country": "qin",
    "rarity": "UR",
    "notes": "Core buff target referenced by Gakurai and other Hi Shin Unit / Hyoukou Forces members.",
    "image": "https://touranko.vercel.app/persos/dukehyou.webp"
  },
  {
    "id": "mougo",
    "name_en": "Mougou",
    "name_jp": "蒙驁",
    "country": "qin",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "DEF Enhancement [Red Tiger]",
        "name_jp": "防御強化【赤虎】",
        "type": "Strategy",
        "effects": [
          {
            "condition": "Per turn elapsed",
            "target": "Self",
            "effect": "DEF Up 5% (max 25%)",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Cavalry Interception Formation",
        "name_jp": "騎兵迎撃布陣",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally shield soldiers vs cavalry",
            "effect": "DEF Up 20%",
            "duration": null
          },
          {
            "condition": "When Garrisoning",
            "target": "Ally shield soldiers",
            "effect": "ATK Up 10%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Full-Strength Strike",
        "name_jp": "渾身の一撃",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Self vs cavalry",
            "effect": "ATK Up 40%",
            "duration": "2 turns"
          },
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/mougou.webp"
  },
  {
    "id": "mouki",
    "name_en": "Mouki",
    "name_jp": "蒙毅",
    "country": "qin",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Weak Point Flash [Red Bull]",
        "name_jp": "急所一閃【赤牛】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest DEF",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally cavalry",
            "effect": "DEF Up 20%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Repair Material Reduction – Large",
        "name_jp": "修理資材減少・大",
        "type": "Administration",
        "effects": [
          {
            "condition": "When repairing Souha war machines",
            "target": "War machine repair",
            "effect": "Material Cost Down 2.7%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "HP Enhancement – Large Improved [Shield Soldiers]",
        "name_jp": "体力強化・大改【盾兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally shield soldiers",
            "effect": "Max HP Up 18.2%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/mouki.webp"
  },
  {
    "id": "muten_grandpa",
    "name_en": "Mouten''s Grandpa",
    "name_jp": "蒙恬のじぃ",
    "country": "qin",
    "rarity": "NR",
    "skills": [
      {
        "name_en": "Fierce General Flash [Green Sheep]",
        "name_jp": "猛将一閃【緑羊】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally cavalry",
            "effect": "DEF Up 20%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Repair Material Reduction – Large",
        "name_jp": "修理資材減少・大",
        "type": "Administration",
        "effects": [
          {
            "condition": "When repairing Souha war machines",
            "target": "War machine repair",
            "effect": "Material Cost Down 2.7%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "HP Enhancement – Large Improved [Shield Soldiers]",
        "name_jp": "体力強化・大改【盾兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally shield soldiers",
            "effect": "Max HP Up 18.2%",
            "duration": null
          }
        ]
      }
    ]
  },
  {
    "id": "rishi",
    "name_en": "Rishi",
    "name_jp": "李斯",
    "country": "qin",
    "rarity": "NR",
    "skills": [
      {
        "name_en": "Heavy Vanguard [Red Sheep]",
        "name_jp": "重先駆【赤羊】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest remaining HP",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Other ally archers",
            "effect": "ATK Up 15%",
            "duration": "3 turns"
          },
          {
            "condition": null,
            "target": "Other ally generals",
            "effect": "Betrayal Infliction Rate Up 35%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Repair Ore Reduction – Medium",
        "name_jp": "修理鉱石減少・中",
        "type": "Administration",
        "effects": [
          {
            "condition": "When repairing Souha war machines",
            "target": "War machine repair",
            "effect": "Ore Cost Down 2.4%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "ATK Enhancement – Medium Improved [Defense War Machines]",
        "name_jp": "攻撃力強化・中改【防衛兵器】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally defense war machines",
            "effect": "ATK Up 5.8%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/rishi.webp"
  },
  {
    "id": "douken",
    "name_en": "Douken",
    "name_jp": "道剣",
    "country": "unknown",
    "rarity": "NR",
    "skills": [
      {
        "name_en": "Status Infliction Rate Up [Red Sheep]",
        "name_jp": "付与率上昇【赤羊】",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Other ally generals",
            "effect": "Illusion Infliction Rate Up / Paralysis Infliction Rate Up 30%",
            "duration": null
          },
          {
            "condition": "When Garrisoning",
            "target": "Ally shield soldiers",
            "effect": "DEF Up 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Forest Terrain Aptitude – Small",
        "name_jp": "森林適性・小",
        "type": "Administration",
        "effects": [
          {
            "condition": "When passing terrain [Forest]",
            "target": "Passing squad",
            "effect": "Damage Reduction Effect Resistance 5.4%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Squad Protection – Small Improved",
        "name_jp": "部隊保護・小改",
        "type": "Administration",
        "effects": [
          {
            "condition": "When passing terrain [Ambush]",
            "target": "Passing squad",
            "effect": "Squad Damage Reduction 4.6%",
            "duration": null
          }
        ]
      }
    ]
  },
  {
    "id": "shishi",
    "name_en": "Shishi",
    "name_jp": "肆氏",
    "country": "unknown",
    "rarity": "NR",
    "skills": [
      {
        "name_en": "Heavy Pursuit [Yellow Sheep]",
        "name_jp": "重追撃【黄羊】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest remaining HP",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "When Garrisoning",
            "target": "Other ally generals",
            "effect": "Confusion / Poison / Paralysis Infliction Rate Up 40%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Repair Speed Enhancement – Medium",
        "name_jp": "修理速度強化・中",
        "type": "Administration",
        "effects": [
          {
            "condition": "When repairing Souha war machines",
            "target": "War machine repair",
            "effect": "Repair Speed Up 2%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "HP Enhancement – Medium Improved [Defense War Machines]",
        "name_jp": "体力強化・中改【防衛兵器】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally defense war machines",
            "effect": "Max HP Up 24.8%",
            "duration": null
          }
        ]
      }
    ]
  },
  {
    "id": "gii",
    "name_en": "Gii",
    "name_jp": "魏興",
    "country": "unknown",
    "rarity": "NR",
    "skills": [
      {
        "name_en": "Status Infliction Rate Up [Red Elephant]",
        "name_jp": "付与率上昇【赤象】",
        "type": "Strategy",
        "effects": [
          {
            "condition": "Other ally generals",
            "target": "Other ally generals",
            "effect": "Confusion Infliction Rate Up 20%",
            "duration": null
          },
          {
            "condition": "When Garrisoning",
            "target": "Ally infantry",
            "effect": "ATK Up / DEF Up 15%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Squad Protection – Small",
        "name_jp": "部隊保護・小",
        "type": "Administration",
        "effects": [
          {
            "condition": "When passing terrain [Ambush]",
            "target": "Passing squad",
            "effect": "Squad Damage Reduction 2%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Scout – Small Improved",
        "name_jp": "斥候・小改",
        "type": "Administration",
        "effects": [
          {
            "condition": "When passing terrain [Checkpoint]",
            "target": "Passing squad",
            "effect": "Squad Damage Reduction 4.6%",
            "duration": null
          }
        ]
      }
    ]
  },
  {
    "id": "maron",
    "name_en": "Maron",
    "name_jp": "摩論",
    "country": "unknown",
    "rarity": "NR",
    "skills": [
      {
        "name_en": "Weak Point Flash [Orange Sheep]",
        "name_jp": "急所一閃【橙羊】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest DEF",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Enemy war machine with lowest DEF",
            "target": "1 enemy war machine",
            "effect": "100% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "HP Enhancement – Large [Defense War Machines]",
        "name_jp": "体力強化・大【防衛兵器】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally defense war machines",
            "effect": "Max HP Up 12.3%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Repair Material Reduction – Large Improved",
        "name_jp": "修理資材減少・大改",
        "type": "Administration",
        "effects": [
          {
            "condition": "When repairing Souha war machines",
            "target": "War machine repair",
            "effect": "Material Cost Down 6.2%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/maron.webp"
  },
  {
    "id": "shunmen",
    "name_en": "Shunmen",
    "name_jp": "シュンメン",
    "country": "mountain_folk",
    "unit": "Hi Shin Unit",
    "rarity": "NR",
    "skills": [
      {
        "name_en": "Fierce General Flash [Red Elephant]",
        "name_jp": "猛将一閃【赤象】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Enemy war machine with highest ATK",
            "target": "1 enemy war machine",
            "effect": "100% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "HP Enhancement – Large [Infantry]",
        "name_jp": "体力強化・大【歩兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally infantry",
            "effect": "Max HP Up 7.9%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "DEF Enhancement – Large Improved [Infantry]",
        "name_jp": "防御力強化・大改【歩兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally infantry",
            "effect": "DEF Up 9.9%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/shunmen.webp"
  },
  {
    "id": "rankai",
    "name_en": "Rankai",
    "name_jp": "ランカイ",
    "country": "mountain_folk",
    "unit": "Hi Shin Unit",
    "rarity": "NR",
    "skills": [
      {
        "name_en": "Fierce General Flash [Red Bull]",
        "name_jp": "猛将一閃【赤牛】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Enemy general with highest ATK",
            "target": "3 enemy generals",
            "effect": "Confusion Infliction 30%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "ATK Enhancement – Large [Infantry]",
        "name_jp": "攻撃力強化・大【歩兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally infantry",
            "effect": "ATK Up 4.3%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Scout – Large Improved",
        "name_jp": "斥候・大改",
        "type": "Administration",
        "effects": [
          {
            "condition": "When passing terrain [Checkpoint]",
            "target": "Passing squad",
            "effect": "Squad Damage Reduction 6.2%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/rankai.webp"
  },
  {
    "id": "kyomei",
    "name_en": "Kyomei",
    "name_jp": "羌明",
    "country": "mountain_folk",
    "unit": "Hi Shin Unit",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Fierce General Flash",
        "name_jp": "猛将一閃",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally infantry",
            "effect": "DEF Up 15%",
            "duration": "3 turns"
          },
          {
            "condition": "When Attacking",
            "target": "Other ally generals",
            "effect": "Illusion Infliction Rate Up 45%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Forest Terrain Aptitude – Large",
        "name_jp": "森林適性・大",
        "type": "Administration",
        "effects": [
          {
            "condition": "When passing terrain [Forest]",
            "target": "Passing squad",
            "effect": "Damage Reduction Effect Resistance 7.2%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "HP Enhancement – Large Improved [Infantry]",
        "name_jp": "体力強化・大改【歩兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally infantry",
            "effect": "Max HP Up 18.2%",
            "duration": null
          }
        ]
      }
    ]
  },
  {
    "id": "suirou",
    "name_en": "Suirou",
    "name_jp": "崇原",
    "country": "qin",
    "unit": "Hi Shin Unit",
    "rarity": "NR",
    "skills": [
      {
        "name_en": "Iron Wall Flash [Red Turtle]",
        "name_jp": "鉄壁一閃【赤亀】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest DEF",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Enemy war machine with highest DEF",
            "target": "1 enemy war machine",
            "effect": "100% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "DEF Enhancement – Medium [Infantry]",
        "name_jp": "防御力強化・中【歩兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally infantry",
            "effect": "DEF Up 3.8%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Repair Ore Reduction – Medium Improved",
        "name_jp": "修理鉱石減少・中改",
        "type": "Administration",
        "effects": [
          {
            "condition": "When repairing Souha war machines",
            "target": "War machine repair",
            "effect": "Ore Cost Down 5.5%",
            "duration": null
          }
        ]
      }
    ]
  },
  {
    "id": "obira",
    "name_en": "Obira",
    "name_jp": "尾平",
    "country": "qin",
    "unit": "Hi Shin Unit",
    "rarity": "NR",
    "skills": [
      {
        "name_en": "Weak Point Flash [Red Sheep]",
        "name_jp": "急所一閃【赤羊】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest DEF",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Enemy war machine with lowest remaining HP",
            "target": "1 enemy war machine",
            "effect": "100% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Slope Terrain Aptitude – Medium",
        "name_jp": "坂路適性・中",
        "type": "Administration",
        "effects": [
          {
            "condition": "When passing terrain [Slope]",
            "target": "Passing squad",
            "effect": "Damage Reduction Effect Resistance 6.3%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "HP Enhancement – Medium Improved [Infantry]",
        "name_jp": "体力強化・中改【歩兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally infantry",
            "effect": "Max HP Up 15.9%",
            "duration": null
          }
        ]
      }
    ]
  },
  {
    "id": "hyou",
    "name_en": "Hyou",
    "name_jp": "漂",
    "country": "qin",
    "rarity": "NR",
    "skills": [
      {
        "name_en": "Weak General Flash [Red Elephant]",
        "name_jp": "弱将一閃【赤象】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Other ally generals",
            "effect": "Betrayal Resistance 50%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Scout – Medium",
        "name_jp": "斥候・中",
        "type": "Administration",
        "effects": [
          {
            "condition": "When passing terrain [Checkpoint]",
            "target": "Passing squad",
            "effect": "Squad Damage Reduction 2.4%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "HP Enhancement – Medium Improved [Cavalry]",
        "name_jp": "体力強化・中改【騎兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally cavalry",
            "effect": "Max HP Up 15.9%",
            "duration": null
          }
        ]
      }
    ]
  }
]
'@ -Encoding UTF8

Set-Content -Path 'data\characters\ai_yan_major.json' -Value @'
[
  {
    "id": "raoai",
    "name_en": "Rouai",
    "name_jp": "嫪毐",
    "country": "ai",
    "rarity": "UR",
    "notes": "Wategi King of Ai — core buff target for Ai generals.",
    "image": "https://touranko.vercel.app/persos/rouai.webp"
  },
  {
    "id": "juutekkoo",
    "name_en": "Wategi",
    "name_jp": "戎翟公",
    "country": "ai",
    "rarity": "UR",
    "skills": [
      {
        "name_en": "Fierce General Flash [White Turtle]",
        "name_jp": "猛将一閃【白亀】",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Ally cavalry vs Qin",
            "effect": "ATK Up 30%",
            "duration": "3 turns"
          },
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Grudge of the Fallen Nation",
        "name_jp": "亡国の怨恨",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Enemy Qin vs Qin",
            "effect": "DEF Down 30%",
            "duration": null
          },
          {
            "condition": "When enemy Qin generals are present",
            "target": "Ally generals",
            "effect": "Critical Rate Up 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Rebellion''s Signal Fire",
        "name_jp": "反乱の狼煙",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Enemy Qin",
            "effect": "Confusion Infliction 30%",
            "duration": "3 turns"
          },
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "170% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/wategi.webp"
  },
  {
    "id": "hanoki",
    "name_en": "Hanoki",
    "name_jp": "樊於期",
    "country": "ai",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Master General Flash [Orange Tiger]",
        "name_jp": "名将一閃【橙虎】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Enemy Qin general with highest ATK",
            "target": "1 enemy Qin general",
            "effect": "Betrayal Infliction 20%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Instigation of Chaos",
        "name_jp": "争乱扇動",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Self",
            "effect": "Betrayal Infliction Rate Up 10%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Other ally generals",
            "effect": "Confusion Infliction Rate Up 10%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Ai",
            "effect": "Hit Rate Up 30%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Forced Training",
        "name_jp": "強制練兵",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy Qin generals alive",
            "target": "Ally Ai",
            "effect": "ATK Up 20%",
            "duration": "3 turns"
          },
          {
            "condition": "Enemy general with lowest remaining HP",
            "target": "1 enemy general",
            "effect": "170% Damage",
            "duration": null
          },
          {
            "condition": "Enemy Qin general with highest ATK",
            "target": "1 enemy Qin general",
            "effect": "Betrayal Infliction",
            "duration": "3 turns"
          },
          {
            "condition": "Confused enemy generals present",
            "target": "Enemy generals",
            "effect": "Betrayal Infliction 40%",
            "duration": "3 turns"
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/hanoki.webp"
  },
  {
    "id": "hanryuki",
    "name_en": "Hanroki",
    "name_jp": "樊琉期",
    "country": "ai",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Heavy Pursuit [Green Turtle]",
        "name_jp": "重追撃【緑亀】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest remaining HP",
            "target": "1 enemy general",
            "effect": "140% Damage",
            "duration": null
          },
          {
            "condition": "Enemy Qin general''s HP ≤ 50%, enemy general with lowest remaining HP",
            "target": "1 enemy general",
            "effect": "60% Damage",
            "duration": null
          },
          {
            "condition": "From the 60% Damage",
            "target": "Self",
            "effect": "HP Drain 50%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Dominance over the Weak",
        "name_jp": "優勝劣勢",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest remaining HP",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Enemy general''s HP ≤ 50%, enemy general with lowest remaining HP",
            "target": "1 enemy general",
            "effect": "60% Damage",
            "duration": null
          },
          {
            "condition": "From the 60% Damage",
            "target": "Self",
            "effect": "HP Drain 50%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Trampling the Weak",
        "name_jp": "弱者への蹂躙",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest DEF",
            "target": "1 enemy general",
            "effect": "160% Damage",
            "duration": null
          },
          {
            "condition": "Enemy general''s HP ≤ 50%, enemy general with lowest remaining HP",
            "target": "2 enemy generals",
            "effect": "60% Damage",
            "duration": null
          },
          {
            "condition": "From the 60% Damage",
            "target": "Self",
            "effect": "HP Drain 10%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Ai",
            "effect": "Morale Recovery 10%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/hanroki.webp"
  },
  {
    "id": "ordo",
    "name_en": "Ordo",
    "name_jp": "オルド",
    "country": "yan",
    "unit": "Ordo Forces",
    "rarity": "UR",
    "skills": [
      {
        "name_en": "Master General Flash [Orange Turtle]",
        "name_jp": "名将一閃【橙亀】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally cavalry",
            "effect": "ATK Up 20%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Mountain Assault Talent",
        "name_jp": "山攻めの才",
        "type": "Combat",
        "effects": [
          {
            "condition": "Per ally general attack count",
            "target": "Other ally Yan",
            "effect": "ATK Up 2% (max 30%)",
            "duration": "4 turns"
          },
          {
            "condition": "When enemy Qin present",
            "target": "Enemy Qin",
            "effect": "50% Damage",
            "duration": null
          },
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "2-Hit 80% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Elite Assault",
        "name_jp": "精鋭突撃",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "3-Hit 100% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Enemy Qin",
            "effect": "DEF Down 30%",
            "duration": "3 turns"
          },
          {
            "condition": "Enemy general with highest DEF",
            "target": "3 enemy generals",
            "effect": "Confusion Infliction 20%",
            "duration": "3 turns"
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/ordo.webp"
  },
  {
    "id": "denti",
    "name_en": "Futei",
    "name_jp": "傳抵",
    "country": "zhao",
    "unit": "Riboku Forces",
    "rarity": "UR",
    "skills": [
      {
        "name_en": "Fierce General Flash [Green Sheep]",
        "name_jp": "猛将一閃【緑羊】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Other ally cavalry",
            "effect": "DEF Up 20%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Swift Hand-to-Hand Combat",
        "name_jp": "神速の白兵戦",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Enemy infantry / enemy cavalry",
            "effect": "Evasion Rate Down 10%",
            "duration": null
          },
          {
            "condition": "When ally Kaine is present",
            "target": "Self vs infantry / vs cavalry",
            "effect": "ATK Up 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Bewildering Speed",
        "name_jp": "翻弄する韋駄天",
        "type": "Combat",
        "effects": [
          {
            "condition": "Random",
            "target": "2 enemy generals",
            "effect": "100% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Self",
            "effect": "Evasion Rate Up 50%",
            "duration": "3 turns"
          },
          {
            "condition": "When Garrisoning",
            "target": "Self",
            "effect": "Provoke",
            "duration": "3 turns"
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/futei.webp"
  },
  {
    "id": "kouyoku",
    "name_en": "Kouyoku",
    "name_jp": "項翼",
    "country": "chu",
    "unit": "Wei Fire Dragon",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Fierce General Flash [Purple Turtle]",
        "name_jp": "猛将一閃【紫亀】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally cavalry vs cavalry",
            "effect": "ATK Up 30%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Curse of Moye",
        "name_jp": "莫邪の呪い",
        "type": "Combat",
        "effects": [
          {
            "condition": "Random",
            "target": "Enemy generals",
            "effect": "6-Hit 50% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Enemy generals",
            "effect": "HP Recovery Nullification 50%",
            "duration": "4 turns"
          }
        ]
      },
      {
        "name_en": "Rallying Advance",
        "name_jp": "鼓舞進撃",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Self",
            "effect": "Critical Damage Up 30%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Self",
            "effect": "DEF Penetration Up 20%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/kouyoku.webp"
  }
]
'@ -Encoding UTF8

Set-Content -Path 'data\characters\zhao.json' -Value @'
[
  {
    "id": "riboku",
    "name_en": "Riboku",
    "name_jp": "李牧",
    "country": "zhao",
    "rarity": "UR",
    "notes": "Core Zhao general; many Zhao skills reference his presence as a buff condition.",
    "image": "https://touranko.vercel.app/persos/riboku.webp"
  },
  {
    "id": "taishi_ka",
    "name_en": "Ka",
    "name_jp": "太子嘉",
    "country": "zhao",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Morale Recovery [Red Sheep]",
        "name_jp": "士気回復【赤羊】",
        "type": "Strategy",
        "effects": [
          {
            "condition": "Surviving",
            "target": "Ally Zhao",
            "effect": "Morale Recovery 30%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Zhao",
            "effect": "HP Recovery Rate Up 30%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Light of Hope",
        "name_jp": "希望の光",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Zhao",
            "effect": "ATK Up / DEF Up 30%",
            "duration": null
          },
          {
            "condition": "Surviving ally Zhao when enemies are alive",
            "target": "Ally Zhao",
            "effect": "HP Recovery 30%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Squad Protection – Special Large Improved",
        "name_jp": "部隊保護・特大改",
        "type": "Administration",
        "effects": [
          {
            "condition": "When passing terrain [Ambush] (active even when not deployed)",
            "target": "Passing squad",
            "effect": "Squad Damage Reduction 7.8%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/ka.webp"
  },
  {
    "id": "shunsuiki",
    "name_en": "Shunsuiju",
    "name_jp": "舜水樹",
    "country": "zhao",
    "unit": "Riboku Forces",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Weak Point Flash [Yellow Elephant]",
        "name_jp": "急所一閃【黄象】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest DEF",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "When ally Riboku is alive",
            "target": "Ally Riboku",
            "effect": "HP Recovery 20%",
            "duration": null
          },
          {
            "condition": "When ally Riboku is alive",
            "target": "Ally Riboku",
            "effect": "Morale Recovery 10%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Exceptional Preemptive Strike",
        "name_jp": "異才の先制",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Enemy cavalry",
            "effect": "Confusion Infliction 50%",
            "duration": "4 turns"
          },
          {
            "condition": null,
            "target": "Enemy shield soldiers",
            "effect": "Burn Infliction 50%",
            "duration": "4 turns"
          },
          {
            "condition": "Enemy general with lowest DEF",
            "target": "1 enemy general",
            "effect": "180% Damage",
            "duration": null
          },
          {
            "condition": "When ally Riboku is alive, enemy with lowest DEF",
            "target": "1 enemy general",
            "effect": "180% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Loyal Retainer of a Brilliant General",
        "name_jp": "智将の忠臣",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Zhao",
            "effect": "Hit Rate Up 20%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Enemy cavalry",
            "effect": "HP Recovery Rate Down 50%",
            "duration": null
          },
          {
            "condition": "When ally Riboku is alive",
            "target": "All enemy generals",
            "effect": "ATK Down 30%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/shunsuiju.webp"
  },
  {
    "id": "shunpeikun",
    "name_en": "Shunpeikun",
    "name_jp": "春平君",
    "country": "zhao",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Attack Reduction [Red Elephant]",
        "name_jp": "攻撃低下【赤象】",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Enemy infantry",
            "effect": "ATK Down 30%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Self",
            "effect": "Less Likely to be Targeted",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Beautiful Retainer",
        "name_jp": "艶美なる臣",
        "type": "Strategy",
        "effects": [
          {
            "condition": "Surviving",
            "target": "Ally Zhao",
            "effect": "Morale Recovery 20%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Zhao",
            "effect": "Guard 60%",
            "duration": "1 time"
          },
          {
            "condition": "When Garrisoning, gate HP remaining",
            "target": "Gate",
            "effect": "HP Recovery 50,000",
            "duration": null
          }
        ]
      },
      {
        "name_en": "DEF Enhancement – Special Large Improved [Infantry]",
        "name_jp": "防御力強化・特大改【歩兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally infantry",
            "effect": "DEF Up 12.4%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/shunpeikun.webp"
  },
  {
    "id": "seikou",
    "name_en": "Duke Sei",
    "name_jp": "青公",
    "country": "zhao",
    "unit": "Kisei Forces",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Weak Point Flash [Orange Tiger]",
        "name_jp": "急所一閃【橙虎】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Per attack by other ally general",
            "target": "Ally Kisei Forces",
            "effect": "ATK Up 2% (max 30%)",
            "duration": "3 turns"
          },
          {
            "condition": "Enemy general with lowest DEF",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Loyalty to the City Lord",
        "name_jp": "城主への忠誠",
        "type": "Strategy",
        "effects": [
          {
            "condition": "When ally Kisei is alive",
            "target": "Ally Zhao",
            "effect": "ATK Up 20%",
            "duration": null
          },
          {
            "condition": "When ally Kishou is alive",
            "target": "Ally Zhao",
            "effect": "DEF Up 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Unforgivable Atrocity",
        "name_jp": "許し難き非道",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Kisei Forces",
            "effect": "Status Effect Immunity (excl. Provoke)",
            "duration": "2 times"
          },
          {
            "condition": "When ally Kisei is alive",
            "target": "Ally Kisei Forces",
            "effect": "Critical Rate Up 10%",
            "duration": null
          },
          {
            "condition": "When ally Kishou is alive",
            "target": "Ally Kisei Forces",
            "effect": "Critical Damage Up 10%",
            "duration": null
          },
          {
            "condition": "When enemy Kanki Forces are alive",
            "target": "All enemy generals",
            "effect": "Evasion Rate Down 50%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/dukesei.webp"
  },
  {
    "id": "kinmo",
    "name_en": "Kinmou",
    "name_jp": "金毛",
    "country": "zhao",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Fierce General Flash [Gray Elephant]",
        "name_jp": "猛将一閃【灰象】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Other Zhao ally alive, enemy with highest remaining HP",
            "target": "1 enemy general",
            "effect": "% of Remaining HP Damage 20%",
            "duration": null
          },
          {
            "condition": "From the % HP Damage above",
            "target": "Self",
            "effect": "HP Drain 100%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Lieutenant''s Hidden Strength",
        "name_jp": "副官の底力",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Self",
            "effect": "Sure Hit",
            "duration": "3 turns"
          },
          {
            "condition": "Per turn elapsed",
            "target": "Ally Zhao",
            "effect": "DEF Up 5% (max 30%)",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Resolute Resistance",
        "name_jp": "決意の抵抗",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Self",
            "effect": "Provoke",
            "duration": "3 turns"
          },
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Self",
            "effect": "DEF Up vs Infantry / DEF Up vs Cavalry 30%",
            "duration": "3 turns"
          },
          {
            "condition": "Other Zhao ally alive, enemy with highest remaining HP",
            "target": "1 infantry / 1 cavalry enemy general",
            "effect": "% of Remaining HP Damage 20%",
            "duration": null
          },
          {
            "condition": "From % HP Damage above",
            "target": "Self",
            "effect": "HP Drain 100%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/kinmou.webp"
  },
  {
    "id": "gakuei",
    "name_en": "Gakuei",
    "name_jp": "岳嬰",
    "country": "zhao",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Master General Flash [Yellow Turtle]",
        "name_jp": "名将一閃【黄亀】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Feared enemy general with highest max morale",
            "target": "1 feared enemy general",
            "effect": "150% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Vengeance",
        "name_jp": "仇討ち",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Enemy Qin",
            "effect": "Fear Infliction 50%",
            "duration": "4 turns"
          },
          {
            "condition": null,
            "target": "Enemy Hi Shin Unit",
            "effect": "Skill Attack Seal 70%",
            "duration": "4 turns"
          },
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "180% Damage",
            "duration": null
          },
          {
            "condition": "Hi Shin Unit enemy with highest ATK",
            "target": "1 enemy Hi Shin Unit member",
            "effect": "180% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Fury",
        "name_jp": "激昂",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Self",
            "effect": "Sure Hit",
            "duration": null
          },
          {
            "condition": "When feared enemies are present",
            "target": "Ally Zhao",
            "effect": "ATK Up 20%",
            "duration": null
          },
          {
            "condition": "When enemy Hi Shin Unit are alive",
            "target": "Ally Zhao",
            "effect": "Guard 100%",
            "duration": "1 time"
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/gakuei.webp"
  },
  {
    "id": "ryuto",
    "name_en": "Ryuuto",
    "name_jp": "劉冬",
    "country": "zhao",
    "unit": "Rigan",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Master General Attack [Red Elephant]",
        "name_jp": "名将攻撃【赤象】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "2-Hit 80% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Rigan Bond [Friend]",
        "name_jp": "離眼の絆【友】",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Enemy Qin",
            "effect": "ATK Down 5%",
            "duration": "8 turns"
          },
          {
            "condition": "When ally [?] is alive",
            "target": "Ally Zhao",
            "effect": "Hit Rate Up 5%",
            "duration": "12 turns"
          },
          {
            "condition": "When ally [?] is alive",
            "target": "Ally Zhao",
            "effect": "DEF Penetration Up 5%",
            "duration": "12 turns"
          },
          {
            "condition": "Enemy general with lowest remaining HP",
            "target": "1 enemy general",
            "effect": "3-Hit 80% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Rigan Bond [Skill]",
        "name_jp": "離眼の絆【巧】",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Enemy Qin",
            "effect": "ATK Down 5%",
            "duration": "8 turns"
          },
          {
            "condition": "When ally [?] is alive",
            "target": "Ally Zhao",
            "effect": "Hit Rate Up 5%",
            "duration": "12 turns"
          },
          {
            "condition": "When ally [?] is alive",
            "target": "Ally Zhao",
            "effect": "DEF Penetration Up 5%",
            "duration": "12 turns"
          },
          {
            "condition": "Enemy general with lowest DEF",
            "target": "1 enemy general",
            "effect": "4-Hit 80% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/ryuuto.webp"
  },
  {
    "id": "kishou",
    "name_en": "Kishou",
    "name_jp": "紀昌",
    "country": "zhao",
    "unit": "Rigan",
    "rarity": "UR",
    "skills": [
      {
        "name_en": "Master General Flash [Yellow Bull]",
        "name_jp": "名将一閃【黄牛】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "When Garrisoning, gate HP remaining, ally alive",
            "target": "Gate",
            "effect": "HP Recovery 150,000",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Rigan Bond [Memory]",
        "name_jp": "離眼の絆【想】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "180% Damage",
            "duration": null
          },
          {
            "condition": "When Garrisoning",
            "target": "Self",
            "effect": "Provoke",
            "duration": "3 turns"
          },
          {
            "condition": "When Garrisoning, gate HP remaining, ally alive",
            "target": "Gate",
            "effect": "HP Recovery 200,000",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Inheritance of Will",
        "name_jp": "想いの継承",
        "type": "Strategy",
        "effects": [
          {
            "condition": "When ally is alive",
            "target": "All enemy generals",
            "effect": "ATK Down 20%",
            "duration": null
          },
          {
            "condition": "When ally is alive",
            "target": "All enemy generals",
            "effect": "Critical Damage Down 20%",
            "duration": null
          },
          {
            "condition": "When ally is alive",
            "target": "All enemy generals",
            "effect": "Critical Rate Down 20%",
            "duration": null
          },
          {
            "condition": "When Garrisoning, gate HP remaining",
            "target": "Gate",
            "effect": "HP Recovery 50,000",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/kishou.webp"
  },
  {
    "id": "kisei",
    "name_en": "Kisui",
    "name_jp": "紀彗",
    "country": "zhao",
    "unit": "Kisei Forces / Rigan",
    "rarity": "UR",
    "skills": [
      {
        "name_en": "Master General Flash [Yellow Elephant]",
        "name_jp": "名将一閃【黄象】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Zhao",
            "effect": "Morale Recovery 10%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Rigan War Cry",
        "name_jp": "離眼の掛け声",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Ally Zhao",
            "effect": "Continuous Morale Recovery 3%",
            "duration": "4 turns"
          },
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "160% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Rigan Bond [Heart]",
        "name_jp": "離眼の絆【心】",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Ally Zhao",
            "effect": "Continuous HP Recovery 3%",
            "duration": "4 turns"
          },
          {
            "condition": "When ally Batei or [?] is alive",
            "target": "Ally Zhao",
            "effect": "Guard 60%",
            "duration": "1 time"
          },
          {
            "condition": "When ally Batei AND [?] are both alive",
            "target": "Ally Zhao",
            "effect": "Attack Nullification",
            "duration": "1 time"
          },
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "180% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/kisui.webp"
  },
  {
    "id": "batei",
    "name_en": "Batei",
    "name_jp": "馬呈",
    "country": "zhao",
    "unit": "Rigan",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Master General Double Strike [Red Sheep]",
        "name_jp": "名将双撃【赤羊】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest max morale",
            "target": "2 enemy generals",
            "effect": "80% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Rigan Bond [Body]",
        "name_jp": "離眼の絆【体】",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Enemy Qin",
            "effect": "DEF Down 5%",
            "duration": "8 turns"
          },
          {
            "condition": "When ally [?] is alive",
            "target": "Ally Zhao",
            "effect": "ATK Up 10%",
            "duration": "8 turns"
          },
          {
            "condition": "When ally [?] is alive",
            "target": "Ally Zhao",
            "effect": "DEF Up 10%",
            "duration": "8 turns"
          },
          {
            "condition": "Enemy general with highest max morale",
            "target": "3 enemy generals",
            "effect": "90% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Rigan Bond [Strength]",
        "name_jp": "離眼の絆【剛】",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Enemy Qin",
            "effect": "DEF Down 5%",
            "duration": "8 turns"
          },
          {
            "condition": "When ally [?] is alive",
            "target": "Ally Zhao",
            "effect": "ATK Up 10%",
            "duration": "8 turns"
          },
          {
            "condition": "When ally [?] is alive",
            "target": "Ally Zhao",
            "effect": "DEF Up 10%",
            "duration": "8 turns"
          },
          {
            "condition": null,
            "target": "All enemy generals",
            "effect": "100% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/batei.webp"
  }
]
'@ -Encoding UTF8

Set-Content -Path 'data\characters\mountain_folk.json' -Value @'
[
  {
    "id": "yotanwa",
    "name_en": "Yotanwa",
    "name_jp": "楊端和",
    "country": "mountain_folk",
    "rarity": "UR",
    "skills": [
      {
        "name_en": "Death King''s Vanguard",
        "name_jp": "死王の先陣",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "All ally Kyountain Folk",
            "effect": "DEF Penetration Up 20%",
            "duration": "2 turns"
          },
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "200% Damage",
            "duration": null
          }
        ]
      }
    ],
    "notes": "Core unit; her name appears as a buff target in many Mountain Folk skill conditions.",
    "image": "https://touranko.vercel.app/persos/yotanwa.webp"
  },
  {
    "id": "kitari",
    "name_en": "Kitari",
    "name_jp": "キタリ",
    "country": "mountain_folk",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Master General Attack [Red Bull]",
        "name_jp": "名将攻撃【赤牛】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy archer with highest max morale",
            "target": "1 enemy archer",
            "effect": "100% Damage",
            "duration": null
          },
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "2-Hit 120% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Brave and Bold",
        "name_jp": "勇猛果敢",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Self",
            "effect": "Dodge Chance 30%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Kyountain Folk",
            "effect": "Critical Rate Up 20%",
            "duration": null
          },
          {
            "condition": "When enemy archers are alive",
            "target": "All enemy generals",
            "effect": "ATK Down 30%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Severing Twin Blades",
        "name_jp": "断ち切る双刃",
        "type": "Combat",
        "effects": [
          {
            "condition": "Per other ally Kyountain Folk member",
            "target": "Ally Kyountain Folk",
            "effect": "ATK Up 10%",
            "duration": "3 turns"
          },
          {
            "condition": null,
            "target": "Enemy archers",
            "effect": "100% Damage",
            "duration": null
          },
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "2-Hit 120% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/kitari.webp"
  },
  {
    "id": "danto",
    "name_en": "Danto",
    "name_jp": "ダント",
    "country": "mountain_folk",
    "rarity": "UR",
    "skills": [
      {
        "name_en": "Fierce General Flash [Gray Tiger]",
        "name_jp": "猛将一閃【灰虎】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "170% Damage",
            "duration": null
          },
          {
            "condition": "Other ally Kyountain Folk alive, own HP ≥ 50%",
            "target": "Self",
            "effect": "DEF Up 20%",
            "duration": "3 turns"
          },
          {
            "condition": "Other ally Kyountain Folk alive, own HP < 50%",
            "target": "Self",
            "effect": "Attack Nullification",
            "duration": "1 time"
          },
          {
            "condition": "Other ally Kyountain Folk alive, own HP < 50%",
            "target": "Self",
            "effect": "HP Recovery 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Vigorous and Aggressive",
        "name_jp": "剛健猛進",
        "type": "Strategy",
        "effects": [
          {
            "condition": "Per turn elapsed",
            "target": "Self",
            "effect": "DEF Up 5% (max 30%)",
            "duration": null
          },
          {
            "condition": "When ally [?] is alive",
            "target": "Self",
            "effect": "HP Recovery Rate Up 50%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Life in the Midst of Death",
        "name_jp": "死中に活あり",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "190% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Self",
            "effect": "Provoke",
            "duration": "3 turns"
          },
          {
            "condition": "Other Mountain Folk alive, own HP ≥ 50%",
            "target": "Self",
            "effect": "DEF Up 40%",
            "duration": "3 turns"
          },
          {
            "condition": "Other Mountain Folk alive, own HP < 50%",
            "target": "Self",
            "effect": "Attack Nullification",
            "duration": "2 times"
          },
          {
            "condition": "Other Mountain Folk alive, own HP < 50%",
            "target": "Self",
            "effect": "Continuous HP Recovery 10%",
            "duration": "3 turns"
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/danto.webp"
  },
  {
    "id": "katari",
    "name_en": "Katari",
    "name_jp": "カタリ",
    "country": "mountain_folk",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Fierce General Double Flash [Red Sheep]",
        "name_jp": "猛将双閃【赤羊】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "2-Hit 140% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Calm and Composed",
        "name_jp": "從容自若",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Self",
            "effect": "Dodge Chance 30%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Kyountain Folk",
            "effect": "DEF Penetration Up 20%",
            "duration": null
          },
          {
            "condition": "When ally [?] is alive",
            "target": "All enemy generals",
            "effect": "ATK Down 30%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Flash Blade",
        "name_jp": "瞬刃",
        "type": "Combat",
        "effects": [
          {
            "condition": "Per other ally Kyountain Folk member",
            "target": "Ally Kyountain Folk",
            "effect": "ATK Up 10%",
            "duration": "3 turns"
          },
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "2-Hit 160% Damage",
            "duration": null
          },
          {
            "condition": "When ally [?] is alive",
            "target": "Ally Kyountain Folk",
            "effect": "Attack Nullification",
            "duration": "1 time"
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/katari.webp"
  },
  {
    "id": "todji",
    "name_en": "Toji",
    "name_jp": "トッヂ",
    "country": "mountain_folk",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Weak Point Attack [Red Elephant]",
        "name_jp": "急所攻撃【赤象】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest DEF",
            "target": "1 enemy general",
            "effect": "120% Damage",
            "duration": null
          },
          {
            "condition": "Enemy shield soldier with lowest DEF",
            "target": "1 enemy shield soldier",
            "effect": "120% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Kyountain Folk",
            "effect": "Guard 60%",
            "duration": "1 time"
          }
        ]
      },
      {
        "name_en": "Death King''s Lieutenant [Toji]",
        "name_jp": "死王の側近【トッヂ】",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Kyountain Folk",
            "effect": "ATK Up / DEF Up 10%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Yotanwa",
            "effect": "ATK Up / DEF Up 30%",
            "duration": null
          },
          {
            "condition": "When Attacking",
            "target": "Ally Yotanwa",
            "effect": "Dodge Chance 40%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Mountain Folk Support [Toji]",
        "name_jp": "山民援護【トッヂ】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general earliest in formation order",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Enemy shield soldier earliest in formation order",
            "target": "1 enemy shield soldier",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Kyountain Folk",
            "effect": "Guard 60%",
            "duration": "1 time"
          },
          {
            "condition": null,
            "target": "Ally Yotanwa",
            "effect": "Attack Nullification",
            "duration": "1 time"
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/toji.webp"
  },
  {
    "id": "fuji",
    "name_en": "Fuji",
    "name_jp": "フゥヂ",
    "country": "mountain_folk",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Enemy General Sweep [Red Sheep]",
        "name_jp": "敵将一掃【赤羊】",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Ally Kyountain Folk",
            "effect": "DEF Penetration Up 10%",
            "duration": "2 turns"
          },
          {
            "condition": null,
            "target": "All enemy generals",
            "effect": "80% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Death King''s Lieutenant [Fuji]",
        "name_jp": "死王の側近【フゥヂ】",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Kyountain Folk",
            "effect": "Critical Damage Up 10%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Yotanwa",
            "effect": "Critical Damage Up 20%",
            "duration": null
          },
          {
            "condition": "When Attacking",
            "target": "Ally Yotanwa",
            "effect": "Status Effect Immunity (excl. Provoke)",
            "duration": "6 times"
          }
        ]
      },
      {
        "name_en": "Mountain Folk Support [Fuji]",
        "name_jp": "山民援護【フゥヂ】",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Ally Kyountain Folk",
            "effect": "DEF Penetration Up 10%",
            "duration": "2 turns"
          },
          {
            "condition": null,
            "target": "Ally Yotanwa",
            "effect": "DEF Penetration Up 20%",
            "duration": "2 turns"
          },
          {
            "condition": null,
            "target": "All enemy generals",
            "effect": "100% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/fuji.webp"
  },
  {
    "id": "ramaoji",
    "name_en": "Ramauji",
    "name_jp": "ラマウジ",
    "country": "mountain_folk",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Weak Point Attack [Red Sheep]",
        "name_jp": "急所攻撃【赤羊】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest DEF",
            "target": "1 enemy general",
            "effect": "2-Hit 100% Damage",
            "duration": null
          },
          {
            "condition": "Surviving",
            "target": "Ally Kyountain Folk",
            "effect": "HP Recovery 10%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Death King''s Lieutenant [Ramauji]",
        "name_jp": "死王の側近【ラマウジ】",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Kyountain Folk",
            "effect": "Critical Rate Up 10%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Yotanwa",
            "effect": "Critical Rate Up 20%",
            "duration": null
          },
          {
            "condition": "When Attacking",
            "target": "Ally Yotanwa",
            "effect": "Sure Hit",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Mountain Folk Support [Ramauji]",
        "name_jp": "山民援護【ラマウジ】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general earliest in formation order",
            "target": "1 enemy general",
            "effect": "2-Hit 120% Damage",
            "duration": null
          },
          {
            "condition": "Surviving",
            "target": "Mountain Folk",
            "effect": "HP Recovery 20%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Yotanwa",
            "effect": "Continuous HP Recovery 10%",
            "duration": "4 turns"
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/ramauji.webp"
  },
  {
    "id": "pamu",
    "name_en": "Pam",
    "name_jp": "パム",
    "country": "mountain_folk",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Fierce General Flash [Navy Sheep]",
        "name_jp": "猛将一閃【紺羊】",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Ally Danto",
            "effect": "DEF Up 20%",
            "duration": "3 turns"
          },
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Stalwart Escort",
        "name_jp": "剛者随行",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Danto",
            "effect": "Guard",
            "duration": "2 times"
          },
          {
            "condition": "Surviving",
            "target": "Ally Danto",
            "effect": "HP Recovery Rate Up 50%",
            "duration": null
          },
          {
            "condition": "Surviving",
            "target": "Ally Danto",
            "effect": "HP Recovery 20%",
            "duration": null
          },
          {
            "condition": "When ally Danto is alive",
            "target": "Ally Kyountain Folk",
            "effect": "Status Effect Immunity (excl. Provoke)",
            "duration": "1 time"
          }
        ]
      },
      {
        "name_en": "Stalwart Support",
        "name_jp": "剛者援護",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Ally Danto",
            "effect": "DEF Up 30%",
            "duration": "3 turns"
          },
          {
            "condition": "Surviving",
            "target": "Ally Danto",
            "effect": "HP Recovery 20%",
            "duration": null
          },
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "170% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/pam.webp"
  }
]
'@ -Encoding UTF8

Set-Content -Path 'data\characters\misc.json' -Value @'
[
  {
    "id": "yuri",
    "name_en": "Yuri",
    "name_jp": "友里",
    "country": "unknown",
    "rarity": "NR",
    "skills": [
      {
        "name_en": "ATK Enhancement – Special [Infantry]",
        "name_jp": "攻撃力強化・特【歩兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally infantry",
            "effect": "ATK Up 1%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "DEF Enhancement – Special Large [Infantry]",
        "name_jp": "防御力強化・特大【歩兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally infantry",
            "effect": "DEF Up 5.4%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "HP Enhancement – Special Large Improved [Infantry]",
        "name_jp": "体力強化・特大改【歩兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally infantry",
            "effect": "Max HP Up 22.8%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/yuri.webp"
  },
  {
    "id": "toumi",
    "name_en": "Toumi",
    "name_jp": "東美",
    "country": "unknown",
    "rarity": "NR",
    "skills": [
      {
        "name_en": "DEF Enhancement – Special [Infantry]",
        "name_jp": "防御力強化・特【歩兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally infantry",
            "effect": "DEF Up 1%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "ATK Enhancement – Special Large [Infantry]",
        "name_jp": "攻撃力強化・特大【歩兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally infantry",
            "effect": "ATK Up 5.4%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "HP Enhancement – Special Large Improved [Infantry]",
        "name_jp": "体力強化・特大改【歩兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally infantry",
            "effect": "Max HP Up 22.8%",
            "duration": null
          }
        ]
      }
    ]
  },
  {
    "id": "yugi",
    "name_en": "Yugi",
    "name_jp": "有義",
    "country": "unknown",
    "rarity": "NR",
    "skills": [
      {
        "name_en": "Fierce General Flash [Black Turtle]",
        "name_jp": "猛将一閃【黒亀】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Other ally shield soldiers",
            "effect": "DEF Up 20%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "ATK Enhancement – Large [Shield Soldiers]",
        "name_jp": "攻撃力強化・大【盾兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally shield soldiers",
            "effect": "ATK Up 4.3%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "DEF Enhancement – Large Improved [Shield Soldiers]",
        "name_jp": "防御力強化・大改【盾兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally shield soldiers",
            "effect": "DEF Up 9.9%",
            "duration": null
          }
        ]
      }
    ]
  },
  {
    "id": "encho",
    "name_en": "Entei",
    "name_jp": "燕呈",
    "country": "unknown",
    "rarity": "NR",
    "skills": [
      {
        "name_en": "Heavy Pursuit [Yellow Tiger]",
        "name_jp": "重追撃【黄虎】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest remaining HP",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Other ally infantry",
            "effect": "DEF Up 20%",
            "duration": "3 turns"
          },
          {
            "condition": "When Attacking",
            "target": "Other ally infantry",
            "effect": "DEF Up 15%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Repair Currency Reduction – Large",
        "name_jp": "修理貨幣減少・大",
        "type": "Administration",
        "effects": [
          {
            "condition": "When repairing Souha war machines",
            "target": "War machine repair",
            "effect": "Currency Cost Down 3.2%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "DEF Enhancement – Large Improved [Attack War Machines]",
        "name_jp": "防御力強化・大改【攻撃兵器】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally attack war machines",
            "effect": "DEF Up 6.4%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/entei.webp"
  },
  {
    "id": "bamyuu",
    "name_en": "Bamyu",
    "name_jp": "バミュウ",
    "country": "unknown",
    "rarity": "NR",
    "skills": [
      {
        "name_en": "Weak General Flash [Red Tiger]",
        "name_jp": "弱将一閃【赤虎】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Enemy war machine with lowest remaining HP",
            "target": "1 enemy war machine",
            "effect": "100% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "ATK Enhancement – Large [Attack War Machines]",
        "name_jp": "攻撃力強化・大【攻撃兵器】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally attack war machines",
            "effect": "ATK Up 2.8%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Repair Material Reduction – Large Improved",
        "name_jp": "修理資材減少・大改",
        "type": "Administration",
        "effects": [
          {
            "condition": "When repairing Souha war machines",
            "target": "War machine repair",
            "effect": "Material Cost Down 6.2%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/bamyu.webp"
  },
  {
    "id": "kakubi",
    "name_en": "Kakubi",
    "name_jp": "郭備",
    "country": "unknown",
    "rarity": "NR",
    "skills": [
      {
        "name_en": "ATK/DEF Enhancement [Red Sheep]",
        "name_jp": "攻防強化【赤羊】",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally cavalry / other ally shield soldiers",
            "effect": "ATK Up 20%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Other ally shield soldiers",
            "effect": "DEF Up 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "HP Enhancement – Large [Shield Soldiers]",
        "name_jp": "体力強化・大【盾兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally shield soldiers",
            "effect": "Max HP Up 7.9%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "HP Enhancement – Large Improved [Defense War Machines]",
        "name_jp": "体力強化・大改【防衛兵器】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally defense war machines",
            "effect": "Max HP Up 28.3%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/kakubi.webp"
  },
  {
    "id": "kesshi",
    "name_en": "Kesshi",
    "name_jp": "竭氏",
    "country": "unknown",
    "rarity": "NR",
    "skills": [
      {
        "name_en": "Heavy Pursuit [Orange Tiger]",
        "name_jp": "重追撃【橙虎】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest remaining HP",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Enemy general with highest ATK",
            "target": "3 enemy generals",
            "effect": "Illusion Infliction 35%",
            "duration": "3 turns"
          },
          {
            "condition": null,
            "target": "Ally infantry",
            "effect": "Confusion Infliction Rate Up / Paralysis Infliction Rate Up 40%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Repair Currency Reduction – Small",
        "name_jp": "修理貨幣減少・小",
        "type": "Administration",
        "effects": [
          {
            "condition": "When repairing Souha war machines",
            "target": "War machine repair",
            "effect": "Currency Cost Down 2.4%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Repair Speed Enhancement – Small Improved",
        "name_jp": "修理速度強化・小改",
        "type": "Administration",
        "effects": [
          {
            "condition": "When repairing Souha war machines",
            "target": "War machine repair",
            "effect": "Repair Speed Up 3.9%",
            "duration": null
          }
        ]
      }
    ]
  },
  {
    "id": "genho",
    "name_en": "Genho",
    "name_jp": "玄峰",
    "country": "unknown",
    "rarity": "NR",
    "skills": [
      {
        "name_en": "Iron Wall Flash [Red Elephant]",
        "name_jp": "鉄壁一閃【赤象】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest DEF",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Enemy general with highest ATK",
            "target": "2 enemy generals",
            "effect": "Illusion Infliction 60%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "DEF Enhancement – Large [Attack War Machines]",
        "name_jp": "防御力強化・大【攻撃兵器】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally attack war machines",
            "effect": "DEF Up 2.8%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Repair Ore Reduction – Large Improved",
        "name_jp": "修理鉱石減少・大改",
        "type": "Administration",
        "effects": [
          {
            "condition": "When repairing Souha war machines",
            "target": "War machine repair",
            "effect": "Ore Cost Down 6.2%",
            "duration": null
          }
        ]
      }
    ]
  },
  {
    "id": "amon",
    "name_en": "Amon",
    "name_jp": "亜門",
    "country": "unknown",
    "rarity": "NR",
    "skills": [
      {
        "name_en": "Fierce General Flash [Red Turtle]",
        "name_jp": "猛将一閃【赤亀】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally shield soldiers",
            "effect": "DEF Up 20%",
            "duration": "3 turns"
          },
          {
            "condition": "Enemy general with highest ATK",
            "target": "3 enemy generals",
            "effect": "Illusion Infliction 35%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "DEF Enhancement – Medium [Archers]",
        "name_jp": "防御力強化・中【弓兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally archers",
            "effect": "DEF Up 3.8%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Repair Currency Reduction – Medium Improved",
        "name_jp": "修理貨幣減少・中改",
        "type": "Administration",
        "effects": [
          {
            "condition": "When repairing Souha war machines",
            "target": "War machine repair",
            "effect": "Currency Cost Down 6.4%",
            "duration": null
          }
        ]
      }
    ]
  },
  {
    "id": "kosho2",
    "name_en": "Koshou",
    "name_jp": "江彰",
    "country": "unknown",
    "rarity": "NR",
    "skills": [
      {
        "name_en": "Weak General Flash [Red Sheep]",
        "name_jp": "弱将一閃【赤羊】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally shield soldiers",
            "effect": "DEF Up 20%",
            "duration": "3 turns"
          },
          {
            "condition": "Enemy general with highest ATK",
            "target": "2 enemy generals",
            "effect": "Paralysis Infliction",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "HP Enhancement – Medium Improved [Archers]",
        "name_jp": "体力強化・中改【弓兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally archers",
            "effect": "Max HP Up 6.9%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Scout – Medium Improved",
        "name_jp": "斥候・中改",
        "type": "Administration",
        "effects": [
          {
            "condition": "When passing terrain [Checkpoint] (active even when not deployed)",
            "target": "Passing squad",
            "effect": "Squad Damage Reduction 5.5%",
            "duration": null
          }
        ]
      }
    ]
  }
]
'@ -Encoding UTF8

Set-Content -Path 'data\characters\zhao_batch2.json' -Value @'
[
  {
    "id": "kakukai",
    "name_en": "Kakukai",
    "name_jp": "郭開",
    "country": "zhao",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Weak Point Flash [Orange Turtle]",
        "name_jp": "急所一閃【橙亀】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest DEF",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Riboku",
            "effect": "Attack Seal Infliction 100%",
            "duration": "2 turns"
          },
          {
            "condition": null,
            "target": "Self",
            "effect": "Attack Nullification",
            "duration": "1 time"
          },
          {
            "condition": "When Garrisoning, gate HP remaining",
            "target": "Gate",
            "effect": "HP Recovery 100,000",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Bloated Self-Interest",
        "name_jp": "肥大した我欲",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Self",
            "effect": "Less Likely to be Targeted",
            "duration": null
          },
          {
            "condition": null,
            "target": "Other ally generals / enemy generals",
            "effect": "DEF Down 20%",
            "duration": null
          },
          {
            "condition": "When Garrisoning, gate HP remaining",
            "target": "Gate",
            "effect": "HP Recovery 80,000",
            "duration": null
          }
        ]
      },
      {
        "name_en": "HP Enhancement – Special Large Improved [Infantry]",
        "name_jp": "体力強化・特大改【歩兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally infantry",
            "effect": "Max HP Up 22.8%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/kakukai.webp"
  },
  {
    "id": "keisha",
    "name_en": "Keisha",
    "name_jp": "慶舎",
    "country": "zhao",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Heavy Pursuit [Green Sheep]",
        "name_jp": "重追撃【緑羊】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest remaining HP",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Enemy cavalry",
            "effect": "ATK Down 20%",
            "duration": "3 turns"
          },
          {
            "condition": "When Garrisoning, enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "Confusion Infliction 70%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Hunter''s Domain",
        "name_jp": "狩人の本領",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally archers",
            "effect": "DEF Penetration Up 20%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Zhao",
            "effect": "Critical Damage Up 20%",
            "duration": null
          },
          {
            "condition": "When Garrisoning",
            "target": "Self",
            "effect": "Less Likely to be Targeted",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Hunter''s Thread",
        "name_jp": "狩り取る糸",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy shield soldier with highest DEF",
            "target": "1 enemy shield soldier",
            "effect": "180% Damage",
            "duration": null
          },
          {
            "condition": "When Garrisoning, gate HP remaining",
            "target": "Gate",
            "effect": "HP Recovery 100,000",
            "duration": null
          },
          {
            "condition": "When Garrisoning",
            "target": "Ally archers",
            "effect": "Attack Nullification",
            "duration": "1 time"
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/keisha.webp"
  },
  {
    "id": "rakujo",
    "name_en": "Gakujou",
    "name_jp": "楽乗",
    "country": "zhao",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Weak General Flash [Red Turtle]",
        "name_jp": "弱将一閃【赤亀】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Enemy cavalry",
            "effect": "ATK Down 20%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Devotion to Zhao",
        "name_jp": "趙国への想い",
        "type": "Strategy",
        "effects": [
          {
            "condition": "Per other ally Zhao general",
            "target": "Ally Zhao",
            "effect": "ATK Up 10%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Zhao",
            "effect": "Betrayal Resistance 50%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Will to Protect the Nation",
        "name_jp": "護国の意思",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest DEF",
            "target": "1 enemy general",
            "effect": "180% Damage",
            "duration": null
          },
          {
            "condition": "From the 180% Damage",
            "target": "Self",
            "effect": "HP Drain 100%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Enemy Qin",
            "effect": "Normal Attack Seal Infliction 40%",
            "duration": "3 turns"
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/gakujou.webp"
  },
  {
    "id": "shinseicho",
    "name_en": "Shinseijou",
    "name_jp": "晋成常",
    "country": "zhao",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Fierce General Flash [Purple Elephant]",
        "name_jp": "猛将一閃【紫象】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Other ally cavalry",
            "effect": "DEF Up 20%",
            "duration": "3 turns"
          },
          {
            "condition": "When Attacking",
            "target": "Other ally cavalry",
            "effect": "ATK Up 20%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Veteran''s Support",
        "name_jp": "熟練の支援",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Zhao",
            "effect": "DEF Penetration Up 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Veteran''s Dedication",
        "name_jp": "老将の献身",
        "type": "Combat",
        "effects": [
          {
            "condition": "Own HP ≥ 90%, enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "160% Damage",
            "duration": null
          },
          {
            "condition": "Own HP ≥ 90%",
            "target": "Ally Zhao",
            "effect": "Guard 60%",
            "duration": "1 time"
          },
          {
            "condition": "Own HP < 90%, enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "100% Damage",
            "duration": null
          },
          {
            "condition": "Own HP < 90%",
            "target": "Self",
            "effect": "HP Recovery 50%",
            "duration": null
          },
          {
            "condition": "Other ally Zhao generals'' HP < 90% and surviving",
            "target": "Other ally Zhao",
            "effect": "HP Recovery 30%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/shinseijou.webp"
  }
]
'@ -Encoding UTF8

Set-Content -Path 'data\characters\qi.json' -Value @'
[
  {
    "id": "oukenwang",
    "name_en": "Ouken",
    "name_jp": "王建王",
    "country": "qi",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Iron Wall Flash [Orange Turtle]",
        "name_jp": "鉄壁一閃【橙亀】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest DEF",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Self",
            "effect": "Less Likely to be Targeted",
            "duration": null
          },
          {
            "condition": "The higher own remaining HP",
            "target": "Ally cavalry",
            "effect": "ATK Up (max 30%)",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Deal Concluded",
        "name_jp": "商談成立",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Enemy Zhao / Wei / Chu / Han / Yan",
            "effect": "Evasion Rate Down 20%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Qin / ally Qi",
            "effect": "Evasion Rate Up 40%",
            "duration": null
          },
          {
            "condition": "When Attacking",
            "target": "Ally Qin / ally Qi",
            "effect": "Morale Cost Reduction 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "HP Enhancement – Special Large Improved [Shield Soldiers]",
        "name_jp": "体力強化・特大改【盾兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally shield soldiers",
            "effect": "Max HP Up 22.8%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/ouken.webp"
  }
]
'@ -Encoding UTF8

Set-Content -Path 'data\characters\qin_batch2.json' -Value @'
[
  {
    "id": "sougen",
    "name_en": "Sougen",
    "name_jp": "蒼源",
    "country": "qin",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Fierce General Flash [Navy Elephant]",
        "name_jp": "猛将一閃【紺象】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Enemy archer general with highest max morale",
            "target": "1 enemy archer",
            "effect": "150% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Father''s Back",
        "name_jp": "父の背中",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Self",
            "effect": "Sure Hit",
            "duration": null
          },
          {
            "condition": null,
            "target": "Self, ally [?], ally [?]",
            "effect": "Betrayal Resistance 100%",
            "duration": null
          },
          {
            "condition": "When ally [?] is alive",
            "target": "Self",
            "effect": "Critical Rate Up 30%",
            "duration": null
          },
          {
            "condition": "When ally [?] is alive",
            "target": "Self",
            "effect": "Critical Damage Up 30%",
            "duration": null
          },
          {
            "condition": "When ally [?] and [?] are both alive",
            "target": "All ally generals",
            "effect": "Attack Nullification",
            "duration": "1 time"
          }
        ]
      },
      {
        "name_en": "Ten-Bow Contest",
        "name_jp": "十弓勝負",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "180% Damage",
            "duration": null
          },
          {
            "condition": "Enemy archer with highest max morale",
            "target": "1 enemy archer",
            "effect": "180% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Enemy archers",
            "effect": "Paralysis Infliction 50%",
            "duration": "3 turns"
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/sougen.webp"
  },
  {
    "id": "gakurai",
    "name_en": "Gakurai",
    "name_jp": "岳雷",
    "country": "qin",
    "unit": "Hyoukou Forces / Hi Shin Unit",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "DEF Enhancement [Orange Bull]",
        "name_jp": "防御強化【橙牛】",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Qin",
            "effect": "DEF Up 20%",
            "duration": null
          },
          {
            "condition": "When Attacking",
            "target": "Ally Hyoukou / Ally Hi Shin Unit",
            "effect": "Betrayal Resistance 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Strike from Behind",
        "name_jp": "後手必勝",
        "type": "Combat",
        "effects": [
          {
            "condition": "Own remaining HP < 90%",
            "target": "Ally Qin",
            "effect": "Critical Damage Up 20%",
            "duration": "3 turns"
          },
          {
            "condition": null,
            "target": "Ally Hyoukou / Ally Hi Shin Unit",
            "effect": "HP Recovery / Morale Recovery 20%",
            "duration": null
          },
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "3-Hit 80% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Melee Expert",
        "name_jp": "乱戦強者",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Ally Qin",
            "effect": "Critical Rate Up 10%",
            "duration": "3 turns"
          },
          {
            "condition": null,
            "target": "Ally Hyoukou / Ally Hi Shin Unit",
            "effect": "Critical Rate Up 20%",
            "duration": "3 turns"
          },
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "4-Hit 80% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/gakurai.webp"
  },
  {
    "id": "choto",
    "name_en": "Choutou",
    "name_jp": "張唐",
    "country": "qin",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Fierce General Flash [Purple Bull]",
        "name_jp": "猛将一閃【紫牛】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Self",
            "effect": "Provoke",
            "duration": "3 turns"
          },
          {
            "condition": "When Garrisoning",
            "target": "Self",
            "effect": "DEF Up 20%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Veteran General''s Power",
        "name_jp": "老将の底力",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Self",
            "effect": "Status Effect Immunity (excl. Provoke)",
            "duration": "3 times"
          },
          {
            "condition": "When Garrisoning",
            "target": "Self",
            "effect": "Guard 60%",
            "duration": "3 times"
          },
          {
            "condition": "When Garrisoning, gate HP remaining",
            "target": "Gate",
            "effect": "HP Recovery 20,000",
            "duration": null
          }
        ]
      },
      {
        "name_en": "General''s Strength",
        "name_jp": "武将の力",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "170% Damage",
            "duration": null
          },
          {
            "condition": "Per other ally Qin general",
            "target": "Self",
            "effect": "DEF Up 10%",
            "duration": "4 turns"
          },
          {
            "condition": "When Garrisoning",
            "target": "Self",
            "effect": "Continuous HP Recovery 10%",
            "duration": "3 turns"
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/choutou.webp"
  },
  {
    "id": "shimasaku",
    "name_en": "Shibasaku",
    "name_jp": "司馬錯",
    "country": "qin",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "ATK Enhancement [Red Turtle]",
        "name_jp": "攻撃強化【赤亀】",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally archers",
            "effect": "ATK Up 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Six Generals'' War Scars",
        "name_jp": "六将の戦禍",
        "type": "Strategy",
        "effects": [
          {
            "condition": "Per other ally Six Great General",
            "target": "Self",
            "effect": "DEF Up 10%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Enemy Wei / Enemy Chu",
            "effect": "ATK Down 10%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Shield Soldier Annihilation Shot",
        "name_jp": "盾兵殲滅射撃",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Self",
            "effect": "ATK Up vs Shield Soldiers 30%",
            "duration": "2 turns"
          },
          {
            "condition": "Enemy general with highest DEF",
            "target": "3 enemy generals",
            "effect": "90% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/shibasaku.webp"
  },
  {
    "id": "hyoshiga",
    "name_en": "Hyoushiga",
    "name_jp": "豹司牙",
    "country": "qin",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Fierce General Flash [White Bull]",
        "name_jp": "猛将一閃【白牛】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "Paralysis Infliction 30%",
            "duration": "4 turns"
          }
        ]
      },
      {
        "name_en": "Supreme Commander''s Guard",
        "name_jp": "軍総司令近衛兵",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally cavalry",
            "effect": "Hit Rate Up 30%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Qin",
            "effect": "Paralysis Infliction Rate Up 20%",
            "duration": null
          },
          {
            "condition": "When Garrisoning",
            "target": "Enemy cavalry",
            "effect": "Hit Rate Down 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Black Hidden Blade",
        "name_jp": "黒き懐刀",
        "type": "Combat",
        "effects": [
          {
            "condition": "Paralysed enemies present",
            "target": "All paralysed enemy generals",
            "effect": "100% Damage",
            "duration": null
          },
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "170% Damage",
            "duration": null
          },
          {
            "condition": "When Garrisoning",
            "target": "Enemy cavalry",
            "effect": "ATK Down 20%",
            "duration": "3 turns"
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/hyoushiga.webp"
  },
  {
    "id": "hakuki",
    "name_en": "Hakuki",
    "name_jp": "白起",
    "country": "qin",
    "rarity": "UR",
    "skills": [
      {
        "name_en": "Fierce General Flash [Yellow Bull]",
        "name_jp": "猛将一閃【黄牛】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Enemy cavalry",
            "effect": "ATK Down 20%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Battlefield Domination",
        "name_jp": "戦場の支配",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Other ally Qin generals",
            "effect": "Guard 60%",
            "duration": "2 times"
          },
          {
            "condition": "When Garrisoning, enemy war machine with highest ATK",
            "target": "1 enemy war machine",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "When Garrisoning",
            "target": "Self",
            "effect": "DEF Up 30%",
            "duration": "3 turns"
          },
          {
            "condition": "When Garrisoning",
            "target": "Ally war machines vs enemy war machines",
            "effect": "ATK Up 40%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Fortification Tactics",
        "name_jp": "築城戦法",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest remaining HP",
            "target": "1 enemy general",
            "effect": "170% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Self",
            "effect": "Guard 80%",
            "duration": "3 times"
          },
          {
            "condition": "When Garrisoning",
            "target": "Other ally generals",
            "effect": "Guard 60%",
            "duration": "2 times"
          },
          {
            "condition": "When Garrisoning",
            "target": "Ally war machines",
            "effect": "Guard 60%",
            "duration": "3 times"
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/hakuki.webp"
  },
  {
    "id": "ohkotsu",
    "name_en": "Oukotsu",
    "name_jp": "王齕",
    "country": "qin",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Fortified Equipment Double Smash [Red Sheep]",
        "name_jp": "堅牢器双壊【赤羊】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy war machine with highest DEF",
            "target": "2 enemy war machines",
            "effect": "100% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Other ally infantry",
            "effect": "ATK Up 20%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Unrivalled Strength",
        "name_jp": "怪力無双",
        "type": "Strategy",
        "effects": [
          {
            "condition": "Per ally Shoou / per other ally Six Great General",
            "target": "Self",
            "effect": "ATK Up / DEF Up 5%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Symbol of Destruction",
        "name_jp": "破壊の象徴",
        "type": "Strategy",
        "effects": [
          {
            "condition": "When Attacking",
            "target": "Ally war machines",
            "effect": "ATK Up 15%",
            "duration": null
          },
          {
            "condition": "When Attacking, per other ally Qin general",
            "target": "Ally war machines",
            "effect": "ATK Up 5%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/oukotsu.webp"
  },
  {
    "id": "kaioku",
    "name_en": "Kaioku",
    "name_jp": "介億",
    "country": "qin",
    "unit": "Shouheikun Forces",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Iron Wall Flash [Orange Sheep]",
        "name_jp": "鉄壁一閃【橙羊】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest DEF",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Enemy archers",
            "effect": "ATK Down 20%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Commander-in-Chief''s Right Hand",
        "name_jp": "軍曹司令の右腕",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Other ally Qin generals",
            "effect": "DEF Up 10%",
            "duration": null
          },
          {
            "condition": "When ally Shouheikun is present",
            "target": "Enemy generals vs cavalry",
            "effect": "DEF Down 30%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally cavalry",
            "effect": "ATK Up 10%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Broad Perspective",
        "name_jp": "大局観",
        "type": "Combat",
        "effects": [
          {
            "condition": "Own HP ≥ 90%, enemy general with highest DEF",
            "target": "1 enemy general",
            "effect": "160% Damage",
            "duration": null
          },
          {
            "condition": "Own HP ≥ 90%",
            "target": "Self / ally cavalry",
            "effect": "Guard 40%",
            "duration": "3 times"
          },
          {
            "condition": "Own HP < 90%, enemy general with highest DEF",
            "target": "1 enemy general",
            "effect": "100% Damage",
            "duration": null
          },
          {
            "condition": "Own HP < 90%",
            "target": "Self",
            "effect": "HP Recovery 30%",
            "duration": null
          },
          {
            "condition": "Other ally Qin generals'' HP < 90% and surviving",
            "target": "Ally Qin",
            "effect": "HP Recovery 30%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/kaioku.webp"
  },
  {
    "id": "kosho",
    "name_en": "Koshou",
    "name_jp": "胡傷",
    "country": "qin",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "DEF Enhancement [Orange Elephant]",
        "name_jp": "防御強化【橙象】",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally archers",
            "effect": "DEF Up 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "One-Sided Invasion",
        "name_jp": "一方的侵略",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Enemy generals",
            "effect": "DEF Down 10%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Enemy shield soldiers vs archers",
            "effect": "DEF Down 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Battle Strategy",
        "name_jp": "戦の攻略",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest DEF",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Other ally Qin generals",
            "effect": "ATK Up 10%",
            "duration": "3 turns"
          },
          {
            "condition": "When Attacking, per ally Six Great General",
            "target": "Enemy war machines",
            "effect": "DEF Down 10%",
            "duration": "3 turns"
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/koshou.webp"
  },
  {
    "id": "garo",
    "name_en": "Garo",
    "name_jp": "我呂",
    "country": "qin",
    "unit": "Hi Shin Unit",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "ATK Enhancement [Orange Elephant]",
        "name_jp": "攻撃強化【橙象】",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally infantry / other ally cavalry",
            "effect": "ATK Up 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Strike First",
        "name_jp": "先手必勝",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally infantry / other ally cavalry",
            "effect": "Attack Nullification",
            "duration": "1 time"
          }
        ]
      },
      {
        "name_en": "Melee Adept",
        "name_jp": "乱戦巧者",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest remaining HP",
            "target": "1 enemy general",
            "effect": "170% Damage",
            "duration": null
          },
          {
            "condition": "Other ally cavalry alive",
            "target": "Ally generals",
            "effect": "ATK Up 10%",
            "duration": "4 turns"
          },
          {
            "condition": "Ally infantry alive",
            "target": "Ally generals",
            "effect": "DEF Up 10%",
            "duration": "4 turns"
          },
          {
            "condition": null,
            "target": "Ally Qin",
            "effect": "Attack Nullification",
            "duration": "1 time"
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/garo.webp"
  },
  {
    "id": "rikusen",
    "name_en": "Rikusen",
    "name_jp": "陸仙",
    "country": "qin",
    "unit": "Gakuka Unit",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Master General Flash [Orange Turtle]",
        "name_jp": "名将一閃【橙亀】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally cavalry",
            "effect": "ATK Up 20%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Gakuka Main Force",
        "name_jp": "楽華の主力",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Hi Shin Unit / Ally Gyokuhou Squad / Ally Gakuka Unit",
            "effect": "Sure Hit",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Hi Shin Unit / Ally Gyokuhou Squad / Ally Gakuka Unit",
            "effect": "ATK Up vs Cavalry 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Hidden Ability",
        "name_jp": "秘めた実力",
        "type": "Combat",
        "effects": [
          {
            "condition": "Random",
            "target": "Enemy cavalry",
            "effect": "4-Hit 30% Damage",
            "duration": null
          },
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "170% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/rikusen.webp"
  },
  {
    "id": "kanjo",
    "name_en": "Kanjou",
    "name_jp": "関常",
    "country": "qin",
    "unit": "Gyokuhou Squad",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "DEF Reduction [Red Sheep]",
        "name_jp": "防御低下【赤羊】",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Enemy generals vs Qin",
            "effect": "DEF Down 10%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Enemy generals vs cavalry",
            "effect": "DEF Down 10%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Enemy generals vs Gyokuhou Squad",
            "effect": "DEF Down 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Cool and Composed",
        "name_jp": "冷静沈着",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Other ally cavalry / ally shield soldiers",
            "effect": "Morale Cost Reduction 20%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Other ally Gyokuhou Squad",
            "effect": "Morale Cost Reduction 30%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Desperate Charge",
        "name_jp": "決死の挺身",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "170% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Other ally cavalry / ally shield soldiers",
            "effect": "DEF Penetration Up 10%",
            "duration": "4 turns"
          },
          {
            "condition": null,
            "target": "Ally Gyokuhou Squad",
            "effect": "Attack Nullification",
            "duration": "1 time"
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/kanjou.webp"
  },
  {
    "id": "seikyo",
    "name_en": "Seikyou",
    "name_jp": "成蟜",
    "country": "qin",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Frail General Flash [Red Sheep]",
        "name_jp": "脆将一閃【赤羊】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest max HP",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Own HP ≥ 90%",
            "target": "Ally infantry",
            "effect": "ATK Up 30%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Repair Material Reduction – Medium",
        "name_jp": "修理資材減少・中",
        "type": "Administration",
        "effects": [
          {
            "condition": "When repairing Souha war machines",
            "target": "War machine repair",
            "effect": "Material Cost Down 2.4%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "HP Enhancement – Medium-Large Improved [Archers]",
        "name_jp": "体力強化・中改【弓兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally archers",
            "effect": "Max HP Up 15.9%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/seikyou.webp"
  },
  {
    "id": "rui",
    "name_en": "Rui",
    "name_jp": "瑠衣",
    "country": "qin",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Weak Point Flash [Orange Elephant]",
        "name_jp": "急所一閃【橙象】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest DEF",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Self",
            "effect": "Attack Nullification",
            "duration": "3 times"
          },
          {
            "condition": null,
            "target": "Self",
            "effect": "Less Likely to be Targeted",
            "duration": "3 turns"
          },
          {
            "condition": null,
            "target": "Ally archers",
            "effect": "Guard 70%",
            "duration": "2 times"
          }
        ]
      },
      {
        "name_en": "Princess''s Prayer",
        "name_jp": "公女の祈り",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally archers",
            "effect": "ATK Up 20%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Seikyo",
            "effect": "ATK Up / DEF Up 20%",
            "duration": null
          },
          {
            "condition": "When Garrisoning",
            "target": "Enemy generals vs archers",
            "effect": "DEF Down 20%",
            "duration": null
          },
          {
            "condition": "When Garrisoning",
            "target": "Ally war machines",
            "effect": "ATK Up 30%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "HP Enhancement – Special Large Improved [Infantry]",
        "name_jp": "体力強化・特大改【歩兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally infantry",
            "effect": "Max HP Up 22.8%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/rui.webp"
  },
  {
    "id": "yo",
    "name_en": "You",
    "name_jp": "陽",
    "country": "qin",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Heavy Pursuit [Yellow Bull]",
        "name_jp": "重追撃【黄牛】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest remaining HP",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Self",
            "effect": "Less Likely to be Targeted",
            "duration": "3 turns"
          },
          {
            "condition": "When Garrisoning",
            "target": "Enemy generals",
            "effect": "ATK Down 20%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Light''s Protection",
        "name_jp": "光の庇護",
        "type": "Strategy",
        "effects": [
          {
            "condition": "Surviving",
            "target": "Ally Qin",
            "effect": "Morale Recovery 10%",
            "duration": null
          },
          {
            "condition": "When Garrisoning",
            "target": "Ally archers",
            "effect": "Guard 60%",
            "duration": "1 time"
          }
        ]
      },
      {
        "name_en": "HP Enhancement – Special Large Improved [Archers]",
        "name_jp": "体力強化・特大改【弓兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally archers",
            "effect": "Max HP Up 22.8%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/you.webp"
  },
  {
    "id": "ryuyu",
    "name_en": "Ryuyu",
    "name_jp": "竜有",
    "country": "qin",
    "unit": "Hi Shin Unit",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Heavy Pursuit [Green Bull]",
        "name_jp": "重追撃【緑牛】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest remaining HP",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Enemy war machine with lowest remaining HP",
            "target": "1 enemy war machine",
            "effect": "100% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "DEF Enhancement – Large Improved [Attack War Machines]",
        "name_jp": "防御力強化・大【攻撃兵器】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally attack war machines",
            "effect": "DEF Up 2.8%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "DEF Enhancement – Large Improved [Infantry]",
        "name_jp": "防御力強化・大改【歩兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally infantry",
            "effect": "DEF Up 9.9%",
            "duration": null
          }
        ]
      }
    ]
  },
  {
    "id": "chutetsu",
    "name_en": "Chutetsu",
    "name_jp": "中鉄",
    "country": "qin",
    "unit": "Hi Shin Unit",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Weak Point Flash [Orange Sheep]",
        "name_jp": "急所一閃【橙羊】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest DEF",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Enemy war machine with lowest DEF",
            "target": "1 enemy war machine",
            "effect": "100% Damage",
            "duration": null
          }
        ]
      },
      {
        "name_en": "ATK Enhancement – Large [Defense War Machines]",
        "name_jp": "攻撃力強化・大【防衛兵器】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally defense war machines",
            "effect": "ATK Up 2.8%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "ATK Enhancement – Large Improved [Infantry]",
        "name_jp": "攻撃力強化・大改【歩兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally infantry",
            "effect": "ATK Up 9.9%",
            "duration": null
          }
        ]
      }
    ]
  }
]
'@ -Encoding UTF8

Set-Content -Path 'data\characters\qin_major.json' -Value @'
[
  {
    "id": "ouhon",
    "name_en": "Ouhon",
    "name_jp": "王賁",
    "country": "qin",
    "unit": "Gyokuhou Squad",
    "rarity": "UR",
    "skills": [
      {
        "name_en": "Master General Flash [Red Elephant]",
        "name_jp": "名将一閃【赤象】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Self vs cavalry",
            "effect": "ATK Up 30%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "New Generation Rivalry",
        "name_jp": "新鋭角逐",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Hi Shin Unit / Gyokuhou Squad / Gakuka Unit",
            "effect": "ATK Up 10%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Self vs cavalry",
            "effect": "DEF Up 30%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Dragon''s Nest",
        "name_jp": "龍巣",
        "type": "Combat",
        "effects": [
          {
            "condition": "Per own attack count",
            "target": "Self",
            "effect": "ATK Up 8% (max 40%)",
            "duration": "3 turns"
          },
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "5-Hit 60% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Self",
            "effect": "Guard 70%",
            "duration": "2 times"
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/ouhon.webp"
  },
  {
    "id": "ousen",
    "name_en": "Ousen",
    "name_jp": "王翦",
    "country": "qin",
    "unit": "Ousen Forces",
    "rarity": "UR",
    "skills": [
      {
        "name_en": "Fierce General Flash [Red Tiger]",
        "name_jp": "猛将一閃【赤虎】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Enemy cavalry",
            "effect": "ATK Down 20%",
            "duration": "3 turns"
          },
          {
            "condition": "When Garrisoning",
            "target": "Self",
            "effect": "DEF Up 20%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Guaranteed Victory Siege",
        "name_jp": "必勝の籠城",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Enemy cavalry",
            "effect": "Critical Rate Down 20%",
            "duration": null
          },
          {
            "condition": "When Garrisoning",
            "target": "Ally shield soldiers",
            "effect": "DEF Penetration Up 30%",
            "duration": null
          },
          {
            "condition": "When Garrisoning, gate HP remaining",
            "target": "Gate",
            "effect": "HP Recovery 50,000",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Deep Strategy Deployment",
        "name_jp": "深謀の用兵術",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Ally shield soldiers",
            "effect": "ATK Up 20%",
            "duration": "3 turns"
          },
          {
            "condition": "When Garrisoning",
            "target": "Other ally shield soldiers",
            "effect": "Provoke",
            "duration": "3 turns"
          },
          {
            "condition": "When Garrisoning",
            "target": "Other ally shield soldiers",
            "effect": "Guard 60%",
            "duration": "2 times"
          },
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "170% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/ousen.webp"
  },
  {
    "id": "kanki",
    "name_en": "Kanki",
    "name_jp": "桓騎",
    "country": "qin",
    "unit": "Kanki Forces",
    "rarity": "UR",
    "skills": [
      {
        "name_en": "Heavy Pursuit [Red Elephant]",
        "name_jp": "重追撃【赤象】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest remaining HP",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Self",
            "effect": "Less Likely to be Targeted",
            "duration": "3 turns"
          },
          {
            "condition": "When Garrisoning, enemy general with highest max HP",
            "target": "3 enemy generals",
            "effect": "Burn Infliction 50%",
            "duration": "4 turns"
          }
        ]
      },
      {
        "name_en": "Bandit''s Signature Move",
        "name_jp": "野盗の十八番",
        "type": "Strategy",
        "effects": [
          {
            "condition": "Burned enemy generals present",
            "target": "Ally Qin",
            "effect": "ATK Up 20%",
            "duration": null
          },
          {
            "condition": "Feared enemy generals present",
            "target": "Ally Qin",
            "effect": "ATK Up 20%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Kanki Forces",
            "effect": "Evasion Rate Up 40%",
            "duration": null
          },
          {
            "condition": "When Garrisoning",
            "target": "Ally shield soldiers",
            "effect": "Critical Rate Up 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Mad Scheme",
        "name_jp": "狂気の所業",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Enemy archers",
            "effect": "Morale Down 20%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Enemy archers",
            "effect": "Fear Infliction 50%",
            "duration": "4 turns"
          },
          {
            "condition": null,
            "target": "Enemy Zhao / Enemy Wei",
            "effect": "Fear Infliction 100%",
            "duration": "4 turns"
          },
          {
            "condition": "Enemy general with lowest remaining HP",
            "target": "1 enemy general",
            "effect": "170% Damage",
            "duration": null
          },
          {
            "condition": "Enemy war machine with highest ATK",
            "target": "1 enemy war machine",
            "effect": "180% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/kanki.webp"
  },
  {
    "id": "muten",
    "name_en": "Mouten",
    "name_jp": "蒙恬",
    "country": "qin",
    "unit": "Gakuka Unit",
    "rarity": "UR",
    "skills": [
      {
        "name_en": "Master General Flash [Red Tiger]",
        "name_jp": "名将一閃【赤虎】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Enemy cavalry / enemy archers",
            "effect": "ATK Down 15%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Brilliant Outburst",
        "name_jp": "才気爆発",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Qin",
            "effect": "Max Morale Up 50%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Hi Shin Unit / Gyokuhou Squad / Gakuka Unit",
            "effect": "Max HP Up 50%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Skirmishing Mastery",
        "name_jp": "遊撃の妙技",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Enemy generals vs cavalry",
            "effect": "DEF Down 20%",
            "duration": "3 turns"
          },
          {
            "condition": "When Garrisoning",
            "target": "Other ally cavalry",
            "effect": "DEF Up 20%",
            "duration": "3 turns"
          },
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "160% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/mouten.webp"
  },
  {
    "id": "moubu",
    "name_en": "Moubu",
    "name_jp": "蒙武",
    "country": "qin",
    "rarity": "UR",
    "skills": [
      {
        "name_en": "ATK/DEF Enhancement [Red Turtle]",
        "name_jp": "攻防強化【赤亀】",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Self",
            "effect": "ATK Up 15%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally shield soldiers",
            "effect": "DEF Up 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Single Point Breakthrough",
        "name_jp": "一点突破",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "DEF Down 30%",
            "duration": "3 turns"
          },
          {
            "condition": null,
            "target": "Ally Qin vs Chu",
            "effect": "ATK Up 20%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Reaching Supreme Martial Might",
        "name_jp": "至強に至る武",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Self",
            "effect": "Reckless",
            "duration": "3 turns"
          },
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Enemy Chu general with highest ATK",
            "target": "1 enemy Chu general",
            "effect": "150% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/moubu.webp"
  },
  {
    "id": "shouheikun",
    "name_en": "Shouheikun",
    "name_jp": "昌平君",
    "country": "qin",
    "rarity": "UR",
    "skills": [
      {
        "name_en": "Master General Flash [Red Bull]",
        "name_jp": "名将一閃【赤牛】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Self / ally cavalry",
            "effect": "DEF Up 20%",
            "duration": "3 turns"
          },
          {
            "condition": "When Garrisoning",
            "target": "Ally shield soldiers",
            "effect": "DEF Up 20%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Strategic Vision",
        "name_jp": "戦略眼",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Qin",
            "effect": "Morale Cost Reduction 40%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Enveloping Thunder",
        "name_jp": "包雷",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Enemy generals",
            "effect": "Paralysis Infliction 40%",
            "duration": "2 turns"
          },
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "190% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/shouheikun.webp"
  },
  {
    "id": "shoumounkun",
    "name_en": "Shoumounkun",
    "name_jp": "昌文君",
    "country": "qin",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Fierce General Flash [Yellow Bull]",
        "name_jp": "猛将一閃【黄牛】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Enemy cavalry",
            "effect": "ATK Down 20%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Left Chancellor''s Expertise",
        "name_jp": "秦国左丞相の手腕",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Qin",
            "effect": "DEF Up 10%",
            "duration": null
          },
          {
            "condition": "When Garrisoning",
            "target": "Ally shield soldiers vs cavalry",
            "effect": "DEF Up 10%",
            "duration": null
          },
          {
            "condition": "When Garrisoning",
            "target": "Ally war machines",
            "effect": "DEF Up 30%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Mastery of Both Arts",
        "name_jp": "文武両道",
        "type": "Combat",
        "effects": [
          {
            "condition": "Own HP ≥ 50%",
            "target": "Self",
            "effect": "ATK Up 20%",
            "duration": "3 turns"
          },
          {
            "condition": "Own HP ≤ 70%",
            "target": "Other ally Qin generals",
            "effect": "DEF Up 20%",
            "duration": "3 turns"
          },
          {
            "condition": "Enemy general with highest DEF",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Self",
            "effect": "DEF Up 30%",
            "duration": "3 turns"
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/shoubunkun.webp"
  },
  {
    "id": "shoou",
    "name_en": "Shoou",
    "name_jp": "昭王",
    "country": "qin",
    "rarity": "UR",
    "skills": [
      {
        "name_en": "Fierce General Flash [Orange Elephant]",
        "name_jp": "猛将一閃【橙象】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally cavalry",
            "effect": "ATK Up 20%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Six Generals Gathered",
        "name_jp": "集いし六将",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Other ally Qin generals",
            "effect": "ATK Up 10%",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally Six Great Generals",
            "effect": "ATK Up 10% (additional)",
            "duration": null
          },
          {
            "condition": "Per ally Six Great General",
            "target": "Self",
            "effect": "ATK Up 10%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "War God''s Divine Protection",
        "name_jp": "戦神の加護",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "180% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Self / ally Six Great Generals",
            "effect": "Attack Nullification",
            "duration": "1 time"
          }
        ]
      }
    ]
  },
  {
    "id": "ei_sei",
    "name_en": "Ei Sei",
    "name_jp": "嬴政",
    "country": "qin",
    "rarity": "UR",
    "skills": [
      {
        "name_en": "Fierce General Flash [Blue Bull]",
        "name_jp": "猛将一閃【青牛】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Ally archers",
            "effect": "ATK Up 20%",
            "duration": "3 turns"
          },
          {
            "condition": "When Garrisoning",
            "target": "Self",
            "effect": "Provoke",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Alliance with the Mountain Folk",
        "name_jp": "山界との盟約",
        "type": "Strategy",
        "effects": [
          {
            "condition": "Per other ally Qin / Mountain Folk general",
            "target": "Ally generals",
            "effect": "ATK Up / DEF Up 5%",
            "duration": null
          },
          {
            "condition": "When Garrisoning",
            "target": "Self",
            "effect": "DEF Up 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Unification of China",
        "name_jp": "天下統一",
        "type": "Combat",
        "notes": "Skill data partially captured — effects pending confirmation",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "170% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/sei.webp"
  },
  {
    "id": "mou",
    "name_en": "Kyou",
    "name_jp": "摎",
    "country": "qin",
    "unit": "Ouki Forces",
    "rarity": "UR",
    "skills": [
      {
        "name_en": "Master General Flash [Orange Bull]",
        "name_jp": "名将一閃【橙牛】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Self",
            "effect": "Reckless",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Childhood Promise",
        "name_jp": "幼き約束",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Self vs archers",
            "effect": "ATK Up 15%",
            "duration": null
          },
          {
            "condition": "When ally Ouki is present",
            "target": "Self",
            "effect": "ATK Up 15%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "War God''s Bloodline",
        "name_jp": "戦神の血統",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "160% Damage",
            "duration": null
          },
          {
            "condition": "When Attacking, enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "190% Damage",
            "duration": null
          },
          {
            "condition": "When Attacking, own HP ≤ 50%, enemy general with highest max morale",
            "target": "1 enemy general",
            "effect": "220% Damage",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/kyou.webp"
  },
  {
    "id": "raido",
    "name_en": "Raido",
    "name_jp": "雷土",
    "country": "qin",
    "unit": "Kanki Forces",
    "rarity": "UR",
    "skills": [
      {
        "name_en": "Fierce General Flash [Black Bull]",
        "name_jp": "猛将一閃【黒牛】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": "Own HP ≤ 70%",
            "target": "Enemy generals",
            "effect": "Illusion Infliction 40%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Evening Bonfire",
        "name_jp": "宵の篝火",
        "type": "Combat",
        "effects": [
          {
            "condition": null,
            "target": "Enemy generals",
            "effect": "Burn Infliction 40%",
            "duration": "4 turns"
          },
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "180% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Self",
            "effect": "Provoke",
            "duration": "4 turns"
          },
          {
            "condition": null,
            "target": "Self",
            "effect": "DEF Up 30%",
            "duration": "4 turns"
          }
        ]
      },
      {
        "name_en": "ATK Enhancement – Large Improved [Infantry]",
        "name_jp": "攻撃力強化・中【歩兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally infantry",
            "effect": "ATK Up 3.8%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/raido.webp"
  },
  {
    "id": "ko",
    "name_en": "Kou",
    "name_jp": "向",
    "country": "qin",
    "rarity": "SR",
    "skills": [
      {
        "name_en": "Heavy Pursuit [Yellow Turtle]",
        "name_jp": "重追撃【黄亀】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with lowest remaining HP",
            "target": "1 enemy general",
            "effect": "150% Damage",
            "duration": null
          },
          {
            "condition": null,
            "target": "Self",
            "effect": "Less Likely to be Targeted",
            "duration": null
          },
          {
            "condition": "When Garrisoning",
            "target": "Ally shield soldiers",
            "effect": "DEF Up 20%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Heart''s Companion",
        "name_jp": "心の伽",
        "type": "Strategy",
        "effects": [
          {
            "condition": null,
            "target": "Ally Ei Sei / ally archers",
            "effect": "Status Effect Immunity (excl. Provoke)",
            "duration": "1 time"
          },
          {
            "condition": null,
            "target": "Ally Ei Sei / ally archers",
            "effect": "Evasion Rate Up 20%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "ATK Enhancement – Special Large Improved [Archers]",
        "name_jp": "攻撃力強化・特大改【弓兵】",
        "type": "Administration",
        "effects": [
          {
            "condition": "Alliance Souha Battle (active even when not deployed)",
            "target": "Ally archers",
            "effect": "ATK Up 12.4%",
            "duration": null
          }
        ]
      }
    ],
    "image": "https://touranko.vercel.app/persos/kou.webp"
  },
  {
    "id": "saizatsu",
    "name_en": "Saizatsu",
    "name_jp": "蔡沢",
    "country": "qin",
    "rarity": "NR",
    "skills": [
      {
        "name_en": "Iron Wall Attack [Red Sheep]",
        "name_jp": "鉄壁攻撃【赤羊】",
        "type": "Combat",
        "effects": [
          {
            "condition": "Enemy general with highest DEF",
            "target": "1 enemy general",
            "effect": "120% Damage",
            "duration": null
          },
          {
            "condition": "Enemy general with highest ATK",
            "target": "1 enemy general",
            "effect": "Betrayal Infliction 50%",
            "duration": "3 turns"
          }
        ]
      },
      {
        "name_en": "Repair Currency Reduction – Medium",
        "name_jp": "修理貨幣減少・中",
        "type": "Administration",
        "effects": [
          {
            "condition": "When repairing Souha war machines",
            "target": "War machine repair",
            "effect": "Currency Cost Down 2.8%",
            "duration": null
          }
        ]
      },
      {
        "name_en": "Repair Material Reduction – Medium Improved",
        "name_jp": "修理資材減少・中改",
        "type": "Administration",
        "effects": [
          {
            "condition": "When repairing Souha war machines",
            "target": "War machine repair",
            "effect": "Material Cost Down 5.5%",
            "duration": null
          }
        ]
      }
    ]
  }
]
'@ -Encoding UTF8

Write-Host "All files updated!" -ForegroundColor Green