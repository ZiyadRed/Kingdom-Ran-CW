// Generates the 1200x630 link-preview (Open Graph / X card) images:
//   public/og/ranhq-{en,ja,ar,fr}.jpg      one localized site card per locale
//   public/og/characters/<id>.jpg          one card per general with card art
//
// Run manually after adding generals or changing artwork:
//   node scripts/gen_og_images.mjs
// Requires the Playwright Chromium used by the browser tests. Fonts load from
// Google Fonts unless RANHQ_OG_FONT_CSS points to a local @font-face stylesheet.
import { chromium } from '@playwright/test'
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { tmpdir } from 'node:os'

const root = resolve(import.meta.dirname, '..')
const publicDir = join(root, 'public')
const outDir = join(publicDir, 'og')
const charDir = join(outDir, 'characters')
mkdirSync(charDir, { recursive: true })

const json = path => JSON.parse(readFileSync(join(root, path), 'utf8'))
const characters = readdirSync(join(root, 'data/characters'))
  .filter(file => file.endsWith('.json'))
  .flatMap(file => {
    const data = json(`data/characters/${file}`)
    return Array.isArray(data) ? data : data.characters || []
  })
const jaNames = json('data/generated/ja/character_names.json').names || {}
const readings = json('data/generated/ja/character_readings.json').characters || {}

const FACTIONS = {
  qin: { jp: '秦', en: 'Qin', color: '#c0392b' },
  zhao: { jp: '趙', en: 'Zhao', color: '#3d6eb5' },
  chu: { jp: '楚', en: 'Chu', color: '#7d52a0' },
  wei: { jp: '魏', en: 'Wei', color: '#1a8a72' },
  yan: { jp: '燕', en: 'Yan', color: '#1a7a65' },
  ai: { jp: '毐', en: 'Ai', color: '#5d3d8a' },
  han: { jp: '韓', en: 'Han', color: '#9a7a10' },
  qi: { jp: '斉', en: 'Qi', color: '#a04020' },
  mountain_folk: { jp: '山の民', en: 'Mountain Folk', color: '#5a7a30' },
}

const SITE_CARDS = {
  en: { dir: 'ltr', kicker: 'Kingdom Ran', title: 'Castle War Guide & Database', lines: ['Generals & skills', 'Party Builder', 'Tier list', 'Guides'] },
  ja: { dir: 'ltr', kicker: 'キングダム乱（キンラン）', title: '同盟争覇戦攻略', lines: ['武将・争覇スキル', '編成作成', '環境編成ランキング', '攻略ガイド'] },
  ar: { dir: 'rtl', kicker: 'Kingdom Ran', title: 'دليل حرب القلاع', lines: ['الجنرالات والمهارات', 'منشئ الفرق', 'قائمة التصنيف', 'الأدلة'] },
  fr: { dir: 'ltr', kicker: 'Kingdom Ran', title: 'Guide de la Conquête d’Alliance', lines: ['Généraux et compétences', 'Créateur d’équipe', 'Tier list', 'Guides'] },
}

const fontCss = process.env.RANHQ_OG_FONT_CSS
  ? `<style>${readFileSync(process.env.RANHQ_OG_FONT_CSS, 'utf8')}</style>`
  : '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=Barlow:wght@600;700&family=Noto+Sans+JP:wght@700;900&family=Cairo:wght@700;900&display=block">'

const esc = value => String(value ?? '').replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char])
const fileUrl = path => pathToFileURL(path).href

const BASE_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1200px;height:630px;overflow:hidden;background:#06264c}
body{font-family:'Barlow','Noto Sans JP','Noto Sans CJK JP','Yu Gothic','Meiryo',sans-serif;color:#fff}
.jp{font-family:'Noto Sans JP','Noto Sans CJK JP','Yu Gothic','Meiryo',sans-serif}
.ar{font-family:'Cairo','Noto Sans Arabic',sans-serif}
.brand{font-family:'Oswald',sans-serif;font-weight:700;letter-spacing:.04em}
`

function siteHtml(code) {
  const card = SITE_CARDS[code]
  const textFont = code === 'ar' ? 'ar' : code === 'ja' ? 'jp' : ''
  const side = card.dir === 'rtl' ? 'right' : 'left'
  return `<!doctype html><html lang="${code}" dir="${card.dir}"><head><meta charset="utf-8">${fontCss}<style>${BASE_CSS}
.bg{position:absolute;inset:0;background:url('${fileUrl(join(publicDir, 'ranhq-og.jpg'))}') center/cover}
.shade{position:absolute;inset:0;background:linear-gradient(to top,rgba(6,38,76,.97) 0%,rgba(6,38,76,.88) 34%,rgba(6,38,76,.15) 66%,rgba(6,38,76,0) 100%)}
.content{position:absolute;${side}:64px;bottom:52px;width:1072px;text-align:${side}}
.top{display:flex;align-items:center;gap:14px;justify-content:flex-start;margin-bottom:10px}
.logo{font-size:30px;color:#EDBDA3}
.pill{font-size:22px;font-weight:700;color:#fff;background:rgba(224,127,72,.92);border-radius:999px;padding:4px 16px}
h1{font-size:${code === 'fr' ? 62 : 74}px;line-height:1.05;font-weight:900;text-shadow:0 3px 18px rgba(0,0,0,.55)}
.lines{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}
.lines span{font-size:24px;font-weight:700;color:#06264c;background:#EFE3D3;border-radius:8px;padding:6px 14px}
</style></head><body><div class="bg"></div><div class="shade"></div>
<div class="content ${textFont}"><div class="top"><span class="logo brand">RanHQ</span><span class="pill ${textFont}">${esc(card.kicker)}</span></div>
<h1 class="${textFont}">${esc(card.title)}</h1>
<div class="lines">${card.lines.map(line => `<span class="${textFont}">${esc(line)}</span>`).join('')}</div></div></body></html>`
}

function characterHtml(character) {
  const faction = FACTIONS[character.country] || { jp: '', en: '', color: '#e07f48' }
  const nameJp = jaNames[character.name_en] || character.name_jp || ''
  const reading = readings[character.id]
  const art = fileUrl(join(publicDir, character.image))
  const rarity = character.rarity ? `<span class="rar">${esc(character.rarity)}</span>` : ''
  const long = [...nameJp].length
  const nameSize = long <= 3 ? 150 : long <= 5 ? 116 : long <= 7 ? 88 : 70
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8">${fontCss}<style>${BASE_CSS}
body{background:radial-gradient(circle at 18% 20%,${faction.color}55 0,rgba(6,38,76,0) 55%),linear-gradient(135deg,#0a2f5c 0%,#06264c 55%,#041a36 100%)}
.stripe{position:absolute;left:0;top:0;bottom:0;width:14px;background:${faction.color}}
.art{position:absolute;right:0;top:0;height:630px;width:520px;background:url('${art}') center top/cover;
  -webkit-mask-image:linear-gradient(to right,transparent 0,#000 120px);mask-image:linear-gradient(to right,transparent 0,#000 120px)}
.content{position:absolute;left:72px;top:58px;bottom:54px;width:640px;display:flex;flex-direction:column}
.badges{display:flex;gap:12px;align-items:center}
.fac{font-size:28px;font-weight:900;background:${faction.color};border-radius:8px;padding:4px 16px}
.rar{font-family:'Oswald',sans-serif;font-size:28px;font-weight:700;color:#06264c;background:#d4a32c;border-radius:8px;padding:2px 14px}
.name{font-size:${nameSize}px;font-weight:900;line-height:1.08;margin-top:26px;text-shadow:0 4px 20px rgba(0,0,0,.45)}
.reading{font-size:32px;font-weight:700;color:#EDBDA3;margin-top:8px}
.romaji{font-family:'Oswald',sans-serif;font-size:40px;font-weight:600;color:#fff;opacity:.92;margin-top:6px;letter-spacing:.02em}
.foot{margin-top:auto;display:flex;align-items:flex-end;justify-content:space-between;gap:18px}
.desc{font-size:26px;font-weight:700;color:#EFE3D3}
.logo{font-size:40px;color:#EDBDA3}
</style></head><body><div class="stripe"></div><div class="art"></div>
<div class="content jp"><div class="badges"><span class="fac">${esc(faction.jp)}</span>${rarity}</div>
<div class="name">${esc(nameJp)}</div>
${reading ? `<div class="reading">${esc(reading)}</div>` : ''}
<div class="romaji">${esc(character.name_en)}</div>
<div class="foot"><div class="desc">キングダム乱・同盟争覇戦<br>スキル・武将データ</div><div class="logo brand">RanHQ</div></div></div></body></html>`
}

const work = join(tmpdir(), 'ranhq-og')
mkdirSync(work, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
async function render(html, output) {
  const file = join(work, 'card.html')
  writeFileSync(file, html)
  await page.goto(fileUrl(file))
  await page.evaluate(() => globalThis.document.fonts.ready)
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: output, type: 'jpeg', quality: 74 })
}

for (const code of Object.keys(SITE_CARDS)) await render(siteHtml(code), join(outDir, `ranhq-${code}.jpg`))
let count = 0
for (const character of characters) {
  if (!character.image || !existsSync(join(publicDir, character.image))) continue
  await render(characterHtml(character), join(charDir, `${character.id}.jpg`))
  count++
}
await browser.close()
console.log(`gen_og_images: wrote ${Object.keys(SITE_CARDS).length} site cards and ${count} character cards`)
