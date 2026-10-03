import test from 'node:test'
import assert from 'node:assert/strict'
import {
  bakeWindowFor,
  calculatePayout,
  countTargetFor,
  coverageTargetFor,
  craftQuality,
  nextPhase,
  presentationBonus,
  scoreCoverage,
  scoreCuts,
  scoreToppings,
  scoreTrace,
} from '../model.js'

test('order qualifiers translate to hidden kitchen targets', () => {
  assert.equal(coverageTargetFor('light', 'sauce'), 0.52)
  assert.equal(coverageTargetFor('extra', 'cheese'), 0.82)
  assert.equal(coverageTargetFor('regular', 'finish'), 0.3)
  assert.deepEqual(bakeWindowFor('crispy'), [0.73, 0.81])
})

test('portion words adjust recipe counts without making light portions vanish', () => {
  assert.equal(countTargetFor(6, 'light'), 4)
  assert.equal(countTargetFor(6, 'extra'), 8)
  assert.equal(countTargetFor(1, 'light'), 1)
})

test('coverage rewards an even layer near the target', () => {
  assert.equal(scoreCoverage(0), 0)
  assert.equal(scoreCoverage(0.78), 100)
  assert.ok(scoreCoverage(0.98) < 100)
})

test('topping score rewards matching the ticket', () => {
  const required = { pepperoni: 2, basil: 1 }
  assert.equal(scoreToppings(required, [
    { type: 'pepperoni' },
    { type: 'pepperoni' },
    { type: 'basil' },
  ]), 100)
  assert.ok(scoreToppings(required, [{ type: 'pepperoni' }]) < 60)
})

test('trace score distinguishes a careful line from a distant one', () => {
  const guide = [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 100, y: 0 }]
  const careful = [{ x: 0, y: 1 }, { x: 50, y: -1 }, { x: 100, y: 1 }]
  const distant = [{ x: 0, y: 80 }, { x: 50, y: 80 }, { x: 100, y: 80 }]
  assert.ok(scoreTrace(careful, guide, 20) > 90)
  assert.ok(scoreTrace(distant, guide, 20) < 10)
})

test('three centered evenly-spaced cuts score well', () => {
  const cuts = [0, 60, 120].map((degrees) => {
    const radians = degrees * Math.PI / 180
    return {
      start: { x: 300 - Math.cos(radians) * 240, y: 300 - Math.sin(radians) * 240 },
      end: { x: 300 + Math.cos(radians) * 240, y: 300 + Math.sin(radians) * 240 },
    }
  })
  assert.ok(scoreCuts(cuts) > 95)
})

test('cut scoring adapts to four-slice and eight-slice orders', () => {
  const centeredCuts = (count) => Array.from({ length: count }, (_, index) => {
    const radians = index * (180 / count) * Math.PI / 180
    return {
      start: { x: 300 - Math.cos(radians) * 240, y: 300 - Math.sin(radians) * 240 },
      end: { x: 300 + Math.cos(radians) * 240, y: 300 + Math.sin(radians) * 240 },
    }
  })
  assert.ok(scoreCuts(centeredCuts(2), { x: 300, y: 300 }, 2) > 95)
  assert.ok(scoreCuts(centeredCuts(4), { x: 300, y: 300 }, 4) > 95)
})

test('craft quality preserves the intended weights', () => {
  assert.equal(craftQuality({ execution: 100, material: 100, mastery: 100, tools: 100, luck: 100 }), 100)
  assert.equal(craftQuality({ execution: 100, material: 0, mastery: 0, tools: 0, luck: 0 }), 40)
})

test('outfit presentation is capped at eight percent', () => {
  assert.equal(presentationBonus(100), 0.08)
  assert.equal(presentationBonus(1000), 0.08)
})

test('better food and clothing increase payout without exceeding their caps', () => {
  const plain = calculatePayout({ foodQuality: 70 })
  const dressed = calculatePayout({ foodQuality: 70, presentation: 0.08 })
  assert.ok(dressed > plain)
  assert.equal(calculatePayout({ foodQuality: 70, presentation: 99 }), calculatePayout({ foodQuality: 70, presentation: 0.2 }))
})

test('day phase advances in a fixed cycle', () => {
  assert.equal(nextPhase('morning'), 'noon')
  assert.equal(nextPhase('noon'), 'dusk')
  assert.equal(nextPhase('dusk'), 'night')
  assert.equal(nextPhase('night'), 'morning')
})
