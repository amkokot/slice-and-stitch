// Persistent, authoritative service inventory. Minigames are the interaction
// surfaces; they cannot manufacture income or bypass a burning pot by resetting.
export const KITCHEN_SERVICE_BALANCE = Object.freeze({
  doughCapacity: 10, sauceCapacity: 10, sauceBatch: 5,
  watchMs: 180000, smokingMs: 240000,
  maintenanceTurns: .75, rescueTurns: 1.25,
  dishesPerPizza: 2, drinksPerPizza: 1,
})
const count = (value, max = 10000) => Math.min(max, Math.max(0, Math.floor(Number(value) || 0)))
const sauceKind = value => value === 'pesto' ? 'pesto' : 'tomato'
export function createKitchenService(saved = {}) {
  const heatMs = Math.min(KITCHEN_SERVICE_BALANCE.smokingMs, Math.max(0, Number(saved.heatMs) || 0))
  return {
    version: 1, doughs: count(saved.doughs, 10),
    sauces: { tomato: count(saved.sauces?.tomato, 10), pesto: count(saved.sauces?.pesto, 10) },
    heatMs, burning: Boolean(saved.burning || heatMs >= KITCHEN_SERVICE_BALANCE.smokingMs),
    coolingTurns: Math.max(0, Math.min(1.25, Number(saved.coolingTurns) || 0)),
    dirtyDishes: count(saved.dirtyDishes), drinkTickets: count(saved.drinkTickets),
    drinksServed: count(saved.drinksServed),
    reservation: saved.reservation?.id ? { id: String(saved.reservation.id), sauce: sauceKind(saved.reservation.sauce) } : null,
    receipts: [...new Set((Array.isArray(saved.receipts) ? saved.receipts : []).filter(id => typeof id === 'string'))].slice(-256),
  }
}

export function kitchenHoldState(heatMs = 0, burning = false, coolingTurns = 0) {
  if (burning || heatMs >= KITCHEN_SERVICE_BALANCE.smokingMs) return {
    key: 'smoking', label: 'Sauce burning — cooking stopped', heat: 1,
    rescueProgress: Math.min(1, coolingTurns / KITCHEN_SERVICE_BALANCE.rescueTurns),
  }
  if (heatMs >= KITCHEN_SERVICE_BALANCE.watchMs) return { key: 'watch', label: 'Sauce getting hot — stir soon', heat: .72 }
  return { key: 'safe', label: 'Sauce holding gently', heat: .25 + heatMs / KITCHEN_SERVICE_BALANCE.smokingMs * .45 }
}

export function kitchenServiceSnapshot(state) {
  return { ...state, sauces: { ...state.sauces }, receipts: undefined,
    hold: state.sauces.tomato > 0 || state.burning ? kitchenHoldState(state.heatMs, state.burning, state.coolingTurns) : null }
}

export function advanceKitchenHeat(state, elapsedMs, { running = true, diffuser = false } = {}) {
  if (!running || !state.sauces.tomato || state.burning) return state
  const heatMs = Math.min(KITCHEN_SERVICE_BALANCE.smokingMs, state.heatMs + Math.max(0, Number(elapsedMs) || 0) * (diffuser ? .7 : 1))
  return { ...state, heatMs, burning: heatMs >= KITCHEN_SERVICE_BALANCE.smokingMs }
}

export function stirKitchenSauce(state, radians) {
  if (!state.sauces.tomato && !state.burning) return state
  const coolingTurns = state.coolingTurns + Math.min(Math.PI, Math.abs(Number(radians) || 0)) / (Math.PI * 2)
  const target = state.burning ? KITCHEN_SERVICE_BALANCE.rescueTurns : KITCHEN_SERVICE_BALANCE.maintenanceTurns
  return coolingTurns >= target
    ? { ...state, heatMs: 0, burning: false, coolingTurns: 0 }
    : { ...state, coolingTurns }
}

export function pizzaServiceGate(state, { id, sauce = 'tomato' } = {}) {
  if (state.burning) return { blocked: true, code: 'burning', station: 'saucePot', title: 'Sauce burning · cooking paused', copy: 'Rescue the hot tomato pot. This pizza and its oven progress stay safe while you stir.', action: 'Rescue the sauce' }
  if (state.reservation && state.reservation.id === id) return { blocked: false }
  if (state.reservation) return { blocked: true, code: 'reserved', station: 'pizza', title: 'Finish your current pizza', copy: 'Its prepared dough and sauce are already set aside.', action: 'Return to your pizza' }
  if (!state.doughs) return { blocked: true, code: 'dough', station: 'doughToss', title: 'Prepare a pizza base', copy: 'Toss dough at the prep table. Each finished base makes one pizza.', action: 'Toss dough' }
  if (!state.sauces[sauceKind(sauce)]) return { blocked: true, code: 'sauce', station: 'saucePot', sauce: sauceKind(sauce), title: `${sauce === 'pesto' ? 'Fresh pesto' : 'Tomato sauce'} is needed`, copy: 'Prepare a five-portion batch. One portion is used per pizza, regardless of the requested sauce coverage.', action: sauce === 'pesto' ? 'Make pesto' : 'Make tomato sauce' }
  return { blocked: false }
}

export function reservePizzaPrep(state, id, sauce = 'tomato') {
  if(!id) return {ok:false,state,gate:{blocked:true,code:'invalid'}}
  const gate = pizzaServiceGate(state, { id, sauce })
  if (gate.blocked) return { ok: false, state, gate }
  if (state.reservation?.id === id) return { ok: true, state }
  const kind = sauceKind(sauce)
  const sauces = { ...state.sauces, [kind]: state.sauces[kind] - 1 }
  return { ok: true, state: { ...state, doughs: state.doughs - 1, sauces,
    reservation: { id, sauce: kind }, heatMs: sauces.tomato ? state.heatMs : 0, coolingTurns: sauces.tomato ? state.coolingTurns : 0 } }
}

function receipt(state, id) {
  return { ...state, receipts: [...state.receipts, String(id)].slice(-256) }
}
export function addKitchenPrep(state, { id, kind, sauce = 'tomato', amount = 1 } = {}) {
  if (!id || state.receipts.includes(id) || state.burning) return { state, added: 0 }
  const next = receipt(state, id)
  if (kind === 'dough') {
    const added = Math.min(count(amount, 5), KITCHEN_SERVICE_BALANCE.doughCapacity - state.doughs)
    return { state: { ...next, doughs: state.doughs + added }, added }
  }
  const type = sauceKind(sauce)
  const added = Math.min(count(amount, 5), KITCHEN_SERVICE_BALANCE.sauceCapacity - state.sauces[type])
  return { state: { ...next, sauces: { ...state.sauces, [type]: state.sauces[type] + added },
    heatMs: type === 'tomato' ? 0 : state.heatMs, coolingTurns: type === 'tomato' ? 0 : state.coolingTurns }, added }
}

export function completeKitchenPizza(state, id) {
  if (state.burning || state.reservation?.id !== id || state.receipts.includes(`pizza:${id}`)) return { state, ok: false }
  return { ok: true, state: { ...receipt(state, `pizza:${id}`), reservation: null,
    dirtyDishes: state.dirtyDishes + KITCHEN_SERVICE_BALANCE.dishesPerPizza,
    drinkTickets: state.drinkTickets + KITCHEN_SERVICE_BALANCE.drinksPerPizza } }
}

export function consumeServiceTicket(state, { id, kind } = {}) {
  if (!id || state.receipts.includes(id)) return { state, accepted: false }
  const key = kind === 'dishwashing' ? 'dirtyDishes' : 'drinkTickets'
  if (!state[key]) return { state, accepted: false }
  return { accepted: true, state: { ...receipt(state, id), [key]: state[key] - 1,
    drinksServed: state.drinksServed + (kind === 'drinkPour' ? 1 : 0) } }
}
