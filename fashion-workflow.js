import { FASHION_FABRICS, FASHION_SCHEMATICS, tailorStockForDay } from './fashion-catalog.js'
import { constructionRecipe, effectiveSchematic, constructionTraceScore } from './fashion-construction.js'

export const STEADY_HAND_SECTIONS = 8

export function fashionInventoryFor(day, reputation, level, saved) {
  const offer = tailorStockForDay(day, reputation, level)
  const sameDay = saved?.day === day
  const retained = sameDay ? (Array.isArray(saved.fabrics) ? saved.fabrics : []).map(old => {
    const known = FASHION_FABRICS.find(f => f.id === old.id && f.unlockLevel <= level)
    const today=offer.fabrics.find(f=>f.id===old.id)
    return known ? {...today, stock:today?.stock || 0} : null
  }).filter(Boolean) : []
  const fabrics = [...retained]
  for (const fabric of offer.fabrics) {
    if (!fabrics.some(old => old.id === fabric.id)) fabrics.push({...fabric})
  }
  // Freeze the paper-pattern shipment until dawn. Reloading, purchasing or
  // earning a level must not silently refill it with another batch of designs.
  const savedPatterns = sameDay && Array.isArray(saved.schematics)
    ? [...new Set(saved.schematics.map(item => item?.id))].map(id => FASHION_SCHEMATICS.find(pattern => pattern.id === id && pattern.unlockLevel <= level)).filter(Boolean).slice(0, 5)
    : []
  return {day, level:offer.level, schematics:savedPatterns.length ? savedPatterns : [...offer.schematics], fabrics,
    remaining:Object.fromEntries(fabrics.map(fabric => [fabric.id, sameDay && saved.remaining?.[fabric.id] != null
      ? Math.max(0, Math.min(fabric.stock, Number(saved.remaining[fabric.id]) || 0)) : fabric.stock]))}
}

// Only restore real catalogue recipes and serializable work. Interrupted input
// is always released; completed pieces live in the wardrobe, not a replayable draft.
export function restoreFashionProject(saved, fresh, level) {
  if (!saved || saved.completed || !['plan','cut','sew','finish'].includes(saved.step)) return fresh
  const ownedAlteration=saved.alterationMode && Boolean(saved.baseGarment?.id)
  const schematic = FASHION_SCHEMATICS.find(s => s.id === saved.schematic?.id && (s.unlockLevel <= level || ownedAlteration))
  if (!schematic || (saved.step !== 'plan' && (!saved.materialConsumed || !saved.fabric))) return fresh
  const points = trace => (Array.isArray(trace) ? trace : []).slice(0, 6000)
    .filter(p => Number.isFinite(p?.x) && Number.isFinite(p?.y) && p.x >= -100 && p.x <= 700 && p.y >= -100 && p.y <= 700)
    .map(({x,y})=>({x,y}))
  const result = {...fresh, ...saved, schematic:saved.alterationMode ? {...schematic, ...saved.schematic} : schematic,
    dragging:false, lastPointer:null, motionStartedAt:0, motionLastAt:0,
    cutTrace:points(saved.cutTrace), seamTrace:points(saved.seamTrace),
    seamScores:(Array.isArray(saved.seamScores) ? saved.seamScores : []).slice(0,3).map(score=>Math.max(0,Math.min(100,Number(score)||0)))}
  result.assistAccuracies=(Array.isArray(saved.assistAccuracies) ? saved.assistAccuracies : []).slice(0,8).map(n=>Math.max(0,Math.min(100,Number(n)||0)))
  const seams = constructionRecipe(effectiveSchematic(result), result.fabric).seams
  result.seamIndex = Math.max(0, Math.min(seams.length - 1, Math.floor(saved.seamIndex || 0)))
  result.assistSection = Math.max(0, Math.min(STEADY_HAND_SECTIONS, Math.floor(saved.assistSection || 0)))
  return result
}

export function steadyHandOffset(elapsedMs) {
  // A slow, visible sweep. Timing the center scores best; the ends make an
  // inaccurate seam that can be retried without charging for another garment.
  return Math.sin(elapsedMs / 620) * 44
}

export function steadyHandAccuracy(offset) {
  return Math.round(Math.max(0, 1-Math.abs(offset)/44)*100)
}

export function fashionPassScore(fashion, trace, guide, tolerance=32) {
  const score=constructionTraceScore(trace,guide,tolerance)
  if(fashion.inputMode!=='steady') return score
  const timing=(fashion.assistAccuracies || []).reduce((sum,n)=>sum+n,0)/STEADY_HAND_SECTIONS
  return Math.round(Math.min(score,timing))
}

export function steadyHandSection(guide, section, offset, count = STEADY_HAND_SECTIONS) {
  if (!guide || guide.length < 2 || section < 0 || section >= count) return []
  const lengths = guide.slice(1).map((p,i)=>Math.hypot(p.x-guide[i].x,p.y-guide[i].y))
  const total = lengths.reduce((sum,n)=>sum+n,0)
  const start = total * section / count, end = total * (section+1) / count
  const trace=[]
  for(let distance=start; distance<=end+.01; distance+=Math.min(5,end-start || 5)) {
    trace.push(pointAtDistance(guide,lengths,Math.min(distance,end),offset))
  }
  trace.push(pointAtDistance(guide,lengths,end,offset))
  return trace
}

function pointAtDistance(guide,lengths,distance,offset) {
  let i=0
  while(i<lengths.length-1 && distance>lengths[i]) distance-=lengths[i++]
  const a=guide[i],b=guide[i+1],length=lengths[i]||1,t=Math.min(1,distance/length)
  return {x:a.x+(b.x-a.x)*t-(b.y-a.y)/length*offset,
    y:a.y+(b.y-a.y)*t+(b.x-a.x)/length*offset}
}
