export const ROOM_SCENES=Object.freeze(['street','restaurant','kitchen','tailor','boutique','home'])
export const IDLE_SPOTS=Object.freeze({
  street:[[21,82],[40,86],[62,84],[82,86]],
  restaurant:[[14,85],[37,86],[60,87],[84,86]],
  kitchen:[[15,84],[38,85],[62,86],[85,84]],
  tailor:[[38,83],[56,85],[74,85],[92,83]],
  boutique:[[12,85],[27,87],[65,85],[84,86]],
  home:[[18,84],[39,87],[62,86],[83,84]],
})
export const STATION_SPOTS=Object.freeze({
  pizza:{sceneId:'kitchen',point:[50,73]},doughToss:{sceneId:'kitchen',point:[50,84]},
  saucePot:{sceneId:'kitchen',point:[29,74]},dishwashing:{sceneId:'kitchen',point:[89,84]},
  drinkPour:{sceneId:'kitchen',point:[16,74]},fashion:{sceneId:'tailor',point:[58,82]},
  'tailor-shop':{sceneId:'tailor',point:[37,81]},'boutique-shop':{sceneId:'boutique',point:[64,81]},
  wardrobe:{sceneId:'home',point:[31,80]},mirror:{sceneId:'home',point:[14,80]},
  bed:{sceneId:'home',point:[75,87]},
})

// Allocate all players together in a stable order. Active stations get priority;
// idle players use remaining floor spots rather than piling onto one spawn.
export function positionRoomPlayers(members) {
  const assigned=[]
  for(const sceneId of ROOM_SCENES) {
    const people=members.filter(p=>p.sceneId===sceneId && p.connected!==false)
      .sort((a,b)=>Number(Boolean(STATION_SPOTS[b.activity]))-Number(Boolean(STATION_SPOTS[a.activity])) || a.playerId.localeCompare(b.playerId))
    const occupied=[]
    for(const person of people) {
      const station=STATION_SPOTS[person.activity]
      const target=station?.sceneId===sceneId ? station.point : null
      const slots=IDLE_SPOTS[sceneId]
      const fallbackSlots=[10,28,46,64,82,92].map(x=>[x,86])
      const candidates=target ? [target,...slots.map(p=>[p[0],Math.min(88,p[1]+1)]),...fallbackSlots] : [...slots,...fallbackSlots]
      const free=point=>occupied.every(other=>Math.abs(point[0]-other[0])>=14 || Math.abs(point[1]-other[1])>=22)
      const point=candidates.find(free) || slots.reduce((best,p)=>{
        const distance=q=>Math.min(...occupied.map(other=>Math.hypot(q[0]-other[0],q[1]-other[1])))
        return !best || distance(p)>distance(best)?p:best
      },null)
      occupied.push(point)
      assigned.push({...person,x:point[0],y:point[1],sessionScale:.68})
    }
  }
  return assigned
}
