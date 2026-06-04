# Housing Developer Game v2 — Phase 1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the foundation layer of Spec 1 (Polish & Mechanics): months-based time model, 30/60/80 AMI tiers, CBO partner choice with QAP integration, Marcus + David Park character intro cards on Pro Forma and Capital Stack, Pro Forma QAP projected score card, stabilized-value cleanup, shorter entitlement durations with per-choice time labels, and a timeline pill in the Header.

**Architecture:** Type-and-state changes land first (Phase enum widened to 7, `monthsElapsed`, `tickMonths`, AMI tier rebalance, CBO state fields), then game-logic adjustments (`computeLihtcScore` reads `hasCboPartner` from input), then reusable UI primitives (`CharacterIntroCard`, `TimelinePill`), then screen-by-screen integrations. Each task is TDD where game logic is touched and structural otherwise. No new screens or new state machine branches in Phase 1 — those land in Phase 2.

**Tech Stack:** React 19 + Vite + TypeScript + Tailwind v4 + Zustand. Vitest with jsdom. Tests in `tests/`, source in `src/`. Existing baseline: 59 tests passing. Target after Phase 1: ~70 tests.

**Spec:** `docs/superpowers/specs/2026-06-04-housing-game-polish-and-mechanics-design.md`

---

## Conventions used throughout this plan

- **Run tests:** `npm test` runs the whole vitest suite. To target one file: `npm test -- tests/path/file.test.ts`.
- **Run dev server:** `npm run dev` (Vite). Open at the printed localhost URL.
- **Path style:** Paths use forward slashes for portability even on Windows. The shell is PowerShell or bash on this machine.
- **Commit style:** Short imperative summary; reference the phase ("phase-1:") for traceability.
- **Type imports:** TypeScript `import type { ... }` for type-only imports where the file already uses that style. Otherwise standard imports.

---

## Task 1: `formatElapsed` utility

Centralized helper that converts a month count to a human-readable string like `"1 yr 6 mo"`, `"3 mo"`, `"2 yr"`. Used everywhere months are displayed (header pill, recap cards, etc.).

**Files:**
- Create: `src/util/formatElapsed.ts`
- Test: `tests/util/formatElapsed.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/util/formatElapsed.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { formatElapsed } from '../../src/util/formatElapsed';

describe('formatElapsed', () => {
  it('zero months → "0 mo"', () => {
    expect(formatElapsed(0)).toBe('0 mo');
  });

  it('under a year → "X mo"', () => {
    expect(formatElapsed(1)).toBe('1 mo');
    expect(formatElapsed(6)).toBe('6 mo');
    expect(formatElapsed(11)).toBe('11 mo');
  });

  it('exact year boundaries → "X yr"', () => {
    expect(formatElapsed(12)).toBe('1 yr');
    expect(formatElapsed(24)).toBe('2 yr');
    expect(formatElapsed(36)).toBe('3 yr');
  });

  it('year + months → "X yr Y mo"', () => {
    expect(formatElapsed(18)).toBe('1 yr 6 mo');
    expect(formatElapsed(13)).toBe('1 yr 1 mo');
    expect(formatElapsed(35)).toBe('2 yr 11 mo');
  });

  it('rounds down fractional months', () => {
    expect(formatElapsed(18.7)).toBe('1 yr 6 mo');
  });
});
```

- [ ] **Step 2: Run the failing test**

Run: `npm test -- tests/util/formatElapsed.test.ts`
Expected: FAIL with "Failed to resolve import" or similar — the source file doesn't exist yet.

- [ ] **Step 3: Implement `formatElapsed`**

Create `src/util/formatElapsed.ts`:

```ts
/**
 * Format a month count as "1 yr 6 mo" / "3 mo" / "2 yr".
 * Fractional inputs are floored.
 */
export function formatElapsed(months: number): string {
  const m = Math.max(0, Math.floor(months));
  const years = Math.floor(m / 12);
  const remMonths = m % 12;
  if (years === 0) return `${remMonths} mo`;
  if (remMonths === 0) return `${years} yr`;
  return `${years} yr ${remMonths} mo`;
}
```

- [ ] **Step 4: Run the test, verify pass**

Run: `npm test -- tests/util/formatElapsed.test.ts`
Expected: PASS (all five cases).

- [ ] **Step 5: Commit**

```bash
git add src/util/formatElapsed.ts tests/util/formatElapsed.test.ts
git commit -m "phase-1: add formatElapsed util for months display"
```

---

## Task 2: Widen `Phase` enum to allow 1–7

The spec inserts a new GapResolution phase (5) between Capital Stack and Entitlement. Phase 2 will create the screen; Phase 1 just widens the type so subsequent work can target it without churn.

**Files:**
- Modify: `src/game/types.ts:8`

- [ ] **Step 1: Update `Phase` type**

In `src/game/types.ts`, find:
```ts
export type Phase = 1 | 2 | 3 | 4 | 5 | 6;
```

Replace with:
```ts
export type Phase = 1 | 2 | 3 | 4 | 5 | 6 | 7;
```

- [ ] **Step 2: Verify no breakage**

Run: `npm test`
Expected: existing state tests still pass. The `advancePhase` test caps at 6 currently — that's expected to remain green because no caller advances past 6 yet.

- [ ] **Step 3: Commit**

```bash
git add src/game/types.ts
git commit -m "phase-1: widen Phase enum to 1..7 for upcoming GapResolution screen"
```

---

## Task 3: Replace `yearsElapsed` with `monthsElapsed` + `tickMonths(n)`

Core time-model refactor. The old `tickYear` action and `yearsElapsed` field are replaced wholesale. All cost-escalation math becomes per-month.

**Files:**
- Modify: `src/game/types.ts` (state interface)
- Modify: `src/game/state.ts` (initial state, action)
- Modify: `tests/game/state.test.ts` (update existing test)
- Modify: `src/components/Header.tsx` (consumer)
- Modify: `src/screens/ProForma.tsx` (consumer)
- Modify: `src/screens/CapitalStack.tsx` (consumer)
- Modify: `src/screens/Entitlement.tsx` (consumer)
- Modify: `src/screens/Close.tsx` (consumer)

- [ ] **Step 1: Update GameState type**

In `src/game/types.ts`, find:
```ts
export interface GameState {
  phase: Phase;
  yearsElapsed: number;
  costEscalation: number;
```

Replace with:
```ts
export interface GameState {
  phase: Phase;
  monthsElapsed: number;
  costEscalation: number;
```

- [ ] **Step 2: Update initial state and action in store**

In `src/game/state.ts`, in `initialState`, change:
```ts
  phase: 1,
  yearsElapsed: 0,
  costEscalation: 0,
```
to:
```ts
  phase: 1,
  monthsElapsed: 0,
  costEscalation: 0,
```

In the `StoreActions` interface (around line 55), change `tickYear: () => void;` to `tickMonths: (n: number) => void;`.

In the store implementation, find the existing `tickYear` action:
```ts
  tickYear: () => set((s) => {
    if (!s.project.neighborhood) return {};
    const hardPerU = HARD_COST_PER_UNIT[s.project.buildingType] * FINISH_MULTIPLIER[s.proForma.finishLevel];
    const hard = hardPerU * s.project.units;
    const escalationThisYear = hard * COST_ESCALATION_PER_YEAR * (1 + SOFT_COST_RATIO + CONTINGENCY_RATIO);
    return {
      yearsElapsed: s.yearsElapsed + 1,
      costEscalation: s.costEscalation + escalationThisYear,
    };
  }),
```

Replace with:
```ts
  tickMonths: (n: number) => set((s) => {
    if (!s.project.neighborhood) return {};
    const hardPerU = HARD_COST_PER_UNIT[s.project.buildingType] * FINISH_MULTIPLIER[s.proForma.finishLevel];
    const hard = hardPerU * s.project.units;
    const escalationPerMonth = hard * (COST_ESCALATION_PER_YEAR / 12) * (1 + SOFT_COST_RATIO + CONTINGENCY_RATIO);
    return {
      monthsElapsed: s.monthsElapsed + n,
      costEscalation: s.costEscalation + escalationPerMonth * n,
    };
  }),
```

- [ ] **Step 3: Update the state test for the rename**

In `tests/game/state.test.ts`, find the test `'tickYear adds 1 year + cost escalation'` and replace with:

```ts
  it('tickMonths(12) adds 12 months + ~5% annual cost escalation', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    useGameStore.getState().tickMonths(12);
    const s = useGameStore.getState();
    expect(s.monthsElapsed).toBe(12);
    // hard = 60 * 560k * 1.0 = 33.6M
    // annual escalation = 33.6M * 0.05 * (1 + 0.27 + 0.05) = 33.6M * 0.05 * 1.32 = 2,217,600
    expect(s.costEscalation).toBeCloseTo(2_217_600, -3);
  });

  it('tickMonths(3) adds 3 months + 1/4 of annual escalation', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    useGameStore.getState().tickMonths(3);
    const s = useGameStore.getState();
    expect(s.monthsElapsed).toBe(3);
    expect(s.costEscalation).toBeCloseTo(2_217_600 / 4, -3);
  });
```

- [ ] **Step 4: Migrate Header consumer**

In `src/components/Header.tsx`, find:
```ts
  const yearsElapsed = useGameStore((s) => s.yearsElapsed);
```
Replace with:
```ts
  const monthsElapsed = useGameStore((s) => s.monthsElapsed);
```

Find the bottom-right span:
```tsx
      <span className="ml-auto">
        Year <b className="text-ink tabular">{(yearsElapsed + phase * 0.2).toFixed(1)}</b> · Phase <b className="text-ink">{phase} / 6 — {phaseNames[phase]}</b>
      </span>
```

Replace with (full `TimelinePill` integration comes in Task 4; this is a temporary holdover so the Header keeps compiling):
```tsx
      <span className="ml-auto">
        Months <b className="text-ink tabular">{monthsElapsed}</b> · Phase <b className="text-ink">{phase} / 6 — {phaseNames[phase]}</b>
      </span>
```

(Leave `phaseNames` unchanged for now — no caller advances to phase 7 in Phase 1. Phase 2 will add the GapResolution screen and reshuffle indices then.)

- [ ] **Step 5: Migrate screen consumers**

In `src/screens/ProForma.tsx`, find:
```ts
  const tickYear = useGameStore((s) => s.tickYear);
```
Replace with:
```ts
  const tickMonths = useGameStore((s) => s.tickMonths);
```

Find `onAdvance`:
```ts
  function onAdvance() {
    tickYear();
    advancePhase();
  }
```
Replace with:
```ts
  function onAdvance() {
    tickMonths(12);
    advancePhase();
  }
```

In `src/screens/CapitalStack.tsx`, find:
```ts
  const tickYear = useGameStore((s) => s.tickYear);
```
Replace with:
```ts
  const tickMonths = useGameStore((s) => s.tickMonths);
```

Find `onSubmitLihtc`:
```ts
    submitLihtc(win);
    tickYear();
```
Replace with:
```ts
    submitLihtc(win);
    tickMonths(12);
```

In `src/screens/Entitlement.tsx`, find:
```ts
  const tickYear = useGameStore((s) => s.tickYear);
```
Replace with:
```ts
  const tickMonths = useGameStore((s) => s.tickMonths);
```

Find `onChoose`:
```ts
  function onChoose(choice: StepChoiceKey) {
    takeStep(choice);
    tickYear();
  }
```
Replace with (Task 18 will refine per-step durations; this is a holdover that calls `tickMonths(12)` to preserve old behavior until then):
```ts
  function onChoose(choice: StepChoiceKey) {
    takeStep(choice);
    tickMonths(12);
  }
```

In `src/screens/Close.tsx`, find:
```ts
  const yearsElapsed = useGameStore((s) => s.yearsElapsed);
```
Replace with:
```ts
  const monthsElapsed = useGameStore((s) => s.monthsElapsed);
```

Find the success-message line in the result block:
```tsx
            ? `${n.name} ${project.buildingType} broke ground in Year ${yearsElapsed.toFixed(0)}. ${finalUnits} homes on the way.`
```
Replace with:
```tsx
            ? `${n.name} ${project.buildingType} broke ground after ${formatElapsed(monthsElapsed)}. ${finalUnits} homes on the way.`
```

Find the Journey `<ul>` block:
```tsx
          <ul className="list-disc pl-5 text-sm space-y-1 text-muted">
            <li>Year 1 — Site &amp; Pro Forma. {n.name} at {project.units} units, {proForma.finishLevel} finish.</li>
            <li>Year {Math.max(1, yearsElapsed - 2).toFixed(0)} — 9% LIHTC {stack.lihtcAwarded ? 'awarded' : 'denied'}.</li>
            <li>Year {Math.max(2, yearsElapsed - 1).toFixed(0)} — Community engagement, alder relationship, financing assembled.</li>
            <li>Year {yearsElapsed.toFixed(0)} — Closed at ${totalCommitted(stack.awarded).toLocaleString()} stack composition.</li>
          </ul>
```
Replace with:
```tsx
          <ul className="list-disc pl-5 text-sm space-y-1 text-muted">
            <li>Month 1 — Site &amp; Pro Forma. {n.name} at {project.units} units, {proForma.finishLevel} finish.</li>
            <li>Month {Math.max(1, monthsElapsed - 24)} — 9% LIHTC {stack.lihtcAwarded ? 'awarded' : 'denied'}.</li>
            <li>Month {Math.max(2, monthsElapsed - 12)} — Community engagement, alder relationship, financing assembled.</li>
            <li>Month {monthsElapsed} — Closed at ${totalCommitted(stack.awarded).toLocaleString()} stack composition.</li>
          </ul>
```

(The leading `$` before `{totalCommitted(...)}` is a literal dollar sign in the rendered output, not template-string syntax.)

Add the `formatElapsed` import at the top of `src/screens/Close.tsx`:
```ts
import { formatElapsed } from '../util/formatElapsed';
```

- [ ] **Step 6: Run the full suite**

Run: `npm test`
Expected: all tests green, including the two new `tickMonths` tests and the rest of the suite. If any test still references `yearsElapsed` or `tickYear`, the test runner will surface a TypeScript error — fix that test by following the same rename pattern.

- [ ] **Step 7: Run a build to catch TS errors that tests miss**

Run: `npm run build`
Expected: clean build, no TS errors. If a component still references `yearsElapsed` it will fail here.

- [ ] **Step 8: Commit**

```bash
git add src/game/types.ts src/game/state.ts tests/game/state.test.ts src/components/Header.tsx src/screens/ProForma.tsx src/screens/CapitalStack.tsx src/screens/Entitlement.tsx src/screens/Close.tsx
git commit -m "phase-1: replace yearsElapsed with monthsElapsed + tickMonths action"
```

---

## Task 4: `TimelinePill` component + integrate into Header

Replaces the hand-rolled Year/Phase display in the Header with a small reusable pill that shows `📅 1 yr 6 mo`.

**Files:**
- Create: `src/components/TimelinePill.tsx`
- Create: `tests/components/TimelinePill.test.tsx`
- Modify: `src/components/Header.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/components/TimelinePill.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimelinePill } from '../../src/components/TimelinePill';

describe('TimelinePill', () => {
  it('renders 0 months as "0 mo"', () => {
    render(<TimelinePill months={0} />);
    expect(screen.getByText(/0 mo/)).toBeTruthy();
  });

  it('renders 18 months as "1 yr 6 mo"', () => {
    render(<TimelinePill months={18} />);
    expect(screen.getByText(/1 yr 6 mo/)).toBeTruthy();
  });

  it('includes the calendar emoji', () => {
    render(<TimelinePill months={12} />);
    expect(screen.getByText(/📅/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the failing test**

Run: `npm test -- tests/components/TimelinePill.test.tsx`
Expected: FAIL with "Failed to resolve import" — source doesn't exist.

- [ ] **Step 3: Implement `TimelinePill`**

Create `src/components/TimelinePill.tsx`:

```tsx
import { formatElapsed } from '../util/formatElapsed';

interface TimelinePillProps {
  months: number;
}

export function TimelinePill({ months }: TimelinePillProps) {
  return (
    <span className="inline-flex items-center gap-1 bg-bg border border-line rounded-full px-2 py-0.5 text-xs tabular">
      📅 <b className="text-ink">{formatElapsed(months)}</b>
    </span>
  );
}
```

- [ ] **Step 4: Verify test passes**

Run: `npm test -- tests/components/TimelinePill.test.tsx`
Expected: PASS.

- [ ] **Step 5: Integrate into Header**

In `src/components/Header.tsx`, add import:
```tsx
import { TimelinePill } from './TimelinePill';
```

Find the ml-auto span from Task 3 step 4:
```tsx
      <span className="ml-auto">
        Months <b className="text-ink tabular">{monthsElapsed}</b> · Phase <b className="text-ink">{phase} / 7 — {phaseNames[phase]}</b>
      </span>
```

Replace with:
```tsx
      <span className="ml-auto flex items-center gap-2">
        <TimelinePill months={monthsElapsed} />
        <span>Phase <b className="text-ink">{phase} / 6 — {phaseNames[phase]}</b></span>
      </span>
```

(Note: `/ 6` until Phase 2 adds GapResolution; the user-facing phase count stays at 6 during Phase 1.)

- [ ] **Step 6: Run full suite**

Run: `npm test`
Expected: all green.

- [ ] **Step 7: Commit**

```bash
git add src/components/TimelinePill.tsx tests/components/TimelinePill.test.tsx src/components/Header.tsx
git commit -m "phase-1: add TimelinePill component to Header"
```

---

## Task 5: AMI tier change — drop 50%, compress multipliers, rebalance default

Three-tier set (`30 | 60 | 80`) is the new shape. Multipliers compress (`30:4, 60:1.75, 80:1`); default breakdown becomes `30:12, 60:36, 80:12`.

**Files:**
- Modify: `src/game/types.ts` (AmiBand, multipliers)
- Modify: `src/game/state.ts` (initial amiBreakdown)
- Modify: `src/data/amiRents.ts` (drop 50)
- Modify: `src/game/proForma.ts` (drop 50 from loops)
- Modify: `src/game/scoring.ts` (drop 50 from loop)
- Modify: `tests/game/proForma.test.ts` (update fixtures)
- Modify: `tests/game/state.test.ts` (already updated in Task 3; verify it still passes)
- Modify: `tests/data/amiRents.test.ts` (drop 50 test)
- Modify: `tests/data/aro.test.ts` (only if it references 50; check)
- Modify: `src/screens/ProForma.tsx` (slider list)
- Modify: `src/screens/Close.tsx` (affordability bar)

- [ ] **Step 1: Write failing test for new multipliers**

In `tests/game/scoring.test.ts`, add a new test block at the bottom:

```ts
describe('AMI_SCORE_MULTIPLIERS — compressed 3-tier', () => {
  it('30% weighted heaviest', () => {
    const score = computeImpactScore({
      closed: true,
      amiBreakdown: { 30: 10, 60: 0, 80: 0 },
    });
    expect(score).toBe(40); // 10 * 4
  });

  it('60% mid weight (1.75)', () => {
    const score = computeImpactScore({
      closed: true,
      amiBreakdown: { 30: 0, 60: 10, 80: 0 },
    });
    expect(score).toBe(17.5);
  });

  it('80% baseline weight (1)', () => {
    const score = computeImpactScore({
      closed: true,
      amiBreakdown: { 30: 0, 60: 0, 80: 10 },
    });
    expect(score).toBe(10);
  });
});
```

- [ ] **Step 2: Run, expect TypeScript errors**

Run: `npm test -- tests/game/scoring.test.ts`
Expected: FAIL with TS errors — `AmiBand` still includes 50, breakdown object missing key 50, etc.

- [ ] **Step 3: Update types**

In `src/game/types.ts`, find:
```ts
export type AmiBand = 30 | 50 | 60 | 80;
```
Replace with:
```ts
export type AmiBand = 30 | 60 | 80;
```

Find `AMI_SCORE_MULTIPLIERS`:
```ts
export const AMI_SCORE_MULTIPLIERS: Record<AmiBand, number> = {
  30: 4,
  50: 2.5,
  60: 1.5,
  80: 1,
};
```
Replace with:
```ts
export const AMI_SCORE_MULTIPLIERS: Record<AmiBand, number> = {
  30: 4,
  60: 1.75,
  80: 1,
};
```

- [ ] **Step 4: Update initial state's default breakdown**

In `src/game/state.ts`, find:
```ts
  proForma: {
    amiBreakdown: { 30: 12, 50: 12, 60: 30, 80: 6 },
```
Replace with:
```ts
  proForma: {
    amiBreakdown: { 30: 12, 60: 36, 80: 12 },
```

Also update `setUnits` (around line 86) — find the rebalance block:
```ts
    const newBreakdown = {
      30: Math.round(s.proForma.amiBreakdown[30] * ratio),
      50: Math.round(s.proForma.amiBreakdown[50] * ratio),
      60: Math.round(s.proForma.amiBreakdown[60] * ratio),
      80: Math.round(s.proForma.amiBreakdown[80] * ratio),
    };
```
Replace with:
```ts
    const newBreakdown = {
      30: Math.round(s.proForma.amiBreakdown[30] * ratio),
      60: Math.round(s.proForma.amiBreakdown[60] * ratio),
      80: Math.round(s.proForma.amiBreakdown[80] * ratio),
    };
```

- [ ] **Step 5: Drop 50 from amiRents and proForma/scoring loops**

In `src/data/amiRents.ts`, change:
```ts
const RENT_BY_AMI: Record<AmiBand, number> = {
  30: 625,
  50: 1_040,
  60: 1_250,
  80: 1_665,
};
```
to:
```ts
const RENT_BY_AMI: Record<AmiBand, number> = {
  30: 625,
  60: 1_250,
  80: 1_665,
};
```

In `src/game/proForma.ts`, find the two for-loops over AMI bands:
```ts
  for (const ami of [30, 50, 60, 80] as AmiBand[]) {
```
Replace both with:
```ts
  for (const ami of [30, 60, 80] as AmiBand[]) {
```

Also find `weightedAvgAmi`:
```ts
  const sum = (30 * breakdown[30]) + (50 * breakdown[50]) + (60 * breakdown[60]) + (80 * breakdown[80]);
```
Replace with:
```ts
  const sum = (30 * breakdown[30]) + (60 * breakdown[60]) + (80 * breakdown[80]);
```

In `src/game/scoring.ts`, find:
```ts
  for (const ami of [30, 50, 60, 80] as AmiBand[]) {
```
Replace with:
```ts
  for (const ami of [30, 60, 80] as AmiBand[]) {
```

- [ ] **Step 6: Update existing AMI tests**

In `tests/data/amiRents.test.ts`, remove the test `'returns 50% AMI rent'` entirely.

In `tests/game/proForma.test.ts`, update the `weightedAvgAmi` and `isLihtcEligible` tests:

```ts
describe('weightedAvgAmi', () => {
  it('all 60% AMI → 60', () => {
    expect(weightedAvgAmi({ 30: 0, 60: 60, 80: 0 })).toBe(60);
  });

  it('balanced 30/60/80 mix → 58', () => {
    // 12×30 + 36×60 + 12×80 = 360 + 2160 + 960 = 3480
    // / 60 = 58
    expect(weightedAvgAmi({ 30: 12, 60: 36, 80: 12 })).toBe(58);
  });
});

describe('isLihtcEligible', () => {
  it('average ≤ 60% AMI → eligible', () => {
    expect(isLihtcEligible({ 30: 12, 60: 36, 80: 12 })).toBe(true);
  });

  it('average > 60% AMI → not eligible', () => {
    expect(isLihtcEligible({ 30: 0, 60: 20, 80: 40 })).toBe(false);
  });
});
```

Also update the `computeNoi` test in the same file — find:
```ts
      amiBreakdown: { 30: 0, 50: 0, 60: 60, 80: 0 },
```
Replace with:
```ts
      amiBreakdown: { 30: 0, 60: 60, 80: 0 },
```

Also update the existing tests in `tests/game/scoring.test.ts`. Replace the file body (everything inside `describe('computeImpactScore', ...)`) with:

```ts
  it('not closed → 0 regardless of mix', () => {
    expect(computeImpactScore({
      closed: false,
      amiBreakdown: { 30: 60, 60: 0, 80: 0 },
    })).toBe(0);
  });

  it('all-60% mix, 60 units → 60 × 1.75 = 105', () => {
    expect(computeImpactScore({
      closed: true,
      amiBreakdown: { 30: 0, 60: 60, 80: 0 },
    })).toBe(105);
  });

  it('default balanced 12/36/12 mix → 48 + 63 + 12 = 123', () => {
    expect(computeImpactScore({
      closed: true,
      amiBreakdown: { 30: 12, 60: 36, 80: 12 },
    })).toBe(123);
  });

  it('deep mix (30 at 30% + 30 at 60%) → 120 + 52.5 = 172.5', () => {
    expect(computeImpactScore({
      closed: true,
      amiBreakdown: { 30: 30, 60: 30, 80: 0 },
    })).toBe(172.5);
  });
```

If `tests/data/aro.test.ts` references AmiBand 50, drop the reference. (Run the suite to surface this.)

- [ ] **Step 7: Update ProForma slider list**

In `src/screens/ProForma.tsx`, find:
```tsx
            {[30, 50, 60, 80].map((ami) => {
```
Replace with:
```tsx
            {[30, 60, 80].map((ami) => {
```

- [ ] **Step 8: Update Close affordability bar**

In `src/screens/Close.tsx`, find:
```tsx
            {([30, 50, 60, 80] as AmiBand[]).map((ami) => {
              const count = proForma.amiBreakdown[ami];
              const pct = (count / finalUnits) * 100;
              if (pct < 0.5) return null;
              const color = ami === 30 ? 'bg-gap' : ami === 50 ? 'bg-caution' : ami === 60 ? 'bg-accent' : 'bg-debt';
```
Replace with:
```tsx
            {([30, 60, 80] as AmiBand[]).map((ami) => {
              const count = proForma.amiBreakdown[ami];
              const pct = (count / finalUnits) * 100;
              if (pct < 0.5) return null;
              const color = ami === 30 ? 'bg-gap' : ami === 60 ? 'bg-accent' : 'bg-debt';
```

- [ ] **Step 9: Run full suite + build**

Run: `npm test`
Expected: all green including the three new multiplier tests.

Run: `npm run build`
Expected: clean build.

- [ ] **Step 10: Commit**

```bash
git add src/game/types.ts src/game/state.ts src/data/amiRents.ts src/game/proForma.ts src/game/scoring.ts tests/game/scoring.test.ts tests/game/proForma.test.ts tests/data/amiRents.test.ts src/screens/ProForma.tsx src/screens/Close.tsx
git commit -m "phase-1: AMI tier change to 30/60/80 with compressed multipliers"
```

---

## Task 6: Add `hasCboPartner` and `cboTimePaid` to project state

Promotes the CBO-partner flag from hardcoded `true` to a player-controlled choice with a one-time `+6 mo` cost that the state tracks so the cost can't be dodged via revise paths in Phase 2.

**Files:**
- Modify: `src/game/types.ts` (GameState.project)
- Modify: `src/game/state.ts` (initial state, new action)
- Modify: `tests/game/state.test.ts` (new tests)

- [ ] **Step 1: Write failing test for new action**

In `tests/game/state.test.ts`, append:

```ts
  it('starts with hasCboPartner=false and cboTimePaid=false', () => {
    const s = useGameStore.getState();
    expect(s.project.hasCboPartner).toBe(false);
    expect(s.project.cboTimePaid).toBe(false);
  });

  it('setCboPartner(true) the first time pays 6 months and sets cboTimePaid', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    useGameStore.getState().setCboPartner(true);
    const s = useGameStore.getState();
    expect(s.project.hasCboPartner).toBe(true);
    expect(s.project.cboTimePaid).toBe(true);
    expect(s.monthsElapsed).toBe(6);
  });

  it('setCboPartner(false) then setCboPartner(true) only pays the 6 months once', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    useGameStore.getState().setCboPartner(true);
    useGameStore.getState().setCboPartner(false);
    useGameStore.getState().setCboPartner(true);
    const s = useGameStore.getState();
    expect(s.project.hasCboPartner).toBe(true);
    expect(s.project.cboTimePaid).toBe(true);
    expect(s.monthsElapsed).toBe(6); // unchanged after first payment
  });
```

- [ ] **Step 2: Run, expect TS errors**

Run: `npm test -- tests/game/state.test.ts`
Expected: FAIL with TS errors on `hasCboPartner`, `cboTimePaid`, `setCboPartner`.

- [ ] **Step 3: Update GameState type**

In `src/game/types.ts`, find:
```ts
  project: {
    neighborhood: NeighborhoodId | null;
    units: number;
    buildingType: BuildingType;
    intent: Intent;
  };
```
Replace with:
```ts
  project: {
    neighborhood: NeighborhoodId | null;
    units: number;
    buildingType: BuildingType;
    intent: Intent;
    hasCboPartner: boolean;
    cboTimePaid: boolean;
  };
```

- [ ] **Step 4: Update initial state and add action**

In `src/game/state.ts`, find:
```ts
  project: {
    neighborhood: null,
    units: 60,
    buildingType: 'midrise',
    intent: 'all-affordable',
  },
```
Replace with:
```ts
  project: {
    neighborhood: null,
    units: 60,
    buildingType: 'midrise',
    intent: 'all-affordable',
    hasCboPartner: false,
    cboTimePaid: false,
  },
```

In the `StoreActions` interface, add (after `setIntent`):
```ts
  setCboPartner: (value: boolean) => void;
```

In the store body, add (after `setIntent` action):
```ts
  setCboPartner: (value) => {
    const s = get();
    set({
      project: {
        ...s.project,
        hasCboPartner: value,
        cboTimePaid: s.project.cboTimePaid || value,
      },
    });
    // Charge +6 mo the first time CBO is enabled
    if (value && !s.project.cboTimePaid) {
      get().tickMonths(6);
    }
  },
```

- [ ] **Step 5: Run tests**

Run: `npm test -- tests/game/state.test.ts`
Expected: PASS (all three new CBO tests + existing tests still green).

- [ ] **Step 6: Run full suite**

Run: `npm test`
Expected: all green. Other tests don't construct GameState directly so they won't break.

- [ ] **Step 7: Commit**

```bash
git add src/game/types.ts src/game/state.ts tests/game/state.test.ts
git commit -m "phase-1: add hasCboPartner + cboTimePaid to project state"
```

---

## Task 7: Update `computeLihtcScore` signature — `hasCboPartner` from input

Removes the hardcoded `true` in CapitalStack and lets ProForma compute a projected score too.

**Files:**
- Modify: `src/game/capitalStack.ts` (already has hasCboPartner in input type — just verify, no signature change needed)
- Modify: `src/screens/CapitalStack.tsx` (read from state)

- [ ] **Step 1: Check current signature**

`computeLihtcScore` already takes `hasCboPartner: boolean` as part of its input object (see `src/game/capitalStack.ts`). No source-code change to the function itself is needed.

- [ ] **Step 2: Update the CapitalStack caller**

In `src/screens/CapitalStack.tsx`, find:
```ts
  const lihtcScore = computeLihtcScore({
    weightedAvgAmi: weightedAvgAmi(proForma.amiBreakdown),
    hasCboPartner: true,
    hasLeverageCommitments: stack.awarded.length >= 2,
    neighborhood: project.neighborhood,
  });
```
Replace with:
```ts
  const lihtcScore = computeLihtcScore({
    weightedAvgAmi: weightedAvgAmi(proForma.amiBreakdown),
    hasCboPartner: project.hasCboPartner,
    hasLeverageCommitments: stack.awarded.length >= 2,
    neighborhood: project.neighborhood,
  });
```

- [ ] **Step 3: Run full suite + build**

Run: `npm test && npm run build`
Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add src/screens/CapitalStack.tsx
git commit -m "phase-1: computeLihtcScore reads hasCboPartner from project state"
```

---

## Task 8: `CharacterIntroCard` component

Reusable, larger-format character card used for Marcus banker intro on Pro Forma and David Park intro on Capital Stack. Larger than the existing `CharacterBubble`, with avatar, name, role/affiliation, and a paragraph body.

**Files:**
- Create: `src/components/CharacterIntroCard.tsx`
- Create: `tests/components/CharacterIntroCard.test.tsx`

- [ ] **Step 1: Write failing test**

Create `tests/components/CharacterIntroCard.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CharacterIntroCard } from '../../src/components/CharacterIntroCard';

describe('CharacterIntroCard', () => {
  it('renders avatar, name, role, and body', () => {
    render(
      <CharacterIntroCard
        avatar="🏦"
        name="Marcus Bell"
        role="Construction Lender, Loop Federal Bank"
        body={<p>Test body content.</p>}
      />,
    );
    expect(screen.getByText('🏦')).toBeTruthy();
    expect(screen.getByText('Marcus Bell')).toBeTruthy();
    expect(screen.getByText(/Construction Lender/)).toBeTruthy();
    expect(screen.getByText('Test body content.')).toBeTruthy();
  });

  it('accepts an optional footer', () => {
    render(
      <CharacterIntroCard
        avatar="🏛️"
        name="David Park"
        role="DOH"
        body={<p>Body</p>}
        footer={<p>Footer note</p>}
      />,
    );
    expect(screen.getByText('Footer note')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `npm test -- tests/components/CharacterIntroCard.test.tsx`
Expected: FAIL on import.

- [ ] **Step 3: Implement**

Create `src/components/CharacterIntroCard.tsx`:

```tsx
import { ReactNode } from 'react';

interface CharacterIntroCardProps {
  avatar: string;
  name: string;
  role: string;
  body: ReactNode;
  footer?: ReactNode;
}

export function CharacterIntroCard({ avatar, name, role, body, footer }: CharacterIntroCardProps) {
  return (
    <div className="bg-bg border-l-4 border-accent rounded-lg p-3 flex gap-3 text-sm">
      <div className="text-3xl leading-none">{avatar}</div>
      <div className="flex-1">
        <div>
          <b className="text-ink">{name}</b>
          <span className="text-muted"> · {role}</span>
        </div>
        <div className="mt-2">{body}</div>
        {footer && <div className="mt-2">{footer}</div>}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify tests pass**

Run: `npm test -- tests/components/CharacterIntroCard.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/CharacterIntroCard.tsx tests/components/CharacterIntroCard.test.tsx
git commit -m "phase-1: add CharacterIntroCard component"
```

---

## Task 9: Update Marcus and David characters

Rename Marcus → Marcus Bell with a real title and bank affiliation. Add `dscrExplain` line. Rename David → David Park with DOH title and add a `capitalStackIntro` paragraph for his three-rule frame.

**Files:**
- Modify: `src/data/characters.ts`
- Optionally update tests if any reference Marcus/David labels (run suite to check).

- [ ] **Step 1: Update characters map**

In `src/data/characters.ts`, find:
```ts
  marcus: { id: 'marcus', name: 'Marcus', emoji: '🏦', role: 'Banker' },
```
Replace with:
```ts
  marcus: { id: 'marcus', name: 'Marcus Bell', emoji: '🏦', role: 'Construction Lender, Loop Federal Bank' },
```

Find:
```ts
  david:  { id: 'david', name: 'David', emoji: '🏛️', role: 'DOH analyst' },
```
Replace with:
```ts
  david:  { id: 'david', name: 'David Park', emoji: '🏛️', role: 'Senior Analyst, Chicago Department of Housing' },
```

- [ ] **Step 2: Add new dialogue lines**

In the same file, find `marcusLines`:
```ts
export const marcusLines = {
  dscrLimited: '...',
  ltvLimited: '...',
  generic: '...',
};
```

Replace the whole `marcusLines` block with:
```ts
export const marcusLines = {
  dscrLimited:
    'Honestly, my loan barely matters here. At 60% AMI rents the income only supports a small piece — and that\'s most of what any bank will give you on this deal. The real work is in front of you: IHDA, DOH, TIF, and credits.',
  ltvLimited:
    'Your value\'s healthy enough that I could lend more on paper, but the income still has to service it. We\'re LTV-limited, not DSCR — that\'s a rare position for affordable.',
  generic:
    'Your project pencils on the income side. Let me know when you\'re ready to close the construction loan.',
  intro:
    "I'll size your loan against the income. The bank rule is Debt Service Coverage Ratio (DSCR) ≥ 1.20 — you have to generate at least 20% more rent than the loan needs each year.",
  walkthroughClosing: (loan: number, tdc: number) =>
    `Translation: I can lend you about $${(loan / 1_000_000).toFixed(1)}M against a $${(tdc / 1_000_000).toFixed(0)}M project. The other $${((tdc - loan) / 1_000_000).toFixed(0)}M is where the work gets real.`,
};
```

Find `davidLines`:
```ts
export const davidLines = {
  dohWelcome: 'DOH is on board ...',
};
```

Replace with:
```ts
export const davidLines = {
  dohWelcome:
    "DOH is on board with your profile. We'll need a coherent stack before final commitment — show me what else you're lining up.",
  capitalStackIntro:
    "Putting this together is what we call assembling the capital stack — soft loans, grants, tax credits, and equity stacked to your TDC. Three rules: every source closes more of the gap; every source takes time, and time is money (hard costs escalate ~5%/year); past 5 sources, complexity penalty kicks in at ~$20k/unit per extra source. The art is closing the gap with the smallest, fastest set of sources you can.",
};
```

- [ ] **Step 3: Run full suite + build**

Run: `npm test && npm run build`
Expected: all green. Character roster changes shouldn't break any tests (no test asserts exact character.name strings).

- [ ] **Step 4: Commit**

```bash
git add src/data/characters.ts
git commit -m "phase-1: rename Marcus Bell, David Park; add intro + walkthrough lines"
```

---

## Task 10: Drop stabilized value display from Pro Forma

Pure UI cleanup. The math line stays — only the display row is removed.

**Files:**
- Modify: `src/screens/ProForma.tsx`

- [ ] **Step 1: Edit ProForma.tsx**

In `src/screens/ProForma.tsx`, find the NOI & supportable debt panel block:
```tsx
            <div className="text-sm mt-2 space-y-1 tabular">
              <div className="flex justify-between"><span>NOI</span><b>${(noi / 1000).toFixed(0)}k</b></div>
              <div className="flex justify-between"><span>Stabilized value (NOI ÷ 6%)</span><b>${(stabilizedValue / 1_000_000).toFixed(1)}M</b></div>
              <div className="flex justify-between"><span>Supportable debt <span className="text-caution text-xs">({debt.binding}-limited)</span></span><b>${(debt.amount / 1_000_000).toFixed(1)}M</b></div>
            </div>
```

Replace with:
```tsx
            <div className="text-sm mt-2 space-y-1 tabular">
              <div className="flex justify-between"><span>NOI (annual)</span><b>${(noi / 1000).toFixed(0)}k</b></div>
              <div className="flex justify-between"><span>Supportable debt <span className="text-caution text-xs">({debt.binding}-limited)</span></span><b>${(debt.amount / 1_000_000).toFixed(1)}M</b></div>
            </div>
```

(Note: the `stabilizedValue` const is still computed and still passed into `computeSupportableDebt` — only its display row is removed.)

- [ ] **Step 2: Run smoke test + build**

Run: `npm test && npm run build`
Expected: all green.

- [ ] **Step 3: Commit**

```bash
git add src/screens/ProForma.tsx
git commit -m "phase-1: drop stabilized value display from Pro Forma (math kept internal)"
```

---

## Task 11: Add Marcus banker intro card with DSCR walk-through to Pro Forma

Replaces the existing `CharacterBubble` Marcus line on Pro Forma with a `CharacterIntroCard` at the top of the right column. Includes the math walk-through.

**Files:**
- Modify: `src/screens/ProForma.tsx`

- [ ] **Step 1: Compute the walkthrough numbers**

In `src/screens/ProForma.tsx`, after the existing math (around the `const debt = ...` block), add (right after the `const debt =` line, but before the return):

```ts
  // DSCR walk-through numbers for Marcus card
  const dscrRequired = 1.20;
  const annualRate = 0.065;
  const amortYears = 30;
  const cashForDebtService = noi / dscrRequired;
  const k = (() => {
    const i = annualRate / 12;
    const nMonths = amortYears * 12;
    return 12 * (i / (1 - Math.pow(1 + i, -nMonths)));
  })();
```

- [ ] **Step 2: Add imports**

At the top of `src/screens/ProForma.tsx`, add:
```ts
import { CharacterIntroCard } from '../components/CharacterIntroCard';
```

(Existing import `marcusLines` already present.)

- [ ] **Step 3: Insert the card at the top of the right column**

Find the start of the right column:
```tsx
        {/* RIGHT — math */}
        <div className="space-y-3">
          <div className="bg-panel border border-line rounded-lg p-3">
            <div className="text-xs uppercase tracking-wider text-accent font-bold">TDC bottom-up</div>
```

Insert the Marcus card *before* the TDC panel. The right column should become:

```tsx
        {/* RIGHT — math */}
        <div className="space-y-3">
          <CharacterIntroCard
            avatar="🏦"
            name="Marcus Bell"
            role="Construction Lender, Loop Federal Bank"
            body={<p>{marcusLines.intro}</p>}
            footer={
              <div className="bg-panel border border-line rounded p-2 text-xs tabular">
                <div className="text-muted uppercase tracking-wider mb-1">DSCR walk-through</div>
                <div className="flex justify-between"><span>NOI (annual)</span><b>${(noi / 1000).toFixed(0)}k</b></div>
                <div className="flex justify-between"><span>÷ Required DSCR ({dscrRequired.toFixed(2)})</span><b>${(cashForDebtService / 1000).toFixed(0)}k</b></div>
                <div className="flex justify-between"><span>÷ Annual mortgage constant ({k.toFixed(4)})</span><b>${(debt.amount / 1_000_000).toFixed(1)}M</b></div>
                <div className="border-t border-line mt-1 pt-1 flex justify-between"><b>Supportable loan</b><b>${(debt.amount / 1_000_000).toFixed(1)}M</b></div>
                <div className="text-muted mt-2 italic">{marcusLines.walkthroughClosing(debt.amount, tdcTotal)}</div>
              </div>
            }
          />
          <div className="bg-panel border border-line rounded-lg p-3">
            <div className="text-xs uppercase tracking-wider text-accent font-bold">TDC bottom-up</div>
```

- [ ] **Step 4: Remove the redundant existing CharacterBubble**

Find and **delete** this line (Marcus's IntroCard at the top of the right column replaces it as his only voice on Pro Forma):
```tsx
          <CharacterBubble characterId="marcus" line={debt.binding === 'DSCR' ? marcusLines.dscrLimited : marcusLines.ltvLimited} />
```

If the `CharacterBubble` import is now unused, remove it from the imports at the top of the file.

- [ ] **Step 5: Run smoke + build**

Run: `npm test && npm run build`
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add src/screens/ProForma.tsx
git commit -m "phase-1: add Marcus banker intro card + DSCR walk-through to Pro Forma"
```

---

## Task 12: Add QAP projected score card to Pro Forma

Bottom-of-right-column projected QAP score, using `computeLihtcScore` with `hasLeverageCommitments: true`. Reuses `janelleLines.qapScore*` for character commentary.

**Files:**
- Modify: `src/screens/ProForma.tsx`

- [ ] **Step 1: Add imports**

In `src/screens/ProForma.tsx`, ensure these imports exist (most already do; add the missing ones):

```ts
import { computeLihtcScore, estimatedAwardProbability } from '../game/capitalStack';
import { janelleLines, characters } from '../data/characters';
```

- [ ] **Step 2: Compute projected score**

After the existing math block (the same area where you added DSCR walkthrough variables), add:

```ts
  const projectedQapScore = computeLihtcScore({
    weightedAvgAmi: avgAmi,
    hasCboPartner: project.hasCboPartner,
    hasLeverageCommitments: true,
    neighborhood: project.neighborhood,
  });
  const projectedQapOdds = estimatedAwardProbability(projectedQapScore);
  const projectedQapLine =
    projectedQapScore < 50 ? janelleLines.qapScoreLow :
    projectedQapScore < 75 ? janelleLines.qapScoreMid :
    janelleLines.qapScoreHigh;
```

- [ ] **Step 3: Insert the card**

In the right column, after the gap div (`<div className="bg-gap text-white p-4 rounded-lg">...`), add the QAP projection card just before the advance button:

```tsx
          <div className="bg-panel border border-line rounded-lg p-3">
            <div className="text-xs uppercase tracking-wider text-accent font-bold">{characters.janelle.emoji} 9% LIHTC — projected QAP score</div>
            <div className="mt-2 flex justify-between items-baseline">
              <div className="text-3xl font-bold tabular">{projectedQapScore} <span className="text-muted text-base">/ 100</span></div>
              <div className="text-right">
                <div className="text-xs uppercase text-muted tracking-wider">Est. award probability</div>
                <div className="text-lg font-bold tabular">{(projectedQapOdds * 100).toFixed(0)}%</div>
              </div>
            </div>
            <div className="text-xs text-muted italic mt-1">Projection assumes you assemble a typical stack on the next screen.</div>
            <div className="text-xs text-muted mt-2"><b>{characters.janelle.emoji} {characters.janelle.name}:</b> "{projectedQapLine}"</div>
          </div>
```

- [ ] **Step 4: Run smoke + build**

Run: `npm test && npm run build`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add src/screens/ProForma.tsx
git commit -m "phase-1: add Janelle QAP projected score card to Pro Forma"
```

---

## Task 13: Add David Park intro card to top of Capital Stack

Inserts a `CharacterIntroCard` with the three-rule frame at the very top of CapitalStack.

**Files:**
- Modify: `src/screens/CapitalStack.tsx`

- [ ] **Step 1: Add imports**

In `src/screens/CapitalStack.tsx`, add:
```ts
import { CharacterIntroCard } from '../components/CharacterIntroCard';
import { davidLines, characters } from '../data/characters';
```

- [ ] **Step 2: Insert the card immediately under `<h2>`**

Find:
```tsx
      <Header />
      <h2 className="text-2xl mt-6 mb-4">Capital Stack</h2>

      {/* Gap status */}
```

Insert between `<h2>` and the gap-status comment:
```tsx
      <Header />
      <h2 className="text-2xl mt-6 mb-4">Capital Stack</h2>

      <div className="mb-3">
        <CharacterIntroCard
          avatar={characters.david.emoji}
          name={characters.david.name}
          role={characters.david.role}
          body={<p>{davidLines.capitalStackIntro}</p>}
        />
      </div>

      {/* Gap status */}
```

- [ ] **Step 3: Run smoke + build**

Run: `npm test && npm run build`
Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add src/screens/CapitalStack.tsx
git commit -m "phase-1: add David Park intro card to top of Capital Stack"
```

---

## Task 14: Add CBO partner choice (step 5) to Site & Concept

New step on SiteAndConcept that calls `setCboPartner`. Reads from `project.hasCboPartner` for selection state.

**Files:**
- Modify: `src/screens/SiteAndConcept.tsx`

- [ ] **Step 1: Add action import**

In `src/screens/SiteAndConcept.tsx`, find the existing store-action selectors:
```ts
  const setIntent = useGameStore((s) => s.setIntent);
```
After it, add:
```ts
  const setCboPartner = useGameStore((s) => s.setCboPartner);
```

- [ ] **Step 2: Add the step 5 UI block**

Find the Intent block and the button that follows:
```tsx
          {/* Intent */}
          <div className="text-xs uppercase tracking-wider text-accent font-bold mb-2">4. Intent</div>
          <div className="grid grid-cols-2 gap-2 mb-6">
            ...
          </div>

          <button
            onClick={advancePhase}
```

Insert a new step 5 block between the Intent grid and the advance button:

```tsx
          {/* CBO partner */}
          <div className="text-xs uppercase tracking-wider text-accent font-bold mb-2">5. CBO partner</div>
          <div className="grid grid-cols-2 gap-2 mb-6">
            <button
              onClick={() => setCboPartner(true)}
              className={`p-2 text-xs rounded border-2 transition text-left ${
                project.hasCboPartner ? 'bg-bg border-accent' : 'bg-panel border-line hover:border-accent'
              }`}
            >
              <b>🤝 Partner with a CBO</b>
              <div className="text-muted mt-1">+18 QAP · +6 community at entitlement start · +6 mo pre-app time</div>
            </button>
            <button
              onClick={() => setCboPartner(false)}
              className={`p-2 text-xs rounded border-2 transition text-left ${
                !project.hasCboPartner ? 'bg-bg border-accent' : 'bg-panel border-line hover:border-accent'
              }`}
            >
              <b>Go solo</b>
              <div className="text-muted mt-1">Faster start, but you'll need to earn community support cold.</div>
            </button>
          </div>
```

- [ ] **Step 3: Run smoke + build**

Run: `npm test && npm run build`
Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add src/screens/SiteAndConcept.tsx
git commit -m "phase-1: add CBO partner choice (step 5) to Site & Concept"
```

---

## Task 15: Entitlement step durations + per-choice time labels

Replaces the uniform `tickMonths(12)` per step with per-step durations (6/9/3/3) and adds an inline `+X mo · +$Y.YM cost escalation` label on each choice card.

**Files:**
- Modify: `src/components/ChoiceCard.tsx` (add optional time label slot)
- Modify: `src/screens/Entitlement.tsx` (per-step `tickMonths` + label data)
- Modify: `tests/components/ChoiceCard.test.tsx` (new test for time label)

- [ ] **Step 1: Extend ChoiceCard props with optional time label**

In `src/components/ChoiceCard.tsx`, replace the whole file with:

```tsx
interface ChoiceCardProps {
  title: string;
  description: string;
  consequences: string;
  timeLabel?: string;
  selected?: boolean;
  onClick: () => void;
}

export function ChoiceCard({ title, description, consequences, timeLabel, selected = false, onClick }: ChoiceCardProps) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-3 rounded-lg border-2 transition w-full ${
        selected ? 'bg-bg border-caution' : 'bg-panel border-line hover:border-accent'
      }`}
    >
      <div className="font-bold text-sm">{title}</div>
      <div className="text-muted text-xs mt-1">{description}</div>
      <div className="text-equity text-xs mt-2">{consequences}</div>
      {timeLabel && <div className="text-caution text-xs mt-1 tabular">{timeLabel}</div>}
    </button>
  );
}
```

- [ ] **Step 2: Write failing test for ChoiceCard timeLabel**

Create `tests/components/ChoiceCard.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChoiceCard } from '../../src/components/ChoiceCard';

describe('ChoiceCard', () => {
  it('renders timeLabel when provided', () => {
    render(
      <ChoiceCard
        title="Test"
        description="d"
        consequences="c"
        timeLabel="+6 mo · +$0.4M cost escalation"
        onClick={() => {}}
      />,
    );
    expect(screen.getByText(/\+6 mo/)).toBeTruthy();
  });

  it('omits timeLabel block when not provided', () => {
    const { container } = render(
      <ChoiceCard title="Test" description="d" consequences="c" onClick={() => {}} />,
    );
    expect(container.querySelector('.text-caution')).toBeNull();
  });
});
```

- [ ] **Step 3: Run, expect PASS**

Run: `npm test -- tests/components/ChoiceCard.test.tsx`
Expected: PASS (since the implementation is already in place from Step 1).

- [ ] **Step 4: Wire per-step durations in Entitlement**

In `src/screens/Entitlement.tsx`, add a duration table at the top of the file (after imports, before `STEP_NAMES`):

```ts
const STEP_DURATIONS: Record<number, number> = {
  1: 6,  // pre-app
  2: 9,  // community
  3: 3,  // zoning committee
  4: 3,  // finance committee
};
```

Find `onChoose`:
```ts
  function onChoose(choice: StepChoiceKey) {
    takeStep(choice);
    tickMonths(12);
  }
```
Replace with:
```ts
  function onChoose(choice: StepChoiceKey) {
    const months = STEP_DURATIONS[entitlement.currentStep] ?? 0;
    takeStep(choice);
    tickMonths(months);
  }
```

- [ ] **Step 5: Render time labels on each step's choices**

Still in `src/screens/Entitlement.tsx`, the existing render loop is:

```tsx
            {STEP_CHOICES[currentStep].map((c) => (
              <ChoiceCard
                key={c.key}
                title={c.title}
                description={c.description}
                consequences={c.consequences}
                onClick={() => onChoose(c.key)}
              />
            ))}
```

Replace with:

```tsx
            {STEP_CHOICES[currentStep].map((c) => {
              const months = STEP_DURATIONS[currentStep] ?? 0;
              const hardPerU = HARD_COST_PER_UNIT[project.buildingType] * FINISH_MULTIPLIER[proForma.finishLevel];
              const hard = hardPerU * project.units;
              const escThisStep = hard * (COST_ESCALATION_PER_YEAR / 12) * months * (1 + SOFT_COST_RATIO + CONTINGENCY_RATIO);
              const timeLabel = `+${months} mo · +$${(escThisStep / 1_000_000).toFixed(1)}M cost escalation`;
              return (
                <ChoiceCard
                  key={c.key}
                  title={c.title}
                  description={c.description}
                  consequences={c.consequences}
                  timeLabel={timeLabel}
                  onClick={() => onChoose(c.key)}
                />
              );
            })}
```

Add the proForma selector and constants to the imports at the top:

```ts
import { useGameStore } from '../game/state';
import { resolveEntitlementPath } from '../game/entitlement';
import { getNeighborhood } from '../data/neighborhoods';
import { Header } from '../components/Header';
import { Meter } from '../components/Meter';
import { ChoiceCard } from '../components/ChoiceCard';
import { CharacterBubble } from '../components/CharacterBubble';
import { ashaLines, financeAttackLines } from '../data/characters';
import {
  StepChoiceKey,
  HARD_COST_PER_UNIT,
  FINISH_MULTIPLIER,
  SOFT_COST_RATIO,
  CONTINGENCY_RATIO,
  COST_ESCALATION_PER_YEAR,
} from '../game/types';
```

And add the proForma selector near the top of the component body:
```ts
  const proForma = useGameStore((s) => s.proForma);
```

- [ ] **Step 6: Run full suite + build**

Run: `npm test && npm run build`
Expected: all green.

- [ ] **Step 7: Commit**

```bash
git add src/components/ChoiceCard.tsx tests/components/ChoiceCard.test.tsx src/screens/Entitlement.tsx
git commit -m "phase-1: per-step entitlement durations + time labels on choices"
```

---

## Task 16: Apply community-support bonus when CBO partner is selected

The spec's CBO choice promises `+6 community support at entitlement start`. Apply that delta when transitioning from Site & Concept to entitlement-relevant state. Simplest implementation: on `setCboPartner(true)` immediately bump `entitlement.communitySupport` (since the choice is locked at Site & Concept anyway, no resequencing needed).

**Files:**
- Modify: `src/game/state.ts` (setCboPartner)
- Modify: `tests/game/state.test.ts` (new test)

- [ ] **Step 1: Write failing test**

In `tests/game/state.test.ts`, append:

```ts
  it('setCboPartner(true) first time bumps community support by 6', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    const before = useGameStore.getState().entitlement.communitySupport;
    useGameStore.getState().setCboPartner(true);
    const after = useGameStore.getState().entitlement.communitySupport;
    expect(after).toBe(before + 6);
  });

  it('setCboPartner(false) then setCboPartner(true) bumps community only once', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    const before = useGameStore.getState().entitlement.communitySupport;
    useGameStore.getState().setCboPartner(true);
    useGameStore.getState().setCboPartner(false);
    useGameStore.getState().setCboPartner(true);
    expect(useGameStore.getState().entitlement.communitySupport).toBe(before + 6);
  });
```

- [ ] **Step 2: Run, expect FAIL**

Run: `npm test -- tests/game/state.test.ts`
Expected: FAIL on the community-support assertion.

- [ ] **Step 3: Update setCboPartner**

In `src/game/state.ts`, replace the `setCboPartner` action with:

```ts
  setCboPartner: (value) => {
    const s = get();
    const firstTimeOn = value && !s.project.cboTimePaid;
    set({
      project: {
        ...s.project,
        hasCboPartner: value,
        cboTimePaid: s.project.cboTimePaid || value,
      },
      entitlement: firstTimeOn
        ? {
            ...s.entitlement,
            communitySupport: Math.min(100, s.entitlement.communitySupport + 6),
          }
        : s.entitlement,
    });
    if (firstTimeOn) {
      get().tickMonths(6);
    }
  },
```

- [ ] **Step 4: Run tests**

Run: `npm test -- tests/game/state.test.ts`
Expected: PASS.

- [ ] **Step 5: Run full suite + build**

Run: `npm test && npm run build`
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add src/game/state.ts tests/game/state.test.ts
git commit -m "phase-1: CBO partner first-time selection bumps community support +6"
```

---

## Task 17: Smoke playthrough on dev server and deploy

Pre-deploy verification gate. No code change; this is a manual checklist + the deploy push.

**Files:** none.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: Vite prints a localhost URL. Open in browser.

- [ ] **Step 2: Manual playthrough checklist**

Click through the game start to finish, verifying:
- [ ] Header shows timeline pill (`📅 0 mo` initially, increments after each phase advance)
- [ ] Site & Concept: step 5 "CBO partner" appears with two cards; selecting "Partner with a CBO" highlights the card and (after navigating Pro Forma) timeline shows +6 mo
- [ ] Pro Forma: Marcus banker intro card visible at top of right column with DSCR walk-through and walkthroughClosing line
- [ ] Pro Forma: AMI sliders show only 30/60/80 (no 50% row)
- [ ] Pro Forma: NOI & supportable debt panel shows no "Stabilized value" line
- [ ] Pro Forma: QAP projected score card at bottom shows score / 100, est. probability, and Janelle commentary
- [ ] Capital Stack: David Park intro card visible at top with three-rule frame
- [ ] Capital Stack: QAP score and odds display consistent with Pro Forma's projection direction (capital stack value typically slightly different since hasLeverageCommitments depends on awards in-flight)
- [ ] Entitlement: each step's choice cards show a `+X mo · +$Y.YM cost escalation` label (6 mo for pre-app, 9 mo for community, 3 mo for committees)
- [ ] Entitlement: completing all 4 steps takes total ~21 mo elapsed (down from 48)
- [ ] Close: affordability bar shows only 30/60/80 slices; "Year X" references replaced with `formatElapsed`-style strings

- [ ] **Step 3: Stop dev server, run final test + build**

Run: `npm test && npm run build`
Expected: all green; clean build.

- [ ] **Step 4: Push to main (auto-deploys via Cloudflare)**

```bash
git push origin main
```

Expected: Cloudflare picks up the commit and deploys. Wait for the deploy to finish (visible in Cloudflare dashboard or by re-visiting the live URL after a minute).

- [ ] **Step 5: Smoke-test the live URL**

Open `https://housing-developer-game.dhertz.workers.dev/` and click through one playthrough quickly. Confirm the same checklist items as Step 2 work in production.

- [ ] **Step 6: Update handoff**

Update `~/.claude/handoffs/housing-developer-game.md` to reflect Phase 1 shipped. Suggested content:

```markdown
# Handoff: Chicago Affordable Housing Developer Game — 2026-06-04

## Last Session
Phase 1 of the v2 Polish & Mechanics spec shipped and deployed. Months-based time model, 30/60/80 AMI tiers, CBO partner choice, Marcus + David Park intro cards, Pro Forma QAP preview, entitlement durations + time labels, timeline pill in header.

## Open Follow-ups (Phase 2)
- Revise sub-screens (cut costs, increase QAP odds) on Capital Stack
- QAP rejection recovery (Submit Again + Revise buttons)
- GapResolution screen (3 resolution buttons) with state and effects

## Open Follow-ups (Phase 3)
- Close screen stakeholder reactions (4 voices on success, failure-specific on shelve)
- Marcus on Capital Stack source card
- "What just happened" recap card component

## Context for Next Session
Phase 1 done. Plan in `docs/superpowers/plans/2026-06-04-housing-game-v2-phase1-foundation.md`. Spec in `docs/superpowers/specs/2026-06-04-housing-game-polish-and-mechanics-design.md`. Next: brainstorm Phase 2 implementation plan from the same spec.
```

Then commit:
```bash
# from the housing developer game dir
git add ~/.claude/handoffs/housing-developer-game.md  # if your handoffs dir is gitted; otherwise just save the file
```

(The handoffs directory is outside the project — save the file manually if it's not under version control.)

---

## Self-Review

After completing all tasks, the engineer should have:
- 6 new files (`formatElapsed.ts`, `TimelinePill.tsx`, `CharacterIntroCard.tsx`, and 3 new test files)
- ~9 modified source files (types, state, two characters file changes, four screens, header)
- ~10 modified test files
- New tests added for: formatElapsed, tickMonths, CBO partner state, TimelinePill, CharacterIntroCard, ChoiceCard timeLabel, compressed AMI multipliers, community support bonus
- Test count: ~70 (up from 59)
- Three commits per task on average, 17 logical tasks total
- One feature deployed end-to-end with a clean playthrough

### Spec coverage check

| Spec requirement | Plan task |
|------------------|-----------|
| Phase enum widened to 1-7 | Task 2 |
| `monthsElapsed` + `tickMonths` | Task 3 |
| `formatElapsed` utility | Task 1 |
| AMI tier change to 30/60/80 + compressed multipliers | Task 5 |
| Default AMI breakdown `30:12, 60:36, 80:12` | Task 5 |
| `hasCboPartner` + `cboTimePaid` state | Task 6 |
| `setCboPartner` first-time `+6 mo` cost | Task 6 |
| `setCboPartner` first-time `+6 community support` | Task 16 |
| `computeLihtcScore` reads `hasCboPartner` from input | Task 7 |
| `CharacterIntroCard` component | Task 8 |
| Marcus → Marcus Bell + Loop Federal title | Task 9 |
| David → David Park + DOH title | Task 9 |
| Drop stabilized value display | Task 10 |
| Marcus banker intro card on Pro Forma | Task 11 |
| DSCR walk-through panel | Task 11 |
| QAP projected score card on Pro Forma | Task 12 |
| David Park intro card on Capital Stack | Task 13 |
| CBO partner choice on Site & Concept | Task 14 |
| Entitlement step durations 6/9/3/3 | Task 15 |
| Time labels on entitlement choices | Task 15 |
| `TimelinePill` in Header | Task 4 |

All Phase 1 spec requirements have a task. No placeholders, no TBDs in the body.

### Known Phase-1 deferrals (intentional)

These spec items are NOT in Phase 1 — they belong to Phase 2 or 3 and will be planned separately:
- New GapResolution screen and routing logic
- Revise sub-screens (cut-costs, QAP-odds) and Capital Stack revise toolbar
- QAP rejection recovery (Submit Again + Revise buttons)
- `lihtcResubmits`, `lihtcRevisions`, `gapResolution.*` state fields
- Close stakeholder reactions
- `RecapCard` component
- Marcus on Capital Stack source card
- `shelved-stack` terminus button on GapResolution
- All gap-resolution game-logic effects

If a future phase adds the GapResolution screen at phase index 5, the Header `phaseNames` array and `/ 7` denominator should be updated at that time.
