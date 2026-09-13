import {
  ALL,BUFF_APPLICABILITY,evaluateBuffApplicability,evaluateStableMechanicApplicability,
  isBuffSummarySkill,parseEnemyTargetCriteria,parseRosterCriterion,
  parseTargetMechanics,resolveBuilderMechanic,
} from './core.jsx'
import {localizedSkill} from './i18n/data.js'
import {contrastRatio,skillTypeVisual} from './share.js'

const BUFF_LIKE=/\b(?:up|down|guard|resistance|infliction|seal|nullification|recovery|immunity)\b/i
const KNOWN_SKILL_TYPES=new Set(['Combat','Strategy','Leader','Strategist','Internal Affairs'])
const issue=(code,character,skill,effect,skillIndex,effectIndex,detail='')=>({
  code,
  key:[character?.id??'unknown',skillIndex,effectIndex,code,
    effect?.mechanicId??'',effect?.condition??'',effect?.target??'',effect?.effect??'',detail].join('|'),
  owner:character?.id??null,skill:skill?.name_en??null,detail,
})

/** Semantic import audit: callers can compare issue keys against an acknowledged baseline. */
export function auditBuilderContent(roster=ALL,{locales=['en','ja','ar','fr'],resolve=resolveBuilderMechanic,presentSkill=localizedSkill}={}){
  const issues=[]
  const emit=(...args)=>issues.push(issue(...args))
  for(const character of roster||[]){
    const skills=[...(character.skills||[]),...(character.roleSkill?[character.roleSkill]:[])]
    for(const [skillIndex,skill] of skills.entries()){
      const visual=skillTypeVisual(skill.type)
      if(contrastRatio(visual.text,visual.badge)<4.5) emit('unsafe-skill-visual',character,skill,null,skillIndex,-1,skill.type||'unknown')
      if(!KNOWN_SKILL_TYPES.has(skill.type)) emit('unknown-skill-type',character,skill,null,skillIndex,-1,skill.type||'unknown')
      const presentations=Object.fromEntries(locales.map(code=>[code,presentSkill(skill,character.id,skillIndex,code)]))
      for(const [effectIndex,effect] of (skill.effects||[]).entries()){
        for(const code of locales){
          const shown=presentations[code]?.displayEffects?.[effectIndex]
          if(!shown||['condition','target','effect','duration'].some(field=>effect[field]&&!shown[field])||/translation pending/i.test(String(shown.effect||'')))
            emit('localization-gap',character,skill,effect,skillIndex,effectIndex,code)
          else if(code!=='en'&&shown.effect===effect.effect&&shown.target===effect.target&&
            (!effect.condition||shown.condition===effect.condition)&&
            (String(effect.effect||'').match(/[A-Za-z]{3,}/g)||[]).length>=3)
            emit('untranslated-presentation',character,skill,effect,skillIndex,effectIndex,code)
        }
        if(!isBuffSummarySkill(skill,true)) continue
        const resolved=resolve(effect)
        if(resolved.resolution==='failClosed'){
          emit('unknown-stable-id',character,skill,effect,skillIndex,effectIndex,effect.mechanicId)
          continue
        }
        const modifiers=resolved.modifiers
        if(!modifiers.length){
          const target=String(effect.target||'')
          const embeddedEnemy=/^Enemy\s+\[[^\]]+\]\s+.+\b(?:Up|Down)\s+\d+(?:\.\d+)?[%％]/i.test(String(effect.effect||''))
          if(!/^Gate$/i.test(target)&&!embeddedEnemy&&BUFF_LIKE.test(String(effect.effect||''))) emit('unresolved-effect',character,skill,effect,skillIndex,effectIndex)
          continue
        }
        if(!resolved.mechanic){
          const enemy=parseEnemyTargetCriteria(effect.target)
          if(enemy?.unsupported.length) emit('unsupported-opponent',character,skill,effect,skillIndex,effectIndex,enemy.unsupported.join('/'))
          const target=parseTargetMechanics(effect.target)
          if(target.opponentRaw&&!target.opponentCriteria) emit('unsupported-opponent',character,skill,effect,skillIndex,effectIndex,target.opponentRaw)
          const ally=/^(?:surviving\s+)?(?:other\s+)?ally\s+(.+)$/i.exec(target.target.trim())
          if(ally&&![...ally[1].matchAll(/\[([^\]]+)\]/g)].every(match=>parseRosterCriterion(match[1])))
            emit('unsupported-recipient',character,skill,effect,skillIndex,effectIndex,ally[1])
        }
        for(const modifier of modifiers){
          const evaluators=[false,true].map(isDefense=>resolved.mechanic
            ?evaluateStableMechanicApplicability(resolved.mechanic,character,roster,roster,isDefense,false,modifier,effect)
            :evaluateBuffApplicability(effect,modifier,character,roster,roster,isDefense,false))
          const unsupported=evaluators.find(result=>result.state===BUFF_APPLICABILITY.UNSUPPORTED)
          if(unsupported){
            const reason=unsupported.unsupportedRequirements?.[0]||unsupported.reasons?.[0]||'unknown'
            const code=reason==='condition-grammar'?'unknown-condition-grammar':reason==='value-meaning'?'unknown-value-meaning':'unsupported-criterion'
            emit(code,character,skill,effect,skillIndex,effectIndex,reason)
          }
        }
      }
    }
  }
  return issues.sort((a,b)=>a.key.localeCompare(b.key))
}

export function newBuilderContentIssues(issues,acknowledgedKeys=[]){
  const acknowledged=new Set(acknowledgedKeys)
  return issues.filter(entry=>!acknowledged.has(entry.key))
}
