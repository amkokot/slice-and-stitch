// A portable visual recipe: the same silhouette, dyes, contour and textile
// travel through catalogue cards, crafting, saved outfits and actor rendering.
export const GARMENT_PATTERN_KEYS = Object.freeze([
  'solid', 'stripe', 'pinstripe', 'check', 'floral', 'herringbone', 'twill',
  'denim', 'slub', 'weave', 'cord', 'cable', 'jersey', 'tweed', 'velvet',
  'leather', 'sheer', 'suede', 'satin', 'brocade', 'lace', 'handmade',
])

const hex = (value, fallback) => /^#[0-9a-f]{6}$/i.test(String(value)) ? value : fallback
const bounded = (value, fallback, min, max) => Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback
const shade = (color) => '#' + [1, 3, 5].map((index) => Math.round(parseInt(color.slice(index, index + 2), 16) * .62).toString(16).padStart(2, '0')).join('')

function surfaceFor(garment) {
  if (garment.material?.family) {
    const key = { 'wool-satin': 'satin' }[garment.material.family] || garment.material.family
    if (GARMENT_PATTERN_KEYS.includes(key)) return { key, mode: 'painted' }
  }
  // Do not print windowpane checks over gold jewellery or polished footwear
  // merely because its catalogue colourway came from the check palette.
  const text = `${garment.id || ''} ${garment.cut || ''} ${(garment.tags || []).join(' ')}`
  if (garment.slot === 'accessory' && /brooch|beaded|fascinator|minaudiere|box-bag|collar/.test(text)) return { key: 'solid', mode: 'painted' }
  if (garment.slot === 'shoes') return { key: /canvas|sneaker|trainer|espadrille/.test(text) ? 'weave' : 'leather', mode: 'painted' }
  const key = GARMENT_PATTERN_KEYS.includes(garment.pattern) ? garment.pattern : 'solid'
  return { key, mode: key === 'solid' ? 'solid' : 'overlay' }
}

export function garmentVisualDesign(garment = {}) {
  const primary = hex(garment.palette?.primary, '#c7af88')
  const secondary = hex(garment.palette?.secondary, '#eee0c3')
  const surface = surfaceFor(garment)
  const recipe = garment.colorPattern || {}
  // Existing callers can change the legacy pattern field when dyeing/crafting
  // a piece. Do not let a copied recipe silently override that newer choice.
  const supplied = recipe.sourcePattern && recipe.sourcePattern !== (garment.pattern || 'solid') ? {} : recipe
  const key = GARMENT_PATTERN_KEYS.includes(supplied.key) ? supplied.key : surface.key
  const mode = ['painted', 'overlay', 'solid'].includes(supplied.mode) ? supplied.mode : surface.mode
  const opacity = ['stripe', 'pinstripe', 'check', 'floral', 'brocade', 'lace'].includes(key) ? .28 : .13
  const contourColor = garment.outline?.sourceColor && garment.outline.sourceColor !== primary ? undefined : garment.outline?.color
  return {
    outline: Object.freeze({
      silhouette: String(garment.cut || garment.outline?.silhouette || garment.slot || 'garment'),
      style: 'soft-painted', color: hex(contourColor, shade(primary)), sourceColor: primary,
      width: bounded(garment.outline?.width, 1.6, 0, 3),
      opacity: bounded(garment.outline?.opacity, .18, 0, .3),
    }),
    colorPattern: Object.freeze({ key, mode, primary, secondary, sourcePattern: garment.pattern || 'solid',
      scale: bounded(supplied.scale, 1, .5, 2),
      opacity: bounded(supplied.opacity, opacity, 0, .45),
    }),
  }
}
