# Painted clothing expansion — October 3, 2026, batch 2

## Result

Seven additional wearable families, with four independently dyed colorways per family: 28 new catalogue items and 14 new immediately owned starter choices. Piqué polo, camp-collar shirt, wrap blouse, utility cargo trousers, pleated midi, rolled chore jacket and cross-back apron.

Matching exact cuts also upgrade 11 original catalogue entries. Current coverage is 159 of 389 catalogue entries with registered family artwork, including 25 capsule cuts / 100 capsule items. The remaining 230 entries still use fallback art; this is not a claim that the entire catalogue has been fitted or visually approved.

Generation mode: built-in image-generation tool. No CLI/API generation scripts. Five new isolated paintings and one targeted skirt edit; the chore jacket reuses an existing approved painting. Generated originals and older project assets were preserved. Skin/head changes do not require duplicate clothing paintings.

## Final project assets

All paths below are relative to the project.

- assets/characters-v3/modular-v4/source/top-polo-v1.png
- assets/characters-v3/modular-v4/source/top-camp-shirt-v1.png
- assets/characters-v3/modular-v4/source/top-wrap-blouse-v1.png
- assets/characters-v3/modular-v4/source/bottom-cargo-trousers-v1.png
- assets/characters-v3/modular-v4/source/bottom-pleated-midi-v2.png
- assets/characters-v3/modular-v4/source/apron-crossback-v1.png
- Reused: assets/characters-v3/modular-v4/render/outer-teal-chore-onbody-v3.png

Registration and runtime colorways: character-v3/registered-garments.js and painted-capsule.js. Equipment remains independent: shirt, outerwear, bottom, apron, footwear and accessories. Existing saves receive starter samples without changing their selected outfit.

## Fit and visual QC

- Raised polo and camp-shirt shoulder registrations to eliminate exposed skin strips.
- Widened/raised the wrap blouse to meet the canonical shoulders and neck.
- Replaced the pleated skirt's upper-hip tabs/notches with a continuous hip contour through a targeted raster edit. Preserved the original source.
- Rolled chore sleeves mask protruding inner upper sleeves independently of skin coverage. Bare forearms and long inner cuffs remain available.
- Cross-back apron retains its long hem and broad straps rather than inheriting the short service-apron crop.
- Checked six new mixed outfits at full-body and torso framing, including shirts under jackets and aprons, across light, medium and deep skin.
- Checked the actual saved player's scarf and new wardrobe choices. Name, coins and equipped outfit were unchanged. Both new cross-back apron swatches stayed inside selector cards.
- Gallery framing changes no longer rebuild the same SVG identifiers, avoiding transient unstyled/bare-body frames.
- PNG checks cover dimensions, transparent corners, visible-alpha margins and registered shoulder, waist, ankle and hem regions. Very faint generated alpha noise is not treated as garment silhouette.
- Fitting previews never write the save. They preload paintings and discard stale asynchronous renders.

## Neck-wrap simplification requested by the player

The attempted rear/front wrap split was removed. The scarf is now one visible front painting with a curved source-space cutout that discards the hidden rear loop and raised ends. The same cutout is applied in equipped rendering and selector thumbnails, before the canonical placement transform. The original PNG remains preserved; no new raster generation was needed for this fix.

There are no rear-wrap render objects or seam/depth-part assembly. Visible neck fabric sits over clothing/aprons and below the jaw/front hair. Fallback geometric neckwear likewise discards its hidden upper portion instead of rendering a rear copy. Foreground hats remain independent. Fallback ties/collars are not newly painted or declared finished by this change.

Canonical scarf cutout:

```
M0 440H350Q410 440 458 486Q518 512 576 482Q635 435 684 435H1024V1536H0Z
```

## Verification and browser proofs

- npm run check: 119 passing tests.
- Additional node --check passes: registered-garments.js, painted-paper-doll.js, catalogue-qa.js, wardrobe-fit-demo.js.
- 100 capsule colorways × 3 skin buckets checked for independent equipment and unique SVG identifiers.
- Regression tests require a single scarf layer, no rear-wrap markup, a curved visible contour, matching thumbnail/equipped trim and preserved neck/face ordering.
- Game and fitting-room browser error/warning logs were empty after final checks.
- Browser proof directory: artifacts/clothing-batch2-2026-10-03/.
- Final images: arrivals-final-medium.jpg, arrivals-light.jpg, arrivals-deep.jpg, torso-final-deep.jpg, front-scarf-player-final.jpg, selector-aprons-final.jpg.
- No-save gallery: /character-v3/catalogue-qa.html; free mixing: /character-v3/wardrobe-fit-demo.html.

## Final image-generation prompt set

For each of the five new paintings, the complete submitted prompt is the shared prefix below followed by that garment's brief. Both reference images were supplied: render/qa-onbody-shirt-pants-v2.png for the canonical clothed pose, and source/top-crew-ivory-v1.png for painted material style. Transparent background was enabled.

### Shared prefix

```text
Use case: stylized-concept. Asset type: production wearable painting for a modular cartoon-human paper doll.
Generate ONE isolated garment on a genuinely transparent 1024 x 1536 portrait canvas.
Image 1 is the CLOTHED CANONICAL CHARACTER reference for exact front view, pose and registration only. Image 2 is the APPROVED CLOTHING reference for matte painted texture, soft folds, stitching and detail only, NOT its enlarged layout. Do not render the character or other clothes.
Match relaxed straight-on stance, arms slightly angled out, torso center x500. Shoulder attachments x315 and x685 at y355, neck base y320, waist x355..645 at y675, hips y790, wrists x270 and x735 at y770, knees y1010, ankles x393 and x627 at y1290, ground y1410. Paint as worn on this body without body pixels. Preserve registration and unused transparent canvas; DO NOT enlarge or recenter to fill the image.
Art: warm detailed hand-painted game illustration; subtle woven material, restrained soft shading, credible drape, refined seams. Not photograph, 3D render, vector outline, plastic or shiny product shot.
Strict alpha: outside actual fabric is transparent. No glow, halo, background gradient, shadow cloud, mannequin, skin, limbs, head, text, watermark or extra fragments. Neck, arm and panel openings transparent.
GARMENT: 
```

### polo

```text
A neutral oatmeal COTTON PIQUE POLO SHIRT, modest pointed rib collar and short two-button placket, short fitted sleeves ending y510, softly relaxed opaque torso, hem y785. Fine small-scale pique texture, rib sleeve cuffs and neat side vents. No logos. Collar opening transparent, no neck.
```

### camp-shirt

```text
An ivory LINEN CAMP-COLLAR SHIRT, relaxed short sleeves ending y520, open notched resort collar, small warm wooden buttons down center, one understated chest patch pocket, softly draped hem y785. Closed shirt below the collar V; no inner tee, no skin. Refined everyday vacation tailoring, subtle linen texture.
```

### wrap-blouse

```text
An ivory COTTON WRAP BLOUSE, modest overlapping diagonal V neckline closed over chest, three-quarter sleeves ending y640, subtly gathered sleeve cuffs, shaped waist with small tucked fabric tie at x620 y685, hem y775. Elegant soft drape and precise seams, no overlarge bow and no loose ties floating beyond the hips. Opaque fabric, no skin.
```

### cargo-trousers

```text
Warm grey-beige COTTON CARGO TROUSERS, waistband y675 x345..655, relaxed straight hips and legs, slightly tapered separate hems at y1310. Left hem x350..450, right hem x570..675, transparent gap between legs. Two subdued flap cargo pockets at mid-thigh y930, belt loops, small fly button, side seams and subtle twill. No boots, socks, skin, legs or belt.
```

### crossback-apron

```text
A natural oatmeal COTTON CROSS-BACK WORK APRON, broad shoulder straps attaching y355 at x385 and x630, no neck loop, fitted chest bib x385..635 y430..700, side waist panels with short tucked ties, long practical skirt x335..680 ending y1090. Two divided utility pockets and restrained reinforced stitching. Open shoulder/neck area transparent; no underlying shirt, body or skin. No tools and no loose strap fragments.
```

### Pleated skirt targeted edit

Transparent background enabled, existing pleated skirt painting supplied as the edit reference.

```text
Use case: precise-object-edit. Image 1 is the edit target, a painted pleated-skirt wearable layer. Keep its exact 1024 x 1536 canvas, waistband at x350..670 y778..825, hem at y1241, center, matte plum twill palette, pleats, stitchwork, and transparent background. Change ONLY the awkward upper-hip silhouette immediately below the waistband: remove the jutting horizontal/triangular fabric tabs at both upper side edges and close the cut-in transparent notches beneath them. Join the waistband to the pleated skirt as a continuous smoothly tailored hip contour: near x350 and x670 at y825, gradually widening into the existing lower pleats. There must be no floating or dog-ear side flaps and no gaps between the waistband and skirt sides. Preserve lower folds and hem. No body, skin, other garments, labels, background, halo, or shadows outside the actual fabric.
```

