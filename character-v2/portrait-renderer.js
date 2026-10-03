const OUTLINE = '#3b2928'
let portraitSequence = 0

function safeToken(value, fallback = 'default') {
  const token = String(value || fallback).toLowerCase().replace(/[^a-z0-9-]/g, '')
  return token || fallback
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function validColor(value, fallback) {
  return /^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value) : fallback
}

function channels(color) {
  const hex = validColor(color, '#777777').slice(1)
  return [0, 2, 4].map((index) => Number.parseInt(hex.slice(index, index + 2), 16))
}

function mix(color, target, amount) {
  const from = channels(color)
  const to = channels(target)
  const values = from.map((channel, index) => Math.round(channel + (to[index] - channel) * amount))
  return `#${values.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

function gazeOffset(direction = 'down-right') {
  const values = {
    left: [-5, 0], right: [5, 0], up: [0, -5], down: [0, 4],
    'up-left': [-4, -4], 'up-right': [4, -4], 'down-left': [-4, 3], 'down-right': [4, 3],
  }
  return values[direction] || [0, 0]
}

function facePath(shape) {
  const paths = {
    'soft-round': 'M128 126Q132 61 208 53Q286 58 294 126L286 205Q276 273 211 289Q148 277 132 211Z',
    oval: 'M132 122Q138 58 210 51Q282 58 290 124L282 211Q269 281 210 295Q151 279 137 211Z',
    heart: 'M127 125Q134 57 210 52Q287 58 294 126L283 206Q272 251 210 292Q149 253 134 208Z',
    square: 'M126 124Q136 58 210 52Q284 58 295 126L290 216Q278 273 249 287L170 287Q140 270 131 215Z',
    long: 'M136 118Q144 55 210 50Q277 57 285 120L280 220Q266 296 210 309Q153 296 140 219Z',
    diamond: 'M135 116Q149 57 210 51Q272 57 286 117L296 185Q278 258 210 294Q143 258 126 184Z',
  }
  return paths[shape] || paths['soft-round']
}

function fabricPattern(id, color, accent, pattern) {
  let marks = ''
  if (['stripe', 'pinstripe'].includes(pattern)) marks = `<path d="M0 0V72M18 0V72M36 0V72M54 0V72M72 0V72" stroke="${accent}" stroke-width="${pattern === 'stripe' ? 5 : 1.8}" opacity=".42"/>`
  if (pattern === 'check') marks = `<path d="M0 0V72M18 0V72M36 0V72M54 0V72M72 0V72M0 0H72M0 18H72M0 36H72M0 54H72M0 72H72" stroke="${accent}" stroke-width="3" opacity=".3"/>`
  if (pattern === 'denim') marks = `<path d="M-12 20L20-12M0 40L40 0M18 58L58 18M40 72L72 40M60 72L72 60" stroke="${accent}" stroke-width="2" opacity=".2"/>`
  if (pattern === 'floral') marks = `<g fill="${accent}" opacity=".6"><circle cx="14" cy="17" r="4"/><circle cx="49" cy="40" r="5"/><circle cx="66" cy="9" r="3"/></g><path d="M14 17q8 13 3 29M49 40q10 8 12 21" fill="none" stroke="${mix(accent, '#31543e', .45)}" stroke-width="2" opacity=".5"/>`
  if (pattern === 'cable') marks = `<path d="M9 0q17 9 0 18t0 18t0 18t0 18M45 0q17 9 0 18t0 18t0 18t0 18" fill="none" stroke="${accent}" stroke-width="5" opacity=".25"/>`
  if (pattern === 'herringbone') marks = `<path d="M0 8l18 9 18-9 18 9 18-9M0 35l18 9 18-9 18 9 18-9M0 62l18 9 18-9 18 9 18-9" fill="none" stroke="${accent}" stroke-width="3" opacity=".3"/>`
  return `<pattern id="${id}" width="72" height="72" patternUnits="userSpaceOnUse"><rect width="72" height="72" fill="${color}"/>${marks}<rect width="72" height="72" filter="url(#${id}-grain)" opacity=".12"/></pattern>`
}

function definitions(id, a) {
  const skin = validColor(a.skin, '#b96f50')
  const hair = validColor(a.hair, '#422c29')
  const eye = validColor(a.eye, '#76663f')
  const top = validColor(a.top, '#efe1bd')
  const topAccent = validColor(a.topAccent, '#b94836')
  const apron = validColor(a.apron, '#417358')
  const apronAccent = validColor(a.apronAccent, '#f1ca68')
  return `<defs>
    <linearGradient id="${id}-skin" x1=".15" y1=".05" x2=".84" y2=".95"><stop stop-color="${mix(skin, '#fff6e8', .34)}"/><stop offset=".45" stop-color="${skin}"/><stop offset="1" stop-color="${mix(skin, '#5c302b', .28)}"/></linearGradient>
    <linearGradient id="${id}-hair" x1=".14" y1=".03" x2=".88" y2="1"><stop stop-color="${mix(hair, '#edb77b', .3)}"/><stop offset=".38" stop-color="${hair}"/><stop offset="1" stop-color="${mix(hair, '#140f13', .42)}"/></linearGradient>
    <radialGradient id="${id}-iris"><stop stop-color="${mix(eye, '#ffffff', .42)}"/><stop offset=".58" stop-color="${eye}"/><stop offset="1" stop-color="${mix(eye, '#171318', .48)}"/></radialGradient>
    <radialGradient id="${id}-blush"><stop stop-color="#df7569" stop-opacity=".46"/><stop offset="1" stop-color="#df7569" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id}-gold" x1="0" x2="1"><stop stop-color="#fff1ae"/><stop offset=".4" stop-color="#c68b31"/><stop offset=".72" stop-color="#ffeda0"/><stop offset="1" stop-color="#795126"/></linearGradient>
    <filter id="${id}-shadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="8" stdDeviation="7" flood-color="#31201d" flood-opacity=".26"/></filter>
    <filter id="${id}-top-grain" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="3" seed="7"/><feBlend in="SourceGraphic" mode="soft-light"/></filter>
    <filter id="${id}-apron-grain" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".55" numOctaves="3" seed="12"/><feBlend in="SourceGraphic" mode="soft-light"/></filter>
    ${fabricPattern(`${id}-top`, top, topAccent, a.topPattern || 'solid')}
    ${fabricPattern(`${id}-apron`, apron, apronAccent, a.apronPattern || 'solid')}
  </defs>`
}

function curlClusters(id, a, variant = 'full') {
  const fill = `url(#${id}-hair)`
  const highlight = mix(a.hair, '#efb270', .38)
  const circles = variant === 'full'
    ? [[123,105,35],[151,72,38],[190,58,42],[231,64,41],[267,91,36],[290,128,33],[111,146,32],[111,186,30],[292,174,31],[281,213,29],[132,228,29]]
    : [[150,78,30],[185,61,34],[222,62,35],[258,84,31],[275,116,28],[139,112,28]]
  return `<g fill="${fill}" stroke="${OUTLINE}" stroke-width="4.5">${circles.map(([x,y,r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g><path d="M137 91q15-28 36-4t35-7 37 5 31 19M120 142q19-24 38-2m88-47q25 8 30 31" fill="none" stroke="${highlight}" stroke-width="5" stroke-linecap="round" opacity=".5"/>`
}

function hairBack(id, a) {
  const style = a.hairStyleId || a.hairStyle || 'ponytail'
  const fill = `url(#${id}-hair)`
  const stroke = `stroke="${OUTLINE}" stroke-width="5" stroke-linejoin="round"`
  if (['buzz', 'crop', 'side-part'].includes(style)) return ''
  if (['curls', 'curly-top', 'afro', 'twists'].includes(style)) return curlClusters(id, a, style === 'curly-top' ? 'top' : 'full')
  if (['bun', 'top-knot', 'braided-bun', 'loc-bun'].includes(style)) {
    const y = style === 'top-knot' ? 42 : 67
    return `<circle cx="255" cy="${y}" r="45" fill="${fill}" ${stroke}/><path d="M230 ${y - 12}q28-25 52 3M232 ${y + 4}q28-17 50 7M244 ${y - 33}q17 17 25 41" fill="none" stroke="${mix(a.hair, '#efb270', .38)}" stroke-width="5" stroke-linecap="round" opacity=".52"/>`
  }
  if (['ponytail', 'high-pony', 'braided-pony', 'loc-pony'].includes(style)) {
    const high = style === 'high-pony'
    return `<g class="char3-hair-tail"><path d="M264 ${high ? 77 : 111}q84 19 70 121-9 68-58 108 17-69-20-107-28-29-14-84Z" fill="${fill}" ${stroke}/><path d="M275 ${high ? 98 : 128}q42 35 28 102M289 ${high ? 107 : 139}q24 45 9 92M265 ${high ? 84 : 116}q25 5 44 23" fill="none" stroke="${mix(a.hair, '#efb270', .38)}" stroke-width="5" stroke-linecap="round" opacity=".48"/></g>`
  }
  return `<path d="M112 105Q127 33 211 30Q297 38 309 121L301 280Q260 329 212 314Q155 330 109 276Z" fill="${fill}" ${stroke}/><path d="M140 75q68-48 130 3M125 122q56-48 119-32M126 174q67-38 149 3M139 230q63-25 127 1" fill="none" stroke="${mix(a.hair, '#efb270', .36)}" stroke-width="5" stroke-linecap="round" opacity=".42"/>`
}

function hairFront(id, a) {
  const style = a.hairStyleId || a.hairStyle || 'ponytail'
  const fill = `url(#${id}-hair)`
  const highlight = mix(a.hair, '#efb270', .4)
  const dark = mix(a.hair, '#160f16', .38)
  if (style === 'buzz') return `<path d="M131 127Q139 66 209 59Q277 67 288 126q-28-25-61-26-42 27-91 19Z" fill="${fill}" stroke="${OUTLINE}" stroke-width="5"/><path d="M149 91q60-31 117 9" fill="none" stroke="${highlight}" stroke-width="4" opacity=".5"/>`
  if (['crop', 'side-part'].includes(style)) return `<path d="M126 127Q134 57 207 49Q281 56 294 124q-26-25-62-26-37 28-101 20Z" fill="${fill}" stroke="${OUTLINE}" stroke-width="5"/><path d="M142 91q45-36 100-23m-74 16q22 2 48-23m-1 13q27 3 51 23" fill="none" stroke="${highlight}" stroke-width="5" stroke-linecap="round" opacity=".52"/><path d="M131 112q33 3 76-31" fill="none" stroke="${dark}" stroke-width="4" opacity=".45"/>`
  if (['curls', 'curly-top', 'afro', 'twists'].includes(style)) return `<path d="M126 125Q134 57 207 50Q281 57 294 124q-27-20-55-22-22 23-51 4-24 22-56 11Z" fill="${fill}" stroke="${OUTLINE}" stroke-width="5"/><path d="M135 101q15-29 34-6t35-9 34 6 36 5" fill="none" stroke="${highlight}" stroke-width="7" stroke-linecap="round" opacity=".6"/>`
  const sideLocks = ['bob', 'shag', 'shoulder-waves', 'loc-bob', 'braided-bob'].includes(style)
    ? `<path d="M128 112q-22 83 14 154l31-48-19-111Zm161 1q20 75-13 153l-31-50 18-111Z" fill="${fill}" stroke="${OUTLINE}" stroke-width="5"/><path d="M137 142q-3 57 18 98m124-99q3 55-19 99" fill="none" stroke="${highlight}" stroke-width="4" opacity=".5"/>`
    : `<path d="M131 112q-10 51 9 92l25-42-10-57Zm157 3q10 47-9 88l-24-41 9-55Z" fill="${fill}" stroke="${OUTLINE}" stroke-width="5"/>`
  return `${sideLocks}<path d="M126 125Q134 57 208 50Q282 57 294 124q-29-26-63-27-37 29-100 19Z" fill="${fill}" stroke="${OUTLINE}" stroke-width="5"/><path d="M144 88q53-39 107-14 23 10 34 31M155 97q30-24 65-29M229 72q29 6 45 28" fill="none" stroke="${highlight}" stroke-width="5" stroke-linecap="round" opacity=".5"/>`
}

function browMarkup(a) {
  const style = a.browStyle || 'soft'
  const width = { fine: 4, soft: 5.5, straight: 6, arched: 5.5, full: 8, bold: 9 }[style] || 5.5
  const left = style === 'straight' ? 'M158 136q18-3 34 1' : style === 'arched' ? 'M157 140q18-18 36-3' : 'M157 138q18-11 36 0'
  const right = style === 'straight' ? 'M227 136q18-3 34 1' : style === 'arched' ? 'M226 138q19-18 37-1' : 'M226 137q19-11 37 1'
  return `<path d="${left}${right}" fill="none" stroke="${mix(a.hair, '#171217', .35)}" stroke-width="${width}" stroke-linecap="round"/>`
}

function eyeMarkup(id, a, lookDirection) {
  const shape = a.eyeShape || 'almond'
  const config = {
    almond: [20, 11, 0], round: [18, 14, 0], hooded: [21, 9, 1], upturned: [20, 10, -3], downturned: [20, 10, 3], 'deep-set': [19, 9, 0],
  }[shape] || [20, 11, 0]
  const [rx, ry, tilt] = config
  const [gx, gy] = gazeOffset(lookDirection)
  const eye = (cx, cy) => `<g transform="rotate(${tilt} ${cx} ${cy})"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fffaf0" stroke="${OUTLINE}" stroke-width="3"/><path d="M${cx - rx} ${cy}q${rx} -${ry * 1.35} ${rx * 2} 0" fill="none" stroke="${OUTLINE}" stroke-width="4.5" stroke-linecap="round"/><g transform="translate(${gx} ${gy})"><circle cx="${cx}" cy="${cy}" r="9" fill="url(#${id}-iris)" stroke="${OUTLINE}" stroke-width="2"/><circle cx="${cx}" cy="${cy + 1}" r="4" fill="#211a1b"/><circle cx="${cx - 3}" cy="${cy - 4}" r="2.8" fill="#fff"/><circle cx="${cx + 3}" cy="${cy + 4}" r="1.2" fill="#fff5d0"/></g></g>`
  return `${eye(177, 158)}${eye(244, 157)}`
}

function noseMarkup(a) {
  const color = mix(a.skin, '#63302d', .44)
  const paths = {
    button: 'M208 163q-7 28 2 34 11 7 23-2M213 198q8 5 17-1',
    straight: 'M212 160q-1 24 0 37 9 8 20-1M215 199q7 3 15-1',
    rounded: 'M210 161q-6 27 1 37 13 10 26-1M214 198q10 7 20-1',
    wide: 'M207 163q-6 26 2 34 14 10 31 0M209 198q7 7 13 0m7 0q6 7 12-1',
    aquiline: 'M210 160q7 16-1 34 7 10 22 4M215 200q7 3 15-1',
    upturned: 'M210 163q-5 24 2 31 10 4 20-3M214 195q8 7 17-1',
  }
  return `<path d="${paths[a.noseShape] || paths.button}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`
}

function mouthMarkup(a) {
  const style = a.mouthStyle || 'soft'
  const expression = a.faceId || a.face || 'bright'
  const lip = '#9e4650'
  if (expression === 'focused') return `<path d="M190 225q20 5 41-1" fill="none" stroke="${mix(lip, '#4d272b', .28)}" stroke-width="4" stroke-linecap="round"/>`
  if (expression === 'bright' || expression === 'confident') return `<path d="M187 219q23 24 49-3-13 31-49 3Z" fill="${lip}" stroke="${OUTLINE}" stroke-width="3"/><path d="M193 220q18 11 36-2" fill="none" stroke="#fff3e2" stroke-width="4" stroke-linecap="round"/><path d="M198 235q14 6 27-2" fill="none" stroke="#dc7478" stroke-width="2.5" stroke-linecap="round"/>`
  const widths = { full: 27, wide: 32, bowed: 24, fine: 20, 'crooked-smile': 27, soft: 24 }
  const width = widths[style] || 24
  const crooked = style === 'crooked-smile' ? 5 : 0
  return `<path d="M${211 - width} ${222 + crooked}q${width} 17 ${width * 2} -2-18 23-${width * 2} 2Z" fill="${lip}" stroke="${OUTLINE}" stroke-width="3"/><path d="M${196 - Math.max(0, width - 24)} ${224 + crooked}q18 9 35-2" fill="none" stroke="#ffd8c5" stroke-width="2.6" stroke-linecap="round"/>`
}

function complexionMarkup(a) {
  const detail = a.complexionDetail || (a.freckles ? 'freckles-soft' : 'none')
  if (detail === 'beauty-mark') return `<circle cx="260" cy="210" r="2.6" fill="${mix(a.skin, '#40201f', .62)}"/>`
  if (detail === 'rosy') return `<ellipse cx="156" cy="203" rx="34" ry="18" fill="url(#portrait-blush)"/><ellipse cx="267" cy="201" rx="34" ry="18" fill="url(#portrait-blush)"/>`
  if (detail === 'sun-kissed') return `<path d="M146 196q61 17 126-2" fill="none" stroke="${mix(a.skin, '#9d4c38', .36)}" stroke-width="11" stroke-linecap="round" opacity=".17"/>`
  if (!detail.startsWith('freckles') && !a.freckles) return ''
  const full = detail === 'freckles-full'
  const points = full
    ? [[149,190],[158,195],[167,191],[176,198],[186,193],[196,198],[208,193],[220,198],[232,192],[244,196],[255,190],[264,194],[172,205],[186,208],[237,205],[250,207]]
    : [[158,195],[169,198],[181,194],[241,194],[253,197],[264,192]]
  return `<g fill="${mix(a.skin, '#6c342d', .58)}" opacity=".72">${points.map(([x,y]) => `<circle cx="${x}" cy="${y}" r="1.8"/>`).join('')}</g>`
}

function facialHairMarkup(a) {
  const style = a.facialHair || 'none'
  if (style === 'none') return ''
  const hair = mix(a.hair, '#2b2020', .22)
  if (style === 'stubble') return `<path d="M155 211q17 72 57 75 46-4 61-76-12 65-61 69-47-4-57-68Z" fill="${hair}" opacity=".18"/>`
  const mustache = `<path d="M185 215q14-11 26 0 11-11 25 0-13 15-25 3-13 12-26-3Z" fill="${hair}" opacity=".92"/>`
  if (style === 'mustache') return mustache
  if (style === 'goatee') return `${mustache}<path d="M196 243q15 11 30-1l-6 34h-18Z" fill="${hair}" opacity=".9"/>`
  const full = style === 'full-beard'
  return `${mustache}<path d="M147 205q15 79 64 86 53-8 67-88l-14 65q-23 ${full ? 48 : 25}-53 ${full ? 52 : 30}-31-4-51-31-53-51Z" fill="${hair}" opacity="${full ? '.94' : '.76'}"/><path d="M165 233q44 27 91-2" fill="none" stroke="${mix(hair, '#ffffff', .25)}" stroke-width="3" opacity=".3"/>`
}

function topMarkup(id, a) {
  const cut = a.topCut || 'tee'
  const fill = `url(#${id}-top)`
  const accent = validColor(a.topAccent, '#b94836')
  const dark = mix(a.top, '#271d20', .28)
  const outer = ['jacket', 'chore-jacket', 'coat', 'cardigan', 'blazer', 'trucker-jacket', 'bomber-jacket'].some((token) => cut.includes(token))
  const sleeveless = ['waistcoat', 'tank', 'camisole', 'halter', 'shell-top', 'corset-top'].some((token) => cut.includes(token))
  return `<g class="char3-top">
    <path d="M68 521q8-117 74-151 31-17 54-19h29q29 3 57 19 65 36 73 151Z" fill="${fill}" stroke="${OUTLINE}" stroke-width="6" stroke-linejoin="round" filter="url(#${id}-shadow)"/>
    ${sleeveless ? `<path d="M142 372q-46 20-57 91m197-91q46 21 57 91" fill="none" stroke="${accent}" stroke-width="9"/>` : `<path d="M139 374q-29 12-47 48m191-48q29 12 46 48" fill="none" stroke="${mix(a.top, '#ffffff', .3)}" stroke-width="4" opacity=".6"/>`}
    ${outer ? `<path d="M176 356l34 49 35-49M210 400v121" fill="none" stroke="${accent}" stroke-width="5"/><path d="M119 461h62v39h-62m120-39h62v39h-62" fill="${mix(a.top, '#000000', .08)}" stroke="${accent}" stroke-width="3"/><g fill="url(#${id}-gold)" stroke="${OUTLINE}" stroke-width="1.5"><circle cx="211" cy="430" r="5"/><circle cx="211" cy="456" r="5"/><circle cx="211" cy="482" r="5"/></g>` : `<path d="M176 357q34 33 69 0" fill="none" stroke="${accent}" stroke-width="5"/><path d="M145 444q65 18 133-1M126 487q84 22 169-2" fill="none" stroke="${mix(a.top, '#ffffff', .4)}" stroke-width="3" opacity=".5"/>`}
  </g>`
}

function apronMarkup(id, a) {
  if (!a.hasApron) return ''
  const fill = `url(#${id}-apron)`
  const accent = validColor(a.apronAccent, '#f1ca68')
  return `<g class="char3-apron"><path d="M150 373l25-30m96 30-25-31" fill="none" stroke="${accent}" stroke-width="10" stroke-linecap="round"/><path d="M158 369q52 20 105 0l28 152H130Z" fill="${fill}" stroke="${OUTLINE}" stroke-width="6"/><path d="M164 389q46 15 94 0M143 497q68 19 136 0" fill="none" stroke="${mix(a.apron, '#ffffff', .42)}" stroke-width="3" opacity=".62"/><path d="M173 431q38 17 76 0l3 50q-42 21-82 0Z" fill="${mix(a.apron, '#000000', .08)}" stroke="${accent}" stroke-width="4"/><path d="M211 438v50" stroke="${mix(accent, '#ffffff', .25)}" stroke-width="2.5"/><path d="M151 404q60 20 119 0M140 510q73 20 145 0" fill="none" stroke="${accent}" stroke-width="2" stroke-dasharray="5 4" opacity=".8"/></g>`
}

function accessoryMarkup(id, a) {
  const accessories = Array.isArray(a.accessories) ? a.accessories : []
  const legacy = a.hasAccessory ? [{ zone: 'chest', cut: a.accessoryCut, palette: { primary: a.accessory, secondary: a.accessoryAccent } }] : []
  return [...accessories, ...legacy].map((item, index) => {
    const cut = item.cut || 'accessory'
    const primary = validColor(item.palette?.primary, validColor(a.accessory, '#775070'))
    const secondary = validColor(item.palette?.secondary, validColor(a.accessoryAccent, '#efc6d2'))
    if (item.zone === 'head' || ['beret', 'headband', 'bucket-hat'].includes(cut)) return `<g class="char3-accessory char3-accessory-head"><path d="M129 82q41-58 118-38 38 10 52 39-79-20-163 22Z" fill="${primary}" stroke="${OUTLINE}" stroke-width="6"/><path d="M208 43q5-17 18-20" stroke="${secondary}" stroke-width="6" stroke-linecap="round"/></g>`
    if (item.zone === 'neck' || ['scarf', 'necktie', 'bow-tie'].includes(cut)) return `<g class="char3-accessory char3-accessory-neck"><path d="M166 347q43 31 88-1l-15 43-29 11-30-11Z" fill="${primary}" stroke="${OUTLINE}" stroke-width="5"/><path d="M211 380l-25 74m25-74 30 72" stroke="${secondary}" stroke-width="9" stroke-linecap="round"/></g>`
    if (item.zone === 'shoulder') return `<g class="char3-accessory char3-accessory-shoulder"><path d="M116 372q76 34 177 147" fill="none" stroke="${primary}" stroke-width="15"/><path d="M257 456h89v65h-89Z" fill="${primary}" stroke="${OUTLINE}" stroke-width="5"/><path d="M277 455q4-34 25-34t25 34" fill="none" stroke="${secondary}" stroke-width="7"/></g>`
    return `<g class="char3-accessory char3-accessory-chest"><circle cx="272" cy="413" r="16" fill="url(#${id}-gold)" stroke="${OUTLINE}" stroke-width="4"/><path d="M272 400v26m-13-13h26" stroke="${secondary}" stroke-width="2.5"/></g>`
  }).join('')
}

export function renderCharacterPortraitSvg(appearance = {}, {
  id = `portrait-${++portraitSequence}`,
  label = 'Character portrait',
  lookDirection = 'down-right',
} = {}) {
  const safeId = safeToken(id, `portrait-${portraitSequence}`)
  const a = {
    skin: validColor(appearance.skin, '#b96f50'),
    hair: validColor(appearance.hair, '#422c29'),
    eye: validColor(appearance.eye, '#76663f'),
    top: validColor(appearance.top, '#efe1bd'),
    topAccent: validColor(appearance.topAccent, '#b94836'),
    apron: validColor(appearance.apron, '#417358'),
    apronAccent: validColor(appearance.apronAccent, '#f1ca68'),
    ...appearance,
  }
  return `<svg class="char3-portrait-svg" viewBox="0 0 420 540" role="img" aria-label="${escapeHtml(label)}" data-renderer="painted-portrait-v1" data-face-shape="${safeToken(a.faceShape, 'soft-round')}" data-hair-style="${safeToken(a.hairStyleId || a.hairStyle, 'ponytail')}" data-top-pattern="${safeToken(a.topPattern, 'solid')}">
    ${definitions(safeId, a)}
    <g class="char3-portrait" filter="url(#${safeId}-shadow)">
      ${hairBack(safeId, a)}
      ${topMarkup(safeId, a)}
      <path d="M179 276l-4 95q34 30 71 0l-5-98Z" fill="url(#${safeId}-skin)" stroke="${OUTLINE}" stroke-width="5"/>
      <path d="M173 323q38 25 76 0" fill="none" stroke="${mix(a.skin, '#64312e', .33)}" stroke-width="3" opacity=".45"/>
      <ellipse cx="132" cy="176" rx="24" ry="35" fill="url(#${safeId}-skin)" stroke="${OUTLINE}" stroke-width="5"/><ellipse cx="290" cy="176" rx="24" ry="35" fill="url(#${safeId}-skin)" stroke="${OUTLINE}" stroke-width="5"/>
      <path d="${facePath(a.faceShape)}" fill="url(#${safeId}-skin)" stroke="${OUTLINE}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M147 115q15-42 61-47 48 3 71 44" fill="none" stroke="${mix(a.skin, '#ffffff', .28)}" stroke-width="8" stroke-linecap="round" opacity=".25"/>
      <ellipse cx="156" cy="201" rx="34" ry="18" fill="url(#${safeId}-blush)"/><ellipse cx="267" cy="199" rx="34" ry="18" fill="url(#${safeId}-blush)"/>
      ${browMarkup(a)}
      ${eyeMarkup(safeId, a, lookDirection)}
      ${noseMarkup(a)}
      ${mouthMarkup(a)}
      ${complexionMarkup(a).replaceAll('portrait-blush', `${safeId}-blush`)}
      ${facialHairMarkup(a)}
      ${hairFront(safeId, a)}
      ${apronMarkup(safeId, a)}
      ${accessoryMarkup(safeId, a)}
    </g>
  </svg>`
}
