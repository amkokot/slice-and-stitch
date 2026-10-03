import { CHARACTER_V2_RIG_ID } from './rig.js'
import { ACCESSORY_EQUIPMENT_ZONES, accessoryEquipmentZone } from './identity-catalog.js'

export const CHARACTER_V2_SCHEMA_VERSION = 2

export const V2_ACCESSORY_SLOTS = Object.freeze(ACCESSORY_EQUIPMENT_ZONES.map((zone) => `accessory${zone[0].toUpperCase()}${zone.slice(1)}`))
export const V2_GARMENT_SLOTS = Object.freeze(['top', 'outerwear', 'bottom', 'apron', 'shoes', ...V2_ACCESSORY_SLOTS])

const DEFAULT_PROFILE = Object.freeze({
  schemaVersion: CHARACTER_V2_SCHEMA_VERSION,
  id: 'player',
  name: 'Mia',
  rig: CHARACTER_V2_RIG_ID,
  body: Object.freeze({ frame: 'average', height: 'average', skinTone: 'warm-medium' }),
  face: Object.freeze({
    shape: 'soft-round', brows: 'gentle', eyes: 'almond', eyeColor: 'hazel',
    nose: 'button', mouth: 'soft', restingExpression: 'bright', complexionDetail: 'freckles-soft', facialHair: 'none', freckles: 'soft',
  }),
  hair: Object.freeze({ texture: 'wavy', style: 'ponytail', color: 'espresso' }),
  equipped: Object.freeze({
    top: 'cream-work-tee',
    outerwear: null,
    bottom: 'denim-trousers',
    apron: 'house-apron',
    shoes: 'canvas-sneakers',
    accessoryHead: null,
    accessoryNeck: null,
    accessoryChest: null,
    accessoryShoulder: null,
    accessoryWaist: null,
    accessoryHands: null,
  }),
})

function accessorySlot(garmentId, garments = []) {
  const garment = garments.find((item) => item.id === garmentId)
  const zone = accessoryEquipmentZone(garment)
  return `accessory${zone[0].toUpperCase()}${zone.slice(1)}`
}

export function migrateCharacterV1(saved = {}, garments = []) {
  if (saved?.schemaVersion === CHARACTER_V2_SCHEMA_VERSION && saved?.profile?.rig === CHARACTER_V2_RIG_ID) {
    return normalizeCharacterV2(saved)
  }
  const source = saved.profile || saved || {}
  const oldEquipped = source.equipped || {}
  const equipped = { ...DEFAULT_PROFILE.equipped }
  ;['top', 'outerwear', 'bottom', 'apron', 'shoes'].forEach((slot) => {
    if (oldEquipped[slot] !== undefined) equipped[slot] = oldEquipped[slot]
  })
  if (oldEquipped.accessory) equipped[accessorySlot(oldEquipped.accessory, garments)] = oldEquipped.accessory

  return normalizeCharacterV2({
    schemaVersion: CHARACTER_V2_SCHEMA_VERSION,
    profile: {
      id: source.id,
      name: source.name,
      rig: CHARACTER_V2_RIG_ID,
      body: { frame: source.frame, skinTone: source.skinTone },
      face: {
        ...DEFAULT_PROFILE.face,
        mouth: source.face,
        eyeColor: source.eyeColor,
        freckles: source.freckles ? 'soft' : 'none',
      },
      hair: { style: source.hairStyle, color: source.hairColor },
      equipped,
    },
    wardrobe: saved.wardrobe,
    customGarments: saved.customGarments,
  })
}

export function normalizeCharacterV2(saved = {}) {
  const source = saved.profile || {}
  const profile = Object.freeze({
    ...DEFAULT_PROFILE,
    ...source,
    schemaVersion: CHARACTER_V2_SCHEMA_VERSION,
    rig: CHARACTER_V2_RIG_ID,
    id: String(source.id || DEFAULT_PROFILE.id),
    name: String(source.name || DEFAULT_PROFILE.name).trim().slice(0, 24) || DEFAULT_PROFILE.name,
    body: Object.freeze({ ...DEFAULT_PROFILE.body, ...(source.body || {}) }),
    face: Object.freeze({ ...DEFAULT_PROFILE.face, ...(source.face || {}) }),
    hair: Object.freeze({ ...DEFAULT_PROFILE.hair, ...(source.hair || {}) }),
    equipped: Object.freeze({ ...DEFAULT_PROFILE.equipped, ...(source.equipped || {}) }),
  })
  return Object.freeze({
    schemaVersion: CHARACTER_V2_SCHEMA_VERSION,
    profile,
    wardrobe: Object.freeze([...(saved.wardrobe || [])]),
    customGarments: Object.freeze([...(saved.customGarments || [])]),
  })
}

