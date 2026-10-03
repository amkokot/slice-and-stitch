# Character and clothing system

The live character system is a layered illustrated puppet. It keeps clothing independent from anatomy, uses the same renderer for the player and NPCs, and is designed to preserve the warm, tactile detail of the pizza-making art at both creator and hub scale.

The full visual and migration rationale lives in [`character-redesign-v2.md`](./character-redesign-v2.md).

## Cartoon art v3 quality pass

The renderer now targets a more mature, feature-animation-inspired cartoon finish while retaining the `biped-v2` data contract. The quality reference is `assets/concepts/character-v3-cartoon-quality-target.png`.

Compared with the first vertical slice, the live art uses a smaller head-to-body ratio, longer legs, articulated forearm and hand groups, layered iris and pupil construction, lashes and mouth interiors, richer hair clumps, cel-shaded fabric, variable line weight, stitched seams, apron hardware, divided pockets, and constructed footwear. These are renderer improvements rather than flattened replacement sprites, so existing garments, directions, saves, and animation clips remain compatible.

## `biped-v2` rig

Every character shares stable logical bones for the root, torso, head, hair, left/right upper arms, left/right thighs, and left/right feet. Garments attach to those bones instead of replacing the character image.

The renderer supports eight gameplay headings:

- up, down, left, and right
- up-left, up-right, down-left, and down-right

Those headings select five authored view families—front, three-quarter, profile, back-three-quarter, and back—with safe mirroring for the opposite side. Eye focus is separate from body facing: a character can glance toward a conversation, task, or hotspot before committing to a full turn.

Motion is also independent from appearance. The current clip vocabulary is:

- `idle`: breathing, hair settling, and blinking
- `walk`: opposing arm/leg swing with a soft body bob
- `talk`: small head motion and expressive face timing
- `wave`: a one-arm gesture that does not disturb equipped garments
- `carry`: both hands stabilize around a carried prop

The pure clip sampler in `character-v2/animation.js` is useful for tests and future canvas export. The live SVG renderer uses the same bone names and CSS animation contract. Reduced-motion mode keeps a readable static pose.

## Garment contract

Clothes remain immutable records with:

- a slot: `top`, `bottom`, `apron`, `shoes`, or an accessory attachment
- cut, pattern, material, and primary/secondary colors
- compatible rig ID and attachment points
- quality, style tags, source, and optional crafting provenance

Each cut resolves to drawable parts in `character-v2/asset-registry.js`. For example, an apron is split into bib, skirt, pocket, and ties so it can follow torso motion without requiring a second body sprite. Re-equipping one garment changes only that slot.

The generated cotton-canvas material in `assets/characters-v2/materials/` supplies restrained weave detail. SVG gradients and painted line work remain responsible for form, so fabric still reads when characters are small.

Fashion completions continue to become wardrobe records through the existing adapter. Old `biped-v1` saves migrate to schema version 2; their body settings, outfit IDs, and crafted garment provenance are preserved.

## NPC clothing and identity

Named residents use authored v2 recipes. Procedural customers use `character-v2/npc-generator.js`, which derives a stable appearance from the NPC ID. Returning NPCs therefore keep their face, frame, hair, clothing cuts, and palette across renders while crowds still show meaningful variety.

`window.sliceAndStitchHub.actors.add()` accepts either a compact `appearance` override or a complete character state. Missing NPC details are filled deterministically rather than falling back to one generic visitor:

```js
window.sliceAndStitchHub.actors.add('street', {
  id: 'customer-104',
  name: 'Ari',
  role: 'customer',
  character: savedCharacterState,
  x: 8,
  y: 82,
  route: { x: 42, y: 82, duration: 9 },
})
```

Route walkers face the direction of travel and turn at each endpoint. Player movement updates body facing, while hotspot focus updates gaze independently.

## Working boundaries

Character-owned files are isolated under `character-v2/` plus `character-model.js`, `character-creator.*`, and `hub-actors.js`. Fashion catalogs and minigame controllers only exchange garment records with the character layer. This keeps new clothing, animation clips, and NPC art from requiring edits to the pizza or tailoring simulation.

Before adding an item, validate its manifest against the rig and preview it in at least front, profile, and back views. Before adding a clip, verify idle, walk, talk, and the new action with long hair, a long apron, a skirt, and reduced motion.
