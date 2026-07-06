const CONDITION_START_RE = /^(?:when|while|upon|from|per|own|enemy|ally|other|surviving|alive|poisoned|burned|feared|confused|paralysed|random|the|first|last|gate|%|vs\b|cw\b|\d+\s+enemy)/i
const AND_SPLIT_RE = /\s+and\s+(?=(?:own|enemy|ally|surviving|per|from|when|while)\b)/i

export function splitConditionParts(condition){
  const text=String(condition||'').trim()
  if(!text) return []
  const parts=[]
  let start=0

  for(let i=0;i<text.length;i+=1){
    if(text[i]!==',') continue
    const next=text.slice(i+1).trim()
    if(!CONDITION_START_RE.test(next)) continue
    pushExpanded(parts,text.slice(start,i))
    start=i+1
  }

  pushExpanded(parts,text.slice(start))
  return parts
}

export function classifyConditionParts(condition){
  return splitConditionParts(condition).map(part=>classifyConditionPart(part))
}

export function classifyConditionPart(part){
  const text=String(part||'').trim()
  const lower=text.toLowerCase()
  const result={kind:'requires',label:'Requires',text}

  if(!text) return result
  if(/^when passing(?: through)?\b/i.test(text)) return chip('route','Route',text)
  if(/^cw battle\b/i.test(text)) return chip('mode','Mode',text)
  if(/^when (?:attacking|garrisoning|repairing)\b/i.test(text)) return chip('when','When',stripLeadingWord(text,'when'))
  if(isScaling(lower)) return chip('scales','Scales',text)
  if(isAfter(lower)) return chip('after','After',text)
  if(/^damage dealt by\b/i.test(text)) return chip('source','Source',text)
  if(/^vs\b/i.test(text)) return chip('versus','Vs',text)
  if(isTargetSelector(lower)) return chip('target','Target',text)
  if(isState(lower)) return chip('state','State',text)
  if(isScope(lower)) return chip('scope','Scope',text)
  return result
}

function pushExpanded(parts,rawPart){
  const part=String(rawPart||'').trim()
  if(!part) return
  part.split(AND_SPLIT_RE).map(s=>s.trim()).filter(Boolean).forEach(s=>parts.push(s))
}

function chip(kind,label,text){
  return {kind,label,text}
}

function stripLeadingWord(text,word){
  return String(text||'').replace(new RegExp(`^${word}\\s+`,'i'),'').trim()
}

function isScaling(lower){
  return (
    /^per\b/.test(lower) ||
    /\bper turn elapsed\b/.test(lower) ||
    /\bper allied attack count\b/.test(lower) ||
    /\bper own attack count\b/.test(lower) ||
    /\bper ally\b/.test(lower) ||
    /\bper other ally\b/.test(lower) ||
    /\bper enemy\b/.test(lower) ||
    /\bper defeated\b/.test(lower) ||
    /\bscales\)?$/.test(lower) ||
    /^(?:the )?(?:higher|lower) own remaining hp\b/.test(lower)
  )
}

function isAfter(lower){
  return (
    /^from\b/.test(lower) ||
    /^upon\b/.test(lower) ||
    /\bfrom damage\b/.test(lower) ||
    /\bdamage triggered\b/.test(lower) ||
    /\bdamage activation\b/.test(lower)
  )
}

function isTargetSelector(lower){
  return (
    lower==='random' ||
    /\bwith (?:highest|lowest)\b/.test(lower) ||
    /\bearliest in formation\b/.test(lower) ||
    /\b(?:first|last) in formation\b/.test(lower) ||
    /\blowest (?:attack power|defense|remaining strength)\b/.test(lower) ||
    /^all .*enemy\b/.test(lower) ||
    /^\d+\s+enemy\b/.test(lower)
  )
}

function isState(lower){
  return (
    lower==='alive' ||
    lower==='surviving' ||
    lower==='while alive' ||
    /^while\b/.test(lower)
  )
}

function isScope(lower){
  return (
    lower==='other allies' ||
    /^other ally(?: \[[^\]]+\]|\s+\[[^\]]+\])*$/.test(lower) ||
    /^ally \[[^\]]+\]$/.test(lower)
  )
}
