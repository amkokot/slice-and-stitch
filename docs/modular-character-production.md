# Modular painted character production contract

The wardrobe is authored once for a single canonical body rig. Character
presets do not own copies of garments.

## Runtime composition

Layers are registered to a 1024 × 1536 canvas and keep their source pixels at
every display size. The required order is:

1. rear hair
2. skin body and appendages
3. face/head and neck
4. optional bare feet
5. bottom
6. shoes (replaces bare feet)
7. top
8. outerwear
9. apron
10. front hair and accessories

Feet, long rear hair, and other mutually exclusive anatomy regions are
replacement layers, not overlays. This prevents duplicate toes, hair passing
through collars, or old pixels showing around a new piece.

## What a preset owns

A preset is an anonymous visual recipe containing only:

- a straight-on registered head/face frame with a shared neck anchor;
- a registered hair treatment (flattened into the current high-detail preset
  topper, split into rear/front animation layers when directional frames ship);
- a skin palette id;
- optional complexion and facial-hair overlays;
- small anchor corrections within strict limits.

The body silhouette, pose, clothing anchors, and garment images are shared.
Changing preset must therefore leave every equipped item id untouched.

All creator presets use the canonical forward gaze. Directional and expression
variants are animation states derived from that preset; they are not mixed into
the forward-facing creator catalogue.

## Skin without per-preset renders

Visible body skin is stored as a neutral painted albedo plus a grayscale shade
map and alpha mask. At build time or on a canvas worker, a three-point palette
(shadow, midtone, highlight) replaces the neutral tones while preserving the
painted texture and line art. Hair is a physically separate image layer. Eyes,
brows, lashes, lips, facial hair, and accessories are protected feature pixels
inside the face mask. Head modules declare the same palette id as the continuous
body mask, so the neck, arms, hands, ankles, feet, and their painted contour
shadows always match without tinting identity features.

This is palette mapping, not a broad CSS hue filter. It is deterministic,
cacheable, and can export a PNG once per skin bucket if runtime canvas work is
undesirable.

The production `forward-head-atlas-v4` and `forward-head-atlas-v5` sources are
landmark-normalized around a shared eye line, face center, and neck width. Their generated extraction plates are
chroma-keyed and de-spilled by `tools/build-shared-identity-pilot.ps1`; the
script protects hair, eyes, brows, lips, facial hair, and ink before exporting
both full-canvas modular heads and square creator/in-world toppers. The real
creator deliberately collapses its fourteen swatches into the same light,
medium, and deep buckets used by the pre-rendered outfit bodies. This prevents
a more precise-looking face color from disagreeing with the exposed arms or
ankles in a clothing plate.

## Garment authoring

New garments are painted once on the canonical body, then extracted at the
same pixel coordinates. They must contain only garment pixels—never skin,
hands, legs, feet, or a replacement torso. Each item records its slot and any
occlusion flags, such as `replacesFeet` or `coversForearms`.

Open jackets occupy the outer slot above tops and below aprons. Their opening
must remain transparent, and rolled cuffs must end before visible skin rather
than baking forearms into the jacket. This allows one jacket file to survive
every skin palette and head choice.

Bare feet are an internal replacement plate, not a catalogue garment. Player
facing previews keep footwear equipped unless a finished barefoot asset is
explicitly needed. Closed shoes contain shoe and sock pixels only; the shared
body supplies the matching ankle tone.

Image generation is optional authoring assistance for a genuinely new garment
or head. It is not used to reproduce an existing garment across presets.

## Acceptance checks

- Collar follows the neck without covering the jaw.
- Head faces forward and meets the canonical neck anchor without a scale jump.
- Hair, eyes, brows, and lips are pixel-stable across skin palettes.
- Arm and hand contour pixels follow the selected skin palette.
- Shirt hem and waistband overlap intentionally.
- Apron straps sit over the top and under front hair.
- Trouser cuffs meet visible ankle skin without a gap.
- Shoes share the canonical ankle centers and neither expose toes nor crop tips.
- Closed shoes suppress the bare-feet layer.
- Switching presets changes identity and skin only.
- Switching clothing changes its declared slot only.
- The same source layers render correctly in creator, street, store, and vendor
  scenes without scene-specific pixel offsets.
