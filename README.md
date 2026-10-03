# Slice & Stitch prototype

This folder is a self-contained browser prototype for the pizza and fashion loops of `Slice & Stitch`. It does not import, modify, build, or serve any Whale Run files.

## Run locally

From this directory:

```bash
npm run dev
```

Open <http://localhost:4174>.

## Verify

```bash
npm run check
```

The prototype uses browser APIs and Node's built-in test runner. It has no installed package dependencies. Online play loads the pinned Supabase browser SDK from esm.sh.

## Play online

Published game: https://amkokot.github.io/slice-and-stitch/

New visitors begin in character creation. Choose an appearance and name, then press Done. Use **Play together** in the in-game header to create a room or enter a friend's six-character invite code. Up to four players can join. Creating a room makes a separate cooperative copy of the host's solo progress; it never overwrites solo play. Guests bring their character identity, not their solo money or wardrobe.

The room shares its till, reputation/progression, owned patterns, clothing chest, upgrades, daily cloth stock, dough skins, sauce portions/heat, dirty dishes and soda demand. Outfits are individually equipped from that shared chest. The sauce pot has one operator at a time. Other players can prep dough, make pizzas, craft, shop or provide service concurrently.

Only coarse activity/presence and semantic results are sent: purchases, material charges, prep/resource reservations, completion receipts, pot setup and quarter-turn stirring milestones. Pointer strokes, sewing paths and oven frames stay local. Each player retains their own unfinished project and pizza. The connected host serializes shared transactions, runs the town clock, and broadcasts state every five seconds plus immediately after shared actions. Repeated receipts cannot spend or reward twice. Players stand at the station they are using, or in separate idle floor spots; NPC names remain non-hovering accessibility labels.

### Saves and resuming with a friend

Click the bed at home to skip to the next morning. This refreshes the day's pattern shipment and discounted cloth shelf, but does not grant money, advance atelier skill, consume unfinished work or rescue burning sauce. In a room, every currently connected player must go to bed. The bedside roll call shows who is awake, and Wake up cancels your vote. Leaving home/starting another interaction wakes you too. Disconnected players are removed from the roll call by the host; guests cannot choose who counts. A sleeping player cannot work or spend until they wake up. The automatic 24-minute cycle still runs normally.

- Character identity is personal. Solo and each cooperative room use separate browser save namespaces.
- Every connected browser autosaves a recent room snapshot. The host's current state is authoritative when guests rejoin; guest snapshots never overwrite it.
- To resume together, the original host chooses their saved room under Play together. Friends choose Rejoin or use its invite code. No offline days or heat accumulate while the room is closed.
- Shared actions pause if the host/connection disappears. Pending command IDs are saved for safe retries, including a kitchen completion racing a disconnect.
- Saves are **device/browser-local**, not account-based cloud saves. Clearing site data or using another browser/device does not automatically restore them. Storage failures are reported in the room screen.
- Hosts can download a JSON backup and restore it on another device from Play together. It contains the host identity, shared room, and host's unfinished work. Close the old host window before restoring elsewhere. Guests' unfinished work stays on their own devices.
- Join codes are temporary room invitations, **not passwords or an authentication boundary**. The prototype uses public Supabase Realtime channels, like Whale Run, with a different game namespace. Do not send sensitive data or treat this as an adversarial/anti-cheat service. There is no database or privileged server key in this repository.

`online-config.js` contains only the browser-safe publishable connection key. For an independently operated release, replace that project/config and add authenticated private channels and durable server saves. Hosting here is the repository's `main` branch root on GitHub Pages (`.nojekyll`); the check workflow verifies every push. All asset URLs resolve under the repository subpath, including the modular character's SVG paintings.

## Contents

- `index.html`, `styles.css`, and `game.js`: the playable prototype and its canvas renderers.
- `model.js`: deterministic scoring and economy functions.
- `fashion-catalog.js`: the shared boutique catalogue, clothing sets, daily tailor schematics, fabric stock, and unlock rules.
- `character-model.js`: schema-v2 garment-slot state shared by crafted clothing, the boutique, the wardrobe, player avatars, and NPCs.
- `character-v2/`: the layered illustrated biped renderer, five-view/eight-direction rig, gaze controller, animation clips, garment manifests, NPC generator, and isolated demo.
- `character-creator.js` and `character-creator.css`: the fitting-room editor with live outfit, direction, gaze, and motion previews.
- `minigame-runtime.js`: UI-agnostic lifecycle contract shared by pizza and fashion.
- `kitchen-minigames.js`: self-contained sauce-pot, dough-tossing, dishwashing, and fountain-drink controllers.
- `kitchen-service.js`: persistent prep inventory, hot-pot safety gate, and unique service receipts.
- `kitchen-service-ui.js` / `kitchen-service.css`: in-panel stock, prep shortcuts, smoke warnings, and cooking-stop overlay.
- `checks/`: tests for the prototype model and minigame lifecycle contract.
- `docs/`: the game plan, art pass, and concept prompts.
- `assets/concepts/`: exploratory concept paintings.
- `assets/characters-v2/materials/`: reusable painted material sources for the character renderer.

## Full-game integration boundary

The shell should treat each minigame as a session, not reach into its canvas or DOM. Both activities publish the same lifecycle through `minigame-runtime.js`:

- `started`: a new isolated run has begun.
- `stage-changed`: the internal station moved to another step.
- `completed`: one immutable result is ready to award. Completion is idempotent, so a result cannot pay twice.

In this prototype, the browser adapter dispatches `slice-and-stitch:minigame` events. A host can subscribe without knowing the internal buttons, scoring fields, or animation state:

```js
const unsubscribe = window.sliceAndStitchMinigames.subscribe((event) => {
  if (event.type === 'completed') fullGame.acceptMinigameResult(event)
})
```

`window.sliceAndStitchMinigames.getSnapshot('pizza')` and `getSnapshot('fashion')` expose read-only lifecycle snapshots for saving or debugging. The protocol is versioned; the same runtime can be imported by a future full-game shell while the minigames continue changing independently.

The same snapshot API accepts `saucePot`, `doughToss`, `dishwashing`, and `drinkPour`. Those stations own their canvases, input, animation loops, resets, and lifecycle events inside `kitchen-minigames.js`, so they can move into a full-game kitchen without taking dependencies on the pizza screen.

## Connected kitchen service

Throw dough, then prepare tomato sauce or cold pesto. Each finished dough skin is usable immediately; a sauce batch adds five portions. Beginning a pizza reserves one skin and one portion of its recipe's sauce exactly once. Storage holds ten skins and ten portions of each sauce. Prep itself does not pay coins.

Tomato sauce warns after three minutes of visible, unpaused restaurant/kitchen work and burns after four. Burning blocks pizza preparation, oven transfer, baking progress, slicing/serving, dough work, and new sauce batches. The hot pot emits smoke and an in-panel warning with a rescue shortcut. Stir 1¼ turns to rescue it, or ¾ turn for routine upkeep. The diffuser slows heat buildup 30%. Cold pesto requires stirring but no simmer. Leaving service banks heat; it does not erase it. Hidden tabs, pauses, and offline time do not advance heat or the oven.

Serving one pizza creates two dirty dishes and one soda ticket. Each fully scrubbed/rinsed dish pays two coins. Each soda ticket pays 3–8 coins for a good-enough pour (below 40 points pays zero); wrong flavor or very poor pours do not pay, and mixed flavors sharply reduce quality. Rewards consume real demand, use unique persisted receipts, and count toward lifetime income without inflating pizza skill statistics. Resetting stations cannot create paid demand or clear a burning pot. Prep, heat, unfinished pizzas, queues, partial station work, and the day ledger survive reloads.

### 24-minute pacing and economy

The journal's examples include batch prep, pot tending, dishes, and soda—not just pizza time. These are **not daily order limits**:

| Starter-menu day | Pizzas | Typical income | Service time | Other activities |
| --- | ---: | ---: | ---: | --- |
| Relaxed | 8 at 65% match | 244 coins | 13.3 min | Generous browsing/crafting time |
| Service + sewing | 12 at 75% match | 388 coins | 16.2 min | Two ~3-minute garments plus browsing |
| Focused service | 18 at 85% match | 756 coins | 23.6 min | Includes all generated dishes and sodas |

Mixed service budgets about a minute per pizza; practiced focused service budgets 42 seconds, with an actual 7–8 second oven window. A typical 75% starter order pays 28 coins at one minute; garden/artisan counters pay more. Optional bonuses are separate from bounded clothing tips. Early 70–240 coin tools fit within one mixed day; starter crafted garments cost about 8–24 coins before extras. Existing prices and earned clothing unlocks are preserved. A mixed beginner path reaches the full catalogue in roughly seven days, with crafting shortcuts and focused play able to accelerate it.

For isolated browser QA use `?playtest=fashion#kitchen`. This uses a separate tab-local save and shows an explicit **Heat pot · test only** button. That button never appears or runs in normal gameplay. Kitchen service tests cover prep consumption, burning gates/rescue, reloads, timer pausing, batch capacities, unique dish/soda payments, and saved customer identity.

Fashion uses the same boundary. `window.sliceAndStitchFashion` exposes a read-only daily inventory and a schematic-selection adapter, while `window.sliceAndStitchEconomy` handles local purchases. The hub never reaches into the canvas renderer, so the boutique, character creator, and tailoring minigame can continue evolving independently.

## Permanent patterns and project setup

All 165 patterns are reusable purchases, not consumables or automatic level rewards. A pattern costs roughly 12% of its matching ready-made garment (rounded, minimum two coins). Atelier progression releases higher-level designs for purchase; spending never reduces that progress. Ownership is saved independently of projects and daily stock. An already-paid legacy project keeps its pattern without another charge.

Mara sells a small shipment of 3–5 patterns per day, depending on atelier tier. Only that shipment can be purchased; there is no unrestricted archive. The shipment stays fixed through purchases, reloads and same-day level advances, then rotates at dawn. Higher-level designs enter future shipments, not the crafting selector automatically.

The cutting table opens one visible setup panel: **choose an owned pattern → choose compatible material → start cutting**. The searchable **My pattern box** contains only permanently owned patterns. Purchases appear highlighted **New**, sort newest-first, and remain marked until first used. Sorts also include catalogue retail value (high to low), atelier tier (high to low), and name; the preference survives reloads. Retail value and tier describe the design, not a guaranteed finished appraisal or reputation payout. Material and execution determine actual garment quality. Buying from Mara selects the new pattern only when the table is in ordinary setup; unfinished paid projects and alterations are preserved. Mara's shop also offers a **Craft this** shortcut for owned patterns. Only suitable cloth is offered, with its whole-project price; cloth is charged once when cutting begins. Accents and alterations live in an optional Design options drawer.

The setup pattern box uses a responsive four-column grid at the default desktop size, beside a compact cloth/preview panel and one shared footer. An empty box links to Mara instead of showing unowned recipes. Pattern paintings use padded square frames with aspect-preserving fitting. Cutting and sewing move controls beside the instructions and enlarge the undistorted canvas; finishing shows one large garment preview instead of duplicating it in the sidebar. On phones, the smaller box, material panel, and sticky start action remain inside the game. Layout transitions preserve the same DOM nodes and handlers; `checks/fashion-layout.spec.js` guards those transitions and icon fitting.

Ready minigames show their next action directly beneath the work surface, outside the scrolling tool area. Kitchen handoffs follow missing recipe prep or real service demand. The pizza surface no longer carries the upper-left text badge; the order ticket remains. Completed soda tickets advance immediately, and result actions stay visible within their dialog. `checks/pattern-library.spec.js` covers prices, ownership, progression gates, legacy migration, and guarded handoffs.
