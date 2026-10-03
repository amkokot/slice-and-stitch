import { garmentEquipmentSlot } from '../garment-slots.js'
import { assetUrl } from '../game-assets.js'
import { catalogueGarmentAsset } from './catalogue-garments.js'
import { specialtyGarmentAsset } from './specialty-garments.js'
import { majorGarmentAsset } from './major-garments.js'
import { garmentVisualDesign } from '../garment-design.js'
import { garmentTextileDefinition, garmentContourFilter } from './garment-textiles.js'
import { renderFashionDetails } from '../fashion-details.js'

const SOURCE_ROOT = '/assets/characters-v3/modular-v4/source'

// Registration lives with the painting, not with a character preset. All
// silhouettes use the same 1024 × 1536 body and remain independent of skin.
export const REGISTERED_GARMENTS = Object.freeze({
  'crew-tee': Object.freeze({
    family: 'crew-tee', src: `${SOURCE_ROOT}/top-crew-ivory-v1.png`,
    transform: 'translate(172.32 68) scale(.64)',
    thumbnailBox: '155 370 720 700', referenceLuminance: .82,
  }),
  cardigan: Object.freeze({
    family: 'cardigan', src: `${SOURCE_ROOT}/outer-cable-honey-v1.png`,
    transform: 'translate(90.4 80) scale(.8 .75)',
    thumbnailBox: '150 280 730 690', referenceLuminance: .69, coversArms: true,
  }),
  'soft-blazer': Object.freeze({
    family: 'soft-blazer', src: `${SOURCE_ROOT}/outer-soft-blazer-v1.png`,
    transform: 'translate(100.64 108) scale(.78 .76)',
    thumbnailBox: '130 220 765 700', referenceLuminance: .49, coversArms: true,
  }),
  'wide-trousers': Object.freeze({
    family: 'wide-trousers', src: `${SOURCE_ROOT}/bottom-wide-linen-v1.png`,
    transform: 'translate(49.44 226.75) scale(.88 .795)',
    thumbnailBox: '270 520 490 860', referenceLuminance: .71, coversLegs:true,
  }),
  'pencil-skirt': Object.freeze({
    family: 'pencil-skirt', src: `${SOURCE_ROOT}/bottom-pencil-twill-v1.png`,
    transform: 'translate(-27.36 311.1) scale(1.03 .63)',
    thumbnailBox: '310 540 405 700', referenceLuminance: .38,
  }),
  'canvas-sneakers': Object.freeze({
    family: 'canvas-sneakers', src: '/assets/characters-v3/modular-v4/render/shoes-canvas-onbody-v3.png',
    transform: '', thumbnailBox: '255 1275 520 150', referenceLuminance: .85,
    parts: Object.freeze([
      Object.freeze({ key: 'left', clip: [0, 0, 512, 1536], transform: 'translate(-6 10)' }),
      Object.freeze({ key: 'right', clip: [512, 0, 512, 1536], transform: 'translate(6 3)' }),
    ]),
    neutralTrim: 'M275 1388Q350 1406 447 1359V1420H275ZM567 1359Q656 1408 745 1388V1420H567Z',
    lightDetails: 'M310 1335L375 1299L419 1347L354 1375ZM590 1347L635 1299L704 1335L659 1375Z',
  }),
  'penny-loafers': Object.freeze({
    family: 'penny-loafers', src: `${SOURCE_ROOT}/shoes-penny-loafers-v1.png`,
    transform: '', thumbnailBox: '170 1230 680 230', referenceLuminance: .43,
    parts: Object.freeze([
      Object.freeze({ key: 'left', clip: [0, 0, 512, 1536], transform: 'translate(160.2 319.4) scale(.6 .76)' }),
      Object.freeze({ key: 'right', clip: [512, 0, 512, 1536], transform: 'translate(247.8 319.4) scale(.6 .76)' }),
    ]),
    neutralTrim: 'M194 1406Q320 1440 463 1366V1455H194ZM561 1366Q690 1440 832 1406V1455H561Z',
  }),
  'waist-apron': Object.freeze({
    family: 'waist-apron', src: `${SOURCE_ROOT}/apron-waist-sage-v1.png`,
    transform: 'translate(126.24 159.5) scale(.73)',
    thumbnailBox: '245 730 535 460', referenceLuminance: .54,
  }),
  'button-shirt': Object.freeze({
    family: 'button-shirt', src: `${SOURCE_ROOT}/top-button-shirt-v1.png`,
    transform: 'translate(172.32 121.5) scale(.64 .595)', thumbnailBox: '45 245 935 865', referenceLuminance: .81, coversArms: true,
  }),
  'knit-pullover': Object.freeze({
    family: 'knit-pullover', src: `${SOURCE_ROOT}/top-knit-pullover-v1.png`,
    transform: 'translate(151.84 85.33) scale(.68 .71)', thumbnailBox: '100 260 830 715', referenceLuminance: .75, coversArms: true,
  }),
  'rib-tank': Object.freeze({
    family: 'rib-tank', src: `${SOURCE_ROOT}/top-rib-tank-v1.png`,
    transform: 'translate(116 148.01) scale(.75 .589)', thumbnailBox: '245 280 535 815', referenceLuminance: .8,
  }),
  'denim-jacket': Object.freeze({
    family: 'denim-jacket', src: `${SOURCE_ROOT}/outer-denim-jacket-v1.png`,
    transform: 'translate(223.52 128) scale(.54)', thumbnailBox: '0 220 1024 985', referenceLuminance: .6, coversArms: true, cropped: true,
  }),
  'tailored-waistcoat': Object.freeze({
    family: 'tailored-waistcoat', src: `${SOURCE_ROOT}/outer-tailored-waistcoat-v1.png`,
    transform: 'translate(203.04 186.7) scale(.58 .48)', thumbnailBox: '165 230 695 1020', referenceLuminance: .62, coversArms: false,
  }),
  'a-line-skirt': Object.freeze({
    family: 'a-line-skirt', src: `${SOURCE_ROOT}/bottom-a-line-skirt-v2.png`,
    transform: 'translate(-22.24 474.74) scale(1.02 .5057)', thumbnailBox: '175 380 675 910', referenceLuminance: .62,
  }),
  'tailored-shorts': Object.freeze({
    family: 'tailored-shorts', src: `${SOURCE_ROOT}/bottom-tailored-shorts-v1.png`,
    transform: 'translate(141.6 494.82) scale(.7 .42)', thumbnailBox: '215 415 595 615', referenceLuminance: .62,
  }),
  'ankle-boots': Object.freeze({
    family: 'ankle-boots', src: `${SOURCE_ROOT}/shoes-ankle-boots-v1.png`,
    transform: '', thumbnailBox: '115 1000 800 380', referenceLuminance: .53,
    parts: Object.freeze([
      Object.freeze({ key: 'left', clip: [0, 0, 512, 1536], transform: 'translate(183 545.13) scale(.6 .635)' }),
      Object.freeze({ key: 'right', clip: [512, 0, 512, 1536], transform: 'translate(222 545.13) scale(.6 .635)' }),
    ]),
    neutralTrim: 'M125 1328H442V1380H125ZM582 1328H900V1380H582Z',
  }),
  'ballet-flats': Object.freeze({
    family: 'ballet-flats', src: `${SOURCE_ROOT}/shoes-ballet-flats-v1.png`,
    transform: '', thumbnailBox: '165 1140 695 280', referenceLuminance: .57,
    parts: Object.freeze([
      Object.freeze({ key: 'left', clip: [0, 0, 512, 1536], transform: 'translate(163 734.64) scale(.6 .48)',
        skinOpening: 'M378 1157L218 1310Q310 1340 371 1310C400 1292 420 1255 411 1215C408 1190 400 1170 393 1162Z',
        textureBox: [215, 1155, 210, 190], sampleBox: [375, 1180, 35, 70] }),
      Object.freeze({ key: 'right', clip: [512, 0, 512, 1536], transform: 'translate(243 734.64) scale(.6 .48)',
        skinOpening: 'M646 1157L806 1310Q714 1340 653 1310C624 1292 604 1255 613 1215C616 1190 624 1170 631 1162Z',
        textureBox: [599, 1155, 210, 190], sampleBox: [608, 1180, 35, 70] }),
    ]),
    neutralTrim: 'M175 1385H443V1430H175ZM586 1385H850V1430H586Z',
  }),
  'bib-apron': Object.freeze({
    family: 'bib-apron', src: `${SOURCE_ROOT}/apron-bib-apron-v1.png`,
    transform: 'translate(162.08 186) scale(.66 .71)', thumbnailBox: '240 165 545 1120', referenceLuminance: .75,
  }),
  'woven-scarf': Object.freeze({
    family: 'woven-scarf', src: `${SOURCE_ROOT}/accessory-woven-scarf-v1.png`,
    transform: 'translate(182 146.24) scale(.62 .48)', thumbnailBox: '335 350 355 565', referenceLuminance: .75,
    // Fixed front-view rig: discard the hidden back loop rather than adding
    // another depth layer. The curved opening keeps the visible drape intact.
    visibleContour: 'M0 440H350Q410 440 458 486Q518 512 576 482Q635 435 684 435H1024V1536H0Z',
  }),
  'pique-polo': Object.freeze({
    family: 'pique-polo', src: `${SOURCE_ROOT}/top-polo-v1.png`,
    transform: 'translate(245.76 155) scale(.52 .48)', thumbnailBox: '35 280 955 985', referenceLuminance: .81,
  }),
  'camp-shirt': Object.freeze({
    family: 'camp-shirt', src: `${SOURCE_ROOT}/top-camp-shirt-v1.png`,
    transform: 'translate(184.32 102) scale(.64 .58)', thumbnailBox: '120 315 785 825', referenceLuminance: .81,
  }),
  'wrap-blouse': Object.freeze({
    family: 'wrap-blouse', src: `${SOURCE_ROOT}/top-wrap-blouse-v1.png`,
    transform: 'translate(184.32 82) scale(.64)', thumbnailBox: '65 320 890 755', referenceLuminance: .81,
  }),
  'cargo-trousers': Object.freeze({
    family: 'cargo-trousers', src: `${SOURCE_ROOT}/bottom-cargo-trousers-v1.png`,
    transform: 'translate(128 429.48) scale(.75 .66)', thumbnailBox: '250 350 530 1010', referenceLuminance: .62,
  }),
  'pleated-midi': Object.freeze({
    family: 'pleated-midi', src: `${SOURCE_ROOT}/bottom-pleated-midi-v2.png`,
    transform: 'translate(0 -103)', thumbnailBox: '205 760 615 500', referenceLuminance: .33,
  }),
  'chore-jacket': Object.freeze({
    family: 'chore-jacket', src: '/assets/characters-v3/modular-v4/render/outer-teal-chore-onbody-v3.png',
    transform: '', thumbnailBox: '235 270 525 500', referenceLuminance: .3,
    // Rolled cuffs deliberately expose forearms and any inner shirt sleeves.
    coversArms: false,
    innerSleeveClip: 'rolled',
  }),
  'crossback-apron': Object.freeze({
    family: 'crossback-apron', src: `${SOURCE_ROOT}/apron-crossback-v1.png`,
    transform: 'translate(174.08 210) scale(.66 .64)', thumbnailBox: '225 215 575 1195', referenceLuminance: .81,
  }),
})

export function registeredGarmentAsset(garment = {}) {
  if (garment.customization?.templateId) garment = {...garment, id:garment.customization.templateId}
  const major = majorGarmentAsset(garment)
  if (major) return major
  const specialty = specialtyGarmentAsset(garment)
  if (specialty) return specialty
  const slot = garmentEquipmentSlot(garment)
  // Match the actual cut, not a mood/material tag ("soft", "classic", etc.).
  // Keep unsupported shapes explicit rather than silently calling them finished.
  const cut = String(garment.cut || '').toLowerCase()
  if (slot === 'top' && cut === 'polo') return REGISTERED_GARMENTS['pique-polo']
  if (slot === 'top' && cut === 'camp-shirt') return REGISTERED_GARMENTS['camp-shirt']
  if (slot === 'top' && cut === 'wrap-blouse') return REGISTERED_GARMENTS['wrap-blouse']
  if (slot === 'bottom' && cut === 'cargo-pants') return REGISTERED_GARMENTS['cargo-trousers']
  if (slot === 'bottom' && cut === 'pleated-skirt') return REGISTERED_GARMENTS['pleated-midi']
  if (slot === 'outerwear' && ['jacket', 'chore-jacket'].includes(cut)) return REGISTERED_GARMENTS['chore-jacket']
  if (slot === 'apron' && cut === 'crossback-apron') return REGISTERED_GARMENTS['crossback-apron']
  if (slot === 'top' && cut === 'oxford-shirt') return REGISTERED_GARMENTS['button-shirt']
  if (slot === 'top' && cut === 'pullover') return REGISTERED_GARMENTS['knit-pullover']
  if (slot === 'top' && cut === 'tank') return REGISTERED_GARMENTS['rib-tank']
  if (slot === 'outerwear' && cut === 'trucker-jacket') return REGISTERED_GARMENTS['denim-jacket']
  if (slot === 'outerwear' && cut === 'waistcoat') return REGISTERED_GARMENTS['tailored-waistcoat']
  if (slot === 'bottom' && cut === 'a-line-skirt') return REGISTERED_GARMENTS['a-line-skirt']
  if (slot === 'bottom' && cut === 'bermuda-shorts') return REGISTERED_GARMENTS['tailored-shorts']
  if (slot === 'shoes' && cut === 'chelsea-boots') return REGISTERED_GARMENTS['ankle-boots']
  if (slot === 'shoes' && ['flats', 'ballet-flats'].includes(cut)) return REGISTERED_GARMENTS['ballet-flats']
  if (slot === 'apron' && cut === 'bib-apron') return REGISTERED_GARMENTS['bib-apron']
  if (slot === 'accessory' && cut === 'scarf') return REGISTERED_GARMENTS['woven-scarf']
  const text = [garment.id, garment.cut, ...(garment.tags || [])].filter(Boolean).join(' ').toLowerCase()
  if (garment.slot === 'apron' && /waist-apron|half-apron/.test(text)) return REGISTERED_GARMENTS['waist-apron']
  if (garment.slot === 'top' && /(?:^|[\s-])(?:tee|baby-tee|crew-tee)(?:$|[\s-])/.test(text)) return REGISTERED_GARMENTS['crew-tee']
  if (slot === 'outerwear' && /cardigan/.test(text)) return REGISTERED_GARMENTS.cardigan
  if (slot === 'outerwear' && /blazer/.test(text) && cut !== 'double-breasted-blazer') return REGISTERED_GARMENTS['soft-blazer']
  if (garment.slot === 'bottom' && /wide-leg|palazzo|wide-trousers/.test(text)) return REGISTERED_GARMENTS['wide-trousers']
  if (garment.slot === 'bottom' && /pencil-skirt/.test(text)) return REGISTERED_GARMENTS['pencil-skirt']
  if (garment.slot === 'shoes' && /loafer/.test(text)) return REGISTERED_GARMENTS['penny-loafers']
  if (garment.slot === 'shoes' && /sneaker|trainer/.test(text)) return REGISTERED_GARMENTS['canvas-sneakers']
  return catalogueGarmentAsset(garment, REGISTERED_GARMENTS)
}

export function garmentTintMatrix(color, referenceLuminance) {
  const hex = /^#[0-9a-f]{6}$/i.test(String(color)) ? color : '#c7af88'
  const rows = [0, 1, 2].map((channel) => {
    const gain = Number.parseInt(hex.slice(1 + channel * 2, 3 + channel * 2), 16) / 255 / referenceLuminance
    return [.2126, .7152, .0722].map((weight) => (weight * gain).toFixed(5)).concat('0', '0').join(' ')
  })
  // Preserve alpha and fold luminance. Unlike a CSS color overlay, dark
  // fabrics actually become dark instead of retaining ivory highlights.
  return `${rows.join(' ')} 0 0 0 1 0`
}

export function renderRegisteredGarment(asset, { id, primary, secondary, pattern, outline, colorPattern, customization, thumbnail = false, hairStyle = '' } = {}) {
  asset={...asset,src:assetUrl(asset.src)}
  if (!thumbnail && Object.hasOwn(asset.hairTransforms || {}, hairStyle)) asset = {...asset, transform:asset.hairTransforms[hairStyle]}
  const filterId = String(id || 'registered-garment').replace(/[^a-z0-9-]/gi, '')
  const transform = thumbnail || !asset.transform ? '' : ` transform="${asset.transform}"`
  const design = garmentVisualDesign({ palette: { primary, secondary }, pattern, outline, colorPattern })
  const textile = garmentTextileDefinition(filterId, design.colorPattern)
  const mask = textile ? `<mask id="${filterId}-mask" mask-type="alpha" x="0" y="0" width="1024" height="1536" maskUnits="userSpaceOnUse"><image href="${asset.src}" width="1024" height="1536"${asset.cleanAlpha ? ` filter="url(#${filterId})"` : ''}/></mask>` : ''
  const overlay = textile ? `<rect width="1024" height="1536" fill="url(#${filterId}-pattern)" mask="url(#${filterId}-mask)" opacity="${design.colorPattern.opacity}"/>` : ''
  const neutralClip = asset.neutralTrim ? `<clipPath id="${filterId}-neutral"><path d="${asset.neutralTrim}"/></clipPath>` : ''
  const lightClip = asset.lightDetails ? `<clipPath id="${filterId}-laces"><path d="${asset.lightDetails}"/></clipPath><filter id="${filterId}-light-alpha" color-interpolation-filters="sRGB"><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 1.063 3.576 .361 0 -3.6"/><feComposite in2="SourceGraphic" operator="in"/></filter><mask id="${filterId}-light-mask" mask-type="alpha" x="0" y="0" width="1024" height="1536" maskUnits="userSpaceOnUse"><image href="${asset.src}" width="1024" height="1536" filter="url(#${filterId}-light-alpha)"/></mask>` : ''
  const neutral = asset.neutralTrim ? `<image href="${asset.src}" width="1024" height="1536" clip-path="url(#${filterId}-neutral)"/>` : ''
  const laces = asset.lightDetails ? `<image href="${asset.src}" width="1024" height="1536" clip-path="url(#${filterId}-laces)" mask="url(#${filterId}-light-mask)"/>` : ''
  const attached = renderFashionDetails(asset, customization, filterId, primary, secondary)
  const unclippedPainting = `<image href="${asset.src}" width="1024" height="1536" filter="url(#${filterId})"/>${overlay}${neutral}${laces}${attached.markup}`
  const clips = (asset.parts || []).map((part) => `<clipPath id="${filterId}-${part.key}"><rect x="${part.clip[0]}" y="${part.clip[1]}" width="${part.clip[2]}" height="${part.clip[3]}"/></clipPath>`).join('')
  // Delete empty insoles and the small rear strap/collar arcs occupied by the
  // foot. Keep front straps, hardware and product thumbnails intact. Paths are
  // source-native, so the deletion follows each foot's registration exactly.
  const openingPath = (part) => `${part.clearOpening && part.skinOpening ? part.skinOpening : ''} ${part.wornCutout || ''}`.trim()
  const openingMasks = (asset.parts || []).filter((part) => openingPath(part)).map((part) => `<mask id="${filterId}-${part.key}-opening" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1536"><rect width="1024" height="1536" fill="white"/><path d="${openingPath(part)}" fill="black"/></mask>`).join('')
  const visibleClip = asset.visibleContour ? `<clipPath id="${filterId}-visible"><path d="${asset.visibleContour}"/></clipPath>` : ''
  const visibleMask = asset.visibleContour ? ` clip-path="url(#${filterId}-visible)"` : ''
  // Contours are authored in source coordinates. Clip before fitting, so a
  // deleted rear collar never returns when the source receives a UV mesh.
  const painting = `<g${visibleMask}>${unclippedPainting}</g>`
  const mesh = !thumbnail && asset.fit ? garmentFitMesh(asset.fit) : []
  const fitClips = mesh.map((piece, index) => `<clipPath id="${filterId}-fit-${index}"><polygon points="${piece.points}"/></clipPath>`).join('')
  const layers = thumbnail ? painting : mesh.length ? mesh.map((piece, index) => `<g transform="${piece.transform}"><g clip-path="url(#${filterId}-fit-${index})">${painting}</g></g>`).join('') : asset.parts ? asset.parts.map((part) => `<g data-garment-part="${part.key}"${['left','right'].includes(part.key) ? ` data-footwear-part="${part.key}"` : ''} transform="${part.transform}"><g clip-path="url(#${filterId}-${part.key})"${openingPath(part) ? ` mask="url(#${filterId}-${part.key}-opening)"` : ''}>${painting}</g></g>`).join('') : painting
  const alpha = asset.cleanAlpha ? '<feComponentTransfer result="cloth"><feFuncA type="table" tableValues="0 0 0 1 1 1 1 1 1"/></feComponentTransfer>' : ''
  // Fit triangles share a single assembled contour pass. Applying morphology
  // to every source image inside the mesh is unnecessarily expensive.
  const contour = `<filter id="${filterId}-contour" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0" result="cloth"/>${garmentContourFilter(design.outline)}</filter>`
  return `<svg class="${thumbnail ? 'painted-garment-thumbnail__painting' : 'painted-paper-doll__paint'}" data-textile="${design.colorPattern.key}" data-textile-mode="${design.colorPattern.mode}" data-contour="soft-painted" viewBox="${thumbnail ? asset.thumbnailBox : '0 0 1024 1536'}" aria-hidden="true"><defs><filter id="${filterId}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" result="cloth" values="${garmentTintMatrix(primary, asset.referenceLuminance)}"/>${alpha}</filter>${contour}${textile}${mask}${neutralClip}${lightClip}${clips}${openingMasks}${visibleClip}${fitClips}${attached.defs}</defs><g${transform}><g filter="url(#${filterId}-contour)">${layers}</g></g></svg>`
}

// A continuous piecewise-affine UV mesh. Adjacent triangles share exactly the
// same destination vertices; unlike horizontal scale strips, cloth folds do
// not jump sideways at each row. Only these registration rows vary by painting.
export function garmentFitMesh(anchors) {
  const mesh = []
  // Optional fourth row coordinate fits cuffs independently of the torso hem.
  // A continuous transition across the side seams keeps the painting whole.
  const splitSleeves = anchors.some((row) => row.length > 3)
  const columns = splitSleeves ? [0,170,240,512,784,854,1024] : [0,512,1024]
  for (let segment = 0; segment < anchors.length - 1; segment++) {
    const [sourceY, bodyY, width, sleeveY = bodyY, sleeveWidth = width] = anchors[segment]
    const [endSourceY, endBodyY, endWidth, endSleeveY = endBodyY, endSleeveWidth = endWidth] = anchors[segment + 1]
    const count = Math.ceil((endSourceY - sourceY) / 64)
    const height = (endSourceY - sourceY) / count
    for (let index = 0; index < count; index++) {
      const y = sourceY + index * height
      const sy = (endBodyY - bodyY) / (endSourceY - sourceY)
      const w0 = width + (endWidth - width) * index / count
      const w1 = width + (endWidth - width) * (index + 1) / count
      const target = (x, lower) => {
        const dy = y - sourceY + (lower ? height : 0)
        const torso = bodyY + dy * sy
        const sleeve = sleeveY + dy * (endSleeveY - sleeveY) / (endSourceY - sourceY)
        const blend = splitSleeves ? Math.max(0, Math.min(1, (Math.abs(x - 512) - 272) / 70)) : 0
        const torsoWidth = lower ? w1 : w0
        const cuffWidth = sleeveWidth + dy * (endSleeveWidth - sleeveWidth) / (endSourceY - sourceY)
        return [512 + (x - 512) * (torsoWidth + (cuffWidth - torsoWidth) * blend), torso + (sleeve - torso) * blend]
      }
      for (let column = 0; column < columns.length - 1; column++) {
        const x = columns[column], endX = columns[column + 1]
        const corners = [[x,y], [endX,y], [endX,y+height], [x,y+height]]
        const dest = [target(x,false), target(endX,false), target(endX,true), target(x,true)]
        for (const indices of [[0,1,2],[0,2,3]]) {
          const p = indices.map(i => corners[i]); const q = indices.map(i => dest[i])
          const ux = p[1][0]-p[0][0], uy = p[1][1]-p[0][1], vx = p[2][0]-p[0][0], vy = p[2][1]-p[0][1]
          const det = ux*vy-uy*vx
          const dx = q[1][0]-q[0][0], dy = q[1][1]-q[0][1], ex = q[2][0]-q[0][0], ey = q[2][1]-q[0][1]
          const a = (dx*vy-ex*uy)/det, b = (dy*vy-ey*uy)/det, c = (ex*ux-dx*vx)/det, d = (ey*ux-dy*vx)/det
          const cx = p.reduce((n,v)=>n+v[0],0)/3, cy = p.reduce((n,v)=>n+v[1],0)/3
          // Overlap by several source pixels: subpixel clip antialiasing must
          // never introduce transparent hairlines when the avatar is small.
          const points = p.map(([px,py]) => `${px+(px-cx)*.03},${py+(py-cy)*.3}`).join(' ')
          mesh.push({ points, transform: `matrix(${a} ${b} ${c} ${d} ${q[0][0]-a*p[0][0]-c*p[0][1]} ${q[0][1]-b*p[0][0]-d*p[0][1]})` })
        }
      }
    }
  }
  return mesh
}
