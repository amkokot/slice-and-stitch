import { baseGameStorage } from './game-storage.js'

export const PLAYER_ACCOUNT_KEY = 'slice-and-stitch.player.v1'
export function playerAccount(storage = baseGameStorage()) {
  let saved
  try { saved=JSON.parse(storage?.getItem(PLAYER_ACCOUNT_KEY) || 'null') } catch {}
  const account={version:1,id:typeof saved?.id==='string' ? saved.id : globalThis.crypto.randomUUID(),
    ready:saved?.ready===true,profile:saved?.profile || null}
  try { storage?.setItem(PLAYER_ACCOUNT_KEY,JSON.stringify(account)) } catch {}
  return account
}
export function savePlayerProfile(profile, { ready } = {}, storage = baseGameStorage()) {
  const account=playerAccount(storage)
  account.profile=JSON.parse(JSON.stringify(profile))
  if(ready!=null) account.ready=Boolean(ready)
  try { storage?.setItem(PLAYER_ACCOUNT_KEY,JSON.stringify(account)) } catch {}
  return account
}
