import { identityOption } from '../character-v2/identity-catalog.js'
import { paintedOutfitSkinGroup, paintedOutfitSkinPalette } from './painted-outfit.js'

const DETAIL_LINE = '#633b3b'
import { assetUrl } from '../game-assets.js'
const PAINTED_HAIR_ATLAS = assetUrl('/assets/characters-v3/creator-layers/painted-hair-v1.png')
const PAINTED_AFRO_ASSET = assetUrl('/assets/characters-v3/creator-layers/painted-afro-complete-v1.png')
const PAINTED_HAIR_ATLAS_WIDTH = 1402
const PAINTED_HAIR_ATLAS_HEIGHT = 1122
const PAINTED_HAIR_COLUMNS = 5
const PAINTED_HAIR_ROWS = 4
const PAINTED_HAIR_STYLES = Object.freeze([
  'buzz', 'crop', 'side-part', 'curly-top', 'bob',
  'shag', 'shoulder-waves', 'curls', 'afro', 'twists',
  'loc-bob', 'braided-bob', 'ponytail', 'high-pony', 'braided-pony',
  'loc-pony', 'bun', 'top-knot', 'braided-bun', 'loc-bun',
])
// Each atlas painting was authored with a different silhouette and transparent
// margin. Keep its registration beside the style instead of forcing unlike cuts
// through one shared rectangle. Values stay centered on the canonical 240px head.
// Buzz uses a dedicated skull-clipped crown sample; its atlas fit is retained
// for catalogue compatibility but is not used by the worn close-crop renderer.
export const PAINTED_HAIR_FITS = Object.freeze({
  buzz: Object.freeze({ x: 23, y: -42, size: 194, topTrim: 0, rightTrim: 14 }),
  crop: Object.freeze({ x: 30, y: -32, size: 180, topTrim: 0, rightTrim: 14 }),
  'side-part': Object.freeze({ x: 23, y: -34, size: 194, topTrim: 0, rightTrim: 14 }),
  twists: Object.freeze({ x: 15, y: -35, size: 210, topTrim: 21, rightTrim: 0 }),
  bob: Object.freeze({ x: 8, y: -50, size: 224, topTrim: 0, rightTrim: 0 }),
  'shoulder-waves': Object.freeze({ x: 18, y: -14, size: 204, topTrim: 0, rightTrim: 14 }),
  'curly-top': Object.freeze({ x: 12, y: -22, size: 216, topTrim: 0, rightTrim: 18 }),
  afro: Object.freeze({ x: 0, y: -32, size: 240, topTrim: 0, rightTrim: 0 }),
  'braided-bob': Object.freeze({ x: 8, y: -30, size: 224, topTrim: 22, rightTrim: 14 }),
  ponytail: Object.freeze({ x: 18, y: -16, size: 204, topTrim: 28, rightTrim: 14 }),
  'braided-bun': Object.freeze({ x: 22, y: -8, size: 196, topTrim: 0, rightTrim: 14 }),
})
let headSequence = 0

function safeToken(value, fallback = 'default') {
  const token = String(value || fallback).toLowerCase().replace(/[^a-z0-9-]/g, '')
  return token || fallback
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function validColor(value, fallback) {
  return /^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value) : fallback
}

function channels(color) {
  const hex = validColor(color, '#777777').slice(1)
  return [0, 2, 4].map((index) => Number.parseInt(hex.slice(index, index + 2), 16))
}

function mix(color, target, amount) {
  const from = channels(color)
  const to = channels(target)
  return `#${from.map((channel, index) => Math.round(channel + (to[index] - channel) * amount).toString(16).padStart(2, '0')).join('')}`
}

function paletteHighlight(color, target, amount) {
  const [red, green, blue] = channels(color)
  const luma = red * .2126 + green * .7152 + blue * .0722
  const strength = luma < 90 ? .45 : luma < 150 ? .72 : 1
  return mix(color, target, amount * strength)
}

function luminanceTintMatrix(color) {
  const [red, green, blue] = channels(validColor(color, '#422c29')).map((channel) => channel / 255)
  const luminance = Math.max(.04, red * .2126 + green * .7152 + blue * .0722)
  const rows = [red, green, blue].map((channel) => {
    const scale = channel / luminance
    return `${(.2126 * scale).toFixed(4)} ${(.7152 * scale).toFixed(4)} ${(.0722 * scale).toFixed(4)} 0 0`
  })
  return `${rows.join(' ')} 0 0 0 1 0`
}

function colorFor(group, id, fallback) {
  return validColor(identityOption(group, id)?.color, fallback)
}

function headState(profile = {}, appearance = {}) {
  const requestedSkin = validColor(appearance.skin, colorFor('skinTones', profile.skinTone, '#b96f50'))
  const skinGroup = paintedOutfitSkinGroup({ skin: requestedSkin })
  const skinPalette = paintedOutfitSkinPalette({ skin: requestedSkin })
  const hair = validColor(appearance.hair, colorFor('hairColors', profile.hairColor, '#422c29'))
  return Object.freeze({
    skin: skinPalette.base,
    requestedSkin,
    skinGroup,
    skinHighlight: skinPalette.highlight,
    skinWarm: skinPalette.warm,
    skinShadow: skinPalette.shadow,
    skinEdge: mix(skinPalette.shadow, skinPalette.base, .22),
    skinSheen: skinGroup === 'deep' ? .28 : skinGroup === 'medium' ? .58 : .86,
    hair,
    hairEdge: mix(hair, '#171318', .34),
    featureLine: mix(hair, '#2b1d22', .42),
    eye: validColor(appearance.eye, colorFor('eyeColors', profile.eyeColor, '#76663f')),
    faceShape: safeToken(profile.faceShape, 'soft-round'),
    eyeShape: safeToken(profile.eyeShape, 'almond'),
    browStyle: safeToken(profile.browStyle, 'soft'),
    noseShape: safeToken(profile.noseShape, 'button'),
    mouthStyle: safeToken(profile.mouthStyle, 'soft'),
    complexionDetail: safeToken(profile.complexionDetail, profile.freckles ? 'freckles-soft' : 'none'),
    facialHair: safeToken(profile.facialHair, 'none'),
    hairStyle: safeToken(profile.hairStyleId || profile.hairStyle, 'ponytail'),
    hairTexture: safeToken(profile.hairTexture, 'wavy'),
    expression: safeToken(profile.faceId || profile.face, 'bright'),
  })
}

function definitions(id, a) {
  const skinLight = a.skinGroup === 'deep'
    ? mix(a.skinHighlight, a.skin, .56)
    : a.skinGroup === 'medium'
      ? mix(a.skinHighlight, a.skin, .2)
      : a.skinHighlight
  const skinWarm = a.skinWarm
  const skinShade = a.skinShadow
  const hairLight = paletteHighlight(a.hair, '#f1bc79', .38)
  const hairMid = paletteHighlight(a.hair, '#9b5b43', .16)
  const hairShade = mix(a.hair, '#130f15', .48)
  const lip = mix(a.skin, '#ad3650', .68)
  const faceGlow = (.5 * a.skinSheen).toFixed(2)
  const faceGlowTail = (.14 * a.skinSheen).toFixed(2)
  const planeGlow = (.11 * a.skinSheen).toFixed(2)
  return `<defs>
    <linearGradient id="${id}-skin" x1=".12" y1=".02" x2=".9" y2="1"><stop stop-color="${skinLight}"/><stop offset=".34" stop-color="${a.skin}"/><stop offset=".7" stop-color="${skinWarm}"/><stop offset="1" stop-color="${skinShade}"/></linearGradient>
    <linearGradient id="${id}-ear" x1=".1" y1="0" x2=".9" y2="1"><stop stop-color="${skinLight}"/><stop offset=".5" stop-color="${a.skin}"/><stop offset="1" stop-color="${skinShade}"/></linearGradient>
    <linearGradient id="${id}-hair" x1=".08" y1=".02" x2=".92" y2="1"><stop stop-color="${hairLight}"/><stop offset=".2" stop-color="${hairMid}"/><stop offset=".48" stop-color="${a.hair}"/><stop offset=".78" stop-color="${mix(a.hair, '#2a1820', .2)}"/><stop offset="1" stop-color="${hairShade}"/></linearGradient>
    <radialGradient id="${id}-face-light" cx="38%" cy="24%" r="72%"><stop stop-color="#fff8e9" stop-opacity="${faceGlow}"/><stop offset=".42" stop-color="#fff0da" stop-opacity="${faceGlowTail}"/><stop offset="1" stop-color="${skinShade}" stop-opacity=".16"/></radialGradient>
    <linearGradient id="${id}-face-plane" x1="0" x2="1"><stop stop-color="${skinShade}" stop-opacity=".18"/><stop offset=".28" stop-color="${a.skin}" stop-opacity="0"/><stop offset=".7" stop-color="${skinLight}" stop-opacity="${planeGlow}"/><stop offset="1" stop-color="${skinShade}" stop-opacity=".24"/></linearGradient>
    <linearGradient id="${id}-sclera" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fffdf5"/><stop offset=".68" stop-color="#fff8ed"/><stop offset="1" stop-color="${mix(a.skin, '#d9a5a0', .48)}"/></linearGradient>
    <radialGradient id="${id}-iris" cx="38%" cy="30%"><stop stop-color="${mix(a.eye, '#ffffff', .48)}"/><stop offset=".5" stop-color="${a.eye}"/><stop offset="1" stop-color="${mix(a.eye, '#161116', .5)}"/></radialGradient>
    <linearGradient id="${id}-lip" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${mix(lip, '#ffd0c4', .28)}"/><stop offset=".46" stop-color="${lip}"/><stop offset="1" stop-color="${mix(lip, '#4b1e2b', .32)}"/></linearGradient>
    <radialGradient id="${id}-blush"><stop stop-color="#e36f6b" stop-opacity=".4"/><stop offset="1" stop-color="#e36f6b" stop-opacity="0"/></radialGradient>
    <filter id="${id}-shadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="2.4" stdDeviation="2.3" flood-color="#2b1c1d" flood-opacity=".19"/></filter>
    <filter id="${id}-soft" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="2.8"/></filter>
    <filter id="${id}-painted-hair-color" x="-8%" y="-8%" width="116%" height="116%" color-interpolation-filters="sRGB"><feColorMatrix in="SourceGraphic" type="matrix" values="${luminanceTintMatrix(a.hair)}" result="colored-hair"/><feDropShadow in="colored-hair" dx="0" dy="1.4" stdDeviation="1.15" flood-color="${a.hairEdge}" flood-opacity=".2"/></filter>
    <clipPath id="${id}-face-clip"><path d="${facePath(a.faceShape)}"/></clipPath>
    <clipPath id="${id}-painted-hair-front">
      <path d="M0 0H240V62C210 61 191 65 176 72C159 66 145 58 130 57C113 56 104 65 92 70C78 76 64 75 50 69C35 64 19 62 0 63Z"/>
      <path d="M46 59H82V240H46ZM158 59H194V240H158Z"/>
    </clipPath>
    <clipPath id="${id}-painted-hair-front-afro">
      <path d="M0 0H240V59C207 56 188 61 174 70C164 76 158 68 149 64C140 60 134 57 126 59C116 61 112 67 104 70C96 73 91 78 83 78C73 78 66 70 57 66C42 59 24 58 0 63Z"/>
      <path d="M0 54H60C72 63 76 70 72 82C66 98 65 117 71 134C77 153 87 165 83 195L0 240ZM240 54H180C168 63 164 70 168 82C174 98 175 117 169 134C163 153 153 165 157 195L240 240Z"/>
    </clipPath>
  </defs>`
}

function paintedHairCell(a) {
  if (a.hairStyle === 'curly-top') return [2, 1]
  const index = PAINTED_HAIR_STYLES.indexOf(a.hairStyle)
  return index < 0 ? null : [index % PAINTED_HAIR_COLUMNS, Math.floor(index / PAINTED_HAIR_COLUMNS)]
}

function paintedHairBounds(a) {
  if (PAINTED_HAIR_FITS[a.hairStyle]) return PAINTED_HAIR_FITS[a.hairStyle]
  if (a.hairStyle === 'curls') return Object.freeze({ x: 12, y: -16, size: 216 })
  if (['bun', 'top-knot', 'braided-bun', 'loc-bun'].includes(a.hairStyle)) return Object.freeze({ x: 22, y: -8, size: 196 })
  return Object.freeze({ x: 18, y: -4, size: 204 })
}

function paintedHairCrop(a, bounds, column) {
  if (a.hairStyle === 'afro') return Object.freeze({ x: bounds.x, y: bounds.y, width: bounds.size, height: bounds.size })
  const defaultRightTrim = column < PAINTED_HAIR_COLUMNS - 1
    ? ['curls', 'curly-top'].includes(a.hairStyle) ? 18 : 14
    : 0
  const topTrim = bounds.topTrim || 0
  const rightTrim = bounds.rightTrim ?? defaultRightTrim
  return Object.freeze({ x: bounds.x, y: bounds.y + topTrim, width: bounds.size - rightTrim, height: bounds.size - topTrim })
}

function paintedHairScalpBase(id, a) {
  if (['afro', 'buzz'].includes(a.hairStyle)) return ''
  return `<g data-avatar-part="hair-foundation"><path d="M58 60C60 23 84 7 119 6C154 5 179 23 182 59C166 51 150 47 134 48C119 49 108 56 96 59C83 63 70 62 58 57Z" fill="url(#${id}-hair)"/><path d="M72 39C95 18 139 15 168 39M69 50C96 33 135 29 173 46" fill="none" stroke="${paletteHighlight(a.hair, '#f1bc79', .34)}" stroke-width="1.25" stroke-linecap="round" opacity=".2"/></g>`
}

function paintedHairMarkup(id, a, layer) {
  const cell = paintedHairCell(a)
  if (!cell) return ''
  const [column, row] = cell
  const cellWidth = PAINTED_HAIR_ATLAS_WIDTH / PAINTED_HAIR_COLUMNS
  const cellHeight = PAINTED_HAIR_ATLAS_HEIGHT / PAINTED_HAIR_ROWS
  const dedicatedAfro = a.hairStyle === 'afro'
  const viewBox = dedicatedAfro ? '0 0 1254 1254' : `${column * cellWidth} ${row * cellHeight} ${cellWidth} ${cellHeight}`
  const source = dedicatedAfro ? PAINTED_AFRO_ASSET : PAINTED_HAIR_ATLAS
  const sourceWidth = dedicatedAfro ? 1254 : PAINTED_HAIR_ATLAS_WIDTH
  const sourceHeight = dedicatedAfro ? 1254 : PAINTED_HAIR_ATLAS_HEIGHT
  const bounds = paintedHairBounds(a)
  const crop = paintedHairCrop(a, bounds, column)
  const layerClip = layer === 'front'
    ? ` clip-path="url(#${id}-${a.hairStyle === 'afro' ? 'painted-hair-front-afro' : 'painted-hair-front'})"`
    : ''
  const silhouette = a.hairStyle === 'afro' ? 'rounded' : a.hairTexture === 'tight-curls' ? 'clustered-tight' : 'painted-organic'
  const cropId = `${id}-painted-hair-crop-${layer}`
  const edgeId = `${id}-painted-hair-edge-${layer}`
  const maskId = `${id}-painted-hair-mask-${layer}`
  const feather = a.hairStyle === 'curly-top' ? 10 : 5
  const leftStop = ((feather / crop.width) * 100).toFixed(2)
  const rightStop = (100 - (feather / crop.width) * 100).toFixed(2)
  const cropShape = `<rect x="${crop.x}" y="${crop.y}" width="${crop.width}" height="${crop.height}"/>`
  const maskDefinitions = dedicatedAfro
    ? `<mask id="${maskId}" maskUnits="userSpaceOnUse" x="${crop.x}" y="${crop.y}" width="${crop.width}" height="${crop.height}"><rect x="${crop.x}" y="${crop.y}" width="${crop.width}" height="${crop.height}" fill="#fff"/></mask>`
    : `<linearGradient id="${edgeId}" x1="0" x2="1"><stop stop-color="#000"/><stop offset="${leftStop}%" stop-color="#fff"/><stop offset="${rightStop}%" stop-color="#fff"/><stop offset="100%" stop-color="#000"/></linearGradient><mask id="${maskId}" maskUnits="userSpaceOnUse" x="${crop.x}" y="${crop.y}" width="${crop.width}" height="${crop.height}"><rect x="${crop.x}" y="${crop.y}" width="${crop.width}" height="${crop.height}" fill="url(#${edgeId})"/></mask>`
  return `<g class="modular-head__painted-hair modular-head__painted-hair--${layer}" data-painted-hair-cell="${column}-${row}" data-curl-palette="${a.hairTexture}" data-curl-silhouette="${silhouette}"><defs><clipPath id="${cropId}">${cropShape}</clipPath>${maskDefinitions}</defs><g clip-path="url(#${cropId})" mask="url(#${maskId})"><g${layerClip}><svg x="${bounds.x}" y="${bounds.y}" width="${bounds.size}" height="${bounds.size}" viewBox="${viewBox}" preserveAspectRatio="none" overflow="hidden" aria-hidden="true"><image href="${source}" x="0" y="0" width="${sourceWidth}" height="${sourceHeight}" preserveAspectRatio="none" filter="url(#${id}-painted-hair-color)"/></svg></g></g></g>`
}

// Every head uses this exact 240 x 240 coordinate system. Face variations only
// reshape the jaw/cheeks inside the same hair, ear, eye, neck, and collar anchors.
function facePath(shape) {
  const paths = {
    'soft-round': 'M60 66C63 25 86 10 118 8C151 6 176 24 180 65C182 83 180 102 175 118C170 137 158 151 143 160C135 165 128 168 120 168C111 168 103 165 96 160C80 151 69 137 64 118C60 101 59 83 60 66Z',
    oval: 'M68 61C70 23 91 8 119 7C148 6 170 22 173 61C175 80 175 99 171 116C167 137 157 154 143 165C135 171 127 174 120 175C111 173 102 169 95 163C81 152 72 135 68 115C66 97 66 78 68 61Z',
    heart: 'M59 65C62 24 86 9 118 8C152 6 178 24 181 65C182 84 179 103 173 119C167 137 156 150 141 160C132 166 125 171 120 173C114 170 106 166 98 160C82 150 71 136 66 118C61 102 58 84 59 65Z',
    square: 'M61 64C64 24 87 9 119 8C151 7 176 24 179 64C181 84 180 105 176 124C173 142 162 156 145 164C137 168 103 168 95 164C78 156 68 142 64 124C60 105 59 84 61 64Z',
    long: 'M71 58C74 21 92 7 119 6C147 5 166 21 169 58C171 79 171 101 168 121C165 143 156 161 142 173C134 179 127 181 120 182C112 180 104 176 97 170C83 158 74 141 71 120C69 99 69 78 71 58Z',
    diamond: 'M70 58C74 22 92 8 119 7C147 6 165 21 170 58C174 74 180 91 181 103C178 124 167 143 148 158C138 166 128 171 120 173C111 170 101 165 92 157C73 142 62 123 59 102C60 90 66 73 70 58Z',
  }
  return paths[shape] || paths['soft-round']
}

function gazeOffset(direction = 'down') {
  return ({
    left: [-2.8, 0], right: [2.8, 0], up: [0, -2.3], down: [0, 1.8],
    'up-left': [-2.3, -2], 'up-right': [2.3, -2],
    'down-left': [-2.3, 1.7], 'down-right': [2.3, 1.7],
  })[direction] || [0, 1.1]
}

function curlMotifs(a, variant = 'cap') {
  const light = paletteHighlight(a.hair, '#f4c185', .46)
  const mid = paletteHighlight(a.hair, '#c47d57', .24)
  const dark = mix(a.hair, '#120e14', .4)
  const tight = ['coily', 'tight-curls'].includes(a.hairTexture)
  const ringlets = a.hairTexture === 'ringlets'
  const cap = [
    [70, 39, -18, .9], [94, 24, 13, 1.05], [120, 21, -9, .94], [146, 29, 18, 1.02],
    [166, 47, -14, .88], [87, 56, 21, .78], [121, 49, -19, .86], [151, 57, 11, .76],
  ]
  const long = [
    ...cap,
    [61, 88, -12, .86], [180, 94, 14, .82], [58, 125, 18, .78], [182, 135, -16, .8],
    [64, 162, -20, .85], [176, 173, 22, .84], [78, 199, 14, .82], [160, 205, -18, .86],
  ]
  const points = variant === 'long' ? long : cap
  const motif = ringlets
    ? 'M-9-5C-15 2-9 14 2 13 12 12 14 2 8-5 4-9-3-7-5 0'
    : tight
      ? 'M-8 4C-10-4-4-9 2-8 9-7 12-1 8 4 6 7 2 9-2 8'
      : 'M-10 5C-12-5-2-13 7-9 15-5 15 4 8 9 5 12 1 13-3 11'
  const paths = points.map(([x, y, rotation, scale]) => `<path d="${motif}" transform="translate(${x} ${y}) rotate(${rotation}) scale(${scale})"/>`).join('')
  return `<g class="modular-head__texture modular-head__texture--curls" data-curl-palette="${a.hairTexture}" fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="${dark}" stroke-width="${tight ? 4.2 : 4.8}" opacity=".12">${paths}</g><g stroke="${mid}" stroke-width="${tight ? 2.1 : 2.45}" opacity=".38">${paths}</g><g stroke="${light}" stroke-width=".85" opacity=".42" transform="translate(-.8 -.9)">${paths}</g></g>`
}

function curlCrownMarkup(id, a, kind = 'top') {
  const fill = `url(#${id}-hair)`
  const tight = ['coily', 'tight-curls'].includes(a.hairTexture)
  const wide = kind === 'afro'
  const clusters = wide
    ? [[47,65,27,22,-16],[57,39,25,21,12],[78,19,29,23,-8],[103,7,28,22,10],[131,6,31,23,-6],[160,20,29,22,14],[181,41,26,22,-12],[191,67,25,21,9],[72,59,29,23,6],[103,38,28,22,-11],[134,35,30,23,8],[163,58,29,22,-7]]
    : tight
      ? [[58,59,18,14,-15],[66,40,20,16,12],[81,25,21,16,-8],[101,15,21,17,13],[122,12,23,17,-7],[145,18,22,17,11],[164,30,21,16,-13],[176,47,19,15,8],[180,61,17,14,-8],[87,47,21,16,7],[110,35,22,17,-12],[135,37,23,17,10],[157,50,20,15,-6]]
      : [[59,58,22,17,-12],[71,34,25,19,10],[94,18,26,20,-7],[120,12,28,21,8],[147,20,27,20,-11],[168,38,24,18,12],[179,59,21,17,-8],[92,47,25,19,6],[121,37,26,19,-9],[150,49,24,18,9]]
  const edge = mix(a.hairEdge, a.hair, .25)
  const crown = clusters.map(([cx, cy, rx, ry, rotation]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rotation} ${cx} ${cy})" fill="${fill}"/>`).join('')
  const hairline = wide
    ? 'M51 70C57 45 75 29 96 27c15-2 25 6 38 4 21-4 42 10 55 36-10-7-21-10-33-8-11 1-17 8-27 8-11 0-18-7-28-6-9 1-14 8-23 9-10 1-19-3-27 0Z'
    : 'M54 69C61 47 77 33 96 31c14-2 24 6 36 4 20-3 40 9 53 31-10-6-20-9-31-7-10 1-16 7-25 7-10 0-17-7-26-6-9 1-14 7-23 8-9 1-17-2-26 1Z'
  return `<g class="modular-head__curl-crown" data-curl-silhouette="${wide ? 'rounded' : tight ? 'clustered-tight' : 'clustered-soft'}"><g>${crown}</g><path d="${hairline}" fill="${fill}" stroke="${edge}" stroke-width=".72" stroke-linejoin="round"/><path d="M62 44c24-27 68-37 105-6M70 57c16-15 38-21 58-20m15 2c12 3 22 9 30 18" fill="none" stroke="${paletteHighlight(a.hair, '#f4c185', .44)}" stroke-width="4.4" stroke-linecap="round" opacity=".08"/>${curlMotifs(a)}</g>`
}

function textureLines(id, a, variant = 'cap') {
  const light = paletteHighlight(a.hair, '#f4c185', .48)
  const mid = paletteHighlight(a.hair, '#c47d57', .27)
  const dark = mix(a.hair, '#120e14', .4)
  if (['coily', 'curly', 'ringlets', 'tight-curls'].includes(a.hairTexture)) {
    return curlMotifs(a, variant)
  }
  if (['locs', 'braided'].includes(a.hairTexture)) {
    const paths = variant === 'long'
      ? ['M78 25q-14 54 1 102t-2 88','M98 14q-11 55 2 104t-1 107','M120 12q-7 55 2 101t1 116','M142 17q4 48-2 99t9 104','M161 31q10 44-2 88t10 89']
      : ['M80 25q-10 37 0 72','M100 14q-8 39 1 78','M121 12q-4 39 2 82','M143 18q4 37-1 75','M162 31q8 34-2 65']
    const strands = paths.map((d) => `<path d="${d}"/>`).join('')
    return `<g class="modular-head__texture" fill="none" stroke-linecap="round"><g stroke="${dark}" stroke-width="5" opacity=".24">${strands}</g><g stroke="${mid}" stroke-width="2.8" opacity=".62">${strands}</g><g stroke="${light}" stroke-width="1" opacity=".58" transform="translate(-1 -1)">${strands}</g></g><g fill="none" stroke="${dark}" stroke-width="1.5" opacity=".4"><path d="M83 43l-8 7 9 7-9 7 10 7M105 32l-8 7 9 7-8 7 9 7M145 39l8 7-8 7 9 7-8 7"/></g>`
  }
  const waves = variant === 'long'
    ? 'M72 28q45-27 91 9M65 54q51-25 108 9M66 84q55-21 108 8M74 116q42-15 89 6M78 153q38-13 80 7M84 188q31-10 66 6'
    : 'M72 28q45-27 91 9M65 54q51-25 108 9M72 82q47-19 96 5'
  return `<g class="modular-head__texture" fill="none" stroke-linecap="round"><path d="${waves}" stroke="${dark}" stroke-width="6" opacity=".2"/><path d="${waves}" stroke="${mid}" stroke-width="3.2" opacity=".54"/><path d="${waves}" stroke="${light}" stroke-width="1.2" opacity=".6" transform="translate(-1 -1)"/></g>`
}

function hairBackMarkup(id, a) {
  const style = a.hairStyle
  const fill = `url(#${id}-hair)`
  const stroke = `stroke="${a.hairEdge}" stroke-width="1.7" stroke-linejoin="round"`
  if (style === 'buzz') return ''
  if (paintedHairCell(a)) return paintedHairMarkup(id, a, 'back')
  if (['buzz', 'crop', 'side-part', 'curly-top', 'twists'].includes(style)) return ''
  if (style === 'afro') {
    return `<path d="M45 100C31 82 36 57 55 45 48 24 66 3 89 7 101-9 126-10 141 3 164-6 184 10 184 34c22 9 29 33 17 51 8 22-8 45-31 47H68c-25 0-38-17-23-32Z" fill="${fill}" ${stroke}/><g fill="${paletteHighlight(a.hair, '#f3bb79', .35)}" opacity=".12"><ellipse cx="84" cy="30" rx="25" ry="18"/><ellipse cx="130" cy="16" rx="29" ry="15"/><ellipse cx="166" cy="49" rx="23" ry="29"/></g>${curlMotifs(a)}`
  }
  if (style === 'curls') {
    const curlTexture = ['curly', 'coily', 'ringlets', 'tight-curls'].includes(a.hairTexture) ? a.hairTexture : 'curly'
    return `<path d="M50 75C42 56 47 35 64 23 70 4 91-5 110 1 126-8 150 0 157 15 178 16 192 34 189 54 202 68 194 86 187 96 199 111 193 126 184 135 196 151 190 168 178 176 187 195 173 213 151 226l-17-8-14-42-17 43-15 8c-20-12-34-29-31-48-17-10-20-28-9-43-14-13-13-31-1-42-10-15-8-31 3-42Z" fill="${fill}" ${stroke}/>${curlMotifs({ ...a, hairTexture: curlTexture }, 'long')}`
  }
  if (['bun', 'top-knot', 'braided-bun', 'loc-bun'].includes(style)) {
    const top = style === 'top-knot'
    const cx = top ? 122 : 165
    const cy = top ? 4 : 23
    const radius = top ? 32 : 34
    return `<g class="modular-head__motion modular-head__motion--bun"><circle cx="${cx}" cy="${cy}" r="${radius}" fill="${fill}" ${stroke}/><path d="M${cx - 21} ${cy - 7}q23-21 42 2M${cx - 19} ${cy + 7}q21-15 39 5M${cx - 8} ${cy - 27}q14 13 20 34" fill="none" stroke="${paletteHighlight(a.hair, '#c77d55', .34)}" stroke-width="5" stroke-linecap="round" opacity=".4"/><path d="M${cx - 20} ${cy - 9}q22-19 40 2M${cx - 17} ${cy + 5}q20-12 36 6M${cx - 6} ${cy - 25}q12 12 18 31" fill="none" stroke="${paletteHighlight(a.hair, '#f4c185', .5)}" stroke-width="1.5" stroke-linecap="round" opacity=".72"/></g>`
  }
  if (['ponytail', 'high-pony', 'braided-pony', 'loc-pony'].includes(style)) {
    const high = style === 'high-pony'
    const braided = style.includes('braided') || style.includes('loc')
    return `<g class="modular-head__motion modular-head__motion--tail"><path d="M164 ${high ? 28 : 48}c49 5 63 42 50 82-9 29-29 51-48 67 8-36-10-55-16-74-9-27-3-54 14-75Z" fill="${fill}" ${stroke}/>${braided ? `<path d="M180 45q-25 20 4 38t-3 39 2 38" fill="none" stroke="${paletteHighlight(a.hair, '#ffffff', .28)}" stroke-width="7" stroke-linecap="round" opacity=".25"/>` : `<path d="M175 ${high ? 43 : 60}q28 24 20 61M182 ${high ? 48 : 69}q17 31 7 70" fill="none" stroke="${paletteHighlight(a.hair, '#efb06c', .4)}" stroke-width="3.2" stroke-linecap="round" opacity=".5"/>`}</g>`
  }
  if (['bob', 'shag', 'shoulder-waves', 'loc-bob', 'braided-bob'].includes(style)) {
    const shoulder = style === 'shoulder-waves'
    const textured = style.includes('loc') ? 'locs' : style.includes('braided') ? 'braided' : a.hairTexture
    const lower = shoulder ? 210 : 176
    return `<path d="M52 67C54 22 82 3 119 3c42-1 69 21 71 66 2 33 0 72-5 ${lower}c-14 17-38 23-64 18-27 24-50 15-66-2-4-44-6-${Math.round((lower - 67) * .72)}-3 ${67 - lower}Z" fill="${fill}" ${stroke}/>${textureLines(id, { ...a, hairTexture: textured }, 'long')}`
  }
  return `<path d="M54 66C56 21 83 3 119 3c41-1 68 21 70 65 2 42 0 91-5 141-17 19-40 25-64 18-24 7-47 2-65-19-5-51-6-99-1-142Z" fill="${fill}" ${stroke}/>${textureLines(id, a, 'long')}`
}

function neckMarkup(id, a) {
  return `<g data-avatar-part="neck"><path d="M94 143C95 157 95 173 94 185c7 8 16 13 26 13s19-5 26-13c-1-12-1-28 0-42Z" fill="url(#${id}-skin)" stroke="${a.skinEdge}" stroke-width="1.25" stroke-linejoin="round"/><path d="M96 148c13 10 35 11 48 0v17c-14 8-34 8-48 0Z" fill="${a.skinShadow}" opacity=".16"/><path d="M99 166c12 7 30 8 42 0" fill="none" stroke="${a.skinShadow}" stroke-width="1.8" opacity=".22"/><path d="M103 176c5 4 8 8 10 13" fill="none" stroke="${a.skinHighlight}" stroke-width="1.4" stroke-linecap="round" opacity=".3"/><g fill="none" stroke-linecap="round" opacity=".2"><path d="M102 157l7 2m17 25 7-2m-26 5 5 1" stroke="${a.skinHighlight}" stroke-width="1"/><path d="M131 155l6 2m-24 25 6 2" stroke="${a.skinShadow}" stroke-width=".9"/></g></g>`
}

function earMarkup(id, a) {
  const inner = mix(a.skin, '#8b3f3b', .34)
  return `<g data-avatar-part="ears"><g fill="url(#${id}-ear)" stroke="${a.skinEdge}" stroke-width="1.15"><path d="M64 80C55 74 47 80 47 91c0 11 7 18 14 18 4 0 6-3 6-8Z"/><path d="M176 80c9-6 17 0 17 11 0 11-7 18-14 18-4 0-6-3-6-8Z"/></g><g fill="none" stroke="${inner}" stroke-width="1.3" stroke-linecap="round" opacity=".52"><path d="M59 86c-5-2-8 2-7 8 1 7 5 10 9 9m-7-7c3-5 7-5 9-1M181 86c5-2 8 2 7 8-1 7-5 10-9 9m6-7c-3-5-7-5-9-1"/></g><path d="M53 84c3-3 7-4 11-1m123 1c-3-3-7-4-11-1" fill="none" stroke="${mix(a.skin, '#ffffff', .38)}" stroke-width="1.2" opacity="${(.3 * a.skinSheen).toFixed(2)}"/></g>`
}

function faceMarkup(id, a) {
  const path = facePath(a.faceShape)
  const glow = a.skinHighlight
  const shade = a.skinShadow
  const foreheadGlow = (.1 * a.skinSheen).toFixed(2)
  const highlightStroke = (.21 * a.skinSheen).toFixed(2)
  const edgeLight = (.2 * a.skinSheen).toFixed(2)
  return `<g data-avatar-part="face" filter="url(#${id}-shadow)"><path d="${path}" fill="url(#${id}-skin)" stroke="${a.skinEdge}" stroke-width="1.35" stroke-linejoin="round"/><g clip-path="url(#${id}-face-clip)"><path d="${path}" fill="url(#${id}-face-light)"/><path d="${path}" fill="url(#${id}-face-plane)"/><ellipse cx="96" cy="48" rx="35" ry="32" fill="${glow}" opacity="${foreheadGlow}"/><path d="M69 109c3 20 14 38 32 49M172 108c-3 20-15 39-33 49" fill="none" stroke="${shade}" stroke-width="8" stroke-linecap="round" opacity=".09"/><path d="M75 113c4 10 11 18 21 23m69-24c-4 10-11 18-21 23" fill="none" stroke="${shade}" stroke-width="2.2" stroke-linecap="round" opacity=".13"/><path d="M105 160c5 2 10 3 15 3s10-1 15-3" fill="none" stroke="${shade}" stroke-width="1.2" stroke-linecap="round" opacity=".1"/></g><path d="M78 38c10-11 23-18 40-20" fill="none" stroke="${glow}" stroke-width="3.6" stroke-linecap="round" opacity="${highlightStroke}"/><path d="M67 111c3 19 13 37 28 47m78-48c-3 20-13 37-28 48" fill="none" stroke="${a.skinHighlight}" stroke-width=".9" stroke-linecap="round" opacity="${edgeLight}"/></g>`
}

function skinTextureMarkup(id, a) {
  const highlightMarks = ['M80 49l8-3', 'M99 31l7-2', 'M78 108l7 2', 'M94 135l6 2', 'M136 39l8 3', 'M149 116l7-2', 'M132 149l7-1']
  const shadowMarks = ['M70 86l7 2', 'M84 142l6 3', 'M155 70l7 2', 'M154 135l7-3', 'M108 158l8 1']
  return `<g data-avatar-part="skin-texture" clip-path="url(#${id}-face-clip)" fill="none" stroke-linecap="round"><g stroke="${a.skinHighlight}" stroke-width="1.2" opacity="${(.2 * a.skinSheen).toFixed(2)}">${highlightMarks.map((d) => `<path d="${d}"/>`).join('')}</g><g stroke="${a.skinShadow}" stroke-width="1" opacity=".18">${shadowMarks.map((d) => `<path d="${d}"/>`).join('')}</g><g fill="${a.skinShadow}" opacity=".1"><circle cx="75" cy="65" r=".9"/><circle cx="90" cy="44" r=".75"/><circle cx="149" cy="55" r=".8"/><circle cx="160" cy="98" r=".7"/><circle cx="105" cy="130" r=".65"/><circle cx="137" cy="132" r=".75"/></g></g>`
}

function complexionMarkup(id, a) {
  const detail = a.complexionDetail
  if (detail === 'beauty-mark') return `<circle cx="150" cy="131" r="1.7" fill="${mix(a.skin, '#32191b', .7)}"/>`
  if (detail === 'rosy') return `<ellipse cx="84" cy="121" rx="16" ry="8" fill="url(#${id}-blush)"/><ellipse cx="156" cy="121" rx="16" ry="8" fill="url(#${id}-blush)"/>`
  if (detail === 'sun-kissed') return `<path d="M78 116q42 11 84-1" fill="none" stroke="${mix(a.skin, '#a54838', .42)}" stroke-width="7" stroke-linecap="round" opacity=".14"/>`
  if (!detail.startsWith('freckles')) return ''
  const points = detail === 'freckles-full'
    ? [[80,116],[87,119],[94,116],[101,120],[108,117],[115,120],[125,117],[132,120],[139,116],[146,119],[153,115],[160,118],[93,126],[103,128],[137,126],[147,127]]
    : [[87,120],[95,122],[103,119],[137,119],[145,122],[153,118]]
  return `<g fill="${mix(a.skin, '#5a2d29', .6)}" opacity=".68">${points.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.1"/>`).join('')}</g>`
}

function eyeMarkup(id, a, lookDirection) {
  const config = ({
    almond: { rx: 13.5, ry: 6.4, tilt: 0, inner: .88, crown: 1.08, lower: .72 },
    round: { rx: 12.5, ry: 9, tilt: 0, inner: 1.12, crown: 1.28, lower: 1 },
    hooded: { rx: 14.3, ry: 5.1, tilt: 0, inner: .58, crown: .7, lower: .48, crease: true },
    upturned: { rx: 14, ry: 6.2, tilt: -5, inner: .78, crown: 1.04, lower: .58 },
    downturned: { rx: 14, ry: 6.2, tilt: 5, inner: .94, crown: 1.04, lower: .74 },
    'deep-set': { rx: 13.5, ry: 5.2, tilt: 0, inner: .62, crown: .76, lower: .44, crease: true },
    monolid: { rx: 14.5, ry: 3.8, tilt: 0, inner: .46, crown: .58, lower: .3, crease: true },
    tapered: { rx: 15, ry: 5.7, tilt: -2, inner: .64, crown: 1.08, lower: .44 },
    narrow: { rx: 15, ry: 3.45, tilt: 0, inner: .44, crown: .58, lower: .25 },
    crescent: { rx: 13.8, ry: 5, tilt: -1.5, inner: .58, crown: .7, lower: .08 },
  })[a.eyeShape] || { rx: 13.5, ry: 6.4, tilt: 0, inner: .88, crown: 1.08, lower: .72 }
  const { rx, ry, tilt } = config
  const [gx, gy] = gazeOffset(lookDirection)
  const eye = (cx, cy, side) => {
    const outerBias = side === 'left' ? -.35 : .35
    const shape = `M${cx - rx} ${cy + .5}C${cx - rx * .58} ${cy - ry * config.inner} ${cx + rx * .34} ${cy - ry * config.crown} ${cx + rx} ${cy + outerBias}C${cx + rx * .3} ${cy + ry * config.lower} ${cx - rx * .5} ${cy + ry * (config.lower + .06)} ${cx - rx} ${cy + .5}Z`
    const upper = `M${cx - rx} ${cy + .5}C${cx - rx * .58} ${cy - ry * config.inner} ${cx + rx * .34} ${cy - ry * config.crown} ${cx + rx} ${cy + outerBias}`
    const clipId = `${id}-eye-${side}`
    return `<g transform="rotate(${tilt} ${cx} ${cy})"><defs><clipPath id="${clipId}"><path d="${shape}"/></clipPath></defs><path d="${shape}" fill="url(#${id}-sclera)" stroke="${mix(a.skin, '#76505a', .35)}" stroke-width=".8"/><g clip-path="url(#${clipId})"><g class="modular-head__gaze" transform="translate(${gx} ${gy})"><circle cx="${cx}" cy="${cy}" r="5.25" fill="url(#${id}-iris)" stroke="${a.featureLine}" stroke-width=".72"/><circle cx="${cx}" cy="${cy}" r="3.75" fill="none" stroke="${mix(a.eye, '#0f1111', .35)}" stroke-width=".6" opacity=".68"/><circle cx="${cx}" cy="${cy + .35}" r="2.25" fill="#201719"/><circle cx="${cx - 1.65}" cy="${cy - 1.9}" r="1.25" fill="#fff"/><circle cx="${cx + 1.7}" cy="${cy + 1.7}" r=".5" fill="#fff1c9"/></g></g><path d="${upper}" fill="none" stroke="${a.featureLine}" stroke-width="1.65" stroke-linecap="round"/><path d="M${cx - rx + 2} ${cy + 1.7}C${cx - rx * .35} ${cy + ry * config.lower} ${cx + rx * .38} ${cy + ry * (config.lower - .1)} ${cx + rx - 2} ${cy + .7}" fill="none" stroke="${mix(a.skin, '#7e4544', .4)}" stroke-width=".8" stroke-linecap="round" opacity=".44"/><path d="M${cx - rx + 3} ${cy - ry - 2}c${rx * .5}-3 ${rx * 1.25}-3 ${rx * 2 - 6} .4" fill="none" stroke="${mix(a.skin, '#723b38', .34)}" stroke-width="1" stroke-linecap="round" opacity="${config.crease ? '.46' : '.28'}"/><path d="M${side === 'left' ? cx - rx : cx + rx} ${cy}c${side === 'left' ? -1.4 : 1.4} -1.1 ${side === 'left' ? -2.3 : 2.3} -1.4 ${side === 'left' ? -3 : 3} -1.7" fill="none" stroke="${a.featureLine}" stroke-width=".75" stroke-linecap="round"/></g>`
  }
  const hood = config.crease
    ? `<path d="M79 79q13-6 26 1M135 80q13-6 26 0" fill="none" stroke="${mix(a.skin, '#5d302c', .35)}" stroke-width="2" stroke-linecap="round" opacity=".5"/>`
    : ''
  return `<g data-avatar-part="eyes">${hood}${eye(94, 87, 'left')}${eye(146, 87, 'right')}</g>`
}

function browMarkup(a) {
  const width = ({ fine: 2.5, soft: 3.5, straight: 4, arched: 3.5, full: 5, bold: 5.8 })[a.browStyle] || 3.5
  const left = a.browStyle === 'straight' ? 'M80 72q12-2 24 1' : a.browStyle === 'arched' ? 'M80 74q11-11 25-2' : 'M80 73q12-7 25 1'
  const right = a.browStyle === 'straight' ? 'M136 73q12-2 24 1' : a.browStyle === 'arched' ? 'M135 72q14-11 25 2' : 'M135 73q13-7 25 1'
  const brow = mix(a.hair, '#171117', .32)
  const highlight = paletteHighlight(a.hair, '#f1b374', .27)
  return `<g data-avatar-part="brows"><path d="${left}${right}" fill="none" stroke="${brow}" stroke-width="${width}" stroke-linecap="round"/><path d="${left}${right}" fill="none" stroke="${highlight}" stroke-width="${Math.max(1, width * .24)}" stroke-linecap="round" opacity=".42" transform="translate(0 -1)"/></g>`
}

function noseMarkup(a) {
  const color = mix(a.skin, '#572926', .47)
  const shadow = mix(a.skin, '#512b29', .38)
  const shine = mix(a.skin, '#fff4de', .48)
  const paths = {
    button: 'M117 94q-3 18-2 27 5 7 12 1M112 124q4 4 8 1m0 0q4 3 8-1',
    straight: 'M118 92q-2 18-2 29 4 7 11 2M112 124q4 4 8 1m0 0q4 3 8-1',
    rounded: 'M117 93q-4 19-2 29 6 8 14 1M111 125q5 5 9 1m0 0q5 4 10-1',
    wide: 'M116 94q-4 18-3 27M107 125q5 5 11 0m4 0q6 5 12-1',
    aquiline: 'M118 92q4 10 0 20l-3 9q5 8 13 3M112 125q4 4 8 1m1 0q4 3 8-1',
    upturned: 'M117 95q-3 16-1 25 5 6 12 0M111 123q5 6 9 1m1 0q4 5 9-1',
  }
  const nostrils = ({ wide: [110, 131], rounded: [112, 129], button: [113, 127] })[a.noseShape] || [113, 128]
  return `<g data-avatar-part="nose"><path d="M114 94c-2 9-4 20-2 27 3 7 10 9 17 3-7 5-13 5-16 1-4-6-2-21 1-31Z" fill="${shadow}" opacity=".085"/><path d="M124 102c3 7 4 14 2 20" fill="none" stroke="${a.skinShadow}" stroke-width="5.5" stroke-linecap="round" opacity=".055"/><path d="${paths[a.noseShape] || paths.button}" fill="none" stroke="${color}" stroke-width="1.45" stroke-linecap="round"/><ellipse cx="${nostrils[0]}" cy="125" rx="1.35" ry=".8" fill="${shadow}" opacity=".62"/><ellipse cx="${nostrils[1]}" cy="125" rx="1.35" ry=".8" fill="${shadow}" opacity=".62"/><path d="M119 96c-1 6-2 13-1 19" fill="none" stroke="${shine}" stroke-width="1.55" stroke-linecap="round" opacity="${(.3 * a.skinSheen).toFixed(2)}"/><ellipse cx="121" cy="122" rx="4.5" ry="2.2" fill="${shine}" opacity="${(.08 * a.skinSheen).toFixed(2)}"/></g>`
}

function mouthMarkup(id, a) {
  const widths = { full: 16, wide: 18, bowed: 15, fine: 12.5, 'crooked-smile': 16, soft: 15 }
  const width = widths[a.mouthStyle] || 15
  const lip = mix(a.skin, '#973e50', .5)
  const crease = mix(a.skin, '#55272d', .48)
  const crooked = a.mouthStyle === 'crooked-smile' ? 1.7 : 0
  if (a.expression === 'focused') return `<g data-avatar-part="mouth"><path d="M${120 - width} 142q${width} 3 ${width * 2} -1" fill="none" stroke="${mix(lip, '#452126', .26)}" stroke-width="2.3" stroke-linecap="round"/><path d="M${120 - width - 2} 141l-3 1m${width * 2 + 5} -2l3 1" stroke="${crease}" stroke-width="1.1" stroke-linecap="round" opacity=".42"/></g>`
  if (a.expression === 'bright') {
    return `<g data-avatar-part="mouth"><path d="M${120 - width} ${143 + crooked}C${120 - width * .52} ${144 + crooked} ${120 - width * .3} ${147 + crooked} 120 ${147 + crooked}c${width * .32} 0 ${width * .58} -3 ${width} -${5 + crooked}-3 7-${width * .55} 10-${width} 10s-${width * .76}-3-${width}-9Z" fill="url(#${id}-lip)" stroke="${DETAIL_LINE}" stroke-width="1.05"/><path d="M${120 - width + 3} ${144 + crooked}c${width * .52} 3 ${width * 1.02} 2 ${width * 2 - 6} -1" fill="none" stroke="${crease}" stroke-width=".9" stroke-linecap="round" opacity=".62"/><path d="M${120 - width - 2} ${143 + crooked}c-2 0-3 1-4 2m${width * 2 + 8} -4c2 0 3 .4 4 1" stroke="${crease}" stroke-width=".75" stroke-linecap="round" opacity=".28"/></g>`
  }
  if (a.expression === 'confident') {
    return `<g data-avatar-part="mouth"><path d="M${120 - width} ${141 + crooked}c${width * .48} 2 ${width * .7} 5 ${width} 5s${width * .58}-4 ${width}-6c-2 8-${width * .55} 12-${width} 12s-${width * .78}-4-${width}-11Z" fill="url(#${id}-lip)" stroke="${DETAIL_LINE}" stroke-width="1.05"/><path d="M${120 - width + 5} ${143 + crooked}c${width * .42} 1.5 ${width * .86} 1.5 ${width * 2 - 10} -.8" fill="none" stroke="#fff8ed" stroke-width="1.15" stroke-linecap="round" opacity=".82"/><path d="M113 150c4 1.5 9 1 14-1" fill="none" stroke="${mix(lip, '#ffb6aa', .45)}" stroke-width=".9" stroke-linecap="round"/></g>`
  }
  return `<g data-avatar-part="mouth"><path d="M${120 - width} ${143 + crooked}c${width * .48} 1 ${width * .68} 4 ${width} 4s${width * .6}-3.5 ${width}-5c-2 6-${width * .55} 9-${width} 9s-${width * .75}-3-${width}-8Z" fill="url(#${id}-lip)" stroke="${DETAIL_LINE}" stroke-width="1"/><path d="M${120 - width + 3} ${144 + crooked}c${width * .5} 2 ${width} 1.3 ${width * 2 - 6} -.7" fill="none" stroke="${crease}" stroke-width=".8" stroke-linecap="round" opacity=".55"/><path d="M${120 - width - 2} ${143 + crooked}c-2 0-3 .5-4 1m${width * 2 + 8} -3c2 0 3 .4 4 1" stroke="${crease}" stroke-width=".7" stroke-linecap="round" opacity=".25"/></g>`
}

function facialHairMarkup(a) {
  if (a.facialHair === 'none') return ''
  const hair = mix(a.hair, '#24191a', .2)
  if (a.facialHair === 'stubble') return `<g data-avatar-part="facial-hair" fill="none" stroke="${hair}" stroke-linecap="round" opacity=".42"><path d="M91 145l2 2m7 2 2 2m8 2 2 2m9-1 2 2m8-3 2 2m8-6 2 2m6-8 2 2" stroke-width="1"/><path d="M88 138c5 16 16 25 32 28 16-3 28-12 33-29" stroke-width="1.4" stroke-dasharray="1 5" opacity=".48"/></g>`
  const mustache = `<path d="M104 136q8-7 16 0 8-7 16 0-8 9-16 2-8 7-16-2Z" fill="${hair}" opacity=".92"/>`
  if (a.facialHair === 'mustache') return `<g data-avatar-part="facial-hair">${mustache}</g>`
  if (a.facialHair === 'goatee') return `<g data-avatar-part="facial-hair">${mustache}<path d="M110 151q10 7 20-1l-4 18h-12Z" fill="${hair}" opacity=".9"/></g>`
  const full = a.facialHair === 'full-beard'
  return `<g data-avatar-part="facial-hair">${mustache}<path d="M81 126q8 35 39 42 31-8 39-43l-7 29q-15 ${full ? 25 : 16}-32 ${full ? 29 : 20}-19-4-32-17-39-28Z" fill="${hair}" opacity="${full ? '.92' : '.76'}"/><path d="M91 138q6 18 16 26m42-27q-6 18-17 27m-23-20q11 6 22-1M94 146q26 15 52-1" fill="none" stroke="${mix(hair, '#ffffff', .32)}" stroke-width="1.4" stroke-linecap="round" opacity=".3"/></g>`
}

function hairFrontMarkup(id, a) {
  const style = a.hairStyle
  const fill = `url(#${id}-hair)`
  const light = paletteHighlight(a.hair, '#efb06c', .42)
  const dark = mix(a.hair, '#130e14', .34)
  const stroke = `stroke="${a.hairEdge}" stroke-width="1.7" stroke-linejoin="round"`
  if (style === 'buzz') {
    // Clip short hair to the actual skull, then paint a hairline above the brows.
    // Sampling only the dense crown texture avoids the atlas's long pointed sides.
    const clipId = `${id}-buzz-hairline`
    return `<g data-avatar-part="hair-front" data-hair-fit="scalp-following"><defs><clipPath id="${clipId}"><path d="M48-4H192V80L175 73C163 62 145 57 128 57C109 57 90 61 73 69L58 82Z"/></clipPath></defs><g clip-path="url(#${id}-face-clip)"><g clip-path="url(#${clipId})"><rect x="48" y="-4" width="144" height="90" fill="url(#${id}-hair)"/><svg x="48" y="-2" width="144" height="84" viewBox="58 54 207 72" preserveAspectRatio="none" overflow="hidden"><image href="${PAINTED_HAIR_ATLAS}" width="${PAINTED_HAIR_ATLAS_WIDTH}" height="${PAINTED_HAIR_ATLAS_HEIGHT}" filter="url(#${id}-painted-hair-color)"/></svg></g></g></g>`
  }
  if (paintedHairCell(a)) return `<g data-avatar-part="hair-front">${paintedHairScalpBase(id, a)}${paintedHairMarkup(id, a, 'front')}</g>`
  if (style === 'buzz') return `<g data-avatar-part="hair-front"><path d="M58 66C61 25 84 10 117 9c34-1 59 15 65 55-17-13-35-18-53-16-13 1-24 8-36 12-12 4-23 4-33 1Z" fill="${fill}" ${stroke}/><path d="M69 48c24-17 63-19 99 2" fill="none" stroke="${dark}" stroke-width="4.4" stroke-linecap="round" opacity=".23"/><path d="M73 38c28-14 63-13 92 7" fill="none" stroke="${light}" stroke-width="1.45" stroke-linecap="round" opacity=".64"/><path d="M64 58c9 3 18 2 27-2m58-4c10 0 19 3 27 7" fill="none" stroke="${light}" stroke-width="1.1" stroke-linecap="round" opacity=".4"/></g>`
  if (style === 'curly-top') {
    const curlTexture = ['curly', 'coily', 'ringlets', 'tight-curls'].includes(a.hairTexture) ? a.hairTexture : 'curly'
    return `<g data-avatar-part="hair-front">${curlCrownMarkup(id, { ...a, hairTexture: curlTexture }, 'top')}</g>`
  }
  if (['crop', 'side-part', 'twists'].includes(style)) {
    const textured = style === 'twists'
    return `<g data-avatar-part="hair-front"><path d="M56 68C59 24 83 8 117 7c35-1 61 17 67 59-16-12-34-18-52-16-11 1-20 8-30 12-14 6-28 6-43 0Z" fill="${fill}" ${stroke}/>${textured ? textureLines(id, { ...a, hairTexture: 'locs' }) : `<path d="M69 39c21-15 47-21 73-18m-49 15c12 0 24-7 35-18m-1 10c15 1 28 7 39 18" fill="none" stroke="${dark}" stroke-width="4.7" stroke-linecap="round" opacity=".22"/><path d="M69 38c21-14 47-20 73-17m-49 15c12 0 24-7 35-18m-1 10c15 1 28 7 39 18" fill="none" stroke="${light}" stroke-width="1.4" stroke-linecap="round" opacity=".66"/><path d="M61 57c18 1 39-7 59-24" fill="none" stroke="${dark}" stroke-width="1.8" stroke-linecap="round" opacity=".44"/>`}<path d="M61 60c1 5 4 9 8 12m104-12c-1 5-4 9-8 12" fill="none" stroke="${light}" stroke-width="1.25" stroke-linecap="round" opacity=".54"/></g>`
  }
  if (style === 'afro' || style === 'curls') {
    const curlTexture = ['curly', 'coily', 'ringlets', 'tight-curls'].includes(a.hairTexture) ? a.hairTexture : 'curly'
    return `<g data-avatar-part="hair-front">${curlCrownMarkup(id, { ...a, hairTexture: curlTexture }, style === 'afro' ? 'afro' : 'top')}</g>`
  }
  const longFront = ['bob', 'shag', 'shoulder-waves', 'loc-bob', 'braided-bob'].includes(style)
  const faceWisps = longFront
    ? `<g fill="none" stroke-linecap="round"><path d="M65 58c-6 28-3 58 8 86m102-86c6 28 3 58-8 86" stroke="${a.hairEdge}" stroke-width="18" opacity=".72"/><path d="M65 58c-6 28-3 58 8 86m102-86c6 28 3 58-8 86" stroke="${fill}" stroke-width="15"/><path d="M64 61c-3 25 0 51 9 76m103-76c3 25 0 51-9 76" stroke="${dark}" stroke-width="5" opacity=".2"/><path d="M63 60c-2 24 1 48 9 72m105-72c2 24-1 48-9 72" stroke="${light}" stroke-width="1.1" opacity=".58"/></g>`
    : `<g fill="none" stroke-linecap="round"><path d="M64 59c-3 14-1 29 5 42m107-42c3 14 1 29-5 42" stroke="${a.hairEdge}" stroke-width="10" opacity=".64"/><path d="M64 59c-3 14-1 29 5 42m107-42c3 14 1 29-5 42" stroke="${fill}" stroke-width="8"/><path d="M64 60c-2 12 0 25 5 36m106-36c2 12 0 25-5 36" stroke="${light}" stroke-width=".9" opacity=".48"/></g>`
  return `<g data-avatar-part="hair-front">${faceWisps}<path d="M56 68C59 24 83 8 117 7c35-1 61 17 67 59-16-13-34-18-52-16-12 1-21 8-31 13-13 6-27 5-42-1Z" fill="${fill}" ${stroke}/><path d="M69 39c22-16 51-22 79-11 12 5 22 13 29 25M78 44c14-11 30-18 47-21m7 2c15 3 27 10 37 22" fill="none" stroke="${dark}" stroke-width="4.2" stroke-linecap="round" opacity=".17"/><path d="M69 37c23-15 51-20 79-9 12 5 22 13 29 25M78 43c14-10 30-17 47-20m7 1c15 3 27 10 37 22" fill="none" stroke="${light}" stroke-width="1.35" stroke-linecap="round" opacity=".64"/><path d="M60 60c2 6 6 11 12 14m106-15c-2 6-6 11-11 15" fill="none" stroke="${light}" stroke-width="1.15" stroke-linecap="round" opacity=".46"/></g>`
}

function frontMarkup(id, a, lookDirection, showNeck, hairClip, scalpClip) {
  return `${showNeck ? neckMarkup(id, a) : ''}<g${scalpClip}>${earMarkup(id, a)}${faceMarkup(id, a)}${skinTextureMarkup(id, a)}<g data-avatar-part="complexion">${complexionMarkup(id, a)}</g></g>${eyeMarkup(id, a, lookDirection)}${browMarkup(a)}${noseMarkup(a)}${mouthMarkup(id, a)}${facialHairMarkup(a)}<g${hairClip}>${hairFrontMarkup(id, a)}</g>`
}

export const MODULAR_HEAD_PARTS = Object.freeze([
  'hair-back', 'neck', 'ears', 'face', 'skin-texture', 'complexion', 'eyes', 'brows', 'nose', 'mouth', 'facial-hair', 'hair-front',
])

export function renderModularHead(profile = {}, appearance = {}, {
  id = `modular-head-${++headSequence}`,
  label = 'Modular cartoon character head',
  layer = 'full',
  lookDirection = 'down',
  showNeck = true,
  hairVisibility = '',
  scalpTrim = 0,
  className = '',
} = {}) {
  const safeId = safeToken(id, `modular-head-${headSequence}`)
  const a = headState(profile, appearance)
  const normalizedLayer = ['back', 'front'].includes(layer) ? layer : 'full'
  // Headwear hides only hair. Clipping the entire head also erased the scalp
  // inside curved hat openings, leaving a rectangular hole above the brows.
  const visibility = /^[MLCQHVZ\d\s.,-]+$/i.test(hairVisibility) ? hairVisibility : ''
  const hairClip = visibility ? ` clip-path="url(#${safeId}-headwear-hair)" data-headwear-occlusion="hair-only"` : ''
  const hairDefinition = visibility ? `<defs><clipPath id="${safeId}-headwear-hair"><path d="${visibility}"/></clipPath></defs>` : ''
  // Only the very top of the skull tucks into a cap. The forehead remains
  // available inside a turban/notched brim; eyes and brows are never clipped.
  const trim = Math.max(0, Math.min(30, Number(scalpTrim) || 0))
  const scalpClip = trim ? ` clip-path="url(#${safeId}-headwear-scalp)" data-headwear-occlusion="upper-scalp"` : ''
  const scalpDefinition = trim ? `<defs><clipPath id="${safeId}-headwear-scalp"><rect x="-120" y="${trim}" width="480" height="360"/></clipPath></defs>` : ''
  const back = `<g class="modular-head__part modular-head__part--hair-back" data-avatar-part="hair-back"${hairClip}>${hairBackMarkup(safeId, a)}</g>`
  const front = `<g class="modular-head__front">${frontMarkup(safeId, a, lookDirection, showNeck, hairClip, scalpClip)}</g>`
  const content = normalizedLayer === 'back' ? back : normalizedLayer === 'front' ? front : `${back}${front}`
  return `<svg class="modular-head-svg ${safeToken(className, '')}" viewBox="0 0 240 240" role="img" aria-label="${escapeHtml(label)}" data-renderer="modular-head-v1" data-art-finish="illustrated-v2" data-anatomy="humanized-v1" data-organic-finish="painted-curves-v1" data-avatar-rig="mii-plus-v1" data-avatar-layer="${normalizedLayer}" data-painted-skin-group="${a.skinGroup}" data-skin-sheen="${a.skinSheen}" data-face-shape="${a.faceShape}" data-eye-shape="${a.eyeShape}" data-hair-style="${a.hairStyle}" data-hair-texture="${a.hairTexture}">${definitions(safeId, a)}${hairDefinition}${scalpDefinition}${content}</svg>`
}

export function modularHeadRecipe(profile = {}, appearance = {}) {
  const a = headState(profile, appearance)
  return Object.freeze({
    rig: 'mii-plus-v1',
    coordinateSpace: '0 0 240 240',
    anchors: Object.freeze({ headCenter: [120, 84], eyeLine: 87, nose: [120, 120], mouth: [120, 143], jaw: [120, 167], neck: [120, 190] }),
    parts: Object.freeze({
      face: a.faceShape,
      eyes: a.eyeShape,
      brows: a.browStyle,
      nose: a.noseShape,
      mouth: a.mouthStyle,
      complexion: a.complexionDetail,
      facialHair: a.facialHair,
      hairBack: a.hairStyle,
      hairFront: a.hairStyle,
    }),
    palette: Object.freeze({ skin: a.skin, skinGroup: a.skinGroup, requestedSkin: a.requestedSkin, highlight: a.skinHighlight, shadow: a.skinShadow, hair: a.hair, eye: a.eye }),
  })
}
