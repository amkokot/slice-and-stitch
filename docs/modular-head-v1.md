# Modular head v1

The editable player identity uses a Mii-like part recipe with a more illustrated finish. It does not use portrait crops, preset-specific offsets, or generated head atlases.

The `illustrated-v2` finish adds layered skin planes, eyelids, multi-ring irises, modeled noses and lips, dimensional brows, and multi-pass hair highlights without changing the underlying part contract. Its `humanized-v1` anatomy keeps the same Mii-like interchangeability while using a longer midface, narrower jaw, smaller eyes and ears, restrained mouths, and adult head-to-shoulder scale to sit naturally on the painted bodies. The `painted-curves-v1` organic pass replaces hard hair wedges and uniform sticker outlines with curved locks, asymmetric eye contours, softer skin-colored edges, modeled facial planes, and less regular feature strokes.

Eye silhouettes include almond, round, hooded, upturned, downturned, deep-set, monolid, tapered, narrow, and crescent forms. Each eye owns a stable clip path, so its independently animated iris and highlights can never cross the eyelids during directional gaze.

Curly hair uses four independent texture palettes—curly, coily, ringlets, and tight curls. Texture remains separate from cut and color, so the same curl treatment can be applied to compatible crops, long curls, waves, and afro silhouettes without duplicating a hairstyle asset.

Skin is intentionally bucketed to the three production painted-body plates. The authoritative highlight, base, warm transition, shadow, and outline colors are sampled from exposed neck and forearm pixels in those plates and exported by `character-v3/painted-outfit.js`. The SVG head consumes those exact palettes and adds only a clipped, deterministic brush texture. Hair and eye channels never participate in skin recoloring.

## Stable contract

- Rig id: `mii-plus-v1`
- Coordinate space: `0 0 240 240`
- Head center: `(120, 84)`
- Eye line: `87`
- Nose anchor: `(120, 120)`
- Mouth anchor: `(120, 143)`
- Jaw anchor: `(120, 167)`
- Neck/collar anchor: `(120, 190)`

Every part is authored against those anchors. Face shape may reshape the cheeks and jaw inside the safe silhouette, but it may not move the eyes, mouth, neck, or hair origin.

## Layer order

1. Rear hair
2. Painted outfit body
3. Shared neck
4. Ears
5. Face
6. Complexion
7. Eyes and gaze
8. Brows
9. Nose
10. Mouth
11. Facial hair
12. Front hair
13. Equipment accessories

The renderer can emit `back`, `front`, or `full` SVG layers. The creator and the in-world player use the same `back`/outfit/`front` sandwich so long hair can pass behind clothing without changing the clothing asset.

The creator preview uses one fixed-aspect composition wrapper. The painted body and modular head both scale from that wrapper, so responsive panel width can no longer change the jaw-to-collar relationship.

## Recipe fields

The saved character profile swaps these values independently:

- `skinTone`
- `faceShape`
- `eyeShape` and `eyeColor`
- `browStyle`
- `noseShape`
- `mouthStyle`
- `complexionDetail`
- `facialHair`
- `hairStyle`, `hairTexture`, and `hairColor`
- `face` for the resting expression

Clothes remain on the separate `biped-v2` outfit rig. A starting preset is only a bundle of these fields; it never supplies hidden artwork or geometry.

## Adding a part

Add a catalog option, add its path recipe in `character-v3/modular-head.js`, and keep it inside the shared anchors above. No preset-specific CSS or placement data is permitted. Add a renderer test proving that the new id resolves on `mii-plus-v1`.
