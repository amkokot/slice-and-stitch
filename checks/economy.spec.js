import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {DAY_SECONDS,createGameClock,clockSnapshot,advanceGameClock} from '../game-clock.js'
import {ECONOMY_BALANCE,incomeForecast,pizzaEarnings,dishEarnings,sodaEarnings,fashionSupplyQuote,fashionProjectQuote,
  createDayLedger,recordDayActivity,rollDayLedger,garmentSetEffects,orderGarmentTipBonus,reputationAward,loyaltyTipBonus} from '../economy.js'
import {createProgressionState,recordPizzaResult,recordGarmentResult,recordServiceIncome,progressionSnapshot,COUNTER_UPGRADES} from '../progression.js'
import {tailorStockForDay,boutiqueCatalogForDay,FASHION_SCHEMATICS,FASHION_CATALOG_GARMENTS,activeFashionSets} from '../fashion-catalog.js'
import {fashionInventoryFor} from '../fashion-workflow.js'
import {compatibleFashionFabric,fashionGarmentDraft} from '../fashion-construction.js'
import {createCharacterState,garmentFromFashionResult,addCraftedGarment,equipGarment,wardrobeSetBonuses} from '../character-model.js'
import {economyJournalMarkup} from '../economy-journal.js'

test('automatic 24-minute day has exact morning/noon/dusk/night and dawn boundaries',()=>{
  for(const [seconds,phase,time,day] of [[0,'morning','06:00',1],[359.9,'morning','11:59',1],
    [360,'noon','12:00',1],[720,'dusk','18:00',1],[960,'night','22:00',1],
    [1080,'night','00:00',1],[1439,'night','05:59',1],[1440,'morning','06:00',2]]) {
    const snapshot=clockSnapshot(advanceGameClock(createGameClock(),seconds))
    assert.equal(snapshot.phase,phase);assert.equal(snapshot.time,time);assert.equal(snapshot.day,day)
  }
  assert.equal(DAY_SECONDS,1440)
  assert.equal(advanceGameClock(createGameClock(),1440*3+17).day,4)
})

test('clock migration, pause, fractional seconds and reload never invent offline days',()=>{
  const old=createGameClock(null,{day:8,phase:'dusk'})
  assert.equal(clockSnapshot(old).time,'18:00');assert.equal(old.day,8)
  const paused={...old,paused:true}
  assert.deepEqual(advanceGameClock(paused,10000),paused)
  const partial=advanceGameClock(createGameClock(),.35)
  const loaded=createGameClock(JSON.parse(JSON.stringify(partial)))
  assert.equal(loaded.elapsedSeconds,.35)
  assert.equal(clockSnapshot(advanceGameClock(loaded,.65)).time,'06:01')
  assert.equal(createGameClock({day:Infinity,elapsedSeconds:NaN}).day,1)
})

test('journal estimates use actual payout rules and an achievable time budget',()=>{
  const plans=incomeForecast()
  const mixed=plans.find(p=>p.id==='mixed')
  assert.equal(mixed.orders,12);assert.equal(plans[2].orders,18)
  assert.equal(mixed.gross,388)
  assert.equal(mixed.pizzaGross,336);assert.equal(mixed.bonusGross,52)
  assert.equal(mixed.perOrder,pizzaEarnings({quality:75,seconds:60}))
  assert.ok(mixed.serviceMinutes+2*ECONOMY_BALANCE.garmentMinutes+ECONOMY_BALANCE.browsingMinutes<=24)
  assert.ok(plans[2].serviceMinutes<=24)
  assert.ok(plans[0].gross<mixed.gross && mixed.gross<plans[2].gross)
  assert.ok(incomeForecast('garden')[1].gross>mixed.gross)
  assert.ok(incomeForecast('artisan')[1].gross>incomeForecast('garden')[1].gross)
  const mixedMenu=incomeForecast(['starter','garden'])[1]
  assert.equal(mixedMenu.gross,Math.round((pizzaEarnings({tier:'starter'})+pizzaEarnings({tier:'garden'}))*6)+52)
  assert.ok(mixedMenu.serviceMinutes+6+ECONOMY_BALANCE.browsingMinutes<=24)
  assert.ok(pizzaEarnings({quality:0})>0,'A poor order must never bankrupt the player')
})

test('all unlocked constructions can source suitable materials on every day, including after shelf depletion',()=>{
  for(let level=1;level<=12;level++) for(let day=1;day<=30;day++) {
    const inventory=fashionInventoryFor(day,0,level)
    inventory.remaining=Object.fromEntries(inventory.fabrics.map(f=>[f.id,0]))
    for(const pattern of FASHION_SCHEMATICS.filter(p=>p.unlockLevel<=level)) {
      const fabric=inventory.fabrics.find(f=>compatibleFashionFabric(pattern,f))
      assert.ok(fabric,`${level}/${day}/${pattern.id}`)
      const quote=fashionSupplyQuote(fabric,pattern.materialUnits,inventory)
      assert.equal(quote.stockUsed,0);assert.equal(quote.materialCost,fabric.cost*pattern.materialUnits)
    }
  }
})

test('discounted stock costs exactly 10% less, is paid once, and falls back to normal supply',()=>{
  const inv=fashionInventoryFor(1,0,4)
  const fabric=inv.fabrics.find(f=>f.featured)
  const quote=fashionSupplyQuote(fabric,1,inv)
  assert.equal(quote.materialCost,Math.round(fabric.cost*.9));assert.equal(quote.stockUsed,1)
  inv.remaining[fabric.id]=0
  const depleted=fashionProjectQuote({fabric,units:3,modificationCost:6,savings:.15},inv)
  assert.equal(depleted.cost,Math.round((fabric.cost*3+6)*.85));assert.equal(depleted.stockUsed,0)
  assert.equal(fashionProjectQuote({alteration:true,modificationCost:11,savings:.15},inv).cost,9)
})

test('boutique offers every unlocked piece without a rotation wall; discounts cannot bypass unlocks',()=>{
  for(let level=1;level<=12;level++) {
    const offers=boutiqueCatalogForDay(11,0,level)
    for(const item of offers) {
      assert.equal(item.availableToday,item.unlockLevel<=level)
      assert.equal(item.price,item.featured?Math.round(item.retailPrice*.9):item.retailPrice)
      assert.ok(!item.featured || !item.locked)
    }
  }
})

test('spending and low skill do not block any collection, while legacy unlocks remain permanent',()=>{
  const plain=createProgressionState({stats:{coinsEarned:2700,bestPizzaQuality:35},ownedUpgrades:[]})
  assert.equal(plain.atelierLevel,12)
  assert.equal(progressionSnapshot(plain,0).atelierLevel,12)
  const old=createProgressionState({atelierLevel:10,stats:{coinsEarned:900},ownedUpgrades:['pizza-garden']})
  assert.equal(old.atelierLevel,10)
  assert.equal(progressionSnapshot(old).nextMilestone.level,11)
  assert.equal(recordPizzaResult(old,{quality:10,payout:10}).atelierLevel,10)
})

test('twelve-order mixed days afford personal projects and reach mastery in 6–8 days',()=>{
  let progress=createProgressionState(),balance=120,masterDay=0
  const unlocked=new Map([[1,0]])
  for(let day=1;day<=15;day++) {
    for(let i=0;i<12;i++) {
      const income=pizzaEarnings({quality:75})
      balance+=income;progress=recordPizzaResult(progress,{quality:75,payout:income})
    }
    const extras=8*dishEarnings()+6*sodaEarnings(75)
    balance+=extras;progress=recordServiceIncome(progress,extras)
    // Two personal projects plus occasional shop purchases, no compulsory tools.
    balance-=48+40
    for(let i=0;i<2;i++) progress=recordGarmentResult(progress,{accuracy:82,quality:75})
    assert.ok(balance>=0)
    for(let level=1;level<=progress.atelierLevel;level++) if(!unlocked.has(level))unlocked.set(level,day)
    if(progress.atelierLevel===12 && !masterDay)masterDay=day
  }
  assert.equal(unlocked.get(3),1)
  assert.ok(unlocked.get(6)<=3)
  assert.ok(masterDay>=6 && masterDay<=8)
  const early=COUNTER_UPGRADES.filter(u=>u.atelierLevel<=3)
  assert.ok(early.every(u=>u.cost<=240))
  assert.ok(early.every(u=>u.cost<=incomeForecast()[1].gross),'An early tool fits within one mixed service day')
})

test('garment bonuses are situational, non-duplicating and bounded to fifteen percent',()=>{
  const sets=['counter-classic','garden-market','midnight-rush','plum-atelier','sunday-social','maker-studio']
    .map(id=>({id,name:id,active:true,complete:true}))
  const effects=garmentSetEffects([...sets,...sets])
  assert.equal(effects.tipBonus,.07);assert.equal(effects.materialSavings,.15)
  assert.equal(effects.tailoringFinish,6);assert.equal(effects.reputationBonus,.08)
  assert.equal(orderGarmentTipBonus(effects,{vegetables:true,phase:'night',presentation:.08}),.15)
  const evening=garmentSetEffects([sets[2]])
  assert.equal(orderGarmentTipBonus(evening,{phase:'morning'}),0)
  assert.equal(orderGarmentTipBonus(evening,{phase:'night'}),.1)
  assert.equal(pizzaEarnings({quality:75,setBonus:9}),pizzaEarnings({quality:75,setBonus:.15}))
})

test('small reputation bonuses carry fractions instead of silently rounding to zero',()=>{
  let base=0,boosted=0,plainCarry=0,bonusCarry=0
  for(let i=0;i<40;i++) {
    const p=reputationAward(80,0,plainCarry),b=reputationAward(80,.08,bonusCarry)
    base+=p.gained;boosted+=b.gained;plainCarry=p.carry;bonusCarry=b.carry
  }
  assert.equal(base,160);assert.equal(boosted,172);assert.ok(bonusCarry>.79 && bonusCarry<.81)
})

test('reputation has a gradual, useful loyalty benefit capped independently of outfit bonuses',()=>{
  assert.equal(loyaltyTipBonus(0),0);assert.equal(loyaltyTipBonus(120),.03)
  assert.equal(loyaltyTipBonus(240),.06);assert.equal(loyaltyTipBonus(90000),.06)
  assert.ok(pizzaEarnings({reputation:240})>pizzaEarnings({reputation:0}))
  assert.equal(pizzaEarnings({reputation:9999,setBonus:9,presentation:9}),pizzaEarnings({reputation:240,setBonus:.15}))
})

test('discount rotation reaches the complete catalogue rather than tying equally long IDs',()=>{
  const seen=new Set()
  for(let day=1;day<=1000;day++) for(const item of boutiqueCatalogForDay(day,0,12).filter(item=>item.featured))seen.add(item.id)
  assert.equal(seen.size,FASHION_CATALOG_GARMENTS.length)
})

test('journal shows meaningful unlock budgets and only exposes fast-forward in isolated playtests',()=>{
  const progression=progressionSnapshot(createProgressionState(),120)
  const journal={clock:clockSnapshot(createGameClock()),ledger:createDayLedger(),forecasts:incomeForecast(),
    progression,tier:'starter',collections:progression.milestones.map(m=>({...m,pieces:20,patterns:10}))}
  const normal=economyJournalMarkup(journal)
  assert.match(normal,/24 minutes/);assert.match(normal,/15%/);assert.match(normal,/240 rep/)
  assert.doesNotMatch(normal,/data-test-clock-advance/)
  assert.match(economyJournalMarkup(journal,true),/data-test-clock-advance/)
})

test('an altered set piece retains set identity through collection/equip/save and accessory layering',()=>{
  let state=createCharacterState()
  const base=FASHION_CATALOG_GARMENTS.find(g=>g.id==='tomato-apron')
  const schematic=FASHION_SCHEMATICS.find(s=>s.cut===base.cut)
  const draft=fashionGarmentDraft({projectId:'alter-set-test',schematic,baseGarment:base,alterationMode:true,
    fabric:{color:base.palette.primary,fiber:'Original cloth'},modifications:['patch-pocket'],finishing:[]})
  const made=garmentFromFashionResult({garment:{...draft,quality:80}})
  assert.equal(made.setPieceId,base.id)
  state=addCraftedGarment(state,{garment:{...draft,quality:80}});state=equipGarment(state,made.id)
  state=createCharacterState(JSON.parse(JSON.stringify(state)))
  assert.ok(wardrobeSetBonuses(state).find(s=>s.id==='counter-classic').active)
  assert.equal(activeFashionSets([base,{...base,id:'other',setPieceId:base.id}])[0].count,1)
})

test('daily ledger balances purchases, crafting and income and keeps only seven finished days',()=>{
  let balance=120,ledger=createDayLedger(null,1,balance)
  for(let day=1;day<=10;day++) {
    ledger=recordDayActivity(ledger,{earned:222,spent:88,pizzas:6,garments:2});balance+=134
    ledger=rollDayLedger(ledger,day+1,balance)
  }
  assert.equal(ledger.history.length,7);assert.equal(ledger.history.at(-1).day,10)
  for(const entry of ledger.history)assert.equal(entry.closingBalance,entry.openingBalance+entry.earned-entry.spent)
  assert.deepEqual(createDayLedger(JSON.parse(JSON.stringify(ledger)),11,balance),ledger)
})

test('clock/ledger integration removes completion-driven days and protects interrupted prep/projects',()=>{
  const game=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  const kitchen=readFileSync(new URL('../kitchen-minigames.js',import.meta.url),'utf8')
  const hub=readFileSync(new URL('../hub.js',import.meta.url),'utf8')
  assert.doesNotMatch(game,/advanceDayPhase/)
  assert.match(game,/setInterval\(tickDayClock,1000\)/)
  assert.match(game,/if\(!document.hidden\)/)
  assert.match(game,/visibilitychange/)
  assert.match(game,/state.ledger=recordDayActivity\(state.ledger,\{earned:payout,pizzas:1\}\)/)
  assert.match(game,/\['pepper', 'onion', 'olive', 'mushroom'\]/)
  assert.match(game,/function resumeClockForWork/)
  assert.doesNotMatch(kitchen.slice(kitchen.indexOf('function setPhase'),kitchen.indexOf('function draw(now')),/sauce.batchReady = true/)
  assert.match(hub,/spend\?\.\(offer.price\)/)
})
