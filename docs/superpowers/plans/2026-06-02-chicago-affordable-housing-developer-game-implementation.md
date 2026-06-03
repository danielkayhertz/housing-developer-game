# Chicago Affordable Housing Developer Game — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an MVP browser game where a player works one Chicago affordable housing project from concept to financial close in 15–20 minutes, with one fully-implemented neighborhood (Englewood), 12 funding sources, a 4-step entitlement phase, and an impact-weighted scoring system.

**Architecture:** React 19 single-page app with linear screen flow driven by a `phase` field in a central Zustand store. Pure-function modules (`proForma`, `capitalStack`, `entitlement`, `scoring`) hold all game math and rules; UI components subscribe to store slices and render. No backend. Static deploy.

**Tech Stack:** React 19, Vite, TypeScript, Tailwind v4, Zustand, Lucide React, Vitest. Cloudflare Pages for deploy. Plausible for analytics.

**Spec:** `docs/superpowers/specs/2026-06-02-chicago-affordable-housing-developer-game-design.md`

---

## File Structure

```
src/
  data/
    neighborhoods.ts    // 4 neighborhoods (Englewood fully fleshed; others marked stub)
    sources.ts          // 12 funding sources w/ rules & metadata
    characters.ts       // dialog lookups by phase/state
    aro.ts              // ARO floor lookup by units × neighborhood
    amiRents.ts         // HUD AMI rent limits (Chicago FY24)
  game/
    types.ts            // shared types & constants
    state.ts            // Zustand store + actions
    proForma.ts         // pure math; mirrors Wyche w/ bottom-up TDC
    capitalStack.ts     // eligibility, complexity penalty, gap update, LIHTC scoring
    entitlement.ts      // path resolution, meters, choice consequences
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
  main.tsx              // Vite entry
  index.css             // Tailwind + theme
tests/
  game/
    proForma.test.ts
    capitalStack.test.ts
    entitlement.test.ts
    scoring.test.ts
```

Each `game/*.ts` module exports pure functions that take state and return new state or computed values — no side effects, no React, fully unit-testable against fixtures.

---

## Phase 1 — Project Scaffolding

### Task 1: Vite + React 19 + TypeScript scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`

- [ ] **Step 1: Initialize Vite project**

Run from project root (`C:/Users/bpi/Documents/Claude Code/Housing Developer Game`):

```bash
export PATH="/c/Users/bpi/tools/node-v22.14.0-win-x64:$PATH"
npm create vite@latest . -- --template react-ts
```

When prompted to overwrite or proceed in non-empty directory, choose `Ignore files and continue`.

Expected: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/` skeleton created.

- [ ] **Step 2: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` populated, `package-lock.json` created. No errors.

- [ ] **Step 3: Verify dev server runs**

```bash
npm run dev
```

Expected: Vite starts on `http://localhost:5173`. Visit it; see the default Vite + React landing page. Stop with Ctrl+C.

- [ ] **Step 4: Replace App.tsx with minimal placeholder**

Replace `src/App.tsx` contents:

```tsx
export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-2xl">Chicago Affordable Housing Developer</h1>
    </div>
  );
}
```

Delete `src/App.css` (we'll use Tailwind instead).

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "scaffold: Vite + React 19 + TypeScript"
```

---

### Task 2: Tailwind v4 setup with theme palette

**Files:**
- Modify: `package.json` (add Tailwind deps)
- Create: `src/index.css` (Tailwind imports + theme)
- Modify: `vite.config.ts` (Tailwind v4 Vite plugin)

- [ ] **Step 1: Install Tailwind v4**

```bash
npm install -D tailwindcss@next @tailwindcss/vite@next
```

Expected: tailwindcss and @tailwindcss/vite installed.

- [ ] **Step 2: Wire Tailwind into Vite**

Replace `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

- [ ] **Step 3: Set up index.css with theme**

Replace `src/index.css`:

```css
@import "tailwindcss";

@theme {
  --color-bg: #f7f5f0;
  --color-panel: #ffffff;
  --color-ink: #1b1d1c;
  --color-muted: #5d635f;
  --color-line: #e3ddd2;
  --color-accent: #2f5d62;
  --color-debt: #3b6ea5;
  --color-equity: #5f8a4f;
  --color-gap: #c0455a;
  --color-caution: #c98a1b;

  --font-serif: Georgia, "Times New Roman", serif;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

body {
  background: var(--color-bg);
  color: var(--color-ink);
  font-family: var(--font-sans);
}

h1, h2, h3 {
  font-family: var(--font-serif);
}

.tabular {
  font-variant-numeric: tabular-nums;
}
```

- [ ] **Step 4: Verify palette renders**

Update `src/App.tsx`:

```tsx
export default function App() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-4xl mb-4">Chicago Affordable Housing Developer</h1>
      <div className="flex gap-2 flex-wrap">
        <div className="px-3 py-2 rounded bg-accent text-white">accent</div>
        <div className="px-3 py-2 rounded bg-debt text-white">debt</div>
        <div className="px-3 py-2 rounded bg-equity text-white">equity</div>
        <div className="px-3 py-2 rounded bg-gap text-white">gap</div>
        <div className="px-3 py-2 rounded bg-caution text-white">caution</div>
      </div>
    </div>
  );
}
```

Run `npm run dev` and visit `http://localhost:5173`. Expected: see five color chips in the palette. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: Tailwind v4 + theme palette"
```

---

### Task 3: Install runtime dependencies

**Files:** Modify `package.json`

- [ ] **Step 1: Install Zustand, Lucide React**

```bash
npm install zustand lucide-react
```

Expected: both installed.

- [ ] **Step 2: Install dev/test dependencies**

```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom
```

Expected: vitest, testing-library, jsdom installed.

- [ ] **Step 3: Add test script and Vitest config**

Add to `package.json` scripts block:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

Update `vite.config.ts` to include test config:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

Add `/// <reference types="vitest" />` at the top of `vite.config.ts`.

- [ ] **Step 4: Verify test runner works**

Create `tests/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run:

```bash
npm test
```

Expected: 1 test passes.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "deps: Zustand, Lucide React, Vitest"
```

---

## Phase 2 — Type Definitions & Data

### Task 4: Core type definitions

**Files:**
- Create: `src/game/types.ts`

- [ ] **Step 1: Write the types file**

```ts
// src/game/types.ts

export type NeighborhoodId = 'englewood' | 'pilsen' | 'lakeview' | 'albany-park';
export type BuildingType = 'walkup' | 'midrise' | 'larger';
export type Intent = 'all-affordable' | 'mixed-income';
export type FinishLevel = 'basic' | 'standard' | 'elevated';
export type AmiBand = 30 | 50 | 60 | 80;
export type Phase = 1 | 2 | 3 | 4 | 5 | 6;

export type SourceId =
  | '9-lihtc'
  | '4-lihtc-bonds'
  | 'doh-loan'
  | 'ihda-loan'
  | 'tif'
  | 'hed-bond'
  | 'cdbg'
  | 'home'
  | 'iahtc'
  | 'philanthropy'
  | 'bank-loan'
  | 'deferred-dev-fee';

export interface NeighborhoodProfile {
  id: NeighborhoodId;
  name: string;
  emoji: string;
  description: string;
  landCostPerUnit: number;     // dollars
  marketRentPerUnit: number;   // monthly dollars
  alderName: string;
  alderTone: 'green' | 'yellow';
  alderGreeting: string;
  tifAvailable: boolean;
  status: 'mvp' | 'stub';
}

export interface SourceProfile {
  id: SourceId;
  name: string;
  emoji: string;
  shortDescription: string;
  daysToProcess: number;
  amountRange: { min: number; max: number } | null; // null = computed elsewhere
  alderGoodwillCost: number; // 0 unless TIF / HED Bond
  usesComplexityPenalty: boolean;
  // eligibility: returns null if eligible, or a string explaining why not
  eligibilityCheck?: (state: GameState) => string | null;
}

export interface SourceAward {
  sourceId: SourceId;
  amount: number;
  daysSpent: number;
}

export interface SourceApplication {
  sourceId: SourceId;
  amount: number;
  daysSpent: number;
  outcome: 'pending' | 'awarded' | 'denied';
}

export type EntitlementStep = 1 | 2 | 3 | 4;
export type StepChoiceKey =
  | 'preapp-quiet' | 'preapp-formal-cbo' | 'preapp-public'
  | 'community-data' | 'community-story' | 'community-coalition'
  | 'zoning-hold' | 'zoning-shrink' | 'zoning-accept'
  | 'finance-reframe' | 'finance-concede' | 'finance-stakeholders';

export interface StepChoice {
  step: EntitlementStep;
  choice: StepChoiceKey;
  alderDelta: number;
  communityDelta: number;
  tdcDelta?: number;
  shrinkBy?: number;
}

export type Outcome =
  | 'in-progress'
  | 'closed'
  | 'shelved-stack'
  | 'shelved-finance'
  | 'shelved-alder'
  | 'shelved-community';

export interface GameState {
  phase: Phase;
  yearsElapsed: number;
  costEscalation: number; // accrued dollars added to TDC

  project: {
    neighborhood: NeighborhoodId | null;
    units: number;
    buildingType: BuildingType;
    intent: Intent;
  };

  proForma: {
    amiBreakdown: Record<AmiBand, number>;
    marketUnits: number;
    finishLevel: FinishLevel;
    opexRatio: number; // 0-1
  };

  stack: {
    awarded: SourceAward[];
    applied: SourceApplication[];
    lihtcSubmitted: boolean;
    lihtcAwarded: boolean;
  };

  entitlement: {
    currentStep: EntitlementStep;
    pastChoices: StepChoice[];
    alderGoodwill: number;
    communitySupport: number;
    projectShrinkBy: number;
    conditionsImposed: string[];
  };

  outcome: Outcome;
}

// Constants
export const COST_ESCALATION_PER_YEAR = 0.05; // 5%
export const COMPLEXITY_PENALTY_THRESHOLD = 5; // soft costs hit at source #6
export const COMPLEXITY_PENALTY_PER_UNIT = 20_000; // $20k/u per extra source
export const LIHTC_BASELINE_WIN_RATE = 0.20; // 20% statewide

export const AMI_SCORE_MULTIPLIERS: Record<AmiBand, number> = {
  30: 4,
  50: 2.5,
  60: 1.5,
  80: 1,
};

export const HARD_COST_PER_UNIT: Record<BuildingType, number> = {
  walkup: 470_000,
  midrise: 560_000,
  larger: 620_000,
};

export const FINISH_MULTIPLIER: Record<FinishLevel, number> = {
  basic: 0.90,
  standard: 1.00,
  elevated: 1.15,
};

export const SOFT_COST_RATIO = 0.27; // 27% of hard
export const CONTINGENCY_RATIO = 0.05; // 5% of hard
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/game/types.ts
git commit -m "feat: core type definitions"
```

---

### Task 5: AMI rent table

**Files:**
- Create: `src/data/amiRents.ts`
- Create: `tests/data/amiRents.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/data/amiRents.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { rentAtAmi } from '../../src/data/amiRents';

describe('rentAtAmi', () => {
  it('returns ~$1,250 for 60% AMI (1BR Chicago FY24 benchmark)', () => {
    expect(rentAtAmi(60)).toBe(1_250);
  });

  it('returns proportionally lower for 30% AMI', () => {
    expect(rentAtAmi(30)).toBe(625);
  });

  it('returns 50% AMI rent', () => {
    expect(rentAtAmi(50)).toBe(1_040);
  });

  it('returns 80% AMI rent', () => {
    expect(rentAtAmi(80)).toBe(1_665);
  });
});
```

- [ ] **Step 2: Run test, verify failure**

```bash
npm test
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/data/amiRents.ts`:

```ts
// HUD AMI rent limits for Chicago metro, FY24, 1BR baseline
// Source: HUD MTSP (Multifamily Tax Subsidy Projects) limits
import { AmiBand } from '../game/types';

const RENT_BY_AMI: Record<AmiBand, number> = {
  30: 625,
  50: 1_040,
  60: 1_250,
  80: 1_665,
};

export function rentAtAmi(ami: AmiBand): number {
  return RENT_BY_AMI[ami];
}
```

- [ ] **Step 4: Run test, verify pass**

```bash
npm test
```

Expected: all 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: AMI rent table (HUD FY24 Chicago)"
```

---

### Task 6: ARO floor table

**Files:**
- Create: `src/data/aro.ts`
- Create: `tests/data/aro.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/data/aro.test.ts
import { describe, it, expect } from 'vitest';
import { aroMinimumFraction } from '../../src/data/aro';

describe('aroMinimumFraction', () => {
  it('returns 0.20 for 40+ unit Englewood project', () => {
    expect(aroMinimumFraction('englewood', 60)).toBe(0.20);
  });

  it('returns 0.20 for 40+ unit Pilsen project', () => {
    expect(aroMinimumFraction('pilsen', 60)).toBe(0.20);
  });

  it('returns 0.20 for 40+ unit Lakeview project', () => {
    expect(aroMinimumFraction('lakeview', 60)).toBe(0.20);
  });

  it('returns 0.20 for 40+ unit Albany Park project', () => {
    expect(aroMinimumFraction('albany-park', 60)).toBe(0.20);
  });
});
```

- [ ] **Step 2: Run test, verify failure**

```bash
npm test
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/data/aro.ts
// Simplified ARO (Affordable Requirements Ordinance) floor: 20% affordable
// at this scale (40+ units) for our four MVP neighborhoods.
import { NeighborhoodId } from '../game/types';

export function aroMinimumFraction(_neighborhood: NeighborhoodId, units: number): number {
  if (units < 10) return 0;
  return 0.20;
}
```

- [ ] **Step 4: Run test, verify pass**

```bash
npm test
```

Expected: all 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: ARO floor table"
```

---

### Task 7: Neighborhood data

**Files:**
- Create: `src/data/neighborhoods.ts`
- Create: `tests/data/neighborhoods.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/data/neighborhoods.test.ts
import { describe, it, expect } from 'vitest';
import { neighborhoods, getNeighborhood } from '../../src/data/neighborhoods';

describe('neighborhoods', () => {
  it('has all 4 neighborhoods', () => {
    expect(neighborhoods).toHaveLength(4);
  });

  it('Englewood is marked MVP', () => {
    expect(getNeighborhood('englewood').status).toBe('mvp');
  });

  it('other 3 are marked stub', () => {
    expect(getNeighborhood('pilsen').status).toBe('stub');
    expect(getNeighborhood('lakeview').status).toBe('stub');
    expect(getNeighborhood('albany-park').status).toBe('stub');
  });

  it('Englewood has $12k land cost per unit', () => {
    expect(getNeighborhood('englewood').landCostPerUnit).toBe(12_000);
  });

  it('Englewood has supportive alder (green tone)', () => {
    expect(getNeighborhood('englewood').alderTone).toBe('green');
  });
});
```

- [ ] **Step 2: Run test, verify failure**

```bash
npm test -- neighborhoods
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/data/neighborhoods.ts
import { NeighborhoodProfile, NeighborhoodId } from '../game/types';

export const neighborhoods: NeighborhoodProfile[] = [
  {
    id: 'englewood',
    name: 'Englewood',
    emoji: '🌳',
    description: 'South Side · disinvested, low-cost, supportive alder, simpler entitlement',
    landCostPerUnit: 12_000,
    marketRentPerUnit: 1_150,
    alderName: 'Asha Tran',
    alderTone: 'green',
    alderGreeting: 'Welcome to the ward. I\'m supportive in principle — let\'s make sure the block club has its say and we keep this affordable. Get me the pro forma when you\'re ready.',
    tifAvailable: true,
    status: 'mvp',
  },
  {
    id: 'pilsen',
    name: 'Pilsen',
    emoji: '🌮',
    description: 'Gentrification pressure, displacement concerns dominate community input',
    landCostPerUnit: 60_000,
    marketRentPerUnit: 2_100,
    alderName: 'Carlos Reyes',
    alderTone: 'yellow',
    alderGreeting: '(Coming soon — Pilsen is a v2 neighborhood.)',
    tifAvailable: true,
    status: 'stub',
  },
  {
    id: 'lakeview',
    name: 'Lakeview',
    emoji: '🏙️',
    description: 'North Side, hot market, neighbors push back hard on density',
    landCostPerUnit: 110_000,
    marketRentPerUnit: 2_900,
    alderName: 'Bennett Lawson',
    alderTone: 'yellow',
    alderGreeting: '(Coming soon — Lakeview is a v2 neighborhood.)',
    tifAvailable: false,
    status: 'stub',
  },
  {
    id: 'albany-park',
    name: 'Albany Park',
    emoji: '🌐',
    description: 'NW Side, immigrant-heavy, multilingual engagement essential, mid-cost',
    landCostPerUnit: 55_000,
    marketRentPerUnit: 1_800,
    alderName: 'Samantha Nugent',
    alderTone: 'yellow',
    alderGreeting: '(Coming soon — Albany Park is a v2 neighborhood.)',
    tifAvailable: true,
    status: 'stub',
  },
];

export function getNeighborhood(id: NeighborhoodId): NeighborhoodProfile {
  const n = neighborhoods.find(n => n.id === id);
  if (!n) throw new Error(`Unknown neighborhood: ${id}`);
  return n;
}
```

- [ ] **Step 4: Run test, verify pass**

```bash
npm test -- neighborhoods
```

Expected: all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: neighborhood data (Englewood MVP, 3 stubs)"
```

---

### Task 8: Funding source data

**Files:**
- Create: `src/data/sources.ts`
- Create: `tests/data/sources.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/data/sources.test.ts
import { describe, it, expect } from 'vitest';
import { sources, getSource } from '../../src/data/sources';

describe('sources', () => {
  it('has exactly 12 funding sources', () => {
    expect(sources).toHaveLength(12);
  });

  it('9% LIHTC takes 280 days', () => {
    expect(getSource('9-lihtc').daysToProcess).toBe(280);
  });

  it('DOH loan takes 45 days', () => {
    expect(getSource('doh-loan').daysToProcess).toBe(45);
  });

  it('TIF takes 90 days and costs alder goodwill', () => {
    const tif = getSource('tif');
    expect(tif.daysToProcess).toBe(90);
    expect(tif.alderGoodwillCost).toBeGreaterThan(0);
  });

  it('HED Bond takes 90 days and costs alder goodwill', () => {
    const hed = getSource('hed-bond');
    expect(hed.daysToProcess).toBe(90);
    expect(hed.alderGoodwillCost).toBeGreaterThan(0);
  });

  it('Deferred developer fee costs 0 days', () => {
    expect(getSource('deferred-dev-fee').daysToProcess).toBe(0);
  });
});
```

- [ ] **Step 2: Run test, verify failure**

```bash
npm test -- sources
```

Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/data/sources.ts
import { SourceProfile, SourceId } from '../game/types';

export const sources: SourceProfile[] = [
  {
    id: '9-lihtc',
    name: '9% LIHTC Equity',
    emoji: '💚',
    shortDescription: 'Tax-credit equity via competitive IHDA round',
    daysToProcess: 280,
    amountRange: null, // computed from QAP/eligible basis
    alderGoodwillCost: 0,
    usesComplexityPenalty: false, // LIHTC is core; doesn't count toward 5
  },
  {
    id: '4-lihtc-bonds',
    name: '4% LIHTC + Tax-Exempt Bonds',
    emoji: '📜',
    shortDescription: 'Less competitive; mutually exclusive with 9% LIHTC',
    daysToProcess: 200,
    amountRange: null,
    alderGoodwillCost: 0,
    usesComplexityPenalty: false,
  },
  {
    id: 'doh-loan',
    name: 'DOH Loan',
    emoji: '🏛️',
    shortDescription: 'City of Chicago soft loan, 0-3%',
    daysToProcess: 45,
    amountRange: { min: 3_000_000, max: 7_000_000 },
    alderGoodwillCost: 0,
    usesComplexityPenalty: true,
  },
  {
    id: 'ihda-loan',
    name: 'IHDA Multifamily Loan',
    emoji: '🏠',
    shortDescription: 'State soft debt; pairs well with LIHTC',
    daysToProcess: 45,
    amountRange: { min: 2_000_000, max: 6_000_000 },
    alderGoodwillCost: 0,
    usesComplexityPenalty: true,
  },
  {
    id: 'tif',
    name: 'TIF Funds',
    emoji: '💰',
    shortDescription: 'Requires alder support + DPD recommendation',
    daysToProcess: 90,
    amountRange: { min: 3_000_000, max: 8_000_000 },
    alderGoodwillCost: 13, // mid of 8-18 range
    usesComplexityPenalty: true,
  },
  {
    id: 'hed-bond',
    name: 'HED Bond',
    emoji: '🏗️',
    shortDescription: 'Council vote; >$5M triggers additional vote',
    daysToProcess: 90,
    amountRange: { min: 2_000_000, max: 10_000_000 },
    alderGoodwillCost: 10,
    usesComplexityPenalty: true,
  },
  {
    id: 'cdbg',
    name: 'CDBG',
    emoji: '🇺🇸',
    shortDescription: 'Federal block grant via DOH; federal compliance',
    daysToProcess: 45,
    amountRange: { min: 1_000_000, max: 5_000_000 },
    alderGoodwillCost: 0,
    usesComplexityPenalty: true,
  },
  {
    id: 'home',
    name: 'Federal HOME',
    emoji: '🏘️',
    shortDescription: 'Modest; long-term affordability lock',
    daysToProcess: 45,
    amountRange: { min: 1_000_000, max: 3_000_000 },
    alderGoodwillCost: 0,
    usesComplexityPenalty: true,
  },
  {
    id: 'iahtc',
    name: 'IL Donation Tax Credits',
    emoji: '🎁',
    shortDescription: 'IAHTC — small, fast',
    daysToProcess: 45,
    amountRange: { min: 200_000, max: 800_000 },
    alderGoodwillCost: 0,
    usesComplexityPenalty: true,
  },
  {
    id: 'philanthropy',
    name: 'Private Philanthropy',
    emoji: '🤝',
    shortDescription: 'Foundation / mission-driven',
    daysToProcess: 45,
    amountRange: { min: 100_000, max: 500_000 },
    alderGoodwillCost: 0,
    usesComplexityPenalty: true,
  },
  {
    id: 'bank-loan',
    name: 'Bank Loan',
    emoji: '🏦',
    shortDescription: 'Hard debt sized by NOI ÷ DSCR (at close)',
    daysToProcess: 60,
    amountRange: null, // sized by pro forma
    alderGoodwillCost: 0,
    usesComplexityPenalty: false, // structural part of stack
  },
  {
    id: 'deferred-dev-fee',
    name: 'Deferred Developer Fee',
    emoji: '📒',
    shortDescription: 'Capped at ~3% of TDC; no time cost',
    daysToProcess: 0,
    amountRange: null, // capped at 3% TDC
    alderGoodwillCost: 0,
    usesComplexityPenalty: false,
  },
];

export function getSource(id: SourceId): SourceProfile {
  const s = sources.find(s => s.id === id);
  if (!s) throw new Error(`Unknown source: ${id}`);
  return s;
}
```

- [ ] **Step 4: Run test, verify pass**

```bash
npm test -- sources
```

Expected: all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: 12 funding source profiles"
```

---

### Task 9: Character dialog data

**Files:**
- Create: `src/data/characters.ts`

- [ ] **Step 1: Write the characters file**

```ts
// src/data/characters.ts
export type CharacterId = 'marcus' | 'asha' | 'janelle' | 'david' | 'powell' | 'reyes' | 'chen';

export interface Character {
  id: CharacterId;
  name: string;
  emoji: string;
  role: string;
}

export const characters: Record<CharacterId, Character> = {
  marcus: { id: 'marcus', name: 'Marcus', emoji: '🏦', role: 'Banker' },
  asha:   { id: 'asha', name: 'Asha Tran', emoji: '🧑‍💼', role: 'Your alderperson' },
  janelle:{ id: 'janelle', name: 'Janelle', emoji: '🏛️', role: 'IHDA reviewer' },
  david:  { id: 'david', name: 'David', emoji: '🏛️', role: 'DOH analyst' },
  powell: { id: 'powell', name: 'Ald. Powell', emoji: '⚖️', role: 'Fiscal hawk' },
  reyes:  { id: 'reyes', name: 'Ald. Reyes', emoji: '📣', role: 'TIF reformer' },
  chen:   { id: 'chen', name: 'Ald. Chen', emoji: '🏢', role: 'Other-ward alder' },
};

// Marcus lines, keyed by what's happening in Pro Forma
export const marcusLines = {
  dscrLimited: 'Honestly, my loan barely matters here. At 60% AMI rents the income only supports a small piece — and that\'s most of what any bank will give you on this deal. The real work is in front of you: IHDA, DOH, TIF, and credits.',
  ltvLimited: 'Your value\'s healthy enough that I could lend more on paper, but the income still has to service it. We\'re LTV-limited, not DSCR — that\'s a rare position for affordable.',
  generic: 'Your project pencils on the income side. Let me know when you\'re ready to close the construction loan.',
};

// Asha lines, keyed by entitlement step + choice
export const ashaLines = {
  preappQuiet: 'I appreciate the heads up. A quieter rollout works for me — let\'s see how the block club takes it.',
  preappFormalCBO: 'Bringing a CBO partner in early is the right move. The community will read it as respect.',
  preappPublic: 'A public pre-launch is bold. I hope you\'re ready for the calls I\'ll get on Monday.',
  communityData: 'Data-led works on me. It might not land for everyone in the room, though.',
  communityStory: 'The story-led pitch is the right read for Englewood. People want to feel seen.',
  communityCoalition: 'Coalition-led is strong. Make sure the coalition partners feel led, not used.',
  zoningHold: 'If we hold at the original size, I\'ll need to lean on my chair vote at Committee. Doable.',
  zoningShrink: 'If you shrink to {newUnits}, I keep my chair\'s vote and you cruise to Council.',
  zoningAccept: 'Accepting Committee conditions is the safe play. We lose some impact but we don\'t lose the project.',
  financeReframe: 'The cost number is going to follow you forever. If you can shift the conversation to per-unit-of-impact, A is your best path.',
  financeConcede: 'Conceding on TIF costs you real money. Find that gap from somewhere — quickly.',
  financeStakeholders: 'Coalition testimony works but burns the goodwill you\'ll want at lease-up and beyond.',
};

export const janelleLines = {
  qapScoreLow: 'Your QAP score is weak. You can submit and gamble, or strengthen the application — deepening affordability or lining up other commitments first.',
  qapScoreMid: 'You\'re in the mix. Statewide, roughly one in five applications win in any round. The other commitments you\'re lining up will help.',
  qapScoreHigh: 'Strong application. If the IHDA staff likes the project on its merits, you have a real shot this round.',
  fiveSources: 'You\'re at 5 sources — anything more comes with a soft-cost penalty. Look hard at HED Bond or a small IAHTC for clean fill.',
};

export const davidLines = {
  dohWelcome: 'DOH is on board with your profile. We\'ll need a coherent stack before final commitment — show me what else you\'re lining up.',
};

// Committee on Finance pushback lines
export const financeAttackLines = {
  tooExpensive: (perUnit: number) =>
    `$${(perUnit / 1000).toFixed(0)}k per unit. We could buy existing buildings for half that.`,
  tifCorrupt: 'That\'s exactly the pattern we promised to stop. Englewood TIF is drained dry as it is.',
  hedWardJealousy: 'Why is HED money going to a ward that\'s already getting TIF? My residents would like a turn.',
};
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: character dialog lookups"
```

---

## Phase 3 — Game Logic (Pure Functions, TDD)

### Task 10: Pro Forma math module

**Files:**
- Create: `src/game/proForma.ts`
- Create: `tests/game/proForma.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/game/proForma.test.ts
import { describe, it, expect } from 'vitest';
import {
  computeTdc,
  computeNoi,
  computeSupportableDebt,
  computeGap,
  weightedAvgAmi,
  isLihtcEligible,
} from '../../src/game/proForma';

describe('computeTdc', () => {
  it('Englewood mid-rise standard finish, 60 units → ~$45M', () => {
    const tdc = computeTdc({
      neighborhood: 'englewood',
      units: 60,
      buildingType: 'midrise',
      finishLevel: 'standard',
    });
    // land 60×$12k = $720k
    // hard 60×$560k = $33.6M
    // soft 27% × $33.6M = $9.072M
    // contingency 5% × $33.6M = $1.68M
    // = $45.072M
    expect(tdc.total).toBeCloseTo(45_072_000, -3);
    expect(tdc.land).toBe(720_000);
    expect(tdc.hard).toBe(33_600_000);
  });

  it('Elevated finish increases hard cost by 15%', () => {
    const tdc = computeTdc({
      neighborhood: 'englewood',
      units: 60,
      buildingType: 'midrise',
      finishLevel: 'elevated',
    });
    expect(tdc.hard).toBeCloseTo(33_600_000 * 1.15, -2);
  });
});

describe('weightedAvgAmi', () => {
  it('all 60% AMI → 60', () => {
    expect(weightedAvgAmi({ 30: 0, 50: 0, 60: 60, 80: 0 })).toBe(60);
  });

  it('balanced mix → ~55%', () => {
    // 12×30 + 12×50 + 30×60 + 6×80 = 360 + 600 + 1800 + 480 = 3240
    // / 60 = 54
    expect(weightedAvgAmi({ 30: 12, 50: 12, 60: 30, 80: 6 })).toBe(54);
  });
});

describe('isLihtcEligible', () => {
  it('average ≤ 60% AMI → eligible', () => {
    expect(isLihtcEligible({ 30: 12, 50: 12, 60: 30, 80: 6 })).toBe(true);
  });

  it('average > 60% AMI → not eligible', () => {
    expect(isLihtcEligible({ 30: 0, 50: 0, 60: 20, 80: 40 })).toBe(false);
  });
});

describe('computeNoi', () => {
  it('NOI = (GPR × (1 - vacancy)) × (1 - opex)', () => {
    const noi = computeNoi({
      amiBreakdown: { 30: 0, 50: 0, 60: 60, 80: 0 },
      marketUnits: 0,
      marketRent: 1150,
      opexRatio: 0.38,
      vacancyRatio: 0.07,
    });
    // GPR = 60 × $1,250 × 12 = $900,000
    // EGI = 900,000 × 0.93 = $837,000
    // NOI = 837,000 × 0.62 = $518,940
    expect(noi).toBeCloseTo(518_940, 0);
  });
});

describe('computeSupportableDebt', () => {
  it('DSCR-limited debt sizing', () => {
    const debt = computeSupportableDebt({
      noi: 518_940,
      dscr: 1.20,
      annualRate: 0.065,
      amortYears: 30,
      ltv: 0.80,
      stabilizedValue: 8_650_000,
    });
    // payment cap = NOI / DSCR = 518,940 / 1.20 = 432,450
    // mortgage constant @ 6.5% / 30yr ≈ 0.07585
    // DSCR-limited loan = 432,450 / 0.07585 ≈ 5,700,000
    // LTV-limited = 8,650,000 × 0.80 = 6,920,000
    // bind: DSCR (lesser)
    expect(debt.amount).toBeCloseTo(5_700_000, -4);
    expect(debt.binding).toBe('DSCR');
  });
});

describe('computeGap', () => {
  it('gap = TDC + escalation − supportable debt', () => {
    const gap = computeGap({
      tdc: 45_072_000,
      costEscalation: 0,
      supportableDebt: 5_700_000,
    });
    expect(gap).toBeCloseTo(39_372_000, -3);
  });
});
```

- [ ] **Step 2: Run tests, verify failure**

```bash
npm test -- proForma
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/game/proForma.ts
import {
  AmiBand,
  BuildingType,
  FinishLevel,
  NeighborhoodId,
  HARD_COST_PER_UNIT,
  FINISH_MULTIPLIER,
  SOFT_COST_RATIO,
  CONTINGENCY_RATIO,
} from './types';
import { getNeighborhood } from '../data/neighborhoods';
import { rentAtAmi } from '../data/amiRents';

export interface TdcParts {
  land: number;
  hard: number;
  soft: number;
  contingency: number;
  total: number;
}

export function computeTdc(input: {
  neighborhood: NeighborhoodId;
  units: number;
  buildingType: BuildingType;
  finishLevel: FinishLevel;
}): TdcParts {
  const n = getNeighborhood(input.neighborhood);
  const land = n.landCostPerUnit * input.units;
  const hardPerUnit = HARD_COST_PER_UNIT[input.buildingType] * FINISH_MULTIPLIER[input.finishLevel];
  const hard = hardPerUnit * input.units;
  const soft = hard * SOFT_COST_RATIO;
  const contingency = hard * CONTINGENCY_RATIO;
  return { land, hard, soft, contingency, total: land + hard + soft + contingency };
}

export function weightedAvgAmi(breakdown: Record<AmiBand, number>): number {
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  const sum = (30 * breakdown[30]) + (50 * breakdown[50]) + (60 * breakdown[60]) + (80 * breakdown[80]);
  return sum / total;
}

export function isLihtcEligible(breakdown: Record<AmiBand, number>): boolean {
  return weightedAvgAmi(breakdown) <= 60;
}

export function computeNoi(input: {
  amiBreakdown: Record<AmiBand, number>;
  marketUnits: number;
  marketRent: number;
  opexRatio: number;
  vacancyRatio: number;
}): number {
  let gpr = 0;
  for (const ami of [30, 50, 60, 80] as AmiBand[]) {
    gpr += input.amiBreakdown[ami] * rentAtAmi(ami) * 12;
  }
  gpr += input.marketUnits * input.marketRent * 12;
  const egi = gpr * (1 - input.vacancyRatio);
  return egi * (1 - input.opexRatio);
}

export interface SupportableDebt {
  amount: number;
  binding: 'DSCR' | 'LTV';
}

function mortgageConstant(annualRate: number, years: number): number {
  const i = annualRate / 12;
  const n = years * 12;
  if (i === 0) return 1 / years;
  return 12 * (i / (1 - Math.pow(1 + i, -n)));
}

export function computeSupportableDebt(input: {
  noi: number;
  dscr: number;
  annualRate: number;
  amortYears: number;
  ltv: number;
  stabilizedValue: number;
}): SupportableDebt {
  const k = mortgageConstant(input.annualRate, input.amortYears);
  const dscrLoan = (input.noi / input.dscr) / k;
  const ltvLoan = input.stabilizedValue * input.ltv;
  const amount = Math.max(0, Math.min(dscrLoan, ltvLoan));
  return { amount, binding: dscrLoan <= ltvLoan ? 'DSCR' : 'LTV' };
}

export function computeGap(input: {
  tdc: number;
  costEscalation: number;
  supportableDebt: number;
}): number {
  return Math.max(0, input.tdc + input.costEscalation - input.supportableDebt);
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
npm test -- proForma
```

Expected: all 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: pro forma math module (Wyche-style + bottom-up TDC)"
```

---

### Task 11: Capital Stack module

**Files:**
- Create: `src/game/capitalStack.ts`
- Create: `tests/game/capitalStack.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/game/capitalStack.test.ts
import { describe, it, expect } from 'vitest';
import {
  complexityPenalty,
  computeLihtcScore,
  estimatedAwardProbability,
  totalCommitted,
} from '../../src/game/capitalStack';

describe('complexityPenalty', () => {
  it('0 sources → $0', () => {
    expect(complexityPenalty(0, 60)).toBe(0);
  });

  it('5 sources → $0 (under threshold)', () => {
    expect(complexityPenalty(5, 60)).toBe(0);
  });

  it('6 sources at 60 units → $1.2M ($20k/u × 60u × 1)', () => {
    expect(complexityPenalty(6, 60)).toBe(1_200_000);
  });

  it('8 sources at 60 units → $3.6M', () => {
    expect(complexityPenalty(8, 60)).toBe(3_600_000);
  });

  it('penalty scales with units', () => {
    expect(complexityPenalty(7, 100)).toBe(4_000_000); // 2 over × $20k × 100
  });
});

describe('computeLihtcScore', () => {
  it('balanced mix with CBO partner gives middle-of-pack score', () => {
    const score = computeLihtcScore({
      weightedAvgAmi: 55,
      hasCboPartner: true,
      hasLeverageCommitments: true,
      neighborhood: 'englewood',
    });
    expect(score).toBeGreaterThanOrEqual(60);
    expect(score).toBeLessThanOrEqual(90);
  });

  it('shallow AMI, no CBO, no leverage scores low', () => {
    const score = computeLihtcScore({
      weightedAvgAmi: 60,
      hasCboPartner: false,
      hasLeverageCommitments: false,
      neighborhood: 'englewood',
    });
    expect(score).toBeLessThan(50);
  });
});

describe('estimatedAwardProbability', () => {
  it('score 100 → ~70% probability', () => {
    expect(estimatedAwardProbability(100)).toBeCloseTo(0.70, 1);
  });

  it('score 50 → ~20% probability (baseline)', () => {
    expect(estimatedAwardProbability(50)).toBeCloseTo(0.20, 1);
  });

  it('score 0 → ~5%', () => {
    expect(estimatedAwardProbability(0)).toBeLessThan(0.10);
  });
});

describe('totalCommitted', () => {
  it('sums awarded sources', () => {
    const total = totalCommitted([
      { sourceId: '9-lihtc', amount: 22_000_000, daysSpent: 280 },
      { sourceId: 'doh-loan', amount: 5_000_000, daysSpent: 45 },
    ]);
    expect(total).toBe(27_000_000);
  });
});
```

- [ ] **Step 2: Run tests, verify failure**

```bash
npm test -- capitalStack
```

Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/game/capitalStack.ts
import {
  SourceAward,
  COMPLEXITY_PENALTY_THRESHOLD,
  COMPLEXITY_PENALTY_PER_UNIT,
  LIHTC_BASELINE_WIN_RATE,
  NeighborhoodId,
} from './types';

/**
 * Soft-cost penalty per Terner Center: each capital source past the threshold
 * adds ~$20k/unit in soft costs.
 */
export function complexityPenalty(sourceCount: number, units: number): number {
  const overage = Math.max(0, sourceCount - COMPLEXITY_PENALTY_THRESHOLD);
  return overage * COMPLEXITY_PENALTY_PER_UNIT * units;
}

/**
 * Returns sum of awarded amounts.
 */
export function totalCommitted(awarded: SourceAward[]): number {
  return awarded.reduce((sum, a) => sum + a.amount, 0);
}

/**
 * QAP-style scoring. 0-100. Higher is better.
 * Contributions: affordability depth, community partner, leverage, location, base.
 */
export function computeLihtcScore(input: {
  weightedAvgAmi: number;
  hasCboPartner: boolean;
  hasLeverageCommitments: boolean;
  neighborhood: NeighborhoodId;
}): number {
  let score = 24; // base

  // Affordability depth: deeper (lower AMI) = more points
  // 60% AMI = 0 points, 30% AMI = 24 points (linear)
  const depthPoints = Math.max(0, ((60 - input.weightedAvgAmi) / 30) * 24);
  score += Math.min(24, depthPoints);

  // CBO partner
  if (input.hasCboPartner) score += 18;

  // Leverage of other committed funds
  if (input.hasLeverageCommitments) score += 14;

  // Neighborhood priority (Englewood is a priority area)
  if (input.neighborhood === 'englewood' || input.neighborhood === 'pilsen') {
    score += 10;
  }

  return Math.min(100, Math.round(score));
}

/**
 * Maps QAP score (0-100) to estimated award probability.
 * Baseline 20% at score 50; doubles by score 75; capped at 70% at score 100.
 */
export function estimatedAwardProbability(score: number): number {
  // Linear with floor and ceiling
  if (score <= 0) return 0.05;
  if (score >= 100) return 0.70;

  if (score <= 50) {
    // 0.05 at 0, 0.20 at 50
    return 0.05 + (score / 50) * (LIHTC_BASELINE_WIN_RATE - 0.05);
  } else {
    // 0.20 at 50, 0.70 at 100
    return LIHTC_BASELINE_WIN_RATE + ((score - 50) / 50) * (0.70 - LIHTC_BASELINE_WIN_RATE);
  }
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
npm test -- capitalStack
```

Expected: all 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: capital stack module (complexity penalty, LIHTC scoring)"
```

---

### Task 12: Entitlement module

**Files:**
- Create: `src/game/entitlement.ts`
- Create: `tests/game/entitlement.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/game/entitlement.test.ts
import { describe, it, expect } from 'vitest';
import {
  resolveEntitlementPath,
  applyChoice,
  isPathFailed,
} from '../../src/game/entitlement';

describe('resolveEntitlementPath', () => {
  it('Mid-rise + zoning change needed → Zoning Map Amendment path', () => {
    expect(resolveEntitlementPath({ buildingType: 'midrise', units: 60 })).toBe('zma');
  });

  it('Walk-up at 60 units → Planned Development path', () => {
    expect(resolveEntitlementPath({ buildingType: 'walkup', units: 60 })).toBe('pd');
  });

  it('Larger building → Planned Development', () => {
    expect(resolveEntitlementPath({ buildingType: 'larger', units: 60 })).toBe('pd');
  });
});

describe('applyChoice', () => {
  it('shrink-zoning choice applies delta to meters and units', () => {
    const result = applyChoice('zoning-shrink', { shrinkBy: 12 });
    expect(result.alderDelta).toBe(-6);
    expect(result.communityDelta).toBe(15);
    expect(result.shrinkBy).toBe(12);
  });

  it('community-story choice adds to community support', () => {
    const result = applyChoice('community-story', {});
    expect(result.communityDelta).toBeGreaterThan(0);
  });

  it('finance-concede choice tracks tdcDelta (gap reopens)', () => {
    const result = applyChoice('finance-concede', { concessionAmount: 3_000_000 });
    expect(result.tdcDelta).toBe(0); // TDC unchanged; gap reopens via source removal
    expect(result.alderDelta).toBe(5);
  });
});

describe('isPathFailed', () => {
  it('alder goodwill < 20 → alder withdrawal', () => {
    expect(isPathFailed({ alderGoodwill: 15, communitySupport: 60 })).toBe('alder');
  });

  it('community support < 25 → community failure', () => {
    expect(isPathFailed({ alderGoodwill: 50, communitySupport: 20 })).toBe('community');
  });

  it('all meters above threshold → no failure', () => {
    expect(isPathFailed({ alderGoodwill: 50, communitySupport: 60 })).toBe(null);
  });
});
```

- [ ] **Step 2: Run tests, verify failure**

```bash
npm test -- entitlement
```

Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/game/entitlement.ts
import { BuildingType, StepChoiceKey } from './types';

export type EntitlementPath = 'by-right' | 'zma' | 'pd';

export function resolveEntitlementPath(input: {
  buildingType: BuildingType;
  units: number;
}): EntitlementPath {
  if (input.buildingType === 'larger') return 'pd';
  if (input.buildingType === 'walkup' && input.units >= 40) return 'pd';
  return 'zma';
}

export interface ChoiceConsequence {
  alderDelta: number;
  communityDelta: number;
  tdcDelta: number;
  shrinkBy: number;
}

export function applyChoice(
  choice: StepChoiceKey,
  ctx: { shrinkBy?: number; concessionAmount?: number } = {},
): ChoiceConsequence {
  const base: ChoiceConsequence = { alderDelta: 0, communityDelta: 0, tdcDelta: 0, shrinkBy: 0 };

  switch (choice) {
    case 'preapp-quiet':
      return { ...base, alderDelta: 2, communityDelta: 0 };
    case 'preapp-formal-cbo':
      return { ...base, alderDelta: 5, communityDelta: 6 };
    case 'preapp-public':
      return { ...base, alderDelta: -3, communityDelta: 4 };

    case 'community-data':
      return { ...base, alderDelta: 3, communityDelta: 4 };
    case 'community-story':
      return { ...base, alderDelta: -2, communityDelta: 12 };
    case 'community-coalition':
      return { ...base, alderDelta: 4, communityDelta: 10 };

    case 'zoning-hold':
      return { ...base, alderDelta: -14, communityDelta: -4 };
    case 'zoning-shrink':
      return { ...base, alderDelta: -6, communityDelta: 15, shrinkBy: ctx.shrinkBy ?? 12 };
    case 'zoning-accept':
      return { ...base, alderDelta: -8, communityDelta: 0, tdcDelta: 1_400_000 };

    case 'finance-reframe':
      return { ...base, alderDelta: -2, communityDelta: 0 };
    case 'finance-concede':
      return { ...base, alderDelta: 5, communityDelta: 0 };
    case 'finance-stakeholders':
      return { ...base, alderDelta: 0, communityDelta: -15 };

    default:
      return base;
  }
}

export function isPathFailed(input: {
  alderGoodwill: number;
  communitySupport: number;
}): 'alder' | 'community' | null {
  if (input.alderGoodwill < 20) return 'alder';
  if (input.communitySupport < 25) return 'community';
  return null;
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
npm test -- entitlement
```

Expected: all 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: entitlement module (path resolution, choices, failure modes)"
```

---

### Task 13: Scoring module

**Files:**
- Create: `src/game/scoring.ts`
- Create: `tests/game/scoring.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/game/scoring.test.ts
import { describe, it, expect } from 'vitest';
import { computeImpactScore } from '../../src/game/scoring';

describe('computeImpactScore', () => {
  it('not closed → 0 regardless of mix', () => {
    expect(computeImpactScore({
      closed: false,
      amiBreakdown: { 30: 60, 50: 0, 60: 0, 80: 0 },
    })).toBe(0);
  });

  it('all-60% mix, 60 units → 60 × 1.5 = 90', () => {
    expect(computeImpactScore({
      closed: true,
      amiBreakdown: { 30: 0, 50: 0, 60: 60, 80: 0 },
    })).toBe(90);
  });

  it('balanced 12/12/30/6 → 48 + 30 + 45 + 6 = 129', () => {
    expect(computeImpactScore({
      closed: true,
      amiBreakdown: { 30: 12, 50: 12, 60: 30, 80: 6 },
    })).toBe(129);
  });

  it('deep mix (30 at 30% + 30 at 60%) → 120 + 45 = 165', () => {
    expect(computeImpactScore({
      closed: true,
      amiBreakdown: { 30: 30, 50: 0, 60: 30, 80: 0 },
    })).toBe(165);
  });
});
```

- [ ] **Step 2: Run tests, verify failure**

```bash
npm test -- scoring
```

Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/game/scoring.ts
import { AmiBand, AMI_SCORE_MULTIPLIERS } from './types';

export function computeImpactScore(input: {
  closed: boolean;
  amiBreakdown: Record<AmiBand, number>;
}): number {
  if (!input.closed) return 0;
  let score = 0;
  for (const ami of [30, 50, 60, 80] as AmiBand[]) {
    score += input.amiBreakdown[ami] * AMI_SCORE_MULTIPLIERS[ami];
  }
  return score;
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
npm test -- scoring
```

Expected: all 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: impact scoring module"
```

---

## Phase 4 — State Management

### Task 14: Zustand store

**Files:**
- Create: `src/game/state.ts`
- Create: `tests/game/state.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/game/state.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../src/game/state';

describe('useGameStore', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  it('starts in phase 1 with no neighborhood', () => {
    const state = useGameStore.getState();
    expect(state.phase).toBe(1);
    expect(state.project.neighborhood).toBe(null);
  });

  it('advancePhase increments phase up to 6', () => {
    const s = useGameStore.getState();
    s.advancePhase();
    expect(useGameStore.getState().phase).toBe(2);
    s.advancePhase(); s.advancePhase(); s.advancePhase(); s.advancePhase(); s.advancePhase();
    expect(useGameStore.getState().phase).toBe(6);
    // Stays at 6
    useGameStore.getState().advancePhase();
    expect(useGameStore.getState().phase).toBe(6);
  });

  it('selectNeighborhood records id', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    expect(useGameStore.getState().project.neighborhood).toBe('englewood');
  });

  it('setUnits updates project unit count', () => {
    useGameStore.getState().setUnits(80);
    expect(useGameStore.getState().project.units).toBe(80);
  });

  it('tickYear adds 1 year + cost escalation', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    useGameStore.getState().tickYear();
    const s = useGameStore.getState();
    expect(s.yearsElapsed).toBe(1);
    expect(s.costEscalation).toBeGreaterThan(0);
  });

  it('reset returns to initial state', () => {
    useGameStore.getState().advancePhase();
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().reset();
    expect(useGameStore.getState().phase).toBe(1);
    expect(useGameStore.getState().project.neighborhood).toBe(null);
  });
});
```

- [ ] **Step 2: Run tests, verify failure**

```bash
npm test -- state
```

Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/game/state.ts
import { create } from 'zustand';
import {
  GameState,
  Phase,
  NeighborhoodId,
  BuildingType,
  Intent,
  AmiBand,
  FinishLevel,
  StepChoiceKey,
  EntitlementStep,
  SourceAward,
  COST_ESCALATION_PER_YEAR,
  HARD_COST_PER_UNIT,
  FINISH_MULTIPLIER,
  SOFT_COST_RATIO,
  CONTINGENCY_RATIO,
} from './types';
import { getNeighborhood } from '../data/neighborhoods';
import { applyChoice } from './entitlement';

const initialState: GameState = {
  phase: 1,
  yearsElapsed: 0,
  costEscalation: 0,
  project: {
    neighborhood: null,
    units: 60,
    buildingType: 'midrise',
    intent: 'all-affordable',
  },
  proForma: {
    amiBreakdown: { 30: 12, 50: 12, 60: 30, 80: 6 },
    marketUnits: 0,
    finishLevel: 'standard',
    opexRatio: 0.38,
  },
  stack: {
    awarded: [],
    applied: [],
    lihtcSubmitted: false,
    lihtcAwarded: false,
  },
  entitlement: {
    currentStep: 1,
    pastChoices: [],
    alderGoodwill: 75,
    communitySupport: 50,
    projectShrinkBy: 0,
    conditionsImposed: [],
  },
  outcome: 'in-progress',
};

interface StoreActions {
  reset: () => void;
  advancePhase: () => void;
  selectNeighborhood: (id: NeighborhoodId) => void;
  setUnits: (n: number) => void;
  setBuildingType: (t: BuildingType) => void;
  setIntent: (i: Intent) => void;
  setAmiUnit: (ami: AmiBand, n: number) => void;
  setMarketUnits: (n: number) => void;
  setFinishLevel: (f: FinishLevel) => void;
  awardSource: (award: SourceAward) => void;
  removeSource: (sourceId: string) => void;
  submitLihtc: (awarded: boolean) => void;
  tickYear: () => void;
  takeEntitlementStep: (choice: StepChoiceKey, ctx?: { shrinkBy?: number }) => void;
  setOutcome: (o: GameState['outcome']) => void;
}

export const useGameStore = create<GameState & StoreActions>((set, get) => ({
  ...initialState,

  reset: () => set({ ...initialState }),

  advancePhase: () => {
    const next = Math.min(6, get().phase + 1) as Phase;
    set({ phase: next });
  },

  selectNeighborhood: (id) => set((s) => ({ project: { ...s.project, neighborhood: id } })),

  setUnits: (n) => set((s) => {
    // Rescale AMI breakdown proportionally if total is set
    const totalAffordable = Object.values(s.proForma.amiBreakdown).reduce((a, b) => a + b, 0);
    if (totalAffordable === 0) return { project: { ...s.project, units: n } };
    const ratio = n / totalAffordable;
    const newBreakdown = {
      30: Math.round(s.proForma.amiBreakdown[30] * ratio),
      50: Math.round(s.proForma.amiBreakdown[50] * ratio),
      60: Math.round(s.proForma.amiBreakdown[60] * ratio),
      80: Math.round(s.proForma.amiBreakdown[80] * ratio),
    };
    return {
      project: { ...s.project, units: n },
      proForma: { ...s.proForma, amiBreakdown: newBreakdown },
    };
  }),

  setBuildingType: (t) => set((s) => ({ project: { ...s.project, buildingType: t } })),
  setIntent: (i) => set((s) => ({ project: { ...s.project, intent: i } })),

  setAmiUnit: (ami, n) => set((s) => ({
    proForma: {
      ...s.proForma,
      amiBreakdown: { ...s.proForma.amiBreakdown, [ami]: n },
    },
  })),

  setMarketUnits: (n) => set((s) => ({ proForma: { ...s.proForma, marketUnits: n } })),
  setFinishLevel: (f) => set((s) => ({ proForma: { ...s.proForma, finishLevel: f } })),

  awardSource: (award) => set((s) => ({
    stack: { ...s.stack, awarded: [...s.stack.awarded, award] },
  })),

  removeSource: (sourceId) => set((s) => ({
    stack: { ...s.stack, awarded: s.stack.awarded.filter((a) => a.sourceId !== sourceId) },
  })),

  submitLihtc: (awarded) => set((s) => ({
    stack: { ...s.stack, lihtcSubmitted: true, lihtcAwarded: awarded },
  })),

  tickYear: () => set((s) => {
    if (!s.project.neighborhood) return {};
    const hardPerU = HARD_COST_PER_UNIT[s.project.buildingType] * FINISH_MULTIPLIER[s.proForma.finishLevel];
    const hard = hardPerU * s.project.units;
    const escalationThisYear = hard * COST_ESCALATION_PER_YEAR * (1 + SOFT_COST_RATIO + CONTINGENCY_RATIO);
    return {
      yearsElapsed: s.yearsElapsed + 1,
      costEscalation: s.costEscalation + escalationThisYear,
    };
  }),

  takeEntitlementStep: (choice, ctx = {}) => set((s) => {
    const consequence = applyChoice(choice, ctx);
    return {
      entitlement: {
        ...s.entitlement,
        currentStep: Math.min(4, (s.entitlement.currentStep + 1)) as EntitlementStep,
        pastChoices: [
          ...s.entitlement.pastChoices,
          {
            step: s.entitlement.currentStep,
            choice,
            alderDelta: consequence.alderDelta,
            communityDelta: consequence.communityDelta,
            shrinkBy: consequence.shrinkBy,
            tdcDelta: consequence.tdcDelta,
          },
        ],
        alderGoodwill: Math.max(0, Math.min(100, s.entitlement.alderGoodwill + consequence.alderDelta)),
        communitySupport: Math.max(0, Math.min(100, s.entitlement.communitySupport + consequence.communityDelta)),
        projectShrinkBy: s.entitlement.projectShrinkBy + consequence.shrinkBy,
      },
    };
  }),

  setOutcome: (o) => set({ outcome: o }),
}));
```

- [ ] **Step 4: Run tests, verify pass**

```bash
npm test -- state
```

Expected: all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: Zustand game store w/ phase, project, stack, entitlement actions"
```

---

## Phase 5 — Shared Components

### Task 15: Header (persistent deal-sheet strip)

**Files:**
- Create: `src/components/Header.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/Header.tsx
import { useGameStore } from '../game/state';
import { getNeighborhood } from '../data/neighborhoods';
import { computeTdc } from '../game/proForma';
import { totalCommitted } from '../game/capitalStack';

export function Header() {
  const phase = useGameStore((s) => s.phase);
  const project = useGameStore((s) => s.project);
  const proForma = useGameStore((s) => s.proForma);
  const stack = useGameStore((s) => s.stack);
  const yearsElapsed = useGameStore((s) => s.yearsElapsed);
  const costEscalation = useGameStore((s) => s.costEscalation);

  if (!project.neighborhood) return null;

  const n = getNeighborhood(project.neighborhood);
  const tdcParts = computeTdc({
    neighborhood: project.neighborhood,
    units: project.units,
    buildingType: project.buildingType,
    finishLevel: proForma.finishLevel,
  });
  const tdcWithEscalation = tdcParts.total + costEscalation;
  const committed = totalCommitted(stack.awarded);
  const gap = Math.max(0, tdcWithEscalation - committed);

  const phaseNames = ['', 'Intro', 'Site & Concept', 'Pro Forma', 'Capital Stack', 'Entitlement', 'Close'];

  return (
    <div className="bg-panel border border-line rounded-lg px-3 py-2 text-sm text-muted flex flex-wrap gap-3 items-center">
      <span>
        {n.emoji} <b className="text-ink">{n.name}</b> · {project.units} units · {project.intent === 'all-affordable' ? 'all-affordable' : 'mixed-income'}
      </span>
      <span>·</span>
      <span>
        TDC <b className="text-ink tabular">${(tdcWithEscalation / 1_000_000).toFixed(1)}M</b>
        {costEscalation > 0 && (
          <span className="text-caution"> (+${(costEscalation / 1_000_000).toFixed(1)}M esc)</span>
        )}
      </span>
      <span>·</span>
      <span>
        Gap <b className={gap > 0 ? 'text-gap tabular' : 'text-equity tabular'}>${(gap / 1_000_000).toFixed(1)}M</b>
      </span>
      <span className="ml-auto">
        Year <b className="text-ink tabular">{(yearsElapsed + phase * 0.2).toFixed(1)}</b> · Phase <b className="text-ink">{phase} / 6 — {phaseNames[phase]}</b>
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: Header (persistent deal-sheet strip)"
```

---

### Task 16: Meter component

**Files:**
- Create: `src/components/Meter.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/Meter.tsx
interface MeterProps {
  label: string;
  value: number; // 0-100
  color?: string;
  caption?: string;
}

export function Meter({ label, value, color = 'bg-equity', caption }: MeterProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="bg-panel border border-line rounded-lg p-3">
      <div className="text-xs uppercase tracking-wider text-accent">{label}</div>
      <div className="mt-2 bg-line h-2.5 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-muted mt-1">
        <span>0</span>
        <span className="font-bold">{Math.round(value)} / 100</span>
        <span>100</span>
      </div>
      {caption && <div className="mt-2 text-xs text-muted">{caption}</div>}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: Meter component"
```

---

### Task 17: StackBar component

**Files:**
- Create: `src/components/StackBar.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/StackBar.tsx
import { SourceAward } from '../game/types';
import { getSource } from '../data/sources';

interface StackBarProps {
  tdc: number;
  awarded: SourceAward[];
  bankLoan?: number;
}

const SOURCE_COLORS: Record<string, string> = {
  '9-lihtc': 'bg-equity',
  '4-lihtc-bonds': 'bg-equity',
  'doh-loan': 'bg-accent',
  'ihda-loan': 'bg-accent',
  'tif': 'bg-caution',
  'hed-bond': 'bg-caution',
  'cdbg': 'bg-debt',
  'home': 'bg-debt',
  'iahtc': 'bg-debt',
  'philanthropy': 'bg-debt',
  'bank-loan': 'bg-debt',
  'deferred-dev-fee': 'bg-muted',
};

export function StackBar({ tdc, awarded, bankLoan = 0 }: StackBarProps) {
  const totalAwarded = awarded.reduce((s, a) => s + a.amount, 0) + bankLoan;
  const gap = Math.max(0, tdc - totalAwarded);

  const items: { label: string; amount: number; color: string }[] = [
    ...awarded.map((a) => ({
      label: getSource(a.sourceId).name,
      amount: a.amount,
      color: SOURCE_COLORS[a.sourceId] ?? 'bg-muted',
    })),
  ];
  if (bankLoan > 0) {
    items.push({ label: 'Bank loan', amount: bankLoan, color: 'bg-debt' });
  }
  if (gap > 0) {
    items.push({ label: 'GAP', amount: gap, color: 'bg-gap' });
  }

  return (
    <div className="flex h-6 rounded overflow-hidden text-xs text-white font-bold">
      {items.map((it, i) => {
        const pct = (it.amount / tdc) * 100;
        if (pct < 0.5) return null;
        return (
          <div
            key={i}
            className={`${it.color} flex items-center justify-center px-1`}
            style={{ flexBasis: `${pct}%` }}
            title={`${it.label}: $${(it.amount / 1_000_000).toFixed(1)}M`}
          >
            {pct >= 8 && (it.label === 'GAP' ? 'GAP' : '')}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: StackBar component"
```

---

### Task 18: CharacterBubble component

**Files:**
- Create: `src/components/CharacterBubble.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/CharacterBubble.tsx
import { CharacterId, characters } from '../data/characters';

interface CharacterBubbleProps {
  characterId: CharacterId;
  line: string;
  whisper?: boolean;
}

export function CharacterBubble({ characterId, line, whisper = false }: CharacterBubbleProps) {
  const c = characters[characterId];
  return (
    <div className="bg-bg p-3 rounded-lg text-sm">
      <b>
        {c.emoji} {c.name}
        {whisper && <span className="text-muted font-normal"> (whisper)</span>}:
      </b>
      <br />
      <i className="text-muted">{line}</i>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: CharacterBubble component"
```

---

### Task 19: SourceCard component

**Files:**
- Create: `src/components/SourceCard.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/SourceCard.tsx
import { SourceProfile } from '../game/types';

type Status = 'available' | 'applied' | 'awarded' | 'locked' | 'secured';

interface SourceCardProps {
  source: SourceProfile;
  status: Status;
  awardedAmount?: number;
  complexityWarning?: boolean;
  onApply?: () => void;
}

const STATUS_STYLES: Record<Status, { badgeClass: string; cardClass: string; label: string }> = {
  available: { badgeClass: 'bg-caution', cardClass: 'border-line', label: 'AVAILABLE' },
  applied:   { badgeClass: 'bg-debt',    cardClass: 'border-debt', label: 'APPLIED' },
  awarded:   { badgeClass: 'bg-equity',  cardClass: 'border-equity', label: 'AWARDED' },
  locked:    { badgeClass: 'bg-muted',   cardClass: 'border-line opacity-50', label: 'LOCKED' },
  secured:   { badgeClass: 'bg-debt',    cardClass: 'border-debt', label: 'SECURED' },
};

export function SourceCard({ source, status, awardedAmount, complexityWarning, onApply }: SourceCardProps) {
  const s = STATUS_STYLES[status];
  return (
    <div className={`bg-panel border-2 ${s.cardClass} rounded-lg p-2 text-xs relative`}>
      <div className={`absolute top-1 right-1 ${s.badgeClass} text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold`}>
        {s.label}
      </div>
      <div className="text-base">{source.emoji} <b>{source.name}</b></div>
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
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: SourceCard component"
```

---

### Task 20: ChoiceCard component

**Files:**
- Create: `src/components/ChoiceCard.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/ChoiceCard.tsx
interface ChoiceCardProps {
  title: string;
  description: string;
  consequences: string;
  selected?: boolean;
  onClick: () => void;
}

export function ChoiceCard({ title, description, consequences, selected = false, onClick }: ChoiceCardProps) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-3 rounded-lg border-2 transition w-full ${
        selected ? 'bg-bg border-caution' : 'bg-panel border-line hover:border-accent'
      }`}
    >
      <div className="font-bold text-sm">{title}</div>
      <div className="text-muted text-xs mt-1">{description}</div>
      <div className="text-equity text-xs mt-2">{consequences}</div>
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: ChoiceCard component"
```

---

## Phase 6 — Screens

### Task 21: IntroScreen

**Files:**
- Create: `src/screens/IntroScreen.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/screens/IntroScreen.tsx
import { useGameStore } from '../game/state';

export function IntroScreen() {
  const advancePhase = useGameStore((s) => s.advancePhase);

  return (
    <div className="max-w-2xl mx-auto pt-16 pb-8">
      <p className="text-xs uppercase tracking-widest text-accent font-bold mb-2">A civic finance game</p>
      <h1 className="text-4xl mb-4">Welcome, developer.</h1>
      <p className="text-lg text-muted mb-6">
        You're going to build one affordable housing project in Chicago — from a vacant site,
        through the pro forma, the capital stack, the alder and the community, all the way
        to financial close.
      </p>
      <p className="text-base text-muted mb-8">
        Real projects take 2–4 years. This one will take you about 15 minutes. The numbers
        and the process steps are grounded in actual Chicago deals from 2023. The puzzle
        is real.
      </p>
      <button
        onClick={advancePhase}
        className="bg-accent text-white px-6 py-3 rounded-lg font-bold hover:opacity-90"
      >
        Start a project →
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: IntroScreen"
```

---

### Task 22: SiteAndConcept screen

**Files:**
- Create: `src/screens/SiteAndConcept.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/screens/SiteAndConcept.tsx
import { useGameStore } from '../game/state';
import { neighborhoods, getNeighborhood } from '../data/neighborhoods';
import { computeTdc } from '../game/proForma';
import { resolveEntitlementPath } from '../game/entitlement';
import { Header } from '../components/Header';
import { CharacterBubble } from '../components/CharacterBubble';
import { NeighborhoodId, BuildingType, Intent } from '../game/types';

export function SiteAndConcept() {
  const project = useGameStore((s) => s.project);
  const finishLevel = useGameStore((s) => s.proForma.finishLevel);
  const selectNeighborhood = useGameStore((s) => s.selectNeighborhood);
  const setUnits = useGameStore((s) => s.setUnits);
  const setBuildingType = useGameStore((s) => s.setBuildingType);
  const setIntent = useGameStore((s) => s.setIntent);
  const advancePhase = useGameStore((s) => s.advancePhase);

  const n = project.neighborhood ? getNeighborhood(project.neighborhood) : null;
  const tdcEstimate = project.neighborhood
    ? computeTdc({
        neighborhood: project.neighborhood,
        units: project.units,
        buildingType: project.buildingType,
        finishLevel,
      }).total
    : 0;
  const entitlementPath = resolveEntitlementPath({
    buildingType: project.buildingType,
    units: project.units,
  });

  const canAdvance = project.neighborhood && getNeighborhood(project.neighborhood).status === 'mvp';

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Header />
      <h2 className="text-2xl mt-6 mb-4">Site & Concept</h2>
      <div className="grid grid-cols-[1.2fr_1fr] gap-4">
        <div>
          {/* Neighborhood picker */}
          <div className="text-xs uppercase tracking-wider text-accent font-bold mb-2">1. Neighborhood</div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {neighborhoods.map((nb) => (
              <button
                key={nb.id}
                onClick={() => selectNeighborhood(nb.id as NeighborhoodId)}
                className={`text-left p-3 rounded-lg border-2 transition ${
                  project.neighborhood === nb.id ? 'bg-bg border-accent' : 'bg-panel border-line hover:border-accent'
                } ${nb.status === 'stub' ? 'opacity-60' : ''}`}
              >
                <div className="font-bold text-sm">{nb.emoji} {nb.name} {nb.status === 'stub' && <span className="text-xs text-caution">(v2)</span>}</div>
                <div className="text-xs text-muted mt-1">{nb.description}</div>
                <div className="text-xs text-muted mt-1 tabular">
                  Land ~${(nb.landCostPerUnit / 1000).toFixed(0)}k/u · Mkt ${nb.marketRentPerUnit.toLocaleString()}
                </div>
              </button>
            ))}
          </div>

          {/* Unit count */}
          <div className="text-xs uppercase tracking-wider text-accent font-bold mb-2">2. Unit count</div>
          <div className="mb-4">
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
          </div>

          {/* Building type */}
          <div className="text-xs uppercase tracking-wider text-accent font-bold mb-2">3. Building type</div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {(['walkup', 'midrise', 'larger'] as BuildingType[]).map((t) => (
              <button
                key={t}
                onClick={() => setBuildingType(t)}
                className={`p-2 text-xs rounded border-2 transition ${
                  project.buildingType === t ? 'bg-bg border-accent' : 'bg-panel border-line hover:border-accent'
                } ${t !== 'midrise' ? 'opacity-60' : ''}`}
              >
                {t === 'walkup' && <>🏠 Walk-up<br/><small>2-3 story (v2)</small></>}
                {t === 'midrise' && <>🏘️ Mid-rise<br/><small>4-5 story · MVP</small></>}
                {t === 'larger' && <>🏢 Larger<br/><small>6-8 story (v2)</small></>}
              </button>
            ))}
          </div>

          {/* Intent */}
          <div className="text-xs uppercase tracking-wider text-accent font-bold mb-2">4. Intent</div>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {(['all-affordable', 'mixed-income'] as Intent[]).map((i) => (
              <button
                key={i}
                onClick={() => setIntent(i)}
                className={`p-2 text-xs rounded border-2 transition ${
                  project.intent === i ? 'bg-bg border-accent' : 'bg-panel border-line hover:border-accent'
                } ${i === 'mixed-income' ? 'opacity-60' : ''}`}
              >
                {i === 'all-affordable' ? 'All-affordable (LIHTC) · MVP' : 'Mixed-income (v2)'}
              </button>
            ))}
          </div>

          <button
            onClick={advancePhase}
            disabled={!canAdvance}
            className="w-full bg-accent text-white py-3 rounded-lg font-bold disabled:opacity-40 hover:opacity-90"
          >
            Lock in & continue →
          </button>
        </div>

        {/* Live preview */}
        <div className="bg-panel border border-line rounded-lg p-4">
          <div className="text-xs uppercase tracking-wider text-accent font-bold mb-2">Live preview</div>
          {n ? (
            <>
              <h3 className="text-lg mt-2">{n.name} · {project.units} units · {project.buildingType}</h3>
              <ul className="text-sm space-y-1 mt-3 tabular">
                <li><b>Estimated TDC:</b> ~${(tdcEstimate / 1_000_000).toFixed(1)}M</li>
                <li><b>Per unit:</b> ~${(tdcEstimate / project.units / 1000).toFixed(0)}k/u</li>
                <li><b>Entitlement path:</b> {entitlementPath === 'pd' ? 'Planned Development' : entitlementPath === 'by-right' ? 'By-right' : 'Zoning Map Amendment'}</li>
                <li><b>Connected Communities Ordinance:</b> Eligible (TOD)</li>
              </ul>
              <div className="mt-4">
                <CharacterBubble characterId="asha" line={n.alderGreeting} />
              </div>
              {n.status === 'stub' && (
                <div className="mt-4 p-3 bg-bg border-l-2 border-caution rounded text-xs">
                  {n.name} is a v2 neighborhood. Pick Englewood for the full MVP experience.
                </div>
              )}
            </>
          ) : (
            <p className="text-muted text-sm">Pick a neighborhood to see the preview.</p>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: SiteAndConcept screen"
```

---

### Task 23: ProForma screen

**Files:**
- Create: `src/screens/ProForma.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/screens/ProForma.tsx
import { useGameStore } from '../game/state';
import { computeTdc, computeNoi, computeSupportableDebt, computeGap, weightedAvgAmi, isLihtcEligible } from '../game/proForma';
import { getNeighborhood } from '../data/neighborhoods';
import { rentAtAmi } from '../data/amiRents';
import { Header } from '../components/Header';
import { CharacterBubble } from '../components/CharacterBubble';
import { marcusLines } from '../data/characters';
import { AmiBand, FinishLevel } from '../game/types';

export function ProForma() {
  const project = useGameStore((s) => s.project);
  const proForma = useGameStore((s) => s.proForma);
  const costEscalation = useGameStore((s) => s.costEscalation);
  const setAmiUnit = useGameStore((s) => s.setAmiUnit);
  const setFinishLevel = useGameStore((s) => s.setFinishLevel);
  const advancePhase = useGameStore((s) => s.advancePhase);
  const tickYear = useGameStore((s) => s.tickYear);

  if (!project.neighborhood) return null;
  const n = getNeighborhood(project.neighborhood);

  const tdcParts = computeTdc({
    neighborhood: project.neighborhood,
    units: project.units,
    buildingType: project.buildingType,
    finishLevel: proForma.finishLevel,
  });
  const tdcTotal = tdcParts.total + costEscalation;
  const noi = computeNoi({
    amiBreakdown: proForma.amiBreakdown,
    marketUnits: proForma.marketUnits,
    marketRent: n.marketRentPerUnit,
    opexRatio: proForma.opexRatio,
    vacancyRatio: 0.07,
  });
  const stabilizedValue = noi / 0.06;
  const debt = computeSupportableDebt({
    noi,
    dscr: 1.20,
    annualRate: 0.065,
    amortYears: 30,
    ltv: 0.80,
    stabilizedValue,
  });
  const gap = computeGap({ tdc: tdcTotal, costEscalation: 0, supportableDebt: debt.amount });
  const avgAmi = weightedAvgAmi(proForma.amiBreakdown);
  const eligible = isLihtcEligible(proForma.amiBreakdown);

  const totalAffordable = Object.values(proForma.amiBreakdown).reduce((a, b) => a + b, 0);

  function onAdvance() {
    tickYear(); // year 1 ticks before we go to capital stack
    advancePhase();
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Header />
      <h2 className="text-2xl mt-6 mb-4">Pro Forma</h2>
      <div className="grid grid-cols-2 gap-4">
        {/* LEFT — levers */}
        <div className="space-y-3">
          <div className="bg-panel border border-line rounded-lg p-3">
            <div className="text-xs uppercase tracking-wider text-accent font-bold">Lever 1 — Finishings & design</div>
            <div className="flex gap-2 mt-2">
              {(['basic', 'standard', 'elevated'] as FinishLevel[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFinishLevel(f)}
                  className={`flex-1 py-2 text-xs rounded border-2 ${
                    proForma.finishLevel === f ? 'bg-accent text-white border-accent' : 'border-line hover:border-accent'
                  }`}
                >
                  {f === 'basic' && 'Basic (−10% hard)'}
                  {f === 'standard' && 'Standard'}
                  {f === 'elevated' && 'Elevated (+15%)'}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-panel border border-line rounded-lg p-3">
            <div className="text-xs uppercase tracking-wider text-accent font-bold">Lever 2 — Affordable AMI breakdown</div>
            <div className="text-xs text-muted mt-1">
              Total affordable: {totalAffordable} · target {project.units}
            </div>
            {[30, 50, 60, 80].map((ami) => {
              const a = ami as AmiBand;
              return (
                <div key={ami} className="mt-2">
                  <div className="flex justify-between text-xs">
                    <span><b>{ami}% AMI</b> · ${rentAtAmi(a)}/mo</span>
                    <span><b>{proForma.amiBreakdown[a]} units</b></span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={project.units}
                    value={proForma.amiBreakdown[a]}
                    onChange={(e) => setAmiUnit(a, parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              );
            })}
            <div className={`mt-3 p-2 rounded text-xs ${eligible ? 'bg-bg' : 'bg-gap text-white'}`}>
              Weighted avg: <b>{avgAmi.toFixed(0)}% AMI</b> · {eligible ? 'LIHTC-eligible ✓' : 'LIHTC ineligible — average exceeds 60%'}
            </div>
          </div>
        </div>

        {/* RIGHT — math */}
        <div className="space-y-3">
          <div className="bg-panel border border-line rounded-lg p-3">
            <div className="text-xs uppercase tracking-wider text-accent font-bold">TDC bottom-up</div>
            <div className="text-sm mt-2 space-y-1 tabular">
              <div className="flex justify-between"><span>Land · ${n.landCostPerUnit.toLocaleString()}/u</span><b>${(tdcParts.land / 1000).toFixed(0)}k</b></div>
              <div className="flex justify-between"><span>Hard construction</span><b>${(tdcParts.hard / 1_000_000).toFixed(1)}M</b></div>
              <div className="flex justify-between"><span>Soft (27%)</span><b>${(tdcParts.soft / 1_000_000).toFixed(1)}M</b></div>
              <div className="flex justify-between"><span>Contingency (5%)</span><b>${(tdcParts.contingency / 1_000_000).toFixed(1)}M</b></div>
              {costEscalation > 0 && (
                <div className="flex justify-between text-caution"><span>Cost escalation</span><b>+${(costEscalation / 1_000_000).toFixed(1)}M</b></div>
              )}
              <div className="flex justify-between border-t border-line pt-1"><span><b>Total</b></span><b>${(tdcTotal / 1_000_000).toFixed(1)}M</b></div>
            </div>
          </div>

          <div className="bg-panel border border-line rounded-lg p-3">
            <div className="text-xs uppercase tracking-wider text-accent font-bold">NOI & supportable debt</div>
            <div className="text-sm mt-2 space-y-1 tabular">
              <div className="flex justify-between"><span>NOI</span><b>${(noi / 1000).toFixed(0)}k</b></div>
              <div className="flex justify-between"><span>Stabilized value (NOI ÷ 6%)</span><b>${(stabilizedValue / 1_000_000).toFixed(1)}M</b></div>
              <div className="flex justify-between"><span>Supportable debt <span className="text-caution text-xs">({debt.binding}-limited)</span></span><b>${(debt.amount / 1_000_000).toFixed(1)}M</b></div>
            </div>
          </div>

          <div className="bg-gap text-white p-4 rounded-lg">
            <div className="text-xs uppercase tracking-wider opacity-80">Gap to close in the capital stack</div>
            <div className="text-3xl font-bold tabular">${(gap / 1_000_000).toFixed(1)}M</div>
            <div className="text-xs opacity-80 mt-1">{((gap / tdcTotal) * 100).toFixed(0)}% of TDC. Normal for affordable.</div>
          </div>

          <CharacterBubble characterId="marcus" line={debt.binding === 'DSCR' ? marcusLines.dscrLimited : marcusLines.ltvLimited} />

          <button
            onClick={onAdvance}
            disabled={!eligible || totalAffordable !== project.units}
            className="w-full bg-accent text-white py-3 rounded-lg font-bold disabled:opacity-40"
          >
            {totalAffordable !== project.units ? `Distribute all ${project.units} units` : 'On to the capital stack →'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: ProForma screen w/ 3 levers + live math"
```

---

### Task 24: CapitalStack screen

**Files:**
- Create: `src/screens/CapitalStack.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/screens/CapitalStack.tsx
import { useState } from 'react';
import { useGameStore } from '../game/state';
import { sources, getSource } from '../data/sources';
import { computeTdc, computeNoi, computeSupportableDebt, weightedAvgAmi } from '../game/proForma';
import { complexityPenalty, computeLihtcScore, estimatedAwardProbability, totalCommitted } from '../game/capitalStack';
import { getNeighborhood } from '../data/neighborhoods';
import { Header } from '../components/Header';
import { StackBar } from '../components/StackBar';
import { SourceCard } from '../components/SourceCard';
import { CharacterBubble } from '../components/CharacterBubble';
import { janelleLines } from '../data/characters';
import { SourceId, COMPLEXITY_PENALTY_THRESHOLD } from '../game/types';

export function CapitalStack() {
  const project = useGameStore((s) => s.project);
  const proForma = useGameStore((s) => s.proForma);
  const costEscalation = useGameStore((s) => s.costEscalation);
  const stack = useGameStore((s) => s.stack);
  const awardSource = useGameStore((s) => s.awardSource);
  const submitLihtc = useGameStore((s) => s.submitLihtc);
  const tickYear = useGameStore((s) => s.tickYear);
  const advancePhase = useGameStore((s) => s.advancePhase);
  const [showLihtcDecision, setShowLihtcDecision] = useState(true);

  if (!project.neighborhood) return null;
  const n = getNeighborhood(project.neighborhood);

  const tdcParts = computeTdc({
    neighborhood: project.neighborhood,
    units: project.units,
    buildingType: project.buildingType,
    finishLevel: proForma.finishLevel,
  });
  const tdcTotal = tdcParts.total + costEscalation;
  const noi = computeNoi({
    amiBreakdown: proForma.amiBreakdown,
    marketUnits: proForma.marketUnits,
    marketRent: n.marketRentPerUnit,
    opexRatio: proForma.opexRatio,
    vacancyRatio: 0.07,
  });
  const stabilizedValue = noi / 0.06;
  const debt = computeSupportableDebt({
    noi, dscr: 1.20, annualRate: 0.065, amortYears: 30, ltv: 0.80, stabilizedValue,
  });

  const committed = totalCommitted(stack.awarded) + debt.amount;
  // Source count for complexity penalty (exclude bank loan and core LIHTC + 4% LIHTC + deferred fee)
  const penaltyEligibleCount = stack.awarded.filter((a) => getSource(a.sourceId).usesComplexityPenalty).length;
  const penalty = complexityPenalty(penaltyEligibleCount, project.units);
  const gap = Math.max(0, tdcTotal + penalty - committed);

  // MVP simplification: CBO partner is assumed true (philanthropy or coalition meeting choice would set this in v2)
  const lihtcScore = computeLihtcScore({
    weightedAvgAmi: weightedAvgAmi(proForma.amiBreakdown),
    hasCboPartner: true,
    hasLeverageCommitments: stack.awarded.length >= 2,
    neighborhood: project.neighborhood,
  });
  const lihtcOdds = estimatedAwardProbability(lihtcScore);

  function onApply(sourceId: SourceId) {
    const src = getSource(sourceId);
    if (!src.amountRange) return;
    // For MVP: apply at midpoint of range
    const amount = (src.amountRange.min + src.amountRange.max) / 2;
    awardSource({ sourceId, amount, daysSpent: src.daysToProcess });
  }

  function onSubmitLihtc() {
    setShowLihtcDecision(false);
    // Random roll based on odds
    const win = Math.random() < lihtcOdds;
    if (win) {
      // Award 9% LIHTC at ~$22M (rough estimate based on eligible basis)
      const equity = Math.min(24_000_000, tdcParts.hard * 0.55);
      awardSource({ sourceId: '9-lihtc', amount: equity, daysSpent: 280 });
    }
    submitLihtc(win);
    tickYear(); // round + delay
  }

  function getSourceStatus(id: SourceId): 'available' | 'awarded' | 'locked' | 'secured' {
    if (id === 'bank-loan') return 'secured';
    if (stack.awarded.some((a) => a.sourceId === id)) return 'awarded';
    if (id === '4-lihtc-bonds' && stack.lihtcSubmitted) return 'locked';
    if (id === '9-lihtc' && stack.lihtcSubmitted && !stack.lihtcAwarded) return 'locked';
    return 'available';
  }

  function getAwardedAmount(id: SourceId): number | undefined {
    if (id === 'bank-loan') return debt.amount;
    return stack.awarded.find((a) => a.sourceId === id)?.amount;
  }

  const canAdvance = gap <= 100_000; // within $100k → counts as closed

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Header />
      <h2 className="text-2xl mt-6 mb-4">Capital Stack</h2>

      {/* Gap status */}
      <div className="bg-panel border border-line rounded-lg p-3 mb-3">
        <div className="flex justify-between items-baseline">
          <div>
            <span className="text-xs uppercase tracking-wider text-accent font-bold">Gap to close</span>
            {' '}<b className={`text-xl tabular ${gap > 0 ? 'text-gap' : 'text-equity'}`}>
              ${(gap / 1_000_000).toFixed(1)}M
            </b>
          </div>
          <div className="text-xs text-muted">
            {penaltyEligibleCount} of 5 free source slots used
            {penalty > 0 && <span className="text-caution"> · penalty +${(penalty / 1_000_000).toFixed(1)}M</span>}
          </div>
        </div>
        <div className="mt-2">
          <StackBar tdc={tdcTotal + penalty} awarded={stack.awarded} bankLoan={debt.amount} />
        </div>
      </div>

      {/* LIHTC decision card */}
      {showLihtcDecision && !stack.lihtcSubmitted && (
        <div className="bg-bg border-2 border-accent rounded-lg p-4 mb-3">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs uppercase tracking-wider text-accent font-bold">9% LIHTC — IHDA QAP scoring</div>
              <div className="text-sm mt-1">Score: <b>{lihtcScore} / 100</b> · Est. award probability: <b>{(lihtcOdds * 100).toFixed(0)}%</b></div>
              <div className="text-xs text-muted mt-1">
                {lihtcScore < 50 ? janelleLines.qapScoreLow : lihtcScore < 75 ? janelleLines.qapScoreMid : janelleLines.qapScoreHigh}
              </div>
            </div>
            <button onClick={onSubmitLihtc} className="bg-accent text-white px-4 py-2 rounded font-bold">
              Submit this round →
            </button>
          </div>
        </div>
      )}

      {!stack.lihtcAwarded && stack.lihtcSubmitted && (
        <div className="bg-gap text-white rounded-lg p-3 mb-3 text-sm">
          <b>9% LIHTC denied this round.</b> +12 months while you wait for the next round. Cost escalation has accrued.
        </div>
      )}

      {/* Source grid */}
      <div className="text-xs uppercase tracking-wider text-accent font-bold mb-2">Funding sources</div>
      <div className="grid grid-cols-4 gap-2 mb-4">
        {sources.map((src) => {
          const status = getSourceStatus(src.id);
          const amt = getAwardedAmount(src.id);
          const complexityWarning =
            src.usesComplexityPenalty && status === 'available' && penaltyEligibleCount >= COMPLEXITY_PENALTY_THRESHOLD;
          return (
            <SourceCard
              key={src.id}
              source={src}
              status={status}
              awardedAmount={amt}
              complexityWarning={complexityWarning}
              onApply={() => onApply(src.id)}
            />
          );
        })}
      </div>

      {penaltyEligibleCount >= COMPLEXITY_PENALTY_THRESHOLD && (
        <CharacterBubble characterId="janelle" line={janelleLines.fiveSources} />
      )}

      <button
        onClick={advancePhase}
        disabled={!canAdvance}
        className="w-full mt-4 bg-accent text-white py-3 rounded-lg font-bold disabled:opacity-40"
      >
        {canAdvance ? 'Stack closed — on to entitlement →' : `Close the remaining $${(gap / 1_000_000).toFixed(1)}M gap to advance`}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: CapitalStack screen w/ LIHTC scoring + complexity penalty"
```

---

### Task 25: Entitlement screen

**Files:**
- Create: `src/screens/Entitlement.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/screens/Entitlement.tsx
import { useGameStore } from '../game/state';
import { resolveEntitlementPath } from '../game/entitlement';
import { getNeighborhood } from '../data/neighborhoods';
import { Header } from '../components/Header';
import { Meter } from '../components/Meter';
import { ChoiceCard } from '../components/ChoiceCard';
import { CharacterBubble } from '../components/CharacterBubble';
import { ashaLines, financeAttackLines } from '../data/characters';
import { StepChoiceKey } from '../game/types';

const STEP_NAMES = ['', 'Pre-app intake', 'Community meeting', 'Committee on Zoning', 'Committee on Finance'];

const STEP_CHOICES: Record<number, { key: StepChoiceKey; title: string; description: string; consequences: string }[]> = {
  1: [
    { key: 'preapp-quiet', title: 'Quiet alder meeting', description: 'Just you and Asha. Low-key, no public attention yet.', consequences: '+2 alder · ±0 community' },
    { key: 'preapp-formal-cbo', title: 'Formal w/ CBO partner', description: 'Bring a community development partner to the first conversation.', consequences: '+5 alder · +6 community' },
    { key: 'preapp-public', title: 'Public pre-launch w/ press', description: 'Announce intentions broadly. Bold; reads as committed.', consequences: '−3 alder · +4 community' },
  ],
  2: [
    { key: 'community-data', title: 'Data-led', description: 'Lead with rent, jobs, taxes. Facts, charts, evidence.', consequences: '+3 alder · +4 community' },
    { key: 'community-story', title: 'Story-led', description: 'Resident testimonials. Make it about people, not numbers.', consequences: '−2 alder · +12 community' },
    { key: 'community-coalition', title: 'Coalition-led', description: 'Clergy, CBO, advocates speak first. Show breadth of support.', consequences: '+4 alder · +10 community' },
  ],
  3: [
    { key: 'zoning-hold', title: 'Hold the line', description: 'Keep current size. Make the case at Committee.', consequences: '−14 alder · −4 community · vote risk' },
    { key: 'zoning-shrink', title: 'Shrink the project (−12 units)', description: 'Concede unit count. Defuse NIMBY testimony.', consequences: '−6 alder · +15 community · TDC ↓ · impact ↓' },
    { key: 'zoning-accept', title: 'Accept conditions', description: 'Take Committee\'s height cap & unit-mix conditions.', consequences: '−8 alder · ±0 community · TDC +$1.4M' },
  ],
  4: [
    { key: 'finance-reframe', title: 'Reframe the cost', description: 'Make the per-unit-of-impact case. Make Powell own his comparison.', consequences: '−2 alder · ±0 community' },
    { key: 'finance-concede', title: 'Concede TIF/HED reduction', description: 'Reduce ask to defuse Reyes. Reopens gap.', consequences: '+5 alder · gap reopens' },
    { key: 'finance-stakeholders', title: 'Bring stakeholders', description: 'Coalition testimony. Powerful but spends community support.', consequences: '±0 alder · −15 community' },
  ],
};

export function Entitlement() {
  const project = useGameStore((s) => s.project);
  const stack = useGameStore((s) => s.stack);
  const entitlement = useGameStore((s) => s.entitlement);
  const takeStep = useGameStore((s) => s.takeEntitlementStep);
  const tickYear = useGameStore((s) => s.tickYear);
  const advancePhase = useGameStore((s) => s.advancePhase);
  const setOutcome = useGameStore((s) => s.setOutcome);

  if (!project.neighborhood) return null;
  const n = getNeighborhood(project.neighborhood);
  const path = resolveEntitlementPath({ buildingType: project.buildingType, units: project.units });

  const currentStep = entitlement.currentStep;
  const allStepsComplete = entitlement.pastChoices.length >= 4;

  function onChoose(choice: StepChoiceKey) {
    takeStep(choice);
    tickYear();
  }

  function onComplete() {
    // Check final state
    if (entitlement.alderGoodwill < 20) {
      setOutcome('shelved-alder');
    } else if (entitlement.communitySupport < 25) {
      setOutcome('shelved-community');
    } else {
      setOutcome('closed');
    }
    advancePhase();
  }

  const hasTif = stack.awarded.some((a) => a.sourceId === 'tif');
  const hasHedBond = stack.awarded.some((a) => a.sourceId === 'hed-bond');

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Header />
      <h2 className="text-2xl mt-6 mb-4">Entitlement</h2>

      {/* Path */}
      <div className="bg-panel border border-line rounded-lg p-3 mb-3 text-xs">
        <b>Path:</b> {path === 'pd' ? 'Planned Development' : 'Zoning Map Amendment'} ·{' '}
        Pre-app → Community → Committee on Zoning → Committee on Finance → Council (narrative)
      </div>

      {/* Meters */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Meter
          label={`🧑‍💼 Ald. ${n.alderName}'s goodwill`}
          value={entitlement.alderGoodwill}
          color="bg-equity"
        />
        <Meter
          label="👥 Community support"
          value={entitlement.communitySupport}
          color={entitlement.communitySupport >= 50 ? 'bg-equity' : 'bg-caution'}
        />
      </div>

      {/* Past steps */}
      {entitlement.pastChoices.length > 0 && (
        <div className="bg-panel border border-line rounded-lg p-3 mb-3">
          <div className="text-xs uppercase tracking-wider text-accent font-bold mb-2">Steps taken</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {entitlement.pastChoices.map((c, i) => (
              <div key={i} className="bg-bg p-2 rounded">
                <b>{i + 1}. {STEP_NAMES[c.step]}</b><br/>
                <span className="text-muted">{c.choice}</span><br/>
                <span className="text-equity">α{c.alderDelta >= 0 ? '+' : ''}{c.alderDelta} · c{c.communityDelta >= 0 ? '+' : ''}{c.communityDelta}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active step */}
      {!allStepsComplete && (
        <div className="bg-bg border-2 border-caution rounded-lg p-4 mb-3">
          <div className="text-xs uppercase tracking-wider text-caution font-bold">
            ▶ Step {currentStep} — {STEP_NAMES[currentStep]}
          </div>

          {/* Finance committee — show attacks */}
          {currentStep === 4 && (
            <div className="grid grid-cols-3 gap-2 my-3">
              <div className="bg-panel border-l-2 border-gap p-2 text-xs">
                <b>Ald. Powell:</b> "{financeAttackLines.tooExpensive(800_000)}"
              </div>
              {hasTif && (
                <div className="bg-panel border-l-2 border-gap p-2 text-xs">
                  <b>Ald. Reyes:</b> "{financeAttackLines.tifCorrupt}"
                </div>
              )}
              {hasHedBond && (
                <div className="bg-panel border-l-2 border-gap p-2 text-xs">
                  <b>Ald. Chen:</b> "{financeAttackLines.hedWardJealousy}"
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 mt-3">
            {STEP_CHOICES[currentStep].map((c) => (
              <ChoiceCard
                key={c.key}
                title={c.title}
                description={c.description}
                consequences={c.consequences}
                onClick={() => onChoose(c.key)}
              />
            ))}
          </div>

          <div className="mt-3">
            <CharacterBubble
              characterId="asha"
              line={
                currentStep === 1 ? 'Ready when you are. How do you want to start this?' :
                currentStep === 2 ? 'The room will be skeptical. How are we going to lead this meeting?' :
                currentStep === 3 ? 'Block club has been organizing. They\'ll be there. Pick your stance.' :
                currentStep === 4 ? ashaLines.financeReframe :
                ''
              }
              whisper={currentStep === 4}
            />
          </div>
        </div>
      )}

      {allStepsComplete && (
        <div className="bg-bg p-4 rounded-lg text-sm">
          <b>Council vote (narrative):</b><br/>
          <i className="text-muted">On a Wednesday in March, the City Council passed the ordinance 41–9. Asha posted on Instagram from the floor.</i>
          <button
            onClick={onComplete}
            className="block w-full mt-4 bg-accent text-white py-3 rounded-lg font-bold"
          >
            See your result →
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: Entitlement screen w/ 4 steps + meters + Council narrative"
```

---

### Task 26: Close screen

**Files:**
- Create: `src/screens/Close.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/screens/Close.tsx
import { useGameStore } from '../game/state';
import { computeTdc, weightedAvgAmi } from '../game/proForma';
import { totalCommitted } from '../game/capitalStack';
import { computeImpactScore } from '../game/scoring';
import { getNeighborhood } from '../data/neighborhoods';
import { StackBar } from '../components/StackBar';
import { AmiBand } from '../game/types';

export function Close() {
  const project = useGameStore((s) => s.project);
  const proForma = useGameStore((s) => s.proForma);
  const stack = useGameStore((s) => s.stack);
  const entitlement = useGameStore((s) => s.entitlement);
  const outcome = useGameStore((s) => s.outcome);
  const yearsElapsed = useGameStore((s) => s.yearsElapsed);
  const costEscalation = useGameStore((s) => s.costEscalation);
  const reset = useGameStore((s) => s.reset);

  if (!project.neighborhood) return null;
  const n = getNeighborhood(project.neighborhood);
  const closed = outcome === 'closed';
  const finalUnits = Math.max(0, project.units - entitlement.projectShrinkBy);

  const tdcParts = computeTdc({
    neighborhood: project.neighborhood,
    units: finalUnits,
    buildingType: project.buildingType,
    finishLevel: proForma.finishLevel,
  });
  const tdcTotal = tdcParts.total + costEscalation;

  const score = computeImpactScore({
    closed,
    amiBreakdown: proForma.amiBreakdown,
  });

  const failureMessage =
    outcome === 'shelved-stack' ? 'The stack never closed. Cost escalation pushed the gap past what could be filled, and the project was shelved.' :
    outcome === 'shelved-finance' ? 'Committee on Finance failed. Reyes and Powell teamed up; Asha couldn\'t hold the room. The coalition broke and the project was tabled.' :
    outcome === 'shelved-alder' ? 'Asha quietly told you she couldn\'t push it forward. The site was eventually sold to a market-rate developer.' :
    outcome === 'shelved-community' ? 'The community engagement collapsed at the meeting. The alder withdrew support and the project died.' :
    '';

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-panel border border-line rounded-xl p-4 mb-4 text-center">
        <div className="text-4xl">{closed ? '🎉' : '🛑'}</div>
        <h2 className="text-2xl mt-2 mb-1">{closed ? 'You closed.' : 'The project was shelved.'}</h2>
        <p className="text-muted">
          {closed
            ? `${n.name} ${project.buildingType} broke ground in Year ${yearsElapsed.toFixed(0)}. ${finalUnits} homes on the way.`
            : failureMessage}
        </p>
        {closed && (
          <div className="mt-3 inline-block bg-bg text-accent px-4 py-2 rounded-full font-bold">
            Impact score: <b className="text-xl tabular">{score}</b>
          </div>
        )}
      </div>

      {closed && (
        <div className="bg-panel border-2 border-accent rounded-xl p-4 mb-4">
          <div className="text-xs uppercase tracking-wider text-accent font-bold">Your project · shareable</div>
          <h3 className="text-xl mt-1">{n.emoji} The {n.name} {project.buildingType}</h3>

          <div className="grid grid-cols-4 gap-2 mt-3 text-center">
            <div><div className="text-xs uppercase text-muted">Units</div><div className="text-xl font-bold tabular">{finalUnits}</div></div>
            <div><div className="text-xs uppercase text-muted">Wtd avg AMI</div><div className="text-xl font-bold tabular">{Math.round(weightedAvgAmi(proForma.amiBreakdown))}%</div></div>
            <div><div className="text-xs uppercase text-muted">Final TDC</div><div className="text-xl font-bold tabular">${(tdcTotal / 1_000_000).toFixed(1)}M</div></div>
            <div><div className="text-xs uppercase text-muted">Per unit</div><div className="text-xl font-bold tabular">${(tdcTotal / finalUnits / 1000).toFixed(0)}k</div></div>
          </div>

          <div className="text-xs uppercase tracking-wider text-accent font-bold mt-4 mb-1">Affordability</div>
          <div className="flex h-5 rounded overflow-hidden text-xs text-white font-bold">
            {([30, 50, 60, 80] as AmiBand[]).map((ami) => {
              const n = proForma.amiBreakdown[ami];
              const pct = (n / finalUnits) * 100;
              if (pct < 0.5) return null;
              const color = ami === 30 ? 'bg-gap' : ami === 50 ? 'bg-caution' : ami === 60 ? 'bg-accent' : 'bg-debt';
              return (
                <div key={ami} className={`${color} flex items-center justify-center`} style={{ flexBasis: `${pct}%` }}>
                  {pct >= 10 && `${n}@${ami}%`}
                </div>
              );
            })}
          </div>

          <div className="text-xs uppercase tracking-wider text-accent font-bold mt-4 mb-1">Capital stack</div>
          <StackBar tdc={tdcTotal} awarded={stack.awarded} bankLoan={0} />

          <div className="text-xs uppercase tracking-wider text-accent font-bold mt-4 mb-1">Journey</div>
          <ul className="list-disc pl-5 text-sm space-y-1 text-muted">
            <li>Year 1 — Site & Pro Forma. {n.name} at {project.units} units, {proForma.finishLevel} finish.</li>
            <li>Year {Math.max(1, yearsElapsed - 2).toFixed(0)} — 9% LIHTC {stack.lihtcAwarded ? 'awarded' : 'denied'}.</li>
            <li>Year {Math.max(2, yearsElapsed - 1).toFixed(0)} — Community engagement, alder relationship, financing assembled.</li>
            <li>Year {yearsElapsed.toFixed(0)} — Closed at {totalCommitted(stack.awarded).toLocaleString()} stack composition.</li>
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button onClick={reset} className="bg-accent text-white py-3 rounded-lg font-bold">
          ↻ Try a different choice
        </button>
        <a
          href="https://housing.thewychefamily.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-panel border border-line py-3 rounded-lg font-bold text-center hover:border-accent"
        >
          📖 Read about Chicago housing
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: Close screen w/ result card + restart"
```

---

### Task 27: App phase router

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/App.tsx
import { useGameStore } from './game/state';
import { IntroScreen } from './screens/IntroScreen';
import { SiteAndConcept } from './screens/SiteAndConcept';
import { ProForma } from './screens/ProForma';
import { CapitalStack } from './screens/CapitalStack';
import { Entitlement } from './screens/Entitlement';
import { Close } from './screens/Close';

export default function App() {
  const phase = useGameStore((s) => s.phase);

  return (
    <div className="min-h-screen bg-bg text-ink">
      {phase === 1 && <IntroScreen />}
      {phase === 2 && <SiteAndConcept />}
      {phase === 3 && <ProForma />}
      {phase === 4 && <CapitalStack />}
      {phase === 5 && <Entitlement />}
      {phase === 6 && <Close />}
    </div>
  );
}
```

- [ ] **Step 2: Run full app**

```bash
npm run dev
```

Visit `http://localhost:5173`. Expected: lands on IntroScreen. Click "Start a project" → SiteAndConcept loads. Pick Englewood → "Lock in & continue" enables → click it → ProForma loads. Continue through. Should be able to reach Close.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: App phase router connects all 6 screens"
```

---

## Phase 7 — Polish & Deploy

### Task 28: Analytics integration (Plausible)

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add Plausible script to index.html**

In `index.html`, in the `<head>`:

```html
<script defer data-domain="REPLACE-AT-DEPLOY-TIME.pages.dev" src="https://plausible.io/js/script.js"></script>
```

This is a no-op until the domain is set; safe to ship with placeholder for now.

- [ ] **Step 2: Add event tracking on key actions**

Create `src/game/analytics.ts`:

```ts
// src/game/analytics.ts
type PlausibleFn = (event: string, options?: { props?: Record<string, string | number> }) => void;

declare global {
  interface Window {
    plausible?: PlausibleFn;
  }
}

export function track(event: string, props?: Record<string, string | number>) {
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible(event, props ? { props } : undefined);
  }
}
```

Wire `track('phase_advanced', { to: phase })` into `advancePhase` in `state.ts`:

In `src/game/state.ts`, modify `advancePhase`:

```ts
advancePhase: () => {
  const next = Math.min(6, get().phase + 1) as Phase;
  set({ phase: next });
  // Track (no-op until Plausible script loads)
  if (typeof window !== 'undefined' && (window as any).plausible) {
    (window as any).plausible('phase_advanced', { props: { to: next } });
  }
},
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: Plausible analytics scaffolding"
```

---

### Task 29: Build & verify

**Files:** none

- [ ] **Step 1: Production build**

```bash
npm run build
```

Expected: TypeScript compiles clean. Vite outputs to `dist/`. Final size ideally <250KB gzip.

- [ ] **Step 2: Preview production build**

```bash
npm run preview
```

Visit the URL shown. Run a full playthrough:
1. Intro → click Start
2. Pick Englewood, leave defaults → click Lock in
3. Pro Forma → tune finish level, distribute AMI → click On to capital stack
4. Capital Stack → submit LIHTC (may take 1-2 tries), apply other sources until gap is closed → click Stack closed
5. Entitlement → choose at each of 4 steps → click See your result
6. Close screen → see result card → click Try a different choice → confirm reset

Expected: full game playable end-to-end. No console errors. Math feels right.

- [ ] **Step 3: Run full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit any fixes**

```bash
git add .
git commit -m "fix: any issues found during full-build verification"
```

If no changes needed, skip the commit.

---

### Task 30: Cloudflare Pages deploy config

**Files:**
- Create: `wrangler.toml` (optional, for Wrangler CLI deploys)
- Create: `README.md` (deploy instructions)

- [ ] **Step 1: Write minimal README**

Create `README.md`:

```markdown
# Chicago Affordable Housing Developer (Game)

An educational browser game: work one affordable housing project in Chicago from concept to close. ~15-20 min play. React 19 + Vite + TypeScript + Tailwind v4 + Zustand.

See `docs/superpowers/specs/2026-06-02-chicago-affordable-housing-developer-game-design.md` for the design.

## Local dev

```bash
export PATH="/c/Users/bpi/tools/node-v22.14.0-win-x64:$PATH"
npm install
npm run dev    # http://localhost:5173
npm test       # vitest
npm run build  # production build to dist/
```

## Deploy (Cloudflare Pages)

1. Push to a GitHub repo
2. In Cloudflare dashboard → Pages → Create project → Connect to GitHub
3. Build command: `npm run build`
4. Build output: `dist`
5. Environment: Node 20
6. Deploy

After first deploy, update the `data-domain` attribute on the Plausible script in `index.html` to the deployed Pages URL.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: README with local dev + Cloudflare Pages deploy instructions"
```

---

## Self-Review Notes

**Spec coverage check:**
- ✓ 6-screen flow (Tasks 21-27)
- ✓ Persistent strip (Task 15)
- ✓ 4 neighborhoods w/ Englewood MVP (Task 7)
- ✓ 12 funding sources (Task 8)
- ✓ Pro forma math (Task 10) + bottom-up TDC + Wyche-style debt sizing
- ✓ Capital stack complexity penalty + LIHTC scoring (Task 11)
- ✓ 4-step Entitlement (Task 12 logic, Task 25 UI)
- ✓ Impact scoring (Task 13)
- ✓ Cost escalation (Task 14 `tickYear` action)
- ✓ Characters (Marcus, Asha minimum; others present in data)
- ✓ Visual palette (Task 2)
- ✓ Analytics scaffold (Task 28)

**Deferred to stretch (per spec MVP section, not in this plan):**
- 3 v2 neighborhoods (data is there, screens show stub)
- Walk-up + larger building types (data is there, but no specific event flows)
- Mixed-income mode (toggle present but locked out in MVP)
- PNG result card download
- localStorage save/resume
- Spanish toggle
- In-context jargon explainers

**Tunable for playtest:**
- LIHTC QAP scoring weights
- Entitlement failure thresholds (alder < 20, community < 25)
- Choice consequence deltas in `entitlement.ts applyChoice()`
- Cost escalation rate (currently 5%/yr)
- Impact score multipliers
