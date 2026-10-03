import { SCENE_CHARACTER_LAYOUT } from './scene-character-layout.js'

// Actors and hotspots retain the painting's coordinates in every window size.
export function fitRoomToPanel(sceneId, width, height) {
  const scene = SCENE_CHARACTER_LAYOUT[sceneId] || SCENE_CHARACTER_LAYOUT.street
  const scale = Math.min(Math.max(1, width) / scene.width, Math.max(1, height) / scene.height)
  return { width: scene.width * scale, height: scene.height * scale }
}

export function gameDialogBounds({ left, top, width, height }, inset = 12) {
  return {
    centerX: left + width / 2, centerY: top + height / 2,
    width: Math.max(1, width - inset * 2), height: Math.max(1, height - inset * 2),
  }
}

export function createGamePanel(appShell, worldShell) {
  const panel = document.createElement('section')
  panel.className = 'game-panel'
  panel.dataset.mode = 'hub'
  panel.setAttribute('aria-label', 'Slice & Stitch game')
  document.body.insertBefore(panel, appShell)
  const backdrop = document.createElement('div')
  backdrop.className = 'game-panel-backdrop'
  backdrop.setAttribute('aria-hidden', 'true')
  const hud = worldShell.querySelector('.hub-topbar')
  panel.append(backdrop, hud, worldShell, appShell)

  // Reparent existing elements instead of replacing them: keep their listeners,
  // the paid project, and the in-progress canvas intact when changing rooms.
  for (const card of appShell.querySelectorAll('.play-card')) {
    const surface = document.createElement('div')
    surface.className = 'workshop-surface'
    surface.append(card.querySelector('.canvas-wrap'))
    const tools = document.createElement('div')
    tools.className = 'workshop-tools'
    for (const child of [...card.children]) {
      if (child.id !== 'pizzaOrderTicket' && !child.classList.contains('workbench-continuation')) tools.append(child)
    }
    card.append(surface, tools)
    const continuation=card.querySelector('.workbench-continuation')
    if(continuation) surface.after(continuation)
  }
  const ticket = appShell.querySelector('#pizzaOrderTicket')
  appShell.querySelector('#pizzaActivity .instruction-card').before(ticket)

  const patternBoard = appShell.querySelector('.fashion-pattern-board')
  const patternDrawer = document.createElement('details')
  patternDrawer.className = 'workshop-pattern-drawer'
  const patternHandle = document.createElement('summary')
  patternHandle.textContent = 'Design options'
  patternBoard.before(patternDrawer)
  patternDrawer.append(patternHandle, patternBoard)
  const syncPatternDrawer = () => { patternDrawer.hidden = patternBoard.hidden }
  new MutationObserver(syncPatternDrawer).observe(patternBoard, { attributes: true, attributeFilter: ['hidden'] })
  syncPatternDrawer()
  appShell.addEventListener('click', event => {
    if (event.target.closest('[data-fabric]')) patternDrawer.open = false
  })
  for (const dialog of document.querySelectorAll('body > dialog')) panel.append(dialog)

  let sceneId = 'street'
  const sceneCard = worldShell.querySelector('.hub-scene-card')
  const roomArea = worldShell.querySelector('.hub-main')
  function measure() {
    if (!worldShell.hidden) {
      const fitted = fitRoomToPanel(sceneId, roomArea.clientWidth, roomArea.clientHeight)
      sceneCard.style.width = `${fitted.width}px`
      sceneCard.style.height = `${fitted.height}px`
    }
    const rect = panel.getBoundingClientRect()
    const modal = gameDialogBounds(rect)
    // Native modals retain keyboard trapping but live over this game frame.
    const values = {
      '--game-modal-x': `${modal.centerX}px`, '--game-modal-y': `${modal.centerY}px`,
      '--game-modal-width': `${modal.width}px`, '--game-modal-height': `${modal.height}px`,
      '--game-frame-top': `${rect.top}px`, '--game-frame-left': `${rect.left}px`,
      '--game-frame-right': `${Math.max(0, innerWidth - rect.right)}px`,
      '--game-frame-bottom': `${Math.max(0, innerHeight - rect.bottom)}px`,
    }
    for (const [name, value] of Object.entries(values)) document.documentElement.style.setProperty(name, value)
  }
  new ResizeObserver(measure).observe(panel)
  window.addEventListener('resize', measure)
  return {
    panel, hud,
    setScene(scene) {
      sceneId = scene.id
      panel.dataset.scene = scene.id
      backdrop.style.backgroundImage = `url("${scene.art}")`
      measure()
    },
    setMode(mode, workshop) {
      panel.dataset.mode = mode
      if (mode === 'workshop') patternDrawer.open = false
      measure()
    },
  }
}
