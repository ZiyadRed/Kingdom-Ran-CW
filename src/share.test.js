import { describe, it, expect } from 'vitest'
import { formatCharacterSkillsShare, formatTeamBuffShare, limitDiscordMessage } from './share.js'

describe('Discord share formatting', () => {
  it('formats character skills with condition labels instead of IF text', () => {
    const text=formatCharacterSkillsShare({
      id:'test-general',
      name_en:'Test General',
      name_jp:'テスト',
      country:'qin',
      unit_type:'Cavalry',
      skills:[{
        name_en:'Opening Strike',
        name_jp:'開幕',
        type:'Combat',
        effects:[{
          condition:'When Attacking, enemy [General] with highest ATK',
          target:'1 enemy [General]',
          effect:'150% Damage',
          duration:null,
        }],
      }],
    })
    expect(text).toContain('**RanHQ Skills: Test General**')
    expect(text).toContain('1 enemy [General] -> 150% Damage | When: When Attacking; Target: enemy [General] with highest ATK')
    expect(text).not.toContain('IF')
  })

  it('formats team buff summaries from already-computed buff objects', () => {
    const text=formatTeamBuffShare({
      atk:[{name_en:'A'},{name_en:'B'}],
      def:[{name_en:'C'}],
      atkBuffs:[{general:{name_en:'A'},buffs:{ATK:{up:30,down:0},Guard:{up:60,down:0}}}],
      defBuffs:[],
      atkEnemyDebuffs:{'Enemy Cavalry':{up:{},down:{ATK:20},sources:{}}},
      defEnemyDebuffs:{},
      specialStats:new Set(['Guard']),
      statSortKey:stat=>['ATK','Guard'].indexOf(stat),
      url:'https://ranhq.vercel.app/builder',
    })
    expect(text).toContain('Team: 1. A / 2. B')
    expect(text).toContain('- A: ATK +30%, Guard 60x')
    expect(text).toContain('- Enemy debuff on Enemy Cavalry: ATK -20%')
  })

  it('keeps truncated messages within the configured limit and preserves the link', () => {
    const text=limitDiscordMessage(['Header', ...Array.from({length:20},(_,i)=>`Line ${i} abcdefghijklmnop`)].join('\n'),'https://ranhq.vercel.app/archive/characters/ouhon',120)
    expect(text.length).toBeLessThanOrEqual(120)
    expect(text).toContain('Full details: <https://ranhq.vercel.app/archive/characters/ouhon>')
  })
})
