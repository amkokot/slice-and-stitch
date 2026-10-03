import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { FASHION_CATALOG_GARMENTS } from '../fashion-catalog.js'
import { CATALOGUE_PAINTINGS } from '../character-v3/catalogue-garments.js'
import { garmentFitMesh, registeredGarmentAsset, renderRegisteredGarment } from '../character-v3/registered-garments.js'
import { renderPaintedPaperDoll } from '../character-v3/painted-paper-doll.js'
import { auditPaintedPng } from '../tools/painted-asset-audit.js'

const find = (cut) => FASHION_CATALOG_GARMENTS.find((g)=>g.cut===cut)

test('the full original clothing catalogue resolves to registered painted art, not generic shapes', () => {
  for (const garment of FASHION_CATALOG_GARMENTS) {
    const asset = registeredGarmentAsset(garment)
    assert.ok(asset, garment.id)
    assert.ok(asset.src.endsWith('.png'), garment.id)
    assert.ok(readFileSync(new URL(`..${asset.src}`,import.meta.url)).length > 0, garment.id)
  }
  for (const cut of ['tunic','camisole','trench-coat','circle-skirt','petal-skirt','ribbon-heels']) {
    const garment = find(cut)
    assert.ok(registeredGarmentAsset(garment), cut)
    assert.equal(registeredGarmentAsset({slot:'apron',cut}), null, `wrong slot: ${cut}`)
  }
  assert.equal(registeredGarmentAsset({slot:'top',cut:'future-unregistered-cut',tags:['soft','classic']}),null)
})

test('all new source paintings have isolated visible margins and transparent corners', () => {
  assert.equal(Object.keys(CATALOGUE_PAINTINGS).length,63)
  for (const asset of Object.values(CATALOGUE_PAINTINGS)) {
    const audit = auditPaintedPng(new URL(`..${asset.src}`,import.meta.url))
    assert.equal(audit.width,1024,asset.family)
    assert.equal(audit.height,1536,asset.family)
    const b = audit.bounds[32]
    assert.ok(b.minX>4 && b.maxX<1020 && b.minY>4 && b.maxY<1532,asset.family)
    for (const [x,y] of [[0,0],[1023,0],[0,1535],[1023,1535]]) assert.equal(audit.alphaAt(x,y),0,asset.family)
  }
})

test('registration meshes use finite transforms and never change the head or body rig', () => {
  for (const asset of Object.values(CATALOGUE_PAINTINGS).filter(a=>a.fit)) {
    const mesh = garmentFitMesh(asset.fit)
    assert.ok(mesh.length > 4 && mesh.length < 400,asset.family)
    for (const part of mesh) {
      assert.doesNotMatch(part.transform,/NaN|Infinity/)
      assert.equal(part.transform.match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/g).length,6)
    }
  }
})

test('dresses and jumpsuits are a single continuous layer and preserve hems beneath coats', () => {
  for (const cut of ['shift-dress','shirt-dress','tea-dress','column-gown','jumpsuit']) {
    const top = find(cut)
    const markup = renderPaintedPaperDoll({}, {garmentDetails:{top,bottom:find('cargo-pants'),outerwear:find('trench-coat')}})
    assert.equal([...markup.matchAll(new RegExp(`data-paper-garment="${top.id}"`,'g'))].length,1,cut)
    assert.match(markup,/data-paper-one-piece="true"/)
    assert.doesNotMatch(markup,/data-paper-slot="dress-bottom"|data-paper-slot="bottom"/)
    assert.match(markup,/data-under-outerwear="long-sleeves"/)
  }
  const css = readFileSync(new URL('../character-v3/painted-paper-doll.css',import.meta.url),'utf8')
  assert.match(css,/data-paper-one-piece[\s\S]*90% 100%/)
})

test('new open footwear samples the selected skin bucket without baked skin or duplicate feet', () => {
  for (const cut of ['mary-janes','velvet-pumps','platform-sandals','clogs','espadrilles','mules','slingbacks','t-strap-heels','monk-shoes']) {
    const shoes = find(cut)
    assert.equal(registeredGarmentAsset(shoes).parts.filter(p=>p.skinOpening).length,2,cut)
    for (const skin of ['#edb485','#b96f50','#432821']) {
      const markup = renderPaintedPaperDoll({}, {skin,garmentDetails:{shoes}})
      assert.equal([...markup.matchAll(/data-body-part="painted-foot-opening"/g)].length,2,cut)
      assert.doesNotMatch(markup,/feet-shared-/)
    }
  }
})

test('specialist cuts have distinct silhouettes instead of borrowing neighbouring garment types', () => {
  const cuts = { halter:'top-halter','shell-top':'top-shell','double-breasted-blazer':'outer-double-blazer',peacoat:'outer-peacoat',
    'paperbag-trouser':'bottom-paperbag',joggers:'bottom-jogger','sailor-trouser':'bottom-sailor',
    mules:'shoes-mule',slingbacks:'shoes-slingback','t-strap-heels':'shoes-t-strap','monk-shoes':'shoes-monk','leather-apron':'apron-leather' }
  for (const [cut,family] of Object.entries(cuts)) {
    assert.equal(registeredGarmentAsset(find(cut)).family,family,cut)
    assert.equal(registeredGarmentAsset({...find(cut),slot:'accessory'}),null,`${cut} cannot attach to the wrong slot`)
  }
  const asset=registeredGarmentAsset(find('mules'))
  assert.ok(asset.src.endsWith('shoes-mule-v2.png'))
  const worn=renderRegisteredGarment(asset,{id:'mule-worn'})
  assert.match(worn,/mask="url\(#mule-worn-left-opening\)"/)
  assert.match(worn,/mask="url\(#mule-worn-right-opening\)"/)
  assert.doesNotMatch(renderRegisteredGarment(asset,{id:'mule-thumb',thumbnail:true}),/mask="url\(#mule-thumb-left-opening\)"/)
})

test('specialist full-length trousers hide the bare leg silhouette but skirts retain visible legs', () => {
  for (const cut of ['paperbag-trouser','joggers','sailor-trouser']) {
    for (const shoes of [null,find('mules')]) {
      const markup=renderPaintedPaperDoll({}, {garmentDetails:{bottom:find(cut),shoes}})
      assert.match(markup,/data-covered-legs="true"/,cut)
      assert.match(markup,/M270 900H754V1268H270Z/)
    }
  }
  assert.match(renderPaintedPaperDoll({}, {garmentDetails:{bottom:find('a-line-skirt'),shoes:find('mules')}}),/data-covered-legs="false"/)
})

test('peacoat cuffs register independently of its longer torso hem', () => {
  const fit=registeredGarmentAsset(find('peacoat')).fit
  const cuff=fit.find(([sourceY]) => sourceY===1160)
  assert.equal(cuff[1],855)
  assert.equal(cuff[3],780)
  const mesh=garmentFitMesh(fit)
  assert.ok(mesh.length > garmentFitMesh(fit.map(row=>row.slice(0,3))).length)
  assert.ok(mesh.every(part=>!part.transform.includes('NaN')))
  const markup=renderPaintedPaperDoll({}, {garmentDetails:{bottom:find('paperbag-trouser'),outerwear:find('peacoat')}})
  assert.match(markup,/data-paper-slot="bottom"[^>]*data-tucked-waist="true"/)
  assert.match(markup,/M310 625H714V900H310Z/, 'fitted side seams must not expose the covered base waist')
  assert.doesNotMatch(renderPaintedPaperDoll({}, {garmentDetails:{bottom:find('paperbag-trouser')}}),/data-tucked-waist/)
})

test('front neck jewelry stays below the face, and headwear tucks the crown without changing identity', () => {
  for (const cut of ['necktie','bow-tie','collar']) {
    const accessory=find(cut)
    const markup=renderPaintedPaperDoll({}, {accessories:[accessory]})
    assert.equal([...markup.matchAll(/data-paper-slot="accessory"/g)].length,1,cut)
    assert.match(markup,/data-paper-depth="neck"/)
    assert.doesNotMatch(markup,/neck-back|neck-rear/)
  }
  assert.match(renderPaintedPaperDoll({}, {accessories:[find('beret')]}),/data-headwear-fit="crown"/)
  assert.match(renderPaintedPaperDoll({}, {accessories:[find('headband')]}),/data-headwear-fit="open"/)
})

test('painted gloves replace bare hands, including the barefoot and sleeveless sub-case', () => {
  const gloves = find('gloves')
  assert.ok(registeredGarmentAsset(gloves).coversHands)
  for (const skin of ['#edb485','#b96f50','#432821']) {
    const markup = renderPaintedPaperDoll({}, {skin, accessories:[gloves]})
    assert.match(markup, /data-covered-hands="true"/)
    assert.match(markup, /M190 740H350V900H190/)
    assert.match(markup, /data-garment-part="left"/)
    assert.match(markup, /data-footwear-attachment="barefoot"/)
  }
  assert.match(renderPaintedPaperDoll({}, {garmentDetails:{shoes:find('clogs')}}), /data-covered-hands="false"/)
})

test('capelets cover inner shoulder straps without removing sleeves or dress hems', () => {
  for (const top of [find('corset-top'), find('shirt-dress')]) {
    const markup = renderPaintedPaperDoll({}, {garmentDetails:{top,outerwear:find('capelet')}})
    assert.match(markup, /data-under-outerwear="cape-shoulders"/)
    assert.match(markup, new RegExp(`data-paper-garment="${top.id}"`))
  }
  const css = readFileSync(new URL('../character-v3/painted-paper-doll.css',import.meta.url),'utf8')
  assert.match(css, /cape-shoulders'[\s\S]*100% 100%, 0 100%/)
})

test('catalogue thumbnails use source art, not misplaced on-body footwear or bag transforms', () => {
  for (const cut of ['mary-janes','espadrilles','satchel','gloves']) {
    const asset=registeredGarmentAsset(find(cut))
    const markup=renderRegisteredGarment(asset,{id:'thumb-test',thumbnail:true})
    assert.match(markup,new RegExp(`viewBox="${asset.thumbnailBox}"`))
    assert.doesNotMatch(markup,/data-footwear-part|data-garment-part|matrix\(/)
  }
})
