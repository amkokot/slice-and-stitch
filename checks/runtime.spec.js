import test from 'node:test'
import assert from 'node:assert/strict'

import { createMinigameSession, MINIGAME_PROTOCOL_VERSION } from '../minigame-runtime.js'

test('a minigame session emits a stable, self-contained lifecycle', () => {
  const events = []
  const session = createMinigameSession('pizza', { emit: (event) => events.push(event) })

  session.begin({ orderId: 7 })
  session.update('cut', { requestedSlices: 6 })
  assert.equal(session.complete({ score: 91, payout: 32 }), true)

  assert.deepEqual(events.map((event) => event.type), ['started', 'stage-changed', 'completed'])
  assert.equal(events.at(-1).protocolVersion, MINIGAME_PROTOCOL_VERSION)
  assert.equal(events.at(-1).kind, 'pizza')
  assert.equal(events.at(-1).result.score, 91)
})

test('completion is idempotent so rewards cannot be issued twice', () => {
  const session = createMinigameSession('pizza')
  session.begin({ orderId: 1 })

  assert.equal(session.complete({ payout: 20 }), true)
  assert.equal(session.complete({ payout: 20 }), false)
  assert.equal(session.snapshot().result.payout, 20)
})

test('beginning another run clears the prior result', () => {
  const session = createMinigameSession('fashion')
  session.begin({ project: 'apron' })
  session.complete({ value: 80 })
  const next = session.begin({ project: 'dress' })

  assert.equal(next.runId, 2)
  assert.equal(next.status, 'playing')
  assert.equal(next.result, null)
  assert.equal(next.context.project, 'dress')
})
