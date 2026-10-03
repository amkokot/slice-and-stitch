import {CLOCK_PHASES} from './game-clock.js'
import {FASHION_FABRICS, FASHION_SCHEMATICS} from './fashion-catalog.js'
import {compatibleFashionFabric} from './fashion-types.js'
import {incomeForecast} from './economy.js'

export function economyJournalMarkup(journal, playtest=false, room=null) {
  if(!journal) return '<h2>Town journal</h2><p>The atelier is opening.</p>'
  const {clock,ledger,forecasts,progression,collections}=journal
  const mixed=forecasts.find(item=>item.id==='mixed')
  const baselineMixed=incomeForecast('starter').find(item=>item.id==='mixed')
  const next=progression.nextMilestone
  const gap=next ? Math.max(0,next.requirements[0].target-progression.stats.coinsEarned) : 0
  const projectCosts=FASHION_SCHEMATICS.filter(item=>item.unlockLevel<=progression.atelierLevel).map(pattern=>{
    const materials=FASHION_FABRICS.filter(f=>f.unlockLevel<=progression.atelierLevel && compatibleFashionFabric(pattern,f))
    return Math.min(...materials.map(f=>f.cost*pattern.materialUnits))
  }).filter(Number.isFinite)
  const history=ledger.history.slice(-3).reverse()
  return `<span class="hub-drawer-eyebrow">The town ledger</span><h2 tabindex="-1">Your day, your atelier</h2>
    <p>A full day lasts <b>24 minutes</b>, from 06:00 to the next 06:00. ${room?.active?'Everyone shares the same clock. It advances while the host is connected and someone has the game open. Only the host can pause it.':'The clock advances while this tab is visible and the game is unpaused. It stops while you are away.'}</p>
    <div class="economy-rhythm" aria-label="Automatic day cycle">${CLOCK_PHASES.map(phase=>`<span class="${phase.id===clock.phase?'is-current':''}"><b>${phase.label}</b><small>${String(Math.floor(phase.start/60)).padStart(2,'0')}:00–${String(Math.floor(phase.end/60)).padStart(2,'0')}:00</small><em>${phase.seconds/60} real min</em></span>`).join('')}</div>
    <p>Shops stay open overnight, and new offers arrive each morning. Unfinished projects carry over. Go to bed at home to skip to tomorrow${room?.active?'—everyone connected must be in bed':''}. Starting work resumes a paused clock.</p>
    <div class="hub-shop-summary"><span><b>${ledger.current.earned} ●</b><small>earned today</small></span><span><b>${ledger.current.spent} ●</b><small>spent today</small></span><span><b>${ledger.current.pizzas} / ${ledger.current.garments}</b><small>orders / garments</small></span></div>
    <h3>Plan a day</h3><div class="economy-forecasts">${forecasts.map(plan=>`<article><b>${plan.label}</b><strong>~${plan.gross} ●</strong><small>${plan.orders} pizzas · ${plan.quality}% match</small><small>${plan.dishes} dishes + ${plan.sodas} sodas: ${plan.bonusGross} bonus ●</small><small>~${plan.serviceMinutes.toFixed(1)} min including prep</small></article>`).join('')}</div>
    <p class="economy-small">These are examples, not daily limits. Allow about a minute per pizza including batch prep, or 40–45 seconds once you know the controls. A mixed day leaves time for clothes and shopping. Estimates use your current menu and include handmade and reputation bonuses; situational set bonuses may earn you more.</p>
    <h3>Kitchen rhythm</h3><p>Each pizza needs one prepared base and one portion of the right sauce. Sauce batches make five portions. Tomato sauce gets hot after three minutes of service and burns after four: <b>stir 1¼ turns to rescue it before cooking can continue</b>. Stir ¾ turn for regular upkeep. Cold pesto never burns. ${room?.active?'The pot keeps heating while anyone has the pizzeria open.':'Leaving the pizzeria pauses the heat; it does not cool the pot.'}</p>
    <p>Each pizza served adds two dirty dishes and one soda order. Scrub and rinse each dish for <b>2 coins</b>. A good pour of the right flavor earns <b>3–8 coins</b>; wrong or very poor pours earn nothing. Preparing dough and sauce is free but earns no coins. Today’s service bonuses: <b>${ledger.current.bonusCoins || 0} coins</b> from ${ledger.current.dishes || 0} dishes and ${ledger.current.sodas || 0} drinks.</p>
    <h3>Patterns &amp; clothes</h3><p>Mara offers 3–5 patterns each day. Buy a pattern once and reuse it from <b>My pattern box</b>. New purchases are marked New until first used. More advanced designs join future shipments as your atelier level rises.</p>
    <p>Patterns cost about 12% of the matching ready-made piece. Pay for material when cutting begins; repeating a project currently costs ${Math.min(...projectCosts)}–${Math.max(...projectCosts)} coins with the cheapest suitable material, before alterations. Featured cloth and boutique pieces are 10% off. Other unlocked materials and clothes remain available at regular prices. A finished garment’s appraisal is its estimated value, not a cash reward.</p>
    <h3>Unlock more designs</h3><p>${next?`Next: <b>Atelier ${next.level} · ${next.label}</b>. Earn ${gap} more service coins—roughly ${Math.ceil(gap/(mixed.gross/mixed.orders))} typical orders with dish and drink bonuses. `:'Every collection is unlocked. '}Unlocks count all coins you have earned, not just your current balance. Spending never sets you back. Good crafting can help you unlock the next level sooner.</p>
    <div class="economy-table-wrap"><table class="economy-unlocks"><thead><tr><th>Atelier</th><th>Lifetime coins</th><th>New pieces / patterns</th><th>Example day*</th></tr></thead><tbody>${collections.map(item=>`<tr class="${item.level<=progression.atelierLevel?'is-unlocked':''}"><td>${item.level}${item.level<=progression.atelierLevel?' ✓':''}</td><td>${item.requirements[0]?.target || 0}</td><td>${item.pieces} / ${item.patterns}</td><td>${item.level===1?'Start':`Day ${Math.ceil(item.requirements[0].target/baselineMixed.gross)}`}</td></tr>`).join('')}</tbody></table></div>
    ${next?.shortcut?`<p class="economy-small">Optional shortcut for atelier ${next.level}: ${next.shortcut.income} lifetime coins, ${next.shortcut.garments} finished garments, and ${next.shortcut.accuracy}% best construction accuracy.</p>`:''}
    <p class="economy-small">*Example pacing from a new game, including dish and drink income. These are not required waiting days: faster orders, crafting, and bonuses can unlock designs sooner.</p>
    <h3>Outfit benefits</h3><p>Handmade quality adds up to 8% in tips. Counter Classic, Garden Market, and Midnight Rush sets can add more for certain orders; <b>clothing income bonuses cap at 15%</b>. Maker Studio reduces project costs by 8–15%, Plum Atelier adds 3–6 finish points, and Sunday Social adds 4–8% reputation. Two matching pieces start a set bonus; three give the full benefit. Extra colorways do not stack the same bonus.</p>
    <p class="economy-small">Your reputation also adds loyalty income, up to 6% at 240 reputation. Your current loyalty bonus: +${((journal.loyalty || 0)*100).toFixed(1)}%.</p>
    ${history.length?`<h3>Recent days</h3><div class="economy-history">${history.map(day=>`<p><b>Day ${day.day}</b> · +${day.earned} earned / −${day.spent} spent · ${day.pizzas} orders / ${day.garments} garments · closed with ${day.closingBalance} ●</p>`).join('')}</div>`:''}
    <div class="hub-drawer-button-row"><button class="hub-drawer-primary" type="button" data-journal-clock-toggle>${clock.paused?'Resume day clock':'Pause day clock'}</button><button class="hub-drawer-secondary" type="button" data-close-drawer>Back to town</button></div>
    ${playtest?'<button class="hub-drawer-secondary economy-test-clock" type="button" data-test-clock-advance>Advance 6 minutes · test only</button>':''}`
}
