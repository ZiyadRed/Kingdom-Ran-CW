import { describe, expect, it } from 'vitest'
import { buffCellParts, classifyBuffRows, enemyDebuffRows, enemyDebuffText, groupCellsBySources } from './buff-table-rows.js'
import { BUFF_IMAGE_SINGLE_WIDTH, BUFF_IMAGE_WIDE_WIDTH, buildBuffImageLayout } from './share.js'

const options={inverseStats:new Set(['Morale Consumption']),specialStats:new Set(['Attack Nullification'])}
const owner=id=>({id})
const bucket=(up,sources=[])=>({up,down:0,sources})
const source=(id,contribution,skill='Oath')=>({owner:owner(id),dir:'up',contribution,skill:{name_en:skill},effect:{effect:`ATK Up ${contribution}%`}})
const maps=rows=>rows.map(entries=>new Map(entries))

describe('buff row classification', () => {
  it('merges a value every general shares, keeps one-general and differing rows apart', () => {
    const active=maps([
      [['ATK',bucket(60,[source('a',60)])],['Max HP',bucket(100)],['Critical Rate',bucket(30)]],
      [['ATK',bucket(60,[source('a',60)])],['Max HP',bucket(200)]],
      [['ATK',bucket(60,[source('a',60)])],['Max HP',bucket(100)]],
    ])
    const rows=classifyBuffRows(active,['ATK','Max HP','Critical Rate'],options)
    expect(rows.map(row=>[row.stat,row.kind])).toEqual([['ATK','shared'],['Max HP','varies'],['Critical Rate','single']])
    expect(rows[0].cells[0].parts).toEqual([{text:'+60%',tone:'good'}])
    expect(rows[2].present).toEqual([0])
  })

  it('treats a missing general as varies, never as shared', () => {
    const rows=classifyBuffRows(maps([[['DEF',bucket(70)]],[['DEF',bucket(70)]],[]]),['DEF'],options)
    expect(rows[0].kind).toBe('varies')
  })

  it('uses single for a one-general formation instead of "All 1"', () => {
    expect(classifyBuffRows(maps([[['ATK',bucket(10)]]]),['ATK'],options)[0].kind).toBe('single')
  })

  it('compares Guard by its highest instance, duration and alternatives', () => {
    const guard=(vals,duration='1 time')=>({up:0,down:0,instances:vals.map(val=>({val,duration,owner:owner('o')}))})
    const same=classifyBuffRows(maps([[['Guard',guard([100])]],[['Guard',guard([100])]]]),['Guard'],options)[0]
    expect(same.kind).toBe('shared')
    expect(same.cells[0].duration).toBe('1 time')
    const extra=classifyBuffRows(maps([[['Guard',guard([100])]],[['Guard',guard([100,70])]]]),['Guard'],options)[0]
    expect(extra.kind).toBe('varies')
    expect(extra.cells[1].more).toBe(1)
  })

  it('keeps inverse and flag stats readable', () => {
    expect(buffCellParts('Morale Consumption',{up:0,down:30},options)).toEqual([{text:'−30%',tone:'good'}])
    expect(buffCellParts('Attack Nullification',{up:1,down:0},options)).toEqual([{text:'● 1×',tone:'good',flag:true}])
  })

  it('lists identical source breakdowns once for a shared row', () => {
    const active=maps([
      [['ATK',bucket(60,[source('a',60)])]],
      [['ATK',bucket(60,[source('a',60)])]],
      [['ATK',bucket(60,[source('b',40,'Other'),source('a',20)])]],
    ])
    const [row]=classifyBuffRows(active,['ATK'],options)
    expect(groupCellsBySources('ATK',row.cells).map(group=>group.indexes)).toEqual([[0,1],[2]])
  })

  it('flattens enemy debuffs, ignoring empty buckets', () => {
    const rows=enemyDebuffRows({'All enemies':{up:{},down:{ATK:30},sources:{'down|ATK':[source('x',30)]}}})
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({target:'All enemies',stat:'ATK',dir:'down',value:30})
    expect(enemyDebuffText(rows[0])).toBe('−30%')
  })
})

describe('buff table image layout', () => {
  // Deterministic text metrics: half the font size per character.
  const measure=(text,font)=>String(text||'').length*(Number(/(\d+)px/.exec(font)?.[1]||20)*.5)
  const member=name=>({entity:{id:name},name,unit:'Cavalry'})
  const side=(key,rows=[],enemy=[])=>({key,chip:key,members:['A','B','C','D'].map(member),rows,enemy})
  const labels={title:'Team buffs',eyebrow:'Attacking team',noBuffs:'No relevant buffs',onEnemy:'On the enemy',allCount:n=>`All ${n}`}

  it('renders one formation 1080 wide and both formations side by side 2000 wide', () => {
    const rows=[{kind:'shared',stat:'ATK',value:{text:'+60%',tone:'good'}},{kind:'varies',stat:'Max HP',values:[{text:'+100%'},{text:'+200%'},null,{text:'+100%'}]}]
    const single=buildBuffImageLayout(measure,{labels,sides:[side('attack',rows)]})
    expect(single.width).toBe(BUFF_IMAGE_SINGLE_WIDTH)
    expect(single.sections).toHaveLength(1)
    expect(single.sections[0].chip).toBeNull()
    expect(single.membersLine).toBe('A · B · C · D')
    const wide=buildBuffImageLayout(measure,{labels,sides:[side('attack',rows),side('defense',rows.slice(0,1),[{stat:'ATK',value:'−30%',target:'All enemies'}])]})
    expect(wide.width).toBe(BUFF_IMAGE_WIDE_WIDTH)
    const [left,right]=wide.sections
    expect(left.x+left.w).toBeLessThan(right.x)
    expect(right.x+right.w).toBeLessThanOrEqual(BUFF_IMAGE_WIDE_WIDTH-40)
    expect(left.chip.text).toBe('ATTACK')
    expect(wide.height).toBeGreaterThan(Math.max(left.bottom,right.bottom))
    // A lone enemy effect spans the whole card so its target sits at the far edge.
    expect(right.enemy.items[0].w).toBe(right.w)
  })

  it('stacks rows without gaps and gives every row room for its text', () => {
    const long={kind:'shared',stat:'Confusion Resistance Resistance Resistance',value:{text:'+100%'}}
    const layout=buildBuffImageLayout(measure,{labels,sides:[side('attack',[long,{kind:'single',stat:'Critical Rate',values:[null,{text:'+30%'},null,null]}])]})
    const table=layout.sections[0].table
    expect(table.rows[0].statLines.length).toBe(2)
    expect(table.rows[1].y).toBe(table.rows[0].y+table.rows[0].h)
    expect(table.h).toBe(table.headH+table.rows.reduce((sum,row)=>sum+row.h,0))
  })

  it('shrinks space-less (Japanese) names instead of breaking them mid-word', () => {
    // 25 characters: wider than the largest (380px) stat column at 31px, fits when smaller.
    const stat=`${'クリティカル'.repeat(4)}率`
    const layout=buildBuffImageLayout(measure,{labels,sides:[side('attack',[{kind:'shared',stat,value:{text:'+30%'}}])]})
    const row=layout.sections[0].table.rows[0]
    expect(row.statLines).toEqual([stat])
    expect(row.statSize).toBeLessThan(31)
  })

  it('widens the stat column to fit names on one line, keeping value columns at least 150px', () => {
    const rows=name=>[{kind:'shared',stat:name,value:{text:'+30%'}}]
    const short=buildBuffImageLayout(measure,{labels,sides:[side('attack',rows('ATK'))]}).sections[0].table
    expect(short.statW).toBe(300)
    const long=buildBuffImageLayout(measure,{labels,sides:[side('attack',rows('x'.repeat(40))),side('defense',rows('ATK'))]})
    for(const section of long.sections){
      expect(section.table.statW).toBe(long.sections[0].table.statW)
      expect(section.table.cellW).toBeGreaterThanOrEqual(150)
    }
  })

  it('shows an empty-state row and marks Arabic layouts right-to-left', () => {
    const layout=buildBuffImageLayout(measure,{labels:{...labels,direction:'rtl'},sides:[side('defense')]})
    expect(layout.direction).toBe('rtl')
    expect(layout.sections[0].table.rows[0]).toMatchObject({kind:'empty',statLines:['No relevant buffs']})
  })
})
