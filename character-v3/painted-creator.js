const FACE_SHAPES = Object.freeze(['soft-round', 'oval', 'heart', 'square', 'long', 'diamond'])
const HAIR_STYLES = Object.freeze([
  'buzz', 'crop', 'side-part', 'curly-top', 'bob',
  'shag', 'shoulder-waves', 'curls', 'afro', 'twists',
  'loc-bob', 'braided-bob', 'ponytail', 'high-pony', 'braided-pony',
  'loc-pony', 'bun', 'top-knot', 'braided-bun', 'loc-bun',
])

const SKIN_FILTERS = Object.freeze({
  alabaster: 'brightness(1.23) saturate(.62)',
  porcelain: 'brightness(1.18) saturate(.7)',
  peach: 'brightness(1.12) saturate(.82)',
  'golden-light': 'brightness(1.06) saturate(.92)',
  golden: 'brightness(1.01) saturate(1)',
  'olive-light': 'brightness(.96) saturate(.94) hue-rotate(-4deg)',
  'warm-medium': 'brightness(.91) saturate(1.04)',
  'olive-medium': 'brightness(.84) saturate(.98) hue-rotate(-5deg)',
  'umber-light': 'brightness(.76) saturate(1.08)',
  'deep-golden': 'brightness(.68) saturate(1.12)',
  deep: 'brightness(.6) saturate(1.08)',
  mahogany: 'brightness(.53) saturate(1.12) hue-rotate(3deg)',
  umber: 'brightness(.46) saturate(1.04)',
  espresso: 'brightness(.39) saturate(.98)',
})

const HAIR_FILTERS = Object.freeze({
  ink: 'brightness(.38) saturate(.72)',
  'soft-black': 'brightness(.46) saturate(.74)',
  espresso: 'brightness(.63) saturate(.9)',
  'dark-brown': 'brightness(.78) saturate(1)',
  chestnut: 'brightness(.92) saturate(1.12) sepia(.12)',
  auburn: 'brightness(.92) saturate(1.45) sepia(.25) hue-rotate(332deg)',
  copper: 'brightness(1.08) saturate(1.55) sepia(.35) hue-rotate(335deg)',
  honey: 'brightness(1.35) saturate(1.05) sepia(.42)',
  'dark-blonde': 'brightness(1.22) saturate(.76) sepia(.34)',
  silver: 'brightness(1.55) saturate(.22)',
  white: 'brightness(1.82) saturate(.08)',
  plum: 'brightness(.8) saturate(1.15) hue-rotate(286deg)',
})

function sheetPosition(index, count) {
  if (count <= 1) return '0%'
  return `${(index / (count - 1)) * 100}%`
}

function safeToken(value, fallback) {
  const token = String(value || fallback).toLowerCase().replace(/[^a-z0-9-]/g, '')
  return token || fallback
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function clothingFrame(appearance = {}) {
  const cut = String(appearance.topCut || 'tee')
  if (appearance.hasApron) return 3
  if (/waistcoat|vest|formal|blazer/.test(cut)) return 4
  if (/jacket|coat|bomber|trucker/.test(cut)) return 2
  if (/cardigan|blouse|camisole|shell|corset/.test(cut)) return 1
  return 0
}

export function paintedCreatorRecipe(profile = {}, appearance = {}) {
  const faceIndex = Math.max(0, FACE_SHAPES.indexOf(profile.faceShape))
  const hairIndex = Math.max(0, HAIR_STYLES.indexOf(profile.hairStyle))
  const clothingIndex = clothingFrame(appearance)
  return Object.freeze({
    faceIndex,
    hairIndex,
    clothingIndex,
    faceX: sheetPosition(faceIndex, FACE_SHAPES.length),
    hairX: sheetPosition(hairIndex % 5, 5),
    hairY: sheetPosition(Math.floor(hairIndex / 5), 4),
    clothingX: sheetPosition(clothingIndex, 5),
    skinFilter: SKIN_FILTERS[profile.skinTone] || SKIN_FILTERS['warm-medium'],
    hairFilter: HAIR_FILTERS[profile.hairColor] || HAIR_FILTERS.espresso,
  })
}

export function renderPaintedCreatorPortrait(profile = {}, appearance = {}, {
  label = 'Painted character portrait',
  lookDirection = 'down-right',
} = {}) {
  const recipe = paintedCreatorRecipe(profile, appearance)
  const classes = [
    'painted-creator-avatar',
    `look-${safeToken(lookDirection, 'down-right')}`,
    `complexion-${safeToken(profile.complexionDetail, 'none')}`,
    `facial-hair-${safeToken(profile.facialHair, 'none')}`,
  ].join(' ')
  const topColor = appearance.hasApron ? appearance.apron : appearance.top
  const accentColor = appearance.hasApron ? appearance.apronAccent : appearance.topAccent
  const style = [
    `--painted-face-x:${recipe.faceX}`,
    `--painted-hair-x:${recipe.hairX}`,
    `--painted-hair-y:${recipe.hairY}`,
    `--painted-clothes-x:${recipe.clothingX}`,
    `--painted-skin-filter:${recipe.skinFilter}`,
    `--painted-hair-filter:${recipe.hairFilter}`,
    `--painted-clothes-color:${topColor || '#efe1bd'}`,
    `--painted-clothes-accent:${accentColor || '#b94836'}`,
  ].join(';')
  return `<div class="${classes}" style="${style}" role="img" aria-label="${escapeHtml(label)}" data-renderer="painted-layered-creator-v1" data-face-frame="${recipe.faceIndex}" data-hair-frame="${recipe.hairIndex}" data-clothes-frame="${recipe.clothingIndex}">
    <span class="painted-creator-layer painted-creator-face" aria-hidden="true"></span>
    <span class="painted-creator-layer painted-creator-clothes" aria-hidden="true"></span>
    <span class="painted-creator-layer painted-creator-clothes-tint" aria-hidden="true"></span>
    <span class="painted-creator-layer painted-creator-hair painted-creator-hair-back" aria-hidden="true"></span>
    <span class="painted-creator-layer painted-creator-hair painted-creator-hair-front" aria-hidden="true"></span>
    <span class="painted-creator-complexion" aria-hidden="true"></span>
    <span class="painted-creator-facial-hair" aria-hidden="true"></span>
    <span class="painted-creator-accent" aria-hidden="true"></span>
  </div>`
}
