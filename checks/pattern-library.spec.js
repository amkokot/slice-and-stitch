import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { FASHION_SCHEMATICS, FASHION_CATALOG_GARMENTS, tailorStockForDay } from '../fashion-catalog.js'
import {createPatternLibrary,patternPrice,patternAvailability,purchasePattern,patternLibrarySnapshot,ownedPatternList,markPatternUsed} from '../pattern-library.js'
import {pizzaContinuation,kitchenContinuation} from '../minigame-actions.js'

test('every reusable pattern costs far less than the matching ready-made garment',()=>{
  for(const pattern of FASHION_SCHEMATICS) {
    const garment=FASHION_CATALOG_GARMENTS.find(item=>item.id===pattern.artworkId)
    assert.ok(garment,pattern.id)
    assert.ok(patternPrice(pattern)>0)
    assert.ok(patternPrice(pattern)<=garment.price*.2,`${pattern.id}: ${patternPrice(pattern)} / ${garment.price}`)
  }
})
test('patterns are bought once, survive reload and remain owned across days and levels',()=>{
  const stock=tailorStockForDay(1,0,1)
  const first=purchasePattern(createPatternLibrary(),'service-apron',1,120,stock)
  assert.equal(first.ok,true)
  assert.equal(first.balance,120-patternPrice('service-apron'))
  const restored=createPatternLibrary(JSON.parse(JSON.stringify(first.library)))
  assert.equal(patternAvailability(restored,'service-apron',1,0).owned,true)
  const duplicate=purchasePattern(restored,'service-apron',12,first.balance,stock)
  assert.equal(duplicate.ok,false)
  assert.equal(duplicate.balance,first.balance)
  assert.deepEqual(duplicate.library.owned,['service-apron'])
})
test('earning an atelier level permits advanced patterns only when stocked, not automatically owned',()=>{
  const pattern=FASHION_SCHEMATICS.find(item=>item.unlockLevel===6)
  const empty=createPatternLibrary()
  const stock={day:2,schematics:[pattern]}
  assert.equal(purchasePattern(empty,pattern.id,5,10000,stock).ok,false)
  assert.equal(patternAvailability(empty,pattern,6,10000,stock).available,true)
  assert.equal(patternAvailability(empty,pattern,6,10000).owned,false)
  const bought=purchasePattern(empty,pattern.id,6,10000,stock)
  assert.equal(bought.ok,true)
  assert.equal(patternAvailability(bought.library,pattern,1,0).owned,true,'never revoke an acquired pattern')
})
test('unknown IDs and insufficient coins cannot charge money or acquire a pattern',()=>{
  const empty=createPatternLibrary({owned:['missing','missing']})
  assert.deepEqual(empty.owned,[])
  assert.equal(purchasePattern(empty,'missing',12,120).balance,120)
  const denied=purchasePattern(empty,'service-apron',1,2,tailorStockForDay(1,0,1))
  assert.equal(denied.ok,false);assert.equal(denied.balance,2);assert.deepEqual(denied.library.owned,[])
  assert.equal(patternLibrarySnapshot(empty,1,120).filter(pattern=>pattern.owned).length,0)
})
test('paid legacy projects retain their pattern without granting an entire unlocked archive',()=>{
  const project={materialConsumed:true,schematic:{id:'service-apron'}}
  assert.deepEqual(createPatternLibrary(null,{project}).owned,['service-apron'])
  assert.deepEqual(createPatternLibrary(null,{project:{...project,materialConsumed:false}}).owned,[])
  assert.deepEqual(createPatternLibrary(null,{project:{...project,alterationMode:true}}).owned,[])
})
test('the unlocked archive cannot be purchased outside the current daily shipment',()=>{
  const stock=tailorStockForDay(1,0,1),empty=createPatternLibrary()
  const absent=FASHION_SCHEMATICS.find(p=>p.unlockLevel===1 && !stock.schematics.some(s=>s.id===p.id))
  const denied=purchasePattern(empty,absent.id,1,10000,stock)
  assert.equal(denied.ok,false);assert.equal(denied.balance,10000)
  assert.deepEqual(denied.library.owned,[]);assert.match(denied.reason,/stock today/)
  assert.equal(purchasePattern(empty,stock.schematics[0].id,1,10000).ok,false,'missing inventory must fail closed')
  const snapshot=patternLibrarySnapshot(empty,1,10000,stock)
  assert.deepEqual(snapshot.filter(p=>p.available).map(p=>p.id).sort(),stock.schematics.map(p=>p.id).sort())
  let library=empty,balance=10000
  for(const p of stock.schematics) { const bought=purchasePattern(library,p.id,1,balance,stock);library=bought.library;balance=bought.balance }
  assert.equal(patternLibrarySnapshot(library,1,balance,stock).filter(p=>p.available).length,0,'buying the shipment never refills it')
})
test('new purchase badges and acquisition order survive reload, and clear only when used',()=>{
  const stock=tailorStockForDay(1,0,1)
  let library=createPatternLibrary({owned:['service-apron'],sort:'value'})
  assert.deepEqual(library.newIds,[],'legacy ownership is not incorrectly marked new')
  const bought=stock.schematics.find(p=>p.id!=='service-apron')
  library=purchasePattern(library,bought.id,1,120,stock).library
  library=createPatternLibrary(JSON.parse(JSON.stringify(library)))
  assert.equal(library.sort,'newest');assert.equal(ownedPatternList(library)[0].id,bought.id)
  assert.equal(ownedPatternList(library)[0].isNew,true)
  const used=markPatternUsed(library,bought.id)
  assert.deepEqual(used.newIds,[]);assert.deepEqual(used.owned,library.owned)
  assert.equal(ownedPatternList(used)[0].id,bought.id,'using a pattern does not change acquisition order')
  assert.deepEqual(createPatternLibrary({owned:['service-apron','service-apron'],newIds:['missing','service-apron','service-apron'],sort:'bad'}),
    {version:2,owned:['service-apron'],newIds:['service-apron'],sort:'newest'})
})
test('owned-only search and value, atelier tier and name sorts are deterministic and saved',()=>{
  const owned=FASHION_SCHEMATICS.filter((p,i)=>i%4===0).map(p=>p.id)
  const library=createPatternLibrary({owned,sort:'value'}),before=JSON.stringify(library)
  const values=ownedPatternList(library)
  assert.ok(values.every((p,i)=>i===0 || values[i-1].catalogueValue>=p.catalogueValue))
  const tiers=ownedPatternList(library,{sort:'tier'})
  assert.ok(tiers.every((p,i)=>i===0 || tiers[i-1].designTier>=p.designTier))
  const names=ownedPatternList(library,{sort:'name'})
  assert.ok(names.every((p,i)=>i===0 || names[i-1].name.localeCompare(p.name)<=0))
  const search=ownedPatternList(library,{search:'leather'})
  assert.ok(search.length>0);assert.ok(search.every(p=>owned.includes(p.id)))
  assert.equal(JSON.stringify(library),before)
  assert.deepEqual(ownedPatternList(createPatternLibrary(),{search:'apron'}),[])
  assert.equal(createPatternLibrary(JSON.parse(before)).sort,'value')
})
test('pizza next actions appear at the surface only when ready and never bypass burning',()=>{
  for(const step of ['sauce','cheese','toppings','bake','finish','cut']) {
    assert.ok(pizzaContinuation({step},true),step)
    assert.equal(pizzaContinuation({step},false),null)
    assert.equal(pizzaContinuation({step},true,true),null)
  }
  assert.equal(pizzaContinuation({step:'toppings',transferringToOven:true},true),null)
  assert.equal(pizzaContinuation({step:'cut',served:true},true),null)
  assert.equal(pizzaContinuation({step:'bake',bakeRunning:true},true,false,'Golden').label,'Take pizza out')
})
test('prep handoffs go straight to the missing recipe or the next real service task',()=>{
  const service={burning:false,doughs:1,sauces:{tomato:0,pesto:5},dirtyDishes:0,drinkTickets:1}
  const info={active:'saucePot',current:{completed:true,kind:'pesto'}}
  const gate={blocked:true,station:'saucePot',sauce:'tomato',action:'Make tomato sauce'}
  assert.equal(kitchenContinuation(info,service,gate).sauce,'tomato')
  assert.equal(kitchenContinuation(info,{...service,burning:true},gate),null)
  assert.equal(kitchenContinuation({active:'dishwashing',current:{completed:true}},service,gate).station,'drinkPour')
  assert.equal(kitchenContinuation({active:'doughToss',current:{stage:'airborne'}},service,gate),null)
  assert.equal(kitchenContinuation({active:'doughToss',current:{stage:'ready'}},service,{blocked:false}).station,'pizza')
})
test('crafting selection is owned-only, with pattern and material shown together and a surface-local action',()=>{
  const game=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8')
  const frame=readFileSync(new URL('../game-panel.js',import.meta.url),'utf8')
  assert.match(game,/patternLibrary: state\.patternLibrary/)
  assert.match(game,/if\(!patternAvailability[\s\S]*?\.owned\) return false/)
  assert.match(game,/state\.patternLibrary\.owned\.includes\(fashion\.schematic\.id\) && compatibleFashionFabric/)
  assert.match(game,/id='fashionProjectPlanner'/)
  assert.match(game,/My pattern box/);assert.match(game,/fashionPlannerMaterials/)
  assert.match(game,/ownedPatternList\(state.patternLibrary/)
  assert.doesNotMatch(game,/data-fashion-buy-pattern|patternLibrarySuggestions|fashionPatternBrowse/)
  assert.match(game,/purchasePattern\(state.patternLibrary,schematicId,state.fashionInventory.level,state.coins,state.fashionInventory\)/)
  const hub=readFileSync(new URL('../hub.js',import.meta.url),'utf8')
  assert.doesNotMatch(hub,/All other unlocked patterns/)
  assert.match(hub,/Today’s pattern shipment/)
  assert.match(html,/<div id="pizzaBadge" hidden aria-hidden="true"><\/div>/)
  assert.match(frame,/surface\.after\(continuation\)/)
})
