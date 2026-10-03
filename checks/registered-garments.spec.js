import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { FASHION_CATALOG_GARMENTS } from '../fashion-catalog.js'
import { characterToActorAppearance, createCharacterState, equipGarment } from '../character-model.js'
import { PAINTED_CAPSULE_CUTS, PAINTED_CAPSULE_GARMENTS, PAINTED_CAPSULE_STARTERS } from '../character-v3/painted-capsule.js'
import { REGISTERED_GARMENTS, registeredGarmentAsset, garmentTintMatrix } from '../character-v3/registered-garments.js'
import { renderPaintedPaperDoll } from '../character-v3/painted-paper-doll.js'
import { renderPaintedGarmentThumbnail } from '../character-v3/painted-wardrobe.js'
import { auditPaintedPng } from '../tools/painted-asset-audit.js'

test('painted capsule has distinct registered art and is available in existing saves', () => {
  assert.equal(PAINTED_CAPSULE_CUTS.length, 25)
  assert.equal(PAINTED_CAPSULE_GARMENTS.length, 100)
  assert.equal(new Set(PAINTED_CAPSULE_GARMENTS.map(({ id }) => id)).size, 100)
  const saved = createCharacterState({ wardrobe: ['denim-trousers'] })
  for (const id of PAINTED_CAPSULE_STARTERS) {
    assert.ok(saved.wardrobe.includes(id), id)
    assert.ok(FASHION_CATALOG_GARMENTS.some((garment) => garment.id === id))
  }
  for (const asset of Object.values(REGISTERED_GARMENTS)) {
    const png = readFileSync(new URL(`..${asset.src}`, import.meta.url))
    assert.equal(png.readUInt32BE(16), 1024)
    assert.equal(png.readUInt32BE(20), 1536)
  }
  assert.equal(new Set(PAINTED_CAPSULE_GARMENTS.map((garment) => registeredGarmentAsset(garment)?.src)).size, PAINTED_CAPSULE_CUTS.length)
})

test('new everyday families upgrade matching original catalogue cuts, not unrelated silhouettes', () => {
  const cases = { 'oxford-shirt': 'button-shirt', pullover: 'knit-pullover', tank: 'rib-tank', 'trucker-jacket': 'denim-jacket', waistcoat: 'tailored-waistcoat', 'a-line-skirt': 'a-line-skirt', 'bermuda-shorts': 'tailored-shorts', 'chelsea-boots': 'ankle-boots', 'ballet-flats': 'ballet-flats', 'bib-apron': 'bib-apron', scarf: 'woven-scarf', polo: 'pique-polo', 'camp-shirt': 'camp-shirt', 'wrap-blouse': 'wrap-blouse', 'cargo-pants': 'cargo-trousers', 'pleated-skirt': 'pleated-midi', 'chore-jacket': 'chore-jacket', 'crossback-apron': 'crossback-apron' }
  for (const [cut, family] of Object.entries(cases)) {
    const original = FASHION_CATALOG_GARMENTS.find((garment) => garment.cut === cut && !garment.id.startsWith('painted-'))
    assert.ok(original, cut)
    assert.equal(registeredGarmentAsset(original)?.family, family, original.id)
    assert.match(renderPaintedGarmentThumbnail(original), new RegExp(REGISTERED_GARMENTS[family].src))
  }
  for (const [slot, cut] of [['top', 'unknown-turtleneck'], ['top', 'unpainted-halter'], ['outerwear', 'imaginary-coat'], ['bottom', 'new-unregistered-skirt'], ['shoes', 'unknown-heels']]) {
    assert.equal(registeredGarmentAsset({ slot, cut, tags: ['classic', 'soft'] }), null, cut)
  }
})

test('new painted sources have transparent margins and fit only their registered body region', () => {
  const transformPoint = (transform, x, y) => {
    const translate = transform.match(/translate\(([-.\d]+)[ ,]+([-.\d]+)\)/)
    const scale = transform.match(/scale\(([-.\d]+)(?:[ ,]+([-.\d]+))?\)/)
    return [x * Number(scale?.[1] || 1) + Number(translate?.[1] || 0), y * Number(scale?.[2] || scale?.[1] || 1) + Number(translate?.[2] || 0)]
  }
  for (const cut of PAINTED_CAPSULE_CUTS.slice(7)) {
    const garment = PAINTED_CAPSULE_GARMENTS.find(({ id }) => id === `painted-${cut.key}-ivory`)
    const asset = registeredGarmentAsset(garment)
    const audit = auditPaintedPng(new URL(`..${asset.src}`, import.meta.url))
    const bounds = audit.bounds[32]
    assert.ok(bounds.minX > 4 && bounds.maxX < 1019 && bounds.minY > 4 && bounds.maxY < 1531, `${cut.key}: clipped source perimeter`)
    for (const [x, y] of [[0, 0], [1023, 0], [0, 1535], [1023, 1535]]) assert.equal(audit.alphaAt(x, y), 0, cut.key)
    const regions = asset.parts ? asset.parts.map((part) => ({ transform: part.transform, bounds: audit.boundsIn(part.clip[0], part.clip[0] + part.clip[2]) })) : [{ transform: asset.transform, bounds }]
    for (const region of regions) {
      const [minX, minY] = transformPoint(region.transform, region.bounds.minX, region.bounds.minY)
      const [maxX, maxY] = transformPoint(region.transform, region.bounds.maxX, region.bounds.maxY)
      const flaredSkirt = cut.key === 'a-line-skirt'
      assert.ok(minX >= (flaredSkirt ? 150 : 185) && maxX <= (flaredSkirt ? 850 : 825) && maxY < 1460, `${cut.key}: off-body registration ${[minX, minY, maxX, maxY]}`)
      if (cut.slot === 'shoes') assert.ok(minY >= 1180 && maxY >= 1380, `${cut.key}: footwear is not at the ankles`)
      if (['top', 'outerwear'].includes(cut.slot)) assert.ok(minY >= (cut.slot === 'outerwear' ? 240 : 260) && minY <= 380 && maxY >= 660 && maxY <= 835, `${cut.key}: torso attachment drift`)
      if (cut.slot === 'bottom') assert.ok(minY >= 640 && minY <= 720 && maxY > 880 && maxY < (cut.cut === 'cargo-pants' ? 1340 : 1200), `${cut.key}: waistband/hem attachment drift`)
      if (cut.slot === 'apron') assert.ok(minY >= 280 && minY <= 700 && maxY >= 900 && maxY <= 1130, `${cut.key}: apron straps/hem attachment drift`)
      if (cut.slot === 'accessory') assert.ok(minY >= 280 && maxY <= 630, `${cut.key}: scarf left neck anchor`)
    }
  }
})

test('rolled and three-quarter sleeves keep exposed forearms and independent inner layers', () => {
  const find = (key) => PAINTED_CAPSULE_GARMENTS.find(({ id }) => id === `painted-${key}-ivory`)
  for (const key of ['pique-polo', 'camp-shirt', 'wrap-blouse']) {
    const markup = renderPaintedPaperDoll({}, { garmentDetails: { top: find(key), shoes: find('penny-loafers') } })
    assert.match(markup, /data-covered-arms="false"/)
    assert.match(markup, new RegExp(`data-paper-family="${key}"`))
  }
  const chore = find('chore-jacket')
  assert.equal(registeredGarmentAsset(chore).coversArms, false)
  const rolled = renderPaintedPaperDoll({}, { garmentDetails: { top: find('camp-shirt'), outerwear: chore, apron: find('crossback-apron'), shoes: find('penny-loafers') } })
  assert.match(rolled, /data-covered-arms="false"/)
  assert.match(rolled, /data-under-outerwear="rolled-sleeves"/)
  assert.match(rolled, /data-paper-family="crossback-apron"/)
  const longInner = renderPaintedPaperDoll({}, { garmentDetails: { top: find('button-shirt'), outerwear: chore, shoes: find('penny-loafers') } })
  assert.match(longInner, /data-covered-arms="true"/)
  assert.match(longInner, /data-under-outerwear="rolled-sleeves"/)
})

test('a sleeveless waistcoat retains inner sleeves; a denim jacket replaces them', () => {
  const find = (key) => PAINTED_CAPSULE_GARMENTS.find(({ id }) => id === `painted-${key}-ivory`)
  const shirt = find('button-shirt')
  const waistcoat = renderPaintedPaperDoll({}, { garmentDetails: { top: shirt, outerwear: find('tailored-waistcoat') } }, { id: 'shirt-vest' })
  assert.match(waistcoat, /data-covered-arms="true"/)
  assert.doesNotMatch(waistcoat, /data-under-outerwear/)
  assert.match(waistcoat, /data-paper-family="tailored-waistcoat"/)
  const tank = renderPaintedPaperDoll({}, { garmentDetails: { top: find('rib-tank'), outerwear: find('tailored-waistcoat') } })
  assert.doesNotMatch(tank, /data-covered-arms="true"|data-under-outerwear/)
  const jacket = renderPaintedPaperDoll({}, { garmentDetails: { top: shirt, outerwear: find('denim-jacket') } })
  assert.match(jacket, /data-covered-arms="true"/)
  assert.match(jacket, /data-under-outerwear="cropped-sleeves"/)
})

test('painted scarves use their own dye and artwork, independently of the face and skin', () => {
  const scarf = PAINTED_CAPSULE_GARMENTS.find(({ id }) => id === 'painted-woven-scarf-rose')
  const top = PAINTED_CAPSULE_GARMENTS.find(({ id }) => id === 'painted-crew-tee-ivory')
  const markup = renderPaintedPaperDoll({}, { skin: '#432821', garmentDetails: { top }, accessories: [scarf, scarf] }, { id: 'scarves' })
  assert.match(markup, /accessory-woven-scarf-v1/)
  assert.match(markup, /data-paper-slot="accessory"/)
  assert.doesNotMatch(markup, /data-accessory-family="scarf"/)
  const ids = [...markup.matchAll(/ id="([^"]+)"/g)].map((match) => match[1])
  assert.equal(ids.length, new Set(ids).size)
  assert.match(markup, /scarves-accessory-0-accessory-fabric/)
  assert.match(markup, /scarves-accessory-1-accessory-fabric/)
})

test('saved and legacy scarf appearances resolve to painted art below the face', () => {
  const scarves = FASHION_CATALOG_GARMENTS.filter(({ slot, cut }) => slot === 'accessory' && cut === 'scarf')
  for (const scarf of scarves) {
    const state = equipGarment(createCharacterState({ wardrobe: [scarf.id] }), scarf.id)
    const appearance = characterToActorAppearance(state)
    const equipped = appearance.accessories.find(({ id }) => id === scarf.id)
    assert.equal(equipped.slot, 'accessory', scarf.id)
    assert.equal(registeredGarmentAsset(equipped).family, 'woven-scarf')
    const markup = renderPaintedPaperDoll(state.profile, appearance)
    assert.match(markup, /accessory-woven-scarf-v1/)
    assert.ok(markup.includes(`data-paper-garment="${scarf.id}"`))
    assert.doesNotMatch(markup, /data-accessory-family="scarf"|feTurbulence/)
    const { slot, ...legacyAccessory } = equipped
    assert.match(renderPaintedPaperDoll({}, { accessories: [legacyAccessory] }), /data-paper-family="woven-scarf"/)
  }
  const css = readFileSync(new URL('../character-v3/painted-paper-doll.css', import.meta.url), 'utf8')
  const scarfZ = Number(css.match(/garment--accessory\[data-paper-family='woven-scarf'\]\s*\{ z-index: (\d+)/)?.[1])
  const apronZ = Number(css.match(/garment--apron\s*\{ z-index: (\d+)/)?.[1])
  const faceZ = Number(css.match(/head--front\s*\{ z-index: (\d+)/)?.[1])
  assert.ok(apronZ < scarfZ && scarfZ < faceZ, 'neck fabric must clear clothes without covering the chin/hair')
})

test('neck accessories discard hidden fabric and use a single visible front layer', () => {
  const scarf = PAINTED_CAPSULE_GARMENTS.find(({ id }) => id === 'painted-woven-scarf-sage')
  const markup = renderPaintedPaperDoll({}, { accessories: [scarf, { id: 'tie-test', cut: 'custom-tie' }, { id: 'hat-test', cut: 'custom-beret' }] }, { id: 'neck-depth' })
  assert.equal([...markup.matchAll(/data-paper-family="woven-scarf"/g)].length, 1)
  assert.doesNotMatch(markup, /neck-back|neck-front|neck-rear|data-paper-depth/)
  assert.match(markup, /painted-paper-doll__accessories--neck/)
  assert.match(markup, /neck-depth-accessory-texture-neck-visible/)
  assert.match(markup, /painted-paper-doll__accessories--foreground/)
  assert.match(markup, /feComposite in2="SourceGraphic" operator="in"/)
  const asset = registeredGarmentAsset(scarf)
  assert.equal(asset.depthParts, undefined)
  assert.ok(asset.visibleContour.includes('Q'), 'front edge follows the fabric drape, not a horizontal chop')
  assert.ok(markup.includes(`<path d="${asset.visibleContour}"/>`))
  assert.ok(renderPaintedGarmentThumbnail(scarf).includes(`<path d="${asset.visibleContour}"/>`), 'selector and worn cutout must match')
  const ids = [...markup.matchAll(/ id="([^"]+)"/g)].map((match) => match[1])
  assert.equal(ids.length, new Set(ids).size)
  const css = readFileSync(new URL('../character-v3/painted-paper-doll.css', import.meta.url), 'utf8')
  const neckZ = Number(css.match(/__accessories--neck\s*\{ z-index: (\d+)/)?.[1])
  const faceZ = Number(css.match(/head--front\s*\{ z-index: (\d+)/)?.[1])
  assert.ok(neckZ < faceZ)
})

test('tall registered thumbnails are sized inside a contained selector swatch', () => {
  const css = readFileSync(new URL('../character-creator.css', import.meta.url), 'utf8')
  const swatch = css.match(/\.character-garment-art\s*\{([^}]+)\}/)?.[1]
  const thumbnail = css.match(/\.painted-garment-thumbnail\s*\{([^}]+)\}/)?.[1]
  const painting = css.match(/\.painted-garment-thumbnail__painting\s*\{([^}]+)\}/)?.[1]
  assert.match(swatch, /height: 58px/)
  assert.match(swatch, /overflow: hidden/)
  assert.match(thumbnail, /position: relative/)
  assert.match(thumbnail, /min-height: 0/)
  assert.match(painting, /position: absolute/)
  assert.match(painting, /height: 100%/)
})

test('low-cut footwear supplies painted foot skin from the selected bucket, not baked shoe skin', () => {
  const shoes = PAINTED_CAPSULE_GARMENTS.find(({ id }) => id === 'painted-ballet-flats-ink')
  for (const [skin, group] of [['#f2c9ae', 'light'], ['#b96f50', 'medium'], ['#432821', 'deep']]) {
    const markup = renderPaintedPaperDoll({}, { skin, garmentDetails: { shoes } }, { id: `flats-${group}` })
    assert.equal([...markup.matchAll(/data-body-part="painted-foot-opening"/g)].length, 2)
    assert.match(markup, new RegExp(`flats-${group}-shoe-opening-left`))
    assert.match(markup, new RegExp(`flats-${group}-shoe-opening-right`))
    assert.match(markup, new RegExp(`data-painted-skin-group="${group}"`))
    assert.doesNotMatch(markup, /feet-shared/)
    const { parts } = registeredGarmentAsset(shoes)
    for (const part of parts) assert.ok(markup.includes(`transform="${part.transform}"`), 'shoe and exposed foot must use identical registration')
  }
})

test('every painted colorway renders with independent identity on all three skin buckets', () => {
  const find = (id) => PAINTED_CAPSULE_GARMENTS.find((item) => item.id === id)
  const baseline = { top: find('painted-button-shirt-ivory'), outerwear: find('painted-tailored-waistcoat-ink'), bottom: find('painted-a-line-skirt-sage'), apron: find('painted-bib-apron-rose'), shoes: find('painted-ballet-flats-ink') }
  for (const garment of PAINTED_CAPSULE_GARMENTS) for (const skin of ['#f2c9ae', '#b96f50', '#432821']) {
    const details = { ...baseline }
    const accessories = garment.slot === 'accessory' ? [garment] : []
    if (!accessories.length) details[garment.slot] = garment
    const markup = renderPaintedPaperDoll({ hairColor: 'copper', eyeColor: 'blue' }, { skin, garmentDetails: details, accessories })
    assert.ok(markup.includes(`data-paper-garment="${garment.id}"`))
    assert.ok(markup.includes(registeredGarmentAsset(garment).src))
    assert.doesNotMatch(markup, /(?:undefined|NaN)/)
    const ids = [...markup.matchAll(/ id="([^"]+)"/g)].map((match) => match[1])
    assert.equal(ids.length, new Set(ids).size, garment.id)
  }
  for (const filename of ['catalogue-qa.js', 'wardrobe-fit-demo.js']) {
    const source = readFileSync(new URL(`../character-v3/${filename}`, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /localStorage|createCharacterStore|equipGarment\(/, 'fitting previews must never change the saved player')
    assert.match(source, /preloadPaintedPreview/)
    assert.match(source, /revision !== renderRevision/)
  }
})

test('cardigan and waist apron retain independent order and matching painted previews', () => {
  const top = PAINTED_CAPSULE_GARMENTS.find(({ id }) => id === 'painted-crew-tee-rose')
  const outerwear = PAINTED_CAPSULE_GARMENTS.find(({ id }) => id === 'painted-cable-cardigan-ink')
  const apron = PAINTED_CAPSULE_GARMENTS.find(({ id }) => id === 'painted-linen-waist-apron-sage')
  const appearance = { skin: '#432821', garmentDetails: { top, outerwear, apron } }
  const markup = renderPaintedPaperDoll({ skinTone: 'espresso' }, appearance, { id: 'layered-test' })
  const thumbnail = renderPaintedGarmentThumbnail(outerwear)
  assert.ok(markup.indexOf('data-paper-slot="top"') < markup.indexOf('data-paper-slot="outer"'))
  assert.ok(markup.indexOf('data-paper-slot="outer"') < markup.indexOf('data-paper-slot="apron"'))
  assert.match(markup, /top-crew-ivory-v1\.png/)
  assert.match(markup, /data-paper-family="waist-apron"/)
  assert.match(markup, /layered-test-outer-fabric/)
  assert.match(thumbnail, /outer-cable-honey-v1\.png/)
  assert.match(thumbnail, /data-painted-garment-page="registered"/)
  const patterned = { ...outerwear, pattern: 'check' }
  assert.match(renderPaintedGarmentThumbnail(patterned), /mask-type="alpha"/)
  assert.match(renderPaintedPaperDoll({}, { garmentDetails: { top, outerwear: patterned } }, { id: 'pattern-test' }), /pattern-test-outer-fabric-pattern/)
})

test('dark fabric tint reduces luminance without modifying transparency', () => {
  const dark = garmentTintMatrix('#384354', .69).split(' ').map(Number)
  const light = garmentTintMatrix('#e9dfc9', .69).split(' ').map(Number)
  assert.equal(dark.length, 20)
  assert.ok(dark[0] + dark[1] + dark[2] < light[0] + light[1] + light[2])
  assert.deepEqual(dark.slice(15), [0, 0, 0, 1, 0])
})

test('closed shoes use a matching painted ankle bridge, never an exposed bare-foot plate', () => {
  const shoes = FASHION_CATALOG_GARMENTS.find(({ id }) => id === 'canvas-sneakers')
  for (const [skin, group] of [['#f2c9ae', 'light'], ['#b96f50', 'medium'], ['#432821', 'deep']]) {
    const markup = renderPaintedPaperDoll({}, { skin, garmentDetails: { shoes } }, { id: `shoe-fit-${group}` })
    assert.match(markup, /data-body-part="painted-ankle-bridge"/)
    assert.match(markup, /ankle-blend-gradient/)
    assert.match(markup, /M360 1240H418C416 1250 415 1260 415 1268/)
    assert.match(markup, /M588 1240H648C646 1250 644 1260 644 1268/)
    assert.match(markup, new RegExp(`data-painted-skin-group="${group}"`))
    assert.match(markup, /data-footwear-part="left"/)
    assert.match(markup, /data-footwear-part="right"/)
    assert.doesNotMatch(markup, /feet-shared|data-paper-slot="feet"/)
    assert.match(markup, /shoes-fabric-neutral/)
    assert.match(markup, /shoes-fabric-light-mask/)
  }
})

test('long sleeve coverage masks stray arms while tees and barefoot poses keep their skin', () => {
  const cardigan = PAINTED_CAPSULE_GARMENTS.find(({ id }) => id === 'painted-cable-cardigan-sage')
  const blazer = PAINTED_CAPSULE_GARMENTS.find(({ id }) => id === 'painted-soft-blazer-ink')
  const tee = PAINTED_CAPSULE_GARMENTS.find(({ id }) => id === 'painted-crew-tee-ivory')
  for (const outerwear of [cardigan, blazer]) {
    const markup = renderPaintedPaperDoll({}, { garmentDetails: { top: tee, outerwear } })
    assert.match(markup, /data-covered-arms="true"/)
    assert.match(markup, /feet-shared-warm-medium-v2/)
    assert.match(markup, /top-crew-ivory-v1/)
  }
  assert.doesNotMatch(renderPaintedPaperDoll({}, { garmentDetails: { top: tee } }), /data-covered-arms="true"/)
  const css = readFileSync(new URL('../character-v3/painted-paper-doll.css', import.meta.url), 'utf8')
  const shoeZ = Number(css.match(/garment--shoes\s*\{ z-index: (\d+)/)?.[1])
  const bottomZ = Number(css.match(/garment--bottom\s*\{ z-index: (\d+)/)?.[1])
  assert.ok(shoeZ < bottomZ, 'long hems should cover shoe collars')
})

test('representative mixed outfits keep all SVG identifiers instance-local', () => {
  const find = (id) => FASHION_CATALOG_GARMENTS.find((garment) => garment.id === id)
  const combinations = [
    ['painted-soft-blazer-ink', 'painted-pencil-skirt-rose', 'painted-penny-loafers-ink', 'painted-linen-waist-apron-sage'],
    ['painted-cable-cardigan-sage', 'painted-wide-trousers-ivory', 'canvas-sneakers', 'tomato-apron'],
  ]
  const markups = combinations.map(([outerwear, bottom, shoes, apron], index) => renderPaintedPaperDoll({}, { garmentDetails: { top: find('painted-crew-tee-rose'), outerwear: find(outerwear), bottom: find(bottom), shoes: find(shoes), apron: find(apron) } }, { id: `fit-combination-${index}` }))
  const ids = [...markups.join('').matchAll(/ id="([^"]+)"/g)].map((match) => match[1])
  assert.equal(ids.length, new Set(ids).size)
  assert.match(markups[0], /outer-soft-blazer-v1/)
  assert.match(markups[0], /bottom-pencil-twill-v1/)
  assert.match(markups[0], /shoes-penny-loafers-v1/)
  assert.match(markups[1], /bottom-wide-linen-v1/)
})
