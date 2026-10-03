const ART_SHEETS = Object.freeze({
  cast: Object.freeze({
    src: '../assets/characters-v3/cast-lineup-v1.png',
    alt: 'Four painted Slice and Stitch characters in detailed workwear and fashion outfits',
    kicker: 'Shared visual language',
    label: 'Four distinct neighbors, one coherent cast',
    note: 'Painterly faces, mature anatomy, cloth texture, seams, hardware, pockets, drape, and wear all survive at character scale.',
  }),
  turnaround: Object.freeze({
    src: '../assets/characters-v3/hero-turnaround-v1.png',
    alt: 'Five-direction painted turnaround of the same Slice and Stitch character',
    kicker: 'Directional registration',
    label: 'One identity across front, three-quarter, profile, and back',
    note: 'The apron straps, waist ties, trouser pockets, hair mass, shoe heels, and construction lines resolve correctly in every view.',
  }),
  wardrobe: Object.freeze({
    src: '../assets/characters-v3/hero-wardrobe-v1.png',
    alt: 'The same painted character wearing five detailed fashion catalog outfits',
    kicker: 'Equipment silhouette test',
    label: 'Five outfits without body, face, or pose drift',
    note: 'Counter Classic, Garden Market, Plum Atelier, Midnight Rush, and Maker Studio use the game’s actual garment vocabulary.',
  }),
  expression: Object.freeze({
    src: '../assets/characters-v3/hero-expression-gaze-v1.png',
    alt: 'Eight painted facial animation states showing gaze, blink, talk, and laugh',
    kicker: 'Independent facial animation',
    label: 'Gaze, blink, talk, and emotion without turning the body',
    note: 'Pupils, eyelids, brows, cheeks, and mouth shapes are authored as a registered face layer over the directional head art.',
  }),
})

const DIRECTION_FRAMES = Object.freeze({
  down: { frame: '0%', mirror: false, label: 'Front' },
  'down-right': { frame: '25%', mirror: false, label: 'Front three-quarter · right' },
  right: { frame: '50%', mirror: false, label: 'Profile · right' },
  'up-right': { frame: '75%', mirror: false, label: 'Back three-quarter · right' },
  up: { frame: '100%', mirror: false, label: 'Back' },
  'up-left': { frame: '75%', mirror: true, label: 'Back three-quarter · left' },
  left: { frame: '50%', mirror: true, label: 'Profile · left' },
  'down-left': { frame: '25%', mirror: true, label: 'Front three-quarter · left' },
})

const LOOKS = Object.freeze({
  counter: { frame: '0%', label: 'Counter Classic', copy: 'Henley · service apron · work trouser · canvas sneaker' },
  garden: { frame: '25%', label: 'Garden Market', copy: 'Pintuck blouse · chore jacket · botanical midi · scarf · satchel · loafer' },
  plum: { frame: '50%', label: 'Plum Atelier', copy: 'Cable cardigan · rib camisole · knife pleat skirt · brooch · ankle boot' },
  midnight: { frame: '75%', label: 'Midnight Rush', copy: 'Oxford shirt · tailored waistcoat · peg trouser · necktie · loafer' },
  maker: { frame: '100%', label: 'Maker Studio', copy: 'Chore jacket · tool-roll apron · denim trouser · tape · kitchen clog' },
})

const EXPRESSIONS = Object.freeze({
  center: { col: '0%', row: '0%', label: 'Neutral · center gaze' },
  left: { col: '33.333%', row: '0%', label: 'Neutral · left gaze' },
  right: { col: '66.667%', row: '0%', label: 'Neutral · right gaze' },
  up: { col: '100%', row: '0%', label: 'Neutral · upward gaze' },
  down: { col: '0%', row: '100%', label: 'Neutral · downward gaze' },
  blink: { col: '33.333%', row: '100%', label: 'Natural blink' },
  talk: { col: '66.667%', row: '100%', label: 'Talk phoneme' },
  laugh: { col: '100%', row: '100%', label: 'Delighted laugh' },
})

const reviewStage = document.querySelector('[data-review-stage]')
const reviewImage = document.querySelector('[data-review-image]')

function selectButton(container, selected) {
  container?.querySelectorAll('button').forEach((button) => button.classList.toggle('is-active', button === selected))
}

function showArtSheet(key, button) {
  const sheet = ART_SHEETS[key]
  if (!sheet) return
  reviewStage.classList.add('is-changing')
  window.setTimeout(() => {
    reviewImage.src = sheet.src
    reviewImage.alt = sheet.alt
    document.querySelector('[data-review-kicker]').textContent = sheet.kicker
    document.querySelector('[data-review-label]').textContent = sheet.label
    document.querySelector('[data-review-note]').textContent = sheet.note
    reviewStage.classList.remove('is-changing')
  }, 100)
  selectButton(button.closest('[aria-label="Character art sheets"]'), button)
}

function showDirection(direction, button) {
  const pose = DIRECTION_FRAMES[direction]
  const windowElement = document.querySelector('[data-direction-window]')
  if (!pose || !windowElement) return
  windowElement.style.setProperty('--frame', pose.frame)
  windowElement.classList.toggle('is-mirrored', pose.mirror)
  windowElement.setAttribute('aria-label', `Character facing ${direction.replace('-', ' ')}`)
  document.querySelector('[data-direction-label]').textContent = pose.label
  selectButton(button.closest('[data-direction-controls]'), button)
}

function showLook(key, button) {
  const look = LOOKS[key]
  const windowElement = document.querySelector('[data-wardrobe-window]')
  if (!look || !windowElement) return
  windowElement.style.setProperty('--look', look.frame)
  windowElement.setAttribute('aria-label', `${look.label} outfit`)
  document.querySelector('[data-look-label]').textContent = look.label
  document.querySelector('[data-look-copy]').textContent = look.copy
  selectButton(button.closest('[data-wardrobe-controls]'), button)
}

function showExpression(key, button) {
  const expression = EXPRESSIONS[key]
  const windowElement = document.querySelector('[data-expression-window]')
  if (!expression || !windowElement) return
  windowElement.style.setProperty('--col', expression.col)
  windowElement.style.setProperty('--row', expression.row)
  windowElement.setAttribute('aria-label', expression.label)
  document.querySelector('[data-expression-label]').textContent = expression.label
  selectButton(button.closest('[data-expression-controls]'), button)
}

document.addEventListener('click', (event) => {
  const artButton = event.target.closest('[data-art-sheet]')
  const directionButton = event.target.closest('[data-direction]')
  const lookButton = event.target.closest('[data-look]')
  const expressionButton = event.target.closest('[data-expression]')
  if (artButton) showArtSheet(artButton.dataset.artSheet, artButton)
  if (directionButton) showDirection(directionButton.dataset.direction, directionButton)
  if (lookButton) showLook(lookButton.dataset.look, lookButton)
  if (expressionButton) showExpression(expressionButton.dataset.expression, expressionButton)
})
