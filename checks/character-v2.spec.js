import test from 'node:test'
import assert from 'node:assert/strict'

import { directionFromVector, directionToView } from '../character-v2/rig.js'
import { createFacingController, gazePose } from '../character-v2/facing.js'
import { sampleRigPose } from '../character-v2/animation.js'
import { garmentVisualManifest, validateGarmentManifest } from '../character-v2/asset-registry.js'
import { generateNpcAppearance, generateNpcRecipe, generateNpcRoster } from '../character-v2/npc-generator.js'
import { ACCESSORY_EQUIPMENT_ZONES, CHARACTER_IDENTITY_OPTIONS } from '../character-v2/identity-catalog.js'
import { FASHION_CATALOG_GARMENTS } from '../fashion-catalog.js'
import { renderCharacterSvg } from '../character-v2/renderer.js'
import { renderCharacterPortraitSvg } from '../character-v2/portrait-renderer.js'
import { migrateCharacterV1 } from '../character-v2/schema.js'
import { normalizeActor } from '../hub-actors.js'

test('screen vectors map to eight stable facing directions and five art views', () => {
  assert.equal(directionFromVector(1, 0), 'right')
  assert.equal(directionFromVector(1, 1), 'down-right')
  assert.equal(directionFromVector(0, 1), 'down')
  assert.equal(directionFromVector(-1, -1), 'up-left')
  assert.deepEqual(directionToView('left'), { family: 'profile', mirrored: true })
  assert.deepEqual(directionToView('up'), { family: 'back', mirrored: false })
})

test('gaze can move independently before a sustained target turns the body', () => {
  const controller = createFacingController({ initialFacing: 'down', turnDwellMs: 200 })
  const first = controller.consider({ direction: 'up', priority: 'dialogue' }, 0)
  assert.equal(first.facing, 'down')
  assert.equal(first.lookDirection, 'up')
  assert.equal(first.gaze.needsTurn, true)
  const turned = controller.consider({ direction: 'up', priority: 'dialogue' }, 240)
  assert.equal(turned.facing, 'up')
  assert.equal(gazePose('right', 'down').needsTurn, false)
})

test('higher priority task focus is not displaced by ambient glances', () => {
  const controller = createFacingController({ initialFacing: 'right' })
  controller.consider({ direction: 'up-right', priority: 'task', expiresAt: 500 }, 10)
  const snapshot = controller.consider({ direction: 'left', priority: 'ambient' }, 20)
  assert.equal(snapshot.lookDirection, 'up-right')
  controller.tick(600)
  assert.equal(controller.snapshot().lookDirection, controller.snapshot().facing)
})

test('walk pose articulates opposing limbs and reduced motion is static', () => {
  const pose = sampleRigPose({ motion: 'walk', time: 0.2, seed: 4 })
  assert.notEqual(pose['upper-arm.l'].rotation, pose['upper-arm.r'].rotation)
  assert.notEqual(pose['thigh.l'].rotation, pose['thigh.r'].rotation)
  assert.deepEqual(sampleRigPose({ motion: 'walk', time: 0.2, reducedMotion: true }), {})
})

test('garment manifests split clothes into bone-friendly drawable parts', () => {
  const manifest = garmentVisualManifest({ id: 'house-apron', slot: 'apron', cut: 'service-apron', palette: { primary: '#417358' } })
  assert.equal(manifest.rig, 'biped-v2')
  assert.equal(manifest.parts.includes('bib'), true)
  assert.equal(manifest.parts.includes('tie'), true)
  assert.deepEqual(validateGarmentManifest(manifest), [])
})

test('renderer emits layered v2 rig, material texture, and active view', () => {
  const svg = renderCharacterSvg({ hasApron: true }, { id: 'quality-test', facing: 'left', lookDirection: 'up-left' })
  const detailed = renderCharacterSvg({ hasApron: true }, { id: 'detail-test', facing: 'down-right' })
  assert.match(svg, /data-rig="biped-v2"/)
  assert.match(svg, /data-view="profile"/)
  assert.match(svg, /cotton-canvas-v1\.png/)
  assert.match(svg, /data-bone="head"/)
  assert.match(svg, /char2-apron/)
  assert.match(detailed, /viewBox="0 0 320 520"/)
  assert.match(detailed, /data-bone="forearm\.r"/)
  assert.match(detailed, /data-bone="hand\.l"/)
  assert.match(detailed, /-iris/)
  assert.match(detailed, /data-bone="thigh\.r"[^>]*>[\s\S]*?data-bone="foot\.r"/)
  assert.match(detailed, /data-bone="thigh\.l"[^>]*>[\s\S]*?data-bone="foot\.l"/)
})

test('town renderer exposes authored identity and role animation states', () => {
  const svg = renderCharacterSvg({
    faceShape: 'diamond', eyeShape: 'upturned', browStyle: 'bold', facialHair: 'mustache',
    hairStyle: 'bun', hairStyleId: 'braided-bun', hairTexture: 'braided',
  }, { id: 'vendor-state', action: 'sew', lookDirection: 'down-left' })
  assert.match(svg, /data-action="sew"/)
  assert.match(svg, /data-face-shape="diamond"/)
  assert.match(svg, /data-eye-shape="upturned"/)
  assert.match(svg, /data-hair-style="braided-bun"/)
  assert.match(svg, /char2-face/)
})

test('portrait renderer makes identity and clothing choices visibly independent', () => {
  const base = renderCharacterPortraitSvg({
    skin: '#8f4f38', hair: '#2b1a18', eye: '#6f8d62', faceShape: 'heart', eyeShape: 'upturned',
    hairStyleId: 'afro', top: '#775070', topAccent: '#efc6d2', topCut: 'cardigan', topPattern: 'floral',
    apron: '#417358', apronAccent: '#f1ca68', apronPattern: 'stripe', hasApron: true,
  }, { id: 'portrait-test', lookDirection: 'left' })
  const alternate = renderCharacterPortraitSvg({
    skin: '#f1c9a5', hair: '#b56c3b', eye: '#4d728c', faceShape: 'square', eyeShape: 'round',
    hairStyleId: 'side-part', top: '#397d78', topAccent: '#f0d4a4', topCut: 'jacket', topPattern: 'pinstripe',
  }, { id: 'portrait-test-alt', lookDirection: 'right' })
  assert.match(base, /data-renderer="painted-portrait-v1"/)
  assert.match(base, /data-face-shape="heart"/)
  assert.match(base, /data-hair-style="afro"/)
  assert.match(base, /char3-apron/)
  assert.match(base, /#8f4f38/)
  assert.match(base, /floral/)
  assert.notEqual(base, alternate)
  assert.match(alternate, /data-face-shape="square"/)
  assert.match(alternate, /data-hair-style="side-part"/)
})

test('NPC generation is deterministic while preserving visible variety', () => {
  assert.deepEqual(generateNpcAppearance('mara'), generateNpcAppearance('mara'))
  const roster = generateNpcRoster('lunch-rush', 16)
  assert.equal(new Set(roster.map((npc) => `${npc.appearance.hairStyle}:${npc.appearance.top}:${npc.appearance.frame}`)).size > 6, true)
})

test('personal creation exposes broad independent identity controls', () => {
  const combinations = CHARACTER_IDENTITY_OPTIONS.frames.length
    * CHARACTER_IDENTITY_OPTIONS.heights.length
    * CHARACTER_IDENTITY_OPTIONS.skinTones.length
    * CHARACTER_IDENTITY_OPTIONS.faceShapes.length
    * CHARACTER_IDENTITY_OPTIONS.eyeShapes.length
    * CHARACTER_IDENTITY_OPTIONS.hairTextures.length
    * CHARACTER_IDENTITY_OPTIONS.hairStyles.length
  assert.equal(combinations > 1_000_000, true)
  assert.equal(CHARACTER_IDENTITY_OPTIONS.skinTones.length >= 12, true)
  assert.equal(CHARACTER_IDENTITY_OPTIONS.hairStyles.length >= 18, true)
  assert.deepEqual(ACCESSORY_EQUIPMENT_ZONES, ['head', 'neck', 'chest', 'shoulder', 'waist', 'hands'])
})

test('procedural NPC recipes are deterministic and wear real catalog garments', () => {
  const recipe = generateNpcRecipe('late-lunch-42', { role: 'shopkeeper', trend: 'maker', level: 7 })
  assert.deepEqual(recipe, generateNpcRecipe('late-lunch-42', { role: 'shopkeeper', trend: 'maker', level: 7 }))
  const catalogIds = new Set(FASHION_CATALOG_GARMENTS.map((garment) => garment.id))
  assert.equal(['top', 'bottom', 'shoes'].every((slot) => catalogIds.has(recipe.outfit[slot])), true)
  assert.equal(Object.keys(recipe.outfit.accessories).length, ACCESSORY_EQUIPMENT_ZONES.length)
})

test('every fashion catalog cut resolves to an animation-ready visual manifest', () => {
  const manifests = FASHION_CATALOG_GARMENTS.map(garmentVisualManifest)
  assert.equal(manifests.every((manifest) => !manifest.fallback), true)
  assert.equal(manifests.every((manifest) => manifest.views.length === 5), true)
  assert.equal(manifests.every((manifest) => manifest.parts.length >= 1), true)
})

test('every normalized NPC receives a stable v2 identity without replacing authored details', () => {
  const mina = normalizeActor({ id: 'mina', appearance: { top: '#775070' } })
  const again = normalizeActor({ id: 'mina', appearance: { top: '#775070' } })
  const theo = normalizeActor({ id: 'theo', appearance: { top: '#397d78' } })
  assert.deepEqual(mina.appearance, again.appearance)
  assert.equal(mina.appearance.rig, 'biped-v2')
  assert.equal(mina.appearance.top, '#775070')
  assert.notEqual(`${mina.appearance.skin}:${mina.appearance.hairStyle}:${mina.appearance.frame}`, `${theo.appearance.skin}:${theo.appearance.hairStyle}:${theo.appearance.frame}`)
})

test('v1 character saves migrate without losing outfit or crafted wardrobe records', () => {
  const crafted = { id: 'crafted-scarf', attachmentPoints: ['neck'] }
  const migrated = migrateCharacterV1({
    schemaVersion: 1,
    profile: { name: 'Ari', frame: 'tall', hairStyle: 'curls', hairColor: 'plum', equipped: { top: 'violet-blouse', bottom: 'plum-skirt', shoes: 'plum-boots', apron: null, accessory: 'crafted-scarf' } },
    wardrobe: ['violet-blouse', 'crafted-scarf'],
    customGarments: [crafted],
  }, [crafted])
  assert.equal(migrated.schemaVersion, 2)
  assert.equal(migrated.profile.rig, 'biped-v2')
  assert.equal(migrated.profile.equipped.accessoryNeck, 'crafted-scarf')
  assert.equal(migrated.wardrobe.includes('crafted-scarf'), true)
})

