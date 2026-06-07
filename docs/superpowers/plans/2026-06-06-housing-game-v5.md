# Housing Developer Game v5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the 16 items in the v5 queue: bug fixes (header stale units, TDC spike, shelved-vs-approved narrative, redesign-smaller banner), content additions (alder framing, per-step framing, lever copy, recap narratives), a new committee-driven failure mechanic, an "Increase design quality" choice with +15% hard-cost multiplier, and LIHTC-odds quantization.

**Architecture:** Six phases ordered by file scope and risk. Phase 1–3 are isolated label/copy edits. Phase 4 extracts two shared helpers (`getEffectiveUnits`, `effectiveHardPerUnit`) that become single-source-of-truth for unit and cost-per-unit math, eliminating two seemingly unrelated bugs at one root cause. Phase 5 adds the new `designUpgrade` state field, the `isCommitteeFailed` gate at CoZ/CoF, all entitlement narrative, and rewires the shelved-vs-approved render branching. Phase 6 extends `lastRecap` with a per-choice narrative, threads it through every >=3-month tick site, and quantizes LIHTC odds.

**Tech Stack:** React 19, Vite, TypeScript, Zustand, Tailwind v4. Vitest. All tests run via `npm test`. Build via `npm run build` (runs `tsc -b && vite build`).

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/data/characters.ts` | Modify | Add `carlos`/`frank`/`naila` to `characters`; add `getNeighborhoodAlderId`; extend `davidLines.capitalStackIntro`; add `entitlementIntroLines`; add `recapNarratives` + `resolveRecapNarrative` |
| `src/data/closeReactions.ts` | Modify | Use `getEffectiveUnits`; drop `'zoning-accept'` reference |
| `src/screens/SiteAndConcept.tsx` | Modify | Use `getNeighborhoodAlderId` for live preview |
| `src/screens/ProForma.tsx` | Modify | Rename Lever 3 to "Community Partner"; add Lever 1/2 explanatory paragraphs |
| `src/screens/CapitalStack.tsx` | Modify | Remove Marcus quote; rename Lever 3 in QapOddsSubScreen; pass recap narrative on cut-costs exit |
| `src/screens/Entitlement.tsx` | Modify | Spell-out alder/community; alder intro bubble; per-step framing; choice rename; failure-gate check; failure-narrative panel; outcome gating on completion panel |
| `src/components/Header.tsx` | Modify | Use `getEffectiveUnits` for displayed units and `computeTdc` input |
| `src/components/RecapCard.tsx` | Modify | Render narrative bubble row when `lastRecap.narrative` present |
| `src/game/types.ts` | Modify | Swap `'zoning-accept'` → `'zoning-design-upgrade'` in `StepChoiceKey`; add `designUpgrade` to `EntitlementState`; extend `lastRecap` with `narrative` |
| `src/game/entitlement.ts` | Modify | Replace `zoning-accept` case with `zoning-design-upgrade`; add `isCommitteeFailed`; JSDoc on `tdcDelta` semantics |
| `src/game/state.ts` | Modify | Add `setDesignUpgrade`; widen `tickMonths(n, narrative?)`; thread narratives through all callers; init `designUpgrade: false` |
| `src/game/proForma.ts` | Modify | Add `getEffectiveUnits`; add `effectiveHardPerUnit`; use multipliers in `computeTdc` |
| `src/game/gapResolution.ts` | Modify | Use `getEffectiveUnits`; use `effectiveHardPerUnit` |
| `src/game/capitalStack.ts` | Modify | Quantize `odds` in `computeQapScore` |
| `tests/data/characters.test.ts` | Modify | Add tests for new characters + helper + David line phrase |
| `tests/data/recapNarratives.test.ts` | Create | Tests for `resolveRecapNarrative` |
| `tests/game/proForma.test.ts` | Modify | Add `getEffectiveUnits` + `effectiveHardPerUnit` tests |
| `tests/game/entitlement.test.ts` | Modify | Replace `zoning-accept` tests; add `zoning-design-upgrade`, `isCommitteeFailed` tests |
| `tests/game/state.test.ts` | Modify | Add `tickMonths` narrative tests; remove obsolete end-check tests; add CoZ failure tests |
| `tests/game/capitalStack.test.ts` | Modify | Add odds-quantization test |
| `tests/components/RecapCard.test.tsx` | Create | Tests for narrative present/absent rendering |
| `tests/components/Header.test.tsx` | Create | Tests for effective-units display |
| `tests/components/SiteAndConcept.test.tsx` | Create | Tests for per-neighborhood alder bubble |
| `tests/components/Entitlement.test.tsx` | Create | Tests for intro framing, per-step framing, failure panel, completion panel gating |

---

## Phase 1 — Quick wins (Items 3, 4, 6)

### Task 1.1: Rename "CBO partner" → "Community Partner" in Pro Forma Lever 3

**Files:**
- Modify: `src/screens/ProForma.tsx:185`

- [ ] **Step 1: Edit the Lever 3 header**

Replace:
```tsx
<div className="text-xs uppercase tracking-wider text-accent font-bold">
  Lever 3 — <TooltipTerm term="CBO">CBO</TooltipTerm> partner
</div>
```
With:
```tsx
<div className="text-xs uppercase tracking-wider text-accent font-bold">
  Lever 3 — Community Partner (<TooltipTerm term="CBO">CBO</TooltipTerm>)
</div>
```

- [ ] **Step 2: Edit the QapOddsSubScreen header in CapitalStack**

In `src/screens/CapitalStack.tsx`, find:
```tsx
<div className="text-xs uppercase tracking-wider text-accent font-bold">CBO partner</div>
```
Replace with:
```tsx
<div className="text-xs uppercase tracking-wider text-accent font-bold">Community Partner</div>
```

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: all 231 tests still pass (no test asserts on these labels).

- [ ] **Step 4: Commit**

```bash
git add src/screens/ProForma.tsx src/screens/CapitalStack.tsx
git commit -m "feat(proforma,stack): rename Lever 3 to 'Community Partner' (v5 item 13)"
```

---

### Task 1.2: Remove Marcus Bell quote from Capital Stack

**Files:**
- Modify: `src/screens/CapitalStack.tsx` (~line 259-261)

- [ ] **Step 1: Delete the CharacterBubble between LIHTC card and source grid**

In `src/screens/CapitalStack.tsx`, find and delete:
```tsx
<div className="mb-3">
  <CharacterBubble characterId="marcus" line={marcusLines.capitalStackBubble} />
</div>
```

- [ ] **Step 2: Verify imports**

`marcusLines` is also imported for use in `tdcStack` and elsewhere — leave the import. `CharacterBubble` is also used in the gap-gate modal — leave the import. No import changes needed.

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/screens/CapitalStack.tsx
git commit -m "feat(stack): remove Marcus Bell quote between LIHTC card and source grid (v5 item 14)"
```

---

### Task 1.3: Spell out "Alder" and "Community" in Steps Taken

**Files:**
- Modify: `src/screens/Entitlement.tsx` (~line 222)

- [ ] **Step 1: Update the past-choices summary**

In `src/screens/Entitlement.tsx`, find:
```tsx
<span className="text-equity">α{c.alderDelta >= 0 ? '+' : ''}{c.alderDelta} · c{c.communityDelta >= 0 ? '+' : ''}{c.communityDelta}</span>
```

Replace with:
```tsx
<span className="text-equity">
  Alder {c.alderDelta === 0 ? '±0' : `${c.alderDelta > 0 ? '+' : ''}${c.alderDelta}`}
  {' · '}
  Community {c.communityDelta === 0 ? '±0' : `${c.communityDelta > 0 ? '+' : ''}${c.communityDelta}`}
</span>
```

- [ ] **Step 2: Run tests**

Run: `npm test`
Expected: all tests pass (no existing test asserts on the abbreviation).

- [ ] **Step 3: Commit**

```bash
git add src/screens/Entitlement.tsx
git commit -m "feat(entitlement): spell out 'Alder' and 'Community' in Steps Taken (v5 item 15)"
```

---

## Phase 2 — Live preview alder + character map (Item 2)

### Task 2.1: Add Carlos / Frank / Naila to the characters map

**Files:**
- Modify: `src/data/characters.ts`
- Modify: `tests/data/characters.test.ts`

- [ ] **Step 1: Write failing tests for new characters and the helper**

Append to `tests/data/characters.test.ts`:
```typescript
import { getNeighborhoodAlderId } from '../../src/data/characters';

describe('v5 — new neighborhood alder characters', () => {
  it('characters map includes carlos / frank / naila with non-empty fields', () => {
    for (const id of ['carlos', 'frank', 'naila'] as const) {
      expect(characters[id], `characters.${id}`).toBeDefined();
      expect(characters[id].name, `characters.${id}.name`).toBeTruthy();
      expect(characters[id].emoji, `characters.${id}.emoji`).toBeTruthy();
      expect(characters[id].role, `characters.${id}.role`).toBeTruthy();
    }
  });

  it('alder names all carry the "Alder" prefix', () => {
    expect(characters.asha.name).toMatch(/^Alder /);
    expect(characters.carlos.name).toMatch(/^Alder /);
    expect(characters.frank.name).toMatch(/^Alder /);
    expect(characters.naila.name).toMatch(/^Alder /);
  });
});

describe('getNeighborhoodAlderId', () => {
  it('returns asha for englewood', () => {
    expect(getNeighborhoodAlderId('englewood')).toBe('asha');
  });
  it('returns carlos for pilsen', () => {
    expect(getNeighborhoodAlderId('pilsen')).toBe('carlos');
  });
  it('returns frank for jefferson-park', () => {
    expect(getNeighborhoodAlderId('jefferson-park')).toBe('frank');
  });
  it('returns naila for albany-park', () => {
    expect(getNeighborhoodAlderId('albany-park')).toBe('naila');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/data/characters.test.ts`
Expected: FAIL — `characters.carlos is undefined`, `getNeighborhoodAlderId is not a function`.

- [ ] **Step 3: Update `CharacterId` union and add character entries**

In `src/data/characters.ts`, change:
```typescript
export type CharacterId = 'marcus' | 'asha' | 'janelle' | 'david' | 'powell' | 'reyes' | 'chen';
```
to:
```typescript
export type CharacterId =
  | 'marcus' | 'asha' | 'janelle' | 'david'
  | 'powell' | 'reyes' | 'chen'
  | 'carlos' | 'frank' | 'naila';
```

In the `characters` record, change `asha`'s name to `'Alder Asha Tran'`. Add three entries before the closing `};`:
```typescript
  carlos: { id: 'carlos', name: 'Alder Carlos Reyes', emoji: '📣', role: 'Alder · Pilsen' },
  frank:  { id: 'frank',  name: 'Alder Frank Kovac',  emoji: '🏙️', role: 'Alder · Jefferson Park' },
  naila:  { id: 'naila',  name: 'Alder Naila Hassan', emoji: '🤝', role: 'Alder · Albany Park' },
```

- [ ] **Step 4: Add `getNeighborhoodAlderId` helper**

Append to `src/data/characters.ts`:
```typescript
import type { NeighborhoodId } from '../game/types';

export function getNeighborhoodAlderId(n: NeighborhoodId): CharacterId {
  const map: Record<NeighborhoodId, CharacterId> = {
    englewood: 'asha',
    pilsen: 'carlos',
    'jefferson-park': 'frank',
    'albany-park': 'naila',
  };
  return map[n];
}
```

- [ ] **Step 5: Run tests to verify pass**

Run: `npm test -- tests/data/characters.test.ts`
Expected: PASS.

- [ ] **Step 6: Run full suite to catch regressions from the asha rename**

Run: `npm test`
Expected: all pass. If any test asserts on `Asha Tran` literally (without "Alder"), update them.

- [ ] **Step 7: Commit**

```bash
git add src/data/characters.ts tests/data/characters.test.ts
git commit -m "feat(characters): add Carlos/Frank/Naila to characters map + getNeighborhoodAlderId helper (v5 item 2)"
```

---

### Task 2.2: Wire SiteAndConcept live preview to use the helper

**Files:**
- Modify: `src/screens/SiteAndConcept.tsx`
- Create: `tests/components/SiteAndConcept.test.tsx`

- [ ] **Step 1: Write failing component test**

Create `tests/components/SiteAndConcept.test.tsx`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SiteAndConcept } from '../../src/screens/SiteAndConcept';
import { useGameStore } from '../../src/game/state';

describe('SiteAndConcept live preview alder (v5 item 2)', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('shows Asha for Englewood', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    render(<SiteAndConcept />);
    expect(screen.getByText(/Alder Asha Tran/)).toBeInTheDocument();
  });

  it('shows Carlos for Pilsen', () => {
    useGameStore.getState().selectNeighborhood('pilsen');
    render(<SiteAndConcept />);
    expect(screen.getByText(/Alder Carlos Reyes/)).toBeInTheDocument();
  });

  it('shows Frank for Jefferson Park', () => {
    useGameStore.getState().selectNeighborhood('jefferson-park');
    render(<SiteAndConcept />);
    expect(screen.getByText(/Alder Frank Kovac/)).toBeInTheDocument();
  });

  it('shows Naila for Albany Park', () => {
    useGameStore.getState().selectNeighborhood('albany-park');
    render(<SiteAndConcept />);
    expect(screen.getByText(/Alder Naila Hassan/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- tests/components/SiteAndConcept.test.tsx`
Expected: FAIL — only Asha bubble renders for all neighborhoods.

- [ ] **Step 3: Update SiteAndConcept**

In `src/screens/SiteAndConcept.tsx`, add to imports:
```typescript
import { getNeighborhoodAlderId } from '../data/characters';
```

Find:
```tsx
<CharacterBubble characterId="asha" line={n.alderGreeting} />
```
Replace with:
```tsx
<CharacterBubble characterId={getNeighborhoodAlderId(n.id)} line={n.alderGreeting} />
```

- [ ] **Step 4: Run tests**

Run: `npm test -- tests/components/SiteAndConcept.test.tsx`
Expected: PASS.

- [ ] **Step 5: Run full suite**

Run: `npm test`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/screens/SiteAndConcept.tsx tests/components/SiteAndConcept.test.tsx
git commit -m "fix(site): live preview shows per-neighborhood alder (v5 item 2)"
```

---

## Phase 3 — Pro Forma copy + David Park line (Items 2a, 2b, 5)

### Task 3.1: Add Lever 1 + Lever 2 explanatory paragraphs

**Files:**
- Modify: `src/screens/ProForma.tsx`

- [ ] **Step 1: Add Lever 1 paragraph**

In `src/screens/ProForma.tsx`, find the Lever 1 block (around line 119-135). After the closing `</div>` of the three-button row but before the outer `</div>` of the Lever 1 card, insert:
```tsx
<p className="text-xs text-muted italic mt-2">
  Better designs and nicer cabinets, countertops, and appliances will get you more points on the <TooltipTerm term="QAP">QAP</TooltipTerm> and make it more likely you'll get a <TooltipTerm term="LIHTC">LIHTC</TooltipTerm> award — but they also cost money.
</p>
```

- [ ] **Step 2: Add Lever 2 paragraph**

Still in `ProForma.tsx`, find the Lever 2 card and locate the eligibility chip (`<div className={`mt-3 p-2 rounded text-xs ${eligible ? ...}`>...</div>`). After this chip but before the outer Lever 2 `</div>`, insert:
```tsx
<p className="text-xs text-muted italic mt-2">
  The more affordable your apartments, the better your <TooltipTerm term="QAP">QAP</TooltipTerm> score — but it will also reduce the size of the loan you can qualify for.
</p>
```

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/screens/ProForma.tsx
git commit -m "feat(proforma): explanatory text under Levers 1 and 2 (v5 items 2a, 2b)"
```

---

### Task 3.2: Extend David Park complexity-penalty line

**Files:**
- Modify: `src/data/characters.ts`
- Modify: `tests/data/characters.test.ts`

- [ ] **Step 1: Write failing test**

Append to `tests/data/characters.test.ts`:
```typescript
describe('v5 — David Park complexity-penalty rationale', () => {
  it('capitalStackIntro contains the compliance/legal explanation', () => {
    expect(davidLines.capitalStackIntro).toContain('compliance and legal paperwork');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- tests/data/characters.test.ts`
Expected: FAIL.

- [ ] **Step 3: Extend the line**

In `src/data/characters.ts`, find `davidLines.capitalStackIntro` and replace the existing trailing clause "past 5 sources, complexity penalty kicks in at ~$20k/unit per extra source." with "past 5 sources, complexity penalty kicks in at ~$20k/unit per extra source, because of all the compliance and legal paperwork your staff and attorneys will need to deal with."

Concretely, change:
```typescript
capitalStackIntro: 'Putting this together is what we call assembling the capital stack — soft loans, grants, tax credits, and equity stacked to your TDC. Three rules: every source closes more of the gap; every source takes time, and time is money (hard costs escalate ~5%/year); past 5 sources, complexity penalty kicks in at ~$20k/unit per extra source. The art is closing the gap with the smallest, fastest set of sources you can.',
```
To:
```typescript
capitalStackIntro: 'Putting this together is what we call assembling the capital stack — soft loans, grants, tax credits, and equity stacked to your TDC. Three rules: every source closes more of the gap; every source takes time, and time is money (hard costs escalate ~5%/year); past 5 sources, complexity penalty kicks in at ~$20k/unit per extra source, because of all the compliance and legal paperwork your staff and attorneys will need to deal with. The art is closing the gap with the smallest, fastest set of sources you can.',
```

- [ ] **Step 4: Run tests**

Run: `npm test -- tests/data/characters.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/characters.ts tests/data/characters.test.ts
git commit -m "feat(characters): David Park explains complexity penalty rationale (v5 item 5)"
```

---

## Phase 4 — Effective units + tdcDelta semantic fix (Items 7, 11)

### Task 4.1: Add `getEffectiveUnits` and `effectiveHardPerUnit` helpers

**Files:**
- Modify: `src/game/proForma.ts`
- Modify: `tests/game/proForma.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `tests/game/proForma.test.ts`:
```typescript
import { getEffectiveUnits, effectiveHardPerUnit } from '../../src/game/proForma';
import { useGameStore } from '../../src/game/state';
import { HARD_COST_PER_UNIT, FINISH_MULTIPLIER, MIN_UNITS_FLOOR } from '../../src/game/types';

describe('getEffectiveUnits (v5 item 7)', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('returns project.units when no shrinks', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    expect(getEffectiveUnits(useGameStore.getState())).toBe(60);
  });

  it('subtracts entitlement.projectShrinkBy', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    useGameStore.setState((s) => ({ entitlement: { ...s.entitlement, projectShrinkBy: 12 } }));
    expect(getEffectiveUnits(useGameStore.getState())).toBe(48);
  });

  it('subtracts gapResolution.shrinkBy', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    useGameStore.setState((s) => ({ gapResolution: { ...s.gapResolution, shrinkBy: 10 } }));
    expect(getEffectiveUnits(useGameStore.getState())).toBe(50);
  });

  it('subtracts both shrinks', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    useGameStore.setState((s) => ({
      entitlement: { ...s.entitlement, projectShrinkBy: 12 },
      gapResolution: { ...s.gapResolution, shrinkBy: 10 },
    }));
    expect(getEffectiveUnits(useGameStore.getState())).toBe(38);
  });

  it('floors at MIN_UNITS_FLOOR', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(25);
    useGameStore.setState((s) => ({
      entitlement: { ...s.entitlement, projectShrinkBy: 50 },
    }));
    expect(getEffectiveUnits(useGameStore.getState())).toBe(MIN_UNITS_FLOOR);
  });
});

describe('effectiveHardPerUnit (v5 item 10 / phase 5)', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('matches HARD_COST_PER_UNIT × FINISH_MULTIPLIER when no flags set', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    const state = useGameStore.getState();
    const expected = HARD_COST_PER_UNIT[state.project.buildingType] * FINISH_MULTIPLIER[state.proForma.finishLevel];
    expect(effectiveHardPerUnit(state)).toBeCloseTo(expected);
  });

  it('multiplies by 1.15 when entitlement.designUpgrade is true', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.setState((s) => ({ entitlement: { ...s.entitlement, designUpgrade: true } }));
    const state = useGameStore.getState();
    const base = HARD_COST_PER_UNIT[state.project.buildingType] * FINISH_MULTIPLIER[state.proForma.finishLevel];
    expect(effectiveHardPerUnit(state)).toBeCloseTo(base * 1.15);
  });

  it('multiplies by LOWER_QUALITY_HARD_MULTIPLIER when lowerQualityUsed is true', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.setState((s) => ({ gapResolution: { ...s.gapResolution, lowerQualityUsed: true } }));
    const state = useGameStore.getState();
    const base = HARD_COST_PER_UNIT[state.project.buildingType] * FINISH_MULTIPLIER[state.proForma.finishLevel];
    expect(effectiveHardPerUnit(state)).toBeCloseTo(base * 0.9);
  });

  it('stacks both multipliers when both flags set', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.setState((s) => ({
      entitlement: { ...s.entitlement, designUpgrade: true },
      gapResolution: { ...s.gapResolution, lowerQualityUsed: true },
    }));
    const state = useGameStore.getState();
    const base = HARD_COST_PER_UNIT[state.project.buildingType] * FINISH_MULTIPLIER[state.proForma.finishLevel];
    expect(effectiveHardPerUnit(state)).toBeCloseTo(base * 1.15 * 0.9);
  });
});
```

Note: these tests reference `entitlement.designUpgrade` which Phase 5 Task 5.1 will introduce. The tests will not compile until Phase 5 Task 5.1 adds that field. To unblock Phase 4 from depending on Phase 5, we add a minimal `designUpgrade?: boolean` placeholder on `EntitlementState` in this task (Step 3 below) and Phase 5 Task 5.1 expands the surrounding logic.

- [ ] **Step 2: Add `designUpgrade` placeholder field**

In `src/game/types.ts`, find the `entitlement` block inside `GameState`:
```typescript
  entitlement: {
    currentStep: EntitlementStep;
    pastChoices: StepChoice[];
    alderGoodwill: number;
    communitySupport: number;
    projectShrinkBy: number;
    conditionsImposed: string[];
  };
```
Add `designUpgrade: boolean;`:
```typescript
  entitlement: {
    currentStep: EntitlementStep;
    pastChoices: StepChoice[];
    alderGoodwill: number;
    communitySupport: number;
    projectShrinkBy: number;
    conditionsImposed: string[];
    designUpgrade: boolean;
  };
```

In `src/game/state.ts`, find the `entitlement` block in `initialState` and add `designUpgrade: false,`.

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- tests/game/proForma.test.ts`
Expected: FAIL — `getEffectiveUnits is not exported`.

- [ ] **Step 4: Implement both helpers**

In `src/game/proForma.ts`, add imports at the top if not present:
```typescript
import { GameState, MIN_UNITS_FLOOR, HARD_COST_PER_UNIT, FINISH_MULTIPLIER, LOWER_QUALITY_HARD_MULTIPLIER } from './types';
```

(Some of these may already be imported. Read the existing top-of-file imports and merge.)

Append to the file:
```typescript
export function getEffectiveUnits(state: GameState): number {
  return Math.max(
    MIN_UNITS_FLOOR,
    state.project.units - state.entitlement.projectShrinkBy - state.gapResolution.shrinkBy
  );
}

export function effectiveHardPerUnit(state: GameState): number {
  return (
    HARD_COST_PER_UNIT[state.project.buildingType]
    * FINISH_MULTIPLIER[state.proForma.finishLevel]
    * (state.entitlement.designUpgrade ? 1.15 : 1)
    * (state.gapResolution.lowerQualityUsed ? LOWER_QUALITY_HARD_MULTIPLIER : 1)
  );
}
```

- [ ] **Step 5: Run tests to verify pass**

Run: `npm test -- tests/game/proForma.test.ts`
Expected: PASS.

- [ ] **Step 6: Run full suite**

Run: `npm test`
Expected: all pass. The new `designUpgrade` field is opt-in (default `false`) so no existing tests should break.

- [ ] **Step 7: Commit**

```bash
git add src/game/proForma.ts src/game/types.ts src/game/state.ts tests/game/proForma.test.ts
git commit -m "feat(game): add getEffectiveUnits + effectiveHardPerUnit helpers and designUpgrade field (v5 phase 4 + prep for phase 5)"
```

---

### Task 4.2: Wire Header to use `getEffectiveUnits`

**Files:**
- Modify: `src/components/Header.tsx`
- Create: `tests/components/Header.test.tsx`

- [ ] **Step 1: Write failing test**

Create `tests/components/Header.test.tsx`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '../../src/components/Header';
import { useGameStore } from '../../src/game/state';

describe('Header effective units (v5 item 7)', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('shows project.units when no shrinks', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    render(<Header />);
    expect(screen.getByText(/60 units/)).toBeInTheDocument();
  });

  it('shows reduced units after redesignSmaller', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    useGameStore.setState((s) => ({ phase: 5 } as const));
    useGameStore.getState().applyGapAction('redesignSmaller');
    render(<Header />);
    expect(screen.getByText(/50 units/)).toBeInTheDocument();
    expect(screen.queryByText(/60 units/)).toBeNull();
  });

  it('shows reduced units after entitlement.projectShrinkBy increases', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    useGameStore.setState((s) => ({
      entitlement: { ...s.entitlement, projectShrinkBy: 12 },
    }));
    render(<Header />);
    expect(screen.getByText(/48 units/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- tests/components/Header.test.tsx`
Expected: FAIL — shows "60 units" even after shrinks.

- [ ] **Step 3: Update Header**

In `src/components/Header.tsx`, add import:
```typescript
import { computeTdc } from '../game/proForma';
```
Already imported. Add:
```typescript
import { getEffectiveUnits } from '../game/proForma';
```

Compute `effectiveUnits`:
```typescript
const state = useGameStore((s) => s);
const effectiveUnits = getEffectiveUnits(state);
```

Find the `computeTdc({ ... units: project.units, ... })` call. Replace with:
```typescript
const tdcParts = computeTdc({
  neighborhood: project.neighborhood,
  units: effectiveUnits,
  buildingType: project.buildingType,
  finishLevel: proForma.finishLevel,
});
```

In the JSX, find:
```tsx
{n.emoji} <b className="text-ink">{n.name}</b> · {project.units} units · ...
```
Replace `{project.units}` with `{effectiveUnits}`.

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test -- tests/components/Header.test.tsx`
Expected: PASS.

- [ ] **Step 5: Run full suite**

Run: `npm test`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/Header.tsx tests/components/Header.test.tsx
git commit -m "fix(header): show effective units (after shrinks) in banner (v5 item 7)"
```

---

### Task 4.3: Wire `computeEffectiveGap` and `closeReactions` to `getEffectiveUnits`

**Files:**
- Modify: `src/game/gapResolution.ts`
- Modify: `src/data/closeReactions.ts`

- [ ] **Step 1: Update computeEffectiveGap**

In `src/game/gapResolution.ts`, add import:
```typescript
import { computeNoi, computeSupportableDebt, getEffectiveUnits, effectiveHardPerUnit } from './proForma';
```

Replace the manual `effectiveUnits` and `effectiveHardPerUnit` computation:
```typescript
const effectiveUnits = Math.max(0, state.project.units - state.gapResolution.shrinkBy);
const qualityMul = state.gapResolution.lowerQualityUsed ? LOWER_QUALITY_HARD_MULTIPLIER : 1;
const effectiveHardPerUnit =
  HARD_COST_PER_UNIT[state.project.buildingType] *
  FINISH_MULTIPLIER[state.proForma.finishLevel] *
  qualityMul;
```
With:
```typescript
const effectiveUnits = getEffectiveUnits(state);
const hardPerUnit = effectiveHardPerUnit(state);
```

Rename remaining references to `effectiveHardPerUnit` (the local variable in the original code) to `hardPerUnit`. Specifically:
```typescript
const hard = effectiveHardPerUnit * effectiveUnits;
```
becomes:
```typescript
const hard = hardPerUnit * effectiveUnits;
```

And in the returned breakdown:
```typescript
return {
  effectiveUnits, effectiveHardPerUnit, land, hard, soft, contingency,
  ...
};
```
update the property name:
```typescript
return {
  effectiveUnits, effectiveHardPerUnit: hardPerUnit, land, hard, soft, contingency,
  ...
};
```

(The interface `EffectiveGapBreakdown` keeps its existing `effectiveHardPerUnit: number` field name; we just rename the local variable to avoid shadowing the import.)

- [ ] **Step 2: Update closeReactions**

In `src/data/closeReactions.ts`, add import:
```typescript
import { getEffectiveUnits } from '../game/proForma';
```

Find the line in `successReactions`:
```typescript
const finalUnits = Math.max(1, state.project.units - state.entitlement.projectShrinkBy);
```
Replace with:
```typescript
const finalUnits = Math.max(1, getEffectiveUnits(state));
```

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: all pass. The Phase 4 `getEffectiveUnits` tests and existing gap/close tests continue to work because semantics are preserved (both shrink fields subtracted; floor preserved by `Math.max(MIN_UNITS_FLOOR, ...)`).

- [ ] **Step 4: Commit**

```bash
git add src/game/gapResolution.ts src/data/closeReactions.ts
git commit -m "fix(gap,close): use getEffectiveUnits + effectiveHardPerUnit helpers (v5 phase 4)"
```

---

### Task 4.4: Wire Entitlement choice-card cost-escalation preview to effective units

**Files:**
- Modify: `src/screens/Entitlement.tsx`

- [ ] **Step 1: Update cost-escalation preview**

In `src/screens/Entitlement.tsx`, find (around line 297):
```tsx
const hardPerU = HARD_COST_PER_UNIT[project.buildingType] * FINISH_MULTIPLIER[proForma.finishLevel];
const hard = hardPerU * project.units;
```

Replace with:
```tsx
const hardPerU = effectiveHardPerUnit(fullState);
const hard = hardPerU * getEffectiveUnits(fullState);
```

Add imports at top of file:
```typescript
import { effectiveHardPerUnit, getEffectiveUnits } from '../game/proForma';
```

Remove the now-unused `HARD_COST_PER_UNIT` and `FINISH_MULTIPLIER` imports IF no other code in the file uses them. Check the rest of the file with a grep before removing.

- [ ] **Step 2: Run tests**

Run: `npm test`
Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add src/screens/Entitlement.tsx
git commit -m "fix(entitlement): cost-escalation preview uses effective units + hard-per-unit (v5 phase 4)"
```

---

### Task 4.5: Document `tdcDelta` semantics in `ChoiceConsequence`

**Files:**
- Modify: `src/game/entitlement.ts`

- [ ] **Step 1: Add JSDoc to `tdcDelta` field**

In `src/game/entitlement.ts`, find:
```typescript
export interface ChoiceConsequence {
  alderDelta: number;
  communityDelta: number;
  tdcDelta: number;
  shrinkBy: number;
  extraSubsidyDelta?: number;
}
```
Replace with:
```typescript
export interface ChoiceConsequence {
  alderDelta: number;
  communityDelta: number;
  /**
   * Per-unit cost delta in dollars. `takeEntitlementStep` multiplies by
   * `getEffectiveUnits(state)` when accruing to costEscalation. To express
   * a flat dollar amount, divide by an expected unit count or model as a
   * dedicated state field (see entitlement.designUpgrade).
   */
  tdcDelta: number;
  shrinkBy: number;
  extraSubsidyDelta?: number;
}
```

- [ ] **Step 2: Update `takeEntitlementStep` to use effective units**

In `src/game/state.ts`, find:
```typescript
if (consequence.tdcDelta) {
  get().addCostEscalation(consequence.tdcDelta * s.project.units);
}
```
Replace with:
```typescript
if (consequence.tdcDelta) {
  get().addCostEscalation(consequence.tdcDelta * getEffectiveUnits(s));
}
```

Add import at top of `state.ts` if not present:
```typescript
import { getEffectiveUnits } from './proForma';
```

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: all pass. The JP parking tests should continue green (still per-unit multiplication, just now using effective units instead of raw).

- [ ] **Step 4: Commit**

```bash
git add src/game/entitlement.ts src/game/state.ts
git commit -m "fix(entitlement): tdcDelta is per-unit and uses effective units (v5 item 11)"
```

---

## Phase 5 — Entitlement narrative + failure gates + design upgrade (Items 8, 9, 10, 12, 14)

### Task 5.1: Add `zoning-design-upgrade` choice + `setDesignUpgrade` action

**Files:**
- Modify: `src/game/types.ts`
- Modify: `src/game/entitlement.ts`
- Modify: `src/game/state.ts`
- Modify: `tests/game/entitlement.test.ts`

- [ ] **Step 1: Write failing tests**

In `tests/game/entitlement.test.ts`, find any existing `'zoning-accept'` test and remove it. Add:
```typescript
describe('zoning-design-upgrade choice (v5 item 10)', () => {
  it('applies +10 community, ±0 alder, sets designUpgrade flag', () => {
    const result = applyChoice('zoning-design-upgrade');
    expect(result.alderDelta).toBe(0);
    expect(result.communityDelta).toBe(10);
    expect(result.designUpgrade).toBe(true);
  });
});
```

Also in `tests/game/state.test.ts`, add:
```typescript
describe('setDesignUpgrade action (v5 item 10)', () => {
  beforeEach(() => useGameStore.getState().reset());
  it('toggles entitlement.designUpgrade', () => {
    useGameStore.getState().setDesignUpgrade(true);
    expect(useGameStore.getState().entitlement.designUpgrade).toBe(true);
    useGameStore.getState().setDesignUpgrade(false);
    expect(useGameStore.getState().entitlement.designUpgrade).toBe(false);
  });

  it('takeEntitlementStep("zoning-design-upgrade", 3) sets designUpgrade=true', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().takeEntitlementStep('zoning-design-upgrade', 3);
    expect(useGameStore.getState().entitlement.designUpgrade).toBe(true);
  });
});
```

- [ ] **Step 2: Update `StepChoiceKey`**

In `src/game/types.ts`, change `| 'zoning-hold' | 'zoning-shrink' | 'zoning-accept'` to:
```typescript
| 'zoning-hold' | 'zoning-shrink' | 'zoning-design-upgrade'
```

- [ ] **Step 3: Update `ChoiceConsequence` and `applyChoice`**

In `src/game/entitlement.ts`, add to `ChoiceConsequence`:
```typescript
export interface ChoiceConsequence {
  alderDelta: number;
  communityDelta: number;
  tdcDelta: number;
  shrinkBy: number;
  extraSubsidyDelta?: number;
  designUpgrade?: boolean;
}
```

In `applyChoice`, replace:
```typescript
case 'zoning-accept':
  return { ...base, alderDelta: -8, communityDelta: 0, tdcDelta: 1_400_000 };
```
With:
```typescript
case 'zoning-design-upgrade':
  return { ...base, alderDelta: 0, communityDelta: 10, designUpgrade: true };
```

- [ ] **Step 4: Add `setDesignUpgrade` action and wire it**

In `src/game/state.ts`, in the `StoreActions` interface, add:
```typescript
setDesignUpgrade: (value: boolean) => void;
```

In the store implementation, add:
```typescript
setDesignUpgrade: (value) => set((s) => ({
  entitlement: { ...s.entitlement, designUpgrade: value },
})),
```

In `takeEntitlementStep`, after the existing `if (consequence.extraSubsidyDelta) { ... }` block, add:
```typescript
if (consequence.designUpgrade) {
  get().setDesignUpgrade(true);
}
```

- [ ] **Step 5: Update Entitlement screen choice list**

In `src/screens/Entitlement.tsx`, find:
```typescript
{ key: 'zoning-accept', title: 'Accept conditions', description: "Take Committee's height cap & unit-mix conditions.", consequences: '−8 alder · ±0 community · TDC +$1.4M' },
```
Replace with:
```typescript
{ key: 'zoning-design-upgrade', title: 'Increase design quality', description: "Committee imposes design upgrades — better facade, units, common spaces.", consequences: '±0 alder · +10 community · Hard costs +15%' },
```

- [ ] **Step 6: Remove `'zoning-accept'` reference from closeReactions**

In `src/data/closeReactions.ts`, find:
```typescript
const parkingConcerned =
  state.project.buildingType === 'larger' || pastChoiceKeys.includes('zoning-accept');
```
Replace with:
```typescript
const parkingConcerned = state.project.buildingType === 'larger';
```

Remove the now-unused `pastChoiceKeys` variable if no other code in the file references it. Check by grep before removing.

- [ ] **Step 7: Update `computeTdc` to use `effectiveHardPerUnit`**

In `src/game/proForma.ts`, find the existing `computeTdc` implementation. It currently uses `HARD_COST_PER_UNIT[buildingType] * FINISH_MULTIPLIER[finishLevel]` directly. Refactor so the per-unit hard cost respects designUpgrade and lowerQualityUsed when the caller passes a full `GameState` — but keep the existing pure-input signature for backwards compat.

Since `computeTdc` currently takes `{ neighborhood, units, buildingType, finishLevel }`, the cleanest path is to leave `computeTdc` as-is (it's used in many places with literal params) and require callers that have access to full GameState (like Header, computeEffectiveGap, tickMonths cost-escalation rate) to use `effectiveHardPerUnit(state)` for their own hard cost.

Audit: where is `computeTdc` called?
- `ProForma.tsx` — uses `proForma.finishLevel` only; `designUpgrade` isn't relevant here because the upgrade is set at CoZ (later in the flow). However, if user goes back to ProForma after CoZ via "Back" button, the TDC display would be stale. Since `Back` only works phase-by-phase and CoZ is in entitlement (phase 6), and ProForma is phase 3, this is a non-issue.
- `Header.tsx` — needs `designUpgrade` reflected. **Wire here.**
- `Close.tsx` — TDC at close should reflect the final hard cost. **Wire here.**
- `CapitalStack.tsx` — same concern as ProForma; only finish level applies in this flow.
- `SiteAndConcept.tsx` — phase 2, before any flags fire. No change.

The clean fix: in `Header.tsx` and `Close.tsx`, replace `computeTdc(...)` with a manual TDC calculation using `effectiveHardPerUnit(state)`. To keep DRY, add a helper:

In `src/game/proForma.ts`, append:
```typescript
export function computeTdcFromState(state: GameState): { hard: number; land: number; soft: number; contingency: number; total: number } {
  if (!state.project.neighborhood) {
    return { hard: 0, land: 0, soft: 0, contingency: 0, total: 0 };
  }
  const units = getEffectiveUnits(state);
  const hardPerUnit = effectiveHardPerUnit(state);
  const hard = hardPerUnit * units;
  const n = getNeighborhood(state.project.neighborhood);
  const land = n.landCostPerUnit * LAND_COST_BUILDING_MULTIPLIER[state.project.buildingType] * units;
  const soft = hard * SOFT_COST_RATIO;
  const contingency = hard * CONTINGENCY_RATIO;
  return { hard, land, soft, contingency, total: hard + land + soft + contingency };
}
```

Add the necessary imports (LAND_COST_BUILDING_MULTIPLIER, SOFT_COST_RATIO, CONTINGENCY_RATIO, getNeighborhood). Note: if `proForma.ts` doesn't currently depend on `../data/neighborhoods`, this introduces a new dependency direction — that's fine since `data/neighborhoods.ts` is pure data with no cyclic risk.

- [ ] **Step 8: Wire `computeTdcFromState` into Header**

In `src/components/Header.tsx`, replace the `computeTdc(...)` call with:
```typescript
import { computeTdcFromState, getEffectiveUnits } from '../game/proForma';
const tdcParts = computeTdcFromState(state);
```
(`state` already in scope from Task 4.2.)

- [ ] **Step 9: Wire `computeTdcFromState` into Close**

In `src/screens/Close.tsx`, the existing TDC calc uses `computeTdc({ units: finalUnits, ... })` which intentionally re-computes from `finalUnits`. Replace it with `computeTdcFromState(state)` since `getEffectiveUnits` already accounts for both shrink fields. Add the `state` selector:
```typescript
const state = useGameStore((s) => s);
const tdcParts = computeTdcFromState(state);
const tdcTotal = tdcParts.total + costEscalation;
```

Remove the now-unused `computeTdc` import + the `tdcParts` block that used it.

- [ ] **Step 10: Wire `effectiveHardPerUnit` into `tickMonths` cost-escalation rate**

In `src/game/state.ts`, find `tickMonths`:
```typescript
tickMonths: (n: number) => set((s) => {
  if (!s.project.neighborhood) return {};
  const qualityMul = s.gapResolution.lowerQualityUsed ? LOWER_QUALITY_HARD_MULTIPLIER : 1;
  const effectiveUnits = Math.max(0, s.project.units - s.gapResolution.shrinkBy);
  const hardPerU = HARD_COST_PER_UNIT[s.project.buildingType] * FINISH_MULTIPLIER[s.proForma.finishLevel] * qualityMul;
  ...
}),
```
Replace the `qualityMul`, `effectiveUnits`, `hardPerU` block with:
```typescript
const effUnits = getEffectiveUnits(s);
const hardPerU = effectiveHardPerUnit(s);
```
Then `const hard = hardPerU * effUnits;` (rename if needed).

Add import:
```typescript
import { getEffectiveUnits, effectiveHardPerUnit } from './proForma';
```

- [ ] **Step 11: Run tests**

Run: `npm test`
Expected: PASS. The new tests from Step 1 pass; existing entitlement/state tests pass after the `zoning-accept` → `zoning-design-upgrade` rename.

- [ ] **Step 12: Commit**

```bash
git add src/game/types.ts src/game/entitlement.ts src/game/state.ts src/game/proForma.ts src/components/Header.tsx src/screens/Close.tsx src/screens/Entitlement.tsx src/data/closeReactions.ts tests/game/entitlement.test.ts tests/game/state.test.ts
git commit -m "feat(entitlement): replace zoning-accept with zoning-design-upgrade (+15% hard, +10 community) (v5 item 10)"
```

---

### Task 5.2: Add `isCommitteeFailed` helper and wire the gates

**Files:**
- Modify: `src/game/entitlement.ts`
- Modify: `src/game/state.ts` (or leave end-check removal for Task 5.3)
- Modify: `src/screens/Entitlement.tsx`
- Modify: `tests/game/entitlement.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `tests/game/entitlement.test.ts`:
```typescript
import { isCommitteeFailed } from '../../src/game/entitlement';

describe('isCommitteeFailed (v5 item 14)', () => {
  it('returns "alder" when alderGoodwill < 50', () => {
    expect(isCommitteeFailed({ alderGoodwill: 49, communitySupport: 80 })).toBe('alder');
  });
  it('returns "community" when alderGoodwill >= 50 and communitySupport < 30', () => {
    expect(isCommitteeFailed({ alderGoodwill: 60, communitySupport: 29 })).toBe('community');
  });
  it('prefers alder when both are below threshold', () => {
    expect(isCommitteeFailed({ alderGoodwill: 30, communitySupport: 20 })).toBe('alder');
  });
  it('returns null when both pass', () => {
    expect(isCommitteeFailed({ alderGoodwill: 50, communitySupport: 30 })).toBe(null);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- tests/game/entitlement.test.ts`
Expected: FAIL — `isCommitteeFailed` not exported.

- [ ] **Step 3: Implement helper**

Append to `src/game/entitlement.ts`:
```typescript
export function isCommitteeFailed(input: {
  alderGoodwill: number;
  communitySupport: number;
}): 'alder' | 'community' | null {
  if (input.alderGoodwill < 50) return 'alder';
  if (input.communitySupport < 30) return 'community';
  return null;
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test -- tests/game/entitlement.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire the gate in Entitlement.tsx**

In `src/screens/Entitlement.tsx`, find `onChoose`:
```typescript
function onChoose(choice: StepChoiceKey) {
  const months = currentStep != null ? durationFor(currentStep, choice) : 0;
  takeStep(choice, currentStep ?? 1);
  // ... existing side effects ...
  tickMonths(months);
}
```

After `tickMonths(months);`, append:
```typescript
// Committee gate: if the step we just completed was CoZ (3) or CoF (4),
// check failure thresholds and set outcome immediately (the failure panel
// will render on next render and advance phase via its button).
if (currentStep === 3 || currentStep === 4) {
  const ent = useGameStore.getState().entitlement;
  const failure = isCommitteeFailed(ent);
  if (failure === 'alder') {
    setOutcome('shelved-finance');
  } else if (failure === 'community') {
    setOutcome('shelved-community');
  }
}
```

Add the import:
```typescript
import { isCommitteeFailed } from '../game/entitlement';
```

- [ ] **Step 6: Remove end-of-entitlement check from `onComplete`**

In the same file, find `onComplete`:
```typescript
function onComplete() {
  const affordableUnits = ...;
  const totalUnits = ...;
  const affordableShare = ...;

  if (affordableShare < ARO_FLOOR_AFFORDABLE_SHARE) {
    setOutcome('shelved-aro');
    advancePhase();
    return;
  }

  if (entitlement.alderGoodwill < 20) {
    setOutcome('shelved-finance');
  } else if (entitlement.communitySupport < 25) {
    setOutcome('shelved-community');
  } else {
    setOutcome('closed');
  }
  advancePhase();
}
```
Replace the block with:
```typescript
function onComplete() {
  const affordableUnits =
    proForma.amiBreakdown[30] + proForma.amiBreakdown[60] + proForma.amiBreakdown[80];
  const totalUnits = affordableUnits + (proForma.marketUnits ?? 0);
  const affordableShare = totalUnits > 0 ? affordableUnits / totalUnits : 1;

  if (affordableShare < ARO_FLOOR_AFFORDABLE_SHARE) {
    setOutcome('shelved-aro');
    advancePhase();
    return;
  }

  // No end-of-entitlement alder/community check — failure gates fire at CoZ/CoF.
  setOutcome('closed');
  advancePhase();
}
```

- [ ] **Step 7: Add component test for failure gate**

Create `tests/components/Entitlement.test.tsx` (or append if exists):
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Entitlement } from '../../src/screens/Entitlement';
import { useGameStore } from '../../src/game/state';

function setupAtCoZ() {
  const s = useGameStore.getState();
  s.reset();
  s.selectNeighborhood('englewood');
  s.setUnits(50);
  s.setBuildingType('midrise');
  // Walk through phases to entitlement
  for (let i = 0; i < 5; i++) s.advancePhase();
  // Take pre-app + community to put us at step 3 (CoZ) for midrise (ZMA path)
  s.takeEntitlementStep('preapp-quiet', 1);
  s.takeEntitlementStep('community-story', 2);
}

describe('Entitlement committee failure gates (v5 item 14)', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('CoZ choice with alder=45 sets outcome shelved-finance', () => {
    setupAtCoZ();
    useGameStore.setState((s) => ({
      entitlement: { ...s.entitlement, alderGoodwill: 45, communitySupport: 60 },
    }));
    render(<Entitlement />);
    // Take any CoZ choice — use zoning-hold to avoid side effects
    fireEvent.click(screen.getByText(/Hold the line/));
    expect(useGameStore.getState().outcome).toBe('shelved-finance');
  });

  it('CoZ choice with alder=60 community=25 sets outcome shelved-community', () => {
    setupAtCoZ();
    useGameStore.setState((s) => ({
      entitlement: { ...s.entitlement, alderGoodwill: 60, communitySupport: 25 },
    }));
    render(<Entitlement />);
    fireEvent.click(screen.getByText(/Hold the line/));
    expect(useGameStore.getState().outcome).toBe('shelved-community');
  });

  it('CoZ choice with alder=60 community=60 leaves outcome in-progress', () => {
    setupAtCoZ();
    useGameStore.setState((s) => ({
      entitlement: { ...s.entitlement, alderGoodwill: 60, communitySupport: 60 },
    }));
    render(<Entitlement />);
    fireEvent.click(screen.getByText(/Hold the line/));
    expect(useGameStore.getState().outcome).toBe('in-progress');
  });
});
```

- [ ] **Step 8: Run tests**

Run: `npm test`
Expected: all pass. Existing tests that previously asserted on the alder<20/community<25 end-check may break — update them to the new semantics (those code paths now only reachable via CoZ/CoF gates).

- [ ] **Step 9: Commit**

```bash
git add src/game/entitlement.ts src/screens/Entitlement.tsx tests/game/entitlement.test.ts tests/components/Entitlement.test.tsx
git commit -m "feat(entitlement): alder<50/community<30 failure gates at CoZ and CoF (v5 item 14)"
```

---

### Task 5.3: Add alder intro framing + per-step framing

**Files:**
- Modify: `src/data/characters.ts`
- Modify: `src/screens/Entitlement.tsx`
- Modify: `tests/components/Entitlement.test.tsx`

- [ ] **Step 1: Add `entitlementIntroLines` to characters.ts**

Append to `src/data/characters.ts`:
```typescript
export const entitlementIntroLines = {
  withZoning:
    "You've agreed with the Department of Housing on how to finance the project, but current zoning doesn't allow a building this big, so you'll need to get a zoning change from City Council. You'll also need Council to approve your financing. I expect you to work with the community to gain support. And of course this takes time, which can reopen your financing gap.",
  withoutZoning:
    "You've agreed with the Department of Housing on how to finance the project. You'll need Council to approve your financing. I expect you to work with the community to gain support. And of course this takes time, which can reopen your financing gap.",
};
```

- [ ] **Step 2: Add alder intro bubble to Entitlement screen**

In `src/screens/Entitlement.tsx`, find the JSX block right after the `<h2 className="text-2xl mt-6 mb-4">Entitlement</h2>` line (around line 186). Insert:
```tsx
<div className="mb-3">
  <CharacterBubble
    characterId={getNeighborhoodAlderId(n.id)}
    line={path !== 'by-right' ? entitlementIntroLines.withZoning : entitlementIntroLines.withoutZoning}
  />
</div>
```

Add imports at top of file:
```typescript
import { entitlementIntroLines, getNeighborhoodAlderId } from '../data/characters';
```

- [ ] **Step 3: Add per-step framing inside the active-step box**

Still in `Entitlement.tsx`, find the active-step `<div className="bg-bg border-2 border-caution rounded-lg p-4 mb-3">` block. Right after the `▶ Step N` header `<div>`, insert per-step framing:
```tsx
{currentStep === 2 && (
  <p className="text-xs italic text-muted mt-2">
    Today the project meets the neighborhood. The block club, CBOs, and longtime residents will get the first real look. How you run this room sets the tone for everything that follows.
  </p>
)}
{currentStep === 3 && (
  <p className="text-xs italic text-muted mt-2">
    The zoning committee can approve or deny your zoning change—and without it, the project dies. Usually, aldermanic privilege gives your alder the deciding vote in favor — but only if you've kept their goodwill.
  </p>
)}
{currentStep === 4 && (
  <p className="text-xs italic text-muted mt-2">
    Finance signs off on the public subsidy. Cunningham will hammer the cost-per-unit; Reyes will swing at TIF. You need the room to back you before the vote.
  </p>
)}
```

- [ ] **Step 4: Add component test for intro framing**

Append to `tests/components/Entitlement.test.tsx`:
```typescript
function setupAtEntitlement(opts: { buildingType?: 'walkup' | 'midrise' | 'larger'; units?: number; neighborhood?: 'englewood' | 'pilsen' | 'jefferson-park' | 'albany-park' } = {}) {
  const s = useGameStore.getState();
  s.reset();
  s.selectNeighborhood(opts.neighborhood ?? 'englewood');
  s.setUnits(opts.units ?? 50);
  s.setBuildingType(opts.buildingType ?? 'midrise');
  for (let i = 0; i < 5; i++) s.advancePhase();
}

describe('Entitlement alder intro framing (v5 item 8)', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('ZMA path shows the zoning sentence', () => {
    setupAtEntitlement({ buildingType: 'midrise' });  // midrise = ZMA
    render(<Entitlement />);
    expect(screen.getByText(/current zoning doesn't allow a building this big/)).toBeInTheDocument();
  });

  it('by-right path omits the zoning sentence', () => {
    setupAtEntitlement({ buildingType: 'walkup', units: 24, neighborhood: 'englewood' });
    render(<Entitlement />);
    expect(screen.queryByText(/current zoning doesn't allow/)).toBeNull();
    expect(screen.getByText(/You'll need Council to approve your financing/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/data/characters.ts src/screens/Entitlement.tsx tests/components/Entitlement.test.tsx
git commit -m "feat(entitlement): alder intro framing + per-step framing for community/CoZ/CoF (v5 items 8, 9)"
```

---

### Task 5.4: Failure narrative panel + outcome gating on completion panel

**Files:**
- Modify: `src/screens/Entitlement.tsx`
- Modify: `tests/components/Entitlement.test.tsx`

- [ ] **Step 1: Add the failure narrative panel**

In `src/screens/Entitlement.tsx`, find the `{allStepsComplete && (...)}` block. Right BEFORE it, insert:
```tsx
{(outcome === 'shelved-finance' || outcome === 'shelved-community') && (
  <div className="bg-bg p-4 rounded-lg text-sm">
    <b>Committee on {(() => {
      const last = entitlement.pastChoices[entitlement.pastChoices.length - 1];
      return last && last.step === 3 ? 'Zoning' : 'Finance';
    })()} (narrative):</b>
    <br />
    <i className="text-muted">
      {outcome === 'shelved-finance'
        ? `With aldermanic support below the line, Ald. ${n.alderName} pulled the ordinance. No vote was held. Without committee backing, the project cannot advance to Council.`
        : `The block club's opposition was visible enough that Ald. ${n.alderName} pulled the ordinance before a vote. The project cannot advance without community backing.`}
    </i>
    <button
      onClick={advancePhase}
      className="block w-full mt-4 bg-accent text-white py-3 rounded-lg font-bold"
    >
      See your result →
    </button>
  </div>
)}
```

Add `outcome` to the store selectors at the top of the function:
```typescript
const outcome = useGameStore((s) => s.outcome);
```

- [ ] **Step 2: Gate existing completion panel on outcome**

Find the `{allStepsComplete && (` block. Change to:
```tsx
{allStepsComplete && outcome === 'in-progress' && (
```

- [ ] **Step 3: Hide the active-step box when outcome is not in-progress**

Find the active-step block:
```tsx
{!cofGapOpen && !allStepsComplete && currentStep != null && (
```
Change to:
```tsx
{!cofGapOpen && !allStepsComplete && currentStep != null && outcome === 'in-progress' && (
```

Similarly for the CoF gap-gate block:
```tsx
{cofGapOpen && (
```
Change to:
```tsx
{cofGapOpen && outcome === 'in-progress' && (
```

- [ ] **Step 4: Add component test**

Append to `tests/components/Entitlement.test.tsx`:
```typescript
describe('Entitlement failure narrative panel (v5 item 12)', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('failure panel renders when outcome is shelved-finance', () => {
    setupAtCoZ();
    useGameStore.setState((s) => ({
      entitlement: { ...s.entitlement, alderGoodwill: 45, communitySupport: 60 },
    }));
    render(<Entitlement />);
    fireEvent.click(screen.getByText(/Hold the line/));
    // Re-render after state change
    expect(screen.getByText(/pulled the ordinance/)).toBeInTheDocument();
    expect(screen.queryByText(/passed the ordinance/)).toBeNull();
  });

  it('"passed 41-9" completion panel does NOT render when outcome is shelved-finance', () => {
    setupAtCoZ();
    useGameStore.setState((s) => ({
      entitlement: {
        ...s.entitlement,
        alderGoodwill: 45,
        communitySupport: 60,
        // Simulate having finished all steps (e.g. by-right CoF failure edge case)
        pastChoices: [
          { step: 1, choice: 'preapp-quiet', alderDelta: 2, communityDelta: 0 },
          { step: 2, choice: 'community-story', alderDelta: 0, communityDelta: 12 },
          { step: 4, choice: 'finance-reframe', alderDelta: -2, communityDelta: 0 },
        ],
      },
      outcome: 'shelved-finance',
    }));
    render(<Entitlement />);
    expect(screen.queryByText(/passed the ordinance 41–9/)).toBeNull();
    expect(screen.getByText(/pulled the ordinance/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/screens/Entitlement.tsx tests/components/Entitlement.test.tsx
git commit -m "fix(entitlement): failure narrative panel; gate completion panel on outcome (v5 item 12)"
```

---

## Phase 6 — "What happened?" narrative + LIHTC quantization (Items 1, 13)

### Task 6.1: Quantize LIHTC odds in `computeQapScore`

**Files:**
- Modify: `src/game/capitalStack.ts`
- Modify: `tests/game/capitalStack.test.ts`

- [ ] **Step 1: Write failing test**

Append to `tests/game/capitalStack.test.ts`:
```typescript
import { computeQapScore } from '../../src/game/capitalStack';
import { useGameStore } from '../../src/game/state';

describe('LIHTC odds quantization (v5 item 13)', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('odds × 100 is always an integer for representative states', () => {
    const states = [
      () => { useGameStore.getState().selectNeighborhood('englewood'); },
      () => { useGameStore.getState().selectNeighborhood('pilsen'); useGameStore.getState().setFinishLevel('elevated'); },
      () => { useGameStore.getState().selectNeighborhood('jefferson-park'); useGameStore.getState().setFinishLevel('basic'); },
    ];
    for (const setup of states) {
      useGameStore.getState().reset();
      setup();
      const { odds } = computeQapScore(useGameStore.getState());
      expect(Number.isInteger(Math.round(odds * 100))).toBe(true);
      expect(Math.abs(odds * 100 - Math.round(odds * 100))).toBeLessThan(1e-9);
    }
  });
});
```

- [ ] **Step 2: Run to verify failure (it may pass by luck — quantization makes it reliable)**

Run: `npm test -- tests/game/capitalStack.test.ts`
Expected: likely PASS by luck since most odds land on integer percents already, but our goal is to GUARANTEE quantization.

- [ ] **Step 3: Update `computeQapScore`**

In `src/game/capitalStack.ts`, find:
```typescript
export function computeQapScore(state: GameState): { score: number; odds: number } {
  if (!state.project.neighborhood) {
    return { score: 0, odds: 0 };
  }
  const score = computeLihtcScore({ ... });
  const odds = estimatedAwardProbability(score);
  return { score, odds };
}
```
Replace the last two lines (before `return`) with:
```typescript
  const rawOdds = estimatedAwardProbability(score);
  // Quantize to whole-percent so display percentage = used probability.
  const odds = Math.round(rawOdds * 100) / 100;
  return { score, odds };
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/game/capitalStack.ts tests/game/capitalStack.test.ts
git commit -m "fix(stack): quantize LIHTC odds so display equals roll value (v5 item 13)"
```

---

### Task 6.2: Extend `lastRecap` with narrative; widen `tickMonths`

**Files:**
- Modify: `src/game/types.ts`
- Modify: `src/game/state.ts`
- Modify: `tests/game/state.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `tests/game/state.test.ts`:
```typescript
describe('tickMonths with narrative (v5 item 1)', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('tickMonths(9, narrative) sets lastRecap.narrative', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.setState({ phase: 4 } as any);
    useGameStore.getState().tickMonths(9, { characterId: 'asha', line: 'Test narrative.' });
    const recap = useGameStore.getState().lastRecap;
    expect(recap).not.toBeNull();
    expect(recap!.narrative).toEqual({ characterId: 'asha', line: 'Test narrative.' });
  });

  it('tickMonths(9) without narrative leaves narrative null', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.setState({ phase: 4 } as any);
    useGameStore.getState().tickMonths(9);
    const recap = useGameStore.getState().lastRecap;
    expect(recap).not.toBeNull();
    expect(recap!.narrative).toBeNull();
  });

  it('tickMonths(2, narrative) does NOT set lastRecap (under threshold)', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.setState({ phase: 4 } as any);
    useGameStore.getState().tickMonths(2, { characterId: 'asha', line: 'x' });
    expect(useGameStore.getState().lastRecap).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify compile failure**

Run: `npm test -- tests/game/state.test.ts`
Expected: FAIL — `tickMonths` doesn't accept a second arg; `lastRecap.narrative` doesn't exist.

- [ ] **Step 3: Extend `lastRecap` type**

In `src/game/types.ts`, find:
```typescript
lastRecap: {
  months: number;
  escalationAdded: number;
} | null;
```
Replace with:
```typescript
lastRecap: {
  months: number;
  escalationAdded: number;
  narrative: { characterId: CharacterId; line: string } | null;
} | null;
```

Add import at top of `types.ts`:
```typescript
import type { CharacterId } from '../data/characters';
```

If this creates a circular dep (data/characters imports from types), use a string literal type instead:
```typescript
narrative: { characterId: string; line: string } | null;
```
(The runtime cost is minimal; the `string` widens to any CharacterId.) Use this fallback if compilation errors.

- [ ] **Step 4: Widen `tickMonths` signature**

In `src/game/state.ts`, find:
```typescript
tickMonths: (n: number) => void;
```
in the `StoreActions` interface. Change to:
```typescript
tickMonths: (n: number, narrative?: { characterId: CharacterId; line: string }) => void;
```

In the implementation, find:
```typescript
tickMonths: (n: number) => set((s) => {
  if (!s.project.neighborhood) return {};
  // ... cost-escalation calc ...
  return {
    monthsElapsed: s.monthsElapsed + n,
    costEscalation: s.costEscalation + escalationAdded,
    ...(n >= 3 ? { lastRecap: { months: n, escalationAdded } } : {}),
  };
}),
```
Replace with:
```typescript
tickMonths: (n: number, narrative?: { characterId: CharacterId; line: string }) => set((s) => {
  if (!s.project.neighborhood) return {};
  // ... cost-escalation calc unchanged ...
  return {
    monthsElapsed: s.monthsElapsed + n,
    costEscalation: s.costEscalation + escalationAdded,
    ...(n >= 3 ? { lastRecap: { months: n, escalationAdded, narrative: narrative ?? null } } : {}),
  };
}),
```

Add import if needed:
```typescript
import type { CharacterId } from '../data/characters';
```

- [ ] **Step 5: Run tests**

Run: `npm test -- tests/game/state.test.ts`
Expected: PASS for new tests; existing recap tests may need updating to include `narrative: null` in their asserted recap shape.

- [ ] **Step 6: Run full suite**

Run: `npm test`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add src/game/types.ts src/game/state.ts tests/game/state.test.ts
git commit -m "feat(state): tickMonths accepts optional narrative; lastRecap carries it through (v5 item 1 prep)"
```

---

### Task 6.3: Add `recapNarratives` + `resolveRecapNarrative`

**Files:**
- Modify: `src/data/characters.ts`
- Create: `tests/data/recapNarratives.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/data/recapNarratives.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { resolveRecapNarrative } from '../../src/data/characters';
import { useGameStore } from '../../src/game/state';

describe('resolveRecapNarrative (v5 item 1)', () => {
  it('returns null for an unknown key', () => {
    useGameStore.getState().reset();
    useGameStore.getState().selectNeighborhood('englewood');
    expect(resolveRecapNarrative(useGameStore.getState(), 'no-such-key')).toBeNull();
  });

  it('returns asha-spoken narrative for community-story in englewood', () => {
    useGameStore.getState().reset();
    useGameStore.getState().selectNeighborhood('englewood');
    const r = resolveRecapNarrative(useGameStore.getState(), 'community-story');
    expect(r).not.toBeNull();
    expect(r!.characterId).toBe('asha');
    expect(r!.line.length).toBeGreaterThan(10);
  });

  it('uses the neighborhood alder for entitlement choices (pilsen → carlos)', () => {
    useGameStore.getState().reset();
    useGameStore.getState().selectNeighborhood('pilsen');
    const r = resolveRecapNarrative(useGameStore.getState(), 'community-story');
    expect(r!.characterId).toBe('carlos');
  });

  it('returns david-spoken narrative for redesignSmaller', () => {
    useGameStore.getState().reset();
    useGameStore.getState().selectNeighborhood('englewood');
    const r = resolveRecapNarrative(useGameStore.getState(), 'redesignSmaller');
    expect(r!.characterId).toBe('david');
  });

  it('returns janelle-spoken narrative for lihtcSubmit', () => {
    useGameStore.getState().reset();
    useGameStore.getState().selectNeighborhood('englewood');
    const r = resolveRecapNarrative(useGameStore.getState(), 'lihtcSubmit');
    expect(r!.characterId).toBe('janelle');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- tests/data/recapNarratives.test.ts`
Expected: FAIL — `resolveRecapNarrative` not exported.

- [ ] **Step 3: Implement `recapNarratives` table and resolver**

Append to `src/data/characters.ts`:
```typescript
import type { GameState } from '../game/types';

type RecapCategory = 'alder' | 'david' | 'janelle' | 'asha';

interface RecapEntry {
  category: RecapCategory;
  line: string;
}

export const recapNarratives: Record<string, RecapEntry> = {
  // Pre-application
  'preapp-quiet': { category: 'alder', line: "We met privately over coffee. No reporters, no block-club. It bought us time but the rumor mill started anyway." },
  'preapp-formal-cbo': { category: 'alder', line: "The CBO partnership took weeks to formalize — letters of support, MOU drafts, joint press. It's how you build the kind of legitimacy that survives a contentious zoning hearing." },
  'preapp-public': { category: 'alder', line: "The press release went out and my phone lit up. We had to spend the next half-year managing the political fallout before any productive conversation could happen." },
  'preapp-multilingual': { category: 'alder', line: "Door-knocking in five languages, printing materials in Spanish, Arabic, Tagalog — this is how you actually reach people. It takes more time, but the trust pays back later." },

  // Community meeting
  'community-none': { category: 'alder', line: "Skipping the meeting bought time, but the block-club heard from the alder's chief of staff, and that conversation went poorly. We're starting CoZ in a hole." },
  'community-story': { category: 'alder', line: "We did six listening sessions before the formal meeting. People wanted to be heard, and that takes calendar time. But they showed up for us at CoZ." },
  'community-coalition': { category: 'alder', line: "Stacking the meeting with clergy, advocates, and CBO partners is a months-long coordination job. It signals breadth and quiets the loudest opponents." },

  // Jefferson Park parking
  'community-jp-full-parking': { category: 'alder', line: "Structured parking is expensive to design, expensive to build. The block-club is happier. The pro forma is not." },
  'community-jp-traffic-data': { category: 'alder', line: "Traffic studies, transit-mode data, a smaller parking variance — defensible, evidence-based, time-consuming." },
  'community-jp-refuse-parking': { category: 'alder', line: "Refusing parking is principled. It is also why the next eight months of the entitlement timeline are going to be hostile." },

  // Zoning committee
  'zoning-hold': { category: 'alder', line: "Holding the line means making the case in committee, defending each unit count, each setback. My chair vote will carry it if I can keep my coalition." },
  'zoning-shrink': { category: 'alder', line: "Shrinking the project gave the block-club a win, which means they're not testifying against us. But the per-unit subsidy math just got worse." },
  'zoning-design-upgrade': { category: 'alder', line: "The committee wanted upgrades — better facade, better common spaces. The community likes the result. The hard cost is 15% higher than what you penciled." },

  // Finance committee
  'finance-reframe': { category: 'alder', line: "Making the per-unit-of-impact argument took preparation — pulling comp data, lining up testimony. It moved the conversation but Cunningham's not letting it go." },
  'finance-concede': { category: 'alder', line: "Conceding on TIF defused Reyes but reopened a $3M gap. The room calmed, but you have to fill that gap before the vote." },
  'finance-stakeholders': { category: 'alder', line: "Bringing in coalition testimony moves the room. It also spends down community goodwill — they showed up for you and they'll expect something back." },

  // Gap resolution
  'askSubsidy': { category: 'david', line: "An additional ask of HOM or HOPWA takes nine months minimum — application, review, NEPA, approval. Your alder spent real political capital to keep the ask moving." },
  'redesignSmaller': { category: 'david', line: "Resizing the project means new architectural drawings, revised pro forma, often a new MEP coordination pass. Six months, minimum." },
  'lowerQuality': { category: 'david', line: "Value-engineering the spec saves on hard costs but takes three months of redesign and resourcing. The block-club will notice." },

  // LIHTC
  'lihtcSubmit': { category: 'janelle', line: "QAP rounds happen once a year. Whether your application wins or loses, you wait twelve months before the next decision." },
  'lihtcResubmit': { category: 'janelle', line: "Resubmitting without changes? You're betting the next QAP round's reviewers see things differently. Twelve more months." },
  'lihtcRevise': { category: 'janelle', line: "Revising the application — deepening AMI mix, adding a CBO, retooling exhibits — and resubmitting. Twelve more months, plus the soft-cost of the rework." },

  // CBO partner first-time
  'cboFirstTime': { category: 'asha', line: "Bringing the CBO on board took six months of conversations, MOU drafting, and joint planning. It was the right call." },

  // Cut-costs sub-screen exit
  'cutCostsExit': { category: 'david', line: "Re-pricing the value-engineering pass took three months. The bank's underwriting moved sideways while you worked." },
};

export function resolveRecapNarrative(
  state: GameState,
  key: string,
): { characterId: CharacterId; line: string } | null {
  const entry = recapNarratives[key];
  if (!entry) return null;
  let characterId: CharacterId;
  switch (entry.category) {
    case 'alder':
      characterId = state.project.neighborhood ? getNeighborhoodAlderId(state.project.neighborhood) : 'asha';
      break;
    case 'asha':   characterId = 'asha'; break;
    case 'david':  characterId = 'david'; break;
    case 'janelle': characterId = 'janelle'; break;
  }
  return { characterId, line: entry.line };
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- tests/data/recapNarratives.test.ts`
Expected: PASS.

- [ ] **Step 5: Run full suite**

Run: `npm test`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/data/characters.ts tests/data/recapNarratives.test.ts
git commit -m "feat(characters): recapNarratives table + resolveRecapNarrative helper (v5 item 1 prep)"
```

---

### Task 6.4: Thread narratives through `tickMonths` call sites

**Files:**
- Modify: `src/game/state.ts`
- Modify: `src/screens/CapitalStack.tsx`

- [ ] **Step 1: Update `takeEntitlementStep`**

In `src/game/state.ts`, in `takeEntitlementStep`, replace the `tickMonths(months)` call (NOT shown in the existing fragment — find where months are accrued at end). The current flow is:
- `takeEntitlementStep` updates state
- The Entitlement screen separately calls `tickMonths(months)` after `takeStep`

Wait — the months tick lives in the screen, not the action. In `src/screens/Entitlement.tsx`, find:
```typescript
tickMonths(months);
```
Replace with:
```typescript
const narrative = resolveRecapNarrative(useGameStore.getState(), choice);
tickMonths(months, narrative ?? undefined);
```

Add import at top:
```typescript
import { resolveRecapNarrative } from '../data/characters';
```

Also handle the multilingual extra tick (earlier in the same function):
```typescript
if (extraMonths > 0) tickMonths(extraMonths);
```
The multilingual narrative is already covered by `preapp-multilingual` in `recapNarratives`, but since the multilingual choice tick happens BEFORE the main tick, both ticks would set lastRecap separately, and the second tick would overwrite the first. The combined effect is correct (the multilingual narrative shows after the base 6-mo preapp tick). Leave as-is or merge into one tick:
```typescript
tickMonths(months + extraMonths, narrative ?? undefined);
```
and delete the earlier `if (extraMonths > 0) tickMonths(extraMonths);`.

Use the merged version (cleaner). The narrative is `preapp-multilingual` when applicable.

- [ ] **Step 2: Update `applyGapAction`**

In `src/game/state.ts`, `applyGapAction`, find each `get().tickMonths(N);` call and replace with:
```typescript
const narrative = resolveRecapNarrative(s, action);
get().tickMonths(N, narrative ?? undefined);
```
Where `action` is the string `'askSubsidy' | 'redesignSmaller' | 'lowerQuality'`. (Each `if/else if` branch has its own tick; update each.)

Add import:
```typescript
import { resolveRecapNarrative } from '../data/characters';
```

- [ ] **Step 3: Update `submitLihtc`, `resubmitLihtc`, `reviseLihtc`**

These actions are in `src/game/state.ts` (or fired from CapitalStack). Find each and locate the `tickMonths(12)`. Replace:
- `submitLihtc` → `tickMonths(12, resolveRecapNarrative(get(), 'lihtcSubmit') ?? undefined)`
- `resubmitLihtc` → `tickMonths(12, resolveRecapNarrative(get(), 'lihtcResubmit') ?? undefined)`
- `reviseLihtc` → `tickMonths(12, resolveRecapNarrative(get(), 'lihtcRevise') ?? undefined)`

Actually the tickMonths calls happen in `CapitalStack.tsx`, not in the action — let me grep to confirm.

After checking `src/screens/CapitalStack.tsx`, the three LIHTC submit functions are defined there and each calls `tickMonths(12);` directly. Update each:
```typescript
function onSubmitLihtc() {
  setShowLihtcDecision(false);
  const win = Math.random() < lihtcOdds;
  if (win) {
    awardSource({ sourceId: '9-lihtc', amount: lihtcEquity, daysSpent: 280 });
  }
  submitLihtc(win);
  tickMonths(12, resolveRecapNarrative(state, 'lihtcSubmit') ?? undefined);
}
function onSubmitAgain() {
  // ...
  tickMonths(12, resolveRecapNarrative(state, 'lihtcResubmit') ?? undefined);
}
function onResubmitFromRevise() {
  // ...
  tickMonths(12, resolveRecapNarrative(state, 'lihtcRevise') ?? undefined);
  setReviseMode('none');
}
```

Add import at top of `CapitalStack.tsx`:
```typescript
import { resolveRecapNarrative } from '../data/characters';
```

- [ ] **Step 4: Update `setCboPartner` first-time tick**

Locate `setCboPartner` action in `src/game/state.ts`. Find the conditional `get().tickMonths(6)` that fires on first activation. Replace with:
```typescript
get().tickMonths(6, resolveRecapNarrative(get(), 'cboFirstTime') ?? undefined);
```

- [ ] **Step 5: Update CutCostsSubScreen exit**

In `src/screens/CapitalStack.tsx`, find `onExitCutCosts`:
```typescript
function onExitCutCosts() {
  tickMonths(3);
  setReviseMode('none');
}
```
Replace with:
```typescript
function onExitCutCosts() {
  tickMonths(3, resolveRecapNarrative(state, 'cutCostsExit') ?? undefined);
  setReviseMode('none');
}
```

- [ ] **Step 6: Run full suite**

Run: `npm test`
Expected: all pass. Where existing tests reference `lastRecap` shape, they may need to include `narrative: null` or `narrative: <expected>`.

- [ ] **Step 7: Commit**

```bash
git add src/game/state.ts src/screens/CapitalStack.tsx src/screens/Entitlement.tsx
git commit -m "feat(state): thread recap narratives through all >=3-month tick sites (v5 item 1)"
```

---

### Task 6.5: Render narrative row in `RecapCard`

**Files:**
- Modify: `src/components/RecapCard.tsx`
- Create: `tests/components/RecapCard.test.tsx`

- [ ] **Step 1: Write failing test**

Create `tests/components/RecapCard.test.tsx`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecapCard } from '../../src/components/RecapCard';
import { useGameStore } from '../../src/game/state';

describe('RecapCard narrative row (v5 item 1)', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('renders narrative when present', () => {
    useGameStore.setState({
      lastRecap: {
        months: 9,
        escalationAdded: 100_000,
        narrative: { characterId: 'asha', line: 'Six listening sessions before the formal meeting.' },
      },
    } as any);
    render(<RecapCard />);
    expect(screen.getByText(/Six listening sessions/)).toBeInTheDocument();
    expect(screen.getByText(/Alder Asha Tran/)).toBeInTheDocument();
  });

  it('does not render narrative section when absent', () => {
    useGameStore.setState({
      lastRecap: { months: 9, escalationAdded: 100_000, narrative: null },
    } as any);
    render(<RecapCard />);
    expect(screen.queryByText(/Alder Asha Tran/)).toBeNull();
  });

  it('renders nothing when lastRecap is null', () => {
    useGameStore.setState({ lastRecap: null } as any);
    const { container } = render(<RecapCard />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- tests/components/RecapCard.test.tsx`
Expected: FAIL — narrative row not rendered.

- [ ] **Step 3: Update RecapCard**

In `src/components/RecapCard.tsx`, add import:
```typescript
import { characters } from '../data/characters';
```

Inside the modal, after the existing `<div className="space-y-2 text-sm">...` block, before the "Got it" button, insert:
```tsx
{lastRecap.narrative && (
  <div className="mt-3 border-t border-line pt-3 text-xs">
    <b>
      {characters[lastRecap.narrative.characterId as keyof typeof characters].emoji}
      {' '}
      {characters[lastRecap.narrative.characterId as keyof typeof characters].name}:
    </b>{' '}
    <i className="text-muted">{lastRecap.narrative.line}</i>
  </div>
)}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- tests/components/RecapCard.test.tsx`
Expected: PASS.

- [ ] **Step 5: Run full suite**

Run: `npm test`
Expected: all pass.

- [ ] **Step 6: Build + verify visual**

Run: `npm run build`
Expected: clean `tsc -b` + `vite build`.

- [ ] **Step 7: Commit**

```bash
git add src/components/RecapCard.tsx tests/components/RecapCard.test.tsx
git commit -m "feat(recap): render character-narrated explanation in 'what just happened' popup (v5 item 1)"
```

---

## Final verification

### Task 7: Full regression sweep

- [ ] **Step 1: Run all tests**

Run: `npm test`
Expected: all (231 pre-v5 + ~25 v5 new) tests pass.

- [ ] **Step 2: Build clean**

Run: `npm run build`
Expected: `tsc -b` clean; `vite build` produces a working bundle (~290kB JS).

- [ ] **Step 3: Update handoff file**

Edit `~/.claude/handoffs/housing-developer-game.md` — move items 1–16 from "v5 Queue" to "v5 Shipped" with the new test count and update "Status" to "v5 complete and deployed".

- [ ] **Step 4: Commit handoff**

```bash
git add ~/.claude/handoffs/housing-developer-game.md
git commit -m "chore(handoff): mark v5 complete"
```

- [ ] **Step 5: Push to deploy**

```bash
git push origin main
```

Expected: Cloudflare auto-deploys; site updates within ~2 min.
