import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  CHARACTER_STORAGE_KEY, CHARACTER_SCHEMA_VERSION, addCraftedGarment,
  characterToActorAppearance, createCharacterState, createCharacterStore,
  equipGarment, findGarment, unequipGarment, wardrobeSetBonuses, addCatalogGarment,
} from '../character-model.js'
import { GARMENT_SLOTS, garmentEquipmentSlot } from '../garment-slots.js'
import { FASHION_CATALOG_GARMENTS, FASHION_MODIFICATIONS, FASHION_SCHEMATICS } from '../fashion-catalog.js'
import { renderPaintedPaperDoll } from '../character-v3/painted-paper-doll.js'
import { garmentTintMatrix } from '../character-v3/registered-garments.js'
import { paintedGarmentPlate, renderPaintedGarmentThumbnail } from '../character-v3/painted-wardrobe.js'

test('outerwear is a canonical equipment slot for catalogue and tailoring, not for ordinary knit tops', () => {
  assert.ok(GARMENT_SLOTS.includes('outerwear'))
  for (const cut of ['jacket', 'chore-jacket', 'coat', 'peacoat', 'tailcoat', 'soft-blazer', 'cardigan', 'cropped-cardigan', 'waistcoat', 'vest', 'capelet', 'hoodie', 'bomber-jacket', 'trucker-jacket']) {
    assert.equal(garmentEquipmentSlot({ slot: 'top', cut }), 'outerwear', cut)
  }
  for (const cut of ['tee', 'blouse', 'oxford-shirt', 'turtleneck', 'pullover', 'sweatshirt', 'shift-dress', 'wrap-dress', 'jumpsuit']) {
    assert.equal(garmentEquipmentSlot({ slot: 'top', cut }), 'top', cut)
  }
  for (const garment of [...FASHION_CATALOG_GARMENTS, ...FASHION_SCHEMATICS]) {
    assert.equal(garment.slot, garmentEquipmentSlot(garment), garment.id)
  }
  assert.equal(FASHION_SCHEMATICS.find(({ id }) => id === 'chore-jacket').slot, 'outerwear')
  assert.ok(FASHION_MODIFICATIONS.filter(({ slots }) => slots.includes('top')).every(({ slots }) => slots.includes('outerwear')))
})

test('shirts, outerwear and aprons equip and remove independently', () => {
  const shirt = 'painted-crew-tee-rose'
  let state = equipGarment(createCharacterState(), shirt)
  const originalBottom = state.profile.equipped.bottom
  for (const id of ['painted-soft-blazer-ink', 'painted-cable-cardigan-sage']) {
    state = equipGarment(state, id)
    assert.equal(state.profile.equipped.outerwear, id)
    assert.equal(state.profile.equipped.top, shirt)
  }
  state = equipGarment(state, 'tomato-apron')
  state = equipGarment(state, 'violet-blouse')
  assert.equal(state.profile.equipped.outerwear, 'painted-cable-cardigan-sage')
  assert.equal(state.profile.equipped.apron, 'tomato-apron')
  const appearance = characterToActorAppearance(state)
  assert.equal(appearance.garmentDetails.top.id, 'violet-blouse')
  assert.equal(appearance.garmentDetails.outerwear.slot, 'outerwear')
  assert.notEqual(appearance.top, appearance.outerwear)
  const removed = unequipGarment(state, 'outerwear')
  assert.equal(removed.profile.equipped.outerwear, null)
  assert.equal(removed.profile.equipped.top, 'violet-blouse')
  assert.equal(removed.profile.equipped.bottom, originalBottom)
  assert.equal(removed.profile.equipped.apron, 'tomato-apron')
  assert.equal(characterToActorAppearance(removed).garmentDetails.outerwear, null)
})

test('old built-in jacket saves migrate once without losing identity, wardrobe or outfit slots', () => {
  const saved = {
    schemaVersion: 2,
    profile: { name: 'Asha', skinTone: 'espresso', faceShape: 'heart', equipped: { top: 'painted-cable-cardigan-ink', bottom: 'plum-skirt', apron: 'tomato-apron', shoes: 'canvas-sneakers' } },
    wardrobe: ['painted-cable-cardigan-ink', 'plum-skirt', 'tomato-apron'],
  }
  const migrated = createCharacterState(saved)
  assert.equal(migrated.schemaVersion, CHARACTER_SCHEMA_VERSION)
  assert.equal(migrated.profile.name, 'Asha')
  assert.equal(migrated.profile.skinTone, 'espresso')
  assert.equal(migrated.profile.faceShape, 'heart')
  assert.equal(migrated.profile.equipped.outerwear, saved.profile.equipped.top)
  assert.equal(migrated.profile.equipped.top, 'painted-crew-tee-ivory')
  for (const slot of ['bottom', 'apron', 'shoes']) assert.equal(migrated.profile.equipped[slot], saved.profile.equipped[slot])
  for (const id of saved.wardrobe) assert.ok(migrated.wardrobe.includes(id))
  assert.deepEqual(createCharacterState(JSON.parse(JSON.stringify(migrated))), migrated)
  assert.equal(unequipGarment(migrated, 'outerwear').profile.equipped.outerwear, null)
})

test('crafted legacy jackets preserve their ID, dye, quality, alterations and provenance', () => {
  const garment = { id: 'crafted-top-7-1', name: 'My blazer', slot: 'top', cut: 'soft-blazer', pattern: 'check', quality: 93, palette: { primary: '#82475f', secondary: '#e6b0b8' }, customization: { alterations: ['patch-pocket'] }, provenance: { source: 'fashion-minigame', runId: 7 } }
  const state = createCharacterState({ profile: { equipped: { top: garment.id } }, customGarments: [garment], wardrobe: [garment.id] })
  const restored = findGarment(state, garment.id)
  assert.equal(state.profile.equipped.outerwear, garment.id)
  assert.equal(restored.slot, 'outerwear')
  for (const key of ['id', 'name', 'pattern', 'quality', 'palette', 'customization', 'provenance']) assert.deepEqual(restored[key], garment[key])
  const crafted = addCraftedGarment(createCharacterState(), { kind: 'fashion', runId: 14, result: { garment: { slot: 'outerwear', cut: 'cardigan', color: '#647e60', quality: 88 } } })
  const id = crafted.customGarments[0].id
  assert.equal(equipGarment(crafted, id).profile.equipped.outerwear, id)
  assert.deepEqual(crafted.customGarments[0].attachmentPoints, ['torso', 'left-arm', 'right-arm'])
})

test('save-store reloads persist optional outerwear removal rather than restoring a legacy jacket', () => {
  const data = new Map([[CHARACTER_STORAGE_KEY, JSON.stringify({ profile: { equipped: { top: 'painted-soft-blazer-ink' } } })]])
  const storage = { getItem: (key) => data.get(key), setItem: (key, value) => data.set(key, value) }
  const store = createCharacterStore({ storage })
  store.equip('painted-crew-tee-rose')
  store.unequip('outerwear')
  const reloaded = createCharacterStore({ storage }).snapshot()
  assert.equal(reloaded.profile.equipped.outerwear, null)
  assert.equal(reloaded.profile.equipped.top, 'painted-crew-tee-rose')
  assert.equal(JSON.parse(data.get(CHARACTER_STORAGE_KEY)).schemaVersion, CHARACTER_SCHEMA_VERSION)
})

test('selected shirt dye and pattern remain independent beneath painted outerwear and apron', () => {
  const state = equipGarment(equipGarment(equipGarment(createCharacterState(), 'painted-crew-tee-rose'), 'painted-soft-blazer-ink'), 'painted-linen-waist-apron-sage')
  const appearance = characterToActorAppearance(state)
  const top = { ...appearance.garmentDetails.top, pattern: 'check' }
  const markup = renderPaintedPaperDoll(state.profile, { ...appearance, garmentDetails: { ...appearance.garmentDetails, top } }, { id: 'independent-layers' })
  for (const id of ['painted-crew-tee-rose', 'painted-soft-blazer-ink', 'painted-linen-waist-apron-sage']) assert.ok(markup.includes(`data-paper-garment="${id}"`))
  assert.ok(markup.indexOf('data-paper-slot="top"') < markup.indexOf('data-paper-slot="outer"'))
  assert.ok(markup.indexOf('data-paper-slot="outer"') < markup.indexOf('data-paper-slot="apron"'))
  assert.ok(markup.includes(`values="${garmentTintMatrix(top.palette.primary, .82)}"`))
  assert.match(markup, /independent-layers-top-fabric-pattern/)
  assert.match(markup, /data-under-outerwear="long-sleeves"/)
  assert.doesNotMatch(markup, /underlayer/)
  const without = renderPaintedPaperDoll(state.profile, characterToActorAppearance(unequipGarment(state, 'outerwear')))
  assert.doesNotMatch(without, /data-paper-slot="outer"|data-under-outerwear/)
  assert.match(without, /data-paper-garment="painted-crew-tee-rose"/)
  const css = readFileSync(new URL('../character-v3/painted-paper-doll.css', import.meta.url), 'utf8')
  const z = (slot) => Number(css.match(new RegExp(`garment--${slot} \\{ z-index: (\\d+)`))[1])
  assert.ok(z('top') < z('outer') && z('outer') < z('apron'))
})

test('outerwear thumbnails and set bonuses continue using the original garment IDs', () => {
  for (const garment of FASHION_CATALOG_GARMENTS.filter(({ slot }) => slot === 'outerwear')) {
    const plate = paintedGarmentPlate(garment)
    assert.equal(plate.slot, 'outerwear', garment.id)
    assert.ok(renderPaintedGarmentThumbnail(garment).length > 0, garment.id)
  }
  let state = createCharacterState()
  for (const id of ['teal-jacket', 'tool-roll-apron']) state = equipGarment(addCatalogGarment(state, id), id)
  assert.equal(state.profile.equipped.top, 'cream-work-tee')
  assert.equal(wardrobeSetBonuses(state).find(({ id }) => id === 'maker-studio').complete, true)
})

test('an explicitly selected outer layer wins migration and both older garment IDs stay owned', () => {
  const state = createCharacterState({ profile: { equipped: { top: 'teal-jacket', outerwear: 'painted-soft-blazer-ink' } }, wardrobe: [] })
  assert.equal(state.profile.equipped.outerwear, 'painted-soft-blazer-ink')
  assert.equal(state.profile.equipped.top, 'painted-crew-tee-ivory')
  assert.ok(state.wardrobe.includes('teal-jacket'))
  assert.ok(state.wardrobe.includes('painted-soft-blazer-ink'))
})
