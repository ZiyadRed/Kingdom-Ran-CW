/**
 * Synchronous i18next runtime for RanHQ.
 *
 * The URL selects the locale before React mounts. Catalogs are semantic rather
 * than English-sentence keys, so Japanese and Arabic remain reviewable and
 * unknown keys can safely fall back to English.
 */
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { DEFAULT_LOCALE, LOCALES } from './locales.js'

const en = {
  appName: 'RanHQ', localeLabel: 'Language', loading: 'Loading', unknown: 'Unknown', translationPending: 'Translation pending', originalJapanese: 'Original Japanese', sourceVerified: 'Verified game source', sourceUnavailable: 'Source unavailable', close: 'Close', openOriginal: 'Open original in new tab', viewArt: 'View full-resolution art', share: 'Share', image: 'Image', making: 'Making…', shared: 'Shared', copied: 'Copied', copyFailed: 'Copy failed', previewReady: 'Preview ready', imageFailed: 'Image failed', copyImage: 'Copy image', downloadPng: 'Download PNG', pasteImageHint: 'Paste into Discord after copying, or download the PNG.', imagePreview: 'image preview', shareTeam: 'Share team', skillEffectQualifiers: 'Skill effect qualifiers', search: 'Search', results: 'Results', generals: 'generals', owned: 'Owned', all: 'All', missing: 'Missing', savedBrowser: 'Saved on this browser', export: 'Export', import: 'Import', clear: 'Clear', own: 'Own', markedOwned: 'Marked owned', markOwned: 'Mark as owned', setAttacker: 'Set as Attacker', setDefender: 'Set as Defender', attack: 'Attack', defend: 'Defend', remove: 'Remove', enabled: 'enabled', disabled: 'disabled', starSkill: '6★ skill', toolsSummary: 'Track progress and calculate Castle War values.', closeTools: 'Close tools', selectedGenerals: '{{count}} selected generals', ownedCount: '{{owned}}/{{total}} owned', resultCount: 'Results ({{count}})', generalCount: '{{count}} generals',
  nav: { primary: 'Primary navigation', home: 'RanHQ home', archive: 'Archive', characters: 'Characters', sceneCards: 'CW6★ Scene Cards', teams: 'Teams', partyBuilder: 'Party Builder', metawatch: 'Metawatch', battleOrder: 'Battle Order', guide: 'Guide', tools: 'Tools', buffTracker: 'Buff Tracker', statsCalculator: 'Stats Calculator', teamCost: 'Team Cost', castlePoints: 'Castle Points', charactersNote: 'Skills, stats, and factions', sceneCardsNote: 'Owners and translated skills', partyBuilderNote: 'Build attacking and defending teams', metawatchNote: 'Current recommended formations', battleOrderNote: 'Review turns and team buffs', buffTrackerNote: 'Mark owned sources and totals', statsCalculatorNote: 'Calculate Castle War power', teamCostNote: 'Plan red crystal costs', castlePointsNote: 'Project alliance ranking' },
  home: { heroDescription: 'Your Castle War companion for team building, buffs, matchups, and everything related to CW.', openArchive: 'Open Archive', buildTeam: 'Build a Team', findInformation: 'Find game information', findDescription: 'Translated character skills and Castle War references in one searchable archive.', buildCompare: 'Build and compare teams', buildDescription: 'Start with current formations, adjust unlocked skills, and inspect the battle order.', trackCalculate: 'Track and calculate', trackDescription: 'Keep your owned buffs organized and plan the resources and power behind each team.', learnCastleWar: 'Learn Castle War', guideDescription: 'Use the field guide when you need mechanics, targeting rules, status effects, terrain, or matchup references.', openGuide: 'Open the complete guide', guideBasics: 'Castle War basics', guideRoles: 'General roles', guideStats: 'CW stats screen' },
  archive: {
    hubIntro: "Choose the general database or the CW6★ scene-card collection.",
    hubCharacters: "Search names or skill effects, filter by faction, and inspect each general’s skills.",
    hubCards: "Find card owners and skill effects, view the original artwork, and track cards you own on this browser.",
 sections: 'Archive sections', title: 'Archive', sceneSubtitle: '6★ scene-card skills and owners', ownershipFilter: 'CW6 ownership filter', searchGenerals: 'Search generals', roster: '{{faction}} Roster', skills: 'Skills', skillsAndStats: 'Skills, stats, and factions', sceneCards: 'CW6★ Scene Cards', cardArt: 'Scene card art', owners: 'Owners' },
  builder: { title: 'Party Builder', subtitle: 'Click slots to add generals. Generals act in formation order.', formationSide: 'Formation side', attacking: 'Attacking', defending: 'Defending', clickAdd: 'Click to add', viewBattleOrder: 'View Battle Order', teamBuffs: 'Team buffs', calculated: 'Calculated from this formation', hide: 'Hide', review: 'Review', knownTeam: 'Start from a known team', knownTeamDescription: 'Load a current formation, then adjust it in the editor above.' },
  sim: { title: 'Battle Order', description: 'Leader and Strategist skills fire on turn 1. Strategy effects stay active throughout the battle. Generals act in formation order. Each general uses combat skills from the highest skill slot first.', editTeams: 'Edit teams', chooseTeams: 'Choose both attacking and defending teams first.', emptyDescription: 'Battle Order turns your completed attacking and defending teams into a clear skill activation sequence.', emptyReason: 'There is nothing to display yet because one or both teams are incomplete.', goBuilder: 'Go to Party Builder', leaderSkills: 'Leader & Strategist Skills — Turn 1', strategySkills: 'Strategy Skills — Always Active', activation: 'Skill Activation Order', turn: 'Turn {{turn}}' },
  guide: {
    hubIntro: "Start with the basics, or use this contents page to jump to the Castle War topic you need.",
    hubBeginner: "Learn the battle flow, read the stats screen, and plan your generals’ development.",
    hubAdvanced: "Look up leader and strategist skills, resistances, status effects, terrain, interactions, and targeting.",
 title: 'Castle War Guide', intro: 'Mechanics, targeting rules, status effects, terrain, and matchup references for Castle War.', section: 'Guide section', contents: 'Guide contents', beginner: 'Beginner', advanced: 'Advanced', basics: 'Basics', roles: 'General roles', stats: 'CW stats', glossary: 'Glossary', sections: { basics: 'Basics', 'stats-screen': 'CW Stats Screen', roles: 'Roles', bandits: 'Bandit Hunt', matchups: 'Unit Matchups', types: 'Skill Types', crystals: 'Crystal Types', stats: 'How To Raise CW Stats', leaders: 'Leader & Strategist', debuffs: 'Debuff Resist', effects: 'Status Effects', terrain: 'Terrain Effects', interactions: 'Effect Interactions', targeting: 'Targeting Rules' } },
  noChange: 'No change', vsCurrent: 'vs current', minimumAttack: 'Minimum Attack', maximumAttack: 'Maximum Attack', defense: 'Defense', added: 'Added', full: 'Full', costLabel: 'Cost', redCrystalAlt: 'Red Crystal', efficiencyTooltip: 'Efficiency: {{value}} red crystals per 1% buff. Lower is better. ({{cost}} cost / {{buff}}% buff)', redCrystalCostTooltip: 'Red Crystal unlock cost: {{cost}}',
  stats: { title: 'Stats Calculator', description: 'Enter the CW screen values, including active buffs. Add percentage buffs or Scene Card base buffs to preview the updated power.', saved: 'Saved automatically', reset: 'Reset calculator', confirmClear: 'Clear all saved calculator teams and character values on this device?', addTeam: 'Add another team', maxTeams: 'Maximum of 5 teams reached', addCharacter: 'Add character', searchHint: 'Start typing to add a character to the next empty slot.', fullHint: 'All four slots are filled. Use Change character on a card to replace someone.', noCharacterMatches: 'No characters match “{{query}}”.', team: 'Team {{number}}', removeTeam: 'Remove team', powerAfterBuffs: 'CW power after buffs', screenValues: 'CW screen values', fromScreen: 'From the CW screen', activeBuffs: 'Already active buffs', buffsToAdd: 'Buffs to add', sceneCardBuffs: 'Scene Card base buffs', changeCharacter: 'Change character', editHint: 'Select a character above to edit their stats.', chooseCharacter: 'Choose a character', hp: 'HP', attack: 'Attack', defense: 'Defense' },
  noBoard: 'No board', buffType: 'Buff Type', unitType: 'Unit Type', state: 'State', meta: { title: 'CW METAWATCH', subtitle: 'Commonly Seen Armies · Last updated: Jun 2026', by: 'Tier List by', apex: 'The apex — strongest team in the game', kings: '★ UNDISPUTED META KINGS ★', source: 'Source: Gold fights, X, YouTube and Community insights · Benchmark: Army Synergy, Unique Skills, Unit Stats and Training Cost', tier: 'Tier {{tier}}' }, teamCost: { title: 'Team Cost', description: 'Calculate the Red Crystals needed to finish up to four generals.', needed: 'Red Crystals needed', chooseSlot: 'Choose a slot to begin', clearAll: 'Clear all', team: 'Team', selected: '{{count}} / 4 selected', skills: 'Skill costs', byRarity: 'By rarity', rarity: 'Rarity', skill: 'Skill {{number}}', total: 'Total', selectGeneral: 'Select General', slot: 'Slot {{number}}', search: 'Search…', clickAdd: 'Click to add general', maxed: 'Maxed', change: 'Change', buffs: { title: 'Buff Tracker', description: 'Mark the passive buffs you own and keep a live total across unit types, states, special units, terrain, and scene cards.', find: 'Find a category or general', search: 'Search buffs…', redCrystal: 'Red Crystal upgrade', shard: 'Shard upgrade (+5%)', unitTypes: 'Unit Types', states: 'States', specialUnits: 'Special Units', terrain: 'Terrain', sceneCards: 'Scene Cards', sceneDescription: 'Scene card buffs apply to all characters.', ownedTotals: 'Owned Buff Totals', sourcesOwned: '{{owned}}/{{total}} sources marked owned.', showTotals: 'Show totals by category', byCategory: 'by category - click to expand', noCards: 'No cards in this filter.', tapCategory: 'Tap any category above to see its CW buffs', buffsOwned: '{{owned}}/{{total}} scene-card buffs owned', ownershipFilter: 'Scene-card buff ownership filter' }, castlePoints: { tool: 'Castle War Tool', title: 'Castle Points', mode: 'Castle War mode', pointSummary: 'Point values and current summary', large: 'Large', medium: 'Mid', small: 'Small', largeShort: 'L', mediumShort: 'M', smallShort: 'S', castle: 'castle', alliance: 'alliance', today: 'Today', currentTotal: 'Current Total', projected: 'Projected', board: 'Alliance Board', reset: 'Reset', addAlliance: 'Add Alliance', add: 'Add', ranking: 'Projected Ranking', pointsToday: '{{count}} points today', mine: 'Mine', remove: 'Remove', allianceName: 'Alliance name', currentPoints: 'Current cumulative points', bottomTwo: 'Bottom two', projectedFirst: 'Projected 1st', leading: 'Your alliance is leading this board.', behindFirst: '{{count}} pts behind 1st', roughly: 'Roughly {{count}}.', allianceCount: '{{count}} alliances', allianceCount_one: '{{count}} alliance', castleCount: '{{count}} castles', castleCount_one: '{{count}} castle', largeCastleCount: '{{count}} large castles', largeCastleCount_one: '{{count}} large castle', mediumCastleCount: '{{count}} medium castles', mediumCastleCount_one: '{{count}} medium castle', smallCastleCount: '{{count}} small castles', smallCastleCount_one: '{{count}} small castle', zeroPoints: '0 points', versionOne: 'Version 1.0', versionTwo: 'Version 2.0' },
  },
  shareOutput: { sceneCardSkill: 'CW6 Card Skill', sideSkills: '{{side}} Skills', duration: 'Duration', enemyDebuffOn: 'Enemy debuff on', skillCard: 'RanHQ Skill Card', generatedFor: 'Generated for Discord sharing', partyBuilder: 'RanHQ Party Builder', builderNote: 'Skill toggles reflected from the current builder team', teamSheet: 'Team skill sheet for Discord sharing', teamSkills: 'RanHQ Team Skills', noEffects: 'No translated effects yet.', effect: 'Effect', skill: 'Skill', star6: '6-star', unnamedSkill: 'Unnamed skill', noGenerals: 'No generals selected', teamBuffSummary: 'RanHQ Team Buff Summary', withCombat: 'Strategy + combat skill effects included.', strategyOnly: 'Strategy skills only.', truncated: '...truncated for Discord.', fullDetails: 'Full details' },
  footer: { madeBy: 'Made by', specialThanks: 'Special thanks', joinDiscord: 'Join the Discord', unofficial: 'Unofficial fan site — not for commercial purposes.' },
}
en.buffs = en.teamCost.buffs
en.castlePoints = en.teamCost.castlePoints
en.generalCount_one = '{{count}} general'
en.selectedGenerals_one = '{{count}} selected general'
en.stats.hp = 'HP'
en.stats.attack = 'Attack'
en.stats.defense = 'Defense'
en.stats.noCharacterMatches = 'No characters match “{{query}}”.'
en.progressCopied = 'Progress backup copied.'
en.noRelevantBuffs = 'No relevant buffs'
en.buffs.guardNote = "Doesn't stack — only the highest is active"
en.buffs.totalStackable = 'Total stackable buff from {{count}} generals'
en.buffs.totalStackable_one = 'Total stackable buff from {{count}} general'
en.buffs.noBuffFor = 'No {{stat}} buff for {{key}}'
en.buffs.woggTitle = 'Way of the Great General'
en.buffs.woggDescription = 'These buffs unlock from the second page of WoGG.'
en.buffs.siegeWeapons = 'Siege Weapons'
en.copyShareText = 'Copy this RanHQ share text:'
en.copyProgress = 'Copy your RanHQ progress backup:'
en.pasteProgress = 'Paste your RanHQ progress backup:'
en.progressImported = 'Progress imported.'
en.progressImportFailed = 'That progress backup could not be read.'
en.clearProgressConfirm = 'Clear all saved RanHQ progress on this browser?'
en.buffs.teamSummary = 'Team Buff Summary'
en.buffs.includeCombat = 'Include combat skills'
en.buffs.includeCombatTitle = 'Also count buff/debuff effects from combat skills (Strategy plus selected Leader/Strategist skills are already included)'
en.buffs.attackingFormation = 'Attacking Formation'
en.buffs.defendingFormation = 'Defending Formation'

const ja = {
  appName: 'RanHQ', localeLabel: '言語', loading: '読み込み中', unknown: '不明', translationPending: '翻訳準備中', originalJapanese: '原文（日本語）', sourceVerified: 'ゲーム原文を確認済み', sourceUnavailable: '原文未確認', close: '閉じる', openOriginal: '原寸画像を新しいタブで開く', viewArt: '原寸画像を見る', share: '共有', image: '画像', making: '作成中…', shared: '共有しました', copied: 'コピーしました', copyFailed: 'コピーに失敗しました', previewReady: 'プレビュー準備完了', imageFailed: '画像の作成に失敗しました', copyImage: '画像をコピー', downloadPng: 'PNGをダウンロード', pasteImageHint: 'コピーしてDiscordに貼り付けるか、PNGをダウンロードしてください。', imagePreview: '画像プレビュー', shareTeam: '編成を共有', skillEffectQualifiers: '技能効果の条件', search: '検索', results: '検索結果', generals: '武将', owned: '所持', all: 'すべて', missing: '未所持', savedBrowser: 'このブラウザに保存', export: '書き出し', import: '読み込み', clear: 'クリア', own: '所持', markedOwned: '所持済み', markOwned: '所持として記録', setAttacker: '攻撃側に設定', setDefender: '防御側に設定', attack: '攻撃', defend: '防御', remove: '削除', enabled: '有効', disabled: '無効', starSkill: '☆6技能', toolsSummary: '進行状況を記録し、同盟争覇戦の数値を計算します。', closeTools: 'ツールを閉じる', selectedGenerals: '{{count}}人選択中', ownedCount: '{{owned}}/{{total}} 所持', resultCount: '検索結果（{{count}}）', generalCount: '{{count}}人の武将',
  nav: { primary: 'メインナビゲーション', home: 'RanHQ ホーム', archive: 'アーカイブ', characters: '武将', sceneCards: 'CW6★追想カード', teams: '編成', partyBuilder: '編成作成', metawatch: '環境編成', battleOrder: '発動順', guide: '攻略', tools: 'ツール', buffTracker: 'バフ管理', statsCalculator: 'ステータス計算', teamCost: '編成コスト', castlePoints: '城ポイント', charactersNote: '技能・ステータス・勢力', sceneCardsNote: '所持者と翻訳技能', partyBuilderNote: '攻撃・防御編成を作成', metawatchNote: '現在のおすすめ編成', battleOrderNote: '発動順と編成バフを確認', buffTrackerNote: '所持状況と合計を記録', statsCalculatorNote: '同盟争覇戦の戦力を計算', teamCostNote: '赤の争覇解放石コストを計画', castlePointsNote: '同盟順位を予測' },
  home: { heroDescription: '編成、バフ、相性、同盟争覇戦の情報をまとめた攻略サイトです。', openArchive: 'アーカイブを開く', buildTeam: '編成を作る', findInformation: 'ゲーム情報を探す', findDescription: '武将技能と同盟争覇戦の資料を検索できるアーカイブです。', buildCompare: '編成を作成・比較', buildDescription: '現在の編成を読み込み、技能を調整して発動順を確認します。', trackCalculate: '記録・計算する', trackDescription: '所持バフを整理し、編成に必要な資源と戦力を計画します。', learnCastleWar: '同盟争覇戦を学ぶ', guideDescription: 'ルール、対象、状態異常、地形、相性を攻略ガイドで確認できます。', openGuide: '攻略ガイドを開く', guideBasics: '同盟争覇戦の基本', guideRoles: '武将の役割', guideStats: '争覇ステータス画面' },
  archive: {
    hubIntro: "武将データベース、またはCW6★追想カード一覧を選んでください。",
    hubCharacters: "武将名や技能効果で検索し、勢力で絞り込んで、各武将の技能を確認できます。",
    hubCards: "カードの所持武将と技能効果、元のイラストを確認し、このブラウザーに所持状況を記録できます。",
 sections: 'アーカイブのセクション', title: 'アーカイブ', sceneSubtitle: '☆6追想カード技能と所持者', ownershipFilter: 'CW6所持フィルター', searchGenerals: '武将を検索', roster: '{{faction}}の武将', skills: '技能', skillsAndStats: '技能・ステータス・勢力', sceneCards: 'CW6★追想カード', cardArt: '追想カード画像', owners: '所持者' },
  builder: { title: '編成作成', subtitle: '枠をクリックして武将を追加。武将は編成順に行動します。', formationSide: '編成側', attacking: '攻撃側', defending: '防御側', clickAdd: 'クリックして追加', viewBattleOrder: '発動順を見る', teamBuffs: '編成バフ', calculated: 'この編成から計算', hide: '隠す', review: '確認', knownTeam: '既存の編成から開始', knownTeamDescription: '現在の編成を読み込み、上のエディターで調整します。' },
  sim: { title: '発動順', description: '総大将・軍師技能は1ターン目に発動します。戦略効果は戦闘中継続します。武将は編成順に行動し、各武将の戦技はスキル番号の大きいものから発動します。', editTeams: '編成を編集', chooseTeams: '攻撃側と防御側の両方を先に選択してください。', emptyDescription: '発動順では、作成した攻撃・防御編成を技能の発動順に整理して確認できます。', emptyReason: '攻撃側または防御側の編成が未完成のため、まだ表示できる発動順がありません。', goBuilder: '編成作成へ', leaderSkills: '総大将・軍師技能 — 1ターン目', strategySkills: '戦略技能 — 常時有効', activation: '技能発動順', turn: '{{turn}}ターン目' },
  guide: {
    hubIntro: "まず基本を読むか、目次から確認したい同盟争覇戦の項目を選んでください。",
    hubBeginner: "戦闘の流れとステータス画面の見方を確認し、武将の育成計画に役立てましょう。",
    hubAdvanced: "総大将・軍師の技能、耐性、状態異常、地形、効果の相互作用、対象選択を確認できます。",
 title: '同盟争覇戦攻略', intro: '同盟争覇戦のルール、対象、状態異常、地形、相性をまとめています。', section: '攻略セクション', contents: '攻略目次', beginner: '初級', advanced: '上級', basics: '基本', roles: '武将の役割', stats: '争覇ステータス', glossary: '用語集', sections: { basics: '基本', 'stats-screen': '争覇ステータス画面', roles: '役割', bandits: '盗賊討伐', matchups: '兵種相性', types: '技能タイプ', crystals: '争覇解放石の種類', stats: '争覇ステータスの上げ方', leaders: '総大将・軍師', debuffs: 'デバフ耐性', effects: '状態異常', terrain: '地形効果', interactions: '効果の相互作用', targeting: '対象選択ルール' } },
  noChange: '変化なし', vsCurrent: '現在との差', minimumAttack: '最小攻撃', maximumAttack: '最大攻撃', defense: '防御', added: '追加済み', full: '満員', costLabel: 'コスト', redCrystalAlt: '赤の争覇解放石', efficiencyTooltip: '効率：{{value}}赤の争覇解放石／バフ1%。低いほど有利（コスト{{cost}}／バフ{{buff}}%）', redCrystalCostTooltip: '赤の争覇解放石の技能解放コスト：{{cost}}',
  stats: { title: 'ステータス計算', description: '争覇画面の数値と有効なバフを入力します。割合バフや追想カードの基礎バフを加えて戦力を確認できます。', saved: '自動保存', reset: '計算をリセット', confirmClear: 'この端末に保存した計算編成と武将数値をすべて削除しますか？', addTeam: '編成を追加', maxTeams: '編成は最大5つです', addCharacter: '武将を追加', searchHint: '入力して空いている枠に武将を追加します。', fullHint: '4枠すべて使用中です。カードの武将変更から入れ替えられます。', noCharacterMatches: '「{{query}}」に一致する武将はいません。', team: '編成 {{number}}', removeTeam: '編成を削除', powerAfterBuffs: 'バフ適用後の争覇戦力', screenValues: '争覇画面の数値', fromScreen: '争覇画面から', activeBuffs: '適用中のバフ', buffsToAdd: '追加するバフ', sceneCardBuffs: '追想カード基礎バフ', changeCharacter: '武将を変更', editHint: '上の武将を選択して数値を編集します。', chooseCharacter: '武将を選択', hp: 'HP', attack: '攻撃', defense: '防御' },
  noBoard: 'ボードなし', buffType: 'バフ種別', unitType: '兵種', state: '勢力', meta: { title: '争覇メタウォッチ', subtitle: 'よく見られる編成 · 最終更新：2026年6月', by: 'ティアリスト作成：', apex: '頂点 — ゲーム最強の編成', kings: '★ 圧倒的メタキング ★', source: '出典：対戦記録、X、YouTube、コミュニティ情報 · 基準：編成相性・固有技能・兵種ステータス・育成コスト', tier: 'ティア {{tier}}' }, teamCost: { title: '編成コスト', description: '4人までの武将を育成するために必要な赤の争覇解放石を計算します。', needed: '必要な赤の争覇解放石', chooseSlot: '枠を選択して開始', clearAll: 'すべてクリア', team: '編成', selected: '{{count}} / 4 選択中', skills: '技能コスト', byRarity: 'レアリティ別', rarity: 'レアリティ', skill: '技能{{number}}', total: '合計', selectGeneral: '武将を選択', slot: '枠{{number}}', search: '検索…', clickAdd: 'クリックして武将を追加', maxed: '最大', change: '変更', buffs: { title: 'バフ管理', description: '所持している常時バフを記録し、兵種・状態・特殊部隊・地形・追想カードの合計を確認します。', find: 'カテゴリまたは武将を検索', search: 'バフを検索…', redCrystal: '赤の争覇解放石強化', shard: '欠片強化（+5%）', unitTypes: '兵種', states: '勢力', specialUnits: '特殊部隊', terrain: '地形', sceneCards: '追想カード', sceneDescription: '追想カードのバフはすべての武将に適用されます。', ownedTotals: '所持バフ合計', sourcesOwned: '{{owned}}/{{total}}件を所持として記録', showTotals: 'カテゴリ別の合計を表示', byCategory: 'カテゴリ別・クリックで展開', noCards: 'このフィルターにカードはありません。', tapCategory: '上のカテゴリをタップすると争覇バフを確認できます', buffsOwned: '追想カードバフ {{owned}}/{{total}}件を所持', ownershipFilter: '追想カードバフ所持フィルター' }, castlePoints: { tool: '同盟争覇戦ツール', title: '城ポイント', mode: '同盟争覇戦モード', pointSummary: 'ポイント値と現在の概要', large: '大城', medium: '中城', small: '小城', largeShort: '大', mediumShort: '中', smallShort: '小', castle: '城', alliance: '同盟', today: '本日', currentTotal: '現在合計', projected: '予測', board: '同盟ボード', reset: 'リセット', addAlliance: '同盟を追加', add: '追加', ranking: '予測順位', pointsToday: '本日 {{count}}ポイント', mine: '自分', remove: '削除', allianceName: '同盟名', currentPoints: '累計ポイント', bottomTwo: '下位2同盟', projectedFirst: '予測1位', leading: 'このボードでは自同盟が首位です。', behindFirst: '1位まで {{count}}ポイント', roughly: 'およそ{{count}}。', allianceCount: '{{count}}同盟', allianceCount_one: '{{count}}同盟', castleCount: '{{count}}城', castleCount_one: '{{count}}城', largeCastleCount: '{{count}}大城', largeCastleCount_one: '{{count}}大城', mediumCastleCount: '{{count}}中城', mediumCastleCount_one: '{{count}}中城', smallCastleCount: '{{count}}小城', smallCastleCount_one: '{{count}}小城', zeroPoints: '0ポイント', versionOne: 'バージョン1.0', versionTwo: 'バージョン2.0' },
  },
  footer: { madeBy: '制作者', specialThanks: 'スペシャルサンクス', joinDiscord: 'Discordに参加', unofficial: '非公式ファンサイト・営利目的ではありません。' },
}
ja.buffs = ja.teamCost.buffs
ja.castlePoints = ja.teamCost.castlePoints
ja.stats.hp = 'HP'
ja.stats.attack = '攻撃'
ja.stats.defense = '防御'
ja.stats.noCharacterMatches = '「{{query}}」に一致する武将はいません。'
ja.progressCopied = '進行状況のバックアップをコピーしました。'
ja.noRelevantBuffs = '該当するバフはありません'
ja.buffs.guardNote = '重複しません — 最大値のみ有効'
ja.buffs.totalStackable = '{{count}}人の武将による累積可能なバフ合計'
ja.buffs.noBuffFor = '{{key}}の{{stat}}バフはありません'
ja.buffs.woggTitle = '大将軍への道'
ja.buffs.woggDescription = '大将軍への道の2ページ目で解放されるバフです。'
ja.buffs.siegeWeapons = '兵器'
ja.copyShareText = 'RanHQ共有テキストをコピー：'
ja.copyProgress = 'RanHQ進行状況のバックアップをコピー：'
ja.pasteProgress = 'RanHQ進行状況のバックアップを貼り付け：'
ja.progressImported = '進行状況を読み込みました。'
ja.progressImportFailed = '進行状況のバックアップを読み込めませんでした。'
ja.clearProgressConfirm = 'このブラウザに保存されたRanHQ進行状況をすべて削除しますか？'
ja.buffs.teamSummary = '編成バフ概要'
ja.buffs.includeCombat = '戦闘技能も含める'
ja.buffs.includeCombatTitle = '戦闘技能のバフ・デバフも集計（戦略技能と選択した総大将・軍師技能は常に含まれます）'
ja.buffs.attackingFormation = '攻撃編成'
ja.buffs.defendingFormation = '防御編成'

const ar = {
  ...en,
  appName: 'RanHQ', localeLabel: 'اللغة', loading: 'جارٍ التحميل', unknown: 'غير معروف', translationPending: 'الترجمة قيد الإعداد', originalJapanese: 'النص الياباني الأصلي', sourceVerified: 'مصدر اللعبة موثّق', sourceUnavailable: 'المصدر غير متاح', close: 'إغلاق', openOriginal: 'فتح الصورة الأصلية في تبويب جديد', viewArt: 'عرض الصورة بالحجم الكامل', share: 'مشاركة', image: 'صورة', making: 'جارٍ الإنشاء…', shared: 'تمت المشاركة', copied: 'تم النسخ', copyFailed: 'فشل النسخ', previewReady: 'المعاينة جاهزة', imageFailed: 'فشل إنشاء الصورة', copyImage: 'نسخ الصورة', downloadPng: 'تنزيل PNG', pasteImageHint: 'الصقها في Discord بعد النسخ، أو نزّل ملف PNG.', imagePreview: 'معاينة الصورة', shareTeam: 'مشاركة الفريق', skillEffectQualifiers: 'شروط تأثير المهارة', search: 'بحث', results: 'النتائج', generals: 'جنرالات', owned: 'مملوك', all: 'الكل', missing: 'غير مملوك', savedBrowser: 'محفوظ في هذا المتصفح', export: 'تصدير', import: 'استيراد', clear: 'مسح', own: 'مملوك', markedOwned: 'تم تحديده كمملوك', markOwned: 'تحديد كمملوك', setAttacker: 'تعيين كمهاجم', setDefender: 'تعيين كمدافع', attack: 'هجوم', defend: 'دفاع', remove: 'إزالة', enabled: 'مفعّل', disabled: 'معطّل', starSkill: 'مهارة 6★', toolsSummary: 'تتبّع التقدم واحسب قيم حرب القلاع.', closeTools: 'إغلاق الأدوات', selectedGenerals: '{{count}} جنرالات محددة', ownedCount: '{{owned}}/{{total}} مملوك', resultCount: 'النتائج ({{count}})', generalCount: '{{count}} جنرالات',
  nav: { primary: 'التنقل الرئيسي', home: 'الصفحة الرئيسية لـRanHQ', archive: 'الأرشيف', characters: 'الجنرالات', sceneCards: 'بطاقات CW6★', teams: 'التشكيلات', partyBuilder: 'منشئ الفرق', metawatch: 'مراقبة الميتا', battleOrder: 'ترتيب الجولات', guide: 'الدليل', tools: 'الأدوات', buffTracker: 'متتبّع التعزيزات', statsCalculator: 'حاسبة الخصائص', teamCost: 'تكلفة الفريق', castlePoints: 'نقاط القلاع', charactersNote: 'مهارات وخصائص وفصائل', sceneCardsNote: 'المالكون والمهارات المترجمة', partyBuilderNote: 'ابنِ فرق الهجوم والدفاع', metawatchNote: 'التشكيلات الموصى بها حاليًا', battleOrderNote: 'راجع الجولات وتعزيزات الفريق', buffTrackerNote: 'سجّل المصادر والمجاميع المملوكة', statsCalculatorNote: 'احسب قوة حرب القلاع', teamCostNote: 'خطّط لتكلفة الكرستالات الحمراء', castlePointsNote: 'توقّع ترتيب التحالف' },
  home: { heroDescription: 'رفيقك في حرب القلاع لبناء الفرق والتعزيزات والمواجهات وكل ما يتعلق بـCW.', openArchive: 'فتح الأرشيف', buildTeam: 'بناء فريق', findInformation: 'العثور على معلومات اللعبة', findDescription: 'أرشيف قابل للبحث يضم مهارات الجنرالات ومراجع حرب القلاع.', buildCompare: 'ابنِ وقارن الفرق', buildDescription: 'ابدأ بتشكيلة حالية، وعدّل المهارات، وراجع ترتيب الجولات.', trackCalculate: 'تتبّع واحسب', trackDescription: 'نظّم التعزيزات المملوكة وخطّط لموارد وقوة كل فريق.', learnCastleWar: 'تعلّم حرب القلاع', guideDescription: 'استخدم الدليل لقواعد الاستهداف والحالات والتضاريس والمواجهات.', openGuide: 'فتح الدليل الكامل', guideBasics: 'أساسيات حرب القلاع', guideRoles: 'أدوار الجنرالات', guideStats: 'شاشة خصائص CW' },
  archive: {
    hubIntro: "اختر قاعدة بيانات الجنرالات أو مجموعة بطاقات CW6★.",
    hubCharacters: "ابحث بالأسماء أو تأثيرات المهارات، وصفِّ النتائج حسب الفصيل، ثم افتح مهارات أي جنرال.",
    hubCards: "تعرّف على مالكي البطاقات وتأثيرات مهاراتها، واعرض الرسوم الأصلية، وسجّل البطاقات التي تملكها في هذا المتصفح.",
 sections: 'أقسام الأرشيف', title: 'الأرشيف', sceneSubtitle: 'مهارات بطاقات المشهد 6★ ومالكوها', ownershipFilter: 'مرشح ملكية CW6', searchGenerals: 'ابحث عن الجنرالات', roster: 'قائمة {{faction}}', skills: 'المهارات', skillsAndStats: 'المهارات والخصائص والفصائل', sceneCards: 'بطاقات CW6★', cardArt: 'صورة بطاقة المشهد', owners: 'المالكون' },
  builder: { title: 'منشئ الفرق', subtitle: 'انقر على الخانات لإضافة الجنرالات. يتحرك الجنرالات حسب ترتيب التشكيلة.', formationSide: 'جانب التشكيلة', attacking: 'الهجوم', defending: 'الدفاع', clickAdd: 'انقر للإضافة', viewBattleOrder: 'عرض ترتيب الجولات', teamBuffs: 'تعزيزات الفريق', calculated: 'محسوبة من هذه التشكيلة', hide: 'إخفاء', review: 'مراجعة', knownTeam: 'ابدأ من فريق معروف', knownTeamDescription: 'حمّل تشكيلة حالية ثم عدّلها في المحرر أعلاه.' },
  sim: { title: 'ترتيب الجولات', description: 'تُطلق مهارات القائد والاستراتيجي في الجولة الأولى. تبقى تأثيرات الاستراتيجية فعالة طوال المعركة. يتحرك الجنرالات حسب ترتيب التشكيلة، ويستخدم كل جنرال مهاراته القتالية بدءًا بالمهارة ذات رقم الخانة الأعلى.', editTeams: 'تعديل الفرق', chooseTeams: 'اختر فريق الهجوم والدفاع أولًا.', emptyDescription: 'يحوّل ترتيب الجولات فريقي الهجوم والدفاع المكتملين إلى تسلسل واضح لإطلاق المهارات.', emptyReason: 'لا يوجد ما يُعرض بعد لأن فريق الهجوم أو الدفاع غير مكتمل.', goBuilder: 'الانتقال إلى منشئ الفرق', leaderSkills: 'مهارات القائد والاستراتيجي — الجولة الأولى', strategySkills: 'مهارات الاستراتيجية — فعالة دائمًا', activation: 'ترتيب إطلاق المهارات', turn: 'الجولة {{turn}}' },
  guide: {
    hubIntro: "ابدأ بالأساسيات، أو انتقل مباشرةً من الفهرس إلى موضوع حرب القلاع الذي تحتاجه.",
    hubBeginner: "تعلّم سير المعركة وقراءة شاشة الخصائص، وخطّط لتطوير جنرالاتك.",
    hubAdvanced: "راجع مهارات القائد والاستراتيجي، والمقاومات، والحالات، والتضاريس، وتداخلات التأثيرات، وقواعد الاستهداف.",
 title: 'دليل حرب القلاع', intro: 'قواعد حرب القلاع والاستهداف والحالات والتضاريس ومراجع المواجهات.', section: 'قسم الدليل', contents: 'محتويات الدليل', beginner: 'مبتدئ', advanced: 'متقدم', basics: 'الأساسيات', roles: 'أدوار الجنرالات', stats: 'خصائص CW', glossary: 'مسرد المصطلحات', sections: { basics: 'الأساسيات', 'stats-screen': 'شاشة خصائص CW', roles: 'الأدوار', bandits: 'مطاردة قطاع الطرق', matchups: 'مواجهات الوحدات', types: 'أنواع المهارات', crystals: 'أنواع الكرستالات', stats: 'كيفية رفع خصائص CW', leaders: 'القائد والاستراتيجي', debuffs: 'مقاومة الإضعاف', effects: 'الحالات', terrain: 'تأثيرات التضاريس', interactions: 'تداخلات التأثيرات', targeting: 'قواعد الاستهداف' } },
  noChange: 'لا تغيير', vsCurrent: 'مقابل الحالي', minimumAttack: 'الحد الأدنى للهجوم', maximumAttack: 'الحد الأقصى للهجوم', defense: 'الدفاع', added: 'مضاف', full: 'ممتلئ', costLabel: 'التكلفة', redCrystalAlt: 'الكرستالة الحمراء', efficiencyTooltip: 'الكفاءة: {{value}} من الكرستالات الحمراء لكل 1% تعزيز. الأقل أفضل (التكلفة {{cost}} / التعزيز {{buff}}%)', redCrystalCostTooltip: 'تكلفة فتح المهارة بالكرستالات الحمراء: {{cost}}',
  stats: { title: 'حاسبة الخصائص', description: 'أدخل قيم شاشة CW، بما فيها التعزيزات الفعالة. أضف التعزيزات النسبية أو تعزيزات بطاقات المشهد الأساسية لمعاينة القوة.', saved: 'محفوظ تلقائيًا', reset: 'إعادة ضبط الحاسبة', confirmClear: 'هل تريد مسح فرق الحاسبة والقيم المحفوظة على هذا الجهاز؟', addTeam: 'إضافة فريق آخر', maxTeams: 'تم بلوغ الحد الأقصى: 5 فرق', addCharacter: 'إضافة جنرال', searchHint: 'ابدأ بالكتابة لإضافة جنرال إلى الخانة التالية.', fullHint: 'الخانات الأربع ممتلئة. استخدم تغيير الجنرال في البطاقة للاستبدال.', noCharacterMatches: 'لا توجد جنرالات تطابق «{{query}}».', team: 'الفريق {{number}}', removeTeam: 'إزالة الفريق', powerAfterBuffs: 'قوة CW بعد التعزيزات', screenValues: 'قيم شاشة CW', fromScreen: 'من شاشة CW', activeBuffs: 'التعزيزات الفعالة', buffsToAdd: 'تعزيزات للإضافة', sceneCardBuffs: 'تعزيزات بطاقة المشهد الأساسية', changeCharacter: 'تغيير الجنرال', editHint: 'اختر جنرالًا أعلاه لتحرير خصائصه.', chooseCharacter: 'اختر جنرالًا', hp: 'الصحة', attack: 'الهجوم', defense: 'الدفاع' },
  footer: { madeBy: 'أنشأه', specialThanks: 'شكر خاص', joinDiscord: 'انضم إلى Discord', unofficial: 'موقع معجبين غير رسمي — ليس لأغراض تجارية.' },
}
ar.noBoard = 'لا توجد لوحة'
ar.buffType = 'نوع التعزيز'
ar.unitType = 'نوع الوحدة'
ar.state = 'الدولة'
ar.meta = { ...en.meta, title: 'مراقبة الميتا', subtitle: 'التشكيلات الشائعة · آخر تحديث: يونيو 2026', by: 'قائمة الرتب من إعداد', apex: 'القمة — أقوى فريق في اللعبة', kings: '★ ملوك الميتا بلا منازع ★', source: 'المصدر: معارك الذهب وX وYouTube وآراء المجتمع · المعيار: تناغم الفريق والمهارات الفريدة وخصائص الوحدات وتكلفة التدريب', tier: 'رتبة {{tier}}' }
ar.teamCost = {
  ...en.teamCost,
  title: 'تكلفة الفريق', description: 'احسب الكرستالات الحمراء اللازمة لتطوير ما يصل إلى أربعة جنرالات.', needed: 'الكرستالات الحمراء اللازمة', chooseSlot: 'اختر خانة للبدء', clearAll: 'مسح الكل', team: 'الفريق', selected: '{{count}}/4 محدد', skills: 'تكاليف المهارات', byRarity: 'حسب الندرة', rarity: 'الندرة', skill: 'المهارة {{number}}', total: 'الإجمالي', selectGeneral: 'اختر جنرالًا', slot: 'الخانة {{number}}', search: 'بحث…', clickAdd: 'انقر لإضافة جنرال', maxed: 'الحد الأقصى', change: 'تغيير',
  buffs: { ...en.teamCost.buffs, title: 'متتبّع التعزيزات', description: 'سجّل التعزيزات الدائمة التي تملكها وتابع مجموعها عبر أنواع الوحدات والدول والوحدات الخاصة والتضاريس وبطاقات المشهد.', find: 'ابحث عن فئة أو جنرال', search: 'بحث في التعزيزات…', redCrystal: 'ترقية الكرستالة الحمراء', shard: 'ترقية الشظية (+5%)', unitTypes: 'أنواع الوحدات', states: 'الدول', specialUnits: 'الوحدات الخاصة', terrain: 'التضاريس', sceneCards: 'بطاقات المشهد', sceneDescription: 'تنطبق تعزيزات بطاقة المشهد على جميع الجنرالات.', ownedTotals: 'مجاميع التعزيزات المملوكة', sourcesOwned: '{{owned}}/{{total}} من المصادر محددة كمملوكة.', showTotals: 'إظهار المجاميع حسب الفئة', byCategory: 'حسب الفئة — انقر للتوسيع', noCards: 'لا توجد بطاقات لهذا المرشح.', tapCategory: 'اضغط على أي فئة أعلاه لرؤية تعزيزات CW', buffsOwned: '{{owned}}/{{total}} من تعزيزات بطاقات المشهد مملوكة', ownershipFilter: 'مرشح ملكية تعزيزات بطاقات المشهد' },
  castlePoints: { ...en.teamCost.castlePoints, tool: 'أداة حرب القلاع', title: 'نقاط القلاع', mode: 'وضع حرب القلاع', pointSummary: 'قيم النقاط والملخص الحالي', large: 'قلعة كبيرة', medium: 'قلعة متوسطة', small: 'قلعة صغيرة', largeShort: 'ك', mediumShort: 'م', smallShort: 'ص', castle: 'قلعة', alliance: 'تحالف', today: 'اليوم', currentTotal: 'الإجمالي الحالي', projected: 'المتوقع', board: 'لوحة التحالف', reset: 'إعادة ضبط', addAlliance: 'إضافة تحالف', add: 'إضافة', ranking: 'الترتيب المتوقع', pointsToday: '{{count}} نقطة اليوم', mine: 'تحالفك', remove: 'إزالة', allianceName: 'اسم التحالف', currentPoints: 'النقاط التراكمية الحالية', bottomTwo: 'آخر تحالفين', projectedFirst: 'المركز الأول المتوقع', leading: 'تحالفك في صدارة هذه اللوحة.', behindFirst: '{{count}} نقطة خلف المركز الأول', roughly: 'حوالي {{count}}.', allianceCount: '{{count}} تحالفات', allianceCount_one: '{{count}} تحالف', castleCount: '{{count}} قلاع', castleCount_one: '{{count}} قلعة', largeCastleCount: '{{count}} قلاع كبيرة', largeCastleCount_one: '{{count}} قلعة كبيرة', mediumCastleCount: '{{count}} قلاع متوسطة', mediumCastleCount_one: '{{count}} قلعة متوسطة', smallCastleCount: '{{count}} قلاع صغيرة', smallCastleCount_one: '{{count}} قلعة صغيرة', zeroPoints: '0 نقطة', versionOne: 'الإصدار 1.0', versionTwo: 'الإصدار 2.0' },
}
ar.buffs = ar.teamCost.buffs
ar.castlePoints = ar.teamCost.castlePoints
ar.stats.hp = 'الصحة'
ar.stats.attack = 'الهجوم'
ar.stats.defense = 'الدفاع'
ar.stats.noCharacterMatches = 'لا توجد جنرالات تطابق «{{query}}».'
ar.progressCopied = 'تم نسخ نسخة احتياطية للتقدم.'
ar.noRelevantBuffs = 'لا توجد تعزيزات ذات صلة'
ar.buffs.guardNote = 'لا يتراكم — القيمة الأعلى فقط فعالة'
ar.buffs.totalStackable = 'إجمالي التعزيز القابل للتراكم من {{count}} جنرالات'
ar.buffs.totalStackable_zero = 'لا يوجد تعزيز قابل للتراكم'
ar.buffs.noBuffFor = 'لا يوجد تعزيز {{stat}} لـ {{key}}'
ar.buffs.woggTitle = 'طريق الجنرال العظيم'
ar.buffs.woggDescription = 'تُفتح هذه التعزيزات من الصفحة الثانية من طريق الجنرال العظيم.'
ar.buffs.siegeWeapons = 'أسلحة الحصار'
ar.copyShareText = 'انسخ نص مشاركة RanHQ هذا:'
ar.copyProgress = 'انسخ نسخة RanHQ الاحتياطية للتقدم:'
ar.pasteProgress = 'الصق نسخة RanHQ الاحتياطية للتقدم:'
ar.progressImported = 'تم استيراد التقدم.'
ar.progressImportFailed = 'تعذر قراءة نسخة التقدم الاحتياطية.'
ar.clearProgressConfirm = 'هل تريد مسح كل تقدم RanHQ المحفوظ في هذا المتصفح؟'
ar.buffs.teamSummary = 'ملخص تعزيزات الفريق'
ar.buffs.includeCombat = 'تضمين المهارات القتالية'
ar.buffs.includeCombatTitle = 'احتسب أيضًا تأثيرات التعزيز والإضعاف من المهارات القتالية (مهارات الاستراتيجية ومهارات القائد/الاستراتيجي المحددة مشمولة أصلًا)'
ar.buffs.attackingFormation = 'تشكيلة الهجوم'
ar.buffs.defendingFormation = 'تشكيلة الدفاع'

ja.shareOutput = { sceneCardSkill: 'CW6追想カード技能', sideSkills: '{{side}}技能', duration: '効果時間', enemyDebuffOn: '敵へのデバフ', skillCard: 'RanHQ スキルカード', generatedFor: 'Discord共有用に作成', partyBuilder: 'RanHQ 編成作成', builderNote: '現在の編成の技能設定を反映', teamSheet: 'Discord共有用の編成技能表', teamSkills: 'RanHQ 編成技能', noEffects: '翻訳済みの効果はまだありません。', effect: '効果', skill: '技能', star6: '☆6', unnamedSkill: '名称未設定', noGenerals: '武将未選択', teamBuffSummary: 'RanHQ 編成バフ概要', withCombat: '戦略技能と戦闘技能の効果を含む。', strategyOnly: '戦略技能のみ。', truncated: '…Discord向けに省略しました。', fullDetails: '詳細' }
ar.shareOutput = { sceneCardSkill: 'مهارة بطاقة CW6', sideSkills: 'مهارات {{side}}', duration: 'المدة', enemyDebuffOn: 'إضعاف العدو على', skillCard: 'بطاقة مهارات RanHQ', generatedFor: 'أُنشئت للمشاركة على Discord', partyBuilder: 'منشئ فرق RanHQ', builderNote: 'تعكس إعدادات المهارات في الفريق الحالي', teamSheet: 'ورقة مهارات الفريق للمشاركة على Discord', teamSkills: 'مهارات فريق RanHQ', noEffects: 'لا توجد تأثيرات مترجمة بعد.', effect: 'تأثير', skill: 'مهارة', star6: '6★', unnamedSkill: 'مهارة بلا اسم', noGenerals: 'لم يُحدد أي جنرال', teamBuffSummary: 'ملخص تعزيزات فريق RanHQ', withCombat: 'تشمل تأثيرات مهارات الاستراتيجية والمهارات القتالية.', strategyOnly: 'مهارات الاستراتيجية فقط.', truncated: '…تم اختصار المحتوى ليناسب Discord.', fullDetails: 'التفاصيل الكاملة' }

// Battle-simulator result panel. It renders only after a simulation runs, so
// it stayed English long after the rest of /sim was localized.
en.battle = { attackWins: 'Attacking Team Wins', defendWins: 'Defending Team Wins', byPoints: '(Points)', turn: 'Turn {{count}}', attackingSide: 'Attacking', defendingSide: 'Defending', totalDamage: 'Total dmg dealt', killLog: 'Kill Log', resimulate: 'Re-Simulate', varyNote: 'Results may vary each run', ko: 'KO' }
ja.battle = { attackWins: '攻撃側の勝利', defendWins: '防衛側の勝利', byPoints: '（ポイント）', turn: '第{{count}}ターン', attackingSide: '攻撃側', defendingSide: '防衛側', totalDamage: '総与ダメージ', killLog: '撃破ログ', resimulate: '再シミュレート', varyNote: '実行ごとに結果は変動します', ko: '撃破' }
ar.battle = { attackWins: 'فوز فريق الهجوم', defendWins: 'فوز فريق الدفاع', byPoints: '(بالنقاط)', turn: 'الجولة {{count}}', attackingSide: 'الهجوم', defendingSide: 'الدفاع', totalDamage: 'إجمالي الضرر', killLog: 'سجل الإسقاطات', resimulate: 'إعادة المحاكاة', varyNote: 'قد تختلف النتائج في كل تشغيل', ko: 'أُسقط' }
// The attack/defence separator. Japanese uses VS as-is; Arabic does not.
en.versus = 'VS'
ja.versus = 'VS'
ar.versus = 'ضد'
// Image alt text — read aloud by screen readers, so it is localized too.
en.altStar6Skill = '6★ skill'
ja.altStar6Skill = '☆6技能'
ar.altStar6Skill = 'مهارة 6★'
en.altSceneCardArt = 'Scene card art'
ja.altSceneCardArt = '追想カードイラスト'
ar.altSceneCardArt = 'رسم بطاقة المشهد'
// Screen-reader labels that were composed from a hardcoded English word.
en.count = 'Count'
ja.count = '数'
ar.count = 'العدد'
en.stats.teamRoster = '{{team}} generals'
ja.stats.teamRoster = '{{team}}の武将'
ar.stats.teamRoster = 'جنرالات {{team}}'
// Country group for preset comps built around a unit type rather than a state.
en.builder.mixedCountry = 'Mixed'
ja.builder.mixedCountry = '混成'
ar.builder.mixedCountry = 'مختلطة'

// ── Arabic plural forms ─────────────────────────────────────────────────────
// Arabic has six CLDR plural categories, not two. Supplying only the base form
// and `_one` meant i18next silently fell back to the plural for every other
// count, so the UI showed "1 جنرالات", "2 قلاع" and "11 قلاع".
// The base key carries the `many`/`other` form (11+ takes the singular
// accusative), `_few` covers 3-10, and `_two` is the dual.
// Arabic has a distinct CLDR "zero" plural category. Without an explicit
// _zero the count fell through to the 11+ accusative and read "0 جنرالًا".
ar.generalCount = '{{count}} جنرالًا'
ar.generalCount_zero = 'لا جنرالات'
ar.generalCount_one = 'جنرال واحد'
ar.generalCount_two = 'جنرالان'
ar.generalCount_few = '{{count}} جنرالات'
ar.selectedGenerals = '{{count}} جنرالًا محددًا'
ar.selectedGenerals_zero = 'لم يُحدد أي جنرال'
ar.selectedGenerals_one = 'جنرال واحد محدد'
ar.selectedGenerals_two = 'جنرالان محددان'
ar.selectedGenerals_few = '{{count}} جنرالات محددة'
ar.buffs.totalStackable = 'إجمالي التعزيز القابل للتراكم من {{count}} جنرالًا'
ar.buffs.totalStackable_zero = 'لا يوجد تعزيز قابل للتراكم'
ar.buffs.totalStackable_one = 'إجمالي التعزيز القابل للتراكم من جنرال واحد'
ar.buffs.totalStackable_two = 'إجمالي التعزيز القابل للتراكم من جنرالين'
ar.buffs.totalStackable_few = 'إجمالي التعزيز القابل للتراكم من {{count}} جنرالات'
ar.castlePoints.allianceCount = '{{count}} تحالفًا'
ar.castlePoints.allianceCount_zero = 'لا تحالفات'
ar.castlePoints.allianceCount_one = 'تحالف واحد'
ar.castlePoints.allianceCount_two = 'تحالفان'
ar.castlePoints.allianceCount_few = '{{count}} تحالفات'
ar.castlePoints.castleCount = '{{count}} قلعة'
ar.castlePoints.castleCount_zero = 'لا قلاع'
ar.castlePoints.castleCount_one = 'قلعة واحدة'
ar.castlePoints.castleCount_two = 'قلعتان'
ar.castlePoints.castleCount_few = '{{count}} قلاع'
ar.castlePoints.largeCastleCount = '{{count}} قلعة كبيرة'
ar.castlePoints.largeCastleCount_zero = 'لا قلاع كبيرة'
ar.castlePoints.largeCastleCount_one = 'قلعة كبيرة واحدة'
ar.castlePoints.largeCastleCount_two = 'قلعتان كبيرتان'
ar.castlePoints.largeCastleCount_few = '{{count}} قلاع كبيرة'
ar.castlePoints.mediumCastleCount = '{{count}} قلعة متوسطة'
ar.castlePoints.mediumCastleCount_zero = 'لا قلاع متوسطة'
ar.castlePoints.mediumCastleCount_one = 'قلعة متوسطة واحدة'
ar.castlePoints.mediumCastleCount_two = 'قلعتان متوسطتان'
ar.castlePoints.mediumCastleCount_few = '{{count}} قلاع متوسطة'
ar.castlePoints.smallCastleCount = '{{count}} قلعة صغيرة'
ar.castlePoints.smallCastleCount_zero = 'لا قلاع صغيرة'
ar.castlePoints.smallCastleCount_one = 'قلعة صغيرة واحدة'
ar.castlePoints.smallCastleCount_two = 'قلعتان صغيرتان'
ar.castlePoints.smallCastleCount_few = '{{count}} قلاع صغيرة'
ar.castlePoints.pointsToday = '{{count}} نقطة اليوم'
ar.castlePoints.pointsToday_zero = 'لا نقاط اليوم'
ar.castlePoints.pointsToday_one = 'نقطة واحدة اليوم'
ar.castlePoints.pointsToday_two = 'نقطتان اليوم'
ar.castlePoints.pointsToday_few = '{{count}} نقاط اليوم'
ar.castlePoints.behindFirst = '{{count}} نقطة خلف المركز الأول'
ar.castlePoints.behindFirst_zero = 'لا فارق عن المركز الأول'
ar.castlePoints.behindFirst_one = 'نقطة واحدة خلف المركز الأول'
ar.castlePoints.behindFirst_two = 'نقطتان خلف المركز الأول'
ar.castlePoints.behindFirst_few = '{{count}} نقاط خلف المركز الأول'

// ── French ──────────────────────────────────────────────────────────────────
// Terminology follows the French Kingdom Ran community (touranko.vercel.app):
// the mode 同盟争覇戦 is "Conquête d'Alliance" — the label TouranKo itself uses
// for its own link to RanHQ — and unit types, states and statuses reuse the
// words its skill translations already put in front of French players.
const fr = {
  appName: 'RanHQ', localeLabel: 'Langue', loading: 'Chargement', unknown: 'Inconnu', translationPending: 'Traduction à venir', originalJapanese: 'Texte original (japonais)', sourceVerified: 'Source du jeu vérifiée', sourceUnavailable: 'Source indisponible', close: 'Fermer', openOriginal: 'Ouvrir l’original dans un nouvel onglet', viewArt: 'Voir l’illustration en pleine résolution', share: 'Partager', image: 'Image', making: 'Création…', shared: 'Partagé', copied: 'Copié', copyFailed: 'Échec de la copie', previewReady: 'Aperçu prêt', imageFailed: 'Échec de la création de l’image', copyImage: 'Copier l’image', downloadPng: 'Télécharger le PNG', pasteImageHint: 'Collez l’image dans Discord après l’avoir copiée, ou téléchargez le PNG.', imagePreview: 'aperçu de l’image', shareTeam: 'Partager l’équipe', skillEffectQualifiers: 'Conditions de l’effet', search: 'Rechercher', results: 'Résultats', generals: 'généraux', owned: 'Possédé', all: 'Tous', missing: 'À obtenir', savedBrowser: 'Enregistré sur ce navigateur', export: 'Exporter', import: 'Importer', clear: 'Effacer', own: 'Je l’ai', markedOwned: 'Marqué comme possédé', markOwned: 'Marquer comme possédé', setAttacker: 'Mettre en attaque', setDefender: 'Mettre en défense', attack: 'Attaque', defend: 'Défense', remove: 'Retirer', enabled: 'activée', disabled: 'désactivée', starSkill: 'Compétence 6★', toolsSummary: 'Suivez votre progression et calculez vos valeurs de Conquête d’Alliance.', closeTools: 'Fermer les outils', selectedGenerals: '{{count}} généraux sélectionnés', ownedCount: '{{owned}}/{{total}} en votre possession', resultCount: 'Résultats ({{count}})', generalCount: '{{count}} généraux',
  nav: {
    primary: 'Navigation principale', home: 'Accueil RanHQ', archive: 'Archive', characters: 'Personnages', sceneCards: 'Cartes scène CW6★', teams: 'Équipes', partyBuilder: 'Créateur d’équipe', metawatch: 'Metawatch', battleOrder: 'Ordre d’activation', guide: 'Guide', tools: 'Outils', buffTracker: 'Suivi des buffs', statsCalculator: 'Calcul des stats', teamCost: 'Coût d’équipe', castlePoints: 'Points de château',
    charactersNote: 'Compétences, stats et factions', sceneCardsNote: 'Détenteurs et compétences traduites', partyBuilderNote: 'Composez vos formations d’attaque et de défense', metawatchNote: 'Formations recommandées du moment', battleOrderNote: 'Vérifiez les tours et les buffs d’équipe', buffTrackerNote: 'Cochez vos sources et suivez les totaux', statsCalculatorNote: 'Calculez votre puissance en Conquête', teamCostNote: 'Anticipez vos cristaux rouges', castlePointsNote: 'Estimez le classement de l’alliance',
  },
  home: {
    heroDescription: 'RanHQ vous accompagne dans la Conquête d’Alliance : compositions d’équipe, buffs, affinités et toutes les informations utiles.',
    openArchive: 'Ouvrir l’archive', buildTeam: 'Composer une équipe',
    findInformation: 'Trouver des informations', findDescription: 'Retrouvez les compétences traduites et les références de Conquête d’Alliance dans une archive facile à consulter.',
    buildCompare: 'Composer et comparer', buildDescription: 'Partez d’une formation existante, ajustez les compétences débloquées et vérifiez l’ordre d’activation.',
    trackCalculate: 'Suivre et calculer', trackDescription: 'Gardez vos buffs à jour et planifiez les ressources et la puissance de chaque équipe.',
    learnCastleWar: 'Découvrir la Conquête d’Alliance', guideDescription: 'Consultez le guide de terrain pour comprendre les mécaniques, le ciblage, les effets d’état, les terrains et les affinités.',
    openGuide: 'Ouvrir le guide complet', guideBasics: 'Bases de la Conquête', guideRoles: 'Rôles des généraux', guideStats: 'Écran des stats CW',
  },
  archive: {
    hubIntro: "Choisissez la base des généraux ou la collection de cartes scène CW6★.",
    hubCharacters: "Recherchez un nom ou un effet de compétence, filtrez par faction et consultez les compétences de chaque général.",
    hubCards: "Retrouvez les détenteurs et les effets des cartes, affichez les illustrations d’origine et suivez les cartes en votre possession dans ce navigateur.",

    sections: 'Sections de l’archive', title: 'Archive', sceneSubtitle: 'Compétences des cartes scène 6★ et leurs détenteurs', ownershipFilter: 'Filtre de possession CW6', searchGenerals: 'Rechercher un général', roster: 'Généraux · {{faction}}', skills: 'Compétences', skillsAndStats: 'Compétences, stats et factions', sceneCards: 'Cartes scène CW6★', cardArt: 'Illustration de la carte scène', owners: 'Détenteurs',
  },
  builder: {
    title: 'Créateur d’équipe', subtitle: 'Cliquez sur un emplacement pour ajouter un général. Les généraux agissent dans l’ordre de la formation.', formationSide: 'Type de formation', attacking: 'Attaque', defending: 'Défense', clickAdd: 'Cliquez pour ajouter', viewBattleOrder: 'Voir l’ordre d’activation', teamBuffs: 'Buffs d’équipe', calculated: 'Calculés à partir de cette formation', hide: 'Masquer', review: 'Voir', knownTeam: 'Partir d’une composition connue', knownTeamDescription: 'Chargez une formation du moment, puis ajustez-la dans l’éditeur ci-dessus.', mixedCountry: 'Mixte',
  },
  sim: {
    title: 'Ordre d’activation', description: 'Les compétences de Leader et de Stratège se déclenchent au tour 1. Les effets de stratégie restent actifs pendant toute la bataille. Les généraux agissent dans l’ordre de la formation. Chaque général utilise ses compétences de combat en commençant par celle dont le numéro d’emplacement est le plus élevé.', editTeams: 'Modifier les équipes', chooseTeams: 'Choisissez d’abord une équipe d’attaque et une équipe de défense.', emptyDescription: 'L’ordre d’activation présente les compétences de vos équipes d’attaque et de défense dans leur ordre de déclenchement.', emptyReason: 'Rien à afficher pour l’instant : au moins une des deux équipes est incomplète.', goBuilder: 'Aller au créateur d’équipe', leaderSkills: 'Compétences de Leader et de Stratège — tour 1', strategySkills: 'Compétences de stratégie — toujours actives', activation: 'Ordre d’activation des compétences', turn: 'Tour {{turn}}',
  },
  guide: {
    hubIntro: "Commencez par les bases ou accédez directement au sujet qui vous intéresse grâce à ce sommaire.",
    hubBeginner: "Comprenez le déroulement des combats, apprenez à lire l’écran des stats et planifiez la progression de vos généraux.",
    hubAdvanced: "Consultez les compétences de Leader et de Stratège, les résistances, les effets d’état, les terrains, les interactions et les règles de ciblage.",

    title: 'Guide de la Conquête d’Alliance', intro: 'Découvrez les mécaniques, les règles de ciblage, les effets d’état, les terrains et les affinités de la Conquête d’Alliance.', section: 'Section du guide', contents: 'Sommaire du guide', beginner: 'Débutant', advanced: 'Avancé', basics: 'Bases', roles: 'Rôles des généraux', stats: 'Stats CW', glossary: 'Glossaire',
    sections: {
      basics: 'Bases', 'stats-screen': 'Écran des stats CW', roles: 'Rôles', bandits: 'Chasse aux bandits', matchups: 'Affinités des unités', types: 'Types de compétences', crystals: 'Types de cristaux', stats: 'Augmenter ses stats CW', leaders: 'Leader et Stratège', debuffs: 'Résistance aux débuffs', effects: 'Effets d’état', terrain: 'Effets de terrain', interactions: 'Interactions d’effets', targeting: 'Règles de ciblage',
    },
  },
  noChange: 'Aucun changement', vsCurrent: 'par rapport à la valeur actuelle', minimumAttack: 'Attaque minimale', maximumAttack: 'Attaque maximale', defense: 'Défense', added: 'Ajouté', full: 'Complet', costLabel: 'Coût', redCrystalAlt: 'Cristal rouge',
  efficiencyTooltip: 'Efficacité : {{value}} cristaux rouges pour 1 % de buff. Plus la valeur est basse, mieux c’est. (coût : {{cost}} / buff : {{buff}} %)',
  redCrystalCostTooltip: 'Coût de déblocage en cristaux rouges : {{cost}}',
  stats: {
    title: 'Calcul des stats', description: 'Saisissez les valeurs de l’écran CW, buffs actifs compris. Ajoutez des buffs en pourcentage ou les buffs de base des cartes scène pour afficher la puissance obtenue.', saved: 'Enregistré automatiquement', reset: 'Réinitialiser le calculateur', confirmClear: 'Effacer toutes les équipes et valeurs enregistrées sur cet appareil ?', addTeam: 'Ajouter une équipe', maxTeams: 'Maximum de 5 équipes atteint', addCharacter: 'Ajouter un personnage', searchHint: 'Commencez à saisir un nom pour ajouter un personnage au prochain emplacement libre.', fullHint: 'Les quatre emplacements sont occupés. Utilisez « Changer de personnage » sur une carte pour remplacer quelqu’un.', noCharacterMatches: 'Aucun personnage ne correspond à « {{query}} ».', team: 'Équipe {{number}}', removeTeam: 'Retirer l’équipe', powerAfterBuffs: 'Puissance CW après buffs', screenValues: 'Valeurs de l’écran CW', fromScreen: 'Depuis l’écran CW', activeBuffs: 'Buffs déjà actifs', buffsToAdd: 'Buffs à ajouter', sceneCardBuffs: 'Buffs de base des cartes scène', changeCharacter: 'Changer de personnage', editHint: 'Sélectionnez un personnage ci-dessus pour modifier ses stats.', chooseCharacter: 'Choisir un personnage', hp: 'PV', attack: 'Attaque', defense: 'Défense', teamRoster: 'Généraux · {{team}}',
  },
  noBoard: 'Aucun tableau', buffType: 'Type de buff', unitType: 'Type d’unité', state: 'Faction',
  meta: {
    title: 'METAWATCH CONQUÊTE', subtitle: 'Armées les plus vues · Dernière mise à jour : juin 2026', by: 'Tier list par', apex: 'Le sommet — la meilleure équipe du jeu', kings: '★ ROIS INCONTESTÉS DE LA MÉTA ★', source: 'Sources : combats de rang Or, X, YouTube et retours de la communauté · Critères : synergie d’armée, compétences uniques, stats des unités et coût de développement', tier: 'Tier {{tier}}',
  },
  teamCost: {
    title: 'Coût d’équipe', description: 'Calculez les cristaux rouges nécessaires pour débloquer entièrement les compétences de quatre généraux maximum.', needed: 'Cristaux rouges nécessaires', chooseSlot: 'Choisissez un emplacement pour commencer', clearAll: 'Tout effacer', team: 'Équipe', selected: '{{count}} / 4 sélectionnés', skills: 'Coût des compétences', byRarity: 'Par rareté', rarity: 'Rareté', skill: 'Compétence {{number}}', total: 'Total', selectGeneral: 'Choisir un général', slot: 'Emplacement {{number}}', search: 'Rechercher…', clickAdd: 'Cliquez pour ajouter un général', maxed: 'Au maximum', change: 'Changer',
    buffs: {
      title: 'Suivi des buffs', description: 'Cochez les buffs passifs que vous possédez et suivez leur total par type d’unité, faction, unité spéciale, terrain et carte scène.', find: 'Trouver une catégorie ou un général', search: 'Rechercher un buff…', redCrystal: 'Amélioration par cristal rouge', shard: 'Amélioration par éclat (+5 %)', unitTypes: 'Types d’unité', states: 'Factions', specialUnits: 'Unités spéciales', terrain: 'Terrain', sceneCards: 'Cartes scène', sceneDescription: 'Les buffs de cartes scène s’appliquent à tous les personnages.', ownedTotals: 'Total des buffs possédés', sourcesOwned: '{{owned}}/{{total}} sources cochées.', showTotals: 'Afficher les totaux par catégorie', byCategory: 'Par catégorie — cliquez pour développer', noCards: 'Aucune carte ne correspond à ce filtre.', tapCategory: 'Sélectionnez une catégorie ci-dessus pour afficher ses buffs CW', buffsOwned: '{{owned}}/{{total}} buffs de cartes scène possédés', ownershipFilter: 'Filtre de possession des buffs de cartes scène', guardNote: 'Ne se cumule pas — seule la valeur la plus élevée s’applique', totalStackable: 'Total des buffs cumulables pour {{count}} généraux', noBuffFor: 'Aucun buff « {{stat}} » pour {{key}}', woggTitle: 'Voie du Grand Général', woggDescription: 'Ces buffs se débloquent à partir de la page 2 de la Voie du Grand Général.', siegeWeapons: 'Engins de siège', teamSummary: 'Récapitulatif des buffs d’équipe', includeCombat: 'Inclure les compétences de combat', includeCombatTitle: 'Compter également les buffs et débuffs des compétences de combat (les compétences de stratégie ainsi que les compétences de Leader ou de Stratège sélectionnées sont déjà incluses)', attackingFormation: 'Formation d’attaque', defendingFormation: 'Formation de défense',
    },
    castlePoints: {
      tool: 'Outil de Conquête d’Alliance', title: 'Points de château', mode: 'Mode de Conquête d’Alliance', pointSummary: 'Barème et récapitulatif actuel', large: 'Grand château', medium: 'Château moyen', small: 'Petit château', largeShort: 'G', mediumShort: 'M', smallShort: 'P', castle: 'château', alliance: 'Alliance', today: 'Aujourd’hui', currentTotal: 'Total actuel', projected: 'Projection', board: 'Tableau des alliances', reset: 'Réinitialiser', addAlliance: 'Ajouter une alliance', add: 'Ajouter', ranking: 'Classement prévu', pointsToday: '{{count}} points aujourd’hui', mine: 'Mon alliance', remove: 'Retirer', allianceName: 'Nom de l’alliance', currentPoints: 'Points cumulés actuels', bottomTwo: 'Deux derniers', projectedFirst: '1re place prévue', leading: 'Votre alliance est en tête de ce tableau.', behindFirst: '{{count}} pts de retard sur la 1re place', roughly: 'Environ {{count}}.', allianceCount: '{{count}} alliances', castleCount: '{{count}} châteaux', largeCastleCount: '{{count}} grands châteaux', mediumCastleCount: '{{count}} châteaux moyens', smallCastleCount: '{{count}} petits châteaux', zeroPoints: '0 point', versionOne: 'Version 1.0', versionTwo: 'Version 2.0',
    },
  },
  shareOutput: {
    sceneCardSkill: 'Compétence de carte CW6', sideSkills: 'Compétences — {{side}}', duration: 'Durée', enemyDebuffOn: 'Débuff ennemi sur', skillCard: 'Fiche de compétences RanHQ', generatedFor: 'Pour le partage sur Discord', partyBuilder: 'Créateur d’équipe RanHQ', builderNote: 'Compétences activées reprises de l’équipe en cours', teamSheet: 'Fiche de compétences d’équipe pour Discord', teamSkills: 'Compétences d’équipe RanHQ', noEffects: 'Aucun effet traduit pour le moment.', effect: 'Effet', skill: 'Compétence', star6: '6 étoiles', unnamedSkill: 'Compétence sans nom', noGenerals: 'Aucun général sélectionné', teamBuffSummary: 'Récapitulatif des buffs d’équipe RanHQ', withCombat: 'Effets des compétences de stratégie et de combat inclus.', strategyOnly: 'Compétences de stratégie uniquement.', truncated: '… Contenu abrégé pour Discord.', fullDetails: 'Détails complets',
  },
  footer: { madeBy: 'Réalisé par', specialThanks: 'Remerciements', joinDiscord: 'Rejoindre le Discord', unofficial: 'Site de fans non officiel — sans but commercial.' },
  battle: { attackWins: 'Victoire de l’équipe d’attaque', defendWins: 'Victoire de l’équipe de défense', byPoints: '(aux points)', turn: 'Tour {{count}}', attackingSide: 'Attaque', defendingSide: 'Défense', totalDamage: 'Dégâts totaux infligés', killLog: 'Journal des éliminations', resimulate: 'Relancer la simulation', varyNote: 'Les résultats peuvent varier à chaque lancement', ko: 'K.O.' },
  versus: 'VS', altStar6Skill: 'Compétence 6★', altSceneCardArt: 'Illustration de carte scène', count: 'Nombre',
  progressCopied: 'Sauvegarde de progression copiée.',
  noRelevantBuffs: 'Aucun buff pertinent',
  copyShareText: 'Copiez ce texte de partage RanHQ :',
  copyProgress: 'Copiez votre sauvegarde de progression RanHQ :',
  pasteProgress: 'Collez votre sauvegarde de progression RanHQ :',
  progressImported: 'Progression importée.',
  progressImportFailed: 'Cette sauvegarde de progression n’a pas pu être lue.',
  clearProgressConfirm: 'Effacer toute la progression RanHQ enregistrée sur ce navigateur ?',
}
fr.buffs = fr.teamCost.buffs
fr.castlePoints = fr.teamCost.castlePoints
// French CLDR puts 0 and 1 in the `one` category, so "0 général" and
// "1 général" both take the singular while everything above takes the plural.
fr.generalCount_one = '{{count}} général'
fr.selectedGenerals_one = '{{count}} général sélectionné'
fr.buffs.totalStackable_one = 'Total des buffs cumulables pour {{count}} général'
fr.castlePoints.allianceCount_one = '{{count}} alliance'
fr.castlePoints.castleCount_one = '{{count}} château'
fr.castlePoints.largeCastleCount_one = '{{count}} grand château'
fr.castlePoints.mediumCastleCount_one = '{{count}} château moyen'
fr.castlePoints.smallCastleCount_one = '{{count}} petit château'
fr.castlePoints.pointsToday_one = '{{count}} point aujourd’hui'
fr.castlePoints.behindFirst_one = '{{count}} pt de retard sur la 1re place'


// Terrain-buff detail panel on /buffs. The category chips were already
// localized; the panel header still read its name, description and type
// label straight out of the English TERRAIN_BUFFS table.
en.buffs.terrainDamageDealt = 'Increases resistance to damage dealt reduction from {{terrain}} terrain.'
en.buffs.terrainDamageTaken = 'Increases resistance to damage taken increase from {{terrain}} terrain.'
en.buffs.terrainStartingHp = 'Reduces the unit damage effect from {{terrain}} terrain.'
ja.buffs.terrainDamageDealt = '「{{terrain}}」地形による与ダメージ軽減への耐性を上げます。'
ja.buffs.terrainDamageTaken = '「{{terrain}}」地形による被ダメージ上昇への耐性を上げます。'
ja.buffs.terrainStartingHp = '「{{terrain}}」地形による初期兵力減少を軽減します。'
ar.buffs.terrainDamageDealt = 'تزيد المقاومة لتقليل الضرر المُلحق الناتج عن تضاريس {{terrain}}.'
ar.buffs.terrainDamageTaken = 'تزيد المقاومة لارتفاع الضرر المتلقى الناتج عن تضاريس {{terrain}}.'
ar.buffs.terrainStartingHp = 'تقلل فقدان الصحة عند البدء الناتج عن تضاريس {{terrain}}.'
fr.buffs.terrainDamageDealt = 'Augmente la résistance à la réduction des dégâts infligés sur le terrain {{terrain}}.'
fr.buffs.terrainDamageTaken = 'Augmente la résistance à l’augmentation des dégâts subis sur le terrain {{terrain}}.'
fr.buffs.terrainStartingHp = 'Réduit la perte de PV subie au départ sur le terrain {{terrain}}.'

Object.assign(en, {
  routeErrorTitle: 'This page could not load',
  routeErrorOffline: 'You appear to be offline',
  routeErrorNetwork: 'A required page file could not be downloaded. Check your connection, then reload to try again.',
  routeErrorRender: 'An unexpected error interrupted this page. You can reload or return home.',
  routeErrorSaved: 'Your saved teams and progress are still in this browser.',
  routeErrorReload: 'Reload page',
  routeErrorHome: 'Return home',
  progressImportFailed: 'Unsupported progress backup. Use a RanHQ version 1 export with all four progress groups. Your saved progress has not changed.',
  progressStorageFailed: 'Progress could not be saved. Your current progress has not changed. Check browser storage and try again.',
  progressImportSummary: 'Replaced progress with {{cw6}} CW6 cards, {{scene}} buff cards and {{buffs}} buff sources. The previous progress can be restored.',
  restoreProgress: 'Restore previous progress',
  restoreProgressConfirm: 'Replace current progress with the snapshot saved before the last import? Your current progress will be kept as the next snapshot.',
})
Object.assign(ja, {
  routeErrorTitle: 'ページを読み込めませんでした',
  routeErrorOffline: 'インターネットに接続されていないようです',
  routeErrorNetwork: 'ページに必要なファイルをダウンロードできませんでした。接続を確認してから、再読み込みしてください。',
  routeErrorRender: '予期しないエラーでページの表示が中断されました。再読み込みするか、ホームに戻ってください。',
  routeErrorSaved: '保存済みの編成と進行状況は、このブラウザーに残っています。',
  routeErrorReload: '再読み込み',
  routeErrorHome: 'ホームへ戻る',
  progressImportFailed: '対応していないバックアップです。4種類の進行状況を含むRanHQバージョン1の書き出しデータを使用してください。保存済みの進行状況は変更されていません。',
  progressStorageFailed: '進行状況を保存できませんでした。現在の進行状況は変更されていません。ブラウザーの保存設定を確認して、もう一度お試しください。',
  progressImportSummary: 'CW6カード{{cw6}}枚、バフカード{{scene}}枚、バフ獲得元{{buffs}}件で進行状況を置き換えました。以前の進行状況に戻せます。',
  restoreProgress: '以前の進行状況に戻す',
  restoreProgressConfirm: '前回の読み込み前に保存した進行状況に戻しますか？現在の進行状況は次の復元用データとして保存されます。',
})
Object.assign(ar, {
  routeErrorTitle: 'تعذر تحميل هذه الصفحة',
  routeErrorOffline: 'يبدو أنك غير متصل بالإنترنت',
  routeErrorNetwork: 'تعذر تنزيل ملف تحتاجه الصفحة. تحقق من اتصالك، ثم أعد تحميل الصفحة للمحاولة مجددًا.',
  routeErrorRender: 'حدث خطأ غير متوقع أثناء عرض الصفحة. يمكنك إعادة تحميلها أو العودة إلى الرئيسية.',
  routeErrorSaved: 'لا تزال فرقك وتقدمك المحفوظان موجودين في هذا المتصفح.',
  routeErrorReload: 'إعادة تحميل الصفحة',
  routeErrorHome: 'العودة إلى الرئيسية',
  progressImportFailed: 'صيغة النسخة الاحتياطية غير مدعومة. استخدم نسخة مصدّرة من RanHQ بالإصدار 1 تتضمن مجموعات التقدم الأربع. لم يتغير تقدمك المحفوظ.',
  progressStorageFailed: 'تعذر حفظ التقدم. لم يتغير تقدمك الحالي. تحقق من إعدادات التخزين في المتصفح وحاول مرة أخرى.',
  progressImportSummary: 'استُبدل التقدم بـ {{cw6}} من بطاقات CW6 و{{scene}} من بطاقات التعزيز و{{buffs}} من مصادر التعزيز. يمكنك استعادة التقدم السابق.',
  restoreProgress: 'استعادة التقدم السابق',
  restoreProgressConfirm: 'هل تريد استعادة التقدم المحفوظ قبل آخر استيراد؟ سيُحفظ تقدمك الحالي كنسخة الاستعادة التالية.',
})
Object.assign(fr, {
  routeErrorTitle: 'Impossible de charger cette page',
  routeErrorOffline: 'Vous semblez être hors ligne',
  routeErrorNetwork: 'Un fichier nécessaire à la page n’a pas pu être téléchargé. Vérifiez votre connexion, puis rechargez la page.',
  routeErrorRender: 'Une erreur inattendue a interrompu l’affichage de cette page. Vous pouvez la recharger ou revenir à l’accueil.',
  routeErrorSaved: 'Vos équipes et votre progression enregistrées sont toujours présentes dans ce navigateur.',
  routeErrorReload: 'Recharger la page',
  routeErrorHome: 'Retour à l’accueil',
  progressImportFailed: 'Format de sauvegarde non pris en charge. Utilisez une sauvegarde RanHQ de version 1 contenant les quatre groupes de progression. Votre progression enregistrée n’a pas changé.',
  progressStorageFailed: 'Impossible d’enregistrer la progression. Votre progression actuelle n’a pas changé. Vérifiez le stockage du navigateur et réessayez.',
  progressImportSummary: 'Progression remplacée par {{cw6}} cartes CW6, {{scene}} cartes de bonus et {{buffs}} sources de bonus. Vous pouvez restaurer la progression précédente.',
  restoreProgress: 'Restaurer la progression précédente',
  restoreProgressConfirm: 'Remplacer la progression actuelle par celle enregistrée avant le dernier import ? Votre progression actuelle sera conservée pour la prochaine restauration.',
})

Object.assign(en.teamCost, {
  skillCompleted: '{{name}}: Skill {{number}} completed',
  removeGeneral: 'Remove {{name}}',
  changeGeneral: 'Change {{name}}',
})
Object.assign(ja.teamCost, {
  skillCompleted: '{{name}}：技能{{number}}解放済み',
  removeGeneral: '{{name}}を外す',
  changeGeneral: '{{name}}を変更',
})
Object.assign(ar.teamCost, {
  skillCompleted: '{{name}}: اكتملت المهارة {{number}}',
  removeGeneral: 'إزالة {{name}}',
  changeGeneral: 'تغيير {{name}}',
})
Object.assign(fr.teamCost, {
  skillCompleted: '{{name}} : compétence {{number}} débloquée',
  removeGeneral: 'Retirer {{name}}',
  changeGeneral: 'Changer {{name}}',
})

en.skipToContent = 'Skip to main content'
ja.skipToContent = '本文へ移動'
ar.skipToContent = 'انتقل إلى المحتوى الرئيسي'
fr.skipToContent = 'Aller au contenu principal'

en.buffs.summaryConditions = 'Side conditions are applied. HP and other battle conditions remain potential effects; they are not simulated.'
ja.buffs.summaryConditions = '攻撃側・守備側の条件を反映しています。HPなどの戦闘中の条件は再現せず、発動し得る効果を含みます。'
ar.buffs.summaryConditions = 'تُطبَّق شروط الهجوم والدفاع. تُعرض التأثيرات المشروطة بنقاط الصحة أو بحالة المعركة كتأثيرات محتملة، دون محاكاة تحقق شروطها.'
fr.buffs.summaryConditions = 'Les conditions d’attaque et de défense sont prises en compte. Les conditions de PV et de combat ne sont pas simulées : leurs effets restent potentiels.'

export const CATALOGS = { en, ja, ar, fr }
const resources = { en: { common: en }, ja: { common: ja }, ar: { common: ar }, fr: { common: fr } }
const supportedLngs = LOCALES.map((locale) => locale.code)
let initialized = false

export function initI18n(locale) {
  const code = locale?.code || DEFAULT_LOCALE.code
  if (initialized) {
    if (i18n.language !== code) i18n.changeLanguage(code)
    return i18n
  }
  initialized = true
  i18n.use(initReactI18next).init({ resources, lng: code, fallbackLng: DEFAULT_LOCALE.code, supportedLngs, defaultNS: 'common', ns: ['common'], load: 'currentOnly', initImmediate: false, interpolation: { escapeValue: false }, react: { useSuspense: false } })
  return i18n
}

export default i18n
export { i18n }
