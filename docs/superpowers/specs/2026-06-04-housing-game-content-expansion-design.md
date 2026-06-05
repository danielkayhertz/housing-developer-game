# Housing Developer Game — Content Expansion (v3) — Design

**Date:** 2026-06-04
**Spec:** 1 of 2 in the v3 set. Companion spec: Jargon Explainers (designed in parallel).
**Status:** Draft for implementation
**Base branch:** `main` at the v2 Polish & Mechanics shipped state (131 tests passing, deployed at `housing-developer-game.dhertz.workers.dev`)

---

## Purpose

The MVP shipped one playable neighborhood (Englewood), one playable building type (mid-rise), and one playable Intent (all-affordable). The other three neighborhoods, the other two building types, and mixed-income mode are stubbed. This spec activates all of them as fully playable, with distinctive mechanical signatures that make each combination feel like a different puzzle.

Three additions:

1. **Three new neighborhoods** — Pilsen, Jefferson Park, Albany Park. Each carries unique starting state and a single distinctive hook (deep-affordability bonus, parking ask, multilingual outreach).
2. **Three building types fully playable** — walk-up, mid-rise, larger. Land cost scales by density; entitlement path varies by type and neighborhood; default unit counts differ.
3. **Mixed-income mode** — adds a market-rate band to the AMI breakdown; market rent reduces gap; LIHTC funding scales by affordable share; QAP scoring takes a penalty outside Englewood.

The expansion is primarily data and a handful of new constants — not new screens.

## Design principle: just-in-time disclosure

Tradeoffs are not narratively explained on Site & Concept. The player chooses a neighborhood, a building type, and an Intent based on their core attributes (cost, rent, name, descriptive tag) without copy telling them what the downstream consequences will be. Each consequence surfaces only at the screen where it actually bites — the cost tradeoff on Capital Stack, the entitlement tradeoff on Entitlement, the LIHTC penalty on the QAP projection card, the impact score implication on Close.

This principle informs UI copy, character dialogue placement, and the absence of upfront warnings.

## Out of scope

Deferred to future specs:

- localStorage save / resume state
- PNG result card download
- Spanish UI toggle (i18n infrastructure — distinct from in-game multilingual outreach)
- 4% LIHTC + tax-exempt bond pathway
- Additional neighborhoods, building types, sources, or entitlement paths

**Parallel spec:** Jargon Explainers. No code conflicts expected — explainers wrap text; this spec adds data and screen logic.

## Approach

Implementation proceeds in three sequential phases:

1. **Phase 1 — Data foundation.** Neighborhood data records expanded; new constants in `types.ts`; `NeighborhoodProfile` and hook flags wired through state. No new UI yet. Englewood gameplay validated unchanged (except hard-cost reduction).
2. **Phase 2 — Building & entitlement integration.** Land-cost multiplier wired into TDC computation; building-type defaults applied on select; `resolveEntitlementPath` extended to take neighborhood input; walk-up by-right and larger density variance landed; Jefferson Park SFR-only zoning hook applied.
3. **Phase 3 — Neighborhood hooks & mixed-income mode.** Pilsen 30%-AMI bonus; Jefferson Park parking choices; Albany Park multilingual choice + CBO amplification; mixed-income market band in Pro Forma; LIHTC funding scaling; QAP penalty; ARO floor outcome; new character lines.

Each phase ends with a green test suite, a green smoke test, a manual playthrough on local dev, and a deploy.

---

## Architecture & data model

### `types.ts` additions

```ts
export type AlderTone = 'green' | 'yellow' | 'red';   // 'red' is new

export const LAND_COST_BUILDING_MULTIPLIER: Record<BuildingType, number> = {
  walkup: 1.25,
  midrise: 1.00,
  larger: 0.75,
};

export const UNIT_DEFAULTS_BY_BUILDING_TYPE: Record<BuildingType, number> = {
  walkup: 24,
  midrise: 50,   // was 60 in MVP
  larger: 80,
};

export const MIXED_INCOME_QAP_PENALTY = 12;
export const ARO_FLOOR_AFFORDABLE_SHARE = 0.25;
export const DENSITY_VARIANCE_TDC_PER_UNIT = 25_000;  // larger building, automatic at zoning step
export const DENSITY_VARIANCE_MONTHS = 3;
```

`HARD_COST_PER_UNIT` constants drop 20%:

```ts
export const HARD_COST_PER_UNIT: Record<BuildingType, number> = {
  walkup: 376_000,   // was 470_000
  midrise: 448_000,  // was 560_000
  larger: 496_000,   // was 620_000
};
```

### `Outcome` extension

```ts
export type Outcome =
  | 'in-progress'
  | 'closed'
  | 'shelved-stack'
  | 'shelved-finance'
  | 'shelved-alder'
  | 'shelved-community'
  | 'shelved-aro';   // NEW — affordable share < 25% at close attempt
```

### `NeighborhoodProfile` extension

```ts
export interface NeighborhoodProfile {
  id: NeighborhoodId;
  name: string;
  emoji: string;
  description: string;
  landCostPerUnit: number;          // base; multiplied by building type
  marketRentPerUnit: number;
  alderName: string;
  alderTone: AlderTone;             // now includes 'red'
  alderGreeting: string;
  tifAvailable: boolean;
  startingAlderGoodwill: number;    // NEW — was hardcoded 75
  startingCommunitySupport: number; // NEW — was hardcoded 50
  hooks: NeighborhoodHooks;         // NEW
  status: 'mvp';                    // all four flip from 'stub' to 'mvp'
}

export interface NeighborhoodHooks {
  pilsenDeepThirtyAmiBonus?: boolean;
  jeffersonParkParkingChoice?: boolean;
  jeffersonParkSfrOnly?: boolean;     // multifamily requires ZMA
  albanyParkMultilingualChoice?: boolean;
  albanyParkCboAmplified?: boolean;
}
```

### New `StepChoiceKey` entries

```ts
export type StepChoiceKey =
  | …existing 12 keys…
  | 'preapp-multilingual'              // Albany Park only
  | 'community-jp-full-parking'        // Jefferson Park only
  | 'community-jp-traffic-data'        // Jefferson Park only
  | 'community-jp-refuse-parking';     // Jefferson Park only
```

The choice picker in `Entitlement.tsx` filters by neighborhood hook flags.

### Mixed-income data shape

Market units stay in the existing `proForma.marketUnits` field (already in state, unused in MVP). The Pro Forma slider grid renders an additional market row when `intent === 'mixed-income'`, sourcing rent from `neighborhood.marketRentPerUnit`. AMI iteration in scoring and eligibility code untouched — affordable bands remain 30/60/80.

### `selectNeighborhood` action update

When the player picks a neighborhood:

```ts
selectNeighborhood: (id) => {
  const n = getNeighborhood(id);
  set((s) => ({
    project: { ...s.project, neighborhood: id },
    entitlement: {
      ...s.entitlement,
      alderGoodwill: n.startingAlderGoodwill,
      communitySupport: n.startingCommunitySupport,
    },
  }));
}
```

Starting values are no longer global constants — they come from the selected neighborhood.

### Initial state alignment

`initialState` in `state.ts` updates to match the new mid-rise default:

- `project.units: 60` → `project.units: 50`
- `proForma.amiBreakdown: { 30: 12, 60: 36, 80: 12 }` → `{ 30: 10, 60: 30, 80: 10 }`

`setBuildingType(t)` is extended to call `setUnits(UNIT_DEFAULTS_BY_BUILDING_TYPE[t])` whenever building type changes. Switching building type therefore resets the unit count to that type's default and re-balances AMI by ratio.

### Files touched

- `src/game/types.ts` — constants, types, hooks interface, Outcome extension
- `src/data/neighborhoods.ts` — three neighborhoods promoted from stub to mvp
- `src/data/characters.ts` — three new alders, David Park ARO-floor line, parking-choice voices
- `src/data/closeReactions.ts` — `shelved-aro` failure block; per-neighborhood alder closing dispatch
- `src/game/state.ts` — `selectNeighborhood` updated; `setBuildingType` rebalances units to default
- `src/game/proForma.ts` — `computeTdc` reads land multiplier; rent roll includes market band
- `src/game/capitalStack.ts` — LIHTC award scales by affordable share; `computeLihtcScore` takes `intent`
- `src/game/entitlement.ts` — `resolveEntitlementPath` takes neighborhood input; choice consequences for new keys
- `src/game/scoring.ts` — impact score counts affordable units only
- `src/screens/SiteAndConcept.tsx` — surface live cards for all 4 neighborhoods, intent
- `src/screens/ProForma.tsx` — market band row; TDC line labels
- `src/screens/CapitalStack.tsx` — LIHTC scaled-award copy; QAP penalty row; David Park building-type quip
- `src/screens/Entitlement.tsx` — path-aware step iteration; per-neighborhood choice filter; larger building density variance row

No new files. No new screens.

---

## Neighborhood data

Four neighborhoods after the expansion:

| Field | Englewood | Pilsen | Jefferson Park | Albany Park |
|---|---|---|---|---|
| `id` | `englewood` | `pilsen` | `jefferson-park` | `albany-park` |
| `emoji` | 🌳 | 🌮 | 🅿️ | 🌐 |
| `landCostPerUnit` (base) | $12k | $60k | $110k | $55k |
| `marketRentPerUnit` | $1,150 | $2,100 | $2,900 | $1,800 |
| `alderName` | Asha Tran | Carlos Reyes | Frank Kovac | Naila Hassan |
| `alderTone` | green | yellow | **red** | yellow |
| `tifAvailable` | yes | yes | **no** | yes |
| `startingAlderGoodwill` | 75 | 65 | **35** | 60 |
| `startingCommunitySupport` | 50 | 35 | 30 | 45 |
| `status` | mvp | mvp | mvp | mvp |
| Hook: `pilsenDeepThirtyAmiBonus` | — | ✓ | — | — |
| Hook: `jeffersonParkParkingChoice` | — | — | ✓ | — |
| Hook: `jeffersonParkSfrOnly` | — | — | ✓ | — |
| Hook: `albanyParkMultilingualChoice` | — | — | — | ✓ |
| Hook: `albanyParkCboAmplified` | — | — | — | ✓ |

All alder names are fictional. The "(fiction)" suffix is **not** displayed in UI.

### Hook firing rules

```ts
// 1. Pilsen — applied on entering Phase 6 (advancePhase 5→6 or 4→6)
if (hooks.pilsenDeepThirtyAmiBonus) {
  const thirtyAmiShare = amiBreakdown[30] / totalUnits;  // totalUnits = sumAffordable + marketUnits
  if (thirtyAmiShare >= 0.20)      communitySupport += 15;
  else if (thirtyAmiShare < 0.10)  communitySupport -= 10;
  // 10% ≤ share < 20%: no delta
}

// 2. Albany Park CBO amplified — applied at Phase 6 entry when CBO partner true
if (project.hasCboPartner) {
  communitySupport += hooks.albanyParkCboAmplified ? 12 : 6;
}

// 3. Albany Park multilingual — `preapp-multilingual` choice surfaces at step 1
//    only when hooks.albanyParkMultilingualChoice is true.
//    Choice deltas: +15 community, +3 mo, no other tradeoff.
//    If player picks any other pre-app option in Albany Park, communitySupport hard-capped at 50
//    for the remainder of entitlement.

// 4. Jefferson Park parking — three choices REPLACE the standard community-step choices
//    when hooks.jeffersonParkParkingChoice is true:
//    'community-jp-full-parking':   +12 alder, +15 community, +$30k/u TDC
//    'community-jp-traffic-data':   +5  alder, +6  community, +$15k/u TDC  (half-measure)
//    'community-jp-refuse-parking': −5  alder, −10 community
//    Same UI shape as other neighborhoods — three buttons in the same grid.

// 5. Jefferson Park SFR-only — encoded in resolveEntitlementPath logic (see below).
```

---

## Building types

### Defaults and economics

| Type | Default units | Hard cost/u | Land mult | Land $/u in Englewood |
|---|---|---|---|---|
| Walk-up | 24 | $376k | ×1.25 | $15k |
| Mid-rise | 50 | $448k | ×1.00 | $12k |
| Larger | 80 | $496k | ×0.75 | $9k |

### Building-type selection behavior

`setBuildingType(t)` action:

1. Updates `project.buildingType = t`
2. Calls `setUnits(UNIT_DEFAULTS_BY_BUILDING_TYPE[t])`
3. Existing `setUnits` rebalances `amiBreakdown` to maintain its ratio

Player can subsequently tune the unit count via the existing slider. The default is suggestive, not locked.

### Land cost computation

```ts
// proForma.ts — computeTdc replaces the direct landCostPerUnit reference
const effectiveLandCost = neighborhood.landCostPerUnit
  * LAND_COST_BUILDING_MULTIPLIER[project.buildingType];
const landTotal = effectiveLandCost * totalUnits;  // totalUnits includes market in mixed-income
```

The TDC breakdown on Pro Forma displays land with its components labelled:

```
Land (Englewood · $12k × 1.0 × 50u)       $0.6M
```

### Entitlement path resolution

```ts
export function resolveEntitlementPath(input: {
  buildingType: BuildingType;
  units: number;
  neighborhood: NeighborhoodId;
}): EntitlementPath {
  const hooks = getNeighborhood(input.neighborhood).hooks;
  if (input.buildingType === 'larger') return 'pd';
  if (hooks.jeffersonParkSfrOnly && input.buildingType !== 'larger') return 'zma';
  if (input.buildingType === 'walkup' && input.units >= 40) return 'pd';
  if (input.buildingType === 'midrise') return 'zma';
  return 'by-right';  // walkup < 40 units in non-Jeff-Park neighborhoods
}
```

### Step iteration

```ts
const STEPS_BY_PATH: Record<EntitlementPath, EntitlementStep[]> = {
  'by-right': [1, 2, 4],     // skip Committee on Zoning
  'zma':      [1, 2, 3, 4],
  'pd':       [1, 2, 3, 4],
};
```

By-right path shows the skipped step 3 as a ghost row in the path tracker with copy *"By-right at this density — no Committee on Zoning case required."*

Walk-up over 40 units **loses** by-right and reverts to ZMA. The path widget updates live as the unit slider moves; copy: *"Now requires zoning case."*

### Larger-building density variance

When `buildingType === 'larger'`, the Committee on Zoning step applies an **automatic condition** regardless of which `zoning-*` choice the player picks:

- `+DENSITY_VARIANCE_TDC_PER_UNIT` per unit ($25k/u)
- `+DENSITY_VARIANCE_MONTHS` months ($3)

Surfaced as a yellow info row above the choice cards: *"Larger building requires a density variance — committee will impose a height-modulation condition: +$25k/u TDC, +3 mo review."*

The cost rides on top of whichever zoning choice the player picks. No new choice key.

### Cost surfacing on Capital Stack (just-in-time)

A new line on David Park's intro card when `buildingType !== 'midrise'`:

> *You chose Larger — that's why the hard cost per unit is at the top of the band. Worth it if you can stack the gap.*

For walk-up: *"You chose Walk-up — lowest hard cost per unit, but smaller projects mean LIHTC has less to work with."*

This is the first narrative acknowledgement of the building-type cost tradeoff — nothing on Site & Concept.

---

## Mixed-income mode

### Site & Concept selection

Two cards in the existing Intent row:

| All-affordable | Mixed-income |
|---|---|
| 100% affordable units across 30/60/80 AMI | Allocate some units at market rate; cross-subsidy from market rents |

No tradeoff copy. No mention of LIHTC penalty or QAP hit.

### Pro Forma slider grid

When `intent === 'mixed-income'`, the AMI breakdown grid renders a fourth row:

```
30% AMI  [ slider ]   12 units · $625/mo
60% AMI  [ slider ]   24 units · $1,250/mo
80% AMI  [ slider ]    8 units · $1,665/mo
Market   [ slider ]    6 units · $2,100/mo   ← from neighborhood.marketRentPerUnit
                                              (Pilsen shown)
Total                  50 units
```

The market row writes to `proForma.marketUnits`. Slider math rebalances proportionally using existing logic. Hard floor: at least 1 unit per affordable band when mixed-income (LIHTC eligibility prerequisite, displayed only on hover).

### Economics

```ts
// proForma.ts — computeRentRoll
function computeRentRoll(state) {
  const affordableRent = sumAcrossBands(amiBreakdown, rentAtAmi) * 12;
  const marketRent     = marketUnits * neighborhood.marketRentPerUnit * 12;
  return affordableRent + marketRent;
}

const totalUnits = sumAcrossBands(amiBreakdown) + marketUnits;
// Hard cost: HARD_COST_PER_UNIT[buildingType] * FINISH_MULTIPLIER[finishLevel] * totalUnits
// Land: see land cost computation above
```

Market units cost the same to build as affordable units (single building, single hard cost). Rent rises with market units → NOI rises → supportable debt rises → gap shrinks.

### LIHTC funding scaling

In `capitalStack.ts`, LIHTC source award scales linearly by affordable share:

```ts
const affordableShare = affordableUnits / totalUnits;
const lihtcAward = baseLihtcAward * affordableShare;
```

Source card copy: *"9% LIHTC · $X.XM (scaled to N% affordable share)"*

### QAP scoring penalty

```ts
computeLihtcScore({
  weightedAvgAmi,    // computed on affordable units only
  hasCboPartner,
  hasLeverageCommitments,
  neighborhood,
  intent,            // NEW
  marketUnits,       // NEW (used only to suppress penalty when 0)
}): number {
  // …existing scoring…
  if (intent === 'mixed-income' && marketUnits > 0 && neighborhood !== 'englewood') {
    score -= MIXED_INCOME_QAP_PENALTY;  // −12
  }
  return score;
}
```

Englewood is exempt — mixed-income in a disinvested community is a defensible QAP narrative.

### Eligibility check unchanged

Weighted-avg AMI on **affordable units only** must still be ≤ 60. Market units don't pull the average.

### Impact score

Closing impact score counts **affordable units only**:

```ts
const impactScore = affordableUnits * depthMultiplier;
```

Market units add zero impact. A 50-unit mixed-income (44 affordable / 6 market) scores like a 44-unit affordable project. This is the cost of mixed-income — capital ease for score.

### ARO floor (close-attempt check)

In `Entitlement.tsx` `onComplete`:

```ts
function onComplete() {
  const affordableShare = computeAffordableShare(project, proForma);
  if (affordableShare < ARO_FLOOR_AFFORDABLE_SHARE) {
    setOutcome('shelved-aro');
    advancePhase();
    return;
  }
  // existing alder/community shelve checks…
}
```

`shelved-aro` reactions on Close screen lead with David Park:

> *The ARO requires 20% affordability anyway. We're not going to subsidize that.*

Accompanied by Marcus and a housing advocate failure lines (drafted in implementation).

### Where consequences surface (just-in-time)

| Where | What | Why there |
|---|---|---|
| Pro Forma | Market row appears in slider grid; NOI rises live | Building the income story |
| Capital Stack — LIHTC source card | "Scaled to N% affordable share" | Funding cost made visible |
| Capital Stack — QAP projection card | "−12 points · mixed-income outside Englewood" factor row | Score hit made visible |
| Close — impact breakdown | "44 affordable units (6 market)" | Score implication |
| Close — shelved-aro | David Park ARO line | Hard floor consequence |

Nothing on Site & Concept, nothing on Entitlement, nothing on Intro.

---

## Screen-level change map

### Intro
No change.

### Site & Concept
- Neighborhood cards: 3 stubs become live with base land, market rent, alder name, TIF flag, alder-tone pill.
- Building-type row: defaults 24/50/80; selecting calls `setUnits` to default and rebalances AMI.
- Intent row: stub becomes live; two cards with one-line subtitle only.
- CBO partner row: unchanged from prior v2 spec.

### Pro Forma
- TDC breakdown labels each line with its source (`Mid-rise · $448k × 50u`, `Englewood · $12k × 1.0 × 50u`).
- AMI slider grid gains market row when `intent === 'mixed-income'`.
- QAP projection card reads `intent` and shows penalty row when applicable.

### Capital Stack
- David Park intro card adds a one-line quip when `buildingType !== 'midrise'`.
- LIHTC source card shows scaled award copy when mixed-income.
- QAP projection (live) shows the mixed-income penalty factor when it applies.

### Entitlement
- Path-aware step iteration: by-right runs 3 steps; ZMA and PD run 4.
- Larger building: zoning step yellow info row with auto-applied density variance.
- Albany Park: pre-app step gains a 4th choice `preapp-multilingual`; opting out hard-caps community at 50.
- Jefferson Park: community-meeting step shows three parking-flavored choices instead of standard three.
- Pilsen: on entering Phase 6, applies 30%-AMI-share bonus/penalty.
- `onComplete`: ARO-floor check fires before alder/community shelve checks.

### Close
- Stakeholder reactions panel reads `intent` for housing-advocate voice (mixed-income outside Englewood: sharper line).
- Block Club reaction reads `buildingType` (larger: parking-concerned; walk-up: low-impact).
- Each new neighborhood gets its own alder closing lines (high/mid/low bucket), not Asha's.
- New `shelved-aro` reaction block: David Park line + Marcus + advocate.

---

## Content (characters & dialogues)

### Three new alders in `data/characters.ts`

Each gets:

- `id`, `name`, `role`, `affiliation`, `emoji`
- `greeting` (replaces stub)
- `closingHigh`, `closingMid`, `closingLow`
- `shelvedAlder` line
- 2 flavor lines for step-choice reactions (optional bubbles)

**Carlos Reyes** (Pilsen, yellow tone) — affiliation: *"Alder, 25th Ward · Pilsen"*
**Frank Kovac** (Jefferson Park, red tone) — affiliation: *"Alder, 45th Ward · Jefferson Park"*
**Naila Hassan** (Albany Park, yellow tone) — affiliation: *"Alder, 39th Ward · Albany Park"*

### New voices in `data/closeReactions.ts`

- **David Park ARO-floor line**: *"The ARO requires 20% affordability anyway. We're not going to subsidize that."* Surfaced on `shelved-aro` outcome.
- **Jefferson Park parking voices**: one block-club resident line on each of the three parking choices.
- **Albany Park multilingual choice**: one community-member voice on `preapp-multilingual`, English with implied multilingual outreach (no translation rabbit hole).
- **Pilsen 30%-AMI bonus**: a Carlos Reyes character bubble at Phase 6 entry when bonus fires.

### Content slot count

- 3 alders × (1 greeting + 3 closings + 1 shelved + 2 flavor) = 21 lines
- Jefferson Park parking: 3 lines
- Albany Park multilingual: 1 line
- Pilsen 30%-AMI bonus: 1 line
- David Park ARO floor: 1 line
- `shelved-aro` reaction block (David + Marcus + advocate): 3 lines
- **27 new lines total**

All draft lines written during implementation, not in the spec.

---

## Testing strategy

Match existing pattern: unit tests for `game/` and `data/`; no UI tests beyond the existing smoke test.

### New test files

- `tests/data/neighborhoods.test.ts` — each of 4 neighborhoods has expected starting values, tone, TIF, hook flags; all four `status: 'mvp'`.
- `tests/game/landCost.test.ts` — `LAND_COST_BUILDING_MULTIPLIER` applied in `computeTdc` for every building type × neighborhood; multiplier silent on pre-Pro-Forma state.
- `tests/game/buildingDefaults.test.ts` — `setBuildingType` calls `setUnits(default)` and rebalances AMI; defaults match 24/50/80.
- `tests/game/mixedIncome.test.ts` — market rent computation; total units = affordable + market; LIHTC award scales by affordable share; QAP penalty −12 iff mixed-income AND non-Englewood AND marketUnits > 0; eligibility uses affordable units only; impact score counts affordable only.
- `tests/game/entitlementPath.test.ts` — by-right walk-up < 40 yields step list `[1,2,4]`; walk-up at 41 reverts to ZMA `[1,2,3,4]`; Jefferson Park walk-up at 24 returns ZMA (SFR override); larger always returns `[1,2,3,4]` with density variance applied at step 3.
- `tests/game/aroFloor.test.ts` — affordable share < 25% at `onComplete` sets `shelved-aro` outcome; share ≥ 25% proceeds to existing checks.
- `tests/data/neighborhoodHooks.test.ts` — Pilsen 30%-AMI bonus boundary cases (0.19/0.20/0.21 and 0.09/0.10/0.11); Jefferson Park parking choice deltas; Albany Park multilingual community cap; CBO amplified +12.

### Updated test files

- `tests/game/state.test.ts` — initial `alderGoodwill` and `communitySupport` read from selected neighborhood.
- `tests/game/proForma.test.ts` — TDC breakdown includes labels; market row appears only in mixed-income.
- `tests/game/capitalStack.test.ts` — `computeLihtcScore` takes `intent` and `marketUnits`; LIHTC award scaled.
- `tests/game/scoring.test.ts` — impact score counts affordable only.
- `tests/game/entitlement.test.ts` — Jefferson Park gets parking choices at step 2; Albany Park gets `preapp-multilingual` at step 1; community cap when player skips multilingual.
- `tests/data/closeReactions.test.ts` — `shelved-aro` reaction block; per-neighborhood alder routing; advocate reaction reads `intent`; block-club reaction reads `buildingType`.

### Target

~155–165 tests when done (up from 131; ~25–35 new tests).

---

## Edge cases worth explicit handling

1. **Mixed-income with 0 market units.** QAP penalty applies only when `marketUnits > 0`. Player who flips Intent to mixed-income but never allocates market units is treated like all-affordable for scoring.
2. **Mixed-income with affordable share < 25%.** Project cannot close — `shelved-aro` outcome forced. David Park line surfaced on Close screen.
3. **Intent toggle locked at Site & Concept.** Revise sub-screens (Capital Stack cut-costs, QAP-odds) do **not** expose Intent toggle. Switching Intent requires `retreatPhase` back to Site & Concept.
4. **Walk-up units crossing 40-unit threshold.** Entitlement path widget recomputes live. By-right ↔ ZMA transition has no immediate cost; only changes step iteration when entitlement begins.
5. **Pilsen 30%-AMI share boundaries.** `share >= 0.20` (inclusive) → +15; `share < 0.10` (strict) → −10; 0.10 ≤ share < 0.20 → no delta. Test fixtures cover 0.19/0.20/0.21 and 0.09/0.10/0.11.
6. **Jefferson Park walk-up by-right** — does NOT exist (SFR-only override). Jeff Park walk-up runs the full 4-step ZMA path.
7. **Albany Park multilingual + CBO partner stack.** Both effects apply independently. Multilingual at pre-app step (+15); CBO amplified at Phase 6 entry (+12 instead of +6). Combined boost over baseline = +27 community.
8. **Land cost multiplier × all four neighborhoods × all three building types** = 12 effective land-cost values. Parameterized test covers all 12.
9. **Englewood hooks all false.** Englewood gameplay identical to MVP except for the 20% hard-cost reduction.
10. **Composite hard-cost order of operations.** (a) `HARD_COST_PER_UNIT[buildingType]` × `FINISH_MULTIPLIER[finishLevel]` × `LOWER_QUALITY_HARD_MULTIPLIER` (if used) × totalUnits, (b) soft + contingency from new hard, (c) `+REVISION_SOFT_PENALTY × lihtcRevisions`, (d) `+DENSITY_VARIANCE_TDC_PER_UNIT × units` (if larger), (e) `+COMPLEXITY_PENALTY_PER_UNIT × max(0, sourceCount - 5) × units`. Tests cover composite.

---

## Open questions

None. All design decisions resolved during brainstorming. Implementation may surface tactical questions (specific dialogue wording, exact color values for the red-tone alder pill, copy for the density variance info row) that the implementing developer decides inline.

---

## Acceptance criteria

A merged Content Expansion implementation is complete when:

- All 4 neighborhoods playable end-to-end; each shows its distinctive hook in action.
- All 3 building types playable; walk-up under 40 units in non-Jefferson-Park neighborhoods runs 3-step entitlement; larger applies density variance at zoning step.
- Mixed-income mode functional: market band visible in Pro Forma when active; LIHTC award scales by affordable share; QAP penalty −12 shows in projection for non-Englewood mixed-income; ARO floor blocks close when affordable share < 25%.
- Manual playthrough demonstrates each new hook:
  - **Pilsen + mid-rise + all-affordable @ 30%-AMI share = 0.24**: +15 community at Phase 6 entry, Carlos Reyes bubble.
  - **Jefferson Park + larger + all-affordable**: density variance applied at zoning, three parking choices at community meeting, red-tone alder closing lines.
  - **Jefferson Park + walk-up + all-affordable @ 24 units**: 4-step entitlement (SFR override), parking choices at community step.
  - **Albany Park + walk-up + CBO + multilingual**: 3-step by-right entitlement, +27 community boost over baseline.
  - **Englewood + mid-rise + all-affordable**: identical to MVP except 20% hard-cost reduction.
  - **Any neighborhood + mixed-income with affordable share 0.20**: `shelved-aro` outcome with David Park line.
- Test suite passing at 155+ tests; no regressions in existing tests.
- Cloudflare deploy succeeds; live URL plays through all four neighborhoods.
