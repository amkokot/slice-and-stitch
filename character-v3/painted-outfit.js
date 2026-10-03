import { assetUrl } from '../game-assets.js'
const OUTFIT_ATLASES = Object.freeze({
  signature: Object.freeze({
    light: 'assets/characters-v3/wardrobe/painted-outfit-bodies-light-v1-clean.png',
    medium: 'assets/characters-v3/wardrobe/painted-outfit-bodies-atlas-v1-clean.png',
    deep: 'assets/characters-v3/wardrobe/painted-outfit-bodies-deep-v1-clean.png',
  }),
  expanded: Object.freeze({
    light: 'assets/characters-v3/wardrobe/painted-outfit-bodies-light-v2-clean.png',
    medium: 'assets/characters-v3/wardrobe/painted-outfit-bodies-atlas-v2-clean.png',
    deep: 'assets/characters-v3/wardrobe/painted-outfit-bodies-deep-v2-clean.png',
  }),
})

// Sampled from the exposed neck and forearm pixels in the three production
// body plates. The modular head consumes this same palette so its highlights,
// midtone, and shadow meet the painted body without a material seam.
export const PAINTED_OUTFIT_SKIN_PALETTES = Object.freeze({
  light: Object.freeze({ highlight: '#ffe0ce', base: '#facbb2', warm: '#efad8c', shadow: '#ca8066', outline: '#6f4038' }),
  medium: Object.freeze({ highlight: '#ffc481', base: '#faa762', warm: '#ec8d4d', shadow: '#c66b38', outline: '#65382e' }),
  deep: Object.freeze({ highlight: '#9a6142', base: '#713f29', warm: '#7d432c', shadow: '#4a281f', outline: '#2e1c1b' }),
})

const LOOKS = Object.freeze({
  signature: Object.freeze([
    Object.freeze({ id: 'pizzeria', label: 'Pizzeria workwear' }),
    Object.freeze({ id: 'garden', label: 'Garden market' }),
    Object.freeze({ id: 'plum', label: 'Plum atelier' }),
    Object.freeze({ id: 'tailored', label: 'Tailored evening' }),
    Object.freeze({ id: 'maker', label: 'Maker studio' }),
  ]),
  expanded: Object.freeze([
    Object.freeze({ id: 'casual', label: 'Polished casual' }),
    Object.freeze({ id: 'couture', label: 'Sculptural couture' }),
    Object.freeze({ id: 'romantic', label: 'Romantic daywear' }),
    Object.freeze({ id: 'outerwear', label: 'Tailored outerwear' }),
    Object.freeze({ id: 'modern', label: 'Modern workwear' }),
  ]),
})

function equipmentText(appearance = {}) {
  const details = appearance.garmentDetails || {}
  return [details.top?.id, details.outerwear?.id, details.bottom?.id, details.apron?.id, details.shoes?.id]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function paintedOutfitSelection(appearance = {}) {
  const text = equipmentText(appearance)
  if (/brocade|tapestry|jacquard|origami|petal|couture|runway|sculpted/.test(text)) return Object.freeze({ page: 'expanded', frame: 1 })
  if (/wrap-blouse|peasant|tiered|rose-bias|ribbon|circle-skirt/.test(text)) return Object.freeze({ page: 'expanded', frame: 2 })
  if (/trench|peacoat|cocoon|architect|opera-coat|lace-up|knee-boot|riding-boot/.test(text)) return Object.freeze({ page: 'expanded', frame: 3 })
  if (/hoodie|bomber|cargo|trainer|jogger|sweatshirt/.test(text)) return Object.freeze({ page: 'expanded', frame: 4 })
  if (/baby-tee|raglan|\btank\b|\bpolo\b|\bshorts\b|a-line|espadrille/.test(text)) return Object.freeze({ page: 'expanded', frame: 0 })
  if (/violet|butter|plum|rose-bias|embroidered/.test(text)) return Object.freeze({ page: 'signature', frame: 2 })
  if (/navy|ivory|charcoal|oxford/.test(text)) return Object.freeze({ page: 'signature', frame: 3 })
  if (/sage|market-pleat|garden/.test(text)) return Object.freeze({ page: 'signature', frame: 1 })
  if (/tomato/.test(text)) return Object.freeze({ page: 'signature', frame: 0 })
  if (/teal|tool-roll|house-apron|denim|ochre/.test(text)) return Object.freeze({ page: 'signature', frame: 4 })
  return Object.freeze({ page: 'signature', frame: 0 })
}

export function paintedOutfitFrame(appearance = {}) {
  return paintedOutfitSelection(appearance).frame
}

export function paintedOutfitSkinGroup(appearance = {}) {
  const match = String(appearance.skin || '').match(/^#([0-9a-f]{6})$/i)
  if (!match) return 'medium'
  const value = Number.parseInt(match[1], 16)
  const red = (value >> 16) & 255
  const green = (value >> 8) & 255
  const blue = value & 255
  const luminance = (.2126 * red + .7152 * green + .0722 * blue) / 255
  if (luminance >= .68) return 'light'
  // The medium plate is deliberately warm and covers golden/umber tones.
  // Reserve the deep plate for genuinely deep values so a golden face is not
  // attached to arms several shades darker.
  if (luminance < .34) return 'deep'
  return 'medium'
}

export function paintedOutfitSkinPalette(appearance = {}) {
  return PAINTED_OUTFIT_SKIN_PALETTES[paintedOutfitSkinGroup(appearance)]
}

function position(index, count) {
  return count <= 1 ? '0%' : `${index / (count - 1) * 100}%`
}

function escapeAttribute(value) {
  return String(value || '').replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

export function renderPaintedOutfitBody(appearance = {}, { className = '', label = '' } = {}) {
  const { page, frame } = paintedOutfitSelection(appearance)
  const skinGroup = paintedOutfitSkinGroup(appearance)
  const details = appearance.garmentDetails || {}
  const look = LOOKS[page][frame]
  const style = `--painted-outfit-image:url('${assetUrl(OUTFIT_ATLASES[page][skinGroup])}');--painted-outfit-x:${position(frame, LOOKS[page].length)}`
  return `<span class="painted-outfit-body ${className}" style="${style}" data-painted-outfit-page="${page}" data-painted-outfit-frame="${frame}" data-painted-outfit-look="${look.id}" data-painted-skin-group="${skinGroup}" data-equipped-top="${escapeAttribute(details.top?.id)}" data-equipped-bottom="${escapeAttribute(details.bottom?.id)}" data-equipped-apron="${escapeAttribute(details.apron?.id)}" data-equipped-shoes="${escapeAttribute(details.shoes?.id)}" role="img" aria-label="${escapeAttribute(label || look.label)}"></span>`
}

