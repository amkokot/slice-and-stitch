import { createGameClock, advanceGameClock } from './game-clock.js'
import { createProgressionState, purchaseUpgrade, recordPizzaResult, recordGarmentResult, recordServiceIncome } from './progression.js'
import { createPatternLibrary, purchasePattern, markPatternUsed } from './pattern-library.js'
import { fashionInventoryFor } from './fashion-workflow.js'
import { FASHION_SCHEMATICS, FASHION_FABRICS, FASHION_MODIFICATIONS, boutiqueCatalogForDay } from './fashion-catalog.js'
import { createKitchenService, advanceKitchenHeat, stirKitchenSauce, reservePizzaPrep, completeKitchenPizza, addKitchenPrep, consumeServiceTicket } from './kitchen-service.js'
import { createCharacterState, addCraftedGarment, addCatalogGarment } from './character-model.js'
import { compatibleFashionFabric, effectiveSchematic, compatibleFashionModifications } from './fashion-construction.js'
import { createDayLedger, recordDayActivity, rollDayLedger, fashionProjectQuote, pizzaEarnings, reputationAward, dishEarnings, sodaEarnings } from './economy.js'

export const COOP_VERSION=1
export const MAX_ROOM_PLAYERS=4
const copy=value=>JSON.parse(JSON.stringify(value))
const number=(value,min=0,max=10000000)=>Math.max(min,Math.min(max,Number.isFinite(Number(value))?Number(value):min))
const identifier=value=>typeof value==='string' && /^[\w:-]{1,100}$/.test(value)

export function createSharedSession(seed={}, {roomCode,sessionId,hostPlayerId}={}) {
  const progression=createProgressionState(seed.progression)
  const clock=createGameClock(seed.clock)
  const character=createCharacterState(seed.character || {})
  const kitchen=createKitchenService(seed.kitchenService)
  const reservation=kitchen.reservation;kitchen.reservation=null
  return {version:COOP_VERSION,roomCode,sessionId,hostPlayerId,revision:0,
    coins:number(seed.coins ?? 120),reputation:number(seed.reputation),reputationCarry:number(seed.reputationCarry,0,1),
    progression,clock,ledger:createDayLedger(seed.ledger,clock.day,seed.coins ?? 120),
    patternLibrary:createPatternLibrary(seed.patternLibrary,{project:seed.fashionProject}),
    fashionInventory:fashionInventoryFor(clock.day,seed.reputation || 0,progression.atelierLevel,seed.fashionInventory),
    wardrobe:[...character.wardrobe],customGarments:copy(character.customGarments),kitchenService:kitchen,
    reservations:reservation && hostPlayerId ? {[hostPlayerId]:reservation} : {},
    projects:seed.fashionProject?.materialConsumed && !seed.fashionProject.completed && hostPlayerId
      ? {[seed.fashionProject.projectId]:{playerId:hostPlayerId,schematicId:seed.fashionProject.schematic.id,paidCost:seed.fashionProject.paidCost || 0}} : {},
    stations:{},completedPizzas:{},receipts:[],savedAt:Date.now()}
}

export function validSharedSession(state,roomCode) {
  return Boolean(state?.version===COOP_VERSION && state.roomCode===roomCode && identifier(state.sessionId) && identifier(state.hostPlayerId)
    && Number.isSafeInteger(state.revision) && state.revision>=0 && Number.isFinite(state.coins) && state.coins>=0
    && Number.isFinite(state.reputation) && state.reputation>=0
    && Number.isSafeInteger(state.clock?.day) && state.clock.day>=1 && Number.isFinite(state.clock?.elapsedSeconds)
    && Array.isArray(state.progression?.ownedUpgrades) && Array.isArray(state.wardrobe) && Array.isArray(state.customGarments)
    && Array.isArray(state.patternLibrary?.owned) && Array.isArray(state.fashionInventory?.schematics)
    && Number.isFinite(state.kitchenService?.doughs) && state.kitchenService?.sauces
    && state.reservations && !Array.isArray(state.reservations) && state.projects && !Array.isArray(state.projects)
    && state.stations && !Array.isArray(state.stations) && Array.isArray(state.receipts))
}

// Only the host runs this reducer. Clients submit small semantic commands;
// pointer paths, oven frames and unfinished projects never cross the network.
export function applyRoomCommand(current,command) {
  const fail=reason=>({ok:false,reason,state:current})
  if(!identifier(command?.id) || !identifier(command?.playerId)) return fail('Invalid room command.')
  const duplicate=current.receipts.find(record=>record.id===command.id && record.playerId===command.playerId)
  if(duplicate) return {...copy(duplicate.result),state:current,duplicate:true}
  const state=copy(current),data=command.data || {},playerId=command.playerId
  let result={ok:true},spent=0
  const localKitchen=()=>({...state.kitchenService,reservation:state.reservations[playerId] || null})
  const saveKitchen=next=>{state.kitchenService={...next,reservation:null}}
  const character=()=>createCharacterState({wardrobe:state.wardrobe,customGarments:state.customGarments})
  const saveCharacter=next=>{state.wardrobe=[...next.wardrobe];state.customGarments=copy(next.customGarments)}
  switch(command.type) {
    case 'buy-pattern': {
      const purchase=purchasePattern(state.patternLibrary,data.id,state.progression.atelierLevel,state.coins,state.fashionInventory)
      if(!purchase.ok) return fail(purchase.reason)
      state.patternLibrary=purchase.library;spent=purchase.price
      result={ok:true,pattern:purchase.pattern,price:spent};break
    }
    case 'buy-garment': {
      if(state.wardrobe.includes(data.id)) return fail('This piece is already in the shared chest.')
      const offer=boutiqueCatalogForDay(state.clock.day,state.reputation,state.progression.atelierLevel).find(g=>g.id===data.id)
      if(!offer || offer.locked || !offer.availableToday) return fail('This garment is not unlocked yet.')
      spent=offer.price;saveCharacter(addCatalogGarment(character(),data.id));result={ok:true,price:spent};break
    }
    case 'buy-upgrade': {
      const purchase=purchaseUpgrade(state.progression,data.id,state.coins)
      if(!purchase.ok) return fail(purchase.reason)
      state.progression=purchase.progression;spent=purchase.upgrade.cost;result={ok:true,upgrade:purchase.upgrade};break
    }
    case 'start-fashion': {
      if(!identifier(data.projectId)) return fail('Invalid project.')
      const existing=state.projects[data.projectId]
      if(existing) return existing.playerId===playerId ? {ok:true,state:current,paidCost:existing.paidCost} : fail('That project belongs to another player.')
      const schematic=FASHION_SCHEMATICS.find(p=>p.id===data.schematicId)
      const baseGarment=data.baseGarmentId ? character().customGarments.find(g=>g.id===data.baseGarmentId) || boutiqueCatalogForDay().find(g=>g.id===data.baseGarmentId && state.wardrobe.includes(g.id)) : null
      const alterationMode=Boolean(data.baseGarmentId)
      const fabric=alterationMode && baseGarment ? {id:'original-cloth',cost:0,quality:baseGarment.quality || 70}
        : FASHION_FABRICS.find(f=>f.id===data.fabricId && f.unlockLevel<=state.progression.atelierLevel)
      if(!schematic || (!alterationMode && !state.patternLibrary.owned.includes(schematic.id))) return fail('Buy this pattern before using the cutting table.')
      if(!fabric || (!alterationMode && !compatibleFashionFabric(schematic,fabric)) || (alterationMode && !baseGarment)) return fail('Choose a suitable owned garment and material.')
      const modifications=[...new Set(data.modifications || [])].slice(0,3)
      if(modifications.some(id=>!compatibleFashionModifications(schematic).some(m=>m.id===id && m.unlockLevel<=state.progression.atelierLevel))) return fail('That alteration is not available for this construction.')
      const project={schematic,fabric,modifications,alterationMode,baseGarment}
      if(!alterationMode && !compatibleFashionFabric(effectiveSchematic(project),fabric)) return fail('Choose a suitable material for the altered construction.')
      if(alterationMode && !modifications.length) return fail('Choose an alteration first.')
      const quote=fashionProjectQuote({fabric,units:schematic.materialUnits,alteration:alterationMode,
        modificationCost:modifications.reduce((sum,id)=>sum+FASHION_MODIFICATIONS.find(m=>m.id===id).cost,0),savings:number(data.materialSavings,0,.15)},state.fashionInventory)
      spent=quote.cost
      if(!alterationMode) {
        state.fashionInventory.remaining[fabric.id]=Math.max(0,(state.fashionInventory.remaining[fabric.id] || 0)-quote.stockUsed)
        state.patternLibrary=markPatternUsed(state.patternLibrary,schematic.id)
      }
      state.projects[data.projectId]={playerId,schematicId:schematic.id,paidCost:spent,baseGarmentId:baseGarment?.id || null}
      result={ok:true,paidCost:spent};break
    }
    case 'complete-fashion': {
      const paid=state.projects[data.projectId]
      if(!paid || paid.playerId!==playerId) return fail('This project has already been collected or was not paid for.')
      const garment=data.garment
      if(!garment || garment.customization?.projectId!==data.projectId || garment.schematicId!==paid.schematicId) return fail('The garment does not match its paid project.')
      saveCharacter(addCraftedGarment(character(),{garment}))
      delete state.projects[data.projectId]
      state.progression=recordGarmentResult(state.progression,{accuracy:number(data.accuracy,0,100),quality:number(garment.quality,0,100)})
      state.ledger=recordDayActivity(state.ledger,{garments:1});break
    }
    case 'reserve-pizza': {
      if(!identifier(data.pizzaId)) return fail('Invalid pizza.')
      const reserved=reservePizzaPrep(localKitchen(),data.pizzaId,data.sauce)
      if(!reserved.ok) return fail(reserved.gate?.copy || 'Prepared dough and sauce are needed.')
      saveKitchen(reserved.state);state.reservations[playerId]=reserved.state.reservation;break
    }
    case 'complete-pizza': {
      const previous=state.completedPizzas?.[data.pizzaId]
      if(previous?.playerId===playerId) return {ok:true,payout:previous.payout,state:current,duplicate:true}
      const completed=completeKitchenPizza(localKitchen(),data.pizzaId)
      if(!completed.ok) return fail(state.kitchenService.burning ? 'Rescue the sauce before serving.' : 'This pizza is not reserved or has already been served.')
      saveKitchen(completed.state);delete state.reservations[playerId]
      const quality=number(data.quality,0,100)
      const payout=pizzaEarnings({tier:data.tierId,quality,seconds:number(data.seconds,1,3600),setBonus:number(data.tipBonus,0,.15),reputation:state.reputation})
      state.coins+=payout;state.ledger=recordDayActivity(state.ledger,{earned:payout,pizzas:1})
      const rep=reputationAward(quality,number(data.reputationBonus,0,.08),state.reputationCarry)
      state.reputation+=rep.gained;state.reputationCarry=rep.carry
      state.progression=recordPizzaResult(state.progression,{quality,payout})
      state.completedPizzas={...(state.completedPizzas || {}),[data.pizzaId]:{playerId,payout}}
      result={ok:true,payout};break
    }
    case 'kitchen-work': {
      const work=data.work
      if(!identifier(work?.id)) return fail('Invalid kitchen receipt.')
      if(work.type==='prep') {
        if(!['dough','sauce'].includes(work.kind)) return fail('Unknown preparation task.')
        if(work.kind==='sauce' && state.stations.saucePot?.playerId!==playerId) return fail('Claim the sauce pot before preparing a batch.')
        const prep=addKitchenPrep(state.kitchenService,work)
        if(!prep.added) return fail(state.kitchenService.burning?'Rescue the burning sauce first.':'This batch is already saved or the prep shelf is full.')
        saveKitchen(prep.state);result={ok:true,added:prep.added}
      } else {
        if(!['dishwashing','drinkPour'].includes(work.kind)) return fail('Unknown service task.')
        const used=consumeServiceTicket(state.kitchenService,work)
        if(!used.accepted) return fail('Another player already completed the last service ticket.')
        saveKitchen(used.state)
        const payout=work.kind==='dishwashing'?dishEarnings():sodaEarnings(work.score)
        state.coins+=payout;state.ledger=recordDayActivity(state.ledger,{earned:payout,bonusCoins:payout,dishes:work.kind==='dishwashing'?1:0,sodas:work.kind==='drinkPour'?1:0})
        state.progression=recordServiceIncome(state.progression,payout);result={ok:true,payout}
      }
      break
    }
    case 'claim-station': {
      if(!['saucePot','doughToss','dishwashing','drinkPour','pizza','fashion'].includes(data.station)) return fail('Unknown work station.')
      const taken=state.stations[data.station]
      if(data.station==='saucePot' && taken && taken.playerId!==playerId) return fail('Another player is using the sauce pot. Try another task for now.')
      for(const [id,owner] of Object.entries(state.stations)) if(owner.playerId===playerId) delete state.stations[id]
      if(data.station==='saucePot') state.stations[data.station]={playerId,recipe:data.recipe==='pesto'?'pesto':'tomato'}
      break
    }
    case 'release-station':
      for(const [id,owner] of Object.entries(state.stations)) if(owner.playerId===playerId) delete state.stations[id]
      break
    case 'stir-sauce':
      if(state.stations.saucePot?.playerId!==playerId) return fail('Use the sauce-pot station to stir.')
      for(let turns=number(data.turns,0,2);turns>0;turns-=.5) state.kitchenService=stirKitchenSauce(state.kitchenService,Math.min(.5,turns)*Math.PI*2)
      break
    case 'set-clock-paused':
      if(data.paused && playerId!==state.hostPlayerId) return fail('Only the host can pause the shared town clock.')
      state.clock.paused=Boolean(data.paused);break
    default:return fail('Unknown room action.')
  }
  if(spent>state.coins) return fail(`The shared till needs ${Math.ceil(spent-state.coins)} more coins.`)
  if(spent) {state.coins-=spent;state.ledger=recordDayActivity(state.ledger,{spent})}
  state.fashionInventory=fashionInventoryFor(state.clock.day,state.reputation,state.progression.atelierLevel,state.fashionInventory)
  state.revision++;state.savedAt=Date.now()
  state.receipts.push({id:command.id,playerId,result:copy(result)});state.receipts=state.receipts.slice(-512)
  return {...result,state}
}

export function advanceSharedTime(current,seconds,{kitchenActive=false}={}) {
  const state=copy(current)
  state.clock=advanceGameClock(state.clock,number(seconds,0,10))
  state.kitchenService=advanceKitchenHeat(state.kitchenService,number(seconds,0,10)*1000,
    {running:kitchenActive && !state.clock.paused,diffuser:state.progression.ownedUpgrades.includes('sauce-diffuser')})
  if(state.clock.day!==current.clock.day) {
    state.fashionInventory=fashionInventoryFor(state.clock.day,state.reputation,state.progression.atelierLevel)
    state.ledger=rollDayLedger(state.ledger,state.clock.day,state.coins)
  }
  state.revision++;state.savedAt=Date.now();return state
}

export function sharedGameSave(shared,privateSave={},playerId) {
  return {...privateSave,coins:shared.coins,reputation:shared.reputation,reputationCarry:shared.reputationCarry,
    progression:copy(shared.progression),clock:copy(shared.clock),fashionDay:shared.clock.day,ledger:copy(shared.ledger),
    patternLibrary:copy(shared.patternLibrary),fashionInventory:copy(shared.fashionInventory),
    kitchenService:{...copy(shared.kitchenService),reservation:copy(shared.reservations[playerId] || null)}}
}
