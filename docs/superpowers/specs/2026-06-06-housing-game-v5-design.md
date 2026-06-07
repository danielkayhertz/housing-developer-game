# Housing Developer Game — v5 (Design Spec)

**Date:** 2026-06-06
**Source:** `~/.claude/handoffs/housing-developer-game.md` — Known Bugs / v5 Queue (items 1–16)
**Scope:** Single coordinated v5 release shipping all 16 items, organized into 6 phases by file scope and risk. Excluded: browser playthrough verification, localStorage save, PNG result card, Spanish toggle, intro polish (deferred to v6+).

---

## Overview

v4 shipped 16 bug fixes and mechanical rebalances. Playtesting surfaced a new tight list of 16 items: a mix of narrative additions (alder framing on entitlement, per-step framing, "what happened?" popup explanations), state-plumbing bugs (header doesn't reflect shrinks, tdcDelta semantic inconsistency, shelved-vs-approved narrative mismatch), small UI labels (Lever 3 rename, abbreviation spell-out, Marcus Bell removal, David Park line addition), and two new mechanics (Increase Design Quality choice at Committee on Zoning, alder<50 / community<30 failure gates at CoZ and CoF).

The fixes cluster by target file and risk. Phase 1 is low-risk labels. Phase 2 adds the missing alder characters and fixes the live-preview hardcoding. Phase 3 is Pro Forma copy. Phase 4 root-causes two seemingly unrelated bugs (header units don't reflect shrinks; entitlement TDC spike) to a single fix in how effective units and tdcDelta are computed. Phase 5 is the biggest piece: entitlement narrative + new failure gates + the new design-quality mechanic. Phase 6 wires choice-specific narratives into the "what happened?" popups and quantizes LIHTC odds so displayed = used.

**Tech context unchanged from v4:** React 19 + Vite + TS + Zustand + Tailwind v4. Vitest in `tests/`. Visual screens in `src/screens/`, pure-function game logic in `src/game/`, content data in `src/data/`. Failure check for entitlement currently lives at the end-of-entitlement transition; v5 moves it to the committee steps themselves.

---

## Phase Groupings

| Phase | Theme | Items | Complexity |
|---|---|---|---|
| 1 | Quick wins — labels and copy removal | 3, 4, 6 | S |
| 2 | Live preview alder + character map | 2 | M |
| 3 | Pro Forma lever copy + David Park line | 2a, 2b, 5 | S |
| 4 | Effective units + tdcDelta semantic fix | 7, 11 | M |
| 5 | Entitlement narrative + failure gates + design upgrade | 8, 9, 10, 12, 14 | L |
| 6 | "What happened?" narrative + LIHTC quantization | 1, 13 | M |

Item numbers map to the v5 queue in the handoff file. Items 13/14 in the handoff map to Phase 6/5 here (different ordering by file scope).

---

## Item-by-Item Breakdown

### Phase 1 — Quick wins

#### Item 3. Rename "Lever 3 — CBO partner" → "Lever 3 — Community Partner"
**Behavior:** Label change everywhere it appears. Keep the `TooltipTerm` on "CBO" inside the body so the glossary entry still surfaces.
**Files:**
- `src/screens/ProForma.tsx` — Lever 3 header text.
- `src/screens/CapitalStack.tsx` `QapOddsSubScreen` — "CBO partner" header.
**State/type changes:** None.
**Complexity:** S

#### Item 4. Remove Marcus Bell quote from Capital Stack
**Behavior:** Delete the `<CharacterBubble characterId="marcus" line={marcusLines.capitalStackBubble} />` between the LIHTC decision card and the source grid.
**Files:** `src/screens/CapitalStack.tsx`.
**State/type changes:** `marcusLines.capitalStackBubble` constant left in `characters.ts` unused (cheap revert if needed; not load-bearing).
**Complexity:** S

#### Item 6. Spell out "alder" and "community" in Steps Taken summary
**Behavior:** Replace `α{n}` / `c{n}` abbreviations in the Past Steps grid with full words. Format: `Alder +5 · Community +12` (sign preserved, zero shown as `±0`).
**Files:** `src/screens/Entitlement.tsx` (the `pastChoices.map(...)` block ~line 222).
**State/type changes:** None.
**Complexity:** S

---

### Phase 2 — Live preview alder + character map

#### Item 2. Live preview shows correct alder per neighborhood
**Behavior:** On Site & Concept, the live preview bubble's name/emoji match the selected neighborhood's alder. All four neighborhoods read as `Alder <First> <Last>`.
**Root cause:** `SiteAndConcept.tsx` hardcodes `characterId="asha"`. The other ward alders (Carlos Reyes, Frank Kovac, Naila Hassan) exist only as `carlosLines` / `frankLines` / `nailaLines` constants — they're not in the `characters` map, so `CharacterBubble` can't render them.
**Files:**
- `src/data/characters.ts` —
  - Extend `CharacterId` union with `'carlos' | 'frank' | 'naila'`.
  - Add three entries to the `characters` map:
    - `carlos: { id: 'carlos', name: 'Alder Carlos Reyes', emoji: '📣', role: 'Alder · Pilsen' }`
    - `frank:  { id: 'frank',  name: 'Alder Frank Kovac',  emoji: '🏙️', role: 'Alder · Jefferson Park' }`
    - `naila:  { id: 'naila',  name: 'Alder Naila Hassan', emoji: '🤝', role: 'Alder · Albany Park' }`
  - The existing `asha` entry is renamed `'Asha Tran'` → `'Alder Asha Tran'` for consistency. (Keep `id: 'asha'`.)
  - The existing `reyes` character (`Ald. Reyes`, city-council fiscal reformer) stays as-is. It is *not* Carlos — `reyes` only appears in finance-committee attack lines.
  - Add helper `getNeighborhoodAlderId(n: NeighborhoodId): CharacterId` returning `'asha' | 'carlos' | 'frank' | 'naila'`.
- `src/screens/SiteAndConcept.tsx` — live preview bubble uses `getNeighborhoodAlderId(project.neighborhood)`.
**State/type changes:** `CharacterId` union widens. No game-state changes.
**Complexity:** M
**Note:** This helper is reused in Phase 5 (Item 8 — alder intro on entitlement screen) and Phase 6 (recap-narrative speaker resolution).

---

### Phase 3 — Pro Forma lever copy + David Park line

#### Item 2a. Lever 1 (Finishings & design) explanatory paragraph
**Behavior:** Below the three finish-level buttons, add an italic muted paragraph:
> "Better designs and nicer cabinets, countertops, and appliances will get you more points on the QAP and make it more likely you'll get a LIHTC award — but they also cost money."

**Files:** `src/screens/ProForma.tsx`.

#### Item 2b. Lever 2 (AMI breakdown) explanatory paragraph
**Behavior:** Below the eligibility chip ("Weighted avg ... LIHTC-eligible/ineligible"), add an italic muted paragraph:
> "The more affordable your apartments, the better your QAP score — but it will also reduce the size of the loan you can qualify for."

**Files:** `src/screens/ProForma.tsx`.

#### Item 5. Add complexity-penalty rationale to David Park intro
**Behavior:** Extend the existing `davidLines.capitalStackIntro` so the "past 5 sources, complexity penalty kicks in at ~$20k/unit per extra source" clause continues with: "…because of all the compliance and legal paperwork your staff and attorneys will need to deal with."
**Files:** `src/data/characters.ts`.
**State/type changes:** None.
**Complexity:** S (all three items together)

---

### Phase 4 — Effective units + tdcDelta semantic fix

#### Item 7. Header banner reflects current effective unit count
**Behavior:** The persistent header banner (visible across all screens) shows the actual operating unit count and TDC after any shrinkBy. Today it uses raw `project.units`, so after `redesignSmaller` or `zoning-shrink` the banner is stale.
**Root cause #1:** `Header.tsx` calls `computeTdc({ units: project.units, ... })` and prints `{project.units} units`. Neither `entitlement.projectShrinkBy` nor `gapResolution.shrinkBy` is consulted.
**Fix:**
- `src/game/proForma.ts` — add helper:
  ```ts
  export function getEffectiveUnits(state: GameState): number {
    return Math.max(
      MIN_UNITS_FLOOR,
      state.project.units - state.entitlement.projectShrinkBy - state.gapResolution.shrinkBy
    );
  }
  ```
- `src/components/Header.tsx` — replace both uses of `project.units` (display + `computeTdc` input) with `getEffectiveUnits(state)`.
- `src/game/gapResolution.ts` — `computeEffectiveGap` currently subtracts only `gapResolution.shrinkBy`. Update to subtract both via `getEffectiveUnits`.
- `src/data/closeReactions.ts` — `successReactions` uses `state.project.units - state.entitlement.projectShrinkBy`. Replace with `getEffectiveUnits(state)`.
- `src/screens/Close.tsx` — already subtracts both; verify and keep.
- `src/screens/Entitlement.tsx` — the cost-escalation preview label on choice cards (~line 297) uses raw `project.units`. Replace with `getEffectiveUnits(state)`.
**State/type changes:** None — helper only.
**Complexity:** M
**Tests:** `getEffectiveUnits` unit tests for all 4 shrink-field combos; component test that `Header` text updates after `redesignSmaller`.

#### Item 11. Entitlement TDC/gap spike fix (tdcDelta semantics)
**Behavior:** No mysterious TDC jumps mid-entitlement.
**Root cause #2:** `takeEntitlementStep` does `addCostEscalation(consequence.tdcDelta * s.project.units)`. The convention is "tdcDelta is per-unit," and JP parking choices (`30_000`, `15_000`) honor it. But `zoning-accept` set `tdcDelta = 1_400_000` (a flat total), so multiplying by 50 units adds **$70M** to cost escalation — the visible spike.
**Fix:**
- Standardize the convention: `tdcDelta` is always per-unit dollars. Add a JSDoc comment on `ChoiceConsequence.tdcDelta` documenting this.
- The only flat-total consumer is `zoning-accept`, which Phase 5 (Item 10) replaces with `zoning-design-upgrade` — a per-15%-of-hard-cost mechanic that doesn't use `tdcDelta` at all. After that change, the only remaining `tdcDelta` consumers are JP parking (`30_000` per unit) and JP traffic-data (`15_000` per unit), both already correct.
**Files:** `src/game/entitlement.ts` (comment); no behavior change needed in `takeEntitlementStep` because the per-unit semantics survive.
**Complexity:** S (depends on Phase 5 Item 10 to actually remove the misbehaving call)
**Tests:** `takeEntitlementStep('community-jp-full-parking', 2)` adds exactly `30_000 × effectiveUnits` to costEscalation (regression test guarding per-unit semantics).

---

### Phase 5 — Entitlement narrative + failure gates + design upgrade

This is the largest phase. Four sub-pieces compose:

#### Item 10. Replace "Accept conditions" with "Increase design quality" (zoning-design-upgrade)
**Behavior:** New step-3 choice that bumps hard costs 15%, alder ±0, community +10. Replaces `zoning-accept`.
**Files:**
- `src/game/types.ts` — `StepChoiceKey` union: replace `'zoning-accept'` with `'zoning-design-upgrade'`. Add `designUpgrade: boolean` to `EntitlementState` (init `false`).
- `src/game/entitlement.ts` — `ChoiceConsequence` gains optional `designUpgrade?: boolean`. `applyChoice` adds:
  ```ts
  case 'zoning-design-upgrade':
    return { ...base, alderDelta: 0, communityDelta: 10, designUpgrade: true };
  ```
  Remove the `'zoning-accept'` case.
- `src/game/state.ts` — `initialState.entitlement.designUpgrade = false`. New action `setDesignUpgrade(value: boolean)`. In `takeEntitlementStep`, if `consequence.designUpgrade` → call `setDesignUpgrade(true)`. `reset` resets it.
- Hard-cost helper — extract `effectiveHardPerUnit(state)`:
  ```ts
  HARD_COST_PER_UNIT[buildingType]
    * FINISH_MULTIPLIER[finishLevel]
    * (designUpgrade ? 1.15 : 1)
    * (lowerQualityUsed ? LOWER_QUALITY_HARD_MULTIPLIER : 1)
  ```
  Call it from `computeTdc`, `computeEffectiveGap`, `tickMonths` cost-escalation rate, and the choice-card cost-escalation preview.
- `src/screens/Entitlement.tsx` — replace the `'zoning-accept'` choice in `STEP_CHOICES[3]`:
  ```ts
  { key: 'zoning-design-upgrade', title: 'Increase design quality',
    description: "Committee imposes design upgrades — better facade, units, common spaces.",
    consequences: '±0 alder · +10 community · Hard costs +15%' }
  ```
- `src/data/closeReactions.ts` — block-club "parking concerned" branch keyed on `'zoning-accept'`: drop the choice-key check (keep only `buildingType === 'larger'` as the parking signal).
**State/type changes:** new `designUpgrade` field on `EntitlementState`; new `setDesignUpgrade` action; `StepChoiceKey` swap.
**Complexity:** M
**Tests:** `applyChoice('zoning-design-upgrade')` returns expected consequence; `computeTdc` with `designUpgrade=true` returns 15% higher hard than without; `effectiveHardPerUnit` composes correctly with `lowerQualityUsed`.

#### Item 14. Failure gates at Committee on Zoning and Committee on Finance
**Behavior:** At CoZ and CoF, after the player makes a step choice, if `alderGoodwill < 50` OR `communitySupport < 30`, the project fails immediately. Alder threshold breach → `shelved-finance`; community threshold breach → `shelved-community`. Alder is checked first.
**Files:**
- `src/game/entitlement.ts` — new helper:
  ```ts
  export function isCommitteeFailed(input: {
    alderGoodwill: number; communitySupport: number;
  }): 'alder' | 'community' | null {
    if (input.alderGoodwill < 50) return 'alder';
    if (input.communitySupport < 30) return 'community';
    return null;
  }
  ```
- `src/screens/Entitlement.tsx` — in `onChoose`, after `takeStep(...)` and the side-effect calls, read `useGameStore.getState().entitlement` and check `isCommitteeFailed` IF the step just completed was 3 or 4. On fail: `setOutcome('shelved-finance' | 'shelved-community')` then `advancePhase()` — but show the failure narrative panel first (see Item 12).
- Remove the end-of-entitlement alder<20/community<25 check inside `onComplete`. After the change, `onComplete` only runs when the project survived both committees, so the ARO check stays but the goodwill/support checks go away.
**State/type changes:** None.
**Complexity:** M
**Tests:** `isCommitteeFailed` for boundary values; component test that taking any CoZ choice when alder=45 sets outcome to `shelved-finance`.

#### Item 8. Alder intro framing at top of entitlement screen
**Behavior:** A `CharacterBubble` from the neighborhood alder, displayed once near the top of the entitlement screen (between Path pill and meters), staying visible the whole time the player is on this screen.
**Two-sentence variant:** the zoning sentence only renders when `path !== 'by-right'`. Always render the financing + community + time sentences.
- Full line (ZMA/PD):
  > "You've agreed with the Department of Housing on how to finance the project, but current zoning doesn't allow a building this big, so you'll need to get a zoning change from City Council. You'll also need Council to approve your financing. I expect you to work with the community to gain support. And of course this takes time, which can reopen your financing gap."
- Short line (by-right):
  > "You've agreed with the Department of Housing on how to finance the project. You'll need Council to approve your financing. I expect you to work with the community to gain support. And of course this takes time, which can reopen your financing gap."
**Files:**
- `src/data/characters.ts` — add `entitlementIntroLines = { withZoning: '...', withoutZoning: '...' }` (shared across alders — the framing is procedural, not personality-coded).
- `src/screens/Entitlement.tsx` — render bubble using `getNeighborhoodAlderId(neighborhood)` and the appropriate line per `path`.
**State/type changes:** None.
**Complexity:** S

#### Item 9. Per-step framing narrative
**Behavior:** Inside each active-step box, between the "▶ Step N — Name" header and the choice grid, render an italic narrative paragraph framing what's at stake. Step 1 (Pre-app) keeps its existing Asha CharacterBubble; the new framing applies to steps 2, 3, 4.

- Step 2 (Community meeting):
  > "Today the project meets the neighborhood. The block club, CBOs, and longtime residents will get the first real look. How you run this room sets the tone for everything that follows."
- Step 3 (Committee on Zoning):
  > "The zoning committee can approve or deny your zoning change—and without it, the project dies. Usually, aldermanic privilege gives your alder the deciding vote in favor — but only if you've kept their goodwill."
- Step 4 (Committee on Finance):
  > "Finance signs off on the public subsidy. Cunningham will hammer the cost-per-unit; Reyes will swing at TIF. You need the room to back you before the vote."

**Files:** `src/screens/Entitlement.tsx` (inline constants — single consumer).
**Complexity:** S

#### Item 12. Fix shelved-vs-approved narrative mismatch
**Behavior:** When a project fails at CoZ or CoF, the player must not see "the City Council passed the ordinance 41–9" before reaching the Close screen.
**Root cause:** The `allStepsComplete` block in `Entitlement.tsx` unconditionally renders the "Council vote (narrative)" panel saying the ordinance passed, before checking thresholds.
**Fix:**
- The Phase 5 Item 14 committee gates short-circuit the flow before `allStepsComplete` can render. So the existing `allStepsComplete` panel will only render for projects that passed both committees → its existing "passed 41–9" narrative stays correct.
- For the new failure case (committee gate failed), add a parallel branch in `Entitlement.tsx`:
  ```tsx
  {outcome === 'shelved-finance' && !allStepsComplete && (
    <div className="bg-bg p-4 rounded-lg text-sm">
      <b>Committee on {currentStep === 3 ? 'Zoning' : 'Finance'} (narrative):</b><br/>
      <i className="text-muted">
        With aldermanic support below the line, Ald. {alderName} pulled the ordinance.
        No vote was held. Without committee backing, the project cannot advance to Council.
      </i>
      <button onClick={() => advancePhase()} className="...">See your result →</button>
    </div>
  )}
  ```
  (Same shape for `'shelved-community'` with alternate copy: "The block club's opposition was visible enough that the alder pulled the ordinance before a vote.")
- Because the committee gate calls `setOutcome` THEN renders, the failure panel is what the player sees on the next render; they click "See your result" and `advancePhase` moves to the Close screen.
**Files:** `src/screens/Entitlement.tsx`.
**Complexity:** S
**Tests:** Component test: CoZ choice with alder=45 → failure panel renders, "passed 41–9" panel does not render.

---

### Phase 6 — "What happened?" narrative + LIHTC quantization

#### Item 1. Choice-specific narrative in RecapCard
**Behavior:** Every "what just happened" popup includes a third row: a character-narrated sentence explaining *why* the previous choice took the time it did. Speaker = the relevant alder for entitlement choices; David Park for gap-resolution actions; Janelle for LIHTC submissions; Asha for first-time CBO partner time cost on Pro Forma.

**State/type changes:**
- `src/game/types.ts` — extend `lastRecap`:
  ```ts
  lastRecap: {
    months: number;
    escalationAdded: number;
    narrative: { characterId: CharacterId; line: string } | null;
  } | null;
  ```
- `src/game/state.ts` — `tickMonths` signature becomes `tickMonths(n: number, narrative?: { characterId: CharacterId; line: string })`. If `n >= 3`, store `narrative ?? null` alongside the existing fields.

**Narrative lookup tables:**
- `src/data/characters.ts` — add `recapNarratives` keyed by choice key OR a small set of system events (`'lihtcSubmit'`, `'lihtcResubmit'`, `'cboFirstTime'`, `'cutCostsExit'`). Each entry is `{ defaultSpeaker: CharacterId, line: string }`. For entitlement choices the "default" speaker is overridden at runtime to the neighborhood's alder via `getNeighborhoodAlderId(state.project.neighborhood)`.
- A helper `resolveRecapNarrative(state, key): { characterId, line } | null` lives in `data/characters.ts`. Returns null if no narrative is registered for that key (so missing keys fail silent — popup renders without the third row).

**Call-site updates:**
- `takeEntitlementStep` — call `resolveRecapNarrative(state, choice)` and pass result into `tickMonths(months, narrative)`.
- `applyGapAction` — same pattern with action keys (`'askSubsidy'`, `'redesignSmaller'`, `'lowerQuality'`).
- `submitLihtc` / `resubmitLihtc` / `reviseLihtc` — `'lihtcSubmit'` / `'lihtcResubmit'` / `'lihtcRevise'`.
- `setCboPartner(true)` first-time (the +6 mo path) — `'cboFirstTime'`.
- `CutCostsSubScreen` exit (+3 mo) — `'cutCostsExit'`.
- `QapOddsSubScreen` (+12 mo on resubmit) — already routed through `reviseLihtc`.

**RecapCard render update:**
```tsx
{lastRecap.narrative && (
  <div className="mt-3 border-t border-line pt-3 text-xs text-muted">
    <b>{characters[lastRecap.narrative.characterId].emoji} {characters[lastRecap.narrative.characterId].name}:</b>
    <i> {lastRecap.narrative.line}</i>
  </div>
)}
```

**Files:**
- `src/game/types.ts`, `src/game/state.ts`, `src/data/characters.ts`, `src/components/RecapCard.tsx`.
- Caller-update sites: `takeEntitlementStep`, `applyGapAction`, `submitLihtc`/`resubmitLihtc`/`reviseLihtc`, `setCboPartner`, `CapitalStack.tsx` `onExitCutCosts`.
**Complexity:** M
**Tests:** `tickMonths(9, narrative)` sets `lastRecap.narrative`; `tickMonths(9)` without arg leaves it null; `tickMonths(2, narrative)` does NOT set `lastRecap` (under threshold); RecapCard component test for both narrative-present and narrative-absent cases.

#### Item 13. LIHTC odds quantization (audit + minor fix)
**Behavior:** The percentage shown on the Capital Stack page IS the probability used by the random draw — no sub-percent drift.
**Audit finding:** Today's math is correct in spirit but the displayed value is `(odds * 100).toFixed(0)` (e.g., "39%") while the actual roll uses the unrounded float (e.g., 0.385). Sub-1% discrepancy. Players experiencing "feels lower than shown" is more likely small-sample randomness, but quantizing display = used closes the audit definitively.
**Fix:** In `src/game/capitalStack.ts`:
```ts
export function computeQapScore(state: GameState): { score: number; odds: number } {
  if (!state.project.neighborhood) return { score: 0, odds: 0 };
  const score = computeLihtcScore({ ... });
  const rawOdds = estimatedAwardProbability(score);
  const odds = Math.round(rawOdds * 100) / 100; // quantize to whole-percent so display = used
  return { score, odds };
}
```
**Files:** `src/game/capitalStack.ts`.
**State/type changes:** None.
**Complexity:** S
**Tests:** `computeQapScore(state).odds * 100` is an integer for representative states; `Number.isInteger(odds * 100)` always true.

---

## Cross-cutting Architectural Notes

- **`getEffectiveUnits(state)` helper** in `src/game/proForma.ts` becomes the single source of truth for "operating unit count" — used by `Header`, `computeEffectiveGap`, `closeReactions`, and the entitlement cost-escalation preview.
- **`effectiveHardPerUnit(state)` helper** in the same file becomes the single source of truth for "per-unit hard cost after all multipliers" — used by `computeTdc`, `computeEffectiveGap`, `tickMonths`, and the entitlement choice-card preview.
- **`getNeighborhoodAlderId(neighborhood)` helper** in `src/data/characters.ts` is reused across Phase 2, Phase 5 (Item 8 + Item 12), and Phase 6 (recap-narrative speaker resolution).
- **`StepChoiceKey` migration:** `'zoning-accept'` → `'zoning-design-upgrade'`. Update existing tests; do not preserve a backwards-compat shim.
- **End-of-entitlement check removal:** `onComplete` no longer checks `alderGoodwill < 20` or `communitySupport < 25`. Those failure paths are now reached only via the committee gates in Phase 5 Item 14. The ARO floor check (`affordableShare < ARO_FLOOR_AFFORDABLE_SHARE`) stays in `onComplete`.
- **`tdcDelta` convention:** documented as per-unit dollars in `ChoiceConsequence` JSDoc. JP parking choices honor it. `zoning-accept` (which violated it) is replaced.
- **`tickMonths` signature widens** to take optional narrative — all existing call sites continue to work without modification, but the entitlement / gap / LIHTC / CBO call sites are updated to supply narrative.

---

## Test Strategy

The project has 231 tests passing pre-v5. v5 adds ~20-25 new tests, organized by phase:

| Phase | New tests |
|---|---|
| 1 | None (label-only) |
| 2 | `getNeighborhoodAlderId` returns right id for each neighborhood; new character entries exist with non-empty name/emoji; SiteAndConcept renders correct name per neighborhood |
| 3 | `davidLines.capitalStackIntro` contains new phrase; ProForma renders Lever 1/2 paragraphs and "Community Partner" header |
| 4 | `getEffectiveUnits` covers 4 shrink combos and floors at `MIN_UNITS_FLOOR`; Header text updates after `redesignSmaller`; `takeEntitlementStep('community-jp-full-parking', 2)` adds `30_000 × effectiveUnits` to costEscalation |
| 5 | `applyChoice('zoning-design-upgrade')`; `isCommitteeFailed` boundary tests; `computeTdc` with `designUpgrade=true` is 15% higher hard; CoZ failure with alder=45 sets outcome correctly; by-right path hides zoning sentence in intro bubble; per-step framing renders for steps 2/3/4; failure narrative panel renders when shelved-finance after CoZ |
| 6 | `tickMonths(9, narrative)` populates `lastRecap.narrative`; `tickMonths(2, narrative)` does not set `lastRecap`; RecapCard renders narrative bubble when present, omits when null; `computeQapScore` returns odds that are integer percents |

**Regressions:** Existing entitlement tests referencing `'zoning-accept'` or the end-of-entitlement alder/community threshold checks must be updated to match new behavior, not skipped. After each phase commit, full `npm test` must pass before advancing.

---

## Build Order

1. **Phase 1** — three independent label/copy edits; commit each separately to keep diff readable. Run tests after the cluster.
2. **Phase 2** — character map additions + helper + SiteAndConcept consumer. Single commit.
3. **Phase 3** — two ProForma paragraphs + David Park line. Single commit.
4. **Phase 4** — `getEffectiveUnits` helper, then thread through all consumers. Test header behavior. Single commit.
5. **Phase 5** — sub-order: (a) `designUpgrade` plumbing + new choice; (b) `isCommitteeFailed` + remove end-check + failure panel; (c) alder intro framing; (d) per-step framing. Commit per sub-step. The riskiest piece is the committee gate; that goes through review before alder/step framing lands.
6. **Phase 6** — `lastRecap` type extension + `tickMonths` signature + narratives table, then thread through call sites, then RecapCard render. LIHTC quantization is independent — can land first or last in phase. Single commit per piece.

Each phase commit must leave the build green (`tsc -b && vite build` clean, `npm test` all green) before the next begins.
