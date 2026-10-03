import { registeredGarmentAsset, renderRegisteredGarment } from './registered-garments.js'
import { assetUrl } from '../game-assets.js'
import { GARMENT_SLOTS, garmentEquipmentSlot } from '../garment-slots.js'

let thumbnailSequence = 0

const BASIC_SLOT_SHEETS = Object.freeze({
  top: 'assets/characters-v3/wardrobe/painted-tops-atlas-v1.png',
  bottom: 'assets/characters-v3/wardrobe/painted-bottoms-atlas-v1.png',
  apron: 'assets/characters-v3/wardrobe/painted-aprons-atlas-v1.png',
  shoes: 'assets/characters-v3/wardrobe/painted-shoes-atlas-v1.png',
})

const EXTENDED_SLOT_SHEETS = Object.freeze({
  top: 'assets/characters-v3/wardrobe/painted-tops-atlas-v2.png',
  bottom: 'assets/characters-v3/wardrobe/painted-bottoms-atlas-v2.png',
  apron: 'assets/characters-v3/wardrobe/painted-aprons-atlas-v2.png',
  shoes: 'assets/characters-v3/wardrobe/painted-shoes-atlas-v2.png',
  accessory: 'assets/characters-v3/wardrobe/painted-accessories-atlas-v1.png',
})

// Cut-family rules let the full catalogue resolve to intentional art
// while retaining their own palette, quality, provenance, and anchor data.
const EXTENDED_RULES = Object.freeze({
  top: Object.freeze([
    [/baby-tee/, 0], [/raglan/, 1], [/\btank\b|camisole|shell-top/, 2], [/\bpolo\b|henley/, 3],
    [/wrap-blouse|peasant/, 4], [/turtleneck|pullover|fisherman-knit/, 5], [/hoodie|sweatshirt/, 6], [/bomber/, 7],
    [/double-breasted|soft-blazer|tuxedo-jacket|tailcoat|bespoke-jacket|\bblazer\b/, 8], [/trench/, 9],
    [/peacoat|opera-coat|architect-coat|runway-coat|cocoon/, 10], [/jumpsuit/, 11],
    [/shirt-dress|shift-dress|wrap-dress|tea-dress|sundress|column-gown|bias-gown|couture-gown|draped-gown|panelled-gown/, 12],
    [/corset/, 13], [/capelet/, 14], [/jacquard|brocade|tapestry|couture/, 15],
  ]),
  bottom: Object.freeze([
    [/bermuda/, 3], [/\bshorts\b/, 0], [/a-line/, 1], [/pencil|leather-skirt/, 2],
    [/straight-leg|straight-jean|carpenter-jean|\bjeans\b/, 4], [/circle-skirt/, 5], [/cargo/, 6], [/jogger/, 7],
    [/wrap-skirt|bias-skirt/, 8], [/maxi|bustle|mermaid/, 9], [/palazzo|wide-leg/, 10], [/paperbag/, 11],
    [/sailor|jodhpur|cavalry|tuxedo-trouser|bespoke-trouser/, 12], [/tiered/, 13], [/origami|asym/, 14], [/petal|godet/, 15],
  ]),
  apron: Object.freeze([
    [/waist-apron/, 0], [/cobbler/, 1], [/bistro/, 2], [/split-apron|crossback/, 3],
    [/pinafore-dress/, 4], [/studio-smock|embroidered-smock/, 5], [/sommelier/, 6], [/leather-apron/, 7],
    [/couture-apron/, 8], [/atelier-cape/, 9], [/master-apron/, 10], [/tomato/, 11],
    [/house-apron/, 12], [/pinafore/, 13], [/embroidered/, 14], [/cafe|café|half-apron/, 15],
  ]),
  shoes: Object.freeze([
    [/mary-jane/, 0], [/espadrille/, 1], [/lace-up/, 2], [/\bmule/, 3],
    [/chelsea/, 4], [/slingback/, 5], [/t-strap/, 6], [/trainer/, 7],
    [/monk/, 8], [/platform/, 9], [/ballet-flat/, 10], [/knee-boot|riding-boot/, 11],
    [/spectator/, 12], [/wingtip|bespoke-oxford|handwelted/, 13], [/sculpted|velvet-pump|opera-pump/, 14], [/ribbon|silk-sandal/, 15],
    [/embroidered-boot|heeled-boot/, 2],
  ]),
  accessory: Object.freeze([
    [/scarf/, 0], [/brooch/, 1], [/veiled-beret|\bberet\b/, 2], [/satchel/, 3],
    [/\btote\b/, 4], [/headband/, 5], [/bucket-hat/, 6], [/\bbelt\b/, 7],
    [/cloche|pillbox/, 8], [/bow-tie/, 9], [/necktie|collar/, 10], [/glove/, 11],
    [/turban/, 12], [/handbag|frame-bag|doctor-bag|clutch|minaudiere|box-bag/, 13], [/fascinator|veiled/, 14], [/picture-hat|silk-flower|wide-brim/, 15],
    [/newsboy-cap/, 2],
  ]),
})

const BASIC_RULES = Object.freeze({
  top: Object.freeze([[/blouse|puff/, 1], [/chore|field-jacket/, 2], [/cardigan/, 3], [/waistcoat|vest|formal-shirt/, 4], [/denim|trucker|cropped-jacket/, 5], [/jacket/, 6], [/sweater|knit/, 7]]),
  bottom: Object.freeze([[/pleated/, 1], [/wide-leg|palazzo/, 2], [/floral|midi|a-line/, 3], [/pinstripe|tailored-trouser|formal/, 4], [/bias|wrap-skirt/, 5], [/cargo|utility/, 6], [/short/, 7]]),
  apron: Object.freeze([[/tailor|tool/, 1], [/crossback|bakery/, 2], [/half|waist-apron|scallop/, 3], [/cafe|café|mustard/, 4], [/stripe|teal/, 5], [/leather|craft/, 6], [/floral|market/, 7]]),
  shoes: Object.freeze([[/loafer/, 1], [/ankle|plum-boot/, 2], [/clog/, 3], [/work-boot/, 4], [/flat/, 5], [/high-top/, 6], [/oxford/, 7]]),
})

function textFor(garment = {}) {
  return `${garment.id || ''} ${garment.name || ''} ${garment.cut || ''} ${(garment.tags || []).join(' ')}`.toLowerCase()
}

function matchingFrame(text, rules, fallback = null) {
  const match = rules?.find(([pattern]) => pattern.test(text))
  return match ? match[1] : fallback
}

function makePlate(slot, src, frame, { columns, rows, page }) {
  return Object.freeze({ slot, src, frame, columns, rows, page, column: frame % columns, row: Math.floor(frame / columns) })
}

export function paintedGarmentPlate(garment = {}) {
  if (!GARMENT_SLOTS.includes(garment.slot) && garment.slot !== 'outer') return null
  const slot = garmentEquipmentSlot(garment)
  const artSlot = slot === 'outerwear' ? 'top' : slot
  if (!EXTENDED_SLOT_SHEETS[artSlot]) return null
  const text = textFor(garment)
  const extendedFrame = matchingFrame(text, EXTENDED_RULES[artSlot])
  if (extendedFrame != null) return makePlate(slot, EXTENDED_SLOT_SHEETS[artSlot], extendedFrame, { columns: 4, rows: 4, page: 'extended' })
  const basicFrame = matchingFrame(text, BASIC_RULES[artSlot], 0)
  return makePlate(slot, BASIC_SLOT_SHEETS[artSlot], basicFrame, { columns: 4, rows: 2, page: 'signature' })
}

function position(index, count) {
  return count <= 1 ? '0%' : `${index / (count - 1) * 100}%`
}

export function renderPaintedGarmentThumbnail(garment = {}) {
  const registered = registeredGarmentAsset(garment)
  if (registered) {
    return `<span class="painted-garment-thumbnail painted-garment-${garment.slot}" data-painted-garment-page="registered" aria-hidden="true">${renderRegisteredGarment(registered, { id: `wardrobe-fabric-${++thumbnailSequence}`, primary: garment.palette?.primary, secondary: garment.palette?.secondary, pattern: garment.pattern, outline: garment.outline, colorPattern: garment.colorPattern, customization:garment.customization, thumbnail: true })}</span>`
  }
  const plate = paintedGarmentPlate(garment)
  if (!plate) return ''
  const style = [
    `--painted-garment-image:url('${assetUrl(plate.src)}')`,
    `--painted-garment-x:${position(plate.column, plate.columns)}`,
    `--painted-garment-y:${position(plate.row, plate.rows)}`,
    `--painted-garment-size-x:${plate.columns * 100}%`,
    `--painted-garment-size-y:${plate.rows * 100}%`,
  ].join(';')
  return `<span class="painted-garment-thumbnail painted-garment-${plate.slot}" style="${style}" data-painted-garment-page="${plate.page}" data-painted-garment-frame="${plate.frame}" aria-hidden="true"></span>`
}
