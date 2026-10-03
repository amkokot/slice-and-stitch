import { CHARACTER_V2_RIG_ID } from './rig.js'
import { accessoryEquipmentZone } from './identity-catalog.js'

const CUT_PARTS = Object.freeze({
  tee: Object.freeze(['torso', 'sleeve.back', 'sleeve.front']),
  blouse: Object.freeze(['torso', 'sleeve.back', 'sleeve.front', 'collar']),
  jacket: Object.freeze(['torso', 'sleeve.back', 'sleeve.front', 'lapel', 'pockets']),
  'chore-jacket': Object.freeze(['torso', 'sleeve.back', 'sleeve.front', 'collar', 'pockets']),
  cardigan: Object.freeze(['torso', 'sleeve.back', 'sleeve.front', 'placket']),
  waistcoat: Object.freeze(['torso', 'lapel']),
  'camp-shirt': Object.freeze(['torso', 'sleeve.back', 'sleeve.front', 'collar']),
  'oxford-shirt': Object.freeze(['torso', 'sleeve.back', 'sleeve.front', 'collar', 'placket']),
  coat: Object.freeze(['torso', 'sleeve.back', 'sleeve.front', 'lapel', 'pockets']),
  pants: Object.freeze(['hips', 'leg.back', 'leg.front']),
  skirt: Object.freeze(['hips', 'skirt']),
  'pleated-skirt': Object.freeze(['hips', 'skirt']),
  'peg-trouser': Object.freeze(['hips', 'leg.back', 'leg.front']),
  'bias-skirt': Object.freeze(['hips', 'skirt']),
  'wide-leg': Object.freeze(['hips', 'leg.back', 'leg.front']),
  culottes: Object.freeze(['hips', 'leg.back', 'leg.front']),
  'service-apron': Object.freeze(['strap.back', 'bib', 'skirt', 'pocket', 'tie']),
  'crossback-apron': Object.freeze(['strap.back', 'bib', 'skirt', 'pocket', 'tie']),
  pinafore: Object.freeze(['strap.back', 'bib', 'skirt', 'pocket']),
  'bib-apron': Object.freeze(['strap.back', 'bib', 'skirt', 'pocket', 'tie']),
  sneakers: Object.freeze(['shoe.back', 'shoe.front']),
  boots: Object.freeze(['shoe.back', 'shoe.front']),
  loafers: Object.freeze(['shoe.back', 'shoe.front']),
  flats: Object.freeze(['shoe.back', 'shoe.front']),
  clogs: Object.freeze(['shoe.back', 'shoe.front']),
  scarf: Object.freeze(['neck.wrap', 'scarf.tail']),
  brooch: Object.freeze(['chest.pin']),
  beret: Object.freeze(['head.hat']),
  satchel: Object.freeze(['strap', 'bag']),
})

function materialFor(garment = {}) {
  if (garment.tags?.includes('leather')) return 'leather'
  if (garment.tags?.includes('silk') || garment.cut?.includes('silk')) return 'silk'
  if (garment.tags?.includes('sheer') || garment.cut?.includes('organza')) return 'sheer'
  if (garment.tags?.includes('wool') || garment.cut?.includes('coat')) return 'wool'
  if (garment.tags?.includes('knitwear') || garment.pattern === 'cable') return 'knit'
  if (garment.pattern === 'denim' || garment.tags?.includes('denim')) return 'denim'
  if (garment.tags?.includes('soft') || garment.cut === 'pinafore') return 'linen'
  return 'cotton-canvas'
}

function inferredParts(garment, cut) {
  const slot = garment.slot || 'accessory'
  if (slot === 'top' || slot === 'outerwear') {
    const sleeveless = ['tank', 'camisole', 'halter', 'shell-top', 'corset-top', 'waistcoat'].some((token) => cut.includes(token))
    const long = ['dress', 'gown', 'jumpsuit', 'coat', 'cape'].some((token) => cut.includes(token))
    const outer = ['jacket', 'coat', 'blazer', 'cardigan', 'hoodie', 'bomber', 'cape'].some((token) => cut.includes(token))
    return Object.freeze([
      'torso',
      ...(sleeveless ? [] : ['sleeve.back', 'sleeve.front']),
      ...(outer ? ['collar-or-lapel', 'pockets', 'closure'] : ['neckline']),
      ...(long ? ['lower-panel.back', 'lower-panel.front'] : []),
    ])
  }
  if (slot === 'bottom') {
    const skirt = cut.includes('skirt') || cut.includes('gown')
    return Object.freeze(skirt
      ? ['hips', 'skirt.back', 'skirt.front', 'waistband']
      : ['hips', 'leg.back.left', 'leg.back.right', 'leg.front.left', 'leg.front.right', 'waistband'])
  }
  if (slot === 'apron') return Object.freeze(['strap.back', 'bib-or-yoke', 'lower-panel.back', 'lower-panel.front', 'pocket', 'tie-or-closure'])
  if (slot === 'shoes') return Object.freeze(['shoe.back.left', 'shoe.back.right', 'shoe.front.left', 'shoe.front.right', 'sole', 'closure'])
  const zone = accessoryEquipmentZone(garment)
  return Object.freeze({
    head: ['head.back', 'head.front'],
    neck: ['neck.back', 'neck.front', 'tail'],
    chest: ['chest.pin'],
    shoulder: ['strap.back', 'strap.front', 'bag'],
    waist: ['waist.back', 'waist.front', 'closure'],
    hands: ['hand.left', 'hand.right'],
  }[zone] || ['accessory'])
}

function secondaryMotionParts(garment, cut) {
  const values = []
  if (['skirt', 'dress', 'gown', 'cape', 'apron'].some((token) => cut.includes(token))) values.push('lower-panel')
  if (['scarf', 'tie', 'ribbon'].some((token) => cut.includes(token))) values.push('tail')
  if (['satchel', 'tote', 'handbag', 'clutch', 'bag'].some((token) => cut.includes(token))) values.push('bag')
  if (garment.slot === 'apron') values.push('waist-tie')
  return Object.freeze(values)
}

export function garmentVisualManifest(garment = {}) {
  const cut = String(garment.cut || garment.slot || 'garment')
  const parts = CUT_PARTS[cut] || inferredParts(garment, cut)
  return Object.freeze({
    id: String(garment.id || `visual-${cut}`),
    rig: CHARACTER_V2_RIG_ID,
    slot: String(garment.slot || 'accessory'),
    cut,
    parts,
    material: materialFor(garment),
    paletteChannels: Object.freeze({
      primary: garment.palette?.primary || '#775070',
      secondary: garment.palette?.secondary || '#efc6d2',
      hardware: garment.palette?.hardware || '#c89745',
    }),
    views: Object.freeze(['front', 'three-quarter', 'profile', 'back-three-quarter', 'back']),
    equipmentZone: garment.slot === 'accessory' ? accessoryEquipmentZone(garment) : garment.slot,
    secondaryMotion: secondaryMotionParts(garment, cut),
    customization: Object.freeze({
      modifications: Object.freeze([...(garment.customization?.modifications || [])]),
      finish: garment.customization?.finish || null,
      accentColor: garment.customization?.accentColor || garment.palette?.secondary || null,
      designDirection: garment.customization?.designDirection || null,
    }),
    inferred: !CUT_PARTS[cut],
    fallback: false,
  })
}

export function validateGarmentManifest(manifest = {}) {
  const errors = []
  if (manifest.rig !== CHARACTER_V2_RIG_ID) errors.push(`Expected rig ${CHARACTER_V2_RIG_ID}`)
  if (!manifest.id) errors.push('Missing garment id')
  if (!manifest.slot) errors.push('Missing garment slot')
  if (!Array.isArray(manifest.parts) || !manifest.parts.length) errors.push('Missing drawable parts')
  if (!Array.isArray(manifest.views) || !manifest.views.includes('three-quarter')) errors.push('Missing three-quarter view')
  return Object.freeze(errors)
}

