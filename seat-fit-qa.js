import { createActorDirector, paintedActorSpec } from './hub-actors.js'
import { COUNTER_SEATS } from './scene-character-layout.js'

const director = createActorDirector(document.querySelector('.hub-actors'), { actors: {}, reducedMotion: true })
const identities = Array.from({ length: 4 }, (_, row) => {
  for (let index = 0; ; index++) {
    const id = `fit-${index}`
    if (paintedActorSpec({ id }).row === row) return id
  }
})
const guides = document.querySelector('.guides')
guides.innerHTML = COUNTER_SEATS.map(seat => `<i class="guide" style="left:${seat.x}%;top:${seat.y}%"></i>`).join('')
document.querySelector('#guides').addEventListener('change', event => { guides.hidden = !event.target.checked })
function render() {
  const action = document.querySelector('#pose').value
  director.setGroup('fit', identities.map((id, row) => ({ sceneId: 'restaurant', actor: {
    id, name: `Pose ${row + 1}`, role: 'customer', pose: 'counter-customer', facing: 'up',
    action, ...COUNTER_SEATS[row], scale: 1.08,
  } })))
  director.render('restaurant')
}
document.querySelector('#pose').addEventListener('change', render)
render()
