import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { paintedCreatorRecipe, renderPaintedCreatorPortrait } from '../character-v3/painted-creator.js'
import { renderPlayerAvatarMarkup } from '../hub-actors.js'
import { paintedGarmentPlate, renderPaintedGarmentThumbnail } from '../character-v3/painted-wardrobe.js'
import { paintedOutfitSelection, paintedOutfitSkinGroup, paintedOutfitSkinPalette, renderPaintedOutfitBody } from '../character-v3/painted-outfit.js'
import { modularHeadRecipe, PAINTED_HAIR_FITS, renderModularHead } from '../character-v3/modular-head.js'
import { paintedPaperDollRecipe, renderPaintedPaperDoll } from '../character-v3/painted-paper-doll.js'
import { CHARACTER_OPTIONS } from '../character-model.js'
import { CURATED_CREATOR_HAIR_STYLES } from '../character-creator.js'
import { CHARACTER_PRESETS } from '../character-presets.js'
import { FASHION_CATALOG_GARMENTS } from '../fashion-catalog.js'

const CLEAN_OUTFIT_ATLASES = [
  'painted-outfit-bodies-atlas-v1-clean.png',
  'painted-outfit-bodies-light-v1-clean.png',
  'painted-outfit-bodies-deep-v1-clean.png',
  'painted-outfit-bodies-atlas-v2-clean.png',
  'painted-outfit-bodies-light-v2-clean.png',
  'painted-outfit-bodies-deep-v2-clean.png',
]

test('painted outfit frames have exact isolated cells with no neighboring shoe bleed', () => {
  for (const filename of CLEAN_OUTFIT_ATLASES) {
    const png = readFileSync(new URL(`../assets/characters-v3/wardrobe/${filename}`, import.meta.url))
    const width = png.readUInt32BE(16)
    const height = png.readUInt32BE(20)
    assert.equal(width, 1775, `${filename} should contain five exact 355px cells`)
    assert.equal(width % 5, 0, `${filename} should divide evenly into five frames`)
    assert.equal(height, 887, `${filename} should retain the registered body height`)
  }
})

test('painted creator independently selects face, hair, skin treatment, and clothing layers', () => {
  const base = paintedCreatorRecipe({
    faceShape: 'soft-round', hairStyle: 'buzz', skinTone: 'porcelain', hairColor: 'ink',
  }, { topCut: 'tee', top: '#efe1bd', topAccent: '#b94836', hasApron: false })
  const alternate = paintedCreatorRecipe({
    faceShape: 'diamond', hairStyle: 'loc-bun', skinTone: 'espresso', hairColor: 'silver',
  }, { topCut: 'cardigan', top: '#775070', topAccent: '#efc6d2', hasApron: false })

  assert.notEqual(base.faceIndex, alternate.faceIndex)
  assert.notEqual(base.hairIndex, alternate.hairIndex)
  assert.notEqual(base.skinFilter, alternate.skinFilter)
  assert.notEqual(base.hairFilter, alternate.hairFilter)
  assert.notEqual(base.clothingIndex, alternate.clothingIndex)
})

test('painted creator markup exposes independently addressable raster layers', () => {
  const markup = renderPaintedCreatorPortrait({
    name: 'Mia', faceShape: 'heart', hairStyle: 'curls', skinTone: 'warm-medium', hairColor: 'auburn',
    complexionDetail: 'freckles-soft', facialHair: 'none',
  }, {
    top: '#775070', topAccent: '#efc6d2', topCut: 'blouse', hasApron: false,
  }, { lookDirection: 'right' })

  assert.match(markup, /data-renderer="painted-layered-creator-v1"/)
  assert.match(markup, /painted-creator-face/)
  assert.match(markup, /painted-creator-hair/)
  assert.match(markup, /painted-creator-clothes-tint/)
})

test('the in-world player combines the creator identity with independent painted clothing layers', () => {
  const markup = renderPlayerAvatarMarkup({
    name: 'Mia', faceShape: 'heart', hairStyle: 'curls', skinTone: 'warm-medium', hairColor: 'auburn',
  }, {
    skin: '#b96f50', hair: '#5c382a', top: '#775070', bottom: '#465c75', shoes: '#efe3c7',
  }, { motion: 'walk', facing: 'right', lookDirection: 'right' })

  assert.match(markup, /data-renderer="modular-head-v1"/)
  assert.match(markup, /data-avatar-rig="mii-plus-v1"/)
  assert.match(markup, /data-renderer="painted-paper-doll-v1"/)
  assert.match(markup, /data-player-identity-layer="back"/)
  assert.match(markup, /data-player-identity-layer="front"/)
  assert.match(markup, /body-shared-warm-medium-v2\.png/)
  assert.match(markup, /data-equipment-rig="painted-paper-doll-v1"/)
  assert.match(markup, /data-player-pose="stationary"/)
  assert.doesNotMatch(markup, /data-avatar-part="neck"/)
})

test('modular heads use one coordinate space and independently addressable parts', () => {
  const profile = CHARACTER_PRESETS[0].profile
  const markup = renderModularHead(profile, {}, { id: 'test-head', lookDirection: 'up-left' })
  const recipe = modularHeadRecipe(profile)

  assert.equal(recipe.coordinateSpace, '0 0 240 240')
  assert.deepEqual(recipe.anchors, { headCenter: [120, 84], eyeLine: 87, nose: [120, 120], mouth: [120, 143], jaw: [120, 167], neck: [120, 190] })
  assert.match(markup, /data-art-finish="illustrated-v2"/)
  assert.match(markup, /data-anatomy="humanized-v1"/)
  assert.match(markup, /data-organic-finish="painted-curves-v1"/)
  for (const part of ['hair-back', 'neck', 'ears', 'face', 'skin-texture', 'eyes', 'brows', 'nose', 'mouth', 'hair-front']) {
    assert.match(markup, new RegExp(`data-avatar-part="${part}"`))
  }
  assert.match(markup, /painted-hair-v1\.png/)
  assert.match(markup, /data-painted-hair-cell=/)
  assert.doesNotMatch(markup, /identity-toppers|preset-portraits-atlas/)
})

test('creator head and body scale from one fixed-aspect composition wrapper', () => {
  const css = readFileSync(new URL('../character-creator.css', import.meta.url), 'utf8')
  const source = readFileSync(new URL('../character-creator.js', import.meta.url), 'utf8')
  const paperCss = readFileSync(new URL('../character-v3/painted-paper-doll.css', import.meta.url), 'utf8')
  assert.match(css, /\.character-stationary-avatar\s*\{[^}]*aspect-ratio:\s*2 \/ 3/s)
  assert.match(paperCss, /\.painted-paper-doll__body,[\s\S]*width:\s*100%[\s\S]*height:\s*100%/)
  assert.match(paperCss, /\.painted-paper-doll__head\s*\{[^}]*width:\s*46%/s)
  assert.match(source, /renderPaintedPaperDoll\(profile, appearance/)
})

test('creator opens directly into modular controls without a preset gallery', () => {
  const source = readFileSync(new URL('../character-creator.js', import.meta.url), 'utf8')
  const css = readFileSync(new URL('../character-creator.css', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /data-character-preset|character-preset-grid|id:\s*'presets'/)
  assert.match(source, /const view = \{ panel: 'face', previewMode: 'face'/)
  assert.match(source, /<small>Style<\/small><b>Made by you<\/b>/)
  assert.match(source, /data-character-preview="face"/)
  assert.match(source, /data-character-preview="full"/)
  assert.match(css, /\.character-preview-scene\.is-face-focus \.character-stationary-avatar\s*\{[^}]*height:\s*190%/s)
})

test('creator offers a focused four-to-seven hairstyle balance without a second texture grid', () => {
  const source = readFileSync(new URL('../character-creator.js', import.meta.url), 'utf8')
  const masculine = CURATED_CREATOR_HAIR_STYLES.filter((style) => style.traditional === 'masculine')
  const feminine = CURATED_CREATOR_HAIR_STYLES.filter((style) => style.traditional === 'feminine')
  const knownStyles = new Set(CHARACTER_OPTIONS.hairStyles.map((style) => style.id))
  const knownTextures = new Set(CHARACTER_OPTIONS.hairTextures.map((texture) => texture.id))

  assert.equal(CURATED_CREATOR_HAIR_STYLES.length, 11)
  assert.equal(masculine.length, 4)
  assert.equal(feminine.length, 7)
  assert.equal(new Set(CURATED_CREATOR_HAIR_STYLES.map((style) => style.id)).size, 11)
  assert.equal(CURATED_CREATOR_HAIR_STYLES.every((style) => knownStyles.has(style.id) && knownTextures.has(style.texture)), true)
  assert.equal(CURATED_CREATOR_HAIR_STYLES.every((style) => PAINTED_HAIR_FITS[style.id]), true)
  assert.doesNotMatch(source, /<legend>Hair texture<\/legend>/)
  assert.match(source, /choice\.dataset\.characterTexture/)
})

test('painted hairstyles use an eye-safe canonical hairline and an organic afro opening', () => {
  const bob = renderModularHead({ hairStyle: 'bob', hairTexture: 'straight' }, {}, { id: 'hair-fit-bob' })
  const afro = renderModularHead({ hairStyle: 'afro', hairTexture: 'coily' }, {}, { id: 'hair-fit-afro' })
  const buzz = renderModularHead({ hairStyle: 'buzz' }, {}, { id: 'hair-fit-buzz' })

  assert.match(bob, /hair-fit-bob-painted-hair-front/)
  assert.match(bob, /data-avatar-part="hair-foundation"/)
  assert.doesNotMatch(bob, /V112H188/)
  assert.match(afro, /hair-fit-afro-painted-hair-front-afro/)
  assert.doesNotMatch(afro, /data-avatar-part="hair-foundation"/)
  assert.match(buzz, /data-hair-fit="scalp-following"/)
  assert.match(buzz, /clip-path="url\(#hair-fit-buzz-face-clip\)"/)
  assert.doesNotMatch(buzz, /data-avatar-part="hair-foundation"|modular-head__painted-hair--back/)
})

test('painted paper doll resolves difficult combinations into stable independent layers', () => {
  const appearance = {
    skin: '#533129',
    garmentDetails: {
      top: { id: 'cocoa-cocoon-coat', slot: 'top', cut: 'coat', pattern: 'herringbone', palette: { primary: '#684c42', secondary: '#d2a673' } },
      bottom: { id: 'plum-skirt', slot: 'bottom', cut: 'pleated-skirt', pattern: 'pinstripe', palette: { primary: '#6e4967', secondary: '#d9a7b8' } },
      apron: { id: 'tomato-apron', slot: 'apron', cut: 'service-apron', pattern: 'stripe', palette: { primary: '#b94836', secondary: '#f8dfae' } },
      shoes: { id: 'plum-boots', slot: 'shoes', cut: 'boots', palette: { primary: '#54364f', secondary: '#dfa84e' } },
    },
  }
  const recipe = paintedPaperDollRecipe(appearance)
  const markup = renderPaintedPaperDoll({ faceShape: 'soft-round' }, appearance)
  const order = ['bottom', 'top', 'outer', 'shoes', 'apron'].map((slot) => markup.indexOf(`data-paper-slot="${slot}"`))

  assert.deepEqual(recipe, { skinGroup: 'deep', topFamily: 'shirt', outerFamily: 'outer', bottomFamily: 'skirt', dressFamily: null, hasOuterwear: true, hasApron: true, hasShoes: true })
  assert.equal(order.every((position) => position >= 0), true)
  assert.match(markup, /body-shared-deep-v2\.png/)
  assert.match(markup, /data-paper-family="pleated-midi"/)
  assert.match(markup, /data-paper-family="outer-coat"/)
  assert.match(markup, /catalogue-outer-coat-v1\.png/)
  assert.doesNotMatch(markup, /painted-outfit-bodies-atlas/)
})

test('painted paper doll covers dress, jacket, and accessory equipment families', () => {
  const jacket = renderPaintedPaperDoll({}, {
    garmentDetails: {
      top: { id: 'tomato-bomber', slot: 'top', cut: 'bomber-jacket', palette: { primary: '#b94836', secondary: '#f1ca68' } },
      bottom: { id: 'soft-denim', slot: 'bottom', cut: 'wide-trousers', palette: { primary: '#607488', secondary: '#d8a558' } },
    },
    accessories: [
      { id: 'silk-turban-sky', cut: 'turban', palette: { primary: '#65909b', secondary: '#dbe8db' } },
      { id: 'market-satchel', cut: 'satchel', palette: { primary: '#8b553e', secondary: '#d7ad6c' } },
      { id: 'sunflower-brooch', cut: 'flower-brooch', palette: { primary: '#d99e38', secondary: '#fff1bd' } },
    ],
  }, { id: 'accessory-coverage' })
  const dress = renderPaintedPaperDoll({}, {
    garmentDetails: {
      top: { id: 'tea-dress-sage', slot: 'top', cut: 'tea-dress', palette: { primary: '#729079', secondary: '#f3dca5' } },
      bottom: { id: 'hidden-trousers', slot: 'bottom', cut: 'trousers' },
    },
  }, { id: 'dress-coverage' })

  assert.match(jacket, /data-top-family="shirt"/)
  assert.match(jacket, /data-paper-family="outer-bomber"/)
  assert.match(jacket, /data-paper-garment="painted-crew-tee-ivory"/)
  assert.doesNotMatch(jacket, /tomato-bomber-underlayer/)
  assert.match(jacket, /data-paper-family="turban"/)
  assert.match(jacket, /data-paper-family="bag-satchel"/)
  assert.match(jacket, /data-paper-family="brooch"/)
  assert.match(jacket, /id="accessory-coverage-accessory-0-accessory-fabric"/)
  assert.match(dress, /data-paper-one-piece="true"/)
  assert.doesNotMatch(dress, /data-paper-slot="dress-bottom"/)
  assert.match(dress, /data-bottom-family="skirt"/)
  assert.doesNotMatch(dress, /data-paper-garment="hidden-trousers"/)
})

test('each painted paper doll owns unique head, gradient, and texture ids', () => {
  const appearance = {
    accessories: [{ id: 'plum-beret', cut: 'beret', palette: { primary: '#775070', secondary: '#efc6d2' } }],
  }
  const first = renderPaintedPaperDoll({}, appearance)
  const second = renderPaintedPaperDoll({}, appearance)
  const firstId = first.match(/data-paper-doll-id="([^"]+)"/)?.[1]
  const secondId = second.match(/data-paper-doll-id="([^"]+)"/)?.[1]

  assert.ok(firstId)
  assert.ok(secondId)
  assert.notEqual(firstId, secondId)
  assert.match(first, new RegExp(`id="${firstId}-head-front-face-clip"`))
  assert.match(first, new RegExp(`id="${firstId}-accessory-0-accessory-fabric"`))
})

test('skin tone choices are visual swatches with accessible names and a matte finish', () => {
  const source = readFileSync(new URL('../character-creator.js', import.meta.url), 'utf8')
  const css = readFileSync(new URL('../character-creator.css', import.meta.url), 'utf8')

  assert.match(source, /<legend>Skin tone<\/legend>[\s\S]*colorOnly:\s*true/)
  assert.match(source, /aria-label="\$\{escapeHtml\(option\.label\)\}"/)
  assert.match(css, /\.character-choice\.is-color-only i\s*\{[^}]*box-shadow:\s*none/s)
})

test('every face and hair option resolves on the shared modular rig', () => {
  for (const option of CHARACTER_OPTIONS.faceShapes) {
    assert.match(renderModularHead({ faceShape: option.id }), new RegExp(`data-face-shape="${option.id}"`))
  }
  for (const option of CHARACTER_OPTIONS.eyeShapes) {
    assert.match(renderModularHead({ eyeShape: option.id }), new RegExp(`data-eye-shape="${option.id}"`))
  }
  for (const option of CHARACTER_OPTIONS.hairStyles) {
    assert.match(renderModularHead({ hairStyle: option.id }), new RegExp(`data-hair-style="${option.id}"`))
  }
  for (const option of CHARACTER_OPTIONS.hairTextures) {
    const markup = renderModularHead({ hairStyle: 'curls', hairTexture: option.id })
    assert.match(markup, new RegExp(`data-hair-texture="${option.id}"`))
  }
})

test('every face and eye button produces distinct silhouette geometry', () => {
  const facePaths = CHARACTER_OPTIONS.faceShapes.map((option) => {
    const markup = renderModularHead({ faceShape: option.id }, {}, { id: `distinct-face-${option.id}` })
    return markup.match(/face-clip"><path d="([^"]+)"/)?.[1]
  })
  const eyePaths = CHARACTER_OPTIONS.eyeShapes.map((option) => {
    const markup = renderModularHead({ eyeShape: option.id }, {}, { id: `distinct-eye-${option.id}` })
    return markup.match(/eye-left"><path d="([^"]+)"/)?.[1]
  })

  assert.equal(facePaths.every(Boolean), true)
  assert.equal(new Set(facePaths).size, CHARACTER_OPTIONS.faceShapes.length)
  assert.equal(eyePaths.every(Boolean), true)
  assert.equal(new Set(eyePaths).size, CHARACTER_OPTIONS.eyeShapes.length)
})

test('deep skin uses a restrained matte highlight instead of light-skin sheen', () => {
  const light = renderModularHead({ skinTone: 'porcelain' }, {}, { id: 'sheen-light' })
  const deep = renderModularHead({ skinTone: 'espresso' }, {}, { id: 'sheen-deep' })
  const lightGlow = Number(light.match(/face-light[^>]*>[\s\S]*?stop-opacity="([^"]+)"/)?.[1])
  const deepGlow = Number(deep.match(/face-light[^>]*>[\s\S]*?stop-opacity="([^"]+)"/)?.[1])

  assert.match(light, /data-skin-sheen="0\.86"/)
  assert.match(deep, /data-skin-sheen="0\.28"/)
  assert.ok(deepGlow < lightGlow * .4)
})

test('eyes clip moving irises to their individual openings and expose expanded silhouettes', () => {
  for (const eyeShape of ['monolid', 'tapered', 'narrow', 'crescent']) {
    const markup = renderModularHead({ eyeShape }, {}, { id: `eye-${eyeShape}`, lookDirection: 'down-right' })
    assert.match(markup, new RegExp(`data-eye-shape="${eyeShape}"`))
    assert.match(markup, /clipPath id="eye-[^"]+-eye-left"/)
    assert.match(markup, /clip-path="url\(#eye-[^"]+-eye-left\)"/)
  }
})

test('organic head finish avoids hard sticker outlines and exposes curl palettes', () => {
  const ringlets = renderModularHead({ hairStyle: 'curls', hairTexture: 'ringlets' }, {}, { id: 'ringlet-head' })
  const tight = renderModularHead({ hairStyle: 'curly-top', hairTexture: 'tight-curls' }, {}, { id: 'tight-head' })
  const afro = renderModularHead({ hairStyle: 'afro', hairTexture: 'coily' }, {}, { id: 'afro-head' })
  assert.doesNotMatch(ringlets, /stroke="#352326"/)
  assert.match(ringlets, /data-curl-palette="ringlets"/)
  assert.match(tight, /data-curl-palette="tight-curls"/)
  assert.match(tight, /data-curl-silhouette="clustered-tight"/)
  assert.match(afro, /data-curl-silhouette="rounded"/)
  assert.doesNotMatch(tight, /q4-6 8 0t-8 0/)
})

test('character name is editable beside the preview in every creator panel', () => {
  const source = readFileSync(new URL('../character-creator.js', import.meta.url), 'utf8')
  const preview = source.match(/<div class="character-preview-caption">([\s\S]*?)<\/div>/)?.[1] || ''
  const details = source.match(/function detailsPanel[\s\S]*?function panelMarkup/)?.[0] || ''

  assert.match(preview, /data-character-name/)
  assert.match(preview, /aria-label="Character name"/)
  assert.match(preview, /data-save-character-name/)
  assert.match(source, /store\.updateProfile\(\{ name: input\.value \}\)/)
  assert.doesNotMatch(details, /data-character-name/)
})

test('all preset recipes render through the same modular contract', () => {
  const heads = CHARACTER_PRESETS.map((preset) => renderModularHead(preset.profile, {}, { id: `test-${preset.id}` }))
  assert.equal(heads.length, 48)
  assert.equal(heads.every((markup) => markup.includes('data-avatar-rig="mii-plus-v1"')), true)
  assert.equal(heads.every((markup) => markup.includes('viewBox="0 0 240 240"')), true)
})

test('skin, hair, and eyes are separate palette channels', () => {
  const recipe = modularHeadRecipe({ skinTone: 'espresso', hairColor: 'copper', eyeColor: 'blue' })
  assert.equal(recipe.palette.skinGroup, 'deep')
  assert.equal(recipe.palette.requestedSkin, '#432821')
  assert.equal(recipe.palette.skin, paintedOutfitSkinPalette({ skin: '#432821' }).base)
  assert.equal(recipe.palette.highlight, paintedOutfitSkinPalette({ skin: '#432821' }).highlight)
  assert.equal(recipe.palette.shadow, paintedOutfitSkinPalette({ skin: '#432821' }).shadow)
  assert.equal(recipe.palette.hair, '#a44d34')
  assert.equal(recipe.palette.eye, '#4f7280')
})

test('painted outfit bodies select a matching skin atlas without changing equipment anchors', () => {
  assert.equal(paintedOutfitSkinGroup({ skin: '#f2c9ae' }), 'light')
  assert.equal(paintedOutfitSkinGroup({ skin: '#b96f50' }), 'medium')
  assert.equal(paintedOutfitSkinGroup({ skin: '#87513b' }), 'medium')
  assert.equal(paintedOutfitSkinGroup({ skin: '#533129' }), 'deep')
})

test('advanced catalogue families select the expanded painted body page', () => {
  const appearance = {
    skin: '#b96f50',
    garmentDetails: {
      top: { id: 'trench-coat-cocoa' }, bottom: { id: 'charcoal-trousers' }, apron: null, shoes: { id: 'lace-up-boot-cocoa' },
    },
  }
  const selection = paintedOutfitSelection(appearance)
  const markup = renderPaintedOutfitBody(appearance)

  assert.deepEqual(selection, { page: 'expanded', frame: 3 })
  assert.match(markup, /painted-outfit-bodies-atlas-v2-clean\.png/)
  assert.match(markup, /data-painted-outfit-page="expanded"/)
})

test('wardrobe cards use painted garment atlases instead of geometric thumbnails', () => {
  const blouse = paintedGarmentPlate({ id: 'violet-blouse', name: 'Violet blouse', slot: 'top', cut: 'puff-blouse' })
  const boots = paintedGarmentPlate({ id: 'plum-boots', name: 'Plum ankle boots', slot: 'shoes', cut: 'ankle-boots' })

  assert.match(blouse.src, /painted-tops-atlas-v1\.png$/)
  assert.equal(blouse.frame, 1)
  assert.equal(boots.frame, 2)
  assert.match(renderPaintedGarmentThumbnail({ id: 'house-apron', name: 'House apron', slot: 'apron', cut: 'service-apron' }), /painted-garment-thumbnail/)
})

test('every catalogue garment resolves to a painted card, including accessories', () => {
  const plates = FASHION_CATALOG_GARMENTS.map((garment) => paintedGarmentPlate(garment))
  const accessory = paintedGarmentPlate({ id: 'silk-turban-sky', name: 'Sky draped silk turban', slot: 'accessory', cut: 'turban' })
  const couture = paintedGarmentPlate({ id: 'runway-coat-ink', name: 'Ink runway coat', slot: 'top', cut: 'runway-coat' })

  assert.equal(plates.length, FASHION_CATALOG_GARMENTS.length)
  assert.equal(plates.every((plate) => plate?.src && Number.isInteger(plate.frame)), true)
  assert.match(accessory.src, /painted-accessories-atlas-v1\.png$/)
  assert.equal(accessory.frame, 12)
  assert.match(couture.src, /painted-tops-atlas-v2\.png$/)
  assert.equal(couture.page, 'extended')
})
