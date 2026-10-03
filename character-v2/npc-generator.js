import { FASHION_CATALOG_GARMENTS } from '../fashion-catalog.js'
import {
  ACCESSORY_EQUIPMENT_ZONES,
  CHARACTER_IDENTITY_OPTIONS,
  accessoryEquipmentZone,
  identityOption,
} from './identity-catalog.js'

const ROLE_RULES = Object.freeze({
  customer: Object.freeze({ apronChance: .08, accessoryChance: .72, tags: ['casual', 'daywear', 'soft', 'classic'] }),
  regular: Object.freeze({ apronChance: .04, accessoryChance: .82, tags: ['bright', 'vintage', 'romantic', 'playful'] }),
  staff: Object.freeze({ apronChance: 1, accessoryChance: .32, tags: ['workwear', 'service', 'practical', 'utility'] }),
  shopkeeper: Object.freeze({ apronChance: .72, accessoryChance: .65, tags: ['artisan', 'tailored', 'maker', 'heritage'] }),
  courier: Object.freeze({ apronChance: .05, accessoryChance: .7, tags: ['utility', 'sport', 'casual', 'leather'] }),
  performer: Object.freeze({ apronChance: .03, accessoryChance: .9, tags: ['occasion', 'statement', 'ornate', 'bright'] }),
})

const TREND_TAGS = Object.freeze({
  garden: ['soft', 'romantic', 'daywear', 'floral', 'heritage'],
  maker: ['workwear', 'utility', 'artisan', 'denim'],
  classic: ['classic', 'tailored', 'heritage'],
  social: ['occasion', 'bright', 'vintage', 'soft'],
  midnight: ['evening', 'tailored', 'formal', 'statement'],
})

function hashSeed(value) {
  let hash = 2166136261
  for (const character of String(value || 'npc')) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function randomSequence(seed) {
  let state = hashSeed(seed) || 1
  return () => {
    state += 0x6D2B79F5
    let value = state
    value = Math.imul(value ^ value >>> 15, value | 1)
    value ^= value + Math.imul(value ^ value >>> 7, value | 61)
    return ((value ^ value >>> 14) >>> 0) / 4294967296
  }
}

function pick(items, random) {
  return items[Math.floor(random() * items.length) % items.length]
}

function weightedOption(group, random, predicate = () => true) {
  const options = CHARACTER_IDENTITY_OPTIONS[group].filter(predicate)
  return pick(options.length ? options : CHARACTER_IDENTITY_OPTIONS[group], random)
}

function garmentScore(garment, preferredTags, random) {
  const tagMatches = (garment.tags || []).filter((tag) => preferredTags.includes(tag)).length
  return tagMatches * 4 + (garment.quality || 70) / 100 + random()
}

function pickGarment(slot, random, { maxLevel, preferredTags }) {
  const candidates = FASHION_CATALOG_GARMENTS.filter((garment) => garment.slot === slot && (garment.unlockLevel || 1) <= maxLevel)
  if (!candidates.length) return null
  return [...candidates]
    .map((garment) => ({ garment, score: garmentScore(garment, preferredTags, random) }))
    .sort((a, b) => b.score - a.score)[0].garment
}

function outfitRecipe(random, { role, trend, level }) {
  const rules = ROLE_RULES[role] || ROLE_RULES.customer
  const preferredTags = [...rules.tags, ...(TREND_TAGS[trend] || TREND_TAGS.garden)]
  const top = pickGarment('top', random, { maxLevel: level, preferredTags })
  const bottom = pickGarment('bottom', random, { maxLevel: level, preferredTags })
  const shoes = pickGarment('shoes', random, { maxLevel: level, preferredTags })
  const apron = random() < rules.apronChance ? pickGarment('apron', random, { maxLevel: level, preferredTags }) : null
  const accessory = random() < rules.accessoryChance ? pickGarment('accessory', random, { maxLevel: level, preferredTags }) : null
  const accessories = Object.fromEntries(ACCESSORY_EQUIPMENT_ZONES.map((zone) => [zone, null]))
  if (accessory) accessories[accessoryEquipmentZone(accessory)] = accessory.id
  return Object.freeze({
    top: top?.id || null,
    bottom: bottom?.id || null,
    apron: apron?.id || null,
    shoes: shoes?.id || null,
    accessory: accessory?.id || null,
    accessories: Object.freeze(accessories),
    garments: Object.freeze({ top, bottom, apron, shoes, accessory }),
  })
}

export function generateNpcRecipe(seed, { role = 'customer', trend = 'garden', level = 5 } = {}) {
  const random = randomSequence(`${seed}:${role}:${trend}:${level}`)
  const hairTexture = weightedOption('hairTextures', random)
  const hairStyle = weightedOption('hairStyles', random, (option) => !option.textures || option.textures.includes(hairTexture.id))
  const complexionDetail = weightedOption('complexionDetails', random)
  const profile = Object.freeze({
    seed: String(seed),
    role,
    pronouns: weightedOption('pronouns', random).id,
    frame: weightedOption('frames', random).id,
    height: weightedOption('heights', random).id,
    skinTone: weightedOption('skinTones', random).id,
    faceShape: weightedOption('faceShapes', random).id,
    eyeShape: weightedOption('eyeShapes', random).id,
    eyeColor: weightedOption('eyeColors', random).id,
    browStyle: weightedOption('browStyles', random).id,
    noseShape: weightedOption('noseShapes', random).id,
    mouthStyle: weightedOption('mouthStyles', random).id,
    face: role === 'staff' || role === 'shopkeeper' ? 'bright' : weightedOption('faces', random).id,
    complexionDetail: complexionDetail.id,
    freckles: complexionDetail.id.startsWith('freckles'),
    facialHair: random() > .58 ? weightedOption('facialHair', random).id : 'none',
    hairTexture: hairTexture.id,
    hairStyle: hairStyle.id,
    hairColor: weightedOption('hairColors', random).id,
  })
  return Object.freeze({
    schemaVersion: 2,
    rig: 'biped-v2',
    seed: String(seed),
    profile,
    outfit: outfitRecipe(random, { role, trend, level: Math.max(1, Math.min(12, level)) }),
    behavior: Object.freeze({
      idleVariant: Math.floor(random() * 4),
      gestureVariant: Math.floor(random() * 5),
      gazePatienceMs: 850 + Math.floor(random() * 1900),
      walkTempo: .88 + random() * .25,
    }),
  })
}

export function appearanceFromNpcRecipe(recipe) {
  const { profile, outfit } = recipe
  const garments = outfit.garments
  const frame = identityOption('frames', profile.frame)
  const hairStyle = identityOption('hairStyles', profile.hairStyle)
  const face = identityOption('faces', profile.face)
  const accessories = Object.entries(outfit.accessories).filter(([, id]) => id).map(([zone, id]) => {
    const garment = FASHION_CATALOG_GARMENTS.find((item) => item.id === id)
    return Object.freeze({ zone, id, cut: garment?.cut || 'accessory', palette: garment?.palette })
  })
  return Object.freeze({
    rig: 'biped-v2',
    recipe,
    skin: identityOption('skinTones', profile.skinTone).color,
    hair: identityOption('hairColors', profile.hairColor).color,
    eye: identityOption('eyeColors', profile.eyeColor).color,
    frame: frame.renderAs || frame.id,
    frameId: profile.frame,
    height: profile.height,
    heightScale: identityOption('heights', profile.height).scale,
    hairStyle: hairStyle.renderAs || hairStyle.id,
    hairStyleId: profile.hairStyle,
    hairTexture: profile.hairTexture,
    face: face.renderAs || face.id,
    faceId: profile.face,
    faceShape: profile.faceShape,
    eyeShape: profile.eyeShape,
    browStyle: profile.browStyle,
    noseShape: profile.noseShape,
    mouthStyle: profile.mouthStyle,
    complexionDetail: profile.complexionDetail,
    facialHair: profile.facialHair,
    freckles: profile.freckles,
    top: garments.top?.palette.primary || '#efe1bd',
    topAccent: garments.top?.palette.secondary || '#b94836',
    topCut: garments.top?.cut || 'tee',
    topPattern: garments.top?.pattern || 'solid',
    bottom: garments.bottom?.palette.primary || '#607488',
    bottomAccent: garments.bottom?.palette.secondary || '#d8a558',
    bottomCut: garments.bottom?.cut || 'pants',
    bottomPattern: garments.bottom?.pattern || 'solid',
    apron: garments.apron?.palette.primary || 'transparent',
    apronAccent: garments.apron?.palette.secondary || 'transparent',
    apronCut: garments.apron?.cut || 'service-apron',
    apronPattern: garments.apron?.pattern || 'solid',
    hasApron: Boolean(garments.apron),
    shoes: garments.shoes?.palette.primary || '#efe3c7',
    shoeAccent: garments.shoes?.palette.secondary || '#775070',
    shoeCut: garments.shoes?.cut || 'sneakers',
    accessory: garments.accessory?.palette.primary || 'transparent',
    accessoryAccent: garments.accessory?.palette.secondary || 'transparent',
    accessoryCut: garments.accessory?.cut || 'none',
    hasAccessory: Boolean(garments.accessory),
    accessories: Object.freeze(accessories),
  })
}

export function generateNpcAppearance(seed, options = {}) {
  return appearanceFromNpcRecipe(generateNpcRecipe(seed, options))
}

export function generateNpcRoster(seed, count = 8, options = {}) {
  return Object.freeze(Array.from({ length: Math.max(0, count) }, (_, index) => {
    const recipe = generateNpcRecipe(`${seed}:${index}`, options)
    return Object.freeze({
      id: `npc-${hashSeed(`${seed}:${index}`).toString(36)}`,
      recipe,
      appearance: appearanceFromNpcRecipe(recipe),
    })
  }))
}
