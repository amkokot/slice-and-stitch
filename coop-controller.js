import { RealtimeRoom } from './online-room.js'
import { applyRoomCommand, advanceSharedTime, validSharedSession, MAX_ROOM_PLAYERS } from './coop-state.js'
import { normalizeCharacterProfile } from './character-model.js'
import { saveRoom, readJSON, outboxKey } from './coop-saves.js'

const id=value=>typeof value==='string' && /^[\w:-]{1,100}$/.test(value)
const copy=value=>JSON.parse(JSON.stringify(value))
export class CoopController {
  constructor({roomCode,role,playerId,connectionId,profile,seed,storage,transportFactory=options=>new RealtimeRoom(options),onState=()=>{},onMembers=()=>{},onStatus=()=>{}}) {
    Object.assign(this,{roomCode,role,playerId,connectionId,profile,storage,transportFactory,onState,onMembers,onStatus})
    this.state=seed || null;this.members=[];this.pending=new Map();this.connected=false;this.ready=false;this.closed=false
    this.activity={sceneId:'street',activity:'idle',visible:true};this.hostConnectionId=null;this.queue=Promise.resolve();this.allowedPlayers=new Set([playerId])
    this.outbox=readJSON(storage,outboxKey(roomCode),[]).filter(command=>command.playerId===playerId && id(command.id)).slice(-32)
    this.firstState=new Promise((resolve,reject)=>{this.resolveReady=resolve;this.rejectReady=reject})
    // Reported through connect(); prevent an early channel error being unhandled.
    this.firstState.catch(()=>{})
  }
  get isHost() {return this.role==='host'}
  presence() {return {playerId:this.playerId,connectionId:this.connectionId,profile:this.profile,role:this.role,
    sessionId:this.state?.sessionId || null,...this.activity}}
  async connect() {
    this.transport=this.transportFactory({roomCode:this.roomCode,connectionId:this.connectionId,profile:this.presence(),
      onMessage:message=>this.message(message),onPresence:entries=>this.presences(entries),onStatus:status=>this.status(status)})
    await this.transport.connect()
    if(this.isHost) {
      if(!validSharedSession(this.state,this.roomCode) || this.state.hostPlayerId!==this.playerId) throw new Error('Only this saved room’s host can reopen it.')
      this.adopt(this.state);this.resolveReady(this.state)
    } else {
      const timeout=setTimeout(()=>this.rejectReady(new Error('No connected host answered. Ask the host to open or resume this room.')),15000)
      try { await this.firstState } finally {clearTimeout(timeout)}
    }
    this.retryOutbox()
    this.lastTick=Date.now()
    this.timer=setInterval(()=>this.tick(),5000)
    return this.state
  }
  status(status) {
    this.connected=status==='connected'
    if(!this.connected) this.ready=false
    this.onStatus(status,this)
    if(this.connected) {
      this.transport.send('hello',{playerId:this.playerId,profile:this.profile,sessionId:this.state?.sessionId || null}).catch(error=>this.onStatus('error',this,error.message))
      if(this.isHost && this.state) this.adopt(this.state)
    }
  }
  presences(entries) {
    const known=new Map()
    for(const entry of entries) {
      if(!id(entry.playerId) || !id(entry.connectionId)) continue
      if(entry.sessionId && this.state && entry.sessionId!==this.state.sessionId) continue
      known.set(entry.connectionId,{...entry,profile:normalizeCharacterProfile(entry.profile || {}),connected:true})
    }
    this.members=[...known.values()]
    const host=this.members.find(member=>member.playerId===this.state?.hostPlayerId && member.role==='host')
    this.hostConnectionId=host?.connectionId || (this.isHost?this.connectionId:null)
    if(!this.isHost && !host) {this.ready=false;this.onStatus('waiting-host',this)}
    if(this.isHost) {
      const connected=new Set(this.members.map(m=>m.playerId))
      for(const playerId of this.allowedPlayers) if(playerId!==this.playerId && !connected.has(playerId)) this.allowedPlayers.delete(playerId)
      for(const member of this.members) if(member.sessionId===this.state?.sessionId && this.allowedPlayers.size<MAX_ROOM_PLAYERS) this.allowedPlayers.add(member.playerId)
      const lost=Object.values(this.state?.stations || {}).filter(owner=>!connected.has(owner.playerId))
      for(const owner of lost) this.commit({id:crypto.randomUUID(),playerId:owner.playerId,type:'release-station',data:{}})
      const otherHost=this.members.find(m=>m.role==='host' && m.connectionId!==this.connectionId)
      if(otherHost) {this.ready=false;this.onStatus('error',this,'This room code already has another host. Start a new room instead.');this.close();return}
    }
    this.onMembers(this.members,this)
    if(this.connected && !this.isHost && host && !this.ready) this.transport.send('hello',{playerId:this.playerId,profile:this.profile,sessionId:this.state?.sessionId}).catch(()=>{})
  }
  message(message) {
    const {type,payload={},connectionId}=message || {}
    if(!id(connectionId)) return
    if(type==='hello' && this.isHost && this.ready) {
      if(!id(payload.playerId)) return
      if(payload.sessionId && payload.sessionId!==this.state.sessionId) {this.transport.send('room-error',{target:connectionId,reason:'This code belongs to a different saved session.'}).catch(()=>{});return}
      if(!this.allowedPlayers.has(payload.playerId) && this.allowedPlayers.size>=MAX_ROOM_PLAYERS) {this.transport.send('room-error',{target:connectionId,reason:`This prototype supports ${MAX_ROOM_PLAYERS} players per room.`}).catch(()=>{});return}
      const existing=this.members.find(m=>m.playerId===payload.playerId && m.connectionId!==connectionId)
      if(existing) {this.transport.send('room-error',{target:connectionId,reason:'This character is already connected in another tab. Use one play window per character.'}).catch(()=>{});return}
      this.allowedPlayers.add(payload.playerId)
      if(!this.members.some(m=>m.connectionId===connectionId)) this.members.push({playerId:payload.playerId,connectionId,profile:normalizeCharacterProfile(payload.profile),sceneId:'street',activity:'idle',connected:true})
      this.transport.send('state',{target:connectionId,state:this.state}).catch(()=>{});return
    }
    if(type==='room-error' && payload.target===this.connectionId) {
      this.ready=false;this.rejectReady(new Error(payload.reason));this.onStatus('error',this,payload.reason);return
    }
    if(type==='state' && !this.isHost && (!payload.target || payload.target===this.connectionId)) {
      if(!validSharedSession(payload.state,this.roomCode)) return
      if(this.state && payload.state.sessionId!==this.state.sessionId) return
      if(this.hostConnectionId && connectionId!==this.hostConnectionId) return
      this.adopt(payload.state);this.resolveReady(this.state);return
    }
    if(type==='command' && this.isHost && this.ready) {
      const member=this.members.find(m=>m.connectionId===connectionId && m.playerId===payload.command?.playerId)
      if(!member || !this.allowedPlayers.has(member.playerId)) return
      this.queue=this.queue.then(()=>this.commit(payload.command,connectionId)).catch(error=>this.onStatus('error',this,error.message))
      return
    }
    if(type==='receipt' && payload.target===this.connectionId && connectionId===this.hostConnectionId) {
      if(payload.state && validSharedSession(payload.state,this.roomCode)) this.adopt(payload.state)
      this.finishRequest(payload.id,payload.result)
    }
  }
  adopt(state) {
    if(this.state && this.state.sessionId===state.sessionId && this.state.revision>state.revision) return
    const wasReady=this.ready,first=!this.state
    this.state=copy(state);this.ready=true
    this.saved=saveRoom(this.state,this.role,this.storage)
    this.onState(this.state,this)
    for(const receipt of this.state.receipts) if(receipt.playerId===this.playerId) this.finishRequest(receipt.id,receipt.result)
    this.onStatus('ready',this)
    if(first) this.transport?.track(this.presence()).catch(()=>{})
    if(!wasReady && this.connected && this.transport) queueMicrotask(()=>this.retryOutbox())
  }
  async commit(command,target) {
    const result=applyRoomCommand(this.state,command)
    if(result.ok) {
      this.adopt(result.state)
      await this.transport.send('state',{state:this.state})
    }
    const {state,...receipt}=result
    if(target) await this.transport.send('receipt',{target,id:command.id,result:receipt,state:this.state})
    else this.finishRequest(command.id,receipt)
    return receipt
  }
  async transact(type,data={},operationKey) {
    if(!this.connected || !this.ready) {
      // A completion can race a disconnect. Keep its semantic receipt, not its
      // pointer input, so reconnecting can deliver the result exactly once.
      if(type==='kitchen-work' && !this.outbox.some(item=>item.key===`kitchen-work:${data.work?.id}`)) {
        this.outbox.push({id:crypto.randomUUID(),key:`kitchen-work:${data.work?.id}`,playerId:this.playerId,type,data:copy(data)});this.saveOutbox()
      }
      return {ok:false,reason:'Shared actions are paused until the host reconnects. Your saved work is safe.'}
    }
    const key=operationKey || `${type}:${data.projectId || data.pizzaId || data.work?.id || data.id || crypto.randomUUID()}`
    let command=this.outbox.find(item=>item.key===key)
    if(!command) {
      command={id:crypto.randomUUID(),key,playerId:this.playerId,type,data:copy(data)}
      this.outbox.push(command);this.saveOutbox()
    }
    if(this.pending.has(command.id)) return this.pending.get(command.id).promise
    let resolve
    const promise=new Promise(done=>{resolve=done})
    const timer=setTimeout(()=>{
      this.pending.delete(command.id)
      resolve({ok:false,reason:'The host has not confirmed this yet. Reconnect, then retry; the same receipt will not charge twice.'})
    },12000)
    this.pending.set(command.id,{resolve,promise,timer})
    if(this.isHost) this.queue=this.queue.then(()=>this.commit(command)).catch(error=>{this.finishRequest(command.id,{ok:false,reason:error.message})})
    else this.transport.send('command',{command}).catch(error=>{clearTimeout(timer);this.pending.delete(command.id);resolve({ok:false,reason:error.message})})
    return promise
  }
  finishRequest(requestId,result) {
    if(!this.pending.has(requestId) && !this.outbox.some(command=>command.id===requestId)) return
    const pending=this.pending.get(requestId)
    if(pending) {clearTimeout(pending.timer);this.pending.delete(requestId);pending.resolve(copy(result))}
    this.outbox=this.outbox.filter(item=>item.id!==requestId);this.saveOutbox()
  }
  saveOutbox() {try{this.storage?.setItem(outboxKey(this.roomCode),JSON.stringify(this.outbox))}catch{}}
  retryOutbox() {
    for(const command of [...this.outbox]) this.transact(command.type,command.data,command.key)
  }
  async updatePresence(activity={},profile) {
    this.activity={...this.activity,...activity}
    if(profile) this.profile=profile
    await this.transport?.track(this.presence())
  }
  async tick(now=Date.now()) {
    const seconds=Math.min(10,Math.max(0,(now-this.lastTick)/1000));this.lastTick=now
    if(!this.isHost || !this.connected || !this.ready) return
    const visible=this.members.some(m=>m.visible!==false) || this.activity.visible
    if(!visible) return
    const kitchenActive=this.members.some(m=>m.visible!==false && ['restaurant','kitchen'].includes(m.sceneId))
      || (this.activity.visible && ['restaurant','kitchen'].includes(this.activity.sceneId))
    this.adopt(advanceSharedTime(this.state,seconds,{kitchenActive}))
    try {await this.transport.send('state',{state:this.state})} catch(error) {this.ready=false;this.onStatus('error',this,error.message)}
  }
  async close() {
    this.closed=true;this.ready=false;clearInterval(this.timer)
    for(const request of this.pending.values()) {clearTimeout(request.timer);request.resolve({ok:false,reason:'Room closed; your saved progress is safe.'})}
    this.pending.clear();await this.transport?.close()
  }
}
