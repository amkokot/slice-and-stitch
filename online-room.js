import { ONLINE_CONFIG, onlineConfigured } from './online-config.js'

export function validRoomCode(code) { return /^[A-HJ-NP-Z2-9]{6}$/.test(String(code || '').trim().toUpperCase()) }
export function createChannelTopic(code,config=ONLINE_CONFIG) {
  if(!validRoomCode(code)) throw new Error('Enter the six-character room code.')
  return `${config.channelPrefix}:${config.appId}:v${config.protocolVersion}:${code.toUpperCase()}`
}
export function createRoomCode() {
  const letters='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return [...crypto.getRandomValues(new Uint8Array(6))].map(n=>letters[n%letters.length]).join('')
}
export class RealtimeRoom {
  constructor({roomCode,connectionId,profile,onMessage,onPresence,onStatus,createClient}) {
    Object.assign(this,{roomCode,connectionId,profile,onMessage,onPresence,onStatus,createClient})
    this.connected=false;this.closing=false;this.hasConnected=false
  }
  async connect() {
    if(!onlineConfigured()) throw new Error('Online rooms are not configured.')
    this.onStatus?.('connecting')
    const createClient=this.createClient || (await import('https://esm.sh/@supabase/supabase-js@2.91.0')).createClient
    this.client=createClient(ONLINE_CONFIG.supabaseUrl,ONLINE_CONFIG.supabasePublishableKey,{auth:{persistSession:false,autoRefreshToken:false}})
    this.channel=this.client.channel(createChannelTopic(this.roomCode),{config:{private:ONLINE_CONFIG.privateChannels,
      broadcast:{self:false,ack:true},presence:{key:this.connectionId}}})
    this.channel.on('broadcast',{event:'room-event'},({payload})=>{
      if(payload?.appId===ONLINE_CONFIG.appId && payload?.protocolVersion===1 && payload?.roomCode===this.roomCode) this.onMessage?.(payload)
    }).on('presence',{event:'sync'},()=>this.onPresence?.(Object.values(this.channel.presenceState()).flat()))
    await new Promise((resolve,reject)=>{
      const timeout=setTimeout(()=>reject(new Error('Room connection timed out. Check your connection and retry.')),15000)
      this.channel.subscribe(async status=>{
        if(this.closing) return
        if(status==='SUBSCRIBED') {
          try {
            const result=await this.channel.track(this.profile)
            if(result!=='ok') throw new Error('Could not announce this player.')
            clearTimeout(timeout);this.connected=true;this.hasConnected=true;this.onStatus?.('connected');resolve()
          } catch(error) {clearTimeout(timeout);this.connected=false;this.onStatus?.('error');reject(error)}
        } else if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(status)) {
          this.connected=false;this.onStatus?.('error')
          if(!this.hasConnected) {clearTimeout(timeout);reject(new Error('The room connection failed. Please retry.'))}
        }
      })
    })
  }
  async send(type,payload={}) {
    if(!this.connected) throw new Error('Room disconnected. Progress is safe; reconnect before spending or working.')
    const result=await this.channel.send({type:'broadcast',event:'room-event',payload:{type,payload,
      appId:ONLINE_CONFIG.appId,protocolVersion:1,roomCode:this.roomCode,connectionId:this.connectionId}})
    if(result!=='ok') throw new Error('Room update could not be confirmed. Reconnect to check the saved result.')
  }
  async track(profile) { this.profile=profile; if(this.connected) await this.channel.track(profile) }
  async close() {
    this.closing=true;this.connected=false
    if(this.channel) await this.client.removeChannel(this.channel)
    this.onStatus?.('closed')
  }
}
