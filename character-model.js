import { activeFashionSets, FASHION_CATALOG_GARMENTS } from './fashion-catalog.js'
import {
  ACCESSORY_EQUIPMENT_ZONES,
  CHARACTER_IDENTITY_OPTIONS,
  accessoryEquipmentZone,
  identityOption,
} from './character-v2/identity-catalog.js'
import { characterPreset } from './character-presets.js'
import { PAINTED_CAPSULE_STARTERS } from './character-v3/painted-capsule.js'
import { GARMENT_SLOTS, garmentEquipmentSlot } from './garment-slots.js'
import { garmentVisualDesign } from './garment-design.js'
import { gameStorage } from './game-storage.js'
import { playerAccount } from './player-account.js'

export const CHARACTER_SCHEMA_VERSION = 3
export const AVATAR_RIG_ID = 'biped-v2'
export const CHARACTER_STORAGE_KEY = 'slice-and-stitch.character.v2'
export const LEGACY_CHARACTER_STORAGE_KEY = 'slice-and-stitch.character.v1'

// Keep the existing storage key: loading it performs the additive v3 migration.
export { GARMENT_SLOTS }

export const CHARACTER_OPTIONS = CHARACTER_IDENTITY_OPTIONS
export { ACCESSORY_EQUIPMENT_ZONES }

function freezeGarment(garment) {
  return Object.freeze({
    rig: AVATAR_RIG_ID,
    source: 'built-in',
    quality: 70,
    tags: Object.freeze([]),
    attachmentPoints: Object.freeze([]),
    palette: Object.freeze({ primary: '#efe1bd', secondary: '#76506f' }),
    pattern: 'solid',
    cut: garment.slot,
    ...garment,
    ...garmentVisualDesign({ ...garment, palette: { primary: '#efe1bd', secondary: '#76506f', ...(garment.palette || {}) } }),
    slot: garmentEquipmentSlot(garment),
    palette: Object.freeze({ primary: '#efe1bd', secondary: '#76506f', ...(garment.palette || {}) }),
    tags: Object.freeze([...(garment.tags || [])]),
    attachmentPoints: Object.freeze([...(garment.attachmentPoints || [])]),
  })
}

export const BUILTIN_GARMENTS = Object.freeze(FASHION_CATALOG_GARMENTS.map(freezeGarment))

export const DEFAULT_CHARACTER_PROFILE = Object.freeze({
  schemaVersion: CHARACTER_SCHEMA_VERSION,
  id: 'player',
  presetId: 'mia',
  name: 'Mia',
  pronouns: 'they',
  frame: 'average',
  height: 'average',
  skinTone: 'warm-medium',
  faceShape: 'soft-round',
  eyeShape: 'almond',
  browStyle: 'soft',
  noseShape: 'button',
  mouthStyle: 'soft',
  complexionDetail: 'freckles-soft',
  facialHair: 'none',
  hairTexture: 'wavy',
  hairStyle: 'ponytail',
  hairColor: 'espresso',
  eyeColor: 'hazel',
  face: 'bright',
  freckles: true,
  accessories: Object.freeze(Object.fromEntries(ACCESSORY_EQUIPMENT_ZONES.map((zone) => [zone, null]))),
  equipped: Object.freeze({
    top: 'cream-work-tee',
    outerwear: null,
    bottom: 'denim-trousers',
    apron: 'house-apron',
    shoes: 'canvas-sneakers',
    accessory: null,
  }),
})

const STARTER_WARDROBE = Object.freeze([
  'cream-work-tee', 'violet-blouse', 'denim-trousers', 'house-apron', 'tomato-apron', 'canvas-sneakers',
  ...PAINTED_CAPSULE_STARTERS,
])

function optionExists(group, id) {
  return CHARACTER_OPTIONS[group].some((option) => option.id === id)
}

function safeName(value) {
  const name = String(value || '').trim().slice(0, 24)
  return name || DEFAULT_CHARACTER_PROFILE.name
}

export function normalizeCharacterProfile(profile = {}) {
  const equipped = { ...DEFAULT_CHARACTER_PROFILE.equipped, ...(profile.equipped || {}) }
  GARMENT_SLOTS.forEach((slot) => {
    if (equipped[slot] != null) equipped[slot] = String(equipped[slot])
  })
  return Object.freeze({
    ...DEFAULT_CHARACTER_PROFILE,
    ...profile,
    schemaVersion: CHARACTER_SCHEMA_VERSION,
    id: String(profile.id || DEFAULT_CHARACTER_PROFILE.id),
    presetId: characterPreset(profile.presetId || DEFAULT_CHARACTER_PROFILE.presetId).id,
    name: safeName(profile.name),
    frame: optionExists('frames', profile.frame) ? profile.frame : DEFAULT_CHARACTER_PROFILE.frame,
    height: optionExists('heights', profile.height) ? profile.height : DEFAULT_CHARACTER_PROFILE.height,
    skinTone: optionExists('skinTones', profile.skinTone) ? profile.skinTone : DEFAULT_CHARACTER_PROFILE.skinTone,
    faceShape: optionExists('faceShapes', profile.faceShape) ? profile.faceShape : DEFAULT_CHARACTER_PROFILE.faceShape,
    eyeShape: optionExists('eyeShapes', profile.eyeShape) ? profile.eyeShape : DEFAULT_CHARACTER_PROFILE.eyeShape,
    browStyle: optionExists('browStyles', profile.browStyle) ? profile.browStyle : DEFAULT_CHARACTER_PROFILE.browStyle,
    noseShape: optionExists('noseShapes', profile.noseShape) ? profile.noseShape : DEFAULT_CHARACTER_PROFILE.noseShape,
    mouthStyle: optionExists('mouthStyles', profile.mouthStyle) ? profile.mouthStyle : DEFAULT_CHARACTER_PROFILE.mouthStyle,
    complexionDetail: optionExists('complexionDetails', profile.complexionDetail) ? profile.complexionDetail : DEFAULT_CHARACTER_PROFILE.complexionDetail,
    facialHair: optionExists('facialHair', profile.facialHair) ? profile.facialHair : DEFAULT_CHARACTER_PROFILE.facialHair,
    hairTexture: optionExists('hairTextures', profile.hairTexture) ? profile.hairTexture : DEFAULT_CHARACTER_PROFILE.hairTexture,
    hairStyle: optionExists('hairStyles', profile.hairStyle) ? profile.hairStyle : DEFAULT_CHARACTER_PROFILE.hairStyle,
    hairColor: optionExists('hairColors', profile.hairColor) ? profile.hairColor : DEFAULT_CHARACTER_PROFILE.hairColor,
    eyeColor: optionExists('eyeColors', profile.eyeColor) ? profile.eyeColor : DEFAULT_CHARACTER_PROFILE.eyeColor,
    face: optionExists('faces', profile.face) ? profile.face : DEFAULT_CHARACTER_PROFILE.face,
    freckles: profile.freckles == null
      ? DEFAULT_CHARACTER_PROFILE.freckles
      : Boolean(profile.freckles),
    pronouns: optionExists('pronouns', profile.pronouns) ? profile.pronouns : DEFAULT_CHARACTER_PROFILE.pronouns,
    accessories: Object.freeze(Object.fromEntries(ACCESSORY_EQUIPMENT_ZONES.map((zone) => [zone, profile.accessories?.[zone] ? String(profile.accessories[zone]) : null]))),
    equipped: Object.freeze(equipped),
  })
}

export function normalizeGarment(garment = {}) {
  const slot = garmentEquipmentSlot(garment)
  return freezeGarment({
    id: String(garment.id || `garment-${slot}`),
    name: String(garment.name || 'Unnamed garment'),
    slot,
    rig: AVATAR_RIG_ID,
    source: String(garment.source || 'crafted'),
    cut: String(garment.cut || slot),
    pattern: String(garment.pattern || 'solid'),
    quality: Math.max(1, Math.min(100, Number(garment.quality) || 70)),
    palette: garment.palette,
    tags: garment.tags,
    attachmentPoints: garment.attachmentPoints,
    setId: garment.setId || null,
    setPieceId: FASHION_CATALOG_GARMENTS.some(item=>item.id===garment.setPieceId) ? garment.setPieceId : null,
    material: garment.material || null,
    outline: garment.outline,
    colorPattern: garment.colorPattern,
    customization: garment.customization || null,
    provenance: garment.provenance || null,
  })
}

export function createCharacterState(saved = {}) {
  const customGarments = Array.isArray(saved.customGarments)
    ? saved.customGarments.map(normalizeGarment)
    : []
  const catalog = new Map([...BUILTIN_GARMENTS, ...customGarments].map((garment) => [garment.id, garment]))
  const validIds = new Set(catalog.keys())
  const wardrobe = [...new Set([
    ...STARTER_WARDROBE,
    ...(Array.isArray(saved.wardrobe) ? saved.wardrobe.map(String) : []),
    ...customGarments.map((garment) => garment.id),
  ])].filter((id) => validIds.has(id))
  const profile = normalizeCharacterProfile(saved.profile)
  const equipped = { ...profile.equipped }
  // Older saves put a jacket in the top slot and the renderer invented its tee.
  // Preserve that jacket as an owned outer layer; give its wearer a real,
  // independently selectable neutral shirt. This migration is idempotent.
  const legacyOuter = catalog.get(equipped.top)
  if (legacyOuter?.slot === 'outerwear') {
    if (!catalog.has(equipped.outerwear)) equipped.outerwear = legacyOuter.id
    equipped.top = 'painted-crew-tee-ivory'
  }
  GARMENT_SLOTS.forEach((slot) => {
    if (equipped[slot] && catalog.get(equipped[slot])?.slot !== slot) equipped[slot] = DEFAULT_CHARACTER_PROFILE.equipped[slot]
  })
  // Retain equipped garments from partial older saves even if their wardrobe
  // array omitted the selected item. No existing IDs or provenance are rewritten.
  for (const id of [...Object.values(profile.equipped), ...Object.values(equipped)]) {
    if (validIds.has(id) && !wardrobe.includes(id)) wardrobe.push(id)
  }
  const accessories = Object.fromEntries(ACCESSORY_EQUIPMENT_ZONES.map((zone) => {
    const id = profile.accessories?.[zone]
    return [zone, id && validIds.has(id) ? id : null]
  }))
  return Object.freeze({
    schemaVersion: CHARACTER_SCHEMA_VERSION,
    profile: normalizeCharacterProfile({ ...profile, equipped, accessories }),
    wardrobe: Object.freeze(wardrobe),
    customGarments: Object.freeze(customGarments),
  })
}

export function garmentCatalog(state) {
  return [...BUILTIN_GARMENTS, ...(state?.customGarments || [])]
}

export function findGarment(state, garmentId) {
  return garmentCatalog(state).find((garment) => garment.id === garmentId) || null
}

export function equipGarment(state, garmentId) {
  const garment = findGarment(state, garmentId)
  if (!garment || !state.wardrobe.includes(garment.id)) return state
  if (garment.slot === 'accessory') {
    const zone = accessoryEquipmentZone(garment)
    return createCharacterState({
      ...state,
      profile: {
        ...state.profile,
        accessories: { ...state.profile.accessories, [zone]: garment.id },
        equipped: { ...state.profile.equipped, accessory: garment.id },
      },
    })
  }
  return createCharacterState({
    ...state,
    profile: {
      ...state.profile,
      equipped: { ...state.profile.equipped, [garment.slot]: garment.id },
    },
  })
}

export function unequipGarment(state, slot) {
  if (slot.startsWith('accessory:')) {
    const zone = slot.split(':')[1]
    if (!ACCESSORY_EQUIPMENT_ZONES.includes(zone)) return state
    const accessories = { ...state.profile.accessories, [zone]: null }
    const remaining = ACCESSORY_EQUIPMENT_ZONES.map((item) => accessories[item]).find(Boolean) || null
    return createCharacterState({
      ...state,
      profile: { ...state.profile, accessories, equipped: { ...state.profile.equipped, accessory: remaining } },
    })
  }
  if (!GARMENT_SLOTS.includes(slot) || slot === 'top' || slot === 'bottom' || slot === 'shoes') return state
  if (slot === 'accessory') {
    return createCharacterState({
      ...state,
      profile: {
        ...state.profile,
        accessories: Object.fromEntries(ACCESSORY_EQUIPMENT_ZONES.map((zone) => [zone, null])),
        equipped: { ...state.profile.equipped, accessory: null },
      },
    })
  }
  return createCharacterState({
    ...state,
    profile: { ...state.profile, equipped: { ...state.profile.equipped, [slot]: null } },
  })
}

export function updateCharacterProfile(state, patch) {
  return createCharacterState({ ...state, profile: { ...state.profile, ...patch } })
}

export function selectCharacterPreset(state, presetId) {
  const selected = characterPreset(presetId)
  return updateCharacterProfile(state, { ...selected.profile, presetId: selected.id })
}

export function garmentFromFashionResult(payload, sequence = 1) {
  const event = payload?.kind === 'fashion' ? payload : payload?.detail?.kind === 'fashion' ? payload.detail : null
  const result = event?.result || payload?.result || payload
  const garment = result?.garment
  if (!garment) return null
  const runId = event?.runId || sequence
  const projectId = String(garment.customization?.projectId || '').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 80)
  return normalizeGarment({
    id: projectId ? `crafted-${projectId}` : `crafted-${garment.slot || 'apron'}-${runId}-${sequence}`,
    name: garment.name || 'Handmade service apron',
    slot: garment.slot || 'apron',
    cut: garment.cut || 'service-apron',
    pattern: garment.pattern || 'handmade',
    quality: garment.quality,
    setId: garment.setId || null,
    setPieceId: garment.setPieceId || null,
    palette: { primary: garment.color || '#775070', secondary: garment.accentColor || '#f4d8ad' },
    tags: ['handmade', ...(garment.tags || ['service'])],
    attachmentPoints: garment.attachmentPoints || ({
      top: ['torso', 'left-arm', 'right-arm'],
      outerwear: ['torso', 'left-arm', 'right-arm'],
      bottom: ['hips', 'left-leg', 'right-leg'],
      apron: ['chest', 'waist'],
      shoes: ['left-foot', 'right-foot'],
      accessory: ['neck'],
    }[garment.slot] || ['chest', 'waist']),
    customization: garment.customization || null,
    provenance: Object.freeze({ source: 'fashion-minigame', runId, value: garment.value || 0 }),
    material: garment.material || null,
    outline: garment.outline,
    colorPattern: garment.colorPattern,
  })
}

export function addCraftedGarment(state, payload) {
  const garment = garmentFromFashionResult(payload, state.customGarments.length + 1)
  if (!garment || garmentCatalog(state).some((item) => item.id === garment.id)) return state
  return createCharacterState({
    ...state,
    wardrobe: [...state.wardrobe, garment.id],
    customGarments: [...state.customGarments, garment],
  })
}

export function addCatalogGarment(state, garmentId) {
  const garment = BUILTIN_GARMENTS.find((item) => item.id === garmentId)
  if (!garment || state.wardrobe.includes(garment.id)) return state
  return createCharacterState({ ...state, wardrobe: [...state.wardrobe, garment.id] })
}

export function wardrobeSetBonuses(state) {
  const equipped = [...Object.values(state.profile.equipped), ...Object.values(state.profile.accessories || {})]
    .map(id=>findGarment(state,id))
  return activeFashionSets(equipped)
}

function option(group, id) {
  return CHARACTER_OPTIONS[group].find((item) => item.id === id) || CHARACTER_OPTIONS[group][0]
}

export function characterToActorAppearance(stateOrProfile) {
  const state = stateOrProfile?.profile ? stateOrProfile : createCharacterState({ profile: stateOrProfile })
  const profile = state.profile
  const equipped = Object.fromEntries(GARMENT_SLOTS.map((slot) => [slot, findGarment(state, profile.equipped[slot])]))
  const accessories = ACCESSORY_EQUIPMENT_ZONES.map((zone) => {
    const garment = findGarment(state, profile.accessories?.[zone])
    // Equipment adapters must retain the same art-registration metadata as
    // catalogue records; otherwise a saved scarf falls back to geometric art.
    return garment ? Object.freeze({ zone, id: garment.id, slot: garment.slot, cut: garment.cut, tags: garment.tags, palette: garment.palette, pattern: garment.pattern, material: garment.material, outline: garment.outline, colorPattern: garment.colorPattern, customization: garment.customization }) : null
  }).filter(Boolean)
  const frameOption = identityOption('frames', profile.frame)
  const hairOption = identityOption('hairStyles', profile.hairStyle)
  const faceOption = identityOption('faces', profile.face)
  const garmentDetail = (garment) => garment ? Object.freeze({
    id: garment.id,
    slot: garment.slot,
    cut: garment.cut,
    pattern: garment.pattern,
    palette: garment.palette,
    tags: garment.tags,
    customization: garment.customization,
    material: garment.material,
    outline: garment.outline,
    colorPattern: garment.colorPattern,
  }) : null
  return Object.freeze({
    skin: option('skinTones', profile.skinTone).color,
    hair: option('hairColors', profile.hairColor).color,
    eye: option('eyeColors', profile.eyeColor).color,
    frame: frameOption?.renderAs || profile.frame,
    frameId: profile.frame,
    height: profile.height,
    heightScale: identityOption('heights', profile.height)?.scale || 1,
    hairStyle: hairOption?.renderAs || profile.hairStyle,
    hairStyleId: profile.hairStyle,
    hairTexture: profile.hairTexture,
    face: faceOption?.renderAs || profile.face,
    faceId: profile.face,
    faceShape: profile.faceShape,
    eyeShape: profile.eyeShape,
    browStyle: profile.browStyle,
    noseShape: profile.noseShape,
    mouthStyle: profile.mouthStyle,
    complexionDetail: profile.complexionDetail,
    facialHair: profile.facialHair,
    freckles: profile.freckles,
    pronouns: profile.pronouns,
    top: equipped.top?.palette.primary || '#efe1bd',
    topAccent: equipped.top?.palette.secondary || '#b94836',
    topCut: equipped.top?.cut || 'tee',
    topPattern: equipped.top?.pattern || 'solid',
    outerwear: equipped.outerwear?.palette.primary || 'transparent',
    outerwearAccent: equipped.outerwear?.palette.secondary || 'transparent',
    outerwearCut: equipped.outerwear?.cut || 'none',
    outerwearPattern: equipped.outerwear?.pattern || 'solid',
    hasOuterwear: Boolean(equipped.outerwear),
    bottom: equipped.bottom?.palette.primary || '#607488',
    bottomAccent: equipped.bottom?.palette.secondary || '#d8a558',
    bottomCut: equipped.bottom?.cut || 'pants',
    bottomPattern: equipped.bottom?.pattern || 'solid',
    apron: equipped.apron?.palette.primary || 'transparent',
    apronAccent: equipped.apron?.palette.secondary || 'transparent',
    apronCut: equipped.apron?.cut || 'service-apron',
    apronPattern: equipped.apron?.pattern || 'solid',
    hasApron: Boolean(equipped.apron),
    shoes: equipped.shoes?.palette.primary || '#efe3c7',
    shoeAccent: equipped.shoes?.palette.secondary || '#775070',
    shoeCut: equipped.shoes?.cut || 'sneakers',
    accessory: equipped.accessory?.palette.primary || 'transparent',
    accessoryAccent: equipped.accessory?.palette.secondary || 'transparent',
    accessoryCut: equipped.accessory?.cut || 'none',
    hasAccessory: Boolean(equipped.accessory),
    accessories: Object.freeze(accessories),
    garmentDetails: Object.freeze({
      top: garmentDetail(equipped.top),
      outerwear: garmentDetail(equipped.outerwear),
      bottom: garmentDetail(equipped.bottom),
      apron: garmentDetail(equipped.apron),
      shoes: garmentDetail(equipped.shoes),
      accessory: garmentDetail(equipped.accessory),
    }),
    rig: AVATAR_RIG_ID,
  })
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

export function createCharacterStore({ storage = gameStorage() } = {}) {
  let saved = null
  try {
    const raw = storage?.getItem(CHARACTER_STORAGE_KEY) || storage?.getItem(LEGACY_CHARACTER_STORAGE_KEY)
    saved = raw ? JSON.parse(raw) : null
  }
  catch { saved = null }
  const account=typeof document==='undefined' ? null : playerAccount()
  const identity=account?.profile ? Object.fromEntries(Object.entries(account.profile).filter(([key])=>!['equipped','accessories'].includes(key))) : {}
  let state = createCharacterState({...saved,profile:{...(saved?.profile || {}),...identity}})
  try { storage?.setItem(CHARACTER_STORAGE_KEY, JSON.stringify(state)) }
  catch { /* Migration remains in memory when storage is unavailable. */ }
  const listeners = new Set()

  function publish(nextState) {
    state = nextState
    try { storage?.setItem(CHARACTER_STORAGE_KEY, JSON.stringify(state)) }
    catch { /* The prototype still works when storage is unavailable. */ }
    listeners.forEach((listener) => listener(snapshot()))
    return snapshot()
  }

  function snapshot() {
    return createCharacterState(clone(state))
  }

  return Object.freeze({
    snapshot,
    updateProfile: (patch) => publish(updateCharacterProfile(state, patch)),
    selectPreset: (presetId) => publish(selectCharacterPreset(state, presetId)),
    equip: (garmentId) => publish(equipGarment(state, garmentId)),
    unequip: (slot) => publish(unequipGarment(state, slot)),
    addCrafted: (payload) => publish(addCraftedGarment(state, payload)),
    addCatalog: (garmentId) => publish(addCatalogGarment(state, garmentId)),
    replaceSharedInventory: (inventory) => {
      if(JSON.stringify([state.wardrobe,state.customGarments])===JSON.stringify([inventory.wardrobe,inventory.customGarments])) return snapshot()
      return publish(sharedCharacterState(state.profile,inventory))
    },
    reset: () => publish(createCharacterState()),
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  })
}

export function sharedCharacterState(profile,inventory) {
  const base=createCharacterState({wardrobe:inventory.wardrobe,customGarments:inventory.customGarments})
  const owned=new Set(base.wardrobe)
  const equipped=Object.fromEntries(GARMENT_SLOTS.map(slot=>[slot,
    owned.has(profile?.equipped?.[slot]) ? profile.equipped[slot] : DEFAULT_CHARACTER_PROFILE.equipped[slot]]))
  const accessories=Object.fromEntries(ACCESSORY_EQUIPMENT_ZONES.map(zone=>[zone,owned.has(profile?.accessories?.[zone])?profile.accessories[zone]:null]))
  return createCharacterState({...base,profile:{...profile,equipped,accessories}})
}
