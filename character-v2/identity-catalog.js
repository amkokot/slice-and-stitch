const freezeOptions = (options) => Object.freeze(options.map((option) => Object.freeze(option)))

export const CHARACTER_IDENTITY_OPTIONS = Object.freeze({
  frames: freezeOptions([
    { id: 'slender', label: 'Slender', renderAs: 'tall' },
    { id: 'compact', label: 'Compact', renderAs: 'compact' },
    { id: 'average', label: 'Balanced', renderAs: 'average' },
    { id: 'athletic', label: 'Athletic', renderAs: 'average' },
    { id: 'soft', label: 'Soft', renderAs: 'broad' },
    { id: 'broad', label: 'Broad', renderAs: 'broad' },
  ]),
  heights: freezeOptions([
    { id: 'short', label: 'Short', scale: .93 },
    { id: 'mid-short', label: 'Mid-short', scale: .97 },
    { id: 'average', label: 'Average', scale: 1 },
    { id: 'mid-tall', label: 'Mid-tall', scale: 1.035 },
    { id: 'tall', label: 'Tall', scale: 1.07 },
  ]),
  skinTones: freezeOptions([
    { id: 'alabaster', label: 'Alabaster', color: '#f6d9c5' },
    { id: 'porcelain', label: 'Porcelain', color: '#f2c9ae' },
    { id: 'peach', label: 'Peach', color: '#eab896' },
    { id: 'golden-light', label: 'Golden light', color: '#dda77d' },
    { id: 'golden', label: 'Golden', color: '#d59a6f' },
    { id: 'olive-light', label: 'Olive light', color: '#c98d67' },
    { id: 'warm-medium', label: 'Warm medium', color: '#b96f50' },
    { id: 'olive-medium', label: 'Olive medium', color: '#a9694f' },
    { id: 'umber-light', label: 'Umber light', color: '#965a42' },
    { id: 'deep-golden', label: 'Deep golden', color: '#87513b' },
    { id: 'deep', label: 'Deep', color: '#754535' },
    { id: 'mahogany', label: 'Mahogany', color: '#653a2f' },
    { id: 'umber', label: 'Umber', color: '#533129' },
    { id: 'espresso', label: 'Espresso', color: '#432821' },
  ]),
  faceShapes: freezeOptions([
    { id: 'soft-round', label: 'Soft round' },
    { id: 'oval', label: 'Oval' },
    { id: 'heart', label: 'Heart' },
    { id: 'square', label: 'Square' },
    { id: 'long', label: 'Long' },
    { id: 'diamond', label: 'Diamond' },
  ]),
  eyeShapes: freezeOptions([
    { id: 'almond', label: 'Almond' },
    { id: 'round', label: 'Round' },
    { id: 'hooded', label: 'Hooded' },
    { id: 'upturned', label: 'Upturned' },
    { id: 'downturned', label: 'Downturned' },
    { id: 'deep-set', label: 'Deep-set' },
    { id: 'monolid', label: 'Monolid' },
    { id: 'tapered', label: 'Tapered' },
    { id: 'narrow', label: 'Narrow' },
    { id: 'crescent', label: 'Crescent' },
  ]),
  eyeColors: freezeOptions([
    { id: 'dark-brown', label: 'Dark brown', color: '#33241f' },
    { id: 'coffee', label: 'Coffee', color: '#4b3028' },
    { id: 'amber', label: 'Amber', color: '#a36b32' },
    { id: 'hazel', label: 'Hazel', color: '#76663f' },
    { id: 'green', label: 'Green', color: '#416c58' },
    { id: 'gray-green', label: 'Gray green', color: '#6c7d70' },
    { id: 'blue', label: 'Blue', color: '#4f7280' },
    { id: 'gray-blue', label: 'Gray blue', color: '#768695' },
  ]),
  browStyles: freezeOptions([
    { id: 'soft', label: 'Soft' },
    { id: 'straight', label: 'Straight' },
    { id: 'arched', label: 'Arched' },
    { id: 'full', label: 'Full' },
    { id: 'fine', label: 'Fine' },
    { id: 'bold', label: 'Bold' },
  ]),
  noseShapes: freezeOptions([
    { id: 'button', label: 'Button' },
    { id: 'straight', label: 'Straight' },
    { id: 'rounded', label: 'Rounded' },
    { id: 'wide', label: 'Wide' },
    { id: 'aquiline', label: 'Aquiline' },
    { id: 'upturned', label: 'Upturned' },
  ]),
  mouthStyles: freezeOptions([
    { id: 'soft', label: 'Soft' },
    { id: 'full', label: 'Full' },
    { id: 'wide', label: 'Wide' },
    { id: 'bowed', label: 'Cupid bow' },
    { id: 'fine', label: 'Fine' },
    { id: 'crooked-smile', label: 'Crooked smile' },
  ]),
  faces: freezeOptions([
    { id: 'bright', label: 'Bright' },
    { id: 'soft', label: 'Soft' },
    { id: 'focused', label: 'Focused' },
    { id: 'confident', label: 'Confident', renderAs: 'bright' },
    { id: 'thoughtful', label: 'Thoughtful', renderAs: 'soft' },
  ]),
  complexionDetails: freezeOptions([
    { id: 'none', label: 'None' },
    { id: 'freckles-soft', label: 'Soft freckles' },
    { id: 'freckles-full', label: 'Full freckles' },
    { id: 'beauty-mark', label: 'Beauty mark' },
    { id: 'rosy', label: 'Rosy cheeks' },
    { id: 'sun-kissed', label: 'Sun-kissed' },
  ]),
  facialHair: freezeOptions([
    { id: 'none', label: 'None' },
    { id: 'stubble', label: 'Stubble' },
    { id: 'mustache', label: 'Mustache' },
    { id: 'goatee', label: 'Goatee' },
    { id: 'short-beard', label: 'Short beard' },
    { id: 'full-beard', label: 'Full beard' },
  ]),
  hairTextures: freezeOptions([
    { id: 'straight', label: 'Straight' },
    { id: 'wavy', label: 'Wavy' },
    { id: 'curly', label: 'Curly' },
    { id: 'coily', label: 'Coily' },
    { id: 'ringlets', label: 'Ringlets' },
    { id: 'tight-curls', label: 'Tight curls' },
    { id: 'locs', label: 'Locs' },
    { id: 'braided', label: 'Braided' },
  ]),
  hairStyles: freezeOptions([
    { id: 'buzz', label: 'Buzz cut', renderAs: 'crop', textures: ['straight', 'wavy', 'curly', 'coily'] },
    { id: 'crop', label: 'Textured crop', renderAs: 'crop' },
    { id: 'side-part', label: 'Side part', renderAs: 'crop', textures: ['straight', 'wavy'] },
    { id: 'curly-top', label: 'Curly top', renderAs: 'curls', textures: ['curly', 'coily', 'ringlets', 'tight-curls'] },
    { id: 'bob', label: 'Soft bob', renderAs: 'bob' },
    { id: 'shag', label: 'Layered shag', renderAs: 'bob' },
    { id: 'shoulder-waves', label: 'Shoulder waves', renderAs: 'bob', textures: ['wavy', 'curly', 'ringlets'] },
    { id: 'curls', label: 'Loose curls', renderAs: 'curls', textures: ['curly', 'coily', 'ringlets', 'tight-curls'] },
    { id: 'afro', label: 'Rounded afro', renderAs: 'curls', textures: ['coily', 'tight-curls'] },
    { id: 'twists', label: 'Short twists', renderAs: 'curls', textures: ['coily', 'locs'] },
    { id: 'loc-bob', label: 'Loc bob', renderAs: 'bob', textures: ['locs'] },
    { id: 'braided-bob', label: 'Braided bob', renderAs: 'bob', textures: ['braided'] },
    { id: 'ponytail', label: 'Ponytail', renderAs: 'ponytail' },
    { id: 'high-pony', label: 'High pony', renderAs: 'ponytail' },
    { id: 'braided-pony', label: 'Braided pony', renderAs: 'ponytail', textures: ['braided'] },
    { id: 'loc-pony', label: 'Loc pony', renderAs: 'ponytail', textures: ['locs'] },
    { id: 'bun', label: 'Loose bun', renderAs: 'bun' },
    { id: 'top-knot', label: 'Top knot', renderAs: 'bun' },
    { id: 'braided-bun', label: 'Braided bun', renderAs: 'bun', textures: ['braided'] },
    { id: 'loc-bun', label: 'Loc bun', renderAs: 'bun', textures: ['locs'] },
  ]),
  hairColors: freezeOptions([
    { id: 'ink', label: 'Ink', color: '#241f24' },
    { id: 'soft-black', label: 'Soft black', color: '#30282b' },
    { id: 'espresso', label: 'Espresso', color: '#422c29' },
    { id: 'dark-brown', label: 'Dark brown', color: '#5b352c' },
    { id: 'chestnut', label: 'Chestnut', color: '#744231' },
    { id: 'auburn', label: 'Auburn', color: '#8b4633' },
    { id: 'copper', label: 'Copper', color: '#a44d34' },
    { id: 'honey', label: 'Honey', color: '#bd8246' },
    { id: 'dark-blonde', label: 'Dark blonde', color: '#9f7b4c' },
    { id: 'silver', label: 'Silver', color: '#aaa4a0' },
    { id: 'white', label: 'White', color: '#ded7ce' },
    { id: 'plum', label: 'Plum', color: '#63445f' },
  ]),
  pronouns: freezeOptions([
    { id: 'they', label: 'They / them' },
    { id: 'she', label: 'She / her' },
    { id: 'he', label: 'He / him' },
    { id: 'any', label: 'Any pronouns' },
  ]),
})

export const ACCESSORY_EQUIPMENT_ZONES = Object.freeze(['head', 'neck', 'chest', 'shoulder', 'waist', 'hands'])

const ACCESSORY_CUT_ZONES = Object.freeze({
  beret: 'head', 'bucket-hat': 'head', cloche: 'head', 'newsboy-cap': 'head', 'pillbox-hat': 'head',
  turban: 'head', 'wide-brim-hat': 'head', 'picture-hat': 'head', fascinator: 'head', headband: 'head', 'veiled-beret': 'head',
  scarf: 'neck', 'bow-tie': 'neck', necktie: 'neck', collar: 'neck',
  brooch: 'chest',
  satchel: 'shoulder', tote: 'shoulder', handbag: 'shoulder', clutch: 'shoulder', 'box-bag': 'shoulder',
  belt: 'waist',
  gloves: 'hands',
})

export function accessoryEquipmentZone(garment = {}) {
  const cut = String(garment.cut || '')
  if (ACCESSORY_CUT_ZONES[cut]) return ACCESSORY_CUT_ZONES[cut]
  const points = garment.attachmentPoints || []
  return ACCESSORY_EQUIPMENT_ZONES.find((zone) => points.includes(zone)) || 'chest'
}

export function identityOption(group, id) {
  const options = CHARACTER_IDENTITY_OPTIONS[group] || []
  return options.find((option) => option.id === id) || options[0] || null
}
