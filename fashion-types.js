import { garmentEquipmentSlot } from './garment-slots.js'

// Construction families describe jobs, not equipment layers. A cardigan still
// equips over a shirt, while its joins behave like cut-and-sew knitwear.
export function fashionFamily(item = {}) {
  const cut = String(item.cut || '')
  const text = `${cut} ${item.material?.family || ''} ${(item.tags || []).join(' ')}`
  const slot = garmentEquipmentSlot(item)
  if (slot === 'shoes') return 'footwear'
  if (slot === 'accessory') {
    if (/brooch|beaded|collar|minaudiere|box-bag/.test(cut)) return 'ornament'
    if (/hat|beret|cloche|newsboy|turban|headband|fascinator/.test(cut)) return 'millinery'
    if (/bag|tote|satchel|clutch/.test(cut)) return 'bag'
    if (/glove/.test(cut)) return 'gloves'
    return 'neckwear'
  }
  if (slot === 'apron') return /waist|bistro|sommelier/.test(cut) ? 'waist-apron' : 'apron'
  if (/dress|gown/.test(cut)) return 'dress'
  if (/jumpsuit|romper/.test(cut)) return 'jumpsuit'
  if (slot === 'bottom') return /skirt|kilt|sarong/.test(cut) ? 'skirt' : /short|culotte/.test(cut) ? 'shorts' : 'trousers'
  if (/knit|cardigan|pullover|turtleneck|jersey|sweatshirt|hoodie|tee|henley|polo|tank/.test(text)) return 'knitwear'
  if (slot === 'outerwear') return /waistcoat|vest/.test(cut) ? 'waistcoat' : /coat|trench|cape/.test(cut) ? 'coat' : 'jacket'
  return /camisole|shell|halter|corset/.test(cut) ? 'sleeveless' : 'shirt'
}

export function fabricFamily(fabric = {}) {
  if (fabric.family) return fabric.family
  if (fabric.material?.family) return fabric.material.family
  const text = `${fabric.id || ''} ${fabric.fiber || ''} ${fabric.patternKey || ''}`.toLowerCase()
  if (/suede/.test(text)) return 'suede'
  if (/leather|calfskin|hide/.test(text)) return 'leather'
  if (/notion|bead|metal|brass/.test(text)) return 'notions'
  if (/felt/.test(text)) return 'felt'
  if (/jersey|knit|rib/.test(text)) return 'knit'
  if (/velvet/.test(text)) return 'velvet'
  if (/organza|lace/.test(text)) return 'sheer'
  if (/brocade|jacquard/.test(text)) return 'brocade'
  if (/silk|satin|crepe|crêpe|rayon|viscose/.test(text)) return 'fluid'
  if (/wool|cashmere|tweed|herringbone/.test(text)) return 'suiting'
  return 'woven'
}

export function fashionMaterials(item = {}) {
  const family = fashionFamily(item)
  const text = `${item.cut || ''} ${item.material?.family || ''} ${(item.tags || []).join(' ')}`
  if (/suede/.test(text)) return ['suede']
  if (/leather/.test(text)) return ['leather']
  if (/velvet/.test(text)) return ['velvet']
  if (/brocade|jacquard/.test(text)) return ['brocade']
  if (/organza|lace/.test(text)) return ['sheer']
  if (family === 'ornament') return ['notions']
  if (family === 'knitwear' || /leggings|jersey/.test(text)) return ['knit']
  if (family === 'footwear') return /canvas|sneaker|trainer|espadrille/.test(text) ? ['woven'] : /silk/.test(text) ? ['fluid'] : ['leather', 'suede']
  if (family === 'millinery') return /felt|cloche|beret/.test(text) ? ['felt', 'suiting'] : /turban/.test(text) ? ['fluid'] : ['woven', 'suiting', 'felt']
  if (family === 'neckwear') return /bow|necktie|silk|scarf/.test(text) ? ['fluid', 'woven'] : ['woven', 'suiting']
  if (family === 'bag') return ['woven', 'leather', 'suede', 'velvet', 'fluid']
  if (family === 'gloves') return ['knit', 'leather', 'fluid']
  if (family === 'coat' || family === 'waistcoat' || family === 'jacket') return ['woven', 'suiting', 'brocade', 'velvet']
  if (/bias|palazzo|tea-dress|gown|camisole|shell|wrap-blouse/.test(text)) return ['fluid', 'velvet', 'brocade']
  if (family === 'dress') return ['woven', 'fluid', 'brocade', 'velvet']
  return ['woven', 'suiting']
}

export function compatibleFashionFabric(item, fabric) {
  return Boolean(fabric && fashionMaterials(item).includes(fabricFamily(fabric)))
}

export function earliestFashionMaterialLevel(item) {
  const levels={woven:1,knit:1,fluid:3,suiting:4,felt:3,leather:4,suede:8,velvet:6,sheer:7,brocade:9,notions:2}
  return Math.min(...fashionMaterials(item).map(family=>levels[family]))
}

export function fashionConstructionBrief(item) {
  const family=fashionFamily(item)
  return {
    apron:'Bind the bib and secure the straps before adding optional pockets or handwork.',
    'waist-apron':'Attach a waist tie and turn the side and lower hems.',
    shirt:'Join the body, set the sleeves, and work any collar and placket.',
    knitwear:'Use pre-knitted yardage; join stretch seams and a rib neckband.',
    sleeveless:'Shape the bodice seams and face the neckline.',
    jacket:'Assemble the body, sleeves and front facing as an independent outer layer.',
    coat:'Join the long panels, collar facing and lining edge.',
    waistcoat:'Balance the shaped side seams and turn the front facing.',
    skirt:'Join the panels and set the waistband; secure any pleats or gathers.',
    trousers:'Match both legs, work the inseam, and attach the waistband.',
    shorts:'Join the short leg panels and turn the paired hems.',
    dress:'Construct a continuous bodice, waist join and skirt — not a shirt over a separate bottom.',
    jumpsuit:'Join a bodice to the trouser section, then close the inner leg seam.',
    neckwear:'Turn the edges or long strip, then close the final hand-work opening.',
    millinery:'Work the crown or wrap strip and attach the brim, band or anchored ornament.',
    bag:'Close the gusset, reinforce the handles and bind the opening.',
    gloves:'Join the thumb gusset and close the glove side seam.',
    footwear:'Work mirrored uppers and attach the sole; use matching details on the pair.',
    ornament:'Assemble a material kit by securing the setting, reinforced anchors and clasp.',
  }[family]
}
