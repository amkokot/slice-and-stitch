import test from 'node:test'
import assert from 'node:assert/strict'
import { FASHION_CATALOG_GARMENTS, FASHION_SCHEMATICS } from '../fashion-catalog.js'
import { SPECIALTY_PAINTINGS } from '../character-v3/specialty-garments.js'
import { registeredGarmentAsset, renderRegisteredGarment, garmentFitMesh } from '../character-v3/registered-garments.js'
import { renderPaintedPaperDoll } from '../character-v3/painted-paper-doll.js'
import { createCharacterState, addCraftedGarment, characterToActorAppearance } from '../character-model.js'
import { selectWardrobeGarments, wardrobeTryOnState } from '../wardrobe-browser.js'
import { auditPaintedPng } from '../tools/painted-asset-audit.js'

const find = id => FASHION_CATALOG_GARMENTS.find(g => g.id === id)

test('ten specialty cuts use distinct paintings rather than dyed generic cloth', () => {
  assert.equal(Object.keys(SPECIALTY_PAINTINGS).length,10)
  const materialItems = FASHION_CATALOG_GARMENTS.filter(g => g.material?.family)
  assert.equal(materialItems.length,30)
  for (const garment of materialItems) {
    assert.match(registeredGarmentAsset(garment).family,/^premium-|^apron-leather$/,garment.id)
    assert.equal(garment.pattern,'solid',garment.id)
    const wrongSlot = garment.slot === 'accessory' ? 'apron' : 'accessory'
    assert.equal(registeredGarmentAsset({...garment,slot:wrongSlot}),null,garment.id)
  }
  assert.notEqual(registeredGarmentAsset(find('leather-skirt-sage')).src,registeredGarmentAsset({slot:'bottom',cut:'pencil-skirt'}).src)
  assert.notEqual(registeredGarmentAsset(find('leather-tote-cocoa')).src,registeredGarmentAsset({slot:'accessory',cut:'tote'}).src)
})

test('specialty paintings have transparent corners and visible safety margins', () => {
  for (const asset of Object.values(SPECIALTY_PAINTINGS)) {
    const audit = auditPaintedPng(new URL(`..${asset.src}`,import.meta.url))
    assert.equal(audit.width,1024,asset.family)
    assert.equal(audit.height,1536,asset.family)
    const b = audit.bounds[32]
    assert.ok(b.minX>4 && b.maxX<1020 && b.minY>4 && b.maxY<1532,asset.family)
    for (const [x,y] of [[0,0],[1023,0],[0,1535],[1023,1535]]) assert.equal(audit.alphaAt(x,y),0,asset.family)
    if (asset.fit) for (const triangle of garmentFitMesh(asset.fit)) assert.doesNotMatch(triangle.transform,/NaN|Infinity/)
  }
})

test('new leather cuts are additive and unlock through the existing catalogue progression', () => {
  const state = createCharacterState({})
  const original = JSON.stringify(state)
  for (const id of ['leather-biker-ink','leather-biker-cognac','suede-jacket-sand','suede-jacket-forest','leather-trouser-ink','leather-trouser-cognac','velvet-camisole-wine','velvet-camisole-midnight']) {
    const g = find(id)
    assert.ok(g)
    assert.ok(g.unlockLevel>=6 && g.price>150 && g.quality>=80)
    assert.ok(FASHION_SCHEMATICS.some(pattern => pattern.cut===g.cut),g.cut)
  }
  const fitted = wardrobeTryOnState(state,['velvet-camisole-wine','leather-biker-ink','leather-trouser-cognac','velvet-pump-sage','leather-tote-cocoa'],[],12)
  assert.equal(fitted.profile.equipped.top,'velvet-camisole-wine')
  assert.equal(fitted.profile.equipped.outerwear,'leather-biker-ink')
  assert.equal(fitted.profile.equipped.bottom,'leather-trouser-cognac')
  assert.equal(JSON.stringify(state),original)
})

test('specialty collection and material searches compose with slots without changing ownership', () => {
  const state=createCharacterState({})
  const original=JSON.stringify(state)
  const all=selectWardrobeGarments(state,{scope:'catalogue',theme:'specialty',atelierLevel:12})
  assert.equal(all.length,30)
  const suede=selectWardrobeGarments(state,{scope:'catalogue',theme:'specialty',slot:'outerwear',search:'brushed suede',atelierLevel:12})
  assert.equal(suede.length,2)
  assert.equal(selectWardrobeGarments(state,{scope:'catalogue',theme:'specialty',search:'damask',atelierLevel:12}).length,2)
  assert.equal(selectWardrobeGarments(state,{scope:'catalogue',theme:'specialty',slot:'bottom',search:'lambskin',atelierLevel:12}).length,6)
  assert.equal(JSON.stringify(state),original)
})

test('specialty jacket cuffs, long hems, source neck cutouts and brass remain independently registered', () => {
  const coat=SPECIALTY_PAINTINGS['brocade-coat']
  assert.ok(coat.fit.some(row=>row[1]!==row[3]))
  assert.equal(coat.fit.at(-2)[1],coat.fit.at(-2)[3],'flared hem must not inherit sleeve shortening')
  const mesh=renderRegisteredGarment(SPECIALTY_PAINTINGS['suede-jacket'],{id:'suede-qa',primary:'#536951'})
  assert.match(mesh,/clip-path="url\(#suede-qa-visible\)"/)
  assert.ok(SPECIALTY_PAINTINGS['leather-biker'].neutralTrim)
  assert.ok(SPECIALTY_PAINTINGS['leather-tote'].neutralTrim)
  for (const skin of ['#edb485','#b96f50','#432821']) {
    const markup=renderPaintedPaperDoll({}, {skin,garmentDetails:{top:find('velvet-camisole-wine'),outerwear:find('brocade-coat-berry'),bottom:find('leather-trouser-ink'),shoes:find('velvet-pump-sage')}})
    assert.match(markup,/data-paper-slot="top"/)
    assert.match(markup,/data-paper-slot="outer"/)
    assert.match(markup,/data-covered-legs="true"/)
    assert.equal([...markup.matchAll(/data-body-part="painted-foot-opening"/g)].length,2)
    assert.doesNotMatch(markup,/feet-shared-/)
    assert.match(markup,/data-body-part="foreground-hands"/)
  }
  const shoes=SPECIALTY_PAINTINGS['velvet-pumps']
  assert.ok(shoes.parts.every(part=>part.clearOpening && part.skinOpening))
})

test('foreground hands stay above clothing but never duplicate painted gloves', () => {
  const bare=renderPaintedPaperDoll({}, {garmentDetails:{outerwear:find('brocade-coat-berry'),bottom:find('tuxedo-trouser-butter')}})
  assert.match(bare,/data-body-part="foreground-hands"/)
  const gloves=FASHION_CATALOG_GARMENTS.find(g=>registeredGarmentAsset(g)?.coversHands)
  assert.ok(gloves)
  const gloved=renderPaintedPaperDoll({}, {garmentDetails:{outerwear:find('brocade-coat-berry')},accessories:[gloves]})
  assert.doesNotMatch(gloved,/data-body-part="foreground-hands"/)
})

test('crafted leather and altered specialty pieces retain material-aware registration after save migration', () => {
  let state=addCraftedGarment(createCharacterState({}),{garment:{slot:'bottom',cut:'pencil-skirt',name:'Handmade leather skirt',color:'#704735',pattern:'leather',tags:['full-grain leather'],material:{name:'Full-grain leather',family:'leather'}}})
  const id=state.customGarments[0].id
  state=createCharacterState(JSON.parse(JSON.stringify(state)))
  state=wardrobeTryOnState(state,[id])
  const appearance=characterToActorAppearance(state)
  assert.equal(appearance.garmentDetails.bottom.material.family,'leather')
  assert.equal(registeredGarmentAsset(appearance.garmentDetails.bottom).family,'premium-leather-skirt')
  assert.ok(selectWardrobeGarments(state,{scope:'owned',theme:'specialty'}).some(g=>g.id===id))
  assert.equal(registeredGarmentAsset({slot:'accessory',cut:'tote',id:'crafted-bag',pattern:'leather',tags:['full-grain leather']}).family,'premium-leather-tote')
  assert.equal(registeredGarmentAsset({slot:'bottom',cut:'pencil-skirt',id:'altered-skirt',customization:{baseGarmentId:'leather-skirt-oat'}}).family,'premium-leather-skirt')
})
