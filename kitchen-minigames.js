import {
  createDomMinigameEmitter,
  createMinigameSession,
} from './minigame-runtime.js'
import { kitchenHoldState } from './kitchen-service.js'

export const KITCHEN_GAME_IDS = ['saucePot', 'doughToss', 'dishwashing', 'drinkPour']

export const KITCHEN_GAME_META = {
  saucePot: {
    name: 'Sauce pot',
    short: 'Cook & mind the batch',
    icon: '♨',
  },
  doughToss: {
    name: 'Dough tossing',
    short: 'Prepare five pizza bases',
    icon: '◯',
  },
  dishwashing: {
    name: 'Dishwashing',
    short: 'Scrub, then rinse',
    icon: '◌',
  },
  drinkPour: {
    name: 'Soda fountain',
    short: 'Pour to the order line',
    icon: '▥',
  },
}

const W = 800
const H = 600
const TAU = Math.PI * 2

const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value))

export function sauceHoldState(elapsedMs) {
  return kitchenHoldState(elapsedMs)
}

const timerKeys = new Set(['ingredientsReadyAt', 'availableAt', 'poppedAt', 'simmerStart', 'lastServiceStir', 'airStart', 'landingAt', 'rackArrivalAt', 'restUntil', 'scoreShownAt', 'nextOrderAt', 'startedAt', 'time'])
function mapTimers(value, convert, key = '') {
  if (Array.isArray(value)) return value.map(item => mapTimers(item, convert))
  if (timerKeys.has(key)) return convert(value)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, mapTimers(v, convert, k)]))
  return value
}
function shiftTimers(value, delta) {
  if(!value || typeof value !== 'object') return
  for(const [key,item] of Object.entries(value)) {
    if(timerKeys.has(key)) {if(Number.isFinite(item) && item !== 0)value[key]=item+delta}
    else if(item && typeof item === 'object')shiftTimers(item,delta)
  }
}
// Timers are offsets, not performance.now() values from a previous page.
export function saveKitchenStations(games, now) {
  const saved = mapTimers(games, value => value === Infinity ? {never:true} : value ? {offset:value-now} : 0)
  for (const game of Object.values(saved)) {
    game.dragging=false; game.stirring=false; game.scrubbing=false; game.rinsing=false; game.pouring=null
    game.previousSponge=null; game.dragStart=null; game.dragPoint=null
  }
  return saved
}
export function restoreKitchenStations(saved, now) {
  return mapTimers(saved, value => value?.never ? Infinity : typeof value?.offset === 'number' ? now+value.offset : 0)
}

export function scoreDrink(fill, target, correctFlavor = true, mixed = false) {
  const accuracy = clamp(1 - Math.abs(fill - target) / 0.32)
  const overflowPenalty = fill > 1 ? clamp(1 - (fill - 1) * 4) : 1
  const flavor = correctFlavor && !mixed ? 1 : mixed ? 0.45 : 0.2
  return Math.round(100 * accuracy * overflowPenalty * flavor)
}

export function scoreTossGesture(deltaX, deltaY) {
  const lift = clamp((-deltaY - 35) / 125)
  const straightness = clamp(1 - Math.abs(deltaX) / 150)
  return Math.round(100 * lift * (0.45 + straightness * 0.55))
}

export function distanceToStroke(point, start, end) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lengthSquared = dx * dx + dy * dy
  if (!lengthSquared) return Math.hypot(point.x - start.x, point.y - start.y)
  const t = clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared)
  const nearestX = start.x + dx * t
  const nearestY = start.y + dy * t
  return Math.hypot(point.x - nearestX, point.y - nearestY)
}

export function scrubGrimeStroke(grime, start, end, brushRadius = 20, strength = 0.26) {
  return grime
    .map((spot) => {
      if (distanceToStroke(spot, start, end) > brushRadius + spot.radius * 0.45) return spot
      return { ...spot, amount: clamp(spot.amount - strength) }
    })
    .filter((spot) => spot.amount > 0.015)
}

function shortestAngle(value) {
  return Math.atan2(Math.sin(value), Math.cos(value))
}

function seeded(index, salt = 0) {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453
  return value - Math.floor(value)
}

function canvasPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect()
  return {
    x: (event.clientX - rect.left) / rect.width * W,
    y: (event.clientY - rect.top) / rect.height * H,
  }
}

function inCircle(point, x, y, radius) {
  return Math.hypot(point.x - x, point.y - y) <= radius
}

function inRect(point, x, y, width, height) {
  return point.x >= x && point.x <= x + width && point.y >= y && point.y <= y + height
}

function roundedPath(context, x, y, width, height, radius = 16) {
  const r = Math.min(radius, width / 2, height / 2)
  context.beginPath()
  context.moveTo(x + r, y)
  context.arcTo(x + width, y, x + width, y + height, r)
  context.arcTo(x + width, y + height, x, y + height, r)
  context.arcTo(x, y + height, x, y, r)
  context.arcTo(x, y, x + width, y, r)
  context.closePath()
}

function fillRounded(context, x, y, width, height, radius, fill, stroke = null, lineWidth = 2) {
  roundedPath(context, x, y, width, height, radius)
  context.fillStyle = fill
  context.fill()
  if (stroke) {
    context.strokeStyle = stroke
    context.lineWidth = lineWidth
    context.stroke()
  }
}

function prepareCanvas(canvas, context) {
  const scaleX = canvas.width / W
  const scaleY = canvas.height / H
  context.setTransform(1, 0, 0, 1, 0, 0)
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.setTransform(scaleX, 0, 0, scaleY, 0, 0)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
}

function drawSprite(context, image, source, destination, alpha = 1) {
  if (!image?.complete || !image.naturalWidth) return false
  context.save()
  context.globalAlpha = alpha
  context.drawImage(
    image,
    source.x, source.y, source.width, source.height,
    destination.x, destination.y, destination.width, destination.height,
  )
  context.restore()
  return true
}

function drawRoom(context, colors = {}) {
  const wall = colors.wall || '#f4d99d'
  const counter = colors.counter || '#aa6844'
  const trim = colors.trim || '#754633'
  const gradient = context.createLinearGradient(0, 0, 0, H)
  gradient.addColorStop(0, wall)
  gradient.addColorStop(0.64, '#f7e8bc')
  gradient.addColorStop(0.641, trim)
  gradient.addColorStop(0.68, trim)
  gradient.addColorStop(0.681, counter)
  gradient.addColorStop(1, '#8a5038')
  context.fillStyle = gradient
  context.fillRect(0, 0, W, H)
  context.globalAlpha = 0.11
  context.strokeStyle = '#5e382c'
  context.lineWidth = 2
  for (let y = 420; y < H; y += 34) {
    context.beginPath()
    context.moveTo(0, y)
    context.bezierCurveTo(180, y + 5, 510, y - 6, W, y + 2)
    context.stroke()
  }
  context.globalAlpha = 1
}

function drawStationBackground(context, image, fallbackColors = {}) {
  if (!image?.complete || !image.naturalWidth) {
    drawRoom(context, fallbackColors)
    return false
  }
  context.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, 0, 0, W, H)
  const vignette = context.createRadialGradient(W * 0.5, H * 0.43, 130, W * 0.5, H * 0.48, 520)
  vignette.addColorStop(0, 'rgba(255,244,210,.035)')
  vignette.addColorStop(0.72, 'rgba(60,34,24,0)')
  vignette.addColorStop(1, 'rgba(40,24,20,.2)')
  context.fillStyle = vignette
  context.fillRect(0, 0, W, H)
  return true
}

function drawLabel(context, text, x, y, options = {}) {
  context.save()
  context.fillStyle = options.color || '#4d3129'
  context.font = `${options.weight || 800} ${options.size || 18}px ${options.serif ? 'Georgia' : 'Arial'}`
  context.textAlign = options.align || 'center'
  context.textBaseline = options.baseline || 'middle'
  context.fillText(text, x, y)
  context.restore()
}

function createSauceState(now = performance.now()) {
  return {
    kind: 'tomato',
    stage: 'ingredients',
    ingredients: [],
    ingredientsReadyAt: 0,
    stirring: false,
    lastAngle: 0,
    stirTravel: 0,
    spoonAngle: -0.7,
    bubbles: Array.from({ length: 7 }, (_, index) => ({
      x: 330 + seeded(index, 1) * 140,
      y: 275 + seeded(index, 2) * 115,
      radius: 16 + seeded(index, 3) * 9,
      popped: false,
      availableAt: Infinity,
      poppedAt: 0,
    })),
    ingredientAnimations: [],
    simmerStart: 0,
    sauceQuality: 100,
    splash: [],
    batchReady: false,
    completed: false,
    lastServiceStir: now,
    serviceStirs: 0,
  }
}

function createDoughState() {
  return {
    stage: 'ready',
    completedCount: 0,
    doughSize: 0.34,
    tosses: 0,
    dragging: false,
    dragStart: null,
    dragPoint: null,
    airStart: 0,
    airDuration: 900,
    launch: { dx: 0, dy: -150, score: 0 },
    lastScore: null,
    lastOutcome: '',
    landingAt: 0,
    flourPuffs: [],
    rackArrivalAt: 0,
    streak: 0,
    restUntil: 0,
    completed: false,
  }
}

function makeGrime(plate) {
  return Array.from({ length: 26 }, (_, index) => {
    const ring = index % 3
    const angle = index / 26 * TAU + seeded(index + plate * 13, 4) * 0.34
    const radius = 30 + ring * 31 + seeded(index + plate * 17, 5) * 16
    return {
      x: 400 + Math.cos(angle) * radius,
      y: 358 + Math.sin(angle) * radius * 0.7,
      radius: 6 + seeded(index + plate * 19, 6) * 8,
      amount: 0.72 + seeded(index + plate * 23, 9) * 0.28,
      kind: index % 3,
    }
  })
}

function grimeAmount(grime) {
  return grime.reduce((sum, spot) => sum + spot.amount, 0)
}

function createDishState(backlog = 0) {
  const target = Math.max(0, Math.round(Number(backlog) || 0))
  const grime = target ? makeGrime(1) : []
  return {
    stage: target ? 'scrub' : 'empty',
    plate: target ? 1 : 0,
    target,
    remaining: target,
    cleanedCount: 0,
    grime,
    initialGrime: grimeAmount(grime),
    scrubbing: false,
    sponge: { x: 174, y: 380 },
    previousSponge: null,
    spongeAngle: -0.16,
    cleaned: 0,
    suds: [],
    sparkles: [],
    rinsing: false,
    rinse: 0,
    completed: target === 0,
  }
}

const drinkFlavors = {
  cola: { label: 'Cola', color: '#633728', accent: '#ba5d3d' },
  lemon: { label: 'Lemon fizz', color: '#d7b84d', accent: '#f2df75' },
  berry: { label: 'Berry pop', color: '#9a3f58', accent: '#d36d83' },
}

const drinkOrders = [
  { flavor: 'cola', target: 0.76 },
  { flavor: 'lemon', target: 0.84 },
  { flavor: 'berry', target: 0.69 },
  { flavor: 'cola', target: 0.9 },
]

function createDrinkState(backlog = 0, offset = 0) {
  const orders=Array.from({length:Math.min(4, Math.max(0, Math.floor(backlog)))}, (_, index) => ({...drinkOrders[(offset+index)%drinkOrders.length]}))
  return {
    orders,
    stage: orders.length ? 'pour' : 'empty',
    orderIndex: 0,
    fill: 0,
    flavor: null,
    mixed: false,
    pouring: null,
    foam: 0,
    surfaceMotion: 0,
    lastScore: null,
    scoreShownAt: 0,
    nextOrderAt: 0,
    spills: [],
    scores: [],
    cupX: 400,
    cupTargetX: 400,
    completed: !orders.length,
  }
}

function publicGameState(id, state, phase, now, service) {
  if (id === 'saucePot') {
    const hold = service?.hold || null
    const holding = service?.burning || (state.kind === 'tomato' && state.batchReady && service?.sauces.tomato > 0)
    return {
      id,
      kind: state.kind,
      stage: holding ? 'holding' : state.stage,
      completed: state.completed,
      batchReady: state.batchReady,
      ingredients: state.ingredients.length,
      stirTurns: state.stirTravel / TAU,
      bubblesLeft: state.bubbles.filter((bubble) => !bubble.popped).length,
      hold,
      serviceStirs: state.serviceStirs,
    }
  }
  if (id === 'doughToss') return {
    id,
    stage: state.stage,
    completed: state.completed,
    completedCount: state.completedCount,
    doughSize: state.doughSize,
    tosses: state.tosses,
    lastScore: state.lastScore,
    lastOutcome: state.lastOutcome,
    stock: service?.doughs || 0,
  }
  if (id === 'dishwashing') return {
    id,
    stage: state.stage,
    completed: state.completed,
    plate: state.plate,
    target: state.target,
    remaining: state.remaining,
    cleanedCount: state.cleanedCount,
    grimeLeft: state.grime.length,
    cleanPercent: Math.round(state.cleaned * 100),
    rinse: state.rinse,
  }
  return {
    id,
    stage: state.stage,
    completed: state.completed,
    orderIndex: state.orderIndex,
    fill: state.fill,
    flavor: state.flavor,
    foam: state.foam,
    lastScore: state.lastScore,
    scores: [...state.scores],
    order: state.orders[state.orderIndex] || null,
    target: state.orders.length,
  }
}

function instructionsFor(id, snapshot, phase) {
  if (id === 'saucePot') {
    if (snapshot.stage === 'holding' && snapshot.hold) {
      if (snapshot.hold.key === 'smoking') return {
        verb: 'Rescue',
        instruction: 'Cooking is stopped. Drag the spoon around the pot for 1¼ full turns to rescue it. Your pizza is preserved.',
        progress: `${Math.round((snapshot.hold.rescueProgress || 0)*100)}% rescued`,
      }
      return {
        verb: 'Keep watch',
        instruction: 'Stir ¾ of a full turn to cool the tomato sauce. Keep an eye on it during service. Select New batch when you need more sauce.',
        progress: snapshot.hold.label,
      }
    }
    if (snapshot.stage === 'ingredients') return {
      verb: 'Build the sauce',
      instruction: snapshot.kind === 'pesto' ? 'Add basil, garlic, olive oil, and salt. Pesto is mixed cold; no simmering required.' : 'Click each bowl to tip tomatoes, garlic, basil, and salt into the pot.',
      progress: `${snapshot.ingredients}/4 ingredients`,
    }
    if (snapshot.stage === 'stir') return {
      verb: 'Stir',
      instruction: 'Drag the wooden spoon in broad circles. A few full turns bring the sauce together.',
      progress: `${Math.min(3, Math.floor(snapshot.stirTurns))}/3 turns`,
    }
    if (snapshot.stage === 'simmer') return {
      verb: 'Simmer',
      instruction: 'Pop the large bubbles before they boil over. Leave the small bubbles to simmer.',
      progress: `${snapshot.bubblesLeft} bubbles left`,
    }
    return {
      verb: 'Batch ready',
      instruction: 'Five portions added to prep stock. Each pizza uses one portion. Start another batch when stocks run low.',
      progress: '5 portions',
    }
  }
  if (id === 'doughToss') {
    if(snapshot.stock >= 10) return {verb:'Prep stock full',instruction:'Ten pizza bases are ready. Use some at the pizza counter before preparing more.',progress:'10 bases ready'}
    if (snapshot.completed) return {
      verb: 'Rack filled',
      instruction: 'Five pizza bases are ready. Each base becomes available as soon as you finish it.',
      progress: '5/5 bases',
    }
    if (snapshot.stage === 'airborne') return {
      verb: 'Catch',
      instruction: 'Let the dough settle into the hands. A centered toss lands smooth; a sideways one wrinkles.',
      progress: `${snapshot.completedCount}/5 bases`,
    }
    if (snapshot.stage === 'landing') return {
      verb: snapshot.lastOutcome || 'Catch',
      instruction: 'The dough settles and stretches across the hands before the next toss.',
      progress: `${snapshot.completedCount}/5 bases`,
    }
    return {
      verb: 'Toss',
      instruction: 'Drag the dough upward, then release to toss it. Three clean catches usually make one pizza base.',
      progress: `${snapshot.completedCount}/5 bases`,
    }
  }
  if (id === 'dishwashing') {
    if (snapshot.stage === 'empty') return {
      verb: 'Rack clear',
      instruction: 'No dirty dishes are waiting. Serving pizzas will send used plates and tools to this sink.',
      progress: '0 dirty dishes',
    }
    if (snapshot.completed) return {
      verb: 'Rack clear',
      instruction: 'The service dishes are back in rotation. Each scrubbed and rinsed dish earns 2 bonus coins.',
      progress: `${snapshot.cleanedCount}/${snapshot.target} dishes`,
    }
    if (snapshot.stage === 'rinse') return {
      verb: 'Rinse',
      instruction: 'Hold down the brass faucet handle until the suds wash clean.',
      progress: `${Math.round(snapshot.rinse * 100)}% rinsed · ${snapshot.remaining} left`,
    }
    return {
      verb: 'Scrub',
      instruction: 'Work the sponge back and forth over each patch. One broad swipe will not lift baked-on sauce.',
      progress: `Dish ${snapshot.plate}/${snapshot.target} · ${snapshot.cleanPercent}% clean`,
    }
  }
  if (snapshot.stage === 'empty') return {
    verb: 'No soda orders', instruction: 'Serve a pizza to create a soda order. A careful pour earns 3–8 bonus coins; a wrong or very poor pour earns nothing.', progress: 'No orders waiting',
  }
  if (snapshot.completed) return {
    verb: 'Drinks ready',
    instruction: 'Soda orders served. More pizza customers will create more drink orders.',
    progress: `${Math.round(snapshot.scores.reduce((sum, score) => sum + score, 0) / snapshot.scores.length)} average`,
  }
  if (snapshot.stage === 'scored') return {
    verb: snapshot.lastScore >= 90 ? 'Perfect pour' : snapshot.lastScore >= 70 ? 'Good pour' : 'Order served',
    instruction: 'The bubbles settle while the next cup slides into place.',
    progress: `${snapshot.lastScore} points`,
  }
  return {
    verb: 'Pour',
    instruction: 'Hold the ordered fountain lever, release near the line, then click the brass serving tray. Mixing flavors costs accuracy.',
    progress: `Drink ${snapshot.orderIndex + 1}/${snapshot.target} · ${drinkFlavors[snapshot.order.flavor].label}`,
  }
}

function drawSauce(context, state, phase, now, art, service) {
  const detailedRoom = drawStationBackground(context, art.sauceRoom, { wall: '#efd094', counter: '#9f5c3d', trim: '#694232' })
  const holding = service?.burning || (state.kind === 'tomato' && state.batchReady && service?.sauces.tomato > 0)
  const hold = service?.hold
  const pesto = state.kind === 'pesto' && !service?.burning

  const flame = holding ? 13 + hold.heat * 18 : state.stage === 'simmer' ? 24 : 8
  context.save()
  context.globalCompositeOperation = 'screen'
  for (let index = 0; index < (pesto ? 0 : 5); index += 1) {
    context.fillStyle = index % 2 ? 'rgba(255,179,60,.66)' : 'rgba(236,103,55,.62)'
    context.beginPath()
    context.ellipse(330 + index * 34, detailedRoom ? 459 : 468, 8, flame * 0.65 + (index % 2) * 4, 0, 0, TAU)
    context.fill()
  }
  context.restore()

  if (!holding && !state.batchReady && state.stage === 'ingredients') {
    const ingredients = [
      { id: 'tomatoes', label: 'Tomatoes', x: 118, color: '#b94b36', glyph: '●●', source: { x: 950, y: 280, width: 335, height: 310 } },
      { id: 'garlic', label: 'Garlic', x: 306, color: '#e6d4a3', glyph: '◆', source: { x: 1308, y: 294, width: 297, height: 282 } },
      { id: 'basil', label: 'Basil', x: 494, color: '#4f7d49', glyph: '♣', source: { x: 1625, y: 288, width: 307, height: 290 } },
      { id: 'salt', label: 'Salt', x: 682, color: '#f7f1dc', glyph: '···', source: { x: 1949, y: 342, width: 198, height: 218 } },
    ]
    if (pesto) {
      ingredients[0]={...ingredients[0],id:'basil',label:'Basil',source:ingredients[2].source}
      ingredients[2]={...ingredients[2],id:'oil',label:'Olive oil',color:'#c3a33a',source:{x:1949,y:342,width:198,height:218}}
    }
    ingredients.forEach((ingredient) => {
      const added = state.ingredients.includes(ingredient.id)
      const animation = state.ingredientAnimations.find((item) => item.id === ingredient.id)
      const animationT = animation ? clamp((now - animation.startedAt) / 720) : 0
      const tipDirection = ingredient.x < 400 ? 1 : -1
      context.save()
      context.translate(ingredient.x, 110 - Math.sin(animationT * Math.PI) * 7)
      context.rotate(animation ? tipDirection * Math.sin(animationT * Math.PI) * 0.28 : 0)
      context.globalAlpha = added ? 0.42 : 1
      const hasSprite = drawSprite(context, art.sauce, ingredient.source, {
        x: -75, y: -45, width: 150, height: 92,
      })
      if (!hasSprite) {
        context.fillStyle = '#f7ebcf'
        context.strokeStyle = '#604238'
        context.lineWidth = 4
        context.beginPath()
        context.ellipse(0, 2, 65, 38, 0, 0, TAU)
        context.fill()
        context.stroke()
        context.fillStyle = ingredient.color
        context.beginPath()
        context.ellipse(0, -5, 47, 24, 0, 0, TAU)
        context.fill()
      }
      if (ingredient.id === 'oil') {
        context.fillStyle='#c5a63b'; context.beginPath(); context.ellipse(0,-5,40,21,0,0,TAU); context.fill()
        context.strokeStyle='rgba(255,236,151,.6)'; context.lineWidth=3; context.beginPath(); context.ellipse(-7,-10,23,10,0,.5,3.5); context.stroke()
      }
      context.restore()
      if (added && !animation) drawLabel(context, '✓', ingredient.x, 105, { size: 25, color: '#315f42' })
      drawLabel(context, ingredient.label, ingredient.x, 161, { size: 14 })
    })
  }

  context.save()
  context.shadowColor = 'rgba(48,26,20,.35)'
  context.shadowBlur = 16
  context.shadowOffsetY = 8
  context.fillStyle = '#574943'
  context.strokeStyle = '#332b29'
  context.lineWidth = 8
  context.beginPath()
  context.ellipse(400, 342, 178, 142, 0, 0, TAU)
  context.fill()
  context.stroke()
  context.restore()
  context.fillStyle = '#b94632'
  context.beginPath()
  context.ellipse(400, 326, 151, 114, 0, 0, TAU)
  context.fill()
  const sauceGradient = context.createRadialGradient(365, 290, 12, 400, 326, 158)
  sauceGradient.addColorStop(0, pesto ? '#9fa74d' : '#df6541')
  sauceGradient.addColorStop(0.58, pesto ? '#5e7938' : '#ad3d2d')
  sauceGradient.addColorStop(1, pesto ? '#344c29' : '#762b27')
  context.fillStyle = sauceGradient
  context.beginPath()
  context.ellipse(400, 326, 140, 103, 0, 0, TAU)
  context.fill()
  state.ingredientAnimations.forEach((animation) => {
    const t = clamp((now - animation.startedAt) / 720)
    if (t >= 1) return
    const colors = {
      tomatoes: ['#d9573e', '#9d332b'],
      garlic: ['#f1d79c', '#d7ab62'],
      basil: ['#638f45', '#376234'],
      salt: ['#fff7dc', '#e7dfc8'],
      oil: ['#d6b947', '#b69932'],
    }[animation.id]
    for (let index = 0; index < 9; index += 1) {
      const stagger = clamp(t * 1.5 - index * 0.055)
      if (!stagger) continue
      const arc = Math.sin(stagger * Math.PI) * (66 + index % 3 * 10)
      const x = animation.x + (400 - animation.x) * stagger + (seeded(index, animation.x) - 0.5) * 26
      const y = 126 + (310 - 126) * stagger - arc
      context.save()
      context.translate(x, y)
      context.rotate(stagger * 4 + index)
      context.fillStyle = colors[index % 2]
      if (animation.id === 'basil') {
        context.beginPath()
        context.ellipse(0, 0, 7, 3.5, 0.5, 0, TAU)
      } else if (animation.id === 'salt') {
        context.beginPath()
        context.arc(0, 0, 2.2, 0, TAU)
      } else {
        context.beginPath()
        context.arc(0, 0, 4 + index % 3, 0, TAU)
      }
      context.fill()
      context.restore()
    }
  })
  context.strokeStyle = 'rgba(245,153,89,.33)'
  context.lineWidth = 5
  for (let i = 0; i < 3; i += 1) {
    context.beginPath()
    context.ellipse(400, 326, 55 + i * 25, 36 + i * 16, state.spoonAngle * 0.12, 0.3, 5.5)
    context.stroke()
  }

  const detailedPot = drawSprite(context, art.saucePot, { x: 0, y: 0, width: 1536, height: 1024 }, {
    x: 185, y: 176, width: 430, height: 330,
  })
  if (detailedPot) {
    if (pesto) {
      // Keep the painted surface detail, changing only the sauce inside the rim.
      context.save();context.beginPath();context.ellipse(400,315,136,102,0,0,TAU);context.clip()
      context.filter='hue-rotate(75deg) saturate(.65) brightness(.85)'
      drawSprite(context,art.saucePot,{x:0,y:0,width:1536,height:1024},{x:185,y:176,width:430,height:330})
      context.filter='none'
      for(let index=0;index<55;index+=1) {
        context.fillStyle=index%2 ? '#b3ad65' : '#344f29'; context.beginPath()
        const angle=seeded(index,1)*TAU, radius=Math.sqrt(seeded(index,2))*112
        context.ellipse(400+Math.cos(angle)*radius,326+Math.sin(angle)*radius*.6,2.7,1.4,angle,0,TAU);context.fill()
      }
      context.restore()
    }
    context.strokeStyle = 'rgba(255,176,102,.25)'
    context.lineWidth = 4
    for (let index = 0; index < 2; index += 1) {
      context.beginPath()
      context.ellipse(400, 326, 58 + index * 30, 38 + index * 19, state.spoonAngle * 0.09, 0.25, 5.65)
      context.stroke()
    }
  }

  if (state.stage === 'simmer' && !state.batchReady) {
    state.bubbles.forEach((bubble) => {
      if (now < bubble.availableAt) return
      if (bubble.popped) {
        const popT = clamp((now - bubble.poppedAt) / 430)
        if (popT >= 1) return
        context.strokeStyle = `rgba(255,190,112,${0.65 * (1 - popT)})`
        context.lineWidth = 5 * (1 - popT)
        context.beginPath()
        context.arc(bubble.x, bubble.y, bubble.radius + popT * 34, 0, TAU)
        context.stroke()
        for (let index = 0; index < 5; index += 1) {
          context.fillStyle = `rgba(190,66,42,${0.8 * (1 - popT)})`
          context.beginPath()
          context.arc(bubble.x + Math.cos(index * 1.25) * popT * 42, bubble.y + Math.sin(index * 1.25) * popT * 28 - popT * 12, 4, 0, TAU)
          context.fill()
        }
        return
      }
      const appear = clamp((now - bubble.availableAt) / 360)
      context.fillStyle = 'rgba(245,132,72,.55)'
      context.strokeStyle = '#812e27'
      context.lineWidth = 3
      context.beginPath()
      context.arc(bubble.x, bubble.y, (bubble.radius + Math.sin(now / 180 + bubble.x) * 2) * appear, 0, TAU)
      context.fill()
      context.stroke()
      context.fillStyle = 'rgba(255,224,170,.42)'
      context.beginPath()
      context.arc(bubble.x - 5, bubble.y - 6, bubble.radius * 0.3, 0, TAU)
      context.fill()
    })
  }

  state.splash.slice(-24).forEach((drop, index) => {
    const age = (now - drop.time) / 650
    if (age < 0 || age > 1) return
    context.fillStyle = `rgba(180,61,39,${0.72 * (1 - age)})`
    context.beginPath()
    context.ellipse(drop.x + drop.vx * age, drop.y + drop.vy * age + age * age * 36, 3 + index % 3, 2 + index % 2, age * 3, 0, TAU)
    context.fill()
  })

  const spoonAngle = state.spoonAngle
  const spoonX = 400 + Math.cos(spoonAngle) * 65
  const spoonY = 326 + Math.sin(spoonAngle) * 50
  context.save()
  context.translate(spoonX, spoonY)
  context.rotate(spoonAngle + 0.7)
  const detailedSpoon = drawSprite(context, art.sauceSpoon, { x: 0, y: 0, width: 1536, height: 1024 }, {
    x: -52, y: -126, width: 216, height: 144,
  })
  if (!detailedSpoon) {
    context.strokeStyle = '#784625'
    context.lineWidth = 14
    context.lineCap = 'round'
    context.beginPath()
    context.moveTo(0, 5)
    context.lineTo(0, -190)
    context.stroke()
    context.fillStyle = '#a66a37'
    context.beginPath()
    context.ellipse(0, 14, 25, 37, 0, 0, TAU)
    context.fill()
  }
  context.restore()

  if (hold && hold.key !== 'safe') {
    const amount = hold.key === 'smoking' ? 5 : 2
    for (let i = 0; i < amount; i += 1) {
      const drift = (now / 28 + i * 63) % 150
      context.strokeStyle = `rgba(72,62,55,${hold.key === 'smoking' ? 0.35 : 0.1})`
      context.lineWidth = 6 + i % 3 * 3
      context.lineCap = 'round'
      context.beginPath()
      const smokeX = 352 + i * 24 + Math.sin(now / 390 + i) * 11
      context.moveTo(smokeX, 256 - drift * 0.18)
      context.bezierCurveTo(smokeX - 12, 230 - drift * 0.45, smokeX + 15, 205 - drift * 0.72, smokeX + Math.sin(i) * 10, 176 - drift)
      context.stroke()
    }
    if (hold.key === 'smoking') {
      for(let index=0;index<10;index+=1) {
        const age=((now/2300+index/10)%1), x=365+index%4*24+Math.sin(age*5+index)*20, y=285-age*215
        const puff=context.createRadialGradient(x,y,1,x,y,24+age*30)
        puff.addColorStop(0,`rgba(58,51,46,${.65*(1-age)})`); puff.addColorStop(1,'rgba(58,51,46,0)')
        context.fillStyle=puff;context.beginPath();context.arc(x,y,24+age*30,0,TAU);context.fill()
      }
    }
  }
}

function drawDough(context, state, now, art) {
  drawStationBackground(context, art.doughRoom, { wall: '#d9e0b5', counter: '#a76b45', trim: '#596a4f' })
  const rackSlots = [158, 282, 404, 526, 648]
  for (let index = 0; index < 5; index += 1) {
    const ready = index < state.completedCount
    const justArrived = ready && index === state.completedCount - 1 ? clamp(1 - (now - state.rackArrivalAt) / 620) : 0
    if (!ready) continue
    context.save()
    context.shadowColor = `rgba(255,239,176,${0.28 + justArrived * 0.72})`
    context.shadowBlur = 7 + justArrived * 18
    context.translate(rackSlots[index], 291 - justArrived * 10)
    context.rotate((index - 2) * 0.016)
    drawSprite(context, art.dough, { x: 421, y: 132, width: 566, height: 438 }, {
      x: -47 - justArrived * 3, y: -27 - justArrived * 2, width: 94 + justArrived * 6, height: 54 + justArrived * 4,
    })
    context.restore()
  }

  if (state.dragging && state.dragStart && state.dragPoint) {
    const lift = clamp((state.dragStart.y - state.dragPoint.y) / 180)
    context.save()
    context.strokeStyle = `rgba(255,246,205,${0.35 + lift * 0.48})`
    context.lineWidth = 7
    context.lineCap = 'round'
    context.setLineDash([14, 13])
    context.beginPath()
    context.moveTo(state.dragStart.x, state.dragStart.y + 12)
    context.quadraticCurveTo(400, state.dragPoint.y - 75, state.dragPoint.x, state.dragPoint.y - 26)
    context.stroke()
    context.setLineDash([])
    context.fillStyle = `rgba(255,246,205,${0.42 + lift * 0.5})`
    context.beginPath()
    context.moveTo(state.dragPoint.x, state.dragPoint.y - 43)
    context.lineTo(state.dragPoint.x - 12, state.dragPoint.y - 20)
    context.lineTo(state.dragPoint.x + 12, state.dragPoint.y - 20)
    context.closePath()
    context.fill()
    context.restore()
  }

  let x = state.dragPoint?.x || 400
  let y = state.dragPoint?.y || 410
  let scale = 0.72 + state.doughSize * 0.42
  let stretchX = 1.1
  let stretchY = 0.84
  let rotation = 0
  let handY = 360
  let handSpread = 0
  if (state.stage === 'airborne') {
    const t = clamp((now - state.airStart) / state.airDuration)
    x = 400 + state.launch.dx * Math.sin(Math.PI * t)
    y = 410 - (145 + Math.max(0, -state.launch.dy - 80) * 0.65) * Math.sin(Math.PI * t)
    const lift = Math.sin(Math.PI * t)
    const contact = Math.max(clamp((0.19 - t) / 0.19), clamp((t - 0.81) / 0.19))
    stretchX = 1 + lift * (0.16 + state.launch.score / 100 * 0.08)
    stretchY = 1 - lift * 0.1
    rotation = t * (0.65 + Math.abs(state.launch.dx) / 150) * (state.launch.dx < 0 ? -1 : 1)
    handY = 398 - contact * 38
    handSpread = (1 - contact) * 23
  } else if (state.stage === 'landing') {
    const t = clamp((now - state.landingAt) / 420)
    const squash = Math.sin(Math.PI * t)
    y = 410 + squash * 12
    stretchX = 1.1 + squash * 0.16
    stretchY = 0.84 - squash * 0.14
    rotation = state.launch.dx / 900 * (1 - t)
    handY = 356 + squash * 9
  } else if (state.dragging && state.dragPoint) {
    const lift = clamp((420 - state.dragPoint.y) / 205)
    const release = clamp((lift - 0.48) / 0.34)
    handY = 360 - lift * 56 + release * 46
    handSpread = release * 22
    stretchX = 1.1 + release * 0.08
    stretchY = 0.84 + release * 0.08
  }

  const leftHandX = 238 - handSpread
  const rightHandX = 404 + handSpread
  const handWidth = 162
  const handHeight = 252

  context.save()
  context.translate(leftHandX + handWidth / 2, handY + handHeight / 2)
  context.rotate(0.09)
  const detailedLeftHand = drawSprite(context, art.dough, { x: 1008, y: 242, width: 245, height: 354 }, {
    x: -handWidth / 2, y: -handHeight / 2, width: handWidth, height: handHeight,
  })
  context.restore()
  context.save()
  context.translate(rightHandX + handWidth / 2, handY + handHeight / 2)
  context.rotate(-0.09)
  const detailedRightHand = drawSprite(context, art.dough, { x: 1330, y: 244, width: 205, height: 352 }, {
    x: -handWidth / 2, y: -handHeight / 2, width: handWidth, height: handHeight,
  })
  context.restore()
  if (!detailedLeftHand || !detailedRightHand) {
    context.fillStyle = '#bb7652'
    context.strokeStyle = '#5b382e'
    context.lineWidth = 4
    context.beginPath()
    context.ellipse(310 - handSpread, handY + 108, 80, 38, -0.18, 0, TAU)
    context.ellipse(490 + handSpread, handY + 108, 80, 38, 0.18, 0, TAU)
    context.fill()
    context.stroke()
  }

  context.fillStyle = 'rgba(62,38,28,.24)'
  context.beginPath()
  context.ellipse(400, 472, 150 * scale, 24 * scale, 0, 0, TAU)
  context.fill()
  context.save()
  context.translate(x, y)
  context.rotate(rotation)
  context.scale(stretchX, stretchY)
  const doughSource = state.stage === 'airborne'
    ? { x: 421, y: 132, width: 566, height: 438 }
    : { x: 33, y: 222, width: 360, height: 346 }
  const doughWidth = (state.stage === 'airborne' ? 280 : 235) * scale
  const doughHeight = (state.stage === 'airborne' ? 205 : 235) * scale
  context.fillStyle = 'rgba(111,68,42,.55)'
  context.beginPath()
  context.ellipse(0, doughHeight * 0.08, doughWidth * 0.45, doughHeight * 0.43, 0.03, 0, TAU)
  context.fill()
  const detailedDough = drawSprite(context, art.dough, doughSource, {
    x: -doughWidth / 2, y: -doughHeight / 2, width: doughWidth, height: doughHeight,
  })
  if (!detailedDough) {
    const doughGradient = context.createRadialGradient(-28, -35, 8, 0, 0, 155 * scale)
    doughGradient.addColorStop(0, '#fff4d0')
    doughGradient.addColorStop(0.72, '#e4bd7b')
    doughGradient.addColorStop(1, '#b97845')
    context.fillStyle = doughGradient
    context.strokeStyle = '#815033'
    context.lineWidth = 5
    context.beginPath()
    context.ellipse(0, 0, 135 * scale, 104 * scale, 0.04, 0, TAU)
    context.fill()
    context.stroke()
  }
  context.restore()

  state.flourPuffs.forEach((puff, index) => {
    const age = (now - puff.time) / 780
    if (age < 0 || age > 1) return
    const drift = 20 + index % 4 * 7
    context.fillStyle = `rgba(255,245,211,${0.48 * (1 - age)})`
    context.beginPath()
    context.ellipse(puff.x + puff.vx * age, puff.y - age * drift, 11 + age * 15, 6 + age * 8, puff.vx / 60, 0, TAU)
    context.fill()
  })

  if (state.lastScore != null && state.stage !== 'complete') {
    context.save()
    context.globalAlpha = state.stage === 'landing' ? 1 : 0.78
    fillRounded(context, 625, 61, 135, 40, 13, 'rgba(255,240,191,.9)', 'rgba(101,66,51,.84)', 3)
    drawLabel(context, state.lastOutcome || `${state.lastScore} toss`, 692, 81, { size: 13 })
    context.restore()
  }
}

function drawDish(context, state, now, art) {
  drawStationBackground(context, art.dishRoom, { wall: '#bcd7cf', counter: '#807b64', trim: '#48645f' })
  const cleanPlate = { x: 9, y: 120, width: 491, height: 470 }
  const dirtyPlate = { x: 511, y: 120, width: 494, height: 470 }

  for (let index = 0; index < state.cleanedCount; index += 1) {
    context.save()
    context.translate(686 + index * 18, 274 - index * 3)
    context.rotate(-0.08 + index * 0.025)
    context.shadowColor = 'rgba(23,18,13,.34)'
    context.shadowBlur = 7
    drawSprite(context, art.dishes, cleanPlate, { x: -49, y: -52, width: 98, height: 84 })
    context.restore()
  }

  const hasActivePlate = state.stage !== 'empty' && state.stage !== 'complete'
  if (hasActivePlate) {
    const rinsingTilt = state.stage === 'rinse' ? -0.055 : 0
    context.save()
    context.translate(400, 358)
    context.rotate(rinsingTilt)
    context.shadowColor = 'rgba(28,17,13,.42)'
    context.shadowBlur = 17
    context.shadowOffsetY = 10
    drawSprite(context, art.dishes, cleanPlate, { x: -155, y: -132, width: 310, height: 264 })
    if (state.grime.length) {
      const remaining = clamp(grimeAmount(state.grime) / state.initialGrime)
      drawSprite(context, art.dishes, dirtyPlate, { x: -155, y: -132, width: 310, height: 264 }, remaining * 0.86)
    }
    context.restore()

    state.grime.forEach((spot, index) => {
      const colors = ['139,72,46', '103,113,67', '110,75,53']
      context.fillStyle = `rgba(${colors[spot.kind]},${0.2 + spot.amount * 0.62})`
      context.strokeStyle = `rgba(73,54,40,${spot.amount * 0.38})`
      context.lineWidth = 1.5
      context.beginPath()
      context.ellipse(spot.x, spot.y, spot.radius * (0.75 + seeded(index, state.plate) * 0.45), spot.radius * 0.65, seeded(index, 8) * Math.PI, 0, TAU)
      context.fill()
      context.stroke()
    })

    state.suds.slice(-35).forEach((sud, index) => {
      const age = (now - sud.time) / 3000
      context.fillStyle = `rgba(242,253,250,${clamp(0.68 - age * 0.35)})`
      context.strokeStyle = `rgba(104,166,171,${clamp(0.7 - age * 0.3)})`
      context.lineWidth = 2
      context.beginPath()
      context.arc(sud.x, sud.y, 6 + index % 4 * 2, 0, TAU)
      context.fill()
      context.stroke()
    })
  }

  if (state.rinsing) {
    const water = context.createLinearGradient(420, 130, 407, 400)
    water.addColorStop(0, 'rgba(224,251,255,.92)')
    water.addColorStop(0.3, 'rgba(146,218,229,.76)')
    water.addColorStop(1, 'rgba(103,189,205,.18)')
    context.strokeStyle = water
    context.lineWidth = 18
    context.lineCap = 'round'
    context.beginPath()
    context.moveTo(421, 127)
    context.bezierCurveTo(420, 206, 401 + Math.sin(now / 170) * 5, 284, 408, 373)
    context.stroke()
    context.fillStyle = 'rgba(226,252,255,.7)'
    for (let index = 0; index < 18; index += 1) {
      const travel = (now / 6 + index * 31) % 250
      const dropX = 408 + Math.sin(index * 2.1 + now / 160) * (5 + travel * 0.05)
      context.beginPath()
      context.ellipse(dropX, 142 + travel, 2.2, 6.5, 0, 0, TAU)
      context.fill()
    }
  }

  if (state.stage === 'scrub') {
    context.save()
    context.translate(state.sponge.x, state.sponge.y)
    context.rotate(state.spongeAngle)
    context.shadowColor = 'rgba(25,18,14,.35)'
    context.shadowBlur = 9
    const detailedSponge = drawSprite(context, art.dishes, { x: 1018, y: 226, width: 347, height: 354 }, {
      x: -62, y: -41, width: 124, height: 82,
    })
    if (!detailedSponge) fillRounded(context, -52, -30, 104, 60, 13, '#e5c43b', '#594b2e', 4)
    context.restore()
  } else if (!hasActivePlate) {
    context.save()
    context.translate(121, 346)
    context.rotate(-0.12)
    drawSprite(context, art.dishes, { x: 1018, y: 226, width: 347, height: 354 }, {
      x: -48, y: -32, width: 96, height: 64,
    }, 0.92)
    context.restore()
  }

  if (state.stage === 'rinse') {
    context.save()
    context.globalAlpha = clamp(0.2 + state.rinse * 0.8)
    context.strokeStyle = 'rgba(255,255,238,.95)'
    context.lineWidth = 4
    for (let index = 0; index < 4; index += 1) {
      const angle = now / 600 + index * TAU / 4
      const sparkleX = 400 + Math.cos(angle) * (84 + index * 8)
      const sparkleY = 350 + Math.sin(angle) * (52 + index * 4)
      context.beginPath()
      context.moveTo(sparkleX - 8, sparkleY)
      context.lineTo(sparkleX + 8, sparkleY)
      context.moveTo(sparkleX, sparkleY - 8)
      context.lineTo(sparkleX, sparkleY + 8)
      context.stroke()
    }
    context.restore()
  }
}

function drawDrink(context, state, art, now) {
  drawStationBackground(context, art.drinkRoom, { wall: '#e8c5b4', counter: '#725a51', trim: '#593b36' })
  const detailedFountain = drawSprite(context, art.drinks, { x: 26, y: 10, width: 802, height: 696 }, {
    x: 91, y: 67, width: 618, height: 326,
  })
  if (!detailedFountain) drawLabel(context, 'FOUNTAIN SERVICE', 400, 116, { size: 24, serif: true })
  const flavorIds = Object.keys(drinkFlavors)
  const tapPositions = [216, 400, 584]
  flavorIds.forEach((id, index) => {
    const flavor = drinkFlavors[id]
    const x = tapPositions[index]
    const pressed = state.pouring === id ? 8 : 0
    if (!detailedFountain) {
      fillRounded(context, x - 67, 177, 134, 92, 18, flavor.color, '#2f2928', 5)
      context.fillStyle = flavor.accent
      context.beginPath()
      context.arc(x, 245, 13, 0, TAU)
      context.fill()
      context.strokeStyle = '#272322'
      context.lineWidth = 8
      context.lineCap = 'round'
      context.beginPath()
      context.moveTo(x, 269)
      context.lineTo(x, 318)
      context.stroke()
      context.fillStyle = '#302c2a'
      roundedPath(context, x - 36, 297, 72, 25, 8)
      context.fill()
    } else {
      context.fillStyle = flavor.color
      context.strokeStyle = state.pouring === id ? '#fff1a6' : '#3a2927'
      context.lineWidth = state.pouring === id ? 6 : 3
      context.beginPath()
      context.arc(x, 190 + pressed, 20, 0, TAU)
      context.fill()
      context.stroke()
      context.strokeStyle = '#302725'
      context.lineWidth = 6
      context.lineCap = 'round'
      context.beginPath()
      context.moveTo(x, 215 + pressed)
      context.lineTo(x, 242 + pressed)
      context.stroke()
    }
    if (!detailedFountain) drawLabel(context, flavor.label, x, 211, { size: 15, color: '#fff7df', serif: true })
  })

  if (state.pouring) {
    const flavor = drinkFlavors[state.pouring]
    const sourceX = tapPositions[flavorIds.indexOf(state.pouring)]
    const stream = context.createLinearGradient(sourceX, 245, state.cupX, 404)
    stream.addColorStop(0, flavor.accent)
    stream.addColorStop(0.35, flavor.color)
    stream.addColorStop(1, flavor.color)
    context.strokeStyle = stream
    context.lineWidth = 10
    context.lineCap = 'round'
    context.beginPath()
    context.moveTo(sourceX, 244)
    context.bezierCurveTo(sourceX + Math.sin(now / 85) * 3, 313, state.cupX + Math.cos(now / 110) * 2, 353, state.cupX, 402)
    context.stroke()
    context.strokeStyle = 'rgba(255,255,255,.38)'
    context.lineWidth = 3
    context.beginPath()
    context.moveTo(sourceX - 2, 246)
    context.bezierCurveTo(sourceX, 316, state.cupX - 3, 363, state.cupX - 3, 400)
    context.stroke()
  }

  const order = state.orders[state.orderIndex]
  if (order) {
    // The cola cup slides left: keep its ticket clear of the cup and serving tray.
    const ticketX=state.cupTargetX < 300 ? 600 : 28, ticketY=state.cupTargetX < 300 ? 285 : 403
    fillRounded(context, ticketX, ticketY, 180, 140, 18, '#fff4d5', '#49332d', 4)
    drawLabel(context, `DRINK ${state.orderIndex + 1}`, ticketX+90, ticketY+24, { size: 13 })
    drawLabel(context, drinkFlavors[order.flavor].label, ticketX+90, ticketY+56, { size: 21, serif: true })
    drawLabel(context, `Fill to ${Math.round(order.target * 100)}%`, ticketX+90, ticketY+92, { size: 15 })
    context.strokeStyle = '#a74535'
    context.lineWidth = 5
    context.beginPath()
    context.moveTo(ticketX+30, ticketY+116)
    context.lineTo(ticketX+150, ticketY+116)
    context.stroke()
  }

  const cupX = state.cupX
  const cupY = 390
  const cupW = 138
  const cupH = 166
  context.save()
  context.beginPath()
  context.moveTo(cupX - cupW * 0.46, cupY + 4)
  context.lineTo(cupX + cupW * 0.46, cupY + 4)
  context.lineTo(cupX + cupW * 0.35, cupY + cupH)
  context.lineTo(cupX - cupW * 0.35, cupY + cupH)
  context.closePath()
  context.clip()
  if (state.fill > 0 && state.flavor) {
    const color = state.mixed ? '#7f554b' : drinkFlavors[state.flavor].color
    context.fillStyle = color
    const height = cupH * state.fill
    const wave = Math.sin(now / 95) * state.surfaceMotion * 4
    const surfaceY = cupY + cupH - height
    context.beginPath()
    context.moveTo(cupX - cupW / 2, surfaceY + wave)
    context.quadraticCurveTo(cupX - 25, surfaceY - wave, cupX, surfaceY + wave * 0.45)
    context.quadraticCurveTo(cupX + 35, surfaceY - wave * 0.7, cupX + cupW / 2, surfaceY + wave)
    context.lineTo(cupX + cupW / 2, cupY + cupH)
    context.lineTo(cupX - cupW / 2, cupY + cupH)
    context.closePath()
    context.fill()
    context.fillStyle = 'rgba(255,255,255,.45)'
    for (let index = 0; index < 8; index += 1) {
      const bx = cupX - 55 + seeded(index, 7) * 110
      const by = cupY + cupH - height + 10 + seeded(index, 8) * Math.max(10, height - 20)
      context.beginPath()
      context.arc(bx, by, 3 + index % 3, 0, TAU)
      context.fill()
    }
  }
  context.restore()
  const cupSources = {
    empty: { x: 870, y: 196, width: 300, height: 392 },
    cola: { x: 1189, y: 194, width: 302, height: 396 },
    lemon: { x: 1510, y: 196, width: 300, height: 394 },
    berry: { x: 1829, y: 194, width: 301, height: 396 },
  }
  const cupDestination = { x: cupX - cupW / 2 - 9, y: cupY - 7, width: cupW + 18, height: cupH + 18 }
  context.save()
  context.shadowColor = 'rgba(35,22,18,.38)'
  context.shadowBlur = 11
  context.shadowOffsetY = 7
  drawSprite(context, art.drinks, cupSources.empty, cupDestination, 0.96)
  context.restore()
  if (state.fill > 0 && state.flavor) {
    context.save()
    const clippedHeight = (cupH + 18) * clamp(state.fill, 0, 1)
    context.beginPath()
    context.rect(cupDestination.x, cupDestination.y + cupDestination.height - clippedHeight, cupDestination.width, clippedHeight)
    context.clip()
    drawSprite(context, art.drinks, cupSources[state.flavor], cupDestination, 0.92)
    context.restore()
    const liquidHeight = cupH * clamp(state.fill, 0, 1)
    const surfaceY = cupY + cupH - liquidHeight
    context.save()
    context.beginPath()
    context.moveTo(cupX - cupW * 0.46, cupY + 4)
    context.lineTo(cupX + cupW * 0.46, cupY + 4)
    context.lineTo(cupX + cupW * 0.35, cupY + cupH)
    context.lineTo(cupX - cupW * 0.35, cupY + cupH)
    context.closePath()
    context.clip()
    const foamHeight = 5 + state.foam * 24
    const foam = context.createLinearGradient(0, surfaceY - foamHeight, 0, surfaceY + 8)
    foam.addColorStop(0, 'rgba(255,249,220,.35)')
    foam.addColorStop(1, 'rgba(255,236,190,.92)')
    context.fillStyle = foam
    context.beginPath()
    context.ellipse(cupX, surfaceY + Math.sin(now / 120) * state.surfaceMotion * 2, cupW * 0.46, foamHeight, 0, 0, TAU)
    context.fill()
    context.fillStyle = 'rgba(255,255,235,.84)'
    for (let index = 0; index < 11; index += 1) {
      const bubbleX = cupX - 57 + seeded(index, state.orderIndex + 12) * 114
      const bubbleY = surfaceY - 2 - seeded(index, state.orderIndex + 13) * foamHeight * 0.7
      context.beginPath()
      context.arc(bubbleX, bubbleY, 2 + index % 4, 0, TAU)
      context.fill()
    }
    context.restore()
  }
  if (order) {
    const lineY = cupY + cupH * (1 - order.target)
    context.strokeStyle = '#f7d35b'
    context.lineWidth = 5
    context.setLineDash([12, 8])
    context.beginPath()
    context.moveTo(cupX - 69, lineY)
    context.lineTo(cupX + 69, lineY)
    context.stroke()
    context.setLineDash([])
  }
  if (state.fill > 1) {
    context.fillStyle = 'rgba(88,50,39,.55)'
    context.beginPath()
    context.ellipse(cupX, 572, 112 * clamp((state.fill - 1) * 7), 18, 0, 0, TAU)
    context.fill()
  }
  if (state.stage === 'scored') {
    context.save()
    context.shadowColor = 'rgba(35,20,16,.38)'
    context.shadowBlur = 10
    fillRounded(context, 622, 445, 134, 96, 12, state.lastScore >= 90 ? '#edf1cf' : '#f4dfbe', '#74493b', 3)
    context.restore()
    drawLabel(context, state.lastScore >= 90 ? 'PERFECT' : state.lastScore >= 70 ? 'NICE POUR' : 'SERVED', 689, 470, { size: 14, color: '#704233', serif: true })
    drawLabel(context, `${state.lastScore}`, 689, 509, { size: 31, color: '#4a3129', serif: true })
    drawLabel(context, 'POINTS', 689, 529, { size: 10, color: '#704233' })
  } else {
    context.save()
    context.shadowColor = 'rgba(31,19,15,.48)'
    context.shadowBlur = 13
    context.shadowOffsetY = 8
    const tray = context.createRadialGradient(669, 479, 8, 689, 497, 86)
    tray.addColorStop(0, state.fill >= 0.25 ? '#f0ce79' : '#b9a275')
    tray.addColorStop(0.7, state.fill >= 0.25 ? '#b47a35' : '#86775e')
    tray.addColorStop(1, '#60432f')
    context.fillStyle = tray
    context.strokeStyle = '#4a3027'
    context.lineWidth = 5
    context.beginPath()
    context.ellipse(687, 497, 78, 45, -0.03, 0, TAU)
    context.fill()
    context.stroke()
    context.strokeStyle = 'rgba(255,236,169,.62)'
    context.lineWidth = 3
    context.beginPath()
    context.ellipse(687, 493, 62, 31, -0.03, 0, TAU)
    context.stroke()
    context.restore()
    drawLabel(context, 'SERVE', 687, 489, { size: 17, color: '#fff2c7', serif: true })
    drawLabel(context, `${Math.round(state.fill * 100)}%`, 687, 513, { size: 12, color: '#fff2c7' })
  }
  if (state.completed) {
    context.fillStyle = 'rgba(44,34,30,.7)'
    context.fillRect(0, 0, W, H)
    fillRounded(context, 205, 215, 390, 170, 24, '#fff0c8', '#4d332c', 6)
    drawLabel(context, state.stage === 'empty' ? 'No soda orders waiting' : 'Drinks served!', 400, 270, { size: 27, serif: true })
    const average = state.scores.length ? Math.round(state.scores.reduce((sum, score) => sum + score, 0) / state.scores.length) : 0
    drawLabel(context, state.stage === 'empty' ? 'Serve a pizza to get a drink order' : `Average pour: ${average}/100`, 400, 324, { size: 18 })
  }
}

export function createKitchenMinigames({ canvas, eventTarget = document, onChange = () => {}, saved = {}, service: initialService = null,
  onWork = () => {}, onStir = () => {}, isRunning = () => true } = {}) {
  if (!canvas) throw new Error('createKitchenMinigames requires a canvas')
  const context = canvas.getContext('2d')
  const art = {
    sauce: new Image(),
    saucePot: new Image(),
    sauceSpoon: new Image(),
    sauceRoom: new Image(),
    dough: new Image(),
    doughRoom: new Image(),
    dishes: new Image(),
    dishRoom: new Image(),
    drinks: new Image(),
    drinkRoom: new Image(),
  }
  art.sauce.src = 'assets/game/kitchen-sauce-atlas-v1.png'
  art.saucePot.src = 'assets/game/kitchen-sauce-pot-clean-v1.png'
  art.sauceSpoon.src = 'assets/game/kitchen-sauce-spoon-v1.png'
  art.sauceRoom.src = 'assets/game/kitchen-sauce-station-v2.png'
  art.dough.src = 'assets/game/kitchen-dough-atlas-v1.png'
  art.doughRoom.src = 'assets/game/kitchen-dough-station-v2.png'
  art.dishes.src = 'assets/game/kitchen-dishes-atlas-v1.png'
  art.dishRoom.src = 'assets/game/kitchen-dish-station-v2.png'
  art.drinks.src = 'assets/game/kitchen-drinks-atlas-v1.png'
  art.drinkRoom.src = 'assets/game/kitchen-drink-station-v2.png'
  Object.values(art).forEach((image) => image.addEventListener('load', () => draw(performance.now())))
  const emit = createDomMinigameEmitter(eventTarget)
  const sessions = Object.fromEntries(KITCHEN_GAME_IDS.map((id) => [id, createMinigameSession(id, { emit })]))
  let active = 'saucePot'
  let phase = 'morning'
  let visible = false
  let upgrades = new Set()
  let frame = 0
  let lastFrame = performance.now()
  let lastNotice = ''
  let service = initialService
  let games = {
    saucePot: createSauceState(lastFrame),
    doughToss: createDoughState(),
    dishwashing: createDishState(service?.dirtyDishes),
    drinkPour: createDrinkState(service?.drinkTickets, service?.drinksServed),
  }
  const restored=restoreKitchenStations(saved.games || {}, lastFrame)
  for(const id of KITCHEN_GAME_IDS) {
    if(restored[id]?.stage) games[id]={...games[id],...restored[id]}
    games[id].runToken ||= globalThis.crypto?.randomUUID?.() || `${id}-${Date.now()}-${Math.random()}`
  }
  if(KITCHEN_GAME_IDS.includes(saved.active)) active=saved.active

  function startSession(id) {
    sessions[id].begin({ phase, station: id })
    sessions[id].update(snapshot(id, performance.now()).stage)
  }

  KITCHEN_GAME_IDS.forEach(startSession)

  function snapshot(id = active, now = performance.now()) {
    return publicGameState(id, games[id], phase, now, service)
  }

  function dashboard(now = performance.now()) {
    const snapshots = Object.fromEntries(KITCHEN_GAME_IDS.map((id) => [id, snapshot(id, now)]))
    return {
      active,
      phase,
      current: snapshots[active],
      instructions: instructionsFor(active, snapshots[active], phase),
      games: snapshots,
      service,
      upgrades: [...upgrades],
    }
  }

  function notify(force = false, now = performance.now()) {
    const info = dashboard(now)
    const signature = JSON.stringify({
      active,
      phase,
      stages: Object.values(info.games).map((game) => [game.stage, game.completed, game.hold?.key, game.ingredients, game.completedCount, game.plate, game.grimeLeft, game.orderIndex]),
      progress: info.instructions.progress,
    })
    if (!force && signature === lastNotice) return
    lastNotice = signature
    onChange(info)
  }

  function publishStage(id, detail = {}) {
    const game = snapshot(id)
    sessions[id].update(game.stage, detail)
    notify(true)
  }

  function complete(id, result) {
    sessions[id].complete(result)
    notify(true)
  }

  function reset(id = active) {
    // Resetting the interaction never clears inventory, heat, or unpaid demand.
    if(service?.burning && (id === 'saucePot' || id === 'doughToss')) return false
    if(id === 'saucePot' && service?.sauces[games.saucePot.kind] >= 10) return false
    if(id === 'doughToss' && service?.doughs >= 10) return false
    const now = performance.now()
    if (id === 'saucePot') games[id] = {...createSauceState(now), kind:games[id].kind}
    if (id === 'doughToss') games[id] = createDoughState()
    if (id === 'dishwashing') games[id] = createDishState(service?.dirtyDishes || 0)
    if (id === 'drinkPour') games[id] = createDrinkState(service?.drinkTickets || 0, service?.drinksServed || 0)
    games[id].runToken=globalThis.crypto?.randomUUID?.() || `${id}-${now}-${Math.random()}`
    startSession(id)
    draw(now)
    notify(true, now)
    return true
  }

  function resetAll() {
    KITCHEN_GAME_IDS.forEach((id) => reset(id))
  }

  function setDishBacklog(nextBacklog) {
    const count = Math.max(0, Math.round(Number(nextBacklog) || 0))
    const dishes = games.dishwashing
    if (count === dishes.remaining) return false
    if (count === 0) {
      games.dishwashing = createDishState(0)
      startSession('dishwashing')
    } else if (dishes.stage === 'empty' || dishes.completed) {
      games.dishwashing = createDishState(count)
      startSession('dishwashing')
    } else if (count > dishes.remaining) {
      const added = count - dishes.remaining
      dishes.remaining += added
      dishes.target += added
      publishStage('dishwashing', { dishesAdded: added, remaining: dishes.remaining })
    } else {
      dishes.remaining = count
      dishes.target = Math.max(dishes.cleanedCount + count, dishes.plate)
    }
    draw(performance.now())
    notify(true)
    return true
  }

  function addDirtyDishes(count = 1) {
    const amount = Math.max(0, Math.round(Number(count) || 0))
    if (!amount) return false
    return setDishBacklog(games.dishwashing.remaining + amount)
  }

  function select(id) {
    if (!KITCHEN_GAME_IDS.includes(id)) return false
    active = id
    draw(performance.now())
    notify(true)
    return true
  }

  function setPhase(nextPhase) {
    phase = nextPhase
    const now = performance.now()
    // A clock boundary must never auto-complete or discard a half-made batch.
    draw(now)
    notify(true, now)
  }

  function draw(now = performance.now()) {
    if (!visible) return
    prepareCanvas(canvas, context)
    if (active === 'saucePot') drawSauce(context, games.saucePot, phase, now, art, service)
    else if (active === 'doughToss') drawDough(context, games.doughToss, now, art)
    else if (active === 'dishwashing') drawDish(context, games.dishwashing, now, art)
    else drawDrink(context, games.drinkPour, art, now)
  }

  function updateSauce(point, type, now) {
    const sauce = games.saucePot
    const holding = service?.burning || (sauce.kind === 'tomato' && sauce.batchReady && service?.sauces.tomato > 0)
    if (holding) {
      if (type === 'down' && inCircle(point, 400, 326, 170)) {
        sauce.stirring = true
        sauce.lastAngle = Math.atan2(point.y - 326, point.x - 400)
      } else if (type === 'move' && sauce.stirring) {
        const angle = Math.atan2(point.y - 326, point.x - 400)
        const delta = shortestAngle(angle - sauce.lastAngle)
        if (Math.abs(delta) > 0.015) {
          sauce.spoonAngle += delta
          sauce.serviceStirs += Math.abs(delta)
          sauce.lastAngle = angle
          onStir(delta)
          if (Math.abs(delta) > 0.08 && sauce.splash.length < 30) {
            sauce.splash.push({
              x: 400 + Math.cos(angle) * 82,
              y: 326 + Math.sin(angle) * 58,
              vx: Math.cos(angle) * (18 + seeded(sauce.serviceStirs, 1) * 18),
              vy: -18 - seeded(sauce.serviceStirs, 2) * 24,
              time: now,
            })
          }
        }
      } else if (type === 'up') {
        sauce.stirring = false
      }
      return
    }
    if (sauce.stage === 'ingredients' && type === 'down') {
      const ingredientPositions = sauce.kind === 'pesto'
        ? [['basil',118],['garlic',306],['oil',494],['salt',682]]
        : [['tomatoes',118],['garlic',306],['basil',494],['salt',682]]
      const ingredient = ingredientPositions.find(([, x]) => inCircle(point, x, 112, 70))
      if (ingredient && !sauce.ingredients.includes(ingredient[0])) {
        sauce.ingredients.push(ingredient[0])
        sauce.ingredientAnimations.push({ id: ingredient[0], x: ingredient[1], startedAt: now })
        if (sauce.ingredients.length === 4) {
          sauce.ingredientsReadyAt = now + 760
        }
      }
    } else if (sauce.stage === 'stir') {
      if (type === 'down' && inCircle(point, 400, 326, 175)) {
        sauce.stirring = true
        sauce.lastAngle = Math.atan2(point.y - 326, point.x - 400)
      } else if (type === 'move' && sauce.stirring) {
        const angle = Math.atan2(point.y - 326, point.x - 400)
        const delta = shortestAngle(angle - sauce.lastAngle)
        sauce.stirTravel += Math.abs(delta)
        sauce.spoonAngle += delta
        sauce.lastAngle = angle
        if (Math.abs(delta) > 0.075 && sauce.splash.length < 30) {
          sauce.splash.push({
            x: 400 + Math.cos(angle) * 83,
            y: 326 + Math.sin(angle) * 58,
            vx: Math.cos(angle) * (16 + seeded(sauce.stirTravel, 3) * 20),
            vy: -16 - seeded(sauce.stirTravel, 4) * 24,
            time: now,
          })
        }
        if (sauce.stirTravel >= TAU * (upgrades.has('sauce-ladle') ? 2.25 : 2.65)) {
          sauce.stage = sauce.kind === 'pesto' ? 'complete' : 'simmer'
          sauce.simmerStart = now
          sauce.bubbles.forEach((bubble, index) => {
            bubble.availableAt = now + 260 + index * 430
          })
          sauce.stirring = false
          if(sauce.kind === 'pesto') finishSauceBatch()
          publishStage('saucePot', { turns: sauce.stirTravel / TAU })
        }
      } else if (type === 'up') sauce.stirring = false
    } else if (sauce.stage === 'simmer' && type === 'down') {
      const bubble = sauce.bubbles.find((item) => !item.popped && now >= item.availableAt && inCircle(point, item.x, item.y, item.radius + 12))
      if (bubble) {
        bubble.popped = true
        bubble.poppedAt = now
        if (sauce.bubbles.every((item) => item.popped)) {
          finishSauceBatch()
        }
      }
    }
  }

  function finishSauceBatch() {
    const sauce=games.saucePot
    sauce.stage='complete'; sauce.batchReady=true; sauce.completed=true
    onWork({type:'prep',kind:'sauce',sauce:sauce.kind,amount:5,id:`${sauce.runToken}:batch`})
    complete('saucePot', { portions:5, sauce:sauce.kind })
  }

  function updateDough(point, type, now) {
    if(service?.doughs >= 10) return
    const dough = games.doughToss
    if (dough.completed || dough.stage === 'airborne' || dough.stage === 'landing' || dough.stage === 'resting') return
    if (type === 'down' && inCircle(point, 400, 420, 178)) {
      dough.dragging = true
      dough.dragStart = point
      dough.dragPoint = point
    } else if (type === 'move' && dough.dragging) {
      dough.dragPoint = { x: clamp(point.x, 215, 585), y: clamp(point.y, 195, 475) }
    } else if (type === 'up' && dough.dragging) {
      const end = dough.dragPoint || point
      const dx = end.x - dough.dragStart.x
      const dy = end.y - dough.dragStart.y
      const score = scoreTossGesture(dx, dy)
      dough.dragging = false
      dough.dragPoint = null
      if (score < 12) return
      dough.stage = 'airborne'
      dough.airStart = now
      dough.airDuration = 760 + clamp((-dy - 70) / 180) * 280
      dough.launch = { dx: clamp(dx * 0.7, -130, 130), dy, score }
      dough.lastScore = score
      dough.lastOutcome = score >= 88 ? 'Silky catch' : score >= 62 ? 'Good stretch' : score >= 36 ? 'A little uneven' : 'Wobbly toss'
      dough.streak = score >= 75 ? dough.streak + 1 : 0
      dough.tosses += 1
      publishStage('doughToss', { score })
    }
  }

  function updateDish(point, type, now) {
    const dishes = games.dishwashing
    if (dishes.completed) return
    if (dishes.stage === 'scrub') {
      if (type === 'down' && (inCircle(point, dishes.sponge.x, dishes.sponge.y, 88) || inCircle(point, 400, 358, 168))) {
        dishes.scrubbing = true
        dishes.sponge = { x: clamp(point.x, 245, 555), y: clamp(point.y, 245, 456) }
        dishes.previousSponge = dishes.sponge
      } else if (type === 'move' && dishes.scrubbing) {
        const next = { x: clamp(point.x, 245, 555), y: clamp(point.y, 245, 456) }
        const previous = dishes.previousSponge || dishes.sponge
        const travel = Math.hypot(next.x - previous.x, next.y - previous.y)
        if (travel > 1) dishes.spongeAngle = Math.atan2(next.y - previous.y, next.x - previous.x) * 0.22 - 0.16
        const beforeAmount = grimeAmount(dishes.grime)
        const strength = 0.16 + clamp(travel / 90) * 0.13 + (upgrades.has('dish-drying-rack') ? .06 : 0)
        dishes.grime = scrubGrimeStroke(dishes.grime, previous, next, 18, strength)
        const afterAmount = grimeAmount(dishes.grime)
        dishes.cleaned = clamp(1 - afterAmount / dishes.initialGrime)
        dishes.sponge = next
        dishes.previousSponge = next
        if (afterAmount < beforeAmount) {
          const sudCount = Math.max(2, Math.min(6, Math.ceil(travel / 18)))
          for (let index = 0; index < sudCount; index += 1) {
            dishes.suds.push({ x: next.x + (seeded(index, now) - 0.5) * 50, y: next.y + (seeded(index + 5, now) - 0.5) * 38, time: now })
          }
        }
        if (!dishes.grime.length || dishes.cleaned >= 0.985) {
          dishes.grime = []
          dishes.cleaned = 1
          dishes.stage = 'rinse'
          dishes.scrubbing = false
          publishStage('dishwashing', { plate: dishes.plate })
        }
      } else if (type === 'up') {
        dishes.scrubbing = false
        dishes.previousSponge = null
      }
    } else if (dishes.stage === 'rinse') {
      if (type === 'down' && inRect(point, 330, 45, 285, 220)) dishes.rinsing = true
      if (type === 'up') dishes.rinsing = false
    }
  }

  function updateDrink(point, type, now) {
    const drinks = games.drinkPour
    if (drinks.completed || drinks.stage === 'scored') return
    if (type === 'down') {
      const flavorIds = Object.keys(drinkFlavors)
      const tapPositions = [216, 400, 584]
      const index = tapPositions.findIndex((x) => inRect(point, x - 72, 164, 144, 112))
      if (index >= 0) {
        const flavor = flavorIds[index]
        if (drinks.flavor && drinks.flavor !== flavor && drinks.fill > 0.02) drinks.mixed = true
        if (!drinks.flavor) drinks.flavor = flavor
        drinks.pouring = flavor
        drinks.cupTargetX = tapPositions[index]
        drinks.surfaceMotion = 1
        return
      }
      if (inRect(point, 610, 447, 154, 92) && drinks.fill >= 0.25) {
        const order = drinks.orders[drinks.orderIndex]
        const score = scoreDrink(drinks.fill, order.target, drinks.flavor === order.flavor, drinks.mixed)
        drinks.scores.push(score)
        drinks.pouring = null
        drinks.stage = 'scored'
        drinks.lastScore = score
        drinks.scoreShownAt = now
        drinks.nextOrderAt = now
        onWork({type:'bonus',kind:'drinkPour',score,id:`${drinks.runToken}:drink:${drinks.orderIndex}`})
        publishStage('drinkPour', { servedScore: score })
      }
    } else if (type === 'up') {
      drinks.pouring = null
      drinks.surfaceMotion = Math.max(drinks.surfaceMotion, 0.8)
    }
  }

  function handlePointer(type, event) {
    const point = canvasPoint(canvas, event)
    const now = performance.now()
    if (!isRunning()) return
    if(service?.burning && active === 'doughToss') return
    if (type === 'down') canvas.setPointerCapture(event.pointerId)
    if (active === 'saucePot') updateSauce(point, type, now)
    else if (active === 'doughToss') updateDough(point, type, now)
    else if (active === 'dishwashing') updateDish(point, type, now)
    else updateDrink(point, type, now)
    draw(now)
    notify(false, now)
  }

  canvas.addEventListener('pointerdown', (event) => handlePointer('down', event))
  canvas.addEventListener('pointermove', (event) => handlePointer('move', event))
  canvas.addEventListener('pointerup', (event) => handlePointer('up', event))
  canvas.addEventListener('pointercancel', (event) => handlePointer('up', event))

  function tick(now) {
    const delta = Math.min(80, now - lastFrame)
    const pausedDelta=Math.max(0, now-lastFrame)
    lastFrame = now
    // Preserve partial animations when off duty or paused, instead of catching up.
    if(!isRunning()) {
      shiftTimers(games,pausedDelta)
      for(const game of Object.values(games)) {game.dragging=false;game.stirring=false;game.rinsing=false;game.scrubbing=false;game.pouring=null}
      draw(now); frame=requestAnimationFrame(tick); return
    }
    const sauce = games.saucePot
    sauce.ingredientAnimations = sauce.ingredientAnimations.filter((item) => now - item.startedAt < 820)
    sauce.splash = sauce.splash.filter((item) => now - item.time < 680)
    if (!service?.burning && sauce.stage === 'ingredients' && sauce.ingredientsReadyAt && now >= sauce.ingredientsReadyAt) {
      sauce.ingredientsReadyAt = 0
      sauce.stage = 'stir'
      publishStage('saucePot', { ingredients: 4 })
    }
    const dough = games.doughToss
    if(service?.burning) {
      shiftTimers(dough,pausedDelta)
      if(!sauce.batchReady)shiftTimers(sauce,pausedDelta)
    } else if (dough.stage === 'airborne' && now - dough.airStart >= dough.airDuration) {
      const stretch = 0.1 + dough.launch.score / 100 * 0.13
      dough.doughSize += stretch * (upgrades.has('dough-cloth') ? 1.15 : 1) + (upgrades.has('dough-marble') && dough.launch.score >= 80 ? .035 : 0)
      dough.stage = 'landing'
      dough.landingAt = now
      dough.flourPuffs = Array.from({ length: 12 }, (_, index) => ({
        x: 330 + seeded(index, dough.tosses) * 140,
        y: 462 + seeded(index, dough.tosses + 1) * 18,
        vx: (seeded(index, dough.tosses + 2) - 0.5) * 80,
        time: now + index * 12,
      }))
      notify(true, now)
    } else if (dough.stage === 'landing' && now - dough.landingAt >= 420) {
      if (dough.doughSize >= 0.98) {
        dough.completedCount += 1
        dough.rackArrivalAt = now
        if (dough.completedCount >= 5) {
          dough.completed = true
          dough.stage = 'complete'
          complete('doughToss', { doughs: 5, tosses: dough.tosses })
        } else {
          dough.stage = 'resting'
          dough.restUntil = now + 520
        }
        onWork({type:'prep',kind:'dough',amount:1,id:`${dough.runToken}:dough:${dough.completedCount}`})
      } else dough.stage = 'ready'
      notify(true, now)
    } else if (dough.stage === 'resting' && now >= dough.restUntil) {
      dough.doughSize = 0.34
      dough.lastOutcome = ''
      dough.stage = 'ready'
      publishStage('doughToss', { completedCount: dough.completedCount })
    }

    const dishes = games.dishwashing
    if (dishes.stage === 'rinse' && dishes.rinsing) {
      dishes.rinse = clamp(dishes.rinse + delta / (upgrades.has('dish-sprayer') ? 900 : 1250))
      if (dishes.rinse >= 1) {
        dishes.rinsing = false
        dishes.cleanedCount += 1
        dishes.remaining = Math.max(0, dishes.remaining - 1)
        if (dishes.remaining <= 0) {
          dishes.completed = true
          dishes.stage = 'complete'
          complete('dishwashing', { dishes: dishes.cleanedCount })
        } else {
          dishes.plate = dishes.cleanedCount + 1
          dishes.grime = makeGrime(dishes.plate)
          dishes.initialGrime = grimeAmount(dishes.grime)
          dishes.cleaned = 0
          dishes.suds = []
          dishes.rinse = 0
          dishes.stage = 'scrub'
          publishStage('dishwashing', { plate: dishes.plate })
        }
        onWork({type:'bonus',kind:'dishwashing',id:`${dishes.runToken}:dish:${dishes.cleanedCount}`})
        publishStage('dishwashing', { cleaned: 1, remaining: dishes.remaining })
      }
    }

    const drinks = games.drinkPour
    drinks.cupX += (drinks.cupTargetX - drinks.cupX) * clamp(delta / 85)
    const cupUnderTap = Math.abs(drinks.cupTargetX - drinks.cupX) < 13
    if (drinks.pouring && cupUnderTap && !drinks.completed && drinks.stage === 'pour') {
      drinks.fill = Math.min(1.18, drinks.fill + delta / (upgrades.has('drink-regulator') ? 4200 : 3600))
      drinks.foam = clamp(drinks.foam + delta / (upgrades.has('drink-chill-plate') ? 7000 : 5200), 0.08, 0.78)
      drinks.surfaceMotion = 1
    } else {
      drinks.foam = Math.max(drinks.fill > 0 ? 0.05 : 0, drinks.foam - delta / 6000)
      drinks.surfaceMotion = Math.max(0, drinks.surfaceMotion - delta / 650)
    }
    if (drinks.stage === 'scored' && now >= drinks.nextOrderAt) {
      drinks.orderIndex += 1
      if (drinks.orderIndex >= drinks.orders.length) {
        drinks.stage = 'complete'
        drinks.completed = true
        complete('drinkPour', {
          drinks: drinks.orders.length,
          average: Math.round(drinks.scores.reduce((sum, value) => sum + value, 0) / drinks.scores.length),
        })
      } else {
        drinks.stage = 'pour'
        drinks.fill = 0
        drinks.flavor = null
        drinks.mixed = false
        drinks.foam = 0
        drinks.surfaceMotion = 0
        drinks.cupX = 400
        drinks.cupTargetX = 400
        publishStage('drinkPour', { orderIndex: drinks.orderIndex })
      }
    }

    draw(now)
    notify(false, now)
    frame = requestAnimationFrame(tick)
  }

  frame = requestAnimationFrame(tick)
  notify(true)

  return Object.freeze({
    ids: [...KITCHEN_GAME_IDS],
    select,
    reset,
    resetAll,
    setDishBacklog,
    addDirtyDishes,
    setService(next) {
      if(next?.burning && !service?.burning) {
        games.doughToss.dragging=false;games.doughToss.dragPoint=null;games.doughToss.dragStart=null
        games.saucePot.stirring=false
      }
      service=next
      setDishBacklog(service?.dirtyDishes || 0)
      const drinks=games.drinkPour
      if((drinks.stage === 'empty' || drinks.completed) && service?.drinkTickets > 0) reset('drinkPour')
      draw(performance.now())
      notify(false)
    },
    selectSauce(kind) {
      if(service?.burning) return false
      const next=kind === 'pesto' ? 'pesto' : 'tomato'
      if(games.saucePot.kind !== next) {
        const full=service?.sauces[next] >= 10
        games.saucePot={...createSauceState(),kind:next,stage:full?'complete':'ingredients',batchReady:full,completed:full,
          runToken:globalThis.crypto?.randomUUID?.() || `batch-${Date.now()}-${Math.random()}`}
        startSession('saucePot')
      }
      select('saucePot'); return true
    },
    showHoldingPot() {
      if(!service?.sauces.tomato && !service?.burning) return false
      if(games.saucePot.kind !== 'tomato' || !games.saucePot.batchReady) {
        games.saucePot={...createSauceState(),stage:'complete',kind:'tomato',batchReady:true,completed:true,runToken:globalThis.crypto?.randomUUID?.() || `hold-${Date.now()}`}
        startSession('saucePot')
      }
      select('saucePot');return true
    },
    getSavedState() {return {active,games:saveKitchenStations(games,performance.now())}},
    setUpgrades(upgradeIds = []) {
      upgrades = new Set(Array.isArray(upgradeIds) ? upgradeIds : [])
      draw(performance.now())
      notify(true)
    },
    setPhase,
    setVisible(nextVisible) {
      visible = Boolean(nextVisible)
      if(!visible)for(const game of Object.values(games)) {game.dragging=false;game.stirring=false;game.rinsing=false;game.scrubbing=false;game.pouring=null}
      draw(performance.now())
    },
    getDashboard: dashboard,
    getSnapshot(id) {
      return sessions[id]?.snapshot() || null
    },
    destroy() {
      cancelAnimationFrame(frame)
    },
  })
}
