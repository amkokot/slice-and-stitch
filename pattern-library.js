import { FASHION_SCHEMATICS, FASHION_CATALOG_GARMENTS } from './fashion-catalog.js'

const patterns = new Map(FASHION_SCHEMATICS.map(pattern => [pattern.id, pattern]))
const garments = new Map(FASHION_CATALOG_GARMENTS.map(garment => [garment.id, garment]))
export const PATTERN_SORTS = Object.freeze(['newest', 'value', 'tier', 'name'])
const coins = value => Math.max(0, Math.floor(Number(value) || 0))

export function patternPrice(patternOrId) {
  const pattern = typeof patternOrId === 'string' ? patterns.get(patternOrId) : patternOrId
  if (!pattern) return 0
  const garment = garments.get(pattern.artworkId)
  return Math.max(2, Math.round((garment?.price || pattern.baseValue * 1.8) * .12))
}

export function createPatternLibrary(saved = {}, { project } = {}) {
  const owned = new Set((Array.isArray(saved?.owned) ? saved.owned : []).filter(id => patterns.has(id)))
  // Honour an already-paid legacy project without retroactively charging it.
  if (project?.materialConsumed && !project.alterationMode && patterns.has(project.schematic?.id)) owned.add(project.schematic.id)
  // Insertion order is a durable acquisition order, including older saves.
  return { version: 2, owned: [...owned],
    newIds: [...new Set((Array.isArray(saved?.newIds) ? saved.newIds : []).filter(id => owned.has(id)))],
    sort: PATTERN_SORTS.includes(saved?.sort) ? saved.sort : 'newest' }
}

export function patternAvailability(library, patternOrId, level = 1, balance = 0, inventory) {
  const pattern = typeof patternOrId === 'string' ? patterns.get(patternOrId) : patterns.get(patternOrId?.id)
  if (!pattern) return { owned: false, unlocked: false, available: false, price: 0, reason: 'Unknown pattern.' }
  const price = patternPrice(pattern)
  const owned = library.owned.includes(pattern.id)
  const unlocked = owned || pattern.unlockLevel <= level
  const stocked = Boolean(inventory?.schematics?.some(item => item.id === pattern.id))
  return { owned, unlocked, stocked, price, isNew: Boolean(library.newIds?.includes(pattern.id)),
    available: stocked && unlocked && !owned && coins(balance) >= price,
    reason: owned ? 'Owned · reuse forever' : !unlocked ? `Atelier ${pattern.unlockLevel}`
      : !stocked ? 'Not in Mara’s stock today. Check back after dawn.'
      : coins(balance) < price ? `Need ${price - coins(balance)} more coins` : `Buy once · ${price} coins` }
}

export function purchasePattern(library, id, level, balance, inventory) {
  const current = createPatternLibrary(library)
  const status = patternAvailability(current, id, level, balance, inventory)
  if (!status.available) return { ok: false, ...status, library: current, balance: coins(balance) }
  return { ok: true, pattern: patterns.get(id), price: status.price,
    library: { ...current, owned: [...current.owned, id], newIds: [...current.newIds, id], sort: 'newest' },
    balance: coins(balance) - status.price }
}

export function patternLibrarySnapshot(library, level, balance, inventory) {
  const current = createPatternLibrary(library)
  return FASHION_SCHEMATICS.map(pattern => ({ ...pattern, acquiredOrder: current.owned.indexOf(pattern.id),
    ...patternAvailability(current, pattern, level, balance, inventory) }))
}

export function ownedPatternList(library, { sort, search = '' } = {}) {
  const current = createPatternLibrary(library)
  const terms = search.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const items = current.owned.map((id, acquiredOrder) => {
    const pattern = patterns.get(id)
    return { ...pattern, acquiredOrder, isNew: current.newIds.includes(id),
      catalogueValue: garments.get(pattern.artworkId)?.price || pattern.baseValue,
      designTier: pattern.unlockLevel }
  }).filter(pattern => terms.every(term => `${pattern.name} ${pattern.cut} ${pattern.slot} ${(pattern.tags || []).join(' ')}`.toLowerCase().includes(term)))
  const order = PATTERN_SORTS.includes(sort) ? sort : current.sort
  return items.sort((a, b) => (order === 'value' ? b.catalogueValue - a.catalogueValue
    : order === 'tier' ? b.designTier - a.designTier
      : order === 'name' ? a.name.localeCompare(b.name) : 0) || b.acquiredOrder - a.acquiredOrder)
}

export function markPatternUsed(library, id) {
  const current = createPatternLibrary(library)
  return { ...current, newIds: current.newIds.filter(patternId => patternId !== id) }
}
