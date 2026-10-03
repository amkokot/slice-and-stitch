import test from 'node:test'
import assert from 'node:assert/strict'

import {
  createWorldNavigator,
  MINIGAME_STATIONS,
  SHOP_CATALOGS,
  WORLD_SCENES,
} from '../hub.js'
import {
  directionToTarget,
  normalizeActor,
  paintedActorMotionSpec,
  paintedActorSpec,
  PLAYER_STARTS,
  SCENE_ACTORS,
  walkCycleForRoute,
} from '../hub-actors.js'
import { createTownPopulation } from '../town-life.js'

test('every scene hotspot points to a known scene, station, panel, or catalog', () => {
  const panels = new Set(['upgrades', 'wardrobe', 'map', 'orders', 'bed', ...Object.keys(SHOP_CATALOGS)])
  Object.values(WORLD_SCENES).forEach((scene) => {
    scene.hotspots.forEach(({ action }) => {
      if (action.type === 'scene') assert.ok(WORLD_SCENES[action.target], `${scene.id} -> ${action.target}`)
      if (action.type === 'minigame') assert.ok(MINIGAME_STATIONS[action.target], `${scene.id} -> ${action.target}`)
      if (action.type === 'panel') assert.ok(panels.has(action.target), `${scene.id} -> ${action.target}`)
    })
  })
})

test('every interaction routes the player to a floor-level waypoint instead of the artwork center', () => {
  Object.values(WORLD_SCENES).forEach((scene) => {
    scene.hotspots.forEach((hotspot) => {
      assert.ok(Number.isFinite(hotspot.walkTo?.x), `${scene.id}:${hotspot.id} needs a walk x`)
      assert.ok(Number.isFinite(hotspot.walkTo?.y), `${scene.id}:${hotspot.id} needs a walk y`)
      assert.ok(hotspot.walkTo.y >= 70 && hotspot.walkTo.y <= 90, `${scene.id}:${hotspot.id} must stay on the floor plane`)
    })
  })
})

test('starter kitchen exposes all five requested cooking stations', () => {
  const stationIds = WORLD_SCENES.kitchen.hotspots
    .filter(({ action }) => action.type === 'minigame')
    .map(({ action }) => action.target)

  assert.deepEqual(stationIds.sort(), [
    'dish-washing',
    'dough-throw',
    'pizza-making',
    'sauce-pot',
    'soda-fountain',
  ])
  assert.equal(WORLD_SCENES.kitchen.hotspots.every((hotspot) => hotspot.w > 0 && hotspot.h > 0), true)
})

test('avatar gaze resolves cardinal and diagonal hotspot directions', () => {
  assert.equal(directionToTarget({ x: 10, y: 80 }, { x: 70, y: 30 }), 'up-right')
  assert.equal(directionToTarget({ x: 70, y: 30 }, { x: 10, y: 80 }), 'down-left')
  assert.equal(directionToTarget({ x: 48, y: 80 }, { x: 49, y: 82 }), 'forward')
})

test('world navigator keeps a reversible room trail', () => {
  const navigator = createWorldNavigator()
  assert.equal(navigator.current(), 'street')
  assert.equal(navigator.go('kitchen'), true)
  assert.equal(navigator.go('missing-room'), false)
  assert.equal(navigator.current(), 'kitchen')
  assert.equal(navigator.back(), 'street')
  assert.deepEqual(navigator.trail(), [])
})

test('every room has a player entry point and actor routes are normalized', () => {
  Object.keys(WORLD_SCENES).forEach((sceneId) => assert.ok(PLAYER_STARTS[sceneId], sceneId))
  const walker = normalizeActor(SCENE_ACTORS.street[0])
  assert.equal(walker.role, 'customer')
  assert.ok(walker.route.duration >= 2)
  assert.ok(walker.route.x >= 0 && walker.route.x <= 100)
})

test('town visitors cross the street, enter stores, browse, and leave on a deterministic schedule', () => {
  const population = createTownPopulation({ cycleMs: 20000, startedAt: 0, seed: 'test-day' })
  const stages = [0, 7000, 10000, 15000, 18000].map((time) => population.snapshot(time)[0])
  assert.deepEqual(stages.map((entry) => entry.stage), [
    'walking-to-shop',
    'entering-shop',
    'browsing',
    'leaving-shop',
    'walking-home',
  ])
  assert.equal(stages[0].sceneId, 'street')
  assert.equal(stages[1].sceneId, 'tailor')
  assert.equal(stages[2].actor.action, 'browse')
  assert.equal(stages[0].actor.appearance.rig, 'biped-v2')
  assert.ok(stages[0].actor.appearance.faceShape)
  assert.ok(stages[0].actor.appearance.topCut)
})

test('signature vendors preserve authored poses, gaze, scale, and work actions', () => {
  const mara = normalizeActor(SCENE_ACTORS.tailor.find((actor) => actor.id === 'mara'))
  assert.equal(mara.detailLevel, 'signature')
  assert.equal(mara.pose, 'workbench')
  assert.equal(mara.action, 'sew')
  assert.equal(mara.lookDirection, 'down-left')
  assert.ok(mara.scale > 1)
})

test('town NPCs resolve to deterministic painted atlases while the editable player keeps its modular rig', () => {
  const mara = normalizeActor(SCENE_ACTORS.tailor.find((actor) => actor.id === 'mara'))
  const visitor = normalizeActor({ id: 'visitor-paint-test', role: 'customer', x: 50, y: 80 })
  const visitorAgain = normalizeActor({ id: 'visitor-paint-test', role: 'customer', x: 20, y: 70 })

  assert.match(paintedActorSpec(mara).src, /mara-tailor-strip-v1\.png$/)
  assert.match(paintedActorSpec(visitor).src, /town-visitors-atlas-v1\.png$/)
  assert.equal(paintedActorSpec(visitor).row, paintedActorSpec(visitorAgain).row)
  assert.equal(paintedActorSpec({ id: 'player', role: 'player' }), null)
})

test('counter customers resolve to the matching painted seated atlas row', () => {
  const standing = normalizeActor({ id: 'counter-guest', role: 'customer', pose: 'standing' })
  const seated = normalizeActor({ id: 'counter-guest', role: 'customer', pose: 'counter-customer', action: 'order' })

  assert.match(paintedActorSpec(seated).src, /town-visitors-seated-atlas-v1\.png$/)
  assert.equal(paintedActorSpec(seated).kind, 'seated')
  assert.equal(paintedActorSpec(seated).row, paintedActorSpec(standing).row)
})

test('walking visitors fall back to the authored two-pose atlas without changing identity rows', () => {
  const visitor = normalizeActor({ id: 'walking-paint-test', role: 'customer', x: 12, y: 72 })
  const idle = paintedActorMotionSpec(visitor, 'idle')
  const walking = paintedActorMotionSpec(visitor, 'walk')

  assert.match(walking.src, /town-visitors-atlas-v1\.png$/)
  assert.equal(walking.columns, 5)
  assert.equal(walking.row, idle.row)
  assert.equal(walking.kind, 'visitor-walk')
})

test('walk cadence follows route speed without becoming frantic or glacial', () => {
  const slow = walkCycleForRoute({ x: 20, y: 80 }, { x: 50, y: 80 }, 12)
  const fast = walkCycleForRoute({ x: 20, y: 80 }, { x: 50, y: 80 }, 3)

  assert.ok(slow > fast)
  assert.ok(slow <= 1.15)
  assert.ok(fast >= .58)
  assert.ok(Math.abs(12 / slow - Math.round(12 / slow)) < 1e-9)
  assert.ok(Math.abs(3 / fast - Math.round(3 / fast)) < 1e-9)
})
