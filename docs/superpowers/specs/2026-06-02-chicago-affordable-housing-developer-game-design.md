# Chicago Affordable Housing Developer Game — Design

*Brainstormed 2026-06-02 with `superpowers:brainstorming`. Visual mockups in `.superpowers/brainstorm/`.*

## 1. Overview

A browser-based educational game in which the player takes on the role of an affordable housing developer in Chicago, working a single project from concept through financial close. The game scaffolds three real modules of practice — a simplified pro forma, the capital stack puzzle, and the entitlement process — with enough fidelity that the numbers and process steps are defensible, and enough simplification that a general-public player can finish a project in 15–20 minutes.

The game is grounded in real Chicago data: cost benchmarks from the City of Chicago Department of Housing's 2023 Q4 multifamily approvals (United Yards 1A, Lakeview Landing), the Metropolitan Planning Council / Urban Institute zoning process diagrams, and the Wyche Family Foundation's "Will the Math Work?" pro forma model.

## 2. Audience & Success Criteria

**Primary audience (in priority order):**

1. Housing advocates and the general public — civic intuition for why affordable housing is hard to build
2. Planning and policy students, early-career staff — realistic mental model of LIHTC, capital stack, and Chicago entitlement
3. Aldermanic and city staff, community board members — empathy for the developer's constraints

**Success criteria:**

- A first-time player finishes a single project in 15–20 minutes
- The player walks away understanding *why the stack is the puzzle* — that the bank loan barely matters and that the gap is structural
- The numbers are defensibly realistic; a policy student or DOH staffer could play without cringing
- The game runs on any modern browser; no install, no account

## 3. Game Loop & Screen Flow

Linear flow through **six screens**. A **persistent deal-sheet strip** appears at the top of every gameplay screen, showing project tagline, live status of Pro Forma / Stack / Entitlement, year-counter, and current phase.

| # | Screen | Player time | Purpose |
|---|---|---|---|
| 1 | Intro | ~30 s | Set tone; one CTA: *Start a project.* |
| 2 | Site & Concept | ~3 min | Player picks neighborhood, building type, unit count, intent |
| 3 | Pro Forma | ~4 min | TDC built bottom-up; player tunes finishings + AMI mix + market units; sees the gap |
| 4 | Capital Stack | ~5 min | Assemble 5–7 funding sources to close the gap |
| 5 | Entitlement | ~4 min | 4 active steps + narrative Council vote |
| 6 | Close / Score | ~1 min | Shareable result card and restart CTA |

**Module interfaces** (so each screen can be built and tested independently against fixtures):

```
Site & Concept → Pro Forma:    { neighborhood, units, buildingType, intent }
Pro Forma      → Capital Stack: { tdc, hardCost, landCost, softCost, noi,
                                  supportableHardDebt, gap, weightedAvgAmi,
                                  lihtcEligible, finishLevel }
Capital Stack  → Entitlement:   { sources, totalCommitted, gapClosed,
                                  daysSpent, alderGoodwillUsed,
                                  complexityPenalty, lihtcWon }
Entitlement    → Close:         { entitlementOutcome, conditionsImposed,
                                  alderGoodwillFinal, communitySupportFinal,
                                  projectShrinkBy, escalationAccrued }
```

## 4. Module — Site & Concept

Player makes **four choices** that lock in everything downstream. A live preview pane shows what each choice implies.

**Choice 1 — Neighborhood (4 presets).** Each ships with a base land cost per unit, market rent baseline, default zoning category, alder personality, and community dynamics shorthand. All four are Connected Communities Ordinance–eligible (TOD), so CCO is not a differentiator.

| Neighborhood | Profile | Land $/u | Mkt rent /mo | Alder |
|---|---|---|---|---|
| Englewood | South Side, disinvested, low cost, supportive alder | ~$12k | ~$1,150 | 🟢 |
| Pilsen | Gentrification pressure, displacement central in community input | ~$60k | ~$2,100 | 🟡 |
| Lakeview | North Side hot market, neighbors push back hard on density | ~$110k | ~$2,900 | 🟡 |
| Albany Park | NW Side, immigrant-heavy, multilingual engagement essential | ~$55k | ~$1,800 | 🟡 |

**Choice 2 — Unit count.** Slider, **40–100**, default 60. This is serious multifamily, not infill.

**Choice 3 — Building type (3 options).**

- **Walk-up** (2–3 story, no elevator) — at this scale, usually triggers a Planned Development; surfaces an accessibility concern at community/alder feedback in Section 7. Warnings do NOT appear on this screen; they emerge during gameplay.
- **Mid-rise** (4–5 story, elevator) — most flexible
- **Larger** (6–8 story) — Planned Development required

**Choice 4 — Intent toggle** — *all-affordable* (LIHTC-style) vs. *mixed-income*. Determines whether the player can add market units in the Pro Forma.

**Live preview pane** shows ranges (not exact values) for TDC, gap, zoning category needed, entitlement path, and a one-line greeting from the named alderperson.

**No ARO mention.** All project profiles are designed to exceed ARO minimums. ARO acts as a hidden floor in the Pro Forma's AMI mix slider — the player can't go below the ARO minimum for their scale and neighborhood.

## 5. Module — Pro Forma

**TDC built bottom-up** from three independent components:

- **Land cost** comes from the neighborhood ($12k/u in Englewood … $110k/u in Lakeview)
- **Hard construction cost** comes from the building typology AND the player's finishings choice:
  - Walk-up baseline: ~$470k/u; Mid-rise: ~$560k/u; Larger: ~$620k/u
  - Basic finishings: −10% on hard; Standard: baseline; Elevated: +15%
- **Soft costs**: ~27% of hard; **Contingency**: ~5% of hard

This produces a per-unit TDC in the **$700k–$920k** range, benchmarked against DOH 2023 Q4 examples (United Yards 1A at $827k/u; Lakeview Landing at $826k/u).

**Pro forma math mirrors Wyche.** NOI = (Gross potential rent × (1 − vacancy)) × (1 − opex ratio); supportable debt is the lesser of DSCR-limited and LTV-limited amounts. Same formulas, no new math. Differences from Wyche:

- Cost-per-unit is no longer a free input — it's derived
- "Developer equity" lever is removed; in real LIHTC deals the developer's cash equity is effectively zero, and the closest analog (deferred developer fee) lives in the Capital Stack
- 60% AMI rents are locked to the published HUD limit for the metro

**Player levers — three plus an advanced disclosure.**

1. **Finishings & design** (Basic / Standard / Elevated). Bleeds into operating cost, vacancy, lease-up, and community/alder reception in Section 5 ("a building this community deserves" vs. "another cheap-looking box").
2. **Affordable AMI breakdown** — sliders for # of units at 30% / 50% / 60% / 80% AMI. Live calculation of weighted average. **LIHTC warning** if weighted average > 60% AMI ("This project would lose 9% LIHTC eligibility — IHDA caps the average affordable AMI at 60% for credits"). ARO floor still enforced.
3. **Market units** — only available if "mixed-income" was chosen at Site. Slider for # of market units; more market = higher NOI = smaller gap = lower affordability score.
4. **Advanced disclosure** — opex ratio, vacancy, DSCR, cap rate, interest rate visible if the player opens it. Defaults are defensible.

**Character: Marcus the banker** reacts to which constraint is binding. The script for DSCR-limited LIHTC deals is essentially: *"My loan barely matters here. Go see IHDA and DOH and the alder about TIF."* This is the right pedagogical punchline.

**The gap is structural.** No combination of pro forma tweaks closes the gap — that's the lesson. Closing the gap is the next module's puzzle.

## 6. Module — Capital Stack

The actual puzzle. The player assembles 5–7 funding sources from a palette of **12** to close the ~$40M gap, navigating real-world rules and tradeoffs.

### 6.1 Sources (12)

| Source | Amount | Days | Notes |
|---|---|---|---|
| 9% LIHTC equity | ~$22M | **280** | Competitive IHDA round; ~20% statewide win rate |
| 4% LIHTC + tax-exempt bonds | ~$13M | 200 | Mutually exclusive with 9% LIHTC |
| DOH loan (city soft loan, 0–3%) | $3–7M | 45 | Reliable for projects in DOH priority areas |
| IHDA Multifamily Loan | $2–6M | 45 | State soft debt; pairs well with LIHTC |
| TIF funds | $3–8M | **90** | Requires alder support and DPD recommendation; political |
| HED Bond (Housing & Economic Dev) | $2–10M | **90** | Council vote; **>$5M triggers additional vote**; uses alder goodwill |
| CDBG | $1–5M | 45 | Federal block grant via DOH; sticky compliance |
| Federal HOME | $1–3M | 45 | Modest; long-term affordability lock |
| IL Donation Tax Credits (IAHTC) | $200–800k | 45 | State donation tax credit; small but clean |
| Private philanthropy | $100–500k | 45 | Foundation / mission-driven |
| Bank loan | (Pro Forma supportable) | 60 | At close; small for affordable deals |
| Deferred developer fee | up to ~3% TDC | 0 | Structural choice; capped |

Days represent application turnaround per source, not the broader calendar clock.

### 6.2 LIHTC mechanic

LIHTC is **scored, not granted**. Before applying, the player sees a **QAP score** (0–100) computed from their project profile, decomposed into contributions: affordability depth, community partner, leverage of other funds, geographic priority, sustainability, and a base. The score maps to an **estimated award probability**, with a ~20% statewide baseline.

Player's choices:
- **Submit now** — gamble on this IHDA round
- **Strengthen the application** — +12 months but improves QAP score (deepen affordability, line up CBO partner, secure other commitments first)
- If denied → reapply next round → +12 months AND a cost-escalation tick

This is the highest-stakes choice in the Stack: largest single source, longest delay if denied.

### 6.3 Cost escalation is the clock

No hard deadline. **Construction costs rise ~5%/year**, so every year of delay reopens the gap. The persistent strip shows current TDC and escalation accrued. Real projects take 2–4 years; the player feels that pressure through the math.

### 6.4 Complexity penalty (Terner Center)

**Each source past 5 adds $20k/unit in soft costs.** At 60 units that's **$1.2M per additional source.** Source 6 might still pay for itself; source 7 often doesn't; source 8 almost never does. Sweet spot is 5–6.

This penalty is the central tradeoff in the puzzle — players want to layer many sources to fill the gap, but the math turns against them past 5.

### 6.5 Cross-resource constraints

- 9% and 4% LIHTC are mutually exclusive
- TIF requires alder support, **consumes goodwill** that the player will need in Entitlement
- HED Bond requires Council vote, also consumes alder goodwill; >$5M triggers a second vote (more goodwill)
- HOME and CDBG impose federal compliance constraints that affect design and tenant selection
- IHDA wants to see a coherent stack before committing — *order matters*

### 6.6 Characters

- **Janelle (IHDA)** — QAP scoring, stack coherence, suggests moves
- **David (DOH)** — explains DOH loan and federal sources, flags compliance

## 7. Module — Entitlement

The political phase. Path is determined automatically by upstream choices. Four active steps + a narrative Council beat.

### 7.1 Path

Filed automatically based on project size and building type:
- **Zoning Map Amendment** (typical for 40–100 unit mid-rise; RT-4 → RM-5 for Englewood, etc.)
- **Planned Development** (triggered by walk-up at this scale, by larger building type, or by community pressure that pushes the alder to require PD)
- **By-right** (rare for affordable at this scale; would skip Committee/Council)

**Parking variances are not needed** under current Chicago zoning law for our project profiles. No parking-variance choice surfaces.

### 7.2 Two political meters

- **Alder goodwill** (0–100, starts ~75). Spent during Stack on TIF/HED Bond asks. Drained in Entitlement by choices the player makes.
- **Community support** (0–100). Built by Pro Forma choices (Standard/Elevated finish, deep AMI mix) and Entitlement choices.

### 7.3 Four player-active steps + narrative Council

| # | Step | Choices |
|---|---|---|
| 1 | Pre-app intake | Quiet alder meeting · Formal w/ CBO partner · Public pre-launch w/ press |
| 2 | Community meeting | Data-led · Story-led · Coalition-led |
| 3 | Committee on Zoning | Hold the line · **Shrink the project** · Accept conditions |
| 4 | Committee on Finance | Reframe the cost · Concede TIF/HED reduction · Bring stakeholders |
| – | Council vote | *Narrative beat only — no player choice* |

Each step adjusts the meters; some steps adjust the project itself.

**Shrink-the-project mechanic (Step 3).** Slider lets the player concede 0–20 units in response to NIMBY testimony at Committee on Zoning. Reduces TDC, lowers impact score, gains community support, costs some alder goodwill. The biggest single tradeoff in Entitlement.

**Committee on Finance (Step 4).** The stack faces three classic Chicago attacks, each from a named alder, each conditional on the stack composition:

- *"It's too expensive"* — fiscal hawk (Powell), always fires
- *"TIF is corrupt"* — TIF reformer (Reyes), only fires if TIF in stack
- *"HED money should be in my ward"* — other-ward alder (Chen), only fires if HED Bond in stack

Player response options:
- **Reframe the cost** — defend on per-unit-of-impact terms (CHA replacement is $1.1M/u; market product trades at $400/sf). Cheap, risky.
- **Concede TIF/HED reduction** — defuse the attack; reopens the gap by the conceded amount; may push past 5 sources (+$1.2M complexity penalty).
- **Bring stakeholders** — coalition testimony works but burns community support.

**Council vote** is procedural narrative after Committee approval: *"On a Wednesday in March, the City Council passed the ordinance 41–9. Asha posted on Instagram from the floor."* No player choice.

### 7.4 Walk-up accessibility flag

Only surfaces if the player picked walk-up at Site & Concept. Appears at Step 2 (community meeting) and Step 4 (Committee testimony). Mid-rise and Larger never trigger this flag.

### 7.5 Failure modes

Default thresholds (tunable in playtest):

- Goodwill < 20 → alder withdraws support; +6–12 months; retry path
- Community support < 25 → Committee on Zoning fails; +6–12 months
- Coalition fractures at Committee on Finance → +12+ months; may require pre-Committee stack revisions

Each failure adds time, which means cost escalation, which means a bigger gap.

## 8. Module — Close / Score

### 8.1 Scoring formula

**Impact score = Σ(affordable units × depth multiplier)**, only counted if the deal **closes** (binary gate).

| AMI band | Multiplier |
|---|---|
| 30% | ×4 |
| 50% | ×2.5 |
| 60% | ×1.5 |
| 80% | ×1 |

Final weights to be tuned in playtesting.

### 8.2 Close screen contents

1. **Outcome banner** — "You closed" or shelved-narrative, year of close, one-line summary
2. **Sharable result card** (centerpiece, designed to screenshot well):
   - Auto-generated project name (e.g., "The Englewood Mid-rise")
   - Units, weighted avg AMI, final TDC, $/unit
   - Affordability breakdown bar
   - Final capital stack bar (including cost-escalation slice)
   - 4-beat journey narrative pulled from the player's actual choices
3. **How you compare** strip — impact percentile, time vs. median, complexity vs. sweet spot. Hard-coded comparison points for MVP; real telemetry later.
4. **Three CTAs** — Try a different choice (restart, parameters remembered) · Share result · Read more (Wyche essay, MPC report, DOH report)

### 8.3 Failure variants

Four distinct narratives:
- **Stack never closed** — cost escalation killed it
- **Committee on Finance failed** — political coalition broke
- **Alder withdrew** — burned too much goodwill
- **Community meeting collapsed** — engagement strategy didn't land

Each suggests a different retry strategy.

## 9. Visual Language

**Palette** (lifted from Wyche, extended):

```
bg          #f7f5f0   warm cream
panel       #ffffff
ink         #1b1d1c
accent      #2f5d62   deep teal
debt        #3b6ea5   blue
equity      #5f8a4f   green
gap/risk    #c0455a   warm red
caution     #c98a1b   amber
line        #e3ddd2   soft beige border
```

**Typography.** Georgia serif for h1 and big numbers; system sans for UI, labels, body. Tabular numerals for money tables.

**Layout patterns.** Max width 1080px, generous padding (32px / 20px mobile). Card-based: white panels on cream bg, soft shadows, 10–14px radius. Persistent header strip on every gameplay screen. 200ms slide transitions between phases.

**Characters — emoji + name + role.** No commissioned art for MVP.

| | Character | Role |
|---|---|---|
| 🏦 | Marcus | Banker — sizes hard debt, advises on stack adequacy |
| 🏛️ | Janelle | IHDA reviewer — QAP scoring, stack coherence |
| 🏛️ | David | DOH analyst — DOH loan, federal compliance |
| 🧑‍💼 | Asha Tran | Player's alderperson (Englewood) |
| ⚖️ | Ald. Powell | Fiscal hawk — "too expensive" at Finance |
| 📣 | Ald. Reyes | TIF reformer — appears only if TIF in stack |
| 🏢 | Ald. Chen | Other-ward alder — appears only if HED Bond in stack |

**Character dialog UI.** Soft cream bubble, character emoji + name, short italicized line. "Whisper" variant for private hints from Asha.

**Icons.** Lucide React for UI elements (Building, DollarSign, Users, AlertTriangle, etc.); emoji for character avatars and funding source icons.

## 10. Tech Architecture

**Stack:** React 19 + Vite + TypeScript + Tailwind v4 + Zustand + Lucide React. No backend. Static deploy to **Cloudflare Pages** (matching the planned target for Chicagoland Explorer). Same stack family as Chicagoland Explorer and vernacular-architecture.

**Save state.** localStorage for in-progress save (optional MVP, definitely v2). No accounts.

**Analytics.** Lightweight, privacy-respecting (Plausible or Umami) — counts plays, completion rate, choice frequencies. No PII, no cookies. Powers the future "how you compare" feature with real telemetry.

**Result card download.** `html-to-image` library for PNG export of the sharable card (stretch, not MVP).

**Project structure:**

```
src/
  data/
    neighborhoods.ts    // 4 neighborhoods + their profiles
    sources.ts          // 12 funding sources w/ rules
    characters.ts       // dialog by phase + state
    aro.ts              // ARO floor lookup
    amiRents.ts         // HUD AMI rent limits
  game/
    state.ts            // Zustand store
    proForma.ts         // pure math; mirrors Wyche
    capitalStack.ts     // eligibility, complexity penalty, gap update
    entitlement.ts      // path resolution, meters, choices
    scoring.ts          // impact formula
  screens/
    IntroScreen.tsx
    SiteAndConcept.tsx
    ProForma.tsx
    CapitalStack.tsx
    Entitlement.tsx
    Close.tsx
  components/
    Header.tsx          // persistent deal-sheet strip
    StackBar.tsx
    Meter.tsx
    CharacterBubble.tsx
    SourceCard.tsx
    ChoiceCard.tsx
  App.tsx               // phase router
```

**Core state shape (Zustand):**

```ts
type GameState = {
  phase: 1 | 2 | 3 | 4 | 5 | 6
  daysElapsed: number       // application days
  yearsElapsed: number      // calendar (drives cost escalation)
  costEscalation: number    // % accrued

  project: {
    neighborhood: NeighborhoodId
    units: number
    buildingType: 'walkup' | 'midrise' | 'larger'
    intent: 'all-affordable' | 'mixed-income'
  }

  proForma: {
    amiBreakdown: Record<AmiBand, number>
    marketUnits: number
    finishLevel: 'basic' | 'standard' | 'elevated'
    opexRatio: number
    // computed:
    tdc: number; noi: number;
    supportableHardDebt: number; gap: number
    weightedAvgAmi: number
    lihtcEligible: boolean
  }

  stack: {
    awarded: SourceAward[]
    applied: SourceApplication[]
    lihtcScore: number; lihtcOdds: number
    sourceCount: number       // for complexity penalty
    complexityPenalty: number
  }

  entitlement: {
    currentStep: 1 | 2 | 3 | 4
    pastChoices: StepChoice[]
    alderGoodwill: number
    communitySupport: number
    conditionsImposed: string[]
    projectShrinkBy: number
  }

  outcome?: 'closed' | 'shelved-stack' | 'shelved-finance'
            | 'shelved-alder' | 'shelved-community'
}
```

**Pure-function modules** (each unit-testable against fixtures):

- `proForma.ts` — Wyche math + bottom-up TDC build
- `capitalStack.ts` — eligibility checks, complexity penalty, gap update, LIHTC scoring
- `entitlement.ts` — phase resolver, meter math, choice consequences
- `scoring.ts` — impact formula

## 11. MVP Scope vs. Stretch

### MVP — ship-it-when-it-works

- All 6 screens with persistent strip
- **1 fully implemented neighborhood: Englewood** (other 3 stubbed with "coming soon")
- **Mid-rise only** as building type (walk-up & larger stubbed)
- **All-affordable mode only** (mixed-income stubbed)
- All 12 funding sources with eligibility, days, complexity penalty
- LIHTC QAP scoring + probability + apply-now/strengthen mechanic
- Cost escalation calc
- 4-step Entitlement with alder/community meters
- Close screen with score, capital stack, journey beats, restart CTA
- **2 characters fully voiced:** Marcus (banker) and Asha (alder); others have minimal lines
- Emoji + CSS aesthetic; Lucide for UI icons
- Static deploy to Cloudflare Pages; no save state (in-memory only)
- Plausible/Umami analytics

**MVP principle:** *One playable polished neighborhood beats four half-done ones.* Englewood first because its profile (low cost, supportive alder, LIHTC-friendly) gives the player a fighting chance to feel a "win" on first play, which the educational hook requires.

### Stretch — v2 and beyond

- Remaining 3 neighborhoods (Pilsen, Lakeview, Albany Park) with their own alders and community voices
- Walk-up + Larger building types with their unique events (accessibility, PD trigger)
- Mixed-income mode with market unit slider
- All 3 finish tiers fully wired
- Full character cast (Janelle, David, Powell, Reyes, Chen, named community voices)
- Animated dialog beats & phase transitions
- Sharable result card as PNG download (`html-to-image`)
- localStorage save / resume
- Spanish-language toggle
- In-context educational sidebar (jargon explainers for LIHTC, ARO, TIF, etc.)
- Real "how you compare" telemetry sourced from Plausible event data

## 12. Open Questions (deferrable)

- Should the result card include a "Made with" attribution to IFE / Wyche / MPC? (Brand decision deferred to MVP launch.)
- Domain for hosting (e.g., chicago-housing-developer.pages.dev, or a custom subdomain)?
- Do we want a "playtest with cost numbers we picked" disclaimer in the footer linking to the DOH report?

## 13. References

- City of Chicago Department of Housing, *Full Report 2023 Q4*, pages 23–27 — capital stack examples for United Yards 1A (51 units, $42.2M TDC, $827k/u) and Lakeview Landing (37 units, $30.6M TDC, $826k/u)
- Wyche Family Foundation, *Will the Math Work? — An Affordable Housing Pro Forma Calculator* (housing.thewychefamily.com) — pro forma math model
- Metropolitan Planning Council / Urban Institute, *Chicago Zoning Process Diagrams* (Jan 2024) — simplified zoning, full zoning processes, and additional regulations
- Terner Center for Housing Innovation — research finding that each capital source past 5 adds ~$20k per unit in soft costs
