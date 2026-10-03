import test from 'node:test'
import assert from 'node:assert/strict'
import { createCharacterState, garmentCatalog } from '../character-model.js'
import { selectWardrobeGarments, wardrobeTryOnState, wardrobeTheme, addWardrobeTryOn } from '../wardrobe-browser.js'

test('clothing chest defaults to owned pieces and only offers unlocked catalogue designs', () => {
  const state = createCharacterState()
  assert.ok(selectWardrobeGarments(state).every(({ id }) => state.wardrobe.includes(id)))
  const unlocked=selectWardrobeGarments(state,{scope:'catalogue'})
  assert.ok(unlocked.length < garmentCatalog(state).length)
  assert.ok(unlocked.every(g=>state.wardrobe.includes(g.id)||(g.unlockLevel||1)<=1))
  assert.equal(selectWardrobeGarments(state, { scope: 'catalogue', atelierLevel:12 }).length, garmentCatalog(state).length)
})

test('wardrobe search combines case-insensitive color, material, cut and style terms', () => {
  const state = createCharacterState()
  const search = (query) => selectWardrobeGarments(state, { scope: 'catalogue', search: query, atelierLevel:12 })
  assert.ok(search('PIQUE rose').some(({ id }) => id === 'painted-pique-polo-rose'))
  assert.ok(search('cross-back cotton').some(({ id }) => id === 'painted-crossback-apron-ivory'))
  assert.ok(search('silk formal').length > 0)
  assert.deepEqual(search('no-such-garment-zzzz'), [])
})

test('slot, collection and sort compose without changing owned inventory', () => {
  const state = createCharacterState()
  const before = JSON.stringify(state)
  const result = selectWardrobeGarments(state, { scope: 'catalogue', slot: 'outerwear', theme: 'tailored', sort: 'quality' })
  assert.ok(result.length > 0)
  assert.ok(result.every((garment) => garment.slot === 'outerwear' && wardrobeTheme(garment) === 'tailored'))
  assert.ok(result.every((garment, index) => index === 0 || garment.quality <= result[index - 1].quality))
  assert.equal(JSON.stringify(state), before)
})

test('trying on an unowned piece is reversible and cannot grant ownership or publish a save', () => {
  const state = createCharacterState()
  const garment = garmentCatalog(state).find(({ slot, id }) => slot === 'top' && !state.wardrobe.includes(id))
  const before = JSON.stringify(state)
  const fitted = wardrobeTryOnState(state, garment.id, [], 12)
  assert.equal(fitted.profile.equipped.top, garment.id)
  assert.equal(JSON.stringify(state), before)
  assert.ok(!state.wardrobe.includes(garment.id))
  assert.equal(wardrobeTryOnState(state, null), state)
  assert.equal(wardrobeTryOnState(state, 'missing'), state)
})

test('a fitting-room outfit retains separate shirt, jacket, bottom, footwear and accessory zones', () => {
  const state = createCharacterState()
  const before = JSON.stringify(state)
  const catalogue = garmentCatalog(state)
  const piece = (cut) => catalogue.find((g) => g.cut === cut)
  const choices = ['halter','double-breasted-blazer','paperbag-trouser','slingbacks','beret','necktie'].map(piece)
  let ids = []
  for (const garment of choices) ids = addWardrobeTryOn(state, ids, garment.id, 12)
  assert.equal(ids.length, 6)
  const replacement = piece('shell-top')
  ids = addWardrobeTryOn(state, ids, replacement.id, 12)
  assert.equal(ids.length, 6)
  assert.ok(!ids.includes(choices[0].id))
  const fitted = wardrobeTryOnState(state, ids, [], 12)
  assert.equal(fitted.profile.equipped.top, replacement.id)
  for (const garment of choices.slice(1,4)) assert.equal(fitted.profile.equipped[garment.slot], garment.id)
  assert.ok(Object.values(fitted.profile.accessories).includes(choices[4].id))
  assert.ok(Object.values(fitted.profile.accessories).includes(choices[5].id))
  assert.equal(JSON.stringify(state), before)
  assert.equal(addWardrobeTryOn(state, ids, 'missing'), ids)
})

test('locked clothes cannot leak through search or direct fitting requests; owned legacy pieces stay unlocked', () => {
  const state=createCharacterState()
  const locked=garmentCatalog(state).find(g=>g.unlockLevel>1&&!state.wardrobe.includes(g.id))
  assert.ok(locked)
  assert.ok(!selectWardrobeGarments(state,{scope:'catalogue',search:locked.name}).some(g=>g.id===locked.id))
  assert.deepEqual(addWardrobeTryOn(state,[],locked.id),[])
  assert.equal(wardrobeTryOnState(state,locked.id),state)
  const inherited=createCharacterState({...state,wardrobe:[...state.wardrobe,locked.id]})
  assert.ok(selectWardrobeGarments(inherited).some(g=>g.id===locked.id))
  assert.equal(wardrobeTryOnState(inherited,locked.id).profile.equipped[locked.slot],locked.id)
})

test('temporary removal of optional layers does not strip required clothes or mutate the saved outfit', () => {
  const state = createCharacterState()
  const before = JSON.stringify(state)
  const fitted = wardrobeTryOnState(state, [], ['apron','outerwear','top','bottom','shoes','unknown'])
  assert.equal(fitted.profile.equipped.apron, null)
  assert.equal(fitted.profile.equipped.outerwear, null)
  for (const slot of ['top','bottom','shoes']) assert.equal(fitted.profile.equipped[slot], state.profile.equipped[slot])
  assert.equal(JSON.stringify(state), before)
})
