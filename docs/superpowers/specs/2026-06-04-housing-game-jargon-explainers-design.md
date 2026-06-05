# Housing Developer Game — Jargon Explainers (v3) — Design

**Date:** 2026-06-04
**Spec:** 2 of 2 in the v3 set. Companion spec: Content Expansion (designed in parallel).
**Status:** Draft for implementation
**Base branch:** `main` at the v2 Polish & Mechanics shipped state. Can ship before, after, or alongside Content Expansion — no code conflicts expected.

---

## Purpose

The game is dense with industry jargon — LIHTC, QAP, DSCR, AMI, TDC, TIF, HED Bond, CDBG, HOME, IAHTC, ZMA, PD, by-right, CBO, ARO, NOI, density variance. Marcus and David Park explain a couple via character dialogue; most are used assuming the player already knows them.

This spec adds **two complementary affordances**:

1. **Just-in-time tooltips** on dotted-underlined terms. Hover (desktop) or tap (mobile) for a definition + game-context block.
2. **A glossary panel** behind a "?" icon in the header. Lists all entries grouped by category. Backstop for re-lookup.

Tooltip frequency: **first instance per screen.** Fresh affordance on each new screen; no state tracking; the glossary handles re-lookup.

Tooltip content: **definition + why-it-matters-here.** The tooltip is the moment of teaching; pure definitions waste the opportunity.

## Design principle: explain at the moment of encounter

The tooltip teaches the term where the player hits it. The glossary backstops the player who blew past a tooltip and wants to look it back up. Together they require no upfront tutorial and no separate learning screen.

## Out of scope

- Persistent "seen terms" across screens or sessions (B-frequency means we don't need this)
- Multi-language tooltips (deferred to Spanish toggle spec)
- Audio pronunciations
- Customizable difficulty / tooltip-off mode for advanced players
- Tooltips on character names or alder names (out of jargon scope)
- Animation choreography beyond the standard fade-in
- Analytics events for which terms players hover most (could add later)

## Approach

Single-phase implementation:

1. **Add `data/glossary.ts`** with the 17 entries (Section 2).
2. **Build `TooltipTerm`, `GlossaryPanel`, `JargonScreenScope` components.**
3. **Wrap terms in each screen** per the integration map (Section 3).
4. **Add the "?" icon to `Header.tsx`** that opens `GlossaryPanel`.

Each step is small. The whole spec is implementable in a single working session followed by content drafting for the 17 entries.

---

## Architecture & data model

### Data: `src/data/glossary.ts`

```ts
export type GlossaryCategory = 'financial' | 'sources' | 'entitlement' | 'compliance';

export interface GlossaryEntry {
  term: string;             // canonical display, e.g. "LIHTC"
  aliases?: string[];       // alternate strings that lookup to this entry, e.g. ["9% LIHTC", "4% LIHTC"]
  expansion: string;        // "Low-Income Housing Tax Credit"
  definition: string;       // 1-sentence general definition
  inGameContext: string;    // 1-sentence "in this game…" line
  category: GlossaryCategory;
}

export const glossary: GlossaryEntry[] = [ /* 17 entries — see Section 2 */ ];

export function lookup(termOrAlias: string): GlossaryEntry | undefined {
  // case-insensitive match on term or any alias
}
```

### Component: `src/components/TooltipTerm.tsx`

```tsx
<TooltipTerm term="LIHTC">9% LIHTC</TooltipTerm>
```

Behavior:
- Renders a `<button>` (or `<span role="button" tabindex="0">`) wrapping the children.
- On **first instance** within the current `<JargonScreenScope>`: dotted-underline class applied; hover/focus opens a popover.
- On **subsequent instances** within the same scope: children render plain (no underline, no popover behavior).
- Popover content: three short blocks — `expansion`, `definition`, `inGameContext`.
- Unknown term: renders children plain; logs `console.warn` in dev mode.

Alias-aware deduping: the canonical entry key is registered in the scope, not the literal `term` prop. So `<TooltipTerm term="9% LIHTC">` after `<TooltipTerm term="LIHTC">` renders plain.

### Component: `src/components/GlossaryPanel.tsx`

- Triggered by a "?" icon button in `Header.tsx` (next to the existing `<TimelinePill />`).
- Opens as a right-side slide-over panel — 40rem wide on desktop, full-width on mobile.
- Lists all entries grouped by category headings (Financial / Sources / Entitlement / Compliance).
- Search box at the top filters entries by term + expansion + definition substring (case-insensitive).
- Closeable via close button or Escape key. Focus trap while open; focus returns to "?" trigger on close.

### Component: `src/components/JargonScreenScope.tsx`

```tsx
<JargonScreenScope>
  {/* screen content */}
</JargonScreenScope>
```

- Provides a React context with a `useRef<Set<string>>` tracking canonical term keys rendered in this scope.
- Each `<TooltipTerm>` checks-and-sets in this set on render. First adds, subsequents see existing and render plain.
- Scope is component-local; unmount/remount on screen change resets the set.

### State and files

**No state changes anywhere.** No `state.ts` edits. No `types.ts` additions. No additions to the Zustand store.

**Files added:**
- `src/data/glossary.ts`
- `src/components/TooltipTerm.tsx`
- `src/components/GlossaryPanel.tsx`
- `src/components/JargonScreenScope.tsx`

**Files edited:**
- `src/components/Header.tsx` — add "?" icon button + glossary open state
- `src/screens/IntroScreen.tsx` — wrap in `<JargonScreenScope>`
- `src/screens/SiteAndConcept.tsx` — scope wrap + term wraps (CBO, ARO)
- `src/screens/ProForma.tsx` — scope wrap + term wraps (TDC, AMI, DSCR, NOI, QAP, LIHTC)
- `src/screens/CapitalStack.tsx` — scope wrap + term wraps (TDC, LIHTC, QAP, TIF, HED Bond, CDBG, HOME, IAHTC)
- `src/screens/Entitlement.tsx` — scope wrap + term wraps (By-right/ZMA/PD, CBO, density variance)
- `src/screens/Close.tsx` — scope wrap + term wraps (AMI on impact breakdown, ARO on shelved-aro)

---

## Term inventory

The 17 entries, with category and primary first-instance surface placement.

| # | Term (canonical) | Aliases | Category | First-instance surfaces |
|---|---|---|---|---|
| 1 | LIHTC | 9% LIHTC, 4% LIHTC | sources | Pro Forma (QAP card), Capital Stack (source card) |
| 2 | QAP | Qualified Allocation Plan | sources | Pro Forma (QAP card), Capital Stack (QAP projection) |
| 3 | AMI | Area Median Income | financial | Pro Forma (slider grid label) |
| 4 | DSCR | Debt Service Coverage Ratio | financial | Pro Forma (Marcus card) |
| 5 | NOI | Net Operating Income | financial | Pro Forma (Marcus card / supportable debt panel) |
| 6 | TDC | Total Development Cost | financial | Pro Forma (TDC breakdown header), Capital Stack (gap bar) |
| 7 | TIF | Tax Increment Financing | sources | Capital Stack (source card) |
| 8 | HED Bond | Housing & Economic Development Bond | sources | Capital Stack (source card) |
| 9 | CDBG | Community Development Block Grant | sources | Capital Stack (source card) |
| 10 | HOME | HOME Investment Partnerships Program | sources | Capital Stack (source card) |
| 11 | IAHTC | Illinois Affordable Housing Tax Credit | sources | Capital Stack (source card) |
| 12 | ARO | Affordable Requirements Ordinance | compliance | Site & Concept (mixed-income intent card subtitle), Close (shelved-aro panel) |
| 13 | By-right | — | entitlement | Entitlement (path tracker) |
| 14 | ZMA | Zoning Map Amendment | entitlement | Entitlement (path tracker) |
| 15 | PD | Planned Development | entitlement | Entitlement (path tracker) |
| 16 | CBO | Community-Based Organization | entitlement | Site & Concept (CBO partner row), Entitlement (preapp-formal-cbo choice) |
| 17 | Density variance | — | entitlement | Entitlement (zoning step yellow info row, larger building only) |

### Category counts

- Financial: 4 (AMI, DSCR, NOI, TDC)
- Sources: 7 (LIHTC, QAP, TIF, HED Bond, CDBG, HOME, IAHTC)
- Entitlement: 5 (By-right, ZMA, PD, CBO, Density variance)
- Compliance: 1 (ARO)

### Content drafting

Content drafted during implementation, same convention as character dialogue in the Content Expansion spec. The spec lists the 17 slots; the implementing developer writes the `expansion · definition · inGameContext` blocks.

**Approximate word budget per entry:**
- `expansion`: 4–8 words
- `definition`: 12–20 words (one sentence, generic-but-correct)
- `inGameContext`: 12–25 words (one sentence, specific to this game's mechanics)

Total content ≈ 17 entries × ~50 words = ~850 words to draft.

### Skipped terms (intentionally)

- Walk-up / Mid-rise / Larger — building types are self-explanatory from context.
- Mixed-income — self-explanatory from the Intent card subtitle.
- Pro forma — header-level term; no shorter explanation than the screen itself.
- Capital stack — David Park explains this in his existing intro card; screen name itself.
- Gap — visually obvious from the gap-status bar.
- Hard cost / Soft cost / Contingency — labels on the TDC breakdown speak for themselves.
- Alder / Ward — Chicago civic context, not housing-finance jargon.

---

## Screen-level integration map

### Header (`src/components/Header.tsx`)

Add a "?" icon button on the right side, next to the existing `<TimelinePill />`. Button opens `<GlossaryPanel />` via local `useState`.

### Intro (`src/screens/IntroScreen.tsx`)

Wrap top-level in `<JargonScreenScope>`. Minimal jargon — possibly no `<TooltipTerm>` wraps. Scope still applied for consistency with other screens.

### Site & Concept (`src/screens/SiteAndConcept.tsx`)

- `<JargonScreenScope>` wrap.
- CBO partner row: wrap "CBO" in the row title or choice description (first occurrence).
- Intent row, mixed-income card subtitle: add a small line *"Some affordability still required under the ARO"* and wrap "ARO". This makes ARO discoverable on Site & Concept rather than only at the shelved-aro outcome.
- Build-type row: no wraps.
- Neighborhood cards: no wraps.

### Pro Forma (`src/screens/ProForma.tsx`)

- `<JargonScreenScope>` wrap.
- TDC breakdown header: wrap "TDC".
- AMI slider grid section header: wrap "AMI" on first occurrence.
- Marcus banker card: wrap "DSCR" and "NOI" on first use (lines already exist).
- QAP projection card: wrap "QAP" and "LIHTC" on first use.

### Capital Stack (`src/screens/CapitalStack.tsx`)

- `<JargonScreenScope>` wrap.
- David Park intro card: skip wrap on "capital stack" itself (it's the screen name, not jargon).
- Gap status bar: wrap "TDC" on first occurrence.
- Source cards in the grid: wrap each source acronym (TIF, HED Bond, CDBG, HOME, IAHTC) — first-instance, so each acronym is wrapped only on whichever card renders first.
- LIHTC source card: wrap "LIHTC" (alias-handling covers 9% / 4% on the same screen).
- QAP projection card: wrap "QAP".

### Entitlement (`src/screens/Entitlement.tsx`)

- `<JargonScreenScope>` wrap.
- Path tracker / status pill: wrap whichever of "By-right", "ZMA", or "PD" matches the current path. (The other two terms have no first-instance render on this screen if the path is `by-right`; the glossary covers them.)
- Step 1 (pre-app), `preapp-formal-cbo` choice description: wrap "CBO".
- Step 3 (zoning) yellow info row for larger building: wrap "density variance".

### Close (`src/screens/Close.tsx`)

- `<JargonScreenScope>` wrap.
- Impact-score breakdown: wrap "AMI" if it appears in the displayed copy.
- Shelved-ARO failure block: wrap "ARO" in the David Park line.

---

## Testing strategy

Three new test files; no updates to existing tests.

### New test files

**`tests/data/glossary.test.ts`**
- All 17 entries present with the canonical terms specified in Section 2.
- Every entry has non-empty `expansion`, `definition`, `inGameContext`, `category`.
- Categories are one of the four valid `GlossaryCategory` values.
- `lookup('LIHTC')`, `lookup('9% LIHTC')`, `lookup('4% LIHTC')` all return the LIHTC entry (case-insensitive).
- `lookup('nope')` returns `undefined`.
- Per-category counts match: financial 4, sources 7, entitlement 5, compliance 1.
- No duplicate strings across `term` + `aliases` arrays.

**`tests/components/TooltipTerm.test.tsx`**
- Renders children with dotted-underline class on first instance within a `<JargonScreenScope>`.
- Renders children plain (no underline class) on second instance within the same scope.
- Alias-aware: `<TooltipTerm term="9% LIHTC">` after `<TooltipTerm term="LIHTC">` renders plain.
- Popover contains `expansion`, `definition`, `inGameContext` blocks when first-instance.
- Unknown term renders children plain and logs a dev-mode warning.
- Keyboard-focusable; Enter opens popover; Esc closes.

**`tests/components/GlossaryPanel.test.tsx`**
- Opens when "?" icon clicked, closes when close button clicked, closes on Escape.
- Lists all 17 entries grouped under category headings.
- Search box filters entries by term + expansion + definition substring (case-insensitive).
- Entry layout includes `term`, `expansion`, `definition`, `inGameContext`.
- Focus trap: tab cycles within panel; on close, focus returns to "?" trigger.

### No updates to existing tests

Wrapping children in `<TooltipTerm>` doesn't change rendered text content. RTL queries match on text including children. Existing tests pass unchanged.

### Target

~25 new tests. Project total after both v3 specs: **~215 tests**.

---

## Edge cases worth explicit handling

1. **Term inside a character bubble or quote.** Wraps render normally within `CharacterBubble`. Quoted dialogue may contain wrappable terms; the wrap goes inside the quote.
2. **Term inside a tooltip popover.** Tooltips do **not** recurse. Text inside a `TooltipTerm` popover is not itself scanned for wrappable terms. Prevents infinite popovers.
3. **Glossary panel open + tooltip hover.** Both can be visible simultaneously. Different stacking contexts.
4. **Mobile tap behavior.** On touch devices, the dotted-underline element is a tap target. Tap opens the popover; tap anywhere else closes it. Long-press is not required.
5. **Accessibility.** `<TooltipTerm>` renders a button-equivalent element with `aria-describedby` linking to the popover. Glossary panel is a modal-ish slide-over with focus trap, Escape-to-close, and focus return.
6. **Unknown term lookup.** `<TooltipTerm term="not-a-real-term">` renders children plain, no underline, dev-mode `console.warn`.
7. **Alias collision.** Glossary test asserts no duplicates across `term` + `aliases` arrays in the static data.
8. **Screen scope unmount cleanup.** React handles the `useRef` cleanup on unmount. Navigating back via `retreatPhase` re-mounts the scope with a fresh `seenTerms` set — first-instance affordances reappear (intentional).
9. **Conditionally-rendered terms.** If a term lives in a row that only renders under certain conditions (e.g., density variance row only for larger building), the wrap doesn't fire when the row isn't rendered. Other instances elsewhere become "first-instance" as expected.

---

## Open questions

None. All design decisions resolved during brainstorming. Implementation may surface tactical questions (exact popover placement algorithm, dotted-underline color value, glossary slide-over animation timing) that the implementing developer decides inline.

---

## Acceptance criteria

A merged Jargon Explainers implementation is complete when:

- `data/glossary.ts` contains all 17 entries with non-empty `expansion`, `definition`, and `inGameContext` for each.
- `<TooltipTerm>` and `<GlossaryPanel>` render correctly: first-instance underline + tooltip on each screen; subsequent instances plain.
- "?" icon visible in the header on every screen; opens the glossary panel; panel groups by 4 categories.
- Accessibility: TooltipTerm keyboard-focusable; Esc closes both tooltip and glossary; focus returns to trigger on close.
- Mobile: tap on a TooltipTerm opens the popover; tap outside closes it.
- Manual playthrough: hover at least 5 terms across a single Englewood + mid-rise + all-affordable run; open the glossary; verify all 17 entries readable; verify alias-aware deduping ("9% LIHTC" and "LIHTC" don't both render with underlines on the same screen).
- Test suite passing at ~215 tests total; no regressions in existing tests.
- Cloudflare deploy succeeds; live URL shows the "?" icon and at least one tooltip on each screen.
