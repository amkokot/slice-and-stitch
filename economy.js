import {calculatePayout, clamp} from './model.js'
import {DAY_SECONDS} from './game-clock.js'

export const ECONOMY_BALANCE = Object.freeze({startingCoins:120, dailyDiscount:.1, dayMinutes:DAY_SECONDS/60,
  pizzaMinutes:1, doughBatchMinutes:.4, sauceBatchMinutes:.25, dishMinutes:.17, drinkMinutes:.1,
  garmentMinutes:3, browsingMinutes:1.5,
  maxTipBonus:.15, maxMaterialSavings:.15, maxReputationBonus:.08, maxLoyaltyBonus:.06,
  tierBases:Object.freeze({starter:22, garden:28, artisan:34})})
const whole = value => Math.max(0, Math.round(Number.isFinite(Number(value)) ? Number(value) : 0))

// Shared by the actual payout and the journal forecast. Ingredient/prep costs
// are covered by the house in this prototype: payouts are spendable income.
export function loyaltyTipBonus(reputation=0) {return clamp((Number(reputation)||0)/4000,0,ECONOMY_BALANCE.maxLoyaltyBonus)}

export function pizzaEarnings({tier='starter', quality=75, seconds=60, presentation=0, setBonus=0, reputation=0}={}) {
  const speedFactor=clamp(1.16-Math.max(0,seconds-35)/420,.85,1.16)
  return Math.round(calculatePayout({base:ECONOMY_BALANCE.tierBases[tier] || ECONOMY_BALANCE.tierBases.starter,
    foodQuality:quality, speedFactor, presentation:0})
    * (1+clamp(presentation+setBonus,0,ECONOMY_BALANCE.maxTipBonus)+loyaltyTipBonus(reputation)))
}

export function dishEarnings() {return 2}
export function sodaEarnings(score = 0) {
  const quality=clamp(Number(score) || 0,0,100)
  return quality < 40 ? 0 : Math.round(3+(quality-40)/60*5)
}

export function garmentSetEffects(sets=[]) {
  const effects={tipBonus:0,vegetableTipBonus:0,duskTipBonus:0,tailoringFinish:0,reputationBonus:0,materialSavings:0,names:[]}
  const rules={
    'counter-classic':['tipBonus',.04,.07], 'garden-market':['vegetableTipBonus',.05,.09],
    'midnight-rush':['duskTipBonus',.05,.10], 'plum-atelier':['tailoringFinish',3,6],
    'sunday-social':['reputationBonus',.04,.08], 'maker-studio':['materialSavings',.08,.15],
  }
  const applied=new Set()
  for(const set of sets.filter(s=>s.active)) {
    const rule=rules[set.id]
    if(!rule || applied.has(set.id)) continue
    applied.add(set.id); effects[rule[0]]+=rule[set.complete?2:1]; effects.names.push(set.name)
  }
  return effects
}

export function orderGarmentTipBonus(effects, {vegetables=false, phase='morning', presentation=0}={}) {
  return clamp(presentation+effects.tipBonus+(vegetables?effects.vegetableTipBonus:0)
    + (['dusk','night'].includes(phase)?effects.duskTipBonus:0),0,ECONOMY_BALANCE.maxTipBonus)
}

export function reputationAward(quality, bonus=0, carry=0) {
  const amount=Math.max(1,clamp(quality,0,100)/20)*(1+clamp(bonus,0,ECONOMY_BALANCE.maxReputationBonus))+clamp(carry,0,.999999)
  return {gained:Math.floor(amount),carry:amount-Math.floor(amount)}
}

export function incomeForecast(tier='starter', presentation=0, reputation=0) {
  const menu=Array.isArray(tier) && tier.length ? tier : [Array.isArray(tier)?'starter':tier]
  const meanPayout=(quality,minutes)=>menu.reduce((sum,counter)=>sum+pizzaEarnings({tier:counter,quality,seconds:minutes*60,presentation,reputation}),0)/menu.length
  return Object.freeze([
    {id:'relaxed', label:'Relaxed', orders:8, quality:65, pizzaMinutes:1.25, dishes:8, sodas:4},
    {id:'mixed', label:'Service + sewing', orders:12, quality:75, pizzaMinutes:1, dishes:8, sodas:6},
    {id:'service', label:'Service-focused', orders:18, quality:85, pizzaMinutes:.7, dishes:36, sodas:18},
  ].map(plan=>{
    const pizzaGross=Math.round(plan.orders*meanPayout(plan.quality,plan.pizzaMinutes))
    const bonusGross=plan.dishes*dishEarnings()+plan.sodas*sodaEarnings(plan.quality)
    const prepMinutes=Math.ceil(plan.orders/5)*(ECONOMY_BALANCE.doughBatchMinutes+ECONOMY_BALANCE.sauceBatchMinutes)
      +(menu.includes('starter') && menu.some(id=>id !== 'starter') ? ECONOMY_BALANCE.sauceBatchMinutes : 0)
    const serviceMinutes=plan.orders*plan.pizzaMinutes+prepMinutes
      +plan.dishes*ECONOMY_BALANCE.dishMinutes+plan.sodas*ECONOMY_BALANCE.drinkMinutes+Math.floor(plan.orders/2)*.05
    return Object.freeze({...plan,perOrder:meanPayout(plan.quality,plan.pizzaMinutes),pizzaGross,bonusGross,prepMinutes,
      gross:pizzaGross+bonusGross,serviceMinutes})
  }))
}

export function fashionSupplyQuote(fabric, units=1, inventory) {
  const quantity=Math.max(1,whole(units))
  const remaining=whole(inventory?.remaining?.[fabric?.id])
  const offer=inventory?.fabrics?.find(item=>item.id===fabric?.id) || fabric
  const onShelf=Boolean(offer?.featured && remaining>=quantity)
  const retail=whole(fabric?.cost)*quantity
  return Object.freeze({units:quantity, onShelf, retail,
    materialCost:onShelf ? Math.round(retail*(1-ECONOMY_BALANCE.dailyDiscount)) : retail,
    stockUsed:onShelf ? quantity : 0, source:onShelf ? 'Today’s shelf · 10% off' : 'Standard supply · always available'})
}

export function fashionProjectQuote({fabric, units=1, alteration=false, modificationCost=0, savings=0}={}, inventory) {
  const supply=alteration ? {materialCost:0, stockUsed:0, source:'Original cloth preserved'} : fashionSupplyQuote(fabric,units,inventory)
  const cost=Math.max(1,Math.round((supply.materialCost+whole(modificationCost))*(1-clamp(savings,0,.15))))
  return Object.freeze({...supply,cost})
}

export function createDayLedger(saved, day=1, balance=120) {
  const clean = entry => ({day:Math.max(1,whole(entry?.day)||day), openingBalance:whole(entry?.openingBalance),
    earned:whole(entry?.earned), spent:whole(entry?.spent), pizzas:whole(entry?.pizzas), garments:whole(entry?.garments),
    bonusCoins:whole(entry?.bonusCoins), dishes:whole(entry?.dishes), sodas:whole(entry?.sodas), closingBalance:whole(entry?.closingBalance)})
  const current=saved?.current?.day===day ? clean(saved.current) : clean({day,openingBalance:balance})
  return {current, history:(Array.isArray(saved?.history)?saved.history:[]).slice(-7).map(clean)}
}

export function recordDayActivity(ledger, {earned=0, spent=0, pizzas=0, garments=0, bonusCoins=0, dishes=0, sodas=0}={}) {
  return {...ledger,current:{...ledger.current,
    earned:ledger.current.earned+whole(earned),spent:ledger.current.spent+whole(spent),
    pizzas:ledger.current.pizzas+whole(pizzas),garments:ledger.current.garments+whole(garments),
    bonusCoins:(ledger.current.bonusCoins || 0)+whole(bonusCoins), dishes:(ledger.current.dishes || 0)+whole(dishes),sodas:(ledger.current.sodas || 0)+whole(sodas)}}
}

export function rollDayLedger(ledger, day, balance) {
  if(day===ledger.current.day) return ledger
  return {current:createDayLedger(null,day,balance).current,
    history:[...ledger.history,{...ledger.current,closingBalance:whole(balance)}].slice(-7)}
}
