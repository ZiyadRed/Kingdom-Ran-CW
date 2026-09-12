// Stable Builder mechanics for source-audited high-risk rows.
//
// `sourceKey` and `effectIndex` are migration coordinates protected by the
// existing whole-skill fingerprint validator. They are not identities. The
// canonical identity is `cw:<skillId>:e<source effect ids>`, built only from
// stable rows in mstUnionConquestSkills/mstUnionConquestSkillEffects.
// Presentation strings are retained only as evidence and never evaluated.

const faction=id=>({kind:'faction',id})
const unit=id=>({kind:'unitType',id})
const group=id=>({kind:'group',id})
const character=id=>({kind:'character',id})
const everyone=()=>({kind:'all',id:'general'})
const any=(...criteria)=>({kind:'any',criteria})

const ally=(criteria=everyone(),excludeSelf=false)=>({side:'ally',criteria,excludeSelf})
const self=()=>({side:'ally',criteria:{kind:'self'}})
const enemy=(criteria=everyone())=>({side:'enemy',criteria})
const modifier=(stat,direction,value)=>({stat,direction,value})
const count=(criteria,excludeSelf=true)=>({kind:'rosterCount',side:'ally',criteria,excludeSelf})
const presence=(side,criteria=everyone(),state='alive',excludeSelf=false)=>({kind:'presence',side,criteria,state,excludeSelf})

const SOURCES={
  'shin#1':{characterId:38,skillId:142,textId:142,status:'exact',skillEffectIds:[1223,1224,1225,1226],evidence:'自身以外の味方秦国武将1名につき'},
  'shunshinkun#2':{characterId:121,skillId:382,textId:382,status:'exact',skillEffectIds:[1610,1611,1612,1613,1614,1615,1616,1617,1618,1619],evidence:'秦国武将に対する攻撃力と防御力が30%上昇'},
  'makou#1':{characterId:255,skillId:791,textId:790,status:'exact',skillEffectIds:[2686,3208,3209,3210,3211],evidence:'敵弓兵武将が生存している場合'},
  'ka#1':{characterId:240,skillId:734,textId:732,status:'exact',skillEffectIds:[1535,1994,2612,2952,2967,2969],evidence:'敵武将が生存している場合、生存している味方趙国武将'},
  'naki#2':{characterId:204,skillId:500,textId:496,status:'exact',skillEffectIds:[1234,1980,1981,1982,1983],evidence:'敵趙国、魏国武将に「体力回復無効」状態'},
  'ryofui#2':{characterId:79,skillId:444,textId:440,status:'exact',skillEffectIds:[1779,1797,1798,1799,1800,1802,1803],evidence:'敵「李牧」「嬴政」「太后」に「攻撃封印」状態'},
  'kakukai#0':{characterId:203,skillId:452,textId:448,status:'exact',skillEffectIds:[1014,1251,1782,1844,1845],evidence:'100%の確率で「李牧」に「攻撃封印」状態'},
  'kyouen#3':{characterId:83,skillId:576,textId:574,status:'resolved',skillEffectIds:[1775,2261,2262,2263,2264],evidence:'自身と味方「{-1:78}」のクリティカルダメージが20%上昇'},
  'yotanwa#3':{characterId:68,skillId:741,textId:739,status:'resolved',skillEffectIds:[1909,1989,3020,3021,3022,3023,3024,3025,3026,3027,3028,3029],evidence:'自身の趙国、魏国武将に対する攻撃力が20%上昇'},
  'kouyoku#1':{characterId:158,skillId:432,textId:425,status:'exact',skillEffectIds:[1765,1766],evidence:'敵全武将に「体力回復無効」状態'},
  'chouin#2':{characterId:161,skillId:636,textId:634,status:'exact',skillEffectIds:[1251,2460,2461,2513,2514],evidence:'「毒」状態の敵全武将に「体力回復無効」状態'},
  'rien#2':{characterId:198,skillId:478,textId:474,status:'exact',skillEffectIds:[1577,1933,1939],evidence:'敵騎兵武将に「体力回復無効」状態'},
  'bikou#0':{characterId:53,skillId:117,textId:117,status:'exact',skillEffectIds:[1090,1109,1173,1183,1184,1185,1186,1187,1188],evidence:'味方歩兵武将と盾兵武将'},
  'denei#0':{characterId:44,skillId:126,textId:126,status:'exact',skillEffectIds:[1018,1195,1196,1197],evidence:'味方歩兵武将と盾兵武将'},
  'denyuu#0':{characterId:45,skillId:108,textId:108,status:'exact',skillEffectIds:[1018,1180,1181,1182],evidence:'味方歩兵武将と騎兵武将'},
  'en#0':{characterId:86,skillId:70,textId:70,status:'exact',skillEffectIds:[1090,1109,1170,1171,1172,1173],evidence:'味方歩兵武将と盾兵武将'},
  'hyouki#0':{characterId:145,skillId:371,textId:371,status:'exact',skillEffectIds:[1566,1567,1568,1569,1570,1571],evidence:'味方騎兵武将と弓兵武将'},
  'kou2#0':{characterId:23,skillId:131,textId:131,status:'exact',skillEffectIds:[1018,1202,1203,1204],evidence:'味方歩兵武将と盾兵武将'},
  'kyouen#0':{characterId:83,skillId:97,textId:97,status:'exact',skillEffectIds:[1018,1022,1030],evidence:'自身と味方騎兵武将'},
  'kyougai#0':{characterId:18,skillId:121,textId:121,status:'exact',skillEffectIds:[1189,1190,1191,1192,1193,1194],evidence:'味方歩兵武将と弓兵武将'},
  'roen#0':{characterId:80,skillId:80,textId:80,status:'exact',skillEffectIds:[1014,1174,1175,1176],evidence:'味方歩兵武将と盾兵武将'},
  'seki#0':{characterId:41,skillId:103,textId:103,status:'exact',skillEffectIds:[1014,1177,1178,1179],evidence:'味方歩兵武将と弓兵武将'},
  'taijifu#0':{characterId:4,skillId:35,textId:35,status:'exact',skillEffectIds:[1020,1023,1027],evidence:'味方歩兵武将と騎兵武将'},
}

const rows=[]
const add=(sourceKey,effectIndex,effectIds,mechanics)=>{
  const source=SOURCES[sourceKey]
  const id=`cw:${source.skillId}:e${[...effectIds].sort((a,b)=>a-b).join('+')}`
  rows.push({id,sourceKey,effectIndex,source:{...source,effectIds:[...effectIds]},...mechanics})
}

// F01/F02 source truth set and high-risk recipient/condition/opponent families.
add('shin#1',0,[1223,1224],{recipients:[ally(faction('qin'))],conditions:[count(faction('qin'))],modifiers:[modifier('ATK','up',5)]})
add('shin#1',1,[1225,1226],{recipients:[ally(group('Hi Shin Unit'))],conditions:[count(group('Hi Shin Unit'))],modifiers:[modifier('ATK','up',5)]})
add('shunshinkun#2',0,[1610,1611,1612,1613,1614,1615,1616,1617,1618,1619],{
  recipients:[ally(any(faction('zhao'),faction('wei'),faction('han'),faction('yan'))),ally(faction('chu'),true)],
  opponent:any(faction('qin')),
  modifiers:[modifier('ATK','up',30),modifier('DEF','up',30)],
})
add('makou#1',0,[2686],{recipients:[self()],modifiers:[modifier('Evasion','up',30)]})
add('makou#1',1,[3208,3209],{recipients:[ally(faction('qin'))],modifiers:[modifier('ATK Down Resistance','up',30)]})
add('makou#1',2,[3210,3211],{recipients:[ally(faction('qin'))],conditions:[presence('enemy',unit('Archer'))],modifiers:[modifier('Hit Rate','up',30)]})
add('ka#1',0,[1535,1994,2612,2967],{recipients:[ally(faction('zhao'))],modifiers:[modifier('ATK','up',30),modifier('DEF','up',30)]})
add('ka#1',1,[2952,2969],{recipients:[ally(faction('zhao'))],conditions:[presence('ally',faction('zhao'),'surviving'),presence('enemy')],modifiers:[modifier('HP Recovery','up',30)]})
add('naki#2',0,[1980,1981],{recipients:[enemy(any(faction('zhao'),faction('wei')))],targetLabel:'Enemy [Zhao] / [Wei]',modifiers:[modifier('HP Recovery Nullification','up',70)]})
add('naki#2',1,[1982,1983],{recipients:[ally(group('Kanki Army'))],conditions:[{kind:'side',side:'attack'}],modifiers:[modifier('Critical Rate','up',20)]})
add('ryofui#2',0,[1802,1803],{recipients:[ally(group('Ryofui Four Pillars'))],modifiers:[modifier('ATK','up',30),modifier('DEF','up',30)]})
add('ryofui#2',1,[1797],{recipients:[enemy(unit('Shield'))],targetLabel:'Enemy Shield',modifiers:[modifier('Normal Attack Seal','up',50)]})
add('ryofui#2',2,[1798,1799,1800],{recipients:[enemy(any(character('riboku'),character('ei_sei'),character('queen_biki')))],targetLabel:'Enemy Riboku / Ei Sei / Queen Biki',modifiers:[modifier('Attack Seal','up',70)]})
add('kakukai#0',1,[1844,1845],{recipients:[enemy(character('riboku'))],targetLabel:'Enemy Riboku',modifiers:[modifier('Attack Seal','up',100)]})
add('kakukai#0',2,[1251],{recipients:[self()],modifiers:[modifier('Attack Nullification','up',1)]})
add('kyouen#3',0,[2261,2262],{recipients:[self()],opponent:unit('Shield'),modifiers:[modifier('ATK','up',40),modifier('DEF','up',40)]})
add('kyouen#3',1,[1775,2264],{recipients:[self(),ally(character('renpa'))],modifiers:[modifier('Critical Damage','up',20)]})
add('kyouen#3',2,[2263],{recipients:[ally()],conditions:[presence('ally',character('renpa'))],modifiers:[modifier('HP Recovery','up',20)]})
add('yotanwa#3',0,[3020,3021],{recipients:[self()],opponent:any(faction('zhao'),faction('wei')),modifiers:[modifier('ATK','up',20)]})
add('yotanwa#3',1,[1989,3022],{recipients:[ally(faction('mountain_folk'))],modifiers:[modifier('Max HP','up',100)]})
add('yotanwa#3',2,[1909,3023],{recipients:[ally(faction('mountain_folk'))],conditions:[{kind:'battleState',state:'surviving'}],modifiers:[modifier('Morale Recovery','up',20)]})
add('yotanwa#3',3,[3026,3027,3028,3029],{recipients:[ally(faction('mountain_folk'))],conditions:[{kind:'side',side:'attack'}],modifiers:[modifier('Betrayal Resistance','up',60),modifier('Fear Resistance','up',60)]})
add('yotanwa#3',4,[3024,3025],{recipients:[ally(faction('mountain_folk'))],conditions:[{kind:'side',side:'attack'}],modifiers:[modifier('ATK','up',30)]})
add('kouyoku#1',1,[1766],{recipients:[enemy()],targetLabel:'Enemy generals',modifiers:[modifier('HP Recovery Nullification','up',50)]})
add('chouin#2',0,[1251,2513],{recipients:[ally(faction('han'))],modifiers:[modifier('Attack Nullification','up',1)]})
add('chouin#2',1,[2514],{recipients:[enemy()],targetLabel:'All poisoned enemy [General]',conditions:[{kind:'targetState',state:'poisoned'}],modifiers:[modifier('HP Recovery Nullification','up',70)]})
add('rien#2',1,[1939],{recipients:[enemy(unit('Cavalry'))],targetLabel:'Enemy Cavalry',modifiers:[modifier('HP Recovery Nullification','up',100)]})
add('rien#2',2,[1933],{recipients:[enemy(unit('Cavalry'))],targetLabel:'Enemy Cavalry',conditions:[presence('ally',faction('chu'),'alive',true)],modifiers:[modifier('Skill Attack Seal','up',50)]})

// Every source-backed effect-level Ally union identified in F01/F02.
add('bikou#0',0,[1183,1184,1185,1186,1187,1188],{recipients:[ally(any(unit('Infantry'),unit('Shield')))],modifiers:[modifier('Confusion Resistance','up',50),modifier('Burn Resistance','up',50)]})
add('bikou#0',1,[1090,1109,1173],{recipients:[ally(any(unit('Infantry'),unit('Shield')))],modifiers:[modifier('DEF','up',10)]})
add('denei#0',1,[1195,1196,1197],{recipients:[ally(any(unit('Infantry'),unit('Shield')))],modifiers:[modifier('Poison Resistance','up',100)]})
add('denyuu#0',1,[1180,1181,1182],{recipients:[ally(any(unit('Infantry'),unit('Cavalry')))],modifiers:[modifier('Betrayal Resistance','up',50)]})
add('en#0',0,[1170,1171,1172],{recipients:[ally(any(unit('Infantry'),unit('Shield')))],modifiers:[modifier('Poison Resistance','up',60)]})
add('en#0',1,[1090,1109,1173],{recipients:[ally(any(unit('Infantry'),unit('Shield')))],modifiers:[modifier('DEF','up',10)]})
add('hyouki#0',0,[1566,1567,1568],{recipients:[ally(any(unit('Cavalry'),unit('Archer')))],modifiers:[modifier('Confusion Resistance','up',40)]})
add('hyouki#0',1,[1569,1570,1571],{recipients:[ally(any(unit('Cavalry'),unit('Archer')))],opponent:unit('Infantry'),modifiers:[modifier('DEF','up',20)]})
add('kou2#0',1,[1202,1203,1204],{recipients:[ally(any(unit('Infantry'),unit('Shield')))],modifiers:[modifier('Burn Resistance','up',100)]})
add('kyouen#0',1,[1022,1030],{recipients:[self(),ally(unit('Cavalry'))],modifiers:[modifier('DEF','up',20)]})
add('kyougai#0',0,[1189,1190,1191],{recipients:[ally(any(unit('Infantry'),unit('Archer')))],modifiers:[modifier('Illusion Resistance','up',50)]})
add('kyougai#0',1,[1192,1193,1194],{recipients:[ally(any(unit('Infantry'),unit('Archer')))],modifiers:[modifier('ATK','up',10)]})
add('roen#0',1,[1174,1175,1176],{recipients:[ally(any(unit('Infantry'),unit('Shield')))],modifiers:[modifier('Confusion Resistance','up',70)]})
add('seki#0',1,[1177,1178,1179],{recipients:[ally(any(unit('Infantry'),unit('Archer')))],modifiers:[modifier('Illusion Resistance','up',80)]})
add('taijifu#0',0,[1020],{recipients:[self()],modifiers:[modifier('DEF','up',20)]})
add('taijifu#0',1,[1023,1027],{recipients:[ally(any(unit('Infantry'),unit('Cavalry')))],modifiers:[modifier('ATK','up',20)]})

export const BUILDER_MECHANIC_ROWS=Object.freeze(rows)
export const BUILDER_MECHANICS=Object.freeze(Object.fromEntries(rows.map(row=>[row.id,Object.freeze(row)])))
export const BUILDER_MECHANIC_BY_COORDINATE=Object.freeze(Object.fromEntries(rows.map(row=>[`${row.sourceKey}:${row.effectIndex}`,row.id])))

export function attachBuilderMechanicIds(character){
  const skills=(character.skills||[]).map((skill,skillIndex)=>{
    const effects=(skill.effects||[]).map((effect,effectIndex)=>{
      const mechanicId=BUILDER_MECHANIC_BY_COORDINATE[`${character.id}#${skillIndex}:${effectIndex}`]
      return mechanicId?{...effect,mechanicId}:effect
    })
    return effects.some((effect,index)=>effect!==(skill.effects||[])[index])?{...skill,effects}:skill
  })
  return skills.some((skill,index)=>skill!==(character.skills||[])[index])?{...character,skills}:character
}

export function stableCriterionMatches(member,criterion,owner,excludeSelf=false){
  if(!member||!criterion) return false
  if(excludeSelf&&owner&&member.id===owner.id) return false
  if(criterion.kind==='self') return !!owner&&member.id===owner.id
  if(criterion.kind==='all') return true
  if(criterion.kind==='any') return criterion.criteria.some(part=>stableCriterionMatches(member,part,owner,excludeSelf))
  if(criterion.kind==='allOf') return criterion.criteria.every(part=>stableCriterionMatches(member,part,owner,excludeSelf))
  if(criterion.kind==='faction') return member.country===criterion.id
  if(criterion.kind==='unitType') return member.unit_type===criterion.id
  if(criterion.kind==='group') return (member.groups||[]).includes(criterion.id)
  if(criterion.kind==='character') return member.id===criterion.id
  return false
}

export function stableRecipientsMatch(mechanic,side,member,owner){
  return (mechanic?.recipients||[]).some(recipient=>recipient.side===side&&stableCriterionMatches(member,recipient.criteria,owner,recipient.excludeSelf))
}

export function stableRosterHas(roster,criterion,owner=null,excludeSelf=false){
  return (roster||[]).some(member=>stableCriterionMatches(member,criterion,owner,excludeSelf))
}
