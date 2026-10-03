import { garmentEquipmentSlot } from '../garment-slots.js'

const ROOT = '/assets/characters-v3/modular-v4/source'
const painting = (key, options) => Object.freeze({ family: `premium-${key}`,
  src: `${ROOT}/catalogue-premium-${key}-v1.png`, transform: '',
  referenceLuminance: .81, cleanAlpha: true, ...options })

export const SPECIALTY_PAINTINGS = Object.freeze({
  'leather-biker': painting('leather-biker', {
    fit:[[0,170,.66,170],[259,315,.66,315],[400,365,.66,365],[850,690,.64,690],[1100,790,.58,735],[1225,845,.58,805],[1536,1015,.58,980]],
    thumbnailBox:'0 245 1024 1015', coversArms:true, tucksWaist:true, cropped:true,
    neutralTrim:'M290 425a12 12 0 1 0 24 0a12 12 0 1 0-24 0ZM717 425a12 12 0 1 0 24 0a12 12 0 1 0-24 0ZM303 516a12 12 0 1 0 24 0a12 12 0 1 0-24 0ZM719 511a12 12 0 1 0 24 0a12 12 0 1 0-24 0ZM293 539Q489 716 474 836L404 1107L391 1103L461 833Q477 724 286 548ZM548 786L556 785L635 1119L618 1122ZM322 809L336 814L277 979L263 973ZM698 811L711 807L761 975L748 980Z',
  }),
  'suede-jacket': painting('suede-jacket', {
    fit:[[0,175,.65,175],[247,310,.65,310],[400,365,.65,365],[850,690,.64,690],[1135,800,.58,750],[1248,845,.58,805],[1536,990,.58,960]],
    thumbnailBox:'0 235 1024 1030', coversArms:true, tucksWaist:true, cropped:true,
    // The collar's back band belongs behind the neck, not painted across it.
    visibleContour:'M0 0H410V305Q512 298 614 305V0H1024V1536H0Z',
  }),
  'leather-trouser': painting('leather-trouser', {
    fit:[[0,585,.92],[185,690,.92],[440,875,.85],[850,1090,.8],[1356,1325,.79],[1536,1410,.79]],
    thumbnailBox:'225 170 575 1210', coversLegs:true,
  }),
  'leather-skirt': painting('leather-skirt', {
    fit:[[0,550,.87],[262,690,.87],[480,800,.8],[900,980,.73],[1256,1100,.75],[1536,1200,.75]],
    thumbnailBox:'190 245 645 1030',
  }),
  'tuxedo-jacket': painting('tuxedo-jacket', {
    fit:[[0,180,.64,180],[262,315,.64,315],[410,365,.64,365],[906,690,.64,690],[1180,805,.58,795],[1228,835,.58,810],[1536,995,.58,970]],
    thumbnailBox:'0 245 1024 1005', coversArms:true, tucksWaist:true,
  }),
  'tuxedo-trouser': painting('tuxedo-trouser', {
    fit:[[0,595,.92],[168,690,.92],[450,875,.84],[930,1130,.8],[1375,1325,.79],[1536,1400,.79]],
    thumbnailBox:'230 150 575 1250', coversLegs:true,
  }),
  'velvet-camisole': painting('velvet-camisole', {
    fit:[[0,185,.66],[288,335,.66],[490,415,.66],[700,540,.74],[950,690,.82],[1210,800,.68],[1536,935,.68]],
    thumbnailBox:'180 270 665 970',
  }),
  'brocade-coat': painting('brocade-coat', {
    fit:[[0,230,.7,230],[132,300,.7,300],[260,365,.7,365],[700,690,.7,690],[940,865,.64,805],[1438,1160,.67,1160],[1536,1220,.67,1220]],
    thumbnailBox:'45 110 940 1360', coversArms:true, tucksWaist:true,
    visibleContour:'M0 0H464V151Q512 166 555 151V0H1024V1536H0Z',
  }),
  'leather-tote': painting('leather-tote', {
    transform:'translate(622 678) scale(.25)', thumbnailBox:'90 310 875 950',
    neutralTrim:'M286 632Q273 656 292 694L301 686Q286 659 298 636ZM350 638Q376 664 348 699L343 687Q357 661 348 646ZM577 658Q561 692 583 714L591 706Q574 690 588 663ZM648 658Q677 688 651 716L643 707Q662 687 642 666Z',
  }),
  'velvet-pumps': painting('velvet-pumps', {
    thumbnailBox:'65 905 895 470',
    neutralTrim:'M145 1220Q180 1173 229 1200Q261 1239 221 1280Q174 1300 145 1250ZM783 1200Q828 1173 881 1220L881 1250Q855 1300 810 1280Q770 1239 783 1200ZM80 1335Q280 1325 397 1275L399 1286Q282 1341 89 1356ZM548 1275Q733 1325 948 1335L938 1356Q732 1341 548 1286Z',
    parts:[
      {key:'left',clip:[0,850,512,686],transform:'translate(218 977) scale(.48 .32)',clearOpening:true,
        skinOpening:'M416 946Q445 946 453 980Q428 1117 361 1198Q300 1220 189 1193Q289 1110 365 1014Z',
        textureBox:[175,930,295,295],sampleBox:[375,1180,35,70]},
      {key:'right',clip:[512,850,512,686],transform:'translate(314 977) scale(.48 .32)',clearOpening:true,
        skinOpening:'M609 946Q580 946 572 980Q597 1117 664 1198Q725 1220 836 1193Q736 1110 660 1014Z',
        textureBox:[554,930,295,295],sampleBox:[608,1180,35,70]},
    ],
  }),
})

const cuts = {
  'leather-biker-jacket':['outerwear','leather-biker'],
  'suede-jacket':['outerwear','suede-jacket'],
  'leather-trouser':['bottom','leather-trouser'],
  'tuxedo-jacket':['outerwear','tuxedo-jacket'],
  'tuxedo-trouser':['bottom','tuxedo-trouser'],
  'velvet-camisole':['top','velvet-camisole'],
  'opera-coat':['outerwear','brocade-coat'],
  'velvet-pumps':['shoes','velvet-pumps'],
}

export function specialtyGarmentAsset(garment = {}) {
  const slot = garmentEquipmentSlot(garment)
  const materialText = [garment.material?.family, garment.material?.name, garment.pattern,
    garment.customization?.fabric?.fiber, ...(garment.tags || [])].filter(Boolean).join(' ').toLowerCase()
  const leather = /\bleather\b|\blambskin\b/.test(materialText)
  const entry = cuts[garment.cut]
  if (entry && entry[0] === slot) return SPECIALTY_PAINTINGS[entry[1]] || null
  // Same construction cut, different material: do not turn every cloth pencil
  // skirt into leather just because one material-specific painting exists.
  if (slot === 'bottom' && garment.cut === 'pencil-skirt' &&
    (leather || /^leather-skirt-/.test(garment.id || '') || /^leather-skirt-/.test(garment.customization?.baseGarmentId || ''))) return SPECIALTY_PAINTINGS['leather-skirt']
  if (slot === 'accessory' && garment.cut === 'tote' &&
    (leather || /^leather-tote-/.test(garment.id || '') || /^leather-tote-/.test(garment.customization?.baseGarmentId || ''))) return SPECIALTY_PAINTINGS['leather-tote']
  return null
}
