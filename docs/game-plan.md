# Slice & Stitch — pre-production game plan

Working title only. This document deliberately stops before playable implementation: it defines the product, minigames, progression, online architecture, and the art target for a vertical slice.

## 1. High concept

`Slice & Stitch` is a cozy browser management game built around two linked fantasies:

1. Run a lively neighborhood pizzeria through short, tactile cooking minigames.
2. Spend the proceeds on fashion, tailoring tools, and materials; make outfits that improve presentation, become collectible objects, and may later appear on visiting customers.

The cooking loop supplies money and ingredients. The fashion loop supplies self-expression, social status, and a controlled service-income bonus. Both loops must remain useful throughout the game instead of one becoming a menu attached to the other.

## 2. Design pillars

- **Tactile tasks, short sessions.** Every action should read instantly and feel good with a mouse, touch screen, or keyboard.
- **Skill matters more than grinding.** Better timing and precision increase results; upgrades add options and forgiveness, not automatic wins.
- **Fashion is functional self-expression.** Outfits have provenance, quality, style tags, and gameplay relevance without becoming mandatory pay-to-win gear.
- **A visible neighborhood.** The home, pizzeria, boutique, and tailor form a small memorable place rather than disconnected menus.
- **Massively social, individually playable.** Many players share markets, trends, outfits, and neighborhood presence, while every minigame runs as a private, latency-tolerant instance.
- **Original nostalgic presentation.** Bold outlines, expressive characters, painted textures, snappy tweened animation, and chunky interface controls evoke classic browser games without copying a specific title.

## 3. The core day

```text
Dress for shift
      ↓
Accept 3–8 customer orders
      ↓
Play unlocked cooking stations
      ↓
Earn wages + tips + reputation + ingredient scraps
      ↓
Choose one goal:
restaurant upgrade / ready-made clothes / tailoring supplies / save money
      ↓
Design or alter a garment
      ↓
Wear, display, sell, or publish the garment
      ↓
New customers, recipes, patterns, trends, and harder shifts
```

A normal play session should support three useful lengths:

- **3 minutes:** one express order or one garment alteration.
- **10–15 minutes:** a complete restaurant shift and one shop visit.
- **25–35 minutes:** a shift, a garment craft, social browsing, and decorating/dressing.

## 4. World and screen map

The hub is one compact street with four initial destinations.

| Place | Main purpose | Secondary purpose |
|---|---|---|
| Home / apartment | Wardrobe, dress-up, collections | Trophies, décor, daily planning |
| Pizzeria | Shifts and cooking minigames | Restaurant upgrades, staff stories |
| Boutique | Buy curated ready-made clothing | Preview trends, sell selected garments |
| Tailor | Buy patterns, tools, fabric, notions | Crafting tutorials and commissions |

Later locations can include a market for specialty ingredients, a fashion show venue, and friends' storefronts. The first release should resist adding a large explorable world; the four-place street provides a strong identity at much lower production cost.

## 5. Progression and economy

### Resources

| Resource | Earned from | Spent on | Rule |
|---|---|---|---|
| Coins | Order base pay, garment sales | Ingredients, tools, upgrades, clothes | Main soft currency |
| Reputation | Accurate, timely service | Unlock gates only | Cannot be spent or purchased |
| Craft XP | Completing garments and commissions | Pattern/tool mastery | Separate from restaurant reputation |
| Inspiration | Customer looks, trend tasks, perfect actions | New pattern variants and embellishments | Small capped resource; encourages variety |
| Materials | Tailor purchase, rewards, recycling | Garment construction | Stored as concrete inventory items |

Avoid a premium currency in the initial design. It makes the value of clothing ambiguous before the core economy has been tuned.

### Income formula

Each served order has a predictable base and a bounded presentation bonus:

```text
order payout = recipe base
             × food quality (0.65–1.35)
             × speed factor (0.75–1.25)
             × presentation factor (1.00–1.20)
             + streak bonus
```

The presentation factor comes from the player's current outfit, the restaurant ambience, and that customer's style affinity. Clothing can therefore raise willingness to pay by at most 20% at launch. A beautiful outfit helps, but cannot rescue poor cooking or create runaway inflation.

Suggested split inside that 20% cap:

- Garment quality: up to 8%.
- Coordinated outfit: up to 5%.
- Customer/style match: up to 4%.
- Restaurant ambience synergy: up to 3%.

### Purchase cadence

- A small cosmetic, cheap fabric, or ingredient unlock: 1–2 good shifts.
- A meaningful tool or workstation improvement: 4–7 shifts.
- A new food station: 10–15 shifts plus a reputation milestone.
- A prestige renovation: a multi-session goal, never required for mechanical progress.

Every upgrade tier needs at least one visible change in the environment so purchases feel physical.

## 6. Customer simulation

Each customer is assembled from a deterministic server seed and has:

- A food order, patience curve, and complexity budget.
- One or two taste preferences, such as crisp crust or light sauce.
- One to three style tags, such as classic, playful, workwear, formal, or handmade.
- A budget band and tipping temperament.
- An outfit assembled from built-in or approved player-made garments.
- A reaction set for waiting, receiving, tasting, paying, and admiring an outfit.

Customer readability is more important than hidden simulation. Order cards show recipe requirements; portrait icons communicate patience and one discoverable preference. Style affinity appears as a subtle sparkle or compliment before checkout, not as a spreadsheet.

### Player-designed clothing on customers

At launch, a player can mark a finished garment as **shareable**. The system publishes an immutable garment recipe containing only game-owned shapes, fabrics, dyes, and embellishments. Approved recipes are sampled into:

1. The creator's own customers.
2. Friends' and recently visited players' customers.
3. A rotating regional/trending pool.
4. The global pool at a low rate.

The garment stores creator attribution, but customer generation uses a cached snapshot so an unavailable creator cannot break an outfit. If a garment is withdrawn or moderated, it falls back to a visually similar built-in item.

Do not support arbitrary image uploads or freehand text in the first version. Constrained components make moderation, performance, and visual consistency tractable.

## 7. Restaurant shift structure

A shift is a private 3–10 minute instance. The player sees a queue of tickets and moves between unlocked stations. Early shifts have one active order at a time; later upgrades introduce overlapping timers and multiple courses.

The tension curve for a standard six-order shift:

1. Tutorial order with generous timing.
2. Familiar order with one variation.
3. Two simultaneous simple orders.
4. A new ingredient or customer preference.
5. A recovery order with a longer patience window.
6. A showcase order combining multiple stations.

Customers do not permanently leave after a single error. Mistakes reduce quality and tips, while severe burns or wrong dishes trigger a quick remake decision.

## 8. Food minigames

### Pizza — core station

| Step | Interaction | Skill measured | Upgrade complexity |
|---|---|---|---|
| Take order | Read/confirm an illustrated ticket | Recognition | Preferences, substitutions, two-course orders |
| Stretch dough | Circular drag with even pressure | Rhythm and coverage | Dough types with different elasticity |
| Sauce | Spiral drag while controlling edge margin | Coverage | Multiple sauces, half-and-half zones |
| Cheese | Scatter or grate to a target density | Distribution | Cheese blends with melt behavior |
| Toppings | Place/count items in requested regions | Precision | More toppings, patterns, half/quarter orders |
| Bake | Choose oven zone and pull in target window | Timing and queue planning | Hot spots, multiple decks, doneness requests |
| Cut and finish | Align cuts, garnish, box/plate | Accuracy | Unusual slice counts and finishing oils |

Missing a target should create a visibly imperfect but still serveable pizza. Perfect-looking food should be the product of perfect play rather than the default art.

### Donut maker — first major station unlock

1. Whisk batter in a target rhythm without overmixing.
2. Pipe consistent rings; size affects fry time.
3. Flip each donut in its green timing window.
4. Dip or drizzle glaze to a coverage target.
5. Add toppings to match the ticket or improvise for a creativity bonus.

The design introduces batch management: one motion creates several items with slightly different timers.

### Gelato counter — fast precision station

1. Scoop through the tub along a curved gesture.
2. Match the requested portion size.
3. Stack scoops while keeping the balance meter centered.
4. Apply sauce and garnish without obscuring requested flavors.

Gelato is short and forgiving, useful as a recovery station between longer dishes.

### Fresh pasta — advanced station

1. Combine eggs and flour without spilling the well.
2. Knead in a push-fold-turn rhythm.
3. Roll through increasingly narrow machine settings.
4. Select and cut the requested shape.
5. Pull from boiling water in an al-dente window.
6. Toss with the correct sauce and finish.

Pasta is the first multi-stage dish whose early performance changes later timing. Overworked dough rolls slowly; thick sheets need longer boiling.

### Future stations

- Salad and antipasti: rapid visual sorting and knife rhythm.
- Espresso: grind dose, tamp pressure, extraction window, milk art.
- Soup: heat control and seasoning by taste clues.
- Celebration cakes: layered baking plus a fashion-like decorating system.

New stations should introduce a new verb, not merely a new skin for an existing meter.

## 9. Fashion and tailoring

### Clothing object

Every garment records:

- Slot and silhouette.
- Pattern and construction difficulty.
- Fabric, color, and material grade.
- Trim, buttons, embroidery, patch, and finish choices.
- Style tags and seasonal/trend tags.
- Craft quality from 1–100.
- Condition and alteration history.
- Creator, creation seed, and provenance.
- Calculated appraisal value and presentation contribution.

### Tailoring minigame

1. **Plan:** choose a known pattern, fabric, and compatible notions. A preview shows difficulty and expected value range.
2. **Lay and pin:** rotate pattern pieces to fit the fabric while respecting grain direction; efficient layouts save usable scraps.
3. **Trace and cut:** follow curves at a controlled speed. Jagged cuts lower construction accuracy.
4. **Sew:** guide the seam under the needle while balancing speed and alignment. Advanced patterns add corners, gathers, zippers, and sleeves.
5. **Press:** move the iron in sections and stop in the heat window; under-pressing looks bulky and over-pressing can scorch delicate fabric.
6. **Finish:** place buttons, trim, embroidery, patches, or hems. This supplies creativity and style tags.
7. **Fit and reveal:** the garment appears on a dress form or avatar with a breakdown of the result.

### Quality formula

Randomness should produce a charming surprise, not invalidate skill or expensive materials:

```text
craft quality = 40% execution precision
              + 25% material grade
              + 15% pattern mastery
              + 15% tool capability
              +  5% seeded craftsmanship roll
```

The 5% roll is generated and committed when crafting begins, preventing reloads from rerolling the garment. Excellent play always beats poor play with lucky randomness.

Appraisal value then combines quality with difficulty, rarity, trend demand, and coherent style choices. Adding every expensive embellishment should not automatically help; clashing style tags reduce coherence.

### Tools and supplies

| Upgrade | Mechanical effect | New possibility |
|---|---|---|
| Dressmaker scissors | Wider cutting tolerance | Heavy fabric |
| Pins → pattern weights | Faster layout phase | Slippery fabric |
| Basic → advanced machine | More stable speed control | Zippers, knits, decorative stitches |
| Tailor's ham / pressing tools | Larger safe heat window | Curved and structured seams |
| Dress form | Better fit preview | Fitted garments and alterations |
| Embroidery kit | Adds a precision tracing task | Motifs and high-value commissions |

The starter kit supports simple skirts, aprons, T-shirts, scarves, and tote bags. Coats, formalwear, structured dresses, and complex trousers require both tools and pattern mastery.

### Ready-made boutique

The boutique gives players a reliable path to attractive clothing without crafting. Prices buy predictable quality; crafted pieces trade predictability for authorship, unique combinations, and higher potential value. Daily stock rotates by style, not by arbitrary rarity alone.

## 10. Multiplayer model

“As many players as wanted” should mean no fixed global player count in the game design. It should not mean one unbounded synchronous room. The scalable shape is:

- **Private minigame instances:** all frame-by-frame interaction happens locally, so another player's latency cannot spoil a task.
- **Sharded social spaces:** the street or fashion show has a small, readable population, such as 20–40 visible players per shard.
- **Asynchronous shared systems:** outfits, trends, markets, visits, leaderboards, commissions, and customer appearances work across the whole population.
- **Horizontal services:** stateless gateways and workers can be added as player count grows.

### Minigame result validation

1. The server creates a session with a signed seed, order list, difficulty, inventory, equipment, and start deadline.
2. The client simulates the minigame at 60 fps without network round trips.
3. The client records a compact action timeline: normalized pointer samples, discrete choices, timestamps, and state checksums.
4. At finish, the client submits the timeline and final claim.
5. A server worker deterministically replays or sanity-checks the run and calculates authoritative rewards.
6. Impossible timing, inventory changes, or score deltas are rejected or flagged for review.

This is more scalable than streaming every pointer movement and safer than accepting a final score from the browser.

### Social features by release phase

| Phase | Features |
|---|---|
| Vertical slice | Accounts, cloud save, ghost customer outfits, friends by code |
| Alpha | Visits, likes, garment attribution, rotating trend board |
| Beta | Sharded live street, commissions, weekly style showcases |
| Post-launch | Clubs, collaborative restaurant events, opt-in trading if economy data supports it |

Direct garment trading should wait. It creates fraud, duplication, real-money trading, and child-safety concerns before the economy is proven.

## 11. Recommended technical architecture

### Client

- TypeScript and Vite.
- PixiJS for the 2D scene graph, sprites, masks, particles, and pointer input.
- A small UI framework layer for account, inventory, shop, and settings screens; keep active minigames inside PixiJS.
- Spine, Rive, or sprite-sheet animation after a short pipeline test; do not commit until export size and runtime licensing are acceptable.
- Web Audio API through a lightweight audio manager.
- IndexedDB for cached assets and recoverable local session state.
- Service worker only after save conflict behavior is defined.

### Backend

- TypeScript service layer using Fastify or NestJS.
- PostgreSQL for player state, immutable transaction ledger, garment metadata, and progression.
- Redis for session leases, rate limits, presence, hot leaderboards, and short-lived queues.
- Object storage plus CDN for versioned game bundles and generated garment thumbnails.
- WebSocket gateway for presence, chat-free emotes, visits, and live events.
- A durable queue for score validation, thumbnail composition, moderation, notifications, and analytics export.

### Service boundaries

- Identity/profile service.
- Inventory and ledger service.
- Shift/session service.
- Crafting service.
- Garment catalog and moderation service.
- Social/presence service.
- Live-configuration service for recipes, prices, trends, and events.

Start these as modules in one deployable backend. Split them into independent services only when traffic or team ownership demands it.

### State rules

- All currency and inventory mutations use idempotency keys and an append-only ledger.
- Client displays may be optimistic, but the server owns the final balance.
- Recipes, patterns, and tuning data are versioned; a session finishes with the version it started on.
- Garment recipes are immutable. Alteration creates a new version linked to its parent.
- Every generated customer references a reproducible seed and content version.

## 12. Art direction

The attached concept pass establishes a target, not final production art.

- **View:** side-on dollhouse rooms and three-quarter hub exteriors.
- **Line:** dark brown or colored outlines, thicker on silhouettes than interior detail.
- **Shape:** rounded, readable, lightly exaggerated; tools remain mechanically believable.
- **Rendering:** two or three cel-shade values plus selective painted texture.
- **Animation:** 10–15 fps hand-authored character loops displayed in a 60 fps game, with smooth UI tweening.
- **Food:** bright highlights, steam, crumbs, stretch, wobble, and browning provide feedback.
- **Fashion:** fabric weave, folds, trims, and silhouette changes must survive at gameplay scale.
- **UI:** cream cards, muted teal frames, large illustrated icons, target zones that never rely on color alone.

### Production layers

Environment files should separate background, station, interactive surface, prop, character plane, foreground, lighting overlay, and UI-safe mask. Garments should be assembled from silhouette, fabric mask, trim mask, and optional embellishment layers so the same authored piece can appear on the player and customers.

The concept paintings must not be shipped as single flattened interactive images. Each playable station should be rebuilt from a locked composition with separate art and collision layers:

- Static backdrop and counter surface.
- Interactive tools, ingredients, and garment pieces.
- Hands/character animation.
- Success, error, particle, steam, and highlight effects.
- UI and input guides.
- Invisible hit areas and deterministic gameplay state.

The final station can retain the concepts' richness around its edges, but its active work surface should have fewer details and stronger contrast. Each step should expose roughly three to seven meaningful targets at once. The simulation changes sprite states and transforms; it never attempts to infer interaction from the painted background.

### Morning, noon, and dusk lighting

Every game day has three visually distinct phases. The phase changes between activities rather than running a continuous real-time clock, so it remains legible and inexpensive to render.

| Phase | World palette | Interior treatment | Gameplay character |
|---|---|---|---|
| Morning | Peach sky, pale gold sun, cool blue-green shadows | Soft window light, low lamp intensity | Calm preparation, shopping, first simple orders |
| Noon | Clear blue sky, warm cream surfaces, short neutral shadows | Bright even task light, most accurate local colors | Lunch rush, highest order density |
| Dusk | Coral horizon, lavender/indigo ambient color, deeper shadows | Warm windows, oven, pendants, and street lamps glow | Dinner showcase orders, social activity, garment reveal |

These variations use one locked environment drawing. Production assets keep neutral local colors, then the runtime combines:

1. A phase-specific sky or window backdrop.
2. A global color-grade matrix or LUT.
3. One phase-specific shadow overlay with fixed geometry.
4. Masked warm-light and emissive layers for lamps, windows, and the oven.
5. Small atmospheric overlays such as morning dust motes or dusk glow.

Only lighting layers, palette values, and explicitly authored prop states may change. Camera, architecture, furniture, tools, clothing geometry, and hit areas remain identical. A short crossfade can transition phases in the hub; active minigames stay on one lighting state until the order finishes.

AI-generated full-scene variations are suitable for exploring palettes, but not for maintaining production continuity. Re-generating the entire image can silently change windows, tools, fabric patterns, body proportions, and object placement. Consistency comes from a single approved master layout, layered source files, shared component libraries, and deterministic runtime color treatment.

### Accessibility

- Full mouse, touch, and keyboard alternatives for every timed gesture.
- Reduced-motion option and no rapid flashing.
- Timing-assist mode widens success windows without changing story unlocks.
- Shape/pattern cues accompany red-yellow-green timing colors.
- Order narration and strong screen-reader labels for menu screens.
- Adjustable shift speed and a pause between customers for solo play.

## 13. Audio direction

- Short acoustic cues: dough slap, oven whoosh, ticket bell, scissor snip, machine stitch, iron hiss.
- Layered music adds percussion as a shift becomes busy and removes it during the result screen.
- Perfect actions use a consistent two-note motif across cooking and sewing.
- Failure sounds stay soft and recoverable; avoid alarms that make the cozy loop stressful.

## 14. Vertical slice

The smallest slice that proves the complete thesis contains:

- One avatar body set with eight built-in outfits.
- The four-location street hub in static form.
- A six-order pizza shift with dough, sauce, cheese, topping, bake, and cut interactions.
- Three customer archetypes and twelve customer looks.
- Boutique purchases and wardrobe equip flow.
- One skirt/apron tailoring pattern with fabric choice, cut, sew, press, and finish steps.
- A server-seeded session, authoritative reward calculation, account save, and a garment appearing on a later customer.
- Desktop mouse plus basic touch support.

### Slice acceptance tests

- A new player understands both loops without external instructions in under five minutes.
- One complete cook → buy/craft → dress → improved-tip loop fits in 15 minutes.
- A dropped connection during a shift can resume or safely settle without duplicating rewards.
- A crafted garment renders consistently on the dress form, player, and customer.
- A perfect run earns materially more than a poor run with the same gear.
- Clothing improves expected income but never by more than the configured cap.
- The client stays responsive on a representative school Chromebook and mid-range phone.

## 15. Milestones

### M0 — Pre-production, 2–3 weeks

- Lock audience, tone, content boundaries, input methods, and target devices.
- Prototype pizza topping, baking, cutting, fabric cutting, and sewing as gray boxes.
- Test character/garment layering and animation export.
- Build economy and progression spreadsheet.

### M1 — Vertical slice, 8–12 weeks

- Complete the slice listed above.
- Conduct weekly usability tests starting in week 3.
- Keep generated concepts as mood references; replace them with production-ready layered assets.

### M2 — Alpha, 10–14 additional weeks

- Add donut and gelato stations, 25–40 patterns, tools, boutique rotation, friends, visits, and customer outfit sampling.
- Add moderation console, telemetry, accessibility pass, and basic live configuration.

### M3 — Beta, 10–16 additional weeks

- Add pasta, overlapping orders, live street shards, weekly trends/showcases, deeper narrative, content scale, load testing, and operational dashboards.

### M4 — Launch and live operations

- Seasonal recipes/fabrics, balanced events, new stations, creator spotlights, and careful economy tuning.

These estimates assume a small experienced team; solo development should cut content quantity rather than compress the milestones.

## 16. Main risks and controls

| Risk | Control |
|---|---|
| Two loops feel disconnected | Every shift surfaces fashion; every garment affects customers and presentation |
| Clothing bonus causes runaway inflation | 20% cap, diminishing returns, customer affinities, strong coin sinks |
| Minigames become repetitive | New verbs, order modifiers, short shifts, optional mastery goals |
| Multiplayer adds latency | Keep minigames local and deterministic; synchronize only results/social data |
| Browser cheating | Signed seeds, action timelines, authoritative ledger, anomaly detection |
| Player designs create moderation load | Game-owned components only; no uploads or free text at launch |
| Art scope explodes | Modular bodies/garments, fixed camera, layered rooms, limited launch silhouettes |
| Mobile controls feel worse | Large targets, gesture alternatives, device testing from first gray box |

## 17. Decisions to make after the art review

1. Audience age and whether the tone is all-ages, teen, or adult-cozy.
2. Avatar presentation: fixed protagonist, selectable bodies, or a fully modular avatar.
3. Portrait orientation support or landscape-only minigames.
4. Whether the setting stays Mediterranean/coastal or shifts to another neighborhood style.
5. Whether fashion is purely recipe-based at launch or includes a constrained pattern editor.
6. Whether the social layer needs synchronous avatars for beta or can remain visit/ghost based longer.

