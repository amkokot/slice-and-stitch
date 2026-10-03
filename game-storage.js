// The real game uses its existing save keys. A visible ?playtest=fashion mode
// shares the full game code but has a separate, tab-local save for end-to-end QA.
export function isFashionPlaytest(search = typeof location === 'undefined' ? '' : location.search) {
  return new URLSearchParams(search).get('playtest') === 'fashion'
}

export function gameStorage() {
  try {
    const storage = baseGameStorage()
    if (!storage) return null
    return scopedGameStorage(storage,typeof document==='undefined'?activeSession(storage):pageSession)
  } catch { return null }
}

export const ACTIVE_SESSION_KEY = 'slice-and-stitch.active-session.v1'
export function baseGameStorage() {
  try { return isFashionPlaytest() ? globalThis.sessionStorage : globalThis.localStorage } catch { return null }
}
export function activeSession(storage = baseGameStorage()) {
  try {
    const saved=JSON.parse(storage?.getItem(ACTIVE_SESSION_KEY) || 'null')
    return saved && /^[A-HJ-NP-Z2-9]{6}$/.test(saved.roomCode) && ['host','guest'].includes(saved.role) ? saved : null
  } catch { return null }
}
export function setActiveSession(session, storage = baseGameStorage()) {
  if(session) storage?.setItem(ACTIVE_SESSION_KEY,JSON.stringify(session))
  else storage?.removeItem(ACTIVE_SESSION_KEY)
}

export function scopedGameStorage(storage,session) {
  const prefix=session ? `slice-and-stitch.coop.${session.roomCode}.` : ''
  return {getItem:key=>storage.getItem(prefix+key),setItem:(key,value)=>storage.setItem(prefix+key,value),removeItem:key=>storage.removeItem(prefix+key)}
}
// Enter/leave switches require a reload. The departing page must finish saving
// to its original scope during pagehide, never into the newly selected world.
const pageSession=typeof document==='undefined'?null:activeSession()
