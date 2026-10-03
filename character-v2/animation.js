const TAU = Math.PI * 2

export const ANIMATION_CLIPS = Object.freeze({
  idle: Object.freeze({ duration: 3.8, loop: true, bones: Object.freeze(['root', 'torso', 'head']) }),
  walk: Object.freeze({ duration: 0.72, loop: true, bones: Object.freeze(['root', 'pelvis', 'upper-arm.l', 'upper-arm.r', 'thigh.l', 'thigh.r', 'calf.l', 'calf.r']) }),
  talk: Object.freeze({ duration: 1.7, loop: true, bones: Object.freeze(['head', 'upper-arm.r']) }),
  wave: Object.freeze({ duration: 1.2, loop: false, bones: Object.freeze(['upper-arm.r', 'forearm.r', 'hand.r']) }),
  carry: Object.freeze({ duration: 1, loop: true, bones: Object.freeze(['upper-arm.l', 'upper-arm.r', 'forearm.l', 'forearm.r']) }),
})

function transform(rotation = 0, x = 0, y = 0, scaleX = 1, scaleY = 1) {
  return Object.freeze({ rotation, x, y, scaleX, scaleY })
}

export function sampleRigPose({ motion = 'idle', action = null, time = 0, seed = 1, reducedMotion = false } = {}) {
  if (reducedMotion) return Object.freeze({})
  const pose = {}
  const phaseSeed = ((Number(seed) || 1) % 17) / 17

  if (motion === 'walk') {
    const phase = ((time / ANIMATION_CLIPS.walk.duration) + phaseSeed) * TAU
    const swing = Math.sin(phase)
    const lift = Math.max(0, Math.sin(phase * 2))
    pose.root = transform(0, 0, -2.6 * lift)
    pose.pelvis = transform(swing * 1.8, swing * 1.1, 0)
    pose['upper-arm.l'] = transform(swing * 17)
    pose['upper-arm.r'] = transform(-swing * 17)
    pose['thigh.l'] = transform(-swing * 18)
    pose['thigh.r'] = transform(swing * 18)
    pose['calf.l'] = transform(Math.max(0, swing) * 15)
    pose['calf.r'] = transform(Math.max(0, -swing) * 15)
    pose.head = transform(-swing * 1.2, 0, lift * 0.5)
  } else {
    const phase = ((time / ANIMATION_CLIPS.idle.duration) + phaseSeed) * TAU
    pose.root = transform(0, 0, Math.sin(phase) * -1.6)
    pose.torso = transform(Math.sin(phase) * 0.7, 0, 0, 1, 1 + Math.sin(phase) * 0.004)
    pose.head = transform(Math.sin(phase * 0.53) * 1.1)
  }

  if (action === 'wave') {
    const phase = Math.min(1, Math.max(0, time / ANIMATION_CLIPS.wave.duration))
    pose['upper-arm.r'] = transform(-64 + Math.sin(phase * Math.PI) * -8)
    pose['forearm.r'] = transform(-40 + Math.sin(phase * TAU * 2) * 18)
  } else if (action === 'carry') {
    pose['upper-arm.l'] = transform(-24)
    pose['upper-arm.r'] = transform(24)
    pose['forearm.l'] = transform(-58)
    pose['forearm.r'] = transform(58)
  } else if (action === 'talk') {
    const phase = (time / ANIMATION_CLIPS.talk.duration) * TAU
    pose.head = transform(Math.sin(phase) * 1.8)
    pose['upper-arm.r'] = transform(Math.sin(phase) * 5 - 4)
  }

  return Object.freeze(pose)
}

export function poseToCss(pose = {}) {
  return Object.fromEntries(Object.entries(pose).map(([bone, value]) => [bone, [
    `translate(${value.x || 0}px, ${value.y || 0}px)`,
    `rotate(${value.rotation || 0}deg)`,
    `scale(${value.scaleX ?? 1}, ${value.scaleY ?? 1})`,
  ].join(' ')]))
}

