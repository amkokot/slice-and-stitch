// Material-aware additions. Appended catalogue records never renumber older
// styles or change the IDs already stored in a player's wardrobe.
export const SPECIALTY_STYLES = Object.freeze([
  ['leather-biker', 'leather biker jacket', 'top', 'leather-biker-jacket', 6, ['leather', 'statement']],
  ['suede-jacket', 'brushed suede jacket', 'top', 'suede-jacket', 7, ['suede', 'tailored']],
  ['leather-trouser', 'seamed leather trousers', 'bottom', 'leather-trouser', 7, ['leather', 'statement']],
  ['velvet-camisole', 'velvet satin-strap camisole', 'top', 'velvet-camisole', 8, ['velvet', 'occasion']],
])

const pair = (id, label, primary, secondary = '#c8a56c') => Object.freeze({ id, label, primary, secondary, pattern: 'solid' })
export const SPECIALTY_COLORWAYS = Object.freeze({
  'leather-biker': [pair('ink', 'Ink', '#353039'), pair('cognac', 'Cognac', '#986345')],
  'suede-jacket': [pair('sand', 'Sand', '#b99a74'), pair('forest', 'Forest', '#536951')],
  'leather-trouser': [pair('ink', 'Ink', '#353039'), pair('cognac', 'Cognac', '#986345')],
  'velvet-camisole': [pair('wine', 'Wine', '#793d58'), pair('midnight', 'Midnight', '#364b65')],
})

// Extend existing cuts additively: keep every old ID/color, but provide real
// matching suit separates and useful dark/cognac leather rather than forcing
// a mismatched outfit from the original rotating palette.
export const SPECIALTY_EXTRA_COLORWAYS = Object.freeze({
  'tuxedo-jacket': [pair('ink', 'Ink', '#353039')],
  'tuxedo-trouser': [pair('ink', 'Ink', '#353039'), pair('plum', 'Plum', '#65455f'), pair('sage', 'Sage', '#6f8065')],
  'leather-skirt': [pair('ink', 'Ink', '#353039'), pair('cognac', 'Cognac', '#986345')],
  'velvet-pump': [pair('ink', 'Ink', '#353039')],
  'leather-tote': [pair('ink', 'Ink', '#353039')],
})

const material = (name, family) => Object.freeze({ name, family })
export const SPECIALTY_MATERIALS = Object.freeze({
  'leather-biker': material('Pebble-grain lambskin leather', 'leather'),
  'suede-jacket': material('Brushed suede', 'suede'),
  'leather-trouser': material('Supple seamed lambskin leather', 'leather'),
  'leather-skirt': material('Panelled lambskin leather', 'leather'),
  'leather-tote': material('Structured pebble-grain leather', 'leather'),
  'leather-apron': material('Full-grain maker leather', 'leather'),
  'tuxedo-jacket': material('Fine wool with silk satin lapels', 'satin'),
  'tuxedo-trouser': material('Fine wool with silk satin stripes', 'satin'),
  'velvet-camisole': material('Plush velvet with silk satin straps', 'velvet'),
  'velvet-pump': material('Plush velvet with pearl ornaments', 'velvet'),
  'brocade-coat': material('Floral damask brocade', 'brocade'),
})
