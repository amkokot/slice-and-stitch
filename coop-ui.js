import { activeSession, baseGameStorage, setActiveSession } from './game-storage.js'
import { playerAccount, savePlayerProfile } from './player-account.js'
import { createSharedSession, validSharedSession, MAX_ROOM_PLAYERS } from './coop-state.js'
import { createRoomCode, validRoomCode } from './online-room.js'
import { CoopController } from './coop-controller.js'
import { enterSavedRoom, savedRooms, readJSON, roomSaveKey } from './coop-saves.js'
import { positionRoomPlayers } from './coop-positions.js'

const escape=value=>String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const storage=baseGameStorage()
let controller=null,busy=false,status='solo',errorMessage='',localActivity={sceneId:location.hash.slice(1)||'street',activity:'idle',visible:!document.hidden}
let dialogSignature=''
const panel=document.querySelector('.game-panel')
const button=document.createElement('button')
button.type='button';button.className='coop-hud-button';button.dataset.onlineRooms='';button.textContent='Play together'
panel.querySelector('.hub-day').append(button)
const dialog=document.createElement('dialog')
dialog.className='coop-dialog';dialog.setAttribute('aria-labelledby','coop-title')
panel.append(dialog)
const notice=document.createElement('aside')
notice.className='coop-connection-notice';notice.hidden=true;notice.setAttribute('role','status');notice.setAttribute('aria-live','polite')
panel.append(notice)

function connectionId(code) {
  const key=`slice-and-stitch.connection.${code}`
  let value=sessionStorage.getItem(key)
  if(!value) {value=crypto.randomUUID();sessionStorage.setItem(key,value)}
  return value
}
function profile() {return window.sliceAndStitchHub.character.getSnapshot().profile}
function stateCopy() {return controller?.state || readJSON(storage,roomSaveKey(activeSession()?.roomCode))}
function redrawPlayers() {
  if(!controller?.state) return
  const self={...controller.presence(),connected:true}
  const members=[self,...controller.members.filter(m=>m.playerId!==controller.playerId && (m.sessionId===controller.state.sessionId || !m.sessionId))]
  window.sliceAndStitchHub.applyOnlinePlayers(positionRoomPlayers(members.slice(0,MAX_ROOM_PLAYERS)),controller.playerId,controller.state)
}
function render() {
  const active=activeSession(),state=stateCopy()
  const ready=Boolean(controller?.ready)
  button.textContent=active?`${ready?'●':'◌'} Room ${active.roomCode}`:'Play together'
  notice.hidden=!active || ready
  notice.innerHTML='<span></span><button type="button" data-room-reconnect>Reconnect</button><button type="button" data-open-room>Room</button>'
  notice.querySelector('span').textContent=errorMessage || 'Connecting to the host · shared actions paused'
  panel.dataset.roomReady=active?String(ready):'solo'
  if(!dialog.open) return
  const participants=[controller?.presence(),...(controller?.members || []).filter(m=>m.playerId!==controller?.playerId)].filter(Boolean)
  const signature=JSON.stringify([active,ready,busy,status,errorMessage,controller?.saved,state?.coins,state?.clock.day,participants,active?null:savedRooms(storage)])
  if(signature===dialogSignature) return
  dialogSignature=signature
  const header=`<button type="button" class="dialog-close" data-close-room aria-label="Close online rooms">×</button><span class="result-kicker">Kitchen & clothier · together</span><h2 id="coop-title">${active?'Your shared room':'Play together'}</h2>`
  const warnings=`<p class="coop-save-note">Room progress autosaves on this device, separately from solo play. The host must stay connected. No account or cloud saves; download a backup before changing devices or clearing browser data.</p>`
  if(active) {
    dialog.innerHTML=header+`<div class="coop-room-code"><small>Invite code</small><strong>${escape(active.roomCode)}</strong><button type="button" data-copy-invite>Copy invite</button></div>
      <p class="coop-state" role="status">${escape(errorMessage || (ready?'Connected · shared till, patterns, clothing and supplies':status==='connecting'?'Connecting…':'Waiting for the host'))}</p>
      <ul class="coop-members">${participants.map(m=>`<li><i aria-hidden="true">●</i>${escape(m.profile?.name || 'Player')}<small>${m.role==='host'?'Host':escape(m.sceneId || 'Joining')}</small></li>`).join('')}</ul>
      <p class="coop-autosave">${controller?.saved===false?'⚠ Browser storage is full or unavailable. Download a backup now.':state?`Saved locally · Day ${state.clock.day} · ${state.coins} coins`:'Awaiting the shared save'}</p>
      <div class="coop-button-row"><button type="button" class="primary-button" data-room-reconnect ${busy?'disabled':''}>${ready?'Reconnect':'Retry connection'}</button>${active.role==='host'?'<button type="button" class="secondary-button" data-room-backup>Download backup</button>':''}<button type="button" class="secondary-button" data-room-leave>Leave to solo game</button></div>`+warnings
  } else {
    const rooms=savedRooms(storage)
    const invite=new URLSearchParams(location.search).get('room') || ''
    dialog.innerHTML=header+`<p>Up to ${MAX_ROOM_PLAYERS} players. Make pizzas and clothes together; the room shares money, patterns, garments, supplies and upgrades.</p>
      <div class="coop-start"><section><h3>Host a room</h3><p>Start a separate cooperative copy of your current solo game. Your solo save stays untouched.</p><button class="primary-button" type="button" data-room-host ${busy?'disabled':''}>Create room</button></section>
      <form data-room-join><h3>Join a friend</h3><label for="coop-code">Six-character room code</label><input id="coop-code" name="code" maxlength="6" autocomplete="off" autocapitalize="characters" pattern="[A-HJ-NP-Za-hj-np-z2-9]{6}" required value="${escape(invite)}" placeholder="ABC234"><button class="primary-button" type="submit" ${busy?'disabled':''}>Join room</button></form></div>
      <p class="coop-state" role="status">${escape(busy?'Connecting…':errorMessage)}</p>
      ${rooms.length?`<h3>Saved rooms</h3><div class="coop-saved-rooms">${rooms.map(room=>`<button type="button" data-room-resume="${room.roomCode}" ${busy?'disabled':''}><b>${room.roomCode}</b><span>${room.role==='host'?'Resume as host':'Rejoin friend'} · Day ${readJSON(storage,roomSaveKey(room.roomCode)).clock.day}</span></button>`).join('')}</div>`:''}
      <label class="coop-import">Restore a host backup <input type="file" accept="application/json,.json" data-room-import ${busy?'disabled':''}></label>`+warnings
  }
}
function show() {if(panel.dataset.onboarding) return;dialog.showModal();render()}
function fail(error) {errorMessage=error?.message || String(error);busy=false;render()}
async function connectActive() {
  if(busy) return
  const active=activeSession()
  if(!active) return
  busy=true;status='connecting';errorMessage='';render()
  try {
    await controller?.close()
    const account=playerAccount(storage)
    controller=new CoopController({roomCode:active.roomCode,role:active.role,playerId:account.id,
      connectionId:connectionId(active.roomCode),profile:profile(),seed:readJSON(storage,roomSaveKey(active.roomCode)),storage,
      onState:(state,room)=>{window.sliceAndStitchCoopGame.applyShared(state,room.playerId);redrawPlayers()},
      onMembers:()=>redrawPlayers(),
      onStatus:(value,room,message)=>{status=value;if(value==='ready') errorMessage='';else if(message) errorMessage=message;render()},
    })
    await controller.connect()
    if(localActivity.activity==='idle') await controller.transact('release-station',{})
    await controller.updatePresence(localActivity,profile())
    redrawPlayers();busy=false;render()
  } catch(error) {await controller?.close();fail(error)}
}
async function join(code,expected=null) {
  code=String(code).trim().toUpperCase()
  if(!validRoomCode(code)) {fail(new Error('Enter a six-character room code.'));return}
  busy=true;errorMessage='';render()
  let temporary
  try {
    const account=playerAccount(storage)
    temporary=new CoopController({roomCode:code,role:'guest',playerId:account.id,connectionId:connectionId(code),profile:profile(),seed:expected,storage})
    const state=await temporary.connect()
    enterSavedRoom(state,'guest',{profile:profile()},storage)
    await temporary.close();location.reload()
  } catch(error) {await temporary?.close();fail(error)}
}
function resume(code) {
  const room=savedRooms(storage).find(r=>r.roomCode===code)
  const state=readJSON(storage,roomSaveKey(code))
  if(!room || !validSharedSession(state,code)) return fail(new Error('This room save could not be read.'))
  if(room.role==='guest') return join(code,state)
  if(state.hostPlayerId!==playerAccount(storage).id) return fail(new Error('This room was saved by another host. Restore their backup or join their room instead.'))
  enterSavedRoom(state,'host',{profile:profile()},storage);location.reload()
}
function downloadBackup() {
  const state=stateCopy()
  if(!state) return
  const account=playerAccount(storage)
  const backup={kind:'slice-and-stitch-room',version:1,state,player:account,privateSave:window.sliceAndStitchCoopGame.getSave()}
  const url=URL.createObjectURL(new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}))
  const link=document.createElement('a');link.href=url;link.download=`slice-and-stitch-${state.roomCode}-day-${state.clock.day}.json`;link.click()
  setTimeout(()=>URL.revokeObjectURL(url),1000)
}

window.sliceAndStitchCoop=Object.freeze({
  get active() {return Boolean(activeSession())}, get ready() {return Boolean(controller?.ready && controller?.connected)},
  get isHost() {return Boolean(controller?.isHost)},
  transact:(type,data,key)=>controller?.transact(type,data,key) || Promise.resolve({ok:false,reason:'The room is not connected yet.'}),
  enterStation:station=>controller?.transact('claim-station',{station}) || Promise.resolve({ok:false,reason:'Wait for the room to reconnect.'}),
  getSnapshot:()=>({active:activeSession(),ready:Boolean(controller?.ready),state:stateCopy(),members:controller?.members || []}),
})
button.addEventListener('click',show)
notice.addEventListener('click',event=>{if(event.target.closest('[data-room-reconnect]')) connectActive();if(event.target.closest('[data-open-room]')) show()})
dialog.addEventListener('click',async event=>{
  const target=event.target
  if(target.closest('[data-close-room]')) dialog.close()
  if(target.closest('[data-room-host]') && !busy) {
    try {
      const account=playerAccount(storage),seed=window.sliceAndStitchCoopGame.getSave()
      seed.character=window.sliceAndStitchHub.character.getSnapshot()
      const state=createSharedSession(seed,{roomCode:createRoomCode(),sessionId:crypto.randomUUID(),hostPlayerId:account.id})
      enterSavedRoom(state,'host',{privateSave:seed,profile:profile()},storage);location.reload()
    } catch(error) {fail(error)}
  }
  const resumeButton=target.closest('[data-room-resume]')
  if(resumeButton && !busy) resume(resumeButton.dataset.roomResume)
  if(target.closest('[data-room-reconnect]')) connectActive()
  if(target.closest('[data-room-leave]')) {
    window.sliceAndStitchCoopGame.save();await controller?.close();setActiveSession(null,storage);location.reload()
  }
  if(target.closest('[data-room-backup]')) downloadBackup()
  if(target.closest('[data-copy-invite]')) {
    const invite=new URL(location.href);invite.searchParams.set('room',activeSession().roomCode)
    try {await navigator.clipboard.writeText(invite.href);target.textContent='Invite copied'} catch {target.textContent='Use the room code above'}
  }
})
dialog.addEventListener('submit',event=>{
  if(!event.target.matches('[data-room-join]')) return
  event.preventDefault();if(!busy) join(new FormData(event.target).get('code'))
})
dialog.addEventListener('change',async event=>{
  if(!event.target.matches('[data-room-import]')) return
  try {
    const file=event.target.files[0]
    if(file.size>2_000_000) throw new Error('This is larger than a supported room backup.')
    const backup=JSON.parse(await file.text())
    if(backup.kind!=='slice-and-stitch-room' || backup.version!==1 || !validSharedSession(backup.state,backup.state?.roomCode)
      || backup.player?.id!==backup.state.hostPlayerId) throw new Error('Choose a Slice & Stitch host backup.')
    // Restore the host identity too, so friends recognize this as the same room.
    storage.setItem('slice-and-stitch.player.v1',JSON.stringify({...backup.player,ready:true}))
    savePlayerProfile(backup.player.profile,{ready:true},storage)
    enterSavedRoom(backup.state,'host',{privateSave:backup.privateSave,profile:backup.player.profile},storage)
    location.reload()
  } catch(error) {fail(error)}
})
document.addEventListener('slice-and-stitch:player-activity',async event=>{
  const previous=localActivity.activity
  localActivity={...localActivity,...event.detail}
  if(controller?.ready && previous==='saucePot' && event.detail.activity!=='saucePot') controller.transact('release-station',{})
  await controller?.updatePresence(localActivity).catch(()=>{})
  redrawPlayers()
})
document.addEventListener('slice-and-stitch:character-changed',()=>{controller?.updatePresence({},profile()).catch(()=>{});redrawPlayers()})
document.addEventListener('visibilitychange',()=>{
  localActivity.visible=!document.hidden;controller?.updatePresence(localActivity).catch(()=>{})
})
document.addEventListener('slice-and-stitch:character-ready',()=>{render();if(activeSession()) connectActive()})
// Freeze shared transactions during a disconnect, without trapping navigation,
// room controls or the player's personal character editor.
panel.addEventListener('click',event=>{
  if(activeSession() && !window.sliceAndStitchCoop.ready && event.target.closest('.app-shell')
    && !event.target.closest('[data-service-station]')) {event.preventDefault();event.stopImmediatePropagation();window.sliceAndStitchHub.showToast('Reconnect to the host before continuing shared work.')}
},true)
render()
if(activeSession() && !panel.dataset.onboarding) connectActive()
