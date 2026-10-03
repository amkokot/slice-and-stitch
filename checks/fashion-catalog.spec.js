import test from 'node:test'
import assert from 'node:assert/strict'

import {
  activeFashionSets,
  boutiqueCatalogForDay,
  FASHION_CATALOG_GARMENTS,
  FASHION_FABRICS,
  FASHION_MODIFICATIONS,
  FASHION_SCHEMATICS,
  fashionUnlockLevel,
  tailorStockForDay,
} from '../fashion-catalog.js'
import { addCatalogGarment, createCharacterState, equipGarment } from '../character-model.js'

test('fashion catalogue is extensive, unique, and covers every avatar slot', () => {
  const ids = FASHION_CATALOG_GARMENTS.map((garment) => garment.id)
  assert.equal(new Set(ids).size, ids.length)
  assert.ok(ids.length >= 250)
  assert.equal(Math.max(...FASHION_CATALOG_GARMENTS.map((garment) => garment.unlockLevel)), 12)
  assert.deepEqual(
    [...new Set(FASHION_CATALOG_GARMENTS.map((garment) => garment.slot))].sort(),
    ['accessory', 'apron', 'bottom', 'outerwear', 'shoes', 'top'],
  )
})

test('Mara offers deterministic limited patterns and fabric inventory each day', () => {
  const morning = tailorStockForDay(7, 0)
  const repeat = tailorStockForDay(7, 0)
  assert.deepEqual(morning, repeat)
  assert.equal(morning.schematics.length, 3)
  assert.ok(morning.schematics.some((pattern) => pattern.id === 'service-apron'))
  assert.equal(morning.fabrics.length, FASHION_FABRICS.filter(f=>f.unlockLevel===1).length)
  assert.ok(morning.fabrics.filter(f=>f.featured).every((fabric) => fabric.stock >= 1))
  assert.ok(morning.schematics.length < FASHION_SCHEMATICS.length)
})

test('reputation opens deeper patterns while the boutique keeps a daily rail', () => {
  assert.equal(fashionUnlockLevel(0), 1)
  assert.equal(fashionUnlockLevel(96), 3)
  assert.equal(fashionUnlockLevel(886), 12)
  const catalogue = boutiqueCatalogForDay(4, 0)
  assert.equal(catalogue.length, FASHION_CATALOG_GARMENTS.length)
  assert.ok(catalogue.some((garment) => garment.availableToday))
  assert.ok(catalogue.some((garment) => garment.locked))
  assert.ok(catalogue.filter((garment) => garment.featured).length <= 8)
  assert.ok(catalogue.every(item=>item.availableToday === !item.locked))
})

test('atelier milestones can drive the tailor and boutique unlock level directly', () => {
  const tailor = tailorStockForDay(4, 0, 6)
  const boutique = boutiqueCatalogForDay(4, 0, 6)
  assert.equal(tailor.level, 6)
  assert.ok(tailor.schematics.every((pattern) => pattern.unlockLevel <= 6))
  assert.ok(boutique.some((garment) => garment.unlockLevel === 6 && !garment.locked))
  assert.ok(boutique.some((garment) => garment.unlockLevel === 7 && garment.locked))
})

test('premium hides and couture cloth unlock well after starter materials', () => {
  const leather = FASHION_FABRICS.find((fabric) => fabric.id === 'chestnut-leather')
  const calfskin = FASHION_FABRICS.find((fabric) => fabric.id === 'black-calfskin')
  const cashmere = FASHION_FABRICS.find((fabric) => fabric.id === 'atelier-cashmere')
  assert.equal(leather.unlockLevel, 6)
  assert.equal(calfskin.unlockLevel, 9)
  assert.equal(cashmere.unlockLevel, 12)
  assert.equal(tailorStockForDay(18, 225).fabrics.some((fabric) => fabric.id === leather.id), false)
  assert.ok(Array.from({ length: 120 }, (_, day) => tailorStockForDay(day + 1, 226)).some((stock) => stock.fabrics.some((fabric) => fabric.id === leather.id)))
  assert.ok(FASHION_FABRICS.filter((fabric) => fabric.unlockLevel >= 6).length >= 10)
})

test('alteration techniques are unique, slot-aware, and paced across all atelier levels', () => {
  const ids = FASHION_MODIFICATIONS.map((modification) => modification.id)
  assert.equal(new Set(ids).size, ids.length)
  assert.ok(ids.length >= 24)
  assert.equal(Math.max(...FASHION_MODIFICATIONS.map((modification) => modification.unlockLevel)), 12)
  assert.ok(FASHION_MODIFICATIONS.every((modification) => modification.slots.length >= 1))
  assert.ok(FASHION_MODIFICATIONS.some((modification) => modification.geometry))
  assert.ok(FASHION_MODIFICATIONS.some((modification) => modification.visual))
})

test('purchased pieces join the wardrobe and equipped sets activate bonuses', () => {
  let state = createCharacterState()
  state = addCatalogGarment(state, 'check-trousers')
  state = equipGarment(state, 'cream-work-tee')
  state = equipGarment(state, 'check-trousers')
  state = equipGarment(state, 'tomato-apron')
  const counterSet = activeFashionSets(Object.values(state.profile.equipped)).find((set) => set.id === 'counter-classic')
  assert.equal(state.wardrobe.includes('check-trousers'), true)
  assert.equal(counterSet.active, true)
  assert.equal(counterSet.complete, true)
})
