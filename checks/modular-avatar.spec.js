import test from 'node:test'
import assert from 'node:assert/strict'

import { FASHION_CATALOG_GARMENTS } from '../fashion-catalog.js'
import {
  MODULAR_AVATAR_SLOTS,
  modularEquipmentFromAppearance,
  modularSlotForCatalogueGarment,
  renderModularAvatar,
} from '../character-v3/modular-avatar.js'

test('every catalogue garment resolves to a supported modular render slot', () => {
  const supported = new Set(MODULAR_AVATAR_SLOTS)
  for (const garment of FASHION_CATALOG_GARMENTS) {
    const slot = modularSlotForCatalogueGarment(garment)
    assert.ok(supported.has(slot), `${garment.id} should resolve to a modular slot`)
  }
})

test('outerwear is separated from inner tops without changing catalogue records', () => {
  const equipment = modularEquipmentFromAppearance({
    garmentDetails: {
      top: { id: 'teal-jacket', slot: 'top', cut: 'jacket' },
      bottom: { id: 'plum-skirt', slot: 'bottom', cut: 'skirt' },
    },
  })
  assert.equal(equipment.top, undefined)
  assert.equal(equipment.outer, 'teal-jacket')
  assert.equal(equipment.bottom, 'plum-skirt')
})

test('avatar markup composes independent registered layers in stable slot order', () => {
  const markup = renderModularAvatar({
    equipment: {
      top: 'ivory-oxford',
      outer: 'teal-jacket',
      bottom: 'olive-cuffed-trouser',
      shoes: 'canvas-sneakers',
      apron: 'tomato-apron',
    },
  })

  const layerOrder = ['base', 'identity', 'bottom', 'shoes', 'top', 'outer', 'apron']
    .map((slot) => markup.indexOf(`data-avatar-slot="${slot}"`))
  assert.ok(layerOrder.every((position) => position >= 0))
  assert.deepEqual([...layerOrder].sort((a, b) => a - b), layerOrder)
  assert.doesNotMatch(markup, /complete-presets|outfit-bodies-atlas/)
})

test('head and skin choices change identity layers without duplicating garments', () => {
  const first = renderModularAvatar({
    preset: 'head-01',
    skinTone: 'light-golden',
    equipment: { top: 'ivory-oxford', bottom: 'olive-cuffed-trouser' },
  })
  const second = renderModularAvatar({
    preset: 'head-05',
    skinTone: 'deep-golden',
    equipment: { top: 'ivory-oxford', bottom: 'olive-cuffed-trouser' },
  })

  assert.match(first, /data-avatar-asset="head-01-light-golden"/)
  assert.match(second, /data-avatar-asset="head-05-deep-golden"/)
  assert.match(first, /data-avatar-asset="ivory-oxford"/)
  assert.match(second, /data-avatar-asset="ivory-oxford"/)
  assert.match(first, /data-avatar-asset="olive-cuffed-trouser"/)
  assert.match(second, /data-avatar-asset="olive-cuffed-trouser"/)
})

test('closed shoes replace the fitting feet instead of covering them', () => {
  const barefoot = renderModularAvatar({ equipment: {} })
  const shod = renderModularAvatar({ equipment: { shoes: 'canvas-sneakers' } })

  assert.match(barefoot, /data-avatar-slot="feet"/)
  assert.doesNotMatch(shod, /data-avatar-slot="feet"/)
  assert.match(shod, /data-avatar-slot="shoes"/)
})

