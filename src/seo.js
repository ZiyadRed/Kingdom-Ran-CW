const SITE_URL = 'https://ranhq.vercel.app'
const SITE_NAME = 'RanHQ'
const DEFAULT_IMAGE = `${SITE_URL}/ranhq-og.jpg`

function upsertMeta(selector, attrs){
  let el = document.head.querySelector(selector)
  if(!el){
    el = document.createElement('meta')
    document.head.appendChild(el)
  }
  Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,value))
}

function upsertLink(rel, href){
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if(!el){
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export function canonicalPath(pathname){
  if(!pathname || pathname === '/') return '/'
  const clean = pathname.split('?')[0].split('#')[0].replace(/\/+$/,'')
  if(clean.startsWith('/archive/') && !clean.startsWith('/archive/characters/') && clean !== '/archive/cw6-scene-cards'){
    return `/archive/characters/${clean.split('/').filter(Boolean).pop()}`
  }
  return clean || '/'
}

export function absoluteUrl(pathname){
  const path = canonicalPath(pathname)
  return `${SITE_URL}${path === '/' ? '/' : path}`
}

export function routeSeo(pathname){
  const path = canonicalPath(pathname)
  const base = {
    title: 'RanHQ - Kingdom Ran Castle War Companion',
    description: 'RanHQ is a fan-made English companion for Kingdom Ran, キングダム乱, キンラン, and 同盟争覇戦: browse general skills, build parties, compare buffs, and plan Castle War teams.',
    robots: 'index,follow',
  }
  if(path === '/') return base
  if(path === '/archive') return {
    title: 'Kingdom Ran Character Archive - RanHQ',
    description: 'Browse Kingdom Ran and キングダム乱 general profiles, Japanese names, Souha skills, Castle War buffs, and translated character references.',
    robots: 'index,follow',
  }
  if(path === '/archive/characters') return {
    title: 'Kingdom Ran Generals - Archive - RanHQ',
    description: 'Search Kingdom Ran generals by English and Japanese names, compare skills, factions, unit types, and Castle War utility.',
    robots: 'index,follow',
  }
  if(path === '/archive/cw6-scene-cards') return {
    title: 'CW6 Star Scene Cards - Archive - RanHQ',
    description: 'Reference 6-star Castle War scene-card skills, owners, Japanese skill names, and translated effects for Kingdom Ran.',
    robots: 'index,follow',
  }
  if(path.startsWith('/archive/characters/')) return {
    title: 'Kingdom Ran General - Archive - RanHQ',
    description: 'Kingdom Ran general profile with Japanese name, translated skills, Castle War effects, faction, and unit information.',
    robots: 'index,follow',
  }
  if(path.startsWith('/guide')) return {
    title: 'Kingdom Ran Castle War Guide - RanHQ',
    description: 'Kingdom Ran Castle War and 同盟争覇戦 guide covering roles, stats, buffs, debuffs, terrain, targeting, and unit matchups.',
    robots: 'index,follow',
  }
  if(path === '/builder') return {
    title: 'Kingdom Ran Party Builder - RanHQ',
    description: 'Build Kingdom Ran Castle War attack and defense parties, adjust unlocked skills, and plan Souha battle teams.',
    robots: 'index,follow',
  }
  if(path === '/buffs') return {
    title: 'Kingdom Ran Castle War Buffs - RanHQ',
    description: 'Compare Kingdom Ran Castle War buffs by stat, source, unit type, target condition, and skill effect.',
    robots: 'index,follow',
  }
  if(path === '/tiers') return {
    title: 'Kingdom Ran Tier List and Meta Teams - RanHQ',
    description: 'Kingdom Ran Castle War tier list and meta team references for attack, defense, buffs, counters, and current formations.',
    robots: 'index,follow',
  }
  if(path === '/cost') return {
    title: 'Kingdom Ran Team Cost Calculator - RanHQ',
    description: 'Calculate red crystal and character cost planning for Kingdom Ran teams, unlocks, and Castle War preparation.',
    robots: 'index,follow',
  }
  if(path === '/sim') return {
    title: 'Battle Order - RanHQ',
    description: 'Temporary battle order view for a RanHQ party builder setup.',
    robots: 'noindex,follow',
  }
  return base
}

export function setSeo({title, description, pathname, robots='index,follow'}){
  const url = absoluteUrl(pathname || window.location.pathname)
  document.title = title
  upsertLink('canonical', url)
  upsertMeta('meta[name="description"]', { name: 'description', content: description })
  upsertMeta('meta[name="robots"]', { name: 'robots', content: robots })
  upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME })
  upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title })
  upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description })
  upsertMeta('meta[property="og:url"]', { property: 'og:url', content: url })
  upsertMeta('meta[property="og:image"]', { property: 'og:image', content: DEFAULT_IMAGE })
  upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title })
  upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description })
  upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: DEFAULT_IMAGE })
}
