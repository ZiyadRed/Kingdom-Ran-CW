import { describe, expect, it } from 'vitest'
import sourceSkillMap from '../data/source/cw_skills.map.json'
import japaneseSkills from '../data/generated/ja/skills.json'
import {
  ALL,
  BUFF_APPLICABILITY,
  calcCharBuffs,
  calcTeamEnemyDebuffs,
  findCharByName,
  getMultiplier,
  isTargetedBy,
  parseBuffEffect,
  parseTargetMechanics,
  rosterCriterionMatches,
  rosterHasCriterion,
} from './core.jsx'
import { localizedSkill } from './i18n/data.js'

const real = (name) => {
  const character = findCharByName(name)
  expect(character, `missing real character ${name}`).toBeTruthy()
  return character
}

const withOnlySkill = (character, skillName) => {
  const skill = character.skills.find((entry) => entry.name_en === skillName)
  expect(skill, `missing real skill ${skillName}`).toBeTruthy()
  return { ...character, skills: [skill] }
}

const withoutSkills = (character) => ({ ...character, skills: [] })

describe('source-derived calculation truth set', () => {
  it('pins the stable source identities and canonical Japanese evidence for F01/F02', () => {
    expect(sourceSkillMap.skills['shin#1']).toMatchObject({ characterId: 38, skillId: 142, sourceNameJp: '飛信隊の剣', status: 'exact' })
    expect(sourceSkillMap.skills['shunshinkun#2']).toMatchObject({ characterId: 121, skillId: 382, sourceNameJp: '稀代の指導者', status: 'exact' })
    expect(sourceSkillMap.skills['makou#1']).toMatchObject({ characterId: 255, skillId: 791, sourceNameJp: '王翦軍第二将', status: 'exact' })
    expect(sourceSkillMap.skills['ka#1']).toMatchObject({ characterId: 240, skillId: 734, sourceNameJp: '希望の光', status: 'exact' })
    expect(sourceSkillMap.skills['kishou#2']).toMatchObject({ characterId: 218, skillId: 529, sourceNameJp: '想いの継承', status: 'exact' })
    expect(sourceSkillMap.skills['naki#2']).toMatchObject({ characterId: 204, skillId: 500, sourceNameJp: '静かなる威圧', status: 'exact' })
    expect(sourceSkillMap.skills['ryofui#2']).toMatchObject({ characterId: 79, skillId: 444, sourceNameJp: '人の世の掌握', status: 'exact' })
    expect(sourceSkillMap.skills['kakukai#0']).toMatchObject({ characterId: 203, skillId: 452, sourceNameJp: '急所一閃【橙亀】', status: 'exact' })
    expect(sourceSkillMap.skills['kyouen#3']).toMatchObject({ characterId: 83, skillId: 576, sourceNameJp: '正鵠を射る☆6', status: 'resolved' })
    expect(sourceSkillMap.skills['yotanwa#3']).toMatchObject({ characterId: 68, skillId: 741, sourceNameJp: '山界ノ統一☆6', status: 'resolved' })
    expect(sourceSkillMap.skills['rien#2']).toMatchObject({ characterId: 198, skillId: 478, sourceNameJp: '暗躍する影', status: 'exact' })
    expect(sourceSkillMap.skills['chouin#2']).toMatchObject({ characterId: 161, skillId: 636, sourceNameJp: '後任の責務', status: 'exact' })
    expect(sourceSkillMap.skills['kouyoku#1']).toMatchObject({ characterId: 158, skillId: 432, sourceNameJp: '莫邪の呪い', status: 'exact' })
    expect(japaneseSkills.skills['142'].desc).toContain('自身以外の味方秦国武将1名につき')
    expect(japaneseSkills.skills['382'].desc).toContain('秦国武将に対する攻撃力と防御力が30%上昇')
    expect(japaneseSkills.skills['791'].desc).toContain('敵弓兵武将が生存している場合')
    expect(japaneseSkills.skills['734'].desc).toContain('敵武将が生存している場合、生存している味方趙国武将の体力を30%回復')
    expect(japaneseSkills.skills['529'].desc).toContain('味方「{-1:207}」が生存している場合')
    expect(japaneseSkills.skills['500'].desc).toContain('70%の確率で敵趙国、魏国武将に「体力回復無効」状態')
    expect(japaneseSkills.skills['444'].desc).toContain('敵「李牧」「嬴政」「太后」に「攻撃封印」状態')
    expect(japaneseSkills.skills['452'].desc).toContain('100%の確率で「李牧」に「攻撃封印」状態')
    expect(japaneseSkills.skills['576'].desc).toContain('自身と味方「{-1:78}」のクリティカルダメージが20%上昇')
    expect(japaneseSkills.skills['741'].desc).toContain('自身の趙国、魏国武将に対する攻撃力が20%上昇')
    expect(japaneseSkills.skills['478'].desc).toContain('100%の確率で敵騎兵武将に「体力回復無効」状態')
    expect(japaneseSkills.skills['636'].desc).toContain('70%の確率で「毒」状態の敵全武将に「体力回復無効」状態')
    expect(japaneseSkills.skills['432'].desc).toContain('50%の確率で敵全武将に「体力回復無効」状態')
  })

  it('counts Shin\'s other Qin allies independent of harmless bracket and whitespace formatting', () => {
    const shin = real('Shin')
    const makou = real('Makou')
    const variants = [
      'Per other ally [Qin] [General]',
      'Per other ally [Qin][General]',
      'Per other ally Qin General',
      '  Per   other   ally   [Qin]   [General]  ',
    ]
    expect(variants.map((condition) => getMultiplier(condition, shin, [shin, makou]))).toEqual([1, 1, 1, 1])
  })

  it('makes eligible ally counts monotonic, ignores ineligible allies, and excludes self', () => {
    const shin = withOnlySkill(real('Shin'), 'Sword of the Hishin Unit')
    const makou = withoutSkills(real('Makou'))
    const akou = withoutSkills(real('Akou'))
    const gokei = withoutSkills(real('Gokei'))
    const enemy = [withoutSkills(real('Hakurei'))]
    expect(calcCharBuffs(shin, [shin, makou], enemy, false).ATK.up).toBe(5)
    expect(calcCharBuffs(shin, [shin, makou, gokei], enemy, false).ATK.up).toBe(5)
    expect(calcCharBuffs(shin, [shin, makou, akou], enemy, false).ATK.up).toBe(10)

    const eiki = real('Eiki')
    expect(getMultiplier('Per ally Ousen Army [General] besides self', eiki, [eiki])).toBe(0)
    expect(getMultiplier('Per ally Ousen Army [General] besides self', eiki, [eiki, makou])).toBe(1)
  })

  it('preserves Shunshinkun\'s Qin matchup restriction through deferred compound parsing', () => {
    const shunshinkun = withOnlySkill(real('Shunshinkun'), 'Peerless Leader')
    const target = withoutSkills(real('Gokei'))
    const qinEnemy = [withoutSkills(real('Shin'))]
    const weiEnemy = [withoutSkills(real('Gohoumei'))]
    const vsQin = calcCharBuffs(target, [shunshinkun, target], qinEnemy, false)
    const vsWei = calcCharBuffs(target, [shunshinkun, target], weiEnemy, false)
    expect(vsQin.ATK.up).toBe(30)
    expect(vsQin.DEF.up).toBe(30)
    expect(vsWei.ATK).toBeUndefined()
    expect(vsWei.DEF).toBeUndefined()
  })

  it('counts Makou with an enemy Archer, records survival, and excludes a known mismatch', () => {
    const makou = withOnlySkill(real('Makou'), "Second General of Ousen's Army")
    const target = withoutSkills(real('Shin'))
    const archer = withoutSkills(real('Hakurei'))
    const nonArcher = withoutSkills(real('Karin'))
    expect(archer.unit_type).toBe('Archer')
    expect(nonArcher.unit_type).not.toBe('Archer')
    const qualifying = calcCharBuffs(target, [makou, target], [archer], false)
    const nonQualifying = calcCharBuffs(target, [makou, target], [nonArcher], false)
    expect(qualifying['Hit Rate'].up).toBe(30)
    expect(qualifying['Hit Rate'].potentialUp).toBe(0)
    expect(qualifying['Hit Rate'].sources[0].survivalCaveats).toHaveLength(1)
    expect(qualifying['Hit Rate'].sources[0].applicability).toBe(BUFF_APPLICABILITY.APPLICABLE)
    expect(nonQualifying['Hit Rate']).toBeUndefined()
    const missing=calcCharBuffs(target,[makou,target],[],false)
    expect(missing['Hit Rate']).toBeUndefined()
    expect(missing.meta.missingInputs).toEqual([expect.objectContaining({stat:'Hit Rate',missingInputs:[{kind:'opposingFormation'}]})])
  })

  it('treats anti-faction alternatives as one modifier and anti-unit restrictions as matchups', () => {
    const yotanwa = withOnlySkill(real('Yotanwa'), 'Unification of the Mountain World')
    const zhao = withoutSkills(real('Riboku'))
    const wei = withoutSkills(real('Gokei'))
    const qin = withoutSkills(real('Shin'))
    expect(calcCharBuffs(yotanwa, [yotanwa], [zhao], true).ATK.up).toBe(20)
    expect(calcCharBuffs(yotanwa, [yotanwa], [wei], true).ATK.up).toBe(20)
    expect(calcCharBuffs(yotanwa, [yotanwa], [zhao, wei], true).ATK.up).toBe(20)
    expect(calcCharBuffs(yotanwa, [yotanwa], [qin], true).ATK).toBeUndefined()

    const gokei = withOnlySkill(real('Gokei'), 'Passion for Conquest')
    const cavalry = withoutSkills(real('Ouhon'))
    const archer = withoutSkills(real('Hakurei'))
    expect(calcCharBuffs(gokei, [gokei], [cavalry], true).ATK.up).toBe(30)
    expect(calcCharBuffs(gokei, [gokei], [cavalry], true).DEF.up).toBe(30)
    expect(calcCharBuffs(gokei, [gokei], [archer], true).ATK).toBeUndefined()
  })

  it('treats effect-level Ally recipients as additional targets, not formatting-based intersections', () => {
    const kyouen = withOnlySkill(real('Kyouen'), 'Heavy Pursuit [Orange Turtle]')
    const cavalry = withoutSkills(real('Ouhon'))
    expect(calcCharBuffs(kyouen, [kyouen, cavalry], [], false, false, true).DEF.up).toBe(20)
    expect(calcCharBuffs(cavalry, [kyouen, cavalry], [], false, false, true).DEF.up).toBe(20)

    const bikou = withOnlySkill(real('Bikou'), 'Status Resistance [Red Ox]')
    const infantry = withoutSkills(real('Shoutaku'))
    const shield = withoutSkills(real('Gokei'))
    expect(infantry.unit_type).toBe('Infantry')
    expect(shield.unit_type).toBe('Shield')
    for (const target of [infantry, shield]) {
      const buffs = calcCharBuffs(target, [bikou, infantry, shield], [], false, false, true)
      expect(buffs['Confusion Resistance'].up).toBe(50)
      expect(buffs['Burn Resistance'].up).toBe(50)
      expect(buffs.DEF.up).toBe(10)
    }
  })

  it('exhaustively verifies every effect-level Ally scope as a source-backed recipient union', () => {
    const expectedRows = [
      'bikou#0:0', 'bikou#0:1', 'denei#0:1', 'denyuu#0:1', 'en#0:0', 'en#0:1',
      'hyouki#0:0', 'hyouki#0:1', 'kou2#0:1', 'kyouen#0:1', 'kyougai#0:0',
      'roen#0:1', 'seki#0:1', 'taijifu#0:1',
    ]
    const sourceUnions = {
      'bikou#0': '味方歩兵武将と盾兵武将',
      'denei#0': '味方歩兵武将と盾兵武将',
      'denyuu#0': '味方歩兵武将と騎兵武将',
      'en#0': '味方歩兵武将と盾兵武将',
      'hyouki#0': '味方騎兵武将と弓兵武将',
      'kou2#0': '味方歩兵武将と盾兵武将',
      'kyouen#0': '自身と味方騎兵武将',
      'kyougai#0': '味方歩兵武将と弓兵武将',
      'roen#0': '味方歩兵武将と盾兵武将',
      'seki#0': '味方歩兵武将と弓兵武将',
      'taijifu#0': '味方歩兵武将と騎兵武将',
    }
    for (const [sourceKey, sourceText] of Object.entries(sourceUnions)) {
      const source = sourceSkillMap.skills[sourceKey]
      expect(source?.status, `source mapping ${sourceKey}`).toBe('exact')
      expect(japaneseSkills.skills[String(source.skillId)].desc, sourceKey).toContain(sourceText)
    }

    const scopedRows = []
    for (const owner of ALL) {
      for (const [skillIndex, skill] of (owner.skills || []).entries()) {
        for (const [effectIndex, effect] of (skill.effects || []).entries()) {
          if (/^Ally\s+\[/i.test(effect.effect || '')) scopedRows.push({ owner, skill, skillIndex, effect, effectIndex })
        }
      }
    }
    expect(scopedRows.map(({ owner, skillIndex, effectIndex }) => `${owner.id}#${skillIndex}:${effectIndex}`).sort()).toEqual(expectedRows.sort())

    for (const { owner, skill, effect } of scopedRows) {
      const modifiers = parseBuffEffect(effect.effect)
      expect(modifiers.length, `${owner.id}: ${effect.effect}`).toBeGreaterThan(0)
      expect(modifiers.every((modifier) => modifier.recipientCriteria), `${owner.id}: recipient criteria`).toBe(true)

      const base = ALL.find((candidate) => isTargetedBy(effect.target, candidate, owner, [owner, candidate]))
      const recipient = ALL.find((candidate) =>
        modifiers.some((modifier) => rosterCriterionMatches(candidate, modifier.recipientCriteria, owner, false)) &&
        !isTargetedBy(effect.target, candidate, owner, [owner, candidate]))
      expect(base, `${owner.id}: base recipient`).toBeTruthy()
      expect(recipient, `${owner.id}: supplemental recipient`).toBeTruthy()

      const opponentCriteria = modifiers.find((modifier) => modifier.opponentCriteria)?.opponentCriteria
      const opponent = opponentCriteria
        ? ALL.find((candidate) => rosterHasCriterion([candidate], opponentCriteria))
        : null
      const scopedOwner = { ...owner, skills: [{ ...skill, effects: [effect] }], roleSkill: null }
      for (const candidate of [base, recipient]) {
        const target = candidate.id === owner.id ? scopedOwner : withoutSkills(candidate)
        const team = target.id === scopedOwner.id ? [scopedOwner] : [scopedOwner, target]
        const stats = calcCharBuffs(target, team, opponent ? [withoutSkills(opponent)] : [], false, false, true)
        for (const modifier of modifiers) {
          const bucket = stats[modifier.stat]
          expect(bucket, `${owner.id}: ${candidate.id}: ${modifier.stat}`).toBeTruthy()
          expect(modifier.dir === 'Up' ? bucket.up : bucket.down).toBeGreaterThan(0)
        }
      }
    }
  })

  it('preserves opponent restrictions carried by the condition field', () => {
    const rouai = withOnlySkill(real('Rouai'), 'Vainglory of the Ai King')
    const qin = [withoutSkills(real('Shin'))]
    const wei = [withoutSkills(real('Gokei'))]
    expect(calcCharBuffs(rouai, [rouai], qin, false).DEF.up).toBe(20)
    expect(calcCharBuffs(rouai, [rouai], wei, false).DEF).toBeUndefined()
  })

  it('evaluates ally-target and enemy-target matchup qualifiers against the correct opposing roster', () => {
    const ouhon = withOnlySkill(real('Ouhon'), 'New Generation Rivalry')
    const cavalry = withoutSkills(real('Kanjou'))
    const archer = withoutSkills(real('Hakurei'))
    expect(calcCharBuffs(ouhon, [ouhon], [cavalry], false).DEF.up).toBe(30)
    expect(calcCharBuffs(ouhon, [ouhon], [archer], false).DEF).toBeUndefined()

    const wategi = withOnlySkill(real('Wategi'), 'Grudge of the Fallen Nation')
    const qinAlly = withoutSkills(real('Shin'))
    const qinEnemy = [withoutSkills(real('Makou'))]
    expect(calcTeamEnemyDebuffs([wategi], qinEnemy)['Enemy Qin']).toBeUndefined()
    expect(calcTeamEnemyDebuffs([wategi, qinAlly], qinEnemy)['Enemy Qin'].down.DEF).toBe(30)

    const kanjou = withOnlySkill(real('Kanjou'), 'DEF Reduction [Red Sheep]')
    const defender = [withoutSkills(real('Gokei'))]
    const debuffs = calcTeamEnemyDebuffs([kanjou], defender)
    expect(debuffs['Enemy generals'].down.DEF).toBe(40)
  })

  it('keeps multi-faction enemy recipients as one honest OR-labelled target', () => {
    const ouken = withOnlySkill(real('Ouken'), 'Deal Concluded')
    const zhao = [withoutSkills(real('Riboku'))]
    const qin = [withoutSkills(real('Shin'))]
    const target = 'Enemy [Zhao] / [Wei] / [Chu] / [Han] / [Yan]'

    expect(calcTeamEnemyDebuffs([ouken], zhao)[target].down.Evasion).toBe(20)
    expect(calcTeamEnemyDebuffs([ouken], qin)[target]).toBeUndefined()
  })

  it('matches an exact named recipient without widening it to that general\'s army', () => {
    const kyouen = withOnlySkill(real('Kyouen'), 'On Target')
    const renpa = withoutSkills(real('Renpa'))
    const rinko = withoutSkills(real('Rinko'))
    const enemy = [withoutSkills(real('Gokei'))]

    expect(calcCharBuffs(renpa, [kyouen, renpa], enemy, false)['Critical Damage'].up).toBe(20)
    expect(calcCharBuffs(rinko, [kyouen, rinko], enemy, false)['Critical Damage']).toBeUndefined()
  })

  it('parses source-backed seal percentages and named embedded enemy recipients', () => {
    expect(parseBuffEffect('HP Seal 70%')[0]).toMatchObject({
      stat: 'HP Recovery Nullification', dir: 'Up', val: 70,
    })
    expect(parseBuffEffect('"Normal Attack Seal"50%')[0]).toMatchObject({
      stat: 'Normal Attack Seal', dir: 'Up', val: 50,
    })

    const naki = withOnlySkill(real('Naki'), 'Silent Intimidation')
    const zhao = [withoutSkills(real('Riboku'))]
    const qin = [withoutSkills(real('Shin'))]
    expect(calcTeamEnemyDebuffs([naki], zhao, true).meta.conditionalEffects).toEqual([
      expect.objectContaining({stat:'HP Recovery Nullification',valueMeaning:{kind:'chance',rate:70}}),
    ])
    expect(calcTeamEnemyDebuffs([naki], qin, true)['Enemy [Zhao] / [Wei]']).toBeUndefined()

    const ryofui = withOnlySkill(real('Ryofui'), 'Dominion Over the World')
    const namedTarget = 'Enemy Riboku / Ei Sei / Queen Biki'
    expect(calcTeamEnemyDebuffs([ryofui], zhao, true).meta.conditionalEffects).toEqual(expect.arrayContaining([
      expect.objectContaining({stat:'Attack Seal',valueMeaning:{kind:'chance',rate:70}}),
    ]))
    expect(calcTeamEnemyDebuffs([ryofui], [withoutSkills(real('Gokei'))], true)[namedTarget]).toBeUndefined()

    const kakukai = withOnlySkill(real('Kakukai'), 'Weak Point Flash [Orange Turtle]')
    expect(calcTeamEnemyDebuffs([kakukai], zhao, true).meta.conditionalEffects).toEqual(expect.arrayContaining([
      expect.objectContaining({stat:'Attack Seal',valueMeaning:{kind:'chance',rate:100}}),
    ]))
    expect(calcTeamEnemyDebuffs([kakukai], [withoutSkills(real('Gokei'))], true)['Enemy Riboku']).toBeUndefined()

    const chouin = withOnlySkill(real('Chouin'), "Successor's Duty")
    const poisoned = calcTeamEnemyDebuffs([chouin], [withoutSkills(real('Gokei'))], true)
    expect(poisoned['All poisoned enemy [General]']).toBeUndefined()
    expect(poisoned.meta.conditionalEffects).toEqual(expect.arrayContaining([
      expect.objectContaining({stat:'HP Recovery Nullification',runtimeRequirements:expect.arrayContaining([expect.objectContaining({kind:'targetState'})])}),
    ]))
  })

  it('discloses a source-backed qualitative effect whose numeric value is unavailable', () => {
    const shikika = withOnlySkill(real('Shikika'), 'Beauty of Daliang')
    const buffs = calcCharBuffs(shikika, [shikika], [], false)
    expect(buffs['Damage Received']).toBeUndefined()
    expect(buffs.meta.unsupported).toEqual([
      expect.objectContaining({ stat: 'Damage Received', reasons: ['effect-value'] }),
    ])
  })

  it('keeps formation side conditions deterministic and battle-state conditions out of guaranteed totals', () => {
    const shin = withOnlySkill(real('Shin'), 'Fierce General Flash [Yellow Turtle]')
    const makou = withoutSkills(real('Makou'))
    expect(calcCharBuffs(makou, [shin, makou], [], false, false, true).ATK.up).toBe(10)
    expect(calcCharBuffs(makou, [shin, makou], [], true, false, true).ATK).toBeUndefined()

    const rouai = withOnlySkill(real('Rouai'), 'Vainglory of the Ai King')
    expect(calcCharBuffs(rouai, [rouai], [], false).Guard).toBeUndefined()
    expect(calcCharBuffs(rouai, [rouai], [], true).Guard.up).toBe(60)

    const gokei = withOnlySkill(real('Gokei'), 'Unwavering Resolution')
    const gohoumei = withoutSkills(real('Gohoumei'))
    const hpDependent = calcCharBuffs(gohoumei, [gokei, gohoumei], [], false, false, true)
    expect(hpDependent.ATK.up).toBe(0)
    expect(hpDependent.ATK.potentialUp).toBe(30)
  })

  it('treats named formation presence and survival-only planning as composition', () => {
    const kaine = withOnlySkill(real('Kaine'), "Lieutenant's Wisdom")
    const riboku = withoutSkills(real('Riboku'))
    const zhaoTarget = withoutSkills(real('Ka'))
    expect(calcCharBuffs(zhaoTarget, [kaine, zhaoTarget], [], false)['Max Morale']).toBeUndefined()
    expect(calcCharBuffs(zhaoTarget, [kaine, zhaoTarget, riboku], [], false)['Max Morale'].up).toBe(50)

    const eiki = withOnlySkill(real('Eiki'), 'Inherited Trust')
    const akou = withoutSkills(real('Akou'))
    const withSurvivor = calcTeamEnemyDebuffs([eiki, akou], [], false, false)
    expect(withSurvivor['All enemies'].down.DEF).toBe(20)
    expect(withSurvivor['All enemies'].sources['down|DEF'][0].survivalCaveats).toHaveLength(1)
  })

  it('counts supported survival clauses and preserves Kishou atomic identities', () => {
    const ka = withOnlySkill(real('Ka'), 'Light of Hope')
    const zhaoTarget = withoutSkills(real('Kaine'))
    const enemy = [withoutSkills(real('Shin'))]
    const recovery = calcCharBuffs(zhaoTarget, [ka, zhaoTarget], enemy, false)
    expect(recovery['HP Recovery'].up).toBe(30)
    expect(recovery['HP Recovery'].sources[0].survivalCaveats).toHaveLength(2)
    expect(recovery.meta.unsupported).toHaveLength(0)

    // Source skill 529 binds its three stats to different named allies.
    const kishou = withOnlySkill(real('Kishou'), 'Inheritance of Will')
    const kisui = withoutSkills(real('Kisui'))
    const debuffs = calcTeamEnemyDebuffs([kishou, kisui], enemy)
    expect(debuffs['All enemies'].down).toEqual({ATK:20})
    expect(calcTeamEnemyDebuffs([kishou,withoutSkills(real('Batei'))],enemy)['All enemies'].down).toEqual({'Critical Damage':20})
    expect(calcTeamEnemyDebuffs([kishou,withoutSkills(real('Ryuuto'))],enemy)['All enemies'].down).toEqual({'Critical Rate':20})
    expect(debuffs.meta.unsupported).toHaveLength(0)
  })

  it('honors all-versus-any named-alive formation requirements in composition', () => {
    const kisui = withOnlySkill(real('Kisui'), 'Rigan Bond [Heart]')
    const batei = withoutSkills(real('Batei'))
    const ryuuto = withoutSkills(real('Ryuuto'))

    const oneAlly = calcCharBuffs(kisui, [kisui, batei], [], false, false, true)
    expect(oneAlly.Guard.up).toBe(60)
    expect(oneAlly['Attack Nullification']).toBeUndefined()

    const bothAllies = calcCharBuffs(kisui, [kisui, batei, ryuuto], [], false, false, true)
    expect(bothAllies.Guard.up).toBe(60)
    expect(bothAllies['Attack Nullification'].up).toBe(1)
  })
})

describe('calculation metamorphic invariants', () => {
  it('normalizes equivalent opponent punctuation into the same mechanical criterion', () => {
    const effects = ['ATK Up vs Qin 30%', 'ATK Up vs. Qin 30%', 'ATK Up versus Qin 30%', 'ATK Up against Qin 30%']
    expect(effects.map((effect) => parseBuffEffect(effect)[0].opponentCriteria.criteria[0])).toEqual([
      { kind: 'faction', id: 'qin', raw: 'Qin' },
      { kind: 'faction', id: 'qin', raw: 'Qin' },
      { kind: 'faction', id: 'qin', raw: 'Qin' },
      { kind: 'faction', id: 'qin', raw: 'Qin' },
    ])
    expect(['Self vs cavalry', 'Self versus cavalry', 'Self against cavalry'].map(parseTargetMechanics).map((value) => value.opponentCriteria.criteria[0].id)).toEqual(['Cavalry', 'Cavalry', 'Cavalry'])
  })

  it('keeps mechanics identical when the same source skills are decorated for EN/JA/AR/FR', () => {
    const original = real('Shunshinkun')
    const target = withoutSkills(real('Gokei'))
    const enemy = [withoutSkills(real('Shin'))]
    const results = ['en', 'ja', 'ar', 'fr'].map((locale) => {
      const localizedOwner = {
        ...original,
        skills: original.skills.map((skill, index) => ({
          ...skill,
          displayEffects: localizedSkill(skill, original.id, index, locale).displayEffects,
        })),
      }
      const calculated = calcCharBuffs(target, [localizedOwner, target], enemy, false)
      return { atk: calculated.ATK?.up, def: calculated.DEF?.up }
    })
    expect(results).toEqual(Array(4).fill({ atk: 30, def: 30 }))
  })
})
