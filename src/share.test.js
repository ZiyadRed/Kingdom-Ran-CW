import { describe, it, expect } from 'vitest'
import { DEFAULT_SHARE_LABELS, builderShareUrl, characterShareUrl, formatCharacterSkillsShare, formatSceneCardShare, formatTeamBuffShare, limitDiscordMessage, sceneCardShareUrl, teamImagePresentationLayout } from './share.js'
import { renderArabicText } from './i18n/ar-render.js'

describe('Discord share formatting', () => {
  it('mirrors Arabic team columns and header anchors without changing logical slot order', () => {
    const ltr=teamImagePresentationLayout({count:4,direction:'ltr'})
    const rtl=teamImagePresentationLayout({count:4,direction:'rtl'})
    expect(ltr.columnX[0]).toBeLessThan(ltr.columnX[3])
    expect(rtl.columnX[0]).toBeGreaterThan(rtl.columnX[3])
    expect(rtl.columnX).toEqual([...ltr.columnX].reverse())
    expect(rtl.primaryAnchor).toEqual({x:1772,align:'right'})
    expect(rtl.secondaryAnchor).toEqual({x:28,align:'left'})
  })

  it('keeps generated share links in the active locale', () => {
    expect(characterShareUrl({ id: 'ouhon' }, 'ja')).toBe('https://ranhq.vercel.app/ja/archive/characters/ouhon')
    expect(builderShareUrl('ar')).toBe('https://ranhq.vercel.app/ar/builder')
    expect(sceneCardShareUrl('ja')).toBe('https://ranhq.vercel.app/ja/archive/cw6-scene-cards')
  })

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
    expect(text).toContain('1 enemy [General] -> 150% Damage | When: Attacking; Target: enemy [General] with highest ATK')
    expect(text).not.toContain('IF')
  })

  it('includes a character\'s eligible role skill in archive shares', () => {
    const text=formatCharacterSkillsShare({
      id:'kisui',
      name_en:'Kisui',
      name_jp:'紀彗',
      country:'zhao',
      unit_type:'Cavalry',
      skills:[],
      roleSkill:{
        name_en:'United in Strength and Purpose',
        name_jp:'戮力協心',
        type:'Leader',
        roleSkill:true,
        effects:[{target:'Ally Kisui Army',effect:'ATK Up 20%, DEF Up 60%',duration:null}],
      },
    })
    expect(text).toContain('**1. United in Strength and Purpose [Leader]**')
    expect(text).toContain('- Ally Kisui Army -> ATK Up 20%, DEF Up 60%')
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

  it('uses the active locale resolver for dynamic buff-summary terms', () => {
    const text=formatTeamBuffShare({
      atk:[{name_en:'A'}],
      def:[],
      atkBuffs:[{
        general:{name_en:'A'},
        buffs:{
          'ATK Down Resistance':{up:30,down:0},
          'DEF Down Resistance':{up:20,down:0},
          'Confusion Infliction Rate':{up:50,down:0},
        },
      }],
      defBuffs:[],
      atkEnemyDebuffs:{'All enemies':{up:{},down:{ATK:20},sources:{}}},
      defEnemyDebuffs:{},
      specialStats:new Set(),
      statSortKey:()=>0,
      labels:{
        enemyDebuffOn:'إضعاف العدو على',
        localizeTerm:renderArabicText,
      },
    })
    expect(text).toContain('مقاومة خفض الهجوم +30%')
    expect(text).toContain('مقاومة خفض الدفاع +20%')
    expect(text).toContain('معدل إلحاق الارتباك +50%')
    expect(text).toContain('إضعاف العدو على جميع الأعداء: الهجوم -20%')
    expect(text).not.toMatch(/ATK Down Resistance|DEF Down Resistance|Confusion Infliction Rate|All enemies/)
  })

  it('formats CW6 scene cards with the archive link and skill effects', () => {
    const text=formatSceneCardShare({
      ownerName:'Rien',
      skill_en:'Building a Strong Nation',
      skill_jp:'強国構築☆6',
      skill:{
        name_en:'Building a Strong Nation',
        name_jp:'強国構築☆6',
        type:'Strategy',
        star6:true,
        effects:[{target:'Self',effect:'ATK Up 30%',duration:null}],
      },
    })
    expect(text).toContain('**RanHQ CW6 Scene Card: Building a Strong Nation**')
    expect(text).toContain('Rien - Strategy - 6-star')
    expect(text).toContain('<https://ranhq.vercel.app/archive/cw6-scene-cards>')
    expect(text).toContain('- Self -> ATK Up 30%')
  })

  it('keeps truncated messages within the configured limit and preserves the link', () => {
    const text=limitDiscordMessage(['Header', ...Array.from({length:20},(_,i)=>`Line ${i} abcdefghijklmnop`)].join('\n'),'https://ranhq.vercel.app/archive/characters/ouhon',120)
    expect(text.length).toBeLessThanOrEqual(120)
    expect(text).toContain('Full details: <https://ranhq.vercel.app/archive/characters/ouhon>')
  })

  it('uses the caller’s labels and localized effects in share output', () => {
    // A share image or Discord message is user-visible output, so its chrome
    // must follow the page locale rather than always being English.
    const labels = {
      ...DEFAULT_SHARE_LABELS,
      noEffects: 'لا توجد تأثيرات مترجمة بعد.',
      teamBuffSummary: 'ملخص تعزيزات فريق RanHQ',
      attackingFormation: 'تشكيلة الهجوم',
      defendingFormation: 'تشكيلة الدفاع',
      noGenerals: 'لم يُحدد أي جنرال',
      team: 'الفريق',
    }

    const character = formatCharacterSkillsShare({
      id: 'test', name_en: 'Test', skills: [{ name_en: 'A', effects: [] }],
    }, { labels })
    expect(character).toContain(labels.noEffects)
    expect(character).not.toContain('No translated effects yet.')

    const team = formatTeamBuffShare({ labels })
    expect(team).toContain(labels.teamBuffSummary)
    expect(team).toContain(labels.attackingFormation)
    expect(team).toContain(labels.noGenerals)
    expect(team).not.toContain('Attacking Formation')
  })

  it('prefers the localized displayName and displayEffects when present', () => {
    const text = formatCharacterSkillsShare({
      id: 'renpa',
      name_en: 'Renpa',
      displayName: 'Renpa',
      skills: [{
        name_en: 'Golden Strike',
        displayName: 'Golden Strike',
        effects: [{ target: 'Self', effect: 'DEF Penetration Up 20%' }],
        displayEffects: [{ target: 'الذات', effect: 'زيادة اختراق الدفاع 20%' }],
      }],
    })
    expect(text).toContain('زيادة اختراق الدفاع 20%')
    expect(text).not.toContain('DEF Penetration Up 20%')
  })
})

describe('source name pairing in share output', () => {
  /**
   * The Japanese line under a name pairs the localized name with the game's
   * own. In Japanese output those are the same string, so emitting both
   * printed the skill name twice in the shared image and Discord text.
   */
  const japaneseCharacter = {
    id: 'test-general',
    name_en: 'Test General',
    name_jp: '試験武将',
    displayName: '試験武将',
    country: 'qin',
    unit_type: 'Infantry',
    skills: [{
      name_en: 'Heavy Pursuit',
      name_jp: '重追撃【緑牛】',
      displayName: '重追撃【緑牛】',
      type: 'Combat',
      effects: [{ target: '1 enemy [General]', effect: '150% Damage' }],
    }],
  }

  it('does not repeat the name when the localized name is the source name', () => {
    const text = formatCharacterSkillsShare(japaneseCharacter)
    expect(text).toContain('重追撃【緑牛】')
    expect(text.match(/重追撃【緑牛】/g)).toHaveLength(1)
    expect(text.match(/試験武将/g)).toHaveLength(1)
  })

  it('still pairs both names when they differ, as English and Arabic do', () => {
    const englishCharacter = { ...japaneseCharacter, displayName: undefined, skills: [{ ...japaneseCharacter.skills[0], displayName: undefined }] }
    const text = formatCharacterSkillsShare(englishCharacter)
    expect(text).toContain('Heavy Pursuit')
    expect(text).toContain('重追撃【緑牛】')
    expect(text).toContain('試験武将')
  })
})
