# Hub interface boundary

The point-and-click hub lives in `hub.js` and `hub.css`. It does not import or reach into a minigame's canvas, state, or controls.

## Scenes and hotspots

`WORLD_SCENES` is the room registry. A scene supplies its art treatment, heading, and an array of hotspots. A hotspot performs one of three small actions:

- `scene`: move to another room.
- `minigame`: request a named station.
- `panel`: open a shop, wardrobe, map, or upgrade panel.

The starter kitchen advertises these stable station IDs:

- `pizza-making`
- `dough-throw`
- `sauce-pot`
- `soda-fountain`
- `dish-washing`

Adding a later room or station is data work: add one scene/station record and point a hotspot at it.

Hotspots are rectangular semantic regions over clean environment art, not visible map pins. Their `x`, `y`, `w`, and `h` values define the object-sized hit area. The room remains unmarked until pointer hover or keyboard focus, when that object receives a localized light treatment and a compact caption. Background plates must never contain people, tutorial markers, or other runtime UI.

## Pizzeria room split

The pizzeria deliberately uses two connected scenes:

- `restaurant` is front of house. The street door is visibly part of the room, customers enter through it, wait at the counter, and leave through it after service. The counter exposes the live order-line panel, while the swinging door connects to production.
- `kitchen` is back of house. It contains the five stable minigame stations, the upgrade board, and a return route to the restaurant. Customers do not stand among prep surfaces.

The shared shift model owns approaching, waiting, preparing, served, and dirty-dish state. Scene code only decides where that state is presented: approaching customers walk on `street`, queued customers occupy `restaurant`, and station status appears in `kitchen`.

## Connecting a minigame

The preferred adapter is the small registration API:

```js
const unregister = window.sliceAndStitchHub.registerMinigame('dough-throw', ({ sourceScene, returnToHub }) => {
  doughGame.open({
    onExit: () => returnToHub(sourceScene),
  })
})
```

Code that loads before the hub API is available can instead listen for the cancelable `slice-and-stitch:launch-minigame` event. Call `preventDefault()` to claim the launch request:

```js
document.addEventListener('slice-and-stitch:launch-minigame', (event) => {
  if (event.detail.stationId !== 'sauce-pot') return
  event.preventDefault()
  sauceGame.open(event.detail)
})
```

An externally hosted activity can return by dispatching `slice-and-stitch:return-to-hub` with an optional `{ sceneId }` detail. The current pizza and tailoring prototypes use an internal fallback and need no adapter.

## Shop boundary

Preview actions publish `slice-and-stitch:shop-action` with `{ catalogId, itemId, action }`. The hub deliberately does not mutate coins or inventory. A future economy owner can subscribe and authoritatively accept purchases without replacing the shop presentation.

## Actors and future customers

`hub-actors.js` keeps people separate from background art and room navigation. The initial pass has one persistent player avatar, named shopkeepers, lightweight street customers, and restaurant customers on routed walks. They are intentionally separate from the environment plates so a later sprite or scene-graph renderer can replace them without remaking any room art.

Runtime systems can add a customer without editing a room:

```js
const removeCustomer = window.sliceAndStitchHub.actors.add('street', {
  id: 'customer-order-104',
  name: 'Ari',
  role: 'customer',
  x: 8,
  y: 82,
  route: { x: 38, y: 82, duration: 9 },
  appearance: { outfit: '#775070', accent: '#e9b6c0' },
})
```

The same actor ID can eventually carry an order, patience state, authored garment recipe, animation controller, and destination schedule. `setPlayerAppearance` provides the first seam between wardrobe results and the persistent avatar. Replacing the DOM renderer with sprites should not change scene, minigame, shop, or customer-state contracts.
