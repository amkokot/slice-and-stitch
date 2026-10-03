import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { layoutFashionWorkspace, renderWorkbenchAction } from '../minigame-actions.js'
import { createPatternLibrary, ownedPatternList } from '../pattern-library.js'
import { FASHION_SCHEMATICS } from '../fashion-catalog.js'
import { fashionProductPainting } from '../fashion-workshop-preview.js'
import { fashionGarmentDraft } from '../fashion-construction.js'

// Small DOM fixture: verifies node identity, order and handlers without a browser
// dependency. Layout/pixel fitting is also checked in the running game.
class Element {
  constructor(tag='div', id='', className='') {
    Object.assign(this,{tag,id,className,children:[],parentElement:null,dataset:{},attributes:{},textContent:''})
  }
  append(...nodes) { for(const node of nodes) { node.detach();node.parentElement=this;this.children.push(node) } }
  detach() { if(this.parentElement) { const list=this.parentElement.children;list.splice(list.indexOf(this),1);this.parentElement=null } }
  after(node) { const parent=this.parentElement;node.detach();node.parentElement=parent;parent.children.splice(parent.children.indexOf(this)+1,0,node) }
  get lastElementChild() { return this.children.at(-1) }
  get previousElementSibling() { return this.parentElement?.children[this.parentElement.children.indexOf(this)-1] }
  setAttribute(name,value) { this.attributes[name]=value }
  querySelector(selector) {
    const matches=node=>selector.startsWith('#')?node.id===selector.slice(1):selector.startsWith('.')?node.className.split(' ').includes(selector.slice(1)):node.tag===selector
    for(const child of this.children) { if(matches(child)) return child;const nested=child.querySelector(selector);if(nested) return nested }
    return null
  }
  set innerHTML(value) {
    assert.match(value,/Next at the workbench/)
    const span=new Element('span');span.append(new Element('small'),new Element('b'))
    this.append(span,new Element('button'))
  }
}

function fixture() {
  const activity=new Element('section','fashionActivity'),grid=new Element('div','','activity-grid')
  const card=new Element('div','','play-card'),surface=new Element('div','','workshop-surface'),tray=new Element('div','','workshop-tools')
  const task=new Element('aside','','task-card'),ticket=new Element('div','','ticket-top'),copy=new Element('p','fashionTaskCopy')
  const materials=new Element('section','','craft-material-step'),tools=new Element('div','fashionTools'),controls=new Element('div','fashionWorkControls')
  const instruction=new Element('div','','instruction-card'),ratings=new Element('div','qualityEstimate'),preview=new Element('div','fashionProductPreview')
  const next=new Element('button','fashionNextButton'),clear=new Element('button','fashionClearButton'),readiness=new Element('p','fashionPlanReadiness')
  activity.append(grid);grid.append(card,task);card.append(surface,tray);surface.append(materials);tray.append(tools,controls)
  task.append(ticket,ratings,instruction,next,clear,readiness);ticket.append(copy,preview)
  return {activity,grid,card,surface,tray,task,ticket,materials,tools,controls,instruction,ratings,preview,next,clear}
}

test('fashion layout keeps controls before the reference preview and preserves node handlers',()=>{
  const f=fixture(),handler=()=>{};f.controls.onclick=handler
  layoutFashionWorkspace(f.activity,{step:'cut'})
  assert.equal(f.activity.dataset.fashionPhase,'cut')
  assert.equal(f.materials.hidden,true)
  assert.equal(f.controls.parentElement,f.task)
  assert.ok(f.task.children.indexOf(f.controls)<f.task.children.indexOf(f.preview))
  assert.equal(f.tools.previousElementSibling,f.instruction)
  layoutFashionWorkspace(f.activity,{step:'sew'})
  layoutFashionWorkspace(f.activity,{step:'plan'})
  layoutFashionWorkspace(f.activity,{step:'plan'})
  assert.equal(f.materials.hidden,false)
  assert.equal(f.materials.parentElement,f.ticket)
  assert.equal(f.preview.parentElement,f.ticket)
  assert.deepEqual(f.tray.children,[f.tools,f.controls])
  assert.equal(f.controls.onclick,handler)
  assert.equal(new Set(f.task.children).size,f.task.children.length)
})

test('alteration setup retains its existing material and modification tray',()=>{
  const f=fixture()
  layoutFashionWorkspace(f.activity,{step:'finish'})
  layoutFashionWorkspace(f.activity,{step:'plan',alterationMode:true})
  assert.equal(f.activity.dataset.fashionPhase,'alteration')
  assert.equal(f.materials.hidden,true)
  assert.equal(f.controls.parentElement,f.tray)
  assert.equal(f.tools.parentElement,f.tray)
  assert.doesNotThrow(()=>layoutFashionWorkspace(null,{step:'plan'}))
})

test('one shared setup action moves back to the workbench without duplicate buttons or readiness jumps',()=>{
  const f=fixture(),oldDocument=globalThis.document
  globalThis.document={getElementById:()=>f.activity,createElement:tag=>new Element(tag)}
  try {
    layoutFashionWorkspace(f.activity,{step:'plan'})
    const handler=()=>{}
    renderWorkbenchAction('fashionActivity',{title:'7 material coins',label:'Start cutting'},handler)
    const dock=f.activity.querySelector('.workbench-continuation'),button=dock.querySelector('button')
    assert.equal(dock.parentElement,f.grid)
    assert.equal(button.onclick,handler)
    renderWorkbenchAction('fashionActivity',{title:'Choose cloth',label:'Choose material',disabled:true},handler)
    assert.equal(button.disabled,true);assert.equal(button.tabIndex,-1)
    layoutFashionWorkspace(f.activity,{step:'cut'})
    renderWorkbenchAction('fashionActivity',null,handler)
    assert.equal(dock.parentElement,f.card)
    assert.equal(dock.previousElementSibling,f.surface)
    assert.equal(dock.dataset.ready,'false')
    renderWorkbenchAction('fashionActivity',{title:'Pass complete',label:'Finish cutting'},handler)
    assert.equal(f.activity.querySelector('.workbench-continuation'),dock)
    assert.equal(button.disabled,false);assert.equal(button.tabIndex,0)
    assert.equal(button.textContent,'Finish cutting')
  } finally { globalThis.document=oldDocument }
})

test('a small crafting box contains only owned patterns without shop suggestions',()=>{
  const library=createPatternLibrary({owned:['service-apron']}),before=JSON.stringify(library)
  const box=ownedPatternList(library)
  assert.deepEqual(box.map(p=>p.id),['service-apron'])
  assert.equal(JSON.stringify(library),before)
  assert.deepEqual(ownedPatternList(library,{search:'not-owned'}),[])
})

test('all pattern paintings fit a square via a finite product viewBox, never an on-body transform',()=>{
  for(const schematic of FASHION_SCHEMATICS) {
    const svg=fashionProductPainting(fashionGarmentDraft({schematic,modifications:[]}),`square-${schematic.id}`)
    const box=/viewBox="([^"]+)"/.exec(svg)?.[1].split(/\s+/).map(Number)
    assert.equal(box?.length,4,schematic.id)
    assert.ok(box.every(Number.isFinite),schematic.id)
    assert.ok(box[2]>0 && box[3]>0,schematic.id)
    assert.doesNotMatch(svg,/preserveAspectRatio="none"/,schematic.id)
  }
  const css=readFileSync(new URL('../minigame-actions.css',import.meta.url),'utf8')
  assert.match(css,/\.fashion-pattern-thumb \{[^}]*width:52px;height:52px;aspect-ratio:1/)
  assert.match(css,/\.fashion-pattern-thumb \{width:40px;height:40px;padding:3px/)
  assert.match(css,/\.fashion-pattern-thumb svg \{[^}]*object-fit:contain/)
  assert.match(css,/\[data-fashion-phase=finish\] \.fashion-finish-surface \.fashion-product-proof \{display:block;grid-template-columns:minmax\(0,1fr\)/,'finish art must not inherit the ticket thumbnail column or an unbounded intrinsic grid track')
  assert.doesNotMatch(css,/height:540px/,'setup no longer reserves a fixed oversized phone panel')
})
