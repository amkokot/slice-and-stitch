export const CHARACTER_V2_RIG_ID = 'biped-v2'

export const DIRECTIONS = Object.freeze([
  'right', 'down-right', 'down', 'down-left',
  'left', 'up-left', 'up', 'up-right',
])

export const FRAME_PROFILES = Object.freeze({
  compact: Object.freeze({ torsoY: 0.95, legY: 0.9, shoulderX: 0.96, head: 1.02 }),
  average: Object.freeze({ torsoY: 1, legY: 1, shoulderX: 1, head: 1 }),
  tall: Object.freeze({ torsoY: 1.04, legY: 1.12, shoulderX: 0.98, head: 0.98 }),
  broad: Object.freeze({ torsoY: 1, legY: 0.98, shoulderX: 1.12, head: 1.01 }),
})

export const RIG_BONES = Object.freeze({
  root: Object.freeze({ parent: null, pivot: Object.freeze([160, 483]) }),
  pelvis: Object.freeze({ parent: 'root', pivot: Object.freeze([160, 285]) }),
  torso: Object.freeze({ parent: 'pelvis', pivot: Object.freeze([160, 280]) }),
  neck: Object.freeze({ parent: 'torso', pivot: Object.freeze([160, 180]) }),
  head: Object.freeze({ parent: 'neck', pivot: Object.freeze([160, 180]) }),
  'upper-arm.l': Object.freeze({ parent: 'torso', pivot: Object.freeze([112, 198]) }),
  'forearm.l': Object.freeze({ parent: 'upper-arm.l', pivot: Object.freeze([98, 264]) }),
  'hand.l': Object.freeze({ parent: 'forearm.l', pivot: Object.freeze([93, 320]) }),
  'upper-arm.r': Object.freeze({ parent: 'torso', pivot: Object.freeze([208, 198]) }),
  'forearm.r': Object.freeze({ parent: 'upper-arm.r', pivot: Object.freeze([220, 264]) }),
  'hand.r': Object.freeze({ parent: 'forearm.r', pivot: Object.freeze([227, 320]) }),
  'thigh.l': Object.freeze({ parent: 'pelvis', pivot: Object.freeze([139, 290]) }),
  'calf.l': Object.freeze({ parent: 'thigh.l', pivot: Object.freeze([136, 360]) }),
  'foot.l': Object.freeze({ parent: 'calf.l', pivot: Object.freeze([134, 453]) }),
  'thigh.r': Object.freeze({ parent: 'pelvis', pivot: Object.freeze([181, 290]) }),
  'calf.r': Object.freeze({ parent: 'thigh.r', pivot: Object.freeze([184, 360]) }),
  'foot.r': Object.freeze({ parent: 'calf.r', pivot: Object.freeze([186, 453]) }),
})

export function normalizeDirection(direction = 'down-right') {
  return DIRECTIONS.includes(direction) ? direction : 'down-right'
}

export function directionIndex(direction) {
  return DIRECTIONS.indexOf(normalizeDirection(direction))
}

export function directionFromVector(dx, dy, fallback = 'down-right') {
  const x = Number(dx) || 0
  const y = Number(dy) || 0
  if (Math.hypot(x, y) < 0.001) return normalizeDirection(fallback)
  const octant = Math.round(Math.atan2(y, x) / (Math.PI / 4))
  return DIRECTIONS[(octant + 8) % 8]
}

export function directionToView(direction) {
  const normalized = normalizeDirection(direction)
  if (normalized === 'down') return Object.freeze({ family: 'front', mirrored: false })
  if (normalized === 'down-right') return Object.freeze({ family: 'three-quarter', mirrored: false })
  if (normalized === 'down-left') return Object.freeze({ family: 'three-quarter', mirrored: true })
  if (normalized === 'right') return Object.freeze({ family: 'profile', mirrored: false })
  if (normalized === 'left') return Object.freeze({ family: 'profile', mirrored: true })
  if (normalized === 'up-right') return Object.freeze({ family: 'back-three-quarter', mirrored: false })
  if (normalized === 'up-left') return Object.freeze({ family: 'back-three-quarter', mirrored: true })
  return Object.freeze({ family: 'back', mirrored: false })
}

export function frameProfile(frame = 'average') {
  return FRAME_PROFILES[frame] || FRAME_PROFILES.average
}

