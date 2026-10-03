export const MINIGAME_PROTOCOL_VERSION = 1
export const MINIGAME_EVENT_NAME = 'slice-and-stitch:minigame'

function copySnapshot(value) {
  if (value == null) return value
  return JSON.parse(JSON.stringify(value))
}

export function createMinigameSession(kind, { emit = () => {} } = {}) {
  let runId = 0
  let status = 'idle'
  let stage = null
  let context = null
  let result = null

  const snapshot = () => ({
    protocolVersion: MINIGAME_PROTOCOL_VERSION,
    kind,
    runId,
    status,
    stage,
    context: copySnapshot(context),
    result: copySnapshot(result),
  })

  const publish = (type, detail = {}) => {
    const event = Object.freeze({ type, ...snapshot(), detail: copySnapshot(detail) })
    emit(event)
    return event
  }

  return Object.freeze({
    begin(nextContext = {}) {
      runId += 1
      status = 'playing'
      stage = null
      context = copySnapshot(nextContext)
      result = null
      publish('started')
      return snapshot()
    },
    update(nextStage, detail = {}) {
      if (status !== 'playing') return false
      if (stage === nextStage && !Object.keys(detail).length) return true
      stage = nextStage
      publish('stage-changed', detail)
      return true
    },
    complete(nextResult) {
      if (status !== 'playing') return false
      status = 'completed'
      result = copySnapshot(nextResult)
      publish('completed')
      return true
    },
    reset() {
      status = 'idle'
      stage = null
      context = null
      result = null
      publish('reset')
      return snapshot()
    },
    snapshot,
  })
}

export function createDomMinigameEmitter(target = document) {
  return (event) => target.dispatchEvent(new CustomEvent(MINIGAME_EVENT_NAME, { detail: event }))
}
