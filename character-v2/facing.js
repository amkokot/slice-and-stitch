import {
  DIRECTIONS,
  directionFromVector,
  directionIndex,
  normalizeDirection,
} from './rig.js'

export const LOOK_PRIORITIES = Object.freeze({
  ambient: 1,
  hotspot: 2,
  dialogue: 3,
  task: 4,
})

function circularSteps(from, to) {
  const delta = Math.abs(directionIndex(from) - directionIndex(to))
  return Math.min(delta, DIRECTIONS.length - delta)
}

export function gazePose(facing, targetDirection) {
  const body = normalizeDirection(facing)
  const target = normalizeDirection(targetDirection || body)
  const bodyIndex = directionIndex(body)
  const targetIndex = directionIndex(target)
  let signedSteps = targetIndex - bodyIndex
  if (signedSteps > 4) signedSteps -= 8
  if (signedSteps < -4) signedSteps += 8
  const turnSteps = Math.abs(signedSteps)
  return Object.freeze({
    eyeX: Math.max(-3.4, Math.min(3.4, signedSteps * 1.3)),
    eyeY: target.includes('up') ? -1.7 : target.includes('down') ? 1.2 : 0,
    headRotation: Math.max(-8, Math.min(8, signedSteps * 3.2)),
    torsoRotation: turnSteps >= 2 ? Math.sign(signedSteps) * Math.min(5, (turnSteps - 1) * 2.2) : 0,
    needsTurn: turnSteps >= 3,
    turnDegrees: turnSteps === 4 ? 180 : turnSteps * 45,
  })
}

export function createFacingController({
  initialFacing = 'down-right',
  dwellMs = 110,
  turnDwellMs = 260,
} = {}) {
  let facing = normalizeDirection(initialFacing)
  let lookDirection = facing
  let target = null
  let pendingFacing = null
  let pendingSince = 0

  function consider(nextTarget = {}, now = 0) {
    const priority = LOOK_PRIORITIES[nextTarget.priority] || LOOK_PRIORITIES.ambient
    const currentPriority = target ? LOOK_PRIORITIES[target.priority] || LOOK_PRIORITIES.ambient : 0
    if (target && priority < currentPriority && now < target.expiresAt) return snapshot()

    const direction = nextTarget.direction || directionFromVector(nextTarget.dx, nextTarget.dy, facing)
    target = {
      direction,
      priority: nextTarget.priority || 'ambient',
      expiresAt: Number.isFinite(nextTarget.expiresAt) ? nextTarget.expiresAt : Infinity,
    }
    lookDirection = direction
    const pose = gazePose(facing, lookDirection)
    const shouldTurn = Boolean(nextTarget.forceFacing || nextTarget.moving || pose.needsTurn)

    if (!shouldTurn || direction === facing) {
      pendingFacing = null
      return snapshot()
    }

    if (pendingFacing !== direction) {
      pendingFacing = direction
      pendingSince = now
      return snapshot()
    }

    const requiredDwell = pose.needsTurn ? turnDwellMs : dwellMs
    if (now - pendingSince >= requiredDwell) {
      facing = direction
      pendingFacing = null
    }
    return snapshot()
  }

  function tick(now = 0) {
    if (target && now >= target.expiresAt) clear()
    return snapshot()
  }

  function clear() {
    target = null
    lookDirection = facing
    pendingFacing = null
    return snapshot()
  }

  function force(direction) {
    facing = normalizeDirection(direction)
    lookDirection = facing
    pendingFacing = null
    return snapshot()
  }

  function snapshot() {
    return Object.freeze({
      facing,
      lookDirection,
      gaze: gazePose(facing, lookDirection),
      pendingFacing,
      target: target ? Object.freeze({ ...target }) : null,
    })
  }

  return Object.freeze({ consider, tick, clear, force, snapshot })
}

export function directionChangeSize(from, to) {
  return circularSteps(from, to) * 45
}

