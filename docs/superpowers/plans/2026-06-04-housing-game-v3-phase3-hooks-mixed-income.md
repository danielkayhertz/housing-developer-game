# Housing Developer Game v3 — Phase 3 Hooks & Mixed-Income Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land all neighborhood-specific hooks, mixed-income mode mechanics, the ARO floor outcome, and the new character content. Pilsen 30%-AMI bonus; Albany Park multilingual choice + CBO amplification + community cap; Jefferson Park parking choices (replace standard community-step choices); mixed-income market band in Pro Forma; LIHTC funding scaling by affordable share; QAP −12 penalty (mixed-income outside Englewood, marketUnits > 0); `shelved-aro` outcome with David Park line; three new alder records (Carlos Reyes, Frank Kovac, Naila Hassan); per-neighborhood alder closing dispatch; advocate reaction reads `intent`; block-club reaction reads `buildingType`; live Intent row on Site & Concept.

**Architecture:** Game-logic touches in `capitalStack.ts`, `entitlement.ts`, `proForma.ts`, `state.ts`, `Entitlement.tsx`; data additions to `characters.ts` and `closeReactions.ts`; screen-level rendering in `ProForma.tsx`, `CapitalStack.tsx`, `SiteAndConcept.tsx`, `Close.tsx`. No new files.

**Tech Stack:** React 19 + Vite + TypeScript + Tailwind v4 + Zustand. Vitest with jsdom. Baseline after Phase 2: ~155 tests. Target after Phase 3: **~190 tests** (target spec said 155-165 total, but tighter tests per task push us higher).

**Spec:** `docs/superpowers/specs/2026-06-04-housing-game-content-expansion-design.md`
**Prior plans:** Phase 1 (data foundation), Phase 2 (building & entitlement).

---

## Conventions

Same as prior phases. Commits prefixed `phase-3:`. Where a task touches multiple files, the commit message names the primary file.

---

## Task 1: `computeLihtcScore` takes `intent` + `marketUnits`

Extend the function signature. Add the mixed-income penalty: −12 points iff `intent === 'mixed-income'` AND `marketUnits > 0` AND `neighborhood !== 'englewood'`.

**Files:**
- Modify: `src/game/capitalStack.ts`
- Modify: `tests/game/capitalStack.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `tests/game/capitalStack.test.ts`:

```ts
import { computeLihtcScore } from '../../src/game/capitalStack';
import { MIXED_INCOME_QAP_PENALTY } from '../../src/game/types';

describe('computeLihtcScore: mixed-income QAP penalty', () => {
  const base = {
    weightedAvgAmi: 58,
    hasCboPartner: true,
    hasLeverageCommitments: true,
  };

  it('all-affordable: no penalty anywhere', () => {
    const englewood = computeLihtcScore({ ...base, intent: 'all-affordable', marketUnits: 0, neighborhood: 'englewood' });
    const pilsen = computeLihtcScore({ ...base, intent: 'all-affordable', marketUnits: 0, neighborhood: 'pilsen' });
    expect(englewood).toBe(pilsen);  // identical scoring
  });

  it('mixed-income with 0 market units: no penalty (treated as all-affordable for scoring)', () => {
    const scored = computeLihtcScore({ ...base, intent: 'mixed-income', marketUnits: 0, neighborhood: 'pilsen' });
    const allAff = computeLihtcScore({ ...base, intent: 'all-affordable', marketUnits: 0, neighborhood: 'pilsen' });
    expect(scored).toBe(allAff);
  });

  it('mixed-income with market units, non-Englewood: −12 penalty', () => {
    const allAff = computeLihtcScore({ ...base, intent: 'all-affordable', marketUnits: 0, neighborhood: 'pilsen' });
    const mixed = computeLihtcScore({ ...base, intent: 'mixed-income', marketUnits: 6, neighborhood: 'pilsen' });
    expect(allAff - mixed).toBe(MIXED_INCOME_QAP_PENALTY);
  });

  it('mixed-income with market units in Englewood: no penalty (exemption)', () => {
    const allAff = computeLihtcScore({ ...base, intent: 'all-affordable', marketUnits: 0, neighborhood: 'englewood' });
    const mixed = computeLihtcScore({ ...base, intent: 'mixed-income', marketUnits: 6, neighborhood: 'englewood' });
    expect(mixed).toBe(allAff);
  });
});
```

- [ ] **Step 2: Run the failing test**

Run: `npm test -- tests/game/capitalStack.test.ts`
Expected: FAIL — current signature lacks `intent`/`marketUnits`.

- [ ] **Step 3: Edit `src/game/capitalStack.ts`**

Find `computeLihtcScore`. Extend the input signature:

```ts
export function computeLihtcScore(input: {
  weightedAvgAmi: number;
  hasCboPartner: boolean;
  hasLeverageCommitments: boolean;
  neighborhood: NeighborhoodId;
  intent: Intent;          // NEW
  marketUnits: number;     // NEW
}): number {
  // ...existing scoring logic
  let score = /* existing computation */;

  if (
    input.intent === 'mixed-income' &&
    input.marketUnits > 0 &&
    input.neighborhood !== 'englewood'
  ) {
    score -= MIXED_INCOME_QAP_PENALTY;
  }

  return score;
}
```

Update imports:

```ts
import { Intent, NeighborhoodId, MIXED_INCOME_QAP_PENALTY } from './types';
```

Update every existing call site of `computeLihtcScore` to pass `intent` and `marketUnits` (Pro Forma, Capital Stack screens, any other game-logic helpers). For now pass `intent: 'all-affordable'` and `marketUnits: 0` at call sites — Task 2 mixed-income work will plumb the real values.

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: PASS — new tests + suite.

- [ ] **Step 5: Commit**

```bash
git add src/game/capitalStack.ts src/screens/ tests/game/capitalStack.test.ts
git commit -m "phase-3: computeLihtcScore takes intent + marketUnits, applies QAP penalty"
```

---

## Task 2: LIHTC funding scales by affordable share

LIHTC award amount in `capitalStack.ts` scales linearly by `affordableUnits / totalUnits`. Source card surfaces this in copy.

**Files:**
- Modify: `src/game/capitalStack.ts`
- Modify: `tests/game/capitalStack.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `tests/game/capitalStack.test.ts`:

```ts
describe('LIHTC award scales by affordable share', () => {
  it('all-affordable (100%): full award', () => {
    const award = computeLihtcAward({ affordableUnits: 50, totalUnits: 50, /* other inputs */ });
    // baseline 9% LIHTC for a 50-unit deep-affordable project; pin the value or use a helper
    expect(award).toBeGreaterThan(0);
    const baselineAward = award;

    const mixedAward = computeLihtcAward({ affordableUnits: 40, totalUnits: 50, /* same other inputs */ });
    expect(mixedAward).toBe(Math.round(baselineAward * 0.80));
  });

  it('zero affordable units → zero award', () => {
    const award = computeLihtcAward({ affordableUnits: 0, totalUnits: 50, /* other inputs */ });
    expect(award).toBe(0);
  });
});
```

If a `computeLihtcAward` function doesn't exist as a separate symbol, write the test against the existing LIHTC source amount calculation (whatever its current shape is).

- [ ] **Step 2: Run the failing test**

Run: `npm test`
Expected: FAIL.

- [ ] **Step 3: Edit `src/game/capitalStack.ts`**

In whatever function computes the LIHTC source amount, scale by affordable share:

```ts
const affordableUnits = amiBreakdown[30] + amiBreakdown[60] + amiBreakdown[80];
const totalUnits = affordableUnits + marketUnits;
const affordableShare = totalUnits > 0 ? affordableUnits / totalUnits : 0;
const lihtcAward = Math.round(baseLihtcAward * affordableShare);
```

Export `computeLihtcAward` if the test references it. Otherwise restructure tests to assert on the value flowing through to the source card.

- [ ] **Step 4: Capital Stack source card copy**

In `CapitalStack.tsx`, on the 9% LIHTC source card, when `affordableShare < 1`, append the scaling note to the source description:

```tsx
<div className="text-xs text-muted">
  9% LIHTC · ${(award / 1_000_000).toFixed(2)}M
  {affordableShare < 1 && (
    <> (scaled to {(affordableShare * 100).toFixed(0)}% affordable share)</>
  )}
</div>
```

- [ ] **Step 5: Run all tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/game/capitalStack.ts src/screens/CapitalStack.tsx tests/game/capitalStack.test.ts
git commit -m "phase-3: LIHTC award scales by affordable share"
```

---

## Task 3: `shelved-aro` outcome — ARO floor at close

In `Entitlement.tsx` `onComplete`, the ARO floor check fires before alder/community shelve checks. If `affordableShare < 0.25`, outcome is `shelved-aro`.

**Files:**
- Modify: `src/screens/Entitlement.tsx`
- Test: `tests/game/aroFloor.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `tests/game/aroFloor.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../src/game/state';
import { ARO_FLOOR_AFFORDABLE_SHARE } from '../../src/game/types';

describe('ARO floor outcome', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setIntent('mixed-income');
  });

  it('affordable share < 25% sets shelved-aro outcome', () => {
    // 4 affordable / 50 total = 8%
    useGameStore.getState().setMarketUnits(46);
    useGameStore.getState().setAmiUnit(30, 0);
    useGameStore.getState().setAmiUnit(60, 4);
    useGameStore.getState().setAmiUnit(80, 0);

    useGameStore.setState({ entitlement: { ...useGameStore.getState().entitlement, alderGoodwill: 80, communitySupport: 80 } });
    useGameStore.setState({ phase: 6 });

    // call onComplete equivalent — invoke setOutcome based on the same logic
    const affordableUnits = 4;
    const totalUnits = 50;
    const share = affordableUnits / totalUnits;
    if (share < ARO_FLOOR_AFFORDABLE_SHARE) {
      useGameStore.getState().setOutcome('shelved-aro');
    }
    expect(useGameStore.getState().outcome).toBe('shelved-aro');
  });

  it('affordable share ≥ 25% does not trigger shelved-aro', () => {
    // 13 affordable / 50 total = 26%
    useGameStore.getState().setMarketUnits(37);
    useGameStore.getState().setAmiUnit(30, 3);
    useGameStore.getState().setAmiUnit(60, 7);
    useGameStore.getState().setAmiUnit(80, 3);

    const affordableUnits = 13;
    const totalUnits = 50;
    const share = affordableUnits / totalUnits;
    expect(share).toBeGreaterThanOrEqual(ARO_FLOOR_AFFORDABLE_SHARE);
  });
});
```

- [ ] **Step 2: Run failing test**

Run: `npm test -- tests/game/aroFloor.test.ts`
Expected: PASS for the second case (it doesn't trigger the action); FAIL on the first case if there's no path to set the outcome from outside. If both pass, the test is too lenient — sharpen it by simulating the full `onComplete` flow.

- [ ] **Step 3: Update `onComplete` in `Entitlement.tsx`**

```tsx
function onComplete() {
  const affordableUnits =
    proForma.amiBreakdown[30] + proForma.amiBreakdown[60] + proForma.amiBreakdown[80];
  const totalUnits = affordableUnits + proForma.marketUnits;
  const affordableShare = totalUnits > 0 ? affordableUnits / totalUnits : 1;

  if (affordableShare < ARO_FLOOR_AFFORDABLE_SHARE) {
    setOutcome('shelved-aro');
    advancePhase();
    return;
  }

  if (entitlement.alderGoodwill < 20) {
    setOutcome('shelved-alder');
  } else if (entitlement.communitySupport < 25) {
    setOutcome('shelved-community');
  } else {
    setOutcome('closed');
  }
  advancePhase();
}
```

Add import:

```ts
import { ARO_FLOOR_AFFORDABLE_SHARE } from '../game/types';
```

- [ ] **Step 4: Run all tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/screens/Entitlement.tsx tests/game/aroFloor.test.ts
git commit -m "phase-3: ARO floor check sets shelved-aro outcome below 25% affordable"
```

---

## Task 4: Pilsen 30%-AMI bonus hook

On entering Phase 6, if the project is in Pilsen, apply +15/0/−10 community support based on the share of total units at 30% AMI.

**Files:**
- Modify: `src/game/state.ts` (in `advancePhase` action)
- Test: `tests/game/pilsenHook.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `tests/game/pilsenHook.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../src/game/state';

describe('Pilsen 30%-AMI bonus hook', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
    useGameStore.getState().selectNeighborhood('pilsen');
  });

  function setupAndAdvance(thirtyAmiCount: number, totalCount: number) {
    // Build a breakdown that sums to totalCount with thirtyAmiCount at 30% AMI
    const sixty = totalCount - thirtyAmiCount;
    useGameStore.getState().setAmiUnit(30, thirtyAmiCount);
    useGameStore.getState().setAmiUnit(60, sixty);
    useGameStore.getState().setAmiUnit(80, 0);
    useGameStore.getState().setMarketUnits(0);

    // Jump to phase 5 then advance to 6 (or 4 → 6 if no gap)
    useGameStore.setState({ phase: 5 });
    useGameStore.getState().advancePhase();
  }

  it('share ≥ 20%: +15 community', () => {
    const before = useGameStore.getState().entitlement.communitySupport;
    setupAndAdvance(10, 50);  // 20%
    expect(useGameStore.getState().entitlement.communitySupport).toBe(before + 15);
  });

  it('share = 0.21: +15 community (boundary)', () => {
    const before = useGameStore.getState().entitlement.communitySupport;
    setupAndAdvance(11, 50);  // 22%
    expect(useGameStore.getState().entitlement.communitySupport).toBe(before + 15);
  });

  it('share between 10% and 20%: no delta', () => {
    const before = useGameStore.getState().entitlement.communitySupport;
    setupAndAdvance(7, 50);  // 14%
    expect(useGameStore.getState().entitlement.communitySupport).toBe(before);
  });

  it('share < 10%: −10 community', () => {
    const before = useGameStore.getState().entitlement.communitySupport;
    setupAndAdvance(4, 50);  // 8%
    expect(useGameStore.getState().entitlement.communitySupport).toBe(before - 10);
  });
});
```

- [ ] **Step 2: Run failing test**

Run: `npm test -- tests/game/pilsenHook.test.ts`
Expected: FAIL — hook not implemented.

- [ ] **Step 3: Edit `advancePhase` in `src/game/state.ts`**

Add hook application logic when transitioning into Phase 6:

```ts
advancePhase: () => {
  const s = get();
  const nextPhase = computeNextPhase(s);

  // Hook firings on Phase 6 entry
  let entitlement = s.entitlement;
  if (nextPhase === 6 && s.phase !== 6) {
    const n = s.project.neighborhood ? getNeighborhood(s.project.neighborhood) : null;
    if (n?.hooks.pilsenDeepThirtyAmiBonus) {
      const affordable = s.proForma.amiBreakdown[30] + s.proForma.amiBreakdown[60] + s.proForma.amiBreakdown[80];
      const totalUnits = affordable + s.proForma.marketUnits;
      const thirtyShare = totalUnits > 0 ? s.proForma.amiBreakdown[30] / totalUnits : 0;

      if (thirtyShare >= 0.20) {
        entitlement = { ...entitlement, communitySupport: Math.min(100, entitlement.communitySupport + 15) };
      } else if (thirtyShare < 0.10) {
        entitlement = { ...entitlement, communitySupport: Math.max(0, entitlement.communitySupport - 10) };
      }
    }
    // Other Phase-6-entry hooks land here in subsequent tasks (CBO amplified, etc.)
  }

  set({ phase: nextPhase, entitlement });
},
```

Where `computeNextPhase` is the existing phase-transition logic (extract if needed).

- [ ] **Step 4: Run all tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/state.ts tests/game/pilsenHook.test.ts
git commit -m "phase-3: Pilsen 30%-AMI bonus hook on Phase 6 entry"
```

---

## Task 5: Albany Park CBO-amplified hook

On Phase 6 entry, if Albany Park AND `hasCboPartner`, community delta is +12 instead of the standard +6.

**Files:**
- Modify: `src/game/state.ts` (same `advancePhase` block)
- Test: `tests/game/albanyParkCboHook.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `tests/game/albanyParkCboHook.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../src/game/state';

describe('Albany Park CBO-amplified hook', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('Englewood + CBO: standard +6 community on Phase 6 entry', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setCboPartner(true);
    const before = useGameStore.getState().entitlement.communitySupport;
    useGameStore.setState({ phase: 5 });
    useGameStore.getState().advancePhase();
    expect(useGameStore.getState().entitlement.communitySupport).toBe(before + 6);
  });

  it('Albany Park + CBO: amplified +12 community', () => {
    useGameStore.getState().selectNeighborhood('albany-park');
    useGameStore.getState().setCboPartner(true);
    const before = useGameStore.getState().entitlement.communitySupport;
    useGameStore.setState({ phase: 5 });
    useGameStore.getState().advancePhase();
    expect(useGameStore.getState().entitlement.communitySupport).toBe(before + 12);
  });

  it('Albany Park without CBO: no delta', () => {
    useGameStore.getState().selectNeighborhood('albany-park');
    useGameStore.getState().setCboPartner(false);
    const before = useGameStore.getState().entitlement.communitySupport;
    useGameStore.setState({ phase: 5 });
    useGameStore.getState().advancePhase();
    expect(useGameStore.getState().entitlement.communitySupport).toBe(before);
  });
});
```

- [ ] **Step 2: Run failing test**

Run: `npm test -- tests/game/albanyParkCboHook.test.ts`
Expected: FAIL — current advancePhase doesn't apply this delta. Note: the existing v2 polish spec said CBO partner delta is applied on entering Phase 6. Verify the current code matches — if it does, this task just amplifies the delta for Albany Park. If it doesn't apply *any* CBO delta at Phase 6 entry, add the baseline +6 first.

- [ ] **Step 3: Extend the `advancePhase` Phase-6-entry block**

Inside the same Phase-6-entry conditional from Task 4, add:

```ts
// CBO amplified
if (s.project.hasCboPartner) {
  const delta = n?.hooks.albanyParkCboAmplified ? 12 : 6;
  entitlement = {
    ...entitlement,
    communitySupport: Math.min(100, entitlement.communitySupport + delta),
  };
}
```

(If the baseline +6 was already being applied somewhere else, remove the duplicate.)

- [ ] **Step 4: Run all tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/state.ts tests/game/albanyParkCboHook.test.ts
git commit -m "phase-3: Albany Park CBO-amplified hook (+12 instead of +6)"
```

---

## Task 6: `preapp-multilingual` choice key + Albany Park presentation

Albany Park's pre-app step shows a fourth choice: `preapp-multilingual` (+15 community, +3 mo). Available only when the neighborhood hook is set.

**Files:**
- Modify: `src/game/types.ts` (extend `StepChoiceKey`)
- Modify: `src/game/entitlement.ts` (consequence)
- Modify: `src/screens/Entitlement.tsx` (presentation)
- Test: `tests/game/albanyParkMultilingual.test.ts` (create)

- [ ] **Step 1: Extend `StepChoiceKey` in `types.ts`**

```ts
export type StepChoiceKey =
  | 'preapp-quiet' | 'preapp-formal-cbo' | 'preapp-public'
  | 'preapp-multilingual'                                       // NEW
  | 'community-data' | 'community-story' | 'community-coalition'
  | 'community-jp-full-parking' | 'community-jp-traffic-data' | 'community-jp-refuse-parking'  // NEW (Task 8)
  | 'zoning-hold' | 'zoning-shrink' | 'zoning-accept'
  | 'finance-reframe' | 'finance-concede' | 'finance-stakeholders';
```

- [ ] **Step 2: Add consequence in `entitlement.ts`**

Inside `applyChoice` switch:

```ts
case 'preapp-multilingual':
  return { ...base, alderDelta: 0, communityDelta: 15 };
```

Note: time delta is handled by the choice's `STEP_DURATIONS` override in the screen — see Step 5.

- [ ] **Step 3: Write failing test**

Create `tests/game/albanyParkMultilingual.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { applyChoice } from '../../src/game/entitlement';

describe('preapp-multilingual choice', () => {
  it('returns +15 community / 0 alder', () => {
    const c = applyChoice('preapp-multilingual');
    expect(c.alderDelta).toBe(0);
    expect(c.communityDelta).toBe(15);
  });
});
```

Run: `npm test -- tests/game/albanyParkMultilingual.test.ts`
Expected: PASS after Step 2.

- [ ] **Step 4: Add choice to `STEP_CHOICES` in `Entitlement.tsx`**

The current `STEP_CHOICES[1]` has three options. Add the multilingual entry — but only render it when the neighborhood hook is set.

```ts
const baseStep1Choices = [
  { key: 'preapp-quiet' as StepChoiceKey, title: 'Quiet alder meeting', description: '...', consequences: '+2 alder · ±0 community' },
  { key: 'preapp-formal-cbo' as StepChoiceKey, title: 'Formal w/ CBO partner', description: '...', consequences: '+5 alder · +6 community' },
  { key: 'preapp-public' as StepChoiceKey, title: 'Public pre-launch w/ press', description: '...', consequences: '−3 alder · +4 community' },
];

const multilingualChoice = {
  key: 'preapp-multilingual' as StepChoiceKey,
  title: 'Multilingual community outreach',
  description: 'Lead with door-knocking and printed materials in the languages your future residents speak.',
  consequences: '+15 community · +3 mo',
};
```

In the render block for step 1, decide which choices to show:

```tsx
const step1Choices = neighborhood.hooks.albanyParkMultilingualChoice
  ? [...baseStep1Choices, multilingualChoice]
  : baseStep1Choices;
```

Where `neighborhood = getNeighborhood(project.neighborhood!)`.

- [ ] **Step 5: Special time cost for multilingual choice**

The base pre-app duration is 6 months. Multilingual adds +3 (per spec). Inline in `onChoose`:

```ts
function onChoose(choice: StepChoiceKey) {
  const baseMonths = STEP_DURATIONS[currentStep] ?? 0;
  const extraMonths = choice === 'preapp-multilingual' ? 3 : 0;
  takeStep(choice);
  // density variance handling from Phase 2 task 5 unchanged
  tickMonths(baseMonths + extraMonths);
}
```

- [ ] **Step 6: Run all tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/game/types.ts src/game/entitlement.ts src/screens/Entitlement.tsx tests/game/albanyParkMultilingual.test.ts
git commit -m "phase-3: preapp-multilingual choice for Albany Park"
```

---

## Task 7: Albany Park community cap when skipping multilingual

If the player is in Albany Park and picks any pre-app choice other than `preapp-multilingual`, community support is hard-capped at 50 for the rest of the entitlement.

**Files:**
- Modify: `src/game/state.ts` (cap enforcement)
- Test: `tests/game/albanyParkCap.test.ts` (create)

- [ ] **Step 1: Write failing test**

Create `tests/game/albanyParkCap.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../src/game/state';

describe('Albany Park community cap when skipping multilingual', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
    useGameStore.getState().selectNeighborhood('albany-park');
  });

  it('picking preapp-quiet caps community at 50 going forward', () => {
    useGameStore.getState().takeEntitlementStep('preapp-quiet');
    useGameStore.setState({ entitlement: { ...useGameStore.getState().entitlement, communitySupport: 80 } });
    // Re-trigger any setter that respects the cap (e.g., the next step choice)
    useGameStore.getState().takeEntitlementStep('community-story');
    expect(useGameStore.getState().entitlement.communitySupport).toBeLessThanOrEqual(50);
  });

  it('picking preapp-multilingual does not cap', () => {
    useGameStore.getState().takeEntitlementStep('preapp-multilingual');
    useGameStore.setState({ entitlement: { ...useGameStore.getState().entitlement, communitySupport: 80 } });
    useGameStore.getState().takeEntitlementStep('community-story');
    expect(useGameStore.getState().entitlement.communitySupport).toBeGreaterThan(50);
  });
});
```

- [ ] **Step 2: Run failing test**

Run: `npm test -- tests/game/albanyParkCap.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement cap in `takeEntitlementStep`**

Find the `takeEntitlementStep` action. After computing the new `communitySupport`, apply the cap:

```ts
takeEntitlementStep: (choice) => {
  const s = get();
  const consequence = applyChoice(choice, { /* ctx */ });
  let newCommunity = Math.min(100, Math.max(0, s.entitlement.communitySupport + consequence.communityDelta));

  // Albany Park multilingual-skip cap
  const n = s.project.neighborhood ? getNeighborhood(s.project.neighborhood) : null;
  if (n?.hooks.albanyParkMultilingualChoice) {
    const skippedMultilingual = s.entitlement.pastChoices.some(
      (c) => c.step === 1 && c.choice !== 'preapp-multilingual'
    );
    if (skippedMultilingual) {
      newCommunity = Math.min(50, newCommunity);
    }
  }

  set({ entitlement: { /* ... */ communitySupport: newCommunity } });
},
```

- [ ] **Step 4: Run all tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/state.ts tests/game/albanyParkCap.test.ts
git commit -m "phase-3: Albany Park community cap (50) when multilingual skipped"
```

---

## Task 8: Jefferson Park parking choices (replace community-meeting choices)

When `jeffersonParkParkingChoice` hook is set, the community-meeting step (step 2) shows three parking-flavored choices instead of the standard data/story/coalition trio.

**Files:**
- Modify: `src/game/entitlement.ts` (new choice consequences)
- Modify: `src/screens/Entitlement.tsx` (presentation)
- Test: `tests/game/jeffParkParking.test.ts` (create)

- [ ] **Step 1: Add choice consequences in `entitlement.ts`**

In `applyChoice` switch:

```ts
case 'community-jp-full-parking':
  return { ...base, alderDelta: 12, communityDelta: 15, tdcDelta: 30_000 /* per unit, multiplied at apply time */ };
case 'community-jp-traffic-data':
  return { ...base, alderDelta: 5, communityDelta: 6, tdcDelta: 15_000 };
case 'community-jp-refuse-parking':
  return { ...base, alderDelta: -5, communityDelta: -10 };
```

Note: `tdcDelta` semantics — the existing convention may be per-project total or per-unit. Verify and document. If per-project, multiply by current `project.units` at apply time. Spec says $30k/unit, so be explicit:

```ts
// In takeEntitlementStep, after applyChoice:
const perUnitTdc = consequence.tdcDelta ?? 0;
const projectTdc = perUnitTdc * s.project.units;
// add projectTdc to costEscalation or wherever entitlement TDC deltas go
```

- [ ] **Step 2: Write failing test**

```ts
// tests/game/jeffParkParking.test.ts
import { describe, it, expect } from 'vitest';
import { applyChoice } from '../../src/game/entitlement';

describe('Jefferson Park parking choices', () => {
  it('full parking: +12 alder, +15 community, +$30k/u', () => {
    const c = applyChoice('community-jp-full-parking');
    expect(c.alderDelta).toBe(12);
    expect(c.communityDelta).toBe(15);
    expect(c.tdcDelta).toBe(30_000);
  });

  it('traffic data: +5 alder, +6 community, +$15k/u', () => {
    const c = applyChoice('community-jp-traffic-data');
    expect(c.alderDelta).toBe(5);
    expect(c.communityDelta).toBe(6);
    expect(c.tdcDelta).toBe(15_000);
  });

  it('refuse: −5 alder, −10 community, no TDC', () => {
    const c = applyChoice('community-jp-refuse-parking');
    expect(c.alderDelta).toBe(-5);
    expect(c.communityDelta).toBe(-10);
    expect(c.tdcDelta).toBe(0);
  });
});
```

Run: `npm test -- tests/game/jeffParkParking.test.ts`
Expected: PASS after Step 1.

- [ ] **Step 3: Presentation in `Entitlement.tsx`**

Add JP-specific step 2 choices:

```ts
const jpStep2Choices = [
  { key: 'community-jp-full-parking' as StepChoiceKey, title: 'Accept the parking ask',     description: 'Provide structured parking matching the neighborhood expectation.', consequences: '+12 alder · +15 community · +$30k/u TDC' },
  { key: 'community-jp-traffic-data' as StepChoiceKey, title: 'Show traffic data, offer minimal parking', description: 'Smaller parking + impact study to address neighborhood concerns.', consequences: '+5 alder · +6 community · +$15k/u TDC' },
  { key: 'community-jp-refuse-parking' as StepChoiceKey, title: 'Refuse / minimal parking', description: "Make the case for transit-oriented development. Risk pushback.", consequences: '−5 alder · −10 community' },
];

// when rendering step 2:
const step2Choices = neighborhood.hooks.jeffersonParkParkingChoice
  ? jpStep2Choices
  : STEP_CHOICES[2];
```

- [ ] **Step 4: Run all tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/entitlement.ts src/screens/Entitlement.tsx tests/game/jeffParkParking.test.ts
git commit -m "phase-3: Jefferson Park parking choices replace community-step trio"
```

---

## Task 9: Mixed-income market band in Pro Forma

When `intent === 'mixed-income'`, the AMI slider grid renders a fourth row for market units, using `neighborhood.marketRentPerUnit` for rent.

**Files:**
- Modify: `src/screens/ProForma.tsx`
- Test: covered by mixed-income mode tests in Task 10

- [ ] **Step 1: Add market row to slider grid**

In `ProForma.tsx`, find the AMI breakdown grid. Conditionally render the market row:

```tsx
{project.intent === 'mixed-income' && (
  <div className="grid grid-cols-4 gap-3 items-center mb-2">
    <label className="text-sm">Market</label>
    <input
      type="range"
      min={0}
      max={project.units}
      value={proForma.marketUnits}
      onChange={(e) => setMarketUnits(Number(e.target.value))}
      className="col-span-1"
    />
    <span className="text-sm font-mono">{proForma.marketUnits} units</span>
    <span className="text-sm text-muted">${neighborhood.marketRentPerUnit.toLocaleString()}/mo</span>
  </div>
)}
```

- [ ] **Step 2: Manual verification**

Run dev server. Pick mixed-income on Site & Concept (Task 11 makes Intent live; if it's not yet, manually set intent via dev console or by editing initialState briefly).

On Pro Forma, the market row appears and the slider works. NOI rises with market units.

- [ ] **Step 3: Commit**

```bash
git add src/screens/ProForma.tsx
git commit -m "phase-3: market band slider on Pro Forma when mixed-income"
```

---

## Task 10: Mixed-income mode end-to-end

Plumb `intent` and `marketUnits` through all the screens that need them. Verify mixed-income mode produces visible mechanics differences.

**Files:**
- Modify: `src/screens/SiteAndConcept.tsx` (Intent row live)
- Modify: `src/screens/ProForma.tsx` (QAP penalty row)
- Modify: `src/screens/CapitalStack.tsx` (penalty row + scaled award copy)
- Test: `tests/game/mixedIncome.test.ts` (create)

- [ ] **Step 1: Write the failing test (large)**

Create `tests/game/mixedIncome.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../src/game/state';
import { computeNoi, computeTdc } from '../../src/game/proForma';
import { getNeighborhood } from '../../src/data/neighborhoods';

describe('mixed-income mechanics', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('marketUnits raises NOI by neighborhood.marketRentPerUnit × marketUnits × 12 × occupancy factor', () => {
    useGameStore.getState().selectNeighborhood('pilsen');
    useGameStore.getState().setIntent('mixed-income');

    const baselineNoi = computeNoi({
      amiBreakdown: { 30: 10, 60: 30, 80: 10 },
      marketUnits: 0,
      marketRent: 2_100,
      opexRatio: 0.38,
      vacancyRatio: 0.07,
    });

    const mixedNoi = computeNoi({
      amiBreakdown: { 30: 10, 60: 30, 80: 10 },
      marketUnits: 10,
      marketRent: 2_100,
      opexRatio: 0.38,
      vacancyRatio: 0.07,
    });

    expect(mixedNoi).toBeGreaterThan(baselineNoi);
  });

  it('totalUnits = affordable + market drives TDC hard cost', () => {
    const tdc = computeTdc({
      neighborhood: 'pilsen',
      units: 60,   // affordable (50) + market (10)
      buildingType: 'midrise',
      finishLevel: 'standard',
    });
    expect(tdc.hard).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run failing test**

Run: `npm test -- tests/game/mixedIncome.test.ts`
Expected: PASS — `computeNoi` already handles `marketUnits`. If it doesn't, fix.

- [ ] **Step 3: Site & Concept Intent row live**

Replace the stubbed Intent row with two live cards:

```tsx
const setIntent = useGameStore((s) => s.setIntent);

<div className="grid grid-cols-2 gap-4 mb-6">
  <div
    className={`p-4 border rounded-lg cursor-pointer ${project.intent === 'all-affordable' ? 'border-accent bg-accent/10' : 'border-line'}`}
    onClick={() => setIntent('all-affordable')}
  >
    <div className="font-semibold mb-1">All-affordable</div>
    <div className="text-xs text-muted">100% affordable units across 30/60/80 AMI bands.</div>
  </div>
  <div
    className={`p-4 border rounded-lg cursor-pointer ${project.intent === 'mixed-income' ? 'border-accent bg-accent/10' : 'border-line'}`}
    onClick={() => setIntent('mixed-income')}
  >
    <div className="font-semibold mb-1">Mixed-income</div>
    <div className="text-xs text-muted">Allocate some units at market rate; cross-subsidy from market rents.</div>
  </div>
</div>
```

- [ ] **Step 4: Pro Forma QAP projection card surfaces penalty**

In `ProForma.tsx`, in the QAP projection factor breakdown table, add a row that appears only when the penalty applies:

```tsx
{project.intent === 'mixed-income' && proForma.marketUnits > 0 && project.neighborhood !== 'englewood' && (
  <tr>
    <td className="text-sm text-muted">Mixed-income outside Englewood</td>
    <td className="text-sm text-red-700 text-right">−{MIXED_INCOME_QAP_PENALTY}</td>
  </tr>
)}
```

- [ ] **Step 5: Run all tests, manual verify**

Run: `npm test`
Expected: PASS.

Run dev server. Pilsen + mixed-income + 10 market units: Pro Forma QAP card shows the −12 row; Capital Stack LIHTC card shows scaled award copy.

- [ ] **Step 6: Commit**

```bash
git add src/screens/SiteAndConcept.tsx src/screens/ProForma.tsx tests/game/mixedIncome.test.ts
git commit -m "phase-3: mixed-income Intent live + QAP penalty surface + market band end-to-end"
```

---

## Task 11: New alder character entries + David Park ARO line

Add Carlos Reyes (Pilsen), Frank Kovac (Jefferson Park), and Naila Hassan (Albany Park) to `data/characters.ts`. Add David Park's ARO floor line.

**Files:**
- Modify: `src/data/characters.ts`
- Test: `tests/data/characters.test.ts` (create or update)

- [ ] **Step 1: Add character entries**

In `data/characters.ts`:

```ts
export const carlosLines = {
  greeting: "Look — we've lost too many longtime residents already. Show me you're serious about depth. Shallow won't fly here.",
  bonusFired: "Twenty percent at 30% AMI. That's the depth we need. I can carry this to my council colleagues.",
  closingHigh: "You actually built what you said you'd build. People here have heard a lot of promises — thanks for keeping yours.",
  closingMid: "It's not perfect, but it's a start. Hold the line on rents and we won't have a problem.",
  closingLow: "Look, I'll vote for it because we need units. But you didn't earn what some of the neighborhood was hoping for.",
  shelvedAlder: "I can't sell this to the ward right now. Come back when you've got a deeper mix.",
};

export const frankLines = {
  greeting: "I'm not going to lie — most of my constituents don't want this. Bring something with parking and you might get a hearing. Otherwise, expect a fight.",
  parkingAccepted: "All right, that's the kind of partnership the block-club has been asking for. Good.",
  parkingMinimal: "It's not what they wanted but the data helps. I can defend it at the meeting.",
  parkingRefused: "You're going to make this very difficult. Don't say I didn't warn you.",
  closingHigh: "I didn't expect to back this one, but you actually listened. I'll go to bat for it.",
  closingMid: "Close call. Some folks are still mad. But it's going to get built.",
  closingLow: "I'm voting no. You can take it to council without me.",
  shelvedAlder: "I'm not bringing this to a vote. The ward isn't there yet — neither am I.",
};

export const nailaLines = {
  greeting: "Welcome. Our community speaks half a dozen languages on a slow day — meet people where they are and you'll find real partners here.",
  multilingualChoice: "Thank you for showing up the way you did. Real engagement looks like this.",
  closingHigh: "Beautiful work. The whole community feels heard. They'll fill these units the day you open.",
  closingMid: "It's good. Could've been deeper engagement but the design is solid.",
  closingLow: "We needed more from you. The mayor's office will hear about this.",
  shelvedAlder: "I can't take this forward. Come back when you've taken the time to actually meet the people who live here.",
};

// Extend davidLines with ARO floor line
export const davidLines = {
  // ...existing
  shelvedAro: "The ARO requires 20% affordability anyway. We're not going to subsidize that.",
};
```

- [ ] **Step 2: Write test**

```ts
// tests/data/characters.test.ts
import { describe, it, expect } from 'vitest';
import { carlosLines, frankLines, nailaLines, davidLines } from '../../src/data/characters';

describe('v3 character lines', () => {
  it('Carlos Reyes has all required slots', () => {
    expect(carlosLines.greeting).toBeTruthy();
    expect(carlosLines.bonusFired).toBeTruthy();
    expect(carlosLines.closingHigh).toBeTruthy();
    expect(carlosLines.closingMid).toBeTruthy();
    expect(carlosLines.closingLow).toBeTruthy();
    expect(carlosLines.shelvedAlder).toBeTruthy();
  });

  it('Frank Kovac has all required slots', () => {
    for (const key of ['greeting', 'parkingAccepted', 'parkingMinimal', 'parkingRefused', 'closingHigh', 'closingMid', 'closingLow', 'shelvedAlder']) {
      expect((frankLines as any)[key]).toBeTruthy();
    }
  });

  it('Naila Hassan has all required slots', () => {
    for (const key of ['greeting', 'multilingualChoice', 'closingHigh', 'closingMid', 'closingLow', 'shelvedAlder']) {
      expect((nailaLines as any)[key]).toBeTruthy();
    }
  });

  it('David Park has shelvedAro line', () => {
    expect(davidLines.shelvedAro).toBeTruthy();
  });
});
```

- [ ] **Step 3: Run all tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/data/characters.ts tests/data/characters.test.ts
git commit -m "phase-3: three new alder characters + David Park ARO line"
```

---

## Task 12: `closeReactions.ts` per-neighborhood alder routing + intent/buildingType awareness

Update `getReactions` to:
- Pick the right alder lines based on the project's neighborhood (Asha / Carlos / Frank / Naila).
- Route to `shelved-aro` block for that outcome.
- Pass `intent` to the advocate voice for the sharper line when mixed-income outside Englewood.
- Pass `buildingType` to the block-club voice.

**Files:**
- Modify: `src/data/closeReactions.ts`
- Test: `tests/data/closeReactions.test.ts`

- [ ] **Step 1: Write failing tests**

Extend `tests/data/closeReactions.test.ts` with new cases:

```ts
import { getReactions } from '../../src/data/closeReactions';

describe('per-neighborhood alder routing', () => {
  it('Pilsen close routes to Carlos Reyes', () => {
    const reactions = getReactions(/* fixture state: Pilsen + closed + high alder */);
    expect(reactions.find((r) => r.affiliation.includes('Pilsen'))).toBeTruthy();
  });

  it('Jefferson Park close routes to Frank Kovac', () => {
    const reactions = getReactions(/* fixture state: Jefferson Park + closed + low alder */);
    expect(reactions.find((r) => r.affiliation.includes('Jefferson Park'))).toBeTruthy();
  });

  it('Albany Park close routes to Naila Hassan', () => {
    const reactions = getReactions(/* fixture state: Albany Park + closed */);
    expect(reactions.find((r) => r.affiliation.includes('Albany Park'))).toBeTruthy();
  });

  it('shelved-aro returns David Park line', () => {
    const reactions = getReactions(/* fixture state: shelved-aro */);
    expect(reactions.find((r) => r.line.includes('ARO requires'))).toBeTruthy();
  });

  it('mixed-income outside Englewood: advocate has sharper line', () => {
    const reactions = getReactions(/* fixture: Pilsen + closed + mixed-income + market units */);
    const advocate = reactions.find((r) => r.affiliation.includes('Coalition'));
    expect(advocate?.line).toMatch(/left units on the table/i);
  });

  it('larger building: block club parking-concerned line', () => {
    const reactions = getReactions(/* fixture: larger + closed */);
    const blockClub = reactions.find((r) => r.affiliation.includes('Block Club'));
    expect(blockClub?.line).toMatch(/parking/i);
  });
});
```

(Each test passes a synthesized partial `GameState` matching the existing closeReactions API. Use the existing test fixtures as a template.)

- [ ] **Step 2: Run failing tests**

Run: `npm test -- tests/data/closeReactions.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement in `closeReactions.ts`**

Restructure `getReactions` to:

```ts
import { GameState, NeighborhoodId } from '../game/types';
import { ashaLines, carlosLines, frankLines, nailaLines, davidLines, marcusLines } from './characters';

function alderLinesByNeighborhood(n: NeighborhoodId) {
  return { englewood: ashaLines, pilsen: carlosLines, 'jefferson-park': frankLines, 'albany-park': nailaLines }[n];
}
function alderNameByNeighborhood(n: NeighborhoodId): string {
  return { englewood: 'Asha Tran', pilsen: 'Carlos Reyes', 'jefferson-park': 'Frank Kovac', 'albany-park': 'Naila Hassan' }[n];
}
function alderAffiliationByNeighborhood(n: NeighborhoodId): string {
  const map = { englewood: 'Englewood', pilsen: 'Pilsen', 'jefferson-park': 'Jefferson Park', 'albany-park': 'Albany Park' };
  return `Alder · ${map[n]}`;
}

export function getReactions(state: GameState): Reaction[] {
  if (state.outcome === 'shelved-aro') return shelvedAroReactions(state);
  if (state.outcome === 'closed') return successReactions(state);
  return failureReactions(state);
}

function successReactions(state: GameState): Reaction[] {
  const n = state.project.neighborhood!;
  const lines = alderLinesByNeighborhood(n);
  const bucket = state.entitlement.alderGoodwill >= 70 ? 'closingHigh' : state.entitlement.alderGoodwill >= 40 ? 'closingMid' : 'closingLow';

  const out: Reaction[] = [
    { speaker: alderNameByNeighborhood(n), affiliation: alderAffiliationByNeighborhood(n), line: (lines as any)[bucket] },
    // editorial reaction (unchanged)
    // block club — buildingType-aware
    blockClubReaction(state),
    // advocate — intent-aware
    advocateReaction(state),
  ];

  return out;
}

function blockClubReaction(state: GameState): Reaction {
  const parkingConcerned = state.project.buildingType === 'larger';
  const line = parkingConcerned
    ? "We're worried about parking but we know we need housing. Make good on the conditions."
    : "It's small enough to fit in. Welcome to the block.";
  return { speaker: 'Block Club', affiliation: 'Neighborhood Block Club', line };
}

function advocateReaction(state: GameState): Reaction {
  const depthCritical = state.project.intent === 'mixed-income' && state.proForma.marketUnits > 0 && state.project.neighborhood !== 'englewood';
  const line = depthCritical
    ? "You left units on the table. The next deal in this neighborhood needs to go deeper."
    : "Real impact. This is what the city should be funding more of.";
  return { speaker: 'Housing advocate', affiliation: 'Chicago Housing Coalition', line };
}

function shelvedAroReactions(state: GameState): Reaction[] {
  return [
    { speaker: 'David Park', affiliation: 'Senior Analyst, Chicago Department of Housing', line: davidLines.shelvedAro },
    { speaker: 'Marcus Bell', affiliation: 'Construction Lender, Loop Federal Bank', line: 'I tried to underwrite the deal. It just wasn\'t there.' },
    { speaker: 'Housing advocate', affiliation: 'Chicago Housing Coalition', line: 'We can\'t subsidize market-rate. Come back with real depth.' },
  ];
}
```

- [ ] **Step 4: Run all tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/closeReactions.ts tests/data/closeReactions.test.ts
git commit -m "phase-3: closeReactions per-neighborhood alder routing + intent/buildingType awareness"
```

---

## Task 13: Final manual playthrough verification

Walk each new mechanic end-to-end at the live dev server.

- [ ] **Step 1: Pilsen + midrise + all-affordable @ 30%-AMI share = 20%**

Set up: Pilsen, midrise, 50 units, breakdown `{30:10, 60:30, 80:10}` (20% at 30% AMI).
- Phase 6 entry: verify community jumps by 15.
- Close: outcome `closed`, Carlos Reyes closingHigh line visible.

- [ ] **Step 2: Jefferson Park + larger + all-affordable**

Set up: Jefferson Park, larger, 80 units.
- Pro Forma: hard cost `Larger · $496k × 80u`, land `Jefferson Park · $110k × 0.75 × 80u`.
- Capital Stack: David Park larger quip.
- Entitlement: 4-step path (PD), step 2 shows three parking choices. Pick "full parking" — confirm TDC bumps by 30k × 80 = $2.4M.
- Step 3 (zoning): yellow info row shows density variance condition. After pick, TDC bumps by 25k × 80 = $2.0M.
- Close: Frank Kovac closing line based on alder goodwill bucket.

- [ ] **Step 3: Jefferson Park + walkup**

Set up: Jefferson Park, walkup, 24 units.
- Confirm 4-step entitlement (SFR override), parking choices visible at step 2.

- [ ] **Step 4: Albany Park + walkup + CBO + multilingual**

Set up: Albany Park, walkup, CBO partner on.
- Pre-app step: pick `preapp-multilingual`. Verify +15 community. Naila multilingualChoice line shows.
- Phase 6 entry: CBO amplified +12 community.
- Net community boost: +15 (multilingual) + +12 (CBO amplified) over baseline.

- [ ] **Step 5: Pilsen + mixed-income with 20% market**

Set up: Pilsen, mixed-income, 40 affordable + 10 market.
- Pro Forma: market row visible; NOI rises with market units.
- QAP projection card: shows −12 row.
- Capital Stack: LIHTC source card shows scaled award ("scaled to 80% affordable share").

- [ ] **Step 6: Any neighborhood + mixed-income with 4 affordable / 50 total (8% share)**

- Try to complete entitlement.
- `onComplete` triggers `shelved-aro` outcome.
- Close screen: David Park shelvedAro line.

- [ ] **Step 7: Commit any fixes**

If any of the above failed, write follow-up commits.

---

## Done

**Phase 3 ships when:**
- `computeLihtcScore` takes `intent` + `marketUnits` and applies −12 penalty when applicable.
- LIHTC award scales by affordable share; Capital Stack copy shows the scaling.
- `shelved-aro` outcome triggers when affordable share < 25%; David Park ARO line visible.
- Pilsen 30%-AMI bonus fires on Phase 6 entry.
- Albany Park CBO amplified (+12) and multilingual choice (+15 with cap-on-skip) work.
- Jefferson Park parking choices replace community-step choices.
- Mixed-income mode: market band in Pro Forma; QAP penalty visible.
- New alder characters wired into closeReactions.
- Intent row live on Site & Concept.
- Manual playthrough verifies each combination above.
- Suite passing at ~190 tests; no regressions.
- Cloudflare deploy succeeds; all four neighborhoods playable at the live URL.

**Content Expansion complete.** Jargon Explainers is a parallel spec; its plan is the next file: `2026-06-04-housing-game-v3-jargon-explainers.md`.
