# Single-Family "Give Up" Pivot — Design

**Date:** 2026-06-10
**Status:** Approved design, ready for implementation plan

## Summary

Add a "Give up and build single-family homes" escape hatch to the Housing
Developer Game. It opens a self-contained popup module where the player builds
1–15 market-rate single-family homes for sale instead of affordable housing.
The module has its own pro forma (entirely separate from the affordable-housing
math), borrowing only the selected neighborhood. It teaches the irony that
"giving up" on affordable housing is lucrative in high-cost wards and impossible
in disinvested ones.

## Entry points

A "🏚️ Give up and build single-family homes" button appears on:

- **Site & Concept** (Phase 2) — a fork right at the start.
- **Capital Stack** (Phase 4) and **Gap Resolution** (Phase 5) — the
  "frustration" screens where the affordable deal is struggling.

The button is enabled only once a neighborhood is selected (sales prices depend
on it). It is hidden/disabled otherwise.

## Architecture

**Approach B — global overlay modal.** A single `SingleFamilyModal` component is
rendered once in `App.tsx` (the same way `RecapCard` already is), toggled by a
store flag. This touches the existing phase system not at all. Cancelling the
modal returns the player to exactly where they were in the affordable game; only
"Apply for permits" commits to the single-family ending.

### State

Add to `GameState` (`src/game/types.ts`) and `initialState` (`src/game/state.ts`):

- `sfhOpen: boolean` (default `false`)

Add store actions:

- `openSfh()` — sets `sfhOpen = true`
- `closeSfh()` — sets `sfhOpen = false`

The unit-count selection and all derived numbers live in **local component
state** inside the modal plus the pure calc module — they do not enter the store.

### New files

- **`src/game/singleFamily.ts`** — pure economics. Exports `computeSfhDeal`,
  tier helpers, and SFH types. No React; fully unit-testable.
- **`src/data/singleFamily.ts`** — the sales-price matrix and constants:
  `EQUITY_BUDGET = 2_000_000`, `AFFORDABLE_PRICE = 250_000`,
  `PERMIT_DAYS = 120`, and the TDC tier table.
- **`src/components/SingleFamilyModal.tsx`** — the overlay, with three internal
  views: build form, DOH dead-end, and permit-granted final page.

### Modified files

- `src/App.tsx` — render `<SingleFamilyModal />` globally.
- `src/screens/SiteAndConcept.tsx` — add entry button.
- `src/screens/CapitalStack.tsx` — add entry button.
- `src/screens/GapResolution.tsx` — add entry button.
- `src/data/characters.ts` — add SFH dialogue lines (banker rule, alder zoning
  warning, DOH ARO note, DOH no-subsidy dead-end, permit-granted flavor).

## Economics (`computeSfhDeal(neighborhoodId, units)`)

```
tdcPerUnit:   1 → $500k · 2 → $400k · 3–5 → $350k · 6–15 → $300k
totalTDC = units × tdcPerUnit(units)

marketPrice (per unit), by tier 1 / 2 / 3–5 / 6–15:
   Jefferson Park & Pilsen:  $1.3M / $1.1M / $900k / $750k
   Albany Park:              $1.1M / $1.0M / $800k / $600k
   Englewood:                $400k / $375k / $300k / $275k

aroAffordableCount = units > 10 ? Math.floor(0.20 × units) : 0
   → 11–14 → 2 affordable units, 15 → 3 affordable units
marketUnits  = units − aroAffordableCount
salesRevenue = marketUnits × marketPrice + aroAffordableCount × $250k

loan          = min(0.80 × totalTDC, 0.70 × salesRevenue)   (record which binds)
equity        = min(totalTDC − loan, $2M)
profit        = salesRevenue − totalTDC
needsSubsidy  = totalTDC > salesRevenue          (→ DOH dead-end)
requiresZoning = units > 5
aroTriggered   = units > 10
```

The `SfhDeal` result object carries: `totalTDC`, `salesRevenue`, `loan`,
`loanBinding` (`'construction' | 'sales'`), `equity`, `gap` (always 0 for
buildable deals; retained for display), `profit`, `needsSubsidy`,
`requiresZoning`, `aroTriggered`, `aroAffordableCount`, `marketUnits`.

### Why $2M equity always closes the gap

Across every neighborhood and unit count, the most equity any project needs
(`totalTDC − loan`) tops out around $1.7M — below the $2M budget. So a residual
"gap you can't close" never occurs for a buildable (`totalTDC ≤ salesRevenue`)
deal. Permits are granted only when the project both pencils **and** stays
by-right (≤ 5 units). The module therefore has these endings:

1. **`needsSubsidy` (TDC > sales)** → DOH dead-end. Occurs for *all* of
   Englewood and nowhere else.
2. **`requiresZoning` (more than 5 units)** → permits blocked (button greyed
   out); a zoning change is required and isn't pursued.
3. **TDC ≤ sales and ≤ 5 units** → gap closes with equity → apply for permits
   → profit.

### Worked sanity checks

| Deal | TDC | Sales | Loan (binds) | Equity | Profit | Ending |
|---|---|---|---|---|---|---|
| Jeff. Park, 1u | $500k | $1.3M | $400k (constr.) | $100k | +$800k | Permit |
| Jeff. Park, 15u | $4.5M | $9.75M (3 aff.) | $3.6M (constr.) | $900k | +$5.25M | Blocked (zoning) |
| Albany Park, 5u | $1.75M | $4.0M | $1.4M (constr.) | $350k | +$2.25M | Permit |
| Englewood, 1u | $500k | $400k | — | — | −$100k | DOH dead-end |
| Englewood, 15u | $4.5M | $4.05M (3 aff.) | — | — | −$450k | DOH dead-end |

## Modal flow

1. **Banker intro (Marcus 🏦):** explains the loan rule — the loan is the lesser
   of 80% of construction cost or 70% of sales price; the rest is the player's
   own equity, and they have $2M.
2. **Unit picker:** slider/stepper, 1–15.
3. **Live conditional notes:**
   - `units > 5` → neighborhood **alder** bubble: *"This would require a zoning
     change. It's probably not worth it."*
   - `units > 10` → **David (DOH)** badge: *"ARO kicks in — 20% of units must be
     affordable at 80% AMI."*
4. **Numbers panel + capital-stack bar:** a small dedicated 2-segment bar
   (construction loan + your equity; an empty gap segment that stays empty for
   buildable deals). Panel shows TDC, sales revenue, loan and which constraint
   binds, equity in, and profit.
5. **Footer:**
   - if `needsSubsidy` → footer button disabled; **David (DOH)** says: *"Your
     construction costs are higher than the anticipated sales price. You need
     public subsidy, but DOH doesn't have an open application for that right
     now."*
   - if `requiresZoning` (more than 5 units) → footer button disabled (greyed
     out); the alder's zoning warning already explains why.
   - otherwise → enabled **"Apply for permits →"** button.

A **Cancel / ✕** dismisses the modal and returns the player to where they were.

## Final page (permit granted)

"Apply for permits" swaps the modal to a permit-granted view:

> "You closed and got your permit in **120 days**. You built **N** single-family
> homes in {neighborhood} and walked away with **$X**."

…plus a wry one-liner about the affordable units that were given up. Buttons:
**"↻ Try a different choice"** (calls the existing `reset()`) and a secondary
close.

## Testing

Vitest unit tests for `computeSfhDeal`, covering:

- TDC tier boundaries at 1, 2, 3, 5, 6, 10, 11, 15 units.
- ARO affordable counts: 0 at ≤10, 2 at 11–14, 3 at 15; affordable units priced
  at $250k.
- Which loan constraint binds (construction vs sales) across neighborhoods.
- The `needsSubsidy` gate (all Englewood deals true; high-cost wards false).
- Profit and equity values against the worked sanity-check table.

## Decisions of record

- ARO affordable count uses `Math.floor(0.20 × units)` (so only 15 units yields
  3 affordable; 11–14 yield 2).
- Profit is simply `salesRevenue − totalTDC`; the loan is repaid from the sale
  and equity returned, financing carry ignored — acceptable for a teaching game.
- Permit timeline is a fixed 120 days, displayed only on the final page; it does
  not integrate with the main game's `monthsElapsed` counter.
