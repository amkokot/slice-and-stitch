import { paintedOutfitSkinGroup } from './painted-outfit.js'
import { assetUrl } from '../game-assets.js'
import { renderModularHead } from './modular-head.js'
import { registeredGarmentAsset, renderRegisteredGarment } from './registered-garments.js'
import { garmentEquipmentSlot } from '../garment-slots.js'

const ASSET_ROOT = '/assets/characters-v3/modular-v4/render'

const BODY_ASSETS = Object.freeze({
  light: Object.freeze({ body: `${ASSET_ROOT}/body-shared-light-golden-v2.png`, feet: `${ASSET_ROOT}/feet-shared-light-golden-v2.png` }),
  medium: Object.freeze({ body: `${ASSET_ROOT}/body-shared-warm-medium-v2.png`, feet: `${ASSET_ROOT}/feet-shared-warm-medium-v2.png` }),
  deep: Object.freeze({ body: `${ASSET_ROOT}/body-shared-deep-v2.png`, feet: `${ASSET_ROOT}/feet-shared-deep-v2.png` }),
})

const GARMENT_ASSETS = Object.freeze({
  shirt: `${ASSET_ROOT}/top-ivory-onbody-v3.png`,
  blouse: `${ASSET_ROOT}/top-white-rollsleeve-v1.png`,
  jacket: `${ASSET_ROOT}/outer-teal-chore-onbody-v3.png`,
  outer: `${ASSET_ROOT}/outer-teal-chore-onbody-v3.png`,
  trousers: `${ASSET_ROOT}/bottom-olive-onbody-v3.png`,
  skirt: `${ASSET_ROOT}/bottom-plum-pleated-v1.png`,
  apron: `${ASSET_ROOT}/apron-pizzeria-red-v1.png`,
  shoes: `${ASSET_ROOT}/shoes-canvas-onbody-v3.png`,
})

const CLOSED_JACKET = /chore-jacket|field-jacket|bomber|hoodie|trucker|pullover|sweatshirt/i
const BLOUSE = /blouse|wrap|peasant|puff|corset|camisole|shell|sundress/i
const SKIRT = /skirt|culotte|kilt|sarong|bustle|mermaid|petal|godet|origami/i
const DRESS = /dress|gown|jumpsuit|romper/i

let paperDollSequence = 0

function escapeAttribute(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function safeToken(value, fallback = 'solid') {
  const token = String(value || fallback).toLowerCase().replace(/[^a-z0-9-]/g, '')
  return token || fallback
}

function validColor(value, fallback) {
  return /^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value) : fallback
}

function garmentText(garment = {}) {
  garment ||= {}
  return [garment.id, garment.cut, garment.pattern, ...(garment.tags || [])].filter(Boolean).join(' ').toLowerCase()
}

function clothingLayers(details) {
  const legacyOuter = details.top && garmentEquipmentSlot(details.top) === 'outerwear' ? details.top : null
  // Compatibility for older NPC/debug appearances that bypass the character
  // store. Saved players migrate to a real selected shirt in character-model.
  const top = legacyOuter ? { id: 'painted-crew-tee-ivory', slot: 'top', cut: 'crew-tee', pattern: 'solid', palette: { primary: '#e9dfc9', secondary: '#a88d69' } } : details.top
  return { top, outerwear: details.outerwear || details.outer || legacyOuter || null }
}

function garmentPalette(garment, fallbackPrimary, fallbackSecondary) {
  return Object.freeze({
    primary: validColor(garment?.palette?.primary, fallbackPrimary),
    secondary: validColor(garment?.palette?.secondary, fallbackSecondary),
  })
}

function mix(color, target, amount) {
  const channel = (value, index) => Number.parseInt(value.slice(1 + index * 2, 3 + index * 2), 16)
  const source = validColor(color, '#775070')
  const destination = validColor(target, '#ffffff')
  return `#${[0, 1, 2].map((index) => Math.round(channel(source, index) + (channel(destination, index) - channel(source, index)) * amount).toString(16).padStart(2, '0')).join('')}`
}

function accessoryFamily(accessory = {}) {
  const text = garmentText(accessory)
  if (/glove/.test(text)) return 'gloves'
  if (/brooch|flower/.test(text)) return 'brooch'
  if (/belt/.test(text)) return 'belt'
  if (/satchel|tote|handbag|bag|clutch|minaudiere/.test(text)) return 'bag'
  if (/tie|bow-tie|collar/.test(text)) return 'neckwear'
  if (/scarf/.test(text)) return 'scarf'
  if (/turban|headband/.test(text)) return 'head-wrap'
  if (/fascinator|veiled/.test(text)) return 'fascinator'
  if (/beret|hat|cloche|pillbox|newsboy/.test(text)) return 'hat'
  return 'brooch'
}

function accessoryShape(accessory, index, instanceId) {
  const family = accessoryFamily(accessory)
  const palette = garmentPalette(accessory, '#775070', '#efc776')
  const primary = palette.primary
  const light = mix(primary, palette.secondary, .42)
  const dark = mix(primary, '#2c2024', .46)
  const fill = `url(#${instanceId}-accessory-${index})`
  const stroke = `stroke="${dark}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"`
  if (family === 'gloves') return `<g data-accessory-family="gloves" fill="${fill}" ${stroke}><path d="M226 729c-18 18-17 70-3 103 12 29 43 27 54 5 7-15 0-28-7-42l-4-54c-1-18-26-25-40-12Z"/><path d="M798 729c18 18 17 70 3 103-12 29-43 27-54 5-7-15 0-28 7-42l4-54c1-18 26-25 40-12Z"/></g>`
  if (family === 'brooch') return `<g data-accessory-family="brooch" transform="translate(647 468)"><g fill="${light}" stroke="${dark}" stroke-width="5">${Array.from({ length: 12 }, (_, ray) => `<path d="M0-43L8-15 0-8-8-15Z" transform="rotate(${ray * 30})"/>`).join('')}</g><circle r="24" fill="${fill}" stroke="${dark}" stroke-width="6"/><circle cy="-7" r="9" fill="${light}" opacity=".75"/></g>`
  if (family === 'belt') return `<g data-accessory-family="belt"><path d="M337 695q175 22 350 0l-4 52q-172 23-342 0Z" fill="${fill}" ${stroke}/><rect x="472" y="701" width="80" height="45" rx="9" fill="none" stroke="${light}" stroke-width="11"/><path d="M512 705v38" stroke="${light}" stroke-width="8"/></g>`
  if (family === 'bag') return `<g data-accessory-family="bag"><path d="M377 344Q617 544 699 896" fill="none" stroke="${dark}" stroke-width="28"/><path d="M377 344Q617 544 699 896" fill="none" stroke="${light}" stroke-width="8" opacity=".55"/><path d="M608 828q93-34 164 13l-9 188q-80 38-169-1Z" fill="${fill}" ${stroke}/><path d="M608 869q81 33 158-2M632 836q24-71 71-8" fill="none" stroke="${light}" stroke-width="8" opacity=".7"/></g>`
  if (family === 'neckwear') return `<g data-accessory-family="neckwear"><path d="M472 319l40 36-28 42-53-62Zm80 0-40 36 28 42 53-62Z" fill="${light}" ${stroke}/><path d="M486 376l26-21 26 21-12 34 24 164-38 48-38-48 24-164Z" fill="${fill}" ${stroke}/></g>`
  if (family === 'scarf') return `<g data-accessory-family="scarf"><path d="M421 316q91 74 182 0l26 63q-117 72-234 0Z" fill="${fill}" ${stroke}/><path d="M545 370q56 70 22 183l-52-41-38 51q-17-126 25-193Z" fill="${fill}" ${stroke}/><path d="M441 354q71 39 142 0" fill="none" stroke="${light}" stroke-width="8" opacity=".62"/></g>`
  if (family === 'head-wrap') return `<g data-accessory-family="head-wrap"><path d="M354 76q158-103 316 4l-22 132q-137 54-274-2Z" fill="${fill}" ${stroke}/><path d="M368 115q144 73 288-2M389 73q108 94 238 19M510 37q-45 78 6 176" fill="none" stroke="${light}" stroke-width="12" opacity=".62"/><path d="M492 75l20-42 25 41-24 42Z" fill="${light}" stroke="${dark}" stroke-width="5"/></g>`
  if (family === 'fascinator') return `<g data-accessory-family="fascinator"><ellipse cx="609" cy="92" rx="83" ry="40" transform="rotate(-18 609 92)" fill="${fill}" ${stroke}/><path d="M607 91q63-103 105-83-6 76-105 83Zm16 7q105-46 125-3-48 60-125 3Z" fill="${light}" ${stroke}/><path d="M556 95q107 21 160 115M568 80q101 36 134 141" fill="none" stroke="${dark}" stroke-width="5" opacity=".42"/></g>`
  return `<g data-accessory-family="hat"><path d="M347 111q38-105 165-105t165 105q-49 75-165 70-118 5-165-70Z" fill="${fill}" ${stroke}/><path d="M336 157q176-52 352 0-14 63-176 48-162 15-176-48Z" fill="${fill}" ${stroke}/><path d="M385 122q128 39 254-2" fill="none" stroke="${light}" stroke-width="16" opacity=".74"/></g>`
}

function accessoriesMarkup(accessories = [], instanceId, hairStyle = '') {
  if (!accessories.length) return ''
  // Legacy NPC/appearance adapters omitted `slot`. This collection already
  // declares accessory semantics, so restore them before resolving artwork.
  accessories = accessories.map((accessory) => ({ ...accessory, slot: 'accessory' }))
  const painted = accessories.map((accessory, index) => {
    const asset = registeredGarmentAsset(accessory)
    if (!asset) return ''
    const palette = garmentPalette(accessory, '#775070', '#efc776')
    return paintedLayer({ slot: 'accessory', family: 'accessory', garment: accessory, ...palette, pattern: accessory.pattern, instanceId: `${instanceId}-accessory-${index}`, hairStyle })
  }).join('')
  const geometric = accessories.map((accessory, index) => ({ accessory, index })).filter(({ accessory }) => !registeredGarmentAsset(accessory))
  if (!geometric.length) return painted
  const isNeck = ({ accessory }) => ['neckwear', 'scarf'].includes(accessoryFamily(accessory))
  const neck = geometric.filter(isNeck)
  return painted + geometricAccessoriesMarkup(neck, instanceId, 'neck') + geometricAccessoriesMarkup(geometric.filter((entry) => !isNeck(entry)), instanceId, 'foreground')
}

function geometricAccessoriesMarkup(entries, instanceId, depth) {
  if (!entries.length) return ''
  const definitions = entries.map(({ accessory, index }) => {
    const palette = garmentPalette(accessory, '#775070', '#efc776')
    return `<linearGradient id="${instanceId}-accessory-${index}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${mix(palette.primary, palette.secondary, .38)}"/><stop offset=".5" stop-color="${palette.primary}"/><stop offset="1" stop-color="${mix(palette.primary, '#2c2024', .42)}"/></linearGradient>`
  }).join('')
  const textureId = `${instanceId}-accessory-texture${depth === 'neck' ? '-neck' : ''}`
  const neckline = depth === 'neck' ? `<clipPath id="${textureId}-visible"><path d="M0 325H431Q472 355 512 355T593 325H1024V1536H0Z"/></clipPath>` : ''
  const visibleClip = neckline ? ` clip-path="url(#${textureId}-visible)"` : ''
  // Texture must retain the garment's alpha, not turn the filter rectangle
  // into a translucent block. Neckwear also stays below the jaw/front hair.
  return `<svg class="painted-paper-doll__accessories painted-paper-doll__accessories--${depth}" viewBox="0 0 1024 1536" aria-hidden="true"><defs>${definitions}${neckline}<filter id="${textureId}"><feTurbulence baseFrequency=".025" numOctaves="3" seed="9" result="grain"/><feBlend in="SourceGraphic" in2="grain" mode="soft-light"/><feComposite in2="SourceGraphic" operator="in"/></filter></defs><g${visibleClip}><g filter="url(#${textureId})">${entries.map(({ accessory, index }) => accessoryShape(accessory, index, instanceId)).join('')}</g></g></svg>`
}

function paintedLayer({ slot, family, src, garment, primary, secondary, pattern, instanceId, underOuterwear = false, tuckedWaist = false, hairStyle = '', underLongHem = false }) {
  src=assetUrl(src)
  const id = garment?.id || `${family}-fallback`
  const registered = registeredGarmentAsset(garment)
  const coverage = (underOuterwear ? ` data-under-outerwear="${underOuterwear === 'cape' ? 'cape-shoulders' : underOuterwear === 'rolled' ? 'rolled-sleeves' : underOuterwear === 'cropped' ? 'cropped-sleeves' : 'long-sleeves'}"` : '') + (tuckedWaist ? ' data-tucked-waist="true"' : '') + (underLongHem ? ' data-under-long-hem="true"' : '')
  if (registered) {
    return `<span class="painted-paper-doll__garment painted-paper-doll__garment--${safeToken(slot)}" data-paper-slot="${safeToken(slot)}" data-paper-family="${registered.family}" data-paper-garment="${escapeAttribute(id)}" data-registered-painting="true"${registered.layer ? ` data-paper-depth="${registered.layer}"` : ''}${registered.onePiece ? ' data-paper-one-piece="true"' : ''}${registered.longTop ? ' data-paper-long-top="true"' : ''}${coverage}>${renderRegisteredGarment(registered, { id: `${instanceId}-${slot}-fabric`, primary, secondary, pattern, outline: garment?.outline, colorPattern: garment?.colorPattern, customization:garment?.customization, hairStyle })}</span>`
  }
  const style = `--paper-layer-image:url('${escapeAttribute(src)}');--paper-primary:${validColor(primary, '#775070')};--paper-secondary:${validColor(secondary, '#efc6d2')}`
  return `<span class="painted-paper-doll__garment painted-paper-doll__garment--${safeToken(slot)} pattern-${safeToken(pattern)}" style="${style}" data-paper-slot="${safeToken(slot)}" data-paper-family="${safeToken(family)}" data-paper-garment="${escapeAttribute(id)}"${coverage}><img src="${escapeAttribute(src)}" alt="" draggable="false"><i class="painted-paper-doll__tint" aria-hidden="true"></i><i class="painted-paper-doll__pattern" aria-hidden="true"></i></span>`
}

function foregroundHands(body, instanceId) {
  const clipId = `${instanceId}-foreground-hands`
  // Reuse the exact painted hands/skin bucket. The hips end inside these
  // isolated boxes; starting below the cuffs keeps sleeves in front of arms.
  return `<svg class="painted-paper-doll__hands" data-body-part="foreground-hands" viewBox="0 0 1024 1536" aria-hidden="true"><defs><clipPath id="${clipId}"><path d="M225 810H315V908H225ZM678 810H795V908H678Z"/></clipPath></defs><image href="${body.body}" width="1024" height="1536" clip-path="url(#${clipId})"/></svg>`
}

function bodyMarkup(body, instanceId, hasShoes, coversArms, shoeAsset, coversHands = false, coversLegs = false, coversWaist = false) {
  if (!hasShoes && !coversArms && !coversHands && !coversLegs && !coversWaist) return `<img class="painted-paper-doll__body" data-paper-slot="base" src="${body.body}" alt="" draggable="false"><img class="painted-paper-doll__feet" data-paper-slot="feet" src="${body.feet}" alt="" draggable="false">`
  // Continue the painted lower-leg texture into a clean ankle silhouette.
  // The old body/feet cut contains foot-shaped flaps; neither those pixels
  // nor bare toes should be present inside a closed shoe's opening.
  const ankleId = `${instanceId}-ankle-fit`
  const bodyId = `${instanceId}-shod-body`
  const blendId = `${instanceId}-ankle-blend`
  // Match the painted leg's outer edges at both the overlap and cut line;
  // a wider bridge leaves square skin tabs when a skirt exposes the ankles.
  const ankles = 'M360 1240H418C416 1250 415 1260 415 1268C415 1297 419 1326 419 1355H369C369 1326 367 1297 364 1268C363 1258 362 1248 360 1240ZM588 1240H648C646 1250 644 1260 644 1268C644 1297 655 1326 655 1355H603C603 1326 599 1297 592 1268C591 1258 589 1248 588 1240Z'
  const shodBody = 'M0 0H1024V1268H0Z'
  const sleeveId = `${instanceId}-covered-arms`
  const shoeCoverage = hasShoes && shoeAsset?.bodyOcclusion
  const maskedBody = coversArms || coversHands || coversLegs || coversWaist || shoeCoverage
  const sleeveMask = maskedBody ? `<mask id="${sleeveId}" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1536"><rect width="1024" height="1536" fill="white"/>${coversArms ? '<path d="M205 415H358V765H205ZM642 415H815V765H642Z" fill="black"/>' : ''}${coversHands ? '<path d="M190 740H350V900H190ZM674 740H820V900H674Z" fill="black"/>' : ''}${coversLegs ? '<path d="M270 900H754V1268H270Z" fill="black"/>' : ''}${coversWaist ? '<path d="M310 625H714V900H310Z" fill="black"/>' : ''}${shoeCoverage ? `<path data-footwear-occlusion="shaft" d="${shoeCoverage}" fill="black"/>` : ''}</mask>` : ''
  const armMask = maskedBody ? ` mask="url(#${sleeveId})"` : ''
  const bodyClip = hasShoes ? ` clip-path="url(#${bodyId})"` : ''
  const ankleBlend = hasShoes ? `<linearGradient id="${blendId}-gradient" gradientUnits="userSpaceOnUse" x1="0" y1="1240" x2="0" y2="1268"><stop stop-color="white"/><stop offset="1" stop-color="black"/></linearGradient><mask id="${blendId}" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1536"><rect width="1024" height="1536" fill="url(#${blendId}-gradient)"/></mask>` : ''
  const blendMask = hasShoes ? ` mask="url(#${blendId})"` : ''
  const footLayer = hasShoes
    ? `<g data-body-part="painted-ankle-bridge" clip-path="url(#${ankleId})"${shoeCoverage ? armMask : ''}><svg x="352" y="1240" width="90" height="115" viewBox="352 1180 90 90" preserveAspectRatio="none" overflow="hidden"><image href="${body.body}" width="1024" height="1536"/></svg><svg x="586" y="1240" width="90" height="115" viewBox="586 1180 90 90" preserveAspectRatio="none" overflow="hidden"><image href="${body.body}" width="1024" height="1536"/></svg></g>`
    : `<image href="${body.feet}" width="1024" height="1536"/>`
  // Low-cut shoes reveal the top of the foot. Sample the matching painted
  // skin into the source opening, then apply the exact same shoe transform.
  // No skin is baked into the footwear painting and no bare toes protrude.
  const openFeet = hasShoes ? (shoeAsset?.parts || []).filter((part) => part.skinOpening).map((part) => {
    const clipId = `${instanceId}-shoe-opening-${part.key}`
    const [x, y, width, height] = part.textureBox
    return `<g data-body-part="painted-foot-opening" data-foot-part="${part.key}" transform="${part.transform}"><defs><clipPath id="${clipId}"><path d="${part.skinOpening}"/></clipPath></defs><g clip-path="url(#${clipId})"><svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="${part.sampleBox.join(' ')}" preserveAspectRatio="none"><image href="${body.body}" width="1024" height="1536"/></svg></g></g>`
  }).join('') : ''
  return `<svg class="painted-paper-doll__body" data-paper-slot="base" data-footwear-attachment="${hasShoes ? 'painted-ankle-bridge' : 'barefoot'}" data-covered-arms="${Boolean(coversArms)}" data-covered-hands="${Boolean(coversHands)}" data-covered-legs="${Boolean(coversLegs)}" viewBox="0 0 1024 1536" aria-hidden="true"><defs><clipPath id="${bodyId}"><path d="${shodBody}"/></clipPath><clipPath id="${ankleId}"><path d="${ankles}"/></clipPath>${sleeveMask}${ankleBlend}</defs>${footLayer}${openFeet}<g${armMask}><image href="${body.body}" width="1024" height="1536"${bodyClip}${blendMask}/></g></svg>`
}

export function paintedPaperDollRecipe(appearance = {}) {
  const details = appearance.garmentDetails || {}
  const { top, outerwear } = clothingLayers(details)
  const topText = garmentText(top)
  const outerText = garmentText(outerwear || {})
  const bottomText = garmentText(details.bottom)
  const topFamily = CLOSED_JACKET.test(topText) ? 'jacket' : BLOUSE.test(topText) ? 'blouse' : 'shirt'
  const outerFamily = outerwear ? (CLOSED_JACKET.test(outerText) ? 'jacket' : 'outer') : null
  const bottomFamily = SKIRT.test(bottomText) ? 'skirt' : 'trousers'
  const dressFamily = DRESS.test(topText) ? (/jumpsuit|romper/.test(topText) ? 'trousers' : 'skirt') : null
  return Object.freeze({
    skinGroup: paintedOutfitSkinGroup(appearance),
    topFamily,
    outerFamily,
    bottomFamily,
    dressFamily,
    hasOuterwear: Boolean(outerwear),
    hasApron: Boolean(details.apron),
    hasShoes: Boolean(details.shoes),
  })
}

export function renderPaintedPaperDoll(profile = {}, appearance = {}, {
  id = '',
  className = '',
  label = 'Layered painted character',
  lookDirection = 'down',
} = {}) {
  const instanceId = safeToken(id, '') || `painted-paper-doll-${++paperDollSequence}`
  const details = appearance.garmentDetails || {}
  const { top, outerwear } = clothingLayers(details)
  const recipe = paintedPaperDollRecipe(appearance)
  const body = Object.fromEntries(Object.entries(BODY_ASSETS[recipe.skinGroup]).map(([key,path])=>[key,assetUrl(path)]))
  const topPalette = garmentPalette(top, appearance.top || '#efe1bd', appearance.topAccent || '#b94836')
  const outerPalette = garmentPalette(outerwear, appearance.outerwear || '#397d78', appearance.outerwearAccent || '#f1ca68')
  const bottomPalette = garmentPalette(details.bottom, appearance.bottom || '#607488', appearance.bottomAccent || '#d8a558')
  const apronPalette = garmentPalette(details.apron, appearance.apron || '#b94836', appearance.apronAccent || '#f1ca68')
  const shoePalette = garmentPalette(details.shoes, appearance.shoes || '#efe3c7', appearance.shoeAccent || '#775070')
  const outerAsset = registeredGarmentAsset(outerwear || {})
  const topAsset = registeredGarmentAsset(top || {})
  const outerCoversArms = Boolean(outerwear && (outerAsset?.coversArms ?? !/waistcoat|vest|cape/i.test(outerwear.cut || '')))
  const innerSleeveClip = outerAsset?.innerSleeveClip || (outerCoversArms && (outerAsset?.cropped ? 'cropped' : true))
  const coversArms = outerCoversArms || Boolean(registeredGarmentAsset(top || {})?.coversArms)
  const coversHands = appearance.accessories?.some((item) => registeredGarmentAsset({ ...item, slot: 'accessory' })?.coversHands)
  const coversLegs = Boolean((topAsset?.onePiece ? topAsset : registeredGarmentAsset(details.bottom || {}))?.coversLegs)
  const shoeAsset = registeredGarmentAsset(details.shoes || {})
  const legwear = topAsset?.onePiece ? top : details.bottom
  const longHem = Boolean(shoeAsset?.bodyOcclusion && legwear && /trouser|wide-leg|palazzo|jeans?|jogger|chino|cargo|sailor|jumpsuit|bootcut/.test(garmentText(legwear)))
  const baseLayers = [bodyMarkup(body, instanceId, recipe.hasShoes, coversArms, shoeAsset, coversHands, coversLegs, Boolean(outerAsset?.tucksWaist))]
  const clothes = []

  if (recipe.dressFamily && !topAsset?.onePiece) {
    clothes.push(paintedLayer({ slot: 'dress-bottom', family: recipe.dressFamily, src: GARMENT_ASSETS[recipe.dressFamily], garment: top, ...topPalette, pattern: top?.pattern, instanceId }))
  } else if (!topAsset?.onePiece && details.bottom) {
    clothes.push(paintedLayer({ slot: 'bottom', family: recipe.bottomFamily, src: GARMENT_ASSETS[recipe.bottomFamily], garment: details.bottom, ...bottomPalette, pattern: details.bottom?.pattern, instanceId, tuckedWaist: outerAsset?.tucksWaist }))
  }

  if (top) clothes.push(paintedLayer({ slot: 'top', family: recipe.topFamily, src: GARMENT_ASSETS[recipe.topFamily], garment: top, ...topPalette, pattern: top.pattern, instanceId, underOuterwear: innerSleeveClip }))
  if (outerwear) clothes.push(paintedLayer({ slot: 'outer', family: recipe.outerFamily, src: GARMENT_ASSETS[recipe.outerFamily], garment: outerwear, ...outerPalette, pattern: outerwear.pattern, instanceId }))

  if (details.shoes) clothes.push(paintedLayer({ slot: 'shoes', family: 'shoes', src: GARMENT_ASSETS.shoes, garment: details.shoes, ...shoePalette, pattern: details.shoes?.pattern, instanceId, underLongHem:longHem }))
  if (details.apron) clothes.push(paintedLayer({ slot: 'apron', family: 'apron', src: GARMENT_ASSETS.apron, garment: details.apron, ...apronPalette, pattern: details.apron?.pattern, instanceId }))

  const crownAsset = appearance.accessories?.map((item) => registeredGarmentAsset({ ...item, slot:'accessory' })).find((asset) => asset?.coversCrown)
  const hairStyle = profile.hairStyleId || profile.hairStyle || 'ponytail'
  const specificHairClip = Object.hasOwn(crownAsset?.hairVisibilityByStyle || {},hairStyle) ? crownAsset.hairVisibilityByStyle[hairStyle] : ''
  const hairVisibility = crownAsset ? specificHairClip || crownAsset.hairVisibility || 'M-120 60C32 60 57 54 81 54Q120 49 160 54C188 54 210 60 360 60V360H-120Z' : ''
  const backHead = renderModularHead(profile, appearance, { id: `${instanceId}-head-back`, label: '', layer: 'back', lookDirection, showNeck: false, hairVisibility })
  const frontHead = renderModularHead(profile, appearance, { id: `${instanceId}-head-front`, label: '', layer: 'front', lookDirection, showNeck: false, hairVisibility, scalpTrim:crownAsset ? 24 : 0 })
  const crown = Boolean(crownAsset)
  return `<span class="painted-paper-doll ${safeToken(className, '')}" role="img" aria-label="${escapeAttribute(label)}" data-renderer="painted-paper-doll-v1" data-equipment-rig="painted-paper-doll-v1" data-paper-doll-id="${instanceId}" data-headwear-fit="${crown ? 'crown' : 'open'}" data-painted-skin-group="${recipe.skinGroup}" data-top-family="${recipe.topFamily}" data-bottom-family="${recipe.dressFamily || recipe.bottomFamily}"><span class="painted-paper-doll__head painted-paper-doll__head--back" data-player-identity-layer="back" aria-hidden="true">${backHead}</span>${baseLayers.join('')}${clothes.join('')}${coversHands ? '' : foregroundHands(body, instanceId)}<span class="painted-paper-doll__head painted-paper-doll__head--front" data-player-identity-layer="front" aria-hidden="true">${frontHead}</span>${accessoriesMarkup(appearance.accessories, instanceId, hairStyle)}</span>`
}

