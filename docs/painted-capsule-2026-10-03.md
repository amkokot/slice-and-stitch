# Painted clothing capsule — October 3, 2026

Generated with the built-in image-generation tool (no CLI), from the shared body and existing painted shirt references. The source files are preserved at full 1024 × 1536 resolution with transparent backgrounds. Registration is encoded in character-v3/registered-garments.js; no preset-specific garment copies or skin-painted sleeves are needed.

## New source assets

- assets/characters-v3/modular-v4/source/top-crew-ivory-v1.png
- assets/characters-v3/modular-v4/source/outer-cable-honey-v1.png
- assets/characters-v3/modular-v4/source/apron-waist-sage-v1.png

Three actual wearable silhouettes, four colorways each (ivory, rose, sage, ink), twelve catalogue additions. Six starter choices are granted to existing saves. Remaining colorways use the existing boutique flow. Existing tee, cardigan, and waist-apron records also use these paintings. Thumbnails share the same paintings, palette filter, and textile overlay as the equipped layers. A cardigan includes a neutral tee underlayer within the existing top-slot contract; its inner tee is not independently selectable yet.

## Registration and rendering

All pieces use the canonical 1024 × 1536 body canvas. Crew tee: translate(172.32 68) scale(.64). Cardigan: translate(90.4 80) scale(.8 .75). Waist apron: translate(126.24 159.5) scale(.73). Garment shade is multiplied by the requested color, preserving transparent edges and giving dark fabrics correctly dark highlights. Existing body/skin, bottom, shoes, head, and accessory layers remain independent. A waist apron bypasses the old bib-apron clipping polygon.

The full catalogue is not yet represented by unique wearable silhouettes: the other cuts retain the previous family-level approximations. Expanding additional families should follow this same isolated painting and visual-fit workflow rather than adding names without new wearable art.

## Production prompts

### Crew tee

Use case: stylized-concept. Asset type: production clothing layer for a painted cartoon game character, on a 1024 by 1536 portrait transparent canvas. Image 1 is the exact canonical body rig for fit ONLY; Image 2 is the painted shirt style and placement reference. Paint only the requested garment, no body, neck, skin, hands, head, feet, background, labels, cast shadow or mannequin. Preserve exact source canvas composition and registration: torso center x=500, shoulders x=310..680 around y=350, waist x=355..642 at y=700, upper arms descend to x=278 and x=720 at y=500. Do not center or enlarge the isolated garment in the canvas: leave the large empty transparent upper and lower margins. Match the warm illustrated material shading, detailed stitched hems, soft dimensional folds, restrained dark contour, fine brush texture in the reference shirt. NOT geometric vector art, not photorealistic. Actual transparent background. Primary request: a soft ivory cotton crew-neck short-sleeve T-shirt fitted to the canonical body, no collar, no button placket, relaxed tasteful everyday cut. Rounded rib neckline centered at x=500 y=330..374; sleeves end y=510, lower hem y=754, fitted natural waist, clean lightly textured cream fabric with gentle fold shading. Entire neckline hole and sleeve openings truly transparent. No skin anywhere.

### Cable cardigan

Use case: stylized-concept. Asset type: production clothing layer for a painted cartoon game character, on a 1024 by 1536 portrait transparent canvas. Image 1 is the exact canonical body rig for fit ONLY; Image 2 is the painted shirt style and placement reference. Paint only the requested garment, no body, neck, skin, hands, head, feet, background, labels, cast shadow or mannequin. Preserve exact source canvas composition and registration: torso center x=500, shoulders x=310..680 around y=350, waist x=355..642 at y=700, upper arms descend to x=278 and x=720 at y=500. Do not center or enlarge the isolated garment in the canvas: leave the large empty transparent upper and lower margins. Match the warm illustrated material shading, detailed stitched hems, soft dimensional folds, restrained dark contour, fine brush texture in the reference shirt. NOT geometric vector art, not photorealistic. Actual transparent background. Primary request: a beautiful muted honey cable-knit OPEN cardigan fitted to the canonical body. Hip length hem y=790, long narrow sleeves follow the existing arms to wrists x=268 and 737 at y=760. The center opening runs from neck to bottom: transparent from x=460..550 expanding below y=630; show a separate left and right front panel, no shirt underneath. Fine cable knitting, soft rib cuffs and rib hem, small brown buttons along left front edge, cozy softly painted volume. All open center and neck space transparent. No skin or anatomy anywhere.

### Waist apron

Use case: stylized-concept. Asset type: production clothing layer for a painted cartoon game character, on a 1024 by 1536 portrait transparent canvas. Image 1 is the exact canonical body rig for fit ONLY; Image 2 is the painted shirt style and placement reference. Paint only the requested garment, no body, neck, skin, hands, head, feet, background, labels, cast shadow or mannequin. Preserve exact source canvas composition and registration: torso center x=500, shoulders x=310..680 around y=350, waist x=355..642 at y=700, upper arms descend to x=278 and x=720 at y=500. Do not center or enlarge the isolated garment in the canvas: leave the large empty transparent upper and lower margins. Match the warm illustrated material shading, detailed stitched hems, soft dimensional folds, restrained dark contour, fine brush texture in the reference shirt. NOT geometric vector art, not photorealistic. Actual transparent background. Primary request: a sage linen WAIST apron, no bib, no shoulder straps. Worn lower half only: top waistband x=340..666 y=707..738, bottom hem y=1050, flared skirt panel covers hips x=314..694. Two large stitched square pockets with rolled hems, soft linen creases, neat waist bow on wearer left within garment silhouette, tiny natural folds. Very short tucked tie ends, no ties extending outside x=310..700. Absolutely no clothing or pixels above y=698. Original canvas placement is mandatory. No skin or anatomy anywhere.

