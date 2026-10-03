# Painted character system v3

## Art direction

The fashion studio is the visual source of truth. Characters use the same warm hand-painted finish, variable brown linework, tactile woven materials, adult feature-animation proportions, and constructed garment details as the tailor and boutique assets. Flat geometric puppet art is retained only as a technical fallback while painted attachments are authored.

Production reference sheets live in `assets/characters-v3/`:

- `cast-lineup-v1.png`: four signature-character quality examples.
- `hero-turnaround-v1.png`: front, three-quarter, profile, back-three-quarter, and back registration.
- `hero-wardrobe-v1.png`: one identity in five catalog-derived looks.
- `hero-expression-gaze-v1.png`: center/left/right/up/down gaze, blink, talk, and laugh.

## One character contract

Personal avatars, procedural NPCs, and bespoke signature characters serialize the same recipe:

1. Identity: name, pronouns, build, height, skin tone, face construction, complexion, facial hair, hair texture/style/color.
2. Equipment: core garments plus independent accessory anchors.
3. Presentation: resting expression, current body direction, independent gaze, action and locomotion state.
4. Provenance: player-made garment recipe, alteration, finish, quality, and catalog source.

Signature characters may add bespoke painted hair, face, or garment attachments, but do not get a separate animation or equipment API.

## Personal avatar range

`character-v2/identity-catalog.js` contains 122 authored choices across 16 fields:

- 6 body frames and 5 heights.
- 14 skin tones.
- 6 face shapes, 6 eye shapes, 8 eye colors, 6 brows, 6 noses, and 6 mouths.
- 6 complexion treatments and 6 facial-hair choices.
- 6 hair textures, 20 hairstyles, and 12 hair colors.
- 5 resting expressions and 4 pronoun presets.

Before clothing, these independent fields permit more than one trillion raw combinations. Hairstyles can declare compatible texture families; the creator still allows deliberate exceptions rather than gender-locking or body-locking any feature.

## Equipment and fashion coverage

Core garment slots:

- `top`
- `bottom`
- `apron`
- `shoes`

Stackable accessory anchors:

- `head`
- `neck`
- `chest`
- `shoulder`
- `waist`
- `hands`

The current fashion source provides 289 catalog garments, 107 craftable schematics, 26 alteration techniques, and 15 finishing techniques. `garmentVisualManifest()` maps every catalog cut to a five-view, bone-friendly part manifest. Known cuts use authored part lists; new cuts receive a safe inferred manifest from their slot and cut family rather than falling back to a flat color block.

Garment manifests retain:

- Cut and equipment zone.
- Front/back torso, sleeve, leg, skirt, strap, tie, pocket, closure, sole, and accessory pieces as applicable.
- Material family and palette channels.
- All five authored view families.
- Secondary-motion pieces such as skirt panels, scarf tails, bags, and apron ties.
- Alteration geometry, finish, accent color, and design direction.

## Direction and facial animation

Five painted view families produce eight directions by mirroring left/right three-quarter, profile, and back-three-quarter art. The body and gaze controllers remain independent.

The face layer owns:

- Pupil aim for eight look directions.
- Upper/lower lids and natural blink timing.
- Brows and cheek emotion.
- Mouth phonemes for talk plus authored reactions.
- Small head aim within the active body view; sustained extreme gaze can request a body turn.

The body rig owns idle, walk, carry, wave, talk support, service gestures, and task-specific actions. Loose hair and garment panels attach to secondary-motion bones.

## Procedural NPC generation

`generateNpcRecipe(seed, context)` is deterministic. The same seed, role, trend, and progression level always produce the same person and outfit.

Generation stages:

1. Select independent identity fields from the same personal-avatar catalog.
2. Respect texture-aware hairstyle compatibility while retaining broad variation.
3. Select actual fashion-catalog garments by slot and progression level.
4. Weight garments by role and current trend instead of assigning arbitrary colors.
5. Apply role-specific apron and accessory likelihoods.
6. Store behavior variation for idle pose, gesture choice, gaze patience, and walk tempo.

The role rules cover customers, regulars, staff, shopkeepers, couriers, and performers. Curated named NPCs can override any generated field while keeping the stable underlying recipe.

## Town behavior and service flow

`town-life.js` turns generated identities into deterministic daily itineraries rather than decorative looping walkers. Each visitor cycles through explicit scene-aware stages:

1. Walk along the street to a specific storefront door.
2. Transfer into the correct shop through its interior entrance.
3. Move to an authored browsing position and play a shopper action.
4. Return to the door, reappear outside, and walk home.

The pizzeria shift uses the same actor contract. Customers approach the painted pizzeria door, enter from the restaurant threshold, walk to a registered counter slot, face the server, gesture while ordering, wait while their ticket is prepared, reflow when the line advances, and leave through the same two-scene path after service.

Dynamic actor groups replace entire behavior-owned populations atomically, preventing stale actors and avoiding the old problem where every queue update restarted all walking animations.

Fixed vendors use signature actor records with larger presentation scale and authored job poses:

- Mara focuses downward, works fabric between both hands, and loops a sewing motion.
- Luna faces the fitting area, presents a hanger, and alternates a welcoming display gesture.
- Sofia holds a serving tray at the pizzeria counter and gestures toward active customers.

Actor state, pose, facing, independent gaze, movement, action, scale, and route-arrival action are all serialized separately. The town renderer can therefore change behavior without replacing identity or clothing.

## Authoring rule

New painted attachments must be registered to the same five view cells and bone pivots. Clothing must never bake in a body pose, face, hair, or unrelated garment. This keeps personal creation, procedural crowds, animation, and fashion crafting composable as the catalog grows.
