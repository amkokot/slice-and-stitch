import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { FASHION_CATALOG_GARMENTS } from '../fashion-catalog.js'
import { wearableFitExamples } from '../character-v3/wearable-fit-audit.js'
import { registeredGarmentAsset, renderRegisteredGarment } from '../character-v3/registered-garments.js'
import { renderPaintedPaperDoll } from '../character-v3/painted-paper-doll.js'
import { renderModularHead } from '../character-v3/modular-head.js'
import { auditPaintedPng } from '../tools/painted-asset-audit.js'

const find = (id) => FASHION_CATALOG_GARMENTS.find(item => item.id === id)
const outfit = (example) => ({
  garmentDetails:Object.fromEntries(['top','bottom','shoes'].map(slot => [slot,find(example[slot])])),
  accessories:example.accessory ? [find(example.accessory)] : [],
})

test('wearable fitting audit covers every footwear and headwear source, including older capsule art', () => {
  for (const kind of ['footwear','headwear']) {
    const examples = wearableFitExamples(kind)
    const expected = new Set(FASHION_CATALOG_GARMENTS.filter(item => {
      const asset = registeredGarmentAsset(item)
      return kind === 'footwear' ? item.slot === 'shoes' : item.slot === 'accessory' && (asset.coversCrown || ['headband','fascinator'].includes(asset.family))
    }).map(item => registeredGarmentAsset(item).src))
    assert.deepEqual(new Set(examples.map(item => registeredGarmentAsset(find(item.auditItem)).src)),expected)
    assert.equal(examples.length,expected.size)
    assert.equal(examples.length,kind === 'footwear' ? 17 : 8)
  }
  assert.equal(wearableFitExamples('footwear',{search:'platform'})[0].shoes,'platform-sandal-moss')
  assert.ok(wearableFitExamples('footwear',{trousers:true}).every(item=>item.bottom === 'painted-wide-trousers-sage'))
  const qa = readFileSync(new URL('../character-v3/catalogue-qa.js',import.meta.url),'utf8')
  assert.doesNotMatch(qa,/localStorage|saveCharacter|equipGarment/)
})

test('every shoe and hat thumbnail contains the whole painted silhouette, with no toe/heel cropping', () => {
  for (const example of [...wearableFitExamples('footwear'),...wearableFitExamples('headwear')]) {
    const asset = registeredGarmentAsset(find(example.auditItem))
    const bounds = auditPaintedPng(new URL(`..${asset.src}`,import.meta.url)).bounds[128]
    const [x,y,width,height] = asset.thumbnailBox.split(' ').map(Number)
    assert.ok(bounds.minX >= x && bounds.minY >= y && bounds.maxX <= x+width && bounds.maxY <= y+height,asset.family)
  }
})

test('fitted footwear stays at ground level, and the raised bucket crown stays inside the canvas', () => {
  const transform = (value, x, y) => {
    const translate = value.match(/translate\((-?[\d.]+)\s+(-?[\d.]+)\)/)
    const scale = value.match(/scale\(([\d.]+)(?:\s+([\d.]+))?\)/)
    return [x*Number(scale?.[1] || 1)+Number(translate?.[1] || 0),y*Number(scale?.[2] || scale?.[1] || 1)+Number(translate?.[2] || 0)]
  }
  for (const example of wearableFitExamples('footwear')) {
    const asset = registeredGarmentAsset(find(example.auditItem))
    const audit = auditPaintedPng(new URL(`..${asset.src}`,import.meta.url))
    for (const part of asset.parts) {
      const b = audit.boundsIn(part.clip[0],part.clip[0]+part.clip[2],128)
      const [left,top] = transform(part.transform,b.minX,b.minY)
      const [right,bottom] = transform(part.transform,b.maxX,b.maxY)
      assert.ok(left>130 && right<850 && top>1000 && bottom<1460,`${asset.family}/${part.key}: ${left}, ${top}, ${right}, ${bottom}`)
    }
  }
  const bucket = registeredGarmentAsset(find('bucket-hat-indigo'))
  const b = auditPaintedPng(new URL(`..${bucket.src}`,import.meta.url)).bounds[128]
  assert.ok(transform(bucket.transform,b.minX,b.minY)[1]>=0)
  assert.ok(transform(bucket.transform,b.maxX,b.maxY)[1]<145,'the brim must clear the eyes')
})

test('rear ankle straps and boot openings are removed only from the worn layer, not the product painting', () => {
  for (const id of ['slingback-sky','t-strap-moss','platform-sandal-moss','heeled-boot-coral']) {
    const garment = find(id)
    const asset = registeredGarmentAsset(garment)
    for (const part of asset.parts) assert.ok(part.wornCutout,`${id}/${part.key}`)
    const worn = renderRegisteredGarment(asset,{id:'worn',...garment.palette})
    const thumbnail = renderRegisteredGarment(asset,{id:'product',...garment.palette,thumbnail:true})
    assert.match(worn,/mask="url\(#worn-left-opening\)"/)
    assert.match(worn,/mask="url\(#worn-right-opening\)"/)
    assert.doesNotMatch(thumbnail,/mask="url\(#product-(left|right)-opening\)"/)
    assert.equal([...worn.matchAll(/data-footwear-part=/g)].length,2)
  }
})

test('the sandal heels register to the shared ankle centres rather than beside the leg', () => {
  const [left,right] = registeredGarmentAsset(find('platform-sandal-moss')).parts
  const matrix = (part) => [...part.transform.matchAll(/-?\d*\.?\d+/g)].map(value=>Number(value[0]))
  const position = (part,point) => { const [x,y,sx,sy]=matrix(part); return [x+sx*point[0],y+sy*point[1]] }
  const centres = [position(left,[330,1150]),position(right,[693,1150])]
  for (const [index,expectedX] of [395,627].entries()) {
    assert.ok(Math.abs(centres[index][0]-expectedX)<4)
    assert.ok(centres[index][1]>1260 && centres[index][1]<1290)
  }
})

test('boot shafts hide the old calf silhouette without masking uncovered knees or other footwear', () => {
  for (const skin of ['#edb485','#b96f50','#432821']) {
    const boots = renderPaintedPaperDoll({}, {skin,...outfit(wearableFitExamples('footwear').find(item=>item.shoes === 'heeled-boot-coral'))})
    assert.match(boots,/data-footwear-occlusion="shaft"/)
    assert.match(boots,/data-body-part="painted-ankle-bridge"[^>]*mask="url\(#[^)]*-covered-arms\)"/)
    assert.match(boots,/M290 1066H470V1360H290ZM552 1066H722V1360H552Z/)
    assert.doesNotMatch(renderPaintedPaperDoll({}, {skin,garmentDetails:{shoes:find('canvas-sneakers')}}),/data-footwear-occlusion="shaft"/)
  }
})

test('tall boot shafts tuck inside full-length trouser hems but remain whole with skirts', () => {
  const boots = find('heeled-boot-coral')
  for (const bottom of ['painted-wide-trousers-sage','sailor-trouser-ink','paperbag-trouser-oat','leather-trouser-cognac']) {
    assert.match(renderPaintedPaperDoll({}, {garmentDetails:{bottom:find(bottom),shoes:boots}}),/data-paper-slot="shoes"[^>]*data-under-long-hem="true"/,bottom)
  }
  for (const bottom of ['painted-pencil-skirt-sage','painted-tailored-shorts-ivory']) {
    assert.doesNotMatch(renderPaintedPaperDoll({}, {garmentDetails:{bottom:find(bottom),shoes:boots}}),/data-under-long-hem/)
  }
  assert.doesNotMatch(renderPaintedPaperDoll({}, {garmentDetails:{bottom:find('painted-wide-trousers-sage'),shoes:find('canvas-sneakers')}}),/data-under-long-hem/)
})

test('hat occlusion retains forehead, eyes and brows across tones and hair silhouettes', () => {
  for (const example of wearableFitExamples('headwear')) {
    const crown = registeredGarmentAsset(find(example.auditItem)).coversCrown
    for (const hairStyle of ['buzz','shoulder-waves','afro','curls','bob']) for (const skin of ['#edb485','#b96f50','#432821']) {
      const markup = renderPaintedPaperDoll({hairStyle},{skin,...outfit(example)},{id:`hat-${example.auditItem}-${hairStyle}-${skin.slice(1)}`})
      assert.match(markup,/data-avatar-part="eyes"/)
      assert.match(markup,/data-avatar-part="brows"/)
      assert.match(markup,/data-avatar-part="face"/)
      if (crown) {
        assert.match(markup,/data-headwear-occlusion="hair-only"/)
        assert.match(markup,/data-headwear-occlusion="upper-scalp"/)
        assert.match(markup,/<rect x="-120" y="24" width="480" height="360"/)
      } else assert.doesNotMatch(markup,/data-headwear-occlusion/)
      const ids = [...markup.matchAll(/ id="([^"]+)"/g)].map(match=>match[1])
      assert.equal(ids.length,new Set(ids).size)
    }
  }
  const css = readFileSync(new URL('../character-v3/painted-paper-doll.css',import.meta.url),'utf8')
  assert.doesNotMatch(css,/headwear-fit='crown'[^}]*clip-path/)
  assert.doesNotMatch(renderModularHead({}, {}, {hairVisibility:'bad " injected'}),/headwear-hair/)
})

test('a headband fits a buzz cut without floating; identity and thumbnail registration stay independent', () => {
  const band = find('headband-plum')
  const asset = registeredGarmentAsset(band)
  const compact = renderRegisteredGarment(asset,{id:'band',hairStyle:'buzz'})
  assert.ok(compact.includes(asset.hairTransforms.buzz))
  assert.ok(renderRegisteredGarment(asset,{id:'normal',hairStyle:'shoulder-waves'}).includes(asset.transform))
  assert.ok(!renderRegisteredGarment(asset,{id:'thumbnail',hairStyle:'buzz',thumbnail:true}).includes(asset.hairTransforms.buzz))
  assert.ok(renderPaintedPaperDoll({hairStyleId:'buzz'},{accessories:[band]}).includes(asset.hairTransforms.buzz))
  const turban = find('silk-turban-berry')
  assert.ok(renderPaintedPaperDoll({hairStyleId:'afro'},{accessories:[turban]}).includes(registeredGarmentAsset(turban).hairVisibilityByStyle.afro))
})
