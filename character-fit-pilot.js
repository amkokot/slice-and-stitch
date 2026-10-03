import { renderModularAvatar } from './character-v3/modular-avatar.js?v=18'

const DEFAULT_IDENTITY = Object.freeze({
  preset: 'head-02',
  skinTone: 'warm-medium',
})

const DEFAULT_LOOK = Object.freeze({
  top: 'ivory-oxford',
  bottom: 'olive-cuffed-trouser',
  shoes: 'canvas-sneakers',
  apron: 'tomato-apron',
})

const CONTROL_GROUPS = Object.freeze([
  Object.freeze({ kind: 'identity', key: 'preset', label: 'Head', options: [
    Object.freeze({ id: 'head-01', label: 'Head 01' }),
    Object.freeze({ id: 'head-02', label: 'Head 02' }),
    Object.freeze({ id: 'head-03', label: 'Head 03' }),
    Object.freeze({ id: 'head-04', label: 'Head 04' }),
    Object.freeze({ id: 'head-05', label: 'Head 05' }),
    Object.freeze({ id: 'head-06', label: 'Head 06' }),
    Object.freeze({ id: 'head-07', label: 'Head 07' }),
    Object.freeze({ id: 'head-08', label: 'Head 08' }),
    Object.freeze({ id: 'head-09', label: 'Head 09' }),
    Object.freeze({ id: 'head-10', label: 'Head 10' }),
    Object.freeze({ id: 'head-11', label: 'Head 11' }),
    Object.freeze({ id: 'head-12', label: 'Head 12' }),
  ] }),
  Object.freeze({ kind: 'identity', key: 'skinTone', label: 'Skin tone', options: [
    Object.freeze({ id: 'light-golden', label: 'Light golden' }),
    Object.freeze({ id: 'warm-medium', label: 'Warm medium' }),
    Object.freeze({ id: 'deep-golden', label: 'Deep golden' }),
    Object.freeze({ id: 'deep', label: 'Deep' }),
  ] }),
  Object.freeze({ kind: 'equipment', key: 'top', label: 'Top', options: [
    Object.freeze({ id: null, label: 'None' }),
    Object.freeze({ id: 'ivory-oxford', label: 'Ivory shirt' }),
  ] }),
  Object.freeze({ kind: 'equipment', key: 'outer', label: 'Jacket', options: [
    Object.freeze({ id: null, label: 'None' }),
    Object.freeze({ id: 'outer-teal-chore', label: 'Teal chore jacket' }),
  ] }),
  Object.freeze({ kind: 'equipment', key: 'bottom', label: 'Bottom', options: [
    Object.freeze({ id: null, label: 'None' }),
    Object.freeze({ id: 'olive-cuffed-trouser', label: 'Olive trousers' }),
  ] }),
  Object.freeze({ kind: 'equipment', key: 'shoes', label: 'Shoes', options: [
    Object.freeze({ id: 'canvas-sneakers', label: 'Canvas sneakers' }),
  ] }),
  Object.freeze({ kind: 'equipment', key: 'apron', label: 'Apron', options: [
    Object.freeze({ id: null, label: 'None' }),
    Object.freeze({ id: 'tomato-apron', label: 'Tomato apron' }),
  ] }),
])

const IDENTITY_LOOKS = Object.freeze([
  Object.freeze({ label: 'Head 01 · light golden', preset: 'head-01', skinTone: 'light-golden' }),
  Object.freeze({ label: 'Head 02 · warm medium', preset: 'head-02', skinTone: 'warm-medium' }),
  Object.freeze({ label: 'Head 03 · deep', preset: 'head-03', skinTone: 'deep' }),
  Object.freeze({ label: 'Head 04 · light golden', preset: 'head-04', skinTone: 'light-golden' }),
  Object.freeze({ label: 'Head 05 · deep golden', preset: 'head-05', skinTone: 'deep-golden' }),
  Object.freeze({ label: 'Head 06 · warm medium', preset: 'head-06', skinTone: 'warm-medium' }),
  Object.freeze({ label: 'Head 07 · warm medium', preset: 'head-07', skinTone: 'warm-medium' }),
  Object.freeze({ label: 'Head 08 · deep golden', preset: 'head-08', skinTone: 'deep-golden' }),
  Object.freeze({ label: 'Head 09 · light golden', preset: 'head-09', skinTone: 'light-golden' }),
  Object.freeze({ label: 'Head 10 · warm medium', preset: 'head-10', skinTone: 'warm-medium' }),
  Object.freeze({ label: 'Head 11 · warm medium', preset: 'head-11', skinTone: 'warm-medium' }),
  Object.freeze({ label: 'Head 12 · deep golden', preset: 'head-12', skinTone: 'deep-golden' }),
])

const MATRIX_LOOKS = Object.freeze([
  Object.freeze({ label: 'Shirt · trousers', equipment: { top: 'ivory-oxford', bottom: 'olive-cuffed-trouser', shoes: 'canvas-sneakers' } }),
  Object.freeze({ label: 'Open jacket · shirt', equipment: { top: 'ivory-oxford', outer: 'outer-teal-chore', bottom: 'olive-cuffed-trouser', shoes: 'canvas-sneakers' } }),
  Object.freeze({ label: 'Jacket · apron', equipment: { top: 'ivory-oxford', outer: 'outer-teal-chore', bottom: 'olive-cuffed-trouser', shoes: 'canvas-sneakers', apron: 'tomato-apron' } }),
  Object.freeze({ label: 'Pizzeria set', equipment: { top: 'ivory-oxford', bottom: 'olive-cuffed-trouser', shoes: 'canvas-sneakers', apron: 'tomato-apron' } }),
])

let equipment = { ...DEFAULT_LOOK }
let identity = { ...DEFAULT_IDENTITY }

const heroStage = document.querySelector('#hero-stage')
const slotControls = document.querySelector('#slot-controls')
const identityMatrix = document.querySelector('#identity-matrix')
const fitMatrix = document.querySelector('#fit-matrix')
const resetButton = document.querySelector('#reset-look')

function avatarMarkup(selectedEquipment, className = '', label = 'Modular wardrobe preview', selectedIdentity = identity) {
  return renderModularAvatar({ ...selectedIdentity, equipment: selectedEquipment }, { className, label })
}

function renderHero() {
  heroStage.innerHTML = avatarMarkup(equipment, 'hero-avatar')
  slotControls.querySelectorAll('[data-kind][data-key][data-value]').forEach((button) => {
    const state = button.dataset.kind === 'identity' ? identity : equipment
    const selectedValue = state[button.dataset.key] || ''
    button.classList.toggle('is-active', button.dataset.value === selectedValue)
  })
}

slotControls.innerHTML = CONTROL_GROUPS.map((group) => `<fieldset>
  <legend>${group.label}</legend>
  <div class="choice-grid">${group.options.map((option) => `<button class="choice" type="button" data-kind="${group.kind}" data-key="${group.key}" data-value="${option.id || ''}">${option.label}</button>`).join('')}</div>
</fieldset>`).join('')

slotControls.addEventListener('click', (event) => {
  const button = event.target.closest('[data-kind][data-key][data-value]')
  if (!button) return
  if (button.dataset.kind === 'identity') identity = { ...identity, [button.dataset.key]: button.dataset.value }
  else equipment = { ...equipment, [button.dataset.key]: button.dataset.value || null }
  renderHero()
})

resetButton.addEventListener('click', () => {
  equipment = { ...DEFAULT_LOOK }
  identity = { ...DEFAULT_IDENTITY }
  renderHero()
})

const identityEquipment = Object.freeze({ top: 'ivory-oxford', bottom: 'olive-cuffed-trouser', shoes: 'canvas-sneakers' })
identityMatrix.innerHTML = IDENTITY_LOOKS.map((look) => `<article class="fit-card">
  <div class="fit-card-stage">${avatarMarkup(identityEquipment, 'matrix-avatar', look.label, look)}</div>
  <div class="fit-copy"><b>${look.label}</b><small>Same body · same clothing pixels</small></div>
</article>`).join('')

fitMatrix.innerHTML = MATRIX_LOOKS.map((look) => `<article class="fit-card">
  <div class="fit-card-stage">${avatarMarkup(look.equipment, 'matrix-avatar', look.label)}</div>
  <div class="fit-copy"><b>${look.label}</b><small>Independent registered layers</small></div>
</article>`).join('')

renderHero()

