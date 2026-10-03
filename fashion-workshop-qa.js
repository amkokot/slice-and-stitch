import { FASHION_SCHEMATICS, FASHION_FABRICS, FASHION_CATALOG_GARMENTS } from './fashion-catalog.js'
import { constructionRecipe, compatibleFashionFabric, effectiveSchematic, fashionGarmentDraft, fashionFinishZones, fashionFinishScore, constructionTraceScore } from './fashion-construction.js'
import { fashionProductPreview } from './fashion-workshop-preview.js'
import { createCharacterState, characterToActorAppearance } from './character-model.js'
import { renderPaintedPaperDoll } from './character-v3/painted-paper-doll.js'

const choices=[['Shirt','oxford-shirt'],['Layered blazer','blazer'],['Leather jacket','leather-biker-jacket'],['Dress','shirt-dress'],['Knit','cardigan'],['Trousers','wide-leg'],['Footwear','loafers'],['Hat','bucket-hat'],['Scarf','scarf'],['Bag','tote'],['Apron','bib-apron']]
const pattern=document.querySelector('#pattern'), material=document.querySelector('#material'), accent=document.querySelector('#accent')
const sample={schematic:FASHION_SCHEMATICS.find(p=>p.cut==='oxford-shirt'),fabric:null,step:'finish',accentColor:accent.value,styleMood:'classic',modifications:[],finishing:[],seamScores:[]}
let revision=0
const garment=cut=>FASHION_CATALOG_GARMENTS.find(g=>g.cut===cut)
const fresh=createCharacterState()
const base={...characterToActorAppearance(fresh),garmentDetails:{top:garment('crew-tee'),bottom:garment('wide-leg'),shoes:garment('sneakers'),apron:null,outerwear:null},accessories:[]}
document.querySelector('nav').innerHTML=choices.map(([label,cut])=>`<button type="button" data-cut="${cut}">${label}</button>`).join('')
pattern.innerHTML=FASHION_SCHEMATICS.map(p=>`<option value="${p.id}">${p.name} · ${p.slot}</option>`).join('')
function setPattern(schematic) {
  sample.schematic=schematic;sample.finishing=[];sample.modifications=[]
  pattern.value=schematic.id
  const fabrics=FASHION_FABRICS.filter(f=>compatibleFashionFabric(schematic,f))
  material.innerHTML=fabrics.map(f=>`<option value="${f.id}">${f.label}</option>`).join('')
  sample.fabric=fabrics[0];render()
}
function render() {
  sample.accentColor=accent.value
  const recipe=constructionRecipe(effectiveSchematic(sample),sample.fabric),draft=fashionGarmentDraft(sample)
  document.querySelectorAll('[data-cut]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.cut===sample.schematic.cut)))
  document.querySelector('#product').innerHTML=fashionProductPreview(sample,`trial-product-${++revision}`)
  const appearance={...base,garmentDetails:{...base.garmentDetails},accessories:[]}
  if(draft.slot==='accessory') appearance.accessories=[draft]
  else appearance.garmentDetails[draft.slot]=draft
  document.querySelector('#avatar').innerHTML=renderPaintedPaperDoll(fresh.profile,appearance,{id:`trial-avatar-${revision}`,label:'Trial garment on avatar'})
  const points=arr=>arr.map(p=>`${p.x},${p.y}`).join(' ')
  document.querySelector('.draft').innerHTML=`<polygon points="${points(recipe.cut)}" fill="${sample.fabric.color}" fill-opacity=".28" stroke="#98785f" stroke-width="3" stroke-dasharray="7 6"/>${recipe.seams.map((seam,index)=>`<polyline points="${points(seam.points)}" fill="none" stroke="${['#82475f','#ad813e','#527b70'][index%3]}" stroke-width="5"/><text x="${seam.points[0].x-20}" y="${seam.points[0].y-12}">${index+1}</text>`).join('')}`
  document.querySelector('#instructions').textContent=recipe.allowance+' '+recipe.seams.map((s,i)=>`${i+1}. ${s.label} (${s.hand?'hand-work':'machine feed'})`).join(' · ')
  const zones=fashionFinishZones(effectiveSchematic(sample))
  document.querySelector('#finishes').innerHTML='<button type="button" id="clean">Clean finish</button>'+zones.map(z=>`<button type="button" data-zone="${z.id}">${z.label} · ${recipe.family==='footwear'?'pearl':'embroidery'}</button>`).join('')
  document.querySelector('#clean').addEventListener('click',()=>{sample.finishing=[];render()})
  document.querySelectorAll('[data-zone]').forEach(b=>b.addEventListener('click',()=>{
    const z=zones.find(z=>z.id===b.dataset.zone)
    sample.finishing=sample.finishing.filter(d=>d.zone!==z.id)
    sample.finishing.push({...z,zone:z.id,type:recipe.family==='footwear'?'pearl':'embroidery'});render()
  }))
  // Exercise the real scoring on dense perfect traces, not just guide vertices.
  const densify=guide=>guide.flatMap((a,i)=>i?Array.from({length:40},(_,j)=>({x:guide[i-1].x+(a.x-guide[i-1].x)*j/39,y:guide[i-1].y+(a.y-guide[i-1].y)*j/39})):[a])
  const scores=recipe.seams.map(s=>constructionTraceScore(densify(s.points),s.points))
  document.querySelector('#status').textContent=`${FASHION_SCHEMATICS.length} patterns · ${new Set(FASHION_SCHEMATICS.map(p=>constructionRecipe(p).family)).size} construction families · ${recipe.seams.length} assembly passes · sample seam scores ${scores.join('/')} · finish ${fashionFinishScore(sample)}/100 · ${sample.finishing.length} optional details`
}
document.querySelectorAll('[data-cut]').forEach(button=>button.addEventListener('click',()=>setPattern(FASHION_SCHEMATICS.find(p=>p.cut===button.dataset.cut))))
pattern.addEventListener('change',()=>setPattern(FASHION_SCHEMATICS.find(p=>p.id===pattern.value)))
material.addEventListener('change',()=>{sample.fabric=FASHION_FABRICS.find(f=>f.id===material.value);render()})
accent.addEventListener('change',render)
setPattern(sample.schematic)
