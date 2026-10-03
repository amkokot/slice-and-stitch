# Representative garment trials — October 3, 2026

## Follow-up: saved scarf rendering and selector containment

- Reproduced the saved player's sage scarf rendering as old geometric art with rectangular texture noise. `characterToActorAppearance` had dropped accessory `slot`, so the registered-art resolver could not recognize an equipped scarf. The adapter now retains slot/tags; the paper-doll accessory collection also restores accessory semantics for legacy appearance records.
- Painted neck scarves draw above clothing/aprons and below the jaw/front hair (z-index 26), independently of foreground hats. No paintings, saved outfit IDs, palettes, name or currency were replaced.
- Reproduced the bib apron selector overflow: its tall SVG forced a 119 px thumbnail inside a 58 px swatch. SVGs are now absolutely sized within a contained, fixed-height thumbnail; the full apron scales into the swatch instead of protruding past its card.
- Visually checked the actual saved player, both bib-apron selector cards, tee/scarf combinations on all three skin buckets, and the scarf over knitwear. Browser proof: `artifacts/scarf-apron-qa-2026-10-03/`.
- `npm run check`: 117 passing tests. Regression coverage now exercises scarves through the actual saved-character adapter, legacy accessory records, neck/face depth and tall thumbnail containment. Browser error/warning logs were empty.

## Catalogue expansion and QC — follow-on batch

Eleven additional painted cuts, each with four runtime colorways: **44 new items**, **22 new starter choices**, and **21 existing original catalogue entries upgraded** by matching cut (65 additional registered records total). Current total: **361 catalogue entries, 120 with registered family artwork; 18 capsule cuts / 72 capsule items**. This is not a claim that the remaining 241 entries have distinct fitted art.

Generation used the **built-in image-generation tool**, not CLI/API scripts. Transparent RGBA source paintings remain unmodified; runtime registration, dye, sleeve coverage and exposed foot skin are encoded in `character-v3/registered-garments.js` and `painted-paper-doll.js`. No per-head or per-skin clothing duplicates are required.

Final assets (all paths relative to the project):

- assets/characters-v3/modular-v4/source/top-button-shirt-v1.png
- assets/characters-v3/modular-v4/source/top-knit-pullover-v1.png
- assets/characters-v3/modular-v4/source/top-rib-tank-v1.png
- assets/characters-v3/modular-v4/source/outer-denim-jacket-v1.png
- assets/characters-v3/modular-v4/source/outer-tailored-waistcoat-v1.png
- assets/characters-v3/modular-v4/source/bottom-a-line-skirt-v2.png
- assets/characters-v3/modular-v4/source/bottom-tailored-shorts-v1.png
- assets/characters-v3/modular-v4/source/shoes-ankle-boots-v1.png
- assets/characters-v3/modular-v4/source/shoes-ballet-flats-v1.png
- assets/characters-v3/modular-v4/source/apron-bib-apron-v1.png
- assets/characters-v3/modular-v4/source/accessory-woven-scarf-v1.png

The first A-line skirt painting (`bottom-a-line-skirt-v1.png`) was rejected for excessive flare; v2 is the selected painting. Existing assets were not overwritten.

### Visual QC and fixes

- Checked all standalone capsule families in the browser, then six mixed outfits on light, medium and deep skin, using the same production renderer as the saved player.
- Raised/registered Oxford shoulders and collar; checked long cuffs, dark knit dye and shirt-only sleeve coverage.
- Open waistcoats keep inner shirt sleeves; full jackets suppress inner sleeves. Cropped jackets restore the complete inner-shirt torso/hem below the jacket, eliminating the dangling central strip and exposed hip gaps.
- Ballet flats receive two painted foot-top inserts sampled from the selected skin bucket, sharing the exact left/right shoe transforms. Shoe paintings contain no baked skin. Loafers and boot shafts were inspected at close range; soles remain neutral, hems draw above shoes.
- Bib strap, waist tie and scarf are independently anchored. No loose accessory/tie fragments are intentionally included.
- Preview pages preload referenced paintings before replacing an outfit, so a slow image load cannot flash the unclothed base. Stale asynchronous renders are discarded.
- The saved player outfit/name/coins remained unchanged after game reload; new samples appeared in the live wardrobe. Fitting room controls never write the save.
- PNG audit checks RGBA dimensions, transparent corners and visible-alpha margins (alpha >= 32), plus transformed torso, waist, ankle and hem regions. Extremely faint generated alpha noise is not treated as garment silhouette.
- Browser proof: `artifacts/catalogue-qa-2026-10-03/`. No-save gallery: `/character-v3/catalogue-qa.html`; free mixing: `/character-v3/wardrobe-fit-demo.html`.
- Final verification: `npm run check` passes all 115 tests, including 216 colorway/skin render combinations and source PNG/registration checks. Additional syntax checks pass for the registry, capsule, renderer, fitting gallery and preview loader. Game and fitting-room browser error/warning logs were empty.

### Remaining coverage

Dresses/gowns, long coats/capes, several specialized trouser/skirt cuts, heels/sandals and most accessories still need distinct paintings and fitting passes. Unsupported families deliberately do not resolve to a newly approved family merely because their material/mood tags match. Existing gameplay fallback art remains available.

### Reproducible final prompt set

The following common prompt is concatenated with `\nGARMENT: ` and the corresponding garment brief. References for button-shirt/knit-pullover were the canonical shared body and approved crew painting. For the other nine requests, the first reference was the clothed canonical `qa-onbody-shirt-pants-v2.png`, and the common prompt says “CLOTHED CANONICAL CHARACTER reference” instead of “CANONICAL BODY reference”. All requests set `transparent_background: true`.

```text
Use case: stylized-concept, production game clothing layer.
Generate ONE isolated painted wearable garment on a genuinely transparent 1024 x 1536 canvas, for a modular cartoon-human paper doll.
Image 1 is the CANONICAL BODY reference for exact front view, pose and registration only. Image 2 is the APPROVED CLOTHING reference for matte painterly texture, soft folds, stitching and level of detail only, NOT its enlarged layout. Do not render the body from Image 1.
Match the relaxed straight-on stance, arms slightly angled out, torso center x500. Shoulder attachments x315 and x685 at y355, neck base y320, waist x355..645 at y675, hips y790, wrists x270 and x735 at y770, knees y1010, ankles x393 and x627 at y1290, ground y1410. Paint the garment as worn on this body, without body pixels. Preserve registration and transparent unused canvas; DO NOT enlarge or recenter the garment to fill the image.
Art: warm, detailed hand-painted game illustration; subtle woven material, restrained soft shading, credible drape, tasteful seams. Not a photograph, 3D render, vector outline, plastic, or shiny product shot.
Strict alpha: outside the actual fabric is completely transparent. NO glow, halo, gradient backdrop, shadow cloud, black background, hanger, mannequin, skin, limbs, head, text, labels, or extra fragments. Openings between fabric panels are transparent too.
```

#### button-shirt

A soft ivory cotton BUTTON-UP SHIRT with pointed collar, small buttons down the center, long sleeves following the arms, buttoned cuffs just above the hands at y770, hem y785. Closed chest covers the torso; no neck or hands. Simple versatile Oxford style.

#### knit-pullover

A softly textured oatmeal CREW-NECK KNITTED PULLOVER, fine knit and ribbed cuffs, collar and waistband, long sleeves following the body arms to y770, hem y785. Not open like a cardigan. Avoid bulky shoulders.

#### rib-tank

An ivory RIBBED TANK TOP, modest rounded neckline and broad shoulder straps, fitted opaque chest, hem y780. No sleeves; armholes expose transparency, no skin. Opaque modest coverage.

#### denim-jacket

An OPEN CROPPED DENIM TRUCKER JACKET in neutral warm grey for runtime dyeing. Distinct pointed collar, two flap chest pockets, brass buttons, double-stitched seams, long sleeves to y770. Cropped torso hem y700. Inner shirt is NOT included; middle gap fully transparent.

#### tailored-waistcoat

An OPEN TAILORED WAISTCOAT in warm taupe, sleeveless with a modest V front, three small brass buttons on one side, two welt pockets, pointed lower fronts ending y775. Inner shirt is NOT included; middle gap and armholes transparent.

#### a-line-skirt

A soft neutral taupe A-LINE MIDI SKIRT, fitted waistband y675 and hips at y790, gentle flare to hem y1100. Center x500, waist x345..655, hem about x270..740. Subtle vertical folds, twill texture, not tight pencil or densely pleated.

#### tailored-shorts

Neutral warm taupe TAILORED BERMUDA SHORTS, waistband y675 x345..655, hips x335..670, two individual leg openings ending y910 (well below y840). Center fly, side pockets, turned cuffs, elegant cotton twill, legs separated by transparent gap. No skin or legs.

#### ankle-boots

ONE PAIR of warm taupe CHELSEA ANKLE BOOTS, low heel, rounded toes, elastic side panels and pull tabs. Worn in canonical frontal stance: shaft tops y1220, soles y1410. Left ankle x393, right ankle x627, feet point slightly outward. Each boot within x280..450 and x560..730 respectively. No feet or legs. Pair not individual product shoes enlarged.

#### ballet-flats

ONE PAIR of matte taupe BALLET FLATS, softly rounded toes, very low soles, narrow binding and tiny tonal bows. Canonical frontal stance: openings center x393 and x627 at y1325, soles y1410, left shoe x275..450 and right shoe x560..740, point gently outward. Cutout openings fully transparent, no feet, legs, or shoe-shaped skin.

#### bib-apron

A natural oatmeal LINEN BIB APRON: slim neck strap attaching at y330, bib over chest x405..605 at y410, waist tie at y700, skirt panel widens to x335..675 with hem y1080, one large divided pocket at y880. Neck loop and sides transparent. Short tucked ties, NO loose ribbon fragments beyond hips, NO body or inner shirt.

#### woven-scarf

A SOFT WOVEN NECK SCARF in neutral oatmeal, a single loose loop around neck base centered x500 at y335..405, with two short draping ends reaching y570, asymmetrically tucked in front. Width about x405..610. Fine textile weave and gently folded fringe. Only scarf fabric, no neck, no face, no garment beneath.


#### A-line refinement

Use case: precise-object-edit. Edit Image 1, the painted A-line skirt source, for game-rig fitting. Change ONLY the flare of the skirt: narrow the hem and lower skirt panels by about 30%, making a modest everyday A-line midi rather than a large circle skirt. Keep the waistband exactly at x370..650, y398, and keep hem y1306. Gradually taper silhouette to a hem spanning roughly x230..800. Preserve the centered front view, waistband, painterly matte twill texture, folds and shading, 1024 x1536 canvas. Do not zoom or reposition. No body, limbs, skin or extra garments. Outside skirt must be genuinely transparent, no halo or shadow backdrop.

The earlier representative trial notes below remain a historical record of the preceding seven-family stage.

## Scope and assets

Four new silhouettes were generated using the built-in image-generation tool, not the CLI. Final 1024 × 1536 transparent source paintings:

- assets/characters-v3/modular-v4/source/outer-soft-blazer-v1.png
- assets/characters-v3/modular-v4/source/bottom-wide-linen-v1.png
- assets/characters-v3/modular-v4/source/bottom-pencil-twill-v1.png
- assets/characters-v3/modular-v4/source/shoes-penny-loafers-v1.png

Each has ivory, rose, sage, and ink catalogue records. Two examples per silhouette are available immediately in existing saves; other colors follow the boutique flow. Together with the earlier tee, cardigan, and waist apron this gives seven independently painted garment families, plus the corrected sneaker shape.

## Problems found and resolved through the trials

- **Closed footwear:** The old upper-body painting stopped before the shoe opening and contained small foot-shaped flaps. Closed shoes now use a clean ankle bridge sampled from the matching painted lower-leg texture. Its silhouette follows the existing leg edges and the overlap blends softly, avoiding square skin tabs in bare-leg skirt outfits. It works with all three skin buckets, with no skin painted into the shoes and no bare toes beneath them.
- **Paired shoe registration:** Left and right footwear have independent transforms and half-canvas clips. Soles are leveled; neutral outsole painting and bright lace details are preserved separately from fabric color. The same assembly produces matching thumbnails.
- **Wide hems:** Footwear draws below bottom garments, so trouser hems cover shoe collars rather than vice versa.
- **Long sleeves:** Blazer and cardigan metadata masks the underlying arms to prevent thin strips of skin peeking along the inside sleeve edge. Hands, neck, legs, and head remain independent.
- **Open layers (updated October 3):** Shirts/blouses and outerwear now have independent equipment slots in the game and fit demo. Each retains its own color and pattern, aprons draw over both, and removing a jacket leaves the selected shirt intact. Covered inner sleeves are clipped beneath long-sleeved jackets so a rolled-sleeve blouse does not protrude beside a fitted blazer.

## Independent outerwear implementation

- Character schema v3 keeps the existing storage key. Older built-in and crafted jackets in `top` migrate into `outerwear`, with a real ivory crew tee selected beneath them. The jacket's ID, quality, dye, alterations, provenance, other equipped slots, and character identity are retained. Subsequent loads do not re-equip removed outerwear.
- The shared garment-slot resolver classifies coats, blazers, jackets, cardigans, waistcoats, vests, capes and zip hoodies as outerwear. Tees, blouses, shirts, pullovers, sweatshirts and dresses remain base tops. Built-in catalogue records, tailoring schematics and older crafted records use the same rule.
- Creator and boutique expose separate shirt and outerwear categories. Outerwear has a Wear none control. Tailoring/alteration compatibility and fashion-set bonuses keep working with the original garment IDs.
- Existing painted garment sources are reused; no new generated assets are needed. Legacy direct NPC/debug appearances with a jacket in `garmentDetails.top` have a neutral-shirt compatibility fallback. Canonical saved-player appearances never invent a jacket-colored inner shirt.
- Verification: 109 tests pass, including independent equip/removal, built-in/crafted migration, reload persistence, fabric palettes/patterns, layer order, thumbnail resolution and set bonuses. Browser checks cover tee/blouse under blazer, removing the blazer, cardigan/tee/waist apron, and the migrated player's in-game wardrobe.

## Feasibility / next gate

Family-by-family expansion is tractable: a painting, one registration record, coverage metadata when needed, and palette/pattern variants. These trials cover open outerwear, fitted skirts, wide trousers, bib/waist apron combinations, and low closed shoes. They do not validate strappy sandals, heels, tall boots, short bottoms, complete dresses, or walking/side-view deformation. Existing unsupported catalogue cuts still use their older approximate family paintings. Do not treat this as completion of the full catalogue.

The wardrobe-fit-demo.html page provides four outfit recipes, editable piece selectors, three skin buckets, torso/foot close-ups, and optional guides. It does not write the character save. The shared production renderer used here is also used in the game.

## Final prompt set

### soft-blazer

Use case: stylized-concept. Asset type: isolated wearable garment layer for a painted cartoon game, 1024 × 1536 portrait canvas with genuine transparency. Input image 1 is the canonical BODY RIG for pose, anatomy, scale and registration only. Input image 2 is a PAINTED CLOTHING STYLE reference. Generate the garment alone, no body, no skin, no hands, no neck, no head, no feet, no mannequin, no background or cast shadow, no labels. Match the soft illustrated shading, fine material texture, carefully stitched hems and natural folds of image 2. Not vector geometry, not a shiny photoreal product shot. Keep the exact body-rig canvas framing: torso center x=500, shoulders x=315..685 at y=350, waist x=355..645 at y=675, wrists x=270 and 735 at y=770, ankle centers x=393 and 627 at y=1290. Leave all other regions transparent. Do not enlarge the garment to fill the canvas or center it vertically. Primary request: a tailored open soft-wool blazer in muted greige. Fitted shoulders follow the rig, long sleeves follow the relaxed hanging arms down to y=777, not horizontal. Shaped waist, hip-length hem y=815, refined notched lapels, softly rounded edges, two stitched welt pockets, a small restrained brown button on the left panel. The center opening is transparent from x=455..545 at the chest, widening to x=445..555 at the waist, no inner shirt. Sleeve openings transparent, no skin. Keep the understated detailed hand-painted game look.

### wide-trousers

Use case: stylized-concept. Asset type: isolated wearable garment layer for a painted cartoon game, 1024 × 1536 portrait canvas with genuine transparency. Input image 1 is the canonical BODY RIG for pose, anatomy, scale and registration only. Input image 2 is a PAINTED CLOTHING STYLE reference. Generate the garment alone, no body, no skin, no hands, no neck, no head, no feet, no mannequin, no background or cast shadow, no labels. Match the soft illustrated shading, fine material texture, carefully stitched hems and natural folds of image 2. Not vector geometry, not a shiny photoreal product shot. Keep the exact body-rig canvas framing: torso center x=500, shoulders x=315..685 at y=350, waist x=355..645 at y=675, wrists x=270 and 735 at y=770, ankle centers x=393 and 627 at y=1290. Leave all other regions transparent. Do not enlarge the garment to fill the canvas or center it vertically. Primary request: sand-linen wide-leg trousers worn on the exact rig, two separate legs hanging straight, NOT a skirt. Waistband x=353..647 at y=664..706, fitted hips to y=800, each leg slightly widens toward broad clean hem y=1300: left hem x=310..468, right hem x=535..694. Keep a narrow transparent gap between legs. Detailed linen weave, fly and brass button, belt loops, angled hip pockets, restrained pressed folds, no belt, no shoes, no anatomy. Fine painted hem stitching, fabric has soft matte dimensionality.

### pencil-skirt

Use case: stylized-concept. Asset type: isolated wearable garment layer for a painted cartoon game, 1024 × 1536 portrait canvas with genuine transparency. Input image 1 is the canonical BODY RIG for pose, anatomy, scale and registration only. Input image 2 is a PAINTED CLOTHING STYLE reference. Generate the garment alone, no body, no skin, no hands, no neck, no head, no feet, no mannequin, no background or cast shadow, no labels. Match the soft illustrated shading, fine material texture, carefully stitched hems and natural folds of image 2. Not vector geometry, not a shiny photoreal product shot. Keep the exact body-rig canvas framing: torso center x=500, shoulders x=315..685 at y=350, waist x=355..645 at y=675, wrists x=270 and 735 at y=770, ankle centers x=393 and 627 at y=1290. Leave all other regions transparent. Do not enlarge the garment to fill the canvas or center it vertically. Primary request: a softly tailored berry/plum pencil midi skirt, not pleated and not flared. Fitted waistband x=350..650 at y=664..706, gentle hip curve max width x=336..665 around y=820, subtly taper to x=368..643 at lower hem y=1090, front seam, short overlapping front walking vent between y=1030 and 1090 with genuinely transparent slit. Soft wool-twill texture, natural diagonal drape folds over the hips, small side pocket seam, precise stitching, no buttons floating, no body or legs. It is an independent skirt layer ending below knees.

### penny-loafers

Use case: stylized-concept. Asset type: isolated wearable garment layer for a painted cartoon game, 1024 × 1536 portrait canvas with genuine transparency. Input image 1 is the canonical BODY RIG for pose, anatomy, scale and registration only. Input image 2 is a PAINTED CLOTHING STYLE reference. Generate the garment alone, no body, no skin, no hands, no neck, no head, no feet, no mannequin, no background or cast shadow, no labels. Match the soft illustrated shading, fine material texture, carefully stitched hems and natural folds of image 2. Not vector geometry, not a shiny photoreal product shot. Keep the exact body-rig canvas framing: torso center x=500, shoulders x=315..685 at y=350, waist x=355..645 at y=675, wrists x=270 and 735 at y=770, ankle centers x=393 and 627 at y=1290. Leave all other regions transparent. Do not enlarge the garment to fill the canvas or center it vertically. Primary request: a PAIR of softly painted chestnut leather penny loafers worn on this rig, not a store product display. Shoes only, confined to lower canvas y=1270..1410. Ankle-opening centers MUST be at x=393 and x=627, with shoe heels beneath these ankles. Left shoe toe points slightly outward toward x=332; right shoe toward x=688; symmetric gentle three-quarter frontal stance. Left shoe silhouette x=294..435, right x=587..731. Both soles touch the identical ground line y=1410. Rounded slightly almond toes, soft leather crease shading, penny straps, subtle hand stitching, small low stacked heel, slim warm-brown sole (not thick/platform). Open shoe holes genuinely transparent to fit the shared ankles. No socks, skin, legs, extra shoe, background or shadow. Keep these LOWER-canvas coordinates, leave upper 1250px empty transparent.

