import test from 'node:test'
import assert from 'node:assert/strict'

import {
  atelierLevelFor,
  createProgressionState,
  progressionSnapshot,
  purchaseUpgrade,
  recordGarmentResult,
  recordPizzaResult,
  upgradeAvailability,
} from '../progression.js'

test('lifetime income unlocks collections without forced equipment or precision walls', () => {
  let progress = createProgressionState()
  assert.equal(atelierLevelFor(progress), 1)

  progress = recordPizzaResult(progress, { quality: 84, payout: 104 })
  assert.equal(progress.atelierLevel, 2)

  const purchase = purchaseUpgrade(progress, 'sauce-ladle', 120)
  assert.equal(purchase.ok, true)
  assert.equal(purchase.balance, 50)
  assert.equal(purchase.progression.atelierLevel, 2)

  progress = recordGarmentResult(purchase.progression, { accuracy: 88, quality: 80 })
  assert.equal(progress.atelierLevel, 2)
  progress=recordPizzaResult(progress,{quality:40,payout:76})
  assert.equal(progress.atelierLevel,3)
})

test('good crafting offers a bounded income shortcut and records best accuracy', () => {
  let progress = createProgressionState({
    stats: { coinsEarned: 600, bestPizzaQuality: 85, garmentsCrafted:3 },
    ownedUpgrades: ['sauce-ladle', 'pizza-garden'],
  })
  progress = recordGarmentResult(progress, { accuracy: 94, quality: 99 })
  assert.equal(progress.atelierLevel, 6)
  progress = recordGarmentResult(progress, { accuracy: 95, quality: 72 })
  assert.equal(progress.atelierLevel, 6)
  assert.equal(progress.stats.bestGarmentAccuracy, 95)
})

test('counter upgrades respect level, prerequisite, and balance gates', () => {
  const starter = createProgressionState()
  assert.match(upgradeAvailability(starter, 'pizza-garden', 999).reason, /level 3/i)

  const experienced = createProgressionState({
    stats: { coinsEarned: 700, bestPizzaQuality: 86, bestGarmentAccuracy: 90 },
    ownedUpgrades: ['sauce-ladle'],
  })
  assert.equal(experienced.atelierLevel, 6)
  assert.equal(upgradeAvailability(experienced, 'pizza-garden', 239).available, false)
  assert.equal(upgradeAvailability(experienced, 'pizza-garden', 240).available, true)
  assert.match(upgradeAvailability(experienced, 'tailor-feed-guide', 999).reason, /level 7/i)
})

test('progression snapshot exposes next milestone and every station upgrade', () => {
  const snapshot = progressionSnapshot(createProgressionState(), 120)
  assert.equal(snapshot.nextMilestone.id, 'first-payday')
  assert.equal(snapshot.upgrades.length, 12)
  assert.ok(snapshot.upgrades.some((upgrade) => upgrade.station === 'Tailoring table'))
  assert.ok(snapshot.upgrades.some((upgrade) => upgrade.station === 'Pizza counter'))
})
