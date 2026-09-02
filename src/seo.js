export const SITE_URL = 'https://ranhq.vercel.app'
export const SITE_NAME = 'RanHQ'
export const DEFAULT_IMAGE = `${SITE_URL}/ranhq-og.jpg`
export const SEO_LOCALE_CODES = ['en', 'ja', 'ar']

const OG_LOCALES = { en: 'en_US', ja: 'ja_JP', ar: 'ar_EG' }
const DIRECTIONS = { en: 'ltr', ja: 'ltr', ar: 'rtl' }

const BASE_ROUTE_SEO = {
  en: {
    '/': {
      title: 'RanHQ — Kingdom Ran Castle War Guide & Database',
      description: 'RanHQ is a fan-made Kingdom Ran companion with a searchable general and skill database, Castle War guides, team building, buffs, and planning tools.',
      pageType: 'WebPage',
    },
    '/archive': {
      title: 'Kingdom Ran Archive: Generals & CW6 Cards | RanHQ',
      description: 'Explore the RanHQ Kingdom Ran archive for generals, Japanese names, translated Castle War skills, factions, and CW6 scene cards.',
      pageType: 'CollectionPage',
    },
    '/archive/characters': {
      title: 'Kingdom Ran General & Skill Database | RanHQ',
      description: 'Search Kingdom Ran generals by English, Japanese, or Arabic name and compare their factions, unit types, and translated Castle War skills.',
      pageType: 'CollectionPage',
    },
    '/archive/cw6-scene-cards': {
      title: 'Kingdom Ran CW6 Scene Cards & Skills | RanHQ',
      description: 'Browse Kingdom Ran CW6 scene cards with their owners, Japanese skill names, translated effects, and factual Castle War data.',
      pageType: 'CollectionPage',
    },
    '/guide': {
      title: 'Kingdom Ran Castle War Guide | RanHQ',
      description: 'A factual Kingdom Ran Castle War guide covering roles, stats, buffs, debuffs, terrain, targeting, status effects, and unit matchups.',
      pageType: 'WebPage',
    },
    '/builder': {
      title: 'Kingdom Ran Castle War Party Builder | RanHQ',
      description: 'Build Kingdom Ran Castle War attack and defense parties, adjust unlocked skills, and review team buffs and activation order.',
      pageType: 'WebPage',
    },
    '/castle-points': {
      title: 'Kingdom Ran Castle Points Calculator | RanHQ',
      description: 'Calculate Kingdom Ran Castle War alliance points from large, medium, and small castles, then compare projected rankings.',
      pageType: 'WebPage',
    },
    '/buffs': {
      title: 'Kingdom Ran Castle War Buff Tracker | RanHQ',
      description: 'Track factual Kingdom Ran Castle War buffs by stat, source, unit type, target condition, terrain, and scene card.',
      pageType: 'WebPage',
    },
    '/tiers': {
      title: 'Kingdom Ran Castle War Tier List & Meta Teams | RanHQ',
      description: 'Review RanHQ Kingdom Ran Castle War tier references and current meta team formations for attack, defense, buffs, and counters.',
      pageType: 'WebPage',
    },
    '/cost': {
      title: 'Kingdom Ran Team Cost Calculator | RanHQ',
      description: 'Calculate red crystal costs for Kingdom Ran generals and plan the skill unlock resources needed for a four-general team.',
      pageType: 'WebPage',
    },
    '/cw-stats': {
      title: 'Kingdom Ran Castle War Stats Calculator | RanHQ',
      description: 'Calculate Kingdom Ran Castle War power from current screen values, active buffs, added buffs, and scene card base stats.',
      pageType: 'WebPage',
    },
    '/sim': {
      title: 'Kingdom Ran Battle Order | RanHQ',
      description: 'Review the skill activation order for attacking and defending teams saved in the RanHQ Party Builder.',
      pageType: 'WebPage',
      robots: 'noindex,follow',
    },
  },
  ja: {
    '/': {
      title: 'キングダム乱（キンラン）同盟争覇戦攻略・武将データ | RanHQ',
      description: 'キングダム乱（キンラン）の武将・争覇スキル検索、同盟争覇戦攻略、編成作成、バフ確認、各種計算ができる非公式攻略サイトです。',
      pageType: 'WebPage',
    },
    '/archive': {
      title: 'キングダム乱 武将・争覇カードアーカイブ | RanHQ',
      description: 'キングダム乱の武将名、争覇スキル、勢力、兵種、CW6★争覇カードを確認できる日本語アーカイブです。',
      pageType: 'CollectionPage',
    },
    '/archive/characters': {
      title: 'キングダム乱 武将・争覇スキル一覧 | RanHQ',
      description: 'キングダム乱の武将を日本語名・読み・ローマ字名で検索し、勢力、兵種、同盟争覇戦の技能（スキル）と効果を確認できます。',
      pageType: 'CollectionPage',
    },
    '/archive/cw6-scene-cards': {
      title: 'キングダム乱 CW6★争覇カード・技能一覧 | RanHQ',
      description: 'キングダム乱のCW6★争覇カードを所持武将、日本語技能名、原文、効果とともに確認できます。',
      pageType: 'CollectionPage',
    },
    '/guide': {
      title: 'キングダム乱 同盟争覇戦攻略ガイド | RanHQ',
      description: 'キングダム乱の同盟争覇戦について、役割、ステータス、バフ、デバフ、地形、対象選択、兵種相性を確認できます。',
      pageType: 'WebPage',
    },
    '/builder': {
      title: 'キングダム乱 同盟争覇戦 編成作成 | RanHQ',
      description: 'キングダム乱の同盟争覇戦で使う攻撃・防御編成を作成し、解放技能、編成バフ、発動順を確認できます。',
      pageType: 'WebPage',
    },
    '/castle-points': {
      title: 'キングダム乱 城ポイント計算 | RanHQ',
      description: '大城・中城・小城の数から同盟争覇戦の獲得ポイントと予測順位を計算できます。',
      pageType: 'WebPage',
    },
    '/buffs': {
      title: 'キングダム乱 同盟争覇戦バフ一覧・管理 | RanHQ',
      description: 'キングダム乱の同盟争覇戦バフを能力、出典、兵種、対象、地形、争覇カードごとに確認・管理できます。',
      pageType: 'WebPage',
    },
    '/tiers': {
      title: 'キングダム乱 同盟争覇戦 Tier List・環境編成 | RanHQ',
      description: 'キングダム乱の同盟争覇戦Tier Listと現在の攻撃・防御の環境編成を確認できます。',
      pageType: 'WebPage',
    },
    '/cost': {
      title: 'キングダム乱 編成コスト・赤水晶計算 | RanHQ',
      description: 'キングダム乱の武将技能解放に必要な赤水晶を計算し、4武将の育成コストを確認できます。',
      pageType: 'WebPage',
    },
    '/cw-stats': {
      title: 'キングダム乱 同盟争覇戦ステータス計算 | RanHQ',
      description: '争覇画面の数値、有効なバフ、追加バフ、争覇カード基礎値から武将と編成の戦力を計算できます。',
      pageType: 'WebPage',
    },
    '/sim': {
      title: 'キングダム乱 同盟争覇戦の技能発動順 | RanHQ',
      description: '編成作成で保存した攻撃・防御編成の同盟争覇戦技能の発動順を確認できます。',
      pageType: 'WebPage',
      robots: 'noindex,follow',
    },
  },
  ar: {
    '/': {
      title: 'RanHQ — دليل Kingdom Ran وقاعدة بيانات حرب القلاع',
      description: 'موقع عربي غير رسمي للبحث عن جنرالات Kingdom Ran ومهاراتهم وبناء التشكيلات ومراجعة تعزيزات وأدلة حرب القلاع.',
      pageType: 'WebPage',
    },
    '/archive': {
      title: 'أرشيف جنرالات وبطاقات Kingdom Ran | RanHQ',
      description: 'تصفّح جنرالات Kingdom Ran وأسماءهم ومهاراتهم وفصائلهم وبطاقات CW6 في أرشيف عربي واضح.',
      pageType: 'CollectionPage',
    },
    '/archive/characters': {
      title: 'قاعدة بيانات جنرالات ومهارات Kingdom Ran | RanHQ',
      description: 'ابحث عن جنرالات Kingdom Ran بالعربية أو اليابانية أو الرومانية وقارن الفصيل ونوع الوحدة ومهارات حرب القلاع.',
      pageType: 'CollectionPage',
    },
    '/archive/cw6-scene-cards': {
      title: 'بطاقات ومهارات CW6 في Kingdom Ran | RanHQ',
      description: 'راجع بطاقات CW6 ومالكيها وأسماء المهارات اليابانية وتأثيراتها المترجمة في Kingdom Ran.',
      pageType: 'CollectionPage',
    },
    '/guide': {
      title: 'دليل حرب القلاع في Kingdom Ran | RanHQ',
      description: 'دليل عربي لأدوار وإحصاءات وتعزيزات وإضعافات وتضاريس واستهداف ومواجهات حرب القلاع في Kingdom Ran.',
      pageType: 'WebPage',
    },
    '/builder': {
      title: 'منشئ تشكيلات حرب القلاع في Kingdom Ran | RanHQ',
      description: 'أنشئ تشكيلات الهجوم والدفاع في حرب القلاع وراجع المهارات المفتوحة وتعزيزات الفريق وترتيب الإطلاق.',
      pageType: 'WebPage',
    },
    '/castle-points': {
      title: 'حاسبة نقاط القلاع في Kingdom Ran | RanHQ',
      description: 'احسب نقاط التحالف والترتيب المتوقع من أعداد القلاع الكبيرة والمتوسطة والصغيرة.',
      pageType: 'WebPage',
    },
    '/buffs': {
      title: 'متتبّع تعزيزات حرب القلاع في Kingdom Ran | RanHQ',
      description: 'راجع تعزيزات حرب القلاع حسب الإحصاء والمصدر ونوع الوحدة والهدف والتضاريس وبطاقات المشهد.',
      pageType: 'WebPage',
    },
    '/tiers': {
      title: 'قائمة مستويات وتشكيلات Kingdom Ran | RanHQ',
      description: 'راجع قائمة مستويات حرب القلاع وتشكيلات الهجوم والدفاع الشائعة حاليًا في Kingdom Ran.',
      pageType: 'WebPage',
    },
    '/cost': {
      title: 'حاسبة تكلفة فريق Kingdom Ran | RanHQ',
      description: 'احسب الكرستالات الحمراء اللازمة لفتح مهارات ما يصل إلى أربعة جنرالات في Kingdom Ran.',
      pageType: 'WebPage',
    },
    '/cw-stats': {
      title: 'حاسبة إحصاءات حرب القلاع في Kingdom Ran | RanHQ',
      description: 'احسب قوة الجنرال والفريق من قيم شاشة CW والتعزيزات الفعالة والمضافة وقيم بطاقات المشهد.',
      pageType: 'WebPage',
    },
    '/sim': {
      title: 'ترتيب إطلاق مهارات Kingdom Ran | RanHQ',
      description: 'راجع ترتيب إطلاق المهارات لتشكيلتي الهجوم والدفاع المحفوظتين في منشئ الفرق.',
      pageType: 'WebPage',
      robots: 'noindex,follow',
    },
  },
}

const GUIDE_LABELS = {
  en: {
    basics: 'Castle War Basics',
    'stats-screen': 'Castle War Stats Screen',
    stats: 'How to Raise Castle War Stats',
    roles: 'General Roles',
    bandits: 'Bandit Hunt',
    leaders: 'Leader & Strategist Skills',
    crystals: 'Crystal Types',
    debuffs: 'Debuff Resistance',
    effects: 'Status Effects',
    matchups: 'Unit Matchups',
    terrain: 'Terrain Effects',
    types: 'Skill Types',
    interactions: 'Effect Interactions',
    targeting: 'Targeting Rules',
  },
  ja: {
    basics: '同盟争覇戦の基本',
    'stats-screen': '争覇ステータス画面',
    stats: '争覇ステータスの上げ方',
    roles: '武将の役割',
    bandits: '盗賊討伐',
    leaders: '総大将・軍師技能',
    crystals: '結晶タイプ',
    debuffs: 'デバフ耐性',
    effects: '状態異常',
    matchups: '兵種相性',
    terrain: '地形効果',
    types: '技能タイプ',
    interactions: '効果の相互作用',
    targeting: '対象選択ルール',
  },
  ar: {
    basics: 'أساسيات حرب القلاع',
    'stats-screen': 'شاشة خصائص CW',
    stats: 'رفع خصائص حرب القلاع',
    roles: 'أدوار الجنرالات',
    bandits: 'مطاردة قطاع الطرق',
    leaders: 'مهارات القائد والاستراتيجي',
    crystals: 'أنواع الكرستالات',
    debuffs: 'مقاومة الإضعاف',
    effects: 'الحالات',
    matchups: 'مواجهات الوحدات',
    terrain: 'تأثيرات التضاريس',
    types: 'أنواع المهارات',
    interactions: 'تداخلات التأثيرات',
    targeting: 'قواعد الاستهداف',
  },
}

function localeCode(locale) {
  const code = typeof locale === 'string' ? locale : locale?.code
  return SEO_LOCALE_CODES.includes(code) ? code : 'en'
}

export function canonicalPath(pathname) {
  if (!pathname || pathname === '/') return '/'
  let clean = String(pathname).split('?')[0].split('#')[0].replace(/\/+$/, '') || '/'
  clean = clean.replace(/^\/(?:ja|ar)(?=\/|$)/, '') || '/'
  const segments = clean.split('/').filter(Boolean)
  if (
    segments.length === 2
    && segments[0] === 'archive'
    && !['characters', 'cw6-scene-cards'].includes(segments[1])
  ) {
    return `/archive/characters/${segments[1]}`
  }
  return clean
}

export function absoluteUrl(pathname, locale = 'en') {
  const code = localeCode(locale)
  const path = canonicalPath(pathname)
  const prefix = code === 'en' ? '' : `/${code}`
  if (path === '/') return `${SITE_URL}${prefix || '/'}`
  return `${SITE_URL}${prefix}${path}`
}

export function alternateUrls(pathname) {
  const path = canonicalPath(pathname)
  return {
    en: absoluteUrl(path, 'en'),
    ja: absoluteUrl(path, 'ja'),
    ar: absoluteUrl(path, 'ar'),
    'x-default': absoluteUrl(path, 'en'),
  }
}

function guideSectionSeo(path, code) {
  const section = path.split('/').filter(Boolean)[1]
  const label = GUIDE_LABELS[code]?.[section]
  if (!label) return null
  if (code === 'ja') return {
    title: `${label}｜キングダム乱 同盟争覇戦攻略 | RanHQ`,
    description: `キングダム乱の同盟争覇戦「${label}」について、RanHQの画面資料と攻略情報で確認できます。`,
    pageType: 'WebPage',
    breadcrumbs: [
      { name: 'ホーム', path: '/' },
      { name: '同盟争覇戦攻略', path: '/guide' },
      { name: label, path },
    ],
  }
  if (code === 'ar') return {
    title: `${label} — دليل حرب القلاع | RanHQ`,
    description: `راجع ${label} في حرب القلاع في Kingdom Ran من خلال شرح وبيانات RanHQ الظاهرة في الصفحة.`,
    pageType: 'WebPage',
    breadcrumbs: [
      { name: 'الرئيسية', path: '/' },
      { name: 'دليل حرب القلاع', path: '/guide' },
      { name: label, path },
    ],
  }
  return {
    title: `${label} — Kingdom Ran Castle War Guide | RanHQ`,
    description: `Learn ${label.toLowerCase()} with the visible mechanics, examples, and factual Kingdom Ran Castle War references on RanHQ.`,
    pageType: 'WebPage',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Castle War Guide', path: '/guide' },
      { name: label, path },
    ],
  }
}

function absoluteAsset(asset) {
  if (!asset) return null
  if (/^https?:\/\//i.test(asset)) return asset
  return `${SITE_URL}${asset.startsWith('/') ? asset : `/${asset}`}`
}

function structuredDataFor(seo) {
  const websiteId = `${SITE_URL}/#website`
  const gameId = `${SITE_URL}/#game`
  const graph = [
    {
      '@type': 'WebSite',
      '@id': websiteId,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      alternateName: ['Kingdom Ran Castle War Companion', 'キングダム乱', 'キンラン'],
      inLanguage: SEO_LOCALE_CODES,
    },
    {
      '@type': 'VideoGame',
      '@id': gameId,
      name: 'Kingdom Ran',
      alternateName: ['キングダム乱', 'キングダム 乱 -天下統一への道-', 'キンラン'],
    },
    {
      '@type': seo.pageType || 'WebPage',
      '@id': `${seo.url}#webpage`,
      url: seo.url,
      name: seo.title,
      description: seo.description,
      inLanguage: seo.locale,
      isPartOf: { '@id': websiteId },
      about: { '@id': gameId },
      ...(seo.mainEntity ? { mainEntity: seo.mainEntity } : {}),
    },
  ]
  if (seo.breadcrumbs?.length >= 2) {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${seo.url}#breadcrumb`,
      itemListElement: seo.breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: absoluteUrl(crumb.path, seo.locale),
      })),
    })
  }
  return { '@context': 'https://schema.org', '@graph': graph }
}

function finalizeSeo(meta, pathname, locale = 'en') {
  const code = localeCode(locale)
  const canonical = canonicalPath(meta.canonicalPath || pathname)
  const seo = {
    ...meta,
    locale: code,
    pathname,
    canonicalPath: canonical,
    url: absoluteUrl(canonical, code),
    alternates: alternateUrls(canonical),
    image: meta.image || DEFAULT_IMAGE,
    imageAlt: meta.imageAlt || `${SITE_NAME} — Kingdom Ran Castle War companion`,
    robots: meta.robots || 'index,follow,max-image-preview:large',
  }
  return { ...seo, structuredData: structuredDataFor(seo) }
}

export function routeSeo(pathname, locale = 'en') {
  const code = localeCode(locale)
  const path = canonicalPath(pathname)
  const guideMeta = path.startsWith('/guide/') ? guideSectionSeo(path, code) : null
  const staticMeta = guideMeta || BASE_ROUTE_SEO[code]?.[path]
  if (staticMeta) return finalizeSeo(staticMeta, path, code)

  if (path.startsWith('/archive/characters/')) {
    return finalizeSeo({
      title: code === 'ja'
        ? 'キングダム乱 武将データ | RanHQ'
        : code === 'ar'
          ? 'بيانات جنرال Kingdom Ran | RanHQ'
          : 'Kingdom Ran General Data | RanHQ',
      description: BASE_ROUTE_SEO[code]['/archive/characters'].description,
      pageType: 'WebPage',
    }, path, code)
  }

  return finalizeSeo({
    title: code === 'ja' ? 'ページが見つかりません | RanHQ' : code === 'ar' ? 'الصفحة غير موجودة | RanHQ' : 'Page Not Found | RanHQ',
    description: code === 'ja' ? '指定されたRanHQのページは見つかりませんでした。' : code === 'ar' ? 'تعذر العثور على صفحة RanHQ المطلوبة.' : 'The requested RanHQ page could not be found.',
    pageType: 'WebPage',
    robots: 'noindex,follow',
  }, path, code)
}

export function characterSeo(character, options = {}) {
  const code = localeCode(options.locale)
  const localizedName = options.displayName || (code === 'ja' ? character?.name_jp : character?.name_en) || 'Unknown'
  const englishName = character?.name_en || localizedName
  const japaneseName = character?.name_jp || ''
  const reading = options.reading || character?.sourceReading || ''
  const faction = options.factionName || ''
  const skills = [...(character?.skills || []), ...(character?.roleSkill ? [character.roleSkill] : [])]
  const japaneseSkills = skills.map((skill) => skill?.name_jp).filter(Boolean)
  const englishSkills = skills.map((skill) => skill?.name_en).filter(Boolean)
  const skillCount = skills.length
  const path = `/archive/characters/${character.id}`

  let title
  let description
  let breadcrumbs
  if (code === 'ja') {
    const identity = reading ? `${localizedName}（${reading}）` : localizedName
    const example = japaneseSkills.length ? `${japaneseSkills.slice(0, 2).join('、')}など` : ''
    title = `${identity}｜同盟争覇戦の技能・武将データ｜キングダム乱 | RanHQ`
    description = `${identity}${englishName !== localizedName ? `／${englishName}` : ''}のキングダム乱・同盟争覇戦データ。${example}${skillCount}技能の原文・効果${faction ? `、${faction}` : ''}を確認できます。`
    breadcrumbs = [
      { name: 'ホーム', path: '/' },
      { name: 'アーカイブ', path: '/archive' },
      { name: '武将一覧', path: '/archive/characters' },
      { name: localizedName, path },
    ]
  } else if (code === 'ar') {
    const example = englishSkills.length ? `، ومنها ${englishSkills.slice(0, 2).join(' و')}` : ''
    const secondaryNames = [englishName !== localizedName ? englishName : '', japaneseName].filter(Boolean)
    const identity = secondaryNames.length ? `${localizedName} (${secondaryNames.join(' / ')})` : localizedName
    title = `${identity} — مهارات وبيانات الجنرال | Kingdom Ran | RanHQ`
    description = `ملف ${identity} في Kingdom Ran مع مهارات حرب القلاع وتأثيراتها${example}${faction ? ` وفصيل ${faction}` : ''}.`
    breadcrumbs = [
      { name: 'الرئيسية', path: '/' },
      { name: 'الأرشيف', path: '/archive' },
      { name: 'الجنرالات', path: '/archive/characters' },
      { name: localizedName, path },
    ]
  } else {
    const example = englishSkills.length ? `, including ${englishSkills.slice(0, 2).join(' and ')}` : ''
    title = `${englishName}${japaneseName ? ` (${japaneseName})` : ''} — Skills & General Data | Kingdom Ran | RanHQ`
    description = `${englishName}${japaneseName ? ` (${japaneseName})` : ''} profile for Kingdom Ran with ${skillCount} Castle War skills and factual effects${example}${faction ? `, plus ${faction} affiliation` : ''}.`
    breadcrumbs = [
      { name: 'Home', path: '/' },
      { name: 'Archive', path: '/archive' },
      { name: 'Generals', path: '/archive/characters' },
      { name: englishName, path },
    ]
  }

  const alternateNames = [...new Set([englishName, japaneseName, reading].filter(Boolean))]
  const mainEntity = {
    '@type': 'Thing',
    '@id': `${absoluteUrl(path, code)}#character`,
    name: localizedName,
    alternateName: alternateNames,
    description,
    ...(character?.image ? { image: absoluteAsset(character.image) } : {}),
  }
  return finalizeSeo({
    title,
    description,
    pageType: 'WebPage',
    breadcrumbs,
    mainEntity,
    imageAlt: `${localizedName} — Kingdom Ran`,
  }, path, code)
}

function upsertMeta(selector, attrs) {
  let element = document.head.querySelector(selector)
  if (!element) {
    element = document.createElement('meta')
    document.head.appendChild(element)
  }
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value))
}

function upsertLink(rel, href) {
  let element = document.head.querySelector(`link[rel="${rel}"]`)
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    document.head.appendChild(element)
  }
  element.setAttribute('href', href)
}

function updateStructuredData(value) {
  let element = document.head.querySelector('#ranhq-schema')
  if (!element) {
    element = document.createElement('script')
    element.id = 'ranhq-schema'
    element.type = 'application/ld+json'
    document.head.appendChild(element)
  }
  element.textContent = JSON.stringify(value).replaceAll('<', '\\u003c')
}

export function setSeo(input = {}) {
  const code = localeCode(input.locale)
  const pathname = input.pathname || window.location.pathname
  const fallback = routeSeo(pathname, code)
  const seo = input.url && input.alternates
    ? input
    : finalizeSeo({ ...fallback, ...input }, input.canonicalPath || pathname, code)

  document.documentElement.lang = code
  document.documentElement.dir = DIRECTIONS[code]
  document.title = seo.title
  document.head.querySelector('meta[name="keywords"]')?.remove()
  upsertLink('canonical', seo.url)
  document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((element) => element.remove())
  Object.entries(seo.alternates).forEach(([hreflang, href]) => {
    const element = document.createElement('link')
    element.rel = 'alternate'
    element.hreflang = hreflang
    element.href = href
    document.head.appendChild(element)
  })
  upsertMeta('meta[name="description"]', { name: 'description', content: seo.description })
  upsertMeta('meta[name="robots"]', { name: 'robots', content: seo.robots })
  upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' })
  upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME })
  upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: OG_LOCALES[code] })
  document.head.querySelectorAll('meta[property="og:locale:alternate"]').forEach((element) => element.remove())
  SEO_LOCALE_CODES.filter((other) => other !== code).forEach((other) => {
    const element = document.createElement('meta')
    element.setAttribute('property', 'og:locale:alternate')
    element.setAttribute('content', OG_LOCALES[other])
    document.head.appendChild(element)
  })
  upsertMeta('meta[property="og:title"]', { property: 'og:title', content: seo.title })
  upsertMeta('meta[property="og:description"]', { property: 'og:description', content: seo.description })
  upsertMeta('meta[property="og:url"]', { property: 'og:url', content: seo.url })
  upsertMeta('meta[property="og:image"]', { property: 'og:image', content: seo.image })
  upsertMeta('meta[property="og:image:alt"]', { property: 'og:image:alt', content: seo.imageAlt })
  upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' })
  upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: seo.title })
  upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: seo.description })
  upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: seo.image })
  upsertMeta('meta[name="twitter:image:alt"]', { name: 'twitter:image:alt', content: seo.imageAlt })
  updateStructuredData(seo.structuredData || structuredDataFor(seo))
}
