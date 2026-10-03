import test from 'node:test'
import assert from 'node:assert/strict'
import { createSharedSession, applyRoomCommand, advanceSharedTime, sharedGameSave, validSharedSession } from '../coop-state.js'
import { FASHION_SCHEMATICS, FASHION_FABRICS, boutiqueCatalogForDay } from '../fashion-catalog.js'
import { compatibleFashionFabric, fashionGarmentDraft } from '../fashion-construction.js'
import { patternPrice } from '../pattern-library.js'
import { createCharacterState, sharedCharacterState } from '../character-model.js'
import { saveRoom, savedRooms, enterSavedRoom, roomSaveKey } from '../coop-saves.js'
import { activeSession, gameStorage, setActiveSession, scopedGameStorage } from '../game-storage.js'
import { playerAccount } from '../player-account.js'
import { positionRoomPlayers, ROOM_SCENES, STATION_SPOTS } from '../coop-positions.js'
import { CoopController } from '../coop-controller.js'
import { nextGameDay } from '../game-clock.js'
import { createChannelTopic, validRoomCode } from '../online-room.js'

class MemoryStorage {
  values=new Map()
  getItem(key) {return this.values.get(key) ?? null}
  setItem(key,value) {this.values.set(key,String(value))}
  removeItem(key) {this.values.delete(key)}
}
const fresh=seed=>createSharedSession(seed,{roomCode:'ABC234',sessionId:'session-1',hostPlayerId:'host'})
let sequence=0
const command=(type,data={},playerId='host',id=`receipt-${++sequence}`)=>({type,data,playerId,id})
const run=(state,type,data,playerId)=>{const result=applyRoomCommand(state,command(type,data,playerId));assert.equal(result.ok,true,result.reason);return result.state}

test('room traffic cannot mix with Whale Run and codes are normalized',()=>{
  assert.equal(validRoomCode(' abc234 '),true)
  assert.equal(validRoomCode('AB0123'),false)
  assert.equal(createChannelTopic('abc234'),'arcade:slice-and-stitch:v1:ABC234')
})
test('one shared till serializes purchases and duplicate receipts never charge twice',()=>{
  let state=fresh()
  const pattern=state.fashionInventory.schematics[0]
  const buy=command('buy-pattern',{id:pattern.id})
  const result=applyRoomCommand(state,buy)
  assert.equal(result.ok,true);state=result.state
  assert.equal(state.coins,120-patternPrice(pattern));assert.ok(state.patternLibrary.owned.includes(pattern.id))
  assert.equal(applyRoomCommand(state,buy).state,state)
  assert.equal(applyRoomCommand(state,command('buy-pattern',{id:pattern.id},'guest')).ok,false)
  const offer=boutiqueCatalogForDay().find(g=>!g.locked && !state.wardrobe.includes(g.id))
  const poor={...state,coins:offer.price-1}
  assert.equal(applyRoomCommand(poor,command('buy-garment',{id:offer.id},'guest')).state,poor)
  assert.equal(poor.wardrobe.includes(offer.id),false)
})
test('separate players reserve dough and sauce exactly once, competing for the last skin',()=>{
  let state=fresh({kitchenService:{doughs:2,sauces:{tomato:2}}})
  const reserve=command('reserve-pizza',{pizzaId:'p1',sauce:'tomato'})
  state=applyRoomCommand(state,reserve).state
  assert.equal(state.kitchenService.doughs,1)
  assert.equal(applyRoomCommand(state,reserve).state,state)
  state=run(state,'reserve-pizza',{pizzaId:'p2',sauce:'tomato'},'guest')
  assert.equal(state.kitchenService.doughs,0);assert.equal(state.kitchenService.sauces.tomato,0)
  assert.equal(applyRoomCommand(state,command('reserve-pizza',{pizzaId:'p3',sauce:'tomato'},'third')).ok,false)
  assert.equal(state.reservations.host.id,'p1');assert.equal(state.reservations.guest.id,'p2')
})
test('completion pays once even with a new request id, and creates shared service demand',()=>{
  let state=fresh({kitchenService:{doughs:1,sauces:{tomato:1}}})
  state=run(state,'reserve-pizza',{pizzaId:'p1',sauce:'tomato'})
  const result=applyRoomCommand(state,command('complete-pizza',{pizzaId:'p1',tierId:'starter',quality:90,seconds:60}))
  assert.equal(result.ok,true,result.reason);state=result.state
  assert.ok(state.coins>120);assert.equal(state.kitchenService.dirtyDishes,2);assert.equal(state.kitchenService.drinkTickets,1)
  assert.equal(applyRoomCommand(state,command('complete-pizza',{pizzaId:'p1',quality:100})).state,state)
  const before=state.coins
  state=run(state,'kitchen-work',{work:{id:'dish-1',type:'bonus',kind:'dishwashing'}},'guest')
  assert.equal(state.coins,before+2);assert.equal(state.kitchenService.dirtyDishes,1)
  assert.equal(applyRoomCommand(state,command('kitchen-work',{work:{id:'dish-1',type:'bonus',kind:'dishwashing'}},'guest')).ok,false)
})
test('a shared hot pot has a single owner and blocks cooking until it is rescued',()=>{
  let state=fresh({kitchenService:{doughs:1,sauces:{tomato:2}}})
  state=run(state,'claim-station',{station:'saucePot'},'guest')
  assert.equal(applyRoomCommand(state,command('claim-station',{station:'saucePot'})).ok,false)
  for(let i=0;i<24;i++) state=advanceSharedTime(state,10,{kitchenActive:true})
  assert.equal(state.kitchenService.burning,true)
  assert.equal(applyRoomCommand(state,command('reserve-pizza',{pizzaId:'p1'})).ok,false)
  assert.equal(applyRoomCommand(state,command('stir-sauce',{turns:1.25})).ok,false)
  state=run(state,'stir-sauce',{turns:1.25},'guest')
  assert.equal(state.kitchenService.burning,false)
  state=run(state,'release-station',{},'guest')
  state=run(state,'claim-station',{station:'saucePot'})
  assert.equal(state.stations.saucePot.playerId,'host')
})
test('owned patterns and paid material create a garment in every player’s shared chest',()=>{
  const schematic=FASHION_SCHEMATICS.find(p=>p.unlockLevel===1)
  const fabric=FASHION_FABRICS.find(f=>f.unlockLevel===1 && compatibleFashionFabric(schematic,f))
  let state=fresh({coins:200,patternLibrary:{owned:[schematic.id]}})
  state=run(state,'start-fashion',{projectId:'dress-1',schematicId:schematic.id,fabricId:fabric.id,modifications:[]},'guest')
  const paid=state.coins
  state=run(state,'start-fashion',{projectId:'dress-1',schematicId:schematic.id,fabricId:fabric.id},'guest')
  assert.equal(state.coins,paid)
  const garment={...fashionGarmentDraft({projectId:'dress-1',schematic,fabric,accentColor:'#eadab9',modifications:[]}),schematicId:schematic.id,quality:88}
  state=run(state,'complete-fashion',{projectId:'dress-1',garment,accuracy:88},'guest')
  assert.equal(state.customGarments.length,1)
  assert.ok(sharedCharacterState({name:'Friend'},state).wardrobe.includes(state.customGarments[0].id))
  assert.equal(state.coins,paid);assert.equal(state.projects['dress-1'],undefined)
  assert.equal(applyRoomCommand(state,command('complete-fashion',{projectId:'dress-1',garment},'guest')).ok,false)
})
test('joint saves preserve private work, room inventory and each player’s own reservation',()=>{
  const state=fresh({kitchenService:{doughs:2,sauces:{tomato:2}}})
  const reserved=run(state,'reserve-pizza',{pizzaId:'my-pizza'},'guest')
  const guest=sharedGameSave(reserved,{fashionProject:{projectId:'private'},pizzaProject:{id:'my-pizza'}},'guest')
  assert.equal(guest.fashionProject.projectId,'private');assert.equal(guest.kitchenService.reservation.id,'my-pizza')
  assert.equal(sharedGameSave(reserved,{},'host').kitchenService.reservation,null)
  const wardrobe=createCharacterState().wardrobe
  const foreign=boutiqueCatalogForDay().find(g=>!wardrobe.includes(g.id))
  const personal=sharedCharacterState({name:'My name',equipped:{[foreign.slot]:foreign.id}},reserved)
  assert.equal(personal.profile.name,'My name');assert.equal(personal.wardrobe.includes(foreign.id),false)
})
test('solo and room saves are isolated and older snapshots never replace newer ones',()=>{
  const storage=new MemoryStorage(),previous=globalThis.localStorage
  globalThis.localStorage=storage
  try {
    gameStorage().setItem('progress','solo')
    const state=fresh(),account=playerAccount(storage);state.hostPlayerId=account.id
    enterSavedRoom(state,'host',{profile:{name:'Host'}},storage)
    assert.equal(activeSession(storage).roomCode,state.roomCode)
    gameStorage().setItem('progress','joint')
    setActiveSession(null,storage);assert.equal(gameStorage().getItem('progress'),'solo')
    assert.equal(storage.getItem('slice-and-stitch.coop.ABC234.progress'),'joint')
    assert.equal(saveRoom({...state,revision:5},'host',storage),true)
    assert.equal(saveRoom({...state,revision:2},'guest',storage),false)
    assert.equal(JSON.parse(storage.getItem(roomSaveKey(state.roomCode))).revision,5)
    assert.equal(savedRooms(storage).length,1)
    assert.equal(validSharedSession(state,state.roomCode),true)
    assert.equal(saveRoom(state,'host',null),false)
  } finally {globalThis.localStorage=previous}
})
test('four players have stable, separate floor spots in every scene and active stations have priority',()=>{
  for(const sceneId of ROOM_SCENES) {
    const members=Array.from({length:4},(_,i)=>({playerId:`player-${i}`,sceneId,activity:'idle'}))
    for(const station of [null,...Object.entries(STATION_SPOTS).filter(([,s])=>s.sceneId===sceneId).map(([id])=>id)]) {
      members[0].activity=station || 'idle'
      const positions=positionRoomPlayers(members)
      assert.deepEqual(positions,positionRoomPlayers([...members].reverse()))
      assert.equal(new Set(positions.map(p=>`${p.x}:${p.y}`)).size,4)
      assert.ok(positions.every(p=>p.x>=10 && p.x<=92 && p.y<=89))
      for(let i=0;i<4;i++) for(let j=i+1;j<4;j++) assert.ok(Math.abs(positions[i].x-positions[j].x)>=14 || Math.abs(positions[i].y-positions[j].y)>=22,`${sceneId} ${station}`)
    }
  }
})
test('pagehide cannot leak a departing room save into solo or overwrite rejoined private work',()=>{
  const storage=new MemoryStorage(),solo=scopedGameStorage(storage,null)
  solo.setItem('progress','solo-120')
  const room=scopedGameStorage(storage,{roomCode:'ABC234'})
  room.setItem('progress','joint-117')
  setActiveSession(null,storage)
  room.setItem('progress','joint-pagehide')
  assert.equal(solo.getItem('progress'),'solo-120')
  setActiveSession({roomCode:'ABC234',role:'guest'},storage)
  solo.setItem('progress','solo-pagehide')
  assert.equal(room.getItem('progress'),'joint-pagehide')
})
test('sleep starts tomorrow without granting income, losing work, or extinguishing the pot',()=>{
  const clock=nextGameDay({day:4,elapsedSeconds:825,paused:true})
  assert.deepEqual(clock,{day:5,elapsedSeconds:0,paused:false})
  let state=fresh({coins:184,kitchenService:{doughs:2,sauces:{tomato:4},burning:true},patternLibrary:{owned:['service-apron']}})
  state.projects['paid-project']={playerId:'host',paidCost:10,schematicId:'service-apron'}
  const original=structuredClone(state)
  state=run(state,'go-to-bed',{day:1,players:['host']})
  assert.equal(state.clock.day,2);assert.equal(state.clock.elapsedSeconds,0)
  assert.equal(state.coins,184);assert.deepEqual(state.projects,original.projects)
  assert.deepEqual(state.kitchenService,original.kitchenService)
  assert.deepEqual(state.patternLibrary.owned,original.patternLibrary.owned)
  assert.equal(state.ledger.history.length,1)
  assert.equal(applyRoomCommand(state,command('go-to-bed',{day:1,players:['host']})).ok,false)
})
test('every connected player must sleep; cancelling or an awake host prevents a day skip',()=>{
  let state=fresh(),roster=['host','guest']
  state=run(state,'go-to-bed',{day:1,players:roster},'guest')
  assert.equal(state.clock.day,1);assert.equal(state.sleeping.guest,true)
  assert.equal(applyRoomCommand(state,command('claim-station',{station:'pizza'},'guest')).ok,false)
  state=run(state,'wake-up',{},'guest')
  assert.equal(state.sleeping.guest,undefined)
  state=run(state,'go-to-bed',{day:1,players:roster})
  assert.equal(state.clock.day,1)
  state=run(state,'go-to-bed',{day:1,players:roster},'guest')
  assert.equal(state.clock.day,2);assert.deepEqual(state.sleeping,{})
})
test('an awake player disconnecting no longer blocks sleeping players, but guests cannot alter the roll call',()=>{
  let state=fresh()
  state=run(state,'go-to-bed',{day:1,players:['host','guest']})
  assert.equal(applyRoomCommand(state,command('reconcile-sleep',{players:['guest']},'guest')).ok,false)
  state=run(state,'reconcile-sleep',{players:['host']})
  assert.equal(state.clock.day,2)
})

class FakeNetwork {
  rooms=[]
  factory=options=>{
    const room={options,profile:options.profile,
      connect:async()=>{this.rooms.push(room);options.onStatus('connected');this.sync()},
      send:async(type,payload)=>{for(const other of this.rooms) if(other!==room) other.options.onMessage({type,payload,connectionId:options.connectionId})},
      track:async profile=>{room.profile=profile;this.sync()},
      close:async()=>{this.rooms=this.rooms.filter(r=>r!==room);options.onStatus('closed');this.sync()},
    };return room
  }
  sync() {for(const room of this.rooms) room.options.onPresence(this.rooms.map(r=>r.profile))}
}
test('connected host and guest converge, concurrent purchases serialize, and rejoining gets the latest save',async()=>{
  const network=new FakeNetwork(),hostStorage=new MemoryStorage(),guestStorage=new MemoryStorage()
  const host=new CoopController({roomCode:'ABC234',role:'host',playerId:'host',connectionId:'host-connection',profile:{name:'Host'},seed:fresh(),storage:hostStorage,transportFactory:network.factory})
  const guest=new CoopController({roomCode:'ABC234',role:'guest',playerId:'guest',connectionId:'guest-connection',profile:{name:'Guest'},storage:guestStorage,transportFactory:network.factory})
  let returning
  try {
    await host.connect();await guest.connect()
    const pattern=host.state.fashionInventory.schematics[0]
    const results=await Promise.all([host.transact('buy-pattern',{id:pattern.id}),guest.transact('buy-pattern',{id:pattern.id})])
    assert.equal(results.filter(r=>r.ok).length,1)
    assert.deepEqual(guest.state,host.state)
    await guest.transact('go-to-bed',{day:1,players:['guest']})
    assert.equal(host.state.clock.day,1,'the host ignores a guest-supplied roster')
    await host.transact('go-to-bed',{day:1})
    assert.equal(host.state.clock.day,2);assert.equal(guest.state.clock.day,2)
    const coins=host.state.coins
    await guest.close()
    assert.equal(host.state.coins,coins)
    returning=new CoopController({roomCode:'ABC234',role:'guest',playerId:'guest',connectionId:'returning',profile:{name:'Guest'},seed:JSON.parse(guestStorage.getItem(roomSaveKey('ABC234'))),storage:guestStorage,transportFactory:network.factory})
    await returning.connect();assert.equal(returning.state.coins,coins)
    await host.close();assert.equal(returning.ready,false)
    const unavailable=await returning.transact('buy-pattern',{id:'unknown'})
    assert.equal(unavailable.ok,false)
    await returning.transact('kitchen-work',{work:{id:'offline-dish',type:'bonus',kind:'dishwashing'}})
    assert.equal(returning.outbox.length,1,'a completion racing a disconnect is retained')
  } finally {await returning?.close();await guest.close();await host.close()}
})
