import { FASHION_CATALOG_GARMENTS } from '../fashion-catalog.js'
import { PAINTED_CAPSULE_GARMENTS } from './painted-capsule.js'
import { renderPaintedPaperDoll } from './painted-paper-doll.js'
import { preloadPaintedPreview } from './painted-preview-loader.js'

const catalogue = new Map(FASHION_CATALOG_GARMENTS.map((garment) => [garment.id, garment]))
const trials = [
  { id: 'counter', name: 'Counter casual', top: 'painted-crew-tee-rose', outerwear: '', bottom: 'denim-trousers', apron: 'painted-linen-waist-apron-sage', shoes: 'canvas-sneakers' },
  { id: 'tailored', name: 'Tailored midi', top: 'painted-crew-tee-ivory', outerwear: 'painted-soft-blazer-ink', bottom: 'painted-pencil-skirt-rose', apron: '', shoes: 'painted-penny-loafers-ink' },
  { id: 'linen', name: 'Wide-leg linen', top: 'painted-crew-tee-ink', outerwear: 'painted-cable-cardigan-sage', bottom: 'painted-wide-trousers-ivory', apron: '', shoes: 'painted-penny-loafers-ivory' },
  { id: 'layers', name: 'Apron & lapels', top: 'violet-blouse', outerwear: 'painted-soft-blazer-rose', bottom: 'painted-wide-trousers-sage', apron: 'tomato-apron', shoes: 'canvas-sneakers' },
]
const slots = ['top', 'outerwear', 'bottom', 'apron', 'shoes', 'accessory']
const skin = {
  light: { skinTone: 'light-golden', skin: '#edb485' },
  medium: { skinTone: 'warm-medium', skin: '#b96f50' },
  deep: { skinTone: 'espresso', skin: '#432821' },
}
const controls = document.querySelector('#controls')
const figure = document.querySelector('#figure')
const frame = document.querySelector('#frame')
const outfits = document.querySelector('#outfits')
outfits.innerHTML = trials.map((trial) => `<button type="button" data-trial="${trial.id}" aria-pressed="false">${trial.name}</button>`).join('')

for (const slot of slots) {
  const originals = ['cream-work-tee', 'violet-blouse', 'denim-trousers', 'plum-skirt', 'tomato-apron', 'canvas-sneakers', 'court-trainer-plum', 'court-trainer-sage'].map((id) => catalogue.get(id)).filter((garment) => garment.slot === slot)
  if (slot === 'accessory') originals.push(...FASHION_CATALOG_GARMENTS.filter((garment) => !garment.id.startsWith('painted-') && garment.slot === slot && ['scarf', 'necktie', 'bow-tie', 'collar'].includes(garment.cut)))
  const items = [...originals, ...PAINTED_CAPSULE_GARMENTS.filter((garment) => garment.slot === slot)]
  controls.elements[slot].innerHTML = `${['outerwear', 'apron', 'shoes', 'accessory'].includes(slot) ? '<option value="">None</option>' : ''}${items.map((garment) => `<option value="${garment.id}">${garment.name}</option>`).join('')}`
}

let renderRevision = 0
async function render() {
  const revision = ++renderRevision
  const tone = skin[controls.elements.skin.value]
  const garmentDetails = Object.fromEntries(slots.map((slot) => [slot, catalogue.get(controls.elements[slot].value) || null]))
  const guides = controls.elements.guides.checked ? '<svg class="fit-guides" viewBox="0 0 1024 1536" aria-hidden="true"><g fill="none" stroke="#b24f35" stroke-width="3" stroke-dasharray="12 9"><path d="M260 1410H780M335 675H670"/><circle cx="393" cy="1295" r="28"/><circle cx="627" cy="1295" r="28"/></g></svg>' : ''
  const markup = renderPaintedPaperDoll({ name: 'Trial character', ...tone, faceShape: 'heart', hairStyle: 'shoulder-waves', hairColor: 'espresso', eyeShape: 'almond', complexionDetail: 'none' }, { skin: tone.skin, garmentDetails, accessories: garmentDetails.accessory ? [garmentDetails.accessory] : [] }, { id: 'wearable-trial', label: 'Representative layered outfit' }) + guides
  try { await preloadPaintedPreview(markup) } catch (error) { if (revision === renderRevision) document.querySelector('#caption').textContent = error.message; return }
  if (revision !== renderRevision) return
  figure.innerHTML = markup
  document.querySelector('#caption').textContent = Object.values(garmentDetails).filter(Boolean).map((garment) => garment.name).join(' · ')
}

function selectTrial(id) {
  const trial = trials.find((item) => item.id === id)
  if (!trial) return
  for (const slot of slots) controls.elements[slot].value = trial[slot] || ''
  for (const button of outfits.querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.trial === id))
  render()
}

outfits.addEventListener('click', (event) => { const button = event.target.closest('[data-trial]'); if (button) selectTrial(button.dataset.trial) })
controls.addEventListener('change', () => { for (const button of outfits.querySelectorAll('button')) button.setAttribute('aria-pressed', 'false'); render() })
document.querySelector('.view-tabs').addEventListener('click', (event) => {
  const button = event.target.closest('[data-view]')
  if (!button) return
  frame.dataset.view = button.dataset.view
  for (const tab of document.querySelectorAll('.view-tabs button')) tab.setAttribute('aria-pressed', String(tab === button))
})
selectTrial('counter')
