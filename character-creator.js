import {
  CHARACTER_OPTIONS,
  ACCESSORY_EQUIPMENT_ZONES,
  GARMENT_SLOTS,
  characterToActorAppearance,
  findGarment,
  garmentCatalog,
  wardrobeSetBonuses,
} from './character-model.js'
import { accessoryEquipmentZone, identityOption } from './character-v2/identity-catalog.js'
import { renderPaintedGarmentThumbnail } from './character-v3/painted-wardrobe.js'
import { PAINTED_OUTFIT_SKIN_PALETTES, paintedOutfitSkinGroup } from './character-v3/painted-outfit.js'
import { renderPaintedPaperDoll } from './character-v3/painted-paper-doll.js'
import { selectWardrobeGarments, wardrobeTryOnState, addWardrobeTryOn, wardrobeFittingSlot, WARDROBE_THEMES, WARDROBE_PAGE_SIZE } from './wardrobe-browser.js'

export const CHARACTER_CHANGED_EVENT = 'slice-and-stitch:character-changed'
const SLOT_COPY = Object.freeze({
  top: ['Tops', 'Torso and sleeves'],
  outerwear: ['Outerwear', 'Over your shirt'],
  bottom: ['Bottoms', 'Hips and legs'],
  apron: ['Aprons', 'Chest and waist'],
  shoes: ['Shoes', 'Left and right foot'],
  accessory: ['Details', 'Head, neck, or shoulder'],
})

const CREATOR_PANELS = Object.freeze([
  Object.freeze({ id: 'face', label: 'Face', mark: '☺' }),
  Object.freeze({ id: 'hair', label: 'Hair', mark: '≋' }),
  Object.freeze({ id: 'clothes', label: 'Wardrobe', mark: '✦' }),
  Object.freeze({ id: 'details', label: 'Details', mark: '＋' }),
])

const FACING_OPTIONS = Object.freeze([
  Object.freeze({ id: 'up-left', label: 'Back left', mark: '↖' }),
  Object.freeze({ id: 'up', label: 'Back', mark: '↑' }),
  Object.freeze({ id: 'up-right', label: 'Back right', mark: '↗' }),
  Object.freeze({ id: 'left', label: 'Left profile', mark: '←' }),
  Object.freeze({ id: 'right', label: 'Right profile', mark: '→' }),
  Object.freeze({ id: 'down-left', label: 'Front left', mark: '↙' }),
  Object.freeze({ id: 'down', label: 'Front', mark: '↓' }),
  Object.freeze({ id: 'down-right', label: 'Front right', mark: '↘' }),
])

const CREATOR_SKIN_CHOICES = Object.freeze([
  Object.freeze({ id: 'light', value: 'porcelain', label: 'Light', color: PAINTED_OUTFIT_SKIN_PALETTES.light.base }),
  Object.freeze({ id: 'medium', value: 'warm-medium', label: 'Warm', color: PAINTED_OUTFIT_SKIN_PALETTES.medium.base }),
  Object.freeze({ id: 'deep', value: 'deep', label: 'Deep', color: PAINTED_OUTFIT_SKIN_PALETTES.deep.base }),
])

export const CURATED_CREATOR_HAIR_STYLES = Object.freeze([
  Object.freeze({ id: 'buzz', label: 'Buzz cut', texture: 'straight', traditional: 'masculine' }),
  Object.freeze({ id: 'crop', label: 'Textured crop', texture: 'wavy', traditional: 'masculine' }),
  Object.freeze({ id: 'side-part', label: 'Side part', texture: 'straight', traditional: 'masculine' }),
  Object.freeze({ id: 'twists', label: 'Short twists', texture: 'locs', traditional: 'masculine' }),
  Object.freeze({ id: 'bob', label: 'Soft bob', texture: 'straight', traditional: 'feminine' }),
  Object.freeze({ id: 'shoulder-waves', label: 'Shoulder waves', texture: 'wavy', traditional: 'feminine' }),
  Object.freeze({ id: 'curly-top', label: 'Long curls', texture: 'curly', traditional: 'feminine' }),
  Object.freeze({ id: 'afro', label: 'Rounded afro', texture: 'coily', traditional: 'feminine' }),
  Object.freeze({ id: 'braided-bob', label: 'Braided bob', texture: 'braided', traditional: 'feminine' }),
  Object.freeze({ id: 'ponytail', label: 'Ponytail', texture: 'wavy', traditional: 'feminine' }),
  Object.freeze({ id: 'braided-bun', label: 'Braided bun', texture: 'braided', traditional: 'feminine' }),
])

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function choiceButtons(field, options, current, { swatches = false, colorOnly = false } = {}) {
  return options.map((option) => {
    const value = option.value || option.id
    return (
    `<button class="character-choice ${option.id === current ? 'is-active' : ''} ${swatches ? 'is-swatch' : ''} ${colorOnly ? 'is-color-only' : ''}" type="button" data-character-field="${field}" data-character-value="${value}"${option.texture ? ` data-character-texture="${option.texture}"` : ''}${option.traditional ? ` data-hair-presentation="${option.traditional}"` : ''} aria-label="${escapeHtml(option.label)}" aria-pressed="${option.id === current}">
      ${swatches ? `<i style="--choice-color:${option.color}" aria-hidden="true"></i>` : ''}${colorOnly ? '' : `<span>${option.label}</span>`}
    </button>`
    )
  }).join('')
}

function garmentCard(garment, equipped, { owned = true, trying = false, preview = !owned } = {}) {
  return `<button class="character-garment ${equipped ? 'is-equipped' : ''} ${!owned ? 'is-catalogue' : ''} ${trying ? 'is-trying' : ''}" type="button" ${preview ? 'data-preview-garment' : 'data-equip-garment'}="${escapeHtml(garment.id)}" aria-pressed="${equipped || trying}">
    <span class="character-garment-art">${renderPaintedGarmentThumbnail(garment)}</span>
    <span class="character-garment-copy"><b>${escapeHtml(garment.name)}</b><small>${escapeHtml(garment.cut.replaceAll('-', ' '))}</small><em>${preview ? `${trying ? 'Trying on' : 'Try on'} · ${owned ? 'In your chest' : `${garment.price || 0} coins · Lv ${garment.unlockLevel || 1}`}` : equipped ? 'Wearing' : garment.source === 'crafted' ? 'Handmade' : `Quality ${garment.quality}`}</em></span>
    <i class="character-equipped-mark" aria-hidden="true">✓</i>
  </button>`
}

function equippedMarkup(state) {
  return GARMENT_SLOTS.map((slot) => {
    if (slot === 'accessory') {
      const count = Object.values(state.profile.accessories || {}).filter(Boolean).length
      return `<span><small>${SLOT_COPY[slot][0]}</small><b>${count ? `${count} equipped` : 'None'}</b></span>`
    }
    const garment = findGarment(state, state.profile.equipped[slot])
    return `<span><small>${SLOT_COPY[slot][0]}</small><b>${escapeHtml(garment?.name || 'None')}</b></span>`
  }).join('')
}

function bodyPanel(profile) {
  return `<div class="character-panel-heading"><span>Shared animation rig</span><h3>Fine-tune the silhouette</h3><p>Body changes stay intentionally subtle so every outfit and animation keeps a polished, consistent fit.</p></div>
    <fieldset><legend>Body frame</legend><div class="character-choice-grid">${choiceButtons('frame', CHARACTER_OPTIONS.frames, profile.frame)}</div></fieldset>
    <fieldset><legend>Height</legend><div class="character-choice-grid">${choiceButtons('height', CHARACTER_OPTIONS.heights, profile.height)}</div></fieldset>`
}

function facePanel(profile, previewLook) {
  const requestedSkin = identityOption('skinTones', profile.skinTone)?.color
  const skinGroup = paintedOutfitSkinGroup({ skin: requestedSkin })
  return `<div class="character-panel-heading"><span>Your character's identity</span><h3>Build a recognizable face</h3><p>Skin uses the same light, warm, or deep painted palette as the body. Features and gaze remain independently editable and animatable.</p></div>
    <fieldset><legend>Skin tone</legend><div class="character-choice-grid skin-bucket-grid">${choiceButtons('skinTone', CREATOR_SKIN_CHOICES, skinGroup, { swatches: true, colorOnly: true })}</div></fieldset>
    <fieldset><legend>Face shape</legend><div class="character-choice-grid">${choiceButtons('faceShape', CHARACTER_OPTIONS.faceShapes, profile.faceShape)}</div></fieldset>
    <fieldset><legend>Eye shape</legend><div class="character-choice-grid">${choiceButtons('eyeShape', CHARACTER_OPTIONS.eyeShapes, profile.eyeShape)}</div></fieldset>
    <fieldset><legend>Eye color</legend><div class="character-choice-grid swatch-grid compact-swatches">${choiceButtons('eyeColor', CHARACTER_OPTIONS.eyeColors, profile.eyeColor, { swatches: true })}</div></fieldset>
    <fieldset><legend>Brows</legend><div class="character-choice-grid">${choiceButtons('browStyle', CHARACTER_OPTIONS.browStyles, profile.browStyle)}</div></fieldset>
    <fieldset><legend>Nose</legend><div class="character-choice-grid">${choiceButtons('noseShape', CHARACTER_OPTIONS.noseShapes, profile.noseShape)}</div></fieldset>
    <fieldset><legend>Mouth</legend><div class="character-choice-grid">${choiceButtons('mouthStyle', CHARACTER_OPTIONS.mouthStyles, profile.mouthStyle)}</div></fieldset>
    <fieldset><legend>Complexion detail</legend><div class="character-choice-grid">${choiceButtons('complexionDetail', CHARACTER_OPTIONS.complexionDetails, profile.complexionDetail)}</div></fieldset>
    <fieldset><legend>Facial hair</legend><div class="character-choice-grid">${choiceButtons('facialHair', CHARACTER_OPTIONS.facialHair, profile.facialHair)}</div></fieldset>
    <fieldset><legend>Resting expression</legend><div class="character-choice-grid">${choiceButtons('face', CHARACTER_OPTIONS.faces, profile.face)}</div></fieldset>
    <fieldset><legend>Gaze test</legend><div class="character-facing-strip">${FACING_OPTIONS.map((option) => `<button class="${option.id === previewLook ? 'is-active' : ''}" type="button" data-character-look="${option.id}" title="${option.label}" aria-label="Look ${option.label.toLowerCase()}">${option.mark}</button>`).join('')}</div></fieldset>`
}

function hairPanel(profile) {
  const shortCuts = CURATED_CREATOR_HAIR_STYLES.filter((style) => style.traditional === 'masculine')
  const styledHair = CURATED_CREATOR_HAIR_STYLES.filter((style) => style.traditional === 'feminine')
  return `<div class="character-panel-heading"><span>Curated silhouettes</span><h3>Choose one complete hairstyle</h3><p>Eleven representative painted styles replace the separate texture-and-cut grids: four short cuts and seven longer, curly, braided, or tied looks.</p></div>
    <fieldset><legend>Short cuts</legend><div class="character-choice-grid hair-grid-short">${choiceButtons('hairStyle', shortCuts, profile.hairStyle)}</div></fieldset>
    <fieldset><legend>Long, curly &amp; styled</legend><div class="character-choice-grid hair-grid-styled">${choiceButtons('hairStyle', styledHair, profile.hairStyle)}</div></fieldset>
    <fieldset><legend>Hair color</legend><div class="character-choice-grid swatch-grid">${choiceButtons('hairColor', CHARACTER_OPTIONS.hairColors, profile.hairColor, { swatches: true })}</div></fieldset>`
}

function wardrobeResults(state, view) {
  const garments = selectWardrobeGarments(state, view)
  const wornProfile = wardrobeTryOnState(state, view.tryOnIds, view.tryOnEmptySlots, view.atelierLevel).profile
  const pages = Math.max(1, Math.ceil(garments.length / WARDROBE_PAGE_SIZE))
  view.page = Math.max(0, Math.min(view.page || 0, pages - 1))
  const visible = garments.slice(view.page * WARDROBE_PAGE_SIZE, (view.page + 1) * WARDROBE_PAGE_SIZE)
  const drawers = [
    ['top', 'The hanging rail', 'Shirts, blouses & dresses'], ['outerwear', 'The coat rail', 'Layers for your shirt'],
    ['bottom', 'The folded drawer', 'Trousers & skirts'], ['apron', 'The workroom drawer', 'Aprons & maker wear'],
    ['shoes', 'The shoe shelf', 'Pairs, polished & ready'], ['accessory', 'The keepsake tray', 'Small finishing touches'],
  ]
  return `<div class="wardrobe-results-heading"><span role="status" aria-live="polite">${garments.length ? `${view.page * WARDROBE_PAGE_SIZE + 1}–${Math.min((view.page + 1) * WARDROBE_PAGE_SIZE, garments.length)} of ${garments.length} pieces` : 'No matching pieces'}</span>${view.search || view.theme !== 'all' || view.activeSlot !== 'all' ? '<button type="button" data-wardrobe-clear>Clear filters</button>' : ''}</div>
    <div class="wardrobe-chest">${drawers.map(([slot, label, hint]) => {
      const pieces = visible.filter((garment) => garment.slot === slot)
      if (!pieces.length) return ''
      return `<section class="wardrobe-drawer" data-wardrobe-drawer="${slot}" aria-label="${label}"><header><span><b>${label}</b><small>${hint}</small></span><i aria-hidden="true"></i></header><div class="character-garment-grid">${pieces.map((garment) => garmentCard(garment, slot === 'accessory' ? wornProfile.accessories?.[accessoryEquipmentZone(garment)] === garment.id : wornProfile.equipped[slot] === garment.id, { owned: state.wardrobe.includes(garment.id), trying: view.tryOnIds.includes(garment.id), preview: view.scope === 'catalogue' })).join('')}</div></section>`
    }).join('') || '<div class="wardrobe-empty"><b>Nothing in this drawer yet</b><p>Try a different name, color, material or collection.</p><button type="button" data-wardrobe-clear>Show all pieces</button></div>'}</div>
    ${pages > 1 ? `<nav class="wardrobe-pagination" aria-label="Clothing pages"><button type="button" data-wardrobe-page="${view.page - 1}" ${view.page === 0 ? 'disabled' : ''}>Previous</button><span>Page ${view.page + 1} of ${pages}</span><button type="button" data-wardrobe-page="${view.page + 1}" ${view.page + 1 === pages ? 'disabled' : ''}>Next</button></nav>` : ''}`
}

function clothesPanel(state, view) {
  const { activeSlot } = view
  const equippedId = state.profile.equipped[activeSlot]
  const equippedGarment = findGarment(state, equippedId)
  const alterable=equippedGarment && (view.canAlterGarment?.(equippedGarment) ?? true)
  const fittedProfile = wardrobeTryOnState(state, view.tryOnIds, view.tryOnEmptySlots, view.atelierLevel).profile
  const optionalEquippedId = fittedProfile.equipped[activeSlot]
  const setBonuses = wardrobeSetBonuses(state)
  const equippedAccessories = Object.entries(fittedProfile.accessories || {}).map(([zone, id]) => ({ zone, garment: findGarment(state, id) })).filter((entry) => entry.garment)
  return `<div class="character-panel-heading character-clothes-heading"><span>Threads collected, stories made</span><h3>Your clothing chest</h3><p>Open a drawer, find a favorite, and layer it your way. Only collected pieces and catalogue designs unlocked at your atelier level are shown. Try on unlocked designs, then collect them at the boutique or make your own.</p></div>
    <div class="wardrobe-tools"><label class="wardrobe-search"><span>Find a piece</span><input type="search" value="${escapeHtml(view.search)}" data-wardrobe-search placeholder="Search name, color, fabric, style…" aria-label="Search clothing" /></label><div class="wardrobe-filter-row"><label>Browse<select data-wardrobe-filter="scope"><option value="owned" ${view.scope === 'owned' ? 'selected' : ''}>In my chest</option><option value="catalogue" ${view.scope === 'catalogue' ? 'selected' : ''}>Unlocked catalogue · try on</option></select></label><label>Collection<select data-wardrobe-filter="theme">${WARDROBE_THEMES.map(([key, label]) => `<option value="${key}" ${view.theme === key ? 'selected' : ''}>${label}</option>`).join('')}</select></label><label>Sort<select data-wardrobe-filter="sort">${[['name','Name'],['quality','Quality'],['price','Price'],['handmade','Handmade first']].map(([key,label]) => `<option value="${key}" ${view.sort === key ? 'selected' : ''}>${label}</option>`).join('')}</select></label></div></div>
    <nav class="character-slot-tabs wardrobe-slot-tabs" aria-label="Garment slots"><button type="button" data-garment-slot="all" aria-pressed="${activeSlot === 'all'}" class="${activeSlot === 'all' ? 'is-active' : ''}"><b>All pieces</b><small>The whole chest</small></button>${GARMENT_SLOTS.map((slot) => `<button class="${slot === activeSlot ? 'is-active' : ''}" type="button" data-garment-slot="${slot}" aria-pressed="${slot === activeSlot}"><b>${SLOT_COPY[slot][0]}</b><small>${SLOT_COPY[slot][1]}</small></button>`).join('')}</nav>
    ${activeSlot === 'accessory' ? `<div class="character-accessory-zones">${ACCESSORY_EQUIPMENT_ZONES.map((zone) => { const entry = equippedAccessories.find((item) => item.zone === zone); return `<span class="${entry ? 'is-filled' : ''}"><small>${zone}</small><b>${escapeHtml(entry?.garment?.name || 'Empty')}</b>${entry ? `<button type="button" data-unequip-slot="accessory:${zone}" aria-label="Remove ${escapeHtml(entry.garment.name)}">×</button>` : ''}</span>` }).join('')}</div>` : ''}
    <div data-wardrobe-results>${wardrobeResults(state, { ...view, slot: activeSlot })}</div>
    ${['apron', 'outerwear'].includes(activeSlot) ? `<button class="character-garment is-remove ${optionalEquippedId ? '' : 'is-equipped'}" type="button" data-unequip-slot="${activeSlot}" aria-pressed="${!optionalEquippedId}"><span aria-hidden="true">×</span><b>Wear none</b><small>${activeSlot === 'outerwear' ? 'Keep your shirt; remove the outer layer' : 'Clear this optional layer'}</small></button>` : ''}
    <div class="character-set-strip">${setBonuses.length ? setBonuses.map((set) => `<span class="${set.active ? 'is-active' : ''}"><i>${set.mark}</i><b>${escapeHtml(set.name)}</b><small>${set.count}/3 · ${set.complete ? set.full : set.active ? set.twoPiece : 'Add one more piece'}</small></span>`).join('') : '<span><i>◇</i><b>No set started</b><small>Mix freely, or collect two matching pieces for a bonus.</small></span>'}</div>
    <div class="character-fashion-bridge"><span aria-hidden="true">✂</span><span><b>Make something original</b><small>Tailored pieces keep their cut, cloth, finishing, alterations, quality, and provenance.</small></span><span class="character-fashion-actions">${alterable ? `<button type="button" data-alter-garment="${equippedGarment.id}">Alter selected</button>` : ''}<button type="button" data-start-tailoring>${view.fashionProject?.started && !view.fashionProject?.completed ? 'Resume project' : 'New project'}</button></span></div>`
}

function detailsPanel(state) {
  const activeSets = wardrobeSetBonuses(state).filter((set) => set.active)
  return `<div class="character-panel-heading"><span>Identity</span><h3>Inspect the saved recipe</h3><p>This same saved recipe drives the creator portrait, neighborhood avatar, and customer system.</p></div>
    <div class="character-modular-contract"><span><i>1</i><b>One skull</b><small>All parts share a 240 × 240 coordinate space.</small></span><span><i>2</i><b>Independent slots</b><small>Face, eyes, brows, nose, mouth, complexion, hair, and palettes swap separately.</small></span><span><i>3</i><b>One collar</b><small>The jaw and neck anchor is identical for every outfit.</small></span></div>
    <fieldset><legend>Pronouns</legend><div class="character-choice-grid">${choiceButtons('pronouns', CHARACTER_OPTIONS.pronouns, state.profile.pronouns)}</div></fieldset>
    <div class="character-rig-card"><span><small>Identity controls</small><b>${Object.values(CHARACTER_OPTIONS).reduce((total, options) => total + options.length, 0)}</b></span><span><small>Equipment anchors</small><b>${GARMENT_SLOTS.length - 1 + ACCESSORY_EQUIPMENT_ZONES.length}</b></span><span><small>Handmade pieces</small><b>${state.customGarments.length}</b></span><span><small>Active set bonuses</small><b>${activeSets.length}</b></span></div>
    <div class="character-layer-map"><b>Live layer stack</b><p>Rear hair → painted body and clothes → shared neck → ears → face → complexion → eyes → brows → nose → mouth → facial hair → front hair → accessories</p><span>Personal avatars and procedural NPCs serialize the same recipe. There are no per-head offsets or hidden portrait crops.</span></div>`
}

function panelMarkup(panel, state, view, previewLook) {
  if (panel === 'face') return facePanel(state.profile, previewLook)
  if (panel === 'hair') return hairPanel(state.profile)
  if (panel === 'clothes') return clothesPanel(state, view)
  if (panel === 'details') return detailsPanel(state)
  return facePanel(state.profile, previewLook)
}

function creatorMarkup(state, view) {
  const { profile } = state
  const fitted = wardrobeTryOnState(state, view.tryOnIds, view.tryOnEmptySlots, view.atelierLevel)
  const appearance = characterToActorAppearance(fitted)
  const trying = view.tryOnIds.length || view.tryOnEmptySlots.length
  const faceFocus = view.previewMode === 'face'
  return `<section class="character-creator" aria-labelledby="characterCreatorTitle">
    <header class="character-creator-heading">
      <div><span class="hub-drawer-eyebrow">Modular cartoon character studio</span><h2 id="characterCreatorTitle" tabindex="-1">Create your character</h2><p>Build feature by feature. Every face and hair part shares one coordinate system, while the painted wardrobe remains completely independent.</p></div>
      <span class="character-save-note"><i aria-hidden="true">✓</i> Saved locally</span>
    </header>

    <nav class="character-section-tabs" aria-label="Character sections">${CREATOR_PANELS.map((panel) => `<button class="${panel.id === view.panel ? 'is-active' : ''}" type="button" data-character-panel="${panel.id}"><i aria-hidden="true">${panel.mark}</i><span>${panel.label}</span></button>`).join('')}</nav>

    <div class="character-creator-layout">
      <section class="character-preview-card" aria-label="Character preview">
        <div class="character-preview-mode" aria-label="Preview framing">
          <button class="${faceFocus ? 'is-active' : ''}" type="button" data-character-preview="face" aria-pressed="${faceFocus}"><span aria-hidden="true">☺</span>Face close-up</button>
          <button class="${faceFocus ? '' : 'is-active'}" type="button" data-character-preview="full" aria-pressed="${!faceFocus}"><span aria-hidden="true">♙</span>Full outfit</button>
        </div>
        <div class="character-preview-scene is-portrait ${faceFocus ? 'is-face-focus' : 'is-full-look'}">
          <div class="character-preview-actor character-stationary-avatar">
            ${renderPaintedPaperDoll(profile, appearance, { className: 'character-paper-doll', label: `${profile.name} independently layered painted outfit`, lookDirection: view.look })}
          </div>
          <span class="character-preview-scale">Layered fit · top · outerwear · bottom · apron · shoes · details</span>
        </div>
        <div class="character-preview-caption"><label class="character-preview-name"><small>Character name</small><span><input type="text" maxlength="24" value="${escapeHtml(profile.name)}" data-character-name aria-label="Character name" /><button type="button" data-save-character-name>Save</button></span></label><span><small>Build</small><b>Custom modular</b></span></div>
        ${trying ? `<div class="wardrobe-try-on" role="status"><b>Fitting-room outfit</b><span>Preview only · Your worn outfit is unchanged.</span><div class="wardrobe-fitting-pieces">${view.tryOnIds.map((id) => `<button type="button" data-wardrobe-untry="${escapeHtml(id)}" aria-label="Stop trying on ${escapeHtml(findGarment(state, id)?.name || 'this piece')}">${escapeHtml(findGarment(state, id)?.name || 'Catalogue piece')} <i aria-hidden="true">×</i></button>`).join('')}${view.tryOnEmptySlots.map((slot) => `<span>Without ${escapeHtml(slot.replace('accessory:', ''))}</span>`).join('')}</div><button type="button" data-wardrobe-restore>Restore worn outfit</button></div>` : ''}
        <div class="character-fit-note"><b>Universal part and wardrobe fit</b><span>Every head uses the same eye line, jaw, neck, and collar anchor. Every outfit uses the same torso, hip, apron, foot, and accessory anchors.</span></div>
        <div class="character-equipped" aria-label="${trying ? 'Fitting-room layers' : 'Worn layers'}">${equippedMarkup(fitted)}</div>
      </section>

      <section class="character-controls" data-character-panel-content>${panelMarkup(view.panel, state, view, view.look)}</section>
    </div>

    <footer class="character-creator-actions"><button type="button" class="character-reset" data-reset-character>Reset character</button><span>Appearance saves immediately; use Save beside a new name.</span><button type="button" class="hub-drawer-primary character-done" data-character-done>Done</button></footer>
  </section>`
}

export function createCharacterCreator({
  container,
  store,
  onAppearanceChange = () => {},
  onDone = () => {},
  onStartTailoring = () => {},
  onAlterGarment = () => {},
  getAtelierLevel = () => 1,
  getFashionProject = () => null,
  canAlterGarment = () => true,
} = {}) {
  let isOpen = false
  const view = { panel: 'face', previewMode: 'face', activeSlot: 'all', look: 'down', search: '', scope: 'owned', theme: 'all', sort: 'name', page: 0, tryOnIds: [], tryOnEmptySlots: [] }

  function render(state = store.snapshot()) {
    if (!container || !isOpen) return
    view.atelierLevel = getAtelierLevel()
    view.fashionProject = getFashionProject()
    view.canAlterGarment = canAlterGarment
    container.innerHTML = creatorMarkup(state, view)
  }

  const unsubscribe = store.subscribe((state) => {
    view.tryOnIds = []; view.tryOnEmptySlots = []
    const appearance = characterToActorAppearance(state)
    onAppearanceChange(appearance, state)
    document.dispatchEvent(new CustomEvent(CHARACTER_CHANGED_EVENT, {
      detail: { profile: state.profile, appearance, sets: wardrobeSetBonuses(state), equippedGarments: GARMENT_SLOTS.map(slot=>findGarment(state,state.profile.equipped[slot])).filter(Boolean) },
    }))
    render(state)
  })

  function handleClick(event) {
    if (!isOpen) return
    const fitting = event.target.closest('[data-preview-garment]')
    if (fitting) {
      const id = fitting.dataset.previewGarment
      const garment = findGarment(store.snapshot(), id)
      view.tryOnIds = addWardrobeTryOn(store.snapshot(), view.tryOnIds, id, getAtelierLevel())
      if (garment) view.tryOnEmptySlots = view.tryOnEmptySlots.filter((slot) => slot !== wardrobeFittingSlot(garment))
      render()
      if (globalThis.matchMedia?.('(max-width: 700px)').matches) container?.querySelector('[aria-label="Character preview"]')?.scrollIntoView?.({ block:'start', behavior:'smooth' })
      return
    }
    if (event.target.closest('[data-wardrobe-restore]')) { view.tryOnIds = []; view.tryOnEmptySlots = []; render(); return }
    const untry = event.target.closest('[data-wardrobe-untry]')
    if (untry) { view.tryOnIds = view.tryOnIds.filter((id) => id !== untry.dataset.wardrobeUntry); render(); return }
    if (event.target.closest('[data-wardrobe-clear]')) { Object.assign(view, { search: '', theme: 'all', activeSlot: 'all', page: 0 }); render(); return }
    const page = event.target.closest('[data-wardrobe-page]')
    if (page) { view.page = Number(page.dataset.wardrobePage) || 0; refreshWardrobeResults(); return }
    const saveName = event.target.closest('[data-save-character-name]')
    if (saveName) {
      const input = container?.querySelector('[data-character-name]')
      if (input) store.updateProfile({ name: input.value })
      return
    }
    const choice = event.target.closest('[data-character-field]')
    if (choice) {
      const update = { [choice.dataset.characterField]: choice.dataset.characterValue }
      if (choice.dataset.characterField === 'hairStyle' && choice.dataset.characterTexture) update.hairTexture = choice.dataset.characterTexture
      return void store.updateProfile(update)
    }
    const garment = event.target.closest('[data-equip-garment]')
    if (garment) return void store.equip(garment.dataset.equipGarment)
    const panel = event.target.closest('[data-character-panel]')
    if (panel) {
      view.panel = panel.dataset.characterPanel
      view.previewMode = ['face', 'hair'].includes(view.panel) ? 'face' : 'full'
      render()
      return
    }
    const preview = event.target.closest('[data-character-preview]')
    if (preview) { view.previewMode = preview.dataset.characterPreview; render(); return }
    const slot = event.target.closest('[data-garment-slot]')
    if (slot) { view.activeSlot = slot.dataset.garmentSlot; view.page = 0; render(); return }
    const remove = event.target.closest('[data-unequip-slot]')
    if (remove) {
      const slot = remove.dataset.unequipSlot
      if (view.scope === 'catalogue') {
        view.tryOnIds = view.tryOnIds.filter((id) => wardrobeFittingSlot(findGarment(store.snapshot(), id)) !== slot)
        view.tryOnEmptySlots = [...new Set([...view.tryOnEmptySlots, slot])]
        render()
        return
      }
      return void store.unequip(slot)
    }
    const motion = event.target.closest('[data-character-motion]')
    if (motion) { view.motion = motion.dataset.characterMotion; view.action = ''; render(); return }
    const action = event.target.closest('[data-character-action]')
    if (action) { view.action = action.dataset.characterAction; view.motion = 'idle'; render(); return }
    const facing = event.target.closest('[data-character-facing]')
    if (facing) { view.facing = facing.dataset.characterFacing; render(); return }
    const look = event.target.closest('[data-character-look]')
    if (look) { view.look = look.dataset.characterLook; render(); return }
    if (event.target.closest('[data-reset-character]')) {
      Object.assign(view, { panel: 'face', previewMode: 'face', activeSlot: 'top', look: 'down' })
      store.reset()
      return
    }
    const alter = event.target.closest('[data-alter-garment]')
    if (alter) {
      const selectedGarment = findGarment(store.snapshot(), alter.dataset.alterGarment)
      if (selectedGarment) onAlterGarment(selectedGarment)
      return
    }
    if (event.target.closest('[data-start-tailoring]')) onStartTailoring()
    if (event.target.closest('[data-character-done]')) onDone()
  }

  function handleChange(event) {
    if (!isOpen) return
    if (event.target.matches('[data-wardrobe-filter]')) {
      view[event.target.dataset.wardrobeFilter] = event.target.value
      view.page = 0
      refreshWardrobeResults()
      return
    }
    if (event.target.matches('[data-character-name]')) store.updateProfile({ name: event.target.value })
  }

  function refreshWardrobeResults() {
    view.atelierLevel = getAtelierLevel()
    const target = container?.querySelector('[data-wardrobe-results]')
    if (target) target.innerHTML = wardrobeResults(store.snapshot(), { ...view, slot: view.activeSlot })
  }

  function handleInput(event) {
    if (!isOpen || !event.target.matches('[data-wardrobe-search]')) return
    view.search = event.target.value
    view.page = 0
    // Replace only results: retain the input's focus/caret and unsaved name.
    refreshWardrobeResults()
  }
  container?.addEventListener?.('input', handleInput)

  const initialState = store.snapshot()
  const initialAppearance = characterToActorAppearance(initialState)
  onAppearanceChange(initialAppearance, initialState)
  document.dispatchEvent(new CustomEvent(CHARACTER_CHANGED_EVENT, {
    detail: { profile: initialState.profile, appearance: initialAppearance, sets: wardrobeSetBonuses(initialState), equippedGarments: GARMENT_SLOTS.map(slot=>findGarment(initialState,initialState.profile.equipped[slot])).filter(Boolean) },
  }))
  return Object.freeze({
    open({ panel = 'face', garmentId = null } = {}) {
      isOpen = true
      view.panel = CREATOR_PANELS.some(({ id }) => id === panel) ? panel : 'face'
      view.previewMode = ['face','hair'].includes(view.panel) ? 'face' : 'full'
      if(garmentId) {
        const garment=findGarment(store.snapshot(),garmentId)
        if(garment) Object.assign(view,{panel:'clothes',previewMode:'full',activeSlot:garment.slot,scope:'owned',theme:'all',search:garment.name,sort:'handmade',page:0,tryOnIds:[],tryOnEmptySlots:[]})
      }
      render()
      container?.querySelector('#characterCreatorTitle')?.focus({ preventScroll: true })
    },
    close() { isOpen = false; view.tryOnIds = []; view.tryOnEmptySlots = [] },
    handleClick,
    handleChange,
    addFashionResult(payload) { return store.addCrafted(payload) },
    refresh: () => render(),
    snapshot: () => store.snapshot(),
    destroy() {
      container?.removeEventListener?.('input', handleInput)
      unsubscribe()
    },
  })
}

