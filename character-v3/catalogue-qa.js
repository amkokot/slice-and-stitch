import { FASHION_CATALOG_GARMENTS } from '../fashion-catalog.js'
import { PAINTED_CAPSULE_CUTS } from './painted-capsule.js'
import { registeredGarmentAsset, renderRegisteredGarment } from './registered-garments.js'
import { renderPaintedPaperDoll } from './painted-paper-doll.js'
import { preloadPaintedPreview } from './painted-preview-loader.js'
import { garmentEquipmentSlot } from '../garment-slots.js'
import { wearableFitExamples } from './wearable-fit-audit.js'

const catalogue = new Map(FASHION_CATALOG_GARMENTS.map((garment) => [garment.id, garment]))
const paint = (key, color = 'ivory') => `painted-${key}-${color}`
const base = { top: paint('crew-tee'), bottom: paint('pencil-skirt', 'sage'), shoes: paint('penny-loafers', 'ink') }
export const CATALOGUE_QA_OUTFITS = Object.freeze([
  { name: 'Oxford & waistcoat', top: paint('button-shirt'), outerwear: paint('tailored-waistcoat', 'ink'), bottom: paint('wide-trousers', 'sage'), shoes: paint('penny-loafers', 'ink') },
  { name: 'Summer denim', top: paint('rib-tank', 'rose'), outerwear: paint('denim-jacket', 'ink'), bottom: paint('tailored-shorts', 'ivory'), shoes: paint('ballet-flats', 'rose') },
  { name: 'Soft knit & midi', top: paint('knit-pullover', 'ivory'), bottom: paint('a-line-skirt', 'rose'), shoes: paint('ankle-boots', 'ink'), accessory: paint('woven-scarf', 'sage') },
  { name: 'Layered service', top: paint('button-shirt'), outerwear: paint('soft-blazer', 'sage'), bottom: paint('wide-trousers', 'ink'), apron: paint('bib-apron', 'rose'), shoes: 'canvas-sneakers' },
  { name: 'Sleeveless tailoring', top: paint('rib-tank', 'ivory'), outerwear: paint('tailored-waistcoat', 'rose'), bottom: paint('a-line-skirt', 'sage'), shoes: paint('ballet-flats', 'ink') },
  { name: 'Weekend layers', top: paint('knit-pullover', 'rose'), outerwear: paint('denim-jacket', 'sage'), bottom: paint('tailored-shorts', 'ink'), apron: paint('linen-waist-apron'), shoes: paint('ankle-boots', 'ivory') },
])
export const CATALOGUE_QA_ARRIVALS = Object.freeze([
  { name:'Summer shirt dress', top:'shirt-dress-cream', shoes:'mary-jane-moss', accessory:'market-tote-moss' },
  { name:'Soft layers & tiers', top:'camisole-coral', outerwear:paint('denim-jacket','ink'), bottom:'tiered-midi-oat', shoes:'platform-sandal-moss' },
  { name:'Trench & tailoring', top:'turtleneck-ink', outerwear:'trench-coat-sky', bottom:'paperbag-trouser-oat', shoes:'wingtip-oat' },
  { name:'Workroom jumpsuit', top:'jumpsuit-coral', apron:'studio-smock-sage', shoes:'ochre-clogs' },
  { name:'Couture petals', top:'corset-top-plum', outerwear:'capelet-sky', bottom:'petal-skirt-berry', shoes:'velvet-pump-sage' },
  { name:'Evening, layered', top:'draped-gown-indigo', outerwear:'tailcoat-coral', shoes:'spectator-pump-berry', accessory:'beaded-collar-ink' },
])
export const CATALOGUE_QA_SPECIALISTS = Object.freeze([
  { name:'Halter & gathered waist', top:'halter-plum', bottom:'paperbag-trouser-oat', shoes:'slingback-sky' },
  { name:'Shell & sailor trousers', top:'silk-shell-sky', bottom:'sailor-trouser-ink', shoes:'mule-plum' },
  { name:'Double-breasted layers', top:paint('button-shirt'), outerwear:'double-blazer-coral', bottom:'paperbag-trouser-sky', shoes:'monk-shoe-indigo' },
  { name:'Peacoat & joggers', top:'turtleneck-ink', outerwear:'peacoat-moss', bottom:'jogger-berry', shoes:'monk-shoe-coral' },
  { name:'Leather maker wear', top:paint('camp-shirt'), apron:'leather-apron-coral', bottom:'sailor-trouser-berry', shoes:'mule-sky' },
  { name:'T-straps & soft tailoring', top:'silk-shell-plum', outerwear:'double-blazer-butter', bottom:paint('a-line-skirt','rose'), shoes:'t-strap-moss' },
])
export const CATALOGUE_QA_PREMIUM = Object.freeze([
  { name:'Lambskin & brass', top:paint('button-shirt'), outerwear:'leather-biker-ink', bottom:'leather-trouser-cognac', shoes:paint('ankle-boots','ink'), accessory:'leather-tote-cocoa' },
  { name:'Soft suede layers', top:paint('rib-tank','ivory'), outerwear:'suede-jacket-sand', bottom:paint('wide-trousers','ink'), shoes:'monk-shoe-indigo' },
  { name:'Velvet & panelled leather', top:'velvet-camisole-wine', bottom:'leather-skirt-sage', shoes:'velvet-pump-sage', accessory:'leather-tote-moss' },
  { name:'Satin-lapel evening suit', top:paint('button-shirt'), outerwear:'tuxedo-jacket-ink', bottom:'tuxedo-trouser-ink', shoes:'velvet-pump-ink' },
  { name:'Brocade over velvet', top:'velvet-camisole-midnight', outerwear:'brocade-coat-berry', bottom:'tuxedo-trouser-butter', shoes:'velvet-pump-oat' },
  { name:'Cognac leather layers', top:'velvet-camisole-midnight', outerwear:'leather-biker-cognac', bottom:'leather-skirt-ink', shoes:'velvet-pump-ink', accessory:'leather-tote-ink' },
])
export const CATALOGUE_QA_PREMIUM_CONTRASTS = Object.freeze([
  { name:'Forest suede tailoring', top:paint('button-shirt'), outerwear:'suede-jacket-forest', bottom:'leather-trouser-ink', shoes:'monk-shoe-indigo' },
  { name:'Plum evening separates', top:'velvet-camisole-midnight', outerwear:'tuxedo-jacket-plum', bottom:'tuxedo-trouser-plum', shoes:'velvet-pump-oat' },
  { name:'Sage satin suit', top:paint('button-shirt'), outerwear:'tuxedo-jacket-sage', bottom:'tuxedo-trouser-sage', shoes:'velvet-pump-sage' },
  { name:'Brocade & oat leather', top:'velvet-camisole-wine', outerwear:'brocade-coat-moss', bottom:'leather-skirt-oat', shoes:'velvet-pump-oat' },
  { name:'Velvet & cognac', top:'velvet-camisole-midnight', bottom:'leather-skirt-cognac', shoes:'velvet-pump-ink', accessory:'leather-tote-ink' },
  { name:'Soft luxury mix', top:paint('button-shirt'), outerwear:'suede-jacket-sand', bottom:'tuxedo-trouser-coral', shoes:'velvet-pump-sage' },
])
export const CATALOGUE_QA_MAJOR = Object.freeze([
  {name:'Belted shirt dress', top:'shirt-dress-butter', shoes:'mary-jane-moss'},
  {name:'Cotton sundress', top:'sundress-plum', shoes:paint('ballet-flats','ink')},
  {name:'Jersey & culottes', top:'sweatshirt-cocoa', bottom:'indigo-culottes', shoes:'canvas-sneakers', accessory:'bucket-hat-cream'},
  {name:'Pearl-snap western shirt', top:'western-shirt-ink', bottom:'straight-jean-sage', shoes:paint('ankle-boots','ink')},
  {name:'Puffer & fitted jersey', top:paint('crew-tee'), outerwear:'puffer-jacket-sky', bottom:'leggings-sage', shoes:'canvas-sneakers'},
  {name:'Soft everyday separates', top:'sweatshirt-ink', bottom:'leggings-oat', shoes:'canvas-sneakers', accessory:'bucket-hat-indigo'},
])
export const CATALOGUE_QA_PATTERNS = Object.freeze(['stripe','check','floral','cord','herringbone','cable'].map((key) => {
  const piece = FASHION_CATALOG_GARMENTS.find((item) => ['top','outerwear'].includes(item.slot) && item.colorPattern.key === key && item.colorPattern.mode === 'overlay' && !registeredGarmentAsset(item)?.onePiece)
  return {...base, name:`${key[0].toUpperCase()+key.slice(1)} textile`, [piece.slot]:piece.id}
}))
const outfitGroups = {arrivals:CATALOGUE_QA_ARRIVALS, major:CATALOGUE_QA_MAJOR, patterns:CATALOGUE_QA_PATTERNS,
  premium:CATALOGUE_QA_PREMIUM, 'premium-contrasts':CATALOGUE_QA_PREMIUM_CONTRASTS,
  specialists:CATALOGUE_QA_SPECIALISTS, layers:CATALOGUE_QA_OUTFITS}
const tones = {
  light: { skinTone: 'light-golden', skin: '#edb485' },
  medium: { skinTone: 'warm-medium', skin: '#b96f50' },
  deep: { skinTone: 'espresso', skin: '#432821' },
}
let group = new URLSearchParams(location.search).get('group') || 'arrivals'
if (!document.querySelector(`[data-group="${CSS.escape(group)}"]`)) group = 'arrivals'
for (const button of document.querySelectorAll('nav button')) button.setAttribute('aria-pressed', String(button.dataset.group === group))
const gallery = document.querySelector('#gallery')
const tone = document.querySelector('#tone')
const framing = document.querySelector('#framing')
const hair = document.querySelector('#hair')
const hem = document.querySelector('#hem')
let renderRevision = 0
let cutPage = 0
const cutSearch = document.querySelector('#cut-search')
const cutSlot = document.querySelector('#cut-slot')
export function catalogueCutExamples(slot = 'all', search = '', newPaintings = false) {
  const cuts = new Map()
  for (const garment of FASHION_CATALOG_GARMENTS) {
    const equipmentSlot = garmentEquipmentSlot(garment)
    const asset = registeredGarmentAsset(garment)
    if (newPaintings && !asset?.src.includes('/catalogue-')) continue
    const key = newPaintings ? asset.family : `${equipmentSlot}/${garment.cut}`
    if (cuts.has(key) || (slot !== 'all' && equipmentSlot !== slot)) continue
    if (search && !`${garment.cut} ${garment.name} ${(garment.tags || []).join(' ')}`.toLowerCase().includes(search.toLowerCase())) continue
    cuts.set(key, { ...base, name: garment.name, [equipmentSlot]: garment.id })
  }
  return [...cuts.values()]
}
async function render() {
  const revision = ++renderRevision
  const audit = ['footwear-audit', 'headwear-audit'].includes(group)
  const paged = audit || ['catalogue', 'paintings'].includes(group)
  const cutExamples = audit ? wearableFitExamples(group === 'footwear-audit' ? 'footwear' : 'headwear', {search:cutSearch.value, trousers:hem.value === 'trousers'}) : catalogueCutExamples(cutSlot.value, cutSearch.value, group === 'paintings')
  const cutPages = Math.max(1, Math.ceil(cutExamples.length / 6))
  cutPage = Math.max(0, Math.min(cutPage, cutPages - 1))
  document.querySelector('#catalogue-controls').hidden = !paged
  document.querySelector('#cut-slot-label').hidden = audit
  document.querySelector('#fit-pairings').hidden = !audit
  document.querySelector('#cut-page').textContent = `${cutPage + 1} / ${cutPages}`
  document.querySelector('#cut-prev').disabled = cutPage === 0
  document.querySelector('#cut-next').disabled = cutPage === cutPages - 1
  const entries = paged ? cutExamples.slice(cutPage * 6, (cutPage + 1) * 6) : outfitGroups[group] || PAINTED_CAPSULE_CUTS.filter((cut) => group === 'details' ? ['apron', 'accessory'].includes(cut.slot) : cut.slot === group).map((cut, index) => ({ ...base, name: cut.name, [cut.slot]: paint(cut.key, ['ivory', 'rose', 'sage', 'ink'][index % 4]) }))
  gallery.dataset.framing = framing.value
  const markup = entries.map((outfit, index) => {
    const garmentDetails = Object.fromEntries(['top', 'outerwear', 'bottom', 'apron', 'shoes'].map((slot) => [slot, catalogue.get(outfit[slot]) || null]))
    if (registeredGarmentAsset(garmentDetails.top || {})?.onePiece) garmentDetails.bottom = null
    const accessories = outfit.accessory ? [catalogue.get(outfit.accessory)].filter(Boolean) : []
    const skin = tones[tone.value]
    const avatar = renderPaintedPaperDoll({ ...skin, faceShape: 'heart', hairStyle: hair.value, hairColor: 'espresso', eyeShape: 'almond', complexionDetail: 'none' }, { skin: skin.skin, garmentDetails, accessories }, { id: `catalogue-${group}-${revision}-${index}`, label: outfit.name })
    const items = [...Object.values(garmentDetails), ...accessories].filter(Boolean)
    const auditItem = catalogue.get(outfit.auditItem)
    const product = auditItem ? `<div class="product-view" aria-label="Unequipped product view">${renderRegisteredGarment(registeredGarmentAsset(auditItem), {id:`audit-product-${revision}-${index}`, ...auditItem.palette, pattern:auditItem.pattern, outline:auditItem.outline, colorPattern:auditItem.colorPattern, thumbnail:true})}<span>Product view · unequipped</span></div>` : ''
    return `<article><div class="stage"><div class="figure">${avatar}</div></div><h2>${outfit.name}</h2>${product}<p>${items.map((item) => item.name).join(' · ')}</p><p class="design-note">${items.map((item) => `${item.outline.silhouette} / ${item.colorPattern.key}`).join(' · ')}</p></article>`
  }).join('')
  document.querySelector('#coverage').textContent = 'Loading painted outfits…'
  try { await preloadPaintedPreview(markup) } catch (error) {
    if (revision === renderRevision) document.querySelector('#coverage').textContent = error.message
    return
  }
  if (revision !== renderRevision) return
  gallery.innerHTML = markup
  const registered = FASHION_CATALOG_GARMENTS.filter((item) => registeredGarmentAsset(item)).length
  const paintings = new Set(FASHION_CATALOG_GARMENTS.map((item)=>registeredGarmentAsset(item)?.src).filter(Boolean)).size
  document.querySelector('#coverage').textContent = `${entries.length} equipped examples · ${paintings} shared painted bases · ${registered}/${FASHION_CATALOG_GARMENTS.length} registered entries · ${FASHION_CATALOG_GARMENTS.filter(item=>item.outline && item.colorPattern).length} with contour and colour-pattern recipes`
}
document.querySelector('nav').addEventListener('click', (event) => {
  const button = event.target.closest('[data-group]')
  if (!button) return
  group = button.dataset.group
  cutPage = 0
  if (group === 'footwear-audit' || group === 'headwear-audit') framing.value = group === 'footwear-audit' ? 'feet' : 'head'
  for (const sibling of document.querySelectorAll('nav button')) sibling.setAttribute('aria-pressed', String(sibling === button))
  render()
})
tone.addEventListener('change', render)
hair.addEventListener('change', render)
hem.addEventListener('change', render)
cutSearch.addEventListener('input', () => { cutPage = 0; render() })
cutSlot.addEventListener('change', () => { cutPage = 0; render() })
document.querySelector('#cut-prev').addEventListener('click', () => { cutPage--; render() })
document.querySelector('#cut-next').addEventListener('click', () => { cutPage++; render() })
// Framing only changes CSS. Keep loaded SVG layers mounted instead of
// rebuilding identical filter IDs and briefly exposing the bare base.
framing.addEventListener('change', () => { gallery.dataset.framing = framing.value })
if (group === 'footwear-audit' || group === 'headwear-audit') framing.value = group === 'footwear-audit' ? 'feet' : 'head'
render()
