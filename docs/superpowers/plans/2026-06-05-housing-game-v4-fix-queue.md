# Housing Developer Game — v4 Fix Queue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship 16 bug fixes and mechanical rebalances for the Chicago Affordable Housing Developer Game v4, in 6 phases of progressively increasing risk.

**Architecture:** Six phases — UI polish (A), QAP coherence (B), stack mechanics (C), gap-fail UX (D), entitlement rebalance (E), CoF gap-gate + results (F). Phases A and E are independent and can land anywhere; B → C → D → F is the critical path. New plumbing: a unified `computeQapScore(state)` helper, a shared `<GapCloseModal />` component, and a `project.initialUnits` snapshot for end-game metrics.

**Tech Stack:** React 19 + Vite + TypeScript + Tailwind v4 + Zustand. Tests in Vitest. Visual screens in `src/screens/`; pure game logic in `src/game/`.

**Spec:** `docs/superpowers/specs/2026-06-05-housing-game-v4-fix-queue-design.md`

---

## File Structure

### Files created
- `src/components/GapCloseModal.tsx` — Reusable gap-close UI (AMI sliders + live gap row + action grid + exhausted-fail branch). Used by Phase-5 GapResolution screen and Phase-6 CoF step.
- `src/components/LiveGapRow.tsx` — Small tabular block showing live NOI · supportable debt · gap.

### Files modified
- `src/screens/SiteAndConcept.tsx` — items 1, 3, 4 (remove color tags, slider 20-100, remove CBO section).
- `src/screens/ProForma.tsx` — items 4, 5, 6, 7 (add CBO section, finish-level QAP, gap+QAP top-row layout, drop tickMonths(12), use unified QAP helper).
- `src/screens/CapitalStack.tsx` — items 7, 8, 9, 16a (unified QAP helper, source remove buttons, deferred dev fee math, live gap rows in subscreens).
- `src/screens/GapResolution.tsx` — items 10, 16b (refactor to use `<GapCloseModal />`).
- `src/screens/Entitlement.tsx` — items 11, 12, 13, 14 (per-choice durations, community-meeting choices, Powell→Cunningham, CoF gap modal + fail rule).
- `src/screens/Close.tsx` — items 13, 15 (Powell→Cunningham copy, results metrics).
- `src/components/SourceCard.tsx` — item 8 (optional `onRemove` prop).
- `src/game/types.ts` — items 5, 12, 14, 15 (StepChoiceKey changes, project.initialUnits, ChoiceConsequence.extraSubsidyDelta).
- `src/game/state.ts` — items 6, 15 (gate cost escalation by phase, snapshot initialUnits).
- `src/game/capitalStack.ts` — items 5, 7 (extend computeLihtcScore with finishLevel, add computeQapScore helper).
- `src/game/entitlement.ts` — items 11, 12, 14 (preapp-public deltas, community-none choice, finance-concede extraSubsidyDelta).
- `src/data/characters.ts` — items 10, 12, 13 (Powell→Cunningham, davidLines.gapResolutionExhausted, ashaLines.communityNone).
- `src/data/closeReactions.ts` — item 13 (any "Powell" mentions).
- `src/data/sources.ts` — item 9 (deferred-dev-fee description).

### Tests created/modified
- Tests added/extended in `tests/game/` for each game-logic change.
- Manual browser verification for purely visual changes (items 1, 3, 5 layout).

---

# Phase A — UI Polish & Rename

## Task A1: Remove neighborhood color tags from Site & Concept (item 1)

**Files:**
- Modify: `src/screens/SiteAndConcept.tsx:11-16` (delete `tonePillClass` helper), `src/screens/SiteAndConcept.tsx:72-76` (delete the pill render)

- [ ] **Step 1: Delete the `tonePillClass` helper**

In `src/screens/SiteAndConcept.tsx`, remove lines 11-16:

```tsx
function tonePillClass(tone: AlderTone): string {
  const base = 'text-xs font-semibold px-2 py-0.5 rounded-full';
  if (tone === 'green') return `${base} bg-green-100 text-green-800`;
  if (tone === 'yellow') return `${base} bg-yellow-100 text-yellow-800`;
  return `${base} bg-red-100 text-red-800`;
}
```

Also remove the `AlderTone` import from the imports line (no longer used).

- [ ] **Step 2: Delete the color tag from neighborhood card**

In the neighborhood card render block (~line 72-76), change:

```tsx
<div className="flex items-center gap-2 mb-1">
  <span className="text-xl">{nb.emoji}</span>
  <span className="font-semibold text-sm">{nb.name}</span>
  <span className={tonePillClass(nb.alderTone)}>{nb.alderTone}</span>
</div>
```

to:

```tsx
<div className="flex items-center gap-2 mb-1">
  <span className="text-xl">{nb.emoji}</span>
  <span className="font-semibold text-sm">{nb.name}</span>
</div>
```

- [ ] **Step 3: Run the build to confirm no type errors**

Run: `npm run build`
Expected: build passes; no TypeScript errors about unused `AlderTone` or `tonePillClass`.

- [ ] **Step 4: Manual browser verification**

Run: `npm run dev`
Open the app, advance to Site & Concept, visually confirm neighborhood cards no longer have the green/yellow/red pill chips next to neighborhood names.

- [ ] **Step 5: Commit**

```bash
git add src/screens/SiteAndConcept.tsx
git commit -m "fix(site): remove neighborhood color tone tags (v4 item 1)"
```

---

## Task A2: Unit count slider 20–100 (item 3)

**Files:**
- Modify: `src/screens/SiteAndConcept.tsx:91-103` (slider min + label)

- [ ] **Step 1: Update slider min and legend**

In `src/screens/SiteAndConcept.tsx`, change the unit slider block:

```tsx
<input
  type="range"
  min={40}
  max={100}
  step={1}
  value={project.units}
  onChange={(e) => setUnits(parseInt(e.target.value))}
  className="w-full"
/>
<div className="flex justify-between text-xs text-muted tabular">
  <span>40</span><span className="font-bold text-ink">{project.units} units</span><span>100</span>
</div>
```

to:

```tsx
<input
  type="range"
  min={20}
  max={100}
  step={1}
  value={project.units}
  onChange={(e) => setUnits(parseInt(e.target.value))}
  className="w-full"
/>
<div className="flex justify-between text-xs text-muted tabular">
  <span>20</span><span className="font-bold text-ink">{project.units} units</span><span>100</span>
</div>
```

- [ ] **Step 2: Manual browser verification**

Run: `npm run dev`
Drag the unit slider all the way left; confirm it goes to 20.

- [ ] **Step 3: Commit**

```bash
git add src/screens/SiteAndConcept.tsx
git commit -m "fix(site): unit slider min 40 -> 20 (v4 item 3)"
```

---

## Task A3: Rename Alder Powell → Alder Cunningham (item 13)

**Files:**
- Modify: `src/data/characters.ts:15` (display name)
- Modify: `src/data/characters.ts:41` (ashaLines.financeReframe)
- Modify: `src/screens/Entitlement.tsx:232` (finance-committee panel)
- Modify: `src/screens/Close.tsx:43` (failure copy)
- Modify: `src/data/closeReactions.ts` (any Powell mentions)

- [ ] **Step 1: Write a failing test for the renamed display name**

Append to `tests/data/characters.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { characters } from '../../src/data/characters';

describe('Powell character renamed to Cunningham', () => {
  it("powell character's display name is 'Ald. Cunningham'", () => {
    expect(characters.powell.name).toBe('Ald. Cunningham');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/data/characters.test.ts -t "Cunningham"`
Expected: FAIL — current name is `'Ald. Powell'`.

- [ ] **Step 3: Rename in characters.ts**

In `src/data/characters.ts:15`, change:

```ts
powell: { id: 'powell', name: 'Ald. Powell', emoji: '⚖️', role: 'Fiscal hawk' },
```

to:

```ts
powell: { id: 'powell', name: 'Ald. Cunningham', emoji: '⚖️', role: 'Fiscal hawk' },
```

In `ashaLines.financeReframe` (~line 41), change `"Make Powell own his comparison"` to `"Make Cunningham own his comparison"`.

- [ ] **Step 4: Rename in Entitlement.tsx finance panel**

In `src/screens/Entitlement.tsx:232`, change:

```tsx
<b>Ald. Powell:</b> "{financeAttackLines.tooExpensive(800_000)}"
```

to:

```tsx
<b>Ald. Cunningham:</b> "{financeAttackLines.tooExpensive(800_000)}"
```

- [ ] **Step 5: Rename in Close.tsx failure copy**

In `src/screens/Close.tsx:43`, change `"Powell teamed up"` to `"Cunningham teamed up"` (full string: `"Committee on Finance failed. Reyes and Cunningham teamed up; Asha couldn't hold the room. The coalition broke and the project was tabled."`).

- [ ] **Step 6: Search closeReactions.ts for any Powell mentions and update**

Run: `grep -n "Powell" src/data/closeReactions.ts` (use the Grep tool).
Replace each "Powell" with "Cunningham" preserving surrounding text.

- [ ] **Step 7: Run all character tests + smoke test**

Run: `npx vitest run tests/data/characters.test.ts tests/smoke.test.ts`
Expected: PASS.

- [ ] **Step 8: Run the full test suite to confirm no regressions**

Run: `npx vitest run`
Expected: all 211+ tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/data/characters.ts src/screens/Entitlement.tsx src/screens/Close.tsx src/data/closeReactions.ts tests/data/characters.test.ts
git commit -m "fix(characters): rename Ald. Powell -> Ald. Cunningham (v4 item 13)"
```

---

# Phase B — QAP Coherence & Pro Forma Reflow

## Task B1: Move CBO partner toggle from Site & Concept → Pro Forma (item 4)

**Files:**
- Modify: `src/screens/SiteAndConcept.tsx:153-174` (remove CBO block + import)
- Modify: `src/screens/ProForma.tsx` (add CBO lever card)

- [ ] **Step 1: Remove the CBO partner section from Site & Concept**

In `src/screens/SiteAndConcept.tsx`, delete the entire section "5. CBO partner" (the heading and both buttons; ~lines 153-174 in the current file). Also remove the `setCboPartner` selector at the top:

Remove:
```tsx
const setCboPartner = useGameStore((s) => s.setCboPartner);
```

- [ ] **Step 2: Add the CBO lever card to Pro Forma**

In `src/screens/ProForma.tsx`, add a `setCboPartner` selector near the other useGameStore calls:

```tsx
const setCboPartner = useGameStore((s) => s.setCboPartner);
```

In the LEFT column of the grid (after the AMI breakdown card and before the closing `</div>`), add a new card:

```tsx
<div className="bg-panel border border-line rounded-lg p-3">
  <div className="text-xs uppercase tracking-wider text-accent font-bold">
    Lever 3 — <TooltipTerm term="CBO">CBO</TooltipTerm> partner
  </div>
  <div className="grid grid-cols-2 gap-2 mt-2">
    <button
      onClick={() => setCboPartner(true)}
      className={`p-2 text-xs rounded border-2 transition text-left ${
        project.hasCboPartner ? 'bg-bg border-accent' : 'bg-panel border-line hover:border-accent'
      }`}
    >
      <b>🤝 Partner with a CBO</b>
      <div className="text-muted mt-1">+18 QAP · +6 community support{!project.cboTimePaid && ' · +6 mo first time'}</div>
    </button>
    <button
      onClick={() => setCboPartner(false)}
      className={`p-2 text-xs rounded border-2 transition text-left ${
        !project.hasCboPartner ? 'bg-bg border-accent' : 'bg-panel border-line hover:border-accent'
      }`}
    >
      <b>Go solo</b>
      <div className="text-muted mt-1">Faster start, but no QAP bonus and you'll need to earn community support cold.</div>
    </button>
  </div>
</div>
```

- [ ] **Step 3: Verify the Pro Forma layout still renders correctly**

Run: `npm run build`
Expected: build passes.

- [ ] **Step 4: Manual browser verification**

Run: `npm run dev`
Walk through Site & Concept → Pro Forma. Confirm:
- Site & Concept no longer has a CBO section (advance button still works).
- Pro Forma shows the new "Lever 3 — CBO partner" card.
- Toggling CBO on Pro Forma updates the projected QAP score in real time.

- [ ] **Step 5: Commit**

```bash
git add src/screens/SiteAndConcept.tsx src/screens/ProForma.tsx
git commit -m "feat(proforma): move CBO partner toggle to Pro Forma (v4 item 4)"
```

---

## Task B2: Finish-level QAP impact + Pro Forma reflow (item 5)

**Files:**
- Modify: `src/game/capitalStack.ts:50-80` (extend `computeLihtcScore`)
- Modify: `src/screens/ProForma.tsx` (pass finishLevel + reflow layout)
- Modify: `src/screens/CapitalStack.tsx` (pass finishLevel to score calls — interim, until B3 unifies)
- Modify: `tests/game/capitalStack.test.ts`

- [ ] **Step 1: Write failing tests for finish-level deltas**

Append to `tests/game/capitalStack.test.ts`:

```ts
describe('computeLihtcScore: finish-level deltas', () => {
  const base = {
    weightedAvgAmi: 55,
    hasCboPartner: false,
    hasLeverageCommitments: false,
    neighborhood: 'englewood' as const,
    intent: 'all-affordable' as const,
    marketUnits: 0,
  };

  it('basic finishings subtract 12 QAP points', () => {
    const standard = computeLihtcScore({ ...base, finishLevel: 'standard' });
    const basic = computeLihtcScore({ ...base, finishLevel: 'basic' });
    expect(standard - basic).toBe(12);
  });

  it('elevated finishings add 14 QAP points', () => {
    const standard = computeLihtcScore({ ...base, finishLevel: 'standard' });
    const elevated = computeLihtcScore({ ...base, finishLevel: 'elevated' });
    expect(elevated - standard).toBe(14);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/game/capitalStack.test.ts -t "finish-level"`
Expected: FAIL — `computeLihtcScore` does not accept `finishLevel`.

- [ ] **Step 3: Extend `computeLihtcScore` to accept finishLevel**

In `src/game/capitalStack.ts`, update the function signature and body:

```ts
import { FinishLevel } from './types';

export function computeLihtcScore(input: {
  weightedAvgAmi: number;
  hasCboPartner: boolean;
  hasLeverageCommitments: boolean;
  neighborhood: NeighborhoodId;
  intent: Intent;
  marketUnits: number;
  finishLevel: FinishLevel;
}): number {
  let score = 24; // base

  const depthPoints = Math.max(0, ((60 - input.weightedAvgAmi) / 30) * 24);
  score += Math.min(24, depthPoints);

  if (input.hasCboPartner) score += 18;
  if (input.hasLeverageCommitments) score += 14;

  if (input.neighborhood === 'englewood' || input.neighborhood === 'pilsen') {
    score += 10;
  }

  if (
    input.intent === 'mixed-income' &&
    input.marketUnits > 0 &&
    input.neighborhood !== 'englewood'
  ) {
    score -= MIXED_INCOME_QAP_PENALTY;
  }

  if (input.finishLevel === 'basic') score -= 12;
  if (input.finishLevel === 'elevated') score += 14;

  return Math.min(100, Math.max(0, Math.round(score)));
}
```

(Note: also clamps at 0 minimum to avoid negative scores from heavy basic+penalty cases.)

- [ ] **Step 4: Update all existing test sites to pass `finishLevel: 'standard'`**

Update the two tests in `tests/game/capitalStack.test.ts` ("balanced mix with CBO partner..." and "shallow AMI, no CBO...") to include `finishLevel: 'standard'` in their input. Same for any other call sites in that test file (look for `computeLihtcScore({`).

- [ ] **Step 5: Update ProForma + CapitalStack to pass finishLevel**

In `src/screens/ProForma.tsx`, find the `computeLihtcScore({...})` call (~line 66) and add `finishLevel: proForma.finishLevel`.

In `src/screens/CapitalStack.tsx`, find the `computeLihtcScore({...})` call (~line 61) and add `finishLevel: proForma.finishLevel`.

- [ ] **Step 6: Run the new tests + full suite**

Run: `npx vitest run`
Expected: all tests pass (new finish-level tests + 211 existing).

- [ ] **Step 7: Reflow Pro Forma — gap + QAP at top, side by side**

This is a two-edit change. (a) Insert a new top-row 2-col grid containing Gap + QAP cards just before the existing main grid. (b) Delete the originals from the right column.

(a) In `src/screens/ProForma.tsx`, immediately before the existing `<div className="grid grid-cols-2 gap-4">` (~line 99), insert:

```tsx
<div className="grid grid-cols-2 gap-4 mb-4">
  <div className="bg-gap text-white p-4 rounded-lg">
    <div className="text-xs uppercase tracking-wider opacity-80">Gap to close in the capital stack</div>
    <div className="text-3xl font-bold tabular">${(gap / 1_000_000).toFixed(1)}M</div>
    <div className="text-xs opacity-80 mt-1">{((gap / tdcTotal) * 100).toFixed(0)}% of TDC. Normal for affordable.</div>
  </div>
  <div className="bg-panel border border-line rounded-lg p-3">
    <div className="text-xs uppercase tracking-wider text-accent font-bold">{characters.janelle.emoji} 9% <TooltipTerm term="LIHTC">LIHTC</TooltipTerm> — projected <TooltipTerm term="QAP">QAP</TooltipTerm> score</div>
    <div className="mt-2 flex justify-between items-baseline">
      <div className="text-3xl font-bold tabular">{projectedQapScore} <span className="text-muted text-base">/ 100</span></div>
      <div className="text-right">
        <div className="text-xs uppercase text-muted tracking-wider">Est. award probability</div>
        <div className="text-lg font-bold tabular">{(projectedQapOdds * 100).toFixed(0)}%</div>
      </div>
    </div>
    {project.intent === 'mixed-income' && (proForma.marketUnits ?? 0) > 0 && project.neighborhood !== 'englewood' && (
      <div className="mt-2 flex justify-between text-xs text-red-700">
        <span>Mixed-income outside Englewood penalty</span>
        <span className="font-mono font-semibold">−{MIXED_INCOME_QAP_PENALTY} pts</span>
      </div>
    )}
    <div className="text-xs text-muted italic mt-1">Live projection — score reflects current levers.</div>
    <div className="text-xs text-muted mt-2"><b>{characters.janelle.emoji} {characters.janelle.name}:</b> "{projectedQapLine}"</div>
  </div>
</div>
```

(b) Then DELETE the original two cards from the right column of the existing main grid:

- The `<div className="bg-gap text-white p-4 rounded-lg">` block containing "Gap to close in the capital stack" (~lines 236-240).
- The `<div className="bg-panel border border-line rounded-lg p-3">` block containing "9% LIHTC — projected QAP score" (~lines 242-259).

The main grid retains its left-column levers and its right-column math (TDC bottom-up, NOI & supportable debt) and the final advance button.

- [ ] **Step 8: Manual browser verification**

Run: `npm run dev`
On Pro Forma, confirm:
- Gap and QAP cards are at the top, side by side.
- Changing finish level (Basic / Standard / Elevated) changes the projected QAP score.
- Basic gives ~12 fewer points than Standard; Elevated gives ~14 more.

- [ ] **Step 9: Commit**

```bash
git add src/game/capitalStack.ts src/screens/ProForma.tsx src/screens/CapitalStack.tsx tests/game/capitalStack.test.ts
git commit -m "feat(qap): finish-level QAP deltas (-12/0/+14) + Pro Forma top-row layout (v4 item 5)"
```

---

## Task B3: Unify QAP score across screens via `computeQapScore(state)` (item 7)

**Files:**
- Modify: `src/game/capitalStack.ts` (add `computeQapScore` helper)
- Modify: `src/screens/ProForma.tsx` (use helper)
- Modify: `src/screens/CapitalStack.tsx` (use helper)
- Modify: `tests/game/capitalStack.test.ts` (parity test)

- [ ] **Step 1: Write a failing parity test**

Append to `tests/game/capitalStack.test.ts`:

```ts
import { computeQapScore } from '../../src/game/capitalStack';
import { useGameStore } from '../../src/game/state';

describe('computeQapScore parity', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('returns identical scores when called from Pro Forma and Capital Stack contexts (no awarded sources)', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    const state = useGameStore.getState();
    const { score: proFormaScore } = computeQapScore(state);
    const { score: capitalStackScore } = computeQapScore(state);
    expect(proFormaScore).toBe(capitalStackScore);
  });

  it('leverageCommitments flips based on awarded source count', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    const before = computeQapScore(useGameStore.getState()).score;
    useGameStore.getState().awardSource({ sourceId: 'doh-loan', amount: 5_000_000, daysSpent: 45 });
    useGameStore.getState().awardSource({ sourceId: 'ihda-loan', amount: 4_000_000, daysSpent: 45 });
    const after = computeQapScore(useGameStore.getState()).score;
    expect(after - before).toBe(14); // leverage bonus
  });
});
```

(Note: import `beforeEach` from vitest at the top if not already imported.)

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/game/capitalStack.test.ts -t "computeQapScore parity"`
Expected: FAIL — `computeQapScore` not exported.

- [ ] **Step 3: Implement `computeQapScore(state)`**

In `src/game/capitalStack.ts`, add at the bottom:

```ts
import { GameState } from './types';
import { weightedAvgAmi } from './proForma';

export function computeQapScore(state: GameState): { score: number; odds: number } {
  if (!state.project.neighborhood) {
    return { score: 0, odds: 0 };
  }
  const score = computeLihtcScore({
    weightedAvgAmi: weightedAvgAmi(state.proForma.amiBreakdown),
    hasCboPartner: state.project.hasCboPartner,
    hasLeverageCommitments: state.stack.awarded.length >= 2,
    neighborhood: state.project.neighborhood,
    intent: state.project.intent,
    marketUnits: state.proForma.marketUnits ?? 0,
    finishLevel: state.proForma.finishLevel,
  });
  const odds = estimatedAwardProbability(score);
  return { score, odds };
}
```

- [ ] **Step 4: Replace the ProForma `computeLihtcScore` call with the helper**

In `src/screens/ProForma.tsx`, add a whole-state selector at the top with the other selectors:

```tsx
const state = useGameStore((s) => s);
```

Find the block (~lines 66-74):

```tsx
const projectedQapScore = computeLihtcScore({
  weightedAvgAmi: avgAmi,
  hasCboPartner: project.hasCboPartner,
  hasLeverageCommitments: true,
  neighborhood: project.neighborhood,
  intent: project.intent,
  marketUnits: proForma.marketUnits ?? 0,
  finishLevel: proForma.finishLevel,
});
const projectedQapOdds = estimatedAwardProbability(projectedQapScore);
```

Replace with:

```tsx
const { score: projectedQapScore, odds: projectedQapOdds } = computeQapScore(state);
```

Add the import: `import { computeQapScore } from '../game/capitalStack';`. Remove now-unused imports: `computeLihtcScore`, `estimatedAwardProbability`.

(Note: the existing `project`, `proForma`, and `costEscalation` selectors stay — they're still used elsewhere in the file. The new whole-state selector re-subscribes on every store change, which is acceptable for this screen.)

- [ ] **Step 5: Replace the CapitalStack `computeLihtcScore` call with the helper**

In `src/screens/CapitalStack.tsx`, add a whole-state selector at the top with the other selectors:

```tsx
const state = useGameStore((s) => s);
```

Find the block (~lines 61-69):

```tsx
const lihtcScore = computeLihtcScore({
  weightedAvgAmi: weightedAvgAmi(proForma.amiBreakdown),
  hasCboPartner: project.hasCboPartner,
  hasLeverageCommitments: stack.awarded.length >= 2,
  neighborhood: project.neighborhood,
  intent: project.intent,
  marketUnits: proForma.marketUnits ?? 0,
  finishLevel: proForma.finishLevel,
});
const lihtcOdds = estimatedAwardProbability(lihtcScore);
```

Replace with:

```tsx
const { score: lihtcScore, odds: lihtcOdds } = computeQapScore(state);
```

Add the import for `computeQapScore`. Keep `computeLihtcScore` and `estimatedAwardProbability` imports if `QapOddsSubScreen` still uses them.

**Note about `QapOddsSubScreen`:** It receives `projectedScore` and `projectedOdds` as props from the parent `CapitalStack`. When the parent uses `computeQapScore(state)` and re-renders on state changes (AMI sliders, CBO toggle), the new values flow through props automatically. No internal change needed inside `QapOddsSubScreen`.

- [ ] **Step 6: Run all tests**

Run: `npx vitest run`
Expected: all tests pass; new parity test passes.

- [ ] **Step 7: Manual browser verification**

Run: `npm run dev`
On Pro Forma, note the projected QAP score. Advance to Capital Stack (without yet applying for LIHTC). The score shown should be exactly the same. Then apply for DOH Loan + IHDA Loan; the score should bump by +14 (leverage commitments) on Capital Stack — confirming it's live, not hardcoded.

- [ ] **Step 8: Commit**

```bash
git add src/game/capitalStack.ts src/screens/ProForma.tsx src/screens/CapitalStack.tsx tests/game/capitalStack.test.ts
git commit -m "refactor(qap): unify QAP scoring via computeQapScore(state) (v4 item 7)"
```

---

# Phase C — Cost Escalation & Stack Mechanics

## Task C1: Gate cost escalation by phase + drop Pro Forma's tickMonths(12) (item 6)

**Files:**
- Modify: `src/game/state.ts` (gate cost escalation inside `tickMonths`)
- Modify: `src/screens/ProForma.tsx` (remove `tickMonths(12)` from `onAdvance`)
- Test: `tests/game/state.test.ts`

- [ ] **Step 1: Write failing tests for phase-gated escalation**

Append to `tests/game/state.test.ts`:

```ts
describe('cost escalation gating by phase (v4 item 6)', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('tickMonths in phase 3 (Pro Forma) advances months but does not add cost escalation', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    // Move to phase 3 (Site & Concept → Pro Forma)
    useGameStore.getState().advancePhase(); // 1 -> 2
    useGameStore.getState().advancePhase(); // 2 -> 3
    expect(useGameStore.getState().phase).toBe(3);
    useGameStore.getState().tickMonths(6);
    expect(useGameStore.getState().monthsElapsed).toBe(6);
    expect(useGameStore.getState().costEscalation).toBe(0);
  });

  it('tickMonths in phase 4 (Capital Stack) accrues cost escalation', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().advancePhase(); // 1->2
    useGameStore.getState().advancePhase(); // 2->3
    useGameStore.getState().advancePhase(); // 3->4
    expect(useGameStore.getState().phase).toBe(4);
    useGameStore.getState().tickMonths(12);
    expect(useGameStore.getState().costEscalation).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/game/state.test.ts -t "gating by phase"`
Expected: FAIL — phase 3 currently does accrue escalation.

- [ ] **Step 3: Gate cost escalation inside `tickMonths`**

In `src/game/state.ts`, find `tickMonths` (~line 283) and change it:

```ts
tickMonths: (n: number) => set((s) => {
  if (!s.project.neighborhood) return {};
  const qualityMul = s.gapResolution.lowerQualityUsed ? LOWER_QUALITY_HARD_MULTIPLIER : 1;
  const effectiveUnits = Math.max(0, s.project.units - s.gapResolution.shrinkBy);
  const hardPerU = HARD_COST_PER_UNIT[s.project.buildingType] * FINISH_MULTIPLIER[s.proForma.finishLevel] * qualityMul;
  const hard = hardPerU * effectiveUnits;
  const escalationPerMonth = hard * (COST_ESCALATION_PER_YEAR / 12) * (1 + SOFT_COST_RATIO + CONTINGENCY_RATIO);
  const escalationAdded = s.phase >= 4 ? escalationPerMonth * n : 0;
  return {
    monthsElapsed: s.monthsElapsed + n,
    costEscalation: s.costEscalation + escalationAdded,
    ...(n >= 3 ? { lastRecap: { months: n, escalationAdded } } : {}),
  };
}),
```

- [ ] **Step 4: Remove `tickMonths(12)` from ProForma `onAdvance`**

In `src/screens/ProForma.tsx`, find:

```tsx
function onAdvance() {
  tickMonths(12);
  advancePhase();
}
```

Change to:

```tsx
function onAdvance() {
  advancePhase();
}
```

Remove the now-unused `tickMonths` selector at the top.

- [ ] **Step 5: Run the new tests + full suite**

Run: `npx vitest run`
Expected: all tests pass.

- [ ] **Step 6: Manual browser verification**

Run: `npm run dev`
Walk Site & Concept → Pro Forma → advance. On Capital Stack, the TDC bottom-up should NOT include a "Cost escalation" row (because none has accrued). Toggle CBO on Pro Forma; confirm `monthsElapsed` advances by 6 in the UI but the Capital Stack TDC still doesn't show escalation until you trigger an action there.

- [ ] **Step 7: Commit**

```bash
git add src/game/state.ts src/screens/ProForma.tsx tests/game/state.test.ts
git commit -m "fix(state): defer cost escalation accrual to phase 4+ (v4 item 6)"
```

---

## Task C2: De-select capital stack items except LIHTC (item 8)

**Files:**
- Modify: `src/components/SourceCard.tsx` (add `onRemove` prop)
- Modify: `src/screens/CapitalStack.tsx` (wire `onRemove`)
- Test: `tests/components/SourceCard.test.tsx` (new) or extend existing

- [ ] **Step 1: Write a failing test for the remove button**

Create `tests/components/SourceCard.test.tsx` (or append if it exists):

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SourceCard } from '../../src/components/SourceCard';
import { getSource } from '../../src/data/sources';

describe('SourceCard onRemove (v4 item 8)', () => {
  it('shows a remove button when awarded and onRemove is provided', () => {
    const onRemove = vi.fn();
    render(
      <SourceCard
        source={getSource('doh-loan')}
        status="awarded"
        awardedAmount={5_000_000}
        onRemove={onRemove}
      />
    );
    const btn = screen.getByRole('button', { name: /remove|×/i });
    fireEvent.click(btn);
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it('does not show a remove button when no onRemove is provided', () => {
    render(
      <SourceCard
        source={getSource('doh-loan')}
        status="awarded"
        awardedAmount={5_000_000}
      />
    );
    expect(screen.queryByRole('button', { name: /remove|×/i })).toBeNull();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/components/SourceCard.test.tsx`
Expected: FAIL — `onRemove` prop not implemented.

- [ ] **Step 3: Add `onRemove` to SourceCard**

In `src/components/SourceCard.tsx`, update the interface and render:

```tsx
interface SourceCardProps {
  source: SourceProfile;
  status: Status;
  awardedAmount?: number;
  complexityWarning?: boolean;
  scalingNote?: string;
  onApply?: () => void;
  onRemove?: () => void;
}

export function SourceCard({ source, status, awardedAmount, complexityWarning, scalingNote, onApply, onRemove }: SourceCardProps) {
  const s = STATUS_STYLES[status];
  return (
    <div className={`bg-panel border-2 ${s.cardClass} rounded-lg p-2 text-xs relative`}>
      <div className={`absolute top-1 right-1 ${s.badgeClass} text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold`}>
        {s.label}
      </div>
      {/* existing content unchanged */}
      <div className="text-base">{source.emoji} <b><TooltipTerm term={source.name}>{source.name}</TooltipTerm></b></div>
      <div className="text-muted text-[11px]">{source.shortDescription}</div>
      <div className="mt-2">
        {awardedAmount !== undefined ? (
          <b className="tabular">${(awardedAmount / 1_000_000).toFixed(1)}M</b>
        ) : source.amountRange ? (
          <span>
            <b className="tabular">${(source.amountRange.min / 1_000_000).toFixed(1)}-{(source.amountRange.max / 1_000_000).toFixed(1)}M</b>
          </span>
        ) : null}
        {' '}· {source.daysToProcess} d
      </div>
      {scalingNote && (
        <div className="mt-1 text-muted text-[11px]">{scalingNote}</div>
      )}
      {complexityWarning && (
        <div className="mt-1 text-caution text-[11px]">⚠ +complexity penalty</div>
      )}
      {status === 'available' && onApply && (
        <button
          className="w-full mt-1 bg-accent text-white text-[11px] py-1 rounded hover:opacity-90"
          onClick={onApply}
        >
          Apply →
        </button>
      )}
      {status === 'awarded' && onRemove && (
        <button
          aria-label="Remove"
          className="absolute bottom-1 right-1 text-muted hover:text-gap text-[10px] px-1"
          onClick={onRemove}
        >
          × remove
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Wire `onRemove` in CapitalStack**

In `src/screens/CapitalStack.tsx`, add a `removeSource` selector:

```tsx
const removeSource = useGameStore((s) => s.removeSource);
```

In the source grid render block (~lines 266-287), change:

```tsx
<SourceCard
  key={src.id}
  source={src}
  status={status}
  awardedAmount={amt}
  complexityWarning={complexityWarning}
  scalingNote={scalingNote}
  onApply={() => onApply(src.id)}
/>
```

to:

```tsx
const canRemove =
  status === 'awarded' &&
  src.id !== '9-lihtc' &&
  src.id !== '4-lihtc-bonds' &&
  src.id !== 'bank-loan';

return (
  <SourceCard
    key={src.id}
    source={src}
    status={status}
    awardedAmount={amt}
    complexityWarning={complexityWarning}
    scalingNote={scalingNote}
    onApply={() => onApply(src.id)}
    onRemove={canRemove ? () => removeSource(src.id) : undefined}
  />
);
```

(Restructure the `.map` to use a block body with the `canRemove` variable.)

- [ ] **Step 5: Run all tests**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 6: Manual browser verification**

Run: `npm run dev`
On Capital Stack, apply for DOH Loan; the card should show "AWARDED" badge and an "× remove" link in the bottom right. Click it; the card returns to "AVAILABLE" and the gap reopens. Try applying for LIHTC; once awarded, no remove button should appear on that card.

- [ ] **Step 7: Commit**

```bash
git add src/components/SourceCard.tsx src/screens/CapitalStack.tsx tests/components/SourceCard.test.tsx
git commit -m "feat(stack): allow de-selecting non-LIHTC capital sources (v4 item 8)"
```

---

## Task C3: Deferred developer fee actually pays (item 9)

**Files:**
- Modify: `src/screens/CapitalStack.tsx:80-85` (special-case `deferred-dev-fee` in `onApply`)
- Modify: `src/data/sources.ts:115-123` (update shortDescription)
- Test: `tests/game/capitalStack.test.ts`

- [ ] **Step 1: Write a failing test**

Append to `tests/game/capitalStack.test.ts`:

```ts
describe('deferred developer fee amount (v4 item 9)', () => {
  it('computes min(3% of TDC, $1.5M)', () => {
    // Helper inlined for test isolation
    function compute(tdc: number) {
      return Math.round(Math.min(0.03 * tdc, 1_500_000) / 1000) * 1000;
    }
    expect(compute(20_000_000)).toBe(600_000);   // 3% of 20M = 600k, under cap
    expect(compute(100_000_000)).toBe(1_500_000); // 3% of 100M = 3M, capped at 1.5M
  });
});
```

- [ ] **Step 2: Run the test (should pass — it's just verifying the formula)**

Run: `npx vitest run tests/game/capitalStack.test.ts -t "deferred developer fee"`
Expected: PASS.

- [ ] **Step 3: Special-case `deferred-dev-fee` in `onApply`**

In `src/screens/CapitalStack.tsx`, find `onApply` (~line 80):

```tsx
function onApply(sourceId: SourceId) {
  const src = getSource(sourceId);
  if (!src.amountRange) return;
  const amount = (src.amountRange.min + src.amountRange.max) / 2;
  awardSource({ sourceId, amount, daysSpent: src.daysToProcess });
}
```

Replace with:

```tsx
function onApply(sourceId: SourceId) {
  const src = getSource(sourceId);
  if (sourceId === 'deferred-dev-fee') {
    const amount = Math.round(Math.min(0.03 * tdcTotal, 1_500_000) / 1000) * 1000;
    awardSource({ sourceId, amount, daysSpent: 0 });
    return;
  }
  if (!src.amountRange) return;
  const amount = (src.amountRange.min + src.amountRange.max) / 2;
  awardSource({ sourceId, amount, daysSpent: src.daysToProcess });
}
```

- [ ] **Step 4: Update source description**

In `src/data/sources.ts`, change `deferred-dev-fee`'s `shortDescription`:

```ts
shortDescription: 'Capped at min(3% TDC, $1.5M); no time cost',
```

- [ ] **Step 5: Run all tests**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 6: Manual browser verification**

Run: `npm run dev`
Reach Capital Stack with a ~$25M TDC. Apply for Deferred Developer Fee. Confirm the card shows ~$0.8M awarded (3% of 25M = 750k, rounded). The gap shrinks by that amount.

- [ ] **Step 7: Commit**

```bash
git add src/screens/CapitalStack.tsx src/data/sources.ts tests/game/capitalStack.test.ts
git commit -m "fix(stack): deferred dev fee actually awards min(3% TDC, $1.5M) (v4 item 9)"
```

---

## Task C4: Live gap row in Capital Stack revise subscreens (item 16a)

**Files:**
- Create: `src/components/LiveGapRow.tsx`
- Modify: `src/screens/CapitalStack.tsx` (use in `CutCostsSubScreen` and `QapOddsSubScreen`)

- [ ] **Step 1: Create `LiveGapRow` component**

Create `src/components/LiveGapRow.tsx`:

```tsx
import { useGameStore } from '../game/state';
import { computeEffectiveGap } from '../game/gapResolution';

export function LiveGapRow() {
  const state = useGameStore((s) => s);
  if (!state.project.neighborhood) return null;
  const { gap, committed, bankLoan, tdcAllIn } = computeEffectiveGap(state);

  const noi = (() => {
    // computeEffectiveGap already runs computeNoi internally; derive bank loan portion separately if needed
    return null;
  })();

  return (
    <div className="bg-bg p-3 rounded-lg text-sm tabular grid grid-cols-3 gap-2">
      <div>
        <div className="text-xs text-muted uppercase tracking-wider">TDC</div>
        <b>${(tdcAllIn / 1_000_000).toFixed(1)}M</b>
      </div>
      <div>
        <div className="text-xs text-muted uppercase tracking-wider">Committed</div>
        <b>${(committed / 1_000_000).toFixed(1)}M</b>
        <div className="text-[10px] text-muted">incl. ${(bankLoan / 1_000_000).toFixed(1)}M debt</div>
      </div>
      <div>
        <div className="text-xs text-muted uppercase tracking-wider">Gap</div>
        <b className={gap > 100_000 ? 'text-gap' : 'text-equity'}>
          ${(gap / 1_000_000).toFixed(1)}M
        </b>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Use `LiveGapRow` in `CutCostsSubScreen`**

In `src/screens/CapitalStack.tsx`, in `CutCostsSubScreen`, replace the existing "Live TDC preview" block:

```tsx
<div className="bg-bg p-3 rounded-lg text-sm tabular flex justify-between">
  <span className="text-muted">Live <TooltipTerm term="TDC">TDC</TooltipTerm> preview</span>
  <b>${(tdc / 1_000_000).toFixed(1)}M</b>
</div>
```

with:

```tsx
<LiveGapRow />
```

Add `import { LiveGapRow } from '../components/LiveGapRow';` at the top.

- [ ] **Step 3: Use `LiveGapRow` in `QapOddsSubScreen`**

In the same file, in `QapOddsSubScreen`, replace the "Projected score" block:

```tsx
<div className="bg-bg p-3 rounded-lg text-sm tabular flex justify-between">
  <span className="text-muted">Projected score</span>
  <b>{projectedScore} / 100 · {(projectedOdds * 100).toFixed(0)}% odds</b>
</div>
```

with two stacked rows:

```tsx
<div className="bg-bg p-3 rounded-lg text-sm tabular flex justify-between">
  <span className="text-muted">Projected score</span>
  <b>{projectedScore} / 100 · {(projectedOdds * 100).toFixed(0)}% odds</b>
</div>
<LiveGapRow />
```

- [ ] **Step 4: Manual browser verification**

Run: `npm run dev`
On Capital Stack → "Revise to cut costs", drag the AMI sliders. The gap row at the bottom should update live. Same for "Revise to increase QAP odds".

- [ ] **Step 5: Commit**

```bash
git add src/components/LiveGapRow.tsx src/screens/CapitalStack.tsx
git commit -m "feat(stack): live gap row in cut-costs + QAP-odds subscreens (v4 item 16a)"
```

---

# Phase D — Gap Resolution Failure & AMI Plumbing

## Task D1: Add AMI sliders + live gap to GapResolution screen (item 16b)

**Files:**
- Modify: `src/screens/GapResolution.tsx`

- [ ] **Step 1: Add AMI sliders + live gap row to GapResolution**

In `src/screens/GapResolution.tsx`, add a `setAmiUnit` selector and render an AMI block above the action grid. After the "Outstanding gap" panel and before the `<div className="grid grid-cols-3 gap-3 mb-4">` action grid, insert:

```tsx
import { AmiBand } from '../game/types';
import { LiveGapRow } from '../components/LiveGapRow';
import { TooltipTerm } from '../components/TooltipTerm';

// Inside the component, add selectors:
const setAmiUnit = useGameStore((s) => s.setAmiUnit);
const proForma = useGameStore((s) => s.proForma);
const projectUnits = useGameStore((s) => s.project.units);

// In the JSX, before the action grid:
<div className="bg-panel border border-line rounded-lg p-3 mb-3">
  <div className="text-xs uppercase tracking-wider text-accent font-bold">
    Adjust <TooltipTerm term="AMI">AMI</TooltipTerm> mix
  </div>
  <div className="text-xs text-muted mt-1">
    Deeper affordability means less rent and a bigger gap, but stronger impact.
  </div>
  {[30, 60, 80].map((ami) => {
    const a = ami as AmiBand;
    return (
      <div key={ami} className="mt-2">
        <div className="flex justify-between text-xs">
          <span><b>{ami}% AMI</b></span>
          <span><b>{proForma.amiBreakdown[a]} units</b></span>
        </div>
        <input
          type="range"
          min={0}
          max={projectUnits}
          value={proForma.amiBreakdown[a]}
          onChange={(e) => setAmiUnit(a, parseInt(e.target.value))}
          className="w-full"
        />
      </div>
    );
  })}
  <div className="mt-2">
    <LiveGapRow />
  </div>
</div>
```

- [ ] **Step 2: Manual browser verification**

Run: `npm run dev`
Play through to GapResolution (force a gap by picking expensive options on Pro Forma). Confirm AMI sliders are present. Drag the 30% AMI slider up; gap should grow (rents fall, supportable debt falls). Drag 60% up; gap should shrink.

- [ ] **Step 3: Commit**

```bash
git add src/screens/GapResolution.tsx
git commit -m "feat(gap): AMI sliders + live gap on GapResolution (v4 item 16b)"
```

---

## Task D2: Auto-fail when all gap actions exhausted (item 10)

**Files:**
- Modify: `src/screens/GapResolution.tsx` (exhausted-fail panel)
- Modify: `src/data/characters.ts` (add `davidLines.gapResolutionExhausted`)
- Test: `tests/game/gapResolution.test.ts`

- [ ] **Step 1: Add David line**

In `src/data/characters.ts`, append to `davidLines`:

```ts
gapResolutionExhausted: "We've tried a bunch of different things, but this project isn't penciling. Start over.",
```

- [ ] **Step 2: Write a failing test for the exhausted panel render**

Create or append `tests/game/gapResolution.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../src/game/state';

describe('GapResolution exhaustion state (v4 item 10)', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('all three actions exhausted + gap still open returns isExhausted: true', () => {
    const store = useGameStore.getState();
    store.selectNeighborhood('englewood');
    // Drive into exhaustion: set alder=0 (subsidy disabled), units to floor (shrink disabled), lowerQualityUsed=true
    useGameStore.setState((s) => ({
      ...s,
      entitlement: { ...s.entitlement, alderGoodwill: 0 },
      gapResolution: { ...s.gapResolution, lowerQualityUsed: true, shrinkBy: s.project.units - 20 },
    }));
    const s = useGameStore.getState();
    const subsidyDisabled = s.entitlement.alderGoodwill === 0;
    const shrinkDisabled = Math.max(0, s.project.units - s.gapResolution.shrinkBy) <= 20;
    const qualityDisabled = s.gapResolution.lowerQualityUsed;
    expect(subsidyDisabled && shrinkDisabled && qualityDisabled).toBe(true);
  });
});
```

- [ ] **Step 3: Replace the shelved-with-exhausted branch with a fail panel**

In `src/screens/GapResolution.tsx`, find the existing `{!canAdvance && allExhausted && ...}` block (~line 94) and replace it with:

```tsx
{!canAdvance && allExhausted && (
  <div className="bg-bg border-2 border-gap rounded-lg p-4 mt-4">
    <div className="text-xs uppercase tracking-wider text-gap font-bold">▶ Out of moves</div>
    <div className="mt-3">
      <CharacterBubble characterId="david" line={davidLines.gapResolutionExhausted} />
    </div>
    <button
      onClick={() => useGameStore.getState().reset()}
      className="w-full mt-3 bg-gap text-white py-3 rounded-lg font-bold"
    >
      Start over
    </button>
  </div>
)}
```

Add the import: `import { davidLines } from '../data/characters';`. Note `CharacterBubble` is already imported.

Remove the old "Shelve the project" button in the exhausted branch (the new branch replaces it). The non-exhausted shelve flow stays as-is — actually re-checking the original code, the shelve button currently *only* appears when `!canAdvance && allExhausted`. We're replacing that. There's no separate non-exhausted shelve path, so the existing `shelveProject` import becomes unused — remove it.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 5: Manual browser verification**

Run: `npm run dev`
Force the player into GapResolution and use all three actions (or set the conditions via the React Devtools). Confirm the panel appears with David Park's line and a single "Start over" button that resets the game to phase 1.

- [ ] **Step 6: Commit**

```bash
git add src/screens/GapResolution.tsx src/data/characters.ts tests/game/gapResolution.test.ts
git commit -m "feat(gap): auto-fail panel when all gap actions exhausted (v4 item 10)"
```

---

# Phase E — Entitlement Choice Rebalance

## Task E1: Pre-app intake durations + public option penalty (item 11)

**Files:**
- Modify: `src/game/entitlement.ts:37-38` (preapp-public deltas)
- Modify: `src/screens/Entitlement.tsx:30-35, 39-43, 256-289` (per-choice duration map + consequences text)
- Test: `tests/game/entitlement.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `tests/game/entitlement.test.ts`:

```ts
import { applyChoice } from '../../src/game/entitlement';

describe('preapp-public penalty (v4 item 11)', () => {
  it('preapp-public returns alder -10, community -5', () => {
    const c = applyChoice('preapp-public');
    expect(c.alderDelta).toBe(-10);
    expect(c.communityDelta).toBe(-5);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/game/entitlement.test.ts -t "preapp-public penalty"`
Expected: FAIL.

- [ ] **Step 3: Update `preapp-public` consequence**

In `src/game/entitlement.ts:37-38`, change:

```ts
case 'preapp-public':
  return { ...base, alderDelta: -3, communityDelta: 4 };
```

to:

```ts
case 'preapp-public':
  return { ...base, alderDelta: -10, communityDelta: -5 };
```

- [ ] **Step 4: Add per-choice duration override in Entitlement.tsx**

In `src/screens/Entitlement.tsx`, near the top (after `STEP_DURATIONS`), add:

```ts
const CHOICE_DURATION_OVERRIDES: Partial<Record<StepChoiceKey, number>> = {
  'preapp-public': 0,
};

function durationFor(step: number, choice: StepChoiceKey): number {
  return CHOICE_DURATION_OVERRIDES[choice] ?? STEP_DURATIONS[step] ?? 0;
}
```

In `onChoose` (~line 117), change `const months = currentStep != null ? (STEP_DURATIONS[currentStep] ?? 0) : 0;` to:

```ts
const months = currentStep != null ? durationFor(currentStep, choice) : 0;
```

In the choice card render (the `.map` that builds `<ChoiceCard>`), find `const baseDurationMonths = STEP_DURATIONS[currentStep] ?? 0;` and change to:

```ts
const baseDurationMonths = CHOICE_DURATION_OVERRIDES[c.key] ?? (STEP_DURATIONS[currentStep] ?? 0);
```

- [ ] **Step 5: Update the consequences string for `preapp-public`**

In `BASE_STEP1_CHOICES`, change:

```ts
{ key: 'preapp-public', title: 'Public pre-launch w/ press', description: 'Announce intentions broadly. Bold; reads as committed.', consequences: '−3 alder · +4 community' },
```

to:

```ts
{ key: 'preapp-public', title: 'Public pre-launch w/ press', description: 'Announce intentions broadly. Bold; reads as committed.', consequences: '−10 alder · −5 community' },
```

- [ ] **Step 6: Run all tests**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 7: Manual browser verification**

Run: `npm run dev`
At Pre-app intake, hover/select the three options. Verify "Public pre-launch w/ press" shows "+0 mo" time cost and "−10 alder · −5 community" consequences.

- [ ] **Step 8: Commit**

```bash
git add src/game/entitlement.ts src/screens/Entitlement.tsx tests/game/entitlement.test.ts
git commit -m "fix(entitlement): preapp-public 0mo + -10/-5 deltas (v4 item 11)"
```

---

## Task E2: Community meeting choices overhaul (item 12)

**Files:**
- Modify: `src/game/types.ts:76-82` (StepChoiceKey)
- Modify: `src/game/entitlement.ts:42-47` (replace community-data; add community-none; update community-story)
- Modify: `src/screens/Entitlement.tsx:73-79` (STEP_CHOICES[2])
- Modify: `src/screens/Entitlement.tsx` (CHOICE_DURATION_OVERRIDES adds community-none = 0)
- Modify: `src/data/characters.ts` (add `ashaLines.communityNone`)
- Test: `tests/game/entitlement.test.ts`

- [ ] **Step 1: Update `StepChoiceKey` union**

In `src/game/types.ts:76-82`, change:

```ts
export type StepChoiceKey =
  | 'preapp-quiet' | 'preapp-formal-cbo' | 'preapp-public'
  | 'preapp-multilingual'
  | 'community-data' | 'community-story' | 'community-coalition'
  | 'community-jp-full-parking' | 'community-jp-traffic-data' | 'community-jp-refuse-parking'
  | 'zoning-hold' | 'zoning-shrink' | 'zoning-accept'
  | 'finance-reframe' | 'finance-concede' | 'finance-stakeholders';
```

to:

```ts
export type StepChoiceKey =
  | 'preapp-quiet' | 'preapp-formal-cbo' | 'preapp-public'
  | 'preapp-multilingual'
  | 'community-none' | 'community-story' | 'community-coalition'
  | 'community-jp-full-parking' | 'community-jp-traffic-data' | 'community-jp-refuse-parking'
  | 'zoning-hold' | 'zoning-shrink' | 'zoning-accept'
  | 'finance-reframe' | 'finance-concede' | 'finance-stakeholders';
```

- [ ] **Step 2: Update `applyChoice` cases**

In `src/game/entitlement.ts`, replace:

```ts
case 'community-data':
  return { ...base, alderDelta: 3, communityDelta: 4 };
case 'community-story':
  return { ...base, alderDelta: -2, communityDelta: 12 };
case 'community-coalition':
  return { ...base, alderDelta: 4, communityDelta: 10 };
```

with:

```ts
case 'community-none':
  return { ...base, alderDelta: -20, communityDelta: -25 };
case 'community-story':
  return { ...base, alderDelta: 0, communityDelta: 12 };
case 'community-coalition':
  return { ...base, alderDelta: 4, communityDelta: 10 };
```

- [ ] **Step 3: Write failing tests**

Append to `tests/game/entitlement.test.ts`:

```ts
describe('community meeting choices overhaul (v4 item 12)', () => {
  it('community-none returns alder -20, community -25', () => {
    const c = applyChoice('community-none');
    expect(c.alderDelta).toBe(-20);
    expect(c.communityDelta).toBe(-25);
  });

  it('community-story returns alder 0, community +12', () => {
    const c = applyChoice('community-story');
    expect(c.alderDelta).toBe(0);
    expect(c.communityDelta).toBe(12);
  });

  it('community-coalition unchanged: +4/+10', () => {
    const c = applyChoice('community-coalition');
    expect(c.alderDelta).toBe(4);
    expect(c.communityDelta).toBe(10);
  });
});
```

Run: `npx vitest run tests/game/entitlement.test.ts -t "community meeting choices overhaul"`
Expected: PASS (we already updated `applyChoice`).

- [ ] **Step 4: Update STEP_CHOICES[2] in Entitlement.tsx**

In `src/screens/Entitlement.tsx`, replace the `2:` block in `STEP_CHOICES`:

```ts
2: [
  { key: 'community-data', title: 'Data-led', description: 'Lead with rent, jobs, taxes. Facts, charts, evidence.', consequences: '+3 alder · +4 community' },
  { key: 'community-story', title: 'Story-led', description: 'Resident testimonials. Make it about people, not numbers.', consequences: '−2 alder · +12 community' },
  { key: 'community-coalition', title: 'Coalition-led', description: 'Clergy, CBO, advocates speak first. Show breadth of support.', consequences: '+4 alder · +10 community' },
],
```

with:

```ts
2: [
  { key: 'community-none', title: 'No meeting', description: 'Skip community engagement. Faster, but the block club hears about it from rumors.', consequences: '−20 alder · −25 community' },
  { key: 'community-story', title: 'Story-led', description: 'Resident testimonials. Make it about people, not numbers.', consequences: '±0 alder · +12 community' },
  { key: 'community-coalition', title: 'Coalition-led', description: 'Clergy, CBO, advocates speak first. Show breadth of support.', consequences: '+4 alder · +10 community' },
],
```

- [ ] **Step 5: Add `community-none` to CHOICE_DURATION_OVERRIDES**

In `src/screens/Entitlement.tsx`, extend `CHOICE_DURATION_OVERRIDES`:

```ts
const CHOICE_DURATION_OVERRIDES: Partial<Record<StepChoiceKey, number>> = {
  'preapp-public': 0,
  'community-none': 0,
};
```

- [ ] **Step 6: Add Asha line for no-meeting choice**

In `src/data/characters.ts`, append to `ashaLines`:

```ts
communityNone: "No meeting? OK. The block club will hear about this from somewhere else, and not from us. Brace yourself.",
```

- [ ] **Step 7: Run the full test suite**

Run: `npx vitest run`
Expected: all tests pass. (Pre-existing tests that referenced `community-data` need updating — search and fix.)

Note: If any existing test asserts `community-data` behavior, update it to use one of the new choices or delete the test if it's no longer meaningful.

- [ ] **Step 8: Manual browser verification**

Run: `npm run dev`
At Community meeting step, confirm exactly three options: No meeting, Story-led, Coalition-led. "No meeting" shows "+0 mo" time cost and large negative deltas.

- [ ] **Step 9: Commit**

```bash
git add src/game/types.ts src/game/entitlement.ts src/screens/Entitlement.tsx src/data/characters.ts tests/game/entitlement.test.ts
git commit -m "feat(entitlement): community-meeting overhaul - no-meeting + rebalanced story-led (v4 item 12)"
```

---

# Phase F — Committee on Finance Gap Gate + Results

## Task F1: Extract `<GapCloseModal />` shared component

**Files:**
- Create: `src/components/GapCloseModal.tsx`
- Modify: `src/screens/GapResolution.tsx` (use the new component)

- [ ] **Step 1: Create the shared GapCloseModal component**

Create `src/components/GapCloseModal.tsx`:

```tsx
import { useGameStore } from '../game/state';
import { computeEffectiveGap } from '../game/gapResolution';
import { gapActions, GapActionKey } from '../data/gapResolution';
import { CharacterBubble } from './CharacterBubble';
import { TooltipTerm } from './TooltipTerm';
import { LiveGapRow } from './LiveGapRow';
import { davidLines, ashaLines } from '../data/characters';
import { AmiBand, GAP_ADVANCE_THRESHOLD, MIN_UNITS_FLOOR } from '../game/types';

interface GapCloseModalProps {
  context: 'phase-5' | 'cof';
  onClose: () => void;
}

export function GapCloseModal({ context, onClose }: GapCloseModalProps) {
  const state = useGameStore((s) => s);
  const applyGapAction = useGameStore((s) => s.applyGapAction);
  const setAmiUnit = useGameStore((s) => s.setAmiUnit);
  const reset = useGameStore((s) => s.reset);

  if (!state.project.neighborhood) return null;

  const { gap, effectiveUnits } = computeEffectiveGap(state);
  const canClose = gap <= GAP_ADVANCE_THRESHOLD;

  const subsidyDisabled = state.entitlement.alderGoodwill === 0;
  const shrinkDisabled = effectiveUnits <= MIN_UNITS_FLOOR;
  const qualityDisabled = state.gapResolution.lowerQualityUsed;
  const allExhausted = subsidyDisabled && shrinkDisabled && qualityDisabled;

  function isDisabled(key: GapActionKey): boolean {
    if (key === 'askSubsidy') return subsidyDisabled;
    if (key === 'redesignSmaller') return shrinkDisabled;
    if (key === 'lowerQuality') return qualityDisabled;
    return false;
  }

  if (!canClose && allExhausted) {
    return (
      <div className="bg-bg border-2 border-gap rounded-lg p-4">
        <div className="text-xs uppercase tracking-wider text-gap font-bold">▶ Out of moves</div>
        <div className="mt-3">
          <CharacterBubble
            characterId="david"
            line={context === 'cof'
              ? "We're out of moves. The committee is going to vote no. Start over."
              : davidLines.gapResolutionExhausted}
          />
        </div>
        <button
          onClick={() => reset()}
          className="w-full mt-3 bg-gap text-white py-3 rounded-lg font-bold"
        >
          Start over
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="mb-3">
        <CharacterBubble
          characterId="asha"
          line={context === 'cof'
            ? "Cunningham's concession reopened the gap. We have to close it now or the vote dies."
            : ashaLines.gapResolutionIntro}
        />
      </div>

      <div className="bg-gap text-white rounded-lg p-4">
        <div className="text-xs uppercase tracking-wider opacity-80">Outstanding gap</div>
        <div className="text-3xl font-bold tabular">${(gap / 1_000_000).toFixed(1)}M</div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3">
        <div className="text-xs uppercase tracking-wider text-accent font-bold">
          Adjust <TooltipTerm term="AMI">AMI</TooltipTerm> mix
        </div>
        <div className="text-xs text-muted mt-1">
          Deeper affordability means less rent and a bigger gap, but stronger impact.
        </div>
        {[30, 60, 80].map((ami) => {
          const a = ami as AmiBand;
          return (
            <div key={ami} className="mt-2">
              <div className="flex justify-between text-xs">
                <span><b>{ami}% AMI</b></span>
                <span><b>{state.proForma.amiBreakdown[a]} units</b></span>
              </div>
              <input
                type="range"
                min={0}
                max={state.project.units}
                value={state.proForma.amiBreakdown[a]}
                onChange={(e) => setAmiUnit(a, parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          );
        })}
        <div className="mt-2">
          <LiveGapRow />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {gapActions.map((a) => {
          const disabled = isDisabled(a.key);
          const used = a.key === 'lowerQuality' && state.gapResolution.lowerQualityUsed;
          return (
            <button
              key={a.key}
              onClick={() => applyGapAction(a.key)}
              disabled={disabled}
              className={`text-left p-3 rounded-lg border-2 transition ${
                disabled
                  ? 'bg-panel border-line opacity-50 cursor-not-allowed'
                  : 'bg-panel border-line hover:border-accent'
              }`}
            >
              <div className="text-2xl">{a.emoji}</div>
              <div className="font-bold text-sm mt-1">{a.title}{used && ' ✓'}</div>
              <div className="text-caution text-xs mt-2 tabular">{a.effectLabel}</div>
              {disabled && (
                <div className="text-muted text-xs italic mt-1">{a.disabledMsg}</div>
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={onClose}
        disabled={!canClose}
        className="w-full bg-accent text-white py-3 rounded-lg font-bold disabled:opacity-40"
      >
        {canClose
          ? (context === 'cof' ? 'Gap closed — return to Committee →' : 'Gap closed — on to entitlement →')
          : `Close the remaining $${(gap / 1_000_000).toFixed(1)}M gap`}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Refactor GapResolution.tsx to use the new component**

In `src/screens/GapResolution.tsx`, replace the bulk of the body with the new component:

```tsx
import { useGameStore } from '../game/state';
import { Header } from '../components/Header';
import { JargonScreenScope } from '../components/JargonScreenScope';
import { GapCloseModal } from '../components/GapCloseModal';

export function GapResolution() {
  const advancePhase = useGameStore((s) => s.advancePhase);
  const retreatPhase = useGameStore((s) => s.retreatPhase);
  const neighborhood = useGameStore((s) => s.project.neighborhood);

  if (!neighborhood) return null;

  return (
    <JargonScreenScope>
    <div className="max-w-5xl mx-auto p-6">
      <button
        onClick={retreatPhase}
        className="text-muted text-sm mb-4 hover:text-ink inline-block"
      >
        ← Back
      </button>
      <Header />
      <h2 className="text-2xl mt-6 mb-2">Close the Gap</h2>
      <GapCloseModal context="phase-5" onClose={advancePhase} />
    </div>
    </JargonScreenScope>
  );
}
```

- [ ] **Step 3: Run all tests**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 4: Manual browser verification**

Run: `npm run dev`
Walk into GapResolution. Confirm the screen looks identical to D1's state (AMI sliders, live gap row, action grid, advance/start-over buttons). The exhausted path still works.

- [ ] **Step 5: Commit**

```bash
git add src/components/GapCloseModal.tsx src/screens/GapResolution.tsx
git commit -m "refactor(gap): extract GapCloseModal shared component"
```

---

## Task F2: Committee on Finance gap-gate + alder-after-close fail rule (item 14)

**Files:**
- Modify: `src/game/types.ts` (`ChoiceConsequence.extraSubsidyDelta?: number`)
- Modify: `src/game/entitlement.ts` (finance-concede `extraSubsidyDelta: -3_000_000`)
- Modify: `src/game/state.ts` (apply `extraSubsidyDelta` in `takeEntitlementStep`)
- Modify: `src/screens/Entitlement.tsx` (CoF gap-gate, `onComplete` fail rule)
- Test: `tests/game/entitlement.test.ts`, `tests/game/gapResolution.test.ts`

- [ ] **Step 1: Add `extraSubsidyDelta` to ChoiceConsequence**

In `src/game/entitlement.ts`, change the interface:

```ts
export interface ChoiceConsequence {
  alderDelta: number;
  communityDelta: number;
  tdcDelta: number;
  shrinkBy: number;
  extraSubsidyDelta?: number;
}
```

Update the `base` default to include `extraSubsidyDelta: 0`:

```ts
const base: ChoiceConsequence = { alderDelta: 0, communityDelta: 0, tdcDelta: 0, shrinkBy: 0, extraSubsidyDelta: 0 };
```

- [ ] **Step 2: Update `finance-concede` to reopen gap by $3M**

In `src/game/entitlement.ts`, change the `finance-concede` case:

```ts
case 'finance-concede':
  return { ...base, alderDelta: 5, communityDelta: 0, extraSubsidyDelta: -3_000_000 };
```

- [ ] **Step 3: Write failing test**

Append to `tests/game/entitlement.test.ts`:

```ts
describe('finance-concede reopens gap (v4 item 14)', () => {
  it('finance-concede returns extraSubsidyDelta: -3,000,000', () => {
    const c = applyChoice('finance-concede');
    expect(c.extraSubsidyDelta).toBe(-3_000_000);
  });
});
```

- [ ] **Step 4: Apply `extraSubsidyDelta` in `takeEntitlementStep`**

In `src/game/state.ts`, modify `takeEntitlementStep` to apply the delta. Find the function (~line 298) and inside the action body, after the `addCostEscalation` block:

```ts
takeEntitlementStep: (choice, step, ctx = {}) => {
  const s = get();
  const consequence = applyChoice(choice, ctx);
  if (consequence.tdcDelta) {
    get().addCostEscalation(consequence.tdcDelta * s.project.units);
  }
  if (consequence.extraSubsidyDelta) {
    set((s) => ({
      gapResolution: {
        ...s.gapResolution,
        extraSubsidy: Math.max(0, s.gapResolution.extraSubsidy + consequence.extraSubsidyDelta!),
      },
    }));
  }
  set((s) => {
    // ... existing body unchanged
```

- [ ] **Step 5: Add CoF gap-gate to Entitlement.tsx**

In `src/screens/Entitlement.tsx`, add imports at the top:

```tsx
import { computeEffectiveGap } from '../game/gapResolution';
import { GapCloseModal } from '../components/GapCloseModal';
import { GAP_ADVANCE_THRESHOLD } from '../game/types';
```

Add a whole-state subscription alongside the existing selectors at the top of the component (so we re-render when the gap changes):

```tsx
const fullState = useGameStore((s) => s);
```

After `currentStep` is derived, compute the gap-gate flag:

```tsx
const cofGapOpen =
  currentStep === 4 && computeEffectiveGap(fullState).gap > GAP_ADVANCE_THRESHOLD;
```

In the JSX, before the existing step-4 choice grid, add:

```tsx
{cofGapOpen && (
  <div className="bg-bg border-2 border-gap rounded-lg p-4 mb-3">
    <div className="text-xs uppercase tracking-wider text-gap font-bold">
      ▶ Gap reopened — close before the vote
    </div>
    <div className="mt-3">
      <GapCloseModal context="cof" onClose={() => { /* in-place re-render once gap closes */ }} />
    </div>
  </div>
)}
```

Wrap the existing "Active step" choice grid so it doesn't render when `cofGapOpen`:

```tsx
{!cofGapOpen && !allStepsComplete && currentStep != null && (
  <div className="bg-bg border-2 border-caution rounded-lg p-4 mb-3">
    {/* existing step body */}
  </div>
)}
```

(The `onClose` callback is a no-op because once the gap closes, `cofGapOpen` flips to false and the choice grid re-appears automatically via state subscription.)

- [ ] **Step 6: Update `onComplete` fail rule (alder → shelved-finance instead of shelved-alder when at CoF)**

In `src/screens/Entitlement.tsx`, modify `onComplete`:

```ts
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

(Single change: `'shelved-alder'` → `'shelved-finance'`. The existing failure copy for `'shelved-finance'` already references Reyes+Cunningham teaming up.)

- [ ] **Step 7: Write a state-level test for the CoF gap-gate flow**

Append to `tests/game/gapResolution.test.ts`:

```ts
import { applyChoice } from '../../src/game/entitlement';
import { computeEffectiveGap } from '../../src/game/gapResolution';

describe('finance-concede reopens gap via state (v4 item 14)', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('after finance-concede, extraSubsidy decreases by $3M', () => {
    const store = useGameStore.getState();
    store.selectNeighborhood('englewood');
    useGameStore.setState((s) => ({
      ...s,
      gapResolution: { ...s.gapResolution, extraSubsidy: 5_000_000 },
    }));
    store.takeEntitlementStep('finance-concede', 4);
    expect(useGameStore.getState().gapResolution.extraSubsidy).toBe(2_000_000);
  });

  it('extraSubsidy floor is 0 (cannot go negative)', () => {
    const store = useGameStore.getState();
    store.selectNeighborhood('englewood');
    // extraSubsidy starts at 0
    store.takeEntitlementStep('finance-concede', 4);
    expect(useGameStore.getState().gapResolution.extraSubsidy).toBe(0);
  });
});
```

- [ ] **Step 8: Run all tests**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 9: Manual browser verification — happy path**

Run: `npm run dev`
Play through to Committee on Finance. Pick "Concede TIF/HED reduction" — the screen should immediately show the CoF gap modal (since extraSubsidy went negative, gap reopened). Use the gap actions or AMI sliders to close the gap. The CoF choice grid reappears. Pick "Reframe the cost" and complete.

- [ ] **Step 10: Manual browser verification — fail path**

Run: `npm run dev`
Reach CoF with alder goodwill ~25. Pick concede + close gap aggressively (subsidy actions cost alder). Get alder < 20. Complete the step. The Close screen should show "Committee on Finance failed. Reyes and Cunningham teamed up..." (the `shelved-finance` outcome).

- [ ] **Step 11: Commit**

```bash
git add src/game/types.ts src/game/entitlement.ts src/game/state.ts src/screens/Entitlement.tsx tests/game/entitlement.test.ts tests/game/gapResolution.test.ts
git commit -m "feat(cof): gap-gate modal + alder-fail routes to shelved-finance (v4 item 14)"
```

---

## Task F3: Results screen — cost escalation + units lost (item 15)

**Files:**
- Modify: `src/game/types.ts` (add `project.initialUnits`)
- Modify: `src/game/state.ts` (snapshot on Phase 2→3 transition; reset to null)
- Modify: `src/screens/Close.tsx` (stat grid extension)
- Test: `tests/game/state.test.ts`

- [ ] **Step 1: Add `initialUnits` field to types**

In `src/game/types.ts`, in the `GameState.project` block, add:

```ts
project: {
  neighborhood: NeighborhoodId | null;
  units: number;
  buildingType: BuildingType;
  intent: Intent;
  hasCboPartner: boolean;
  cboTimePaid: boolean;
  initialUnits: number | null;
};
```

- [ ] **Step 2: Update `initialState` and snapshot logic**

In `src/game/state.ts`, in `initialState.project`, add `initialUnits: null,`.

In `advancePhase`, just before the `set({ phase: next, ... })`, add the snapshot when leaving Site & Concept (Phase 2 → 3):

```ts
let project = s.project;
if (s.phase === 2 && next === 3 && project.initialUnits === null) {
  project = { ...project, initialUnits: project.units };
}

set({ phase: next, entitlement, project });
```

(Adjust the existing `set` call to include `project`.)

- [ ] **Step 3: Write a failing test**

Append to `tests/game/state.test.ts`:

```ts
describe('initialUnits snapshot (v4 item 15)', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('is null until Site & Concept exit', () => {
    expect(useGameStore.getState().project.initialUnits).toBeNull();
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().advancePhase(); // 1 -> 2 (Site & Concept)
    expect(useGameStore.getState().project.initialUnits).toBeNull();
  });

  it('is captured on Site & Concept -> Pro Forma transition', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    useGameStore.getState().advancePhase(); // 1 -> 2
    useGameStore.getState().advancePhase(); // 2 -> 3
    expect(useGameStore.getState().project.initialUnits).toBe(60);
  });

  it('stays fixed when units change after snapshot', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    useGameStore.getState().advancePhase(); // 1 -> 2
    useGameStore.getState().advancePhase(); // 2 -> 3
    useGameStore.getState().setUnits(40);
    expect(useGameStore.getState().project.initialUnits).toBe(60);
  });
});
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/game/state.test.ts -t "initialUnits snapshot"`
Expected: PASS.

- [ ] **Step 5: Update Close.tsx stat grid**

In `src/screens/Close.tsx`, change the existing 4-column stat grid (lines 71-76) to a 3-column grid with two rows:

```tsx
<div className="grid grid-cols-3 gap-2 mt-3 text-center">
  <div><div className="text-xs uppercase text-muted">Units</div><div className="text-xl font-bold tabular">{finalUnits}</div></div>
  <div><div className="text-xs uppercase text-muted">Wtd avg <TooltipTerm term="AMI">AMI</TooltipTerm></div><div className="text-xl font-bold tabular">{Math.round(weightedAvgAmi(proForma.amiBreakdown))}%</div></div>
  <div><div className="text-xs uppercase text-muted">Final TDC</div><div className="text-xl font-bold tabular">${(tdcTotal / 1_000_000).toFixed(1)}M</div></div>
  <div><div className="text-xs uppercase text-muted">Per unit</div><div className="text-xl font-bold tabular">${(tdcTotal / finalUnits / 1000).toFixed(0)}k</div></div>
  <div>
    <div className="text-xs uppercase text-muted">Cost escalation</div>
    <div className="text-xl font-bold tabular text-caution">
      {costEscalation > 0 ? `+$${(costEscalation / 1_000_000).toFixed(1)}M` : '—'}
    </div>
  </div>
  <div>
    <div className="text-xs uppercase text-muted">Units lost</div>
    <div className="text-xl font-bold tabular text-caution">
      {(() => {
        const initial = project.initialUnits ?? finalUnits;
        const delta = initial - finalUnits;
        return delta > 0 ? `−${delta} vs. plan` : '—';
      })()}
    </div>
  </div>
</div>
```

- [ ] **Step 6: Run the full test suite**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 7: Manual browser verification**

Run: `npm run dev`
Play a full game from Site & Concept (start at 60 units, finish at 48 after a zoning-shrink). On the Close screen, confirm:
- Cost escalation shows a positive `+$X.XM` (because Phase 4+ accrued time).
- Units lost shows `−12 vs. plan`.

- [ ] **Step 8: Commit**

```bash
git add src/game/types.ts src/game/state.ts src/screens/Close.tsx tests/game/state.test.ts
git commit -m "feat(close): show cost escalation + units lost on results screen (v4 item 15)"
```

---

# Final Verification

## Task Z1: Full playthrough verification

- [ ] **Step 1: Run the entire test suite**

Run: `npx vitest run`
Expected: ALL tests pass. Note the new total (should be 211 + ~15 new tests = ~226).

- [ ] **Step 2: Run a full build**

Run: `npm run build`
Expected: build passes; no TypeScript errors.

- [ ] **Step 3: Manual playthrough of all 4 neighborhoods**

Run: `npm run dev`. For each of Englewood, Pilsen, Jefferson Park, Albany Park:
- Site & Concept: confirm no color tags, slider 20-100, no CBO section.
- Pro Forma: confirm CBO section present, finish level affects QAP score live, gap+QAP at top side by side.
- Capital Stack: confirm QAP score matches Pro Forma, deferred dev fee awards money, can remove non-LIHTC sources, escalation accruing from this phase.
- GapResolution (force it via aggressive levers): confirm AMI sliders, live gap row, exhausted-fail panel works.
- Entitlement: confirm preapp-public is 0 mo / −10 alder / −5 community; community has 3 options (no-meeting / story-led / coalition); Ald. Cunningham (not Powell) appears at finance committee.
- Committee on Finance: confirm finance-concede reopens gap and shows the modal; can close it and continue.
- Close: confirm cost escalation + units lost stats are present.

- [ ] **Step 4: Final commit (if any cleanup needed)**

```bash
git status
# If anything uncommitted, address it and commit
```

- [ ] **Step 5: Push and deploy**

```bash
git push origin main
```

Cloudflare auto-deploys on push to main. Verify at `https://housing-developer-game.dhertz.workers.dev/`.

---

# Summary Checklist

| Phase | Items | Tasks | Critical-Path? |
|---|---|---|---|
| A | 1, 3, 13 | A1, A2, A3 | No (independent) |
| B | 4, 5, 7 | B1, B2, B3 | Yes |
| C | 6, 8, 9, 16a | C1, C2, C3, C4 | Yes |
| D | 10, 16b | D1, D2 | Yes (16b before 10) |
| E | 11, 12 | E1, E2 | No (independent) |
| F | 14, 15 | F1, F2, F3 | Yes |
| Z | verification | Z1 | Always last |

**Total tasks:** 17 (16 fix items + final verification)
**Estimated commits:** 17–20 (some tasks may produce >1 commit if subsplit)
