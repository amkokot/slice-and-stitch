import { createActorDirector } from './hub-actors.js'
import { createCharacterCreator } from './character-creator.js'
import { createCharacterStore, findGarment, wardrobeSetBonuses, sharedCharacterState } from './character-model.js'
import { playerAccount, savePlayerProfile } from './player-account.js'
import {
  boutiqueCatalogForDay,
  FASHION_CATALOG_GARMENTS,
  FASHION_FABRICS,
  FASHION_SETS,
  tailorStockForDay,
} from './fashion-catalog.js'
import { pizzeriaShift } from './pizzeria-shift.js'
import { createTownPopulation } from './town-life.js'
import { isFashionPlaytest } from './game-storage.js'
import {economyJournalMarkup} from './economy-journal.js'
import { COUNTER_SEATS } from './scene-character-layout.js'
import { createGamePanel } from './game-panel.js'

export const HUB_LAUNCH_EVENT = 'slice-and-stitch:launch-minigame'
export const HUB_RETURN_EVENT = 'slice-and-stitch:return-to-hub'
export const HUB_SHOP_EVENT = 'slice-and-stitch:shop-action'

const art = Object.freeze({
  town: 'assets/hub/town-street.png',
  restaurant: 'assets/hub/restaurant-counter-v2.png',
  kitchen: 'assets/hub/pizzeria-room-v2.png',
  home: 'assets/hub/home-room.png',
  boutique: 'assets/hub/boutique-room-v2.png',
  tailor: 'assets/hub/tailor-room-v1.png',
})

// Five fixed service places line up with the stools painted into the restaurant.
// Keeping these as scene data makes seated poses and customer interactions
// independent from the character renderer.
export const RESTAURANT_COUNTER_SLOTS = COUNTER_SEATS

export const MINIGAME_STATIONS = Object.freeze({
  'pizza-making': Object.freeze({
    id: 'pizza-making',
    title: 'Pizza making',
    verb: 'Build today\'s order',
    description: 'Sauce, cheese, toppings, bake, and cut at the main prep counter.',
    workshop: 'pizza',
  }),
  'dough-throw': Object.freeze({
    id: 'dough-throw',
    title: 'Dough throwing',
    verb: 'Stretch the next crust',
    description: 'Turn a dough ball into an even base without tearing the center.',
    workshop: 'kitchen',
    kitchenGame: 'doughToss',
  }),
  'sauce-pot': Object.freeze({
    id: 'sauce-pot',
    title: 'Sauce pot',
    verb: 'Tend the house sauce',
    description: 'Stir, season, and manage the heat before the lunch rush.',
    workshop: 'kitchen',
    kitchenGame: 'saucePot',
  }),
  'soda-fountain': Object.freeze({
    id: 'soda-fountain',
    title: 'Soda fountain',
    verb: 'Fill drink orders',
    description: 'Choose the right cup and stop the pour before the fizz spills.',
    workshop: 'kitchen',
    kitchenGame: 'drinkPour',
  }),
  'dish-washing': Object.freeze({
    id: 'dish-washing',
    title: 'Dish washing',
    verb: 'Clear the wash station',
    description: 'Scrub, rinse, and rack a busy service\'s worth of plates.',
    workshop: 'kitchen',
    kitchenGame: 'dishwashing',
  }),
  tailoring: Object.freeze({
    id: 'tailoring',
    title: 'Tailoring table',
    verb: 'Make today\'s commission',
    description: 'Choose an owned pattern and suitable material, cut the silhouette, sew its seam, and customize the finished piece.',
    workshop: 'fashion',
  }),
})

export const WORLD_SCENES = Object.freeze({
  street: Object.freeze({
    id: 'street',
    eyebrow: 'Via Bellavista',
    title: 'A little street with a lot to make',
    copy: 'Choose a doorway. Everything you need is only a click away.',
    art: art.town,
    artClass: 'town-art',
    hotspots: Object.freeze([
      { id: 'home-door', label: 'Home', hint: 'Wardrobe & collections', x: 34, y: 27, w: 26, h: 30, walkTo: { x: 14, y: 80 }, action: { type: 'scene', target: 'home' } },
      { id: 'pizzeria-door', label: 'Pizzeria', hint: 'Enter the restaurant', x: 31, y: 61, w: 27, h: 29, walkTo: { x: 31, y: 82 }, action: { type: 'scene', target: 'restaurant' }, featured: true },
      { id: 'tailor-door', label: 'Tailor', hint: 'Tools, cloth & crafting', x: 58, y: 61, w: 23, h: 28, walkTo: { x: 58, y: 82 }, action: { type: 'scene', target: 'tailor' } },
      { id: 'boutique-door', label: 'Boutique', hint: 'Ready-made looks', x: 83, y: 59, w: 21, h: 27, walkTo: { x: 83, y: 82 }, action: { type: 'scene', target: 'boutique' } },
    ]),
  }),
  restaurant: Object.freeze({
    id: 'restaurant',
    eyebrow: 'Pizzeria counter',
    title: 'Pull up a stool',
    copy: 'Customers enter from the street, take one of five counter places, order at the bell, and leave after service.',
    art: art.restaurant,
    artClass: 'restaurant-art',
    hotspots: Object.freeze([
      { id: 'restaurant-exit', label: 'Street door', hint: 'Step outside', x: 8, y: 35, w: 16, h: 58, walkTo: { x: 8, y: 86 }, action: { type: 'scene', target: 'street' }, exit: true },
      { id: 'order-counter', label: 'Service counter', hint: 'Check the live queue', x: 53, y: 44, w: 70, h: 34, walkTo: { x: 53, y: 73 }, action: { type: 'panel', target: 'orders' }, featured: true },
      { id: 'kitchen-door', label: 'Kitchen', hint: 'Work the stations', x: 94, y: 38, w: 12, h: 52, walkTo: { x: 94, y: 84 }, action: { type: 'scene', target: 'kitchen' } },
    ]),
  }),
  kitchen: Object.freeze({
    id: 'kitchen',
    eyebrow: 'Pizzeria kitchen',
    title: 'The working kitchen',
    copy: 'Every tool has a home. Hover a station to bring it to life, then click to start the job.',
    art: art.kitchen,
    artClass: 'kitchen-art',
    hotspots: Object.freeze([
      { id: 'kitchen-exit', label: 'Dining room', hint: 'Return to the counter', icon: '←', x: 4, y: 43, w: 9, h: 53, walkTo: { x: 7, y: 86 }, action: { type: 'scene', target: 'restaurant' }, exit: true },
      { id: 'soda-fountain', label: 'Soda fountain', hint: 'Pour & fizz', icon: '◌', x: 16, y: 38, w: 13, h: 24, walkTo: { x: 16, y: 73 }, action: { type: 'minigame', target: 'soda-fountain' } },
      { id: 'sauce-pot', label: 'Sauce pot', hint: 'Stir & season', icon: '●', x: 29, y: 39, w: 13, h: 20, walkTo: { x: 29, y: 72 }, action: { type: 'minigame', target: 'sauce-pot' } },
      { id: 'pizza-counter', label: 'Pizza making', hint: 'Build the next order', icon: '◒', x: 49.5, y: 38, w: 28, h: 22, walkTo: { x: 50, y: 70 }, action: { type: 'minigame', target: 'pizza-making' }, featured: true },
      { id: 'dough-table', label: 'Dough throwing', hint: 'Stretch the crust', icon: '○', x: 50, y: 67, w: 38, h: 34, walkTo: { x: 50, y: 82 }, action: { type: 'minigame', target: 'dough-throw' } },
      { id: 'dish-pit', label: 'Dish washing', hint: 'Scrub & rack', icon: '✓', x: 90, y: 59, w: 18, h: 32, walkTo: { x: 89, y: 82 }, action: { type: 'minigame', target: 'dish-washing' } },
      { id: 'kitchen-upgrades', label: 'Upgrade counter', hint: 'Buy tools for every station', icon: '⌁', x: 92, y: 14, w: 14, h: 18, walkTo: { x: 84, y: 76 }, action: { type: 'panel', target: 'upgrades' }, quiet: true },
    ]),
  }),
  tailor: Object.freeze({
    id: 'tailor',
    eyebrow: 'Mara\'s tailor shop',
    title: 'Patterns, fabric, and a good pair of shears',
    copy: 'Speak with Mara to browse supplies, or use the dress form to start a project.',
    art: art.tailor,
    artClass: 'tailor-art',
    hotspots: Object.freeze([
      { id: 'tailor-owner', label: 'Mara', hint: 'Browse patterns & cloth', x: 14, y: 55, w: 24, h: 36, walkTo: { x: 20, y: 78 }, action: { type: 'panel', target: 'tailor-shop' }, featured: true },
      { id: 'tailor-project', label: 'Cutting table', hint: 'Start a tailoring project', x: 59, y: 61, w: 39, h: 31, walkTo: { x: 58, y: 82 }, action: { type: 'minigame', target: 'tailoring' } },
      { id: 'tailor-exit', label: 'Street door', hint: 'Step outside', x: 94, y: 38, w: 12, h: 52, walkTo: { x: 92, y: 85 }, action: { type: 'scene', target: 'street' }, exit: true },
    ]),
  }),
  boutique: Object.freeze({
    id: 'boutique',
    eyebrow: 'Luna boutique',
    title: 'A little something for the next shift',
    copy: 'Talk to Luna to browse the rail. Ready-made clothes offer a reliable style boost.',
    art: art.boutique,
    artClass: 'boutique-art',
    hotspots: Object.freeze([
      { id: 'boutique-owner', label: 'Luna', hint: 'Browse the collection', x: 44, y: 60, w: 16, h: 30, walkTo: { x: 49, y: 77 }, action: { type: 'panel', target: 'boutique-shop' }, featured: true },
      { id: 'boutique-rail', label: 'Clothing rail', hint: 'See today\'s looks', x: 36, y: 34, w: 36, h: 32, walkTo: { x: 36, y: 73 }, action: { type: 'panel', target: 'boutique-shop' } },
      { id: 'boutique-mirror', label: 'Fitting mirror', hint: 'Open character & wardrobe', x: 69, y: 45, w: 13, h: 38, walkTo: { x: 69, y: 76 }, action: { type: 'panel', target: 'wardrobe' }, quiet: true },
      { id: 'boutique-exit', label: 'Street door', hint: 'Step outside', x: 93, y: 39, w: 14, h: 52, walkTo: { x: 92, y: 84 }, action: { type: 'scene', target: 'street' }, exit: true },
    ]),
  }),
  home: Object.freeze({
    id: 'home',
    eyebrow: 'Upstairs apartment',
    title: 'Home before the rush',
    copy: 'Create your character, change their look, or head downstairs when you are ready.',
    art: art.home,
    artClass: 'home-art',
    hotspots: Object.freeze([
      { id: 'home-wardrobe', label: 'Wardrobe', hint: 'Create and dress your character', x: 31, y: 39, w: 28, h: 38, walkTo: { x: 31, y: 78 }, action: { type: 'panel', target: 'wardrobe' }, featured: true },
      { id: 'home-mirror', label: 'Mirror', hint: 'Edit your character', x: 14, y: 53, w: 16, h: 34, walkTo: { x: 14, y: 78 }, action: { type: 'panel', target: 'wardrobe' } },
      { id: 'home-bed', label: 'Go to bed', hint: 'Sleep until the next morning', icon: '☾', x: 83, y: 83, w: 31, h: 25, walkTo: { x: 75, y: 87 }, action: { type: 'panel', target: 'bed' } },
      { id: 'home-exit', label: 'Balcony door', hint: 'Go downstairs', x: 74, y: 42, w: 25, h: 54, walkTo: { x: 75, y: 80 }, action: { type: 'scene', target: 'street' }, exit: true },
    ]),
  }),
})

export const SHOP_CATALOGS = Object.freeze({
  'tailor-shop': Object.freeze({
    eyebrow: 'Mara says hello',
    title: 'Today at the atelier',
    copy: 'Mara brings a small shipment of paper patterns each day. Owned patterns stay in your crafting box forever. Her rotating cloth shelf is 10% off; standard unlocked materials are always available.',
    items: Object.freeze([
      { id: 'cotton-roll', name: 'Everyday cotton', detail: 'Forgiving · apron ready', price: 24, mark: '▧' },
      { id: 'dressmaker-shears', name: 'Dressmaker shears', detail: 'Wider cutting tolerance', price: 90, mark: '✂' },
      { id: 'pattern-weights', name: 'Pattern weights', detail: 'Faster layout phase', price: 140, mark: '◆' },
    ]),
  }),
  'boutique-shop': Object.freeze({
    eyebrow: 'Luna\'s daily rail',
    title: 'Ready-made looks',
    copy: 'Today\'s featured rail is 10% off. Every unlocked catalogue piece can be bought at its regular price, so you never have to wait for your favorite look.',
    items: Object.freeze([
      { id: 'tomato-apron', name: 'Tomato service apron', detail: 'Playful · workwear', price: 48, mark: '♢' },
      { id: 'violet-blouse', name: 'Violet pin-tuck blouse', detail: 'Classic · soft tailoring', price: 76, mark: '⌁' },
      { id: 'garden-scarf', name: 'Garden scarf', detail: 'Handmade · bright', price: 34, mark: '✿' },
    ]),
  }),
})

export function createWorldNavigator(initialScene = 'street', scenes = WORLD_SCENES) {
  let current = scenes[initialScene] ? initialScene : 'street'
  const trail = []

  return Object.freeze({
    current: () => current,
    trail: () => [...trail],
    go(sceneId) {
      if (!scenes[sceneId]) return false
      if (sceneId !== current) trail.push(current)
      current = sceneId
      return true
    },
    back(fallback = 'street') {
      current = trail.pop() || (scenes[fallback] ? fallback : 'street')
      return current
    },
    reset(sceneId = 'street') {
      trail.length = 0
      current = scenes[sceneId] ? sceneId : 'street'
      return current
    },
  })
}

function hotspotMarkup(hotspot) {
  const classes = [
    'hub-hotspot',
    hotspot.featured ? 'is-featured' : '',
    hotspot.quiet ? 'is-quiet' : '',
    hotspot.exit ? 'is-exit' : '',
  ].filter(Boolean).join(' ')
  return `<button class="${classes}" type="button" data-hotspot="${hotspot.id}" aria-label="${hotspot.label}: ${hotspot.hint}" style="--hotspot-x:${hotspot.x}%;--hotspot-y:${hotspot.y}%;--hotspot-w:${hotspot.w || 18}%;--hotspot-h:${hotspot.h || 24}%">
    <span class="hub-hotspot-glow" aria-hidden="true"><i></i><i></i></span>
  </button>`
}

function sceneMotionMarkup(sceneId) {
  if (sceneId === 'street') return `<div class="scene-ambience street-ambience" aria-hidden="true">
    <span class="scene-sun-wash"></span><span class="scene-lantern-glow is-one"></span><span class="scene-lantern-glow is-two"></span>
    <span class="scene-leaves"><i></i><i></i><i></i><i></i></span>
  </div>`
  if (sceneId === 'restaurant') return `<div class="scene-ambience restaurant-ambience" aria-hidden="true">
    <span class="restaurant-door-light"></span><span class="restaurant-pass-glow"></span>
    <span class="restaurant-bell-glint"></span><span class="restaurant-dust"><i></i><i></i><i></i></span>
  </div>`
  if (sceneId === 'tailor') return `<div class="scene-ambience tailor-ambience" aria-hidden="true">
    <span class="tailor-window-light"></span><span class="tailor-lamp-glow"></span>
    <span class="tailor-thread-glint"></span><span class="tailor-dust"><i></i><i></i><i></i></span>
  </div>`
  if (sceneId === 'boutique') return `<div class="scene-ambience boutique-ambience" aria-hidden="true">
    <span class="boutique-window-light"></span><span class="boutique-mirror-glint"></span><span class="boutique-lamp-glow"></span>
  </div>`
  if (sceneId === 'home') return `<div class="scene-ambience home-ambience" aria-hidden="true">
    <span class="home-window-light"></span><span class="home-mirror-glint"></span><span class="home-curtain-light"></span>
  </div>`
  if (sceneId !== 'kitchen') return ''
  return `<div class="scene-ambience kitchen-ambience" aria-hidden="true">
    <span class="kitchen-pendant-glow is-one"></span>
    <span class="kitchen-pendant-glow is-two"></span>
    <span class="kitchen-pendant-glow is-three"></span>
    <span class="kitchen-oven-glow"><i class="flame is-one"></i><i class="flame is-two"></i><i class="flame is-three"></i></span>
    <span class="kitchen-steam is-one"><i></i><i></i><i></i></span>
    <span class="kitchen-steam is-two"><i></i><i></i></span>
    <span class="kitchen-fizz"><i></i><i></i><i></i><i></i></span>
    <span class="kitchen-flour-motes"><i></i><i></i><i></i><i></i><i></i></span>
    <span class="kitchen-sink-glint"><i></i><i></i></span>
    <span class="kitchen-order-bell"></span>
  </div>`
}

export function customerActor(customer, sceneId, queueIndex = 0) {
  if (sceneId === 'street') {
    return {
      id: `shift-${customer.id}`,
      visualIdentity: `shift-${customer.id}`,
      name: customer.name,
      role: 'customer',
      x: 63,
      y: 82,
      state: 'walking-to-pizzeria',
      detailLevel: 'town',
      scale: 1.04,
      route: { x: 31, y: 71, duration: customer.travelMs / 1000, loop: false, arrivalFacing: 'up-left', arrivalAction: 'wait' },
      appearance: customer.appearance,
    }
  }
  if (sceneId === 'restaurant') {
    const slot = RESTAURANT_COUNTER_SLOTS[queueIndex] || RESTAURANT_COUNTER_SLOTS.at(-1)
    return {
      id: `shift-${customer.id}`,
      visualIdentity: `shift-${customer.id}`,
      name: customer.name,
      role: 'customer',
      x: slot.x,
      y: slot.y,
      state: customer.status || 'waiting',
      pose: 'counter-customer',
      detailLevel: 'town',
      scale: 1.08,
      route: null,
      facing: 'up',
      lookDirection: 'up-right',
      action: customer.status === 'preparing' ? 'wait' : queueIndex === 0 ? 'order' : '',
      appearance: customer.appearance,
    }
  }
  return {
    id: `shift-${customer.id}`,
    visualIdentity: `shift-${customer.id}`,
    name: customer.name,
    role: 'customer',
    x: 7,
    y: 88,
    route: {
      x: Math.min(44, 14 + queueIndex * 9),
      y: 73 + (queueIndex % 2) * 4,
      duration: 2.4 + queueIndex * .35,
      loop: false,
    },
    appearance: customer.appearance,
  }
}

function shellMarkup() {
  return `<header class="hub-topbar">
      <div class="hub-brand" aria-label="Slice and Stitch">
        <span class="hub-brand-mark" aria-hidden="true">✂</span>
        <span><small>Kitchen & clothier story</small><b>Slice <i>&amp;</i> Stitch</b></span>
      </div>
      <div class="hub-day" aria-label="Current day and time">
        <span data-hub-day>Day 1</span>
        <b data-hub-phase-label>Morning</b>
        <button type="button" data-day-journal aria-label="Open day and progression journal">Journal</button>
      </div>
      <div class="hub-wallet" aria-label="Player progress">
        <span><i aria-hidden="true">●</i><b data-hub-coins>120</b> coins</span>
        <span><i aria-hidden="true">♥</i><b data-hub-reputation>0</b> rep</span>
      </div>
    </header>
    <main class="hub-main">
      <section class="hub-scene-card">
        <div class="hub-scene-stage" data-scene-stage role="region">
          <div class="hub-scene-art" data-scene-art aria-hidden="true"></div>
          <div class="hub-scene-motion" data-scene-motion aria-hidden="true"></div>
          <div class="hub-scene-shade" aria-hidden="true"></div>
          <div class="hub-actors" data-hub-actors aria-label="People in this room"></div>
          <div class="hub-hotspots" data-hotspots></div>
          <aside class="hub-drawer" data-hub-drawer hidden>
            <button class="hub-drawer-close" type="button" data-close-drawer aria-label="Close panel">×</button>
            <div data-drawer-content></div>
          </aside>
          <div class="hub-toast" data-hub-toast role="status" aria-live="polite" hidden></div>
        </div>
      </section>
    </main>`
}

function itemMarkup(item, { owned = false, equipped = false } = {}) {
  const set = item.setId ? FASHION_SETS[item.setId] : null
  const status = item.locked && !owned
    ? `Level ${item.unlockLevel}`
    : owned
      ? equipped ? 'Wearing' : 'Wear'
      : item.availableToday ? 'Buy' : 'Not today'
  const disabled = (item.locked && !owned) || (!owned && !item.availableToday) || equipped
  const detail = (item.detail || `${item.tags?.slice(0, 2).join(' · ') || item.cut} · ${item.cut}`)+(item.featured?' · 10% off today':'')
  return `<article class="hub-shop-item ${item.locked ? 'is-locked' : ''} ${owned ? 'is-owned' : ''}" style="--garment-primary:${item.palette?.primary || '#76506f'};--garment-secondary:${item.palette?.secondary || '#f1ca68'}">
    <span class="hub-item-mark garment-mark" data-garment-cut="${item.cut || item.slot}" data-garment-slot="${item.slot}" aria-hidden="true"><i></i></span>
    <span><b>${item.name}</b><small>${detail}</small>${set ? `<em>${set.mark} ${set.name}</em>` : ''}</span>
    <span class="hub-item-buy"><strong>${owned ? 'Owned' : `${item.price} ●`}</strong><button type="button" data-shop-item="${item.id}" ${disabled ? 'disabled' : ''}>${status}</button>${owned ? `<button class="hub-alter-button" type="button" data-modify-garment="${item.id}">Alter</button>` : ''}</span>
  </article>`
}

function patternShopMarkup(inventory) {
  const records=inventory.patterns || []
  const owned=records.filter(pattern=>pattern.owned)
  const featuredIds=new Set(inventory.schematics.map(pattern=>pattern.id))
  const featured=records.filter(pattern=>!pattern.owned && pattern.unlocked && featuredIds.has(pattern.id))
  const cards=patterns=>patterns.map(pattern=>`<article class="${pattern.owned?'is-owned':''}" data-pattern-shop-record><span class="pattern-paper" data-silhouette="${pattern.silhouette}" aria-hidden="true"></span><span><b>${pattern.name}</b><small>${pattern.slot} · ${pattern.materialUnits} material unit${pattern.materialUnits===1?'':'s'} · ${pattern.owned?'owned forever':`${pattern.price} coins, one-time`}</small></span><button type="button" ${pattern.owned?'data-tailor-pattern':'data-buy-pattern'}="${pattern.id}" ${!pattern.owned && !pattern.available?'disabled':''}>${pattern.owned?'Craft this':`Buy · ${pattern.price} ●`}</button></article>`).join('')
  return `<label class="hub-shop-search"><span>Find a pattern</span><input type="search" aria-label="Search purchasable and owned patterns" placeholder="Skirt, jacket, leather…"><small data-pattern-search-count></small></label>
    <span class="hub-shop-section-label">Today’s pattern shipment · ${featured.length} to buy</span><div class="hub-pattern-stock">${featured.length?cards(featured):'<p>You own every pattern in today’s shipment. Come back after dawn for new designs.</p>'}</div>
    <p class="economy-small">A small shipment of ${inventory.schematics.length} designs arrives each day. Purchases do not refill it. Higher atelier tiers enter future shipments as you progress.</p>
    <span class="hub-shop-section-label">My patterns · ${owned.length}</span><div class="hub-pattern-stock">${owned.length?cards([...owned].sort((a,b)=>b.acquiredOrder-a.acquiredOrder)):'<p>Purchased patterns appear in your crafting box, highlighted as New.</p>'}</div>`
}

function catalogueGroupsMarkup(items, options) {
  const slotNames = { top: 'Shirts, blouses & dresses', outerwear: 'Jackets, blazers & cardigans', bottom: 'Skirts, trousers & shorts', apron: 'Aprons & studio wear', shoes: 'Shoes & boots', accessory: 'Accessories, hats & bags' }
  return `<div class="hub-catalog-groups">${Object.entries(slotNames).map(([slot, label]) => {
    const group = items.filter((item) => item.slot === slot)
    if (!group.length) return ''
    const locked = group.filter((item) => item.locked).length
    return `<details class="hub-catalog-group"><summary><span>${label}<small>${locked ? `${locked} still locked` : 'All discovered'}</small></span><b>${group.length}</b></summary><div class="hub-shop-list">${group.map((item) => itemMarkup(item, options(item))).join('')}</div></details>`
  }).join('')}</div>`
}

function setBonusMarkup(state) {
  const progress = new Map(wardrobeSetBonuses(state).map((set) => [set.id, set]))
  return `<div class="hub-set-ledger"><span class="hub-shop-section-label">Equipped set bonuses</span>${Object.values(FASHION_SETS).map((set) => {
    const record = progress.get(set.id)
    const count = record?.count || 0
    return `<article class="hub-set-card ${record?.active ? 'is-active' : ''}"><b>${set.mark} ${set.name}</b><small>${count}/3 pieces · ${record?.complete ? set.full : record?.active ? set.twoPiece : `2 pieces unlock ${set.twoPiece}`}</small><i><span style="--set-progress:${count / 3 * 100}%"></span></i></article>`
  }).join('')}</div>`
}

function initHub() {
  const appShell = document.querySelector('.app-shell')
  if (!appShell || document.querySelector('.world-shell')) return

  const navigator = createWorldNavigator()
  const launchers = new Map()
  let returnScene = 'street'
  let toastTimer = 0

  const shell = document.createElement('section')
  shell.className = 'world-shell'
  shell.setAttribute('aria-label', 'Slice and Stitch neighborhood')
  shell.innerHTML = shellMarkup()
  const gameFrame = createGamePanel(appShell, shell)
  if (isFashionPlaytest()) {
    const banner=document.createElement('aside')
    banner.className='fashion-playtest-banner'
    banner.textContent='Playtest · separate save'
    gameFrame.panel.append(banner)
  }

  const returnDock = document.createElement('div')
  returnDock.className = 'hub-return-dock'
  returnDock.setAttribute('aria-label', 'Leave activity')
  returnDock.hidden = true
  returnDock.innerHTML = `<button type="button" data-return-room>← Back to the room</button>`
  gameFrame.hud.prepend(returnDock)

  const sceneStage = shell.querySelector('[data-scene-stage]')
  const sceneArt = shell.querySelector('[data-scene-art]')
  const sceneMotion = shell.querySelector('[data-scene-motion]')
  const characterStore = createCharacterStore()
  let onboarding = !playerAccount().ready && (!isFashionPlaytest() || new URLSearchParams(location.search).has('onboard'))
  const clockWasPaused = window.sliceAndStitchClock?.getSnapshot?.().paused
  const actorDirector = createActorDirector(shell.querySelector('[data-hub-actors]'))
  const shiftArrivalTimers = new Map()
  const townPopulation = createTownPopulation({ startedAt: Date.now() })
  let townStageSignature = ''
  let latestKitchenInfo = window.sliceAndStitchMinigames?.getDashboard?.() || null
  const hotspots = shell.querySelector('[data-hotspots]')
  const drawer = shell.querySelector('[data-hub-drawer]')
  const drawerContent = shell.querySelector('[data-drawer-content]')
  const toast = shell.querySelector('[data-hub-toast]')
  // The journal is available in rooms and at the workbench.
  gameFrame.panel.append(drawer, toast)
  const coinSource = document.querySelector('#coinCount')
  const reputationSource = document.querySelector('#reputationCount')
  let pendingGarmentNotice = false
  const characterCreator = createCharacterCreator({
    container: drawerContent,
    store: characterStore,
    getAtelierLevel: () => currentProgress().atelierLevel,
    getFashionProject: () => window.sliceAndStitchFashion?.getProject?.(),
    canAlterGarment: garment => window.sliceAndStitchFashion?.canAlterGarment?.(garment),
    onAppearanceChange: (_appearance, state) => actorDirector.setPlayerCharacter(state),
    onDone: () => {
      if (onboarding) {
        savePlayerProfile(characterStore.snapshot().profile,{ready:true})
        onboarding=false
        delete gameFrame.panel.dataset.onboarding
        if(!clockWasPaused && window.sliceAndStitchClock?.getSnapshot?.().paused) window.sliceAndStitchClock.togglePause()
        document.dispatchEvent(new CustomEvent('slice-and-stitch:character-ready'))
      }
      closeDrawer()
    },
    onStartTailoring: () => {
      if (!window.sliceAndStitchFashion?.startNewProject?.()) {
        showToast('Your saved project is ready to resume. Materials have already been paid for.')
      }
      closeDrawer()
      openWorkshop('fashion', navigator.current())
    },
    onAlterGarment: (garment) => {
      if (!window.sliceAndStitchFashion?.beginAlteration?.(garment)) {
        showToast('Finish or discard your current project before altering another piece.')
        return
      }
      closeDrawer()
      openWorkshop('fashion', navigator.current())
    },
  })

  function setKitchenHotspotStatus(hotspotId, copy, warning = false) {
    shell.querySelectorAll(`[data-hotspot="${hotspotId}"]`).forEach((button) => {
      const hint = button.querySelector('small')
      if (hint) hint.textContent = copy
      button.classList.toggle('is-warning', warning)
    })
  }

  function refreshKitchenShiftStatus(snapshot = pizzeriaShift.snapshot()) {
    const sceneId = navigator.current()
    if (sceneId !== 'kitchen' && sceneId !== 'restaurant') return
    const orders = snapshot.queue.length
    const dirty = latestKitchenInfo?.service?.dirtyDishes ?? snapshot.dirtyDishes
    if (sceneId === 'restaurant') {
      setKitchenHotspotStatus('order-counter', orders ? `${orders} ${orders === 1 ? 'order' : 'orders'} waiting` : 'Counter is clear')
      sceneStage.dataset.queueStatus = orders ? 'waiting' : 'clear'
      return
    }
    const sauce = latestKitchenInfo?.games?.saucePot
    const service=latestKitchenInfo?.service
    const sauceCopy = sauce?.hold?.label || (sauce?.batchReady ? 'Batch ready' : 'Prep the batch')
    const sauceWarning = sauce?.hold?.key === 'watch' || sauce?.hold?.key === 'smoking'
    setKitchenHotspotStatus('pizza-counter', service?.burning ? 'Cooking stopped · rescue sauce' : orders ? `${orders} ${orders === 1 ? 'order' : 'orders'} queued` : 'Waiting for customers', Boolean(service?.burning))
    setKitchenHotspotStatus('dish-pit', dirty ? `${dirty} dirty ${dirty === 1 ? 'dish' : 'dishes'}` : 'Rack clear', dirty >= 4)
    setKitchenHotspotStatus('sauce-pot', sauceCopy, sauceWarning)
    if(service) {
      setKitchenHotspotStatus('dough-table',`${service.doughs}/10 skins ready`)
      setKitchenHotspotStatus('soda-fountain',service.drinkTickets ? `${service.drinkTickets} soda orders · bonus coins` : 'No soda orders waiting')
    }
    sceneStage.dataset.sauceStatus = sauce?.hold?.key || (sauce?.batchReady ? 'ready' : 'prep')
    sceneStage.dataset.dishStatus = dirty ? 'dirty' : 'clear'
  }

  function syncShiftActors(snapshot) {
    const desired = []
    snapshot.approaching.forEach((customer) => {
      desired.push({ sceneId: 'street', actor: customerActor(customer, 'street') })
    })
    snapshot.queue.forEach((customer, index) => {
      desired.push({ sceneId: 'restaurant', actor: customerActor(customer, 'restaurant', index) })
    })
    actorDirector.setGroup('pizzeria-shift', desired)
  }

  function syncTownActors(now = Date.now()) {
    const signature = townPopulation.stageSignature(now)
    if (signature === townStageSignature) return
    townStageSignature = signature
    actorDirector.setGroup('town-life', townPopulation.snapshot(now))
  }

  function scheduleApproachingCustomers(snapshot) {
    snapshot.approaching.forEach((customer) => {
      if (shiftArrivalTimers.has(customer.id)) return
      const timer = window.setTimeout(() => {
        shiftArrivalTimers.delete(customer.id)
        pizzeriaShift.admit(customer.id)
      }, customer.travelMs)
      shiftArrivalTimers.set(customer.id, timer)
    })
  }

  function sendCustomerBackToStreet(customer) {
    const removeFromRestaurant = actorDirector.add('restaurant', {
      ...customerActor(customer, 'restaurant'),
      id: `departing-restaurant-${customer.id}`,
      x: 71,
      y: 82,
      state: 'leaving-pizzeria',
      pose: 'standing',
      action: '',
      route: { x: 4, y: 76, duration: 4.2, loop: false, arrivalFacing: 'left' },
    })
    window.setTimeout(() => {
      removeFromRestaurant()
      const removeFromStreet = actorDirector.add('street', {
        ...customerActor(customer, 'street'),
        id: `departing-street-${customer.id}`,
        x: 31,
        y: 71,
        state: 'walking-home',
        pose: 'standing',
        route: { x: 96, y: 83, duration: 7.4, loop: false, arrivalFacing: 'right' },
      })
      window.setTimeout(removeFromStreet, 7800)
    }, 4300)
  }

  pizzeriaShift.seed()
  syncTownActors()
  pizzeriaShift.subscribe((event) => {
    syncShiftActors(event.snapshot)
    scheduleApproachingCustomers(event.snapshot)
    refreshKitchenShiftStatus(event.snapshot)
    if (event.type === 'order-served' && event.detail.customer) sendCustomerBackToStreet(event.detail.customer)
  })

  window.setInterval(() => {
    const snapshot = pizzeriaShift.snapshot()
    if (snapshot.approaching.length + snapshot.queue.length < snapshot.maxQueue) pizzeriaShift.spawn()
  }, 18000)

  window.setInterval(() => syncTownActors(), 900)

  document.addEventListener('slice-and-stitch:kitchen-status', (event) => {
    latestKitchenInfo = event.detail
    refreshKitchenShiftStatus()
  })

  function syncProgress() {
    const progression = window.sliceAndStitchProgression?.getSnapshot?.()
    gameFrame.hud.querySelector('[data-hub-coins]').textContent = coinSource?.textContent || '120'
    gameFrame.hud.querySelector('[data-hub-reputation]').textContent = reputationSource?.textContent || '0'
    gameFrame.hud.querySelector('[data-hub-day]').textContent = `Day ${progression?.day || 1}`
    const clock=window.sliceAndStitchClock?.getSnapshot?.()
    gameFrame.hud.querySelector('[data-hub-phase-label]').textContent = clock ? `${clock.time} · ${clock.phaseLabel}${clock.paused?' · Paused':''}` : 'Morning'
  }

  function currentProgress() {
    const progression = window.sliceAndStitchProgression?.getSnapshot?.()
    return {
      day: progression?.day || 1,
      reputation: Number(reputationSource?.textContent || window.sliceAndStitchEconomy?.reputation?.() || 0),
      atelierLevel: progression?.atelierLevel || 1,
    }
  }

  function closeDrawer() {
    if(onboarding) return
    characterCreator?.close()
    drawer.hidden = true
    drawer.classList.remove('is-character-creator')
    sceneStage.classList.remove('has-open-drawer')
  }

  function showToast(message) {
    window.clearTimeout(toastTimer)
    toast.textContent = message
    toast.hidden = false
    toastTimer = window.setTimeout(() => { toast.hidden = true }, 3400)
  }
  document.addEventListener('slice-and-stitch:toast',event=>showToast(event.detail?.message || ''))
  document.addEventListener('slice-and-stitch:open-pattern-shop',()=>{
    goToScene('tailor')
    openShop('tailor-shop')
  })

  function renderScene({ focus = true } = {}) {
    const scene = WORLD_SCENES[navigator.current()]
    sceneStage.dataset.scene = scene.id
    sceneStage.setAttribute('aria-label', scene.title)
    sceneArt.className = `hub-scene-art ${scene.artClass}`
    sceneArt.style.backgroundImage = `url("${scene.art}")`
    gameFrame.setScene(scene)
    sceneMotion.innerHTML = sceneMotionMarkup(scene.id)
    delete sceneStage.dataset.attention
    actorDirector.render(scene.id)
    hotspots.innerHTML = scene.hotspots.map(hotspotMarkup).join('')
    refreshKitchenShiftStatus()
    closeDrawer()
    document.title = `${scene.title} — Slice & Stitch`
    history.replaceState({ sliceAndStitchScene: scene.id }, '', `#${scene.id}`)
  }

  function goToScene(sceneId, options) {
    if(onboarding) return false
    if (!navigator.go(sceneId)) return false
    document.dispatchEvent(new CustomEvent('slice-and-stitch:workshop-paused'))
    shell.hidden = false
    appShell.hidden = true
    returnDock.hidden = true
    document.body.dataset.worldView = 'hub'
    delete document.body.dataset.workshop
    delete document.body.dataset.station
    gameFrame.setMode('hub')
    syncProgress()
    renderScene(options)
    publishActivity(sceneId,'idle')
    if (pendingGarmentNotice) {
      pendingGarmentNotice = false
      showToast('Your handmade garment is waiting in the character wardrobe.')
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return true
  }

  function publishActivity(sceneId,activity) {
    document.dispatchEvent(new CustomEvent('slice-and-stitch:player-activity',{detail:{sceneId,activity}}))
  }

  async function openWorkshop(workshop, sourceScene, kitchenGame = null) {
    if(onboarding) return
    const station=kitchenGame || workshop
    if(window.sliceAndStitchCoop?.active) {
      const result=await window.sliceAndStitchCoop.enterStation(station)
      if(!result.ok) {showToast(result.reason);return}
    }
    returnScene = sourceScene
    closeDrawer()
    document.querySelector(`.app-shell [data-workshop="${workshop}"]`)?.click()
    if (kitchenGame) document.querySelector(`[data-kitchen-game="${kitchenGame}"]`)?.click()
    shell.hidden = true
    appShell.hidden = false
    returnDock.hidden = false
    const returnLabels = { street: 'Street', home: 'Home', restaurant: 'Dining room', kitchen: 'Kitchen', tailor: 'Tailor shop', boutique: 'Boutique' }
    returnDock.querySelector('[data-return-room]').textContent = `← ${returnLabels[sourceScene] || 'Back'}`
    document.body.dataset.worldView = 'workshop'
    document.body.dataset.workshop = workshop
    document.body.dataset.station = kitchenGame || workshop
    gameFrame.setMode('workshop', workshop)
    publishActivity(workshop==='fashion'?'tailor':sourceScene,station)
    document.dispatchEvent(new CustomEvent('slice-and-stitch:station-entered',{detail:{station}}))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  document.addEventListener('slice-and-stitch:open-kitchen-station',event=>{
    const station=event.detail?.station
    if(station === 'pizza') openWorkshop('pizza','kitchen')
    else if(['saucePot','doughToss','dishwashing','drinkPour'].includes(station)) openWorkshop('kitchen','kitchen',station)
  })

  function launchMinigame(stationId) {
    const station = MINIGAME_STATIONS[stationId]
    if (!station) return false
    const sourceScene = navigator.current()
    const customLauncher = launchers.get(stationId)
    if (customLauncher) {
      customLauncher({ station, sourceScene, returnToHub: goToScene })
      return true
    }

    const request = new CustomEvent(HUB_LAUNCH_EVENT, {
      bubbles: true,
      cancelable: true,
      detail: Object.freeze({ stationId, station, sourceScene }),
    })
    const claimed = !document.dispatchEvent(request)
    if (claimed) {
      returnScene = sourceScene
      return true
    }
    if (station.workshop) {
      openWorkshop(station.workshop, sourceScene, station.kitchenGame)
      return true
    }

    drawerContent.innerHTML = `<span class="hub-drawer-eyebrow">Kitchen station</span>
      <h2>${station.title}</h2><p>${station.description}</p>
      <div class="hub-station-ready"><i aria-hidden="true">✓</i><span><b>Hub connection ready</b><small>This station now emits <code>${station.id}</code>. Its minigame can plug in without changing this room.</small></span></div>
      <button class="hub-drawer-primary" type="button" data-close-drawer>Back to the kitchen</button>`
    drawer.hidden = false
    sceneStage.classList.add('has-open-drawer')
    drawerContent.querySelector('h2')?.focus?.()
    return false
  }

  let boutiqueSearch=''
  let patternShopSearch=''
  function filterBoutique(query) {
    boutiqueSearch=query
    const terms=query.toLowerCase().trim().split(/\s+/).filter(Boolean)
    const cards=[...drawerContent.querySelectorAll('.hub-shop-item')]
    let count=0
    for(const card of cards) {
      const text=card.textContent.toLowerCase()
      card.hidden=!terms.every(term=>text.includes(term))
      if(!card.hidden) count++
    }
    drawerContent.querySelector('[data-shop-search-count]').textContent=terms.length?`${count} matching piece${count===1?'':'s'}`:'Featured rail and every unlocked piece'
    for(const group of drawerContent.querySelectorAll('.hub-catalog-group')) {
      group.hidden=Boolean(terms.length) && ![...group.querySelectorAll('.hub-shop-item')].some(card=>!card.hidden)
      if(terms.length && !group.hidden) group.open=true
    }
    if(terms.length) drawerContent.querySelector('.hub-catalog-archive').open=true
  }
  function openShop(catalogId) {
    const catalog = SHOP_CATALOGS[catalogId]
    if (!catalog) return
    publishActivity(navigator.current(),catalogId)
    characterCreator.close()
    drawer.classList.remove('is-character-creator')
    const { day, reputation, atelierLevel } = currentProgress()
    const character = characterStore.snapshot()
    if (catalogId === 'boutique-shop') {
      const garments = boutiqueCatalogForDay(day, reputation, atelierLevel)
      const owned = new Set(character.wardrobe)
      const equipped = new Set(Object.values(character.profile.equipped).filter(Boolean))
      const daily = garments.filter((item) => item.featured)
      const archive = garments.filter((item) => !item.featured && !item.locked)
      drawerContent.innerHTML = `<span class="hub-drawer-eyebrow">${catalog.eyebrow}</span><h2 tabindex="-1">${catalog.title}</h2><p>${catalog.copy}</p>
        <div class="hub-shop-summary"><span><b>${atelierLevel}/12</b><small>atelier level</small></span><span><b>${daily.length}</b><small>on today\'s rail</small></span><span><b>${garments.length}</b><small>catalogue pieces</small></span></div>
        <span class="hub-shop-section-label">Today\'s rail</span><div class="hub-shop-list is-daily">${daily.map((item) => itemMarkup(item, { owned: owned.has(item.id), equipped: equipped.has(item.id) })).join('')}</div>
        ${setBonusMarkup(character)}
        <details class="hub-catalog-archive"><summary>Order any unlocked piece <b>${archive.length}</b></summary>${catalogueGroupsMarkup(archive, (item) => ({ owned: owned.has(item.id), equipped: equipped.has(item.id) }))}</details>`
    } else {
      const liveInventory = window.sliceAndStitchFashion?.getDailyInventory?.() || tailorStockForDay(day, reputation, atelierLevel)
      const liveFabricIds = new Set(liveInventory.fabrics.map((fabric) => fabric.id))
      const materialArchive = FASHION_FABRICS.filter((fabric) => !liveFabricIds.has(fabric.id))
      drawerContent.innerHTML = `<span class="hub-drawer-eyebrow">${catalog.eyebrow}</span><h2 tabindex="-1">${catalog.title}</h2><p>${catalog.copy}</p>
        <div class="hub-shop-summary"><span><b>${(liveInventory.patterns || []).filter(pattern=>pattern.owned).length}</b><small>patterns owned</small></span><span><b>${liveInventory.fabrics.length}</b><small>cloth types</small></span><span><b>${liveInventory.level}</b><small>atelier level</small></span></div>
        <p>Buy a paper pattern once and keep it forever. Pattern prices are about 12% of a ready-made piece; material is paid separately when you start cutting.</p>
        ${patternShopMarkup(liveInventory)}
        <span class="hub-shop-section-label">Cloth cabinet · base prices per unit</span><div class="hub-fabric-stock">${liveInventory.fabrics.map((fabric) => `<article style="--fabric-color:${fabric.color};--fabric-pattern:${fabric.pattern}"><i aria-hidden="true"></i><span><b>${fabric.label}</b><small>${fabric.fiber} · ${fabric.featured && fabric.remaining>0 ? `${fabric.remaining} shelf units · 10% off` : 'standard supply · always available'}</small></span><strong>${fabric.cost} ● / unit</strong></article>`).join('')}</div>
        <details class="hub-material-archive"><summary>Material archive <b>${materialArchive.length}</b></summary><p>Premium cloth and hides become available at their matching atelier level. All unlocked materials can be ordered at the cutting table.</p><div class="hub-fabric-stock">${materialArchive.map((fabric) => `<article class="${fabric.unlockLevel > liveInventory.level ? 'is-locked' : ''}" style="--fabric-color:${fabric.color};--fabric-pattern:${fabric.pattern}"><i aria-hidden="true"></i><span><b>${fabric.label}</b><small>${fabric.fiber} · ${fabric.unlockLevel > liveInventory.level ? `atelier ${fabric.unlockLevel}` : 'unlocked, not stocked today'}</small></span><strong>${fabric.unlockLevel > liveInventory.level ? 'Locked' : `${fabric.cost} ●`}</strong></article>`).join('')}</div></details>
        <button class="hub-drawer-primary" type="button" data-launch-tailoring>Open the cutting table</button>`
    }
    drawer.dataset.panel = catalogId
    drawer.hidden = false
    sceneStage.classList.add('has-open-drawer')
    drawerContent.querySelector('h2')?.focus()
    if(catalogId==='boutique-shop') {
      const search=document.createElement('label');search.className='hub-shop-search'
      search.innerHTML='<span>Find a look</span><input type="search" aria-label="Search unlocked boutique clothes" placeholder="Skirt, leather, green…"><small data-shop-search-count></small>'
      drawerContent.querySelector('.hub-shop-summary').after(search)
      const input=search.querySelector('input');input.value=boutiqueSearch
      input.addEventListener('input',()=>filterBoutique(input.value))
      filterBoutique(boutiqueSearch)
    } else {
      const input=drawerContent.querySelector('[aria-label="Search purchasable and owned patterns"]')
      const filter=()=>{
        patternShopSearch=input.value
        const terms=patternShopSearch.trim().toLowerCase().split(/\s+/).filter(Boolean)
        let count=0
        drawerContent.querySelectorAll('[data-pattern-shop-record]').forEach(card=>{
          card.hidden=!terms.every(term=>card.textContent.toLowerCase().includes(term))
          if(!card.hidden) count++
        })
        drawerContent.querySelector('[data-pattern-search-count]').textContent=`${count} matching patterns`
      }
      input.value=patternShopSearch;input.addEventListener('input',filter);filter()
    }
  }

  function openPanel(panelId, creatorPanel = 'clothes', garmentId = null) {
    if(panelId==='wardrobe') publishActivity(navigator.current(),creatorPanel==='face'?'mirror':'wardrobe')
    if(panelId==='bed') {
      publishActivity('home','bed')
      characterCreator.close();drawer.classList.remove('is-character-creator')
      drawer.dataset.panel='bed';drawer.hidden=false;sceneStage.classList.add('has-open-drawer')
      renderBed();return
    }
    if(panelId==='day-journal') {
      characterCreator.close();drawer.classList.remove('is-character-creator')
      drawerContent.innerHTML=economyJournalMarkup(window.sliceAndStitchEconomy?.getJournal?.(),isFashionPlaytest())
      drawer.dataset.panel=panelId;drawer.hidden=false;sceneStage.classList.add('has-open-drawer')
      drawerContent.querySelector('h2')?.focus();return
    }
    if (SHOP_CATALOGS[panelId]) {
      openShop(panelId)
      return
    }
    characterCreator.close()
    drawer.classList.remove('is-character-creator')
    if (panelId === 'orders') {
      const shift = pizzeriaShift.snapshot()
      const queued = shift.queue.map((customer, index) => `<li class="${customer.status === 'preparing' ? 'is-current' : ''}"><span>${index + 1}</span><div><b>${customer.name}</b><small>${customer.status === 'preparing' ? 'Order in the kitchen' : 'Waiting at the counter'}</small></div></li>`).join('')
      drawerContent.innerHTML = `<span class="hub-drawer-eyebrow">Front counter</span><h2 tabindex="-1">Today\'s order line</h2><p>The room itself shows who is waiting. This board adds the service details without covering the restaurant.</p><div class="hub-order-panel"><strong>${shift.queue.length}<small>orders waiting</small></strong><strong>${shift.dirtyDishes}<small>dirty dishes</small></strong></div><ol class="hub-order-list">${queued || '<li class="is-empty"><div><b>The counter is clear</b><small>The next neighbor is on the way.</small></div></li>'}</ol><div class="hub-drawer-button-row"><button class="hub-drawer-primary" type="button" data-map-scene="kitchen">Head through to the kitchen</button><button class="hub-drawer-secondary" type="button" data-open-upgrades>Equipment counter</button></div>`
    } else if (panelId === 'wardrobe') {
      drawer.dataset.panel = 'character-creator'
      drawer.classList.add('is-character-creator')
      drawer.hidden = false
      sceneStage.classList.add('has-open-drawer')
      characterCreator.open({ panel: creatorPanel, garmentId })
      return
    } else {
      const snapshot = window.sliceAndStitchProgression?.getSnapshot?.()
      const milestones = snapshot?.milestones || []
      const next = snapshot?.nextMilestone
      const requirements = next?.requirements?.map((requirement) => {
        if (requirement.metric === 'upgrade') return requirement.complete ? 'Equipment installed' : 'Install the named counter upgrade'
        return `${requirement.current}/${requirement.target} ${requirement.label}`
      }).join(' · ') || 'Every atelier milestone is complete.'
      drawerContent.innerHTML = `<span class="hub-drawer-eyebrow">Equipment counter</span><h2 tabindex="-1">Tools for every station</h2><p>Lifetime service income opens clothing collections; crafting can bring them forward. Equipment is optional and improves the station named below.</p>
        <div class="hub-upgrade-status"><span><b>Atelier ${snapshot?.atelierLevel || 1}/12</b><small>${next ? `Next: ${next.label}` : 'Master atelier complete'}</small></span><span><b>${snapshot?.balance ?? 0} ●</b><small>${requirements}</small></span></div>
        <div class="hub-milestone-rail" aria-label="Atelier milestone progress">${milestones.map((milestone) => `<i class="${milestone.level <= (snapshot?.atelierLevel || 1) ? 'is-complete' : milestone.level === next?.level ? 'is-next' : milestone.complete ? 'is-achieved' : ''}" title="Level ${milestone.level}: ${milestone.label}">${milestone.level}</i>`).join('')}</div>
        <div class="hub-counter-upgrades">${(snapshot?.upgrades || []).map((upgrade) => `<article class="${upgrade.owned ? 'is-owned' : upgrade.available ? 'is-available' : 'is-locked'}"><i aria-hidden="true">${upgrade.icon}</i><span><small>${upgrade.station} · atelier ${upgrade.atelierLevel}</small><b>${upgrade.name}</b><p>${upgrade.effect}</p></span><button type="button" data-buy-upgrade="${upgrade.id}" ${upgrade.available ? '' : 'disabled'}>${upgrade.owned ? 'Installed' : upgrade.available ? `${upgrade.cost} ●` : upgrade.reason}</button></article>`).join('')}</div>`
    }
    drawer.dataset.panel = panelId
    drawer.hidden = false
    sceneStage.classList.add('has-open-drawer')
    drawerContent.querySelector('h2')?.focus()
  }

  function performAction(hotspotId) {
    const scene = WORLD_SCENES[navigator.current()]
    const hotspot = scene.hotspots.find((item) => item.id === hotspotId)
    if (!hotspot) return
    const { action } = hotspot
    actorDirector.lookPlayerAt(hotspot.x, hotspot.y)
    if (action.type === 'scene') goToScene(action.target)
    if (action.type === 'minigame') launchMinigame(action.target)
    if (action.type === 'panel') openPanel(action.target, hotspotId === 'home-mirror' ? 'face' : 'clothes')
  }

  function renderBed() {
    const room=window.sliceAndStitchCoop?.getSnapshot?.()
    const online=Boolean(room?.active),sleeping=room?.state?.sleeping || {}
    const me=room?.playerId || playerAccount().id
    const members=online ? (room.members || []).filter(m=>m.sessionId===room.state?.sessionId) : []
    if(online && !members.some(m=>m.playerId===me)) members.unshift({playerId:me,profile:characterStore.snapshot().profile})
    const safe=value=>String(value || 'Player').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
    drawerContent.innerHTML=`<span class="hub-drawer-eyebrow">A fresh morning</span><h2 tabindex="-1">Rest until tomorrow</h2><p>Refresh Mara’s daily pattern shipment and cloth shelf. Your money, owned patterns, clothes, supplies and unfinished projects stay safe. Sleeping does not earn income or put out burning sauce.</p>
      ${online?`<ul class="coop-members">${members.map(m=>`<li><i aria-hidden="true">${sleeping[m.playerId]?'☾':'○'}</i>${safe(m.profile?.name)}<small>${sleeping[m.playerId]?'In bed':'Still awake'}</small></li>`).join('')}</ul><p>Every connected player must be in bed before the next morning begins. Leaving home cancels your bedtime vote.</p>`:'<p>Wake up at 06:00 on the next day. No need to wait for the clock.</p>'}
      <button type="button" class="hub-drawer-primary" ${online && !room.ready?'disabled':''} ${sleeping[me]?'data-wake-up':'data-go-to-bed'}>${sleeping[me]?'Wake up · cancel bedtime':'☾ Go to bed'}</button>`
  }
  document.addEventListener('slice-and-stitch:sleep-status',()=>{if(!drawer.hidden && drawer.dataset.panel==='bed') renderBed()})

  function hotspotFromControl(control) {
    const scene = WORLD_SCENES[navigator.current()]
    const hotspotId = control?.dataset.hotspot
    return scene.hotspots.find((item) => item.id === hotspotId)
  }

  function pointPlayerAt(control) {
    const hotspot = hotspotFromControl(control)
    if (!hotspot) return
    sceneStage.dataset.attention = hotspot.id
    actorDirector.lookPlayerAt(hotspot.x, hotspot.y)
  }

  function releasePlayerAttention(control, relatedTarget) {
    if (relatedTarget && control?.contains(relatedTarget)) return
    const nextControl = relatedTarget?.closest?.('[data-hotspot]')
    if (nextControl) {
      pointPlayerAt(nextControl)
      return
    }
    delete sceneStage.dataset.attention
    actorDirector.clearPlayerLook()
  }

  shell.addEventListener('pointerover', (event) => {
    const control = event.target.closest('[data-hotspot]')
    if (control) pointPlayerAt(control)
  })

  shell.addEventListener('pointerout', (event) => {
    const control = event.target.closest('[data-hotspot]')
    if (control) releasePlayerAttention(control, event.relatedTarget)
  })

  shell.addEventListener('focusin', (event) => {
    const control = event.target.closest('[data-hotspot]')
    if (control) pointPlayerAt(control)
  })

  shell.addEventListener('focusout', (event) => {
    const control = event.target.closest('[data-hotspot]')
    if (control) releasePlayerAttention(control, event.relatedTarget)
  })

  gameFrame.panel.addEventListener('click', async (event) => {
    if(onboarding && !event.target.closest('.character-creator')) return
    const bedtimeButton=event.target.closest('[data-go-to-bed],[data-wake-up]')
    if(bedtimeButton) {
      bedtimeButton.disabled=true
      const result=await (bedtimeButton.hasAttribute('data-wake-up')?window.sliceAndStitchClock.wakeUp():window.sliceAndStitchClock.goToBed())
      if(!result.ok) showToast(result.reason)
      else if(result.advanced) {closeDrawer();showToast(`Good morning · Day ${result.day}. New patterns and cloth are at Mara’s.`)}
      else renderBed()
      return
    }
    if(event.target.closest('[data-day-journal]')) {openPanel('day-journal');return}
    if(event.target.closest('[data-journal-clock-toggle]')) {await window.sliceAndStitchClock?.togglePause();openPanel('day-journal');return}
    if(event.target.closest('[data-test-clock-advance]')) {window.sliceAndStitchClock?.advanceForTest();openPanel('day-journal');return}
    if (event.target.closest('.character-creator')) {
      characterCreator.handleClick(event)
      return
    }
    const hotspot = event.target.closest('[data-hotspot]')
    if (hotspot) {
      performAction(hotspot.dataset.hotspot)
      return
    }
    const alterButton = event.target.closest('[data-modify-garment]')
    if (alterButton) {
      const garment = findGarment(characterStore.snapshot(), alterButton.dataset.modifyGarment)
      if (!garment || !window.sliceAndStitchFashion?.beginAlteration?.(garment)) return
      openWorkshop('fashion', navigator.current())
      return
    }
    const shopButton = event.target.closest('[data-shop-item]')
    if (shopButton) {
      const item = FASHION_CATALOG_GARMENTS.find((garment) => garment.id === shopButton.dataset.shopItem)
      if (!item) return
      const character = characterStore.snapshot()
      const owned = character.wardrobe.includes(item.id)
      if (owned) {
        characterStore.equip(item.id)
        showToast(`${item.name} is now part of your look.`)
        openShop('boutique-shop')
        return
      }
      const progress = currentProgress()
      const offer = boutiqueCatalogForDay(progress.day, progress.reputation, progress.atelierLevel).find((garment) => garment.id === item.id)
      if (!offer?.availableToday || offer.locked) {
        showToast(offer?.locked ? `Reach atelier level ${offer.unlockLevel} to unlock this piece.` : 'That piece is in the catalogue, but not on today\'s rail.')
        return
      }
      if(window.sliceAndStitchCoop?.active) {
        shopButton.disabled=true
        const result=await window.sliceAndStitchCoop.transact('buy-garment',{id:item.id})
        shopButton.disabled=false
        if(!result.ok) {showToast(result.reason);return}
      } else if (!window.sliceAndStitchEconomy?.spend?.(offer.price)) {
        showToast(`You need ${offer.price} coins for ${item.name}.`)
        return
      }
      if(!window.sliceAndStitchCoop?.active) characterStore.addCatalog(item.id)
      const detail = Object.freeze({ catalogId: 'boutique-shop', itemId: item.id, action: 'purchase', price: offer.price })
      document.dispatchEvent(new CustomEvent(HUB_SHOP_EVENT, { detail }))
      syncProgress()
      showToast(`${item.name} added to your wardrobe.`)
      openShop('boutique-shop')
      return
    }
    const patternButton = event.target.closest('[data-tailor-pattern]')
    if (patternButton) {
      if(!window.sliceAndStitchFashion?.selectSchematic?.(patternButton.dataset.tailorPattern)) {
        showToast('Finish or release your current project before selecting another pattern.');return
      }
      openWorkshop('fashion', navigator.current())
      return
    }
    const buyPatternButton=event.target.closest('[data-buy-pattern]')
    if(buyPatternButton) {
      buyPatternButton.disabled=true
      const result=await window.sliceAndStitchFashion?.buyPattern?.(buyPatternButton.dataset.buyPattern)
      buyPatternButton.disabled=false
      if(!result?.ok) {showToast(result?.reason || 'This pattern is not available yet.');return}
      syncProgress();openShop('tailor-shop')
      showToast(`${result.pattern.name} is New in your pattern box. Open the cutting table to craft it.`)
      return
    }
    const upgradeButton = event.target.closest('[data-buy-upgrade]')
    if (upgradeButton) {
      upgradeButton.disabled=true
      const result = await window.sliceAndStitchProgression?.buyUpgrade?.(upgradeButton.dataset.buyUpgrade)
      upgradeButton.disabled=false
      if (!result?.ok) {
        showToast(result?.reason || 'That upgrade is not available yet.')
        return
      }
      syncProgress()
      showToast(`${result.upgrade.name} installed at the ${result.upgrade.station.toLowerCase()}.`)
      openPanel('upgrades')
      return
    }
    if (event.target.closest('[data-launch-tailoring]')) {
      openWorkshop('fashion', navigator.current())
      return
    }
    if (event.target.closest('[data-open-upgrades]')) {
      openPanel('upgrades')
      return
    }
    const mapButton = event.target.closest('[data-map-scene]')
    if (mapButton) {
      goToScene(mapButton.dataset.mapScene)
      return
    }
    if (event.target.closest('[data-close-drawer]')) closeDrawer()
  })

  gameFrame.panel.addEventListener('change', (event) => {
    if (event.target.closest('.character-creator')) characterCreator.handleChange(event)
  })

  returnDock.addEventListener('click', (event) => {
    if (event.target.closest('[data-return-room]')) goToScene(returnScene)
  })

  document.addEventListener(HUB_RETURN_EVENT, (event) => goToScene(event.detail?.sceneId || returnScene))
  document.addEventListener('slice-and-stitch:minigame', (event) => {
    const result = event.detail
    if (result?.type !== 'completed' || result?.kind !== 'fashion' || !result?.result?.garment) return
    const before = characterStore.snapshot().customGarments.length
    characterCreator.addFashionResult(result)
    if (characterStore.snapshot().customGarments.length > before) pendingGarmentNotice = true
  })
  document.addEventListener('slice-and-stitch:fashion-wardrobe', (event) => {
    const projectId=event.detail?.projectId
    const garment=characterStore.snapshot().customGarments.find(piece=>piece.customization?.projectId===projectId)
    if(!garment) return
    if(event.detail.wear) characterStore.equip(garment.id)
    pendingGarmentNotice=false
    goToScene('home')
    openPanel('wardrobe','clothes',garment.id)
    showToast(event.detail.wear ? `${garment.name} is now part of your look.` : `${garment.name} is safely in your clothing chest.`)
  })
  document.addEventListener('slice-and-stitch:progression-changed', () => {
    syncProgress()
    characterCreator.refresh()
    if (!drawer.hidden && drawer.dataset.panel === 'upgrades') openPanel('upgrades')
  })
  document.addEventListener('slice-and-stitch:shared-inventory',event=>characterStore.replaceSharedInventory(event.detail))
  document.addEventListener('slice-and-stitch:character-changed',()=>savePlayerProfile(characterStore.snapshot().profile))
  document.addEventListener('slice-and-stitch:time-changed',event=>{
    syncProgress()
    if(!event.detail?.newDay) return
    if(!drawer.hidden && drawer.dataset.panel==='bed') {renderBed();showToast(`Good morning · Day ${event.detail.day}. The daily shipment has refreshed.`)}
    if(!drawer.hidden && SHOP_CATALOGS[drawer.dataset.panel]) openShop(drawer.dataset.panel)
    if(!drawer.hidden && drawer.dataset.panel==='day-journal') openPanel('day-journal')
    if(!shell.hidden) showToast(`Day ${event.detail.day} · new shelf offers. Your current projects are safe.`)
  })
  document.addEventListener('keydown', (event) => {
    if (onboarding || event.key !== 'Escape' || gameFrame.panel.querySelector('dialog[open]')) return
    if (!drawer.hidden) closeDrawer()
    else if (!returnDock.hidden) goToScene(returnScene)
  })

  if (coinSource || reputationSource) {
    new MutationObserver(syncProgress).observe(document.querySelector('.wallet'), { childList: true, subtree: true, characterData: true })
  }

  const initialHash = location.hash.slice(1)
  navigator.reset(WORLD_SCENES[initialHash] ? initialHash : 'street')
  appShell.hidden = true
  document.body.dataset.worldView = 'hub'
  syncProgress()
  renderScene({ focus: false })

  let onlineActorsSignature=''

  window.sliceAndStitchHub = Object.freeze({
    eventName: HUB_LAUNCH_EVENT,
    scenes: WORLD_SCENES,
    stations: MINIGAME_STATIONS,
    getSnapshot: () => Object.freeze({ sceneId: navigator.current(), mode: shell.hidden ? 'minigame' : 'hub', returnScene }),
    showToast,
    applyOnlinePlayers(players,playerId,inventory) {
      const signature=JSON.stringify([players,inventory.wardrobe,inventory.customGarments])
      if(signature===onlineActorsSignature) return
      onlineActorsSignature=signature
      const local=players.find(p=>p.playerId===playerId)
      if(local) actorDirector.setPlayerLocation(local)
      actorDirector.setGroup('online-players',players.filter(p=>p.playerId!==playerId).map(p=>({sceneId:p.sceneId,actor:{
        id:`online-${p.playerId}`,role:'player',name:p.profile.name,x:p.x,y:p.y,sessionScale:p.sessionScale,
        character:sharedCharacterState(p.profile,inventory),profile:p.profile,route:null,pose:'standing',facing:'down',
      }})))
    },
    navigate: (sceneId) => goToScene(sceneId),
    returnToHub: (sceneId = returnScene) => goToScene(sceneId),
    registerMinigame(stationId, launcher) {
      if (!MINIGAME_STATIONS[stationId] || typeof launcher !== 'function') return () => {}
      launchers.set(stationId, launcher)
      return () => launchers.delete(stationId)
    },
    actors: Object.freeze({
      add: (sceneId, actor) => actorDirector.add(sceneId, actor),
      setPlayerAppearance: (appearance) => actorDirector.setPlayerAppearance(appearance),
      getSnapshot: () => actorDirector.snapshot(),
    }),
    character: Object.freeze({
      getSnapshot: () => characterStore.snapshot(),
      open: () => {
        if (navigator.current() !== 'home') goToScene('home')
        openPanel('wardrobe')
      },
    }),
  })
  if(onboarding) {
    navigator.reset('home');renderScene({focus:false})
    if(!clockWasPaused) window.sliceAndStitchClock?.togglePause()
    gameFrame.panel.dataset.onboarding='true'
    openPanel('wardrobe','face')
  }
}

if (typeof document !== 'undefined') initHub()
