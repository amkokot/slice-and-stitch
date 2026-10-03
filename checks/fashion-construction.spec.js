import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {auditPaintedPng} from '../tools/painted-asset-audit.js'
import {FASHION_SCHEMATICS, FASHION_FABRICS, FASHION_CATALOG_GARMENTS, FASHION_FINISHES, tailorStockForDay} from '../fashion-catalog.js'
import {constructionRecipe, fashionFamily, compatibleFashionFabric, fashionGarmentDraft, fashionFinishZones, fashionFinishScore, compatibleFashionFinishes, compatibleFashionModifications, fashionModificationPlacements, effectiveSchematic, constructionTraceScore, traceCompletion, currentFashionSeam} from '../fashion-construction.js'
import {registeredGarmentAsset, renderRegisteredGarment} from '../character-v3/registered-garments.js'
import {renderPaintedPaperDoll} from '../character-v3/painted-paper-doll.js'
import {renderPaintedGarmentThumbnail} from '../character-v3/painted-wardrobe.js'
import {createCharacterState, addCraftedGarment, equipGarment, characterToActorAppearance, garmentFromFashionResult} from '../character-model.js'
const pattern=cut=>FASHION_SCHEMATICS.find(p=>p.cut===cut)
const fabric=id=>FASHION_FABRICS.find(f=>f.id===id)
const project=(cut,id)=>({schematic:pattern(cut),fabric:fabric(id),accentColor:'#e6b85d',styleMood:'classic',modifications:[],finishing:[],seamScores:[]})
const dense=guide=>guide.flatMap((a,i)=>i?Array.from({length:50},(_,j)=>({x:guide[i-1].x+(a.x-guide[i-1].x)*j/49,y:guide[i-1].y+(a.y-guide[i-1].y)*j/49})):[a])

test('every catalogue cut/material and every painted base can be crafted without downgrading its art',()=>{
  const recipes=FASHION_SCHEMATICS.map(s=>fashionGarmentDraft({schematic:s,modifications:[]}))
  const sources=new Set(recipes.map(d=>registeredGarmentAsset(d)?.src))
  for(const garment of FASHION_CATALOG_GARMENTS) {
    assert.ok(FASHION_SCHEMATICS.some(s=>s.cut===garment.cut),garment.cut)
    assert.ok(sources.has(registeredGarmentAsset(garment).src),garment.id)
  }
  assert.ok(FASHION_SCHEMATICS.length>130)
  assert.equal(new Set(FASHION_SCHEMATICS.map(s=>s.id)).size,FASHION_SCHEMATICS.length)
  assert.equal(new Set(FASHION_SCHEMATICS.map(s=>constructionRecipe(s).family)).size,19)
})

test('all construction blocks have valid contours, distinct jobs and feed-safe machine seams',()=>{
  for(const schematic of FASHION_SCHEMATICS) {
    const recipe=constructionRecipe(schematic)
    assert.ok(recipe.seams.length>=2)
    assert.deepEqual(recipe.cut[0],recipe.cut.at(-1))
    for(const seam of recipe.seams) {
      assert.ok(seam.label.length>10)
      for(const p of seam.points) assert.ok(p.x>90&&p.x<510&&p.y>90&&p.y<540)
      if(!seam.hand) for(let i=1;i<seam.points.length;i++) assert.ok(seam.points[i].y>seam.points[i-1].y,`${schematic.id}: feed cannot reverse`)
      assert.equal(constructionTraceScore(dense(seam.points),seam.points),100)
    }
    assert.equal(constructionTraceScore(dense(recipe.cut),recipe.cut),100)
  }
})

test('family jobs distinguish dresses, hats, boots, ties, quilting, pleats and shirt collars',()=>{
  assert.equal(fashionFamily(pattern('shirt-dress')),'dress')
  assert.equal(fashionFamily(pattern('leggings')),'trousers')
  const labels=cut=>constructionRecipe(pattern(cut)).seams.map(s=>s.label).join(' ')
  assert.match(labels('shirt-dress'),/waist seam/)
  assert.match(labels('puffer-jacket'),/Quilt/)
  assert.match(labels('pleated-skirt'),/pleat/)
  assert.match(labels('oxford-shirt'),/collar/)
  assert.match(labels('knee-boots'),/boot shaft/)
  assert.match(labels('bucket-hat'),/crown.*brim/)
  assert.match(labels('necktie'),/long strip/)
  assert.notDeepEqual(constructionRecipe(pattern('necktie')).cut,constructionRecipe(pattern('scarf')).cut)
  assert.notDeepEqual(constructionRecipe(pattern('knee-boots')).cut,constructionRecipe(pattern('loafers')).cut)
})

test('material suitability rejects cotton leather shoes and woven jerseys but permits expressive suitable choices',()=>{
  assert.equal(compatibleFashionFabric(pattern('loafers'),fabric('gingham')),false)
  assert.equal(compatibleFashionFabric(pattern('loafers'),fabric('maker-leather')),true)
  assert.equal(compatibleFashionFabric(pattern('leather-biker-jacket'),fabric('denim')),false)
  assert.equal(compatibleFashionFabric(pattern('leather-biker-jacket'),fabric('chestnut-leather')),true)
  assert.equal(compatibleFashionFabric(pattern('cardigan'),fabric('cream-knit')),true)
  assert.equal(compatibleFashionFabric(pattern('cardigan'),fabric('navy-wool')),false)
  assert.equal(compatibleFashionFabric(pattern('blazer'),fabric('navy-wool')),true)
  assert.equal(compatibleFashionFabric(pattern('blazer'),fabric('gold-brocade')),true)
  assert.ok(constructionRecipe(pattern('loafers'),fabric('maker-leather')).seams.every(s=>s.hand))
})

test('daily patterns have a suitable affordable-to-unlock material and sufficient stock across all levels',()=>{
  for(let level=1;level<=12;level++) for(let day=1;day<=90;day++) {
    const stock=tailorStockForDay(day,0,level)
    for(const schematic of stock.schematics) assert.ok(stock.fabrics.some(f=>compatibleFashionFabric(schematic,f)&&f.stock>=schematic.materialUnits),`${day}/${level}/${schematic.id}`)
  }
  for(const schematic of FASHION_SCHEMATICS) assert.ok(FASHION_FABRICS.some(f=>f.unlockLevel<=schematic.unlockLevel&&compatibleFashionFabric(schematic,f)),schematic.id)
  assert.deepEqual(FASHION_FABRICS.slice(0,3).map(f=>f.id),['gingham','denim','plum'],'original atlas columns must remain stable')
})

test('whole-join coverage cannot be bypassed by dense scribbles at the start',()=>{
  const guide=constructionRecipe(pattern('wide-leg')).seams[0].points
  const scribble=Array.from({length:60},(_,i)=>({x:guide[0].x+i%2,y:guide[0].y+i%2}))
  assert.ok(traceCompletion(scribble,guide)<.25)
  assert.ok(constructionTraceScore(scribble,guide)<25)
  assert.equal(traceCompletion(dense(guide),guide),1)
  const state=project('shirt-dress','cream-poplin')
  state.seamIndex=2
  assert.equal(currentFashionSeam(state).label,'Join the skirt panel')
})

test('clean finishing and repeated paired details are valid, while unsuitable finishes are filtered',()=>{
  const shoes=project('loafers','maker-leather')
  assert.ok(fashionFinishScore(shoes)>=90)
  const available=compatibleFashionFinishes(shoes.schematic,FASHION_FINISHES).map(f=>f.id)
  assert.equal(available.includes('pocket'),false)
  assert.equal(available.includes('button'),false)
  shoes.finishing=fashionFinishZones(shoes.schematic).map(z=>({...z,zone:z.id,type:'pearl'}))
  assert.equal(fashionFinishScore(shoes),100)
  assert.ok(compatibleFashionFinishes(pattern('scarf'),FASHION_FINISHES).every(f=>!['button','pocket'].includes(f.id)))
})

test('every advertised attachment zone lands inside opaque painted fabric, not an open jacket or empty neckline',()=>{
  const cache=new Map()
  for(const schematic of FASHION_SCHEMATICS) {
    const asset=registeredGarmentAsset(fashionGarmentDraft({schematic,modifications:[]}))
    if(!cache.has(asset.src)) cache.set(asset.src,auditPaintedPng(new URL(`..${asset.src}`,import.meta.url)))
    const image=cache.get(asset.src),[bx,by,w,h]=asset.thumbnailBox.split(' ').map(Number),r=Math.min(w,h)*.055
    for(const zone of fashionFinishZones(schematic)) {
      const x=bx+w*zone.u,y=by+h*zone.v
      for(const [dx,dy] of [[0,0],[-1,0],[1,0],[0,-1],[0,1]]) assert.ok(image.alphaAt(Math.round(x+r*dx),Math.round(y+r*dy))>=200,`${schematic.id}/${zone.id}`)
    }
    const mods=compatibleFashionModifications(schematic).map(mod=>mod.id)
    for(const detail of fashionModificationPlacements(schematic,mods)) {
      const x=bx+w*detail.u,y=by+h*detail.v, radius=Math.min(w,h)*(detail.type==='button'?.02:.04)
      for(const [dx,dy] of [[0,0],[-1,0],[1,0],[0,-1],[0,1]]) assert.ok(image.alphaAt(Math.round(x+radius*dx),Math.round(y+radius*dy))>=200,`${schematic.id}/modification/${detail.type}`)
    }
  }
})

test('only implemented surface changes or catalogue-backed recuts are offered',()=>{
  for(const schematic of FASHION_SCHEMATICS) {
    const mods=compatibleFashionModifications(schematic)
    assert.ok(!mods.some(m=>['bespoke-recut','reshape-neckline','take-in','let-out','lace-inset','couture-lining'].includes(m.id)))
    for(const mod of mods.filter(m=>m.geometry)) {
      const state={schematic,modifications:[mod.id]}
      const changed=effectiveSchematic(state)
      assert.notEqual(changed.cut,schematic.cut)
      assert.ok(registeredGarmentAsset(fashionGarmentDraft(state)))
    }
  }
  assert.equal(effectiveSchematic({...project('wide-leg','sage-linen'),modifications:['shorten-hem']}).cut,'bermuda-shorts')
  assert.equal(fashionGarmentDraft({...project('tee','cream-knit'),modifications:['overdye']}).color,'#e6b85d')
})

test('finishing follows the painting through product view, fitted avatar, and save migration',()=>{
  for(const [cut,cloth] of [['blazer','navy-wool'],['leather-biker-jacket','chestnut-leather'],['shirt-dress','cream-poplin'],['loafers','maker-leather'],['bucket-hat','denim'],['scarf','floral-silk']]) {
    const state=project(cut,cloth), zone=fashionFinishZones(state.schematic)[0]
    state.finishing=[{...zone,zone:zone.id,type:cut==='loafers'?'pearl':'embroidery'}]
    const draft={...fashionGarmentDraft(state),quality:94,value:200}
    const event={kind:'fashion',runId:80,result:{garment:draft}}
    const saved=createCharacterState(JSON.parse(JSON.stringify(addCraftedGarment(createCharacterState(),event))))
    const piece=saved.customGarments.at(-1)
    assert.deepEqual(piece.customization.placements,draft.customization.placements)
    assert.equal(registeredGarmentAsset(piece).src,registeredGarmentAsset(draft).src)
    const worn=equipGarment(saved,piece.id)
    const markup=renderPaintedPaperDoll(worn.profile,characterToActorAppearance(worn),{id:`test-${cut}`})
    assert.match(markup,/data-fashion-customization="attached"/)
    assert.match(renderPaintedGarmentThumbnail(piece),/data-fashion-customization="attached"/)
    const ids=[...markup.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1])
    assert.equal(new Set(ids).size,ids.length)
    if(draft.slot==='outerwear') assert.equal(worn.profile.equipped.top,saved.profile.equipped.top)
  }
})

test('specialty materials and original alterations preserve registration instead of recolouring generic cloth',()=>{
  const leather=project('leather-biker-jacket','chestnut-leather')
  const draft=fashionGarmentDraft(leather)
  assert.equal(draft.material.family,'leather')
  assert.match(registeredGarmentAsset(draft).family,/leather-biker/)
  const original=FASHION_CATALOG_GARMENTS.find(g=>g.id==='leather-skirt-ink')
  const altered={...project('pencil-skirt','gingham'),alterationMode:true,baseGarment:original,schematic:{...pattern('pencil-skirt'),artworkId:original.id,material:original.material,tags:original.tags},fabric:{color:original.palette.primary,patternKey:original.pattern,fiber:'Existing garment'},modifications:['monogram']}
  const piece=garmentFromFashionResult({garment:fashionGarmentDraft(altered)})
  assert.match(registeredGarmentAsset(piece).family,/leather-skirt/)
  assert.equal(piece.material.family,'leather')
  const painting=renderRegisteredGarment(registeredGarmentAsset(piece),{id:'test-attachment',...piece.palette,customization:piece.customization})
  assert.match(painting,/details-alpha/)
  assert.match(painting,/data-fashion-detail="monogram"/)
  const brocade=fashionGarmentDraft(project('blazer','gold-brocade'))
  assert.equal(brocade.colorPattern.mode,'overlay')
  assert.equal(brocade.colorPattern.key,'brocade')
  assert.match(renderRegisteredGarment(registeredGarmentAsset(brocade),{id:'brocade-overlay',...brocade.palette,pattern:brocade.pattern,colorPattern:brocade.colorPattern}),/data-textile="brocade" data-textile-mode="overlay"/)
  assert.equal(draft.colorPattern.mode,'painted')
})

test('runtime wiring requires every assembly pass, offers semantic finishing zones and never auto-decorates',()=>{
  const game=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  assert.match(game,/fashion\.seamScores\.push\(score\)/)
  assert.match(game,/fashion\.seamIndex\+\+/)
  assert.match(game,/fashion\.scores\.sew=Math\.round\(fashion\.seamScores\.reduce/)
  assert.match(game,/if \(fashion\.step === 'finish'\) return true/)
  assert.match(game,/if \(!fashionCanAdvance\(\)\) return/)
  assert.match(game,/data-fashion-zone/)
  assert.match(game,/if\(currentFashionSeam\(fashion\)\.hand\)/)
  assert.doesNotMatch(game,/place three|finishing\.length >= 3/)
  const qa=readFileSync(new URL('../fashion-workshop-qa.js',import.meta.url),'utf8')
  assert.doesNotMatch(qa,/localStorage|addCraftedGarment|dispatchEvent|equipGarment/)
})
