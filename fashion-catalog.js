import { PAINTED_CAPSULE_GARMENTS } from './character-v3/painted-capsule.js'
import { SPECIALTY_STYLES, SPECIALTY_COLORWAYS, SPECIALTY_EXTRA_COLORWAYS, SPECIALTY_MATERIALS } from './character-v3/specialty-capsule.js'
import { garmentEquipmentSlot } from './garment-slots.js'
import { garmentVisualDesign } from './garment-design.js'
import { fashionFamily, compatibleFashionFabric, earliestFashionMaterialLevel, fashionConstructionBrief } from './fashion-types.js'

const freezeList = (items) => Object.freeze(items.map((item) => Object.freeze({
  ...item,
  ...(item.palette && item.cut ? garmentVisualDesign(item) : {}),
  ...(item.slot ? { slot: garmentEquipmentSlot(item) } : {}),
  palette: item.palette ? Object.freeze({ ...item.palette }) : undefined,
  tags: Object.freeze([...(item.tags || [])]),
  attachmentPoints: Object.freeze([...(item.attachmentPoints || [])]),
})))

export const FASHION_SETS = Object.freeze({
  'counter-classic': Object.freeze({
    id: 'counter-classic', name: 'Counter Classic', mark: '◆',
    pieces: ['cream-work-tee', 'check-trousers', 'tomato-apron'],
    twoPiece: '+4% customer tips', full: '+7% customer tips',
  }),
  'garden-market': Object.freeze({
    id: 'garden-market', name: 'Garden Market', mark: '✿',
    pieces: ['sage-chore-jacket', 'market-pleat-skirt', 'garden-scarf'],
    twoPiece: '+5% tips on vegetable orders', full: '+9% vegetable-order tips',
  }),
  'plum-atelier': Object.freeze({
    id: 'plum-atelier', name: 'Plum Atelier', mark: '✦',
    pieces: ['violet-blouse', 'plum-skirt', 'plum-boots'],
    twoPiece: '+3 finish points', full: '+6 finish points',
  }),
  'midnight-rush': Object.freeze({
    id: 'midnight-rush', name: 'Midnight Rush', mark: '◐',
    pieces: ['navy-waistcoat', 'charcoal-trousers', 'oxford-loafers'],
    twoPiece: '+5% evening & night tips', full: '+10% evening & night tips',
  }),
  'sunday-social': Object.freeze({
    id: 'sunday-social', name: 'Sunday Social', mark: '☀',
    pieces: ['butter-cardigan', 'rose-bias-skirt', 'ribbon-flats'],
    twoPiece: '+4% reputation gain', full: '+8% reputation gain',
  }),
  'maker-studio': Object.freeze({
    id: 'maker-studio', name: 'Maker Studio', mark: '✂',
    pieces: ['teal-jacket', 'denim-trousers', 'tool-roll-apron'],
    twoPiece: '8% lower project costs', full: '15% lower project costs',
  }),
})

const SIGNATURE_GARMENTS = [
  { id: 'cream-work-tee', name: 'Cream work tee', slot: 'top', cut: 'tee', price: 28, unlockLevel: 1, setId: 'counter-classic', palette: { primary: '#efe1bd', secondary: '#b94836' }, tags: ['workwear', 'classic'], attachmentPoints: ['torso', 'left-arm', 'right-arm'] },
  { id: 'violet-blouse', name: 'Violet pin-tuck blouse', slot: 'top', cut: 'blouse', pattern: 'pinstripe', price: 76, quality: 78, unlockLevel: 1, setId: 'plum-atelier', palette: { primary: '#775070', secondary: '#efc6d2' }, tags: ['classic', 'soft'], attachmentPoints: ['torso', 'left-arm', 'right-arm'] },
  { id: 'teal-jacket', name: 'Teal counter jacket', slot: 'top', cut: 'jacket', price: 112, quality: 82, unlockLevel: 2, setId: 'maker-studio', palette: { primary: '#397d78', secondary: '#f1ca68' }, tags: ['workwear', 'bold'], attachmentPoints: ['torso', 'left-arm', 'right-arm'] },
  { id: 'sage-chore-jacket', name: 'Sage chore jacket', slot: 'top', cut: 'chore-jacket', price: 124, quality: 84, unlockLevel: 2, setId: 'garden-market', palette: { primary: '#647e60', secondary: '#e9c979' }, tags: ['utility', 'relaxed'], attachmentPoints: ['torso', 'left-arm', 'right-arm'] },
  { id: 'butter-cardigan', name: 'Butter cable cardigan', slot: 'top', cut: 'cardigan', pattern: 'cable', price: 138, quality: 86, unlockLevel: 3, setId: 'sunday-social', palette: { primary: '#e2bd68', secondary: '#fff0c7' }, tags: ['knitwear', 'soft'], attachmentPoints: ['torso', 'left-arm', 'right-arm'] },
  { id: 'navy-waistcoat', name: 'Navy tailored waistcoat', slot: 'top', cut: 'waistcoat', pattern: 'pinstripe', price: 168, quality: 90, unlockLevel: 4, setId: 'midnight-rush', palette: { primary: '#313d54', secondary: '#c8a45d' }, tags: ['tailored', 'evening'], attachmentPoints: ['torso'] },
  { id: 'coral-camp-shirt', name: 'Coral camp-collar shirt', slot: 'top', cut: 'camp-shirt', pattern: 'floral', price: 92, quality: 80, unlockLevel: 2, palette: { primary: '#c96e61', secondary: '#f3d3a5' }, tags: ['resort', 'casual'], attachmentPoints: ['torso', 'left-arm', 'right-arm'] },
  { id: 'ivory-oxford', name: 'Ivory Oxford shirt', slot: 'top', cut: 'oxford-shirt', price: 118, quality: 85, unlockLevel: 3, palette: { primary: '#eee4d0', secondary: '#68839a' }, tags: ['classic', 'tailored'], attachmentPoints: ['torso', 'left-arm', 'right-arm'] },
  { id: 'cocoa-cocoon-coat', name: 'Cocoa cocoon coat', slot: 'top', cut: 'coat', pattern: 'herringbone', price: 224, quality: 93, unlockLevel: 5, palette: { primary: '#6a4b3e', secondary: '#c59b71' }, tags: ['outerwear', 'editorial'], attachmentPoints: ['torso', 'left-arm', 'right-arm'] },

  { id: 'denim-trousers', name: 'Soft denim trousers', slot: 'bottom', cut: 'pants', price: 44, unlockLevel: 1, setId: 'maker-studio', palette: { primary: '#607488', secondary: '#d8a558' }, tags: ['workwear', 'casual'], attachmentPoints: ['hips', 'left-leg', 'right-leg'] },
  { id: 'plum-skirt', name: 'Plum service skirt', slot: 'bottom', cut: 'skirt', pattern: 'pinstripe', price: 68, quality: 76, unlockLevel: 1, setId: 'plum-atelier', palette: { primary: '#6e4967', secondary: '#d9a7b8' }, tags: ['classic', 'service'], attachmentPoints: ['hips', 'left-leg', 'right-leg'] },
  { id: 'check-trousers', name: 'Oven-check trousers', slot: 'bottom', cut: 'pants', pattern: 'check', price: 88, quality: 80, unlockLevel: 1, setId: 'counter-classic', palette: { primary: '#3f3547', secondary: '#ead9bd' }, tags: ['playful', 'workwear'], attachmentPoints: ['hips', 'left-leg', 'right-leg'] },
  { id: 'market-pleat-skirt', name: 'Market pleat skirt', slot: 'bottom', cut: 'pleated-skirt', pattern: 'stripe', price: 108, quality: 83, unlockLevel: 2, setId: 'garden-market', palette: { primary: '#7f8d57', secondary: '#eac878' }, tags: ['heritage', 'daywear'], attachmentPoints: ['hips', 'left-leg', 'right-leg'] },
  { id: 'charcoal-trousers', name: 'Charcoal peg trousers', slot: 'bottom', cut: 'peg-trouser', pattern: 'pinstripe', price: 152, quality: 89, unlockLevel: 4, setId: 'midnight-rush', palette: { primary: '#343943', secondary: '#8f9cab' }, tags: ['tailored', 'evening'], attachmentPoints: ['hips', 'left-leg', 'right-leg'] },
  { id: 'rose-bias-skirt', name: 'Rose bias-cut midi', slot: 'bottom', cut: 'bias-skirt', price: 146, quality: 88, unlockLevel: 3, setId: 'sunday-social', palette: { primary: '#b96f78', secondary: '#f1c8b4' }, tags: ['romantic', 'occasion'], attachmentPoints: ['hips', 'left-leg', 'right-leg'] },
  { id: 'sand-wide-leg', name: 'Sand wide-leg trousers', slot: 'bottom', cut: 'wide-leg', price: 126, quality: 85, unlockLevel: 3, palette: { primary: '#b59a72', secondary: '#f0e0bf' }, tags: ['minimal', 'relaxed'], attachmentPoints: ['hips', 'left-leg', 'right-leg'] },
  { id: 'indigo-culottes', name: 'Indigo work culottes', slot: 'bottom', cut: 'culottes', pattern: 'denim', price: 102, quality: 82, unlockLevel: 2, palette: { primary: '#465c75', secondary: '#c98c58' }, tags: ['workwear', 'modern'], attachmentPoints: ['hips', 'left-leg', 'right-leg'] },

  { id: 'house-apron', name: 'House apron', slot: 'apron', cut: 'service-apron', price: 22, unlockLevel: 1, palette: { primary: '#417358', secondary: '#f1ca68' }, tags: ['workwear', 'house'], attachmentPoints: ['chest', 'waist'] },
  { id: 'tomato-apron', name: 'Tomato service apron', slot: 'apron', cut: 'service-apron', pattern: 'stripe', price: 48, quality: 78, unlockLevel: 1, setId: 'counter-classic', palette: { primary: '#b94836', secondary: '#f8dfae' }, tags: ['playful', 'service'], attachmentPoints: ['chest', 'waist'] },
  { id: 'tool-roll-apron', name: 'Maker tool-roll apron', slot: 'apron', cut: 'crossback-apron', price: 96, quality: 84, unlockLevel: 2, setId: 'maker-studio', palette: { primary: '#55726e', secondary: '#d59a55' }, tags: ['utility', 'maker'], attachmentPoints: ['chest', 'waist'] },
  { id: 'pinafore-apron', name: 'Linen pinafore apron', slot: 'apron', cut: 'pinafore', price: 118, quality: 86, unlockLevel: 3, palette: { primary: '#a98e77', secondary: '#eee0bd' }, tags: ['heritage', 'soft'], attachmentPoints: ['chest', 'waist'] },
  { id: 'embroidered-apron', name: 'Embroidered atelier apron', slot: 'apron', cut: 'bib-apron', pattern: 'floral', price: 186, quality: 93, unlockLevel: 5, palette: { primary: '#503d58', secondary: '#dca78a' }, tags: ['artisan', 'ornate'], attachmentPoints: ['chest', 'waist'] },

  { id: 'canvas-sneakers', name: 'Canvas sneakers', slot: 'shoes', cut: 'sneakers', price: 36, unlockLevel: 1, palette: { primary: '#efe3c7', secondary: '#775070' }, tags: ['casual'], attachmentPoints: ['left-foot', 'right-foot'] },
  { id: 'plum-boots', name: 'Plum ankle boots', slot: 'shoes', cut: 'boots', price: 94, quality: 79, unlockLevel: 2, setId: 'plum-atelier', palette: { primary: '#54364f', secondary: '#dfa84e' }, tags: ['classic'], attachmentPoints: ['left-foot', 'right-foot'] },
  { id: 'oxford-loafers', name: 'Polished Oxford loafers', slot: 'shoes', cut: 'loafers', price: 172, quality: 90, unlockLevel: 4, setId: 'midnight-rush', palette: { primary: '#3b2d2a', secondary: '#b89052' }, tags: ['tailored', 'leather'], attachmentPoints: ['left-foot', 'right-foot'] },
  { id: 'ribbon-flats', name: 'Rose ribbon flats', slot: 'shoes', cut: 'flats', price: 126, quality: 86, unlockLevel: 3, setId: 'sunday-social', palette: { primary: '#a95f70', secondary: '#efd1bd' }, tags: ['romantic', 'soft'], attachmentPoints: ['left-foot', 'right-foot'] },
  { id: 'ochre-clogs', name: 'Ochre kitchen clogs', slot: 'shoes', cut: 'clogs', price: 82, quality: 81, unlockLevel: 2, palette: { primary: '#b87a3c', secondary: '#4d5b4b' }, tags: ['workwear', 'practical'], attachmentPoints: ['left-foot', 'right-foot'] },

  { id: 'garden-scarf', name: 'Garden silk scarf', slot: 'accessory', cut: 'scarf', pattern: 'floral', price: 34, quality: 75, unlockLevel: 1, setId: 'garden-market', palette: { primary: '#d08d8c', secondary: '#f4d47b' }, tags: ['handmade', 'bright'], attachmentPoints: ['neck'] },
  { id: 'brass-brooch', name: 'Brass sunburst brooch', slot: 'accessory', cut: 'brooch', price: 72, quality: 82, unlockLevel: 2, palette: { primary: '#c89745', secondary: '#f1d796' }, tags: ['jewelry', 'vintage'], attachmentPoints: ['chest'] },
  { id: 'berry-beret', name: 'Berry wool beret', slot: 'accessory', cut: 'beret', price: 92, quality: 84, unlockLevel: 3, palette: { primary: '#813f55', secondary: '#df9b9c' }, tags: ['millinery', 'playful'], attachmentPoints: ['head'] },
  { id: 'leather-satchel', name: 'Chestnut mini satchel', slot: 'accessory', cut: 'satchel', price: 158, quality: 89, unlockLevel: 4, palette: { primary: '#704534', secondary: '#d2a15e' }, tags: ['leather', 'utility'], attachmentPoints: ['shoulder'] },
]

const CATALOG_COLORWAYS = Object.freeze([
  { id: 'ink', label: 'Ink', primary: '#30333d', secondary: '#c5a565', pattern: 'solid' },
  { id: 'oat', label: 'Oat', primary: '#c7af88', secondary: '#f4e6c7', pattern: 'herringbone' },
  { id: 'sage', label: 'Sage', primary: '#6f8065', secondary: '#e2c979', pattern: 'slub' },
  { id: 'berry', label: 'Berry', primary: '#82475f', secondary: '#e6b0b8', pattern: 'twill' },
  { id: 'indigo', label: 'Indigo', primary: '#465f78', secondary: '#c98d58', pattern: 'denim' },
  { id: 'coral', label: 'Coral', primary: '#bd695f', secondary: '#f0c88c', pattern: 'floral' },
  { id: 'moss', label: 'Moss', primary: '#4f6854', secondary: '#bd975f', pattern: 'check' },
  { id: 'plum', label: 'Plum', primary: '#65455f', secondary: '#e1b1c0', pattern: 'pinstripe' },
  { id: 'sky', label: 'Sky', primary: '#688da0', secondary: '#f1d9a9', pattern: 'stripe' },
  { id: 'cocoa', label: 'Cocoa', primary: '#684c42', secondary: '#d2a673', pattern: 'herringbone' },
  { id: 'butter', label: 'Butter', primary: '#d1ab56', secondary: '#fff0c5', pattern: 'cord' },
  { id: 'cream', label: 'Cream', primary: '#e8ddc6', secondary: '#8b677d', pattern: 'solid' },
])

const EXPANDED_STYLE_LIBRARY = Object.freeze([
  ['baby-tee', 'fitted baby tee', 'top', 'baby-tee', 1, ['casual', 'fitted']],
  ['raglan-tee', 'raglan sleeve tee', 'top', 'raglan-tee', 1, ['sport', 'casual']],
  ['rib-tank', 'ribbed tank', 'top', 'tank', 1, ['casual', 'layering']],
  ['canvas-shorts', 'canvas walking shorts', 'bottom', 'shorts', 1, ['utility', 'summer']],
  ['a-line-mini', 'A-line mini skirt', 'bottom', 'a-line-skirt', 1, ['daywear', 'clean']],
  ['waist-apron', 'waist apron', 'apron', 'waist-apron', 1, ['service', 'classic']],
  ['market-tote', 'market tote', 'accessory', 'tote', 1, ['utility', 'casual']],
  ['headband', 'knotted headband', 'accessory', 'headband', 1, ['casual', 'bright']],
  ['henley', 'three-button henley', 'top', 'henley', 2, ['casual', 'heritage']],
  ['polo', 'knit polo shirt', 'top', 'polo', 2, ['sport', 'classic']],
  ['camisole', 'bias camisole', 'top', 'camisole', 2, ['layering', 'soft']],
  ['wrap-blouse', 'wrap-front blouse', 'top', 'wrap-blouse', 2, ['soft', 'tailored']],
  ['pencil-skirt', 'pencil skirt', 'bottom', 'pencil-skirt', 2, ['tailored', 'office']],
  ['bermuda', 'pleated Bermuda shorts', 'bottom', 'bermuda-shorts', 2, ['tailored', 'summer']],
  ['straight-jean', 'straight-leg jeans', 'bottom', 'jeans', 2, ['denim', 'casual']],
  ['cobbler-apron', 'cobbler apron', 'apron', 'cobbler-apron', 2, ['workwear', 'coverage']],
  ['bucket-hat', 'stitched bucket hat', 'accessory', 'bucket-hat', 2, ['casual', 'millinery']],
  ['canvas-belt', 'canvas D-ring belt', 'accessory', 'belt', 2, ['utility', 'sport']],
  ['mary-jane', 'Mary Jane shoes', 'shoes', 'mary-janes', 2, ['classic', 'daywear']],
  ['espadrille', 'canvas espadrilles', 'shoes', 'espadrilles', 2, ['summer', 'casual']],
  ['halter', 'halter-neck top', 'top', 'halter', 3, ['evening', 'fitted']],
  ['peasant-blouse', 'gathered peasant blouse', 'top', 'peasant-blouse', 3, ['romantic', 'volume']],
  ['tunic', 'side-slit tunic', 'top', 'tunic', 3, ['relaxed', 'layering']],
  ['cropped-cardigan', 'cropped cardigan', 'top', 'cropped-cardigan', 3, ['knitwear', 'soft']],
  ['turtleneck', 'fine-gauge turtleneck', 'top', 'turtleneck', 3, ['minimal', 'knitwear']],
  ['circle-skirt', 'full circle skirt', 'bottom', 'circle-skirt', 3, ['vintage', 'volume']],
  ['cargo-trouser', 'utility cargo trousers', 'bottom', 'cargo-pants', 3, ['utility', 'workwear']],
  ['jogger', 'tailored joggers', 'bottom', 'joggers', 3, ['sport', 'modern']],
  ['bistro-apron', 'long bistro apron', 'apron', 'bistro-apron', 3, ['service', 'tailored']],
  ['cloche', 'felt cloche hat', 'accessory', 'cloche', 3, ['vintage', 'millinery']],
  ['bow-tie', 'self-tie bow tie', 'accessory', 'bow-tie', 3, ['occasion', 'tailored']],
  ['lace-up-boot', 'lace-up ankle boots', 'shoes', 'lace-up-boots', 3, ['heritage', 'leather']],
  ['mule', 'low-heel mules', 'shoes', 'mules', 3, ['modern', 'daywear']],
  ['bowling-shirt', 'bowling shirt', 'top', 'bowling-shirt', 4, ['retro', 'casual']],
  ['fisherman-knit', 'fisherman knit pullover', 'top', 'pullover', 4, ['knitwear', 'heritage']],
  ['hoodie', 'structured zip hoodie', 'top', 'hoodie', 4, ['sport', 'modern']],
  ['denim-trucker', 'denim trucker jacket', 'top', 'trucker-jacket', 4, ['denim', 'workwear']],
  ['wrap-skirt', 'wrap midi skirt', 'bottom', 'wrap-skirt', 4, ['daywear', 'soft']],
  ['maxi-skirt', 'paneled maxi skirt', 'bottom', 'maxi-skirt', 4, ['volume', 'occasion']],
  ['palazzo', 'fluid palazzo trousers', 'bottom', 'palazzo', 4, ['evening', 'relaxed']],
  ['crossback-apron-2', 'split-leg cross-back apron', 'apron', 'split-apron', 4, ['maker', 'utility']],
  ['silk-necktie', 'silk necktie', 'accessory', 'necktie', 4, ['tailored', 'classic']],
  ['leather-tote', 'structured leather tote', 'accessory', 'tote', 4, ['leather', 'utility']],
  ['chelsea-boot', 'Chelsea boots', 'shoes', 'chelsea-boots', 4, ['leather', 'classic']],
  ['slingback', 'low slingback pumps', 'shoes', 'slingbacks', 4, ['occasion', 'classic']],
  ['sweatshirt', 'loopback sweatshirt', 'top', 'sweatshirt', 5, ['sport', 'casual']],
  ['bomber', 'satin bomber jacket', 'top', 'bomber-jacket', 5, ['sport', 'statement']],
  ['soft-blazer', 'unstructured blazer', 'top', 'blazer', 5, ['tailored', 'relaxed']],
  ['shift-dress', 'clean shift dress', 'top', 'shift-dress', 5, ['dress', 'minimal']],
  ['paperbag-trouser', 'paperbag-waist trousers', 'bottom', 'paperbag-trouser', 5, ['modern', 'volume']],
  ['leather-skirt', 'panelled leather skirt', 'bottom', 'pencil-skirt', 5, ['leather', 'statement']],
  ['pinafore-dress', 'workwear pinafore dress', 'apron', 'pinafore-dress', 5, ['workwear', 'layering']],
  ['newsboy-cap', 'eight-panel newsboy cap', 'accessory', 'newsboy-cap', 5, ['heritage', 'millinery']],
  ['opera-glove', 'wrist-length gloves', 'accessory', 'gloves', 5, ['occasion', 'classic']],
  ['t-strap', 'T-strap heels', 'shoes', 't-strap-heels', 5, ['vintage', 'occasion']],
  ['court-trainer', 'panelled court trainers', 'shoes', 'trainers', 5, ['sport', 'modern']],
  ['silk-shell', 'silk shell top', 'top', 'shell-top', 6, ['silk', 'minimal']],
  ['western-shirt', 'pearl-snap western shirt', 'top', 'western-shirt', 6, ['heritage', 'statement']],
  ['double-blazer', 'double-breasted blazer', 'top', 'double-breasted-blazer', 6, ['tailored', 'formal']],
  ['shirt-dress', 'belted shirt dress', 'top', 'shirt-dress', 6, ['dress', 'classic']],
  ['sailor-trouser', 'high-waist sailor trousers', 'bottom', 'sailor-trouser', 6, ['heritage', 'tailored']],
  ['tiered-midi', 'tiered midi skirt', 'bottom', 'tiered-skirt', 6, ['romantic', 'volume']],
  ['studio-smock', 'artist studio smock', 'apron', 'studio-smock', 6, ['maker', 'coverage']],
  ['silk-turban', 'draped silk turban', 'accessory', 'turban', 6, ['millinery', 'statement']],
  ['frame-bag', 'structured frame bag', 'accessory', 'handbag', 6, ['classic', 'leather']],
  ['monk-shoe', 'double-monk shoes', 'shoes', 'monk-shoes', 6, ['tailored', 'leather']],
  ['platform-sandal', 'platform sandals', 'shoes', 'platform-sandals', 6, ['summer', 'statement']],
  ['corset-top', 'boned corset top', 'top', 'corset-top', 7, ['structured', 'occasion']],
  ['capelet', 'tailored capelet', 'top', 'capelet', 7, ['outerwear', 'statement']],
  ['wrap-dress', 'jersey wrap dress', 'top', 'wrap-dress', 7, ['dress', 'soft']],
  ['jumpsuit', 'utility jumpsuit', 'top', 'jumpsuit', 7, ['workwear', 'statement']],
  ['godet-skirt', 'godet-flare skirt', 'bottom', 'godet-skirt', 7, ['tailored', 'movement']],
  ['carpenter-jean', 'carpenter jeans', 'bottom', 'carpenter-jeans', 7, ['denim', 'utility']],
  ['sommelier-apron', 'sommelier apron', 'apron', 'sommelier-apron', 7, ['service', 'formal']],
  ['pillbox-hat', 'structured pillbox hat', 'accessory', 'pillbox-hat', 7, ['millinery', 'occasion']],
  ['mini-satchel', 'box mini satchel', 'accessory', 'satchel', 7, ['leather', 'classic']],
  ['ballet-flat', 'square-toe ballet flats', 'shoes', 'ballet-flats', 7, ['soft', 'daywear']],
  ['heeled-boot', 'heeled knee boots', 'shoes', 'knee-boots', 7, ['statement', 'leather']],
  ['organza-blouse', 'sheer organza blouse', 'top', 'organza-blouse', 8, ['sheer', 'occasion']],
  ['tuxedo-jacket', 'satin-lapel tuxedo jacket', 'top', 'tuxedo-jacket', 8, ['formal', 'tailored']],
  ['trench-coat', 'storm-flap trench coat', 'top', 'trench-coat', 8, ['outerwear', 'classic']],
  ['tea-dress', 'printed tea dress', 'top', 'tea-dress', 8, ['dress', 'romantic']],
  ['tuxedo-trouser', 'satin-stripe trousers', 'bottom', 'tuxedo-trouser', 8, ['formal', 'tailored']],
  ['asym-midi', 'asymmetric midi skirt', 'bottom', 'asym-skirt', 8, ['modern', 'statement']],
  ['embroidered-smock', 'embroidered work smock', 'apron', 'studio-smock', 8, ['artisan', 'ornate']],
  ['wide-brim-hat', 'wide-brim felt hat', 'accessory', 'wide-brim-hat', 8, ['millinery', 'statement']],
  ['doctor-bag', 'mini doctor bag', 'accessory', 'handbag', 8, ['leather', 'vintage']],
  ['spectator-pump', 'two-tone spectator pumps', 'shoes', 'spectator-pumps', 8, ['vintage', 'occasion']],
  ['silk-sandal', 'knotted silk sandals', 'shoes', 'silk-sandals', 8, ['occasion', 'soft']],
  ['jacquard-vest', 'jacquard evening vest', 'top', 'waistcoat', 9, ['formal', 'ornate']],
  ['peacoat', 'double-breasted peacoat', 'top', 'peacoat', 9, ['outerwear', 'heritage']],
  ['sundress', 'boned cotton sundress', 'top', 'sundress', 9, ['dress', 'summer']],
  ['mermaid-skirt', 'mermaid evening skirt', 'bottom', 'mermaid-skirt', 9, ['occasion', 'dramatic']],
  ['jodhpur', 'tailored jodhpurs', 'bottom', 'jodhpurs', 9, ['heritage', 'structured']],
  ['leather-apron', 'full leather maker apron', 'apron', 'leather-apron', 9, ['maker', 'leather']],
  ['fascinator', 'feathered fascinator', 'accessory', 'fascinator', 9, ['millinery', 'occasion']],
  ['evening-clutch', 'pleated evening clutch', 'accessory', 'clutch', 9, ['occasion', 'soft']],
  ['wingtip', 'brogued wingtip shoes', 'shoes', 'wingtip-shoes', 9, ['heritage', 'leather']],
  ['velvet-pump', 'velvet evening pumps', 'shoes', 'velvet-pumps', 9, ['occasion', 'ornate']],
  ['brocade-coat', 'brocade opera coat', 'top', 'opera-coat', 10, ['outerwear', 'ornate']],
  ['draped-gown', 'draped column gown', 'top', 'column-gown', 10, ['dress', 'formal']],
  ['tailcoat', 'formal evening tailcoat', 'top', 'tailcoat', 10, ['formal', 'tailored']],
  ['bustle-skirt', 'soft bustle skirt', 'bottom', 'bustle-skirt', 10, ['historical', 'volume']],
  ['silk-palazzo', 'pleated silk palazzo trousers', 'bottom', 'palazzo', 10, ['silk', 'evening']],
  ['couture-apron', 'couture presentation apron', 'apron', 'couture-apron', 10, ['artisan', 'formal']],
  ['beaded-collar', 'beaded detachable collar', 'accessory', 'collar', 10, ['jewelry', 'ornate']],
  ['top-handle-bag', 'top-handle atelier bag', 'accessory', 'handbag', 10, ['leather', 'formal']],
  ['opera-pump', 'opera pumps', 'shoes', 'opera-pumps', 10, ['formal', 'classic']],
  ['embroidered-boot', 'embroidered ankle boots', 'shoes', 'embroidered-boots', 10, ['artisan', 'statement']],
  ['architect-coat', 'architectural wool coat', 'top', 'architect-coat', 11, ['outerwear', 'editorial']],
  ['bias-gown', 'bias-cut silk gown', 'top', 'bias-gown', 11, ['dress', 'formal']],
  ['tapestry-jacket', 'tapestry cropped jacket', 'top', 'tapestry-jacket', 11, ['ornate', 'editorial']],
  ['origami-skirt', 'origami fold skirt', 'bottom', 'origami-skirt', 11, ['editorial', 'structured']],
  ['cavalry-trouser', 'cavalry stripe trousers', 'bottom', 'cavalry-trouser', 11, ['formal', 'heritage']],
  ['atelier-cape', 'full atelier cape', 'apron', 'atelier-cape', 11, ['artisan', 'dramatic']],
  ['veiled-beret', 'veiled couture beret', 'accessory', 'veiled-beret', 11, ['millinery', 'formal']],
  ['minaudiere', 'beaded minaudière', 'accessory', 'clutch', 11, ['jewelry', 'formal']],
  ['sculpted-heel', 'sculpted heel pumps', 'shoes', 'sculpted-heels', 11, ['editorial', 'occasion']],
  ['tall-riding-boot', 'hand-finished riding boots', 'shoes', 'riding-boots', 11, ['heritage', 'leather']],
  ['runway-coat', 'runway cocoon coat', 'top', 'runway-coat', 12, ['outerwear', 'couture']],
  ['panelled-gown', 'panelled couture gown', 'top', 'couture-gown', 12, ['dress', 'couture']],
  ['hand-tailored-suit', 'hand-tailored suit jacket', 'top', 'bespoke-jacket', 12, ['tailored', 'couture']],
  ['couture-trouser', 'bespoke pleated trousers', 'bottom', 'bespoke-trouser', 12, ['tailored', 'couture']],
  ['petal-skirt', 'layered petal skirt', 'bottom', 'petal-skirt', 12, ['couture', 'dramatic']],
  ['master-apron', 'master tailor apron', 'apron', 'master-apron', 12, ['artisan', 'masterwork']],
  ['silk-flower-hat', 'silk-flower picture hat', 'accessory', 'picture-hat', 12, ['millinery', 'couture']],
  ['jewel-box-bag', 'jewel-box evening bag', 'accessory', 'box-bag', 12, ['jewelry', 'couture']],
  ['handwelted-oxford', 'hand-welted Oxfords', 'shoes', 'bespoke-oxfords', 12, ['leather', 'masterwork']],
  ['ribbon-evening-shoe', 'ribbon-laced evening shoes', 'shoes', 'ribbon-heels', 12, ['couture', 'occasion']],
  ...SPECIALTY_STYLES,
  ['puffer-jacket', 'quilted puffer jacket', 'top', 'puffer-jacket', 6, ['outerwear', 'sport']],
  ['leggings', 'high-waist jersey leggings', 'bottom', 'leggings', 4, ['sport', 'layering']],
])

const ATTACHMENT_POINTS = Object.freeze({
  top: ['torso', 'left-arm', 'right-arm'], bottom: ['hips', 'left-leg', 'right-leg'],
  apron: ['chest', 'waist'], shoes: ['left-foot', 'right-foot'], accessory: ['neck'],
})

const EXPANDED_GARMENTS = EXPANDED_STYLE_LIBRARY.flatMap((style, styleIndex) => {
  const [id, name, slot, cut, unlockLevel, tags] = style
  const material = SPECIALTY_MATERIALS[id]
  const tones = [...(SPECIALTY_COLORWAYS[id] || [CATALOG_COLORWAYS[styleIndex % CATALOG_COLORWAYS.length], CATALOG_COLORWAYS[(styleIndex * 5 + 3) % CATALOG_COLORWAYS.length]]), ...(SPECIALTY_EXTRA_COLORWAYS[id] || [])]
  return tones.map((tone, variantIndex) => ({
    id: `${id}-${tone.id}`,
    name: `${tone.label} ${name}`,
    slot,
    cut,
    // These paintings already contain their grain, pile, satin or woven motif.
    // A generic check/stripe overlay would obscure the actual material.
    pattern: material ? 'solid' : ({ sweatshirt:'jersey', 'puffer-jacket':'solid', leggings:'jersey' }[id] || tone.pattern),
    ...(material ? { material } : {}),
    price: 24 + unlockLevel * 22 + (styleIndex % 9) * 5 + variantIndex * 13,
    quality: Math.min(99, 64 + unlockLevel * 3 + (styleIndex % 5)),
    unlockLevel,
    collection: tags[0],
    palette: { primary: tone.primary, secondary: tone.secondary },
    tags,
    attachmentPoints: ATTACHMENT_POINTS[slot],
  }))
})

export const FASHION_CATALOG_GARMENTS = freezeList([...SIGNATURE_GARMENTS, ...EXPANDED_GARMENTS, ...PAINTED_CAPSULE_GARMENTS])

const SIGNATURE_SCHEMATICS = [
  { id: 'service-apron', name: 'Service apron', slot: 'apron', cut: 'service-apron', difficulty: 1, unlockLevel: 1, materialUnits: 1, baseValue: 18, silhouette: 'apron', note: 'Forgiving curves and a generous hem.' },
  { id: 'boxy-tee', name: 'Boxy work tee', slot: 'top', cut: 'tee', difficulty: 1, unlockLevel: 1, materialUnits: 1, baseValue: 22, silhouette: 'top', note: 'Two clean shoulder seams.' },
  { id: 'gathered-skirt', name: 'Gathered café skirt', slot: 'bottom', cut: 'skirt', difficulty: 1, unlockLevel: 1, materialUnits: 1, baseValue: 24, silhouette: 'skirt', note: 'Even gathers reward steady feeding.' },
  { id: 'neck-scarf', name: 'Fringed neck scarf', slot: 'accessory', cut: 'scarf', difficulty: 1, unlockLevel: 1, materialUnits: 1, baseValue: 16, silhouette: 'scarf', note: 'Turn the long edges and secure the fringed ends.' },
  { id: 'camp-shirt', name: 'Camp-collar shirt', slot: 'top', cut: 'camp-shirt', difficulty: 2, unlockLevel: 2, materialUnits: 2, baseValue: 40, silhouette: 'top', note: 'A notched collar and matched front.' },
  { id: 'pleated-skirt', name: 'Knife-pleat skirt', slot: 'bottom', cut: 'pleated-skirt', difficulty: 2, unlockLevel: 2, materialUnits: 2, baseValue: 44, silhouette: 'skirt', note: 'Careful marks keep the pleats rhythmic.' },
  { id: 'work-culottes', name: 'Work culottes', slot: 'bottom', cut: 'culottes', difficulty: 2, unlockLevel: 2, materialUnits: 2, baseValue: 46, silhouette: 'trouser', note: 'Roomy legs with a crisp waistband.' },
  { id: 'crossback-apron', name: 'Cross-back apron', slot: 'apron', cut: 'crossback-apron', difficulty: 2, unlockLevel: 2, materialUnits: 2, baseValue: 42, silhouette: 'apron', note: 'Long straps make cutting efficiency matter.' },
  { id: 'chore-jacket', name: 'Chore jacket', slot: 'top', cut: 'chore-jacket', difficulty: 3, unlockLevel: 3, materialUnits: 3, baseValue: 66, silhouette: 'jacket', note: 'A collar, cuffs, and three useful pockets.' },
  { id: 'oxford-shirt', name: 'Oxford shirt', slot: 'top', cut: 'oxford-shirt', difficulty: 3, unlockLevel: 3, materialUnits: 2, baseValue: 62, silhouette: 'top', note: 'The placket exposes every wandering stitch.' },
  { id: 'wide-leg-trouser', name: 'Wide-leg trousers', slot: 'bottom', cut: 'wide-leg', difficulty: 3, unlockLevel: 3, materialUnits: 3, baseValue: 70, silhouette: 'trouser', note: 'Long seams and a shaped waistband.' },
  { id: 'pinafore', name: 'Linen pinafore', slot: 'apron', cut: 'pinafore', difficulty: 3, unlockLevel: 3, materialUnits: 2, baseValue: 58, silhouette: 'apron', note: 'A soft drape with fitted shoulder straps.' },
  { id: 'cardigan', name: 'Cable cardigan', slot: 'top', cut: 'cardigan', difficulty: 4, unlockLevel: 4, materialUnits: 3, baseValue: 86, silhouette: 'jacket', note: 'Stretch cloth demands patient seams.' },
  { id: 'bias-midi', name: 'Bias-cut midi skirt', slot: 'bottom', cut: 'bias-skirt', difficulty: 4, unlockLevel: 4, materialUnits: 3, baseValue: 88, silhouette: 'skirt', note: 'Cut on the bias without stretching the edge.' },
  { id: 'waistcoat', name: 'Tailored waistcoat', slot: 'top', cut: 'waistcoat', difficulty: 4, unlockLevel: 4, materialUnits: 2, baseValue: 92, silhouette: 'vest', note: 'Sharp points and balanced button spacing.' },
  { id: 'leather-loafer', name: 'Leather loafers', slot: 'shoes', cut: 'loafers', difficulty: 4, unlockLevel: 4, materialUnits: 2, baseValue: 96, silhouette: 'shoe', note: 'Paired pieces must finish as twins.' },
  { id: 'cocoon-coat', name: 'Cocoon coat', slot: 'top', cut: 'coat', difficulty: 5, unlockLevel: 5, materialUnits: 4, baseValue: 126, silhouette: 'coat', note: 'A statement curve with hidden structure.' },
  { id: 'embroidered-apron', name: 'Atelier apron', slot: 'apron', cut: 'bib-apron', difficulty: 5, unlockLevel: 5, materialUnits: 3, baseValue: 112, silhouette: 'apron', note: 'Fine finishing carries most of the value.' },
]

const EXPANDED_PATTERN_LIBRARY = Object.freeze(EXPANDED_STYLE_LIBRARY
  .filter((style, index) => style[2] !== 'accessory' || index % 5 === 0)
  .filter((style, index) => index % 2 === 0 || style[4] >= 6 || style[0] === 'leggings')
  .map((style, index) => {
    const [id, name, slot, cut, unlockLevel, tags] = style
    const silhouette = slot === 'bottom'
      ? (cut.includes('skirt') ? 'skirt' : 'trouser')
      : slot === 'apron'
        ? 'apron'
        : slot === 'shoes'
          ? 'shoe'
          : slot === 'accessory'
            ? 'scarf'
            : (cut.includes('coat') || cut.includes('jacket') || cut.includes('blazer') || cut.includes('cape') ? 'jacket' : 'top')
    const difficulty = Math.max(1, Math.min(5, Math.ceil(unlockLevel / 2)))
    return Object.freeze({
      id: `pattern-${id}`,
      name: name.replace(/\b\w/g, (letter) => letter.toUpperCase()),
      slot,
      cut,
      tags,
      material:SPECIALTY_MATERIALS[id],
      difficulty,
      unlockLevel,
      materialUnits: Math.max(1, Math.min(4, Math.ceil((difficulty + (['top', 'bottom'].includes(slot) ? 1 : 0)) / 2))),
      baseValue: 18 + unlockLevel * 13 + (index % 7) * 3,
      silhouette,
      note: `${tagsForPattern(cut)} Pattern release ${unlockLevel} of 12.`,
    })
  }))

function tagsForPattern(cut) {
  if (cut.includes('coat') || cut.includes('jacket')) return 'Structured seams and careful easing.'
  if (cut.includes('skirt') || cut.includes('dress') || cut.includes('gown')) return 'Grain placement controls the final drape.'
  if (cut.includes('trouser') || cut.includes('jean') || cut.includes('pant')) return 'Matched legs reward accurate cutting.'
  if (cut.includes('shoe') || cut.includes('boot') || cut.includes('pump')) return 'Mirrored pieces must finish as a balanced pair.'
  return 'Construction marks must stay aligned through the seam.'
}

const originalPatterns = [...SIGNATURE_SCHEMATICS, ...EXPANDED_PATTERN_LIBRARY]
const recipeKey = (item) => `${item.cut}:${item.material?.family || (item.tags?.includes('leather') ? 'leather' : '')}`
const represented = new Set(originalPatterns.map(recipeKey))
// Every catalogue construction/material variant has a pattern, not just every
// second style. Colours remain design choices rather than duplicated recipes.
const cataloguePatterns = FASHION_CATALOG_GARMENTS.flatMap((item) => {
  const key = recipeKey(item)
  if (represented.has(key)) return []
  represented.add(key)
  const family = fashionFamily(item)
  const difficulty = Math.max(1, Math.min(5, Math.ceil((item.unlockLevel || 1) / 2)))
  return [{ id:`make-${item.id}`, name:item.name.replace(/^\S+\s+/, ''),
    slot:item.slot, cut:item.cut, artworkId:item.id, tags:item.tags, material:item.material,
    unlockLevel:item.unlockLevel || 1, difficulty,
    materialUnits:['coat','dress','jumpsuit'].includes(family) ? 3 : ['neckwear','millinery','ornament','waist-apron'].includes(family) ? 1 : 2,
    baseValue:Math.round(item.price*.55), silhouette:family, note:'Use the catalogue construction, with your own cloth, accent and placed details.' }]
})
export const FASHION_SCHEMATICS = freezeList([...originalPatterns, ...cataloguePatterns].map((pattern) => {
  const template = FASHION_CATALOG_GARMENTS.find(item => item.id === pattern.artworkId)
    || FASHION_CATALOG_GARMENTS.find(item => recipeKey(item) === recipeKey(pattern))
    || FASHION_CATALOG_GARMENTS.find(item => item.cut === pattern.cut)
  const resolved={...template,...pattern, tags:pattern.tags || template?.tags || [], material:pattern.material || template?.material}
  return {...pattern, name:pattern.name[0].toUpperCase()+pattern.name.slice(1), artworkId:template?.id, tags:resolved.tags, material:resolved.material,
    note:fashionConstructionBrief(resolved),
    unlockLevel:Math.max(pattern.unlockLevel,earliestFashionMaterialLevel(resolved)), silhouette:fashionFamily(resolved)}
}))

export const FASHION_FABRICS = freezeList([
  { id: 'gingham', label: 'Tomato gingham', fiber: 'Cotton', cost: 8, quality: 62, unlockLevel: 1, stock: 3, color: '#c65643', patternKey: 'check', pattern: 'linear-gradient(90deg, transparent 45%, rgba(255,255,255,.48) 45% 58%, transparent 58%), linear-gradient(transparent 45%, rgba(255,255,255,.48) 45% 58%, transparent 58%)' },
  { id: 'denim', label: 'Garden denim', fiber: 'Cotton denim', cost: 14, quality: 78, unlockLevel: 1, stock: 2, color: '#496e78', patternKey: 'denim', pattern: 'repeating-linear-gradient(135deg, transparent 0 4px, rgba(255,255,255,.12) 4px 6px)' },
  { id: 'plum', label: 'Plum twill', fiber: 'Cotton twill', cost: 22, quality: 92, unlockLevel: 1, stock: 1, color: '#76506f', patternKey: 'twill', pattern: 'repeating-linear-gradient(45deg, transparent 0 6px, rgba(255,255,255,.13) 6px 8px)' },
  { id: 'sage-linen', label: 'Washed sage linen', fiber: 'Linen', cost: 18, quality: 81, unlockLevel: 2, stock: 2, color: '#75866b', patternKey: 'slub', pattern: 'repeating-linear-gradient(3deg, transparent 0 7px, rgba(255,255,255,.13) 7px 8px)' },
  { id: 'indigo-chambray', label: 'Indigo chambray', fiber: 'Chambray', cost: 20, quality: 84, unlockLevel: 2, stock: 2, color: '#566f8a', patternKey: 'weave', pattern: 'repeating-linear-gradient(90deg, transparent 0 3px, rgba(255,255,255,.1) 3px 4px)' },
  { id: 'butter-cord', label: 'Butter needlecord', fiber: 'Corduroy', cost: 26, quality: 86, unlockLevel: 3, stock: 2, color: '#caa85a', patternKey: 'cord', pattern: 'repeating-linear-gradient(90deg, rgba(255,255,255,.04) 0 5px, rgba(74,47,25,.12) 5px 7px)' },
  { id: 'rose-crepe', label: 'Dusty rose crêpe', fiber: 'Viscose crêpe', cost: 30, quality: 88, unlockLevel: 3, stock: 1, color: '#b96f78', patternKey: 'solid', pattern: 'radial-gradient(circle at 30% 40%, rgba(255,255,255,.12) 0 1px, transparent 2px)' },
  { id: 'navy-wool', label: 'Midnight suiting', fiber: 'Wool blend', cost: 38, quality: 93, unlockLevel: 4, stock: 1, color: '#343d52', patternKey: 'pinstripe', pattern: 'repeating-linear-gradient(90deg, transparent 0 10px, rgba(220,211,180,.22) 10px 11px)' },
  { id: 'floral-silk', label: 'Orchard silk', fiber: 'Silk', cost: 42, quality: 95, unlockLevel: 4, stock: 1, color: '#8e5c70', patternKey: 'floral', pattern: 'radial-gradient(circle at 25% 30%, #e9bd86 0 3px, transparent 4px), radial-gradient(circle at 72% 68%, #d88778 0 3px, transparent 4px)' },
  { id: 'cocoa-herringbone', label: 'Cocoa herringbone', fiber: 'Wool', cost: 54, quality: 97, unlockLevel: 5, stock: 1, color: '#6a4b3e', patternKey: 'herringbone', pattern: 'repeating-linear-gradient(45deg, transparent 0 7px, rgba(242,220,183,.14) 7px 9px), repeating-linear-gradient(-45deg, transparent 0 7px, rgba(28,18,15,.13) 7px 9px)' },
  { id: 'cream-poplin', label: 'Cream shirting poplin', fiber: 'Cotton poplin', cost: 24, quality: 84, unlockLevel: 2, stock: 2, color: '#e7dcc5', patternKey: 'weave', pattern: 'repeating-linear-gradient(90deg, transparent 0 3px, rgba(104,84,68,.08) 3px 4px)' },
  { id: 'rust-canvas', label: 'Rust utility canvas', fiber: 'Cotton canvas', cost: 27, quality: 85, unlockLevel: 3, stock: 2, color: '#a65f43', patternKey: 'weave', pattern: 'repeating-linear-gradient(45deg, transparent 0 4px, rgba(255,255,255,.08) 4px 5px)' },
  { id: 'ink-jersey', label: 'Ink loopback jersey', fiber: 'Cotton jersey', cost: 29, quality: 86, unlockLevel: 3, stock: 2, color: '#343944', patternKey: 'jersey', pattern: 'repeating-radial-gradient(ellipse at 50% 50%, rgba(255,255,255,.07) 0 1px, transparent 1px 4px)' },
  { id: 'moss-tartan', label: 'Moss windowpane wool', fiber: 'Wool blend', cost: 36, quality: 89, unlockLevel: 4, stock: 1, color: '#4f6652', patternKey: 'check', pattern: 'linear-gradient(90deg, transparent 47%, rgba(222,186,113,.35) 48% 52%, transparent 53%), linear-gradient(transparent 47%, rgba(222,186,113,.28) 48% 52%, transparent 53%)' },
  { id: 'coral-rayon', label: 'Coral printed rayon', fiber: 'Rayon', cost: 34, quality: 87, unlockLevel: 4, stock: 1, color: '#b96561', patternKey: 'floral', pattern: 'radial-gradient(circle at 24% 30%, #f1ce8b 0 3px, transparent 4px), radial-gradient(circle at 68% 74%, #6e7d5b 0 3px, transparent 4px)' },
  { id: 'oat-tweed', label: 'Oat basket-weave tweed', fiber: 'Wool tweed', cost: 44, quality: 92, unlockLevel: 5, stock: 1, color: '#aa9272', patternKey: 'tweed', pattern: 'repeating-linear-gradient(45deg, rgba(255,255,255,.11) 0 3px, rgba(60,42,35,.09) 3px 6px)' },
  { id: 'berry-velvet', label: 'Berry cotton velvet', fiber: 'Cotton velvet', cost: 49, quality: 94, unlockLevel: 6, stock: 1, color: '#6f3d55', patternKey: 'velvet', pattern: 'linear-gradient(100deg, rgba(255,255,255,.16), transparent 38%, rgba(28,17,24,.18))' },
  { id: 'chestnut-leather', label: 'Chestnut vegetable-tanned hide', fiber: 'Full-grain leather', cost: 58, quality: 94, unlockLevel: 6, stock: 1, color: '#704735', patternKey: 'leather', pattern: 'radial-gradient(ellipse at 30% 25%, rgba(255,220,175,.16), transparent 42%), repeating-linear-gradient(8deg, transparent 0 13px, rgba(38,20,15,.07) 13px 14px)' },
  { id: 'sky-organza', label: 'Sky silk organza', fiber: 'Silk organza', cost: 52, quality: 93, unlockLevel: 7, stock: 1, color: '#7e9eac', patternKey: 'sheer', pattern: 'repeating-linear-gradient(90deg, rgba(255,255,255,.14) 0 1px, transparent 1px 5px)' },
  { id: 'moss-suede', label: 'Moss brushed suede', fiber: 'Suede leather', cost: 64, quality: 95, unlockLevel: 8, stock: 1, color: '#596450', patternKey: 'suede', pattern: 'radial-gradient(circle at 30% 40%, rgba(255,255,255,.08) 0 1px, transparent 2px)' },
  { id: 'black-satin', label: 'Black duchess satin', fiber: 'Silk satin', cost: 62, quality: 96, unlockLevel: 8, stock: 1, color: '#2d2a31', patternKey: 'satin', pattern: 'linear-gradient(115deg, rgba(255,255,255,.22), transparent 30% 62%, rgba(255,255,255,.08))' },
  { id: 'black-calfskin', label: 'Black polished calfskin', fiber: 'Calfskin leather', cost: 79, quality: 98, unlockLevel: 9, stock: 1, color: '#2c2828', patternKey: 'leather', pattern: 'linear-gradient(110deg, rgba(255,255,255,.18), transparent 30% 70%, rgba(0,0,0,.16))' },
  { id: 'gold-brocade', label: 'Antique gold brocade', fiber: 'Silk brocade', cost: 72, quality: 97, unlockLevel: 9, stock: 1, color: '#9b753b', patternKey: 'brocade', pattern: 'radial-gradient(ellipse at 30% 30%, rgba(246,218,145,.38) 0 4px, transparent 5px), radial-gradient(ellipse at 70% 70%, rgba(80,47,24,.24) 0 4px, transparent 5px)' },
  { id: 'plum-lace', label: 'Plum corded lace', fiber: 'Cotton lace', cost: 68, quality: 96, unlockLevel: 9, stock: 1, color: '#65445e', patternKey: 'lace', pattern: 'radial-gradient(circle, transparent 0 4px, rgba(255,240,224,.2) 5px 7px, transparent 8px)' },
  { id: 'ivory-taffeta', label: 'Ivory silk taffeta', fiber: 'Silk taffeta', cost: 78, quality: 98, unlockLevel: 10, stock: 1, color: '#ddd0b9', patternKey: 'satin', pattern: 'linear-gradient(120deg, rgba(255,255,255,.28), transparent 42%, rgba(75,55,49,.12))' },
  { id: 'midnight-jacquard', label: 'Midnight floral jacquard', fiber: 'Silk jacquard', cost: 86, quality: 99, unlockLevel: 11, stock: 1, color: '#292d40', patternKey: 'brocade', pattern: 'radial-gradient(ellipse at 30% 35%, rgba(145,117,159,.35) 0 5px, transparent 6px), radial-gradient(ellipse at 72% 66%, rgba(199,167,94,.25) 0 4px, transparent 5px)' },
  { id: 'atelier-cashmere', label: 'Atelier cashmere', fiber: 'Cashmere', cost: 96, quality: 100, unlockLevel: 12, stock: 1, color: '#806b65', patternKey: 'twill', pattern: 'repeating-linear-gradient(35deg, transparent 0 6px, rgba(255,255,255,.1) 6px 8px)' },
  { id:'cream-knit', label:'Cream cotton jersey', fiber:'Cotton jersey yardage', cost:12, quality:74, unlockLevel:1, stock:3, color:'#e7dcc5', patternKey:'jersey', pattern:'repeating-linear-gradient(90deg, transparent 0 3px, rgba(255,255,255,.12) 3px 4px)' },
  { id:'berry-rib-knit', label:'Berry pre-knitted rib', fiber:'Pre-knitted wool rib yardage', cost:32, quality:89, unlockLevel:3, stock:3, color:'#82475f', patternKey:'cable', pattern:'repeating-linear-gradient(90deg, transparent 0 6px, rgba(255,255,255,.12) 6px 8px)' },
  { id:'oat-millinery-felt', label:'Oat millinery felt', fiber:'Wool felt', cost:28, quality:86, unlockLevel:3, stock:2, color:'#b59a72', patternKey:'solid', pattern:'none' },
  { id:'maker-leather', label:'Cocoa footwear leather', fiber:'Supple footwear leather', cost:36, quality:86, unlockLevel:4, stock:3, color:'#684c42', patternKey:'leather', pattern:'none' },
  { id:'brass-notions', label:'Brass ornament kit', fiber:'Brass hardware and glass beads', family:'notions', cost:24, quality:83, unlockLevel:2, stock:2, color:'#c89745', patternKey:'solid', pattern:'none' },
])

export const FASHION_FINISHES = freezeList([
  { id: 'button', label: 'Brass button', glyph: '●', color: '#e0a74d', unlockLevel: 1, styleTag: 'classic' },
  { id: 'pocket', label: 'Patch pocket', glyph: '▱', color: '#f0d9b4', unlockLevel: 1, styleTag: 'utility' },
  { id: 'flower', label: 'Flower stitch', glyph: '✿', color: '#f4c5c5', unlockLevel: 1, styleTag: 'romantic' },
  { id: 'contrast-trim', label: 'Contrast binding', glyph: '⌁', color: '#f0c967', unlockLevel: 2, styleTag: 'bold' },
  { id: 'monogram', label: 'Monogram', glyph: 'M', color: '#f1e0c1', unlockLevel: 3, styleTag: 'personal' },
  { id: 'embroidery', label: 'Vine embroidery', glyph: '❧', color: '#6f9663', unlockLevel: 4, styleTag: 'artisan' },
  { id: 'pearl', label: 'Pearl button', glyph: '◉', color: '#fff5de', unlockLevel: 4, styleTag: 'occasion' },
  { id: 'piping', label: 'Tailored piping', glyph: '∿', color: '#d8a858', unlockLevel: 5, styleTag: 'tailored' },
  { id: 'lace', label: 'Lace inset', glyph: '⌇', color: '#f4e8d4', unlockLevel: 6, styleTag: 'romantic' },
  { id: 'applique', label: 'Cut-cloth appliqué', glyph: '◒', color: '#c66e62', unlockLevel: 7, styleTag: 'artisan' },
  { id: 'beading', label: 'Hand beading', glyph: '⋰', color: '#e8d4a1', unlockLevel: 8, styleTag: 'occasion' },
  { id: 'frog-closure', label: 'Frog closure', glyph: '∞', color: '#3e4f53', unlockLevel: 9, styleTag: 'heritage' },
  { id: 'hand-bound', label: 'Hand-bound edge', glyph: '≈', color: '#b98758', unlockLevel: 10, styleTag: 'couture' },
  { id: 'crystal', label: 'Crystal cluster', glyph: '✧', color: '#d9eff2', unlockLevel: 11, styleTag: 'couture' },
  { id: 'goldwork', label: 'Goldwork motif', glyph: '♢', color: '#d9a83e', unlockLevel: 12, styleTag: 'masterwork' },
])

export const FASHION_MODIFICATIONS = Object.freeze([
  { id: 'shorten-hem', label: 'Shorten hem', group: 'Fit', technique: 'Mark, trim & blind hem', unlockLevel: 1, cost: 5, risk: 2, tool: 0, slots: ['top', 'bottom', 'apron'], geometry: 'shorten', note: 'Raise the lower edge without changing its hang.' },
  { id: 'take-in', label: 'Take in side seams', group: 'Fit', technique: 'Pin, baste & resew', unlockLevel: 1, cost: 7, risk: 3, tool: 1, slots: ['top', 'bottom', 'apron'], geometry: 'narrow', note: 'A closer fit rewards symmetrical seam allowance.' },
  { id: 'patch-pocket', label: 'Add patch pockets', group: 'Utility', technique: 'Topstitch paired pockets', unlockLevel: 1, cost: 6, risk: 1, tool: 7, slots: ['top', 'bottom', 'apron'], visual: 'pockets', note: 'Useful storage with visible topstitching.' },
  { id: 'swap-buttons', label: 'Swap buttons', group: 'Hardware', technique: 'Mark & hand-sew', unlockLevel: 1, cost: 4, risk: 1, tool: 2, slots: ['top', 'apron'], visual: 'buttons', note: 'Change the rhythm and finish of the front closure.' },
  { id: 'crop-body', label: 'Crop the body', group: 'Fit', technique: 'Measure, trim & finish', unlockLevel: 2, cost: 8, risk: 4, tool: 4, slots: ['top'], geometry: 'crop', note: 'A decisive new proportion with little room for error.' },
  { id: 'taper-leg', label: 'Taper the leg', group: 'Fit', technique: 'Pin from knee to hem', unlockLevel: 2, cost: 9, risk: 4, tool: 1, slots: ['bottom'], geometry: 'taper', note: 'Shape both legs evenly from knee to ankle.' },
  { id: 'contrast-binding', label: 'Contrast binding', group: 'Trim', technique: 'Wrap & edge-stitch', unlockLevel: 2, cost: 8, risk: 2, tool: 7, slots: ['top', 'bottom', 'apron'], visual: 'binding', note: 'A crisp colored edge around the garment.' },
  { id: 'embroidered-mark', label: 'Small embroidery', group: 'Surface', technique: 'Transfer & satin stitch', unlockLevel: 2, cost: 10, risk: 2, tool: 3, slots: ['top', 'bottom', 'apron', 'accessory'], visual: 'embroidery', note: 'A placed hand-work motif that makes the piece unique.' },
  { id: 'shorten-sleeve', label: 'Shorten sleeves', group: 'Fit', technique: 'Unpick cuff & reset', unlockLevel: 3, cost: 11, risk: 4, tool: 0, slots: ['top'], geometry: 'short-sleeve', note: 'Move the cuff while preserving its original finish.' },
  { id: 'add-cuff', label: 'Add contrast cuffs', group: 'Trim', technique: 'Draft, interface & set', unlockLevel: 3, cost: 12, risk: 3, tool: 7, slots: ['top'], visual: 'cuffs', note: 'Structured cuffs add color and weight.' },
  { id: 'overdye', label: 'Over-dye garment', group: 'Color', technique: 'Prepare, dye & rinse', unlockLevel: 3, cost: 14, risk: 5, tool: 6, slots: ['top', 'bottom', 'apron', 'accessory'], visual: 'dye', note: 'Shift the entire garment toward the chosen accent.' },
  { id: 'monogram', label: 'Hand monogram', group: 'Surface', technique: 'Mark & stem stitch', unlockLevel: 3, cost: 9, risk: 1, tool: 3, slots: ['top', 'apron', 'accessory'], visual: 'monogram', note: 'A small personal mark with hand-work value.' },
  { id: 'let-out', label: 'Let out seams', group: 'Fit', technique: 'Unpick & press allowance', unlockLevel: 4, cost: 13, risk: 6, tool: 0, slots: ['top', 'bottom'], geometry: 'widen', note: 'Recover hidden seam allowance without leaving needle marks.' },
  { id: 'reshape-neckline', label: 'Reshape neckline', group: 'Fit', technique: 'Redraft & face edge', unlockLevel: 4, cost: 15, risk: 6, tool: 1, slots: ['top'], geometry: 'neckline', note: 'A new neckline changes the garment character.' },
  { id: 'brass-hardware', label: 'Add brass hardware', group: 'Hardware', technique: 'Reinforce & set hardware', unlockLevel: 4, cost: 16, risk: 3, tool: 2, slots: ['top', 'bottom', 'apron', 'accessory'], visual: 'hardware', note: 'Buckles, hooks, and rivets need reinforced anchor points.' },
  { id: 'decorative-topstitch', label: 'Decorative topstitch', group: 'Surface', technique: 'Double-needle stitch', unlockLevel: 5, cost: 12, risk: 4, tool: 5, slots: ['top', 'bottom', 'apron'], visual: 'topstitch', note: 'Parallel visible seams reward consistent feeding.' },
  { id: 'pleat-insert', label: 'Insert box pleat', group: 'Shape', technique: 'Open seam & inset panel', unlockLevel: 5, cost: 18, risk: 7, tool: 1, slots: ['bottom', 'apron'], geometry: 'flare', note: 'Adds movement and volume with a hidden inset.' },
  { id: 'lace-inset', label: 'Lace inset panel', group: 'Surface', technique: 'Baste, appliqué & trim', unlockLevel: 6, cost: 22, risk: 6, tool: 7, slots: ['top', 'bottom'], visual: 'lace', note: 'Replace a controlled panel with translucent lace.' },
  { id: 'color-block', label: 'Color-block panel', group: 'Color', technique: 'Slash, spread & piece', unlockLevel: 6, cost: 20, risk: 7, tool: 1, slots: ['top', 'bottom', 'apron'], visual: 'panel', note: 'A new fabric panel permanently changes the design.' },
  { id: 'tailored-piping', label: 'Insert tailored piping', group: 'Trim', technique: 'Sandwich & edge-stitch', unlockLevel: 7, cost: 19, risk: 5, tool: 7, slots: ['top', 'bottom', 'apron'], visual: 'piping', note: 'A narrow cord emphasizes selected seams.' },
  { id: 'hand-distress', label: 'Hand distress', group: 'Surface', technique: 'Abrade, patch & secure', unlockLevel: 7, cost: 13, risk: 7, tool: 0, slots: ['top', 'bottom'], visual: 'distress', note: 'Controlled wear with reinforced edges.' },
  { id: 'beaded-motif', label: 'Beaded motif', group: 'Surface', technique: 'Couch & knot beads', unlockLevel: 8, cost: 28, risk: 5, tool: 3, slots: ['top', 'bottom', 'accessory'], visual: 'beading', note: 'Dense handwork adds value but takes precision.' },
  { id: 'convert-collar', label: 'Convert the collar', group: 'Shape', technique: 'Remove, redraft & reset', unlockLevel: 9, cost: 30, risk: 9, tool: 0, slots: ['top'], geometry: 'collar', note: 'Rebuild the neckline and collar stand from scratch.' },
  { id: 'couture-lining', label: 'Add couture lining', group: 'Structure', technique: 'Bag lining by hand', unlockLevel: 10, cost: 38, risk: 8, tool: 5, slots: ['top', 'bottom'], visual: 'lining', note: 'A hidden full lining improves hang and appraisal.' },
  { id: 'goldwork', label: 'Goldwork embroidery', group: 'Surface', technique: 'Pad & couch metal thread', unlockLevel: 11, cost: 46, risk: 8, tool: 3, slots: ['top', 'apron', 'accessory'], visual: 'goldwork', note: 'A master technique using raised metallic thread.' },
  { id: 'bespoke-recut', label: 'Bespoke recut', group: 'Shape', technique: 'Deconstruct, redraft & rebuild', unlockLevel: 12, cost: 60, risk: 10, tool: 4, slots: ['top', 'bottom'], geometry: 'bespoke', note: 'The ultimate alteration: rebuild the silhouette around a new block.' },
].map((item) => Object.freeze({ ...item, slots: Object.freeze(item.slots.includes('top') ? [...item.slots, 'outerwear'] : item.slots) })))

function dailyRank(day, id, salt=0) {
  // Rank the complete ID, not its length: equally long names must all get a
  // turn on the discount rail instead of permanently losing stable-sort ties.
  let hash=2166136261
  for(const char of id) hash=Math.imul(hash^char.charCodeAt(0),16777619)
  let value=hash^Math.imul(day+salt,0x9e3779b1)
  value=Math.imul(value^(value>>>16),0x85ebca6b)
  value=Math.imul(value^(value>>>13),0xc2b2ae35)
  return (value^(value>>>16))>>>0
}

export function fashionUnlockLevel(reputation = 0) {
  const thresholds = [0, 24, 58, 102, 158, 226, 306, 398, 502, 618, 746, 886]
  const value = Math.max(0, Number(reputation || 0))
  return thresholds.reduce((level, threshold, index) => value >= threshold ? index + 1 : level, 1)
}

export function tailorStockForDay(day = 1, reputation = 0, atelierLevel = null) {
  const level = atelierLevel != null && Number.isFinite(Number(atelierLevel))
    ? Math.max(1, Math.min(12, Math.round(Number(atelierLevel))))
    : fashionUnlockLevel(reputation)
  const availableSchematics = FASHION_SCHEMATICS.filter((item) => item.unlockLevel <= level)
  const rotatingSchematics = [...availableSchematics]
    .sort((a, b) => dailyRank(day,a.id) - dailyRank(day,b.id))
    .slice(0, Math.min(3 + Math.floor((level - 1) / 4), availableSchematics.length))
  if (!rotatingSchematics.some((item) => item.id === 'service-apron')) {
    rotatingSchematics[rotatingSchematics.length - 1] = FASHION_SCHEMATICS[0]
  }
  const availableFabrics = FASHION_FABRICS.filter((item) => item.unlockLevel <= level)
  const selectedFabrics = [...availableFabrics]
    .sort((a, b) => dailyRank(day,a.id,13) - dailyRank(day,b.id,13))
    .slice(0, Math.min(3 + Math.floor((level - 1) / 3), availableFabrics.length))
  // A daily project must actually be makeable. One bolt of stock cannot make
  // a three-bolt coat, and a loom-woven cotton is not stretch-jersey yardage.
  for (const pattern of rotatingSchematics) {
    if (!selectedFabrics.some(fabric => compatibleFashionFabric(pattern, fabric))) {
      const matching = availableFabrics.find(fabric => compatibleFashionFabric(pattern, fabric))
      if (matching && !selectedFabrics.some(fabric=>fabric.id===matching.id)) selectedFabrics.push(matching)
    }
  }
  // The rotating shelf offers limited discounted cuts, not exclusive access.
  // Every unlocked recipe always has its compatible standard-price supply.
  const featuredIds = new Set(selectedFabrics.map(item=>item.id))
  const fabricStock = availableFabrics.map(item => Object.freeze({...item, featured:featuredIds.has(item.id),
    stock:featuredIds.has(item.id) ? Math.max(item.stock,
      ...rotatingSchematics.filter(pattern=>compatibleFashionFabric(pattern,item)).map(pattern=>pattern.materialUnits)) : 0}))
  return Object.freeze({ day, level, schematics: Object.freeze(rotatingSchematics), fabrics: Object.freeze(fabricStock) })
}

export function boutiqueCatalogForDay(day = 1, reputation = 0, atelierLevel = null) {
  const level = atelierLevel != null && Number.isFinite(Number(atelierLevel))
    ? Math.max(1, Math.min(12, Math.round(Number(atelierLevel))))
    : fashionUnlockLevel(reputation)
  const unlocked = FASHION_CATALOG_GARMENTS.filter((item) => item.unlockLevel <= level)
  const dailyIds = new Set([...unlocked]
    .sort((a, b) => dailyRank(day,a.id,29) - dailyRank(day,b.id,29))
    .slice(0, Math.min(6 + Math.floor(level / 2), unlocked.length))
    .map((item) => item.id))
  return Object.freeze(FASHION_CATALOG_GARMENTS.map((item) => Object.freeze({
    ...item,
    locked: item.unlockLevel > level,
    featured: dailyIds.has(item.id),
    retailPrice: item.price,
    price: dailyIds.has(item.id) ? Math.round(item.price*.9) : item.price,
    availableToday: item.unlockLevel <= level,
  })))
}

export function activeFashionSets(garments = []) {
  const ids = new Set(garments.filter(Boolean).map((item) => typeof item === 'string' ? item : item.setPieceId || item.id))
  return Object.values(FASHION_SETS).map((set) => {
    const count = set.pieces.filter((id) => ids.has(id)).length
    return Object.freeze({ ...set, count, active: count >= 2, complete: count === set.pieces.length })
  }).filter((set) => set.count > 0)
}

export function schematicById(id) {
  return FASHION_SCHEMATICS.find((item) => item.id === id) || FASHION_SCHEMATICS[0]
}

export function fabricById(id) {
  return FASHION_FABRICS.find((item) => item.id === id) || null
}
