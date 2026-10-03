// Equipment semantics shared by the catalogue, crafted pieces and save migration.
// Renderers may call the outerwear draw layer "outer"; that is not a second slot.
export const GARMENT_SLOTS = Object.freeze(['top', 'outerwear', 'bottom', 'apron', 'shoes', 'accessory'])

const OUTERWEAR_CUT = /(?:^|[\s-])(?:jacket|coat|peacoat|tailcoat|blazer|cardigan|waistcoat|vest|cape|capelet|hoodie|bomber|trucker)(?:$|[\s-])/i

export function garmentEquipmentSlot(garment = {}) {
  const slot = garment.slot === 'outer' ? 'outerwear' : garment.slot
  if (slot === 'top' && OUTERWEAR_CUT.test(String(garment.cut || ''))) return 'outerwear'
  return GARMENT_SLOTS.includes(slot) ? slot : 'apron'
}
