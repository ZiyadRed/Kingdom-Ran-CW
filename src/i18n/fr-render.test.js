import { describe, expect, it } from 'vitest'
import {
  renderFrenchCondition,
  renderFrenchDuration,
  renderFrenchEffect,
  renderFrenchTarget,
  renderFrenchTerm,
  renderFrenchText,
} from './fr-render.js'

/**
 * Pins the phrasings the French renderer is expected to produce.
 *
 * `corpus-coverage.test.js` guards breadth — that every row in
 * `data/characters` comes out translated. This file guards the wording itself:
 * the community terms (fantassin, cavalier, bouclier, engin de siège, PV,
 * moral, sceau de soin, Conquête d'Alliance) and the French grammar the
 * renderer has to get right on its own — elision, à/au/aux contraction, and
 * singular/plural agreement.
 */

describe('renderFrenchEffect', () => {
  it('signs a stat change and elides the partitive', () => {
    expect(renderFrenchEffect('ATK Up 20%')).toBe('+20% d’attaque')
    expect(renderFrenchEffect('DEF Down 30%')).toBe('-30% de défense')
    expect(renderFrenchEffect('Max HP Up 100%')).toBe('+100% de PV max')
    expect(renderFrenchEffect('Evasion (Dodge Chance) Up 20%')).toBe('+20% d’esquive')
  })

  it('merges same-direction stats that share one percentage', () => {
    expect(renderFrenchEffect('ATK Up, DEF Up 30%')).toBe('+30% d’attaque et de défense')
    expect(renderFrenchEffect('ATK Down, DEF Down, Evasion (Dodge Chance) Down 30%'))
      .toBe('-30% d’attaque, de défense et d’esquive')
  })

  it('uses the community wording for damage, healing and lifesteal', () => {
    expect(renderFrenchEffect('150% Damage')).toBe('150% de dégâts')
    expect(renderFrenchEffect('2-Hit 100% Damage')).toBe('2 coups à 100% de dégâts')
    expect(renderFrenchEffect('HP Recovery 20%')).toBe('Soin de 20% de PV')
    expect(renderFrenchEffect('Morale Recovery 10%')).toBe('Regain de 10% de moral')
    expect(renderFrenchEffect('HP Drain 60%')).toBe('60% de vol de vie')
  })

  it('regroups a flat amount the French way instead of leaving 50,000', () => {
    expect(renderFrenchEffect('HP Recovery 50,000')).toBe('Soin de 50 000 PV')
  })

  it('contracts à/au/aux after "résistance"', () => {
    expect(renderFrenchEffect('Poison Resistance 60%')).toBe('+60% de résistance au poison')
    expect(renderFrenchEffect('Burn Resistance 100%')).toBe('+100% de résistance aux brûlures')
    expect(renderFrenchEffect('Confusion Resistance 50%')).toBe('+50% de résistance à la confusion')
    expect(renderFrenchEffect('Illusion Infliction 60%')).toBe('60% de chances d’infliger l’illusion')
  })

  it('keeps the debuff direction on the resisted thing', () => {
    expect(renderFrenchEffect('ATK Down Resistance 30%')).toBe('+30% de résistance à la baisse d’attaque')
    expect(renderFrenchEffect('DEF Down Resistance 30%')).toBe('+30% de résistance à la baisse de défense')
    expect(renderFrenchEffect('DEF Penetration Resistance Up 30%'))
      .toBe('+30% de résistance à la pénétration de défense')
  })

  it('renders scoped and anti- effects with the unit nouns players use', () => {
    expect(renderFrenchEffect('Ally [Shield] DEF Up 10%')).toBe('+10% de défense pour les boucliers alliés')
    expect(renderFrenchEffect('Enemy [General] ATK Down 40%')).toBe('-40% d’attaque pour les généraux ennemis')
    expect(renderFrenchEffect('Anti-[Cavalry] ATK Up 30%')).toBe('+30% d’attaque contre les cavaliers')
    expect(renderFrenchEffect('[Siege Weapon] repair Ore Consumption Down 2.7%'))
      .toBe('-2,7% de consommation de minerai pour la réparation des engins de siège')
  })

  it('names the statuses the way the guide does', () => {
    expect(renderFrenchEffect('Provoke')).toBe('Provocation')
    expect(renderFrenchEffect('Sure Hit')).toBe('Coup assuré')
    expect(renderFrenchEffect('Guard 60%')).toBe('Garde 60%')
    expect(renderFrenchEffect('HP Seal 70%')).toBe('Sceau de soin 70%')
    expect(renderFrenchEffect('Status Effect Immunity (excl. Provoke)'))
      .toBe('Immunité aux altérations d’état (sauf Provocation)')
  })

  it('returns the English source untouched when a tag is unknown', () => {
    expect(renderFrenchEffect('Ally [Nonexistent] ATK Up 10%')).toBe('Ally [Nonexistent] ATK Up 10%')
  })
})

describe('renderFrenchTarget', () => {
  it('puts the scope where French puts it', () => {
    expect(renderFrenchTarget('Self')).toBe('Soi-même')
    expect(renderFrenchTarget('Ally [Cavalry]')).toBe('Cavaliers alliés')
    expect(renderFrenchTarget('Ally [Qin]')).toBe('Alliés Qin')
    expect(renderFrenchTarget('Ally Kanki Army')).toBe('Alliés de l’armée de Kanki')
    expect(renderFrenchTarget('Ally Yotanwa')).toBe('Alliée Yotanwa')
    expect(renderFrenchTarget('Ally "Queen Biki"')).toBe('Alliée Queen Biki')
    expect(renderFrenchTarget('Other ally [General]')).toBe('Autres généraux alliés')
    expect(renderFrenchTarget('All enemy [General]')).toBe('Tous les généraux ennemis')
  })

  it('agrees a count with its noun', () => {
    expect(renderFrenchTarget('1 enemy [General]')).toBe('1 général ennemi')
    expect(renderFrenchTarget('3 enemy [General]')).toBe('3 généraux ennemis')
    expect(renderFrenchTarget('1 enemy [Archer] [General]')).toBe('1 archer ennemi')
    expect(renderFrenchTarget('1 poisoned enemy [General]')).toBe('1 général ennemi empoisonné')
  })

  it('keeps the Mountain Folk under the name the community uses', () => {
    expect(renderFrenchTarget('Ally [Mountain Folk]')).toBe('Alliés du peuple des montagnes')
  })

  it('renders matchup and exclusion qualifiers', () => {
    expect(renderFrenchTarget('Ally [Shield] vs cavalry')).toBe('Boucliers alliés contre les cavaliers')
    expect(renderFrenchTarget('Ally [Cavalry] other than self')).toBe('Cavaliers alliés autres que soi')
    expect(renderFrenchTarget('Surviving ally [Chu]')).toBe('Alliés Chu survivants')
  })
})

describe('renderFrenchCondition', () => {
  it('uses the invariable "en vie" / "en présence de" frames', () => {
    expect(renderFrenchCondition('When ally Makou is alive')).toBe('Quand l’allié Makou est en vie')
    expect(renderFrenchCondition('When ally Kaine is present')).toBe('En présence de l’alliée Kaine')
  })

  it('names the two Castle War stances', () => {
    expect(renderFrenchCondition('When Garrisoning')).toBe('En garnison')
    expect(renderFrenchCondition('When Attacking')).toBe('En attaque')
  })

  it('renders superlative selectors and own-HP thresholds', () => {
    expect(renderFrenchCondition('Enemy [General] with highest ATK'))
      .toBe('Général ennemi avec le plus d’attaque')
    expect(renderFrenchCondition('Enemy [General] with lowest remaining HP'))
      .toBe('Général ennemi avec le moins de PV restants')
    expect(renderFrenchCondition('Own HP < 90%')).toBe('PV de l’unité < 90%')
  })

  it('chains comma-separated conditions without capitalising mid-sentence', () => {
    expect(renderFrenchCondition('When Garrisoning, enemy [General] with highest remaining HP'))
      .toBe('En garnison, général ennemi avec le plus de PV restants')
  })

  it('preserves singular and plural agreement in alive conditions', () => {
    expect(renderFrenchCondition('When enemy [Archer] [General] is alive'))
      .toBe('Quand un archer ennemi est en vie')
    expect(renderFrenchCondition('When enemy [Archer] are alive'))
      .toBe('Quand les archers ennemis sont en vie')
  })

  it('uses a natural route phrase for terrain conditions', () => {
    expect(renderFrenchCondition('When passing terrain [Slope]'))
      .toBe('En empruntant une route en pente')
  })

  it('reads a distributive "Per" frame in the singular', () => {
    expect(renderFrenchCondition('Per ally [Cavalry] [General]')).toBe('Par cavalier allié')
    expect(renderFrenchCondition('Per other ally [Chu] [General]')).toBe('Par autre général allié Chu')
  })

  it('translates the trailing deployment qualifier', () => {
    expect(renderFrenchCondition('CW battle (active even when not deployed)'))
      .toBe('Bataille de Conquête (effet actif même sans déploiement)')
  })
})

describe('renderFrenchDuration', () => {
  it('agrees turns and counts attacks', () => {
    expect(renderFrenchDuration('1 time')).toBe('1 fois')
    expect(renderFrenchDuration('2 times')).toBe('2 fois')
    expect(renderFrenchDuration('3 turns')).toBe('3 tours')
  })
})

describe('renderFrenchTerm and renderFrenchText', () => {
  it('translates the short labels used by filter chips and buff tables', () => {
    expect(renderFrenchTerm('HP')).toBe('PV')
    expect(renderFrenchTerm('Infantry')).toBe('Fantassins')
    expect(renderFrenchTerm('Mountain Folk')).toBe('Peuple des montagnes')
    expect(renderFrenchTerm('Slope')).toBe('Pente')
    expect(renderFrenchTerm('Attack Down Resistance')).toBe('Résistance à la baisse d’attaque')
    expect(renderFrenchTerm('Defense Down Resistance')).toBe('Résistance à la baisse de défense')
    expect(renderFrenchTerm('Way of the Great General')).toBe('Voie du Grand Général')
  })

  it('falls through to the structured renderers for untyped values', () => {
    expect(renderFrenchText('Qin')).toBe('Qin')
    expect(renderFrenchText('ATK Up 20%')).toBe('+20% d’attaque')
    expect(renderFrenchText('Combat')).toBe('Combat')
    expect(renderFrenchText('Strategy')).toBe('Stratégie')
    expect(renderFrenchText('Internal Affairs')).toBe('Affaires intérieures')
  })

  it('returns an unknown label unchanged rather than guessing', () => {
    expect(renderFrenchText('Totally Unknown Mechanic')).toBe('Totally Unknown Mechanic')
  })
})
