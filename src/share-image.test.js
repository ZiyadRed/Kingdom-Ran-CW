import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SHARE_LABELS,
  SHARE_IMAGE_TOKENS,
  buildCharacterImageLayout,
  buildTeamImageLayout,
  contrastRatio,
  inspectShareImageLayout,
  shareEffectBodyColor,
  shareImagePaintText,
  skillTypeVisual,
} from './share.js'

function measuringContext(){
  return {
    font:'16px sans-serif',
    measureText(value){
      const size=Number(/(\d+(?:\.\d+)?)px/.exec(this.font)?.[1]||16)
      const text=String(value||'')
      const units=[...text].reduce((sum,char)=>sum+(/[\u3000-\u9fff\u3040-\u30ff\u0600-\u06ff]/.test(char)?1:.56),0)
      return {width:units*size}
    },
  }
}

const effect={condition:'When Attacking, enemy [General] with highest ATK',target:'1 enemy [General]',effect:'ATK Down 30% and DEF Down 20%',duration:'10 seconds'}
const skill={name_en:'A deliberately long but ordinary source skill title for layout coverage',name_jp:'長い技能名',type:'Strategy',star6:true,effects:[effect]}
const character={id:'test',name_en:'Test General',name_jp:'試験武将',country:'qin',unit_type:'Cavalry',skills:[skill]}

describe('generated share-image contract',()=>{
  it('uses readable semantic badge pairs for every known and unknown skill type',()=>{
    for(const type of ['Combat','Strategy','Leader','Strategist','Internal Affairs','future-skill-type']){
      const visual=skillTypeVisual(type)
      expect(contrastRatio(visual.text,visual.badge),type).toBeGreaterThanOrEqual(4.5)
    }
    expect(contrastRatio('#624400',SHARE_IMAGE_TOKENS.colors.cw6Surface)).toBeGreaterThanOrEqual(4.5)
  })

  it('keeps type semantics when a separate CW6 indicator is present',()=>{
    const layout=buildCharacterImageLayout(measuringContext(),character)
    const badges=layout.skillLayouts[0].badgeLayout.items
    expect(badges.map(item=>item.id)).toEqual(['type','cw6'])
    expect(badges[0].text).toBe('Strategy')
    expect(badges[1].text).toBe('6-star')
  })

  it('measures long localized labels and titles without sibling collisions or clipping',()=>{
    const labels={
      ...DEFAULT_SHARE_LABELS,
      direction:'rtl',
      star6:'مؤشر بطاقة المستوى السادس الطويل للاختبار',
      terms:{Strategy:'تصنيف مهارة الاستراتيجية المترجم الطويل للاختبار'},
    }
    const layout=buildTeamImageLayout(measuringContext(),[
      {...character,displayName:'اسم جنرال طويل للاختبار',skills:[{...skill,displayName:'عنوان مهارة مترجم طويل جدًا لاختبار القياس المستقبلي'}]},
    ],{title:'عنوان تشكيل مترجم طويل لاختبار القياس',side:'attack',labels})
    expect(inspectShareImageLayout(layout)).toEqual({ok:true,issues:[]})
  })

  it('uses source conditions for semantics and localized effects for visible text',()=>{
    const localized={
      ...skill,
      displayEffects:[{condition:'عند الهجوم، العدو صاحب أعلى هجوم',target:'جنرال عدو واحد',effect:'خفض الهجوم 30٪',duration:'10 ثوانٍ'}],
    }
    const layout=buildCharacterImageLayout(measuringContext(),{...character,skills:[localized]}, {
      ...DEFAULT_SHARE_LABELS,direction:'rtl',conditions:{When:'عند',Target:'الهدف'},
    })
    const blocks=layout.skillLayouts[0].effects[0].conditionBlocks
    expect(blocks.map(block=>block.semanticKind)).toEqual(['when','target'])
    expect(blocks.map(block=>block.text).join(' ')).toContain('عند الهجوم')
    expect(layout.skillLayouts[0].effects[0].bodyBlock.text).toContain('خفض الهجوم')
  })

  it('never assigns semantic meaning to an effect continuation line',()=>{
    expect(shareEffectBodyColor(0)).toBe(SHARE_IMAGE_TOKENS.colors.text)
    expect(shareEffectBodyColor(7)).toBe(SHARE_IMAGE_TOKENS.colors.text)
  })

  it('does not paint raw share URLs or Discord-oriented instructions',()=>{
    const characterLayout=buildCharacterImageLayout(measuringContext(),character)
    const teamLayout=buildTeamImageLayout(measuringContext(),[character],{title:'Attack skills',side:'attack'})
    for(const layout of [characterLayout,teamLayout]){
      const paint=shareImagePaintText(layout).join(' ')
      expect(paint).not.toMatch(/https?:\/\//i)
      expect(paint).not.toMatch(/discord/i)
      expect(paint).toContain('ranhq.vercel.app')
    }
  })

  it('mirrors character structure for RTL without reversing its skill data',()=>{
    const ltr=buildCharacterImageLayout(measuringContext(),character)
    const rtl=buildCharacterImageLayout(measuringContext(),character,{...DEFAULT_SHARE_LABELS,direction:'rtl'})
    expect(ltr.profile.portrait.x).toBeLessThan(ltr.profile.nameBlock.x)
    expect(rtl.profile.portrait.x).toBeGreaterThan(rtl.profile.nameBlock.x)
    expect(rtl.profile.nameBlock.align).toBe('right')
    expect(rtl.skillLayouts[0].skill).toBe(skill)
  })

  it('distinguishes deliberate zero-skill selection from missing translation',()=>{
    const disabled=buildTeamImageLayout(measuringContext(),[{...character,skills:[],skillsDisabled:true}],{labels:{...DEFAULT_SHARE_LABELS,noSkillsSelected:'Aucune compétence sélectionnée'}})
    const pending=buildTeamImageLayout(measuringContext(),[{...character,skills:[],skillsDisabled:false}],{})
    expect(disabled.memberLayouts[0].empty.text).toBe('Aucune compétence sélectionnée')
    expect(pending.memberLayouts[0].empty.text).toBe('Translation pending')
  })
})
