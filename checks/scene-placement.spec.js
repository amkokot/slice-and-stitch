import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { SCENE_CHARACTER_LAYOUT, COUNTER_SEATS, sceneCharacterPlane, characterSceneFit, seatedPoseFrame, seatedSpriteCell } from '../scene-character-layout.js'
import { PLAYER_STARTS, SCENE_ACTORS, normalizeActor, paintedActorSpec } from '../hub-actors.js'
import { customerActor } from '../hub.js'
import { createTownPopulation } from '../town-life.js'

test('actor projection matches the cover painting, including square-room crop and street focus', () => {
  for (const [id, scene] of Object.entries(SCENE_CHARACTER_LAYOUT)) {
    const png = readFileSync(new URL(`../assets/hub/${{ street:'town-street', home:'home-room', restaurant:'restaurant-counter-v2', kitchen:'pizzeria-room-v2', tailor:'tailor-room-v1', boutique:'boutique-room-v2' }[id]}.png`, import.meta.url))
    assert.equal(png.readUInt32BE(16), scene.width)
    assert.equal(png.readUInt32BE(20), scene.height)
    for (const [width, height] of [[1235, 720], [1480, 840], [374, 210]]) {
      const plane = sceneCharacterPlane(id, width, height)
      assert.ok(plane.width >= width && plane.height >= height)
      assert.ok(Math.abs(plane.width / plane.height - scene.width / scene.height) < 1e-10)
      assert.equal(plane.left, (width - plane.width) / 2)
      assert.equal(plane.top, (height - plane.height) * scene.positionY)
    }
  }
})

test('every player has a visible floor anchor and scene-specific, undistorted outfit canvas', () => {
  for (const [id, start] of Object.entries(PLAYER_STARTS)) {
    const plane = sceneCharacterPlane(id, 1235, id === 'home' ? 819 : id === 'street' ? 850 : 720)
    const fit = characterSceneFit(id, { ...start, role:'player', scale:1.05 }, null, plane)
    const foot = plane.top + start.y / 100 * plane.height
    assert.ok(foot > 500 && foot < 940, `${id}: visible floor ${foot}`)
    assert.ok(fit.height >= 180 && fit.height < 460, `${id}: ${fit.height}`)
    assert.ok(Math.abs(fit.width / fit.height - 2 / 3) < 1e-10)
    assert.equal(fit.anchor, .92)
    assert.equal(fit.clipBottom, 0, 'no catalogue garment is scene-clipped')
  }
})

test('all five customers are seated immediately, never parked by the door with an inactive route', () => {
  const plane = sceneCharacterPlane('restaurant', 1235, 720)
  for (let slot = 0; slot < 5; slot++) {
    const actor = normalizeActor(customerActor({ id:`seat-${slot}`, name:'Guest', status:'waiting' }, 'restaurant', slot))
    assert.equal(actor.x, COUNTER_SEATS[slot].x)
    assert.equal(actor.y, COUNTER_SEATS[slot].y)
    assert.equal(actor.route, null)
    assert.equal(actor.facing, 'up')
    assert.equal(actor.action, slot === 0 ? 'order' : '')
    const spec = paintedActorSpec(actor)
    const fit = characterSceneFit('restaurant', actor, spec, plane)
    assert.equal(spec.kind, 'seated')
    assert.ok(fit.anchor >= .65 && fit.anchor <= .82, 'cushion contact, not shoes, anchors to the stool')
    assert.ok(fit.center > .4 && fit.center < .7, 'bags and hands do not determine seat centres')
    assert.ok(fit.height > 205 && fit.height < 255)
    assert.equal(fit.clipBottom, 0, 'lap and dangling feet remain visible')
  }
})

test('every authored seated pose stays on the same stool through gestures and resizing', () => {
  for (const action of ['', 'order', 'wait', 'eat']) {
    for (let row = 0; row < 4; row++) {
      const cell = seatedSpriteCell(row, action)
      for (const [width, height] of [[1672, 941], [1134, 638], [378, 213]]) {
        const plane = sceneCharacterPlane('restaurant', width, height)
        const actor = { ...COUNTER_SEATS[row], role: 'customer', scale: 1.08, action }
        const spec = { kind: 'seated', row, width: 76, height: 100 * cell.heightScale }
        const fit = characterSceneFit('restaurant', actor, spec, plane)
        const left = actor.x / 100 * plane.width - fit.center * fit.width
        const top = actor.y / 100 * plane.height - fit.anchor * fit.height
        assert.ok(Math.abs(left + cell.center * fit.width - actor.x / 100 * plane.width) < 1e-9)
        assert.ok(Math.abs(top + cell.anchor * fit.height - actor.y / 100 * plane.height) < 1e-9)
        assert.ok(Math.abs(fit.width - plane.width * .185 * .76) < 1e-9, 'cell cropping never stretches the painting')
        assert.ok(fit.seat.width > 0 && fit.seat.height > 0)
      }
    }
  }
  assert.equal(seatedPoseFrame('ordering'), seatedPoseFrame('order'))
  assert.equal(seatedPoseFrame('served'), seatedPoseFrame('eat'))
  assert.equal(seatedPoseFrame('Ordering'), seatedPoseFrame('order'))
})

test('seated crops retain boots and exclude adjacent row hair and feet', () => {
  const png = readFileSync(new URL('../assets/characters-v3/sprites/town-visitors-seated-atlas-v1.png', import.meta.url))
  assert.equal(png.readUInt32BE(20), seatedSpriteCell(0).atlasHeight)
  for (const action of ['', 'order', 'wait', 'eat']) {
    for (let row = 0; row < 4; row++) {
      const cell = seatedSpriteCell(row, action)
      assert.ok(cell.top >= 0 && cell.top + cell.height <= cell.atlasHeight)
      assert.ok(cell.anchor > .5 && cell.anchor < .85)
    }
    assert.ok(seatedSpriteCell(0, action).height > 321.5, 'first-row boots are no longer cut at a grid border')
    assert.ok(seatedSpriteCell(2, action).top + seatedSpriteCell(2, action).height <= 953, 'no silver head below the braid visitor')
  }
  const source = readFileSync(new URL('../hub-actors.js', import.meta.url), 'utf8')
  assert.match(source, /spec\.crop\.top \/ \(spec\.crop\.atlasHeight - spec\.crop\.height\)/)
})

test('scene characters retain accessible names but no hovering name badges or name tooltips', () => {
  const source = readFileSync(new URL('../hub-actors.js', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /hub-actor-name/)
  assert.doesNotMatch(source, /title="\$\{actor\.name\}"/)
  assert.match(source, /aria-label="\$\{safeName\}"/)
  assert.match(source, /safeName=String\(actor.name\).replace/)
  for (const file of ['../hub.css', '../scene-character-layout.css']) {
    assert.doesNotMatch(readFileSync(new URL(file, import.meta.url), 'utf8'), /hub-actor-name/)
  }
})

test('Sofia is occluded below the countertop and behind the seated customers', () => {
  const plane = sceneCharacterPlane('restaurant', 1235, 720)
  const actor = normalizeActor(SCENE_ACTORS.restaurant[0])
  const fit = characterSceneFit('restaurant', actor, paintedActorSpec(actor), plane)
  const top = actor.y / 100 * plane.height - fit.anchor * fit.height
  assert.ok(fit.clipBottom > 0)
  assert.ok(Math.abs(top + fit.height - fit.clipBottom - .448 * plane.height) < 1e-8)
  assert.ok(fit.depth < 493)
  const css = readFileSync(new URL('../scene-character-layout.css', import.meta.url), 'utf8')
  assert.match(css, /\.painted-actor-sprite\s*\{[^}]*clip-path: inset/)
  assert.match(css, /\.pose-counter-customer \.painted-actor-sprite \{ animation: none/)
})

test('NPC identity survives sitting, ordering and a separate departing actor ID', () => {
  const base = customerActor({ id:'guest-stable', name:'Guest', status:'preparing' }, 'restaurant')
  const seated = paintedActorSpec(normalizeActor(base))
  const departing = paintedActorSpec(normalizeActor({ ...base, id:'departing-guest', pose:'standing' }))
  assert.equal(seated.row, departing.row)
  assert.equal(base.action, 'wait')
})

test('static town positions separate shoppers and do not pile up at cropped street edges', () => {
  const population = createTownPopulation({ startedAt:0, cycleMs:20000 })
  for (let time = 0; time < 20000; time += 250) {
    const entries = population.snapshot(time)
    for (const entry of entries.filter(e => e.sceneId === 'street')) {
      assert.ok(entry.actor.x >= 10 && entry.actor.x <= 90)
      assert.ok(entry.actor.y >= 76 && entry.actor.y <= 86)
    }
    const browsing = entries.filter(e => e.sceneId === 'tailor' && e.stage === 'browsing')
    if (browsing.length > 1) assert.ok(Math.abs(browsing[0].actor.x - browsing[1].actor.x) > 20)
  }
})

test('queue and gaze redraws retain loaded player clothing rather than briefly rendering a floating head', () => {
  const source = readFileSync(new URL('../hub-actors.js', import.meta.url), 'utf8')
  assert.match(source, /replaceWith\(existingPlayer\)/)
  assert.match(source, /if \(sceneId && relevant\) render\(sceneId\)/)
  assert.match(source, /for \(const depth of \['back', 'front'\]\)/)
  assert.doesNotMatch(source, /paperDoll\?\.replaceWith/)
})
