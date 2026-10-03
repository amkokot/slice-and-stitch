import { FASHION_CATALOG_GARMENTS } from '../fashion-catalog.js'
import { registeredGarmentAsset } from './registered-garments.js'

// One example of every source, not only the original capsule. No saved-player
// state is involved: the fitting room can exercise skin, hair and hem pairings.
export function wearableFitExamples(kind, { search = '', trousers = false } = {}) {
  const sources = new Set()
  const examples = []
  for (const garment of FASHION_CATALOG_GARMENTS) {
    const asset = registeredGarmentAsset(garment)
    const matches = kind === 'footwear'
      ? garment.slot === 'shoes'
      : garment.slot === 'accessory' && (asset?.coversCrown || ['headband', 'fascinator'].includes(asset?.family))
    if (!matches || !asset || sources.has(asset.src)) continue
    if (search && !`${garment.name} ${garment.cut} ${asset.family}`.toLowerCase().includes(search.toLowerCase())) continue
    sources.add(asset.src)
    examples.push({
      name: garment.name, auditItem: garment.id,
      top: 'painted-crew-tee-ivory',
      bottom: trousers ? 'painted-wide-trousers-sage' : 'painted-pencil-skirt-sage',
      shoes: kind === 'footwear' ? garment.id : 'painted-penny-loafers-ink',
      ...(kind === 'headwear' ? { accessory: garment.id } : {}),
    })
  }
  return examples
}
