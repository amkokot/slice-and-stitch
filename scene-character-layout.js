// Landmarks are in the original painting's coordinate space, not the viewport.
// The actor plane follows background cover, so resizing cannot move a person
// away from their stool or floor tile. Heights are fractions of painting width.
export const SCENE_CHARACTER_LAYOUT = Object.freeze({
  street: Object.freeze({ width: 1030, height: 1024, positionY: .58, standing: .145, player: .16 }),
  restaurant: Object.freeze({ width: 1672, height: 941, positionY: .5, standing: .25, player: .295, seated: .185 }),
  kitchen: Object.freeze({ width: 1672, height: 941, positionY: .5, standing: .25, player: .31 }),
  tailor: Object.freeze({ width: 1672, height: 941, positionY: .5, standing: .25, player: .295 }),
  boutique: Object.freeze({ width: 1672, height: 941, positionY: .5, standing: .245, player: .285 }),
  home: Object.freeze({ width: 512, height: 512, positionY: .5, standing: .24, player: .35 }),
})

export const COUNTER_SEATS = Object.freeze([28.9, 39.2, 50.5, 62, 73.4].map(x => Object.freeze({ x, y: 49.8 })))

export function sceneCharacterPlane(sceneId, width, height) {
  const scene = SCENE_CHARACTER_LAYOUT[sceneId] || SCENE_CHARACTER_LAYOUT.restaurant
  const factor = Math.max(Math.max(1, width) / scene.width, Math.max(1, height) / scene.height)
  const planeWidth = scene.width * factor
  const planeHeight = scene.height * factor
  return Object.freeze({ width: planeWidth, height: planeHeight, left: (width - planeWidth) / 2, top: (height - planeHeight) * scene.positionY })
}

const VENDOR_HEIGHTS = Object.freeze({ mara: .27, luna: .245, 'sofia-counter': .235 })
export function seatedPoseFrame(action = '') {
  action = String(action || '').toLowerCase()
  if (['eat', 'eating', 'served'].includes(action)) return 3
  if (['stand', 'leave', 'leaving'].includes(action)) return 4
  if (['order', 'ordering'].includes(action)) return 1
  return !action || action === 'none' ? 0 : 2
}

// Contact with the cushion, measured separately in each authored atlas cell.
// A gesture changes the drawing's registration, not the physical stool position.
export const SEATED_POSE_LANDMARKS = Object.freeze([
  [[.50, .74], [.50, .77], [.50, .72], [.47, .64]],
  [[.51, .75], [.55, .73], [.55, .70], [.54, .65]],
  [[.545, .75], [.58, .73], [.59, .70], [.63, .65]],
  [[.52, .70], [.51, .71], [.52, .72], [.55, .70]],
  [[.51, .70], [.53, .71], [.55, .72], [.59, .70]],
].map(frame => Object.freeze(frame.map(([center, anchor]) => Object.freeze({ center, anchor })))))

// The painting is not an exact regular grid: boots cross nominal row borders
// and the silver hair begins before the fourth row. Crop the authored cells,
// not an assumed 25% strip. These are source PNG pixel coordinates.
const SEATED_CELL_BOUNDS = Object.freeze([
  [[0, 332], [334, 644], [645, 948], [952, 1258]],
  [[0, 333], [338, 644], [646, 949], [954, 1259]],
  [[0, 334], [338, 644], [646, 949], [954, 1259]],
  [[0, 340], [340, 649], [649, 953], [954, 1282]],
  [[0, 344], [344, 661], [647, 961], [954, 1286]],
].map(frame => Object.freeze(frame.map(bounds => Object.freeze(bounds)))))

export function seatedSpriteCell(row, action = '') {
  const frame = seatedPoseFrame(action)
  const landmark = SEATED_POSE_LANDMARKS[frame][row]
  const [top, bottom] = SEATED_CELL_BOUNDS[frame][row]
  const height = bottom - top
  const uniformRowHeight = 1286 / 4
  return Object.freeze({
    frame, center: landmark.center,
    anchor: (row * uniformRowHeight + landmark.anchor * uniformRowHeight - top) / height,
    top, height, atlasHeight: 1286,
    heightScale: height / uniformRowHeight,
  })
}

export function characterSceneFit(sceneId, actor, spec, plane) {
  const scene = SCENE_CHARACTER_LAYOUT[sceneId] || SCENE_CHARACTER_LAYOUT.restaurant
  const player = actor.role === 'player'
  const seated = spec?.kind === 'seated'
  const vendorHeight = VENDOR_HEIGHTS[actor.id]
  const referenceScale = player ? 1.05 : seated ? 1.08 : 1
  const variation = vendorHeight ? 1 : Math.min(1.12, Math.max(.9, (actor.scale || referenceScale) / referenceScale))
  const depth = seated || vendorHeight || sceneId === 'home' ? 1 : Math.min(1.08, Math.max(.88, 1 + (actor.y - (sceneId === 'street' ? 80 : 82)) * .006))
  const seat = seated ? seatedSpriteCell(spec.row, actor.action) : null
  const height = plane.width * (vendorHeight || (player ? scene.player : seated ? scene.seated : scene.standing)) * variation * depth * (seat ? seat.heightScale : 1) * (player ? Math.min(1,Math.max(.6,actor.sessionScale || 1)) : 1)
  const anchor = player ? .92 : seat ? seat.anchor : .98
  const center = seat ? seat.center : .5
  const width = height * (player ? 2 / 3 : spec ? spec.width / spec.height : 46 / 78)
  // Sofia's lower body belongs behind the painted bar. Clip only her sprite,
  // not customers, clothing layers or the whole actor overlay.
  const top = actor.y / 100 * plane.height - anchor * height
  const hiddenBelowCounter = actor.id === 'sofia-counter'
    ? Math.max(0, top + height - .448 * plane.height) : 0
  return Object.freeze({ width, height, anchor, center, seat: seated ? Object.freeze({ width: plane.width * .05, height: plane.height * .011 }) : null, clipBottom: hiddenBelowCounter, depth: actor.id === 'sofia-counter' ? 300 : seated ? 493 : Math.round(actor.y * 10) })
}
