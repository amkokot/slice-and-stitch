import { garmentCatalog, createCharacterState, equipGarment, unequipGarment } from './character-model.js'
import { accessoryEquipmentZone } from './character-v2/identity-catalog.js'

export const WARDROBE_PAGE_SIZE = 24
export const WARDROBE_THEMES = Object.freeze([
  ['all', 'Every collection'], ['everyday', 'Everyday'], ['workroom', 'Workroom'],
  ['tailored', 'Tailored'], ['occasion', 'Occasion'], ['statement', 'Statement'],
  ['specialty', 'Leather & luxury'],
])

function searchable(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim()
}

export function wardrobeTheme(garment) {
  const tags = [garment.collection, ...(garment.tags || [])].join(' ')
  if (/couture|editorial|dramatic|statement/.test(tags)) return 'statement'
  if (/occasion|formal|evening|romantic|jewelry/.test(tags)) return 'occasion'
  if (/artisan|maker|service|workwear|utility|masterwork/.test(tags) || garment.slot === 'apron') return 'workroom'
  if (/tailored|office|heritage/.test(tags)) return 'tailored'
  return 'everyday'
}

function isSpecialtyMaterial(garment) {
  if (['leather', 'suede', 'velvet', 'satin', 'brocade'].includes(garment.material?.family)) return true
  // Fashion results from older saves store the fiber in tags/pattern instead
  // of material metadata. Keep handmade specialty pieces in the same drawer.
  const fibers = [garment.pattern, garment.customization?.fabric?.fiber, ...(garment.tags || [])].join(' ')
  return garment.source === 'crafted' && /\b(leather|suede|velvet|satin|brocade)\b/i.test(fibers)
}

// Ownership is a permanent unlock (including older saves and handmade items).
// Otherwise the atelier gate applies to every drawer, search and fitting route.
export function wardrobeGarmentUnlocked(state, garment, atelierLevel = 1) {
  return Boolean(garment && (state.wardrobe.includes(garment.id) || (garment.unlockLevel || 1) <= Math.max(1, Number(atelierLevel) || 1)))
}

export function selectWardrobeGarments(state, { scope = 'owned', slot = 'all', theme = 'all', search = '', sort = 'name', atelierLevel = 1 } = {}) {
  const owned = new Set(state.wardrobe)
  const terms = searchable(search).split(' ').filter(Boolean)
  const selected = garmentCatalog(state).filter((garment) => {
    if (!wardrobeGarmentUnlocked(state, garment, atelierLevel)) return false
    if (scope !== 'catalogue' && !owned.has(garment.id)) return false
    if (slot !== 'all' && garment.slot !== slot) return false
    if (theme === 'specialty' ? !isSpecialtyMaterial(garment) : theme !== 'all' && wardrobeTheme(garment) !== theme) return false
    const text = searchable([garment.name, garment.cut, garment.slot, garment.collection, garment.pattern,
      garment.source === 'crafted' ? 'handmade crafted' : '', ...(garment.tags || []),
      garment.material?.name, garment.customization?.fabric?.fiber, garment.outline?.silhouette,
      garment.colorPattern?.key].filter(Boolean).join(' '))
    return terms.every((term) => text.includes(term))
  })
  return selected.sort((a, b) => {
    if (sort === 'quality') return b.quality - a.quality || a.name.localeCompare(b.name)
    if (sort === 'price') return (a.price || 0) - (b.price || 0) || a.name.localeCompare(b.name)
    if (sort === 'handmade') return Number(b.source === 'crafted') - Number(a.source === 'crafted') || a.name.localeCompare(b.name)
    return a.name.localeCompare(b.name)
  })
}

export function wardrobeFittingSlot(garment) {
  return garment.slot === 'accessory' ? `accessory:${accessoryEquipmentZone(garment)}` : garment.slot
}

// Keep one temporary choice per clothing slot or accessory attachment zone.
export function addWardrobeTryOn(state, garmentIds, garmentId, atelierLevel = 1) {
  const catalogue = garmentCatalog(state)
  const garment = catalogue.find(({ id }) => id === garmentId)
  if (!wardrobeGarmentUnlocked(state, garment, atelierLevel)) return garmentIds
  const slot = wardrobeFittingSlot(garment)
  return [...garmentIds.filter((id) => {
    const current = catalogue.find((piece) => piece.id === id)
    return current && wardrobeFittingSlot(current) !== slot
  }), garmentId]
}

// Fitting-room state is ephemeral: never grant ownership or publish to the store.
// Accept a single ID for existing callers, or a complete layered outfit.
export function wardrobeTryOnState(state, selection, emptySlots = [], atelierLevel = 1) {
  const catalogueIds = new Set(garmentCatalog(state).filter(garment => wardrobeGarmentUnlocked(state, garment, atelierLevel)).map(({ id }) => id))
  const garmentIds = (Array.isArray(selection) ? selection : [selection]).filter((id) => catalogueIds.has(id))
  const removable = emptySlots.filter((slot) => ['outerwear', 'apron'].includes(slot) || slot.startsWith('accessory:'))
  if (!garmentIds.length && !removable.length) return state
  let fitted = createCharacterState({ ...state, wardrobe: [...new Set([...state.wardrobe, ...garmentIds])] })
  for (const slot of removable) fitted = unequipGarment(fitted, slot)
  for (const id of garmentIds) fitted = equipGarment(fitted, id)
  return fitted
}
