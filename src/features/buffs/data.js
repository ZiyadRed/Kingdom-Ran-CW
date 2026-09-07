// ── CW BUFFS ──────────────────────────────────────────────────────────────────
export const BUFF_UNIT_CATS = ['Infantry','Cavalry','Archer','Shield']
export const BUFF_STAT_COLORS = {HP:'#1a8a72', Attack:'#c0392b', Defense:'#2471a3'}
export const CAT_COLOR = {Infantry:'#b8880a', Cavalry:'#c0392b', Archer:'#27ae60', Shield:'#6a4fc8'}
export const TERRAIN_BUFFS = [
  {
    id:'slope', name:'Slope', jp:'坂', icon:'/icons/terrain/slope.webp', color:'#c79b26',
    typeLabel:'Damage Dealt Reduction',
    description:'Increases resistance to damage dealt reduction from Slope terrain.',
    entries:[
      {ownership_id:'buff_56336c6d677c4dbd90aabe5616060232', name:'Maki', name_jp:'麻鬼', faction:'mountain_folk', type:'SR', value:5.4},
      {ownership_id:'buff_69eafbce7a3f40a28411f4e0262466cb', name:'Bihei', name_jp:'尾平', faction:'qin', type:'R', value:6.3},
      {ownership_id:'buff_196141978a1a43f48c2b67506d1953dd', name:'Kourigen', name_jp:'黄離弦', faction:'wei', type:'SR', value:7.2},
      {ownership_id:'buff_bbc3356197e04374be2d3792bd3cc108', name:'Rinbou', name_jp:'鱗坊', faction:'qin', type:'SR', value:14.5},
      {ownership_id:'buff_5d3fccf49e90472ab7afd5f576e83399', name:'Domon', name_jp:'土門', faction:'zhao', type:'SR', value:16.6},
    ],
  },
  {
    id:'forest', name:'Forest', jp:'森', icon:'/icons/terrain/forest.webp', color:'#2f8f4e',
    typeLabel:'Damage Dealt Reduction',
    description:'Increases resistance to damage dealt reduction from Forest terrain.',
    entries:[
      {ownership_id:'buff_71b0a47da3d54ea6bd3d33cd55d095aa', name:'Douken', name_jp:'道剣', faction:'zhao', type:'R', value:5.4},
      {ownership_id:'buff_8c546c2bf89945bd8e8142a9fcc2d0ac', name:'Bikou', name_jp:'尾到', faction:'qin', type:'SR', value:6.3},
      {ownership_id:'buff_f9f4c302426041808bcc8d96e8afe8db', name:'Kyomei', name_jp:'羌明', faction:'qin', type:'SR', value:7.2},
      {ownership_id:'buff_d95c3363b660436c85cce54956f33e1c', name:'Heki', name_jp:'壁', faction:'qin', type:'SR', value:14.5},
      {ownership_id:'buff_2443a363d2ea4b379c11e2ebef86645a', name:'Kokuou', name_jp:'黒桜', faction:'qin', type:'SR', value:16.6},
    ],
  },
  {
    id:'river', name:'River', jp:'川', icon:'/icons/terrain/river.webp', color:'#2b80c9',
    typeLabel:'Damage Taken Increase',
    description:'Increases resistance to damage taken increase from River terrain.',
    entries:[
      {ownership_id:'buff_b36f965a0caf4121a215c19e04ec2e6f', name:'Kei', name_jp:'慶', faction:'qin', type:'SR', value:5.4},
      {ownership_id:'buff_7b96f475392d459cbc108fecef81f278', name:'En', name_jp:'渕', faction:'qin', type:'SR', value:6.3},
      {ownership_id:'buff_f56eacea6c7e4b8c931ed06ca6cbbf1f', name:'Kyoushou', name_jp:'羌象', faction:'qin', type:'SR', value:7.2},
      {ownership_id:'buff_17947b4e37d4456689126f6287bacfdd', name:'Doukin', name_jp:'同金', faction:'qin', type:'SR', value:14.5},
      {ownership_id:'buff_234006f5c8a54a0b83c55428b1b74e9f', name:'Ryuusen', name_jp:'竜川', faction:'qin', type:'SR', value:16.6},
    ],
  },
  {
    id:'wetland', name:'Swamp', jp:'湿地', icon:'/icons/terrain/wetland.webp', color:'#9a7b26',
    typeLabel:'Damage Taken Increase',
    description:'Increases resistance to damage taken increase from Swamp terrain.',
    entries:[
      {ownership_id:'buff_77fdd51ed19e46ce88e2cd4637f1384a', name:'Kou', name_jp:'昂', faction:'qin', type:'SR', value:5.4},
      {ownership_id:'buff_afe75cbc632942d19fcf6bd01d39eb08', name:'Jokan', name_jp:'徐完', faction:'zhao', type:'SR', value:6.3},
      {ownership_id:'buff_62464f8598f14af09b99589f9b095937', name:'Yuuren', name_jp:'幽連', faction:'wei', type:'SR', value:7.2},
      {ownership_id:'buff_91ecedaa42ac4cc6848e7c7893407028', name:'Saji', name_jp:'左慈', faction:'zhao', type:'SR', value:14.5},
      {ownership_id:'buff_9415bde0f1c84794ae9149621245efbe', name:'Mangoku', name_jp:'万極', faction:'zhao', type:'UR', value:16.6},
    ],
  },
  {
    id:'ambush', name:'Ambush', jp:'伏兵', icon:'/icons/terrain/ambush.webp', color:'#8a5a3a',
    typeLabel:'Starting Troop HP Loss',
    description:'Reduces the unit damage effect from Ambush terrain.',
    entries:[
      {ownership_id:'buff_038247295e4541febf97a44f8cdf6084', name:'Gii', name_jp:'魏興', faction:'wei', type:'R', value:2.0},
      {ownership_id:'buff_021a1ef1eb6b41179f6d88b6e4a830ec', name:'Seki', name_jp:'石', faction:'qin', type:'SR', value:2.4},
      {ownership_id:'buff_091f59ba04a44d3ea53a9c68c271e912', name:'Chousou', name_jp:'趙荘', faction:'zhao', type:'R', value:2.7},
      {ownership_id:'buff_35b39a2a83db45118252390c1d4db6c5', name:'Douken', name_jp:'道剣', faction:'zhao', type:'R', value:4.6},
      {ownership_id:'buff_4e6dbf901e5d497c8bb6406b0eaa3f50', name:'Ryuukoku', name_jp:'隆国', faction:'qin', type:'SR', value:5.5},
      {ownership_id:'buff_1ab3a844f35747bbafee67f7a32145d5', name:'Kaishibou', name_jp:'介子坊', faction:'wei', type:'SR', value:6.2},
      {ownership_id:'buff_e62e71d858a442849172e166eb5207fa', name:'Ka', name_jp:'太子嘉', faction:'zhao', type:'SR', value:7.8},
    ],
  },
  {
    id:'checkpoint', name:'Checkpoint', jp:'関所', icon:'/icons/terrain/checkpoint.webp', color:'#b98b35',
    typeLabel:'Starting Troop HP Loss',
    description:'Reduces the unit damage effect from Checkpoint terrain.',
    entries:[
      {ownership_id:'buff_3c7f448141984d2fb1d0de1640249818', name:'Shuki', name_jp:'朱鬼', faction:'mountain_folk', type:'SR', value:2.0},
      {ownership_id:'buff_0174ea92aa4541be843185bb2239901b', name:'Hyou', name_jp:'漂', faction:'qin', type:'R', value:2.4},
      {ownership_id:'buff_c7894092d5444d959d3ea20ed1c5f95b', name:'Bakukoshin', name_jp:'縛虎申', faction:'qin', type:'SR', value:2.7},
      {ownership_id:'buff_7b57d2f725ef4dfca02648329230f872', name:'Gii', name_jp:'魏興', faction:'wei', type:'R', value:4.6},
      {ownership_id:'buff_392b3952a8e547c2b3fdbb49442742be', name:'Kyougai', name_jp:'去亥', faction:'qin', type:'SR', value:5.5},
      {ownership_id:'buff_fcb4231404ff49718ad5e68ecdefae88', name:'Jiou', name_jp:'江彰', faction:'zhao', type:'R', value:5.5},
      {ownership_id:'buff_38317cfa80d94b46b8b80d10d43d5ee9', name:'Rankai', name_jp:'ランカイ', faction:'mountain_folk', type:'R', value:6.2},
    ],
  },
]

export const BUFF_STATES = ['Qin','Zhao','Wei','Chu','Han','Ai','Mountain Folk']
export const STATE_FACTION_ID = {Qin:'qin',Zhao:'zhao',Wei:'wei',Chu:'chu',Han:'han',Ai:'ai','Mountain Folk':'mountain_folk'}
export const BUFF_ARMIES = ['Gyokuhou Squad','Hishin Unit','Kanki Army','Karin Army','Ousen Army','Ouki Army','Gakuka Unit','Six Great Generals']
export const ARMY_PARENT_STATE = {'Gyokuhou Squad':'qin','Hishin Unit':'qin','Kanki Army':'qin','Karin Army':'chu','Ousen Army':'qin','Ouki Army':'qin','Gakuka Unit':'qin','Six Great Generals':'qin'}
export const ARMY_ICON_CHAR = {'Gyokuhou Squad':'Ouhon','Hishin Unit':'Shin','Kanki Army':'Kanki','Karin Army':'Karin','Ousen Army':'Ousen','Ouki Army':'Ouki','Gakuka Unit':'Mouten','Six Great Generals':'Sho'}
export const WOGG_BUFF_NAME = 'Way of The Great General'
// CW siege-weapon buffs (攻撃兵器 / 防衛兵器). A minor category compared with
// unit types and states, so the page shows it last and compact.
export const BUFF_SIEGE = ['Attack Siege Weapons','Defense Siege Weapons']
export const SIEGE_META = {
  'Attack Siege Weapons':  {color:'#a8452e', icon:'/icons/siege_attack.webp'},
  'Defense Siege Weapons': {color:'#4a6b7c', icon:'/icons/siege_defense.webp'},
}
export const WOGG_BUFF_DESCRIPTION = 'These buffs unlock from the second page of WoGG.'
export const WOGG_BUFF_SOURCES = [
  {name:'Bajio',icon:'/icons/Bajio.webp',tier:'A'},
  {name:'Gakuki',icon:'/icons/Gakuki.webp',tier:'A'},
  {name:'Houken',icon:'/icons/Houken.webp',tier:'A'},
  {name:'Denyuu',icon:'/icons/Denyuu.webp',tier:'B'},
  {name:'Ryuusen',icon:'/icons/Ryuusen.webp',tier:'B'},
  {name:'Banyou',icon:'/icons/Banyou.webp',tier:'B'},
  {name:'Kuzen',icon:'/icons/Kuzen.webp',tier:'B'},
  {name:'Chousou',icon:'/icons/Chousou.webp',tier:'B'},
  {name:'Shoumou',icon:'/icons/Shoumou.webp',tier:'B'},
  {name:'Kousonryu',icon:'/icons/Kousonryu.webp',tier:'B'},
  {name:'Mangoku',icon:'/icons/Mangoku.webp',tier:'B'},
]

export const UNIT_ICON_SCALE={Infantry:1.18,Cavalry:1.18,Archer:1,Shield:1}
