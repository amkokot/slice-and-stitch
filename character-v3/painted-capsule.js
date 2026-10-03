const colorways = [
  { id: 'ivory', name: 'Ivory', primary: '#e9dfc9', secondary: '#a88d69' },
  { id: 'rose', name: 'Rose', primary: '#be7786', secondary: '#f0e0d0' },
  { id: 'sage', name: 'Sage', primary: '#70846f', secondary: '#eee0c3' },
  { id: 'ink', name: 'Ink', primary: '#384354', secondary: '#e9dfc9' },
]
const cuts = [
  { key: 'crew-tee', name: 'cotton crew tee', slot: 'top', cut: 'crew-tee', price: 38, quality: 78, tags: ['casual', 'cotton'], attachmentPoints: ['torso', 'left-arm', 'right-arm'] },
  { key: 'cable-cardigan', name: 'open cable cardigan', slot: 'outerwear', cut: 'cardigan', price: 112, quality: 87, tags: ['knitwear', 'soft'], attachmentPoints: ['torso', 'left-arm', 'right-arm'] },
  { key: 'linen-waist-apron', name: 'linen pocket waist apron', slot: 'apron', cut: 'waist-apron', price: 56, quality: 82, tags: ['linen', 'service'], attachmentPoints: ['waist'] },
  { key: 'soft-blazer', name: 'soft tailored blazer', slot: 'outerwear', cut: 'soft-blazer', price: 148, quality: 88, tags: ['tailored', 'soft'], attachmentPoints: ['torso', 'left-arm', 'right-arm'] },
  { key: 'wide-trousers', name: 'wide-leg linen trousers', slot: 'bottom', cut: 'wide-leg', price: 94, quality: 84, tags: ['linen', 'relaxed'], attachmentPoints: ['hips', 'left-leg', 'right-leg'] },
  { key: 'pencil-skirt', name: 'twill pencil midi skirt', slot: 'bottom', cut: 'pencil-skirt', price: 86, quality: 85, tags: ['tailored', 'classic'], attachmentPoints: ['hips', 'left-leg', 'right-leg'] },
  { key: 'penny-loafers', name: 'leather penny loafers', slot: 'shoes', cut: 'penny-loafer', price: 98, quality: 86, tags: ['leather', 'classic'], attachmentPoints: ['left-foot', 'right-foot'] },
  { key: 'button-shirt', name: 'cotton Oxford shirt', slot: 'top', cut: 'oxford-shirt', price: 74, quality: 85, tags: ['cotton', 'classic'], attachmentPoints: ['torso', 'left-arm', 'right-arm'] },
  { key: 'knit-pullover', name: 'fine-knit crew pullover', slot: 'top', cut: 'pullover', price: 88, quality: 86, tags: ['knitwear', 'soft'], attachmentPoints: ['torso', 'left-arm', 'right-arm'] },
  { key: 'rib-tank', name: 'ribbed cotton tank', slot: 'top', cut: 'tank', price: 42, quality: 80, tags: ['cotton', 'casual'], attachmentPoints: ['torso'] },
  { key: 'denim-jacket', name: 'cropped denim jacket', slot: 'outerwear', cut: 'trucker-jacket', price: 118, quality: 86, tags: ['denim', 'casual'], attachmentPoints: ['torso', 'left-arm', 'right-arm'] },
  { key: 'tailored-waistcoat', name: 'tailored open waistcoat', slot: 'outerwear', cut: 'waistcoat', price: 92, quality: 87, tags: ['tailored', 'classic'], attachmentPoints: ['torso'] },
  { key: 'a-line-skirt', name: 'soft twill A-line midi', slot: 'bottom', cut: 'a-line-skirt', price: 78, quality: 84, tags: ['twill', 'classic'], attachmentPoints: ['hips', 'left-leg', 'right-leg'] },
  { key: 'tailored-shorts', name: 'cuffed Bermuda shorts', slot: 'bottom', cut: 'bermuda-shorts', price: 64, quality: 82, tags: ['cotton', 'casual'], attachmentPoints: ['hips', 'left-leg', 'right-leg'] },
  { key: 'ankle-boots', name: 'leather Chelsea boots', slot: 'shoes', cut: 'chelsea-boots', price: 108, quality: 87, tags: ['leather', 'classic'], attachmentPoints: ['left-foot', 'right-foot'] },
  { key: 'ballet-flats', name: 'soft ballet flats', slot: 'shoes', cut: 'ballet-flats', price: 72, quality: 84, tags: ['leather', 'soft'], attachmentPoints: ['left-foot', 'right-foot'] },
  { key: 'bib-apron', name: 'linen divided-pocket bib apron', slot: 'apron', cut: 'bib-apron', price: 68, quality: 86, tags: ['linen', 'service'], attachmentPoints: ['torso', 'waist'] },
  { key: 'woven-scarf', name: 'woven neck scarf', slot: 'accessory', cut: 'scarf', price: 46, quality: 83, tags: ['soft', 'classic'], attachmentPoints: ['neck'] },
  { key: 'pique-polo', name: 'cotton piqué polo', slot: 'top', cut: 'polo', price: 58, quality: 83, tags: ['cotton', 'casual'], attachmentPoints: ['torso', 'left-arm', 'right-arm'] },
  { key: 'camp-shirt', name: 'linen camp-collar shirt', slot: 'top', cut: 'camp-shirt', price: 72, quality: 85, tags: ['linen', 'relaxed'], attachmentPoints: ['torso', 'left-arm', 'right-arm'] },
  { key: 'wrap-blouse', name: 'cotton wrap blouse', slot: 'top', cut: 'wrap-blouse', price: 84, quality: 86, tags: ['cotton', 'soft'], attachmentPoints: ['torso', 'left-arm', 'right-arm'] },
  { key: 'cargo-trousers', name: 'cotton utility cargo trousers', slot: 'bottom', cut: 'cargo-pants', price: 92, quality: 85, tags: ['twill', 'utility'], attachmentPoints: ['hips', 'left-leg', 'right-leg'] },
  { key: 'pleated-midi', name: 'knife-pleat twill midi', slot: 'bottom', cut: 'pleated-skirt', price: 86, quality: 85, tags: ['twill', 'classic'], attachmentPoints: ['hips', 'left-leg', 'right-leg'] },
  { key: 'chore-jacket', name: 'rolled-sleeve chore jacket', slot: 'outerwear', cut: 'chore-jacket', price: 108, quality: 86, tags: ['canvas', 'utility'], attachmentPoints: ['torso', 'left-arm', 'right-arm'] },
  { key: 'crossback-apron', name: 'cotton cross-back utility apron', slot: 'apron', cut: 'crossback-apron', price: 74, quality: 86, tags: ['cotton', 'maker'], attachmentPoints: ['chest', 'waist'] },
]

export const PAINTED_CAPSULE_CUTS = Object.freeze(cuts.map((cut) => Object.freeze({ ...cut })))

export const PAINTED_CAPSULE_GARMENTS = cuts.flatMap(({ key, ...cut }) => colorways.map((color) => ({
  ...cut, id: `painted-${key}-${color.id}`, name: `${color.name} ${cut.name}`,
  palette: { primary: color.primary, secondary: color.secondary },
  pattern: 'solid', unlockLevel: 1,
})))

// Two immediately wearable representatives per cut; remaining colorways follow the
// normal boutique purchase flow. Existing saves gain these without resetting.
export const PAINTED_CAPSULE_STARTERS = Object.freeze([
  'painted-crew-tee-ivory', 'painted-crew-tee-rose',
  'painted-cable-cardigan-sage', 'painted-cable-cardigan-ink',
  'painted-linen-waist-apron-sage', 'painted-linen-waist-apron-ivory',
  'painted-soft-blazer-ink', 'painted-soft-blazer-rose',
  'painted-wide-trousers-ivory', 'painted-wide-trousers-sage',
  'painted-pencil-skirt-rose', 'painted-pencil-skirt-ink',
  'painted-penny-loafers-ink', 'painted-penny-loafers-ivory',
  ...cuts.slice(7).flatMap(({ key }, index) => [`painted-${key}-${index % 2 ? 'rose' : 'ivory'}`, `painted-${key}-${index % 2 ? 'ink' : 'sage'}`]),
])
