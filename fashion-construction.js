import { FASHION_CATALOG_GARMENTS, FASHION_MODIFICATIONS } from './fashion-catalog.js'
import { fashionFamily, fabricFamily, compatibleFashionFabric } from './fashion-types.js'
import { garmentEquipmentSlot } from './garment-slots.js'
import { garmentVisualDesign } from './garment-design.js'
import { scoreTrace } from './model.js'
import { registeredGarmentAsset } from './character-v3/registered-garments.js'
import { fitFashionAttachmentZones } from './fashion-attachment-anchors.js'

export { fashionFamily, fabricFamily, compatibleFashionFabric }
const pts = (pairs) => pairs.map(([x, y]) => ({ x, y }))
const path = (label, pairs, hand = false) => ({ label, points: pts(pairs), hand })
// These are workpiece diagrams, not replacement character art. Each family
// has a real contour and named assembly passes. Machine paths are monotonic
// in y; curved/closed hand-work paths use direct pointer tracing instead.
const BLOCKS = {
  apron: { label: 'Bib & strap assembly', cut: [[235,130],[365,130],[390,200],[435,470],[375,505],[225,505],[165,470],[210,200],[235,130]], seams: [path('Bind the bib and side edge', [[356,150],[371,220],[386,310],[402,400],[420,475]]), path('Secure the strap anchors', [[238,146],[300,155],[362,146]], true)] },
  'waist-apron': { label: 'Waist apron', cut: [[195,230],[405,230],[445,485],[155,485],[195,230]], seams: [path('Attach the waistband', [[198,244],[300,244],[402,244]], true), path('Turn the side and lower hem', [[414,270],[435,473],[300,473],[165,473]], true)] },
  shirt: { label: 'Shirt & blouse', cut: [[240,130],[278,144],[322,144],[360,130],[402,167],[463,232],[421,282],[382,251],[400,498],[200,498],[218,251],[179,282],[137,232],[198,167],[240,130]], seams: [path('Close the side seam', [[378,250],[384,310],[390,390],[396,475]]), path('Set the sleeve', [[375,163],[392,190],[397,225],[381,251]])] },
  knitwear: { label: 'Cut-and-sew knit', cut: [[240,130],[276,151],[324,151],[360,130],[420,179],[460,235],[416,278],[380,250],[392,485],[208,485],[220,250],[184,278],[140,235],[180,179],[240,130]], seams: [path('Stretch seam — side join', [[377,250],[382,320],[388,400],[390,475]]), path('Join the rib neckband', [[245,144],[272,161],[300,168],[328,161],[355,144]], true)] },
  sleeveless: { label: 'Sleeveless bodice', cut: [[237,140],[266,140],[280,190],[320,190],[334,140],[363,140],[378,245],[390,480],[210,480],[222,245],[237,140]], seams: [path('Close the shaped side seam', [[368,220],[370,280],[370,360],[385,462]]), path('Face the neckline', [[270,154],[284,202],[316,202],[330,154]], true)] },
  jacket: { label: 'Jacket & blazer', cut: [[236,120],[285,143],[300,198],[315,143],[364,120],[418,166],[478,469],[432,480],[390,258],[418,505],[182,505],[210,258],[168,480],[122,469],[182,166],[236,120]], seams: [path('Close the jacket side', [[386,250],[393,320],[404,410],[415,483]]), path('Set and ease the sleeve', [[382,161],[400,190],[404,229],[387,252]]), path('Topstitch the front facing', [[311,205],[313,290],[314,385],[314,482]])] },
  coat: { label: 'Coat & cape', cut: [[230,115],[280,138],[300,182],[320,138],[370,115],[423,165],[480,470],[434,483],[397,260],[440,520],[160,520],[203,260],[166,483],[120,470],[177,165],[230,115]], seams: [path('Join the long side panel', [[398,251],[410,340],[423,425],[434,505]]), path('Attach the collar facing', [[239,130],[277,153],[300,194],[323,153],[361,130]], true), path('Close the lining edge', [[316,210],[316,310],[316,410],[316,500]])] },
  waistcoat: { label: 'Waistcoat', cut: [[236,125],[282,125],[300,205],[318,125],[364,125],[401,205],[390,493],[300,462],[210,493],[199,205],[236,125]], seams: [path('Join the shaped side', [[390,212],[385,290],[388,370],[385,465]]), path('Turn the front facing', [[314,213],[315,310],[315,390],[309,450]])] },
  skirt: { label: 'Skirt', cut: [[221,145],[379,145],[435,505],[165,505],[221,145]], seams: [path('Join the side panels', [[376,170],[387,242],[402,338],[418,437],[429,489]]), path('Set the waistband', [[225,158],[300,158],[375,158]], true)] },
  trousers: { label: 'Trouser pair', cut: [[215,140],[385,140],[408,505],[318,505],[300,298],[282,505],[192,505],[215,140]], seams: [path('Outer leg seam', [[382,163],[389,245],[398,350],[405,490]]), path('Inseam and crotch join', [[307,299],[314,351],[320,423],[324,490]]), path('Set the waistband', [[222,155],[300,155],[378,155]], true)] },
  shorts: { label: 'Shorts & culottes', cut: [[213,180],[387,180],[421,430],[323,430],[300,295],[277,430],[179,430],[213,180]], seams: [path('Outer leg seam', [[383,200],[393,280],[405,354],[415,413]]), path('Turn the paired leg hems', [[188,416],[270,416],[277,403],[323,403],[330,416],[412,416]], true)] },
  dress: { label: 'Dress bodice & skirt', cut: [[237,116],[275,141],[325,141],[363,116],[411,163],[441,213],[403,250],[370,226],[348,300],[436,515],[164,515],[252,300],[230,226],[197,250],[159,213],[189,163],[237,116]], seams: [path('Shape the bodice side', [[371,167],[374,222],[350,290]]), path('Join the waist seam', [[255,305],[300,305],[345,305]], true), path('Join the skirt panel', [[351,319],[374,384],[405,459],[428,501]])] },
  jumpsuit: { label: 'Jumpsuit', cut: [[237,116],[280,143],[320,143],[363,116],[411,163],[445,220],[401,253],[371,226],[376,300],[414,520],[326,520],[300,365],[274,520],[186,520],[224,300],[229,226],[199,253],[155,220],[189,163],[237,116]], seams: [path('Bodice side join', [[369,161],[374,218],[368,285]]), path('Attach bodice to trousers', [[230,303],[300,303],[370,303]], true), path('Join the inner leg', [[308,367],[321,441],[333,500]])] },
  neckwear: { label: 'Neckwear & finished edges', cut: [[195,115],[405,115],[405,485],[195,485],[195,115]], seams: [path('Turn the long side edges', [[207,130],[207,310],[207,471]], true), path('Secure the fringed ends', [[207,135],[300,135],[393,135],[393,465],[300,465],[207,465]], true)] },
  millinery: { label: 'Crown & brim', cut: [[230,150],[370,150],[412,294],[468,344],[453,390],[147,390],[132,344],[188,294],[230,150]], seams: [path('Join the crown panels', [[305,162],[311,215],[317,278]]), path('Attach the brim / head band', [[194,301],[247,312],[300,316],[353,312],[406,301]], true)] },
  bag: { label: 'Bag panels & handle', cut: [[199,212],[236,155],[364,155],[401,212],[425,475],[175,475],[199,212]], seams: [path('Close the side gusset', [[397,224],[404,315],[415,461]]), path('Attach the handle anchors', [[238,213],[248,195],[352,195],[362,213]], true), path('Bind the opening', [[206,240],[300,246],[394,240]], true)] },
  gloves: { label: 'Glove & thumb gusset', cut: [[225,470],[222,295],[185,247],[199,215],[239,251],[231,152],[251,142],[270,237],[269,127],[292,127],[300,238],[311,145],[332,150],[323,252],[341,182],[362,197],[346,313],[366,470],[225,470]], seams: [path('Join the thumb gusset', [[202,235],[239,273],[244,325]], true), path('Close the glove side', [[345,309],[350,369],[359,455]])] },
  footwear: { label: 'Mirrored footwear uppers', cut: [[150,282],[218,220],[275,211],[308,254],[382,285],[450,328],[435,391],[260,405],[169,370],[150,282]], seams: [path('Join the left upper', [[218,235],[253,239],[288,261],[333,279],[417,337]], true), path('Mirror the right upper', [[382,235],[347,239],[312,261],[267,279],[183,337]], true), path('Attach and edge the sole', [[168,355],[261,389],[423,377],[439,335]], true)] },
  ornament: { label: 'Hardware & ornament assembly', cut: [[300,150],[351,240],[450,300],[351,360],[300,450],[249,360],[150,300],[249,240],[300,150]], seams: [path('Set the reinforced anchors', [[250,275],[300,255],[350,275]], true), path('Secure the clasp and motif', [[350,320],[300,347],[250,320]], true)] },
}

export function fashionTemplate(schematic = {}) {
  const ref = FASHION_CATALOG_GARMENTS.find((item) => item.id === schematic.artworkId)
    || FASHION_CATALOG_GARMENTS.find((item) => item.cut === schematic.cut && garmentEquipmentSlot(item) === garmentEquipmentSlot(schematic))
  return { ...ref, ...schematic, id: ref?.id || schematic.id, material: schematic.material || ref?.material, tags: [...new Set([...(ref?.tags || []), ...(schematic.tags || [])])] }
}

export function constructionRecipe(schematic, fabric = null) {
  const template = fashionTemplate(schematic)
  const family = fashionFamily(template)
  const block = BLOCKS[family]
  const hand = ['leather', 'suede', 'notions'].includes(fabricFamily(fabric || template.material || {}))
  let operations=block.seams
  const cutName=template.cut
  if(family==='shirt' && /shirt/.test(cutName)) operations=[...operations,path('Attach the collar and front placket',[[270,156],[290,185],[301,236],[301,330],[301,450]],true)]
  if(family==='skirt' && /pleat|origami/.test(cutName)) operations=[operations[0],path('Mark and secure the pleat folds',[[236,164],[246,240],[262,360],[273,474]]),operations[1]]
  if(family==='skirt' && /tier|gather/.test(cutName)) operations=[operations[0],path('Gather and join the tier',[[195,336],[248,342],[300,344],[352,342],[405,336]],true),operations[1]]
  if(family==='jacket' && /puffer/.test(cutName)) operations=[operations[0],path('Quilt the insulated panel',[[230,285],[370,285],[372,340],[228,340],[230,405],[375,405]],true),path('Set the front zip',[[304,211],[304,310],[304,405],[304,482]])]
  if(family==='sleeveless' && /corset/.test(cutName)) operations=[operations[0],path('Stitch the boning channels',[[265,216],[260,280],[257,352]]),operations[1]]
  if(family==='millinery' && /fascinator/.test(cutName)) operations=[path('Join the small base and veil edge',[[225,305],[300,333],[375,305]],true),path('Secure the feather anchors',[[273,261],[302,280],[330,261]],true)]
  if(family==='millinery' && /headband|turban/.test(cutName)) operations=[path('Join and turn the wrap strip',[[180,260],[300,260],[420,260]],true),path('Secure the knot and ends',[[220,335],[300,315],[380,335]],true)]
  if(family==='neckwear' && /belt/.test(cutName)) operations=[path('Bind the strap edge',[[135,275],[465,275]],true),path('Reinforce and set the buckle',[[405,283],[427,300],[405,317]],true)]
  if(family==='neckwear' && /tie/.test(cutName)) operations=[path('Close and turn the long strip',[[295,146],[310,245],[337,398],[308,475]],true),path('Close the hand-slipstitched opening',[[282,258],[294,324],[307,384]],true)]
  if(family==='neckwear' && /bow-tie/.test(cutName)) operations=[path('Turn the bow wings',[[190,272],[190,326],[278,308],[322,308],[410,326],[410,272]],true),path('Attach the centre knot and neck band',[[285,280],[300,293],[315,280]],true)]
  if(family==='footwear' && /boot/.test(cutName)) operations=[path('Join the left boot shaft',[[233,145],[233,225],[240,305]],true),path('Mirror the right boot shaft',[[367,145],[367,225],[360,305]],true),block.seams[2]]
  const seams = operations.map((operation) => ({ ...operation, hand: hand || operation.hand, points: operation.points.map(p => ({ ...p })) }))
  // Small cuts really have a different proportion: do not cut ankle-length
  // trousers and call the result a mini or shorts.
  let cut = block.cut.map(([x,y]) => ({x,y}))
  if(family==='footwear' && /boot/.test(cutName)) cut=pts([[215,130],[370,130],[359,300],[440,345],[430,412],[170,412],[168,365],[232,305],[215,130]])
  if(family==='millinery' && /headband|turban/.test(cutName)) cut=pts([[135,242],[465,242],[465,354],[135,354],[135,242]])
  if(family==='millinery' && /fascinator/.test(cutName)) cut=pts([[210,245],[285,218],[372,239],[420,305],[350,354],[245,342],[182,293],[210,245]])
  if(family==='neckwear' && /belt/.test(cutName)) cut=pts([[120,256],[480,256],[480,336],[120,336],[120,256]])
  if(family==='neckwear' && /tie/.test(cutName)) cut=pts([[271,127],[299,123],[340,385],[335,443],[301,490],[265,450],[285,386],[271,127]])
  if(family==='neckwear' && /bow-tie/.test(cutName)) cut=pts([[177,258],[283,282],[317,282],[423,258],[423,345],[317,320],[283,320],[177,345],[177,258]])
  if(family==='ornament' && /collar/.test(cutName)) cut=pts([[180,222],[249,208],[278,273],[322,273],[351,208],[420,222],[385,370],[300,325],[215,370],[180,222]])
  if(family==='ornament' && /brooch/.test(cutName)) cut=pts([[300,195],[380,240],[405,310],[360,382],[279,400],[204,345],[198,263],[243,210],[300,195]])
  if (family === 'skirt' && /mini/.test(template.cut)) cut = cut.map(p => ({...p,y:p.y>300 ? 350 : p.y}))
  if (family === 'sleeveless' && /corset/.test(template.cut)) cut = cut.map(p => ({...p,y:p.y>300 ? 365 : p.y}))
  return { family, label: block.label, cut, seams, materialCompatible: compatibleFashionFabric(template, fabric),
    allowance: family==='footwear' ? 'Cut a mirrored pair from this upper template; reinforce the joins before attaching the sole.' : hand ? 'Mark a narrow edge allowance; punch before hand joining.' : family === 'knitwear' ? 'Use pre-knitted yardage, stretch seams and a rib neckband.' : 'Keep the grain straight and leave the marked seam allowance.' }
}

export function currentFashionSeam(fashion) {
  const recipe = constructionRecipe(effectiveSchematic(fashion), fashion.fabric)
  return recipe.seams[Math.min(fashion.seamIndex || 0, recipe.seams.length - 1)]
}

// Only geometry changes with a real compatible painted destination are offered.
const RECUTS = {
  'shorten-hem': { skirt:'a-line-skirt', 'pleated-skirt':'a-line-skirt', pants:'shorts', 'wide-leg':'bermuda-shorts', 'cargo-pants':'shorts', 'service-apron':'waist-apron', 'bib-apron':'waist-apron', 'crossback-apron':'waist-apron' },
  'crop-body': { tee:'baby-tee', 'crew-tee':'baby-tee', cardigan:'cropped-cardigan' },
  'taper-leg': { 'wide-leg':'peg-trouser', pants:'peg-trouser' },
}
const SUPPORTED_SURFACE = new Set(['patch-pocket','swap-buttons','contrast-binding','embroidered-mark','overdye','monogram','brass-hardware','decorative-topstitch','color-block','beaded-motif','goldwork'])
export function compatibleFashionModifications(schematic) {
  const template = fashionTemplate(schematic)
  const family = fashionFamily(template)
  return FASHION_MODIFICATIONS.filter(item => item.slots.includes(garmentEquipmentSlot(template)) && (
    item.geometry ? Boolean(RECUTS[item.id]?.[template.cut]) : SUPPORTED_SURFACE.has(item.id)
      && (!['footwear','ornament','millinery','gloves','neckwear','bag'].includes(family) || ['embroidered-mark','monogram','brass-hardware','overdye','beaded-motif','goldwork'].includes(item.id))
      && (!['swap-buttons'].includes(item.id) || ['shirt','jacket','coat','waistcoat'].includes(family))
      && (!['patch-pocket'].includes(item.id) || !['sleeveless','knitwear'].includes(family))
  ))
}

export function effectiveSchematic(fashion) {
  const original = fashionTemplate(fashion.schematic)
  const recut = (fashion.modifications || []).map(id => RECUTS[id]?.[original.cut]).find(Boolean)
  if (!recut) return original
  const target = FASHION_CATALOG_GARMENTS.find(item => item.cut === recut && (!original.material?.family || item.material?.family === original.material.family))
    || FASHION_CATALOG_GARMENTS.find(item => item.cut === recut)
  return target ? { ...original, cut: target.cut, slot: target.slot, artworkId: target.id, id: target.id, material: original.material, tags: [...original.tags, ...target.tags] } : original
}

export function traceCompletion(points = [], guide = [], tolerance = 32) {
  if (points.length < 2 || guide.length < 2) return 0
  // Coverage must include the whole job. Scribbling eighteen dots at the start
  // no longer lets the player skip a seam (or receive a perfect precision score).
  let visited = 0, count = 0
  for (let i=1;i<guide.length;i++) {
    const a=guide[i-1], b=guide[i], n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/9))
    for (let j=0;j<=n;j++) {
      const x=a.x+(b.x-a.x)*j/n, y=a.y+(b.y-a.y)*j/n
      count++
      if(points.some(p=>Math.hypot(p.x-x,p.y-y)<=tolerance)) visited++
    }
  }
  return visited/count
}
export function constructionTraceScore(points, guide, tolerance=32) {
  return Math.round(scoreTrace(points,guide,tolerance)*traceCompletion(points,guide,tolerance))
}

// Finishes live in normalized product-view coordinates, not screen pixels.
// The same coordinates travel into the thumbnail and worn UV mesh.
function defaultFashionFinishZones(schematic) {
  const template=fashionTemplate(schematic), family=fashionFamily(template)
  if(family==='footwear') return [{id:'left-vamp',label:'Left upper',u:.28,v:.60},{id:'right-vamp',label:'Right upper',u:.72,v:.60}]
  if(family==='millinery') return [{id:'band',label:'Hat band',u:.5,v:.6},{id:'side',label:'Side accent',u:.77,v:.5}]
  if(family==='neckwear') return /scarf/.test(template.cut) ? [{id:'tip',label:'Scarf tail',u:.35,v:.68}] : /belt|bow-tie/.test(template.cut) ? [{id:'tip',label:'Knot / buckle accent',u:.5,v:.5}] : [{id:'tip',label:'Tie tip',u:.5,v:.8}]
  if(family==='ornament') return [{id:'motif',label:'Central setting',u:.5,v:.5}]
  if(family==='bag') return [{id:'panel',label:'Front panel',u:.5,v:.58},{id:'clasp',label:'Closure',u:.5,v:.33}]
  if(family==='gloves') return [{id:'left-cuff',label:'Left cuff',u:.25,v:.75},{id:'right-cuff',label:'Right cuff',u:.75,v:.75}]
  if(['trousers','shorts','skirt','waist-apron'].includes(family)) return [{id:'left-hip',label:'Left hip',u:.34,v:.21},{id:'right-hip',label:'Right hip',u:.66,v:.21},{id:'hem',label:'Hem accent',u:.69,v:.76}]
  return [{id:'left-chest',label:'Left chest',u:.37,v:family==='sleeveless'?.42:.27},{id:'right-chest',label:'Right chest',u:.63,v:family==='sleeveless'?.42:.27},{id:'lower-panel',label:'Lower panel',u:['jacket','coat','waistcoat','knitwear','jumpsuit'].includes(family)?.65:.5,v:.63}]
}

export function fashionFinishZones(schematic) {
  const template=fashionTemplate(schematic)
  return fitFashionAttachmentZones(registeredGarmentAsset({...template,id:template.artworkId||template.id}),defaultFashionFinishZones(template))
}

export function compatibleFashionFinishes(schematic, finishes) {
  const family=fashionFamily(fashionTemplate(schematic))
  const ids = family==='footwear' ? ['contrast-trim','monogram','pearl','piping','beading']
    : family==='ornament' ? ['pearl','beading','crystal','goldwork']
      : ['millinery','neckwear','gloves'].includes(family) ? ['flower','contrast-trim','monogram','embroidery','pearl','piping','applique','beading','hand-bound','crystal','goldwork']
        : family==='bag' ? ['contrast-trim','monogram','embroidery','piping','applique','beading','hand-bound','goldwork']
          : ['button','pocket','flower','contrast-trim','monogram','embroidery','pearl','piping','applique','beading','hand-bound','crystal','goldwork']
  return finishes.filter(f=>ids.includes(f.id) && (f.id!=='pocket'||!['sleeveless','knitwear'].includes(family)))
}
export function fashionFinishScore(fashion) {
  const zones=fashionFinishZones(effectiveSchematic(fashion))
  const valid=(fashion.finishing||[]).filter(d=>zones.some(z=>z.id===d.zone))
  const duplicates=valid.length-new Set(valid.map(d=>d.zone)).size
  // Restraint is expressive too. No mandatory decorative buttons on a scarf.
  return Math.max(0,100-duplicates*16)
}

export function fashionModificationPlacements(schematic, modifications = []) {
  const zones=fashionFinishZones(schematic)
  const template=fashionTemplate(schematic)
  const asset=registeredGarmentAsset({...template,id:template.artworkId||template.id})
  const box=asset?.thumbnailBox.split(/\s+/).map(Number)
  const vScale=box ? Math.min(box[2],box[3])/box[3] : 1
  const result=[]
  const place=(type,zone,vShift=0)=>{if(zone) result.push({type,zone:zone.id,u:zone.u,v:zone.v+vShift})}
  const paired=zones.filter(zone=>/left-|right-/.test(zone.id))
  const panel=zones.find(zone=>zone.id==='right-chest'||zone.id==='panel'||zone.id==='side'||zone.id==='motif') || zones[0]
  for(const mod of modifications) {
    if(mod==='patch-pocket') (paired.length ? paired : zones.slice(0,1)).forEach(zone=>place('pocket',zone))
    if(mod==='swap-buttons') [-.022,0,.022].forEach(shift=>place('button',panel,shift*vScale))
    const type={'embroidered-mark':'embroidery',monogram:'monogram','brass-hardware':'button','beaded-motif':'beading',goldwork:'goldwork'}[mod]
    if(type) (fashionFamily(fashionTemplate(schematic))==='footwear' ? zones : [panel]).forEach(zone=>place(type,zone))
  }
  return result
}

export function fashionGarmentDraft(fashion) {
  const template=effectiveSchematic(fashion), fabric=fashion.fabric
  const zones=fashionFinishZones(template)
  const placements=(fashion.finishing||[]).flatMap(detail=>{
    const zone=zones.find(zone=>zone.id===detail.zone)
    return zone ? [{type:detail.type,zone:zone.id,u:zone.u,v:zone.v}] : []
  })
  const modifications=[...new Set([...(fashion.baseGarment?.customization?.modifications||[]),...(fashion.modifications||[])])]
  const overdye=(fashion.modifications||[]).includes('overdye')
  const color=overdye ? fashion.accentColor : fabric?.color || template.palette?.primary || '#c7af88'
  const material= fashion.alterationMode ? fashion.baseGarment?.material || template.material
    : fabric ? { name:fabric.fiber, family: ({knit:'jersey',fluid:fabric.patternKey==='satin'?'satin':undefined,suiting:undefined,woven:undefined,notions:undefined,felt:undefined})[fabricFamily(fabric)] || (['leather','suede','velvet','brocade','sheer'].includes(fabricFamily(fabric)) ? fabricFamily(fabric) : undefined) } : template.material
  const garment={...template, name:fashion.alterationMode ? `Altered ${fashion.baseGarment.name.replace(/^Altered\s+/i,'')}` : `${fabric?.label.split(' ')[0] || 'Studio'} ${fashion.schematic.name.toLowerCase()}`,
    slot:garmentEquipmentSlot(template), color, accentColor:fashion.accentColor,
    setPieceId:fashion.alterationMode ? fashion.baseGarment?.setPieceId || fashion.baseGarment?.id : null,
    palette:{primary:color,secondary:fashion.accentColor}, pattern:fabric?.patternKey||template.pattern||'solid', material,
    tags:[...new Set([...(template.tags||[]),fashion.styleMood||'classic','handmade',...(fashion.alterationMode?['altered']:[])])],
    customization:{...(fashion.baseGarment?.customization||{}), projectId:fashion.projectId, accentColor:fashion.accentColor,mood:fashion.styleMood,
      templateId:template.artworkId || template.id, details:placements.map(d=>d.type),
      placements, modifications, modificationPlacements:fashionModificationPlacements(template,modifications),
      baseGarmentId:fashion.baseGarment?.id||null, construction:{family:fashionFamily(template), seams:constructionRecipe(template,fabric).seams.map(s=>s.label), scores:[...(fashion.seamScores||[])]}},
  }
  const visual=garmentVisualDesign(garment)
  // A material-specific painting already carries pile/grain/motif. When the
  // chosen cloth differs from that source, use the shared alpha-clipped textile
  // recipe instead of falsely claiming the texture is baked into plain cloth.
  if(fabric && !fashion.alterationMode && garment.material?.family && template.material?.family!==garment.material.family) {
    visual.colorPattern={...visual.colorPattern,mode:'overlay'}
  }
  return {...garment,...visual}
}
