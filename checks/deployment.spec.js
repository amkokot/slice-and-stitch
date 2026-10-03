import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {assetUrl} from '../game-assets.js'
test('paintings resolve under a GitHub Pages project and nested preview pages',()=>{
  const base='https://amkokot.github.io/slice-and-stitch/'
  assert.equal(assetUrl('/assets/body.png',base),`${base}assets/body.png`)
  assert.equal(assetUrl('assets/body.png',base),`${base}assets/body.png`)
  const renderers=['registered-garments','painted-paper-doll','modular-head','painted-wardrobe','painted-outfit']
  for(const module of renderers) assert.match(readFileSync(new URL(`../character-v3/${module}.js`,import.meta.url),'utf8'),/assetUrl/)
})
test('the public entry includes online UI and starts with personal creation, not a test save',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8')
  assert.match(html,/src="coop-ui.js"/)
  assert.doesNotMatch(html,/localStorage\.setItem|playtest=fashion/)
  const hub=readFileSync(new URL('../hub.js',import.meta.url),'utf8')
  assert.match(hub,/onboarding = !playerAccount\(\).ready/)
  assert.match(hub,/savePlayerProfile\(characterStore.snapshot\(\).profile,\{ready:true\}\)/)
})
