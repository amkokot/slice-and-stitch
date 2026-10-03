import { generateNpcAppearance } from './character-v2/npc-generator.js'

export const SHIFT_EVENT_NAME = 'slice-and-stitch:shift'

export const CUSTOMER_CATALOG = Object.freeze([
  Object.freeze({
    name: 'Lena', preferredTier: 'starter', travelMs: 6200,
    appearance: Object.freeze({ skin: '#8e563c', hair: '#2f2424', hairStyle: 'curls', top: '#775070', topAccent: '#efc776', bottom: '#3e5260', shoes: '#efe3c7' }),
  }),
  Object.freeze({
    name: 'Nico', preferredTier: 'garden', travelMs: 7000,
    appearance: Object.freeze({ skin: '#d79a6d', hair: '#5c382a', hairStyle: 'crop', top: '#397d78', topAccent: '#f0d4a4', bottom: '#4e5368', shoes: '#ead8bd' }),
  }),
  Object.freeze({
    name: 'June', preferredTier: 'starter', travelMs: 6600,
    appearance: Object.freeze({ skin: '#6f432f', hair: '#241f2b', hairStyle: 'bun', top: '#ba5b48', topAccent: '#f0cf80', bottom: '#3f6258', shoes: '#f0dfbf', accessory: '#e5b85d', accessoryAccent: '#a6483f', accessoryCut: 'scarf', hasAccessory: true }),
  }),
  Object.freeze({
    name: 'Ari', preferredTier: 'garden', travelMs: 7600,
    appearance: Object.freeze({ skin: '#c88760', hair: '#8a4e35', hairStyle: 'bob', top: '#496d58', topAccent: '#f0c56c', bottom: '#76506f', shoes: '#e9dcc4' }),
  }),
  Object.freeze({
    name: 'Sol', preferredTier: 'starter', travelMs: 6800,
    appearance: Object.freeze({ skin: '#a96749', hair: '#332629', hairStyle: 'ponytail', top: '#d17a55', topAccent: '#fff0c8', bottom: '#455f72', shoes: '#eee0c5' }),
  }),
])

function copy(value) {
  return JSON.parse(JSON.stringify(value))
}

function clampWhole(value, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) {
  return Math.min(maximum, Math.max(minimum, Math.round(Number(value) || 0)))
}

export function createPizzeriaShift({ maxQueue = 5, catalog = CUSTOMER_CATALOG } = {}) {
  const listeners = new Set()
  let nextCustomer = 1
  let catalogCursor = 0
  let dirtyDishes = 0
  let approaching = []
  let queue = []
  let served = []
  let currentId = null

  function snapshot() {
    return Object.freeze({
      maxQueue,
      nextCustomer,
      catalogCursor,
      dirtyDishes,
      currentId,
      approaching: copy(approaching),
      queue: copy(queue),
      served: copy(served),
    })
  }

  function publish(type, detail = {}) {
    const event = Object.freeze({ type, detail: copy(detail), snapshot: snapshot() })
    listeners.forEach((listener) => listener(event))
    return event
  }

  function nextProfile(overrides = {}) {
    const profile = catalog[catalogCursor % catalog.length] || CUSTOMER_CATALOG[0]
    catalogCursor += 1
    const id = overrides.id || `customer-${nextCustomer++}`
    const trend = overrides.trend || (profile.preferredTier === 'garden' ? 'garden' : 'classic')
    const generatedAppearance = generateNpcAppearance(`pizzeria:${id}:${profile.name}`, { role: 'customer', trend, level: 6 })
    return {
      id,
      name: overrides.name || profile.name,
      preferredTier: overrides.preferredTier || profile.preferredTier || 'starter',
      travelMs: clampWhole(overrides.travelMs ?? profile.travelMs, 1000, 30000),
      appearance: copy({ ...generatedAppearance, ...(profile.appearance || {}), ...(overrides.appearance || {}) }),
      status: 'approaching',
    }
  }

  function spawn(overrides = {}) {
    if (approaching.length + queue.length >= maxQueue) return null
    const customer = nextProfile(overrides)
    approaching.push(customer)
    publish('customer-spawned', { customer })
    return copy(customer)
  }

  function admit(customerId) {
    if (queue.length >= maxQueue) return null
    const index = approaching.findIndex((customer) => customer.id === customerId)
    if (index < 0) return null
    const [customer] = approaching.splice(index, 1)
    customer.status = 'waiting'
    customer.queueNumber = queue.length + 1
    queue.push(customer)
    publish('customer-entered', { customer })
    return copy(customer)
  }

  function walkIn(overrides = {}) {
    const customer = spawn(overrides)
    return customer ? admit(customer.id) : null
  }

  function claimNextOrder() {
    if (currentId) return copy(queue.find((customer) => customer.id === currentId) || null)
    const customer = queue.find((item) => item.status === 'waiting')
    if (!customer) return null
    customer.status = 'preparing'
    currentId = customer.id
    publish('order-claimed', { customer })
    return copy(customer)
  }

  function serveCurrent(result = {}, dishCount = 2) {
    if (!currentId) return null
    const index = queue.findIndex((customer) => customer.id === currentId)
    if (index < 0) return null
    const [customer] = queue.splice(index, 1)
    const completed = { ...customer, status: 'served', result: copy(result) }
    served = [...served.slice(-7), completed]
    currentId = null
    dirtyDishes += clampWhole(dishCount, 1, 6)
    queue.forEach((item, queueIndex) => { item.queueNumber = queueIndex + 1 })
    publish('order-served', { customer: completed, dishesAdded: clampWhole(dishCount, 1, 6) })
    return copy(completed)
  }

  function cleanDishes(count = 1) {
    const cleaned = Math.min(dirtyDishes, clampWhole(count, 0, 20))
    if (!cleaned) return 0
    dirtyDishes -= cleaned
    publish('dishes-cleaned', { cleaned })
    return cleaned
  }

  function seed() {
    if (approaching.length || queue.length || served.length) return snapshot()
    walkIn()
    spawn()
    publish('shift-seeded')
    return snapshot()
  }

  function reset() {
    nextCustomer = 1
    catalogCursor = 0
    dirtyDishes = 0
    approaching = []
    queue = []
    served = []
    currentId = null
    publish('shift-reset')
    return seed()
  }

  function restore(saved = {}, backlog = saved.dirtyDishes) {
    approaching=copy(Array.isArray(saved.approaching) ? saved.approaching : []).slice(0,maxQueue)
    queue=copy(Array.isArray(saved.queue) ? saved.queue : []).slice(0,maxQueue-approaching.length)
    served=copy(Array.isArray(saved.served) ? saved.served : []).slice(-8)
    currentId=queue.some(customer=>customer.id === saved.currentId) ? saved.currentId : null
    dirtyDishes=clampWhole(backlog)
    const largest=[...approaching,...queue,...served].reduce((max,customer)=>Math.max(max,Number(String(customer.id).replace('customer-','')) || 0),0)
    nextCustomer=Math.max(largest+1,clampWhole(saved.nextCustomer,1)); catalogCursor=clampWhole(saved.catalogCursor)
    publish('shift-restored'); return seed()
  }

  return Object.freeze({
    spawn,
    admit,
    walkIn,
    claimNextOrder,
    serveCurrent,
    cleanDishes,
    seed,
    reset,
    restore,
    snapshot,
    subscribe(listener, { immediate = true } = {}) {
      if (typeof listener !== 'function') return () => {}
      listeners.add(listener)
      if (immediate) listener(Object.freeze({ type: 'snapshot', detail: {}, snapshot: snapshot() }))
      return () => listeners.delete(listener)
    },
  })
}

export const pizzeriaShift = createPizzeriaShift()
