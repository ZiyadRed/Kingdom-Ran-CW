import {describe,it,expect} from 'vitest'
import {FACTIONS} from './core.jsx'
import {ARCHIVE_QUERY_LIMIT,archiveStateSearch,readArchiveUrlState} from './archive-url-state.js'
const factions=FACTIONS.map(f=>f.id)
describe('validated Archive URL state',()=>{
  it('round-trips literal multi-script text and faction without changing search terms',()=>{
    for(const query of ['王騎','مُوبُو','fantassins',' Moubu & Qin + 20% ']){
      const state={query,faction:'zhao'}
      expect(readArchiveUrlState(archiveStateSearch(state),factions)).toEqual(state)
    }
  })
  it('accepts every authored faction and preserves a direct detail default',()=>{
    for(const faction of factions) expect(readArchiveUrlState(`?faction=${faction}`,factions).faction).toBe(faction)
    expect(readArchiveUrlState('',factions,'chu')).toEqual({query:'',faction:'chu'})
  })
  it('fails malformed, repeated, control-character and overlong fields closed',()=>{
    for(const query of ['?q=one&q=two','?q=%00Moubu','?q=%ff','?q='+('a'.repeat(ARCHIVE_QUERY_LIMIT+1))]) expect(readArchiveUrlState(query,factions).query).toBe('')
    for(const search of ['?faction=unknown','?faction=qin&faction=zhao','?faction=__proto__']) expect(readArchiveUrlState(search,factions).faction).toBe('qin')
    expect(readArchiveUrlState('?q=Moubu&faction=unknown',factions)).toEqual({query:'Moubu',faction:'qin'})
  })
  it('keeps default faction explicit so Back cannot restore a later session bookmark',()=>{
    expect(archiveStateSearch({query:'',faction:'qin'})).toBe('?faction=qin')
  })
})
