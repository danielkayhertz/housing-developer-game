# Housing Developer Game — v4 Fix Queue (Design Spec)

**Date:** 2026-06-05
**Source:** `~/.claude/handoffs/housing-developer-game.md` — Known Bugs / v4 Fix Queue (items 1–16)
**Scope:** A single coordinated v4 release that ships all 16 fixes, grouped into 6 phases by file scope and risk.

---

## Overview

v3 shipped four playable neighborhoods, mixed-income mechanics, and jargon explainers. Playtesting surfaced a tight list of 16 fixes: a mix of UI polish (color tags, slider range, hardcoded names), state-plumbing bugs (live preview alder, QAP score mismatch across pages, deferred dev fee paying $0), mechanical rebalancing (cost-escalation timing, finishing-level QAP impact, pre-app / community-meeting choice values), and three new behaviors (un-selectable capital sources, a Committee on Finance gap-close gate, and end-game metrics for cost escalation and unit loss).

The fixes cluster naturally around their target files. Phase A is independent UI polish. Phases B–C touch `proForma.ts` / `capitalStack.ts` / `state.ts`. Phases D–F build the new gap-close and CoF flows. This sequencing lets the riskiest work (Phase F: CoF gap modal, results metrics) build on already-stabilized pieces (Phase B: unified QAP scoring; Phase D: AMI plumbing + auto-fail).

**Tech context unchanged from v3:** React 19 + Vite + TS + Zustand + Tailwind v4. Tests in `tests/` use Vitest. Visual screens live in `src/screens/`; pure-function game logic in `src/game/`.

---

## Phase Groupings

| Phase | Theme | Items | Complexity |
|---|---|---|---|
| A | UI polish & rename | 1, 3, 13 | S |
| B | QAP coherence & Pro Forma reflow | 4, 5, 7 | M |
| C | Cost escalation & stack mechanics | 6, 8, 9, 16a | M |
| D | Gap resolution failure & AMI plumbing | 10, 16b | M |
| E | Entitlement choice rebalance | 11, 12 | S |
| F | Committee on Finance gap gate + results | 14, 15 | L |

Note: item **16** (AMI changes flow through to revenue/gap in every "close the gap" surface) is split across **C** (subscreens inside Capital Stack) and **D** (the Phase-5 GapResolution screen), with the CoF modal in **F** reusing the Phase-D component.

---

## Item-by-Item Breakdown

### Phase A — UI polish & rename

#### 1. Remove neighborhood color tags
**Behavior:** No more green/yellow/red `alderTone` pill chip next to the neighborhood name on Site & Concept.
**Files:** `src/screens/SiteAndConcept.tsx` — delete `tonePillClass` helper and its usage on the neighborhood card (~line 75).
**State/type changes:** None. `alderTone` stays on `NeighborhoodProfile` (still used by `CharacterBubble` styling and tests).
**Complexity:** S

#### 3. Unit count slider 20–100
**Behavior:** Site & Concept unit slider goes from 20 to 100 (currently 40 to 100).
**Files:** `src/screens/SiteAndConcept.tsx` — change `min={40}` → `min={20}` on the unit slider; update the "40" label to "20" in the legend.
**State/type changes:** None.
**Complexity:** S

#### 13. Rename Alder Powell → Alder Cunningham
**Behavior:** The fiscal-hawk alder is renamed throughout. The `CharacterId` key stays as `'powell'` to avoid churning every reference; only the displayed name changes.
**Files:**
- `src/data/characters.ts` — change `powell: { name: 'Ald. Powell', ... }` to `'Ald. Cunningham'`.
- `src/screens/Entitlement.tsx` — change finance-committee attack panel `<b>Ald. Powell:</b>` → `<b>Ald. Cunningham:</b>`.
- `src/screens/Close.tsx` — failure copy "Powell and Reyes teamed up" → "Cunningham and Reyes teamed up".
- `src/data/closeReactions.ts` — any "Powell" mentions in dialogue.
- `src/data/characters.ts` `ashaLines.financeReframe` → "Make Cunningham own his comparison." (was "Powell").
**State/type changes:** None.
**Complexity:** S

---

### Phase B — QAP coherence & Pro Forma reflow

#### 4. Move CBO partner toggle from Site & Concept → Pro Forma
**Behavior:** CBO partner choice is made on Pro Forma so the player sees its QAP impact at decision time. The Site & Concept screen no longer has a CBO section.
**Files:**
- `src/screens/SiteAndConcept.tsx` — delete the entire CBO partner block (section "5. CBO partner" and its two buttons) and remove the `setCboPartner` import.
- `src/screens/ProForma.tsx` — add a new "Lever 3 — CBO partner" card with the same two-button UI (`🤝 Partner with a CBO` / `Go solo`). Place it on the **left column** below the AMI breakdown card.
**State/type changes:** None. `setCboPartner` action keeps existing side effects (community +6/+12 per neighborhood hook, +6 mo first time via `tickMonths`).
**Note on item 6 interaction:** `setCboPartner` calls `tickMonths(6)` on first activation. Item 6 says cost escalation shouldn't accrue before Phase 4 — so on Pro Forma, the CBO toggle should still advance `monthsElapsed` by 6 but not add to `costEscalation`. See item 6.
**Complexity:** M

#### 5. Finishing-level QAP points + Pro Forma reflow
**Behavior:**
- Basic finishings: −12 QAP. Standard: ±0. Elevated: +14 QAP.
- "Gap to close" and "Projected QAP score" modules move to the **top** of the Pro Forma page, side by side in a 2-column grid. The TDC bottom-up and DSCR walk-through stay below.
**Files:**
- `src/game/capitalStack.ts` — extend `computeLihtcScore` input to include `finishLevel: FinishLevel`. Inside, `if finish === 'basic' score -= 12; if 'elevated' score += 14`. (See item 7 for the unification path.)
- `src/screens/ProForma.tsx` — restructure JSX so the gap card and QAP projection card sit in a `grid-cols-2` block above the levers/math layout. Pass `finishLevel: proForma.finishLevel` to the new `computeQapScore(state)` helper.
- `tests/capitalStack.test.ts` — add cases for finish-level deltas.
**State/type changes:** None (`finishLevel` already lives on `proForma`).
**Complexity:** M

#### 7. QAP score parity across Pro Forma and Capital Stack
**Behavior:** Both screens show the same QAP score and award probability. Today they diverge because `ProForma` hardcodes `hasLeverageCommitments: true` and `CapitalStack` derives it from `stack.awarded.length >= 2`.
**Approach:** Extract a single source of truth.
**Files:**
- `src/game/capitalStack.ts` — add `computeQapScore(state: GameState): { score, odds }` that derives every input from `GameState` (weighted AMI, CBO partner, leverage commitments = `state.stack.awarded.length >= 2`, neighborhood, intent, market units, finish level). Both screens consume this single helper.
- `src/screens/ProForma.tsx`, `src/screens/CapitalStack.tsx` — replace direct `computeLihtcScore({...})` calls with `computeQapScore(state)`.
- `src/components/SourceCard.tsx`, `src/screens/CapitalStack.tsx` `QapOddsSubScreen` — same swap.
- `tests/capitalStack.test.ts` — add a parity test asserting equal scores from both screens for a given state.
**State/type changes:** None (helper, not data).
**Complexity:** M
**Note:** Marketing detail — on Pro Forma the explanatory caption shifts from "Projection assumes you assemble a typical stack on the next screen" to be honest about the live derivation (since `leverageCommitments` is now a live signal).

---

### Phase C — Cost escalation & stack mechanics

#### 6. Defer cost escalation until Capital Stack page
**Behavior:** No cost escalation accrues during Phase 1 (Intro) → Phase 3 (Pro Forma). `monthsElapsed` may still advance (e.g., the CBO +6 mo on Pro Forma counts for the timer), but `costEscalation` doesn't grow. From Phase 4 onward, escalation accrues as it does today.
**Approach:**
- Add a `tickMonthsNoEscalation(n)` action that only advances `monthsElapsed`.
- Or, simpler: gate the escalation arithmetic inside `tickMonths` on `s.phase >= 4`. Picked the gated-internal approach — fewer call-site changes, single source of truth.
**Files:**
- `src/game/state.ts` — inside `tickMonths`, only add to `costEscalation` when `s.phase >= 4`. Recap (`lastRecap`) still fires for n≥3.
- `src/screens/ProForma.tsx` — keep the existing `tickMonths(12)` at advance (it now only counts months); but actually we should **remove this `tickMonths(12)`** because the design intent for v4 is that escalation starts at the capital-stack page, not before. The 12 months of "the LIHTC submission cycle" already happens inside `onSubmitLihtc` on Capital Stack. So delete `tickMonths(12)` from `ProForma.onAdvance`.
- `src/screens/Entitlement.tsx` — no change; Phase 4+ behavior already correct.
- `tests/state.test.ts` (or new) — test that escalation stays at 0 after Pro Forma advance.
**State/type changes:** None.
**Complexity:** S

#### 8. De-select capital stack items (except LIHTC)
**Behavior:** Each awarded source on the Capital Stack screen gets a small `×` (or "Remove") affordance. Clicking it removes the source from the stack (the gap reopens proportionally). LIHTC sources (`9-lihtc`, `4-lihtc-bonds`) and the auto-sized `bank-loan` cannot be removed.
**Files:**
- `src/components/SourceCard.tsx` — when `status === 'awarded'` and `source.id ∉ {'9-lihtc', '4-lihtc-bonds', 'bank-loan'}`, render a small `onRemove` button (× in the corner).
- `src/screens/CapitalStack.tsx` — pass `onRemove={() => removeSource(src.id)}` into each `SourceCard`. `removeSource` already exists in `state.ts`.
**State/type changes:** `SourceCard` props gain optional `onRemove?: () => void`.
**Complexity:** S

#### 9. Deferred developer fee actually pays
**Behavior:** Selecting "Deferred Developer Fee" awards `min(3% of TDC, $1,500,000)` (rounded to nearest $1k) and closes that much gap. No time cost (already `daysToProcess: 0`).
**Files:**
- `src/screens/CapitalStack.tsx` — `onApply(sourceId)` currently returns early when `amountRange === null` (line 82). Add a special case before the early return: `if (sourceId === 'deferred-dev-fee') { amount = Math.min(0.03 * tdcTotal, 1_500_000); awardSource({ sourceId, amount, daysSpent: 0 }); return; }`.
- `src/data/sources.ts` — update `shortDescription` to "Capped at min(3% TDC, $1.5M); no time cost".
- `tests/capitalStack.test.ts` — add coverage.
**State/type changes:** None.
**Complexity:** S

#### 16a. Live gap row in Capital Stack revise subscreens
**Behavior:** Both revise subscreens (`CutCostsSubScreen` and `QapOddsSubScreen`) gain a live "NOI → supportable debt → gap" tabular block at the bottom that updates as the player drags AMI sliders.
**Files:**
- `src/screens/CapitalStack.tsx` — inside `CutCostsSubScreen`, compute `noi`, `debt`, and `gap` from current store state, render below the existing TDC preview. Inside `QapOddsSubScreen`, same — append below the projected-score row.
- Optional refactor: extract a small `<LiveGapRow />` component in `src/components/`.
**State/type changes:** None (derived from existing state).
**Complexity:** S

---

### Phase D — Gap resolution failure & AMI plumbing

#### 10. Auto-fail when all three gap actions exhausted
**Behavior:** When `subsidyDisabled && shrinkDisabled && qualityDisabled && gap > GAP_ADVANCE_THRESHOLD`, the GapResolution screen replaces its body with a "We've tried everything" panel:
- David Park bubble: "We've tried a bunch of different things, but this project isn't penciling. Start over."
- Single CTA button: "Start over" → calls `reset()`.
- The existing "Shelve the project" button is removed in this exhausted state. (Shelve remains available in the non-exhausted state for the player who wants to walk away early.)
**Files:**
- `src/screens/GapResolution.tsx` — add an `allExhausted && gap > GAP_ADVANCE_THRESHOLD` branch that renders the new exhaustion panel.
- `src/data/characters.ts` — add `davidLines.gapResolutionExhausted: "We've tried a bunch of different things, but this project isn't penciling. Start over."`.
**State/type changes:** None.
**Complexity:** S

#### 16b. AMI sliders + live gap in GapResolution screen
**Behavior:** GapResolution screen gets the same AMI breakdown slider trio used in `CutCostsSubScreen`, plus a small "NOI · supportable debt · gap" tabular block that updates live. AMI changes flow through `computeEffectiveGap` (which already calls `computeNoi`), so the gap recomputes automatically.
**Files:**
- `src/screens/GapResolution.tsx` — above the action grid, add a panel with three sliders bound to `setAmiUnit`, mirroring the AMI section in `CutCostsSubScreen`. Add a `<LiveGapRow />` (or inline tabular block) showing `noi`, `debt.amount`, `gap`.
**State/type changes:** None (`computeEffectiveGap` already accounts for AMI).
**Complexity:** S

---

### Phase E — Entitlement choice rebalance

#### 11. Pre-app intake durations + public option penalty
**Behavior:**
- Quiet alder meeting: 6 mo (unchanged). +2 alder / ±0 community (unchanged).
- Formal with CBO partner: 6 mo (unchanged). +5 alder / +6 community (unchanged).
- Public pre-launch w/ press: **0 mo** (was 6). **−10 alder / −5 community** (was −3 / +4).
**Approach:** Replace the single `STEP_DURATIONS[1] = 6` with a per-choice duration map.
**Files:**
- `src/screens/Entitlement.tsx` — replace `STEP_DURATIONS[1] = 6` with `STEP_DURATIONS_BY_CHOICE: Record<StepChoiceKey, number>` (or, simpler: keep `STEP_DURATIONS` for steps 2–4 and add a small per-choice override). Update `BASE_STEP1_CHOICES` consequences strings ("−10 alder · −5 community").
- `src/game/entitlement.ts` (`applyChoice`) — change `preapp-public` deltas to `alderDelta: -10, communityDelta: -5`. Verify there's no `tdcDelta` for `preapp-public`.
- `src/screens/Entitlement.tsx` `onChoose` — read per-choice duration when computing `months`.
- `tests/entitlement.test.ts` — update existing pre-app cases.
**State/type changes:** None.
**Complexity:** S

#### 12. Community meeting choices (Step 2) overhaul
**Behavior:** Three options total. Data-led is removed.
- **No meeting** (new key `community-none`): −20 alder · −25 community · 0 mo
- **Story-led** (`community-story`): **±0 alder** (was −2) · +12 community · 9 mo
- **Coalition-led** (`community-coalition`): +4 alder · +10 community · 9 mo (unchanged)
**Files:**
- `src/game/types.ts` — add `'community-none'` to `StepChoiceKey` union; remove `'community-data'`.
- `src/game/entitlement.ts` — add `community-none` case (alder −20, community −25, no duration); update `community-story` alderDelta from −2 to 0; remove `community-data`.
- `src/screens/Entitlement.tsx` — replace `STEP_CHOICES[2]` array contents: `[no-meeting, story-led, coalition-led]`. Per-choice duration override: `community-none` = 0.
- `src/data/characters.ts` — add `ashaLines.communityNone: "No meeting? OK. The block club will hear about this from somewhere else, and not from us."` Update existing `communityStory` line if needed.
- `tests/entitlement.test.ts` — replace data-led tests; add no-meeting + updated story-led tests.
**State/type changes:** `StepChoiceKey` union updated (note: there's no migration concern — game state isn't persisted yet).
**Complexity:** S

---

### Phase F — Committee on Finance gap gate + results

#### 14. Committee on Finance gap popup + alder-after-close fail rule
**Behavior:** Two coupled mechanics.

(a) **`finance-concede` actually opens the gap.** Today the choice text says "gap reopens" but no math runs. Change: applying `finance-concede` subtracts $3,000,000 from `gapResolution.extraSubsidy` (clamped to 0 floor). This flows through `computeEffectiveGap` and surfaces as a positive `gap`.

(b) **CoF gap modal.** When the player is on Phase 6 entitlement step 4 (Committee on Finance) AND `computeEffectiveGap(state).gap > GAP_ADVANCE_THRESHOLD`, the entitlement step UI is overlaid by a `<GapCloseModal />` that:
- Reuses the same three actions from GapResolution (ask subsidy / redesign smaller / lower quality), respecting the same disabled rules.
- Reuses the AMI sliders + live gap row from Phase D.
- Reuses the auto-fail-exhausted panel from item 10 (with copy reframed for CoF context: "We're out of moves. The committee is going to vote no. Start over.").
- Blocks all underlying CoF choice cards (disabled or visually behind a backdrop) while the gap is open.
- Closes itself when `gap <= GAP_ADVANCE_THRESHOLD`.

(c) **CoF fail rule after close.** In `onComplete()` (final entitlement transition to Phase 7), evaluate **after** the gap-close mechanic: if `entitlement.alderGoodwill < 20`, set outcome to `'shelved-finance'` (was previously routed to `'shelved-alder'`). This activates the already-written `closingShelvedFinance` dialogue and matches the existing `failureMessage` mapping in `Close.tsx`.

**Files:**
- `src/components/GapCloseModal.tsx` (new) — extracted reusable gap-close UI. Takes `{ onClose: () => void; context: 'phase-5' | 'cof' }`. Body = AMI sliders + live gap row + action grid + exhausted-fail branch.
- `src/screens/GapResolution.tsx` — refactor to render `<GapCloseModal context="phase-5" onClose={advancePhase} />` as its core. (Most of its body moves into the new component.)
- `src/screens/Entitlement.tsx` — at step 4 render, check `computeEffectiveGap(state).gap > GAP_ADVANCE_THRESHOLD`. If true, render `<GapCloseModal context="cof" onClose={...} />` over the step body and disable choice buttons.
- `src/game/entitlement.ts` (`applyChoice`) — `finance-concede` returns a new consequence field `extraSubsidyDelta: -3_000_000` (or update `gapResolution.extraSubsidy` directly via a new action).
- `src/game/state.ts` — add `applyFinanceConcedeGap` action (or thread the delta through `takeEntitlementStep`).
- `src/screens/Entitlement.tsx` `onComplete()` — flip the alder-low check: keep the `affordableShare < ARO_FLOOR` branch first; then `if (entitlement.alderGoodwill < 20) setOutcome('shelved-finance')` (was `'shelved-alder'`); keep community-low check after.
- `tests/entitlement.test.ts`, `tests/gapResolution.test.ts` — coverage for: concede reopens gap; CoF passes when gap closed and alder ≥ 20; CoF shelves-finance when gap closed and alder < 20; CoF exhaustion routes to a restart.
**State/type changes:**
- Optional: `StepChoice.extraSubsidyDelta?: number` in `types.ts` (cleaner than direct mutation from `applyChoice`).
- Outcome enum: `'shelved-finance'` already exists; no addition.
**Complexity:** L

#### 15. Results screen — cost escalation + units lost
**Behavior:** Close.tsx adds two new stats to the existing 4-stat grid:
- **Cost escalation:** `+$X.XM` (the `costEscalation` already on state).
- **Units lost:** `−N vs. plan` where N = `project.initialUnits - finalUnits`. Shown only if N > 0; otherwise hidden.
**Approach:** Snapshot `initialUnits` (and optionally `initialTdcBase`) when the player advances out of Site & Concept. Stored on `project`.
**Files:**
- `src/game/types.ts` — add `project.initialUnits: number | null` (and optionally `initialTdcBase: number | null`).
- `src/game/state.ts` — in `advancePhase`, when transitioning from Phase 2 to Phase 3 (Site & Concept → Pro Forma), set `project.initialUnits = s.project.units`. (Use Phase 2 → 3 because Pro Forma can still rebalance AMI within `units`, but the unit count itself is locked at Site & Concept exit.)
- `src/screens/Close.tsx` — extend stat grid from `grid-cols-4` to `grid-cols-3` rows with 2 rows (or keep one row with 6 stats — pick `grid-cols-3` two-row for readability). Add: "Cost escalation" stat (`+${(costEscalation / 1_000_000).toFixed(1)}M`) and "Units lost" stat (`${initialUnits - finalUnits} fewer`) shown conditionally.
- `tests/state.test.ts` — assert `initialUnits` snapshot fires on Phase 2→3 transition.
**State/type changes:** `project.initialUnits` added (nullable for backwards compat with reset / not-yet-set).
**Complexity:** M

---

## Dependency Map

```
A (1, 3, 13) ── independent, ship first ──┐
                                          │
B (4, 5, 7) ──── 4, 5 must land before 7 ─┤
                  │                       │
                  └──> 7 unifies QAP into ─┴─> C (8, 9, 16a)
                                              │
                                              └──> 6 (gates escalation) ──> 14, 15
                                                                            │
D (16b, 10) ─ 16b must land before 10 ─┐                                    │
                                       │                                    │
                                       └──> F (14, 15) ─ 14 reuses 16b ─────┘

E (11, 12) ── independent, can ship anywhere after A ──
```

**Critical path:** A → B → C → D → F.
**E** can be parallelized with any later phase.
**Same-file conflict zones** to coordinate when parallelizing:
- `Entitlement.tsx`: items 11, 12, 14 all touch this file.
- `CapitalStack.tsx`: items 7, 8, 9, 16a all touch this file.
- `state.ts`: items 6, 14, 15 all touch this file.
- `characters.ts`: items 13, 10, 12 all touch this file.

Recommend serializing within each conflict zone.

---

## Open Design Decisions (Resolved)

1. **QAP finish-level scale:** `−12 / 0 / +14`. Big lever — matches user intent for finishings to be a real choice, not cosmetic.
2. **CoF fail rule:** Alder `< 20` evaluated **after** the player closes the gap. Gap-closing actions cost alder goodwill, so the choice itself can cause the failure.
3. **Gap exhaustion fail:** Auto-trigger David Park popup + single "Start over" CTA; existing "Shelve" button is removed in exhausted state.
4. **Results metrics layout:** Compact stats added to the existing grid; no dedicated panel.
5. **Data-led community meeting choice:** Removed entirely.
6. **CBO toggle location:** Removed from Site & Concept; lives only on Pro Forma.
7. **AMI sliders + live gap surfaces:** All four "close the gap" surfaces (CutCostsSubScreen, QapOddsSubScreen, GapResolution screen, new CoF modal).
8. **Deferred dev fee amount:** `min(3% × TDC, $1.5M)`.
9. **`finance-concede` gap amount:** Reopens gap by $3M.

---

## Key Assumptions

- Game state is **not persisted** between sessions (no localStorage yet — that's a v4+ stretch goal per the handoff). So `StepChoiceKey` and `project` schema changes don't need migration shims.
- 211 existing tests should continue to pass; rebalancing items (11, 12) will require updating affected entitlement tests, not adding feature flags.
- The `powell` `CharacterId` key stays — only the displayed name changes — to avoid mass-renaming references and tests for a cosmetic change.

## Rationale for Major Choices

- **Why split item 16 across phases C and D rather than make it its own phase:** The "live gap row" UI is small and naturally lives next to the AMI sliders inside the affected revise/resolution screens. Treating it as a sub-task of those phases keeps related edits in the same PR.
- **Why extract `<GapCloseModal />` as a shared component in phase F:** Item 14 explicitly says "this can be the same module as the 'close the gap' one." The cleanest realization is to extract the shared UI once (during phase F) and reuse it in both contexts. Phase D adds the AMI sliders and live gap row to `GapResolution.tsx` directly; phase F lifts that screen body into a reusable component.
- **Why `computeQapScore(state)` lives in `capitalStack.ts` rather than `proForma.ts`:** It's the same scoring function as `computeLihtcScore` — keeping it adjacent to its existing math home makes test colocation cleaner.
- **Why gate `costEscalation` accrual inside `tickMonths` rather than at every call site:** Single source of truth. Future call sites (e.g., a new "fast-track" choice) automatically obey the rule.
