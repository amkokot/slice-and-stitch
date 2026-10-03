import { CHARACTER_V2_RIG_ID, directionToView, frameProfile, normalizeDirection } from './rig.js'
import { gazePose } from './facing.js'

const OUTLINE = '#3b2928'
let rendererSequence = 0

const DEFAULT_APPEARANCE = Object.freeze({
  skin: '#b96f50',
  hair: '#422c29',
  eye: '#76663f',
  frame: 'average',
  hairStyle: 'ponytail',
  hairStyleId: 'ponytail',
  hairTexture: 'wavy',
  face: 'bright',
  faceId: 'bright',
  faceShape: 'soft-round',
  eyeShape: 'almond',
  browStyle: 'soft',
  noseShape: 'button',
  mouthStyle: 'soft',
  complexionDetail: 'none',
  facialHair: 'none',
  freckles: true,
  top: '#efe1bd',
  topAccent: '#b94836',
  topCut: 'tee',
  topPattern: 'solid',
  bottom: '#607488',
  bottomAccent: '#d8a558',
  bottomCut: 'pants',
  bottomPattern: 'denim',
  apron: '#417358',
  apronAccent: '#f1ca68',
  apronCut: 'service-apron',
  apronPattern: 'solid',
  hasApron: true,
  shoes: '#efe3c7',
  shoeAccent: '#775070',
  shoeCut: 'sneakers',
  accessory: 'transparent',
  accessoryAccent: 'transparent',
  accessoryCut: 'none',
  hasAccessory: false,
  rig: CHARACTER_V2_RIG_ID,
})

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function safeToken(value, fallback = 'default') {
  const token = String(value || fallback).toLowerCase().replace(/[^a-z0-9-]/g, '')
  return token || fallback
}

function paint(value, fallback) {
  const color = String(value || '')
  return /^#[0-9a-f]{6}$/i.test(color) || color === 'transparent' ? color : fallback
}

function parseHex(color) {
  const source = paint(color, '#777777').slice(1)
  return [0, 2, 4].map((index) => Number.parseInt(source.slice(index, index + 2), 16))
}

function mix(color, target, amount) {
  if (color === 'transparent') return 'transparent'
  const from = parseHex(color)
  const to = parseHex(target)
  const value = from.map((channel, index) => Math.round(channel + (to[index] - channel) * amount))
  return `#${value.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

function appearanceState(appearance = {}) {
  return Object.freeze({
    ...DEFAULT_APPEARANCE,
    ...appearance,
    skin: paint(appearance.skin, DEFAULT_APPEARANCE.skin),
    hair: paint(appearance.hair, DEFAULT_APPEARANCE.hair),
    eye: paint(appearance.eye, DEFAULT_APPEARANCE.eye),
    top: paint(appearance.top, DEFAULT_APPEARANCE.top),
    topAccent: paint(appearance.topAccent, DEFAULT_APPEARANCE.topAccent),
    bottom: paint(appearance.bottom, DEFAULT_APPEARANCE.bottom),
    bottomAccent: paint(appearance.bottomAccent, DEFAULT_APPEARANCE.bottomAccent),
    apron: paint(appearance.apron, DEFAULT_APPEARANCE.apron),
    apronAccent: paint(appearance.apronAccent, DEFAULT_APPEARANCE.apronAccent),
    shoes: paint(appearance.shoes, DEFAULT_APPEARANCE.shoes),
    shoeAccent: paint(appearance.shoeAccent, DEFAULT_APPEARANCE.shoeAccent),
    accessory: paint(appearance.accessory, DEFAULT_APPEARANCE.accessory),
    accessoryAccent: paint(appearance.accessoryAccent, DEFAULT_APPEARANCE.accessoryAccent),
  })
}

function patternMarkup(id, primary, secondary, pattern, assetBase) {
  const canvasTexture = escapeHtml(`${assetBase}/materials/cotton-canvas-v1.png`)
  const patternId = `${id}-fabric-${safeToken(pattern, 'solid')}`
  let decorative = ''
  if (pattern === 'pinstripe' || pattern === 'stripe') {
    decorative = `<path d="M0 0V64M16 0V64M32 0V64M48 0V64M64 0V64" stroke="${secondary}" stroke-width="${pattern === 'stripe' ? 5 : 1.5}" opacity=".5"/>`
  } else if (pattern === 'check') {
    decorative = `<path d="M0 0V64M16 0V64M32 0V64M48 0V64M64 0V64M0 0H64M0 16H64M0 32H64M0 48H64M0 64H64" stroke="${secondary}" stroke-width="3" opacity=".36"/>`
  } else if (pattern === 'floral') {
    decorative = `<g fill="${secondary}" opacity=".64"><circle cx="14" cy="17" r="4"/><circle cx="44" cy="38" r="5"/><circle cx="61" cy="9" r="3"/></g><path d="M14 17q8 12 3 27M44 38q9 7 12 19" stroke="${mix(secondary, '#31543e', .45)}" stroke-width="2" fill="none" opacity=".55"/>`
  } else if (pattern === 'cable') {
    decorative = `<path d="M8 0q16 8 0 16t0 16t0 16t0 16M40 0q16 8 0 16t0 16t0 16t0 16" fill="none" stroke="${secondary}" stroke-width="5" opacity=".28"/>`
  } else if (pattern === 'herringbone') {
    decorative = `<path d="M0 8l16 8L32 8l16 8L64 8M0 32l16 8 16-8 16 8 16-8M0 56l16 8 16-8 16 8 16-8" fill="none" stroke="${secondary}" stroke-width="3" opacity=".34"/>`
  } else if (pattern === 'denim') {
    decorative = `<path d="M-12 12L12-12M0 32L32 0M16 48L48 16M32 64L64 32M52 64L64 52" stroke="${secondary}" stroke-width="2" opacity=".2"/>`
  }
  return `<linearGradient id="${patternId}-base" x1=".08" y1=".05" x2=".9" y2="1"><stop stop-color="${mix(primary, '#ffffff', .19)}"/><stop offset=".52" stop-color="${primary}"/><stop offset="1" stop-color="${mix(primary, '#241b22', .22)}"/></linearGradient>
  <pattern id="${patternId}" width="64" height="64" patternUnits="userSpaceOnUse">
    <rect width="64" height="64" fill="url(#${patternId}-base)"/>
    <image href="${canvasTexture}" width="64" height="64" preserveAspectRatio="xMidYMid slice" opacity=".22" style="mix-blend-mode:multiply"/>
    ${decorative}
  </pattern>`
}

function definitions(id, a, assetBase) {
  const skinLight = mix(a.skin, '#fff4df', .32)
  const skinShadow = mix(a.skin, '#512f2c', .28)
  const hairLight = mix(a.hair, '#d59a67', .28)
  const hairShadow = mix(a.hair, '#160f16', .36)
  const shoeShadow = mix(a.shoes, '#3b2b30', .28)
  return `<defs>
    <linearGradient id="${id}-skin" x1=".18" y1=".08" x2=".82" y2=".94"><stop stop-color="${skinLight}"/><stop offset=".48" stop-color="${a.skin}"/><stop offset="1" stop-color="${skinShadow}"/></linearGradient>
    <linearGradient id="${id}-hair" x1=".2" y1=".05" x2=".86" y2=".95"><stop stop-color="${hairLight}"/><stop offset=".42" stop-color="${a.hair}"/><stop offset="1" stop-color="${hairShadow}"/></linearGradient>
    <linearGradient id="${id}-shoe" x1=".12" y1=".05" x2=".82" y2="1"><stop stop-color="${mix(a.shoes, '#ffffff', .24)}"/><stop offset=".55" stop-color="${a.shoes}"/><stop offset="1" stop-color="${shoeShadow}"/></linearGradient>
    <radialGradient id="${id}-blush"><stop stop-color="#df7569" stop-opacity=".5"/><stop offset="1" stop-color="#df7569" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id}-iris"><stop offset="0" stop-color="${mix(a.eye, '#ffffff', .42)}"/><stop offset=".55" stop-color="${a.eye}"/><stop offset="1" stop-color="${mix(a.eye, '#171318', .42)}"/></radialGradient>
    <linearGradient id="${id}-metal" x1="0" x2="1"><stop stop-color="#fff0a8"/><stop offset=".45" stop-color="#c68b31"/><stop offset=".72" stop-color="#fff1a1"/><stop offset="1" stop-color="#795126"/></linearGradient>
    ${patternMarkup(`${id}-top`, a.top, a.topAccent, a.topPattern, assetBase)}
    ${patternMarkup(`${id}-bottom`, a.bottom, a.bottomAccent, a.bottomPattern, assetBase)}
    ${patternMarkup(`${id}-apron`, a.apron, a.apronAccent, a.apronPattern, assetBase)}
    <filter id="${id}-soft-shadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#39241f" flood-opacity=".28"/></filter>
  </defs>`
}

function hairBack(id, a, view) {
  const style = a.hairStyleId || a.hairStyle
  const fill = `url(#${id}-hair)`
  const common = `fill="${fill}" stroke="${OUTLINE}" stroke-width="5.5" stroke-linejoin="round"`
  if (['buzz', 'crop', 'side-part'].includes(style)) return ''
  if (['bun', 'top-knot', 'braided-bun', 'loc-bun'].includes(style)) return `<circle cx="205" cy="${style === 'top-knot' ? 55 : 69}" r="${style === 'top-knot' ? 30 : 27}" ${common}/><path d="M183 53q35-17 46 14M190 45q18 19 31 37${style.includes('braided') || style.includes('loc') ? 'M188 58q26 18 39-2M187 70q25 16 41-1' : ''}" fill="none" stroke="${mix(a.hair, '#f2bd7b', .4)}" stroke-width="4" stroke-linecap="round" opacity=".55"/>`
  if (['ponytail', 'high-pony', 'braided-pony', 'loc-pony'].includes(style)) return `<g class="char2-hair-tail" data-secondary-motion><path d="M205 ${style === 'high-pony' ? 82 : 101}q59 5 48 86-5 35-31 60 10-47-14-70-21-21-14-61Z" ${common}/><path d="M218 122q28 25 15 77M231 130q13 31 4 67M208 113q17 3 30 14${style.includes('braided') || style.includes('loc') ? 'M216 143q24 16 14 35t-7 38' : ''}" fill="none" stroke="${mix(a.hair, '#efb270', .4)}" stroke-width="4.2" stroke-linecap="round" opacity=".48"/><path d="M210 177q19 19 12 57" fill="none" stroke="${mix(a.hair, '#160f16', .38)}" stroke-width="5" stroke-linecap="round" opacity=".35"/></g>`
  if (['curly-top', 'curls', 'afro', 'twists'].includes(style)) return `<g ${common}>${[[112,92,25],[128,66,28],[160,58,31],[191,69,29],[211,100,26],[211,132,24],[106,126,25],[119,151,22],[201,157,23]].map(([x,y,r]) => `<circle cx="${x}" cy="${y}" r="${style === 'afro' ? r * 1.13 : r}"/>`).join('')}</g>`
  return `<path d="M101 83q14-55 66-53 58 2 67 62l-7 91-30 8-11-52-73 1-4 47-27-16Z" ${common}/><path d="M112 68q38-31 81-13 22 9 31 34M106 92q18-18 37-24" fill="none" stroke="${mix(a.hair, '#efb270', .38)}" stroke-width="4" stroke-linecap="round" opacity=".45"/>`
}

function hairFront(id, a, view) {
  const style = a.hairStyleId || a.hairStyle
  const fill = `url(#${id}-hair)`
  const highlight = mix(a.hair, '#efb373', .38)
  if (view === 'back' || view === 'back-three-quarter') {
    return `<path d="M100 102q6-73 65-75 65-2 73 74l-12 100q-31 24-66 17-36 5-58-22Z" fill="${fill}" stroke="${OUTLINE}" stroke-width="5.5"/>
      <path d="M121 70q29-25 70-13M116 94q42-29 87-5M121 125q38-20 82 2M132 158q30-13 62 2M138 186q24-8 49 1" fill="none" stroke="${highlight}" stroke-width="4" stroke-linecap="round" opacity=".48"/><path d="M106 111q18 9 22 77M218 103q-17 27-14 86" fill="none" stroke="${mix(a.hair, '#130e14', .42)}" stroke-width="4" opacity=".32"/>`
  }
  const cap = ['buzz', 'crop', 'side-part'].includes(style)
    ? 'M105 109q5-75 61-75 53 0 67 62-24-18-48-19-29 20-77 19Z'
    : 'M101 112q5-80 65-80 59 0 70 65-17-18-43-24-24 21-87 20Z'
  const side = ['bob', 'shag', 'shoulder-waves', 'loc-bob', 'braided-bob'].includes(style) ? `<path d="M103 94q-9 61 19 99l22-33-6-73Zm126 0q10 56-10 96l-24-29 3-75Z" fill="${fill}" stroke="${OUTLINE}" stroke-width="5.5"/><path d="M111 114q-2 39 16 63m93-64q4 35-12 61${style.includes('loc') || style.includes('braided') ? 'M121 105v70m89-71v68M132 99v74m67-72v72' : ''}" fill="none" stroke="${highlight}" stroke-width="3.5" stroke-linecap="round" opacity=".45"/>` : ''
  const curlHighlights = ['curly-top', 'curls', 'afro', 'twists'].includes(style)
      ? `<path d="M111 82q12-21 28-4t28-5 30 2 28 13" fill="none" stroke="${highlight}" stroke-width="6" stroke-linecap="round" opacity=".55"/>`
    : `<path d="M119 67q29-24 68-12 23 7 34 24M127 76q20-14 45-17M191 63q18 8 26 23" fill="none" stroke="${highlight}" stroke-width="4.5" stroke-linecap="round" opacity=".5"/>`
  const fringe = ['buzz', 'crop', 'side-part'].includes(style)
    ? `<path d="M110 89q12-28 29-13 13-27 31-8 18-20 37 2 12-5 24 15" fill="none" stroke="${mix(a.hair, '#160f16', .4)}" stroke-width="4" stroke-linecap="round" opacity=".55"/>`
    : `<path d="M107 92q21 7 45-13 17-15 36-15 23 1 43 25" fill="none" stroke="${mix(a.hair, '#160f16', .42)}" stroke-width="4" stroke-linecap="round" opacity=".42"/>`
  return `${side}<path d="${cap}" fill="${fill}" stroke="${OUTLINE}" stroke-width="5.5" stroke-linejoin="round"/>${curlHighlights}${fringe}`
}

function faceSilhouette(shape) {
  const paths = {
    'soft-round': 'M103 104q1-67 59-70 62-2 71 66l-7 40q-11 46-60 48-49 0-61-46Z',
    oval: 'M106 101q4-65 57-68 58 0 67 65l-6 48q-13 50-58 54-44-4-56-54Z',
    heart: 'M102 104q2-68 60-71 63 0 72 67l-9 43q-13 37-59 57-46-21-60-57Z',
    square: 'M101 103q3-68 61-70 63 0 72 67l-4 48q-10 39-36 49h-55q-27-11-35-50Z',
    long: 'M108 99q5-64 55-67 55 1 64 64l-3 54q-11 55-58 62-43-8-53-61Z',
    diamond: 'M109 96q9-61 54-64 50 2 62 62l10 38q-16 48-69 68-52-21-66-69Z',
  }
  return paths[shape] || paths['soft-round']
}

function complexionMarkup(a) {
  const detail = a.complexionDetail || (a.freckles ? 'freckles-soft' : 'none')
  if (detail === 'beauty-mark') return `<circle cx="202" cy="151" r="2.4" fill="${mix(a.skin, '#2d1919', .7)}"/>`
  if (detail === 'sun-kissed') return `<path d="M116 141q42 15 87-2" fill="none" stroke="${mix(a.skin, '#9d4c38', .46)}" stroke-width="8" stroke-linecap="round" opacity=".2"/>`
  if (!detail.startsWith('freckles') && !a.freckles) return ''
  const points = detail === 'freckles-full'
    ? [[117,141],[124,146],[132,143],[140,148],[147,143],[178,142],[186,146],[194,141],[201,145],[153,149],[169,148]]
    : [[119,142],[128,146],[138,143],[185,143],[194,146],[201,141]]
  return `<g fill="${mix(a.skin, '#71372f', .58)}" opacity=".78">${points.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6"/>`).join('')}</g>`
}

function facialHairMarkup(a) {
  const style = a.facialHair || 'none'
  if (style === 'none') return ''
  const fill = mix(a.hair, '#1b1517', .2)
  if (style === 'stubble') return `<path d="M127 151q9 37 39 40 35-5 43-43-12 35-43 38-29-3-39-35Z" fill="${fill}" opacity=".2"/>`
  const mustache = `<path d="M145 151q11-8 20 0 9-8 19 0-10 11-19 2-10 9-20-2Z" fill="${fill}"/>`
  if (style === 'mustache') return mustache
  if (style === 'goatee') return `${mustache}<path d="M154 169q11 7 22-1l-5 21h-13Z" fill="${fill}"/>`
  return `${mustache}<path d="M121 146q9 43 45 51 38-8 47-53-6 43-47 48-38-5-45-46Z" fill="${fill}" opacity="${style === 'full-beard' ? '.92' : '.7'}"/>`
}

function faceMarkup(id, a, gaze, view) {
  if (view === 'back' || view === 'back-three-quarter') return ''
  const eyeX = gaze.eyeX
  const eyeY = gaze.eyeY
  const eyeArc = { round: 17, hooded: 10, upturned: 14, downturned: 13, 'deep-set': 10, almond: 15 }[a.eyeShape] || 15
  const irisY = a.eyeShape === 'round' ? 9.6 : a.eyeShape === 'hooded' ? 7.2 : 8.8
  const browWidth = { fine: 3.2, soft: 5.2, straight: 5.5, arched: 5, full: 7, bold: 8 }[a.browStyle] || 5.2
  const browLift = a.browStyle === 'arched' ? 16 : a.browStyle === 'straight' ? 5 : 12
  if (view === 'profile') {
    return `<g class="char2-face">
      <path d="M179 106q18-10 33 3" fill="none" stroke="${mix(a.hair, '#211619', .46)}" stroke-width="5" stroke-linecap="round"/>
      <path d="M184 121q15-14 31 0-15 15-31 0Z" fill="#fffaf0" stroke="${OUTLINE}" stroke-width="2.6"/>
      <path d="M184 121q15-14 31 0" fill="none" stroke="${OUTLINE}" stroke-width="4.2" stroke-linecap="round"/>
      <path d="M212 118l6-4" stroke="${OUTLINE}" stroke-width="2.6" stroke-linecap="round"/>
      <g class="char2-gaze" style="transform:translate(${eyeX}px,${eyeY}px)"><circle cx="202" cy="121" r="7.5" fill="url(#${id}-iris)" stroke="${OUTLINE}" stroke-width="1.8"/><circle cx="202" cy="122" r="3.2" fill="#221b1c"/><circle cx="199" cy="118" r="2.2" fill="#fff"/><circle cx="204" cy="124" r="1" fill="#fff8dc"/></g>
      <path d="M222 129q14 7 2 15" fill="none" stroke="${mix(a.skin, '#63302d', .44)}" stroke-width="2.7" stroke-linecap="round"/>
      <path d="M216 145q5 2 10-1" fill="none" stroke="${mix(a.skin, '#5b2c2a', .5)}" stroke-width="2" stroke-linecap="round"/>
      <path d="M207 158q12 10 23-1-9 15-23 1Z" fill="#a34b52" stroke="${OUTLINE}" stroke-width="2.6" stroke-linejoin="round"/><path d="M211 160q8 4 15-1" stroke="#ffd9c7" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M179 151q4 7 8 10" fill="none" stroke="${mix(a.skin, '#6d3831', .32)}" stroke-width="2" opacity=".55"/>
    </g>`
  }
  const mouth = a.face === 'focused'
    ? `<path d="M147 158q14 4 28-1" fill="none" stroke="#7b3438" stroke-width="3.4" stroke-linecap="round"/>`
    : a.face === 'soft'
      ? `<path d="M146 156q15 11 30-2-12 17-30 2Z" fill="#a6494f" stroke="${OUTLINE}" stroke-width="2.5"/><path d="M152 158q9 5 18-1" stroke="#ffd8c4" stroke-width="2" stroke-linecap="round"/>`
      : `<path d="M145 153q17 20 34-3-8 27-34 3Z" fill="#963d49" stroke="${OUTLINE}" stroke-width="2.7"/><path d="M151 155q11 8 21-1" stroke="#fff3e3" stroke-width="3" stroke-linecap="round"/><path d="M153 167q10 4 18-2" stroke="#da6a70" stroke-width="2.3" stroke-linecap="round"/>`
  return `<g class="char2-face">
    <ellipse cx="124" cy="145" rx="25" ry="14" fill="url(#${id}-blush)"/><ellipse cx="195" cy="143" rx="25" ry="14" fill="url(#${id}-blush)"/>
    <path d="M116 109q17-${browLift} 33 1M173 107q18-${browLift} 34 2" fill="none" stroke="${mix(a.hair, '#211619', .46)}" stroke-width="${browWidth}" stroke-linecap="round"/>
    <path d="M116 124q15-${eyeArc} 33 0-17 ${eyeArc + 1}-33 0ZM172 122q16-${eyeArc} 34 0-17 ${eyeArc + 1}-34 0Z" fill="#fffaf0" stroke="${OUTLINE}" stroke-width="2.6"/>
    <path d="M116 124q15-${eyeArc} 33 0M172 122q16-${eyeArc} 34 0" fill="none" stroke="${OUTLINE}" stroke-width="4.3" stroke-linecap="round"/>
    <path d="M117 120l-6-4m94 2 6-5" stroke="${OUTLINE}" stroke-width="2.5" stroke-linecap="round"/>
    <g class="char2-gaze" style="transform:translate(${eyeX}px,${eyeY}px)"><ellipse cx="136" cy="124" rx="7.8" ry="${irisY}" fill="url(#${id}-iris)" stroke="${OUTLINE}" stroke-width="1.8"/><ellipse cx="190" cy="122" rx="7.8" ry="${irisY}" fill="url(#${id}-iris)" stroke="${OUTLINE}" stroke-width="1.8"/><circle cx="136" cy="125" r="3.3" fill="#211a1b"/><circle cx="190" cy="123" r="3.3" fill="#211a1b"/><circle cx="133" cy="120" r="2.2" fill="#fff"/><circle cx="187" cy="118" r="2.2" fill="#fff"/><circle cx="139" cy="127" r="1" fill="#fff6d4"/><circle cx="193" cy="125" r="1" fill="#fff6d4"/></g>
    <g class="char2-eyelids"><path d="M116 124q15-${eyeArc} 33 0M172 122q16-${eyeArc} 34 0" fill="none" stroke="${OUTLINE}" stroke-width="4"/></g>
    <path d="M159 126q-8 17 1 21 9 4 16-3" fill="none" stroke="${mix(a.skin, '#67342f', .43)}" stroke-width="2.8" stroke-linecap="round"/><path d="M165 147q5 2 10-2" fill="none" stroke="${mix(a.skin, '#572a28', .5)}" stroke-width="1.9" stroke-linecap="round"/>
    ${mouth}
    <path d="M154 175q12 5 24-2" fill="none" stroke="${mix(a.skin, '#6a3630', .38)}" stroke-width="1.8" opacity=".55"/>
    ${complexionMarkup(a)}
    ${facialHairMarkup(a)}
  </g>`
}

function topDetails(id, a, view) {
  const accent = a.topAccent
  const cut = a.topCut
  if (cut === 'jacket' || cut === 'chore-jacket' || cut === 'coat') {
    return `<path d="M158 184l-24 27 25 18 24-20-22-25" fill="${mix(a.top, '#ffffff', .11)}" stroke="${OUTLINE}" stroke-width="3"/><path d="M159 222v73" stroke="${mix(a.top, '#1b1519', .25)}" stroke-width="4"/><path d="M126 252h27v25h-27m42-25h27v25h-27" fill="${mix(a.top, '#000000', .07)}" stroke="${accent}" stroke-width="3.3"/><path d="M130 258h19m23 0h19M119 204q13 9 20 20m66-20q-13 8-20 20" fill="none" stroke="${mix(accent, '#ffffff', .25)}" stroke-width="2" stroke-dasharray="4 3" opacity=".85"/><g fill="url(#${id}-metal)" stroke="${OUTLINE}" stroke-width="1.7"><circle cx="161" cy="237" r="4.8"/><circle cx="161" cy="257" r="4.8"/><circle cx="161" cy="278" r="4.8"/></g>`
  }
  if (cut === 'cardigan') return `<path d="M159 185v111" stroke="${accent}" stroke-width="8"/><path d="M151 190q-18 22-25 48m41-48q17 20 26 46" fill="none" stroke="${mix(accent, '#ffffff', .28)}" stroke-width="2.4" stroke-dasharray="3 3"/><g fill="url(#${id}-metal)" stroke="${OUTLINE}" stroke-width="1.8"><circle cx="159" cy="218" r="4.7"/><circle cx="159" cy="241" r="4.7"/><circle cx="159" cy="264" r="4.7"/></g>`
  if (cut === 'waistcoat') return `<path d="M126 184l33 36 34-36M159 219v76" fill="none" stroke="${accent}" stroke-width="4"/><g fill="url(#${id}-metal)" stroke="${OUTLINE}" stroke-width="2"><circle cx="160" cy="239" r="4"/><circle cx="160" cy="258" r="4"/><circle cx="160" cy="277" r="4"/></g>`
  if (cut === 'blouse' || cut === 'oxford-shirt' || cut === 'camp-shirt') return `<path d="M134 184q25 25 51 0M159 199v94" fill="none" stroke="${accent}" stroke-width="3.7"/><path d="M142 224q17 8 34 0M128 287q31 9 63 0" fill="none" stroke="${mix(a.top, '#ffffff', .4)}" stroke-width="2.6" opacity=".68"/><g fill="url(#${id}-metal)" stroke="${OUTLINE}" stroke-width="1.4"><circle cx="159" cy="224" r="3.2"/><circle cx="159" cy="245" r="3.2"/><circle cx="159" cy="266" r="3.2"/></g>`
  return `<path d="M135 184q24 22 49 0" fill="none" stroke="${accent}" stroke-width="4"/><path d="M128 244q30 8 64-2M130 272q29 7 59-2M121 292q38 10 77-1" fill="none" stroke="${mix(a.top, '#ffffff', .4)}" stroke-width="2.4" opacity=".5"/><path d="M123 201q12 8 17 20m57-19q-11 9-16 20" fill="none" stroke="${mix(a.top, '#1b1519', .26)}" stroke-width="2" opacity=".45"/>`
}

function shoeMarkup(id, a, side, profile = false) {
  const x = side === 'left' ? 106 : 164
  const flip = side === 'left' ? -1 : 1
  if (profile) return `<g data-bone="foot.${side === 'left' ? 'l' : 'r'}" class="char2-shoe char2-shoe-${side}"><path d="M145 442q17-3 34 8l30 13q7 5 1 14l-67 1q-12-13 2-36Z" fill="url(#${id}-shoe)" stroke="${OUTLINE}" stroke-width="5.2"/><path d="M151 455h38M159 462h39" stroke="${a.shoeAccent}" stroke-width="3" stroke-linecap="round"/><path d="M183 449q10 8 19 12" stroke="${mix(a.shoes, '#ffffff', .42)}" stroke-width="2.5"/><path d="M145 473h65" stroke="#f7ecd3" stroke-width="7" stroke-linecap="round"/><path d="M146 477h63" stroke="${OUTLINE}" stroke-width="2.3"/></g>`
  return `<g data-bone="foot.${side === 'left' ? 'l' : 'r'}" class="char2-shoe char2-shoe-${side}" style="transform-origin:${side === 'left' ? 134 : 186}px 453px"><path d="M${x} 439q24-7 43 5l${flip * 13} 22q5 11-9 15h-55q-13-5-5-18Z" fill="url(#${id}-shoe)" stroke="${OUTLINE}" stroke-width="5.2"/><path d="M${x + 8} 452l31 6m-29 3 32 6" stroke="${a.shoeAccent}" stroke-width="3.2" stroke-linecap="round"/><g fill="url(#${id}-metal)" stroke="${OUTLINE}" stroke-width="1"><circle cx="${x + 12}" cy="452" r="2.2"/><circle cx="${x + 18}" cy="460" r="2.2"/><circle cx="${x + 31}" cy="456" r="2.2"/><circle cx="${x + 37}" cy="465" r="2.2"/></g><path d="M${x + 42} 446q9 8 13 17" fill="none" stroke="${mix(a.shoes, '#ffffff', .42)}" stroke-width="2.4"/><path d="M${x - 2} 474h58" stroke="#fbefd8" stroke-width="7" stroke-linecap="round"/><path d="M${x - 2} 478h58" stroke="${OUTLINE}" stroke-width="2.2"/></g>`
}

function accessoryMarkup(id, a, view) {
  if (!a.hasAccessory || a.accessoryCut === 'none') return ''
  if (a.accessoryCut === 'beret') return `<g class="char2-accessory" transform="translate(160 190) scale(.74) translate(-160 -190)"><path d="M105 61q33-42 91-22 24 8 32 30-55-15-117 14Z" fill="${a.accessory}" stroke="${OUTLINE}" stroke-width="5.5"/><path d="M165 36q4-12 13-14" stroke="${a.accessoryAccent}" stroke-width="5" stroke-linecap="round"/></g>`
  if (a.accessoryCut === 'brooch') return `<g class="char2-accessory"><circle cx="193" cy="222" r="12" fill="url(#${id}-metal)" stroke="${OUTLINE}" stroke-width="4"/><path d="M193 211v22m-11-11h22" stroke="${a.accessoryAccent}" stroke-width="2"/></g>`
  if (a.accessoryCut === 'satchel') return `<g class="char2-accessory"><path d="M120 183l96 151" stroke="${a.accessoryAccent}" stroke-width="12" stroke-linecap="round"/><path d="M184 301q31-8 54 11l-5 64q-30 12-61-4Z" fill="${a.accessory}" stroke="${OUTLINE}" stroke-width="6"/><path d="M174 326q28 13 61 1" stroke="${a.accessoryAccent}" stroke-width="4"/></g>`
  return `<g class="char2-accessory"><path d="M125 182q34 22 71 0l-7 26q-28 16-59 1Z" fill="${a.accessory}" stroke="${OUTLINE}" stroke-width="5"/><path d="M177 199q18 27 8 76l20-15q4-42-13-68Z" fill="${a.accessoryAccent}" stroke="${OUTLINE}" stroke-width="4"/></g>`
}

function apronMarkup(id, a) {
  if (!a.hasApron) return ''
  const fill = `url(#${id}-apron-fabric-${safeToken(a.apronPattern, 'solid')})`
  const long = ['pinafore', 'crossback-apron'].includes(a.apronCut)
  return `<g class="char2-apron">
    <path d="M126 196q33 17 68-1l-5 74 25 101q-52 28-108 0l25-101Z" fill="${fill}" stroke="${OUTLINE}" stroke-width="5.3" stroke-linejoin="round"/>
    <path d="M127 198q-4-19 15-24m51 21q5-18-13-23" fill="none" stroke="${a.apronAccent}" stroke-width="7" stroke-linecap="round"/>
    <g fill="url(#${id}-metal)" stroke="${OUTLINE}" stroke-width="1.4"><rect x="133" y="181" width="12" height="9" rx="2"/><rect x="178" y="179" width="12" height="9" rx="2"/></g>
    <path d="M128 273q33 15 64 0M111 361q50 18 97 0M130 204q29 13 61 0" fill="none" stroke="${mix(a.apron, '#ffffff', .4)}" stroke-width="2.3" opacity=".62"/>
    <path d="M136 298q25 12 49-1l1 38q-25 15-50 0Z" fill="${mix(a.apron, '#000000', .08)}" stroke="${a.apronAccent}" stroke-width="3.4"/>
    <path d="M160 302v39M146 310q15 8 29-1" fill="none" stroke="${mix(a.apronAccent, '#ffffff', .3)}" stroke-width="2.4"/>
    <path d="M119 353q42 18 84 0M128 282q31 12 63 0" fill="none" stroke="${a.apronAccent}" stroke-width="1.8" stroke-dasharray="4 3" opacity=".82"/>
    <path d="M126 278q-8 46-7 78m72-78q9 43 10 77" fill="none" stroke="${mix(a.apron, '#281d22', .3)}" stroke-width="2.6" opacity=".35"/>
    ${a.apronPattern === 'floral' ? `<g fill="${a.apronAccent}" stroke="${OUTLINE}" stroke-width="2"><circle cx="160" cy="238" r="9"/><circle cx="148" cy="235" r="7"/><circle cx="172" cy="235" r="7"/><circle cx="160" cy="225" r="7"/></g>` : `<path d="M151 231l9-9 9 9-9 10Z" fill="${a.apronAccent}" stroke="${OUTLINE}" stroke-width="3"/>`}
    ${long ? `<path d="M127 197L109 87m84 109 23-106" fill="none" stroke="${a.apronAccent}" stroke-width="7" opacity=".85"/>` : ''}
  </g>`
}

function threeQuarterBody(id, a, gaze) {
  const topFill = `url(#${id}-top-fabric-${safeToken(a.topPattern, 'solid')})`
  const bottomFill = `url(#${id}-bottom-fabric-${safeToken(a.bottomPattern, 'solid')})`
  const skinFill = `url(#${id}-skin)`
  const skirt = ['skirt', 'pleated-skirt', 'bias-skirt'].includes(a.bottomCut)
  return `
    <g class="char2-head-art" transform="translate(160 190) scale(.74) translate(-160 -190)">${hairBack(id, a, 'three-quarter')}</g>
    <g data-bone="thigh.r" class="char2-leg char2-leg-back" style="transform-origin:181px 290px"><path d="M162 278q27-10 43 8l2 154-45 2Z" fill="${bottomFill}" stroke="${OUTLINE}" stroke-width="5.4"/><path d="M179 300l6 128m-10-51q17 9 29 2m-39 52q20 7 40 0" fill="none" stroke="${mix(a.bottom, '#ffffff', .35)}" stroke-width="2.3" opacity=".52"/><path d="M199 294q-7 70 0 136" fill="none" stroke="${mix(a.bottom, '#171319', .28)}" stroke-width="2" opacity=".45"/>${shoeMarkup(id, a, 'right')}</g>
    <g data-bone="upper-arm.l" class="char2-arm char2-arm-back" style="transform-origin:112px 198px">
      <path d="M116 193q-24 0-30 24l1 31q18 8 39 2l12-30q0-22-22-27Z" fill="${topFill}" stroke="${OUTLINE}" stroke-width="5.2"/><path d="M88 245q18 9 37 3" fill="none" stroke="${a.topAccent}" stroke-width="2.2" stroke-dasharray="4 3" opacity=".8"/>
      <g data-bone="forearm.l" class="char2-forearm" style="transform-origin:101px 248px"><path d="M88 246q18 9 38 2l-8 54q-2 14-15 16l-9-1q-14-4-12-19Z" fill="${skinFill}" stroke="${OUTLINE}" stroke-width="5.4"/><path d="M89 269q13 7 30 3" fill="none" stroke="${mix(a.skin, '#ffffff', .42)}" stroke-width="2.8" opacity=".55"/>
        <g data-bone="hand.l" class="char2-hand"><path d="M82 297q15 6 36 4l1 16q0 15-13 21-16 3-24-9-6-10 0-32Z" fill="${skinFill}" stroke="${OUTLINE}" stroke-width="5.2"/><path d="M86 315q10 5 22 1m-20 9q9 4 18 0m6-18q3 13-3 23" fill="none" stroke="${mix(a.skin, '#64312e', .48)}" stroke-width="1.8" stroke-linecap="round"/></g>
      </g>
    </g>
    <g data-bone="thigh.l" class="char2-leg char2-leg-front" style="transform-origin:139px 290px"><path d="M118 277q29-12 51 6l-6 160-47-1Z" fill="${bottomFill}" stroke="${OUTLINE}" stroke-width="5.4"/><path d="M139 301l-4 129m-13-50q16 8 37 2m-40 49q21 7 42 0" fill="none" stroke="${mix(a.bottom, '#ffffff', .38)}" stroke-width="2.3" opacity=".55"/><path d="M124 290q8 64 1 139" fill="none" stroke="${mix(a.bottom, '#171319', .28)}" stroke-width="2" opacity=".42"/>${shoeMarkup(id, a, 'left')}</g>
    ${skirt ? `<path d="M111 275q47 16 99-1l22 136q-70 26-143 0Z" fill="${bottomFill}" stroke="${OUTLINE}" stroke-width="7"/><path d="M117 298q43 13 89-1M105 396q55 18 115 0" fill="none" stroke="${a.bottomAccent}" stroke-width="3" opacity=".58"/>` : `<path d="M112 272q47 15 97-1l-3 41q-47 15-91 0Z" fill="${bottomFill}" stroke="${OUTLINE}" stroke-width="6"/><path d="M160 281v28M123 291q37 10 76-1" stroke="${a.bottomAccent}" stroke-width="3" opacity=".55"/>`}
    <g data-bone="torso" class="char2-torso" style="transform-origin:160px 280px"><path d="M115 193q42-29 91-3 18 35 8 108-53 24-108 1-7-70 9-106Z" fill="${topFill}" stroke="${OUTLINE}" stroke-width="5.8" stroke-linejoin="round"/><path d="M119 207q12-10 24-12m58 10q-10-10-22-12" fill="none" stroke="${mix(a.top, '#ffffff', .46)}" stroke-width="3" stroke-linecap="round" opacity=".55"/><path d="M112 294q49 17 99 0" fill="none" stroke="${mix(a.top, '#1b1519', .3)}" stroke-width="2.2" opacity=".55"/>${topDetails(id, a, 'three-quarter')}</g>
    <path d="M143 169h35l7 28q-27 17-52 0Z" fill="${skinFill}" stroke="${OUTLINE}" stroke-width="6"/>
    <g data-bone="head" class="char2-head" style="transform-origin:160px 180px;--char2-head-rotation:${gaze.headRotation}deg">
      <g class="char2-head-art" transform="translate(160 190) scale(.74) translate(-160 -190)">
      <ellipse cx="103" cy="126" rx="17" ry="23" fill="${skinFill}" stroke="${OUTLINE}" stroke-width="6"/><ellipse cx="219" cy="124" rx="16" ry="22" fill="${skinFill}" stroke="${OUTLINE}" stroke-width="6"/>
      <path d="M101 124q8-12 16 1m101-3q8-11 15 1" fill="none" stroke="${mix(a.skin, '#64332e', .45)}" stroke-width="3" stroke-linecap="round"/>
      <path d="${faceSilhouette(a.faceShape)}" fill="${skinFill}" stroke="${OUTLINE}" stroke-width="7"/>
      <path d="M118 79q20-29 59-28 32 2 48 27" fill="none" stroke="${mix(a.skin, '#ffffff', .38)}" stroke-width="6" stroke-linecap="round" opacity=".42"/>
      ${faceMarkup(id, a, gaze, 'three-quarter')}
      ${hairFront(id, a, 'three-quarter')}
      </g>
    </g>
    ${apronMarkup(id, a)}
    <g data-bone="upper-arm.r" class="char2-arm char2-arm-front" style="transform-origin:208px 198px">
      <path d="M205 193q24-3 33 21l3 29q-18 11-38 7l-18-27q-2-22 20-30Z" fill="${topFill}" stroke="${OUTLINE}" stroke-width="5.2"/><path d="M202 246q19 9 38-2" fill="none" stroke="${a.topAccent}" stroke-width="2.2" stroke-dasharray="4 3" opacity=".8"/>
      <g data-bone="forearm.r" class="char2-forearm" style="transform-origin:222px 247px"><path d="M203 247q19 8 38-3l13 53q4 14-9 20l-9 1q-14-1-17-15Z" fill="${skinFill}" stroke="${OUTLINE}" stroke-width="5.4"/><path d="M211 271q16 7 31 1" fill="none" stroke="${mix(a.skin, '#ffffff', .42)}" stroke-width="2.8" opacity=".55"/>
        <g data-bone="hand.r" class="char2-hand"><path d="M220 301q18 5 34-5 7 21 1 31-7 13-23 11-13-5-13-20Z" fill="${skinFill}" stroke="${OUTLINE}" stroke-width="5.2"/><path d="M229 316q11 4 21-1m-18 10q9 3 17-2m-25-16q-2 13 5 23" fill="none" stroke="${mix(a.skin, '#64312e', .48)}" stroke-width="1.8" stroke-linecap="round"/></g>
      </g>
    </g>
    ${accessoryMarkup(id, a, 'three-quarter')}
  `
}

function profileBody(id, a, gaze) {
  const topFill = `url(#${id}-top-fabric-${safeToken(a.topPattern, 'solid')})`
  const bottomFill = `url(#${id}-bottom-fabric-${safeToken(a.bottomPattern, 'solid')})`
  const skinFill = `url(#${id}-skin)`
  return `
    <g class="char2-head-art" transform="translate(174 190) scale(.74) translate(-174 -190)">${hairBack(id, a, 'profile')}</g>
    <g data-bone="thigh.r" class="char2-leg char2-leg-back" style="transform-origin:164px 292px"><path d="M151 278q25-8 39 7l6 164-42 1Z" fill="${bottomFill}" stroke="${OUTLINE}" stroke-width="7"/><g data-bone="foot.r" class="char2-shoe char2-shoe-back" style="transform-origin:171px 453px"><path d="M151 441q24-5 40 9l31 13q9 7 0 15h-70q-11-15-1-37Z" fill="url(#${id}-shoe)" stroke="${OUTLINE}" stroke-width="7"/><path d="M160 474h62" stroke="#f7ecd3" stroke-width="7"/></g></g>
    <g data-bone="upper-arm.l" class="char2-arm char2-arm-back" style="transform-origin:145px 203px"><path d="M146 199q-23 8-22 34l9 91q5 23 27 20 22-6 14-31l-2-91q-3-26-26-23Z" fill="${skinFill}" stroke="${OUTLINE}" stroke-width="7"/><path d="M145 196q-22 7-20 36l4 24q20 5 39-3l6-31q-3-27-29-26Z" fill="${topFill}" stroke="${OUTLINE}" stroke-width="6"/></g>
    <g data-bone="thigh.l" class="char2-leg char2-leg-front" style="transform-origin:171px 292px"><path d="M158 277q28-7 44 9l7 159-46 5Z" fill="${bottomFill}" stroke="${OUTLINE}" stroke-width="7"/>${shoeMarkup(id, a, 'right', true)}</g>
    <path d="M143 273q35 11 67-3l4 45q-32 12-66 2Z" fill="${bottomFill}" stroke="${OUTLINE}" stroke-width="6"/>
    <g data-bone="torso" class="char2-torso" style="transform-origin:169px 280px"><path d="M135 190q42-22 72 6 20 43 8 106-34 21-71 1-17-62-9-113Z" fill="${topFill}" stroke="${OUTLINE}" stroke-width="7"/>${topDetails(id, a, 'profile')}</g>
    <path d="M158 169h32l6 30q-23 12-43-2Z" fill="${skinFill}" stroke="${OUTLINE}" stroke-width="6"/>
    <g data-bone="head" class="char2-head" style="transform-origin:174px 180px;--char2-head-rotation:${gaze.headRotation}deg">
      <g class="char2-head-art" transform="translate(174 190) scale(.74) translate(-174 -190)">
      <path d="M115 96q12-62 68-62 52 7 58 63l-4 25 17 13q5 7-11 14-12 43-54 44-48-2-68-38-20-35-6-59Z" fill="${skinFill}" stroke="${OUTLINE}" stroke-width="7" stroke-linejoin="round"/>
      ${faceMarkup(id, a, gaze, 'profile')}${hairFront(id, a, 'profile')}
      </g>
    </g>
    ${a.hasApron ? `<g class="char2-apron"><path d="M143 200q31 10 58-1l9 169q-34 17-65 0Z" fill="url(#${id}-apron-fabric-${safeToken(a.apronPattern, 'solid')})" stroke="${OUTLINE}" stroke-width="6"/><path d="M151 299h43v40h-43Z" fill="${mix(a.apron, '#000000', .08)}" stroke="${a.apronAccent}" stroke-width="4"/></g>` : ''}
    <g data-bone="upper-arm.r" class="char2-arm char2-arm-front" style="transform-origin:193px 204px"><path d="M192 199q23 5 23 31l8 91q-1 24-24 24-22-4-17-29l-13-88q-2-26 23-29Z" fill="${skinFill}" stroke="${OUTLINE}" stroke-width="7"/><path d="M192 197q24 4 23 34l-1 25q-18 8-39 1l-7-29q0-27 24-31Z" fill="${topFill}" stroke="${OUTLINE}" stroke-width="6"/></g>
    ${accessoryMarkup(id, a, 'profile')}
  `
}

function backBody(id, a, view) {
  const topFill = `url(#${id}-top-fabric-${safeToken(a.topPattern, 'solid')})`
  const bottomFill = `url(#${id}-bottom-fabric-${safeToken(a.bottomPattern, 'solid')})`
  const skinFill = `url(#${id}-skin)`
  return `
    <g class="char2-head-art" transform="translate(160 198) scale(.74) translate(-160 -198)">${hairBack(id, a, view)}</g>
    <g data-bone="thigh.r" class="char2-leg char2-leg-back" style="transform-origin:181px 290px"><path d="M160 281q25-9 45 6l3 157-46 0Z" fill="${bottomFill}" stroke="${OUTLINE}" stroke-width="7"/>${shoeMarkup(id, a, 'right')}</g>
    <g data-bone="thigh.l" class="char2-leg char2-leg-front" style="transform-origin:139px 290px"><path d="M115 283q23-12 48 3l-2 158-47-1Z" fill="${bottomFill}" stroke="${OUTLINE}" stroke-width="7"/>${shoeMarkup(id, a, 'left')}</g>
    <path d="M112 276q48 14 97-1l-2 39q-47 14-93 0Z" fill="${bottomFill}" stroke="${OUTLINE}" stroke-width="6"/>
    <g data-bone="upper-arm.l" class="char2-arm char2-arm-back"><path d="M116 195q-25 2-30 30l-8 88q1 24 25 25 21-4 20-29l14-85q2-26-21-29Z" fill="${skinFill}" stroke="${OUTLINE}" stroke-width="7"/></g>
    <g data-bone="torso" class="char2-torso"><path d="M111 194q48-31 99 0 15 45 4 109-53 22-108 0-11-64 5-109Z" fill="${topFill}" stroke="${OUTLINE}" stroke-width="7"/><path d="M126 211q34 13 69 0M119 280q42 15 84 0" fill="none" stroke="${mix(a.top, '#ffffff', .32)}" stroke-width="3" opacity=".45"/></g>
    <path d="M143 170h36l8 29q-27 14-54 0Z" fill="${skinFill}" stroke="${OUTLINE}" stroke-width="6"/>
    <g data-bone="head" class="char2-head"><g class="char2-head-art" transform="translate(160 198) scale(.74) translate(-160 -198)"><path d="M101 102q5-69 63-73 63 1 70 72l-5 58q-24 42-65 39-42 1-61-40Z" fill="${skinFill}" stroke="${OUTLINE}" stroke-width="7"/>${hairFront(id, a, view)}</g></g>
    ${a.hasApron ? `<g class="char2-apron"><path d="M127 198l-10-14m66 15 15-17M126 199q34 17 68 0l17 170q-51 25-101 0Z" fill="url(#${id}-apron-fabric-${safeToken(a.apronPattern, 'solid')})" stroke="${OUTLINE}" stroke-width="6"/><path d="M126 198l67 169m1-168-67 169" stroke="${a.apronAccent}" stroke-width="7" opacity=".7"/></g>` : ''}
    <g data-bone="upper-arm.r" class="char2-arm char2-arm-front"><path d="M204 195q24 2 31 28l12 87q1 24-22 28-23-1-24-27l-17-84q-4-26 20-32Z" fill="${skinFill}" stroke="${OUTLINE}" stroke-width="7"/></g>
    ${accessoryMarkup(id, a, view)}
  `
}

export function renderCharacterSvg(appearance = {}, {
  id = `char2-${++rendererSequence}`,
  label = 'Character',
  facing = 'down-right',
  lookDirection = facing,
  motion = 'idle',
  action = '',
  assetBase = 'assets/characters-v2',
  decorative = false,
} = {}) {
  const a = appearanceState(appearance)
  const safeId = safeToken(id, `char2-${rendererSequence}`)
  const direction = normalizeDirection(facing)
  const view = directionToView(direction)
  const gaze = gazePose(direction, lookDirection)
  const frame = frameProfile(a.frame)
  const body = view.family === 'profile'
    ? profileBody(safeId, a, gaze)
    : ['back', 'back-three-quarter'].includes(view.family)
      ? backBody(safeId, a, view.family)
      : threeQuarterBody(safeId, a, gaze)
  const mirror = view.mirrored ? 'translate(320 0) scale(-1 1)' : ''
  const heightScale = Math.max(.88, Math.min(1.12, Number(a.heightScale) || 1))
  const frameTransform = `translate(160 483) scale(${frame.shoulderX} ${frame.legY * heightScale}) translate(-160 -483)`
  return `<svg class="char2-svg" viewBox="0 0 320 520" role="${decorative ? 'presentation' : 'img'}" ${decorative ? 'aria-hidden="true"' : `aria-label="${escapeHtml(label)}"`} data-rig="${CHARACTER_V2_RIG_ID}" data-facing="${direction}" data-view="${view.family}" data-motion="${safeToken(motion, 'idle')}" data-action="${safeToken(action, 'none')}" data-face-shape="${safeToken(a.faceShape, 'soft-round')}" data-eye-shape="${safeToken(a.eyeShape, 'almond')}" data-hair-style="${safeToken(a.hairStyleId || a.hairStyle, 'ponytail')}">
    ${definitions(safeId, a, assetBase)}
    <ellipse class="char2-ground-shadow" cx="160" cy="487" rx="74" ry="13" fill="#3a2925" opacity=".23"/>
    <g class="char2-mirror" transform="${mirror}"><g class="char2-frame" transform="${frameTransform}"><g class="char2-rig" data-bone="root" filter="url(#${safeId}-soft-shadow)">${body}</g></g></g>
  </svg>`
}

export function renderCharacterMarkup(appearance = {}, options = {}) {
  const motion = safeToken(options.motion, 'idle')
  const action = safeToken(options.action, 'none')
  return `<span class="hub-actor-figure char2-character" data-char2-motion="${motion}" data-char2-action="${action}" aria-hidden="true">${renderCharacterSvg(appearance, { ...options, decorative: true, motion, action })}</span>`
}

export function renderGarmentThumbnail(garment = {}, { id = 'garment-preview' } = {}) {
  const primary = paint(garment.palette?.primary, '#775070')
  const secondary = paint(garment.palette?.secondary, '#efc6d2')
  const cut = safeToken(garment.cut, garment.slot || 'garment')
  const path = garment.slot === 'shoes'
    ? 'M25 62q20-8 34 5l22 10q9 5 1 14H24q-12-8 1-29Z'
    : garment.slot === 'bottom'
      ? 'M28 14h44l10 75H55L49 46 43 89H18Z'
      : garment.slot === 'accessory'
        ? 'M19 27q31-25 62 0L65 47q13 20 4 44H51q8-25-6-39Q33 66 29 91H11q11-42 8-64Z'
        : garment.slot === 'apron'
          ? 'M29 10h42l-4 29 18 52H15l18-52Z'
          : 'M28 12 8 29l16 24 7-8v47h38V45l7 8 16-24-20-17-14 18H42Z'
  return `<svg class="char2-garment-thumbnail" viewBox="0 0 100 100" aria-hidden="true" data-cut="${cut}"><path d="${path}" fill="${primary}" stroke="${OUTLINE}" stroke-width="5" stroke-linejoin="round"/><path d="M28 22q22 13 44 0M25 76q25 9 52 0" fill="none" stroke="${secondary}" stroke-width="4" opacity=".75"/></svg>`
}

