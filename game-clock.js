// One real second = one town minute. Offline/hidden time is deliberately not
// passed into this clock: returning to the game never eats a player's day.
export const DAY_SECONDS = 24 * 60
export const DAY_START_MINUTE = 6 * 60
export const CLOCK_PHASES = Object.freeze([
  Object.freeze({id:'morning', label:'Morning', start:360, end:720, seconds:360}),
  Object.freeze({id:'noon', label:'Noon', start:720, end:1080, seconds:360}),
  Object.freeze({id:'dusk', label:'Dusk', start:1080, end:1320, seconds:240}),
  Object.freeze({id:'night', label:'Night', start:1320, end:360, seconds:480}),
])
const finite = (value, fallback=0) => Number.isFinite(Number(value)) ? Number(value) : fallback

export function createGameClock(saved, {day=1, phase='morning'}={}) {
  const legacyOffset = {morning:0, noon:360, dusk:720, night:960}[phase] || 0
  return {day:Math.max(1, Math.floor(finite(saved?.day, day))),
    elapsedSeconds:Math.max(0, Math.min(DAY_SECONDS-.001, finite(saved?.elapsedSeconds, legacyOffset))),
    paused:saved?.paused === true}
}

export function clockSnapshot(clock) {
  const minute = (DAY_START_MINUTE + Math.floor(clock.elapsedSeconds)) % 1440
  const phase = minute >= 360 && minute < 720 ? 'morning'
    : minute >= 720 && minute < 1080 ? 'noon' : minute >= 1080 && minute < 1320 ? 'dusk' : 'night'
  const meta = CLOCK_PHASES.find(item=>item.id===phase)
  return Object.freeze({...clock, phase, phaseLabel:meta.label,
    time:`${String(Math.floor(minute/60)).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`,
    secondsUntilDawn:Math.ceil(DAY_SECONDS-clock.elapsedSeconds),
    progress:clock.elapsedSeconds/DAY_SECONDS})
}

export function advanceGameClock(clock, seconds) {
  const clean = createGameClock(clock)
  if(clean.paused) return clean
  const elapsed = clean.elapsedSeconds + Math.max(0, finite(seconds))
  return {...clean, day:clean.day + Math.floor(elapsed/DAY_SECONDS), elapsedSeconds:elapsed % DAY_SECONDS}
}
