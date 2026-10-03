# Character system v2 — art and implementation plan

## Decision summary

Replace the current CSS-shape characters with a layered 2D cutout puppet. One shared
rig drives the player and every NPC; body, face, hair, garments, accessories, and held
items remain independent drawable parts. Artwork is authored at high resolution with
the warm outlined, painted-material treatment already established by the pizza station.

The renderer should be a small, dependency-free SVG scene graph for the prototype. It
gives every limb a stable pivot, supports masks and texture layers, and can render at
both creator and hub scale without shipping an animation library. The same asset/data
contract can later be consumed by PixiJS, Spine, or Rive without changing saves or
garment records.

Do not extend the current `.hub-actor-*` CSS doll. Its color-variable contract is too
shallow to represent garment construction, and its walk animation moves the whole body
instead of articulated limbs.

## What the pizza assets establish

The reference target is the playable pizza art, especially `pizza-workstation-v4.png`,
`pizza-ingredients-v1.png`, `pizza-upgrade-atlas-v1.png`, and `kitchen-dough-atlas-v1.png`.

- Warm near-black/brown silhouettes, with the outer contour roughly twice the weight
  of internal construction lines.
- Painted local color rather than flat fills: each object carries a light side, a core
  shadow, small contact shadows, and restrained irregular brush texture.
- Material-specific detail. Dough is powdery and dimpled; wood has grain and wear;
  metal has hard highlights; oil and sauce have glossy highlights. Character art needs
  the equivalent distinction among skin, hair, denim, linen, knitwear, leather, and
  metal jewelry.
- Soft warm light from upper left, cool/neutral shadow edges, and a small grounded cast
  shadow. Lighting should stay consistent across interchangeable parts.
- Clear silhouettes survive downscaling. Fine texture supports the form but never
  carries the identity of an item by itself.
- Controlled variation. Repeated ingredients vary in rotation and painted marks while
  staying recognizably from one authored set. NPC parts should use the same principle.

At creator scale, a character should feel as carefully painted as an ingredient atlas.
At hub scale, the outline, value grouping, hairstyle, face direction, and outfit layers
must remain readable even when weave and stitch detail disappear.

## Required views and sizes

Use one canonical coordinate system with a `320 × 480` view box and the feet centered
at `(160, 448)`.

1. **Front** — direct conversations, reactions, portraits, and creator inspection.
2. **Front three-quarter** — creator default and most stationary NPC interactions.
3. **Profile** — left/right hub walking and side-on work animations.
4. **Back three-quarter** — diagonal travel away and cross-back garment readability.
5. **Back** — travel directly away and rear garment/hair inspection.

These five authored view families cover eight compass directions. Left and right variants
may share mirrored art only when a part is symmetrical. Garment manifests must be able to
provide an explicit opposite-side asset for lettering, brooches, asymmetric pockets,
side-swept hair, satchels, and held items.

Front three-quarter is the vertical-slice art gate. Profile comes next because a
convincing walk cannot be made from a front-facing paper doll. The full five-view contract
must exist in code from the beginning even while back-facing artwork is still using a
deliberate development fallback. Eye and head aim move within a view; the renderer should
not swap the whole body image for every small gaze change.

Master art should be authored at `2×` (`640 × 960` per composed frame). The creator may
display it around 360–520 CSS pixels tall; hub actors should normally display at 88–150
pixels tall. Build atlases from the same masters rather than maintaining separate
portrait and world artwork.

## Rig

Rig ID: `biped-v2`.

```text
root
└─ pelvis
   ├─ torso
   │  ├─ neck
   │  │  └─ head
   │  ├─ shoulder.l → upperArm.l → forearm.l → hand.l
   │  └─ shoulder.r → upperArm.r → forearm.r → hand.r
   ├─ thigh.l → calf.l → foot.l
   └─ thigh.r → calf.r → foot.r
```

Named attachment points that are not bones:

- `head.top`, `head.back`, `ear.l`, `ear.r`
- `neck.front`, `chest`, `lapel`, `waist.front`, `waist.back`
- `shoulder.l`, `shoulder.r`, `wrist.l`, `wrist.r`
- `hand.l.grip`, `hand.r.grip`
- `hip.l`, `hip.r`, `foot.l`, `foot.r`

Body frames alter bone lengths and widths through a small proportion profile; they do
not select a different skeleton or animation set. Clamp profiles so garment art remains
within its tested deformation range.

```js
{
  compact: { torsoY: 0.94, legY: 0.88, shoulderX: 0.96 },
  average: { torsoY: 1.00, legY: 1.00, shoulderX: 1.00 },
  tall:    { torsoY: 1.04, legY: 1.13, shoulderX: 0.98 },
  broad:   { torsoY: 1.00, legY: 0.98, shoulderX: 1.12 },
}
```

The renderer composes parts at named bones and pivots. Garments inherit the transforms
of the body regions they cover, so every outfit automatically follows every animation.

## Stable draw order

The order must be explicit rather than inferred from garment slot names:

1. ground shadow
2. rear hair and rear head accessories
3. rear arm and rear sleeve
4. rear leg, rear bottom piece, rear shoe
5. torso base / undershirt
6. front leg, front bottom piece, front shoe
7. neck and head base
8. face features and expression overlays
9. front hair
10. front torso garment
11. front arm and front sleeve
12. apron/pinafore pieces
13. neck/chest/head accessories
14. held item and interaction effects

An apron is not a single rectangle: it may provide bib, skirt, straps, pocket, and tie
parts at different depths. A top with sleeves provides torso, rear-sleeve, and
front-sleeve artwork. Trousers provide a hip piece and independent leg pieces. Shoes
provide one piece per foot.

## Art asset contract

Keep artwork separate from gameplay/catalog metadata. A garment record says what an
item is; a visual manifest says how that item is drawn.

```js
{
  id: 'tomato-apron',
  rig: 'biped-v2',
  slot: 'apron',
  cut: 'service-apron',
  views: {
    threeQuarter: {
      parts: [
        { id: 'strap.back', bone: 'torso', layer: 3, asset: 'strap-back' },
        { id: 'bib', bone: 'torso', layer: 12, asset: 'bib' },
        { id: 'skirt', bone: 'pelvis', layer: 12, asset: 'skirt' },
        { id: 'tie', bone: 'pelvis', layer: 13, asset: 'tie' },
      ],
    },
    profile: { parts: [] },
  },
  paletteChannels: {
    primary: '#b94836',
    secondary: '#f8dfae',
    hardware: '#d4a04e',
  },
  material: 'cotton-canvas',
  occludes: [],
}
```

Each drawable part has:

- a transparent RGBA color plate;
- an optional grayscale palette mask for player-selected colors;
- a non-tinted detail plate containing outlines, seams, highlights, texture, and wear;
- a pivot and local bounds in manifest data;
- optional clip/matte data where skin or an under-layer must be hidden.

For the first pass, SVG paths may supply the silhouette and masks while small tiled
paint textures supply grain, weave, hair strands, and highlight breakup. Once an art
workflow is stable, the exact same parts can be exported as raster atlas regions.

Never recolor a finished flattened PNG with a blanket CSS filter. Tint only the authored
palette mask and composite the detail plate above it; this protects warm outlines,
highlights, embroidery, and buttons.

### Suggested folder layout

```text
assets/characters-v2/
  rig/
    biped-v2.json
    animation-clips.json
  body/
    skin-base.svg
    hands.svg
  faces/
    face-bright.svg
    face-soft.svg
    face-focused.svg
    expressions.svg
  hair/
    ponytail.svg
    curls.svg
    ...
  garments/
    cream-work-tee/
      manifest.js
      three-quarter.svg
      profile.svg
    tomato-apron/
      ...
  materials/
    cotton-canvas.png
    denim.png
    linen.png
    knit.png
    leather.png
  atlases/
    characters-v2@2x.png
    characters-v2@2x.json
```

## Character and garment data

Use schema version 2, but keep persistence semantic and renderer-agnostic.

```js
{
  schemaVersion: 2,
  profile: {
    id: 'player',
    name: 'Mia',
    rig: 'biped-v2',
    body: { frame: 'average', skinTone: 'warm-medium' },
    face: {
      shape: 'soft-round',
      brows: 'gentle',
      eyes: 'almond',
      eyeColor: 'hazel',
      nose: 'button',
      mouth: 'bright',
      freckles: 'soft',
    },
    hair: { style: 'ponytail', color: 'espresso' },
    equipped: {
      top: 'cream-work-tee',
      bottom: 'denim-trousers',
      apron: 'house-apron',
      shoes: 'canvas-sneakers',
      accessoryHead: null,
      accessoryNeck: null,
      accessoryBody: null,
    },
  },
  wardrobe: [],
  customGarments: [],
}
```

The v1-to-v2 migration maps the existing `frame`, `skinTone`, `hairStyle`, `hairColor`,
`eyeColor`, `face`, `freckles`, and five equipped slots without discarding any wardrobe
or provenance data. Old `accessory` items are routed by their attachment point (`head`,
`neck`, `chest`, or `shoulder`). Persist the migrated state only after it validates.

Garments keep the existing economy fields—quality, price/value, tags, set ID, source,
customization, and provenance. Add only rendering references and material information.
Fashion should not need to know how a sleeve is split into puppet pieces.

## Animation contract

Animation clips belong to the rig, not to a character or outfit.

Direction is composed from separate state instead of being baked into a monolithic clip:

- `facing`: the eight-way direction of the chest/pelvis, driven by movement or a sustained
  interaction target;
- `gazeTarget`: a scene point or actor followed by the eyes and head without necessarily
  turning the body;
- `locomotion`: idle, walk, hurry, or stop;
- `action`: talk, wave, carry, serve, cook, sew, react, and other upper/full-body work;
- `expression`: blink, smile, concern, delight, impatience, and tasting reactions.

The current `directionToTarget()` behavior should remain as a compatible semantic API,
but v2 routes its result into a facing controller. That controller:

1. converts a target vector to eight compass directions;
2. uses angular hysteresis and a short dwell before changing view, preventing jitter near
   diagonal boundaries;
3. lets the eyes lead, then the head, then the upper torso as the target moves farther
   from the current forward axis;
4. requests a planted-foot `turn-45`, `turn-90`, or `turn-180` transition when the target
   moves outside the safe glance cone;
5. switches the artwork view at the least visible point in the turn rather than popping
   instantly between front, profile, and back art.

Movement normally owns body facing while gaze is free to follow a nearby hotspot or
speaker. A sustained target behind the character requests a body turn. Priority is:
critical task target, dialogue partner, player-selected hotspot, ambient NPC glance, then
the character's forward direction. Clearing a target blends back to forward instead of
snapping.

Initial clips:

- `idle-a` / `idle-b`: asymmetric breathing, small weight shift, occasional head tilt;
- `blink`: short additive face clip with randomized safe interval;
- `eye-dart` / `look`: additive eye and head aim used by hotspot interactions;
- `walk` / `stop`: pelvis travel, opposing arm/leg swing, planted feet, and stabilized
  head, evaluated in the active view;
- `turn-45` / `turn-90` / `turn-180`: directional transitions with stable foot contact;
- `talk` / `listen`: face, head, and restrained hand-gesture loops;
- `wave` / `point`: one-shot social and guidance gestures;
- `carry`: upper-body override for plates, fabric bolts, parcels, and folded clothes;
- `give` / `receive` / `serve`: paired interaction clips with named hand targets;
- `stir`, `knead`, `top-pizza`, `cut`, `sew`, `press`, and `fold`: role/task loops built
  as action overrides on the same rig;
- `admire`, `impatient`, `surprised`, `taste`, and `celebrate`: short reactions combining
  an expression with a body gesture.

Store keyframes as JSON transforms (`x`, `y`, `rotation`, `scaleX`, `scaleY`) against
bone names. The blend stack is base locomotion, directional turn, action override,
additive gaze, additive expression, then secondary cloth/hair motion. Each higher layer
must declare the bones it owns so, for example, a walking character can look at a player
while carrying a plate without three clips fighting over the neck or hands. Keep animation
deterministic when a seed is provided so a crowd does not blink, glance, turn, and shift
in sync.

Cloth motion in v2 should be limited and authored: ponytail tip, apron tie, skirt hem,
and scarf tail may lag their parent rotation by a clamped amount. Do not introduce a
general physics engine for the vertical slice.

Reduced-motion mode keeps facing and gaze semantics but snaps to stable authored poses,
uses an infrequent blink, omits secondary motion, and navigates instantly.

## Character creator redesign

The creator should feel like an illustrated fitting room, not a settings form.

### Layout

- Large mirror/portrait stage on the left (or top on phones), using the actual v2
  renderer at creator resolution.
- Compact tabs: **Body**, **Face**, **Hair**, **Clothes**, **Details**.
- A horizontal filmstrip or two-column grid of illustrated thumbnails. Thumbnails are
  small renders of the actual option, not abstract color-only buttons.
- Material/color controls appear after an item is selected so silhouette choice remains
  primary.
- Persistent controls for front/side/back view, zoom, idle/walk preview, undo, randomize,
  and save/done.
- Outfit summary and set bonus information stay in Clothes, not beside body anatomy.

### Behavior

- All changes are previewed immediately in one draft state.
- `Done` commits the draft once; `Cancel` restores the opening snapshot.
- Undo/redo covers the current creator session.
- Randomize uses compatible curated combinations and a seed; it does not make every
  field independently random.
- Unsupported garment/view pairs show the previous compatible item and an authoring
  diagnostic in development builds, never a broken silhouette to players.
- Keyboard focus, labels, contrast, target sizes, and reduced motion remain first-class.

## NPCs are character recipes, not a second renderer

Every NPC uses the same `CharacterProfile`, asset registry, rig, renderer, and animation
controller as the player. NPC definitions add only role and behavior:

```js
{
  id: 'mara',
  role: 'shopkeeper',
  character: { preset: 'mara-v2', equipped: { /* garment IDs */ } },
  behavior: { idle: 'fold-fabric', greeting: 'wave', walkSpeed: 0.85 },
  dialoguePortrait: { expression: 'warm' },
}
```

Crowd NPCs are generated from a deterministic seed plus role-aware constraints:

- choose a body/face/hair recipe;
- choose a coherent palette family;
- choose compatible owned/built-in garments by style tags;
- enforce silhouette variety among adjacent actors;
- prevent duplicate hero hair/outfit combinations in one scene;
- bias restaurant staff toward washable workwear and customers toward the current trend;
- cache the resolved recipe so revisiting a room does not change a person's identity.

Named NPCs use hand-authored recipes and distinctive silhouette anchors. Generated
customers may use the same item catalog, including approved player-crafted garments.

## Module boundary

Build v2 beside the active prototype first:

```text
character-v2/
  schema.js              save normalization and v1 migration
  rig.js                 bones, attachments, proportion profiles
  asset-registry.js      visual manifests and fallbacks
  renderer.js            SVG scene graph and layer composition
  animation.js           clip player and additive tracks
  npc-generator.js       seeded character recipes
  creator.js             draft/commit creator controller
  creator.css            isolated `char2-` styles
```

Do not import fashion UI or minigame runtime into these modules. They accept garment
records through the existing catalog boundary and emit a normalized character snapshot.

Keep integration adapters thin:

- `characterToActorAppearance()` becomes a deprecated v1 adapter during migration.
- `createActorDirector()` receives a renderer factory instead of generating figure
  markup itself.
- Fashion completion continues to produce garment records; the asset registry chooses
  a cut template and applies the selected material/palette/customization.
- The creator mounts into the existing wardrobe drawer at first. A later interface pass
  can move it without changing character state or rendering.

## Implementation sequence

### 0. Freeze and protect the boundary

- Record hashes/timestamps of `game.js`, `hub.js`, `hub.css`, `index.html`,
  `fashion-catalog.js`, and shared styles before integration.
- Add all initial work under `character-v2/` and `assets/characters-v2/`.
- Avoid editing the files currently being changed by the fashion/interface work until
  that work lands. Re-read before every integration patch.

### 1. Art vertical slice

- Produce one average-frame character in front three-quarter and profile views.
- Include two skin tones, one detailed face, ponytail hair, cream tee, denim trousers,
  house apron, tomato apron, and canvas sneakers.
- Demonstrate idle, blink, and walk with both apron choices.
- Review at 480 px and 96 px tall next to the pizza workstation.
- Do not scale production until this passes the visual-quality gate.

### 2. Renderer and rig

- Implement bone transforms, stable draw order, palette-mask compositing, mirroring,
  view selection, and static fallback.
- Add isolated renderer tests for missing parts, z-order, deterministic IDs, and body
  proportion profiles.
- Add facing-controller tests for all eight directions, angular hysteresis, target
  priority, gaze-without-turn, sustained body turns, and clearing a look target.
- Add a development contact sheet that renders all current garment combinations.

### 3. Creator

- Implement draft/commit/cancel and undo/redo.
- Replace abstract controls with rendered option thumbnails.
- Add facing and motion preview controls.
- Migrate v1 local saves in memory and cover the migration with tests.

### 4. NPC generation

- Port named NPCs to v2 presets.
- Add seeded crowd generation and role-aware outfit rules.
- Render a stress scene with at least 24 actors and check for repeated combinations,
  clipping, z-order failures, synchronized animation, gaze jitter, and actors looking at
  the wrong conversation or task target.

### 5. Integration

- Re-read the concurrently edited files and make the smallest adapter patch possible.
- Replace hub markup only after the v2 renderer works in its isolated harness.
- Keep v1 loading for one schema cycle; remove the old CSS doll only after creator,
  hub, and shift customers all use v2.

### 6. Production expansion

- Complete front, profile, back-three-quarter, and back art for starter garments.
- Add all catalog cuts and material treatments.
- Add talking, greeting, carrying, cooking, tailoring, and reaction clips.
- Generate stable portrait crops from the live character recipe rather than storing
  separate portraits that can drift from the worn outfit.

## Acceptance gates

### Visual

- At creator size, skin, hair, denim, cotton, knit, leather, and metal read as different
  materials through authored light, texture, and edge treatment.
- Characters share the pizza art's warm contour, highlight direction, and value range.
- At 96 px tall, face direction, hair silhouette, top/bottom/apron separation, and shoe
  contact remain legible.
- There are no flat CSS rectangles visible in the final figure.

### Modularity

- Swapping any one garment changes only that garment's drawable parts.
- One idle/walk clip works across all starter body frames and every starter outfit.
- Sleeves, trouser legs, shoes, apron ties, hair pieces, and accessories follow their
  assigned joints without bespoke animation per item.
- Player and NPC recipes render through the same public function.
- All eight look directions resolve without rapid view flipping; nearby targets use
  eyes/head, while targets behind the character produce an intentional body turn.
- Locomotion, gaze, expression, and an upper-body action can play together without
  double-transforming a joint or breaking a garment attachment.

### Reliability

- Existing wardrobe IDs, crafted-garment provenance, and set bonuses survive migration.
- Missing artwork has a deliberate silhouette fallback and logs one useful development
  warning.
- Deterministic NPC seeds reproduce the same person and outfit.
- Creator cancellation cannot mutate the persisted character.

### Performance and accessibility

- Target 60 fps with 24 hub actors on a school Chromebook; creator animation must not
  allocate new DOM nodes every frame.
- Atlases are lazy-loaded by direction/scene and decoded once.
- Reduced-motion behavior is tested.
- Creator controls are fully keyboard reachable and do not rely on color alone.

## First implementation checkpoint

The first checkpoint is deliberately narrow: a single polished v2 character, two apron
choices, front three-quarter idle/blink, profile walk, eight-way look-target demo,
front-to-profile turn, and one generated NPC, all rendered from the same rig and garment
records in an isolated harness. If that small slice does not visually belong beside the
pizza station, revise the art pipeline before authoring more faces, hair, or clothes.
