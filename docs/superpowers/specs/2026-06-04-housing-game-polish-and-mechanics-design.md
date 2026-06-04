# Housing Developer Game — Polish & Mechanics (v2) — Design

**Date:** 2026-06-04
**Spec:** 1 of 2 (Polish & Mechanics). A separate Expansion spec will cover stub build-out (Pilsen, Lakeview, Albany Park, walk-up, larger, mixed-income).
**Status:** Draft for implementation
**Base branch:** `main` (currently at the MVP-complete state, 59 tests passing, deployed at `housing-developer-game.dhertz.workers.dev`)

---

## Purpose

The MVP shipped a working game but several rough edges undermine its educational goals and player agency:

- **Educational gaps.** No Pro Forma QAP scoring preview, no DSCR explanation, Marcus's banker role is easy to miss, the Capital Stack lacks an explainer of the depth-vs-time-vs-complexity dynamic.
- **Player gets stuck.** QAP rejection has no recovery path; a remaining gap after Capital Stack lets the player advance to entitlement anyway.
- **Time and cost feedback is dull.** Year-grained ticks erase fine-grained tradeoffs; cost escalation accrues silently; entitlement steps don't show their time costs.
- **AMI tier set is over-detailed.** Four tiers (30/50/60/80) split player attention; three (30/60/80) is enough to convey depth tradeoffs.
- **Close screen is flat.** The project ends with a result card and a try-again button; no stakeholder reaction makes the ending feel real.

This spec resolves all of the above plus four enrichment additions (failure reactions, timeline indicator, recap cards, Marcus on Capital Stack) that make the existing screens land.

## Out of scope

Deferred to the separate **Expansion** spec:
- Pilsen, Lakeview, Albany Park neighborhoods (currently stubbed)
- Walk-up and larger building types (currently stubbed)
- Mixed-income mode (currently stubbed)
- localStorage save state
- PNG result card download
- Spanish toggle

## Approach

Implementation proceeds in three sequential phases on separate branches/PRs:

1. **Phase 1 — Foundation:** months refactor, AMI tier change, CBO partner choice, Marcus banker card + DSCR walk-through, Pro Forma QAP projected score card, Capital Stack David Park intro, drop stabilized value display, entitlement durations + time labels, timeline pill in header.
2. **Phase 2 — New screens & mechanics:** revise sub-screens (cut-costs, QAP-odds), QAP rejection recovery, GapResolution screen + state + effects.
3. **Phase 3 — Enrichment:** Close stakeholder reactions (success + failure), Marcus on Capital Stack source card, "what just happened" recap card, anything left over.

Each phase ends with: green test suite, green smoke test, manual playthrough on local dev server, deploy. Each phase produces a working playable build.

Rationale: Phase 1's type and state changes (months, AMI tiers, CBO flag) touch files Phase 2 heavily edits. Stabilizing Phase 1 first means Phase 2 doesn't fight type churn while building new screens. Phase 3 enrichment is polish over a working game.

---

## Architecture & data model

### File additions

- `src/screens/GapResolution.tsx`
- `src/components/CharacterIntroCard.tsx` — reusable for Marcus + David Park
- `src/components/ReviseSubScreen.tsx` — wrapper used by both Capital Stack revise modes
- `src/components/RecapCard.tsx` — "what just happened" recap
- `src/components/TimelinePill.tsx` — header timeline indicator
- `src/data/closeReactions.ts` — stakeholder content + trigger logic
- `src/data/gapResolution.ts` — per-action effects + costs
- `src/util/formatElapsed.ts` — `months → "1 yr 6 mo"`

### Phase enum

`Phase = 1 | 2 | 3 | 4 | 5 | 6` becomes `1 | 2 | 3 | 4 | 5 | 6 | 7`:

| Phase | Screen | Notes |
|-------|--------|-------|
| 1 | IntroScreen | unchanged |
| 2 | SiteAndConcept | + CBO partner choice (step 5) |
| 3 | ProForma | + QAP preview card, + Marcus banker card, − stabilized value display |
| 4 | CapitalStack | + David Park intro card, + revise sub-screens, + QAP rejection recovery |
| **5** | **GapResolution** (new) | shown only if `gap > 100_000` after Capital Stack; auto-skipped otherwise |
| 6 | Entitlement | + time labels on choices, shorter durations |
| 7 | Close | + stakeholder reactions panel |

### Time model

`yearsElapsed: number` → `monthsElapsed: number`. New action `tickMonths(n: number)`. Cost escalation per month:

```ts
escalationPerMonth = hard * (0.05 / 12) * (1 + SOFT_COST_RATIO + CONTINGENCY_RATIO)
```

Helper `formatElapsed(months: number): string` returns strings like `"1 yr 6 mo"`, `"3 mo"`, `"2 yr"`. Action labels show raw `"+6 mo"`; aggregate displays use the long form.

Existing `tickYear()` calls all become `tickMonths(12)` (Pro Forma → Capital Stack advance, QAP submit/resubmit). Entitlement uses per-step durations defined below.

### AMI tier change

`AmiBand = 30 | 50 | 60 | 80` → `30 | 60 | 80`.

```ts
// AMI_SCORE_MULTIPLIERS — compressed:
{ 30: 4, 60: 1.75, 80: 1 }

// Default amiBreakdown:
{ 30: 12, 60: 36, 80: 12 } // 60 units, ~58% weighted avg

// rentAtAmi — drop the 50% row
{ 30: 625, 60: 1_250, 80: 1_665 }
```

LIHTC eligibility threshold (`weightedAvgAmi ≤ 60`) unchanged.

### New GameState fields

```ts
interface GameState {
  phase: Phase;
  monthsElapsed: number;             // was: yearsElapsed
  costEscalation: number;

  project: {
    neighborhood: NeighborhoodId | null;
    units: number;
    buildingType: BuildingType;
    intent: Intent;
    hasCboPartner: boolean;          // NEW — was hardcoded true in capitalStack.ts
    cboTimePaid: boolean;            // NEW — tracks whether the +6 mo cost has been charged
  };

  proForma: {
    amiBreakdown: Record<AmiBand, number>; // now only 30/60/80
    marketUnits: number;
    finishLevel: FinishLevel;
    opexRatio: number;
  };

  stack: {
    awarded: SourceAward[];
    applied: SourceApplication[];
    lihtcSubmitted: boolean;
    lihtcAwarded: boolean;
    lihtcResubmits: number;          // NEW — increments on submit-again
    lihtcRevisions: number;          // NEW — increments on revise-and-resubmit
  };

  entitlement: { /* unchanged */ };

  gapResolution: {                   // NEW
    extraSubsidy: number;            // cumulative $ from "ask more subsidy"
    shrinkBy: number;                // cumulative units removed via "redesign smaller"
    lowerQualityUsed: boolean;       // one-shot gate
  };

  outcome: Outcome;
}
```

### Revise sub-screens

Revise sub-screens are component-local state inside `CapitalStack.tsx`, **not** new phases. Pattern:

```ts
const [reviseMode, setReviseMode] = useState<'none' | 'cut-costs' | 'qap-odds'>('none');
```

Renders one of three views. Keeps `phase` as the high-level game state; sub-screens are an internal detail of Capital Stack.

### advancePhase logic

`advancePhase` becomes phase-aware:

- After Phase 4 (Capital Stack): if `gap > 100_000`, set `phase = 5` (GapResolution). Else `phase = 6` (Entitlement).
- After Phase 5 (GapResolution): each resolution action re-runs the gap check. When `gap ≤ 100_000`, the "Advance to entitlement" button activates; clicking it sets `phase = 6`.
- Phase 5 → 4 backward navigation is **not allowed**. The player commits when they enter gap resolution.
- Phase 5 → shelved: if all three resolution paths are exhausted (alder goodwill = 0 blocks subsidy, units at floor of 20 blocks redesign-smaller, lower-quality already used) and gap > $100k remains, the screen surfaces a "Shelve the project" terminus button that sets `outcome = 'shelved-stack'` and routes to Phase 7.
- Phase 6 → 7: existing outcome logic unchanged.

---

## Screens & UI

### Phase 2 · SiteAndConcept — CBO partner choice

Add step 5 below the existing Intent row, matching the two-card layout pattern:

- **🤝 Partner with a CBO** — `+18 QAP · +6 community support at entitlement start · +6 mo pre-app time`
- **Go solo** — neutral default

Selection persists in `project.hasCboPartner`. Community support delta is applied when entering Phase 6 (entitlement), not at choice time. CBO-related QAP score effect computes downstream.

### Phase 3 · ProForma

Three changes:

**1. Drop stabilized value display.** Remove the line `<div>Stabilized value (NOI ÷ 6%)</div>` from the NOI & supportable debt panel. Underlying math (`stabilizedValue = noi / 0.06`) still computed internally for the LTV calculation in `computeSupportableDebt`.

**2. Marcus banker intro card** at the top of the right column (above the NOI & supportable debt panel). Format:
- Avatar 🏦, name **Marcus Bell**, role/affiliation **"· Construction Lender, Loop Federal Bank"**
- Lead paragraph spelling out **"Debt Service Coverage Ratio (DSCR)"** in full at first use, explaining the ≥1.20 rule
- Sub-panel showing live DSCR walk-through:
  ```
  Net Operating Income (annual): $X
  ÷ Required DSCR (1.20):        $Y
  ÷ Annual mortgage constant (k): $Z
  = Supportable loan
  ```
- Closing line summarizing what fraction of TDC the loan covers

Implemented via reusable `<CharacterIntroCard />` component.

**3. QAP projected score card** at the bottom of the right column. Format:
- Big score number / 100, est. probability percentage
- Subtitle: *"Projection assumes you assemble a typical stack on the next screen."*
- Factor breakdown table: Base, Affordability depth, CBO partner, Leverage (projected), Neighborhood bonus, Projected score
- Janelle dialogue tied to score buckets (reuses existing `janelleLines.qapScore*` lines)

Driven by `computeLihtcScore(...)` call with `hasLeverageCommitments: true` (projected ceiling).

### Phase 4 · CapitalStack

Reorganized top-to-bottom:

1. **David Park intro card** (new) at the very top — reusable `<CharacterIntroCard />`. Avatar 🏛️, **David Park · Senior Analyst, Chicago Department of Housing**. Three-rule frame:
   > Putting this together is what we call assembling the **capital stack** — soft loans, grants, tax credits, and equity stacked to your TDC. Three rules:
   > - Every source closes more of the gap.
   > - Every source takes time. Time is money — hard costs escalate at ~5%/year.
   > - Past **5 sources**, complexity penalty kicks in: ~$20k/unit per extra source for sponsor work.
   >
   > *The art is closing the gap with the smallest, fastest set of sources you can.*

2. Existing gap status bar + stack composition viz (unchanged structure).
3. LIHTC decision card (unchanged), or QAP-denied banner with recovery buttons (see below).
4. Source grid (unchanged).
5. **Revise toolbar** above the advance button: `[Revise to cut costs (+3 mo)]` always available. After a QAP rejection, the toolbar also shows `[Submit again (+12 mo)]` and `[Revise to increase QAP odds]`.

### Revise sub-screens (Capital Stack)

Both render in place of the Capital Stack content when active. Header shows the revise mode title and explicit cost ("Revise to cut costs · +3 mo cost escalation").

**Cut costs sub-screen:**
- Shows only finish-level, unit-count, and AMI-mix sliders
- Live TDC preview updates as sliders move
- "Done — back to stack" button returns to Capital Stack and calls `tickMonths(3)`

**Increase QAP odds sub-screen:**
- Shows only AMI-mix sliders + CBO partner toggle (if not already selected)
- Live projected QAP score preview
- "Resubmit application" button: increments `lihtcRevisions`, applies penalties (see Game logic), then triggers a new QAP round (same flow as initial submit — `tickMonths(12)`, reroll)

### Phase 5 · GapResolution (new screen)

Layout:

- Header: **"Close the Gap · $X.XM outstanding"**
- Short narrative line: *"Asha says it doesn't go to Council with an open gap. Three ways out."*
- Three cards laid out horizontally:

| Card | Effect | Repeatable |
|------|--------|------------|
| 🏛️ Ask for more subsidy | `+9 mo · −15 alder · $1M closer` | yes |
| 📐 Redesign smaller | `+6 mo · +8 community · −10 units` | yes |
| 🔨 Lower-quality build | `+3 mo · −12 community · −10% hard cost` | **no (one-shot)** |

Each press: applies deltas, calls `tickMonths(n)`, re-runs gap calculation. If `gap ≤ 100_000`, an "Advance to entitlement →" button activates. Otherwise the screen stays, the updated gap number shows, and the **RecapCard** surfaces what just changed.

Lower-quality button shows as disabled with a checkmark and "Used" label after first press.

### Phase 6 · Entitlement

Two changes:

**1. Step durations** — pre-app `tickMonths(6)`, community `tickMonths(9)`, both committee steps `tickMonths(3)` each. Total entitlement: 21 mo (down from 48 mo).

**2. Choice card time labels.** Each `<ChoiceCard />` gains a small tag at the bottom: `+X mo · +$Y.YM cost escalation`. Cost escalation portion is computed live from current TDC.

### Phase 7 · Close — Reactions panel

Below the result card, above the action buttons row. Always shows all four voices on `outcome === 'closed'`. Each voice gets a small card (avatar + name + affiliation + line):

| Voice | Affiliation | Line varies by |
|-------|-------------|---------------|
| 🧑‍💼 Asha Tran | the alderperson | alder goodwill bucket (high/mid/low) |
| 📰 Editorial board | Chicago Reader editorial board | per-unit TDC bucket (`<$400k` / `$400-500k` / `>$500k`) |
| 👥 Block Club | Englewood neighborhood block club | building type + zoning-accept choice |
| 📣 Housing advocate | Chicago Housing Coalition | weighted avg AMI bucket (`≤55%` / `>55%`) |

On shelved outcomes, the Reactions panel is replaced with outcome-specific 2-3 lines (see Content section).

### Header timeline pill

`Header.tsx` gains a `<TimelinePill />` on the right. Shows `📅 1 yr 6 mo`. Updates after every `tickMonths` call. Single component change applies to every screen.

---

## Game logic & mechanics

### Time & cost escalation

Per-month escalation formula (replaces per-year):

```ts
escalationPerMonth = hard * (0.05 / 12) * (1 + SOFT_COST_RATIO + CONTINGENCY_RATIO)
```

Shared preview helper for action-time cost labels:

```ts
function escalationFor(months: number, hard: number): number {
  return hard * (0.05 / 12) * months * (1 + SOFT_COST_RATIO + CONTINGENCY_RATIO);
}
```

### QAP scoring (updated)

`computeLihtcScore` now reads `hasCboPartner` from caller-provided input (no longer hardcoded true). Same formula otherwise:

```ts
computeLihtcScore({
  weightedAvgAmi,
  hasCboPartner,        // from project.hasCboPartner
  hasLeverageCommitments,
  neighborhood,
}): number
```

Pro Forma calls with `hasLeverageCommitments: true` (projected ceiling). Capital Stack calls with `awarded.length >= 2` (live).

### Revise cost application

When `lihtcRevisions` increments:

- `softCostPenalty = lihtcRevisions * 150_000` — added to TDC at every screen that displays TDC. Surfaces as a new line: *"Revision rework: +$Xk"*.
- `alderGoodwill -= 4` (immediate on increment)
- `communitySupport -= 2` (immediate on increment)

### Gap resolution effects

Defined in `data/gapResolution.ts`:

```ts
export const gapResolutionActions = {
  askSubsidy: {
    apply: (s) => ({
      extraSubsidy: s.gapResolution.extraSubsidy + 1_000_000,
      alderGoodwill: Math.max(0, s.entitlement.alderGoodwill - 15),
    }),
    monthsCost: 9,
    repeatable: true,
  },
  redesignSmaller: {
    apply: (s) => ({
      shrinkBy: s.gapResolution.shrinkBy + 10,
      communitySupport: Math.min(100, s.entitlement.communitySupport + 8),
    }),
    monthsCost: 6,
    repeatable: true,
  },
  lowerQuality: {
    apply: (s) => ({
      lowerQualityUsed: true,
      communitySupport: Math.max(0, s.entitlement.communitySupport - 12),
    }),
    monthsCost: 3,
    repeatable: false,
  },
};
```

Gap recompute reads all three:
- TDC subtracts `extraSubsidy` from supportable funding side
- `units` for hard-cost calc subtracts `gapResolution.shrinkBy`
- `hardPerUnit` multiplied by `lowerQualityUsed ? 0.9 : 1.0`

New constant in `types.ts`:

```ts
export const LOWER_QUALITY_HARD_MULTIPLIER = 0.9;
```

### Capital stack complexity penalty

Unchanged threshold (5 sources) and rate ($20k/u). Continues to apply as today.

### LIHTC submit-again

No state changes beyond `lihtcResubmits++`, `tickMonths(12)`, and a fresh `Math.random() < lihtcOdds` reroll. No alder/community delta. Same scoring formula and same inputs.

### Marcus DSCR walk-through

Numbers computed in `ProForma.tsx` from live state:

```
NOI: $X (annual)            — computed via computeNoi(...)
÷ Required DSCR (1.20)      — constant
= Cash available for debt   — $X / 1.20
÷ Annual mortgage constant  — mortgageConstant(0.065, 30) ≈ 0.0758
= Supportable loan          — already computed in computeSupportableDebt
```

Existing `mortgageConstant` helper used unchanged.

### Stakeholder reaction triggers (Phase 7)

In `data/closeReactions.ts`:

```ts
export function getReactions(state: GameState): Reaction[] {
  if (state.outcome === 'closed') return successReactions(state);
  return failureReactions(state);
}
```

Triggers (success path):

| Voice | Logic |
|-------|-------|
| Asha | always shown; line bucket = `alderGoodwill >= 70 ? 'high' : alderGoodwill >= 40 ? 'mid' : 'low'` |
| Editorial | always shown; bucket = perUnitTdc thresholds at $400k and $500k |
| Block Club | always shown; line variant = `(buildingType === 'larger' \|\| pastChoices.includes(zoning-accept)) ? 'parking-concerned' : 'supportive'` |
| Advocate | always shown; line variant = `weightedAvgAmi > 55 ? 'depth-critical' : 'depth-praise'` |

Failure path (see Content section for line drafts).

### "What just happened" recap card

Reusable `<RecapCard />` component. Triggered after any `tickMonths(n)` call where `n >= 3`. Shows:
- Time added: `+X mo`
- Cost escalation accrued: `+$Y.YM`
- Any state deltas in the tick (alder, community, units, lower-quality flag)

Dismissable. Used on QAP submit returns, revise returns, gap-resolution action returns.

---

## Content (characters & dialogues)

### Character roster updates (`data/characters.ts`)

| Character | Update |
|-----------|--------|
| Marcus | Rename to **Marcus Bell**. Role: `Construction Lender, Loop Federal Bank`. Add `intro` (paragraph), `dscrExplain` (paragraph spelling out Debt Service Coverage Ratio), `capitalStackBubble` (one line for source card). |
| David | Rename to **David Park**. Role: `Senior Analyst, Chicago Department of Housing`. Add `capitalStackIntro` (three-rule frame paragraph). |
| Janelle | Unchanged. Pro Forma uses her existing `qapScore*` lines. |
| Asha | Add `closingHigh`, `closingMid`, `closingLow` (success variants) and failure variants `closingShelvedAlder`, `closingShelvedFinance`, `closingShelvedCommunity`, `closingShelvedStack`. |

### New voices in `data/closeReactions.ts`

No character roster entries needed — these are attributed quote sources only.

**Editorial board** — affiliation `"Chicago Reader editorial board"`:
- `lowCost` (perUnit < $400k): praise the cost discipline
- `midCost` ($400k–$500k): neutral with a question about subsidy efficiency
- `highCost` (>$500k): the critical line from the mockup

**Block Club** — affiliation `"Englewood neighborhood block club"`:
- `parkingConcerned`: parking complaint (triggers on larger building type OR zoning-accept choice)
- `supportive`: brief welcoming line

**Housing advocate** — affiliation `"Chicago Housing Coalition"`:
- `depthCritical` (avg AMI > 55%): not deep enough line
- `depthPraise` (avg AMI ≤ 55%): real impact line

### Failure-mode reactions

- `shelved-stack`: Asha regret line + Marcus "I tried to hold the loan terms" line
- `shelved-finance`: Asha "I lost the room" + Powell "I told you it was too expensive" + advocate "this is why pre-development needs deeper subsidy"
- `shelved-alder`: Asha "I couldn't make this work in my ward" + advocate "another site lost"
- `shelved-community`: Block club "we couldn't get behind it" + Asha brief regret

All draft lines to be written during Phase 3 implementation.

**Outcome reachability note.** The existing codebase defines `shelved-stack` and `shelved-finance` in the `Outcome` union but doesn't currently set them anywhere. This spec wires `shelved-stack` via the Phase 5 exhaustion path (see Phase advancement logic). `shelved-finance` remains unreachable for now — its reaction lines are pre-wired so a future spec can add the Committee-on-Finance failure trigger without revisiting content.

---

## Testing strategy

Match the existing pattern — unit tests for `game/` and `data/`, no UI tests beyond the existing smoke test.

### New tests

- `tests/game/monthsTime.test.ts` — `tickMonths`, escalation per month, `formatElapsed` formatting for boundary cases (0, 11, 12, 23, 24).
- `tests/game/gapResolution.test.ts` — each action's effect on state, gap recompute after each, one-shot enforcement on lower-quality (second press is no-op), repeat logic on the other two.
- `tests/game/qapRescore.test.ts` — submit-again leaves score formula identical (same inputs → same odds), revise applies penalty stack ($150k soft / −4 alder / −2 community per increment), cumulative penalties across multiple revisions.
- `tests/data/closeReactions.test.ts` — trigger logic returns the right line for each bucket on success and failure outcomes.
- `tests/data/amiTiers.test.ts` — eligibility check still ≤ 60 avg with 30/60/80 only, default breakdown averages ~58%, scoring multipliers compress correctly.

### Updated tests

- `tests/game/state.test.ts` — `monthsElapsed` instead of `yearsElapsed`; new initial state fields verified
- `tests/game/proForma.test.ts` — AMI tier set updated; CBO partner flag now sourced from `project.hasCboPartner`
- `tests/game/scoring.test.ts` — impact scoring multipliers updated
- `tests/game/capitalStack.test.ts` — `computeLihtcScore` signature change
- `tests/game/entitlement.test.ts` — per-step time costs verified
- `tests/data/amiRents.test.ts` — 50% AMI row removed
- `tests/data/sources.test.ts` — no expected changes

**Target:** ~80–90 tests when done (up from 59).

---

## Edge cases worth explicit handling

1. **Redesign-smaller floor.** Player enters gap resolution and presses "Redesign smaller" repeatedly until `units - shrinkBy ≤ 20`. Cap minimum at 20 units; gray out the button below that with a tooltip ("Cannot shrink below 20 units").
2. **Subsidy floor.** Player presses "Ask for more subsidy" until `alderGoodwill === 0`. Disable the button at that point with a tooltip ("Asha is out of political capital").
3. **Mixed gap-resolution.** Lower-quality used, then redesign-smaller pressed — hard cost factor (0.9) applies cleanly to the new smaller unit count.
4. **Revise sub-screen abandonment.** Player navigates away mid-revise (closes browser, refreshes). No persistence; game state is in-memory only. State changes commit only on the "Resubmit"/"Done" click, so abandoning leaves the prior state intact.
5. **AMI breakdown rebalance on unit change.** Existing `setUnits` rebalances the breakdown to maintain ratios. Updated for 3 tiers — same logic, one fewer bucket. Defaults clamp to non-negative integers.
6. **CBO toggle from revise sub-screen.** CBO partner can be toggled in the "Revise to increase QAP odds" sub-screen. Time-cost rule: the `+6 mo` pre-app penalty is applied the **first** time CBO is flipped on (whether at Site & Concept or later via revise) — tracked by a `cboTimePaid: boolean` flag in state. Flipping CBO off and back on does not re-charge the +6 mo. This prevents a balance exploit where "Go solo" at Site & Concept dodges the time cost while gaining the score boost on revise.
7. **Gap recompute with all gap-resolution levers applied.** Order of operations: (a) recompute hard cost using `units - shrinkBy` and `LOWER_QUALITY_HARD_MULTIPLIER` if used, (b) recompute soft + contingency from new hard, (c) compute new TDC, (d) subtract `extraSubsidy` from gap. Tests verify this order.

---

## Open questions

None. All design decisions resolved during brainstorming. Implementation may surface tactical questions (specific dialogue wording, exact color values for new card variants) that the implementing developer can decide inline.

---

## Acceptance criteria

A merged Spec 1 implementation is complete when:

- All three phases shipped and deployed
- Test suite passing at 80+ tests
- Manual playthrough demonstrates: AMI tier set is 30/60/80; Marcus banker card and DSCR walk-through visible on Pro Forma; QAP projected score on Pro Forma; David Park intro on Capital Stack; revise sub-screens functional with both modes; QAP rejection offers both Submit Again and Revise; GapResolution screen blocks advance to Entitlement when gap > $100k; gap-resolution actions apply effects and ticks; entitlement step durations are 6/9/3/3 months; time shown in header in "X yr Y mo" format; cost escalation labels appear on every action button; all four stakeholder reactions visible on a successful close; failure outcomes show outcome-specific reaction sets
- No regression in existing functionality (Englewood mid-rise all-affordable playthrough still produces a closable project with sensible economics)
