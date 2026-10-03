// Shared service readout, contained in the game panel in both rooms and stations.
export function renderKitchenServiceUI({service, gate, active, sauceKind, playtest=false}) {
  const panel=document.querySelector('.game-panel')
  if(!panel) return
  let alert=panel.querySelector('.kitchen-service-alert')
  if(!alert) {
    alert=document.createElement('aside');alert.className='kitchen-service-alert';alert.setAttribute('role','status');panel.append(alert)
  }
  const work=document.body.dataset.workshop
  const room=document.querySelector('[data-scene-stage]')?.dataset.scene
  const onShift=work === 'pizza' || work === 'kitchen' || (!work && ['kitchen','restaurant'].includes(room))
  const hot=service.hold && service.hold.key !== 'safe'
  alert.hidden=!hot || !onShift
  alert.dataset.severity=service.burning ? 'burning' : 'watch'
  const alertMarkup=`<span><b>${service.burning ? 'Sauce burning · cooking stopped' : 'Sauce getting hot'}</b><small>${service.burning ? 'Pizza progress is safe. Stir 1¼ turns to rescue the pot.' : 'Stir the tomato pot before it burns.'}</small></span><button type="button" data-service-station="saucePot" data-service-sauce="tomato">${service.burning ? 'Rescue pot' : 'Stir pot'}</button>`
  if(alert.innerHTML !== alertMarkup) alert.innerHTML=alertMarkup
  let overlay=document.querySelector('.pizza-prep-gate')
  if(!overlay) {
    overlay=document.createElement('div');overlay.className='pizza-prep-gate';document.querySelector('#pizzaCanvasWrap')?.append(overlay)
  }
  overlay.hidden=!gate?.blocked
  const gateMarkup=gate?.blocked ? `<div><small>Kitchen prep</small><h3>${gate.title}</h3><p>${gate.copy}</p><button type="button" data-service-station="${gate.station}" data-service-sauce="${gate.sauce || 'tomato'}">${gate.action}</button><span>Bases: ${service.doughs} · Tomato: ${service.sauces.tomato} · Pesto: ${service.sauces.pesto}</span></div>` : ''
  if(overlay.innerHTML !== gateMarkup) overlay.innerHTML=gateMarkup
  let stock=document.querySelector('.kitchen-service-stock')
  if(!stock) {
    stock=document.createElement('div');stock.className='kitchen-service-stock'
    document.querySelector('#kitchenActivity .workshop-tools')?.prepend(stock)
  }
  const stockMarkup=`<strong>Prepared stock</strong><span>Bases ${service.doughs}/10 · Tomato ${service.sauces.tomato}/10 · Pesto ${service.sauces.pesto}/10</span><small>${service.dirtyDishes} ${service.dirtyDishes === 1 ? 'dish' : 'dishes'} to wash · 2 coins each. ${service.drinkTickets} ${service.drinkTickets === 1 ? 'drink' : 'drinks'} waiting · up to 8 coins each.</small><div><button type="button" data-service-station="pizza">Return to pizza</button>${active === 'saucePot' ? `<button type="button" data-service-recipe="tomato" aria-pressed="${sauceKind === 'tomato'}" ${service.burning?'disabled':''}>Tomato batch</button><button type="button" data-service-recipe="pesto" aria-pressed="${sauceKind === 'pesto'}" ${service.burning?'disabled':''}>Cold pesto</button>` : ''}${playtest ? '<button type="button" data-service-test-heat>Heat pot · test only</button>' : ''}</div>`
  if(stock.innerHTML !== stockMarkup) stock.innerHTML=stockMarkup
  const reset=document.querySelector('#kitchenResetButton')
  if(reset) {
    reset.disabled=(service.burning && ['saucePot','doughToss'].includes(active))
      || (active === 'doughToss' && service.doughs>=10) || (active === 'saucePot' && service.sauces[sauceKind]>=10)
    reset.textContent=active === 'saucePot' ? 'New batch' : active === 'doughToss' ? 'Prepare another rack' : active === 'drinkPour' ? 'Restart current pour' : 'Restart current dish'
  }
}
