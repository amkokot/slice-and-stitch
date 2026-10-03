import test from 'node:test'
import assert from 'node:assert/strict'

import { createPizzeriaShift } from '../pizzeria-shift.js'

test('customers move from the street into an order queue', () => {
  const shift = createPizzeriaShift({ maxQueue: 3 })
  const approaching = shift.spawn({ name: 'Test customer' })

  assert.equal(shift.snapshot().approaching.length, 1)
  assert.equal(shift.snapshot().queue.length, 0)

  const entered = shift.admit(approaching.id)
  assert.equal(entered.status, 'waiting')
  assert.equal(shift.snapshot().approaching.length, 0)
  assert.equal(shift.snapshot().queue[0].name, 'Test customer')
  assert.ok(entered.appearance.faceShape)
  assert.ok(entered.appearance.eyeShape)
  assert.ok(entered.appearance.topCut)
})

test('serving a queued customer creates dirty dishes that can be cleaned', () => {
  const shift = createPizzeriaShift()
  shift.walkIn({ name: 'Hungry neighbor' })
  const customer = shift.claimNextOrder()

  assert.equal(customer.status, 'preparing')
  shift.serveCurrent({ quality: 92 }, 3)
  assert.equal(shift.snapshot().queue.length, 0)
  assert.equal(shift.snapshot().dirtyDishes, 3)
  assert.equal(shift.cleanDishes(1), 1)
  assert.equal(shift.snapshot().dirtyDishes, 2)
})

test('queue capacity applies to approaching and waiting customers together', () => {
  const shift = createPizzeriaShift({ maxQueue: 2 })
  assert.ok(shift.spawn())
  assert.ok(shift.walkIn())
  assert.equal(shift.spawn(), null)
})
