const ASSET_ROOT = './assets/characters-v3/modular-v4/render'

export const MODULAR_AVATAR_CANVAS = Object.freeze({ width: 1024, height: 1536 })

export const MODULAR_AVATAR_SLOTS = Object.freeze([
  'base',
  'feet',
  'identity',
  'bottom',
  'shoes',
  'top',
  'outer',
  'apron',
  'accessory',
])

export const MODULAR_HEAD_PRESETS = Object.freeze([
  'head-01',
  'head-02',
  'head-03',
  'head-04',
  'head-05',
  'head-06',
  'head-07',
  'head-08',
  'head-09',
  'head-10',
  'head-11',
  'head-12',
])

export const MODULAR_SKIN_TONES = Object.freeze([
  'light-golden',
  'warm-medium',
  'deep-golden',
  'deep',
])

const identityAssets = Object.fromEntries(MODULAR_HEAD_PRESETS.flatMap((head) => MODULAR_SKIN_TONES.map((tone) => {
  const id = `${head}-${tone}`
  return [id, Object.freeze({ id, slot: 'identity', src: `${ASSET_ROOT}/${id}-v3.png` })]
})))

const bodyAssets = Object.fromEntries(MODULAR_SKIN_TONES.flatMap((tone) => [
  [`body-shared-${tone}`, Object.freeze({ id: `body-shared-${tone}`, slot: 'base', src: `${ASSET_ROOT}/body-shared-${tone}-v2.png` })],
  [`feet-shared-${tone}`, Object.freeze({ id: `feet-shared-${tone}`, slot: 'feet', src: `${ASSET_ROOT}/feet-shared-${tone}-v2.png` })],
]))

export const MODULAR_AVATAR_ASSETS = Object.freeze({
  ...bodyAssets,
  ...identityAssets,
  'ivory-oxford': Object.freeze({ id: 'ivory-oxford', slot: 'top', src: `${ASSET_ROOT}/top-ivory-onbody-v3.png` }),
  'outer-teal-chore': Object.freeze({ id: 'outer-teal-chore', slot: 'outer', src: `${ASSET_ROOT}/outer-teal-chore-onbody-v3.png` }),
  'olive-cuffed-trouser': Object.freeze({ id: 'olive-cuffed-trouser', slot: 'bottom', src: `${ASSET_ROOT}/bottom-olive-onbody-v3.png` }),
  'canvas-sneakers': Object.freeze({ id: 'canvas-sneakers', slot: 'shoes', src: `${ASSET_ROOT}/shoes-canvas-onbody-v3.png` }),
  'tomato-apron': Object.freeze({ id: 'tomato-apron', slot: 'apron', src: `${ASSET_ROOT}/apron-tomato-onbody-v2.png` }),
})

// Catalogue ids are intentionally separate from render ids. New colorways can
// share a silhouette profile while still pointing at their own painted layer.
export const MODULAR_CATALOGUE_BINDINGS = Object.freeze({
  'ivory-oxford': 'ivory-oxford',
  'teal-jacket': 'outer-teal-chore',
  'canvas-sneakers': 'canvas-sneakers',
  'tomato-apron': 'tomato-apron',
})

const CATALOGUE_SLOTS = new Set(['top', 'outerwear', 'bottom', 'apron', 'shoes', 'accessory'])
const OUTERWEAR_CUT = /jacket|coat|blazer|cape|cardigan|hoodie|bomber|trucker|pullover|sweatshirt/i

function escapeAttribute(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function selectionId(selection) {
  return typeof selection === 'string' ? selection : selection?.id
}

export function modularAssetFor(selection, expectedSlot) {
  const id = selectionId(selection)
  if (!id) return null
  const renderId = MODULAR_CATALOGUE_BINDINGS[id] || id
  const asset = MODULAR_AVATAR_ASSETS[renderId]
  if (!asset || asset.slot !== expectedSlot) return null
  return asset
}

export function modularSlotForCatalogueGarment(garment = {}) {
  const id = selectionId(garment) || ''
  const asset = MODULAR_AVATAR_ASSETS[MODULAR_CATALOGUE_BINDINGS[id] || id]
  if (asset) return asset.slot

  const catalogueSlot = typeof garment === 'string' ? '' : garment.slot
  if (!CATALOGUE_SLOTS.has(catalogueSlot)) return null
  if (catalogueSlot === 'outerwear') return 'outer'
  if (catalogueSlot !== 'top') return catalogueSlot

  const outerwearText = [id, garment.cut, ...(garment.tags || [])].filter(Boolean).join(' ')
  return OUTERWEAR_CUT.test(outerwearText) ? 'outer' : 'top'
}

export function modularEquipmentFromAppearance(appearance = {}) {
  const details = appearance.garmentDetails || {}
  const topSlot = modularSlotForCatalogueGarment(details.top)
  const topId = selectionId(details.top)
  return Object.freeze({
    top: topSlot === 'top' ? topId : undefined,
    outer: selectionId(details.outerwear) || selectionId(details.outer) || (topSlot === 'outer' ? topId : undefined),
    bottom: selectionId(details.bottom),
    shoes: selectionId(details.shoes),
    apron: selectionId(details.apron),
    accessory: selectionId(details.accessory),
  })
}

export function renderModularAvatar({
  preset = 'head-02',
  skinTone = 'warm-medium',
  equipment = {},
} = {}, {
  className = '',
  label = 'Character preview',
} = {}) {
  const resolvedPreset = preset === 'preset-medium-01' ? 'head-02' : preset
  const resolvedHead = MODULAR_HEAD_PRESETS.includes(resolvedPreset) ? resolvedPreset : MODULAR_HEAD_PRESETS[0]
  const resolvedTone = MODULAR_SKIN_TONES.includes(skinTone) ? skinTone : 'warm-medium'
  const requested = {
    base: `body-shared-${resolvedTone}`,
    feet: equipment.shoes ? null : `feet-shared-${resolvedTone}`,
    identity: `${resolvedHead}-${resolvedTone}`,
    ...equipment,
  }
  const layers = MODULAR_AVATAR_SLOTS
    .map((slot) => modularAssetFor(requested[slot], slot))
    .filter(Boolean)
    .map((asset) => `<img class="modular-avatar__layer modular-avatar__layer--${asset.slot}" data-avatar-slot="${asset.slot}" data-avatar-asset="${escapeAttribute(asset.id)}" src="${escapeAttribute(asset.src)}" alt="" draggable="false">`)
    .join('')

  return `<span class="modular-avatar ${escapeAttribute(className)}" role="img" aria-label="${escapeAttribute(label)}" data-avatar-preset="${escapeAttribute(resolvedHead)}" data-avatar-skin-tone="${escapeAttribute(resolvedTone)}">${layers}</span>`
}

