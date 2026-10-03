import { generateNpcAppearance } from './character-v2/npc-generator.js'

const DEFAULT_CYCLE_MS = 48000

export const TOWN_DESTINATIONS = Object.freeze({
  tailor: Object.freeze({
    sceneId: 'tailor',
    label: 'Mara\'s tailor shop',
    streetDoor: Object.freeze({ x: 69, y: 76 }),
    roomDoor: Object.freeze({ x: 76, y: 84 }),
    activity: Object.freeze({ x: 38, y: 83, facing: 'down-left', lookDirection: 'left', action: 'browse' }),
  }),
  boutique: Object.freeze({
    sceneId: 'boutique',
    label: 'Luna boutique',
    streetDoor: Object.freeze({ x: 86, y: 77 }),
    roomDoor: Object.freeze({ x: 82, y: 83 }),
    activity: Object.freeze({ x: 67, y: 77, facing: 'down-left', lookDirection: 'left', action: 'browse' }),
  }),
})

export const TOWN_VISITOR_SCHEDULES = Object.freeze([
  Object.freeze({ id: 'olive', name: 'Olive', destination: 'tailor', trend: 'maker', level: 6, offset: 0, streetFrom: Object.freeze({ x: 34, y: 86 }), streetExit: Object.freeze({ x: 90, y: 80 }) }),
  Object.freeze({ id: 'ren', name: 'Ren', destination: 'boutique', trend: 'social', level: 7, offset: .48, streetFrom: Object.freeze({ x: 90, y: 79 }), streetExit: Object.freeze({ x: 10, y: 80 }) }),
  Object.freeze({ id: 'cass', name: 'Cass', destination: 'tailor', trend: 'garden', level: 5, offset: .73, activity: Object.freeze({ x: 73, y: 82 }), streetFrom: Object.freeze({ x: 67, y: 83 }), streetExit: Object.freeze({ x: 10, y: 82 }) }),
])

function clampCycle(value) {
  return ((value % 1) + 1) % 1
}

function routeTo(target, duration, extra = {}) {
  return Object.freeze({ x: target.x, y: target.y, duration: Math.max(2, duration), loop: false, ...extra })
}

function actorAt(schedule, appearance, phase, cycleMs) {
  const destination = TOWN_DESTINATIONS[schedule.destination]
  const activity = { ...destination.activity, ...schedule.activity }
  const base = {
    id: `town-${schedule.id}`,
    name: schedule.name,
    role: 'visitor',
    detailLevel: 'town',
    appearance,
    destination: schedule.destination,
  }
  if (phase < .34) {
    return Object.freeze({
      sceneId: 'street',
      stage: 'walking-to-shop',
      actor: Object.freeze({
        ...base,
        x: schedule.streetFrom.x,
        y: schedule.streetFrom.y,
        state: 'shopping-trip',
        route: routeTo(destination.streetDoor, cycleMs * .34 / 1000, { arrivalAction: 'wait', arrivalFacing: 'up' }),
      }),
    })
  }
  if (phase < .47) {
    return Object.freeze({
      sceneId: destination.sceneId,
      stage: 'entering-shop',
      actor: Object.freeze({
        ...base,
        x: destination.roomDoor.x,
        y: destination.roomDoor.y,
        state: 'entering-shop',
        route: routeTo(activity, cycleMs * .13 / 1000, { arrivalAction: activity.action, arrivalFacing: activity.facing }),
      }),
    })
  }
  if (phase < .72) {
    return Object.freeze({
      sceneId: destination.sceneId,
      stage: 'browsing',
      actor: Object.freeze({
        ...base,
        x: activity.x,
        y: activity.y,
        state: 'browsing',
        facing: destination.activity.facing,
        lookDirection: destination.activity.lookDirection,
        action: destination.activity.action,
        pose: 'shopper',
      }),
    })
  }
  if (phase < .84) {
    return Object.freeze({
      sceneId: destination.sceneId,
      stage: 'leaving-shop',
      actor: Object.freeze({
        ...base,
        x: activity.x,
        y: activity.y,
        state: 'leaving-shop',
        route: routeTo(destination.roomDoor, cycleMs * .12 / 1000, { arrivalFacing: 'down-right' }),
      }),
    })
  }
  return Object.freeze({
    sceneId: 'street',
    stage: 'walking-home',
    actor: Object.freeze({
      ...base,
      x: destination.streetDoor.x,
      y: destination.streetDoor.y,
      state: 'walking-home',
      route: routeTo(schedule.streetExit, cycleMs * .16 / 1000, { arrivalAction: 'idle' }),
    }),
  })
}

export function createTownPopulation({
  seed = 'day-1',
  cycleMs = DEFAULT_CYCLE_MS,
  schedules = TOWN_VISITOR_SCHEDULES,
  startedAt = 0,
} = {}) {
  const safeCycle = Math.max(16000, Number(cycleMs) || DEFAULT_CYCLE_MS)
  const visitors = schedules.map((schedule) => Object.freeze({
    schedule,
    appearance: generateNpcAppearance(`${seed}:${schedule.id}`, { role: 'customer', trend: schedule.trend, level: schedule.level }),
  }))

  function snapshot(now = 0) {
    const elapsed = Number(now) - Number(startedAt)
    return Object.freeze(visitors.map(({ schedule, appearance }) => {
      const phase = clampCycle(elapsed / safeCycle + schedule.offset)
      return actorAt(schedule, appearance, phase, safeCycle)
    }))
  }

  return Object.freeze({
    cycleMs: safeCycle,
    snapshot,
    stageSignature(now = 0) {
      return snapshot(now).map((entry) => `${entry.actor.id}:${entry.sceneId}:${entry.stage}`).join('|')
    },
  })
}
