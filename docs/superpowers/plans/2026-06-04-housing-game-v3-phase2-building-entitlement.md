# Housing Developer Game v3 — Phase 2 Building & Entitlement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the building-type mechanics through: `LAND_COST_BUILDING_MULTIPLIER` reaches `computeTdc`; `setBuildingType` auto-applies `UNIT_DEFAULTS_BY_BUILDING_TYPE` with AMI rebalance; `resolveEntitlementPath` takes a neighborhood input and respects `jeffersonParkSfrOnly`; the Entitlement screen iterates a `STEPS_BY_PATH`-driven step list so by-right walk-ups run 3 steps; larger buildings get an automatic +$25k/u + 3mo density variance condition at the zoning step; Pro Forma TDC breakdown labels its lines with the source building type and land multiplier; David Park gets a building-type-specific quip on Capital Stack.

**Architecture:** Game-logic in `proForma.ts` and `entitlement.ts`; state action in `state.ts`; screen-level rendering in `ProForma.tsx`, `CapitalStack.tsx`, and `Entitlement.tsx`. No new files. No new components.

**Tech Stack:** React 19 + Vite + TypeScript + Tailwind v4 + Zustand. Vitest with jsdom. Baseline after Phase 1: ~140 tests. Target after Phase 2: ~155 tests.

**Spec:** `docs/superpowers/specs/2026-06-04-housing-game-content-expansion-design.md`
**Prior plan:** `docs/superpowers/plans/2026-06-04-housing-game-v3-phase1-data-foundation.md`

---

## Conventions

Same as Phase 1. Commits prefixed `phase-2:`.

---

## Task 1: `LAND_COST_BUILDING_MULTIPLIER` in `computeTdc`

`computeTdc` multiplies `neighborhood.landCostPerUnit` by `LAND_COST_BUILDING_MULTIPLIER[buildingType]` when computing the land line.

**Files:**
- Modify: `src/game/proForma.ts`
- Test: `tests/game/landCost.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `tests/game/landCost.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { computeTdc } from '../../src/game/proForma';

describe('land cost multiplier by building type', () => {
  const baseInput = {
    neighborhood: 'englewood' as const,
    units: 50,
    finishLevel: 'standard' as const,
  };

  it('walkup multiplies Englewood land by 1.25', () => {
    const tdc = computeTdc({ ...baseInput, buildingType: 'walkup' });
    // 12_000 * 1.25 * 50 = 750_000
    expect(tdc.land).toBe(750_000);
  });

  it('midrise multiplies Englewood land by 1.0', () => {
    const tdc = computeTdc({ ...baseInput, buildingType: 'midrise' });
    // 12_000 * 1.0 * 50 = 600_000
    expect(tdc.land).toBe(600_000);
  });

  it('larger multiplies Englewood land by 0.75', () => {
    const tdc = computeTdc({ ...baseInput, buildingType: 'larger' });
    // 12_000 * 0.75 * 50 = 450_000
    expect(tdc.land).toBe(450_000);
  });

  it('multiplier applies in Jefferson Park ($110k base)', () => {
    const tdc = computeTdc({
      neighborhood: 'jefferson-park',
      units: 24,
      buildingType: 'walkup',
      finishLevel: 'standard',
    });
    // 110_000 * 1.25 * 24 = 3_300_000
    expect(tdc.land).toBe(3_300_000);
  });
});
```

- [ ] **Step 2: Run the failing test**

Run: `npm test -- tests/game/landCost.test.ts`
Expected: FAIL — current `computeTdc` doesn't apply the multiplier.

- [ ] **Step 3: Edit `src/game/proForma.ts`**

Add `LAND_COST_BUILDING_MULTIPLIER` to the imports:

```ts
import {
  AmiBand,
  BuildingType,
  FinishLevel,
  NeighborhoodId,
  HARD_COST_PER_UNIT,
  FINISH_MULTIPLIER,
  SOFT_COST_RATIO,
  CONTINGENCY_RATIO,
  LAND_COST_BUILDING_MULTIPLIER,  // NEW
} from './types';
```

Replace the existing land calculation in `computeTdc`:

```ts
// OLD: const land = n.landCostPerUnit * input.units;
const land = n.landCostPerUnit * LAND_COST_BUILDING_MULTIPLIER[input.buildingType] * input.units;
```

- [ ] **Step 4: Run all tests**

Run: `npm test`
Expected: PASS — new tests + full suite. If any prior TDC test fails due to the multiplier now applied to mid-rise (which is ×1.0 and should be a no-op), investigate — the math should be unchanged for midrise.

- [ ] **Step 5: Commit**

```bash
git add src/game/proForma.ts tests/game/landCost.test.ts
git commit -m "phase-2: LAND_COST_BUILDING_MULTIPLIER in computeTdc"
```

---

## Task 2: `setBuildingType` auto-applies unit defaults

When the player picks a building type, units snap to the default for that type, and the AMI breakdown rebalances proportionally.

**Files:**
- Modify: `src/game/state.ts`
- Test: `tests/game/buildingDefaults.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `tests/game/buildingDefaults.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../src/game/state';

describe('setBuildingType auto-applies unit defaults', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('walkup sets units to 24', () => {
    useGameStore.getState().setBuildingType('walkup');
    expect(useGameStore.getState().project.units).toBe(24);
  });

  it('midrise sets units to 50', () => {
    useGameStore.getState().setBuildingType('walkup');  // first move off the default
    useGameStore.getState().setBuildingType('midrise');
    expect(useGameStore.getState().project.units).toBe(50);
  });

  it('larger sets units to 80', () => {
    useGameStore.getState().setBuildingType('larger');
    expect(useGameStore.getState().project.units).toBe(80);
  });

  it('AMI breakdown rebalances proportionally after walkup', () => {
    useGameStore.getState().setBuildingType('walkup');
    const b = useGameStore.getState().proForma.amiBreakdown;
    // 24 units at 20/60/20 ratio: ~5/14/5 = 24
    expect(b[30] + b[60] + b[80]).toBe(24);
    // 30% AMI should be roughly 20% of units (allow for rounding ±1)
    expect(b[30]).toBeGreaterThanOrEqual(4);
    expect(b[30]).toBeLessThanOrEqual(6);
  });
});
```

- [ ] **Step 2: Run the failing test**

Run: `npm test -- tests/game/buildingDefaults.test.ts`
Expected: FAIL — current `setBuildingType` only sets the type, doesn't touch units.

- [ ] **Step 3: Edit `src/game/state.ts`**

Find the existing `setBuildingType`:

```ts
setBuildingType: (t) => set((s) => ({ project: { ...s.project, buildingType: t } })),
```

Replace with:

```ts
setBuildingType: (t) => {
  const newUnits = UNIT_DEFAULTS_BY_BUILDING_TYPE[t];
  get().setUnits(newUnits);          // existing setUnits rebalances AMI proportionally
  set((s) => ({ project: { ...s.project, buildingType: t } }));
},
```

Add `UNIT_DEFAULTS_BY_BUILDING_TYPE` to the imports at the top:

```ts
import {
  // ...existing imports
  UNIT_DEFAULTS_BY_BUILDING_TYPE,  // NEW
} from './types';
```

Verify the order: `setUnits` rebalances based on the *current* `project.buildingType`, so calling `setUnits` before updating `project.buildingType` uses the prior type's ratio (which is the desired behavior — preserve the AMI ratio across type changes).

- [ ] **Step 4: Run all tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/state.ts tests/game/buildingDefaults.test.ts
git commit -m "phase-2: setBuildingType auto-applies unit defaults + AMI rebalance"
```

---

## Task 3: `resolveEntitlementPath` takes neighborhood input

Extends the existing function signature with `neighborhood`. Applies the `jeffersonParkSfrOnly` hook to force ZMA for any multifamily in Jefferson Park.

**Files:**
- Modify: `src/game/entitlement.ts`
- Modify: `tests/game/entitlement.test.ts`

- [ ] **Step 1: Update existing path tests**

In `tests/game/entitlement.test.ts`, find the existing `resolveEntitlementPath` tests. Update calls to pass a neighborhood. Add new cases:

```ts
import { resolveEntitlementPath } from '../../src/game/entitlement';

describe('resolveEntitlementPath', () => {
  it('larger always returns pd', () => {
    expect(resolveEntitlementPath({ buildingType: 'larger', units: 80, neighborhood: 'englewood' })).toBe('pd');
    expect(resolveEntitlementPath({ buildingType: 'larger', units: 80, neighborhood: 'jefferson-park' })).toBe('pd');
  });

  it('midrise returns zma in any neighborhood', () => {
    expect(resolveEntitlementPath({ buildingType: 'midrise', units: 50, neighborhood: 'englewood' })).toBe('zma');
    expect(resolveEntitlementPath({ buildingType: 'midrise', units: 50, neighborhood: 'jefferson-park' })).toBe('zma');
  });

  it('walkup < 40 by-right in non-Jefferson-Park neighborhoods', () => {
    expect(resolveEntitlementPath({ buildingType: 'walkup', units: 24, neighborhood: 'englewood' })).toBe('by-right');
    expect(resolveEntitlementPath({ buildingType: 'walkup', units: 24, neighborhood: 'pilsen' })).toBe('by-right');
    expect(resolveEntitlementPath({ buildingType: 'walkup', units: 24, neighborhood: 'albany-park' })).toBe('by-right');
  });

  it('walkup in Jefferson Park always returns zma (SFR override)', () => {
    expect(resolveEntitlementPath({ buildingType: 'walkup', units: 24, neighborhood: 'jefferson-park' })).toBe('zma');
    expect(resolveEntitlementPath({ buildingType: 'walkup', units: 39, neighborhood: 'jefferson-park' })).toBe('zma');
  });

  it('walkup ≥ 40 returns pd in non-Jefferson-Park (existing rule)', () => {
    expect(resolveEntitlementPath({ buildingType: 'walkup', units: 40, neighborhood: 'englewood' })).toBe('pd');
    expect(resolveEntitlementPath({ buildingType: 'walkup', units: 50, neighborhood: 'albany-park' })).toBe('pd');
  });
});
```

- [ ] **Step 2: Run the failing tests**

Run: `npm test -- tests/game/entitlement.test.ts`
Expected: FAIL — current signature doesn't accept `neighborhood`.

- [ ] **Step 3: Edit `src/game/entitlement.ts`**

Replace the existing `resolveEntitlementPath`:

```ts
import { BuildingType, NeighborhoodId, StepChoiceKey } from './types';
import { getNeighborhood } from '../data/neighborhoods';

export type EntitlementPath = 'by-right' | 'zma' | 'pd';

export function resolveEntitlementPath(input: {
  buildingType: BuildingType;
  units: number;
  neighborhood: NeighborhoodId;
}): EntitlementPath {
  const n = getNeighborhood(input.neighborhood);
  if (input.buildingType === 'larger') return 'pd';
  if (n.hooks.jeffersonParkSfrOnly && input.buildingType !== 'larger') return 'zma';
  if (input.buildingType === 'walkup' && input.units >= 40) return 'pd';
  if (input.buildingType === 'midrise') return 'zma';
  return 'by-right';
}
```

- [ ] **Step 4: Update `Entitlement.tsx` to pass neighborhood**

Find the existing call:

```ts
const path = resolveEntitlementPath({ buildingType: project.buildingType, units: project.units });
```

Replace with:

```ts
const path = resolveEntitlementPath({
  buildingType: project.buildingType,
  units: project.units,
  neighborhood: project.neighborhood!,  // null-checked earlier in render
});
```

- [ ] **Step 5: Run all tests**

Run: `npm test`
Expected: PASS — including any existing tests that pass through Entitlement.

- [ ] **Step 6: Commit**

```bash
git add src/game/entitlement.ts src/screens/Entitlement.tsx tests/game/entitlement.test.ts
git commit -m "phase-2: resolveEntitlementPath takes neighborhood, applies Jeff Park SFR override"
```

---

## Task 4: `STEPS_BY_PATH` drives entitlement step iteration

Refactor `Entitlement.tsx` so the sequence of steps comes from a `STEPS_BY_PATH` map. By-right runs `[1, 2, 4]` (skip Committee on Zoning). ZMA and PD run the full `[1, 2, 3, 4]`.

**Files:**
- Modify: `src/screens/Entitlement.tsx`
- Test: `tests/game/entitlementPath.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `tests/game/entitlementPath.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { stepsByPath } from '../../src/screens/Entitlement';   // export the map for testability

describe('STEPS_BY_PATH', () => {
  it('by-right runs steps 1, 2, 4 (skips 3 Committee on Zoning)', () => {
    expect(stepsByPath['by-right']).toEqual([1, 2, 4]);
  });

  it('zma runs steps 1-4', () => {
    expect(stepsByPath.zma).toEqual([1, 2, 3, 4]);
  });

  it('pd runs steps 1-4', () => {
    expect(stepsByPath.pd).toEqual([1, 2, 3, 4]);
  });
});
```

- [ ] **Step 2: Run the failing test**

Run: `npm test -- tests/game/entitlementPath.test.ts`
Expected: FAIL — `stepsByPath` not exported.

- [ ] **Step 3: Edit `src/screens/Entitlement.tsx`**

Add the map near the top of the file (after imports, alongside `STEP_DURATIONS`):

```ts
import { EntitlementPath } from '../game/entitlement';

export const stepsByPath: Record<EntitlementPath, number[]> = {
  'by-right': [1, 2, 4],
  zma:        [1, 2, 3, 4],
  pd:         [1, 2, 3, 4],
};
```

Find the existing `allStepsComplete` check and step-advance logic. Replace step iteration logic with path-aware iteration:

```ts
const stepsForPath = stepsByPath[path];
const stepsCompleted = entitlement.pastChoices.length;
const allStepsComplete = stepsCompleted >= stepsForPath.length;
const currentStep = stepsForPath[stepsCompleted] ?? null;
```

When rendering the step header / path tracker, use `currentStep` (which is the *actual* step number — 4 if we're on the finance step after skipping zoning). The `STEP_CHOICES[currentStep]` lookup continues to work.

For the "ghost row" displaying the skipped step on by-right:

```tsx
{path === 'by-right' && (
  <div className="text-xs text-muted italic mb-3 bg-panel/40 rounded p-2">
    Committee on Zoning skipped — by-right at this density, no zoning case required.
  </div>
)}
```

Place this above the current step's choice card.

- [ ] **Step 4: Run all tests**

Run: `npm test`
Expected: PASS — new tests + existing entitlement tests still pass. Existing tests should be using midrise (zma path = 4 steps) so behavior is unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/screens/Entitlement.tsx tests/game/entitlementPath.test.ts
git commit -m "phase-2: STEPS_BY_PATH drives step iteration; by-right runs 3 steps"
```

---

## Task 5: Larger building auto density variance condition

When `buildingType === 'larger'`, the zoning step (step 3) applies `+DENSITY_VARIANCE_TDC_PER_UNIT` per unit and `+DENSITY_VARIANCE_MONTHS` regardless of which `zoning-*` choice the player picks. Yellow info row surfaces the condition above the choice cards.

**Files:**
- Modify: `src/screens/Entitlement.tsx`
- Test: `tests/game/densityVariance.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `tests/game/densityVariance.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../src/game/state';
import { DENSITY_VARIANCE_TDC_PER_UNIT, DENSITY_VARIANCE_MONTHS } from '../../src/game/types';

describe('density variance auto-condition for larger building', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setBuildingType('larger');  // 80 units
  });

  it('applies +$25k/u TDC when taking any zoning choice', () => {
    const before = useGameStore.getState();
    const baseTdc = before.costEscalation; // accrued escalation, separate from condition cost
    useGameStore.getState().takeEntitlementStep('zoning-shrink');
    const after = useGameStore.getState();
    const expectedConditionCost = DENSITY_VARIANCE_TDC_PER_UNIT * before.project.units;
    expect(after.costEscalation - baseTdc).toBeGreaterThanOrEqual(expectedConditionCost);
  });

  it('does NOT apply for midrise', () => {
    useGameStore.getState().setBuildingType('midrise');  // 50 units
    const before = useGameStore.getState();
    useGameStore.getState().takeEntitlementStep('zoning-shrink');
    const after = useGameStore.getState();
    // No automatic condition cost — only the choice's own tdcDelta should apply
    const variance = DENSITY_VARIANCE_TDC_PER_UNIT * before.project.units;
    expect(after.costEscalation - before.costEscalation).toBeLessThan(variance);
  });
});
```

Note: the test reads `costEscalation` since that's where added TDC is tracked. If the implementation uses a different field (e.g., `entitlement.tdcDeltas[]`), adjust the assertion accordingly.

- [ ] **Step 2: Run the failing test**

Run: `npm test -- tests/game/densityVariance.test.ts`
Expected: FAIL — no auto-condition applied yet.

- [ ] **Step 3: Edit `Entitlement.tsx`'s `onChoose` for the zoning step**

Inside the `onChoose` handler (the function that runs when player picks a step choice), add a conditional after the existing `takeStep`:

```tsx
function onChoose(choice: StepChoiceKey) {
  const months = STEP_DURATIONS[currentStep] ?? 0;
  takeStep(choice);

  // Larger building: auto-apply density variance condition at zoning step
  if (currentStep === 3 && project.buildingType === 'larger') {
    const conditionCost = DENSITY_VARIANCE_TDC_PER_UNIT * project.units;
    addCostEscalation(conditionCost);     // see Step 4 for action signature
    tickMonths(DENSITY_VARIANCE_MONTHS);
  }

  tickMonths(months);
}
```

Add imports:

```ts
import { DENSITY_VARIANCE_TDC_PER_UNIT, DENSITY_VARIANCE_MONTHS } from '../game/types';
```

- [ ] **Step 4: Add or verify `addCostEscalation` action in `state.ts`**

If the store doesn't already have an action to add to `costEscalation`, add one. Otherwise reuse the existing action.

```ts
// in StoreActions interface
addCostEscalation: (delta: number) => void;

// in store body
addCostEscalation: (delta) => set((s) => ({ costEscalation: s.costEscalation + delta })),
```

- [ ] **Step 5: Add yellow info row above zoning step choices**

In `Entitlement.tsx`, in the JSX where step 3's choices render, conditionally render:

```tsx
{currentStep === 3 && project.buildingType === 'larger' && (
  <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-lg p-3 mb-3 text-sm">
    <strong>Density variance condition.</strong> Committee will impose a height-modulation
    condition: +${(DENSITY_VARIANCE_TDC_PER_UNIT * project.units / 1_000_000).toFixed(2)}M TDC,
    +{DENSITY_VARIANCE_MONTHS} mo review.
  </div>
)}
```

- [ ] **Step 6: Run all tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/screens/Entitlement.tsx src/game/state.ts tests/game/densityVariance.test.ts
git commit -m "phase-2: larger building auto-applies density variance at zoning step"
```

---

## Task 6: Pro Forma TDC breakdown labels

Each line of the TDC breakdown gets its source label: `Hard cost (Mid-rise · $448k × 50u)`, `Land (Englewood · $12k × 1.0 × 50u)`, etc.

**Files:**
- Modify: `src/screens/ProForma.tsx`

- [ ] **Step 1: Locate the TDC breakdown JSX**

Find the section that renders the TDC line items. Each line currently shows a label + a dollar amount.

- [ ] **Step 2: Add source-aware labels**

For each line, append the source breakdown:

```tsx
// Hard cost line
<div className="flex justify-between">
  <span>
    Hard cost
    <span className="text-xs text-muted ml-2">
      ({titleCase(project.buildingType)} · ${(HARD_COST_PER_UNIT[project.buildingType] / 1000).toFixed(0)}k × {project.units}u)
    </span>
  </span>
  <span>${formatDollars(tdc.hard)}</span>
</div>

// Land line
<div className="flex justify-between">
  <span>
    Land
    <span className="text-xs text-muted ml-2">
      ({neighborhood.name} · ${(neighborhood.landCostPerUnit / 1000).toFixed(0)}k × {LAND_COST_BUILDING_MULTIPLIER[project.buildingType].toFixed(2)} × {project.units}u)
    </span>
  </span>
  <span>${formatDollars(tdc.land)}</span>
</div>

// Soft cost line
<div className="flex justify-between">
  <span>
    Soft costs
    <span className="text-xs text-muted ml-2">({(SOFT_COST_RATIO * 100).toFixed(0)}% of hard)</span>
  </span>
  <span>${formatDollars(tdc.soft)}</span>
</div>

// Contingency line
<div className="flex justify-between">
  <span>
    Contingency
    <span className="text-xs text-muted ml-2">({(CONTINGENCY_RATIO * 100).toFixed(0)}% of hard)</span>
  </span>
  <span>${formatDollars(tdc.contingency)}</span>
</div>
```

Where `titleCase` and `formatDollars` are inline helpers — define at the top of the file or import from `util/`. `titleCase('midrise')` returns `'Mid-rise'`, etc.

```ts
function titleCase(t: BuildingType): string {
  return { walkup: 'Walk-up', midrise: 'Mid-rise', larger: 'Larger' }[t];
}
```

- [ ] **Step 3: Manual visual verification**

Run the dev server. Open the game, advance to Pro Forma, verify each TDC line has the breakdown suffix. Switch building type and confirm labels update live.

- [ ] **Step 4: Commit**

```bash
git add src/screens/ProForma.tsx
git commit -m "phase-2: TDC breakdown line labels (building type, land multiplier)"
```

---

## Task 7: David Park building-type quip on Capital Stack

David Park's intro card gets a building-type-aware line when the player picked walk-up or larger.

**Files:**
- Modify: `src/screens/CapitalStack.tsx`
- Modify: `src/data/characters.ts` (add lines)

- [ ] **Step 1: Add the lines to `data/characters.ts`**

Locate the `davidLines` block. Add three new keys:

```ts
export const davidLines = {
  // ...existing lines
  capitalStackQuipWalkup:
    "You chose Walk-up — lowest hard cost per unit, but a smaller building means LIHTC has less to work with. Watch the gap percentage.",
  capitalStackQuipLarger:
    "You chose Larger — that's why the hard cost per unit is at the top of the band. Worth it if you can stack the gap.",
  capitalStackQuipMidrise: null,  // no quip for midrise (the default)
};
```

- [ ] **Step 2: Render the quip in the David Park intro card**

In `CapitalStack.tsx`, find David Park's `CharacterIntroCard` block. Add a conditional line below the existing intro paragraph:

```tsx
{davidLines[`capitalStackQuip${titleCase(project.buildingType).replace('-', '')}` as keyof typeof davidLines] && (
  <p className="text-sm italic text-muted mt-2">
    {davidLines[`capitalStackQuip${titleCase(project.buildingType).replace('-', '')}` as keyof typeof davidLines]}
  </p>
)}
```

Cleaner — just inline a conditional:

```tsx
{project.buildingType === 'walkup' && (
  <p className="text-sm italic text-muted mt-2">{davidLines.capitalStackQuipWalkup}</p>
)}
{project.buildingType === 'larger' && (
  <p className="text-sm italic text-muted mt-2">{davidLines.capitalStackQuipLarger}</p>
)}
```

- [ ] **Step 3: Manual visual verification**

Run dev server. Pick walkup neighborhood + walk-up building type; advance to Capital Stack. Verify the walkup quip appears. Same for larger. Midrise: no quip.

- [ ] **Step 4: Commit**

```bash
git add src/screens/CapitalStack.tsx src/data/characters.ts
git commit -m "phase-2: David Park building-type quip on Capital Stack intro"
```

---

## Task 8: Site & Concept neighborhood card live for 4 neighborhoods

Update `SiteAndConcept.tsx` to render live cards for all four neighborhoods. Show alder tone pill (green/yellow/red), base land, market rent, alder name, TIF flag.

**Files:**
- Modify: `src/screens/SiteAndConcept.tsx`

- [ ] **Step 1: Locate the neighborhood selection block**

Find where neighborhoods are rendered. Replace any "Coming soon" guard with the full card layout.

- [ ] **Step 2: Render each neighborhood card with its data**

```tsx
import { neighborhoods } from '../data/neighborhoods';

// in JSX, for each neighborhood:
{neighborhoods.map((n) => (
  <div
    key={n.id}
    className={`p-4 border rounded-lg cursor-pointer ${
      project.neighborhood === n.id ? 'border-accent bg-accent/10' : 'border-line'
    }`}
    onClick={() => selectNeighborhood(n.id)}
  >
    <div className="flex items-center gap-2 mb-1">
      <span className="text-xl">{n.emoji}</span>
      <span className="font-semibold">{n.name}</span>
      <span className={tonePillClass(n.alderTone)}>{n.alderTone}</span>
    </div>
    <div className="text-xs text-muted mb-2">{n.description}</div>
    <div className="text-sm flex flex-col gap-0.5">
      <div className="flex justify-between"><span>Base land</span><span>${(n.landCostPerUnit/1000).toFixed(0)}k/u</span></div>
      <div className="flex justify-between"><span>Market rent</span><span>${n.marketRentPerUnit.toLocaleString()}/mo</span></div>
      <div className="flex justify-between"><span>TIF</span><span>{n.tifAvailable ? 'available' : 'not available'}</span></div>
      <div className="flex justify-between"><span>Alder</span><span>{n.alderName}</span></div>
    </div>
  </div>
))}
```

Add the `tonePillClass` helper:

```ts
function tonePillClass(tone: AlderTone): string {
  const base = 'text-xs font-semibold px-2 py-0.5 rounded-full';
  if (tone === 'green') return `${base} bg-green-100 text-green-800`;
  if (tone === 'yellow') return `${base} bg-yellow-100 text-yellow-800`;
  return `${base} bg-red-100 text-red-800`;
}
```

- [ ] **Step 3: Manual visual verification**

Run dev server. Site & Concept shows four live cards. Selecting each works. Alder tone pill renders correctly (red for Jefferson Park).

- [ ] **Step 4: Commit**

```bash
git add src/screens/SiteAndConcept.tsx
git commit -m "phase-2: Site & Concept live cards for all 4 neighborhoods"
```

---

## Task 9: Manual playthrough — walk-up by-right and larger density variance

Verify the new mechanics actually work end-to-end.

- [ ] **Step 1: Englewood + walk-up @ 24 units → by-right (3 steps)**

Run dev server. Start a new game.
- Site & Concept: Englewood, walk-up (24 units), all-affordable.
- Pro Forma: confirm hard cost shows `Walk-up · $376k × 24u`, land shows `Englewood · $12k × 1.25 × 24u`. TDC computes correctly.
- Capital Stack: stack a viable funding set; verify gap can close. David Park quip shows the walk-up message.
- Entitlement: confirm only 3 step cards (pre-app, community, finance). Committee on Zoning skipped with the ghost row message.
- Close: outcome `closed`.

- [ ] **Step 2: Jefferson Park + walk-up @ 24 units → ZMA (4 steps)**

Restart.
- Site & Concept: Jefferson Park, walk-up (24 units), all-affordable.
- Confirm 4-step entitlement (SFR override forces ZMA path even at by-right unit count).

- [ ] **Step 3: Englewood + larger @ 80 units → density variance condition fires**

Restart.
- Site & Concept: Englewood, larger (80 units).
- Pro Forma: confirm hard cost `Larger · $496k × 80u`, land `Englewood · $12k × 0.75 × 80u`.
- Capital Stack: David Park quip shows the larger message.
- Entitlement step 3 (zoning): confirm yellow info row reads "+$2.00M TDC, +3 mo review" (since 25_000 × 80 = 2_000_000). After picking any zoning choice, TDC reflects the added condition cost.

- [ ] **Step 4: No commit unless bugs are fixed**

If any of the above failed, write a follow-up commit fixing it.

---

## Done

**Phase 2 ships when:**
- `LAND_COST_BUILDING_MULTIPLIER` applied in TDC computation.
- `setBuildingType` snaps units to type defaults and rebalances AMI.
- `resolveEntitlementPath` takes neighborhood and applies Jefferson Park SFR override.
- `STEPS_BY_PATH` drives entitlement step iteration; by-right runs 3 steps.
- Larger building automatically applies +$25k/u + 3mo density variance at zoning step with a yellow info row.
- Pro Forma TDC breakdown labels each line with its source.
- David Park has building-type-specific quips on Capital Stack.
- Site & Concept renders live cards for all 4 neighborhoods with tone pills.
- Manual playthrough completes for: walk-up by-right (3 steps), Jefferson Park walk-up ZMA (4 steps), larger density variance.
- Suite passing at ~155 tests.

**Next:** Phase 3 wires the neighborhood-specific entitlement choices (Pilsen 30%-AMI bonus, Jefferson Park parking, Albany Park multilingual + CBO amplified), mixed-income mode (market band, LIHTC scaling, QAP penalty), the ARO floor outcome, and the new character content.
