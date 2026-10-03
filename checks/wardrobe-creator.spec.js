import test from 'node:test'
import assert from 'node:assert/strict'
import { createCharacterStore, garmentCatalog } from '../character-model.js'
import { createCharacterCreator } from '../character-creator.js'
import { selectWardrobeGarments } from '../wardrobe-browser.js'

test('wardrobe controller searches, pages and previews without publishing a character save', () => {
  const originalDocument = globalThis.document
  const originalCustomEvent = globalThis.CustomEvent
  globalThis.document = { dispatchEvent() {} }
  globalThis.CustomEvent ||= class { constructor(type, options) { Object.assign(this, { type }, options) } }
  let writes = 0
  const storage = { getItem: () => null, setItem: () => { writes++ } }
  const store = createCharacterStore({ storage })
  const listeners = new Map()
  const results = { innerHTML: '' }
  const nameInput = { value: 'Unsaved name' }
  let markup = '', fullRenders = 0
  const container = {
    set innerHTML(value) { markup = value; fullRenders++ },
    get innerHTML() { return markup },
    querySelector(selector) {
      return selector === '[data-wardrobe-results]' ? results
        : selector === '[data-character-name]' ? nameInput : { focus() {} }
    },
    addEventListener(type, handler) { listeners.set(type, handler) },
    removeEventListener(type) { listeners.delete(type) },
  }
  const event = (selector, dataset = {}, value = '') => ({ target: {
    dataset, value, closest: (query) => query === selector ? { dataset } : null,
    matches: (query) => query === selector,
  } })
  let creator
  try {
    creator = createCharacterCreator({ container, store, getAtelierLevel:()=>12 })
    creator.open({ panel: 'clothes' })
    assert.match(markup, /Your clothing chest/)
    assert.match(markup, /data-garment-slot="all" aria-pressed="true"/)
    assert.match(markup, /is-full-look/)
    const saved = JSON.stringify(store.snapshot())
    const baselineWrites = writes
    const catalogueCount = garmentCatalog(store.snapshot()).length
    creator.handleChange(event('[data-wardrobe-filter]', { wardrobeFilter: 'scope' }, 'catalogue'))
    assert.match(results.innerHTML, new RegExp(`1–24 of ${catalogueCount} pieces`))
    assert.doesNotMatch(results.innerHTML, /data-equip-garment=/, 'catalogue browsing is preview-only even for owned pieces')
    creator.handleClick(event('[data-wardrobe-page]', { wardrobePage: '1' }))
    assert.match(results.innerHTML, new RegExp(`25–48 of ${catalogueCount} pieces`))
    const renderCount = fullRenders
    listeners.get('input')(event('[data-wardrobe-search]', {}, 'PIQUE rose'))
    assert.match(results.innerHTML, /painted-pique-polo-rose/)
    assert.doesNotMatch(results.innerHTML, /25–48/)
    assert.equal(fullRenders, renderCount, 'search must preserve the input/caret and unsaved name DOM')
    assert.equal(nameInput.value, 'Unsaved name')
    listeners.get('input')(event('[data-wardrobe-search]', {}, 'missing-piece-zzzz'))
    assert.match(results.innerHTML, /No matching pieces/)
    creator.handleClick(event('[data-wardrobe-clear]'))
    assert.match(markup, new RegExp(`1–24 of ${catalogueCount} pieces`))
    const unowned = garmentCatalog(store.snapshot()).find(g => !store.snapshot().wardrobe.includes(g.id))
    creator.handleClick(event('[data-preview-garment]', { previewGarment: unowned.id }))
    assert.match(markup, /Preview only · Your worn outfit is unchanged/)
    const top = garmentCatalog(store.snapshot()).find(g => g.cut === 'halter')
    const bottom = garmentCatalog(store.snapshot()).find(g => g.cut === 'paperbag-trouser')
    creator.handleClick(event('[data-preview-garment]', { previewGarment: top.id }))
    creator.handleClick(event('[data-preview-garment]', { previewGarment: bottom.id }))
    assert.match(markup, new RegExp(`data-wardrobe-untry="${top.id}"`))
    assert.match(markup, new RegExp(`data-wardrobe-untry="${bottom.id}"`))
    creator.handleClick(event('[data-unequip-slot]', { unequipSlot: 'apron' }))
    assert.match(markup, /Without apron/)
    creator.handleClick(event('[data-wardrobe-untry]', { wardrobeUntry: top.id }))
    assert.doesNotMatch(markup, new RegExp(`data-wardrobe-untry="${top.id}"`))
    assert.match(markup, new RegExp(`data-wardrobe-untry="${bottom.id}"`))
    assert.equal(JSON.stringify(store.snapshot()), saved)
    assert.equal(writes, baselineWrites)
    creator.handleClick(event('[data-wardrobe-restore]'))
    assert.doesNotMatch(markup, /wardrobe-try-on/)
    creator.close()
    const closedMarkup = markup
    listeners.get('input')(event('[data-wardrobe-search]', {}, 'dress'))
    assert.equal(markup, closedMarkup)
  } finally {
    creator?.destroy()
    globalThis.document = originalDocument
    globalThis.CustomEvent = originalCustomEvent
  }
  assert.equal(listeners.size, 0)
})

test('in-game creator follows live atelier unlocks and completion opens the collected piece despite old filters',()=>{
  const originalDocument=globalThis.document,originalEvent=globalThis.CustomEvent
  globalThis.document={dispatchEvent(){}}
  globalThis.CustomEvent ||= class {constructor(type,options){Object.assign(this,{type},options)}}
  let level=1,markup='',writes=0
  const results={innerHTML:''},listeners=new Map()
  const store=createCharacterStore({storage:{getItem:()=>null,setItem:()=>writes++}})
  const container={set innerHTML(value){markup=value},querySelector:selector=>selector==='[data-wardrobe-results]'?results:{focus(){}},addEventListener:(name,handler)=>listeners.set(name,handler),removeEventListener:name=>listeners.delete(name)}
  const event=(selector,dataset={},value='')=>({target:{dataset,value,matches:query=>query===selector,closest:query=>query===selector?{dataset}:null}})
  let creator
  try {
    creator=createCharacterCreator({container,store,getAtelierLevel:()=>level})
    creator.open({panel:'clothes'})
    const baseline=writes
    creator.handleChange(event('[data-wardrobe-filter]',{wardrobeFilter:'scope'},'catalogue'))
    const count=selectWardrobeGarments(store.snapshot(),{scope:'catalogue',atelierLevel:1}).length
    assert.match(results.innerHTML,new RegExp(`of ${count} pieces`))
    const locked=garmentCatalog(store.snapshot()).find(g=>g.unlockLevel>1&&!store.snapshot().wardrobe.includes(g.id))
    listeners.get('input')(event('[data-wardrobe-search]',{},locked.name))
    assert.match(results.innerHTML,/No matching pieces/)
    creator.handleClick(event('[data-preview-garment]',{previewGarment:locked.id}))
    assert.doesNotMatch(markup,/Fitting-room outfit/)
    level=12;creator.refresh()
    assert.match(markup,new RegExp(`data-preview-garment="${locked.id}"`))
    creator.open({panel:'clothes',garmentId:'cream-work-tee'})
    assert.match(markup,/data-equip-garment="cream-work-tee"/)
    assert.doesNotMatch(markup,new RegExp(`data-preview-garment="${locked.id}"`))
    assert.equal(writes,baseline)
  } finally {creator?.destroy();globalThis.document=originalDocument;globalThis.CustomEvent=originalEvent}
})
