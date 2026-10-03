import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {FASHION_SCHEMATICS} from '../fashion-catalog.js'
import {fashionInventoryFor, restoreFashionProject, steadyHandSection, steadyHandOffset, steadyHandAccuracy, fashionPassScore} from '../fashion-workflow.js'
import {constructionRecipe, constructionTraceScore, traceCompletion, fashionGarmentDraft} from '../fashion-construction.js'
import {createCharacterState, addCraftedGarment, garmentFromFashionResult, equipGarment, characterToActorAppearance, createCharacterStore} from '../character-model.js'
import {isFashionPlaytest} from '../game-storage.js'

test('daily inventory survives reload and atelier advances without refilling spent cloth',()=>{
  const first=fashionInventoryFor(1,0,1)
  const fabric=first.fabrics[0]
  first.remaining[fabric.id]=0
  const reload=fashionInventoryFor(1,0,1,JSON.parse(JSON.stringify(first)))
  assert.equal(reload.remaining[fabric.id],0)
  const advanced=fashionInventoryFor(1,0,4,reload)
  assert.deepEqual(advanced.schematics,reload.schematics,'same-day level advances do not grant a second shipment')
  assert.equal(advanced.remaining[fabric.id],0)
  assert.ok(advanced.fabrics.some(f=>f.unlockLevel>1))
  const tomorrow=fashionInventoryFor(2,0,4,advanced)
  assert.notDeepEqual(tomorrow.schematics.map(p=>p.id),advanced.schematics.map(p=>p.id),'dawn refreshes patterns')
  assert.ok(tomorrow.fabrics.filter(f=>f.featured).every(f=>tomorrow.remaining[f.id]===f.stock))
})
test('daily pattern shipments remain small, fixed and valid at every atelier level',()=>{
  for(let level=1;level<=12;level++) for(let day=1;day<=7;day++) {
    const today=fashionInventoryFor(day,0,level)
    assert.ok(today.schematics.length>=3 && today.schematics.length<=5)
    assert.equal(new Set(today.schematics.map(p=>p.id)).size,today.schematics.length)
    assert.ok(today.schematics.every(p=>p.unlockLevel<=level))
    const reload=fashionInventoryFor(day,0,12,JSON.parse(JSON.stringify(today)))
    assert.deepEqual(reload.schematics.map(p=>p.id),today.schematics.map(p=>p.id))
  }
})

test('all recipes can be completed with steady-hand controls; inaccurate timing is not a free perfect garment',()=>{
  for(const schematic of FASHION_SCHEMATICS) {
    const recipe=constructionRecipe(schematic)
    for(const guide of [recipe.cut,...recipe.seams.map(seam=>seam.points)]) {
      const centered=Array.from({length:8},(_,i)=>steadyHandSection(guide,i,0)).flat()
      const wide=Array.from({length:8},(_,i)=>steadyHandSection(guide,i,44)).flat()
      assert.equal(constructionTraceScore(centered,guide),100,schematic.id)
      assert.equal(traceCompletion(centered,guide),1,schematic.id)
      assert.equal(fashionPassScore({inputMode:'steady',assistAccuracies:Array(8).fill(steadyHandAccuracy(44))},wide,guide),0,schematic.id)
      assert.ok(steadyHandSection(guide,0,0).length<centered.length)
    }
  }
  assert.equal(steadyHandOffset(0),0)
  assert.ok(Math.abs(steadyHandOffset(620*Math.PI/2)-44)<.001)
  assert.deepEqual(steadyHandSection([{x:0,y:0},{x:100,y:100}],8,0),[])
})

test('unfinished paid project restores exact work, released input and stable project identity',()=>{
  const schematic=FASHION_SCHEMATICS.find(s=>s.cut==='crew-tee')||FASHION_SCHEMATICS[0]
  const fresh={projectId:'new',step:'plan',schematic,cutTrace:[],seamTrace:[],seamScores:[],seamIndex:0,modifications:[],scores:{},fabricOffset:{x:0,y:0}}
  const paid={...fresh,projectId:'saved-piece',step:'sew',fabric:{id:'cream-knit',color:'#e7dcc5',family:'knit'},materialConsumed:true,dragging:true,cutTrace:[{x:100,y:150},{x:120,y:180}],seamTrace:[{x:105,y:205}],seamIndex:1,seamScores:[94],assistSection:3}
  const restored=restoreFashionProject(JSON.parse(JSON.stringify(paid)),fresh,12)
  assert.equal(restored.projectId,'saved-piece')
  assert.equal(restored.dragging,false)
  assert.equal(restored.seamIndex,1)
  assert.deepEqual(restored.cutTrace,paid.cutTrace)
  assert.equal(restored.assistSection,3)
  assert.equal(restoreFashionProject({...paid,completed:true},fresh,12),fresh)
  assert.equal(restoreFashionProject({...paid,materialConsumed:false},fresh,12),fresh)
  assert.equal(restoreFashionProject({...paid,schematic:{id:'missing'}},fresh,12),fresh)
  const advanced=FASHION_SCHEMATICS.find(s=>s.unlockLevel>1)
  assert.equal(restoreFashionProject({...paid,schematic:advanced},fresh,1),fresh)
  const alteration=restoreFashionProject({...paid,schematic:advanced,alterationMode:true,baseGarment:{id:'inherited-piece'}},fresh,1)
  assert.equal(alteration.projectId,'saved-piece','owned alterations must survive reload even when their new-project pattern unlocks later')
})

test('a completed project is collected exactly once, can be worn on its own layer, and survives reload',()=>{
  const schematic=FASHION_SCHEMATICS.find(s=>s.cut==='soft-blazer')
  const draft=fashionGarmentDraft({projectId:'stable-project',schematic,fabric:{label:'Navy wool',fiber:'Wool suiting',color:'#334455',quality:90,family:'suiting'},modifications:[],finishing:[],seamScores:[98,96],scores:{cut:99,sew:97}})
  const result={type:'completed',kind:'fashion',runId:1,result:{garment:{...draft,quality:93,value:190}}}
  const initial=createCharacterState()
  const collected=addCraftedGarment(initial,result)
  assert.equal(addCraftedGarment(collected,result),collected)
  assert.equal(addCraftedGarment(collected,{...result,runId:22}),collected)
  const id=garmentFromFashionResult(result).id
  const worn=equipGarment(collected,id)
  assert.equal(worn.profile.equipped.outerwear,id)
  assert.equal(worn.profile.equipped.top,initial.profile.equipped.top)
  const restored=createCharacterState(JSON.parse(JSON.stringify(worn)))
  assert.equal(restored.profile.equipped.outerwear,id)
  assert.equal(characterToActorAppearance(restored).garmentDetails.outerwear.customization.projectId,'stable-project')
})

test('playtest mode and normal game keep separate storage; handoff buttons are connected to hub equipment',()=>{
  assert.equal(isFashionPlaytest('?playtest=fashion'),true)
  assert.equal(isFashionPlaytest('?qa=painted-npcs'),false)
  const values=new Map()
  const storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)}
  const store=createCharacterStore({storage})
  store.updateProfile({name:'Trial'})
  assert.equal(createCharacterStore({storage}).snapshot().profile.name,'Trial')
  const game=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  const hub=readFileSync(new URL('../hub.js',import.meta.url),'utf8')
  assert.match(game,/Wear it now/)
  assert.match(game,/fashion-wardrobe/)
  assert.match(hub,/characterStore\.equip\(garment\.id\)/)
  assert.match(hub,/getAtelierLevel: \(\) => currentProgress\(\)\.atelierLevel/)
  assert.match(game,/equippedGarments/)
  assert.match(game,/if \(\['cut','sew'\].includes\(fashion.step\) && fashion.inputMode==='steady' && fashion.assistSection<STEADY_HAND_SECTIONS\) return false/)
  const css=readFileSync(new URL('../fashion-workshop.css',import.meta.url),'utf8')
  assert.match(css,/svg\.painted-garment-thumbnail__painting[^}]*position:static/s)
  assert.match(css,/pointer-events:none/)
})
