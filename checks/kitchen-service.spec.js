import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createKitchenService, kitchenServiceSnapshot, advanceKitchenHeat, stirKitchenSauce, pizzaServiceGate,
  reservePizzaPrep, addKitchenPrep, completeKitchenPizza, consumeServiceTicket} from '../kitchen-service.js'
import {createKitchenMinigames, saveKitchenStations, restoreKitchenStations} from '../kitchen-minigames.js'
import {dishEarnings,sodaEarnings,incomeForecast} from '../economy.js'
import {createPizzeriaShift} from '../pizzeria-shift.js'
const stocked=()=>createKitchenService({doughs:5,sauces:{tomato:5,pesto:5}})

test('a new kitchen requires a tossed skin and the correct prepared sauce',()=>{
  let state=createKitchenService()
  assert.equal(pizzaServiceGate(state).code,'dough')
  state=addKitchenPrep(state,{id:'skin',kind:'dough'}).state
  assert.equal(pizzaServiceGate(state).code,'sauce')
  state=addKitchenPrep(state,{id:'tomato',kind:'sauce',amount:5}).state
  assert.equal(pizzaServiceGate(state,{sauce:'pesto'}).code,'sauce')
  assert.equal(pizzaServiceGate(state,{sauce:'tomato'}).blocked,false)
})
test('prep is consumed once per pizza, not once per spoon stroke or reload',()=>{
  let state=reservePizzaPrep(stocked(),'order1','pesto').state
  assert.equal(state.doughs,4);assert.equal(state.sauces.pesto,4);assert.equal(state.sauces.tomato,5)
  state=createKitchenService(JSON.parse(JSON.stringify(state)))
  assert.equal(reservePizzaPrep(state,'order1','pesto').state,state)
  assert.equal(reservePizzaPrep(state,'order2').ok,false)
  const done=completeKitchenPizza(state,'order1')
  assert.equal(done.ok,true);assert.equal(done.state.dirtyDishes,2);assert.equal(done.state.drinkTickets,1)
  assert.equal(completeKitchenPizza(done.state,'order1').ok,false)
})
test('stocks are capped and batch receipts cannot replay',()=>{
  let state=stocked()
  state=addKitchenPrep(state,{id:'batch',kind:'sauce',amount:5}).state
  assert.equal(state.sauces.tomato,10)
  assert.equal(addKitchenPrep(state,{id:'batch',kind:'sauce',amount:5}).added,0)
  assert.equal(addKitchenPrep(state,{id:'other',kind:'sauce',amount:5}).added,0)
})
test('heat warns at three minutes, stops cooking at four, and has a 30% slower diffuser',()=>{
  let state=advanceKitchenHeat(stocked(),180000)
  assert.equal(kitchenServiceSnapshot(state).hold.key,'watch')
  state=advanceKitchenHeat(state,60000)
  assert.equal(state.burning,true);assert.equal(pizzaServiceGate(state).code,'burning')
  assert.equal(advanceKitchenHeat(stocked(),240000,{diffuser:true}).burning,false)
  assert.equal(advanceKitchenHeat(stocked(),350000,{diffuser:true}).burning,true)
})
test('leaving service, pausing, phase changes and reload do not erase heat',()=>{
  const hot=advanceKitchenHeat(stocked(),240000)
  assert.equal(advanceKitchenHeat(hot,100000,{running:false}),hot)
  const saved=createKitchenService(JSON.parse(JSON.stringify(hot)))
  assert.equal(saved.burning,true);assert.equal(reservePizzaPrep(saved,'p').ok,false)
  assert.equal(addKitchenPrep(saved,{id:'refill',kind:'sauce',amount:5}).added,0)
})
test('a tiny stir cannot bypass burning; rescue needs 1¼ turns and preserves the reservation',()=>{
  let state=advanceKitchenHeat(reservePizzaPrep(stocked(),'pizza').state,240000)
  state=stirKitchenSauce(state,.02)
  assert.equal(state.burning,true);assert.equal(completeKitchenPizza(state,'pizza').ok,false)
  for(let i=0;i<5;i++)state=stirKitchenSauce(state,Math.PI/2)
  assert.equal(state.burning,false);assert.equal(state.heatMs,0);assert.equal(state.reservation.id,'pizza')
  assert.equal(completeKitchenPizza(state,'pizza').ok,true)
})
test('routine upkeep needs ¾ turn, and pesto alone never heats',()=>{
  let state=advanceKitchenHeat(stocked(),190000)
  state=stirKitchenSauce(state,Math.PI/2);assert.ok(state.heatMs>0)
  state=stirKitchenSauce(state,Math.PI);assert.equal(state.heatMs,0)
  const cold=createKitchenService({doughs:2,sauces:{pesto:5}})
  assert.equal(advanceKitchenHeat(cold,1000000),cold)
})
test('dish and soda rewards require demand and consume a unique receipt exactly once',()=>{
  let state=completeKitchenPizza(reservePizzaPrep(stocked(),'p').state,'p').state
  for(const kind of ['dishwashing','drinkPour']) {
    const id=`work:${kind}`
    const result=consumeServiceTicket(state,{id,kind})
    assert.equal(result.accepted,true);state=result.state
    assert.equal(consumeServiceTicket(state,{id,kind}).accepted,false)
  }
  assert.equal(consumeServiceTicket(state,{id:'new-cup',kind:'drinkPour'}).accepted,false)
  assert.equal(consumeServiceTicket(createKitchenService(),{id:'practice',kind:'dishwashing'}).accepted,false)
})
test('bonus payouts are bounded and poor/wrong-flavor sodas earn no money',()=>{
  assert.equal(dishEarnings(),2);assert.equal(sodaEarnings(20),0)
  assert.equal(sodaEarnings(39),0);assert.equal(sodaEarnings(40),3)
  assert.equal(sodaEarnings(75),6);assert.equal(sodaEarnings(100),8)
  assert.equal(sodaEarnings(9000),8)
  assert.equal(incomeForecast()[1].gross,388)
})
test('station timer offsets survive page reload and release all held input',()=>{
  const games={saucePot:{ingredientsReadyAt:1234,stirring:true,bubbles:[{availableAt:Infinity}]},doughToss:{airStart:1000,dragging:true}}
  const saved=JSON.parse(JSON.stringify(saveKitchenStations(games,1100)))
  const restored=restoreKitchenStations(saved,8000)
  assert.equal(restored.saucePot.ingredientsReadyAt,8134)
  assert.equal(restored.saucePot.bubbles[0].availableAt,Infinity)
  assert.equal(restored.doughToss.airStart,7900)
  assert.equal(restored.doughToss.dragging,false);assert.equal(restored.saucePot.stirring,false)
})
test('customer queue and dish backlog restore without ID collisions or changing the cooking customer',()=>{
  const shift=createPizzeriaShift();shift.seed();const cooking=shift.claimNextOrder()
  const saved=JSON.parse(JSON.stringify(shift.snapshot()))
  const restored=createPizzeriaShift();restored.restore(saved,4)
  assert.equal(restored.claimNextOrder().id,cooking.id);assert.equal(restored.snapshot().dirtyDishes,4)
  assert.ok(![...saved.queue,...saved.approaching].some(customer=>customer.id === restored.spawn().id))
})

function harness(saved={},initial=createKitchenService()) {
  const originals={performance:globalThis.performance,Image:globalThis.Image,raf:globalThis.requestAnimationFrame,caf:globalThis.cancelAnimationFrame}
  let time=100,frame,service=initial,coins=0,running=true,controller,closed=false
  const listeners={};const works=[]
  globalThis.performance={now:()=>time}
  globalThis.Image=class {addEventListener(){} }
  globalThis.requestAnimationFrame=callback=>{frame=callback;return 1}
  globalThis.cancelAnimationFrame=()=>{}
  const canvas={getContext:()=>({}),getBoundingClientRect:()=>({left:0,top:0,width:800,height:600}),setPointerCapture(){},addEventListener:(name,handler)=>{listeners[name]=handler}}
  controller=createKitchenMinigames({canvas,saved,service:kitchenServiceSnapshot(service),eventTarget:new EventTarget(),isRunning:()=>running,
    onWork:work=>{
      works.push(work)
      if(work.type === 'prep')service=addKitchenPrep(service,work).state
      else {const paid=consumeServiceTicket(service,work);service=paid.state;if(paid.accepted)coins+=work.kind === 'dishwashing'?dishEarnings():sodaEarnings(work.score)}
      controller.setService(kitchenServiceSnapshot(service))
    },onStir:radians=>{service=stirKitchenSauce(service,radians);controller.setService(kitchenServiceSnapshot(service))}})
  return {controller,works,get service(){return service},get coins(){return coins},setRunning:value=>{running=value},
    advance:ms=>{time+=ms;frame(time)},pointer:(type,x,y)=>listeners[`pointer${type}`]({clientX:x,clientY:y,pointerId:1}),
    close(){if(closed)return;closed=true;controller.destroy();globalThis.performance=originals.performance;globalThis.Image=originals.Image;globalThis.requestAnimationFrame=originals.raf;globalThis.cancelAnimationFrame=originals.caf}}
}
test('each completed dough skin becomes usable immediately, including the last skin, and reload does not duplicate it',()=>{
  const h=harness({games:{doughToss:{stage:'landing',doughSize:1,completedCount:4,landingAt:{offset:-500},runToken:'dough-run'}}})
  try {
    h.advance(16);assert.equal(h.service.doughs,1);assert.equal(h.works.length,1)
    assert.equal(h.controller.getDashboard().games.doughToss.completed,true)
    h.advance(1000);assert.equal(h.service.doughs,1)
    const save=JSON.parse(JSON.stringify(h.controller.getSavedState()))
    const service=h.service;h.close()
    const reload=harness(save,service)
    try {reload.advance(2000);assert.equal(reload.service.doughs,1);assert.equal(reload.works.length,0)}finally{reload.close()}
  } finally {h.close()}
})
test('burning cannot be reset or phase-skipped and it freezes dough animation',()=>{
  const burning=advanceKitchenHeat(stocked(),240000)
  const h=harness({active:'doughToss',games:{doughToss:{stage:'airborne',airStart:{offset:0},airDuration:900}}},burning)
  try {
    assert.equal(h.controller.reset('saucePot'),false);assert.equal(h.controller.reset('doughToss'),false)
    for(const phase of ['night','morning','noon'])h.controller.setPhase(phase)
    h.advance(2000);assert.equal(h.controller.getDashboard().games.saucePot.hold.key,'smoking')
    assert.equal(h.controller.getDashboard().games.doughToss.stage,'airborne')
    assert.equal(h.service.doughs,5)
  } finally {h.close()}
})
test('station pause freezes a partially airborne skin rather than catching up on return',()=>{
  const h=harness({games:{doughToss:{stage:'airborne',airStart:{offset:0},airDuration:900}}})
  try {
    h.setRunning(false);h.advance(50000)
    h.setRunning(true);h.advance(100)
    assert.equal(h.controller.getDashboard().games.doughToss.stage,'airborne')
    h.advance(900);assert.equal(h.controller.getDashboard().games.doughToss.stage,'landing')
  } finally {h.close()}
})
test('a rinsed dish pays two coins once; resetting/reloading cannot manufacture new dishes',()=>{
  const h=harness({active:'dishwashing',games:{dishwashing:{stage:'rinse',remaining:1,target:1,grime:[],runToken:'wash'}}},createKitchenService({dirtyDishes:1}))
  try {
    h.pointer('down',400,150);for(let i=0;i<17;i++)h.advance(80)
    assert.equal(h.coins,2);assert.equal(h.service.dirtyDishes,0)
    h.controller.reset('dishwashing');h.advance(5000)
    assert.equal(h.coins,2);assert.equal(h.controller.getDashboard().games.dishwashing.stage,'empty')
  } finally {h.close()}
})
test('a paid soda consumes its real ticket before the next cup/reset',()=>{
  const h=harness({active:'drinkPour',games:{drinkPour:{stage:'pour',fill:.76,flavor:'cola',runToken:'soda'}}},createKitchenService({drinkTickets:1}))
  try {
    h.pointer('down',680,480);assert.equal(h.coins,8);assert.equal(h.service.drinkTickets,0)
    h.controller.reset('drinkPour');h.pointer('down',680,480)
    assert.equal(h.coins,8);assert.equal(h.controller.getDashboard().games.drinkPour.stage,'empty')
  } finally {h.close()}
})
test('pesto completes by cold stirring without simmering or changing tomato heat',()=>{
  const initial=advanceKitchenHeat(stocked(),190000)
  const h=harness({active:'saucePot',games:{saucePot:{kind:'pesto',stage:'stir',stirTravel:Math.PI*6,runToken:'pesto'}}},initial)
  try {
    h.pointer('down',500,326);h.pointer('move',400,426)
    assert.equal(h.controller.getDashboard().games.saucePot.stage,'complete')
    assert.equal(h.service.sauces.pesto,10);assert.equal(h.service.heatMs,190000)
  } finally {h.close()}
})
test('actual pizza entry, oven, cutting and serving guard against burning and persist both kitchen and pizza',()=>{
  const game=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  for(const fn of ['pizzaPointerDown','handlePizzaNext','startBake'])assert.match(game.slice(game.indexOf(`function ${fn}`),game.indexOf(`function ${fn}`)+160),/ensurePizzaPrep/)
  for(const fn of ['pizzaPointerMove','finishBake','finishPizza'])assert.match(game.slice(game.indexOf(`function ${fn}`),game.indexOf(`function ${fn}`)+200),/currentPizzaGate/)
  assert.match(game,/kitchenService:state.kitchenService/);assert.match(game,/pizzaProject:savePizzaProject/)
  assert.match(game,/kitchenIsRunning\(\) && !state.kitchenService.burning/)
})
