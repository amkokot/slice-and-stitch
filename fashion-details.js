const VALID = new Set(['button','pocket','flower','contrast-trim','monogram','embroidery','pearl','piping','applique','beading','hand-bound','crystal','goldwork'])
const color = (value,fallback) => /^#[0-9a-f]{6}$/i.test(String(value)) ? value : fallback
const num = value => Number.isFinite(Number(value)) ? Number(value) : .5

function motif(type, x,y,size, accent,primary) {
  const stroke = `stroke="${accent}" stroke-width="${Math.max(2,size*.09)}" stroke-linecap="round" stroke-linejoin="round"`
  const circle=(cx,cy,r,fill=accent)=>`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`
  let shape=''
  if(type==='pocket') shape=`<path d="M-${size} -${size*.65}H${size}V${size*.65}Q0 ${size*1.15} -${size} ${size*.65}Z" fill="${primary}" ${stroke}/><path d="M-${size*.75} -${size*.35}H${size*.75}" ${stroke}/>`
  else if(type==='button'||type==='pearl') shape=circle(0,0,size*.48,type==='pearl'?'#f3ead5':accent)+circle(-size*.12,-size*.15,size*.10,'#fff4d8')+`<path d="M-${size*.09} 0h${size*.18}" stroke="${primary}" stroke-width="3"/>`
  else if(type==='monogram') shape=`<path d="M-${size*.55} ${size*.6}V-${size*.6}L0 ${size*.18}L${size*.55} -${size*.6}V${size*.6}" fill="none" ${stroke}/>`
  else if(['piping','contrast-trim','hand-bound'].includes(type)) shape=`<path d="M-${size*1.5} 0Q0 ${size*.4} ${size*1.5} 0" fill="none" ${stroke}/>`
  else if(type==='beading'||type==='crystal') shape=[[-.7,0],[-.35,-.3],[0,0],[.35,-.3],[.7,0]].map(([a,b])=>circle(a*size,b*size,size*.12,type==='crystal'?'#f0e6ce':accent)).join('')
  else if(type==='applique') shape=`<path d="M0 ${size*.75}Q-${size*1.3} 0 -${size*.6} -${size*.6}Q0 -${size} 0 -${size*.25}Q${size*.5} -${size} ${size*.85} -${size*.35}Q${size} 0 0 ${size*.75}Z" fill="${accent}" opacity=".82"/>`
  else shape=`<path d="M0 ${size}Q-${size*.6} 0 ${size*.15} -${size}" fill="none" ${stroke}/>`+[-1,1].map(side=>`<path d="M0 ${size*.35}Q${side*size} ${size*.1} ${side*size*.65} -${size*.25}Q${side*size*.1} -${size*.25} 0 ${size*.35}" fill="none" ${stroke}/>`).join('')+circle(size*.15,-size,size*.22,type==='goldwork'?'#cfa451':accent)
  return `<g data-fashion-detail="${type}" transform="translate(${x} ${y})">${shape}</g>`
}

// Attach details to the original painting BEFORE its existing UV mesh/parts.
// Source alpha, deleted rear collars and foot openings all mask them too. A
// sewn-on motif cannot float beyond a brim, appear on skin, or ignore a recut.
export function renderFashionDetails(asset, customization, id, primary, secondary) {
  if(!customization) return {defs:'',markup:''}
  const [bx,by,bw,bh]=asset.thumbnailBox.split(/\s+/).map(Number)
  const accent=color(secondary,'#e6b85d'), base=color(primary,'#775070')
  const placements=(customization.placements||[]).slice(0,4).filter(d=>VALID.has(d.type))
  const details=placements.map(d=>motif(d.type,bx+Math.max(.06,Math.min(.94,num(d.u)))*bw,by+Math.max(.06,Math.min(.94,num(d.v)))*bh,Math.min(bw,bh)*.047,accent,base))
  const mods=new Set(customization.modifications||[])
  const registeredMods=Array.isArray(customization.modificationPlacements)
  if(registeredMods) customization.modificationPlacements.filter(d=>VALID.has(d.type)).slice(0,12).forEach(d=>details.push(motif(d.type,bx+bw*num(d.u),by+bh*num(d.v),Math.min(bw,bh)*(d.type==='button'?.02:.04),accent,base)))
  if(!registeredMods && mods.has('patch-pocket')) [.35,.65].forEach(u=>details.push(motif('pocket',bx+bw*u,by+bh*.63,Math.min(bw,bh)*.075,accent,base)))
  if(!registeredMods && mods.has('swap-buttons')) [.32,.44,.56].forEach(v=>details.push(motif('button',bx+bw*.5,by+bh*v,Math.min(bw,bh)*.035,accent,base)))
  for(const [mod,type] of [['embroidered-mark','embroidery'],['monogram','monogram'],['brass-hardware','button'],['beaded-motif','beading'],['goldwork','goldwork']]) {
    if(!registeredMods && mods.has(mod)) details.push(motif(type,bx+bw*.66,by+bh*.32,Math.min(bw,bh)*.048,accent,base))
  }
  if(mods.has('color-block')) details.unshift(`<rect data-fashion-detail="color-block" x="${bx+bw*.5}" y="${by+bh*.38}" width="${bw*.28}" height="${bh*.5}" fill="${accent}" opacity=".4"/>`)
  const border=mods.has('contrast-binding')||mods.has('decorative-topstitch')
  if(!details.length&&!border) return {defs:'',markup:''}
  const mask=`${id}-details-alpha`, edge=`${id}-details-edge`
  const defs=`<mask id="${mask}" mask-type="alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1536"><image href="${asset.src}" width="1024" height="1536"${asset.cleanAlpha ? ` filter="url(#${id})"` : ''}/></mask>${border?`<filter id="${edge}" color-interpolation-filters="sRGB"><feMorphology in="SourceAlpha" operator="erode" radius="${mods.has('contrast-binding')?5:2}" result="inner"/><feComposite in="SourceAlpha" in2="inner" operator="out" result="rim"/><feFlood flood-color="${accent}"/><feComposite in2="rim" operator="in"/></filter>`:''}`
  return {defs,markup:`<g data-fashion-customization="attached" mask="url(#${mask})">${border?`<image data-fashion-detail="edge-stitch" href="${asset.src}" width="1024" height="1536" filter="url(#${edge})" opacity=".65"/>`:''}${details.join('')}</g>`}
}
