import { characterToActorAppearance, createCharacterState } from './character-model.js'
import { renderCharacterMarkup } from './character-v2/renderer.js'
import { generateNpcAppearance } from './character-v2/npc-generator.js'
import { renderPaintedPaperDoll } from './character-v3/painted-paper-doll.js'
import { characterSceneFit, sceneCharacterPlane, seatedPoseFrame, seatedSpriteCell } from './scene-character-layout.js'

export const PLAYER_STARTS = Object.freeze({
  street: Object.freeze({ x: 51, y: 82 }),
  restaurant: Object.freeze({ x: 20, y: 89 }),
  kitchen: Object.freeze({ x: 21, y: 89 }),
  tailor: Object.freeze({ x: 86, y: 88 }),
  boutique: Object.freeze({ x: 29, y: 90 }),
  home: Object.freeze({ x: 69, y: 77 }),
})

export const SCENE_ACTORS = Object.freeze({
  street: Object.freeze([
    Object.freeze({
      id: 'neighbor-violet',
      name: 'Mina',
      role: 'customer',
      x: 20,
      y: 79,
      route: Object.freeze({ x: 67, y: 84, duration: 13, delay: -4 }),
      appearance: Object.freeze({
        skin: '#8e563c', hair: '#2f2424', eye: '#5e7b64', frame: 'compact', hairStyle: 'curls',
        face: 'bright', freckles: true,
        top: '#775070', topAccent: '#efc6d2', topCut: 'blouse', topPattern: 'floral',
        bottom: '#465c75', bottomAccent: '#c98c58', bottomCut: 'pleated-skirt', bottomPattern: 'solid',
        shoes: '#54364f', shoeAccent: '#efc6d2', shoeCut: 'boots',
        accessory: '#e9b6c0', accessoryAccent: '#efc776', accessoryCut: 'beret', hasAccessory: true,
      }),
    }),
    Object.freeze({
      id: 'neighbor-coral',
      name: 'Theo',
      role: 'customer',
      x: 78,
      y: 77,
      route: Object.freeze({ x: 58, y: 78, duration: 10, delay: -7 }),
      appearance: Object.freeze({
        skin: '#d79a6d', hair: '#5c382a', eye: '#4f7280', frame: 'tall', hairStyle: 'crop',
        face: 'focused', freckles: false,
        top: '#397d78', topAccent: '#f0d4a4', topCut: 'jacket', topPattern: 'pinstripe',
        bottom: '#343943', bottomAccent: '#8f9cab', bottomCut: 'wide-leg', bottomPattern: 'denim',
        shoes: '#efe3c7', shoeAccent: '#397d78', shoeCut: 'sneakers',
        accessory: '#775070', accessoryAccent: '#efc776', accessoryCut: 'satchel', hasAccessory: true,
      }),
    }),
  ]),
  restaurant: Object.freeze([
    Object.freeze({
      id: 'sofia-counter',
      name: 'Sofia',
      role: 'shopkeeper',
      state: 'serving',
      pose: 'counter-host',
      detailLevel: 'signature',
      x: 79.5,
      y: 68.2,
      scale: 1.24,
      facing: 'down-left',
      lookDirection: 'left',
      action: 'serve',
      appearance: Object.freeze({
        skin: '#9b5c43', hair: '#281e24', eye: '#6a7959', frame: 'average', hairStyle: 'curls', hairStyleId: 'loc-bun', hairTexture: 'locs',
        face: 'bright', faceId: 'confident', faceShape: 'heart', eyeShape: 'upturned', browStyle: 'full', noseShape: 'rounded', mouthStyle: 'wide', complexionDetail: 'beauty-mark', facialHair: 'none', freckles: false,
        top: '#efe1bd', topAccent: '#b94836', topCut: 'blouse', topPattern: 'solid',
        bottom: '#4c4d58', bottomAccent: '#c69a58', bottomCut: 'pants', bottomPattern: 'pinstripe',
        apron: '#b94836', apronAccent: '#f1ca68', apronCut: 'service-apron', apronPattern: 'stripe', hasApron: true,
        shoes: '#3b2d2a', shoeAccent: '#efe1bd', shoeCut: 'loafers',
      }),
    }),
  ]),
  kitchen: Object.freeze([]),
  tailor: Object.freeze([
    Object.freeze({
      id: 'mara',
      name: 'Mara',
      role: 'shopkeeper',
      state: 'tailoring',
      pose: 'workbench',
      detailLevel: 'signature',
      x: 17,
      y: 78,
      scale: 1.42,
      facing: 'down-right',
      lookDirection: 'down-left',
      action: 'sew',
      appearance: Object.freeze({
        skin: '#ca865e', hair: '#3c2923', eye: '#416c58', frame: 'broad', hairStyle: 'bun', hairStyleId: 'braided-bun', hairTexture: 'braided',
        face: 'soft', faceId: 'focused', faceShape: 'square', eyeShape: 'hooded', browStyle: 'full', noseShape: 'wide', mouthStyle: 'soft', complexionDetail: 'freckles-soft', facialHair: 'none', freckles: true,
        top: '#4d785a', topAccent: '#e8c366', topCut: 'chore-jacket', topPattern: 'solid',
        bottom: '#604b43', bottomAccent: '#c59b71', bottomCut: 'wide-leg', bottomPattern: 'denim',
        apron: '#e4c681', apronAccent: '#775070', apronCut: 'crossback-apron', apronPattern: 'stripe', hasApron: true,
        shoes: '#3b2d2a', shoeAccent: '#e8c366', shoeCut: 'boots',
        accessory: '#d9a7b8', accessoryAccent: '#f8e1a5', accessoryCut: 'brooch', hasAccessory: true,
      }),
    }),
  ]),
  boutique: Object.freeze([
    Object.freeze({
      id: 'luna',
      name: 'Luna',
      role: 'shopkeeper',
      state: 'presenting',
      pose: 'boutique-host',
      detailLevel: 'signature',
      x: 42,
      y: 77,
      scale: 1.36,
      facing: 'down-right',
      lookDirection: 'right',
      action: 'present',
      appearance: Object.freeze({
        skin: '#9e6047', hair: '#241f2b', eye: '#76663f', frame: 'average', hairStyle: 'bob', hairStyleId: 'shoulder-waves', hairTexture: 'wavy',
        face: 'bright', faceId: 'confident', faceShape: 'diamond', eyeShape: 'upturned', browStyle: 'arched', noseShape: 'straight', mouthStyle: 'full', complexionDetail: 'rosy', facialHair: 'none', freckles: false,
        top: '#785276', topAccent: '#e9b6c0', topCut: 'cardigan', topPattern: 'cable',
        bottom: '#d5a354', bottomAccent: '#fff0c7', bottomCut: 'bias-skirt', bottomPattern: 'check',
        shoes: '#54364f', shoeAccent: '#e9b6c0', shoeCut: 'loafers',
        accessory: '#e9b6c0', accessoryAccent: '#f5d36e', accessoryCut: 'scarf', hasAccessory: true,
      }),
    }),
  ]),
  home: Object.freeze([]),
})

const DEFAULT_PLAYER = Object.freeze({
  id: 'player',
  name: 'You',
  role: 'player',
  detailLevel: 'avatar',
  scale: 1.05,
  appearance: characterToActorAppearance(createCharacterState()),
})

const PAINTED_VISITOR_SHEET = Object.freeze({
  src: 'assets/characters-v3/sprites/town-visitors-atlas-v1.png',
  columns: 5,
  rows: 4,
  width: 64,
  height: 84,
})

const PAINTED_SEATED_VISITOR_SHEET = Object.freeze({
  src: 'assets/characters-v3/sprites/town-visitors-seated-atlas-v1.png',
  columns: 5,
  rows: 4,
  width: 76,
  height: 100,
})

const PAINTED_VENDOR_SHEETS = Object.freeze({
  mara: Object.freeze({
    src: 'assets/characters-v3/sprites/mara-tailor-strip-v1.png',
    columns: 5,
    rows: 1,
    width: 65,
    height: 118,
  }),
  luna: Object.freeze({
    src: 'assets/characters-v3/sprites/luna-boutique-strip-v1.png',
    columns: 5,
    rows: 1,
    width: 65,
    height: 118,
  }),
  'sofia-counter': Object.freeze({
    src: 'assets/characters-v3/sprites/sofia-pizzeria-strip-v1.png',
    columns: 5,
    rows: 1,
    width: 71,
    height: 118,
  }),
})

function stableIndex(value, count) {
  let hash = 2166136261
  for (const character of String(value || 'visitor')) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash >>> 0) % count
}

function sheetPosition(index, count) {
  if (count <= 1) return '0%'
  return `${(index / (count - 1)) * 100}%`
}

export function paintedActorSpec(actor = {}) {
  if (actor.role === 'player') return null
  const vendor = PAINTED_VENDOR_SHEETS[actor.id]
  if (vendor) return Object.freeze({ ...vendor, row: 0, kind: 'vendor' })
  if (actor.pose === 'counter-customer' || actor.pose === 'seated') {
    const row = stableIndex(actor.visualIdentity || actor.id || actor.name, PAINTED_SEATED_VISITOR_SHEET.rows)
    const crop = seatedSpriteCell(row, actor.action)
    return Object.freeze({
      ...PAINTED_SEATED_VISITOR_SHEET,
      row, crop, height: PAINTED_SEATED_VISITOR_SHEET.height * crop.heightScale,
      kind: 'seated',
    })
  }
  return Object.freeze({
    ...PAINTED_VISITOR_SHEET,
    row: stableIndex(actor.visualIdentity || actor.id || actor.name, PAINTED_VISITOR_SHEET.rows),
    kind: 'visitor',
  })
}

export function paintedActorMotionSpec(actor = {}, motion = 'idle') {
  const spec = paintedActorSpec(actor)
  if (!spec || motion !== 'walk' || !['visitor', 'seated'].includes(spec.kind)) return spec
  return Object.freeze({
    ...PAINTED_VISITOR_SHEET,
    row: spec.row,
    kind: 'visitor-walk',
  })
}

function numberOr(value, fallback) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export function walkCycleForRoute(origin = {}, target = {}, duration = 1) {
  const dx = numberOr(target.x, 50) - numberOr(origin.x, 50)
  const dy = (numberOr(target.y, 50) - numberOr(origin.y, 50)) * 1.35
  const routeDuration = Math.max(.1, numberOr(duration, 1))
  const speed = Math.hypot(dx, dy) / routeDuration
  const preferred = Math.max(.58, Math.min(1.15, 3.2 / Math.max(.1, speed)))
  const minimumCycles = Math.max(1, Math.ceil(routeDuration / 1.15))
  const maximumCycles = Math.max(minimumCycles, Math.floor(routeDuration / .58))
  const cycles = Math.max(minimumCycles, Math.min(maximumCycles, Math.round(routeDuration / preferred)))
  return routeDuration / cycles
}

export function directionToTarget(origin = {}, target = {}) {
  const dx = numberOr(target.x, 50) - numberOr(origin.x, 50)
  const dy = numberOr(target.y, 50) - numberOr(origin.y, 50)
  const horizontal = dx < -3 ? 'left' : dx > 3 ? 'right' : ''
  const vertical = dy < -7 ? 'up' : dy > 11 ? 'down' : ''
  return [vertical, horizontal].filter(Boolean).join('-') || 'forward'
}

export function normalizeActor(actor, fallbackId = 'visitor') {
  const id = String(actor?.id || fallbackId)
  const role = String(actor?.role || 'customer')
  const generatedAppearance = role === 'player' || actor?.character
    ? {}
    : generateNpcAppearance(id, { role })
  const suppliedAppearance = actor?.character
    ? characterToActorAppearance(actor.character)
    : { ...generatedAppearance, ...(actor?.appearance || {}) }
  const route = actor?.route
    ? Object.freeze({
      x: numberOr(actor.route.x, actor.x),
      y: numberOr(actor.route.y, actor.y),
      duration: Math.max(2, numberOr(actor.route.duration, 10)),
      delay: numberOr(actor.route.delay, 0),
      loop: actor.route.loop !== false,
      action: String(actor.route.action || ''),
      arrivalAction: String(actor.route.arrivalAction || actor.action || ''),
      arrivalFacing: String(actor.route.arrivalFacing || actor.facing || ''),
    })
    : null
  return Object.freeze({
    id,
    visualIdentity: String(actor?.visualIdentity || id),
    name: String(actor?.name || 'Visitor'),
    role,
    x: Math.min(100, Math.max(0, numberOr(actor?.x, 50))),
    y: Math.min(100, Math.max(0, numberOr(actor?.y, 80))),
    route,
    state: String(actor?.state || 'idle'),
    pose: String(actor?.pose || 'standing'),
    detailLevel: String(actor?.detailLevel || (role === 'shopkeeper' ? 'signature' : 'town')),
    facing: String(actor?.facing || ''),
    lookDirection: String(actor?.lookDirection || actor?.facing || ''),
    motion: String(actor?.motion || 'idle'),
    action: String(actor?.action || ''),
    scale: Math.min(1.8, Math.max(.72, numberOr(actor?.scale, role === 'shopkeeper' ? 1.32 : 1))),
    sessionScale: Math.min(1, Math.max(.6, numberOr(actor?.sessionScale,1))),
    profile: actor?.profile ? Object.freeze({ ...actor.profile }) : null,
    appearance: Object.freeze({
      ...suppliedAppearance,
      skin: suppliedAppearance.skin || '#b96f50',
      hair: suppliedAppearance.hair || '#39282a',
      eye: suppliedAppearance.eye || '#4b3028',
      frame: suppliedAppearance.frame || 'average',
      frameId: suppliedAppearance.frameId || suppliedAppearance.frame || 'average',
      height: suppliedAppearance.height || 'average',
      heightScale: Number(suppliedAppearance.heightScale) || 1,
      hairStyle: suppliedAppearance.hairStyle || 'bob',
      hairStyleId: suppliedAppearance.hairStyleId || suppliedAppearance.hairStyle || 'bob',
      hairTexture: suppliedAppearance.hairTexture || 'wavy',
      face: suppliedAppearance.face || 'bright',
      faceId: suppliedAppearance.faceId || suppliedAppearance.face || 'bright',
      faceShape: suppliedAppearance.faceShape || 'soft-round',
      eyeShape: suppliedAppearance.eyeShape || 'almond',
      browStyle: suppliedAppearance.browStyle || 'soft',
      noseShape: suppliedAppearance.noseShape || 'button',
      mouthStyle: suppliedAppearance.mouthStyle || 'soft',
      complexionDetail: suppliedAppearance.complexionDetail || 'none',
      facialHair: suppliedAppearance.facialHair || 'none',
      freckles: Boolean(suppliedAppearance.freckles),
      top: suppliedAppearance.top || suppliedAppearance.outfit || '#417358',
      topAccent: suppliedAppearance.topAccent || suppliedAppearance.accent || '#f1ca68',
      topCut: suppliedAppearance.topCut || 'tee',
      topPattern: suppliedAppearance.topPattern || 'solid',
      bottom: suppliedAppearance.bottom || suppliedAppearance.outfit || '#46586a',
      bottomAccent: suppliedAppearance.bottomAccent || suppliedAppearance.accent || '#f1ca68',
      bottomCut: suppliedAppearance.bottomCut || 'pants',
      bottomPattern: suppliedAppearance.bottomPattern || 'solid',
      apron: suppliedAppearance.apron || 'transparent',
      apronAccent: suppliedAppearance.apronAccent || 'transparent',
      apronCut: suppliedAppearance.apronCut || 'service-apron',
      apronPattern: suppliedAppearance.apronPattern || 'solid',
      hasApron: Boolean(suppliedAppearance.hasApron),
      shoes: suppliedAppearance.shoes || '#efe3c7',
      shoeAccent: suppliedAppearance.shoeAccent || '#775070',
      shoeCut: suppliedAppearance.shoeCut || 'sneakers',
      accessory: suppliedAppearance.accessory || 'transparent',
      accessoryAccent: suppliedAppearance.accessoryAccent || 'transparent',
      accessoryCut: suppliedAppearance.accessoryCut || 'none',
      hasAccessory: Boolean(suppliedAppearance.hasAccessory),
      accessories: Object.freeze([...(suppliedAppearance.accessories || [])]),
      rig: suppliedAppearance.rig || 'biped-v2',
    }),
  })
}

function classToken(value, fallback) {
  const token = String(value || fallback).toLowerCase().replace(/[^a-z0-9-]/g, '')
  return token || fallback
}

export function actorAppearanceStyle(appearance) {
  return [
    `--actor-skin:${appearance.skin}`,
    `--actor-hair:${appearance.hair}`,
    `--actor-eye:${appearance.eye}`,
    `--actor-top:${appearance.top}`,
    `--actor-top-accent:${appearance.topAccent}`,
    `--actor-bottom:${appearance.bottom}`,
    `--actor-bottom-accent:${appearance.bottomAccent}`,
    `--actor-apron:${appearance.apron}`,
    `--actor-apron-accent:${appearance.apronAccent}`,
    `--actor-shoes:${appearance.shoes}`,
    `--actor-shoe-accent:${appearance.shoeAccent}`,
    `--actor-accessory:${appearance.accessory}`,
    `--actor-accessory-accent:${appearance.accessoryAccent}`,
  ].join(';')
}

export function actorAppearanceClasses(appearance) {
  return [
    `frame-${classToken(appearance.frame, 'average')}`,
    `hair-${classToken(appearance.hairStyle, 'bob')}`,
    `face-${classToken(appearance.face, 'bright')}`,
    `top-${classToken(appearance.topCut, 'tee')}`,
    `top-pattern-${classToken(appearance.topPattern, 'solid')}`,
    `bottom-${classToken(appearance.bottomCut, 'pants')}`,
    `bottom-pattern-${classToken(appearance.bottomPattern, 'solid')}`,
    `apron-pattern-${classToken(appearance.apronPattern, 'solid')}`,
    appearance.freckles ? 'has-freckles' : '',
    appearance.hasApron ? 'has-apron' : '',
    appearance.hasAccessory ? `has-accessory accessory-${classToken(appearance.accessoryCut, 'scarf')}` : '',
  ].filter(Boolean).join(' ')
}

export function actorFigureMarkup(appearance = DEFAULT_PLAYER.appearance, options = {}) {
  return renderCharacterMarkup(appearance, options)
}

export function renderPlayerAvatarMarkup(profile = {}, appearance = {}, options = {}) {
  const lookDirection = options.lookDirection || options.facing
  return `<span class="hub-player-painted-avatar" data-equipment-rig="painted-paper-doll-v1" data-player-pose="stationary">${renderPaintedPaperDoll(profile, appearance, {
    className: 'hub-player-paper-doll',
    label: `${profile.name || 'Player'} independently layered painted outfit`,
    lookDirection,
  })}</span>`
}

function paintedActorMarkup(actor, { facing = 'down-right', lookDirection = facing, motion = 'idle', action = '' } = {}) {
  const spec = paintedActorMotionSpec(actor, motion)
  if (!spec) return actorFigureMarkup(actor.appearance, { id: `actor-${actor.id}`, facing, lookDirection, motion, action })

  const normalizedFacing = String(facing || 'down-right')
  const normalizedLook = String(lookDirection || normalizedFacing)
  const normalizedAction = classToken(action, 'none')
  const walking = motion === 'walk'
  const working = spec.kind === 'vendor' && ['sew', 'work', 'fold', 'write'].includes(normalizedAction)
  let frame = 0

  if (spec.kind === 'vendor') {
    if (['serve', 'present'].includes(normalizedAction)) frame = 4
    else if (working) frame = 1
    else if (normalizedAction !== 'none') frame = 3
    else if (normalizedLook.includes('left')) frame = 1
    else if (normalizedLook.includes('right')) frame = 2
  } else if (spec.kind === 'seated') {
    frame = seatedPoseFrame(normalizedAction)
  } else if (walking) {
    frame = 1
  } else if (normalizedAction !== 'none') {
    frame = 4
  } else if (normalizedFacing.includes('up')) {
    frame = 3
  } else if (spec.kind === 'visitor') {
    frame = [0, 1, 4][stableIndex(actor.id || actor.name, 3)]
  }

  const mirror = spec.kind.startsWith('visitor') && normalizedFacing.includes('left') ? -1 : 1
  const classes = [
    'painted-actor-sprite',
    `sprite-${spec.kind}`,
    `sprite-facing-${classToken(normalizedFacing, 'down-right')}`,
    walking ? 'sprite-motion-walk' : '',
    working ? 'sprite-motion-work' : '',
    normalizedAction !== 'none' ? `sprite-action-${normalizedAction}` : '',
  ].filter(Boolean).join(' ')
  const style = [
    `--sprite-image:url('${spec.src}')`,
    `--sprite-size-x:${spec.columns * 100}%`,
    `--sprite-size-y:${spec.crop ? spec.crop.atlasHeight / spec.crop.height * 100 : spec.rows * 100}%`,
    `--sprite-width:${spec.width}px`,
    `--sprite-height:${spec.height}px`,
    `--sprite-x:${sheetPosition(frame, spec.columns)}`,
    `--sprite-y:${spec.crop ? `${spec.crop.top / (spec.crop.atlasHeight - spec.crop.height) * 100}%` : sheetPosition(spec.row, spec.rows)}`,
    `--sprite-walk-a:${sheetPosition(1, spec.columns)}`,
    `--sprite-walk-b:${sheetPosition(2, spec.columns)}`,
    `--sprite-mirror:${mirror}`,
    // Row 3's silver hair starts above the uniform atlas cell boundary.
    // Trim that neighbour from row 2's standing cells without cutting shoes.
    `--sprite-trim-bottom:${spec.kind.startsWith('visitor') && spec.row === 2 ? 3 : 0}%`,
  ].join(';')
  return `<span class="${classes}" data-sprite-row="${spec.row}" data-sprite-frame="${frame}" style="${style}" aria-hidden="true"></span>`
}

function actorVisualMarkup(actor, options = {}) {
  if (actor.role === 'player') {
    return renderPlayerAvatarMarkup(actor.profile, actor.appearance, { id: `actor-${actor.id}`, ...options })
  }
  return paintedActorSpec(actor)
    ? paintedActorMarkup(actor, options)
    : actorFigureMarkup(actor.appearance, { id: `actor-${actor.id}`, ...options })
}

function actorMarkup(actor, { reducedMotion = false } = {}) {
  // Generated locomotion is intentionally paused. Customers keep their
  // authored scene position and use the atlas' front/side/back/gesture poses;
  // route data remains in the simulation so a hand-authored rig can resume it.
  const route = actor.role === 'player' ? actor.route : null
  const routeDirection = route ? directionToTarget(actor, route) : 'down-right'
  const facing = actor.facing || (routeDirection === 'forward' ? 'down-right' : routeDirection)
  const lookDirection = actor.lookDirection || facing
  const motion = route && !reducedMotion ? 'walk' : actor.motion
  const action = route ? route.action : actor.action
  const paintedSpec = paintedActorSpec(actor)
  const classes = [
    'hub-actor', paintedSpec ? 'uses-painted-sprite' : 'uses-char2', `is-${classToken(actor.role, 'customer')}`,
    `detail-${classToken(actor.detailLevel, 'town')}`, `state-${classToken(actor.state, 'idle')}`,
    `pose-${classToken(actor.pose, 'standing')}`, actorAppearanceClasses(actor.appearance), route ? 'is-walking' : '',
    route?.loop ? 'route-loop' : '',
  ].filter(Boolean).join(' ')
  const variables = [
    `--actor-x:${actor.x}%`,
    `--actor-y:${actor.y}%`,
    `--actor-scale:${actor.scale}`,
    actorAppearanceStyle(actor.appearance),
  ]
  if (paintedSpec) {
    variables.push(`--painted-width:${paintedSpec.width}px`, `--painted-height:${paintedSpec.height}px`)
  }
  if (route) {
    const walkCycle = walkCycleForRoute(actor, route, route.duration)
    variables.push(
      `--actor-to-x:${route.x}%`,
      `--actor-to-y:${route.y}%`,
      `--actor-duration:${route.duration}s`,
      `--actor-delay:${route.delay}s`,
      `--actor-iterations:${route.loop ? 'infinite' : '1'}`,
      '--actor-direction:normal',
      `--actor-fill:${route.loop ? 'none' : 'forwards'}`,
      `--actor-walk-cycle:${walkCycle}s`,
    )
  }
  const prop = paintedSpec ? '' : actor.pose === 'workbench'
    ? '<span class="hub-actor-prop is-fabric" aria-hidden="true"><i></i></span>'
    : actor.pose === 'boutique-host'
      ? '<span class="hub-actor-prop is-hanger" aria-hidden="true"><i></i></span>'
      : actor.pose === 'counter-host'
        ? '<span class="hub-actor-prop is-tray" aria-hidden="true"><i></i></span>'
        : ''
  const safeName=String(actor.name).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))
  return `<div class="${classes}" data-actor-id="${actor.id}" data-actor-x="${actor.x}" data-actor-y="${actor.y}" data-actor-facing="${facing}" data-look="${lookDirection}" data-actor-state="${classToken(actor.state, 'idle')}" data-actor-action="${classToken(action, 'none')}" style="${variables.join(';')}" aria-label="${safeName}">
    ${paintedSpec?.kind === 'seated' ? '<span class="hub-seat-contact" aria-hidden="true"></span>' : ''}
    ${actorVisualMarkup(actor, { facing, lookDirection, motion, action })}
    ${prop}
    <span class="hub-actor-shadow" aria-hidden="true"></span>
  </div>`
}

export function createActorDirector(layer, {
  actors = SCENE_ACTORS,
  playerStarts = PLAYER_STARTS,
  reducedMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
} = {}) {
  if (!layer) {
    return Object.freeze({
      render: () => {}, movePlayerTo: () => 0, add: () => () => {},
      setGroup: () => {}, setPlayerLocation: () => {},
      setPlayerAppearance: () => {}, setPlayerCharacter: () => {}, lookPlayerAt: () => 'forward', clearPlayerLook: () => {},
      snapshot: () => Object.freeze({ sceneId: null, actors: [] }),
    })
  }

  const additions = new Map()
  const groups = new Map()
  const playerLocations = new Map()
  let sceneId = null
  let playerAppearance = { ...DEFAULT_PLAYER.appearance }
  let playerName = DEFAULT_PLAYER.name
  let playerProfile = createCharacterState().profile
  let playerMoveSequence = 0
  let playerRevision = 0
  let renderedPlayerRevision = -1

  function layoutActors() {
    if (!sceneId) return
    const stage = layer.parentElement
    if (!stage) return
    const plane = sceneCharacterPlane(sceneId, stage.clientWidth, stage.clientHeight)
    Object.assign(layer.style, { width: `${plane.width}px`, height: `${plane.height}px`, left: `${plane.left}px`, top: `${plane.top}px` })
    actorsForScene(sceneId).forEach(actor => {
      const element = layer.querySelector(`[data-actor-id="${actor.id}"]`)
      if (!element) return
      const fit = characterSceneFit(sceneId, actor, paintedActorSpec(actor), plane)
      element.style.setProperty('--scene-character-width', `${fit.width}px`)
      element.style.setProperty('--scene-character-height', `${fit.height}px`)
      element.style.setProperty('--scene-character-anchor', `${-fit.anchor * 100}%`)
      element.style.setProperty('--scene-character-center', `${-fit.center * 100}%`)
      element.style.setProperty('--scene-character-clip', `${fit.clipBottom}px`)
      element.style.setProperty('--scene-character-depth', fit.depth)
      if (fit.seat) {
        element.style.setProperty('--seat-contact-x', `${fit.center * 100}%`)
        element.style.setProperty('--seat-contact-y', `${fit.anchor * 100}%`)
        element.style.setProperty('--seat-contact-width', `${fit.seat.width}px`)
        element.style.setProperty('--seat-contact-height', `${fit.seat.height}px`)
      }
    })
  }
  if (typeof ResizeObserver === 'function') new ResizeObserver(layoutActors).observe(layer.parentElement)

  function actorsForScene(nextSceneId) {
    const start = playerLocations.get(nextSceneId) || playerStarts[nextSceneId] || { x: 50, y: 84 }
    const player = normalizeActor({ ...DEFAULT_PLAYER, ...start, name: playerName, profile: playerProfile, appearance: playerAppearance }, 'player')
    const residents = (actors[nextSceneId] || []).map((actor, index) => normalizeActor(actor, `resident-${index}`))
    const visitors = (additions.get(nextSceneId) || []).map((actor, index) => normalizeActor(actor, `visitor-${index}`))
    const grouped = [...groups.values()].flatMap((entries) => entries
      .filter((entry) => entry.sceneId === nextSceneId)
      .map((entry, index) => normalizeActor(entry.actor, `group-${index}`)))
    return [player, ...residents, ...visitors, ...grouped]
  }

  function render(nextSceneId) {
    playerMoveSequence += 1
    const changedScene = sceneId !== nextSceneId
    const existingPlayer = playerRevision === renderedPlayerRevision
      ? layer.querySelector('[data-actor-id="player"]') : null
    sceneId = nextSceneId
    const sceneActors = actorsForScene(sceneId)
    layer.innerHTML = sceneActors.map((actor) => actorMarkup(actor, { reducedMotion })).join('')
    // Preserve loaded outfit SVGs when only the queue/population changes.
    // Rebuilding external SVG images caused a briefly head-only avatar.
    if (existingPlayer) {
      if (changedScene) {
        const start = playerLocations.get(sceneId) || playerStarts[sceneId] || { x: 50, y: 84 }
        existingPlayer.style.left = ''
        existingPlayer.style.top = ''
        existingPlayer.style.setProperty('--actor-x', `${start.x}%`)
        existingPlayer.style.setProperty('--actor-y', `${start.y}%`)
        existingPlayer.dataset.actorX = String(start.x)
        existingPlayer.dataset.actorY = String(start.y)
      }
      layer.querySelector('[data-actor-id="player"]')?.replaceWith(existingPlayer)
      if (changedScene) clearPlayerLook()
    }
    renderedPlayerRevision = playerRevision
    layoutActors()
    if (reducedMotion) {
      layer.querySelectorAll('.is-walking').forEach((actor) => actor.classList.remove('is-walking'))
      return
    }
    sceneActors.filter((actor) => actor.route).forEach((actor) => {
      const actorElement = layer.querySelector(`[data-actor-id="${actor.id}"]`)
      if (!actorElement) return
      const outbound = normalizeFacing(directionToTarget(actor, actor.route))
      const inbound = normalizeFacing(directionToTarget(actor.route, actor))
      let headingOutbound = true
      const updateHeading = (event) => {
        if (event.target !== actorElement || event.animationName !== 'hub-actor-route') return
        if (actor.route.loop) headingOutbound = !headingOutbound
        const facing = actor.route.loop && !headingOutbound
          ? inbound
          : normalizeFacing(actor.route.arrivalFacing || outbound)
        const action = actor.route.loop ? actor.route.action : actor.route.arrivalAction
        const figure = actorElement.querySelector('.char2-character, .painted-actor-sprite')
        figure?.replaceWith(document.createRange().createContextualFragment(actorVisualMarkup(actor, {
          facing,
          lookDirection: facing,
          motion: actor.route.loop ? 'walk' : actor.motion,
          action,
        })))
        actorElement.dataset.actorFacing = facing
        actorElement.dataset.look = facing
        actorElement.dataset.actorAction = classToken(action, 'none')
        if (!actor.route.loop) actorElement.classList.remove('is-walking')
      }
      if (actor.route.loop) actorElement.addEventListener('animationiteration', updateHeading)
      else actorElement.addEventListener('animationend', updateHeading, { once: true })
    })
  }

  function normalizeFacing(direction) {
    return direction === 'forward' ? 'down-right' : direction
  }

  function renderPlayerFigure({ facing, lookDirection, motion = 'idle', action = '' } = {}) {
    const player = layer.querySelector('[data-actor-id="player"]')
    if (!player) return
    const nextFacing = normalizeFacing(facing || player.dataset.actorFacing || 'down-right')
    const nextLook = normalizeFacing(lookDirection || player.dataset.look || nextFacing)
    const figure = player.querySelector('.char2-character')
    figure?.replaceWith(document.createRange().createContextualFragment(actorFigureMarkup(playerAppearance, {
      id: 'actor-player',
      facing: nextFacing,
      lookDirection: nextLook,
      motion: reducedMotion ? 'idle' : motion,
      action,
    })))
    const paperDoll = player.querySelector('.painted-paper-doll')
    if (paperDoll) {
      const nextFigure = document.createRange().createContextualFragment(renderPaintedPaperDoll(playerProfile, playerAppearance, {
        id: paperDoll.dataset.paperDollId,
        className: 'hub-player-paper-doll',
        label: `${playerProfile.name || 'Player'} independently layered painted outfit`,
        lookDirection: nextLook,
      }))
      // Gaze does not change the clothes. Keep their loaded external images.
      for (const depth of ['back', 'front']) {
        const selector = `.painted-paper-doll__head--${depth}`
        const head = nextFigure.querySelector(selector)
        if (head) paperDoll.querySelector(selector)?.replaceWith(head)
      }
    }
    player.dataset.actorFacing = nextFacing
    player.dataset.look = nextLook
  }

  function movePlayerTo(x, y, duration = null) {
    const player = layer.querySelector('[data-actor-id="player"]')
    if (!player) return 0
    const safeX = Math.min(96, Math.max(4, numberOr(x, 50)))
    const safeY = Math.min(91, Math.max(18, numberOr(y, 82)))
    const origin = { x: numberOr(player.dataset.actorX, 50), y: numberOr(player.dataset.actorY, 82) }
    const distance = Math.hypot(safeX - origin.x, (safeY - origin.y) * 1.35)
    const requestedDuration = Number(duration)
    const hasRequestedDuration = duration != null && Number.isFinite(requestedDuration)
    const automaticDuration = distance < .5 ? 0 : Math.round(Math.max(620, Math.min(1800, distance * 42)))
    const delay = reducedMotion ? 0 : hasRequestedDuration ? Math.max(0, requestedDuration) : automaticDuration
    const moveSequence = ++playerMoveSequence
    const facing = normalizeFacing(directionToTarget(
      origin,
      { x: safeX, y: safeY },
    ))
    renderPlayerFigure({ facing, lookDirection: facing, motion: delay ? 'walk' : 'idle' })
    player.classList.toggle('is-player-moving', Boolean(delay))
    player.style.transitionDuration = `${delay}ms`
    player.style.setProperty('--actor-walk-cycle', `${walkCycleForRoute(origin, { x: safeX, y: safeY }, Math.max(.1, delay / 1000))}s`)
    player.style.left = `${safeX}%`
    player.style.top = `${safeY}%`
    player.dataset.actorX = String(safeX)
    player.dataset.actorY = String(safeY)
    if (delay) window.setTimeout(() => {
      if (moveSequence !== playerMoveSequence) return
      const currentPlayer = layer.querySelector('[data-actor-id="player"]')
      currentPlayer?.classList.remove('is-player-moving')
      renderPlayerFigure({
        facing: currentPlayer?.dataset.actorFacing || facing,
        lookDirection: currentPlayer?.dataset.look || facing,
        motion: 'idle',
      })
    }, delay)
    else renderPlayerFigure({ facing, lookDirection: facing, motion: 'idle' })
    return delay
  }

  function clearPlayerLook() {
    const player = layer.querySelector('[data-actor-id="player"]')
    if (!player) return
    Array.from(player.classList)
      .filter((className) => className.startsWith('is-looking-'))
      .forEach((className) => player.classList.remove(className))
    const facing = player.dataset.actorFacing || 'down-right'
    player.dataset.look = facing
    renderPlayerFigure({ facing, lookDirection: facing })
  }

  function lookPlayerAt(x, y) {
    const player = layer.querySelector('[data-actor-id="player"]')
    if (!player) return 'forward'
    clearPlayerLook()
    const direction = directionToTarget(
      { x: player.dataset.actorX, y: player.dataset.actorY },
      { x, y },
    )
    const lookDirection = normalizeFacing(direction)
    if (direction !== 'forward') player.classList.add(`is-looking-${direction}`)
    player.dataset.look = lookDirection
    renderPlayerFigure({
      facing: player.dataset.actorFacing || 'down-right',
      lookDirection,
      motion: player.classList.contains('is-player-moving') ? 'walk' : 'idle',
    })
    return direction
  }

  function add(targetSceneId, actor) {
    const collection = additions.get(targetSceneId) || []
    const normalized = normalizeActor(actor, `visitor-${collection.length + 1}`)
    collection.push(normalized)
    additions.set(targetSceneId, collection)
    if (sceneId === targetSceneId) render(sceneId)
    return () => {
      const current = additions.get(targetSceneId) || []
      additions.set(targetSceneId, current.filter((item) => item.id !== normalized.id))
      if (sceneId === targetSceneId) render(sceneId)
    }
  }

  function setGroup(groupId, entries = []) {
    const id = String(groupId || 'dynamic')
    const relevant = (groups.get(id) || []).some(entry => entry.sceneId === sceneId)
      || entries.some(entry => entry.sceneId === sceneId)
    groups.set(id, entries.map((entry) => Object.freeze({
      sceneId: String(entry.sceneId || ''),
      actor: Object.freeze({ ...(entry.actor || {}) }),
    })))
    if (sceneId && relevant) render(sceneId)
  }

  function setPlayerAppearance(appearance = {}) {
    playerRevision += 1
    playerAppearance = { ...playerAppearance, ...appearance }
    if (sceneId) render(sceneId)
  }

  function setPlayerLocation(location) {
    if(!location?.sceneId) return
    playerLocations.set(location.sceneId,{x:location.x,y:location.y,sessionScale:location.sessionScale || 1})
    if(sceneId!==location.sceneId) return
    const element=layer.querySelector('[data-actor-id="player"]')
    if(element) {
      element.style.left=`${location.x}%`;element.style.top=`${location.y}%`
      element.dataset.actorX=String(location.x);element.dataset.actorY=String(location.y)
    }
    layoutActors()
  }

  function setPlayerCharacter(state = {}) {
    playerRevision += 1
    const character = state?.profile ? createCharacterState(state) : createCharacterState({ profile: state })
    playerAppearance = { ...characterToActorAppearance(character) }
    playerName = character.profile.name || DEFAULT_PLAYER.name
    playerProfile = character.profile
    if (sceneId) render(sceneId)
  }

  return Object.freeze({
    render,
    movePlayerTo,
    lookPlayerAt,
    clearPlayerLook,
    add,
    setGroup,
    setPlayerAppearance,
    setPlayerCharacter,
    setPlayerLocation,
    snapshot: () => Object.freeze({
      sceneId,
      actors: sceneId ? actorsForScene(sceneId).map((actor) => Object.freeze({ ...actor })) : [],
    }),
  })
}
