import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createCharacterStore } from '../character-model.js'
import { createCharacterCreator } from '../character-creator.js'
import { garmentSlotLabel, sceneLabel, readableCut } from '../ui-copy.js'
import { economyJournalMarkup } from '../economy-journal.js'
import { clockSnapshot, createGameClock } from '../game-clock.js'
import { createDayLedger, incomeForecast } from '../economy.js'
import { createProgressionState, progressionSnapshot } from '../progression.js'
import { FASHION_SCHEMATICS } from '../fashion-catalog.js'
import { kitchenContinuation } from '../minigame-actions.js'

test('menus use player-facing names instead of internal slot and scene IDs',()=>{
  assert.equal(garmentSlotLabel('accessory'),'Accessories')
  assert.equal(garmentSlotLabel('top'),'Tops & dresses')
  assert.equal(sceneLabel('tailor'),'Tailor shop')
  assert.equal(sceneLabel('restaurant'),'Pizzeria')
  assert.equal(readableCut('wrap-dress'),'wrap dress')
  for(const pattern of FASHION_SCHEMATICS) assert.equal(pattern.name[0],pattern.name[0].toUpperCase())
})

test('every character panel explains player choices without development notes',()=>{
  const originalDocument=globalThis.document, originalEvent=globalThis.CustomEvent
  globalThis.document={dispatchEvent(){}}
  globalThis.CustomEvent ||= class { constructor(type,options){Object.assign(this,{type},options)} }
  const store=createCharacterStore({storage:{getItem:()=>null,setItem(){}}})
  const container={innerHTML:'',querySelector:()=>({focus(){}}),addEventListener(){},removeEventListener(){}}
  const creator=createCharacterCreator({container,store})
  try {
    for(const panel of ['face','hair','clothes','details']) {
      creator.open({panel})
      const text=container.innerHTML.replace(/<[^>]*>/g,' ')
      assert.doesNotMatch(text,/\b(skull|coordinate|rig|serialize|provenance|animatable|NPCs)\b|layer stack|per-head offsets/i)
      assert.match(text,/Create your character/)
      assert.match(text,/Character name/)
      if(panel==='details') {
        assert.match(text,/Clothes collected/)
        assert.match(text,/Pronouns/)
        assert.match(text,/saved in this browser/)
      }
    }
  } finally {
    creator.destroy();globalThis.document=originalDocument;globalThis.CustomEvent=originalEvent
  }
})

test('the journal explains solo and shared clocks separately and preserves money warnings',()=>{
  const progression=progressionSnapshot(createProgressionState(),120)
  const journal={clock:clockSnapshot(createGameClock()),ledger:createDayLedger(),forecasts:incomeForecast(),
    progression,tier:'starter',collections:progression.milestones.map(m=>({...m,pieces:20,patterns:10}))}
  assert.match(economyJournalMarkup(journal),/stops while you are away/)
  const shared=economyJournalMarkup(journal,false,{active:{role:'guest'}})
  assert.match(shared,/Only the host can pause/)
  assert.match(shared,/everyone connected must be in bed/)
  assert.match(shared,/while anyone has the pizzeria open/)
  assert.match(shared,/not a cash reward/)
  assert.match(shared,/Spending never sets you back/)
})

test('live UI templates contain no retired prototype pitches or renderer explanations',()=>{
  const source=name=>readFileSync(new URL(`../${name}`,import.meta.url),'utf8')
  assert.doesNotMatch(source('game.js'),/Unimplemented shape changes|painted preview follows|compact check compares/)
  assert.doesNotMatch(source('hub.js'),/Hub connection ready|Its minigame can plug in/)
  assert.doesNotMatch(source('coop-controller.js'),/This prototype supports/)
  const html=source('index.html').replace(/<!--[\s\S]*?-->/g,'')
  assert.doesNotMatch(html,/Workshop Prototype|Four prototypes|Reset prototype|Prototype activities/)
})

test('empty service queues do not claim the player completed a job',()=>{
  const service={burning:false,doughs:0,sauces:{tomato:0,pesto:0},dirtyDishes:0,drinkTickets:0}
  const gate={blocked:true,action:'Toss dough',station:'doughToss'}
  for(const [active,title] of [['dishwashing','No dishes waiting'],['drinkPour','No soda orders waiting']]) {
    assert.equal(kitchenContinuation({active,current:{completed:true,stage:'empty'}},service,gate).title,title)
    assert.equal(kitchenContinuation({active,current:{completed:true,stage:'done'}},service,gate).title,'Service complete')
  }
})
