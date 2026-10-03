// Friendly names for internal IDs used in player-facing menus and previews.
export function garmentSlotLabel(slot) {
  return ({top:'Tops & dresses',outerwear:'Outerwear',bottom:'Bottoms',apron:'Aprons',shoes:'Shoes',accessory:'Accessories'})[slot] || 'Clothing'
}

export function sceneLabel(scene) {
  return ({home:'Home',street:'Street',restaurant:'Pizzeria',kitchen:'Kitchen',tailor:'Tailor shop',boutique:'Boutique'})[scene] || 'Joining'
}

export function readableCut(cut) {
  return String(cut || 'piece').replaceAll('-', ' ').replaceAll('_', ' ')
}
