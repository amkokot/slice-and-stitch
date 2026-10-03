import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { FASHION_CATALOG_GARMENTS, FASHION_FABRICS, FASHION_SCHEMATICS } from '../fashion-catalog.js'
import { GARMENT_PATTERN_KEYS, garmentVisualDesign } from '../garment-design.js'
import { garmentTextileDefinition } from '../character-v3/garment-textiles.js'
import { registeredGarmentAsset, renderRegisteredGarment, garmentFitMesh } from '../character-v3/registered-garments.js'
import { MAJOR_PAINTINGS } from '../character-v3/major-garments.js'
import { renderPaintedGarmentThumbnail } from '../character-v3/painted-wardrobe.js'
import { renderPaintedPaperDoll } from '../character-v3/painted-paper-doll.js'
import { normalizeGarment, createCharacterState, addCraftedGarment, equipGarment, characterToActorAppearance } from '../character-model.js'
import { selectWardrobeGarments, wardrobeTryOnState } from '../wardrobe-browser.js'
import { auditPaintedPng } from '../tools/painted-asset-audit.js'

const find = (cut) => FASHION_CATALOG_GARMENTS.find((item) => item.cut === cut)

test('every catalogue piece has an immutable silhouette, soft contour and colour-pattern recipe', () => {
  for (const item of FASHION_CATALOG_GARMENTS) {
    assert.equal(item.outline.silhouette,item.cut,item.id)
    assert.equal(item.outline.style,'soft-painted',item.id)
    assert.match(item.outline.color,/^#[0-9a-f]{6}$/i,item.id)
    assert.ok(item.outline.width<=3 && item.outline.opacity<=.3,item.id)
    assert.equal(item.colorPattern.primary,item.palette.primary,item.id)
    assert.equal(item.colorPattern.secondary,item.palette.secondary,item.id)
    assert.ok(GARMENT_PATTERN_KEYS.includes(item.colorPattern.key),item.id)
    assert.ok(['overlay','painted','solid'].includes(item.colorPattern.mode),item.id)
    assert.ok(Object.isFrozen(item.outline) && Object.isFrozen(item.colorPattern),item.id)
    const asset=registeredGarmentAsset(item)
    const options={id:'coverage',primary:item.palette.primary,secondary:item.palette.secondary,pattern:item.pattern,outline:item.outline,colorPattern:item.colorPattern}
    const markup=renderRegisteredGarment(asset,options)
    assert.match(markup,new RegExp(`data-textile="${item.colorPattern.key}"`),item.id)
    assert.equal(markup.includes('<pattern '),item.colorPattern.mode==='overlay',item.id)
    assert.match(markup,/operator="erode"/)
    assert.match(markup,/operator="atop"/, 'an inward contour must retain source alpha')
    assert.equal([...markup.matchAll(/filter="url\(#coverage-contour\)"/g)].length,1,'contour is applied once, not to every fit triangle')
    assert.doesNotMatch(markup,/operator="dilate"|NaN|Infinity/)
    assert.match(renderPaintedGarmentThumbnail(item),new RegExp(`data-textile="${item.colorPattern.key}"`),item.id)
  }
})

test('all catalogue and crafting textile keys have real seamless definitions', () => {
  assert.ok(FASHION_FABRICS.every((fabric)=>GARMENT_PATTERN_KEYS.includes(fabric.patternKey)))
  const designs = GARMENT_PATTERN_KEYS.filter((key)=>key!=='solid').map((key)=>[key,garmentTextileDefinition('textile',{key,mode:'overlay',secondary:'#b8a98c',scale:1})])
  for(const [key,markup] of designs) assert.match(markup,/<pattern.*patternUnits="userSpaceOnUse"/,key)
  assert.equal(new Set(designs.map(([,markup])=>markup)).size,designs.length,'each textile must have a distinct motif')
  assert.equal(garmentTextileDefinition('textile',{key:'brocade',mode:'painted'}),'')
  assert.equal(garmentTextileDefinition('textile',{key:'solid',mode:'solid'}),'')
  assert.match(designs.find(([key])=>key==='floral')[1],/<ellipse/,'flowers are petals rather than polka dots')
})

test('materials keep their painted texture instead of receiving generic colourway checks', () => {
  for(const item of FASHION_CATALOG_GARMENTS.filter((item)=>item.material)) {
    assert.equal(item.colorPattern.mode,'painted',item.id)
    assert.equal(renderRegisteredGarment(registeredGarmentAsset(item),{id:'material',pattern:item.pattern,colorPattern:item.colorPattern}).includes('<pattern '),false,item.id)
  }
  for(const cut of ['brooch','collar','velvet-pumps','monk-shoes']) assert.equal(find(cut).colorPattern.mode,'painted',cut)
})

test('dye and legacy pattern changes update copied recipes; malformed fields are bounded', () => {
  const old=find('crew-tee')
  const dyed=normalizeGarment({...old,palette:{primary:'#183540',secondary:'#fcdf87'},pattern:'floral'})
  assert.equal(dyed.colorPattern.key,'floral')
  assert.equal(dyed.colorPattern.primary,'#183540')
  assert.notEqual(dyed.outline.color,old.outline.color)
  const fallback=normalizeGarment({id:'missing-palette',slot:'top',cut:'crew-tee'})
  assert.equal(fallback.colorPattern.primary,fallback.palette.primary)
  const bounded=garmentVisualDesign({palette:{primary:'bad'},pattern:'unrecognized',outline:{width:Infinity,opacity:4,color:'bad'},colorPattern:{key:'bad',scale:999,opacity:Infinity}})
  assert.equal(bounded.colorPattern.key,'solid')
  assert.equal(bounded.colorPattern.scale,2)
  assert.equal(bounded.outline.opacity,.3)
  assert.match(bounded.outline.color,/^#[0-9a-f]{6}$/)
})

test('crafted recipes survive save normalization and both equipment adapters', () => {
  let state=addCraftedGarment(createCharacterState(),{kind:'fashion',runId:'textile',result:{garment:{name:'Handmade woven shirt',slot:'top',cut:'western-shirt',pattern:'weave',color:'#426467',accentColor:'#efd5a0',quality:94,colorPattern:{key:'weave',mode:'overlay',scale:.75,opacity:.2}}}})
  const crafted=state.customGarments[0]
  state=equipGarment(state,crafted.id)
  state=createCharacterState(JSON.parse(JSON.stringify(state)))
  const details=characterToActorAppearance(state).garmentDetails.top
  assert.deepEqual(details.colorPattern,state.customGarments[0].colorPattern)
  assert.deepEqual(details.outline,state.customGarments[0].outline)
  assert.equal(details.colorPattern.scale,.75)
  const accessoryState=wardrobeTryOnState(state,find('bucket-hat').id,[],12)
  assert.deepEqual(characterToActorAppearance(accessoryState).accessories[0].colorPattern,find('bucket-hat').colorPattern)
  assert.ok(selectWardrobeGarments(state,{scope:'catalogue',search:'weave handmade'}).some((item)=>item.id===crafted.id))
})

test('eight major types use dedicated paintings with valid, isolated alpha and finite fitting meshes', () => {
  assert.equal(Object.keys(MAJOR_PAINTINGS).length,8)
  for(const [cut,asset] of Object.entries(MAJOR_PAINTINGS)) {
    assert.equal(registeredGarmentAsset(find(cut)),asset,cut)
    assert.ok(readFileSync(new URL(`..${asset.src}`,import.meta.url)).length>0)
    const audit=auditPaintedPng(new URL(`..${asset.src}`,import.meta.url)), b=audit.bounds[32]
    assert.equal(audit.width,1024); assert.equal(audit.height,1536)
    assert.ok(b.minX>4 && b.maxX<1020 && b.minY>4 && b.maxY<1532,cut)
    for(const [x,y] of [[0,0],[1023,0],[0,1535],[1023,1535]]) assert.equal(audit.alphaAt(x,y),0,cut)
    if(asset.fit) {
      const mesh=garmentFitMesh(asset.fit)
      assert.ok(mesh.length>4 && mesh.length<400,cut)
      assert.ok(mesh.every((piece)=>!/[NI]aN|Infinity/.test(piece.transform)),cut)
    }
    assert.equal(registeredGarmentAsset({...find(cut),slot:cut==='bucket-hat'?'bottom':'accessory'}),null,cut)
  }
  assert.ok(FASHION_SCHEMATICS.some((piece)=>piece.cut==='puffer-jacket'))
  assert.ok(FASHION_SCHEMATICS.some((piece)=>piece.cut==='leggings'))
})

test('new dresses, sleeves, headwear and fitted leggings retain separate layering semantics', () => {
  for(const cut of ['shirt-dress','sundress']) {
    const markup=renderPaintedPaperDoll({}, {garmentDetails:{top:find(cut),bottom:find('leggings'),outerwear:find('puffer-jacket')}})
    assert.match(markup,/data-paper-one-piece="true"/)
    assert.doesNotMatch(markup,/data-paper-slot="bottom"/)
  }
  assert.match(renderPaintedPaperDoll({}, {garmentDetails:{top:find('sweatshirt'),bottom:find('leggings')}}),/data-covered-legs="true"/)
  assert.match(renderPaintedPaperDoll({}, {accessories:[find('bucket-hat')]}),/data-headwear-fit="crown"/)
  assert.ok(MAJOR_PAINTINGS.sweatshirt.fit.some((row)=>row.length===5),'loose cuffs have independent width, without narrowing the torso')
})
