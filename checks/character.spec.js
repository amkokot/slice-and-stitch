import test from 'node:test'
import assert from 'node:assert/strict'

import {
  AVATAR_RIG_ID,
  addCatalogGarment,
  addCraftedGarment,
  characterToActorAppearance,
  createCharacterState,
  equipGarment,
  selectCharacterPreset,
  garmentCatalog,
  garmentFromFashionResult,
} from '../character-model.js'
import { CHARACTER_PRESETS } from '../character-presets.js'
import { normalizeActor } from '../hub-actors.js'

test('starter character uses independently attached garment slots on one animation rig', () => {
  const state = createCharacterState()
  const catalog = garmentCatalog(state)
  const equipped = Object.values(state.profile.equipped).filter(Boolean)

  assert.equal(catalog.every((garment) => garment.rig === AVATAR_RIG_ID), true)
  assert.equal(equipped.every((id) => catalog.some((garment) => garment.id === id)), true)
  assert.equal(characterToActorAppearance(state).rig, AVATAR_RIG_ID)
  assert.equal(state.profile.freckles, true)
})

test('authored character presets are extensive and never replace the equipped wardrobe', () => {
  const before = equipGarment(createCharacterState(), 'violet-blouse')
  const after = selectCharacterPreset(before, 'malik')

  assert.ok(CHARACTER_PRESETS.length >= 48)
  assert.equal(CHARACTER_PRESETS.some((preset) => 'name' in preset || 'subtitle' in preset), false)
  assert.equal(after.profile.presetId, 'malik')
  assert.equal(after.profile.equipped.top, 'violet-blouse')
  assert.deepEqual(after.profile.equipped, before.profile.equipped)
  assert.notEqual(after.profile.skinTone, before.profile.skinTone)
})

test('equipping a garment replaces only its declared slot', () => {
  const before = createCharacterState()
  const after = equipGarment(before, 'violet-blouse')

  assert.equal(after.profile.equipped.top, 'violet-blouse')
  assert.equal(after.profile.equipped.bottom, before.profile.equipped.bottom)
  assert.equal(after.profile.equipped.apron, before.profile.equipped.apron)
})

test('fashion completion becomes an attachable apron with provenance', () => {
  const payload = {
    type: 'completed',
    kind: 'fashion',
    runId: 7,
    result: { garment: { name: 'Blue service apron', color: '#496ea1', quality: 91, value: 84 } },
  }
  const garment = garmentFromFashionResult(payload, 1)
  const state = addCraftedGarment(createCharacterState(), payload)

  assert.equal(garment.slot, 'apron')
  assert.deepEqual(garment.attachmentPoints, ['chest', 'waist'])
  assert.equal(garment.provenance.runId, 7)
  assert.equal(state.wardrobe.includes(garment.id), true)
})

test('accessories stack on independent head, neck, and shoulder anchors', () => {
  let state = createCharacterState()
  for (const id of ['garden-scarf', 'berry-beret', 'leather-satchel']) state = addCatalogGarment(state, id)
  for (const id of ['garden-scarf', 'berry-beret', 'leather-satchel']) state = equipGarment(state, id)

  assert.equal(state.profile.accessories.neck, 'garden-scarf')
  assert.equal(state.profile.accessories.head, 'berry-beret')
  assert.equal(state.profile.accessories.shoulder, 'leather-satchel')
  const appearance = characterToActorAppearance(state)
  assert.equal(appearance.accessories.length, 3)
  for (const accessory of appearance.accessories) assert.equal(accessory.slot, 'accessory')
  assert.equal(appearance.accessories.find(({ id }) => id === 'garden-scarf').cut, 'scarf')
})

test('NPC actors can use the same character and garment record as the player', () => {
  const character = equipGarment(createCharacterState(), 'tomato-apron')
  const actor = normalizeActor({ id: 'guest', name: 'Guest', role: 'customer', character, x: 10, y: 80 })

  assert.equal(actor.appearance.rig, AVATAR_RIG_ID)
  assert.equal(actor.appearance.hasApron, true)
  assert.equal(actor.appearance.apron, '#b94836')
})
