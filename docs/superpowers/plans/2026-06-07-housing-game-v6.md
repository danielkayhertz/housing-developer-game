# Housing Developer Game v6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship v6 — one canonical gap/TDC formula across all surfaces, outcome-aware "what happened?" narratives, Bug 12 regression coverage, Pilsen icon, +25% market rents, and removal of stale v2/MVP labels.

**Architecture:** Make `computeEffectiveGap` (in `gapResolution.ts`) the single source of truth for every gap and TDC figure by deriving its cost base from `computeTdcFromState` (fixing a land-multiplier discrepancy), then route Header / ProForma / CapitalStack through it. Extend the existing `recapNarratives` table with LIHTC win/loss variants and a density-variance entry, selecting the key via small pure helpers.

**Tech Stack:** React 19 + Vite + TypeScript + Tailwind v4 + Zustand; Vitest + @testing-library/react; deploy via Cloudflare Workers Assets.

---

## Environment setup (every task)

Node is not on the bash PATH on this machine. Prefix shell sessions with:

```bash
export PATH="/c/Users/bpi/tools/node-v22.14.0-win-x64:$PATH"
cd "/c/Users/bpi/Documents/Claude Code/Housing Developer Game"
```

- Run a single test file: `node_modules/.bin/vitest run tests/<path>`
- Run full suite: `node_modules/.bin/vitest run`
- Typecheck + build: `node_modules/.bin/tsc -b && node_modules/.bin/vite build`

Work happens on branch `v6` (already created and checked out).

---

## File Structure

| File | Responsibility | Change |
|------|----------------|--------|
| `src/game/gapResolution.ts` | Canonical gap + TDC breakdown | Modify — derive cost base from `computeTdcFromState` |
| `src/components/Header.tsx` | Top status bar (units/TDC/gap) | Modify — route through `computeEffectiveGap` |
| `src/screens/ProForma.tsx` | Pro-forma gap preview | Modify — route gap through `computeEffectiveGap` |
| `src/screens/CapitalStack.tsx` | Stack assembly + advance gate + LIHTC narratives | Modify — gap gate canonical; LIHTC win/loss keys |
| `src/data/characters.ts` | `recapNarratives` table + resolver | Modify — LIHTC win/loss + density-variance entries |
| `src/game/entitlement.ts` | Entitlement path/failure logic | Modify — add `resolveEntitlementRecapKey` helper |
| `src/screens/Entitlement.tsx` | Entitlement screen + onChoose | Modify — single tick, density-variance narrative |
| `src/data/neighborhoods.ts` | Neighborhood profiles | Modify — Pilsen icon, +25% rents |
| `src/screens/SiteAndConcept.tsx` | Setup screen building-type toggles | Modify — remove v2/MVP labels + stale stub note |
| `tests/game/effectiveGap.test.ts` | Canonical gap unit tests | Create |
| `tests/components/Header.test.tsx` | Header display tests | Modify — add canonical match test |
| `tests/screens/Entitlement.shelved.test.tsx` | Bug 12 regression | Create |
| `tests/screens/Close.shelved.test.tsx` | Bug 12 regression | Create |
| `tests/data/recapNarratives.test.ts` | Narrative resolver tests | Modify — LIHTC win/loss + density |
| `tests/game/entitlementRecapKey.test.ts` | Recap-key helper test | Create |
| `tests/data/neighborhoods.test.ts` | Neighborhood data tests | Modify — icon + rents |

---

## Task 1: Make `computeEffectiveGap` the canonical cost base

**Problem:** `computeEffectiveGap` computes `land = n.landCostPerUnit * effectiveUnits`, omitting `LAND_COST_BUILDING_MULTIPLIER` (walkup 1.25, midrise 1.00, larger 0.75). `computeTdcFromState` applies it. So the two disagree for walk-up/larger (masked today only because midrise is the default).

**Files:**
- Test: `tests/game/effectiveGap.test.ts` (create)
- Modify: `src/game/gapResolution.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/game/effectiveGap.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../src/game/state';
import { computeEffectiveGap } from '../../src/game/gapResolution';
import { computeTdcFromState } from '../../src/game/proForma';

describe('computeEffectiveGap canonical cost base', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('tdcBase equals computeTdcFromState.total for a walk-up', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(40);
    useGameStore.getState().setBuildingType('walkup');
    const state = useGameStore.getState();
    const eg = computeEffectiveGap(state);
    expect(eg.tdcBase).toBe(computeTdcFromState(state).total);
  });

  it('land applies the building multiplier (walk-up 1.25)', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(40);
    useGameStore.getState().setBuildingType('walkup');
    const eg = computeEffectiveGap(useGameStore.getState());
    // Englewood land $12,000/u × 1.25 × 40 effective units
    expect(eg.land).toBe(12_000 * 1.25 * 40);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node_modules/.bin/vitest run tests/game/effectiveGap.test.ts`
Expected: FAIL — `eg.land` is `12_000 * 40` (480000), not `600000`; `tdcBase` differs from `computeTdcFromState.total`.

- [ ] **Step 3: Refactor `computeEffectiveGap` to reuse `computeTdcFromState`**

In `src/game/gapResolution.ts`, update the import line and replace the inline land/hard/soft/contingency/tdcBase computation.

Change the import from `./proForma` to include `computeTdcFromState`:

```ts
import { computeNoi, computeSupportableDebt, getEffectiveUnits, effectiveHardPerUnit, computeTdcFromState } from './proForma';
```

Replace the block from `const land = n.landCostPerUnit * effectiveUnits;` through `const tdcBase = land + hard + soft + contingency;` (currently lines 45–49) with:

```ts
  const tdc = computeTdcFromState(state);
  const land = tdc.land;
  const hard = tdc.hard;
  const soft = tdc.soft;
  const contingency = tdc.contingency;
  const tdcBase = tdc.total;
```

Leave everything else (revision penalty, complexity, NOI/debt, committed, gap, return object) unchanged. `effectiveUnits` and `hardPerUnit` are still computed above and still used in the return object.

- [ ] **Step 4: Run test to verify it passes**

Run: `node_modules/.bin/vitest run tests/game/effectiveGap.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the full suite to catch fallout**

Run: `node_modules/.bin/vitest run`
Expected: all tests pass. (Midrise-based tests are unaffected since the multiplier is 1.00 there.)

- [ ] **Step 6: Commit**

```bash
git add src/game/gapResolution.ts tests/game/effectiveGap.test.ts
git commit -m "fix: derive computeEffectiveGap cost base from computeTdcFromState

Eliminates a land-multiplier discrepancy (walkup/larger) and makes
tdcBase consistent with computeTdcFromState.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Route Header through `computeEffectiveGap`

**Problem:** `Header.tsx` hand-rolls its gap as `tdcWithEscalation - totalCommitted(stack.awarded)`, omitting the bank loan, extra subsidy, and complexity penalty — and its TDC omits the land multiplier. This is the surface that diverges from LiveGapRow.

**Files:**
- Test: `tests/components/Header.test.tsx` (modify)
- Modify: `src/components/Header.tsx`

- [ ] **Step 1: Write the failing test**

Append this test inside the existing `describe` block in `tests/components/Header.test.tsx` (add the imports at top if missing):

```ts
import { computeEffectiveGap } from '../../src/game/gapResolution';

// ...inside describe(...)
  it('TDC and gap match computeEffectiveGap (walk-up)', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(40);
    useGameStore.getState().setBuildingType('walkup');
    const eg = computeEffectiveGap(useGameStore.getState());
    render(<Header />);
    const tdcM = (eg.tdcAllIn / 1_000_000).toFixed(1);
    const gapM = (eg.gap / 1_000_000).toFixed(1);
    expect(screen.getByText(new RegExp(`\\$${tdcM}M`))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`\\$${gapM}M`))).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node_modules/.bin/vitest run tests/components/Header.test.tsx`
Expected: FAIL — Header's current TDC (no land multiplier) prints a different `$X.XM` than `eg.tdcAllIn`.

- [ ] **Step 3: Rewrite Header's computation**

In `src/components/Header.tsx`:

Replace the imports block (lines 1–8) with:

```tsx
import { useState } from 'react';
import { useGameStore } from '../game/state';
import { getNeighborhood } from '../data/neighborhoods';
import { computeEffectiveGap } from '../game/gapResolution';
import { TimelinePill } from './TimelinePill';
import { GlossaryPanel } from './GlossaryPanel';
```

Replace the computation block (currently lines 14–23, from `const effectiveUnits = ...` through `const gap = ...`) with:

```tsx
  if (!project.neighborhood) return null;

  const n = getNeighborhood(project.neighborhood);
  const eg = computeEffectiveGap(state);
  const effectiveUnits = eg.effectiveUnits;
  const tdcWithEscalation = eg.tdcAllIn;
  const gap = eg.gap;
```

Remove the now-duplicated `if (!project.neighborhood) return null;` and `const n = ...` lines that followed the old computation (they are folded into the block above). The JSX still references `effectiveUnits`, `tdcWithEscalation`, `gap`, `costEscalation`, and `n` — all still defined (`costEscalation` from the `state` destructure remains).

- [ ] **Step 4: Run test to verify it passes**

Run: `node_modules/.bin/vitest run tests/components/Header.test.tsx`
Expected: PASS.

- [ ] **Step 5: Typecheck (catches unused imports)**

Run: `node_modules/.bin/tsc -b`
Expected: no errors. If `tsc` flags an unused symbol, delete that import.

- [ ] **Step 6: Commit**

```bash
git add src/components/Header.tsx tests/components/Header.test.tsx
git commit -m "fix: route Header TDC/gap through computeEffectiveGap

Header now matches LiveGapRow and the canonical breakdown (includes
bank loan, extra subsidy, complexity penalty, land multiplier).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Route ProForma and CapitalStack gates through `computeEffectiveGap`

**Note:** This is a consistency refactor. At the ProForma phase (no awarded sources, no escalation/penalty) and the CapitalStack phase (extraSubsidy still 0), the numbers are already correct; the goal is to remove the divergent code paths so a future change can't desync them. Tests here are guards, not red-first.

**Files:**
- Modify: `src/screens/ProForma.tsx`
- Modify: `src/screens/CapitalStack.tsx`

- [ ] **Step 1: ProForma — swap gap source**

In `src/screens/ProForma.tsx`:

Add to the import from `../game/gapResolution` (create the import if absent):

```tsx
import { computeEffectiveGap } from '../game/gapResolution';
```

Replace line 64:

```tsx
  const gap = computeGap({ tdc: tdcTotal, costEscalation: 0, supportableDebt: debt.amount });
```

with:

```tsx
  const gap = computeEffectiveGap(state).gap;
```

- [ ] **Step 2: CapitalStack — swap gate gap source**

In `src/screens/CapitalStack.tsx`:

Add to the import from `../game/gapResolution` (create the import if absent):

```tsx
import { computeEffectiveGap } from '../game/gapResolution';
```

Replace the gap block (lines 54–57):

```tsx
  const committed = totalCommitted(stack.awarded) + debt.amount;
  const penaltyEligibleCount = stack.awarded.filter((a) => getSource(a.sourceId).usesComplexityPenalty).length;
  const penalty = complexityPenalty(penaltyEligibleCount, getEffectiveUnits(state));
  const gap = Math.max(0, tdcTotal + penalty - committed);
```

with:

```tsx
  const gap = computeEffectiveGap(state).gap;
```

- [ ] **Step 3: Typecheck and remove now-unused symbols**

Run: `node_modules/.bin/tsc -b`
Expected: `tsc` reports unused imports/locals. In ProForma remove `computeGap` from the `../game/proForma` import. In CapitalStack remove any symbols now unused **only because** the gap block was deleted — likely `complexityPenalty` (from the `../game/capitalStack` import) and `getSource`. Do NOT remove symbols still referenced elsewhere (`totalCommitted`, `getEffectiveUnits`, `computeTdcFromState`, `debt`, `tdcTotal` are all still used). Re-run `tsc -b` until clean.

- [ ] **Step 4: Add guard tests**

Append to `tests/components/Header.test.tsx` a cross-surface guard (lightweight, store-level):

```ts
  it('CapitalStack-phase gap equals canonical after awarding a source', () => {
    useGameStore.getState().reset();
    useGameStore.getState().selectNeighborhood('pilsen');
    useGameStore.getState().setUnits(50);
    useGameStore.getState().awardSource({ sourceId: 'tif', amount: 2_000_000, daysSpent: 0 });
    const eg = computeEffectiveGap(useGameStore.getState());
    expect(eg.committed).toBeGreaterThan(eg.bankLoan); // award + debt both counted
    expect(eg.gap).toBe(Math.max(0, eg.tdcAllIn - eg.committed));
  });
```

- [ ] **Step 5: Run full suite + build**

Run: `node_modules/.bin/vitest run && node_modules/.bin/tsc -b && node_modules/.bin/vite build`
Expected: all green, build clean.

- [ ] **Step 6: Commit**

```bash
git add src/screens/ProForma.tsx src/screens/CapitalStack.tsx tests/components/Header.test.tsx
git commit -m "refactor: route ProForma + CapitalStack gap through computeEffectiveGap

Single canonical gap formula across every surface; removes divergent
hand-rolled gap math.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Bug 12 regression tests (verify shelved ≠ approved)

**Finding:** Already fixed in v5. The Entitlement screen shows "pulled the ordinance" for `shelved-finance`/`shelved-community`, and the Council-vote panel is gated on `outcome === 'in-progress'`. These tests lock that behavior so it can't regress.

**Files:**
- Test: `tests/screens/Entitlement.shelved.test.tsx` (create)
- Test: `tests/screens/Close.shelved.test.tsx` (create)

- [ ] **Step 1: Write the Entitlement regression test**

Create `tests/screens/Entitlement.shelved.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Entitlement } from '../../src/screens/Entitlement';
import { useGameStore } from '../../src/game/state';
import { Outcome } from '../../src/game/types';

function seedShelved(outcome: Outcome) {
  useGameStore.getState().reset();
  useGameStore.getState().selectNeighborhood('englewood');
  useGameStore.getState().setUnits(50);
  useGameStore.setState((s) => ({
    outcome,
    entitlement: {
      ...s.entitlement,
      pastChoices: [{ step: 4, choice: 'finance-reframe', alderDelta: -2, communityDelta: 0 }],
    },
  }));
}

describe('Bug 12 — shelved entitlement shows the ordinance pulled, not approved', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('shelved-finance: pulled the ordinance, no Council-vote success', () => {
    seedShelved('shelved-finance');
    render(<Entitlement />);
    expect(screen.getByText(/pulled the ordinance/i)).toBeInTheDocument();
    expect(screen.queryByText(/Council vote \(narrative\)/i)).toBeNull();
    expect(screen.queryByText(/passed the ordinance/i)).toBeNull();
  });

  it('shelved-community: pulled the ordinance', () => {
    seedShelved('shelved-community');
    render(<Entitlement />);
    expect(screen.getByText(/pulled the ordinance/i)).toBeInTheDocument();
    expect(screen.queryByText(/Council vote \(narrative\)/i)).toBeNull();
  });
});
```

- [ ] **Step 2: Write the Close regression test**

Create `tests/screens/Close.shelved.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Close } from '../../src/screens/Close';
import { useGameStore } from '../../src/game/state';

describe('Bug 12 — Close shows shelved, not closed, for failures', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('shelved-finance shows the shelved header and not success', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(50);
    useGameStore.setState({ outcome: 'shelved-finance' });
    render(<Close />);
    expect(screen.getByText(/The project was shelved\./)).toBeInTheDocument();
    expect(screen.queryByText(/You closed\./)).toBeNull();
  });
});
```

- [ ] **Step 3: Run the tests**

Run: `node_modules/.bin/vitest run tests/screens/Entitlement.shelved.test.tsx tests/screens/Close.shelved.test.tsx`
Expected: PASS. If either FAILS, the bug is live — fix the failing narrative in `src/screens/Entitlement.tsx` so the shelved branch reads "Ald. <name> pulled the ordinance" and ensure the success panel stays gated on `outcome === 'in-progress'`, then re-run.

- [ ] **Step 4: Commit**

```bash
git add tests/screens/Entitlement.shelved.test.tsx tests/screens/Close.shelved.test.tsx
git commit -m "test: lock Bug 12 — shelved entitlement never shows approval

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Outcome-aware LIHTC narratives (win vs. loss)

**Problem:** `lihtcSubmit`/`lihtcResubmit`/`lihtcRevise` give the same recap line whether the QAP round is won or lost. Split into win/loss variants that explain *why*.

**Files:**
- Modify: `src/data/characters.ts`
- Modify: `src/screens/CapitalStack.tsx`
- Test: `tests/data/recapNarratives.test.ts` (modify)

- [ ] **Step 1: Update the resolver test (red)**

In `tests/data/recapNarratives.test.ts`, replace the final test (lines 35–40, the `lihtcSubmit` test) with:

```ts
  it('returns janelle-spoken narrative for lihtcSubmit win/loss', () => {
    useGameStore.getState().reset();
    useGameStore.getState().selectNeighborhood('englewood');
    const win = resolveRecapNarrative(useGameStore.getState(), 'lihtcSubmit-win');
    const loss = resolveRecapNarrative(useGameStore.getState(), 'lihtcSubmit-loss');
    expect(win!.characterId).toBe('janelle');
    expect(loss!.characterId).toBe('janelle');
    expect(win!.line).not.toBe(loss!.line);
  });
```

- [ ] **Step 2: Run to verify it fails**

Run: `node_modules/.bin/vitest run tests/data/recapNarratives.test.ts`
Expected: FAIL — `lihtcSubmit-win`/`lihtcSubmit-loss` are not in the table yet (resolver returns null).

- [ ] **Step 3: Replace the three LIHTC entries with six variants**

In `src/data/characters.ts`, in the `recapNarratives` table, replace the three lines under the `// LIHTC` comment (the `lihtcSubmit` / `lihtcResubmit` / `lihtcRevise` entries) with:

```ts
  // LIHTC — outcome-aware
  'lihtcSubmit-win': { category: 'janelle', line: "Your application scored above the cutoff — the AMI depth and the project readiness carried it. The 9% allocation is yours. The catch is the calendar: a full year passed waiting for the QAP round to resolve." },
  'lihtcSubmit-loss': { category: 'janelle', line: "The round was competitive and your score landed under the cutoff. No allocation this cycle. To improve next time, deepen the AMI mix or add a CBO partner — and you've already lost twelve months." },
  'lihtcResubmit-win': { category: 'janelle', line: "Resubmitting unchanged paid off — the reviewer pool shifted and your score cleared this year. Allocation secured, twelve months later." },
  'lihtcResubmit-loss': { category: 'janelle', line: "Same application, same result — the score wasn't competitive enough and you lost another twelve months. Without changes, the next round is the same bet." },
  'lihtcRevise-win': { category: 'janelle', line: "The revisions worked: deeper affordability, a stronger CBO letter, cleaner exhibits pushed you over the cutoff. Allocation awarded — at the cost of a year and the rework." },
  'lihtcRevise-loss': { category: 'janelle', line: "Even with the revisions the round stayed out of reach this cycle. The reworked application is stronger for next time, but that's another twelve months gone." },
```

- [ ] **Step 4: Pass the win/loss key from CapitalStack**

In `src/screens/CapitalStack.tsx`, update the three submit handlers:

`onSubmitLihtc` (currently line 89):
```tsx
    tickMonths(12, resolveRecapNarrative(state, win ? 'lihtcSubmit-win' : 'lihtcSubmit-loss') ?? undefined);
```

`onSubmitAgain` (currently line 98):
```tsx
    tickMonths(12, resolveRecapNarrative(state, win ? 'lihtcResubmit-win' : 'lihtcResubmit-loss') ?? undefined);
```

`onResubmitFromRevise` (currently line 107):
```tsx
    tickMonths(12, resolveRecapNarrative(state, win ? 'lihtcRevise-win' : 'lihtcRevise-loss') ?? undefined);
```

- [ ] **Step 5: Run tests to verify pass**

Run: `node_modules/.bin/vitest run tests/data/recapNarratives.test.ts && node_modules/.bin/tsc -b`
Expected: PASS, no type errors.

- [ ] **Step 6: Commit**

```bash
git add src/data/characters.ts src/screens/CapitalStack.tsx tests/data/recapNarratives.test.ts
git commit -m "feat: outcome-aware LIHTC recap narratives (win vs loss)

Explains why the QAP round was won or lost and the lever to pull next.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Density-variance narrative + recap-key helper

**Problem:** For the larger-building zoning step, `tickMonths(DENSITY_VARIANCE_MONTHS)` runs with no narrative and is immediately overwritten by the choice tick. Merge into one tick and give it a narrative that explains the committee's density-variance condition.

**Files:**
- Modify: `src/game/entitlement.ts`
- Modify: `src/data/characters.ts`
- Modify: `src/screens/Entitlement.tsx`
- Test: `tests/game/entitlementRecapKey.test.ts` (create)

- [ ] **Step 1: Write the helper test (red)**

Create `tests/game/entitlementRecapKey.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { resolveEntitlementRecapKey } from '../../src/game/entitlement';

describe('resolveEntitlementRecapKey', () => {
  it('routes larger building at the zoning step to densityVariance', () => {
    expect(resolveEntitlementRecapKey('larger', 3, 'zoning-hold')).toBe('densityVariance');
  });

  it('uses the choice key for non-larger buildings', () => {
    expect(resolveEntitlementRecapKey('midrise', 3, 'zoning-hold')).toBe('zoning-hold');
  });

  it('uses the choice key for larger buildings outside the zoning step', () => {
    expect(resolveEntitlementRecapKey('larger', 2, 'community-story')).toBe('community-story');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node_modules/.bin/vitest run tests/game/entitlementRecapKey.test.ts`
Expected: FAIL — `resolveEntitlementRecapKey` is not exported.

- [ ] **Step 3: Add the helper**

In `src/game/entitlement.ts`, add (ensure `BuildingType` and `StepChoiceKey` are imported from `./types`):

```ts
export function resolveEntitlementRecapKey(
  buildingType: BuildingType,
  currentStep: number,
  choice: StepChoiceKey,
): string {
  if (currentStep === 3 && buildingType === 'larger') return 'densityVariance';
  return choice;
}
```

- [ ] **Step 4: Add the densityVariance narrative entry**

In `src/data/characters.ts`, in `recapNarratives`, add under the zoning-committee group:

```ts
  'densityVariance': { category: 'david', line: "The committee attached a density-variance condition — height modulation, a setback tweak, a façade study. It adds review months and pushes your hard costs up before you can advance to the vote." },
```

- [ ] **Step 5: Run helper + resolver smoke**

Run: `node_modules/.bin/vitest run tests/game/entitlementRecapKey.test.ts`
Expected: PASS.

- [ ] **Step 6: Merge the ticks in Entitlement.onChoose**

In `src/screens/Entitlement.tsx`:

Add `resolveEntitlementRecapKey` to the import from `../game/entitlement`:

```tsx
import { resolveEntitlementPath, EntitlementPath, isCommitteeFailed, resolveEntitlementRecapKey } from '../game/entitlement';
```

Replace the body of `onChoose` from the density block through the choice tick (currently lines 137–147) with:

```tsx
    const months = currentStep != null ? durationFor(currentStep, choice) : 0;
    takeStep(choice, currentStep ?? 1);

    // Larger building: auto-apply density variance condition at zoning step
    let densityMonths = 0;
    if (currentStep === 3 && project.buildingType === 'larger') {
      const conditionCost = DENSITY_VARIANCE_TDC_PER_UNIT * project.units;
      addCostEscalation(conditionCost);
      densityMonths = DENSITY_VARIANCE_MONTHS;
    }

    // Multilingual outreach adds 3 months of extra community engagement time
    const extraMonths = choice === 'preapp-multilingual' ? 3 : 0;
    const recapKey = resolveEntitlementRecapKey(project.buildingType, currentStep ?? 1, choice);
    const narrative = resolveRecapNarrative(useGameStore.getState(), recapKey);
    tickMonths(months + extraMonths + densityMonths, narrative ?? undefined);
```

(The committee-gate block that follows — lines 149–159 — is unchanged.)

- [ ] **Step 7: Typecheck, build, full suite**

Run: `node_modules/.bin/tsc -b && node_modules/.bin/vitest run`
Expected: clean + all green.

- [ ] **Step 8: Commit**

```bash
git add src/game/entitlement.ts src/data/characters.ts src/screens/Entitlement.tsx tests/game/entitlementRecapKey.test.ts
git commit -m "feat: density-variance recap narrative for larger buildings

Single tick per choice; the larger-building zoning condition now gets a
'why' narrative instead of a silent, overwritten tick.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Pilsen icon → 🏘️

**Files:**
- Modify: `src/data/neighborhoods.ts`
- Test: `tests/data/neighborhoods.test.ts` (modify)

- [ ] **Step 1: Add the failing assertion**

In `tests/data/neighborhoods.test.ts`, inside the Pilsen test (the `it('Pilsen starts at 65/35 ...')` block), add:

```ts
    expect(n.emoji).toBe('🏘️');
```

- [ ] **Step 2: Run to verify it fails**

Run: `node_modules/.bin/vitest run tests/data/neighborhoods.test.ts`
Expected: FAIL — emoji is still `🌮`.

- [ ] **Step 3: Change the icon**

In `src/data/neighborhoods.ts`, in the Pilsen profile, change `emoji: '🌮',` to `emoji: '🏘️',`.

- [ ] **Step 4: Run to verify it passes**

Run: `node_modules/.bin/vitest run tests/data/neighborhoods.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/neighborhoods.ts tests/data/neighborhoods.test.ts
git commit -m "feat: replace Pilsen taco icon with rowhouses

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Market rents +25%

**Files:**
- Modify: `src/data/neighborhoods.ts`
- Test: `tests/data/neighborhoods.test.ts` (modify)

- [ ] **Step 1: Update the rent assertions (red)**

In `tests/data/neighborhoods.test.ts`:
- Pilsen test: change `expect(n.marketRentPerUnit).toBe(2_100);` → `expect(n.marketRentPerUnit).toBe(2_625);`
- Jefferson Park test: change `expect(n.marketRentPerUnit).toBe(2_900);` → `expect(n.marketRentPerUnit).toBe(3_625);`
- Albany Park test: change `expect(n.marketRentPerUnit).toBe(1_800);` → `expect(n.marketRentPerUnit).toBe(2_250);`

- [ ] **Step 2: Run to verify it fails**

Run: `node_modules/.bin/vitest run tests/data/neighborhoods.test.ts`
Expected: FAIL on all three rent assertions.

- [ ] **Step 3: Update the rents in data**

In `src/data/neighborhoods.ts`, update `marketRentPerUnit`:
- Englewood: `1_150` → `1_438`
- Pilsen: `2_100` → `2_625`
- Jefferson Park: `2_900` → `3_625`
- Albany Park: `1_800` → `2_250`

- [ ] **Step 4: Run to verify it passes**

Run: `node_modules/.bin/vitest run tests/data/neighborhoods.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the full suite (downstream check)**

Run: `node_modules/.bin/vitest run`
Expected: all green. `mixedIncome.test.ts` reads the rent dynamically and only asserts `mixedNoi > baselineNoi`, so it stays green. If any test asserts a stale absolute gap/NOI number, update that expectation to the recomputed value.

- [ ] **Step 6: Commit**

```bash
git add src/data/neighborhoods.ts tests/data/neighborhoods.test.ts
git commit -m "feat: raise market rents 25% across all neighborhoods

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 9: Remove stale v2/MVP labels

**Files:**
- Modify: `src/screens/SiteAndConcept.tsx`

- [ ] **Step 1: Remove the dimming and badge text on the building-type toggles**

In `src/screens/SiteAndConcept.tsx`:

Change the button `className` (line 106) — remove the trailing `${t !== 'midrise' ? 'opacity-60' : ''}` so it reads:

```tsx
                className={`p-2 text-xs rounded border-2 transition ${
                  project.buildingType === t ? 'bg-bg border-accent' : 'bg-panel border-line hover:border-accent'
                }`}
```

Replace the three label lines (108–110) with:

```tsx
                {t === 'walkup' && <><span>🏠 Walk-up</span><br/><small>2-3 story</small></>}
                {t === 'midrise' && <><span>🏘️ Mid-rise</span><br/><small>4-5 story</small></>}
                {t === 'larger' && <><span>🏢 Larger</span><br/><small>6-8 story</small></>}
```

- [ ] **Step 2: Remove the stale stub-neighborhood note**

Delete the dead `{n.status === 'stub' && ( ... )}` block (lines 169–173) entirely — all four neighborhoods are `mvp`, so it never renders.

- [ ] **Step 3: Typecheck + build**

Run: `node_modules/.bin/tsc -b && node_modules/.bin/vite build`
Expected: clean. (If `n.status` is no longer referenced anywhere and TS flags an unused import, remove it — but `status` is a field on the profile, not an import, so no import change is expected.)

- [ ] **Step 4: Commit**

```bash
git add src/screens/SiteAndConcept.tsx
git commit -m "chore: remove stale v2/MVP labels from building-type toggles

All three building types and all four neighborhoods are live.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 10: Verify items 8/9 — entitlement framing copy

**Goal:** Confirm the v5 entitlement alder-intro and per-step framing match the v3 spec intent; adjust only on divergence.

**Files:**
- Read: `docs/superpowers/specs/2026-06-04-housing-game-content-expansion-design.md`
- Read: `docs/superpowers/specs/2026-06-04-housing-game-jargon-explainers-design.md`
- Possibly modify: `src/screens/Entitlement.tsx`, `src/data/characters.ts`

- [ ] **Step 1: Locate the spec'd framing text**

Search both specs for the entitlement framing language:
```bash
grep -niE "framing|alder intro|community meeting|committee on zoning|committee on finance|pre-app" docs/superpowers/specs/2026-06-04-housing-game-*.md
```

- [ ] **Step 2: Compare against the code**

Compare the spec text to:
- `entitlementIntroLines` in `src/data/characters.ts` (the alder intro, rendered at `Entitlement.tsx` ~195–199).
- The per-step framing `<p>` blocks in `Entitlement.tsx` (~265–279, steps 2/3/4).

- [ ] **Step 3: Reconcile**

If the copy matches the spec intent (conveys the same point, even if reworded), make no change. If it diverges materially from the spec, update the wording in `characters.ts` / `Entitlement.tsx` to match intent. Record the verdict ("matches, no change" or the specific edits) for the handoff.

- [ ] **Step 4: If changed, run tests + commit**

Run: `node_modules/.bin/vitest run` (only if code changed).
```bash
git add -A
git commit -m "docs/copy: reconcile entitlement framing with v3 spec intent

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```
If no change was needed, skip the commit and note the verdict in Task 11.

---

## Task 11: Final verification, playthrough, handoff, merge

**Files:**
- Modify: `~/.claude/handoffs/housing-developer-game.md`
- Modify: `CLAUDE.md` (last-updated line)

- [ ] **Step 1: Full suite + clean build**

Run: `node_modules/.bin/vitest run && node_modules/.bin/tsc -b && node_modules/.bin/vite build`
Expected: all tests pass; build clean. Record the test count.

- [ ] **Step 2: Browser playthrough of all four neighborhoods**

Start the dev server: `node_modules/.bin/vite` (note the localhost URL). For Englewood, Pilsen, Jefferson Park, and Albany Park, verify:
- Gap and TDC in the Header bar agree with the inline ProForma and CapitalStack figures.
- LIHTC win and loss produce distinct "what happened?" recap narratives.
- Pilsen shows 🏘️; the +25% rents flow through mixed-income mode (gaps a bit smaller than before).
- Building-type toggles show no `(v2)`/`· MVP` badges and are not dimmed; no stale "v2 neighborhood" note appears.
- A forced committee failure shows "pulled the ordinance" (not approval) on Entitlement and "shelved" on Close.

Record any defects; fix and re-run Step 1 before proceeding.

- [ ] **Step 3: Update the handoff**

Rewrite `~/.claude/handoffs/housing-developer-game.md` as a **v6** entry: what shipped (the eight items), final test count, the items 8/9 verdict from Task 10, and the remaining excluded queue (localStorage save, PNG result-card download, Spanish toggle, intro/onboarding polish). Update the "Last updated" line in `CLAUDE.md`.

- [ ] **Step 4: Commit the handoff**

```bash
git add CLAUDE.md
git commit -m "docs: update handoff for v6

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```
(The handoff file lives under `~/.claude/`, outside the repo — save it but it is not part of this commit.)

- [ ] **Step 5: Merge to main and push (auto-deploys)**

```bash
git checkout main
git merge --no-ff v6 -m "Merge v6: canonical gap, outcome-aware narratives, icon/rents/label cleanup"
git push origin main
```

Confirm the Cloudflare deploy picks up the push, then smoke-test the live URL `https://housing-developer-game.dhertz.workers.dev/`.

---

## Self-Review

**Spec coverage:**
1. Canonical gap formula → Tasks 1–3 ✓ (plus the land-multiplier bug fix the spec's "most complete version" assumption depended on).
2. Bug 12 → Task 4 ✓ (verify + regression, per the finding that it's already fixed).
3. Item 1 outcome-aware narratives → Tasks 5 (LIHTC win/loss) + 6 (density variance) ✓.
4. Pilsen icon → Task 7 ✓.
5. Market rents +25% → Task 8 ✓.
6. Remove v2/MVP badges + stale note → Task 9 ✓.
7. Items 8/9 verification → Task 10 ✓.
8. Browser playthrough → Task 11 Step 2 ✓.

**Placeholder scan:** Every code step shows the actual code/edit. Task 3 Step 3 and Task 9 Step 3 reference tsc-driven unused-symbol removal, but name the expected symbols explicitly — deterministic, not a placeholder. Task 10 is a verification task whose output (verdict/edits) is defined.

**Type consistency:** `resolveEntitlementRecapKey(buildingType, currentStep, choice)` is defined in Task 6 Step 3 and called identically in Step 6. `computeEffectiveGap` fields used (`tdcAllIn`, `gap`, `committed`, `bankLoan`, `effectiveUnits`, `tdcBase`, `land`) all exist on `EffectiveGapBreakdown`. Narrative keys (`lihtcSubmit-win`/`-loss`, etc., `densityVariance`) are defined in the table (Task 5/6) before being referenced (CapitalStack/Entitlement). Store actions used in tests (`reset`, `selectNeighborhood`, `setUnits`, `setBuildingType`, `awardSource`) match existing usage in the codebase.
