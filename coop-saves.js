import { baseGameStorage, setActiveSession } from './game-storage.js'
import { validSharedSession, sharedGameSave } from './coop-state.js'
import { PROGRESSION_STORAGE_KEY } from './progression.js'
import { CHARACTER_STORAGE_KEY, sharedCharacterState } from './character-model.js'
import { playerAccount } from './player-account.js'

export const ROOM_SAVES_KEY='slice-and-stitch.room-index.v1'
export const roomSaveKey=code=>`slice-and-stitch.room.${code}.v1`
export const outboxKey=code=>`slice-and-stitch.outbox.${code}.v1`
export function readJSON(storage,key,fallback=null) {try{return JSON.parse(storage?.getItem(key) || 'null') ?? fallback}catch{return fallback}}
export function savedRooms(storage=baseGameStorage()) {
  return readJSON(storage,ROOM_SAVES_KEY,[]).filter(room=>validSharedSession(readJSON(storage,roomSaveKey(room.roomCode)),room.roomCode))
}
export function saveRoom(state,role,storage=baseGameStorage()) {
  if(!storage) return false
  if(!validSharedSession(state,state.roomCode)) return false
  try {
    const old=readJSON(storage,roomSaveKey(state.roomCode))
    if(old?.sessionId===state.sessionId && old.revision>state.revision) return false
    storage?.setItem(roomSaveKey(state.roomCode),JSON.stringify(state))
    const index=savedRooms(storage).filter(room=>room.roomCode!==state.roomCode)
    index.unshift({roomCode:state.roomCode,sessionId:state.sessionId,role,hostPlayerId:state.hostPlayerId,savedAt:state.savedAt})
    storage?.setItem(ROOM_SAVES_KEY,JSON.stringify(index.slice(0,12)))
    return true
  } catch {return false}
}
export function enterSavedRoom(state,role,{privateSave={},profile}={},storage=baseGameStorage()) {
  const account=playerAccount(storage)
  if(!saveRoom(state,role,storage)) throw new Error('The shared save could not be stored. Free browser storage before entering a room.')
  const prefix=`slice-and-stitch.coop.${state.roomCode}.`
  const previous=readJSON(storage,prefix+PROGRESSION_STORAGE_KEY,privateSave)
  storage?.setItem(prefix+PROGRESSION_STORAGE_KEY,JSON.stringify(sharedGameSave(state,previous,account.id)))
  const oldCharacter=readJSON(storage,prefix+CHARACTER_STORAGE_KEY)
  const character=sharedCharacterState(oldCharacter?.profile || profile || account.profile,state)
  storage?.setItem(prefix+CHARACTER_STORAGE_KEY,JSON.stringify(character))
  setActiveSession({roomCode:state.roomCode,sessionId:state.sessionId,role},storage)
}
