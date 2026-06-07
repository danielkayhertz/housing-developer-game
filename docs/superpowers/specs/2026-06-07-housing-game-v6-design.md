# Design: Chicago Affordable Housing Developer Game — v6

**Date:** 2026-06-07
**Status:** Approved (brainstorming complete)
**Predecessor:** v5 (2026-06-06, 558 tests, deployed)

## Scope

Eight in-scope items. Explicitly **out of scope**: localStorage save, PNG result-card
download, Spanish toggle, intro/onboarding polish.

Decisions made during brainstorming:
- Item 1 ("What happened?" popups): **outcome-aware** narratives (not just gap-fill).
- Pilsen icon: **🏘️** (rowhouses).
- Stale "v2 neighborhood" note at `SiteAndConcept.tsx:171`: **clean up** (in scope).

---

## 1. Canonical gap / TDC formula

**Problem.** The gap shown inline on ProForma/CapitalStack differs from the Header bar.
Root cause: `Header.tsx` computes its own gap as
`tdcWithEscalation - totalCommitted(stack.awarded)` — it omits the bank loan, the extra
subsidy, and the complexity penalty. `computeEffectiveGap` in `gapResolution.ts` is the
complete version (includes bank loan, extra subsidy, complexity penalty, revision
penalty, cost escalation).

**Change.** Make `computeEffectiveGap(state)` the single source of truth for every gap
**and** TDC display.
- `Header.tsx`: replace the hand-rolled computation with `computeEffectiveGap(state)`,
  using `.tdcAllIn` for the TDC figure, `.gap` for the Gap figure, `.effectiveUnits` for
  the units count, and `.costEscalation` for the escalation sub-figure.
- Verify `ProForma` and `CapitalStack` read their gap from `computeEffectiveGap` (or an
  equivalent breakdown). Reconcile any surface that does not.

**Test.** Assert Header's displayed gap and TDC equal `computeEffectiveGap(state).gap`
and `.tdcAllIn` for a representative mixed-income state that has a bank loan and a
complexity penalty (the configuration where the old Header formula diverged). Add an
assertion that the three surfaces agree on the same state.

---

## 2. Bug 12 — verify + regression test (no code change expected)

**Finding.** Already fixed in v5. The Entitlement screen renders
"Ald. _X_ pulled the ordinance" for both `shelved-finance` and `shelved-community`, and
the Council-vote / "See your result" success panel is gated on `outcome === 'in-progress'`,
so a failure and a success panel cannot co-render. The only remaining "approved" string
(`closeReactions.ts:122`) is correctly scoped to the **closed** success path.

**Work.** Lock the fixed behavior with regression tests:
- Render `Entitlement` with `outcome === 'shelved-finance'` and `'shelved-community'`:
  assert "pulled the ordinance" present; assert the Council-vote / "See your result"
  success text is absent; assert no stray "approved"/"passed the ordinance".
- Render `Close` for the same shelved outcomes: assert it shows the shelved header
  ("The project was shelved."), not success copy.

If verification surprises us and the bug is live, fix the narrative to say the alder
pulled the ordinance.

---

## 3. Item 1 — outcome-aware "What happened?" narratives

v5 shipped `recapNarratives` (20 entries) + `resolveRecapNarrative`, wired into nearly
every `tickMonths` call and rendered by `RecapCard`. Two gaps remain.

**3a. LIHTC win vs. loss.** `lihtcSubmit` / `lihtcResubmit` / `lihtcRevise` currently
return the same narrative whether the QAP round is won or lost — they explain the
12-month cadence but not *why* the outcome happened. Split each into win/loss variants
(6 entries total):
- **Win** explains why: strong QAP score / AMI depth / CBO partner cleared the
  competitive cutoff.
- **Loss** explains why (competitive round, score under the cutoff) and points at the
  lever to pull (deepen AMI, add a CBO partner, revise exhibits).

`CapitalStack` already computes `win` before calling `tickMonths`, so it passes the
correct variant key (e.g. `lihtcSubmit-win` / `lihtcSubmit-loss`). `resolveRecapNarrative`
resolves the variant; the `janelle` category is retained.

**3b. Density-variance narrative.** For the larger-building path at the zoning step,
`Entitlement.tsx:141` calls `tickMonths(DENSITY_VARIANCE_MONTHS)` with no narrative, and
it is immediately overwritten by the choice tick at line 147. Merge into a single
`tickMonths` for that path whose narrative explains the density-variance condition (extra
TDC + review months imposed by committee). The `addCostEscalation(conditionCost)` call is
unchanged.

**3c. Audit.** Confirm every `tickMonths` call site passes a narrative after 3a/3b.

`RecapCard` already renders `lastRecap.narrative`; no UI change.

**Tests.** Assert `resolveRecapNarrative` returns distinct win vs. loss lines for the
LIHTC keys; assert the larger-building zoning path produces a density-variance narrative.

---

## 4. Pilsen icon → 🏘️

`neighborhoods.ts`: Pilsen `emoji: '🌮'` → `'🏘️'`. Test asserts the new value and that
it is no longer 🌮.

---

## 5. Market rents +25%

`neighborhoods.ts` `marketRentPerUnit`:

| Neighborhood    | Old   | New   |
|-----------------|-------|-------|
| Englewood       | 1,150 | 1,438 |
| Pilsen          | 2,100 | 2,625 |
| Jefferson Park  | 2,900 | 3,625 |
| Albany Park     | 1,800 | 2,250 |

Update the three assertions in `neighborhoods.test.ts` (Pilsen / Jefferson Park /
Albany Park). `mixedIncome.test.ts` reads the value dynamically (no break);
`proForma.test.ts:73` uses a standalone literal input (unrelated, leave).

Intended downstream effect: higher market rents raise mixed-income NOI and supportable
debt, so mixed-income gaps shrink slightly. Verify no other test asserts a stale gap
number after the change.

---

## 6. Remove v2/MVP badges + stale gating copy

`SiteAndConcept.tsx`:
- Lines 108–110: remove `(v2)`, `· MVP`, and the second `(v2)` from the building-type
  toggle labels (walk-up, mid-rise, larger).
- Line 106: remove the `opacity-60` dimming on non-midrise types — all three are live.
- Line 171: remove/replace the stale "is a v2 neighborhood … Pick Englewood for the full
  MVP experience" note (all four neighborhoods are live as of v3).

---

## 7. Items 8/9 — verify framing copy

Diff the Entitlement alder-intro (`Entitlement.tsx` ~195–199) and per-step framing
(~265–279) against the v3 specs
(`2026-06-04-housing-game-content-expansion-design.md`,
`2026-06-04-housing-game-jargon-explainers-design.md`). Adjust only where copy diverges
from spec intent. Expected: little or no change.

---

## 8. Browser playthrough verification

Dev-server playthrough of all four neighborhoods (Englewood, Pilsen, Jefferson Park,
Albany Park):
- Gap agrees across Header / ProForma / CapitalStack.
- LIHTC win/loss narratives read correctly in the recap popup.
- 🏘️ shows for Pilsen; new rents flow through mixed-income mode.
- Building-type badges gone; no stale v2/MVP copy.
- Shelved-finance / shelved-community narratives correct on Entitlement + Close.

---

## Process & definition of done

- TDD for items 1–3 (gap unification, narratives, Bug 12 regression). Plain edits for
  4–6. Verification for 7–8.
- `tsc -b` + `vite build` clean; full test suite green.
- Commit per logical unit; push to main (auto-deploys to Cloudflare).
- Update `~/.claude/handoffs/housing-developer-game.md` to a v6 entry summarizing what
  shipped and the remaining (excluded) queue.

## Key assumptions

- `computeEffectiveGap` is already correct/complete; the fix is to route all surfaces
  through it, not to change its math.
- Bug 12 is already resolved in code; the deliverable is regression coverage, not a fix.
- All three building types and all four neighborhoods are fully live (per v3), so the
  v2/MVP gating copy is purely stale.

## Rationale for major choices

- **Single canonical gap formula** eliminates the class of bug rather than patching one
  surface: every display derives from one breakdown, so they cannot drift again.
- **Outcome-aware narratives** make the recap popup actually explanatory — the LIHTC
  win/loss moment is the highest-stakes event in the game and previously gave identical
  feedback regardless of result, which undercut the educational goal.
