import test from 'node:test'
import assert from 'node:assert/strict'

import {
  distanceToStroke,
  sauceHoldState,
  scoreDrink,
  scoreTossGesture,
  scrubGrimeStroke,
} from '../kitchen-minigames.js'

test('an unattended sauce pot escalates from safe to warning to smoke', () => {
  assert.equal(sauceHoldState(4000).key, 'safe')
  assert.equal(sauceHoldState(180000).key, 'watch')
  assert.equal(sauceHoldState(240000).key, 'smoking')
})

test('a precise single-flavor drink scores above an overfilled or mixed drink', () => {
  const precise = scoreDrink(0.81, 0.8, true, false)
  const overfilled = scoreDrink(1.12, 0.8, true, false)
  const mixed = scoreDrink(0.81, 0.8, true, true)
  assert.ok(precise > 90)
  assert.ok(precise > overfilled)
  assert.ok(precise > mixed)
})

test('dough tossing rewards a tall straight gesture', () => {
  const clean = scoreTossGesture(12, -180)
  const sideways = scoreTossGesture(145, -180)
  const downward = scoreTossGesture(0, 80)
  assert.ok(clean > 90)
  assert.ok(clean > sideways)
  assert.equal(downward, 0)
})

test('dish scrubbing only wears grime close to the actual sponge stroke', () => {
  const grime = [
    { x: 50, y: 52, radius: 8, amount: 1 },
    { x: 50, y: 120, radius: 8, amount: 1 },
  ]
  const scrubbed = scrubGrimeStroke(grime, { x: 10, y: 50 }, { x: 90, y: 50 }, 18, 0.25)
  assert.equal(scrubbed[0].amount, 0.75)
  assert.equal(scrubbed[1].amount, 1)
  assert.equal(distanceToStroke({ x: 50, y: 50 }, { x: 10, y: 50 }, { x: 90, y: 50 }), 0)
})

test('baked-on grime needs repeated localized passes', () => {
  let grime = [{ x: 50, y: 50, radius: 8, amount: 1 }]
  grime = scrubGrimeStroke(grime, { x: 10, y: 50 }, { x: 90, y: 50 }, 18, 0.24)
  assert.equal(grime.length, 1)
  grime = scrubGrimeStroke(grime, { x: 90, y: 50 }, { x: 10, y: 50 }, 18, 0.8)
  assert.equal(grime.length, 0)
})
