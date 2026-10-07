// CW Guide — split out of pages.jsx so /guide does not pull core.jsx and
// the full character dataset for what is static reference content.
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLocale } from './i18n/index.js'
import { localizedCharacterName } from './i18n/ar-character-names.js'
import { isGuideSection } from './seo.js'
import { versionPublicAsset } from './asset-url.js'
import NotFoundPage from './NotFoundPage.jsx'
import statusEffects from '../data/glossary/status_effects.json'
import unitMatchups  from '../data/glossary/unit_matchups.json'
import skillTypesGlossary from '../data/glossary/skill_types.json'
import souhaRoleSkills from '../data/souha_role_skills.json'

export const TERRAIN_EFFECTS = [
  {
    id:'slope', name:'Slope', jp:'坂', icon:'/icons/terrain_effect/slope.webp', color:'#c79b26',
    effect:'Damage dealt -50%',
    detail:'Your attacking unit deals 50% less damage when it invades through a Slope route.',
    mitigatedBy:'Slope Aptitude reduces this damage dealt penalty.',
  },
  {
    id:'forest', name:'Forest', jp:'森', icon:'/icons/terrain_effect/forest.webp', color:'#2f8f4e',
    effect:'Damage dealt -50%',
    detail:'Your attacking unit deals 50% less damage when it invades through a Forest route.',
    mitigatedBy:'Forest Aptitude reduces this damage dealt penalty.',
  },
  {
    id:'river', name:'River', jp:'川', icon:'/icons/terrain_effect/river.webp', color:'#2b80c9',
    effect:'Damage taken +50%',
    detail:'Your attacking unit takes 50% more damage when it invades through a River route.',
    mitigatedBy:'Waterway Aptitude reduces this damage taken increase.',
  },
  {
    id:'swamp', name:'Swamp', jp:'湿地', icon:'/icons/terrain_effect/swamp.webp', color:'#9a7b26',
    effect:'Damage taken +50%',
    detail:'Your attacking unit takes 50% more damage when it invades through a Swamp route.',
    mitigatedBy:'Mud Aptitude reduces this damage taken increase.',
  },
  {
    id:'checkpoint', name:'Checkpoint', jp:'関所', icon:'/icons/terrain_effect/checkpoint.webp', color:'#b98b35',
    effect:'Starting HP -30%',
    detail:'Your attacking unit starts the battle with 30% less HP when it invades through a Checkpoint route.',
    mitigatedBy:'Scout reduces this starting HP loss.',
  },
  {
    id:'ambush', name:'Ambush', jp:'伏兵', icon:'/icons/terrain_effect/ambush.webp', color:'#8a5a3a',
    effect:'Starting HP -30%',
    detail:'Your attacking unit starts the battle with 30% less HP when it invades through an Ambush route.',
    mitigatedBy:'Unit Protection reduces this starting HP loss.',
  },
]
export function TerrainEffectIcon({terrain,size=64}){
  const locale = useLocale()
  if(!terrain) return null
  const item = guideSectionCopy(locale, 'terrain', 'items', {})[terrain.id]
  const label = item?.name || terrain.name
  return <img src={terrain.icon} alt={label} loading="lazy" decoding="async" style={{width:size,height:size,objectFit:'contain',flexShrink:0}}/>
}

export const GUIDE_SECTIONS=[
  {id:'basics',       label:'Basics',              category:'Beginner'},
  {id:'stats-screen', label:'CW Stats Screen',     category:'Beginner'},
  {id:'roles',        label:'Roles',               category:'Beginner'},
  {id:'bandits',      label:'Bandit Hunt',         category:'Beginner'},
  {id:'matchups',     label:'Unit Matchups',       category:'Beginner'},
  {id:'types',        label:'Skill Types',         category:'Beginner'},
  {id:'crystals',     label:'Crystal Types',       category:'Beginner'},
  {id:'stats',        label:'How To Raise CW Stats',category:'Beginner'},
  {id:'leaders',      label:'Leader & Strategist', category:'Advanced'},
  {id:'debuffs',      label:'Debuff Resist',       category:'Advanced'},
  {id:'effects',      label:'Status Effects',      category:'Advanced'},
  {id:'terrain',      label:'Terrain Effects',     category:'Advanced'},
  {id:'interactions', label:'Effect Interactions', category:'Advanced'},
  {id:'targeting',    label:'Targeting Rules',     category:'Advanced'},
]
export const GUIDE_GROUPS=['Beginner','Advanced']

// The guide is intentionally source prose rather than generated skill data.
// Keep the most frequently visited opening section in the same locale contract
// as the shell so Arabic and Japanese users do not land on an English block.
const GUIDE_COPY = {
  // RanHQ-authored Japanese explanations follow the official Conquest FAQ:
  // https://www.kingdomran.jp/help/doumeisouhasen
  // Terrain/aptitude names match source-linked CW skill IDs 304/310/316/322.
  ja: {
    basicsIntro: '同盟争覇戦は、同盟で城を占領し、累計城獲得ポイントを競う戦いです。個々の戦闘だけでなく、狙う城、駐屯する場所、限られた出撃回数の使い方が重要です。',
    coreLoop: '基本の流れ',
    coreLoopItems: ['原則として1グループ7同盟で城を争います。通常戦の金・銀★★★★★グループにはAI同盟が2つ加わり、合計9同盟で戦います。', '同盟が狙う城に宣戦布告し、同盟員が侵攻部隊や駐屯部隊を配置します。', '駐屯側は自同盟の城を守り、侵攻側は侵攻時間中に宣戦布告した城の占領を目指します。', '武将の強さに加え、同盟全体で配置と出撃のタイミングを合わせることが大切です。'],
    dailyTiming: '毎日の時間管理',
    dailyTimingItems: ['駐屯は、宣戦布告時間の開始から侵攻時間の終了まで行えます。', '侵攻予約した部隊は、侵攻時間の開始時に自動で攻撃を始めます。予約できるかどうかは同盟の設定も確認してください。', '侵攻時間中は、その場で侵攻部隊を配置することもできます。', '参加予定の登録と担当役割の選択は、できるだけ侵攻時間が始まる前に済ませましょう。'],
    actions: '出撃回数と武将行動回数',
    actionsItems: ['出撃には、部隊に編成した人数分の出撃回数と、各武将の行動回数が必要です。', '武将4人の部隊は出撃回数を4回消費します。少人数編成より消費は多いため、城の必要人数や相手の編成に合わせて使い分けましょう。', '出撃回数と武将行動回数は翌日に回復します。宝玉を使った回復は1日1回です。', '同盟の作戦と残り回数を確認し、重要な城や時間帯に使う編成を残しておきましょう。'],
    priority: '基本方針：重要な城に駐屯 → 宣戦布告した城に侵攻 → 残りの出撃回数を計画的に使う',
    priorityNote: 'まずは同盟の作戦指示を確認し、どの城にどの部隊が必要かを把握しましょう。',
    statsScreen: {
      intro: '同盟争覇戦ステータス画面では、武将の同盟争覇戦専用ステータスを確認できます。通常の武将詳細に表示される数値とは別に、同盟争覇戦で使用される値です。',
      openTitle: '開き方',
      openBody: 'ゲーム内の武将詳細画面を開き、画面右側の城アイコンをタップします。',
      accessAlt: '同盟争覇戦ステータスアイコンが表示された武将ページ',
      screenAlt: '番号付きのステータス行が表示された同盟争覇戦ステータス画面',
      markers: {
        '1': { title: '体力上限', body: '同盟争覇戦での体力の最大値です。体力が0になると戦闘不能になります。' },
        '2': { title: '士気上限', body: '士気の最大値です。戦技スキルの発動には士気を消費します。' },
        '3': { title: '最大攻撃力', body: 'ダメージ計算に使われる攻撃力の上限。' },
        '4': { title: '最小攻撃力', body: 'ダメージ計算に使われる攻撃力の下限。' },
        '5': { title: '特攻（有利属性）', body: '相手の兵種に対して有利な場合の攻撃力補正です。ダメージが増加します。' },
        '6': { title: '特攻（不利属性）', body: '相手の兵種に対して不利な場合の攻撃力補正です。ダメージが減少します。' },
        '7': { title: '命中率', body: '攻撃が外れず命中する可能性を高めます。' },
        '8': { title: 'クリティカル率', body: '通常より威力の高いクリティカル攻撃が発生する確率です。' },
        '9': { title: 'クリティカルダメージ', body: 'クリティカル攻撃時のダメージ倍率です。' },
        '10': { title: '防御力貫通', body: '攻撃時に相手の防御力を指定割合だけ一時的に低下させます。攻撃後は元の防御力に戻ります。' },
        '11': { title: '防御力', body: '受けるダメージを減らします。' },
        '12': { title: '回避率', body: '受ける攻撃を回避する確率。' },
      },
      notesTitle: '画面の見方',
      notes: [
        '括弧内の緑色の数値は、そのステータスまたは効果に現在加わっているボーナス部分です。',
        '攻撃のたびに、最小攻撃力から最大攻撃力の範囲で攻撃力が抽選されます。最終ダメージには相手の防御力やスキル効果なども影響します。',
      ],
      notesMatchups: { before: '兵種有利は兵種相性に従います。相性表は', label: '兵種相性', after: 'で確認できます。' },
      relatedTitle: '関連ページ',
      related: { before: '育成要素は', stats: '同盟争覇戦ステータスの上げ方', middle: '、同盟争覇戦バフの資料は', buffs: 'バフ', after: 'で確認できます。' },
    },
    stats: {
      intro: '同盟争覇戦のステータスには、バフだけでなく、武将や兵士の育成、装備、追想カードなども影響します。',
      affectsTitle: '同盟争覇戦ステータスに影響するもの',
      affectsItems: [
        '争覇強化。訓練道具で訓練値を最大にすると、武将の能力が上がります。',
        '武将レベル。',
        '武将のレアリティ・ランクと技極。裏スキルのランクや裏技極による追加のステータス強化はありません。',
        'LGレベル。',
        '兵士レベル。',
        '武器レベルと武器レアリティ。',
        '武将に装備した追想カードによるステータス補正。',
      ],
    },
    roles: {
      intro: '「担当役割」を設定すると、対応する行動を行ったときに自分の武将が強化されます。同盟員の武将には適用されないため、その日の担当に合う役割を選びましょう。',
      items: {
        'Assault Captain': { name: '突撃隊長', trigger: '侵攻時', effect: '自軍武将の攻撃力を上げます。' },
        'Defense Captain': { name: '防衛隊長', trigger: '駐屯時', effect: '自軍武将の防御力を上げます。' },
        'Support Captain': { name: '応援隊長', trigger: '侵攻・駐屯時', effect: '自軍武将の士気上限を上げます。' },
        'Bandit Hunt Captain': { name: '野盗討伐隊長', trigger: '野盗討伐時', effect: '自軍武将の攻撃力と防御力を上げます。' },
      },
      costTitle: '設定に必要な宝玉',
      costItems: [
        '通常は2種類を無料で設定でき、残り2種類は設定時に200宝玉が必要です。',
        '無料・有料の組み合わせは毎日変わり、同盟間で共通です。',
        '初日はすべての役割が無料です。',
        '有料の役割から変更しても宝玉は戻りません。別の有料役割へ変更する場合は、再び宝玉を消費します。',
      ],
      lockTitle: '変更できる時間',
      lockItems: [
        '侵攻時間が始まる前は、自由に役割を変更できます。',
        '役割を設定し忘れても、侵攻時間中に設定できます。',
        '侵攻時間が始まった後は、選択済みの役割を変更できません。',
        '担当役割を変更できるようになる時刻と、無料対象の更新時刻は毎日8:00です。',
      ],
    },
    bandits: {
      intro: '野盗討伐は、NPCの野盗部隊と連戦し、同盟全体の討伐数を競う機能です。城への侵攻や駐屯と同じ出撃回数・武将行動回数を使うため、同盟の方針に合わせて参加しましょう。',
      whatTitle: '概要',
      whatItems: [
        '通常の同盟争覇戦の侵攻時間中に利用できます。',
        'シーズン中の累計野盗討伐数で同盟順位を競います。',
        '同盟の順位に応じた報酬に加え、戦闘では個人ランキング用の個人ptも獲得できます。野盗討伐数の個人ランキングはありません。',
        '野盗討伐では争覇兵器を使用できません。',
      ],
      runsTitle: '進行方法',
      runsItems: [
        '戦場マップ右下の「野盗討伐」→「討伐開始」の順にタップし、武将を編成して「討伐開始」をタップします。',
        '勝利する限り、同じ部隊で連戦を続けます。',
        '他の部隊が戦闘中の場合は、開始した順に侵攻予約状態になります。',
        '戦闘中または待機中の編成は、戻るまで侵攻や駐屯に使えません。',
      ],
      useTitle: '使うタイミング',
      useItems: [
        '同盟が野盗討伐数ランキングを狙うときや、城への出撃後に余力があるときに参加しましょう。',
        '城への侵攻・駐屯に必要な武将を、野盗討伐に出したままにしないよう注意しましょう。',
        '野盗討伐を担当する場合は、担当役割の「野盗討伐隊長」が適しています。',
        '侵攻時間が終わると連戦は終了し、その時点までの連撃数がランキングに反映されます。侵攻予約中の部隊は戦闘せずに帰還します。',
      ],
    },
    debuffs: {
      intro: '攻撃力低下・防御力低下・防御力貫通への耐性は、それぞれの効果値を差し引いて軽減します。効果が実際に何%残るかを確認するときに重要です。',
      coversTitle: '耐性の対象',
      coversItems: [
        '攻撃力低下耐性は、攻撃力を下げる効果を減らします。',
        '防御力低下耐性は、防御力を下げる効果を減らします。',
        '防御力貫通耐性は、防御力貫通効果を減らします。',
        '戦技と軍略の両方に作用します。',
      ],
      notesTitle: '重要な点',
      notesItems: [
        '防御力貫通は、この耐性計算ではデバフとして扱われます。',
        '耐性がデバフより高い場合、最終デバフは0%になります。',
        '攻撃力低下はクリティカル攻撃にも適用されます。',
        '複数のデバフは、耐性を差し引く前に合算されます。',
      ],
      formula: '最終デバフ率 = max(0, 合計デバフ率 - 合計耐性率)',
      examples: [
        '例1：攻撃力低下40%に対して攻撃力低下耐性50%なら、0%になります。',
        '例2：攻撃力低下40% + 30%に対して耐性50%なら、20%になります。',
      ],
    },
    terrain: {
      intro: '城と城の間の侵攻経路には、地形効果が付くことがあります。地形によって、侵攻部隊の与ダメージが減少したり、被ダメージが増加したり、戦闘開始時の体力が減少したりします。',
      noTerrain: '地形なし',
      items: {
        slope: { name: '坂路', effect: '与ダメージ -50%', detail: '坂路から侵攻すると、侵攻部隊の与ダメージが50%減少します。', mitigatedBy: '「坂路適性」で軽減できます。' },
        forest: { name: '森林', effect: '与ダメージ -50%', detail: '森林を通って侵攻すると、侵攻部隊の与ダメージが50%減少します。', mitigatedBy: '「森林適性」で軽減できます。' },
        river: { name: '水路', effect: '被ダメージ +50%', detail: '水路から侵攻すると、侵攻部隊の被ダメージが50%増加します。', mitigatedBy: '「水路適性」で軽減できます。' },
        swamp: { name: '泥濘', effect: '被ダメージ +50%', detail: '泥濘を通って侵攻すると、侵攻部隊の被ダメージが50%増加します。', mitigatedBy: '「泥濘適性」で軽減できます。' },
        checkpoint: { name: '関所', effect: '開始時体力 -30%', detail: '関所を通って侵攻すると、侵攻部隊の体力が30%減少した状態で戦闘が始まります。', mitigatedBy: '「斥候」で軽減できます。' },
        ambush: { name: '伏兵', effect: '開始時体力 -30%', detail: '伏兵のいる経路から侵攻すると、侵攻部隊の体力が30%減少した状態で戦闘が始まります。', mitigatedBy: '「部隊保護」で軽減できます。' },
      },
      routeText: '同じ城へ侵攻できる経路が複数ある場合、地形効果のない経路が優先されます。すべての経路に地形効果がある場合は、耐性を適用した後の不利な効果が最も小さい経路が選ばれます。同じ場合の優先順位は {{priority}} です。地形の配置は開催回によって変わることがあります。',
    },
    crystals: {
      intro: '争覇スキルの解放アイテムは、対象となる武将やスキルがそれぞれ異なります。育成したい武将に合うアイテムを確認しましょう。',
      items: {
        red: { name: '争覇解放石', unlocks: '争覇スキル', body: '各武将の争覇スキル1・2・3を解放するアイテムです。', cost: 'UR武将の3スキルをすべて解放するには1,750個（スキル1・2・3の順に100 / 550 / 1,100個）。SRは合計800個、Rは合計595個です。' },
        blue: { name: '専用争覇解放石(飛信隊)', unlocks: '飛信隊専用', body: '飛信隊の武将に限り、争覇解放石の代わりに使用できます。', cost: '必要数は争覇解放石と同じです。飛信隊の武将には専用の石を優先し、争覇解放石を他の武将の育成に残しましょう。' },
        orange: { name: '争覇総大将解放石', unlocks: '争覇総大将スキル', body: '対応する武将の争覇総大将スキルを解放するアイテムです。', cost: '武将1人につき1,000個。' },
        green: { name: '争覇軍師解放石', unlocks: '争覇軍師スキル', body: '対応する武将の争覇軍師スキルを解放するアイテムです。', cost: '武将1人につき1,000個。' },
      },
      spendTitle: '先に使う解放アイテム',
      spendItems: [
        '飛信隊の武将には、用途が限られる専用争覇解放石(飛信隊)を先に使いましょう。',
        'UR武将1人の3スキルをすべて解放するには争覇解放石が1,750個必要です。使用する編成を決めてから計画的に解放しましょう。',
        '争覇総大将解放石と争覇軍師解放石は、対応する武将に使用します。編成時の効果と注意点は「争覇総大将・争覇軍師」で確認できます。',
      ],
    },
    leaders: {
      intro: '争覇総大将スキルと争覇軍師スキルは、対応する武将を編成で「総大将」「軍師」に設定すると、各戦闘の1ターン目に発動します。解放しただけでは発動しません。',
      roles: {
        leader: { label: '総大将', stone: '争覇総大将解放石', riskLabel: '総大将が戦闘不能になった場合', risk: '他の味方武将が生存していても、即座に敗北します。' },
        strategist: { label: '軍師', stone: '争覇軍師解放石', riskLabel: '軍師が戦闘不能になった場合', risk: '生存している味方全武将に「混乱」が1ターン付与され、50%の確率で行動できなくなります。' },
      },
      unlock: '解放：',
      generalsLabel: '武将',
      howTitle: '仕組み',
      howItems: [
        'どちらも発動時に士気を消費します。必要な士気が足りない場合は発動しません。発動順は総大将スキル→軍師スキルです。',
        '1編成で設定できるのは総大将1人と軍師1人です。両方を同時に設定できます。',
        '効果は武将ごとに異なるため、編成との相性を確認して担当する武将を選びましょう。',
        '軍師が戦闘不能になると味方に1ターンの「混乱」が付与され、総大将が戦闘不能になると即敗北します。特に総大将を守れる編成と配置を意識しましょう。',
      ],
    },
    interactions: {
      intro: '複数の効果を付与したときの、上書き・重複・優先順位を確認できます。',
      labels: { overwrite: '効果の上書き', stack: 'ガード効果と無効効果の重複', guard_overwrite: 'ガード効果の上書き判定' },
      notes: {
        overwrite: '「敵武将から狙われにくい状態」と「挑発」は、それぞれ同じ効果を再付与すると後の効果に切り替わります。「錯乱」と「暴走」は互いに上書きされますが、「裏切り」が優先され、裏切り中に錯乱や暴走は付与できません。',
        stack: 'ガード効果と無効効果は同時に付与できます。攻撃を受けると無効効果でダメージが0になり、両方の残り回数が1回ずつ減ります。ただし、回避や見切りで攻撃を避けた場合は減りません。',
        guard_overwrite: 'ガード効果を再付与すると、軽減率と残り回数から算出した判定値を比較し、高い方が適用されます。新しい効果の判定値が低い場合は、現在のガード効果が残ります。',
      },
      formula: '判定値 = 軽減率 × 残り回数',
      example: '30% × 2回 = 60  対  70% × 1回 = 70  → 70%が上書き',
      effects: { Provoke: '挑発', 'Less Likely to be Targeted': '敵武将から狙われにくい状態', Confusion: '錯乱', Betrayal: '裏切り', Rampage: '暴走', 'Attack Nullification': '無効効果', Guard: 'ガード効果' },
    },
    targeting: {
      intro: '戦技の対象条件と優先順位、挑発や錯乱による対象選択の変化を確認できます。',
      rules: {
        'Skill Target Selection Priority': { title: '戦技の攻撃対象が決まる順序', body: 'まず、国・所属・兵種・状態異常など、スキルの対象条件を満たす武将に候補を絞ります。その候補の中から、次の順に対象を選びます。', list: ['挑発状態の武将を優先します。該当者がいない場合や複数いる場合は、次の条件で判定します。', '戦技に指定された優先条件（例：攻撃力が最も高い、防御力が最も低い）に従います。'] },
        'Unmet Target Conditions': { title: '対象条件を満たさない場合', body: '指定された対象がいない場合、その効果は発動しません。たとえば敵秦国武将がいなければ、敵秦国武将を対象とする効果は不発になります。複数の効果を持つ戦技では、対象が存在する効果だけが発動します。' },
        'Random Targeting': { title: 'ランダムな対象', body: '「ランダムな敵武将」を対象とする戦技は、挑発の影響を受けずに対象を選びます。' },
        Provocation: { title: '挑発', bullets: ['対象条件を満たす敵の通常攻撃・スキル攻撃を、挑発中の武将に集中させます。兵器を対象とするスキルは対象外です。', 'ダメージを与えない効果の対象選択には影響しません。', '効果は重複せず、再付与すると後の効果に切り替わります。'] },
        Confusion: { title: '錯乱', bullets: ['効果中は敵味方を区別せずに攻撃します。', '戦技を発動できる場合は戦技を使い、発動できない場合は通常攻撃を行います。', '生存している味方武将がいない場合は、通常どおり敵武将を攻撃します。', '効果は重複せず、再付与するとターン数を更新します。', '裏切り中の武将には付与できません。暴走中の武将には付与でき、暴走を上書きします。錯乱中に裏切りや暴走を付与すると、錯乱が上書きされます。'] },
      },
    },
    effects: {
      // Official FAQ distinguishes the role penalty 混乱 from ordinary 錯乱:
      // https://www.kingdomran.jp/help/doumeisouhasen
      intro: '同盟争覇戦の特殊効果と状態異常です。軍師が戦闘不能になると、味方に1ターンの「混乱」（50%の確率で行動できなくなる）が付与されます。敵味方を問わず攻撃する「錯乱」とは別の状態異常です。',
      buffsTitle: 'バフ',
      debuffsTitle: 'デバフ',
      items: {
        'Less Likely to be Targeted': { name: '敵武将から狙われにくい状態', description: '敵の通常攻撃・スキル攻撃の対象から除外されます。ただし、この状態の武将しか生存していない場合や、敵の攻撃対象数が味方全員の人数と同じ場合は対象になります。' },
        Reckless: { name: '捨て身', description: '攻撃力が大きく上がりますが、受けるダメージも増加します。' },
        'Evasion (Dodge Chance)': { name: '見切り', description: '攻撃を受けたとき、一定確率でその攻撃を回避します。' },
        Guard: { name: 'ガード効果', description: '指定された攻撃の被ダメージを軽減します。指定回数発動すると解除されます。' },
        'Attack Nullification': { name: '無効効果', description: '指定された攻撃の被ダメージを0にします。指定回数発動すると解除されます。' },
        'Sure Hit': { name: '必中', description: '自身の命中率、相手の回避率、見切りの有無にかかわらず攻撃が命中します。' },
        'Status Effect Immunity': { name: '状態異常無効', description: '挑発を除く状態異常の付与を防ぎます。指定回数発動すると解除され、回数指定がない場合は回数制限なく防ぎます。' },
        Provoke: { name: '挑発', description: '敵武将からの通常攻撃・スキル攻撃を自身に集中させます。対象条件を満たさない攻撃や、兵器を対象とする攻撃には影響しません。' },
        Poison: { name: '毒', description: '各ターンの開始時、最大体力の割合分のダメージを受けます。' },
        'Severe Poison': { name: '猛毒', description: '各ターンの開始時、最大体力の割合分のダメージを受けます。毒より強力で、毒とは重複せず猛毒が優先されます。' },
        Burn: { name: '火傷', description: '各ターンの開始時、最大体力の割合分のダメージを受けます。' },
        Illusion: { name: '幻影', description: '命中率を下げます。' },
        Paralysis: { name: '麻痺', description: '毎ターン、一定確率で行動（通常攻撃・スキル攻撃）できなくなります。' },
        Confusion: { name: '錯乱', description: '味方と敵を区別せず攻撃します。' },
        Betrayal: { name: '裏切り', description: '効果中は味方武将を攻撃します。' },
        Rampage: { name: '暴走', description: '攻撃力が上がりますが、味方武将を攻撃する可能性があります。' },
        Fear: { name: '恐怖', description: '士気が回復しなくなります。' },
        'Attack Seal': { name: '封印', description: '通常攻撃封印は通常攻撃の行動順をスキップし、戦技は発動できます。スキル攻撃封印は戦技の代わりに通常攻撃を行います。攻撃封印は通常攻撃と戦技の両方を行えなくなります。' },
        'HP Seal': { name: '体力回復無効', description: '体力が回復しなくなります。' },
      },
    },
    matchups: {
      intro: '騎兵・弓兵・盾兵には三すくみの相性があります。有利な兵種には与ダメージが増加し、不利な兵種には減少します。',
      chartAlt: '兵種相性表',
      strongVs: '有利',
      units: { Cavalry: '騎兵', Archer: '弓兵', Shield: '盾兵', Infantry: '歩兵', 'Siege Weapon / Gate': '兵器・城門' },
      mutualNote: '歩兵と兵器・城門は、互いに与ダメージが増加します。',
    },
    types: {
      intro: '争覇スキルは「戦技」「軍略」「内政」の3種類に分かれます。一部の武将は、争覇総大将スキルまたは争覇軍師スキルも解放できます。',
      items: {
        '戦技': { label: '戦技', description: '戦闘中に士気を消費して発動するスキルです。ダメージ、強化・弱体化、回復など、効果はスキルごとに異なります。' },
        '軍略': { label: '軍略', description: '士気を消費せずに効果を発揮するスキルです。ステータスの強化や条件付き効果などがあります。' },
        '内政': { label: '内政', description: '出撃していなくても効果を発揮するスキルです。ステータスの強化や地形効果の軽減などがあります。' },
        '総大将スキル': { label: '争覇総大将スキル', description: '総大将に設定した武将が、必要な士気を消費して各戦闘の1ターン目に発動します。1編成につき総大将は1人で、その武将が戦闘不能になると即敗北します。' },
        '軍師スキル': { label: '争覇軍師スキル', description: '軍師に設定した武将が、必要な士気を消費して各戦闘の1ターン目に発動します。1編成につき軍師は1人で、その武将が戦闘不能になると、生存している味方全武将に「混乱」が1ターン付与されます。' },
      },
    },
  },
  ar: {
    basicsIntro: 'حرب القلاع هي قتال على أراضي التحالفات. لا يكفي الفوز بالمعارك الفردية؛ اختر القلاع المناسبة، وزّع الدفاعات، وأنفق الأفعال المحدودة بحكمة.',
    coreLoop: 'الحلقة الأساسية',
    coreLoopItems: ['تتنافس 7 تحالفات على القلاع داخل المجموعة.', 'يعلن تحالفك القلاع المستهدفة ثم يضع الأعضاء تشكيلات الهجوم والدفاع.', 'يحمي المدافعون القلاع المملوكة، ويحاول المهاجمون كسر الأهداف المعلنة أثناء وقت الغزو.', 'الفوز بالخريطة مسألة تخطيط جماعي، وليس فحصًا لقوة جنرال واحد فقط.'],
    dailyTiming: 'التوقيت اليومي',
    dailyTimingItems: ['يتاح وضع الحاميات من بداية الإعلان حتى نهاية الغزو.', 'يمكن حجز الهجوم قبل وقت الغزو، ويبدأ تلقائيًا عند فتحه.', 'يتم وضع الغزو المباشر خلال نافذة الغزو.', 'من الأفضل تجهيز المشاركة والأدوار قبل النافذة النشطة.'],
    actions: 'الأفعال والغزوات',
    actionsItems: ['يستهلك كل جنرال في الفريق عدد أفعال أو موارد غزو بحسب النشاط.', 'فريق من 4 جنرالات أعلى تكلفة عادة، لكنه أكثر أمانًا في المعارك الفعلية.', 'تتعافى موارد الغزو يوميًا، وقد تتطلب بعض خيارات التعافي جواهر.', 'لا تنفق الفرق القوية مبكرًا إلا إذا كانت القلعة أو التوقيت يستحق ذلك.'],
    priority: 'الأولوية: دافع عن القلاع المهمة ← هاجم الأهداف المعلنة ← أنفق الباقي بكفاءة',
    priorityNote: 'للاعب الجديد، الخطوة الأولى هي فهم احتياجات التحالف من التشكيلات قبل تحسين كل مواجهة فردية.',
    statsScreen: {
      intro: 'تعرض شاشة خصائص CW خصائص الجنرال الخاصة بحرب القلاع. هذه القيم منفصلة عن خصائص صفحة الجنرال العادية وتُستخدم في حرب القلاع.',
      openTitle: 'طريقة الفتح',
      openBody: 'افتح صفحة جنرال، ثم اضغط أيقونة القلعة في الجانب الأيمن من الشاشة.',
      accessAlt: 'صفحة جنرال تعرض أيقونة خصائص حرب القلاع',
      screenAlt: 'شاشة خصائص حرب القلاع مع صفوف خصائص مرقمة',
      markers: {
        '1': { title: 'HP', body: 'الحد الأقصى للصحة في حرب القلاع.' },
        '2': { title: 'المعنويات', body: 'الحد الأقصى للمعنويات. تستمد مهارات المعنويات من هذا الحد.' },
        '3': { title: 'الهجوم الأقصى', body: 'حد قيمة الهجوم المستخدمة عند حساب الضرر.' },
        '4': { title: 'الهجوم الأدنى', body: 'أدنى قيمة هجوم مستخدمة عند حساب الضرر.' },
        '5': { title: 'ضرر أفضلية النوع', body: 'تأثير هجوم خاص إضافي عند امتلاك أفضلية في مواجهة الوحدات.' },
        '6': { title: 'ضرر سلبية النوع', body: 'تأثير الهجوم الخاص الظاهر عند مواجهة نوع غير مواتٍ.' },
        '7': { title: 'معدل الإصابة', body: 'يساعد الهجمات على إصابة الهدف بدلًا من الإخفاق.' },
        '8': { title: 'معدل الضربة الحرجة', body: 'احتمال تحول الهجوم إلى ضربة حرجة.' },
        '9': { title: 'الضرر الحرج', body: 'الضرر الإضافي عند حدوث ضربة حرجة.' },
        '10': { title: 'اختراق الدفاع', body: 'يساعد على تجاوز جزء من دفاع العدو، وليس هو الهجوم نفسه.' },
        '11': { title: 'الدفاع', body: 'يقلل الضرر الوارد.' },
        '12': { title: 'التفادي', body: 'احتمال تفادي الهجمات الواردة.' },
      },
      notesTitle: 'ملاحظات الشاشة',
      notes: [
        'القيم الخضراء بين قوسين هي الجزء الإضافي المطبق حاليًا على الخاصية أو التأثير.',
        'الهجوم الأقصى والأدنى مهمان معًا لأن الضرر قد يقع بينهما.',
      ],
      notesMatchups: { before: 'تتبع أفضلية النوع مواجهات الوحدات. راجع', label: 'مواجهات الوحدات', after: 'لمخطط المواجهات.' },
      relatedTitle: 'صفحات ذات صلة',
      related: { before: 'استخدم', stats: 'كيفية رفع خصائص CW', middle: 'لمصادر التقدم، و', buffs: 'التعزيزات', after: 'لمراجع تعزيزات حرب القلاع.' },
    },
    stats: {
      intro: 'تتأثر خصائص CW بعدة أنظمة تقدم إلى جانب صفحة التعزيزات. يعتمد الرقم النهائي أيضًا على الجنرال والجنود والأسلحة ومكافآت بطاقات المشهد الصغيرة.',
      affectsTitle: 'ما الذي يؤثر في خصائص CW',
      affectsItems: [
        'مستوى الجنرال. الحد الأقصى هو المستوى 85.',
        'تقدم نجوم الجنرال. يمنح إكمال الصفحة الأولى أقصى تعزيز للخصائص؛ أما إكمال الصفحة الثانية فلا يضيف زيادة أخرى لخصائص CW.',
        'مستوى LG.',
        'مستوى الجنود.',
        'مستوى السلاح وندرته.',
        'بطاقات مشهد الجنرال، وتمنح زيادة صغيرة لمن يريد ضبط الخصائص إلى أقصى حد.',
      ],
    },
    roles: {
      intro: 'الأدوار تكليفات شخصية في حرب القلاع. لا تعزز إلا اللاعب الذي يحدد الدور، لذلك اختر الدور الذي يطابق ما ستفعله فعلًا في ذلك اليوم.',
      items: {
        'Assault Captain': { name: 'قائد الهجوم', trigger: 'عند الغزو', effect: 'يرفع هجوم جنرالاتك.' },
        'Defense Captain': { name: 'قائد الدفاع', trigger: 'عند وضع الحامية', effect: 'يرفع دفاع جنرالاتك.' },
        'Support Captain': { name: 'قائد الدعم', trigger: 'عند الغزو أو وضع الحامية', effect: 'يرفع حد معنويات جنرالاتك.' },
        'Bandit Hunt Captain': { name: 'قائد مطاردة قطاع الطرق', trigger: 'عند مطاردة قطاع الطرق', effect: 'يرفع هجوم ودفاع جنرالاتك.' },
      },
      costTitle: 'قواعد التكلفة',
      costItems: [
        'دوران مجانيان ودوران يكلفان جواهر كل يوم.',
        'يتغير مزيج الأدوار المجانية والمدفوعة يوميًا ويشترك فيه جميع التحالفات.',
        'يبدأ اليوم الأول مع جعل كل الأدوار مجانية.',
        'تغيير الدور المدفوع لا يعيد الجواهر.',
      ],
      lockTitle: 'توقيت القفل',
      lockItems: [
        'يمكنك تغيير الدور بحرية قبل بدء وقت الغزو.',
        'إذا نسيت تحديد دور، فما زال بإمكانك تحديده أثناء وقت الغزو.',
        'بعد بدء وقت الغزو لا يمكن تغيير الدور المحدد مسبقًا.',
        'يتجدد توفر الدور المجاني في الساعة 8:00 يوميًا.',
      ],
    },
    bandits: {
      intro: 'مطاردة قطاع الطرق هدف جانبي في حرب القلاع، يقاتل فيه التحالف فرق قطاع طرق غير لاعبة للحصول على مكافآت الترتيب. وهي تشارك الهجوم على القلاع في أفعالك المحدودة.',
      whatTitle: 'ما هي',
      whatItems: [
        'تتوفر أثناء وقت غزو حرب القلاع العادية.',
        'تتنافس التحالفات في إجمالي عدد مرات مطاردة قطاع الطرق خلال الموسم.',
        'قد تمنح مكافآت ترتيب التحالف ونقاط ترتيب شخصية.',
        'لا يمكن استخدام أسلحة الحرب المحددة في مطاردة قطاع الطرق.',
      ],
      runsTitle: 'طريقة التشغيل',
      runsItems: [
        'اختر مطاردة قطاع الطرق، وحدد فريقًا، ثم ابدأ الجولة.',
        'يواصل الفريق القتال بالتتابع ما دام يفوز.',
        'إذا بدأ عدة لاعبين المطاردة، تنتظر الجولات بالترتيب.',
        'لا يمكن استخدام الفريق الذي يقاتل أو ينتظر في الغزو أو الحامية حتى يعود.',
      ],
      useTitle: 'متى تستخدمها',
      useItems: [
        'استخدمها عندما يريد التحالف ترتيب قطاع الطرق أو عندما تتوفر لديك موارد أفعال إضافية.',
        'تجنب حجز الجنرالات المهمين إذا كانت معركة قلعة ما تزال تحتاجهم.',
        'يناسب دور قائد مطاردة قطاع الطرق اللاعبين المكلفين بهذه المهمة.',
        'إذا انتهى وقت الغزو أثناء الجولة، يُحتسب فقط التسلسل المكتمل حتى تلك اللحظة.',
      ],
    },
    debuffs: {
      intro: 'تقلل مقاومة الإضعاف بعض التأثيرات السلبية قبل تطبيقها. وهذا مهم عند تحديد ما إذا كان خفض الهجوم أو الدفاع أو اختراق الدفاع سيُطبق فعلًا.',
      coversTitle: 'ما الذي تغطيه المقاومة',
      coversItems: [
        'تقلل مقاومة خفض الهجوم تأثيرات خفض الهجوم.',
        'تقلل مقاومة خفض الدفاع تأثيرات خفض الدفاع.',
        'تقلل مقاومة اختراق الدفاع تأثيرات اختراق الدفاع.',
        'تعمل ضد المهارات القتالية ومهارات الاستراتيجية.',
      ],
      notesTitle: 'ملاحظات مهمة',
      notesItems: [
        'يُعامل اختراق الدفاع كإضعاف في حساب هذه المقاومة.',
        'إذا زادت المقاومة على الإضعاف، يصبح الإضعاف النهائي 0%.',
        'تستمر تأثيرات خفض الهجوم في التطبيق على الهجمات الحرجة.',
        'تُجمع الإضعافات المتعددة قبل طرح المقاومة.',
      ],
      formula: 'نسبة الإضعاف النهائية = max(0, إجمالي نسبة الإضعاف - إجمالي نسبة المقاومة)',
      examples: [
        'مثال 1: خفض هجوم 40% أمام مقاومة خفض هجوم 50% يصبح 0%.',
        'مثال 2: خفض هجوم 40% + خفض هجوم 30% أمام مقاومة 50% يصبح 20%.',
      ],
    },
    terrain: {
      intro: 'تأثيرات التضاريس إضعافات على خريطة حرب القلاع مرتبطة بمسارات الغزو بين القلاع. وقد تخفض الضرر الذي تلحقه، أو تزيد الضرر الذي تتلقاه، أو تجعل وحدتك تبدأ القتال بصحة أقل.',
      noTerrain: 'بلا تضاريس',
      items: {
        slope: { name: 'منحدر', effect: 'الضرر الملحق -50%', detail: 'تلحق وحدتك المهاجمة ضررًا أقل بنسبة 50% عند الغزو عبر مسار منحدر.', mitigatedBy: 'تقلل ملاءمة المنحدر عقوبة الضرر الملحق هذه.' },
        forest: { name: 'غابة', effect: 'الضرر الملحق -50%', detail: 'تلحق وحدتك المهاجمة ضررًا أقل بنسبة 50% عند الغزو عبر مسار غابة.', mitigatedBy: 'تقلل ملاءمة الغابة عقوبة الضرر الملحق هذه.' },
        river: { name: 'نهر', effect: 'الضرر المتلقى +50%', detail: 'تتلقى وحدتك المهاجمة ضررًا أكبر بنسبة 50% عند الغزو عبر مسار نهر.', mitigatedBy: 'تقلل ملاءمة الممر المائي هذه الزيادة في الضرر المتلقى.' },
        swamp: { name: 'مستنقع', effect: 'الضرر المتلقى +50%', detail: 'تتلقى وحدتك المهاجمة ضررًا أكبر بنسبة 50% عند الغزو عبر مسار مستنقع.', mitigatedBy: 'تقلل ملاءمة الوحل هذه الزيادة في الضرر المتلقى.' },
        checkpoint: { name: 'نقطة تفتيش', effect: 'الصحة عند البدء -30%', detail: 'تبدأ وحدتك المهاجمة القتال بصحة أقل بنسبة 30% عند الغزو عبر مسار نقطة تفتيش.', mitigatedBy: 'يقلل الكشاف خسارة الصحة عند البدء هذه.' },
        ambush: { name: 'كمين', effect: 'الصحة عند البدء -30%', detail: 'تبدأ وحدتك المهاجمة القتال بصحة أقل بنسبة 30% عند الغزو عبر مسار كمين.', mitigatedBy: 'تقلل حماية الوحدة خسارة الصحة عند البدء هذه.' },
      },
      routeText: 'عند وجود عدة مسارات تصل إلى القلعة نفسها، تفضل اللعبة المسار بلا إضعاف تضاريس. وإذا كان لكل المسارات إضعاف، تختار المسار صاحب أصغر عقوبة متبقية بعد تطبيق تعزيزات مقاومة التضاريس. وإذا تعادلت العقوبة المتبقية، يكون ترتيب أولوية المسارات هو {{priority}}. قد تتغير مواضع التضاريس في كل فعالية من فعاليات حرب القلاع.',
    },
    crystals: {
      intro: 'تفتح أربعة أنواع من الكرستالات المهارات، لكنها ليست قابلة للتبادل. يعمل كل نوع فقط فيما خُصص له.',
      items: {
        red: { name: 'الكرستالة الحمراء', unlocks: 'مهارات حرب القلاع', body: 'الكرستالة القياسية. تفتح مهارات حرب القلاع الثلاث لأي جنرال.', cost: 'تحتاج إلى 1,750 لفتح جنرال UR بالكامل (100 / 550 / 1,100 لكل مهارة). وتكلفة SR هي 800، وR هي 595.' },
        blue: { name: 'الكرستالة الزرقاء', unlocks: 'وحدة الهاي شين فقط', body: 'تعمل تمامًا مثل الكرستالة الحمراء، لكن لا يمكن إنفاقها إلا على جنرالات وحدة الهاي شين.', cost: 'التكلفة نفسها مثل الحمراء. أنفقها على أعضاء الهاي شين أولًا واحتفظ بالحمراء للآخرين.' },
        orange: { name: 'الكرستالة البرتقالية', unlocks: 'مهارة القائد', body: 'تفتح مهارة القائد لجنرال يمكنه تولي هذا الدور.', cost: '1,000 لكل جنرال.' },
        green: { name: 'الكرستالة الخضراء', unlocks: 'مهارة الاستراتيجي', body: 'تفتح مهارة الاستراتيجي لجنرال يمكنه تولي هذا الدور.', cost: '1,000 لكل جنرال.' },
      },
      spendTitle: 'أيها تنفق أولًا',
      spendItems: [
        'الزرقاء هي الأكثر تقييدًا، لذلك أنفقها على جنرالات وحدة الهاي شين قبل إنفاق الحمراء عليهم.',
        'ستعاني دائمًا من نقص الحمراء — يحتاج جنرال UR واحد إلى 1,750.',
        'لا تهم البرتقالية والخضراء كثيرًا حتى تحصل على جنرال يمكنه تولي دور القائد أو الاستراتيجي. راجع قسم القائد والاستراتيجي.',
      ],
    },
    leaders: {
      intro: 'مهارتان اختياريتان. تُطلق كل منهما في الجولة الأولى، وتسببان عقوبة إذا مات حاملها.',
      roles: {
        leader: { label: 'القائد', stone: 'الكرستالات البرتقالية', riskLabel: 'إذا مات قائدك', risk: 'ستخسر المعركة فورًا، حتى لو بقيت كل الوحدات الأخرى حية.' },
        strategist: { label: 'الاستراتيجي', stone: 'الكرستالات الخضراء', riskLabel: 'إذا مات استراتيجيك', risk: 'تصاب كل وحدة حليفة بالارتباك لمدة جولة واحدة.' },
      },
      unlock: 'الفتح: ',
      generalsLabel: 'الجنرالات',
      howTitle: 'طريقة العمل',
      howItems: [
        'تُطلق المهارة في الجولة الأولى بمجرد وضع جنرال يحمل الدور في تشكيلتك.',
        'قائد واحد واستراتيجي واحد لكل تشكيلة. يمكنك تشغيلهما معًا، لكن واحدًا فقط من كل نوع.',
        'يختلف التأثير باختلاف الجنرال، لذلك يهم اختيار حامل الخانة بقدر ملء الخانة نفسها.',
        'العقوبتان ليستا متساويتين. خسارة الاستراتيجي تكلف جولة واحدة، أما خسارة القائد فتكلف المعركة؛ لذا ضع الخانة على جنرال يصعب استهدافه.',
      ],
    },
    interactions: {
      intro: 'عندما يتعارض تأثيران، تحدد هذه القاعدة أيهما له الأولوية أو ما إذا كان كلاهما يبقى فعالًا.',
      labels: { overwrite: 'يستبدل أحدهما الآخر', stack: 'يتراكم بترتيب أولوية', guard_overwrite: 'يستبدل الصد بقيمة الحكم' },
      notes: {
        overwrite: 'يبقى آخر تأثير طُبق فعالًا فقط. يؤدي تطبيق أحدهما إلى إزالة الآخر.',
        stack: 'يمكن أن يكون كلاهما فعالًا في الوقت نفسه. يُفعّل إبطال الهجوم أولًا ويخفض الضرر إلى 0، لكن كلا التأثيرين يستهلك شحنة.',
        guard_overwrite: 'تطبيق الصد على جنرال لديه صد فعّال لا يستبدله دائمًا. يقارن النظام قيمة حكم لكل منهما: نسبة التخفيض × الشحنات المتبقية. تفوز القيمة الأعلى. وإذا خسر التأثير الجديد يبقى الصد الحالي دون تغيير.',
      },
      formula: 'قيمة الحكم = نسبة التخفيض × الشحنات المتبقية',
      example: '30% × شحنتين = 60  مقابل  70% × شحنة واحدة = 70  ← يستبدل 70%',
      effects: { Provoke: 'الاستفزاز', 'Less Likely to be Targeted': 'أقل عرضة للاستهداف', Confusion: 'الارتباك', Betrayal: 'الخيانة', Rampage: 'الهياج', 'Attack Nullification': 'إبطال الهجوم', Guard: 'الصد' },
    },
    targeting: {
      intro: 'كيفية اختيار المهارات لأهدافها، وكيف تؤثر الحالات الخاصة في الاستهداف.',
      rules: {
        'Skill Target Selection Priority': { title: 'أولوية اختيار هدف المهارة', body: 'عندما يكون لدى هدف حالة خاصة، يتبع اختيار الهدف الترتيب التالي:', list: ['وجود الحالة (مثل الاستفزاز أو الارتباك)', 'الأولوية المحددة في المهارة (مثل أعلى هجوم أو أدنى دفاع)'] },
        'Unmet Target Conditions': { title: 'شروط الهدف غير المتحققة', body: 'إذا حددت المهارة هدفًا غير موجود في الميدان (مثل "جنرال تشين عدو" عند عدم وجود جنرال تشين)، فلا يتفعل التأثير.' },
        'Random Targeting': { title: 'الاستهداف العشوائي', body: 'تختار المهارات التي تستهدف "جنرالًا عدوًا عشوائيًا" الهدف عشوائيًا بلا قيود وتتجاهل الاستفزاز.' },
        Provocation: { title: 'الاستفزاز', bullets: ['يركز هجمات ضرر العدو الواردة على الوحدة المستفَزّة.', 'لا يؤثر في استهداف المهارات التي لا تسبب ضررًا.', 'لا يتراكم؛ وإعادة تطبيقه تستبدل الحالة الحالية.'] },
        Confusion: { title: 'الارتباك', bullets: ['تهاجم الوحدة المتأثرة الحلفاء والأعداء بلا تمييز.', 'تستخدم المهارات إن توفرت، وإلا تستخدم الهجمات العادية.', 'إذا لم يبق حلفاء أحياء، تهاجم الأعداء طبيعيًا.', 'لا يتراكم؛ وإعادة تطبيقه تحدّث المدة إلى المدة الأطول.', 'لا يمكن تطبيقه على وحدات تحت تأثير الخيانة أو الهياج (فهذه الحالات لها الأولوية)؛ لكن تطبيق الخيانة أو الهياج على وحدة مرتبكة يستبدل الارتباك.'] },
      },
    },
    effects: {
      intro: 'تعزيزات وإضعافات يمكن تطبيقها أثناء معارك حرب القلاع.',
      buffsTitle: 'التعزيزات',
      debuffsTitle: 'الإضعافات',
      items: {
        'Less Likely to be Targeted': { name: 'أقل عرضة للاستهداف', description: 'تُستبعد الوحدة من استهداف الهجمات العادية وهجمات المهارات للعدو.' },
        Reckless: { name: 'متهور', description: 'يزيد قوة الهجوم كثيرًا، لكن الضرر المتلقى يزداد أيضًا.' },
        'Evasion (Dodge Chance)': { name: 'التفادي', description: 'احتمال تفادي الهجمات الواردة.' },
        Guard: { name: 'الصد', description: 'تقلل الضرر من هجوم محدد، وتُستهلك بعد عدد محدد من التفعيلات.' },
        'Attack Nullification': { name: 'إبطال الهجوم', description: 'تخفض ضرر هجوم محدد إلى 0، وتُستهلك بعد عدد محدد من التفعيلات.' },
        'Sure Hit': { name: 'إصابة مؤكدة', description: 'تصيب الهجمات دائمًا بغض النظر عن معدل الإصابة أو التفادي.' },
        'Status Effect Immunity': { name: 'مناعة ضد الحالات', description: 'تمنع تطبيق الإضعافات (باستثناء الاستفزاز)، وتُستهلك بعد عدد محدد من التفعيلات.' },
        Provoke: { name: 'الاستفزاز', description: 'يركز هجمات ضرر العدو على نفسه.' },
        Poison: { name: 'السم', description: 'تتلقى الوحدة ضررًا يساوي نسبة من أقصى صحتها في بداية كل جولة.' },
        'Severe Poison': { name: 'السم الشديد', description: 'تتلقى الوحدة ضررًا يساوي نسبة من أقصى صحتها في بداية كل جولة، وهو أكبر من السم.' },
        Burn: { name: 'الحرق', description: 'تتلقى الوحدة ضررًا يساوي نسبة من أقصى صحتها في بداية كل جولة.' },
        Illusion: { name: 'الوهم', description: 'يخفض معدل الإصابة.' },
        Paralysis: { name: 'الشلل', description: 'احتمال منع الفعل (الهجوم العادي وهجوم المهارة) في كل جولة.' },
        Confusion: { name: 'الارتباك', description: 'تهاجم الحلفاء والأعداء بلا تمييز.' },
        Betrayal: { name: 'الخيانة', description: 'تهاجم الجنرالات الحلفاء أثناء فعالية التأثير.' },
        Rampage: { name: 'الهياج', description: 'تزداد قوة الهجوم، لكن توجد فرصة لمهاجمة الجنرالات الحلفاء.' },
        Fear: { name: 'الخوف', description: 'يتعطل استرداد المعنويات.' },
        'Attack Seal': { name: 'تعطيل الهجوم', description: 'يعطل الفعل المحدد. وتشمل الأنواع تعطيل الهجوم العادي وتعطيل هجوم المهارة وتعطيل الهجوم (كلاهما).' },
        'HP Seal': { name: 'ختم استعادة الصحة', description: 'يتعطل استرداد الصحة.' },
      },
    },
    matchups: {
      intro: 'يتبع الضرر بين أنواع الوحدات علاقة حجر-ورق-مقص.',
      chartAlt: 'مخطط مواجهات الوحدات',
      strongVs: 'متفوق ضد',
      units: { Cavalry: 'فرسان', Archer: 'سهامين', Shield: 'دروع', Infantry: 'مشاة', 'Siege Weapon / Gate': 'سلاح حصار / بوابة' },
      mutualNote: 'تلحق المشاة وأسلحة الحصار / البوابات ضررًا متزايدًا لبعضها بعضًا.',
    },
    types: {
      intro: 'تستخدم المهارات العادية ثلاث فئات. ويمكن للجنرالات المؤهلين فتح إحدى مهارتي دور التشكيلة.',
      items: {
        '戦技': { label: 'مهارة قتالية', description: 'مهارات نشطة تُستخدم أثناء المعركة. تسبب ضررًا أو تطبق تعزيزات وإضعافات أو تعالج.' },
        '軍略': { label: 'استراتيجية عسكرية', description: 'مهارات شبيهة بالسلبية تمنح مجموعتك تعزيزات مستمرة أو تأثيرات مشروطة.' },
        '内政': { label: 'الشؤون الداخلية', description: 'مهارات غير قتالية تمنح مكافآت خصائص على مستوى التحالف، وتبقى فعالة حتى عند عدم نشر الوحدة.' },
        '総大将スキル': { label: 'مهارة القائد', description: 'مهارة دور اختيارية في الجولة الأولى. لا تضم كل تشكيلة إلا قائدًا واحدًا، وتؤدي خسارته إلى خسارة المعركة فورًا.' },
        '軍師スキル': { label: 'مهارة الاستراتيجي', description: 'مهارة دور اختيارية في الجولة الأولى. لا تضم كل تشكيلة إلا استراتيجيًا واحدًا، وتؤدي خسارته إلى إصابة جميع الحلفاء بالارتباك لجولة واحدة.' },
      },
    },
  },
  fr: {
    basicsIntro: 'La Conquête d’Alliance est un combat de territoire entre alliances. Le but n’est pas seulement de gagner des combats isolés, mais de choisir les bons châteaux, de bien placer ses défenses et de dépenser au bon moment un nombre limité d’actions.',
    coreLoop: 'Déroulement de base',
    coreLoopItems: [
      'Un groupe réunit 7 alliances qui se disputent des châteaux.',
      'Votre alliance déclare les châteaux à attaquer, puis les membres placent leurs équipes d’attaque ou de défense.',
      'Les défenseurs protègent les châteaux occupés, tandis que les attaquants tentent de prendre les cibles déclarées pendant la phase d’invasion.',
      'Remporter la carte exige avant tout une bonne coordination de l’alliance : la puissance des généraux ne suffit pas.',
    ],
    dailyTiming: 'Horaires de la journée',
    dailyTimingItems: [
      'Le placement en garnison est possible du début de la déclaration jusqu’à la fin de l’invasion.',
      'Les attaques réservées sont programmées avant la phase d’invasion et se lancent automatiquement à son ouverture.',
      'Les équipes d’invasion directe se placent pendant la phase d’invasion.',
      'Dans la mesure du possible, réglez la participation et choisissez les rôles avant le début de cette phase.',
    ],
    actions: 'Actions et sorties',
    actionsItems: [
      'Chaque général engagé dans une équipe consomme des actions ou des ressources de sortie, selon l’activité.',
      'Une équipe de 4 généraux coûte plus cher qu’une équipe partielle, mais elle est bien plus sûre en combat réel.',
      'Les ressources de sortie se régénèrent chaque jour, et certaines recharges coûtent des joyaux.',
      'Ne dépensez pas vos meilleures équipes trop tôt : le château et le moment doivent en valoir la peine.',
    ],
    priority: 'Priorité simple : défendre les châteaux clés → attaquer les cibles déclarées → dépenser le reste efficacement',
    priorityNote: 'Si vous débutez, cherchez d’abord à savoir où l’alliance a besoin de renforts avant d’optimiser chaque affrontement individuel.',
    statsScreen: {
      intro: 'L’écran des stats CW affiche les statistiques propres à la Conquête d’Alliance d’un général. Ces valeurs diffèrent de celles de sa fiche habituelle et ne servent qu’en Conquête.',
      openTitle: 'Comment l’ouvrir',
      openBody: 'Ouvrez la page d’un personnage, puis touchez l’icône de château sur le côté droit de l’écran.',
      accessAlt: 'Page de personnage avec l’icône des stats de Conquête',
      screenAlt: 'Écran des stats de Conquête avec les lignes numérotées',
      markers: {
        '1': { title: 'PV', body: 'PV maximum en Conquête d’Alliance.' },
        '2': { title: 'Moral', body: 'Moral maximum. Les compétences de moral se calculent sur ce plafond.' },
        '3': { title: 'Attaque max', body: 'Valeur d’attaque haute utilisée dans le calcul des dégâts.' },
        '4': { title: 'Attaque min', body: 'Valeur d’attaque basse utilisée dans le calcul des dégâts.' },
        '5': { title: 'Dégâts en avantage', body: 'Bonus de dégâts appliqué lorsque l’unité bénéficie d’une affinité favorable.' },
        '6': { title: 'Dégâts en désavantage', body: 'Malus de dégâts appliqué lorsque l’unité subit une affinité défavorable.' },
        '7': { title: 'Précision', body: 'Aide les attaques à toucher au lieu de manquer.' },
        '8': { title: 'Taux critique', body: 'Probabilité qu’une attaque inflige un coup critique.' },
        '9': { title: 'Dégâts critiques', body: 'Dégâts supplémentaires appliqués lors d’un coup critique.' },
        '10': { title: 'Pénétration de défense', body: 'Permet d’ignorer une partie de la défense adverse. Ce n’est pas la même chose que l’attaque.' },
        '11': { title: 'Défense', body: 'Réduit les dégâts subis.' },
        '12': { title: 'Esquive', body: 'Chance d’esquiver les attaques reçues.' },
      },
      notesTitle: 'Notes sur l’écran',
      notes: [
        'Les valeurs vertes entre parenthèses indiquent le bonus actuellement ajouté à la stat ou à l’effet.',
        'L’attaque max et l’attaque min comptent toutes les deux, car la valeur d’attaque utilisée peut se situer n’importe où entre les deux.',
      ],
      notesMatchups: { before: 'L’avantage de type suit les affinités entre unités. Voir le guide ', label: 'Affinités des unités', after: ' pour le tableau complet.' },
      relatedTitle: 'Pages liées',
      related: { before: 'Voir ', stats: 'Augmenter ses stats CW', middle: ' pour les sources de progression, et ', buffs: 'Buffs', after: ' pour les références de buffs de Conquête.' },
    },
    stats: {
      intro: 'Les stats CW dépendent de plusieurs systèmes de progression, pas seulement de la page Buffs. Les buffs jouent un rôle important, mais la valeur finale dépend aussi du général, des troupes, des armes et des petits bonus accordés par les cartes scène.',
      affectsTitle: 'Ce qui influence les stats CW',
      affectsItems: [
        'Le niveau du personnage. Le niveau 85 est le maximum.',
        'La progression en étoiles. Terminer la page 1 accorde le bonus de stats maximal ; terminer la page 2 n’ajoute rien aux stats CW.',
        'Le niveau LG.',
        'Le niveau des troupes.',
        'Le niveau et la rareté de l’arme.',
        'Les cartes scène du personnage, qui apportent un petit gain de stats pour les joueurs qui optimisent à fond.',
      ],
    },
    roles: {
      intro: 'Les rôles sont des affectations personnelles de Conquête d’Alliance. Leurs bonus ne profitent qu’au joueur qui les choisit : prenez donc le rôle correspondant à ce que vous comptez réellement faire ce jour-là.',
      items: {
        'Assault Captain': { name: 'Capitaine d’assaut', trigger: 'En invasion', effect: 'Augmente l’attaque de vos propres généraux.' },
        'Defense Captain': { name: 'Capitaine de défense', trigger: 'En garnison', effect: 'Augmente la défense de vos propres généraux.' },
        'Support Captain': { name: 'Capitaine de soutien', trigger: 'En invasion ou en garnison', effect: 'Augmente le plafond de moral de vos propres généraux.' },
        'Bandit Hunt Captain': { name: 'Capitaine de chasse aux bandits', trigger: 'Pendant la Chasse aux bandits', effect: 'Augmente l’attaque et la défense de vos propres généraux.' },
      },
      costTitle: 'Règles de coût',
      costItems: [
        'Deux rôles sont gratuits et deux rôles coûtent des joyaux chaque jour.',
        'La répartition entre rôles gratuits et payants change chaque jour et reste la même pour toutes les alliances.',
        'Le premier jour, tous les rôles sont gratuits.',
        'Quitter un rôle payant ne rembourse pas les joyaux.',
      ],
      lockTitle: 'Verrouillage',
      lockItems: [
        'Vous pouvez changer de rôle librement avant le début de la phase d’invasion.',
        'Si vous avez oublié de choisir un rôle, vous pouvez encore le faire pendant la phase d’invasion.',
        'Une fois l’invasion commencée, un rôle déjà choisi ne peut plus être changé.',
        'La liste des rôles gratuits est mise à jour chaque jour à 8 h 00.',
      ],
    },
    bandits: {
      intro: 'La Chasse aux bandits est un objectif annexe de la Conquête d’Alliance : l’alliance affronte des équipes de bandits contrôlées par le jeu pour obtenir des récompenses de classement. Elle consomme les mêmes actions limitées que les attaques de châteaux.',
      whatTitle: 'Ce que c’est',
      whatItems: [
        'La Chasse aux bandits est disponible pendant la phase d’invasion de la Conquête normale.',
        'L’alliance est classée sur le nombre total de chasses de la saison.',
        'Elle rapporte des récompenses de classement d’alliance et des points de classement personnels.',
        'Les armes de guerre sélectionnées ne peuvent pas servir à la Chasse aux bandits.',
      ],
      runsTitle: 'Comment ça se déroule',
      runsItems: [
        'Choisissez « Chasse aux bandits », sélectionnez une équipe, puis lancez la série.',
        'L’équipe enchaîne les combats tant qu’elle gagne.',
        'Si plusieurs joueurs lancent une chasse, les séries s’enchaînent dans l’ordre.',
        'Une équipe en combat ou en attente ne peut pas servir à l’invasion ni à la garnison avant son retour.',
      ],
      useTitle: 'Quand l’utiliser',
      useItems: [
        'Lorsque l’alliance vise le classement de la Chasse aux bandits ou qu’il vous reste des ressources d’action.',
        'Évitez d’immobiliser des généraux importants si un combat de château a encore besoin d’eux.',
        'Le rôle Capitaine de chasse aux bandits est le meilleur choix pour les joueurs assignés à cette tâche.',
        'Si la phase d’invasion se termine en pleine série, seuls les combats déjà achevés sont comptabilisés.',
      ],
    },
    debuffs: {
      intro: 'La résistance aux débuffs réduit certains effets négatifs avant leur application. Elle détermine si une baisse d’attaque, une baisse de défense ou une pénétration de défense prend effectivement effet.',
      coversTitle: 'Ce que couvre la résistance',
      coversItems: [
        'La résistance à la baisse d’attaque réduit les effets qui abaissent l’attaque.',
        'La résistance à la baisse de défense réduit les effets qui abaissent la défense.',
        'La résistance à la pénétration de défense réduit les effets de pénétration.',
        'Elle agit aussi bien contre les compétences de combat que contre celles de stratégie.',
      ],
      notesTitle: 'Points importants',
      notesItems: [
        'La pénétration de défense est traitée comme un débuff dans ce calcul de résistance.',
        'Si la résistance dépasse le débuff, le débuff final tombe à 0%.',
        'Les baisses d’attaque s’appliquent quand même aux attaques critiques.',
        'Plusieurs débuffs sont additionnés avant que la résistance ne soit soustraite.',
      ],
      formula: 'Débuff final % = max(0 ; total des débuffs % - total des résistances %)',
      examples: [
        'Exemple 1 : 40% de baisse d’attaque contre 50% de résistance donne 0%.',
        'Exemple 2 : 40% + 30% de baisse d’attaque contre 50% de résistance donne 20%.',
      ],
    },
    terrain: {
      intro: 'Les effets de terrain sont des débuffs associés aux routes d’invasion entre les châteaux. Ils peuvent réduire vos dégâts, augmenter les dégâts subis ou faire commencer votre unité avec moins de PV.',
      noTerrain: 'Aucun terrain',
      items: {
        slope: { name: 'Pente', effect: 'Dégâts infligés -50%', detail: 'Votre unité attaquante inflige 50% de dégâts en moins si elle envahit par une route en pente.', mitigatedBy: 'L’Aptitude Pente réduit cette perte de dégâts.' },
        forest: { name: 'Forêt', effect: 'Dégâts infligés -50%', detail: 'Votre unité attaquante inflige 50% de dégâts en moins si elle envahit par une route en forêt.', mitigatedBy: 'L’Aptitude Forêt réduit cette perte de dégâts.' },
        river: { name: 'Rivière', effect: 'Dégâts subis +50%', detail: 'Votre unité attaquante subit 50% de dégâts en plus si elle emprunte une voie d’eau.', mitigatedBy: 'L’Aptitude Voie d’eau réduit cette hausse des dégâts subis.' },
        swamp: { name: 'Marais', effect: 'Dégâts subis +50%', detail: 'Votre unité attaquante subit 50% de dégâts en plus si elle emprunte une route marécageuse.', mitigatedBy: 'L’Aptitude Boue réduit cette hausse des dégâts subis.' },
        checkpoint: { name: 'Poste de garde', effect: 'PV au départ -30%', detail: 'Votre unité attaquante commence le combat avec 30% de PV en moins si elle emprunte une route avec un poste de garde.', mitigatedBy: 'L’Éclaireur réduit cette perte de PV au départ.' },
        ambush: { name: 'Embuscade', effect: 'PV au départ -30%', detail: 'Votre unité attaquante commence le combat avec 30% de PV en moins si elle emprunte une route exposée aux embuscades.', mitigatedBy: 'La Protection d’unité réduit cette perte de PV au départ.' },
      },
      routeText: 'Quand plusieurs routes mènent au même château, le jeu préfère une route sans débuff de terrain. Si toutes les routes en ont un, il choisit celle dont la pénalité restante est la plus faible une fois vos buffs de résistance au terrain appliqués. À pénalité égale, l’ordre de priorité est {{priority}}. Les terrains peuvent changer d’un événement de Conquête à l’autre.',
    },
    crystals: {
      intro: 'Quatre types de cristaux permettent de débloquer des compétences. Ils ne sont pas interchangeables : chacun a un usage précis.',
      items: {
        red: { name: 'Cristal rouge', unlocks: 'Compétences de Conquête', body: 'Le cristal standard. Il débloque les trois compétences de Conquête de n’importe quel général.', cost: '1 750 pour débloquer entièrement un général UR (100 / 550 / 1 100 par compétence). SR : 800, R : 595.' },
        blue: { name: 'Cristal bleu', unlocks: 'Unité Hi Shin uniquement', body: 'Fonctionne exactement comme un cristal rouge, mais ne peut servir que pour les généraux de l’unité Hi Shin.', cost: 'Mêmes coûts que le rouge. Utilisez-les d’abord sur les membres Hi Shin et gardez vos rouges pour tous les autres.' },
        orange: { name: 'Cristal orange', unlocks: 'Compétence de Leader', body: 'Débloque la compétence de Leader d’un général qui peut tenir ce rôle.', cost: '1 000 par général.' },
        green: { name: 'Cristal vert', unlocks: 'Compétence de Stratège', body: 'Débloque la compétence de Stratège d’un général qui peut tenir ce rôle.', cost: '1 000 par général.' },
      },
      spendTitle: 'Quels cristaux utiliser en priorité',
      spendItems: [
        'Le bleu est le plus limité : utilisez-le sur les généraux de l’unité Hi Shin avant d’y mettre du rouge.',
        'Le rouge est celui qui manquera toujours — un seul général UR coûte 1 750.',
        'L’orange et le vert ne servent que si vous avez un général capable de tenir le rôle de Leader ou de Stratège. Voir Leader et Stratège.',
      ],
    },
    leaders: {
      intro: 'Ces deux compétences facultatives se déclenchent au tour 1 et vous pénalisent si leur porteur meurt.',
      roles: {
        leader: { label: 'Leader', stone: 'Cristaux orange', riskLabel: 'Si votre Leader meurt', risk: 'Vous perdez la bataille immédiatement, même si toutes vos autres unités sont encore en vie.' },
        strategist: { label: 'Stratège', stone: 'Cristaux verts', riskLabel: 'Si votre Stratège meurt', risk: 'Toutes vos unités alliées subissent la Confusion pendant 1 tour.' },
      },
      unlock: 'Déblocage : ',
      generalsLabel: 'Généraux',
      howTitle: 'Comment ça marche',
      howItems: [
        'La compétence se déclenche au tour 1, dès qu’un général portant le rôle est placé dans votre formation.',
        'Un seul Leader et un seul Stratège par formation. Vous pouvez avoir les deux, mais pas deux fois le même.',
        'L’effet change d’un général à l’autre : le choix du porteur compte autant que le fait de remplir la case.',
        'Les deux pénalités n’ont pas la même gravité. Perdre le Stratège coûte un tour ; perdre le Leader coûte la bataille. Confiez donc ce rôle à un général rarement pris pour cible.',
      ],
    },
    interactions: {
      intro: 'Quand deux effets se contredisent, ces règles déterminent lequel l’emporte ou si les deux restent actifs.',
      labels: { overwrite: 'L’un remplace l’autre', stack: 'Cumul avec ordre de priorité', guard_overwrite: 'La Garde est remplacée selon sa valeur' },
      notes: {
        overwrite: 'Seul le dernier effet appliqué reste actif. Appliquer l’un retire l’autre.',
        stack: 'Les deux peuvent être actifs en même temps. L’Annulation d’attaque agit en premier et réduit les dégâts à 0 — mais les deux effets consomment quand même une charge.',
        guard_overwrite: 'Appliquer une Garde à un général qui en possède déjà une ne remplace pas toujours l’effet actif. Le système compare la valeur de priorité de chaque Garde : % de réduction × charges restantes. La plus élevée l’emporte. Si le nouvel effet a la valeur la plus faible, la Garde existante reste inchangée.',
      },
      formula: 'Valeur de priorité = % de réduction × charges restantes',
      example: '30% × 2 charges = 60  contre  70% × 1 charge = 70  →  70% remplace',
      effects: { Provoke: 'Provocation', 'Less Likely to be Targeted': 'Ciblage réduit', Confusion: 'Confusion', Betrayal: 'Trahison', Rampage: 'Furie', 'Attack Nullification': 'Annulation d’attaque', Guard: 'Garde' },
    },
    targeting: {
      intro: 'Ces règles expliquent comment les compétences choisissent leur cible et comment les effets d’état influencent ce choix.',
      rules: {
        'Skill Target Selection Priority': {
          title: 'Priorité de sélection des cibles',
          body: 'Quand une cible porte un effet d’état particulier, la sélection suit cet ordre :',
          list: ['Présence d’un effet d’état (par exemple Provocation ou Confusion)', 'Priorité indiquée par la compétence (attaque la plus élevée, défense la plus faible…)'],
        },
        'Unmet Target Conditions': {
          title: 'Conditions de cible non remplies',
          body: 'Si une compétence vise une cible absente du terrain (par exemple « général Qin ennemi » alors qu’aucun général Qin n’est présent), l’effet ne se déclenche tout simplement pas.',
        },
        'Random Targeting': {
          title: 'Ciblage aléatoire',
          body: 'Les compétences qui visent un « général ennemi aléatoire » choisissent sans restriction et ignorent la Provocation.',
        },
        Provocation: {
          title: 'Provocation',
          bullets: [
            'Concentre les attaques de dégâts ennemies sur l’unité provoquée.',
            'N’influence pas le ciblage des compétences sans dégâts.',
            'Ne se cumule pas — une nouvelle application remplace l’état existant.',
          ],
        },
        Confusion: {
          title: 'Confusion',
          bullets: [
            'L’unité touchée attaque ses alliés et ses ennemis sans distinction.',
            'Elle utilise ses compétences si elles sont disponibles, sinon ses attaques normales.',
            'S’il ne reste aucun allié en vie, elle attaque normalement les ennemis.',
            'Ne se cumule pas : une nouvelle application conserve simplement la durée la plus longue.',
            'Ne peut pas s’appliquer à une unité déjà sous Trahison ou Furie (ces états sont prioritaires) ; en revanche, une Trahison ou une Furie appliquée à une unité sous Confusion remplace la Confusion.',
          ],
        },
      },
    },
    effects: {
      intro: 'Liste des buffs et débuffs pouvant être appliqués pendant les batailles de Conquête d’Alliance.',
      buffsTitle: 'Buffs',
      debuffsTitle: 'Débuffs',
      items: {
        'Less Likely to be Targeted': { name: 'Ciblage réduit', description: 'L’unité est exclue du ciblage des attaques normales et des attaques de compétence ennemies.' },
        Reckless: { name: 'Témérité', description: 'Augmente fortement la puissance d’attaque, mais les dégâts subis augmentent aussi.' },
        'Evasion (Dodge Chance)': { name: 'Esquive', description: 'Chance d’esquiver les attaques reçues.' },
        Guard: { name: 'Garde', description: 'Réduit les dégâts d’une attaque. L’effet disparaît après un nombre défini de déclenchements.' },
        'Attack Nullification': { name: 'Annulation d’attaque', description: 'Réduit à 0 les dégâts d’une attaque. L’effet disparaît après un nombre défini de déclenchements.' },
        'Sure Hit': { name: 'Coup assuré', description: 'Les attaques touchent toujours, quelles que soient la précision et l’esquive.' },
        'Status Effect Immunity': { name: 'Immunité aux altérations d’état', description: 'Bloque l’application des débuffs, à l’exception de la Provocation. L’effet disparaît après un nombre défini de déclenchements.' },
        Provoke: { name: 'Provocation', description: 'Concentre sur soi les attaques de dégâts ennemies.' },
        Poison: { name: 'Poison', description: 'Inflige un pourcentage des PV max en dégâts au début de chaque tour.' },
        'Severe Poison': { name: 'Poison violent', description: 'Inflige un pourcentage des PV max en dégâts au début de chaque tour, plus élevé que le Poison.' },
        Burn: { name: 'Brûlure', description: 'Inflige un pourcentage des PV max en dégâts au début de chaque tour.' },
        Illusion: { name: 'Illusion', description: 'Réduit la précision.' },
        Paralysis: { name: 'Paralysie', description: 'Risque, à chaque tour, d’empêcher d’agir (attaque normale et attaque de compétence).' },
        Confusion: { name: 'Confusion', description: 'Attaque alliés et ennemis sans distinction.' },
        Betrayal: { name: 'Trahison', description: 'Attaque les généraux alliés tant que l’effet est actif.' },
        Rampage: { name: 'Furie', description: 'La puissance d’attaque augmente, mais l’unité risque d’attaquer des généraux alliés.' },
        Fear: { name: 'Peur', description: 'Le regain de moral est désactivé.' },
        'Attack Seal': { name: 'Sceau d’attaque', description: 'Désactive l’action visée. Variantes : sceau d’attaque normale, sceau d’attaque de compétence, sceau d’attaque (les deux).' },
        'HP Seal': { name: 'Sceau de soin', description: 'Le soin des PV est désactivé.' },
      },
    },
    matchups: {
      intro: 'Les dégâts entre types d’unités suivent un principe de pierre-papier-ciseaux.',
      chartAlt: 'Tableau des affinités entre unités',
      strongVs: 'fort contre',
      units: { Cavalry: 'Cavaliers', Archer: 'Archers', Shield: 'Boucliers', Infantry: 'Fantassins', 'Siege Weapon / Gate': 'Engins de siège / Portes' },
      mutualNote: 'Les fantassins et les engins de siège ou portes bénéficient mutuellement d’un bonus de dégâts.',
    },
    types: {
      intro: 'Les compétences normales se répartissent en trois catégories. Les généraux éligibles peuvent en plus débloquer l’un des deux rôles de formation.',
      items: {
        '戦技': { label: 'Compétence de combat', description: 'Compétences actives utilisées en bataille pour infliger des dégâts, appliquer des buffs ou des débuffs, ou soigner.' },
        '軍略': { label: 'Stratégie militaire', description: 'Compétences passives qui accordent à votre équipe des buffs permanents ou des effets conditionnels.' },
        '内政': { label: 'Affaires intérieures', description: 'Compétences hors combat qui accordent des bonus de stats à toute l’alliance. Ces bonus restent actifs même lorsque l’unité n’est pas déployée.' },
        '総大将スキル': { label: 'Compétence de Leader', description: 'Compétence de rôle facultative au tour 1. Une formation ne peut avoir qu’un seul Leader ; la mort de ce général entraîne immédiatement la défaite.' },
        '軍師スキル': { label: 'Compétence de Stratège', description: 'Compétence de rôle facultative au tour 1. Une formation ne peut avoir qu’un seul Stratège ; sa mort inflige la Confusion à tous les alliés pendant 1 tour.' },
      },
    },
  },
}

function guideCopy(locale, key, fallback) {
  return GUIDE_COPY[locale?.code]?.[key] || fallback
}

function guideSectionCopy(locale, section, key, fallback) {
  const sectionValue = GUIDE_COPY[locale?.code]?.[section]
  if (!key) return sectionValue || fallback
  const value = sectionValue?.[key]
  return value === undefined ? fallback : value
}

export function GuideCard({title,children,accent='var(--terra)'}) {
  return (
    <div className="guide-card" style={{
      borderRadius:'12px',background:'var(--sur)',border:'1px solid var(--bdr)',
      borderTop:`4px solid ${accent}`,padding:'1rem',boxShadow:'0 2px 8px rgba(6,38,76,.05)',
    }}>
      <h2 style={{fontSize:'.96rem',fontWeight:900,color:'var(--txt)',margin:'0 0 .5rem'}}>{title}</h2>
      <div style={{fontSize:'.82rem',lineHeight:1.58,color:'var(--txt2)'}}>{children}</div>
    </div>
  )
}

export function GuideList({items}) {
  return (
    <ul style={{margin:'.25rem 0 0 1.05rem',padding:0}}>
      {items.map((item,i)=><li key={i} style={{marginBottom:'.32rem'}}>{item}</li>)}
    </ul>
  )
}

export function GuideFormula({formula,children}) {
  return (
    <div style={{
      marginTop:'.7rem',padding:'.8rem .9rem',borderRadius:'10px',
      background:'var(--bg2)',border:'1px solid var(--bdr)',fontSize:'.8rem',
    }}>
      <div style={{fontFamily:'monospace',fontWeight:900,color:'var(--navy)',marginBottom:'.45rem'}}>{formula}</div>
      <div style={{color:'var(--txt3)',lineHeight:1.55}}>{children}</div>
    </div>
  )
}

export function GuideMarkedImage({src,alt,markers,aspectRatio}) {
  return (
    <div style={{
      position:'relative',maxWidth:'920px',margin:'0 auto 1rem',borderRadius:'12px',
      overflow:'hidden',background:'var(--bg2)',border:'1px solid var(--bdr)',
      boxShadow:'0 3px 14px rgba(6,38,76,.08)',
    }}>
      <img src={src} alt={alt} loading="lazy" decoding="async" style={{
        display:'block',width:'100%',aspectRatio,objectFit:'contain',background:'var(--bg2)',
      }}/>
      {markers.map(marker=>(
        <div key={marker.id} title={marker.title} style={{
          position:'absolute',left:`${marker.x}%`,top:`${marker.y}%`,transform:'translate(-50%,-50%)',
          width:marker.size||18,height:marker.size||18,borderRadius:'999px',display:'flex',alignItems:'center',justifyContent:'center',
          background:marker.ring?'rgba(229,57,53,.08)':marker.color||'var(--terra)',
          color:marker.ring?'#e53935':'#fff',
          border:marker.ring?'4px solid #e53935':'2px solid #fff',
          boxShadow:marker.ring?'0 0 0 3px rgba(255,255,255,.85),0 2px 10px rgba(0,0,0,.4)':'0 2px 8px rgba(0,0,0,.35)',
          fontSize:marker.ring?'0':'.56rem',fontWeight:900,
        }}>
          {marker.label ?? marker.id}
        </div>
      ))}
    </div>
  )
}

export const FAQ_IMAGES={
  basics:[
    {src:'/guide/basics-map-en.webp',label:'Castle War map overview'},
    {src:'/guide/basics-flow-en.webp',label:'Castle War flow screen'},
  ],
  roles:[
    {src:'/guide/roles-selection.webp',label:'Role selection screen'},
    {src:'/guide/roles-button.webp',label:'Role button on battle map'},
    {src:'/guide/roles-effect.webp',label:'Role effect view'},
  ],
  bandits:[
    {src:'/guide/bandit-button.webp',label:'Bandit Hunt button'},
    {src:'/guide/bandit-start.webp',label:'Bandit Hunt start screen'},
    {src:'/guide/bandit-team.webp',label:'Bandit Hunt team setup'},
    {src:'/guide/bandit-results.webp',label:'Bandit Hunt results'},
  ],
}

export function GuideImages({images}) {
  const locale = useLocale()
  const japaneseBasics = locale.code === 'ja' && images === FAQ_IMAGES.basics
  const imageLabels = {
    ja: {
      'Castle War map overview': '同盟争覇戦マップ概要',
      'Castle War flow screen': '同盟争覇戦の進行画面',
      'Role selection screen': '役割選択画面',
      'Role button on battle map': '戦闘マップの役割ボタン',
      'Role effect view': '役割効果画面',
      'Bandit Hunt button': '野盗討伐ボタン',
      'Bandit Hunt start screen': '野盗討伐開始画面',
      'Bandit Hunt team setup': '野盗討伐編成画面',
      'Bandit Hunt results': '野盗討伐結果',
    },
    ar: {
      'Castle War map overview': 'نظرة عامة على خريطة حرب القلاع',
      'Castle War flow screen': 'شاشة سير حرب القلاع',
      'Role selection screen': 'شاشة اختيار الدور',
      'Role button on battle map': 'زر الدور على خريطة المعركة',
      'Role effect view': 'عرض تأثير الدور',
      'Bandit Hunt button': 'زر مطاردة قطاع الطرق',
      'Bandit Hunt start screen': 'شاشة بدء مطاردة قطاع الطرق',
      'Bandit Hunt team setup': 'إعداد فريق مطاردة قطاع الطرق',
      'Bandit Hunt results': 'نتائج مطاردة قطاع الطرق',
    },
    fr: {
      'Castle War map overview': 'Vue d’ensemble de la carte de Conquête',
      'Castle War flow screen': 'Écran de déroulement de la Conquête',
      'Role selection screen': 'Écran de sélection du rôle',
      'Role button on battle map': 'Bouton de rôle sur la carte de bataille',
      'Role effect view': 'Vue des effets du rôle',
      'Bandit Hunt button': 'Bouton Chasse aux bandits',
      'Bandit Hunt start screen': 'Écran de départ de la Chasse aux bandits',
      'Bandit Hunt team setup': 'Composition d’équipe pour la Chasse aux bandits',
      'Bandit Hunt results': 'Résultats de la Chasse aux bandits',
    },
  }
  return (
    <div style={{margin:'0 auto 1.25rem',maxWidth:'900px'}}>
      <div style={{display:'grid',gridTemplateColumns:`repeat(auto-fit,minmax(${japaneseBasics ? 280 : 160}px,1fr))`,gap:'10px',alignItems:'start'}}>
        {images.map(img=>{
          const label = imageLabels[locale.code]?.[img.label] || img.label
          const cardStyle = {
            display:'block',borderRadius:'10px',overflow:'hidden',background:'var(--sur)',
            border:'1px solid var(--bdr)',boxShadow:'0 2px 8px rgba(6,38,76,.06)',textDecoration:'none',
          }
          const caption = <div style={{fontSize:'.7rem',fontWeight:700,color:'var(--txt2)',padding:'.45rem .55rem',lineHeight:1.3}}>{label}</div>
          if(japaneseBasics){
            const flow=img.src==='/guide/basics-flow-en.webp'
            const source=flow?'/guide/basics-flow-ja.png':'/guide/basics-map-ja.png'
            return (
              <div key={img.src} style={cardStyle}>
                {flow
                  ? <div className="guide-ja-basics-crop guide-ja-basics-flow"><img src={source} alt={label} loading="lazy" decoding="async"/></div>
                  : <a className="guide-ja-basics-map-link" href={source} target="_blank" rel="noopener noreferrer"><img src={source} alt={label} loading="lazy" decoding="async"/></a>}
                {caption}
              </div>
            )
          }
          return (
          <a key={img.src} href={img.src} target="_blank" rel="noopener noreferrer" style={cardStyle}>
            <div style={{aspectRatio:'16 / 10',background:'var(--bg2)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
              <img src={img.src} alt={label} loading="lazy" decoding="async" style={{display:'block',width:'100%',height:'100%',objectFit:'contain'}}/>
            </div>
            {caption}
          </a>
          )
        })}
      </div>
    </div>
  )
}

export function CastleWarBasicsSection(){
  const locale = useLocale()
  return(
    <div>
      <p style={{fontSize:'.82rem',lineHeight:1.65,color:'var(--txt3)',textAlign:'center',maxWidth:'760px',margin:'0 auto 1.4rem'}}>
        {guideCopy(locale, 'basicsIntro', 'Castle War is alliance territory combat. The goal is not only to win single fights, but to choose the right castles, place defenses, and spend limited actions well.')}
      </p>
      <GuideImages images={FAQ_IMAGES.basics}/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:'12px'}}>
        <GuideCard title={guideCopy(locale, 'coreLoop', 'Core Loop')} accent="var(--terra)">
          <GuideList items={[
            ...guideCopy(locale, 'coreLoopItems', [
              'A group contains 7 alliances fighting over castles.',
              'Your alliance declares which castles to attack, then members place attacking or defending teams.',
              'Defenders protect owned castles. Attackers try to break declared targets during invasion time.',
              'Winning the map is a team planning problem, not only a character power check.',
            ]),
          ]}/>
        </GuideCard>
        <GuideCard title={guideCopy(locale, 'dailyTiming', 'Daily Timing')} accent="var(--gold)">
          <GuideList items={[
            ...guideCopy(locale, 'dailyTimingItems', [
              'Garrison placement is available from declaration start until invasion ends.',
              'Attack reservations can be placed before invasion time, then start automatically when invasion opens.',
              'Direct invasion placement happens during the invasion window.',
              'Participation status and role planning should be handled before the active window if possible.',
            ]),
          ]}/>
        </GuideCard>
        <GuideCard title={guideCopy(locale, 'actions', 'Actions and Sorties')} accent="#3d6eb5">
          <GuideList items={[
            ...guideCopy(locale, 'actionsItems', [
              'Each general used in a team consumes action count or sortie resources depending on the activity.',
              'A 4-general team is usually more expensive than a partial team, but is much safer in real fights.',
              'Sortie resources recover daily, and some recovery options cost jewels.',
              'Do not spend strong teams early unless the castle or timing is worth it.',
            ]),
          ]}/>
        </GuideCard>
      </div>
      <GuideFormula formula={guideCopy(locale, 'priority', 'Simple priority: defend key castles -> attack declared targets -> spend leftovers efficiently')}>
        {guideCopy(locale, 'priorityNote', 'If a player is new, the best first step is to understand where the alliance needs bodies before trying to optimize every individual matchup.')}
      </GuideFormula>
    </div>
  )
}

export const CW_STATS_SCREEN_MARKERS=[
  {id:'1',title:'HP',x:5.4,y:30.4,color:'#d8472f',body:'Maximum HP for Castle War.'},
  {id:'2',title:'Morale',x:5.4,y:35.9,color:'#1a9f75',body:'Maximum Morale. Morale skills draw from this cap.'},
  {id:'3',title:'Max Attack',x:5.4,y:41.4,color:'#c0392b',body:'The upper attack value used when damage is calculated.'},
  {id:'4',title:'Min Attack',x:5.4,y:47.0,color:'#c0392b',body:'The lower attack value used when damage is calculated.'},
  {id:'5',title:'Type Advantage Damage',x:5.4,y:52.6,color:'#a85bb6',body:'Bonus special attack effect when the unit has the favorable matchup.'},
  {id:'6',title:'Type Disadvantage Damage',x:5.4,y:58.1,color:'#8b6fbd',body:'Special attack effect shown for unfavorable matchups.'},
  {id:'7',title:'Hit Rate',x:5.4,y:63.8,color:'#a65a7a',body:'Helps attacks connect instead of missing.'},
  {id:'8',title:'Critical Rate',x:5.4,y:69.6,color:'#7a65c7',body:'Chance for an attack to become a critical hit.'},
  {id:'9',title:'Critical Damage',x:5.4,y:75.3,color:'#9a6b1c',body:'Bonus damage applied when a critical hit happens.'},
  {id:'10',title:'Defense Penetration',x:5.4,y:80.9,color:'#5869a8',body:'Helps bypass part of the enemy Defense. It is not the same thing as Attack.'},
  {id:'11',title:'Defense',x:5.4,y:86.6,color:'#2471a3',body:'Reduces incoming damage.'},
  {id:'12',title:'Evasion (Dodge chance)',x:5.4,y:92.2,color:'#1a8a72',body:'Chance to dodge incoming attacks.'},
]

export function CWStatsScreenGuideSection(){
  const locale = useLocale()
  const copy = guideSectionCopy(locale, 'statsScreen', '', {})
  const notesMatchups = guideSectionCopy(locale, 'statsScreen', 'notesMatchups', {
    before: 'Type advantage follows unit matchups. Check the ',
    label: 'Unit Matchups',
    after: ' guide for the matchup chart.',
  })
  const related = guideSectionCopy(locale, 'statsScreen', 'related', {
    before: 'Use ',
    stats: 'How To Raise CW Stats',
    middle: ' for progression sources, and ',
    buffs: 'Buffs',
    after: ' for Castle War buff references.',
  })
  const markers = guideSectionCopy(locale, 'statsScreen', 'markers', {})
  const localizedMarkers = CW_STATS_SCREEN_MARKERS.map(stat => ({
    ...stat,
    title: markers[stat.id]?.title || stat.title,
  }))
  return(
    <div>
      <p style={{fontSize:'.82rem',lineHeight:1.65,color:'var(--txt3)',textAlign:'center',maxWidth:'760px',margin:'0 auto 1.4rem'}}>
        {copy.intro || "The CW Stats screen shows a character's Castle War-specific stats. These values are separate from the normal character detail stats and are used for Castle War."}
      </p>
      <GuideCard title={copy.openTitle || 'How To Open It'} accent="var(--terra)">
        <p style={{margin:'0 0 .8rem'}}>
          {copy.openBody || 'Open a character page, then tap the castle icon on the right side of the screen.'}
        </p>
        <GuideMarkedImage src="/guide/cw-stats-access.webp" alt={copy.accessAlt || 'Character page showing the Castle War stats icon'} markers={[]} aspectRatio="2014 / 1218"/>
      </GuideCard>
      <div style={{height:'12px'}}/>
      <GuideMarkedImage src="/guide/cw-stats-screen.webp" alt={copy.screenAlt || 'Castle War stats screen with numbered stat rows'} markers={localizedMarkers} aspectRatio="1855 / 1194"/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:'12px'}}>
       {CW_STATS_SCREEN_MARKERS.map(stat=>(
          <GuideCard key={stat.id} title={stat.id + '. ' + (markers[stat.id]?.title || stat.title)} accent={stat.color}>
            {markers[stat.id]?.body || stat.body}
         </GuideCard>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'12px',marginTop:'12px'}}>
        <GuideCard title={copy.notesTitle || 'Screen Notes'} accent="var(--gold)">
          <GuideList items={[
            ...(copy.notes || [
              'Green values in parentheses show the bonus portion currently added to that stat or effect.',
              'Max Attack and Min Attack both matter because damage can roll between them.',
            ]),
            <>{notesMatchups.before}<Link to="/guide/matchups" style={{fontWeight:900,color:'var(--terra)',textDecoration:'underline',textUnderlineOffset:'3px'}}>{notesMatchups.label}</Link>{notesMatchups.after}</>,
          ]}/>
        </GuideCard>
        <GuideCard title={copy.relatedTitle || 'Related Pages'} accent="#3d6eb5">
          <div>
            {related.before}<Link to="/guide/stats" style={{fontWeight:900,color:'var(--terra)',textDecoration:'underline',textUnderlineOffset:'3px'}}>{related.stats}</Link>{related.middle}<Link to="/buffs" style={{fontWeight:900,color:'var(--terra)',textDecoration:'underline',textUnderlineOffset:'3px'}}>{related.buffs}</Link>{related.after}
          </div>
        </GuideCard>
      </div>
    </div>
  )
}

export function CWStatsGuideSection(){
  const locale = useLocale()
  const copy = guideSectionCopy(locale, 'stats', '', {})
  return(
    <div>
      <p style={{fontSize:'.82rem',lineHeight:1.65,color:'var(--txt3)',textAlign:'center',maxWidth:'760px',margin:'0 auto 1.4rem'}}>
        {locale?.code === 'en' || !copy.intro ? (
          <>CW stats are affected by several progression systems besides the{' '}
            (<Link to="/buffs" style={{fontWeight:900,color:'var(--terra)',textDecoration:'underline',textUnderlineOffset:'3px'}}>Buffs</Link>) page. Buffs are an important layer, but the final number also depends on the character, troops, weapons, and small scene-card bonuses.</>
        ) : copy.intro}
      </p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'12px'}}>
        <GuideCard title={copy.affectsTitle || 'What Affects CW Stats'} accent="#3d6eb5">
          <GuideList items={[
            ...(copy.affectsItems || [
              'Character level. Level 85 is the maximum.',
              'Character star progress. Maxing the first page gives the maximum stat buff; maxing the second page does not add more CW stat gain.',
              'LG level.',
              'Troop level.',
              'Weapon level and weapon rarity.',
              'Character scene cards, which provide a small stat boost for min-maxers.',
            ]),
          ]}/>
        </GuideCard>
      </div>
    </div>
  )
}

export function RolesGuideSection(){
  const locale = useLocale()
  const copy = guideSectionCopy(locale, 'roles', '', {})
  const roles=[
    {name:'Assault Captain',trigger:'When invading',effect:'Raises attack for your own generals.',accent:'#c0392b'},
    {name:'Defense Captain',trigger:'When garrisoning',effect:'Raises defense for your own generals.',accent:'#2471a3'},
    {name:'Support Captain',trigger:'When invading or garrisoning',effect:'Raises morale cap for your own generals.',accent:'#8e44ad'},
    {name:'Bandit Hunt Captain',trigger:'When doing Bandit Hunt',effect:'Raises attack and defense for your own generals.',accent:'#1a8a72'},
  ]
  return(
    <div>
      <p style={{fontSize:'.82rem',lineHeight:1.65,color:'var(--txt3)',textAlign:'center',maxWidth:'760px',margin:'0 auto 1.4rem'}}>
        {copy.intro || 'Roles are personal Castle War assignments. They only buff the player who set the role, so choose the role that matches what you are actually going to do that day.'}
      </p>
      <GuideImages images={FAQ_IMAGES.roles}/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'12px',marginBottom:'1rem'}}>
        {roles.map(r=>(
          <GuideCard key={r.name} title={copy.items?.[r.name]?.name || r.name} accent={r.accent}>
            <div style={{fontSize:'.74rem',fontWeight:900,color:r.accent,marginBottom:'.35rem'}}>{copy.items?.[r.name]?.trigger || r.trigger}</div>
            <div>{copy.items?.[r.name]?.effect || r.effect}</div>
          </GuideCard>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'12px'}}>
        <GuideCard title={copy.costTitle || 'Cost Rules'} accent="var(--gold)">
          <GuideList items={[
            ...(copy.costItems || [
              'Two roles are free and two roles cost jewels each day.',
              'The free/paid role combination changes daily and is shared across alliances.',
              'The first day starts with all roles free.',
              'Changing away from a paid role does not refund the jewels.',
            ]),
          ]}/>
        </GuideCard>
        <GuideCard title={copy.lockTitle || 'Lock Timing'} accent="var(--terra)">
          <GuideList items={[
            ...(copy.lockItems || [
              'You can change role freely before invasion time starts.',
              'If you forgot to set a role, you can still set one during invasion time.',
              'After invasion time starts, an already selected role cannot be changed.',
              'Free role availability updates at 8:00 each day.',
            ]),
          ]}/>
        </GuideCard>
      </div>
    </div>
  )
}

export function BanditHuntGuideSection(){
  const locale = useLocale()
  const copy = guideSectionCopy(locale, 'bandits', '', {})
  return(
    <div>
      <p style={{fontSize:'.82rem',lineHeight:1.65,color:'var(--txt3)',textAlign:'center',maxWidth:'760px',margin:'0 auto 1.4rem'}}>
        {copy.intro || 'Bandit Hunt is a Castle War side objective where the alliance fights NPC bandit teams for ranking rewards. It competes with castle attacks for your limited actions.'}
      </p>
      <GuideImages images={FAQ_IMAGES.bandits}/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:'12px'}}>
        <GuideCard title={copy.whatTitle || 'What It Is'} accent="#1a8a72">
          <GuideList items={[
            ...(copy.whatItems || [
              'Available during Normal Castle War invasion time.',
              'The alliance competes on total Bandit Hunt count across the season.',
              'It can give alliance ranking rewards and personal ranking points.',
              'Selected War weapons cannot be used for Bandit Hunt.',
            ]),
          ]}/>
        </GuideCard>
        <GuideCard title={copy.runsTitle || 'How It Runs'} accent="var(--terra)">
          <GuideList items={[
            ...(copy.runsItems || [
              'Choose the Bandit Hunt option, select a team, then start the run.',
              'The team keeps fighting in sequence while it wins.',
              'If multiple players start hunts, they queue in order.',
              'A team that is fighting or queued cannot be used for invasion or garrison until it returns.',
            ]),
          ]}/>
        </GuideCard>
        <GuideCard title={copy.useTitle || 'When To Use It'} accent="var(--gold)">
          <GuideList items={[
            ...(copy.useItems || [
              'Use it when the alliance wants Bandit ranking or has spare action resources.',
              'Avoid locking important generals if a castle fight still needs them.',
              'The Bandit Hunt Captain role is best for players assigned to this job.',
              'If invasion time ends mid-run, only the completed chain up to that point counts.',
            ]),
          ]}/>
        </GuideCard>
      </div>
    </div>
  )
}

export function DebuffResistanceGuideSection(){
  const locale = useLocale()
  const copy = guideSectionCopy(locale, 'debuffs', '', {})
  return(
    <div>
      <p style={{fontSize:'.82rem',lineHeight:1.65,color:'var(--txt3)',textAlign:'center',maxWidth:'760px',margin:'0 auto 1.4rem'}}>
        {copy.intro || 'Debuff resistance reduces certain negative effects before they apply. This matters a lot when judging whether attack down, defense down, or defense penetration actually lands.'}
      </p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'12px'}}>
        <GuideCard title={copy.coversTitle || 'What Resistance Covers'} accent="#8e44ad">
          <GuideList items={[
            ...(copy.coversItems || [
              'Attack Down Resistance reduces attack lowering effects.',
              'Defense Down Resistance reduces defense lowering effects.',
              'Defense Penetration Resistance reduces defense penetration effects.',
              'It works against both Combat skills and Strategy skills.',
            ]),
          ]}/>
        </GuideCard>
        <GuideCard title={copy.notesTitle || 'Important Notes'} accent="var(--terra)">
          <GuideList items={[
            ...(copy.notesItems || [
              'Defense penetration is treated like a debuff for this resistance calculation.',
              'If resistance is higher than the debuff, the final debuff becomes 0%.',
              'Attack down effects still apply to critical attacks.',
              'Multiple debuffs are added together before resistance is subtracted.',
            ]),
          ]}/>
        </GuideCard>
      </div>
      <GuideFormula formula={copy.formula || 'Final debuff % = max(0, total debuff % - total resistance %)'}>
        {(copy.examples || [
          'Example 1: 40% Attack Down against 50% Attack Down Resistance becomes 0%.',
          'Example 2: 40% Attack Down + 30% Attack Down against 50% resistance becomes 20%.',
        ]).map((example, index) => (
          <span key={index}>{index > 0 && <br/>}{example}</span>
        ))}
      </GuideFormula>
    </div>
  )
}

export function TerrainEffectsSection(){
  const locale = useLocale()
  const copy = guideSectionCopy(locale, 'terrain', '', {})
  const priorityText = [...TERRAIN_EFFECTS.map(t => copy.items?.[t.id]?.name || t.name), copy.noTerrain || 'No terrain'].join(' > ')
  const routeText = copy.routeText || 'When multiple routes can reach the same castle, the game prefers a route with no terrain debuff. If every route has a debuff, it picks the route with the smallest remaining penalty after your terrain-resistance buffs are applied. If the remaining penalty is tied, the route priority is {{priority}}. Terrain placements can change each Castle War event.'
  const routeParts = routeText.split('{{priority}}')
  return(
    <div>
      <p style={{fontSize:'.82rem',lineHeight:1.65,color:'var(--txt3)',textAlign:'center',maxWidth:'760px',margin:'0 auto 1.4rem'}}>
        {copy.intro || 'Terrain effects are Castle War map debuffs attached to invasion routes between castles. They can lower your damage, make you take more damage, or make your unit start the fight with less HP.'}
      </p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'12px',marginBottom:'1rem'}}>
        {TERRAIN_EFFECTS.map(t=>{
          const item = copy.items?.[t.id] || {}
          return <div key={t.id} style={{
            display:'flex',gap:'13px',alignItems:'center',padding:'14px 15px',borderRadius:'14px',
            background:`linear-gradient(135deg,${t.color}12,var(--sur))`,
            border:`1.5px solid ${t.color}36`,boxShadow:'0 2px 10px rgba(0,0,0,.04)',
          }}>
            <div style={{width:66,height:66,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <TerrainEffectIcon terrain={t} size={62}/>
            </div>
            <div style={{minWidth:0}}>
              <div style={{display:'flex',alignItems:'baseline',gap:'7px',flexWrap:'wrap',marginBottom:'4px'}}>
                <span style={{fontWeight:900,fontSize:'.95rem',color:'var(--txt)'}}>{item.name || t.name}</span>
                {locale.code !== 'ja' && <span style={{fontSize:'.7rem',color:'var(--txt3)'}}>{t.jp}</span>}
                <span style={{fontSize:'.68rem',fontWeight:900,color:t.color,background:t.color+'18',border:`1px solid ${t.color}40`,borderRadius:'999px',padding:'2px 8px'}}>{item.effect || t.effect}</span>
              </div>
              <div style={{fontSize:'.78rem',lineHeight:1.42,color:'var(--txt2)',marginBottom:'5px'}}>{item.detail || t.detail}</div>
              <div style={{fontSize:'.68rem',lineHeight:1.35,color:'var(--txt3)'}}>{item.mitigatedBy || t.mitigatedBy}</div>
            </div>
          </div>
        })}
      </div>
      <div style={{
        padding:'13px 15px',borderRadius:'14px',
        background:'var(--bg2)',border:'1px solid var(--bdr)',fontSize:'.76rem',
        lineHeight:1.6,color:'var(--txt3)',
      }}>
        {routeParts[0]}<strong style={{color:'var(--txt2)'}}>{priorityText}</strong>{routeParts[1]}
      </div>
    </div>
  )
}

// -- Crystal types ----------------------------------------------------------
// Red/Blue unlock CW skills; Orange/Green unlock the Leader/Strategist skills.
// Red costs mirror RED_CRYSTAL_TOTAL_COST / RED_CRYSTAL_SKILL_COSTS in core.jsx
// (kept in sync by src/guide.test.js).
export const CRYSTAL_TYPES=[
  {
    id:'red',
    name:'Red Crystal',
    img:'/guide/red-crystal.webp',
    accent:'#c0392b',
    unlocks:'Castle War skills',
    body:'The standard crystal. Unlocks the three Castle War skills on any general.',
    cost:'1,750 to fully unlock a UR general (100 / 550 / 1,100 per skill). SR costs 800, R costs 595.',
  },
  {
    id:'blue',
    name:'Blue Crystal',
    img:'/guide/blue-crystal.webp',
    accent:'#2980b9',
    unlocks:'Hi Shin Unit only',
    body:'Works exactly like a Red Crystal, but can only be spent on Hi Shin Unit generals.',
    cost:'Same costs as Red. Spend these on Hi Shin members first and keep your Red for everyone else.',
  },
  {
    id:'orange',
    name:'Orange Crystal',
    img:'/guide/orange-crystal.webp',
    accent:'#e07f48',
    unlocks:'Leader skill',
    body:'Unlocks the Leader skill on a general who can hold that role.',
    cost:'1,000 per general.',
  },
  {
    id:'green',
    name:'Green Crystal',
    img:'/guide/green-crystal.webp',
    accent:'#16a085',
    unlocks:'Strategist skill',
    body:'Unlocks the Strategist skill on a general who can hold that role.',
    cost:'1,000 per general.',
  },
]

export function CrystalTypesSection(){
  const locale = useLocale()
  const copy = guideSectionCopy(locale, 'crystals', '', {})
  return(
    <div>
      <p style={{fontSize:'.82rem',color:'var(--txt3)',textAlign:'center',marginBottom:'1.2rem'}}>
        {copy.intro || 'Four crystals unlock skills, and they are not interchangeable. Each one only works on what it is meant for.'}
      </p>
      <div style={{display:'grid',gap:'1rem',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))'}}>
        {CRYSTAL_TYPES.map(c=>{
          const item = copy.items?.[c.id] || {}
          return <div key={c.id} style={{
            borderRadius:'12px',background:'var(--sur)',border:'1px solid var(--bdr)',
            borderTop:'4px solid '+c.accent,padding:'1rem',
          }}>
            <div style={{display:'flex',alignItems:'center',gap:'.7rem',marginBottom:'.6rem'}}>
              <img src={c.img} alt={item.name || c.name} width="48" height="48" loading="lazy" decoding="async"
                style={{width:48,height:48,flexShrink:0,objectFit:'contain'}}/>
              <div style={{minWidth:0}}>
                <h2 style={{fontSize:'.96rem',fontWeight:900,color:'var(--txt)',margin:0}}>{item.name || c.name}</h2>
                <div style={{fontSize:'.75rem',fontWeight:700,color:c.accent}}>{item.unlocks || c.unlocks}</div>
              </div>
            </div>
            <p style={{fontSize:'.81rem',color:'var(--txt2)',lineHeight:1.55,margin:'0 0 .5rem'}}>{item.body || c.body}</p>
            <div style={{
              fontSize:'.76rem',color:'var(--txt3)',lineHeight:1.5,
              padding:'.45rem .6rem',borderRadius:'8px',
              background:'var(--bg2)',border:'1px solid var(--bdr)',
            }}>{item.cost || c.cost}</div>
          </div>
        })}
      </div>
      <div style={{marginTop:'1rem'}}>
        <GuideCard title={copy.spendTitle || 'Which to spend first'} accent="var(--navy)">
          <GuideList items={[
            ...(copy.spendItems || [
              'Blue is the most restricted, so spend it on Hi Shin Unit generals before touching Red on them.',
              'Red is the one you will always be short of — a single UR general costs 1,750.',
              'Orange and Green only matter once you have a general who can hold the Leader or Strategist role. See Leader & Strategist.',
            ]),
          ]}/>
        </GuideCard>
      </div>
    </div>
  )
}

// -- Souha Leader / Strategist skills ---------------------------------------
// Role roster + names are derived from the v8.6.0 master-data snapshot shared
// with the archive and Party Builder, while this small route stays independent
// of core.jsx and the full character dataset.
const SOUHA_LEADER_ROLE_META=[
  {
    id:'leader',
    label:'Leader',
    accent:'#c0392b',
    stoneImg:'/guide/orange-crystal.webp',
    stone:'Orange Crystals',
    riskLabel:'If your Leader dies',
    risk:'You lose the battle instantly, even if every other unit is still alive.',
    riskIcon:null,
  },
  {
    id:'strategist',
    label:'Strategist',
    accent:'#2980b9',
    stoneImg:'/guide/green-crystal.webp',
    stone:'Green Crystals',
    riskLabel:'If your Strategist dies',
    risk:'Every allied unit is inflicted with Confusion for 1 turn.',
    riskIcon:'/icons/status/confusion.webp',
  },
]

export const SOUHA_LEADER_ROLES=SOUHA_LEADER_ROLE_META.map(role=>({
  ...role,
  generals:(souhaRoleSkills.skills||[])
    .filter(entry=>entry.role===role.label)
    .map(entry=>({
      name:entry.ownerName,
      nameJp:entry.ownerNameJp,
      ownerId:entry.owner_id,
      icon:versionPublicAsset(entry.ownerIcon),
      skillName:entry.skill.name_en,
      skillNameJp:entry.skill.name_jp,
      cwId:entry.skill.cwId,
    })),
}))

export function LeaderStrategistSection(){
  const locale = useLocale()
  const copy = guideSectionCopy(locale, 'leaders', '', {})
  return(
    <div>
      <p style={{fontSize:'.82rem',color:'var(--txt3)',textAlign:'center',marginBottom:'1.2rem'}}>
        {copy.intro || 'Two optional skills. Each fires on turn 1 — and punishes you if its holder dies.'}
      </p>

      <div style={{display:'grid',gap:'1rem',gridTemplateColumns:'repeat(auto-fit,minmax(290px,1fr))'}}>
        {SOUHA_LEADER_ROLES.map(role=>{
          const roleCopy = copy.roles?.[role.id] || {}
          return <div key={role.id} style={{
            borderRadius:'12px',background:'var(--sur)',border:'1px solid var(--bdr)',
            borderTop:'4px solid '+role.accent,padding:'1rem',
          }}>
            <div style={{display:'flex',alignItems:'center',gap:'.7rem',marginBottom:'.8rem'}}>
              <img src={role.stoneImg} alt={roleCopy.stone || role.stone} width="52" height="52" loading="lazy" decoding="async"
                style={{width:52,height:52,flexShrink:0,objectFit:'contain'}}/>
              <div style={{minWidth:0}}>
                <h2 style={{fontSize:'1rem',fontWeight:900,color:'var(--txt)',margin:0}}>{roleCopy.label || role.label}</h2>
                <div style={{fontSize:'.75rem',color:'var(--txt3)',marginTop:'.2rem'}}>
                  {copy.unlock || 'Unlock: '}<strong style={{color:'var(--gold2)'}}>1,000</strong> &times; {roleCopy.stone || role.stone}
                </div>
              </div>
            </div>

            <div style={{
              padding:'.55rem .65rem',borderRadius:'8px',
              background:role.accent+'12',border:'1px solid '+role.accent+'55',marginBottom:'.8rem',
            }}>
              <div style={{
                display:'flex',alignItems:'center',gap:'.35rem',fontSize:'.75rem',
                fontWeight:800,color:role.accent,marginBottom:'.25rem',
              }}>
                {role.riskIcon && locale.code !== 'ja' && <img src={role.riskIcon} alt="" style={{width:16,height:16}}/>}
                {roleCopy.riskLabel || role.riskLabel}
              </div>
              <div style={{fontSize:'.79rem',color:'var(--txt2)',lineHeight:1.5}}>{roleCopy.risk || role.risk}</div>
            </div>

            <div style={{
              fontSize:'.73rem',fontWeight:800,color:'var(--txt3)',
              textTransform:'uppercase',letterSpacing:'.04em',marginBottom:'.4rem',
            }}>
              {copy.generalsLabel || 'Generals'}
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:'.4rem'}}>
              {role.generals.map(g=>{
                const displayName=locale?.code==='ja'?g.nameJp:localizedCharacterName(g.name,locale)
                const localizedSkillName = locale?.code === 'ja' ? g.skillNameJp : g.skillName
                return <div key={g.ownerId} data-role-owner={g.ownerId} title={locale.code === 'ja' ? g.skillNameJp : g.skillName + ' / ' + g.skillNameJp} style={{
                  display:'flex',alignItems:'center',gap:'.35rem',padding:'.25rem .5rem .25rem .25rem',
                  borderRadius:'10px',background:'var(--bg2)',border:'1px solid var(--bdr)',
                }}>
                  <img src={g.icon} alt={displayName} width="22" height="22" loading="lazy" decoding="async"
                    style={{width:22,height:22,borderRadius:'50%',objectFit:'cover',objectPosition:'center top',flexShrink:0,display:'block'}}/>
                  <span style={{display:'grid',gap:'1px',minWidth:0}}>
                    <span style={{fontSize:'.78rem',fontWeight:800,color:'var(--txt2)'}}>{displayName}</span>
                    <span style={{fontSize:'.64rem',color:'var(--txt3)',whiteSpace:'nowrap'}}>{localizedSkillName}</span>
                  </span>
                </div>
              })}
            </div>
          </div>
        })}
      </div>

      <div style={{marginTop:'1rem'}}>
        <GuideCard title={copy.howTitle || 'How it works'} accent="var(--navy)">
          <GuideList items={[
            ...(copy.howItems || [
              'The skill fires on turn 1, as soon as a general holding the role is set in your formation.',
              'One Leader and one Strategist per formation. You can run both at once, but only one of each.',
              'The effect differs for every general, so which general holds the slot matters as much as filling it.',
              'The two penalties are nowhere near equal. Losing the Strategist costs one turn; losing the Leader costs the battle, so put that slot on someone unlikely to be focused down.',
            ]),
          ]}/>
        </GuideCard>
      </div>
    </div>
  )
}

export function GuideHubPage(){
  const {t}=useTranslation('common')
  return(
    <div className="reference-hub guide-hub">
      <header className="reference-hub-head">
        <h1>{t('guide.title')}</h1>
        <p>{t('guide.hubIntro')}</p>
      </header>
      <nav className="reference-hub-grid" aria-label={t('guide.contents')}>
        {GUIDE_GROUPS.map(group=>(
          <section className="reference-hub-group" key={group}>
            <h2>{t(`guide.${group.toLowerCase()}`)}</h2>
            <p>{t(`guide.hub${group}`)}</p>
            <ul>
              {GUIDE_SECTIONS.filter(section=>section.category===group).map(section=>(
                <li key={section.id}><Link to={`/guide/${section.id}`}>{t(`guide.sections.${section.id}`)}</Link></li>
              ))}
            </ul>
          </section>
        ))}
      </nav>
    </div>
  )
}

export function CWGuidePage(){
  const { t } = useTranslation('common')
  const locale=useLocale()
  const {section}=useParams()
  const active=section || 'basics'
  const[contentsOpen,setContentsOpen]=useState(false)
  if(!isGuideSection(active)) return <NotFoundPage/>
  const activeLabel=t(`guide.sections.${active}`, { defaultValue: GUIDE_SECTIONS.find(s=>s.id===active)?.label||'Basics' })
  const homeLabel=locale.code==='ja'?'ホーム':locale.code==='ar'?'الرئيسية':locale.code==='fr'?'Accueil':'Home'
  const guideLabel=locale.code==='ja'?'同盟争覇戦攻略':locale.code==='ar'?'دليل حرب القلاع':locale.code==='fr'?'Guide de la Conquête d’Alliance':'Castle War Guide'
  return(
    <div className="guide-page">
      {section&&(
        <nav className="seo-breadcrumbs guide-breadcrumbs" aria-label={t('breadcrumbs')}>
          <ol>
            <li><Link to="/">{homeLabel}</Link></li>
            <li><Link to="/guide">{guideLabel}</Link></li>
            <li aria-current="page">{activeLabel}</li>
          </ol>
        </nav>
      )}
      <header className="guide-head">
        <h1>{section ? `${activeLabel} — ${t('guide.title')}` : t('guide.title')}</h1>
        <p>{t('guide.intro')}</p>
      </header>
      <button type="button" className="guide-contents-toggle" aria-expanded={contentsOpen} aria-controls="guide-contents" onClick={()=>setContentsOpen(open=>!open)}>
        <span><small>{t('guide.section')}</small><strong>{activeLabel}</strong></span>
        <span aria-hidden="true">{contentsOpen?'−':'+'}</span>
      </button>
      <nav id="guide-contents" className={`guide-section-tabs${contentsOpen?' guide-section-tabs-open':''}`} aria-label={t('guide.contents')}>
        {GUIDE_GROUPS.map(group=>(
          <div key={group} className="guide-group">
            <h2>{t(`guide.${group.toLowerCase()}`, { defaultValue: group })}</h2>
            <div>
              {GUIDE_SECTIONS.filter(s=>s.category===group).map(s=>{
                const on=active===s.id
                return(
                  <Link key={s.id} className="guide-tab" aria-current={on?'page':undefined} to={`/guide/${s.id}`} onClick={()=>setContentsOpen(false)}>{t(`guide.sections.${s.id}`, { defaultValue: s.label })}</Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
      {active==='basics' && <CastleWarBasicsSection/>}
      {active==='stats-screen' && <CWStatsScreenGuideSection/>}
      {active==='stats' && <CWStatsGuideSection/>}
      {active==='roles' && <RolesGuideSection/>}
      {active==='bandits' && <BanditHuntGuideSection/>}
      {active==='leaders' && <LeaderStrategistSection/>}
      {active==='debuffs' && <DebuffResistanceGuideSection/>}
      {active==='effects' && <StatusEffectsSection/>}
      {active==='matchups' && <UnitMatchupsSection/>}
      {active==='terrain' && <TerrainEffectsSection/>}
      {active==='types' && <SkillTypesSection/>}
      {active==='crystals' && <CrystalTypesSection/>}
      {active==='interactions' && <EffectInteractionsSection/>}
      {active==='targeting' && <TargetingRulesSection/>}
    </div>
  )
}


export const EFFECT_INTERACTIONS=[
  {
    type:'overwrite',
    label:'Overwrite Each Other',
    note:'Only the most recently applied effect stays active. Applying one removes the other.',
    groups:[
      {
        effects:[
          {name_en:'Provoke',       icon:'/icons/status/provoke.webp'},
          {name_en:'Less Likely to be Targeted', icon:'/icons/status/less_targeted.webp'},
        ],
      },
      {
        effects:[
          {name_en:'Confusion', icon:'/icons/status/confusion.webp'},
          {name_en:'Betrayal',  icon:'/icons/status/betrayal.webp'},
          {name_en:'Rampage',   icon:'/icons/status/berserk.webp'},
        ],
      },
    ],
  },
  {
    type:'stack',
    label:'Stack with Priority Order',
    note:'Both can be active at the same time. Attack Nullification triggers first and reduces damage to 0 — but both effects still consume a charge.',
    groups:[
      {
        effects:[
          {name_en:'Attack Nullification', icon:'/icons/status/nullify.webp'},
          {name_en:'Guard',                icon:'/icons/status/guard.webp'},
        ],
      },
    ],
  },
  {
    type:'guard_overwrite',
    label:'Guard Overwrites by Judgment Value',
    note:'Applying Guard to a character who already has Guard active does not always overwrite it. The system compares a judgment value for each: Reduction % × Remaining Charges. The higher value wins. If the new effect loses, the existing Guard is kept unchanged.',
    formula:'Judgment Value = Reduction % × Remaining Charges',
    example:'30% × 2 charges = 60  vs  70% × 1 charge = 70  →  70% overwrites',
    groups:[
      {
        effects:[
          {name_en:'Guard', icon:'/icons/status/guard.webp'},
        ],
      },
    ],
  },
]

export function EffectInteractionsSection(){
  const locale = useLocale()
  const copy = guideSectionCopy(locale, 'interactions', '', {})
  return(
    <div>
      <p style={{fontSize:'.82rem',color:'var(--txt3)',textAlign:'center',marginBottom:'1.5rem'}}>
        {copy.intro || 'When two effects conflict, this determines which one takes precedence or whether both remain active.'}
      </p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
        {EFFECT_INTERACTIONS.map(rule=>{
          const isOverwrite=rule.type==='overwrite'
          const isGuard=rule.type==='guard_overwrite'
          const accent=isOverwrite?'#e67e22':isGuard?'#8e44ad':'#2980b9'
          const label = copy.labels?.[rule.type] || rule.label
          const note = copy.notes?.[rule.type] || rule.note
          const formula = isGuard ? (copy.formula || rule.formula) : rule.formula
          const example = isGuard ? (copy.example || rule.example) : rule.example
          return(
            <div key={rule.type} style={{
              borderRadius:'12px',background:'var(--sur)',
              border:'1px solid var(--bdr)',borderLeft:`3px solid ${accent}`,
              padding:'1rem',
            }}>
              <div style={{display:'flex',alignItems:'center',gap:'.5rem',marginBottom:'.35rem'}}>
                <span style={{
                  fontSize:'.7rem',fontWeight:700,letterSpacing:'.04em',textTransform:'uppercase',
                  color:accent,background:`${accent}22`,padding:'.15rem .55rem',borderRadius:'999px',
                }}>{label}</span>
              </div>
              <p style={{fontSize:'.8rem',color:'var(--txt2)',margin:'0 0 .75rem',lineHeight:1.5}}>{note}</p>
              {formula &&(
                <div style={{
                  display:'flex',flexDirection:'column',gap:'.4rem',
                  padding:'.65rem .85rem',borderRadius:'8px',background:'var(--bg2)',
                  marginBottom:'.75rem',
                }}>
                  <div style={{fontSize:'.78rem',fontWeight:700,color:accent,fontFamily:'monospace'}}>{formula}</div>
                  <div style={{fontSize:'.75rem',color:'var(--txt3)'}}>{example}</div>
                </div>
              )}
              <div style={{display:'flex',flexDirection:'column',gap:'.6rem'}}>
                {rule.groups.map((g,gi)=>(
                  <div key={gi} style={{
                    display:'flex',alignItems:'center',flexWrap:'wrap',gap:'.5rem',
                    padding:'.6rem .75rem',borderRadius:'8px',background:'var(--bg2)',
                  }}>
                    {g.effects.map((e,ei)=>(
                      <span key={e.name_en} style={{display:'flex',alignItems:'center',gap:'.35rem'}}>
                        <img src={e.icon} alt={copy.effects?.[e.name_en] || e.name_en} style={{width:26,height:26,flexShrink:0,imageRendering:'auto'}}/>
                        <span style={{fontSize:'.82rem',fontWeight:600,color:'var(--txt)'}}>{copy.effects?.[e.name_en] || e.name_en}</span>
                        {ei<g.effects.length-1 &&
                          <span style={{fontSize:'.75rem',color:'var(--txt3)',margin:'0 .1rem'}}>
                            {isOverwrite?(locale.code==='ja'?'・':'↔'):(locale.code==='ar'?'←':'→')}
                          </span>
                        }
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const TARGETING_RULES=[
  {
    title:'Skill Target Selection Priority',
    body:'When a target has a special status effect, target selection follows this order:',
    list:[
      <>Status effect presence (e.g. <span style={{display:'inline-flex',alignItems:'center',gap:'.2rem',whiteSpace:'nowrap'}}><img src="/icons/status/provoke.webp" alt="Provoke" style={{width:18,height:18}}/><b>Provocation</b></span>, <span style={{display:'inline-flex',alignItems:'center',gap:'.2rem',whiteSpace:'nowrap'}}><img src="/icons/status/confusion.webp" alt="Confusion" style={{width:18,height:18}}/><b>Confusion</b></span>)</>,
      <>The skill's specified priority (e.g. highest attack, lowest defense)</>,
    ],
  },
  {
    title:'Unmet Target Conditions',
    body:'If a skill specifies a target that does not exist on the field (e.g. "enemy Qin general" when no Qin general is present), the effect simply fails to activate.',
  },
  {
    title:'Random Targeting',
    body:'Skills that target a "random enemy general" pick randomly with no restrictions, and ignore Provocation.',
  },
  {
    title:'Provocation',
    icon:'/icons/status/provoke.webp',
    bullets:[
      'Concentrates incoming enemy damage attacks on the provoked unit.',
      'Does not affect targeting of non-damage skills.',
      'Does not stack — reapplying overwrites the existing state.',
    ],
  },
  {
    title:'Confusion',
    icon:'/icons/status/confusion.webp',
    bullets:[
      'The affected unit attacks both allies and enemies indiscriminately.',
      'Uses skills if available, otherwise normal attacks.',
      'If no allies remain alive, attacks enemies normally.',
      'Does not stack — reapplying refreshes to the longer duration.',
      'Cannot be applied to units already under Betrayal or Rampage (those take priority); however, Betrayal or Rampage applied to a Confused unit overwrites Confusion.',
    ],
  },
]

export function TargetingRulesSection(){
  const locale = useLocale()
  const copy = guideSectionCopy(locale, 'targeting', '', {})
  return(
    <div>
      <p style={{fontSize:'.82rem',color:'var(--txt3)',textAlign:'center',marginBottom:'1.5rem'}}>
        {copy.intro || 'How skills choose their targets, and how status effects influence targeting.'}
      </p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
        {TARGETING_RULES.map((r,i)=>{
          const localized = copy.rules?.[r.title] || {}
          const title = localized.title || r.title
          const body = localized.body || r.body
          const list = localized.list || r.list
          const bullets = localized.bullets || r.bullets
          return <div key={i} style={{
            borderRadius:'12px',background:'var(--sur)',
            border:'1px solid var(--bdr)',borderLeft:'3px solid #2980b9',
            padding:'1rem',
          }}>
            <div style={{display:'flex',alignItems:'center',gap:'.5rem',marginBottom:'.4rem'}}>
              {r.icon && <img src={r.icon} alt={title} style={{width:24,height:24}}/>}
              <h2 style={{fontSize:'.95rem',fontWeight:800,color:'var(--txt)',margin:0}}>{title}</h2>
            </div>
            {body && <p style={{fontSize:'.82rem',color:'var(--txt2)',margin:'0 0 .5rem',lineHeight:1.5}}>{body}</p>}
            {list &&(
              <ol style={{margin:'.25rem 0 0 1.1rem',padding:0,fontSize:'.82rem',color:'var(--txt2)',lineHeight:1.6}}>
                {list.map((item,j)=><li key={j} style={{marginBottom:'.2rem'}}>{item}</li>)}
              </ol>
            )}
            {bullets &&(
              <ul style={{margin:'.25rem 0 0 1.1rem',padding:0,fontSize:'.82rem',color:'var(--txt2)',lineHeight:1.6}}>
                {bullets.map((b,j)=><li key={j} style={{marginBottom:'.2rem'}}>{b}</li>)}
              </ul>
            )}
          </div>
        })}
      </div>
    </div>
  )
}

export function EffectCard({entry,accent}){
  const locale = useLocale()
  const localized = guideSectionCopy(locale, 'effects', 'items', {})[entry.name_en] || {}
  const name = localized.name || (locale?.code === 'ja' ? entry.name_jp : entry.name_en)
  const description = localized.description || entry.description
  return(
    <div style={{
      display:'flex',gap:'.75rem',alignItems:'flex-start',
      padding:'.75rem',borderRadius:'12px',
      background:'var(--sur)',border:'1px solid var(--bdr)',
      borderLeft:`3px solid ${accent}`,
    }}>
      <img src={entry.icon} alt="" style={{width:36,height:36,flexShrink:0,imageRendering:'auto'}}/>
      <div style={{minWidth:0,flex:1}}>
        <div style={{display:'flex',alignItems:'baseline',gap:'.5rem',flexWrap:'wrap',marginBottom:'.2rem'}}>
          <div style={{fontWeight:700,fontSize:'.92rem',color:'var(--txt)'}}>{name}</div>
          {locale.code !== 'ja' && <div style={{fontSize:'.72rem',color:'var(--txt3)'}}>{entry.name_jp}</div>}
        </div>
        <div style={{fontSize:'.78rem',color:'var(--txt2)',lineHeight:1.45}}>{description}</div>
      </div>
    </div>
  )
}

export function StatusEffectsSection(){
  const locale = useLocale()
  const copy = guideSectionCopy(locale, 'effects', '', {})
  return(
    <div>
      <p style={{fontSize:'.82rem',color:'var(--txt3)',textAlign:'center',marginBottom:'1.5rem'}}>
        {copy.intro || 'Buffs and debuffs that can be applied during Castle War battles.'}
      </p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'1.25rem'}}>
        <div>
          <h2 style={{fontSize:'1rem',fontWeight:800,color:'#27ae60',marginBottom:'.75rem',display:'flex',alignItems:'center',gap:'.5rem'}}>
            <span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',background:'#27ae60'}}/>
            {copy.buffsTitle || 'Buffs'} ({statusEffects.buffs.length})
          </h2>
          <div style={{display:'flex',flexDirection:'column',gap:'.5rem'}}>
            {statusEffects.buffs.map(e=><EffectCard key={e.name_en} entry={e} accent="#27ae60"/>)}
          </div>
        </div>
        <div>
          <h2 style={{fontSize:'1rem',fontWeight:800,color:'#c0392b',marginBottom:'.75rem',display:'flex',alignItems:'center',gap:'.5rem'}}>
            <span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',background:'#c0392b'}}/>
            {copy.debuffsTitle || 'Debuffs'} ({statusEffects.debuffs.length})
          </h2>
          <div style={{display:'flex',flexDirection:'column',gap:'.5rem'}}>
            {statusEffects.debuffs.map(e=><EffectCard key={e.name_en} entry={e} accent="#c0392b"/>)}
          </div>
        </div>
      </div>
    </div>
  )
}

export function UnitMatchupsSection(){
  const locale = useLocale()
  const copy = guideSectionCopy(locale, 'matchups', '', {})
  const units = copy.units || {}
  return(
    <div>
      <p style={{fontSize:'.82rem',color:'var(--txt3)',textAlign:'center',marginBottom:'1.5rem'}}>
        {copy.intro || 'Damage between unit types follows a rock-paper-scissors relationship.'}
      </p>
      <div style={{textAlign:'center',marginBottom:'1.75rem'}}>
        <img src={unitMatchups.chart_image} alt={copy.chartAlt || 'Unit matchup chart'} loading="lazy" decoding="async" style={{display:'block',margin:'0 auto',maxWidth:'min(100%,520px)',height:'auto',boxSizing:'border-box'}}/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'.75rem',marginBottom:'1.5rem'}}>
        {unitMatchups.rules.map((r,i)=>(
          <div key={i} style={{
            padding:'.75rem',borderRadius:'12px',
            background:'var(--sur)',border:'1px solid var(--bdr)',
            display:'flex',alignItems:'center',justifyContent:'center',gap:'.5rem',
          }}>
            <img src={r.icon_strong} alt={units[r.strong] || r.strong} loading="lazy" decoding="async" style={{width:32,height:32,objectFit:'contain',flexShrink:0}}/>
            <span style={{fontWeight:700,fontSize:'.85rem',color:'var(--txt)'}}>{units[r.strong] || r.strong}</span>
            <span style={{fontSize:'.75rem',color:'#27ae60',fontWeight:700,margin:'0 .25rem'}}>{copy.strongVs || 'strong vs'}</span>
            <img src={r.icon_weak} alt={units[r.weak] || r.weak} loading="lazy" decoding="async" style={{width:32,height:32,objectFit:'contain',flexShrink:0,opacity:.6}}/>
            <span style={{fontSize:'.85rem',color:'var(--txt2)'}}>{units[r.weak] || r.weak}</span>
          </div>
        ))}
      </div>
      <div style={{
        padding:'.85rem 1rem',borderRadius:'12px',
        background:'var(--sur)',border:'1px solid var(--bdr)',
        display:'flex',alignItems:'center',gap:'.6rem',justifyContent:'center',flexWrap:'wrap',
      }}>
        <img src={unitMatchups.mutual.icon_left} alt={units[unitMatchups.mutual.left] || unitMatchups.mutual.left} loading="lazy" decoding="async" style={{width:32,height:32,objectFit:'contain',flexShrink:0}}/>
        <span style={{fontWeight:700,fontSize:'.85rem',color:'var(--txt)'}}>{units[unitMatchups.mutual.left] || unitMatchups.mutual.left}</span>
        <span style={{fontSize:'.85rem',color:'var(--txt3)'}}>↔</span>
        <span style={{fontWeight:700,fontSize:'.85rem',color:'var(--txt)'}}>{units[unitMatchups.mutual.right] || unitMatchups.mutual.right}</span>
        <span style={{fontSize:'.78rem',color:'var(--txt2)',width:'100%',textAlign:'center',marginTop:'.25rem'}}>{copy.mutualNote || unitMatchups.mutual.note}</span>
      </div>
    </div>
  )
}

export function SkillTypesSection(){
  const locale = useLocale()
  const copy = guideSectionCopy(locale, 'types', '', {})
  const types=[
    {jp:'戦技', data:skillTypesGlossary['戦技']},
    {jp:'軍略', data:skillTypesGlossary['軍略']},
    {jp:'内政', data:skillTypesGlossary['内政']},
    {jp:'総大将スキル', data:skillTypesGlossary['総大将スキル']},
    {jp:'軍師スキル', data:skillTypesGlossary['軍師スキル']},
  ]
  return(
    <div>
      <p style={{fontSize:'.82rem',color:'var(--txt3)',textAlign:'center',marginBottom:'1.5rem'}}>
        {copy.intro || 'Normal skills use three categories. Eligible generals can also unlock one of the two formation roles.'}
      </p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'1rem'}}>
        {types.map(t=>{
          const item = copy.items?.[t.jp] || {}
          return <div key={t.jp} style={{
            padding:'1rem',borderRadius:'12px',
            background:'var(--sur)',border:'1px solid var(--bdr)',
            borderTop:`4px solid ${t.data.color}`,
          }}>
            <div style={{display:'flex',alignItems:'baseline',gap:'.5rem',marginBottom:'.5rem'}}>
              <div style={{fontWeight:800,fontSize:'1.05rem',color:t.data.color}}>{item.label || t.data.en}</div>
             {locale.code !== 'ja' && <div style={{fontSize:'.78rem',color:'var(--txt3)'}}>{t.jp}</div>}
           </div>
            <div style={{fontSize:'.82rem',color:'var(--txt2)',lineHeight:1.5}}>{item.description || t.data.description}</div>
         </div>
        })}
      </div>
    </div>
  )
}
