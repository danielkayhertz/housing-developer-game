# Housing Developer Game v3 — Phase 1 Data Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the data and type foundation for Content Expansion: new constants in `types.ts` (land multiplier, unit defaults, mixed-income penalty, density variance, ARO floor); `AlderTone` extended with `'red'`; `Outcome` extended with `'shelved-aro'`; `NeighborhoodProfile` gains `startingAlderGoodwill`, `startingCommunitySupport`, and a `hooks` flag bag; all four neighborhoods promoted to `status: 'mvp'` with full data; `selectNeighborhood` reads per-neighborhood starting values; initial state aligned to 50-unit midrise default; `HARD_COST_PER_UNIT` reduced 20%. No new UI, no gameplay changes beyond the cost reduction.

**Architecture:** Pure data and type changes. Game-logic functions (`computeTdc`, `computeLihtcScore`, etc.) are not touched in Phase 1 — they pick up the new constants and per-neighborhood starting values automatically through `getNeighborhood` and existing reads. Phase 2 will wire the land multiplier and entitlement-path changes; Phase 3 wires hooks and mixed-income mode.

**Tech Stack:** React 19 + Vite + TypeScript + Tailwind v4 + Zustand. Vitest with jsdom. Tests in `tests/`, source in `src/`. Baseline: 131 tests passing. Target after Phase 1: ~140 tests.

**Spec:** `docs/superpowers/specs/2026-06-04-housing-game-content-expansion-design.md`

---

## Conventions used throughout this plan

- **Run tests:** `npm test` runs the whole vitest suite. To target one file: `npm test -- tests/path/file.test.ts`.
- **Run dev server:** `npm run dev` (Vite). Open at the printed localhost URL.
- **Path style:** Paths use forward slashes for portability; works on both PowerShell and bash.
- **Commit style:** Short imperative summary; prefix with `phase-1:` for traceability.
- **Type imports:** Match existing file convention.

---

## Task 1: Type and constant additions in `types.ts`

Lands all new constants, the `'red'` alder tone, the `'shelved-aro'` outcome, the `LAND_COST_BUILDING_MULTIPLIER`, `UNIT_DEFAULTS_BY_BUILDING_TYPE`, `MIXED_INCOME_QAP_PENALTY`, `ARO_FLOOR_AFFORDABLE_SHARE`, `DENSITY_VARIANCE_TDC_PER_UNIT`, `DENSITY_VARIANCE_MONTHS`. Also reduces `HARD_COST_PER_UNIT` by 20%.

**Files:**
- Modify: `src/game/types.ts`
- Test: `tests/game/types.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `tests/game/types.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  HARD_COST_PER_UNIT,
  LAND_COST_BUILDING_MULTIPLIER,
  UNIT_DEFAULTS_BY_BUILDING_TYPE,
  MIXED_INCOME_QAP_PENALTY,
  ARO_FLOOR_AFFORDABLE_SHARE,
  DENSITY_VARIANCE_TDC_PER_UNIT,
  DENSITY_VARIANCE_MONTHS,
} from '../../src/game/types';

describe('v3 constants', () => {
  it('HARD_COST_PER_UNIT reduced 20% from v2 values', () => {
    expect(HARD_COST_PER_UNIT.walkup).toBe(376_000);
    expect(HARD_COST_PER_UNIT.midrise).toBe(448_000);
    expect(HARD_COST_PER_UNIT.larger).toBe(496_000);
  });

  it('LAND_COST_BUILDING_MULTIPLIER scales by density', () => {
    expect(LAND_COST_BUILDING_MULTIPLIER.walkup).toBe(1.25);
    expect(LAND_COST_BUILDING_MULTIPLIER.midrise).toBe(1.00);
    expect(LAND_COST_BUILDING_MULTIPLIER.larger).toBe(0.75);
  });

  it('UNIT_DEFAULTS_BY_BUILDING_TYPE has the right defaults', () => {
    expect(UNIT_DEFAULTS_BY_BUILDING_TYPE.walkup).toBe(24);
    expect(UNIT_DEFAULTS_BY_BUILDING_TYPE.midrise).toBe(50);
    expect(UNIT_DEFAULTS_BY_BUILDING_TYPE.larger).toBe(80);
  });

  it('mixed-income / ARO / density-variance constants set', () => {
    expect(MIXED_INCOME_QAP_PENALTY).toBe(12);
    expect(ARO_FLOOR_AFFORDABLE_SHARE).toBe(0.25);
    expect(DENSITY_VARIANCE_TDC_PER_UNIT).toBe(25_000);
    expect(DENSITY_VARIANCE_MONTHS).toBe(3);
  });
});
```

- [ ] **Step 2: Run the failing test**

Run: `npm test -- tests/game/types.test.ts`
Expected: FAIL — missing imports / values mismatch.

- [ ] **Step 3: Update `src/game/types.ts`**

Edit `src/game/types.ts`. Replace the existing `HARD_COST_PER_UNIT` block with the reduced values, and add the new constants:

```ts
// REPLACE the existing HARD_COST_PER_UNIT
export const HARD_COST_PER_UNIT: Record<BuildingType, number> = {
  walkup: 376_000,    // was 470_000 in v2
  midrise: 448_000,   // was 560_000 in v2
  larger: 496_000,    // was 620_000 in v2
};

// ADD these new constants near the existing HARD_COST_PER_UNIT / FINISH_MULTIPLIER block
export const LAND_COST_BUILDING_MULTIPLIER: Record<BuildingType, number> = {
  walkup: 1.25,
  midrise: 1.00,
  larger: 0.75,
};

export const UNIT_DEFAULTS_BY_BUILDING_TYPE: Record<BuildingType, number> = {
  walkup: 24,
  midrise: 50,
  larger: 80,
};

export const MIXED_INCOME_QAP_PENALTY = 12;
export const ARO_FLOOR_AFFORDABLE_SHARE = 0.25;
export const DENSITY_VARIANCE_TDC_PER_UNIT = 25_000;
export const DENSITY_VARIANCE_MONTHS = 3;
```

Then **add `'red'` to `AlderTone`** — find the existing `alderTone` field on `NeighborhoodProfile`:

```ts
// REPLACE the inline 'green' | 'yellow' union with a named type
export type AlderTone = 'green' | 'yellow' | 'red';
```

And update `NeighborhoodProfile`:

```ts
alderTone: AlderTone;  // was: 'green' | 'yellow'
```

Then **extend `Outcome`** with the new ARO floor variant:

```ts
export type Outcome =
  | 'in-progress'
  | 'closed'
  | 'shelved-stack'
  | 'shelved-finance'
  | 'shelved-alder'
  | 'shelved-community'
  | 'shelved-aro';   // NEW — affordable share < 25% at close
```

- [ ] **Step 4: Run the new tests and the existing suite**

Run: `npm test -- tests/game/types.test.ts` → PASS.
Run: `npm test` → all 131 prior tests + 4 new tests = 135 pass. (Some economic-value tests that read TDC may need updating if they hardcoded prior hard-cost values; if any fail with numeric mismatches, list them. Do **not** fix them yet — Task 2 handles cascading test updates.)

- [ ] **Step 5: Commit**

```bash
git add src/game/types.ts tests/game/types.test.ts
git commit -m "phase-1: v3 type & constant additions (hard-cost −20%, multipliers, ARO floor)"
```

---

## Task 2: Cascade prior tests that hardcoded v2 hard-cost values

The 20% hard-cost cut breaks any test that asserted on specific TDC numbers. This task surveys, updates, and re-greens the suite.

**Files:**
- Modify: `tests/game/proForma.test.ts` (most likely)
- Modify: `tests/game/capitalStack.test.ts` (possible)
- Modify: `tests/game/scoring.test.ts` (possible)

- [ ] **Step 1: Run the suite and list failing tests**

Run: `npm test`
Expected: a handful of failures in tests that asserted on dollar values containing `560_000` or hard-cost-derived numbers. Write the list of failing tests.

- [ ] **Step 2: Update each failing test's expected number to the new value**

For each failing assertion, recompute with the new constants:
- Mid-rise hard per unit: `448_000 * FINISH_MULTIPLIER[finishLevel]`
- Total hard: `hardPerUnit * units`
- Soft: `hard * 0.27`
- Contingency: `hard * 0.05`
- TDC: `land + hard + soft + contingency`

Apply the corrected numbers to each `expect(...)` call. Add a comment above any change: `// v3: −20% hard cost`.

- [ ] **Step 3: Run the suite, verify all pass**

Run: `npm test`
Expected: full suite passing.

- [ ] **Step 4: Commit**

```bash
git add tests/
git commit -m "phase-1: update existing test fixtures for −20% hard-cost"
```

---

## Task 3: `NeighborhoodHooks` interface + `NeighborhoodProfile` extension

Add the hook flag interface and the new `startingAlderGoodwill`, `startingCommunitySupport`, and `hooks` fields on `NeighborhoodProfile`.

**Files:**
- Modify: `src/game/types.ts`

- [ ] **Step 1: Edit `src/game/types.ts`**

Add the `NeighborhoodHooks` interface (place near `NeighborhoodProfile`):

```ts
export interface NeighborhoodHooks {
  pilsenDeepThirtyAmiBonus?: boolean;
  jeffersonParkParkingChoice?: boolean;
  jeffersonParkSfrOnly?: boolean;
  albanyParkMultilingualChoice?: boolean;
  albanyParkCboAmplified?: boolean;
}
```

Extend `NeighborhoodProfile`:

```ts
export interface NeighborhoodProfile {
  id: NeighborhoodId;
  name: string;
  emoji: string;
  description: string;
  landCostPerUnit: number;
  marketRentPerUnit: number;
  alderName: string;
  alderTone: AlderTone;
  alderGreeting: string;
  tifAvailable: boolean;
  startingAlderGoodwill: number;     // NEW
  startingCommunitySupport: number;  // NEW
  hooks: NeighborhoodHooks;          // NEW
  status: 'mvp' | 'stub';
}
```

- [ ] **Step 2: TypeScript will fail to compile until neighborhoods.ts gets new fields**

This is expected — Task 4 supplies the data. Don't run `npm test` yet.

- [ ] **Step 3: No commit yet** — bundled with Task 4 to avoid a broken intermediate.

---

## Task 4: Populate all 4 neighborhoods in `data/neighborhoods.ts`

Promote Pilsen / Jefferson Park / Albany Park from `'stub'` to `'mvp'`. Add starting values and hook flags to all four neighborhoods. Replace stub greetings with first-person alder lines (draft inline — see content table).

**Files:**
- Modify: `src/data/neighborhoods.ts`
- Test: `tests/data/neighborhoods.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `tests/data/neighborhoods.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { neighborhoods, getNeighborhood } from '../../src/data/neighborhoods';

describe('v3 neighborhood data', () => {
  it('all four neighborhoods are mvp status', () => {
    expect(neighborhoods).toHaveLength(4);
    for (const n of neighborhoods) expect(n.status).toBe('mvp');
  });

  it('Englewood starts at 75 alder / 50 community, green tone', () => {
    const n = getNeighborhood('englewood');
    expect(n.startingAlderGoodwill).toBe(75);
    expect(n.startingCommunitySupport).toBe(50);
    expect(n.alderTone).toBe('green');
    expect(n.tifAvailable).toBe(true);
    expect(n.hooks.pilsenDeepThirtyAmiBonus).toBeFalsy();
    expect(n.hooks.jeffersonParkParkingChoice).toBeFalsy();
    expect(n.hooks.albanyParkMultilingualChoice).toBeFalsy();
  });

  it('Pilsen starts at 65/35, yellow tone, deep-30 bonus hook', () => {
    const n = getNeighborhood('pilsen');
    expect(n.startingAlderGoodwill).toBe(65);
    expect(n.startingCommunitySupport).toBe(35);
    expect(n.alderTone).toBe('yellow');
    expect(n.alderName).toBe('Carlos Reyes');
    expect(n.landCostPerUnit).toBe(60_000);
    expect(n.marketRentPerUnit).toBe(2_100);
    expect(n.tifAvailable).toBe(true);
    expect(n.hooks.pilsenDeepThirtyAmiBonus).toBe(true);
  });

  it('Jefferson Park starts at 35/30, red tone, no TIF, parking + SFR hooks', () => {
    const n = getNeighborhood('jefferson-park');
    expect(n.startingAlderGoodwill).toBe(35);
    expect(n.startingCommunitySupport).toBe(30);
    expect(n.alderTone).toBe('red');
    expect(n.alderName).toBe('Frank Kovac');
    expect(n.landCostPerUnit).toBe(110_000);
    expect(n.marketRentPerUnit).toBe(2_900);
    expect(n.tifAvailable).toBe(false);
    expect(n.hooks.jeffersonParkParkingChoice).toBe(true);
    expect(n.hooks.jeffersonParkSfrOnly).toBe(true);
  });

  it('Albany Park starts at 60/45, yellow tone, multilingual + CBO-amplified hooks', () => {
    const n = getNeighborhood('albany-park');
    expect(n.startingAlderGoodwill).toBe(60);
    expect(n.startingCommunitySupport).toBe(45);
    expect(n.alderTone).toBe('yellow');
    expect(n.alderName).toBe('Naila Hassan');
    expect(n.landCostPerUnit).toBe(55_000);
    expect(n.marketRentPerUnit).toBe(1_800);
    expect(n.tifAvailable).toBe(true);
    expect(n.hooks.albanyParkMultilingualChoice).toBe(true);
    expect(n.hooks.albanyParkCboAmplified).toBe(true);
  });
});
```

- [ ] **Step 2: Run the failing test**

Run: `npm test -- tests/data/neighborhoods.test.ts`
Expected: FAIL — TypeScript errors on neighborhoods.ts (missing required fields).

- [ ] **Step 3: Rewrite `src/data/neighborhoods.ts`**

Replace the file contents:

```ts
import { NeighborhoodProfile, NeighborhoodId } from '../game/types';

export const neighborhoods: NeighborhoodProfile[] = [
  {
    id: 'englewood',
    name: 'Englewood',
    emoji: '🌳',
    description: 'South Side · disinvested, low-cost, supportive alder, simpler entitlement',
    landCostPerUnit: 12_000,
    marketRentPerUnit: 1_150,
    alderName: 'Asha Tran',
    alderTone: 'green',
    alderGreeting: "Welcome to the ward. I'm supportive in principle — let's make sure the block club has its say and we keep this affordable. Get me the pro forma when you're ready.",
    tifAvailable: true,
    startingAlderGoodwill: 75,
    startingCommunitySupport: 50,
    hooks: {},
    status: 'mvp',
  },
  {
    id: 'pilsen',
    name: 'Pilsen',
    emoji: '🌮',
    description: 'Lower West Side · gentrification pressure, displacement concerns dominate community input',
    landCostPerUnit: 60_000,
    marketRentPerUnit: 2_100,
    alderName: 'Carlos Reyes',
    alderTone: 'yellow',
    alderGreeting: "Look — we've lost too many longtime residents already. Show me you're serious about depth. Shallow won't fly here.",
    tifAvailable: true,
    startingAlderGoodwill: 65,
    startingCommunitySupport: 35,
    hooks: { pilsenDeepThirtyAmiBonus: true },
    status: 'mvp',
  },
  {
    id: 'jefferson-park',
    name: 'Jefferson Park',
    emoji: '🅿️',
    description: 'NW Side · car-dependent, density-averse, single-family zoning',
    landCostPerUnit: 110_000,
    marketRentPerUnit: 2_900,
    alderName: 'Frank Kovac',
    alderTone: 'red',
    alderGreeting: "I'm not going to lie — most of my constituents don't want this. Bring something with parking and you might get a hearing. Otherwise, expect a fight.",
    tifAvailable: false,
    startingAlderGoodwill: 35,
    startingCommunitySupport: 30,
    hooks: { jeffersonParkParkingChoice: true, jeffersonParkSfrOnly: true },
    status: 'mvp',
  },
  {
    id: 'albany-park',
    name: 'Albany Park',
    emoji: '🌐',
    description: 'NW Side · immigrant-heavy, multilingual engagement essential, mid-cost',
    landCostPerUnit: 55_000,
    marketRentPerUnit: 1_800,
    alderName: 'Naila Hassan',
    alderTone: 'yellow',
    alderGreeting: "Welcome. Our community speaks half a dozen languages on a slow day — meet people where they are and you'll find real partners here.",
    tifAvailable: true,
    startingAlderGoodwill: 60,
    startingCommunitySupport: 45,
    hooks: { albanyParkMultilingualChoice: true, albanyParkCboAmplified: true },
    status: 'mvp',
  },
];

export function getNeighborhood(id: NeighborhoodId): NeighborhoodProfile {
  const n = neighborhoods.find(n => n.id === id);
  if (!n) throw new Error(`Unknown neighborhood: ${id}`);
  return n;
}
```

- [ ] **Step 4: Run all tests**

Run: `npm test`
Expected: PASS — new data tests pass, prior tests still pass.

- [ ] **Step 5: Commit**

```bash
git add src/game/types.ts src/data/neighborhoods.ts tests/data/neighborhoods.test.ts
git commit -m "phase-1: NeighborhoodHooks + four neighborhoods promoted to mvp"
```

---

## Task 5: `selectNeighborhood` reads starting values

`selectNeighborhood` action sets `entitlement.alderGoodwill` and `entitlement.communitySupport` from the selected neighborhood's profile rather than the hardcoded 75 / 50.

**Files:**
- Modify: `src/game/state.ts`
- Test: `tests/game/state.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `tests/game/state.test.ts`:

```ts
import { useGameStore } from '../../src/game/state';

describe('selectNeighborhood reads per-neighborhood starting values', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('Englewood select sets 75/50', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    const s = useGameStore.getState();
    expect(s.entitlement.alderGoodwill).toBe(75);
    expect(s.entitlement.communitySupport).toBe(50);
  });

  it('Jefferson Park select sets 35/30', () => {
    useGameStore.getState().selectNeighborhood('jefferson-park');
    const s = useGameStore.getState();
    expect(s.entitlement.alderGoodwill).toBe(35);
    expect(s.entitlement.communitySupport).toBe(30);
  });

  it('Pilsen select sets 65/35', () => {
    useGameStore.getState().selectNeighborhood('pilsen');
    const s = useGameStore.getState();
    expect(s.entitlement.alderGoodwill).toBe(65);
    expect(s.entitlement.communitySupport).toBe(35);
  });

  it('Albany Park select sets 60/45', () => {
    useGameStore.getState().selectNeighborhood('albany-park');
    const s = useGameStore.getState();
    expect(s.entitlement.alderGoodwill).toBe(60);
    expect(s.entitlement.communitySupport).toBe(45);
  });
});
```

- [ ] **Step 2: Run the failing test**

Run: `npm test -- tests/game/state.test.ts`
Expected: FAIL — current implementation doesn't override starting values.

- [ ] **Step 3: Edit `selectNeighborhood` in `src/game/state.ts`**

Find the existing `selectNeighborhood` action:

```ts
selectNeighborhood: (id) => set((s) => ({ project: { ...s.project, neighborhood: id } })),
```

Replace with:

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
},
```

Add the import at the top of the file if not present:

```ts
import { getNeighborhood } from '../data/neighborhoods';
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: PASS — new tests + full suite.

- [ ] **Step 5: Commit**

```bash
git add src/game/state.ts tests/game/state.test.ts
git commit -m "phase-1: selectNeighborhood reads per-neighborhood starting alder/community"
```

---

## Task 6: Initial state aligned to 50-unit midrise default

`initialState.project.units: 60 → 50`. `initialState.proForma.amiBreakdown: { 30: 12, 60: 36, 80: 12 } → { 30: 10, 60: 30, 80: 10 }` (same 20%/60%/20% ratio).

**Files:**
- Modify: `src/game/state.ts`
- Test: `tests/game/state.test.ts`

- [ ] **Step 1: Update the existing initialState assertions in `tests/game/state.test.ts`**

Find tests that assert on the prior 60-unit / `{30:12, 60:36, 80:12}` initial state. Replace expected values:

```ts
// In whichever `describe('initialState', ...)` block exists
it('initial units = 50 (midrise default)', () => {
  useGameStore.getState().reset();
  expect(useGameStore.getState().project.units).toBe(50);
});

it('initial AMI breakdown sums to 50 with 20/60/20 ratio', () => {
  useGameStore.getState().reset();
  const b = useGameStore.getState().proForma.amiBreakdown;
  expect(b[30]).toBe(10);
  expect(b[60]).toBe(30);
  expect(b[80]).toBe(10);
  expect(b[30] + b[60] + b[80]).toBe(50);
});
```

- [ ] **Step 2: Run failing tests**

Run: `npm test -- tests/game/state.test.ts`
Expected: FAIL — current initial state is 60.

- [ ] **Step 3: Update `initialState` in `src/game/state.ts`**

Replace these two lines:

```ts
units: 60,
// ↓
units: 50,
```

```ts
amiBreakdown: { 30: 12, 60: 36, 80: 12 },
// ↓
amiBreakdown: { 30: 10, 60: 30, 80: 10 },
```

- [ ] **Step 4: Run all tests**

Run: `npm test`
Expected: PASS — including any prior tests that referenced 60 units (those should fail and need updating to 50).

If any other test asserts `units === 60` or `amiBreakdown[60] === 36`, update the expected value. Add comment `// v3: midrise default 50`.

- [ ] **Step 5: Commit**

```bash
git add src/game/state.ts tests/
git commit -m "phase-1: initial state aligned to 50-unit midrise default"
```

---

## Task 7: Smoke test — Englewood mid-rise all-affordable still completes

Phase 1 should not change Englewood gameplay beyond the 20% hard-cost reduction. Verify the existing smoke test passes; add a manual playthrough checklist.

**Files:**
- Modify: existing smoke test if needed (no creation expected)

- [ ] **Step 1: Run the full suite**

Run: `npm test`
Expected: full suite passing (~140 tests).

- [ ] **Step 2: Run the dev server**

Run: `npm run dev`
Open the printed localhost URL.

- [ ] **Step 3: Manual playthrough — Englewood mid-rise all-affordable**

- Start a new game; advance through Intro.
- Site & Concept: pick Englewood; confirm building type midrise stays selected; confirm intent stays all-affordable; toggle CBO partner off (use the default).
- Advance to Pro Forma; confirm unit count shows 50 (not 60); confirm AMI breakdown 10/30/10; confirm TDC dollar number lower than v2 (hard cost is now $448k × 1.0 × 50 = $22.4M, plus land + soft + contingency).
- Advance to Capital Stack; assemble at least the 9% LIHTC + DOH loan + IHDA loan + IAHTC; verify gap closes.
- Submit LIHTC; either get awarded or use submit-again until it lands.
- Advance to Entitlement; pick choices that keep alder/community above thresholds.
- Reach Close; outcome is `closed`. Stakeholder reactions render normally.

- [ ] **Step 4: Verify alder/community starting values came from Englewood**

In dev tools, on entry to Phase 6, confirm `entitlement.alderGoodwill === 75` and `entitlement.communitySupport === 50`.

- [ ] **Step 5: No commit** — Phase 1 already in. If smoke surfaced any bug, fix in a follow-up commit.

---

## Task 8: Phase 1 summary commit (optional)

If you want a single tag on the phase boundary, create an empty commit summarizing what shipped:

- [ ] **Step 1: Empty marker commit**

```bash
git commit --allow-empty -m "phase-1: data foundation complete — 4 neighborhoods promoted, hard cost −20%, hooks scaffolded"
```

- [ ] **Step 2: Push if remote is set up**

```bash
git push
```

This kicks off the Cloudflare auto-deploy. After deploy, manually verify Englewood mid-rise still works at the live URL.

---

## Done

**Phase 1 ships when:**
- All 4 neighborhoods are `status: 'mvp'` in `data/neighborhoods.ts`.
- New `types.ts` constants and types are in place.
- `selectNeighborhood` reads per-neighborhood starting values.
- Initial state is midrise-50 aligned.
- HARD_COST_PER_UNIT reduced 20%.
- Suite passing at ~140 tests.
- Englewood mid-rise all-affordable manual playthrough completes successfully at the live URL.

**Next:** Phase 2 wires the land-cost multiplier into TDC, makes walk-up by-right work, and applies the density variance for larger buildings.
