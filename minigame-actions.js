// One clear next action, adjacent to the work surface rather than below a ticket.
export function pizzaContinuation(pizza, ready, blocked = false, bakeLabel = '') {
  if (!pizza || pizza.served || blocked || pizza.transferringToOven || !ready) return null
  const actions = {
    sauce: ['Sauce spread', 'Continue to cheese'], cheese: ['Cheese ready', 'Continue to toppings'],
    toppings: ['Your order is assembled', 'Slide into oven'],
    bake: [pizza.bakeRunning ? bakeLabel : 'Ready for the oven', pizza.bakeRunning ? 'Take pizza out' : 'Start baking'],
    finish: ['Finishing oil applied', 'Continue to slicing'], cut: ['Pizza sliced', 'Serve pizza'],
  }
  const action = actions[pizza.step]
  return action ? { title: action[0], label: action[1] } : null
}

export function kitchenContinuation(info, service, gate) {
  if (!info || service.burning) return null
  const game = info.current
  const prepReady = info.active === 'saucePot' ? game.completed && service.sauces[game.kind] > 0
    : info.active === 'doughToss' && service.doughs > 0 && !['airborne', 'landing'].includes(game.stage)
  const serviceDone = ['dishwashing', 'drinkPour'].includes(info.active) && game.completed
  if (!prepReady && !serviceDone) return null
  if (serviceDone && info.active !== 'drinkPour' && service.drinkTickets > 0)
    return { title: 'Dish rack clear', label: 'Fill soda orders', station: 'drinkPour' }
  if (serviceDone && info.active !== 'dishwashing' && service.dirtyDishes > 0)
    return { title: 'Soda orders filled', label: 'Clean dishes', station: 'dishwashing' }
  if (gate?.blocked)
    return { title: prepReady ? 'Prep ready' : 'Service complete', label: gate.action, station: gate.station, sauce: gate.sauce }
  return { title: prepReady ? 'Prep ready for your order' : 'Service complete', label: 'Continue to pizza', station: 'pizza' }
}

export function renderWorkbenchAction(activityId, action, onContinue) {
  const activity = document.getElementById(activityId)
  const card = activity?.querySelector('.play-card')
  if (!card) return
  let dock = activity.querySelector('.workbench-continuation')
  const surface = card.querySelector('.workshop-surface') || card.querySelector('.canvas-wrap')
  if (!dock) {
    dock = document.createElement('div'); dock.className = 'workbench-continuation'
    dock.innerHTML = '<span role="status"><small>Next at the workbench</small><b></b></span><button type="button"></button>'
    surface.after(dock)
  }
  // Setup has a shared footer beneath both the library and the material panel.
  // Work stages retain a reserved dock so readiness never moves a live canvas.
  if (activity.dataset.fashionPhase === 'plan') {
    const grid = activity.querySelector('.activity-grid')
    if (dock.parentElement !== grid || grid.lastElementChild !== dock) grid.append(dock)
  }
  else if(dock.previousElementSibling !== surface) surface.after(dock)
  dock.querySelector('small').textContent = activity.dataset.fashionPhase === 'plan' ? '3 · Start your project' : 'Next at the workbench'
  dock.dataset.ready = action ? 'true' : 'false'
  dock.setAttribute('aria-hidden', action ? 'false' : 'true')
  const button = dock.querySelector('button')
  button.disabled = !action || Boolean(action.disabled)
  button.tabIndex = action && !action.disabled ? 0 : -1
  if (!action) return
  const title = dock.querySelector('b')
  if (title.textContent !== action.title) title.textContent = action.title
  if (button.textContent !== action.label) button.textContent = action.label
  button.onclick = onContinue
}

export function layoutFashionWorkspace(activity, fashion) {
  if (!activity) return
  const planning = fashion.step === 'plan' && !fashion.alterationMode
  activity.dataset.fashionPhase = fashion.alterationMode && fashion.step === 'plan' ? 'alteration' : fashion.step
  const ticket = activity.querySelector('.ticket-top')
  const materials = activity.querySelector('.craft-material-step')
  if (materials) {
    materials.hidden = !planning
    if (ticket && materials.parentElement !== ticket) activity.querySelector('#fashionTaskCopy').after(materials)
  }
  const tools = activity.querySelector('#fashionTools')
  const controls = activity.querySelector('#fashionWorkControls')
  const working = ['cut', 'sew', 'finish'].includes(fashion.step)
  const tray = activity.querySelector('.workshop-tools')
  const instruction = activity.querySelector('.instruction-card')
  const preview = activity.querySelector('#fashionProductPreview')
  const ratings = activity.querySelector('#qualityEstimate')
  const clear = activity.querySelector('#fashionClearButton')
  const next = activity.querySelector('#fashionNextButton')
  const readiness = activity.querySelector('#fashionPlanReadiness')
  if (working && instruction && tools && controls) {
    ticket.after(instruction)
    instruction.after(tools)
    tools.after(controls)
    if (clear) controls.after(clear)
    if (ratings && clear) clear.after(ratings)
    if (preview && ratings) ratings.after(preview)
  } else if (tray && tools && controls) {
    tray.append(tools, controls)
    if (preview && ticket) ticket.append(preview)
    if (ratings && instruction && ticket) { ticket.after(ratings); ratings.after(instruction) }
    if (next && clear) { instruction.after(next); next.after(clear) }
    if (readiness && clear) clear.after(readiness)
  }
}
