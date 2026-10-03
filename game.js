import {
  bakeWindowFor,
  clamp,
  countTargetFor,
  coverageTargetFor,
  craftQuality,
  garmentValue,
  presentationBonus,
  scoreCoverage,
  scoreCuts,
  scoreTiming,
  scoreToppings,
  scoreTrace,
  seededValue,
} from './model.js'
import {
  createDomMinigameEmitter,
  createMinigameSession,
  MINIGAME_EVENT_NAME,
  MINIGAME_PROTOCOL_VERSION,
} from './minigame-runtime.js'
import {
  createKitchenMinigames,
  KITCHEN_GAME_META,
} from './kitchen-minigames.js'
import { createKitchenService, kitchenServiceSnapshot, advanceKitchenHeat, stirKitchenSauce, pizzaServiceGate,
  reservePizzaPrep, addKitchenPrep, completeKitchenPizza, consumeServiceTicket } from './kitchen-service.js'
import { renderKitchenServiceUI } from './kitchen-service-ui.js'
import { createPatternLibrary, patternAvailability, purchasePattern, patternLibrarySnapshot, ownedPatternList, markPatternUsed } from './pattern-library.js'
import { pizzaContinuation, kitchenContinuation, renderWorkbenchAction, layoutFashionWorkspace } from './minigame-actions.js'
import { pizzeriaShift } from './pizzeria-shift.js'
import {
  FASHION_FABRICS,
  FASHION_CATALOG_GARMENTS,
  FASHION_FINISHES,
  FASHION_MODIFICATIONS,
  FASHION_SCHEMATICS,
  schematicById,
  tailorStockForDay,
} from './fashion-catalog.js'
import { constructionRecipe, currentFashionSeam, effectiveSchematic, compatibleFashionFabric,
  compatibleFashionModifications, compatibleFashionFinishes, fashionFinishZones,
  fashionFinishScore, fashionGarmentDraft, constructionTraceScore, traceCompletion } from './fashion-construction.js'
import { fashionProductPreview, fashionProductPainting } from './fashion-workshop-preview.js'
import { gameStorage, isFashionPlaytest, activeSession } from './game-storage.js'
import {createGameClock, clockSnapshot, advanceGameClock, nextGameDay} from './game-clock.js'
import {ECONOMY_BALANCE, pizzaEarnings, dishEarnings, sodaEarnings, incomeForecast, garmentSetEffects, orderGarmentTipBonus, reputationAward, loyaltyTipBonus,
  fashionSupplyQuote, fashionProjectQuote, createDayLedger, recordDayActivity, rollDayLedger} from './economy.js'
import { fashionInventoryFor, restoreFashionProject, steadyHandOffset, steadyHandSection, steadyHandAccuracy, fashionPassScore, STEADY_HAND_SECTIONS } from './fashion-workflow.js'
import {
  COUNTER_UPGRADES,
  PROGRESSION_STORAGE_KEY,
  createProgressionState,
  progressionSnapshot,
  purchaseUpgrade,
  recordGarmentResult,
  recordPizzaResult,
  recordServiceIncome,
} from './progression.js'

const pizzaCanvas = document.querySelector('#pizzaCanvas')
const pizzaContext = pizzaCanvas.getContext('2d')
const fashionCanvas = document.querySelector('#fashionCanvas')
const fashionContext = fashionCanvas.getContext('2d')
const kitchenCanvas = document.querySelector('#kitchenCanvas')
const LOGICAL_CANVAS_SIZE = 600
const SEWING_NEEDLE = { x: 312, y: 236 }
const cheeseMergeCanvas = document.createElement('canvas')
const cheeseMergeContext = cheeseMergeCanvas.getContext('2d')
cheeseMergeCanvas.width = LOGICAL_CANVAS_SIZE
cheeseMergeCanvas.height = LOGICAL_CANVAS_SIZE
const pizzaCompositeCanvas = document.createElement('canvas')
const pizzaCompositeContext = pizzaCompositeCanvas.getContext('2d')
pizzaCompositeCanvas.width = LOGICAL_CANVAS_SIZE
pizzaCompositeCanvas.height = LOGICAL_CANVAS_SIZE
const fashionCutCanvas = document.createElement('canvas')
const fashionCutContext = fashionCutCanvas.getContext('2d')
fashionCutCanvas.width = LOGICAL_CANVAS_SIZE
fashionCutCanvas.height = LOGICAL_CANVAS_SIZE

function smoothstep(value) {
  const amount = clamp(value, 0, 1)
  return amount * amount * (3 - 2 * amount)
}

function bakeStatusFor(progress, running = true) {
  if (!running) return { key: 'ready', label: 'Stone oven ready', cue: 'Start the bake, then watch the pizza—not a meter.' }
  if (progress < 0.16) return { key: 'heating', label: 'Heating', cue: 'The dough is warming and beginning to relax.' }
  if (progress < 0.36) return { key: 'rising', label: 'Rising', cue: 'Watch the rim puff and lift from the stone.' }
  if (progress < 0.56) return { key: 'melting', label: 'Cheese melting', cue: 'The cheese is softening; the crust is still pale.' }
  if (progress < 0.73) return { key: 'browning', label: 'Browning', cue: 'Golden freckles are appearing around the rim.' }
  if (progress < 0.81) return { key: 'crispy', label: 'Crispy', cue: 'Crisp edge, bubbling cheese—this is the serving window.' }
  return { key: 'burning', label: 'Burning', cue: 'Dark spots and smoke mean it needs to come out now.' }
}

function pizzaBakeAmount(pizza = state.pizza) {
  return ['bake', 'finish', 'cut'].includes(pizza.step) ? clamp(pizza.bakeProgress, 0, 1) : 0
}

function prepareCanvas(canvas, context) {
  const scale = canvas.width / LOGICAL_CANVAS_SIZE
  context.setTransform(1, 0, 0, 1, 0, 0)
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.setTransform(scale, 0, 0, scale, 0, 0)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
}

const workstationArt = {
  pizza: {
    starter: new Image(),
    garden: new Image(),
    artisan: new Image(),
  },
  oven: new Image(),
  tailor: new Image(),
}
const materialArt = {
  dough: new Image(),
  ingredients: new Image(),
  sauce: new Image(),
  pesto: new Image(),
  cheeseMelt: new Image(),
  fabrics: new Image(),
  fashionPatterns: new Image(),
  notions: new Image(),
  pizzaTools: new Image(),
  pizzaCutter: new Image(),
  pizzaPeel: new Image(),
  shears: new Image(),
  sewingMachine: new Image(),
  alterationTools: new Image(),
  upgrades: new Image(),
  upgradeFood: new Image(),
  upgradeTools: new Image(),
}
workstationArt.pizza.starter.src = 'assets/game/pizza-workstation-v4.png'
workstationArt.pizza.garden.src = 'assets/game/pizza-workstation-garden-v2.png'
workstationArt.pizza.artisan.src = 'assets/game/pizza-workstation-artisan-v2.png'
workstationArt.oven.src = 'assets/game/pizza-oven-v1.png'
workstationArt.tailor.src = 'assets/game/tailor-workstation-v2.png'
materialArt.dough.src = 'assets/game/pizza-dough-v1.png'
materialArt.ingredients.src = 'assets/game/pizza-ingredients-v1.png'
materialArt.sauce.src = 'assets/game/pizza-sauce-stamps-v1.png'
materialArt.pesto.src = 'assets/game/pizza-pesto-stamps-v1.png'
materialArt.cheeseMelt.src = 'assets/game/pizza-shredded-cheese-melt-v1.png'
materialArt.fabrics.src = 'assets/game/fabric-textures-v1.png'
materialArt.fashionPatterns.src = 'assets/game/fashion-pattern-catalog-v1.png'
materialArt.notions.src = 'assets/game/fashion-notions-v1.png'
materialArt.pizzaTools.src = 'assets/game/pizza-tools-v1.png'
materialArt.pizzaCutter.src = 'assets/game/pizza-cutter-v1.png'
materialArt.pizzaPeel.src = 'assets/game/pizza-peel-v1.png'
materialArt.shears.src = 'assets/game/tailor-shears-v1.png'
materialArt.sewingMachine.src = 'assets/game/sewing-machine-v1.png'
materialArt.alterationTools.src = 'assets/game/fashion-alteration-tools-v1.png'
materialArt.upgrades.src = 'assets/game/pizza-upgrade-atlas-v1.png'
materialArt.upgradeFood.src = 'assets/game/pizza-upgrade-food-variants-v1.png'
materialArt.upgradeTools.src = 'assets/game/pizza-upgrade-tools-v1.png'
Object.values(workstationArt.pizza).forEach((image) => {
  image.addEventListener('load', () => state.pizza && drawPizzaCanvas())
})
workstationArt.oven.addEventListener('load', () => state.pizza && drawPizzaCanvas())
workstationArt.tailor.addEventListener('load', () => state.fashion && drawFashionCanvas())
Object.values(materialArt).forEach((image) => {
  image.addEventListener('load', () => {
    if (state.pizza) drawPizzaCanvas()
    if (state.fashion) drawFashionCanvas()
  })
})

const elements = {
  fashionCanvasWrap: document.querySelector('#fashionCanvasWrap'),
  avatarApron: document.querySelector('#avatarApron'),
  avatarBody: document.querySelector('#avatarBody'),
  coinCount: document.querySelector('#coinCount'),
  fashionActivity: document.querySelector('#fashionActivity'),
  fashionBadge: document.querySelector('#fashionBadge'),
  fashionClearButton: document.querySelector('#fashionClearButton'),
  fashionInstruction: document.querySelector('#fashionInstruction'),
  fashionNextButton: document.querySelector('#fashionNextButton'),
  fashionInventoryNote: document.querySelector('#fashionInventoryNote'),
  fashionModificationBench: document.querySelector('#fashionModificationBench'),
  fashionPatternSelector: document.querySelector('#fashionPatternSelector'),
  fashionStyleControls: document.querySelector('#fashionStyleControls'),
  fashionStepNumber: document.querySelector('#fashionStepNumber'),
  fashionStepPips: document.querySelector('#fashionStepPips'),
  fashionTaskCopy: document.querySelector('#fashionTaskCopy'),
  fashionTools: document.querySelector('#fashionTools'),
  fashionVerb: document.querySelector('#fashionVerb'),
  finishRating: document.querySelector('#finishRating'),
  garmentName: document.querySelector('#garmentName'),
  kitchenActivity: document.querySelector('#kitchenActivity'),
  kitchenBadge: document.querySelector('#kitchenBadge'),
  kitchenGameSelector: document.querySelector('#kitchenGameSelector'),
  kitchenHintStrip: document.querySelector('#kitchenHintStrip'),
  kitchenInstruction: document.querySelector('#kitchenInstruction'),
  kitchenPhaseStamp: document.querySelector('#kitchenPhaseStamp'),
  kitchenReadout: document.querySelector('#kitchenReadout'),
  kitchenResetButton: document.querySelector('#kitchenResetButton'),
  kitchenStepIcon: document.querySelector('#kitchenStepIcon'),
  kitchenTaskCopy: document.querySelector('#kitchenTaskCopy'),
  kitchenTaskName: document.querySelector('#kitchenTaskName'),
  kitchenVerb: document.querySelector('#kitchenVerb'),
  materialRating: document.querySelector('#materialRating'),
  outfitCopy: document.querySelector('#outfitCopy'),
  outfitName: document.querySelector('#outfitName'),
  phaseCopy: document.querySelector('#phaseCopy'),
  phaseTitle: document.querySelector('#phaseTitle'),
  pizzaActivity: document.querySelector('#pizzaActivity'),
  pizzaBadge: document.querySelector('#pizzaBadge'),
  pizzaInstruction: document.querySelector('#pizzaInstruction'),
  pizzaLiveScore: document.querySelector('#pizzaLiveScore'),
  pizzaMenuSelector: document.querySelector('#pizzaMenuSelector'),
  pizzaNextButton: document.querySelector('#pizzaNextButton'),
  pizzaOrderKicker: document.querySelector('#pizzaOrderKicker'),
  pizzaOrderNumber: document.querySelector('#pizzaOrderNumber'),
  pizzaOutfitBonus: document.querySelector('#pizzaOutfitBonus'),
  pizzaStepNumber: document.querySelector('#pizzaStepNumber'),
  pizzaStepPips: document.querySelector('#pizzaStepPips'),
  pizzaTaskCopy: document.querySelector('#pizzaTaskCopy'),
  pizzaTaskName: document.querySelector('#pizzaTaskName'),
  pizzaTableLabel: document.querySelector('#pizzaTableLabel'),
  pizzaTicketName: document.querySelector('#pizzaTicketName'),
  pizzaTierSelector: document.querySelector('#pizzaTierSelector'),
  pizzaTitle: document.querySelector('#pizzaTitle'),
  pizzaSubtitle: document.querySelector('#pizzaSubtitle'),
  pizzaTools: document.querySelector('#pizzaTools'),
  pizzaUndoButton: document.querySelector('#pizzaUndoButton'),
  pizzaVerb: document.querySelector('#pizzaVerb'),
  precisionRating: document.querySelector('#precisionRating'),
  reputationCount: document.querySelector('#reputationCount'),
  recipeBookCloseButton: document.querySelector('#recipeBookCloseButton'),
  recipeBookDialog: document.querySelector('#recipeBookDialog'),
  recipeBookDoneButton: document.querySelector('#recipeBookDoneButton'),
  recipeBookIntro: document.querySelector('#recipeBookIntro'),
  recipeBookPages: document.querySelector('#recipeBookPages'),
  resetProgressButton: document.querySelector('#resetProgressButton'),
  resultActions: document.querySelector('#resultActions'),
  resultBreakdown: document.querySelector('#resultBreakdown'),
  resultCloseButton: document.querySelector('#resultCloseButton'),
  resultCopy: document.querySelector('#resultCopy'),
  resultDialog: document.querySelector('#resultDialog'),
  resultHero: document.querySelector('#resultHero'),
  resultKicker: document.querySelector('#resultKicker'),
  resultTitle: document.querySelector('#resultTitle'),
  shiftCustomerQueue: document.querySelector('#shiftCustomerQueue'),
  shiftDirtyDishes: document.querySelector('#shiftDirtyDishes'),
  shiftQueueSummary: document.querySelector('#shiftQueueSummary'),
  shiftSauceStatus: document.querySelector('#shiftSauceStatus'),
  ticketItems: document.querySelector('#ticketItems'),
  upgradeCounterGrid: document.querySelector('#upgradeCounterGrid'),
  upgradeCounterSummary: document.querySelector('#upgradeCounterSummary'),
  valueRating: document.querySelector('#valueRating'),
}

const fashionSteps = ['plan', 'cut', 'sew', 'finish']
const toppingDetails = {
  pepperoni: { label: 'Pepperoni', color: '#b74432' },
  mushroom: { label: 'Mushroom', color: '#dec9a7' },
  basil: { label: 'Basil', color: '#4c8054' },
  pepper: { label: 'Sweet pepper', color: '#db5b35', upgradeColumn: 2 },
  onion: { label: 'Red onion', color: '#9c5680', upgradeColumn: 3 },
}
const stationTiers = {
  starter: {
    id: 'starter', rank: 'Counter I', label: 'Classic counter', cost: 0,
    blurb: '5 stages · spoon, shaker, three toppings',
    title: 'The garden table', ticket: 'Garden pie',
    copy: 'Even tomato sauce, a light blanket of cheese, then match the illustrated topping counts.',
    steps: ['sauce', 'cheese', 'toppings', 'bake', 'cut'],
    sauce: { id: 'tomato', label: 'Tomato sauce', target: 0.78, minimum: 0.45, interaction: 'spread' },
    cheese: { id: 'shredded', label: 'Shredded cheese', target: 0.72, minimum: 0.4, interaction: 'scatter' },
    toppings: { pepperoni: 6, mushroom: 4, basil: 3 },
  },
  garden: {
    id: 'garden', rank: 'Counter II', label: 'Expanded garden counter', cost: 240,
    blurb: '5 stages · spoon-spread pesto, inset produce trays',
    title: 'The market special', ticket: 'Pesto market pie',
    copy: 'Spread pesto across the dough, add shredded cheese, then arrange peppers, onions, and basil.',
    steps: ['sauce', 'cheese', 'toppings', 'bake', 'cut'],
    sauce: { id: 'pesto', label: 'Pesto', target: 0.62, minimum: 0.4, interaction: 'spread' },
    cheese: { id: 'shredded', label: 'Shredded cheese', target: 0.68, minimum: 0.38, interaction: 'scatter' },
    toppings: { pepper: 4, onion: 4, basil: 3 },
  },
  artisan: {
    id: 'artisan', rank: 'Counter III', label: 'Artisan finishing counter', cost: 640,
    blurb: '6 stages · fresh mozzarella and post-bake oil',
    title: 'The atelier order', ticket: 'Artisan garden pie',
    copy: 'Build a pesto base, space torn mozzarella by hand, arrange market vegetables, then brush with oil after baking.',
    steps: ['sauce', 'cheese', 'toppings', 'bake', 'finish', 'cut'],
    sauce: { id: 'pesto', label: 'Pesto', target: 0.62, minimum: 0.4, interaction: 'spread' },
    cheese: { id: 'freshMozzarella', label: 'Fresh mozzarella', target: 8, minimum: 8, interaction: 'place' },
    toppings: { pepper: 3, onion: 3, basil: 4 },
    finish: { id: 'oliveOil', label: 'Olive-oil finish', target: 0.3, minimum: 0.18, interaction: 'brush' },
  },
}
const recipeProfiles = {
  starter: {
    tierId: 'starter',
    name: 'Garden pie',
    note: 'Tomato, a light cheese blanket, and familiar toppings.',
    sauce: 'regular',
    cheese: 'light',
    toppings: { pepperoni: 'regular', mushroom: 'regular', basil: 'regular' },
    bake: 'regular',
  },
  garden: {
    tierId: 'garden',
    name: 'Pesto market pie',
    note: 'Pesto, shredded cheese, market vegetables, and basil.',
    sauce: 'regular',
    cheese: 'regular',
    toppings: { pepper: 'regular', onion: 'regular', basil: 'regular' },
    bake: 'regular',
  },
  artisan: {
    tierId: 'artisan',
    name: 'Artisan garden pie',
    note: 'Pesto, fresh mozzarella, vegetables, and a light oil finish.',
    sauce: 'regular',
    cheese: 'regular',
    toppings: { pepper: 'regular', onion: 'regular', basil: 'regular' },
    bake: 'crispy',
    finish: 'light',
  },
}
const orderVariations = [
  { sauce: 'light', firstTopping: 'extra', bake: 'crispy', slices: 6 },
  { cheese: 'extra', secondTopping: 'light', slices: 8 },
  { sauce: 'extra', firstTopping: 'light', bake: 'soft', slices: 4 },
  { cheese: 'light', secondTopping: 'extra', bake: 'crispy', slices: 8 },
]
const qualifierLabels = {
  light: 'Light',
  regular: 'Regular',
  extra: 'Extra',
  soft: 'Soft bake',
  crispy: 'Crispy',
}

function qualifierLabel(qualifier) {
  return qualifierLabels[qualifier] || qualifierLabels.regular
}

function createPizzaOrder(tierId, number = 1, { custom = false } = {}) {
  const tier = stationTiers[tierId] || stationTiers.starter
  const profile = recipeProfiles[tier.id]
  const variation = orderVariations[(number - 1) % orderVariations.length]
  const toppingIds = Object.keys(tier.toppings)
  const toppings = { ...profile.toppings }
  if (variation.firstTopping && toppingIds[0]) toppings[toppingIds[0]] = variation.firstTopping
  if (variation.secondTopping && toppingIds[1]) toppings[toppingIds[1]] = variation.secondTopping
  if (custom && toppingIds[2]) toppings[toppingIds[2]] = number % 2 ? 'extra' : 'light'
  return {
    number,
    custom,
    name: custom ? 'Custom pie' : profile.name,
    sauce: variation.sauce || profile.sauce,
    cheese: variation.cheese || profile.cheese,
    toppings,
    bake: variation.bake || profile.bake,
    finish: profile.finish || null,
    slices: variation.slices || 6,
  }
}

function pizzaOrderSummary(pizza = state.pizza) {
  const tier = stationTierFor(pizza)
  const profile = recipeProfiles[tier.id]
  const changes = []
  if (pizza.order.sauce !== profile.sauce) changes.push(`${qualifierLabel(pizza.order.sauce).toLowerCase()} ${tier.sauce.label.toLowerCase()}`)
  if (pizza.order.cheese !== profile.cheese) changes.push(`${qualifierLabel(pizza.order.cheese).toLowerCase()} ${tier.cheese.label.toLowerCase()}`)
  Object.keys(tier.toppings).forEach((id) => {
    if (pizza.order.toppings[id] !== profile.toppings[id]) {
      changes.push(`${qualifierLabel(pizza.order.toppings[id]).toLowerCase()} ${toppingDetails[id].label.toLowerCase()}`)
    }
  })
  if (pizza.order.bake !== profile.bake) changes.push(`${qualifierLabel(pizza.order.bake).toLowerCase()} bake`)
  if (pizza.order.slices !== 6) changes.push(`${pizza.order.slices} slices`)
  const prefix = pizza.order.custom ? 'Custom pie' : profile.name
  return changes.length ? `${prefix}: ${changes.join(', ')}.` : `${prefix}: house preparation.`
}

function sauceTargetFor(pizza = state.pizza) {
  return coverageTargetFor(pizza.order.sauce, 'sauce')
}

function cheeseTargetFor(pizza = state.pizza) {
  const tier = stationTierFor(pizza)
  return tier.cheese.interaction === 'place'
    ? countTargetFor(tier.cheese.target, pizza.order.cheese)
    : coverageTargetFor(pizza.order.cheese, 'cheese')
}

function toppingTargetsFor(pizza = state.pizza) {
  const tier = stationTierFor(pizza)
  return Object.fromEntries(Object.entries(tier.toppings).map(([id, baseCount]) => (
    [id, countTargetFor(baseCount, pizza.order.toppings[id])]
  )))
}

function finishTargetFor(pizza = state.pizza) {
  return coverageTargetFor(pizza.order.finish || 'regular', 'finish')
}

function bakeTargetFor(pizza = state.pizza) {
  return bakeWindowFor(pizza.order.bake)
}

function cutTargetFor(pizza = state.pizza) {
  return Math.max(2, Math.round(pizza.order.slices / 2))
}
const expansionIngredients = {
  pesto: { column: 0 },
  freshMozzarella: { column: 1 },
  pepper: { column: 2 },
  onion: { column: 3 },
  oliveOil: { column: 5 },
}

function stationTierFor(pizza = state.pizza) {
  return stationTiers[pizza?.tierId || state.pizzaTier] || stationTiers.starter
}

function pizzaStepsFor(pizza = state.pizza) {
  return stationTierFor(pizza).steps
}

function toppingOrderFor(pizza = state.pizza) {
  return toppingTargetsFor(pizza)
}
const ingredientZones = {
  sauce: { x: 58, y: 126, radius: 58, label: 'sauce bowl' },
  cheese: { x: 225, y: 45, radius: 50, label: 'cheese bin' },
  pepperoni: { x: 338, y: 45, radius: 48, label: 'pepperoni bin' },
  mushroom: { x: 443, y: 45, radius: 50, label: 'mushroom bin' },
  basil: { x: 550, y: 45, radius: 48, label: 'basil bin' },
  pesto: { x: 535, y: 148, radius: 57, label: 'pesto mortar' },
  freshMozzarella: { x: 47, y: 298, radius: 55, label: 'fresh mozzarella bowl' },
  pepper: { x: 68, y: 490, radius: 58, label: 'sweet pepper tray' },
  onion: { x: 532, y: 490, radius: 58, label: 'red onion tray' },
  oliveOil: { x: 554, y: 335, radius: 60, label: 'olive-oil finishing tools' },
}
const fabrics = FASHION_FABRICS
const finishes = FASHION_FINISHES


function fashionGuides(fashion) {
  const recipe = constructionRecipe(effectiveSchematic(fashion), fashion.fabric)
  return {cut:recipe.cut, seam:currentFashionSeam(fashion).points}
}

const phaseCopy = {
  morning: {
    title: 'Morning prep',
    copy: 'A gentle first order. The kitchen is all pale gold and cool shadows.',
  },
  noon: {
    title: 'Noon rush',
    copy: 'Clear task light and quick tickets. Local colors are bright and honest.',
  },
  dusk: {
    title: 'Dusk service',
    copy: 'Coral skies outside; the oven and workshop lamps glow against violet shadows.',
  },
  night: {
    title:'Night atelier',
    copy:'Quiet streets, warm lamps. Service and crafting stay open; a new day begins at 06:00.',
  },
}

const fabricPatternCache = new Map()
const proceduralFabricCache = new Map()

function createDailyFashionInventory(day = 1, reputation = 0, atelierLevel = 1, saved = null) {
  return fashionInventoryFor(day, reputation, atelierLevel, saved)
}

function loadSavedProgress() {
  try {
    return JSON.parse(gameStorage()?.getItem(PROGRESSION_STORAGE_KEY) || 'null') || {}
  } catch {
    return {}
  }
}

const savedProgress = loadSavedProgress()
const initialProgression = createProgressionState(savedProgress.progression)
const initialClock=createGameClock(savedProgress.clock,{day:savedProgress.fashionDay || 1,phase:savedProgress.phase})

function menuForProgression(progression) {
  const menu = new Set(['starter'])
  if (progression.ownedUpgrades.includes('pizza-garden')) menu.add('garden')
  if (progression.ownedUpgrades.includes('pizza-artisan')) menu.add('artisan')
  return menu
}

const state = {
  coins: savedProgress.coins == null ? ECONOMY_BALANCE.startingCoins : Math.max(0, Math.round(Number(savedProgress.coins) || 0)),
  reputation: Math.max(0, Math.round(Number(savedProgress.reputation) || 0)),
  reputationCarry:Math.max(0,Math.min(.999,Number(savedProgress.reputationCarry)||0)),
  clock:initialClock,
  ledger:null,
  phase: clockSnapshot(initialClock).phase,
  lightingPreview: clockSnapshot(initialClock).phase,
  outfit: null,
  menu: menuForProgression(initialProgression),
  orderNumber: Math.max(1,Number(savedProgress.orderNumber) || 1),
  pizzaTier: 'starter',
  fashionDay: initialClock.day,
  fashionInventory: null,
  patternLibrary: createPatternLibrary(savedProgress.patternLibrary, { project:savedProgress.fashionProject }),
  progression: initialProgression,
  fashionSetEffects: {
    tipBonus: 0,
    vegetableTipBonus: 0,
    duskTipBonus: 0,
    tailoringFinish: 0,
    reputationBonus: 0,
    materialSavings: 0,
    names: [],
  },
  pizza: null,
  fashion: null,
  kitchenService: createKitchenService(savedProgress.kitchenService),
}
state.fashionInventory = createDailyFashionInventory(state.fashionDay, state.reputation, state.progression.atelierLevel, savedProgress.fashionInventory)
state.ledger=createDayLedger(savedProgress.ledger,state.fashionDay,state.coins)

document.addEventListener('slice-and-stitch:character-changed', (event) => {
  state.fashionSetEffects = garmentSetEffects(event.detail?.sets || [])
  const handmade=(event.detail?.equippedGarments || []).filter(piece=>piece.source==='crafted').sort((a,b)=>b.quality-a.quality)[0]
  state.outfit=handmade ? {...handmade,color:handmade.palette.primary,bonus:presentationBonus(handmade.quality)} : null
  updateProgress()
})

pizzeriaShift.restore(savedProgress.shift, state.kitchenService.dirtyDishes)

function nextQueuedPizza(number = state.orderNumber) {
  let customer = pizzeriaShift.claimNextOrder()
  if (!customer) {
    pizzeriaShift.walkIn()
    customer = pizzeriaShift.claimNextOrder()
  }
  const offered = [...state.menu]
  const preferred = customer?.preferredTier
  const tierId = preferred && offered.includes(preferred)
    ? preferred
    : offered.length
      ? offered[(number - 1) % offered.length]
      : state.pizzaTier
  const custom = number % 4 === 0 || offered.length === 0
  const order = createPizzaOrder(tierId, number, { custom })
  return {
    tierId,
    order: {
      ...order,
      customerId: customer?.id || null,
      customerName: customer?.name || 'Walk-in customer',
      table: 2 + (number * 3) % 9,
    },
  }
}

const emitMinigameEvent = createDomMinigameEmitter(document)
const minigameSessions = {
  pizza: createMinigameSession('pizza', { emit: emitMinigameEvent }),
  fashion: createMinigameSession('fashion', { emit: emitMinigameEvent }),
}
let kitchenMinigames = null
let coopStirTurns = 0
let latestKitchenDashboard = null

function ownsUpgrade(upgradeId) {
  return state.progression.ownedUpgrades.includes(upgradeId)
}

function persistProgress() {
  try {
    gameStorage()?.setItem(PROGRESSION_STORAGE_KEY, JSON.stringify(gameSave()))
  } catch {
    // A blocked storage context should never stop a minigame.
  }
}
function gameSave() {
  return {
      coins: state.coins,
      reputation: state.reputation,
      reputationCarry:state.reputationCarry,
      clock:state.clock,
      ledger:state.ledger,
      fashionDay: state.fashionDay,
      phase: state.phase,
      fashionInventory: state.fashionInventory,
      patternLibrary: state.patternLibrary,
      fashionProject: state.fashion && !state.fashion.completed ? {...state.fashion, dragging:false, lastPointer:null, motionStartedAt:0, motionLastAt:0,startingProject:false,completing:false} : null,
      progression: state.progression,
      kitchenService:state.kitchenService,
      kitchenStations:kitchenMinigames?.getSavedState(),
      pizzaProject:savePizzaProject(state.pizza),
      orderNumber:state.orderNumber+(state.pizza?.served ? 1 : 0),
      shift:pizzeriaShift.snapshot(),
  }
}
const coopActive=()=>Boolean(activeSession())
const roomCommand=(type,data,key)=>window.sliceAndStitchCoop?.transact(type,data,key) || Promise.resolve({ok:false,reason:'The room is connecting. Please wait before starting shared work.'})
function roomWarning(result) { if(!result?.ok) document.dispatchEvent(new CustomEvent('slice-and-stitch:toast',{detail:{message:result?.reason || 'The room could not confirm this action.'}})) }
window.sliceAndStitchCoopGame=Object.freeze({
  getSave:()=>JSON.parse(JSON.stringify(gameSave())),
  save:persistProgress,
  applyShared(shared,playerId) {
    const progressionChanged=JSON.stringify(state.progression)!==JSON.stringify(shared.progression)
    const inventoryChanged=JSON.stringify(state.fashionInventory)!==JSON.stringify(shared.fashionInventory)
    const newDay=shared.clock.day!==state.clock.day
    const newPatterns=shared.patternLibrary.owned.some(id=>!state.patternLibrary.owned.includes(id))
    state.coins=shared.coins;state.reputation=shared.reputation;state.reputationCarry=shared.reputationCarry
    state.ledger=shared.ledger;state.progression=createProgressionState(shared.progression)
    state.fashionDay=shared.clock.day;state.fashionInventory=shared.fashionInventory
    state.patternLibrary=createPatternLibrary({...shared.patternLibrary,sort:newPatterns?'newest':state.patternLibrary.sort})
    state.kitchenService=createKitchenService({...shared.kitchenService,reservation:shared.reservations[playerId] || null})
    state.menu=menuForProgression(state.progression)
    state.clock=createGameClock(shared.clock);applyPhase(clockSnapshot(state.clock).phase)
    if(state.pizza) state.pizza.prepReserved=state.kitchenService.reservation?.id===state.pizza.id
    // Recover a committed charge whose acknowledgement was lost before reload.
    const paid=state.fashion && shared.projects[state.fashion.projectId]
    if(paid && state.fashion.step==='plan' && paid.playerId===playerId) {
      state.fashion.materialConsumed=true;state.fashion.paidCost=paid.paidCost;state.fashion.step='cut'
    }
    if(state.fashion && !state.fashion.completed && !state.fashion.completing && shared.customGarments.some(g=>g.customization?.projectId===state.fashion.projectId)) {
      state.fashion=freshFashion();beginFashionSession(state.fashion)
      document.dispatchEvent(new CustomEvent('slice-and-stitch:toast',{detail:{message:'Your finished garment is already saved in the shared clothing chest.'}}))
    }
    if(state.pizza && !state.pizza.served && !state.pizza.completing && shared.completedPizzas?.[state.pizza.id]?.playerId===playerId) {
      pizzeriaShift.serveCurrent({order:state.pizza.order},2)
      state.orderNumber++;const next=nextQueuedPizza(state.orderNumber)
      state.pizza=freshPizza(next.tierId,next.order);beginPizzaSession(state.pizza);renderTicket()
    }
    kitchenMinigames?.setUpgrades(state.progression.ownedUpgrades)
    syncKitchenService();updateProgress();publishClock(newDay)
    if(state.fashion?.step==='plan' && (inventoryChanged || newPatterns || progressionChanged)) renderFashion()
    renderPizzaTierSelector();renderPizzaMenuSelector();persistProgress()
    document.dispatchEvent(new CustomEvent('slice-and-stitch:shared-inventory',{detail:{wardrobe:shared.wardrobe,customGarments:shared.customGarments}}))
    if(progressionChanged) document.dispatchEvent(new CustomEvent('slice-and-stitch:progression-changed',{detail:progressionSnapshot(state.progression,state.coins)}))
  },
})

function progressionRequirementCopy(milestone) {
  if (!milestone) return 'Every atelier milestone is complete.'
  const regular = milestone.requirements.map((requirement) => {
    if (requirement.metric === 'upgrade') {
      const upgrade = COUNTER_UPGRADES.find((item) => item.id === requirement.id)
      return `${upgrade?.name || 'Equipment'} ${requirement.complete ? 'installed' : 'needed'}`
    }
    return `${requirement.current}/${requirement.target} ${requirement.label}`
  }).join(' · ')
  return regular+(milestone.shortcut ? ` · or ${milestone.shortcut.income} earned + ${milestone.shortcut.garments} garments + ${milestone.shortcut.accuracy}% best construction` : '')
}

function applyProgression(nextProgression, { announce = true } = {}) {
  const previousLevel = state.progression.atelierLevel
  state.progression = createProgressionState(nextProgression)
  state.fashionInventory = createDailyFashionInventory(state.fashionDay, state.reputation, state.progression.atelierLevel, state.fashionInventory)
  kitchenMinigames?.setUpgrades(state.progression.ownedUpgrades)
  persistProgress()
  renderUpgradeCounter()
  if (announce) {
    document.dispatchEvent(new CustomEvent('slice-and-stitch:progression-changed', {
      detail: progressionSnapshot(state.progression, state.coins),
    }))
  }
  return state.progression.atelierLevel > previousLevel
}

function beginPizzaSession(pizza) {
  minigameSessions.pizza.begin({
    order: pizza.order,
    tierId: pizza.tierId,
  })
}

function beginFashionSession(fashion) {
  minigameSessions.fashion.begin({
    project: fashion.schematic?.id || 'service-apron',
    fabric: fashion.fabric?.id || null,
  })
}

window.sliceAndStitchMinigames = Object.freeze({
  protocolVersion: MINIGAME_PROTOCOL_VERSION,
  eventName: MINIGAME_EVENT_NAME,
  getSnapshot: (kind) => minigameSessions[kind]?.snapshot() || kitchenMinigames?.getSnapshot(kind) || null,
  getDashboard: () => latestKitchenDashboard || kitchenMinigames?.getDashboard() || null,
  getShiftSnapshot: () => pizzeriaShift.snapshot(),
  subscribe(listener) {
    const handler = (event) => listener(event.detail)
    document.addEventListener(MINIGAME_EVENT_NAME, handler)
    return () => document.removeEventListener(MINIGAME_EVENT_NAME, handler)
  },
})

window.sliceAndStitchEconomy = Object.freeze({
  balance: () => state.coins,
  reputation: () => state.reputation,
  getJournal() {
    const menu=state.menu.size?[...state.menu]:[state.pizzaTier]
    const tier=menu.join(' + ')
    return {clock:clockSnapshot(state.clock), ledger:JSON.parse(JSON.stringify(state.ledger)),
      forecasts:incomeForecast(menu,state.outfit?.bonus || 0,state.reputation), tier, loyalty:loyaltyTipBonus(state.reputation),
      progression:progressionSnapshot(state.progression,state.coins),
      collections:progressionSnapshot(state.progression,state.coins).milestones.map(m=>({...m,
        pieces:FASHION_CATALOG_GARMENTS.filter(item=>item.unlockLevel===m.level).length,
        patterns:FASHION_SCHEMATICS.filter(item=>item.unlockLevel===m.level).length})),
      effects:{...state.fashionSetEffects}, presentation:state.outfit?.bonus || 0}
  },
  spend(amount) {
    if(coopActive()) return false // Online purchases must name the item and use the shared ledger.
    const price = Math.max(0, Math.round(Number(amount) || 0))
    if (price > state.coins) return false
    state.coins -= price
    state.ledger=recordDayActivity(state.ledger,{spent:price})
    persistProgress()
    updateProgress()
    return true
  },
})

window.sliceAndStitchProgression = Object.freeze({
  storageKey: PROGRESSION_STORAGE_KEY,
  getSnapshot() {
    return Object.freeze({
      ...progressionSnapshot(state.progression, state.coins),
      day: state.fashionDay,
      clock:clockSnapshot(state.clock),
    })
  },
  async buyUpgrade(upgradeId) {
    const online=coopActive()
    const purchase = online ? await roomCommand('buy-upgrade',{id:upgradeId}) : purchaseUpgrade(state.progression, upgradeId, state.coins)
    if (!purchase.ok) return purchase
    if(!online) {
      state.coins = purchase.balance
      state.ledger=recordDayActivity(state.ledger,{spent:purchase.upgrade.cost})
      applyProgression(purchase.progression)
    }
    if (upgradeId === 'pizza-garden') state.menu.add('garden')
    if (upgradeId === 'pizza-artisan') state.menu.add('artisan')
    renderPizzaTierSelector()
    renderPizzaMenuSelector()
    updateProgress()
    return Object.freeze({ ...purchase, snapshot: this.getSnapshot() })
  },
})

window.sliceAndStitchFashion = Object.freeze({
  canAlterGarment(garment) {
    return Boolean(garment && compatibleFashionModifications(garment).some(mod=>mod.unlockLevel<=state.fashionInventory.level))
  },
  getDailyInventory: () => Object.freeze({
    day: state.fashionInventory.day,
    level: state.fashionInventory.level,
    schematics: [...state.fashionInventory.schematics],
    patterns: patternLibrarySnapshot(state.patternLibrary,state.fashionInventory.level,state.coins,state.fashionInventory),
    fabrics: state.fashionInventory.fabrics.map((fabric) => Object.freeze({
      ...fabric,
      remaining: state.fashionInventory.remaining[fabric.id] || 0,
    })),
  }),
  async buyPattern(schematicId) {
    const online=coopActive()
    const purchase=online ? await roomCommand('buy-pattern',{id:schematicId}) : purchasePattern(state.patternLibrary,schematicId,state.fashionInventory.level,state.coins,state.fashionInventory)
    if(!purchase.ok) return purchase
    if(!online) state.patternLibrary=purchase.library
    fashionPatternSearch=''
    if(!online) {state.coins=purchase.balance;state.ledger=recordDayActivity(state.ledger,{spent:purchase.price})}
    if(state.fashion.step==='plan' && !state.fashion.alterationMode && !state.fashion.materialConsumed) {
      state.fashion.schematic=purchase.pattern
      state.fashion.modifications=[]
      if(!compatibleFashionFabric(effectiveSchematic(state.fashion),state.fashion.fabric)) state.fashion.fabric=null
      const guides=fashionGuides(state.fashion)
      state.fashion.fabricOffset={x:SEWING_NEEDLE.x-guides.seam[0].x,y:SEWING_NEEDLE.y-guides.seam[0].y}
    }
    persistProgress();updateProgress()
    renderFashion()
    document.dispatchEvent(new CustomEvent('slice-and-stitch:toast',{detail:{message:`${purchase.pattern.name} pattern added to your permanent library.`}}))
    return purchase
  },
  selectSchematic(schematicId) {
    const schematic = FASHION_SCHEMATICS.find((item) => item.id === schematicId)
    if(!patternAvailability(state.patternLibrary,schematic,state.fashionInventory.level,state.coins).owned) return false
    if(state.fashion.completed) {
      state.fashion=freshFashion()
      beginFashionSession(state.fashion)
    }
    if (!schematic || state.fashion.step !== 'plan' || state.fashion.alterationMode) return false
    state.fashion.schematic = schematic
    state.fashion.modifications = []
    if (!compatibleFashionFabric(effectiveSchematic(state.fashion), state.fashion.fabric)) state.fashion.fabric = null
    const guides = fashionGuides(state.fashion)
    state.fashion.fabricOffset = {
      x: SEWING_NEEDLE.x - guides.seam[0].x,
      y: SEWING_NEEDLE.y - guides.seam[0].y,
    }
    renderFashion()
    return true
  },
  getProject: () => Object.freeze({ step:state.fashion.step, name:state.fashion.schematic.name, started:state.fashion.materialConsumed, completed:state.fashion.completed }),
  startNewProject() {
    if (state.fashion.materialConsumed && !state.fashion.completed) return false
    state.fashion = freshFashion()
    beginFashionSession(state.fashion)
    renderFashion()
    return true
  },
  cancelProject() {
    cancelAnimationFrame(fashionFrame)
    state.fashion = freshFashion()
    beginFashionSession(state.fashion)
    renderFashion()
  },
  beginAlteration(garment) {
    if (state.fashion.materialConsumed && !state.fashion.completed) return false
    if (!garment?.id || !garment?.slot) return false
    if (!this.canAlterGarment(garment)) return false
    const known = FASHION_SCHEMATICS.find((item) => item.artworkId === (garment.customization?.templateId || garment.id))
      || FASHION_SCHEMATICS.find((item) => item.slot === garment.slot && item.cut === garment.cut)
    if (!known) return false
    const schematic = {...known, artworkId:garment.customization?.templateId || garment.id,
      cut:garment.cut, slot:garment.slot, material:garment.material, tags:garment.tags}
    const fashion = freshFashion()
    fashion.schematic = schematic
    fashion.alterationMode = true
    fashion.baseGarment = { ...garment }
    fashion.finishing = [...(garment.customization?.placements || [])].map(detail=>({...detail}))
    fashion.accentColor = garment.palette?.secondary || '#f4d8ad'
    fashion.styleMood = garment.customization?.mood || garment.tags?.[0] || 'classic'
    fashion.fabric = {
      id: `existing-${garment.id}`,
      label: garment.name,
      fiber: 'Existing garment',
      cost: 0,
      quality: garment.quality || 70,
      color: garment.palette?.primary || '#76506f',
      patternKey: garment.pattern || 'solid',
      pattern: 'none',
      family: garment.material?.family,
    }
    const guides = fashionGuides(fashion)
    fashion.fabricOffset = { x: SEWING_NEEDLE.x - guides.seam[0].x, y: SEWING_NEEDLE.y - guides.seam[0].y }
    state.fashion = fashion
    beginFashionSession(fashion)
    renderFashion()
    return true
  },
})
document.documentElement.dataset.minigameProtocol = String(MINIGAME_PROTOCOL_VERSION)

let bakeFrame = 0
let ingredientFrame = 0
let fashionFrame = 0
let pizzaToolFrame = 0
let ovenTransferFrame = 0
let resultDismissAction = null
let recipeBookDismissAction = null

function createCoverageGrid(size = 40, radius = 152) {
  const valid = []
  const validMask = new Uint8Array(size * size)
  const painted = new Uint8Array(size * size)
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      const x = (column + 0.5) / size * 600
      const y = (row + 0.5) / size * 600
      if (Math.hypot(x - 300, y - 300) <= radius) {
        const index = row * size + column
        valid.push(index)
        validMask[index] = 1
      }
    }
  }
  return { size, valid, validMask, painted }
}

function freshPizza(tierId = 'starter', order = createPizzaOrder(tierId, state.orderNumber)) {
  return {
    id:globalThis.crypto?.randomUUID?.() || `pizza-${Date.now()}-${Math.random()}`,
    prepReserved:false,
    workingSeconds:0,
    tierId,
    order,
    step: 'sauce',
    sauceGrid: createCoverageGrid(),
    cheeseGrid: createCoverageGrid(),
    finishGrid: createCoverageGrid(),
    saucePaths: [],
    cheesePoints: [],
    finishPaths: [],
    toppings: [],
    selectedTopping: 'pepperoni',
    selectedIngredient: null,
    selectionAnimation: null,
    toolPointer: null,
    toolAngle: 0,
    bakeStart: 0,
    bakeProgress: 0,
    bakeRunning: false,
    bakeStatusKey: 'ready',
    transferringToOven: false,
    ovenTransferProgress: 0,
    cuts: [],
    currentCut: null,
    cutDistance: 0,
    cutterWheelRotation: 0,
    served: false,
    scores: {},
    startedAt: performance.now(),
    dragging: false,
  }
}

function savePizzaProject(pizza) {
  if(!pizza || pizza.served) return null
  const saved={...pizza,dragging:false,toolPointer:null,currentCut:null,selectionAnimation:null,
    transferringToOven:false,bakeRunning:false,bakeStart:0,startedAt:0,reservingPrep:false,completing:false}
  for(const key of ['sauceGrid','cheeseGrid','finishGrid']) saved[key]={...pizza[key],painted:Array.from(pizza[key].painted),validMask:Array.from(pizza[key].validMask)}
  return saved
}
function restorePizzaProject(saved) {
  if(!saved?.id || !stationTiers[saved.tierId] || !saved.order || !pizzaStepsFor({tierId:saved.tierId}).includes(saved.step)) return null
  const pizza={...freshPizza(saved.tierId,saved.order),...saved,startedAt:performance.now(),dragging:false,bakeRunning:false,transferringToOven:false}
  for(const key of ['sauceGrid','cheeseGrid','finishGrid']) {
    const grid=createCoverageGrid()
    if(Array.isArray(saved[key]?.painted) && saved[key].painted.length === grid.painted.length) grid.painted=Uint8Array.from(saved[key].painted)
    pizza[key]=grid
  }
  pizza.prepReserved=state.kitchenService.reservation?.id === pizza.id
  return pizza
}

function kitchenIsRunning() {
  if(coopActive() && !window.sliceAndStitchCoop?.ready) return false
  if(document.hidden || state.clock.paused) return false
  const workshop=document.body.dataset.workshop
  if(workshop) return workshop === 'pizza' || workshop === 'kitchen'
  return ['kitchen','restaurant'].includes(document.querySelector('[data-scene-stage]')?.dataset.scene)
}
function currentPizzaGate() {
  return state.pizza && !state.pizza.served ? pizzaServiceGate(state.kitchenService,{id:state.pizza.id,sauce:stationTierFor(state.pizza).sauce.id}) : {blocked:false}
}
function renderKitchenService() {
  renderKitchenServiceUI({service:kitchenServiceSnapshot(state.kitchenService),gate:currentPizzaGate(),
    active:latestKitchenDashboard?.active,sauceKind:latestKitchenDashboard?.games.saucePot.kind,playtest:isFashionPlaytest()})
  if(state.pizza) updatePizzaContinuation()
  const action=kitchenContinuation(latestKitchenDashboard,state.kitchenService,currentPizzaGate())
  renderWorkbenchAction('kitchenActivity',action,()=>{
    if(action.station === 'saucePot') kitchenMinigames?.selectSauce(action.sauce || 'tomato')
    document.dispatchEvent(new CustomEvent('slice-and-stitch:open-kitchen-station',{detail:{station:action.station}}))
  })
}
function syncKitchenService() {
  kitchenMinigames?.setService(kitchenServiceSnapshot(state.kitchenService))
  renderKitchenService()
}
function ensurePizzaPrep() {
  if(!state.pizza || state.pizza.served) return false
  if(coopActive()) {
    if(state.kitchenService.reservation?.id===state.pizza.id) return !state.kitchenService.burning
    if(!state.pizza.reservingPrep && !currentPizzaGate().blocked) {
      const pizza=state.pizza;pizza.reservingPrep=true
      roomCommand('reserve-pizza',{pizzaId:pizza.id,sauce:stationTierFor(pizza).sauce.id}).then(result=>{pizza.reservingPrep=false;roomWarning(result);renderPizza();persistProgress()})
    }
    return false
  }
  const result=reservePizzaPrep(state.kitchenService,state.pizza.id,stationTierFor(state.pizza).sauce.id)
  if(!result.ok) {renderKitchenService();return false}
  if(result.state !== state.kitchenService) {
    state.kitchenService=result.state;state.pizza.prepReserved=true
    syncKitchenService();persistProgress()
  }
  return true
}
async function handleKitchenWork(work) {
  if(coopActive()) {
    const result=await roomCommand('kitchen-work',{work})
    roomWarning(result)
    if(result.ok && work.kind==='dishwashing') pizzeriaShift.cleanDishes(1)
    if(result.ok && result.payout) document.dispatchEvent(new CustomEvent('slice-and-stitch:toast',{detail:{message:`Shared till · +${result.payout} coins`}}))
    persistProgress();return
  }
  if(work.type === 'prep') {
    state.kitchenService=addKitchenPrep(state.kitchenService,work).state
  } else {
    const result=consumeServiceTicket(state.kitchenService,work)
    if(!result.accepted) return
    state.kitchenService=result.state
    const payout=work.kind === 'dishwashing' ? dishEarnings() : sodaEarnings(work.score)
    if(work.kind === 'dishwashing') pizzeriaShift.cleanDishes(1)
    state.coins+=payout
    state.ledger=recordDayActivity(state.ledger,{earned:payout,bonusCoins:payout,dishes:work.kind === 'dishwashing'?1:0,sodas:work.kind === 'drinkPour'?1:0})
    applyProgression(recordServiceIncome(state.progression,payout))
    updateProgress()
    document.dispatchEvent(new CustomEvent('slice-and-stitch:toast',{detail:{message:payout ? `${work.kind === 'dishwashing' ? 'Dish cleaned' : 'Soda served'} · +${payout} coins` : 'Soda served · no tip for this pour'}}))
  }
  syncKitchenService();persistProgress()
}

document.addEventListener('slice-and-stitch:station-entered',event=>{
  coopStirTurns=0
  if(event.detail.station==='pizza') ensurePizzaPrep()
})
document.addEventListener('click',async event=>{
  const button=event.target.closest?.('[data-service-station],[data-service-recipe],[data-service-test-heat]')
  if(!button) return
  if(button.hasAttribute('data-service-test-heat')) {
    if(!isFashionPlaytest() || coopActive()) return
    state.kitchenService=advanceKitchenHeat(state.kitchenService,240000)
    syncKitchenService();persistProgress();return
  }
  if(button.dataset.serviceRecipe) {
    if(coopActive()) {const result=await roomCommand('claim-station',{station:'saucePot',recipe:button.dataset.serviceRecipe});if(!result.ok) {roomWarning(result);return}}
    coopStirTurns=0;kitchenMinigames?.selectSauce(button.dataset.serviceRecipe);persistProgress();return
  }
  const station=button.dataset.serviceStation
  if(station === 'saucePot') {
    if(button.dataset.serviceSauce === 'tomato' && state.kitchenService.sauces.tomato > 0) kitchenMinigames?.showHoldingPot()
    else kitchenMinigames?.selectSauce(button.dataset.serviceSauce)
  }
  document.dispatchEvent(new CustomEvent('slice-and-stitch:open-kitchen-station',{detail:{station}}))
  renderKitchenService()
})

function freshFashion() {
  const schematic = ownedPatternList(state.patternLibrary)[0] || FASHION_SCHEMATICS[0]
  const guides = {seam:constructionRecipe(schematic).seams[0].points}
  return {
    projectId: globalThis.crypto?.randomUUID?.() || `project-${Date.now()}-${Math.round(Math.random()*1e9)}`,
    step: 'plan',
    schematic,
    fabric: null,
    accentColor: '#f4d8ad',
    styleMood: 'classic',
    modifications: [],
    cutTrace: [],
    seamTrace: [],
    seamIndex: 0,
    seamScores: [],
    inputMode: 'pointer',
    assistSection: 0,
    assistAccuracies: [],
    finishing: [],
    selectedFinish: 'button',
    scores: {},
    dragging: false,
    cutDistance: 0,
    lastPointer: null,
    fabricOffset: { x: SEWING_NEEDLE.x - guides.seam[0].x, y: SEWING_NEEDLE.y - guides.seam[0].y },
    machinePhase: 0,
    motionStartedAt: 0,
    motionLastAt: 0,
    shearAngle: 0,
    garment: null,
    materialConsumed: false,
    completed: false,
  }
}

function resetPrototype() {
  if(coopActive()) {roomWarning({reason:'Leave the online room before resetting your solo prototype.'});return}
  cancelAnimationFrame(bakeFrame)
  cancelAnimationFrame(ingredientFrame)
  cancelAnimationFrame(fashionFrame)
  cancelAnimationFrame(pizzaToolFrame)
  cancelAnimationFrame(ovenTransferFrame)
  state.coins = 120
  state.reputation = 0
  state.reputationCarry=0
  state.clock=createGameClock()
  state.ledger=createDayLedger(null,1,120)
  state.progression = createProgressionState()
  state.phase = 'morning'
  state.lightingPreview = 'morning'
  state.outfit = null
  state.menu = new Set(['starter'])
  state.orderNumber = 1
  state.fashionDay = 1
  state.fashionInventory = createDailyFashionInventory(1, 0, 1)
  state.patternLibrary=createPatternLibrary()
  state.kitchenService=createKitchenService()
  syncKitchenService()
  pizzeriaShift.reset()
  const queued = nextQueuedPizza(state.orderNumber)
  state.pizzaTier = queued.tierId
  state.pizza = freshPizza(queued.tierId, queued.order)
  state.fashion = freshFashion()
  beginPizzaSession(state.pizza)
  beginFashionSession(state.fashion)
  kitchenMinigames?.resetAll()
  kitchenMinigames?.setUpgrades([])
  kitchenMinigames?.setDishBacklog(0)
  kitchenMinigames?.setPhase('morning')
  applyPhase('morning')
  publishClock()
  applyProgression(state.progression)
  updateProgress()
  renderPizza()
  renderFashion()
  showWorkshop('pizza')
}

function updateProgress() {
  elements.coinCount.textContent = state.coins
  elements.reputationCount.textContent = state.reputation
  const bonus = state.outfit?.bonus || 0
  const vegetableOrder = state.pizza && Object.entries(state.pizza.order.toppings).some(([id, amount]) => amount !== 'none' && ['pepper', 'onion', 'olive', 'mushroom'].includes(id))
  const tipBonus=orderGarmentTipBonus(state.fashionSetEffects,{vegetables:vegetableOrder,phase:state.phase,presentation:bonus})
  elements.pizzaOutfitBonus.textContent = `+${Math.round(tipBonus * 100)}%`
  elements.outfitName.textContent = state.outfit?.name || 'House apron'
  const outfitNotes = []
  if (state.outfit) outfitNotes.push(`Handmade quality ${state.outfit.quality} adds ${Math.round(bonus * 100)}% presentation.`)
  if (state.fashionSetEffects.names.length) outfitNotes.push(`${state.fashionSetEffects.names.join(' + ')} set bonus active.`)
  elements.outfitCopy.textContent = outfitNotes.join(' ') || 'No presentation bonus yet.'
  elements.avatarBody.style.background = '#e8d7b2'
  elements.avatarApron.style.background = state.outfit?.color || '#417358'
  renderUpgradeCounter()
}

function renderUpgradeCounter() {
  if (!elements.upgradeCounterGrid || !elements.upgradeCounterSummary) return
  const snapshot = progressionSnapshot(state.progression, state.coins)
  const next = snapshot.nextMilestone
  elements.upgradeCounterSummary.innerHTML = `<span><b>Atelier ${snapshot.atelierLevel}/12</b><small>${next ? `Next: ${next.label}` : 'Master atelier complete'}</small></span><span><b>${snapshot.balance} ●</b><small>${progressionRequirementCopy(next)}</small></span>`
  elements.upgradeCounterGrid.innerHTML = snapshot.upgrades.map((upgrade) => {
    const stateClass = upgrade.owned ? 'is-owned' : upgrade.available ? 'is-available' : 'is-locked'
    const buttonLabel = upgrade.owned ? 'Installed' : upgrade.available ? `${upgrade.cost} coins` : upgrade.reason
    return `<article class="counter-upgrade-card ${stateClass}">
      <span class="counter-upgrade-icon" aria-hidden="true">${upgrade.icon}</span>
      <div><small>${upgrade.station} · atelier ${upgrade.atelierLevel}</small><strong>${upgrade.name}</strong><p>${upgrade.effect}</p></div>
      <button type="button" data-counter-upgrade="${upgrade.id}" ${upgrade.available ? '' : 'disabled'}>${buttonLabel}</button>
    </article>`
  }).join('')
  elements.upgradeCounterGrid.querySelectorAll('[data-counter-upgrade]').forEach((button) => {
    button.addEventListener('click', async () => {
      const result = await window.sliceAndStitchProgression.buyUpgrade(button.dataset.counterUpgrade)
      if (!result.ok) button.textContent = result.reason
    })
  })
}

function applyPhase(phase) {
  state.lightingPreview = phase
  state.phase = phase
  document.body.dataset.phase = phase
  document.querySelectorAll('[data-phase-button]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.phaseButton === phase)
  })
  elements.phaseTitle.textContent = phaseCopy[phase].title
  elements.phaseCopy.textContent = phaseCopy[phase].copy
  kitchenMinigames?.setPhase(phase)
  drawPizzaCanvas()
  drawFashionCanvas()
}

let clockLastTick=performance.now()
let clockLastSave=clockLastTick
function publishClock(newDay=false) {
  const clock=clockSnapshot(state.clock)
  document.querySelectorAll('[data-game-day]').forEach(node=>node.textContent=`Day ${clock.day}`)
  document.querySelectorAll('[data-game-time]').forEach(node=>node.textContent=`${clock.time} · ${clock.phaseLabel}${clock.paused?' · Paused':''}`)
  document.querySelectorAll('[data-clock-toggle]').forEach(node=>node.textContent=clock.paused?'Resume clock':'Pause clock')
  document.dispatchEvent(new CustomEvent('slice-and-stitch:time-changed',{detail:{...clock,newDay}}))
}

function setGameClock(next) {
  const before=clockSnapshot(state.clock)
  state.clock=next
  const after=clockSnapshot(next)
  const newDay=after.day!==before.day
  if(newDay) {
    state.fashionDay=after.day
    state.ledger=rollDayLedger(state.ledger,after.day,state.coins)
    state.fashionInventory=createDailyFashionInventory(after.day,state.reputation,state.progression.atelierLevel)
    // A paid project keeps its material/score. Only uncommitted quotes change.
    if(state.fashion?.step==='plan') renderFashion()
  }
  if(before.phase!==after.phase) {applyPhase(after.phase);updateProgress()}
  if(before.time!==after.time || before.paused!==after.paused || newDay) publishClock(newDay)
  if(newDay || before.phase!==after.phase) persistProgress()
}

function tickDayClock(now=performance.now()) {
  const seconds=Math.min(2,Math.max(0,(now-clockLastTick)/1000))
  clockLastTick=now
  if(coopActive()) {
    if(state.pizza?.prepReserved && !state.pizza.served && kitchenIsRunning() && !state.kitchenService.burning && window.sliceAndStitchCoop?.ready) state.pizza.workingSeconds+=seconds
    if(now-clockLastSave>=15000) {persistProgress();clockLastSave=now}
    return
  }
  if(!document.hidden) setGameClock(advanceGameClock(state.clock,seconds))
  const before=state.kitchenService
  state.kitchenService=advanceKitchenHeat(before,seconds*1000,{running:kitchenIsRunning(),diffuser:ownsUpgrade('sauce-diffuser')})
  if(state.pizza?.prepReserved && !state.pizza.served && kitchenIsRunning() && !state.kitchenService.burning) state.pizza.workingSeconds+=seconds
  syncKitchenService()
  if(before.burning !== state.kitchenService.burning) {persistProgress();if(state.pizza)renderPizza()}
  if(now-clockLastSave>=15000) {persistProgress();clockLastSave=now}
}

function resumeClockForWork() {
  if(!state.clock.paused) return
  if(coopActive()) {roomCommand('set-clock-paused',{paused:false},'resume-clock').then(roomWarning);return}
  clockLastTick=performance.now()
  setGameClock({...state.clock,paused:false});persistProgress()
}

window.sliceAndStitchClock=Object.freeze({
  getSnapshot:()=>clockSnapshot(state.clock),
  async goToBed() {
    pauseFashionWork();persistProgress()
    if(coopActive()) {const result=await roomCommand('go-to-bed',{day:state.clock.day});roomWarning(result);return result}
    clockLastTick=performance.now();setGameClock(nextGameDay(state.clock));persistProgress()
    return {ok:true,advanced:true,day:state.clock.day}
  },
  wakeUp:()=>coopActive()?roomCommand('wake-up',{}):Promise.resolve({ok:true}),
  async togglePause() {if(coopActive()) {const result=await roomCommand('set-clock-paused',{paused:!state.clock.paused});roomWarning(result);return} tickDayClock();setGameClock({...state.clock,paused:!state.clock.paused});persistProgress()},
  advanceForTest() {
    if(!isFashionPlaytest() || coopActive()) return false
    setGameClock(advanceGameClock({...state.clock,paused:false},360))
    persistProgress();return true
  },
})
document.addEventListener('visibilitychange',()=>{clockLastTick=performance.now();persistProgress()})
window.addEventListener('pagehide',persistProgress)

function showWorkshop(name) {
  if(name!=='fashion' && state.fashion) pauseFashionWork()
  const pizza = name === 'pizza'
  const fashion = name === 'fashion'
  const kitchen = name === 'kitchen'
  elements.pizzaActivity.hidden = !pizza
  elements.fashionActivity.hidden = !fashion
  elements.kitchenActivity.hidden = !kitchen
  elements.pizzaActivity.classList.toggle('is-active', pizza)
  elements.fashionActivity.classList.toggle('is-active', fashion)
  elements.kitchenActivity.classList.toggle('is-active', kitchen)
  kitchenMinigames?.setVisible(kitchen)
  document.querySelectorAll('[data-workshop]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.workshop === name)
  })
  if (pizza) renderPizza()
  else if (fashion) renderFashion()
  else if (kitchen) renderKitchenDashboard(kitchenMinigames?.getDashboard())
}

function renderShiftQueue(snapshot = pizzeriaShift.snapshot()) {
  if (!elements.shiftCustomerQueue) return
  const customers = snapshot.queue
  elements.shiftQueueSummary.textContent = customers.length
    ? `${customers.length} ${customers.length === 1 ? 'neighbor is' : 'neighbors are'} inside · ${snapshot.approaching.length} on the way`
    : snapshot.approaching.length
      ? `${snapshot.approaching.length} ${snapshot.approaching.length === 1 ? 'neighbor is' : 'neighbors are'} walking over from Via Bellavista`
      : 'The counter is quiet for a moment.'
  elements.shiftCustomerQueue.innerHTML = customers.length
    ? customers.map((customer) => {
      const appearance = customer.appearance || {}
      const status = customer.status === 'preparing' ? 'Now cooking' : `Waiting · #${customer.queueNumber}`
      const recipe = customer.preferredTier === 'garden' ? 'Market pie' : 'Garden pie'
      return `<article class="shift-customer ${customer.status === 'preparing' ? 'is-preparing' : ''}" style="--queue-skin:${appearance.skin || '#c88760'};--queue-hair:${appearance.hair || '#39282a'};--queue-top:${appearance.top || '#49735b'}">
        <span class="shift-customer-portrait" aria-hidden="true"><i></i><b></b></span>
        <span><strong>${customer.name}</strong><small>${status}</small></span>
        <em>${recipe}</em>
      </article>`
    }).join('')
    : '<p class="shift-queue-empty">No tickets waiting. Watch the street for the next customer.</p>'
  elements.shiftDirtyDishes.textContent = snapshot.dirtyDishes
    ? `${snapshot.dirtyDishes} dirty ${snapshot.dirtyDishes === 1 ? 'dish' : 'dishes'}`
    : 'Rack clear'
  const sauce = latestKitchenDashboard?.games?.saucePot
  elements.shiftSauceStatus.textContent = sauce?.hold?.label || (sauce?.batchReady ? 'Batch ready' : 'Prep the batch')
  elements.shiftSauceStatus.closest('span')?.classList.toggle('is-warning', sauce?.hold?.key === 'watch' || sauce?.hold?.key === 'smoking')
  elements.shiftDirtyDishes.closest('span')?.classList.toggle('is-warning', snapshot.dirtyDishes >= 4)
}

function kitchenStatusText(game) {
  if (game.id === 'saucePot') {
    if (game.hold) return game.hold.label
    if (game.completed) return '5 portions ready'
    if (game.stage === 'ingredients') return `${game.ingredients}/4 ingredients`
    if (game.stage === 'stir') return `${Math.min(3, Math.floor(game.stirTurns))}/3 turns`
    if (game.stage === 'simmer') return `${game.bubblesLeft} bubbles left`
  }
  if (game.id === 'doughToss') return `${game.completedCount}/5 doughs`
  if (game.id === 'dishwashing') {
    if (game.stage === 'empty') return 'Rack clear'
    if (game.completed) return `${game.cleanedCount}/${game.target} dishes clean`
    return game.stage === 'rinse' ? `${game.remaining} left · rinsing` : `${game.remaining} left · ${game.cleanPercent}%`
  }
  if (game.id === 'drinkPour') return game.stage === 'empty' ? 'No orders waiting' : game.completed ? `${game.target} drinks served` : game.stage === 'scored' ? `${game.lastScore} point pour` : `Drink ${game.orderIndex + 1}/${game.target}`
  return game.stage
}

function kitchenReadoutFor(game, phase) {
  if (game.id === 'saucePot') return [
    [game.hold?.key === 'smoking' ? 'Rescue progress' : 'Mode', game.hold?.key === 'smoking' ? `${Math.round((game.hold.rescueProgress || 0)*100)}% rescued` : game.stage === 'holding' ? 'Hot holding pot' : game.kind === 'pesto' ? 'Cold pesto' : 'Tomato batch'],
    ['Pot', kitchenStatusText(game)],
  ]
  if (game.id === 'doughToss') return [
    ['Prep rack', `${game.completedCount}/5 skins`],
    ['Throws', String(game.tosses)],
  ]
  if (game.id === 'dishwashing') return [
    ['Wash rack', game.stage === 'empty' ? 'Rack clear' : `${game.remaining} dirty`],
    ['Current', game.stage === 'empty' ? 'Waiting for service' : game.stage === 'rinse' ? `${Math.round(game.rinse * 100)}% rinse` : `${game.cleanPercent}% clean`],
  ]
  const score = game.scores.length
    ? Math.round(game.scores.reduce((sum, value) => sum + value, 0) / game.scores.length)
    : '—'
  return [
    ['Order', game.stage === 'empty' ? 'No orders' : game.completed ? `${game.target} served` : `${game.orderIndex + 1}/${game.target} drinks`],
    ['Average', score],
  ]
}

function renderKitchenDashboard(info) {
  if (!info) return
  latestKitchenDashboard = info
  document.dispatchEvent(new CustomEvent('slice-and-stitch:kitchen-status', { detail: info }))
  renderShiftQueue()
  const meta = KITCHEN_GAME_META[info.active]
  const game = info.current
  const taskCopy = {
    saucePot: 'Prepare five portions of tomato sauce or cold pesto. Keep the hot tomato pot stirred during service.',
    doughToss: 'A short gesture game sized so five doughs can be prepared during roughly one pizza order.',
    dishwashing: 'Scrub visible grime, then rinse. Each dish from a served order earns 2 bonus coins.',
    drinkPour: 'Match a customer’s flavor and fill line for up to 8 bonus coins. Orders come from served pizzas.',
  }
  elements.kitchenPhaseStamp.textContent = phaseCopy[info.phase].title
  elements.kitchenBadge.textContent = `${meta.name} · ${kitchenStatusText(game)}`
  elements.kitchenTaskName.textContent = meta.name
  elements.kitchenTaskCopy.textContent = taskCopy[info.active]
  elements.kitchenVerb.textContent = info.instructions.verb
  elements.kitchenInstruction.textContent = info.instructions.instruction
  elements.kitchenHintStrip.textContent = info.instructions.instruction
  const stepNumber = info.active === 'saucePot'
    ? Math.max(1, ['ingredients', 'stir', 'simmer', 'complete', 'holding'].indexOf(game.stage) + 1)
    : info.active === 'doughToss'
      ? Math.min(5, game.completedCount + 1)
      : info.active === 'dishwashing'
        ? Math.max(1, game.plate)
        : Math.min(4, game.orderIndex + 1)
  elements.kitchenStepIcon.textContent = stepNumber
  elements.kitchenReadout.innerHTML = kitchenReadoutFor(game, info.phase).map(([label, value]) => (
    `<span><small>${label}</small><b>${value}</b></span>`
  )).join('')
  elements.kitchenGameSelector.querySelectorAll('[data-kitchen-game]').forEach((button) => {
    const station = info.games[button.dataset.kitchenGame]
    button.classList.toggle('is-active', button.dataset.kitchenGame === info.active)
    button.classList.toggle('is-warning', station.id === 'saucePot' && station.hold?.key === 'smoking')
    const status = button.querySelector('[data-kitchen-status]')
    if (status) status.textContent = kitchenStatusText(station)
  })
  renderKitchenService()
}

function renderPips(container, steps, activeStep) {
  const activeIndex = steps.indexOf(activeStep)
  container.innerHTML = steps.map((step, index) => (
    `<i class="step-pip ${index < activeIndex ? 'is-complete' : ''} ${index === activeIndex ? 'is-active' : ''}" aria-label="${step}"></i>`
  )).join('')
}

function coverageOf(grid) {
  let count = 0
  for (const index of grid.valid) count += grid.painted[index]
  return count / grid.valid.length
}

function markCoverage(grid, point, radius) {
  const cell = 600 / grid.size
  for (let row = 0; row < grid.size; row += 1) {
    for (let column = 0; column < grid.size; column += 1) {
      const index = row * grid.size + column
      if (!grid.validMask[index]) continue
      const x = (column + 0.5) * cell
      const y = (row + 0.5) * cell
      if (Math.hypot(x - point.x, y - point.y) <= radius) grid.painted[index] = 1
    }
  }
}

function markCoverageSegment(grid, start, end, radius, spacing = 12) {
  const distance = Math.hypot(end.x - start.x, end.y - start.y)
  const steps = Math.max(1, Math.ceil(distance / spacing))
  for (let index = 1; index <= steps; index += 1) {
    const amount = index / steps
    markCoverage(grid, {
      x: start.x + (end.x - start.x) * amount,
      y: start.y + (end.y - start.y) * amount,
    }, radius)
  }
}

function canvasPoint(canvas, event) {
  const bounds = canvas.getBoundingClientRect()
  return {
    x: (event.clientX - bounds.left) * LOGICAL_CANVAS_SIZE / bounds.width,
    y: (event.clientY - bounds.top) * LOGICAL_CANVAS_SIZE / bounds.height,
  }
}

function renderTicket() {
  const pizza = state.pizza
  if (!pizza) return
  const tier = stationTierFor(pizza)
  const steps = pizzaStepsFor(pizza)
  const stepIndex = steps.indexOf(pizza.step)
  const sauceIsPesto = tier.sauce.id === 'pesto'
  const cheeseIsFresh = tier.cheese.id === 'freshMozzarella'
  const toppingTargets = toppingTargetsFor(pizza)
  const definitions = [
    {
      id: 'sauce', label: tier.sauce.label,
      qualifier: pizza.order.sauce,
      available: pizza.step === 'sauce', complete: stepIndex > steps.indexOf('sauce'),
      image: sauceIsPesto ? 'assets/game/pizza-upgrade-atlas-v1.png' : 'assets/game/pizza-sauce-stamps-v1.png',
      position: sauceIsPesto ? '0% 100%' : '0% 0%', size: sauceIsPesto ? '600% 260%' : '400% 400%',
    },
    {
      id: 'cheese', label: tier.cheese.label,
      qualifier: pizza.order.cheese,
      available: pizza.step === 'cheese', complete: stepIndex > steps.indexOf('cheese'),
      image: cheeseIsFresh ? 'assets/game/pizza-upgrade-atlas-v1.png' : 'assets/game/pizza-ingredients-v1.png',
      position: cheeseIsFresh ? '20% 100%' : '0% 0%', size: cheeseIsFresh ? '600% 260%' : '400% 400%',
    },
    ...Object.entries(toppingTargets).map(([id, count], index) => {
      const placed = pizza.toppings.filter((topping) => topping.type === id).length
      const upgraded = id in expansionIngredients
      return {
        id,
        label: toppingDetails[id].label,
        qualifier: pizza.order.toppings[id],
        available: pizza.step === 'toppings',
        complete: stepIndex > steps.indexOf('toppings') || placed === count,
        image: upgraded ? 'assets/game/pizza-upgrade-atlas-v1.png' : 'assets/game/pizza-ingredients-v1.png',
        position: upgraded ? `${toppingDetails[id].upgradeColumn * 20}% 100%` : `0% ${(index + 1) * 33.333}%`,
        size: upgraded ? '600% 260%' : '400% 400%',
      }
    }),
    {
      id: 'bake', label: 'Bake', qualifier: pizza.order.bake,
      available: pizza.step === 'bake', complete: stepIndex > steps.indexOf('bake'), glyph: '🔥',
    },
  ]

  if (tier.finish) {
    definitions.push({
      id: 'finish', label: tier.finish.label,
      qualifier: pizza.order.finish,
      available: pizza.step === 'finish', complete: stepIndex > steps.indexOf('finish'),
      image: 'assets/game/pizza-upgrade-atlas-v1.png', position: '100% 100%', size: '600% 260%',
    })
  }
  definitions.push({
    id: 'cut', label: 'Slices', detail: `${pizza.order.slices} slices`,
    available: pizza.step === 'cut', complete: stepIndex > steps.indexOf('cut'), glyph: '╱',
  })

  elements.ticketItems.style.gridTemplateColumns = `repeat(${Math.min(7, definitions.length)}, minmax(0, 1fr))`

  elements.ticketItems.innerHTML = definitions.map((item) => {
    const classes = [
      'ticket-item',
      item.available ? 'is-current' : '',
      item.complete ? 'is-complete' : '',
    ].filter(Boolean).join(' ')
    const targetLabel = item.detail || qualifierLabel(item.qualifier)
    const icon = item.glyph
      ? `<i class="ticket-glyph" aria-hidden="true">${item.glyph}</i>`
      : `<i aria-hidden="true" style="--ingredient-image:url('${item.image}');--ingredient-position:${item.position};--ingredient-size:${item.size || '400% 400%'}"></i>`
    return `<span class="${classes}" role="listitem" aria-label="${item.label}. ${targetLabel} order. ${item.complete ? 'Complete' : item.available ? 'Current step' : 'Pending'}.">
      ${icon}
      <b>${item.label}</b>
      <small>${targetLabel}${item.complete ? ' · done' : ''}</small>
    </span>`
  }).join('')
}

function selectableIngredients(pizza) {
  const tier = stationTierFor(pizza)
  const sauceControl = tier.sauce.id === 'tomato' ? 'sauce' : tier.sauce.id
  const cheeseControl = tier.cheese.id === 'shredded' ? 'cheese' : tier.cheese.id
  const canvasToppings = Object.keys(tier.toppings)
  if (pizza.step === 'sauce') {
    return [sauceControl, cheeseControl]
  }
  if (pizza.step === 'cheese') return [cheeseControl, ...canvasToppings]
  if (pizza.step === 'toppings') return canvasToppings
  if (pizza.step === 'finish') return ['oliveOil']
  return []
}

function visibleCounterIngredients(pizza) {
  const ingredients = ['sauce', 'cheese', 'pepperoni', 'mushroom', 'basil']
  if (pizza.tierId !== 'starter') ingredients.push('pesto', 'pepper', 'onion')
  if (pizza.tierId === 'artisan') ingredients.push('freshMozzarella', 'oliveOil')
  return ingredients
}

function counterIngredientAt(point, pizza) {
  if (
    pizza.tierId === 'artisan'
    && point.x >= 505 && point.x <= 598
    && point.y >= 220 && point.y <= 425
  ) return 'oliveOil'
  return visibleCounterIngredients(pizza).find((id) => {
    if (id === 'oliveOil') return false
    const zone = ingredientZones[id]
    return zone && Math.hypot(point.x - zone.x, point.y - zone.y) <= zone.radius
  }) || null
}

const PIZZA_PEEL_DOCK = { x: 445, y: 560, radiusX: 62, radiusY: 44 }
const PIZZA_CUTTER_DOCK = { x: 300, y: 542, radiusX: 108, radiusY: 66 }
const OVEN_PEEL_HANDLE = { x: 505, y: 498, radius: 64 }

function pointInEllipse(point, zone) {
  const dx = (point.x - zone.x) / zone.radiusX
  const dy = (point.y - zone.y) / zone.radiusY
  return dx * dx + dy * dy <= 1
}

function stationToolAt(point, pizza) {
  if (pizza.step === 'toppings' && pizzaCanAdvance() && !pizza.transferringToOven) {
    return pointInEllipse(point, PIZZA_PEEL_DOCK)
      ? 'ovenPeel'
      : null
  }
  if (pizza.step === 'bake') {
    return Math.hypot(point.x - OVEN_PEEL_HANDLE.x, point.y - OVEN_PEEL_HANDLE.y) <= OVEN_PEEL_HANDLE.radius
      ? 'ovenPeel'
      : null
  }
  if (pizza.step === 'cut') {
    return pointInEllipse(point, PIZZA_CUTTER_DOCK)
      ? 'pizzaCutter'
      : null
  }
  return null
}

function startIngredientSelectionAnimation(pizza, ingredient) {
  cancelAnimationFrame(ingredientFrame)
  const duration = ingredient === 'pesto' ? 900
    : ingredient === 'oliveOil' ? 820
      : ingredient === 'sauce' ? 720
        : ingredient === 'cheese' ? 620
          : 580
  const animation = { id: ingredient, startedAt: performance.now(), duration, progress: 0 }
  pizza.selectionAnimation = animation
  const tick = (now) => {
    if (state.pizza !== pizza || pizza.selectionAnimation !== animation) return
    animation.progress = clamp((now - animation.startedAt) / animation.duration, 0, 1)
    drawPizzaCanvas()
    if (animation.progress < 1) ingredientFrame = requestAnimationFrame(tick)
    else {
      pizza.selectionAnimation = null
      drawPizzaCanvas()
    }
  }
  ingredientFrame = requestAnimationFrame(tick)
}

function selectPizzaIngredient(pizza, ingredient, { animate = false } = {}) {
  const tier = stationTierFor(pizza)
  const nextCheese = tier.cheese.id === 'shredded' ? 'cheese' : tier.cheese.id
  const isTopping = ingredient in tier.toppings
  if (pizza.step === 'sauce' && ingredient === nextCheese) {
    if (!pizzaCanAdvance()) {
      return
    }
    pizza.scores.sauce = scoreCoverage(coverageOf(pizza.sauceGrid), sauceTargetFor(pizza))
    pizza.step = 'cheese'
  } else if (pizza.step === 'cheese' && isTopping) {
    if (!pizzaCanAdvance()) {
      return
    }
    pizza.scores.cheese = tier.cheese.interaction === 'place'
      ? scoreCoverage(coverageOf(pizza.cheeseGrid), 0.18 + cheeseTargetFor(pizza) * 0.02)
      : scoreCoverage(coverageOf(pizza.cheeseGrid), cheeseTargetFor(pizza))
    pizza.step = 'toppings'
  }

  pizza.selectedIngredient = ingredient
  if (isTopping) pizza.selectedTopping = ingredient
  pizza.toolPointer = null
  if (animate) startIngredientSelectionAnimation(pizza, ingredient)
  renderPizza()
  renderTicket()
  renderPizzaTools()
}

function selectCounterIngredient(pizza, ingredient) {
  if(!ensurePizzaPrep()) return
  if (!selectableIngredients(pizza).includes(ingredient)) return
  selectPizzaIngredient(pizza, ingredient, { animate: true })
}

function renderPizzaTierSelector() {
  elements.pizzaTierSelector.innerHTML = Object.values(stationTiers).map((tier) => {
    const owned = tier.id === 'starter' || ownsUpgrade(`pizza-${tier.id}`)
    return `<button class="upgrade-tier-button ${state.pizzaTier === tier.id ? 'is-active' : ''} ${owned ? 'is-owned' : 'is-locked'}" data-pizza-tier="${tier.id}" type="button" aria-pressed="${state.pizzaTier === tier.id}" ${owned && !state.pizza?.prepReserved ? '' : 'disabled'}>
      <span>${tier.rank} · ${owned ? 'installed' : 'buy at counter'}</span>
      <strong>${tier.label}</strong>
      <small>${tier.blurb}</small>
    </button>`
  }).join('')
  elements.pizzaTierSelector.querySelectorAll('[data-pizza-tier]').forEach((button) => {
    button.addEventListener('click', () => setPizzaTier(button.dataset.pizzaTier))
  })
}

function renderPizzaMenuSelector() {
  const recipeButtons = Object.values(recipeProfiles).map((recipe) => {
    const active = state.menu.has(recipe.tierId)
    const owned = recipe.tierId === 'starter' || ownsUpgrade(`pizza-${recipe.tierId}`)
    return `<button class="menu-recipe-button ${active ? 'is-active' : ''} ${owned ? '' : 'is-locked'}" data-menu-recipe="${recipe.tierId}" type="button" aria-pressed="${active}" ${owned ? '' : 'disabled'}>
      <strong>${recipe.name}</strong><small>${owned ? active ? 'On today’s menu' : 'Add to menu' : 'Install its counter upgrade'}</small>
    </button>`
  }).join('')
  elements.pizzaMenuSelector.innerHTML = `<button class="menu-recipe-button is-active is-custom" type="button" aria-pressed="true" aria-label="Custom pie, always available">
      <strong>Custom pie</strong><small>Always available</small>
    </button>${recipeButtons}`
  elements.pizzaMenuSelector.querySelectorAll('[data-menu-recipe]').forEach((button) => {
    button.addEventListener('click', () => {
      const recipeId = button.dataset.menuRecipe
      if (recipeId !== 'starter' && !ownsUpgrade(`pizza-${recipeId}`)) return
      if (state.menu.has(recipeId)) state.menu.delete(recipeId)
      else state.menu.add(recipeId)
      renderPizzaMenuSelector()
    })
  })
}

function startNextPizzaOrder() {
  cancelAnimationFrame(bakeFrame)
  cancelAnimationFrame(ingredientFrame)
  cancelAnimationFrame(pizzaToolFrame)
  cancelAnimationFrame(ovenTransferFrame)
  state.orderNumber += 1
  const queued = nextQueuedPizza(state.orderNumber)
  state.pizzaTier = queued.tierId
  state.pizza = freshPizza(queued.tierId, queued.order)
  beginPizzaSession(state.pizza)
  renderPizza()
  persistProgress()
}

function recipeReferenceRows(qualifiers, current, formatter) {
  return qualifiers.map((qualifier) => (
    `<div class="${qualifier === current ? 'is-current' : ''}"><dt>${qualifierLabel(qualifier)}</dt><dd>${formatter(qualifier)}</dd></div>`
  )).join('')
}

function renderRecipeBook() {
  const pizza = state.pizza
  const tier = stationTierFor(pizza)
  const toppingTargets = toppingTargetsFor(pizza)
  elements.recipeBookIntro.textContent = `${pizza.order.name} is the menu baseline; highlighted entries show this customer’s request. The live ticket keeps only the kitchen words visible.`
  const sauceRows = recipeReferenceRows(['light', 'regular', 'extra'], pizza.order.sauce, (qualifier) => (
    `${Math.round(coverageTargetFor(qualifier, 'sauce') * 100)}% of the dough interior`
  ))
  const cheeseRows = recipeReferenceRows(['light', 'regular', 'extra'], pizza.order.cheese, (qualifier) => (
    tier.cheese.interaction === 'place'
      ? `${countTargetFor(tier.cheese.target, qualifier)} torn pieces, spaced apart`
      : `${Math.round(coverageTargetFor(qualifier, 'cheese') * 100)}% coverage`
  ))
  const toppingRows = Object.entries(tier.toppings).map(([id, baseCount]) => {
    const ordered = pizza.order.toppings[id]
    return `<div class="is-current"><dt>${toppingDetails[id].label}</dt><dd>Light ${countTargetFor(baseCount, 'light')} · Regular ${baseCount} · Extra ${countTargetFor(baseCount, 'extra')} — order: ${qualifierLabel(ordered)} (${toppingTargets[id]})</dd></div>`
  }).join('')
  const bakeRows = recipeReferenceRows(['soft', 'regular', 'crispy'], pizza.order.bake, (qualifier) => {
    const [start, end] = bakeWindowFor(qualifier)
    return `${(start * 10).toFixed(1)}–${(end * 10).toFixed(1)} seconds in the stone oven`
  })
  const finishPage = tier.finish ? `<section class="recipe-book-page">
      <h3>Olive-oil finish</h3>
      <dl class="recipe-reference-list">${recipeReferenceRows(['light', 'regular', 'extra'], pizza.order.finish, (qualifier) => `${Math.round(coverageTargetFor(qualifier, 'finish') * 100)}% coverage in separated brush strokes`)}</dl>
      <p class="recipe-book-note">Oil is brushed after baking, before slicing.</p>
    </section>` : ''
  const slicePage = `<section class="recipe-book-page">
      <h3>Slicing the pie</h3>
      <dl class="recipe-reference-list">
        <div class="${pizza.order.slices === 4 ? 'is-current' : ''}"><dt>4 slices</dt><dd>2 centered cuts, crossed at 90°</dd></div>
        <div class="${pizza.order.slices === 6 ? 'is-current' : ''}"><dt>6 slices</dt><dd>3 centered cuts, spaced at 60°</dd></div>
        <div class="${pizza.order.slices === 8 ? 'is-current' : ''}"><dt>8 slices</dt><dd>4 centered cuts, spaced at 45°</dd></div>
      </dl>
      <p class="recipe-book-note">Every cut should travel through the center and reach both sides of the crust.</p>
    </section>`
  elements.recipeBookPages.innerHTML = `<section class="recipe-book-page">
      <h3>${tier.sauce.label}</h3><dl class="recipe-reference-list">${sauceRows}</dl>
      <p class="recipe-book-note">Coverage means the dressed interior; leave the raised crust clean.</p>
    </section>
    <section class="recipe-book-page">
      <h3>${tier.cheese.label}</h3><dl class="recipe-reference-list">${cheeseRows}</dl>
      <p class="recipe-book-note">Aim for an even layer rather than piling everything in the center.</p>
    </section>
    <section class="recipe-book-page">
      <h3>Topping portions</h3><dl class="recipe-reference-list">${toppingRows}</dl>
      <p class="recipe-book-note">Counts are per whole pizza. Spread each portion across several slices.</p>
    </section>
    <section class="recipe-book-page">
      <h3>Stone-oven timing</h3><dl class="recipe-reference-list">${bakeRows}</dl>
      <p class="recipe-book-note">Visual cues still matter: crispy begins at a deeply golden rim and active cheese bubbles.</p>
    </section>${finishPage}${slicePage}`
}

function openRecipeBook(options = {}) {
  const afterClose = options?.afterClose || null
  closeResult({ runDismiss: false })
  recipeBookDismissAction = afterClose
  renderRecipeBook()
  if (!elements.recipeBookDialog.open) elements.recipeBookDialog.showModal()
}

function closeRecipeBook({ runDismiss = true } = {}) {
  if (elements.recipeBookDialog.open) elements.recipeBookDialog.close()
  const action = recipeBookDismissAction
  recipeBookDismissAction = null
  if (runDismiss) action?.()
}

function setPizzaTier(tierId) {
  if(state.pizza?.prepReserved && !state.pizza.served) return
  if (!(tierId in stationTiers) || tierId === state.pizzaTier) return
  if (tierId !== 'starter' && !ownsUpgrade(`pizza-${tierId}`)) return
  cancelAnimationFrame(bakeFrame)
  cancelAnimationFrame(ingredientFrame)
  cancelAnimationFrame(pizzaToolFrame)
  cancelAnimationFrame(ovenTransferFrame)
  state.pizzaTier = tierId
  const previousOrder = state.pizza?.order || {}
  state.pizza = freshPizza(tierId, {
    ...createPizzaOrder(tierId, state.orderNumber),
    customerId: previousOrder.customerId || null,
    customerName: previousOrder.customerName || 'Walk-in customer',
    table: previousOrder.table || 7,
  })
  beginPizzaSession(state.pizza)
  renderPizzaTierSelector()
  renderPizza()
  persistProgress()
}

function renderPizza() {
  const pizza = state.pizza
  minigameSessions.pizza.update(pizza.step)
  const tier = stationTierFor(pizza)
  const steps = pizzaStepsFor(pizza)
  const index = steps.indexOf(pizza.step)
  renderPips(elements.pizzaStepPips, steps, pizza.step)
  renderTicket()
  renderPizzaTierSelector()
  renderPizzaMenuSelector()
  elements.pizzaTitle.textContent = tier.title
  elements.pizzaSubtitle.textContent = `${tier.label}: ${tier.blurb}.`
  elements.pizzaOrderKicker.textContent = `Pizzeria · Order ${String(pizza.order.number).padStart(2, '0')}`
  elements.pizzaOrderNumber.textContent = `Order ${String(pizza.order.number).padStart(2, '0')}`
  elements.pizzaTableLabel.textContent = `${pizza.order.customerName || 'Walk-in'} · Table ${pizza.order.table || 7}`
  elements.pizzaTicketName.textContent = pizza.order.name
  elements.pizzaTaskName.textContent = pizza.order.name
  elements.pizzaTaskCopy.textContent = pizzaOrderSummary(pizza)
  elements.pizzaStepNumber.textContent = index + 1
  elements.pizzaUndoButton.hidden = pizza.step !== 'toppings'
  elements.pizzaNextButton.hidden = ['sauce', 'cheese', 'toppings', 'bake', 'finish'].includes(pizza.step)
  elements.pizzaLiveScore.textContent = pizza.scores[pizza.step] ? `${pizza.scores[pizza.step]} / 100` : '—'
  renderShiftQueue()

  const copy = {
    sauce: ['Spread', `Drag the spoon in spirals for a ${qualifierLabel(pizza.order.sauce).toLowerCase()} layer of ${tier.sauce.label.toLowerCase()}. When it looks right, click the cheese container.`, 'Continue with cheese'],
    cheese: tier.cheese.interaction === 'place'
      ? ['Place', `Select fresh mozzarella and make the ${qualifierLabel(pizza.order.cheese).toLowerCase()} portion from the recipe book. Choose a topping when ready.`, 'Continue with toppings']
      : ['Scatter', `Drag the shaker for a ${qualifierLabel(pizza.order.cheese).toLowerCase()} cheese layer. When it looks right, click your first topping.`, 'Continue with toppings'],
    toppings: ['Arrange', pizzaCanAdvance()
      ? 'The order is complete. Click the wooden pizza peel beside the board to slide the pie into the oven.'
      : 'Choose each ingredient and follow its light, regular, or extra ticket note. The recipe book has exact counts.', 'Use pizza peel'],
    bake: ['Bake', pizza.bakeRunning
      ? `${bakeStatusFor(pizza.bakeProgress, true).cue} Click the glowing wooden handle to pull the pizza out.`
      : `This order calls for a ${qualifierLabel(pizza.order.bake).toLowerCase()} finish.`, 'Use oven peel'],
    finish: ['Finish', `Click the brush in the oil dish, then paint a ${qualifierLabel(pizza.order.finish).toLowerCase()} coat across the hot pizza.`, 'Finish with oil'],
    cut: ['Slice', pizza.selectedIngredient === 'pizzaCutter'
      ? `Roll the wheel edge to edge through the center. Make ${cutTargetFor(pizza)} evenly spaced cuts for ${pizza.order.slices} slices.`
      : `Click the pizza cutter beside the board, then make ${cutTargetFor(pizza)} centered cuts for ${pizza.order.slices} slices.`, 'Serve pizza'],
  }[pizza.step]

  elements.pizzaVerb.textContent = copy[0]
  elements.pizzaInstruction.textContent = copy[1]
  const gate=currentPizzaGate()
  if(gate.blocked) {elements.pizzaVerb.textContent=gate.code === 'burning' ? 'Cooking stopped' : 'Prepare';elements.pizzaInstruction.textContent=gate.copy}
  elements.pizzaNextButton.textContent = copy[2]
  elements.pizzaNextButton.disabled = !pizzaCanAdvance()
  renderPizzaTools()
  drawPizzaCanvas()
  renderKitchenService()
}

function pizzaCanAdvance() {
  if(currentPizzaGate().blocked) return false
  const pizza = state.pizza
  const tier = stationTierFor(pizza)
  if (pizza.step === 'sauce') return coverageOf(pizza.sauceGrid) >= Math.max(0.28, sauceTargetFor(pizza) - 0.22)
  if (pizza.step === 'cheese') {
    return tier.cheese.interaction === 'place'
      ? pizza.cheesePoints.length >= cheeseTargetFor(pizza)
      : coverageOf(pizza.cheeseGrid) >= Math.max(0.26, cheeseTargetFor(pizza) - 0.24)
  }
  if (pizza.step === 'toppings') {
    return Object.entries(toppingTargetsFor(pizza)).every(([type, count]) => (
      pizza.toppings.filter((topping) => topping.type === type).length >= count
    ))
  }
  if (pizza.step === 'bake') return true
  if (pizza.step === 'finish') return coverageOf(pizza.finishGrid) >= Math.max(0.1, finishTargetFor(pizza) - 0.12)
  if (pizza.step === 'cut') return !pizza.served && pizza.cuts.length >= cutTargetFor(pizza)
  return false
}

function renderPizzaTools() {
  const pizza = state.pizza
  const tier = stationTierFor(pizza)
  if (pizza.step === 'sauce') {
    const sauceControl = tier.sauce.id === 'tomato' ? 'sauce' : tier.sauce.id
    elements.pizzaTools.innerHTML = pizza.selectedIngredient === sauceControl
      ? `<span class="tool-chip is-active"><span class="topping-icon" style="--chip-color:${tier.sauce.id === 'pesto' ? '#5f803f' : '#ad3e2f'}"></span>${tier.sauce.label} ready</span><span class="tool-chip">Spread in overlapping spirals</span>`
      : `<span class="tool-chip">Click the ${tier.sauce.id === 'pesto' ? 'pesto mortar on the painted counter' : 'sauce bowl to stir the spoon'}</span><span class="tool-chip">Order: ${qualifierLabel(pizza.order.sauce)} sauce</span>`
  } else if (pizza.step === 'cheese') {
    const cheeseControl = tier.cheese.id === 'shredded' ? 'cheese' : tier.cheese.id
    elements.pizzaTools.innerHTML = pizza.selectedIngredient === cheeseControl
      ? `<span class="tool-chip is-active"><span class="topping-icon" style="--chip-color:#f2d48c"></span>${tier.cheese.label} ready</span><span class="tool-chip">Order: ${qualifierLabel(pizza.order.cheese)} cheese</span>`
      : `<span class="tool-chip">Click the ${tier.cheese.interaction === 'place' ? 'fresh mozzarella bowl on the painted counter' : 'cheese tray to shake the dispenser'}</span><span class="tool-chip">Order: ${qualifierLabel(pizza.order.cheese)} cheese</span>`
  } else if (pizza.step === 'toppings') {
    const detail = pizza.selectedIngredient && toppingDetails[pizza.selectedIngredient]
    elements.pizzaTools.innerHTML = pizzaCanAdvance()
      ? '<span class="tool-chip is-active">Wooden peel ready</span><span class="tool-chip">Click its handle to carry the pizza to the oven</span>'
      : detail
      ? `<span class="tool-chip is-active"><span class="topping-icon" style="--chip-color:${detail.color}"></span>${detail.label} ready</span><span class="tool-chip">Order: ${qualifierLabel(pizza.order.toppings[pizza.selectedIngredient])}</span>`
      : '<span class="tool-chip">Choose a topping tray, then place it on the pizza</span><span class="tool-chip">Each click places one piece</span>'
  } else if (pizza.step === 'bake') {
    const status = bakeStatusFor(pizza.bakeProgress, pizza.bakeRunning)
    elements.pizzaTools.innerHTML = `<span class="tool-chip is-active">🔥 ${status.label}</span><span class="tool-chip">Click the peel handle to remove · ${qualifierLabel(pizza.order.bake)}</span>`
  } else if (pizza.step === 'finish') {
    elements.pizzaTools.innerHTML = pizza.selectedIngredient === 'oliveOil'
      ? '<span class="tool-chip is-active">▰ Brush loaded with oil</span><span class="tool-chip">Drag the bristles over the pizza</span>'
      : `<span class="tool-chip">Click the brush in the oil dish on the right</span><span class="tool-chip">Order: ${qualifierLabel(pizza.order.finish)} oil</span>`
  } else {
    elements.pizzaTools.innerHTML = pizza.selectedIngredient === 'pizzaCutter'
      ? `<span class="tool-chip is-active">Pizza wheel in hand</span><span class="tool-chip">${pizza.cuts.length}/${cutTargetFor(pizza)} cuts · ${pizza.order.slices} slices</span>`
      : `<span class="tool-chip">Click the pizza cutter beside the board</span><span class="tool-chip">${cutTargetFor(pizza)} cuts · ${pizza.order.slices} slices</span>`
  }
}

function beginOvenTransfer() {
  const pizza = state.pizza
  if (pizza.step !== 'toppings' || pizza.transferringToOven || !pizzaCanAdvance()) return
  cancelAnimationFrame(ovenTransferFrame)
  pizza.scores.toppings = scoreToppings(toppingTargetsFor(pizza), pizza.toppings)
  pizza.selectedIngredient = null
  pizza.transferringToOven = true
  pizza.ovenTransferProgress = 0
  let previousAt = performance.now()
  const duration = 760
  const tick = (now) => {
    if (state.pizza !== pizza || !pizza.transferringToOven) return
    const elapsed=Math.max(0,now-previousAt);previousAt=now
    if(kitchenIsRunning() && !state.kitchenService.burning) pizza.ovenTransferProgress=clamp(pizza.ovenTransferProgress+elapsed/duration,0,1)
    drawPizzaCanvas()
    if (pizza.ovenTransferProgress < 1) {
      ovenTransferFrame = requestAnimationFrame(tick)
      return
    }
    pizza.transferringToOven = false
    pizza.step = 'bake'
    pizza.ovenTransferProgress = 1
    startBake()
  }
  ovenTransferFrame = requestAnimationFrame(tick)
  renderPizza()
}

function handlePizzaNext() {
  if(!ensurePizzaPrep() || !pizzaCanAdvance()) return
  const pizza = state.pizza
  const tier = stationTierFor(pizza)
  if (pizza.step === 'sauce') {
    pizza.scores.sauce = scoreCoverage(coverageOf(pizza.sauceGrid), sauceTargetFor(pizza))
    pizza.step = 'cheese'
    pizza.selectedIngredient = null
  } else if (pizza.step === 'cheese') {
    pizza.scores.cheese = scoreCoverage(
      coverageOf(pizza.cheeseGrid),
      tier.cheese.interaction === 'place' ? 0.18 + cheeseTargetFor(pizza) * 0.02 : cheeseTargetFor(pizza),
    )
    pizza.step = 'toppings'
    pizza.selectedIngredient = null
  } else if (pizza.step === 'toppings') {
    beginOvenTransfer()
    return
  } else if (pizza.step === 'bake') {
    if (!pizza.bakeRunning) startBake()
    else finishBake(pizza.bakeProgress)
  } else if (pizza.step === 'finish') {
    pizza.scores.finish = scoreCoverage(coverageOf(pizza.finishGrid), finishTargetFor(pizza))
    pizza.step = 'cut'
    pizza.selectedIngredient = null
  } else if (pizza.step === 'cut') {
    pizza.scores.cut = scoreCuts(pizza.cuts, { x: 300, y: 300 }, cutTargetFor(pizza))
    finishPizza()
  }
  renderPizza()
  persistProgress()
}

function updateBakeStatusCopy(pizza, force = false) {
  const status = bakeStatusFor(pizza.bakeProgress, pizza.bakeRunning)
  elements.pizzaBadge.textContent = status.label
  if (!force && pizza.bakeStatusKey === status.key) return
  pizza.bakeStatusKey = status.key
  elements.pizzaInstruction.textContent = `${status.cue} Click the glowing wooden handle to pull the pizza out.`
  renderPizzaTools()
}

function startBake() {
  if(!ensurePizzaPrep()) return
  const pizza = state.pizza
  pizza.bakeStart = performance.now()
  pizza.bakeRunning = true
  pizza.bakeStatusKey = null
  elements.pizzaNextButton.textContent = 'Take it out'
  let previousAt=performance.now()
  const tick = (now) => {
    if (!pizza.bakeRunning || state.pizza !== pizza) return
    const elapsed=Math.max(0,now-previousAt);previousAt=now
    if(kitchenIsRunning() && !state.kitchenService.burning) pizza.bakeProgress=clamp(pizza.bakeProgress+elapsed/10000,0,1)
    updateBakeStatusCopy(pizza)
    drawPizzaCanvas()
    if (pizza.bakeProgress < 1) bakeFrame = requestAnimationFrame(tick)
  }
  bakeFrame = requestAnimationFrame(tick)
  renderPizza()
  persistProgress()
}

function finishBake(progress) {
  if(currentPizzaGate().blocked) return
  const pizza = state.pizza
  pizza.bakeRunning = false
  cancelAnimationFrame(bakeFrame)
  const [perfectStart, perfectEnd] = bakeTargetFor(pizza)
  pizza.scores.bake = scoreTiming(progress, perfectStart, perfectEnd)
  pizza.bakeProgress = progress
  pizza.step = stationTierFor(pizza).finish ? 'finish' : 'cut'
  pizza.selectedIngredient = null
  renderPizza()
  persistProgress()
}

async function finishPizza() {
  const pizza = state.pizza
  if (pizza.served || pizza.completing || currentPizzaGate().blocked) return
  const online=coopActive(),oldLevel=state.progression.atelierLevel
  const serviceResult=online ? {ok:true} : completeKitchenPizza(state.kitchenService,pizza.id)
  if(!serviceResult.ok) return
  const tier = stationTierFor(pizza)
  const weightedScores = [
    [pizza.scores.sauce, 0.18],
    [pizza.scores.cheese, 0.14],
    [pizza.scores.toppings, 0.27],
    [pizza.scores.bake, 0.24],
    [pizza.scores.cut, 0.17],
  ]
  if (tier.finish) weightedScores.push([pizza.scores.finish, 0.08])
  const totalWeight = weightedScores.reduce((total, entry) => total + entry[1], 0)
  const quality = Math.round(weightedScores.reduce((total, [score, weight]) => total + score * weight, 0) / totalWeight)
  const seconds = Math.max(1,pizza.workingSeconds)
  const hasVegetables = Object.entries(pizza.order.toppings).some(([id, amount]) => amount !== 'none' && ['pepper', 'onion', 'olive', 'mushroom'].includes(id))
  const tipBonus=orderGarmentTipBonus(state.fashionSetEffects,{vegetables:hasVegetables,phase:state.phase,presentation:state.outfit?.bonus || 0})
  let payout=pizzaEarnings({tier: pizza.tierId,quality,seconds,setBonus:tipBonus,reputation:state.reputation})
  if(online) {
    pizza.completing=true;updatePizzaContinuation()
    const result=await roomCommand('complete-pizza',{pizzaId:pizza.id,tierId:pizza.tierId,quality,seconds,tipBonus,reputationBonus:state.fashionSetEffects.reputationBonus})
    pizza.completing=false
    if(!result.ok) {roomWarning(result);renderPizza();return}
    payout=result.payout
  }
  if (!minigameSessions.pizza.complete({
    order: pizza.order,
    tierId: pizza.tierId,
    quality,
    payout,
    seconds: Number(seconds.toFixed(2)),
    scores: pizza.scores,
  })) return
  pizza.served = true
  if(!online) state.kitchenService=serviceResult.state
  pizzeriaShift.serveCurrent({ order: pizza.order, quality, payout }, 2)
  syncKitchenService()
  if(!online) {
    state.coins += payout
    state.ledger=recordDayActivity(state.ledger,{earned:payout,pizzas:1})
    const rep=reputationAward(quality,state.fashionSetEffects.reputationBonus,state.reputationCarry)
    state.reputation+=rep.gained;state.reputationCarry=rep.carry
  }
  const atelierAdvanced = online ? state.progression.atelierLevel>oldLevel : applyProgression(recordPizzaResult(state.progression, { quality, payout }))
  updateProgress()
  renderPizza()

  const sauceActual = coverageOf(pizza.sauceGrid)
  const cheeseActual = coverageOf(pizza.cheeseGrid)
  const bakeSeconds = pizza.bakeProgress * 10
  const [bakeStart, bakeEnd] = bakeTargetFor(pizza)
  const scoreStats = [
    [`Sauce · ${qualifierLabel(pizza.order.sauce)}`, `${Math.round(sauceActual * 100)}% / ${Math.round(sauceTargetFor(pizza) * 100)}%`],
    [`Cheese · ${qualifierLabel(pizza.order.cheese)}`, tier.cheese.interaction === 'place'
      ? `${pizza.cheesePoints.length} / ${cheeseTargetFor(pizza)} pcs`
      : `${Math.round(cheeseActual * 100)}% / ${Math.round(cheeseTargetFor(pizza) * 100)}%`],
    ['Toppings', `${pizza.scores.toppings} / 100`],
    [`Bake · ${qualifierLabel(pizza.order.bake)}`, `${bakeSeconds.toFixed(1)}s / ${(bakeStart * 10).toFixed(1)}–${(bakeEnd * 10).toFixed(1)}s`],
  ]
  if (tier.finish) {
    scoreStats.push([`Oil · ${qualifierLabel(pizza.order.finish)}`, `${Math.round(coverageOf(pizza.finishGrid) * 100)}% / ${Math.round(finishTargetFor(pizza) * 100)}%`])
  }
  scoreStats.push([`Slices · ${pizza.order.slices}`, `${pizza.cuts.length * 2} made · ${pizza.scores.cut}/100`])

  showResult({
    kicker: `Order ${String(pizza.order.number).padStart(2, '0')} served`,
    hero: '🍕',
    title: `${quality}% order match · +${payout} coins`,
    copy: `${pizza.order.name} is out the door. This compact check compares the finished pizza with every kitchen word on the ticket.${atelierAdvanced ? ` Atelier level ${state.progression.atelierLevel} unlocked.` : ''}`,
    stats: scoreStats,
    actions: [
      { label: 'Next order', className: 'primary-button', action: () => { closeResult({ runDismiss: false }); startNextPizzaOrder() } },
      { label: 'Recipe book', className: 'secondary-button', action: () => openRecipeBook({ afterClose: startNextPizzaOrder }) },
    ],
    compact: true,
    onDismiss: startNextPizzaOrder,
  })
}

function drawWood(context) {
  const gradient = context.createLinearGradient(0, 0, 600, 600)
  if (['dusk','night'].includes(state.lightingPreview)) {
    gradient.addColorStop(0, '#76596a')
    gradient.addColorStop(1, '#a46658')
  } else if (state.lightingPreview === 'noon') {
    gradient.addColorStop(0, '#d59b65')
    gradient.addColorStop(1, '#b87550')
  } else {
    gradient.addColorStop(0, '#d7ab78')
    gradient.addColorStop(1, '#b97a58')
  }
  context.fillStyle = gradient
  context.fillRect(0, 0, 600, 600)
  context.strokeStyle = 'rgba(76,43,30,.16)'
  context.lineWidth = 4
  for (let y = 65; y < 600; y += 82) {
    context.beginPath()
    context.moveTo(0, y)
    context.bezierCurveTo(150, y - 5, 370, y + 7, 600, y - 2)
    context.stroke()
  }
}

function drawArtPlate(context, image, fallback) {
  if (image.complete && image.naturalWidth > 0) {
    context.drawImage(image, 0, 0, 600, 600)
  } else {
    fallback(context)
  }
}

function imageReady(image) {
  return image.complete && image.naturalWidth > 0
}

function drawAtlasSprite(context, image, {
  column,
  row,
  columns,
  rows,
  x,
  y,
  width,
  height = width,
  rotation = 0,
  alpha = 1,
  sourceInsetTop = 0,
  sourceInsetBottom = 0,
}) {
  if (!imageReady(image)) return false
  const sourceWidth = image.naturalWidth / columns
  const sourceHeight = image.naturalHeight / rows
  const insetTop = sourceHeight * clamp(sourceInsetTop, 0, .45)
  const insetBottom = sourceHeight * clamp(sourceInsetBottom, 0, .45)
  const visibleSourceHeight = sourceHeight - insetTop - insetBottom
  const destinationInsetTop = height * clamp(sourceInsetTop, 0, .45)
  const destinationInsetBottom = height * clamp(sourceInsetBottom, 0, .45)
  context.save()
  context.globalAlpha = alpha
  context.translate(x, y)
  context.rotate(rotation)
  context.drawImage(
    image,
    column * sourceWidth,
    row * sourceHeight + insetTop,
    sourceWidth,
    visibleSourceHeight,
    -width / 2,
    -height / 2 + destinationInsetTop,
    width,
    height - destinationInsetTop - destinationInsetBottom,
  )
  context.restore()
  return true
}

function drawPropSprite(context, image, {
  x,
  y,
  width,
  height,
  rotation = 0,
  alpha = 1,
  anchorX = 0.5,
  anchorY = 0.5,
  shadowBlur = 0,
}) {
  if (!imageReady(image)) return false
  context.save()
  context.globalAlpha = alpha
  context.translate(x, y)
  context.rotate(rotation)
  if (shadowBlur) {
    context.shadowColor = 'rgba(52, 27, 18, .44)'
    context.shadowBlur = shadowBlur
    context.shadowOffsetY = Math.max(2, shadowBlur * 0.28)
  }
  context.drawImage(image, -width * anchorX, -height * anchorY, width, height)
  context.restore()
  return true
}

function drawUpgradeFoodSprite(context, column, {
  x,
  y,
  width,
  height = width,
  rotation = 0,
  alpha = 1,
}) {
  const image = materialArt.upgrades
  if (!imageReady(image)) return false
  const sourceWidth = image.naturalWidth / 6
  const sourceHeight = image.naturalHeight / 2
  const topInset = sourceHeight * 0.24
  const destinationInset = height * 0.24
  context.save()
  context.globalAlpha = alpha
  context.translate(x, y)
  context.rotate(rotation)
  context.drawImage(
    image,
    column * sourceWidth,
    sourceHeight + topInset,
    sourceWidth,
    sourceHeight - topInset,
    -width / 2,
    -height / 2 + destinationInset,
    width,
    height - destinationInset,
  )
  context.restore()
  return true
}

function drawUpgradeFoodVariant(context, row, variant, {
  x,
  y,
  width,
  height = width,
  rotation = 0,
  alpha = 1,
  filter = null,
  sourceInsetTop = 0,
  sourceInsetBottom = 0,
}) {
  const image = materialArt.upgradeFood
  if (!imageReady(image)) return false
  context.save()
  if (filter) context.filter = filter
  drawAtlasSprite(context, image, {
    column: variant % 4,
    row,
    columns: 4,
    rows: 4,
    x,
    y,
    width,
    height,
    rotation,
    alpha,
    sourceInsetTop,
    sourceInsetBottom,
  })
  context.restore()
  return true
}

function forEachPathSample(path, spacing, callback) {
  if (!path.length) return
  callback(path[0], 0)
  let travelledSinceSample = 0
  let sampleIndex = 1
  for (let index = 1; index < path.length; index += 1) {
    const start = path[index - 1]
    const end = path[index]
    const distance = Math.hypot(end.x - start.x, end.y - start.y)
    if (!distance) continue
    let along = spacing - travelledSinceSample
    while (along <= distance) {
      const amount = along / distance
      callback({
        x: start.x + (end.x - start.x) * amount,
        y: start.y + (end.y - start.y) * amount,
      }, sampleIndex)
      sampleIndex += 1
      along += spacing
    }
    travelledSinceSample = (travelledSinceSample + distance) % spacing
  }
}

function applyCanvasLighting(context, strength = 1) {
  context.save()
  if (state.lightingPreview === 'morning') {
    const glow = context.createLinearGradient(0, 0, 600, 600)
    glow.addColorStop(0, `rgba(255, 235, 178, ${0.15 * strength})`)
    glow.addColorStop(0.58, 'rgba(255, 247, 219, 0)')
    glow.addColorStop(1, `rgba(105, 151, 154, ${0.08 * strength})`)
    context.fillStyle = glow
    context.fillRect(0, 0, 600, 600)
  } else if (['dusk','night'].includes(state.lightingPreview)) {
    context.globalCompositeOperation = 'multiply'
    context.fillStyle = `rgba(91, 75, 116, ${0.24 * strength})`
    context.fillRect(0, 0, 600, 600)
    context.globalCompositeOperation = 'screen'
    const lamp = context.createRadialGradient(470, 80, 10, 470, 80, 330)
    lamp.addColorStop(0, `rgba(255, 190, 91, ${0.28 * strength})`)
    lamp.addColorStop(1, 'rgba(255, 170, 76, 0)')
    context.fillStyle = lamp
    context.fillRect(0, 0, 600, 600)
  } else {
    context.fillStyle = `rgba(255, 246, 211, ${0.035 * strength})`
    context.fillRect(0, 0, 600, 600)
  }
  context.restore()
}

function organicCircle(context, centerX, centerY, radius, wobble = 3) {
  context.beginPath()
  for (let index = 0; index <= 64; index += 1) {
    const angle = index / 64 * Math.PI * 2
    const edge = radius + Math.sin(angle * 5 + 0.7) * wobble + Math.sin(angle * 9) * wobble * 0.38
    const x = centerX + Math.cos(angle) * edge
    const y = centerY + Math.sin(angle) * edge
    if (index === 0) context.moveTo(x, y)
    else context.lineTo(x, y)
  }
  context.closePath()
}

function drawPizzaBase(context, baked = false) {
  const bakeAmount = typeof baked === 'number' ? clamp(baked, 0, 1) : baked ? 0.72 : 0
  const cooked = bakeAmount > 0
  const burn = clamp((bakeAmount - 0.8) / 0.2, 0, 1)
  if (imageReady(materialArt.dough)) {
    context.save()
    context.shadowColor = 'rgba(54, 30, 22, .34)'
    context.shadowBlur = 18
    context.shadowOffsetY = 11
    context.filter = cooked
      ? `sepia(${0.06 + bakeAmount * 0.48}) saturate(${1 + bakeAmount * 0.42}) brightness(${1 - bakeAmount * 0.16 - burn * 0.2}) contrast(${1 + bakeAmount * 0.18 + burn * 0.12})`
      : 'saturate(.96) brightness(1.02)'
    context.drawImage(materialArt.dough, 100, 100, 400, 400)
    context.restore()

    if (cooked) {
      context.save()
      context.globalCompositeOperation = 'multiply'
      const toast = context.createRadialGradient(280, 270, 95, 300, 300, 191)
      toast.addColorStop(0, `rgba(255, 218, 116, ${bakeAmount * 0.05})`)
      toast.addColorStop(0.7, `rgba(190, 101, 36, ${bakeAmount * 0.28 + burn * 0.14})`)
      toast.addColorStop(1, `rgba(91, 42, 27, ${bakeAmount * 0.44 + burn * 0.38})`)
      context.fillStyle = toast
      organicCircle(context, 300, 300, 185, 3.2)
      context.fill()
      context.restore()

      const blisterAmount = smoothstep(clamp((bakeAmount - 0.18) / 0.58, 0, 1))
      context.save()
      for (let index = 0; index < 18; index += 1) {
        const angle = index / 18 * Math.PI * 2 + seededValue(index * 43) * 0.18
        const radius = 169 + seededValue(index * 67 + 3) * 13
        const x = 300 + Math.cos(angle) * radius
        const y = 300 + Math.sin(angle) * radius
        const size = (2.4 + seededValue(index * 97 + 5) * 4.3) * blisterAmount
        context.shadowColor = 'rgba(72, 33, 20, .28)'
        context.shadowBlur = size * 0.7
        const blister = context.createRadialGradient(x - size * 0.28, y - size * 0.35, 0.5, x, y, Math.max(1, size))
        blister.addColorStop(0, `rgba(255, 224, 147, ${0.35 + blisterAmount * 0.35})`)
        blister.addColorStop(0.72, `rgba(190, 106, 43, ${0.2 + blisterAmount * 0.45})`)
        blister.addColorStop(1, `rgba(94, 45, 28, ${burn * 0.72})`)
        context.fillStyle = blister
        context.beginPath()
        context.ellipse(x, y, size, size * 0.72, angle, 0, Math.PI * 2)
        context.fill()
      }
      context.restore()
    }
    return
  }

  context.save()
  context.shadowColor = 'rgba(54, 30, 22, .34)'
  context.shadowBlur = 18
  context.shadowOffsetY = 11
  const crust = context.createRadialGradient(265, 245, 24, 300, 300, 192)
  crust.addColorStop(0, cooked ? '#efb959' : '#f3d692')
  crust.addColorStop(0.72, cooked ? '#d5843d' : '#e1a65e')
  crust.addColorStop(1, cooked ? '#9c4c2f' : '#b76c43')
  context.fillStyle = crust
  organicCircle(context, 300, 300, 188, 3.8)
  context.fill()
  context.restore()

  const dough = context.createRadialGradient(265, 250, 18, 300, 300, 162)
  dough.addColorStop(0, cooked ? '#f4d681' : '#fff0bb')
  dough.addColorStop(0.75, cooked ? '#e8b85d' : '#f1d392')
  dough.addColorStop(1, cooked ? '#d79843' : '#ddb06b')
  context.fillStyle = dough
  organicCircle(context, 300, 300, 160, 2.2)
  context.fill()

  context.strokeStyle = cooked ? 'rgba(102, 49, 29, .58)' : 'rgba(116, 72, 42, .38)'
  context.lineWidth = 5
  context.beginPath()
  context.arc(300, 300, 174, 0, Math.PI * 2)
  context.stroke()

  for (let index = 0; index < 26; index += 1) {
    const angle = index / 26 * Math.PI * 2
    const radius = 174 + (index % 3) * 4
    context.fillStyle = index % 2 ? 'rgba(119,59,35,.25)' : 'rgba(255,241,190,.38)'
    context.beginPath()
    context.arc(300 + Math.cos(angle) * radius, 300 + Math.sin(angle) * radius, 2 + index % 3, 0, Math.PI * 2)
    context.fill()
  }
}

function clipPizzaInterior(context, callback) {
  context.save()
  context.beginPath()
  context.arc(300, 300, 157, 0, Math.PI * 2)
  context.clip()
  callback()
  context.restore()
}

function drawSauce(context) {
  const pizza = state.pizza
  const tier = stationTierFor(pizza)
  const paths = pizza.saucePaths
  if (tier.sauce.id === 'pesto') {
    clipPizzaInterior(context, () => {
      const pesto = context.createLinearGradient(170, 165, 430, 435)
      pesto.addColorStop(0, '#9ba43a')
      pesto.addColorStop(0.52, '#74862b')
      pesto.addColorStop(1, '#4c681f')
      context.lineCap = 'round'
      context.lineJoin = 'round'

      paths.forEach((path) => {
        if (!path.length) return
        context.strokeStyle = 'rgba(66, 76, 23, .22)'
        context.lineWidth = 57
        context.beginPath()
        context.moveTo(path[0].x + 2, path[0].y + 3)
        path.slice(1).forEach((point) => context.lineTo(point.x + 2, point.y + 3))
        context.stroke()

        context.save()
        context.shadowColor = 'rgba(58, 67, 20, .2)'
        context.shadowBlur = 4
        context.strokeStyle = pesto
        context.lineWidth = 52
        context.beginPath()
        context.moveTo(path[0].x, path[0].y)
        path.slice(1).forEach((point) => context.lineTo(point.x, point.y))
        context.stroke()
        context.restore()

        context.strokeStyle = 'rgba(230, 221, 111, .2)'
        context.lineWidth = 13
        context.beginPath()
        context.moveTo(path[0].x - 4, path[0].y - 6)
        path.slice(1).forEach((point) => context.lineTo(point.x - 4, point.y - 6))
        context.stroke()
      })

      if (imageReady(materialArt.pesto)) {
        paths.forEach((path, pathIndex) => {
          forEachPathSample(path, 22, (point, sampleIndex) => {
            const variant = (pathIndex * 5 + sampleIndex * 3) % 16
            const turn = (seededValue(pathIndex * 701 + sampleIndex * 43 + 9) - 0.5) * 0.7
            drawAtlasSprite(context, materialArt.pesto, {
              column: variant % 4,
              row: Math.floor(variant / 4),
              columns: 4,
              rows: 4,
              x: point.x,
              y: point.y,
              width: 70,
              rotation: turn,
              alpha: 0.62,
            })
          })
        })
        return
      }

      paths.forEach((path, pathIndex) => {
        forEachPathSample(path, 8, (point, sampleIndex) => {
          for (let fleck = 0; fleck < 5; fleck += 1) {
            const seed = pathIndex * 719 + sampleIndex * 53 + fleck * 131
            const angle = seededValue(seed) * Math.PI * 2
            const radius = Math.sqrt(seededValue(seed + 9)) * 21
            const x = point.x + Math.cos(angle) * radius
            const y = point.y + Math.sin(angle) * radius
            context.fillStyle = fleck % 3 === 0
              ? 'rgba(230, 219, 119, .54)'
              : fleck % 3 === 1
                ? 'rgba(37, 73, 29, .62)'
                : 'rgba(132, 157, 58, .68)'
            context.beginPath()
            context.ellipse(x, y, 0.8 + seededValue(seed + 17) * 2.1, 0.65 + seededValue(seed + 23) * 1.45, angle, 0, Math.PI * 2)
            context.fill()
          }
          if (sampleIndex % 3 === 0) {
            const glintX = point.x - 8 + seededValue(sampleIndex * 97 + pathIndex) * 16
            const glintY = point.y - 8 + seededValue(sampleIndex * 71 + pathIndex) * 10
            context.fillStyle = 'rgba(247, 238, 168, .28)'
            context.beginPath()
            context.ellipse(glintX, glintY, 4, 1.3, -0.45, 0, Math.PI * 2)
            context.fill()
          }
        })
      })
    })
    return
  }
  if (imageReady(materialArt.sauce)) {
    clipPizzaInterior(context, () => {
      const base = context.createLinearGradient(165, 175, 435, 430)
      base.addColorStop(0, '#c84931')
      base.addColorStop(0.58, '#aa3027')
      base.addColorStop(1, '#86261f')
      context.strokeStyle = base
      context.lineWidth = 55
      context.lineCap = 'round'
      context.lineJoin = 'round'
      paths.forEach((path) => {
        if (!path.length) return
        context.beginPath()
        context.moveTo(path[0].x, path[0].y)
        path.slice(1).forEach((point) => context.lineTo(point.x, point.y))
        context.stroke()
      })

      paths.forEach((path, pathIndex) => {
        forEachPathSample(path, 22, (point, sampleIndex) => {
          const variant = (pathIndex * 5 + sampleIndex * 3) % 16
          const turn = (seededValue(pathIndex * 701 + sampleIndex * 43 + 9) - 0.5) * 0.7
          drawAtlasSprite(context, materialArt.sauce, {
            column: variant % 4,
            row: Math.floor(variant / 4),
            columns: 4,
            rows: 4,
            x: point.x,
            y: point.y,
            width: 70,
            rotation: turn,
            alpha: 0.58,
          })
        })
      })
    })
    return
  }

  clipPizzaInterior(context, () => {
    const sauce = context.createLinearGradient(170, 160, 430, 440)
    sauce.addColorStop(0, '#cf4d34')
    sauce.addColorStop(0.55, '#ae382e')
    sauce.addColorStop(1, '#8f2d29')
    context.strokeStyle = sauce
    context.lineWidth = 54
    context.lineCap = 'round'
    context.lineJoin = 'round'
    for (const path of paths) {
      if (!path.length) continue
      context.beginPath()
      context.moveTo(path[0].x, path[0].y)
      path.slice(1).forEach((point) => context.lineTo(point.x, point.y))
      context.stroke()

      // A narrower, translucent pass keeps player-drawn sauce feeling glossy
      // and hand-painted without changing the coverage calculation.
      context.strokeStyle = 'rgba(255, 154, 103, .22)'
      context.lineWidth = 17
      context.beginPath()
      context.moveTo(path[0].x - 3, path[0].y - 4)
      path.slice(1).forEach((point) => context.lineTo(point.x - 3, point.y - 4))
      context.stroke()
      context.strokeStyle = sauce
      context.lineWidth = 54
    }
  })
}

function drawMeltedCheesePatch(context, x, y, melt, seed, fresh = false) {
  if (melt <= 0.08) return
  const spread = smoothstep(clamp((melt - 0.08) / 0.72, 0, 1))
  const width = (fresh ? 22 : 18) + spread * (fresh ? 18 : 17)
  const height = (fresh ? 17 : 12) + spread * (fresh ? 12 : 12)
  const gradient = context.createRadialGradient(x - width * 0.22, y - height * 0.28, 2, x, y, width)
  gradient.addColorStop(0, `rgba(255, 250, 211, ${0.42 + spread * 0.34})`)
  gradient.addColorStop(0.7, `rgba(250, 222, 139, ${0.34 + spread * 0.38})`)
  gradient.addColorStop(1, `rgba(211, 151, 62, ${0.08 + spread * 0.2})`)
  context.fillStyle = gradient
  context.beginPath()
  const rotation = (seededValue(seed * 31) - 0.5) * 0.8
  for (let index = 0; index <= 28; index += 1) {
    const angle = index / 28 * Math.PI * 2
    const wobble = 0.9 + seededValue(seed * 97 + index * 41) * 0.2
    const localX = Math.cos(angle) * width * wobble
    const localY = Math.sin(angle) * height * wobble
    const pointX = x + localX * Math.cos(rotation) - localY * Math.sin(rotation)
    const pointY = y + spread * 2 + localX * Math.sin(rotation) + localY * Math.cos(rotation)
    if (index === 0) context.moveTo(pointX, pointY)
    else context.lineTo(pointX, pointY)
  }
  context.closePath()
  context.fill()

  if (melt > 0.44) {
    const bubble = 2.4 + Math.sin(performance.now() / 180 + seed) * 0.8
    context.strokeStyle = `rgba(255, 252, 224, ${0.18 + (1 - melt) * 0.24})`
    context.lineWidth = 1.5
    context.beginPath()
    context.arc(x + (seededValue(seed * 47 + 7) - 0.5) * width, y - height * 0.24, bubble, 0, Math.PI * 2)
    context.stroke()
  }

  const brown = clamp((melt - 0.64) / 0.28, 0, 1)
  if (brown > 0) {
    context.fillStyle = `rgba(153, 83, 30, ${brown * 0.46})`
    for (let spot = 0; spot < (fresh ? 2 : 1); spot += 1) {
      const dx = (seededValue(seed * 71 + spot * 19) - 0.5) * width * 1.1
      const dy = (seededValue(seed * 89 + spot * 23) - 0.5) * height * 0.8
      context.beginPath()
      context.ellipse(x + dx, y + dy, 2.3 + brown * 2.1, 1.5 + brown * 1.4, 0.3, 0, Math.PI * 2)
      context.fill()
    }
  }
}

function drawMeltedCheeseConnections(context, points, melt, fresh = false) {
  const merge = smoothstep(clamp((melt - 0.16) / 0.58, 0, 1))
  if (merge <= 0 || points.length < 2) return
  const maximumDistance = fresh ? 120 : 92
  const connections = []
  points.forEach((point, pointIndex) => {
    let nearest = null
    for (let otherIndex = pointIndex + 1; otherIndex < points.length; otherIndex += 1) {
      const other = points[otherIndex]
      const distance = Math.hypot(other.x - point.x, other.y - point.y)
      if (distance <= maximumDistance && (!nearest || distance < nearest.distance)) {
        nearest = { point: other, distance }
      }
    }
    if (nearest) connections.push([point, nearest.point])
  })
  const mask = cheeseMergeContext
  mask.setTransform(1, 0, 0, 1, 0, 0)
  mask.clearRect(0, 0, LOGICAL_CANVAS_SIZE, LOGICAL_CANVAS_SIZE)
  mask.globalCompositeOperation = 'source-over'
  mask.globalAlpha = 1
  mask.filter = `blur(${fresh ? 3.2 : 4.4}px)`
  mask.fillStyle = '#fff'
  const blobRadius = (fresh ? 24 : 21) + merge * (fresh ? 18 : 20)
  points.forEach((point, index) => {
    const width = blobRadius * (0.92 + seededValue(index * 41 + 5) * 0.2)
    const height = blobRadius * (fresh ? 0.74 : 0.82) * (0.92 + seededValue(index * 59 + 7) * 0.17)
    mask.beginPath()
    mask.ellipse(point.x, point.y + merge * 2, width, height, (seededValue(index * 71 + 9) - 0.5) * 0.7, 0, Math.PI * 2)
    mask.fill()
  })

  mask.lineCap = 'round'
  mask.lineJoin = 'round'
  mask.strokeStyle = '#fff'
  mask.lineWidth = (fresh ? 24 : 31) + merge * (fresh ? 22 : 34)
  connections.forEach(([start, end]) => {
    const bend = (seededValue(start.x * 13 + start.y * 17 + end.x * 19) - 0.5) * 16
    const middleX = (start.x + end.x) / 2 + bend
    const middleY = (start.y + end.y) / 2 - bend * 0.35
    mask.beginPath()
    mask.moveTo(start.x, start.y + merge * 2)
    mask.quadraticCurveTo(middleX, middleY, end.x, end.y + merge * 2)
    mask.stroke()
  })

  mask.filter = 'none'
  mask.globalCompositeOperation = 'source-in'
  const cheeseColor = mask.createLinearGradient(0, 175, 0, 430)
  if (fresh) {
    cheeseColor.addColorStop(0, '#fff8d9')
    cheeseColor.addColorStop(0.55, '#f7e4ae')
    cheeseColor.addColorStop(1, '#e9c577')
  } else {
    cheeseColor.addColorStop(0, '#fff0ad')
    cheeseColor.addColorStop(0.55, '#f3c95e')
    cheeseColor.addColorStop(1, '#dca840')
  }
  mask.fillStyle = cheeseColor
  mask.fillRect(0, 0, LOGICAL_CANVAS_SIZE, LOGICAL_CANVAS_SIZE)
  mask.globalCompositeOperation = 'source-over'

  context.save()
  context.globalAlpha = 0.38 + merge * 0.58
  context.shadowColor = 'rgba(118, 72, 28, .2)'
  context.shadowBlur = 3
  context.drawImage(cheeseMergeCanvas, 0, 0)
  context.globalCompositeOperation = 'screen'
  context.globalAlpha = merge * 0.16
  context.drawImage(cheeseMergeCanvas, -1, -2)
  context.restore()
}

function drawCheese(context) {
  const pizza = state.pizza
  const tier = stationTierFor(pizza)
  const melt = pizzaBakeAmount(pizza)
  const sheetBlend = smoothstep(clamp((melt - 0.16) / 0.58, 0, 1))
  if (tier.cheese.id === 'freshMozzarella' && (imageReady(materialArt.upgradeFood) || imageReady(materialArt.upgrades))) {
    clipPizzaInterior(context, () => {
      context.save()
      drawMeltedCheeseConnections(context, pizza.cheesePoints, melt, true)
      pizza.cheesePoints.forEach((point, index) => {
        const rotation = (seededValue(index * 97 + 41) - 0.5) * 1.05
        const melted = smoothstep(clamp((melt - 0.1) / 0.78, 0, 1))
        if (melted > 0 && imageReady(materialArt.upgradeFood)) {
          drawUpgradeFoodVariant(context, 3, index, {
            x: point.x,
            y: point.y + melted * 3,
            width: 84 + melted * 12,
            height: 76 + melted * 10,
            rotation: rotation * 0.42,
            alpha: melted * (1 - sheetBlend * 0.42),
            filter: `brightness(${1.07 - melted * 0.07}) saturate(${0.94 + melted * 0.06})`,
          })
        }
        const rawAlpha = 1 - melted * 0.94
        if (rawAlpha > 0.04) {
          if (!drawUpgradeFoodVariant(context, 0, index, {
            x: point.x,
            y: point.y,
            width: 76,
            height: 68,
            rotation,
            alpha: rawAlpha,
          })) {
            drawUpgradeFoodSprite(context, 1, {
              x: point.x,
              y: point.y,
              width: 58,
              height: 48,
              rotation,
              alpha: rawAlpha,
            })
          }
        }
      })
      context.restore()
    })
    return
  }
  if (imageReady(materialArt.ingredients)) {
    clipPizzaInterior(context, () => {
      context.save()
      const baked = ['bake', 'finish', 'cut'].includes(state.pizza.step)
      const layers = [
        { size: 35, alpha: 0.58, shadow: 0 },
        { size: 43, alpha: 0.78, shadow: 1.5 },
        { size: 50, alpha: 0.96, shadow: 3.5 },
      ]
      const meltBlend = smoothstep(clamp((melt - 0.05) / 0.58, 0, 1))
      const meltedPoints = state.pizza.cheesePoints.map((point, index) => ({
        x: point.x + (seededValue(index * 109 + 31) - 0.5) * 31,
        y: point.y + (seededValue(index * 137 + 59) - 0.5) * 35,
      }))
      drawMeltedCheeseConnections(context, meltedPoints, melt, false)
      if (melt > 0.05 && imageReady(materialArt.cheeseMelt)) {
        const stageFloat = clamp((melt - 0.08) / 0.82, 0, 1) * 3
        const firstStage = Math.floor(stageFloat)
        const secondStage = Math.min(3, firstStage + 1)
        const stageBlend = stageFloat - firstStage
        meltedPoints.forEach(({ x, y }, index) => {
          const turn = (seededValue(index * 83 + 17) - 0.5) * 1.1
          const size = 70 + meltBlend * 18
          drawAtlasSprite(context, materialArt.cheeseMelt, {
            column: index % 4,
            row: firstStage,
            columns: 4,
            rows: 4,
            x,
            y,
            width: size,
            rotation: turn,
            alpha: meltBlend * (1 - stageBlend) * (1 - sheetBlend * 0.5),
          })
          if (secondStage !== firstStage) {
            drawAtlasSprite(context, materialArt.cheeseMelt, {
              column: (index + 1) % 4,
              row: secondStage,
              columns: 4,
              rows: 4,
              x,
              y,
              width: size + 2,
              rotation: turn * 0.8,
              alpha: meltBlend * stageBlend * (1 - sheetBlend * 0.5),
            })
          }
        })
      } else if (melt > 0.1) {
        state.pizza.cheesePoints.forEach((point, index) => {
          if (index % 2) return
          const jitterX = (seededValue(index * 109 + 31) - 0.5) * 31
          const jitterY = (seededValue(index * 137 + 59) - 0.5) * 35
          drawMeltedCheesePatch(context, point.x + jitterX, point.y + jitterY, melt, index + 79)
        })
      }
      context.filter = baked ? `sepia(${0.05 + melt * 0.14}) saturate(${1.04 + melt * 0.1}) brightness(${1 - melt * 0.07})` : 'none'
      layers.forEach((layer, layerIndex) => {
        context.shadowColor = 'rgba(91, 55, 28, .22)'
        context.shadowBlur = layer.shadow
        state.pizza.cheesePoints.forEach((point, index) => {
          if (index % layers.length !== layerIndex) return
          const turn = (seededValue(index * 83 + 17) - 0.5) * 1.35
          const jitterX = (seededValue(index * 109 + 31) - 0.5) * 31
          const jitterY = (seededValue(index * 137 + 59) - 0.5) * 35
          drawAtlasSprite(context, materialArt.ingredients, {
            column: index % 4,
            row: 0,
            columns: 4,
            rows: 4,
            x: point.x + jitterX,
            y: point.y + jitterY,
            width: layer.size,
            rotation: turn,
            alpha: layer.alpha * (1 - meltBlend * 0.94),
          })
        })
      })
      context.restore()
    })
    return
  }

  clipPizzaInterior(context, () => {
    state.pizza.cheesePoints.forEach((point, index) => {
      for (let particle = 0; particle < 5; particle += 1) {
        const angle = (index * 1.7 + particle * 1.25)
        const radius = 8 + particle * 4
        const x = point.x + Math.cos(angle) * radius
        const y = point.y + Math.sin(angle) * radius
        context.strokeStyle = particle % 2 ? '#fff0b8' : '#edc76c'
        context.lineWidth = 6
        context.shadowColor = 'rgba(112, 67, 30, .18)'
        context.shadowBlur = 2
        context.beginPath()
        context.moveTo(x - 5, y - 2)
        context.lineTo(x + 6, y + 2)
        context.stroke()
      }
    })
  })
}

function drawFinishOil(context) {
  const paths = state.pizza.finishPaths
  if (!paths.length) return
  clipPizzaInterior(context, () => {
    context.save()
    context.globalCompositeOperation = 'screen'
    context.lineCap = 'round'
    context.lineJoin = 'round'
    paths.forEach((path, pathIndex) => {
      if (!path.length) return
      const oil = context.createLinearGradient(170, 170, 430, 430)
      oil.addColorStop(0, 'rgba(255, 225, 92, .16)')
      oil.addColorStop(0.5, 'rgba(255, 196, 44, .23)')
      oil.addColorStop(1, 'rgba(255, 234, 128, .14)')
      context.strokeStyle = oil
      context.lineWidth = 26
      context.beginPath()
      context.moveTo(path[0].x, path[0].y)
      path.slice(1).forEach((point) => context.lineTo(point.x, point.y))
      context.stroke()

      context.strokeStyle = 'rgba(255, 246, 188, .22)'
      context.lineWidth = 6
      context.beginPath()
      context.moveTo(path[0].x - 3, path[0].y - 4)
      path.slice(1).forEach((point) => context.lineTo(point.x - 3, point.y - 4))
      context.stroke()

      forEachPathSample(path, 18, (point, sampleIndex) => {
        const previous = path[Math.max(0, sampleIndex - 1)] || point
        const angle = Math.atan2(point.y - previous.y, point.x - previous.x)
        drawUpgradeFoodSprite(context, 5, {
          x: point.x,
          y: point.y,
          width: 58,
          height: 25,
          rotation: Number.isFinite(angle) ? angle : 0,
          alpha: 0.5 + seededValue(pathIndex * 61 + sampleIndex * 17) * 0.18,
        })
      })
    })
    context.restore()
  })
}

function drawTopping(context, topping, bakeAmount = 0) {
  const cooked = clamp(bakeAmount, 0, 1)
  const wilt = topping.type === 'basil' ? cooked : 0
  const shrink = 1 - cooked * (topping.type === 'basil' ? 0.16 : 0.045)
  const filters = {
    pepper: `saturate(${1 - cooked * 0.22}) brightness(${1 - cooked * 0.16}) sepia(${cooked * 0.2})`,
    onion: `saturate(${1 - cooked * 0.34}) brightness(${1 - cooked * 0.14}) sepia(${cooked * 0.2})`,
    pepperoni: `saturate(${1 - cooked * 0.08}) brightness(${1 - cooked * 0.13}) contrast(${1 + cooked * 0.13})`,
    mushroom: `saturate(${1 - cooked * 0.3}) brightness(${1 - cooked * 0.17}) sepia(${cooked * 0.42})`,
    basil: `saturate(${1 - wilt * 0.5}) brightness(${1 - wilt * 0.34}) contrast(${1 + wilt * 0.12})`,
  }
  const rotation = (topping.rotation || 0) + (topping.type === 'basil' ? cooked * 0.08 : 0)

  const drawSprite = () => {
    if (topping.type === 'pepper' || topping.type === 'onion') {
      const row = topping.type === 'pepper' ? 1 : 2
      const size = topping.type === 'pepper' ? 72 : 68
      if (!drawUpgradeFoodVariant(context, row, topping.variant || 0, {
        x: 0,
        y: 0,
        width: size,
        height: size,
        rotation,
        sourceInsetTop: topping.type === 'onion' ? .1 : 0,
        sourceInsetBottom: topping.type === 'onion' ? .04 : 0,
      })) {
        drawUpgradeFoodSprite(context, toppingDetails[topping.type].upgradeColumn, {
          x: 0,
          y: 0,
          width: topping.type === 'pepper' ? 54 : 48,
          height: topping.type === 'pepper' ? 45 : 42,
          rotation,
        })
      }
    } else if (imageReady(materialArt.ingredients)) {
      const row = { pepperoni: 1, mushroom: 2, basil: 3 }[topping.type]
      const size = { pepperoni: 45, mushroom: 49, basil: 52 }[topping.type]
      drawAtlasSprite(context, materialArt.ingredients, {
        column: topping.variant || 0,
        row,
        columns: 4,
        rows: 4,
        x: 0,
        y: 0,
        width: size,
        rotation,
      })
    } else if (topping.type === 'pepperoni') {
      context.fillStyle = '#b94332'
      context.strokeStyle = '#7d2c28'
      context.lineWidth = 3
      context.beginPath()
      context.arc(0, 0, 15, 0, Math.PI * 2)
      context.fill()
      context.stroke()
    } else if (topping.type === 'mushroom') {
      context.fillStyle = '#ead9b6'
      context.strokeStyle = '#8b6d55'
      context.lineWidth = 3
      context.beginPath()
      context.arc(0, -4, 14, Math.PI, Math.PI * 2)
      context.lineTo(4, 12)
      context.lineTo(-4, 12)
      context.closePath()
      context.fill()
      context.stroke()
    } else {
      context.fillStyle = '#4b8153'
      context.strokeStyle = '#2f5b3b'
      context.lineWidth = 2
      context.beginPath()
      context.ellipse(0, 0, 7, 14, -0.55, 0, Math.PI * 2)
      context.fill()
      context.stroke()
    }
  }

  context.save()
  context.translate(topping.x, topping.y + cooked * 1.2)
  context.scale(shrink, shrink * (1 - wilt * 0.08))
  if (cooked > 0.05) {
    context.save()
    context.translate(0, 2.4 + cooked * 3.6)
    context.globalAlpha = 0.22 + cooked * 0.24
    context.filter = `brightness(${0.42 - cooked * 0.08}) saturate(${0.72 - cooked * 0.08})`
    drawSprite()
    context.restore()
  }
  context.filter = filters[topping.type] || 'none'
  drawSprite()

  if (cooked > 0.12) {
    const highlightSize = { pepperoni: 12, mushroom: 14, basil: 11, pepper: 16, onion: 15 }[topping.type] || 12
    context.filter = 'none'
    context.strokeStyle = `rgba(255, 241, 204, ${0.08 + cooked * 0.13})`
    context.lineWidth = 1.7
    context.lineCap = 'round'
    context.beginPath()
    context.arc(-2, -2, highlightSize, 1.08 * Math.PI, 1.58 * Math.PI)
    context.stroke()
  }
  context.restore()

  const char = smoothstep(clamp((cooked - 0.5) / 0.34, 0, 1))
  if (char > 0 && topping.type !== 'basil') {
    context.save()
    context.fillStyle = `rgba(100, 48, 25, ${char * 0.58})`
    const count = topping.type === 'pepper' || topping.type === 'mushroom' ? 2 : 1
    for (let index = 0; index < count; index += 1) {
      const seed = (topping.variant || 0) * 83 + topping.x * 7 + topping.y * 11 + index * 37
      const dx = (seededValue(seed) - 0.5) * 24
      const dy = (seededValue(seed + 13) - 0.5) * 18
      context.beginPath()
      context.ellipse(topping.x + dx, topping.y + dy, 2.2 + char * 1.5, 1.2 + char, 0.4, 0, Math.PI * 2)
      context.fill()
    }
    context.restore()
  }
}

function drawKitchenTool(context, column, {
  x,
  y,
  width = 112,
  height = width,
  rotation = 0,
  alpha = 1,
}) {
  drawAtlasSprite(context, materialArt.pizzaTools, {
    column,
    row: 0,
    columns: 3,
    rows: 1,
    x,
    y,
    width,
    height,
    rotation,
    alpha,
  })
}

function drawPestoSpoonful(context, x, y, rotation = 0) {
  context.save()
  context.translate(x, y)
  context.rotate(rotation)
  context.shadowColor = 'rgba(44, 54, 22, .28)'
  context.shadowBlur = 2
  const pesto = context.createRadialGradient(-4, -3, 1, 0, 0, 15)
  pesto.addColorStop(0, '#c4d964')
  pesto.addColorStop(0.46, '#6f9637')
  pesto.addColorStop(1, '#31551f')
  context.fillStyle = pesto
  context.beginPath()
  context.ellipse(0, 0, 15, 10.5, 0, 0, Math.PI * 2)
  context.fill()
  context.shadowBlur = 0
  context.fillStyle = 'rgba(246, 237, 138, .62)'
  for (const [dx, dy, radius] of [[-6, -3, 1.3], [2, -2, 1], [6, 3, 1.2], [-2, 4, 0.85]]) {
    context.beginPath()
    context.arc(dx, dy, radius, 0, Math.PI * 2)
    context.fill()
  }
  context.restore()
}

function drawUpgradeTool(context, column, {
  x,
  y,
  width = 112,
  height = 44,
  rotation = 0,
  alpha = 1,
}) {
  const image = materialArt.upgradeTools
  if (!imageReady(image)) return false
  const cellWidth = image.naturalWidth / 2
  const sourceInsetX = cellWidth * 0.035
  const sourceY = image.naturalHeight * 0.2
  const sourceWidth = cellWidth * 0.93
  const sourceHeight = image.naturalHeight * 0.48
  context.save()
  context.globalAlpha = alpha
  context.translate(x, y)
  context.rotate(rotation)
  context.drawImage(
    image,
    column * cellWidth + sourceInsetX,
    sourceY,
    sourceWidth,
    sourceHeight,
    -width / 2,
    -height / 2,
    width,
    height,
  )
  context.restore()
  return true
}

function drawIdleUpgradeTools(context) {
  const pizza = state.pizza
  const animationId = pizza.selectionAnimation?.id
  const tier = stationTierFor(pizza)
  if (tier.sauce.id === 'pesto' && animationId !== 'pesto') {
    drawUpgradeTool(context, 0, {
      x: 518,
      y: 178,
      width: 108,
      height: 44,
      rotation: -0.88,
      alpha: 0.98,
    })
  }
  if (
    tier.finish
    && animationId !== 'oliveOil'
    && !(pizza.dragging && pizza.step === 'finish')
  ) {
    const angle = 1.55
    const dish = { x: 554, y: 379 }
    drawUpgradeTool(context, 1, {
      x: dish.x - Math.cos(angle) * 39,
      y: dish.y - Math.sin(angle) * 39,
      width: 112,
      height: 45,
      rotation: angle,
      alpha: 0.98,
    })
  }
}

function drawPeelOnCounter(context) {
  const pizza = state.pizza
  if (pizza.step !== 'toppings') return
  const ready = pizzaCanAdvance()
  const progress = smoothstep(pizza.ovenTransferProgress || 0)
  const pulse = ready && !pizza.transferringToOven ? 0.5 + Math.sin(performance.now() / 280) * 0.16 : 0
  const x = 360
  const y = 510 + (402 - 510) * progress
  const width = 220 + (360 - 220) * progress
  const height = width / 1.5

  if (pulse > 0) {
    context.save()
    context.globalCompositeOperation = 'screen'
    const glow = context.createRadialGradient(PIZZA_PEEL_DOCK.x, PIZZA_PEEL_DOCK.y, 8, PIZZA_PEEL_DOCK.x, PIZZA_PEEL_DOCK.y, 58)
    glow.addColorStop(0, `rgba(255, 220, 126, ${pulse * 0.46})`)
    glow.addColorStop(1, 'rgba(255, 202, 100, 0)')
    context.fillStyle = glow
    context.fillRect(380, 500, 130, 96)
    context.restore()
  }

  drawPropSprite(context, materialArt.pizzaPeel, {
    x,
    y,
    width,
    height,
    rotation: -0.035 * (1 - progress),
    alpha: ready ? 0.98 : 0.56,
    shadowBlur: 9,
  })
}

function drawOvenPeel(context) {
  drawPropSprite(context, materialArt.pizzaPeel, {
    x: 360,
    y: 402,
    width: 360,
    height: 240,
    alpha: 0.92,
    shadowBlur: 8,
  })

  if (!state.pizza.bakeRunning) return
  const pulse = 0.5 + Math.sin(performance.now() / 250) * 0.18
  context.save()
  context.globalCompositeOperation = 'screen'
  context.strokeStyle = `rgba(255, 221, 137, ${pulse})`
  context.lineWidth = 4
  context.shadowColor = 'rgba(255, 155, 54, .7)'
  context.shadowBlur = 12
  context.beginPath()
  context.arc(OVEN_PEEL_HANDLE.x, OVEN_PEEL_HANDLE.y, 24, 0, Math.PI * 2)
  context.stroke()
  context.restore()
}

function drawPizzaCutter(context) {
  const pizza = state.pizza
  if (pizza.step !== 'cut') return
  const selected = pizza.selectedIngredient === 'pizzaCutter'

  if (pizza.dragging && pizza.toolPointer) {
    const angle = Number.isFinite(pizza.toolAngle) ? pizza.toolAngle : 0
    drawPropSprite(context, materialArt.pizzaCutter, {
      x: pizza.toolPointer.x,
      y: pizza.toolPointer.y,
      width: 146,
      height: 97,
      rotation: angle - 0.71,
      anchorX: 0.78,
      anchorY: 0.72,
      shadowBlur: 7,
    })

    context.save()
    context.translate(pizza.toolPointer.x, pizza.toolPointer.y)
    context.rotate(pizza.cutterWheelRotation)
    context.strokeStyle = 'rgba(255, 246, 213, .72)'
    context.lineWidth = 1.8
    context.beginPath()
    context.moveTo(-21, 0)
    context.lineTo(21, 0)
    context.moveTo(0, -21)
    context.lineTo(0, 21)
    context.stroke()
    context.restore()
    return
  }

  if (selected) {
    context.save()
    context.globalCompositeOperation = 'screen'
    const glow = context.createRadialGradient(PIZZA_CUTTER_DOCK.x, PIZZA_CUTTER_DOCK.y, 10, PIZZA_CUTTER_DOCK.x, PIZZA_CUTTER_DOCK.y, 72)
    glow.addColorStop(0, 'rgba(255, 231, 161, .48)')
    glow.addColorStop(1, 'rgba(255, 214, 127, 0)')
    context.fillStyle = glow
    context.fillRect(190, 468, 220, 128)
    context.restore()
  }

  drawPropSprite(context, materialArt.pizzaCutter, {
    x: PIZZA_CUTTER_DOCK.x,
    y: PIZZA_CUTTER_DOCK.y - (selected ? 5 : 0),
    width: 158,
    height: 105,
    alpha: selected ? 1 : 0.94,
    shadowBlur: selected ? 12 : 7,
  })
}

function drawIngredientSelectionAnimation(context) {
  const pizza = state.pizza
  const animation = pizza.selectionAnimation
  if (!animation) return
  const zone = ingredientZones[animation.id]
  const progress = animation.progress
  const eased = smoothstep(progress)
  const lift = Math.sin(progress * Math.PI)

  context.save()
  context.shadowColor = 'rgba(52, 29, 24, .34)'
  context.shadowBlur = 7 + lift * 5
  context.shadowOffsetY = 3 + lift * 3

  if (animation.id === 'sauce') {
    const stirAngle = -1.05 + eased * Math.PI * 1.08
    const bowlX = zone.x + Math.cos(stirAngle) * 13
    const bowlY = zone.y + Math.sin(stirAngle) * 8
    const toolAngle = stirAngle + Math.PI
    const toolX = bowlX - Math.cos(toolAngle) * 39
    const toolY = bowlY - Math.sin(toolAngle) * 39
    drawKitchenTool(context, 0, {
      x: toolX,
      y: toolY,
      width: 112,
      rotation: toolAngle,
      alpha: 0.9 + lift * 0.1,
    })

    context.shadowBlur = 0
    context.strokeStyle = `rgba(255, 181, 112, ${0.18 + lift * 0.36})`
    context.lineWidth = 2.4
    context.lineCap = 'round'
    context.beginPath()
    context.ellipse(zone.x, zone.y, 22, 12, 0, stirAngle - 1.3, stirAngle + 0.25)
    context.stroke()
  } else if (animation.id === 'pesto') {
    const grind = Math.sin(eased * Math.PI * 2.4) * 0.19
    const angle = -0.88 + grind
    const press = Math.sin(progress * Math.PI) * 4
    const tipX = zone.x + Math.cos(eased * Math.PI * 1.4) * 8
    const tipY = zone.y + Math.sin(eased * Math.PI * 1.4) * 5 + press * 0.18
    const toolX = tipX - Math.cos(angle) * 39
    const toolY = tipY - Math.sin(angle) * 39 - lift * 5
    drawUpgradeTool(context, 0, {
      x: toolX,
      y: toolY,
      width: 108,
      height: 44,
      rotation: angle,
    })
    context.shadowBlur = 0
    context.strokeStyle = `rgba(206, 236, 116, ${0.16 + lift * 0.34})`
    context.lineWidth = 2.2
    context.lineCap = 'round'
    context.beginPath()
    context.ellipse(zone.x, zone.y + 3, 22, 13, 0, eased * Math.PI * 2 - 1.2, eased * Math.PI * 2 + 0.55)
    context.stroke()
  } else if (animation.id === 'cheese') {
    const shake = Math.sin(progress * Math.PI * 4) * 2.6 * lift
    const toolY = zone.y + 39 - lift * 9
    drawKitchenTool(context, 1, {
      x: zone.x + shake,
      y: toolY,
      width: 106,
      rotation: 0.08 + shake * 0.008,
    })
    context.shadowBlur = 0
    context.strokeStyle = `rgba(248, 223, 155, ${0.25 + lift * 0.65})`
    context.lineWidth = 3
    context.lineCap = 'round'
    for (let index = 0; index < 3; index += 1) {
      const fall = clamp(progress * 1.5 - index * 0.15, 0, 1)
      const x = zone.x + shake + 27 + (index - 1) * 7
      const y = toolY + 8 + fall * 22
      context.beginPath()
      context.moveTo(x - 3, y - 1)
      context.lineTo(x + 3, y + 1)
      context.stroke()
    }
  } else if (animation.id === 'freshMozzarella') {
    for (let index = 0; index < 3; index += 1) {
      const phase = clamp(progress * 1.28 - index * 0.1, 0, 1)
      const bounce = Math.sin(phase * Math.PI)
      const spread = (index - 1) * 10
      context.save()
      context.translate(zone.x + spread, zone.y + 7 - bounce * (12 + index * 3))
      context.rotate((phase - 0.5) * (index - 1) * 0.2)
      context.scale(0.9 + bounce * 0.11, 0.9 + bounce * 0.06)
      if (!drawUpgradeFoodVariant(context, 0, index, {
        x: 0,
        y: 0,
        width: 66,
        height: 60,
        rotation: 0,
      })) {
        drawUpgradeFoodSprite(context, 1, {
          x: 0,
          y: 0,
          width: 43,
          height: 37,
          rotation: 0,
        })
      }
      context.restore()
    }
  } else if (animation.id === 'oliveOil') {
    const dish = { x: 554, y: 379 }
    const dip = Math.sin(progress * Math.PI)
    const angle = 1.55 + Math.sin(eased * Math.PI * 2) * 0.08
    const tipX = dish.x + Math.sin(eased * Math.PI) * 4
    const tipY = dish.y - dip * 13
    drawUpgradeTool(context, 1, {
      x: tipX - Math.cos(angle) * 39,
      y: tipY - Math.sin(angle) * 39,
      width: 112,
      height: 45,
      rotation: angle,
    })
    context.shadowBlur = 0
    context.globalAlpha = 0.25 + lift * 0.48
    context.fillStyle = '#ffe36f'
    context.beginPath()
    context.ellipse(dish.x, dish.y - 2, 14 + lift * 4, 6 + lift * 2, 0, 0, Math.PI * 2)
    context.fill()
  } else {
    for (let index = 0; index < 3; index += 1) {
      const phase = clamp(progress * 1.28 - index * 0.1, 0, 1)
      const bounce = Math.sin(phase * Math.PI)
      const spread = (index - 1) * 11
      context.save()
      context.translate(zone.x + spread, zone.y + 7 - bounce * (12 + index * 3))
      context.rotate((phase - 0.5) * (index - 1) * 0.2)
      context.scale(0.9 + bounce * 0.11, 0.9 + bounce * 0.06)
      drawTopping(context, {
        type: animation.id,
        x: 0,
        y: 0,
        variant: index,
        rotation: 0,
      })
      context.restore()
    }
  }
  context.restore()
}

function drawActivePizzaTool(context) {
  const pizza = state.pizza
  if (pizza.dragging && pizza.toolPointer && pizza.step === 'sauce') {
    const angle = -0.64
    drawKitchenTool(context, 0, {
      x: pizza.toolPointer.x - Math.cos(angle) * 38,
      y: pizza.toolPointer.y - Math.sin(angle) * 38,
      width: 118,
      rotation: angle,
    })
    if (stationTierFor(pizza).sauce.id === 'pesto') {
      drawPestoSpoonful(context, pizza.toolPointer.x, pizza.toolPointer.y, angle)
    }
  } else if (pizza.dragging && pizza.toolPointer && pizza.step === 'cheese') {
    const shake = Math.sin(performance.now() / 105) * 1.6
    drawKitchenTool(context, 1, {
      x: pizza.toolPointer.x - 35 + shake,
      y: pizza.toolPointer.y - 48,
      width: 108,
      rotation: 0.12 + shake * 0.006,
    })
  } else if (pizza.dragging && pizza.toolPointer && pizza.step === 'finish') {
    const angle = Number.isFinite(pizza.toolAngle) ? pizza.toolAngle : -0.58
    drawUpgradeTool(context, 1, {
      x: pizza.toolPointer.x - Math.cos(angle) * 42,
      y: pizza.toolPointer.y - Math.sin(angle) * 42,
      width: 116,
      height: 46,
      rotation: angle,
    })
  }
}

function startPizzaToolAnimationLoop(pizza) {
  cancelAnimationFrame(pizzaToolFrame)
  const tick = () => {
    if (state.pizza !== pizza || !pizza.dragging) return
    drawPizzaCanvas()
    pizzaToolFrame = requestAnimationFrame(tick)
  }
  pizzaToolFrame = requestAnimationFrame(tick)
}

function drawOven(context) {
  drawArtPlate(context, workstationArt.oven, (fallbackContext) => {
    const background = fallbackContext.createLinearGradient(0, 0, 0, 600)
    background.addColorStop(0, '#7f4837')
    background.addColorStop(0.6, '#3b2724')
    background.addColorStop(1, '#1e1718')
    fallbackContext.fillStyle = background
    fallbackContext.fillRect(0, 0, 600, 600)
  })

  const pizza = state.pizza
  const progress = clamp(pizza.bakeProgress, 0, 1)
  const rise = smoothstep(clamp(progress / 0.42, 0, 1))
  const crispy = smoothstep(clamp((progress - 0.58) / 0.18, 0, 1))
  const burn = smoothstep(clamp((progress - 0.8) / 0.2, 0, 1))
  const pizzaY = 378 - rise * 9

  context.save()
  context.globalCompositeOperation = 'screen'
  const heatGlow = context.createRadialGradient(300, 335, 45, 300, 350, 260)
  heatGlow.addColorStop(0, `rgba(255, 176, 59, ${0.08 + progress * 0.12})`)
  heatGlow.addColorStop(1, 'rgba(255, 120, 32, 0)')
  context.fillStyle = heatGlow
  context.fillRect(35, 150, 530, 360)
  context.restore()

  context.save()
  context.shadowColor = 'rgba(24, 12, 8, .64)'
  context.shadowBlur = 24 - rise * 5
  context.fillStyle = `rgba(35, 18, 13, ${0.5 - rise * 0.08})`
  context.beginPath()
  context.ellipse(300, 424, 181 + rise * 8, 34 + rise * 3, 0, 0, Math.PI * 2)
  context.fill()
  context.restore()

  drawOvenPeel(context)

  context.save()
  context.translate(300, pizzaY)
  context.scale(0.92 + rise * 0.035, 0.57 + rise * 0.055)
  context.translate(-300, -300)

  const depth = 6 + Math.round(rise * 8)
  for (let layer = depth; layer >= 1; layer -= 1) {
    const amount = layer / depth
    context.save()
    context.translate(0, layer * 1.22)
    context.fillStyle = `rgb(${Math.round(142 + crispy * 28 - burn * 46)}, ${Math.round(76 + crispy * 16 - burn * 28)}, ${Math.round(38 + crispy * 4 - burn * 9)})`
    context.shadowColor = 'rgba(47, 22, 14, .32)'
    context.shadowBlur = 3 + amount * 5
    organicCircle(context, 300, 300, 184, 3.2)
    context.fill()
    context.restore()
  }

  drawPizzaBase(context, progress)
  drawSauce(context)
  drawCheese(context)
  pizza.toppings.forEach((topping) => drawTopping(context, topping, progress))

  context.save()
  context.lineCap = 'round'
  context.strokeStyle = `rgba(105, 49, 27, ${0.32 + rise * 0.32 + crispy * 0.14})`
  context.lineWidth = 7 + rise * 3
  context.shadowColor = 'rgba(49, 21, 13, .38)'
  context.shadowBlur = 7
  context.beginPath()
  context.arc(300, 302, 177, 0.06 * Math.PI, 0.94 * Math.PI)
  context.stroke()
  context.globalCompositeOperation = 'screen'
  context.strokeStyle = `rgba(255, 210, 112, ${0.16 + rise * 0.18})`
  context.lineWidth = 4.5
  context.shadowBlur = 0
  context.beginPath()
  context.arc(300, 295, 171, 1.08 * Math.PI, 1.92 * Math.PI)
  context.stroke()
  context.restore()

  if (crispy > 0 && burn < 0.72) {
    context.save()
    context.globalCompositeOperation = 'screen'
    context.strokeStyle = `rgba(255, 226, 128, ${crispy * (1 - burn) * 0.68})`
    context.lineWidth = 3.2
    context.lineCap = 'round'
    for (let index = 0; index < 10; index += 1) {
      const angle = index / 10 * Math.PI * 2 + 0.13
      context.beginPath()
      context.arc(300, 300, 174, angle, angle + 0.17)
      context.stroke()
    }
    context.restore()
  }
  context.restore()

  const steamStrength = smoothstep(clamp((progress - 0.24) / 0.24, 0, 1)) * (1 - burn * 0.55)
  if (steamStrength > 0) {
    const now = performance.now() / 900
    context.save()
    context.lineCap = 'round'
    for (let index = 0; index < 5; index += 1) {
      const phase = now + index * 1.37
      const x = 220 + index * 42 + Math.sin(phase) * 10
      const y = pizzaY - 88 - ((phase * 24) % 42)
      context.strokeStyle = `rgba(255, 235, 201, ${steamStrength * 0.11})`
      context.lineWidth = 3
      context.beginPath()
      context.moveTo(x, y + 34)
      context.bezierCurveTo(x - 15, y + 22, x + 17, y + 12, x + Math.sin(phase * 1.7) * 11, y)
      context.stroke()
    }
    context.restore()
  }

  if (burn > 0) {
    context.save()
    context.fillStyle = `rgba(52, 42, 39, ${burn * 0.12})`
    for (let index = 0; index < 4; index += 1) {
      const drift = (performance.now() / 28 + index * 41) % 95
      context.beginPath()
      context.ellipse(245 + index * 38 + Math.sin(drift / 13) * 12, pizzaY - 78 - drift, 12 + burn * 9, 18 + burn * 15, -0.2, 0, Math.PI * 2)
      context.fill()
    }
    context.restore()
  }
}

function drawPizzaLayers(context, pizza) {
  drawPizzaBase(context, pizzaBakeAmount(pizza))
  drawSauce(context)
  drawCheese(context)
  pizza.toppings.forEach((topping) => drawTopping(context, topping, pizzaBakeAmount(pizza)))
  drawFinishOil(context)
}

function drawSeparatedPizza(context, pizza) {
  prepareCanvas(pizzaCompositeCanvas, pizzaCompositeContext)
  drawPizzaLayers(pizzaCompositeContext, pizza)
  if (!pizza.cuts.length) {
    context.drawImage(pizzaCompositeCanvas, 0, 0, LOGICAL_CANVAS_SIZE, LOGICAL_CANVAS_SIZE)
    return
  }

  const rays = pizza.cuts.flatMap((cut) => {
    const angle = Math.atan2(cut.end.y - cut.start.y, cut.end.x - cut.start.x)
    const normalized = ((angle % Math.PI) + Math.PI) % Math.PI
    return [normalized, normalized + Math.PI]
  }).sort((a, b) => a - b)
  const separation = 2.8 + pizza.cuts.length * 0.9

  rays.forEach((start, index) => {
    const end = index === rays.length - 1 ? rays[0] + Math.PI * 2 : rays[index + 1]
    const middle = (start + end) / 2
    const offsetX = Math.cos(middle) * separation
    const offsetY = Math.sin(middle) * separation
    context.save()
    context.translate(offsetX, offsetY)
    context.beginPath()
    context.moveTo(300, 300)
    context.arc(300, 300, 205, start - 0.006, end + 0.006)
    context.closePath()
    context.clip()
    context.shadowColor = 'rgba(47, 24, 18, .42)'
    context.shadowBlur = 7
    context.shadowOffsetY = 3
    context.drawImage(pizzaCompositeCanvas, 0, 0, LOGICAL_CANVAS_SIZE, LOGICAL_CANVAS_SIZE)
    context.restore()
  })
}

function traceCutPath(context, cut) {
  const points = cut.points?.length ? cut.points : [cut.start, cut.end]
  context.beginPath()
  context.moveTo(points[0].x, points[0].y)
  points.slice(1).forEach((point) => context.lineTo(point.x, point.y))
}

function drawPizzaCanvas() {
  const context = pizzaContext
  const pizza = state.pizza
  updatePizzaContinuation()
  prepareCanvas(pizzaCanvas, context)
  if (pizza.step === 'bake') {
    drawOven(context)
    applyCanvasLighting(context, 0.35)
    elements.pizzaBadge.textContent = bakeStatusFor(pizza.bakeProgress, pizza.bakeRunning).label
    return
  }

  drawArtPlate(context, workstationArt.pizza[pizza.tierId] || workstationArt.pizza.starter, drawWood)
  drawPeelOnCounter(context)
  if (pizza.step === 'cut') drawSeparatedPizza(context, pizza)
  else drawPizzaLayers(context, pizza)
  drawIdleUpgradeTools(context)
  drawIngredientSelectionAnimation(context)
  drawActivePizzaTool(context)

  if (pizza.step === 'cut') {
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.strokeStyle = 'rgba(73, 39, 29, .58)'
    context.lineWidth = 2.8
    for (const cut of pizza.cuts) {
      traceCutPath(context, cut)
      context.stroke()
    }
    if (pizza.currentCut) {
      context.strokeStyle = 'rgba(255,248,225,.85)'
      context.setLineDash([12, 8])
      context.lineWidth = 4
      traceCutPath(context, pizza.currentCut)
      context.stroke()
      context.setLineDash([])
    }
    drawPizzaCutter(context)
    elements.pizzaBadge.textContent = `Cut · ${pizza.cuts.length}/${cutTargetFor(pizza)} · ${pizza.order.slices} slices`
  } else if (pizza.step === 'sauce') {
    elements.pizzaBadge.textContent = `${stationTierFor(pizza).sauce.label} · ${qualifierLabel(pizza.order.sauce)}`
  } else if (pizza.step === 'cheese') {
    const tier = stationTierFor(pizza)
    elements.pizzaBadge.textContent = `${tier.cheese.label} · ${qualifierLabel(pizza.order.cheese)}`
  } else if (pizza.step === 'finish') {
    elements.pizzaBadge.textContent = `Olive oil · ${qualifierLabel(pizza.order.finish)}`
  } else {
    const selectedQualifier = pizza.order.toppings[pizza.selectedTopping]
    elements.pizzaBadge.textContent = selectedQualifier
      ? `${toppingDetails[pizza.selectedTopping].label} · ${qualifierLabel(selectedQualifier)}`
      : 'Choose a topping'
  }
  applyCanvasLighting(context)
}

function pizzaPointerDown(event) {
  if(!ensurePizzaPrep()) return
  const pizza = state.pizza
  const tier = stationTierFor(pizza)
  const point = canvasPoint(pizzaCanvas, event)
  const stationTool = stationToolAt(point, pizza)
  if (stationTool === 'ovenPeel') {
    if (pizza.step === 'toppings') beginOvenTransfer()
    else if (pizza.step === 'bake' && pizza.bakeRunning) finishBake(pizza.bakeProgress)
    return
  }
  if (stationTool === 'pizzaCutter') {
    pizza.selectedIngredient = 'pizzaCutter'
    pizza.toolPointer = null
    renderPizza()
    return
  }
  const counterIngredient = counterIngredientAt(point, pizza)
  if (counterIngredient) {
    selectCounterIngredient(pizza, counterIngredient)
    return
  }
  const sauceControl = tier.sauce.id === 'tomato' ? 'sauce' : tier.sauce.id
  const cheeseControl = tier.cheese.id === 'shredded' ? 'cheese' : tier.cheese.id
  if (pizza.step === 'sauce' && pizza.selectedIngredient !== sauceControl) {
    return
  }
  if (pizza.step === 'cheese' && pizza.selectedIngredient !== cheeseControl) {
    return
  }
  if (pizza.step === 'toppings' && !(pizza.selectedIngredient in tier.toppings)) {
    return
  }
  if (pizza.step === 'finish' && pizza.selectedIngredient !== 'oliveOil') {
    return
  }
  if (pizza.step === 'bake' || pizza.transferringToOven) return
  pizzaCanvas.setPointerCapture(event.pointerId)
  if (pizza.step === 'sauce' && Math.hypot(point.x - 300, point.y - 300) <= 162) {
    pizza.dragging = true
    pizza.toolPointer = point
    pizza.toolAngle = 0
    pizza.saucePaths.push([point])
    markCoverage(pizza.sauceGrid, point, 29)
    startPizzaToolAnimationLoop(pizza)
  } else if (pizza.step === 'cheese' && Math.hypot(point.x - 300, point.y - 300) <= 162) {
    if (tier.cheese.interaction === 'place') {
      if (pizza.cheesePoints.length < cheeseTargetFor(pizza)) {
        pizza.cheesePoints.push(point)
        markCoverage(pizza.cheeseGrid, point, 28)
      }
      elements.pizzaNextButton.disabled = !pizzaCanAdvance()
      renderPizza()
      return
    }
    pizza.dragging = true
    pizza.toolPointer = point
    pizza.cheesePoints.push(point)
    markCoverage(pizza.cheeseGrid, point, 25)
    startPizzaToolAnimationLoop(pizza)
  } else if (pizza.step === 'toppings' && Math.hypot(point.x - 300, point.y - 300) <= 148) {
    const placedOfType = pizza.toppings.filter((topping) => topping.type === pizza.selectedTopping).length
    const topping = {
      ...point,
      type: pizza.selectedTopping,
      variant: placedOfType % 4,
      rotation: (seededValue(point.x * 17 + point.y * 31 + placedOfType * 47) - 0.5) * 0.9,
    }
    pizza.toppings.push(topping)
    renderPizza()
    return
  } else if (pizza.step === 'finish' && Math.hypot(point.x - 300, point.y - 300) <= 158) {
    pizza.dragging = true
    pizza.toolPointer = point
    pizza.finishPaths.push([point])
    markCoverage(pizza.finishGrid, point, 19)
    startPizzaToolAnimationLoop(pizza)
  } else if (
    pizza.step === 'cut'
    && pizza.selectedIngredient === 'pizzaCutter'
    && Math.hypot(point.x - 300, point.y - 300) <= 188
  ) {
    pizza.dragging = true
    pizza.toolPointer = point
    pizza.cutDistance = 0
    pizza.cutterWheelRotation = 0
    pizza.toolAngle = Math.atan2(300 - point.y, 300 - point.x)
    pizza.currentCut = {
      start: point,
      end: point,
      points: [point],
      axisAngle: pizza.toolAngle,
    }
    startPizzaToolAnimationLoop(pizza)
  }
  drawPizzaCanvas()
}

function pizzaPointerMove(event) {
  if(currentPizzaGate().blocked) return
  const pizza = state.pizza
  const tier = stationTierFor(pizza)
  const point = canvasPoint(pizzaCanvas, event)
  if (!pizza.dragging) {
    const stationTool = stationToolAt(point, pizza)
    const usablePeel = stationTool === 'ovenPeel' && (pizza.step === 'bake' || pizzaCanAdvance())
    if (stationTool === 'pizzaCutter' || usablePeel || counterIngredientAt(point, pizza)) {
      pizzaCanvas.style.cursor = 'pointer'
    } else if (pizza.step === 'cut' && pizza.selectedIngredient === 'pizzaCutter') {
      pizzaCanvas.style.cursor = 'crosshair'
    } else {
      pizzaCanvas.style.cursor = 'default'
    }
    return
  }
  const previousToolPoint = pizza.toolPointer
  if (
    pizza.step !== 'cut'
    && previousToolPoint
    && Math.hypot(point.x - previousToolPoint.x, point.y - previousToolPoint.y) > 1
  ) {
    pizza.toolAngle = Math.atan2(point.y - previousToolPoint.y, point.x - previousToolPoint.x)
  }
  if (pizza.step !== 'cut') pizza.toolPointer = point
  if (pizza.step === 'sauce' && tier.sauce.interaction === 'spread' && Math.hypot(point.x - 300, point.y - 300) <= 166) {
    const path = pizza.saucePaths.at(-1)
    const previous = path.at(-1)
    path.push(point)
    markCoverageSegment(pizza.sauceGrid, previous, point, 29, 11)
  } else if (pizza.step === 'cheese' && tier.cheese.interaction === 'scatter' && Math.hypot(point.x - 300, point.y - 300) <= 166) {
    const previous = pizza.cheesePoints.at(-1)
    const distance = previous ? Math.hypot(point.x - previous.x, point.y - previous.y) : 0
    if (!previous || distance > 25) {
      const steps = Math.max(1, Math.ceil(distance / 28))
      for (let index = 1; index <= steps; index += 1) {
        const amount = index / steps
        const sample = previous ? {
          x: previous.x + (point.x - previous.x) * amount,
          y: previous.y + (point.y - previous.y) * amount,
        } : point
        pizza.cheesePoints.push(sample)
        markCoverage(pizza.cheeseGrid, sample, 25)
      }
    }
  } else if (pizza.step === 'finish' && Math.hypot(point.x - 300, point.y - 300) <= 162) {
    const path = pizza.finishPaths.at(-1)
    const previous = path.at(-1)
    path.push(point)
    markCoverageSegment(pizza.finishGrid, previous, point, 19, 9)
  } else if (pizza.step === 'cut' && pizza.currentCut) {
    const axisX = Math.cos(pizza.currentCut.axisAngle)
    const axisY = Math.sin(pizza.currentCut.axisAngle)
    const fromStartX = point.x - pizza.currentCut.start.x
    const fromStartY = point.y - pizza.currentCut.start.y
    const along = fromStartX * axisX + fromStartY * axisY
    const projected = {
      x: pizza.currentCut.start.x + axisX * along,
      y: pizza.currentCut.start.y + axisY * along,
    }
    const assist = 0.72
    const assistedPoint = {
      x: point.x * (1 - assist) + projected.x * assist,
      y: point.y * (1 - assist) + projected.y * assist,
    }
    const previous = pizza.currentCut.points.at(-1)
    const distance = Math.hypot(assistedPoint.x - previous.x, assistedPoint.y - previous.y)
    if (distance < 4) return
    const targetAngle = Math.atan2(assistedPoint.y - previous.y, assistedPoint.x - previous.x)
    const turn = Math.atan2(
      Math.sin(targetAngle - pizza.toolAngle),
      Math.cos(targetAngle - pizza.toolAngle),
    )
    pizza.toolAngle += turn * 0.34
    pizza.cutDistance += distance
    pizza.cutterWheelRotation = pizza.cutDistance / 17
    pizza.currentCut.points.push(assistedPoint)
    pizza.currentCut.end = assistedPoint
    pizza.toolPointer = assistedPoint
  }
  elements.pizzaNextButton.disabled = !pizzaCanAdvance()
  drawPizzaCanvas()
}

function pizzaPointerUp() {
  const pizza = state.pizza
  if(currentPizzaGate().blocked) {pizza.dragging=false; pizza.currentCut=null;cancelAnimationFrame(pizzaToolFrame);return}
  const oilFinished = pizza.step === 'finish' && pizza.dragging && pizzaCanAdvance()
  if (pizza.step === 'cut' && pizza.currentCut) {
    const length = Math.hypot(
      pizza.currentCut.end.x - pizza.currentCut.start.x,
      pizza.currentCut.end.y - pizza.currentCut.start.y,
    )
    if (length > 180 && pizza.cuts.length < cutTargetFor(pizza)) pizza.cuts.push(pizza.currentCut)
    pizza.currentCut = null
  }
  pizza.dragging = false
  pizza.toolPointer = null
  cancelAnimationFrame(pizzaToolFrame)
  if (oilFinished) {
    pizza.scores.finish = scoreCoverage(coverageOf(pizza.finishGrid), finishTargetFor(pizza))
    pizza.step = 'cut'
    pizza.selectedIngredient = null
  }
  renderPizza()
  persistProgress()
}

function projectSupplyQuote(fashion = state.fashion) {
  const alterationCost = (fashion.modifications || []).reduce((total, id) => (
    total + (FASHION_MODIFICATIONS.find((item) => item.id === id)?.cost || 0)
  ), 0)
  return fashionProjectQuote({fabric:fashion.fabric,units:fashion.schematic?.materialUnits || 1,
    alteration:fashion.alterationMode,modificationCost:alterationCost,savings:state.fashionSetEffects.materialSavings},state.fashionInventory)
}
function fashionProjectCost(fashion=state.fashion) {return projectSupplyQuote(fashion).cost}

function renderFashionModificationBench() {
  const fashion = state.fashion
  const bench = elements.fashionModificationBench
  if (!bench) return
  const level = state.fashionInventory.level
  const compatible = compatibleFashionModifications(fashion.schematic)
  const available = compatible.filter((item) => item.unlockLevel <= level)
  const nextLocked = compatible.filter((item) => item.unlockLevel > level).slice(0, 4)
  const selected = new Set(fashion.modifications || [])
  const chosen = available.filter((item) => selected.has(item.id))
  const risk = chosen.reduce((total, item) => total + item.risk, 0)
  const cost = chosen.reduce((total, item) => total + item.cost, 0)
  const atLimit = selected.size >= 3
  const card = (item, locked = false) => {
    const active = selected.has(item.id)
    const toolColumn = item.tool % 4
    const toolRow = Math.floor(item.tool / 4)
    return `<button class="fashion-mod-chip ${active ? 'is-active' : ''} ${locked ? 'is-locked' : ''}" type="button" data-fashion-modification="${item.id}" ${fashion.step !== 'plan' || locked || (atLimit && !active) ? 'disabled' : ''}>
      <span class="fashion-tool-sprite" style="--tool-position:${toolColumn * 33.333}% ${toolRow * 100}%" aria-hidden="true"></span>
      <span><b>${item.label}</b><small>${locked ? `Unlocks at atelier ${item.unlockLevel}` : item.technique}</small><em>${item.group} · ${item.cost} coins · risk ${item.risk}/10</em></span>
    </button>`
  }
  bench.innerHTML = `<div class="fashion-mod-bench-heading">
      <span><small>Alteration bench · optional</small><b>Redraft and personalize</b></span>
      <span class="fashion-mod-meter ${atLimit ? 'is-full' : ''}"><b>${selected.size}/3</b><small>${selected.size ? `${cost} coins · risk ${risk}` : 'Choose up to three'}</small></span>
    </div>
    <div class="fashion-mod-list">${available.map((item) => card(item)).join('')}</div>
    ${nextLocked.length ? `<details class="fashion-mod-locked"><summary>Later techniques <b>${compatible.length - available.length}</b></summary><div class="fashion-mod-list">${nextLocked.map((item) => card(item, true)).join('')}</div></details>` : ''}
    <p class="fashion-mod-note">${chosen.length ? chosen.map((item) => `<b>${item.label}:</b> ${item.note}`).join(' ') : 'Choose a painted recut or attached detail. Unimplemented shape changes are kept off this bench; the finished-piece preview is the source of truth.'}</p>`
  bench.querySelectorAll('[data-fashion-modification]:not(:disabled)').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.fashionModification
      fashion.modifications = selected.has(id)
        ? fashion.modifications.filter((item) => item !== id)
        : [...fashion.modifications.filter(other => !FASHION_MODIFICATIONS.find(item=>item.id===id)?.geometry || !FASHION_MODIFICATIONS.find(item=>item.id===other)?.geometry), id]
      if (!fashion.alterationMode && !compatibleFashionFabric(effectiveSchematic(fashion), fashion.fabric)) fashion.fabric = null
      const guides = fashionGuides(fashion)
      fashion.fabricOffset = { x: SEWING_NEEDLE.x - guides.seam[0].x, y: SEWING_NEEDLE.y - guides.seam[0].y }
      renderFashion()
    })
  })
}

function updatePizzaContinuation() {
  const pizza=state.pizza
  const action=pizzaContinuation(pizza,!pizza.completing && pizzaCanAdvance(),currentPizzaGate().blocked,
    pizza.step === 'bake' ? bakeStatusFor(pizza.bakeProgress,pizza.bakeRunning).label : '')
  renderWorkbenchAction('pizzaActivity',action,()=>{resumeClockForWork();handlePizzaNext()})
}

function updateFashionContinuation() {
  const fashion=state.fashion
  let action=null
  let next=handleFashionNext
  if(!fashion.completed && fashion.step === 'plan' && !fashion.alterationMode) {
    const status=patternAvailability(state.patternLibrary,fashion.schematic,state.fashionInventory.level,state.coins)
    if(!status.owned) {
      action={title:'Your pattern box is empty · Mara has a small daily selection',label:'Visit Mara’s pattern shop'}
      next=openFashionPatternShop
    } else action={title:fashion.fabric ? `${fashion.schematic.name} · ${fashionProjectCost(fashion)} material coins` : '2 · Choose material in the project panel',
      label:fashion.fabric ? 'Start cutting' : 'Choose material',disabled:!fashionCanAdvance()}
  } else if(!fashion.completed && fashionCanAdvance()) action={title: fashion.step==='finish' ? 'Your garment is ready to reveal' : 'This assembly pass is complete',label:elements.fashionNextButton.textContent}
  renderWorkbenchAction('fashionActivity',action,next)
}

let fashionPatternSearch = ''
function openFashionPatternShop() {
  document.dispatchEvent(new CustomEvent('slice-and-stitch:open-pattern-shop'))
}
function renderFashionPlanBoard() {
  const fashion = state.fashion
  const inventory = state.fashionInventory
  if (!elements.fashionPatternSelector || !elements.fashionStyleControls) return
  let planner=document.querySelector('#fashionProjectPlanner')
  if(!planner) {
    planner=document.createElement('section');planner.id='fashionProjectPlanner';planner.className='craft-project-planner'
    planner.setAttribute('aria-label','Choose pattern and material')
    planner.innerHTML='<header><h2>1 · My pattern box</h2><button type="button" class="craft-pattern-shop-link">Visit Mara’s pattern shop</button><p class="planner-note"></p></header><section class="craft-pattern-step"></section><section class="craft-material-step"><h3>2 · Choose material</h3><p>Cloth is paid once when you start cutting.</p><div id="fashionPlannerMaterials"></div></section>'
    planner.querySelector('.craft-pattern-shop-link').addEventListener('click',openFashionPatternShop)
    elements.fashionCanvasWrap.append(planner)
    planner.querySelector('.craft-pattern-step').append(elements.fashionPatternSelector)
  }
  planner.hidden=fashion.step !== 'plan' || fashion.alterationMode
  elements.fashionCanvasWrap.dataset.planning=String(!planner.hidden)
  const ownedCount=state.patternLibrary.owned.length
  planner.querySelector('.planner-note').textContent=`${ownedCount} owned pattern${ownedCount===1?'':'s'} · reuse forever. New patterns stay highlighted until first used.`
  const lockedCount = FASHION_SCHEMATICS.filter((item) => item.unlockLevel > inventory.level).length
  elements.fashionInventoryNote.textContent = fashion.alterationMode
    ? `Alteration order: deconstruct ${fashion.baseGarment.name}, redraft its pattern, and rebuild it with up to three permanent changes.`
    : `Optional accents and alterations. Your ${ownedCount} purchased patterns stay in your library. ${lockedCount} designs await later atelier levels.`
  let controls=document.querySelector('#fashionPatternArchive')
  if(!controls) {
    controls=document.createElement('div')
    controls.id='fashionPatternArchive';controls.className='fashion-archive-controls'
    controls.innerHTML='<label>Sort <select aria-label="Sort patterns"><option value="newest">Newest first</option><option value="value">Catalogue value · high to low</option><option value="tier">Atelier tier · high to low</option><option value="name">Name · A–Z</option></select></label><label>Find <input type="search" aria-label="Search patterns" placeholder="Dress, leather, hat…"></label>'
    elements.fashionPatternSelector.before(controls)
    controls.querySelector('select').addEventListener('change',event=>{state.patternLibrary.sort=event.target.value;renderFashion()})
    controls.querySelector('input').addEventListener('input',event=>{fashionPatternSearch=event.target.value;renderFashion()})
  }
  controls.hidden=fashion.alterationMode
  controls.querySelector('select').value=state.patternLibrary.sort
  controls.querySelector('input').value=fashionPatternSearch
  controls.querySelectorAll('input,select').forEach(input=>input.disabled=fashion.step!=='plan')
  const patternsOnTable = fashion.alterationMode ? [] : ownedPatternList(state.patternLibrary,{search:fashionPatternSearch})
  const patternCard = (schematic) => {
    return `<button class="fashion-pattern-chip ${fashion.schematic?.id === schematic.id ? 'is-active' : ''} ${schematic.isNew?'is-new':''}" type="button" aria-pressed="${fashion.schematic?.id===schematic.id}" data-fashion-schematic="${schematic.id}" ${fashion.step !== 'plan' ? 'disabled' : ''}>
      <span class="fashion-pattern-thumb" aria-hidden="true">${fashionProductPainting(fashionGarmentDraft({schematic,modifications:[]}),`pattern-card-${schematic.id}`)}</span>
      <span><b>${schematic.name}${schematic.isNew?'<em class="pattern-new-badge">New</em>':''}</b><small>${schematic.slot} · ${schematic.materialUnits} material unit${schematic.materialUnits === 1 ? '' : 's'}</small><small class="pattern-purchase">Retail ${schematic.catalogueValue} ● · tier ${schematic.designTier}</small></span>
    </button>`
  }
  elements.fashionPatternSelector.innerHTML = patternsOnTable.map(patternCard).join('') || `<div class="fashion-pattern-empty">${fashionPatternSearch ? 'No owned patterns match this search.' : 'Your pattern box is empty. Buy a paper pattern from Mara to begin.'}</div>`
  const accentColors = ['#f4d8ad', '#e6b85d', '#b84d45', '#527b70', '#665078', '#eee8d4']
  const moods = ['classic', 'utility', 'romantic', 'bold']
  elements.fashionStyleControls.innerHTML = `<span><small>Accent</small>${accentColors.map((color) => `<button class="fashion-color-dot ${fashion.accentColor === color ? 'is-active' : ''}" type="button" data-fashion-accent="${color}" style="--fashion-accent:${color}" aria-label="Use ${color} accent" ${fashion.step !== 'plan' ? 'disabled' : ''}></button>`).join('')}</span>
    <span class="fashion-mood-row"><small>Design direction</small>${moods.map((mood) => `<button class="${fashion.styleMood === mood ? 'is-active' : ''}" type="button" data-fashion-mood="${mood}" ${fashion.step !== 'plan' ? 'disabled' : ''}>${mood}</button>`).join('')}</span>`
  elements.fashionPatternSelector.querySelectorAll('[data-fashion-schematic]').forEach((button) => {
    button.addEventListener('click', () => {
      if(!state.patternLibrary.owned.includes(button.dataset.fashionSchematic)) return
      fashion.schematic = schematicById(button.dataset.fashionSchematic)
      fashion.modifications = fashion.modifications.filter((id) => {
        return compatibleFashionModifications(fashion.schematic).some(item=>item.id===id)
      })
      if (!compatibleFashionFabric(effectiveSchematic(fashion), fashion.fabric)) fashion.fabric = null
      const guides = fashionGuides(fashion)
      fashion.fabricOffset = { x: SEWING_NEEDLE.x - guides.seam[0].x, y: SEWING_NEEDLE.y - guides.seam[0].y }
      renderFashion()
    })
  })
  elements.fashionStyleControls.querySelectorAll('[data-fashion-accent]').forEach((button) => {
    button.addEventListener('click', () => { fashion.accentColor = button.dataset.fashionAccent; renderFashion() })
  })
  elements.fashionStyleControls.querySelectorAll('[data-fashion-mood]').forEach((button) => {
    button.addEventListener('click', () => { fashion.styleMood = button.dataset.fashionMood; renderFashion() })
  })
  renderFashionModificationBench()
}

function renderFashion() {
  const fashion = state.fashion
  document.querySelector('.fashion-pattern-board').hidden=fashion.step!=='plan' || (!fashion.alterationMode && !state.patternLibrary.owned.includes(fashion.schematic.id))
  minigameSessions.fashion.update(fashion.step)
  const index = fashionSteps.indexOf(fashion.step)
  renderPips(elements.fashionStepPips, fashionSteps, fashion.step)
  elements.fashionStepNumber.textContent = index + 1
  elements.fashionClearButton.hidden = !['cut', 'sew', 'finish'].includes(fashion.step)
  elements.fashionClearButton.textContent = fashion.step==='finish' ? 'Remove last detail' : 'Redo this pass · no extra cost'
  const recipe=constructionRecipe(effectiveSchematic(fashion),fashion.fabric)
  const operation=currentFashionSeam(fashion)

  const copy = {
    plan: fashion.alterationMode
      ? ['Alter', 'Choose up to three alterations. You will unpick, redraft, cut, and resew this wardrobe piece.', 'Start alterations']
      : ['Plan', 'Choose a pattern from the library and cloth from the project panel, then start cutting below. Design options are optional.', 'Start cutting'],
    cut: ['Cut', 'Guide the shears around the dashed pattern. The blades cut where their tip travels.', 'Finish cutting'],
    sew: [operation.hand?'Hand-work':'Sew', `${operation.label} (${(fashion.seamIndex||0)+1}/${recipe.seams.length}). ${fashion.inputMode==='steady'?'Time each section with the marker below the work surface.':operation.hand?'Drag along the entire gold guide to work this join by hand.':'Hold the cloth to feed the machine; steer sideways to keep the guide under the needle.'}`, (fashion.seamIndex||0)<recipe.seams.length-1?'Next assembly pass':'Finish assembly'],
    finish: ['Finish', 'Keep a clean finish or choose a detail and an attachment zone. Matching pairs can use the same detail. No decoration is required.', 'Reveal garment'],
  }[fashion.step]
  elements.fashionVerb.textContent = copy[0]
  elements.fashionInstruction.textContent = copy[1]
  elements.fashionNextButton.textContent = copy[2]
  elements.fashionNextButton.disabled = !fashionCanAdvance()
  let readiness=document.querySelector('#fashionPlanReadiness')
  if(!readiness) {readiness=document.createElement('p');readiness.id='fashionPlanReadiness';readiness.className='fashion-plan-readiness';elements.fashionNextButton.after(readiness)}
  readiness.hidden=fashion.step!=='plan'
  if(fashion.step==='plan') {
    const cost=fashionProjectCost(fashion)
    const anySuitable=state.fashionInventory.fabrics.some(fabric=>compatibleFashionFabric(effectiveSchematic(fashion),fabric))
    const patternStatus=patternAvailability(state.patternLibrary,fashion.schematic,state.fashionInventory.level,state.coins)
    readiness.textContent=!fashion.alterationMode && !patternStatus.owned ? 'Mara sells a few patterns each day. Purchased patterns appear in your box.'
      : state.coins<cost ? `Need ${cost-state.coins} more coins for this project. Kitchen service earns coins.`
      : fashion.alterationMode ? fashion.modifications.length ? `${cost} coins · original cloth preserved.` : 'Choose at least one unlocked alteration.'
        : !anySuitable ? 'No suitable unlocked material for this construction.'
          : !fashion.fabric ? 'Choose a suitable material to begin.'
            : `${cost} coins · ${fashion.schematic.materialUnits} cloth unit${fashion.schematic.materialUnits===1?'':'s'} · ${projectSupplyQuote(fashion).source}.`
  }
  const hasPlanPattern=fashion.alterationMode || state.patternLibrary.owned.includes(fashion.schematic.id)
  elements.garmentName.textContent = fashion.step==='plan' && !hasPlanPattern ? 'Choose an owned pattern' : fashion.schematic.name
  document.querySelector('#fashionSubtitle').textContent='Choose a catalogue construction, suitable materials and your own finish. Work every assembly pass; the painted preview follows the piece into your wardrobe.'
  elements.fashionTaskCopy.textContent = fashion.step === 'plan'
    ? fashion.alterationMode
      ? `${fashion.baseGarment.name} is already constructed. Alteration costs cover notions and studio time; its original cloth is preserved.`
      : `${fashion.schematic.note} This project needs ${fashion.schematic.materialUnits} material unit${fashion.schematic.materialUnits === 1 ? '' : 's'}.`
    : `${recipe.allowance} Complete every join; quality rewards coverage and accuracy, not decoration count.`
  let preview=document.querySelector('#fashionProductPreview')
  if(!preview) {preview=document.createElement('div');preview.id='fashionProductPreview';elements.fashionTaskCopy.after(preview)}
  preview.innerHTML=fashion.step==='plan' && !hasPlanPattern ? '<p class="fashion-empty-preview">Your selected pattern and fabric will be previewed here.</p>' : fashionProductPreview(fashion,'workshop-product')
  renderFashionPlanBoard()
  updateFashionRatings()
  renderFashionTools()
  renderFashionWorkControls()
  layoutFashionWorkspace(elements.fashionActivity,fashion)
  updateFashionContinuation()
  drawFashionCanvas()
  persistProgress()
}

let steadyHandFrame = 0
let steadyHandStartedAt = 0
function renderFashionWorkControls() {
  cancelAnimationFrame(steadyHandFrame)
  let controls=document.querySelector('#fashionWorkControls')
  if (!controls) {
    controls=document.createElement('div')
    controls.id='fashionWorkControls'; controls.className='fashion-work-controls'
    elements.fashionTools.after(controls)
  }
  const fashion=state.fashion
  const working=['cut','sew'].includes(fashion.step)
  controls.innerHTML=`${working ? `<div class="fashion-input-modes" role="group" aria-label="Construction controls"><button type="button" data-fashion-input="pointer" aria-pressed="${fashion.inputMode!=='steady'}">Drag &amp; guide</button><button type="button" data-fashion-input="steady" aria-pressed="${fashion.inputMode==='steady'}">Steady-hand · keyboard</button></div><p class="fashion-pass-progress" role="status" aria-live="polite"></p>${fashion.inputMode==='steady' ? `<div class="fashion-steady-hand"><p>Tap or press Space when the marker is near the center. Eight sections complete this pass; off-center timing affects accuracy.</p><div class="fashion-aim-lane" aria-hidden="true"><span class="fashion-aim-center"></span><i data-fashion-aim></i></div><button class="secondary-button" type="button" data-fashion-work ${fashion.assistSection>=STEADY_HAND_SECTIONS?'disabled':''}>Work next section</button><span class="fashion-work-feedback" role="status">${fashion.assistFeedback || 'Take your time — there is no time limit.'}</span></div>` : '<p>Lift to pause, then continue. Redo only clears the current pass; completed joins and paid materials are safe.</p>'}` : ''}${fashion.materialConsumed && !fashion.completed ? '<details class="fashion-project-options"><summary>Project options</summary><p>Leaving the room keeps this project. Discarding releases the table but does not refund cut material or studio costs.</p><button type="button" data-fashion-discard>Discard unfinished project</button></details>' : ''}`
  controls.querySelectorAll('[data-fashion-input]').forEach(button=>button.addEventListener('click',()=>{
    if(fashion.inputMode===button.dataset.fashionInput) return
    fashion.inputMode=button.dataset.fashionInput
    fashion.assistFeedback='New control mode — this pass restarted.'
    clearFashionLine()
  }))
  const work=controls.querySelector('[data-fashion-work]')
  if(work) {
    work.addEventListener('click',workFashionSection)
    work.addEventListener('keydown',event=>{if(event.key===' '&&event.repeat) event.preventDefault()})
    if(!steadyHandStartedAt) steadyHandStartedAt=performance.now()
    const tick=()=>{
      if(document.body.dataset.worldView==='hub' || state.fashion!==fashion || fashion.inputMode!=='steady' || !['cut','sew'].includes(fashion.step)) return
      const marker=controls.querySelector('[data-fashion-aim]')
      if(marker) marker.style.left=`${50+steadyHandOffset(performance.now()-steadyHandStartedAt)}%`
      steadyHandFrame=requestAnimationFrame(tick)
    }
    steadyHandFrame=requestAnimationFrame(tick)
  }
  controls.querySelector('[data-fashion-discard]')?.addEventListener('click',()=>{
    showResult({kicker:'Unfinished project',hero:'✂',title:'Release the cutting table?',copy:'This discards your unfinished work. Paid material and studio costs will not be refunded.',stats:[],compact:true,
      actions:[{label:'Keep working',className:'primary-button plum-button',action:()=>closeResult({runDismiss:false})},
        {label:'Discard project',className:'secondary-button',action:()=>{closeResult({runDismiss:false});window.sliceAndStitchFashion.cancelProject()}}]})
  })
  updateFashionWorkFeedback()
}

function updateFashionWorkFeedback() {
  const fashion=state.fashion
  if(!['cut','sew'].includes(fashion.step)) return
  const guide=fashion.step==='cut'?fashionGuides(fashion).cut:currentFashionSeam(fashion).points
  const trace=fashion.step==='cut'?fashion.cutTrace:fashion.seamTrace
  const coverage=Math.round(traceCompletion(trace,guide,fashion.step==='cut'?38:32)*100)
  const target=document.querySelector('.fashion-pass-progress')
  if(target) target.textContent=`${fashion.inputMode==='steady'?`${fashion.assistSection}/${STEADY_HAND_SECTIONS} sections · `:''}${coverage}% coverage · ${fashionPassScore(fashion,trace,guide)}% accuracy${fashionCanAdvance()?' · Ready for the next step':fashion.assistSection>=STEADY_HAND_SECTIONS?' · Redo this pass to close the gaps':' · Follow the full guide'}`
  elements.fashionNextButton.disabled=!fashionCanAdvance()
  updateFashionContinuation()
}

function workFashionSection() {
  resumeClockForWork()
  const fashion=state.fashion
  if(fashion.inputMode!=='steady' || !['cut','sew'].includes(fashion.step) || fashion.assistSection>=STEADY_HAND_SECTIONS) return
  const offset=steadyHandOffset(performance.now()-steadyHandStartedAt)
  const guide=fashion.step==='cut'?fashionGuides(fashion).cut:currentFashionSeam(fashion).points
  const points=steadyHandSection(guide,fashion.assistSection,offset)
  const trace=fashion.step==='cut'?fashion.cutTrace:fashion.seamTrace
  trace.push(...points)
  fashion.assistAccuracies.push(steadyHandAccuracy(offset))
  fashion.assistSection++
  fashion.assistFeedback=`Section ${fashion.assistSection}: ${Math.abs(offset)<8?'Beautifully centered':Math.abs(offset)<22?'A little off-center':'Wide of the guide — you can redo this pass'}.`
  if(fashion.step==='sew') {
    const last=points.at(-1)
    fashion.fabricOffset={x:SEWING_NEEDLE.x-last.x,y:SEWING_NEEDLE.y-last.y}
    fashion.machinePhase+=1
  }
  drawFashionCanvas()
  updateFashionWorkFeedback()
  const button=document.querySelector('[data-fashion-work]')
  if(button) button.disabled=fashion.assistSection>=STEADY_HAND_SECTIONS
  const feedback=document.querySelector('.fashion-work-feedback')
  if(feedback) feedback.textContent=fashion.assistFeedback
  persistProgress()
}

function fashionCanAdvance() {
  const fashion = state.fashion
  if(fashion.completing || fashion.startingProject) return false
  if (['cut','sew'].includes(fashion.step) && fashion.inputMode==='steady' && fashion.assistSection<STEADY_HAND_SECTIONS) return false
  if (fashion.step === 'plan') {
    if (fashion.alterationMode) return Boolean(fashion.modifications.length && state.coins >= fashionProjectCost(fashion))
    return Boolean(state.patternLibrary.owned.includes(fashion.schematic.id) && compatibleFashionFabric(effectiveSchematic(fashion),fashion.fabric) && state.coins >= fashionProjectCost(fashion))
  }
  if (fashion.step === 'cut') return traceCompletion(fashion.cutTrace,fashionGuides(fashion).cut,38)>=.82
  if (fashion.step === 'sew') return traceCompletion(fashion.seamTrace,fashionGuides(fashion).seam,32)>=.82
  if (fashion.step === 'finish') return true
  return false
}

function updateFashionRatings() {
  const fashion = state.fashion
  elements.materialRating.textContent = fashion.fabric ? `${fashion.fabric.quality}/100` : '—'
  const trace = fashion.scores.cut || fashion.scores.sew
  elements.precisionRating.textContent = trace ? `${Math.round(((fashion.scores.cut || 0) + (fashion.scores.sew || 0)) / (fashion.scores.sew ? 2 : 1))}/100` : '—'
  const finishScore = fashion.scores.finish || (fashion.step==='finish' ? fashionFinishScore(fashion) : 0)
  elements.finishRating.textContent = finishScore ? `${finishScore}/100` : '—'
  elements.valueRating.textContent = fashion.garment ? `${fashion.garment.value} coins` : 'Pending'
}

function renderFashionTools() {
  const fashion = state.fashion
  const integrated=fashion.step==='plan' && !fashion.alterationMode
  elements.fashionTools.hidden=integrated
  if (fashion.step === 'plan') {
    const clothContainer=integrated ? document.querySelector('#fashionPlannerMaterials') : elements.fashionTools
    const patternOwned=fashion.alterationMode || state.patternLibrary.owned.includes(fashion.schematic.id)
    const clothOnTable = !patternOwned ? [] : fashion.alterationMode ? [fashion.fabric] : state.fashionInventory.fabrics.filter(fabric=>compatibleFashionFabric(effectiveSchematic(fashion),fabric))
    clothContainer.innerHTML = clothOnTable.map((fabric) => {
      const remaining = state.fashionInventory.remaining[fabric.id] || 0
      const compatible = fashion.alterationMode || compatibleFashionFabric(effectiveSchematic(fashion),fabric)
      const quote=fashionSupplyQuote(fabric,fashion.schematic.materialUnits,state.fashionInventory)
      const detail = fashion.alterationMode ? 'Wardrobe piece · cloth already owned' : !compatible ? 'Not suitable for this construction' : `${quote.materialCost} coins per project · ${quote.onShelf?`${remaining} on shelf · 10% off`:'standard supply'}`
      return `<button class="tool-chip ${fashion.fabric?.id === fabric.id ? 'is-active' : ''}" data-fabric="${fabric.id}" type="button" aria-pressed="${fashion.fabric?.id === fabric.id}" ${compatible && !fashion.alterationMode && patternOwned ? '' : 'disabled'}><span class="tool-swatch" style="--chip-color:${fabric.color};--chip-pattern:${fabric.pattern}"></span><span>${fabric.label}<small>${fabric.fiber} · ${detail}</small></span></button>`
    }).join('') + `<p class="fashion-material-note">${!patternOwned ? 'Choose an owned pattern to see its suitable materials.' : 'Suitable cloth only · selected swatch updates your preview. Final quality depends on cloth and craftsmanship.'}</p>`
    clothContainer.querySelectorAll('[data-fabric]').forEach((button) => {
      button.addEventListener('click', () => {
        fashion.fabric = state.fashionInventory.fabrics.find((fabric) => fabric.id === button.dataset.fabric)
        renderFashion()
      })
    })
  } else if (fashion.step === 'cut') {
    elements.fashionTools.innerHTML = '<span class="tool-chip is-active">✂ Working dressmaker shears</span><span class="tool-chip">Keep the blade tip on the pattern</span>'
  } else if (fashion.step === 'sew') {
    const operation=currentFashionSeam(fashion)
    elements.fashionTools.innerHTML = `<span class="tool-chip is-active">${operation.hand?'Hand needle / reinforced join':'Machine feed · guided seam'}</span><span class="tool-chip">${operation.label}</span>`
  } else {
    const offered=compatibleFashionFinishes(effectiveSchematic(fashion),finishes).filter(finish=>finish.unlockLevel<=state.fashionInventory.level)
    if(!offered.some(f=>f.id===fashion.selectedFinish)) fashion.selectedFinish=offered[0]?.id
    elements.fashionTools.innerHTML = offered.map((finish) => (
      `<button class="tool-chip ${fashion.selectedFinish === finish.id ? 'is-active' : ''}" data-finish="${finish.id}" type="button"><span class="topping-icon" style="--chip-color:${finish.color}"></span>${finish.glyph} ${finish.label}</button>`
    )).join('')
    elements.fashionTools.querySelectorAll('[data-finish]').forEach((button) => {
      button.addEventListener('click', () => {
        fashion.selectedFinish = button.dataset.finish
        renderFashionTools()
      })
    })
    const zones=document.createElement('div');zones.className='fashion-finish-zones'
    zones.innerHTML=`<p>Attach selected detail to:</p>${fashionFinishZones(effectiveSchematic(fashion)).map(zone=>`<button type="button" data-fashion-zone="${zone.id}" aria-pressed="${fashion.finishing.some(d=>d.zone===zone.id)}">${zone.label}${fashion.finishing.some(d=>d.zone===zone.id)?' · attached':''}</button>`).join('')}<p>${fashion.finishing.length?'Details stay anchored to the painting in your wardrobe.':'Clean finish selected — no decoration required.'}</p>`
    elements.fashionTools.append(zones)
    zones.querySelectorAll('[data-fashion-zone]').forEach(button=>button.addEventListener('click',()=>attachFashionFinish(button.dataset.fashionZone)))
  }
}

function attachFashionFinish(zoneId) {
  const fashion=state.fashion
  if(fashion.step!=='finish'||!fashion.selectedFinish) return
  const zone=fashionFinishZones(effectiveSchematic(fashion)).find(zone=>zone.id===zoneId)
  if(!zone) return
  fashion.finishing=fashion.finishing.filter(detail=>detail.zone!==zoneId)
  fashion.finishing.push({...zone,type:fashion.selectedFinish,zone:zone.id})
  renderFashion()
}

async function handleFashionNext() {
  const fashion = state.fashion
  if (!fashionCanAdvance()) return
  resumeClockForWork()
  if (fashion.step === 'plan') {
    if (!fashionCanAdvance()) return
    if(coopActive()) {
      fashion.startingProject=true;updateFashionContinuation()
      const result=await roomCommand('start-fashion',{projectId:fashion.projectId,schematicId:fashion.schematic.id,fabricId:fashion.fabric.id,
        modifications:fashion.modifications,baseGarmentId:fashion.alterationMode ? fashion.baseGarment.id : null,materialSavings:state.fashionSetEffects.materialSavings})
      fashion.startingProject=false
      if(!result.ok) {roomWarning(result);renderFashion();return}
      fashion.paidCost=result.paidCost
    } else {
      fashion.paidCost=fashionProjectCost(fashion)
      state.coins -= fashion.paidCost
      const supply=projectSupplyQuote(fashion)
      if (!fashion.alterationMode) state.fashionInventory.remaining[fashion.fabric.id] = Math.max(0,(state.fashionInventory.remaining[fashion.fabric.id] || 0)-supply.stockUsed)
      state.ledger=recordDayActivity(state.ledger,{spent:fashion.paidCost})
    }
    fashion.materialConsumed = true
    if(!fashion.alterationMode) state.patternLibrary=markPatternUsed(state.patternLibrary,fashion.schematic.id)
    persistProgress()
    updateProgress()
    fashion.step = 'cut'
  } else if (fashion.step === 'cut') {
    const guides = fashionGuides(fashion)
    fashion.scores.cut = fashionPassScore(fashion, fashion.cutTrace, guides.cut, Math.max(26, 40 - fashion.schematic.difficulty * 2) + (ownsUpgrade('tailor-shears') ? 6 : 0))
    fashion.step = 'sew'
    fashion.assistSection = 0
    fashion.assistAccuracies = []
    fashion.assistFeedback = 'New join — take your time and aim for the center.'
    fashion.fabricOffset = {
      x: SEWING_NEEDLE.x - guides.seam[0].x,
      y: SEWING_NEEDLE.y - guides.seam[0].y,
    }
    fashion.seamTrace = []
    fashion.machinePhase = 0
    fashion.motionLastAt = 0
  } else if (fashion.step === 'sew') {
    const guides = fashionGuides(fashion)
    const score=fashionPassScore(fashion, fashion.seamTrace, guides.seam, Math.max(22,33-fashion.schematic.difficulty)+(ownsUpgrade('tailor-feed-guide')?5:0))
    fashion.seamScores.push(score)
    const recipe=constructionRecipe(effectiveSchematic(fashion),fashion.fabric)
    if(fashion.seamIndex < recipe.seams.length-1) {
      fashion.seamIndex++
      fashion.assistSection = 0
      fashion.assistAccuracies = []
      fashion.assistFeedback = 'New join — take your time and aim for the center.'
      fashion.seamTrace=[]
      const next=currentFashionSeam(fashion).points[0]
      fashion.fabricOffset={x:SEWING_NEEDLE.x-next.x,y:SEWING_NEEDLE.y-next.y}
      fashion.machinePhase=0
      fashion.motionLastAt=0
    } else {
      fashion.scores.sew=Math.round(fashion.seamScores.reduce((sum,value)=>sum+value,0)/fashion.seamScores.length)
      fashion.step = 'finish'
    }
  } else if (fashion.step === 'finish') {
    await finishFashion()
  }
  renderFashion()
}

async function finishFashion() {
  const fashion = state.fashion
  if (fashion.completed || fashion.completing) return
  const online=coopActive(),oldLevel=state.progression.atelierLevel
  const alterations = (fashion.modifications || []).map((id) => FASHION_MODIFICATIONS.find((item) => item.id === id)).filter(Boolean)
  fashion.scores.finish = Math.round(clamp(fashionFinishScore(fashion)+state.fashionSetEffects.tailoringFinish,0,100))
  const construction = (fashion.scores.cut + fashion.scores.sew) / 2
  const alterationRisk = alterations.reduce((total, item) => total + item.risk, 0)
  const alterationPenalty = alterationRisk * Math.max(0, 82 - construction) / 34 * (ownsUpgrade('tailor-feed-guide') ? .85 : 1)
  const alterationMastery = construction >= 88 ? alterations.length * 1.5 : 0
  const execution = Math.round(clamp((fashion.scores.cut + fashion.scores.sew + fashion.scores.finish) / 3 - alterationPenalty + alterationMastery, 0, 100))
  const luck = Math.round(seededValue(state.coins + state.reputation * 31 + fashion.fabric.cost * 17) * 100)
  const quality = craftQuality({
    execution,
    material: fashion.fabric.quality,
    mastery: 66,
    tools: 62 + (ownsUpgrade('tailor-shears') ? 8 : 0) + (ownsUpgrade('tailor-feed-guide') ? 8 : 0),
    luck,
  })
  const value = garmentValue({
    materialCost: (fashion.paidCost ?? fashionProjectCost(fashion)) + fashion.schematic.baseValue + (fashion.baseGarment?.provenance?.value || fashion.baseGarment?.value || fashion.baseGarment?.price || 0) * .65,
    quality,
    finishing: fashion.scores.finish,
  })
  fashion.garment = {
    ...fashionGarmentDraft(fashion), schematicId: fashion.schematic.id,
    quality,
    value,
    bonus: presentationBonus(quality),
  }
  if(online) {
    fashion.completing=true;updateFashionContinuation()
    const result=await roomCommand('complete-fashion',{projectId:fashion.projectId,garment:fashion.garment,accuracy:Math.round(construction)})
    fashion.completing=false
    if(!result.ok) {roomWarning(result);renderFashion();return}
  }
  if (!minigameSessions.fashion.complete({
    garment: fashion.garment,
    scores: fashion.scores,
  })) return
  fashion.completed = true
  if(!online) state.ledger=recordDayActivity(state.ledger,{garments:1})
  const constructionAccuracy = Math.round(construction)
  const atelierAdvanced = online ? state.progression.atelierLevel>oldLevel : applyProgression(recordGarmentResult(state.progression, { accuracy: constructionAccuracy, quality }))
  updateFashionRatings()

  showResult({
    kicker: 'Garment complete',
    hero: '✂',
    title: fashion.garment.name,
    copy: `A one-off ${fashion.garment.cut} in ${fashion.fabric.fiber.toLowerCase()}, appraised at ${value} coins (display value, not a cash reward). ${alterations.length ? `${alterations.map((item) => item.label.toLowerCase()).join(', ')} are preserved on the piece. ` : ''}${fashion.finishing.length?'Your placed details stay attached to the painted garment.':'A deliberate clean finish — no unnecessary decorations.'}${atelierAdvanced ? ` Atelier level ${state.progression.atelierLevel} unlocked.` : ''}`,
    stats: [
      ['Cut', `${fashion.scores.cut}`],
      ['Seam', `${fashion.scores.sew}`],
      ['Construction', `${constructionAccuracy}%`],
      ['Finish', `${fashion.scores.finish}`],
      ['Quality', `${quality}`],
    ],
    actions: [
      {
        label: 'Wear it & open wardrobe',
        className: 'primary-button plum-button',
        action: () => {
          state.outfit = fashion.garment
          updateProgress()
          closeResult({ runDismiss: false })
          openCompletedFashionWardrobe(fashion, true)
        },
      },
      {label:'Keep in chest', className:'secondary-button', action:()=>{
        closeResult({runDismiss:false})
        openCompletedFashionWardrobe(fashion, false)
      }},
      {
        label: 'Make another',
        className: 'secondary-button',
        action: () => {
          closeResult({ runDismiss: false })
          state.fashion = freshFashion()
          beginFashionSession(state.fashion)
          renderFashion()
        },
      },
    ],
    onDismiss: () => {
      state.fashion = freshFashion()
      beginFashionSession(state.fashion)
      renderFashion()
    },
  })
  elements.resultHero.innerHTML = fashionProductPainting(fashion.garment,'completed-garment')
  elements.resultHero.classList.add('is-garment')
}

function openCompletedFashionWardrobe(fashion, wear) {
  state.fashion = freshFashion()
  beginFashionSession(state.fashion)
  renderFashion()
  document.dispatchEvent(new CustomEvent('slice-and-stitch:fashion-wardrobe', {
    detail:{projectId:fashion.projectId, wear},
  }))
}

function highResolutionFabricTile(fabric) {
  if (!imageReady(materialArt.fabrics) || !fabric) return null
  if (fabricPatternCache.has(fabric.id)) return fabricPatternCache.get(fabric.id)

  const column = fabrics.findIndex((item) => item.id === fabric.id)
  if (column < 0 || column > 2) return null
  const sourceSize = Math.floor(materialArt.fabrics.naturalWidth / 3)
  const sourceY = Math.max(0, Math.floor((materialArt.fabrics.naturalHeight - sourceSize) / 2))
  const tile = document.createElement('canvas')
  tile.width = sourceSize * 2
  tile.height = sourceSize * 2
  const tileContext = tile.getContext('2d')
  tileContext.imageSmoothingEnabled = true
  tileContext.imageSmoothingQuality = 'high'

  const drawQuarter = (x, y, flipX, flipY) => {
    tileContext.save()
    tileContext.translate(x + (flipX ? sourceSize : 0), y + (flipY ? sourceSize : 0))
    tileContext.scale(flipX ? -1 : 1, flipY ? -1 : 1)
    tileContext.drawImage(
      materialArt.fabrics,
      column * sourceSize,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      sourceSize,
      sourceSize,
    )
    tileContext.restore()
  }
  drawQuarter(0, 0, false, false)
  drawQuarter(sourceSize, 0, true, false)
  drawQuarter(0, sourceSize, false, true)
  drawQuarter(sourceSize, sourceSize, true, true)
  fabricPatternCache.set(fabric.id, tile)
  return tile
}

function proceduralFabricTile(fabric) {
  if (!fabric) return null
  if (proceduralFabricCache.has(fabric.id)) return proceduralFabricCache.get(fabric.id)
  const tile = document.createElement('canvas')
  tile.width = 256
  tile.height = 256
  const brush = tile.getContext('2d')
  brush.fillStyle = fabric.color
  brush.fillRect(0, 0, 256, 256)

  const strokeLine = (x1, y1, x2, y2, color, width = 1) => {
    brush.strokeStyle = color
    brush.lineWidth = width
    brush.beginPath()
    brush.moveTo(x1, y1)
    brush.lineTo(x2, y2)
    brush.stroke()
  }
  const light = 'rgba(255,248,221,.19)'
  const dark = 'rgba(37,26,33,.16)'
  if (fabric.patternKey === 'slub') {
    for (let y = 2; y < 256; y += 7) {
      strokeLine(0, y, 256, y + (y % 13 === 0 ? 2 : 0), y % 21 === 0 ? light : 'rgba(255,248,221,.09)', y % 21 === 0 ? 2 : 1)
    }
    for (let x = 5; x < 256; x += 11) strokeLine(x, 0, x + 4, 256, 'rgba(46,37,34,.08)')
  } else if (fabric.patternKey === 'weave') {
    for (let value = -256; value < 512; value += 8) {
      strokeLine(value, 0, value - 256, 256, light, 2)
      strokeLine(value, 0, value + 256, 256, dark, 1.4)
    }
  } else if (fabric.patternKey === 'cord') {
    for (let x = 0; x < 256; x += 14) {
      strokeLine(x, 0, x, 256, 'rgba(255,246,205,.22)', 5)
      strokeLine(x + 5, 0, x + 5, 256, 'rgba(52,37,31,.2)', 3)
    }
  } else if (fabric.patternKey === 'pinstripe') {
    for (let x = 7; x < 256; x += 24) strokeLine(x, 0, x, 256, 'rgba(238,221,183,.32)', 2)
    for (let y = 0; y < 256; y += 5) strokeLine(0, y, 256, y + 1, 'rgba(255,255,255,.05)')
  } else if (fabric.patternKey === 'floral') {
    for (let row = 0; row < 4; row += 1) {
      for (let column = 0; column < 4; column += 1) {
        const x = 30 + column * 68 + (row % 2) * 17
        const y = 28 + row * 68
        brush.strokeStyle = 'rgba(58,83,62,.48)'
        brush.lineWidth = 3
        brush.beginPath(); brush.moveTo(x, y + 17); brush.quadraticCurveTo(x + 8, y + 5, x + 2, y - 15); brush.stroke()
        ;['#e7b26f', '#d9847c', '#f1d2af'].forEach((color, petal) => {
          brush.fillStyle = color
          brush.beginPath()
          brush.ellipse(x + Math.cos(petal * 2.1) * 8, y + Math.sin(petal * 2.1) * 7, 6, 3.5, petal * 2.1, 0, Math.PI * 2)
          brush.fill()
        })
        brush.fillStyle = '#e6c767'; brush.beginPath(); brush.arc(x, y, 3.5, 0, Math.PI * 2); brush.fill()
      }
    }
  } else if (fabric.patternKey === 'leather') {
    const hideGlow = brush.createRadialGradient(78, 54, 8, 112, 96, 210)
    hideGlow.addColorStop(0, 'rgba(255,224,180,.2)')
    hideGlow.addColorStop(.55, 'rgba(255,224,180,.03)')
    hideGlow.addColorStop(1, 'rgba(24,14,13,.2)')
    brush.fillStyle = hideGlow; brush.fillRect(0, 0, 256, 256)
    for (let index = 0; index < 110; index += 1) {
      const x = seededValue(index * 31 + fabric.id.length) * 256
      const y = seededValue(index * 47 + 9) * 256
      const length = 3 + seededValue(index * 71) * 11
      brush.strokeStyle = index % 3 ? 'rgba(29,16,14,.12)' : 'rgba(255,228,190,.1)'
      brush.lineWidth = .7 + seededValue(index * 13) * 1.2
      brush.beginPath(); brush.moveTo(x - length, y); brush.quadraticCurveTo(x, y - 3, x + length, y + 1); brush.stroke()
    }
  } else if (fabric.patternKey === 'suede' || fabric.patternKey === 'velvet') {
    for (let index = 0; index < 700; index += 1) {
      const x = seededValue(index * 23 + fabric.id.length) * 256
      const y = seededValue(index * 61 + 4) * 256
      brush.fillStyle = index % 3 ? 'rgba(255,246,218,.055)' : 'rgba(28,18,25,.075)'
      brush.beginPath(); brush.ellipse(x, y, fabric.patternKey === 'velvet' ? 1.6 : 1.1, .45, -.45, 0, Math.PI * 2); brush.fill()
    }
    if (fabric.patternKey === 'velvet') {
      const nap = brush.createLinearGradient(0, 0, 256, 180)
      nap.addColorStop(0, 'rgba(255,255,255,.17)'); nap.addColorStop(.44, 'rgba(255,255,255,0)'); nap.addColorStop(1, 'rgba(20,10,20,.18)')
      brush.fillStyle = nap; brush.fillRect(0, 0, 256, 256)
    }
  } else if (fabric.patternKey === 'satin' || fabric.patternKey === 'sheer') {
    const shine = brush.createLinearGradient(0, 256, 256, 0)
    shine.addColorStop(0, 'rgba(28,20,28,.16)')
    shine.addColorStop(.28, 'rgba(255,255,255,.04)')
    shine.addColorStop(.48, fabric.patternKey === 'satin' ? 'rgba(255,255,255,.32)' : 'rgba(255,255,255,.18)')
    shine.addColorStop(.63, 'rgba(255,255,255,.02)')
    shine.addColorStop(1, 'rgba(28,20,28,.12)')
    brush.fillStyle = shine; brush.fillRect(0, 0, 256, 256)
    const spacing = fabric.patternKey === 'sheer' ? 5 : 3
    for (let x = 0; x < 256; x += spacing) strokeLine(x, 0, x, 256, 'rgba(255,255,255,.07)', 1)
    if (fabric.patternKey === 'sheer') for (let y = 0; y < 256; y += spacing) strokeLine(0, y, 256, y, 'rgba(29,20,28,.06)', 1)
  } else if (fabric.patternKey === 'brocade' || fabric.patternKey === 'lace') {
    for (let row = -1; row < 6; row += 1) {
      for (let column = -1; column < 6; column += 1) {
        const x = column * 54 + (row % 2) * 27
        const y = row * 52
        brush.strokeStyle = fabric.patternKey === 'brocade' ? 'rgba(244,213,128,.34)' : 'rgba(255,241,220,.34)'
        brush.lineWidth = fabric.patternKey === 'brocade' ? 3 : 2
        brush.beginPath(); brush.moveTo(x, y + 24); brush.bezierCurveTo(x - 20, y + 2, x + 20, y + 2, x, y + 24); brush.bezierCurveTo(x - 18, y + 46, x + 18, y + 46, x, y + 24); brush.stroke()
        if (fabric.patternKey === 'lace') { brush.fillStyle = 'rgba(41,25,38,.14)'; brush.beginPath(); brush.arc(x, y + 24, 6, 0, Math.PI * 2); brush.fill() }
      }
    }
  } else if (fabric.patternKey === 'tweed' || fabric.patternKey === 'jersey' || fabric.patternKey === 'check') {
    const spacing = fabric.patternKey === 'check' ? 32 : fabric.patternKey === 'tweed' ? 7 : 10
    for (let x = 0; x < 256; x += spacing) strokeLine(x, 0, x + (fabric.patternKey === 'tweed' ? 8 : 0), 256, x % (spacing * 3) === 0 ? 'rgba(255,226,170,.22)' : dark, fabric.patternKey === 'check' ? 3 : 1.5)
    for (let y = 0; y < 256; y += spacing) strokeLine(0, y, 256, y + (fabric.patternKey === 'tweed' ? 4 : 0), y % (spacing * 3) === 0 ? 'rgba(255,226,170,.18)' : light, fabric.patternKey === 'check' ? 3 : 1.5)
  } else if (fabric.patternKey === 'herringbone') {
    for (let y = -24; y < 280; y += 24) {
      for (let x = -24; x < 280; x += 48) {
        strokeLine(x, y, x + 24, y + 18, light, 3)
        strokeLine(x + 24, y + 18, x + 48, y, dark, 3)
      }
    }
  } else {
    for (let y = 0; y < 256; y += 5) strokeLine(0, y, 256, y + 2, 'rgba(255,255,255,.055)')
    for (let index = 0; index < 85; index += 1) {
      const x = seededValue(index * 17 + fabric.id.length) * 256
      const y = seededValue(index * 29 + fabric.id.length * 3) * 256
      brush.fillStyle = index % 2 ? 'rgba(255,248,224,.11)' : 'rgba(45,28,35,.08)'
      brush.beginPath(); brush.arc(x, y, 0.8 + seededValue(index + 3) * 1.4, 0, Math.PI * 2); brush.fill()
    }
  }
  const vignette = brush.createLinearGradient(0, 0, 256, 256)
  vignette.addColorStop(0, 'rgba(255,255,255,.09)')
  vignette.addColorStop(.5, 'rgba(255,255,255,0)')
  vignette.addColorStop(1, 'rgba(35,24,31,.08)')
  brush.fillStyle = vignette
  brush.fillRect(0, 0, 256, 256)
  proceduralFabricCache.set(fabric.id, tile)
  return tile
}

function fabricPattern(context, fabric) {
  const fabricIndex = fabrics.findIndex((item) => item.id === fabric?.id)
  if (imageReady(materialArt.fabrics) && fabricIndex >= 0 && fabricIndex <= 2) {
    const tile = highResolutionFabricTile(fabric)
    const pattern = tile ? context.createPattern(tile, 'repeat') : null
    if (pattern) {
      if (pattern.setTransform) pattern.setTransform(new DOMMatrix().scale(0.5))
      context.fillStyle = pattern
      context.fillRect(0, 0, 600, 600)
      context.fillStyle = 'rgba(255, 244, 214, .035)'
      context.fillRect(0, 0, 600, 600)
      return
    }
  }

  const proceduralTile = proceduralFabricTile(fabric)
  const proceduralPattern = proceduralTile ? context.createPattern(proceduralTile, 'repeat') : null
  if (proceduralPattern) {
    if (proceduralPattern.setTransform) proceduralPattern.setTransform(new DOMMatrix().scale(.55))
    context.fillStyle = proceduralPattern
    context.fillRect(0, 0, 600, 600)
  } else {
    context.fillStyle = fabric?.color || '#b8a98d'
    context.fillRect(0, 0, 600, 600)
  }
}

function drawGuide(context, guide, color = '#fff8df') {
  context.strokeStyle = 'rgba(57, 39, 43, .72)'
  context.lineWidth = 9
  context.setLineDash([13, 10])
  context.beginPath()
  context.moveTo(guide[0].x, guide[0].y)
  guide.slice(1).forEach((point) => context.lineTo(point.x, point.y))
  context.stroke()
  context.strokeStyle = color
  context.lineWidth = 5.5
  context.setLineDash([13, 10])
  context.beginPath()
  context.moveTo(guide[0].x, guide[0].y)
  guide.slice(1).forEach((point) => context.lineTo(point.x, point.y))
  context.stroke()
  context.setLineDash([])
  context.fillStyle = '#f6c968'
  context.beginPath()
  context.arc(guide[0].x, guide[0].y, 11, 0, Math.PI * 2)
  context.fill()
  context.strokeStyle = '#5b3b35'
  context.lineWidth = 3
  context.stroke()
}

function drawPlayerTrace(context, points, color, kind = 'chalk') {
  if (!points.length) return
  context.strokeStyle = 'rgba(255, 244, 209, .72)'
  context.lineWidth = 12
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.beginPath()
  context.moveTo(points[0].x, points[0].y)
  points.slice(1).forEach((point) => context.lineTo(point.x, point.y))
  context.stroke()
  context.strokeStyle = color
  context.lineWidth = 6
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.beginPath()
  context.moveTo(points[0].x, points[0].y)
  points.slice(1).forEach((point) => context.lineTo(point.x, point.y))
  context.stroke()

  if (kind === 'thread') {
    context.strokeStyle = 'rgba(255, 236, 180, .92)'
    context.lineWidth = 2
    context.setLineDash([4, 7])
    context.beginPath()
    context.moveTo(points[0].x, points[0].y)
    points.slice(1).forEach((point) => context.lineTo(point.x, point.y))
    context.stroke()
    context.setLineDash([])
  }
}

function drawCutSeam(context, points) {
  if (points.length < 2) return
  context.save()
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.strokeStyle = 'rgba(41, 25, 29, .62)'
  context.lineWidth = 2.4
  context.shadowColor = 'rgba(24, 15, 18, .42)'
  context.shadowBlur = 3
  context.beginPath()
  context.moveTo(points[0].x, points[0].y)
  points.slice(1).forEach((point) => context.lineTo(point.x, point.y))
  context.stroke()

  context.shadowBlur = 0
  context.strokeStyle = 'rgba(255, 238, 199, .7)'
  context.lineWidth = 1.2
  context.setLineDash([3, 7])
  context.beginPath()
  context.moveTo(points[0].x - 4, points[0].y)
  points.slice(1).forEach((point) => context.lineTo(point.x - 4, point.y))
  context.stroke()
  context.beginPath()
  context.moveTo(points[0].x + 4, points[0].y)
  points.slice(1).forEach((point) => context.lineTo(point.x + 4, point.y))
  context.stroke()
  context.restore()
}

function tracePolyline(context, points) {
  if (!points.length) return
  context.beginPath()
  context.moveTo(points[0].x, points[0].y)
  points.slice(1).forEach((point) => context.lineTo(point.x, point.y))
}

function tracePatternShape(context, fashion = state.fashion) {
  const guide = fashionGuides(fashion).cut
  context.beginPath()
  context.moveTo(guide[0].x, guide[0].y)
  guide.slice(1).forEach((point) => context.lineTo(point.x, point.y))
  context.closePath()
}

function drawCutFabricPanel(context, fashion) {
  prepareCanvas(fashionCutCanvas, fashionCutContext)
  fashionCutContext.save()
  fashionCutContext.beginPath()
  fashionCutContext.roundRect(94, 94, 412, 430, 22)
  fashionCutContext.clip()
  fabricPattern(fashionCutContext, fashion.fabric)
  fashionCutContext.fillStyle = 'rgba(49,34,42,.08)'
  fashionCutContext.fillRect(94, 94, 412, 430)
  fashionCutContext.restore()

  if (fashion.cutTrace.length > 1) {
    fashionCutContext.save()
    fashionCutContext.globalCompositeOperation = 'destination-out'
    fashionCutContext.lineCap = 'round'
    fashionCutContext.lineJoin = 'round'
    fashionCutContext.strokeStyle = '#000'
    fashionCutContext.lineWidth = 7
    tracePolyline(fashionCutContext, fashion.cutTrace)
    fashionCutContext.stroke()
    fashionCutContext.restore()
  }

  context.drawImage(fashionCutCanvas, 0, 0, LOGICAL_CANVAS_SIZE, LOGICAL_CANVAS_SIZE)
  const lift = smoothstep(clamp((fashion.cutDistance - 520) / 260, 0, 1))
  if (lift <= 0) return lift

  context.save()
  context.translate(2.5 * lift, -5 * lift)
  tracePatternShape(context, fashion)
  context.clip()
  context.shadowColor = `rgba(42, 24, 31, ${0.34 * lift})`
  context.shadowBlur = 12 * lift
  context.shadowOffsetY = 8 * lift
  fabricPattern(context, fashion.fabric)
  context.fillStyle = 'rgba(255, 246, 218, .04)'
  context.fillRect(140, 100, 320, 430)
  context.restore()
  return lift
}

function drawCuttingShears(context, fashion) {
  const points = fashion.cutTrace
  if (!points.length || !imageReady(materialArt.shears)) return
  const tip = points.at(-1)
  const angle = fashion.shearAngle
  const frame = Math.floor(fashion.cutDistance / 34) % 2
  const sourceWidth = materialArt.shears.naturalWidth / 2
  const sourceHeight = materialArt.shears.naturalHeight
  const size = 124
  context.save()
  context.translate(tip.x - Math.cos(angle) * 53, tip.y - Math.sin(angle) * 53)
  context.rotate(angle)
  context.scale(1, frame ? 0.96 : 1.03)
  context.shadowColor = 'rgba(52, 31, 28, .35)'
  context.shadowBlur = 8
  context.shadowOffsetY = 5
  context.drawImage(
    materialArt.shears,
    frame * sourceWidth,
    0,
    sourceWidth,
    sourceHeight,
    -size / 2,
    -size / 2,
    size,
    size,
  )
  context.restore()

  if (fashion.dragging && fashion.cutDistance > 8) {
    context.save()
    context.strokeStyle = 'rgba(255, 231, 181, .55)'
    context.lineWidth = 1.5
    for (let index = 0; index < 2; index += 1) {
      const spread = (seededValue(Math.floor(fashion.cutDistance) + index * 19) - 0.5) * 14
      context.beginPath()
      context.moveTo(tip.x, tip.y)
      context.lineTo(
        tip.x - Math.cos(angle) * (8 + index * 2) + Math.cos(angle + Math.PI / 2) * spread,
        tip.y - Math.sin(angle) * (8 + index * 2) + Math.sin(angle + Math.PI / 2) * spread,
      )
      context.stroke()
    }
    context.restore()
  }
}

function drawSewingMachineBody(context, fashion) {
  if (!imageReady(materialArt.sewingMachine)) return
  context.save()
  context.shadowColor = 'rgba(55, 33, 38, .3)'
  context.shadowBlur = 14
  context.shadowOffsetY = 8
  context.drawImage(materialArt.sewingMachine, 230, 4, 330, 330)
  context.restore()

  context.save()
  context.translate(508, 117)
  context.rotate(fashion.machinePhase * 0.18)
  context.strokeStyle = 'rgba(88, 51, 56, .58)'
  context.lineWidth = 2
  for (let spoke = 0; spoke < 4; spoke += 1) {
    context.rotate(Math.PI / 2)
    context.beginPath()
    context.moveTo(6, 0)
    context.lineTo(17, 0)
    context.stroke()
  }
  context.restore()
}

function drawSewingFabric(context, fashion, frontPass = false) {
  context.save()
  if (frontPass) {
    context.beginPath()
    context.moveTo(SEWING_NEEDLE.x - 35, SEWING_NEEDLE.y - 11)
    context.lineTo(SEWING_NEEDLE.x + 35, SEWING_NEEDLE.y - 11)
    context.lineTo(373, 320)
    context.lineTo(482, 600)
    context.lineTo(118, 600)
    context.lineTo(247, 320)
    context.closePath()
    context.clip()
  }
  context.translate(fashion.fabricOffset.x, fashion.fabricOffset.y)
  drawGarment(context, fashion)
  drawGuide(context, fashionGuides(fashion).seam, '#ffe585')
  drawPlayerTrace(context, fashion.seamTrace, '#51354a', 'thread')
  context.restore()
}

function drawSewingNeedleAssembly(context, fashion) {
  if (!imageReady(materialArt.sewingMachine)) return
  const sourceX = 188
  const sourceY = 620
  const sourceWidth = 260
  const sourceHeight = 330
  const scale = 330 / materialArt.sewingMachine.naturalWidth
  context.drawImage(
    materialArt.sewingMachine,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    230 + sourceX * scale,
    4 + sourceY * scale,
    sourceWidth * scale,
    sourceHeight * scale,
  )

  const needleBob = fashion.dragging ? (Math.sin(fashion.machinePhase) * 0.5 + 0.5) * 9 : 2
  context.strokeStyle = '#4f4140'
  context.lineWidth = 2.5
  context.beginPath()
  context.moveTo(SEWING_NEEDLE.x, SEWING_NEEDLE.y - 39)
  context.lineTo(SEWING_NEEDLE.x, SEWING_NEEDLE.y - 5 + needleBob)
  context.stroke()
  context.fillStyle = '#f5cb6a'
  context.beginPath()
  context.arc(SEWING_NEEDLE.x, SEWING_NEEDLE.y - 3 + needleBob, 3, 0, Math.PI * 2)
  context.fill()

  context.save()
  context.strokeStyle = 'rgba(70, 47, 49, .32)'
  context.lineWidth = 1.5
  for (let index = -1; index <= 1; index += 1) {
    const shift = ((fashion.machinePhase * 4 + index * 13) % 19) - 9
    context.beginPath()
    context.moveTo(SEWING_NEEDLE.x - 20 + shift, SEWING_NEEDLE.y + 12)
    context.lineTo(SEWING_NEEDLE.x - 10 + shift, SEWING_NEEDLE.y + 12)
    context.stroke()
  }
  if (fashion.dragging) {
    context.strokeStyle = 'rgba(68, 43, 48, .2)'
    context.lineWidth = 2
    context.beginPath()
    context.moveTo(SEWING_NEEDLE.x - 4, SEWING_NEEDLE.y + 4)
    context.quadraticCurveTo(SEWING_NEEDLE.x - 30, SEWING_NEEDLE.y + 18, SEWING_NEEDLE.x - 50, SEWING_NEEDLE.y + 10)
    context.moveTo(SEWING_NEEDLE.x + 5, SEWING_NEEDLE.y + 4)
    context.quadraticCurveTo(SEWING_NEEDLE.x + 29, SEWING_NEEDLE.y + 17, SEWING_NEEDLE.x + 47, SEWING_NEEDLE.y + 9)
    context.stroke()
  }
  context.restore()
}

function drawGarment(context, fashion, finishing = []) {
  const fabric = fashion.fabric
  const silhouette = fashion.schematic?.silhouette || 'apron'
  context.save()
  context.shadowColor = 'rgba(49, 28, 31, .32)'
  context.shadowBlur = 20
  context.shadowOffsetY = 12
  context.fillStyle = 'rgba(68, 42, 46, .28)'
  tracePatternShape(context, fashion)
  context.fill()
  context.restore()

  context.save()
  tracePatternShape(context, fashion)
  context.clip()
  fabricPattern(context, fabric)
  context.restore()

  context.strokeStyle = '#4e3540'
  context.lineWidth = 7
  context.lineJoin = 'round'
  tracePatternShape(context, fashion)
  context.stroke()

  const sheen = context.createLinearGradient(180, 160, 430, 500)
  sheen.addColorStop(0, 'rgba(255,255,255,.22)')
  sheen.addColorStop(0.42, 'rgba(255,255,255,0)')
  sheen.addColorStop(1, 'rgba(34,24,35,.16)')
  context.save()
  tracePatternShape(context, fashion)
  context.clip()
  context.fillStyle = sheen
  context.fillRect(150, 120, 300, 440)
  context.strokeStyle = fashion.accentColor || '#f6e7c3'
  context.lineWidth = 5
  context.setLineDash([4, 7])
  context.beginPath()
  context.moveTo(210, 470)
  context.quadraticCurveTo(300, 488, 390, 470)
  context.stroke()
  context.setLineDash([])
  context.restore()

  if (silhouette === 'apron') {
    context.strokeStyle = fashion.accentColor || '#f6e7c3'
    context.lineWidth = 10
    context.beginPath()
    context.moveTo(235, 148)
    context.quadraticCurveTo(205, 95, 174, 142)
    context.moveTo(365, 148)
    context.quadraticCurveTo(395, 95, 426, 142)
    context.stroke()
  } else if (['shirt', 'knitwear', 'jacket', 'coat'].includes(silhouette)) {
    context.strokeStyle = fashion.accentColor || '#f6e7c3'
    context.lineWidth = 6
    context.beginPath()
    context.moveTo(260, 128)
    context.quadraticCurveTo(300, 190, 340, 128)
    if(silhouette!=='knitwear') {
      context.moveTo(300, 185)
      context.lineTo(300, 492)
    }
    context.stroke()
  } else if (['trousers','shorts'].includes(silhouette)) {
    context.strokeStyle = fashion.accentColor || '#f6e7c3'
    context.lineWidth = 5
    context.beginPath()
    context.moveTo(218, 165)
    context.lineTo(382, 165)
    context.moveTo(300, 300)
    context.lineTo(300, 480)
    context.stroke()
  } else if (silhouette === 'skirt') {
    context.strokeStyle = fashion.accentColor || '#f6e7c3'
    context.lineWidth = 5
    for (let x = 235; x <= 365; x += 32) {
      context.beginPath()
      context.moveTo(x, 165)
      context.lineTo(300 + (x - 300) * 1.45, 480)
      context.stroke()
    }
  }

  drawGarmentModifications(context, fashion)
  finishing.filter(detail=>Number.isFinite(detail.x)&&Number.isFinite(detail.y)).forEach((detail, index) => drawFinish(context, detail, index, fabric))
}

function drawGarmentModifications(context, fashion) {
  const alterations = (fashion.modifications || []).map((id) => FASHION_MODIFICATIONS.find((item) => item.id === id)).filter(Boolean)
  if (!alterations.length) return
  context.save()
  tracePatternShape(context, fashion)
  context.clip()
  alterations.forEach((alteration, alterationIndex) => {
    const accent = alteration.id === 'overdye' ? 'rgba(87,56,104,.25)' : (fashion.accentColor || '#f2d49b')
    context.strokeStyle = accent
    context.fillStyle = accent
    context.lineJoin = 'round'
    context.lineCap = 'round'
    if (alteration.visual === 'pockets') {
      ;[-1, 1].forEach((side) => {
        context.lineWidth = 4
        context.beginPath()
        context.roundRect(300 + side * 72 - 28, 334, 56, 62, 7)
        context.fillStyle = 'rgba(255,246,221,.16)'
        context.fill(); context.stroke()
        context.setLineDash([3, 5]); context.strokeRect(300 + side * 72 - 22, 342, 44, 47); context.setLineDash([])
      })
    } else if (alteration.visual === 'buttons' || alteration.visual === 'hardware') {
      const hardware = alteration.visual === 'hardware'
      for (let index = 0; index < (hardware ? 3 : 5); index += 1) {
        const x = hardware ? 245 + index * 55 : 300
        const y = hardware ? 410 : 220 + index * 48
        context.fillStyle = hardware ? '#c99745' : accent
        context.strokeStyle = '#64472e'; context.lineWidth = 3
        context.beginPath(); context.arc(x, y, hardware ? 9 : 8, 0, Math.PI * 2); context.fill(); context.stroke()
        context.fillStyle = 'rgba(255,248,204,.7)'; context.beginPath(); context.arc(x - 2, y - 2, 2, 0, Math.PI * 2); context.fill()
      }
    } else if (['binding', 'piping', 'topstitch'].includes(alteration.visual)) {
      context.lineWidth = alteration.visual === 'binding' ? 8 : alteration.visual === 'piping' ? 5 : 3
      context.setLineDash(alteration.visual === 'topstitch' ? [6, 7] : [])
      tracePatternShape(context, fashion); context.stroke()
      context.setLineDash([])
    } else if (alteration.visual === 'cuffs') {
      context.lineWidth = 13
      context.beginPath(); context.moveTo(143, 244); context.lineTo(191, 281); context.moveTo(457, 244); context.lineTo(409, 281); context.stroke()
    } else if (alteration.visual === 'dye') {
      const wash = context.createRadialGradient(315, 250, 20, 300, 320, 260)
      wash.addColorStop(0, 'rgba(127,78,132,.34)'); wash.addColorStop(.65, 'rgba(79,55,103,.18)'); wash.addColorStop(1, 'rgba(49,37,72,.3)')
      context.fillStyle = wash; context.fillRect(90, 85, 420, 455)
    } else if (alteration.visual === 'monogram') {
      context.font = 'bold italic 38px Georgia'; context.textAlign = 'center'; context.fillText('M', 350, 290)
    } else if (alteration.visual === 'embroidery' || alteration.visual === 'goldwork') {
      context.strokeStyle = alteration.visual === 'goldwork' ? '#d9a83e' : '#e3c06e'; context.lineWidth = alteration.visual === 'goldwork' ? 5 : 4
      context.beginPath(); context.moveTo(226, 360); context.bezierCurveTo(266, 300, 330, 414, 380, 332); context.stroke()
      for (let index = 0; index < 6; index += 1) {
        const x = 235 + index * 28; const y = 350 + Math.sin(index * 1.7) * 25
        context.beginPath(); context.ellipse(x, y, 9, 4, index * .45, 0, Math.PI * 2); context.fill()
      }
    } else if (alteration.visual === 'lace') {
      context.fillStyle = 'rgba(255,244,224,.42)'; context.fillRect(266, 160, 68, 330)
      context.strokeStyle = 'rgba(102,67,89,.5)'; context.lineWidth = 2
      for (let y = 170; y < 490; y += 18) { context.beginPath(); context.arc(300, y, 11, 0, Math.PI * 2); context.stroke() }
    } else if (alteration.visual === 'panel') {
      context.fillStyle = `${fashion.accentColor || '#d5a65f'}99`
      context.beginPath(); context.moveTo(300, 160); context.lineTo(382, 500); context.lineTo(300, 466); context.lineTo(218, 500); context.closePath(); context.fill()
    } else if (alteration.visual === 'distress') {
      context.strokeStyle = 'rgba(255,238,205,.62)'; context.lineWidth = 3
      for (let index = 0; index < 7; index += 1) { const y = 315 + index * 19; context.beginPath(); context.moveTo(230 + index % 2 * 45, y); context.lineTo(278 + index % 2 * 45, y - 7); context.stroke() }
    } else if (alteration.visual === 'beading') {
      for (let index = 0; index < 22; index += 1) {
        const angle = index / 22 * Math.PI * 2
        context.fillStyle = index % 3 ? '#f3dca5' : '#d8eef0'; context.beginPath(); context.arc(300 + Math.cos(angle) * 74, 295 + Math.sin(angle) * 54, 4, 0, Math.PI * 2); context.fill()
      }
    } else if (alteration.visual === 'lining') {
      context.strokeStyle = '#c8919e'; context.lineWidth = 12; tracePatternShape(context, fashion); context.stroke()
    }
    if (alterationIndex > 2) return
  })
  context.restore()
}

function drawFinish(context, detail, index = 0, fabric = null) {
  if (imageReady(materialArt.notions) && ['button', 'pocket', 'flower'].includes(detail.type)) {
    if (detail.type === 'button') {
      drawAtlasSprite(context, materialArt.notions, {
        column: index % 4,
        row: 0,
        columns: 4,
        rows: 2,
        x: detail.x,
        y: detail.y,
        width: 44,
      })
      return
    }
    if (detail.type === 'pocket') {
      const fabricColumn = Math.max(0, fabrics.findIndex((item) => item.id === fabric?.id))
      drawAtlasSprite(context, materialArt.notions, {
        column: Math.min(2, fabricColumn),
        row: 1,
        columns: 4,
        rows: 2,
        x: detail.x,
        y: detail.y,
        width: 94,
        height: 84,
      })
      return
    }
    drawAtlasSprite(context, materialArt.notions, {
      column: 3,
      row: 1,
      columns: 4,
      rows: 2,
      x: detail.x,
      y: detail.y,
      width: 78,
      height: 72,
    })
    return
  }

  const finish = finishes.find((item) => item.id === detail.type)
  if (!finish) return
  context.fillStyle = finish.color
  context.strokeStyle = '#5b3b3c'
  context.lineWidth = 3
  if (detail.type === 'button' || detail.type === 'pearl') {
    context.beginPath()
    context.arc(detail.x, detail.y, 13, 0, Math.PI * 2)
    context.fill(); context.stroke()
    context.fillStyle = '#634535'
    context.beginPath(); context.arc(detail.x - 4, detail.y, 2, 0, Math.PI * 2); context.fill()
    context.beginPath(); context.arc(detail.x + 4, detail.y, 2, 0, Math.PI * 2); context.fill()
  } else if (detail.type === 'pocket') {
    context.fillRect(detail.x - 28, detail.y - 22, 56, 46)
    context.strokeRect(detail.x - 28, detail.y - 22, 56, 46)
  } else if (detail.type === 'contrast-trim') {
    context.lineWidth = 9
    context.lineCap = 'round'
    context.beginPath()
    context.moveTo(detail.x - 34, detail.y + 10)
    context.quadraticCurveTo(detail.x, detail.y - 22, detail.x + 34, detail.y + 10)
    context.strokeStyle = finish.color
    context.stroke()
  } else if (detail.type === 'monogram') {
    context.font = 'bold italic 32px Georgia'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText('M', detail.x, detail.y)
  } else if (detail.type === 'embroidery') {
    context.lineWidth = 4
    context.strokeStyle = finish.color
    context.beginPath()
    context.moveTo(detail.x - 28, detail.y + 20)
    context.bezierCurveTo(detail.x - 4, detail.y - 26, detail.x + 6, detail.y + 26, detail.x + 30, detail.y - 18)
    context.stroke()
    for (let leaf = -1; leaf <= 1; leaf += 1) {
      context.beginPath()
      context.ellipse(detail.x + leaf * 17, detail.y - leaf * 8, 8, 4, leaf * 0.6, 0, Math.PI * 2)
      context.fill()
    }
  } else {
    context.font = 'bold 40px Georgia'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(finish?.glyph || '✿', detail.x, detail.y)
  }
}

function drawPlanTable(context, fashion) {
  drawArtPlate(context, workstationArt.tailor, drawWood)
  context.save()
  context.shadowColor = 'rgba(59, 35, 29, .3)'
  context.shadowBlur = 18
  context.shadowOffsetY = 10
  context.fillStyle = '#f5e9cf'
  context.strokeStyle = '#6e5042'
  context.lineWidth = 5
  context.translate(300, 304)
  context.rotate(-0.035)
  context.fillRect(-185, -218, 370, 436)
  context.strokeRect(-185, -218, 370, 436)
  context.restore()
  // The old six-cell atlas showed trousers for shoes and a blouse for dresses.
  // Draft the actual construction block; the painted result sits beside it.
  context.save()
  context.translate(78,50); context.scale(.74,.74)
  context.fillStyle='rgba(199,175,136,.20)'
  tracePatternShape(context,fashion); context.fill()
  drawGuide(context,fashionGuides(fashion).cut,'#9e8671')
  const recipe=constructionRecipe(effectiveSchematic(fashion),fashion.fabric)
  recipe.seams.forEach(seam=>{
    context.lineWidth=2;context.strokeStyle='rgba(119,80,112,.48)';context.setLineDash([4,6])
    tracePolyline(context,seam.points);context.stroke();context.setLineDash([])
  })
  context.restore()
  context.fillStyle = '#79556f'
  context.font = 'bold 24px Georgia'
  context.textAlign = 'center'
  context.fillText(fashion.schematic.name.toUpperCase(), 300, 474,350)
  context.fillStyle = '#8b7464'
  context.font = '15px Trebuchet MS'
  context.fillText(`${fashion.schematic.materialUnits} material unit${fashion.schematic.materialUnits === 1 ? '' : 's'} · difficulty ${fashion.schematic.difficulty}/5`, 300, 501)
  ;(fashion.modifications || []).forEach((id, index) => {
    const alteration = FASHION_MODIFICATIONS.find((item) => item.id === id)
    if (!alteration) return
    const onLeft = index % 2 === 0
    drawAtlasSprite(context, materialArt.alterationTools, {
      column: alteration.tool % 4,
      row: Math.floor(alteration.tool / 4),
      columns: 4,
      rows: 2,
      x: onLeft ? 72 : 528,
      y: 190 + index * 112,
      width: 104,
      height: 104,
      rotation: onLeft ? -.08 : .08,
    })
  })
}

function drawFashionCanvas() {
  const context = fashionContext
  const fashion = state.fashion
  let finishSurface=document.querySelector('#fashionFinishSurface')
  if(!finishSurface) {
    finishSurface=document.createElement('div');finishSurface.id='fashionFinishSurface';finishSurface.className='fashion-finish-surface'
    fashionCanvas.after(finishSurface)
  }
  const finish=fashion.step==='finish'
  fashionCanvas.hidden=finish
  finishSurface.hidden=!finish
  if(finish) {
    finishSurface.innerHTML=fashionProductPreview(fashion,'finish-surface')
    elements.fashionBadge.textContent=`${fashion.finishing.length?'Placed details':'Clean finish'} · ${fashion.finishing.length} attached`
    return
  }
  prepareCanvas(fashionCanvas, context)
  if (fashion.step === 'plan') {
    drawPlanTable(context, fashion)
    if (fashion.fabric) {
      context.save()
      context.beginPath()
      context.roundRect(185, 360, 230, 130, 14)
      context.clip()
      context.translate(185, 360)
      context.scale(230 / 600, 130 / 600)
      fabricPattern(context, fashion.fabric)
      context.restore()
      context.strokeStyle = '#4b3532'
      context.lineWidth = 5
      context.strokeRect(185, 360, 230, 130)
    }
    elements.fashionBadge.textContent = fashion.fabric ? `${fashion.schematic.name} · ${fashion.fabric.label} · ${fashionProjectCost(fashion)} coins` : `${fashion.schematic.name} · choose cloth`
    applyCanvasLighting(context)
    return
  }

  drawArtPlate(context, workstationArt.tailor, drawWood)
  if (fashion.step === 'cut') {
    const cutLift = drawCutFabricPanel(context, fashion)
    context.save()
    context.globalAlpha = 1 - cutLift * 0.78
    const guides = fashionGuides(fashion)
    drawGuide(context, guides.cut)
    context.restore()
    drawCutSeam(context, fashion.cutTrace)
    drawCuttingShears(context, fashion)
    const score = fashion.cutTrace.length ? fashionPassScore(fashion, fashion.cutTrace, guides.cut, Math.max(26, 40 - fashion.schematic.difficulty * 2)) : 0
    elements.fashionBadge.textContent = `Cutting · ${score}%`
  } else if (fashion.step === 'sew') {
    const operation=currentFashionSeam(fashion)
    if(operation.hand) {
      drawGarment(context,fashion,[])
      drawGuide(context,operation.points,'#ffe585')
      drawPlayerTrace(context,fashion.seamTrace,'#51354a','thread')
    } else {
      drawSewingFabric(context, fashion)
      drawSewingMachineBody(context, fashion)
      drawSewingFabric(context, fashion, true)
      drawSewingNeedleAssembly(context, fashion)
    }
    const score = fashion.seamTrace.length ? fashionPassScore(fashion,fashion.seamTrace,operation.points,Math.max(22,33-fashion.schematic.difficulty)) : 0
    elements.fashionBadge.textContent = `${operation.label} · ${score}%`
  } else {
    context.fillStyle = 'rgba(255,246,219,.86)'
    context.beginPath()
    context.ellipse(300, 530, 180, 32, 0, 0, Math.PI * 2)
    context.fill()
    drawGarment(context, fashion, fashion.finishing)
    elements.fashionBadge.textContent = `Finishing · ${fashion.finishing.length}/3`
  }
  applyCanvasLighting(context)
}

function recordSewingStitch(fashion) {
  const stitchPoint = {
    x: SEWING_NEEDLE.x - fashion.fabricOffset.x,
    y: SEWING_NEEDLE.y - fashion.fabricOffset.y,
  }
  const previousStitch = fashion.seamTrace.at(-1)
  if (!previousStitch || Math.hypot(stitchPoint.x - previousStitch.x, stitchPoint.y - previousStitch.y) > 3.5) {
    fashion.seamTrace.push(stitchPoint)
  }
}

function startFashionMotionLoop(fashion) {
  cancelAnimationFrame(fashionFrame)
  const tick = (now) => {
    if (state.fashion !== fashion || !fashion.dragging) return
    const last = fashion.motionLastAt || now
    const elapsed = clamp((now - last) / 1000, 0, 0.05)
    fashion.motionLastAt = now
    if (fashion.step === 'sew') {
      const seamGuide = fashionGuides(fashion).seam
      const finalOffset = SEWING_NEEDLE.y - seamGuide.at(-1).y - 18
      fashion.fabricOffset.y = Math.max(finalOffset, fashion.fabricOffset.y - elapsed * 48)
      fashion.machinePhase += elapsed * 13
      recordSewingStitch(fashion)
      elements.fashionNextButton.disabled = !fashionCanAdvance()
    }
    drawFashionCanvas()
    updateFashionWorkFeedback()
    if (fashion.step === 'sew' && fashion.fabricOffset.y <= SEWING_NEEDLE.y - fashionGuides(fashion).seam.at(-1).y - 18) {
      fashion.dragging = false
      fashion.lastPointer = null
      fashion.motionLastAt = 0
      renderFashion()
      return
    }
    fashionFrame = requestAnimationFrame(tick)
  }
  fashionFrame = requestAnimationFrame(tick)
}

function fashionPointerDown(event) {
  const fashion = state.fashion
  const point = canvasPoint(fashionCanvas, event)
  fashionCanvas.setPointerCapture(event.pointerId)
  if (fashion.step === 'cut') {
    if (fashion.inputMode === 'steady') return
    fashion.dragging = true
    fashion.cutTrace.push(point)
    fashion.lastPointer = point
    fashion.motionStartedAt = performance.now()
    fashion.shearAngle = 0
    drawFashionCanvas()
  } else if (fashion.step === 'sew') {
    if (fashion.inputMode === 'steady') return
    if(currentFashionSeam(fashion).hand) {
      fashion.dragging=true
      fashion.seamTrace.push(point)
      drawFashionCanvas()
      return
    }
    fashion.dragging = true
    fashion.lastPointer = point
    fashion.motionStartedAt = performance.now()
    fashion.motionLastAt = 0
    recordSewingStitch(fashion)
    startFashionMotionLoop(fashion)
  }
}

function fashionPointerMove(event) {
  const fashion = state.fashion
  if (!fashion.dragging) return
  const point = canvasPoint(fashionCanvas, event)
  if (fashion.step === 'cut') {
    const previous = fashion.cutTrace.at(-1)
    const distance = previous ? Math.hypot(point.x - previous.x, point.y - previous.y) : 0
    if (!previous || distance > 6) {
      if (previous && distance > 0) {
        const targetAngle = Math.atan2(point.y - previous.y, point.x - previous.x)
        const turn = Math.atan2(
          Math.sin(targetAngle - fashion.shearAngle),
          Math.cos(targetAngle - fashion.shearAngle),
        )
        fashion.shearAngle += turn * 0.28
      }
      fashion.cutTrace.push(point)
      fashion.cutDistance += distance
    }
  } else if (fashion.step === 'sew') {
    if(currentFashionSeam(fashion).hand) {
      const previous=fashion.seamTrace.at(-1)
      if(!previous||Math.hypot(point.x-previous.x,point.y-previous.y)>3) fashion.seamTrace.push(point)
      elements.fashionNextButton.disabled=!fashionCanAdvance()
      drawFashionCanvas()
      return
    }
    const previousPointer = fashion.lastPointer || point
    const deltaX = point.x - previousPointer.x
    fashion.fabricOffset.x = clamp(fashion.fabricOffset.x + deltaX * 0.62, -240, 240)
    fashion.lastPointer = point
    recordSewingStitch(fashion)
  }
  elements.fashionNextButton.disabled = !fashionCanAdvance()
  drawFashionCanvas()
  updateFashionWorkFeedback()
}

function fashionPointerUp() {
  const fashion = state.fashion
  fashion.dragging = false
  fashion.lastPointer = null
  fashion.motionStartedAt = 0
  fashion.motionLastAt = 0
  cancelAnimationFrame(fashionFrame)
  renderFashion()
}

function pauseFashionWork() {
  if(!state.fashion) return
  state.fashion.dragging=false
  state.fashion.lastPointer=null
  state.fashion.motionLastAt=0
  cancelAnimationFrame(fashionFrame)
  cancelAnimationFrame(steadyHandFrame)
  persistProgress()
}
document.addEventListener('slice-and-stitch:workshop-paused',pauseFashionWork)
window.addEventListener('pagehide',pauseFashionWork)

function clearFashionLine() {
  cancelAnimationFrame(fashionFrame)
  state.fashion.dragging = false
  state.fashion.lastPointer = null
  state.fashion.motionLastAt = 0
  state.fashion.assistSection = 0
  state.fashion.assistAccuracies = []
  if(state.fashion.step==='finish') state.fashion.finishing.pop()
  if (state.fashion.step === 'cut') {
    state.fashion.cutTrace = []
    state.fashion.cutDistance = 0
  }
  if (state.fashion.step === 'sew') {
    state.fashion.seamTrace = []
    const seamGuide = fashionGuides(state.fashion).seam
    state.fashion.fabricOffset = {
      x: SEWING_NEEDLE.x - seamGuide[0].x,
      y: SEWING_NEEDLE.y - seamGuide[0].y,
    }
    state.fashion.machinePhase = 0
    state.fashion.motionLastAt = 0
  }
  renderFashion()
}

function showResult({ kicker, hero, title, copy, stats, actions, compact = false, onDismiss = null }) {
  resultDismissAction = onDismiss
  elements.resultDialog.classList.toggle('is-compact', compact)
  elements.resultKicker.textContent = kicker
  elements.resultHero.textContent = hero
  elements.resultHero.classList.remove('is-garment')
  elements.resultHero.hidden = compact
  elements.resultTitle.textContent = title
  elements.resultCopy.textContent = copy
  elements.resultBreakdown.innerHTML = stats.map(([label, value]) => (
    `<span class="result-stat"><small>${label}</small><b>${value}</b></span>`
  )).join('')
  elements.resultActions.replaceChildren()
  actions.forEach(({ label, className, action }) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = className
    button.textContent = label
    button.addEventListener('click', action)
    elements.resultActions.append(button)
  })
  elements.resultDialog.showModal()
  elements.resultActions.querySelector('.primary-button')?.focus({preventScroll:true})
}

function closeResult({ runDismiss = true } = {}) {
  if (elements.resultDialog.open) elements.resultDialog.close()
  const action = resultDismissAction
  resultDismissAction = null
  if (runDismiss) action?.()
}

document.querySelector('[data-clock-toggle]')?.addEventListener('click',()=>window.sliceAndStitchClock.togglePause())
document.querySelectorAll('[data-workshop]').forEach((button) => {
  button.addEventListener('click', () => showWorkshop(button.dataset.workshop))
})
elements.kitchenGameSelector.querySelectorAll('[data-kitchen-game]').forEach((button) => {
  button.addEventListener('click', async () => {
    if(coopActive()) {
      const result=await roomCommand('claim-station',{station:button.dataset.kitchenGame})
      if(!result.ok) {roomWarning(result);return}
      document.dispatchEvent(new CustomEvent('slice-and-stitch:player-activity',{detail:{sceneId:'kitchen',activity:button.dataset.kitchenGame}}))
    }
    coopStirTurns=0;kitchenMinigames?.select(button.dataset.kitchenGame)
  })
})
document.querySelectorAll('[data-open-recipe-book]').forEach((button) => {
  button.addEventListener('click', openRecipeBook)
})
elements.pizzaNextButton.addEventListener('click', handlePizzaNext)
elements.pizzaUndoButton.addEventListener('click', () => {
  if(currentPizzaGate().blocked) return
  state.pizza.toppings.pop()
  renderPizza()
  persistProgress()
})
elements.fashionNextButton.addEventListener('click', handleFashionNext)
elements.fashionClearButton.addEventListener('click', clearFashionLine)
elements.resultCloseButton.addEventListener('click', closeResult)
elements.recipeBookCloseButton.addEventListener('click', closeRecipeBook)
elements.recipeBookDoneButton.addEventListener('click', closeRecipeBook)
elements.resultDialog.addEventListener('cancel', (event) => {
  event.preventDefault()
  closeResult()
})
elements.recipeBookDialog.addEventListener('cancel', (event) => {
  event.preventDefault()
  closeRecipeBook()
})
elements.resetProgressButton.addEventListener('click', resetPrototype)
elements.kitchenResetButton.addEventListener('click', () => {kitchenMinigames?.reset();persistProgress()})

pizzaCanvas.addEventListener('pointerdown', pizzaPointerDown)
for(const canvas of [pizzaCanvas,fashionCanvas,kitchenCanvas]) canvas.addEventListener('pointerdown',resumeClockForWork,{capture:true})
elements.pizzaNextButton.addEventListener('click',resumeClockForWork,{capture:true})
pizzaCanvas.addEventListener('pointermove', pizzaPointerMove)
pizzaCanvas.addEventListener('pointerup', pizzaPointerUp)
pizzaCanvas.addEventListener('pointercancel', pizzaPointerUp)
fashionCanvas.addEventListener('pointerdown', fashionPointerDown)
fashionCanvas.addEventListener('pointermove', fashionPointerMove)
fashionCanvas.addEventListener('pointerup', fashionPointerUp)
fashionCanvas.addEventListener('pointercancel', fashionPointerUp)

kitchenMinigames = createKitchenMinigames({
  canvas: kitchenCanvas,
  eventTarget: document,
  onChange: renderKitchenDashboard,
  saved:savedProgress.kitchenStations,
  service:kitchenServiceSnapshot(state.kitchenService),
  onWork:handleKitchenWork,
  onStir:radians=>{
    if(coopActive()) {
      coopStirTurns+=Math.min(Math.PI,Math.abs(radians))/(Math.PI*2)
      if(coopStirTurns>=.25) {const turns=coopStirTurns;coopStirTurns=0;roomCommand('stir-sauce',{turns}).then(roomWarning)}
      return
    }
    const wasBurning=state.kitchenService.burning
    state.kitchenService=stirKitchenSauce(state.kitchenService,radians)
    syncKitchenService()
    if(wasBurning && !state.kitchenService.burning) {renderPizza();persistProgress()}
  },
  isRunning:kitchenIsRunning,
})
kitchenMinigames.setUpgrades(state.progression.ownedUpgrades)
pizzeriaShift.subscribe(({ snapshot }) => renderShiftQueue(snapshot))
const initialQueuedOrder = nextQueuedPizza(state.orderNumber)
state.pizzaTier = initialQueuedOrder.tierId
state.pizza = restorePizzaProject(savedProgress.pizzaProject) || freshPizza(initialQueuedOrder.tierId, initialQueuedOrder.order)
// Recover the reserved project rather than leave its prep stranded after a save migration.
if(state.kitchenService.reservation && state.kitchenService.reservation.id !== state.pizza.id) {
  state.pizza.id=state.kitchenService.reservation.id
  state.pizza.tierId=state.kitchenService.reservation.sauce === 'pesto' && state.menu.has('garden') ? 'garden' : 'starter'
  state.pizza.prepReserved=true
}
state.pizzaTier=state.pizza.tierId
state.fashion = restoreFashionProject(savedProgress.fashionProject, freshFashion(), state.progression.atelierLevel)
// Old setup saves could preview an unowned archive recipe. Keep paid work,
// but reopen unpaid setup on a real owned pattern instead.
if(state.fashion.step==='plan' && !state.fashion.alterationMode && state.patternLibrary.owned.length && !state.patternLibrary.owned.includes(state.fashion.schematic.id)) state.fashion=freshFashion()
beginPizzaSession(state.pizza)
beginFashionSession(state.fashion)
renderTicket()
updateProgress()
applyPhase(state.phase)
renderPizza()
renderFashion()
publishClock()
window.setInterval(tickDayClock,1000)
