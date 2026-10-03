export const PROGRESSION_STORAGE_KEY = 'slice-and-stitch.progression.v1'

export const COUNTER_UPGRADES = Object.freeze([
  Object.freeze({ id: 'sauce-ladle', station: 'Sauce pot', icon: '♨', name: 'Balanced brass ladle', cost: 70, atelierLevel: 1, effect: 'Mix sauce with fewer turns of the spoon.' }),
  Object.freeze({ id: 'dough-cloth', station: 'Dough table', icon: '○', name: 'Linen proofing cloths', cost: 90, atelierLevel: 1, effect: 'Clean catches stretch your dough 15% farther.' }),
  Object.freeze({ id: 'drink-regulator', station: 'Soda fountain', icon: '◌', name: 'Flow regulator', cost: 90, atelierLevel: 2, effect: 'The fountain pours more slowly near the order line.' }),
  Object.freeze({ id: 'dish-sprayer', station: 'Dish pit', icon: '≋', name: 'Brass rinse sprayer', cost: 100, atelierLevel: 2, effect: 'Rinsing takes noticeably less time.' }),
  Object.freeze({ id: 'tailor-shears', station: 'Tailoring table', icon: '✂', name: 'Hollow-ground shears', cost: 120, atelierLevel: 3, effect: 'Stay accurate while cutting a little farther from the guide.' }),
  Object.freeze({ id: 'pizza-garden', station: 'Pizza counter', icon: '◒', name: 'Garden ingredient rail', cost: 240, atelierLevel: 3, effect: 'Installs pesto, peppers, onions, and the market-pie menu.' }),
  Object.freeze({ id: 'sauce-diffuser', station: 'Sauce pot', icon: '♨', name: 'Cast-iron heat diffuser', cost: 180, atelierLevel: 5, requires: ['sauce-ladle'], effect: 'Sauce heats 30% more slowly between stirs.' }),
  Object.freeze({ id: 'dough-marble', station: 'Dough table', icon: '○', name: 'Marble stretching slab', cost: 220, atelierLevel: 6, requires: ['dough-cloth'], effect: 'Centered tosses gain a small accuracy and stretch bonus.' }),
  Object.freeze({ id: 'drink-chill-plate', station: 'Soda fountain', icon: '◌', name: 'Chilled fountain plate', cost: 230, atelierLevel: 6, requires: ['drink-regulator'], effect: 'Foam builds more slowly, making high fills easier to judge.' }),
  Object.freeze({ id: 'dish-drying-rack', station: 'Dish pit', icon: '≋', name: 'Raised drying rack', cost: 240, atelierLevel: 7, requires: ['dish-sprayer'], effect: 'Better drainage makes each scrub pass lift more grime.' }),
  Object.freeze({ id: 'tailor-feed-guide', station: 'Tailoring table', icon: '⌁', name: 'Adjustable seam guide', cost: 280, atelierLevel: 7, requires: ['tailor-shears'], effect: 'Sew accurately with more room for error and improve your garment’s appraisal.' }),
  Object.freeze({ id: 'pizza-artisan', station: 'Pizza counter', icon: '◒', name: 'Artisan finishing wing', cost: 640, atelierLevel: 8, requires: ['pizza-garden'], effect: 'Adds fresh mozzarella, olive-oil finishing, and artisan orders.' }),
])

// Lifetime income, not cash on hand: buying clothes can never delay unlocks.
// Good construction offers a 15% shortcut, never a compulsory precision wall.
const unlockIncome = [0,80,180,300,460,660,900,1180,1500,1860,2260,2700]
const unlockLabels = ['Open doors','First payday','Growing collection','Tailored essentials','Working atelier','Leather & velvet','Occasion wardrobe','Fine finishing','Heritage collection','Couture room','Signature atelier','Master atelier']
export const ATELIER_MILESTONES = Object.freeze(unlockIncome.map((target,index)=>Object.freeze({
  level:index+1, id:index===0?'open-doors':index===1?'first-payday':`atelier-${index+1}`,
  label:unlockLabels[index], copy:index===0?'Starter patterns, cottons and alterations are ready.'
    : `Earn ${target.toLocaleString('en-US')} lifetime service coins. Spending does not reduce progress.`,
  requirements:index===0?[]:[{metric:'coinsEarned',target}],
  shortcut:index<2?null:Object.freeze({income:Math.ceil(target*.85), garments:Math.max(1,index-1), accuracy:80}),
})))

const METRIC_LABELS = Object.freeze({
  coinsEarned: 'coins earned',
  bestPizzaQuality: 'best pizza',
  bestGarmentAccuracy: 'best accuracy',
  bestGarmentQuality: 'best garment',
  pizzasServed: 'pizzas served',
  garmentsCrafted: 'garments made',
  upgradesOwned: 'upgrades owned',
  upgrade: 'equipment installed',
})

const upgradeIds = new Set(COUNTER_UPGRADES.map((upgrade) => upgrade.id))

function cleanNumber(value) {
  return Math.max(0, Math.round(Number(value) || 0))
}

export function createProgressionState(saved = {}) {
  const stats = saved?.stats || {}
  const ownedUpgrades = [...new Set(Array.isArray(saved?.ownedUpgrades) ? saved.ownedUpgrades : [])]
    .filter((id) => upgradeIds.has(id))
  const progression = {
    stats: {
      coinsEarned: cleanNumber(stats.coinsEarned),
      bestPizzaQuality: cleanNumber(stats.bestPizzaQuality),
      bestGarmentAccuracy: cleanNumber(stats.bestGarmentAccuracy),
      bestGarmentQuality: cleanNumber(stats.bestGarmentQuality),
      pizzasServed: cleanNumber(stats.pizzasServed),
      garmentsCrafted: cleanNumber(stats.garmentsCrafted),
    },
    ownedUpgrades,
  }
  // Existing saves retain their highest unlocked collection after rebalancing.
  progression.atelierLevel = Math.max(Math.min(12, cleanNumber(saved?.atelierLevel) || 1), atelierLevelFor(progression))
  return progression
}

function metricValue(progression, requirement) {
  if (requirement.metric === 'upgradesOwned') return progression.ownedUpgrades.length
  if (requirement.metric === 'upgrade') return progression.ownedUpgrades.includes(requirement.id) ? 1 : 0
  return cleanNumber(progression.stats?.[requirement.metric])
}

export function milestoneStatus(progression, milestone) {
  const requirements = milestone.requirements.map((requirement) => {
    const current = metricValue(progression, requirement)
    const target = cleanNumber(requirement.target) || 1
    return Object.freeze({
      ...requirement,
      label: METRIC_LABELS[requirement.metric] || requirement.metric,
      current,
      target,
      complete: current >= target,
      progress: Math.min(1, current / target),
    })
  })
  const shortcut = milestone.shortcut && Object.freeze({...milestone.shortcut,
    complete:cleanNumber(progression.stats?.coinsEarned)>=milestone.shortcut.income
      && cleanNumber(progression.stats?.garmentsCrafted)>=milestone.shortcut.garments
      && cleanNumber(progression.stats?.bestGarmentAccuracy)>=milestone.shortcut.accuracy})
  const earned = (progression.atelierLevel || 1) >= milestone.level
  return Object.freeze({
    ...milestone,
    requirements: Object.freeze(requirements),
    shortcut,
    complete: earned || requirements.every((requirement) => requirement.complete) || Boolean(shortcut?.complete),
    progress: earned || shortcut?.complete ? 1 : requirements.length ? Math.min(...requirements.map((requirement) => requirement.progress)) : 1,
  })
}

export function atelierLevelFor(progression) {
  let level = Math.min(12, cleanNumber(progression.atelierLevel) || 1)
  for (const milestone of ATELIER_MILESTONES.slice(1)) {
    if (!milestoneStatus(progression, milestone).complete) break
    level = milestone.level
  }
  return level
}

export function recordPizzaResult(progression, { quality = 0, payout = 0 } = {}) {
  const next = createProgressionState(progression)
  next.stats.coinsEarned += cleanNumber(payout)
  next.stats.bestPizzaQuality = Math.max(next.stats.bestPizzaQuality, cleanNumber(quality))
  next.stats.pizzasServed += 1
  next.atelierLevel = atelierLevelFor(next)
  return next
}

export function recordGarmentResult(progression, { accuracy = 0, quality = 0 } = {}) {
  const next = createProgressionState(progression)
  next.stats.bestGarmentAccuracy = Math.max(next.stats.bestGarmentAccuracy, cleanNumber(accuracy))
  next.stats.bestGarmentQuality = Math.max(next.stats.bestGarmentQuality, cleanNumber(quality))
  next.stats.garmentsCrafted += 1
  next.atelierLevel = atelierLevelFor(next)
  return next
}

export function recordServiceIncome(progression, payout = 0) {
  const next=createProgressionState(progression)
  next.stats.coinsEarned+=cleanNumber(payout)
  next.atelierLevel=atelierLevelFor(next)
  return next
}

export function upgradeAvailability(progression, upgradeOrId, balance = 0) {
  const upgrade = typeof upgradeOrId === 'string'
    ? COUNTER_UPGRADES.find((item) => item.id === upgradeOrId)
    : upgradeOrId
  if (!upgrade) return Object.freeze({ available: false, owned: false, reason: 'Unknown upgrade.' })
  const owned = progression.ownedUpgrades.includes(upgrade.id)
  if (owned) return Object.freeze({ available: false, owned: true, reason: 'Installed' })
  if (progression.atelierLevel < upgrade.atelierLevel) {
    return Object.freeze({ available: false, owned: false, reason: `Requires atelier level ${upgrade.atelierLevel}` })
  }
  const missing = (upgrade.requires || []).filter((id) => !progression.ownedUpgrades.includes(id))
  if (missing.length) {
    const names = missing.map((id) => COUNTER_UPGRADES.find((item) => item.id === id)?.name || id)
    return Object.freeze({ available: false, owned: false, reason: `Install ${names.join(' + ')} first` })
  }
  if (cleanNumber(balance) < upgrade.cost) {
    return Object.freeze({ available: false, owned: false, reason: `Need ${upgrade.cost - cleanNumber(balance)} more coins` })
  }
  return Object.freeze({ available: true, owned: false, reason: `${upgrade.cost} coins` })
}

export function purchaseUpgrade(progression, upgradeId, balance = 0) {
  const upgrade = COUNTER_UPGRADES.find((item) => item.id === upgradeId)
  const status = upgradeAvailability(progression, upgrade, balance)
  if (!upgrade || !status.available) {
    return Object.freeze({ ok: false, reason: status.reason, balance: cleanNumber(balance), progression: createProgressionState(progression) })
  }
  const next = createProgressionState({
    ...progression,
    ownedUpgrades: [...progression.ownedUpgrades, upgrade.id],
  })
  next.atelierLevel = atelierLevelFor(next)
  return Object.freeze({ ok: true, upgrade, balance: cleanNumber(balance) - upgrade.cost, progression: next })
}

export function progressionSnapshot(progression, balance = 0) {
  const normalized = createProgressionState(progression)
  const milestones = ATELIER_MILESTONES.map((milestone) => milestoneStatus(normalized, milestone))
  const nextMilestone = milestones.find((milestone) => !milestone.complete) || null
  const upgrades = COUNTER_UPGRADES.map((upgrade) => Object.freeze({
    ...upgrade,
    ...upgradeAvailability(normalized, upgrade, balance),
  }))
  return Object.freeze({
    atelierLevel: normalized.atelierLevel,
    stats: Object.freeze({ ...normalized.stats }),
    ownedUpgrades: Object.freeze([...normalized.ownedUpgrades]),
    milestones: Object.freeze(milestones),
    nextMilestone,
    upgrades: Object.freeze(upgrades),
    balance: cleanNumber(balance),
  })
}
